/* ============================================================
   O PLANO DE JOGO — três decisões simples e o retorno de cada uma
   ------------------------------------------------------------
   Táticas e treino tinham controle demais e retorno de menos:
   agressividade de 1 a 5, foco, intensidade de scrim, bloco de
   treino, tática por mapa, plano individual, mapa da semana — e
   nenhuma resposta depois do jogo dizendo o que funcionou.

   Agora o caminho principal é:
   1. ESTILO DO TIME — quatro jeitos de jogar. Cada um é a mesma
      agressividade e o mesmo foco de sempre por baixo (o motor não
      mudou), escolhidos de um jeito que se entende: forte contra
      quem, fraco contra quem, e o quanto combina com o elenco.
   2. A SEMANA — Recuperar, Equilibrada, Intensa ou Estudar o
      adversário. O auxiliar monta o plano de cada jogador e o
      treino de mapa a partir dela, toda semana, com o cansaço do
      momento. Quem quiser mexer jogador por jogador continua
      podendo (Avançado), e a semana vira "personalizada".
   3. O RETORNO — depois de cada série, o analista diz o que
      funcionou, o que custou e o que mudar, com números tirados do
      próprio motor; depois de cada semana, quem evoluiu e em quê.
      E cada estilo guarda o próprio retrospecto.

   Nada aqui sorteia: o motor continua dono do gerador.
   ============================================================ */

/* ---------- 1. estilos ---------- */
const ESTILOS={
  agressivo:{nome:'Agressivo',ic:'fogo',tatica:{agres:4,foco:'execucao'},forte:'controle',fraco:'defensivo',
    desc:'Entra rápido e decide no duelo. Rende no ataque e em mapa que favorece o ataque; cobra na defesa.'},
  controle:{nome:'Controle de mapa',ic:'mapa',tatica:{agres:3,foco:'default'},forte:'defensivo',fraco:'agressivo',
    desc:'Toma espaço com utilidade e espera o erro. Sólido nos dois lados, sem pico.'},
  defensivo:{nome:'Defensivo',ic:'escudo2',tatica:{agres:2,foco:'retake'},forte:'agressivo',fraco:'controle',
    desc:'Segura o bomb e retoma o site. Rende na defesa e contra quem ataca rápido.'},
  adaptavel:{nome:'Adaptável',ic:'radar',tatica:null,forte:null,fraco:null,
    desc:'Lê o próximo adversário e joga o contra-estilo dele. Depende do analista: sem leitura, joga o natural do elenco.'}
};
const ESTILO_DO_FOCO={execucao:'agressivo',default:'controle',retake:'defensivo'};
const CONTRA_FOCO={default:'execucao',retake:'default',execucao:'retake'};
function nomeEstilo(id){return id==='personalizado'?'Personalizado':(ESTILOS[id]||{}).nome||id;}
/* O estilo em vigor. Save antigo não tem: sai da tática, ou é personalizado. */
function estiloDe(t){
  if(!t)return 'controle';
  if(t.estilo&&(ESTILOS[t.estilo]||t.estilo==='personalizado'))return t.estilo;
  for(const k of ['agressivo','controle','defensivo'])
    if(t.tatica&&t.tatica.agres===ESTILOS[k].tatica.agres&&t.tatica.foco===ESTILOS[k].tatica.foco)return k;
  return 'personalizado';
}
/* Estilo que a tática atual de um clube parece (para o relatório falar do adversário). */
function estiloAparente(tat){return ESTILO_DO_FOCO[(tat&&tat.foco)||'default']||'controle';}
/* A tática que o estilo escolhe, contra um adversário (ou o próximo). */
function taticaDoEstilo(t,id,adv){
  if(ESTILOS[id]&&ESTILOS[id].tatica)return Object.assign({},ESTILOS[id].tatica);
  /* adaptável: agressividade do elenco, foco contra o do adversário se houver leitura */
  const perfil=typeof perfilAgressivo==='function'?perfilAgressivo(t):0;
  const agres=clamp(3+Math.round(perfil/5),1,5);
  adv=adv||(typeof proximoAdversarioDe==='function'?proximoAdversarioDe(t):null);
  const nv=adv?(typeof nivelScoutContra==='function'?nivelScoutContra(t,adv):nivelScout(t)):0;
  const foco=adv&&nv>=3?CONTRA_FOCO[(adv.tatica&&adv.tatica.foco)||'default']:(typeof focoNatural==='function'?focoNatural(t):'default');
  return{agres,foco};
}
function definirEstilo(t,id){
  if(!t||!ESTILOS[id])return{ok:false,erro:'Estilo inválido.'};
  t.estilo=id;
  Object.assign(t.tatica,taticaDoEstilo(t,id));
  return{ok:true,msg:'Estilo: '+ESTILOS[id].nome+'.'};
}
/* Clube novo nas suas mãos: o estilo que mais rende para o elenco e a semana
   equilibrada, os dois no automático. */
function iniciarPlano(t){
  if(!t)return;
  const enc=encaixeEstilos(t);
  const melhor=['agressivo','controle','defensivo'].sort((a,b)=>enc[b].ganho-enc[a].ganho)[0];
  definirEstilo(t,melhor);
  t.semanaModo='equilibrada';
  aplicarModoSemana(t);
}
/* Mexeu nos controles finos: o estilo vira personalizado. */
function marcarEstiloPersonalizado(t){if(t)t.estilo='personalizado';}
/* Adaptável relê o adversário toda semana (e antes do jogo). */
function atualizarEstilo(t,adv){
  if(t&&estiloDe(t)==='adaptavel')Object.assign(t.tatica,taticaDoEstilo(t,'adaptavel',adv));
}

/* Força média de uma tática nos mapas da rotação, dos dois lados, contra uma
   tática de adversário. Lê forcaTime e vantagemTatica com a tática trocada
   por um instante, como o preparo do mapa já faz. */
function _forcaComTatica(t,tat,mapas,advTat){
  const guarda=t.tatica;
  const falso={tatica:Object.assign({},advTat||{agres:3,foco:'default'})};
  let s=0,n=0;
  try{
    t.tatica=Object.assign({},guarda,tat);
    for(const mp of mapas){
      const v=vantagemTatica(t,falso);
      s+=forcaTime(t,mp,'atk')+v+forcaTime(t,mp,'def')+v;n+=2;
    }
  }finally{t.tatica=guarda;}
  return n?s/n:0;
}
/* Quanto cada estilo rende para este elenco, contra a liga como ela joga
   hoje (o foco de cada adversário da liga), em pontos de força por round.
   É o que vira as estrelas de encaixe. */
function encaixeEstilos(t){
  const mapas=(G.mapasAtivos||[]).slice(0,7);
  const liga=((G.regioes[t.regiao]||{})[t.tier===1?'t1':'t2']||[]).filter(i=>i!==t.id).map(i=>G.times[i]).filter(Boolean);
  const advs=liga.length?liga.map(x=>x.tatica):[{agres:3,foco:'default'}];
  const media=tat=>advs.reduce((s,a)=>s+_forcaComTatica(t,tat,mapas,a),0)/advs.length;
  const v={};
  for(const k of ['agressivo','controle','defensivo'])v[k]=media(ESTILOS[k].tatica);
  /* adaptável: o natural do elenco, mais a leitura quando o analista enxerga */
  const nat=taticaDoEstilo(t,'adaptavel',{tatica:{foco:'__'}});
  const nv=typeof nivelScout==='function'?nivelScout(t):1;
  v.adaptavel=nv>=3
    ?advs.reduce((s,a)=>s+_forcaComTatica(t,{agres:nat.agres,foco:CONTRA_FOCO[a.foco||'default']},mapas,a),0)/advs.length
    :media({agres:nat.agres,foco:typeof focoNatural==='function'?focoNatural(t):'default'});
  const base=v.controle;
  const out={};
  for(const k in v){
    const d=v[k]-base;
    out[k]={ganho:d,estrelas:clamp(Math.round(3+d/0.35),1,5)};
  }
  return out;
}

/* ---------- 2. a semana ---------- */
const MODOS_SEMANA={
  recuperar:{nome:'Recuperar',ic:'relogio',scrim:1,
    desc:'Todo mundo descansa. Limpa o cansaço; ninguém evolui.'},
  equilibrada:{nome:'Equilibrada',ic:'controle',scrim:3,
    desc:'Treino normal e dois mapas. O auxiliar põe para descansar quem está cansado.'},
  intensa:{nome:'Intensa',ic:'fogo',scrim:5,
    desc:'Todo mundo treina forte e três mapas. Evolui mais, cansa mais.'},
  estudar:{nome:'Estudar o adversário',ic:'olho',scrim:2,
    desc:'Vídeo do próximo adversário: o analista lê o estilo deles e o time entra com vantagem. Treina menos.'}
};
/* limite de cansaço acima do qual o auxiliar põe para descansar */
const DESCANSO_ACIMA={recuperar:-1,equilibrada:0.6,intensa:0.78,estudar:0.6};
/* o que vale o estudo: perto do contra-estilo (TATICA_LEITURA 1,3) */
const ESTUDO_BONUS=1.0;
function semanaModoDe(t){
  if(!t)return 'equilibrada';
  if(t.semanaModo&&(MODOS_SEMANA[t.semanaModo]||t.semanaModo==='personalizada'))return t.semanaModo;
  return Object.keys(((t.treino||{}).individual)||{}).length?'personalizada':'equilibrada';
}
function nomeModoSemana(id){return id==='personalizada'?'Personalizada':(MODOS_SEMANA[id]||{}).nome||id;}
function _proximoAdv(t){
  if(typeof proximoAdversarioDe==='function'){const a=proximoAdversarioDe(t);if(a)return a;}
  if(t.id===G.meuTime&&typeof proximoConfronto==='function'){
    try{const px=proximoConfronto();if(px&&px.adv)return G.times[px.adv]||null;}catch(e){}
  }
  return null;
}
function definirModoSemana(t,id){
  if(!t||!MODOS_SEMANA[id])return{ok:false,erro:'Semana inválida.'};
  t.semanaModo=id;
  aplicarModoSemana(t);
  return{ok:true,msg:'Semana: '+MODOS_SEMANA[id].nome+'.'};
}
function marcarSemanaPersonalizada(t){if(t)t.semanaModo='personalizada';}
/* O auxiliar monta a semana: scrim, plano de cada um e mapas. */
function aplicarModoSemana(t){
  const modo=semanaModoDe(t);
  if(!t||modo==='personalizada'||!MODOS_SEMANA[modo])return null;
  t.tatica.scrim=MODOS_SEMANA[modo].scrim;
  const adv=_proximoAdv(t);
  t.estudoAdv=modo==='estudar'&&adv?adv.id:null;
  const pl=planoDe(t);
  pl.individual={};
  const limite=DESCANSO_ACIMA[modo];
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];if(!p)continue;
    if(modo==='recuperar'||p.lesao||p.fadiga>limite||((p.pot||0)-over(p)<=1&&modo!=='intensa')){
      pl.individual[id]={tipo:'descanso',alvo:null};continue;}
    const w=ROLE_W[p.role]||ROLE_W.Flex;
    const alvo=Object.keys(w).sort((a,b)=>w[b]*(99-(p.at[b]||0))-w[a]*(99-(p.at[a]||0)))[0]||'mira';
    pl.individual[id]={tipo:'atributo',alvo};
  }
  let mapas=[];
  if(modo==='equilibrada')mapas=mapasDaSemanaIA(t).slice(0,2);
  else if(modo==='intensa')mapas=mapasDaSemanaIA(t);
  else if(modo==='estudar'){
    const pool=G.mapasAtivos||[];
    const pk=adv&&typeof ordemDeVetoProvavel==='function'?ordemDeVetoProvavel(adv,pool).picks:[];
    mapas=pk.slice(0,2).map((m,i)=>({mapa:m,prio:i?'media':'alta'}));
  }
  definirMapasTreino(t,mapas);
  return pl;
}
/* A vantagem do estudo, só contra quem foi estudado. */
function bonusEstudo(t,adv){
  return t&&adv&&t.id===G.meuTime&&semanaModoDe(t)==='estudar'&&t.estudoAdv===adv.id?ESTUDO_BONUS:0;
}
/* O que a semana deve fazer, antes de confirmar — mesmas contas do relógio. */
function previsaoSemana(t,id){
  const m=MODOS_SEMANA[id];if(!m||!t)return null;
  const neutro=typeof NIVEL_NEUTRO!=='undefined'?NIVEL_NEUTRO:3;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const nMapas=id==='recuperar'?0:id==='equilibrada'?2:id==='intensa'?3:2;
  const limite=DESCANSO_ACIMA[id];
  let soma=0,treinam=0;
  for(const p of tit){
    const descansa=id==='recuperar'||p.lesao||p.fadiga>limite;
    if(!descansa)treinam++;
    const custo=descansa?FADIGA_DESCANSO:FADIGA_TREINO+FADIGA_TREINO_MAPA*fatorTreinoMapas(nMapas);
    const novo=clamp(p.fadiga-0.035-recuperacaoEst(t)+(m.scrim-2)*0.008-((t.staff.fisio||neutro)-neutro)*0.0027+custo,0,1);
    soma+=novo-p.fadiga;
  }
  const fad=tit.length?Math.round(soma/tit.length*100):0;
  /* evolução relativa à semana equilibrada com todos treinando */
  const ritmo=(0.85+m.scrim*0.05)/(0.85+3*0.05);
  const evol=tit.length?ritmo*treinam/tit.length:0;
  const adv=id==='estudar'?_proximoAdv(t):null;
  return{fadiga:fad,evolucao:evol,treinam,de:tit.length,mapas:nMapas,adv:adv?adv.nome:null};
}

/* ---------- 3a. o relatório do analista, depois de cada série ---------- */
const RELATORIOS_MAX=8, ESTILO_HIST_MAX=60;
function _ladoDoA(h){return h.lado;}  /* o lado do time A no round */
function analisarSerie(S,ctx){
  const euA=S.aId===G.meuTime, eu=euA?S.A:S.B, ele=euA?S.B:S.A;
  const ladoMeu=h=>euA?h.lado:(h.lado==='atk'?'def':'atk');
  const venci=h=>euA?h.v:!h.v;
  const lados={atk:[0,0],def:[0,0]};let pist=[0,0];const tempos=[];
  const mapas=[];
  for(const mp of S.mapas){
    const hist=mp.hist||[];
    hist.forEach((h,i)=>{
      const l=ladoMeu(h),w=venci(h);
      if(h.r<=24){lados[l][w?0:1]++;}
      if(h.pistol){pist[1]++;if(w)pist[0]++;}
      if(h.tempoPedido&&(h.tempoPedido==='A')===euA){
        const dep=hist.slice(i+1,i+3);tempos.push({ganhou:dep.filter(venci).length,de:dep.length});}
    });
    const tatEu=mp.tat?(euA?mp.tat.A:mp.tat.B):eu.tatica, tatEle=mp.tat?(euA?mp.tat.B:mp.tat.A):ele.tatica;
    const meus=euA?mp.sa:mp.sb, deles=euA?mp.sb:mp.sa;
    mapas.push({mapa:mp.mapa,eu:meus,ele:deles,venceu:meus>deles,prep:mp.prep!=null?mp.prep:null,
      treinado:mapasDoTreino(planoDe(eu)).some(x=>x.mapa===mp.mapa),
      estilo:ESTILO_DO_FOCO[tatEu.foco||'default'],estiloAdv:ESTILO_DO_FOCO[tatEle.foco||'default'],
      rps:FOCO_VENCE[tatEu.foco||'default']===(tatEle.foco||'default')?1:FOCO_VENCE[tatEle.foco||'default']===(tatEu.foco||'default')?-1:0});
  }
  /* cansaço: o ACS de quem chegou cansado contra a média dele na temporada */
  const cansados=[];
  for(const id of eu.titulares||[]){
    const p=G.jogadores[id];if(!p||p.fadiga<0.6)continue;
    let k=0,mps=0,acs=0;
    for(const mp of S.mapas){const s=mp.st&&mp.st[id];if(s&&s.rounds){mps++;acs+=typeof acsDe==='function'?acsDe(s):0;}}
    const media=p.temp&&p.temp.maps?p.temp.acs/p.temp.maps:null;
    if(mps&&media)cansados.push({nome:p.nome,fad:Math.round(p.fadiga*100),acs:Math.round(acs/mps),media:Math.round(media),
      queda:Math.round((1-(acs/mps)/media)*100)});
  }
  /* o estilo que teria rendido mais nesses mapas, contra a tática deles */
  const nomesMapas=S.mapas.map(m=>m.mapa);
  const tatDeles=(S.mapas[0]&&S.mapas[0].tat)?(euA?S.mapas[0].tat.B:S.mapas[0].tat.A):ele.tatica;
  const usado=(S.mapas[0]&&S.mapas[0].tat)?(euA?S.mapas[0].tat.A:S.mapas[0].tat.B):eu.tatica;
  const fUsado=_forcaComTatica(eu,usado,nomesMapas,tatDeles);
  let ideal=null;
  for(const k of ['agressivo','controle','defensivo']){
    const g=_forcaComTatica(eu,ESTILOS[k].tatica,nomesMapas,tatDeles)-fUsado;
    if(!ideal||g>ideal.ganho)ideal={estilo:k,ganho:g};
  }
  const r={adv:ele.id,estilo:ESTILO_DO_FOCO[usado.foco||'default'],estiloAdv:ESTILO_DO_FOCO[tatDeles.foco||'default'],
    lados,pistol:pist,tempos,mapas,cansados,ideal,estudou:bonusEstudo(eu,ele)>0,modoSemana:semanaModoDe(eu),
    funcionou:[],custou:[],mudar:[]};
  _textosDoRelatorio(r,eu,ele);
  return r;
}
function _pctRel(a,b){return b?Math.round(a/b*100):0;}
function _textosDoRelatorio(r,eu,ele){
  const E=k=>nomeEstilo(k), F=r.funcionou, C=r.custou, M=r.mudar;
  const rpsTot=r.mapas.reduce((s,m)=>s+m.rps,0);
  if(rpsTot>0)F.push('O estilo '+E(r.estilo)+' bateu o '+E(r.estiloAdv)+' deles: vantagem tática em '+r.mapas.filter(m=>m.rps>0).length+' mapa(s).');
  if(rpsTot<0)C.push('O '+E(r.estiloAdv)+' deles leva vantagem sobre o nosso '+E(r.estilo)+'.');
  const[aw,al]=r.lados.atk,[dw,dl]=r.lados.def;
  if(aw+al>=6&&_pctRel(aw,aw+al)>=58)F.push('Ataque forte: '+aw+' de '+(aw+al)+' rounds ('+_pctRel(aw,aw+al)+'%).');
  if(dw+dl>=6&&_pctRel(dw,dw+dl)>=58)F.push('Defesa sólida: segurou '+dw+' de '+(dw+dl)+' rounds ('+_pctRel(dw,dw+dl)+'%).');
  if(aw+al>=6&&_pctRel(aw,aw+al)<=40)C.push('O ataque não andou: '+aw+' de '+(aw+al)+' rounds.');
  if(dw+dl>=6&&_pctRel(dw,dw+dl)<=40)C.push('A defesa cedeu: '+dw+' de '+(dw+dl)+' rounds.');
  if(r.pistol[1]){if(r.pistol[0]===r.pistol[1])F.push('Todos os pistols: '+r.pistol[0]+' de '+r.pistol[1]+'.');
    else if(r.pistol[0]===0)C.push('Nenhum pistol ganho em '+r.pistol[1]+'.');}
  for(const m of r.mapas){
    if(m.treinado&&m.venceu)F.push('O '+m.mapa+' que vocês treinaram rendeu '+m.eu+'–'+m.ele+'.');
    else if(m.prep!=null&&m.prep>=65&&m.venceu)F.push('Preparo alto no '+m.mapa+' ('+m.prep+') virou '+m.eu+'–'+m.ele+'.');
    if(!m.venceu&&m.prep!=null&&m.prep<45)C.push('Preparo baixo no '+m.mapa+' ('+m.prep+'): '+m.eu+'–'+m.ele+'.');
  }
  if(r.estudou)F.push('O estudo do adversário deu vantagem nos mapas (+'+ESTUDO_BONUS.toFixed(1)+' por round).');
  const tg=r.tempos.reduce((s,x)=>s+x.ganhou,0),td=r.tempos.reduce((s,x)=>s+x.de,0);
  if(td>=2)(tg/td>=0.5?F:C).push('Depois dos tempos pedidos: '+tg+' de '+td+' rounds.');
  const quedas=r.cansados.filter(c=>c.queda>=8);
  if(quedas.length)C.push(quedas.length===1?quedas[0].nome+' chegou cansado ('+quedas[0].fad+'%) e rendeu '+quedas[0].queda+'% abaixo da média dele.'
    :quedas.length+' titulares chegaram cansados e renderam em média '+Math.round(quedas.reduce((s,c)=>s+c.queda,0)/quedas.length)+'% abaixo.');
  /* o que mudar: no máximo dois, os mais concretos */
  if(r.ideal&&r.ideal.ganho>=0.5&&r.ideal.estilo!==r.estilo)
    M.push('Contra o '+E(r.estiloAdv)+' deles, o '+E(r.ideal.estilo)+' teria rendido mais nesses mapas (+'+r.ideal.ganho.toFixed(1)+' por round).');
  if(quedas.length)M.push('Uma semana de Recuperar antes do próximo jogo devolve a perna de quem está cansado.');
  const fraco=r.mapas.find(m=>!m.venceu&&m.prep!=null&&m.prep<45);
  if(fraco&&M.length<2)M.push('Treine o '+fraco.mapa+' ou tire ele no veto.');
  if(!M.length&&r.pistol[1]&&r.pistol[0]===0)M.push('Pistol é sorteio de agressividade: no Agressivo o time entra mais forte nele.');
  if(!F.length)F.push('Pouca coisa deu certo de forma clara — o resultado veio mais do nível dos elencos.');
  r.mudar=M.slice(0,2);
}
function registrarRelatorio(res,r){
  if(!r)return;
  const ele=G.times[r.adv];
  const euA=res.aId===G.meuTime;
  (G.relatorios=G.relatorios||[]).unshift({ano:G.ano,semana:G.semana,adv:r.adv,advTag:ele?ele.tag:'',
    eu:euA?res.wa:res.wb,ele:euA?res.wb:res.wa,venceu:res.vencedor===G.meuTime,r});
  if(G.relatorios.length>RELATORIOS_MAX)G.relatorios.length=RELATORIOS_MAX;
  for(const m of r.mapas){
    (G.estiloHist=G.estiloHist||[]).unshift({e:m.estilo,v:m.venceu,a:G.ano});
  }
  if(G.estiloHist&&G.estiloHist.length>ESTILO_HIST_MAX)G.estiloHist.length=ESTILO_HIST_MAX;
}
/* Retrospecto de um estilo nos últimos mapas jogados com ele. */
function retrospectoEstilo(id,n){
  const l=(G.estiloHist||[]).filter(x=>x.e===id).slice(0,n||10);
  return{v:l.filter(x=>x.v).length,d:l.filter(x=>!x.v).length};
}

/* ---------- 3b. o relatório da semana de treino ---------- */
function fotoTreino(t){
  const f={jog:{},mapas:{},fad:0};
  for(const id of t.elenco||[]){const p=G.jogadores[id];if(!p)continue;
    f.jog[id]={over:over(p),at:Object.assign({},p.at),fad:p.fadiga,ag:Object.assign({},p.agenteNivel||{})};}
  for(const mp of G.mapasAtivos||[])f.mapas[mp]=preparoDoMapa(t,mp).nota;
  return f;
}
const NOME_ATRIBUTO={mira:'mira',reflexo:'reflexo',mov:'movimentação',util:'utilidade',visao:'visão de jogo',clutch:'clutch',consist:'consistência',lider:'liderança'};
function relatorioDaSemana(t,antes){
  const pl=planoDe(t);
  const evolucoes=[],agentes=[],mapas=[];let descansaram=0;
  let fadAntes=0,fadDepois=0,n=0;
  for(const id of t.elenco||[]){
    const p=G.jogadores[id],a=antes.jog[id];if(!p||!a)continue;
    const plano=pl.individual[id]||{};
    if(plano.tipo==='descanso')descansaram++;
    if((t.titulares||[]).includes(id)){fadAntes+=a.fad;fadDepois+=p.fadiga;n++;}
    let melhor=null;
    for(const k in p.at){const d=p.at[k]-(a.at[k]||0);if(d>0.05&&(!melhor||d>melhor.d))melhor={k,d};}
    const dOver=over(p)-a.over;
    if(melhor)evolucoes.push({nome:p.nome,id,attr:NOME_ATRIBUTO[melhor.k]||melhor.k,d:melhor.d,dOver});
    if(plano.tipo==='agente'&&plano.alvo){
      const de=a.ag[plano.alvo]||0,ate=(p.agenteNivel||{})[plano.alvo]||0;
      if(ate>de)agentes.push({nome:p.nome,agente:plano.alvo,de:Math.round(de),ate:Math.round(ate)});
    }
  }
  for(const mp in antes.mapas){const ate=preparoDoMapa(t,mp).nota;if(ate!==antes.mapas[mp])mapas.push({mapa:mp,de:antes.mapas[mp],ate});}
  evolucoes.sort((x,y)=>y.d-x.d);mapas.sort((x,y)=>(y.ate-y.de)-(x.ate-x.de));
  return{ano:G.ano,semana:G.semana,modo:semanaModoDe(t),evolucoes:evolucoes.slice(0,5),agentes,mapas:mapas.slice(0,4),
    descansaram,fadAntes:n?Math.round(fadAntes/n*100):0,fadDepois:n?Math.round(fadDepois/n*100):0};
}
