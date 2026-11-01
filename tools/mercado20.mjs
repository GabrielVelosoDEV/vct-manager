#!/usr/bin/env node
/* Balanceamento do mercado em muitas temporadas.

   Uso: node tools/mercado20.mjs [temporadas=20] [semente=20260828]

   Roda o mundo sozinho (o seu clube fica parado, sem aceitar proposta) e
   imprime, por temporada, o que o mercado fez: negócios entre clubes por
   tipo, dinheiro movimentado, clubes no vermelho e em crise, índice
   salarial, agentes livres e quanto o topo concentra de talento. É o que
   diz se o mercado vivo não virou espiral: inflação, falência em cadeia ou
   três clubes juntando todo mundo bom. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,over,emCrise:typeof emCrise==="function"?emCrise:()=>false,get G(){return G;}};';
const tmp=resolve(raiz,'.m20.tmp.cjs');writeFileSync(tmp,bundle);
const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);

const anos=parseInt(process.argv[2])||20, semente=parseInt(process.argv[3])||20260828;
m.criarMundo(semente);m.montarCalendario();const G=m.G;G.meuTime=G.regioes.AMER.t1[0];
const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0;};
const k=v=>v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v/1e3)+'k';
const linhas=[];
console.log('ano  | entre clubes (compra multa troca empr pré) | taxas    maior  | verm crise | índice | livres | elenco | top4 x mediana T1');
for(let a=0;a<anos;a++){
  const ano=G.ano;let v=0;
  const snap={};for(const id in G.jogadores)snap[id]=G.jogadores[id].timeId;
  while(G.ano===ano&&v++<700)m.avancar();
  const tr=(G.transferencias||[]).filter(x=>x.ano===ano);
  let mud=0;for(const id in snap){const p=G.jogadores[id];if(p&&snap[id]&&p.timeId&&snap[id]!==p.timeId)mud++;}
  const n=t=>tr.filter(x=>x.tipo===t&&x.de).length;
  const taxas=tr.reduce((s,x)=>s+(x.taxa||0),0), maior=Math.max(0,...tr.map(x=>x.taxa||0));
  const times=Object.values(G.times);
  const verm=times.filter(t=>t.caixa<0).length, crise=times.filter(m.emCrise).length;
  const livres=G.livres.length, elenco=(times.reduce((s,t)=>s+t.elenco.length,0)/times.length).toFixed(1);
  const t1=times.filter(t=>t.tier===1).map(t=>{const tit=t.titulares.map(i=>G.jogadores[i]).filter(Boolean);return tit.reduce((s,p)=>s+m.over(p),0)/Math.max(1,tit.length);}).sort((x,y)=>y-x);
  const top4=t1.slice(0,4).reduce((s,x)=>s+x,0)/4, mediana=med(t1);
  const entre=['compra','multa','troca','emprestimo','precontrato'].map(n);
  const l={ano,mud,entre,taxas,maior,verm,crise,indice:G.indiceSalario||1,livres,elenco,top4,mediana};linhas.push(l);
  console.log(`${ano} | ${String(mud).padStart(3)} clube→clube · ${String(entre.reduce((s,x)=>s+x,0)).padStart(3)} (${entre.map(x=>String(x).padStart(3)).join(' ')})            | ${k(taxas).padStart(7)} ${k(maior).padStart(6)} | ${String(verm).padStart(4)} ${String(crise).padStart(5)} | ${(G.indiceSalario||1).toFixed(2).padStart(6)} | ${String(livres).padStart(6)} | ${elenco.padStart(6)} | ${top4.toFixed(1)} x ${mediana.toFixed(1)}`);
}
const ult=linhas.slice(-5), pri=linhas.slice(0,5);
const media=(l,f)=>(l.reduce((s,x)=>s+f(x),0)/l.length);
console.log('\nprimeiras 5 x últimas 5 temporadas:');
for(const [nome,f] of [['clube para clube',x=>x.mud],['negócios registrados',x=>x.entre.reduce((s,y)=>s+y,0)],['taxas movimentadas',x=>x.taxas],['clubes no vermelho',x=>x.verm],['clubes em crise',x=>x.crise],['índice salarial',x=>x.indice],['agentes livres',x=>x.livres],['top4 - mediana T1',x=>x.top4-x.mediana]])
  console.log('  '+nome.padEnd(24)+String(+media(pri,f).toFixed(2)).padStart(12)+String(+media(ult,f).toFixed(2)).padStart(12));
