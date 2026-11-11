/* ============================================================
   O PROJETO NA TELA (o motor mora em core/projeto.js)
   Central: as propostas da diretoria quando não há projeto, ou o
   andamento — metas, ano do ciclo e se o elenco combina com o que
   foi prometido. O veredito da temporada mostra o balanço.
   ============================================================ */
function rotuloAlinhamento(a){
  return a>=0.4?'O elenco tem a cara do projeto':a>=0.1?'No caminho certo':a>-0.2?'Meio termo: a torcida observa'
    :a>-0.5?'A torcida acha o elenco incoerente':'A torcida cobra coerência';
}
function barraAlinhamento(a){
  const w=Math.abs(a)*50,cls=a>=0.1?'tc-pos':a<=-0.2?'tc-neg':'';
  return `<span class="pj-al"><i class="${cls}" style="${a>=0?'left:50%':'right:50%'};width:${w}%"></i></span>`;
}
function metaProjetoHTML(m,aoVivo){
  return `<div class="pj-meta ${m.ok?'ok':aoVivo&&m.tipo==='ciclo'?'and':'no'}">
    <i class="ver-ic ${m.ok?'ok':aoVivo&&m.tipo==='ciclo'?'n':'no'}">${m.ok?ico('check'):aoVivo&&m.tipo==='ciclo'?'…':ico('x')}</i>
    <div><b>${esc(m.texto)}</b><div class="dim">${m.tipo==='ciclo'?'até o fim do ciclo':'todo ano'} · ${esc(m.txt||'')}</div></div></div>`;
}
function cardProjeto(t){
  if(!t)return '';
  const e=estadoProjeto();
  if(!e){
    const ops=projetosParaClube(t).slice(0,3);
    const passado=G.projeto&&G.projeto.encerrado&&G.projeto.resultado;
    return `<div class="card pj-card pj-escolha"><div class="split"><div class="eyebrow">Projeto do clube · próximas ${PROJETO_ANOS} temporadas</div>
        ${passado?`<span class="chip ${passado.sucesso?'t':'r'}">último: ${passado.sucesso?'cumprido':'não cumprido'}</span>`:''}</div>
      <p class="dim" style="margin:4px 0 12px">A diretoria quer definir o que o clube vai ser. Escolha um caminho: ele vira metas cobradas
        a cada temporada, e a torcida passa a julgar o elenco por ele.</p>
      <div class="pj-ops">${ops.map(o=>`<div class="pj-op ${o.recomendado?'rec':''}">
        <div class="split"><span class="pj-ic">${icone(o.ic,o.recomendado?'ouro':'')}</span>${o.recomendado?'<span class="chip t">a diretoria recomenda</span>':''}</div>
        <b>${esc(o.nome)}</b><p class="dim">${esc(o.desc)}</p>
        <ul>${o.metas.map(m=>`<li>${esc(m.texto)} <span class="dim">· ${m.tipo==='ciclo'?'no ciclo':'todo ano'}</span></li>`).join('')}</ul>
        <button class="btn ${o.recomendado?'':'ghost'} sm" data-projeto="${o.id}">Assumir este projeto</button></div>`).join('')}</div></div>`;
  }
  const bal=G.projetoBalanco&&G.projetoBalanco.id===e.pj.id&&G.projetoBalanco.ano<e.ano?G.projetoBalanco:null;
  return `<div class="card pj-card"><div class="split"><div class="eyebrow">Projeto · ${esc(e.def.nome)}</div>
      <span class="dim">temporada ${e.ano} de ${e.anos} · até ${e.pj.fim}</span></div>
    <div class="pj-linha">${barraAlinhamento(e.alinhamento)}<span>${esc(rotuloAlinhamento(e.alinhamento))}</span>
      <span class="dim">· a torcida quer ${esc(e.def.torcida)}</span></div>
    <div class="pj-metas">${e.metas.map(m=>metaProjetoHTML(m,true)).join('')}</div>
    ${bal?`<p class="dim" style="font-size:12px;margin-top:6px">Balanço de ${G.ano-1}: ${bal.metas.filter(m=>m.tipo==='ano'&&m.ok).length} de ${bal.metas.filter(m=>m.tipo==='ano').length} metas do ano · confiança ${bal.delta>=0?'+':''}${bal.delta}</p>`:''}
  </div>`;
}
/* seção do veredito de fim de temporada */
function vereditoProjetoHTML(pr){
  if(!pr)return '';
  const v=pr.veredito;
  return `<div class="card flat" style="margin-top:12px"><div class="split"><div class="eyebrow">Projeto · ${esc(pr.nome)} · temporada ${pr.ano} de ${pr.de}</div>
      <b class="num ${pr.delta>=0?'up':'dn'}">${pr.delta>=0?'+':''}${pr.delta} de confiança</b></div>
    ${v?`<p style="margin:6px 0"><b class="${v.sucesso?'up':'dn'}">${v.sucesso?'Projeto cumprido.':'Projeto não cumprido.'}</b>
      <span class="dim">${v.cicloOk} de ${v.deCiclo} metas do ciclo · ${v.pctAnual}% das metas anuais. Na próxima temporada a diretoria propõe um novo projeto.</span></p>`:''}
    ${pr.metas.map(m=>metaProjetoHTML(m,false)).join('')}</div>`;
}
function ligarProjeto(v,on){
  on('[data-projeto]',el=>{const r=escolherProjeto(el.dataset.projeto);render();flash(r.ok?r.msg:r.erro);});
}

/* o cenário de desafio na Central */
function cardDesafio(){
  const x=G.desafio;if(!x)return '';
  const d=typeof desafioDef==='function'?desafioDef(x.id):null;if(!d)return '';
  /* depois de decidido, fica uma temporada na tela e some */
  if(x.status!=='andamento'&&x.decidido&&G.ano>x.decidido+1)return '';
  const resta=x.fim-G.ano+1;
  return `<div class="card dsf-card ${x.status}"><div class="split"><div class="eyebrow">${icone(d.ic,'ouro')} Desafio · ${esc(d.nome)}</div>
      <span class="chip ${x.status==='vencido'?'t':x.status==='perdido'?'r':''}">${x.status==='vencido'?'vencido em '+x.decidido
        :x.status==='perdido'?'perdido'+(x.decidido?' em '+x.decidido:''):resta<=1?'última temporada':resta+' temporadas restantes'}</span></div>
    <p style="margin:6px 0 0"><b>${esc(d.objetivo)}</b></p>
    ${x.txt||x.anos.length?`<p class="dim" style="margin-top:4px">${esc(x.txt||x.anos[x.anos.length-1].txt)}</p>`:''}</div>`;
}
