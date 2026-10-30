#!/usr/bin/env node
/* Distribuição etária do circuito ao longo das temporadas, e em que idade as
   carreiras terminam. Sem isso, esticar a aposentadoria é chute. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,over,get G(){return G;}};';
const tmp=resolve(raiz,'.id.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(parseInt(process.argv[3])||20260828);m.montarCalendario();const G=m.G;
G.meuTime=G.regioes.AMER.t1[0];
const anos=parseInt(process.argv[2])||14;
/* Só conta como fim de carreira quem tinha clube. O corte do excedente de
   agentes livres também apaga jogadores, e misturar os dois puxava a mediana
   para baixo com gente de 24 anos que nunca se aposentou — foi assim que eu
   li errado o resultado na primeira rodada. */
const saidas=[];
let vivos=new Map();
for(const id in G.jogadores)vivos.set(id,{idade:G.jogadores[id].idade,tinhaClube:!!G.jogadores[id].timeId});
const q=(a,f)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(f*s.length)];};
console.log(' ano  idade dos titulares (min/med/máx)   >=30   >=35   over médio 30+');
for(let k=0;k<anos;k++){
  const alvo=G.ano+1;let v=0;
  while(G.ano<alvo&&v++<600)m.avancar();
  for(const[id,v2]of vivos)if(!G.jogadores[id]&&v2.tinhaClube)saidas.push(v2.idade+1);
  vivos=new Map();
  for(const id in G.jogadores)vivos.set(id,{idade:G.jogadores[id].idade,tinhaClube:!!G.jogadores[id].timeId});
  const tit=[];for(const tid in G.times)for(const i of G.times[tid].titulares){
    const p=G.jogadores[i];if(p)tit.push(p);}
  const id30=tit.filter(p=>p.idade>=30),id35=tit.filter(p=>p.idade>=35);
  const ov30=id30.length?(id30.reduce((s,p)=>s+m.over(p),0)/id30.length).toFixed(1):'—';
  console.log(` ${G.ano-1}   ${String(q(tit.map(p=>p.idade),0)).padStart(2)}/${
    String(q(tit.map(p=>p.idade),.5)).padStart(2)}/${String(q(tit.map(p=>p.idade),.999)).padStart(2)}`+
    `                  ${String(id30.length).padStart(4)}   ${String(id35.length).padStart(4)}   ${ov30}`);
}
saidas.sort((a,b)=>a-b);
if(saidas.length)console.log(`\nidade ao encerrar a carreira: p10 ${saidas[Math.floor(saidas.length*.1)]}`+
  ` · mediana ${saidas[Math.floor(saidas.length/2)]} · p90 ${saidas[Math.floor(saidas.length*.9)]}`+
  ` (${saidas.length} carreiras)`);
