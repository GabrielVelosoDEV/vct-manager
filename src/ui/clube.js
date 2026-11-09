/* ============================================================
   PÁGINA DE CLUBE — qualquer clube do mundo, a um clique
   ------------------------------------------------------------
   Todo escudo do jogo abre esta página (o <img> de escudo() carrega
   data-tid) e os nomes de clube marcados com data-clube também.
   O endereço é "clube:<id>", então Voltar e Avançar do topo funcionam
   como em qualquer outra tela.

   O que o seu clube não sabe do outro fica borrado: o preparo por
   mapa usa o mesmo nível de leitura do relatório de scouting
   (analista e olheiro, core/scout.js).
   ============================================================ */
let clubeVer=null;

function irClube(id){
  if(!G||!G.times[id])return;
  if($('#modal').innerHTML)$('#modal').innerHTML='';
  irPara('clube:'+id);
}
function linkClube(t,txt){
  if(!t)return esc(txt||'—');
  return `<span class="clube-link" data-clube="${t.id}">${esc(txt!=null?txt:t.nome)}</span>`;
}
/* Liga escudos e nomes dentro de `raiz`. Escudo dentro de um botão ou de um
   cartão que já abre outra coisa (série, evento) fica com o clique do cartão. */
function ligarClubes(raiz){
  if(!raiz||typeof G==='undefined'||!G||!G.times)return;
  raiz.querySelectorAll('[data-clube]').forEach(el=>{
    el.onclick=e=>{e.stopPropagation();e.preventDefault();irClube(el.dataset.clube);};
  });
  raiz.querySelectorAll('img.logo-t[data-tid]').forEach(el=>{
    if(el.closest('button,a,[data-serie],[data-evento],[data-clube],[data-assumir],.side-org'))return;
    if(!G.times[el.dataset.tid])return;
    el.classList.add('esc-click');
    el.onclick=e=>{e.stopPropagation();irClube(el.dataset.tid);};
  });
}

/* Uma linha da linha do tempo do clube (t.temporadas). Usada aqui e na
   História do seu clube. */
function linhaTemporadaClube(x){
  const tits=x.t&&x.t.length;
  return `<div class="hc-temp ${tits?'campeao':''} ${x.mov==='caiu'?'caiu':''}">
      <div class="hc-ano">${x.a}</div>
      <div class="hc-no">${tits?imgTrofeu(trofeuDoTitulo(x.a,x.t[0]),22,x.t[0]):`<b class="num">${x.p?x.p+'º':'—'}</b>`}</div>
      <div class="hc-corpo">
        <div><b>${x.p?x.p+'º':'—'}</b> <span class="dim">de ${x.de||'—'} na ${x.tier===2?'Challengers':'liga'}</span>
          <span class="num dim"> · ${x.v}–${x.d} em séries</span>${x.elo?`<span class="dim"> · rating ${x.elo}</span>`:''}
          ${x.mov==='subiu'?' <span class="chip g">subiu para o VCT</span>':x.mov==='caiu'?' <span class="chip r">rebaixado</span>':''}</div>
        ${x.i?`<div class="hc-intl">${icone('mundo','azul')} ${esc(x.i)}</div>`:''}
        ${tits?`<div class="hc-tits">${x.t.map(ev=>`<span class="hc-tit">${imgTrofeu(trofeuDoTitulo(x.a,ev),26,ev)} ${esc(ev)}</span>`).join('')}</div>`:''}
        <div class="dim hc-el">${x.e&&x.e.length?esc(x.e.join(' · ')):''}${x.c?' — técnico '+esc(x.c):''}</div>
      </div></div>`;
}

/* Leitura do preparo deles por mapa, no nível do seu scouting: 5 exato,
   4 com folga de 4 pontos, 3 de 9 e arredondado de 5 em 5, 2 só a palavra,
   1 nada. */
function palavraPreparo(n){
  return n>=68?'casa deles':n>=57?'confortável':n>=45?'neutro':n>=35?'incomodados':'fogem dele';
}
function leituraPreparo(t,nv){
  const pool=(G.mapasAtivos&&G.mapasAtivos.length?G.mapasAtivos:MAP_POOL).slice();
  const lst=pool.map(m=>{
    const real=typeof preparoDoMapa==='function'?preparoDoMapa(t,m).nota:50;
    let v=null;
    if(nv>=5)v=real;
    else if(nv>=3){const amp=nv>=4?4:9;v=clamp(real+borrar(t.id+'|prep|'+m+'|'+G.ano,amp),0,100);
      v=nv>=4?Math.round(v):Math.round(v/5)*5;}
    /* a palavra também sai do número lido, não do real: o analista fraco
       erra a palavra junto */
    return{mapa:m,v,palavra:nv>=2?palavraPreparo(v!=null?v:real+borrar(t.id+'|pw|'+m,10)):null};
  });
  return lst.sort((a,b)=>(b.v!=null&&a.v!=null)?b.v-a.v:0);
}

function vClube(){
  const t=G.times[clubeVer];
  if(!t)return `<div class="card flat"><div class="empty">Clube não encontrado.</div></div>`;
  const eu=meu(),souEu=eu&&t.id===eu.id;
  const tec=typeof membroDe==='function'?membroDe(t,'tecnico'):null;
  const tecNome=souEu&&G.manager&&G.manager.papel==='treinador'&&!G.manager.demitido?G.manager.nome+' (você)':tec?tec.nome:'vago';
  const mk=t.patrocinios&&typeof marca==='function'?marca(t.patrocinios.master):null;
  const rk=typeof rankingMundial==='function'?rankingMundial():[];
  const posMundo=rk.indexOf(t)+1;
  const pos=typeof posicaoNoAno==='function'?posicaoNoAno(t):null;
  const intl=typeof campanhaInternacional==='function'?campanhaInternacional(t):null;
  const tc=t.temporada||{v:0,d:0};

  /* elenco em escalação: os cinco no palco, o banco embaixo */
  const elenco=(t.elenco||[]).map(P).filter(Boolean);
  const infoJ=p=>`<div class="cl-j-info dim">${p.idade}a · contrato ${p.contrato}a</div>
      <div class="cl-j-info"><span class="num">${money(p.salario||0)}</span><span class="dim">/mês</span> · <span class="num">${money(p.valor||0)}</span></div>
      ${souEu?'':`<div class="cl-j-bt"><button class="btn ghost sm" data-prop="${p.id}">Negociar</button>
        <button class="btn ghost sm" data-ctroca="${p.id}">Troca</button></div>`}`;
  const cartas=elenco.length?escalacaoHTML(t,{extra:infoJ}):'';

  /* sala de troféus: tudo o que o clube já ganhou, pré-carreira junto */
  const tits=(G.historico||[]).filter(h=>h&&(h.timeId===t.id||(!h.timeId&&h.campeao===t.nome)))
    .slice().sort((a,b)=>b.ano-a.ano);
  const sala=tits.length?`<div class="cl-sala prateleira">${tits.map(h=>`<div class="cl-trof" title="${esc(h.ano+' · '+h.evento)}">
      ${imgTrofeu(h.trofeu||trofeuDoTitulo(h.ano,h.evento),30,h.evento)}<span class="num">${h.ano}</span>
      <span class="dim">${esc(h.evento.replace(/ · VCT.*$/,''))}</span></div>`).join('')}</div>`
    :'<div class="dim">Nenhum título ainda.</div>';

  /* confronto direto e rivalidade com o seu clube */
  let confronto='';
  if(!souEu&&eu&&typeof confrontosDe==='function'){
    const c=confrontosDe(eu.id).find(x=>x.time.id===t.id);
    if(c){
      const nota=notaRivalidade(eu,c);
      const nivel=nota>0.5?'clássico':nota>0.28?'rival':nota>0.15?'morna':'sem rivalidade';
      confronto=`<div class="cl-h2h">
        <div><span class="dim">Jogos</span><b class="num">${c.jogos}</b></div>
        <div><span class="dim">Você venceu</span><b class="num up">${c.vitorias}</b></div>
        <div><span class="dim">Eles venceram</span><b class="num dn">${c.derrotas}</b></div>
        <div><span class="dim">Rivalidade</span><b>${nivel}</b><span class="num dim">${Math.round(nota*100)}</span></div></div>
        <div class="serie" style="margin-top:8px">${(c.ultimos||[]).slice(0,8).map(u=>`<i class="${u.v===eu.id?'w':'l'}" title="${esc(String(u.ano)+' · '+(u.ctx||''))}"></i>`).join('')}</div>
        ${nota>0.28&&typeof motivoRivalidade==='function'?`<div class="dim" style="margin-top:6px">${esc(motivoRivalidade(eu,c))}</div>`:''}`;
    }else confronto='<div class="dim">Vocês nunca se enfrentaram.</div>';
  }

  /* preparo por mapa, borrado pelo seu scouting */
  let leitura='';
  if(!souEu&&eu){
    const nv=typeof nivelScoutContra==='function'?nivelScoutContra(eu,t):typeof nivelScout==='function'?nivelScout(eu):1;
    const lst=leituraPreparo(t,nv);
    leitura=nv<2?'<div class="dim">Seu analista ainda não tem leitura deste clube. Comissão melhor (analista e olheiro) abre o relatório.</div>'
      :`<div class="cl-mapas">${lst.map(x=>`<div class="cl-mapa">
          <span>${esc(x.mapa)}</span>
          ${x.v!=null?`<div class="vb"><i class="${x.v>=60?'g':x.v<42?'r':''}" style="width:${x.v}%"></i></div><b class="num">${x.v}</b>`
            :'<div></div><b></b>'}
          <span class="dim">${esc(x.palavra||'')}</span></div>`).join('')}</div>
        <div class="dim" style="margin-top:8px;font-size:11.5px">Leitura nível ${nv} de 5${nv<5?' — com margem de erro: analista e olheiro melhores afinam o número':''}.</div>`;
  }

  const temps=(t.temporadas||[]).slice().reverse();
  const comissao=(typeof CARGOS!=='undefined'?CARGOS:[]).map(c=>{
    const m=membroDe(t,c.id);
    return `<div class="cl-com"><span class="dim">${esc(c.curto)}</span><b>${m?esc(m.nome):'vago'}</b>${m&&m.ex?' <span class="chip" title="ex-jogador">ex-jogador</span>':''}</div>`;
  }).join('');

  const cor=corDoClube(t);
  return `<div class="cl-topo cl-faixa" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
    <div class="cl-marca" aria-hidden="true">${escudo(t,340)}</div>
    <div class="cl-escudo">${escudo(t,112)}</div>
    <div class="cl-id">
      <div class="eyebrow">${esc(nomeLiga(t))}${t.dono?` · de ${esc(t.dono.nome)}`:''}</div>
      <h1 class="cl-nome">${esc(t.nome)} <span>${esc(t.tag)}</span></h1>
      <div class="cl-kpis">
        <div><span>Prestígio</span><b class="num">${Math.round(t.prestigio)}</b></div>
        <div><span>Torcida</span><b class="num">${Math.round(t.torcida||0)}</b></div>
        <div><span>Ranking mundial</span><b class="num">${posMundo?posMundo+'º':'—'}</b></div>
        <div><span>Títulos</span><b class="num">${tits.length}</b></div>
        <div><span>Técnico</span><b>${esc(tecNome)}</b></div>
        <div><span>Patrocínio máster</span><b>${mk?esc(mk.nome):'—'}</b></div>
      </div>
      ${tits.length?`<div class="cl-mini-trof">${tits.slice(0,8).map(h=>imgTrofeu(h.trofeu||trofeuDoTitulo(h.ano,h.evento),20,h.ano+' · '+h.evento)).join('')}</div>`:''}
    </div>
    ${souEu?`<button class="btn ghost sm" data-irtela="historia">História do clube</button>`:''}
  </div>
  <div class="card cl-elenco-card"><div class="split"><div class="eyebrow">Elenco</div>
    <span class="dim">${elenco.length} jogadores${souEu?'':' · negociar abre a mesa; troca monta uma proposta'}</span></div>
    ${cartas||'<div class="empty">Sem jogadores.</div>'}
    <div class="cl-coms">${comissao}</div></div>
  <div class="grid g2">
    <div>
      <div class="card"><div class="eyebrow">Temporada ${G.ano}</div>
        <div class="cl-h2h">
          <div><span class="dim">Liga</span><b class="num">${pos&&pos.pos?pos.pos+'º':'—'}</b><span class="dim">de ${pos?pos.de:'—'}</span></div>
          <div><span class="dim">Séries</span><b class="num">${tc.v}–${tc.d}</b></div>
          <div><span class="dim">Internacional</span><b>${intl?esc(intl.lugar):'—'}</b><span class="dim">${intl?esc(intl.txt):''}</span></div>
          <div><span class="dim">Títulos no ano</span><b class="num">${tits.filter(h=>h.ano===G.ano).length}</b></div>
        </div></div>
      <div class="card"><div class="eyebrow">Sala de troféus · ${tits.length}</div>${sala}</div>
      ${temps.length?`<div class="card"><div class="eyebrow">Temporadas</div>${temps.map(linhaTemporadaClube).join('')}</div>`:''}
    </div>
    <div>
      ${souEu?'':`<div class="card"><div class="eyebrow">Contra o ${esc(eu?eu.nome:'')}</div>${confronto}</div>
      <div class="card"><div class="eyebrow">Preparo por mapa · relatório do seu analista</div>${leitura}</div>`}
    </div>
  </div>`;
}

function ligarClube(v,on){
  if(!String(tela).startsWith('clube:'))return;
  on('[data-ctroca]',el=>{if(typeof modalTroca==='function')modalTroca(clubeVer,el.dataset.ctroca);});
  on('[data-irtela]',el=>irPara(el.dataset.irtela));
}
