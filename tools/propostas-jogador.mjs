#!/usr/bin/env node
/* Modo jogador: quem manda proposta para um jogador de nível alto. Cria uma
   carreira com o jogador num clube grande do Tier 1, sem assistente (ninguém
   aceita nada), e registra cada proposta que aparece por duas temporadas:
   tier e prestígio do clube, se é da região, quantas vezes o mesmo clube
   voltou e se houve leilão. Roda com over 78, 86 e 93.
   Uso: node tools/propostas-jogador.mjs [temporadas] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n') + '\nmodule.exports={ev:s=>eval(s),get G(){return G;}};';
const tmp = resolve(raiz, '.pj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const anos = +(process.argv[2] || 2), semente = +(process.argv[3] || 20260828);
let falhas = 0;
for (const alvo of [78, 86, 93]) {
  m.ev(`criarMundo(${semente});montarCalendario();`);
  const G = m.G;
  const clube = G.regioes.AMER.t1.map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[3];
  m.ev(`criarManager('Teste','jogador',{});globalThis._p=criarCarreiraJogador({automatico:false,nick:'Teste${alvo}',pais:'BR',idade:22,funcao:'Duelista',
    agentes:['Jett','Raze','Neon'],estilo:'mira',inicio:'titular',over:${alvo},pot:${Math.min(99, alvo + 3)},timeId:'${clube.id}'});G.voce.autoContrato=false;`);
  const id = m.ev('_p.id');
  const vistas = new Map(), leiloes = [];
  const ano0 = G.ano; let sem = 0;
  while (G.ano < ano0 + anos && sem++ < 60 * anos + 10) {
    m.ev('avancar()');
    for (const pr of (G.voce.propostas || [])) if (!vistas.has(pr.id)) vistas.set(pr.id, {pr, quando: G.ano + '/' + G.semana});
    if (G.voce.leilao && !leiloes.includes(G.voce.leilao.id)) leiloes.push(G.voce.leilao.id);
    /* ninguém aceita: a proposta vence sozinha, como quem só olha */
  }
  const lista = [...vistas.values()].filter(x => x.pr.tipo !== 'renovacao' && !x.pr.doLeilao);
  const porClube = {};
  lista.forEach(x => { porClube[x.pr.clubeId] = (porClube[x.pr.clubeId] || 0) + 1; });
  const t2 = lista.filter(x => G.times[x.pr.clubeId].tier === 2).length;
  const fora = lista.filter(x => G.times[x.pr.clubeId].regiao !== 'AMER').length;
  const repet = Object.values(porClube).filter(n => n > 1).length, maxRep = Math.max(0, ...Object.values(porClube));
  const prest = lista.length ? Math.round(lista.reduce((s, x) => s + G.times[x.pr.clubeId].prestigio, 0) / lista.length) : 0;
  console.log(`over ${alvo} (${clube.tag}): ${lista.length} propostas de ${Object.keys(porClube).length} clubes · Tier 2: ${t2} · de outra região: ${fora} · prestígio médio ${prest} · clubes que repetiram: ${repet} (máx ${maxRep}x) · leilões: ${leiloes.length}`);
  console.log('   ' + Object.entries(porClube).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${G.times[t].tag}(T${G.times[t].tier})×${n}`).join(' '));
  if (alvo >= 86 && lista.length && t2 / lista.length > 0.15) { falhas++; console.log('   FALHA: Tier 2 demais para um jogador top'); }
  if (maxRep > anos + 1) { falhas++; console.log('   FALHA: o mesmo clube mandou proposta ' + maxRep + ' vezes'); }
}
console.log(falhas ? falhas + ' falha(s)' : 'ok');
process.exit(falhas ? 1 : 0);
