/* ============================================================
   MODO JOGADOR — a base (J0 e J1)
   ------------------------------------------------------------
   Terceiro papel ao lado de Treinador e Diretoria: você é UM
   jogador do circuito. O mundo é o mesmo — clubes, calendário,
   mercado, torcida, imprensa —, mas ninguém do lado de lá é
   você: o seu clube é dirigido pela IA como qualquer outro.

   Por isso, no modo jogador, G.meuTime fica vazio. Tudo o que é
   de quem DIRIGE um clube (escalação, tática, mercado, base,
   finanças do clube) some sozinho, e a IA cuida do seu clube
   sem exceção. O que é do jogador mora em G.voce:
     G.voce = {id, desde, inicio, estilo, dificuldade}
   e o registro do jogador em G.jogadores leva p.voce = true.

   Desde a J5 o contrato é seu: renova se você aceitar (ou o
   assistente de contrato), e o clube pode cortar você. A IA não
   negocia você pelas suas costas (transferencias e livres da IA
   pulam p.voce); toda troca passa pelas suas propostas
   (core/carreira-mercado.js). Aposentadoria é sua ou do corpo
   (core/legado-jogador.js), nunca do sorteio do mundo.
   As etapas seguintes moram cada uma no seu arquivo:
     J3 semana-jogador.js e talentos.js · J4 relacoes.js
     J5 carreira-mercado.js · J6 fama.js · J7 legado-jogador.js
   ============================================================ */

function modoJogador(){return !!(typeof G!=='undefined'&&G&&G.voce);}
function meuJogador(){return modoJogador()?G.jogadores[G.voce.id]||null:null;}
function ehVoce(p){return !!(p&&p.voce);}
function clubeDoJogador(){const p=meuJogador();return p&&p.timeId?G.times[p.timeId]||null:null;}
/* o clube cujas partidas são "suas": o que você dirige, ou o do seu jogador */
function clubeDoUsuario(){
  if(typeof G==='undefined'||!G)return null;
  if(G.meuTime)return G.meuTime;
  const p=meuJogador();return p&&p.timeId?p.timeId:null;
}
/* agentes livres que a IA pode contratar (você não entra sem querer) */
function livresIA(){return G.livres.map(i=>G.jogadores[i]).filter(p=>p&&!p.voce);}

/* ---------- pontos de partida ----------
   valores SUGERIDOS: a criação deixa mexer em tudo (over e potencial
   livres), e o ponto de partida só decide onde você aparece no mundo */
const INICIOS_JOGADOR=[
  {id:'ranked',  nome:'Ranked',            resumo:'Sem clube, Radiante, sonhando com uma chance.', over:65, pot:92, tier:0},
  {id:'tier2',   nome:'Challengers',       resumo:'Contratado por um clube do Tier 2, brigando por vaga.', over:72, pot:88, tier:2},
  {id:'banco',   nome:'VCT no banco',      resumo:'Novato num clube da liga principal, começa como reserva.', over:78, pot:86, tier:1},
  {id:'titular', nome:'VCT titular',       resumo:'Titular num clube da liga principal desde o primeiro jogo.', over:84, pot:90, tier:1, titular:true},
  {id:'lenda',   nome:'Lenda',             resumo:'Um dos melhores do mundo, já no topo.', over:93, pot:98, tier:1, titular:true}
];
function inicioJogador(id){return INICIOS_JOGADOR.find(x=>x.id===id)||INICIOS_JOGADOR[1];}
/* estilo de jogo: o talento de partida (a árvore cresce a partir dele, J3) */
const ESTILOS_JOGADOR=[
  {id:'entrada',  nome:'Entrada',   desc:'Abre o bomb e troca a primeira vida.', mais:'mov',    agres:+0.10},
  {id:'suporte',  nome:'Suporte',   desc:'Utilidade na hora certa, joga para o time.', mais:'util', agres:-0.05},
  {id:'ancora',   nome:'Âncora',    desc:'Segura o bomb sozinho e não se apavora.', mais:'clutch', agres:-0.10},
  {id:'lurker',   nome:'Lurker',    desc:'Flanco, informação, tempo de jogo.', mais:'visao',  agres:-0.02},
  {id:'mira',     nome:'Mira pura', desc:'Ganha duelo; o resto vem depois.', mais:'mira',   agres:+0.05}
];
function estiloJogador(id){return ESTILOS_JOGADOR.find(x=>x.id===id)||ESTILOS_JOGADOR[4];}

/* ---------- criar a carreira ----------
   o = {nick, nome, pais, idade, genero, foto, funcao, agentes:[nomes],
        estilo, inicio, over, pot, timeId, atrib (opcional, manual)} */
function criarCarreiraJogador(o){
  const ini=inicioJogador(o.inicio), est=estiloJogador(o.estilo);
  const funcao=ROLES.includes(o.funcao)?o.funcao:'Duelista';
  const overAlvo=clamp(Math.round(o.over||ini.over),40,99);
  const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
  const tier=ini.tier||2;
  const p=makePlayer(overAlvo,funcao,o.pais||'BR',clamp(parseInt(o.idade)||19,15,40),usados,tier);
  p.nome=String(o.nick||'').trim().slice(0,20)||'Você';
  p.nomeReal=String(o.nome||'').trim().slice(0,40)||null;
  p.genero=o.genero==='f'?'f':'m';
  if(o.foto)p.foto=o.foto;
  p.voce=true;
  /* atributos: os do perfil da função puxados pelo estilo, ou os que você montou */
  if(o.atrib){for(const[k]of ATTRS)if(o.atrib[k]!=null)p.at[k]=clamp(Math.round(o.atrib[k]),25,99);}
  else if(est.mais&&p.at[est.mais]!=null){p.at[est.mais]=clamp(p.at[est.mais]+4,25,99);aplicarOver(p,overAlvo);}
  p.pot=clamp(Math.round(o.pot||ini.pot),over(p),99);
  p.pico=over(p);
  /* agentes: os que você escolheu, na ordem (o primeiro é o main) */
  const ag=(o.agentes||[]).filter(Boolean).slice(0,5);
  if(ag.length){p.agentes=ag;p.agenteNivel=null;if(typeof semearAgentes==='function')semearAgentes(p);}
  ajustarSecundaria(p);
  G.jogadores[p.id]=p;
  G.voce={id:p.id,desde:G.ano,inicio:ini.id,estilo:est.id,dificuldade:o.dificuldade||'normal'};
  p.pico=Math.max(p.pico||0,over(p));p.xp={};
  G.voce.caixa=typeof CAIXA_INICIAL!=='undefined'?(CAIXA_INICIAL[ini.id]||5000):5000;G.voce.autoContrato=true;
  G.voce.vida=['ranked','tier2'].includes(ini.id)?'simples':'confortavel';
  if(typeof darTalentoDoEstilo==='function')darTalentoDoEstilo(p);   /* o estilo dá o talento de partida (core/talentos.js) */
  G.meuTime=null;
  /* onde você aparece no mundo */
  const t=o.timeId&&G.times[o.timeId];
  if(t&&ini.tier){
    /* elenco cheio: sai o reserva de menor over, como numa contratação */
    if(t.elenco.length>=ELENCO_MAX){
      const sai=t.elenco.map(i=>G.jogadores[i]).filter(x=>x&&!t.titulares.includes(x.id)).sort((a,b)=>over(a)-over(b))[0];
      if(sai)liberar(sai);
    }
    contratar(p,t,2,salario(p,t));
    if(ini.titular){
      /* titular desde o primeiro jogo: entra no lugar do titular da mesma função de menor over */
      const mesma=t.titulares.map(i=>G.jogadores[i]).filter(x=>x&&x.id!==p.id).sort((a,b)=>(a.role===funcao?0:1)-(b.role===funcao?0:1)||over(a)-over(b));
      if(!t.titulares.includes(p.id)){
        if(t.titulares.length>=5&&mesma[0])t.titulares=t.titulares.filter(x=>x!==mesma[0].id);
        t.titulares.push(p.id);
      }
      t.titularFixo={id:p.id,ano:G.ano};   /* o técnico respeita a promessa na primeira temporada (J4 decide depois) */
      autoEscalar(t);
    }
    p.moral=clamp(p.moral+.1,.2,1);
  }else{
    p.timeId=null;p.contrato=0;p.semLivre=0;
    if(!G.livres.includes(p.id))G.livres.push(p.id);
  }
  p.salario=p.timeId?p.salario:0;
  p.valor=valor(p);
  if(typeof noticia==='function'){
    if(p.timeId)noticia('✍️ '+p.nome+' assinou com o '+G.times[p.timeId].nome+(ini.titular?' e chega como titular.':'.'),{c:'mercado',p:[p.id],t:[p.timeId]});
    else noticia('🎮 '+p.nome+' é o nome que sobe na ranked. Os olheiros já ouviram falar.',{c:'carreira',p:[p.id]});
  }
  return p;
}
