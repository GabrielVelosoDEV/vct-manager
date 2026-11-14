/* ============================================================
   MODO JOGADOR — A CARREIRA LONGA (J7)
   ------------------------------------------------------------
   PRÊMIOS     os do ano (MVP, seleção, revelação, IGL…) já contavam
               para o seu jogador (p.premios); aqui viram seguidores,
               imagem, manchete e um post para comemorar.
   CONVOCAÇÃO  Masters e Champions com o seu clube: no cinco, vira
               notícia e conta na carreira.
   LESÕES      curtas (pulso, mão, costas, tendinite), mais prováveis
               com cansaço e idade; o fisioterapeuta pessoal corta o
               risco pela metade e acelera a volta.
   IDADE       o declínio já mora em desenvolver (clock.js); aqui o
               corpo avisa (33+, longe do pico) e, no limite, decide:
               40 anos, ou 35+ com 12 pontos abaixo do próprio pico.
   APOSENTAR   quando você quiser (ou quando o corpo decidir). O
               jogador sai do mundo como qualquer aposentado (Hall da
               Fama se tiver pontos), e o seu legado fica em
               G.voce.aposentado. Dali, duas portas: virar técnico no
               mesmo save (clubes por onde passou chamam primeiro, e a
               reputação de jogador vira nível de coach e confiança da
               diretoria) ou encerrar a história.
   ============================================================ */

const LESOES_CURTAS=[
  {id:'pulso',nome:'lesão no pulso',sem:[1,3]},
  {id:'mao',nome:'dor na mão',sem:[1,2]},
  {id:'costas',nome:'dor nas costas',sem:[2,4]},
  {id:'tendinite',nome:'tendinite',sem:[2,5],idade:27}
];
function _sorteLeg(salt){return typeof _sorteRel==='function'?_sorteRel('l|'+salt):0.5;}
function _sAbsL(){return typeof semAbs==='function'?semAbs():(G.ano||0)*SEMANAS_ANO+(G.semana||1);}

/* ---------- a semana do legado ---------- */
function legadoSemana(p,t,rel){
  if(!G.voce||!p)return;
  /* clubes por onde passou (os contatos para depois) */
  if(!G.voce.clubes)G.voce.clubes=[];
  if(t&&!G.voce.clubes.includes(t.id))G.voce.clubes.push(t.id);
  if(typeof seguidores==='function')G.voce.segPico=Math.max(G.voce.segPico||0,seguidores());
  /* prêmios novos */
  const pr=p.premios||[];
  if(G.voce.premiosVistos==null)G.voce.premiosVistos=pr.length;
  for(let i=G.voce.premiosVistos;i<pr.length;i++){
    const x=pr[i];
    const peso=x.tipo==='mvp'?0.15:x.tipo==='selecao'?0.06:0.04;
    if(typeof ganharSeguidores==='function')ganharSeguidores(peso,5000,`Prêmio: ${x.rot||x.tipo}.`);
    if(typeof mexerImagem==='function')mexerImagem(3);
    if(typeof _abrirPost==='function')_abrirPost('premio');
    if(typeof mexerConf==='function')mexerConf(2,`Prêmio do ano: ${x.rot||x.tipo}.`);
  }
  G.voce.premiosVistos=pr.length;
  /* lesão curta: só em semana com jogo */
  const maps=rel&&rel.partidas?rel.partidas.maps:0;
  const fisio=typeof staffPessoal==='function'&&staffPessoal().fisio;
  if(p.lesao>0&&fisio&&_sorteLeg('fisio')<0.5)p.lesao=Math.max(0,p.lesao-1);
  if(maps&&!p.lesao){
    let risco=0.012+Math.max(0,p.fadiga-0.5)*0.05+Math.max(0,p.idade-28)*0.003;
    if(fisio)risco*=0.5;
    if(_sorteLeg('lesao')<risco){
      const pool=LESOES_CURTAS.filter(l=>!l.idade||p.idade>=l.idade);
      const l=pool[Math.floor(_sorteLeg('qual')*pool.length)];
      p.lesao=l.sem[0]+Math.floor(_sorteLeg('sem')*(l.sem[1]-l.sem[0]+1));
      G.voce.lesaoNome=l.nome;
      if(typeof noticia==='function')noticia(`🩹 ${p.nome} sente ${l.nome} e fica fora por ${p.lesao} semana${p.lesao>1?'s':''}.`,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:1});
    }
  }
  if(!p.lesao)G.voce.lesaoNome=null;
  /* o corpo avisa */
  const longe=(p.pico||over(p))-over(p);
  if(p.idade>=33&&longe>=8&&G.voce.avisoCorpo!==G.ano){
    G.voce.avisoCorpo=G.ano;
    if(typeof noticia==='function')noticia(`⌛ Aos ${p.idade} anos, ${p.nome} já está ${longe} pontos abaixo do auge. A aposentadoria entra no assunto.`,{c:'carreira',p:[p.id],imp:1});
  }
}
/* Masters e Champions: chamado no começo da semana, depois da escalação */
function chamadaInternacional(p,t){
  if(!G.voce||!p||!t)return;
  const c=typeof compromissoDaSemana==='function'?compromissoDaSemana():null;
  if(!c||!c.stage||!/masters|champions|lock|internacional/i.test(c.stage.nome||''))return;
  if(G.voce.convocado===c.stage.id)return;
  G.voce.convocado=c.stage.id;
  const tit=(t.titulares||[]).includes(p.id);
  if(!G.voce.intl)G.voce.intl=[];
  G.voce.intl.push({ano:G.ano,nome:c.stage.nome,clube:t.nome,titular:tit});
  if(typeof noticia==='function')noticia(tit?`🌍 ${p.nome} vai ao ${c.stage.nome} no cinco do ${t.nome}.`:`🌍 ${p.nome} viaja com o ${t.nome} para o ${c.stage.nome}, no banco.`,{c:'carreira',p:[p.id],t:[t.id],imp:tit?2:1});
  if(tit&&typeof ganharSeguidores==='function')ganharSeguidores(0.03,2000,`Convocado para o ${c.stage.nome}.`);
}

/* ---------- conquistas e recordes ---------- */
function conquistasJogador(p){
  p=p||meuJogador();if(!p)return null;
  const c=p.carreira||{}, hist=(p.hist||[]).slice();
  if(p.temp&&p.temp.maps)hist.push({ano:G.ano,time:p.timeId&&G.times[p.timeId]?G.times[p.timeId].nome:'Sem clube',over:over(p),...p.temp,atual:true});
  const comMapas=hist.filter(h=>h.maps>=8);
  const melhor=(f)=>comMapas.slice().sort((a,b)=>f(b)-f(a))[0]||null;
  const acs=melhor(h=>h.acs/h.maps), kills=melhor(h=>h.k||0);
  return{titulos:c.titulos||0,intl:c.intl||0,mvpTorneios:c.mvpTorneios||0,premios:(p.premios||[]).slice(),
    convocacoes:(G.voce&&G.voce.intl)||[],
    recordes:[
      acs?{rot:'Melhor ACS numa temporada',v:Math.round(acs.acs/acs.maps),ano:acs.ano}:null,
      kills?{rot:'Mais abates numa temporada',v:kills.k,ano:kills.ano}:null,
      {rot:'Melhor over',v:Math.round(p.pico||over(p))},
      G.voce&&G.voce.segPico?{rot:'Pico de seguidores',v:typeof fmtSeg==='function'?fmtSeg(G.voce.segPico):G.voce.segPico}:null
    ].filter(Boolean),
    carreira:typeof resumoCarreira==='function'?resumoCarreira(p):null,
    lenda:typeof pontosDeLenda==='function'?Math.round(pontosDeLenda(p)*10)/10:0};
}

/* ---------- a idade decide ---------- */
function corpoDecide(p){
  if(!p||!p.voce)return false;
  const longe=(p.pico||over(p))-over(p);
  return p.idade>=40||(p.idade>=35&&longe>=12);
}
/* ---------- aposentadoria ----------
   jaRegistrou: a virada de temporada já gravou a temporada no histórico */
function aposentarJogador(motivo,jaRegistrou){
  const p=meuJogador();
  if(!p)return{ok:false,motivo:'Sem jogador.'};
  const t=p.timeId?G.times[p.timeId]:null;
  if(!jaRegistrou&&p.temp&&p.temp.maps){
    p.hist.push({ano:G.ano,time:t?t.nome:'Sem clube',over:over(p),...p.temp});
  }
  if(t){if(!G.voce.clubes)G.voce.clubes=[];if(!G.voce.clubes.includes(t.id))G.voce.clubes.push(t.id);}
  const conq=conquistasJogador(p);
  const lenda=typeof talvezHallDaFama==='function'?talvezHallDaFama(p):null;
  const L={nome:p.nome,nomeReal:p.nomeReal||null,foto:p.foto||null,pais:p.pais,genero:p.genero||'m',role:p.role,idade:p.idade,
    pico:Math.round(p.pico||over(p)),over:over(p),motivo:motivo||'escolha',ano:G.ano,semana:G.semana,desde:G.voce.desde,
    clubes:(G.voce.clubes||[]).filter(id=>G.times[id]),ultimoClube:t?t.id:null,
    hist:(p.hist||[]).map(h=>({ano:h.ano,time:h.time,over:h.over,maps:h.maps||0,k:h.k||0,d:h.d||0,acs:h.acs||0,mvp:h.mvp||0})),
    conquistas:conq,hall:!!lenda,pontos:conq?conq.lenda:0,
    seguidores:typeof seguidores==='function'?seguidores():0,caixa:typeof caixaJogador==='function'?caixaJogador():0,
    carta:typeof cartaJogador==='function'?null:null};
  if(typeof noticia==='function')noticia(motivo==='corpo'
    ?`👋 Aos ${p.idade} anos, ${p.nome} pendura o mouse: o corpo não acompanha mais.`
    :`👋 ${p.nome} anuncia a aposentadoria aos ${p.idade} anos.`,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:3});
  /* sai do mundo como qualquer aposentado */
  if(t){t.elenco=t.elenco.filter(x=>x!==p.id);t.titulares=t.titulares.filter(x=>x!==p.id);
    if(typeof esquecerDuplas==='function')esquecerDuplas(t,p.id);if(typeof autoEscalar==='function')autoEscalar(t);}
  G.livres=(G.livres||[]).filter(x=>x!==p.id);
  if(typeof esquecerJogador==='function')esquecerJogador(p.id);
  delete G.jogadores[p.id];
  G.voce.aposentado=L;
  G.voce.propostas=[];G.voce.ofertasPatroc=[];G.voce.patroc=[];G.voce.post=null;G.voce.entrevista=null;G.voce.eventos=[];
  return{ok:true,legado:L};
}
function aposentado(){return !!(G&&G.voce&&G.voce.aposentado);}

/* ---------- virar técnico ---------- */
function ofertasDeTecnicoExJogador(){
  const L=G.voce&&G.voce.aposentado;if(!L)return[];
  const teto=Math.min(99,48+L.pontos*2.5+Math.max(0,L.pico-80)*1.2);
  const ex=L.clubes.map(id=>G.times[id]).filter(Boolean);
  const outros=Object.values(G.times).filter(t=>!L.clubes.includes(t.id)&&t.prestigio<=teto)
    .sort((a,b)=>b.prestigio-a.prestigio).slice(0,6);
  const lista=[...ex.map(t=>({t,casa:true})),...outros.map(t=>({t,casa:false}))].slice(0,8);
  if(lista.length<3)Object.values(G.times).sort((a,b)=>a.prestigio-b.prestigio).slice(0,3).forEach(t=>{if(!lista.some(x=>x.t===t))lista.push({t,casa:false});});
  return lista;
}
/* bônus de reputação: o nome de jogador vira nível de coach e paciência da diretoria */
function reputacaoExJogador(L){return Math.max(0,Math.min(12,Math.round(L.pontos*0.6+Math.max(0,L.pico-82)*0.4)));}
const ESTILO_COACH_POR_FUNCAO={Duelista:'tecnico',Iniciador:'estrategista',Controlador:'estrategista',Sentinela:'estrategista',Flex:'tecnico'};
function virarTecnico(clubeId){
  const L=G.voce&&G.voce.aposentado;
  const t=G.times[clubeId];
  if(!L||!t)return{ok:false,motivo:'Clube não encontrado.'};
  const rep=reputacaoExJogador(L);
  const nome=L.nomeReal||L.nome;
  const estilo=typeof ESTILOS_TREINADOR!=='undefined'&&ESTILOS_TREINADOR.some(e=>e.id===ESTILO_COACH_POR_FUNCAO[L.role])?ESTILO_COACH_POR_FUNCAO[L.role]:undefined;
  criarManager(nome,'treinador',{pais:L.pais,idade:L.idade,genero:L.genero,foto:L.foto,modo:'carreira',estilo});
  G.manager.exJogador={nome:L.nome,pico:L.pico,ano:L.ano,pontos:L.pontos,hall:L.hall,clubes:L.clubes.slice(),
    titulos:L.conquistas?L.conquistas.titulos:0,premios:L.conquistas?L.conquistas.premios.length:0};
  G.exJogador=L;
  const dif=G.voce.dificuldade;
  G.voce=null;
  if(dif&&!G.dificuldade)G.dificuldade=dif;
  const r=assumirClube(clubeId);
  if(!r.ok)return r;
  /* reputação de jogador: coach acima do comum da divisão, diretoria mais paciente */
  const m=typeof membroManager==='function'?membroManager():null;
  if(m&&typeof aplicarOverStaff==='function'){
    const alvo=Math.min(95,overStaff(m)+rep);
    aplicarOverStaff(m,alvo);m.pot=Math.max(m.pot,Math.min(99,alvo+4));
  }
  G.manager.confianca=Math.min(95,G.manager.confianca+rep);
  const casa=L.clubes.includes(clubeId);
  if(typeof noticia==='function')noticia(`🎓 ${L.nome} troca o mouse pela prancheta: ${casa?'volta ao':'assume o'} ${t.nome} como head coach.`,{c:'carreira',t:[t.id],imp:3});
  return{ok:true,msg:`Você é o head coach do ${t.nome}.`};
}
