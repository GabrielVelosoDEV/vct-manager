#!/usr/bin/env node
/* Valorant World Cup (C2): o ciclo e as eliminatórias.
   Roda temporadas inteiras sem clube do usuário e confere, a cada ano ímpar:
     · primeira semana do ano: sede anunciada e comissão escolhida;
     · semana 48: 16 convidadas (a sede entre elas) e 8 grupos de 3;
     · semanas 49 e 50: 3 séries MD3 por grupo;
     · semana 51: 32 classificados, sem repetição, dois de cada grupo.
   E, a cada virada, que as 40 seleções seguem com pelo menos 7 convocáveis.
   Uso: node tools/copa-ciclo.mjs [anos] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,convocaveis,paisesDaCopa,infoSelecao,tabelaGrupo,rankingPaises,SELECAO_MINIMO,get G(){return G;}};';
const tmp = resolve(raiz, '.cc.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const nums = process.argv.slice(2).filter(a => /^\d+$/.test(a)).map(Number);
const anos = nums[0] || 3, semente = nums[1] || 20260828;
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

m.criarMundo(semente); m.montarCalendario();
const G = m.G, sig = p => m.infoSelecao(p).sigla;
const t0 = Date.now();
for (let k = 0; k < anos; k++) {
  const ano = G.ano;
  let marcas = {}, primeira = true;
  while (G.ano === ano) {
    const sem = G.semana;
    m.avancar();
    const cic = G.copa && G.copa.ciclos && G.copa.ciclos[ano + 1];
    if (cic) {
      if (primeira) marcas.s1 = cic.anunciada && !!G.copa.comissao;   /* a 1ª semana jogada do ano (a virada pode pular a semana 1) */
      if (sem === 48) marcas.s48 = !!cic.convidadas && !!cic.grupos && !cic.grupos.some(g => g.jogos.length);
      if (sem === 49) marcas.s49 = cic.grupos.every(g => g.jogos.length === 2);
      if (sem === 50) marcas.s50 = cic.grupos.every(g => g.jogos.length === 3) && !cic.classificados;
      if (sem === 51) marcas.s51 = !!cic.classificados;
    }
    primeira = false;
  }
  const cic = G.copa.ciclos && G.copa.ciclos[ano + 1];
  if (ano % 2 === 1) {
    ok(cic, `${ano}: sem ciclo da Copa ${ano + 1}`);
    if (!cic) continue;
    ok(marcas.s1, `${ano}: sede/comissão não saíram na semana 1`);
    ok(marcas.s48, `${ano}: convites e sorteio fora da semana 48`);
    ok(marcas.s49 && marcas.s50, `${ano}: rodadas fora das semanas 49 e 50`);
    ok(marcas.s51, `${ano}: classificados fora da semana 51`);
    ok(cic.convidadas.length === 16 && cic.convidadas.includes(cic.sede), `${ano}: convidadas erradas`);
    ok(cic.classificados.length === 32 && new Set(cic.classificados).size === 32, `${ano}: não fechou 32 classificados distintos`);
    console.log(`\n${ano} → World Cup ${cic.ano} (${cic.edicao}ª, ${cic.nomeSede}) · convidadas: ${cic.convidadas.map(sig).join(' ')}`);
    for (const g of cic.grupos) {
      const t = m.tabelaGrupo(g, cic.pontosNoSorteio);
      ok(g.classificados.length === 2, `grupo ${g.letra} sem 2 classificados`);
      console.log(`  ${g.letra} ${g.cont.padEnd(5)} ` + t.map(x => `${sig(x.pais)} ${x.v}-${x.d} (${x.mp}:${x.mc})${g.classificados.includes(x.pais) ? '✓' : ' '}`).join('  ') +
        '   ' + g.jogos.map(f => `${sig(f.a)} ${f.wa}–${f.wb} ${sig(f.b)}`).join(', '));
    }
  }
  const curtas = m.paisesDaCopa().filter(p => m.convocaveis(p).length < m.SELECAO_MINIMO);
  ok(!curtas.length, `${ano}: seleções abaixo de 7 → ${curtas.join(', ')}`);
  console.log(`${ano} fechado · top 5 do ranking: ${m.rankingPaises().slice(0, 5).map(x => x.sigla + ' ' + x.pts).join(' · ')}${curtas.length ? ' · abaixo de 7: ' + curtas.join(',') : ''}`);
}
console.log(`\n${((Date.now() - t0) / 1000).toFixed(0)} s · ` + (falhas ? `${falhas} falha(s)` : 'ok'));
process.exit(falhas ? 1 : 0);
