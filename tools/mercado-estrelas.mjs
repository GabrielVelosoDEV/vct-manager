#!/usr/bin/env node
/* Mede quem troca de clube ao longo das temporadas: por faixa de over, por
   idade, e quantos dos 50 melhores mudaram de time num ano. Confere também
   que só clubes da liga principal disputam o Masters.
   Uso: node tools/mercado-estrelas.mjs [semente] [temporadas] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')+'\nmodule.exports={ev:s=>eval(s),get G(){return G;}};';
const tmp=resolve(raiz,'.me.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
const semente=+(process.argv[2]||20260828),anos=+(process.argv[3]||3);
m.ev(`criarMundo(${semente});montarCalendario();G.meuTime=G.regioes.AMER.t1[0];`);
const G=m.G;let falhas=0;
const faixa=o=>o>=88?'88+':o>=80?'80-87':o>=72?'72-79':'<72';
const tot={};const totBase={};
for(let a=0;a<anos;a++){
  const snap={},ov={},idade={};
  for(const id in G.jogadores){const p=G.jogadores[id];snap[id]=p.timeId;ov[id]=m.ev(`over(G.jogadores['${id}'])`);idade[id]=p.idade;}
  const top=Object.keys(snap).filter(id=>snap[id]&&G.times[snap[id]].tier===1).sort((x,y)=>ov[y]-ov[x]).slice(0,50);
  const ano=G.ano;let v=0;
  let mastersRuim=[];
  while(G.ano===ano&&v++<900){m.ev('avancar()');
    for(const k of ['masters1','masters2'])for(const id of (G.qual&&G.qual[k]||[]))if(G.times[id]&&(G.times[id].tierAno||G.times[id].tier)!==1)mastersRuim.push(k+':'+G.times[id].tag);}
  /* quem jogou o Masters de fato */
  const porFaixa={},base={};let topMud=0,jovens=0,mud=0;
  for(const id in snap){
    if(!snap[id]||!G.jogadores[id])continue;
    const f=faixa(ov[id]);base[f]=(base[f]||0)+1;
    const p=G.jogadores[id];
    if(p.timeId&&p.timeId!==snap[id]){porFaixa[f]=(porFaixa[f]||0)+1;mud++;if(idade[id]<=21)jovens++;}
  }
  for(const id of top){const p=G.jogadores[id];if(p&&p.timeId&&p.timeId!==snap[id])topMud++;}
  console.log(`${ano}: ${mud} trocas entre clubes · ${topMud}/50 dos melhores mudaram · ${jovens} com até 21 anos`);
  console.log('   por faixa de over: '+['<72','72-79','80-87','88+'].map(f=>`${f} ${porFaixa[f]||0}/${base[f]||0} (${Math.round((porFaixa[f]||0)/(base[f]||1)*100)}%)`).join(' · '));
  const u=[...new Set(mastersRuim)];
  if(u.length){falhas++;console.log('   FALHA: clube do Challengers no Masters: '+u.join(', '));}
  for(const f in porFaixa)tot[f]=(tot[f]||0)+porFaixa[f];
}
console.log(falhas?`\n${falhas} falha(s)`:'\nok: só a liga principal no Masters');
process.exit(falhas?1:0);
