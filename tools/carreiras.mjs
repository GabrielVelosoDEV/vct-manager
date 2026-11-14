#!/usr/bin/env node
/* Modo jogador (J8): carreiras inteiras sem tela, em lote, para medir a régua
   do modo: evolução, salário, dinheiro, fama e tempo até o Tier 1.
   Cada carreira roda num worker (worker_threads), uma por núcleo.

   Duas posturas:
     auto   o assistente faz tudo (semana simulada, contrato, patrocínio)
     ativo  treina jogando bem (nota 1), vai ao treino do clube e ao VOD,
            posta com cuidado, responde entrevista madura, contrata
            empresário, compra setup e personal, negocia 8% a mais e aceita
            transferência para clube melhor

   Uso: node tools/carreiras.mjs [ateIdade=26] [sementes=1] [inicios=ranked,tier2] */
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import os from 'node:os';
const aqui = fileURLToPath(import.meta.url);
const raiz = resolve(dirname(aqui), '..');

if (isMainThread) {
  const ateIdade = +(process.argv[2] || 26), nSem = +(process.argv[3] || 1);
  const inicios = (process.argv[4] || 'ranked,tier2').split(',');
  const tarefas = [];
  for (let s = 0; s < nSem; s++) for (const ini of inicios) for (const pol of ['auto', 'ativo'])
    tarefas.push({ini, pol, ateIdade, semente: 20260828 + s * 7919});
  const nucleos = Math.max(1, Math.min(os.cpus().length, tarefas.length));
  const res = [];
  let prox = 0;
  const t0 = Date.now();
  await new Promise(fim => {
    let vivos = 0;
    const lancar = () => {
      if (prox >= tarefas.length) { if (!vivos) fim(); return; }
      const tarefa = tarefas[prox++]; vivos++;
      const w = new Worker(aqui, {workerData: tarefa});
      w.on('message', m => res.push(m));
      w.on('error', e => res.push({...tarefa, erro: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')}));
      w.on('exit', () => { vivos--; lancar(); });
    };
    for (let i = 0; i < nucleos; i++) lancar();
  });
  const fmt = n => n == null ? '—' : String(n);
  console.log(`${tarefas.length} carreiras até ${ateIdade} anos · ${Math.round((Date.now() - t0) / 1000)} s\n`);
  console.log('início   postura  1º clube  Tier 1   over 21  over 25  auge  mapas/ano  salário máx  patrimônio  seguidores  patroc/mês  clubes  idade fim');
  for (const r of res.sort((a, b) => a.ini.localeCompare(b.ini) || a.pol.localeCompare(b.pol) || a.semente - b.semente)) {
    if (r.erro) { console.log(`${r.ini.padEnd(8)} ${r.pol.padEnd(8)} ERRO ${r.erro}`); continue; }
    console.log(`${r.ini.padEnd(8)} ${r.pol.padEnd(8)} ${fmt(r.primeiroClube).padEnd(9)} ${fmt(r.tier1).padEnd(8)} ${fmt(r.over21).padEnd(8)} ${fmt(r.over25).padEnd(8)} ${String(r.auge).padEnd(5)} ${String(r.mapasAno).padEnd(10)} ${String(r.salMax).padEnd(12)} ${String(r.caixa).padEnd(11)} ${String(r.seg).padEnd(11)} ${String(r.patroc).padEnd(11)} ${String(r.clubes).padEnd(7)} ${r.idade}`);
  }
  console.log('\n1º clube e Tier 1: semanas desde o início da carreira (— = não chegou).');
} else {
  const {ini, pol, ateIdade, semente} = workerData;
  const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
    .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
  const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
    + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,over,fazerAtividade,porqueNaoAtividade,semanaJogador,propostasJogador,negociarProposta,aceitarProposta,recusarProposta,simularTeste,candidatosEmpresario,contratarEmpresario,comprarSetup,alternarStaffPessoal,caixaJogador,postarNasRedes,responderEntrevista,seguidores,patrociniosMensais,_piorTitularDaFuncao,INICIOS_JOGADOR,get G(){return G;}};';
  const tmp = resolve(raiz, `.cs.${process.pid}.${Math.random().toString(36).slice(2)}.cjs`);
  writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
  m.criarMundo(semente); m.montarCalendario();
  const G = m.G;
  m.criarManager('Teste', 'jogador', {});
  const I = m.INICIOS_JOGADOR.find(x => x.id === ini);
  const clube = I.tier ? G.regioes.AMER[I.tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[3] : null;
  const p = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: 18, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
    estilo: 'mira', inicio: ini, over: I.over, pot: I.pot, timeId: clube && clube.id});
  const id = p.id;
  let semanas = 0, primeiroClube = p.timeId ? 0 : null, tier1 = null, salMax = p.salario || 0, mapas = 0;
  const overIdade = {}, clubes = new Set(p.timeId ? [p.timeId] : []);
  while (!G.voce.aposentado && semanas < 60 * 30) {
    const eu = m.meuJogador();
    if (!eu || eu.idade > ateIdade) break;
    if (pol === 'ativo') {
      const s = m.semanaJogador();
      for (const a of ['coletivo', 'vod']) if (!m.porqueNaoAtividade(a)) m.fazerAtividade(a, {simulado: false, nota: 1});
      for (const a of ['range', 'duelo', 'retake', 'dm', 'ranked']) if (!m.porqueNaoAtividade(a) && s.energia - 25 >= 40) m.fazerAtividade(a, {simulado: a === 'ranked', nota: 1});
      if (G.voce.post) m.postarNasRedes(semanas % 2 ? 'humilde' : 'confiante');
      if (G.voce.entrevista) m.responderEntrevista([0, 0]);
      if (!G.voce.empresario) { const c = m.candidatosEmpresario().filter(x => x.aceita && x.luvas <= m.caixaJogador() * 0.4).pop(); if (c) m.contratarEmpresario(c.nivel); }
      for (const it of ['monitor', 'perifericos', 'cadeira']) if (m.caixaJogador() > 20000) m.comprarSetup(it);
      if (m.caixaJogador() > 40000 && !(G.voce.staffP || {}).personal) m.alternarStaffPessoal('personal');
      for (const pr of m.propostasJogador().slice()) {
        if (pr.tipo === 'teste') { m.simularTeste(pr.id); continue; }
        const at = eu.timeId && G.times[eu.timeId], de = G.times[pr.clubeId];
        const melhor = !at || de.tier < at.tier || (de.tier === at.tier && de.prestigio > at.prestigio + 4 && m.over(eu) >= m._piorTitularDaFuncao(de, eu));
        if (pr.tipo === 'transferencia' && !melhor) { m.recusarProposta(pr.id); continue; }
        if (!pr.acordo) { const r = m.negociarProposta(pr.id, {salario: Math.round(pr.salario * 1.08)}); if (r.fim === 'retirada') continue; }
        m.aceitarProposta(pr.id);
      }
    }
    const antes = (eu.temp && eu.temp.maps) || 0, ano = G.ano;
    m.avancar(); semanas++;
    const q = G.jogadores[id];
    if (!q) break;
    if (G.ano === ano) mapas += Math.max(0, ((q.temp && q.temp.maps) || 0) - antes);
    if (q.timeId) { clubes.add(q.timeId); if (primeiroClube == null) primeiroClube = semanas; if (tier1 == null && G.times[q.timeId].tier === 1) tier1 = semanas; }
    salMax = Math.max(salMax, q.timeId ? q.salario : 0);
    if (overIdade[q.idade] == null) overIdade[q.idade] = m.over(q);
  }
  const q = G.jogadores[id];
  const anos = Math.max(1, semanas / 52);
  parentPort.postMessage({ini, pol, semente, primeiroClube, tier1, over21: overIdade[21], over25: overIdade[25], auge: q ? Math.round(q.pico) : '—',
    mapasAno: Math.round((q && q.carreira ? (q.carreira.maps || 0) + ((q.temp && q.temp.maps) || 0) : mapas) / anos), salMax, caixa: m.caixaJogador(),
    seg: m.seguidores(), patroc: m.patrociniosMensais(), clubes: clubes.size, idade: q ? q.idade : 'apos.'});
}
