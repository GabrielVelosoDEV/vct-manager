#!/usr/bin/env node
/* Modo Dono, os outros donos (fase 5): confere a relação com os donos (proposta
   humilhante, porta fechada, jantar, provocação), o chefe do treinador, e uma
   temporada simulada com os donos agindo (troca de técnico, venda de
   organização), duas vezes com a mesma semente para garantir o mesmo mundo.
   Uso: node tools/dono-donos.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n') + '\nmodule.exports={ev:s=>eval(s)};';
const tmp = resolve(raiz, '.dd.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };

/* 1. treinador: o chefe é o dono */
const tr = m.ev(`criarMundo(${semente});montarCalendario();const c=G.regioes.BR?null:G.regioes.AMER.t1.map(id=>G.times[id]).find(t=>t.tag==='LOUD');
  G.meuTime=c.id;criarManager('T','treinador',{});montarMetas();const s=situacaoManager();({chefe:chefeDoClube(),txt:s.texto,k:fatorCobrancaDono(-10)})`);
ok(tr.chefe && /PlayHard/.test(tr.chefe.nome), 'o chefe do LOUD não é o dono: ' + JSON.stringify(tr.chefe));
ok(/PlayHard/.test(tr.txt), 'a situação do treinador não fala do dono: ' + tr.txt);
console.log('treinador: ' + tr.txt + ' · cobrança ×' + tr.k);

/* 2. dono: relação nos negócios */
const rel = m.ev(`(()=>{criarMundo(${semente});montarCalendario();G.janela=true;
  const eu=G.regioes.EMEA.t1.map(id=>G.times[id]).sort((a,b)=>b.prestigio-a.prestigio)[4];G.meuTime=eu.id;eu.caixa=50000000;
  criarManager('D','dono',{variante:'puro'});tornarVoceDono(eu);
  const outro=G.regioes.EMEA.t1.map(id=>G.times[id]).find(t=>t.id!==eu.id&&t.dono&&t.dono.tipo==='pessoa')||G.times[G.regioes.EMEA.t1.find(id=>id!==eu.id)];
  const p=outro.elenco.map(i=>G.jogadores[i]).find(x=>posturaDoClube(x).id!=='intransferivel'&&!recemChegado(x));
  const r0=relDono(outro);
  const a=abrirNegociacao(p,eu);const n=a.neg;
  const r1=proporAoClube(n,Math.round(precoPedido(p)*0.2));
  const depoisOfensa=relDono(outro);
  relDonos()[outro.id]=-70;
  const nf=negociacoes().filter(x=>x!==n);G.negociacoes=nf;p.negBloq=0;
  const b=abrirNegociacao(p,eu);const r2=proporAoClube(b.neg,Math.min(multaDe(p)-5000,Math.round(precoPedido(p)*1.3)));
  relDonos()[outro.id]=0;
  const j=jantarDeNegocios(outro.id),j2=jantarDeNegocios(outro.id);
  const t0=eu.torcida;const pv=provocarDono(outro.id);
  return {dono:outro.dono.nome,r0,depoisOfensa,porta:r2.resposta,j:j.ok,j2:j2.ok,rel:relDono(outro),torcida:eu.torcida-t0,log:logDonos().length};})()`);
ok(rel.depoisOfensa < rel.r0, 'proposta humilhante não esfriou a relação');
ok(rel.porta === 'recusa', 'com a relação em −70 o dono ainda negociou: ' + rel.porta);
ok(rel.j && !rel.j2, 'jantar não funcionou ou deixou repetir na temporada');
ok(rel.torcida > 0, 'provocação não deu torcida');
console.log(`relação com ${rel.dono}: ${rel.r0} → ofensa ${rel.depoisOfensa} · porta fechada: ${rel.porta} · depois do jantar e da provocação ${rel.rel}`);

/* 3. uma temporada com os donos agindo, duas vezes */
const temporada = () => m.ev(`(()=>{criarMundo(${semente});montarCalendario();
  const eu=G.regioes.PAC.t1.map(id=>G.times[id])[0];G.meuTime=eu.id;criarManager('D','dono',{variante:'livre'});tornarVoceDono(eu);
  let n=0;const a=G.ano;while(G.ano===a&&n<80){avancar();n++;G.conselhoPendente=null;}
  const L=logDonos();
  return {n,trocas:L.filter(x=>/Demitiu/.test(x.txt)).length,vendas:L.filter(x=>/vende a organização/.test(x.txt)).length,
    rel:Object.keys(relDonos()).length,assin:JSON.stringify(Object.values(G.times).map(t=>[t.temporada&&t.temporada.v,Math.round(t.caixa)]))};})()`);
const t1 = temporada(), t2 = temporada();
ok(t1.assin === t2.assin, 'a mesma semente deu mundos diferentes');
console.log(`temporada: ${t1.trocas} troca(s) de técnico por dono · ${t1.vendas} organização(ões) vendida(s) · relação com ${t1.rel} dono(s)`);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
