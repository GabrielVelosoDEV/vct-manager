#!/usr/bin/env node
/* Etapa 4: elencos reais dentro da partida.
   1) mostra a comp que cada time escolhe em cada mapa do pool
   2) força: time forte × time fraco em vários mapas — o mais forte tem que
      ganhar a maioria, mas não todas
   Uso: node tools/elencos.mjs [forte] [fraco] [n mapas] */
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {console, Math, Uint8Array, Int32Array, Float32Array, Error, Object, Array, JSON, Set}; vm.createContext(ctx);
const html = readFileSync(resolve(raiz, 'gameplay.html'), 'utf8');
const arqs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/render|jogo|temas|imagens/.test(f));
vm.runInContext(arqs.map(f => readFileSync(resolve(raiz, f), 'utf8')).join('\n') + ';globalThis.GP=GP;', ctx);
const GP = ctx.GP;
const media = s => { const t = GP.timeReal(s); return t.jogadores.reduce((a, j) => a + j.over, 0) / 5; };
const forte = process.argv[2] || 'LEV', fraco = process.argv[3] || 'BST', n = +(process.argv[4] || 4);
const POOL = ['ascent', 'split', 'haven', 'lotus', 'sunset', 'summit', 'breeze', 'abyss'];
let falhas = 0;
console.log('comps por mapa:');
for (const s of [forte, fraco]) {
  const T = GP.timeReal(s);
  if (!T) { console.log('time não existe:', s); process.exit(1); }
  console.log(`\n${T.nome} (${s}) · over médio ${media(s).toFixed(1)} · ${T.jogadores.map(j => j.nome).join(', ')}`);
  for (const m of POOL) {
    const comp = GP.compDoElenco(m, T.jogadores, GP.rng(1), []);
    const pap = comp.map(a => GP.AGENTES[a].papel);
    if (!pap.includes('controlador')) { falhas++; console.log('  FALHA: sem controlador em', m); }
    console.log(`  ${m.padEnd(8)} ${comp.map(a => GP.AGENTES[a].nome).join(' · ')}`);
  }
}
console.log(`\nforça: ${forte} × ${fraco} em ${n} mapas`);
let vForte = 0, rF = 0, rT = 0;
for (let i = 0; i < n; i++) {
  const mapa = POOL[i % POOL.length];
  const J = GP.montarPartida({mapa, semente: 11 + i, tempoCompra: 2, timeA: GP.timeReal(forte), timeB: GP.timeReal(fraco)});
  while (!J.fim && J.t < 3600) GP.passo(J, 1 / 60);
  if (!J.fim) { falhas++; console.log('  FALHA: não terminou'); continue; }
  if (J.placar.A > J.placar.B) vForte++;
  rF += J.placar.A; rT += J.placar.A + J.placar.B;
  console.log(`  ${mapa.padEnd(8)} ${forte} ${J.placar.A}–${J.placar.B} ${fraco}`);
}
console.log(`${forte} venceu ${vForte}/${n} mapas · ${Math.round(rF / rT * 100)}% dos rounds`);
process.exit(falhas ? 1 : 0);
