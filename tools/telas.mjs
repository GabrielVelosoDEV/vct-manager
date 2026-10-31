#!/usr/bin/env node
/* Captura as telas principais num navegador de verdade.
   Uso: node tools/build.mjs && node tools/telas.mjs [pasta]

   O jsdom de tools/testar-ui.mjs prova que a interface FUNCIONA, mas não
   desenha nada — não tem layout. Este script abre o dist no Chromium e
   salva PNG de cada tela, que é a única forma de conferir o visual sem
   abrir o jogo à mão. Precisa de `npm install` (playwright).

   Sem rede, as fontes do Google não carregam e o texto sai na fonte de
   sistema: o desenho é fiel, a tipografia não. */
import {mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

let chromium;
try{({chromium}=await import('playwright'));}
catch(e){console.error('Precisa do playwright:\n  npm install');process.exit(1);}

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const alvo=resolve(raiz,'dist/vct-manager.html');
if(!existsSync(alvo)){console.error('Rode node tools/build.mjs antes.');process.exit(1);}
const saida=resolve(raiz,process.argv[2]||'capturas');
mkdirSync(saida,{recursive:true});

/* o container pode ter uma build de Chromium diferente da que o playwright
   espera; se houver uma em /opt/pw-browsers, usa ela */
function acharChromium(){
  const base='/opt/pw-browsers';
  if(!existsSync(base))return undefined;
  const dir=readdirSync(base).find(d=>/^chromium-\d+$/.test(d));
  if(!dir)return undefined;
  const p=join(base,dir,'chrome-linux','chrome');
  return existsSync(p)?p:undefined;
}

const nav=await chromium.launch({executablePath:acharChromium(),args:['--no-sandbox','--disable-dev-shm-usage']});
const pg=await nav.newPage({viewport:{width:1440,height:900}});
const erros=[];
pg.on('pageerror',e=>erros.push(e.message));
await pg.goto('file://'+alvo);
await pg.waitForTimeout(900);

const ev=s=>pg.evaluate(s);
const tira=async n=>{await pg.waitForTimeout(200);await pg.screenshot({path:join(saida,n+'.png')});console.log('  '+n+'.png');};

console.log('capturando em '+saida);
await tira('01-menu');
await ev(`telaMenu='config';render()`);            await tira('02-configuracoes');
await ev(`telaMenu='banco';edAba='times';render()`);await tira('03-banco-times');
await ev(`edAba='jogadores';render()`);            await tira('04-banco-jogadores');
await ev(`edAba='comissao';render()`);             await tira('04a-banco-comissao');
await ev(`edAba='torneios';render()`);             await tira('04b-banco-torneios');
await ev(`edAba='agentes';render()`);              await tira('04c-banco-agentes');
await ev(`G.meuTime=G.regioes.AMER.t1[0];tela='inicio';hist=['inicio'];histPos=0;entrarNoJogo()`);
await tira('05-central');
await ev(`irPara('elenco')`);                      await tira('06-elenco');
await ev(`modalJogador(meu().titulares[0])`);      await tira('07-ficha-jogador');
await ev(`$('#modal').innerHTML='';modalEditarJogador(meu().titulares[0]);
  const s=document.querySelector('#edjPais'); if(s){s.focus();s.size=9;}`);
await tira('07b-ficha-editavel');
await ev(`$('#modal').innerHTML='';irPara('taticas')`); await tira('08-taticas');
/* Comps: a tela só diz alguma coisa com uma comp escolhida e o meta já andado. */
await ev(`(function(){const t=G.times[G.meuTime];
  aplicarPreset(t,G.mapasAtivos[0],'conforto');
  definirAgente(t,G.mapasAtivos[0],t.titulares[0],topoDoMeta(P(t.titulares[0]).roleAtual||P(t.titulares[0]).role,1)[0]);
  })();irPara('comps')`);
await tira('08b-comps');
/* Treino no meio da temporada, com adversário à vista: a tela vazia da
   pré-temporada não mostra o que precisa ser conferido. */
await ev(`for(let i=0;i<17;i++)avancar();
  (function(){const t=G.times[G.meuTime];
    definirMapaTreino(t,G.mapasAtivos[2]);
    t.elenco.forEach((id,k)=>definirPlano(t,id,k===0?'agente':k===1?'descanso':'atributo',
      k===0?(agentesDoJogador(G.jogadores[id])[1]||{}).nome:k===1?null:'mira'));})();
  irPara('treino')`);
await tira('15-treino');
/* Central com o treinador demitido: é o estado em que a carreira pode acabar
   em silêncio, então a porta de volta precisa estar visível */
await ev(`(function(){const antes=JSON.stringify(G.manager);
  window.__mgAntes=antes;
  if(typeof criarManager==='function'&&(!G.manager||G.manager.papel!=='treinador')){
    criarManager('Gabriel','treinador');montarMetas();}
  demitirManager(G.times[G.meuTime]);irPara('inicio');})()`);
await tira('05b-central-demitido');
await ev(`if(window.__mgAntes)G.manager=JSON.parse(window.__mgAntes);irPara('inicio')`);
/* História depois de temporadas rodadas: títulos novos e rivalidades só
   existem depois que o circuito girou */
await ev(`for(let i=0;i<120;i++)avancar();irPara('historia')`);
await tira('14-historia');
/* prêmios com duas viradas já entregues, e a ficha de quem ganhou o MVP */
await ev(`irPara('premios')`);                     await tira('14b-premios');
await ev(`(function(){const r=(G.premios||[]).slice(-1)[0];if(r&&G.jogadores[r.mvp.id])modalJogador(r.mvp.id);})()`);
await tira('14c-ficha-premiado');
await ev(`$('#modal').innerHTML=''`);
/* base depois de duas viradas: categoria com garotos e alguém promovido */
await ev(`(function(){const t=G.times[G.meuTime];const b=baseDe(t);if(b[0]&&t.elenco.length<9)promoverDaBase(t,b[0].id);})();irPara('base')`);
await tira('14d-base');
await ev(`irPara('news')`);                        await tira('14e-noticias');
await ev(`irPara('inicio')`);                      await tira('14f-central-manchete');
await ev(`irPara('comp')`);                        await tira('09-competicoes');
/* partida ao vivo: só existe durante um jogo do seu clube, então precisa ser
   capturada no momento certo — é a tela que o jogador mais olha */
/* Relatório de scouting e veto: com comissão boa, para a tela mostrar o que o
   nível 5 entrega — é a diferença que justifica contratar analista. */
await ev(`(function(){
  let c=null,n=0;
  while(n<60&&!c){c=compromissoDaSemana();if(!c){avancar();n++;}}
  /* comissão de elite DEPOIS de avançar: atualizarComissao roda toda semana e
     desfaria o ajuste. É o nível 5 que a captura precisa mostrar. */
  const t=G.times[G.meuTime];t.staff.analista=5;t.staff.olheiro=5;
  if(c)abrirPrePartida(c,()=>{});})()`);
await tira('13a-relatorio');
await ev(`if(typeof PP!=='undefined'&&PP){ppIrParaVeto();
  const cs=document.querySelectorAll('[data-ppmapa]:not([disabled])');
  if(cs.length)cs[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));}`);
await tira('13b-veto');
/* o resto do veto, parando na escolha de lado se ela for sua, e depois a
   etapa de comps da série */
await ev(`if(typeof PP!=='undefined'&&PP){const V=PP.V;let k=0;
  while(!V.fim&&k++<40){if(vetoMinhaVez(V)&&V.passos[V.i].tipo==='lado')break;vetoEscolher(V,null);vetoAvancarAteMim(V);}
  ppPintar();}`);
await tira('13b2-lado');
await ev(`if(typeof PP!=='undefined'&&PP){const V=PP.V;let k=0;
  while(!V.fim&&k++<40)vetoEscolher(V,null);ppCompsAutomaticas();PP.etapa='comps';ppPintar();}`);
await tira('13b3-comps');
await ev(`if(typeof PP!=='undefined'&&PP){
  /* termina o veto e deixa a série ser conduzida ao vivo, que é o modo em que
     o pedido de tempo existe */
  ppConfirmar();
  for(let k=0;k<22;k++)if(typeof avPasso==='function')avPasso();
  if(typeof AV!=='undefined'&&AV&&AV.S&&AV.S.M)avPedirTempo();
}`);
await tira('13c-ao-vivo-tempo');
await ev(`if(typeof AV!=='undefined'&&AV){avFechar();}
  if(typeof PP!=='undefined'&&PP){ppFechar();}`);
await ev(`(function(){let r=null,n=0;
  while(n<60){r=avancar();n++;if(r&&r.minhaPartida)break;}
  if(r&&r.minhaPartida){partidaAoVivo(r.minhaPartida);
    for(let k=0;k<26;k++)if(typeof avPasso==='function')avPasso();}})()`);
await tira('13-ao-vivo');
await ev(`if(typeof avFechar==='function')avFechar();$('#modal').innerHTML='';render()`);
/* Competições com o circuito rodado: tabela de grupos vazia e chaveamento
   vazio não mostram nada do que precisa ser conferido. */
await ev(`for(let i=0;i<24;i++)avancar();irPara('comp');compAba='minha';render()`);
await tira('09b-competicoes-grupos');
await ev(`for(let i=0;i<12;i++)avancar();render()`);
await tira('09c-competicoes-chave');
await ev(`irPara('mercado');mercAba='jogadores';render()`); await tira('10-mercado');
await ev(`mercAba='comissao';render()`);           await tira('10b-mercado-comissao');
/* mesa de negociação: conversa com o clube e, depois da multa, com o jogador */
await ev(`G.janela=true;(function(){const t=meu();t.caixa=Math.max(t.caixa,5e6);
  const p=Object.values(G.jogadores).find(x=>x.timeId&&x.timeId!==t.id&&!recusasDuras(x,t,2).length);
  window.__neg=p.id;modalNegociacao(p.id);})()`);
await tira('10d-mesa-clube');
await ev(`(function(){const n=negociacaoAtivaDe(window.__neg);if(n){pagarMulta(n);mesa(P(window.__neg),n,null);}})()`);
await tira('10e-mesa-jogador');
await ev(`$('#modal').innerHTML=''`);
await ev(`mercAba='contratos';render()`);           await tira('10f-mercado-contratos');
await ev(`modalRenovacao(meu().elenco[0])`);        await tira('10g-mesa-renovacao');
await ev(`$('#modal').innerHTML=''`);
/* Saídas com um anúncio de pé e uma proposta na mesa: a tela vazia não mostra
   nada do que precisa ser conferido. */
await ev(`$('#modal').innerHTML='';irPara('mercado');mercAba='saidas';
  G.janela=true;
  (function(){const t=G.times[G.meuTime];
    const p=G.jogadores[t.elenco.find(i=>!t.titulares.includes(i))||t.elenco[0]];
    anunciarJogador(p,'ambos',true,pedidoDeVenda(p));
    for(let i=0;i<60&&!(G.propostas||[]).length;i++)gerarPropostas();})();
  render()`);
await tira('10c-mercado-saidas');
await ev(`mercAba='jogadores';irPara('taticas');modalStaff(Object.values(G.staff).find(m=>m.timeId===G.meuTime).id)`);
await tira('12-ficha-comissao');
/* fecha a ficha antes: sem isso a captura de Finanças saía com o modal da
   comissão por cima, e a tela que mostra a economia nunca era conferida */
await ev(`$('#modal').innerHTML='';irPara('financas')`); await tira('11-financas');
/* guia da primeira temporada: dica no topo e primeiros passos na Central */
await ev(`iniciarGuia();G.guia.ano=G.ano;G.guia.vistos.elenco=true;irPara('inicio')`); await tira('16-guia-central');
await ev(`irPara('treino')`);                      await tira('16b-guia-dica');
await ev(`G.guia.fim=true;render()`);

console.log(erros.length?'\nERROS DE PÁGINA:\n'+erros.map(e=>' · '+e).join('\n'):'\nnenhum erro de página.');
await nav.close();
process.exit(erros.length?1:0);
