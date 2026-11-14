/* ============================================================
   VALORANT WORLD CUP — OS MOMENTOS (C4)
   ------------------------------------------------------------
   As telas que param o jogo, na fila que o núcleo enche
   (G.copaMomentos, core/copa-ciclo.js):

     sede          o logo padrão da Copa gira e vira o logo da sede
     convidadas    as 16 que vão direto, uma a uma
     classificados as 16 que vieram das eliminatórias, e quem ficou fora
     sorteio       os grupos da Copa, pote a pote
     campea        a taça, a campeã, a final, o MVP e o pódio

   Cada momento pode ser revisto pela tela da Copa (data-cpmomento).
   ============================================================ */
let CPM=null;   /* {fila:[...], i, pote, fim} */

function abrirMomentosCopa(fim){
  const fila=(G.copaMomentos||[]).slice();
  G.copaMomentos=[];
  if(!fila.length){if(fim)fim();return;}
  CPM={fila,i:0,pote:0,fim:fim||null};
  pintarMomentoCopa();
}
function reverMomentoCopa(tipo,ano){
  CPM={fila:[{tipo,ano}],i:0,pote:0,fim:null,revendo:true};
  pintarMomentoCopa();
}
function fimMomentosCopa(){
  const f=CPM&&CPM.fim;CPM=null;
  $('#modal').innerHTML='';
  render();
  if(f)f();
}

/* ---------- peças ---------- */
function _cicloDoMomento(m){return cicloDaCopa(m.ano,false);}
function escudoSelecao(pais,px,cls){
  const src=ASSETS.logoSelecao(pais);
  if(src)return `<img class="cpx-escudo ${cls||''}" src="${src}" alt="" style="width:${px}px;height:${px}px">`;
  const b=ASSETS.bandeira(pais);
  if(b)return `<span class="cpx-escudo cpx-escudo-b ${cls||''}" style="width:${px}px;height:${px}px"><img src="${b}" alt=""></span>`;
  return `<span class="cpx-escudo cpx-escudo-e ${cls||''}" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.6)}px">${emojiBandeira(pais)}</span>`;
}
function logoDaEdicao(cic){return ASSETS.copa('sede-'+ASSETS.slug(cic.nomeSede))||ASSETS.copa('logo');}
function fundoDaSede(cic,forca){
  const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(cic.sede):null;
  const f=forca==null?.82:forca;
  const img=cid?`,${urlCSS(ASSETS.cidade(cid.slug))}`:'';
  return `background-image:radial-gradient(70% 60% at 50% 35%,rgba(226,180,90,.20),transparent 70%),linear-gradient(180deg,rgba(8,12,17,${f-.1}),rgba(8,12,17,${f+.1}))${img};background-size:cover;background-position:center`;
}
/* confete: posições fixas por índice (sem sorteio) */
function confeteCopa(n){
  let h='';
  for(let i=0;i<n;i++){
    const x=(i*37)%100, d=((i*53)%40)/10, dur=4+((i*29)%30)/10, cor=['#E2B45A','#ECE8E1','#FF4655','#18E5B4'][i%4];
    h+=`<i style="left:${x}%;animation-delay:${d}s;animation-duration:${dur}s;background:${cor};transform:rotate(${i*41}deg)"></i>`;
  }
  return `<div class="cpm-confete" aria-hidden="true">${h}</div>`;
}

/* ---------- as telas ---------- */
function _telaSede(cic){
  const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(cic.sede):null;
  const pad=ASSETS.copa('logo'), sede=ASSETS.copa('sede-'+ASSETS.slug(cic.nomeSede));
  return `<div class="cpm-corpo cpm-sede">
    <div class="cpm-eyebrow">Valorant World Cup · ${cic.edicao}ª edição</div>
    <div class="cpm-logos">
      ${pad?`<img class="cpm-logo-padrao" src="${pad}" alt="">`:''}
      ${sede?`<img class="cpm-logo-sede" src="${sede}" alt="">`:`<div class="cpm-logo-sede cpm-sem-logo">${bandeira(cic.sede)}</div>`}
      <div class="cpm-brilho"></div>
    </div>
    <h1 class="cpm-tit cpm-depois">${bandeira(cic.sede)} ${esc(cic.nomeSede)} ${cic.ano}</h1>
    <p class="cpm-sub cpm-depois">${cid?`A final é em <b>${esc(cid.nome)}</b>. `:''}Eliminatórias no fim de ${cic.ano-1}; a Copa, com 32 seleções, no fim de ${cic.ano}.</p>
  </div>`;
}
function _ladrilho(pais,i,extra){
  const inf=infoSelecao(pais)||{nome:pais,sigla:pais};
  return `<div class="cpm-lad" style="animation-delay:${(i*0.09).toFixed(2)}s">${escudoSelecao(pais,72)}
    <b>${esc(inf.nome)}</b><span>${bandeira(pais)} ${esc(inf.sigla)}${extra||''}</span></div>`;
}
function _telaConvidadas(cic){
  return `<div class="cpm-corpo">
    <div class="cpm-eyebrow">World Cup ${cic.ano} · ${esc(cic.nomeSede)}</div>
    <h1 class="cpm-tit">As convidadas</h1>
    <p class="cpm-sub">A sede e as 15 melhores do ranking vão direto para a Copa.</p>
    <div class="cpm-grade">${cic.convidadas.map((p,i)=>_ladrilho(p,i,p===cic.sede?' · <em>sede</em>':'')).join('')}</div>
    <p class="cpm-sub cpm-nota">As outras ${cic.grupos?cic.grupos.reduce((s,g)=>s+g.paises.length,0):24} disputam 16 vagas nas eliminatórias, nas semanas ${ELIM_SEM_RODADA1} e ${ELIM_SEM_RODADA2}.</p>
  </div>`;
}
function _telaClassificados(cic){
  const fora=(cic.grupos||[]).flatMap(g=>g.paises.filter(p=>!(g.classificados||[]).includes(p)));
  return `<div class="cpm-corpo">
    <div class="cpm-eyebrow">World Cup ${cic.ano} · ${esc(cic.nomeSede)}</div>
    <h1 class="cpm-tit">Os 32 estão definidos</h1>
    <p class="cpm-sub">Das eliminatórias:</p>
    <div class="cpm-grade">${(cic.dasEliminatorias||[]).map((p,i)=>_ladrilho(p,i)).join('')}</div>
    <div class="cpm-linha"><span class="cpm-rot">Convidadas</span>${cic.convidadas.map(p=>`<span class="cpm-mini" title="${esc(_nomeSel(p))}">${escudoSelecao(p,30)}</span>`).join('')}</div>
    ${fora.length?`<div class="cpm-linha cpm-fora"><span class="cpm-rot">Ficaram fora</span>${fora.map(p=>`<span>${bandeira(p)} ${esc(_nomeSel(p))}</span>`).join('')}</div>`:''}
  </div>`;
}
function _telaSorteio(cic){
  const C=cic.copa, pote=CPM.pote;
  const potes=[0,1,2,3].map(k=>C.grupos.map(g=>g.paises[k]).filter(Boolean));
  return `<div class="cpm-corpo cpm-sorteio">
    <div class="cpm-eyebrow">World Cup ${cic.ano} · ${esc(cic.nomeSede)} · sorteio dos grupos</div>
    <h1 class="cpm-tit">${pote>=4?'Os grupos da Copa':pote===0?'Quatro potes, oito grupos':'Pote '+pote+' sorteado'}</h1>
    <div class="cpm-potes">${potes.map((l,k)=>`<div class="cpm-pote ${k<pote?'feito':k===pote?'agora':''}"><b>Pote ${k+1}</b>
      ${l.map(p=>`<span>${bandeira(p)} ${esc((infoSelecao(p)||{}).sigla||p)}</span>`).join('')}</div>`).join('')}</div>
    <div class="cpm-grupos">${C.grupos.map((g,gi)=>`<div class="cpm-grupo"><div class="cpm-g-letra">${g.letra}</div>
      ${g.paises.map((p,k)=>k<pote?`<div class="cpm-g-sel ${k===pote-1?'novo':''}" style="animation-delay:${(gi*0.12).toFixed(2)}s">${escudoSelecao(p,34)}<span>${esc(_nomeSel(p))}</span></div>`
        :`<div class="cpm-g-sel vazio"><i></i><span>pote ${k+1}</span></div>`).join('')}</div>`).join('')}</div>
    <p class="cpm-sub cpm-nota">${pote===0?`A sede, ${esc(cic.nomeSede)}, é a cabeça do grupo A. O sorteio evita juntar seleções do mesmo continente.`
      :pote>=4?`Grupos de 4 em MD3 nas semanas ${COPA_SEM_R12} e ${COPA_SEM_R3}; os dois primeiros vão às oitavas.`:''}</p>
  </div>`;
}
function _telaCampea(cic){
  const ed=edicoesDaCopa().find(e=>e.ano===cic.ano);if(!ed)return '<div class="cpm-corpo"></div>';
  const nome=id=>ed.nomes[id]||(G.jogadores[id]||{}).nome||'—';
  const f=ed.final, pro=f.v===f.a?f.wa:f.wb, contra=f.v===f.a?f.wb:f.wa;
  const taca=ASSETS.copa('trofeu'), pm=ed.mvp&&G.jogadores[ed.mvp];
  const premio=ASSETS.copa('premio-mvp');
  return `<div class="cpm-corpo cpm-campea">
    ${confeteCopa(46)}
    <div class="cpm-eyebrow">Valorant World Cup ${cic.ano} · ${esc(cic.nomeSede)}${ed.cidade?' · '+esc(ed.cidade):''}</div>
    <div class="cpm-c-palco">
      <div class="cpm-raios"></div>
      ${taca?`<img class="cpm-taca" src="${taca}" alt="">`:''}
      <div class="cpm-c-escudo">${escudoSelecao(ed.campeao,120)}</div>
    </div>
    <h1 class="cpm-tit cpm-c-nome">${esc(_nomeSel(ed.campeao))}</h1>
    <div class="cpm-c-rot">${titulosMundiais(ed.campeao)>1?titulosMundiais(ed.campeao)+'º título mundial':'Campeã do mundo'}</div>
    <div class="cpm-c-final">${escudoSelecao(ed.campeao,40)}<b class="num">${pro}</b><i>×</i><b class="num">${contra}</b>${escudoSelecao(ed.vice,40)}
      <span>Final contra ${esc(_nomeSel(ed.vice))}</span></div>
    <div class="cpm-c-baixo">
      ${pm?`<div class="cpm-c-mvp">${cartaJogador(pm,{w:92})}<div><span class="cpm-rot">MVP da Copa</span><b>${esc(pm.nome)}</b>${premio?`<img src="${premio}" alt="" class="cpm-premio">`:''}</div></div>`
        :ed.mvp?`<div class="cpm-c-mvp"><div><span class="cpm-rot">MVP da Copa</span><b>${esc(nome(ed.mvp))}</b></div></div>`:''}
      <div class="cpm-c-podio">
        <div><span class="cpm-med prata"></span>${escudoSelecao(ed.vice,34)}<b>${esc(_nomeSel(ed.vice))}</b></div>
        <div><span class="cpm-med bronze"></span>${escudoSelecao(ed.bronze,34)}<b>${esc(_nomeSel(ed.bronze))}</b></div>
        <div class="cpm-c-ti"><span class="cpm-rot">Time ideal</span>${ed.timeIdeal.map(nome).map(esc).join(' · ')}</div>
      </div>
    </div>
  </div>`;
}

function pintarMomentoCopa(){
  if(!CPM)return;
  const m=CPM.fila[CPM.i], cic=m&&_cicloDoMomento(m);
  if(!m||!cic){return CPM.i<CPM.fila.length-1?(CPM.i++,pintarMomentoCopa()):fimMomentosCopa();}
  if(m.tipo==='sorteio'&&!cic.copa)return CPM.i<CPM.fila.length-1?(CPM.i++,pintarMomentoCopa()):fimMomentosCopa();
  const html=m.tipo==='sede'?_telaSede(cic):m.tipo==='convidadas'?_telaConvidadas(cic)
    :m.tipo==='classificados'?_telaClassificados(cic):m.tipo==='sorteio'?_telaSorteio(cic):_telaCampea(cic);
  const ult=CPM.i>=CPM.fila.length-1;
  const sorteando=m.tipo==='sorteio'&&CPM.pote<4;
  const botao=sorteando?(CPM.pote===0?'Sortear o pote 1':'Sortear o pote '+(CPM.pote+1)):ult?'Seguir':'Próximo ›';
  pintarModal(`<div class="ovl cpm-ovl"><div class="cpm cpm-t-${m.tipo}" style="${fundoDaSede(cic,m.tipo==='campea'?.86:.8)}">
    <div class="cpm-topo"><span class="cpm-marca">${ASSETS.copa('logo')?`<img src="${ASSETS.copa('logo')}" alt="">`:''}Valorant World Cup</span>
      <button class="btn ghost sm" data-cpm="pular">${CPM.revendo?'Fechar':'Pular'}</button></div>
    <div class="cpm-meio" key="${CPM.i}-${CPM.pote}">${html}</div>
    <div class="cpm-pe">${sorteando&&CPM.pote<3?'<button class="btn ghost" data-cpm="tudo">Sortear tudo</button>':'<span></span>'}
      <span class="dim">${CPM.fila.length>1?(CPM.i+1)+' de '+CPM.fila.length:''}</span>
      <button class="btn ${m.tipo==='campea'?'cpm-ouro':''}" data-cpm="seguir">${botao}</button></div>
  </div></div>`);
  $('#modal').querySelectorAll('[data-cpm]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const a=b.dataset.cpm;
    if(a==='pular')return fimMomentosCopa();
    if(a==='tudo'){CPM.pote=4;return pintarMomentoCopa();}
    if(m.tipo==='sorteio'&&CPM.pote<4){CPM.pote++;return pintarMomentoCopa();}
    if(CPM.i>=CPM.fila.length-1)return fimMomentosCopa();
    CPM.i++;CPM.pote=0;pintarMomentoCopa();
  });
}
