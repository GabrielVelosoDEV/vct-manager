/* ============================================================
   MODO JOGADOR — conquistas, aposentadoria e legado (J7)
   ============================================================ */
const NAV_APOSENTADO=[
  ['inicio','Legado','Carreira','trofeu'],
  ['comp','Competições','Circuito','trofeu'],
  ['stats','Estatísticas','Circuito','grafico'],
  ['premios','Prêmios','Circuito','trofeu'],
  ['news','Notícias','Circuito','jornal'],
  ['config','Configurações','Sistema','engrenagem']
];
/* cartão de conquistas e recordes (Meu jogador e Legado) */
function cardConquistas(c){
  if(!c)return '';
  const pr=c.premios||[];
  return `<div class="card"><div class="eyebrow">Conquistas</div>
    <div class="jg-st">${[['títulos',c.titulos],['internacionais',c.intl],['prêmios do ano',pr.length],['MVP de torneio',c.mvpTorneios]].map(([r,v])=>`<div><b class="num">${v||0}</b><span>${r}</span></div>`).join('')}</div>
    ${pr.length?`<div class="lg-premios">${pr.slice().reverse().map(x=>`<span class="chip">${x.ano} · ${esc(x.rot||x.tipo)}</span>`).join('')}</div>`:''}
    ${c.recordes&&c.recordes.length?`<div class="lg-rec">${c.recordes.map(r=>`<div><span class="dim">${esc(r.rot)}</span><b class="num">${r.v}</b>${r.ano?`<i class="dim">${r.ano}</i>`:''}</div>`).join('')}</div>`:''}
    ${(c.convocacoes||[]).length?`<p class="dim">Eventos internacionais: ${c.convocacoes.map(x=>`${esc(x.nome)} ${x.ano}${x.titular?'':' (banco)'}`).join(' · ')}.</p>`:''}
    <p class="dim">Pontos de Hall da Fama: <b>${c.lenda}</b> de ${typeof LENDA_CORTE!=='undefined'?LENDA_CORTE:14} para entrar na aposentadoria.</p></div>`;
}
/* o fim da carreira, no Meu jogador */
function cardFimDeCarreira(p){
  const longe=(p.pico||over(p))-over(p);
  return `<div class="card"><div class="eyebrow">Fim de carreira</div>
    <p>${p.idade} anos · over ${over(p)} (auge ${Math.round(p.pico||over(p))}).${p.idade>=33&&longe>=8?' O corpo já está pedindo.':''}</p>
    <p class="dim">Você decide quando parar. Aos 40, ou a partir dos 35 com 12 pontos abaixo do auge, o corpo decide por você na virada da temporada. Depois de parar dá para seguir como técnico no mesmo save; os clubes por onde você passou chamam primeiro.</p>
    <button class="btn ghost sm" data-lgaposentar="1">Pendurar o mouse…</button></div>`;
}
function modalAposentar(){
  const p=meuJogador();if(!p)return;
  pintarModal(`<div class="ovl"><div class="box sj-res"><div class="eyebrow">Fim de carreira</div><h2>Pendurar o mouse agora?</h2>
    <p>${esc(p.nome)}, ${p.idade} anos, over ${over(p)}. A temporada atual entra no histórico como está, e você sai do ${p.timeId?esc(G.times[p.timeId].nome):'mercado'} hoje. Não dá para voltar atrás.</p>
    <div class="dj-acoes"><button class="btn ghost" id="lgNao">Ainda não</button><button class="btn" id="lgSim">Aposentar</button></div></div></div>`);
  $('#lgNao').onclick=()=>{$('#modal').innerHTML='';};
  $('#lgSim').onclick=()=>{aposentarJogador('escolha');$('#modal').innerHTML='';tela='inicio';render();pintarSide();pintarTop();};
}
/* a tela depois de parar */
function vJLegado(){
  const L=G.voce&&G.voce.aposentado;
  if(!L)return '';
  const c=L.conquistas, of=ofertasDeTecnicoExJogador(), rep=reputacaoExJogador(L);
  const cr=c&&c.carreira||{};
  return `<section class="card sj-topo lg-topo"><div class="eyebrow">${L.motivo==='corpo'?'O corpo decidiu':'Fim de carreira'} · ${L.ano}</div>
      <h1 class="jg-nick">${esc(L.nome)}</h1>
      <p>${esc(L.role)} · ${L.idade} anos · auge over ${L.pico} · ${L.ano-L.desde+1} temporada${L.ano-L.desde?'s':''} na carreira</p>
      <div class="jg-st mj-fin">${[['mapas',cr.maps||0],['K/D',cr.kd||0],['ACS médio',cr.acs||0],['títulos',c?c.titulos:0],['seguidores',typeof fmtSeg==='function'?fmtSeg(L.seguidores):L.seguidores]].map(([r,v])=>`<div><b class="num">${v}</b><span>${r}</span></div>`).join('')}</div>
      <p>${L.hall?'<b class="up">Entrou para o Hall da Fama.</b>':`Ficou fora do Hall da Fama (${L.pontos} de ${typeof LENDA_CORTE!=='undefined'?LENDA_CORTE:14} pontos).`} Patrimônio: ${typeof moneyJ==='function'?moneyJ(L.caixa):L.caixa}.</p></section>
    <div class="grid g2 cx-linha">${cardConquistas(c)}
      <div class="card"><div class="eyebrow">Clubes</div>
        <table class="tbl"><thead><tr><th>Ano</th><th>Clube</th><th>Over</th><th>Mapas</th><th>ACS</th></tr></thead><tbody>
        ${L.hist.slice().reverse().map(h=>`<tr><td>${h.ano}</td><td>${esc(h.time||'')}</td><td class="num">${h.over}</td><td class="num">${h.maps}</td><td class="num">${h.maps?Math.round(h.acs/h.maps):'–'}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="eyebrow">E agora?</div>
      <p>Seguir no jogo como <b>técnico</b>, no mesmo mundo: a sua reputação de jogador vale +${rep} no nível de coach e na paciência da diretoria. Os clubes por onde você passou chamam primeiro.</p>
      <div class="mj-props">${of.map(({t,casa})=>`<div class="mj-prop"><div class="mj-prop-top">${escudo(t,40)}<div><div class="eyebrow">${casa?'Ex-clube':'Convite'}</div><b class="mj-clube">${esc(t.nome)}</b><span class="dim">Tier ${t.tier} · ${esc(nomeLiga(t))} · prestígio ${Math.round(t.prestigio)}</span></div></div>
        <div class="mj-prop-b"><button class="btn sm" data-lgtecnico="${t.id}">Assumir como técnico</button></div></div>`).join('')}</div>
      <p class="dim" style="margin-top:12px">Ou deixe a história aqui: o save continua com o seu legado, e o mundo segue andando se você avançar as semanas.</p></div>`;
}
function ligarLegado(v,on){
  on('[data-lgaposentar]',()=>modalAposentar());
  on('[data-lgtecnico]',el=>{
    const r=virarTecnico(el.dataset.lgtecnico);
    if(!r.ok){flash(r.motivo);return;}
    tela='inicio';hist=['inicio'];histPos=0;
    if(typeof Prefs!=='undefined'&&typeof salvarRun==='function'&&Prefs.get('autosave'))salvarRun(G.runNome);
    pintarTop();pintarSide();render();flash(r.msg);
  });
}
