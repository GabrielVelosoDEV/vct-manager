#!/usr/bin/env node
/* Etapa 3: o que os bots fazem com as habilidades numa partida sem tela.
   Conta, por round, quantas habilidades cada lado usou e de que tipo, em que
   momento (antes do plant, pós-plant, retake), quantos pedidos do time o bot
   não conseguiu cumprir e quanto tempo os bots ficaram parados na borda de
   smoke. Uso: node tools/utilidade.mjs [mapas separados por vírgula] [semente] */
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
const NIVEL = {mira: 62, reflexo: 62, movimento: 60, visao: 60, clutch: 55, consistencia: 55};
const mapas = (process.argv[2] || 'ascent,bind,haven').split(','), semente = +(process.argv[3] || 3);
const tot = {porTipo: {}, momento: {}, pedidos: 0, cumpridos: 0, smokeEspera: 0, rounds: 0, usos: 0, atkV: 0, plants: 0, desarmes: 0};
let falhas = 0;
for (const mapa of mapas) {
  const J = GP.montarPartida({mapa, semente, atribA: NIVEL, atribB: NIVEL, tempoCompra: 2});
  const pedir = GP._pedir;
  GP._pedir = function (J, e, k) { const r = pedir.apply(this, arguments); if (r) tot.pedidos++; return r; };
  let ev = 0, ultimo = 0;
  const dt = 1 / 60;
  while (!J.fim && J.t < 3600) {
    GP.passo(J, dt);
    for (const e of J.ents) if (e.bot && e.vivo && e.ia && e.ia.smokeNoCaminho && Math.hypot(e.vx, e.vy) < 0.3) tot.smokeEspera += dt;
    for (; ev < J.eventos.length; ev++) {
      const x = J.eventos[ev]; if (x.tipo !== 'habilidade') continue;
      const e = J.ents.find(o => o.id === x.dono); if (!e) continue;
      const info = GP._info(e, x.tecla), tp = info ? info.tipo : '?';
      const lado = e.time === GP._timeAtk(J) ? 'atk' : 'def', fase = J.spike.estado === 'plantada' ? 'pos' : 'pre';
      tot.porTipo[tp] = (tot.porTipo[tp] || 0) + 1;
      tot.momento[lado + '-' + fase] = (tot.momento[lado + '-' + fase] || 0) + 1;
      tot.usos++;
      if (e.bot) tot.cumpridos++;
    }
    if (J.historico.length > ultimo) {
      const h = J.historico[ultimo++];
      tot.rounds++; if (h.vencedor === h.atk) tot.atkV++; if (h.plant) tot.plants++; if (h.como === 'desarme') tot.desarmes++;
    }
  }
  GP._pedir = pedir; tot.falhas = (tot.falhas || 0) + (J.utilFalhas || 0);
  if (!J.fim) { falhas++; console.log('  FALHA: a partida não terminou em', mapa); }
  console.log(`${mapa.padEnd(8)} ${J.placar.A}–${J.placar.B} em ${J.historico.length} rounds`);
}
const r = tot.rounds || 1;
console.log(`\nhabilidades por round (os dois times): ${(tot.usos / r).toFixed(1)}`);
console.log('momento: ' + Object.entries(tot.momento).sort().map(([k, v]) => `${k} ${(v / r).toFixed(1)}`).join(' · '));
console.log('por tipo: ' + Object.entries(tot.porTipo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(`pedidos do time: ${tot.pedidos} (${tot.falhas || 0} não cumpridos) · parados na borda de smoke: ${tot.smokeEspera.toFixed(0)} s no total`);
console.log(`ataque venceu ${Math.round(tot.atkV / r * 100)}% · plant em ${Math.round(tot.plants / r * 100)}% · desarme em ${Math.round(tot.desarmes / r * 100)}%`);
process.exit(falhas ? 1 : 0);
