#!/usr/bin/env node
/* Modo jogador (J6): uma temporada medindo fama e mídia.
     1) cada ponto de partida: seguidores, fama, imagem, patrocínios e
        manchetes de fase ruim (posta confiante, responde entrevista madura;
        o assistente aceita patrocínio)
     2) o mesmo jogador de Challengers com 20 mil e com 2 milhões de
        seguidores: quantas propostas e patrocínios chegam
   Alvo do plano: a fama abre propostas e patrocínios, e uma fase ruim
   aparece nas manchetes.
   Uso: node tools/fama-jogador.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,criarCarreiraJogador,over,seguidores,famaJogador,imagemJogador,postarNasRedes,responderEntrevista,patrociniosJogador,patrociniosMensais,propostasJogador,fmtSeg,INICIOS_JOGADOR,get G(){return G;}};';
const tmp = resolve(raiz, '.fj.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);

function rodar(ini, ov, seg0, rotulo, slump) {
  m.criarMundo(semente); m.montarCalendario();
  const G = m.G;
  m.criarManager('Teste', 'jogador', {});
  const I = m.INICIOS_JOGADOR.find(x => x.id === ini);
  const clube = I.tier ? G.regioes.AMER[I.tier === 1 ? 't1' : 't2'].map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[2] : null;
  const p = m.criarCarreiraJogador({nick: 'Voce', pais: 'BR', idade: 20, funcao: 'Duelista', agentes: ['Jett', 'Raze', 'Neon'],
    estilo: 'mira', inicio: ini, over: ov || I.over, pot: I.pot, timeId: clube && clube.id});
  if (seg0) G.voce.seg = seg0;
  const s0 = m.seguidores(), f0 = m.famaJogador(), ano0 = G.ano;
  let semanas = 0, posts = 0, ent = 0;
  const visto = new Set(), tipos = {};
  while (G.ano === ano0 && semanas < 70) {
    if (G.voce.post) { m.postarNasRedes('confiante'); posts++; }
    if (G.voce.entrevista) { m.responderEntrevista([0, 0]); ent++; }
    /* fase ruim forçada: semanas 14 a 24 sem forma, sem cabeça e sem perna */
    if (slump && semanas >= 14 && semanas <= 24) { const eu = G.jogadores[p.id]; eu.forma = 0.2; eu.moral = 0.15; eu.fadiga = 0.9; eu.confianca = 0.1; }
    for (const pr of m.propostasJogador()) if (!visto.has(pr.id)) { visto.add(pr.id); tipos[pr.tipo] = (tipos[pr.tipo] || 0) + 1; }
    m.avancar(); semanas++;
  }
  const ruim = (G.noticias || []).filter(n => /Fase ruim/.test(n.txt) && (n.p || []).includes(p.id)).length;
  const grandes = (G.noticias || []).filter(n => /viraliza|amassa/.test(n.txt) && (n.p || []).includes(p.id)).length;
  console.log(`${rotulo.padEnd(24)} seguidores ${m.fmtSeg(s0)} → ${m.fmtSeg(m.seguidores())} · fama ${f0} → ${m.famaJogador()} · imagem ${Math.round(m.imagemJogador())} · patrocínios ${m.patrociniosJogador().length} (${m.patrociniosMensais()}/mês) · posts ${posts} · entrevistas ${ent} · jogadas grandes ${grandes} · fase ruim ${ruim} · propostas ${JSON.stringify(tipos)}`);
}
for (const ini of ['ranked', 'tier2', 'banco', 'titular', 'lenda']) rodar(ini, null, null, ini);
rodar('tier2', 76, 20000, 'Challengers 76, 20 mil');
rodar('tier2', 76, 2000000, 'Challengers 76, 2 mi');
rodar('titular', null, null, 'titular com fase ruim', true);
