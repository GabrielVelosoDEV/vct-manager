/* ============================================================
   TROCAS
   ------------------------------------------------------------
   Um ou dois jogadores seus por um ou dois de outro clube, com
   dinheiro para qualquer lado: você manda o mais caro e recebe o
   mais barato mais a diferença, ou completa com dinheiro para
   levar o melhor.

   Três pessoas precisam dizer sim:
     · O CLUBE    põe numa balança o que recebe (o quanto cada
                  jogador seu VALE PARA ELE, mais o dinheiro) contra
                  o que entrega (o preço que pede pelos dele). Jogador
                  que tapa o buraco do elenco dele vale mais; jogador
                  que vai sentar no banco vale menos.
     · CADA JOGADOR que muda de clube, pelo mesmo interesse da
                  contratação. Quem vai morno mantém o contrato; quem
                  vai frio só vai ganhando o que pede; quem não atende
                  trava a troca.

   O contrato viaja com o jogador: anos que faltam e salário, a
   não ser que ele peça mais para ir.
   ============================================================ */

const TROCA_MAX_LADO=2;
const TROCA_PACIENCIA=3;
const TROCA_INTERESSE_OK=30;      /* a partir daqui vai com o contrato que tem */

function _semanaTroca(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function _ocultoTroca(t,ids){return 0.96+(_hashTxt(t.id+'|t|'+ids.join(',')+'|'+G.ano)%7)/100;}

/* Quanto um jogador que CHEGA vale para o clube que recebe. */
function valorParaClube(t,p){
  const car=carenciaDe(t);
  const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
  let f=1;
  if(ganho>0)f*=1+Math.min(0.35,ganho*0.04);       /* tapa o buraco */
  const pos=posicaoNoElenco(p,t);
  if(pos>6)f*=0.70;else if(pos>5)f*=0.85;          /* vai para o banco */
  /* salário que a receita dele não sustenta pesa contra */
  const folga=folgaSalarial(t);
  if(p.salario>folga*1.2)f*=0.85;
  return Math.round((p.valor||valor(p))*f/500)*500;
}
/* Quanto o clube pede por um jogador dele numa troca: o mesmo preço da venda. */
function precoNaTroca(p){return precoPedido(p);}

/* Como cada jogador reage a ir para o outro lado. */
function reacaoNaTroca(p,dest){
  const it=interessePor(p,dest);
  const duras=recusasDuras(p,{...dest,elenco:(dest.elenco||[]).slice(0,ELENCO_MAX-1)},Math.max(1,p.contrato||1));
  if(it.nota<INTERESSE_MIN||duras.length)
    return{ok:false,nota:it.nota,faixa:it.faixa,sal:p.salario,
           txt:duras[0]||p.nome+' não aceita ir para o '+dest.nome+'.'};
  if(it.nota>=TROCA_INTERESSE_OK)
    return{ok:true,nota:it.nota,faixa:it.faixa,sal:p.salario,txt:'Vai com o contrato que tem.'};
  const pede=Math.max(p.salario,salarioPedido(p,dest));
  return{ok:true,nota:it.nota,faixa:it.faixa,sal:pede,
         txt:pede>p.salario?'Só vai ganhando '+dinheiro(pede)+'/mês.':'Vai com o contrato que tem.'};
}

/* ---------- avaliação ----------
   troca = {envia:[ids seus], recebe:[ids deles], dinheiro} — dinheiro
   positivo você paga, negativo você recebe. */
function avaliarTroca(eu,outro,tr){
  const envia=(tr.envia||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const recebe=(tr.recebe||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const din=Math.round(tr.dinheiro||0);
  const erros=[];
  if(!envia.length||!recebe.length)erros.push('Escolha ao menos um jogador de cada lado.');
  if(envia.length>TROCA_MAX_LADO||recebe.length>TROCA_MAX_LADO)erros.push('No máximo dois jogadores de cada lado.');
  for(const p of envia){
    if(p.timeId!==eu.id)erros.push(p.nome+' não é do seu elenco.');
    if(p.emprestimo)erros.push(p.nome+' está emprestado.');
    if(p.preContrato)erros.push(p.nome+' já assinou pré-contrato com outro clube.');
  }
  for(const p of recebe){
    if(p.timeId!==outro.id)erros.push(p.nome+' não é do '+outro.nome+'.');
    if(p.emprestimo)erros.push(p.nome+' está emprestado.');
    if(p.preContrato)erros.push(p.nome+' já assinou pré-contrato com outro clube.');
  }
  const meuDepois=eu.elenco.length-envia.length+recebe.length;
  const deleDepois=outro.elenco.length-recebe.length+envia.length;
  if(meuDepois<ELENCO_MIN)erros.push('Você ficaria com '+meuDepois+' jogadores (mínimo '+ELENCO_MIN+').');
  if(meuDepois>ELENCO_MAX)erros.push('Você ficaria com '+meuDepois+' jogadores (máximo '+ELENCO_MAX+').');
  if(deleDepois<ELENCO_MIN||deleDepois>ELENCO_MAX)erros.push('O '+outro.nome+' ficaria com '+deleDepois+' jogadores.');
  if(din>0&&eu.caixa<din)erros.push('Caixa insuficiente para pagar '+dinheiro(din)+'.');
  if(din>0&&typeof foraDaVerba==='function'){const fv=foraDaVerba(eu,din);if(fv)erros.push(fv);}
  if(din<0&&outro.caixa<-din)erros.push('O '+outro.nome+' não tem '+dinheiro(-din)+' em caixa.');

  /* reações dos jogadores */
  const reacoes={};
  envia.forEach(p=>reacoes[p.id]=reacaoNaTroca(p,outro));
  recebe.forEach(p=>reacoes[p.id]=reacaoNaTroca(p,eu));

  /* balança do clube */
  const valorRecebe=envia.reduce((s,p)=>s+valorParaClube(outro,p),0);
  const valorEntrega=recebe.reduce((s,p)=>s+precoNaTroca(p),0);
  const lado=valorRecebe+din;
  const exige=Math.round(valorEntrega*_ocultoTroca(outro,[...(tr.envia||[]),...(tr.recebe||[])].sort())/500)*500;
  /* folha do outro clube: o que chega menos o que sai precisa caber */
  const salChega=envia.reduce((s,p)=>s+reacoes[p.id].sal,0);
  const salSai=recebe.reduce((s,p)=>s+p.salario,0);
  const folhaOk=salChega-salSai<=Math.max(0,folgaSalarial(outro))*1.1;
  const falta=Math.max(0,exige-lado);
  return{envia,recebe,din,erros,reacoes,valorRecebe,valorEntrega,exige,lado,falta,folhaOk,
         clubeAceita:!erros.length&&folhaOk&&lado>=exige,
         jogadoresAceitam:Object.values(reacoes).every(r=>r.ok),
         razao:lado/Math.max(1,valorEntrega)};
}

/* ---------- estado ---------- */
function trocaAtiva(clubeId){
  return negociacoes().find(n=>n.tipo==='troca'&&n.origemId===clubeId&&n.fase==='troca')||null;
}
function abrirTroca(outro,recebeIds){
  const eu=G.times[G.meuTime];
  if(!outro||!eu||outro.id===eu.id)return{ok:false,erro:'Troca inválida.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada: troca só com a janela aberta.'};
  if(outro.trocaBloq&&_semanaTroca()<outro.trocaBloq)
    return{ok:false,erro:'O '+outro.nome+' não quer falar de troca agora. Tente em '+(outro.trocaBloq-_semanaTroca())+' semana(s).'};
  let n=trocaAtiva(outro.id);
  if(!n){
    n={tipo:'troca',id:'tr'+G.ano+'_'+(_hashTxt(outro.id+'|'+_semanaTroca()+'|'+negociacoes().length)%1e6).toString(36),
       origemId:outro.id,destinoId:eu.id,jogadorId:(recebeIds||[])[0]||null,fase:'troca',
       envia:[],recebe:(recebeIds||[]).slice(0,TROCA_MAX_LADO),dinheiro:0,
       pacClube:TROCA_PACIENCIA,pacClubeMax:TROCA_PACIENCIA,contra:null,hist:[],ano:G.ano,semana:G.semana};
    _fala(n,'clube','Topamos ouvir uma proposta de troca. Quem vocês oferecem?');
    negociacoes().push(n);
  }
  return{ok:true,neg:n};
}

function proporTroca(n,tr){
  const eu=G.times[n.destinoId], outro=G.times[n.origemId];
  if(!eu||!outro||n.fase!=='troca')return{ok:false,erro:'Essa troca não está aberta.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  n.envia=(tr.envia||[]).slice(0,TROCA_MAX_LADO);n.recebe=(tr.recebe||[]).slice(0,TROCA_MAX_LADO);
  n.dinheiro=Math.round((tr.dinheiro||0)/500)*500;
  const a=avaliarTroca(eu,outro,n);
  if(a.erros.length)return{ok:false,erro:a.erros.join(' ')};
  const nomes=l=>l.map(p=>p.nome).join(' e ');
  _fala(n,'voce',nomes(a.envia)+(a.din>0?' mais '+dinheiro(a.din):'')+' por '+nomes(a.recebe)+
    (a.din<0?' mais '+dinheiro(-a.din)+' para nós':'')+'.',{valor:a.din});
  const recusa=Object.values(a.reacoes).find(r=>!r.ok);
  if(recusa){
    _fala(n,'jogador',recusa.txt);
    return{ok:true,resposta:'jogador',txt:recusa.txt};
  }
  if(a.clubeAceita){
    executarTroca(n,a);
    return{ok:true,resposta:'aceita'};
  }
  n.pacClube-=1;
  if(n.pacClube<=0){
    n.fase='encerrada';outro.trocaBloq=_semanaTroca()+NEG_ESPERA;
    _fala(n,'clube','Não chegamos a lugar nenhum. Vamos parar por aqui.');
    _fala(n,'sistema','O '+outro.nome+' encerrou a conversa de troca por '+NEG_ESPERA+' semanas.');
    return{ok:true,resposta:'encerrada'};
  }
  if(!a.folhaOk){
    _fala(n,'clube','Não cabe na nossa folha: os salários que chegam são altos demais para o que sai.');
    return{ok:true,resposta:'folha'};
  }
  /* contraproposta: o dinheiro que falta para fechar a balança */
  const falta=Math.round((a.exige-a.lado)/5000+0.5)*5000;
  n.contra={envia:n.envia.slice(),recebe:n.recebe.slice(),dinheiro:n.dinheiro+falta};
  const c=n.contra.dinheiro;
  _fala(n,'clube',c>0?'Fechamos se vierem mais '+dinheiro(c)+' junto.'
                     :'Fechamos se a diferença para nós cair para '+dinheiro(-c)+'.',{valor:c});
  return{ok:true,resposta:'contra',contra:n.contra};
}
function aceitarContraTroca(n){
  if(!n.contra)return{ok:false,erro:'Ainda não há contraproposta.'};
  return proporTroca(n,n.contra);
}

function executarTroca(n,a){
  const eu=G.times[n.destinoId], outro=G.times[n.origemId];
  n.fase='fechada';
  n.final={envia:n.envia.slice(),recebe:n.recebe.slice(),dinheiro:a.din};
  eu.caixa-=a.din;outro.caixa+=a.din;
  if(typeof gastarVerba==='function'){if(a.din>0)gastarVerba(eu,a.din);else creditarVenda(eu,-a.din);}
  /* trava de reposição: enquanto a troca anda, nenhum dos dois clubes pode
     sair contratando no meio — o elenco só fecha a conta no fim */
  eu._repondo=true;outro._repondo=true;
  try{
    for(const p of a.envia){const anos=Math.max(1,p.contrato||1);contratar(p,outro,anos,a.reacoes[p.id].sal);}
    for(const p of a.recebe){const anos=Math.max(1,p.contrato||1);contratar(p,eu,anos,a.reacoes[p.id].sal);}
  }finally{delete eu._repondo;delete outro._repondo;}
  [...a.envia,...a.recebe].forEach(p=>registrarTransferencia(p,G.times[p.timeId===eu.id?outro.id:eu.id],G.times[p.timeId],0,'troca'));
  const nomes=l=>l.map(p=>p.nome).join(' e ');
  _fala(n,'clube','Negócio fechado. Bem-vindos.');
  noticia('🔄 Troca: '+nomes(a.recebe)+' chega ao '+eu.nome+' e '+nomes(a.envia)+' vai para o '+outro.nome+
    (a.din>0?', com '+dinheiro(a.din)+' de compensação':a.din<0?', e o '+eu.nome+' ainda recebe '+dinheiro(-a.din):'')+'.',
    {c:'mercado',p:[...n.envia,...n.recebe],t:[eu.id,outro.id],imp:2});
  if(!negociacoes().includes(n))negociacoes().push(n);
  autoEscalar(eu);autoEscalar(outro);
}

/* ---------- a IA oferece troca ----------
   Pelos jogadores que você anunciou para venda: o clube interessado pode
   oferecer um jogador dele e completar com dinheiro. Chamado por
   gerarPropostas() quando o clube decide fazer proposta de compra. */
function montarTrocaIA(p,alvo){
  const eu=G.times[p.timeId];
  if(!eu||p.preContrato||p.emprestimo||(alvo.elenco||[]).length<=ELENCO_MIN)return null;
  const preco=p.anuncio&&p.anuncio.pedido?p.anuncio.pedido:precoPedido(p);
  /* o que o clube aceita soltar: fora os dois melhores, e quem quer ir */
  const ordem=(alvo.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const cand=ordem.slice(2).filter(q=>!q.emprestimo&&!q.preContrato&&!q.base
    &&precoNaTroca(q)<preco&&reacaoNaTroca(q,eu).ok&&reacaoNaTroca(p,alvo).ok);
  if(!cand.length)return null;
  /* o que mais se aproxima do preço, para o dinheiro ser complemento */
  const q=cand.sort((a,b)=>precoNaTroca(b)-precoNaTroca(a))[0];
  const oferta=Math.round(valorParaClube(alvo,p)*(0.85+rnd()*0.2)/500)*500;
  const din=Math.max(0,Math.round((oferta-precoNaTroca(q))/5000)*5000);
  if(din>alvo.caixa*TETO_TAXA)return null;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'troca',oferecidoId:q.id,
         taxa:din,salario:reacaoNaTroca(p,alvo).sal,anos:Math.max(1,p.contrato||1),opcaoCompra:0,
         prazo:PRAZO_PROPOSTA,pedido:preco};
}
/* Aceitar a troca oferecida pela IA. */
function executarTrocaIA(pr){
  const p=G.jogadores[pr.jogadorId], q=G.jogadores[pr.oferecidoId];
  const eu=G.times[G.meuTime], outro=G.times[pr.clubeId];
  if(!p||!q||!eu||!outro||q.timeId!==outro.id||p.timeId!==eu.id)return{ok:false,erro:'A troca não está mais de pé.'};
  const n={tipo:'troca',id:'tri'+pr.id,origemId:outro.id,destinoId:eu.id,jogadorId:q.id,fase:'troca',
           envia:[p.id],recebe:[q.id],dinheiro:-pr.taxa,pacClube:1,pacClubeMax:1,hist:[],ano:G.ano,semana:G.semana};
  const a=avaliarTroca(eu,outro,n);
  if(a.erros.length)return{ok:false,erro:a.erros.join(' ')};
  if(!a.jogadoresAceitam)return{ok:false,erro:Object.values(a.reacoes).find(r=>!r.ok).txt};
  executarTroca(n,a);
  return{ok:true,msg:p.nome+' trocado por '+q.nome+(pr.taxa?' mais '+dinheiro(pr.taxa):'')+'.'};
}
