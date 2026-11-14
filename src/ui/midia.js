/* ============================================================
   MODO JOGADOR — a tela de Fama e mídia (J6)
   Seguidores, fama e imagem; o post da semana; a entrevista;
   patrocínios pessoais; o que a imprensa fala de você.
   ============================================================ */
const _TOM_ROT={humilde:'Humilde',confiante:'Confiante',provocador:'Provocador'};
const _TOM_DICA={humilde:'Pouco alcance; imagem, técnico, colegas e torcida gostam.',confiante:'Alcance médio, sem efeito colateral.',provocador:'Muito alcance; a imagem cai e o técnico não gosta. Depois de derrota ou polêmica, vira polêmica.'};
function vJMidia(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const seg=seguidores(), f=famaJogador(), img=imagemJogador();
  const post=G.voce.post, ent=G.voce.entrevista, pat=patrociniosJogador(), of=ofertasPatrocinio();
  const log=(G.voce.famaLog||[]).slice(0,6);
  const manchetes=(G.noticias||[]).filter(n=>(n.p||[]).includes(p.id)).slice(0,10);
  const num=(r,v,cls)=>`<div><b class="num ${cls||''}">${v}</b><span>${r}</span></div>`;
  const marca=id=>(G.marcas&&G.marcas[id])||{nome:id,nivel:1,setor:''};
  return `<section class="card sj-topo"><div class="eyebrow">Fama e mídia</div>
      <div class="jg-st mj-fin">${num('seguidores',fmtSeg(seg))}${num('fama · '+rotuloFama(f),f)}${num('imagem · '+rotuloImagem(img),Math.round(img),img<-15?'dn':img>=15?'up':'')}${num('patrocínios',pat.length+'/'+PATROCINIOS_MAX)}${num('patrocínio por mês',moneyJ(patrociniosMensais()))}</div>
      <div class="md-barras"><div><span>Fama</span>${_barraPct(f,f>=45?'up':'')}</div><div><span>Imagem</span>${_barraPct((img+100)/2,img<-15?'dn':img>=15?'up':'')}</div></div>
      <p class="dim">A fama mede os seus seguidores: partidas boas, jogadas grandes, títulos, lives e ranked fazem crescer; fase ruim e sumiço derrubam. Ela traz propostas, empresário melhor e patrocínio. A imagem é como o público te vê: patrocinador grande quer imagem limpa.</p></section>
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Redes</div>
        ${post?`<p><b>${esc(POSTS[post.ctx].rot)}</b>: o que você posta?</p>
          <div class="md-posts">${Object.keys(POST_EF).map(t=>`<button class="md-post ${t}" data-mdpost="${t}" title="${esc(_TOM_DICA[t])}"><b>${_TOM_ROT[t]}</b><span>“${esc(POSTS[post.ctx].tons[t])}”</span><i>${esc(_TOM_DICA[t])}</i></button>`).join('')}</div>
          <button class="btn ghost sm" data-mdpost="nada">Não postar</button>`
          :vazio('<b>Nada para postar agora.</b> Depois de vitória, derrota, jogada grande, título ou polêmica, o post aparece aqui.','jornal')}
        ${log.length?`<div class="rl-log">${log.map(l=>`<div><span class="dim">${l.ano} · sem ${l.semana}</span> ${esc(l.txt)} <b class="${l.d>=0?'up':'dn'}">${l.d>=0?'+':''}${fmtSeg(l.d)}</b></div>`).join('')}</div>`:''}
      </div>
      <div class="card"><div class="eyebrow">Entrevista</div>
        ${ent?`<p><b>${esc(ENTREVISTAS[ent.ctx].rot)}</b>: a imprensa quer falar com você.</p>
          <div class="rl-ops"><button class="btn sm" data-mdent="abrir">Atender</button><button class="btn ghost sm" data-mdent="recusar">Recusar</button></div>
          <p class="dim">Duas perguntas, três respostas cada: a madura melhora a imagem e o técnico gosta; a atravessada dá alcance e vira manchete.</p>`
          :vazio('<b>Ninguém pediu entrevista.</b> Semana de destaque, sequência de derrotas, fase ruim, título e rumor de mercado trazem a imprensa.','info')}
      </div></div>
    <div class="card"><div class="eyebrow">Patrocínio pessoal</div>
      ${pat.length?`<div class="md-pats">${pat.map(x=>{const m=marca(x.marca);return `<div class="md-pat on"><b>${esc(m.nome)}</b><span>${esc(m.setor||'')} · nível ${m.nivel}</span><span>${moneyJ(x.mes)}/mês · até ${Math.ceil((x.ate-semAbs())/SEMANAS_ANO*12)} meses</span></div>`;}).join('')}</div>`:''}
      ${of.length?`<div class="md-pats">${of.map(o=>{const m=marca(o.marca),e=exigenciaMarca(m);return `<div class="md-pat"><b>${esc(m.nome)}</b><span>${esc(m.setor||'')} · nível ${m.nivel}</span>
        <span>${moneyJ(o.mes)}/mês por ${o.anos} ano${o.anos>1?'s':''}</span><span class="dim">pede fama ${e.fama} e imagem ${e.imagem}</span>
        <div class="rl-ops"><button class="btn sm" data-mdpat="${o.id}">Aceitar</button><button class="btn ghost sm" data-mdpatno="${o.id}">Recusar</button></div></div>`;}).join('')}</div>`:''}
      ${!pat.length&&!of.length?vazio(`<b>Nenhuma marca por enquanto.</b> As marcas locais olham a partir de fama ${exigenciaMarca({nivel:1}).fama}; as globais, de ${exigenciaMarca({nivel:5}).fama}. Você está em ${f}.`,'dinheiro'):''}
      <p class="dim">Até ${PATROCINIOS_MAX} marcas, uma por setor. Se a imagem despencar abaixo do que a marca aceita, ela rompe.</p></div>
    <div class="card"><div class="eyebrow">O que dizem de você</div>
      ${manchetes.length?`<div class="feed">${manchetes.map(x=>`<div><span class="dim">${x.ano} · sem ${x.s}</span> ${typeof iconizar==='function'?iconizar(esc(x.txt)):esc(x.txt)}</div>`).join('')}</div>`:vazio('<b>Silêncio na imprensa.</b>','jornal')}</div>`;
}
function modalEntrevista(){
  const E=perguntasEntrevista();if(!E)return;
  const ks=[];let i=0;
  const pinta=()=>{
    const q=E.perguntas[i];
    pintarModal(`<div class="ovl"><div class="box md-ent"><div class="eyebrow">Entrevista · ${esc(E.rot)} · pergunta ${i+1} de ${E.perguntas.length}</div>
      <h2 class="rl-fala">“${esc(q.p)}”</h2>
      <div class="md-rs">${q.rs.map(r=>`<button class="col-r" data-mdr="${r.k}"><span>${esc(r.txt)}</span></button>`).join('')}</div></div></div>`);
    document.querySelectorAll('[data-mdr]').forEach(b=>b.onclick=()=>{ks.push(+b.dataset.mdr);i++;
      if(i<E.perguntas.length)pinta();
      else{const r=responderEntrevista(ks);if(typeof modalConversaJogador==='function')modalConversaJogador('Entrevista',r.ok?r.msg:r.motivo);else{$('#modal').innerHTML='';render();}}});
  };
  pinta();
}
function ligarMidia(v,on){
  on('[data-mdpost]',el=>{const t=el.dataset.mdpost;if(t==='nada'){G.voce.post=null;render();return;}const r=postarNasRedes(t);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-mdent]',el=>{if(el.dataset.mdent==='abrir')modalEntrevista();else{const r=recusarEntrevista();flash(r.ok?r.msg:r.motivo);render();}});
  on('[data-mdpat]',el=>{const r=aceitarPatrocinio(el.dataset.mdpat);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-mdpatno]',el=>{const r=recusarPatrocinio(el.dataset.mdpatno);flash(r.msg);render();});
}
/* cartão da Central: o que a mídia pede de você */
function _jCardMidia(p){
  if(typeof seguidores!=='function')return '';
  const itens=[];
  if(G.voce.post)itens.push('um post para publicar');
  if(G.voce.entrevista)itens.push('um pedido de entrevista');
  if(ofertasPatrocinio().length)itens.push(ofertasPatrocinio().length+' oferta'+(ofertasPatrocinio().length>1?'s':'')+' de patrocínio');
  if(!itens.length)return '';
  return `<div class="card rl-ev"><div class="split"><div class="eyebrow">Mídia · ${fmtSeg(seguidores())} seguidores</div><button class="btn sm" data-ir="midia">Abrir ›</button></div><p>Você tem ${itens.join(', ')}.</p></div>`;
}
