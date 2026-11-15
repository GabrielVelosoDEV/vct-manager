/* ============================================================
   DONOS — a tela dos donos do circuito (fase 5 do modo Dono)
   ------------------------------------------------------------
   Todos os donos por região: quem é, o perfil, a relação com
   você e o que andaram fazendo. No modo Dono, dá para chamar um
   para jantar ou provocar na imprensa (uma vez por temporada).
   ============================================================ */
let donosReg=null, donosTier=1;

function _barraRel(v){
  const w=Math.abs(v)/2, cor=v>=20?'var(--teal)':v>REL_PORTA?'var(--amber)':'var(--red)';
  return `<div class="dn-rel" title="${esc(rotuloRel(v))}: ${Math.round(v)}"><div class="dn-rel-b"><i style="${v>=0?'left:50%':'right:50%'};width:${w}%;background:${cor}"></i><span></span></div>
    <span class="dn-rel-t ${v>=20?'up':v<=REL_PORTA?'dn':''}">${esc(rotuloRel(v))}</span></div>`;
}
function vDonos(){
  const eu=meu();
  const regs=REGIONS.map(r=>r.id);
  if(!donosReg)donosReg=eu?eu.regiao:regs[0];
  const souDonoAqui=typeof souDono==='function'&&souDono();
  const lista=(G.regioes[donosReg]&&G.regioes[donosReg][donosTier===1?'t1':'t2']||[]).map(id=>G.times[id]).filter(Boolean)
    .sort((a,b)=>(b.prestigio||0)-(a.prestigio||0));
  const linha=t=>{
    const d=t.dono||{},pf=PERFIS_DONO[d.perfil]||{nome:'—',desc:''};
    const meuC=eu&&t.id===eu.id;
    const v=relDono(t);
    const feito=k=>(G.acoesDonos||{})[k+'|'+t.id+'|'+G.ano];
    return `<div class="dn-linha ${meuC?'meu':''}">
      <div class="dn-r">${typeof retratoDono==='function'?retratoDono(d,t,46):''}</div>
      <div class="dn-q"><b>${esc(d.nome||'—')}</b>${d.voce?' <span class="chip up">você</span>':''}
        <span class="dim">${esc(rotuloTipoDono(d))}${d.desde?' · desde '+d.desde:''}</span></div>
      <div class="dn-c" data-ir-tela="clube:${t.id}">${escudo(t,24)} <span>${esc(t.nome)}</span></div>
      <div class="dn-p"><span class="dono-tag">${esc(pf.nome)}</span></div>
      <div class="dn-v">${meuC?(typeof souTreinador==='function'&&souTreinador()?'<span class="dim">seu chefe</span>':'<span class="dim">seu clube</span>'):eu?_barraRel(v):''}</div>
      <div class="dn-a">${souDonoAqui&&eu&&!meuC?`<button class="btn ghost sm" data-dnjanta="${t.id}" ${feito('jantar')?'disabled':''}>Jantar</button>
        <button class="btn ghost sm" data-dnprovoca="${t.id}" ${feito('provoca')?'disabled':''}>Provocar</button>`:''}</div>
    </div>`;
  };
  const log=logDonos().filter(x=>!x.timeId||!G.times[x.timeId]||G.times[x.timeId].regiao===donosReg).slice(0,14);
  return `<div class="eyebrow">Circuito</div><h2 class="sec">Donos</h2>
  <p class="dim" style="max-width:820px">Cada organização tem dono, com perfil próprio. A relação com você mexe no preço que eles pedem pelos jogadores; abaixo de ${REL_PORTA} o dono fecha a porta e só vende pela multa. Negócio justo e venda para eles aproximam; proposta humilhante, multa paga por cima, técnico levado e clássico perdido afastam.</p>
  <div class="tabs">${regs.map(r=>`<button class="${donosReg===r?'on':''}" data-dnreg="${r}">${esc((REGIONS.find(x=>x.id===r)||{}).nome||r)}</button>`).join('')}
    <span style="flex:1"></span>${[1,2].map(k=>`<button class="${donosTier===k?'on':''}" data-dntier="${k}">${k===1?'Liga principal':'Challengers'}</button>`).join('')}</div>
  <div class="grid dn-grid">
    <div class="card dn-lista">${lista.map(linha).join('')||'<p class="dim">Nenhum clube.</p>'}</div>
    <div class="card"><div class="eyebrow">Movimentos dos donos</div>
      ${log.length?log.map(x=>`<div class="dn-log"><span class="dim num">S${x.semana} ${x.ano}</span><span>${x.timeId&&G.times[x.timeId]?escudo(G.times[x.timeId],16)+' ':''}${x.dono?'<b>'+esc(x.dono)+'</b> · ':''}${esc(x.txt)}</span>${x.d?`<b class="num ${x.d>0?'up':'dn'}">${x.d>0?'+':''}${x.d}</b>`:'<b></b>'}</div>`).join('')
        :'<p class="dim">Nada ainda nesta região.</p>'}</div>
  </div>`;
}
function ligarDonos(v){
  v.querySelectorAll('[data-dnreg]').forEach(b=>b.onclick=()=>{donosReg=b.dataset.dnreg;render();});
  v.querySelectorAll('[data-dntier]').forEach(b=>b.onclick=()=>{donosTier=+b.dataset.dntier;render();});
  v.querySelectorAll('[data-dnjanta]').forEach(b=>b.onclick=()=>{const r=jantarDeNegocios(b.dataset.dnjanta);flash(r.ok?r.msg:r.erro);render();});
  v.querySelectorAll('[data-dnprovoca]').forEach(b=>b.onclick=async()=>{
    if(!await confirmar('Provocar o dono na imprensa? A torcida gosta; ele não esquece (relação −12).','Provocar'))return;
    const r=provocarDono(b.dataset.dnprovoca);flash(r.ok?r.msg:r.erro);render();});
}
