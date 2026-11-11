/* ============================================================
   PEDIDOS DE REFORÇO E OFERTAS AOS CLUBES
   ------------------------------------------------------------
   As duas pontas do mercado que faltavam, no jeito do FM26:

   · PEDIDO DE REFORÇO — você publica o que procura (função,
     idade, teto de taxa) e, ao longo dos dias da janela, clubes
     que topam vender e empresários de agentes livres respondem
     oferecendo jogadores. O olheiro lê as respostas e marca as
     que valem mais a pena; quanto melhor o olheiro, mais certeira
     a leitura.

   · QUEM PROCURA O QUÊ — a carência de cada clube (a mesma conta
     que move a IA no mercado) à vista, com os seus jogadores que
     servem a ele. Dá para oferecer um jogador direto a um clube,
     sem anunciar: o clube responde em poucos dias, com proposta
     ou com um não educado.

   Tudo respeita as travas do mercado: recém-contratado não entra
   em pedido nem oferta, e clube só oferece quem ele aceita vender.
   ============================================================ */
const REFORCO_MAX=3, REFORCO_SEMANAS=4, REFORCO_RESPOSTAS_MAX=8;
const REFORCO_RITMO=2.6;              /* respostas por semana, em média */
const OFERTA_ACEITA=0.75;            /* chance de quem tem interesse responder com proposta */

function pedidosReforco(){return G.pedidosReforco||(G.pedidosReforco=[]);}
function pedidoAtivo(x){return x&&!x.fechado&&_semanaNeg()<=x.ate;}

/* {funcao, idadeMin, idadeMax, teto, overMin} */
function publicarPedido(cfg){
  const eu=G.times[G.meuTime];if(!eu)return{ok:false,erro:'Sem clube.'};
  const ativos=pedidosReforco().filter(pedidoAtivo);
  if(ativos.length>=REFORCO_MAX)return{ok:false,erro:'No máximo '+REFORCO_MAX+' pedidos abertos. Feche um antes.'};
  const funcao=ROLES.includes(cfg.funcao)?cfg.funcao:'Duelista';
  const idadeMin=clamp(Math.round(+cfg.idadeMin||16),15,40), idadeMax=clamp(Math.round(+cfg.idadeMax||35),idadeMin,40);
  const teto=Math.max(0,Math.round((+cfg.teto||0)/5000)*5000);
  const overMin=clamp(Math.round(+cfg.overMin||0),0,99);
  const x={id:'pd'+G.ano+'_'+G.semana+'_'+(G.turno||0)+'_'+pedidosReforco().length,funcao,idadeMin,idadeMax,teto,overMin,
    criado:_semanaNeg(),ate:_semanaNeg()+REFORCO_SEMANAS,respostas:[],vistos:[]};
  pedidosReforco().unshift(x);
  return{ok:true,pedido:x,msg:'Pedido publicado. As respostas chegam ao longo dos dias'+(G.janela?'.':' — com a janela fechada, só quando ela abrir.')};
}
function fecharPedido(id){
  const x=pedidosReforco().find(y=>y.id===id);if(!x)return{ok:false};
  x.fechado=true;return{ok:true,msg:'Pedido fechado.'};
}

/* Quem cabe no pedido: função (ou flex), idade, teto, over mínimo, salário
   que a sua folha aguenta, e um dono que aceite vender (ou agente livre). */
function cabeNoPedido(x,p,eu){
  if(!p||p.base||p.timeId===eu.id||p.emprestimo||p.preContrato||p.lesao)return false;
  if(!(typeof cobre==='function'?cobre(p,x.funcao):p.role===x.funcao))return false;
  if(p.idade<x.idadeMin||p.idade>x.idadeMax)return false;
  if(over(p)<x.overMin)return false;
  if(p.timeId){
    if(recemChegado(p))return false;
    const ps=posturaDoClube(p);
    if(ps.id==='intransferivel')return false;
    if(disposicaoDeVender(p)<0.2&&ps.id!=='avenda')return false;
    if(x.teto&&precoPedido(p)>x.teto)return false;
  }
  if(salarioPedido(p,eu)>folgaSalarial(eu)*1.25+1)return false;
  return true;
}
/* A leitura do olheiro: o que ele entrega pelo que custa. O ruído é fixo
   por jogador e cai com o nível do olheiro. */
function notaDoOlheiro(p,eu,x){
  const nivel=(eu.staff&&eu.staff.olheiro)||(typeof NIVEL_NEUTRO!=='undefined'?NIVEL_NEUTRO:3);
  const funcao=Math.max(typeof overComo==='function'?overComo(p,x.funcao):over(p),over(p));
  const futuro=Math.max(0,(p.pot||0)-over(p))*(p.idade<=21?0.55:p.idade<=24?0.3:0.1);
  const preco=p.timeId?precoPedido(p):0;
  const custo=(preco+salarioPedido(p,eu)*12*2)/Math.max(200000,x.teto||(eu.caixa*0.3));
  const ruido=((_hashTxt(p.id+'|olheiro|'+eu.id)%100)/100-0.5)*Math.max(0,6-nivel)*2.2;
  return funcao+futuro-custo*6+ruido;
}
function motivoDoOlheiro(p,x){
  const f=Math.max(0,(p.pot||0)-over(p));
  if(p.idade<=21&&f>=8)return 'aposta: pode chegar a '+p.pot;
  if(!p.timeId)return 'livre, sem taxa';
  if(over(p)>=80)return 'pronto para ser titular';
  return 'bom custo-benefício';
}
function _recomendar(x,eu){
  const rs=x.respostas.filter(r=>G.jogadores[r.jogadorId]);
  rs.forEach(r=>{r.nota=notaDoOlheiro(G.jogadores[r.jogadorId],eu,x);r.recomendado=false;});
  rs.slice().sort((a,b)=>b.nota-a.nota).slice(0,2).forEach(r=>{r.recomendado=true;r.motivo=motivoDoOlheiro(G.jogadores[r.jogadorId],x);});
}
/* Respostas do dia (ou da semana, fora da janela em dias). */
function rondaPedidosReforco(){
  if(!G.janela||!G.meuTime)return 0;
  const eu=G.times[G.meuTime];if(!eu)return 0;
  let novas=0;
  for(const x of pedidosReforco()){
    if(!pedidoAtivo(x)||x.respostas.length>=REFORCO_RESPOSTAS_MAX)continue;
    const esp=REFORCO_RITMO*fracaoMercado();
    let k=Math.floor(esp)+(rnd()<esp%1?1:0);
    if(!k)continue;
    const ja=new Set([...x.vistos,...x.respostas.map(r=>r.jogadorId)]);
    const cand=Object.values(G.jogadores).filter(p=>!ja.has(p.id)&&cabeNoPedido(x,p,eu))
      /* quem o clube quer passar adiante aparece primeiro: reserva, à venda */
      .map(p=>({p,peso:over(p)+(p.timeId&&posturaDoClube(p).id==='avenda'?6:0)+(!p.timeId?2:0)+rnd()*8}))
      .sort((a,b)=>b.peso-a.peso).slice(0,12);
    for(;k>0&&cand.length;k--){
      const i=Math.min(cand.length-1,Math.floor(Math.pow(rnd(),1.5)*cand.length));
      const {p}=cand.splice(i,1)[0];
      x.vistos.push(p.id);
      x.respostas.push({jogadorId:p.id,clubeId:p.timeId||null,preco:p.timeId?precoPedido(p):0,
        salario:salarioPedido(p,eu),sem:_semanaNeg(),dia:G.turno||0});
      novas++;
    }
    _recomendar(x,eu);
  }
  if(novas)noticia('📨 '+novas+' resposta'+(novas>1?'s':'')+' aos seus pedidos de reforço. Veja em Mercado › Pedidos.',{c:'mercado',t:[eu.id]});
  return novas;
}

/* ---------- quem procura o quê ---------- */
function necessidadesDosClubes(eu){
  eu=eu||G.times[G.meuTime];
  return Object.values(G.times).filter(t=>t.id!==(eu&&eu.id)).map(t=>{
    const car=carenciaDe(t);
    const cap=capacidadeDeCompra(t,5);
    /* só quem joga na função que falta a ele: é o que a coluna promete */
    const servem=(eu?eu.elenco:[]).map(i=>G.jogadores[i]).filter(p=>p&&!p.emprestimo&&!p.preContrato&&!recemChegado(p)
      &&(typeof cobre==='function'?cobre(p,car.role):p.role===car.role)
      &&interesseDe(t,p)>0&&salarioPedido(p,t)<=folgaSalarial(t)*1.1);
    return{t,role:car.role,alvo:car.alvo,cap:cap.total,folga:folgaSalarial(t),servem,cheio:(t.elenco||[]).length>=ELENCO_MAX};
  });
}
function ofertasFeitas(){return G.ofertasFeitas||(G.ofertasFeitas=[]);}
function jaOferecido(pid,cid){return ofertasFeitas().some(o=>o.jogadorId===pid&&o.clubeId===cid&&_semanaNeg()-o.sem<NEG_ESPERA);}
function oferecerJogador(p,clubeId){
  const t=G.times[clubeId],eu=G.times[G.meuTime];
  if(!p||!t||!eu||p.timeId!==eu.id)return{ok:false,erro:'Oferta inválida.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  if(recemChegado(p))return{ok:false,erro:p.nome+' acabou de chegar: não sai nesta janela.'};
  if(p.emprestimo||p.preContrato)return{ok:false,erro:p.nome+' não pode ser negociado agora.'};
  if(jaOferecido(p.id,t.id))return{ok:false,erro:'Você já ofereceu '+p.nome+' ao '+t.nome+' há pouco.'};
  if(propostasDe(p.id).some(x=>x.clubeId===t.id))return{ok:false,erro:'O '+t.nome+' já tem proposta por ele na mesa.'};
  ofertasFeitas().push({jogadorId:p.id,clubeId:t.id,sem:_semanaNeg(),respondida:false});
  return{ok:true,msg:p.nome+' oferecido ao '+t.nome+'. A resposta chega em poucos dias.'};
}
/* O clube responde à oferta: proposta (compra ou troca) ou um não com motivo. */
function responderOfertas(){
  if(!G.janela)return 0;
  let n=0;
  for(const o of ofertasFeitas()){
    if(o.respondida)continue;
    /* um ou dois dias para pensar */
    if(rnd()>0.45*Math.max(1,TURNOS_SEMANA*fracaoMercado()))continue;
    o.respondida=true;n++;
    const p=G.jogadores[o.jogadorId],t=G.times[o.clubeId];
    if(!p||!t||p.timeId!==G.meuTime)continue;
    const ganho=interesseDe(t,p);
    const motivoNao=ganho<=0?'não precisa de alguém como ele agora'
      :salarioPedido(p,t)>folgaSalarial(t)*1.1?'o salário dele não cabe na folha'
      :rnd()>OFERTA_ACEITA?'prefere esperar outras opções':null;
    let pr=null;
    if(!motivoNao){
      if(typeof montarTrocaIA==='function'&&rnd()<0.25)pr=montarTrocaIA(p,t,ganho);
      if(!pr){
        const sal=salarioPedido(p,t);
        const ofr=ofertaIA(p,t,ganho,p.anuncio&&p.anuncio.pedido?p.anuncio.pedido:valorDeMercado(p));
        if(ofr)pr={id:novoIdProposta(),jogadorId:p.id,clubeId:t.id,tipo:'compra',taxa:ofr.taxa,parcela:ofr.parcela,
          salario:Math.round(sal),anos:ri(2,3),opcaoCompra:0,prazo:PRAZO_PROPOSTA,pedido:valorDeMercado(p),oferecido:true};
      }
    }
    if(pr){
      (G.propostas=G.propostas||[]).push(pr);
      noticia(textoProposta(pr).replace('fez uma proposta','respondeu à sua oferta com uma proposta'),{c:'mercado',p:[p.id],t:[t.id]});
    }else{
      noticia('✕ O '+t.nome+' agradeceu a oferta de '+p.nome+', mas '+(motivoNao||'não chegou a um valor que pudesse pagar')+'.',{c:'mercado',p:[p.id],t:[t.id]});
    }
  }
  /* guarda só as recentes, para o "já ofereci" valer algumas semanas */
  G.ofertasFeitas=ofertasFeitas().filter(o=>!o.respondida||_semanaNeg()-o.sem<NEG_ESPERA);
  return n;
}
