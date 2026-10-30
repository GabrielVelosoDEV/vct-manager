#!/usr/bin/env node
/* FOTOGRAFIA DO MOTOR
   ------------------------------------------------------------------
   Grava o resultado round a round de trinta e poucos mapas e séries com semente
   fixa. Serve para uma coisa só, e ela é preciosa: separar refactor de mudança
   de regra.

   Foi escrita para partir simMapa() em abrirMapa/passoRound/fecharMapa — o
   refactor que permitiu o pedido de tempo existir de verdade — e provou, round
   a round, que o motor reescrito é o mesmo motor. Quando a mudança é de
   BALANCEAMENTO, a diferença é esperada: regrave a foto de propósito.

   Uso:
     node tools/motor.mjs            grava a foto atual
     node tools/motor.mjs conferir   compara com a foto gravada
*/

import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,simMapa,simPartida,srand,MAP_POOL,get G(){return G;},get semente(){return _s;}};';
const tmp=resolve(raiz,'.motor.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);m.montarCalendario();const G=m.G;
const ids=Object.keys(G.times).slice(0,10);
const linhas=[];
m.srand(4242);
for(let i=0;i<ids.length;i+=2){
  const A=ids[i],B=ids[i+1];
  for(const mp of (G.mapasAtivos||m.MAP_POOL).slice(0,6)){
    const r=m.simMapa(G.times[A],G.times[B],mp);
    linhas.push([mp,r.sa,r.sb,r.hist.length,r.vencedor===A?'A':'B',
      Object.values(r.st).reduce((s,x)=>s+x.k,0),
      r.hist.map(h=>(h.v?1:0)).join('')].join('|'));
  }
  const s=m.simPartida(A,B,3);
  linhas.push(['serie',s.wa,s.wb,s.mapas.length,s.mvp?'mvp':'-'].join('|'));
}
linhas.push('semente final|'+m.semente);
const alvo=resolve(raiz,'tools/motor.baseline.txt');
const arg=process.argv[2];
if(arg==='conferir'&&existsSync(alvo)){
  const antes=readFileSync(alvo,'utf8').split('\n');
  const dif=linhas.filter((l,i)=>l!==antes[i]);
  if(dif.length){
    console.log('MUDOU ('+dif.length+' de '+linhas.length+' linhas):');
    dif.slice(0,4).forEach((l,i)=>console.log('  agora  '+l.slice(0,90)+'\n  antes  '+(antes[linhas.indexOf(l)]||'').slice(0,90)));
    process.exit(1);
  }
  console.log('IDÊNTICO — o motor devolve exatamente o mesmo de antes');
}else{
  writeFileSync(alvo,linhas.join('\n'));
  console.log(linhas.length+' linhas gravadas em tools/motor.baseline.txt');
}
