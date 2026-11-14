/* ============================================================
   MODO JOGADOR — TITULARIDADE E RELAÇÕES (J4)
   ------------------------------------------------------------
   O técnico do seu clube (a IA) escala toda semana, no começo dela,
   pela conta de sempre (over na função e cobertura) MAIS três
   coisas que só pesam no clube do modo jogador:
     · condição: forma, cansaço, energia e cabeça de cada um
     · quem já é titular leva um pouco de vantagem (técnico não
       vira o time do avesso por um ponto)
     · a confiança dele em VOCÊ (0 a 100)
   A confiança sobe com treino do clube, bons treinos, boas partidas
   e conversa certa; cai com falta, jogo ruim, chegar morto ao jogo
   e briga. Uma barra mostra a chance de você estar no cinco da
   próxima escalação e o que pesa nela.

   Relações com os colegas são as duplas do vestiário (t.duplas):
   a mesma régua de entrosamento que o motor lê. Apoiar, cobrar e
   jogar ranked junto mexem nelas. Conflitos aparecem sozinhos:
   o rival pela sua vaga provoca; depois de derrota, alguém cobra.

   Os sorteios daqui são feitos de (ano, semana, assunto), e não do
   gerador do mundo: conversar não muda o resultado das partidas.
   ============================================================ */

const CONF_TECNICO_INICIO={ranked:50,tier2:50,banco:45,titular:68,lenda:82};
const AJ_ATUAL=1.0;          /* vantagem de quem já é titular, em pontos de over */
const AJ_CONDICAO=25;        /* condição 0,9 → −2,5 pontos */
const AJ_CONFIANCA=5;        /* (confiança − 50)/5 → ±10 pontos; abaixo de 30, a geladeira cobra mais */
const AJ_CHANCE=7;
const AJ_CLAUSULA=5;         /* cláusula de titular no contrato (core/carreira-mercado.js) */           /* "vou te dar uma chance": duas semanas de vantagem */

function _sorteRel(salt){
  let h=2166136261;
  for(const c of String(G.ano)+'|'+G.semana+'|'+salt+'|'+((G.voce&&G.voce.id)||''))h=Math.imul(h^c.charCodeAt(0),16777619);
  return ((h>>>0)%100000)/100000;
}
function semAbs(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}

/* ---------- confiança do técnico ---------- */
function confTecnico(){
  if(!G.voce)return 50;
  if(G.voce.confTec==null)G.voce.confTec=CONF_TECNICO_INICIO[G.voce.inicio]!=null?CONF_TECNICO_INICIO[G.voce.inicio]:50;
  return G.voce.confTec;
}
function mexerConf(d,txt){
  if(!G.voce||!d)return;
  const antes=confTecnico();
  G.voce.confTec=Math.max(0,Math.min(100,Math.round((antes+d)*10)/10));
  if(txt){
    if(!G.voce.relLog)G.voce.relLog=[];
    G.voce.relLog.unshift({ano:G.ano,semana:G.semana,d:Math.round(d*10)/10,txt});
    G.voce.relLog.length=Math.min(G.voce.relLog.length,14);
  }
}
function _pesoConf(c){return (c-50)/AJ_CONFIANCA-(c<30?(30-c)/3:0);}
function rotuloConf(c){return c>=80?'Intocável':c>=65?'Confia em você':c>=50?'Neutro':c>=35?'Desconfiado':'Na geladeira';}

/* ---------- a escalação do clube do jogador ---------- */
function ajusteDoTecnico(t){
  const atuais=new Set(t.titulares||[]);
  const chance=G.voce&&G.voce.chance&&G.voce.chance.ate>=semAbs();
  return p=>{
    let a=(condicao(p)-1)*AJ_CONDICAO;
    if(atuais.has(p.id))a+=AJ_ATUAL;
    if(p.voce){a+=_pesoConf(confTecnico());if(chance)a+=AJ_CHANCE;if(p.clausulas&&p.clausulas.titular)a+=AJ_CLAUSULA;}
    return a;
  };
}
/* a promessa de titular da criação vale as primeiras oito semanas */
function _fixoValido(t){
  const f=t.titularFixo;
  if(!f)return;
  if(!G.voce||f.id!==G.voce.id||G.ano>f.ano||(G.voce.desde===G.ano&&G.semana>8))t.titularFixo=null;
}
function escalarClubeDoJogador(){
  const t=typeof clubeDoJogador==='function'?clubeDoJogador():null;
  if(!t||!t.elenco||!t.elenco.length)return null;
  _fixoValido(t);
  const p=meuJogador(), antes=(t.titulares||[]).includes(p.id);
  autoEscalar(t,ajusteDoTecnico(t));
  if(typeof convocacao==='function')convocacao(p,t);
  const agora=(t.titulares||[]).includes(p.id);
  if(antes!==agora&&typeof noticia==='function'){
    noticia(agora?`${p.nome} ganha a vaga no cinco do ${t.nome}.`:`${p.nome} perde a vaga e vai para o banco do ${t.nome}.`,{c:'clube',p:[p.id],t:[t.id]});
    if(!G.voce.relLog)G.voce.relLog=[];
    G.voce.relLog.unshift({ano:G.ano,semana:G.semana,d:0,txt:agora?'Entrou no cinco.':'Foi para o banco.'});
  }
  return agora;
}
/* Chance de estar no cinco na próxima escalação, e o que pesa nela.
   É a mesma conta da escalação: a margem é quanto a nota do melhor cinco
   muda com você dentro ou fora. */
function chanceDeJogar(){
  const t=clubeDoJogador(), p=meuJogador();
  if(!t||!p)return null;
  _fixoValido(t);
  const aj=ajusteDoTecnico(t);
  const esc=melhorEscalacao(t,aj)||[];
  const dentro=esc.includes(p.id);
  const outros=(t.elenco||[]).map(i=>G.jogadores[i]).filter(x=>x&&x.id!==p.id&&!x.lesao);
  let margem=0, rival=null;
  if(p.lesao)return{pct:0,dentro:false,margem:-99,rival:null,fatores:_fatoresChance(p,t,aj),lesao:true};
  if(dentro){
    /* sem você: o melhor substituto no seu lugar */
    const base=notaEscalacao(esc,aj);let melhor=-Infinity;
    for(const q of outros.filter(x=>!esc.includes(x.id))){
      const tt=esc.map(i=>i===p.id?q.id:i), n=notaEscalacao(tt,aj);
      if(n>melhor){melhor=n;rival=q;}
    }
    margem=isFinite(melhor)?base-melhor:20;
  }else{
    const base=notaEscalacao(esc,aj);let melhor=-Infinity;
    for(let i=0;i<esc.length;i++){
      const tt=esc.slice();tt[i]=p.id;const n=notaEscalacao(tt,aj);
      if(n>melhor){melhor=n;rival=G.jogadores[esc[i]];}
    }
    margem=melhor-base;
  }
  const fixo=t.titularFixo&&t.titularFixo.id===p.id;
  const pct=fixo?99:Math.round(100/(1+Math.exp(-margem/1.6)));
  return{pct:Math.max(1,Math.min(99,pct)),dentro:dentro||fixo,margem:Math.round(margem*10)/10,rival,fatores:_fatoresChance(p,t,aj),fixo};
}
function _fatoresChance(p,t,aj){
  const c=condicao(p), conf=confTecnico();
  const chance=G.voce.chance&&G.voce.chance.ate>=semAbs();
  const f=[
    {rot:'Over na função',v:overComo(p,p.roleAtual||p.role),txt:`${overComo(p,p.roleAtual||p.role)} como ${p.roleAtual||p.role}`},
    {rot:'Condição',v:Math.round((c-1)*AJ_CONDICAO*10)/10,txt:`forma ${Math.round(p.forma*100)}, cansaço ${Math.round(p.fadiga*100)}${typeof fatorEnergia==='function'&&fatorEnergia(p)<1?', energia baixa':''}`},
    {rot:'Confiança do técnico',v:Math.round(_pesoConf(conf)*10)/10,txt:`${Math.round(conf)} · ${rotuloConf(conf)}`}
  ];
  if((t.titulares||[]).includes(p.id))f.push({rot:'Já é titular',v:AJ_ATUAL,txt:'o técnico não mexe no cinco à toa'});
  if(chance)f.push({rot:'Chance prometida',v:AJ_CHANCE,txt:'o técnico disse que ia te dar uma chance'});
  if(p.clausulas&&p.clausulas.titular)f.push({rot:'Cláusula de titular',v:AJ_CLAUSULA,txt:'está no seu contrato'});
  return f;
}

/* ---------- a semana das relações ----------
   Roda no fechamento da semana do jogador (fecharSemanaJogador). */
function relacoesSemana(p,t,rel){
  if(!G.voce||!t)return;
  const s=G.voce.sem||{feitas:[]};
  /* treino do clube */
  if(rel&&rel.coletivo===true)mexerConf(0.4,null);
  else if(rel&&rel.coletivo===false&&!p.lesao)mexerConf(-4,'Faltou ao treino do clube.');
  /* bons treinos: o técnico vê quem rala */
  const bons=s.feitas.filter(f=>!f.simulado&&f.nota!=null&&f.nota>=1).length;
  if(bons)mexerConf(Math.min(1,bons*0.4),bons>=2?'Treinou forte a semana toda.':null);
  /* partidas */
  if(rel&&rel.partidas&&rel.partidas.maps){
    const d=rel.partidasDiff||{};
    const acs=d.acs!=null?d.acs:200;
    const m=Math.max(-2,Math.min(2,(acs-195)/40))*Math.min(rel.partidas.maps,3)/3;
    mexerConf(m,Math.abs(m)>=1.2?(m>0?`Jogou bem: ACS ${Math.round(acs)}.`:`Jogo ruim: ACS ${Math.round(acs)}.`):null);
    if(s.energia!=null&&s.energia<20)mexerConf(-1,'Chegou ao jogo sem energia.');
  }
  /* volta devagar para o meio */
  mexerConf((55-confTecnico())*0.06,null);
  gerarConflitos(p,t,rel);
}

/* ---------- conflitos ---------- */
const CONFLITOS={
  rival:{titulo:'Rival pela vaga',opcoes:[
    {id:'ignorar',rot:'Ignorar',dica:'Nada muda. Ele acha que ganhou a discussão.'},
    {id:'responder',rot:'Responder à altura',dica:'Sua cabeça agradece; a dupla com ele e o técnico, não.'},
    {id:'conversar',rot:'Chamar para conversar',dica:'Os dois saem melhores. Ele continua querendo a sua vaga.'}]},
  derrota:{titulo:'Discussão depois da derrota',opcoes:[
    {id:'assumir',rot:'Assumir a culpa',dica:'O técnico gosta; a dupla melhora. Sua cabeça sente um pouco.'},
    {id:'rebater',rot:'Rebater',dica:'Vira bate-boca: dupla e confiança do técnico caem.'},
    {id:'silencio',rot:'Ficar quieto',dica:'Passa, mas você leva para casa.'}]}
};
function eventosJogador(){if(!G.voce)return[];if(!G.voce.eventos)G.voce.eventos=[];return G.voce.eventos;}
function gerarConflitos(p,t,rel){
  const ev=eventosJogador();
  /* evento velho expira em 2 semanas */
  G.voce.eventos=ev.filter(e=>semAbs()-e.sem<=2);
  if(G.voce.eventos.length>=2)return;
  const tit=(t.titulares||[]).includes(p.id);
  /* rival: o mais forte da mesma função do outro lado da linha */
  const mesma=(t.elenco||[]).map(i=>G.jogadores[i]).filter(q=>q&&q.id!==p.id&&!q.lesao&&(q.role===p.role||q.roleAtual===(p.roleAtual||p.role)));
  const rival=mesma.filter(q=>(t.titulares||[]).includes(q.id)!==tit).sort((a,b)=>Math.abs(over(a)-over(p))-Math.abs(over(b)-over(p)))[0];
  if(rival&&Math.abs(over(rival)-over(p))<=5&&_sorteRel('rival')<0.12)
    G.voce.eventos.push({id:'ev'+semAbs()+'r',tipo:'rival',com:rival.id,sem:semAbs(),
      txt:tit?`${rival.nome} disse no vestiário que a vaga de ${p.role} devia ser dele.`
             :`${rival.nome} soltou na live que você "ainda tem muito a aprender" para tirar a vaga dele.`});
  /* derrota: alguém cobra quem jogou mal */
  const d=rel&&rel.partidasDiff;
  if(rel&&rel.partidas&&t.seq<0&&d&&d.acs<175&&_sorteRel('derrota')<0.45){
    const quem=(t.titulares||[]).map(i=>G.jogadores[i]).filter(q=>q&&q.id!==p.id).sort((a,b)=>b.at.lider-a.at.lider)[0];
    if(quem)G.voce.eventos.push({id:'ev'+semAbs()+'d',tipo:'derrota',com:quem.id,sem:semAbs(),
      txt:`Depois da derrota, ${quem.nome} apontou você na call: ACS ${Math.round(d.acs)} não segura o time.`});
  }
}
function resolverConflito(evId,opcao){
  const ev=eventosJogador(), e=ev.find(x=>x.id===evId);
  if(!e)return{ok:false,motivo:'Esse assunto já passou.'};
  const t=clubeDoJogador(), p=meuJogador(), q=G.jogadores[e.com];
  if(!t||!q||q.timeId!==t.id){G.voce.eventos=ev.filter(x=>x!==e);return{ok:false,motivo:'Ele não está mais no clube.'};}
  let msg='';
  const mx=(a,b,lo,hi)=>Math.max(lo,Math.min(hi,a+b));
  if(e.tipo==='rival'){
    if(opcao==='ignorar'){q.moral=mx(q.moral,0.03,.05,1);msg=`Você deixou passar. ${q.nome} seguiu falando.`;}
    else if(opcao==='responder'){mexerDupla(t,p.id,q.id,-8);p.moral=mx(p.moral,0.04,.05,1);mexerConf(-1.5,`Bateu boca com ${q.nome}.`);G.voce.polemica=semAbs();msg=`Resposta dada. O vestiário ficou pesado entre vocês.`;}
    else if(opcao==='conversar'){mexerDupla(t,p.id,q.id,5);msg=`Conversa franca com ${q.nome}. A disputa continua, mas limpa.`;}
  }else if(e.tipo==='derrota'){
    if(opcao==='assumir'){mexerConf(2,'Assumiu a culpa depois da derrota.');mexerDupla(t,p.id,q.id,3);p.moral=mx(p.moral,-0.02,.05,1);msg='Você assumiu. O técnico anotou a postura.';}
    else if(opcao==='rebater'){mexerConf(-2.5,`Discutiu com ${q.nome} depois da derrota.`);G.voce.polemica=semAbs();mexerDupla(t,p.id,q.id,-8);msg=`Bate-boca com ${q.nome}. Todo mundo ouviu.`;}
    else if(opcao==='silencio'){p.moral=mx(p.moral,-0.04,.05,1);msg='Você ficou quieto e levou para casa.';}
  }
  if(!msg)return{ok:false,motivo:'Opção que não existe.'};
  G.voce.eventos=ev.filter(x=>x!==e);
  if(typeof atualizarSinergia==='function')atualizarSinergia(t);
  return{ok:true,msg};
}

/* ---------- conversas do seu lado ---------- */
function _conversou(chave){
  const c=(G.voce&&G.voce.conversas)||{};
  return c[chave]!=null&&c[chave]===semAbs();
}
function _marcarConversa(chave){if(!G.voce.conversas)G.voce.conversas={};G.voce.conversas[chave]=semAbs();}
function opcoesComTecnico(){
  const t=clubeDoJogador(), p=meuJogador();
  if(!t||!p)return[];
  const tit=(t.titulares||[]).includes(p.id);
  const out=[];
  if(!tit)out.push({id:'jogar',rot:'Pedir para jogar',dica:'Se ele topar, você ganha uma chance nas próximas duas semanas. Se não, a confiança cai, e pedir de novo cai mais.'});
  out.push({id:'funcao',rot:'Pedir outra função',dica:'Ele aceita se você render perto do seu over nela. Abre a vaga dessa função para você.'});
  out.push({id:'feedback',rot:'Pedir feedback',dica:'Sem risco: ele diz o que pesa na escalação, e gosta de quem pergunta.'});
  out.push({id:'reclamar',rot:'Reclamar da escalação',dica:'Desabafo. A sua cabeça melhora um pouco; a confiança dele cai bastante.'});
  return out;
}
function conversarComTecnico(opcao,extra){
  const t=clubeDoJogador(), p=meuJogador();
  if(!t||!p)return{ok:false,motivo:'Sem clube, sem técnico.'};
  if(_conversou('tec'))return{ok:false,motivo:'Você já falou com o técnico nesta semana.'};
  const conf=confTecnico(), ch=chanceDeJogar();
  let msg='';
  if(opcao==='jogar'){
    const insistiu=G.voce.pediuJogar&&semAbs()-G.voce.pediuJogar<=4;
    const prob=Math.max(0.05,Math.min(0.85,0.2+(conf-50)/90+(ch?ch.margem:0)/12-(insistiu?0.15:0)));
    if(_sorteRel('jogar')<prob){G.voce.chance={ate:semAbs()+2};mexerConf(1,'O técnico prometeu uma chance.');msg=`"Vou te dar uma chance." Nas próximas duas semanas você entra na frente na disputa.`;}
    else{mexerConf(insistiu?-6:-3,insistiu?'Pediu para jogar de novo, cedo demais.':'Pediu para jogar e ouviu não.');msg=insistiu?'"Já conversamos sobre isso." Ele não gostou da insistência.':'"Ainda não. Mostra no treino."';}
    G.voce.pediuJogar=semAbs();
  }else if(opcao==='funcao'){
    const f=extra&&FUNCOES_BASE.includes(extra)?extra:null;
    if(!f||f===p.role)return{ok:false,motivo:'Escolha uma função diferente da sua.'};
    if(overComo(p,f)>=over(p)-6&&conf>=40){p.role2=f;mexerConf(0.5,null);msg=`Ele topou: você passa a ser opção de ${f} (over ${overComo(p,f)} lá).`;}
    else{mexerConf(-1.5,`Pediu para jogar de ${f} e ouviu não.`);msg=overComo(p,f)<over(p)-6?`"Você rende ${overComo(p,f)} de ${f}. Não dá."`:'"Primeiro ganha a minha confiança na sua função."';}
  }else if(opcao==='feedback'){
    mexerConf(1,'Pediu feedback ao técnico.');
    const fr=ch?ch.fatores.slice().sort((a,b)=>a.v-b.v)[0]:null;
    msg=ch?(ch.dentro?`"Você está no cinco. ${ch.rival?ch.rival.nome+' está de olho na vaga.':''} Continue assim."`:`"Hoje ${ch.rival?ch.rival.nome:'outro'} está na sua frente${fr&&fr.v<0?' — e pesa a sua '+fr.rot.toLowerCase():''}. Treina e joga."`):'"Continue trabalhando."';
  }else if(opcao==='reclamar'){
    mexerConf(-9,'Reclamou da escalação com o técnico.');p.moral=Math.min(1,p.moral+0.05);
    for(const id of t.elenco||[])if(id!==p.id)mexerDupla(t,p.id,id,-1);
    msg='Você falou o que pensava. Ele ouviu de braços cruzados, e o vestiário soube.';
  }else return{ok:false,motivo:'Opção que não existe.'};
  _marcarConversa('tec');
  return{ok:true,msg};
}
function opcoesComColega(q){
  const p=meuJogador(), t=clubeDoJogador();
  if(!p||!q||!t)return[];
  return[
    {id:'apoiar',rot:'Apoiar',dica:'Conversa de corredor. A dupla melhora; quem está mal levanta mais.'},
    {id:'cobrar',rot:'Cobrar',dica:'Ele treina mais sério por umas semanas, mas a dupla com você cai.'},
    {id:'duo',rot:'Duo na ranked',dica:`10 de energia. A dupla melhora bastante.`}
  ];
}
function conversarComColega(qid,opcao){
  const t=clubeDoJogador(), p=meuJogador(), q=G.jogadores[qid];
  if(!t||!q||q.timeId!==t.id||q.id===p.id)return{ok:false,motivo:'Ele não é do seu elenco.'};
  if(_conversou(q.id))return{ok:false,motivo:`Você já falou com ${q.nome} nesta semana.`};
  let msg='';
  if(opcao==='apoiar'){
    const mal=q.moral<0.55;
    mexerDupla(t,p.id,q.id,mal?6:3);q.moral=Math.min(1,q.moral+(mal?0.07:0.03));
    msg=mal?`${q.nome} estava mal e agradeceu a conversa.`:`Papo bom com ${q.nome}.`;
  }else if(opcao==='cobrar'){
    mexerDupla(t,p.id,q.id,-5);q.moral=Math.max(.05,q.moral-0.04);q.cobrado={ate:(G.semana||1)+3,ano:G.ano};
    msg=`Você cobrou ${q.nome}. Ele fechou a cara, mas vai treinar.`;
  }else if(opcao==='duo'){
    const s=semanaJogador();
    if(!s||s.energia<10)return{ok:false,motivo:'Energia insuficiente.'};
    s.energia-=10;mexerDupla(t,p.id,q.id,5);
    msg=`Noite de ranked com ${q.nome}. A comunicação de vocês melhorou.`;
  }else return{ok:false,motivo:'Opção que não existe.'};
  _marcarConversa(q.id);
  if(typeof atualizarSinergia==='function')atualizarSinergia(t);
  return{ok:true,msg};
}

/* ---------- pedir um agente no dia de jogo ---------- */
function pedirAgente(t,mapa,ag){
  const p=meuJogador();
  if(!t||!p||!ag)return{ok:false,motivo:'Sem pedido.'};
  const atual=agenteDe(t,mapa,p);
  if(ag===atual)return{ok:true,msg:'Já é o seu agente.'};
  const nivel=typeof nivelAgente==='function'?nivelAgente(p,ag):0;
  const outro=(t.titulares||[]).filter(i=>i!==p.id).map(i=>G.jogadores[i]).find(q=>q&&agenteDe(t,mapa,q)===ag);
  if(outro)return{ok:false,motivo:`${outro.nome} já joga de ${ag} em ${mapa}.`};
  if(nivel<55)return{ok:false,motivo:`Familiaridade ${Math.round(nivel)} com ${ag}: o técnico quer pelo menos 55.`};
  if(confTecnico()<45)return{ok:false,motivo:'O técnico não confia o bastante para mexer na comp por você.'};
  if(typeof funcaoDoAgente==='function'&&typeof funcaoDoAgente(atual)==='string'&&funcaoDoAgente(ag)!==funcaoDoAgente(atual)&&confTecnico()<65)
    return{ok:false,motivo:`Trocar ${funcaoDoAgente(atual)} por ${funcaoDoAgente(ag)} muda a comp: só com confiança 65.`};
  definirAgente(t,mapa,p.id,ag);
  return{ok:true,msg:`O técnico topou: ${ag} em ${mapa}.`};
}
