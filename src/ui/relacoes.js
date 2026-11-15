/* ============================================================
   MODO JOGADOR — a tela de Relações (J4)
   O técnico (confiança, chance de jogar e o que pesa, conversa),
   os conflitos da semana, o clima do time e cada colega.
   ============================================================ */

function _barraPct(v,tom){return `<div class="rl-b"><i class="${tom||''}" style="width:${Math.max(0,Math.min(100,v))}%"></i></div>`;}
function _tomConf(c){return c>=65?'up':c<35?'dn':'';}
function cardChanceDeJogar(compacto){
  const ch=typeof chanceDeJogar==='function'?chanceDeJogar():null;
  if(!ch)return '';
  const tom=ch.pct>=65?'up':ch.pct<35?'dn':'';
  const frase=ch.lesao?'Lesionado: fora da próxima escalação.'
    :ch.fixo?'Titular prometido nas primeiras semanas da carreira.'
    :ch.dentro?`No cinco${ch.rival?`; ${esc(ch.rival.nome)} é quem entraria no seu lugar`:''}.`
    :`Fora do cinco${ch.rival?`; a vaga em disputa é a de ${esc(ch.rival.nome)}`:''}.`;
  return `<div class="rl-chance"><div class="split"><div class="eyebrow">Chance de jogar a próxima</div><b class="num rl-pct ${tom}">${ch.pct}%</b></div>
    ${_barraPct(ch.pct,tom)}<p class="dim">${frase}</p>
    ${compacto?'':`<div class="rl-fat">${ch.fatores.map(f=>`<div><span>${esc(f.rot)}</span><b class="num ${f.rot==='Over na função'?'':f.v>0?'up':f.v<0?'dn':''}">${f.rot==='Over na função'?f.v:(f.v>0?'+':'')+f.v}</b><i class="dim">${esc(f.txt)}</i></div>`).join('')}</div>
    <p class="dim">O técnico escala no começo de cada semana: over na função e cobertura, mais condição e confiança. Os números ao lado do over são pontos que ele soma ou tira.</p>`}</div>`;
}
/* ---------- Relações ----------
   O técnico com a foto e a confiança no medidor, a chance de jogar, as
   conversas como cartões (com o que cada uma arrisca à vista), os conflitos
   do vestiário e os colegas como cartas, com a dupla de cada um com você. */
const RL_ICONE={jogar:'jogar',funcao:'troca',feedback:'balao',reclamar:'alerta',apoiar:'aperto',cobrar:'alerta',duo:'controle'};
function _rlAnel(v,px,tom){
  const r=(px-8)/2,c=2*Math.PI*r,pct=clamp(v/100,0,1);
  const cor=tom==='up'?'var(--teal)':tom==='dn'?'var(--red)':'var(--amber,#E2B45A)';
  return `<svg class="rl-anel" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/>
    <circle class="jx-anel-v" cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round" style="--c:${c.toFixed(1)}" stroke-dasharray="${(c*pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${px/2} ${px/2})"/>
    <text x="${px/2}" y="${px/2+5}" text-anchor="middle">${Math.round(v)}</text></svg>`;
}
function vJRelacoes(){
  const p=meuJogador(), t=clubeDoJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  if(!t)return `<div class="card">${vazio('<b>Sem clube, sem vestiário.</b> As relações começam quando você assinar.','vestiario')}</div>`;
  const conf=confTecnico(), conv=_conversou('tec');
  const opT=opcoesComTecnico();
  const ev=eventosJogador();
  const log=(G.voce.relLog||[]).slice(0,6);
  const colegas=(t.elenco||[]).filter(i=>i!==p.id).map(i=>G.jogadores[i]).filter(Boolean)
    .sort((a,b)=>((t.titulares||[]).includes(b.id)-(t.titulares||[]).includes(a.id))||over(b)-over(a));
  const moralMed=Math.round((t.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).reduce((s,x,_,a)=>s+x.moral/a.length,0)*100);
  const tec=typeof membroDe==='function'?membroDe(t,'tecnico'):null;
  const cor=corDoClube(t);
  const foto=typeof cenaFoto==='function'?cenaFoto('estrutura','gh',t,{cls:'cn-direita',foco:'placa'}):'';
  const ch=typeof chanceDeJogar==='function'?chanceDeJogar():null;
  const tomCh=ch?(ch.pct>=65?'up':ch.pct<35?'dn':''):'';
  const opCard=o=>o.id==='funcao'
    ?`<div class="rl-acao ${conv?'off':''}"><span class="rl-acao-ic">${ico(RL_ICONE[o.id])}</span><div><b>${esc(o.rot)}</b><p>${esc(o.dica)}</p>
       <div class="rl-acao-b"><select id="rlFuncao" ${conv?'disabled':''}>${FUNCOES_BASE.filter(f=>f!==p.role).map(f=>`<option ${p.role2===f?'selected':''}>${f}</option>`).join('')}</select>
       <button class="btn ghost sm" data-rltec="funcao" ${conv?'disabled':''}>Pedir</button></div></div></div>`
    :`<button class="rl-acao ${o.id==='reclamar'?'arrisca':''}" data-rltec="${o.id}" ${conv||o.off?'disabled':''}><span class="rl-acao-ic">${ico(RL_ICONE[o.id]||'balao')}</span><div><b>${esc(o.rot)}</b><p>${esc(o.dica)}</p></div></button>`;
  return `<section class="jx-hero rl-hero ${foto?'com-cena':''}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">${foto}
    <div class="jx-hero-in rl-hero-in">
      <div class="rl-tec-foto">${tec?retratoStaff(tec,104):''}</div>
      <div class="jx-hero-t"><div class="eyebrow">O técnico · ${esc(t.nome)}</div>
        <h2>${esc(tec?tec.nome:'Comissão técnica')}</h2>
        <div class="rl-conf2">${_rlAnel(conf,74,_tomConf(conf))}<div><b>${esc(rotuloConf(conf))}</b><span class="dim">confiança dele em você · sobe com conversa boa, presença no treino e atuação</span></div></div>
      </div>
      ${ch?`<div class="rl-chance2 ${tomCh}"><span>chance de jogar a próxima</span><b class="num">${ch.pct}%</b>
        <i class="dim">${ch.lesao?'lesionado':ch.dentro?'no cinco':'fora do cinco'}${ch.rival?' · vaga de '+esc(ch.rival.nome):''}</i></div>`:''}
    </div></section>
  <div class="rl-grade">
    <section class="card"><div class="split"><div class="eyebrow">Conversar com o técnico</div><span class="dim">${conv?'Vocês já conversaram nesta semana.':'Uma conversa por semana.'}</span></div>
      <div class="rl-acoes2">${opT.map(opCard).join('')}</div>
      ${log.length?`<div class="rl-log">${log.map(l=>`<div><span class="dim">${l.ano} · sem ${l.semana}</span> ${esc(l.txt)}${l.d?` <b class="${l.d>0?'up':'dn'}">${l.d>0?'+':''}${l.d}</b>`:''}</div>`).join('')}</div>`:''}
    </section>
    <section class="card">${cardChanceDeJogar(false)}</section>
  </div>
  ${ev.length?`<section class="card rl-ev2"><div class="eyebrow">No vestiário</div>${ev.map(e=>{const C=CONFLITOS[e.tipo], q=e.com&&G.jogadores[e.com];
    return `<div class="rl-evi2">${q?`<span class="rl-evi-f">${retrato(q,64)}</span>`:`<span class="rl-evi-f vazio">${ico('alerta')}</span>`}<div><b>${esc(C.titulo)}</b><p>${esc(e.txt)}</p>
      <div class="rl-acoes3">${C.opcoes.map(o=>`<button class="btn ${o.id==='rebater'||o.id==='responder'?'ghost':''} sm" data-rlev="${e.id}:${o.id}" title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}</div>
      <div class="dim rl-dicas">${C.opcoes.map(o=>`<span><b>${esc(o.rot)}:</b> ${esc(o.dica)}</span>`).join('')}</div></div></div>`;}).join('')}</section>`:''}
  <section class="card"><div class="split"><div class="eyebrow">Colegas · ${esc(t.nome)}</div>
      <span class="dim">Entrosamento do cinco <b>${Math.round(t.sinergia||0)}</b> · moral média <b>${moralMed}%</b>${t.seq?` · ${t.seq>0?t.seq+' vitória'+(t.seq>1?'s':'')+' seguida'+(t.seq>1?'s':''):(-t.seq)+' derrota'+(t.seq<-1?'s':'')+' seguida'+(t.seq<-1?'s':'')}`:''}</span></div>
    <div class="rl-cols">${colegas.map((q,i)=>{const d=Math.round(dupla(t,p.id,q.id)), ja=_conversou(q.id), tit=(t.titulares||[]).includes(q.id);
      return `<article class="rl-col ${tit?'tit':''}" style="--i:${i}">
        <div class="rl-col-f jrow" data-p="${q.id}">${retrato(q,84)}${tit?'<span class="rl-col-tag">titular</span>':''}${q.id===t.igl?'<span class="rl-col-tag igl">IGL</span>':''}</div>
        <div class="rl-col-t"><b>${esc(q.nome)}</b><span><span class="tag ${q.roleAtual||q.role}">${esc(q.roleAtual||q.role)}</span> over <b class="num">${over(q)}</b></span></div>
        <div class="rl-col-m"><div>${_rlAnel(d,54,d>=60?'up':d<30?'dn':'')}<span>dupla</span></div>
          <div><b class="num ${q.moral<0.45?'dn':q.moral>=0.7?'up':''}">${Math.round(q.moral*100)}%</b><span>moral</span></div></div>
        <div class="rl-col-b">${opcoesComColega(q).map(o=>`<button class="btn ghost sm" data-rlcol="${q.id}:${o.id}" ${ja?'disabled':''} title="${esc(o.dica)}">${ico(RL_ICONE[o.id]||'balao')} ${esc(o.rot)}</button>`).join('')}</div>
        ${ja?'<div class="rl-col-ja dim">já conversaram nesta semana</div>':''}</article>`;}).join('')}</div>
    <p class="dim">A dupla é o entrosamento entre vocês dois, o mesmo número que o motor usa: entre titulares, vira o entrosamento do time. Uma conversa por colega por semana; passe o mouse no botão para ver o que ela faz.</p></section>`;
}
function ligarRelacoes(v,on){
  const t=clubeDoJogador(), tec=t&&typeof membroDe==='function'?membroDe(t,'tecnico'):null;
  on('[data-rltec]',el=>{
    const op=el.dataset.rltec, extra=op==='funcao'?(v.querySelector('#rlFuncao')||{}).value:null;
    const r=conversarComTecnico(op,extra);
    if(!r.ok)flash(r.motivo);else modalConversaJogador('O técnico',r.msg,{foto:tec?retratoStaff(tec,120):'',nome:tec?tec.nome:'Técnico',cena:['estrutura','analise']});
    render();
  });
  on('[data-rlcol]',el=>{const [id,op]=el.dataset.rlcol.split(':');const q=G.jogadores[id];const r=conversarComColega(id,op);
    if(!r.ok)flash(r.motivo);else modalConversaJogador(op==='duo'?'Duo na ranked':'Conversa',r.msg,{foto:q?retrato(q,120):'',nome:q?q.nome:'',cena:op==='duo'?['cenas','ativ-ranked']:['estrutura','gh']});render();});
  on('[data-rlev]',el=>{const [id,op]=el.dataset.rlev.split(':');const r=resolverConflito(id,op);if(r.ok)modalConversaJogador('No vestiário',r.msg,{cena:['estrutura','gh']});else flash(r.motivo);render();});
}
/* a conversa numa cena: o lugar ao fundo, quem fala com a foto e a fala */
function modalConversaJogador(titulo,msg,o){
  o=o||{};
  const t=clubeDoJogador();
  const cena=o.cena&&typeof cenaFoto==='function'?cenaFoto(o.cena[0],o.cena[1],t,{foco:'placa',ansioso:true}):'';
  pintarModal(`<div class="ovl"><div class="box rl-modal ${cena?'com-cena':''}">${cena}
    <div class="rl-modal-in">${o.foto?`<div class="rl-modal-f">${o.foto}${o.nome?`<b>${esc(o.nome)}</b>`:''}</div>`:''}
      <div class="rl-modal-t"><div class="eyebrow">${esc(titulo)}</div><div class="rl-balao">${esc(msg)}</div>
        <div class="dj-acoes"><button class="btn" id="rlOk">Ok</button></div></div></div></div></div>`);
  $('#rlOk').onclick=()=>{$('#modal').innerHTML='';render();};
}
