/* ============================================================
   VALORANT WORLD CUP — a tela (C0: primeira versão)
   A sede e a contagem para a próxima Copa, o ranking de países e a
   convocação de cada seleção. Na C4 isto vira o hub do evento.
   ============================================================ */
let copaVer=null;   /* país aberto na tela */

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
  const fase=G.ano<elimAno?`Eliminatórias no fim de ${elimAno}`:G.ano===elimAno?'Eliminatórias no fim desta temporada':'A Copa é no fim desta temporada';
  const sel=copaVer&&infoSelecao(copaVer)?copaVer:(meuPais&&infoSelecao(meuPais)?meuPais:rk[0].pais);
  return `<section class="card cp-hero">
      <div class="cp-hero-in">
        <div class="cp-trofeu" aria-hidden="true">${typeof ico==='function'?ico('trofeu'):''}</div>
        <div><div class="eyebrow">Valorant World Cup · ${s.edicao}ª edição</div>
          <h1 class="cp-tit">${esc(s.nome)} ${ano}</h1>
          <p class="dim">${esc(fase)}. 32 seleções: 16 convidadas pelo ranking e 16 das eliminatórias, em 8 grupos de 4; os dois primeiros de cada grupo avançam.</p></div>
        <div class="cp-conta"><b class="num">${falta}</b><span>semana${falta===1?'':'s'} para a final</span></div>
      </div></section>
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Ranking de países</div>
        <table class="tbl cp-rank"><thead><tr><th>#</th><th>Seleção</th><th>Força</th><th>Pontos</th></tr></thead><tbody>
        ${rk.map(x=>`<tr class="${x.pais===sel?'me':''}" data-copapais="${x.pais}" style="cursor:pointer"><td class="num">${x.pos}</td>
          <td>${bandeira(x.pais)} <b>${esc(x.nome)}</b> <span class="dim">${x.sigla}</span>${x.pais===s.pais?' <span class="chip">sede</span>':''}${x.pos<=COPA_CONVITES?'':''}</td>
          <td class="num">${forcaSelecao(x.pais)}</td><td class="num">${x.pts}</td></tr>`).join('')}</tbody></table>
        <p class="dim">Hoje, as ${COPA_CONVITES} primeiras seriam convidadas (a sede entra sempre). O ranking nasce da força do melhor cinco de cada país e, a partir da primeira Copa, anda com os resultados.</p></div>
      ${cardConvocacao(sel)}
    </div>`;
}
function cardConvocacao(pais){
  const info=infoSelecao(pais), c=convocacao(pais);
  if(!info)return '';
  const linha=(id,tit)=>{const p=G.jogadores[id];if(!p)return '';const t=p.timeId&&G.times[p.timeId];
    return `<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b>${p.voce?' <span class="chip up">você</span>':''}${p.real?'':' <span class="dim">gerado</span>'}</td>
      <td>${esc(p.role)}</td><td class="num">${over(p)}</td><td>${t?esc(t.tag||t.nome):p.base?'base':'sem clube'}</td><td>${tit?'<span class="chip up">titular</span>':''}</td></tr>`;};
  return `<div class="card"><div class="eyebrow">${bandeira(pais)} ${esc(info.nome)} · convocação</div>
    ${c?`<table class="tbl"><thead><tr><th>Jogador</th><th>Função</th><th>Over</th><th>Clube</th><th></th></tr></thead><tbody>
      ${c.titulares.map(i=>linha(i,true)).join('')}${c.reservas.map(i=>linha(i,false)).join('')}</tbody></table>
      <p class="dim">${convocaveis(pais).length} convocáveis no mundo hoje. O cinco é o melhor possível pela mesma conta da escalação dos clubes; os reservas são os melhores que sobram.</p>`
      :vazio(`<b>${esc(info.nome)} não tem 7 jogadores agora.</b>`,'elenco')}</div>`;
}
function ligarCopa(v,on){
  on('[data-copapais]',el=>{copaVer=el.dataset.copapais;render();});
}
