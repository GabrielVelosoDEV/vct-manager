/* ---------- Calendário da temporada ----------
   As semanas saem do calendário real da VCT 2026, conferido no vlr.gg: os
   Stages regionais duram cerca de sete semanas (o Americas Stage 2 foi de 16
   de julho a 7 de setembro), os Masters cerca de três, e o Champions quatro
   (24 de setembro a 18 de outubro). Entre um torneio e outro sobra semana
   vazia de propósito: é nela que o elenco treina e você resolve o que fazer.

   `ini` e `fim` são semanas do ano. Todo bloco cabe no intervalo dele por
   construção — ver rodadasPorSemana(), que aperta o ritmo quando falta tempo
   em vez de deixar um torneio vazar para o mês seguinte. */
const TEMPORADA=[
  {nome:'Pré-temporada',          ini:1,  fim:4,  endKey:'preseason', janela:true},
  {nome:'Kickoff · Grupos',       ini:5,  fim:7,  endKey:'kickGrupos',montar:'kickGrupos'},
  {nome:'Kickoff · Playoffs',     ini:8,  fim:9,  endKey:'kickoff',   montar:'kickPO'},
  {nome:'Masters I · Suíço',      ini:11, fim:12, endKey:'m1Suico',   montar:'m1Suico'},
  {nome:'Masters I · Playoffs',   ini:13, fim:14, endKey:'masters1',  montar:'m1PO'},
  {nome:'Stage 1 · Grupos',       ini:16, fim:20, endKey:'stage1',    montar:'stage1'},
  {nome:'Stage 1 · Playoffs',     ini:21, fim:23, endKey:'po1',       montar:'po1'},
  {nome:'Masters II · Suíço',     ini:25, fim:26, endKey:'m2Suico',   montar:'m2Suico'},
  {nome:'Masters II · Playoffs',  ini:27, fim:28, endKey:'masters2',  montar:'m2PO'},
  {nome:'Janela do meio do ano',  ini:29, fim:30, endKey:'window',    janela:true},
  {nome:'Stage 2 · Grupos',       ini:31, fim:35, endKey:'stage2',    montar:'stage2'},
  {nome:'Stage 2 · Playoffs',     ini:36, fim:38, endKey:'po2',       montar:'po2'},
  {nome:'Champions · Grupos',     ini:40, fim:42, endKey:'chGrupos',  montar:'chGrupos'},
  {nome:'Champions · Playoffs',   ini:43, fim:45, endKey:'champions', montar:'chPO'},
  /* Ascension DEPOIS do Champions, como no circuito real. Antes ele vinha
     antes, e a troca de divisão acontecia com o mundial ainda por disputar:
     um clube podia ser rebaixado e, por já não ser mais do Tier 1, sumir da
     conta de quem vai ao Champions. Quem sobe agora sobe para a temporada
     seguinte, que é o que Ascension significa. */
  {nome:'Ascension',              ini:47, fim:48, endKey:'ascension', montar:'ascension'},
  {nome:'Fim de temporada',       ini:49, fim:52, endKey:'offseason', janela:true}
];

/* O nome da liga de Challengers da região. Mora em G.regioes[].nomeT2 porque
   REGIONS[].t2 já foi usado para duas coisas — o nome e a lista de times — e a
   segunda apagava a primeira. */
function nomeT2(R){
  const g=G.regioes&&G.regioes[R.id];
  return (g&&g.nomeT2)||R.t2||('Challengers '+String(R.nome||R.id).replace(/^VCT\s*/,''));
}
function montarCalendario(){
  G.calendario=TEMPORADA.map(b=>Object.assign({stages:[]},b));
  G.semana=1;G.bloco=0;
  G.qual={masters1:[],masters2:[],champions:[]};
  REGIONS.forEach(R=>{G.regioes[R.id].pontos={};G.regioes[R.id].t1.forEach(id=>G.regioes[R.id].pontos[id]=0);});
}
/* O bloco que cobre uma semana, ou null se a semana está livre. */
function blocoDaSemana(sem){
  const i=G.calendario.findIndex(b=>sem>=b.ini&&sem<=b.fim);
  return i<0?null:i;
}
/* O próximo bloco a partir de uma semana, para a tela dizer o que vem. */
function proximoBloco(sem){
  return G.calendario.find(b=>b.ini>sem)||null;
}
/* Quantos passam de cada grupo. Quatro por grupo em liga de 12, para o playoff
   sair com oito — que é o tamanho da dupla eliminação real. */
function novoGrupos(o){return novoStage(Object.assign({tipo:'grupos',bo:3,nGrupos:2,rotulo:'Grupos'},o));}
function novoDE(o){return novoStage(Object.assign({tipo:'de',bo:3},o));}
function montarBloco(b){
  if(b.montar==='kickGrupos'){
    b.stages=REGIONS.map(R=>novoGrupos({id:'kg_'+R.id,nome:'Kickoff '+R.nome+' · Grupos',
      regiao:R.id,tier:1,passam:4,times:G.regioes[R.id].t1.slice()}));
  }
  if(b.montar==='kickPO'){
    b.stages=REGIONS.map(R=>{
      const g=acharStage('kg_'+R.id);
      return novoDE({id:'kick_'+R.id,nome:'Kickoff '+R.nome,regiao:R.id,tier:1,
        times:(g&&g.classificados||[]).slice(0,8)});
    });
  }
  if(b.montar==='stage1'||b.montar==='stage2'){
    const n=b.montar==='stage1'?1:2;
    b.stages=[
      ...REGIONS.map(R=>novoGrupos({id:'s'+n+'_'+R.id,nome:'Stage '+n+' · '+R.nome,
        regiao:R.id,tier:1,passam:4,times:G.regioes[R.id].t1.slice()})),
      /* Challengers tem 8 clubes: dois grupos de quatro, passam dois de cada */
      ...REGIONS.map(R=>novoGrupos({id:'c'+n+'_'+R.id,nome:'Split '+n+' · '+nomeT2(R),
        regiao:R.id,tier:2,passam:2,times:G.regioes[R.id].t2.slice()}))
    ];
  }
  if(b.montar==='po1'||b.montar==='po2'){
    const n=b.montar==='po1'?1:2;
    const st=[];
    REGIONS.forEach(R=>{
      const g=acharStage('s'+n+'_'+R.id);
      st.push(novoDE({id:'po'+n+'_'+R.id,nome:'Playoffs Stage '+n+' · '+R.nome,
        regiao:R.id,tier:1,times:(g&&g.classificados||[]).slice(0,8)}));
      const c=acharStage('c'+n+'_'+R.id);
      st.push(novoDE({id:'cp'+n+'_'+R.id,nome:'Playoffs '+nomeT2(R),
        regiao:R.id,tier:2,times:(c&&c.classificados||[]).slice(0,4)}));
    });
    b.stages=st;
  }
  /* Masters: fase suíça para semear e dupla eliminação para decidir, que é o
     que o Masters faz de verdade desde 2025. */
  if(b.montar==='m1Suico'||b.montar==='m2Suico'){
    const key=b.montar==='m1Suico'?'masters1':'masters2';
    const times=G.qual[key].slice();
    b.stages=times.length>=4?[novoStage({id:key+'_sw',nome:(key==='masters1'?'Masters I':'Masters II')+' · Fase suíça',
      tipo:'swiss',bo:3,rotulo:'Fase suíça',regiao:'INT',tier:1,times,rodadasMax:3})]:[];
  }
  if(b.montar==='m1PO'||b.montar==='m2PO'){
    const key=b.montar==='m1PO'?'masters1':'masters2';
    const sw=acharStage(key+'_sw');
    const times=(sw&&sw.classificados||G.qual[key]||[]).slice(0,8);
    b.stages=times.length>=2?[novoDE({id:key,nome:key==='masters1'?'Masters I':'Masters II',
      regiao:'INT',tier:1,times})]:[];
  }
  if(b.montar==='ascension'){
    b.stages=REGIONS.map(R=>novoStage({id:'asc_'+R.id,nome:'Ascension · '+R.nome,
      tipo:'de',bo:3,regiao:R.id,tier:2,times:vagasAscension(R)}));
  }
  if(b.montar==='chGrupos'){
    const t=[];
    REGIONS.forEach(R=>{
      const P=G.regioes[R.id].pontos;
      const rk=G.regioes[R.id].t1.slice().sort((x,y)=>(P[y]||0)-(P[x]||0)
        ||(G.times[y].temporada.v-G.times[y].temporada.d)-(G.times[x].temporada.v-G.times[x].temporada.d)
        ||G.times[y].prestigio-G.times[x].prestigio);
      t.push(...rk.slice(0,4));
    });
    /* 16 times em quatro grupos de quatro, passam dois — o desenho do
       Champions desde que ele virou torneio de 16. */
    b.stages=[novoGrupos({id:'ch_gr',nome:'Champions '+G.ano+' · Grupos',
      regiao:'INT',tier:1,nGrupos:4,passam:2,times:t})];
  }
  if(b.montar==='chPO'){
    const g=acharStage('ch_gr');
    const times=(g&&g.classificados||[]).slice(0,8);
    b.stages=times.length>=2?[novoDE({id:'champs',nome:'Valorant Champions '+G.ano,
      regiao:'INT',tier:1,times})]:[];
  }
}
/* Quem disputa o Ascension: os quatro melhores da temporada de Challengers,
   somando os dois splits.

   Antes iam só os dois campeões de split — e em três de cada quatro regiões o
   mesmo clube ganhava os dois, então o Ascension virava um jogo que não
   acontecia: subia sem jogar, sem prêmio distribuído e sem melhor jogador.
   Somar a temporada dá um torneio de verdade todo ano, e é mais perto do que
   o Ascension é de fato: a decisão do ano inteiro da divisão de acesso. */
const PONTOS_ASCENSION=[12,8,5,3,2,1];
function vagasAscension(R){
  const pontos={};
  const somar=(id,p)=>{if(id)pontos[id]=(pontos[id]||0)+p;};
  for(const pre of ['cp1_','cp2_']){
    const s=acharStage(pre+R.id);
    if(!s)continue;
    (s.ranking||[]).forEach((id,i)=>somar(id,PONTOS_ASCENSION[i]||0));
  }
  /* a fase de grupos entra como desempate leve: quem foi melhor no ano todo */
  for(const pre of ['c1_','c2_']){
    const s=acharStage(pre+R.id);
    if(!s)continue;
    (s.ranking||[]).forEach((id,i)=>somar(id,Math.max(0,4-i)*0.25));
  }
  const t2=(G.regioes[R.id].t2||[]).slice();
  return t2.sort((x,y)=>(pontos[y]||0)-(pontos[x]||0)
    ||G.times[y].prestigio-G.times[x].prestigio).slice(0,4);
}
function acharStage(id){
  for(const b of G.calendario)for(const s of b.stages)if(s.id===id)return s;
  return null;
}
function fimDeBloco(b){
  const k=b.endKey;
  if(k==='kickoff'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      G.qual.masters1.push(s.ranking[0],s.ranking[1]);
    });
  }
  if(k==='masters1'||k==='masters2'){
    const s=b.stages[0];if(!s)return;
    encerrarStage(s);
    s.ranking.forEach((id,i)=>{const R=G.times[id].regiao;G.regioes[R].pontos[id]=(G.regioes[R].pontos[id]||0)+[9,7,5,4,2,2,1,1][i];});
    /* A Riot mexe no pool depois dos torneios internacionais. É aqui que o
       mapa que você treinou meia temporada pode sair de circulação — e é isso
       que faz o treino de mapa ser aposta e não acúmulo. */
    if(typeof rotacionarMapas==='function')
      rotacionarMapas('depois do '+(k==='masters1'?'Masters I':'Masters II'));
  }
  if(k==='po1'||k==='po2'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      if(s.tier===1){
        s.ranking.forEach((id,i)=>{G.regioes[s.regiao].pontos[id]=(G.regioes[s.regiao].pontos[id]||0)+(PTS_PO[i]||0);});
        if(k==='po1'){G.qual.masters2.push(s.ranking[0],s.ranking[1]);}
      }
    });
  }
  if(k==='ascension'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      const sobe=s.ranking[0];if(!sobe)return;
      const R=G.regioes[s.regiao];
      /* pior time da liga: pontos de circuito, depois campanha da temporada.
         sem o desempate, todos os times fora dos playoffs empatam em 0 e o
         rebaixado virava simplesmente o primeiro do array. */
      const ult=R.t1.slice().sort((x,y)=>{
        const a=G.times[x],b=G.times[y];
        return (R.pontos[x]||0)-(R.pontos[y]||0)
          ||(a.temporada.v-a.temporada.d)-(b.temporada.v-b.temporada.d)
          ||(a.temporada.mv-a.temporada.md)-(b.temporada.mv-b.temporada.md)
          ||a.prestigio-b.prestigio;
      })[0];
      R.t1=R.t1.filter(x=>x!==ult);R.t2=R.t2.filter(x=>x!==sobe);
      R.t1.push(sobe);R.t2.push(ult);
      G.times[sobe].tier=1;G.times[ult].tier=2;
      R.pontos[sobe]=R.pontos[sobe]||0;
      G.times[sobe].prestigio=clamp(G.times[sobe].prestigio+6,20,99);
      G.times[ult].prestigio=clamp(G.times[ult].prestigio-8,20,99);
      noticia('⬆ '+G.times[sobe].nome+' subiu para a liga principal · ⬇ '+G.times[ult].nome+' foi rebaixado.');
    });
  }
  if(k==='champions'){
    const s=b.stages[0];if(!s)return;
    encerrarStage(s);
    G.campeaoMundial=s.ranking[0];
    if(typeof rotacionarMapas==='function')rotacionarMapas('depois do Champions');
  }
  if(k==='offseason')fimDeTemporada();
}
