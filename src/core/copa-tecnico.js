/* ============================================================
   VALORANT WORLD CUP — O MODO TÉCNICO (C7)
   ------------------------------------------------------------
   No papel de treinador você pode comandar o clube e também uma
   seleção (qualquer uma das 40): escolhe na criação da carreira ou
   aceita um convite de federação durante o jogo.

     G.manager.selecao        o país que você comanda (ou null)
     G.manager.selecaoConv    a sua convocação: {titulares, reservas}
     G.manager.selecaoTatica  {agres, foco}
     G.manager.convitesSelecao  convites abertos: [{pais, ano, ate}]

   A comissão: você entra como técnico da seleção (o analista segue
   sendo da federação). As federações da IA nunca escolhem você — só
   por convite. Convites saem no começo de cada ciclo (a primeira
   semana do ano das eliminatórias), das federações que preferem você
   ao técnico que têm, pela mesma conta da IA: nível de comissão,
   com um nível e meio a mais para quem é do país.

   A sua convocação vale quando fecha o mínimo (7, com os 5 titulares);
   sem ela, a seleção usa a sugestão de sempre. Ela é congelada nos
   mesmos dias das outras (sorteio das eliminatórias, sorteio da
   Copa); depois disso dá para trocar só quem é titular entre os 10.
   As séries da sua seleção param o relógio como as do seu clube e
   abrem o pré-jogo (ui/copa-tecnico.js).
   ============================================================ */
const CONVITE_MAX=3;

function selecaoDoTecnico(){
  if(!G||!G.manager||(typeof modoJogador==='function'&&modoJogador()))return null;
  if(typeof souTreinador==='function'&&!souTreinador())return null;
  return G.manager.selecao||null;
}
/* a sua lista, se ainda for válida: jogadores vivos, do país, 5 titulares e 7 no total */
function convocacaoDoTecnico(pais){
  if(!pais||selecaoDoTecnico()!==pais)return null;
  const u=G.manager.selecaoConv;if(!u)return null;
  const ok=id=>{const p=G.jogadores[id];return p&&p.pais===pais&&(p.idade||0)>=(typeof SELECAO_IDADE_MIN!=='undefined'?SELECAO_IDADE_MIN:15);};
  const tit=(u.titulares||[]).filter(ok), res=(u.reservas||[]).filter(ok).filter(i=>!tit.includes(i));
  if(tit.length<5||tit.length+res.length<SELECAO_MINIMO)return null;
  return{pais,titulares:tit.slice(0,5),reservas:res.slice(0,SELECAO_TAMANHO-5)};
}
function salvarConvocacaoDoTecnico(titulares,reservas){
  const pais=selecaoDoTecnico();if(!pais)return{ok:false,motivo:'Você não comanda uma seleção.'};
  if(titulares.length!==5)return{ok:false,motivo:'Escolha exatamente 5 titulares.'};
  if(titulares.length+reservas.length<SELECAO_MINIMO)return{ok:false,motivo:`A convocação precisa de pelo menos ${SELECAO_MINIMO} jogadores.`};
  if(titulares.length+reservas.length>SELECAO_TAMANHO)return{ok:false,motivo:`No máximo ${SELECAO_TAMANHO} convocados.`};
  G.manager.selecaoConv={titulares:titulares.slice(),reservas:reservas.slice()};
  return{ok:true,msg:'Convocação salva.'};
}
/* depois do congelamento: trocar quem começa jogando entre os 10 */
function convocacaoCongelada(){
  const pais=selecaoDoTecnico();if(!pais)return null;
  const cic=cicloDaCopa(proximaCopa(G.ano),false);if(!cic)return null;
  if(cic.copa&&cic.copa.convocados&&cic.copa.convocados[pais]&&!cic.copa.fim)return cic.copa.convocados[pais];
  if(cic.convocadosElim&&cic.convocadosElim[pais]&&!cic.classificados)return cic.convocadosElim[pais];
  return null;
}
function trocarTitularCongelado(sai,entra){
  const cv=convocacaoCongelada();if(!cv)return{ok:false,motivo:'Sem convocação fechada agora.'};
  const i=cv.titulares.indexOf(sai), j=cv.reservas.indexOf(entra);
  if(i<0||j<0)return{ok:false,motivo:'Troca inválida.'};
  cv.titulares[i]=entra;cv.reservas[j]=sai;
  /* a lista "de sempre" acompanha */
  G.manager.selecaoConv={titulares:cv.titulares.slice(),reservas:cv.reservas.slice()};
  return{ok:true,msg:`${G.jogadores[entra].nome} entra no lugar de ${G.jogadores[sai].nome}.`};
}
function salvarTaticaDaSelecao(t){
  if(!selecaoDoTecnico())return;
  G.manager.selecaoTatica=Object.assign({agres:3,foco:'default'},G.manager.selecaoTatica||{},t||{});
}

/* ---------- assumir e deixar ---------- */
function assumirSelecao(pais){
  if(!infoSelecao(pais))return{ok:false,motivo:'Seleção desconhecida.'};
  if(typeof souTreinador==='function'&&!souTreinador())return{ok:false,motivo:'Só o treinador comanda uma seleção.'};
  G.manager.selecao=pais;G.manager.selecaoDesde=G.ano;
  G.manager.selecaoConv=null;G.manager.selecaoTatica={agres:3,foco:'default'};
  G.manager.convitesSelecao=[];
  (G.manager.selecoes=G.manager.selecoes||[]).push({pais,desde:G.ano});
  if(G.copa)escolherComissoesSelecoes();
  if(typeof noticia==='function')noticia(`🌍 ${G.manager.nome} assume o comando da seleção nacional: ${_nomeSel(pais)}. O clube continua com você.`,{c:'clube',imp:3});
  return{ok:true,msg:`Você assumiu ${_nomeSel(pais)}.`};
}
function deixarSelecao(){
  const pais=selecaoDoTecnico();if(!pais)return{ok:false,motivo:'Você não comanda uma seleção.'};
  /* no meio de uma fase com convocação fechada não dá: a federação não fica sem técnico no meio da Copa */
  if(convocacaoCongelada())return{ok:false,motivo:'Com a convocação fechada, espere a fase acabar para sair.'};
  G.manager.selecao=null;G.manager.selecaoConv=null;
  const h=(G.manager.selecoes||[]).find(x=>x.pais===pais&&!x.ate);if(h)h.ate=G.ano;
  if(G.copa)escolherComissoesSelecoes();
  if(typeof noticia==='function')noticia(`${G.manager.nome} deixou o comando da seleção nacional: ${_nomeSel(pais)}.`,{c:'clube',imp:2});
  return{ok:true,msg:`Você deixou ${_nomeSel(pais)}.`};
}

/* ---------- convites ----------
   No começo de cada ciclo: as federações que preferem você ao técnico de agora. */
function convitesDeSelecao(){
  if(!G.manager||selecaoDoTecnico()||(typeof souTreinador==='function'&&!souTreinador()))return[];
  const eu=typeof membroManager==='function'?membroManager():null;
  if(!eu)return[];
  const meu=typeof nivelDe==='function'?nivelDe(eu):2;
  const out=[];
  for(const x of rankingPaises()){
    const com=comissaoDaSelecao(x.pais), atual=com.tecnico&&G.staff[com.tecnico];
    const notaAtual=atual?nivelDe(atual)+(atual.pais===x.pais?SEL_PREFERE_NACIONAL:0):0;
    const notaEu=meu+((G.manager.pais||eu.pais)===x.pais?SEL_PREFERE_NACIONAL:0);
    if(notaEu>notaAtual)out.push({pais:x.pais,pos:x.pos});
  }
  /* as maiores primeiro */
  return out.slice(0,CONVITE_MAX);
}
function abrirConvitesDeSelecao(cic){
  const l=convitesDeSelecao();
  if(!l.length)return;
  G.manager.convitesSelecao=l.map(x=>({pais:x.pais,ano:G.ano,ate:ELIM_SEM_SORTEIO-1}));
  if(typeof noticia==='function')noticia(`📨 ${l.length>1?'Federações querem':'Uma federação quer'} você no comando para a World Cup ${cic.ano}: ${l.map(x=>_nomeSel(x.pais)).join(', ')}. O convite vale até a semana ${ELIM_SEM_SORTEIO-1}.`,{c:'clube',imp:3});
}
function convitesSelecaoAbertos(){
  const l=(G.manager&&G.manager.convitesSelecao)||[];
  return l.filter(c=>c.ano===G.ano&&(G.semana||1)<=c.ate);
}
function responderConviteSelecao(pais,aceita){
  const l=convitesSelecaoAbertos();
  if(!l.some(c=>c.pais===pais))return{ok:false,motivo:'Esse convite não está mais de pé.'};
  if(!aceita){G.manager.convitesSelecao=l.filter(c=>c.pais!==pais);return{ok:true,msg:`Você recusou ${_nomeSel(pais)}.`};}
  return assumirSelecao(pais);
}
