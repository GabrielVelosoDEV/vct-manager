/* ============================================================
   PÁGINA DA SELEÇÃO — as 40 seleções da World Cup, a um clique
   ------------------------------------------------------------
   Irmã da página de clube (ui/clube.js): endereço "selecao:<país>",
   então Voltar e Avançar do topo funcionam. Todo escudo de seleção
   (escudoSelecao, data-sel) abre esta página.

   O que tem:
     capa        cores da bandeira, cidade do país ao fundo, escudo
                 com as estrelas dos títulos, ranking, força e situação
     convocação  as cartas da seleção (ui/cartas.js, opt.selecao):
                 cinco titulares no palco e os reservas no banco, com o
                 clube de cada um, e a comissão
     na Copa     a linha do tempo de cada edição e das eliminatórias,
                 a sala de troféus e as medalhas
     jogos       todos os jogos guardados (Copa, eliminatórias e
                 amistosos), o retrospecto contra cada adversário
     ídolos      os maiores da seleção na história da Copa
     cena        de onde vêm os convocáveis (clubes) e quem está na fila
   ============================================================ */
let selecaoVer=null;
let _slJogos=[];          /* os jogos que a tela mostra, para a ficha abrir pelo índice */

function irSelecao(pais){
  if(!G||typeof infoSelecao!=='function'||!infoSelecao(pais))return;
  if($('#modal').innerHTML)$('#modal').innerHTML='';
  irPara('selecao:'+pais);
}

/* todos os jogos da seleção que o save ainda guarda, do mais novo ao mais velho */
function jogosDaSelecao(pais){
  const c=garantirCopa();if(!c)return[];
  const out=[], tem=f=>f&&(f.a===pais||f.b===pais);
  for(const cic of Object.values(c.ciclos||{})){
    for(const g of cic.grupos||[])for(const f of g.jogos||[])if(tem(f))out.push({f,ano:cic.ano-1,onde:'Eliminatórias',fase:'Grupo '+g.letra,cic});
    if(cic.copa){
      for(const g of cic.copa.grupos||[])for(const f of g.jogos||[])if(tem(f))out.push({f,ano:cic.ano,onde:'World Cup',fase:'Grupo '+g.letra,cic});
      for(const [k,nome] of COPA_FASES)for(const j of cic.copa.mata[k]||[])
        if(j.f&&(j.a===pais||j.b===pais))out.push({f:Object.assign({a:j.a,b:j.b},j.f),ano:cic.ano,onde:'World Cup',fase:nome,cic,final:k==='final'});
    }
  }
  for(const f of c.amistosos||[])if(tem(f))out.push({f,ano:f.ano||G.ano,onde:'Amistoso',fase:'MD'+f.bo});
  /* a final da edição tem a ficha inteira guardada */
  for(const e of edicoesDaCopa())if(e.final&&tem(e.final)){
    const x=out.find(o=>o.final&&o.ano===e.ano);if(x)x.f=e.final;
  }
  const ordem=o=>o.ano*1000+(o.onde==='Eliminatórias'?0:o.onde==='Amistoso'?900:100)+(o.f.sem||0)*7+(o.f.dia||0);
  return out.sort((a,b)=>ordem(b)-ordem(a));
}
/* retrospecto contra cada adversário */
function confrontosDaSelecao(pais,jogos){
  const m={};
  for(const {f} of jogos){
    const adv=f.a===pais?f.b:f.a, x=m[adv]=m[adv]||{pais:adv,j:0,v:0,d:0,mp:0,mc:0};
    x.j++;if(f.v===pais)x.v++;else x.d++;
    x.mp+=f.a===pais?f.wa:f.wb;x.mc+=f.a===pais?f.wb:f.wa;
  }
  return Object.values(m).sort((a,b)=>b.j-a.j||b.v-a.v);
}
/* a campanha em cada ciclo: eliminatórias e Copa */
function campanhasDaSelecao(pais){
  const c=garantirCopa();if(!c)return[];
  const eds=edicoesDaCopa(), out=[];
  for(const cic of Object.values(c.ciclos||{}).sort((a,b)=>b.ano-a.ano)){
    const ed=eds.find(e=>e.ano===cic.ano);
    const conv=(cic.convidadas||[]).includes(pais);
    const clas=(cic.classificados||[]).includes(pais);
    let alc=ed&&ed.alcance?ed.alcance[pais]:null;
    if(!alc&&ed&&ed.participantes&&ed.participantes.includes(pais))alc='grupos';
    let txt,cls;
    if(alc){txt=ALCANCE_NOME[alc];cls=alc==='campeao'?'ouro':alc==='vice'?'prata':alc==='bronze'?'bronze':'';}
    else if(cic.copa&&clas){txt=cic.copa.fim?'Jogou a Copa':'Na Copa';cls='vivo';}
    else if(cic.classificados&&!clas&&cic.grupos){txt='Caiu nas eliminatórias';cls='fora';}
    else if(conv){txt='Convidada';cls='vivo';}
    else if(cic.grupos){txt='Nas eliminatórias';cls='';}
    else continue;
    out.push({ano:cic.ano,ed,cic,txt,cls,alc,conv,sede:cic.sede===pais,nomeSede:cic.nomeSede});
  }
  return out;
}

function vSelecao(){
  const pais=selecaoVer, info=infoSelecao(pais);
  if(!info)return `<div class="card flat"><div class="empty">Seleção não encontrada.</div></div>`;
  const x=_ctxCopa();
  const [s1,s2,s3]=coresSelecao(pais);
  const rk=x.rk.find(r=>r.pais===pais), rkCont=x.rk.filter(r=>r.cont===info.cont), posCont=rkCont.findIndex(r=>r.pais===pais)+1;
  const antes=(garantirCopa().rankingUltimaEdicao||{})[pais], dv=rk&&antes!=null?rk.pts-antes:0;
  const [clsSit,sit]=_situacao(x,pais);
  const C=x.cic&&x.cic.copa, cvCopa=C&&C.convocados&&C.convocados[pais];
  const conv=cvCopa||convocacao(pais);
  const tit=titulosMundiais(pais);
  const hist=paisesNaHistoria().find(h=>h.pais===pais)||{titulos:0,vices:0,bronzes:0,copas:0,melhor:null,podios:0,anosTitulo:[]};
  const com=comissaoDaSelecao(pais), tec=com.tecnico&&G.staff[com.tecnico], ana=com.analista&&G.staff[com.analista];
  const souTec=typeof selecaoDoTecnico==='function'&&selecaoDoTecnico()===pais;
  const eu=typeof meuJogador==='function'?meuJogador():null;
  const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(pais):null;
  const foto=cid&&ASSETS.tem('cidades',cid.slug)?ASSETS.cidade(cid.slug):'';
  const band=ASSETS.bandeira(pais);
  const forca=forcaSelecao(pais,conv);
  const tits=conv?conv.titulares.map(i=>G.jogadores[i]).filter(Boolean):[];
  const ress=conv?conv.reservas.map(i=>G.jogadores[i]).filter(Boolean):[];
  const todos=tits.concat(ress);
  const idadeM=todos.length?todos.reduce((s,p)=>s+(p.idade||0),0)/todos.length:0;
  const ovM=tits.length?Math.round(tits.reduce((s,p)=>s+over(p),0)/tits.length):0;
  const proxSede=COPA_SEDES.findIndex(sd=>sd[0]===pais);
  let anoSede=null;
  if(proxSede>=0){for(let a=proximaCopa(G.ano),n=0;n<COPA_SEDES.length;a+=COPA_INTERVALO,n++)if(sedeDoAno(a).pais===pais){anoSede=a;break;}}
  const logoSede=anoSede?ASSETS.copa('sede-'+ASSETS.slug(sedeDoAno(anoSede).nome)):'';

  /* ---- capa ---- */
  const estrelas=tit?`<div class="sl-estrelas">${'<i></i>'.repeat(Math.min(tit,6))}</div>`:'';
  const capa=`<section class="sl-capa" style="--s1:${s1};--s2:${s2};--s3:${s3}">
    ${foto?`<div class="sl-foto" style="background-image:${urlCSS(foto)}"></div>`:''}
    ${band?`<img class="sl-band-fundo" src="${band}" alt="">`:''}
    <div class="sl-marca" aria-hidden="true">${escudoSelecao(pais,380)}</div>
    <div class="sl-capa-in">
      <div class="sl-escudo">${estrelas}${escudoSelecao(pais,150)}</div>
      <div class="sl-id">
        <div class="sl-eyebrow">${bandeira(pais)} Seleção · ${esc(COPA_CONTINENTES[info.cont])}${cid?' · '+esc(cid.nome):''}</div>
        <h1 class="sl-nome">${esc(info.nome)} <span>${esc(info.sigla)}</span></h1>
        <div class="sl-chips">${clsSit==='ouro'&&tit?'':`<span class="cpx-sit ${clsSit}">${esc(sit)}</span>`}
          ${tit?`<span class="sl-chip-ouro">${tit}× campeã do mundo · ${hist.anosTitulo.join(', ')}</span>`:''}
          ${souTec?'<span class="chip up">você é o técnico</span>':''}
          ${eu&&eu.pais===pais?`<span class="chip up">${conv&&todos.includes(eu)?'você está convocado':'a sua seleção'}</span>`:''}</div>
        <div class="sl-kpis">
          <div><span>Ranking mundial</span><b class="num">${rk?rk.pos+'º':'—'}</b><em class="${dv>0?'up':dv<0?'dn':''}">${rk?rk.pts+' pts':''}${dv?` · ${dv>0?'▲':'▼'} ${Math.abs(dv)}`:''}</em></div>
          <div><span>No continente</span><b class="num">${posCont?posCont+'º':'—'}</b><em>de ${rkCont.length}</em></div>
          <div><span>Força</span><b class="num">${forca||'—'}</b><em>melhor cinco</em></div>
          <div><span>Copas</span><b class="num">${hist.copas}</b><em>${hist.melhor?'melhor: '+esc(ALCANCE_NOME[hist.melhor]):'nenhuma ainda'}</em></div>
          <div><span>Técnico</span><b class="sl-kp-nome">${tec?esc(tec.nome):'—'}</b><em>${tec?bandeira(tec.pais)+' '+(tec.pais===pais?'do país':'estrangeiro'):''}</em></div>
        </div>
      </div>
      ${logoSede?`<div class="sl-sede"><img src="${logoSede}" alt=""><span>sede da Copa ${anoSede}</span></div>`:''}
    </div>
    <div class="sl-faixa"><i></i><i></i><i></i></div>
  </section>`;

  /* ---- convocação: as cartas da seleção ---- */
  const clubeDe=p=>{const t=p.timeId&&G.times[p.timeId];
    return t?`<span class="sl-clube" data-clube="${t.id}">${escudo(t,18)} ${esc(t.tag||t.nome)}</span>`:`<span class="sl-clube dim">${p.base?'base':'sem clube'}</span>`;};
  const colTit=p=>`<div class="sl-col">${cartaJogador(p,{w:172,clique:true,selecao:pais})}
      <div class="sl-col-info"><b>${esc(p.role)}</b>${clubeDe(p)}<span class="dim">${p.idade} anos${p.voce?' · <em class="up">você</em>':''}</span></div></div>`;
  const colRes=p=>`<div class="sl-col b">${cartaJogador(p,{w:118,clique:true,selecao:pais})}
      <div class="sl-col-info">${clubeDe(p)}</div></div>`;
  const pessoa=(m,rot)=>m?`<div class="sl-staff">${retratoStaff(m,58)}<div><span>${rot}</span><b>${esc(m.nome)}</b><em>${bandeira(m.pais)} ${esc(nomePais(m.pais))}</em></div></div>`
    :`<div class="sl-staff vazio"><div><span>${rot}</span><b>vago</b></div></div>`;
  const elenco=conv?`<div class="sl-palco" style="--s1:${s1};--s2:${s2};--s3:${s3}">
      <div class="sl-palco-marca" aria-hidden="true">${escudoSelecao(pais,300)}</div>
      <div class="sl-palco-cab"><div><div class="cpx-eyebrow">${cvCopa?'Convocação da World Cup '+x.cic.ano:'Convocação de hoje'}</div>
        <span class="dim">${cvCopa?'A lista ficou fixa no início da Copa.':'Muda toda semana: o melhor cinco do país pela conta da escalação dos clubes, e os melhores reservas.'}</span></div>
        <div class="sl-resumo"><span>over médio <b class="num">${ovM}</b></span><span>idade média <b class="num">${idadeM.toFixed(1)}</b></span>
          <span>convocáveis <b class="num">${convocaveis(pais).length}</b></span></div></div>
      <div class="sl-tits">${tits.map(colTit).join('')}</div>
    </div>
    <div class="sl-banco"><div class="cpx-eyebrow">Reservas · ${ress.length}</div><div class="sl-banco-l">${ress.map(colRes).join('')||'<span class="dim">Sem reservas.</span>'}</div>
      <div class="sl-staffs">${pessoa(tec,'Técnico')}${pessoa(ana,'Analista')}</div></div>`
    :`<div class="card">${vazio(`<b>${esc(info.nome)} não tem ${SELECAO_MINIMO} jogadores agora.</b> Abaixo disso o país fica sem seleção.`,'elenco')}</div>`;

  /* ---- na Copa: campanhas, troféus, medalhas ---- */
  const camps=campanhasDaSelecao(pais);
  const linhaCamp=k=>`<div class="sl-camp ${k.cls}">
      <div class="sl-camp-ano num">${k.ano}</div>
      <div class="sl-camp-no">${k.alc==='campeao'&&ASSETS.copa('trofeu')?`<img src="${ASSETS.copa('trofeu')}" alt="">`:`<i class="sl-med ${k.cls}"></i>`}</div>
      <div><b>${esc(k.txt)}</b><span class="dim">World Cup ${esc(k.nomeSede||'')}${k.sede?' · em casa':''}${k.conv&&!k.sede?' · convidada':''}</span></div>
      ${k.ed&&k.alc==='campeao'?`<button class="btn ghost sm" data-cpfinal="${k.ano}">A final</button>`:''}</div>`;
  const naCopa=`<div class="card sl-card"><div class="cpx-eyebrow">Na World Cup</div>
    ${camps.length?camps.map(linhaCamp).join(''):`<div class="cpx-vazio">${ico('trofeu')}<b>Nenhuma Copa ainda.</b><span>A primeira World Cup é em ${COPA_PRIMEIRA}, com as eliminatórias em novembro de ${COPA_PRIMEIRA-1}.</span></div>`}</div>`;
  const taca=ASSETS.copa('trofeu');
  const sala=`<div class="card sl-card sl-sala-card"><div class="cpx-eyebrow">Sala de troféus</div>
    <div class="sl-sala">${tit?hist.anosTitulo.map(a=>`<div class="sl-taca">${taca?`<img src="${taca}" alt="">`:ico('trofeu')}<span class="num">${a}</span></div>`).join('')
      :`<div class="sl-taca vazia">${taca?`<img src="${taca}" alt="">`:ico('trofeu')}<span>a primeira estrela ainda não veio</span></div>`}</div>
    <div class="sl-medalhas">
      <div><i class="sl-med ouro"></i><b class="num">${hist.titulos}</b><span>títulos</span></div>
      <div><i class="sl-med prata"></i><b class="num">${hist.vices}</b><span>vices</span></div>
      <div><i class="sl-med bronze"></i><b class="num">${hist.bronzes}</b><span>bronzes</span></div>
      <div><i class="sl-med"></i><b class="num">${hist.copas}</b><span>Copas</span></div></div></div>`;

  /* ---- ídolos: o hall da Copa; sem história, os destaques de hoje ---- */
  const hall=jogadoresNaHistoria().filter(h=>h.p===pais).slice(0,6);
  const idolos=hall.length?`<div class="card sl-card"><div class="cpx-eyebrow">Ídolos da seleção</div>
      ${hall.map((h,i)=>{const p=G.jogadores[h.id];
        return `<div class="sl-idolo ${p?'jrow':''} ${i===0?'top':''}" ${p?`data-p="${h.id}"`:''}>${p?retrato(p,i?40:54):`<span class="sl-idolo-x">${esc(String(h.n||'?').slice(0,1))}</span>`}
          <div><b>${esc(h.n)}${p?'':' <span class="dim">· aposentado</span>'}</b>
          <span>${h.ed.length} Copa${h.ed.length>1?'s':''} · ${h.k} kills${h.mvp.length?' · MVP '+h.mvp.join(', '):''}</span></div>
          <em>${h.ouro.length?`<i class="sl-med ouro"></i>${h.ouro.length}`:''}${h.prata.length?`<i class="sl-med prata"></i>${h.prata.length}`:''}${h.bronze.length?`<i class="sl-med bronze"></i>${h.bronze.length}`:''}</em></div>`;}).join('')}</div>`
    :(()=>{const l=convocaveis(pais).slice().sort((a,b)=>over(b)-over(a)).slice(0,5);
      return `<div class="card sl-card"><div class="cpx-eyebrow">Os craques de hoje</div>
        ${l.map((p,i)=>`<div class="sl-idolo jrow ${i===0?'top':''}" data-p="${p.id}">${retrato(p,i?40:54)}<div><b>${esc(p.nome)}</b>
          <span>${esc(p.role)} · ${p.timeId&&G.times[p.timeId]?esc(G.times[p.timeId].nome):'sem clube'}</span></div><em class="num sl-ov">${over(p)}</em></div>`).join('')}
        <p class="dim cpx-nota">Os ídolos aparecem aqui depois da primeira Copa: medalhas, MVPs e números de cada um.</p></div>`;})();

  /* ---- jogos e confrontos ---- */
  _slJogos=jogosDaSelecao(pais);
  const linhaJogo=(o,i)=>{const f=o.f, ganhou=f.v===pais, adv=f.a===pais?f.b:f.a, pro=f.a===pais?f.wa:f.wb, con=f.a===pais?f.wb:f.wa;
    return `<div class="sl-jogo ${ganhou?'w':'l'} ${f.det?'':'sem'}" ${f.det?`data-sljogo="${i}"`:''}>
      <i class="sl-jogo-r">${ganhou?'V':'D'}</i>
      <span class="sl-jogo-q"><b>${esc(o.onde)}</b><em>${esc(o.fase)} · ${o.ano}</em></span>
      <span class="sl-jogo-adv">${escudoSelecao(adv,26)}<b>${esc(_nomeSel(adv))}</b></span>
      <b class="num sl-jogo-p">${pro}–${con}</b></div>`;};
  const jogos=`<div class="card sl-card"><div class="split"><div class="cpx-eyebrow">Jogos · ${_slJogos.length}</div>
      <button class="btn ghost sm" data-slamistoso="${pais}">Jogar um amistoso</button></div>
    ${_slJogos.length?_slJogos.slice(0,10).map(linhaJogo).join(''):`<div class="cpx-vazio">${ico('jogar')}<b>Nenhum jogo guardado.</b><span>Eliminatórias, Copa e amistosos aparecem aqui.</span></div>`}</div>`;
  const conf=confrontosDaSelecao(pais,_slJogos).slice(0,6);
  const confrontos=conf.length?`<div class="card sl-card"><div class="cpx-eyebrow">Retrospecto</div>
    ${conf.map(c=>{const pct=Math.round(c.v/c.j*100);return `<div class="sl-h2h" data-sel="${c.pais}">${escudoSelecao(c.pais,30)}
      <div><b>${esc(_nomeSel(c.pais))}</b><span class="dim">${c.j} jogo${c.j>1?'s':''} · mapas ${c.mp}:${c.mc}</span></div>
      <div class="sl-h2h-barra"><i style="width:${pct}%"></i></div><b class="num ${c.v>c.d?'up':c.v<c.d?'dn':''}">${c.v}–${c.d}</b></div>`;}).join('')}</div>`:'';

  /* ---- a cena: de onde vêm e quem está na fila ---- */
  const cv=convocaveis(pais).slice().sort((a,b)=>over(b)-over(a));
  const porClube={};
  for(const p of cv.slice(0,20)){const t=p.timeId&&G.times[p.timeId];const k=t?t.id:'_livre';(porClube[k]=porClube[k]||{t,n:0,top:0}).n++;}
  const clubes=Object.values(porClube).sort((a,b)=>b.n-a.n).slice(0,10);
  const cena=`<div class="card sl-card"><div class="cpx-eyebrow">De onde vêm · os 20 melhores do país</div>
    <div class="sl-clubes">${clubes.map(c=>c.t?`<div class="sl-cl" data-clube="${c.t.id}">${escudo(c.t,40)}<b>${esc(c.t.tag||c.t.nome)}</b><span class="num">${c.n}</span></div>`
      :`<div class="sl-cl livre"><span class="sl-cl-x">${ico('aperto')}</span><b>sem clube</b><span class="num">${c.n}</span></div>`).join('')}</div></div>`;
  const ids=new Set(todos.map(p=>p.id));
  const fila=cv.filter(p=>!ids.has(p.id)).slice(0,6);
  const filaH=fila.length?`<div class="card sl-card"><div class="cpx-eyebrow">Na fila da convocação</div>
    ${fila.map(p=>`<div class="sl-fila jrow" data-p="${p.id}">${retrato(p,36)}<div><b>${esc(p.nome)}</b><span>${esc(p.role)} · ${p.idade} anos · ${p.timeId&&G.times[p.timeId]?esc(G.times[p.timeId].tag||G.times[p.timeId].nome):p.base?'base':'sem clube'}</span></div>
      <em class="num sl-ov">${over(p)}</em></div>`).join('')}</div>`:'';

  return capa+elenco+`<div class="grid g2 sl-grade">
    <div>${naCopa}${sala}${idolos}</div>
    <div>${jogos}${confrontos}${cena}${filaH}</div>
  </div>
  <div class="sl-rodape"><button class="btn ghost" data-slcopa="${pais}">Ver na World Cup ›</button></div>`;
}

function ligarSelecao(v,on){
  on('[data-irsel]',el=>irSelecao(el.dataset.irsel));
  if(!String(tela).startsWith('selecao:'))return;
  on('[data-sljogo]',el=>{const o=_slJogos[+el.dataset.sljogo];if(o&&o.f&&o.f.det)modalSerieSelecao(o.f);});
  on('[data-slcopa]',el=>{copaVer=el.dataset.slcopa;copaAba='geral';irPara('copa');});
  on('[data-slamistoso]',el=>{copaVer=el.dataset.slamistoso;copaAba='amistoso';irPara('copa');});
  on('.sl-h2h[data-sel]',el=>irSelecao(el.dataset.sel));
}
/* escudo de seleção em qualquer tela abre a página dela (menos dentro de
   botão ou de cartão que já abre outra coisa) */
function ligarSelecoes(raiz){
  if(!raiz||typeof G==='undefined'||!G||typeof infoSelecao!=='function')return;
  raiz.querySelectorAll('.cpx-escudo[data-sel]').forEach(el=>{
    if(el.closest('button,a,select,[data-cpjogo],[data-cpficha],[data-sljogo],[data-copapais],[data-irsel],.sl-h2h,.sl-marca,.sl-palco-marca,.sl-escudo,.cpx-capa,.cpx-faixa,.mm-palco,.sr-ficha'))return;
    if(String(tela)==='selecao:'+el.dataset.sel)return;
    el.classList.add('esc-click');
    el.onclick=e=>{e.stopPropagation();irSelecao(el.dataset.sel);};
  });
}
