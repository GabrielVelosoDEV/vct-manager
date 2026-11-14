#!/usr/bin/env node
/* Etapa 6: o painel de ajuste. Roda muitas partidas sem tela (2 em paralelo)
   e compara com o que se vê no VCT:
     ataque por mapa (MAPA_ATK real) · rounds com plant · ataque vence o pós-
     plant · duração do round · HS% · quem faz o first blood ganha o round ·
     eco contra compra cheia · habilidades por round e cargas paradas ·
     e, com elencos, o time mais forte ganhando mais sem ganhar sempre.
   Uso: node tools/ajuste.mjs [partidas por mapa] [nivel|reais] [mapas…] */
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import os from 'node:os';
import vm from 'node:vm';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const carregar = () => {
  const html = readFileSync(resolve(raiz, 'gameplay.html'), 'utf8');
  const arqs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/render|jogo|temas|imagens/.test(f));
  /* no contexto principal: é 2,5× mais rápido que num vm.createContext */
  vm.runInThisContext(arqs.map(f => readFileSync(resolve(raiz, f), 'utf8')).join('\n') + ';globalThis.GP=GP;globalThis.MAPAS_GP=MAPAS_GAMEPLAY;', {filename: 'gameplay.js'});
  return globalThis.GP;
};
const NIVEL = {mira: 62, reflexo: 62, movimento: 60, visao: 60, clutch: 55, consistencia: 55, utilidade: 60, lider: 60};

/* ---------- uma partida, medida ---------- */
function medir(GP, tarefa) {
  const o = {mapa: tarefa.mapa, semente: tarefa.semente, tempoCompra: 1, jogador: false};
  if (tarefa.timeA) { o.timeA = GP.timeReal(tarefa.timeA); o.timeB = GP.timeReal(tarefa.timeB); } else { o.atribA = NIVEL; o.atribB = NIVEL; }
  const J = GP.montarPartida(o);
  const m = {rounds: 0, atk: 0, plant: 0, ppAtk: 0, desarme: 0, explosao: 0, dur: 0, fbRounds: 0, fbConv: 0, ecoJogos: 0, ecoVit: 0, hab: 0, cab: 0, acertos: 0, cargasParadas: 0};
  let ev = 0, fb = null, ultimo = 0;
  const t0 = Date.now();
  while (!J.fim && J.t < 4 * 3600) {
    GP.passo(J, 1 / 60);
    for (; ev < J.eventos.length; ev++) {
      const x = J.eventos[ev];
      if (x.tipo === 'morte' && !fb && x.de) { const de = J.ents.find(e => e.id === x.de); fb = de && de.time; }
      if (x.tipo === 'habilidade') { const e = J.ents.find(o => o.id === x.dono); if (e && e.bot) m.hab++; }
    }
    if (J.historico.length > ultimo) {
      const h = J.historico[ultimo++];
      m.rounds++; if (h.vencedor === h.atk) m.atk++; m.dur += h.duracao;
      if (h.plant) { m.plant++; if (h.vencedor === h.atk) m.ppAtk++; }
      if (h.como === 'desarme') m.desarme++; if (h.como === 'explosão') m.explosao++;
      if (fb) { m.fbRounds++; if (h.vencedor === fb) m.fbConv++; }
      fb = null;
      for (const [a, b] of [['A', 'B'], ['B', 'A']]) if (h.compra[a] === 'eco' && h.compra[b] === 'cheia') { m.ecoJogos++; if (h.vencedor === a) m.ecoVit++; }
    }
  }
  for (const e of J.ents) { m.cab += e.st.cabecas; m.acertos += e.st.acertos; if (e.cargas) m.cargasParadas += ['c', 'q', 'e'].reduce((s, k) => s + (e.cargas[k] || 0), 0); }
  const r = GP.resultadoPartida(J);
  const media = s => s ? GP.timeReal(s).jogadores.reduce((a, j) => a + j.over, 0) / 5 : 0;
  return {...m, mapa: tarefa.mapa, placar: r.placar, vencedor: r.vencedor, overA: media(tarefa.timeA), overB: media(tarefa.timeB),
    acs: r.jogadores.map(j => j.acs), kd: r.jogadores.map(j => j.kd), ms: Date.now() - t0, terminou: !!J.fim};
}

if (!isMainThread) {
  const GP = carregar();
  parentPort.on('message', t => { if (!t) process.exit(0); parentPort.postMessage(medir(GP, t)); });
} else {
  const GP = carregar();
  const n = +(process.argv[2] || 2), modo = process.argv[3] || 'nivel';
  const mapas = process.argv.slice(4).length ? process.argv.slice(4) : Object.keys(globalThis.MAPAS_GP);
  const t1 = GP.timesReais().filter(t => t.tier === 't1').map(t => t.sigla);
  const tarefas = [];
  let s = 1;
  for (const mapa of mapas) for (let i = 0; i < n; i++) {
    const t = {mapa, semente: 1000 + s++ * 37};
    if (modo === 'reais') { const a = t1[(s * 7) % t1.length]; let b = t1[(s * 13 + 5) % t1.length]; if (b === a) b = t1[(s * 13 + 6) % t1.length]; t.timeA = a; t.timeB = b; }
    tarefas.push(t);
  }
  const res = [], nW = Math.min(os.cpus().length, tarefas.length) || 1;
  const t0 = Date.now();
  await new Promise(fim => {
    let prox = 0, vivos = nW;
    for (let w = 0; w < nW; w++) {
      const wk = new Worker(fileURLToPath(import.meta.url));
      const manda = () => { if (prox < tarefas.length) wk.postMessage(tarefas[prox++]); else { wk.postMessage(null); if (--vivos === 0) fim(); } };
      wk.on('message', r => { res.push(r);  manda(); });
      wk.on('error', e => { console.error(e); process.exit(1); });
      manda();
    }
  });
  process.stderr.write('\n');
  const soma = (k, lista = res) => lista.reduce((a, r) => a + r[k], 0);
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const R = soma('rounds');
  const linhas = [];
  const alvo = (nome, valor, ref, ok) => linhas.push(`${ok ? '  ' : '✗ '}${nome.padEnd(34)} ${String(valor).padStart(7)}   alvo ${ref}`);
  console.log(`\n${res.length} partidas · ${R} rounds · ${modo === 'reais' ? 'elencos reais do Tier 1' : 'bots de nível igual'} · ${((Date.now() - t0) / 1000).toFixed(0)} s (média ${(soma('ms') / res.length / 1000).toFixed(1)} s por partida)\n`);
  console.log('ataque por mapa (real · simulado):');
  const MAPA_ID = {ascent: 'Ascent', bind: 'Bind', haven: 'Haven', split: 'Split', lotus: 'Lotus', sunset: 'Sunset', summit: 'Summit', icebox: 'Icebox', breeze: 'Breeze', fracture: 'Fracture', pearl: 'Pearl', abyss: 'Abyss', corrode: 'Corrode'};
  let erroMapa = 0;
  for (const mp of mapas) {
    const l = res.filter(r => r.mapa === mp), real = (typeof MAPA_ATK !== 'undefined' && MAPA_ATK[MAPA_ID[mp]]) || 50, sim = pct(soma('atk', l), soma('rounds', l));
    erroMapa += Math.abs(sim - real);
    console.log(`  ${mp.padEnd(9)} ${real}% · ${sim}%  (${soma('rounds', l)} rounds)`);
  }
  console.log('');
  const atk = pct(soma('atk'), R);
  alvo('ataque vence (geral)', atk + '%', '49–53%', atk >= 47 && atk <= 55);
  alvo('erro médio por mapa', (erroMapa / mapas.length).toFixed(1) + ' pp', '< 6 pp (amostra pequena pesa)', erroMapa / mapas.length < 6);
  const pl = pct(soma('plant'), R); alvo('rounds com plant', pl + '%', '55–68%', pl >= 55 && pl <= 68);
  const pp = pct(soma('ppAtk'), soma('plant')); alvo('ataque vence depois de plantar', pp + '%', '65–75%', pp >= 65 && pp <= 75);
  const ex = pct(soma('explosao'), R), de = pct(soma('desarme'), R);
  alvo('explosão / desarme (rounds)', `${ex}% / ${de}%`, 'explosão > desarme', ex > de);
  const dur = Math.round(soma('dur') / R); alvo('duração média do round (ativo)', dur + ' s', '60–85 s', dur >= 60 && dur <= 85);
  const hs = pct(soma('cab'), soma('acertos')); alvo('HS% (todos os acertos)', hs + '%', '20–30%', hs >= 20 && hs <= 30);
  const fbc = pct(soma('fbConv'), soma('fbRounds')); alvo('first blood vira round', fbc + '%', '66–76%', fbc >= 66 && fbc <= 76);
  const eco = pct(soma('ecoVit'), soma('ecoJogos')); alvo('eco vence compra cheia', `${eco}% (${soma('ecoJogos')})`, '8–20%', eco >= 8 && eco <= 20);
  const hab = (soma('hab') / R / 2).toFixed(1); alvo('habilidades por time por round', hab, '3–6', hab >= 3 && hab <= 6);
  const par = (soma('cargasParadas') / res.length / 10).toFixed(1); alvo('cargas paradas por jogador no fim', par, '< 2,5', par < 2.5);
  const acs = res.flatMap(r => r.acs), med = acs.reduce((a, b) => a + b, 0) / acs.length, dp = Math.sqrt(acs.reduce((a, b) => a + (b - med) ** 2, 0) / acs.length);
  alvo('ACS médio (desvio)', `${Math.round(med)} (${Math.round(dp)})`, '~200 (50–70)', med > 170 && med < 230 && dp > 40);
  if (modo === 'reais') {
    const pares = res.filter(r => r.overA && r.overB && Math.abs(r.overA - r.overB) >= 2);
    const forte = pares.filter(r => (r.overA > r.overB) === (r.vencedor === 'A')).length;
    alvo('time de over maior vence o mapa', `${pct(forte, pares.length)}% (${pares.length})`, '58–75%', pct(forte, pares.length) >= 58 && pct(forte, pares.length) <= 75);
  }
  console.log(linhas.join('\n'));
  if (res.some(r => !r.terminou)) { console.log('FALHA: partida que não terminou'); process.exit(1); }
}
