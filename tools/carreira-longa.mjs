#!/usr/bin/env node
/* Modo jogador (J7): uma carreira inteira sem tela, até a aposentadoria, e a
   virada para técnico no mesmo save.
     · o assistente cuida da semana, do contrato e do patrocínio
     · mede temporada a temporada: clube, over, mapas, lesões, prêmios
     · aposenta pelo corpo (ou com --parar=idade) e assume como técnico o
       primeiro clube da lista (ex-clube, se houver); joga uma temporada de
       técnico para conferir que o save segue
   Uso: node tools/carreira-longa.mjs [inicio] [idade] [over] [semente] [--parar=idade] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,meuJogador,over,aposentarJogador,ofertasDeTecnicoExJogador,virarTecnico,membroManager,overStaff,INICIOS_JOGADOR,get G(){return G;}};';
const tmp = resolve(raiz, '.cl.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const parar = +((process.argv.find(a => a.startsWith('--parar=')) || '').split('=')[1] || 0);
const [ini = 'titular', idade = 30, ov = 0, semente = 20260828] = args;
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

m.criarMundo(+semente); m.montarCalendario();
const G = m.G;
m.criarManager('Teste', 'jogador', {});
const I = m.INICIOS_JOGADOR.find(x => x.id === ini);
const clube = I.tier ? G.regioes.AMER[I.tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[2] : null;
const p0 = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: +idade, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
  estilo: 'mira', inicio: ini, over: +ov || I.over, pot: I.pot, timeId: clube && clube.id});
const id = p0.id;
let ano = G.ano, lesoes = 0, semanas = 0, lesoesAntes = 0;
const linha = () => {
  const p = G.jogadores[id];
  if (!p) return;
  const h = p.hist[p.hist.length - 1] || {};
  console.log(`${String(h.ano).padEnd(5)} ${String(h.time || '').slice(0, 18).padEnd(18)} idade ${p.idade - 1} · over ${h.over} (auge ${Math.round(p.pico)}) · ${h.maps || 0} mapas · prêmios ${(p.premios || []).length} · títulos ${(p.carreira || {}).titulos || 0} · lesões ${lesoes - lesoesAntes}`);
  lesoesAntes = lesoes;
};
try {
  while (!G.voce.aposentado && semanas < 60 * 30) {
    const p = m.meuJogador();
    const antes = p.lesao || 0;
    if (parar && p.idade >= parar) { m.aposentarJogador('escolha'); break; }
    m.avancar(); semanas++;
    const q = G.jogadores[id];
    if (q && q.lesao > antes && G.voce.lesaoNome) lesoes++;
    if (G.ano !== ano) { linha(); ano = G.ano; }
  }
} catch (e) { ok(false, 'erro na carreira: ' + (e.stack || e).toString().split('\n').slice(0, 4).join(' | ')); }
const L = G.voce && G.voce.aposentado;
ok(L, 'não aposentou');
if (L) {
  console.log(`\naposentou em ${L.ano} aos ${L.idade} (${L.motivo}) · auge ${L.pico} · Hall da Fama: ${L.hall ? 'sim' : 'não'} (${L.pontos} pontos) · clubes ${L.clubes.map(c => G.times[c].tag).join(', ')}`);
  ok(!G.jogadores[id], 'o jogador continua no mundo depois de aposentar');
  const of = m.ofertasDeTecnicoExJogador();
  console.log('convites de técnico:', of.map(x => x.t.tag + (x.casa ? '*' : '')).join(', '));
  ok(of.length >= 3, 'poucos convites de técnico');
  const r = m.virarTecnico(of[0].t.id);
  ok(r.ok, 'não virou técnico: ' + (r.motivo || ''));
  ok(!G.voce && G.meuTime === of[0].t.id && G.manager.papel === 'treinador', 'o save não virou carreira de técnico');
  const mm = m.membroManager();
  console.log(`técnico do ${G.times[G.meuTime].nome} · nível de coach ${mm ? m.overStaff(mm) : '—'} · confiança ${G.manager.confianca}`);
  const a0 = G.ano; let s = 0, minhas = 0;
  try { while (G.ano === a0 && s < 70) { const r2 = m.avancar(); s++; if (r2 && r2.minhaPartida) minhas++; } }
  catch (e) { ok(false, 'erro na temporada de técnico: ' + (e.stack || e).toString().split('\n').slice(0, 4).join(' | ')); }
  ok(minhas > 0, 'o clube do técnico não jogou');
  console.log(`primeira temporada de técnico: ${s} semanas, ${minhas} partidas do clube`);
}
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
