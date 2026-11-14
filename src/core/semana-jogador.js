/* ============================================================
   MODO JOGADOR — A SEMANA, O TREINO E A EVOLUÇÃO (J3)
   ------------------------------------------------------------
   A semana tem energia. Ela começa em até 100 (menos, se você
   chega cansado) e cada atividade gasta um pouco; o que sobra vira
   descanso no fechamento. Chegar ao jogo com pouca energia derruba
   o rendimento (condicao em match.js).

   Atividades:
     · treinos jogáveis na gameplay (range, duelo, deathmatch,
       retake): o XP sai de como você jogou; simular rende 60%
     · prática de utilidade, ranked, VOD do adversário, live e
       treino de agente: um clique
     · o treino do clube: o técnico marca; faltar derruba a forma,
       e a forma pesa na escalação

   O XP de cada atributo enche uma barra; cheia, o atributo sobe 1.
   A barra cresce com o atributo (60→61 é rápido, 90→91 é lento) e
   rende menos perto do potencial, com a idade e na dificuldade
   Difícil. As partidas também dão XP, pelo que você fez nelas.
   No seu jogador, isto substitui o treino que a IA do clube dava
   (desenvolver em clock.js); a queda da idade continua lá.

   Sem nada marcado na semana, o assistente faz uma semana padrão
   simulada (treino do clube, range e duelo): rende bem menos que
   jogar, e dá para desligar.
   ============================================================ */

const ENERGIA_MAX=100;
const SIMULADO_RENDE=0.6;
const XP_POR_MAPA=4;
const REPETIR_RENDE=0.6;
/* custo de um ponto: cresce com o atributo */
/* atributo bem abaixo do seu over custa como se estivesse a 8 dele: sem o piso,
   o XP escorria para o atributo que a função ignora (consistência de duelista
   subia 39 pontos num ano e o over quase não mexia) */
const XP_CUSTO=15;
function custoPonto(v,p){const piso=p?over(p)-8:0;return XP_CUSTO*Math.pow(1+Math.max(0,Math.max(v,piso)-55)/15,1.7);}
const XP_DIFICULDADE={facil:1.35,normal:1,dificil:.75};

const ATIV_JOGADOR=[
  {id:'coletivo',nome:'Treino do clube',grupo:'clube',energia:15,base:5,xp:{util:.35,visao:.35,consist:.3},unico:true,
   desc:'O técnico marcou. Faltar derruba a sua forma, e a forma pesa na escalação.'},
  {id:'range',nome:'Range de mira',grupo:'jogavel',modo:'range',energia:15,base:9,xp:{mira:.6,reflexo:.4},
   desc:'60 segundos de alvos aparecendo. Abates, precisão e cabeça.'},
  {id:'duelo',nome:'Duelo 1 contra 1',grupo:'jogavel',modo:'duelo',energia:20,base:10,xp:{mira:.5,consist:.5},
   desc:'Primeiro a 5, contra um bot do nível do próximo adversário.'},
  {id:'dm',nome:'Deathmatch',grupo:'jogavel',modo:'dm',energia:25,base:12,xp:{mira:.4,reflexo:.3,mov:.3},
   desc:'Todos contra todos, 2 minutos. Abates e K/D.'},
  {id:'retake',nome:'Retake',grupo:'jogavel',modo:'retake',energia:20,base:10,xp:{clutch:.55,visao:.45},
   desc:'Spike plantado no bomb e você na defesa: retome.'},
  {id:'utilidade',nome:'Prática de utilidade',grupo:'clique',energia:15,base:8,xp:{util:1},
   desc:'Lineups de smoke, flash e molly no mapa da semana.'},
  {id:'vod',nome:'Revisar VOD do adversário',grupo:'clique',energia:10,base:4,xp:{visao:1},unico:true,precisaJogo:true,
   desc:'Visão de jogo e um bônus de leitura na partida da semana.'},
  {id:'agente',nome:'Treinar um agente',grupo:'clique',energia:10,base:0,unico:true,
   desc:'Familiaridade com um agente do seu pool (ou um novo).'},
  {id:'ranked',nome:'Ranked',grupo:'clique',energia:15,base:4,xp:{mira:.5,reflexo:.5},
   desc:'Pouco XP, mas sobe a sua fama e o radar dos olheiros.'},
  {id:'live',nome:'Live',grupo:'clique',energia:15,base:0,
   desc:'Fãs e um dinheiro extra. Não treina nada.'}
];
function ativJogador(id){return ATIV_JOGADOR.find(a=>a.id===id);}

/* ---------- o estado da semana ---------- */
function energiaInicial(p){return Math.max(35,Math.min(ENERGIA_MAX,Math.round(ENERGIA_MAX-(p.fadiga||0)*60)));}
function _snapTemp(p){const s=p.temp||{};return{maps:s.maps||0,k:s.k||0,d:s.d||0,a:s.a||0,acs:s.acs||0,fk:s.fk||0,cl:s.cl||0};}
function semanaJogador(){
  if(!G.voce)return null;
  const p=meuJogador();if(!p)return null;
  const s=G.voce.sem;
  if(s&&s.ano===G.ano&&s.semana===G.semana)return s;
  const e=energiaInicial(p);
  G.voce.sem={ano:G.ano,semana:G.semana,ini:e,energia:e,feitas:[]};
  if(!G.voce.tempAntes)G.voce.tempAntes=_snapTemp(p);
  if(G.voce.auto==null)G.voce.auto=true;
  return G.voce.sem;
}
function vezesFeita(id){const s=semanaJogador();return s?s.feitas.filter(f=>f.id===id).length:0;}
function custoEnergia(a){return Math.max(1,Math.round(a.energia*(1-efeitosTalentos().en)));}
/* devolve null se dá para fazer, ou o motivo */
function porqueNaoAtividade(id){
  const a=ativJogador(id), s=semanaJogador(), p=meuJogador();
  if(!a||!s||!p)return 'Indisponível.';
  if(p.lesao)return 'Você está lesionado: a semana é de recuperação.';
  if(a.grupo==='clube'&&!clubeDoJogador())return 'Sem clube, sem treino coletivo.';
  if(a.unico&&vezesFeita(id))return 'Já feito nesta semana.';
  if(a.precisaJogo&&!adversarioDaSemana())return 'Sem jogo do seu clube nesta semana.';
  if(s.energia<custoEnergia(a))return 'Energia insuficiente.';
  return null;
}
/* o adversário do jogo do seu clube nesta semana (para VOD e para o duelo) */
function adversarioDaSemana(){
  const c=typeof compromissoDaSemana==='function'?compromissoDaSemana():null;
  return c?G.times[c.advId]:null;
}
function overMedioTime(t){
  const tit=((t&&t.titulares)||[]).map(i=>G.jogadores[i]).filter(Boolean);
  return tit.length?Math.round(tit.reduce((s,x)=>s+over(x),0)/tit.length):null;
}
/* o nível do bot do duelo: o próximo adversário; sem jogo, a sua liga */
function nivelDoRival(){
  const adv=adversarioDaSemana();
  if(adv)return{over:overMedioTime(adv),nome:adv.nome};
  const t=clubeDoJogador();
  return{over:t?Math.max(60,overMedioTime(t)-2):66,nome:t?'liga':'ranked'};
}

/* ---------- XP ---------- */
function fatorXP(p,k){
  const o=over(p), gap=(p.pot||o)-o;
  const pot=gap<=0?0.05:Math.max(0.08,Math.min(1,gap/8));
  const a=p.idade, idade=a<=19?1.25:a<=22?1.1:a<=25?1:a<=27?.85:a<=30?.65:.45;
  const dif=XP_DIFICULDADE[(G.voce&&G.voce.dificuldade)||'normal']||1;
  const tal=1+((efeitosTalentos().xp||{})[k]||0);
  return pot*idade*dif*tal;
}
/* aplica x de XP bruto no atributo k; devolve quantos pontos subiu */
function ganharXP(p,k,x){
  if(!p.xp)p.xp={};
  if(!(k in p.at)||x<=0)return 0;
  let subiu=0;
  /* o fator de potencial muda a cada ponto: vai aos pedaços */
  let resto=x;
  while(resto>0.0001){
    const pedaco=Math.min(resto,2);resto-=pedaco;
    p.xp[k]=(p.xp[k]||0)+pedaco*fatorXP(p,k);
    let guarda=0;
    while(p.at[k]<99&&p.xp[k]>=custoPonto(p.at[k],p)&&guarda++<20){p.xp[k]-=custoPonto(p.at[k],p);p.at[k]++;subiu++;}
    if(p.at[k]>=99)p.xp[k]=0;
  }
  return subiu;
}
function _aposEvoluir(p){
  if(typeof ajustarSecundaria==='function')ajustarSecundaria(p);
  p.pico=Math.max(p.pico||0,over(p));
  if(typeof valor==='function')p.valor=valor(p);
  if(typeof salario==='function')p.salarioJusto=salario(p,p.timeId&&G.times[p.timeId]);
}
/* espalha base*mult pelo mapa de pesos; devolve {xp:{k:x}, subiu:{k:n}} */
function distribuirXP(p,pesos,total){
  const r={xp:{},subiu:{}};
  for(const k in pesos){
    const x=total*pesos[k];
    r.xp[k]=(r.xp[k]||0)+x;
    const n=ganharXP(p,k,x);if(n)r.subiu[k]=(r.subiu[k]||0)+n;
  }
  _aposEvoluir(p);
  return r;
}

/* ---------- fazer uma atividade ----------
   res: {nota (0 a 1,5), simulado, alvo (agente), resumo} */
/* nota 0 (abandonou sem fazer nada) rende 30%, abaixo do simulado; nota 1 rende 105% */
function notaParaMult(nota){return Math.max(0.3,Math.min(1.4,0.3+nota*0.75));}
function fazerAtividade(id,res){
  const motivo=porqueNaoAtividade(id);
  if(motivo)return{ok:false,motivo};
  res=res||{simulado:true};
  const a=ativJogador(id), s=semanaJogador(), p=meuJogador();
  const n=vezesFeita(id);
  const gasto=custoEnergia(a);
  s.energia-=gasto;
  const mult=(res.simulado?SIMULADO_RENDE:notaParaMult(res.nota||0))*Math.pow(REPETIR_RENDE,n);
  const feito={id,gasto,simulado:!!res.simulado,nota:res.nota!=null?Math.round(res.nota*100)/100:null,mult:Math.round(mult*100)/100,resumo:res.resumo||null,xp:{},subiu:{}};
  if(a.base&&a.xp){const r=distribuirXP(p,a.xp,a.base*mult);feito.xp=r.xp;feito.subiu=r.subiu;}
  const ef=efeitosTalentos();
  if(id==='agente'){
    const ag=res.alvo||(p.agentes||[])[0];
    if(ag&&typeof treinarAgente==='function'){
      const ganho=treinarAgente(p,ag,(typeof AGENTE_POR_SEMANA!=='undefined'?AGENTE_POR_SEMANA:6)*0.8*(1+ef.fam));
      feito.alvo=ag;feito.fam=Math.round((ganho||0)*10)/10;
      if(!(p.agentes||[]).includes(ag)&&typeof nivelAgente==='function'&&nivelAgente(p,ag)>=40)(p.agentes=p.agentes||[]).push(ag);
    }
  }
  if(id==='vod'){const adv=adversarioDaSemana();G.voce.vod={adv:adv&&adv.id,ano:G.ano,semana:G.semana,forca:1+ef.vod};feito.adv=adv&&adv.nome;}
  if(id==='ranked'){G.voce.fama=(G.voce.fama||0)+1;G.voce.radar=(G.voce.radar||0)+(clubeDoJogador()?0.5:2);}
  if(id==='live'){
    const fas=Math.round(150+(G.voce.fama||0)*25+over(p)*4);
    G.voce.fas=(G.voce.fas||0)+fas;G.voce.caixa=(G.voce.caixa||0)+Math.round(fas*1.5);
    feito.fas=fas;
  }
  s.feitas.push(feito);
  return{ok:true,feito};
}
/* treino jogável: a nota sai do resumo da gameplay */
function notaDoTreino(modo,r){
  if(!r)return 0;
  const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  if(modo==='range')return cl(r.kills/18*0.6+r.precisao/40*0.25+r.hs/35*0.15,0,1.5);
  if(modo==='duelo'){const t=(r.eu||0)+(r.eles||0);return cl(t?(r.eu/t)*1.5:0,0,1.5);}
  if(modo==='dm'){const kd=r.kills/Math.max(1,r.mortes);return cl(0.2+r.kills/16*0.6+Math.min(2,kd)*0.3,0,1.5);}
  if(modo==='retake')return cl((r.venceu?1:0.35)+(r.kills||0)*0.15,0,1.5);
  return 0.6;
}

/* ---------- fechamento da semana ----------
   Chamado por desenvolver (clock.js) com o seu clube, ou pelo laço dos
   agentes livres. Aplica o XP das partidas, o treino do clube, o assistente
   e devolve o custo de fadiga da semana. */
function custoSemanaJogador(p){
  const s=G.voce&&G.voce.sem;
  if(!s||s.ano!==G.ano||s.semana!==G.semana)return -0.075;   /* semana em branco: descanso */
  const gasto=s.ini-s.energia;
  /* nada gasto: descanso (−0,075, como o descanso do manager); 80 gastos ≈ uma
     semana de treino do manager (+0,02); 100 gastos ≈ +0,045 */
  return -0.075+gasto/100*0.12;
}
function semanaAutomatica(p){
  const s=semanaJogador();
  if(!s||s.feitas.length||!G.voce.auto||p.lesao)return false;
  for(const id of ['coletivo','range','duelo','vod'])if(!porqueNaoAtividade(id))fazerAtividade(id,{simulado:true});
  s.automatica=true;
  return true;
}
function fecharSemanaJogador(p,t){
  if(!G.voce||!p||!p.voce)return null;
  semanaAutomatica(p);
  const s=semanaJogador();
  const rel={partidas:null,coletivo:null,auto:!!s.automatica,energia:s.energia,ini:s.ini};
  /* partidas da semana: XP pelo que você fez */
  /* o que entrou na temporada desde o último fechamento (virada de ano zera a
     temporada: aí conta tudo o que já está nela) */
  const ag=_snapTemp(p);
  let a=G.voce.tempAntes||ag;
  if(ag.maps<a.maps)a=_snapTemp({temp:{}});
  const maps=ag.maps-a.maps;
  G.voce.tempAntes=ag;
  if(maps>0){
    const k=ag.k-a.k, d=ag.d-a.d, as=ag.a-a.a, acs=(ag.acs-a.acs)/maps, cl=ag.cl-a.cl, fk=ag.fk-a.fk;
    const perf=Math.max(0.6,Math.min(1.4,acs/200));
    const pesos={mira:.5+k/maps*.03,reflexo:.3+fk/maps*.08,mov:.2,util:.3+as/maps*.03,visao:.4,clutch:.2+cl*.5/maps,consist:.3*(d/maps<16?1.2:.8)};
    const r=distribuirXP(p,pesos,maps*perf*XP_POR_MAPA);
    rel.partidas={maps,xp:r.xp,subiu:r.subiu};
    rel.partidasDiff={acs,k,d,cl};
  }
  /* treino do clube */
  if(t&&!p.lesao){
    const foi=s.feitas.some(f=>f.id==='coletivo');
    if(foi)p.forma=Math.max(.2,Math.min(1,p.forma+0.012+efeitosTalentos().forma));
    else{
      p.forma=Math.max(.2,Math.min(1,p.forma-0.04));
      G.voce.faltas=(G.voce.faltas||0)+1;
      if(typeof noticia==='function'&&G.voce.faltas%3===0)
        noticia(`${p.nome} faltou de novo ao treino do ${t.nome}; a comissão anotou.`,{c:'clube',p:[p.id],t:[t.id]});
    }
    rel.coletivo=foi;
  }
  /* titularidade e relações (core/relacoes.js) */
  if(typeof relacoesSemana==='function')relacoesSemana(p,t,rel);
  /* histórico curto das semanas (a tela mostra as últimas) */
  if(!G.voce.semanas)G.voce.semanas=[];
  G.voce.semanas.unshift({ano:s.ano,semana:s.semana,gasto:s.ini-s.energia,feitas:s.feitas.map(f=>f.id+(f.simulado?'*':'')),maps,auto:!!s.automatica});
  G.voce.semanas.length=Math.min(G.voce.semanas.length,12);
  G.voce.ultimaSemana=rel;
  return rel;
}

/* ---------- o efeito na partida ---------- */
/* energia baixa cobra no rendimento (multiplica condicao) */
function fatorEnergia(p){
  if(!p||!p.voce||!G.voce)return 1;
  const s=G.voce.sem;
  if(!s||s.ano!==G.ano||s.semana!==G.semana)return 1;
  return s.energia>=40?1:1-(40-s.energia)*0.002;
}
/* atributos do seu jogador no motor: talentos e o VOD do adversário */
function bonusDoJogadorNaPartida(p,at,adv){
  if(!p||!p.voce||!G.voce)return at;
  const ef=efeitosTalentos();
  for(const k in ef.a)if(k in at)at[k]=Math.min(99,at[k]+ef.a[k]);
  const v=G.voce.vod;
  if(v&&adv&&v.adv===adv.id&&v.ano===G.ano&&Math.abs(G.semana-v.semana)<=1){
    at.visao=Math.min(99,at.visao+Math.round(4*v.forca));
    at.util=Math.min(99,at.util+Math.round(2*v.forca));
  }
  return at;
}
/* o que vai no boneco do motor: vida por abate e ultimate */
function talentosDoBoneco(){
  const ef=efeitosTalentos();
  return ef.vida||ef.ult?{vida:ef.vida,ult:ef.ult}:null;
}
