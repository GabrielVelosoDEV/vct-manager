/* ============================================================
   MODO JOGADOR — O LEILÃO POR UM CRAQUE
   ------------------------------------------------------------
   Quando dois ou mais clubes grandes querem o mesmo jogador de
   nível alto, não chegam propostas soltas: abre uma disputa.
   Cada clube põe na mesa salário, luvas, anos e a taxa que paga
   ao seu clube atual. A cada rodada que você pede, quem ainda
   pode sobe o lance; quem chegou ao teto sai. O seu clube pode
   entrar para cobrir com uma renovação. Você escolhe a qualquer
   momento, ou deixa a disputa fechar: o que estiver na mesa vira
   proposta normal por duas semanas.

   Sorteios por (ano, semana, assunto, rodada), como o resto do
   mercado do jogador: o gerador do mundo não é tocado.
   ============================================================ */
const LEILAO_OVER=84;          /* a partir de que over clube grande disputa */
const LEILAO_RODADAS=3;        /* quantas vezes dá para pedir mais */
const LEILAO_VALIDADE=3;       /* semanas que a mesa fica aberta */
const LEILAO_ESPERA=26;        /* semanas entre um leilão e outro */
const LEILAO_PRESTIGIO=62;     /* "clube grande" */

function leilaoAtual(){
  const l=G.voce&&G.voce.leilao;
  if(!l)return null;
  if(l.validoAte<_sAbs()){fecharLeilao('prazo');return null;}
  return l;
}
/* valor do pacote para comparar lances: o que você leva no contrato inteiro */
function valorLance(x){return x.salario*12*x.anos+(x.luvas||0);}
function melhorLance(l){
  const vivos=(l||{}).lances?l.lances.filter(x=>!x.saiu):[];
  return vivos.sort((a,b)=>valorLance(b)-valorLance(a))[0]||null;
}
/* quanto cada clube pode chegar: nome, caixa e o quanto precisa de você */
function _tetoLeilaoJ(t,p){
  const base=salario(p,t);
  const nome=Math.max(0,(t.prestigio-55)/100);
  const precisa=Math.max(0,Math.min(0.15,(over(p)-_piorTitularDaFuncao(t,p))/60));
  const caixa=Math.max(0,Math.min(0.12,(t.caixa||0)/Math.max(1,receitaAnual(t))*0.05));
  const sorte=_sorteMerc('teto'+t.id)*0.12;
  const k=1.12+nome+precisa+caixa+sorte+nivelEmpresario()*0.04;
  return{salario:Math.round(base*k/100)*100,luvas:Math.round(base*k*(3+_sorteMerc('lv'+t.id)*3)/500)*500};
}
/* Abre o leilão se a situação pede. Devolve true se abriu (ou se já há um). */
function talvezAbrirLeilao(p){
  if(!G.voce||!p||over(p)<LEILAO_OVER)return false;
  if(leilaoAtual())return true;
  if(G.voce.leilaoUlt!=null&&_sAbs()-G.voce.leilaoUlt<LEILAO_ESPERA)return false;
  const t=p.timeId?G.times[p.timeId]:null;
  const pediu=p.pedidoSaida&&!p.pedidoSaida.negado;
  /* com clube: só quando dá para sair (janela, último ano ou pedido de saída) */
  if(t&&!(G.janela||p.contrato<=1||pediu))return false;
  const grandes=clubesInteressadosJogador(p,10)
    .filter(x=>x.t.tier===1&&x.t.prestigio>=LEILAO_PRESTIGIO).slice(0,4);
  if(grandes.length<2)return false;
  const chance=0.22+_nivelTopo(p)*0.2+(pediu?0.25:0)+(t?0:0.3)+nivelEmpresario()*0.05;
  if(_sorteMerc('leilao')>chance)return false;
  abrirLeilaoJogador(p,grandes.map(x=>x.t));
  return true;
}
function abrirLeilaoJogador(p,clubes){
  const dono=p.timeId?G.times[p.timeId]:null;
  const pre=!!(dono&&p.contrato<=1&&!G.janela);
  const multa=dono&&typeof multaDe==='function'?multaDe(p):0;
  const lances=clubes.map(t=>{
    const teto=_tetoLeilaoJ(t,p);
    const f=0.86+_sorteMerc('ini'+t.id)*0.08;
    return{tid:t.id,salario:Math.round(teto.salario*f/100)*100,luvas:Math.round(teto.luvas*(0.45+_sorteMerc('ilv'+t.id)*0.2)/500)*500,
      anos:3+(_sorteMerc('an'+t.id)<0.3?1:0),
      taxa:dono&&!pre?Math.round(multa*(0.75+_sorteMerc('tx'+t.id)*0.15)/5000)*5000:0,
      teto,saiu:false,subiu:false};
  });
  G.voce.leilao={id:'lei'+_sAbs(),criada:_sAbs(),validoAte:_sAbs()+LEILAO_VALIDADE,rodada:0,max:LEILAO_RODADAS,
    dono:dono?dono.id:null,pre,lances,log:[`${clubes.length} clubes abriram a disputa.`]};
  G.voce.leilaoUlt=_sAbs();
  for(const t of clubes)(G.voce.ultProp=G.voce.ultProp||{})[t.id]=_sAbs();
  if(typeof noticia==='function')noticia(`🔨 Leilão por ${p.nome}: ${clubes.map(t=>t.nome).join(', ')} disputam o jogador.`,
    {c:'mercado',p:[p.id],t:clubes.map(t=>t.id),imp:2});
  return G.voce.leilao;
}
/* Mais uma rodada: cada clube que ainda está na mesa olha o melhor lance e
   decide se cobre. Quem não alcança sai; quem já lidera às vezes não mexe. */
function rodadaLeilao(){
  const l=leilaoAtual(),p=meuJogador();
  if(!l||!p)return{ok:false,motivo:'Não há leilão aberto.'};
  if(l.rodada>=l.max)return{ok:false,motivo:'Os clubes já deram o último lance.'};
  l.rodada++;
  const lider=melhorLance(l);
  const msgs=[];
  for(const x of l.lances){
    x.subiu=false;
    if(x.saiu||x.dono)continue;
    const t=G.times[x.tid];
    if(x===lider){
      /* quem lidera às vezes adoça para fechar logo */
      if(_sorteMerc('lid'+l.rodada+x.tid)<0.35&&x.luvas<x.teto.luvas){x.luvas=Math.min(x.teto.luvas,Math.round(x.luvas*1.15/500)*500);x.subiu=true;msgs.push(`${t.tag} adoçou as luvas`);}
      continue;
    }
    const alvo=valorLance(lider)*(1.04+_sorteMerc('st'+l.rodada+x.tid)*0.05);
    /* cansa: a cada rodada fica mais fácil desistir */
    const desiste=_sorteMerc('ds'+l.rodada+x.tid)<0.08+l.rodada*0.06;
    const salMax=x.teto.salario,lvMax=x.teto.luvas;
    if(desiste||salMax*12*x.anos+lvMax<alvo){x.saiu=true;msgs.push(`${t.tag} saiu`);continue;}
    /* sobe primeiro o salário, depois as luvas, até alcançar o alvo */
    let sal=x.salario,lv=x.luvas;
    sal=Math.min(salMax,Math.max(sal,Math.round((alvo-lv)/(12*x.anos)/100)*100));
    if(sal*12*x.anos+lv<alvo)lv=Math.min(lvMax,Math.round((alvo-sal*12*x.anos)/500)*500);
    x.salario=sal;x.luvas=lv;x.subiu=true;
    if(x.taxa){const multa=multaDe(p);x.taxa=Math.min(multa,Math.round(x.taxa*1.06/5000)*5000);}
    msgs.push(`${t.tag} cobriu`);
  }
  const vivos=l.lances.filter(x=>!x.saiu);
  l.log.unshift(`Rodada ${l.rodada}: ${msgs.join(' · ')||'ninguém mexeu'}.`);
  if(vivos.length<=1&&!l.lances.some(x=>x.dono))l.log.unshift('Sobrou um clube na mesa.');
  return{ok:true,msg:msgs.join(' · ')||'Ninguém mexeu.'};
}
/* O seu clube entra para cobrir com uma renovação. Uma vez por leilão. */
function clubeCobreLeilao(){
  const l=leilaoAtual(),p=meuJogador();
  if(!l||!p||!l.dono)return{ok:false,motivo:'Você não tem clube para cobrir.'};
  if(l.lances.some(x=>x.dono))return{ok:false,motivo:'O seu clube já fez a oferta dele.'};
  const t=G.times[l.dono],lider=melhorLance(l);
  const quer=over(p)>=_piorTitularDaFuncao(t,p)-2&&(typeof confTecnico!=='function'||confTecnico()>=45);
  const teto=_tetoLeilaoJ(t,p);
  /* o seu clube não tem os mesmos bolsos: cobre até 90% do melhor lance */
  if(!quer){l.log.unshift(`${t.tag} não quis entrar na disputa.`);return{ok:true,msg:`${t.nome} não vai cobrir.`};}
  const alvo=Math.min(valorLance(lider)*0.92,teto.salario*12*3+teto.luvas);
  const anos=3,sal=Math.min(teto.salario,Math.round(alvo/(12*anos)*0.85/100)*100);
  const luvas=Math.max(0,Math.round((alvo-sal*12*anos)/500)*500);
  l.lances.push({tid:t.id,dono:true,salario:sal,luvas,anos,taxa:0,teto,saiu:false,subiu:true});
  l.log.unshift(`${t.tag} quer renovar: ${moneyJ(sal)}/mês e ${moneyJ(luvas)} de luvas.`);
  return{ok:true,msg:`${t.nome} entrou para segurar você.`};
}
/* Aceitar um lance: vira proposta e passa pelo caminho de sempre. */
function aceitarLance(tid){
  const l=leilaoAtual(),p=meuJogador();
  if(!l||!p)return{ok:false,motivo:'Não há leilão aberto.'};
  const x=l.lances.find(y=>y.tid===tid&&!y.saiu);
  if(!x)return{ok:false,motivo:'Esse clube não está mais na mesa.'};
  const tipo=x.dono?'renovacao':p.timeId?'transferencia':'livre';
  /* lance de leilão não espera: o clube dono aceita a taxa que chegou na multa
     ou perto dela, que é o que a disputa produz */
  const pr=_novaProposta(tipo,G.times[tid],p,{salario:x.salario,anos:x.anos,luvas:x.luvas,taxa:x.taxa,preContrato:l.pre&&!x.dono,leilao:true});
  if(tipo==='transferencia'&&!pr.preContrato&&x.taxa<multaDe(p)&&x.taxa>=multaDe(p)*0.8)pr.taxa=multaDe(p);
  const r=aceitarPropostaJogador(pr.id);
  if(r.ok){fecharLeilao('aceito',tid);}
  else _retirar(pr);
  return r;
}
/* Fecha: o que sobrou vira proposta comum por duas semanas (ou some, se você
   escolheu). */
function fecharLeilao(motivo,escolhido){
  const l=G.voce&&G.voce.leilao;if(!l)return;
  G.voce.leilao=null;
  const p=meuJogador();
  if(motivo==='aceito'||!p)return;
  for(const x of l.lances){
    if(x.saiu||x.dono||x.tid===escolhido)continue;
    const t=G.times[x.tid];if(!t)continue;
    _novaProposta(p.timeId?'transferencia':'livre',t,p,{salario:x.salario,anos:x.anos,luvas:x.luvas,taxa:x.taxa,
      preContrato:l.pre,validoAte:_sAbs()+2,doLeilao:l.id});
  }
}
function encerrarLeilao(){
  const l=leilaoAtual();if(!l)return{ok:false,motivo:'Não há leilão aberto.'};
  fecharLeilao('encerrado');
  return{ok:true,msg:'Leilão encerrado. Os lances que sobraram ficam na mesa por duas semanas.'};
}
/* Assistente de contrato: deixa a disputa correr até o fim e fica com o
   melhor pacote (o seu clube, se ele cobrir perto). */
function assistenteLeilao(){
  const l=leilaoAtual();if(!l||G.voce.autoContrato!==true)return;
  while(l.rodada<l.max&&l.lances.filter(x=>!x.saiu).length>1)rodadaLeilao();
  if(l.dono&&!l.lances.some(x=>x.dono))clubeCobreLeilao();
  const melhor=melhorLance(l),meu=l.lances.find(x=>x.dono);
  const escolha=meu&&melhor&&valorLance(meu)>=valorLance(melhor)*0.9?meu:melhor;
  if(escolha)aceitarLance(escolha.tid);
}
