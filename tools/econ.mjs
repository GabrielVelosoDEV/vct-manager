#!/usr/bin/env node
/* Composição da receita por divisão: quanto vem de marca e quanto da liga. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,receitaPatrocinio,aporteLiga,receitaAnual,marca,VAGAS,get G(){return G;}};';
const tmp=resolve(raiz,'.ec.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);const G=m.G;
const md=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
for(const tier of[1,2]){
  const ts=Object.values(G.times).filter(t=>t.tier===tier);
  const pat=ts.map(m.receitaPatrocinio),ap=ts.map(m.aporteLiga),tot=ts.map(m.receitaAnual);
  const torc=ts.map(t=>t.torcida);
  console.log(`TIER ${tier}: patrocínio med ${Math.round(md(pat)/1000)}k (${Math.round(md(pat)/md(tot)*100)}%)`+
    ` | aporte ${Math.round(md(ap)/1000)}k | total ${Math.round(md(tot)/1000)}k`+
    ` | min ${Math.round(Math.min(...tot)/1000)}k max ${Math.round(Math.max(...tot)/1000)}k`+
    ` | torcida ${Math.min(...torc)}–${Math.max(...torc)}`);
}
const vazias=Object.values(G.times).flatMap(t=>m.VAGAS.filter(v=>!t.patrocinios[v.id]).map(v=>t.nome+'/'+v.id));
console.log('vagas sem marca:',vazias.length, vazias.slice(0,5).join(', '));
const niveis={};
for(const t of Object.values(G.times)){const mk=m.marca(t.patrocinios.master);if(mk)niveis[mk.nivel]=(niveis[mk.nivel]||0)+1;}
console.log('nível da marca máster por clube:',JSON.stringify(niveis));
