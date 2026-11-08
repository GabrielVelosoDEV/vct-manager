#!/usr/bin/env node
/* Mede a régua dos prêmios do ano: de onde vem o MVP.
   Roda temporadas inteiras e, em cada virada, compara a eleição de agora
   (desempenho + conquistas, com a cláusula do fora da curva) com a antiga
   (só a nota do ano), na mesma temporada:
     - que fração dos MVPs veio de time campeão internacional;
     - quantos chegaram ao menos a uma final internacional;
     - quantos foram "fora da curva";
     - a distância entre o melhor e o segundo melhor desempenho (é dela que
       sai a margem do fora da curva).
   Uso: node tools/premios.mjs [anos=10] [sementes=2] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const espiao=`
const _medidas=[];
premiarTemporada=(function(orig){return function(){
  const L=lerTemporada();
  const cand=Object.keys(L.jog).filter(id=>G.jogadores[id]&&L.jog[id].maps>=PREMIO_MIN_MAPAS);
  if(!cand.length)return orig();
  const antigo=cand.slice().sort((a,b)=>notaDoAno(L.jog[b])-notaDoAno(L.jog[a]))[0];
  const R=reguaDoAno(L.jog,cand);
  const porD=cand.slice().sort((a,b)=>R.zD[b]-R.zD[a]);
  const r=orig();
  const camp=id=>L.jog[id].lista.some(x=>(x.cl==='champions'||x.cl==='masters')&&x.i===0);
  const champ=id=>L.jog[id].lista.some(x=>x.cl==='champions'&&x.i===0);
  _medidas.push({ano:G.ano,
    novo:{nome:r.mvp.nome,tag:r.mvp.tag,camp:camp(r.mvp.id),champ:champ(r.mvp.id),fin:L.jog[r.mvp.id].finalInt,fora:!!r.mvp.fora,pD:r.mvp.pD,pC:r.mvp.pC},
    antigo:{nome:G.jogadores[antigo].nome,camp:camp(antigo),champ:champ(antigo),fin:L.jog[antigo].finalInt},
    gap:R.zD[porD[0]]-R.zD[porD[1]],topoFin:L.jog[porD[0]].finalInt,
    sel:r.selecao.filter(f=>camp(f.id)||L.jog[f.id].finalInt).length});
  return r;};})(premiarTemporada);
`;
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')+espiao
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,get G(){return G;},get medidas(){return _medidas;}};';

const anos=parseInt(process.argv[2])||10;
const sementes=parseInt(process.argv[3])||2;
const todas=[];
for(let k=0;k<sementes;k++){
  const tmp=resolve(raiz,`.pr${k}.tmp.cjs`);
  writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
  m.criarMundo(20260828+k*7919);m.montarCalendario();
  const G=m.G;G.meuTime=Object.values(G.times).find(t=>t.tier===1).id;
  const fim=G.ano+anos;let v=0;
  while(G.ano<fim&&v++<anos*80)m.avancar();
  todas.push(...m.medidas);
}

const pct=(n,d)=>d?Math.round(n/d*100)+'%':'—';
const n=todas.length;
console.log(' ano   MVP de agora              camp fin  fora  | MVP antigo          camp fin | gap D');
for(const x of todas)console.log(` ${x.ano}  ${(x.novo.nome+' ('+x.novo.tag+')').padEnd(24)} ${x.novo.camp?' ✓ ':' · '}  ${x.novo.fin?'✓':'·'}  ${x.novo.fora?' ★ ':'   '}  | ${x.antigo.nome.padEnd(18)}  ${x.antigo.camp?' ✓ ':' · '}  ${x.antigo.fin?'✓':'·'} | ${x.gap.toFixed(2)}${x.topoFin?'':' (sem final)'}`);
const c=(lado,k)=>todas.filter(x=>x[lado][k]).length;
console.log(`\n${n} temporadas`);
console.log(`                         agora   antes`);
console.log(`campeão internacional    ${pct(c('novo','camp'),n).padStart(5)}   ${pct(c('antigo','camp'),n).padStart(5)}`);
console.log(`campeão do Champions     ${pct(c('novo','champ'),n).padStart(5)}   ${pct(c('antigo','champ'),n).padStart(5)}`);
console.log(`final internacional      ${pct(c('novo','fin'),n).padStart(5)}   ${pct(c('antigo','fin'),n).padStart(5)}`);
console.log(`fora da curva            ${String(c('novo','fora')).padStart(5)}`);
const gaps=todas.filter(x=>!x.topoFin).map(x=>x.gap).sort((a,b)=>b-a);
console.log(`melhor desempenho sem final em ${gaps.length} de ${n}; distância para o 2º: ${gaps.map(g=>g.toFixed(2)).join(' ')}`);
console.log(`seleção do ano: média de ${(todas.reduce((s,x)=>s+x.sel,0)/n).toFixed(1)} de 5 com título ou final internacional`);
