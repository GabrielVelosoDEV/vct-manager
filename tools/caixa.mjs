#!/usr/bin/env node
/* Para onde vai o dinheiro. Roda N temporadas e mostra a distribuição de caixa,
   quanto de receita virou folha, custeio e obra, e quem termina no vermelho.
   Uso: node tools/caixa.mjs [temporadas] [semente] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
writeFileSync(resolve(raiz,'.cx.tmp.cjs'),ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,receitaAnual,custeioAnual,receitaLivre,folhaAnual,'
  +'tetoFolhaDe,ESTRUTURA_MAX,get G(){return G;}};');
const m=createRequire(import.meta.url)(resolve(raiz,'.cx.tmp.cjs'));
unlinkSync(resolve(raiz,'.cx.tmp.cjs'));

const anos=parseInt(process.argv[2]||'10',10), semente=parseInt(process.argv[3]||'20260828',10);
m.criarMundo(semente);m.montarCalendario();const G=m.G;
const alvo=G.ano+anos;
while(G.ano<alvo)m.avancar();

const k=v=>Math.round(v/1000)+'k';
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
const q=(a,f)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*f))];};

console.log(`${anos} temporadas · semente ${semente}\n`);
for(const tier of[1,2]){
  const ts=Object.values(G.times).filter(t=>t.tier===tier);
  const cx=ts.map(t=>t.caixa);
  console.log(`TIER ${tier}  caixa: min ${k(q(cx,0))} | p10 ${k(q(cx,.1))} | mediana ${k(q(cx,.5))}`+
              ` | p90 ${k(q(cx,.9))} | máx ${k(q(cx,.999))}`);
  const rec=ts.map(m.receitaAnual), cus=ts.map(m.custeioAnual), fol=ts.map(m.folhaAnual);
  const i=ts.map((t,j)=>({t,sobra:rec[j]-cus[j]-fol[j]}));
  console.log(`         receita mediana ${k(q(rec,.5))} · custeio ${k(q(cus,.5))} (${pct(q(cus,.5),q(rec,.5))})`+
              ` · folha ${k(q(fol,.5))} (${pct(q(fol,.5),q(rec,.5))})`);
  console.log(`         sobra anual: mediana ${k(q(i.map(x=>x.sobra),.5))} | pior ${k(q(i.map(x=>x.sobra),0))}`);
  const est=ts.map(t=>Object.values(t.estrutura).reduce((a,b)=>a+b,0)/Object.keys(t.estrutura).length);
  console.log(`         estrutura média ${q(est,.5).toFixed(2)} de ${m.ESTRUTURA_MAX}`+
              ` · teto de folha mediano ${(q(ts.map(m.tetoFolhaDe),.5)*100).toFixed(0)}% da receita livre`);
  const vermelho=ts.filter(t=>t.caixa<0);
  if(vermelho.length)console.log('         no vermelho: '+vermelho.map(t=>t.nome+' '+k(t.caixa)+
      ' (sobra '+k(m.receitaAnual(t)-m.custeioAnual(t)-m.folhaAnual(t))+')').join(', '));
  console.log('');
}
