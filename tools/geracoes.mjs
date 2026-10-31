#!/usr/bin/env node
/* Força do circuito ao longo das temporadas: over dos titulares por divisão,
   topo do mundo, como os regens crescem por idade, agentes livres, tamanho dos
   elencos e peso do save. Uso: node tools/geracoes.mjs [temporadas] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {createRequire} from 'node:module';
const ordem=[...readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
writeFileSync('.ge.tmp.cjs',ordem.map(p=>readFileSync(p,'utf8')).join('\n')+'\nmodule.exports={criarMundo,montarCalendario,avancar,over,get G(){return G;}};');
const m=createRequire(import.meta.url)(process.cwd()+'/.ge.tmp.cjs');unlinkSync('.ge.tmp.cjs');
m.criarMundo(20260828);m.montarCalendario();const G=m.G;
const anos=+process.argv[2]||20;
const st=tier=>{const v=Object.values(G.times).filter(t=>t.tier===tier).flatMap(t=>t.titulares.map(i=>m.over(G.jogadores[i]))).sort((a,b)=>a-b);
  return `${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)} (p10 ${v[Math.floor(v.length*.1)]}, p90 ${v[Math.floor(v.length*.9)]})`;};
const top=()=>{const v=Object.values(G.jogadores).map(p=>m.over(p)).sort((a,b)=>b-a);return `${v[0]}/${v[9]}/${v[49]}`;};
console.log(`${G.ano} ini  T1 ${st(1)}  T2 ${st(2)}  top1/10/50 ${top()}  reais ${Object.values(G.jogadores).filter(p=>p.real).length}`);
for(let k=0;k<anos;k++){const a=G.ano;while(G.ano===a)m.avancar();
  const reg=Object.values(G.jogadores).filter(p=>!p.real);
  console.log(`${a} fim  T1 ${st(1)}  T2 ${st(2)}  top1/10/50 ${top()}  reais ${Object.values(G.jogadores).filter(p=>p.real).length} · jog ${Object.keys(G.jogadores).length}`);}
const ps=Object.values(G.jogadores).filter(p=>!p.real);
for(const [a,b] of [[15,17],[18,20],[21,23],[24,27],[28,31],[32,40]]){
  const g=ps.filter(p=>p.idade>=a&&p.idade<=b);if(!g.length)continue;
  const av=f=>(g.reduce((s,p)=>s+f(p),0)/g.length).toFixed(1);
  const pots=g.map(p=>p.pot).sort((x,y)=>y-x);
  console.log(`${a}-${b}: n ${g.length} over ${av(m.over)} pot ${av(p=>p.pot)} potTop ${pots.slice(0,5).join(',')} comClube ${g.filter(p=>p.timeId).length} T1 ${g.filter(p=>p.timeId&&G.times[p.timeId].tier===1).length}`);
}
console.log('save', (JSON.stringify(G).length/1e6).toFixed(2)+' MB', 'livres', G.livres.length);
const L=G.livres.map(i=>G.jogadores[i]);
const faixa=(f)=>{const c={};L.forEach(p=>{const k=f(p);c[k]=(c[k]||0)+1;});return JSON.stringify(c);};
console.log('livres por idade', faixa(p=>p.idade<=17?'<=17':p.idade<=20?'18-20':p.idade<=25?'21-25':p.idade<=30?'26-30':'31+'));
console.log('livres por over', faixa(p=>{const o=m.over(p);return o<65?'<65':o<72?'65-71':o<78?'72-77':o<84?'78-83':'84+';}));
const s=JSON.stringify(G);const parte=k=>(JSON.stringify(G[k]||'').length/1e6).toFixed(2);
console.log('save por parte: jogadores',parte('jogadores'),'times',parte('times'),'noticias',parte('noticias'),'historico',parte('historico'),'h2h',parte('h2h'),'resto', ((s.length-['jogadores','times','noticias','historico','h2h'].reduce((a,k)=>a+JSON.stringify(G[k]||'').length,0))/1e6).toFixed(2));
const p0=Object.values(G.jogadores)[5];console.log('um jogador',JSON.stringify(p0).length,Object.keys(p0).map(k=>k+':'+JSON.stringify(p0[k]).length).sort((a,b)=>+b.split(':')[1]-+a.split(':')[1]).slice(0,8).join(' '));
const tam={};Object.values(G.times).forEach(t=>{tam[t.elenco.length]=(tam[t.elenco.length]||0)+1});console.log('elencos',JSON.stringify(tam));
