#!/usr/bin/env node
/* Fotografa a distribuição de over, potencial, comissão e agentes no ano 0.
   Serve para comparar antes/depois de qualquer mexida em padronização. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,over,overStaff,folhaStaff,CARGOS,REGIONS,get G(){return G;}};';
const tmp=resolve(raiz,'.dist.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(parseInt(process.argv[2])||20260828);
const G=m.G;
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))];};
const linha=(rot,a)=>console.log(`  ${rot.padEnd(22)} n=${String(a.length).padStart(4)}  min ${q(a,0)}  p25 ${q(a,.25)}  med ${q(a,.5)}  p75 ${q(a,.75)}  max ${q(a,.999)}  méd ${(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1)}`);

for(const tier of [1,2]){
  const times=Object.values(G.times).filter(t=>t.tier===tier);
  const jog=[],pot=[],gap=[],st=[],folha=[],ag=[];
  for(const t of times){
    folha.push(m.folhaStaff(t));
    for(const id of t.elenco){const p=G.jogadores[id];jog.push(m.over(p));pot.push(p.pot);gap.push(p.pot-m.over(p));ag.push((p.agentes||[]).length);}
    for(const c of m.CARGOS){const s=t.comissao&&t.comissao[c.id]?G.staff[t.comissao[c.id]]:null;if(s)st.push(m.overStaff(s));}
  }
  console.log(`\n--- TIER ${tier} (${times.length} times) ---`);
  linha('over jogadores',jog); linha('potencial',pot); linha('folga pot-over',gap);
  linha('over comissão',st); linha('folha comissão',folha); linha('agentes/jogador',ag);
  const n99=st.filter(x=>x>=99).length,n98=st.filter(x=>x>=98).length,n95=st.filter(x=>x>=95).length;
  console.log(`  comissão: ${n99} com 99, ${n98} com 98+, ${n95} com 95+`);
}
const jovens=Object.values(G.jogadores).filter(p=>p.idade<=19);
console.log(`\njogadores <=19: ${jovens.length}  folga média ${(jovens.reduce((s,p)=>s+p.pot-m.over(p),0)/jovens.length).toFixed(1)}`);
const velhos=Object.values(G.jogadores).filter(p=>p.idade>=27);
console.log(`jogadores >=27: ${velhos.length}  folga média ${(velhos.reduce((s,p)=>s+p.pot-m.over(p),0)/velhos.length).toFixed(1)}`);
