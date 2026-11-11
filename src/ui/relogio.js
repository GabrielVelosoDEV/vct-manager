/* ============================================================
   O RELÓGIO NA TELA
   ------------------------------------------------------------
   Avançar trocava a tela de uma vez: piscava e pronto. Aqui o
   calendário vira na frente de você, dia a dia, para o tempo ter
   peso — um dia de janela é uma folha, uma semana são sete, um
   salto até o próximo jogo passa rápido mas passa.

   Como funciona: o botão marca a data de antes (relogioMarcar);
   quem aplica o avanço chama relogioTocar. Os toques do mesmo
   instante viram uma animação só (o avanço até o seu jogo passa
   por dias e semanas numa tacada). A tela nova já está desenhada
   por baixo; a folha do calendário some e revela. Clicar pula.
   Nada aqui mexe no estado do jogo.
   ============================================================ */
let _relAntes=null, _relInfo=null, _relTimer=null, _relFim=null;

function _relData(){
  if(!G)return null;
  const dia=typeof turnosNaTela==='function'&&turnosNaTela()?(G.turno||0):0;
  return dataDoDia(G.ano,G.semana||1,dia);
}
function relogioMarcar(){
  if(_relFim)_relFim();               /* clicou de novo no meio: termina a anterior */
  _relAntes=_relData();_relInfo=null;
}
function relogioLigado(){
  if(typeof document==='undefined'||!document.body)return false;
  if(Prefs.get('animarTempo')===false||Prefs.get('animacoes')===false)return false;
  try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;}catch(e){}
  return true;
}
/* info: {legenda, semanas} — o último toque do instante vence */
function relogioTocar(info){
  if(info)_relInfo=Object.assign(_relInfo||{},info);
  if(_relTimer)return;
  _relTimer=setTimeout(()=>{
    _relTimer=null;
    const de=_relAntes,ate=_relData(),inf=_relInfo||{};
    _relAntes=null;_relInfo=null;
    if(!de||!ate||!relogioLigado())return;
    const dias=Math.round((ate-de)/86400000);
    if(dias<=0)return;
    _relAnimar(de,dias,inf);
  },0);
}

function _relLegenda(inf,dias){
  if(inf.legenda)return inf.legenda;
  if(G&&janelaAberta(G.ano,G.semana||1)){
    const d=diasAteFecharJanela(G.ano,G.semana||1,G.turno||0);
    return 'Janela aberta · '+(d<=1?'último dia':'fecha em '+d+' dias');
  }
  if(dias>=14)return Math.round(dias/7)+' semanas depois';
  return dias===1?'Um dia depois':dias>=7?'Uma semana depois':dias+' dias depois';
}

function _relAnimar(de,dias,inf){
  const ovl=document.createElement('div');
  ovl.className='rl-ovl';
  const dt=n=>new Date(de.getTime()+n*86400000);
  const semana=d=>(d.getUTCDay()+6)%7;           /* 0 = segunda */
  const pinta=d=>({dia:d.getUTCDate(),mes:MESES_CURTO[d.getUTCMonth()],ano:d.getUTCFullYear(),sem:semana(d)});
  const ini=pinta(dt(0));
  ovl.innerHTML=`<div class="rl-card">
      <div class="rl-topo"><span class="rl-mes">${ini.mes}</span><span class="rl-ano">${ini.ano}</span></div>
      <div class="rl-folha"><span class="rl-num">${ini.dia}</span></div>
      <div class="rl-semana">${DIAS_LONGO[ini.sem]}</div>
      <div class="rl-dias">${DIAS_CURTO.map((x,i)=>`<i class="${i<ini.sem?'foi':i===ini.sem?'hoje':''}">${x[0]}</i>`).join('')}</div>
      <div class="rl-leg"></div>
    </div>`;
  document.body.appendChild(ovl);
  const card=ovl.querySelector('.rl-card'),folha=ovl.querySelector('.rl-folha');
  const mesEl=ovl.querySelector('.rl-mes'),anoEl=ovl.querySelector('.rl-ano');
  const semEl=ovl.querySelector('.rl-semana'),pts=[...ovl.querySelectorAll('.rl-dias i')];
  const leg=ovl.querySelector('.rl-leg');
  requestAnimationFrame(()=>ovl.classList.add('on'));

  /* passos: até 21 folhas; num salto maior, pula dias para caber */
  const passos=Math.min(dias,21), salto=dias/passos;
  /* um dia: uma virada calma; muitos: cada vez mais rápido */
  const tempo=k=>dias===1?320:Math.max(38,Math.round(150*Math.pow(0.86,k)));
  let k=0,vivo=true,timer=null;
  const fim=()=>{
    if(!vivo)return;vivo=false;_relFim=null;
    clearTimeout(timer);
    ovl.classList.add('sai');ovl.classList.remove('on');
    setTimeout(()=>ovl.remove(),260);
  };
  _relFim=fim;
  ovl.onclick=fim;
  const virar=()=>{
    if(!vivo)return;
    k++;
    const d=pinta(dt(Math.round(k*salto)));
    const velho=folha.querySelector('.rl-num');
    const novo=document.createElement('span');
    novo.className='rl-num entra';novo.textContent=d.dia;
    if(velho){velho.classList.add('sai');setTimeout(()=>velho.remove(),220);}
    folha.appendChild(novo);
    if(mesEl.textContent!==d.mes){mesEl.textContent=d.mes;card.classList.add('mes-novo');setTimeout(()=>card.classList.remove('mes-novo'),300);}
    if(anoEl.textContent!==String(d.ano))anoEl.textContent=d.ano;
    semEl.textContent=DIAS_LONGO[d.sem];
    pts.forEach((p,i)=>{p.className=i<d.sem?'foi':i===d.sem?'hoje':'';});
    if(k<passos){timer=setTimeout(virar,tempo(k));return;}
    leg.textContent=_relLegenda(inf,dias);leg.classList.add('on');
    timer=setTimeout(fim,dias===1?420:560);
  };
  timer=setTimeout(virar,dias===1?140:90);
}
