/* ============================================================
   MOTOR DE PARTIDA
   ============================================================ */
function condicao(p){
  return (0.88 + p.forma*0.24) * (1 - p.fadiga*0.22) * (0.92 + p.moral*0.14);
}
/* ---------- variância ----------
   Dois níveis, de propósito:
     RUIDO_ROUND  vale para todos e representa o que o round tem de sorte.
     desvioDoDia  é o time chegar bem ou mal, e varia com a consistência.
   Separar os dois é o que faz a consistência importar: o primeiro se anula
   ao longo do mapa, o segundo não. */
const RUIDO_ROUND=9;
const DIA_MAX=9.5;   /* consistência 40: time que oscila muito */
const DIA_MIN=2.0;   /* consistência 99: time que não tem dia ruim */
function desvioDoDia(t){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(!tit.length)return (DIA_MAX+DIA_MIN)/2;
  const c=tit.reduce((s,p)=>s+p.at.consist,0)/tit.length;
  return DIA_MIN+(DIA_MAX-DIA_MIN)*clamp((99-c)/59,0,1);
}

function forcaTime(t,mapa,lado){
  const rs=t.titulares.map(id=>G.jogadores[id]).filter(Boolean);
  if(!rs.length)return 40;
  let mira=0,util=0,visao=0,base=0;
  rs.forEach(p=>{
    /* entrar machucado custa: é o preço da escalação de emergência */
    const c=condicao(p)*(p.lesao?PENA_LESAO:1);
    /* over NA FUNÇÃO EM QUE ELE VAI JOGAR. Sem isso a função secundária seria
       almoço grátis: o clube cobriria qualquer buraco sem pagar nada, e a
       escalação ótima viraria "os cinco de maior over, sempre". */
    base+=overComo(p,p.roleAtual||p.role)*c;
    mira+=(p.at.mira*.6+p.at.reflexo*.4)*c;
    util+=p.at.util*c; visao+=p.at.visao*c;
  });
  /* Divide pelo número de titulares DE VERDADE. O 5 fixo assumia que o time
     sempre tem cinco; quando não tem — um elenco curto por corte de folha —
     a força despencava para perto de zero e o jogo virava atropelo, em vez de
     um time desfalcado jogando mal. */
  const n=rs.length;
  base/=n;mira/=n;util/=n;visao/=n;
  /* jogar com menos de cinco é penalidade, e uma grande */
  if(n<5){const falta=(5-n)/5;base*=1-falta*0.55;mira*=1-falta*0.5;util*=1-falta*0.5;visao*=1-falta*0.5;}
  const igl=G.jogadores[t.igl];
  const iglB=igl?(igl.at.lider-60)*0.10:-2;
  /* Escrito em torno do mesmo ponto neutro que clock.js usa. O -4 antigo era
     exatamente isto: (1.1+0.9)*NIVEL_NEUTRO. Fica explícito para as três
     fórmulas que leem comissão não saírem de novo do compasso. */
  const neutroS=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  const staffB=(t.staff.tecnico*1.1+t.staff.analista*.9)-(1.1+0.9)*neutroS;
  const sinB=(t.sinergia-55)*0.09;
  /* O mapa deixou de ser só do clube: metade vem da identidade tática do time
     e metade dos cinco que entram em quadra. Os pesos somam perto do que o
     termo valia sozinho, para não inflar de repente a importância do mapa. */
  const mapB=(t.mapPref[mapa]||0)*0.6 + afinidadeElenco(t,mapa)*0.6;
  let f = base*0.62 + mira*0.16 + util*0.11 + visao*0.11;
  f += iglB+staffB+sinB+mapB;
  f += lado==='atk' ? (mira-base)*0.10 : (visao-base)*0.10;
  f += pesoAgressividade(t,mapa,lado);
  f += pesoFoco(t,mapa,lado);
  f += coberturaFuncoes(t);
  /* A comp de agentes entra aqui: familiaridade de quem pegou o boneco, força
     do boneco no meta de hoje, e os buracos da composição. Sem este termo,
     treinar agente não mudava um round — a familiaridade existia só na ficha. */
  if(typeof pesoComp==='function')f+=pesoComp(t,mapa);
  /* Viés de lado do mapa, do dado real: em Abyss o ataque ganha 55% dos
     rounds, em Ascent 47%. É o que faz o mapa mudar de valor conforme o lado. */
  if(typeof viesLado==='function')f+=viesLado(mapa,lado);
  return f;
}
/* ---------- táticas ----------
   Medido antes de mexer, com a régua já consertada: agressividade 5 valia
   +2,4 e agressividade 1 valia −1,4; foco execução valia +3,0 e retake −0,2;
   e escolher "o foco certo para o mapa" dava −2,4. Ou seja: dois botões com
   uma resposta certa fixa e um terceiro que não fazia nada. Isso não é
   decisão, é imposto — todo clube do mundo deveria estar em agressividade 5 e
   execução, e estaria.

   O conserto tem duas partes, e as duas se apoiam em coisa que já existe:

   1. O MAPA opina. O viés de lado é dado real (MAPA_ATK, média das três ligas
      em 2026): em Abyss o ataque ganha 55% dos rounds e em Ascent 47%. Ser
      agressivo em mapa de ataque rende; ser agressivo em mapa de defesa
      cobra. A resposta certa passa a depender de onde você está jogando.

   2. O ADVERSÁRIO opina. Foco vira pedra-papel-tesoura: execução atropela
      quem está em default, default lê quem espera retake, e retake come
      execução. E como o relatório de scouting nível 4 mostra o foco deles, a
      comissão que você paga é o que transforma isso em leitura em vez de
      chute. É o mesmo motivo pelo qual existe analista no jogo. */
const TATICA_AGRES=0.85;      /* por ponto acima ou abaixo de 3, no lado */
const TATICA_PERFIL=0.035;    /* o quanto o perfil do elenco decide o resto */
const TATICA_LEITURA=0.8;     /* o que vale acertar o contra-foco */
/* Agressividade não pode ter resposta certa fixa, e a primeira tentativa ainda
   tinha: o lado que ela ajudava rendia mais do que o lado que ela cobrava, e
   agressividade 5 era de graça. Agora o efeito de LADO é simétrico — some no
   mapa inteiro, porque todo time ataca metade dos rounds — e o que sobra é o
   seu ELENCO. Cinco jogadores de mira e reflexo ganham jogando para frente;
   cinco de utilidade e visão perdem. A escolha passa a ser sobre o time que
   você montou, e não sobre qual número é maior. */
function perfilAgressivo(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  if(!rs.length)return 0;
  let duelo=0,controle=0;
  rs.forEach(p=>{duelo+=p.at.mira*0.5+p.at.reflexo*0.3+p.at.mov*0.2;
                 controle+=p.at.util*0.5+p.at.visao*0.4+p.at.consist*0.1;});
  return (duelo-controle)/rs.length;   /* tipicamente −12 a +12 */
}
function pesoAgressividade(t,mapa,lado){
  const a=(t.tatica.agres||3)-3;
  /* lado: simétrico de propósito */
  const porLado=lado==='atk'?a*TATICA_AGRES:-a*TATICA_AGRES;
  /* elenco: é aqui que mora a decisão */
  return porLado+a*perfilAgressivo(t)*TATICA_PERFIL;
}
function pesoFoco(t,mapa,lado){
  const f=t.tatica.foco||'default';
  const pend=(typeof pendorDoMapa==='function')?pendorDoMapa(mapa):0;
  if(f==='execucao')return lado==='atk'?1.1+pend*0.5:-0.6;
  if(f==='retake')  return lado==='def'?1.1-pend*0.5:-0.6;
  return 0.45;   /* default não brilha em lado nenhum e não perde em nenhum */
}
/* Pedra-papel-tesoura do foco. Precisa dos DOIS times, então mora fora de
   forcaTime e entra em abrirMapa, onde os dois estão à mão. */
const FOCO_VENCE={execucao:'default',default:'retake',retake:'execucao'};
function vantagemTatica(t,adv){
  const meu=t.tatica.foco||'default', dele=adv.tatica.foco||'default';
  if(meu===dele)return 0;
  return FOCO_VENCE[meu]===dele?TATICA_LEITURA:-TATICA_LEITURA;
}
function pesoFrag(p){return (p.at.mira*.5+p.at.reflexo*.3+p.at.mov*.2)*FRAG_W[p.role]*condicao(p);}

/* Quanto um clube quer um mapa. Sem ruído: é a leitura que o relatório de
   scouting mostra e a que o veto interativo usa para a vez da máquina — se
   sorteasse, um clique no veto mexeria no gerador semeado do motor. */
function gostaDeMapa(t,m){
  return (t.mapPref[m]||0)*0.6+afinidadeElenco(t,m)*0.6;
}
/* A sequência de pick/ban, no formato do circuito:
     Bo1  — bans alternados até sobrar um.
     Bo3  — ban, ban, pick, pick, e bans até sobrar o decider.
     Bo5  — ban, ban, quatro picks, e o que sobra é o decider.
   `passos` descreve isso sem números mágicos espalhados, e é o mesmo roteiro
   que o veto automático e o interativo seguem. */
function roteiroVeto(bo,tamPool){
  const picks = bo===1?0 : bo===3?2 : 4;
  const passos=[];
  if(picks){passos.push({tipo:'ban',lado:0});passos.push({tipo:'ban',lado:1});}
  for(let i=0;i<picks;i++)passos.push({tipo:'pick',lado:i%2});
  let restam=tamPool-passos.length, v=0;
  while(restam>1){passos.push({tipo:'ban',lado:v%2});restam--;v++;}
  passos.push({tipo:'dec',lado:null});
  return passos;
}
function veto(A,B,bo){
  const pool=G.mapasAtivos.slice();
  const seq=[];
  /* No pick/ban o clube também olha o próprio elenco: escolher um mapa que o
     time gosta e os jogadores odeiam era exatamente o tipo de decisão que só a
     preferência do clube conseguia produzir. */
  const gosta=(t,m)=>gostaDeMapa(t,m)+gauss(0,1.5);
  const banir=t=>{pool.sort((a,b)=>gosta(t,a)-gosta(t,b));const m=pool.shift();seq.push({m,tipo:'ban',t:t.tag});};
  const escolher=t=>{pool.sort((a,b)=>gosta(t,b)-gosta(t,a));const m=pool.shift();seq.push({m,tipo:'pick',t:t.tag});};
  const ordem=[A,B];
  const picks = bo===1?0 : bo===3?2 : 4;
  /* dois bans de abertura, depois os picks alternados */
  if(picks){banir(A);banir(B);}
  for(let i=0;i<picks;i++)escolher(ordem[i%2]);
  /* bans alternados até sobrar um: o decider é o mapa que ninguém quis vetar.
     Fazer isso por contagem (e não por número fixo de bans) mantém o veto
     correto com qualquer tamanho de pool. */
  let v=0;
  while(pool.length>1){banir(ordem[v%2]);v++;}
  seq.push({m:pool[0],tipo:'dec',t:'—'});
  const mapas=seq.filter(s=>s.tipo!=='ban').map(s=>s.m);
  return{seq,mapas};
}

/* ============================================================
   O MAPA, ROUND A ROUND
   ------------------------------------------------------------
   simMapa() era um laço fechado: entrava time e mapa, saía
   placar. Isso bastava enquanto a transmissão ao vivo só
   REVELAVA o que já tinha acontecido — mas pedido de tempo
   dentro de um resultado já calculado é teatro.

   Então o laço virou três peças: abrirMapa() monta o estado,
   passoRound() joga UM round, e fecharMapa() devolve o mesmo
   objeto de sempre. simMapa() continua existindo e continua
   sendo o laço — só que agora escrito em cima delas, então o
   motor é literalmente o mesmo (conferido round a round contra
   uma fotografia dos resultados anteriores). A diferença é que
   a tela também consegue conduzir, e aí o tempo pedido no 3-8
   muda o que vem depois.
   ============================================================ */
function abrirMapa(A,B,mapa){
  const st={};
  [A,B].forEach(t=>t.titulares.forEach(id=>{
    st[id]={k:0,d:0,a:0,fk:0,fd:0,cl:0,rounds:0};
  }));
  /* O "dia" do time: um deslocamento sorteado uma vez e válido para o mapa
     inteiro. É AQUI que a consistência pesa, e não no ruído por round.

     Medido antes de mexer: variar a consistência de 40 a 95 mudava o σ do
     ruído por round de 20.3 para 5.0 — quatro vezes — e a vitória do favorito
     ia de 77.1% para 80.7%. Três pontos. O motivo é que ruído por round é
     simétrico e some na média de vinte e tantos rounds; o atributo custava o
     mesmo que qualquer outro no over e não entregava quase nada.

     Dia ruim não se anula: contamina o mapa todo. Amarrar consistência a ele
     é o que dá sentido à palavra — time consistente não tem dia ruim. */
  const diaA=gauss(0,desvioDoDia(A)),diaB=gauss(0,desvioDoDia(B));
  const vA=vantagemTatica(A,B), vB=-vA;
  const fA={atk:forcaTime(A,mapa,'atk')+vA,def:forcaTime(A,mapa,'def')+vA};
  const fB={atk:forcaTime(B,mapa,'atk')+vB,def:forcaTime(B,mapa,'def')+vB};
  /* Quem começa atacando é sorteado, como no round de faca.

     Antes era sempre o time A, e isso valia 6 pontos percentuais de vitória:
     com elencos IDÊNTICOS o A ganhava 43% dos mapas. O lado mais fraco vinha
     primeiro para ele sempre, e quem cai atrás no primeiro tempo às vezes
     perde o mapa antes de chegar ao tempo em que era forte. Estar listado
     primeiro numa tabela não pode custar partida. */
  const ladoA=rnd()<0.5?'atk':'def';
  return{A,B,mapa,st,sa:0,sb:0,hist:[],
         ecoA:2,ecoB:2,perdaA:0,perdaB:0,
         diaA,diaB,fA,fB,ladoA,r:0,fim:false,
         /* pedido de tempo: dois por mapa para cada lado, como no jogo */
         temposA:TEMPOS_POR_MAPA,temposB:TEMPOS_POR_MAPA,bonusA:0,bonusB:0};
}
const TEMPOS_POR_MAPA=2;
/* Quanto o tempo pedido vale, e por quantos rounds. Não é um botão de vencer:
   é um respiro que corta a bola de neve do eco e da cabeça. */
const TEMPO_BONUS=6.5;
const TEMPO_ROUNDS=2;
function podePedirTempo(M,ehA){
  if(!M||M.fim)return false;
  return (ehA?M.temposA:M.temposB)>0;
}
/* Devolve o que aconteceu, para a narração ter o que dizer. */
function pedirTempo(M,ehA){
  if(!podePedirTempo(M,ehA))return null;
  if(ehA){M.temposA--;M.bonusA=TEMPO_ROUNDS;}
  else{M.temposB--;M.bonusB=TEMPO_ROUNDS;}
  return{ehA,restam:ehA?M.temposA:M.temposB,rounds:TEMPO_ROUNDS};
}
const ecoDeN=n=>n===0?2:n===1?(rnd()<.6?0:1):n===2?(rnd()<.5?1:2):2;
/* Um round. Toda a aleatoriedade do mapa passa por aqui, na mesma ordem de
   sempre — é o que garante que o laço reescrito dê exatamente o resultado
   antigo. */
function passoRound(M){
  if(M.fim)return null;
  const{A,B}=M;
  M.r++;
  const r=M.r;
  if(r===13)M.ladoA=M.ladoA==='atk'?'def':'atk';
  if(r>24&&(r-25)%2===0)M.ladoA=M.ladoA==='atk'?'def':'atk';
  const ladoA=M.ladoA, ladoB=ladoA==='atk'?'def':'atk';
  const pistol=(r===1||r===13||(r>24&&(r-25)%2===0));
  let dif=M.fA[ladoA]-M.fB[ladoB]+M.diaA-M.diaB;
  const ecoAntesA=M.ecoA, ecoAntesB=M.ecoB;
  if(!pistol)dif+=(M.ecoA-M.ecoB)*2.0;
  if(pistol)dif+=(A.tatica.agres-B.tatica.agres)*1.2;
  /* Round é aleatório por natureza, e essa aleatoriedade é a mesma para
     todo mundo: um único parâmetro, sem depender de atributo. */
  dif+=gauss(0,RUIDO_ROUND);
  if(r>=22||Math.abs(M.sa-M.sb)<=1&&r>18){
    const clA=A.titulares.reduce((s,i)=>s+G.jogadores[i].at.clutch,0)/5;
    const clB=B.titulares.reduce((s,i)=>s+G.jogadores[i].at.clutch,0)/5;
    dif+=(clA-clB)*0.10;
  }
  /* o tempo pedido entra DEPOIS do ruído: ele não muda a natureza do round,
     muda quem chega melhor nele */
  if(M.bonusA>0){dif+=TEMPO_BONUS;M.bonusA--;}
  if(M.bonusB>0){dif-=TEMPO_BONUS;M.bonusB--;}
  const p=1/(1+Math.exp(-dif/26));
  const venceA=rnd()<p;
  if(venceA){M.sa++;M.perdaA=0;M.perdaB++;M.ecoA=2;M.ecoB=ecoDeN(M.perdaB);}
  else{M.sb++;M.perdaB=0;M.perdaA++;M.ecoB=2;M.ecoA=ecoDeN(M.perdaA);}
  // distribuição de abates
  const W=venceA?A:B, L=venceA?B:A;
  const mortosL = rnd()<.14?4:5;
  const mortosW = Math.min(4, Math.max(0, Math.round(gauss(2.1,1.3))));
  const abertura=distribuir(W,L,mortosL,M.st);
  distribuir(L,W,mortosW,M.st);
  const heroi = venceA?A:B;
  let clutch=null;
  if(mortosW>=4 && rnd()<.42){
    const vivos=heroi.titulares.map(i=>G.jogadores[i]);
    const h=escolherPorPeso(vivos);M.st[h.id].cl++;clutch=h.id;
  }
  /* O round guarda o suficiente para ser NARRADO depois, não só contado.
     Sem placar, economia e nome de quem abriu, a tela ao vivo vira uma
     barra de progresso — e o que prende é saber o que aconteceu. */
  const linha={v:venceA,lado:ladoA,r,sa:M.sa,sb:M.sb,pistol,
               ecoA:ecoAntesA,ecoB:ecoAntesB,
               sobrou:5-mortosW,           /* quantos do vencedor sobreviveram */
               fk:abertura?abertura.de:null, fd:abertura?abertura.em:null,
               clutch};
  M.hist.push(linha);
  [...A.titulares,...B.titulares].forEach(i=>M.st[i].rounds++);
  if((M.sa>=13||M.sb>=13)&&Math.abs(M.sa-M.sb)>=2)M.fim=true;
  if(r>=24&&Math.abs(M.sa-M.sb)>=2&&(M.sa>=13||M.sb>=13))M.fim=true;
  if(r>60)M.fim=true;
  return linha;
}
function fecharMapa(M){
  /* empate só acontece no corte de 60 rounds; decidir sempre para o B era um
     viés silencioso a mais */
  const vencedor = M.sa===M.sb ? (rnd()<0.5?M.A.id:M.B.id) : (M.sa>M.sb?M.A.id:M.B.id);
  return{mapa:M.mapa,sa:M.sa,sb:M.sb,hist:M.hist,st:M.st,vencedor};
}
function simMapa(A,B,mapa){
  const M=abrirMapa(A,B,mapa);
  while(!M.fim)passoRound(M);
  return fecharMapa(M);
}
function escolherPorPeso(arr){
  const w=arr.map(p=>Math.max(1,pesoFrag(p)));
  const tot=w.reduce((a,b)=>a+b,0);let x=rnd()*tot;
  for(let i=0;i<arr.length;i++){x-=w[i];if(x<=0)return arr[i];}
  return arr[arr.length-1];
}
/* Devolve quem abriu o round, quando abriu. A narração da partida ao vivo
   precisa de um NOME — "round vencido" não emociona ninguém. */
function distribuir(atacante,vitima,n,st){
  if(n<=0)return null;
  const ka=atacante.titulares.map(i=>G.jogadores[i]);
  const kv=vitima.titulares.map(i=>G.jogadores[i]);
  const mortos=shuffle(kv.slice()).slice(0,n);
  let primeiro=null;
  mortos.forEach((m,idx)=>{
    const k=escolherPorPeso(ka);
    st[k.id].k++; st[m.id].d++;
    if(idx===0&&rnd()<.55){st[k.id].fk++;st[m.id].fd++;primeiro={de:k.id,em:m.id};}
    if(rnd()<.42){
      const outros=ka.filter(x=>x.id!==k.id);
      const as=outros[Math.floor(rnd()*outros.length)];
      if(as)st[as.id].a++;
    }
  });
  return primeiro;
}
function acsDe(s){
  if(!s.rounds)return 0;
  return Math.round((s.k*212+s.a*58+s.fk*18)/s.rounds);
}
/* ---------- a série, também em passos ----------
   Mesmo motivo do mapa: para a tela poder conduzir em vez de só reproduzir.
   simPartida() continua sendo o laço completo, escrito em cima destas peças. */
function abrirSerie(aId,bId,bo,vetoPronto){
  const A=G.times[aId],B=G.times[bId];
  /* Veto pronto vindo de fora é o veto que VOCÊ fez na tela. Chega por aqui
     para o motor continuar sendo o único dono do sorteio: a tela escolhe os
     mapas, o motor joga. */
  const v=(vetoPronto&&vetoPronto.mapas&&vetoPronto.mapas.length)
    ?{seq:vetoPronto.seq||[],mapas:vetoPronto.mapas.slice()}
    :veto(A,B,bo);
  return{A,B,aId,bId,bo,veto:v,need:Math.ceil(bo/2),
         mapas:[],wa:0,wb:0,idx:0,M:null,fim:false};
}
function serieAcabou(S){return S.wa===S.need||S.wb===S.need||S.idx>=S.veto.mapas.length;}
/* Abre o próximo mapa da série, ou devolve null quando não há mais. */
function serieAbrirMapa(S){
  if(serieAcabou(S)){S.fim=true;S.M=null;return null;}
  S.M=abrirMapa(S.A,S.B,S.veto.mapas[S.idx]);
  return S.M;
}
/* Fecha o mapa corrente e contabiliza. */
function serieFecharMapa(S){
  if(!S.M)return null;
  const r=fecharMapa(S.M);
  S.mapas.push(r);
  if(r.vencedor===S.A.id)S.wa++;else S.wb++;
  S.idx++;S.M=null;
  if(serieAcabou(S))S.fim=true;
  return r;
}
/* Fecha a série: consolida, aplica o que a partida deixa no mundo e devolve o
   MESMO objeto que simPartida sempre devolveu. */
function fecharSerie(S,ctx){
  const{A,B,aId,bId,bo}=S;
  const vencedor=S.wa>S.wb?aId:bId, perdedor=S.wa>S.wb?bId:aId;
  const agg={};
  S.mapas.forEach(mp=>{for(const id in mp.st){
    agg[id]=agg[id]||{k:0,d:0,a:0,fk:0,cl:0,rounds:0,maps:0,acsSoma:0};
    const s=mp.st[id];agg[id].k+=s.k;agg[id].d+=s.d;agg[id].a+=s.a;agg[id].fk+=s.fk;agg[id].cl+=s.cl;agg[id].rounds+=s.rounds;
    if(s.rounds>0){agg[id].maps++;agg[id].acsSoma+=acsDe(s);}
  }});
  let mvp=null,best=-1;
  for(const id in agg){
    if(G.jogadores[id].timeId!==vencedor)continue;
    const sc=acsDe(agg[id])+agg[id].cl*30;
    if(sc>best){best=sc;mvp=id;}
  }
  aplicarPos(A,B,vencedor,agg,mvp,ctx);
  /* Afinidade é POR MAPA, então tem de ser aplicada mapa a mapa — a
     consolidação acima soma tudo e perderia justamente a informação que
     interessa aqui: em qual mapa cada um foi bem. */
  S.mapas.forEach(mp=>{
    for(const id in mp.st){
      const p=G.jogadores[id],st=mp.st[id];
      if(!p||!st.rounds)continue;
      evoluirAfinidade(p,mp.mapa,acsDe(st));
    }
  });
  return{aId,bId,bo,veto:S.veto.seq,mapas:S.mapas,wa:S.wa,wb:S.wb,
         vencedor,perdedor,agg,mvp,ctx:ctx||{}};
}
function simPartida(aId,bId,bo,ctx){
  const S=abrirSerie(aId,bId,bo,ctx&&ctx.veto);
  while(!S.fim){
    if(!serieAbrirMapa(S))break;
    while(!S.M.fim)passoRound(S.M);
    serieFecharMapa(S);
  }
  return fecharSerie(S,ctx);
}
function aplicarPos(A,B,vencedor,agg,mvp,ctx){
  for(const id in agg){
    const p=G.jogadores[id],s=agg[id];
    p.temp.maps+=s.maps; p.temp.k+=s.k;p.temp.d+=s.d;p.temp.a+=s.a;
    p.temp.fk+=s.fk;p.temp.cl+=s.cl;p.temp.acs+=s.acsSoma;
    p.carreira.k+=s.k;p.carreira.d+=s.d;p.carreira.a+=s.a;p.carreira.maps+=s.maps;
    if(id===mvp)p.temp.mvp++;
    const kd=s.d?s.k/s.d:2;
    p.forma=clamp(p.forma+(kd-1.02)*0.055+gauss(0,.03),.15,1);
    p.fadiga=clamp(p.fadiga+0.05+ (A.tatica.scrim+B.tatica.scrim)/300,0,1);
    const ganhou=p.timeId===vencedor;
    p.moral=clamp(p.moral+(ganhou?0.035:-0.045),.15,1);
    if(rnd()<0.006+p.fadiga*0.012){
      const tp=G.times[p.timeId];
      /* Fisioterapeuta bom encurta a lesão. O ponto neutro é o mesmo das
         outras fórmulas (staff.js); com o 3 antigo, TODO clube de Tier 2
         alongava a lesão dos próprios jogadores mesmo com o melhor fisio da
         divisão. O k caiu junto para o Tier 1 continuar cortando o mesmo. */
      const neutroF=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
      const corte=tp?Math.round(((tp.staff.fisio||neutroF)-neutroF)*0.25):0;
      p.lesao=clamp(ri(1,3)-corte,1,6);
    }
  }
  [A,B].forEach(t=>{
    t.sinergia=clamp(t.sinergia+0.7,0,100);
  });
  const V=G.times[vencedor],P=vencedor===A.id?B:A;
  V.temporada.v++;P.temporada.d++;
  if(typeof CARGOS!=='undefined')CARGOS.forEach(c=>{
    const mv=membroDe(V,c.id);if(mv)mv.temp.v++;
    const mp=membroDe(P,c.id);if(mp)mp.temp.d++;
  });
  V.prestigio=clamp(V.prestigio+0.06,20,99);P.prestigio=clamp(P.prestigio-0.05,20,99);
}
