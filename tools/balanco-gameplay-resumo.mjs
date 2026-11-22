#!/usr/bin/env node
/* Junta as saídas --json de tools/balanco-gameplay.mjs (um arquivo por mapa)
   e imprime o quadro por mapa, por agente e da utilidade.
   Uso: node tools/balanco-gameplay-resumo.mjs arquivo1.json arquivo2.json ... */
import {readFileSync} from 'node:fs';
const tudo = {};
for (const f of process.argv.slice(2)) {
  const txt = readFileSync(f, 'utf8').trim().split('\n').pop();
  try { Object.assign(tudo, JSON.parse(txt)); } catch (e) { console.log('ignorado', f); }
}
const pc = (a, b) => Math.round(a / (b || 1) * 100);
const ag = {}, ut = {porTipo: {}, total: 0, ult: 0, flash: 0}; let rounds = 0, smoke = 0, atk = 0;
console.log('MAPA       partidas rounds  ataque  plant  c/plant s/plant  bombs                      round  hab  flash  ult  smoke');
for (const [m, R] of Object.entries(tudo).sort()) {
  const r = R.rounds || 1;
  rounds += R.rounds; smoke += R.smoke; atk += R.atkV;
  for (const [k, v] of Object.entries(R.util.porTipo)) ut.porTipo[k] = (ut.porTipo[k] || 0) + v;
  ut.total += R.util.total; ut.ult += R.util.ult; ut.flash += R.util.flash;
  for (const [k, a] of Object.entries(R.ag)) {
    const x = ag[k] || (ag[k] = {n: 0, acs: 0, k: 0, d: 0, rounds: 0, v: 0, hab: 0, ult: 0});
    for (const c in x) x[c] += a[c] || 0;
  }
  console.log(`${m.padEnd(10)} ${String(R.partidas).padStart(6)} ${String(R.rounds).padStart(6)}  ${String(pc(R.atkV, r)).padStart(5)}%  ${String(pc(R.plants, r)).padStart(4)}%  ${String(pc(R.atkVplant, R.plants)).padStart(5)}%  ${String(pc(R.atkVsem, R.semPlant)).padStart(5)}%  ` +
    Object.entries(R.bomb).sort().map(([k, b]) => `${k.toUpperCase()} ${String(b.plants).padStart(3)}× ${String(pc(b.atkV, b.plants)).padStart(3)}%`).join('  ').padEnd(26) +
    ` ${String(Math.round(R.dur / r)).padStart(4)}s ${(R.util.total / r).toFixed(1).padStart(4)} ${(R.util.flash / r).toFixed(2).padStart(5)} ${(R.util.ult / r).toFixed(2).padStart(4)} ${(R.smoke / r).toFixed(1).padStart(5)}s`);
}
console.log(`\nTOTAL ${rounds} rounds · ataque ${pc(atk, rounds)}% · hab/round ${(ut.total / (rounds || 1)).toFixed(1)} · flash/round ${(ut.flash / (rounds || 1)).toFixed(2)} · ult/round ${(ut.ult / (rounds || 1)).toFixed(2)} · smoke parado ${(smoke / (rounds || 1)).toFixed(1)}s/round`);
console.log('habilidades por tipo: ' + Object.entries(ut.porTipo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('\nAGENTE      jogos  ACS   K/D   vit%  hab/rd  ult/jogo');
for (const [k, a] of Object.entries(ag).filter(([, a]) => a.n).sort((x, y) => y[1].acs / y[1].n - x[1].acs / x[1].n))
  console.log(`${k.padEnd(10)} ${String(a.n).padStart(5)}  ${String(Math.round(a.acs / a.n)).padStart(3)}  ${(a.k / Math.max(1, a.d)).toFixed(2)}  ${String(pc(a.v, a.n)).padStart(4)}%  ${(a.hab / Math.max(1, a.rounds)).toFixed(2).padStart(5)}  ${(a.ult / a.n).toFixed(1).padStart(5)}`);
