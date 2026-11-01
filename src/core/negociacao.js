/* ============================================================
   MESA DE NEGOCIAÇÃO
   ------------------------------------------------------------
   Até aqui comprar era um formulário: três números, e a resposta
   era sim ou não. Aqui vira negociação de verdade, em duas
   conversas, na ordem em que acontece no cenário real:

     1. COM O CLUBE DONO  a taxa. O clube tem uma postura
        (intransferível, negociável, à venda), abre pedindo um
        pouco acima do preço e responde com contraproposta.
        Pagar a multa rescisória pula esta conversa.
     2. COM O JOGADOR     salário, anos, luvas e promessa de
        titularidade. Ele responde com o que quer.

   Os dois lados têm PACIÊNCIA. Proposta recusada gasta um
   ponto, proposta ofensiva gasta dois. Acabou a paciência, a
   conversa fecha por algumas semanas.

   O que ele aceita é o mesmo pedido que a IA paga
   (detalharPedido em transferencia.js): o jogo não tem uma régua
   para você e outra para os clubes da IA. O que muda é que você
   negocia em rodadas e vê a resposta.

   Nada aqui sorteia. O mínimo escondido de cada lado sai do
   próprio jogador, do clube e do ano, para o mesmo clique dar
   sempre a mesma resposta e não mexer no gerador do motor.
   ============================================================ */

const NEG_ESPERA=6;               /* semanas de conversa fechada depois de esgotar a paciência */
const NEG_ABERTURA_CLUBE=1.06;    /* o clube abre pedindo acima do preço */
const NEG_OFENSA=0.60;            /* abaixo disto do pedido, a proposta ofende */
const LUVAS_PESO=1.2;             /* quanto um real de luvas vale contra um real de salário */

function _semanaNeg(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function _arred(v,passo){return Math.round(v/passo)*passo;}
/* money() arredonda para o milhar; na mesa a diferença de 7,6k para 8k é a
   diferença entre fechar e não fechar, então o valor aparece inteiro. */
function dinheiro(v){
  const n=Math.round(v||0),a=Math.abs(n);
  if(a>=1e6)return '$'+(n/1e6).toFixed(2).replace('.',',')+'M';
  if(a>=1e5)return '$'+Math.round(n/1e3)+'k';
  if(a>=1e3)return '$'+(n/1e3).toFixed(1).replace('.',',').replace(',0','')+'k';
  return '$'+n;
}

/* Fração do pedido abaixo da qual cada lado não desce. Varia de jogador para
   jogador e de ano para ano, mas não de clique para clique. */
function _ocultoClube(p,dest){return 0.92+(_hashTxt(p.id+'|c|'+dest.id+'|'+G.ano)%8)/100;}
function _ocultoJogador(p,dest){return 0.95+(_hashTxt(p.id+'|j|'+dest.id+'|'+G.ano)%6)/100;}

/* Anos que ele quer. Mesma regra da renovação. */
function anosPreferidos(p){
  if(p.idade<=22&&p.pot-over(p)>=5)return{faixa:[1,2],txt:'Está crescendo: quer contrato curto para renegociar valorizado.'};
  if(p.idade>=29)return{faixa:[2,4],txt:'Veterano: prefere contrato longo.'};
  return{faixa:[2,3],txt:'Aceita de dois a três anos.'};
}
function premioAnos(p,anos){
  const f=anosPreferidos(p).faixa;
  const fora=anos<f[0]?f[0]-anos:anos>f[1]?anos-f[1]:0;
  return 1+fora*((typeof RENOV_PREMIO_ANO!=='undefined')?RENOV_PREMIO_ANO:0.07);
}
/* Salário que ele pede para essa duração e essas condições. */
function pedidoContrato(p,dest,anos,promessa){
  const d=detalharPedido(p,dest,{promessa});
  return{d,pedido:Math.max(300,_arred(d.pedido*premioAnos(p,anos),100))};
}
/* Luvas viram salário equivalente: o que ele recebe na assinatura, diluído
   pelo contrato. O mercenário valoriza mais o dinheiro na mão. */
function salarioEquivalente(p,sal,anos,luvas){
  const k=(PERFIS[perfilDe(p)].luvas||LUVAS_PESO);
  return (sal||0)+((luvas||0)*k)/(Math.max(1,anos)*12);
}

/* ---------- estado ---------- */
function negociacoes(){return G.negociacoes||(G.negociacoes=[]);}
function negociacao(id){return negociacoes().find(n=>n.id===id)||null;}
function negociacaoAtivaDe(jogadorId){
  return negociacoes().find(n=>n.jogadorId===jogadorId&&n.destinoId===G.meuTime
    &&(n.fase==='clube'||n.fase==='jogador'))||null;
}
function conversaFechada(p){return !!(p.negBloq&&_semanaNeg()<p.negBloq);}
function semanasAteNegociar(p){return conversaFechada(p)?p.negBloq-_semanaNeg():0;}

function _fala(n,de,txt,extra){
  n.hist.push({de,txt,sem:G.semana,ano:G.ano,...(extra||{})});
}

/* Abre (ou devolve a que já existe) a negociação do seu clube por um jogador. */
function abrirNegociacao(p,dest){
  dest=dest||G.times[G.meuTime];
  if(!p||!dest)return{ok:false,erro:'Negociação inválida.'};
  const ja=negociacaoAtivaDe(p.id);
  if(ja)return{ok:true,neg:ja};
  if(p.timeId===dest.id)return{ok:false,erro:p.nome+' já é do seu clube.'};
  if(conversaFechada(p))
    return{ok:false,erro:'A conversa por '+p.nome+' está fechada. Tente de novo em '+semanasAteNegociar(p)+' semana(s).'};
  const origem=p.timeId?G.times[p.timeId]:null;
  if(!G.janela&&!podePreContrato(p,dest))
    return{ok:false,erro:'A janela está fechada.'};
  const ps=posturaDoClube(p);
  const it=interessePor(p,dest);
  const preco=precoPedido(p);
  const n={tipo:'compra',id:'ng'+G.ano+'_'+(_hashTxt(p.id+'|'+_semanaNeg()+'|'+negociacoes().length)%1e6).toString(36),
    jogadorId:p.id,origemId:origem?origem.id:null,destinoId:dest.id,
    fase:origem?'clube':'jogador',
    postura:ps.id,
    pacClube:origem?(ps.id==='avenda'?5:ps.id==='negociavel'?4:2):0,
    pacJog:3+(it.nota>=48?1:0)+(it.nota>=70?1:0),
    pacClubeMax:0,pacJogMax:0,
    pedidaClube:origem?(ps.id==='intransferivel'?preco:_arred(preco*NEG_ABERTURA_CLUBE,5000)):0,
    taxa:0,viaMulta:false,contraJog:null,
    hist:[],ano:G.ano,semana:G.semana};
  n.pacClubeMax=n.pacClube;n.pacJogMax=n.pacJog;
  if(origem){
    _fala(n,'clube',ps.id==='intransferivel'
      ?'Ele não está à venda. Só sai pela multa rescisória de '+dinheiro(multaDe(p))+'.'
      :'Para conversar sobre '+p.nome+', pensamos em '+dinheiro(n.pedidaClube)+'.');
  }else{
    _fala(n,'jogador','Estou sem clube e aberto a propostas. Vamos conversar.');
  }
  negociacoes().push(n);
  /* com a janela fechada, o único caminho é o pré-contrato */
  if(!G.janela&&origem)irParaPreContrato(n);
  return{ok:true,neg:n};
}

/* ---------- pré-contrato ----------
   No último ano de contrato, da segunda metade da temporada em diante, o
   jogador pode acertar com outro clube sem taxa nenhuma. Ele cumpre o
   contrato até o fim e só se apresenta na virada. É a porta que faz renovar
   cedo valer a pena. */
const SEMANA_PRECONTRATO=27;
function janelaPreContrato(){return (G.semana||1)>=SEMANA_PRECONTRATO;}
function podePreContrato(p,dest){
  return !!(p&&p.timeId&&dest&&p.timeId!==dest.id&&p.contrato<=1&&janelaPreContrato()
    &&!p.preContrato&&!p.emprestimo&&!p.base);
}
function irParaPreContrato(n){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  if(!podePreContrato(p,dest))return{ok:false,erro:p.nome+' não está no último ano de contrato, ou ainda não é a segunda metade da temporada.'};
  n.tipo='precontrato';n.fase='jogador';n.taxa=0;
  _fala(n,'voce','Queremos acertar um pré-contrato: você chega de graça quando o contrato com o '+G.times[p.timeId].nome+' acabar.');
  _abrirJogador(n);
  return{ok:true};
}

/* ---------- renovação na mesa ---------- */
function abrirRenovacao(p,t){
  t=t||G.times[G.meuTime];
  if(!p||!t||p.timeId!==t.id)return{ok:false,erro:'Só dá para renovar com jogador do seu elenco.'};
  const ja=negociacaoAtivaDe(p.id);
  if(ja&&ja.tipo==='renovacao')return{ok:true,neg:ja};
  const duras=recusasRenovacao(p,t,anosPreferidos(p).faixa[0]);
  if(duras.length)return{ok:false,erro:duras.join(' ')};
  const it=interesseEmFicar(p,t);
  const n={tipo:'renovacao',id:'rn'+G.ano+'_'+(_hashTxt(p.id+'|r|'+_semanaNeg()+'|'+negociacoes().length)%1e6).toString(36),
    jogadorId:p.id,origemId:t.id,destinoId:t.id,fase:'jogador',postura:'',
    pacClube:0,pacClubeMax:0,
    pacJog:RENOV_TENTATIVAS+(it.nota>=48?1:0)+(it.nota>=70?1:0),pacJogMax:0,
    pedidaClube:0,taxa:0,viaMulta:false,contraJog:null,hist:[],ano:G.ano,semana:G.semana};
  n.pacJogMax=n.pacJog;
  negociacoes().push(n);
  _abrirJogador(n);
  return{ok:true,neg:n};
}

/* Fecha a conversa, gastando ou não o tempo de espera. */
function _encerrar(n,quem){
  const p=G.jogadores[n.jogadorId];
  n.fase='encerrada';
  if(p&&n.tipo==='renovacao'){
    /* renovação usa a trava própria (renovacao.js), que a ficha e Finanças leem */
    p.renovTent=0;p.renovBloq=_semanaNeg()+RENOV_ESPERA;p.moral=clamp(p.moral-0.05,0.05,1);
    _fala(n,'sistema',p.nome+' cansou e encerrou a conversa. Dá para tentar de novo em '+RENOV_ESPERA+' semanas.');
    return;
  }
  if(p){p.negBloq=_semanaNeg()+NEG_ESPERA;}
  _fala(n,'sistema',(quem==='clube'?'O clube':'O jogador')+' encerrou as conversas. Dá para tentar de novo em '+NEG_ESPERA+' semanas.');
}

/* ---------- 1. conversa com o clube ---------- */
/* Devolve {ok, resposta:'aceita'|'contra'|'recusa'|'encerrada', valor, erro} */
function proporAoClube(n,taxa,revenda){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  taxa=Math.max(0,_arred(taxa||0,500));
  if(dest.caixa<taxa)return{ok:false,erro:'Caixa insuficiente: você tem '+dinheiro(dest.caixa)+'.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(dest,taxa);
  if(fv)return{ok:false,erro:fv};
  const ps=posturaDoClube(p);
  const multa=multaDe(p);
  const preco=precoPedido(p);
  revenda=(typeof REVENDA_OPCOES!=='undefined'&&REVENDA_OPCOES.includes(+revenda))?+revenda:0;
  _fala(n,'voce','Oferecemos '+dinheiro(taxa)+' por '+p.nome+(revenda?', mais '+revenda+'% de uma venda futura':'')+'.',{valor:taxa});
  if(taxa>=multa)return pagarMulta(n,true);
  const minimo=ps.id==='intransferivel'?multa:_arred(preco*_ocultoClube(p,dest),500);
  /* a revenda vale dinheiro para quem vende: a oferta conta como maior */
  const equiv=revenda&&ps.id!=='intransferivel'?taxa*(1+revenda/100*pesoRevenda(p)):taxa;
  if(equiv>=minimo){
    n.taxa=taxa;n.revenda=revenda;n.fase='jogador';
    _fala(n,'clube','Fechado: '+dinheiro(taxa)+(revenda?' e '+revenda+'% de revenda':'')+'. Podem falar com o jogador.');
    _abrirJogador(n);
    return{ok:true,resposta:'aceita',valor:taxa};
  }
  const ofensa=equiv<preco*NEG_OFENSA;
  n.pacClube-=ofensa?2:1;
  if(n.pacClube<=0){
    _fala(n,'clube',ofensa?'Isso é uma piada. Não temos mais o que conversar.':'Não chegamos a um acordo.');
    _encerrar(n,'clube');
    return{ok:true,resposta:'encerrada'};
  }
  if(ps.id==='intransferivel'){
    _fala(n,'clube','Já dissemos: ele não está à venda. A multa é '+dinheiro(multa)+'.');
    return{ok:true,resposta:'recusa',valor:multa};
  }
  /* a contraproposta anda na sua direção, mas nunca abaixo do mínimo dele */
  n.pedidaClube=Math.max(minimo,_arred(n.pedidaClube-(n.pedidaClube-equiv)*0.35,5000));
  _fala(n,'clube',(ofensa?'Proposta muito abaixo do que ele vale. ':'')+'Aceitamos '+dinheiro(n.pedidaClube)+'.',{valor:n.pedidaClube});
  return{ok:true,resposta:'contra',valor:n.pedidaClube};
}
function aceitarContraClube(n){return proporAoClube(n,n.pedidaClube);}
/* Multa paga: o clube não tem como recusar. */
function pagarMulta(n,jaFalou){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  const multa=multaDe(p);
  if(dest.caixa<multa)return{ok:false,erro:'A multa é '+dinheiro(multa)+' e você tem '+dinheiro(dest.caixa)+' em caixa.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(dest,multa);
  if(fv)return{ok:false,erro:fv};
  if(!jaFalou)_fala(n,'voce','Vamos pagar a multa rescisória de '+dinheiro(multa)+'.',{valor:multa});
  n.taxa=multa;n.viaMulta=true;n.fase='jogador';
  _fala(n,'clube','Multa é multa. Não podemos impedir. Agora é com ele.');
  _abrirJogador(n);
  return{ok:true,resposta:'aceita',valor:multa,multa:true};
}
/* ---------- multa no contrato novo ----------
   Multa baixa facilita a saída e o jogador gosta; multa alta prende e ele
   cobra por isso. */
const NIVEIS_MULTA={
  baixa: {nome:'Baixa', k:0.7, f:0.96, txt:'Facilita a saída: ele pede um pouco menos.'},
  padrao:{nome:'Padrão',k:1,   f:1,    txt:'Pelo valor de mercado e os anos de contrato.'},
  alta:  {nome:'Alta',  k:1.5, f:1.06, txt:'Prende o jogador: ele cobra mais por isso.'}};
function _nivelMulta(m){return NIVEIS_MULTA[m]?m:'padrao';}

/* Pedido do jogador para esta conversa: compra e pré-contrato usam o pedido
   de mudança de clube; renovação usa o de ficar. */
function pedidoDaNeg(n,anos,promessa,multa){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const fm=NIVEIS_MULTA[_nivelMulta(multa)].f;
  if(n.tipo==='renovacao'){
    const d=pedidoRenovacao(p,dest,{promessa});
    return{d,pedido:Math.max(300,_arred(d.pedido*premioAnos(p,anos)*fm,100))};
  }
  const r=pedidoContrato(p,dest,anos,promessa);
  return{d:r.d,pedido:Math.max(300,_arred(r.pedido*fm,100))};
}
function interesseDaNeg(n,promessa){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  return n.tipo==='renovacao'?interesseEmFicar(p,dest,{promessa}):interessePor(p,dest,{promessa});
}

function _abrirJogador(n){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const it=interesseDaNeg(n,false);
  const pref=anosPreferidos(p);
  const {pedido}=pedidoDaNeg(n,pref.faixa[0],false,'padrao');
  n.contraJog={sal:pedido,anos:pref.faixa[0],luvas:0,multa:'padrao'};
  let txt;
  if(n.tipo==='renovacao')
    txt=it.nota>=70?'Quero ficar. Por '+dinheiro(pedido)+'/mês a gente fecha rápido.'
      :it.nota>=48?'Topo conversar. Penso em '+dinheiro(pedido)+'/mês por '+pref.faixa[0]+' ano(s).'
      :it.nota>=INTERESSE_MIN?'Não sei se fico. Para ficar, quero '+dinheiro(pedido)+'/mês.'
      :'Estou pensando em sair. Só fico por '+dinheiro(pedido)+'/mês.';
  else
    txt=it.nota>=70?'Seria um sonho jogar no '+dest.nome+'. Penso em '+dinheiro(pedido)+'/mês.'
      :it.nota>=48?'Gosto do projeto. Penso em '+dinheiro(pedido)+'/mês por '+pref.faixa[0]+' ano(s).'
      :'Posso ouvir. Mas para mudar quero '+dinheiro(pedido)+'/mês.';
  _fala(n,'jogador',txt,{valor:pedido});
}

/* ---------- 2. conversa com o jogador ---------- */
/* oferta = {sal, anos, luvas, promessa, multa} */
function avaliarOfertaJogador(n,oferta){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const anos=clamp(parseInt(oferta.anos)||2,1,4);
  const {d,pedido}=pedidoDaNeg(n,anos,!!oferta.promessa,oferta.multa);
  const eq=salarioEquivalente(p,oferta.sal,anos,oferta.luvas);
  const minimo=pedido*_ocultoJogador(p,dest);
  /* na renovação o empresário leva metade: não há transferência a intermediar */
  const comissao=Math.round(comissaoEmpresario(p,n.taxa,oferta.sal,anos,oferta.luvas)*(n.tipo==='renovacao'?0.5:1)/500)*500;
  const custo=(n.taxa||0)+(oferta.luvas||0)+comissao;
  const duras=n.tipo==='renovacao'?recusasRenovacao(p,dest,anos):recusasDuras(p,dest,anos);
  return{d,pedido,eq,minimo,anos,comissao,custo,razao:eq/Math.max(1,pedido),duras};
}
function _limparOferta(o){
  return{sal:Math.max(0,_arred(o.sal||0,100)),anos:clamp(parseInt(o.anos)||2,1,4),
         luvas:Math.max(0,_arred(o.luvas||0,500)),promessa:!!o.promessa,multa:_nivelMulta(o.multa)};
}
function proporAoJogador(n,oferta){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='jogador')return{ok:false,erro:'Essa etapa não está aberta.'};
  if(n.tipo==='compra'&&!G.janela)return{ok:false,erro:'A janela está fechada.'};
  oferta=_limparOferta(oferta);
  const a=avaliarOfertaJogador(n,oferta);
  if(a.duras.length)return{ok:false,erro:a.duras.join(' ')};
  if(dest.caixa<a.custo)return{ok:false,erro:'Caixa insuficiente: '+(n.taxa?'taxa, ':'')+'luvas e comissão somam '+dinheiro(a.custo)+'.'};
  if(n.tipo==='compra'&&typeof foraDaVerba==='function'){const fv=foraDaVerba(dest,a.custo);if(fv)return{ok:false,erro:fv};}
  _fala(n,'voce',dinheiro(oferta.sal)+'/mês por '+oferta.anos+' ano(s)'+
    (oferta.luvas?', '+dinheiro(oferta.luvas)+' de luvas':'')+(oferta.promessa?', titularidade garantida':'')+
    (oferta.multa!=='padrao'?', multa '+NIVEIS_MULTA[oferta.multa].nome.toLowerCase():'')+'.',{valor:oferta.sal});
  if(a.eq>=a.minimo){
    concluirNegociacao(n,oferta,a);
    return{ok:true,resposta:'aceita'};
  }
  const ofensa=a.eq<a.pedido*0.70;
  n.pacJog-=ofensa?2:1;
  if(n.pacJog<=0){
    _fala(n,'jogador',ofensa?'Vocês não me levam a sério. Não tenho interesse.':'Não vamos chegar a um acordo.');
    _encerrar(n,'jogador');
    return{ok:true,resposta:'encerrada'};
  }
  /* o que ele quer: a duração dele e o salário que fecha, já descontadas as
     luvas que você ofereceu */
  const pref=anosPreferidos(p).faixa;
  const anos=clamp(oferta.anos,pref[0],pref[1]);
  const quer=pedidoDaNeg(n,anos,oferta.promessa,oferta.multa).pedido;
  const k=(PERFIS[perfilDe(p)].luvas||LUVAS_PESO);
  const sal=Math.max(300,_arred(quer-(oferta.luvas*k)/(anos*12)+50,100));
  n.contraJog={sal,anos,luvas:oferta.luvas,promessa:oferta.promessa,multa:oferta.multa};
  const principal=a.d.itens.filter(i=>i.fator>1.04).sort((x,y)=>y.fator-x.fator)[0];
  _fala(n,'jogador',(ofensa?'Isso está muito longe. ':'')+'Fecho por '+dinheiro(sal)+'/mês e '+anos+' ano(s)'+
    (oferta.luvas?' com as luvas':'')+'.'+(principal?' Pesa para mim: '+principal.rot.toLowerCase()+'.':''),{valor:sal});
  return{ok:true,resposta:'contra',contra:n.contraJog};
}
function aceitarContraJogador(n){
  if(!n.contraJog)return{ok:false,erro:'Ele ainda não fez contraproposta.'};
  return proporAoJogador(n,n.contraJog);
}

/* ---------- fechamento ---------- */
function _promessaEmContrato(p,clubeId){
  const prazo=(typeof PROMESSA_PRAZO!=='undefined')?PROMESSA_PRAZO:8;
  p.promessa={tipo:'titular',ate:(G.semana||1)+prazo,ano:G.ano,clube:clubeId};
}
function concluirNegociacao(n,oferta,a){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const origem=p.timeId?G.times[p.timeId]:null;
  n.fase='fechada';
  n.interesse=interesseDaNeg(n,oferta.promessa);
  n.final={...oferta,taxa:n.taxa,comissao:a.comissao,deId:origem?origem.id:null};
  const empolgado=n.interesse.nota>=70;
  if(n.tipo==='renovacao'){
    dest.caixa-=(oferta.luvas||0)+a.comissao;
    const generoso=a.eq>=a.pedido*1.10;
    p.contrato=oferta.anos;p.salario=Math.round(oferta.sal);
    p.multa=Math.round(multaPadrao(p,oferta.anos)*NIVEIS_MULTA[oferta.multa].k/5000)*5000;
    p.renovTent=0;delete p.renovBloq;delete p.sondado;
    p.moral=clamp(p.moral+(generoso?0.09:0.05),0.05,1);
    if(oferta.promessa&&!(dest.titulares||[]).includes(p.id))_promessaEmContrato(p,dest.id);
    _fala(n,'jogador',empolgado?'Fechado! Aqui é a minha casa.':'Fechado. Sigo com vocês.');
    noticia('📄 '+p.nome+' renovou com '+dest.nome+' por '+oferta.anos+' ano(s), '+dinheiro(p.salario)+'/mês'+
      (oferta.luvas?' e '+dinheiro(oferta.luvas)+' de luvas':'')+'.',{c:'mercado',p:[p.id],t:[dest.id]});
    return;
  }
  if(n.tipo==='precontrato'){
    dest.caixa-=a.comissao;
    p.preContrato={clubeId:dest.id,sal:oferta.sal,anos:oferta.anos,luvas:oferta.luvas,
                   multa:oferta.multa,promessa:oferta.promessa,ano:G.ano};
    _fala(n,'jogador','Combinado. Cumpro meu contrato e no fim da temporada sou do '+dest.nome+'.');
    noticia('🤝 '+p.nome+' ('+(origem?origem.tag:'')+') assinou pré-contrato com '+dest.nome+
      ' e chega de graça na virada da temporada.',{c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id],imp:over(p)>=85?2:1});
    return;
  }
  dest.caixa-=(n.taxa||0)+(oferta.luvas||0)+a.comissao;
  if(origem)origem.caixa+=(n.taxa||0);
  /* a taxa entra na verba pelo registro da transferência; luvas e comissão aqui */
  if(typeof gastarVerba==='function')gastarVerba(dest,(oferta.luvas||0)+a.comissao);
  const de=origem?origem.tag:'sem clube';
  _fala(n,'jogador',empolgado?'Fechado! Mal posso esperar para começar.':'Fechado. Vamos trabalhar.');
  contratar(p,dest,oferta.anos,oferta.sal);
  p.multa=Math.round(multaPadrao(p,oferta.anos)*NIVEIS_MULTA[oferta.multa].k/5000)*5000;
  if(oferta.promessa)_promessaEmContrato(p,dest.id);
  /* quem chega empolgado chega motivado */
  if(empolgado)p.moral=clamp(p.moral+0.05,0.05,1);
  registrarTransferencia(p,origem,dest,n.taxa||0,n.viaMulta?'multa':origem?'compra':'livre');
  if(origem&&n.revenda&&typeof fixarRevenda==='function')fixarRevenda(p,origem.id,n.revenda);
  noticia('✍ '+p.nome+' ('+de+') assinou com '+dest.nome+
    (n.viaMulta?' — multa rescisória de '+dinheiro(n.taxa)+' paga':n.taxa?' por '+dinheiro(n.taxa):' — livre')+'.',
    {c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id],imp:over(p)>=88||n.viaMulta?2:1});
  /* contratar() limpa as negociações do jogador; a fechada fica para a tela */
  if(!negociacoes().includes(n))negociacoes().push(n);
}

/* ---------- pré-contratos da IA pelos seus jogadores ----------
   Da semana 27 em diante, quem está no último ano e não renovou vira alvo.
   Primeiro o clube sonda (notícia, para você ter tempo de renovar); duas
   semanas depois, se ninguém renovou, pode assinar. Roda toda semana. */
const PRECONTRATO_AVISO=2;
const PRECONTRATO_CHANCE=0.35;
function rondaPreContratos(){
  if(!janelaPreContrato()||!G.meuTime)return 0;
  const eu=G.times[G.meuTime];if(!eu)return 0;
  let assinados=0;
  for(const id of (eu.elenco||[]).slice()){
    const p=G.jogadores[id];
    if(!p||p.contrato>1||p.preContrato||p.emprestimo||p.base)continue;
    if(p.sondado&&!G.times[p.sondado.clubeId])delete p.sondado;
    if(!p.sondado){
      const cand=Object.values(G.times).filter(t=>t.id!==eu.id&&(t.elenco||[]).length<ELENCO_MAX)
        .map(t=>({t,n:interesseDe(t,p)}))
        .filter(x=>x.n>0&&salarioPedido(p,x.t)<=folgaSalarial(x.t)*1.15)
        .sort((a,b)=>b.n-a.n);
      if(!cand.length||rnd()>0.30)continue;
      const t=cand[0].t;
      p.sondado={clubeId:t.id,ano:G.ano,semana:G.semana};
      noticia('👀 '+t.nome+' está sondando '+p.nome+', que está no último ano de contrato. Renove antes que ele assine um pré-contrato.',
        {c:'mercado',p:[p.id],t:[t.id,eu.id],imp:2});
      continue;
    }
    const sd=p.sondado;
    const passou=(G.ano-sd.ano)*SEMANAS_ANO+(G.semana-sd.semana);
    if(passou<PRECONTRATO_AVISO||rnd()>PRECONTRATO_CHANCE)continue;
    const t=G.times[sd.clubeId];
    /* ele só vai se quiser mais o clube novo que o atual */
    const vaiQuerer=interessePor(p,t).nota>=interesseEmFicar(p,eu).nota-5;
    if(!vaiQuerer||recusasDuras(p,t,2).length){delete p.sondado;continue;}
    p.preContrato={clubeId:t.id,sal:salarioPedido(p,t),anos:anosPreferidos(p).faixa[1],luvas:0,multa:'padrao',ano:G.ano};
    delete p.sondado;assinados++;
    noticia('🤝 '+p.nome+' assinou pré-contrato com '+t.nome+'. Cumpre o contrato e sai de graça no fim da temporada.',
      {c:'mercado',p:[p.id],t:[t.id,eu.id],imp:2});
  }
  return assinados;
}
/* Virada: quem tinha pré-contrato e ficou sem contrato se apresenta no clube
   novo. Devolve true se ele foi. Chamado por fimDeTemporada. */
function cumprirPreContrato(p){
  const pc=p.preContrato;
  if(!pc)return false;
  delete p.preContrato;
  const dest=G.times[pc.clubeId];
  if(!dest||(dest.elenco||[]).length>=ELENCO_MAX)return false;
  const origem=p.timeId?G.times[p.timeId]:null;
  dest.caixa-=pc.luvas||0;
  contratar(p,dest,pc.anos||2,pc.sal||salario(p,dest));
  p.multa=Math.round(multaPadrao(p,pc.anos||2)*NIVEIS_MULTA[_nivelMulta(pc.multa)].k/5000)*5000;
  if(pc.promessa)_promessaEmContrato(p,dest.id);
  registrarTransferencia(p,origem,dest,0,'precontrato');
  noticia('🤝 '+p.nome+' se apresentou ao '+dest.nome+' pelo pré-contrato'+(origem?', deixando o '+origem.nome:'')+'.',
    {c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id]});
  return true;
}

/* Registro do mercado, para a Central e as notícias de maiores negócios. */
function registrarTransferencia(p,origem,dest,taxa,tipo){
  G.transferencias=G.transferencias||[];
  if(tipo!=='troca'&&tipo!=='emprestimo'&&typeof pagarRevenda==='function')pagarRevenda(p,origem,dest,taxa);
  /* verba da diretoria: o que entra no seu clube gasta, o que sai devolve parte */
  if(taxa>0&&typeof gastarVerba==='function'){gastarVerba(dest,taxa);if(origem)creditarVenda(origem,taxa);}
  G.transferencias.push({ano:G.ano,semana:G.semana,jogadorId:p.id,nome:p.nome,over:over(p),
    de:origem?origem.id:null,para:dest.id,taxa:taxa||0,tipo:tipo||'compra'});
  /* só as últimas temporadas: o save não precisa carregar a história inteira */
  const corte=(G.ano||0)-3;
  if(G.transferencias.length>400)G.transferencias=G.transferencias.filter(x=>x.ano>=corte).slice(-400);
}

/* Fim de janela: o que estava em andamento cai. Fechadas e encerradas antigas
   saem da lista. */
function limparNegociacoes(){
  const agora=_semanaNeg();
  G.negociacoes=negociacoes().filter(n=>{
    /* renovação e pré-contrato não dependem da janela */
    const foraDaJanela=n.tipo==='renovacao'||n.tipo==='precontrato';
    if(n.fase==='clube'||n.fase==='jogador')return !!G.janela||foraDaJanela;
    return agora-((n.ano||0)*SEMANAS_ANO+(n.semana||1))<NEG_ESPERA+2&&(!!G.janela||foraDaJanela);
  });
}
