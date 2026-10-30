#!/usr/bin/env node
/* Varre o TEXTO renderizado de todas as telas, em onze pontos da temporada,
   atrás de valor que escapou para a cara do jogador: NaN, undefined,
   [object Object], Infinity, null.

   É a checagem mais barata que existe para uma classe inteira de bug — um
   campo que não foi migrado, uma conta com divisor zero, um objeto
   concatenado em string — e nenhuma delas quebra nada: só aparece na tela.
   Uso: node tools/telas-texto.mjs   (precisa de dist/ construído) */
import {readFileSync} from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const achados=[];
const dom=new JSDOM(readFileSync(new URL('../dist/vct-manager.html',import.meta.url),'utf8'),
  {runScripts:'dangerously',pretendToBeVisual:true,url:'https://local.test/',virtualConsole:new VirtualConsole()});
const w=dom.window;w.HTMLCanvasElement.prototype.getContext=()=>null;
w.alert=()=>{};w.confirm=()=>true;
await new Promise(r=>setTimeout(r,1300));
const R=s=>{try{return w.eval(s);}catch(e){achados.push('eval: '+e.message.slice(0,90));return null;}};
R(`criarMundo(20260828);montarCalendario();G.meuTime=G.regioes.AMER.t1[0];
   criarManager('G','treinador');montarMetas();modo='jogo';render();`);
const RUIM=/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b|\bnull\b/;
const olhar=(onde,txt)=>{
  const m=String(txt).match(RUIM);
  if(!m)return;
  const i=String(txt).indexOf(m[0]);
  achados.push(onde+': "'+String(txt).slice(Math.max(0,i-60),i+40).replace(/\s+/g,' ')+'"');
};
const telas=R(`NAV.map(x=>x[0])`)||[];
const abasEd=R(`ED_ABAS.map(x=>x[0])`)||[];
for(const sem of [1,6,12,18,22,26,33,37,42,46,50]){
  R(`while(G.semana<${sem}&&G.semana<=52)avancar();`);
  for(const t of telas){
    R(`tela='${t}';render();`);
    olhar('semana '+sem+' · tela '+t, R(`$('#view').textContent`));
  }
  for(const ab of ['minha','INT','pts'])
    olhar('semana '+sem+' · comp/'+ab, R(`tela='comp';compAba='${ab}';render();$('#view').textContent`));
  for(const ab of ['jogadores','comissao','saidas'])
    olhar('semana '+sem+' · mercado/'+ab, R(`tela='mercado';mercAba='${ab}';render();$('#view').textContent`));
  olhar('semana '+sem+' · topbar', R(`$('#top').textContent`));
  /* fichas */
  olhar('semana '+sem+' · ficha jogador', R(`(function(){const t=G.times[G.meuTime];
    modalJogador(t.titulares[0]);const s=$('#modal').textContent;$('#modal').innerHTML='';return s;})()`));
  olhar('semana '+sem+' · ficha comissão', R(`(function(){const id=Object.keys(G.staff)[0];
    modalStaff(id);const s=$('#modal').textContent;$('#modal').innerHTML='';return s;})()`));
}
/* menu principal e editor */
R(`modo='menu';telaMenu='config';render();`);
olhar('menu/config', R("(raizAtual()||{textContent:''}).textContent"));
for(const ab of abasEd){
  R(`telaMenu='banco';edAba='${ab}';render();`);
  olhar('editor/'+ab, R(`(raizAtual()||document.body).textContent`));
}
process.exitCode=achados.length?1:0;
console.log(achados.length?`ACHADOS (${achados.length}):\n`+[...new Set(achados)].slice(0,20).map(e=>' · '+e).join('\n')
  :'OK — nenhum valor solto na tela');
dom.window.close();
