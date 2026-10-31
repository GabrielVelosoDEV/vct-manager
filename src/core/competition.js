/* ============================================================
   COMPETIÇÕES
   ============================================================ */
/* Premiação — uma escada só, derivada da importância do torneio.
   PREMIO_BASE é o prêmio do campeão do Champions; cada competição vale uma
   fração dela (PESO_EVENTO) e as colocações seguem a curva do próprio torneio.
   Reequilibrar a economia é mexer em PESO_EVENTO, não em números soltos.
   Ordem resultante: Champions > Masters > playoffs regional > Ascension >
   Kickoff > split de Challengers. */
const PREMIO_BASE=1000000;
const PESO_EVENTO={champions:1, masters:.40, po:.16, ascension:.13, kickoff:.10, chall:.04};
const CURVA_PREMIO={
  champions:[1,.52,.30,.20,.12,.12,.07,.07],
  masters  :[1,.52,.32,.22,.12,.12,.07,.07],
  po       :[1,.55,.34,.22,.13,.13,.075,.075],
  kickoff  :[1,.55,.32,.20],
  chall    :[1,.55,.32,.20],
  ascension:[1,.38]
};
/* Tabela de referência, usada como padrão quando não há catálogo. Em jogo quem
   manda é o prêmio de cada torneio em G.torneios, editável no Banco de dados —
   ver premiosDoStage() em core/torneios.js. */
/* A curva acima cobre o pódio e pouco mais. Champions tem 16 times e pagava
   8: metade do torneio saía sem nada, e era justamente a metade que estava
   quebrando. Agora a cauda continua decaindo até um piso — participar passou
   a valer dinheiro.

   PISO_PREMIO é fração do prêmio do campeão. 4% do Champions ainda é dinheiro
   de verdade; 4% de um split de Challengers é quase nada, que é o certo. */
const PISO_PREMIO=0.04;
const DECAI_CAUDA=0.82;
function curvaPremio(categoria,n){
  const base=(CURVA_PREMIO[categoria]||CURVA_PREMIO.kickoff).slice();
  if(!n||n<=base.length)return base;
  let f=base[base.length-1];
  while(base.length<n){
    f=Math.max(PISO_PREMIO,f*DECAI_CAUDA);
    base.push(f);
  }
  return base;
}
const PREMIOS=Object.fromEntries(Object.entries(CURVA_PREMIO).map(([k,c])=>
  [k,c.map(f=>Math.round(PREMIO_BASE*PESO_EVENTO[k]*f/1000)*1000)]));

const PTS_PO=[10,8,6,5,3,3,1,1];

function roundRobin(ids){
  const a=ids.slice(); if(a.length%2)a.push(null);
  const n=a.length,rodadas=[];
  for(let r=0;r<n-1;r++){
    const rd=[];
    for(let i=0;i<n/2;i++){const x=a[i],y=a[n-1-i];if(x&&y)rd.push([x,y]);}
    a.splice(1,0,a.pop());
    rodadas.push(rd);
  }
  return rodadas;
}
function novoStage(o){
  const s=Object.assign({tipo:'rr',bo:3,idx:0,feito:false,tabela:{},rodadas:[],
    vivos:[],elim:[],ranking:[],resultados:[]},o);
  s.torneioId=torneioDeStage(s.id);
  s.times.forEach(id=>s.tabela[id]={v:0,d:0,mv:0,md:0,rv:0,rd:0});
  if(s.tipo==='grupos')montarGrupos(s);
  else if(s.tipo==='de')montarDE(s);
  else if(s.tipo==='swiss')montarSwiss(s);
  else if(s.tipo==='rr')s.rodadas=roundRobin(shuffle(s.times.slice()));
  else s.vivos=s.times.slice();
  return s;
}
/* ---------- rodada: preparar é do motor, ler é de todo mundo ----------
   Sortear confronto consome o gerador semeado. Se a interface chamasse a
   função que sorteia só para desenhar "seu próximo jogo", ela empurraria o
   fluxo do RNG e mudaria o futuro da simulação — o mesmo erro que a narração
   quase cometeu. Por isso a rodada é montada UMA vez, pelo relógio, e fica
   guardada em s.rodadaAtual; quem só quer olhar lê de lá. */
function prepararRodada(s){
  if(s.feito||s.rodadaAtual)return s.rodadaAtual;
  s._rodadaV=[];s._rodadaP=[];
  s._resAntes=s.resultados.length;
  if(s.tipo==='rr'){
    s.rodadaAtual=s.rodadas[s.idx]||null;
  }else if(s.tipo==='grupos'){
    const rd=[];
    for(const g of s.grupos)(g.rodadas[s.idx]||[]).forEach(par=>rd.push(par));
    s.rodadaAtual=rd.length?rd:null;
    s.nomeRodada='Rodada '+(s.idx+1)+' de '+s.rodadasMax;
  }else if(s.tipo==='swiss'){
    if(s.idx>=s.rodadasMax){s.rodadaAtual=null;}
    else{
      const r=paresSwiss(s);
      s._byes=r.byes;s.rodadaAtual=r.pares.length?r.pares:null;
      s.nomeRodada='Rodada suíça '+(s.idx+1)+' de '+s.rodadasMax;
    }
  }else if(s.tipo==='de'){
    const r=paresDE(s);
    s.faseAtual=r.fase;s._byesDE=r.byes||[];
    s.nomeRodada=nomeRodadaDE(s);
    s.rodadaAtual=r.pares.length?r.pares:null;
  }else{
    s.rodadaAtual=s.vivos.length<=1?null:seedKO(s);
    s.nomeRodada=s.vivos.length<=2?'Final':s.vivos.length<=4?'Semifinal':'Eliminatória';
  }
  return s.rodadaAtual;
}
/* seedKO vive em core/bracket.js, junto do paresKO usado nos previews da UI */
function stageRodadaAtual(s){
  if(!s||s.feito)return null;
  return s.rodadaAtual||null;
}
/* Quantos duelos ainda faltam para o stage acabar. */
function rodadasDoStage(s){
  if(!s||s.feito)return 0;
  if(s.tipo==='rr')return Math.max(0,s.rodadas.length-s.idx);
  if(s.tipo==='grupos')return Math.max(0,s.rodadasMax-s.idx);
  if(s.tipo==='swiss')return Math.max(0,s.rodadasMax-s.idx);
  if(s.tipo==='de'){
    /* superior + inferior + grande final, com folga: é estimativa para o
       relógio caber o torneio no intervalo, não precisa ser exata */
    const n=(s.ub||[]).length+(s.lb||[]).length+(s.fila||[]).length;
    return Math.max(1,Math.ceil(Math.log2(Math.max(2,n)))*2+1);
  }
  return Math.ceil(Math.log2(Math.max(1,(s.vivos||[]).length)));
}
function stageAplicar(s,res){
  const{aId,bId,vencedor,perdedor,wa,wb}=res;
  const somar=(tab)=>{
    const ta=tab[aId],tb=tab[bId];
    if(!ta||!tb)return;
    (vencedor===aId?ta:tb).v++;(vencedor===aId?tb:ta).d++;
    ta.mv+=wa;ta.md+=wb;tb.mv+=wb;tb.md+=wa;
    res.mapas.forEach(m=>{ta.rv+=m.sa;ta.rd+=m.sb;tb.rv+=m.sb;tb.rd+=m.sa;});
  };
  somar(s.tabela);
  /* o grupo tem tabela própria: é ela que classifica, e é ela que a tela
     mostra. A tabela do stage inteiro continua existindo para o ranking final */
  if(s.tipo==='grupos'){const g=grupoDe(s,aId);if(g)somar(g.tabela);}
  if(s.tipo==='swiss'&&s.suico){
    s.suico[vencedor].v++;s.suico[perdedor].d++;
    s.suico[aId].adv.push(bId);s.suico[bId].adv.push(aId);
  }
  if(s.tipo==='de'){
    (s._rodadaV=s._rodadaV||[]).push(vencedor);
    (s._rodadaP=s._rodadaP||[]).push(perdedor);
  }
  /* Estatística POR TORNEIO. p.temp acumula a temporada inteira e não serve
     para eleger o melhor de um campeonato — o que se quer saber é quem foi o
     melhor naquelas três semanas, não no ano. */
  acumularStats(s,res);
  s.resultados.push({a:aId,b:bId,wa,wb,v:vencedor,mapa:res.mapas.map(m=>m.mapa+' '+m.sa+'-'+m.sb).join(', ')});
  /* Confronto direto: registrado aqui, no único lugar por onde TODO resultado
     de série passa. Espalhar isso pelos pontos que chamam simSerie deixaria
     algum torneio de fora e o histórico ficaria mentindo por omissão. */
  if(typeof registrarConfronto==='function')
    registrarConfronto(aId,bId,vencedor,nomeStage(s)||s.id);
  if(typeof aplicarClassico==='function')aplicarClassico(vencedor,perdedor);
  if(s.tipo==='ko')s.elim.push(perdedor);
}
/* Depois de resolver uma rodada, já monta a próxima. É de propósito: assim a
   interface consegue mostrar QUEM VEM antes de você mandar avançar — sem isso
   o chaveamento fica sempre um passo atrás e "próximo compromisso" nunca sabe
   contra quem você joga. Continua sendo o motor sorteando, e sempre no mesmo
   ponto da sequência, então a simulação não muda. */
function stageAvancar(s){
  const r=avancarStage(s);
  if(!s.feito)prepararRodada(s);
  return r;
}
function avancarStage(s){
  s.rodadaAtual=null;
  if(s.tipo==='rr'){
    s.idx++;
    if(s.idx>=s.rodadas.length){s.feito=true;s.ranking=ordenarTabela(s);}
    return;
  }
  if(s.tipo==='grupos'){
    s.idx++;
    if(s.idx>=s.rodadasMax){
      s.feito=true;
      /* o ranking do stage é a ordem de classificação: primeiro os que passam,
         na ordem em que entram no chaveamento, depois o resto por grupo */
      const passam=classificadosDosGrupos(s);
      const resto=s.grupos.flatMap(ordenarGrupo).filter(id=>!passam.includes(id));
      s.ranking=[...passam,...resto];
      s.classificados=passam;
    }
    return;
  }
  if(s.tipo==='swiss'){
    s.idx++;
    if(s.idx>=s.rodadasMax){s.feito=true;s.ranking=ordenarSwiss(s);s.classificados=s.ranking.slice();}
    return;
  }
  if(s.tipo==='de'){
    const v=[...(s._byesDE||[]),...(s._rodadaV||[])].filter((x,i,a)=>a.indexOf(x)===i);
    const p=(s._rodadaP||[]).slice();
    /* os jogos DESTA rodada, marcados na hora de montá-la. Cortar pelo fim da
       lista errava sempre que a rodada tinha bye. */
    s.chave.push({fase:s.faseAtual,nome:s.nomeRodada,
                  jogos:s.resultados.slice(s._resAntes||0)});
    avancarDE(s,v,p,s.faseAtual);
    s._byesDE=[];s._rodadaV=[];s._rodadaP=[];
    s.idx++;
    if(s.campeao){
      s.feito=true;
      s.ranking=[s.campeao,s.vice,...s.elim.slice().reverse()].filter((x,i,a)=>x&&a.indexOf(x)===i);
    }
    return;
  }
  const perdedores=new Set(s.elim);
  s.vivos=[...(s._byes||[]),...s.vivos.filter(id=>!perdedores.has(id))].filter((v,i,a)=>a.indexOf(v)===i);
  s._byes=[];
  if(s.vivos.length<=1){s.feito=true;s.ranking=[...s.vivos,...s.elim.slice().reverse()];}
  s.idx++;
}
function ordenarTabela(s){
  return s.times.slice().sort((x,y)=>{
    const a=s.tabela[x],b=s.tabela[y];
    return b.v-a.v||(b.mv-b.md)-(a.mv-a.md)||(b.rv-b.rd)-(a.rv-a.rd);
  });
}
function pagar(ids,tabela){
  ids.forEach((id,i)=>{const v=tabela[i]||0;if(!v)return;G.times[id].caixa+=v;
    if(id===G.meuTime)noticia('Premiação recebida: '+money(v),{c:'clube',t:[id]});});
}
/* Encerramento de um stage: paga, entrega o título e elege o melhor jogador.
   Num lugar só porque as três coisas acontecem sempre juntas — espalhadas por
   fimDeBloco(), sempre faltava uma em algum torneio. Fases de grupo e suíça
   não encerram nada: elas classificam, quem paga é o mata-mata. */
function encerrarStage(s){
  if(!s||s._encerrado)return null;
  s._encerrado=true;
  pagar(s.ranking,premiosDoStage(s));
  const campeao=s.ranking&&s.ranking[0];
  if(campeao){titulo(campeao,nomeTitulo(s),s.regiao==='INT'?3:s.tier===2?1:2);
    /* título internacional conta à parte: é ele que separa lenda de bom jogador */
    if(s.regiao==='INT'&&G.times[campeao])G.times[campeao].titulares.forEach(pid=>{
      const c=G.jogadores[pid]&&G.jogadores[pid].carreira;if(c)c.intl=(c.intl||0)+1;});}
  /* O vice também entra na história. Só a semeadura de 2021–2025 contava
     finais perdidas: no jogo, um clube podia perder dez decisões e a ficha
     dele continuava marcando zero vice — um número que nunca mudava e por
     isso não dizia nada. */
  const vice=s.ranking&&s.ranking[1];
  if(vice&&G.times[vice]&&campeao&&vice!==campeao){
    const tv=G.times[vice];
    tv.vices=(tv.vices||0)+1;
    tv.prestigio=clamp(tv.prestigio+0.6,20,99);
  }
  s.mvp=melhorDoTorneio(s);
  fixarMVP(s);              /* grava a foto antes de o jogador poder se aposentar */
  const r=resumoMVP(s);
  if(r){
    r.p.carreira.mvpTorneios=(r.p.carreira.mvpTorneios||0)+1;
    noticia('⭐ '+r.p.nome+' ('+(r.time?r.time.tag:'—')+') é o melhor jogador de '+
            nomeTitulo(s)+' — '+r.acs+' de ACS e '+r.kd+' de K/D em '+r.maps+' mapas.',{c:'competicoes',p:[r.p.id],t:[r.time&&r.time.id]});
  }
  return s.mvp;
}
function titulo(id,nome,imp){
  const t=G.times[id];if(!t)return;
  t.titulos.push(G.ano+' · '+nome);t.prestigio=clamp(t.prestigio+2.2,20,99);
  t.titulares.forEach(pid=>G.jogadores[pid].carreira.titulos++);
  if(typeof CARGOS!=='undefined')CARGOS.forEach(c=>{
    const m=membroDe(t,c.id);if(m)m.temp.titulos++;
  });
  G.historico.push({ano:G.ano,evento:nome,campeao:t.nome});
  noticia('🏆 '+t.nome+' é campeão de '+nome+'.',{c:'competicoes',t:[t.id],imp:imp||2});
}
/* ---------- sala de imprensa ----------
   Cada notícia tem categoria (o) e quem ela cita: jogadores (p) e clubes (t).
   "Do seu clube" é decidido aqui, na hora, e não na tela: o jogador pode
   trocar de clube depois, e a notícia continua sendo de quando aconteceu.
   imp vai de 1 a 3 e escolhe a manchete da semana na Central. */
const CAT_NOTICIA={clube:'Meu clube',mercado:'Mercado',competicoes:'Competições',meta:'Meta e mapas',carreira:'Carreira'};
const NOTICIAS_MAX=240;
function noticia(txt,o){
  o=o||{};
  const p=(o.p||[]).filter(id=>id&&G.jogadores[id]);
  const t=(o.t||[]).filter(id=>id&&G.times[id]).filter((x,i,a)=>a.indexOf(x)===i);
  const n={b:G.bloco,ano:G.ano,s:G.semana,txt,c:o.c||'outros'};
  const eu=G.meuTime;
  if(eu&&(t.includes(eu)||p.some(id=>{const j=G.jogadores[id];return j.timeId===eu||j.base===eu;})))n.meu=1;
  if(p.length)n.p=p;
  if(t.length)n.t=t;
  if(o.imp)n.imp=o.imp;
  G.noticias.unshift(n);
  if(G.noticias.length>NOTICIAS_MAX)G.noticias.pop();
}
/* A manchete: a notícia mais importante das duas últimas semanas, com
   peso extra para o que é do seu clube. */
function manchete(){
  let melhor=null,nota=0;
  for(const n of G.noticias){
    if(n.ano!==G.ano||n.s==null||n.s<(G.semana||1)-1)break;
    if(n.c==='sistema'||!n.txt)continue;
    const v=(n.imp||1)+(n.meu?1.5:0);
    if(v>nota){nota=v;melhor=n;}
  }
  return nota>=2?melhor:null;
}
