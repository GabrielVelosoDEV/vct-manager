/* ============================================================
   FORMATOS DE TORNEIO
   ------------------------------------------------------------
   Os torneios eram pontos corridos ou eliminação simples, sem
   sorteio, sem grupo e sem chave. Um playoff era uma lista de
   nomes que ia encolhendo — não dava para olhar e entender por
   onde seu time passa nem quem ele pega se ganhar.

   O que existe aqui saiu do formato real da VCT 2026, conferido
   no vlr.gg:

   · Stage regional: fase de grupos (Alpha e Omega) e depois
     playoffs de 8 em DUPLA ELIMINAÇÃO, Bo3, final Bo5.
   · Masters: fase suíça para semear, e a mesma dupla eliminação.
   · Champions: 16 times, grupos e playoffs.

   Dupla eliminação é o ponto: perder uma vez não elimina, e é
   isso que faz o chaveamento ter duas metades e valer a pena
   olhar.
   ============================================================ */

/* ---------- sorteio por potes ----------
   Cabeça de chave não cai com cabeça de chave. Sem potes, o sorteio
   às vezes juntava os quatro melhores num grupo e a fase inteira
   perdia a graça antes de começar. */
function sortearGrupos(ids,nGrupos,nomes){
  const ordem=ids.slice().sort((a,b)=>forcaSemeadura(b)-forcaSemeadura(a));
  const grupos=[];
  for(let i=0;i<nGrupos;i++)
    grupos.push({id:String.fromCharCode(65+i),nome:(nomes&&nomes[i])||('Grupo '+String.fromCharCode(65+i)),
                 times:[],tabela:{}});
  const sorteio=[];
  const porPote=Math.ceil(ordem.length/nGrupos);
  for(let p=0;p<porPote;p++){
    const pote=shuffle(ordem.slice(p*nGrupos,(p+1)*nGrupos));
    /* serpentina: o pote seguinte entra na ordem inversa, para o grupo que
       levou o melhor do pote 1 levar o pior do pote 2 */
    const alvo=p%2?grupos.slice().reverse():grupos;
    pote.forEach((id,i)=>{
      if(!alvo[i])return;
      alvo[i].times.push(id);
      sorteio.push({pote:p+1,time:id,grupo:alvo[i].id});
    });
  }
  return{grupos,sorteio};
}
/* Quem é cabeça de chave. Prestígio manda, e os pontos de circuito da
   temporada corrente desempatam — quem foi bem este ano entra semeado. */
function forcaSemeadura(id){
  const t=G.times[id];
  if(!t)return 0;
  const R=G.regioes[t.regiao];
  const pts=(R&&R.pontos&&R.pontos[id])||0;
  return t.prestigio+pts*0.8;
}

/* ---------- fase de grupos ---------- */
const NOMES_GRUPOS=['Alpha','Omega','Delta','Sigma'];
function montarGrupos(s){
  const n=s.nGrupos||2;
  const{grupos,sorteio}=sortearGrupos(s.times,n,NOMES_GRUPOS);
  s.grupos=grupos;s.sorteio=sorteio;
  s._grupoDe={};
  for(const g of grupos){
    g.times.forEach(id=>{
      g.tabela[id]={v:0,d:0,mv:0,md:0,rv:0,rd:0};
      s._grupoDe[id]=g.id;
    });
    g.rodadas=roundRobin(shuffle(g.times.slice()));
  }
  s.rodadasMax=Math.max(...grupos.map(g=>g.rodadas.length));
  return s;
}
function grupoDe(s,id){return (s.grupos||[]).find(g=>g.id===(s._grupoDe||{})[id])||null;}
/* Classificação de um grupo. Mesma régua da tabela corrida: vitórias, saldo de
   mapas, saldo de rounds. */
function ordenarGrupo(g){
  return g.times.slice().sort((x,y)=>{
    const a=g.tabela[x],b=g.tabela[y];
    return b.v-a.v||(b.mv-b.md)-(a.mv-a.md)||(b.rv-b.rd)-(a.rv-a.rd);
  });
}
/* Quem passa: os N primeiros de cada grupo, intercalados para o chaveamento
   sair com 1ºA contra 4ºB, que é como um playoff é montado. */
function classificadosDosGrupos(s){
  const passam=s.passam||Math.max(1,Math.floor(s.times.length/(s.grupos.length*2)));
  const porGrupo=s.grupos.map(ordenarGrupo);
  const out=[];
  for(let pos=0;pos<passam;pos++)
    porGrupo.forEach(g=>{if(g[pos])out.push(g[pos]);});
  return out;
}

/* ---------- dupla eliminação ----------
   Perder uma vez manda para a chave inferior; perder duas elimina.

   A ordem das rodadas sai de uma regra só, e não de uma tabela por tamanho:
   joga-se a chave SUPERIOR quando não há ninguém recém-caído esperando E a
   inferior já está enxuta o bastante para receber os próximos eliminados.
   Fora disso, joga a inferior. É essa alternância que produz o desenho
   clássico — inferior joga duas vezes para cada uma da superior. */
function montarDE(s){
  s.ub=s.times.slice();      /* chave superior */
  s.lb=[];                   /* chave inferior */
  s.fila=[];                 /* quem acabou de cair da superior */
  s.chave=[];                /* histórico de rodadas, para desenhar a chave */
  s.elim=[];
  return s;
}
function faseDE(s){
  if(s.ub.length<=1&&s.lb.length<=1&&!s.fila.length)return 'gf';
  if(!s.fila.length&&s.ub.length>1&&s.lb.length<=s.ub.length/2)return 'ub';
  return 'lb';
}
function paresDE(s){
  const f=faseDE(s);
  if(f==='gf'){
    if(s.ub.length===1&&s.lb.length===1)return{fase:'gf',pares:[[s.ub[0],s.lb[0]]],byes:[]};
    return{fase:'gf',pares:[],byes:[]};
  }
  if(f==='ub'){
    const r=paresKO(s.ub);
    return{fase:'ub',pares:r.pares,byes:r.byes};
  }
  /* inferior: ou os recém-caídos entre si, ou os sobreviventes contra eles */
  if(s.fila.length&&!s.lb.length){
    const r=paresKO(s.fila);
    return{fase:'lb',pares:r.pares,byes:r.byes,cruz:false};
  }
  if(s.fila.length&&s.lb.length){
    /* cruzado: quem já estava embaixo pega quem acabou de cair, na ordem
       inversa, para o último a cair não reencontrar quem o eliminou */
    const a=s.lb.slice(), b=s.fila.slice().reverse(), pares=[], byes=[];
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++)pares.push([a[i],b[i]]);
    byes.push(...a.slice(n),...b.slice(n));
    return{fase:'lb',pares,byes,cruz:true};
  }
  const r=paresKO(s.lb);
  return{fase:'lb',pares:r.pares,byes:r.byes,cruz:false};
}
function nomeRodadaDE(s){
  const f=faseDE(s);
  if(f==='gf')return 'Grande final';
  if(f==='ub')return s.ub.length<=2?'Final da chave superior'
             :s.ub.length<=4?'Semifinal superior':'Quartas superiores';
  /* A rodada inferior só é FINAL quando dela sai o adversário da grande final:
     um contra um, o sobrevivente de baixo contra quem acabou de cair da final
     de cima. Chamar de final toda rodada com dois nomes fazia aparecer duas
     "finais da chave inferior" no mesmo chaveamento. */
  const lb=(s.lb||[]).length, fila=(s.fila||[]).length;
  if(lb===1&&fila===1)return 'Final da chave inferior';
  if(lb+fila<=2)return 'Semifinal inferior';
  return 'Chave inferior';
}
function avancarDE(s,vencedores,perdedores,fase){
  if(fase==='ub'){
    s.ub=vencedores;
    s.fila=perdedores;
  }else if(fase==='lb'){
    s.lb=vencedores;
    s.fila=[];
    s.elim.push(...perdedores);
  }else{
    s.campeao=vencedores[0];
    s.vice=perdedores[0];
    s.ub=vencedores;s.lb=[];
  }
}

/* ---------- fase suíça ----------
   Usada nos Masters, e só para semear: todo mundo passa, mas passa numerado.
   Cada rodada junta quem tem a mesma campanha, o que faz a última rodada
   valer alguma coisa mesmo para quem já está classificado. */
function montarSwiss(s){
  s.suico={};
  s.times.forEach(id=>s.suico[id]={v:0,d:0,adv:[]});
  s.rodadasMax=s.rodadasMax||Math.max(3,Math.ceil(Math.log2(s.times.length)));
  return s;
}
function paresSwiss(s){
  const grupos={};
  for(const id of s.times){
    const k=s.suico[id].v+'-'+s.suico[id].d;
    (grupos[k]=grupos[k]||[]).push(id);
  }
  const pares=[],sobra=[];
  Object.keys(grupos).sort().forEach(k=>{
    const fila=shuffle(grupos[k].slice()).concat(sobra.splice(0));
    while(fila.length>1){
      const a=fila.shift();
      /* evita revanche enquanto houver com quem jogar */
      let j=fila.findIndex(b=>!s.suico[a].adv.includes(b));
      if(j<0)j=0;
      pares.push([a,fila.splice(j,1)[0]]);
    }
    if(fila.length)sobra.push(fila[0]);
  });
  while(sobra.length>1)pares.push([sobra.shift(),sobra.shift()]);
  return{pares,byes:sobra.slice()};
}
function ordenarSwiss(s){
  return s.times.slice().sort((x,y)=>{
    const a=s.suico[x],b=s.suico[y],ta=s.tabela[x],tb=s.tabela[y];
    return b.v-a.v||(tb.mv-tb.md)-(ta.mv-ta.md)||(tb.rv-tb.rd)-(ta.rv-ta.rd);
  });
}

/* ============================================================
   MELHOR JOGADOR DO TORNEIO
   ------------------------------------------------------------
   p.temp acumula a temporada inteira, então não responde "quem
   foi o melhor DESTE campeonato". Aqui cada stage guarda a
   própria estatística, e no encerramento sai o MVP.

   O peso da campanha do time é de propósito: prêmio de melhor
   jogador em torneio vai quase sempre para quem chegou longe, e
   um jogador excepcional num time eliminado cedo raramente leva.
   Sem isso o MVP virava só a maior média de abates.
   ============================================================ */
function acumularStats(s,res){
  if(!res||!res.agg)return;
  s.stats=s.stats||{};
  for(const id in res.agg){
    const a=res.agg[id];
    const e=s.stats[id]||(s.stats[id]={maps:0,k:0,d:0,a:0,acs:0,fk:0,cl:0,mvp:0,timeId:(G.jogadores[id]||{}).timeId});
    e.maps+=a.maps;e.k+=a.k;e.d+=a.d;e.a+=a.a;
    e.acs+=a.acsSoma;e.fk+=a.fk;e.cl+=a.cl;
  }
  if(res.mvp&&s.stats[res.mvp])s.stats[res.mvp].mvp++;
}
const MVP_MIN_MAPAS=4;
/* Média de ACS do próprio torneio. Comparar contra um número fixo não serve:
   um Challengers inteiro joga com ACS mais baixo que um Masters, e o prêmio é
   de melhor DAQUELE campeonato. */
function acsMedioDoStage(s){
  let soma=0,mapas=0;
  for(const id in s.stats){soma+=s.stats[id].acs;mapas+=s.stats[id].maps;}
  return mapas?soma/mapas:220;
}
function notaMVP(s,id,e,media,minMapas){
  if(!e||e.maps<minMapas)return -Infinity;
  const acs=e.acs/e.maps;
  const kd=e.d?e.k/e.d:e.k;
  const porMapa=e.mvp/e.maps;              /* quantas vezes foi o melhor em quadra */
  /* onde o time dele terminou, de 1 (campeão) a 0 (último) */
  const pos=(s.ranking||[]).indexOf(e.timeId);
  const campanha=pos<0?0.35:1-(pos/Math.max(1,(s.ranking||[]).length-1));
  /* A campanha pesa, porque prêmio de torneio quase sempre vai para quem
     chegou longe — mas pesa MENOS que o desempenho somado, senão o MVP vira
     um sorteio dentro do campeão e o número na tela não significa nada. */
  return (acs/media-1)*1.9 + (Math.min(2.2,kd)-1)*0.55 + porMapa*0.95 + campanha*0.38;
}
function melhorDoTorneio(s){
  if(!s||!s.stats)return null;
  const media=acsMedioDoStage(s);
  /* O corte de mapas evita premiar quem entrou em dois e brilhou. Mas num
     torneio curto — um Ascension é uma série só — ninguém chega ao corte fixo,
     e aí ele passa a ser "quem mais jogou", que é o mesmo espírito. */
  const teto=Math.max(0,...Object.values(s.stats).map(e=>e.maps));
  const minMapas=Math.min(MVP_MIN_MAPAS,teto);
  let melhor=null,nota=-Infinity;
  for(const id in s.stats){
    const n=notaMVP(s,id,s.stats[id],media,minMapas);
    if(n>nota){nota=n;melhor=id;}
  }
  return melhor;
}
/* Foto do prêmio, gravada na hora em que ele é dado.

   O jogador pode se aposentar — e aposentado é APAGADO de G.jogadores. Sem
   esta foto, o MVP de um Champions desaparecia do registro junto com ele, e a
   tela ficava sem dizer quem tinha ganho. Prêmio é história: não pode depender
   de a pessoa ainda estar em atividade. */
function fixarMVP(s){
  const id=s&&s.mvp;const p=id&&G.jogadores[id];const e=id&&s.stats&&s.stats[id];
  if(!p||!e)return null;
  s.mvpFicha={id,nome:p.nome,pais:p.pais,role:p.role,
    tag:e.timeId&&G.times[e.timeId]?G.times[e.timeId].tag:'—',
    timeId:e.timeId||null,
    maps:e.maps,acs:Math.round(e.acs/Math.max(1,e.maps)),
    kd:Number((e.d?e.k/e.d:e.k).toFixed(2)),mvps:e.mvp};
  return s.mvpFicha;
}
/* Linha de leitura do MVP, para a tela e para a notícia. Prefere o jogador
   vivo, para a ficha dele abrir; cai na foto quando ele já se aposentou. */
function resumoMVP(s){
  const id=s&&s.mvp;const p=id&&G.jogadores[id];const e=id&&s.stats&&s.stats[id];
  if(p&&e)return{p,maps:e.maps,acs:Math.round(e.acs/Math.max(1,e.maps)),
         kd:(e.d?e.k/e.d:e.k).toFixed(2),mvps:e.mvp,
         time:e.timeId&&G.times[e.timeId]?G.times[e.timeId]:null};
  const f=s&&s.mvpFicha;
  if(!f)return null;
  return{p:{id:f.id,nome:f.nome,pais:f.pais,role:f.role,aposentado:true},
         maps:f.maps,acs:f.acs,kd:String(f.kd),mvps:f.mvps,
         time:f.timeId&&G.times[f.timeId]?G.times[f.timeId]:{tag:f.tag,nome:f.tag}};
}
