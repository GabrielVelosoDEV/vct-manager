#!/usr/bin/env node
/* Fluidez com 10 no mapa: 5 de cada lado saem do spawn e correm para os
   bombs e de volta, ao mesmo tempo, por 45 s. Mede quanto tempo alguém fica
   travado (querendo andar e parado) e se alguém entra na parede.
   Uso: node tools/fluidez.mjs [mapa] */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={console,Math,Uint8Array,Int32Array,Float32Array,Error,Object,Array,JSON,Set};vm.createContext(ctx);
vm.runInContext(['data/gameplay/mapas.js','data/gameplay/mecanicas.js','src/gameplay/grade.js','src/gameplay/armas.js','src/gameplay/motor.js','src/gameplay/mecanicas.js']
  .map(f=>readFileSync(resolve(raiz,f),'utf8')).join('\n')+';globalThis.GP=GP;globalThis.M=MAPAS_GAMEPLAY;',ctx);
const GP=ctx.GP;let falhas=0;
for(const nome of process.argv[2]?[process.argv[2]]:Object.keys(ctx.M)){
  const J=GP.novoJogo({mapa:nome,semente:9});J.round.fase='ativo';
  const m=J.m,alvos=Object.values(m.sitios);
  for(let i=0;i<10;i++){const lado=i<5?'atk':'def',sp=m.spawn[lado];
    const e=GP.criarAgente({id:'b'+i,time:lado,bot:true});e.x=sp.x+(i%5-2)*0.9;e.y=sp.y+((i%5)%2)*0.9;GP._empurrar(m,e,e.raioCol);
    e.ia={caminho:null,travado:0};e.rota=[alvos[i%alvos.length],sp,alvos[(i+1)%alvos.length],sp];e.k=0;e.preso=0;J.ents.push(e);}
  let dentro=0,presoMax=0,presoTot=0;
  for(let f=0;f<45*120;f++){
    for(const e of J.ents){
      const a=e.rota[e.k%4];
      if(Math.hypot(a.x-e.x,a.y-e.y)<2.5){e.k++;e.ia.caminho=null;}
      GP._irPara(J,e,e.rota[e.k%4],'corre',1/120);
      GP._aplicarComando(J,e,1/120);
      const quer=Math.hypot(e.cmd.mx,e.cmd.my)>0.1,vel=Math.hypot(e.vx,e.vy);
      if(quer&&vel<0.6){e.preso+=1/120;presoTot+=1/120;}else e.preso=0;
      presoMax=Math.max(presoMax,e.preso);
      if(GP.colide(m,e.x,e.y,e.raioCol*0.95))dentro++;
    }
    GP._separarCorpos(J);GP.passoMecanicas(J,1/120);J.t+=1/120;
  }
  const ok=!dentro&&presoMax<2.5;if(!ok)falhas++;
  console.log(`${nome.padEnd(9)} 10 corpos 45 s · trechos travado: ${(presoTot/10).toFixed(1)} s por boneco, pior ${presoMax.toFixed(1)} s · na parede ${dentro} ${ok?'ok':'PROBLEMA'}`);
}
process.exit(falhas?1:0);
