/* ============================================================
   O MOTOR DA GAMEPLAY NAS PARTIDAS DO MANAGER (etapa 7)
   ------------------------------------------------------------
   Até aqui um round do manager era uma conta: força contra força,
   ruído, e os abates distribuídos por peso. Agora, nas partidas que
   a preferência manda (por padrão, as do seu clube), o round é
   JOGADO: os dez titulares entram no mapa como bots da gameplay,
   com os atributos, o agente da comp, a tática do clube e a
   condição do dia, e o round acaba quando acaba de verdade — por
   eliminação, spike ou desarme.

   O encaixe é por baixo de abrirMapa/passoRound: quem conduz (o
   relógio, ou a transmissão ao vivo round a round) não muda nada.
   passoRound devolve a mesma linha de sempre, e o mapa fecha no
   mesmo formato; as estatísticas vêm de dentro do motor.

   Preferências (Configurações → Partida):
     motorMinhas  as partidas do seu clube no motor (padrão: ligado)
     motorTodas   todas as partidas no motor (lento: minutos por rodada)
   Desligadas as duas, tudo volta ao modelo de conta de sempre.
   ============================================================ */

function motorDisponivel(){
  return typeof GP!=='undefined'&&typeof GP.montarPartida==='function'&&typeof MAPAS_GAMEPLAY!=='undefined';
}
function usarMotor(A,B){
  if(!motorDisponivel())return false;
  if(typeof Prefs==='undefined')return false;
  if(Prefs.get('motorTodas'))return true;
  const meu=typeof clubeDoUsuario==='function'?clubeDoUsuario():G.meuTime;
  return !!Prefs.get('motorMinhas')&&!!meu&&(A.id===meu||B.id===meu);
}
const motorMapaId=m=>String(m||'').toLowerCase();

/* o time do manager no formato da gameplay: titulares, agente da comp e os
   atributos do dia (a condição — forma, cansaço, cabeça — pesa nos atributos
   de execução, como pesa em forcaTime) */
const MOTOR_ATRIB_DIA=['mira','reflexo','mov','util','visao','clutch','consist'];
function elencoParaMotor(t,mapa,adv){
  const jogadores=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean).map(p=>{
    const c=typeof condicao==='function'?condicao(p):1;
    const at=Object.assign({},p.at);
    /* condição ~0,8–1,15: vira até ±8 pontos nos atributos */
    for(const k of MOTOR_ATRIB_DIA)at[k]=clamp(Math.round(at[k]+(c-1)*55),25,99);
    /* modo jogador: talentos e VOD do adversário (core/semana-jogador.js) */
    if(p.voce&&typeof bonusDoJogadorNaPartida==='function')bonusDoJogadorNaPartida(p,at,adv);
    const ag=GP.idAgente(agenteDe(t,mapa,p));
    return{id:p.id,nome:p.nome,funcao:p.roleAtual||p.role,over:over(p),at,agentes:ag?[ag]:[]};
  });
  return{nome:t.nome,sigla:t.tag||t.nome,jogadores};
}

/* chamado no fim de abrirMapa: liga o motor neste mapa */
function motorAbrirMapa(M){
  const mapa=motorMapaId(M.mapa);
  if(!MAPAS_GAMEPLAY[mapa])return;
  const tA=elencoParaMotor(M.A,M.mapa,M.B), tB=elencoParaMotor(M.B,M.mapa,M.A);
  if(tA.jogadores.length<5||tB.jogadores.length<5)return;
  const tat=t=>Object.assign({},t.tatica||{},(M.tatA&&t===M.A)?M.tatA:{},(M.tatB&&t===M.B)?M.tatB:{});
  M.J=GP.montarPartida({
    mapa,jogador:false,tempoCompra:1,
    semente:Math.floor(rnd()*0x7fffffff)||1,
    timeA:tA,timeB:tB,
    agentesA:tA.jogadores.map(j=>j.agentes[0]||null),agentesB:tB.jogadores.map(j=>j.agentes[0]||null),
    primeiroAtk:M.ladoA==='def'?'B':'A',
    taticaA:tat(M.A),taticaB:tat(M.B),
  });
  M.motor=true;
  /* modo jogador: vida por abate e ultimate dos talentos vão no seu boneco */
  if(G.voce&&typeof talentosDoBoneco==='function'){
    const tal=talentosDoBoneco(), e=tal&&M.J.ents.find(x=>x.mid===G.voce.id);
    if(e)e.tal=tal;
  }
}

const MOTOR_COMO={'eliminação':'elim','explosão':'spike','desarme':'defuse','tempo':'tempo'};
const MOTOR_ECO={pistola:2,cheia:2,forca:1,eco:0};
const MOTOR_DT=1/60;
/* um round no motor; devolve a linha no formato de passoRound */
function motorPassoRound(M){
  if(M.fim)return null;
  /* o round a narrar é o próximo que ainda não virou linha: se você o jogou
     na gameplay (dia de jogo do modo jogador), ele já está no histórico do
     motor e aqui só vira linha; senão o motor joga até ele acabar */
  const J=M.J, alvo=M.hist.length;
  /* a tática em vigor (o pedido de tempo pode ter trocado) */
  J.taticaTime={A:Object.assign({},M.A.tatica||{},M.tatA||{}),B:Object.assign({},M.B.tatica||{},M.tatB||{})};
  GP.aplicarTaticaTimes(J);
  /* pedido de tempo: o time que pediu joga os próximos rounds mais firme */
  for(const e of J.ents)e.bonusTempo=(e.time==='A'&&M.bonusA>0)||(e.time==='B'&&M.bonusB>0);
  let guarda=0;
  const jogou=J.historico.length>alvo;
  while(!J.fim&&J.historico.length<=alvo&&guarda++<60*400)GP.passo(J,MOTOR_DT);
  /* deixa o round assentar (estatística do round lida no passo seguinte) */
  if(!jogou)for(let i=0;i<3&&!J.fim;i++)GP.passo(J,MOTOR_DT);
  if(J.historico.length<=alvo){M.fim=true;return null;}
  if(M.bonusA>0)M.bonusA--;
  if(M.bonusB>0)M.bonusB--;
  if(GP._estatPasso)GP._estatPasso(J);
  const h=J.historico[alvo], r=h.n;
  M.r=r;
  /* placar depois deste round (contado pelos vencedores até aqui) */
  M.sa=J.historico.slice(0,alvo+1).filter(x=>x.vencedor==='A').length;
  M.sb=J.historico.slice(0,alvo+1).filter(x=>x.vencedor==='B').length;
  const venceA=h.vencedor==='A', ladoA=h.atk==='A'?'atk':'def';
  M.ladoA=ladoA;
  const ent=id=>J.ents.find(e=>e.id===id), mid=id=>{const e=id&&ent(id);return e?e.mid:null;};
  const rd=(J.rodadas||{})[r]||{};
  const linha={v:venceA,lado:ladoA,r,sa:M.sa,sb:M.sb,pistol:r===1||r===13,
    como:MOTOR_COMO[h.como]||'elim',
    ecoA:MOTOR_ECO[h.compra.A]!=null?MOTOR_ECO[h.compra.A]:2,ecoB:MOTOR_ECO[h.compra.B]!=null?MOTOR_ECO[h.compra.B]:2,
    sobrou:rd.sobrou!=null?rd.sobrou:0,fk:mid(rd.fk),fd:mid(rd.fd),clutch:mid(rd.clutch),
    /* o que o motor sabe a mais, para quem quiser narrar */
    motor:{planoAtk:h.nomeAtk,planoDef:h.nomeDef,plant:h.plant||null,duracao:h.duracao}};
  M.hist.push(linha);
  /* estatística do mapa: a do motor, no formato do manager */
  for(const e of J.ents){
    if(e.mid==null||!M.st[e.mid])continue;
    const s=e.st;
    Object.assign(M.st[e.mid],{k:s.kills,d:s.mortes,a:s.assist||0,fk:s.fb||0,fd:s.fd||0,cl:s.clutches||0,rounds:s.rounds||r,
      dano:s.dano,agente:e.agente});
  }
  if(venceA){M.seqPerdaA=0;M.seqPerdaB=(M.seqPerdaB||0)+1;}
  else{M.seqPerdaB=0;M.seqPerdaA=(M.seqPerdaA||0)+1;}
  if(J.fim&&M.hist.length>=J.historico.length)M.fim=true;
  if(!M.fim&&typeof tempoDaComissao==='function'){const q=tempoDaComissao(M);if(q)linha.tempoPedido=q;}
  return linha;
}
