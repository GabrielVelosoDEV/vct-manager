#!/usr/bin/env node
/* Modo jogador (J3): mede a evolução numa temporada com três jeitos de viver
   a semana, para calibrar o XP:
     jogar  treino do clube, VOD e treinos jogáveis com nota 1,0, até a
            energia baixar de ~25
     auto   nada marcado: o assistente simula a semana padrão
     nada   assistente desligado: só as partidas dão XP
   Alvo do plano: uma promessa de over 68 treinando bem chega perto de 75; a
   temporada largada aparece no número.
   Uso: node tools/semana-jogador.mjs [inicio] [over] [pot] [idade] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,clubeDoJogador,over,fazerAtividade,porqueNaoAtividade,semanaJogador,pontosTalento,get G(){return G;}};';
const tmp = resolve(raiz, '.sj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const [ini = 'challengers', ov = 68, pot = 88, idade = 19, semente = 20260828] = process.argv.slice(2);

function rodar(modo) {
  m.criarMundo(+semente); m.montarCalendario();
  const G = m.G;
  m.criarManager('Teste', 'jogador', {});
  const tier = ini === 'ranked' ? 0 : ini === 'challengers' ? 2 : 1;
  const clube = tier ? G.regioes.AMER[tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[2] : null;
  const p = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: +idade, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
    estilo: 'mira', inicio: ini, over: +ov, pot: +pot, timeId: clube && clube.id});
  if (modo === 'nada') G.voce.auto = false;
  const o0 = m.over(p), ano0 = G.ano, at0 = {...p.at};
  let semanas = 0, gasto = 0;
  while (G.ano === ano0 && semanas < 80) {
    if (modo === 'jogar') {
      const s = m.semanaJogador();
      for (const id of ['coletivo', 'vod']) if (!m.porqueNaoAtividade(id)) m.fazerAtividade(id, {simulado: false, nota: 1});
      for (const id of ['range', 'duelo', 'retake', 'dm', 'range'])
        if (!m.porqueNaoAtividade(id) && s.energia - 20 >= 25) m.fazerAtividade(id, {simulado: false, nota: 1});
      gasto += s.ini - s.energia;
    }
    m.avancar(); semanas++;
  }
  const eu = G.jogadores[p.id];
  const ult = eu.hist.length ? eu.hist[eu.hist.length - 1] : null;
  const d = Object.keys(at0).filter(k => eu.at[k] !== at0[k]).map(k => `${k}+${eu.at[k] - at0[k]}`).join(' ');
  console.log(`${modo.padEnd(6)} over ${o0} → ${m.over(eu)} · ${ult ? ult.maps : 0} mapas · fadiga ${eu.fadiga.toFixed(2)} · forma ${eu.forma.toFixed(2)} · pontos de talento ${m.pontosTalento(eu)}${modo === 'jogar' ? ' · gasto médio ' + Math.round(gasto / semanas) : ''} · ${d}`);
}
console.log(`início ${ini}, over ${ov}, pot ${pot}, ${idade} anos`);
for (const modo of ['jogar', 'auto', 'nada']) rodar(modo);
