/* ============================================================
   A ROTINA DA SEMANA, DIA A DIA (Etapa 4)
   ------------------------------------------------------------
   Com a temporada andando um dia por vez, a semana de treino virou
   sete dias com cara própria: o dia de jogo, a recuperação do dia
   seguinte, a véspera com vídeo do adversário, a folga de domingo e
   os dias de treino ou scrim no meio.

   O "modo da semana" (core/plano.js) continua decidindo a carga
   geral, e a rotina padrão sai dele. Ela já está embutida na conta
   semanal de desenvolver (clock.js): deixar a rotina como a comissão
   montou não muda nada. O que muda é o que VOCÊ troca: cada dia
   trocado mexe, naquele dia, no cansaço e no entrosamento do elenco,
   e no fim da semana na evolução — a diferença entre o dia que você
   escolheu e o que a comissão faria.

   No modo dia a dia o efeito do dia cai quando o dia acaba (uma
   folga na quarta já tira o cansaço do jogo de quinta). No avanço
   por semana, cai tudo no fechamento.

   Só o seu clube tem rotina editável: os outros seguem o padrão,
   que é a conta antiga, e o mundo continua idêntico.
   ============================================================ */
const ROTINA_TIPOS={
  jogo:{nome:'Dia de jogo',curto:'Jogo',ic:'alvo',fixo:true,fad:0,evo:0,sin:0,moral:0,
    desc:'Aquecimento, partida e a conversa depois.'},
  scrim:{nome:'Scrim',curto:'Scrim',ic:'fogo',fad:.008,evo:1.3,sin:.12,moral:0,
    desc:'Contra outro time: entrosa e evolui mais, cansa mais.'},
  treino:{nome:'Treino',curto:'Treino',ic:'controle',fad:.004,evo:1,sin:.04,moral:0,
    desc:'O dia normal: individual e o mapa da semana.'},
  vod:{nome:'VOD e preparação',curto:'VOD',ic:'olho',fad:-.006,evo:.35,sin:.02,moral:0,
    desc:'Vídeo do adversário na véspera: leitura para o jogo, perna descansada.'},
  recuperacao:{nome:'Recuperação',curto:'Recuperar',ic:'relogio',fad:-.016,evo:.1,sin:0,moral:.002,
    desc:'Fisioterapia, sono e treino leve.'},
  folga:{nome:'Folga',curto:'Folga',ic:'casa',fad:-.024,evo:0,sin:-.02,moral:.006,
    desc:'Dia livre: o cansaço baixa e o elenco agradece.'}
};
const ROTINA_ESCOLHAS=['scrim','treino','vod','recuperacao','folga'];
/* quanto cada ponto de "evo" trocado vale na evolução da semana (6 dias úteis ≈ 1) */
const ROTINA_EVO_PESO=0.16;
/* a véspera com VOD dá metade do bônus de "Estudar o adversário" contra o próximo */
const ROTINA_VOD_ESTUDO=0.5;

/* ---------- os dias de jogo de um clube nesta semana ---------- */
function _segueVivoNoBloco(b,id){
  return !!b&&(b.stages||[]).some(s=>{
    if(s.feito||!(s.times||[]).includes(id))return false;
    if(s.tipo==='swiss')return typeof emDisputaSwiss==='function'?emDisputaSwiss(s,id):true;
    if(s.tipo==='de')return !(s.elim||[]).includes(id);
    if(s.tipo==='ko')return (s.vivos||[]).includes(id);
    return true;
  });
}
/* no fechamento da semana só valem os jogos que aconteceram: o plano do dia
   já não descreve a semana que acabou */
let _rotFechando=false;
function diasDeJogoDoClube(id){
  if(!G||!id||typeof planoDaSemana!=='function')return [];
  const out=new Set();
  if(_rotFechando){
    for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[])
      if(r.sem===G.semana&&(r.ano==null||r.ano===G.ano)&&r.dia!=null&&(r.a===id||r.b===id))out.add(r.dia);
    return [...out].sort((a,b)=>a-b);
  }
  const pl=planoDaSemana(), feitos=passosFeitos(), hoje=G.turno||0;
  const {b}=prepararSemana();
  if(b)for(const s of b.stages||[])for(const r of s.resultados||[])
    if(r.sem===G.semana&&(r.ano==null||r.ano===G.ano)&&r.dia!=null&&(r.a===id||r.b===id))out.add(r.dia);
  for(let k=feitos;k<pl.passos;k++){
    const dia=Math.max(hoje,pl.dias[k]);
    if(k===feitos){
      if(b&&b.stages.some(s=>!s.feito&&(s.rodadaAtual||[]).some(x=>x.includes(id))))out.add(dia);
    }else if(_segueVivoNoBloco(b,id))out.add(dia);
  }
  return [...out].sort((a,b)=>a-b);
}

/* ---------- a rotina padrão (o que a comissão monta) ---------- */
function rotinaPadrao(t){
  const modo=typeof semanaModoDe==='function'?semanaModoDe(t):'equilibrada';
  const jogos=new Set(diasDeJogoDoClube(t&&t.id));
  const base=modo==='recuperar'?'recuperacao':modo==='intensa'?'scrim':'treino';
  const dias=[];
  for(let d=0;d<TURNOS_SEMANA;d++){
    if(jogos.has(d)){dias.push('jogo');continue;}
    if(d===TURNOS_SEMANA-1){dias.push(modo==='intensa'&&!jogos.has(d-1)?'treino':'folga');continue;}
    if(jogos.has(d-1)){dias.push(modo==='intensa'?'treino':'recuperacao');continue;}
    if(jogos.has(d+1)){dias.push(modo==='estudar'?'vod':base);continue;}
    dias.push(modo==='estudar'&&d%2?'vod':base);
  }
  return dias;
}
/* o que vale nesta semana: as suas trocas por cima do padrão */
function _rotinaSem(t){
  if(!t)return null;
  const r=t.rotina;
  if(r&&r.ano===G.ano&&r.semana===G.semana)return r;
  t.rotina={ano:G.ano,semana:G.semana,trocas:{},feitos:{},evo:0};
  return t.rotina;
}
function rotinaDaSemana(t){
  const pad=rotinaPadrao(t), r=t&&t.id===G.meuTime?_rotinaSem(t):null;
  return pad.map((tipo,d)=>{
    const troca=r&&r.trocas[d];
    const val=tipo!=='jogo'&&troca&&ROTINA_TIPOS[troca]&&!ROTINA_TIPOS[troca].fixo?troca:tipo;
    return {dia:d,tipo:val,padrao:tipo,trocado:val!==tipo,feito:!!(r&&r.feitos[d]),hoje:d===(G.turno||0)};
  });
}
function podeTrocarDia(t,d){
  if(!t||t.id!==G.meuTime)return 'Só a rotina do seu clube.';
  if(d<(G.turno||0))return 'Esse dia já passou.';
  const r=_rotinaSem(t);
  if(r.feitos[d])return 'Esse dia já foi.';
  if(rotinaPadrao(t)[d]==='jogo')return 'Dia de jogo não muda.';
  return null;
}
function trocarDiaRotina(t,d,tipo){
  const m=podeTrocarDia(t,d);if(m)return{ok:false,erro:m};
  if(!ROTINA_TIPOS[tipo]||ROTINA_TIPOS[tipo].fixo)return{ok:false,erro:'Escolha inválida.'};
  const r=_rotinaSem(t), pad=rotinaPadrao(t)[d];
  if(tipo===pad)delete r.trocas[d];else r.trocas[d]=tipo;
  return{ok:true,msg:DIAS_CURTO[d]+': '+ROTINA_TIPOS[tipo].nome.toLowerCase()+'.'};
}
function voltarRotinaPadrao(t){const r=_rotinaSem(t);if(r)for(const d of Object.keys(r.trocas))if(!r.feitos[d])delete r.trocas[d];}

/* ---------- o efeito de um dia ----------
   A diferença entre o dia escolhido e o padrão: cansaço e entrosamento na
   hora, evolução guardada para o fechamento (desenvolver lê rotinaEvoMult). */
function aplicarDiaRotina(t,d){
  if(!t||t.id!==G.meuTime)return null;
  const r=_rotinaSem(t);
  if(r.feitos[d])return null;
  const dia=rotinaDaSemana(t)[d];
  r.feitos[d]=dia.tipo;
  if(!dia.trocado)return dia;
  const A=ROTINA_TIPOS[dia.tipo], P=ROTINA_TIPOS[dia.padrao];
  const df=A.fad-P.fad, dm=A.moral-P.moral, ds=A.sin-P.sin;
  const recup=typeof recuperacaoEst==='function'?recuperacaoEst(t):0;
  for(const id of t.elenco||[]){
    const p=G.jogadores[id];if(!p||p.lesao)continue;
    /* o centro de saúde faz a folga render um pouco mais */
    p.fadiga=clamp(p.fadiga+(df<0?df*(1+recup*4):df),0,1);
    if(dm)p.moral=clamp(p.moral+dm,.15,1);
  }
  if(ds&&typeof mexerDupla==='function'&&typeof paresDe==='function')
    for(const [a,b] of paresDe((t.titulares||[]).filter(id=>G.jogadores[id])))mexerDupla(t,a,b,ds);
  r.evo+=A.evo-P.evo;
  /* no "Estudar o adversário" o VOD já é o padrão e o bônus é o do estudo */
  if(dia.tipo==='vod'){
    const adv=typeof _proximoAdv==='function'?_proximoAdv(t):null;
    if(adv)t.vodVespera={adv:adv.id,ano:G.ano,semana:G.semana};
  }
  return dia;
}
/* os dias que ainda não caíram (avanço por semana, ou o domingo) */
function noFechamentoDaSemana(fn){
  const antes=_rotFechando;_rotFechando=true;
  try{return fn();}finally{_rotFechando=antes;}
}
function fecharRotinaDaSemana(t){
  if(!t||t.id!==G.meuTime)return;
  _rotFechando=true;
  try{for(let d=0;d<TURNOS_SEMANA;d++)aplicarDiaRotina(t,d);}finally{_rotFechando=false;}
}
/* multiplicador da evolução da semana, lido por desenvolver */
function rotinaEvoMult(t){
  if(!t||t.id!==G.meuTime||!t.rotina||t.rotina.ano!==G.ano||t.rotina.semana!==G.semana)return 1;
  return Math.max(0.3,1+t.rotina.evo*ROTINA_EVO_PESO);
}
/* a véspera com VOD contra este adversário (soma ao estudo, que é maior) */
function bonusVodVespera(t,adv){
  const v=t&&t.vodVespera;
  if(!v||!adv||t.id!==G.meuTime||v.adv!==adv.id||v.ano!==G.ano||Math.abs(G.semana-v.semana)>1)return 0;
  return (typeof ESTUDO_BONUS!=='undefined'?ESTUDO_BONUS:1)*ROTINA_VOD_ESTUDO;
}
/* o que as trocas fazem na semana, para a tela */
function previsaoRotina(t){
  const dias=rotinaDaSemana(t);
  let fad=0,evo=0,sin=0;
  for(const d of dias){if(!d.trocado)continue;const A=ROTINA_TIPOS[d.tipo],P=ROTINA_TIPOS[d.padrao];
    fad+=A.fad-P.fad;evo+=A.evo-P.evo;sin+=A.sin-P.sin;}
  return{fadiga:Math.round(fad*100),evolucao:Math.max(0.3,1+evo*ROTINA_EVO_PESO),sinergia:Math.round(sin*10*10)/10,trocas:dias.filter(d=>d.trocado).length};
}

/* ---------- o fim de um dia (avancarDia chama) ---------- */
function fimDoDia(d){
  if(G.meuTime&&G.times[G.meuTime])aplicarDiaRotina(G.times[G.meuTime],d);
  if(G.voce&&typeof rotinaJogadorDoDia==='function')rotinaJogadorDoDia(d);
}
