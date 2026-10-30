#!/usr/bin/env node
/* Quanto vale 1 ponto de over? Monta dois clubes idênticos, desloca o over de
   um deles e simula muitos mapas. Sem esta medição, mexer no ruído do round é
   chute — a variância certa não é "baixa", é a que faz o melhor ganhar na
   proporção que o esporte mostra. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,over,aplicarOver,simMapa,autoEscalar,desvioDoDia,MAP_POOL,get G(){return G;}};';
const tmp=resolve(raiz,'.ru.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);const G=m.G;

const A=Object.values(G.times).find(t=>t.tier===1);
const B=Object.values(G.times).find(t=>t.tier===1&&t.id!==A.id&&t.regiao===A.regiao);
/* zera tudo o que não é over: mesma sinergia, mesma comissão, mesmo mapa */
const nivelar=()=>{
  for(const t of [A,B]){
    t.sinergia=55;t.tatica={agres:3,foco:'default',scrim:3,treino:'mira'};
    t.staff={tecnico:3,analista:3,mental:3,fisio:3,olheiro:3};
    for(const mp of m.MAP_POOL)t.mapPref[mp]=0;
    t.elenco.forEach(i=>{const p=G.jogadores[i];p.forma=.6;p.moral=.7;p.fadiga=0;p.lesao=0;});
  }
};
/* Clona o elenco de A dentro de B. Igualar só o over não bastava: dois times
   de over 82 podem ter perfis diferentes (um forte de mira, outro de visão) e
   um leva vantagem no ataque e o outro na defesa. Sem elencos gêmeos, o teste
   de "gap 0" media a diferença de perfil, não o ruído. */
const gemear=()=>{
  B.elenco.forEach((idB,k)=>{
    const origem=G.jogadores[A.elenco[k%A.elenco.length]];
    const alvo=G.jogadores[idB];
    Object.assign(alvo.at,origem.at);
    alvo.role=origem.role;alvo.role2=origem.role2;alvo.idade=origem.idade;
  });
  m.autoEscalar(A);m.autoEscalar(B);
};
const porTime=(t,alvo)=>{t.elenco.forEach(i=>m.aplicarOver(G.jogadores[i],alvo));m.autoEscalar(t);};

const N=parseInt(process.argv[2])||1500;
console.log(`base 82 contra 82+gap, ${N} mapas por linha\n`);
console.log('  gap  vitórias de mapa   rounds do favorito   placar médio');
for(const gap of [0,3,5,10,15,20]){
  gemear();nivelar();porTime(A,82+gap);porTime(B,82);nivelar();
  let vit=0,rA=0,rB=0;
  for(let i=0;i<N;i++){
    const r=m.simMapa(A,B,'Ascent');
    if(r.sa>r.sb)vit++;
    rA+=r.sa;rB+=r.sb;
  }
  const pct=vit/N*100, rpct=rA/(rA+rB)*100;
  console.log(`  +${String(gap).padStart(2)}   ${pct.toFixed(1).padStart(5)}%            ${rpct.toFixed(1).padStart(5)}%        ${(rA/N).toFixed(1)}–${(rB/N).toFixed(1)}`);
}

/* --- a consistência manda sozinha? ---
   Mesmo gap de over, consistência dos dois times variando junto. Se a curva
   for íngreme, um atributo isolado está decidindo o quanto o jogo é loteria. */
console.log('\ngap fixo de +10, consistência dos dois times variando:');
console.log('  consist   σ do dia   vitórias do favorito');
for(const c of [40,55,70,85,95]){
  gemear();nivelar();porTime(A,92);porTime(B,82);nivelar();
  for(const t of [A,B])t.titulares.forEach(i=>{G.jogadores[i].at.consist=c;});
  const sigma=m.desvioDoDia(A);
  let vit=0;
  for(let i=0;i<N;i++){const r=m.simMapa(A,B,'Ascent');if(r.sa>r.sb)vit++;}
  console.log(`  ${String(c).padStart(6)}   ${sigma.toFixed(1).padStart(6)}       ${(vit/N*100).toFixed(1)}%`);
}
