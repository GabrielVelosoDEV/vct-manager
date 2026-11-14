/* ============================================================
   VALORANT WORLD CUP — o modo técnico na tela (C7)
   ------------------------------------------------------------
   · aba "Minha seleção" da tela World Cup: convocação (os 10, com os
     5 titulares), tática, comissão e a opção de deixar a seleção;
   · convites das federações na Central (aceitar ou recusar);
   · o pré-jogo da sua seleção: escalação, tática e o veto na sua
     vez, depois ao vivo (com pedido de tempo) ou simulado.
   ============================================================ */
let CONV_TEC=null;   /* rascunho da convocação: {pais, tit:Set, res:Set} */

/* ---------- convites na Central ---------- */
function cardConviteSelecao(){
  if(typeof convitesSelecaoAbertos!=='function'||!G.manager)return '';
  const l=convitesSelecaoAbertos();
  if(!l.length)return '';
  return `<section class="cpx-faixa cpx-convite">
    ${ASSETS.copa('logo')?`<img class="cpx-faixa-logo" src="${ASSETS.copa('logo')}" alt="">`:''}
    <div class="cpx-faixa-txt"><div class="cpx-eyebrow">Convite de federação · World Cup ${proximaCopa(G.ano)}</div>
      <b>${l.length>1?'Seleções querem você no comando':'Uma seleção quer você no comando'}</b>
      <span>Você segue no clube. O convite vale até a semana ${l[0].ate}.</span></div>
    <div class="cpx-conv-l">${l.map(c=>`<div class="cpx-conv-c">${escudoSelecao(c.pais,44)}<b>${esc(_nomeSel(c.pais))}</b>
      <span><button class="btn sm cpx-faixa-btn" data-cpconv="${c.pais}|1">Aceitar</button><button class="btn ghost sm" data-cpconv="${c.pais}|0">Recusar</button></span></div>`).join('')}</div>
  </section>`;
}

/* ---------- aba Minha seleção ---------- */
function abaMinhaSelecao(x){
  const pais=selecaoDoTecnico();
  if(!pais)return '';
  const info=infoSelecao(pais), cong=convocacaoCongelada();
  const sug=_convocacao(pais), atual=convocacaoDoTecnico(pais);
  if(!CONV_TEC||CONV_TEC.pais!==pais){
    const base=atual||sug||{titulares:[],reservas:[]};
    CONV_TEC={pais,tit:new Set(base.titulares),res:new Set(base.reservas)};
  }
  const tat=Object.assign({agres:3,foco:'default'},G.manager.selecaoTatica||{});
  const com=comissaoDaSelecao(pais), ana=com.analista&&G.staff[com.analista], eu=membroManager();
  const lista=convocaveis(pais).sort((a,b)=>over(b)-over(a));
  const cic=x.cic, sit=_situacao(x,pais);
  const linha=p=>{const t=p.timeId&&G.times[p.timeId];const est=CONV_TEC.tit.has(p.id)?'tit':CONV_TEC.res.has(p.id)?'res':'';
    return `<div class="cpt-j ${est}">
      ${retrato(p,32)}<div class="cpt-j-n"><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b><span>${esc(p.role)} · ${t?esc(t.tag||t.nome):p.base?'base':'sem clube'} · ${p.idade} anos${p.lesao?' · <em class="dn">lesionado</em>':''}</span></div>
      <em class="num cpt-ov">${over(p)}</em>
      <span class="cpt-bts">${cong?'':`<button class="${est==='tit'?'on':''}" data-cpt="${p.id}|tit">Titular</button><button class="${est==='res'?'on':''}" data-cpt="${p.id}|res">Reserva</button><button class="${!est?'on':''}" data-cpt="${p.id}|">—</button>`}</span></div>`;};
  const nT=CONV_TEC.tit.size, nR=CONV_TEC.res.size;
  return `<section class="cpx-final cpt-cab" style="${cic?fundoDaSede(cic,.88):''}">
    <div class="cpt-cab-in">${escudoSelecao(pais,96)}
      <div><div class="cpx-eyebrow">Você comanda · desde ${G.manager.selecaoDesde||G.ano}</div><h2>${esc(info.nome)}</h2>
        <div class="cpx-sel-chips"><span class="cpx-sit ${sit[0]}">${esc(sit[1])}</span><span>${(x.rk.find(r=>r.pais===pais)||{}).pos}º no ranking</span></div></div>
      <div class="cpx-staffs">${eu?`<div class="cpx-staff">${retratoStaff(eu,34)}<div><span>Técnico</span><b>${esc(eu.nome)}</b><em>você · nível ${nivelDe(eu).toFixed(1)}</em></div></div>`:''}
        ${ana?`<div class="cpx-staff">${retratoStaff(ana,34)}<div><span>Analista</span><b>${esc(ana.nome)}</b><em>${bandeira(ana.pais)} da federação</em></div></div>`:''}</div>
    </div></section>
  <div class="cpx-g2">
    <div class="card"><div class="cpx-eyebrow">${cong?'Convocação fechada':'Convocação'} · ${cong?cong.titulares.length+cong.reservas.length:nT+nR} de ${SELECAO_TAMANHO}</div>
      ${cong?`<p class="dim">A lista fechou no sorteio e vale até o fim desta fase. Dá para trocar quem começa jogando:</p>
        <div class="cpt-troca">${cong.titulares.map(id=>`<div class="cpt-tr"><b>${esc(G.jogadores[id].nome)}</b><span>${esc(G.jogadores[id].role)} · ${over(G.jogadores[id])}</span>
          <select data-cptroca="${id}"><option value="">manter</option>${cong.reservas.map(r=>`<option value="${r}">${esc(G.jogadores[r].nome)} (${esc(G.jogadores[r].role)} ${over(G.jogadores[r])})</option>`).join('')}</select></div>`).join('')}</div>`
      :`<p class="dim">Escolha 5 titulares e até 5 reservas (mínimo ${SELECAO_MINIMO} no total). A lista fecha no sorteio das eliminatórias (semana ${ELIM_SEM_SORTEIO} do ano ímpar) e no sorteio da Copa (semana ${COPA_SEM_SORTEIO}). Sem lista válida, vale a sugestão.</p>
        <div class="cpt-cont"><span class="${nT===5?'ok':'falta'}">${nT}/5 titulares</span><span>${nR}/5 reservas</span>
          <button class="btn ghost sm" data-cptsug>Usar a sugestão</button><button class="btn sm" data-cptsalvar>Salvar convocação</button></div>
        <div class="cpt-lista">${lista.map(linha).join('')}</div>`}
    </div>
    <div>
      <div class="card"><div class="cpx-eyebrow">Tática da seleção</div>
        <div class="cpt-rot">Agressividade</div>
        <div class="cpt-seg">${[1,2,3,4,5].map(v=>`<button class="${tat.agres===v?'on':''}" data-cptag="${v}">${v}</button>`).join('')}</div>
        <div class="cpt-rot">Foco</div>
        <div class="cpt-seg">${[['execucao','Execução'],['default','Default'],['retake','Retake']].map(([k,n])=>`<button class="${tat.foco===k?'on':''}" data-cptfoco="${k}">${n}</button>`).join('')}</div>
        <p class="dim cpx-nota">As mesmas regras do clube: agressividade rende com elenco de mira; o foco é pedra-papel-tesoura com o do adversário. No pré-jogo dá para mudar de novo.</p></div>
      <div class="card cx-linha"><div class="cpx-eyebrow">O que vem</div>
        <p class="dim">${esc(_textoFase(x))}. As séries da ${esc(info.nome)} param o relógio: no pré-jogo você confere a escalação, a tática e faz o veto; depois vê ao vivo (com pedido de tempo) ou simula.</p>
        <div class="cpx-acoes"><button class="btn ghost sm" data-cptdeixar>Deixar a seleção</button></div></div>
    </div>
  </div>`;
}

/* ---------- o pré-jogo da sua seleção ---------- */
let PJS=null;
function abrirPreJogoSelecao(pend,depois){
  const pais=selecaoDoTecnico(), cv=(pend.ctx&&pend.ctx.conv)||{};
  const A=timeDaSelecao(pend.a,cv[pend.a]), B=timeDaSelecao(pend.b,cv[pend.b]);
  if(!A||!B){if(depois)depois();return;}
  const meu=pais===pend.a?A:B, adv=meu===A?B:A;
  const sair=entrarSelecoesEmCampo([A,B]);
  const V=iniciarVeto(meu.id,adv.id,pend.ctx.bo,meu===A);
  vetoAvancarAteMim(V);
  PJS={pend,depois,A,B,meu,adv,V,sair,log:[]};
  pintarPreJogoSelecao();
}
function _pjsRefazer(){
  /* escalação ou tática mudou: o time da seleção em campo acompanha */
  const {meu}=PJS, pais=meu.selecao;
  const cv=convocacaoCongelada()||convocacaoDoTecnico(pais);
  if(cv){meu.titulares=cv.titulares.slice();meu.elenco=cv.titulares.concat(cv.reservas);}
  meu.tatica=Object.assign({},meu.tatica,G.manager.selecaoTatica||{},{scrim:0});
  const rs=meu.titulares.map(i=>G.jogadores[i]).filter(Boolean);
  const dist=distribuirFuncoes(rs);rs.forEach((p,i)=>{p.roleAtual=dist.atrib[i];});
  meu.comps={};if(typeof compIA==='function')compIA(meu);
  meu.sinergia=sinergiaSelecao(meu.titulares);
}
function pintarPreJogoSelecao(){
  const {pend,meu,adv,V}=PJS, tat=Object.assign({agres:3,foco:'default'},G.manager.selecaoTatica||{});
  const ovT=t=>Math.round(t.titulares.reduce((s,i)=>s+over(G.jogadores[i]),0)/5);
  const passo=vetoPasso(V), minha=vetoMinhaVez(V), rest=vetoRestantes(V);
  const cv=convocacaoCongelada();
  const seq=V.seq.map(s=>`<span class="chip ${s.tipo==='ban'?'r':s.tipo==='dec'?'':'g'}">${s.tipo==='ban'?'✕':s.tipo==='dec'?'★':'✓'} ${esc(s.m)}${s.lado0?' · '+(s.lado0==='atk'?'ataque':'defesa'):''} <span class="dim">${s.tipo==='dec'?'decider':esc(s.t)}</span></span>`).join(' ');
  const cic=cicloAtual();
  pintarModal(`<div class="ovl"><div class="box wide dj-box dj-selecao" ${cic?`style="${fundoDaSede(cic,.9)}"`:''}>
    <div class="cpx-eyebrow">Pré-jogo da seleção · ${esc(pend.ctx.nome||'')} · ${esc(pend.ctx.fase||'')} · MD${pend.ctx.bo}</div>
    <div class="dj-vs">
      <div class="dj-t">${escudoSelecao(meu.selecao,72)}<b>${esc(meu.nome)}</b><span class="dim">over ${ovT(meu)} · você no comando</span></div>
      <div class="dj-x">×</div>
      <div class="dj-t">${escudoSelecao(adv.selecao,72)}<b>${esc(adv.nome)}</b><span class="dim">over ${ovT(adv)} · tática ${adv.tatica.agres}/${esc(adv.tatica.foco)}</span></div>
    </div>
    <div class="cpt-pj">
      <div><div class="cpt-rot">Os cinco</div>
        ${meu.titulares.map(id=>{const p=G.jogadores[id];return `<div class="cpt-pj-j">${retrato(p,28)}<b>${esc(p.nome)}</b><span>${esc(p.roleAtual||p.role)} · ${over(p)}</span>
          ${cv&&cv.reservas.length?`<select data-pjtroca="${id}"><option value="">titular</option>${cv.reservas.map(r=>`<option value="${r}">trocar por ${esc(G.jogadores[r].nome)} (${over(G.jogadores[r])})</option>`).join('')}</select>`:''}</div>`;}).join('')}
        <div class="cpt-rot">Agressividade</div>
        <div class="cpt-seg">${[1,2,3,4,5].map(v=>`<button class="${tat.agres===v?'on':''}" data-pjag="${v}">${v}</button>`).join('')}</div>
        <div class="cpt-rot">Foco</div>
        <div class="cpt-seg">${[['execucao','Execução'],['default','Default'],['retake','Retake']].map(([k,n])=>`<button class="${tat.foco===k?'on':''}" data-pjfoco="${k}">${n}</button>`).join('')}</div>
      </div>
      <div><div class="cpt-rot">Veto ${V.fim?'· fechado':minha?'· a sua vez: '+(passo.tipo==='ban'?'banir':passo.tipo==='pick'?'escolher':'lado'):''}</div>
        <div class="cpt-veto-seq">${seq||'<span class="dim">Ninguém vetou ainda.</span>'}</div>
        ${!V.fim&&minha&&passo.tipo==='lado'?`<div class="cpt-seg"><button data-pjlado="atk">Começar no ataque</button><button data-pjlado="def">Começar na defesa</button></div>`
          :!V.fim&&minha?`<div class="cpt-mapas">${rest.map(m=>`<button class="cpt-mapa" data-pjmapa="${esc(m)}" style="${fundoMapa(m,0.55)}"><b>${esc(m)}</b><span>${passo.tipo==='ban'?'banir':'escolher'}</span></button>`).join('')}</div>`:''}
        ${V.fim?'':`<button class="btn ghost sm" data-pjauto>Veto automático</button>`}
      </div>
    </div>
    <div class="dj-acoes">
      <button class="btn ghost" id="pjsSim" ${V.fim?'':'disabled'}>Simular a série</button>
      <button class="btn cpx-faixa-btn" id="pjsVivo" ${V.fim?'':'disabled'}>Ver ao vivo ›</button>
    </div>
  </div></div>`);
  const md=$('#modal');
  md.querySelectorAll('[data-pjmapa]').forEach(b=>b.onclick=()=>{vetoEscolher(V,b.dataset.pjmapa);vetoAvancarAteMim(V);pintarPreJogoSelecao();});
  md.querySelectorAll('[data-pjlado]').forEach(b=>b.onclick=()=>{vetoEscolher(V,b.dataset.pjlado);vetoAvancarAteMim(V);pintarPreJogoSelecao();});
  const au=md.querySelector('[data-pjauto]');if(au)au.onclick=()=>{let n=0;while(!V.fim&&n++<40)vetoEscolher(V,null);pintarPreJogoSelecao();};
  md.querySelectorAll('[data-pjag]').forEach(b=>b.onclick=()=>{salvarTaticaDaSelecao({agres:+b.dataset.pjag});_pjsRefazer();pintarPreJogoSelecao();});
  md.querySelectorAll('[data-pjfoco]').forEach(b=>b.onclick=()=>{salvarTaticaDaSelecao({foco:b.dataset.pjfoco});_pjsRefazer();pintarPreJogoSelecao();});
  md.querySelectorAll('[data-pjtroca]').forEach(s=>s.onchange=()=>{if(!s.value)return;const r=trocarTitularCongelado(s.dataset.pjtroca,s.value);flash(r.ok?r.msg:r.motivo);_pjsRefazer();pintarPreJogoSelecao();});
  const sim=$('#pjsSim');if(sim)sim.onclick=()=>comecarPreJogoSelecao(false);
  const viv=$('#pjsVivo');if(viv)viv.onclick=()=>comecarPreJogoSelecao(true);
}
function comecarPreJogoSelecao(aoVivo){
  const {pend,depois,A,B,meu,V,sair}=PJS;PJS=null;
  $('#modal').innerHTML='';
  const vr=vetoResultado(V);
  const S=abrirSerie(A.id,B.id,pend.ctx.bo,{seq:vr.seq,mapas:vr.mapas,lados:vr.lados});
  let ficha=null;
  const fechar=S2=>{ficha=fecharSerieSelecaoConduzida(S2,A,B,pend);sair();
    return Object.assign(consolidarSerie(S2),{aId:S2.aId,bId:S2.bId,bo:S2.bo,mapas:S2.mapas,wa:S2.wa,wb:S2.wb,veto:S2.veto.seq,ficha});};
  if(!aoVivo){
    while(!S.fim){if(!serieAbrirMapa(S))break;while(!S.M.fim)passoRound(S.M);serieFecharMapa(S);}
    fechar(S);injetarSerieSelecao(ficha);
    modalSerieSelecao(ficha,()=>{if(depois)depois();});
    return;
  }
  partidaConduzida(S,{meuId:meu.id,nome:pend.ctx.nome,semana:G.semana,fechar,
    verFicha:(r,d)=>{if(ficha)modalSerieSelecao(ficha,d);else if(d)d();},
    aoFechar:()=>{if(depois)depois();}},()=>{if(ficha)injetarSerieSelecao(ficha);});
}

/* ---------- ligações ---------- */
function ligarCopaTecnico(v,on){
  on('[data-cpconv]',el=>{const [p,a]=el.dataset.cpconv.split('|');const r=responderConviteSelecao(p,a==='1');flash(r.ok?r.msg:r.motivo);
    if(r.ok&&a==='1'){copaAba='minha';irPara('copa');}else render();});
  on('[data-cpt]',el=>{const [id,est]=el.dataset.cpt.split('|');
    CONV_TEC.tit.delete(id);CONV_TEC.res.delete(id);
    if(est==='tit'){if(CONV_TEC.tit.size>=5)return flash('Já são 5 titulares: tire um antes.');CONV_TEC.tit.add(id);}
    if(est==='res'){if(CONV_TEC.res.size>=SELECAO_TAMANHO-5)return flash('Já são 5 reservas.');CONV_TEC.res.add(id);}
    render();});
  on('[data-cptsug]',()=>{const s=_convocacao(selecaoDoTecnico());if(s)CONV_TEC={pais:s.pais,tit:new Set(s.titulares),res:new Set(s.reservas)};render();});
  on('[data-cptsalvar]',()=>{const r=salvarConvocacaoDoTecnico([...CONV_TEC.tit],[...CONV_TEC.res]);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-cptag]',el=>{salvarTaticaDaSelecao({agres:+el.dataset.cptag});render();});
  on('[data-cptfoco]',el=>{salvarTaticaDaSelecao({foco:el.dataset.cptfoco});render();});
  on('[data-cptdeixar]',()=>{const r=deixarSelecao();flash(r.ok?r.msg:r.motivo);if(r.ok){copaAba='geral';CONV_TEC=null;}render();});
  document.querySelectorAll('[data-cptroca]').forEach(s=>s.onchange=()=>{if(!s.value)return;const r=trocarTitularCongelado(s.dataset.cptroca,s.value);flash(r.ok?r.msg:r.motivo);render();});
}
