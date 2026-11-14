/* ============================================================
   VALORANT WORLD CUP — a tela (C0: primeira versão)
   A sede e a contagem para a próxima Copa, o ranking de países e a
   convocação de cada seleção. Na C4 isto vira o hub do evento.
   ============================================================ */
let copaVer=null;   /* país aberto na tela */
let copaSelAtual=null;   /* o país que a tela está mostrando (o aberto, o seu ou o 1º) */

function semanasAteFinalDaCopa(){
  const ano=proximaCopa(G.ano);
  return (ano-G.ano)*SEMANAS_ANO+(SEMANAS_ANO-(G.semana||1));
}
function vCopa(){
  garantirCopa();
  const ano=proximaCopa(G.ano), s=sedeDoAno(ano), falta=semanasAteFinalDaCopa();
  const rk=rankingPaises();
  const meuPais=typeof meuJogador==='function'&&meuJogador()?meuJogador().pais:null;
  const elimAno=ano-1;
  const cicH=typeof cicloDaCopa==='function'?cicloDaCopa(ano,false):null;
  const fase=G.ano<elimAno?`Eliminatórias no fim de ${elimAno}`
    :G.ano===elimAno?(cicH&&cicH.classificados?'Os 32 estão definidos':cicH&&cicH.grupos?'Eliminatórias em andamento':'Eliminatórias no fim desta temporada')
    :'A Copa é no fim desta temporada';
  const sel=copaVer&&infoSelecao(copaVer)?copaVer:(meuPais&&infoSelecao(meuPais)?meuPais:rk[0].pais);
  copaSelAtual=sel;
  const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(s.pais):null;
  const logo=ASSETS.copa('sede-'+ASSETS.slug(s.nome))||ASSETS.copa('logo'), taca=ASSETS.copa('trofeu');
  return `<section class="card cp-hero">
      <div class="cp-hero-in">
        <div class="cp-trofeu${logo||taca?' img':''}" aria-hidden="true">${logo||taca?`<img src="${logo||taca}" alt="">`:typeof ico==='function'?ico('trofeu'):''}</div>
        <div><div class="eyebrow">Valorant World Cup · ${s.edicao}ª edição</div>
          <h1 class="cp-tit">${bandeira(s.pais)} ${esc(s.nome)} ${ano}</h1>
          <p class="dim">${esc(fase)}${cid?`. A final é em ${esc(cid.nome)}`:''}. 32 seleções: 16 convidadas e 16 das eliminatórias, em 8 grupos de 4 (MD3); os dois primeiros avançam e o mata-mata é todo em MD5.</p></div>
        <div class="cp-conta"><b class="num">${falta}</b><span>semana${falta===1?'':'s'} para a final</span></div>
      </div></section>
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Ranking de países</div>
        <table class="tbl cp-rank"><thead><tr><th>#</th><th>Seleção</th><th>Força</th><th>Pontos</th></tr></thead><tbody>
        ${rk.map(x=>`<tr class="${x.pais===sel?'me':''}" data-copapais="${x.pais}" style="cursor:pointer"><td class="num">${x.pos}</td>
          <td>${bandeira(x.pais)} <b>${esc(x.nome)}</b> <span class="dim">${x.sigla}</span>${x.pais===s.pais?' <span class="chip">sede</span>':''}${x.pos<=COPA_CONVITES?'':''}</td>
          <td class="num">${forcaSelecao(x.pais)}</td><td class="num">${x.pts}</td></tr>`).join('')}</tbody></table>
        <p class="dim">${cicH&&cicH.convidadas?`As convidadas saíram deste ranking no dia do sorteio (semana ${ELIM_SEM_SORTEIO}).`:`Hoje, as ${COPA_CONVITES} primeiras seriam convidadas (a sede entra sempre).`} O ranking nasce da força do melhor cinco de cada país, anda com cada série entre seleções e, a cada virada de ano, um pouco em direção à força atual do elenco.</p></div>
      ${cardConvocacao(sel)}
    </div>
    ${cardEliminatorias(ano,sel)}
    ${cardAmistoso(sel)}`;
}
/* ---------- amistoso: a partida de seleção, sem valer nada ----------
   Joga no motor dos clubes com sorteio próprio: não mexe no mundo nem no
   ranking. Serve para ver duas seleções em quadra antes da Copa. */
let copaAdv=null;
function timeVisualSelecao(pais){
  const i=infoSelecao(pais)||{nome:pais,sigla:pais};
  return{nome:i.nome,tag:i.sigla,logo:ASSETS.logoSelecao(pais)||ASSETS.bandeira(pais)||''};
}
function cardAmistoso(sel){
  const c=garantirCopa();
  const outros=rankingPaises().filter(x=>x.pais!==sel);
  const adv=copaAdv&&copaAdv!==sel&&infoSelecao(copaAdv)?copaAdv:outros[0].pais;
  const lista=(c.amistosos||[]);
  const nome=p=>{const i=infoSelecao(p);return i?i.nome:p;};
  return `<div class="card cx-linha cp-amistoso"><div class="eyebrow">Amistoso</div>
    <p class="dim">Duas seleções no mesmo motor dos clubes, com veto, mapa a mapa e ficha. Não vale ponto no ranking nem mexe em ninguém.</p>
    <div class="cp-am-linha">
      <span class="cp-am-t">${escudo(timeVisualSelecao(sel),40)}<b>${esc(nome(sel))}</b></span>
      <span class="dim">×</span>
      <select id="cpAdv">${outros.map(x=>`<option value="${x.pais}" ${x.pais===adv?'selected':''}>${esc(x.nome)} (${x.sigla})</option>`).join('')}</select>
      <button class="btn" data-cpamistoso="3">Jogar MD3</button>
      <button class="btn ghost" data-cpamistoso="5">Jogar MD5</button>
    </div>
    ${lista.length?`<table class="tbl cp-am-hist"><tbody>${lista.map((f,i)=>`<tr data-cpficha="${i}" style="cursor:pointer">
      <td>${bandeira(f.a)} <b class="${f.v===f.a?'up':''}">${esc(nome(f.a))}</b></td>
      <td class="num c"><b>${f.wa} – ${f.wb}</b></td>
      <td>${bandeira(f.b)} <b class="${f.v===f.b?'up':''}">${esc(nome(f.b))}</b></td>
      <td class="dim">MD${f.bo} · ${esc(f.mapa)}</td></tr>`).join('')}</tbody></table>`:''}
  </div>`;
}
function modalSerieSelecao(f){
  if(!f)return;
  const sig=p=>{const i=infoSelecao(p);return i?i.sigla:p;};
  const lado=pm=>f.esc&&f.esc.a.includes(pm.id)?sig(f.a):sig(f.b);
  const tec=['a','b'].map(k=>{const m=f.tec&&f.tec[k]&&G.staff&&G.staff[f.tec[k]];
    return m?`<span>${bandeira(f[k])} técnico: <b>${esc(m.nome)}</b> ${bandeira(m.pais)}</span>`:'';}).join('');
  abrir(htmlFichaSerie(f,timeVisualSelecao(f.a),timeVisualSelecao(f.b),{cor:'#e0b252',classe:'sr-selecao',
    cab:`Valorant World Cup · ${esc(f.nome||'Amistoso')}${f.fase?' · '+esc(f.fase):''} · MD${f.bo}`,
    doMvp:lado,rodape:tec?`<div class="sr-tecnicos dim">${tec}</div>`:''}),true);
  _ligarFichaSerie();
}
/* convidadas e grupos das eliminatórias, como seriam se o sorteio fosse hoje */
function cardEliminatorias(ano,sel){
  const cic=typeof cicloDaCopa==='function'?cicloDaCopa(ano,false):null;
  const sorteado=!!(cic&&cic.grupos);
  const conv=sorteado?cic.convidadas:convidadasDaCopa(ano);
  const nome=p=>{const i=infoSelecao(p);return `<span class="cp-sel${p===sel?' me':''}" data-copapais="${p}">${bandeira(p)} ${esc(i?i.nome:p)}</span>`;};
  const sig=p=>{const i=infoSelecao(p);return i?i.sigla:p;};
  const tit=!sorteado?'Se o sorteio fosse hoje':cic.classificados?'Os 32 classificados':'Eliminatórias';
  let grupos;
  if(!sorteado){
    grupos=gruposEliminatorias(ano).map(g=>`<div class="cp-grupo"><div class="cp-g-tit">Grupo ${g.letra} <span class="dim">${g.cont==='INTER'?'Intercontinental':esc(COPA_CONTINENTES[g.cont])}</span></div>
      ${g.paises.map(nome).join('')}</div>`).join('');
  }else{
    grupos=cic.grupos.map(g=>{
      const t=tabelaGrupo(g,cic.pontosNoSorteio), passou=g.classificados||[];
      return `<div class="cp-grupo cp-grupo-t"><div class="cp-g-tit">Grupo ${g.letra} <span class="dim">${g.cont==='INTER'?'Intercontinental':esc(COPA_CONTINENTES[g.cont])}</span></div>
        <table class="tbl cp-g-tab"><thead><tr><th></th><th class="c">V</th><th class="c">D</th><th class="c">Mapas</th></tr></thead><tbody>
        ${t.map((x,i)=>`<tr class="${x.pais===sel?'me':''} ${passou.includes(x.pais)?'cp-passou':''}" data-copapais="${x.pais}" style="cursor:pointer">
          <td>${bandeira(x.pais)} <b>${esc(sig(x.pais))}</b>${passou.includes(x.pais)?' <span class="chip up">Copa</span>':''}</td>
          <td class="c num">${x.v}</td><td class="c num">${x.d}</td><td class="c num">${x.mp}:${x.mc}</td></tr>`).join('')}</tbody></table>
        ${g.jogos.length?`<div class="cp-g-jogos">${g.jogos.map((f,i)=>`<span class="cp-jogo" data-cpelim="${g.letra}|${i}">${esc(sig(f.a))} <b>${f.wa}–${f.wb}</b> ${esc(sig(f.b))}</span>`).join('')}</div>`
          :`<div class="dim cp-g-jogos">Jogos nas semanas ${ELIM_SEM_RODADA1} e ${ELIM_SEM_RODADA2}.</div>`}
      </div>`;}).join('');
  }
  return `<div class="card cx-linha"><div class="eyebrow">${tit}</div>
    <p class="dim">${sorteado
      ?`Sorteio feito na semana ${ELIM_SEM_SORTEIO}. Grupos de 3 em MD3, todos contra todos; os dois primeiros vão à Copa. Desempate: vitórias, saldo de mapas, saldo de rounds, confronto direto e ranking.${cic.classificados?'':` Os 32 saem na semana ${ELIM_SEM_CLASSIFICADOS}.`}`
      :`A sede e as 15 melhores do ranking vão direto. As outras 24 jogam as eliminatórias no fim de ${ano-1}: 8 grupos de 3 por continente, em MD3; os dois primeiros de cada grupo vão à Copa. O sorteio é na semana ${ELIM_SEM_SORTEIO}.`}</p>
    <div class="cp-conv"><b>Convidadas</b> ${conv.map(nome).join('')}</div>
    ${cic&&cic.classificados?`<div class="cp-conv"><b>Das eliminatórias</b> ${cic.dasEliminatorias.map(nome).join('')}</div>`:''}
    <div class="cp-grupos">${grupos}</div></div>`;
}
function cardConvocacao(pais){
  const info=infoSelecao(pais), c=convocacao(pais);
  if(!info)return '';
  const linha=(id,tit)=>{const p=G.jogadores[id];if(!p)return '';const t=p.timeId&&G.times[p.timeId];
    return `<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b>${p.voce?' <span class="chip up">você</span>':''}${p.real?'':' <span class="dim">gerado</span>'}</td>
      <td>${esc(p.role)}</td><td class="num">${over(p)}</td><td>${t?esc(t.tag||t.nome):p.base?'base':'sem clube'}</td><td>${tit?'<span class="chip up">titular</span>':''}</td></tr>`;};
  const esc0=ASSETS.logoSelecao(pais);
  return `<div class="card"><div class="eyebrow cp-conv-tit">${esc0?`<img class="cp-escudo" src="${esc0}" alt="">`:''}${bandeira(pais)} ${esc(info.nome)} · convocação</div>
    ${c?`<table class="tbl"><thead><tr><th>Jogador</th><th>Função</th><th>Over</th><th>Clube</th><th></th></tr></thead><tbody>
      ${c.titulares.map(i=>linha(i,true)).join('')}${c.reservas.map(i=>linha(i,false)).join('')}</tbody></table>
      <p class="dim">${convocaveis(pais).length} convocáveis no mundo hoje. O cinco é o melhor possível pela mesma conta da escalação dos clubes; os reservas são os melhores que sobram.</p>`
      :vazio(`<b>${esc(info.nome)} não tem 7 jogadores agora.</b>`,'elenco')}</div>`;
}
function ligarCopa(v,on){
  on('[data-copapais]',el=>{copaVer=el.dataset.copapais;render();});
  const adv=document.querySelector('#cpAdv');if(adv)adv.onchange=()=>{copaAdv=adv.value;};
  on('[data-cpamistoso]',el=>{
    const sel=document.querySelector('#cpAdv'), minha=copaSelAtual;
    if(!sel||!minha)return;
    copaAdv=sel.value;
    const f=amistosoSelecoes(minha,sel.value,+el.dataset.cpamistoso);
    render();modalSerieSelecao(f);
  });
  on('[data-cpelim]',el=>{const [l,i]=el.dataset.cpelim.split('|');const cic=cicloAtual();
    const g=cic&&cic.grupos&&cic.grupos.find(x=>x.letra===l);if(g)modalSerieSelecao(g.jogos[+i]);});
  on('[data-cpficha]',el=>{const c=garantirCopa();modalSerieSelecao((c.amistosos||[])[+el.dataset.cpficha]);});
}
