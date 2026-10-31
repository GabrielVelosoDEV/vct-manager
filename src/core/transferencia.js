/* ============================================================
   TRANSFERÊNCIAS
   ------------------------------------------------------------
   Antes: a IA só assinava agente livre, só na virada, e 82% dos
   contratos renovavam sozinhos. Não existia transferência entre
   clubes — o mercado era um depósito, não um mercado.

   O modelo aqui é UM só, e vale para os dois lados: a proposta
   que você faz e a que a IA faz passam pela mesma avaliação. Se
   um clube da IA não consegue tirar um jogador do rival por
   aquele dinheiro, você também não consegue.

   A ideia central é que TUDO vira preço. Em vez de uma lista de
   "não pode", cada coisa que desagrada o jogador vira um prêmio
   salarial que alguém tem de pagar:

     · cair de divisão               premio grande
     · ir para um clube mais fraco   proporcional à queda
     · virar reserva                 proporcional ao rebaixamento
     · mudar de região               conforme a distância
     · ir para a China               o maior de todos

   Assim a resposta nunca é um "não" opaco: é sempre "não por
   esse valor", e a interface consegue dizer quanto falta. As
   poucas recusas que dinheiro NÃO compra estão em recusasDuras()
   e são de ambição, não de conta.
   ============================================================ */

/* ---------- de onde o jogador é ---------- */
/* A região natal sai do país, não do clube atual: um brasileiro que joga na
   Europa continua sendo brasileiro na hora de decidir para onde vai. */
function regiaoNatal(p){
  for(const R of REGIONS)if((R.paises||[]).includes(p.pais))return R.id;
  return p.regiaoOrigem||(p.timeId&&G.times[p.timeId]?G.times[p.timeId].regiao:REGIONS[0].id);
}

/* Quanto custa convencer alguém a se mudar para cada região, quando não é a
   dele. Não é julgamento sobre os lugares: é fuso, idioma, visto e distância
   do circuito em que ele construiu a carreira. A China paga mais caro porque
   é a mudança mais dura para quem vem de fora — e é assim no cenário real. */
const DIFICULDADE_REGIAO={AMER:1.00, EMEA:1.04, PAC:1.12, CN:1.26};
/* Prêmio só por sair de casa, qualquer que seja o destino. */
const PREMIO_EXPATRIADO=1.10;
/* Regiões que compartilham fuso e circuito pesam menos entre si. */
const VIZINHAS={AMER:['AMER'], EMEA:['EMEA'], PAC:['PAC','CN'], CN:['CN','PAC']};

function premioRegiao(p,destino){
  const casa=regiaoNatal(p), alvo=destino.regiao;
  if(alvo===casa)return 1;
  const dif=DIFICULDADE_REGIAO[alvo]||1.10;
  /* mudança dentro da vizinhança (Pacífico ↔ China) dói menos */
  const perto=(VIZINHAS[casa]||[]).includes(alvo);
  return 1+(PREMIO_EXPATRIADO*dif-1)*(perto?0.55:1);
}

/* ---------- o que ele encontra no destino ---------- */
/* Em que posição do elenco ele entraria, considerando a função em que jogaria.
   1 a 5 é titular; acima disso é banco, e banco tem preço. */
function posicaoNoElenco(p,destino){
  const atuais=(destino.elenco||[]).map(i=>G.jogadores[i]).filter(x=>x&&x.id!==p.id);
  const meu=Math.max(overComo(p,p.role),p.role2?overComo(p,p.role2):0);
  return 1+atuais.filter(x=>over(x)>meu).length;
}
/* Força esportiva do clube, do ponto de vista de quem vai assinar: o que pesa
   é o elenco titular e o peso do nome, não o caixa. */
function nivelDoClube(t){
  if(!t)return 40;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const forca=tit.length?tit.reduce((s,x)=>s+over(x),0)/tit.length:t.prestigio;
  return forca*0.62+t.prestigio*0.28+(t.tier===1?10:0);
}

/* ---------- perfil ----------
   Todo jogador tem um jeito de decidir, e ele não muda: é o que faz dois
   jogadores de mesmo over reagirem diferente à mesma proposta. O perfil não
   inventa motivo novo, ele muda o PESO dos que já existem: o ambicioso sente o
   dobro a queda de nível, o mercenário quase não sente, o patriota sofre para
   sair de casa. Sai do nome, então é estável entre saves e não depende da
   base; o Editor pode fixar outro em p.perfil. */
const PERFIS={
  ambicioso:  {nome:'Ambicioso', desc:'Quer título. Clube forte vale mais que salário, e clube fraco ele recusa.',
               esporte:1.5, lugar:1},
  mercenario: {nome:'Mercenário',desc:'Vai atrás do maior salário. O projeto pesa pouco, luvas pesam muito.',
               esporte:0.5, lugar:0.6, premio:1.08, luvas:1.5},
  leal:       {nome:'Leal',      desc:'Apegado ao clube. Renova mais barato e é difícil de tirar de onde está.',
               esporte:1, lugar:1, saida:1.15, renova:0.93},
  patriota:   {nome:'Patriota',  desc:'Quer jogar perto de casa. Sair da região custa o dobro.',
               esporte:1, lugar:2},
  equilibrado:{nome:'Equilibrado',desc:'Pesa tudo na mesma medida.',esporte:1, lugar:1}
};
function _hashTxt(s){let h=2166136261;s=String(s);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function perfilDe(p){
  if(p&&p.perfil&&PERFIS[p.perfil])return p.perfil;
  const r=_hashTxt((p&&p.nome)+'|perfil')%100;
  return r<20?'ambicioso':r<38?'mercenario':r<52?'leal':r<66?'patriota':'equilibrado';
}
/* Temporadas seguidas no clube atual, contadas do histórico. */
function temporadasNoClube(p){
  const t=p.timeId?G.times[p.timeId]:null;if(!t)return 0;
  let n=0;
  for(let i=(p.hist||[]).length-1;i>=0;i--){if(p.hist[i].time===t.nome)n++;else break;}
  return n;
}
/* Rival de verdade, pela mesma régua do clássico (legado.js). Olha só o
   confronto direto entre os dois: varrer todos os rivais do clube a cada
   pedido custaria caro, porque a IA pede preço de centenas de jogadores. */
function saoRivais(a,b){
  if(!a||!b||a.id===b.id||typeof confronto!=='function'||typeof notaRivalidade!=='function')return false;
  const c=confronto(a.id,b.id);
  if(!c.jogos)return false;
  const corte=(typeof RIV_CLASSICO!=='undefined')?RIV_CLASSICO:0.28;
  return notaRivalidade(a,{...c,time:b})>corte;
}
function titulosRecentes(t){
  const desde=(G.ano||0)-1;
  return (t.titulos||[]).filter(x=>parseInt(String(x),10)>=desde).length;
}

/* ---------- o pedido salarial ---------- */
const PREMIO_QUEDA_DIVISAO=1.55;   /* Tier 1 → Tier 2 */
const DESCONTO_SUBIDA_DIVISAO=0.88;/* Tier 2 → Tier 1: ele quer ir, aceita menos */
const PREMIO_POR_PONTO_QUEDA=0.014;/* por ponto de nível de clube perdido */
const DESCONTO_POR_PONTO_SUBIDA=0.006;
const PREMIO_BANCO=[1,1,1,1,1,1.18,1.30,1.42,1.52];  /* por posição no elenco */
const PREMIO_RIVAL=1.22, PREMIO_RIVAL_LEAL=1.40;

/* Detalhamento do pedido, para a interface conseguir explicar linha a linha
   em vez de mostrar um número que caiu do céu.

   Cada linha tem um TIPO. O que não é dinheiro (nível, minutos, lugar,
   história, momento) é também o que decide o INTERESSE dele pelo clube —
   interessePor() lê as mesmas linhas, então o termômetro da tela e o salário
   pedido nunca discordam. `opts.promessa` é a titularidade prometida no
   contrato. */
function detalharPedido(p,destino,opts){
  opts=opts||{};
  const origem=p.timeId?G.times[p.timeId]:null;
  const base=salario(p,destino,true);
  const pf=PERFIS[perfilDe(p)];
  const itens=[];
  const juntar=(rot,f,tipo,k)=>{
    if(k!=null&&k!==1)f=Math.pow(f,k);
    if(Math.abs(f-1)>0.005)itens.push({rot,fator:f,tipo:tipo||'dinheiro'});
    return f;
  };

  let f=1;
  /* divisão */
  if(origem&&origem.tier===1&&destino.tier===2)f*=juntar('Cair para o Tier 2',PREMIO_QUEDA_DIVISAO,'esporte',pf.esporte);
  else if(origem&&origem.tier===2&&destino.tier===1)f*=juntar('Subir para o Tier 1',DESCONTO_SUBIDA_DIVISAO,'esporte',pf.esporte);

  /* qualidade do clube */
  const nOrigem=origem?nivelDoClube(origem):nivelDoClube(destino)-6;
  const nDestino=nivelDoClube(destino);
  const salto=nDestino-nOrigem;
  if(salto<0)f*=juntar('Clube mais fraco que o atual',1+(-salto)*PREMIO_POR_PONTO_QUEDA,'esporte',pf.esporte);
  else if(salto>0)f*=juntar('Clube melhor que o atual',1-Math.min(0.14,salto*DESCONTO_POR_PONTO_SUBIDA),'esporte',pf.esporte);
  const tr=titulosRecentes(destino);
  if(tr)f*=juntar('Clube campeão recente ('+tr+' título'+(tr>1?'s':'')+')',1-Math.min(0.09,tr*0.03),'esporte',pf.esporte);

  /* minutos */
  const pos=posicaoNoElenco(p,destino);
  const jovem=p.idade<=21;
  if(opts.promessa){
    f*=juntar('Titularidade prometida em contrato',pos>5?1.03:0.97,'minutos');
  }else if(pos>5){
    f*=juntar('Entraria como reserva ('+pos+'º do elenco)',
              PREMIO_BANCO[Math.min(pos,PREMIO_BANCO.length-1)],'minutos',jovem?1.3:1);
  }
  if(origem&&origem.id!==destino.id&&!(origem.titulares||[]).includes(p.id)&&(pos<=5||opts.promessa))
    f*=juntar('Ganharia a vaga de titular que não tem hoje',0.92,'minutos',jovem?1.3:1);

  /* região */
  const pr=premioRegiao(p,destino);
  if(pr!==1){
    const casa=regiaoNatal(p);
    const R=REGIONS.find(r=>r.id===destino.regiao);
    f*=juntar('Mudar de '+casa+' para '+((R&&R.nome)||destino.regiao),pr,'lugar',pf.lugar);
  }

  /* história: rival, clube formador, raízes no clube atual */
  if(origem&&origem.id!==destino.id){
    if(saoRivais(origem,destino))
      f*=juntar('Ir para o rival do '+origem.nome,perfilDe(p)==='leal'?PREMIO_RIVAL_LEAL:PREMIO_RIVAL,'historia');
    const anos=temporadasNoClube(p);
    if(pf.saida&&anos>=2)f*=juntar('Identificado com o '+origem.nome+' ('+anos+' temporadas)',pf.saida,'historia');
    else if(anos>=4)f*=juntar('Raízes no '+origem.nome+' ('+anos+' temporadas)',1.05,'historia');
    /* o momento no clube atual: quem está mal quer sair */
    if(p.moral<0.45)f*=juntar('Infeliz no '+origem.nome+': quer sair',0.92,'momento');
  }
  if(p.daCasa&&p.daCasa===destino.id&&(!origem||origem.id!==destino.id))
    f*=juntar('Voltar ao clube que o revelou',0.88,'historia');

  /* idade e ambição: garoto troca dinheiro por projeto, veterano não */
  if(p.idade<=21&&salto>4)f*=juntar('Jovem em ascensão: aceita menos por projeto',0.93,'esporte');
  if(p.idade>=28)f*=juntar('Veterano: quer garantir o contrato',1.06);
  if(pf.premio)f*=juntar('Perfil mercenário: quer o melhor salário do mercado',pf.premio);
  if(typeof fatorRiqueza==='function')f*=juntar('O clube tem muito dinheiro em caixa',fatorRiqueza(destino));
  if(!p.timeId&&p.semLivre>=4)f*=juntar('Sem clube há '+p.semLivre+' semanas',descontoSemClube(p),'momento');
  /* dificuldade da carreira: só no que é cobrado de você */
  if(destino.id===G.meuTime&&dificuldade().salario!==1)
    f*=juntar('Dificuldade '+dificuldade().nome.toLowerCase(),dificuldade().salario);

  return{base,fator:f,itens,pos,salto,perfil:perfilDe(p),
         pedido:Math.max(300,Math.round(base*f/100)*100)};
}

/* ---------- interesse ----------
   De 0 a 100, quanto ele quer jogar no clube, deixando o dinheiro de fora.
   Sai das mesmas linhas do pedido: um fator de ×1,30 tira cerca de 15
   pontos, um de ×0,88 dá cerca de 7. Abaixo de INTERESSE_MIN ele nem atende
   — é a recusa que salário não compra. */
const INTERESSE_MIN=15;
const INTERESSE_ESCALA=58, INTERESSE_NEUTRO=52;
const FAIXAS_INTERESSE=[
  {min:70,id:'empolgado', nome:'Empolgado',  txt:'Quer muito vir. Aceita até ganhar um pouco menos.'},
  {min:48,id:'interessado',nome:'Interessado',txt:'Gosta do projeto. Aceita o salário justo.'},
  {min:30,id:'morno',     nome:'Morno',      txt:'Ouve a proposta, mas só vem se o dinheiro compensar.'},
  {min:INTERESSE_MIN,id:'frio',nome:'Frio',  txt:'Não se anima. Só vem bem acima do normal.'},
  {min:0, id:'fechado',   nome:'Não atende', txt:'Não quer nem conversar com o clube.'}];
function pontosDoFator(f){return -INTERESSE_ESCALA*Math.log(f);}
function faixaInteresse(n){return FAIXAS_INTERESSE.find(x=>n>=x.min)||FAIXAS_INTERESSE[FAIXAS_INTERESSE.length-1];}
function interessePor(p,destino,opts){
  const d=(opts&&opts.d)||detalharPedido(p,destino,opts);
  const itens=d.itens.filter(i=>i.tipo!=='dinheiro')
    .map(i=>({...i,pontos:Math.round(pontosDoFator(i.fator))}));
  let pts=INTERESSE_NEUTRO;
  for(const i of itens)pts+=pontosDoFator(i.fator);
  const nota=clamp(Math.round(pts),0,100);
  return{nota,faixa:faixaInteresse(nota),itens,perfil:d.perfil};
}
function salarioPedido(p,destino){return detalharPedido(p,destino).pedido;}

/* ---------- o pedido do clube dono ---------- */
function pedidoDeVenda(p){
  const t=p.timeId?G.times[p.timeId]:null;
  if(!t)return 0;
  const titular=(t.titulares||[]).includes(p.id);
  /* Contrato longo e titularidade encarecem; folga de potencial também, porque
     o clube sabe que está vendendo o que o jogador ainda vai ser. */
  let m=1+(titular?.45:.10)+(p.contrato*.18)+Math.max(0,p.pot-over(p))*.012;
  /* Clube no elenco mínimo cobra mais: vender significa ter de repor no mesmo
     dia, e a reposição sai do bolso dele. É por isso que na vida real ninguém
     tira um titular de um elenco curto pelo preço de tabela. */
  const min=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
  if((t.elenco||[]).length<=min)m*=1.35;
  else if((t.elenco||[]).length<=min+1)m*=1.12;
  /* clube sem dinheiro aceita menos: é a válvula que faz o mercado girar */
  if(t.caixa<t.patroc*0.15)m*=0.78;
  return Math.round(p.valor*m/500)*500;
}

/* ---------- multa rescisória ----------
   Todo contrato tem uma. Paga a multa, o clube dono não tem como recusar: só
   o jogador decide. Enquanto ninguém fixa um valor (contrato vindo da base de
   dados), ela segue o valor de mercado e os anos restantes. */
function multaPadrao(p,anos){
  const a=anos!=null?anos:(p.contrato||1);
  return Math.max(25000,Math.round((p.valor||valor(p))*(1.7+0.25*a)/5000)*5000);
}
function multaDe(p){
  if(!p||!p.timeId)return 0;
  return p.multa>0?p.multa:multaPadrao(p);
}

/* ---------- postura do clube dono ----------
   Antes de qualquer número, o clube tem uma posição sobre o jogador. É o que
   aparece na mesa ao lado do escudo, e é o que decide se dá para negociar ou
   se a única porta é a multa. */
const POSTURAS={
  intransferivel:{nome:'Intransferível',cls:'r'},
  negociavel:    {nome:'Negociável',    cls:''},
  avenda:        {nome:'À venda',       cls:'t'},
  livre:         {nome:'Sem clube',     cls:'t'}};
function posturaDoClube(p){
  const t=p.timeId?G.times[p.timeId]:null;
  if(!t)return{id:'livre',...POSTURAS.livre,motivo:'Agente livre: não há taxa de transferência.'};
  const min=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
  const titular=(t.titulares||[]).includes(p.id);
  const apertado=t.caixa<0||t.caixa<t.patroc*0.15;
  const ordem=(t.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const rank=ordem.findIndex(x=>x.id===p.id);
  const r=(id,motivo)=>({id,...POSTURAS[id],motivo});
  if(p.anuncio)return r('avenda','O próprio clube colocou o jogador no mercado.');
  if(p.emprestimo)return r('intransferivel','Está emprestado: o clube dono decide no fim do empréstimo.');
  if(typeof emCrise==='function'&&emCrise(t))return r('avenda','Clube em crise ('+t.crise.motivo+'): liquidação do elenco.');
  if(p.pedidoSaida&&!p.pedidoSaida.negado)return r('avenda','Pediu para ser negociado.');
  if(titular&&rank>=0&&rank<2&&p.contrato>=2&&!apertado)
    return r('intransferivel','Um dos dois melhores do elenco, com contrato longo.');
  if(apertado)return r('avenda','O clube precisa de caixa e aceita menos.');
  if(!titular&&rank>=6)return r('avenda','Sem espaço no elenco.');
  if(p.moral<0.40)return r('avenda','O jogador está insatisfeito e quer sair.');
  if(p.contrato<=1)return r('negociavel','Último ano de contrato: o clube prefere vender a perder de graça.');
  if((t.elenco||[]).length<=min+1)return r('negociavel','Elenco curto: vender obriga a repor, e isso entra no preço.');
  return r('negociavel',titular?'Titular, mas tem preço.':'Reserva com preço de mercado.');
}
/* O preço que o clube pede, já com a postura. Intransferível = multa. */
function precoPedido(p){
  if(!p.timeId)return 0;
  const ps=posturaDoClube(p);
  if(ps.id==='intransferivel')return multaDe(p);
  const base=p.anuncio&&p.anuncio.pedido?p.anuncio.pedido:pedidoDeVenda(p);
  /* "à venda" por elenco cheio ou jogador infeliz baixa o preço; o desconto
     do clube sem caixa já mora em pedidoDeVenda */
  const dono=G.times[p.timeId];
  const desc=typeof emCrise==='function'&&emCrise(dono)&&!p.anuncio?CRISE_DESCONTO
    :ps.id==='avenda'&&!p.anuncio&&!(dono.caixa<dono.patroc*0.15)?0.88:1;
  return Math.min(multaDe(p),Math.round(base*desc/500)*500);
}

/* ---------- comissão do empresário ----------
   Quem traz o jogador cobra: um pedaço da taxa, das luvas e do contrato.
   Estrela tem empresário mais caro. Sai do caixa de quem contrata e não vai
   para clube nenhum. */
function comissaoEmpresario(p,taxa,sal,anos,luvas){
  const k=over(p)>=85?1.5:over(p)>=78?1.2:1;
  const v=((taxa||0)*0.04+(sal||0)*12*(anos||1)*0.04+(luvas||0)*0.05)*k;
  return Math.round(v/500)*500;
}

/* ---------- recusas que dinheiro não compra ---------- */
function recusasDuras(p,destino,anos){
  const fora=[];
  const origem=p.timeId?G.times[p.timeId]:null;
  if(destino.elenco.length>=9)fora.push('Elenco cheio (máximo 9). Libere alguém antes.');
  if(anos<1||anos>4)fora.push('Duração de contrato inaceitável.');
  if(origem&&origem.id===destino.id)fora.push('O jogador já é do clube.');
  if(p.base)fora.push(p.nome+' é da categoria de base de '+((G.times[p.base]||{}).nome||'outro clube')+' e não está à venda.');
  /* Um titular de elite não desce de divisão por dinheiro nenhum enquanto
     ainda está no auge. É a única barreira de ambição pura do modelo. */
  if(origem&&origem.tier===1&&destino.tier===2&&over(p)>=88&&p.idade<=27)
    fora.push(p.nome+' está no auge no Tier 1 e não considera cair de divisão.');
  /* Nem vai para um clube muito pior só para ser reserva. */
  if(origem&&nivelDoClube(destino)<nivelDoClube(origem)-14&&posicaoNoElenco(p,destino)>5)
    fora.push('Clube mais fraco E sem vaga de titular: o jogador não vê sentido.');
  /* O interesse é a última porta: só conta se nada acima já fechou. */
  if(!fora.length&&!(origem&&origem.id===destino.id)){
    const it=interessePor(p,destino);
    if(it.nota<INTERESSE_MIN){
      const pior=it.itens.slice().sort((a,b)=>a.pontos-b.pontos)[0];
      fora.push(p.nome+' não tem interesse no '+destino.nome+(pior?' — pesa: '+pior.rot.toLowerCase():'')+'.');
    }
  }
  return fora;
}

/* ---------- avaliação de uma proposta ---------- */
/* Devolve lista de motivos. Vazia significa aceito. */
function avaliarProposta(p,destino,taxa,sal,anos){
  const motivos=recusasDuras(p,destino,anos);
  if(p.timeId&&p.timeId!==destino.id){
    const multa=multaDe(p);
    if(taxa<multa){
      const ps=posturaDoClube(p);
      const pedido=precoPedido(p);
      if(ps.id==='intransferivel')motivos.push('O clube não vende: só pela multa de '+money(multa)+'.');
      else if(taxa<pedido*0.92)motivos.push('O clube pede cerca de '+money(pedido)+' pelo passe.');
      else if(taxa<pedido&&rnd()<.5)motivos.push('O clube recusou por pouco. Suba a proposta.');
    }
  }
  const d=detalharPedido(p,destino);
  if(sal<d.pedido*0.95){
    const principal=d.itens.slice().sort((a,b)=>b.fator-a.fator)[0];
    motivos.push('O jogador quer perto de '+money(d.pedido)+'/mês'+
                 (principal&&principal.fator>1.05?' — pesa: '+principal.rot.toLowerCase():'')+'.');
  }
  if(destino.caixa<taxa)motivos.push('Caixa insuficiente.');
  return motivos;
}
function executarProposta(p,destino,taxa,sal,anos){
  const origem=p.timeId?G.times[p.timeId]:null;
  destino.caixa-=taxa;if(origem)origem.caixa+=taxa;
  const de=origem?origem.tag:'sem clube';
  contratar(p,destino,anos,sal);
  if(typeof registrarTransferencia==='function')registrarTransferencia(p,origem,destino,taxa,origem?'compra':'livre');
  noticia('✍ '+p.nome+' ('+de+') assinou com '+destino.nome+
          (taxa?' por '+money(taxa):' — livre')+'.',{c:'mercado',p:[p.id],t:[destino.id,origem&&origem.id],imp:over(p)>=88?2:1});
  return true;
}

/* ============================================================
   MERCADO DA IA
   ------------------------------------------------------------
   Só na virada de temporada, que é quando elenco troca de verdade
   no cenário real. Durante o ano a janela segue existindo para
   agente livre e para você.
   ============================================================ */

/* Teto de folha: quanto da receita anual o clube aceita comprometer com
   salários. É este número que impede a IA de desfazer o equilíbrio econômico
   — sem ele, todo clube gasta até quebrar e a espiral volta pela porta dos
   fundos. 0.62 é o que os clubes praticam hoje em tools/fin.mjs. */
/* Fração da receita JÁ LIVRE DE CUSTEIO que pode virar folha. Antes o teto
   era 0.66 da receita bruta, o que ignorava o custo de manter o clube: um
   clube com estrutura no máximo pagava 38% da receita só em custeio e ainda
   podia comprometer 66% em salário — não fechava, e ele terminava no vermelho
   sem ter feito nada de errado. */
const TETO_FOLHA=0.88;
/* Quanto do caixa o clube arrisca numa única taxa de transferência. */
const TETO_TAXA=0.30;

function folhaAnual(t){
  const jog=(t.elenco||[]).reduce((s,i)=>s+(G.jogadores[i]?G.jogadores[i].salario:0),0);
  const empr=(typeof custoEmprestimosDe==='function')?custoEmprestimosDe(t):0;
  return (jog+folhaStaff(t)+empr)*12;
}
/* Teto máximo que a reserva consegue comprar. Acima disso o clube estaria
   apostando o futuro numa temporada, que é justamente o que leva à falência. */
const TETO_FOLHA_MAX=0.98;
const TETO_POR_ANO_DE_RESERVA=0.04;
/* Caixa parado além de uma temporada de receita amplia o teto de folha.

   Sem isto o teto olhava só para a receita, então um clube com 16 milhões no
   banco não podia gastar um centavo a mais que o lanterna da liga com a mesma
   receita — e o dinheiro de quem vencia só empoçava. Aqui ele volta como
   elenco melhor, que é o que um clube rico faz de verdade. É autolimitado:
   gastar derruba a reserva, e o teto desce junto. */
/* Teto de quem está devendo. Precisa sobrar dinheiro todo ano, senão o clube
   que entrou no vermelho — quase sempre um rebaixado que ficou com folha de
   Tier 1 e receita de Challengers — fica ali para sempre: a folha empata com
   a receita, ele não quebra mas também nunca sai do buraco. Com o aperto, ele
   corta, junta e volta. É o caminho de volta que faltava. */
const TETO_FOLHA_AUSTERIDADE=0.68;
function tetoFolhaDe(t){
  const rec=receitaAnual(t);
  if(!(rec>0))return TETO_FOLHA;
  if((t.caixa||0)<0)return TETO_FOLHA_AUSTERIDADE;
  const anosDeReserva=Math.max(0,(t.caixa||0)-rec)/rec;
  return Math.min(TETO_FOLHA_MAX,TETO_FOLHA+anosDeReserva*TETO_POR_ANO_DE_RESERVA);
}
function folgaSalarial(t){
  return Math.max(0,receitaLivre(t)*tetoFolhaDe(t)-folhaAnual(t))/12;
}

/* O que falta no elenco: devolve a função mais fraca e o over do titular que
   seria substituído. É o que dá intenção à IA — ela procura o buraco dela, em
   vez de comprar o melhor jogador disponível. */
function carenciaDe(t){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(tit.length<5)return{role:ROLES.find(r=>!tit.some(x=>cobre(x,r)))||pick(ROLES),alvo:0,pior:null};
  const pior=tit.slice().sort((a,b)=>over(a)-over(b))[0];
  return{role:pior.roleAtual||pior.role,alvo:over(pior),pior};
}

/* Uma rodada de negociação de um clube. Devolve o negócio fechado, ou null. */
function tentarReforco(t,candidatos){
  const car=carenciaDe(t);
  const folga=folgaSalarial(t);
  const tetoTaxa=Math.max(0,t.caixa*TETO_TAXA);
  if(folga<=0)return null;

  const avaliados=[];
  for(const p of candidatos){
    if(p.timeId===t.id)continue;
    if(t.elenco.length>=9)break;
    /* só interessa quem melhora a escalação de verdade */
    const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
    if(ganho<2)continue;
    const d=detalharPedido(p,t);
    if(d.pedido>folga)continue;
    const taxa=p.timeId?precoPedido(p):0;
    if(taxa>tetoTaxa)continue;
    /* intransferível só sai pela multa, e a IA só paga multa por salto grande */
    if(p.timeId&&taxa>=multaDe(p)&&ganho<5)continue;
    if(recusasDuras(p,t,3).length)continue;
    /* nota do negócio: ganho esportivo por real gasto */
    avaliados.push({p,d,taxa,nota:ganho/(1+(taxa+d.pedido*12)/500000)});
  }
  if(!avaliados.length)return null;
  avaliados.sort((a,b)=>b.nota-a.nota);
  const esc=avaliados[0];

  /* o clube dono precisa querer vender: só solta titular por proposta acima do
     pedido, ou se estiver apertado de caixa */
  const origem=esc.p.timeId?G.times[esc.p.timeId]:null;
  /* multa paga não tem recusa do clube: é para isso que ela existe */
  const viaMulta=origem&&esc.taxa>=multaDe(esc.p);
  if(origem&&!viaMulta){
    const titular=(origem.titulares||[]).includes(esc.p.id);
    const apertado=origem.caixa<origem.patroc*0.2||(typeof emCrise==='function'&&emCrise(origem));
    if(titular&&!apertado&&origem.elenco.length<=5)return null;
    if(titular&&!apertado&&rnd()<0.45)return null;
  }
  executarProposta(esc.p,t,esc.taxa,esc.d.pedido,ri(2,3));
  /* jovem vendido entre clubes da IA às vezes leva revenda junto */
  if(origem&&esc.taxa>0&&esc.p.idade<=21&&typeof fixarRevenda==='function'&&rnd()<0.25)fixarRevenda(esc.p,origem.id,10);
  return esc;
}

/* Mercado inteiro da virada. Os clubes agem em ordem de atratividade, e cada
   um faz no máximo duas contratações — sem esse limite um clube rico esvazia
   o mercado inteiro numa temporada. */
function mercadoTransferencias(){
  const clubes=Object.values(G.times)
    .filter(t=>t.id!==G.meuTime)
    .sort((a,b)=>atratividade(b)-atratividade(a));
  let fechados=0;
  for(const t of clubes){
    for(let n=0;n<2;n++){
      /* candidatos: quem está em outro clube da IA, mais os agentes livres.
         Seu elenco fica de fora: a IA não tira jogador seu pelas suas costas. */
      const cand=Object.values(G.jogadores).filter(p=>{
        if(p.timeId===G.meuTime)return false;
        if(p.base)return false;                   /* garoto de base não é mercado */
        if(p.lesao)return false;
        if(p.timeId&&p.contrato>2)return false;   /* contrato longo não sai */
        return true;
      });
      const feito=tentarReforco(t,cand);
      if(!feito)break;
      fechados++;
    }
  }
  for(const id in G.times)autoEscalar(G.times[id]);
  return fechados;
}
