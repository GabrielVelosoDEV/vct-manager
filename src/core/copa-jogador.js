/* ============================================================
   VALORANT WORLD CUP — O MODO JOGADOR (C6)
   ------------------------------------------------------------
   Você é convocado se estiver entre os 10 do seu país (5 titulares
   e 5 reservas), pela mesma conta das seleções da IA. A convocação
   das eliminatórias sai no sorteio delas (domingo da semana 45 do ano
   ímpar); a da Copa, no sorteio da Copa (o mesmo domingo, no ano par).

     convocado     notícia, seguidores, imagem e um post para fazer;
                   a sua série pela seleção abre o dia de jogo, com
                   os mesmos três jeitos de viver cada mapa
     de fora       a notícia de quem foi chamado na sua função, e a
                   moral sente
     depois        cada série pela seleção mexe na fama (mais na Copa,
                   mais com MVP); a medalha, o selo e a carta de
                   campeão vêm do fim da Copa (core/copa-torneio.js)

   G.voce.selecao guarda as suas convocações: [{ano, tipo, pais, titular}].
   ============================================================ */

function _eu(){return typeof modoJogador==='function'&&modoJogador()&&typeof meuJogador==='function'?meuJogador():null;}

/* ---------- convocação ---------- */
function aoConvocarSelecao(tipo,cic,convs){
  const p=_eu();if(!p||!infoSelecao(p.pais))return;
  const cv=convs&&convs[p.pais];
  if(!cv)return;                          /* o seu país não está nesta fase */
  const nome=_nomeSel(p.pais), oque=tipo==='copa'?`a World Cup ${cic.ano} em ${cic.nomeSede}`:`as eliminatórias da World Cup ${cic.ano}`;
  G.voce.selecao=G.voce.selecao||[];
  if(cv.titulares.includes(p.id)||cv.reservas.includes(p.id)){
    const titular=cv.titulares.includes(p.id);
    if(!G.voce.selecao.some(x=>x.ano===cic.ano&&x.tipo===tipo))
      G.voce.selecao.push({ano:cic.ano,tipo,pais:p.pais,titular});
    noticia(`📣 Você foi convocado por ${nome} para ${oque}${titular?', entre os cinco titulares':', como reserva'}.`,{c:'carreira',p:[p.id],imp:3});
    if(typeof ganharSeguidores==='function')ganharSeguidores(tipo==='copa'?0.06:0.03,tipo==='copa'?6000:2500,`Convocado por ${nome}.`);
    if(typeof mexerImagem==='function')mexerImagem(tipo==='copa'?3:1.5);
    if(typeof _abrirPost==='function')_abrirPost('convocacao');
    p.moral=clamp((p.moral||0.6)+0.05,.15,1);
  }else{
    /* quem foi chamado na sua função, no seu lugar */
    const da=cv.titulares.concat(cv.reservas).map(i=>G.jogadores[i]).filter(x=>x&&x.role===p.role).sort((a,b)=>over(a)-over(b))[0];
    noticia(`📋 ${nome} divulgou a convocação para ${oque}, e você ficou de fora.${da?` Na sua função, o chamado foi ${da.nome} (over ${over(da)}).`:''}`,{c:'carreira',p:[p.id].concat(da?[da.id]:[]),imp:2});
    p.moral=clamp((p.moral||0.6)-0.05,.15,1);
    if(typeof mexerImagem==='function')mexerImagem(-1);
  }
}
function aoConvocarCopa(cic){aoConvocarSelecao('copa',cic,cic.copa&&cic.copa.convocados);}

/* ---------- a série ---------- */
function aposSerieSelecaoJogador(f){
  const p=_eu();if(!p||!f||f.amistoso||!f.esc)return;
  const lado=f.esc.a.includes(p.id)?'a':f.esc.b.includes(p.id)?'b':null;
  if(!lado)return;                        /* no banco: só assistiu */
  const venceu=f.v===f[lado], copa=/^World Cup/.test(f.nome||''), mvp=f.det&&f.det.mvp===p.id;
  if(typeof ganharSeguidores==='function')
    ganharSeguidores((venceu?0.012:0.003)*(copa?1.6:1)+(mvp?0.012:0),venceu?(copa?1500:600):200,
      `${venceu?'Vitória':'Derrota'} pela seleção${mvp?' (MVP)':''}.`);
  if(mvp&&typeof _abrirPost==='function')_abrirPost('jogada');
}

/* ---------- o fim da Copa ---------- */
function aoEncerrarCopa(cic,ed){
  const p=_eu();if(!p)return;
  const cv=(ed.elencos&&ed.elencos[p.pais])||(cic.copa.convocados||{})[p.pais];
  if(!_naConvocacao(cv,p.id))return;
  const nome=_nomeSel(p.pais);
  if(ed.campeao===p.pais){
    noticia(`🏆 VOCÊ É CAMPEÃO DO MUNDO! ${nome} venceu a World Cup ${cic.ano}. A medalha de ouro, o selo e a carta de campeão do mundo são seus.`,{c:'carreira',p:[p.id],imp:3});
    if(typeof ganharSeguidores==='function')ganharSeguidores(0.3,60000,`Campeão do mundo ${cic.ano}.`);
    if(typeof mexerImagem==='function')mexerImagem(10);
    if(typeof _abrirPost==='function'){G.voce.post=null;_abrirPost('mundial');}
    if(typeof _abrirEntrevista==='function')_abrirEntrevista('titulo');
  }else if(ed.vice===p.pais||ed.bronze===p.pais){
    const prata=ed.vice===p.pais;
    noticia(`${prata?'🥈':'🥉'} Medalha de ${prata?'prata':'bronze'} na World Cup ${cic.ano} com ${nome}.`,{c:'carreira',p:[p.id],imp:3});
    if(typeof ganharSeguidores==='function')ganharSeguidores(prata?0.1:0.06,prata?15000:8000,`Medalha na World Cup ${cic.ano}.`);
    if(typeof mexerImagem==='function')mexerImagem(prata?4:2.5);
  }
  if(ed.mvp===p.id){
    noticia(`⭐ Você foi eleito o MVP da World Cup ${cic.ano}.`,{c:'carreira',p:[p.id],imp:3});
    if(typeof ganharSeguidores==='function')ganharSeguidores(0.12,20000,`MVP da World Cup ${cic.ano}.`);
  }else if(ed.timeIdeal.includes(p.id)){
    noticia(`Você entrou no time ideal da World Cup ${cic.ano}.`,{c:'carreira',p:[p.id],imp:2});
    if(typeof ganharSeguidores==='function')ganharSeguidores(0.04,5000,'Time ideal da World Cup.');
  }
}

/* ---------- a próxima série sua pela seleção nesta semana ----------
   Roda o ciclo da Copa da semana até chegar numa série com você na
   convocação e ainda por jogar. Devolve {a, b, ctx} ou null. Tudo o que
   vem antes dela fica jogado (o relógio não joga de novo). */
function jogoDeSelecaoDoJogador(){
  const p=_eu();
  if(!p||!infoSelecao(p.pais))return null;
  return _rodarCopaAte({pais:p.pais,id:p.id});
}
/* roda o ciclo da semana até a série marcada (ou até o fim, devolvendo null) */
function _rodarCopaAte(alvo){
  if(typeof copaSemana!=='function')return null;
  if(G.ano<COPA_PRIMEIRA-1||(G.semana||1)<ELIM_SEM_SORTEIO-2)return null;
  G._copaPararEm=alvo;
  /* andando dia a dia pela janela, só o que é de hoje (ui: usarTurnos) */
  if((typeof usarDias==='function'&&usarDias())||(typeof usarTurnos==='function'&&usarTurnos()))G._copaHoje=G.turno||0;
  try{copaSemana();return null;}
  catch(e){if(e&&e.copaPendente)return e.copaPendente;throw e;}
  finally{G._copaPararEm=null;G._copaHoje=null;}
}
/* a próxima série sua nesta semana, como jogador ou como técnico da seleção */
function jogoDeSelecaoDoUsuario(){
  const j=jogoDeSelecaoDoJogador();
  if(j)return Object.assign(j,{papel:'jogador'});
  const pais=typeof selecaoDoTecnico==='function'?selecaoDoTecnico():null;
  if(!pais)return null;
  const t=_rodarCopaAte({pais,tecnico:true});
  return t?Object.assign(t,{papel:'tecnico'}):null;
}
