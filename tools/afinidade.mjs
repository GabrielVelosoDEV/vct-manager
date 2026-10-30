#!/usr/bin/env node
/* A afinidade de mapa vira PERFIL com o tempo, ou continua ruído?
   Mede a dispersão inicial e depois de algumas temporadas, e mostra se quem
   joga bem num mapa realmente sobe nele. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,afinidadeDe,afinidadeElenco,mapasDe,'
  +'MAP_POOL,over,simMapa,autoEscalar,get G(){return G;}};';
const tmp=resolve(raiz,'.af.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);m.montarCalendario();const G=m.G;
G.meuTime=Object.values(G.times).find(t=>t.tag==='SEN').id;

const foto=()=>{
  const todos=[];
  for(const id in G.jogadores){const p=G.jogadores[id];
    for(const mp of m.MAP_POOL)todos.push(m.afinidadeDe(p,mp));}
  const dp=Math.sqrt(todos.reduce((s,x)=>s+x*x,0)/todos.length);
  const fortes=todos.filter(x=>Math.abs(x)>=4).length;
  return{dp,fortes,n:todos.length};
};
const a=foto();
console.log(`início:  desvio ${a.dp.toFixed(2)} · ${Math.round(a.fortes/a.n*100)}% com opinião forte (|v|>=4)`);
const anos=parseInt(process.argv[2])||4;
for(let k=0;k<anos;k++){const alvo=G.ano+1;let v=0;while(G.ano<alvo&&v++<600)m.avancar();}
const b=foto();
console.log(`${anos} anos: desvio ${b.dp.toFixed(2)} · ${Math.round(b.fortes/b.n*100)}% com opinião forte`);

const t=G.times[G.meuTime];
console.log(`\nmelhores e piores mapas do ${t.tag}:`);
const porMapa=m.MAP_POOL.map(mp=>({mp,v:m.afinidadeElenco(t,mp)})).sort((x,y)=>y.v-x.v);
porMapa.slice(0,3).forEach(x=>console.log(`  + ${x.mp.padEnd(10)} ${x.v.toFixed(1)}`));
porMapa.slice(-3).forEach(x=>console.log(`  - ${x.mp.padEnd(10)} ${x.v.toFixed(1)}`));

/* A pergunta que importa: a afinidade PREVÊ desempenho? Se não previr, é
   número bonito na ficha e nada mais.

   Para medir isso é preciso ISOLAR o mapa. A primeira tentativa comparou dois
   clubes reais e deu correlação 0.22 — mas o rival era muito mais forte, todas
   as taxas ficaram entre 3% e 17%, e o efeito do mapa sumiu no ruído do
   confronto. Aqui os dois times são gêmeos: mesmo elenco, mesma comissão,
   mesma preferência de clube. A ÚNICA diferença é a afinidade de mapa. */
const rival=Object.values(G.times).find(x=>x.id!==t.id&&x.tier===t.tier);
rival.elenco.forEach((idB,k)=>{
  const origem=G.jogadores[t.elenco[k%t.elenco.length]];
  const alvo=G.jogadores[idB];
  Object.assign(alvo.at,origem.at);
  alvo.role=origem.role;alvo.role2=origem.role2;alvo.forma=.6;alvo.moral=.7;alvo.fadiga=0;
  alvo.mapas={};for(const mp of m.MAP_POOL)alvo.mapas[mp]=0;   /* rival neutro */
});
t.elenco.forEach(i=>{const p=G.jogadores[i];p.forma=.6;p.moral=.7;p.fadiga=0;p.lesao=0;});
for(const x of [t,rival]){
  x.sinergia=55;x.tatica={agres:3,foco:'default',scrim:3,treino:'mira'};
  x.staff={tecnico:3,analista:3,mental:3,fisio:3,olheiro:3};
  for(const mp of m.MAP_POOL)x.mapPref[mp]=0;
}
/* NÃO reescalar depois de clonar: autoEscalar poderia trocar os titulares e
   desfazer o pareamento que acabou de ser feito. */
const somaT=t.titulares.reduce((s,i)=>s+m.over(G.jogadores[i]),0);
const somaR=rival.titulares.reduce((s,i)=>s+m.over(G.jogadores[i]),0);
if(Math.abs(somaT-somaR)>2)
  console.log(`  ATENÇÃO: times não equivalentes (${somaT} x ${somaR}) — a medição não vale`);

console.log(`  conferência: elencos ${t.elenco.length}x${rival.elenco.length}, `+
  `over titulares ${t.titulares.map(i=>m.over(G.jogadores[i])).join(',')} | `+
  `${rival.titulares.map(i=>m.over(G.jogadores[i])).join(',')}`);
const amostras=[];
for(const mp of m.MAP_POOL){
  let venc=0;const N=400;
  for(let i=0;i<N;i++){const r=m.simMapa(t,rival,mp);if(r.sa>r.sb)venc++;}
  amostras.push({mp,afin:m.afinidadeElenco(t,mp),taxa:venc/N});
}
const mx=a=>a.reduce((s,x)=>s+x,0)/a.length;
const xs=amostras.map(a=>a.afin), ys=amostras.map(a=>a.taxa);
const mxx=mx(xs),myy=mx(ys);
const cov=amostras.reduce((s,a,i)=>s+(xs[i]-mxx)*(ys[i]-myy),0);
const dx=Math.sqrt(amostras.reduce((s,a,i)=>s+(xs[i]-mxx)**2,0));
const dy=Math.sqrt(amostras.reduce((s,a,i)=>s+(ys[i]-myy)**2,0));
console.log(`\nelencos gêmeos, só a afinidade difere · correlação ${(cov/(dx*dy||1)).toFixed(2)}`);
amostras.sort((a,b)=>b.afin-a.afin).forEach(a=>
  console.log(`  ${a.mp.padEnd(10)} afinidade ${a.afin>=0?'+':''}${a.afin.toFixed(1).padStart(5)}  vitória ${(a.taxa*100).toFixed(0)}%`));

const p=G.jogadores[t.titulares[0]];
console.log(`\nperfil de ${p.nome}:`);
m.mapasDe(p).forEach(x=>console.log(`  ${x.mapa.padEnd(10)} ${x.v>0?'+':''}${x.v.toFixed(1)}`));

/* ---------- o clube que nunca abre a tela de Treino ----------
   A IA escolhe um mapa por semana; o clube do jogador só escolhe se ele
   escolher. Se a semana sem escolha esquecesse na taxa cheia, quem não abre a
   tela via a identidade de mapa do elenco sumir inteira em uma temporada — e
   aí o veto viraria sorteio para ele. Esta seção mede o leque (melhor mapa
   menos pior mapa) de quem NÃO escolhe, ao lado do mundo que escolhe. */
m.criarMundo(20260828);m.montarCalendario();
const G2=m.G;
G2.meuTime=Object.values(G2.times).find(x=>x.tag==='SEN').id;
const leque=id=>{
  const vs=(G2.mapasAtivos||m.MAP_POOL).map(mp=>m.afinidadeElenco(G2.times[id],mp));
  return Math.max(...vs)-Math.min(...vs);
};
const linha=rot=>{
  const meu=leque(G2.meuTime);
  const ia=Object.keys(G2.times).filter(id=>id!==G2.meuTime).map(leque).sort((a,b)=>a-b);
  console.log(`  ${rot.padEnd(11)} leque de quem não escolhe ${meu.toFixed(1).padStart(4)}  ·  `+
    `mediana de quem escolhe ${ia[Math.floor(ia.length/2)].toFixed(1)}`);
};
console.log('\nleque de mapas (melhor menos pior) sem escolher nada na tela:');
linha('semana 1');
for(const alvo of [14,26,42,50]){while(G2.semana<alvo)m.avancar();linha('semana '+G2.semana);}
