#!/usr/bin/env node
/* Valorant World Cup (C7): o modo técnico.
   1) Carreira de treinador que comanda clube e seleção (a pedida, padrão KR)
      desde o começo: a comissão da seleção é você, a convocação e a tática
      são as suas, e cada série da seleção para o relógio (pré-jogo) e é
      jogada "na tela" (veto automático, simulada) e entregue pronta.
   2) Carreira de treinador sem seleção: os convites saem no começo do ciclo.
   Uso: node tools/copa-tecnico.mjs [país=KR] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const nomes = 'criarMundo,montarCalendario,avancar,criarManager,instalarManagerNoClube,assumirSelecao,selecaoDoTecnico,comissaoDaSelecao,convocacao,_convocacao,salvarConvocacaoDoTecnico,salvarTaticaDaSelecao,jogoDeSelecaoDoUsuario,timeDaSelecao,entrarSelecoesEmCampo,abrirSerie,serieAbrirMapa,passoRound,serieFecharMapa,iniciarVeto,vetoEscolher,vetoResultado,fecharSerieSelecaoConduzida,injetarSerieSelecao,infoSelecao,convitesSelecaoAbertos,responderConviteSelecao,membroManager,rankingPaises';
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n') + `\nmodule.exports={${nomes},get G(){return G;}};`;
const tmp = resolve(raiz, '.ct.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const pais = (process.argv.find(a => /^[A-Z]{2}$/.test(a)) || 'KR');
const semente = +(process.argv.find(a => /^\d+$/.test(a)) || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };
const sig = p => m.infoSelecao(p).sigla;

function novaCarreira(selecao) {
  m.criarMundo(semente); m.montarCalendario();
  const G = m.G;
  const t = G.regioes.EMEA.t1.map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[1];
  G.meuTime = t.id;
  m.criarManager('Teste', 'treinador', {pais: 'BR', modo: 'lenda'});
  m.instalarManagerNoClube(t);
  if (selecao) m.assumirSelecao(selecao);
  return G;
}

/* 1) clube e seleção */
let G = novaCarreira(pais);
const eu = m.membroManager();
ok(m.selecaoDoTecnico() === pais, 'não assumiu a seleção');
ok(m.comissaoDaSelecao(pais).tecnico === eu.id, 'a comissão da seleção não é você');
const outras = Object.keys(G.copa.comissao).filter(p => p !== pais && G.copa.comissao[p].tecnico === eu.id);
ok(!outras.length, 'você foi escolhido técnico de outra seleção');
/* a convocação do técnico: a sugestão com o 6º melhor no lugar do 5º titular */
const sug = m._convocacao(pais);
const tit = sug.titulares.slice(0, 4).concat(sug.reservas[0]), res = [sug.titulares[4]].concat(sug.reservas.slice(1));
const r = m.salvarConvocacaoDoTecnico(tit, res);
ok(r.ok, 'convocação recusada: ' + r.motivo);
ok(JSON.stringify(m.convocacao(pais).titulares) === JSON.stringify(tit), 'a convocação usada não é a sua');
m.salvarTaticaDaSelecao({agres: 5, foco: 'execucao'});
const tsel = m.timeDaSelecao(pais);
ok(tsel.tatica.agres === 5 && tsel.tatica.foco === 'execucao', 'a tática da seleção não é a sua');

const series = [];
let semanas = 0;
while (!(G.ano === 2029 && G.semana >= 2) && semanas < 600) {
  let pend, guarda = 0;
  while ((pend = m.jogoDeSelecaoDoUsuario()) && guarda++ < 6) {
    ok(pend.papel === 'tecnico', 'série parou com papel errado');
    const cv = pend.ctx.conv || {};
    const A = m.timeDaSelecao(pend.a, cv[pend.a]), B = m.timeDaSelecao(pend.b, cv[pend.b]);
    const meu = pend.a === pais ? A : B, adv = meu === A ? B : A;
    const sair = m.entrarSelecoesEmCampo([A, B]);
    const V = m.iniciarVeto(meu.id, adv.id, pend.ctx.bo, meu === A);
    let n = 0; while (!V.fim && n++ < 40) m.vetoEscolher(V, null);
    const vr = m.vetoResultado(V);
    const S = m.abrirSerie(A.id, B.id, pend.ctx.bo, {seq: vr.seq, mapas: vr.mapas, lados: vr.lados});
    while (!S.fim) { if (!m.serieAbrirMapa(S)) break; while (!S.M.fim) m.passoRound(S.M); m.serieFecharMapa(S); }
    const f = m.fecharSerieSelecaoConduzida(S, A, B, pend);
    sair(); m.injetarSerieSelecao(f);
    ok(JSON.stringify(f.esc[pend.a === pais ? 'a' : 'b']) === JSON.stringify(m.convocacao(pais) ? f.esc[pend.a === pais ? 'a' : 'b'] : []), '');
    series.push(`${G.ano}/${G.semana} ${pend.ctx.fase}: ${sig(f.a)} ${f.wa}–${f.wb} ${sig(f.b)}`);
  }
  m.avancar(); semanas++;
}
console.log(`técnico de ${sig(pais)} e do ${G.times[G.meuTime].nome}\nséries da seleção:\n  ` + series.join('\n  '));
ok(series.length >= 3, 'a seleção quase não jogou');
const ed = G.copa.edicoes.find(e => e.ano === 2028);
ok(ed, 'a Copa de 2028 não fechou');
if (ed) console.log(`World Cup 2028: campeã ${sig(ed.campeao)}; ${sig(pais)} ${ed.alcance && ed.alcance[pais] || 'fora'}`);
const hist = G.copa.tecnicos && G.copa.tecnicos[eu.id];
ok(hist && hist.ed.includes(2028), 'o seu histórico de técnico de seleção não registrou a Copa');
ok(!Object.keys(G.times).some(k => k.startsWith('SEL-')), 'sobrou seleção em G.times');

/* 2) sem seleção: convites */
G = novaCarreira(null);
let viu = null;
for (let i = 0; i < 3 && !viu; i++) { m.avancar(); const c = m.convitesSelecaoAbertos(); if (c.length) viu = c; }
console.log('\nconvites no começo do ciclo:', viu ? viu.map(c => sig(c.pais)).join(', ') : 'nenhum');
if (viu) {
  const rr = m.responderConviteSelecao(viu[0].pais, true);
  ok(rr.ok && m.selecaoDoTecnico() === viu[0].pais, 'aceitar o convite não deu a seleção');
  ok(m.comissaoDaSelecao(viu[0].pais).tecnico === m.membroManager().id, 'aceitou e a comissão não mudou');
}
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
