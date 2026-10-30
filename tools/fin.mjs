#!/usr/bin/env node
/* Razão folha/receita por divisão no ano 0 — a métrica que a padronização
   não pode quebrar. É ela que decide se um clube sobrevive à temporada. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,over,overStaff,folhaStaff,get G(){return G;}};';
const tmp=resolve(raiz,'.fin.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);const G=m.G;
for(const tier of[1,2]){
  const ts=Object.values(G.times).filter(t=>t.tier===tier);
  let rj=[],rs=[],rt=[];
  for(const t of ts){
    const fj=t.elenco.reduce((s,i)=>s+G.jogadores[i].salario,0);
    const fs=m.folhaStaff(t);
    const semana=t.patroc/44-((fj+fs)*12)/44;
    rj.push(fj*12/t.patroc); rs.push(fs*12/t.patroc); rt.push(semana);
  }
  const md=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
  console.log(`TIER ${tier}: folha jogadores/patroc ${md(rj).toFixed(3)} | comissão/patroc ${md(rs).toFixed(3)}`+
              ` | total ${(md(rj)+md(rs)).toFixed(3)} | margem semanal mediana ${Math.round(md(rt)/1000)}k`);
}
