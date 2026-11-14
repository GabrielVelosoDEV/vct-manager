#!/usr/bin/env node
/* Modo jogador (J4): começa no banco de um clube do Tier 1 e mede, numa
   temporada, quanto tempo leva para virar titular com três posturas:
     serio     treino do clube, treinos jogáveis bem feitos, feedback ao técnico
     auto      o assistente simula a semana; nada de conversa
     brigao    nada marcado (assistente desligado) e reclama da escalação a
               cada 4 semanas
   Alvo do plano: jogar bem e treinar sério tira você do banco em algumas
   semanas; brigar com o técnico tem custo.
   Uso: node tools/titularidade.mjs [over] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,clubeDoJogador,over,fazerAtividade,porqueNaoAtividade,semanaJogador,conversarComTecnico,chanceDeJogar,confTecnico,eventosJogador,resolverConflito,get G(){return G;}};';
const tmp = resolve(raiz, '.tit.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const [ov = 'auto', semente = 20260828] = process.argv.slice(2);

function rodar(modo) {
  m.criarMundo(+semente); m.montarCalendario();
  const G = m.G;
  m.criarManager('Teste', 'jogador', {});
  /* o clube do Tier 1 com o elenco mais fundo: com 5 ou 6 jogadores o banco
     não existe (qualquer saída põe você no cinco) */
  const clube = Object.values(G.regioes).flatMap(r => r.t1).map(id => G.times[id]).sort((a, b) => b.elenco.length - a.elenco.length || b.prestigio - a.prestigio)[0];
  const pior = Math.min(...clube.titulares.map(i => m.over(G.jogadores[i])));
  const alvo = ov === 'auto' ? pior - 2 : +ov;
  const p = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: 20, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
    estilo: 'mira', inicio: 'banco', over: alvo, pot: 90, timeId: clube.id});
  if (modo === 'brigao') G.voce.auto = false;
  const ano0 = G.ano;
  let semanas = 0, titSem = 0, primeira = null, conflitos = 0;
  const conf0 = m.confTecnico();
  if (modo === 'serio') console.log('  cinco do clube:', clube.titulares.map(i => G.jogadores[i]).map(x => x.nome + ' ' + x.role[0] + m.over(x)).join(', '), '· elenco', clube.elenco.length, '· você', m.over(p));
  while (G.ano === ano0 && semanas < 80) {
    const s = m.semanaJogador();
    if (modo === 'serio') {
      for (const id of ['coletivo', 'vod']) if (!m.porqueNaoAtividade(id)) m.fazerAtividade(id, {simulado: false, nota: 1.2});
      for (const id of ['range', 'duelo', 'retake']) if (!m.porqueNaoAtividade(id) && s.energia - 20 >= 45) m.fazerAtividade(id, {simulado: false, nota: 1.2});
      /* pede feedback de vez em quando; pede para jogar uma vez, depois de mostrar serviço */
      if (semanas === 6 && !clube.titulares.includes(p.id)) m.conversarComTecnico('jogar');
      else if (semanas % 3 === 0) m.conversarComTecnico('feedback');
    }
    if (modo === 'brigao' && semanas % 4 === 3) m.conversarComTecnico('reclamar');
    for (const e of m.eventosJogador().slice()) { conflitos++; m.resolverConflito(e.id, modo === 'brigao' ? 'rebater' : 'conversar') || m.resolverConflito(e.id, 'assumir'); }
    m.avancar(); semanas++;
    const tit = clube.titulares.includes(p.id);
    if (tit) { titSem++; if (primeira == null) primeira = semanas; }
  }
  const eu = G.jogadores[p.id], ult = eu.hist.length ? eu.hist[eu.hist.length - 1] : null;
  console.log(`${modo.padEnd(7)} titular em ${titSem}/${semanas} semanas · primeira vez na semana ${primeira ?? '—'} · ${ult ? ult.maps : 0} mapas · confiança ${conf0} → ${Math.round(m.confTecnico())} · over ${alvo} → ${m.over(eu)} · conflitos ${conflitos}`);
}
for (const modo of ['serio', 'auto', 'brigao']) rodar(modo);
