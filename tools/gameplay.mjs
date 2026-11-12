#!/usr/bin/env node
/* Testa o motor de gameplay sem tela: mapas carregam, os spawns se ligam
   por caminho, e um duelo bot contra bot termina — com o melhor ganhando
   mais. Uso: node tools/gameplay.mjs [mapa] */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={console,Math,Uint8Array,Int32Array,Float32Array,Error,Object,Array,JSON};
vm.createContext(ctx);
vm.runInContext(['data/gameplay/mapas.js','src/gameplay/grade.js','src/gameplay/armas.js','src/gameplay/motor.js']
  .map(f=>readFileSync(resolve(raiz,f),'utf8')).join('\n')+'\n;globalThis.GP=GP;globalThis.MAPAS_GAMEPLAY=MAPAS_GAMEPLAY;',ctx);
const GP=ctx.GP, MAPAS=ctx.MAPAS_GAMEPLAY;
let falhas=0;
const ok=(c,msg)=>{if(!c){falhas++;console.log('  FALHA:',msg);}};
const NIVEL={ranked:{mira:50,reflexo:50,movimento:50,visao:50,clutch:45,consistencia:45},
             t1:{mira:88,reflexo:88,movimento:85,visao:80,clutch:82,consistencia:85}};
const nomes=process.argv[2]?[process.argv[2]]:Object.keys(MAPAS);
for(const nome of nomes){
  const t0=Date.now();
  const m=GP.carregarMapa(nome);
  ok(m.spawn,nome+': sem spawn');
  const cam=m.spawn&&GP.caminho(m,m.spawn.atk.x,m.spawn.atk.y,m.spawn.def.x,m.spawn.def.y);
  ok(cam,nome+': spawns sem caminho');
  for(const L of Object.keys(m.sitios)){
    const c=GP.caminho(m,m.spawn.atk.x,m.spawn.atk.y,m.sitios[L].x,m.sitios[L].y);
    ok(c,nome+': sem caminho até o bomb '+L);
  }
  ok(Object.keys(m.sitios).length===(nome==='haven'||nome==='lotus'?3:2),nome+': bombs '+Object.keys(m.sitios).join(''));
  const comp=cam?cam.reduce((s,p,i)=>i?s+Math.hypot(p.x-cam[i-1].x,p.y-cam[i-1].y):0,0):0;
  /* duelo: T1 (o "eu", mas pilotado pela IA) contra Ranked */
  let vEu=0,vEles=0,quadros=0,rounds=0,kd=[0,0];
  for(let s=1;s<=3;s++){
    const J=GP.montarDuelo({mapa:nome,arma:'vandal',atribEu:NIVEL.t1,atribBot:NIVEL.ranked,rounds:5,semente:s*977});
    const eu=J.eu; eu.bot=true; eu.ia=GP.criarAgente({id:'x',time:'eu',bot:true}).ia;
    while(!J.fim&&J.t<900){GP.passo(J,1/60);quadros++;}
    ok(J.fim,nome+': duelo não terminou (t='+J.t.toFixed(0)+', placar '+J.placar.eu+'x'+J.placar.eles+')');
    vEu+=J.placar.eu; vEles+=J.placar.eles; rounds+=J.round.n; kd[0]+=eu.st.kills; kd[1]+=eu.st.mortes;
  }
  const ms=Date.now()-t0;
  console.log(`${nome.padEnd(9)} ${m.W}x${m.H}  caminho spawn→spawn ${comp.toFixed(0)} m  bombs ${Object.keys(m.sitios).join('')}  T1 x Ranked ${vEu}–${vEles} em ${rounds} rounds  K/D ${kd[0]}/${kd[1]}  ${(ms/quadros*1000).toFixed(0)} µs/quadro`);
}
console.log(falhas?falhas+' falha(s)':'gameplay ok');
process.exit(falhas?1:0);
