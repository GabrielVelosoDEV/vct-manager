/* ============================================================
   MERCADO VIVO — telas
   ------------------------------------------------------------
   O leilão aparece lance a lance, com o escudo de quem cobriu e
   de quem desistiu, até sobrar um. O empréstimo pedido por você
   abre um painel ao lado da mesa: quanto do salário você paga e
   se quer opção de compra.
   ============================================================ */
function modalLeilao(jogadorId){
  const p=P(jogadorId);if(!p)return;
  const r=abrirLeilao(jogadorId);
  if(!r.ok)return avisar(r.erro,'Leilão');
  const venc=T(r.vencedor);
  /* o leilão inteiro cabe em uns três segundos, por mais lances que tenha */
  const passo=Math.min(0.35,3/Math.max(1,r.rodadas.length));
  abrir(`<div class="neg leilao">
    <div class="eyebrow">Leilão</div><h2 class="sec">Quem leva ${esc(p.nome)}?</h2>
    <div class="leilao-palco">${cartaJogador(p,{w:120})}
      <div class="leilao-lances">${r.rodadas.map((x,i)=>{const c=T(x.clube);
        return `<div class="leilao-lance ${x.fora?'fora':''} ${x.vence?'vence':''}" style="animation-delay:${(i*passo).toFixed(2)}s">
          ${escudo(c,28)}<span>${esc(x.txt)}</span>${x.fora?'':`<b class="num">${dinheiro(x.valor)}</b>`}</div>`;}).join('')}
      </div></div>
    <div class="leilao-fim" style="animation-delay:${(r.rodadas.length*passo).toFixed(2)}s">
      ${escudo(venc,44)}<div><div class="eyebrow">Maior lance</div><b>${esc(venc.nome)}</b> oferece <b class="num">${dinheiro(r.valor)}</b></div>
    </div>
    <p class="dim">Os outros retiraram as propostas. A do vencedor fica na mesa por ${PRAZO_PROPOSTA} semanas.</p>
    <div class="neg-bts" style="justify-content:flex-end">
      <button class="btn" id="lAceitar">Vender por ${dinheiro(r.valor)}</button>
      <button class="btn ghost" data-close>Pensar depois</button></div>
  </div>`,true);
  /* a lista acompanha os lances até o último */
  const lista=$('#modal .leilao-lances');
  if(lista)r.rodadas.forEach((x,i)=>setTimeout(()=>{if(lista.isConnected)lista.scrollTop=lista.scrollHeight;},(i+1)*passo*1000));
  $('#lAceitar').onclick=()=>{
    const a=aceitarProposta(r.propostaId);
    if(!a.ok)return avisar(a.erro);
    noticia('🤝 '+a.msg,{c:'mercado',p:[p.id]});
    $('#modal').innerHTML='';render();
  };
  render();
}

function modalEmprestimoMesa(n){
  const p=P(n.jogadorId), dono=T(n.origemId), eu=meu();
  const rasc={parte:0.75,opcao:0};
  const desenha=()=>{
    const a=avaliarEmprestimoPedido(n,rasc);
    abrir(`<div class="neg">
      <div class="eyebrow">Empréstimo</div><h2 class="sec">${esc(p.nome)} emprestado do ${esc(dono.nome)}</h2>
      <div class="neg-palco">
        ${`<div class="neg-lado">${escudo(dono,56)}<div class="eyebrow">Sai de</div><b>${esc(dono.nome)}</b></div>`}
        <div class="neg-centro">${cartaJogador(p,{w:130})}</div>
        <div class="neg-lado">${escudo(eu,56)}<div class="eyebrow">Vem para</div><b>${esc(eu.nome)}</b></div>
      </div>
      <div class="neg-corpo">
        <div class="neg-col">
          <div class="eyebrow">O que o ${esc(dono.nome)} pensa</div>
          <p class="dim">${a.rank>=5?'Ele não tem espaço no elenco deles: emprestar dá minutos e alivia a folha.':'Ele está no grupo principal deles: só sai se vocês assumirem boa parte do salário.'}</p>
          <div class="neg-numeros">
            <div><span class="dim">Parte mínima do salário</span><b class="num">${Math.round(a.minParte*100)}%</b></div>
            <div><span class="dim">Opção de compra a partir de</span><b class="num">${dinheiro(a.precoOpcao)}</b></div>
          </div>
          <div class="eyebrow" style="margin-top:10px">O que ele pensa</div>
          <p class="dim">${a.jogadorOk?'Topa ir: '+(a.rank>=5?'quer jogar, e no banco não joga.':'gosta do projeto.'):'Não quer ir emprestado para o '+esc(eu.nome)+'.'}</p>
        </div>
        <div class="neg-col">
          <label class="neg-campo"><span>Você paga do salário dele: <b id="eParteTxt">${Math.round(rasc.parte*100)}%</b> (${dinheiro(a.sal)}/mês)</span>
            <input type="range" id="eParte" min="50" max="100" step="5" value="${Math.round(rasc.parte*100)}"></label>
          <label class="neg-campo"><span><input type="checkbox" id="eOpc" ${rasc.opcao?'checked':''}> Com opção de compra no fim</span>
            <input type="number" id="eOpcV" value="${rasc.opcao||a.precoOpcao}" step="5000" ${rasc.opcao?'':'disabled'}></label>
          <div class="neg-numeros">
            <div><span class="dim">Taxa do empréstimo</span><b class="num">${dinheiro(a.taxa)}</b></div>
            <div><span class="dim">Situação</span><b>${a.erros.length?esc(a.erros[0]):a.clubeOk&&a.jogadorOk?'Tende a fechar':!a.clubeOk?'O clube quer mais':'O jogador resiste'}</b></div>
          </div>
          <div class="neg-bts"><button class="btn" id="eEnviar">Propor empréstimo</button>
            <button class="btn ghost" id="eVoltar">Voltar à mesa</button></div>
          <div id="eFeed"></div>
        </div>
      </div>
      ${_chat(n)}
    </div>`,true);
    $('#eParte').onchange=()=>{rasc.parte=(+$('#eParte').value)/100;desenha();};
    $('#eParte').oninput=()=>{$('#eParteTxt').textContent=$('#eParte').value+'%';};
    $('#eOpc').onchange=()=>{rasc.opcao=$('#eOpc').checked?(+$('#eOpcV').value||a.precoOpcao):0;desenha();};
    $('#eOpcV').onchange=()=>{if($('#eOpc').checked){rasc.opcao=+$('#eOpcV').value||0;desenha();}};
    $('#eVoltar').onclick=()=>mesa(p,n,null);
    $('#eEnviar').onclick=()=>{
      const r=proporEmprestimo(n,rasc);
      if(!r.ok)return $('#eFeed').innerHTML=`<div class="neg-aviso">${esc(r.erro)}</div>`;
      if(r.resposta==='aceita'){render();return mesa(p,n,null);}
      if(r.resposta==='encerrada'){render();return mesa(p,n,null);}
      desenha();
      $('#eFeed').innerHTML=`<div class="neg-aviso">${esc(r.erro||'')}</div>`;
    };
  };
  desenha();
}

/* ============================================================
   CENTRAL DE TRANSFERÊNCIAS
   ------------------------------------------------------------
   Tudo do mercado num lugar: a verba, o que está em andamento,
   o que está esperando resposta sua, o que o seu clube já fez na
   temporada e o que o mundo está fazendo.
   ============================================================ */
function vMercadoCentral(t){
  const o=orcamentoDe(t), trein=verbaVale();
  const disp=verbaDisponivel(t);
  const mov=movimentosDoClube(t,G.ano);
  const folha=folhaAnual(t)/12, teto=receitaLivre(t)*tetoFolhaDe(t)/12;
  const saldo=mov.receita-mov.gasto;
  const kpis=`<div class="grid g4" style="margin-bottom:14px">
    <div class="kpi ${trein?'teal':''}"><div class="lb">${trein?'Verba da diretoria':'Verba sugerida'}</div>
      <div class="vl">${money(disp)}</div><div class="sb">${trein?'de '+money(o.verba)+' liberados · metade das vendas volta':'no modo Diretoria o limite é o caixa ('+money(t.caixa)+')'}</div></div>
    <div class="kpi"><div class="lb">Gasto na temporada</div><div class="vl">${money(mov.gasto+0)}</div><div class="sb">${mov.entradas.length} chegada(s)</div></div>
    <div class="kpi"><div class="lb">Vendas na temporada</div><div class="vl">${money(mov.receita)}</div><div class="sb">${mov.saidas.length} saída(s) · saldo <b class="${saldo>=0?'up':'dn'}">${saldo>=0?'+':''}${money(saldo)}</b></div></div>
    <div class="kpi ${folha>teto?'red':''}"><div class="lb">Folha mensal</div><div class="vl">${money(folha)}</div><div class="sb">teto saudável ${money(teto)} · folga ${money(Math.max(0,teto-folha))}</div></div>
  </div>`;
  const pedidoChave=G.ano+'-'+(G.semana<=10?'ini':G.semana<=40?'meio':'fim');
  const jaPediu=o.pedidos&&o.pedidos[pedidoChave];
  const diretoria=trein?`<div class="card flat central-dir">
    <div><div class="eyebrow">Diretoria</div>
    <p class="dim" style="margin:4px 0 0">Confiança ${G.manager?G.manager.confianca:'—'}. Uma vez por janela você pode pedir mais verba: com confiança a partir de ${VERBA_PEDIDO_CONF} ela costuma liberar, mas cobra resultado.</p></div>
    <button class="btn ${jaPediu?'ghost':''}" data-verba ${!G.janela||jaPediu?'disabled':''}>${jaPediu?(jaPediu>0?'Liberou '+money(jaPediu):'Negou nesta janela'):'Pedir mais verba'}</button></div>`:'';

  /* em andamento */
  const ativas=negociacoes().filter(n=>n.destinoId===t.id&&['clube','jogador','troca'].includes(n.fase));
  const faseTxt=n=>n.tipo==='troca'?'Troca':n.tipo==='renovacao'?'Renovação':n.tipo==='precontrato'?'Pré-contrato':n.fase==='clube'?'Conversa com o clube':'Conversa com o jogador';
  const cxAtivas=`<div class="card flat"><div class="eyebrow">Em andamento</div>
    ${ativas.length?ativas.map(n=>{const p=P(n.jogadorId),c=n.origemId?T(n.origemId):null;
      return `<div class="prop-linha" style="grid-template-columns:30px 1fr 1fr auto">
        ${c?escudo(c,30):'<span></span>'}<div class="prop-clube"><b>${n.tipo==='troca'?'Troca com o '+esc(c.nome):esc(p?p.nome:'')}</b>
          <span class="dim">${n.tipo==='troca'?(n.recebe||[]).map(i=>P(i)?P(i).nome:'').join(', '):c?esc(c.nome):'sem clube'}</span></div>
        <div><span class="chip">${faseTxt(n)}</span></div>
        <div class="prop-bts"><button class="btn sm" data-abrirneg="${n.id}">Abrir</button></div></div>`;}).join('')
      :'<p class="dim">Nenhuma negociação aberta. Procure alvos na aba Jogadores ou pela ficha de qualquer jogador.</p>'}</div>`;

  /* esperando você */
  const props=(G.propostas||[]).filter(x=>{const p=P(x.jogadorId);return p&&p.timeId===t.id;});
  const multas=props.filter(x=>x.tipo==='multa').length;
  const pedidos=t.elenco.map(P).filter(p=>p&&p.pedidoSaida&&!p.pedidoSaida.aceito&&!p.pedidoSaida.negado).length;
  const vencendo=t.elenco.map(P).filter(p=>p&&p.contrato<=1&&!p.emprestimo).length;
  const alerta=(n,txt,aba,cls)=>n?`<button class="central-alerta ${cls||''}" data-merc="${aba}"><b>${n}</b><span>${txt}</span></button>`:'';
  const cxAlertas=`<div class="central-alertas">
    ${alerta(multas,multas>1?'multas pagas pelos seus jogadores':'multa paga por um jogador seu','saidas','r')}
    ${alerta(props.length-multas,'proposta(s) na mesa','saidas')}
    ${alerta(pedidos,'pedido(s) de saída','saidas','a')}
    ${alerta(vencendo,'contrato(s) no último ano','contratos')}
    ${!multas&&!props.length&&!pedidos&&!vencendo?'<span class="dim">Nada esperando resposta sua.</span>':''}</div>`;

  const linhaMov=(x,lado)=>{const c=T(lado==='in'?x.de:x.para);
    return `<tr><td><b class="jrow" data-p="${x.jogadorId}">${esc(x.nome)}</b> <span class="ov ${ovClass(x.over)}">${x.over}</span></td>
      <td class="dim">${lado==='in'?'do':'para o'} ${c?esc(c.nome):'mercado'}</td>
      <td><span class="chip ${x.tipo==='multa'?'r':x.tipo==='troca'?'g':x.tipo==='emprestimo'?'t':''}">${esc(x.tipo)}</span></td>
      <td class="r num">${x.taxa?money(x.taxa):'—'}</td></tr>`;};
  const cxMov=`<div class="card flat"><div class="eyebrow">Seu clube em ${G.ano}</div>
    ${mov.entradas.length||mov.saidas.length?`<table class="wide"><tbody>
      ${mov.entradas.length?'<tr><td colspan="4" class="eyebrow" style="padding-top:6px">Chegadas</td></tr>'+mov.entradas.map(x=>linhaMov(x,'in')).join(''):''}
      ${mov.saidas.length?'<tr><td colspan="4" class="eyebrow" style="padding-top:10px">Saídas</td></tr>'+mov.saidas.map(x=>linhaMov(x,'out')).join(''):''}
    </tbody></table>`:'<p class="dim">Nenhum movimento nesta temporada.</p>'}</div>`;

  const top=maioresTransferencias(G.ano,8);
  const cxTop=`<div class="card flat"><div class="eyebrow">Maiores negócios de ${G.ano}</div>
    ${top.length?`<table class="wide"><tbody>${top.map(x=>{const de=T(x.de),pa=T(x.para);return `<tr>
      <td><b class="jrow" data-p="${x.jogadorId}">${esc(x.nome)}</b> <span class="ov ${ovClass(x.over)}">${x.over}</span></td>
      <td class="dim">${de?esc(de.tag):'—'} → ${pa?esc(pa.tag):'—'}</td>
      <td>${x.tipo==='multa'?'<span class="chip r">multa</span>':''}</td>
      <td class="r num"><b>${money(x.taxa)}</b></td></tr>`;}).join('')}</tbody></table>`
      :'<p class="dim">Nenhuma transferência com taxa ainda nesta temporada.</p>'}</div>`;

  const crise=clubesEmCrise().filter(c=>c.id!==t.id);
  const cxCrise=crise.length?`<div class="card flat"><div class="eyebrow">Liquidação</div>
    <p class="dim" style="margin:2px 0 8px">Clubes em crise vendem com desconto e quase tudo está à venda.</p>
    <div class="central-crise">${crise.map(c=>{const melhor=c.elenco.map(P).filter(Boolean).sort((a,b)=>over(b)-over(a)).slice(0,3);
      return `<div class="central-crise-c">${escudo(c,32)}<div><b>${esc(c.nome)}</b><div class="dim">${esc(c.crise.motivo)}</div>
        <div style="margin-top:4px">${melhor.map(p=>`<span class="jrow chip" data-p="${p.id}">${esc(p.nome)} ${over(p)}</span>`).join(' ')}</div></div></div>`;}).join('')}</div></div>`:'';

  return `${kpis}${diretoria}${cxAlertas}${cxAtivas}<div class="grid g2">${cxMov}${cxTop}</div>${cxCrise}`;
}
