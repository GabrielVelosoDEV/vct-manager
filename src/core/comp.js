/* ============================================================
   COMPOSIÇÃO DE AGENTES POR MAPA
   ------------------------------------------------------------
   Quem pega qual boneco, mapa por mapa. Três coisas se cruzam
   aqui, e é o cruzamento que faz a escolha ser escolha:

     1. FAMILIARIDADE (treino.js) — o quanto aquele jogador sabe
        jogar aquele agente, de 0 a 100. Sobe com treino, cai com
        abandono, e tem teto de aptidão.
     2. META (meta.js) — quanto o boneco vale hoje. Vem da taxa
        de escolha real de 2026 e muda a cada patch.
     3. FUNÇÃO — agente fora da função do jogador cobra caro,
        porque o teto de aprendizado dele é mais baixo.

   Uma comp de mains em bonecos do meta é o caminho seguro. Uma
   comp fora do meta custa força de round, e paga em SURPRESA:
   o analista do adversário prepara o que é comum, e o que ele
   não preparou vale menos no relatório dele. É esse o "ir contra
   o meta" — aposta, não erro.
   ============================================================ */

/* Pesos em pontos de força de round. Medidos: uma comp boa contra uma comp
   ruim tem de valer algo entre a comissão (+31 pontos de vitória) e as
   táticas (+6), porque é uma escolha por mapa e não por temporada. */
/* Calibração medida em pontos de FORÇA DE ROUND, sabendo que oito pontos de
   força valem cerca de trinta e dois pontos de vitória (é o que a comissão 5
   contra 1 entrega). A primeira tentativa usou 0,055 por ponto de
   familiaridade e a conta deu −19 pontos de força para um time de bonecos
   nunca treinados: 99,3% de derrota, mais decisivo do que oito pontos de over.
   Comp é escolha por mapa, não pode valer mais que o elenco.

   Segunda passada, com a régua já consertada (os gêmeos batiam 54% antes):
   familiaridade caiu de 0,014 para 0,010 porque um time de bonecos nunca
   treinados perdia 36,8 pontos de vitória, mais do que oito pontos de over
   valem; e o peso do meta subiu de 0,020 para 0,028, porque treinar a comp
   que o meta pede rendia só 4,1 e precisa competir com especializar o pool de
   mapas, que rende 7,2. */
const COMP_PESO_FAMILIAR=0.010;   /* por ponto de familiaridade acima de 70 */
const COMP_FAMILIAR_BASE=70;
const COMP_PESO_META=0.028;       /* por ponto de força do agente no meta */
const COMP_PENA_SEM_SMOKE=2.6;    /* comp sem controlador não fecha mapa */
const COMP_PENA_SEM_INICIA=1.4;
const COMP_PENA_DUPLA=1.2;        /* dois jogadores no mesmo agente */

function compsDe(t){
  if(!t.comps)t.comps={};
  return t.comps;
}
function compDe(t,mapa){
  const c=compsDe(t);
  if(!c[mapa])c[mapa]={};
  return c[mapa];
}
/* O agente com que ESTE jogador entra neste mapa. Sem escolha, o melhor que
   ele sabe jogar — ninguém entra em quadra sem boneco. */
function agenteDe(t,mapa,p){
  if(!p)return null;
  const c=(t.comps&&t.comps[mapa])||{};
  if(c[p.id]&&funcaoConhece(c[p.id]))return c[p.id];
  return melhorAgenteDe(p);
}
function melhorAgenteDe(p){
  const pool=(p.agentes||[]).slice();
  if(!pool.length)return (AGENTS[p.role]||[])[0]||null;
  return pool.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
}
function definirAgente(t,mapa,jogadorId,ag){
  const c=compDe(t,mapa);
  if(!ag){delete c[jogadorId];return c;}
  if(!funcaoConhece(ag))return c;
  c[jogadorId]=ag;
  return c;
}
/* A comp que entra em quadra: os cinco titulares com o boneco de cada um. */
function compEscalada(t,mapa){
  return (t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .map(p=>({p,ag:agenteDe(t,mapa,p),
              nivel:nivelAgente(p,agenteDe(t,mapa,p)),
              fun:funcaoDoAgente(agenteDe(t,mapa,p))}));
}
/* ---------- o mapa pede coisas diferentes ----------
   Sem isto a comp era a MESMA nos oito mapas — o relatório de scouting mostrava
   literalmente a mesma linha oito vezes — e escolher "por mapa" não queria
   dizer nada.

   O critério não é inventado: sai do viés de lado real de cada mapa
   (MAPA_ATK, média das três ligas em 2026). Mapa onde o ataque ganha (Abyss,
   55%) pede quem entra: duelista e iniciador. Mapa onde a defesa ganha
   (Ascent, 47%) pede quem segura: sentinela e controlador. É a mesma lógica
   que faz um time levar Viper para mapa aberto — só que ancorada em número
   medido, e não em opinião minha sobre cada agente. */
const COMP_PESO_MAPA=0.9;
function pendorDoMapa(mapa){
  const atk=(typeof MAPA_ATK!=='undefined'&&MAPA_ATK[mapa])||50;
  return (atk-50)/5;      /* −0,6 (Ascent) a +1,0 (Abyss) */
}
function encaixeNoMapa(fun,mapa){
  const p=pendorDoMapa(mapa);
  const entra={Duelista:1,Iniciador:0.6,Flex:0,Controlador:-0.4,Sentinela:-1}[fun];
  return (entra===undefined?0:entra)*p*COMP_PESO_MAPA;
}
/* O que ESTE agente, com ESTE jogador, neste mapa, adiciona à força do round.
   É a mesma conta que pesoComp soma — ter uma função só evita que o preset e
   a força discordem. */
function valorDoAgente(p,ag,mapa){
  if(!ag)return -99;
  return (nivelAgente(p,ag)-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR
       + (forcaMeta(ag)-META_NEUTRO)*COMP_PESO_META
       + encaixeNoMapa(funcaoDoAgente(ag),mapa);
}
/* ---------- o que a comp vale ----------
   Entra em forcaTime como um termo só, para o efeito ser legível e medível. */
function pesoComp(t,mapa){
  const linhas=compEscalada(t,mapa);
  if(!linhas.length)return 0;
  let f=0;
  const funs={},usados={};
  for(const l of linhas){
    if(!l.ag)continue;
    /* familiaridade: 70 é o main comum; 95 é o especialista; 20 é quem foi
       jogar de boneco que nunca treinou */
    f+=(l.nivel-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR;
    /* meta: quanto o boneco vale hoje */
    f+=(forcaMeta(l.ag)-META_NEUTRO)*COMP_PESO_META;
    /* e o que este mapa pede */
    f+=encaixeNoMapa(l.fun,mapa);
    funs[l.fun]=(funs[l.fun]||0)+1;
    usados[l.ag]=(usados[l.ag]||0)+1;
  }
  /* buracos de comp: é a regra do próprio jogo, não invenção. Sem controlador
     não se fecha um site; sem iniciador não se entra num. */
  const smokes=(funs['Controlador']||0)+(funs['Flex']||0);
  if(!smokes)f-=COMP_PENA_SEM_SMOKE;
  if(!(funs['Iniciador']||0))f-=COMP_PENA_SEM_INICIA;
  for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
  return f;
}
/* ---------- surpresa ----------
   O quanto a comp foge do que o mundo joga. É isso que o analista adversário
   NÃO preparou, e é o que desconta a vantagem de scouting dele. 0 = comp de
   manual, 1 = ninguém esperava. */
function surpresaDaComp(t,mapa){
  const linhas=compEscalada(t,mapa);
  if(!linhas.length)return 0;
  let fora=0;
  for(const l of linhas){
    if(!l.ag)continue;
    const topo=topoDoMeta(l.fun,3);
    if(!topo.includes(l.ag))fora++;
    if(l.p.role!==l.fun&&l.fun!=='Flex'&&l.p.role!=='Flex')fora+=0.5;
  }
  return clamp(fora/(linhas.length*1.5),0,1);
}

/* ---------- presets ----------
   Gabriel pediu presets, e presets fixos por mapa envelheceriam no primeiro
   patch. Estes são calculados na hora, a partir do meta de hoje e do elenco
   de hoje — o preset Meta muda sozinho quando a Riot mexe no jogo. */
const PRESETS_COMP=[
  {id:'melhor',  rot:'Melhor agora',  dica:'A comp mais forte HOJE: cruza familiaridade, meta e o que este mapa pede.'},
  {id:'meta',    rot:'Meta',          dica:'O que o meta pede, mesmo que ninguém saiba jogar ainda — é o alvo do treino.'},
  {id:'conforto',rot:'Conforto',      dica:'O que cada um sabe jogar melhor, meta ou não.'},
  {id:'contra',  rot:'Contra o meta', dica:'Foge do que o adversário preparou: perde força de round e ganha surpresa.'}
];
function aplicarPreset(t,mapa,preset){
  const c=compDe(t,mapa);
  const linhas=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  /* Melhor agora é a comp INTEIRA mais forte, não cinco escolhas boas uma de
     cada vez. Parte do guloso e do conforto, melhora os dois trocando boneco
     entre jogadores, e fica com o que pesoComp mais gostar. */
  if(preset==='melhor'){
    const cands=['_guloso','conforto'].map(pr=>{
      const x=Object.assign({},c);
      montarPreset(t,mapa,pr==='_guloso'?'melhor':pr,x,linhas);
      repararComp(t,mapa,x,linhas);
      return melhorarComp(mapa,x,linhas);
    });
    const melhor=cands.sort((a,b)=>notaDaComp(mapa,b,linhas)-notaDaComp(mapa,a,linhas))[0];
    linhas.forEach(p=>{if(melhor[p.id])c[p.id]=melhor[p.id];});
    return c;
  }
  montarPreset(t,mapa,preset,c,linhas);
  return repararComp(t,mapa,c,linhas);
}
function montarPreset(t,mapa,preset,c,linhas){
  const tomados=new Set();
  const escolher=p=>{
    const dele=(p.agentes||[]).slice();
    const daFuncao=(agentesDe(p.roleAtual||p.role)||[]).slice();
    const pool=[...new Set([...dele,...daFuncao])].filter(a=>!tomados.has(a));
    if(!pool.length)return melhorAgenteDe(p);
    if(preset==='melhor')
      return pool.sort((a,b)=>valorDoAgente(p,b,mapa)-valorDoAgente(p,a,mapa))[0];
    if(preset==='conforto')
      return pool.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
    if(preset==='contra'){
      /* o que ele sabe jogar E está fora do topo do meta: surpresa que ainda
         é jogável, não suicídio */
      const topo=topoDoMeta(p.roleAtual||p.role,3);
      const fora=pool.filter(a=>!topo.includes(a)&&nivelAgente(p,a)>=45);
      const alvo=(fora.length?fora:pool);
      return alvo.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
    }
    /* meta: o que o meta PEDE, sem olhar o que ele já sabe.
       A primeira versão pesava familiaridade aqui e o resultado media zero: o
       main tem 70 a 95 de familiaridade e quem nunca treinou tem 0, então a
       familiaridade dominava a conta e o preset Meta nunca saía dos mains —
       ou seja, treinar agente não teria para que servir. O preset agora aponta
       o alvo do treino, e escalar antes de treinar CUSTA. É essa a decisão. */
    return pool.sort((a,b)=>forcaMeta(b)-forcaMeta(a))[0];
  };
  for(const p of linhas){
    const ag=escolher(p);
    if(ag){c[p.id]=ag;tomados.add(ag);}
  }
  return c;
}
/* A mesma conta de pesoComp, só que sobre uma comp candidata em vez da que
   está gravada no time. As duas têm de concordar, senão o preset otimiza uma
   coisa e a partida mede outra. */
function notaDaComp(mapa,c,linhas){
  let f=0;
  const funs={},usados={};
  for(const p of linhas){
    const ag=(c[p.id]&&funcaoConhece(c[p.id]))?c[p.id]:melhorAgenteDe(p);
    if(!ag)continue;
    const fun=funcaoDoAgente(ag);
    f+=(nivelAgente(p,ag)-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR
      +(forcaMeta(ag)-META_NEUTRO)*COMP_PESO_META
      +encaixeNoMapa(fun,mapa);
    funs[fun]=(funs[fun]||0)+1;
    usados[ag]=(usados[ag]||0)+1;
  }
  if(!((funs['Controlador']||0)+(funs['Flex']||0)))f-=COMP_PENA_SEM_SMOKE;
  if(!(funs['Iniciador']||0))f-=COMP_PENA_SEM_INICIA;
  for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
  return f;
}
/* Busca local: troca o boneco de um jogador, ou troca bonecos entre dois, e
   aceita o movimento que mais sobe a nota. O guloso errava justamente aqui:
   dois controladores que sabem Astra e Harbor, e o primeiro da lista pegava o
   boneco em que o segundo era melhor. Roda toda semana para os 80 clubes, então
   o valor de cada jogador em cada boneco é calculado uma vez só e a nota da
   comp vira soma de tabela. Nada aqui sorteia. */
function melhorarComp(mapa,c,linhas){
  const x={};
  const pools=linhas.map(p=>{
    const lista=[...new Set([c[p.id],...(p.agentes||[]),...(agentesDe(p.roleAtual||p.role)||[])])]
      .filter(a=>a&&funcaoConhece(a));
    const val={},fun={};
    lista.forEach(a=>{val[a]=valorDoAgente(p,a,mapa);fun[a]=funcaoDoAgente(a);});
    return{p,lista,val,fun};
  });
  pools.forEach(({p,lista})=>{x[p.id]=(c[p.id]&&funcaoConhece(c[p.id]))?c[p.id]:(melhorAgenteDe(p)||lista[0]);});
  const nota=y=>{
    let f=0,smoke=0,inicia=0;const usados={};
    for(const{p,val,fun}of pools){
      const ag=y[p.id];if(!ag)continue;
      if(val[ag]===undefined){val[ag]=valorDoAgente(p,ag,mapa);fun[ag]=funcaoDoAgente(ag);}
      f+=val[ag];
      if(fun[ag]==='Controlador'||fun[ag]==='Flex')smoke++;
      if(fun[ag]==='Iniciador')inicia++;
      usados[ag]=(usados[ag]||0)+1;
    }
    if(!smoke)f-=COMP_PENA_SEM_SMOKE;
    if(!inicia)f-=COMP_PENA_SEM_INICIA;
    for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
    return f;
  };
  for(let it=0;it<20;it++){
    const base=nota(x);
    let melhor=null;
    for(const{p,lista}of pools){
      for(const a of lista){
        if(a===x[p.id])continue;
        const dono=linhas.find(q=>q.id!==p.id&&x[q.id]===a);
        const antes=x[p.id];
        if(dono)x[dono.id]=antes;
        x[p.id]=a;
        const n=nota(x);
        x[p.id]=antes;
        if(dono)x[dono.id]=a;
        if(n>base+1e-9&&(!melhor||n>melhor.n))melhor={n,p,a,dono};
      }
    }
    if(!melhor)break;
    if(melhor.dono)x[melhor.dono.id]=x[melhor.p.id];
    x[melhor.p.id]=melhor.a;
  }
  return Object.assign({},c,x);
}
/* Escolher jogador a jogador é guloso e cego para a comp inteira: medido, o
   preset "melhor" saía PIOR que o "conforto" em Ascent (1,22 contra 1,79)
   porque cinco escolhas individualmente boas montavam uma comp sem iniciador,
   e o buraco custa mais do que os cinco ganhos somados. Este passo fecha os
   buracos trocando quem perde menos com a troca. */
function repararComp(t,mapa,c,linhas){
  const precisa=[
    {funs:['Controlador','Flex'],rot:'Controlador'},
    {funs:['Iniciador'],rot:'Iniciador'}
  ];
  for(const req of precisa){
    const temNa=linhas.some(p=>req.funs.includes(funcaoDoAgente(c[p.id])));
    if(temNa)continue;
    let melhorTroca=null;
    for(const p of linhas){
      /* candidatos da função que falta, entre os que ele conhece e os da
         função dele — sem duplicar quem já está em quadra */
      const usados=new Set(linhas.filter(x=>x.id!==p.id).map(x=>c[x.id]));
      const cand=[...new Set([...(p.agentes||[]),...(agentesDe(req.rot)||[]),...topoDoMeta(req.rot,3)])]
        .filter(a=>req.funs.includes(funcaoDoAgente(a))&&!usados.has(a));
      for(const a of cand){
        const perda=valorDoAgente(p,c[p.id],mapa)-valorDoAgente(p,a,mapa);
        if(!melhorTroca||perda<melhorTroca.perda)melhorTroca={p,a,perda};
      }
    }
    if(melhorTroca)c[melhorTroca.p.id]=melhorTroca.a;
  }
  return c;
}
/* Tira do mapa da comp quem saiu do elenco, e do pool o mapa que saiu de
   rotação — a mesma faxina do plano de treino. */
function limparComps(t){
  const c=compsDe(t);
  const dentro=new Set(t.elenco||[]);
  for(const mapa in c){
    if(!mapaAtivo(mapa)){delete c[mapa];continue;}
    for(const pid in c[mapa]){
      if(!dentro.has(pid)||!funcaoConhece(c[mapa][pid]))delete c[mapa][pid];
    }
  }
  return c;
}
/* A IA também escolhe comp, senão ela entraria sempre no automático e o meta
   não teria com quem girar. Preset Meta para quem tem elenco descansado, e
   Conforto para quem tem gente sem familiaridade no que o meta pede. */
/* A IA escolhe a comp mais forte que ela consegue montar HOJE, mapa a mapa.
   A primeira versão dela usava o preset Meta quando o elenco conhecia o meta,
   e o resultado aparecia no relatório de scouting: clubes escalando Deadlock
   com familiaridade 0 porque o meta pedia. Time nenhum faz isso — o meta é
   alvo de treino, não escalação de sábado. */
/* A busca da comp inteira custa, e roda para 80 clubes. Ela só é refeita
   quando algo que a decide mudou — titulares, patch, rotação de mapas — ou a
   cada quatro semanas, que é o ritmo em que a familiaridade anda o bastante
   para trocar um boneco. */
const COMP_IA_INTERVALO=4;
function compIA(t){
  if(!t||t.id===G.meuTime)return null;
  const ativos=G.mapasAtivos||[];
  const assin=(t.titulares||[]).join(',')+'|'+ativos.join(',')+'|'+JSON.stringify(G.meta||{});
  const semana=(G.ano||0)*100+(G.semana||0);
  const faltaMapa=ativos.some(m=>!(t.comps&&t.comps[m]));
  if(!faltaMapa&&t.compAssin===assin&&semana-(t.compSemana||0)<COMP_IA_INTERVALO)return t.comps;
  for(const mapa of ativos)aplicarPreset(t,mapa,'melhor');
  t.compAssin=assin;t.compSemana=semana;
  return t.comps;
}
