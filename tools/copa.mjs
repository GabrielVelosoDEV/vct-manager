#!/usr/bin/env node
/* Valorant World Cup (C3): a Copa.
   Roda temporadas inteiras e confere cada Copa:
     · sorteio na semana 45 (domingo): 8 grupos de 4, sede no grupo A,
       continente espalhado; grupos na 46, oitavas a semis na 47, bronze e
       final na 48 — cada série com a data do calendário de novembro;
     · 48 jogos de grupo (MD3), 16 de mata-mata (MD5), dois por grupo avançam;
     · pódio de quatro seleções diferentes, medalhas para os 10 de cada um
       dos três primeiros, MVP e time ideal entre quem jogou;
     · campeões plausíveis: de onde vem cada campeão no ranking do sorteio.
   E o peso de G.copa no save.
   Uso: node tools/copa.mjs [anos] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,infoSelecao,paisesNaHistoria,jogadoresNaHistoria,tecnicosNaHistoria,timesLendarios,finaisHistoricas,recordesDaCopa,campeaoMundial,get G(){return G;}};';
const tmp = resolve(raiz, '.cp.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const nums = process.argv.slice(2).filter(a => /^\d+$/.test(a)).map(Number);
const anos = nums[0] || 10, semente = nums[1] || 20260828;
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

m.criarMundo(semente); m.montarCalendario();
const G = m.G, sig = p => (m.infoSelecao(p) || {sigla: p}).sigla;
const t0 = Date.now(), posCampeao = [];
for (let k = 0; k < anos; k++) {
  const ano = G.ano;
  let sorteioNa45 = null, fimNa48 = null;
  while (G.ano === ano) {
    const sem = G.semana;
    m.avancar();
    const cic = G.copa && G.copa.ciclos && G.copa.ciclos[ano];
    if (sem === 44) ok(!cic || !cic.copa, `${ano}: sorteio antes da semana 45`);
    if (sem === 45 && cic) sorteioNa45 = !!cic.copa && cic.copa.grupos.every(g => !g.jogos.length);
    if (sem === 47 && cic && cic.copa) ok(!cic.copa.fim && cic.copa.mata.semis && cic.copa.mata.semis.every(j => j.f), `${ano}: semis fora da semana 47`);
    if (sem === 48 && cic && cic.copa) fimNa48 = !!cic.copa.fim;
  }
  if (ano % 2) continue;
  const cic = G.copa.ciclos[ano], C = cic && cic.copa;
  ok(cic && !cic.arquivado, `${ano}: ciclo arquivado antes da virada`);
  ok(sorteioNa45, `${ano}: sorteio fora da semana 45`);
  ok(fimNa48, `${ano}: final fora da semana 48`);
  if (!C) { ok(false, `${ano}: Copa não aconteceu`); continue; }
  const ed = G.copa.edicoes.find(e => e.ano === ano);
  ok(ed, `${ano}: edição não registrada`);
  ok(C.grupos.length === 8 && C.grupos.every(g => g.paises.length === 4 && g.jogos.length === 6 && g.classificados.length === 2), `${ano}: grupos fora do formato`);
  ok(C.grupos[0].paises[0] === cic.sede, `${ano}: sede fora do grupo A`);
  const conts = C.grupos.map(g => { const c = {}; g.paises.forEach(p => { const x = m.infoSelecao(p).cont; c[x] = (c[x] || 0) + 1; }); return Math.max(...Object.values(c)); });
  const mata = Object.values(C.mata).flat();
  ok(mata.length === 16 && mata.every(j => j.f && j.f.bo === 5), `${ano}: mata-mata fora do formato (${mata.length})`);
  ok(C.grupos.flatMap(g => g.jogos).every(f => f.bo === 3), `${ano}: grupo fora de MD3`);
  const D = {1: [46, 1], 2: [46, 3], 3: [46, 5], 'Oitavas de final': [47, 1], 'Quartas de final': [47, 3], Semifinal: [47, 5], 'Disputa do bronze': [48, 5], Final: [48, 6]};
  const datas = C.grupos.flatMap(g => g.jogos.map(f => [f, D[f.rodada]])).concat(mata.map(j => [j.f, D[j.f.fase]]));
  ok(datas.every(([f, q]) => q && f.sem === q[0] && f.dia === q[1]), `${ano}: série fora da data do calendário`);
  ok(new Set(C.podio).size === 4, `${ano}: pódio repetido`);
  const med = {ouro: 0, prata: 0, bronze: 0};
  for (const p of Object.values(G.jogadores)) if (p.copa) for (const k2 in med) if (p.copa[k2].includes(ano)) med[k2]++;
  ok(med.ouro >= 7 && med.prata >= 7 && med.bronze >= 7, `${ano}: medalhas faltando ${JSON.stringify(med)}`);
  ok(ed && ed.mvp && ed.timeIdeal.length === 5, `${ano}: sem MVP ou time ideal`);
  /* a premiação: a maior do jogo, dividida entre jogadores, comissão, clubes e cena local */
  const pr = ed && ed.premio, pc = pr && pr.podio[ed.campeao], champ = (G.torneios.champions || {}).premio || 0;
  ok(pc && pc.total > champ, `${ano}: prêmio do campeão (${pc && pc.total}) não é o maior do jogo (Champions ${champ})`);
  ok(pc && Math.abs(pc.jogadores + pc.comissao + pc.clubes + pc.cena - pc.total) <= 2, `${ano}: divisão do prêmio não fecha`);
  ok(pc && pc.cena > 0 && pc.cenaClubes > 0, `${ano}: cena local do campeão sem clube`);
  ok(pr && Object.keys(pr.bonus).length > 20, `${ano}: bônus de convocação em poucos clubes`);
  if (pr) console.log(`  premiação: total ${(pr.total / 1e6).toFixed(2)}M · campeão ${pc.total / 1e3}k (jog ${pc.jogadores / 1e3}k, com ${pc.comissao / 1e3}k, clubes ${pc.clubes / 1e3}k, cena ${pc.cena / 1e3}k em ${pc.cenaClubes} clubes) · bônus em ${Object.keys(pr.bonus).length} clubes`);
  const rk = Object.entries(cic.pontosCopa).filter(([p]) => cic.classificados.includes(p)).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const pos = rk.indexOf(ed.campeao) + 1; posCampeao.push(pos);
  const nome = id => ed.nomes[id] || id;
  console.log(`\n${ano} · ${cic.edicao}ª, ${cic.nomeSede}${ed.cidade ? ' (' + ed.cidade + ')' : ''} — 🥇 ${sig(ed.campeao)} (${pos}º do ranking) ${ed.final.v === ed.final.a ? ed.final.wa + '–' + ed.final.wb : ed.final.wb + '–' + ed.final.wa} 🥈 ${sig(ed.vice)} · 🥉 ${sig(ed.bronze)} · 4º ${sig(ed.quarto)}`);
  console.log(`  grupos: ${C.grupos.map(g => g.letra + ':' + g.paises.map(sig).join('/')).join(' ')}  (máx. do mesmo continente por grupo: ${Math.max(...conts)})`);
  console.log(`  caminho: ${ed.caminho.map(c => c.fase.replace('Grupo ', 'G') + ' ' + sig(c.adv) + ' ' + c.pro + '–' + c.contra).join(' · ')}`);
  console.log(`  MVP ${nome(ed.mvp)} · time ideal ${ed.timeIdeal.map(nome).join(', ')} · técnico ${ed.tecnicoCampeao && G.staff[ed.tecnicoCampeao] ? G.staff[ed.tecnicoCampeao].nome : '—'} · medalhas ${JSON.stringify(med)}`);
}
/* o legado */
const eds = G.copa.edicoes, J = m.jogadoresNaHistoria(), P = m.paisesNaHistoria();
const ouros = J.reduce((s, j) => s + j.ouro.length, 0);
ok(ouros >= eds.length * 7, `legado: ${ouros} medalhas de ouro para ${eds.length} Copas`);
ok(J.every(j => new Set(j.ed).size === j.ed.length && new Set(j.mvp).size === j.mvp.length), 'legado: ano repetido no hall');
ok(P.reduce((s, x) => s + x.titulos, 0) === eds.length, 'legado: títulos dos países não batem com as edições');
ok(m.timesLendarios().length === eds.length && m.finaisHistoricas().length === eds.length, 'legado: times lendários ou finais faltando');
const campeoesVivos = Object.values(G.jogadores).filter(p => m.campeaoMundial(p)).length;
console.log(`\nlegado: ${Object.keys(G.copa.hall).length} jogadores no hall · ${campeoesVivos} campeões do mundo em atividade (carta especial)`);
console.log('países: ' + P.filter(x => x.titulos).map(x => `${sig(x.pais)} ${x.titulos}`).join(' · '));
console.log('mais títulos: ' + J.slice(0, 5).map(j => `${j.n} (${j.ouro.length}🥇 ${j.prata.length}🥈 ${j.bronze.length}🥉)`).join(' · '));
console.log('técnicos: ' + m.tecnicosNaHistoria().slice(0, 3).map(t => `${t.n} ${t.titulos.length}`).join(' · '));
console.log('recordes: ' + m.recordesDaCopa().map(r => `${r.tit}: ${r.quem} ${r.valor}`).join(' | '));
const fin = m.finaisHistoricas().map(f => `${f.ano} ${f.pro}-${f.contra}${f.tags.length ? ' [' + f.tags.join(', ') + ']' : ''}`);
console.log('finais: ' + fin.join(' · '));
const copaKB = JSON.stringify(G.copa).length / 1024;
ok(Object.entries(G.copa.ciclos).every(([a, c]) => +a >= G.ano - 1 || c.arquivado), 'ciclo antigo sem arquivar');
console.log(`\ncampeões vieram do ranking em: ${posCampeao.join(', ')} · G.copa pesa ${copaKB.toFixed(0)} KB · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
ok(posCampeao.every(p => p > 0 && p <= 16), 'campeão de fora das 16 melhores');
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
