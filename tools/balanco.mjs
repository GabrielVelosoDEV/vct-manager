#!/usr/bin/env node
/* Balanço: várias partidas sem tela em cada mapa e o resumo — quanto o ataque
   vence, plant, desarme, duração e o resultado de cada plano.
   Uso: node tools/balanco.mjs [partidas por mapa] [mapa...] */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={console,Math,Uint8Array,Int32Array,Float32Array,Error,Object,Array,JSON,Set};vm.createContext(ctx);
const html=readFileSync(resolve(raiz,'gameplay.html'),'utf8');
const arqs=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!/render|jogo|temas|imagens/.test(f));
vm.runInContext(arqs.map(f=>readFileSync(resolve(raiz,f),'utf8')).join('\n')+';globalThis.GP=GP;globalThis.M=MAPAS_GAMEPLAY;',ctx);
const GP=ctx.GP;
const N={mira:62,reflexo:62,movimento:60,visao:60,clutch:55,consistencia:55};
const n=+(process.argv[2]||2), mapas=process.argv.slice(3).length?process.argv.slice(3):Object.keys(ctx.M);
const tot={r:0,atk:0,plant:0,des:0,exp:0,dur:0}, planos={}, defs={};
for(const mapa of mapas){
  const m={r:0,atk:0,plant:0,des:0,dur:0,rounds:[]};
  for(let s=1;s<=n;s++){
    const J=GP.montarPartida({mapa,semente:s*131,atribA:N,atribB:N,tempoCompra:1});
    while(!J.fim&&J.t<3600)GP.passo(J,1/60);
    for(const h of J.historico){
      m.r++;m.atk+=h.vencedor===h.atk;m.plant+=!!h.plant;m.des+=h.como==='desarme';m.dur+=h.duracao;
      const p=(planos[h.planoAtk]||(planos[h.planoAtk]={r:0,v:0}));p.r++;p.v+=h.vencedor===h.atk;
      const d=(h.nomeDef||'').split(' ')[0];const q=(defs[d]||(defs[d]={r:0,v:0}));q.r++;q.v+=h.vencedor!==h.atk;
      tot.exp+=h.como==='explosão';
    }
    m.rounds.push(J.historico.length);
  }
  for(const k of ['r','atk','plant','des','dur'])tot[k]+=m[k];
  console.log(`${mapa.padEnd(9)} ataque ${String(Math.round(m.atk/m.r*100)).padStart(3)}% · plant ${String(Math.round(m.plant/m.r*100)).padStart(3)}% · desarmes ${String(m.des).padStart(2)} · round médio ${Math.round(m.dur/m.r)} s · rounds ${m.rounds.join(',')}`);
}
console.log(`TOTAL     ataque ${Math.round(tot.atk/tot.r*100)}% · plant ${Math.round(tot.plant/tot.r*100)}% · desarme em ${Math.round(tot.des/tot.r*100)}% · explosão em ${Math.round(tot.exp/tot.r*100)}% · round médio ${Math.round(tot.dur/tot.r)} s`);
console.log('planos de ataque: '+Object.entries(planos).map(([k,v])=>`${k} ${Math.round(v.v/v.r*100)}% (${v.r})`).join(' · '));
console.log('setups de defesa: '+Object.entries(defs).map(([k,v])=>`${k} ${Math.round(v.v/v.r*100)}% (${v.r})`).join(' · '));
