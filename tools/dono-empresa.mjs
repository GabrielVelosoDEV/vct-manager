#!/usr/bin/env node
/* Modo Dono, a empresa (fase 4): avança uma temporada de Dono puro sem tela e
   confere o valor de mercado, as receitas novas (loja, itens, criadores), o
   empréstimo, o investidor e as quatro reuniões do conselho. Depois força os
   dois jeitos de perder o time: falência (e o sócio-interventor do Fácil) e
   perda de controle pelo conselho.
   Uso: node tools/dono-empresa.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={ev:s=>eval(s),get G(){return G;}};';
const tmp = resolve(raiz, '.de.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };
const novo = (dif) => m.ev(`criarMundo(${semente});montarCalendario();G.dificuldade='${dif || 'normal'}';
  const c=G.regioes.EMEA.t1.map(id=>G.times[id]).sort((a,b)=>b.prestigio-a.prestigio)[5];G.meuTime=c.id;
  criarManager('Teste','dono',{variante:'puro',perfilDono:'investidor'});tornarVoceDono(c);
  definirMandato({meta:'realista',verba:300000,diretriz:'livre'});c.id`);

/* 1. uma temporada inteira */
const id = novo();
const r = m.ev(`(()=>{const t=G.times['${id}'];const v0=valorDaOrg(t);
  melhorarLoja();mudarCriadores(1);mudarCriadores(1);
  const emp=tomarEmprestimo(Math.min(limiteEmprestimo(t),500000),2);
  gerarOfertas('teste');const of=empresa().ofertas[0];const ac=of?aceitarOferta(of.id):null;
  let n=0;const a=G.ano;
  while(G.ano===a&&n<80){if(mandatoPendente())definirMandato({meta:'realista',verba:0,diretriz:'livre'});
    avancar();n++;
    if(G.conselhoPendente){const rr=G.conselhoPendente;G.conselhoPendente=null;for(const c of rr.cartas)decidirCarta(rr,c.id,c.id!=='dividendo');}}
  const e=empresa();
  return {v0,v:valorDaOrg(t),n,emp:emp.ok,ac:ac&&ac.ok,hist:e.hist.length,reu:e.reunioes.length,rec:e.receitas,
    loja:e.loja,cri:e.criadores,humor:e.humor,inv:e.investidores.length,metas:(e.reunioes.find(x=>x.tri===4)||{}).metas,perdeu:!!e.perdeu,caixa:t.caixa};})()`);
ok(r.emp, 'não conseguiu tomar empréstimo');
ok(r.ac, 'não conseguiu aceitar investidor');
ok(r.hist >= 50, 'histórico do valor curto: ' + r.hist);
ok(r.reu === 4, 'o conselho não se reuniu quatro vezes: ' + r.reu);
ok(r.metas && r.metas.length === 1, 'a meta do investidor não foi conferida no fim do ano');
ok(r.v > 0, 'valor de mercado zerado');
console.log(`temporada: valor ${Math.round(r.v0 / 1e3)}k → ${Math.round(r.v / 1e3)}k · ${r.n} semanas · conselho ${r.reu}x · humor ${r.humor} · meta ${r.metas && r.metas[0] ? (r.metas[0].ok ? 'cumprida' : 'perdida') : '—'}${r.perdeu ? ' · PERDEU' : ''}`);

/* 2. falência no Normal */
novo('normal');
const f = m.ev(`(()=>{const t=G.times[G.meuTime];let n=0;
  while(!empresa().perdeu&&n<14){t.caixa=-50000000;avancar();n++;G.conselhoPendente=null;}
  return {n,perdeu:empresa().perdeu,dono:t.dono.nome};})()`);
ok(f.perdeu && f.perdeu.motivo === 'falencia', 'oito semanas no vermelho não quebraram a organização');
ok(f.n >= 8, 'quebrou cedo demais: ' + f.n + ' semanas');
console.log(`falência: quebrou em ${f.n} semanas · o clube passa para "${f.dono}"`);

/* 3. falência no Fácil: o interventor salva uma vez */
novo('facil');
const g = m.ev(`(()=>{const t=G.times[G.meuTime];let n=0;
  while(!empresa().interventor&&n<14){t.caixa=-5000000;avancar();n++;G.conselhoPendente=null;}
  return {n,interv:!!empresa().interventor,perdeu:!!empresa().perdeu,caixa:t.caixa,fatia:fatiasDaOrg(t).minha};})()`);
ok(g.interv && !g.perdeu && g.caixa > 0, 'no Fácil o sócio-interventor não salvou');
console.log(`Fácil: interventor em ${g.n} semanas · caixa ${Math.round(g.caixa / 1e3)}k · sua fatia ${Math.round(g.fatia * 100)}%`);

/* 4. perda de controle */
novo('normal');
const h = m.ev(`(()=>{const t=G.times[G.meuTime];const e=empresa();
  e.investidores.push({id:'x',nome:'Fundo X',fatia:0.6,aporte:1,meta:'titulo',falhas:0,ano:G.ano,base:{caixa:t.caixa,torcida:t.torcida,ano:G.ano}});
  const passos=[];
  for(let ano=0;ano<2&&!e.perdeu;ano++){
    let n=0;const a=G.ano;
    while(G.ano===a&&n<80&&!e.perdeu){if(mandatoPendente())definirMandato({meta:'realista',verba:0,diretriz:'livre'});e.humor=5;avancar();n++;G.conselhoPendente=null;}
    passos.push({ano:a,ultimato:e.avisoControle,perdeu:!!e.perdeu});
  }
  return {passos,perdeu:e.perdeu};})()`);
ok(h.passos[0] && h.passos[0].ultimato && !h.passos[0].perdeu, 'sem ultimato no primeiro ano');
ok(h.perdeu && h.perdeu.motivo === 'controle', 'o conselho não afastou o dono no segundo ano');
console.log(`controle: ultimato em ${h.passos[0] && h.passos[0].ultimato} · afastado: ${h.perdeu ? h.perdeu.ano : 'não'}`);

console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
