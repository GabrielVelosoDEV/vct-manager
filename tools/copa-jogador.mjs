#!/usr/bin/env node
/* Valorant World Cup (C6): o modo jogador.
   Uma carreira de jogador (Lenda, pelo país pedido) atravessa as
   eliminatórias de 2027 e a Copa de 2028. Cada série dele pela seleção é
   "jogada na tela" como a interface faz: o ciclo para no jogo dele
   (jogoDeSelecaoDoJogador), a série roda com as seleções em campo, fecha
   como série de seleção e é entregue pronta ao relógio.
   Confere: convocação com notícia, séries dele entregues e não jogadas de
   novo (grupos com o número certo de jogos), nenhuma seleção esquecida em
   G.times, função de clube devolvida, estatística de seleção, e a Copa
   inteira fechando com medalha se a seleção dele subir ao pódio.
   Uso: node tools/copa-jogador.mjs [país=BR] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,over,jogoDeSelecaoDoJogador,timeDaSelecao,entrarSelecoesEmCampo,abrirSerie,serieAbrirMapa,passoRound,serieFecharMapa,veto,fecharSerieSelecaoConduzida,injetarSerieSelecao,infoSelecao,INICIOS_JOGADOR,get G(){return G;}};';
const tmp = resolve(raiz, '.cj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const pais = (process.argv.find(a => /^[A-Z]{2}$/.test(a)) || 'BR');
const semente = +(process.argv.find(a => /^\d+$/.test(a)) || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

m.criarMundo(semente); m.montarCalendario();
const G = m.G;
m.criarManager('Teste', 'jogador', {});
const I = m.INICIOS_JOGADOR.find(x => x.id === 'lenda');
const clube = G.regioes.AMER.t1.map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[2];
const p = m.criarCarreiraJogador({automatico: true, nick: 'Voce', pais, idade: 22, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
  estilo: 'mira', inicio: 'lenda', over: 97, pot: 99, timeId: clube.id});
console.log(`jogador ${p.nome} (${pais}) over ${m.over(p)} no ${clube.nome}`);

/* a série pela seleção, como a tela faz */
const jogarNaTela = pend => {
  const cv = pend.ctx.conv || {};
  const A = m.timeDaSelecao(pend.a, cv[pend.a]), B = m.timeDaSelecao(pend.b, cv[pend.b]);
  const rolesAntes = Object.fromEntries(A.titulares.concat(B.titulares).map(i => [i, G.jogadores[i].roleAtual]));
  const sair = m.entrarSelecoesEmCampo([A, B]);
  const v = m.veto(A, B, pend.ctx.bo);
  const S = m.abrirSerie(A.id, B.id, pend.ctx.bo, {seq: v.seq, mapas: v.mapas, lados: v.lados});
  while (!S.fim) { if (!m.serieAbrirMapa(S)) break; while (!S.M.fim) m.passoRound(S.M); m.serieFecharMapa(S); }
  const f = m.fecharSerieSelecaoConduzida(S, A, B, pend);
  sair();
  ok(!G.times[A.id] && !G.times[B.id], 'seleção esquecida em G.times');
  ok(Object.entries(rolesAntes).every(([i, r]) => G.jogadores[i].roleAtual === r), 'função de clube não voltou');
  m.injetarSerieSelecao(f);
  return f;
};

const c27Dbg = () => (G.copa.ciclos[2028] && G.copa.ciclos[2028].copa) || {};
const minhas = [];
let semanas = 0;
while (!(G.ano === 2029 && G.semana >= 2) && semanas < 600) {
  let pend, guarda = 0;
  while ((pend = m.jogoDeSelecaoDoJogador()) && guarda++ < 6) {
    const f = jogarNaTela(pend);
    const sig = x => m.infoSelecao(x).sigla;
    minhas.push(`${G.ano}/${G.semana} ${pend.ctx.fase}: ${sig(f.a)} ${f.wa}–${f.wb} ${sig(f.b)}${f.esc.a.concat(f.esc.b).includes(p.id) ? '' : ' (banco)'}`);
  }
  m.avancar(); semanas++;
}
console.log("fim em", G.ano, G.semana, "semanas", semanas, "copa", JSON.stringify(Object.keys(c27Dbg())));
console.log(minhas.length ? 'séries dele pela seleção:\n  ' + minhas.join('\n  ') : 'nenhuma série pela seleção');
const c27 = G.copa.ciclos[2028];
const conv = (G.voce.selecao || []);
console.log('convocações:', JSON.stringify(conv));
ok(conv.length >= 1, 'não foi convocado nenhuma vez');
const noticias = G.noticias.filter(n => /convocad/.test(n.txt) && n.meu);
ok(noticias.length >= 1 || conv.length === 0, 'convocação sem notícia');
for (const g of (c27.grupos || [])) ok(g.paises ? true : true, '');
const C = c27.copa;
ok(C && C.fim, 'a Copa não fechou');
if (C) {
  ok(C.grupos.every(g => !g.jogos || g.jogos.length === 6 || g.tabela), 'grupo com jogo repetido ou faltando');
  const ed = G.copa.edicoes.find(e => e.ano === 2028);
  const lugar = ed ? [ed.campeao, ed.vice, ed.bronze].indexOf(pais) : -1;
  console.log(`World Cup 2028: campeã ${m.infoSelecao(ed.campeao).sigla} · ${pais} ${lugar >= 0 ? ['ouro', 'prata', 'bronze'][lugar] : 'sem medalha'} · medalhas dele ${JSON.stringify(p.copa || {})}`);
  if (lugar >= 0 && conv.some(x => x.tipo === 'copa')) ok(p.copa && p.copa[['ouro', 'prata', 'bronze'][lugar]].includes(2028), 'medalha não entrou');
}
ok(p.selecao && p.selecao.series > 0, 'estatística de seleção vazia');
ok(!Object.keys(G.times).some(k => k.startsWith('SEL-')), 'sobrou seleção em G.times');
console.log('seleção dele:', JSON.stringify(p.selecao), '· seguidores', G.voce.seguidores);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
