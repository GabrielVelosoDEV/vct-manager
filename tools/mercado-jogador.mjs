#!/usr/bin/env node
/* Modo jogador (J5): duas temporadas com um jogador que cuida da carreira.
   Contrata empresário quando pode, pede 10% a mais em toda proposta, aceita
   a transferência para um clube melhor (prestígio ou divisão) e renova
   quando o clube oferece. Mede: propostas por tipo, negociações (acordo,
   contra, recusa, retirada), trocas de clube e o dinheiro.
   Alvo do plano: a carreira passa por pelo menos uma troca de clube
   negociada por você, e o dinheiro decide alguma coisa.
   Uso: node tools/mercado-jogador.mjs [inicio] [over] [temporadas] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,over,propostasJogador,negociarProposta,aceitarProposta,recusarProposta,simularTeste,candidatosEmpresario,contratarEmpresario,comprarSetup,alternarStaffPessoal,caixaJogador,get G(){return G;}};';
const tmp = resolve(raiz, '.mj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const [ini = 'challengers', ov = 76, anos = 2, semente = 20260828] = process.argv.slice(2);

m.criarMundo(+semente); m.montarCalendario();
const G = m.G;
m.criarManager('Teste', 'jogador', {});
const tier = ini === 'ranked' ? 0 : ini === 'challengers' ? 2 : 1;
const clube = tier ? G.regioes.AMER[tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[4] : null;
const p = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: 20, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
  estilo: 'mira', inicio: ini, over: +ov, pot: 90, timeId: clube && clube.id});
const visto = new Set(), tipos = {}, fins = {}, trocas = [];
const caixa0 = m.caixaJogador();
const ano0 = G.ano;
let semanas = 0, comprou = [];
while (G.ano < ano0 + +anos && semanas < 60 * +anos + 20) {
  /* dinheiro decide: empresário, setup e personal quando dá */
  if (!G.voce.empresario) { const c = m.candidatosEmpresario().filter(x => x.aceita && x.luvas <= m.caixaJogador() * 0.4).pop(); if (c && m.contratarEmpresario(c.nivel).ok) comprou.push('empresário ' + c.rot); }
  for (const id of ['monitor', 'perifericos', 'cadeira']) if (m.caixaJogador() > 15000) { const r = m.comprarSetup(id); if (r.ok) comprou.push(id); }
  if (!G.voce.staffP || !G.voce.staffP.personal) if (m.caixaJogador() > 30000 && m.alternarStaffPessoal('personal').ok) comprou.push('personal');
  for (const pr of m.propostasJogador().slice()) {
    if (!visto.has(pr.id)) { visto.add(pr.id); tipos[pr.tipo] = (tipos[pr.tipo] || 0) + 1; }
    if (pr.tipo === 'teste') { m.simularTeste(pr.id); continue; }
    const atual = p.timeId && G.times[p.timeId], destino = G.times[pr.clubeId];
    const melhor = !atual || destino.tier < atual.tier || (destino.tier === atual.tier && destino.prestigio > atual.prestigio + 5);
    if (pr.tipo === 'transferencia' && !melhor) { m.recusarProposta(pr.id); continue; }
    if (!pr.acordo) {
      const r = m.negociarProposta(pr.id, {salario: Math.round(pr.salario * 1.1)});
      fins[r.fim || 'erro'] = (fins[r.fim || 'erro'] || 0) + 1;
      if (r.fim === 'retirada') continue;
    }
    const de = atual ? atual.tag : 'livre';
    const r = m.aceitarProposta(pr.id);
    if (r.ok && pr.tipo !== 'renovacao') trocas.push(`${G.ano} s${G.semana}: ${de} → ${G.times[pr.clubeId].tag} (${pr.tipo}, ${Math.round(pr.salario)}/mês)`);
  }
  m.avancar(); semanas++;
}
console.log(`início ${ini} over ${ov} · ${semanas} semanas · over final ${m.over(G.jogadores[p.id])}`);
console.log('propostas:', JSON.stringify(tipos), '· negociação:', JSON.stringify(fins));
console.log('trocas de clube:', trocas.length ? '\n  ' + trocas.join('\n  ') : 'nenhuma');
console.log(`clube final ${p.timeId ? G.times[p.timeId].nome + ' (Tier ' + G.times[p.timeId].tier + ')' : 'livre'} · salário ${p.salario}/mês · contrato ${p.contrato} · caixa ${caixa0} → ${m.caixaJogador()} · comprou: ${comprou.join(', ') || 'nada'}`);
