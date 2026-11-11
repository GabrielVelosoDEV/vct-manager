/* ============================================================
   NOTÍCIAS COMO FEED
   ------------------------------------------------------------
   Cada notícia vira um post de quem a assinou (core/imprensa.js):
   foto do autor, @, veículo, há quanto tempo, a mídia do assunto
   (jogador, clube ou a foto da cena) e o engajamento. As notícias
   grandes trazem reações. Clicar num autor abre o perfil dele, de
   onde dá para seguir; "Seguindo" filtra o feed por quem você segue.
   ============================================================ */
let newsLimite=30;
let newsPerfilAba='posts';
const SELO_VERIF=`<svg class="ps-verif" viewBox="0 0 24 24" aria-label="verificado"><path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="currentColor"/><path d="M8 12.2l2.6 2.6L16.2 9" fill="none" stroke="#0B1218" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* iniciais na cor do veículo: o que aparece sem logo e sem foto */
function monogramaImprensa(txt,cor,px,redondo){
  const ini=String(txt).replace(/[^\p{L}\p{N} ]/gu,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
  return `<span class="ps-mono ${redondo?'r':''}" style="--c:${cor||'#4A5866'};width:${px}px;height:${px}px;font-size:${Math.round(px*0.38)}px">${esc(ini)}</span>`;
}
function avatarImprensa(p,px){
  px=px||44;
  if(!p)return monogramaImprensa('?','#4A5866',px,true);
  const v=veiculoDoPerfil(p);
  const M=typeof MIDIA!=='undefined'&&MIDIA.arquivos?MIDIA.arquivos:{};
  if(p.tipo==='clube'){
    const t=G.times[p.timeId];
    return `<span class="ps-av-clube" style="width:${px}px;height:${px}px;--clube:${t?corDoClube(t):'#5B6B7A'}">${t?escudo(t,Math.round(px*0.72)):''}</span>`;
  }
  if(p.tipo==='veiculo'){
    const fb=monogramaImprensa(v?v.nome:p.nome,v&&v.cor,px,false);
    return M['veiculos/'+v.id]?`<span class="ps-av-img q" style="width:${px}px;height:${px}px"><img src="${ASSETS.arq('veiculos',v.id)}" alt="" loading="lazy"></span>`:fb;
  }
  if(p.real){
    return M['imprensa/'+p.slug]?`<span class="ps-av-img" style="width:${px}px;height:${px}px"><img src="${ASSETS.arq('imprensa',p.slug)}" alt="" loading="lazy"></span>`
      :monogramaImprensa(p.nome,'#5B6B7A',px,true);
  }
  /* jornalista fictício: rosto do pacote sintético, senão as iniciais */
  const r=typeof Rostos!=='undefined'?Rostos.caminho(p):null;
  const fb=monogramaImprensa(p.nome,v&&v.cor,px,true);
  return r?`<span class="ps-av-img" style="width:${px}px;height:${px}px"><img src="${r}" alt="" loading="lazy" onerror="this.parentNode.outerHTML=decodeURIComponent('${encodeURIComponent(fb)}')"></span>`:fb;
}
function rotuloPerfil(p){
  if(!p)return '';
  if(p.tipo==='veiculo')return 'Veículo';
  if(p.tipo==='clube')return 'Perfil oficial';
  if(p.real)return {jornalista:'Jornalista',streamer:'Streamer',caster:'Caster',criador:'Criador de conteúdo'}[p.tipo]||'Imprensa';
  const c=CARGOS_IMPRENSA.find(k=>k.id===p.cargo);return c?c.nome:'Jornalista';
}
function tempoPost(n){
  if(!n.s)return String(n.ano);
  const ag=(G.ano||0)*SEMANAS_ANO+(G.semana||1),d=ag-((n.ano||0)*SEMANAS_ANO+n.s);
  if(d<=0)return 'esta semana';
  if(d<8)return 'há '+d+' sem';
  return rotuloSemanaCurto(n.ano,n.s);
}
function numCurto(x){
  if(x>=1e6)return (x/1e6).toFixed(1).replace('.',',').replace(',0','')+' mi';
  if(x>=1e4)return Math.round(x/1e3)+' mil';
  if(x>=1e3)return (x/1e3).toFixed(1).replace('.',',').replace(',0','')+' mil';
  return String(x);
}

/* mídia do post: o jogador citado, a foto do assunto com a placa do clube,
   ou o escudo do clube na cor dele */
function midiaPost(n){
  const p=n.p&&n.p.length?G.jogadores[n.p[0]]:null;
  if(p){
    const t=p.timeId&&G.times[p.timeId];
    const cor=t?corDoClube(t):'#5B6B7A';
    return `<div class="ps-m ps-mj jrow" data-p="${p.id}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
      <span class="ps-mj-f">${retrato(p,72)}</span>
      <span class="ps-mj-t"><span class="eyebrow">${esc(p.role||'')}${p.idade?' · '+p.idade+' anos':''}</span><b>${esc(p.nome)}</b>
        <span class="dim">${t?escudo(t,16)+' '+esc(t.nome):'sem clube'}</span></span>
      ${t?`<span class="ps-mj-esc">${escudo(t,64)}</span>`:''}</div>`;
  }
  const cena=typeof cenaDaNoticia==='function'?cenaDaNoticia(n):null;
  const t=n.t&&n.t.length?G.times[n.t[0]]:null;
  if(cena)return `<div class="ps-m ps-mc com-cena">${cenaFoto('cenas',cena,timeDaNoticia(n),{foco:'placa'})}</div>`;
  if(t){
    const cor=corDoClube(t);
    return `<div class="ps-m ps-mt" data-clube="${t.id}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
      ${escudo(t,64)}<span><b>${esc(t.nome)}</b><span class="dim">${esc(nomeLiga(t))}</span></span></div>`;
  }
  return '';
}
function postNoticia(n,opc){
  opc=opc||{};
  const a=autorDaNoticia(n);
  const v=veiculoDoPerfil(a);
  const eng=engajamentoNoticia(n);
  const rx=opc.semReacoes?[]:reacoesNoticia(n);
  const trad=v&&v.lingua!=='pt'?LINGUA_NOME[v.lingua]:null;
  const cat=CAT_NOTICIA[n.c]||'Circuito';
  return `<article class="ps ${n.meu?'me':''} ${(n.imp||1)>=2?'imp':''} ${opc.destaque?'destaque':''}">
    <button class="ps-av" data-perfil="${a?a.id:''}" title="Ver perfil">${avatarImprensa(a,opc.destaque?52:44)}</button>
    <div class="ps-c">
      <div class="ps-topo">
        <button class="ps-nome" data-perfil="${a?a.id:''}"><b>${esc(a?a.nome:'Imprensa')}</b>${a&&a.verificado?SELO_VERIF:''}</button>
        <span class="ps-arroba">@${esc(a?a.arroba:'imprensa')}</span><span class="ps-pt">·</span><span class="ps-tempo">${esc(tempoPost(n))}</span>
        ${v&&a.tipo!=='veiculo'?`<button class="ps-veic" data-perfil="v-${v.id}" style="--c:${v.cor}">${esc(v.nome)}</button>`:''}
        <span class="ps-cat">${icone(ICONE_CAT[n.c]||'jornal')}${esc(cat)}</span>
      </div>
      ${opc.destaque?`<div class="eyebrow ps-dest">Manchete da semana</div>`:''}
      <div class="ps-txt">${textoNoticia(n)}</div>
      ${trad?`<div class="ps-trad">Traduzido do ${trad}</div>`:''}
      ${midiaPost(n)}
      <div class="ps-acoes"><span>${ico('balao')}${numCurto(eng.respostas)}</span><span>${ico('ciclo')}${numCurto(eng.reposts)}</span>
        <span>${ico('coracao')}${numCurto(eng.curtidas)}</span></div>
      ${rx.length?`<div class="ps-rx">${rx.map(r=>`<div class="ps-r"><button class="ps-av" data-perfil="${r.autor.id}">${avatarImprensa(r.autor,28)}</button>
        <div><button class="ps-nome" data-perfil="${r.autor.id}"><b>${esc(r.autor.nome)}</b>${r.autor.verificado?SELO_VERIF:''}</button>
        <span class="ps-arroba">${esc(rotuloPerfil(r.autor))}</span><div class="ps-r-t">${esc(r.txt)}</div></div>
        <span class="ps-r-c">${ico('coracao')}${numCurto(r.curtidas)}</span></div>`).join('')}</div>`:''}
    </div>
  </article>`;
}

/* ---------- a página ---------- */
function noticiasDaAba(aba){
  const base=G.noticias.filter(n=>n.txt&&n.c!=='sistema');
  if(aba==='tudo')return base;
  if(aba==='clube')return base.filter(n=>n.meu);
  if(aba==='seguindo')return base.filter(noticiaSeguida);
  return base.filter(n=>n.c===aba);
}
function vNews(){
  garantirImprensa();
  const t=meu();
  const abas=[['tudo','Para você','jornal'],['seguindo','Seguindo','estrela'],['clube','Meu clube','clube'],['torcida','Torcida','balao'],
    ['mercado','Mercado','aperto'],['competicoes','Competições','trofeu'],['meta','Meta e mapas','mapa'],['carreira','Carreira','gravata']];
  const todas=noticiasDaAba(newsAba);
  const m=newsAba==='tudo'&&typeof manchete==='function'?manchete():null;
  const lista=todas.filter(n=>n!==m).slice(0,newsLimite);
  /* em alta: os clubes mais citados nas duas últimas semanas */
  const ag=(G.ano||0)*SEMANAS_ANO+(G.semana||1);
  const conta={};
  for(const n of G.noticias){
    if(!n.s||ag-((n.ano||0)*SEMANAS_ANO+n.s)>2)continue;
    for(const id of n.t||[])conta[id]=(conta[id]||0)+1;
    for(const id of n.p||[]){const p=G.jogadores[id];if(p&&p.timeId)conta[p.timeId]=(conta[p.timeId]||0)+1;}
  }
  const alta=Object.entries(conta).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,q])=>({t:G.times[id],q})).filter(x=>x.t);
  /* quem cobre o seu clube: os autores das notícias dele */
  const cobre={};
  for(const n of G.noticias.filter(x=>x.meu).slice(0,60)){const a=autorDaNoticia(n);if(a)cobre[a.id]=(cobre[a.id]||0)+1;}
  const P=perfisImprensa();
  const quem=Object.entries(cobre).sort((a,b)=>b[1]-a[1]).map(([id])=>P[id]).filter(Boolean).slice(0,5);
  /* veículos da sua região */
  const pais=t&&typeof paisDoClube==='function'?paisDoClube(t):null;
  const veics=VEICULOS.filter(v=>t&&(v.regiao===t.regiao||v.regiao==='GLOBAL'))
    .sort((a,b)=>(pais&&b.paises.includes(pais)?2:b.regiao===t.regiao?1:0)-(pais&&a.paises.includes(pais)?2:a.regiao===t.regiao?1:0)||b.alcance-a.alcance).slice(0,7);
  const linhaPerfil=p=>`<div class="fd-pf"><button class="ps-av" data-perfil="${p.id}">${avatarImprensa(p,34)}</button>
    <button class="fd-pf-t" data-perfil="${p.id}"><b>${esc(p.nome)}${p.verificado?SELO_VERIF:''}</b><span>${esc(p.tipo==='veiculo'?'@'+p.arroba:rotuloPerfil(p)+(veiculoDoPerfil(p)?' · '+veiculoDoPerfil(p).nome:''))}</span></button>
    <button class="fd-seg ${seguindoImprensa(p.id)?'on':''}" data-seguir="${p.id}">${seguindoImprensa(p.id)?'Seguindo':'Seguir'}</button></div>`;
  const vazioTxt=newsAba==='seguindo'?'<b>Você ainda não segue ninguém.</b> Abra um jornalista ou veículo e toque em Seguir.'
    :'<b>Sem posts aqui.</b> Eles chegam a cada semana que você avança.';
  return `<div class="eyebrow">Imprensa</div><h2 class="sec">Notícias</h2>
  <div class="fd">
    <nav class="fd-nav">${abas.map(([k,n,ic])=>{
      const q=k==='tudo'?0:k==='torcida'?(G.torcidaFeed||[]).filter(e=>e.t===G.meuTime).length:noticiasDaAba(k).length;
      return `<button data-newsaba="${k}" class="${newsAba===k?'on':''}">${ico(ic)}<span>${n}</span>${q?`<i class="num">${q}</i>`:''}</button>`;}).join('')}</nav>
    <div class="fd-col">
      ${newsAba==='torcida'&&typeof abaTorcidaHTML==='function'?abaTorcidaHTML():`
      ${m?postNoticia(m,{destaque:true}):''}
      ${lista.length?lista.map(n=>postNoticia(n)).join(''):vazio(vazioTxt,'jornal')}
      ${todas.length>newsLimite+(m?1:0)?`<div class="nw-mais"><button class="btn ghost" data-newsmais>Carregar mais <span class="dim">(${todas.length-newsLimite-(m?1:0)} restantes)</span></button></div>`:''}`}
    </div>
    <aside class="fd-lado">
      ${alta.length?`<div class="card fd-box"><div class="eyebrow">Em alta</div>${alta.map((x,i)=>`<button class="fd-alta" data-clube="${x.t.id}">
        <span class="dim num">${i+1}</span><span><b>#${esc(x.t.tag)}</b><span class="dim">${x.q} post${x.q>1?'s':''} · ${esc(nomeLiga(x.t))}</span></span>${escudo(x.t,24)}</button>`).join('')}</div>`:''}
      ${quem.length?`<div class="card fd-box"><div class="eyebrow">Quem cobre o ${esc(t?t.tag:'clube')}</div>${quem.map(linhaPerfil).join('')}</div>`:''}
      <div class="card fd-box"><div class="eyebrow">Veículos</div>${veics.map(v=>linhaPerfil(P['v-'+v.id])).join('')}</div>
    </aside>
  </div>`;
}

/* ---------- perfil ---------- */
function modalPerfilImprensa(id){
  const p=perfilImprensa(id);if(!p)return;
  const v=veiculoDoPerfil(p);
  /* streamer, caster e criador não assinam notícia: o perfil mostra onde reagiram */
  const reage=p.real&&p.tipo!=='jornalista';
  const posts=G.noticias.filter(n=>n.txt&&n.c!=='sistema'&&(reage?(n.imp||1)>=2&&reacoesNoticia(n).some(r=>r.autor.id===id)
    :(()=>{const a=autorDaNoticia(n);return a&&(a.id===id||p.tipo==='veiculo'&&a.veiculo===p.veiculo);})()));
  const equipe=p.tipo==='veiculo'?Object.values(perfisImprensa()).filter(x=>x.veiculo===p.veiculo&&x.tipo!=='veiculo'):[];
  const seg=hashImp(id)%1000;
  const seguidores=p.tipo==='veiculo'?(v.alcance||1)*120000+seg*700:p.real?40000+seg*900:800+seg*40;
  const onde=p.tipo==='veiculo'?(v.regiao==='GLOBAL'?'Global':v.regiao)+(v.paises.length?' · '+v.paises.join(', '):'')
    :v?(v.regiao==='GLOBAL'?'Global':v.regiao):p.local||'';
  const cor=v?v.cor:'#5B6B7A';
  abrir(`<div class="pf" style="--c:${cor}">
    <div class="pf-capa"></div>
    <div class="pf-topo">
      <span class="pf-av">${avatarImprensa(p,88)}</span>
      <button class="fd-seg grande ${seguindoImprensa(id)?'on':''}" data-seguir="${id}">${seguindoImprensa(id)?'Seguindo':'Seguir'}</button>
    </div>
    <h2 class="sec pf-nome">${esc(p.nome)}${p.verificado?SELO_VERIF:''}</h2>
    <div class="dim">@${esc(p.arroba)}</div>
    <div class="pf-bio">${p.tipo==='veiculo'?`Veículo de esports${v.lingua!=='pt'?' em '+LINGUA_NOME[v.lingua]:''}. Cobre ${(v.foco||[]).map(c=>(CAT_NOTICIA[c]||c).toLowerCase()).join(', ')}.`
      :`${esc(rotuloPerfil(p))}${v?` no <button class="ps-veic" data-perfil="v-${v.id}" style="--c:${v.cor}">${esc(v.nome)}</button>`:p.real&&p.tipo==='jornalista'?' independente':''}.`}
      ${onde?`<span class="dim"> ${icone('mundo')} ${esc(onde)}</span>`:''}</div>
    <div class="pf-num"><span><b>${posts.length}</b> ${reage?'reações':'posts'} na carreira</span><span><b>${numCurto(seguidores)}</b> seguidores</span>
      ${equipe.length?`<span><b>${equipe.length}</b> na equipe</span>`:''}</div>
    ${equipe.length?`<div class="pf-eq">${equipe.map(x=>`<button class="pf-eq-p" data-perfil="${x.id}">${avatarImprensa(x,30)}<span><b>${esc(x.nome)}</b><span class="dim">${esc(rotuloPerfil(x))}</span></span></button>`).join('')}</div>`:''}
    <div class="pf-posts">${posts.length?posts.slice(0,12).map(n=>postNoticia(n,{semReacoes:!reage})).join('')
      :`<div class="dim" style="padding:12px">${reage?'Ainda não reagiu a nenhuma notícia grande nesta carreira.':'Ainda não postou nesta carreira.'}</div>`}</div>
    <div class="neg-bts" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button></div>
  </div>`,true,!!$('#modal .pf'));
  const md=$('#modal');
  ligarImprensa(md);
  if(typeof ligarClubes==='function')ligarClubes(md);
  md.querySelectorAll('.jrow').forEach(r=>r.onclick=e=>{e.stopPropagation();modalJogador(r.dataset.p);});
}

/* cliques do feed: na página e dentro do perfil aberto */
function ligarImprensa(raiz){
  if(!raiz)return;
  raiz.querySelectorAll('[data-perfil]').forEach(el=>{if(!el.dataset.perfil)return;
    el.onclick=e=>{e.stopPropagation();const id=el.dataset.perfil;
      if(id.startsWith('c-')){if(typeof irClube==='function')irClube(id.slice(2));return;}
      modalPerfilImprensa(id);};});
  raiz.querySelectorAll('[data-seguir]').forEach(el=>el.onclick=e=>{e.stopPropagation();
    const id=el.dataset.seguir,p=perfilImprensa(id);
    const agora=alternarSeguir(id);
    flash(agora?'Seguindo '+(p?p.nome:''):'Deixou de seguir '+(p?p.nome:''));
    if(raiz.id==='modal'||raiz.closest&&raiz.closest('#modal'))modalPerfilImprensa(id);
    render();});
}
