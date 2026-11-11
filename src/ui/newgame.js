/* ============================================================
   NOVO JOGO
   ============================================================ */
let escRegiao='AMER',escTier=1,escPapel='treinador',escNome='',escDif='normal',escSel=null;
/* modo: carreira normal, ou um cenário de desafio (core/desafios.js) */
let escCenario=null;
/* o seu treinador (manager.js): foto, país, idade, gênero, trajetória e estilo */
let escFoto=null,escPais='BR',escIdade=34,escGenero='m',escModo='carreira',escEstilo='estrategista';
/* foto do treinador: recorte 4:5 centrado, JPEG pequeno — vai dentro do save */
function fotoDoArquivo(file){
  return new Promise((res,rej)=>{
    /* alguns sistemas não informam o tipo (.jfif, .webp antigos): vale a extensão */
    const ehImagem=file&&(/^image\//.test(file.type||'')||/\.(jpe?g|jfif|png|webp|gif|bmp|avif)$/i.test(file.name||''));
    if(!ehImagem)return rej(new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).'));
    const fr=new FileReader();
    fr.onload=()=>{const im=new Image();im.onload=()=>{
      const W=240,H=300,cv=document.createElement('canvas');cv.width=W;cv.height=H;
      const e=Math.max(W/im.width,H/im.height),w=im.width*e,h=im.height*e;
      const cx=cv.getContext('2d');cx.fillStyle='#0F1923';cx.fillRect(0,0,W,H);
      cx.drawImage(im,(W-w)/2,(H-h)/2.6,w,h);
      res(cv.toDataURL('image/jpeg',0.86));};
      im.onerror=()=>rej(new Error('Não deu para ler essa imagem. Formatos como HEIC (foto de iPhone) precisam ser convertidos para JPG.'));im.src=fr.result;};
    fr.onerror=()=>rej(new Error('Falha ao ler o arquivo.'));fr.readAsDataURL(file);
  });
}
function telaNovoJogo(){
  const val=edValidar();
  if(!val.ok){
    /* deixar começar com a base quebrada gera erro no meio da temporada, longe
       da causa; melhor barrar aqui e mandar para a aba que explica o problema */
    $('#modal').innerHTML=`<div class="ovl"><div class="box">
      <div class="eyebrow">Não dá para começar ainda</div>
      <h2 class="sec">${val.erros.length} erro(s) na base</h2>
      <p class="dim">O Banco de dados do menu deixa a base ficar inconsistente enquanto você monta, mas a
      temporada precisa dela fechada. Resolva o que está abaixo e volte.</p>
      <div class="card flat" style="margin-top:10px"><div class="feed">
        ${val.erros.slice(0,14).map(e=>'<div class="err">· '+esc(e)+'</div>').join('')}
        ${val.erros.length>14?'<div class="dim">… e mais '+(val.erros.length-14)+'</div>':''}
      </div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn" id="njValidar">Abrir a aba Validação</button>
        <button class="btn ghost" data-close>Fechar</button></div></div></div>`;
    $('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=fechar);
    $('#njValidar').onclick=()=>{edAba='validar';$('#modal').innerHTML='';modo='menu';telaMenu='banco';render();};
    return;
  }
  const cen=escCenario&&typeof desafioDef==='function'?desafioDef(escCenario):null;
  /* o cenário escolhe a divisão quando só faz sentido numa */
  if(cen&&G){const ok=tr=>G.regioes[escRegiao][tr===1?'t1':'t2'].some(id=>cen.filtro(T(id)));
    if(!ok(escTier)&&ok(escTier===1?2:1))escTier=escTier===1?2:1;}
  const times=G?G.regioes[escRegiao][escTier===1?'t1':'t2'].filter(id=>!cen||cen.filtro(T(id))).sort((a,b)=>T(b).prestigio-T(a).prestigio):[];
  /* clube em destaque na prévia: o escolhido, se ainda estiver na lista, ou o primeiro */
  const sel=times.includes(escSel)?escSel:times[0];
  const selT=sel?T(sel):null;
  /* repintura da mesma tela (trocar região, escolher clube): sem a animação
     de abertura e no mesmo ponto da rolagem */
  const antes=$('#modal .ovl.nj-ovl');
  const rolA=antes?antes.scrollTop:0,rolB=antes&&antes.querySelector('.box')?antes.querySelector('.box').scrollTop:0;
  pintarModal(`<div class="ovl nj-ovl ${antes?'sem-entrada':''}"><div class="box wide">
    <div class="eyebrow">Novo jogo</div><h2 class="sec">Quem é você</h2>
    <div class="nj-perfil">
      <div class="nj-foto">
        <label class="nj-foto-img" title="Escolher foto">${escFoto?`<img src="${escFoto}" alt="">`:`<span>${icone('mais')}<b>Sua foto</b></span>`}
          <input type="file" id="njFoto" accept="image/*" hidden></label>
        ${escFoto?'<button class="btn ghost sm" id="njFotoTira">Tirar a foto</button>':'<span class="dim">opcional · PNG ou JPG</span>'}
      </div>
      <div class="nj-campos campos">
        <label>Seu nome<input type="text" id="njNome" value="${esc(escNome)}" maxlength="28" placeholder="como a imprensa vai te chamar"></label>
        <label>Nacionalidade${selectPais('id="njPais"',escPais)}</label>
        <label>Idade<input type="number" id="njIdade" value="${escIdade}" min="22" max="70"></label>
        <label>Gênero<select id="njGenero"><option value="m" ${escGenero==='m'?'selected':''}>Masculino</option><option value="f" ${escGenero==='f'?'selected':''}>Feminino</option></select></label>
      </div>
    </div>
    <div class="eyebrow" style="margin-top:14px">Papel</div>
    <div class="nj-papeis">${PAPEIS.map(p=>`
        <button class="nj-papel ${escPapel===p.id?'on':''}" data-papel="${p.id}">
          <b>${esc(p.nome)}</b>
          <span>${esc(p.resumo)}</span>
          <i>${esc(p.detalhe)}${p.id==='treinador'?' Você é o head coach: o coach do clube vai para o mercado.':' O coach do clube continua no cargo.'}</i>
        </button>`).join('')}</div>
    ${escPapel==='treinador'?`
    <div class="eyebrow" style="margin-top:14px">Trajetória</div>
    <div class="nj-papeis">${MODOS_TREINADOR.map(md=>`
        <button class="nj-papel ${escModo===md.id?'on':''}" data-modo="${md.id}">
          <b>${esc(md.nome)} <span class="nj-ov">coach ${md.over[escTier]}${md.id==='carreira'?' → até '+md.pot:''}</span></b>
          <span>${esc(md.resumo)}</span></button>`).join('')}</div>
    <div class="eyebrow" style="margin-top:14px">Estilo</div>
    <div class="nj-estilos">${ESTILOS_TREINADOR.map(e=>`
        <button class="nj-estilo ${escEstilo===e.id?'on':''}" data-estilo="${e.id}"><b>${esc(e.nome)}</b><span>${esc(e.desc)}</span>
          <i>${esc(ATTRS_STAFF.find(a=>a[0]===e.mais)[1])} +</i></button>`).join('')}</div>`:''}
    <div class="eyebrow" style="margin-top:16px">Dificuldade</div>
    <div class="nj-papeis">${Object.entries(DIFICULDADES).map(([k,d])=>`
      <button class="nj-papel ${escDif===k?'on':''}" data-dif="${k}"><b>${esc(d.nome)}</b><span>${esc(d.resumo)}</span></button>`).join('')}</div>
    <div class="eyebrow" style="margin-top:16px">Modo de jogo</div>
    <div class="nj-papeis">
      <button class="nj-papel ${!escCenario?'on':''}" data-cenario=""><b>Carreira</b><span>Escolha qualquer clube e escreva a sua história.</span></button>
      <button class="nj-papel ${escCenario?'on':''}" data-cenario="${escCenario||DESAFIOS[0].id}"><b>Cenário de desafio</b><span>Um começo difícil, com objetivo e prazo. A carreira continua depois.</span></button>
    </div>
    ${escCenario?`<div class="nj-cenarios">${DESAFIOS.map(d=>`<button class="nj-cen ${escCenario===d.id?'on':''}" data-cenario="${d.id}">
        <span class="nj-cen-ic">${icone(d.ic,escCenario===d.id?'ouro':'')}</span><b>${esc(d.nome)}</b>
        <span>${esc(d.resumo)}</span><i>${icone('alvo')} ${esc(d.objetivo)}</i></button>`).join('')}</div>`:''}
    <h2 class="sec" style="margin-top:18px">Escolha seu clube</h2>
    <p class="dim">Você assume a gestão esportiva: escalação, táticas, treino, mercado, base e finanças. O circuito roda sozinho ao seu redor.</p>
    <div class="tabs" style="margin-top:14px">${REGIONS.map(r=>`<button data-rg="${r.id}" class="${escRegiao===r.id?'on':''}">${r.nome}</button>`).join('')}</div>
    <div class="tabs">${[[1,'Liga principal (Tier 1)'],[2,'Challengers (Tier 2) — modo difícil']].map(([k,n])=>`<button data-tr="${k}" class="${escTier===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="nj-escolha">
      <div class="nj-grade">${times.map(id=>{const t=T(id);const ov=Math.round(t.titulares.reduce((s,i)=>s+over(P(i)),0)/5);
        return `<button class="nj-clube ${id===sel?'on':''}" data-njsel="${id}" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
          ${escudo(t,56)}<b>${esc(t.nome)}</b><span class="nj-mini"><span>prest. <b class="num">${Math.round(t.prestigio)}</b></span><span>over <b class="num">${ov}</b></span></span></button>`;}).join('')}</div>
      ${selT?(()=>{const t=selT;const ov=Math.round(t.titulares.reduce((s,i)=>s+over(P(i)),0)/5);
        const fo=t.elenco.reduce((s,i)=>s+P(i).salario,0);
        return `<div class="nj-prev" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
          <div class="nj-prev-topo">${escudo(t,84)}<div><div class="eyebrow">${esc(nomeLiga(t))}</div><h3>${esc(t.nome)}</h3>
            <div class="nj-prev-k"><span>Prestígio <b class="num">${Math.round(t.prestigio)}</b></span><span>Over <b class="num">${ov}</b></span>
              <span>Caixa <b class="num">${money(t.caixa)}</b></span><span>Folha <b class="num">${money(fo)}/mês</b></span></div></div></div>
          <div class="nj-prev-cartas">${t.titulares.map(P).filter(Boolean).map(p=>cartaJogador(p,{w:66})).join('')}</div>
          <button class="btn nj-assumir" data-pick="${t.id}">Assumir o ${esc(t.nome)} ›</button></div>`;})()
        :'<div class="nj-prev vazio">'+vazio('<b>Escolha um clube</b> na grade para ver o elenco.','clube')+'</div>'}
    </div>
    <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
      <span class="dim">Times e elencos vêm da base de dados (${Base.reg&&Base.reg.editada?'editada por você':'original'}).
        Para mudar, use o Banco de dados do menu principal.</span>
      <button class="btn ghost" data-close>Cancelar</button></div>
  </div></div>`);
  /* o nome digitado sobrevive a cada repintura da tela: sem isso, trocar de
     região no meio do preenchimento apagava o que a pessoa escreveu */
  if(antes){const o=$('#modal .ovl');if(o){o.scrollTop=rolA;const b=o.querySelector('.box');if(b)b.scrollTop=rolB;}}
  const guardaNome=()=>{const el=$('#njNome');if(el)escNome=el.value;
    const pa=$('#njPais');if(pa)escPais=pa.value;const id=$('#njIdade');if(id)escIdade=clamp(parseInt(id.value)||34,22,70);
    const ge=$('#njGenero');if(ge)escGenero=ge.value;};
  ['#njNome','#njPais','#njIdade','#njGenero'].forEach(sel=>{const el=$(sel);if(el){el.oninput=guardaNome;el.onchange=guardaNome;}});
  const inFoto=$('#njFoto');
  if(inFoto)inFoto.onchange=async()=>{guardaNome();
    try{escFoto=await fotoDoArquivo(inFoto.files[0]);telaNovoJogo();}catch(e){flash(e.message);}};
  const tiraFoto=$('#njFotoTira');if(tiraFoto)tiraFoto.onclick=()=>{guardaNome();escFoto=null;telaNovoJogo();};
  $('#modal').querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>{guardaNome();escModo=b.dataset.modo;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-estilo]').forEach(b=>b.onclick=()=>{guardaNome();escEstilo=b.dataset.estilo;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-papel]').forEach(b=>b.onclick=()=>{
    guardaNome();escPapel=b.dataset.papel;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-dif]').forEach(b=>b.onclick=()=>{guardaNome();escDif=b.dataset.dif;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-cenario]').forEach(b=>b.onclick=()=>{guardaNome();escCenario=b.dataset.cenario||null;escSel=null;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-rg]').forEach(b=>b.onclick=()=>{guardaNome();escRegiao=b.dataset.rg;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-njsel]').forEach(b=>b.onclick=()=>{guardaNome();escSel=b.dataset.njsel;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{guardaNome();escTier=+b.dataset.tr;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=fechar);
  $('#modal').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
    guardaNome();
    G.meuTime=b.dataset.pick;
    G.iniciadaEm=Date.now();
    aplicarDificuldade(escDif,T(G.meuTime));
    iniciarGuia();
    criarManager(escNome,escPapel,{foto:escFoto,pais:escPais,idade:escIdade,genero:escGenero,modo:escModo,estilo:escEstilo});
    if(typeof instalarManagerNoClube==='function')instalarManagerNoClube(T(G.meuTime));
    iniciarBase(T(G.meuTime));
    if(escCenario&&typeof iniciarDesafio==='function')iniciarDesafio(escCenario,T(G.meuTime));
    if(typeof iniciarPlano==='function')iniciarPlano(T(G.meuTime));
    montarMetas();
    const eu=G.manager;
    noticia((souTreinador()?'👔 ':'🏛 ')+eu.nome+' assumiu como '+
            (souTreinador()?'treinador':'diretoria')+' do '+T(G.meuTime).nome+'.',{c:'clube',t:[G.meuTime]});
    if(souTreinador()&&eu.metas.length)
      noticia('🎯 Meta da diretoria para '+G.ano+': '+eu.metas[0].texto+'.',{c:'clube',t:[G.meuTime]});
    salvarRun(G.runNome);
    $('#modal').innerHTML='';
    tela='inicio';hist=['inicio'];histPos=0;
    entrarNoJogo();
    flash('Boa sorte no comando do '+T(G.meuTime).nome+'.');
  });
}
