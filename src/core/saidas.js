/* ============================================================
   SAÍDAS: VENDER E EMPRESTAR
   ------------------------------------------------------------
   Até aqui a transferência só existia numa direção: você comprava,
   e o resto do mundo comprava entre si. Vender o seu próprio
   jogador não era possível — e sem isso não existe gestão de
   elenco, só acúmulo.

   A ideia é a mesma do resto do módulo de transferência: você
   anuncia, os clubes que precisam daquela função e cabem no
   próprio orçamento fazem PROPOSTAS, e você aceita ou não. Não
   existe "vender para o mercado" — existe alguém do outro lado
   que quis, e é isso que faz o preço significar alguma coisa.

   Empréstimo é a segunda saída, e existe por um motivo diferente
   de dinheiro: jovem que não joga não evolui. Sai com ou sem
   opção de compra, e essa é uma decisão sua na hora de anunciar.
   ============================================================ */

/* Quantas semanas uma proposta fica de pé antes de o clube desistir. */
const PRAZO_PROPOSTA=3;
/* Teto de propostas simultâneas por jogador, para a lista não virar ruído. */
const MAX_PROPOSTAS_POR_JOGADOR=3;
/* Fração do salário que o clube que toma emprestado assume. O dono paga o
   resto — é o que torna o empréstimo um custo, e não um truque para zerar
   folha. */
const EMPRESTIMO_SALARIO=0.75;

function anunciados(){
  return Object.values(G.jogadores).filter(p=>p.anuncio&&p.timeId);
}
/* Anunciar. `modo` é 'venda', 'emprestimo' ou 'ambos'; `opcao` diz se o
   empréstimo sai com opção de compra. */
function anunciarJogador(p,modo,opcao,pedido){
  if(!p||!p.timeId)return{ok:false,erro:'Jogador sem clube.'};
  if(p.emprestimo)return{ok:false,erro:'Jogador emprestado não pode ser anunciado.'};
  if(p.preContrato)return{ok:false,erro:p.nome+' já assinou pré-contrato e sai no fim da temporada.'};
  const t=G.times[p.timeId];
  if((t.elenco||[]).length<=ELENCO_MIN&&modo!=='emprestimo')
    return{ok:false,erro:'Com '+t.elenco.length+' jogadores o clube não pode abrir mão de ninguém. Contrate antes de anunciar.'};
  p.anuncio={modo,opcao:!!opcao,pedido:Math.max(0,Math.round(pedido||pedidoDeVenda(p)))};
  return{ok:true,msg:p.nome+' anunciado.'};
}
function retirarAnuncio(p){
  if(!p)return{ok:false};
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:'Anúncio retirado.'};
}

/* ---------- interesse da IA ----------
   Um clube só propõe pelo que ele realmente precisa: a função em falta, ou
   um titular melhor que o pior que ele tem. É a mesma carência que move
   tentarReforco(), para o mercado ter uma lógica só. */
function interesseDe(t,p){
  if(!t||t.id===p.timeId)return 0;
  if((t.elenco||[]).length>=ELENCO_MAX)return 0;
  const car=carenciaDe(t);
  const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
  if(ganho<1)return 0;
  if(recusasDuras(p,t,2).length)return 0;
  return ganho;
}
function propostasDe(jogadorId){
  return (G.propostas||[]).filter(x=>x.jogadorId===jogadorId);
}
function proposta(id){return (G.propostas||[]).find(x=>x.id===id)||null;}

/* Uma rodada de propostas. Chamada uma vez por semana pelo relógio. */
function gerarPropostas(){
  if(!G.janela)return 0;
  G.propostas=G.propostas||[];
  let novas=0;
  for(const p of anunciados()){
    if(propostasDe(p.id).length>=MAX_PROPOSTAS_POR_JOGADOR)continue;
    const dono=G.times[p.timeId];
    const candidatos=Object.values(G.times)
      .filter(t=>t.id!==G.meuTime&&t.id!==p.timeId)
      .map(t=>({t,n:interesseDe(t,p)}))
      .filter(x=>x.n>0)
      .sort((a,b)=>b.n-a.n);
    if(!candidatos.length)continue;
    /* Um por semana, e nem sempre: proposta que chega em rajada tira o peso
       de cada uma. O clube mais interessado tem mais chance de aparecer. */
    if(rnd()>0.45*fracaoMercado())continue;
    const alvo=candidatos[Math.min(candidatos.length-1,Math.floor(Math.pow(rnd(),1.8)*candidatos.length))].t;
    if(propostasDe(p.id).some(x=>x.clubeId===alvo.id))continue;
    const quer=p.anuncio.modo;
    const podeEmprestar=quer==='emprestimo'||quer==='ambos';
    const podeComprar=quer==='venda'||quer==='ambos';
    /* Clube pequeno prefere empréstimo; clube grande prefere comprar. */
    const tipo=(podeComprar&&podeEmprestar)
      ? (nivelDoClube(alvo)>=nivelDoClube(dono)-6?'compra':'emprestimo')
      : (podeComprar?'compra':'emprestimo');
    /* às vezes, em vez de dinheiro, o clube oferece um jogador dele mais a diferença */
    let pr=null;
    if(tipo==='compra'&&p.timeId===G.meuTime&&typeof montarTrocaIA==='function'&&rnd()<0.30)pr=montarTrocaIA(p,alvo);
    if(!pr)pr=tipo==='compra'?montarCompra(p,alvo):montarEmprestimo(p,alvo);
    if(!pr)continue;
    G.propostas.push(pr);novas++;
    if(p.timeId===G.meuTime)
      noticia('📨 '+alvo.nome+' fez uma proposta por '+p.nome+
              (pr.tipo==='troca'?' — troca por '+G.jogadores[pr.oferecidoId].nome+(pr.taxa?' mais '+money(pr.taxa):'')
               :tipo==='compra'?' — '+money(pr.taxa):' — empréstimo'+(pr.opcaoCompra?' com opção de compra':'')),{c:'mercado',p:[p.id],t:[alvo.id]});
  }
  /* prazos vencem — contados em semanas: num turno de dois dias da janela
     eles não andam, só na virada da semana */
  if(G._noTurno)return novas;
  G.propostas=G.propostas.filter(x=>{
    if(x.tipo==='multa')return true;   /* corre em mercadoVivo */
    x.prazo--;
    if(x.prazo>0)return true;
    const p=G.jogadores[x.jogadorId];
    if(p&&p.timeId===G.meuTime)noticia('⌛ '+G.times[x.clubeId].nome+' retirou a proposta por '+p.nome+'.',{c:'mercado',p:[p.id]});
    return false;
  });
  return novas;
}
let _seqProp=0;
function novoIdProposta(){return 'pr'+(G.ano||0)+'_'+(++_seqProp)+'_'+Math.floor(rnd()*1e6).toString(36);}

function montarCompra(p,alvo){
  const pedido=p.anuncio.pedido||pedidoDeVenda(p);
  const folga=folgaSalarial(alvo);
  const sal=salarioPedido(p,alvo);
  if(sal>folga)return null;
  const teto=Math.max(0,alvo.caixa*TETO_TAXA);
  /* Ele oferece o que acha justo, não o que você pediu: entre 72% e 108% do
     anúncio, limitado ao que o caixa dele aguenta. Uma proposta que sempre
     bate o pedido não é negociação, é botão. */
  const oferta=Math.round(Math.min(teto,pedido*(0.72+rnd()*0.36))/500)*500;
  if(oferta<=0)return null;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'compra',
         taxa:oferta,salario:Math.round(sal),anos:ri(2,3),opcaoCompra:0,
         prazo:PRAZO_PROPOSTA,pedido};
}
function montarEmprestimo(p,alvo){
  const sal=Math.round(salarioPedido(p,alvo)*EMPRESTIMO_SALARIO);
  if(sal>folgaSalarial(alvo))return null;
  /* Taxa de empréstimo é pequena: quem empresta quer minutos para o jogador,
     não lucro. */
  const taxa=Math.round(Math.max(0,p.valor*0.04*(0.6+rnd()*0.8))/500)*500;
  const opcao=p.anuncio.opcao
    ? Math.round(pedidoDeVenda(p)*(0.9+rnd()*0.35)/500)*500 : 0;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'emprestimo',
         taxa,salario:sal,anos:1,opcaoCompra:opcao,prazo:PRAZO_PROPOSTA,
         pedido:p.anuncio.pedido};
}

/* ---------- aceitar ---------- */
function aceitarProposta(id){
  const pr=proposta(id);
  if(!pr)return{ok:false,erro:'Proposta expirada.'};
  const p=G.jogadores[pr.jogadorId], destino=G.times[pr.clubeId];
  if(!p||!destino)return{ok:false,erro:'Proposta inválida.'};
  const origem=G.times[p.timeId];
  if(!origem)return{ok:false,erro:'O jogador não está em nenhum clube.'};
  if(pr.tipo==='multa')return executarMultaIA(pr);
  if(pr.tipo==='troca'){
    const r=executarTrocaIA(pr);
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id&&x.jogadorId!==p.id);
    if(r.ok)delete p.anuncio;
    return r;
  }
  if((origem.elenco||[]).length<=ELENCO_MIN&&pr.tipo==='compra')
    return{ok:false,erro:'Você ficaria com menos de '+ELENCO_MIN+' jogadores.'};
  /* A proposta ficou de pé algumas semanas. Nesse tempo o caixa do outro clube
     pode ter secado — aceitar assim mesmo jogava o comprador no vermelho por
     um negócio que ele não podia mais bancar. */
  if(destino.caixa<pr.taxa){
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
    return{ok:false,erro:destino.nome+' não tem mais caixa para bancar a proposta. Ela foi retirada.'};
  }
  if((destino.elenco||[]).length>=ELENCO_MAX){
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
    return{ok:false,erro:destino.nome+' já está com o elenco cheio. A proposta foi retirada.'};
  }
  const r=pr.tipo==='compra'
    ? executarProposta(p,destino,pr.taxa,pr.salario,pr.anos)
    : executarEmprestimo(p,destino,pr);
  if(!r)return{ok:false,erro:'A negociação não pôde ser concluída.'};
  if(pr.tipo==='compra'&&pr.revenda&&typeof fixarRevenda==='function')fixarRevenda(p,origem.id,pr.revenda);
  if(p.pedidoSaida&&pr.tipo==='compra')delete p.pedidoSaida;
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:pr.tipo==='compra'
    ?p.nome+' vendido ao '+destino.nome+' por '+money(pr.taxa)+'.'
    :p.nome+' emprestado ao '+destino.nome+'.'};
}
function recusarProposta(id){
  const pr=proposta(id);
  if(!pr)return{ok:false};
  G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
  return{ok:true,msg:'Proposta recusada.'};
}

/* ---------- empréstimo ----------
   O jogador muda de elenco mas não muda de dono. O clube que toma paga a
   maior parte do salário; o dono paga o resto, e é isso que impede o
   empréstimo de virar um jeito de zerar folha sem custo. */
function executarEmprestimo(p,destino,pr){
  const dono=G.times[p.timeId];
  if(!dono)return false;
  destino.caixa-=pr.taxa;dono.caixa+=pr.taxa;
  const contratoOriginal=p.contrato, salarioOriginal=p.salario;
  contratar(p,destino,1,pr.salario);
  p.emprestimo={donoId:dono.id,fim:(G.ano||0),opcaoCompra:pr.opcaoCompra||0,
                contrato:contratoOriginal,salario:salarioOriginal,
                over:over(p),
                parteDono:Math.max(0,salarioOriginal-pr.salario)};
  noticia('🔁 '+p.nome+' foi emprestado ao '+destino.nome+' por uma temporada'+
          (pr.opcaoCompra?' com opção de compra de '+money(pr.opcaoCompra):'')+'.',{c:'mercado',p:[p.id],t:[destino.id]});
  return true;
}
/* Fim de temporada: quem estava emprestado volta, ou é comprado. */
function resolverEmprestimos(){
  let voltas=0,compras=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!p.emprestimo)continue;
    const e=p.emprestimo, dono=G.times[e.donoId], atual=G.times[p.timeId];
    if(!dono){delete p.emprestimo;continue;}
    /* A opção só é exercida se ele JOGOU e não regrediu, e se o clube sustenta
       o salário. A condição antiga comparava o over dele com ele mesmo
       (over(p)>=over(p)-1), o que é verdade sempre: na prática nada era
       conferido além dos mapas. Agora o over do início do empréstimo fica
       guardado e serve de referência de verdade. */
    const jogou=(p.temp&&p.temp.maps)||0;
    const partiuDe=typeof e.over==='number'?e.over:over(p);
    const rende=jogou>=8&&over(p)>=partiuDe-1;
    const cabe=atual&&atual.caixa>e.opcaoCompra&&folgaSalarial(atual)>=e.salario;
    /* no seu clube a opção é decisão sua (exercerOpcao), não sorteio */
    if(e.opcaoCompra&&atual&&atual.id!==dono.id&&atual.id!==G.meuTime&&rende&&cabe&&rnd()<0.6){
      atual.caixa-=e.opcaoCompra;dono.caixa+=e.opcaoCompra;
      delete p.emprestimo;p.contrato=ri(2,3);p.salario=e.salario;
      noticia('💰 '+atual.nome+' exerceu a opção de compra de '+p.nome+' por '+money(e.opcaoCompra)+'.',{c:'mercado',p:[p.id],t:[atual.id]});
      compras++;continue;
    }
    if(atual&&atual.id!==dono.id){
      contratar(p,dono,Math.max(1,e.contrato),e.salario);
      noticia('↩ '+p.nome+' voltou ao '+dono.nome+' após o empréstimo.',{c:'mercado',p:[p.id],t:[dono.id]});
    }
    delete p.emprestimo;voltas++;
  }
  return{voltas,compras};
}
/* O dono continua pagando a parte dele — cobrada pelo relógio semanal. */
function custoEmprestimosDe(t){
  if(!t)return 0;
  let s=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(p.emprestimo&&p.emprestimo.donoId===t.id&&p.timeId!==t.id)s+=p.emprestimo.parteDono||0;
  }
  return s;
}
/* Quem o clube tem emprestado por aí, para a tela. */
function emprestadosDe(t){
  return Object.values(G.jogadores)
    .filter(p=>p.emprestimo&&p.emprestimo.donoId===t.id&&p.timeId!==t.id);
}

/* ============================================================
   NEGOCIAR A PROPOSTA — a mesa ao contrário
   ------------------------------------------------------------
   Antes a proposta que chegava por um jogador seu só tinha dois
   botões: aceitar ou recusar. Agora dá para pedir mais, do mesmo
   jeito que você negocia quando compra, só que do outro lado da
   mesa: você pede, o clube que quer o jogador responde subindo a
   oferta ou parando no limite dele, e tem paciência — pedido
   recusado gasta um ponto, pedido fora da realidade gasta dois.
   Acabou a paciência, ele retira a proposta.

   O limite do comprador é escondido e não sorteia: sai do valor do
   jogador, do quanto ele precisa da função, do caixa dele e de um
   embaralhador fixo da proposta — o mesmo pedido dá sempre a mesma
   resposta e o gerador do motor não anda.
   Pedir parte de uma venda futura (revenda) também vale: ele aceita
   pagar menos agora em troca, como você faz quando compra.
   ============================================================ */
const VENDA_PAC=3;
const VENDA_EXAGERO=1.45;      /* acima disto do limite dele, o pedido ofende */
function vendaNegociavel(pr){return !!pr&&(pr.tipo==='compra'||pr.tipo==='emprestimo');}
/* o máximo que o comprador paga por esta proposta */
function limiteDoComprador(pr){
  const p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
  if(!p||!c)return pr.taxa||0;
  const h=_hashTxt(pr.id+'|limite');
  if(pr.tipo==='emprestimo'){
    const lim=Math.max(pr.taxa,Math.round(p.valor*(0.06+(h%5)/100)/500)*500);
    return Math.min(Math.max(pr.taxa,c.caixa*0.5),lim);
  }
  /* quanto mais ele precisa do jogador, mais esticado o limite */
  const necessidade=Math.min(0.12,Math.max(0,interesseDe(c,p))*0.012);
  const base=Math.max(pr.taxa,pr.pedido||0,pedidoDeVenda(p));
  const lim=Math.round(base*(1.02+(h%20)/100+necessidade)/500)*500;
  const caixa=Math.max(0,c.caixa*TETO_TAXA);
  return Math.max(pr.taxa,Math.min(caixa,lim));
}
function _falaVenda(pr,de,txt,extra){(pr.neg.hist=pr.neg.hist||[]).push({de,txt,sem:G.semana,ano:G.ano,...(extra||{})});}
function abrirNegociacaoVenda(id){
  const pr=proposta(id);
  if(!pr)return{ok:false,erro:'A proposta não está mais na mesa.'};
  if(!vendaNegociavel(pr))return{ok:false,erro:pr.tipo==='multa'?'Multa paga não se negocia: só ele decide.':'Essa proposta não se negocia.'};
  if(!pr.neg){
    const p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
    pr.neg={pac:VENDA_PAC,pacMax:VENDA_PAC,inicial:pr.taxa,hist:[]};
    _falaVenda(pr,'clube',pr.tipo==='emprestimo'
      ?'Queremos '+p.nome+' emprestado por uma temporada: '+dinheiro(pr.taxa)+' de taxa'+(pr.opcaoCompra?' e opção de compra de '+dinheiro(pr.opcaoCompra):'')+'.'
      :'Oferecemos '+dinheiro(pr.taxa)+' por '+p.nome+'. Ele receberia '+dinheiro(pr.salario)+'/mês aqui no '+c.nome+'.');
  }
  return{ok:true,pr};
}
/* Você pede `valor` (e, na venda, `revenda`% de uma venda futura).
   Devolve {ok, resposta:'aceita'|'contra'|'limite'|'retirada', valor, venda} */
function pedirNaVenda(id,valor,revenda){
  const a=abrirNegociacaoVenda(id);if(!a.ok)return a;
  const pr=a.pr,p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  valor=Math.max(0,Math.round((valor||0)/500)*500);
  revenda=pr.tipo==='compra'&&REVENDA_OPCOES.includes(+revenda)?+revenda:0;
  if(valor<=pr.taxa&&!revenda)return{ok:false,erro:'Isso é o que eles já oferecem: é só aceitar.'};
  _falaVenda(pr,'voce','Pedimos '+dinheiro(valor)+(revenda?' e '+revenda+'% de uma venda futura':'')+'.',{valor});
  /* revenda custa para quem compra: o pedido pesa como se fosse maior */
  const custo=revenda?valor*(1+revenda/100*pesoRevenda(p)):valor;
  const lim=limiteDoComprador(pr);
  if(custo<=lim){
    pr.taxa=valor;pr.revenda=revenda||pr.revenda||0;
    _falaVenda(pr,'clube','Fechado: '+dinheiro(valor)+(revenda?' e '+revenda+'% da próxima venda':'')+'.');
    const r=aceitarProposta(pr.id);
    return{ok:r.ok,erro:r.erro,resposta:'aceita',valor,venda:r};
  }
  const exagero=custo>lim*VENDA_EXAGERO;
  pr.neg.pac-=exagero?2:1;
  if(pr.neg.pac<=0){
    _falaVenda(pr,'clube',exagero?'Esse valor está fora da realidade. Retiramos a proposta.':'Não chegamos a um acordo. Retiramos a proposta.');
    G.propostas=(G.propostas||[]).filter(x=>x.id!==pr.id);
    noticia('🚪 '+c.nome+' desistiu de '+p.nome+' depois da negociação.',{c:'mercado',p:[p.id],t:[c.id]});
    return{ok:true,resposta:'retirada',hist:pr.neg.hist};
  }
  /* a contraproposta sobe na sua direção, mas nunca passa do limite dele */
  const antes=pr.taxa;
  const nova=Math.min(lim,Math.max(antes+5000,Math.round((antes+(Math.min(custo,lim*1.2)-antes)*0.45)/5000)*5000));
  pr.taxa=Math.max(antes,Math.round(nova/500)*500);
  pr.prazo=Math.max(pr.prazo||1,2);
  const noLimite=pr.taxa>=lim;
  _falaVenda(pr,'clube',(exagero?'Muito acima do que ele vale para nós. ':'')+
    (noLimite?'Esse é o nosso limite: '+dinheiro(pr.taxa)+'.':'Subimos para '+dinheiro(pr.taxa)+'.'),{valor:pr.taxa});
  return{ok:true,resposta:noLimite?'limite':'contra',valor:pr.taxa};
}
