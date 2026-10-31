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
  if(pl.mapa&&!mapaAtivo(pl.mapa)){
    const era=pl.mapa;pl.mapa=null;
    if(t.id===G.meuTime&&typeof noticia==='function')
      noticia('🗺 '+era+' saiu de rotação: o treino de mapa da semana ficou sem alvo.',{c:'meta',t:[G.meuTime]});
  }
  return pl;
}
function definirMapaTreino(t,mapa){
  const pl=planoDe(t);
  pl.mapa=(mapa&&mapaAtivo(mapa))?mapa:null;
  return pl;
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
     depois de enferrujar, ele nunca mais voltava ao nível de origem. */
  (p.agentes||[]).forEach((ag,i)=>{
    const bruto=ri(72,95)-i*ri(0,6);
    p.agenteNivel[ag]=clamp(Math.min(bruto,tetoAgente(p,ag)),0,100);
  });
  return p.agenteNivel;
}
/* Leitura PURA: nunca sorteia, nunca cria. Agente que ninguém treinou vale 0,
   e main de save antigo cai num valor derivado do próprio jogador — sem
   aleatoriedade, para poder ser chamado de dentro do render. */
function nivelAgente(p,ag){
  if(!p)return 0;
  const n=p.agenteNivel&&p.agenteNivel[ag];
  if(typeof n==='number')return n;
  if((p.agentes||[]).includes(ag))return 78;
  return 0;
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
  /* própria função é casa: aprende mais alto. Fora da função, teto menor. */
  const casa=p.role===fun||p.role==='Flex'||fun==='Flex';
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
    p.agenteNivel[ag]=Math.max(0,p.agenteNivel[ag]-passo);
  }
}

/* ---------- treino de mapa ----------
   Sobe a afinidade dos titulares no mapa da semana. Reserva também treina,
   mas menos: quem não entra em quadra aprende o mapa pela metade. */
function treinarMapa(t){
  const pl=planoDe(t);
  const mapa=pl.mapa;
  if(!mapa||!mapaAtivo(mapa))return null;
  const nivelTreino=0.7+((t.estrutura&&t.estrutura.treino)||3)*0.08
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
    const passo=MAPA_POR_SEMANA*nivelTreino*(titular?1:0.5)*(0.35+folga);
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
  if(doMapa){r.mapa=doMapa.mapa;esquecerMapas(t,doMapa.mapa);}
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
  pl.mapa=fadigaMedia>0.72?null:mapaDaSemanaIA(t);
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
