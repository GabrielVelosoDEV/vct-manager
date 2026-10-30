#!/usr/bin/env node
/* Confere a semeadura da pré-história e as rivalidades derivadas. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,legadoDe,rivaisDe,confrontosDe,'
  +'motivoRivalidade,HISTORIA_REAL,acharClubePorNome,paisDoClube,get G(){return G;}};';
const tmp=resolve(raiz,'.lg.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);m.montarCalendario();const G=m.G;
G.meuTime=G.regioes.AMER.t1[0];

const semDono=m.HISTORIA_REAL.filter(h=>!m.acharClubePorNome(h.campeao));
console.log(`pré-história: ${m.HISTORIA_REAL.length} títulos de 2021 a 2025`);
console.log(`  campeões que não existem mais: ${[...new Set(semDono.map(h=>h.campeao))].join(', ')||'nenhum'}`);
const comTitulo=Object.values(G.times).filter(t=>t.tier===1&&(t.titulos||[]).length);
console.log(`  clubes de Tier 1 com história: ${comTitulo.length} de 48`);
console.log('\nmaiores legados:');
Object.values(G.times).filter(t=>(t.titulos||[]).length)
  .sort((a,b)=>(b.legado||0)-(a.legado||0)).slice(0,8)
  .forEach(t=>{const l=m.legadoDe(t);
    console.log(`  ${t.tag.padEnd(5)} ${String(l.total).padStart(2)} título(s), ${l.internacionais} internacional(is)`+
      `, peso ${l.peso.toFixed(2)}, torcida ${t.torcida}`);});
const t2=Object.values(G.times).filter(t=>t.tier===2);
const pr=[...new Set(t2.map(t=>t.prestigio))];
console.log(`\nTier 2: ${pr.length===1?'prestígio '+pr[0]+' para todos (uniforme ✓)'
  :'FALHA — '+pr.length+' prestígios diferentes: '+pr.slice(0,6).join(', ')}`);
console.log(`        torcida ${Math.min(...t2.map(t=>t.torcida))}–${Math.max(...t2.map(t=>t.torcida))}`+
  `  ·  clubes com país definido: ${t2.filter(t=>m.paisDoClube&&m.paisDoClube(t)).length} de ${t2.length}`);
if(pr.length!==1)process.exitCode=1;

console.log('\nsimulando 4 temporadas para as rivalidades aparecerem…');
for(let k=0;k<4;k++){const alvo=G.ano+1;let v=0;while(G.ano<alvo&&v++<600)m.avancar();}
const meu=G.times[G.meuTime];
console.log(`\nrivais do ${meu.tag}:`);
for(const r of m.rivaisDe(meu.id,4))
  console.log(`  ${r.time.tag.padEnd(5)} nota ${r.nota.toFixed(2)} — ${m.motivoRivalidade(meu,r)}`);
const total=Object.keys(G.h2h||{}).length;
console.log(`\nconfrontos registrados no mundo: ${total} pares`);
