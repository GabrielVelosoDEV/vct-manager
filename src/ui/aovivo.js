/* ============================================================
   PARTIDA AO VIVO
   ------------------------------------------------------------
   A simulação sempre foi round a round; o que faltava era
   revelar em sequência em vez de entregar o placar pronto.

   Duas decisões dão o tom:

   1. RITMO VARIÁVEL. Round comum passa rápido, pistol e match
      point seguram. Um relógio constante vira barra de progresso;
      o que prende é a tela desacelerar quando o jogo aperta.

   2. A PARTIDA JÁ ACONTECEU. Nada aqui muda resultado — é uma
      leitura do que o motor decidiu. Por isso pular é seguro e
      está sempre à mão: ninguém é obrigado a assistir.
   ============================================================ */

let AV=null;   /* estado da transmissão em andamento */

const AV_VEL=[['0.5','lento',1.8],['1','normal',1],['2','rápido',0.5],['4','turbo',0.25]];
const AV_MS_BASE=1150;   /* round de peso zero, na velocidade normal */
const AV_MS_PICO=2600;   /* round de peso 1 */

function avFechar(){
  if(AV&&AV.timer)clearTimeout(AV.timer);
  AV=null;
  const m=$('#modal');if(m)m.innerHTML='';
}

/* Ponto de entrada: chamado no lugar de modalPartida quando a preferência
   estiver ligada e a partida for sua. */
function partidaAoVivo(res){
  if(!res||!res.mapas||!res.mapas.length)return modalPartida(res);
  const souA=res.aId===(typeof clubeDoUsuario==='function'?clubeDoUsuario():G.meuTime);
  const meu=G.times[souA?res.aId:res.bId], adv=G.times[souA?res.bId:res.aId];
  AV={
    res,souA,meu,adv,
    mapaIdx:0,roundIdx:0,
    vel:parseFloat(Prefs.get('velocidadeAoVivo')||'1'),
    pausado:false,timer:null,
    linhas:[],       /* narração revelada até agora, do mapa corrente */
    mapasFeitos:[]   /* {mapa, meu, dele, fecho} */
  };
  avPintar();
  avAgendar(600);
}

/* ============================================================
   TRANSMISSÃO CONDUZIDA
   ------------------------------------------------------------
   A outra metade do "A PARTIDA JÁ ACONTECEU" lá de cima. Ela
   continua verdadeira quando a partida foi resolvida pelo
   relógio — e é falsa aqui: neste modo a série é jogada round a
   round ENQUANTO você assiste, porque pedido de tempo dentro de
   um placar já calculado é teatro.

   O que muda é só quem gira a manivela. O motor é o mesmo:
   abrirSerie/passoRound/fecharSerie, exatamente as funções que
   simPartida() usa. Por isso o resultado continua sendo do
   motor, e não da tela.
   ============================================================ */
function partidaConduzida(S,ctx,aoFim){
  const souA=S.aId===(typeof clubeDoUsuario==='function'?clubeDoUsuario():G.meuTime);
  const meu=G.times[souA?S.aId:S.bId], adv=G.times[souA?S.bId:S.aId];
  AV={
    S,ctx,aoFim,conduzida:true,
    res:{aId:S.aId,bId:S.bId,bo:S.bo,mapas:[],vencedor:null},
    souA,meu,adv,
    mapaIdx:0,roundIdx:0,
    vel:parseFloat(Prefs.get('velocidadeAoVivo')||'1'),
    pausado:false,timer:null,
    linhas:[],mapasFeitos:[],
    streak:0,ultimo:null,
    aviso:null      /* recado do pedido de tempo, para a narração dizer */
  };
  /* o seu lado pede tempo por você; com a preferência desligada, a comissão */
  /* no modo jogador quem pede tempo é o técnico do clube (IA), não você */
  if(Prefs.get('tempoTecnico')&&!(typeof modoJogador==='function'&&modoJogador()))S[souA?'manualA':'manualB']=true;
  serieAbrirMapa(S);
  avPintar();
  avAgendar(700);
}
/* Termina a série sem animar e devolve o resultado a quem pediu. */
function avEncerrarConduzida(){
  const S=AV.S;
  /* pulou para o fim: a comissão assume os tempos que sobraram */
  S.manualA=S.manualB=false;
  if(S.M){S.M.manualA=S.M.manualB=false;}
  while(!S.fim){
    if(!S.M&&!serieAbrirMapa(S))break;
    while(!S.M.fim)passoRound(S.M);
    const r=serieFecharMapa(S);
    if(r&&!AV.mapasFeitos.some(x=>x.mapa===r.mapa)){
      const m=AV.souA?r.sa:r.sb, d=AV.souA?r.sb:r.sa;
      AV.mapasFeitos.push({mapa:r.mapa,meu:m,dele:d,
        fecho:narrarFimDeMapa(r,AV.souA,AV.meu.tag,AV.adv.tag)});
    }
  }
  const res=fecharSerie(S,AV.ctx);
  AV.res=res;AV.fim=true;
  return res;
}
/* Um round da série conduzida. */
function avPassoConduzido(){
  const S=AV.S;
  if(!S.M){
    if(!serieAbrirMapa(S)){
      const res=avEncerrarConduzida();
      if(AV.aoFim)AV.aoFim(res);
      avPintar(true);return;
    }
    AV.linhas=[];AV.roundIdx=0;AV.streak=0;AV.ultimo=null;
    if(AV.velAntes!=null){AV.vel=AV.velAntes;AV.velAntes=null;}   /* mapa novo: a transmissão volta ao ritmo */
    avPintar();avAgendar(1200/AV.vel);return;
  }
  /* modo jogador: round seu abre a gameplay e a transmissão espera (ui/diadejogo.js) */
  if(S.jogador&&typeof avTalvezJogar==='function'&&avTalvezJogar())return;
  const h=passoRound(S.M);
  if(!h){                     /* mapa acabou */
    const r=serieFecharMapa(S);
    if(r){
      const m=AV.souA?r.sa:r.sb, d=AV.souA?r.sb:r.sa;
      AV.mapasFeitos.push({mapa:r.mapa,meu:m,dele:d,
        fecho:narrarFimDeMapa(r,AV.souA,AV.meu.tag,AV.adv.tag)});
      AV.mapaIdx++;
    }
    if(S.fim){
      const res=fecharSerie(S,AV.ctx);
      AV.res=res;AV.fim=true;
      if(AV.aoFim)AV.aoFim(res);
      avPintar(true);return;
    }
    AV.linhas=[];AV.roundIdx=0;
    avPintar();avAgendar(1600/AV.vel);return;
  }
  const vencedorMeu=AV.souA?h.v:!h.v;
  if(AV.ultimo===vencedorMeu)AV.streak++;else AV.streak=1;
  AV.ultimo=vencedorMeu;
  const l=narrarRound(h,{souA:AV.souA,meuTag:AV.meu.tag,advTag:AV.adv.tag,
                         streak:AV.streak,ultimo:false});
  if(AV.aviso){l.texto=AV.aviso+' '+l.texto;AV.aviso=null;}
  AV.linhas.unshift(l);
  /* tempo que a comissão pediu sozinha depois de uma sequência ruim */
  if(h.tempoPedido){
    const meuPediu=(h.tempoPedido==='A')===AV.souA;
    const tag=meuPediu?AV.meu.tag:AV.adv.tag;
    AV.linhas.unshift({texto:'⏱ '+tag+' pede tempo para acalmar o time.',peso:0.4,meu:meuPediu,
      lado:l.lado,placar:l.placar,tempo:true});
  }
  AV.roundIdx++;
  if(S.M.fim){                /* o round que acabou de sair fechou o mapa */
    avPintar();
    avAgendar(900/AV.vel);
    return;
  }
  avPintar();
  avAgendar((AV_MS_BASE+(AV_MS_PICO-AV_MS_BASE)*l.peso)*AV.vel);
}
/* O pedido de tempo. Só existe no modo conduzido — no modo que apenas revela
   uma partida já resolvida ele não teria como mudar nada, e um botão que não
   muda nada é pior do que botão nenhum. */
function avPedirTempo(opcao){
  if(!AV||!AV.conduzida||!AV.S||!AV.S.M)return;
  const ehA=AV.souA;
  const r=pedirTempo(AV.S.M,ehA,opcao);
  AV.escolhendoTempo=false;
  if(!r)return;
  const l={texto:'⏱ '+AV.meu.tag+' pede tempo: '+r.rot.toLowerCase()+'. '+r.restam+' restante(s) neste mapa.',
           peso:0.5,meu:true,lado:AV.linhas[0]?AV.linhas[0].lado:'atk',
           placar:AV.linhas[0]?AV.linhas[0].placar:{meu:AV.S.M.sa,dele:AV.S.M.sb},
           tempo:true};
  AV.aviso=null;
  AV.linhas.unshift(l);
  avPintar();
}

function avMapaAtual(){return AV.res.mapas[AV.mapaIdx];}

/* ---------- o analista na transmissão ----------
   Lê o mapa em andamento e diz uma coisa só: a mais útil agora. Quanto
   melhor o analista, mais cedo ele lê o adversário, mais preciso ele é e
   mais ele conta (o foco deles, quanto rende a mudança). Analista fraco só
   fala quando a coisa é gritante. Só existe na partida conduzida, que é
   onde o tempo pedido muda alguma coisa. */
const FOCO_NOME={execucao:'execução',default:'default',retake:'retake'};
function avConselho(){
  if(!AV||!AV.conduzida||!AV.S||!AV.S.M||AV.fim)return null;
  const M=AV.S.M, ehA=AV.souA, t=AV.meu;
  const nivel=(t.staff&&t.staff.analista)||1;
  const membro=typeof membroDe==='function'?membroDe(t,'analista'):null;
  const quem=membro?membro.nome:'O analista';
  const tempos=ehA?M.temposA:M.temposB;
  const seq=ehA?(M.seqPerdaA||0):(M.seqPerdaB||0);
  const r=M.r;
  if(r<1)return{quem,membro,nivel,txt:'Primeiro round: vamos ver como eles chegam no pistol.',id:null};
  /* 1. o time sangrando: tempo para acalmar */
  if(seq>=3&&!(ehA?M.bonusA:M.bonusB))
    return{quem,membro,nivel,txt:'Perdemos '+seq+' seguidos e o time está pilhado. Um tempo para acalmar corta a sequência.',id:'acalmar'};
  /* 2. a tática: o analista precisa de rounds para ler o adversário */
  const leitura=r>=Math.max(2,8-nivel)?leituraDoTempo(M,ehA):[];
  const melhor=leitura[0];
  const limiar=nivel>=4?0.45:nivel>=3?0.7:1.2;
  if(melhor&&melhor.ganho>=limiar){
    const adv=AV.adv, delaFoco=Object.assign({},adv.tatica,(ehA?M.tatB:M.tatA)||{}).foco||'default';
    const quanto=nivel>=4?' (cerca de +'+melhor.ganho.toFixed(1)+' por round até o fim do mapa)':'';
    const porque=/^(execucao|default|retake)$/.test(melhor.id)
      ?(nivel>=3?'Eles estão jogando em '+FOCO_NOME[delaFoco]+'. ':'Eles parecem preparados para o nosso jeito de jogar. ')
      :melhor.id==='travado'?(melhor.lado==='def'?'Agora é defesa: segurar o ímpeto rende mais aqui. ':'O nosso elenco rende mais esperando o erro deles. ')
      :(melhor.lado==='atk'?'Agora é ataque: ir para cima rende mais aqui. ':'O nosso elenco tem mira para ganhar duelo. ');
    return{quem,membro,nivel,txt:porque+'Sugiro: '+melhor.rot.toLowerCase()+quanto+'.',id:melhor.id};
  }
  /* 3. sem nada a mudar: uma leitura do mapa */
  const h=M.hist||[];
  const meus=h.filter(x=>(ehA?x.v:!x.v));
  const pist=h.filter(x=>x.pistol);
  const pistMeu=pist.filter(x=>(ehA?x.v:!x.v)).length;
  const lado=ehA?M.ladoA:(M.ladoA==='atk'?'def':'atk');
  const noLado=h.filter(x=>(ehA?x.lado:(x.lado==='atk'?'def':'atk'))===lado);
  const ganhosLado=noLado.filter(x=>(ehA?x.v:!x.v)).length;
  const frase=pist.length&&r<=3?(pistMeu?'Pistol nosso: é hora de aproveitar a vantagem de economia.':'Perdemos o pistol: o próximo é de economia, segurem a arma para o terceiro.')
    :noLado.length>=4?(lado==='atk'?'No ataque: ':'Na defesa: ')+ganhosLado+' de '+noLado.length+' rounds. '+(ganhosLado/noLado.length>=0.5?'O plano está funcionando, sigam assim.':'Está difícil, mas a tática ainda é a melhor que temos.')
    :'Por enquanto o plano está certo. Sigam assim.';
  return{quem,membro,nivel,txt:frase,id:null,leve:true};
}
function avConselhoHTML(){
  const c=avConselho();if(!c)return '';
  const pode=c.id&&avPodePedirTempo();
  return `<div class="av-analista ${c.leve?'leve':''}">
    ${c.membro&&typeof retratoStaff==='function'?retratoStaff(c.membro,38):`<span class="av-an-ic">${icone('radar')}</span>`}
    <div class="av-an-t"><span class="eyebrow">Analista${c.membro?' · '+esc(c.quem):''}</span><span>${esc(c.txt)}</span></div>
    ${pode?`<button class="btn sm" data-tempo="${c.id}">Pedir tempo: ${esc((TEMPO_OPCOES.find(o=>o.id===c.id)||{}).rot||'')}</button>`
      :c.id&&!avPodePedirTempo()?'<span class="dim" style="font-size:12px">sem tempo sobrando</span>':''}
  </div>`;
}
/* O botão de tempo só aparece quando ele pode fazer alguma coisa: partida
   sendo conduzida, mapa em andamento, preferência ligada e tempo sobrando. */
function avPodePedirTempo(){
  return !!(AV&&AV.conduzida&&AV.S&&AV.S.M&&!AV.fim
            &&Prefs.get('tempoTecnico')
            &&typeof podePedirTempo==='function'&&podePedirTempo(AV.S.M,AV.souA));
}
function avNarracaoAtual(){
  return narrarMapa(avMapaAtual(),AV.souA,AV.meu.tag,AV.adv.tag);
}

function avAgendar(ms){
  if(!AV||AV.fim)return;
  if(AV.timer)clearTimeout(AV.timer);
  if(AV.pausado||AV.escolhendoTempo)return;
  AV.timer=setTimeout(avPasso,Math.max(60,ms));
}

function avPasso(){
  if(!AV||AV.fim)return;
  if(AV.conduzida)return avPassoConduzido();
  /* Passar do último mapa não é um estado possível de desenhar: avMapaAtual()
     devolve undefined e a narração quebra ao ler o histórico dele. Acontecia
     de verdade — o timer do avanço automático dispara mais uma vez depois de
     você clicar em "pular para o fim", e a tela morria com a partida já
     decidida. */
  if(AV.mapaIdx>=AV.res.mapas.length){AV.fim=true;avPintar(true);return;}
  const mapa=avMapaAtual();
  const narr=avNarracaoAtual();
  if(AV.roundIdx>=narr.length){
    /* mapa acabou */
    const meu=AV.souA?mapa.sa:mapa.sb, dele=AV.souA?mapa.sb:mapa.sa;
    AV.mapasFeitos.push({mapa:mapa.mapa,meu,dele,
      fecho:narrarFimDeMapa(mapa,AV.souA,AV.meu.tag,AV.adv.tag)});
    AV.mapaIdx++;AV.roundIdx=0;AV.linhas=[];
    if(AV.mapaIdx>=AV.res.mapas.length){AV.fim=true;avPintar(true);return;}
    avPintar();avAgendar(1600/AV.vel);   /* respiro entre mapas */
    return;
  }
  const l=narr[AV.roundIdx];
  AV.linhas.unshift(l);
  AV.roundIdx++;
  avPintar();
  const ms=(AV_MS_BASE+(AV_MS_PICO-AV_MS_BASE)*l.peso)*AV.vel;
  avAgendar(ms);
}

function avPular(){
  if(!AV)return;
  if(AV.timer)clearTimeout(AV.timer);
  if(AV.conduzida){
    const res=avEncerrarConduzida();
    if(AV.aoFim)AV.aoFim(res);
    AV.linhas=[];
    avPintar(true);
    return;
  }
  /* completa o que falta sem animar, para o resumo final ficar correto */
  while(AV.mapaIdx<AV.res.mapas.length){
    const mapa=avMapaAtual();
    const meu=AV.souA?mapa.sa:mapa.sb, dele=AV.souA?mapa.sb:mapa.sa;
    if(!AV.mapasFeitos.some(x=>x.mapa===mapa.mapa))
      AV.mapasFeitos.push({mapa:mapa.mapa,meu,dele,
        fecho:narrarFimDeMapa(mapa,AV.souA,AV.meu.tag,AV.adv.tag)});
    AV.mapaIdx++;
  }
  AV.linhas=[];
  AV.fim=true;
  avPintar(true);
}

function avPintar(fim){
  if(!AV)return;
  /* No modo conduzido o mapa corrente ainda está sendo jogado: ele vem do
     estado do motor, não da lista de mapas prontos. */
  /* Entre um mapa e o outro, o estado do motor é nulo por um instante — e a
     tela pintava "mapa 2 de 3" sem nome, 0 a 0 e sem feed. Nesse intervalo o
     que interessa é o mapa que ACABOU, com o próximo anunciado. */
  const noIntervalo=AV.conduzida&&!AV.S.M&&!AV.fim;
  const ultimoFeito=AV.conduzida?(AV.S.mapas[AV.S.mapas.length-1]||null):null;
  const mapa=AV.conduzida
    ?(AV.S.M?{mapa:AV.S.M.mapa,sa:AV.S.M.sa,sb:AV.S.M.sb,hist:AV.S.M.hist}
            :(ultimoFeito||{mapa:'—',sa:0,sb:0,hist:[]}))
    :AV.res.mapas[Math.min(AV.mapaIdx,AV.res.mapas.length-1)];
  const proximoMapa=noIntervalo?(AV.S.veto.mapas[AV.S.idx]||null):null;
  const totalMapas=AV.conduzida?AV.S.veto.mapas.length:AV.res.mapas.length;
  const parcial=AV.linhas.find(x=>x&&x.placar&&!x.tempo)||AV.linhas[0];
  const meuR=noIntervalo?(AV.souA?mapa.sa:mapa.sb)
    :parcial&&parcial.placar?parcial.placar.meu:(fim?(AV.souA?mapa.sa:mapa.sb):0);
  const delR=noIntervalo?(AV.souA?mapa.sb:mapa.sa)
    :parcial&&parcial.placar?parcial.placar.dele:(fim?(AV.souA?mapa.sb:mapa.sa):0);
  const mapasMeu=AV.mapasFeitos.filter(x=>x.meu>x.dele).length;
  const mapasDel=AV.mapasFeitos.filter(x=>x.dele>x.meu).length;
  const venci=AV.res.vencedor===AV.meu.id;

  /* série em slots: um por mapa, na cor de quem venceu */
  const nomesMapas=AV.conduzida?AV.S.veto.mapas:AV.res.mapas.map(m=>m.mapa);
  const slots=nomesMapas.map((nm,i)=>{
    const f=AV.mapasFeitos[i];
    const cls=f?(f.meu>f.dele?'meu':'dele'):(i===AV.mapasFeitos.length&&!fim?'agora':'');
    return `<span class="av-slot ${cls}" title="${esc(nm)}${f?' · '+f.meu+'–'+f.dele:''}"><i></i>${esc(nm)}</span>`;
  }).join('');
  const meuLado=parcial&&parcial.lado&&!fim&&!noIntervalo?parcial.lado:null;
  const chipLado=(l)=>l?`<span class="av-ladoch ${l}">${l==='atk'?icone('spike')+' ataque':icone('escudo2')+' defesa'}</span>`:'';
  const cabeca=`
    <div class="av-placar"${mapa&&mapa.mapa&&mapa.mapa!=='—'?` style="${fundoMapa(mapa.mapa,0.7)}"`:''}>
      <div class="av-lado ${meuR>delR?'up':''}" style="--clube:${corDoClube(AV.meu)}">
        <span class="av-esc">${escudo(AV.meu,64)}</span><div><b>${esc(AV.meu.tag)}</b><span class="dim">${esc(AV.meu.nome)}</span>
        ${chipLado(meuLado)}</div>
      </div>
      <div class="av-numeros">
        ${typeof seloClassico==='function'?seloClassico(AV.meu,AV.adv):''}
        <div class="av-mapanome">${fim?'Série encerrada':esc(mapa.mapa||'—')}</div>
        ${fim?`<div class="av-rounds"><span class="${mapasMeu>mapasDel?'up':''}">${mapasMeu}</span>
          <i>:</i><span class="${mapasDel>mapasMeu?'dn':''}">${mapasDel}</span></div>`
        :`<div class="av-rounds"><span class="${meuR>delR?'up':''}">${meuR}</span>
          <i>:</i><span class="${delR>meuR?'dn':''}">${delR}</span></div>`}
        <div class="av-slots">${slots}</div>
      </div>
      <div class="av-lado r ${delR>meuR?'dn':''}" style="--clube:${corDoClube(AV.adv)}">
        <div class="r"><b>${esc(AV.adv.tag)}</b><span class="dim">${esc(AV.adv.nome)}</span>
        ${chipLado(meuLado?(meuLado==='atk'?'def':'atk'):null)}</div><span class="av-esc">${escudo(AV.adv,64)}</span>
      </div>
    </div>`;

  const trilha=(()=>{
    if(fim)return '';
    if(AV.conduzida){
      const h=(AV.S.M&&AV.S.M.hist)||(ultimoFeito&&ultimoFeito.hist)||[];
      return trilhaRounds(h,AV.souA,{agora:true});
    }
    const mp=avMapaAtual();
    return trilhaRounds(mp?(mp.hist||[]).slice(0,AV.roundIdx):[],AV.souA,{agora:true});
  })();

  /* destaque rápido: pistol, clutch, match point, sequência, fim de mapa.
     Só anima quando o round é novo — pausar e voltar não repete o efeito. */
  const novo=AV.linhas[0];
  let destaque='';
  if(!fim&&novo&&!novo.tempo){
    const rot=/MAPA SEU|mapa deles/.test(novo.texto)?(novo.meu?'Mapa seu':'Mapa deles')
      :novo.clutch?'Clutch':/match point/.test(novo.texto)?(novo.meu&&!/contra/.test(novo.texto)?'Match point':'Match point contra')
      :novo.pistol?'Pistol':novo.streak>=4?novo.streak+' seguidos':'';
    if(rot){
      const anima=AV._destVisto!==AV.linhas.length;
      AV._destVisto=AV.linhas.length;
      destaque=`<div class="av-destaque ${novo.meu?'bom':'ruim'} ${anima?'anima':''}">${esc(rot)}</div>`;
    }
  }
  const linhaFeed=(x,i)=>{
    const p=i===0&&x.fk?G.jogadores[x.fk]:null;
    return `<div class="av-linha ${x.tempo?'tempo':(x.meu?'bom':'ruim')}${i===0?' novo':''}">
      ${p?`<span class="av-quem">${retrato(p,34)}</span>`:''}
      <span class="av-como">${x.tempo?icone('relogio'):iconeRound(x.como)}</span>
      <span class="num dim">${x.placar?x.placar.meu+'–'+x.placar.dele:'·'}</span> <span class="av-txt">${esc(x.texto)}</span></div>`;
  };
  const mapaMini=m=>`<span class="av-mp" style="${fundoMapa(m.mapa,0.3)}">${esc(m.mapa)}</span>`;

  const corpo=fim?`
    <div class="av-fim ${venci?'bom':'ruim'}">
      <div class="av-fim-t">${venci?'Vitória':'Derrota'}</div>
      <div class="dim">${esc(AV.meu.nome)} ${mapasMeu} — ${mapasDel} ${esc(AV.adv.nome)}</div>
    </div>
    <div class="card flat"><div class="eyebrow">Como foi</div>
      ${AV.mapasFeitos.map(m=>`<div class="av-linha ${m.fecho.tom}">${mapaMini(m)}
        <span class="num">${m.meu}–${m.dele}</span> ${esc(m.fecho.texto)}</div>`).join('')}
    </div>
    ${typeof relatorioAnalistaHTML==='function'?relatorioAnalistaHTML(AV.res&&AV.res.analise):''}`
   :`
    <div class="av-mapa"><span class="eyebrow">Mapa ${Math.min(AV.mapaIdx+1,totalMapas)} de ${totalMapas}</span>
      ${noIntervalo&&proximoMapa?`<span class="chip">a seguir · ${esc(proximoMapa)}</span>`:''}
      <span class="av-leg">${['elim','spike','defuse','tempo'].map(c=>`<span>${iconeRound(c)}${COMO_ROUND[c][1]}</span>`).join('')}</span>
    </div>
    ${trilha}
    ${destaque}
    ${avConselhoHTML()}
    ${noIntervalo&&AV.mapasFeitos.length?`<div class="av-feed">
      ${AV.mapasFeitos.slice().reverse().map(m=>`<div class="av-linha ${m.fecho.tom}">${mapaMini(m)}
        <span class="num">${m.meu}–${m.dele}</span> ${esc(m.fecho.texto)}</div>`).join('')}
    </div>`:''}
    <div class="av-feed">${AV.linhas.slice(0,9).map(linhaFeed).join('')}</div>`;

  const controles=fim?`
    <button class="btn" id="avFicha">Ver a ficha completa</button>
    <button class="btn ghost" id="avSair">Fechar</button>`
   :`
    <button class="btn ghost" id="avPausa">${AV.pausado?'Continuar':'Pausar'}</button>
    ${avPodePedirTempo()?(AV.escolhendoTempo
      ?`<span class="av-tempo">${TEMPO_OPCOES.map(o=>`<button class="btn ghost sm" data-tempo="${o.id}"
          title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}
        <button class="btn ghost sm" id="avTempoCancela">Voltar</button></span>`
      :`<button class="btn" id="avTempo">${icone('relogio')} Pedir tempo
      <span class="chip">${AV.S.M?(AV.souA?AV.S.M.temposA:AV.S.M.temposB):0}</span></button>`):''}
    <span class="av-vels">${AV_VEL.map(([v,rot,mult])=>
      `<button class="${Math.abs(AV.vel-mult)<0.01?'on':''}" data-vel="${mult}">${rot}</button>`).join('')}</span>
    <button class="btn" id="avPular">Pular para o fim</button>`;

  abrir(`<div class="aovivo">${cabeca}${corpo}
    <div class="av-controles">${controles}</div></div>`,true,true);

  const on=(sel,fn)=>{const el=$('#modal').querySelector(sel);if(el)el.onclick=fn;};
  on('#avPausa',()=>{AV.pausado=!AV.pausado;avPintar();if(!AV.pausado)avAgendar(120);});
  /* pedir tempo pausa a partida até você escolher o que fazer com ele */
  on('#avTempo',()=>{AV.escolhendoTempo=true;if(AV.timer)clearTimeout(AV.timer);avPintar();});
  on('#avTempoCancela',()=>{AV.escolhendoTempo=false;avPintar();if(!AV.pausado)avAgendar(300);});
  $('#modal').querySelectorAll('[data-tempo]').forEach(b=>b.onclick=()=>{
    avPedirTempo(b.dataset.tempo);avPintar();if(!AV.pausado)avAgendar(700);});
  on('#avPular',avPular);
  on('#avFicha',()=>{const r=AV.res;avFechar();aba=0;modalPartida(r);});
  on('#avSair',avFechar);
  $('#modal').querySelectorAll('[data-vel]').forEach(b=>b.onclick=()=>{
    AV.vel=parseFloat(b.dataset.vel);
    Prefs.set('velocidadeAoVivo',String(AV.vel));
    avPintar();avAgendar(120);
  });
}
