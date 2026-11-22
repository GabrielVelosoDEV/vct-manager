#!/usr/bin/env node
/* Etapa 4: a rotina dia a dia (core/rotina.js) e a nova evolução do modo
   jogador (core/evolucao-jogador.js). Confere:
     · treinador: a rotina padrão não muda nada (mesma semente, mesmo mundo);
       trocar dias mexe no cansaço na hora e na evolução no fechamento; dia
       de jogo e dia que passou não trocam
     · jogador, dia a dia: a rotina roda um dia por vez, com o dia gravado;
       no máximo duas atividades por dia; dia vazio devolve energia; o treino
       do clube cai uma vez; os desafios aparecem e andam; marcos e foco
   Uso: node tools/rotina.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + '\nlet _DIAS=false;function usarDias(){return _DIAS;}\nmodule.exports={ev:s=>eval(s),dias:v=>{_DIAS=v;},get G(){return G;}};';
const tmp = resolve(raiz, '.rot.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };
const ev = s => m.ev(s);

/* ---------- treinador ---------- */
const inicio = `criarMundo(${semente});montarCalendario();G.meuTime=G.regioes.AMER.t1.map(id=>G.times[id]).find(t=>t.tag==='LOUD').id;criarManager('T','treinador',{});`;
function semanas(n, mexer) {
  ev(inicio); m.dias(true);
  const G = m.G;
  for (let w = 0; w < n; w++) {
    const s0 = G.semana;
    let guarda = 0;
    while (G.semana === s0 && guarda++ < 20) {
      if (mexer) mexer(G);
      ev('avancarDia()');
    }
  }
  const t = G.times[G.meuTime];
  const fad = t.elenco.map(id => G.jogadores[id].fadiga).reduce((a, b) => a + b, 0) / t.elenco.length;
  const at = t.elenco.map(id => Object.values(G.jogadores[id].at).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
  return {fad, at, hash: JSON.stringify(Object.values(G.times).map(x => x.pontos || 0)) + G.semana};
}
const N = 6;
const base = semanas(N);
const base2 = semanas(N, G => { const t = G.times[G.meuTime]; ev('rotinaDaSemana(G.times[G.meuTime])'); });
ok(Math.abs(base.fad - base2.fad) < 1e-12 && base.at === base2.at, 'olhar a rotina mudou o mundo');
/* todas as folgas possíveis */
const folga = semanas(N, G => {
  const t = G.times[G.meuTime];
  for (let d = G.turno || 0; d < 7; d++) ev(`trocarDiaRotina(G.times[G.meuTime],${d},'folga')`);
});
const scrim = semanas(N, G => {
  for (let d = G.turno || 0; d < 7; d++) ev(`trocarDiaRotina(G.times[G.meuTime],${d},'scrim')`);
});
console.log(`treinador ${N} semanas · cansaço médio: padrão ${base.fad.toFixed(3)} · folgas ${folga.fad.toFixed(3)} · scrims ${scrim.fad.toFixed(3)}`);
console.log(`  soma dos atributos do elenco: padrão ${base.at} · folgas ${folga.at} · scrims ${scrim.at}`);
ok(folga.fad < base.fad - 0.02, 'folga não baixou o cansaço');
ok(scrim.fad > base.fad, 'scrim não cansou mais');
ok(folga.at < base.at, 'folga não freou a evolução');
ok(scrim.at > base.at, 'scrim não acelerou a evolução');
/* travas */
ev(inicio); m.dias(true);
{
  const G = m.G;
  let achou = false;
  for (let i = 0; i < 40 && !achou; i++) {
    const dias = ev('rotinaDaSemana(G.times[G.meuTime])');
    const j = dias.find(x => x.tipo === 'jogo' && x.dia >= (G.turno || 0));
    if (j) {
      achou = true;
      const r = ev(`trocarDiaRotina(G.times[G.meuTime],${j.dia},'folga')`);
      ok(!r.ok, 'dia de jogo trocou');
      if ((G.turno || 0) > 0) ok(!ev(`trocarDiaRotina(G.times[G.meuTime],0,'folga')`).ok, 'dia que passou trocou');
      const jogos = ev('diasDeJogoDoClube(G.meuTime)');
      ok(jogos.includes(j.dia), 'dia de jogo fora da lista de jogos do clube');
    }
    ev('avancarDia()');
  }
  ok(achou, 'nenhum dia de jogo achado em 40 dias');
}

/* ---------- jogador ---------- */
function jogador(dias, cb) {
  ev(`criarMundo(${semente});montarCalendario();criarManager('J','jogador',{});`);
  m.dias(dias);
  const G = m.G;
  const clube = G.regioes.AMER.t1.map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[3];
  ev(`criarCarreiraJogador({automatico:true,nick:'Voce',pais:'BR',idade:21,funcao:'Duelista',agentes:['Jett','Raze','Neon'],estilo:'mira',inicio:'titular',over:78,pot:90,timeId:'${clube.id}'})`);
  return cb(G);
}
jogador(true, G => {
  let maxDia = 0, coletivos = 0, semanasVistas = 0, energiaSubiu = false, limiteOk = true;
  for (let w = 0; w < 10; w++) {
    const s0 = G.semana;
    let guarda = 0;
    while (G.semana === s0 && guarda++ < 20) {
      const s = ev('semanaJogador()');
      const e0 = s.energia, d = G.turno || 0;
      ev('avancarDia()');
      if (G.semana === s0) {
        const feitasDia = s.feitas.filter(f => (f.dia || 0) === d).length;
        if (feitasDia > 2) limiteOk = false;
        if (!feitasDia && s.energia > e0) energiaSubiu = true;
      }
    }
    const u = G.voce.semanas[0];
    semanasVistas++;
    coletivos += u.feitas.filter(x => x.startsWith('coletivo')).length;
  }
  const sem = G.voce.semanas.slice(0, 10);
  console.log(`jogador dia a dia · 10 semanas · atividades por semana: ${sem.map(s => s.feitas.length).join(' ')} · treinos do clube ${coletivos}`);
  ok(limiteOk, 'mais de duas atividades num dia');
  ok(energiaSubiu, 'dia vazio não devolveu energia');
  ok(coletivos >= 8 && coletivos <= 10, 'treino do clube fora de uma vez por semana: ' + coletivos);
  ok((G.voce.desafios || []).length >= 2, 'menos de dois desafios ativos');
  ok(G.voce.marcos && G.voce.marcos[75], 'marcos não iniciaram');
  ok((G.voce.overHist || []).length >= 9, 'curva do over não registrou');
  console.log(`  desafios: ${(G.voce.desafios || []).map(d => ev(`textoDesafio(${JSON.stringify(d)})`) + ` (${d.prog}/${d.meta})`).join(' | ')}`);
  console.log(`  cumpridos ${G.voce.dzFeitos || 0} · momentos: ${(G.voce.momentos || []).map(x => x.txt).join(' | ') || '—'}`);
  /* limite manual */
  const s = ev('semanaJogador()');
  const hoje = G.turno || 0;
  const jogos = ev('_jogosDoMeuClube()');
  ev("fazerAtividade('range',{simulado:true})"); ev("fazerAtividade('duelo',{simulado:true})");
  const terceira = ev("porqueNaoAtividade('dm')");
  ok(!!terceira || s.energia < 25, 'a terceira atividade do dia passou');
  /* foco */
  const r = ev("definirFoco(['mira','reflexo'])");
  ok(r.ok, 'foco não definido');
  ok(ev("multEvolucao('mira')") > 1.2 && ev("multEvolucao('util')") === 1, 'foco não multiplica');
  ok(!ev("definirFoco(['util','visao'])").ok, 'foco trocou antes da espera');
  G.voce.caixa = 1e6;
  ok(ev('iniciarBootcamp()').ok, 'bootcamp não abriu');
  ok(ev("multEvolucao('util')") > 1.3, 'bootcamp não multiplica');
});
/* por semana: a rotina roda inteira no fechamento */
jogador(false, G => {
  for (let w = 0; w < 4; w++) ev('avancar()');
  const sem = G.voce.semanas.slice(0, 4);
  console.log(`jogador por semana · atividades: ${sem.map(s => s.feitas.join(',')).join(' / ')}`);
  ok(sem.every(s => s.feitas.length >= 3), 'a rotina não rodou no avanço por semana');
});
/* medalhas */
jogador(false, G => {
  const r = ev("fazerAtividade('range',{simulado:false,nota:1.3})");
  ok(r.ok && r.feito.med === 'ouro', 'nota 1,3 não deu ouro');
  const r2 = ev("fazerAtividade('duelo',{simulado:false,nota:0.7})");
  ok(r2.ok && r2.feito.med === 'bronze', 'nota 0,7 não deu bronze');
  ok(ev("medalhasDe('range')").ouro === 1, 'medalha não contou');
});

console.log(falhas ? `${falhas} falha(s)` : 'OK — rotina e evolução conferem');
process.exit(falhas ? 1 : 0);
