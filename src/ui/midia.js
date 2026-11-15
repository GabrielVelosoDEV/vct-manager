/* ============================================================
   MODO JOGADOR — a tela de Fama e mídia (J6)
   Seguidores, fama e imagem; o post da semana; a entrevista;
   patrocínios pessoais; o que a imprensa fala de você.
   ============================================================ */
const _TOM_ROT={humilde:'Humilde',confiante:'Confiante',provocador:'Provocador'};
const _TOM_DICA={humilde:'Pouco alcance; imagem, técnico, colegas e torcida gostam.',confiante:'Alcance médio, sem efeito colateral.',provocador:'Muito alcance; a imagem cai e o técnico não gosta. Depois de derrota ou polêmica, vira polêmica.'};
function _mdEstrelas(n){return `<span class="md-est" title="nível ${n||1} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=(n||1)?'on':''}"></i>`).join('')}</span>`;}
function vJMidia(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const seg=seguidores(), f=famaJogador(), img=imagemJogador(), t=clubeDoJogador();
  const post=G.voce.post, ent=G.voce.entrevista, pat=patrociniosJogador(), of=ofertasPatrocinio();
  const log=(G.voce.famaLog||[]).slice(0,6);
  const manchetes=(G.noticias||[]).filter(n=>(n.p||[]).includes(p.id)).slice(0,8);
  const marca=id=>(G.marcas&&G.marcas[id])||{id,nome:id,nivel:1,setor:''};
  const cor=t?corDoClube(t):'#5a6b7d';
  const foto=typeof cenaFoto==='function'?cenaFoto('cenas','ativ-stream',t,{cls:'cn-direita',foco:'placa'}):'';
  const meses=x=>Math.max(0,Math.ceil((x.ate-semAbs())/SEMANAS_ANO*12));
  const contrato=x=>{const m=marca(x.marca),multa=multaPatrocinio(x);return `<article class="md-pat2 on">
      <div class="md-pat-logo">${logoMarca(m,150)}</div>
      <div class="md-pat-t"><b>${esc(m.nome)}</b><span>${esc(m.setor||'')} ${_mdEstrelas(m.nivel)}</span></div>
      <div class="md-pat-v"><b class="num">${moneyJ(x.mes)}</b><span>por mês · ${meses(x)} ${meses(x)===1?'mês':'meses'} de contrato</span></div>
      <button class="btn ghost sm" data-mdromper="${esc(x.marca)}" title="Dois meses do valor do contrato. A marca não volta a procurar você por um ano.">Romper · multa ${moneyJ(multa)}</button></article>`;};
  const oferta=o=>{const m=marca(o.marca),e=exigenciaMarca(m),tr=trocaDoPatrocinio(o)||{};
    const sai=tr.mesmoSetor?marca(tr.mesmoSetor.marca):null, ganho=tr.mesmoSetor?o.mes-tr.mesmoSetor.mes:o.mes;
    return `<article class="md-pat2 oferta">
      <span class="md-pat-novo">oferta · vale ${Math.max(1,o.validoAte-semAbs())} semana${o.validoAte-semAbs()>1?'s':''}</span>
      <div class="md-pat-logo">${logoMarca(m,150)}</div>
      <div class="md-pat-t"><b>${esc(m.nome)}</b><span>${esc(m.setor||'')} ${_mdEstrelas(m.nivel)}</span><span class="dim">pede fama ${e.fama} e imagem ${e.imagem}</span></div>
      <div class="md-pat-v"><b class="num">${moneyJ(o.mes)}</b><span>por mês · ${o.anos} ano${o.anos>1?'s':''}</span>
        ${sai?`<span class="${ganho>=0?'up':'dn'}">${ganho>=0?'+':''}${moneyJ(ganho)}/mês sobre a ${esc(sai.nome)}</span>`:''}</div>
      ${sai?`<p class="md-pat-troca">Mesmo setor da <b>${esc(sai.nome)}</b>: aceitar rompe o contrato dela (multa ${moneyJ(multaPatrocinio(tr.mesmoSetor))}).</p>`:''}
      ${tr.cheio?`<label class="md-pat-troca">As ${PATROCINIOS_MAX} vagas estão cheias. Romper: <select id="mdTroca-${o.id}">${pat.map(x=>{const mx=marca(x.marca);return `<option value="${esc(x.marca)}">${esc(mx.nome)} · ${moneyJ(x.mes)}/mês · multa ${moneyJ(multaPatrocinio(x))}</option>`;}).join('')}</select></label>`:''}
      <div class="md-pat-b"><button class="btn sm" data-mdpat="${o.id}">${sai||tr.cheio?'Trocar e assinar':'Assinar'}</button><button class="btn ghost sm" data-mdpatno="${o.id}">Recusar</button></div></article>`;};
  return `<section class="jx-hero md-hero ${foto?'com-cena':''}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">${foto}
    <div class="jx-hero-in md-hero-in">
      <div class="md-foto">${retrato(p,112)}</div>
      <div class="jx-hero-t"><div class="eyebrow">Fama e mídia</div>
        <h2><span class="num" data-conta-seg>${fmtSeg(seg)}</span> <small>seguidores</small></h2>
        <div class="md-medidores">${_rlAnel(f,70,f>=45?'up':'')}<div><b>Fama · ${esc(rotuloFama(f))}</b><span class="dim">traz propostas, empresário e marcas</span></div>
          ${_rlAnel((img+100)/2,70,img<-15?'dn':img>=15?'up':'')}<div><b>Imagem · ${esc(rotuloImagem(img))} (${Math.round(img)})</b><span class="dim">marca grande quer imagem limpa</span></div></div>
      </div>
      <div class="md-hero-pat"><span>patrocínio por mês</span><b class="num">${moneyJ(patrociniosMensais())}</b>
        <div class="md-logos">${pat.map(x=>logoMarca(marca(x.marca),74)).join('')||'<i class="dim">nenhuma marca ainda</i>'}</div></div>
    </div></section>
  <div class="grid g2 cx-linha">
    <section class="card md-redes"><div class="eyebrow">Redes</div>
      ${post?`<p><b>${esc(POSTS[post.ctx].rot)}</b> — o que você posta?</p>
        <div class="md-posts2">${Object.keys(POST_EF).map(k=>`<button class="md-post2 ${k}" data-mdpost="${k}"><span class="md-post-av">${retrato(p,36)}<b>${esc(p.nome)}</b><i>@${esc(String(p.nome).toLowerCase())}</i></span>
          <span class="md-post-txt">“${esc(POSTS[post.ctx].tons[k])}”</span><span class="md-post-tom">${_TOM_ROT[k]} · ${esc(_TOM_DICA[k])}</span></button>`).join('')}</div>
        <button class="btn ghost sm" data-mdpost="nada">Não postar</button>`
        :vazio('<b>Nada para postar agora.</b> Depois de vitória, derrota, jogada grande, título ou polêmica, o post aparece aqui.','jornal')}
      ${log.length?`<div class="rl-log">${log.map(l=>`<div><span class="dim">${l.ano} · sem ${l.semana}</span> ${esc(l.txt)} <b class="${l.d>=0?'up':'dn'}">${l.d>=0?'+':''}${fmtSeg(l.d)}</b></div>`).join('')}</div>`:''}
    </section>
    <section class="card md-ent2 ${ent?'tem':''}">${typeof cenaFoto==='function'&&ent?cenaFoto('cenas','palco-premios',t,{foco:30}):''}
      <div class="md-ent2-in"><div class="eyebrow">Entrevista</div>
      ${ent?`<h3>${esc(ENTREVISTAS[ent.ctx].rot)}</h3><p>A imprensa quer falar com você. Duas perguntas na sala de imprensa, com 15 segundos para responder: a resposta madura melhora a imagem e o técnico gosta; a atravessada dá alcance e vira manchete.</p>
        <div class="rl-acoes3"><button class="btn" data-mdent="abrir">${ico('microfone')} Ir à sala de imprensa</button><button class="btn ghost sm" data-mdent="recusar">Recusar</button></div>`
        :vazio('<b>Ninguém pediu entrevista.</b> Semana de destaque, sequência de derrotas, fase ruim, título e rumor de mercado trazem a imprensa.','info')}</div>
    </section></div>
  <section class="card"><div class="split"><div class="eyebrow">Patrocínio pessoal · ${pat.length}/${PATROCINIOS_MAX}</div><span class="dim">Uma marca por setor. Romper custa dois meses do contrato.</span></div>
    ${pat.length?`<div class="md-pats2">${pat.map(contrato).join('')}</div>`:''}
    ${of.length?`<div class="eyebrow" style="margin-top:14px">Ofertas</div><div class="md-pats2">${of.map(oferta).join('')}</div>`:''}
    ${!pat.length&&!of.length?vazio(`<b>Nenhuma marca por enquanto.</b> As marcas locais olham a partir de fama ${exigenciaMarca({nivel:1}).fama}; as globais, de ${exigenciaMarca({nivel:5}).fama}. Você está em ${f}.`,'dinheiro'):''}
    <p class="dim">Marca melhor do mesmo setor chega como oferta de troca. Se a imagem despencar abaixo do que a marca aceita, ela rompe sozinha.</p></section>
  <section class="card"><div class="eyebrow">O que dizem de você</div>
    ${manchetes.length?`<div class="md-feed">${manchetes.map(x=>`<div class="md-feed-i">${typeof avatarImprensa==='function'&&typeof autorDaNoticia==='function'&&autorDaNoticia(x)?avatarImprensa(autorDaNoticia(x),30):''}<div><span class="dim">${x.ano} · sem ${x.s}</span><p>${typeof iconizar==='function'?iconizar(esc(x.txt)):esc(x.txt)}</p></div></div>`).join('')}</div>`:vazio('<b>Silêncio na imprensa.</b>','jornal')}</section>`;
}
/* a entrevista na sala de imprensa da coletiva, na visão do jogador */
function modalEntrevista(){
  const E=perguntasEntrevista();if(!E)return;
  const p=meuJogador(), t=clubeDoJogador();
  const jor=(typeof jornalistasDaRegiao==='function'&&t?jornalistasDaRegiao(t.regiao,typeof paisDoClube==='function'?paisDoClube(t):null).slice(0,6):[])
    .map(j=>{const v=veiculo(j.veiculo);return [j.nome,v.nome,v.cor];});
  const imp=jor.length>=2?jor:(typeof COL_IMPRENSA!=='undefined'?COL_IMPRENSA:[['Imprensa','',' #FF4655']]);
  const VAL=[1,0.4,0];
  const dados={t:t||null,foto:(typeof Imgs!=='undefined'&&Imgs.get('foto:'+ASSETS.slug(p.nome)))||p.foto||(typeof Rostos!=='undefined'&&Rostos.caminho(p))||(typeof ASSETS.foto==='function'?ASSETS.foto(p):null),placa:p.nome+' · '+(p.roleAtual||p.role),
    marcas:patrociniosJogador().map(x=>G.marcas&&G.marcas[x.marca]).filter(Boolean),
    perguntas:E.perguntas.map((q,i)=>({p:q.p,j:imp[i%imp.length],rs:q.rs.map(r=>({txt:r.txt,v:VAL[r.k],k:r.k}))}))};
  if(typeof abrirMinigame!=='function'||typeof jogarColetiva!=='function')return;
  abrirMinigame({
    id:'entrevista',titulo:'Entrevista',eyebrow:'Sala de imprensa · '+E.rot,
    desc:`${E.perguntas.length} perguntas, 15 segundos cada. A resposta madura melhora a imagem e o técnico gosta; a morna passa batida; a atravessada dá alcance, derruba a imagem e vira manchete.`,
    controles:['1','2','3','Mouse'],
    fundo:()=>typeof cenaFoto==='function'?cenaFoto('cenas','palco-premios',t,{cls:'cn-direita',foco:30,ansioso:true}):'',
    arte:()=>'',
    vale:()=>!!G.voce.entrevista,
    efeitoTxt:()=>'Vale de uma vez: imagem, seguidores e a confiança do técnico.',
    efeitoFeito:res=>esc(res.msgEnt||''),
    rotuloComissao:'Recusar a entrevista',msgComissao:'Você recusou a entrevista.',
    comissao:()=>{recusarEntrevista();render();},
    dica:()=>'Clique na resposta ou use as teclas 1 a 3.',
    registrar:(res,vale)=>{
      if(vale&&G.voce.entrevista){const ks=(res.vals||[]).map(x=>x.v>=1?0:x.v>=0.4||!x.txt?1:2);
        while(ks.length<E.perguntas.length)ks.push(1);
        const r=responderEntrevista(ks);res.msgEnt=r.ok?r.msg:r.motivo;}
      return typeof registrarRecordeMini==='function'?registrarRecordeMini('entrevista',res.pts,res.nota):null;
    },
    jogar:(c,fim)=>jogarColetiva(c,fim,dados)
  });
}
function ligarMidia(v,on){
  on('[data-mdpost]',el=>{const t=el.dataset.mdpost;if(t==='nada'){G.voce.post=null;render();return;}const r=postarNasRedes(t);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-mdent]',el=>{if(el.dataset.mdent==='abrir')modalEntrevista();else{const r=recusarEntrevista();flash(r.ok?r.msg:r.motivo);render();}});
  on('[data-mdpat]',el=>{const id=el.dataset.mdpat,sel=v.querySelector('#mdTroca-'+id);const r=aceitarPatrocinio(id,sel?sel.value:null);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-mdpatno]',el=>{const r=recusarPatrocinio(el.dataset.mdpatno);flash(r.msg);render();});
  on('[data-mdromper]',async el=>{
    const x=patrociniosJogador().find(c=>c.marca===el.dataset.mdromper);if(!x)return;
    const m=G.marcas[x.marca];
    if(typeof confirmar==='function'&&!await confirmar(`Romper com a ${m?m.nome:x.marca}? A multa é de ${moneyJ(multaPatrocinio(x))} e a marca não volta a procurar você por um ano.`,'Romper'))return;
    const r=romperPatrocinio(x.marca);flash(r.ok?r.msg:r.motivo);render();});
}
/* cartão da Central: o que a mídia pede de você */
function _jCardMidia(p){
  if(typeof seguidores!=='function')return '';
  const itens=[];
  if(G.voce.post)itens.push('um post para publicar');
  if(G.voce.entrevista)itens.push('um pedido de entrevista');
  if(ofertasPatrocinio().length)itens.push(ofertasPatrocinio().length+' oferta'+(ofertasPatrocinio().length>1?'s':'')+' de patrocínio');
  if(!itens.length)return '';
  const logos=(typeof logoMarca==='function'?ofertasPatrocinio().map(o=>G.marcas[o.marca]).filter(Boolean).map(m=>`<span class="md-mini" title="${m.nome}">${logoMarca(m,48)}</span>`).join(''):'');
  return `<div class="card rl-ev"><div class="split"><div class="eyebrow">Mídia · ${fmtSeg(seguidores())} seguidores</div><button class="btn sm" data-ir="midia">Abrir ›</button></div><div class="md-cen"><p>Você tem ${itens.join(', ')}.</p>${logos?`<div class="md-cen-l">${logos}</div>`:''}</div></div>`;
}
