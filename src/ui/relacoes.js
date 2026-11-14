/* ============================================================
   MODO JOGADOR — a tela de Relações (J4)
   O técnico (confiança, chance de jogar e o que pesa, conversa),
   os conflitos da semana, o clima do time e cada colega.
   ============================================================ */

function _barraPct(v,tom){return `<div class="rl-b"><i class="${tom||''}" style="width:${Math.max(0,Math.min(100,v))}%"></i></div>`;}
function _tomConf(c){return c>=65?'up':c<35?'dn':'';}
function cardChanceDeJogar(compacto){
  const ch=typeof chanceDeJogar==='function'?chanceDeJogar():null;
  if(!ch)return '';
  const tom=ch.pct>=65?'up':ch.pct<35?'dn':'';
  const frase=ch.lesao?'Lesionado: fora da próxima escalação.'
    :ch.fixo?'Titular prometido nas primeiras semanas da carreira.'
    :ch.dentro?`No cinco${ch.rival?`; ${esc(ch.rival.nome)} é quem entraria no seu lugar`:''}.`
    :`Fora do cinco${ch.rival?`; a vaga em disputa é a de ${esc(ch.rival.nome)}`:''}.`;
  return `<div class="rl-chance"><div class="split"><div class="eyebrow">Chance de jogar a próxima</div><b class="num rl-pct ${tom}">${ch.pct}%</b></div>
    ${_barraPct(ch.pct,tom)}<p class="dim">${frase}</p>
    ${compacto?'':`<div class="rl-fat">${ch.fatores.map(f=>`<div><span>${esc(f.rot)}</span><b class="num ${f.rot==='Over na função'?'':f.v>0?'up':f.v<0?'dn':''}">${f.rot==='Over na função'?f.v:(f.v>0?'+':'')+f.v}</b><i class="dim">${esc(f.txt)}</i></div>`).join('')}</div>
    <p class="dim">O técnico escala no começo de cada semana: over na função e cobertura, mais condição e confiança. Os números ao lado do over são pontos que ele soma ou tira.</p>`}</div>`;
}
function vJRelacoes(){
  const p=meuJogador(), t=clubeDoJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  if(!t)return `<div class="card">${vazio('<b>Sem clube, sem vestiário.</b> As relações começam quando você assinar.','vestiario')}</div>`;
  const conf=confTecnico(), conv=_conversou('tec');
  const opT=opcoesComTecnico();
  const ev=eventosJogador();
  const log=(G.voce.relLog||[]).slice(0,8);
  const colegas=(t.elenco||[]).filter(i=>i!==p.id).map(i=>G.jogadores[i]).filter(Boolean)
    .sort((a,b)=>((t.titulares||[]).includes(b.id)-(t.titulares||[]).includes(a.id))||over(b)-over(a));
  const moralMed=Math.round((t.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).reduce((s,x,_,a)=>s+x.moral/a.length,0)*100);
  const tecnico=t.tecnico||(t.staff&&t.staff.nomeTecnico)||null;
  return `<div class="grid g2 cx-linha">
    <div class="card"><div class="eyebrow">O técnico${tecnico?' · '+esc(tecnico):''}</div>
      <div class="rl-conf"><b class="num ${_tomConf(conf)}">${Math.round(conf)}</b><div><span>${esc(rotuloConf(conf))}</span>${_barraPct(conf,_tomConf(conf))}</div></div>
      <div class="rl-ops">${opT.map(o=>o.id==='funcao'
        ?`<div class="rl-op"><select id="rlFuncao" ${conv?'disabled':''}>${FUNCOES_BASE.filter(f=>f!==p.role).map(f=>`<option ${p.role2===f?'selected':''}>${f}</option>`).join('')}</select><button class="btn ghost sm" data-rltec="funcao" ${conv?'disabled':''} title="${esc(o.dica)}">${esc(o.rot)}</button></div>`
        :`<button class="btn ${o.id==='reclamar'?'ghost':''} sm" data-rltec="${o.id}" ${conv||o.off?'disabled':''} title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}</div>
      <p class="dim">${conv?'Você já falou com o técnico nesta semana.':'Uma conversa por semana. Passe o mouse para ver o que cada uma arrisca.'}</p>
      ${log.length?`<div class="rl-log">${log.map(l=>`<div><span class="dim">${l.ano} · sem ${l.semana}</span> ${esc(l.txt)}${l.d?` <b class="${l.d>0?'up':'dn'}">${l.d>0?'+':''}${l.d}</b>`:''}</div>`).join('')}</div>`:''}
    </div>
    <div class="card">${cardChanceDeJogar(false)}</div>
  </div>
  ${ev.length?`<div class="card rl-ev"><div class="eyebrow">No vestiário</div>${ev.map(e=>{const C=CONFLITOS[e.tipo];
    return `<div class="rl-evi"><b>${esc(C.titulo)}</b><p>${esc(e.txt)}</p><div class="rl-ops">${C.opcoes.map(o=>`<button class="btn ${o.id==='rebater'||o.id==='responder'?'ghost':''} sm" data-rlev="${e.id}:${o.id}" title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}</div></div>`;}).join('')}</div>`:''}
  <div class="card"><div class="split"><div class="eyebrow">Colegas · ${esc(t.nome)}</div>
      <span class="dim">Entrosamento do cinco ${Math.round(t.sinergia||0)} · moral média ${moralMed}%${t.seq?` · ${t.seq>0?t.seq+' vitória'+(t.seq>1?'s':'')+' seguida'+(t.seq>1?'s':''):(-t.seq)+' derrota'+(t.seq<-1?'s':'')+' seguida'+(t.seq<-1?'s':'')}`:''}</span></div>
    <table class="tbl rl-tab"><thead><tr><th>Jogador</th><th>Função</th><th>Over</th><th>Dupla com você</th><th>Moral</th><th></th></tr></thead><tbody>
    ${colegas.map(q=>{const d=Math.round(dupla(t,p.id,q.id)), ja=_conversou(q.id), tit=(t.titulares||[]).includes(q.id);
      return `<tr><td><b>${esc(q.nome)}</b>${tit?' <span class="chip up">titular</span>':''}${q.id===t.igl?' <span class="chip">IGL</span>':''}</td><td>${esc(q.roleAtual||q.role)}</td><td class="num">${over(q)}</td>
        <td><div class="rl-dupla">${_barraPct(d,d>=60?'up':d<30?'dn':'')}<span class="num">${d}</span></div></td><td class="num ${q.moral<0.45?'dn':''}">${Math.round(q.moral*100)}%</td>
        <td class="rl-acoes">${opcoesComColega(q).map(o=>`<button class="btn ghost sm" data-rlcol="${q.id}:${o.id}" ${ja?'disabled':''} title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}</td></tr>`;}).join('')}
    </tbody></table>
    <p class="dim">A dupla é o entrosamento entre vocês dois, o mesmo número que o motor usa: entre titulares, ela vira o entrosamento do time. Uma conversa por colega por semana.</p></div>`;
}
function ligarRelacoes(v,on){
  on('[data-rltec]',el=>{
    const op=el.dataset.rltec, extra=op==='funcao'?(v.querySelector('#rlFuncao')||{}).value:null;
    const r=conversarComTecnico(op,extra);
    if(!r.ok)flash(r.motivo);else modalConversaJogador('O técnico',r.msg);
    render();
  });
  on('[data-rlcol]',el=>{const [id,op]=el.dataset.rlcol.split(':');const r=conversarComColega(id,op);flash(r.ok?r.msg:r.motivo);render();});
  on('[data-rlev]',el=>{const [id,op]=el.dataset.rlev.split(':');const r=resolverConflito(id,op);if(r.ok)modalConversaJogador('No vestiário',r.msg);else flash(r.motivo);render();});
}
function modalConversaJogador(titulo,msg){
  pintarModal(`<div class="ovl"><div class="box sj-res"><div class="eyebrow">${esc(titulo)}</div><h2 class="rl-fala">${esc(msg)}</h2>
    <div class="dj-acoes"><button class="btn" id="rlOk">Ok</button></div></div></div>`);
  $('#rlOk').onclick=()=>{$('#modal').innerHTML='';render();};
}
