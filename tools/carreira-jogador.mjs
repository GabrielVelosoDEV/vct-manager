#!/usr/bin/env node
/* Modo jogador (J0/J1): cria carreiras de jogador com cada ponto de partida,
   avança temporadas inteiras sem tela e confere a base:
     · o seu jogador continua existindo, no clube (ou sem clube, na ranked)
     · a IA dirige o seu clube (escala, joga); desde a J5 o contrato não
       renova sozinho: o assistente de contrato aceita a renovação (ou a
       melhor proposta, se você ficar livre)
     · quem começou titular joga; o mapa conta na sua temporada
     · as partidas do seu clube aparecem como "minhaPartida" ao avançar
   Uso: node tools/carreira-jogador.mjs [temporadas] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,clubeDoJogador,over,INICIOS_JOGADOR,get G(){return G;}};';
const tmp = resolve(raiz, '.cj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const anos = +(process.argv[2] || 1), semente = +(process.argv[3] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

for (const ini of m.INICIOS_JOGADOR) {
  m.criarMundo(semente); m.montarCalendario();
  const G = m.G;
  const regiao = 'AMER', tier = ini.tier;
  const clube = tier ? G.regioes[regiao][tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[2] : null;
  m.criarManager('Teste', 'jogador', {});
  const p = m.criarCarreiraJogador({nick: 'Voce' + ini.id, pais: 'BR', idade: 19, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
    estilo: 'mira', inicio: ini.id, over: ini.over, pot: ini.pot, timeId: clube && clube.id});
  const id = p.id, overIni = m.over(p);
  ok(G.meuTime === null, 'modo jogador deixou G.meuTime preenchido');
  ok(G.voce && G.voce.id === id, 'G.voce não aponta para o jogador');
  if (clube) ok(p.timeId === clube.id, 'não assinou com o clube');
  if (ini.titular) ok(clube.titulares.includes(id), 'começou prometido como titular e não está no cinco');
  let minhas = 0, semanas = 0, erro = null, semClube = 0;
  const ano0 = G.ano;
  try {
    while (G.ano < ano0 + anos && semanas < 60 * anos + 10) {
      const r = m.avancar(); semanas++;
      if (r && r.minhaPartida) minhas++;
      const eu = G.jogadores[id];
      if (!eu) { ok(false, `o jogador sumiu do mundo na semana ${G.semana} de ${G.ano}`); break; }
      if (clube && !eu.timeId) semClube++;
    }
  } catch (e) { erro = e; ok(false, 'erro avançando: ' + (e && e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); }
  const eu = G.jogadores[id];
  const ultimo = eu && eu.hist.length ? eu.hist[eu.hist.length - 1] : null;
  const maps = ultimo ? ultimo.maps : (eu && eu.temp.maps) || 0;
  if (clube) ok(minhas > 0, 'nenhuma partida do seu clube apareceu como minhaPartida');
  if (ini.titular) ok(maps > 10, `começou titular e jogou só ${maps} mapas`);
  if (ini.titular) ok(eu && eu.timeId && eu.contrato > 0, 'titular terminou a temporada sem clube');
  if (clube && semClube > 12) ok(false, `${semClube} semanas sem clube`);
  const fim = eu && eu.timeId ? G.times[eu.timeId].tag : 'livre';
  console.log(`${ini.nome.padEnd(14)} ${(clube ? clube.tag : 'livre').padEnd(5)}→${fim.padEnd(5)} over ${overIni} → ${eu ? m.over(eu) : '—'} · ${semanas} semanas · ${minhas} partidas do clube · ${maps} mapas jogados · idade ${eu ? eu.idade : '—'} · caixa ${m.G.voce.caixa}${semClube ? ' · ' + semClube + ' sem. sem clube' : ''}${erro ? ' · ERRO' : ''}`);
}
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
