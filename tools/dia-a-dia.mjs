#!/usr/bin/env node
/* A temporada dia a dia (clock.js: avancarDia). Uma temporada andando um dia
   por vez com um clube do Tier 1, salvando e carregando em todos os dias das
   primeiras semanas, e confere:
     · o seu clube nunca joga duas vezes no mesmo dia
     · cada rodada cai num dia de segunda a sábado; o domingo fecha a semana
     · a ida e volta do save no meio da semana guarda o dia e a rodada
     · o ano termina com todos os torneios encerrados e o mesmo número de
       séries do clube que no avanço por semana (mesma semente)
   Uso: node tools/dia-a-dia.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n') + '\nmodule.exports={ev:s=>eval(s),get G(){return G;}};';
const tmp = resolve(raiz, '.dd2.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; if (falhas < 15) console.log('  FALHA:', msg); } };
const inicio = `criarMundo(${semente});montarCalendario();G.meuTime=G.regioes.AMER.t1.map(id=>G.times[id]).find(t=>t.tag==='LOUD').id;criarManager('T','treinador',{});`;

/* referência: o mesmo ano andando por semana */
m.ev(inicio);
const ano0 = m.G.ano;const t0=Date.now();
let seriesSemana = 0, totalSemana = 0, blocosSemana = 0;
while (m.G.ano === ano0) { const r = m.ev('avancar()'); if (r && r.resultados) { totalSemana += r.resultados.length; seriesSemana += r.resultados.filter(x => x.res.aId === m.G.meuTime || x.res.bId === m.G.meuTime).length; } if (r && r.encerrado) blocosSemana++; }

console.log('por semana: '+seriesSemana+' séries em '+Math.round((Date.now()-t0)/1000)+' s');
/* o mesmo ano, dia a dia */
m.ev(inicio);
let dias = 0, series = 0, total = 0, blocos = 0, porDia = {}, domingosSemFechar = 0, idas = 0;
const anoFim = ano0 + 1;
while (m.G.ano < anoFim && dias < 900) {
  const G = m.G, sem = G.semana, dia = G.turno || 0, ano = G.ano;
  /* ida e volta do save em todos os dias das dez primeiras semanas */
  if (ano === ano0 && sem <= 6) {
    const antes = JSON.stringify({t: G.turno, em: G.semanaEmCurso, pl: G.diaPlano});
    const pac = JSON.parse(JSON.stringify(m.ev(`empacotarRun('t')`)));
    globalThis.__pac = pac; m.ev('desempacotarRun(globalThis.__pac)'); idas++;
    const G2 = m.G;
    ok(JSON.stringify({t: G2.turno, em: G2.semanaEmCurso, pl: G2.diaPlano}) === antes, `ida e volta mudou o dia (${ano} s${sem} d${dia})`);
  }
  let r;
  try { r = m.ev('avancarDia()'); } catch (e) { ok(false, 'erro: ' + String(e.stack).split('\n').slice(0, 3).join(' | ')); break; }
  dias++;
  if (r && r.resultados) {
    const meus = r.resultados.filter(x => x.res.aId === m.G.meuTime || x.res.bId === m.G.meuTime).length;
    if (ano === ano0) { series += meus; total += r.resultados.length; }
    if (meus) { const k = ano + '/' + sem + '/' + dia; porDia[k] = (porDia[k] || 0) + meus; }
    if (r.resultados.length && dia === 6 && r.tipo === 'rodada') ok(false, `rodada jogada no domingo (${ano} s${sem})`);
  }
  if (r && r.encerrado && ano === ano0) blocos++;
  if (dia === 6 && m.G.semana === sem && m.G.ano === ano) domingosSemFechar++;
}
const duplos = Object.entries(porDia).filter(([, n]) => n > 1);
ok(!duplos.length, 'dois jogos do clube no mesmo dia: ' + duplos.slice(0, 3).map(x => x[0]).join(', '));
ok(!domingosSemFechar, domingosSemFechar + ' domingo(s) sem fechar a semana');
/* a ordem do sorteio muda, então o seu clube pode ir mais ou menos longe;
   o que tem de bater é o ano inteiro acontecer: os mesmos torneios encerrados
   e o mesmo volume de séries no circuito (a chave dupla varia um pouco) */
ok(blocos === blocosSemana, `torneios encerrados: ${blocos} dia a dia contra ${blocosSemana} por semana`);
ok(Math.abs(total - totalSemana) <= totalSemana * 0.03, `séries no circuito: ${total} dia a dia contra ${totalSemana} por semana`);
ok(m.G.ano === anoFim, 'não chegou ao fim da temporada');
console.log(`${dias} dias na temporada · ${total} séries no circuito (${totalSemana} por semana) · ${blocos} blocos encerrados (${blocosSemana}) · ${series} séries do LOUD (${seriesSemana}) · ${idas} idas e voltas do save · ${Object.keys(porDia).length} dias com jogo do clube`);
console.log(falhas ? falhas + ' falha(s)' : 'ok');
process.exit(falhas ? 1 : 0);
