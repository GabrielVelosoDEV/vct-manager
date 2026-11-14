#!/usr/bin/env node
/* Valorant World Cup (C0): as 40 seleções de um mundo novo.
   Mostra, por país: convocáveis (reais e gerados), força do melhor cinco,
   pontos iniciais do ranking e a convocação (titulares e reservas).
   Confere: toda seleção tem pelo menos 7 convocáveis; nenhum jogador real
   mudou de nacionalidade; o gerador do mundo segue na mesma sequência
   (o mesmo mundo de antes, só com a nacionalidade dos livres gerados).
   Uso: node tools/selecoes.mjs [semente] [--elenco] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,over,convocaveis,convocacao,forcaSelecao,rankingPaises,sedeDoAno,proximaCopa,PAISES,COPA_SELECOES,SELECAO_MINIMO,get G(){return G;},set orientar(f){orientarNacionalidadesCopa=f;},get orientar(){return orientarNacionalidadesCopa;}};';
const tmp = resolve(raiz, '.sel.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv.find(a => /^\d+$/.test(a)) || 20260828);
const elenco = process.argv.includes('--elenco');
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

/* o mesmo mundo sem a orientação, para comparar */
const orig = m.orientar;
m.orientar = () => 0;
m.criarMundo(semente);
const antes = Object.fromEntries(Object.values(m.G.jogadores).map(p => [p.id, {pais: p.pais, real: !!p.real, over: m.over(p), time: p.timeId}]));
m.orientar = orig;
m.criarMundo(semente);
const G = m.G;
let mudaram = 0, reaisMudaram = 0, outros = 0;
for (const p of Object.values(G.jogadores)) {
  const a = antes[p.id];
  if (!a) { outros++; continue; }
  if (a.pais !== p.pais) { mudaram++; if (p.real) reaisMudaram++; }
  if (a.over !== m.over(p) || a.time !== p.timeId) outros++;
}
console.log(`mundo ${semente}: ${Object.keys(G.jogadores).length} jogadores · ${mudaram} agentes livres gerados mudaram de país · reais mexidos ${reaisMudaram} · outras diferenças ${outros}\n`);
ok(reaisMudaram === 0, 'jogador real mudou de nacionalidade');
ok(outros === 0, 'o mundo mudou além da nacionalidade dos livres');

const rk = m.rankingPaises();
console.log(' #  seleção               conv. (reais+ger.)  força  pontos  titulares');
for (const x of rk) {
  const todos = m.convocaveis(x.pais), reais = todos.filter(p => p.real).length;
  const c = m.convocacao(x.pais);
  ok(todos.length >= m.SELECAO_MINIMO, `${x.nome} tem só ${todos.length} convocáveis`);
  const tit = c ? c.titulares.map(i => G.jogadores[i]).map(p => `${p.nome} ${m.over(p)}`).join(', ') : '—';
  console.log(`${String(x.pos).padStart(2)}  ${(x.nome + ' (' + x.sigla + ')').padEnd(22)} ${String(todos.length).padStart(3)} (${reais}+${todos.length - reais})`.padEnd(46) + `${String(m.forcaSelecao(x.pais, c)).padStart(5)}  ${String(x.pts).padStart(6)}  ${tit}`);
  if (elenco && c) console.log('      reservas:', c.reservas.map(i => G.jogadores[i]).map(p => `${p.nome} ${m.over(p)}${p.real ? '' : '*'}`).join(', '));
}
const s = m.sedeDoAno(m.proximaCopa(G.ano));
console.log(`\npróxima Copa: ${s.ano} · ${s.edicao}ª edição · sede ${s.nome} (${s.pais})`);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
