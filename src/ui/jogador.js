/* ============================================================
   MODO JOGADOR — as telas (J0)
   ------------------------------------------------------------
   A navegação do modo jogador é outra lista: as telas de quem
   DIRIGE um clube (escalação, tática, estrutura, base, mercado do
   clube, finanças do clube) não aparecem; no lugar delas entram
   as do jogador. As telas do circuito (Competições, Estatísticas,
   Prêmios, Notícias) são as mesmas, e a página do seu clube é a
   página de clube de sempre.
   As outras telas do jogador moram em: ui/semana.js (Semana e
   treinos, Talentos), ui/relacoes.js, ui/mercado-jogador.js
   (Contrato e mercado, Finanças), ui/midia.js e ui/legado.js.
   ============================================================ */

const NAV_JOGADOR=[
  ['inicio','Central','Carreira','casa'],
  ['perfil','Meu jogador','Carreira','elenco'],
  ['semana','Semana e treinos','Carreira','mira'],
  ['talentos','Talentos','Carreira','arvore'],
  ['relacoes','Relações','Carreira','duplo'],
  ['contrato','Contrato e mercado','Carreira','troca'],
  ['financas','Finanças','Carreira','dinheiro'],
  ['midia','Fama e mídia','Carreira','estrela'],
  ['meuclube','Meu clube','Carreira','vestiario'],
  ['comp','Competições','Circuito','trofeu'],
  ['copa','World Cup','Circuito','estrela'],
  ['stats','Estatísticas','Circuito','grafico'],
  ['premios','Prêmios','Circuito','trofeu'],
  ['news','Notícias','Circuito','jornal'],
  ['config','Configurações','Sistema','engrenagem']
];
function navAtual(){if(typeof modoJogador==='function'&&modoJogador())return G.voce.aposentado&&typeof NAV_APOSENTADO!=='undefined'?NAV_APOSENTADO:NAV_JOGADOR;return typeof temaDonoAtivo==='function'&&temaDonoAtivo()&&typeof navDoDono==='function'?navDoDono():NAV;}
/* telas do modo jogador: chave → função de pintura */
function telaDoJogador(k){
  /* depois de parar, só o legado e o circuito (ui/legado.js) */
  if(G.voce&&G.voce.aposentado&&typeof vJLegado==='function')return ['comp','copa','stats','premios','news','config'].includes(k)||/^(clube|selecao):/.test(String(k))?null:vJLegado;
  return {inicio:vJCentral,perfil:vJPerfil,meuclube:vJMeuClube,
    semana:typeof vJSemana==='function'?vJSemana:null,relacoes:typeof vJRelacoes==='function'?vJRelacoes:null,
    contrato:typeof vJContrato==='function'?vJContrato:null,midia:typeof vJMidia==='function'?vJMidia:null,financas:typeof vJFinancas==='function'?vJFinancas:null,talentos:typeof vJTalentos==='function'?vJTalentos:null}[k]||null;
}

/* ---------- pedaços ---------- */
function _jMedia(p){const s=p.temp||{};return s.maps?{acs:Math.round(s.acs/s.maps),kd:(s.k/Math.max(1,s.d)).toFixed(2)}:{acs:null,kd:null};}
function _jSituacao(p,t){
  if(!t)return{rot:'Sem clube',tom:'',txt:'Jogando ranked e esperando a chance. Ranked, lives e fama sobem o radar dos olheiros; os convites para teste aparecem em Contrato e mercado.'};
  if(p.lesao)return{rot:'Lesionado',tom:'dn',txt:(G.voce&&G.voce.lesaoNome?'Com '+G.voce.lesaoNome+', f':'F')+'ora por '+p.lesao+' semana'+(p.lesao>1?'s':'')+'.'};
  const ch=typeof chanceDeJogar==='function'?chanceDeJogar():null;
  const pct=ch?` Chance de jogar a próxima: ${ch.pct}%.`:'';
  if((t.titulares||[]).includes(p.id))return{rot:'Titular',tom:'up',txt:'Você está no cinco do '+t.nome+'.'+pct};
  return{rot:'Reserva',tom:'',txt:'O técnico escala pelo over na função, pela condição e pela confiança dele em você.'+pct};
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
          ||acharStage((t.tier===1?'kg_':'ckg_')+t.regiao)||acharStage((t.tier===1?'s2_':'c2_')+t.regiao);
  return cardTabelaDaCasa(t,rr);
}

/* o cartão do confronto é o da Central do técnico: tira os botões de técnico */
function _jSemAcoesDeTecnico(html){
  return String(html).replace(/<button[^>]*data-ir="(preparacao|mercado|elenco|vestiario|estrutura|base|financas|taticas|treino|comps)"[^>]*>[\s\S]*?<\/button>/g,'')
    /* o veto é do técnico: para você, o botão leva ao dia de jogo */
    .replace(/Ir para o veto ›/g,'Ir para o dia de jogo ›');
}
/* ---------- Central do jogador ---------- */
function vJCentral(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const t=clubeDoJogador();
  const px=t?proximoConfronto():null;
  return `${typeof faixaCircuito==='function'?faixaCircuito():''}
    ${typeof guiaPassosHTML==='function'?guiaPassosHTML():''}
    ${_jHero(p,t)}
    ${typeof cardCopaCentral==='function'?cardCopaCentral():''}
    ${t?`<div class="grid g2 cx-linha">${_jSemAcoesDeTecnico(cardConfronto(t,px))}${_jTabela(t,px)}</div>`
       :`<div class="card"><div class="eyebrow">Ranked</div>${vazio('<b>Você ainda não tem clube.</b> Jogue ranked, faça lives e treine: os convites para teste e as propostas aparecem em Contrato e mercado.','jogar')+'<button class="btn sm" data-ir="contrato" style="margin-top:8px">Contrato e mercado ›</button>'}</div>`}
    ${typeof _jCardSemana==='function'?_jCardSemana(p):''}
    ${typeof _jCardMidia==='function'?_jCardMidia(p):''}
    ${typeof propostasJogador==='function'&&propostasJogador().length?`<div class="card rl-ev"><div class="split"><div class="eyebrow">Propostas</div><button class="btn sm" data-ir="contrato">Ver ›</button></div><p>${propostasJogador().map(x=>`${esc(_TIPO_PROP[x.tipo]||x.tipo)}: <b>${esc(G.times[x.clubeId].nome)}</b>`).join(' · ')}</p></div>`:''}
    ${typeof eventosJogador==='function'&&eventosJogador().length?`<div class="card rl-ev"><div class="split"><div class="eyebrow">No vestiário</div><button class="btn sm" data-ir="relacoes">Responder ›</button></div>${eventosJogador().map(e=>`<p>${esc(e.txt)}</p>`).join('')}</div>`:''}
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
  const fam=(p.agentes||[]).map((a,i)=>{const n=typeof nivelAgente==='function'?Math.round(nivelAgente(p,a)):0;
    return `<div class="jx-ag fixo ${i===0?'on':''}">${retratoAgente(a,58)}<b>${esc(a)}</b><u><i style="width:${n}%"></i></u><span class="num">${n}</span>${i===0?'<em>main</em>':''}</div>`;}).join('');
  const hist=(p.hist||[]).slice().reverse();
  return `${_jHero(p,t)}
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Atributos</div><div class="jx-perfil-atr">${_jRadar(p)}<div>${ATTRS.map(([k,r])=>barra(k,r)).join('')}</div></div>
        <p class="dim" style="margin-top:8px">Over ${over(p)} como ${esc(p.roleAtual||p.role)}${p.role2?' · também joga de '+esc(p.role2):''}. O potencial (${p.pot}) é o teto: perto dele, o XP rende cada vez menos. A linha fina embaixo de cada barra é o XP até o próximo ponto; treinos, atividades e partidas enchem ela.</p></div>
      <div class="card"><div class="eyebrow">Agentes e estilo</div>${fam?`<div class="jx-ag-grade">${fam}</div>`:vazio('<b>Sem agentes.</b>','elenco')}
        ${est?`<p style="margin-top:10px"><b>${esc(est.nome)}</b> <span class="dim">— ${esc(est.desc)}</span></p>`:''}
        <p class="dim">Familiaridade de 0 a 100, a mesma do manager: jogar e treinar com o agente sobe.</p></div>
    </div>
    ${typeof conquistasJogador==='function'?`<div class="grid g2 cx-linha">${cardConquistas(conquistasJogador(p))}${cardFimDeCarreira(p)}</div>`:''}
    ${typeof blocoCopaJogador==='function'?blocoCopaJogador(p):''}
    <div class="card"><div class="eyebrow">Carreira</div>
      ${hist.length?`<table class="tbl"><thead><tr><th>Ano</th><th>Clube</th><th>Over</th><th>Mapas</th><th>K/D</th><th>ACS</th><th>MVP</th></tr></thead><tbody>
        ${hist.map(h=>`<tr><td>${h.ano}</td><td>${esc(h.time||'')}</td><td class="num">${h.over}</td><td class="num">${h.maps||0}</td><td class="num">${h.k||0}/${h.d||0}</td><td class="num">${h.maps?Math.round(h.acs/h.maps):'–'}</td><td class="num">${h.mvp||0}</td></tr>`).join('')}</tbody></table>`
        :vazio('<b>A primeira temporada está em andamento.</b> O histórico entra na virada do ano.','trofeu')}</div>`;
}

/* o radar dos oito atributos, com o desenho da sua função por baixo */
function _jRadar(p){
  const S=230,c=S/2,R=86,ks=ATTRS.map(a=>a[0]),n=ks.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*clamp(v,0,100)/100;return [(c+Math.cos(a)*r).toFixed(1),(c+Math.sin(a)*r).toFixed(1)];};
  const anel=f=>ks.map((_,i)=>pt(i,f*100).join(',')).join(' ');
  const w=(typeof ROLE_W!=='undefined'&&ROLE_W[p.roleAtual||p.role])||{};
  const mx=Math.max(...ks.map(k=>w[k]||0),0.01);
  const ideal=ks.map((k,i)=>pt(i,40+60*(w[k]||0)/mx).join(',')).join(' ');
  const meu=ks.map((k,i)=>pt(i,p.at[k]||0).join(',')).join(' ');
  const rot=ks.map((k,i)=>{const [x,y]=pt(i,122);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc((ATTRS[i][1]||k).split(' ')[0].slice(0,6))}</text>`;}).join('');
  return `<svg class="jx-radar" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${[0.25,0.5,0.75,1].map(f=>`<polygon points="${anel(f)}" class="g"/>`).join('')}
    ${ks.map((_,i)=>{const [x,y]=pt(i,100);return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="g"/>`;}).join('')}
    <polygon points="${ideal}" class="ideal"/><polygon points="${meu}" class="meu"/>${rot}</svg>`;
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
  const p=meuJogador();
  if(!p&&G.voce&&G.voce.aposentado)return `<div class="side-org"><div class="n"><b>${esc(G.voce.aposentado.nome)}</b><span>aposentado · ${G.voce.aposentado.ano}</span></div></div>`;
  if(!p)return '';
  const t=clubeDoJogador();
  return `<div class="side-org">${t?escudo(t,34):''}<div class="n"><b>${esc(p.nome)}</b><span>${esc(t?t.nome:'sem clube')} · over ${over(p)}</span></div></div>`;
}
