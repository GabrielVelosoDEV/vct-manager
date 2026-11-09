/* ============================================================
   MINIGAMES — o que o resultado faz no jogo
   ------------------------------------------------------------
   A tela de cada minigame mora em src/ui/minigames*.js; aqui fica só o
   efeito, para o motor não depender de interface. As regras valem para
   todos:
     · opcional: não jogar é exatamente o jogo de antes (fator 1);
     · uma sessão por semana conta; depois dela, treino livre (só recorde);
     · efeito com teto: jogar mal custa pouco, jogar muito bem rende o
       tamanho de uma boa escolha de semana, nunca mais que estrutura;
     · nota de 0 a 1, e é a nota que o efeito lê.
   Nada aqui sorteia: a semente da carreira continua a mesma.
   ============================================================ */

/* ---------- Range de mira ----------
   A sessão da semana muda a evolução de mira, reflexo e movimentação de
   quem treina esses atributos: de −8% (sessão ruim) a +15% (perfeita). */
const RANGE_ATRS=['mira','reflexo','mov'];
const RANGE_MIN=0.92, RANGE_MAX=1.15;
function fatorRange(nota){return RANGE_MIN+clamp(nota,0,1)*(RANGE_MAX-RANGE_MIN);}
function rangeDaSemana(t){return t&&t.id===G.meuTime&&t.miniTreino?t.miniTreino:null;}
function rangeDisponivel(t){return !!t&&t.id===G.meuTime&&!t.miniTreino;}
/* lido por desenvolver() em clock.js, atributo a atributo */
function fatorMiniEvolucao(t,k){
  const r=rangeDaSemana(t);
  /* "deixar a comissão cuidar" é a semana de sempre */
  if(!r||r.comissao||r.nota==null)return 1;
  return RANGE_ATRS.includes(k)?fatorRange(r.nota):1;
}
function registrarRange(t,res){
  if(!rangeDisponivel(t))return null;
  t.miniTreino={nota:clamp(res.nota,0,1),modo:res.modo,pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  const bateu=registrarRecordeMini('range-'+res.modo,res.pts||0,res.nota);
  return{sessao:t.miniTreino,bateu};
}
/* quem do elenco sente a sessão: plano de mira, reflexo ou movimentação,
   ou o plano equilibrado (que inclui mira) */
function beneficiadosRange(t){
  return (t.elenco||[]).map(id=>G.jogadores[id]).filter(p=>{
    if(!p)return false;
    const pl=typeof planoDoJogador==='function'?planoDoJogador(t,p):null;
    if(!pl||pl.tipo==='descanso'||pl.tipo==='agente')return false;
    return !pl.alvo||RANGE_ATRS.includes(pl.alvo)||!ATTRS.some(a=>a[0]===pl.alvo);
  });
}

/* ---------- jogos de ritmo das atividades do Vestiário ----------
   Cada atividade extra tem o seu jogo de ritmo. A nota muda a força da
   atividade naquela semana: de 80% (sessão ruim) a 125% (perfeita) do
   entrosamento, da confiança, da torcida ou do descanso que ela daria.
   Custo em caixa e o cansaço do bootcamp não mudam. A sessão vale para a
   atividade em que foi jogada: trocar de atividade depois perde o bônus. */
const ATIV_MIN=0.8, ATIV_MAX=1.25;
function fatorAtividade(nota){return ATIV_MIN+clamp(nota,0,1)*(ATIV_MAX-ATIV_MIN);}
function ritmoDisponivel(t){
  return !!t&&t.id===G.meuTime&&!!t.atividade&&t.atividade!=='nenhuma'&&!t.miniAtividade;
}
function fatorAtividadeSemana(t){
  const m=t&&t.id===G.meuTime?t.miniAtividade:null;
  if(!m||m.comissao||m.nota==null||m.id!==t.atividade)return 1;
  return fatorAtividade(m.nota);
}
function registrarRitmo(t,res){
  if(!ritmoDisponivel(t))return null;
  t.miniAtividade={id:t.atividade,nota:clamp(res.nota,0,1),pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  return{sessao:t.miniAtividade,bateu:registrarRecordeMini('ritmo-'+t.atividade,res.pts||0,res.nota)};
}

/* ---------- Blocos do IGL ----------
   Montar as jogadas: o IGL organiza, o time encaixa. A nota mexe no
   entrosamento entre o IGL e cada titular naquela semana: de −0,4 (sessão
   ruim) a +2,0 por dupla (perfeita). Para comparar: o jantar dá +1 em cada
   dupla de titulares e a ranked em duo +3 numa dupla só. */
const IGL_MIN=-0.4, IGL_MAX=2.0;
function deltaIGL(nota){return IGL_MIN+clamp(nota,0,1)*(IGL_MAX-IGL_MIN);}
function iglDisponivel(t){return !!t&&t.id===G.meuTime&&!!t.igl&&(t.elenco||[]).includes(t.igl)&&!t.miniIGL;}
function registrarIGL(t,res){
  if(!iglDisponivel(t))return null;
  t.miniIGL={igl:t.igl,nota:clamp(res.nota,0,1),pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  return{sessao:t.miniIGL,bateu:registrarRecordeMini('igl',res.pts||0,res.nota)};
}
/* chamado por entrosamentoSemanal(), depois da atividade da semana */
function aplicarMiniIGL(t){
  const m=t&&t.id===G.meuTime?t.miniIGL:null;
  if(!m||m.comissao||m.nota==null||!(t.elenco||[]).includes(m.igl))return;
  const d=deltaIGL(m.nota);
  for(const id of (t.titulares||[]))if(id!==m.igl&&G.jogadores[id])mexerDupla(t,m.igl,id,d);
}

/* ---------- Enigmas táticos ----------
   Estudo do mapa: três enigmas (leitura do adversário, smokes e o mapa
   embaralhado). A nota vira uma sessão extra de estudo do mapa escolhido no
   fim da semana: até 60% de uma semana inteira de treino dedicada a ele.
   É estudo, não treino físico: não cansa e não tem lado negativo. */
const ENIG_MAX=0.6;
function enigmaDisponivel(t){return !!t&&t.id===G.meuTime&&!t.miniMapa;}
function registrarEnigma(t,mapa,res){
  if(!enigmaDisponivel(t))return null;
  t.miniMapa={mapa,nota:clamp(res.nota,0,1),pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  return{sessao:t.miniMapa,bateu:registrarRecordeMini('enigmas',res.pts||0,res.nota)};
}
/* chamado por semana(), depois do treino da semana (core/clock.js) */
function aplicarMiniMapa(t){
  const m=t&&t.id===G.meuTime?t.miniMapa:null;
  if(!m||m.comissao||!m.nota||typeof treinarUmMapa!=='function')return;
  treinarUmMapa(t,m.mapa,ENIG_MAX*m.nota);
}

/* ---------- Quiz de VOD ----------
   Dois usos, uma sessão de cada por semana:
     · do próximo adversário: acertar o quiz dá níveis a mais de leitura
       no relatório de scouting CONTRA ELE nesta semana (+1 a partir de 50,
       +2 a partir de 85), até o teto de 5;
     · de uma conta do radar da Base: semanas de observação a mais para a
       leitura do garoto (até +5), na hora. */
function bonusVODDaNota(n){return n>=0.85?2:n>=0.5?1:0;}
function vodDisponivel(t){return !!t&&t.id===G.meuTime&&!t.miniVOD;}
function registrarVOD(t,adv,res){
  if(!vodDisponivel(t)||!adv)return null;
  const nota=clamp(res.nota,0,1);
  t.miniVOD={adv:adv.id,nota,bonus:bonusVODDaNota(nota),pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  return{sessao:t.miniVOD,bateu:registrarRecordeMini('vod',res.pts||0,nota)};
}
function bonusVOD(t,adv){
  const m=t&&t.id===G.meuTime?t.miniVOD:null;
  return m&&!m.comissao&&adv&&m.adv===adv.id?(m.bonus||0):0;
}
/* o nível de leitura contra um adversário específico (core/scout.js lê) */
function nivelScoutContra(t,adv){
  const base=typeof nivelScout==='function'?nivelScout(t):1;
  return clamp(base+bonusVOD(t,adv),1,typeof SCOUT_MAX!=='undefined'?SCOUT_MAX:5);
}
const VOD_BASE_MAX=5;
function vodBaseDisponivel(t){return !!t&&t.id===G.meuTime&&!t.miniBaseVOD;}
function registrarVODBase(t,contaId,res){
  if(!vodBaseDisponivel(t)||typeof radarRanked!=='function')return null;
  const c=radarRanked().contas.find(x=>x.id===contaId&&x.estado==='radar');
  if(!c)return null;
  const nota=clamp(res.nota,0,1),obs=Math.round(nota*VOD_BASE_MAX);
  c.obs+=obs;
  t.miniBaseVOD={conta:contaId,nome:c.nome,nota,obs,pts:res.pts||0,ano:G.ano,semana:G.semana||1};
  return{sessao:t.miniBaseVOD,bateu:registrarRecordeMini('vod',res.pts||0,nota)};
}

/* ---------- fim da semana ----------
   chamado por semana() depois do desenvolvimento: o que valia para esta
   semana sai, e a próxima abre uma sessão nova */
function encerrarMiniSemana(t){
  if(!t||t.id!==G.meuTime)return;
  if(t.miniTreino){t.miniTreinoUltimo=t.miniTreino;delete t.miniTreino;}
  if(t.miniAtividade){t.miniAtividadeUltimo=t.miniAtividade;delete t.miniAtividade;}
  if(t.miniIGL){t.miniIGLUltimo=t.miniIGL;delete t.miniIGL;}
  if(t.miniMapa){t.miniMapaUltimo=t.miniMapa;delete t.miniMapa;}
  if(t.miniVOD){t.miniVODUltimo=t.miniVOD;delete t.miniVOD;}
  if(t.miniBaseVOD){t.miniBaseVODUltimo=t.miniBaseVOD;delete t.miniBaseVOD;}
}

/* ---------- medalhas e recordes ---------- */
const MEDALHAS_MINI=[
  {id:'radiante',nome:'Radiante',min:0.93,cor:'#FFE9A8'},
  {id:'ouro',nome:'Ouro',min:0.8,cor:'#E2B45A'},
  {id:'prata',nome:'Prata',min:0.6,cor:'#C9D2DB'},
  {id:'bronze',nome:'Bronze',min:0.35,cor:'#C98A55'},
  {id:'ferro',nome:'Ferro',min:0,cor:'#7D8A96'}
];
function medalhaMini(nota){return MEDALHAS_MINI.find(m=>nota>=m.min)||MEDALHAS_MINI[MEDALHAS_MINI.length-1];}
/* Recorde vale na carreira (vai no save) e no jogo todo (fica no
   navegador, de quem joga): o segundo é o que faz voltar ao range. */
const MINI_REC_LS='vct_mini_rec_v1';
function recordesGlobaisMini(){try{return JSON.parse(localStorage.getItem(MINI_REC_LS)||'{}');}catch(e){return{};}}
function registrarRecordeMini(chave,pts,nota){
  const novo={pts:Math.round(pts),nota:Math.round(nota*1000)/1000,ano:G?G.ano:null};
  let bateu={carreira:false,geral:false};
  if(G){
    G.miniRec=G.miniRec||{};
    const r=G.miniRec[chave];
    if(!r||novo.pts>r.pts){G.miniRec[chave]=novo;bateu.carreira=true;}
  }
  try{
    const o=recordesGlobaisMini();
    if(!o[chave]||novo.pts>o[chave].pts){o[chave]=novo;localStorage.setItem(MINI_REC_LS,JSON.stringify(o));bateu.geral=true;}
  }catch(e){}
  return bateu;
}
function recordeMini(chave){
  const g=recordesGlobaisMini()[chave];
  const c=G&&G.miniRec&&G.miniRec[chave];
  return{geral:g||null,carreira:c||null};
}
