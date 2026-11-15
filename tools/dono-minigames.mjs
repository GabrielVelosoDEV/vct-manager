#!/usr/bin/env node
/* Modo Dono, minigames de gestão (fase 6), sem tela: lança uma coleção de
   uniforme e acompanha a venda até a liquidação, faz o fan fest (nota boa e
   delegado), o pitch (as ofertas mudam com a nota e o tom), a mesa de
   patrocínio (contraproposta, aceite, ofensa) e a crise de imagem (sorteada
   pelo hash, resolvida e ignorada).
   Uso: node tools/dono-minigames.mjs [semente] */
import {readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ordem = [...readFileSync(resolve(raiz, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => !p.includes('/ui/') && !p.includes('storage') && !p.includes('assets') && !p.endsWith('main.js'));
const bundle = ordem.map(p => readFileSync(resolve(raiz, p), 'utf8')).join('\n') + '\nmodule.exports={ev:s=>eval(s)};';
const tmp = resolve(raiz, '.dm.tmp.cjs');
writeFileSync(tmp, bundle); const m = createRequire(import.meta.url)(tmp); unlinkSync(tmp);
const semente = +(process.argv[2] || 20260828);
let falhas = 0; const ok = (c, msg) => { if (!c) { falhas++; console.log('  FALHA:', msg); } };
const r = m.ev(`(()=>{criarMundo(${semente});montarCalendario();
  const t=G.regioes.AMER.t1.map(id=>G.times[id]).sort((a,b)=>b.prestigio-a.prestigio)[2];G.meuTime=t.id;t.caixa+=3000000;
  criarManager('D','dono',{variante:'puro'});tornarVoceDono(t);definirMandato({meta:'realista',verba:0,diretriz:'livre'});
  const out={};
  out.semLoja=!!uniformeDisponivel();
  melhorarLoja();
  const o={modelo:modaDoAno().alta,cores:'clube',preco:UNI_PRECOS[1][1],tiragem:UNI_TIRAGENS[1][1]};
  out.pesq=pesquisaUniforme(t,o);
  out.uni=lancarUniforme(o,false).ok;out.uni2=lancarUniforme(o,false).ok;
  const c=miniDono().colecoes[0];
  for(let i=0;i<20&&!c.fim;i++){avancar();G.conselhoPendente=null;G.criseNova=false;}out.col={vend:c.vendidos,tir:c.tiragem,fim:c.fim,rec:c.receita,custo:c.custo};
  const f1=realizarFanFest({local:'media',atracoes:['autografos','show'],preco:FF_PRECOS[1][1]},0.9,false);
  out.ff={ok:f1.ok,pub:f1.r&&f1.r.publico,lucro:f1.r&&f1.r.lucro,repete:realizarFanFest({local:'pequena',atracoes:[],preco:15},1,false).ok};
  const e=empresa();
  const base=(()=>{gerarOfertas('base');return e.ofertas.map(x=>x.aporte);})();e.ofertas=[];
  const p=aplicarPitch(1,'pru');out.pitch={ok:p.ok,base,depois:e.ofertas.map(x=>x.aporte),metas:e.ofertas.map(x=>x.meta)};
  out.pitch2=aplicarPitch(1,'amb').ok;
  const ct=contratoDe(t,'master');out.fixo0=ct?ct.fixo:null;
  if(ct){abrirMesaPatrocinio();const m1=proporPatrocinio(0.6,0);const m2=m1.resposta==='contra'?proporPatrocinio(miniDono().mesa.contra,0):m1;
    out.mesa=[m1.resposta,m2.resposta];out.fixo1=contratoDe(t,'master').fixo;out.mesaDeNovo=!!mesaPatrocinioDisponivel();}
  let n=0;while(!crisePendente()&&n<70){avancar();n++;G.conselhoPendente=null;G.criseNova=false;}
  out.crise=crisePendente()?crisePendente().tipo:null;const tor=t.torcida;
  out.efeito=resolverCrise(0.95,'coletiva');out.torcidaCrise=t.torcida-tor;
  return out;})()`);
ok(!r.semLoja, 'janela de uniforme aberta sem loja');
ok(r.uni && !r.uni2, 'lançou a coleção, ou deixou lançar duas na mesma janela');
ok(r.col.fim && r.col.vend > 0, 'a coleção não vendeu ou não fechou em oito semanas: ' + JSON.stringify(r.col));
ok(r.ff.ok && !r.ff.repete && r.ff.pub > 0, 'fan fest não aconteceu ou deixou repetir');
ok(r.pitch.ok && r.pitch.metas.every(x => !x || x === 'lucro'), 'o pitch prudente não virou meta de lucro: ' + JSON.stringify(r.pitch.metas));
ok(!r.pitch2, 'pitch repetido no mesmo trimestre');
if (r.fixo0) { ok(r.mesa[1] === 'aceita' && r.fixo1 > r.fixo0 && !r.mesaDeNovo, 'mesa de patrocínio não fechou: ' + JSON.stringify(r.mesa)); }
ok(r.crise, 'nenhuma crise em mais de um ano');
ok(r.efeito && r.torcidaCrise > 0, 'resposta boa na crise não deu torcida');
console.log(`uniforme: pesquisa ${r.pesq.min}–${r.pesq.max} · vendeu ${r.col.vend}/${r.col.tir} · receita ${Math.round(r.col.rec / 1e3)}k (produção ${Math.round(r.col.custo / 1e3)}k)`);
console.log(`fan fest: ${r.ff.pub} pessoas · lucro ${Math.round(r.ff.lucro / 1e3)}k`);
console.log(`pitch: aporte ${r.pitch.base.map(x => Math.round(x / 1e3) + 'k').join('/')} → ${r.pitch.depois.map(x => Math.round(x / 1e3) + 'k').join('/')}`);
console.log(`máster: ${r.fixo0 ? Math.round(r.fixo0 / 1e3) + 'k → ' + Math.round(r.fixo1 / 1e3) + 'k (' + r.mesa.join(', ') + ')' : 'sem máster'}`);
console.log(`crise: ${r.crise} · torcida ${r.torcidaCrise >= 0 ? '+' : ''}${r.torcidaCrise.toFixed(1)}`);
console.log(falhas ? `${falhas} falha(s)` : 'ok');
process.exit(falhas ? 1 : 0);
