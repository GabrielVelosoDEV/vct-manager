/* ============================================================
   TROCA — tela
   ------------------------------------------------------------
   No palco, as cartas de quem vai e de quem vem, com o dinheiro
   no meio. Embaixo, os dois elencos para escolher (até dois de
   cada lado), cada jogador com a reação dele à mudança. No pé,
   a balança do clube: o que ele recebe contra o que pede, e o
   controle do dinheiro, que vai para qualquer um dos lados.
   ============================================================ */
function modalTroca(clubeId,recebeId){
  const outro=T(clubeId);if(!outro)return;
  const r=abrirTroca(outro,recebeId?[recebeId]:[]);
  if(!r.ok)return avisar(r.erro,'Troca');
  if(recebeId&&!r.neg.recebe.includes(recebeId)&&r.neg.recebe.length<TROCA_MAX_LADO)r.neg.recebe.push(recebeId);
  telaTroca(r.neg);
}
function _reacaoChip(rc){
  if(!rc)return '';
  const cls=!rc.ok?'r':rc.sal>0&&rc.txt.startsWith('Só')?'':'t';
  return `<span class="chip ${cls}" title="${esc(rc.txt)}">${!rc.ok?'recusa':cls===''?'pede mais':'aceita'}</span>`;
}
function telaTroca(n){
  const eu=meu(), outro=T(n.origemId);
  const a=avaliarTroca(eu,outro,n);
  const aberta=n.fase==='troca';
  const cartas=(ids,vazio)=>ids.length?ids.map(i=>cartaJogador(P(i),{w:118})).join('')
    :`<div class="troca-vazio">${vazio}</div>`;
  const din=n.dinheiro||0;
  const maxDin=Math.max(100000,Math.round(Math.max(a.valorEntrega,a.valorRecebe)*1.2/5000)*5000);
  const linha=(p,lado)=>{
    const sel=(lado==='env'?n.envia:n.recebe).includes(p.id);
    const dest=lado==='env'?outro:eu;
    const rc=sel?a.reacoes[p.id]:reacaoNaTroca(p,dest);
    const v=lado==='env'?valorParaClube(outro,p):precoNaTroca(p);
    return `<button class="troca-linha ${sel?'on':''}" data-troca-${lado}="${p.id}" ${aberta?'':'disabled'}>
      <span class="ov ${ovClass(over(p))}">${over(p)}</span>
      <span class="troca-nome"><b>${esc(p.nome)}</b><span class="dim">${esc(p.role)} · ${p.idade}a · ${p.contrato}a de contrato</span></span>
      <span class="num dim" title="${lado==='env'?'Quanto vale para o '+esc(outro.nome):'Quanto o clube pede'}">${dinheiro(v)}</span>
      ${_reacaoChip(rc)}</button>`;
  };
  const meus=eu.elenco.map(P).filter(p=>p&&!p.emprestimo&&!p.preContrato).sort((x,y)=>over(y)-over(x));
  const deles=outro.elenco.map(P).filter(p=>p&&!p.emprestimo&&!p.preContrato).sort((x,y)=>over(y)-over(x));
  const pos=clamp(a.razao/1.3*100,0,100);
  const leg=a.erros.length?a.erros[0]:!a.folhaOk?'Os salários que chegam não cabem na folha deles'
    :a.razao<0.75?'Muito abaixo: vão pedir bem mais':a.lado<a.valorEntrega*0.96?'Abaixo do que eles pedem':a.lado<a.valorEntrega?'Perto: pode passar':'Equilibrada: tende a passar';
  const final=n.final;
  abrir(`<div class="neg troca">
    <div class="eyebrow">Troca</div><h2 class="sec">Troca com o ${esc(outro.nome)}</h2>
    <div class="troca-palco">
      <div class="troca-lado"><div class="linha-t">${escudo(eu,36)}<div><div class="eyebrow">Você envia</div><b>${esc(eu.nome)}</b></div></div>
        <div class="troca-cartas">${cartas(n.envia,'Escolha até dois do seu elenco')}</div></div>
      <div class="troca-meio"><div class="troca-icone">⇄</div>
        <div class="troca-din ${din>0?'paga':din<0?'recebe':''}">${din>0?'Você paga<br><b>'+dinheiro(din)+'</b>':din<0?'Você recebe<br><b>'+dinheiro(-din)+'</b>':'Sem dinheiro'}</div></div>
      <div class="troca-lado"><div class="linha-t">${escudo(outro,36)}<div><div class="eyebrow">Você recebe</div><b>${esc(outro.nome)}</b></div></div>
        <div class="troca-cartas">${cartas(n.recebe,'Escolha até dois do elenco deles')}</div></div>
    </div>
    ${final?`<div class="neg-col neg-fechada" style="text-align:center;margin-bottom:12px"><div class="neg-carimbo">Troca fechada</div></div>`:''}
    ${aberta?`<div class="neg-corpo">
      <div class="neg-col"><div class="eyebrow">Seu elenco</div>
        <p class="dim neg-nota" style="margin:2px 0 8px">O valor é quanto cada um vale PARA o ${esc(outro.nome)}: quem tapa o buraco deles vale mais.</p>
        ${meus.map(p=>linha(p,'env')).join('')}</div>
      <div class="neg-col"><div class="eyebrow">Elenco do ${esc(outro.nome)}</div>
        <p class="dim neg-nota" style="margin:2px 0 8px">O valor é o que o clube pede por cada um.</p>
        ${deles.map(p=>linha(p,'rec')).join('')}</div>
    </div>
    <div class="neg-col" style="margin-top:14px">
      <div class="split"><div class="eyebrow">A balança do ${esc(outro.nome)}</div>${_pac(n.pacClube,n.pacClubeMax)}</div>
      <div class="neg-numeros">
        <div><span class="dim">Eles recebem (jogadores + dinheiro)</span><b class="num">${dinheiro(a.lado)}</b></div>
        <div><span class="dim">Eles entregam (preço pedido)</span><b class="num">${dinheiro(a.valorEntrega)}</b></div>
      </div>
      <div class="neg-medidor"><div class="neg-escala">${_ZONAS_NEG.map(z=>`<span class="z-${z.c}" style="width:${z.w}%"></span>`).join('')}</div>
        <i style="left:${pos}%"></i></div>
      <div class="neg-leg"><b>${esc(leg)}</b></div>
      <label class="neg-campo"><span>Dinheiro na troca (à direita você paga, à esquerda você recebe)</span>
        <input type="range" id="tDinR" min="${-maxDin}" max="${maxDin}" step="5000" value="${din}">
        <input type="number" id="tDin" value="${din}" step="5000"></label>
      <div class="neg-bts">
        <button class="btn" id="tEnviar" ${a.envia.length&&a.recebe.length?'':'disabled'}>Propor troca</button>
        ${n.contra?`<button class="btn ghost" id="tContra">Aceitar contraproposta (${n.contra.dinheiro>=0?'você paga '+dinheiro(n.contra.dinheiro):'você recebe '+dinheiro(-n.contra.dinheiro)})</button>`:''}
      </div>
      <div id="tFeed"></div>
    </div>`:n.fase==='encerrada'?`<div class="neg-aviso">O ${esc(outro.nome)} encerrou a conversa de troca.</div>`:''}
    ${_chat(n)}
    <div class="neg-bts" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button></div>
  </div>`,true);
  const chat=$('#modal .neg-chat');if(chat)chat.scrollTop=chat.scrollHeight;
  if(!aberta)return;
  const lerDin=()=>parseFloat($('#tDin').value)||0;
  const alternar=(lista,id)=>{const i=lista.indexOf(id);if(i>=0)lista.splice(i,1);else if(lista.length<TROCA_MAX_LADO)lista.push(id);};
  $('#modal').querySelectorAll('[data-troca-env]').forEach(b=>b.onclick=()=>{n.dinheiro=lerDin();alternar(n.envia,b.dataset.trocaEnv);telaTroca(n);});
  $('#modal').querySelectorAll('[data-troca-rec]').forEach(b=>b.onclick=()=>{n.dinheiro=lerDin();alternar(n.recebe,b.dataset.trocaRec);telaTroca(n);});
  const par=()=>{const a1=$('#tDinR'),b1=$('#tDin');
    a1.oninput=()=>{b1.value=a1.value;};a1.onchange=()=>{n.dinheiro=lerDin();telaTroca(n);};
    b1.onchange=()=>{n.dinheiro=lerDin();telaTroca(n);};};
  par();
  $('#tEnviar').onclick=()=>{
    const r=proporTroca(n,{envia:n.envia,recebe:n.recebe,dinheiro:lerDin()});
    if(!r.ok){$('#tFeed').innerHTML=`<div class="neg-aviso">${esc(r.erro)}</div>`;return;}
    telaTroca(n);
  };
  const tc=$('#tContra');if(tc)tc.onclick=()=>{const r=aceitarContraTroca(n);
    if(!r.ok){$('#tFeed').innerHTML=`<div class="neg-aviso">${esc(r.erro)}</div>`;return;}telaTroca(n);};
}
