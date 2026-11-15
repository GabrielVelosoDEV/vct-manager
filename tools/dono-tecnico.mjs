#!/usr/bin/env node
/* Modo Dono com técnico IA (fase 3): cria carreiras de Dono puro e de
   Dono-técnico, avança temporadas sem tela e confere:
     · o técnico (ou o interino) escala cinco toda semana, com a IA
     · o mandato vira o orçamento e é avaliado no fim do ano
     · os pedidos aparecem com a janela aberta e andam (aprovar, negar)
     · interferir funciona e custa confiança
     · demitir abre a vaga; a entrevista contrata; o híbrido senta no banco
       e o time volta a ser dele
     · a mesma semente dá o mesmo mundo (nada aqui usa o gerador)
   Uso: node tools/dono-tecnico.mjs [temporadas] [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n')
  + `\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,tornarVoceDono,tecIA,tecnicoAtual,tecnicoComanda,
     definirMandato,mandatoPendente,aprovarPedido,negarPedido,interferir,demitirTecnico,candidatosTecnico,contratarTecnico,
     assumirBanco,escalarPeloTecnico,orcamentoDe,over,get G(){return G;},set G(v){G=v;}};`;
const tmp = resolve(raiz, '.dt.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const anos = +(process.argv[2] || 1), semente = +(process.argv[3] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

function rodar(variante) {
  m.criarMundo(semente); m.montarCalendario();
  const G = m.G;
  const clube = G.regioes.AMER.t1.map(id => G.times[id]).sort((a, b) => b.prestigio - a.prestigio)[3];
  G.meuTime = clube.id;
  m.criarManager('Teste', 'dono', {variante, perfilDono: 'paciente'});
  m.tornarVoceDono(clube);
  ok(m.tecnicoComanda(clube), variante + ': o técnico não comanda');
  ok(m.mandatoPendente(), variante + ': mandato não ficou pendente');
  const r = m.definirMandato({meta: 'realista', verba: 500000, diretriz: 'jovens'});
  ok(r.ok && !m.mandatoPendente(), variante + ': mandato não foi definido');
  ok(m.orcamentoDe(clube).verba === 500000, variante + ': a verba não virou orçamento');
  let semanas = 0, pedidos = 0, aprovados = 0, negados = 0, sem5 = 0, banco = false, interfOk = false, contratou = false;
  const ano0 = G.ano;
  try {
    while (G.ano < ano0 + anos && semanas < 80 * anos + 10) {
      if (m.mandatoPendente()) m.definirMandato({meta: 'realista', verba: 300000, diretriz: 'livre'});
      m.avancar(); semanas++;
      const x = m.tecIA();
      if ((clube.titulares || []).length < 5 && clube.elenco.length >= 5) sem5++;
      for (const pd of x.pedidos.filter(p => p.status === 'aberto')) {
        pedidos++;
        if (pedidos % 2) { m.aprovarPedido(pd.id); aprovados++; } else { m.negarPedido(pd.id); negados++; }
      }
      if (semanas === 12 && !interfOk && m.tecnicoComanda(clube)) {
        const res = clube.elenco.find(i => !clube.titulares.includes(i));
        if (res) {
          const c0 = x.confianca, ri = m.interferir(res, 'exige');
          interfOk = ri.ok && clube.titulares.includes(res) && x.confianca < c0;
          ok(interfOk, variante + ': exigir titular não colocou o jogador no cinco ou não custou confiança');
        }
      }
      if (semanas === 20) {
        const d = m.demitirTecnico();
        ok(d.ok && !m.tecnicoAtual(clube), variante + ': demitir não abriu a vaga');
        ok(m.tecnicoComanda(clube), variante + ': sem técnico, o interino deveria comandar');
        if (variante === 'hibrido') {
          const b = m.assumirBanco();
          banco = b.ok && !m.tecnicoComanda(clube) && clube.staff.tecnico > 1;
          ok(banco, variante + ': sentar no banco não devolveu o time ao dono: ' + JSON.stringify(b));
        }
      }
      if (semanas === 30) {
        const c = m.candidatosTecnico();
        ok(c.length > 0, variante + ': nenhum candidato a técnico');
        if (c.length) {
          const rc = m.contratarTecnico(c[0].id, ['precisa', 'cobranca', 'projeto']);
          contratou = rc.ok && m.tecnicoAtual(clube) && m.tecnicoAtual(clube).id === c[0].id && m.tecnicoComanda(clube);
          ok(contratou, variante + ': contratar não colocou o técnico no comando');
        }
      }
    }
  } catch (e) { ok(false, variante + ': erro avançando: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); }
  const x = m.tecIA();
  ok(sem5 === 0, variante + `: ${sem5} semana(s) sem cinco escalado`);
  ok(pedidos > 0, variante + ': o técnico não fez nenhum pedido no ano');
  ok(x.confianca >= 0 && x.confianca <= 100, variante + ': confiança fora da faixa');
  ok((x.balancos || []).length >= 1, variante + ': o mandato não foi avaliado no fim do ano');
  const tec = m.tecnicoAtual(clube);
  console.log(`${variante.padEnd(8)} ${clube.tag.padEnd(5)} ${semanas} semanas · ${pedidos} pedidos (${aprovados} aprovados, ${negados} negados) · confiança ${Math.round(x.confianca)} · técnico ${tec ? tec.nome : 'interino'}${banco ? ' · sentou no banco' : ''} · balanço ${x.balancos && x.balancos[0] ? x.balancos[0].pos + 'º/' + x.balancos[0].de + (x.balancos[0].cumpriu ? ' ok' : ' abaixo') : '—'}`);
  return JSON.stringify([clube.temporada, clube.caixa, x.confianca, x.pedidos.length, Object.values(G.times).map(t => t.temporada && t.temporada.v).join(',')]);
}
const a = rodar('puro'), b = rodar('hibrido'), a2 = rodar('puro');
ok(a === a2, 'a mesma semente deu mundos diferentes no Dono puro');
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
