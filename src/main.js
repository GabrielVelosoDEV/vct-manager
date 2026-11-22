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
  if(!carregou||!G||(!G.meuTime&&!G.voce))G=null;

  modo='menu';telaMenu='menu';
  render();
  window.addEventListener('beforeunload',()=>{
    /* com o Banco de dados do menu aberto, o G é a base: grava ela e devolve
       a carreira antes de gravar a carreira */
    Base.fecharEdicao();
    if(G&&(G.meuTime||G.voce))salvarRun(G.runNome);
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
  if(bn)bn.onclick=()=>{if(typeof relogioMarcar==='function')relogioMarcar();avancarComRitual(1);};
  const bw=$('#btnSemana');
  if(bw)bw.onclick=()=>{if(typeof relogioMarcar==='function')relogioMarcar();avancarDiasAte('semana');};
  const bf=$('#btnFim');
  if(bf)bf.onclick=()=>{if(typeof relogioMarcar==='function')relogioMarcar();avancarAteMeuJogo();};
}

/* Avançar uma semana passando pelo ritual de antes da partida, quando há
   partida sua e a preferência está ligada: relatório de scouting e veto de
   mapas ANTES de a semana ser jogada. Sem isso, o veto continua automático e o
   botão faz o que sempre fez. */
/* Um dia de janela: só o mercado anda. */
function usarTurnos(){
  return Prefs.get('turnosNaJanela')!==false&&typeof turnoDisponivel==='function'&&turnoDisponivel();
}
/* A temporada dia a dia (a preferência é a mesma da antiga janela dia a dia,
   que ela substitui). Vale para quem tem clube ou carreira de jogador. */
function usarDias(){
  return Prefs.get('turnosNaJanela')!==false&&typeof avancarDia==='function'&&!!G&&!!(G.meuTime||G.voce);
}
/* o seu jogo é hoje? (é quando o ritual de antes da partida abre) */
function meuDiaDeJogo(){
  return typeof meuJogoHoje==='function'&&meuJogoHoje();
}
function aplicarTurno(r){
  if(!r)return;
  if(typeof relogioTocar==='function')relogioTocar();
  if(typeof conferirCelebracao==='function')conferirCelebracao();
  /* modo Dono: fim da linha, conselho e avisos de caixa (ui/empresa.js) */
  if(G&&G.fimDonoPendente&&typeof modalFimDono==='function'){const f=G.fimDonoPendente;G.fimDonoPendente=null;modalFimDono(f);}
  else if(G&&G.conselhoPendente&&!$('#modal').innerHTML&&typeof modalConselho==='function'){const r=G.conselhoPendente;G.conselhoPendente=null;modalConselho(r);}
  else if(G&&G.criseNova&&!$('#modal').innerHTML&&typeof abrirCrise==='function'){G.criseNova=false;abrirCrise();}
  else if(G&&G.avisoEmpresaPendente&&!$('#modal').innerHTML&&typeof modalAvisoEmpresa==='function'){const a=G.avisoEmpresaPendente;G.avisoEmpresaPendente=null;modalAvisoEmpresa(a);}
  if(G&&G.tecSaiuPendente){const s=G.tecSaiuPendente;G.tecSaiuPendente=null;
    if(!$('#modal').innerHTML&&typeof avisar==='function')avisar(s.nome+' pediu demissão. A confiança dele em você chegou ao fim. O auxiliar assume como interino até você contratar outro técnico em Comando técnico.','O técnico saiu');}
  if(Prefs.get('autosave'))salvarRun(G.runNome);
  if(modo==='jogo'){pintarTop();pintarSide();render();}
  /* World Cup em novembro: um momento do evento (sorteio, os 32…) num dia da janela */
  if(G&&G.copaMomentos&&G.copaMomentos.length&&!$('#modal').innerHTML&&typeof abrirMomentosCopa==='function')
    abrirMomentosCopa(()=>render());
  const dias=diasAteFecharJanela(G.ano,G.semana,G.turno);
  const rot=rotuloTurno(G.ano,G.semana,G.turno);
  if(r.novas&&r.novas.length){
    const x=r.novas[0],p=G.jogadores[x.jogadorId],c=G.times[x.clubeId];
    flash('📨 '+(c?c.nome:'Um clube')+' fez proposta por '+(p?p.nome:'um jogador seu')+
          (r.novas.length>1?' (e mais '+(r.novas.length-1)+')':'')+' — veja em Mercado › Saídas.');
  }else if(G.janela&&dias>0&&dias<=7)flash(rot+' · a janela fecha em '+dias+' dia'+(dias===1?'':'s')+'.');
  avisarMomentos();
}
/* modo jogador: desafio cumprido, marco, título — um aviso só, o mais recente
   (a lista inteira está em Semana e treinos) */
function avisarMomentos(){
  if(!G||!G.voce||typeof momentosNovos!=='function')return;
  const l=momentosNovos().filter(m=>!m.avisado);
  if(!l.length)return;
  l.forEach(m=>m.avisado=true);
  const m=l[0],rot={desafio:'Desafio cumprido',marco:'Novo marco',mvp:'Momento',titulo:'Momento',semana:'Momento',maestria:'Maestria'}[m.tipo]||'Momento';
  flash(`${rot}: ${m.txt}${m.sub?' · '+m.sub:''}${l.length>1?` (e mais ${l.length-1} em Semana e treinos)`:''}`);
}
/* Etapa 7: com o motor completo, a sua série leva alguns segundos para ser
   jogada. O aviso é pintado ANTES do cálculo (que trava a tela enquanto roda),
   e só aparece quando a semana tem jogo seu que ainda não foi jogado ao vivo. */
function avisoMotor(on,texto){
  if(typeof document==='undefined')return;
  let el=document.getElementById('avisoMotor');
  if(!on){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.id='avisoMotor';
    el.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(5,10,18,.55);backdrop-filter:blur(2px);font:600 15px Inter,system-ui,sans-serif;color:#e8eef5;letter-spacing:.02em';
    document.body.appendChild(el);}
  el.textContent=texto;
}
function avancarComMotor(plano,depois){
  const pesado=typeof motorDisponivel==='function'&&motorDisponivel()&&!(plano&&plano.serieFeita)
    &&(Prefs.get('motorTodas')||(Prefs.get('motorMinhas')&&typeof compromissoDaSemana==='function'&&!!compromissoDaSemana()));
  /* dia a dia: joga só a rodada de hoje (e o mercado do dia) */
  const passo=()=>usarDias()?avancarDia(plano):avancar(plano);
  if(!pesado||typeof document==='undefined')return depois(passo());
  avisoMotor(true,Prefs.get('motorTodas')?'Jogando a rodada no motor completo…':'Jogando a sua partida no motor completo…');
  setTimeout(()=>{let r;try{r=passo();}finally{avisoMotor(false);}depois(r);},60);
}
function avancarComRitual(quantas){
  /* modo jogador: série sua pela seleção nesta semana (World Cup) abre o dia de
     jogo da seleção; depois dela, o avanço segue (pode haver outra na semana) */
  const djs=typeof jogoDeSelecaoDoUsuario==='function'?jogoDeSelecaoDoUsuario():null;
  if(djs){
    /* jogador convocado: o dia de jogo; técnico da seleção: o pré-jogo dela */
    const abrirS=djs.papel==='tecnico'?abrirPreJogoSelecao:abrirDiaDeJogoSelecao;
    abrirS(djs,()=>avancarComRitual(quantas));
    return;
  }
  /* modo Dono: o time acabou, ou o conselho ainda não se reuniu */
  if(typeof timePerdido==='function'&&timePerdido()){modalFimDono(G.manager.empresa.perdeu);return;}
  if(G.conselhoPendente&&typeof modalConselho==='function'){
    const r=G.conselhoPendente;G.conselhoPendente=null;modalConselho(r,()=>avancarComRitual(quantas));return;
  }
  /* modo Dono com técnico: sem mandato do ano, ele espera antes de a semana andar */
  if(typeof mandatoPendente==='function'&&mandatoPendente()&&typeof modalMandato==='function'){
    modalMandato(()=>avancarComRitual(quantas));return;
  }
  /* dia a dia: dia sem o seu jogo anda direto (mercado, rodada dos outros,
     fechamento de domingo); dia com o seu jogo segue para o ritual abaixo */
  if(usarDias()&&!meuDiaDeJogo()){
    const r=avancarDia();
    if(r&&r.tipo==='turno')return aplicarTurno(r);
    return aplicarAvanco(r,1);
  }
  if(!usarDias()&&usarTurnos())return aplicarTurno(avancarTurno());
  /* modo jogador: semana com jogo do seu clube abre o dia de jogo (ui/diadejogo.js) */
  const dj=typeof diaDeJogoDisponivel==='function'?diaDeJogoDisponivel():null;
  if(dj){
    abrirDiaDeJogo(dj,plano=>avancarComMotor(plano,r=>
      aplicarAvanco(plano&&plano.serieFeita?Object.assign({},r,{minhaPartida:null}):r,quantas||1)));
    return;
  }
  const comp=(Prefs.get('prePartida')&&typeof prePartidaDisponivel==='function')
    ?prePartidaDisponivel():null;
  if(!comp)return avancarComMotor(null,r=>aplicarAvanco(r,quantas||1));
  abrirPrePartida(comp,plano=>{
    avancarComMotor(plano,r=>{
      /* Série já assistida ao vivo: não abre a transmissão de novo por cima. */
      if(plano&&plano.serieFeita)aplicarAvanco(Object.assign({},r,{minhaPartida:null}),quantas||1);
      else aplicarAvanco(r,quantas||1);
    });
  });
}
/* resolve o que mostrar depois de avançar, respeitando as preferências */
function aplicarAvanco(r,quantas){
  if(!r)return;
  if(typeof relogioTocar==='function')relogioTocar(
    r.minhaPartida&&r.minhaPartida.wo?{legenda:r.minhaPartida.wo===G.meuTime?'W.O. — sem cinco em quadra':'Vitória por W.O.'}
    :r.minhaPartida?{legenda:'Dia de jogo'}
    :r.encerrado?{legenda:r.encerrado+(/^fim de temporada/i.test(r.encerrado)?'':' encerrado')}
    :quantas>1?{legenda:quantas+' semanas adiantadas'}:null);
  if(r.tipo==='rodada'){
    aba=0;
    if(r.minhaPartida&&r.minhaPartida.wo)modalWO(r.minhaPartida);
    else if(r.minhaPartida&&Prefs.get('aoVivo'))partidaAoVivo(r.minhaPartida);
    else if(r.minhaPartida&&Prefs.get('modalPartida'))modalPartida(r.minhaPartida);
    else if(!r.minhaPartida&&Prefs.get('resumoRodada'))modalResumo(r);
    else render();
  }else render();
  /* Semana sem jogo não é erro nem tempo perdido, e o aviso diz isso — junto
     com o que ela serviu para adiantar. */
  if(r.tipo==='semana'&&quantas===1&&!r.encerrado)
    flash(r.dia?'Semana fechada: treino, folha e notícias da '+rotuloSemana(G.ano,r.semana)+'.':'Semana de treino — '+rotuloSemana(G.ano,r.semana)+'.');
  /* Rodada dupla: a semana parou antes do seu próximo jogo, que tem o próprio
     relatório e o próprio veto. */
  if(r.parcial&&!r.dia)flash('Tem mais um jogo seu nesta semana — avance para o veto.');
  if(r.encerrado)flash(/^fim de temporada/i.test(r.encerrado)?'Temporada encerrada.'
    :r.encerrado+(/^(pré-temporada|pausa)/i.test(r.encerrado)?' encerrada.':' encerrado.'));
  avisarMomentos();
  /* O veredito vem por último e por cima de tudo: é o desfecho da temporada, e
     abrir antes deixaria a tela do jogo já no ano seguinte por baixo. */
  /* Na virada do ano a cerimônia de encerramento vem antes: o veredito abre
     quando ela termina (ou quando você pula). */
  const fimDaTemporada=()=>{
    if(G&&G.cerimoniaPendente&&typeof abrirCerimonia==='function'){
      const ano=G.cerimoniaPendente;G.cerimoniaPendente=null;
      const reg=(G.premios||[]).find(x=>x.ano===ano);
      const v=G.vereditoPendente;G.vereditoPendente=null;
      abrirCerimonia(reg,()=>{if(v)modalVeredito(v);
        else if(G.balancoTecnicoPendente&&typeof modalBalancoTecnico==='function'){const b=G.balancoTecnicoPendente;G.balancoTecnicoPendente=null;modalBalancoTecnico(b);}
        else render();},!!v);
    }else if(G&&G.vereditoPendente){
      const v=G.vereditoPendente;G.vereditoPendente=null;
      modalVeredito(v);
    }else if(G&&G.balancoTecnicoPendente&&typeof modalBalancoTecnico==='function'){
      const b=G.balancoTecnicoPendente;G.balancoTecnicoPendente=null;
      modalBalancoTecnico(b);
    }
  };
  /* Valorant World Cup: os momentos do evento (sede, sorteio, a campeã…)
     abrem antes da cerimônia de fim de ano — a final é no fim de novembro, antes
     da virada. Com outra tela aberta, ficam na fila para o próximo avanço. */
  if(G&&G.copaMomentos&&G.copaMomentos.length&&!$('#modal').innerHTML&&typeof abrirMomentosCopa==='function')
    abrirMomentosCopa(fimDaTemporada);
  else fimDaTemporada();
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
  /* modo Dono: mandato, conselho e fim de carreira passam pelo ritual */
  if((typeof timePerdido==='function'&&timePerdido())||G.conselhoPendente
     ||(typeof mandatoPendente==='function'&&mandatoPendente())){avancarComRitual(1);return;}
  if(usarDias())return avancarDiasAte('jogo');
  /* Na janela com turnos, o avanço rápido termina a semana em curso, mas para
     no turno em que chegar proposta por alguém seu: é a resposta que importa. */
  if(usarTurnos()){
    let r=null;
    /* série sua pela seleção num dia da janela: para nela, não simula por cima */
    const selecao=()=>typeof jogoDeSelecaoDoUsuario==='function'&&jogoDeSelecaoDoUsuario();
    while(usarTurnos()){
      if(selecao()){if(r)aplicarTurno(r);avancarComRitual(1);return;}
      r=avancarTurno();if(r&&r.novas&&r.novas.length)break;
    }
    aplicarTurno(r);
    if(r&&r.novas&&r.novas.length)return;
  }
  /* Se a próxima semana já tem jogo seu, o ritual abre AGORA: adiantar por
     cima do próprio compromisso seria pular o veto sem avisar. */
  const comp=(Prefs.get('prePartida')&&typeof prePartidaDisponivel==='function')
    ?prePartidaDisponivel():null;
  if(comp||(typeof diaDeJogoDisponivel==='function'&&diaDeJogoDisponivel())
     ||(typeof jogoDeSelecaoDoUsuario==='function'&&jogoDeSelecaoDoUsuario())){avancarComRitual(1);return;}
  let n=0,r=null,pausou=false;
  while(n<SEMANAS_ANO){
    /* Nunca atravessa um jogo seu: com o ritual ligado, para na véspera e o
       próximo Avançar abre o relatório e o veto. Antes o laço só conferia
       antes do primeiro passo e adiantava por cima do jogo. */
    if(n>0&&((Prefs.get('prePartida')&&prePartidaDisponivel())||(typeof diaDeJogoDisponivel==='function'&&diaDeJogoDisponivel())
       ||(typeof jogoDeSelecaoDoUsuario==='function'&&jogoDeSelecaoDoUsuario()))){pausou=true;break;}
    r=avancar();n++;
    if(r&&r.parcial)break;                     /* semana parou antes de jogo seu */
    if(!r||r.tipo==='fim')break;
    if(r.encerrado)break;                      /* torneio encerrou: pare e mostre */
    if(r.minhaPartida)break;                   /* seu clube jogou */
    if(G.vereditoPendente||G.cerimoniaPendente)break;
    if(G.copaMomentos&&G.copaMomentos.length)break;   /* momento da World Cup */
    if(G.conselhoPendente||G.fimDonoPendente||G.avisoEmpresaPendente||G.criseNova)break;   /* modo Dono */
  }
  aplicarAvanco(r,n);
  if(pausou)flash((n>1?n+' semanas adiantadas. ':'')+'Seu próximo jogo é agora — avance para o veto.');
  else if(n>1)flash(n+' semanas adiantadas.');
}
/* Avanço rápido no dia a dia. alvo: 'jogo' (até o dia do seu próximo jogo),
   'semana' (até fechar a semana) ou {ano,semana,dia} (uma data do calendário).
   Para antes se aparecer algo que é seu: o seu jogo (abre o ritual), proposta
   por alguém seu, torneio encerrado, veredito, momento de Copa, conselho. */
function avancarDiasAte(alvo,opts){
  opts=opts||{};const data=alvo&&typeof alvo==='object';
  if((typeof timePerdido==='function'&&timePerdido())||G.conselhoPendente
     ||(typeof mandatoPendente==='function'&&mandatoPendente())){avancarComRitual(1);return;}
  const semana0=G.semana,ano0=G.ano;
  const chegou=()=>{
    if(alvo==='semana')return G.semana!==semana0||G.ano!==ano0;
    if(alvo&&typeof alvo==='object')return G.ano>alvo.ano||(G.ano===alvo.ano&&(G.semana>alvo.semana||(G.semana===alvo.semana&&(G.turno||0)>=alvo.dia)));
    return false;
  };
  let n=0,r=null,ultimo=null,dias=0;
  if(data&&G.ano!==alvo.ano)return;
  const leilao0=G.voce&&typeof leilaoAtual==='function'&&leilaoAtual()?leilaoAtual().id:null;
  const props0=G.voce&&G.voce.propostas?G.voce.propostas.length:0;
  const copa0=G.copaMomentos?G.copaMomentos.length:0;
  const selecao=()=>typeof jogoDeSelecaoDoUsuario==='function'&&jogoDeSelecaoDoUsuario();
  while(n<SEMANAS_ANO*8){
    if(chegou())break;
    /* o seu jogo é hoje: abre o ritual (relatório, veto, dia de jogo) */
    if((meuDiaDeJogo()&&!opts.meusJogos)||selecao()){
      if(ultimo)aplicarAvanco(ultimo,1);else if(r)aplicarTurno(r);
      avancarComRitual(1);
      if(dias>1)flash(dias+' dias adiantados. Hoje tem jogo seu.');
      return;
    }
    r=avancarDia();n++;dias++;
    if(!r)break;
    if(r.tipo!=='turno')ultimo=r;
    /* até uma data: só para no que é obrigatório (abaixo); o resto se vê lá */
    if(!data&&r.novas&&r.novas.length)break;
    if(!data&&(r.minhaPartida||r.encerrado))break;
    if(G.vereditoPendente||G.cerimoniaPendente)break;
    if(G.copaMomentos&&G.copaMomentos.length>copa0)break;
    if(G.conselhoPendente||G.fimDonoPendente||G.avisoEmpresaPendente||G.criseNova)break;
    if(!data&&G.voce&&typeof leilaoAtual==='function'&&leilaoAtual()&&leilaoAtual().id!==leilao0)break;
    if(!data&&G.voce&&(G.voce.propostas||[]).length>props0)break;
  }
  if(r&&r.tipo==='turno'&&!(ultimo&&(ultimo.minhaPartida||ultimo.encerrado)))aplicarTurno(r);
  else if(ultimo)aplicarAvanco(ultimo,1);
  else if(r)aplicarTurno(r);
  if(dias>1)flash(dias+' dias adiantados.');
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',boot);

/* export para testes em node (tools/*.mjs e node --test) */
if(typeof module!=='undefined')module.exports={
  criarMundo,montarCalendario,avancar,over,importarElencos,exportarElencos,
  get G(){return G;},set G(v){G=v;}
};
