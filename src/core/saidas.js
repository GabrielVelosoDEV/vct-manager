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
    if(rnd()>0.45)continue;
    const alvo=candidatos[Math.min(candidatos.length-1,Math.floor(Math.pow(rnd(),1.8)*candidatos.length))].t;
    if(propostasDe(p.id).some(x=>x.clubeId===alvo.id))continue;
    const quer=p.anuncio.modo;
    const podeEmprestar=quer==='emprestimo'||quer==='ambos';
    const podeComprar=quer==='venda'||quer==='ambos';
    /* Clube pequeno prefere empréstimo; clube grande prefere comprar. */
    const tipo=(podeComprar&&podeEmprestar)
      ? (nivelDoClube(alvo)>=nivelDoClube(dono)-6?'compra':'emprestimo')
      : (podeComprar?'compra':'emprestimo');
    const pr=tipo==='compra'?montarCompra(p,alvo):montarEmprestimo(p,alvo);
    if(!pr)continue;
    G.propostas.push(pr);novas++;
    if(p.timeId===G.meuTime)
      noticia('📨 '+alvo.nome+' fez uma proposta por '+p.nome+
              (tipo==='compra'?' — '+money(pr.taxa):' — empréstimo'+(pr.opcaoCompra?' com opção de compra':'')),{c:'mercado',p:[p.id],t:[alvo.id]});
  }
  /* prazos vencem */
  G.propostas=G.propostas.filter(x=>{
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
    if(e.opcaoCompra&&atual&&atual.id!==dono.id&&rende&&cabe&&rnd()<0.6){
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
