/* ============================================================
   MERCADO › PEDIDOS — o que você procura e quem procura o quê
   (o motor mora em core/pedidos.js)
   ============================================================ */
let pdFiltro={reg:'',soMeus:true};

function vMercadoPedidos(t){
  const cap=capacidadeDeCompra(t,5);
  const ativos=pedidosReforco().filter(pedidoAtivo);
  const passados=pedidosReforco().filter(x=>!pedidoAtivo(x)).slice(0,2);
  const form=`<div class="card flat"><div class="eyebrow">Novo pedido de reforço</div>
    <p class="dim" style="margin:4px 0 10px">Diga o que procura. Ao longo dos dias da janela, clubes que topam vender e empresários
      de agentes livres respondem oferecendo jogadores, e o olheiro marca os que valem mais a pena.</p>
    <div class="pd-form">
      <label>Função<select id="pdFun">${ROLES.map(r=>`<option>${r}</option>`).join('')}</select></label>
      <label>Idade<span class="pd-par"><input type="number" id="pdIMin" value="17" min="15" max="40"> a <input type="number" id="pdIMax" value="27" min="15" max="40"></span></label>
      <label>Over mínimo<input type="number" id="pdOv" value="${Math.max(60,(carenciaDe(t).alvo||70)-2)}" min="0" max="99"></label>
      <label>Taxa até<input type="number" id="pdTeto" value="${Math.round(cap.agora/5000)*5000}" step="5000" min="0"></label>
      <button class="btn" id="pdPub" ${ativos.length>=REFORCO_MAX?'disabled':''}>Publicar pedido</button>
    </div>
    <div id="pdFeed"></div>
    <p class="dim" style="font-size:12px;margin-top:6px">Até ${REFORCO_MAX} pedidos abertos; cada um fica ${REFORCO_SEMANAS} semanas no ar.
      Seu caixa aguenta cerca de ${money(cap.agora)} à vista numa taxa.</p></div>`;

  const blocoPedido=x=>{
    const dias=Math.max(0,(x.ate-_semanaNeg())*7+(7-(G.turno||0)));
    const rs=x.respostas.map(r=>({r,p:P(r.jogadorId)})).filter(o=>o.p)
      .sort((a,b)=>(b.r.recomendado?1:0)-(a.r.recomendado?1:0)||(b.r.nota||0)-(a.r.nota||0));
    return `<div class="card flat pd-pedido ${pedidoAtivo(x)?'':'pd-fim'}">
      <div class="split"><div><b>${esc(x.funcao)}</b> · ${x.idadeMin}–${x.idadeMax} anos${x.overMin?' · over '+x.overMin+'+':''}${x.teto?' · taxa até '+money(x.teto):''}</div>
        ${pedidoAtivo(x)?`<span class="dim">fecha em ${dias} dia${dias===1?'':'s'} <button class="btn ghost sm" data-pdfechar="${x.id}">Fechar</button></span>`:'<span class="chip">encerrado</span>'}</div>
      ${rs.length?`<table class="wide merc-tab pd-tab"><thead><tr><th>Jogador</th><th>Quem oferece</th><th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th>
        <th class="c">Interesse</th><th class="r">Taxa</th><th class="r">Salário</th><th>Olheiro</th><th></th></tr></thead><tbody>
        ${rs.map(({r,p})=>{const c=p.timeId?T(p.timeId):null;
          return `<tr class="jrow ${r.recomendado?'pd-rec':''}" data-p="${p.id}"><td><span class="merc-j">${retrato(p,28)}<span><b>${esc(p.nome)}</b> ${bandeira(p.pais)}</span></span></td>
          <td>${c?`<span class="linha-t">${escudo(c,18)}<span class="dim">${esc(c.nome)}</span></span>`:'<span class="dim">empresário · livre</span>'}</td>
          <td class="c num">${p.idade}</td><td class="c">${ovTag(p)}</td><td class="c num dim">${p.pot}</td>
          <td class="c">${interesseMini(p,t)}</td>
          <td class="r num">${p.timeId?money(precoPedido(p)):'—'}</td><td class="r num">${money(salarioPedido(p,t))}</td>
          <td>${r.recomendado?`<span class="chip t" title="${esc(r.motivo||'')}">${icone('estrela','ouro')} ${esc(r.motivo||'recomendado')}</span>`:''}</td>
          <td class="r"><button class="btn-ic" data-prop="${p.id}" title="Negociar">${ico('aperto')}<span>Negociar</span></button></td></tr>`;}).join('')}
        </tbody></table>`
      :`<p class="dim" style="margin-top:6px">${pedidoAtivo(x)?(G.janela?'Esperando respostas: os clubes vão aparecendo ao longo dos dias.':'A janela está fechada: as respostas chegam quando ela abrir.'):'Ninguém respondeu a este pedido.'}</p>`}
    </div>`;
  };

  /* quem procura o quê */
  let nec=necessidadesDosClubes(t);
  if(pdFiltro.reg)nec=nec.filter(x=>x.t.regiao===pdFiltro.reg);
  if(pdFiltro.soMeus)nec=nec.filter(x=>x.servem.length);
  nec.sort((a,b)=>b.servem.length-a.servem.length||b.cap-a.cap);
  const linhaNec=x=>`<tr><td><span class="linha-t">${escudo(x.t,22)}<b>${esc(x.t.nome)}</b></span><div class="dim" style="font-size:11.5px">${esc(nomeLiga(x.t))}</div></td>
      <td><span class="tag ${x.role}">${esc(x.role)}</span> <span class="dim">${x.alvo?'acima de '+x.alvo:'vaga aberta'}</span></td>
      <td class="r num">${money(x.cap)}</td><td class="r num dim">${money(x.folga)}/mês</td>
      <td>${x.cheio?'<span class="dim">elenco cheio</span>':x.servem.length?x.servem.map(p=>{
          const ja=jaOferecido(p.id,x.t.id)||propostasDe(p.id).some(y=>y.clubeId===x.t.id);
          return `<span class="pd-serve"><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b> ${ovTag(p)}
            <button class="btn ghost sm" data-oferecer="${p.id}|${x.t.id}" ${ja||!G.janela?'disabled':''}>${ja?'oferecido':'Oferecer'}</button></span>`;}).join('')
        :'<span class="dim">ninguém do seu elenco</span>'}</td></tr>`;
  const cxNec=`<div class="card flat"><div class="split"><div class="eyebrow">Quem procura o quê</div>
      <span style="display:flex;gap:8px;align-items:center">
        <select id="pdReg"><option value="">Todas as regiões</option>${REGIONS.map(r=>`<option value="${r.id}" ${pdFiltro.reg===r.id?'selected':''}>${r.nome}</option>`).join('')}</select>
        <label class="dim" style="font-size:12px"><input type="checkbox" id="pdSoMeus" ${pdFiltro.soMeus?'checked':''}> só quem quer alguém meu</label></span></div>
    <p class="dim" style="margin:4px 0 8px">A função em que cada clube está mais fraco e o que ele consegue pagar (à vista mais a parcela de seis meses).
      Oferecer não anuncia o jogador: só aquele clube fica sabendo, e responde em poucos dias.</p>
    ${nec.length?`<table class="wide merc-tab"><thead><tr><th>Clube</th><th>Procura</th><th class="r">Paga até</th><th class="r">Folga salarial</th><th>Seus jogadores que servem</th></tr></thead>
      <tbody>${nec.slice(0,30).map(linhaNec).join('')}</tbody></table>`
      :'<p class="dim">Nenhum clube com a carência que os seus jogadores cobrem, com esse filtro.</p>'}
  </div>`;

  return `${G.janela?'':'<div class="card" style="border-left:4px solid var(--red)">A janela está fechada: dá para publicar pedidos e ver quem procura o quê, mas respostas e ofertas só com a janela aberta.</div>'}
    ${form}${ativos.map(blocoPedido).join('')}${passados.map(blocoPedido).join('')}${cxNec}`;
}
function ligarPedidos(v,on){
  if(!v.querySelector('#pdPub')&&!v.querySelector('#pdReg'))return;
  const b=v.querySelector('#pdPub');
  if(b)b.onclick=()=>{
    const r=publicarPedido({funcao:$('#pdFun').value,idadeMin:$('#pdIMin').value,idadeMax:$('#pdIMax').value,
      overMin:$('#pdOv').value,teto:$('#pdTeto').value});
    if(!r.ok){$('#pdFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--red);margin-top:8px">${esc(r.erro)}</div>`;return;}
    render();flash(r.msg);
  };
  on('[data-pdfechar]',el=>{fecharPedido(el.dataset.pdfechar);render();});
  on('[data-oferecer]',el=>{const [pid,cid]=el.dataset.oferecer.split('|');const r=oferecerJogador(P(pid),cid);flash(r.ok?r.msg:r.erro);if(r.ok)render();});
  const rg=v.querySelector('#pdReg');if(rg)rg.onchange=()=>{pdFiltro.reg=rg.value;render();};
  const sm=v.querySelector('#pdSoMeus');if(sm)sm.onchange=()=>{pdFiltro.soMeus=sm.checked;render();};
}
