#!/usr/bin/env node
/* O orçamento da semana de treino.

   Três perguntas, e todas precisam de resposta antes de dizer que o sistema
   está pronto: descansar sempre contra treinar sempre muda algo? Dá para
   construir um pool de mapas de verdade? Quanto tempo leva para aprender um
   agente? Uso: node tools/treino.mjs */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const tmp=resolve(raiz,'.tr.tmp.cjs');
writeFileSync(tmp,ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,over,definirPlano,definirMapaTreino,'
  +'planoDe,nivelAgente,tetoAgente,treinarAgente,afinidadeElenco,AGENTS,ATTRS,MAP_POOL,'
  +'AGENTE_POR_SEMANA,get G(){return G;}};');
const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);

const q=(a,f)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*f))];};

/* ---------- 1. descansar sempre contra treinar sempre ---------- */
console.log('DESCANSAR SEMPRE CONTRA TREINAR SEMPRE');
m.criamundo?0:0;
m.criarMundo(20260828);m.montarCalendario();
let G=m.G;
/* planoIA() sobrescreve o plano de todo clube que NÃO é o do jogador — é assim
   que o mundo continua evoluindo sozinho. Numa medição isso apagava o plano
   que eu acabara de definir, e o treino de mapa aparecia como se não
   existisse. Aqui o clube medido passa a ser "o seu". */
const DESC=Object.values(G.times).filter(t=>t.tier===1)[0];
const TREI=Object.values(G.times).filter(t=>t.tier===1&&t.regiao===DESC.regiao)[1];
G.meuTime=DESC.id;
const marcar=()=>{
  m.definirMapaTreino(DESC,null);
  DESC.elenco.forEach(id=>m.definirPlano(DESC,id,'descanso'));
  m.definirMapaTreino(TREI,G.mapasAtivos[0]);
  TREI.elenco.forEach(id=>m.definirPlano(TREI,id,'atributo','mira'));
};
const fotoOver=t=>Math.round(t.titulares.reduce((s,i)=>s+m.over(G.jogadores[i]),0)/5*10)/10;
const fotoFad=t=>Math.round(t.titulares.reduce((s,i)=>s+G.jogadores[i].fadiga,0)/5*100)/100;
/* Gêmeos: o mesmo elenco copiado, para a diferença ser só o plano da semana. */
TREI.elenco.forEach((id,i)=>{
  const fonte=G.jogadores[DESC.elenco[i%DESC.elenco.length]], alvo=G.jogadores[id];
  if(!fonte||!alvo)return;
  Object.assign(alvo.at,fonte.at);
  alvo.role=fonte.role;alvo.idade=fonte.idade;alvo.pot=fonte.pot;
  alvo.forma=fonte.forma;alvo.moral=fonte.moral;alvo.fadiga=fonte.fadiga;
});
const o0={d:fotoOver(DESC),t:fotoOver(TREI)};
console.log(`  partida (gêmeos): ${o0.d} e ${o0.t}`);
for(let ano=1;ano<=2;ano++){
  for(let i=0;i<52;i++){
    marcar();m.avancar();
    /* semana 20 é meio de Stage 1: é aí que a fadiga importa, não na
       pré-temporada em que todo mundo já descansou */
    if(i===19)console.log(`   temporada ${ano}, semana 20:`+
      `  descansa fadiga ${fotoFad(DESC)}  ·  treina fadiga ${fotoFad(TREI)}`);
  }
  console.log(`   fim da temporada ${ano}:`+
    `  descansa over ${fotoOver(DESC)}  ·  treina over ${fotoOver(TREI)}`);
}
console.log(`  saldo: descansa ${o0.d} → ${fotoOver(DESC)}   treina ${o0.t} → ${fotoOver(TREI)}`);

/* ---------- 2. dá para construir um pool de mapas? ---------- */
console.log('\nPOOL DE MAPAS DEPOIS DE UMA TEMPORADA TREINANDO TRÊS MAPAS');
m.criarMundo(20260828);m.montarCalendario();G=m.G;
const T=Object.values(G.times).filter(t=>t.tier===1)[0];
G.meuTime=T.id;
const escolhidos=G.mapasAtivos.slice(0,3);
for(let i=0;i<52;i++){
  /* Alterna entre os três, como um clube faria — e reescolhe se a rotação
     tirou algum de circulação, senão a medição vira "treinei um mapa que saiu
     do jogo" e não diz nada sobre o sistema. */
  while(escolhidos.some(x=>!G.mapasAtivos.includes(x))){
    const k=escolhidos.findIndex(x=>!G.mapasAtivos.includes(x));
    escolhidos[k]=G.mapasAtivos.find(x=>!escolhidos.includes(x))||G.mapasAtivos[0];
  }
  const alvo=escolhidos[i%3];
  m.definirMapaTreino(T,alvo);
  T.elenco.forEach(id=>m.definirPlano(T,id,'atributo','mira'));
  m.avancar();
}
const afin=G.mapasAtivos.map(mp=>[mp,Math.round(m.afinidadeElenco(T,mp)*10)/10]);
console.log('  treinou:',escolhidos.join(', '));
afin.sort((a,b)=>b[1]-a[1]).forEach(([mp,v])=>
  console.log('   '+(escolhidos.includes(mp)?'★':' ')+' '+mp.padEnd(10)+(v>0?'+':'')+v));
const dentro=afin.filter(([mp])=>escolhidos.includes(mp)).map(x=>x[1]);
const fora=afin.filter(([mp])=>!escolhidos.includes(mp)).map(x=>x[1]);
console.log(`  média treinada ${(dentro.reduce((a,b)=>a+b,0)/Math.max(1,dentro.length)).toFixed(1)}`+
            `  ·  média abandonada ${(fora.reduce((a,b)=>a+b,0)/Math.max(1,fora.length)).toFixed(1)}`);

/* ---------- 3. quanto tempo para aprender um agente ---------- */
console.log('\nAPRENDER UM AGENTE DO ZERO');
m.criarMundo(20260828);G=m.G;
const alvos=[];
/* Dois casos: agente da PRÓPRIA função (o normal) e agente de OUTRA função
   (o caso do meta virando e o clube tendo de improvisar). O segundo é onde o
   teto de aptidão tem de morder. */
for(const p of Object.values(G.jogadores).slice(0,400)){
  const fun=process.argv[2]==='fora'
    ?(p.role==='Duelista'?'Controlador':'Duelista')
    :(p.role==='Flex'?'Controlador':p.role);
  const ag=(m.AGENTS[fun]||[]).find(a=>!(p.agentes||[]).includes(a));
  if(!ag)continue;
  const teto=m.tetoAgente(p,ag);
  let sem=0;
  while(m.nivelAgente(p,ag)<70&&sem<200){m.treinarAgente(p,ag,m.AGENTE_POR_SEMANA);sem++;}
  alvos.push({sem:m.nivelAgente(p,ag)>=70?sem:null,teto});
  if(alvos.length>=120)break;
}
const conseguiu=alvos.filter(x=>x.sem!=null).map(x=>x.sem);
console.log(`  chegaram a 70: ${conseguiu.length} de ${alvos.length}`);
if(conseguiu.length)console.log(`  semanas de treino: p10 ${q(conseguiu,.1)} · mediana ${q(conseguiu,.5)} · p90 ${q(conseguiu,.9)}`);
const tetos=alvos.map(x=>x.teto);
console.log(`  teto de aprendizado: p10 ${q(tetos,.1)} · mediana ${q(tetos,.5)} · p90 ${q(tetos,.9)}`);
console.log(`  (teto abaixo de 70 é o jogador que NUNCA vai dominar aquele agente — `+
            `${alvos.filter(x=>x.teto<70).length} de ${alvos.length})`);

/* ---------- 4. fadiga de quem nunca descansa, semana a semana ---------- */
console.log('\nFADIGA DE UM CLUBE QUE TREINA TODA SEMANA');
m.criarMundo(20260828);m.montarCalendario();G=m.G;
const X=Object.values(G.times).filter(t=>t.tier===1)[0];
G.meuTime=X.id;
const marcos=[];
for(let i=1;i<=52;i++){
  m.definirMapaTreino(X,G.mapasAtivos[0]);
  X.elenco.forEach(id=>m.definirPlano(X,id,'atributo','mira'));
  m.avancar();
  const f=X.titulares.reduce((s,id)=>s+G.jogadores[id].fadiga,0)/Math.max(1,X.titulares.length);
  if(i%6===0)marcos.push(`s${String(i).padStart(2)} ${(f*100).toFixed(0)}%`);
}
console.log('  '+marcos.join('  '));
const pico=X.titulares.map(id=>G.jogadores[id].fadiga);
console.log(`  pico no fim: ${(Math.max(...pico)*100).toFixed(0)}%  ·  `+
  `alvo: incomodar no meio do bloco (55–75%) sem estourar o teto`);
