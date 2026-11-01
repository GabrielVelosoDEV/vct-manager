/* ============================================================
   MERCADO VIVO
   ------------------------------------------------------------
   Até aqui o mercado só se mexia quando você mexia: anunciou,
   chegou proposta; não anunciou, ninguém olhava. No mundo real o
   telefone toca sozinho. Este módulo junta o que faz o mercado
   respirar durante a janela:

   - propostas espontâneas pelos seus jogadores, sem anúncio;
   - multa paga pela IA: o clube não pode recusar, só o jogador;
   - pedido de transferência de quem está infeliz;
   - leilão quando dois ou mais clubes querem o mesmo jogador;
   - clube em crise (rebaixado ou devendo) vira liquidação;
   - percentual de revenda, que segue o jogador para a próxima venda;
   - empréstimo pedido por você, na mesa;
   - último dia da janela, com tudo mais acelerado;
   - a IA negocia entre si durante a janela, com o mesmo motor.

   Tudo usa as mesmas peças das etapas anteriores: interessePor,
   posturaDoClube, precoPedido e tentarReforco.
   ============================================================ */

/* Chance semanal, por jogador seu, de chegar proposta sem anúncio. Sobe com
   o over: estrela recebe ligação toda janela, reserva quase nunca. Calibrada
   para as duas janelas de calendário, que somam cerca de 22 semanas por ano. */
const ESPONTANEA_BASE=0.045;
const ESPONTANEA_POR_OVER=0.012;    /* por ponto de over acima de 75 */
const ESPONTANEA_MAX=0.25;
/* A IA só paga multa por um salto grande no time dela, e com folga no caixa. */
const MULTA_IA_GANHO=6;
const MULTA_IA_CAIXA=0.6;
const MULTA_IA_CHANCE=0.5;
const PRAZO_MULTA=2;
/* Aumento que você oferece para segurar quem teve a multa paga. */
const SEGURAR_AUMENTO=0.25;
/* Pedido de transferência: semanas infeliz antes de pedir, e a chance por semana. */
const PEDIDO_SEMANAS=4, PEDIDO_MORAL=0.35, PEDIDO_CHANCE=0.25;
/* Clube em crise vende com desconto, durante as próximas janelas. */
const CRISE_DESCONTO=0.80, CRISE_SEMANAS=34;
/* Revenda: o que cada ponto percentual vale para quem vende agora. Jovem
   vale mais, porque a próxima venda tende a ser maior. */
const REVENDA_OPCOES=[0,10,20];
function pesoRevenda(p){return p.idade<=22?0.9:0.5;}
/* IA durante a janela: chance por semana de cada clube tentar um reforço. */
const IA_JANELA_CHANCE=0.025, IA_PRAZO_FINAL=0.14;

/* ---------- último dia da janela ---------- */
function ultimoDiaDaJanela(){
  if(!G||!G.janela)return false;
  const n=proximaSemana(G.ano,G.semana||1);
  return !janelaAberta(n.ano,n.semana);
}

/* ---------- crise ---------- */
function emCrise(t){
  return !!(t&&t.crise&&_semanaNeg()<=t.crise.ate);
}
function declararCrise(t,motivo){
  if(!t)return;
  t.crise={motivo,ate:_semanaNeg()+CRISE_SEMANAS};
  if(t.id===G.meuTime){
    noticia('📉 '+t.nome+' entrou em crise ('+motivo+'). Os outros clubes vão chegar com propostas mais baixas, e os ambiciosos podem pedir para sair.',{c:'mercado',t:[t.id],imp:2});
    /* quem é bom demais para a situação pede para sair */
    t.elenco.map(i=>G.jogadores[i]).filter(p=>p&&!p.emprestimo&&over(p)>=78&&perfilDe(p)!=='leal')
      .forEach(p=>abrirPedidoSaida(p,'O clube está em crise ('+motivo+') e ele quer jogar mais alto.'));
  }else{
    noticia('🏷 '+t.nome+' está em crise ('+motivo+') e abre liquidação do elenco.',{c:'mercado',t:[t.id]});
  }
}
/* Virada de temporada: quem terminou no vermelho também entra. */
function conferirCrises(){
  for(const id in G.times){
    const t=G.times[id];
    if(t.caixa<0&&!emCrise(t))declararCrise(t,'dívidas');
  }
}

/* ---------- pedido de transferência ---------- */
function abrirPedidoSaida(p,motivo){
  if(!p||!p.timeId||p.pedidoSaida||p.emprestimo||p.preContrato)return false;
  p.pedidoSaida={ano:G.ano,semana:G.semana,motivo};
  if(p.timeId===G.meuTime)
    noticia('✋ '+p.nome+' pediu para ser negociado. '+motivo,{c:'mercado',p:[p.id],imp:2});
  return true;
}
function aceitarPedidoSaida(p){
  if(!p||!p.pedidoSaida)return{ok:false,erro:'Ele não pediu para sair.'};
  const r=anunciarJogador(p,'venda',false,pedidoDeVenda(p));
  if(!r.ok)return r;
  p.pedidoSaida.aceito=true;delete p.pedidoSaida.negado;
  p.moral=clamp(p.moral+0.06,0.05,1);
  return{ok:true,msg:p.nome+' foi colocado à venda, como ele pediu.'};
}
function negarPedidoSaida(p){
  if(!p||!p.pedidoSaida)return{ok:false,erro:'Ele não pediu para sair.'};
  p.pedidoSaida.negado=true;
  p.moral=clamp(p.moral-0.08,0.05,1);
  return{ok:true,msg:p.nome+' fica. Ele não gostou.'};
}
/* Semanal, o ano inteiro: quem está infeliz há semanas pede para sair; quem
   teve o pedido negado e voltou a sorrir desiste. */
function rondaPedidosSaida(){
  const t=G.times[G.meuTime];if(!t)return;
  for(const pid of t.elenco){
    const p=G.jogadores[pid];if(!p)continue;
    if(p.moral<PEDIDO_MORAL)p.semInfeliz=(p.semInfeliz||0)+1;else delete p.semInfeliz;
    if(p.pedidoSaida){
      if(p.pedidoSaida.negado){
        p.moral=clamp(p.moral-0.01,0.05,1);
        if(p.moral>0.6){delete p.pedidoSaida;noticia('🙂 '+p.nome+' desistiu de sair.',{c:'mercado',p:[p.id]});}
      }
      continue;
    }
    if((p.semInfeliz||0)>=PEDIDO_SEMANAS&&rnd()<PEDIDO_CHANCE)
      abrirPedidoSaida(p,'Está insatisfeito há semanas.');
  }
}

/* ---------- propostas espontâneas e multa paga ---------- */
function chanceEspontanea(p){
  let c=ESPONTANEA_BASE+Math.max(0,over(p)-75)*ESPONTANEA_POR_OVER;
  if(p.pedidoSaida&&!p.pedidoSaida.negado)c*=2.5;
  if(ultimoDiaDaJanela())c*=2;
  return Math.min(ESPONTANEA_MAX,c);
}
function propostasEspontaneas(){
  if(!G.janela)return 0;
  const eu=G.times[G.meuTime];if(!eu)return 0;
  G.propostas=G.propostas||[];
  let novas=0;
  for(const pid of eu.elenco){
    const p=G.jogadores[pid];
    if(!p||p.anuncio||p.emprestimo||p.preContrato||p.base)continue;
    if(propostasDe(p.id).length>=MAX_PROPOSTAS_POR_JOGADOR)continue;
    if(rnd()>chanceEspontanea(p))continue;
    const cand=Object.values(G.times).filter(t=>t.id!==eu.id)
      .map(t=>({t,n:interesseDe(t,p)})).filter(x=>x.n>0&&!propostasDe(p.id).some(y=>y.clubeId===x.t.id))
      .sort((a,b)=>b.n-a.n);
    if(!cand.length)continue;
    /* até três clubes tentam, do mais interessado para baixo: quem mais
       precisa nem sempre tem caixa ou folha para bancar */
    let pr=null,alvo=null;
    for(let k=0;k<3&&!pr&&cand.length;k++){
      const i=Math.min(cand.length-1,Math.floor(Math.pow(rnd(),1.8)*cand.length));
      alvo=cand[i].t;pr=montarEspontanea(p,alvo,cand[i].n);cand.splice(i,1);
    }
    if(!pr)continue;
    G.propostas.push(pr);novas++;
    noticia(pr.tipo==='multa'
      ?'💥 '+alvo.nome+' pagou a multa rescisória de '+p.nome+' ('+money(pr.taxa)+'). Você não pode recusar: só ele decide.'
      :'📞 '+alvo.nome+' ligou por '+p.nome+', que nem estava à venda: '+money(pr.taxa)+(pr.revenda?' e '+pr.revenda+'% de revenda':'')+'.',
      {c:'mercado',p:[p.id],t:[alvo.id],imp:pr.tipo==='multa'?2:1});
  }
  return novas;
}
function montarEspontanea(p,alvo,ganho){
  const eu=G.times[p.timeId];
  if(alvo.elenco.length>=ELENCO_MAX)return null;
  const sal=salarioPedido(p,alvo);
  if(sal>folgaSalarial(alvo)*1.1)return null;
  const multa=multaDe(p), ps=posturaDoClube(p);
  const teto=Math.max(0,alvo.caixa*TETO_TAXA);
  /* multa: o salto precisa ser grande, o caixa precisa aguentar, e o jogador
     precisa preferir ir */
  /* metade das vezes o clube tenta antes negociar: multa é o último recurso */
  if(ganho>=MULTA_IA_GANHO&&rnd()<MULTA_IA_CHANCE&&alvo.caixa*MULTA_IA_CAIXA>=multa
     &&interessePor(p,alvo).nota>=interesseEmFicar(p,eu).nota+5){
    return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'multa',taxa:multa,
           salario:Math.round(sal),anos:ri(2,4),opcaoCompra:0,prazo:PRAZO_MULTA,espontanea:true};
  }
  if(ps.id==='intransferivel'&&rnd()<0.6)return null;
  const preco=precoPedido(p);
  let oferta=Math.round(Math.min(teto,preco*(0.80+rnd()*0.25))/5000)*5000;
  if(oferta<=0||oferta<preco*0.6)return null;
  /* jovem: às vezes a oferta vem com revenda, e um pouco menor por isso */
  let revenda=0;
  if(p.idade<=21&&rnd()<0.35){revenda=rnd()<0.5?10:15;oferta=Math.round(oferta*0.95/5000)*5000;}
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'compra',taxa:oferta,
         salario:Math.round(sal),anos:ri(2,3),opcaoCompra:0,prazo:PRAZO_PROPOSTA,
         pedido:preco,espontanea:true,revenda};
}
/* A multa paga pela IA: liberar é aceitar. Também é o que acontece se o prazo
   vence sem você reagir. */
function executarMultaIA(pr){
  const p=G.jogadores[pr.jogadorId], dest=G.times[pr.clubeId];
  if(!p||!dest||p.timeId===dest.id)return{ok:false,erro:'A proposta não está mais de pé.'};
  const origem=G.times[p.timeId];
  if(dest.caixa<pr.taxa)return{ok:false,erro:dest.nome+' não tem mais o dinheiro da multa.'};
  executarProposta(p,dest,pr.taxa,pr.salario,pr.anos);
  if(G.transferencias&&G.transferencias.length)G.transferencias[G.transferencias.length-1].tipo='multa';
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:p.nome+' saiu pela multa: '+money(pr.taxa)+' entraram no caixa do '+(origem?origem.nome:'clube')+'.'};
}
/* Tentar segurar: você oferece aumento; ele compara ficar (com o aumento)
   contra ir. Uma tentativa só: se não der, ele vai. */
function segurarJogador(prId){
  const pr=proposta(prId);
  if(!pr||pr.tipo!=='multa')return{ok:false,erro:'Proposta inexistente.'};
  const p=G.jogadores[pr.jogadorId], eu=G.times[p.timeId], dest=G.times[pr.clubeId];
  const ficar=interesseEmFicar(p,eu).nota+pontosDoFator(1/(1+SEGURAR_AUMENTO));
  const ir=interessePor(p,dest).nota;
  const novoSal=Math.round(p.salario*(1+SEGURAR_AUMENTO)/100)*100;
  const folgaOk=folgaSalarial(eu)>=novoSal-p.salario;
  if(folgaOk&&ficar>=ir){
    p.salario=novoSal;p.moral=clamp(p.moral+0.05,0.05,1);
    G.propostas=G.propostas.filter(x=>x.id!==pr.id);
    noticia('🛡 '+p.nome+' recusou o '+dest.nome+' e fica, com aumento para '+money(novoSal)+'/mês.',{c:'mercado',p:[p.id],t:[dest.id]});
    return{ok:true,ficou:true,msg:p.nome+' fica, com '+money(novoSal)+'/mês.'};
  }
  const r=executarMultaIA(pr);
  return{...r,ficou:false,msg:(folgaOk?p.nome+' agradeceu, mas quer ir. ':'A folha não comporta o aumento. ')+(r.msg||r.erro||'')};
}

/* ---------- leilão ----------
   Dois ou mais clubes querem o mesmo jogador: você chama todos para cobrir.
   Cada um tem um teto (o caixa e o quanto ele precisa do jogador); o leilão
   sobe em degraus até sobrar um. Quem perde retira a proposta. */
function _tetoLeilao(t,p,x){
  const ganho=interesseDe(t,p);
  /* cada um estica pelo menos um pouco além da própria proposta; quem precisa
     mais do jogador estica mais */
  const quer=precoPedido(p)*(1+Math.min(10,ganho)*0.03)*(0.95+(_hashTxt(t.id+p.id)%100)/1000);
  return Math.round(Math.max(x.taxa*1.08,Math.min(t.caixa*TETO_TAXA*1.4,quer))/5000)*5000;
}
function podeLeiloar(jogadorId){
  return propostasDe(jogadorId).filter(x=>x.tipo==='compra').length>=2;
}
function abrirLeilao(jogadorId){
  const p=G.jogadores[jogadorId];
  const props=propostasDe(jogadorId).filter(x=>x.tipo==='compra');
  if(!p||props.length<2)return{ok:false,erro:'Leilão precisa de pelo menos duas propostas de compra.'};
  const lances=props.map(x=>({x,t:G.times[x.clubeId],teto:_tetoLeilao(G.times[x.clubeId],p,x),valor:x.taxa,fora:false}));
  const rodadas=[];
  let atual=Math.max(...lances.map(l=>l.valor));
  let lider=lances.find(l=>l.valor===atual);
  rodadas.push({clube:lider.t.id,valor:atual,txt:lider.t.nome+' abre com '+money(atual)+'.'});
  for(let guarda=0;guarda<40;guarda++){
    const ativos=lances.filter(l=>!l.fora&&l!==lider);
    if(!ativos.length)break;
    const passo=Math.max(5000,Math.round(atual*0.025/5000)*5000);
    let cobriu=false;
    for(const l of ativos){
      if(l.teto>=atual+passo){
        atual+=passo;l.valor=atual;lider=l;cobriu=true;
        rodadas.push({clube:l.t.id,valor:atual,txt:l.t.nome+' cobre: '+money(atual)+'.'});
        break;
      }
      l.fora=true;rodadas.push({clube:l.t.id,valor:l.valor,txt:l.t.nome+' desiste.',fora:true});
    }
    if(!cobriu&&!lances.some(l=>!l.fora&&l!==lider))break;
  }
  /* quem ganhou fica com a proposta; os outros saem da mesa */
  lider.x.taxa=atual;lider.x.prazo=PRAZO_PROPOSTA;lider.x.leilao=true;
  G.propostas=G.propostas.filter(x=>x.jogadorId!==jogadorId||x===lider.x||x.tipo!=='compra');
  rodadas.push({clube:lider.t.id,valor:atual,txt:lider.t.nome+' vence o leilão com '+money(atual)+'.',vence:true});
  noticia('🔨 Leilão por '+p.nome+': '+lider.t.nome+' venceu com '+money(atual)+'.',{c:'mercado',p:[p.id],t:[lider.t.id]});
  return{ok:true,vencedor:lider.t.id,valor:atual,rodadas,propostaId:lider.x.id};
}

/* ---------- revenda ----------
   Quem vende pode guardar um pedaço da próxima venda. A conta é paga
   quando o jogador sai de novo por dinheiro, por quem o vende. */
function pagarRevenda(p,origem,dest,taxa){
  const r=p.revenda;
  if(!r||!(taxa>0)||!origem)return 0;
  const dono=G.times[r.clubeId];
  delete p.revenda;
  if(!dono||dono.id===origem.id)return 0;
  const parte=Math.round(taxa*r.pct/100/500)*500;
  if(parte<=0)return 0;
  origem.caixa-=parte;dono.caixa+=parte;
  if(dono.id===G.meuTime||origem.id===G.meuTime)
    noticia('🧾 Revenda: '+dono.nome+' recebeu '+money(parte)+' ('+r.pct+'%) pela venda de '+p.nome+' ao '+dest.nome+'.',{c:'mercado',p:[p.id],t:[dono.id]});
  return parte;
}
function fixarRevenda(p,clubeId,pct){
  if(pct>0&&clubeId)p.revenda={clubeId,pct};
}

/* ---------- empréstimo pedido por você ---------- */
/* oferta = {parte (0.5..1, fração do salário que você paga), opcao (valor ou 0)} */
function avaliarEmprestimoPedido(n,oferta){
  const p=G.jogadores[n.jogadorId], dono=G.times[n.origemId], eu=G.times[n.destinoId];
  const parte=clamp(+oferta.parte||0.75,0.5,1), opcao=Math.max(0,_arred(+oferta.opcao||0,5000));
  const ordem=dono.elenco.map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const rank=ordem.findIndex(x=>x.id===p.id);
  const titular=dono.titulares.includes(p.id);
  const erros=[];
  if(p.emprestimo)erros.push('Ele já está emprestado.');
  if(titular&&rank<5)erros.push('Ele é titular do '+dono.nome+': não sai emprestado.');
  if(dono.elenco.length<=ELENCO_MIN)erros.push('O '+dono.nome+' está com o elenco no mínimo.');
  if(eu.elenco.length>=ELENCO_MAX)erros.push('Seu elenco está cheio.');
  /* quanto do salário eles querem que você pague: jovem que precisa jogar sai mais barato */
  const minParte=clamp((p.idade<=20?0.5:0.65)+(opcao?0.1:0),0.5,1);
  const precoOpcao=_arred(precoPedido(p)*_ocultoClube(p,eu),5000);
  const sal=_arred(p.salario*parte,100);
  const taxa=_arred(Math.max(0,(p.valor||0)*0.03),500);
  /* o jogador: quer minutos. Quem está no banco topa mais fácil */
  const it=interessePor(p,eu);
  const vontade=it.nota+(rank>=5?15:0);
  const clubeOk=!erros.length&&parte>=minParte&&(!opcao||opcao>=precoOpcao);
  const jogadorOk=vontade>=TROCA_INTERESSE_OK&&!recusasDuras(p,eu,1).length;
  if(folgaSalarial(eu)<sal)erros.push('A folha não comporta '+money(sal)+'/mês.');
  if(eu.caixa<taxa)erros.push('Caixa insuficiente para a taxa de '+money(taxa)+'.');
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(eu,taxa);if(fv)erros.push(fv);
  return{parte,opcao,minParte,precoOpcao,sal,taxa,clubeOk,jogadorOk,vontade,erros,rank};
}
function proporEmprestimo(n,oferta){
  const p=G.jogadores[n.jogadorId], dono=G.times[n.origemId], eu=G.times[n.destinoId];
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  if(!p||!dono||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  const a=avaliarEmprestimoPedido(n,oferta);
  _fala(n,'voce','Queremos '+p.nome+' emprestado: pagamos '+Math.round(a.parte*100)+'% do salário'+
    (a.opcao?', com opção de compra de '+dinheiro(a.opcao):'')+'.');
  if(a.erros.length){_fala(n,'clube',a.erros[0]);return{ok:true,resposta:'recusa',erro:a.erros[0]};}
  if(!a.clubeOk){
    n.pacClube-=1;
    const txt=a.parte<a.minParte?'Só emprestamos se vocês pagarem pelo menos '+Math.round(a.minParte*100)+'% do salário.'
      :'Opção de compra só a partir de '+dinheiro(a.precoOpcao)+'.';
    _fala(n,'clube',txt);
    if(n.pacClube<=0){_encerrar(n,'clube');return{ok:true,resposta:'encerrada'};}
    return{ok:true,resposta:'contra',erro:txt,minParte:a.minParte,precoOpcao:a.precoOpcao};
  }
  if(!a.jogadorOk){
    _fala(n,'jogador','Agradeço, mas não quero ir emprestado para o '+eu.nome+'.');
    return{ok:true,resposta:'recusa',erro:p.nome+' não quer ir emprestado.'};
  }
  n.interesse=interessePor(p,eu);
  executarEmprestimo(p,eu,{taxa:a.taxa,salario:a.sal,opcaoCompra:a.opcao});
  registrarTransferencia(p,dono,eu,a.taxa,'emprestimo');
  n.fase='fechada';n.emprestimo=true;n.taxa=a.taxa;
  n.final={taxa:a.taxa,sal:a.sal,anos:1,luvas:0,comissao:0};
  _fala(n,'clube','Fechado. Cuidem bem dele.');
  if(!negociacoes().includes(n))negociacoes().push(n);
  return{ok:true,resposta:'aceita'};
}
/* Opção de compra de quem está emprestado para você: decisão sua, não sorteio. */
function exercerOpcao(p){
  const e=p&&p.emprestimo, eu=G.times[G.meuTime];
  if(!e||p.timeId!==eu.id||!e.opcaoCompra)return{ok:false,erro:'Não há opção de compra.'};
  if(!G.janela)return{ok:false,erro:'Só com a janela aberta.'};
  if(eu.caixa<e.opcaoCompra)return{ok:false,erro:'Caixa insuficiente: a opção é '+money(e.opcaoCompra)+'.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(eu,e.opcaoCompra);if(fv)return{ok:false,erro:fv};
  const dono=G.times[e.donoId];
  eu.caixa-=e.opcaoCompra;if(dono)dono.caixa+=e.opcaoCompra;
  delete p.emprestimo;p.contrato=Math.max(2,p.contrato||1);
  registrarTransferencia(p,dono,eu,e.opcaoCompra,'compra');
  noticia('💰 '+eu.nome+' exerceu a opção de compra de '+p.nome+' por '+money(e.opcaoCompra)+'.',{c:'mercado',p:[p.id],t:[eu.id]});
  return{ok:true,msg:p.nome+' agora é seu.'};
}

/* ---------- IA negociando durante a janela ---------- */
function mercadoNaJanela(){
  if(!G.janela)return 0;
  /* a virada de temporada tem o mercado grande dela; aqui é o do meio */
  if((G.semana||1)>=49)return 0;
  const chance=ultimoDiaDaJanela()?IA_PRAZO_FINAL:IA_JANELA_CHANCE;
  const ocupados=new Set(negociacoes().filter(n=>n.fase==='clube'||n.fase==='jogador'||n.fase==='troca').map(n=>n.jogadorId));
  const cand=Object.values(G.jogadores).filter(p=>p.timeId!==G.meuTime&&!p.base&&!p.lesao&&!p.emprestimo
    &&!p.preContrato&&!ocupados.has(p.id)&&(!p.timeId||p.contrato<=2||emCrise(G.times[p.timeId])||p.pedidoSaida));
  let feitos=0;
  for(const t of Object.values(G.times)){
    if(t.id===G.meuTime||rnd()>chance)continue;
    const r=tentarReforco(t,cand);
    if(r){feitos++;autoEscalar(t);}
  }
  return feitos;
}

/* ---------- a semana ---------- */
function mercadoVivo(){
  rondaPedidosSaida();
  /* multa paga corre o prazo com a janela aberta ou fechada: o negócio foi
     feito dentro dela, e sem reação sua ele sai */
  for(const x of (G.propostas||[]).filter(y=>y.tipo==='multa')){
    if(--x.prazo<=0){const r=executarMultaIA(x);if(!r.ok)G.propostas=G.propostas.filter(y=>y!==x);}
  }
  if(!G.janela){
    /* janela fechou: proposta de compra, troca e empréstimo caem junto */
    const antes=(G.propostas||[]).length;
    G.propostas=(G.propostas||[]).filter(x=>x.tipo==='multa');
    if(antes>G.propostas.length&&G._janelaAberta)noticia('🔒 A janela fechou. As propostas que estavam na mesa caíram.',{c:'mercado'});
    G._janelaAberta=false;
    return;
  }
  G._janelaAberta=true;
  if(ultimoDiaDaJanela()&&G._prazoAvisado!==_semanaNeg()){
    G._prazoAvisado=_semanaNeg();
    noticia('⏰ Último dia da janela! Os clubes correm atrás de reforço e as propostas chegam mais rápido.',{c:'mercado',imp:2});
  }
  propostasEspontaneas();
  mercadoNaJanela();
}
