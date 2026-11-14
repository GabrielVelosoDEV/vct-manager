/* ============================================================
   VALORANT WORLD CUP — o legado na tela (C5)
   ------------------------------------------------------------
   A aba Legado da tela World Cup (galeria, países, jogadores,
   técnicos, times lendários, finais históricas e recordes) e o
   bloco World Cup do perfil do jogador: selo de campeão do mundo,
   medalhas, prêmios e os números pela seleção.
   ============================================================ */
let copaLegadoSec='galeria';
const COPA_LEGADO_SECS=[['galeria','Galeria'],['paises','Países'],['jogadores','Jogadores'],['lendarios','Times lendários'],['finais','Finais históricas'],['recordes','Recordes']];

function _nomeHall(id){
  const c=garantirCopa();
  return (G.jogadores[id]||{}).nome||(c.hall&&c.hall[id]&&c.hall[id].n)||edicoesDaCopa().map(e=>e.nomes&&e.nomes[id]).find(Boolean)||'—';
}
function _jogadorLink(id,extra){
  const vivo=!!G.jogadores[id];
  return `<span class="${vivo?'jrow cpx-link':''}" ${vivo?`data-p="${id}"`:''}>${esc(_nomeHall(id))}${extra||''}</span>`;
}
function _medalhas(o,p,b){
  const m=(k,n)=>n?`<span class="cpx-medn"><i class="cpx-med ${k}"></i>${n}</span>`:'';
  return m('ouro',o)+m('prata',p)+m('bronze',b);
}

/* ---------- a aba ---------- */
function abaLegado(x){
  const eds=edicoesDaCopa();
  if(!eds.length)return `<div class="card cx-linha"><div class="cpx-vazio">${ASSETS.copa('trofeu')?`<img src="${ASSETS.copa('trofeu')}" alt="" class="cpx-vazio-taca">`:ico('trofeu')}<b>A taça ainda não tem dono.</b><span>A primeira Valorant World Cup é em ${esc(sedeDoAno(COPA_PRIMEIRA).nome)}, no fim de ${COPA_PRIMEIRA}. A galeria, os recordes e os times lendários nascem com ela.</span></div></div>`;
  const sec=copaLegadoSec;
  const corpo=sec==='paises'?legadoPaises():sec==='jogadores'?legadoJogadores():sec==='lendarios'?legadoLendarios()
    :sec==='finais'?legadoFinais():sec==='recordes'?legadoRecordes():legadoGaleria();
  return `<div class="cpx-subabas">${COPA_LEGADO_SECS.map(([k,n])=>`<button data-cplsec="${k}" class="${sec===k?'on':''}">${n}</button>`).join('')}</div>${corpo}`;
}
/* galeria: um quadro por edição, com a campeã e o cinco titular */
function legadoGaleria(){
  return `<div class="cpx-galeria">${edicoesDaCopa().slice().reverse().map(e=>{
    const fv=e.final.v===e.final.a?e.final.wa+'–'+e.final.wb:e.final.wb+'–'+e.final.wa;
    const logo=ASSETS.copa('sede-'+ASSETS.slug(e.nomeSede));
    const tit=((e.elencos[e.campeao]||{}).titulares)||[];
    return `<div class="cpx-ed">
      <div class="cpx-ed-topo">${logo?`<img src="${logo}" alt="">`:''}<div><b>${e.ano}</b><span>${e.edicao}ª · ${esc(e.nomeSede)}${e.cidade?' · '+esc(e.cidade):''}</span></div></div>
      <div class="cpx-ed-campea" data-copapais="${e.campeao}" data-cpaba="geral">${escudoSelecao(e.campeao,76)}<b>${esc(_nomeSel(e.campeao))}</b></div>
      <div class="cpx-ed-cinco">${tit.map(id=>{const p=G.jogadores[id];return `<span class="${p?'jrow':''}" ${p?`data-p="${id}"`:''} title="${esc(_nomeHall(id))}">${p?retrato(p,30):'<i></i>'}<em>${esc(_nomeHall(id))}</em></span>`;}).join('')}</div>
      <div class="cpx-ed-final" data-cpfinal="${e.ano}">final <b class="num">${fv}</b> ${escudoSelecao(e.vice,20)} ${esc(_nomeSel(e.vice))}</div>
      <div class="cpx-ed-pe"><span><i class="cpx-med bronze"></i> ${esc(_nomeSel(e.bronze))}</span>${e.mvp?`<span>MVP ${_jogadorLink(e.mvp)}</span>`:''}</div>
    </div>`;}).join('')}</div>`;
}
/* países que mais venceram */
function legadoPaises(){
  const l=paisesNaHistoria();
  return `<div class="card cx-linha"><div class="cpx-eyebrow">Países que mais venceram</div>
    <div class="cpx-pais-top">${l.filter(x=>x.titulos).slice(0,3).map((x,i)=>`<div class="cpx-pt ${i===0?'um':''}" data-copapais="${x.pais}" data-cpaba="geral">
      ${escudoSelecao(x.pais,i?64:88)}<b>${esc(_nomeSel(x.pais))}</b><span class="cpx-estrelas">${'★'.repeat(Math.min(x.titulos,6))}</span><em>${x.titulos} título${x.titulos>1?'s':''} · ${x.anosTitulo.join(', ')}</em></div>`).join('')}</div>
    <table class="tbl cpx-rk"><thead><tr><th>Seleção</th><th class="c">Títulos</th><th class="c">Finais</th><th class="c">Medalhas</th><th class="c">Copas</th><th>Melhor campanha</th></tr></thead><tbody>
    ${l.map(x=>`<tr data-copapais="${x.pais}" data-cpaba="geral" style="cursor:pointer"><td><span class="cpx-rk-s">${escudoSelecao(x.pais,28)}<span><b>${esc(_nomeSel(x.pais))}</b><em>${bandeira(x.pais)} ${esc(_sigSel(x.pais))}</em></span></span></td>
      <td class="c num"><b>${x.titulos||'–'}</b></td><td class="c num">${x.finais||'–'}</td><td class="c">${_medalhas(x.titulos,x.vices,x.bronzes)||'<span class="dim">–</span>'}</td>
      <td class="c num">${x.copas}</td><td>${esc(ALCANCE_NOME[x.melhor]||'—')}</td></tr>`).join('')}</tbody></table></div>`;
}
/* jogadores e técnicos com mais títulos */
function legadoJogadores(){
  const J=jogadoresNaHistoria().filter(j=>j.medalhas||j.mvp.length||j.ti.length).slice(0,20);
  const T=tecnicosNaHistoria().filter(t=>t.podios.length).slice(0,8);
  return `<div class="cpx-g2">
    <div class="card"><div class="cpx-eyebrow">Jogadores com mais títulos</div>
      ${J.map((j,i)=>{const p=G.jogadores[j.id];return `<div class="cpx-lid ${i===0?'top':''} ${p?'jrow':''}" ${p?`data-p="${j.id}"`:''}>
        <span class="cpx-lid-p">${i+1}</span>${p?retrato(p,i?32:44):`<span class="cpx-ret-vazio">${esc(String(j.n).slice(0,2))}</span>`}
        <div><b>${esc(j.n)}${p?'':' <span class="dim">· aposentado</span>'}</b><span>${bandeira(j.p)} ${esc(_sigSel(j.p))} · ${j.ed.length} Copa${j.ed.length>1?'s':''}${j.mvp.length?' · MVP '+j.mvp.join(', '):''}${j.ti.length?' · time ideal ×'+j.ti.length:''}</span></div>
        <em class="cpx-medl">${_medalhas(j.ouro.length,j.prata.length,j.bronze.length)}</em></div>`;}).join('')||'<p class="dim">Ninguém ainda.</p>'}</div>
    <div class="card"><div class="cpx-eyebrow">Técnicos</div>
      ${T.map((t,i)=>{const m=G.staff&&G.staff[t.id];return `<div class="cpx-lid ${i===0&&t.titulos.length?'top':''}">
        <span class="cpx-lid-p">${i+1}</span>${m?retratoStaff(m,32):`<span class="cpx-ret-vazio">${esc(String(t.n).slice(0,2))}</span>`}
        <div><b>${esc(t.n)}</b><span>${t.p?bandeira(t.p)+' ':''}${t.selecoes.map(_sigSel).join(', ')} · ${t.ed.length} Copa${t.ed.length>1?'s':''}</span></div>
        <em>${t.titulos.length?'<span class="cpx-estrelas">'+'★'.repeat(t.titulos.length)+'</span> '+t.titulos.join(', '):t.podios.length+' pódio'+(t.podios.length>1?'s':'')}</em></div>`;}).join('')||'<p class="dim">Ninguém ainda.</p>'}
    </div></div>`;
}
/* times lendários: os elencos campeões, do mais dominante para o menos */
function legadoLendarios(){
  return `<div class="cpx-lend-l">${timesLendarios().map((t,i)=>{const e=t.ed;
    return `<div class="cpx-lend ${i===0?'um':''}" style="${fundoDaSede({sede:e.sede,nomeSede:e.nomeSede},.86)}">
      <div class="cpx-lend-cab">${escudoSelecao(t.pais,64)}<div><span class="cpx-eyebrow">${i===0?'O mais dominante · ':''}World Cup ${t.ano} · ${esc(e.nomeSede)}</span>
        <b>${esc(_nomeSel(t.pais))} ${t.ano}</b>
        <em>${t.invicta?'campanha invicta · ':''}${t.pro}–${t.contra} em mapas · final ${e.final.v===e.final.a?e.final.wa+'–'+e.final.wb:e.final.wb+'–'+e.final.wa} contra ${esc(_nomeSel(e.vice))}</em></div></div>
      <div class="cpx-lend-cinco">${t.titulares.map(id=>{const p=G.jogadores[id];
        return p?cartaJogador(p,{w:96,clique:true}):`<div class="cpx-lend-ap"><b>${esc(_nomeHall(id))}</b><span>aposentado</span></div>`;}).join('')}</div>
      <div class="cpx-lend-pe">${t.tecnico?`<span>Técnico: <b>${esc(e.nomes[t.tecnico]||'')}</b></span>`:''}${e.mvp?`<span>MVP da Copa: ${_jogadorLink(e.mvp)}</span>`:''}
        <span class="cpx-lend-cam">${(e.caminho||[]).map(c=>`<i class="${c.pro>c.contra?'v':'d'}" title="${esc(c.fase)}: ${esc(_nomeSel(c.adv))} ${c.pro}–${c.contra}">${esc(_sigSel(c.adv))} ${c.pro}–${c.contra}</i>`).join('')}</span></div>
    </div>`;}).join('')}</div>`;
}
/* finais históricas */
function legadoFinais(){
  const l=finaisHistoricas().slice().reverse();
  const maisEpica=l.slice().sort((a,b)=>b.epica-a.epica)[0];
  return `<div class="cpx-finais">${l.map(f=>{const e=f.ed;
    return `<div class="cpx-fin ${f===maisEpica&&f.epica?'epica':''}" data-cpfinal="${f.ano}">
      <div class="cpx-fin-ano"><b>${f.ano}</b><span>${esc(e.cidade||e.nomeSede)}</span></div>
      <div class="cpx-fin-jogo">${escudoSelecao(f.campeao,46)}<div class="cpx-fin-pl"><b class="num">${f.pro}</b><i>–</i><b class="num">${f.contra}</b></div>${escudoSelecao(f.vice,46)}</div>
      <div class="cpx-fin-txt"><b>${esc(_nomeSel(f.campeao))}</b> sobre ${esc(_nomeSel(f.vice))}
        <span>${f.mapas.map(m=>`${esc(m.m)} ${m.a}-${m.b}`).join(' · ')}</span>
        ${f.mvp?`<span>MVP da final: ${_jogadorLink(f.mvp)}</span>`:''}</div>
      <div class="cpx-fin-tags">${f===maisEpica&&f.epica?'<em class="ouro">A mais épica</em>':''}${f.tags.map(t=>`<em>${esc(t)}</em>`).join('')}</div>
    </div>`;}).join('')}</div>`;
}
/* recordes */
function legadoRecordes(){
  const R=recordesDaCopa();
  return `<div class="cpx-recs">${R.map(r=>`<div class="cpx-rec">
    <span class="cpx-rec-t">${esc(r.tit)}</span>
    <b class="cpx-rec-v">${esc(String(r.valor))}</b>
    <span class="cpx-rec-q">${r.pais?escudoSelecao(r.pais,22):''}${r.id?_jogadorLink(r.id):esc(r.quem)}</span>
    ${r.onde?`<em>${esc(r.onde)}</em>`:''}</div>`).join('')}</div>`;
}

/* ---------- o perfil do jogador ---------- */
function blocoCopaJogador(p){
  if(!p)return '';
  const c=p.copa, s=p.selecao;
  if(!c&&!s)return '';
  const info=infoSelecao(p.pais);
  const camp=c&&c.ouro.length;
  const n=x=>x?x.length:0;
  const kd=s&&s.d?(s.k/s.d).toFixed(2):'–', acs=s&&s.maps?Math.round(s.acs/s.maps):'–';
  return `<div class="card cx-linha cpx-perfil ${camp?'campeao':''}">
    ${camp?`<div class="cpx-selo">${ASSETS.copa('trofeu')?`<img src="${ASSETS.copa('trofeu')}" alt="">`:''}<div><span>Campeão do mundo</span><b>${c.ouro.join(' · ')}</b></div></div>`:''}
    <div class="cpx-perfil-in">
      <div><div class="cpx-eyebrow">${info?escudoSelecao(p.pais,20)+' '+esc(info.nome):''} · Valorant World Cup</div>
        <div class="cpx-perfil-med">${_medalhas(n(c&&c.ouro),n(c&&c.prata),n(c&&c.bronze))||'<span class="dim">Sem medalha ainda</span>'}</div>
        <div class="cpx-perfil-l">${c&&c.edicoes.length?`<span>Copas: <b>${c.edicoes.join(', ')}</b></span>`:''}
          ${c&&c.mvp.length?`<span class="ouro">MVP da Copa ${c.mvp.join(', ')}</span>`:''}
          ${c&&c.timeIdeal.length?`<span>Time ideal ${c.timeIdeal.join(', ')}</span>`:''}</div></div>
      ${s?`<div class="cpx-perfil-num"><span><b class="num">${s.series}</b>séries</span><span><b class="num">${s.v}</b>vitórias</span><span><b class="num">${s.maps}</b>mapas</span>
        <span><b class="num">${kd}</b>K/D</span><span><b class="num">${acs}</b>ACS</span><span><b class="num">${s.mvp}</b>MVPs</span></div>`:''}
    </div>
  </div>`;
}
