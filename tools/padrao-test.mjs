#!/usr/bin/env node
/* Testa padronizarBase() e gerarElencosJS() sobre um mundo "sujo": monta o
   mundo, bagunça overs de propósito e confere que a padronização recoloca
   tudo na faixa sem apagar o que era edição manual. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,over,overStaff,aplicarOver,padronizarBase,gerarElencosJS,'
  +'FAIXAS,CARGOS,REGIONS,get G(){return G;}};';
const tmp=resolve(raiz,'.pt.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);const G=m.G;
let falhas=0;
const ok=(c,msg)=>{if(!c){console.log('  FALHA:',msg);falhas++;}else console.log('  ok:',msg);};

/* --- bagunça: joga metade do Tier 2 para fora da faixa e zera agentes --- */
const t2=Object.values(G.times).filter(t=>t.tier===2);
for(const t of t2.slice(0,16))for(const id of t.elenco){
  m.aplicarOver(G.jogadores[id],40+Math.floor(Math.random()*15));
  G.jogadores[id].agentes=[];
}
/* --- marca overs de Tier 1 para conferir que sobrevivem --- */
const t1=Object.values(G.times).filter(t=>t.tier===1);
const antes=new Map();
for(const t of t1)for(const id of t.elenco)antes.set(id,m.over(G.jogadores[id]));

const conta=m.padronizarBase();
console.log('\npadronizarBase:',JSON.stringify(conta));

const ovT2=[],ovT1=[],ovSt1=[],ovSt2=[],ags=[];
for(const t of Object.values(G.times)){
  for(const id of t.elenco){const p=G.jogadores[id];
    (t.tier===1?ovT1:ovT2).push(m.over(p));ags.push((p.agentes||[]).length);}
  for(const c of m.CARGOS){const s=G.staff[t.comissao[c.id]];
    if(s)(t.tier===1?ovSt1:ovSt2).push(m.overStaff(s));}
}
const dentro=(a,[lo,hi])=>a.every(x=>x>=lo&&x<=hi);
console.log('\ninvariantes:');
ok(dentro(ovT2,m.FAIXAS.jogador[2]),`jogadores T2 em ${m.FAIXAS.jogador[2]} (achado ${Math.min(...ovT2)}–${Math.max(...ovT2)})`);
ok(dentro(ovT1,m.FAIXAS.jogador[1]),`jogadores T1 em ${m.FAIXAS.jogador[1]} (achado ${Math.min(...ovT1)}–${Math.max(...ovT1)})`);
ok(dentro(ovSt1,m.FAIXAS.comissao[1]),`comissão T1 em ${m.FAIXAS.comissao[1]} (achado ${Math.min(...ovSt1)}–${Math.max(...ovSt1)})`);
ok(dentro(ovSt2,m.FAIXAS.comissao[2]),`comissão T2 em ${m.FAIXAS.comissao[2]} (achado ${Math.min(...ovSt2)}–${Math.max(...ovSt2)})`);
ok(ags.every(n=>n===3),'todo jogador com exatamente 3 agentes');
const n99=ovSt1.filter(x=>x>=99).length;
ok(n99<=2,`no máximo 2 na comissão com 99 (achado ${n99})`);

/* edições de Tier 1 preservadas */
let mexidos=0,abaixo=0;
for(const[id,ov]of antes){const novo=m.over(G.jogadores[id]);
  if(ov>=80&&novo!==ov)mexidos++; if(ov<80)abaixo++;}
ok(mexidos===0,`nenhum over de T1 >=80 foi reescrito (${abaixo} estavam abaixo do piso e subiram)`);

/* --- exportação --- */
const js=m.gerarElencosJS();
writeFileSync(resolve(raiz,'.elencos-teste.js'),js);
const vm=await import('node:vm');const ctx={};vm.createContext(ctx);
vm.runInContext(js+';globalThis.__e=ELENCOS_REAIS;',ctx);
const tags=Object.keys(ctx.__e);
const tot=tags.reduce((s,k)=>s+ctx.__e[k].length,0);
ok(tags.length>0,`elencos.js gerado: ${tags.length} times, ${tot} jogadores`);
ok(Object.values(ctx.__e).every(l=>l.every(r=>r.length===5&&typeof r[2]==='number')),
   'toda linha no formato completo [nick,função,over,idade,país]');
const nicks=new Set();let dup=0;
for(const k of tags)for(const r of ctx.__e[k]){if(nicks.has(r[0]))dup++;nicks.add(r[0]);}
ok(dup===0,`sem nick duplicado (${nicks.size} únicos)`);
unlinkSync(resolve(raiz,'.elencos-teste.js'));
console.log(falhas?`\n${falhas} FALHA(S)`:'\nTODOS OK');
process.exit(falhas?1:0);
