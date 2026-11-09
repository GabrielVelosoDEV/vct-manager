/* ============================================================
   BOOT e ações da topbar
   ============================================================ */
async function boot(){
  await Storage.iniciar();
  Prefs.iniciar();
  await Imgs.iniciar();
  Rostos.iniciar();
  await Base.iniciar();
  await atualizarRuns();

  /* carrega a carreira mais recente, para o Continuar. A base de dados não
     precisa disso: ela mora no próprio armazenamento e é aberta pelo menu.
     O boot para no menu — quem decide entrar é você. */
  const salva=listaRuns.find(r=>r.clube&&r.clube!=='—');
  let carregou=false;
  if(salva)carregou=await carregarRun(salva.id);
  if(!carregou||!G||!G.meuTime)G=null;

  modo='menu';telaMenu='menu';
  render();
  window.addEventListener('beforeunload',()=>{
    /* com o Banco de dados do menu aberto, o G é a base: grava ela e devolve
       a carreira antes de gravar a carreira */
    Base.fecharEdicao();
    if(G&&G.meuTime)salvarRun(G.runNome);
  });
}

/* liga os botões da topbar; chamado a cada pintarTop() */
function ligarAcoesTopo(){
  const bs=$('#btnSave');
  if(bs)bs.onclick=async()=>{
    const ok=await salvarRun(G.runNome);
    await atualizarRuns();
    flash(ok?'Partida salva.':'Falha ao salvar — exporte o .json em Partidas salvas.');
  };
  const bn=$('#btnNext');
  if(bn)bn.onclick=()=>avancarComRitual(1);
  const bf=$('#btnFim');
  if(bf)bf.onclick=()=>avancarAteMeuJogo();
}

/* Avançar uma semana passando pelo ritual de antes da partida, quando há
   partida sua e a preferência está ligada: relatório de scouting e veto de
   mapas ANTES de a semana ser jogada. Sem isso, o veto continua automático e o
   botão faz o que sempre fez. */
/* Turno de dois dias na janela: só o mercado anda. */
function usarTurnos(){
  return Prefs.get('turnosNaJanela')!==false&&typeof turnoDisponivel==='function'&&turnoDisponivel();
}
function aplicarTurno(r){
  if(!r)return;
  if(typeof conferirCelebracao==='function')conferirCelebracao();
  if(Prefs.get('autosave'))salvarRun(G.runNome);
  if(modo==='jogo'){pintarTop();pintarSide();render();}
  const dias=diasAteFecharJanela(G.ano,G.semana,G.turno);
  const rot=rotuloTurno(G.ano,G.semana,G.turno);
  if(r.novas&&r.novas.length){
    const x=r.novas[0],p=G.jogadores[x.jogadorId],c=G.times[x.clubeId];
    flash('📨 '+(c?c.nome:'Um clube')+' fez proposta por '+(p?p.nome:'um jogador seu')+
          (r.novas.length>1?' (e mais '+(r.novas.length-1)+')':'')+' — veja em Mercado › Saídas.');
  }else if(dias<=7)flash(rot+' · a janela fecha em '+dias+' dia'+(dias===1?'':'s')+'.');
}
function avancarComRitual(quantas){
  if(usarTurnos())return aplicarTurno(avancarTurno());
  const comp=(Prefs.get('prePartida')&&typeof prePartidaDisponivel==='function')
    ?prePartidaDisponivel():null;
  if(!comp)return aplicarAvanco(avancar(),quantas||1);
  abrirPrePartida(comp,plano=>{
    const r=avancar(plano);
    /* Série já assistida ao vivo: não abre a transmissão de novo por cima. */
    if(plano&&plano.serieFeita)aplicarAvanco(Object.assign({},r,{minhaPartida:null}),quantas||1);
    else aplicarAvanco(r,quantas||1);
  });
}
/* resolve o que mostrar depois de avançar, respeitando as preferências */
function aplicarAvanco(r,quantas){
  if(!r)return;
  if(r.tipo==='rodada'){
    aba=0;
    if(r.minhaPartida&&Prefs.get('aoVivo'))partidaAoVivo(r.minhaPartida);
    else if(r.minhaPartida&&Prefs.get('modalPartida'))modalPartida(r.minhaPartida);
    else if(!r.minhaPartida&&Prefs.get('resumoRodada'))modalResumo(r);
    else render();
  }else render();
  /* Semana sem jogo não é erro nem tempo perdido, e o aviso diz isso — junto
     com o que ela serviu para adiantar. */
  if(r.tipo==='semana'&&quantas===1&&!r.encerrado)
    flash('Semana de treino — '+rotuloSemana(G.ano,r.semana)+'.');
  /* Rodada dupla: a semana parou antes do seu próximo jogo, que tem o próprio
     relatório e o próprio veto. */
  if(r.parcial)flash('Tem mais um jogo seu nesta semana — avance para o veto.');
  if(r.encerrado)flash(r.encerrado+' encerrado.');
  /* O veredito vem por último e por cima de tudo: é o desfecho da temporada, e
     abrir antes deixaria a tela do jogo já no ano seguinte por baixo. */
  /* Na virada do ano a cerimônia de encerramento vem antes: o veredito abre
     quando ela termina (ou quando você pula). */
  if(G&&G.cerimoniaPendente&&typeof abrirCerimonia==='function'){
    const ano=G.cerimoniaPendente;G.cerimoniaPendente=null;
    const reg=(G.premios||[]).find(x=>x.ano===ano);
    const v=G.vereditoPendente;G.vereditoPendente=null;
    abrirCerimonia(reg,()=>{if(v)modalVeredito(v);else render();},!!v);
  }else if(G&&G.vereditoPendente){
    const v=G.vereditoPendente;G.vereditoPendente=null;
    modalVeredito(v);
  }
  /* Carta nova de jogador seu: só quando nada mais está aberto, para não
     cobrir resultado nem veredito. Quem ficou na fila sai no próximo avanço. */
  if(G&&G.cartasNovas&&G.cartasNovas.length&&!$('#modal').innerHTML&&typeof modalCartaNova==='function')
    modalCartaNova();
  if(Prefs.get('autosave'))salvarRun(G.runNome);
  if(modo==='jogo'&&!$('#modal').innerHTML){pintarTop();pintarSide();}
  if(quantas>1)flash(quantas+' rodadas resolvidas.');
}

/* pula as rodadas em que seu clube não joga, até o próximo compromisso dele
   ou até a virada de bloco — o que vier primeiro */
function avancarAteMeuJogo(){
  /* Na janela com turnos, o avanço rápido termina a semana em curso, mas para
     no turno em que chegar proposta por alguém seu: é a resposta que importa. */
  if(usarTurnos()){
    let r=null;
    while(usarTurnos()){r=avancarTurno();if(r&&r.novas&&r.novas.length)break;}
    aplicarTurno(r);
    if(r&&r.novas&&r.novas.length)return;
  }
  /* Se a próxima semana já tem jogo seu, o ritual abre AGORA: adiantar por
     cima do próprio compromisso seria pular o veto sem avisar. */
  const comp=(Prefs.get('prePartida')&&typeof prePartidaDisponivel==='function')
    ?prePartidaDisponivel():null;
  if(comp){avancarComRitual(1);return;}
  let n=0,r=null,pausou=false;
  while(n<SEMANAS_ANO){
    /* Nunca atravessa um jogo seu: com o ritual ligado, para na véspera e o
       próximo Avançar abre o relatório e o veto. Antes o laço só conferia
       antes do primeiro passo e adiantava por cima do jogo. */
    if(n>0&&Prefs.get('prePartida')&&prePartidaDisponivel()){pausou=true;break;}
    r=avancar();n++;
    if(r&&r.parcial)break;                     /* semana parou antes de jogo seu */
    if(!r||r.tipo==='fim')break;
    if(r.encerrado)break;                      /* torneio encerrou: pare e mostre */
    if(r.minhaPartida)break;                   /* seu clube jogou */
    if(G.vereditoPendente||G.cerimoniaPendente)break;
  }
  aplicarAvanco(r,n);
  if(pausou)flash((n>1?n+' semanas adiantadas. ':'')+'Seu próximo jogo é agora — avance para o veto.');
  else if(n>1)flash(n+' semanas adiantadas.');
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',boot);

/* export para testes em node (tools/*.mjs e node --test) */
if(typeof module!=='undefined')module.exports={
  criarMundo,montarCalendario,avancar,over,importarElencos,exportarElencos,
  get G(){return G;},set G(v){G=v;}
};
