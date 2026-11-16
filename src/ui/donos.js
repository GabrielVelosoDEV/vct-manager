/* ============================================================
   DONOS NA TELA — retrato e cartão do dono (core/donos.js)
   ============================================================ */
/* retrato: a sua foto, a do ex-jogador, a da pasta assets/donos, ou as
   iniciais nas cores do clube (empresa ganha um prédio no lugar) */
function retratoDono(d,t,px){
  px=px||56;
  if(!d)return '';
  const cor=t&&typeof corDoClube==='function'?corDoClube(t):'#5B6B7A';
  const ini=String(d.nome||'?').replace(/"[^"]*"/g,'').trim().split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const fb=svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#111A22"/>
    <rect x="3" y="3" width="58" height="58" rx="8" fill="none" stroke="${cor}" stroke-width="2.5"/>
    ${d.tipo==='pessoa'?`<text x="32" y="41" text-anchor="middle" font-family="Inter,Arial" font-weight="800" font-size="22" fill="#fff">${esc(ini||'?')}</text>`
      :`<path d="M20 48V22l12-6 12 6v26z M26 28h4v4h-4z M34 28h4v4h-4z M26 36h4v4h-4z M34 36h4v4h-4z" fill="${cor}" fill-rule="evenodd"/>`}</svg>`);
  let src='';
  if(d.voce&&d.foto)src=d.foto;
  else if(d.exId&&G.jogadores[d.exId]&&typeof retrato==='function')return retrato(G.jogadores[d.exId],px);
  else if(ASSETS.tem('donos',d.nome))src=ASSETS.arq('donos',d.nome);
  /* empresa ou organização sem foto: o "retrato corporativo" — a logo do
     clube numa placa de vidro sobre a fachada de um prédio, nas cores dele */
  if(!src&&d.tipo!=='pessoa'&&t&&typeof ASSETS.logo==='function')
    return `<span class="dono-ret dono-corp ${px<40?'p':''}" style="width:${px}px;height:${px}px;--c:${cor}" title="${esc(d.nome)}">
      <i class="dono-corp-f"></i><img src="${ASSETS.logo(t)}" alt="" onerror="this.style.display='none'"><b>${d.tipo==='empresa'?'GROUP':'ORG'}</b></span>`;
  return `<img class="dono-ret" src="${src||fb}" alt="" style="width:${px}px;height:${px}px" onerror="this.onerror=null;this.src='${fb}'">`;
}
function cardDono(t){
  const d=t&&t.dono;if(!d)return '';
  const pf=PERFIS_DONO[d.perfil]||null;
  const desde=d.desde?`desde ${d.desde}`:'';
  const ant=(t.donosAntigos||[]).slice(-3).reverse();
  return `<div class="card dono-card" style="--clube:${corDoClube(t)}">
    <div class="eyebrow">Dono</div>
    <div class="dono-topo">${retratoDono(d,t,72)}<div>
      <b class="dono-nome">${esc(d.nome)}${d.voce?' <span class="chip up">você</span>':''}</b>
      <span class="dim">${esc(rotuloTipoDono(d))}${d.empresa&&d.tipo==='pessoa'?' · '+esc(d.empresa):''}${desde?' · '+desde:''}</span>
      ${d.junto?`<span class="dim">com ${esc(d.junto)}</span>`:''}</div></div>
    ${pf?`<div class="dono-perfil"><span class="dono-tag">${esc(pf.nome)}</span><span class="dim">${esc(pf.desc)}</span></div>`:''}
    ${typeof bolsoDe==='function'&&bolsoDe(t)!==1?`<div class="dono-bolso dim">Bolso do dono: <b>${bolsoDe(t)>1?'acima do normal da divisão':'abaixo do normal da divisão'}</b> (${bolsoDe(t).toFixed(2).replace('.',',')}×)</div>`:''}
    ${ant.length?`<div class="dono-ant dim">Antes: ${ant.map(a=>esc(a.nome)+(a.ate?' (até '+a.ate+')':'')).join(' · ')}</div>`:''}
  </div>`;
}
