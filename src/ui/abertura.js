/* ============================================================
   TELA INICIAL — o que abre quando o jogo abre
   ------------------------------------------------------------
   Três camadas:
     · fundo vivo: auroras nas cores do Valorant (e do seu clube), um
       piso de escudos em perspectiva que desliza, feixes de luz que
       cruzam a tela, faíscas subindo e um leve movimento com o mouse.
       Uma imagem própria em assets/ui/menu-fundo.webp entra por baixo
       de tudo, com zoom lento — sem ela, o fundo é todo desenhado;
     · coluna do menu: marca, a ação principal (Continuar ou Novo jogo)
       e o resto em ordem de uso; Configurações e Créditos no pé;
     · palco: o título e três cartões — a sua carreira, o próximo
       compromisso e links para o VCT de verdade.
   Tudo para com "Animação" desligada ou com movimento reduzido. Nada
   aqui usa o rnd() do motor: as faíscas são Math.random, que não mexe
   na semente da carreira.
   ============================================================ */

let _aberturaVista=false;

/* símbolo da marca: um V em duas lâminas, desenhado aqui */
function marcaVCT(px){
  return `<svg class="mn-simbolo" width="${px}" height="${px}" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M6 10h14l14 30-7 14z" fill="var(--red)"/>
    <path d="M58 10H44L34 32l7 14z" fill="#ECE8E1"/>
    <path d="M38 50l4-8h10l-4 8z" fill="var(--red)" opacity=".8"/></svg>`;
}

/* o emblema do jogo (assets/ui/logo.png, recortado do favicon); se o
   arquivo faltar, fica o V desenhado */
function logoJogo(px){
  const fb=encodeURIComponent(marcaVCT(px));
  return `<span class="mn-logo" style="width:${px}px;height:${px}px"><img src="assets/ui/logo.png" width="${px}" height="${px}" alt=""
    onerror="this.parentNode.innerHTML=decodeURIComponent('${fb}')"></span>`;
}
/* "salvo há 12 min" */
function haQuanto(ms){
  if(!ms)return '';
  const s=Math.max(0,(Date.now()-ms)/1000);
  if(s<90)return 'agora mesmo';
  const m=Math.round(s/60);if(m<60)return 'há '+m+' min';
  const h=Math.round(m/60);if(h<24)return 'há '+h+' h';
  const d=Math.round(h/24);return d===1?'ontem':'há '+d+' dias';
}

/* O próximo compromisso, só lendo o estado. O proximoConfronto() da
   Central monta a semana se ela ainda não foi montada; na tela inicial
   isso não pode acontecer (seria mexer na carreira sem você entrar). */
function proximoDaCarreira(){
  if(!G||!G.meuTime||!G.calendario)return null;
  const i=typeof blocoDaSemana==='function'?blocoDaSemana(G.semana||1):null;
  const b=i==null?null:G.calendario[i];
  if(b){
    for(const s of b.stages||[]){
      if(s.feito)continue;
      const par=(s.rodadaAtual||[]).find(x=>x.includes(G.meuTime));
      if(par)return{stage:s,adv:par[0]===G.meuTime?par[1]:par[0]};
    }
    return{agora:b};
  }
  const nb=typeof proximoBloco==='function'?proximoBloco(G.semana||1):null;
  return nb?{espera:nb,semanas:nb.ini-(G.semana||1)}:null;
}
/* a tabela que vale para a posição (a mesma escolha da Central) */
function tabelaDaCasaMenu(t){
  if(typeof acharStage!=='function')return null;
  const metade=(G.semana||1)>=25?'2':'1';
  const pre=(t.tier===1?'s':'c')+metade+'_';
  return acharStage(pre+t.regiao)||acharStage((t.tier===1?'s1_':'c1_')+t.regiao)
    ||(t.tier===1?acharStage('kg_'+t.regiao):null);
}

/* ---------- cartões do palco ---------- */
function cartaoCarreira(){
  const t=G&&G.meuTime&&G.times[G.meuTime];
  if(!t)return `<article class="mn-card mn-c-novo">
      <div class="mn-c-cab"><span class="eyebrow">Sua carreira</span></div>
      <h3>Comece a sua história</h3>
      <p>Escolha um dos 80 clubes do circuito, monte a comissão, contrate, treine e leve o time ao Champions.</p>
      <ul class="mn-c-lista"><li>${icone('elenco')} elencos reais de 2027</li><li>${icone('trofeu')} Kickoff, Stages, Masters e Champions</li>
        <li>${icone('dinheiro')} mercado, patrocínio e estrutura</li></ul>
      <button class="btn mn-c-bt" data-mn="novo">Novo jogo ›</button>
    </article>`;
  const cor=corDoClube(t);
  const tp=t.temporada||{v:0,d:0};
  const rr=tabelaDaCasaMenu(t);
  const pos=rr&&typeof posicaoNaTabela==='function'?posicaoNaTabela(t,rr):null;
  const g=G.manager||{};
  const mm=typeof membroManager==='function'&&membroManager();
  const foto=mm?retratoStaff(mm,30):g.foto?`<img class="foto-j" src="${g.foto}" width="30" height="38" alt="">`:'';
  const salva=listaRuns[0];
  return `<article class="mn-card mn-c-car" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
      <div class="mn-c-marca" aria-hidden="true">${escudo(t,180)}</div>
      <div class="mn-c-cab"><span class="eyebrow">Sua carreira</span><span class="mn-c-hora">${salva?'salvo '+esc(haQuanto(salva.atualizado)):''}</span></div>
      <div class="mn-c-clube">${escudo(t,58)}<div><b>${esc(t.nome)}</b><span>${esc(nomeLiga(t))}</span></div></div>
      ${g.nome?`<div class="mn-c-mgr">${foto}<span><b>${esc(g.nome)}</b> · ${souTreinador()?'treinador':'diretoria'}${mm?` · coach <b class="num">${overStaff(mm)}</b>`:''}</span></div>`:''}
      <div class="mn-c-nums">
        <div><span>Temporada</span><b class="num">${G.ano} · S${G.semana||1}</b></div>
        <div><span>Posição</span><b class="num">${pos&&(tp.v+tp.d)>0?pos.pos+'º de '+pos.de:'—'}</b></div>
        <div><span>Campanha</span><b class="num">${tp.v}V ${tp.d}D</b></div>
        <div><span>Caixa</span><b class="num ${t.caixa<0?'dn':''}">${money(t.caixa)}</b></div>
      </div>
      <button class="btn mn-c-bt" data-mn="continuar">Continuar ›</button>
    </article>`;
}
function cartaoProximo(){
  const t=G&&G.meuTime&&G.times[G.meuTime];
  if(!t){
    const R=typeof REGIONS!=='undefined'?REGIONS:[];
    return `<article class="mn-card mn-c-circ">
      <div class="mn-c-cab"><span class="eyebrow">O circuito</span></div>
      <div class="mn-c-regs">${R.map(r=>`<div style="--c:var(--r-${r.id})"><b>${esc(r.nome.replace('VCT ',''))}</b><span>liga + Challengers</span></div>`).join('')}</div>
      <p>Três internacionais por ano: dois Masters e o Champions, cada um numa cidade-sede.</p>
    </article>`;
  }
  const px=proximoDaCarreira();
  if(px&&px.adv&&G.times[px.adv]){
    const adv=G.times[px.adv],s=px.stage;
    const sede=typeof sedeDoStage==='function'?sedeDoStage(s):null;
    return `<article class="mn-card mn-c-jogo" ${sede?`style="${fundoCidade(sede.slug,0.78)}"`:''}>
      <div class="mn-c-cab"><span class="eyebrow">Próximo jogo</span><span class="chip">MD${s.bo||3}</span></div>
      <div class="mn-vs"><div style="--clube:${corDoClube(t)}">${escudo(t,62)}<b>${esc(t.tag)}</b></div>
        <span class="mn-vs-x">VS</span>
        <div style="--clube:${corDoClube(adv)}">${escudo(adv,62)}<b>${esc(adv.tag)}</b></div></div>
      <div class="mn-c-onde"><b>${esc(nomeStage(s))}</b><span>${esc(rotuloSemana(G.ano,G.semana||1))}${sede?' · '+esc(sede.nome):''}</span></div>
    </article>`;
  }
  if(px&&px.agora){
    const b=px.agora,sede=typeof sedeDoBloco==='function'?sedeDoBloco(b,t):null;
    return `<article class="mn-card mn-c-jogo" ${sede?`style="${fundoCidade(sede.slug,0.8)}"`:''}>
      <div class="mn-c-cab"><span class="eyebrow">Em disputa</span></div>
      <div class="mn-c-grande">${esc(nomeBloco(b))}</div>
      <div class="mn-c-onde"><span>${esc(rotuloPeriodo(G.ano,b.ini,b.fim))}${sede?' · '+esc(sede.nome):''}</span>
        <span>o jogo da semana aparece quando você entra</span></div>
    </article>`;
  }
  if(px&&px.espera){
    const b=px.espera,sede=typeof sedeDoBloco==='function'?sedeDoBloco(b,t):null;
    return `<article class="mn-card mn-c-jogo" ${sede?`style="${fundoCidade(sede.slug,0.8)}"`:''}>
      <div class="mn-c-cab"><span class="eyebrow">Próximo compromisso</span></div>
      <div class="mn-c-conta"><b class="num">${px.semanas}</b><span>semana${px.semanas===1?'':'s'}</span></div>
      <div class="mn-c-onde"><b>${esc(nomeBloco(b))}</b><span>${esc(rotuloPeriodo(G.ano,b.ini,b.fim))}${sede?' · '+esc(sede.nome):''}</span></div>
    </article>`;
  }
  return `<article class="mn-card mn-c-jogo"><div class="mn-c-cab"><span class="eyebrow">Próximo compromisso</span></div>
    <div class="mn-c-grande">Fim da temporada</div><div class="mn-c-onde"><span>A virada de ano vem com a cerimônia e o mercado.</span></div></article>`;
}
/* links para o circuito de verdade: o jogo roda offline, então não busca
   manchete nenhuma — abre os sites no navegador */
const NOTICIAS_REAIS=[
  {url:'https://www.vlr.gg/news',nome:'VLR.gg',desc:'notícias, transferências e resultados',ic:'jornal'},
  {url:'https://valorantesports.com/news',nome:'VALORANT Esports',desc:'site oficial do VCT',ic:'trofeu'},
  {url:'https://liquipedia.net/valorant/Main_Page',nome:'Liquipedia',desc:'chaves, elencos e histórico',ic:'banco'}
];
function cartaoNoticias(){
  return `<article class="mn-card mn-c-news">
    <div class="mn-c-cab"><span class="eyebrow">VCT na vida real</span></div>
    <h3>O que está rolando no circuito</h3>
    <div class="mn-links">${NOTICIAS_REAIS.map(n=>`<a href="${n.url}" target="_blank" rel="noopener noreferrer">
      <span class="mn-l-ic">${ico(n.ic)}</span><span class="mn-l-t"><b>${esc(n.nome)}</b><span>${esc(n.desc)}</span></span>
      <span class="mn-l-seta" title="abre no navegador">${ico('externo')}</span></a>`).join('')}</div>
  </article>`;
}

/* ---------- fundo ---------- */
function fundoMenu(mundo,cor){
  const base=mundo?Object.values(mundo.times):[];
  /* piso de escudos: 16 colunas × 8 linhas, repetido duas vezes para o
     deslize não ter emenda; alguns acendem de tempos em tempos */
  const COL=16,LIN=8;
  const cel=[];
  for(let i=0;i<COL*LIN;i++){
    const t=base.length?base[(i*7)%base.length]:null;
    const luz=(i*37)%11===0;
    cel.push(`<div class="${luz?'luz':''}" ${luz?`style="--d:${((i*13)%9)}s"`:''}>${t?escudo(t,46):''}</div>`);
  }
  const grade=cel.join('');
  const temFoto=typeof MIDIA!=='undefined'&&MIDIA.arquivos&&MIDIA.arquivos['ui/menu-fundo'];
  return `<div class="mn-fundo" aria-hidden="true">
    ${temFoto?`<div class="mn-foto" style="background-image:url('${ASSETS.arq('ui','menu-fundo')}')"></div>`:''}
    <div class="mn-aurora"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>
    <div class="mn-plano"><div class="mn-piso"><div class="mn-grade">${grade}</div><div class="mn-grade">${grade}</div></div></div>
    <div class="mn-feixes"><i></i><i></i><i></i></div>
    <svg class="mn-v" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
      <path d="M60 90h120l120 260-60 120z"/><path d="M540 90H420l-90 200 60 120z"/></svg>
    <canvas class="mn-faiscas"></canvas>
    <div class="mn-grao"></div><div class="mn-vinheta"></div>
  </div>`;
}

/* onde o instalador do Windows é publicado (GitHub Releases) */
const LINK_APP_PC='https://github.com/GabrielVelosoDEV/vct-manager/releases/latest';

/* ---------- a tela ---------- */
function vMenuPrincipal(){
  const mundo=(G&&G.times)?G:(Base.reg&&Base.reg.estado);
  const t=G&&G.meuTime&&G.times[G.meuTime];
  const cor=t?corDoClube(t):'#FF4655';
  const nSalvas=listaRuns.length;
  const item=(id,icn,rot,sub,cls)=>
    `<button class="menu-item ${cls||''}" id="${id}">${ico(icn)}<span class="mi-t"><b>${rot}</b>${sub?`<span class="sub">${esc(sub)}</span>`:''}</span><span class="mi-seta">${ico('seta_d')}</span></button>`;
  const principal=t
    ?`<button class="mn-principal" id="mnContinuar"><span class="mp-esc">${escudo(t,40)}</span>
        <span class="mp-t"><b>Continuar</b><span>${esc(t.nome)} · ${G.ano} · semana ${G.semana||1}</span></span><span class="mp-seta">${ico('jogar')}</span></button>`
    :`<button class="mn-principal" id="mnNovo"><span class="mp-esc mp-novo">${ico('mais')}</span>
        <span class="mp-t"><b>Novo jogo</b><span>escolha o seu clube</span></span><span class="mp-seta">${ico('jogar')}</span></button>`;
  const boot=!_aberturaVista;_aberturaVista=true;
  return `<div class="mn ${boot?'mn-boot':''}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
    ${fundoMenu(mundo,cor)}
    <aside class="mn-lado">
      <div class="mn-marca">${logoJogo(76)}<div><span class="l1">VCT</span><span class="l2">MANAGER</span></div></div>
      <span class="mn-ver">v${VERSAO_JOGO} · temporada 2027</span>
      <nav class="mn-lista" aria-label="Menu principal">
        ${principal}
        ${t?item('mnNovo','mais','Novo jogo','começa da base de dados'):''}
        ${item('mnRuns','disco','Partidas salvas',nSalvas?nSalvas+(nSalvas===1?' partida':' partidas'):'nenhuma ainda')}
        ${item('mnBanco','banco','Banco de dados',Base.resumo().times+' clubes · '+(Base.reg&&Base.reg.editada?'base editada':'base original'))}
        ${item('mnGameplay','controle','Modo jogador · protótipo','gameplay de cima, nos 13 mapas')}
        ${typeof Pasta!=='undefined'?(Pasta.estado==='pendente'
          ?item('mnPasta','alerta','Permitir a pasta de saves','o navegador pede sua confirmação','mi-aviso')
          :item('mnSaves',Pasta.estado==='ligada'?'check':'alerta','Onde ficam seus saves',textoOndeSalva(),
            Pasta.estado!=='ligada'&&!Prefs.get('savesVisto')?'mi-aviso':'')):''}
      </nav>
      ${typeof Pasta!=='undefined'&&Pasta.noApp()?'':`<a class="mn-app" href="${LINK_APP_PC}" target="_blank" rel="noopener">
        <span class="mn-app-ic">${ico('monitor')}</span><span class="mn-app-t"><b>Baixar o app de PC</b><span>Windows · grátis</span></span>${ico('externo')}</a>`}
      <div class="mn-pe">
        <button class="mn-link" id="mnConfig">${ico('engrenagem')}<span>Configurações</span></button>
        <button class="mn-link" id="mnCreditos">${ico('info')}<span>Créditos</span></button>
      </div>
    </aside>
    <div class="mn-palco">
      <div class="mn-titulo">
        <div class="mn-sobre">Valorant Champions Tour · gestão de clube</div>
        <h1><span class="t1">Circuito</span><span class="t2">Mundial</span></h1>
        <div class="mn-regioes">${(typeof REGIONS!=='undefined'?REGIONS:[]).map(r=>`<span style="--c:var(--r-${r.id})">${esc(r.nome.replace('VCT ',''))}</span>`).join('')}</div>
      </div>
      <div class="mn-cards">${cartaoCarreira()}${cartaoProximo()}${cartaoNoticias()}</div>
    </div>
  </div>`;
}

function ligarMenuPrincipal(){
  const liga=(id,fn)=>{const el=$('#'+id);if(el&&!el.disabled)el.onclick=fn;};
  const continuar=async()=>{
    if(G&&G.meuTime){entrarNoJogo();return;}
    const r=listaRuns.find(x=>x.clube&&x.clube!=='—');
    if(!r)return;
    const ok=await carregarRun(r.id);
    if(!ok){flash('Não deu para carregar essa partida.');return;}
    entrarNoJogo();
  };
  liga('mnContinuar',continuar);
  liga('mnNovo',()=>novaCarreira());
  liga('mnRuns',()=>{telaMenu='runs';render();});
  liga('mnBanco',()=>{telaMenu='banco';render();});
  liga('mnGameplay',()=>{location.href='gameplay.html';});
  liga('mnConfig',()=>{telaMenu='config';render();});
  liga('mnCreditos',()=>{telaMenu='creditos';render();});
  liga('mnPasta',()=>reconectarPasta());
  liga('mnSaves',()=>modalSaves());
  document.querySelectorAll('[data-mn]').forEach(b=>b.onclick=()=>b.dataset.mn==='continuar'?continuar():novaCarreira());
  iniciarFxMenu();
}

/* ---------- movimento: faíscas, mouse e teclado ---------- */
let _fxMenu=null;
function menuVisivel(){return modo==='menu'&&telaMenu==='menu'&&!!document.querySelector('.mn');}
function iniciarFxMenu(){
  const raiz=document.querySelector('.mn');if(!raiz)return;
  ligarTecladoMenu();
  if(typeof animacaoLigada==='function'&&!animacaoLigada())return;
  /* parallax: o mouse empurra as camadas de leve */
  if(!raiz._parallax){
    raiz._parallax=true;
    let pend=null;
    raiz.addEventListener('mousemove',e=>{
      pend=[e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1];
      if(raiz._raf)return;
      raiz._raf=requestAnimationFrame(()=>{raiz._raf=null;
        raiz.style.setProperty('--mx',pend[0].toFixed(3));raiz.style.setProperty('--my',pend[1].toFixed(3));});
    });
  }
  const cv=raiz.querySelector('.mn-faiscas');
  if(!cv||(_fxMenu&&_fxMenu.cv===cv&&_fxMenu.vivo))return;
  const cx=cv.getContext('2d');
  const cores=['255,70,85','24,229,180','236,232,225',rgbDe(getComputedStyle(raiz).getPropertyValue('--clube').trim()||'#FF4655')];
  const N=70,ps=[];
  const nova=(y)=>({x:Math.random(),y:y==null?Math.random():y,v:0.00025+Math.random()*0.0009,
    r:0.6+Math.random()*1.8,a:0.25+Math.random()*0.6,c:cores[(Math.random()*cores.length)|0],
    o:Math.random()*Math.PI*2,w:0.0006+Math.random()*0.0012});
  for(let i=0;i<N;i++)ps.push(nova());
  const fx=_fxMenu={cv,vivo:true};
  let W=0,H=0,dpr=1,t0=performance.now();
  const quadro=t=>{
    if(!fx.vivo)return;
    if(!cv.isConnected||!menuVisivel()){fx.vivo=false;return;}
    const r=cv.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);
    if(Math.round(r.width*dpr)!==W||Math.round(r.height*dpr)!==H){W=cv.width=Math.round(r.width*dpr);H=cv.height=Math.round(r.height*dpr);}
    const dt=Math.min(50,t-t0);t0=t;
    cx.clearRect(0,0,W,H);
    cx.globalCompositeOperation='lighter';
    for(const p of ps){
      p.y-=p.v*dt/16;p.o+=p.w*dt;
      if(p.y<-0.05)Object.assign(p,nova(1.05));
      const x=(p.x+Math.sin(p.o)*0.012)*W,y=p.y*H,rr=p.r*dpr;
      const brilho=p.a*(0.6+0.4*Math.sin(p.o*3));
      const g=cx.createRadialGradient(x,y,0,x,y,rr*5);
      g.addColorStop(0,`rgba(${p.c},${brilho})`);g.addColorStop(1,`rgba(${p.c},0)`);
      cx.fillStyle=g;cx.beginPath();cx.arc(x,y,rr*5,0,Math.PI*2);cx.fill();
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}
/* ↑ ↓ andam pelo menu, Enter abre (o foco nativo cuida do resto) */
let _tecladoMenu=false;
function ligarTecladoMenu(){
  if(_tecladoMenu)return;_tecladoMenu=true;
  document.addEventListener('keydown',e=>{
    if(!menuVisivel()||$('#modal').firstChild)return;
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
    const itens=[...document.querySelectorAll('.mn-lista button,.mn-pe button')];
    if(!itens.length)return;
    const i=itens.indexOf(document.activeElement);
    const j=e.key==='ArrowDown'?(i+1)%itens.length:(i<=0?itens.length-1:i-1);
    itens[j].focus();e.preventDefault();
  });
}
