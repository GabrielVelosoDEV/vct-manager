/* ============================================================
   ORÇAMENTO DA DIRETORIA
   ------------------------------------------------------------
   No modo Treinador a diretoria libera uma verba de transferências
   por temporada. Taxa, multa, luvas, comissão, dinheiro em troca,
   taxa de empréstimo e opção de compra saem dela; metade do que
   você vende volta para ela. Uma vez por janela dá para pedir mais,
   e a resposta depende da confiança da diretoria.

   No modo Diretoria quem manda é você: a verba aparece como
   referência, mas o único limite é o caixa.
   ============================================================ */
/* Parte do caixa livre (acima da reserva) que vira verba. */
const VERBA_FRACAO=0.55;
/* Reserva que a diretoria não deixa gastar: uma fração da receita anual. */
const VERBA_RESERVA=0.20;
/* Quanto de cada venda volta para a verba. */
const VERBA_RETORNO_VENDA=0.5;
/* Pedido de reforço de verba: confiança mínima e quanto ela libera. */
const VERBA_PEDIDO_CONF=55, VERBA_PEDIDO_EXTRA=0.30, VERBA_PEDIDO_CUSTO=3;

function _verbaInicial(t){
  const rec=receitaAnual(t);
  return Math.max(0,Math.round((t.caixa-rec*VERBA_RESERVA)*VERBA_FRACAO/5000)*5000);
}
/* A verba da temporada. Nasce na primeira consulta do ano. */
function orcamentoDe(t){
  t=t||G.times[G.meuTime];
  if(!t)return null;
  if(!t.orcamento||t.orcamento.ano!==G.ano){
    const v=_verbaInicial(t);
    t.orcamento={ano:G.ano,inicial:v,verba:v,gasto:0,vendas:0,pedidos:{}};
  }
  return t.orcamento;
}
function verbaVale(){return typeof souTreinador==='function'&&souTreinador();}
function verbaDisponivel(t){
  const o=orcamentoDe(t);
  return o?Math.max(0,o.verba-o.gasto+o.vendas*VERBA_RETORNO_VENDA):0;
}
/* Devolve a mensagem de recusa, ou null se cabe. Só trava no modo Treinador
   e só para o seu clube. */
function foraDaVerba(t,valor){
  if(!t||t.id!==G.meuTime||!verbaVale()||!(valor>0))return null;
  const d=verbaDisponivel(t);
  return valor>d?'A diretoria liberou '+dinheiro(d)+' para transferências e isso custa '+dinheiro(valor)+'. Peça mais verba ou venda alguém.':null;
}
function gastarVerba(t,valor){
  if(!t||t.id!==G.meuTime||!(valor>0))return;
  orcamentoDe(t).gasto+=valor;
}
function creditarVenda(t,valor){
  if(!t||t.id!==G.meuTime||!(valor>0))return;
  orcamentoDe(t).vendas+=valor;
}
/* Uma vez por janela. A diretoria olha a confiança: alta libera, baixa nega. */
function pedirMaisVerba(){
  const t=G.times[G.meuTime], o=orcamentoDe(t);
  if(!verbaVale())return{ok:false,erro:'No modo Diretoria quem decide é você: o limite é o caixa.'};
  if(!G.janela)return{ok:false,erro:'Só com a janela aberta.'};
  const chave=G.ano+'-'+(G.semana<=10?'ini':G.semana<=40?'meio':'fim');
  if(o.pedidos[chave])return{ok:false,erro:'Você já pediu nesta janela. A resposta foi '+(o.pedidos[chave]>0?'sim':'não')+'.'};
  const conf=(G.manager&&G.manager.confianca)||50;
  const extra=Math.round(Math.min(Math.max(0,t.caixa-verbaDisponivel(t)),Math.max(o.inicial,100000)*VERBA_PEDIDO_EXTRA)/5000)*5000;
  if(conf<VERBA_PEDIDO_CONF||extra<=0){
    o.pedidos[chave]=-1;
    return{ok:true,aceito:false,msg:conf<VERBA_PEDIDO_CONF
      ?'A diretoria negou: com a confiança em '+conf+', primeiro querem ver resultado.'
      :'A diretoria negou: não há caixa sobrando para isso.'};
  }
  o.pedidos[chave]=extra;o.verba+=extra;
  if(G.manager)G.manager.confianca=clamp(conf-VERBA_PEDIDO_CUSTO,0,100);
  noticia('🏢 A diretoria liberou mais '+dinheiro(extra)+' para transferências.',{c:'clube',t:[t.id]});
  return{ok:true,aceito:true,extra,msg:'A diretoria liberou mais '+dinheiro(extra)+'. Ela vai cobrar resultado.'};
}

/* ---------- balanço da temporada para a central ---------- */
function movimentosDoClube(t,ano){
  const lst=(G.transferencias||[]).filter(x=>x.ano===ano&&(x.de===t.id||x.para===t.id));
  const entradas=lst.filter(x=>x.para===t.id), saidas=lst.filter(x=>x.de===t.id);
  const soma=l=>l.reduce((s,x)=>s+(x.taxa||0),0);
  return{entradas,saidas,gasto:soma(entradas),receita:soma(saidas)};
}
function maioresTransferencias(ano,n){
  return (G.transferencias||[]).filter(x=>x.ano===ano&&x.taxa>0).sort((a,b)=>b.taxa-a.taxa).slice(0,n||10);
}
function clubesEmCrise(){
  return Object.values(G.times).filter(t=>typeof emCrise==='function'&&emCrise(t));
}
