#!/usr/bin/env node
/* Valorant World Cup (C1): a partida de seleção.
   Confere, num mundo novo:
     · duas seleções jogam uma série inteira no motor dos clubes (veto,
       mapas, ficha com a linha de cada jogador e MVP do vencedor);
     · o amistoso não mexe em nada do mundo — nem no gerador;
     · a série de verdade não mexe em clube, elenco nem função de clube;
     · a comissão: quantas seleções têm técnico do próprio país;
     · o favorito ganha mais, e quanto mais forte, mais.
   Uso: node tools/selecao-jogo.mjs [semente] [--series N] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,over,convocacao,forcaSelecao,rankingPaises,infoSelecao,jogarSerieSelecoes,amistosoSelecoes,comissaoDaSelecao,timeDaSelecao,paisesDaCopa,get G(){return G;},get s(){return _s;}};';
const tmp = resolve(raiz, '.sj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv.find(a => /^\d+$/.test(a)) || 20260828);
const iN = process.argv.indexOf('--series'); const N = iN > 0 ? +process.argv[iN + 1] : 300;
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

m.criarMundo(semente); if (m.montarCalendario) m.montarCalendario();
const G = m.G;
const foto = () => JSON.stringify({j: G.jogadores, t: G.times, s: m.s});
const fotoClubes = () => JSON.stringify({t: G.times, j: Object.values(G.jogadores).map(p => [p.id, p.timeId, p.roleAtual, p.role, p.igl])});

/* 1. amistoso: nada muda */
m.rankingPaises();          /* garante G.copa antes da foto */
m.comissaoDaSelecao('BR');
const antes = foto();
const f = m.amistosoSelecoes('BR', 'KR', 5);
ok(foto() === antes, 'o amistoso mexeu no mundo ou no gerador');
ok(f && f.det.mp.length >= 3 && f.det.mp.length <= 5, 'amistoso MD5 sem 3 a 5 mapas');
const nomeP = id => G.jogadores[id] ? G.jogadores[id].nome : id;
console.log(`amistoso Brasil x Coreia do Sul (MD5): ${f.wa}–${f.wb} · ${f.mapa} · MVP ${nomeP(f.det.mvp)}`);
console.log('  veto: ' + f.det.v.map(([mp, tp, tag]) => (tp === 'b' ? '✕' : tp === 'd' ? '★' : '✓') + mp + (tag && tp !== 'd' ? '(' + tag + ')' : '')).join(' '));
const vencTit = f.v === f.a ? f.esc.a : f.esc.b;
ok(vencTit.includes(f.det.mvp), 'MVP não jogou pelo vencedor');
const linhas = f.det.mp[0].st.split('|');
ok(linhas.length === 10, 'o mapa 1 não tem a linha dos 10 jogadores');
const t1 = G.staff[f.tec.a], t2 = G.staff[f.tec.b];
console.log(`  técnicos: ${t1 ? t1.nome + ' (' + t1.pais + ')' : '—'} × ${t2 ? t2.nome + ' (' + t2.pais + ')' : '—'}`);

/* 2. comissão */
const ps = m.paisesDaCopa();
let nac = 0, sem = 0;
for (const p of ps) { const c = m.comissaoDaSelecao(p); const t = c.tecnico && G.staff[c.tecnico]; if (!t) sem++; else if (t.pais === p) nac++; }
console.log(`\ncomissão: ${nac}/40 seleções com técnico do próprio país · ${sem} sem técnico`);
ok(sem === 0, 'seleção sem técnico');
const tecs = ps.map(p => m.comissaoDaSelecao(p).tecnico);
ok(new Set(tecs).size === tecs.length, 'um técnico em duas seleções');

/* 3. séries de verdade: clubes intactos, favorito ganha mais */
const clubesAntes = fotoClubes();
const forca = Object.fromEntries(ps.map(p => [p, m.forcaSelecao(p)]));
const somaAntes = Object.values(G.copa.ranking).reduce((s, v) => s + v, 0);
const faixas = [[0, 2], [2, 5], [5, 10], [10, 99]].map(([a, b]) => ({a, b, n: 0, fav: 0}));
let maps = 0, wo = 0;
for (let i = 0; i < N; i++) {
  const a = ps[i % 40], b = ps[(i * 7 + 3) % 40];
  if (a === b) continue;
  const r = m.jogarSerieSelecoes(a, b, {bo: i % 3 ? 3 : 5, nome: 'teste', peso: 1});
  if (r.wo) { wo++; continue; }
  maps += r.det.mp.length;
  const dif = Math.abs(forca[a] - forca[b]), fav = forca[a] >= forca[b] ? a : b;
  const fx = faixas.find(x => dif >= x.a && dif < x.b); fx.n++; if (r.v === fav) fx.fav++;
}
ok(fotoClubes() === clubesAntes, 'série de seleção mexeu em clube, elenco ou função de clube');
const somaDepois = Object.values(G.copa.ranking).reduce((s, v) => s + v, 0);
ok(somaDepois === somaAntes, 'o ranking criou ou sumiu com pontos');
console.log(`\n${N} séries (${maps} mapas, ${wo} W.O.) — o favorito pela força do melhor cinco:`);
for (const x of faixas) console.log(`  diferença ${String(x.a).padStart(2)}–${x.b === 99 ? '+ ' : String(x.b).padEnd(2)}: ${x.n ? Math.round(100 * x.fav / x.n) : '—'}% em ${x.n} séries`);
const grande = faixas[3], pequena = faixas[0];
ok(!grande.n || grande.fav / grande.n > 0.8, 'favorito por 10+ ganha menos de 80%');
ok(!pequena.n || pequena.fav / pequena.n < 0.75, 'equilíbrio demais para o favorito por pouco');

const conv = m.convocacao('BR');
const craque = G.jogadores[conv.titulares[0]];
console.log(`\nestatística de seleção de ${craque.nome}:`, JSON.stringify(craque.selecao));
ok(craque.selecao && craque.selecao.series > 0, 'estatística de seleção não foi registrada');
ok(!G.times['SEL-BR'], 'a seleção ficou em G.times');
const rk = m.rankingPaises().slice(0, 5).map(x => `${x.sigla} ${x.pts}`).join(' · ');
console.log('ranking depois: ' + rk);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
