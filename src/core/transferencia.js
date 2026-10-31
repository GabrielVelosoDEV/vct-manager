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

/* ---------- o pedido salarial ---------- */
const PREMIO_QUEDA_DIVISAO=1.55;   /* Tier 1 → Tier 2 */
const DESCONTO_SUBIDA_DIVISAO=0.88;/* Tier 2 → Tier 1: ele quer ir, aceita menos */
const PREMIO_POR_PONTO_QUEDA=0.014;/* por ponto de nível de clube perdido */
const DESCONTO_POR_PONTO_SUBIDA=0.006;
const PREMIO_BANCO=[1,1,1,1,1,1.18,1.30,1.42,1.52];  /* por posição no elenco */

/* Detalhamento do pedido, para a interface conseguir explicar linha a linha
   em vez de mostrar um número que caiu do céu. */
function detalharPedido(p,destino){
  const origem=p.timeId?G.times[p.timeId]:null;
  const base=salario(p);
  const itens=[];
  const juntar=(rot,f)=>{if(Math.abs(f-1)>0.005)itens.push({rot,fator:f});return f;};

  let f=1;
  /* divisão */
  if(origem&&origem.tier===1&&destino.tier===2)f*=juntar('Cair para o Tier 2',PREMIO_QUEDA_DIVISAO);
  else if(origem&&origem.tier===2&&destino.tier===1)f*=juntar('Subir para o Tier 1',DESCONTO_SUBIDA_DIVISAO);

  /* qualidade do clube */
  const nOrigem=origem?nivelDoClube(origem):nivelDoClube(destino)-6;
  const nDestino=nivelDoClube(destino);
  const salto=nDestino-nOrigem;
  if(salto<0)f*=juntar('Clube mais fraco que o atual',1+(-salto)*PREMIO_POR_PONTO_QUEDA);
  else if(salto>0)f*=juntar('Clube melhor que o atual',1-Math.min(0.14,salto*DESCONTO_POR_PONTO_SUBIDA));

  /* minutos */
  const pos=posicaoNoElenco(p,destino);
  if(pos>5)f*=juntar('Entraria como reserva ('+pos+'º do elenco)',
                     PREMIO_BANCO[Math.min(pos,PREMIO_BANCO.length-1)]);

  /* região */
  const pr=premioRegiao(p,destino);
  if(pr!==1){
    const casa=regiaoNatal(p);
    const R=REGIONS.find(r=>r.id===destino.regiao);
    f*=juntar('Mudar de '+casa+' para '+((R&&R.nome)||destino.regiao),pr);
  }

  /* idade e ambição: garoto troca dinheiro por projeto, veterano não */
  if(p.idade<=21&&salto>4)f*=juntar('Jovem em ascensão: aceita menos por projeto',0.93);
  if(p.idade>=28)f*=juntar('Veterano: quer garantir o contrato',1.06);
  /* dificuldade da carreira: só no que é cobrado de você */
  if(destino.id===G.meuTime&&dificuldade().salario!==1)
    f*=juntar('Dificuldade '+dificuldade().nome.toLowerCase(),dificuldade().salario);

  return{base,fator:f,itens,pos,salto,
         pedido:Math.max(300,Math.round(base*f/100)*100)};
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
  return fora;
}

/* ---------- avaliação de uma proposta ---------- */
/* Devolve lista de motivos. Vazia significa aceito. */
function avaliarProposta(p,destino,taxa,sal,anos){
  const motivos=recusasDuras(p,destino,anos);
  if(p.timeId&&p.timeId!==destino.id){
    const pedido=pedidoDeVenda(p);
    if(taxa<pedido*0.92)motivos.push('O clube pede cerca de '+money(pedido)+' pelo passe.');
    else if(taxa<pedido&&rnd()<.5)motivos.push('O clube recusou por pouco. Suba a proposta.');
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
    const taxa=p.timeId?pedidoDeVenda(p):0;
    if(taxa>tetoTaxa)continue;
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
  if(origem){
    const titular=(origem.titulares||[]).includes(esc.p.id);
    const apertado=origem.caixa<origem.patroc*0.2;
    if(titular&&!apertado&&origem.elenco.length<=5)return null;
    if(titular&&!apertado&&rnd()<0.45)return null;
  }
  executarProposta(esc.p,t,esc.taxa,esc.d.pedido,ri(2,3));
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
