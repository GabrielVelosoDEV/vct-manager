#!/usr/bin/env node
/* Etapa 7: o motor da gameplay dentro do VCT Manager.
   Liga a preferência "minhas partidas no motor", joga séries do seu clube
   pelo simPartida de sempre e confere:
     · placar de cada mapa coerente (13+, diferença de 2) e série fechada
     · estatística do mapa vinda do motor (abates de um lado ≤ mortes do outro)
     · MVP, ACS e o box score que o resto do manager lê
     · o tempo de uma série
   e compara a taxa de vitória com o modelo de conta nos mesmos confrontos.
   Uso: node tools/motor-manager.mjs [sigla do clube] [séries] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = 'var Prefs={dados:{motorMinhas:true,motorTodas:false},get(k){return this.dados[k];}};\n'
  + ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,simPartida,acsDe,srand,Prefs,get G(){return G;}};';
const tmp = resolve(raiz, '.mm.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const tag = process.argv[2] || 'LOUD', n = +(process.argv[3] || 6);
m.criarMundo(20260828); m.montarCalendario();
const G = m.G;
const meu = Object.values(G.times).find(t => t.tag === tag);
if (!meu) { console.log('clube não encontrado:', tag); process.exit(1); }
G.meuTime = meu.id;
const rivais = Object.values(G.times).filter(t => t.id !== meu.id && t.tier === meu.tier && t.regiao === meu.regiao).slice(0, n);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
let vMotor = 0, vConta = 0, mapasM = 0, mapasC = 0, rM = 0, rMt = 0;
console.log(`${meu.nome} (${tag}) · ${rivais.length} séries MD3 no motor e no modelo de conta\n`);
for (const r of rivais) {
  m.Prefs.dados.motorMinhas = true;
  const t0 = Date.now();
  const res = m.simPartida(meu.id, r.id, 3, {stage: 'teste', nome: 'teste'});
  const ms = Date.now() - t0;
  ok(res.mapas.length >= 2 && res.mapas.length <= 3, 'número de mapas');
  ok(Math.max(res.wa, res.wb) === 2, 'série não fechou em 2');
  for (const mp of res.mapas) {
    const a = mp.sa, b = mp.sb;
    ok(Math.max(a, b) >= 13 && Math.abs(a - b) >= 2, `placar incoerente ${mp.mapa} ${a}–${b}`);
    ok(mp.hist.length === a + b, `rounds contados errado em ${mp.mapa}`);
    const kA = meu.titulares.reduce((s, id) => s + mp.st[id].k, 0), dB = r.titulares.reduce((s, id) => s + mp.st[id].d, 0);
    ok(kA <= dB, `abates do ${tag} (${kA}) maiores que as mortes do rival (${dB}) em ${mp.mapa}`);
    ok(mp.hist.every(h => ['elim', 'spike', 'defuse', 'tempo'].includes(h.como)), 'como do round desconhecido');
    rM += a; rMt += a + b; mapasM++;
  }
  ok(res.mvp && G.jogadores[res.mvp], 'sem MVP');
  if (res.vencedor === meu.id) vMotor++;
  const mvp = G.jogadores[res.mvp];
  console.log(`  ${tag} ${res.wa}–${res.wb} ${r.tag.padEnd(5)} ${res.mapas.map(mp => `${mp.mapa} ${mp.sa}-${mp.sb}`).join(', ').padEnd(44)} MVP ${mvp ? mvp.nome : '-'} · ${(ms / 1000).toFixed(1)} s`);
  /* o mesmo confronto no modelo de conta (três vezes, para ter base) */
  m.Prefs.dados.motorMinhas = false;
  for (let k = 0; k < 3; k++) { const c = m.simPartida(meu.id, r.id, 3, {stage: 'teste', nome: 'teste'}); if (c.vencedor === meu.id) vConta++; mapasC++; }
}
const box = Object.entries(G.jogadores[meu.titulares[0]].temp);
console.log(`\nmotor: ${tag} venceu ${vMotor}/${rivais.length} séries (${pct(rM, rMt)}% dos rounds) · modelo de conta: ${vConta}/${mapasC} séries`);
console.log(`temporada de ${G.jogadores[meu.titulares[0]].nome}: ${box.map(([k, v]) => k + ' ' + v).join(', ')}`);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
