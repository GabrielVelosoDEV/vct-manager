#!/usr/bin/env node
/* Etapa 5: a medição da gameplay. Joga N partidas só de bots em cada mapa
   (comps do meta do mapa, sementes 1..N) e mede:
     · mapa: % de rounds do ataque; % com plant; o ataque vence quanto com e
       sem plant; plant e vitória por bomb
     · agente: ACS, K/D e quantas vezes usou cada tipo de habilidade e a ult
     · utilidade: habilidades, flashes e ults por round; tempo parado na
       borda de smoke por round
   Uso: node tools/balanco-gameplay.mjs [mapas,separados] [N] [--json] [--sem-ajustes]
   Para todos os mapas em paralelo, ver tools/balanco-gameplay.sh */
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {console, Math, Uint8Array, Int32Array, Float32Array, Error, Object, Array, JSON, Set}; vm.createContext(ctx);
const html = readFileSync(resolve(raiz, 'gameplay.html'), 'utf8');
const arqs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/render|jogo|temas|imagens/.test(f));
vm.runInContext(arqs.map(f => readFileSync(resolve(raiz, f), 'utf8')).join('\n') + ';globalThis.GP=GP;globalThis.M=MAPAS_GAMEPLAY;', ctx);
const GP = ctx.GP;
/* --sem-ajustes: mede a grade crua, sem data/gameplay/ajustes-mapas.js */
if (process.argv.includes('--sem-ajustes')) vm.runInContext('for (const k in AJUSTES_MAPAS) delete AJUSTES_MAPAS[k];', ctx);
/* --aj={...}: troca os ajustes de um mapa para testar uma variante (JSON) */
for (const a of process.argv) if (a.startsWith('--aj=')) vm.runInContext('Object.assign(AJUSTES_MAPAS, ' + a.slice(5) + ');', ctx);
const NIVEL = {mira: 62, reflexo: 62, movimento: 60, visao: 60, clutch: 55, consistencia: 55, utilidade: 65};
const arg = process.argv.slice(2).filter(a => !a.startsWith('--'));
const mapas = arg[0] && arg[0] !== 'todos' ? arg[0].split(',') : Object.keys(ctx.M);
const N = +(arg[1] || 6), json = process.argv.includes('--json');

const saida = {};
for (const mapa of mapas) {
  const R = {mapa, partidas: 0, rounds: 0, atkV: 0, plants: 0, atkVplant: 0, atkVsem: 0, semPlant: 0, bomb: {}, como: {},
    ag: {}, util: {porTipo: {}, total: 0, ult: 0, flash: 0}, smoke: 0, dur: 0, falhas: 0};
  for (let s = 1; s <= N; s++) {
    const J = GP.montarPartida({mapa, semente: s * 7919 + 11, atribA: NIVEL, atribB: NIVEL, tempoCompra: 2});
    let ev = 0, ult = 0;
    const dt = 1 / 60;
    while (!J.fim && J.t < 3600) {
      GP.passo(J, dt);
      for (const e of J.ents) if (e.bot && e.vivo && e.ia && e.ia.smokeNoCaminho && Math.hypot(e.vx, e.vy) < 0.3) R.smoke += dt;
      for (; ev < J.eventos.length; ev++) {
        const x = J.eventos[ev]; if (x.tipo !== 'habilidade') continue;
        const e = J.ents.find(o => o.id === x.dono); if (!e) continue;
        const info = GP._info(e, x.tecla), tp = info ? info.tipo : x.tecla === 'x' ? 'ult?' : '?';
        R.util.total++; R.util.porTipo[tp] = (R.util.porTipo[tp] || 0) + 1;
        if (x.tecla === 'x') R.util.ult++;
        if (tp === 'flash') R.util.flash++;
        const a = R.ag[e.agente] || (R.ag[e.agente] = {n: 0, acs: 0, k: 0, d: 0, rounds: 0, v: 0, hab: 0, ult: 0});
        a.hab++; if (x.tecla === 'x') a.ult++;
      }
      for (; ult < J.historico.length; ult++) {
        const h = J.historico[ult];
        R.rounds++; R.dur += h.duracao;
        const av = h.vencedor === h.atk;
        if (av) R.atkV++;
        R.como[h.como] = (R.como[h.como] || 0) + 1;
        if (h.plant) {
          R.plants++; if (av) R.atkVplant++;
          const b = R.bomb[h.plant] || (R.bomb[h.plant] = {plants: 0, atkV: 0});
          b.plants++; if (av) b.atkV++;
        } else { R.semPlant++; if (av) R.atkVsem++; }
      }
    }
    if (!J.fim) { R.falhas++; continue; }
    R.partidas++;
    const res = GP.resultadoPartida(J);
    for (const j of res.jogadores) {
      const e = J.ents.find(o => o.id === j.id);
      const a = R.ag[e.agente] || (R.ag[e.agente] = {n: 0, acs: 0, k: 0, d: 0, rounds: 0, v: 0, hab: 0, ult: 0});
      a.n++; a.acs += j.acs; a.k += j.k; a.d += j.d; a.rounds += j.rounds; if (res.vencedor === e.time) a.v++;
    }
  }
  saida[mapa] = R;
  if (!json) {
    const r = R.rounds || 1, pc = (a, b) => Math.round(a / (b || 1) * 100);
    console.log(`${mapa.padEnd(9)} ${R.partidas} partidas · ${R.rounds} rounds · ataque ${pc(R.atkV, r)}% · plant ${pc(R.plants, r)}% · com plant ${pc(R.atkVplant, R.plants)}% · sem plant ${pc(R.atkVsem, R.semPlant)}% · ` +
      Object.entries(R.bomb).sort().map(([k, b]) => `${k.toUpperCase()} ${b.plants}× ${pc(b.atkV, b.plants)}%`).join(' ') +
      ` · round ${Math.round(R.dur / r)}s · hab/round ${(R.util.total / r).toFixed(1)} · flash ${(R.util.flash / r).toFixed(2)} · ult ${(R.util.ult / r).toFixed(2)} · smoke parado ${(R.smoke / r).toFixed(1)}s/round`);
  }
}
if (json) console.log(JSON.stringify(saida));
