/* ============================================================
   A TORCIDA FALA
   ------------------------------------------------------------
   Cada clube tem um humor de torcida (0 a 100), uma aprovação do
   head coach e uma nota de cada jogador na boca do torcedor. As
   três mudam a cada série, pelo resultado CONTRA O ESPERADO: ganhar
   de quem devia ganhar mexe pouco, perder para quem não devia mexe
   muito. Torcida fanática (data/torcidas.js) oscila mais.

   Do seu clube, cada série vira duas conversas: a de antes do jogo
   e a de depois. O texto não é guardado — só o contexto. As frases
   saem de um sorteio estável a partir dele, então redesenhar a
   tela mostra sempre os mesmos comentários e nada aqui toca no
   gerador do motor.

   Os torcedores são genéricos e falam como torcedor fala: elogiam,
   cobram, pedem cabeça e xingam. O xingamento é sobre o jogo
   (desempenho, escolha, atitude em quadra) — nunca sobre a pessoa.
   O palavrão pode ser censurado nas Configurações.
   ============================================================ */

const TORCIDA_FEED_MAX=60;
const HUMOR_NEUTRO=55;

function dadosTorcida(t){
  return (t&&typeof TORCIDAS!=='undefined'&&TORCIDAS[t.tag])||null;
}
function porteTorcida(t){
  const d=dadosTorcida(t);
  if(d&&d.porte)return d.porte;
  return t&&(t.tierInicial||t.tier)===1?3:1;
}
/* 0 a 1. Sem dado, cresce com o tamanho atual da torcida. */
function fanatismoDe(t){
  const d=dadosTorcida(t);
  if(d&&typeof d.fanatismo==='number')return d.fanatismo;
  return clamp(0.45+((t&&t.torcida)||30)/250,0.4,0.75);
}
function fasNova(){return{humor:HUMOR_NEUTRO,tecnico:55,jog:{},seq:0,ult:[]};}
/* cria o estado: só o motor chama (depois de uma série) */
function fasDe(t){
  if(!t)return null;
  if(!t.fas)t.fas=fasNova();
  return t.fas;
}
/* leitura: a tela pergunta sem criar nada — render não muda o save */
function fasLer(t){return (t&&t.fas)||fasNova();}

/* ---------- o que a torcida esperava ----------
   Over médio de quem jogou, dos dois lados. Dez pontos de diferença
   valem 90% de favoritismo — a mesma régua que o torcedor usa de cabeça. */
function overMedioDe(ids){
  const ps=ids.map(id=>G.jogadores[id]).filter(Boolean);
  return ps.length?ps.reduce((s,p)=>s+over(p),0)/ps.length:70;
}
function expectativaTorcida(ovEu,ovEle){
  return 1/(1+Math.pow(10,(ovEle-ovEu)/10));
}
/* Nota de um jogador na série, de −1 a 1, relativa aos companheiros. */
function notaNaSerie(st,mediaAcs){
  if(!st||!st.maps)return 0;
  const acs=st.acsSoma/Math.max(1,st.maps);
  const kd=(st.k-st.d)/Math.max(1,st.maps);
  return clamp((acs-mediaAcs)/120+kd/20+(st.cl||0)*0.03,-1,1);
}

/* ---------- depois de cada série (todos os clubes) ----------
   Chamado em fecharSerie. Sem sorteio. */
function torcidaPosSerie(res,decisiva){
  if(!res||!G||!G.times)return;
  const A=G.times[res.aId],B=G.times[res.bId];
  if(!A||!B)return;
  const idsDe=t=>Object.keys(res.agg||{}).filter(id=>G.jogadores[id]&&G.jogadores[id].timeId===t.id);
  const ovA=overMedioDe(idsDe(A)),ovB=overMedioDe(idsDe(B));
  for(const[t,adv,ovEu,ovEle,wEu,wEle]of[[A,B,ovA,ovB,res.wa,res.wb],[B,A,ovB,ovA,res.wb,res.wa]]){
    const f=fasDe(t);
    const fan=fanatismoDe(t);
    const ganhou=res.vencedor===t.id;
    const esp=expectativaTorcida(ovEu,ovEle);
    const peso=(decisiva?1.5:1)*(res.bo>=5?1.2:1);
    const amp=0.6+fan*0.8;
    const surpresa=(ganhou?1:0)-esp;
    const antes={humor:f.humor,tecnico:f.tecnico,seq:f.seq};
    /* atropelo e virada contam: 2–0 vale mais que 2–1 */
    const margem=(wEu-wEle)/Math.max(1,Math.max(wEu,wEle));
    f.humor=clamp(f.humor+(surpresa*12+margem*4)*peso*amp,0,100);
    f.humor+=(HUMOR_NEUTRO-f.humor)*0.05;
    /* o técnico leva a culpa mais devagar, mas leva: sequência ruim pesa */
    f.tecnico=clamp(f.tecnico+(surpresa*9+margem*2)*peso*amp+(f.seq<=-3&&!ganhou?-3*amp:0),0,100);
    f.tecnico+=(55-f.tecnico)*0.03;
    f.seq=ganhou?Math.max(1,f.seq+1):Math.min(-1,f.seq-1);
    f.ult=[ganhou?'V':'D',...(f.ult||[])].slice(0,8);
    /* jogadores: média móvel do que fizeram em quadra */
    const ids=idsDe(t);
    const media=ids.reduce((s,id)=>{const st=res.agg[id];return s+(st.acsSoma/Math.max(1,st.maps));},0)/Math.max(1,ids.length);
    const notas={};
    for(const id of ids){
      const n=notaNaSerie(res.agg[id],media)+(id===res.mvp?0.25:0);
      notas[id]=n;
      const v=f.jog[id]||0;
      /* memória curta, mas não de peixe: cinco ou seis séries fazem um
         ídolo ou um #Fora. A vitória perdoa um pouco; a derrota cobra. */
      /* na vitória a torcida perdoa: o pior em quadra de um time que ganhou
         perde bem menos do que o pior de um time que perdeu */
      f.jog[id]=clamp(v*0.8+n*(ganhou&&n<0?0.16:0.32)+(ganhou?0.03:-0.05)*amp,-1,1);
    }
    /* quem saiu do clube sai da boca da torcida */
    for(const id in f.jog)if(!(t.elenco||[]).includes(id))delete f.jog[id];
    if(t.id===G.meuTime)registrarConversa(t,adv,res,{esp,ganhou,wEu,wEle,notas,antes,decisiva});
  }
}

/* Para a tela: o feed guarda só contexto, e o texto nasce na hora. */
function registrarConversa(t,adv,res,x){
  if(!G.torcidaFeed)G.torcidaFeed=[];
  const f=fasDe(t);
  const ids=Object.keys(x.notas);
  const ord=ids.slice().sort((a,b)=>x.notas[b]-x.notas[a]);
  /* o mapa que mais doeu e o que mais encheu de orgulho */
  let pior=null,melhor=null;
  for(const m of res.mapas||[]){
    const eu=res.aId===t.id?m.sa:m.sb,ele=res.aId===t.id?m.sb:m.sa;
    const d=eu-ele;
    if(!pior||d<pior.d)pior={mapa:m.mapa,d};
    if(!melhor||d>melhor.d)melhor={mapa:m.mapa,d};
  }
  const base={t:t.id,adv:adv.id,ano:G.ano,s:G.semana,evento:(res.ctx&&res.ctx.nome)||'',bo:res.bo,
    esp:Math.round(x.esp*100)/100,decisiva:!!x.decisiva};
  const id=(G.ano||0)+'-'+(G.semana||0)+'-'+adv.tag+'-'+((G.torcidaFeed.length||0)%97);
  const pos=Object.assign({},base,{id:id+'-pos',fase:'pos',venceu:x.ganhou,eu:x.wEu,ele:x.wEle,
    humor:Math.round(f.humor),humorAntes:Math.round(x.antes.humor),tecnico:Math.round(f.tecnico),seq:f.seq,
    melhor:ord[0]||null,pior:ord[ord.length-1]||null,mvp:res.mvp&&ids.includes(res.mvp)?res.mvp:null,
    mapaPior:pior&&pior.d<0?pior.mapa:null,mapaMelhor:melhor&&melhor.d>0?melhor.mapa:null});
  const pre=Object.assign({},base,{id:id+'-pre',fase:'pre',humor:Math.round(x.antes.humor),
    tecnico:Math.round(x.antes.tecnico),seq:x.antes.seq});
  G.torcidaFeed.unshift(pos,pre);
  if(G.torcidaFeed.length>TORCIDA_FEED_MAX)G.torcidaFeed.length=TORCIDA_FEED_MAX;
}

/* ---------- o clima agora (pura) ---------- */
function climaTorcida(t){
  const f=fasLer(t);
  const h=f.humor;
  const rot=h>=78?'Em êxtase':h>=63?'Confiante':h>=47?'Dividida':h>=32?'Impaciente':h>=18?'Revoltada':'Em guerra com o clube';
  const tec=f.tecnico;
  const rotTec=tec>=72?'Ídolo':tec>=56?'Bancado':tec>=40?'Contestado':tec>=25?'Pressionado':'#Fora';
  return{humor:Math.round(h),rotulo:rot,tecnico:Math.round(tec),rotuloTecnico:rotTec,seq:f.seq,ult:f.ult||[]};
}
/* Aprovação de cada jogador do elenco, de −100 a 100, e o que pedem dele. */
function aprovacaoJogadores(t){
  const f=fasLer(t);
  return (t.elenco||[]).map(id=>G.jogadores[id]).filter(Boolean).map(p=>{
    const v=Math.round((f.jog[p.id]||0)*100);
    const titular=(t.titulares||[]).includes(p.id);
    let pedido=null;
    if(v<=-35&&titular)pedido='fora';
    else if(v>=40&&(p.contrato||0)<=1)pedido='renova';
    else if(!titular&&over(p)>=menorOverTitular(t)-1)pedido='titular';
    else if(v>=45)pedido='idolo';
    return{p,v,titular,pedido};
  }).sort((a,b)=>b.v-a.v);
}
function menorOverTitular(t){
  const ps=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  return ps.length?Math.min(...ps.map(p=>over(p))):0;
}
/* O que a torcida está pedindo, em ordem de barulho. */
function pedidosTorcida(t){
  const f=fasLer(t);const out=[];
  const coach=membroDe(t,'tecnico');
  for(const a of aprovacaoJogadores(t)){
    if(a.pedido==='fora')out.push({tipo:'fora',p:a.p,txt:'#Fora'+semEspaco(a.p.nome),peso:-a.v});
    if(a.pedido==='renova')out.push({tipo:'renova',p:a.p,txt:'Renova com '+a.p.nome,peso:a.v*0.7});
    if(a.pedido==='titular')out.push({tipo:'titular',p:a.p,txt:'Põe o '+a.p.nome+' de titular',peso:30});
  }
  if(f.tecnico<32&&coach)out.push({tipo:'tecnico',txt:'#Fora'+semEspaco(coach.nome),peso:80-f.tecnico});
  if(f.humor<42){
    const alvo=alvoDaTorcida(t);
    if(alvo)out.push({tipo:'contrata',p:alvo,txt:'Traz o '+alvo.nome,peso:45-f.humor});
    else out.push({tipo:'contrata',txt:'Contrata alguém',peso:40-f.humor});
  }
  const mp=mapaQueDoi(t);
  if(mp&&f.humor<60)out.push({tipo:'mapa',txt:'Treina '+mp,peso:25});
  return out.sort((a,b)=>b.peso-a.peso).slice(0,6);
}
function semEspaco(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]/g,'');}
/* O mapa das últimas conversas que mais apanhou. */
function mapaQueDoi(t){
  const c={};
  for(const e of (G.torcidaFeed||[]).slice(0,16))if(e.t===t.id&&e.fase==='pos'&&e.mapaPior)c[e.mapaPior]=(c[e.mapaPior]||0)+1;
  const o=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  return o.length&&o[0][1]>=2?o[0][0]:null;
}
/* Quem a torcida quer no clube: o melhor sem contrato, senão um craque do
   mesmo país que joga em outro lugar. Pura e estável na semana. */
function alvoDaTorcida(t){
  const pais=typeof paisDoClube==='function'?paisDoClube(t):null;
  const livres=(G.livres||[]).map(id=>G.jogadores[id]).filter(p=>p&&over(p)>=menorOverTitular(t));
  if(livres.length)return livres.sort((a,b)=>over(b)-over(a)||(a.id<b.id?-1:1))[0];
  if(!pais)return null;
  const fora=Object.values(G.jogadores).filter(p=>p&&p.pais===pais&&p.timeId&&p.timeId!==t.id
    &&!p.aposentado&&over(p)>=menorOverTitular(t)+2);
  return fora.sort((a,b)=>over(b)-over(a)||(a.id<b.id?-1:1))[0]||null;
}

/* ============================================================
   AS FRASES
   ------------------------------------------------------------
   [nível, texto]. Nível 0 é o torcedor tranquilo, 1 o irritado,
   2 o que xinga. Quanto mais fanática a torcida e pior o humor,
   mais o nível 2 aparece. Marcadores: {tag} seu clube, {adv} o
   adversário, {p} jogador, {coach} head coach, {mapa}, {alvo}
   quem pedem para contratar, {res} reserva, {placar}, {n}.
   ============================================================ */
const FRASES_TORCIDA={
  vitoria:[[0,'VAMOOO {tag}!!! Que time, que time'],[0,'{placar} e com autoridade. Esse é o {tag} que eu conheço'],
    [0,'Ganhou e jogou bonito. Sigam assim'],[0,'Mais uma! O {tag} tá voando'],[0,'Que alívio, que alegria. Obrigado, rapaziada'],
    [1,'ESSE É O {tag} PORRA'],[1,'Chupa {adv}, freguês demais'],[1,'Podem falar o que quiserem, hoje o {tag} amassou'],
    [2,'Atropelo do caralho, {adv} nem viu a cor da bola'],[0,'Torcida tá on, rumo ao título 🏆']],
  zebra:[[0,'NINGUÉM ACREDITAVA E A GENTE GANHOU'],[0,'Ganhar do {adv} assim? Tô sem palavras'],[1,'Cadê os analistas que davam o {adv} favorito? kkkkkk'],
    [1,'Engole essa, {adv}!!!'],[2,'Que resultado do caralho, chorei aqui'],[0,'Jogo pra contar pros netos']],
  vitoriaSemBrilho:[[0,'Ganhou, mas que sofrimento. Precisa melhorar muito'],[0,'Ganhou e só. Esse time não convence ninguém'],
    [1,'Vitória contra o {adv} não é mais que obrigação'],[1,'Ganhamos apesar do {coach}, não por causa dele'],
    [2,'Ganhou jogando um lixo, não me iludo']],
  derrota:[[0,'Dia ruim. Bola pra frente'],[0,'Faltou pouco, mas faltou. Cabeça erguida'],[0,'Perdemos pro {adv}. Tem que rever muita coisa'],
    [1,'Que jogo horroroso, meu Deus'],[1,'Essa comp tá fazendo o quê, {coach}?'],[1,'Toda semana a mesma história'],
    [2,'Que vergonha, porra. Time sem alma'],[2,'Jogaram de olho fechado? Puta que pariu'],[2,'Desliguei no segundo mapa, não aguento mais essa merda']],
  vexame:[[1,'Perder pro {adv}?? PERDER PRO {adv}???'],[1,'Vexame histórico. Quero explicação'],[1,'Elenco caro desses perdendo pro {adv}, é piada'],
    [2,'Vergonha, vergonha, vergonha. Time de pijama'],[2,'Que merda foi essa, {tag}? Pede pra sair, porra'],[2,'Pipocaram de novo. Bando de mercenário'],
    [0,'Inaceitável. Alguém precisa assumir isso']],
  derrotaHonrosa:[[0,'Perdeu pro {adv}, mas brigou até o fim. Orgulho'],[0,'{placar} contra um time desses não é vergonha nenhuma'],
    [0,'Deu pra ver evolução. Tamo junto'],[1,'Faltou detalhe. Mas esse time tem futuro']],
  craque:[[0,'{p} jogou MUITO hoje'],[0,'{p} carregou nas costas, que monstro'],[0,'Coloca o {p} no all-star já'],
    [1,'{p} É MUITO DIFERENCIADO'],[2,'{p} tá jogando um absurdo, puta que pariu'],[0,'Renova com o {p} até 2040']],
  pior:[[0,'{p} não fez uma boa partida hoje'],[0,'Precisa cobrar o {p}, sumiu do jogo'],[1,'{p} jogando de olho fechado'],
    [1,'Cadê o {p}? Alguém viu?'],[2,'{p} é um bagre, tira esse cara do time'],[2,'{p} tá jogando um lixo faz semanas, porra'],
    [1,'Até minha vó acerta mais tiro que o {p}']],
  fora:[[1,'#Fora{P} já deu o que tinha que dar'],[1,'Chega de {p}. #Fora{P}'],[2,'#Fora{P} mercenário, só pensa no salário'],
    [0,'Com respeito, mas o ciclo do {p} acabou'],[2,'Se o {p} jogar o próximo, eu paro de assistir. #Fora{P}']],
  tecnicoBom:[[0,'{coach} tá fazendo um trabalho absurdo'],[0,'Que leitura de jogo do {coach}, respeita'],[0,'Bancamos o {coach} até o fim'],
    [1,'{coach} MITO']],
  tecnicoRuim:[[0,'Com todo respeito, o trabalho do {coach} não está rendendo'],[1,'{coach}, troca essa comp pelo amor de Deus'],
    [1,'O {coach} não sabe o que faz no veto'],[2,'#Fora{COACH} já, esse cara afundou o time'],[2,'{coach} é muito ruim, puta merda'],
    [1,'Pausa tática pra quê, {coach}? Pra conversar sobre o tempo?']],
  contrata:[[0,'Diretoria, traz o {alvo}. Precisamos de reforço'],[0,'Imagina o {alvo} nesse time...'],[1,'TRAZ O {alvo} PELO AMOR DE DEUS'],
    [1,'Vende quem precisar e traz o {alvo}'],[2,'Diretoria pão-dura do caralho, contrata o {alvo} logo']],
  contrataGenerico:[[0,'Precisa de reforço urgente'],[1,'Mercado aberto e a gente parado?'],[2,'Diretoria dormindo, porra. Contrata alguém!']],
  reserva:[[0,'Por que o {res} não joga?'],[0,'Dá uma chance pro {res}'],[1,'Põe o {res} e tira esse time que tá aí'],
    [2,'O {res} no banco e esse bagre jogando, só pode ser piada']],
  mapa:[[0,'Precisa treinar {mapa}, tá feio'],[0,'De novo apanhando em {mapa}'],[1,'Banam {mapa} pelo amor de Deus'],
    [2,'Esse time não sabe jogar {mapa}, que merda']],
  renova:[[0,'Renova com o {p} AGORA'],[0,'Não deixa o {p} sair de graça, diretoria'],[1,'Se o {p} sair eu rasgo minha camisa']],
  iglBom:[[0,'Calls do {p} hoje foram perfeitas'],[0,'{p} lendo o jogo como ninguém'],[1,'IGL DIFERENCIADO, {p} MONSTRO']],
  iglRuim:[[0,'O {p} precisa repensar as calls'],[1,'IGL perdido. {p} não sabe o que pede'],[2,'{p} chamando strat de olho fechado, que porra é essa']],
  seqBoa:[[0,'{n} vitórias seguidas, que fase'],[0,'Ninguém para o {tag}. {n} seguidas'],[1,'{n} SEGUIDAS, TREME LIGA']],
  seqRuim:[[0,'{n} derrotas seguidas. Preocupante'],[1,'{n} derrotas seguidas e ninguém fala nada?'],[2,'{n} seguidas, que fase de merda']],
  /* antes do jogo */
  preHype:[[0,'Bora {tag}! Hoje é dia'],[0,'Tô confiante, o time tá jogando muito'],[0,'Quem vai assistir comigo? 🔥'],
    [1,'O {adv} que se prepare'],[1,'{adv} vai sair daqui chorando'],[0,'Camisa vestida, live ligada. VAMO']],
  preMedo:[[0,'Tô com medo desse jogo...'],[0,'Do jeito que estamos, não sei não'],[1,'Se perder hoje, alguém tem que cair'],
    [1,'Só peço que não passem vergonha'],[2,'Vou assistir só pra passar raiva, aposto'],[0,'Jogo de seis pontos. Tem que ganhar']],
  preAdv:[[0,'O {adv} vem forte, cuidado'],[0,'{adv} é favorito, mas clássico é clássico'],[1,'{adv} é freguês, sempre foi'],
    [1,'Mete o pé no {adv} hoje']],
  preFavorito:[[0,'Obrigação ganhar do {adv}'],[0,'Tem que ser 2–0 hoje, nada menos'],[1,'Se perder pro {adv} é bom nem voltar']],
  prePedido:[[0,'Hoje tem que jogar o {res}'],[0,'Se o {p} começar jogando eu desligo'],[1,'Tira o {p} hoje pelo amor de Deus']]
};

/* Idioma do torcedor pelo país do clube: só para o selo de tradução. */
const LINGUA_DO_PAIS={BR:'pt',PT:'pt',US:'en',CA:'en',GB:'en',AU:'en',SG:'en',PH:'sea',ID:'sea',TH:'sea',VN:'sea',MY:'sea',IN:'in',
  ES:'es',MX:'es',AR:'es',CL:'es',CO:'es',PE:'es',UY:'es',FR:'fr',BE:'fr',DE:'de',AT:'de',TR:'tr',UA:'uk',RS:'uk',RU:'uk',KR:'ko',JP:'ja',CN:'zh',TW:'zh',HK:'zh'};
function linguaDaTorcida(t){
  const p=typeof paisDoClube==='function'?paisDoClube(t):null;
  return (p&&LINGUA_DO_PAIS[p])||({AMER:'en',EMEA:'en',PAC:'en',CN:'zh'}[t&&t.regiao])||'en';
}
const APELIDOS_TORCEDOR=['eterno','raiz','fiel','doente','sofredor','apaixonado','ultras','oficial','4ever','nacao','loucura','army','main','fan','diehard','do_pix','sem_sono','da_live','mlk','guerreiro'];

/* Um torcedor fictício estável por semente. */
function torcedor(t,sem,i){
  const lg=linguaDaTorcida(t);
  const N=NOMES_IMPRENSA[lg]||NOMES_IMPRENSA.en;
  const u=k=>sorteImp(sem+'|u'+i,k);
  const fem=u(1)<0.22;
  const pn=(fem?N.f:N.m)[Math.floor(u(2)*(fem?N.f:N.m).length)];
  const tag=String(t.tag||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const ap=APELIDOS_TORCEDOR[Math.floor(u(3)*APELIDOS_TORCEDOR.length)];
  const num=u(4)<0.5?String(Math.floor(u(5)*99)):'';
  const forma=Math.floor(u(6)*3);
  const arroba=(forma===0?tag+'_'+ap:forma===1?slugImp(pn).replace(/-/g,'')+'_'+tag:ap+tag)+num;
  return{nome:forma===1?pn:(ap.replace(/_/g,' ')+' '+t.tag).replace(/^./,c=>c.toUpperCase()),arroba:arroba.slice(0,18),
    lingua:lg};
}

function nomeCoach(t){const c=membroDe(t,'tecnico');return c?c.nome:'coach';}
function trocar(txt,v){
  return txt.replace(/\{(\w+)\}/g,(m,k)=>{
    if(k==='P')return semEspaco(v.p);
    if(k==='COACH')return semEspaco(v.coach);
    return v[k]!=null?v[k]:m;
  });
}

/* Os comentários de uma conversa. entrada = item de G.torcidaFeed ou o
   contexto do próximo jogo (comentariosPreJogo). Pura e estável. */
function comentariosTorcida(e,quantos){
  const t=G.times[e.t],adv=G.times[e.adv];
  if(!t)return [];
  const fan=fanatismoDe(t);
  const sem='torc|'+e.id;
  const u=k=>sorteImp(sem,k);
  const P=id=>id&&G.jogadores[id]?G.jogadores[id].nome:null;
  const coach=nomeCoach(t);
  const titulares=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  const reserva=(t.elenco||[]).filter(id=>!(t.titulares||[]).includes(id)).map(id=>G.jogadores[id]).filter(Boolean)
    .sort((a,b)=>over(b)-over(a))[0]||null;
  const f=fasLer(t);
  const odiado=titulares.slice().sort((a,b)=>(f.jog[a.id]||0)-(f.jog[b.id]||0))[0]||null;
  const igl=titulares.find(p=>p.igl)||null;
  const alvo=e.humor<45?alvoDaTorcida(t):null;
  const v={tag:t.tag,adv:adv?adv.tag:'adversário',coach,placar:e.eu!=null?e.eu+'–'+e.ele:'',
    res:reserva?reserva.nome:null,alvo:alvo?alvo.nome:null,mapa:e.mapaPior||null,n:Math.abs(e.seq||0)};
  /* o cardápio da conversa: [chave da lista, peso, jogador] */
  const menu=[];
  const h=e.humor;
  if(e.fase==='pos'){
    const zebra=e.venceu&&e.esp<0.38,vexame=!e.venceu&&e.esp>0.62,honra=!e.venceu&&e.esp<0.4&&e.eu>0;
    if(e.venceu){
      menu.push([zebra?'zebra':'vitoria',5]);
      if(h<45&&!zebra)menu.push(['vitoriaSemBrilho',2.5]);
    }else{
      menu.push([vexame?'vexame':honra?'derrotaHonrosa':'derrota',5]);
    }
    if(e.mvp||e.melhor)menu.push(['craque',e.venceu?3:1.5,e.mvp||e.melhor]);
    if(e.pior&&!e.venceu)menu.push(['pior',3,e.pior]);
    if(e.pior&&e.venceu&&h<50)menu.push(['pior',1,e.pior]);
    if(!e.venceu&&e.mapaPior)menu.push(['mapa',1.5]);
    if(igl){const a=f.jog[igl.id]||0;
      if(a>=0.15&&e.venceu)menu.push(['iglBom',0.9,igl.id]);
      else if(a<=-0.15&&!e.venceu)menu.push(['iglRuim',1.2,igl.id]);}
    if(e.seq>=3)menu.push(['seqBoa',2]);
    if(e.seq<=-3)menu.push(['seqRuim',2.5]);
  }else{
    menu.push([h>=58?'preHype':h<=42?'preMedo':(u(90)<0.5?'preHype':'preMedo'),5]);
    if(adv)menu.push([e.esp>0.62?'preFavorito':'preAdv',3]);
    if(reserva&&odiado&&(f.jog[odiado.id]||0)<-0.2)menu.push(['prePedido',2,odiado.id]);
  }
  /* o que vale nas duas: técnico, contratação, reserva, #Fora, renovação */
  if(e.tecnico<=38)menu.push(['tecnicoRuim',e.tecnico<25?3:1.8]);
  else if(e.tecnico>=70)menu.push(['tecnicoBom',1.2]);
  if(h<45)menu.push([alvo?'contrata':'contrataGenerico',1.5]);
  if(reserva&&h<50&&over(reserva)>=menorOverTitular(t)-2)menu.push(['reserva',1]);
  if(odiado&&(f.jog[odiado.id]||0)<=-0.35)menu.push(['fora',1.5,odiado.id]);
  const amado=titulares.find(p=>(f.jog[p.id]||0)>=0.4&&(p.contrato||0)<=1);
  if(amado)menu.push(['renova',1.2,amado.id]);

  /* nível de agressividade: torcida fanática e humor ruim xingam mais */
  const raiva=clamp((60-h)/50,0,1);
  const pNivel2=clamp(raiva*fan*1.1,0,0.85);
  const pNivel1=clamp(0.25+raiva*0.5+fan*0.15,0,0.9);
  const n=quantos||(e.fase==='pos'?5:4);
  const out=[],usadas=new Set();
  for(let i=0;i<n*3&&out.length<n;i++){
    const it=escolhePeso(menu.filter(m=>!usadas.has(m[0])||m[0]==='vitoria'||m[0]==='derrota'),m=>m[1],u(10+i));
    if(!it)break;
    const lista=FRASES_TORCIDA[it[0]];if(!lista)continue;
    /* o tom da frase: positivo não precisa de raiva para gritar */
    const positivo=/vitoria|zebra|craque|tecnicoBom|iglBom|renova|seqBoa|preHype|derrotaHonrosa/.test(it[0])&&!/SemBrilho/.test(it[0]);
    const r=u(40+i);
    const teto=positivo?(r<0.15+fan*0.35?2:1):(r<pNivel2?2:r<pNivel2+pNivel1?1:0);
    const ok=lista.filter(x=>x[0]<=teto);
    let pool=(ok.length?ok:lista).filter(x=>!out.some(o=>o.cru===x[1]));
    /* torcida em guerra não fala manso: abaixo de 22 o "bola pra frente" some */
    if(!positivo&&h<22&&pool.some(x=>x[0]>=1))pool=pool.filter(x=>x[0]>=1);
    if(!pool.length){usadas.add(it[0]);continue;}
    /* prefere o nível mais alto permitido: torcedor bravo não fala baixo */
    const alvoNivel=pool.filter(x=>x[0]===teto);
    const escolhida=(alvoNivel.length&&u(60+i)<0.6?alvoNivel:pool)[Math.floor(u(70+i)*(alvoNivel.length&&u(60+i)<0.6?alvoNivel:pool).length)];
    const pNome=it[2]?P(it[2]):null;
    if(/\{p\}|\{P\}/.test(escolhida[1])&&!pNome)continue;
    if(/\{res\}/.test(escolhida[1])&&!v.res)continue;
    if(/\{alvo\}/.test(escolhida[1])&&!v.alvo)continue;
    if(/\{mapa\}/.test(escolhida[1])&&!v.mapa)continue;
    if(/\{placar\}/.test(escolhida[1])&&!v.placar)continue;
    usadas.add(it[0]);
    const txt=trocar(escolhida[1],Object.assign({},v,{p:pNome}));
    const autor=torcedor(t,sem,i);
    const tamanho=(t.torcida||30)/40;
    const curtidas=Math.round((8+u(80+i)*90)*tamanho*(escolhida[0]===2?1.6:1)*(1+fan));
    out.push({autor,txt,cru:escolhida[1],nivel:escolhida[0],tom:positivo?1:escolhida[0]?-1:0,curtidas,chave:it[0]});
  }
  return out.sort((a,b)=>b.curtidas-a.curtidas);
}

/* A conversa de antes do PRÓXIMO jogo, montada na hora (pré-jogo e Central). */
function conversaPreJogo(t,adv,evento){
  if(!t||!adv)return null;
  const f=fasLer(t);
  const ovEu=overMedioDe(t.titulares||[]),ovEle=overMedioDe(adv.titulares||[]);
  return{id:(G.ano||0)+'-'+(G.semana||0)+'-'+adv.tag+'-prox',t:t.id,adv:adv.id,fase:'pre',ano:G.ano,s:G.semana,
    evento:evento||'',esp:Math.round(expectativaTorcida(ovEu,ovEle)*100)/100,
    humor:Math.round(f.humor),tecnico:Math.round(f.tecnico),seq:f.seq};
}

/* ---------- a torcida no tamanho e no prestígio ----------
   O porte entra na torcida inicial e, no Tier 1, um pouco no prestígio:
   jogador quer vestir a camisa do clube grande mesmo em ano ruim. */
function bonusTorcidaPorte(t){
  const p=porteTorcida(t);
  return (t.tierInicial||t.tier)===1?(p-3)*7:(p-1)*6;
}
function bonusPrestigioPorte(tag,tier){
  if(tier!==1||typeof TORCIDAS==='undefined'||!TORCIDAS[tag])return 0;
  return (TORCIDAS[tag].porte-3)*2.5;
}
