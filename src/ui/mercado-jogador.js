/* ============================================================
   MODO JOGADOR — Contrato e mercado, Finanças pessoais (J5)
   ============================================================ */

const _TIPO_PROP={renovacao:'Renovação',transferencia:'Transferência',livre:'Contrato',teste:'Convite para teste'};
const _MULTA_ROT={baixa:'Baixa',padrao:'Padrão',alta:'Alta'};
function _cartaoProposta(pr){
  const t=G.times[pr.clubeId], p=meuJogador();
  const resta=pr.validoAte-semAbs();
  const lin=(r,v)=>`<div><span class="dim">${r}</span><b>${v}</b></div>`;
  return `<div class="mj-prop ${pr.acordo?'acordo':''}">
    <div class="mj-prop-top">${escudo(t,40)}<div><div class="eyebrow">${_TIPO_PROP[pr.tipo]||pr.tipo}${pr.preContrato?' · pré-contrato':''}</div><b class="mj-clube">${esc(t.nome)}</b>
      <span class="dim">Tier ${t.tier} · ${esc(nomeLiga(t))}</span></div></div>
    ${pr.tipo==='teste'?`<p>Uma semana de teste: um duelo contra o nível do elenco deles (over ${overMedioTime(t)}). Passou, chega a proposta de contrato.</p>`
    :`<div class="mj-num">${lin('Salário',moneyJ(pr.salario)+'/mês')}${lin('Contrato',pr.anos+' ano'+(pr.anos>1?'s':''))}${lin('Multa',_MULTA_ROT[pr.multa]||'Padrão')}
      ${pr.titular?lin('Cláusula','titular'):''}${pr.bonusTitulo?lin('Bônus por título',moneyJ(pr.bonusTitulo)):''}${pr.taxa?lin('Taxa ao seu clube',moneyJ(pr.taxa)):''}</div>
      ${p.timeId&&pr.tipo!=='renovacao'?`<p class="dim">Hoje: ${moneyJ(p.salario)}/mês no ${esc(G.times[p.timeId].nome)}.</p>`:''}`}
    <div class="mj-prop-b">
      ${pr.tipo==='teste'?`<button class="btn sm" data-mjteste="${pr.id}">Jogar o teste</button><button class="btn ghost sm" data-mjtestesim="${pr.id}">Simular</button>`
      :`<button class="btn sm" data-mjaceitar="${pr.id}">${pr.acordo?'Assinar':'Aceitar'}</button><button class="btn ghost sm" data-mjneg="${pr.id}">Negociar</button>`}
      <button class="btn ghost sm" data-mjrecusar="${pr.id}">Recusar</button>
      <span class="dim">${pr.acordo?'acordo fechado · ':''}${pr.tipo!=='teste'?`paciência ${pr.paciencia} · `:''}vale mais ${resta} semana${resta===1?'':'s'}</span></div></div>`;
}
function vJContrato(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const t=clubeDoJogador(), props=propostasJogador(), e=G.voce.empresario;
  const cl=p.clausulas||{};
  const pediu=p.pedidoSaida&&!p.pedidoSaida.negado;
  const lin=(r,v)=>`<div><span class="dim">${r}</span><b>${v}</b></div>`;
  const cand=e?[]:candidatosEmpresario();
  return `<div class="grid g2 cx-linha">
    <div class="card"><div class="eyebrow">Seu contrato</div>
      ${t?`<div class="mj-prop-top">${escudo(t,44)}<div><b class="mj-clube">${esc(t.nome)}</b><span class="dim">Tier ${t.tier} · ${esc(nomeLiga(t))}</span></div></div>
        <div class="mj-num">${lin('Salário',moneyJ(p.salario)+'/mês')}${lin('Restam',p.contrato+' ano'+(p.contrato===1?'':'s'))}${lin('Multa',moneyJ(multaDe(p)))}
          ${lin('Cláusulas',[cl.titular?'titular':'',cl.bonusTitulo?'bônus por título '+moneyJ(cl.bonusTitulo):''].filter(Boolean).join(' · ')||'nenhuma')}</div>
        ${p.preContrato?`<p><b>Pré-contrato assinado</b> com o ${esc((G.times[p.preContrato.clubeId]||{}).nome||'')}: você se apresenta na virada.</p>`:''}
        ${p.contrato<=1?`<p class="dim">Último ano. ${props.some(x=>x.tipo==='renovacao')?'Tem renovação na mesa.':'A renovação, se vier, chega a partir da semana 18.'} Sem renovar, você sai livre na virada.</p>`:''}
        ${cl.titular?`<p class="dim">Com a cláusula de titular, ${BANCO_LIBERA_CLAUSULA} semanas seguidas no banco liberam a saída sem multa (hoje: ${G.voce.semBanco||0}).</p>`:''}
        <div class="rl-ops">${pediu?'<button class="btn ghost sm" data-mjsaida="cancelar">Retirar o pedido de saída</button>':'<button class="btn ghost sm" data-mjsaida="pedir" title="Mais propostas e o clube vende mais fácil. O técnico não gosta.">Pedir para ser negociado</button>'}
          <button class="btn ghost sm" data-mjsaida="forcar" title="Se você está no banco ou na geladeira, o clube rescinde. Titular, não: e o técnico fecha a cara.">Forçar a saída</button></div>
        ${pediu?'<p class="dim">Você pediu para sair: o clube sabe e vende mais fácil.</p>':''}`
      :`<p><b>Sem clube.</b> Ranked, olheiros e convites para teste. A ranked e a fama sobem o seu radar (hoje ${Math.round(G.voce.radar||0)}).</p>`}
      <label class="sj-auto" style="text-align:left;max-width:none;margin-top:10px"><input type="checkbox" id="mjAuto" ${G.voce.autoContrato!==false?'checked':''}> Assistente de contrato: aceita a renovação do meu clube e, se eu estiver livre, a melhor proposta, quando eu não decidir</label>
    </div>
    <div class="card"><div class="eyebrow">Empresário</div>
      ${e?`<p><b>${esc(e.nome)}</b> · ${esc(EMPRESARIO_NIVEIS[e.nivel].nome)} · ${Math.round(e.comissao*100)}% do salário</p>
        <p class="dim">Traz mais propostas e negocia um teto mais alto (+${e.nivel*4}% no que o clube aceita pagar).</p>
        <button class="btn ghost sm" data-mjemp="demitir">Dispensar</button>`
      :`<p class="dim">Sem empresário as propostas chegam mais devagar e o teto é o do clube. Ele cobra luvas para assinar e uma comissão do salário.</p>
        <div class="mj-emps">${cand.map(c=>`<div class="mj-emp ${c.aceita?'':'off'}"><b>${esc(c.nome)}</b><span>${esc(c.rot)} · ${Math.round(c.comissao*100)}% · luvas ${moneyJ(c.luvas)}</span>
          ${c.aceita?`<button class="btn sm" data-mjemp="${c.nivel}">Contratar</button>`:`<span class="dim">só com over ${c.minOver}</span>`}</div>`).join('')}</div>`}
    </div></div>
  <div class="card"><div class="eyebrow">Propostas</div>
    ${props.length?`<div class="mj-props">${props.map(_cartaoProposta).join('')}</div>`
      :vazio(t?'<b>Nenhuma proposta agora.</b> Elas chegam na janela, no último ano de contrato ou quando você pede para ser negociado. Empresário e fama aceleram.':'<b>Nenhuma proposta agora.</b> Jogue ranked, faça lives e treine: os olheiros olham o over e o radar.','troca')}
  </div>`;
}
function modalNegociar(id){
  const pr=propostasJogador().find(x=>x.id===id);if(!pr)return;
  const t=G.times[pr.clubeId];
  pintarModal(`<div class="ovl"><div class="box mj-neg"><div class="eyebrow">Negociar · ${esc(t.nome)}</div>
    <h2>${_TIPO_PROP[pr.tipo]}</h2>
    <div class="mj-form">
      <label>Salário por mês<input type="number" id="mjSal" value="${pr.salario}" step="100" min="100"></label>
      <label>Anos<select id="mjAnos">${[1,2,3,4].map(a=>`<option ${a===pr.anos?'selected':''}>${a}</option>`).join('')}</select></label>
      <label>Multa<select id="mjMulta">${Object.entries(_MULTA_ROT).map(([k,v])=>`<option value="${k}" ${k===pr.multa?'selected':''}>${v}</option>`).join('')}</select></label>
      <label>Bônus por título<input type="number" id="mjBonus" value="${pr.bonusTitulo||0}" step="500" min="0"></label>
      <label class="mj-chk"><input type="checkbox" id="mjTit" ${pr.titular?'checked':''}> Cláusula de titular</label>
    </div>
    <p class="dim">Multa baixa facilita a sua saída, e o clube cobra por isso; multa alta prende você, e o clube gosta. A cláusula de titular só sai para quem já ganhou a vaga. Bônus por título até dois salários. O clube tem ${pr.paciencia} rodada${pr.paciencia>1?'s':''} de paciência.</p>
    <p id="mjResp" class="mj-resp"></p>
    <div class="dj-acoes"><button class="btn ghost" id="mjFechar">Fechar</button><button class="btn" id="mjEnviar">Enviar o pedido</button></div></div></div>`);
  $('#mjFechar').onclick=()=>{$('#modal').innerHTML='';render();};
  $('#mjEnviar').onclick=()=>{
    const r=negociarProposta(id,{salario:+$('#mjSal').value,anos:+$('#mjAnos').value,multa:$('#mjMulta').value,bonusTitulo:+$('#mjBonus').value,titular:$('#mjTit').checked});
    const resp=$('#mjResp');resp.textContent=r.ok?r.msg:r.motivo;resp.className='mj-resp '+(r.fim==='acordo'?'up':r.fim==='retirada'?'dn':'');
    if(r.fim==='acordo'||r.fim==='retirada'){
      $('#mjEnviar').textContent=r.fim==='acordo'?'Assinar':'Ok';
      $('#mjEnviar').onclick=()=>{if(r.fim==='acordo'){const a=aceitarProposta(id);flash(a.ok?a.msg:a.motivo);}$('#modal').innerHTML='';render();if(typeof pintarSide==='function')pintarSide();if(typeof pintarTop==='function')pintarTop();};
    }else if(r.fim==='contra'){const pr2=propostasJogador().find(x=>x.id===id);if(pr2)$('#mjSal').value=pr2.salario;}
  };
}
function jogarTeste(id){
  const pr=propostasJogador().find(x=>x.id===id);if(!pr)return;
  if(typeof GP==='undefined'||!GP.treinarNoManager){const r=simularTeste(id);flash(r.ok?r.msg:r.motivo);render();return;}
  const p=meuJogador(), t=G.times[pr.clubeId];
  const at=Object.assign({},p.at);bonusDoJogadorNaPartida(p,at,null);
  GP.treinarNoManager({modo:'duelo',mapa:mapaDoTreino(),nome:p.nome,euMid:p.id,funcao:p.role,over:over(p),atrib:at,
    agente:GP.idAgente((p.agentes||[])[0])||null,rival:{over:overMedioTime(t)||72,funcao:p.role}})
  .then(r=>{
    const nota=notaDoTreino('duelo',r), ok=nota>=0.75&&!r.desistiu;
    const res=resolverTeste(id,ok);
    pintarModal(`<div class="ovl"><div class="box sj-res"><div class="eyebrow">Teste · ${esc(t.nome)}</div><h2>${r.eu}–${r.eles} no duelo</h2>
      <p class="${ok?'up':'dn'}">${esc(res.msg||'')}</p><div class="dj-acoes"><button class="btn" id="mjOk">Ok</button></div></div></div>`);
    $('#mjOk').onclick=()=>{$('#modal').innerHTML='';render();};
  }).catch(e=>{console.error(e);flash('O teste não abriu.');});
}

/* ---------- Finanças pessoais ---------- */
function vJFinancas(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const cx=caixaJogador(), renda=rendaMensal(), gasto=gastoMensal(), s=setupJogador(), st=staffPessoal(), ev=estiloVida();
  const ext=(G.voce.extrato||[]).slice(0,16);
  const num=(r,v,cls)=>`<div><b class="num ${cls||''}">${v}</b><span>${r}</span></div>`;
  return `<section class="card sj-topo"><div class="eyebrow">Finanças pessoais</div>
      <div class="jg-st mj-fin">${num('patrimônio',moneyJ(cx),cx<0?'dn':'')}${num('salário por mês',moneyJ(renda))}${num('gastos por mês',moneyJ(gasto))}${num('sobra por mês',moneyJ(renda-gasto),renda-gasto<0?'dn':'up')}${num('patrocínios por mês',moneyJ(typeof patrociniosMensais==='function'?patrociniosMensais():0))}</div>
      <p class="dim">Entram salário, a sua parte dos prêmios do clube (titular leva o dobro de quem está no banco), bônus por título e lives. Saem comissão do empresário, staff pessoal, estilo de vida e o setup. No vermelho, o staff vai embora e o padrão de vida desce.</p></section>
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Setup</div>
        ${SETUP_ITENS.map(it=>{const n=s[it.id]||0, prox=it.niveis[n];
          return `<div class="mj-item"><div><b>${esc(it.nome)}</b> <span class="dim">${n?esc(it.niveis[n-1].txt):'o básico'}</span><p class="dim">${esc(it.desc)} Nível ${n}/${it.niveis.length}.</p></div>
            ${prox?`<button class="btn sm" data-mjsetup="${it.id}">${esc(prox.txt)} · ${moneyJ(prox.preco)}</button>`:'<span class="chip up">no topo</span>'}</div>`;}).join('')}
      </div>
      <div class="card"><div class="eyebrow">Staff pessoal</div>
        ${STAFF_PESSOAL.map(it=>`<div class="mj-item"><div><b>${esc(it.nome)}</b> <span class="dim">${moneyJ(it.mes)}/mês</span><p class="dim">${esc(it.desc)}</p></div>
          <button class="btn ${st[it.id]?'ghost':''} sm" data-mjstaff="${it.id}">${st[it.id]?'Dispensar':'Contratar'}</button></div>`).join('')}
        <div class="eyebrow" style="margin-top:14px">Estilo de vida</div>
        <div class="dj-modos">${ESTILOS_VIDA.map(e=>`<button class="nj-papel ${ev.id===e.id?'on':''}" data-mjvida="${e.id}"><b>${esc(e.nome)}</b><span>${esc(e.desc)}</span><i>${moneyJ(e.mes)}/mês</i></button>`).join('')}</div>
      </div></div>
    <div class="card"><div class="eyebrow">Extrato</div>
      ${ext.length?`<table class="tbl"><tbody>${ext.map(x=>`<tr><td class="dim">${x.ano} · sem ${x.semana}</td><td>${esc(x.txt)}</td><td class="num ${x.valor<0?'dn':'up'}">${x.valor>0?'+':''}${moneyJ(x.valor)}</td></tr>`).join('')}</tbody></table>`
        :vazio('<b>Nada ainda.</b> A primeira semana fecha com o salário.','dinheiro')}</div>`;
}

function ligarMercadoJogador(v,on){
  const depois=r=>{flash(r.ok?(r.msg||'Feito.'):r.motivo);render();if(typeof pintarSide==='function')pintarSide();if(typeof pintarTop==='function')pintarTop();};
  on('[data-mjaceitar]',el=>depois(aceitarProposta(el.dataset.mjaceitar)));
  on('[data-mjrecusar]',el=>depois(recusarProposta(el.dataset.mjrecusar)));
  on('[data-mjneg]',el=>modalNegociar(el.dataset.mjneg));
  on('[data-mjteste]',el=>jogarTeste(el.dataset.mjteste));
  on('[data-mjtestesim]',el=>depois(simularTeste(el.dataset.mjtestesim)));
  on('[data-mjemp]',el=>depois(el.dataset.mjemp==='demitir'?demitirEmpresario():contratarEmpresario(el.dataset.mjemp)));
  on('[data-mjsaida]',el=>{const a=el.dataset.mjsaida;depois(a==='pedir'?pedirParaSerNegociado():a==='cancelar'?cancelarPedidoSaida():forcarSaida());});
  on('[data-mjsetup]',el=>depois(comprarSetup(el.dataset.mjsetup)));
  on('[data-mjstaff]',el=>depois(alternarStaffPessoal(el.dataset.mjstaff)));
  on('[data-mjvida]',el=>{definirEstiloVida(el.dataset.mjvida);render();});
  const au=v.querySelector('#mjAuto');if(au)au.onchange=()=>{G.voce.autoContrato=au.checked;};
}
