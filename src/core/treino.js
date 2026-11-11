/* ============================================================
   A SEMANA DE TREINO
   ------------------------------------------------------------
   Até aqui o desenvolvimento vinha de um seletor que você marcava
   na primeira temporada e esquecia. Medindo (tools/decisoes.mjs),
   as cinco coisas que mais decidem uma partida — descanso, forma,
   posição, moral e comissão — eram todas coisas que você NÃO
   decidia. Este módulo é a resposta: o que o elenco faz na semana
   passa a ser seu, jogador por jogador.

   Duas camadas, como foi pedido:

   · INDIVIDUAL — cada jogador tem o próprio plano: um atributo,
     um agente para aprender, ou descanso.
   · MAPA — separado do individual, o time treina UM mapa da
     rotação por semana. É esse trabalho que dá conteúdo ao veto:
     banir bem só significa algo se o seu pool for construído.

   E o preço de tudo é a perna. Treinar cansa, descansar recupera,
   e cansaço é o maior fator isolado de derrota do jogo (+44 na
   medição). A decisão da semana é sempre a mesma pergunta: ganhar
   sábado, ou ganhar em setembro?
   ============================================================ */

const TREINO_TIPOS=[
  {id:'atributo', nome:'Atributo',  ajuda:'Concentra a evolução num atributo só.'},
  {id:'agente',   nome:'Agente',    ajuda:'Aprende um agente novo. Leva semanas.'},
  {id:'descanso', nome:'Descanso',  ajuda:'Recupera fadiga. Não evolui nada.'}
];
/* Quanto o plano individual mexe na fadiga da semana, além da recuperação
   normal. Treinar cansa; descansar é o único jeito de chegar inteiro numa
   série decisiva. */
/* Calibrado em duas passadas, e as duas foram medindo (tools/treino.mjs).

   Com 0,022 a fadiga dos dois clubes terminava a temporada em ZERO: a
   recuperação normal engolia o custo e "descansar ou treinar" não era decisão
   nenhuma. Com 0,075 foi para o outro extremo — cinco titulares em 100% de
   fadiga na semana 18, ou seja, treinar duas semanas seguidas passou a ser
   proibido.

   Instrumentando semana a semana, a conta apareceu: uma semana de TREINO soma
   1,4 ponto de fadiga; uma semana com JOGO soma de 8 a 22. Quem cansa é a
   partida — o treino só precisa custar o suficiente para o saldo não fechar
   sozinho. Com 0,020 a semana de treino é levemente negativa, o bloco de
   torneio empurra a fadiga para cima, e o descanso (−0,075, saldo de −0,11) é
   a única ferramenta que a limpa.

   A decisão que sobra é a certa: depois de um bloco pesado, gasto duas semanas
   descansando e perco desenvolvimento, ou entro no próximo torneio cansado? */
const FADIGA_TREINO=0.020;
const FADIGA_DESCANSO=-0.075;
/* Concentrar num atributo rende mais NAQUELE atributo do que espalhar — é o
   ponto de escolher. O total continua limitado pelo potencial. */
const FOCO_CONCENTRADO=2.1;
/* Aprender agente: por semana de plano individual, e o dobro disso quando o
   clube inteiro está no mesmo agente. */
/* Com 2,5 dava 35 semanas para chegar a 70 — uma temporada inteira num agente
   só, o que tornava correr atrás do meta impossível em vez de caro. */
const AGENTE_POR_SEMANA=6.0;
const AGENTE_POR_MAPA_JOGADO=0.6;
const AGENTE_ENFERRUJA=0.25;
/* Treino de mapa: quanto sobe por semana e onde o retorno começa a secar. */
/* Com 0,9 o mapa treinado terminava a temporada empatado com o abandonado: o
   sinal não passava do ruído das partidas. Em ~6 semanas um mapa agora sai do
   zero para perto do teto, que é o ritmo de um bloco de treino de verdade. */
const MAPA_POR_SEMANA=1.6;
const FADIGA_TREINO_MAPA=0.008;

function planoVazio(){return{mapa:null,individual:{}};}
function planoDe(t){
  if(!t)return planoVazio();
  if(!t.treino)t.treino=planoVazio();
  if(!t.treino.individual)t.treino.individual={};
  return t.treino;
}
function planoDoJogador(t,p){
  const pl=planoDe(t).individual[p.id];
  if(pl&&pl.tipo)return pl;
  /* Save antigo e clube sem plano caem no antigo seletor de time, para nada
     parar de funcionar enquanto o jogador não escolhe. */
  const antigo=(t.tatica&&t.tatica.treino)||'mira';
  return{tipo:'atributo',alvo:antigo==='utilidade'?'util':antigo==='tatica'?'visao'
    :antigo==='mental'?'clutch':'mira',herdado:true};
}
function definirPlano(t,jogadorId,tipo,alvo){
  const pl=planoDe(t);
  if(!tipo||!TREINO_TIPOS.some(x=>x.id===tipo)){delete pl.individual[jogadorId];return pl;}
  /* Alvo tem de existir. Sem esta guarda, um save mexido à mão criava nível de
     familiaridade para um agente que não está no catálogo — e o jogador
     ficava com um boneco fantasma na ficha. */
  if(tipo==='atributo'&&!ATTRS.some(a=>a[0]===alvo))return pl;
  if(tipo==='agente'&&!funcaoConhece(alvo))return pl;
  pl.individual[jogadorId]={tipo,alvo:tipo==='descanso'?null:alvo};
  return pl;
}
function funcaoConhece(ag){
  for(const f in AGENTS)if((AGENTS[f]||[]).includes(ag))return true;
  return false;
}
/* Tira do plano quem não está mais no elenco.
   Sem isto o plano crescia sem parar — doze entradas para nove jogadores — e
   um id reaproveitado herdaria o plano de quem foi vendido. */
function limparPlano(t){
  const pl=planoDe(t);
  const dentro=new Set(t.elenco||[]);
  for(const id in pl.individual)if(!dentro.has(id))delete pl.individual[id];
  /* mapa que saiu de rotação não treina nada: melhor avisar do que treinar o
     vazio em silêncio por seis semanas */
  const fora=mapasDoTreino(pl,true).filter(x=>!mapaAtivo(x.mapa));
  if(fora.length){
    definirMapasTreino(t,mapasDoTreino(pl,true).filter(x=>mapaAtivo(x.mapa)));
    if(t.id===G.meuTime&&typeof noticia==='function')
      noticia('🗺 '+fora.map(x=>x.mapa).join(' e ')+' saiu de rotação e deixou o treino de mapa da semana.',{c:'meta',t:[G.meuTime]});
  }
  return pl;
}
/* ---------- até três mapas por semana ----------
   Cada mapa do plano tem prioridade: alta, média ou baixa, e o trabalho da
   semana se divide nessa proporção (5 : 3 : 2 — com três mapas, 50/30/20).
   O ganho TOTAL cresce menos que o número de mapas: um mapa rende 1, dois
   rendem 1,15 e três 1,3. Espalhar mantém o pool; concentrar faz um mapa
   subir de verdade. O cansaço do treino de mapa acompanha o ganho total. */
const MAPAS_TREINO_MAX=3;
const PRIO_TREINO={alta:5,media:3,baixa:2};
const PRIO_NOME={alta:'alta',media:'média',baixa:'baixa'};
const GANHO_EXTRA_MAPA=0.15;
function fatorTreinoMapas(n){return n?1+GANHO_EXTRA_MAPA*(n-1):0;}
/* A lista de mapas do plano. Planos antigos têm só pl.mapa. */
function mapasDoTreino(pl,todos){
  let l=Array.isArray(pl.mapas)?pl.mapas:(pl.mapa?[{mapa:pl.mapa,prio:'alta'}]:[]);
  l=l.filter(x=>x&&x.mapa&&PRIO_TREINO[x.prio]);
  return todos?l:l.filter(x=>mapaAtivo(x.mapa));
}
function definirMapasTreino(t,lista){
  const pl=planoDe(t),vistos=new Set(),out=[];
  for(const x of lista||[]){
    if(!x||!x.mapa||vistos.has(x.mapa)||!mapaAtivo(x.mapa))continue;
    vistos.add(x.mapa);out.push({mapa:x.mapa,prio:PRIO_TREINO[x.prio]?x.prio:'media'});
    if(out.length>=MAPAS_TREINO_MAX)break;
  }
  pl.mapas=out;pl.mapa=out.length?out[0].mapa:null;
  return pl;
}
function definirMapaTreino(t,mapa){
  return definirMapasTreino(t,mapa?[{mapa,prio:'alta'}]:[]);
}
/* Clique num mapa da tela: entra (com a prioridade que falta) ou sai. */
function alternarMapaTreino(t,mapa){
  const l=mapasDoTreino(planoDe(t),true).slice();
  const i=l.findIndex(x=>x.mapa===mapa);
  if(i>=0)l.splice(i,1);
  else{
    if(l.length>=MAPAS_TREINO_MAX)return{ok:false,erro:'No máximo '+MAPAS_TREINO_MAX+' mapas por semana. Tire um antes.'};
    const usadas=new Set(l.map(x=>x.prio));
    l.push({mapa,prio:['alta','media','baixa'].find(p=>!usadas.has(p))||'baixa'});
  }
  definirMapasTreino(t,l);
  return{ok:true};
}
function definirPrioridadeMapa(t,mapa,prio){
  const l=mapasDoTreino(planoDe(t),true).map(x=>x.mapa===mapa?{mapa,prio}:x);
  definirMapasTreino(t,l);
  return{ok:true};
}
/* Quanto cada mapa recebe da semana: fração do ganho de um mapa só. */
function divisaoTreino(pl){
  const l=mapasDoTreino(pl);
  const soma=l.reduce((s,x)=>s+PRIO_TREINO[x.prio],0)||1;
  const total=fatorTreinoMapas(l.length);
  return l.map(x=>({mapa:x.mapa,prio:x.prio,frac:PRIO_TREINO[x.prio]/soma*total}));
}

/* ---------- familiaridade com agente ----------
   p.agentes continua sendo os mains. p.agenteNivel é o quanto ele sabe jogar
   cada um, de 0 a 100 — e é ela que o meta vai ler. */
/* Semeia a familiaridade UMA vez, no nascimento do jogador. Fazer isso na
   primeira leitura era cômodo e errado: a tela de Treino pergunta o nível de
   todo agente de todo jogador para montar a lista, e cada pergunta puxava um
   sorteio — desenhar a tela empurrava o gerador semeado do motor e mudava o
   futuro da simulação. O teste de pureza de render pegou exatamente isso. */
function semearAgentes(p){
  p.agenteNivel={};
  /* O sorteio nasce limitado pelo teto da função. Sem isso metade do mundo
     nascia ACIMA do próprio teto — o jogador de Tier 2 começava com 90 num
     boneco cujo teto era 60 — e aí o teto não significava nada na largada e,
     depois de enferrujar, ele nunca mais voltava ao nível de origem.
     Main de jogador real (data/agentes-reais.js) vem em ordem de uso: o
     primeiro é o boneco da carreira, e o nível desce pela lista sem nunca sair
     do domínio. */
  const real=mainsReais(p);
  (p.agentes||[]).forEach((ag,i)=>{
    const bruto=real?nivelDeMainReal(p.nome,ag,i):ri(72,95)-i*ri(0,6);
    p.agenteNivel[ag]=clamp(Math.min(bruto,tetoAgente(p,ag)),0,100);
  });
  return p.agenteNivel;
}
/* ---------- mains de verdade ----------
   Os jogadores reais jogam o que jogam no VLR, não o que o sorteio deu. */
function mainsReais(p){
  if(!p||!p.real||typeof AGENTES_REAIS==='undefined')return null;
  const l=AGENTES_REAIS[p.nome];
  if(!l||!l.length)return null;
  const ok=l.filter(a=>funcaoConhece(a));
  return ok.length?ok:null;
}
/* Os mains com que o jogador começa: os reais, ou três sorteados da função. */
function agentesIniciais(p){
  return (mainsReais(p)||sortearAgentes(p.role)).slice();
}
/* Troca os mains sorteados pelos reais e re-semeia. Chamado logo depois de o
   jogador ganhar o nick, que é quando se sabe quem ele é. */
function darMainsReais(p){
  const l=mainsReais(p);
  if(!l)return false;
  p.agentes=l.slice();
  semearAgentes(p);
  return true;
}
/* Save antigo: os mains reais entram por cima dos sorteados, a familiaridade
   que já foi treinada fica (nunca desce), e a função corrigida pelo
   levantamento só é aplicada a quem ainda está na função antiga — se você
   mudou a função no Editor, a sua escolha vale. O over não se mexe: troca de
   função recalcula o peso dos atributos, então o over antigo é reaplicado. */
function migrarMainsReais(){
  let n=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!p||!p.real)continue;
    const fc=typeof FUNCOES_CORRIGIDAS!=='undefined'&&FUNCOES_CORRIGIDAS[p.nome];
    if(fc&&p.role===fc[0]){
      const ov=over(p);
      const eraAtual=p.roleAtual===p.role;
      p.role=fc[1];
      if(eraAtual)p.roleAtual=p.role;
      if(over(p)!==ov)aplicarOver(p,ov);
      p.role2=null;ajustarSecundaria(p);
    }
    const l=mainsReais(p);
    if(!l)continue;
    const antes=p.agenteNivel||{};
    p.agentes=l.slice();
    const novo=semearAgentes(p);
    for(const ag in antes)novo[ag]=Math.max(antes[ag],novo[ag]||0);
    n++;
  }
  /* funções e domínios mudaram: redistribui quem faz o quê nos titulares,
     sem mexer em QUEM é titular */
  for(const id in G.times){
    const t=G.times[id];
    const rs=(t&&t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
    if(rs.length===5){const d=distribuirFuncoes(rs);rs.forEach((p,i)=>{p.roleAtual=d.atrib[i];});}
  }
  return n;
}
/* Nível de um main real pela posição dele na lista. SEM sorteio: a migração
   de save antigo também passa por aqui, e ela não pode empurrar o gerador do
   motor. A variação entre jogadores sai de um hash do nick. */
function nivelDeMainReal(nick,ag,i){
  let h=7;const s=String(nick)+'|'+ag;
  for(let k=0;k<s.length;k++)h=(h*31+s.charCodeAt(k))>>>0;
  const topo=[93,86,80,75,72][Math.min(i,4)];
  return topo-(h%5);
}
/* Leitura PURA: nunca sorteia, nunca cria. Agente que ninguém treinou vale 0,
   e main de save antigo cai num valor derivado do próprio jogador — sem
   aleatoriedade, para poder ser chamado de dentro do render. */
function nivelAgente(p,ag){
  if(!p||!ag)return 0;
  const base=familiaridadeBase(p,ag);
  const n=p.agenteNivel&&p.agenteNivel[ag];
  if(typeof n==='number')return Math.max(n,base);
  if((p.agentes||[]).includes(ag))return Math.max(78,base);
  return base;
}
/* ---------- o piso de familiaridade ----------
   Regra do Gabriel: todo jogador sabe o básico de TODO boneco da própria
   função — 50 — e quanto mais longe a função do boneco, menos ele sabe.

   A distância não é opinião: saiu do mesmo levantamento do VLR, contando que
   função cada jogador joga quando sai da dele. Controlador e Sentinela são
   vizinhos de porta (Viper e Cypher no mesmo jogador é comum); Iniciador e
   Sentinela quase nunca se cruzam. Flex de fato sabe um pouco de tudo, e a
   função secundária conta como meia casa.

   É um PISO: treino sobe acima dele, ferrugem nunca desce abaixo dele. */
const FAMILIAR_FUNCAO=50, FAMILIAR_FLEX=45, FAMILIAR_SECUNDARIA=40;
const PROXIMIDADE_FUNCAO={
  'Controlador|Sentinela':38,
  'Duelista|Sentinela':32, 'Controlador|Duelista':32, 'Controlador|Iniciador':32,
  'Duelista|Iniciador':28,
  'Iniciador|Sentinela':22
};
function familiaridadeBase(p,ag){
  const fun=funcaoDoAgente(ag);
  if(fun==='Flex'||!p.role)return FAMILIAR_FLEX;
  let b;
  if(p.role==='Flex')b=FAMILIAR_FLEX;
  else if(p.role===fun)b=FAMILIAR_FUNCAO;
  else{
    b=PROXIMIDADE_FUNCAO[[p.role,fun].sort().join('|')]||22;
    if(p.role2===fun)b=Math.max(b,FAMILIAR_SECUNDARIA);
  }
  /* o piso não fura o teto: quem não tem atributo para o boneco não
     "sabe o básico" acima do que conseguiria aprender */
  return p.at?Math.min(b,tetoAgente(p,ag)):b;
}
/* ---------- domínio ----------
   Boneco dominado entra em qualquer mapa sem contar como desvio de função:
   o duelista que é main de Chamber joga de Chamber, e ninguém chama isso de
   improviso. */
const DOMINIO_AGENTE=70;
function dominaAgente(p,ag){return !!(p&&ag)&&nivelAgente(p,ag)>=DOMINIO_AGENTE;}
/* Funções que o jogador cobre por domínio de boneco, fora as da ficha. */
function funcoesPorDominio(p){
  const out=[];
  for(const ag of (p&&p.agentes)||[]){
    const f=funcaoDoAgente(ag);
    if(f!=='Flex'&&!out.includes(f)&&dominaAgente(p,ag))out.push(f);
  }
  return out;
}
/* Teto de aprendizado: o agente cobra atributos, e quem não tem não chega ao
   fim. É isso que impede "todo mundo aprende tudo" — e é por isso que um clube
   às vezes tem de COMPRAR um main em vez de retreinar o que tem. */
function tetoAgente(p,ag){
  const fun=funcaoDoAgente(ag);
  const w=(typeof ROLE_W!=='undefined'&&ROLE_W[fun])||null;
  if(!w)return 90;
  let soma=0,peso=0;
  for(const k in w){soma+=(p.at[k]||0)*w[k];peso+=w[k];}
  const aptidao=peso?soma/peso:60;
  /* própria função é casa: aprende mais alto. Fora da função, teto menor —
     a não ser que o boneco seja main dele: aí ele já provou que aprende. */
  const casa=p.role===fun||p.role==='Flex'||fun==='Flex'||(p.agentes||[]).includes(ag);
  return clamp(Math.round(aptidao*(casa?1.02:0.86)),35,99);
}
function funcaoDoAgente(ag){
  for(const f in AGENTS)if((AGENTS[f]||[]).includes(ag))return f;
  return 'Flex';
}
function treinarAgente(p,ag,quanto){
  if(!p)return 0;
  /* boneco que não existe no catálogo não entra na ficha: aceitar a string
     criava um agente fantasma com nível próprio, que depois aparecia na tela */
  if(!funcaoConhece(ag))return 0;
  if(!p.agenteNivel)semearAgentes(p);
  /* zerar aqui apagava o nível implícito de quem é main do boneco: ele caía de
     78 para 0 no primeiro treino, e treinar BAIXAVA o nível */
  if(p.agenteNivel[ag]==null)p.agenteNivel[ag]=nivelAgente(p,ag);
  const teto=tetoAgente(p,ag);
  const atual=nivelAgente(p,ag);
  if(atual>=teto)return 0;
  /* retorno decrescente perto do teto: os últimos pontos custam caro */
  const folga=(teto-atual)/Math.max(1,teto);
  const passo=quanto*(0.35+folga*0.9);
  p.agenteNivel[ag]=clamp(atual+passo,0,teto);
  return p.agenteNivel[ag]-atual;
}
/* Agente sem uso enferruja. Os mains enferrujam mais devagar: você não
   desaprende o boneco da sua carreira em três meses. */
function enferrujarAgentes(p,usados){
  if(!p||!p.agenteNivel)return;
  for(const ag in p.agenteNivel){
    if(usados&&usados.includes(ag))continue;
    const main=(p.agentes||[]).includes(ag);
    const passo=AGENTE_ENFERRUJA*(main?0.4:1);
    /* nunca abaixo do piso da função: o básico não se desaprende */
    p.agenteNivel[ag]=Math.max(familiaridadeBase(p,ag),p.agenteNivel[ag]-passo);
  }
}

/* ---------- treino de mapa ----------
   Sobe a afinidade dos titulares no mapa da semana. Reserva também treina,
   mas menos: quem não entra em quadra aprende o mapa pela metade. */
function treinarMapa(t){
  const div=divisaoTreino(planoDe(t));
  if(!div.length)return null;
  let mexeu=0;
  for(const d of div)mexeu=treinarUmMapa(t,d.mapa,d.frac).jogadores;
  return{mapa:div[0].mapa,mapas:div.map(d=>d.mapa),jogadores:mexeu};
}
function treinarUmMapa(t,mapa,frac){
  /* CT e sala de análise (core/estrutura.js) e o head coach */
  const nivelTreino=fatorTreinoMapaEst(t)
                       +(((t.staff&&t.staff.tecnico)||2)-2)*0.05;
  let mexeu=0;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    if(!p.mapas)p.mapas=afinidadeInicial();
    const titular=(t.titulares||[]).includes(id);
    const atual=p.mapas[mapa]||0;
    /* retorno decrescente: de −8 para 0 é rápido, de +6 para +8 é lento */
    const folga=(AFIN_MAX-atual)/(AFIN_MAX-AFIN_MIN);
    const passo=MAPA_POR_SEMANA*nivelTreino*(titular?1:0.5)*(0.35+folga)*(frac==null?1:frac);
    p.mapas[mapa]=clamp(atual+passo,AFIN_MIN,AFIN_MAX);
    mexeu++;
  }
  return{mapa,jogadores:mexeu};
}

/* ---------- a semana ----------
   Chamado uma vez por semana por clube, pelo relógio. Devolve o que aconteceu,
   para a interface poder contar. */
function aplicarTreinoSemanal(t){
  if(!t)return null;
  const pl=limparPlano(t);
  const r={mapa:null,agentes:[],descansando:0,treinando:0};
  const doMapa=treinarMapa(t);
  if(doMapa){r.mapa=doMapa.mapa;r.mapas=doMapa.mapas;esquecerMapas(t,doMapa.mapas);}
  else esquecerMapas(t,null);
  if(typeof normalizarPool==='function')normalizarPool(t);
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    const plano=planoDoJogador(t,p);
    if(plano.tipo==='descanso')r.descansando++;
    else r.treinando++;
    if(plano.tipo==='agente'&&plano.alvo){
      const ganho=treinarAgente(p,plano.alvo,AGENTE_POR_SEMANA);
      if(ganho>0.05)r.agentes.push({nome:p.nome,agente:plano.alvo,nivel:Math.round(nivelAgente(p,plano.alvo))});
    }
    /* agente que ninguém usou nem treinou enferruja */
    enferrujarAgentes(p,[plano.tipo==='agente'?plano.alvo:null].filter(Boolean)
      .concat((p.agentes||[]).slice(0,1)));
  }
  return r;
}
/* Quantos mapas o clube trata como "os dele". Três é o bastante para o veto ter
   conteúdo: banindo dois, sobra um confortável para cada lado. */
const CONFORTO=3;
/* O mapa que a IA treina nesta semana. Treinar SEMPRE o pior parecia sensato e
   era o que homogeneizava o mundo: em uma temporada todo clube ficava bom em
   tudo (leque de 4,0 pontos entre melhor e pior mapa caía para 1,0) e o veto
   perdia sentido, porque não havia mapa que ninguém quisesse jogar. Clube de
   verdade escolhe um pool e mora nele; de vez em quando tapa um buraco. */
/* A IA usa a mesma regra de três mapas: o da rotação dela como alta, e os
   dois seguintes da ordem de conforto como média e baixa. */
function mapasDaSemanaIA(t){
  const um=mapaDaSemanaIA(t);
  if(!um)return[];
  const ordem=(G.mapasAtivos||[]).slice().sort((a,b)=>
    ((t.mapPref&&t.mapPref[b]||0)*2+afinidadeElenco(t,b))-((t.mapPref&&t.mapPref[a]||0)*2+afinidadeElenco(t,a)))
    .filter(m=>m!==um);
  return[{mapa:um,prio:'alta'},...ordem.slice(0,2).map((m,i)=>({mapa:m,prio:i?'baixa':'media'}))];
}
function mapaDaSemanaIA(t){
  const pool=(G.mapasAtivos||[]).slice();
  if(!pool.length)return null;
  /* preferência do clube primeiro, afinidade como desempate: a identidade fica
     estável de semana em semana, em vez de perseguir o buraco do momento */
  const ordem=pool.sort((a,b)=>
    ((t.mapPref&&t.mapPref[b]||0)*2+afinidadeElenco(t,b))
   -((t.mapPref&&t.mapPref[a]||0)*2+afinidadeElenco(t,a)));
  const conforto=ordem.slice(0,CONFORTO);
  const pior=ordem[ordem.length-1];
  /* três semanas no pool de conforto, uma tapando o buraco — rotação pelo
     número da semana, sem sorteio, para o mundo continuar reproduzível */
  const passo=(G.semana||1)%(CONFORTO+1);
  return passo===CONFORTO?pior:(conforto[passo]||conforto[0]);
}
/* A IA também precisa escolher, senão o mundo para de evoluir e você ganha por
   ausência. Prioridade simples e legível: elenco cansado descansa, elenco novo
   treina atributo, e o mapa da semana sai do pool de conforto do clube. */
function planoIA(t){
  if(!t||t.id===G.meuTime)return null;
  const pl=planoDe(t);
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const fadigaMedia=tit.length?tit.reduce((s,p)=>s+p.fadiga,0)/tit.length:0;
  definirMapasTreino(t,fadigaMedia>0.72?[]:mapasDaSemanaIA(t));
  pl.individual={};
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    if(p.fadiga>0.7||p.lesao){pl.individual[id]={tipo:'descanso',alvo:null};continue;}
    const gap=(p.pot||0)-over(p);
    if(gap<=1){pl.individual[id]={tipo:'descanso',alvo:null};continue;}
    /* O atributo que mais rende over: peso na função vezes o espaço que ainda
       tem até 99. A conta antiga (o mais fraco pelo peso, at/w) escolhia a
       mira do Duelista mesmo com a mira em 99, e todo o treino se perdia no
       teto: o regen empacava aos 20 anos com 74 de over e potencial 88, e a
       média do Tier 1 caía de 84 para 79 conforme os reais se aposentavam. */
    const w=ROLE_W[p.role]||ROLE_W.Flex;
    const alvo=Object.keys(w).sort((a,b)=>
      w[b]*(99-(p.at[b]||0))-w[a]*(99-(p.at[a]||0)))[0]||'mira';
    pl.individual[id]={tipo:'atributo',alvo};
  }
  return pl;
}

/* ---------- preparo por mapa ----------
   Um número de 0 a 100 para "quão pronto o time está neste mapa", feito
   SÓ dos termos que o motor de partida usa e que mudam de mapa para mapa
   (forcaTime em match.js): identidade do clube, afinidade dos cinco, a comp
   escalada e a tática do mapa. É o mesmo número que o veto enxerga, então a
   tela de preparo e a pré-partida não podem discordar. Cada ponto de força
   vale 4 pontos na escala; 50 é um mapa neutro. */
const PREPARO_ESCALA=4;
function taticaNoMapa(t,mapa){
  return Object.assign({},t.tatica,(t.taticaMapa&&t.taticaMapa[mapa])||{});
}
function definirTaticaMapa(t,mapa,campo,valor){
  if(!t.taticaMapa)t.taticaMapa={};
  const tm=Object.assign({},t.taticaMapa[mapa]||{});
  if(valor==null||valor===''||String(valor)===String(t.tatica[campo]))delete tm[campo];
  else tm[campo]=campo==='agres'?clamp(parseInt(valor)||3,1,5):valor;
  if(Object.keys(tm).length)t.taticaMapa[mapa]=tm;else delete t.taticaMapa[mapa];
  return{ok:true};
}
function preparoDoMapa(t,mapa){
  const clube=(t.mapPref[mapa]||0)*0.6;
  const elenco=afinidadeElenco(t,mapa)*0.6;
  const comp=typeof pesoComp==='function'?pesoComp(t,mapa):0;
  const guarda=t.tatica;
  let tatica=0;
  try{
    t.tatica=taticaNoMapa(t,mapa);
    tatica=((pesoAgressividade(t,mapa,'atk')+pesoFoco(t,mapa,'atk'))
           +(pesoAgressividade(t,mapa,'def')+pesoFoco(t,mapa,'def')))/2;
  }finally{t.tatica=guarda;}
  const pontos=clube+elenco+comp+tatica;
  return{mapa,pontos,nota:Math.round(clamp(50+pontos*PREPARO_ESCALA,0,100)),
         partes:{clube,elenco,comp,tatica},especifica:!!(t.taticaMapa&&t.taticaMapa[mapa])};
}
/* Foto semanal do preparo do seu clube, para o gráfico de evolução. Só do
   seu: guardar de 80 clubes inflaria o save sem ninguém olhar. */
function registrarPreparo(t){
  if(!t||t.id!==G.meuTime)return;
  const f={ano:G.ano,s:G.semana,m:{}};
  for(const mp of G.mapasAtivos||[])f.m[mp]=preparoDoMapa(t,mp).nota;
  (t.preparoHist=t.preparoHist||[]).push(f);
  if(t.preparoHist.length>40)t.preparoHist.shift();
}
