/* ============================================================
   MODO JOGADOR — as telas (J0)
   ------------------------------------------------------------
   A navegação do modo jogador é outra lista: as telas de quem
   DIRIGE um clube (escalação, tática, estrutura, base, mercado do
   clube, finanças do clube) não aparecem; no lugar delas entram
   as do jogador. As telas do circuito (Competições, Estatísticas,
   Prêmios, Notícias) são as mesmas, e a página do seu clube é a
   página de clube de sempre.
   As etapas seguintes acrescentam aqui: Semana e treinos (J3),
   Relações (J4), Contrato e Finanças pessoais (J5), Mídia (J6).
   ============================================================ */

const NAV_JOGADOR=[
  ['inicio','Central','Carreira','casa'],
  ['perfil','Meu jogador','Carreira','elenco'],
  ['semana','Semana e treinos','Carreira','mira'],
  ['talentos','Talentos','Carreira','arvore'],
  ['meuclube','Meu clube','Carreira','vestiario'],
  ['comp','Competições','Circuito','trofeu'],
  ['stats','Estatísticas','Circuito','grafico'],
  ['premios','Prêmios','Circuito','trofeu'],
  ['news','Notícias','Circuito','jornal'],
  ['config','Configurações','Sistema','engrenagem']
];
function navAtual(){return typeof modoJogador==='function'&&modoJogador()?NAV_JOGADOR:NAV;}
/* telas do modo jogador: chave → função de pintura */
function telaDoJogador(k){
  return {inicio:vJCentral,perfil:vJPerfil,meuclube:vJMeuClube,
    semana:typeof vJSemana==='function'?vJSemana:null,talentos:typeof vJTalentos==='function'?vJTalentos:null}[k]||null;
}

/* ---------- pedaços ---------- */
function _jMedia(p){const s=p.temp||{};return s.maps?{acs:Math.round(s.acs/s.maps),kd:(s.k/Math.max(1,s.d)).toFixed(2)}:{acs:null,kd:null};}
function _jSituacao(p,t){
  if(!t)return{rot:'Sem clube',tom:'',txt:'Jogando ranked e esperando a chance. Os convites para teste chegam com a etapa de mercado.'};
  if(p.lesao)return{rot:'Lesionado',tom:'dn',txt:'Fora por '+p.lesao+' semana'+(p.lesao>1?'s':'')+'.'};
  if((t.titulares||[]).includes(p.id))return{rot:'Titular',tom:'up',txt:'Você está no cinco do '+t.nome+'.'};
  return{rot:'Reserva',tom:'',txt:'O técnico escala pelo over, pela forma e pelo cansaço. Treinar e render nos jogos muda a sua situação.'};
}
function _jHero(p,t){
  const cor=t?corDoClube(t):'#5a6b7d';
  const sit=_jSituacao(p,t), md=_jMedia(p), o=over(p);
  const fam=(p.agentes||[]).slice(0,3);
  return `<section class="cx-hero jg-hero" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
    <div class="jg-hero-in">
      <div class="jg-carta">${cartaJogador(p,{w:150})}</div>
      <div class="jg-quem">
        <div class="eyebrow">${esc(p.roleAtual||p.role)}${p.nomeReal?' · '+esc(p.nomeReal):''} · ${p.idade} anos · ${esc(p.pais||'')}</div>
        <h1 class="jg-nick">${esc(p.nome)}</h1>
        <div class="jg-clube">${t?`${escudo(t,26)} <b>${esc(t.nome)}</b> <span class="dim">${esc(nomeLiga(t))}</span>`:'<span class="dim">Sem clube</span>'}
          <span class="chip ${sit.tom}">${esc(sit.rot)}</span></div>
        <div class="jg-num">
          <span>Over <b class="num">${o}</b></span><span>Potencial <b class="num">${p.pot}</b></span>
          ${md.acs!=null?`<span>ACS <b class="num">${md.acs}</b></span><span>K/D <b class="num">${md.kd}</b></span>`:''}
          ${t?`<span>Contrato <b class="num">${p.contrato}</b> ano${p.contrato===1?'':'s'}</span><span>Salário <b class="num">${money(p.salario)}</b>/mês</span>`:''}
        </div>
        <div class="jg-ag">${fam.map(a=>`<span class="chip">${esc(a)}</span>`).join('')}</div>
        <p class="dim" style="margin-top:6px">${esc(sit.txt)}</p>
      </div>
    </div></section>`;
}
function _jNoticiasSobre(p,n){
  const lista=(G.noticias||[]).filter(x=>(x.p||[]).includes(p.id)).slice(0,n||6);
  return `<div class="card"><div class="split"><div class="eyebrow">Falando de você</div><button class="btn ghost sm" data-ir="news">Notícias ›</button></div>
    ${lista.length?`<div class="feed">${lista.map(x=>`<div><span class="dim">${x.ano} · sem ${x.s}</span> ${typeof iconizar==='function'?iconizar(esc(x.txt)):esc(x.txt)}</div>`).join('')}</div>`
      :vazio('<b>Ninguém falou de você ainda.</b> Jogo grande, título e polêmica viram notícia.','jornal')}</div>`;
}
function _jTemporada(p){
  const s=p.temp||{}, md=_jMedia(p);
  const c=p.carreira||{};
  const it=(r,v)=>`<div><b class="num">${v}</b><span>${r}</span></div>`;
  return `<div class="card"><div class="eyebrow">Temporada ${G.ano}</div>
    ${s.maps?`<div class="jg-st">${it('mapas',s.maps)}${it('abates',s.k)}${it('mortes',s.d)}${it('assist.',s.a)}${it('ACS',md.acs)}${it('first kills',s.fk||0)}${it('clutches',s.cl||0)}${it('MVP',s.mvp||0)}</div>`
      :vazio('<b>Nenhum mapa jogado nesta temporada.</b>','grafico')}
    ${c.maps?`<p class="dim" style="margin-top:8px">Carreira: ${c.maps} mapas · ${c.k}/${c.d} · ACS médio ${Math.round((c.acs||0)/c.maps)} · ${c.mvp||0} MVP</p>`:''}</div>`;
}
/* a tabela da liga do clube (a mesma conta da Central do técnico) */
function _jTabela(t,px){
  if(!t||typeof cardTabelaDaCasa!=='function')return '';
  const metade=(G.semana||1)>=25?'2':'1', pre=(t.tier===1?'s':'c')+metade+'_';
  const rrAgora=px&&px.stage&&(px.stage.tipo==='grupos'||px.stage.tipo==='rr')?px.stage:null;
  const rr=rrAgora||acharStage(pre+t.regiao)||acharStage((t.tier===1?'s1_':'c1_')+t.regiao)
          ||(t.tier===1?acharStage('kg_'+t.regiao):null)||acharStage((t.tier===1?'s2_':'c2_')+t.regiao);
  return cardTabelaDaCasa(t,rr);
}

/* o cartão do confronto é o da Central do técnico: tira os botões de técnico */
function _jSemAcoesDeTecnico(html){
  return String(html).replace(/<button[^>]*data-ir="(preparacao|mercado|elenco|vestiario|estrutura|base|financas|taticas|treino|comps)"[^>]*>[\s\S]*?<\/button>/g,'');
}
/* ---------- Central do jogador ---------- */
function vJCentral(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const t=clubeDoJogador();
  const px=t?proximoConfronto():null;
  return `${typeof faixaCircuito==='function'?faixaCircuito():''}
    ${_jHero(p,t)}
    ${t?`<div class="grid g2 cx-linha">${_jSemAcoesDeTecnico(cardConfronto(t,px))}${_jTabela(t,px)}</div>`
       :`<div class="card"><div class="eyebrow">Ranked</div>${vazio('<b>Você ainda não tem clube.</b> Por enquanto as semanas passam com você jogando ranked; os convites para teste e as propostas chegam com a etapa de mercado (J5).','jogar')}</div>`}
    ${typeof _jCardSemana==='function'?_jCardSemana(p):''}
    <div class="grid g2 cx-linha">${_jTemporada(p)}${_jNoticiasSobre(p)}</div>`;
}
/* o resumo da semana na Central: energia, o que falta e os pontos de talento */
function _jCardSemana(p){
  if(typeof semanaJogador!=='function')return '';
  const s=semanaJogador(), livres=pontosLivres(p);
  const coletivo=clubeDoJogador()&&!vezesFeita('coletivo')&&!p.lesao;
  return `<div class="card jg-sem"><div class="split"><div class="eyebrow">Sua semana</div><button class="btn sm" data-ir="semana">Semana e treinos ›</button></div>
    ${_barraEnergia(s)}
    <p class="dim">${s.feitas.length?s.feitas.length+' atividade'+(s.feitas.length>1?'s':'')+' feita'+(s.feitas.length>1?'s':'')+'.':'Nada marcado ainda.'}${coletivo?' O treino do clube ainda não foi.':''}${livres>0?` <b>${livres} ponto${livres>1?'s':''} de talento livre${livres>1?'s':''}</b> — <a href="#" data-ir="talentos">abrir talentos</a>.`:''}</p></div>`;
}

/* ---------- Meu jogador ---------- */
function vJPerfil(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const t=clubeDoJogador(), est=typeof estiloJogador==='function'&&G.voce?estiloJogador(G.voce.estilo):null;
  /* a barra fina embaixo é o XP até o próximo ponto (core/semana-jogador.js) */
  const barra=(k,rot)=>{const v=p.at[k];
    const xp=typeof custoPonto==='function'&&k!=='lider'?Math.min(100,Math.round(((p.xp||{})[k]||0)/custoPonto(v,p)*100)):null;
    return `<div class="jg-atr"><span>${esc(rot)}</span><div class="jg-atr-b"><i style="width:${v}%"></i>${xp!=null?`<em style="width:${xp}%"></em>`:''}</div><b class="num">${v}</b></div>`;};
  const fam=(p.agentes||[]).map(a=>{const n=typeof nivelAgente==='function'?nivelAgente(p,a):null;
    return `<div class="jg-agl"><b>${esc(a)}</b><div class="jg-atr-b"><i style="width:${n||0}%"></i></div><span class="num">${n!=null?Math.round(n):'–'}</span></div>`;}).join('');
  const hist=(p.hist||[]).slice().reverse();
  return `${_jHero(p,t)}
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Atributos</div>${ATTRS.map(([k,r])=>barra(k,r)).join('')}
        <p class="dim" style="margin-top:8px">Over ${over(p)} como ${esc(p.roleAtual||p.role)}${p.role2?' · também joga de '+esc(p.role2):''}. O potencial (${p.pot}) é o teto: perto dele, o XP rende cada vez menos. A linha fina embaixo de cada barra é o XP até o próximo ponto; treinos, atividades e partidas enchem ela.</p></div>
      <div class="card"><div class="eyebrow">Agentes e estilo</div>${fam||vazio('<b>Sem agentes.</b>','elenco')}
        ${est?`<p style="margin-top:10px"><b>${esc(est.nome)}</b> <span class="dim">— ${esc(est.desc)}</span></p>`:''}
        <p class="dim">Familiaridade de 0 a 100, a mesma do manager: jogar e treinar com o agente sobe.</p></div>
    </div>
    <div class="card"><div class="eyebrow">Carreira</div>
      ${hist.length?`<table class="tbl"><thead><tr><th>Ano</th><th>Clube</th><th>Over</th><th>Mapas</th><th>K/D</th><th>ACS</th><th>MVP</th></tr></thead><tbody>
        ${hist.map(h=>`<tr><td>${h.ano}</td><td>${esc(h.time||'')}</td><td class="num">${h.over}</td><td class="num">${h.maps||0}</td><td class="num">${h.k||0}/${h.d||0}</td><td class="num">${h.maps?Math.round(h.acs/h.maps):'–'}</td><td class="num">${h.mvp||0}</td></tr>`).join('')}</tbody></table>`
        :vazio('<b>A primeira temporada está em andamento.</b> O histórico entra na virada do ano.','trofeu')}</div>`;
}

/* ---------- Meu clube: a página de clube de sempre ---------- */
function vJMeuClube(){
  const t=clubeDoJogador();
  if(!t)return `<div class="card">${vazio('<b>Você ainda não tem clube.</b> Quando assinar, a página dele aparece aqui.','vestiario')}</div>`;
  clubeVer=t.id;
  return vClube();
}

/* ---------- a barra lateral do modo jogador mostra você ---------- */
function sideCabecalhoJogador(){
  const p=meuJogador();if(!p)return '';
  const t=clubeDoJogador();
  return `<div class="side-org">${t?escudo(t,34):''}<div class="n"><b>${esc(p.nome)}</b><span>${esc(t?t.nome:'sem clube')} · over ${over(p)}</span></div></div>`;
}
