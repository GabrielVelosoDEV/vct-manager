/* ============================================================
   ESCALAÇÃO EM CARTAS (pacote V8)
   ------------------------------------------------------------
   Os cinco titulares em cartas lado a lado num palco na cor do
   clube, com a função em que cada um vai jogar, o IGL e os três
   indicadores da semana (forma, desgaste e mental). O banco fica
   embaixo, em cartas menores.

   No seu clube dá para arrastar: carta do banco solta em cima de
   um titular troca os dois; titular sobre titular troca a ordem.
   A troca passa por trocarTitular() (core/lineup.js), a mesma dos
   botões, então funções e entrosamento seguem a mesma regra.
   ============================================================ */

function miniBarra(rot,v,cls){
  const pct=Math.round(clamp(v,0,1)*100);
  return `<div class="esc-mb" title="${esc(rot)} ${pct}"><span>${esc(rot)}</span><u><i class="${cls||''}" style="width:${pct}%"></i></u><b class="num">${pct}</b></div>`;
}

function slotTitular(t,p,editavel){
  const men=typeof mentalDe==='function'?mentalDe(p):p.moral;
  const fun=p.roleAtual||p.role;
  /* fora de posição é jogar numa função que ele não cobre: a secundária e a
     função de um boneco que ele domina não contam */
  const fora=fun!==p.role&&p.role!=='Flex'&&fun!==p.role2
    &&!(typeof funcoesPorDominio==='function'&&funcoesPorDominio(p).includes(fun));
  return `<div class="esc-slot" ${editavel?`data-alvo="${p.id}"`:''}>
    <div class="esc-carta" ${editavel?`draggable="true" data-arrasta="${p.id}"`:''}>${cartaJogador(p,{w:150,clique:true})}
      ${p.id===t.igl?'<span class="esc-igl" title="Capitão (IGL)">IGL</span>':''}
      ${p.lesao?`<span class="esc-lesao" title="Lesionado">${icone('lesao')} ${p.lesao} sem.</span>`:''}</div>
    <div class="esc-fun"><span class="tag ${fun}">${esc(fun)}</span>${fora?`<span class="esc-fora" title="Joga fora da função de origem (${esc(p.role)})">fora de posição</span>`:''}</div>
    ${editavel?`<div class="esc-ind">
      ${miniBarra('Forma',p.forma,p.forma>=0.7?'g':p.forma<0.4?'r':'')}
      ${miniBarra('Desgaste',p.fadiga,p.fadiga>0.7?'r':p.fadiga>0.5?'a':'')}
      ${miniBarra('Mental',men,men>=0.7?'g':men<0.4?'r':'')}
    </div>`:''}
    ${editavel&&p.id!==t.igl?`<button class="btn ghost sm esc-bt" data-igl="${p.id}">Fazer IGL</button>`:''}
  </div>`;
}
function cartaBanco(t,p,editavel){
  return `<div class="esc-banco-j" ${editavel?`data-alvo="${p.id}"`:''}>
    <div class="esc-carta" ${editavel?`draggable="true" data-arrasta="${p.id}"`:''}>${cartaJogador(p,{w:104,clique:true})}
      ${p.lesao?`<span class="esc-lesao">${icone('lesao')} ${p.lesao}</span>`:''}</div>
    <span class="dim">${esc(p.role)} · ${p.idade}a</span>
  </div>`;
}
/* t: clube; opc.editavel liga o arrastar; opc.extra(p) acrescenta HTML
   embaixo de cada carta (botões de negociação na página de outro clube) */
function escalacaoHTML(t,opc){
  opc=opc||{};
  const ed=!!opc.editavel;
  const tit=t.titulares.map(P).filter(Boolean);
  const res=t.elenco.filter(i=>!t.titulares.includes(i)).map(P).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const cor=corDoClube(t);
  const ovm=tit.length?Math.round(tit.reduce((s,p)=>s+over(p),0)/tit.length):0;
  const extra=p=>opc.extra?opc.extra(p):'';
  return `<div class="esc-palco" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
      <div class="esc-marca" aria-hidden="true">${escudo(t,300)}</div>
      <div class="esc-cab"><div><div class="eyebrow">Titulares</div>
        <span class="dim">${ed?'Arraste uma carta do banco sobre um titular para trocar os dois.':'Os cinco que jogam hoje.'}</span></div>
        <div class="esc-resumo"><span>over médio <b class="num">${ovm}</b></span><span>entrosamento <b class="num">${Math.round(t.sinergia)}</b></span>
        ${opc.botoes||''}</div></div>
      <div class="esc-tits">${tit.map(p=>`<div class="esc-col">${slotTitular(t,p,ed)}${extra(p)}</div>`).join('')}</div>
    </div>
    <div class="esc-banco ${ed?'editavel':''}"><div class="eyebrow">Banco · ${res.length}</div>
      <div class="esc-banco-l">${res.map(p=>`<div class="esc-col b">${cartaBanco(t,p,ed)}${extra(p)}</div>`).join('')
        ||'<span class="dim">Sem reservas.</span>'}</div></div>`;
}

/* arrastar e soltar */
let _arrastando=null;
function ligarEscalacao(raiz,t){
  raiz.querySelectorAll('[data-arrasta]').forEach(el=>{
    ouvir(el,'dragstart',e=>{
      _arrastando=el.dataset.arrasta;
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',_arrastando);}catch(_){}
      requestAnimationFrame(()=>el.classList.add('arrastando'));
      raiz.classList.add('esc-arrastando');
    });
    ouvir(el,'dragend',()=>{
      el.classList.remove('arrastando');raiz.classList.remove('esc-arrastando');
      raiz.querySelectorAll('.alvo').forEach(x=>x.classList.remove('alvo'));
      _arrastando=null;
    });
  });
  raiz.querySelectorAll('[data-alvo]').forEach(el=>{
    ouvir(el,'dragover',e=>{
      if(!_arrastando||_arrastando===el.dataset.alvo)return;
      /* banco sobre banco não faz nada */
      if(!t.titulares.includes(_arrastando)&&!t.titulares.includes(el.dataset.alvo))return;
      e.preventDefault();e.dataTransfer.dropEffect='move';el.classList.add('alvo');
    });
    ouvir(el,'dragleave',()=>el.classList.remove('alvo'));
    ouvir(el,'drop',e=>{
      e.preventDefault();el.classList.remove('alvo');
      const de=_arrastando||e.dataTransfer.getData('text/plain'),para=el.dataset.alvo;
      _arrastando=null;
      if(!de||de===para)return;
      const titDe=t.titulares.includes(de);
      const r=trocarTitular(t,titDe?de:para,titDe?para:de);
      if(!r||!r.ok){if(r&&r.erro)flash(r.erro);return;}
      _trocaRecente=[de,para];
      render();
      if(r.entrou&&r.saiu)flash(r.entrou.nome+' entra no lugar de '+r.saiu.nome+'.'+(r.lesionado?' Ele está lesionado e rende menos.':''));
    });
  });
  /* a carta que acabou de entrar aparece com um destaque curto */
  if(_trocaRecente){
    _trocaRecente.forEach(id=>{const c=raiz.querySelector(`[data-arrasta="${id}"]`);if(c)c.classList.add('entrou');});
    _trocaRecente=null;
  }
}
let _trocaRecente=null;
