#!/usr/bin/env node
/* Partida inteira 5 contra 5, só bots, sem tela: confere que termina, que o
   placar faz sentido e que spike e economia funcionam. Imprime round a round.
   Uso: node tools/partida.mjs [mapa] [semente] */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={console,Math,Uint8Array,Int32Array,Float32Array,Error,Object,Array,JSON,Set};vm.createContext(ctx);
const html=readFileSync(resolve(raiz,'gameplay.html'),'utf8');
const arqs=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!/render|jogo|temas|imagens/.test(f));
vm.runInContext(arqs.map(f=>readFileSync(resolve(raiz,f),'utf8')).join('\n')+';globalThis.GP=GP;',ctx);
const GP=ctx.GP;
const NIVEL={mira:62,reflexo:62,movimento:60,visao:60,clutch:55,consistencia:55};
const mapa=process.argv[2]||'ascent', semente=+(process.argv[3]||7);
const t0=Date.now();
const J=GP.montarPartida({mapa,semente,atribA:NIVEL,atribB:NIVEL,tempoCompra:2});
const dt=1/60;let falhas=0;const ok=(c,m)=>{if(!c){falhas++;console.log('  FALHA:',m);}};
let ultimo=0;
while(!J.fim&&J.t<60*60){
  GP.passo(J,dt);
  if(J.historico.length>ultimo){
    const h=J.historico[ultimo++];
    const cred=J.ents.map(e=>e.creditos);
    ok(cred.every(c=>c>=0&&c<=9000),'créditos fora do limite no round '+h.n);
    console.log(`R${String(h.n).padStart(2)} ataque ${h.atk} · vence ${h.vencedor} por ${h.como.padEnd(10)} ${h.plant?'plant '+h.plant.toUpperCase():'       '} · compra A ${h.compra.A.padEnd(7)} B ${h.compra.B.padEnd(7)} · ${h.duracao}s · ${h.placar.A}–${h.placar.B}`);
  }
}
ok(J.fim,'a partida não terminou');
const a=J.placar.A,b=J.placar.B;
ok(Math.max(a,b)>=13&&Math.abs(a-b)>=2,'placar incoerente '+a+'–'+b);
ok(J.historico.some(h=>h.plant),'nenhum plant');
ok(J.historico.length===a+b,'rounds contados errado');
const tab=J.ents.map(e=>`${e.time} ${e.nome.padEnd(10)} ${GP.AGENTES[e.agente].papel.padEnd(11)} ${e.st.kills}/${e.st.mortes}  dano ${e.st.dano}  plants ${e.st.plants} desarmes ${e.st.desarmes} fb ${e.st.fb}`);
console.log(tab.join('\n'));
const atkV=J.historico.filter(h=>h.vencedor===h.atk).length, plants=J.historico.filter(h=>h.plant).length, des=J.historico.filter(h=>h.como==='desarme').length, exp=J.historico.filter(h=>h.como==='explosão').length;
console.log(`ataque venceu ${Math.round(atkV/J.historico.length*100)}% · plant em ${Math.round(plants/J.historico.length*100)}% · ${des} desarmes · ${exp} explosões`);
console.log(`${mapa}: ${a}–${b} em ${J.historico.length} rounds · ${(J.t/60).toFixed(0)} min de jogo · ${((Date.now()-t0)/1000).toFixed(1)} s de simulação · ${falhas?falhas+' falha(s)':'ok'}`);
process.exit(falhas?1:0);
