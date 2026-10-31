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
