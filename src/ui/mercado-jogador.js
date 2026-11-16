/* ============================================================
   MODO JOGADOR — Contrato e mercado, Finanças pessoais (J5)
   ============================================================ */

const _TIPO_PROP={renovacao:'Renovação',transferencia:'Transferência',livre:'Contrato',teste:'Convite para teste'};
const _MULTA_ROT={baixa:'Baixa',padrao:'Padrão',alta:'Alta'};
function _cartaoProposta(pr){
  const t=G.times[pr.clubeId], p=meuJogador();
  const resta=pr.validoAte-semAbs();
  const lin=(r,v)=>`<div><span class="dim">${r}</span><b>${v}</b></div>`;
  return `<div class="mj-prop jx-prop ${pr.acordo?'acordo':''}" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    <div class="mj-prop-top">${escudo(t,56)}<div><div class="eyebrow">${_TIPO_PROP[pr.tipo]||pr.tipo}${pr.preContrato?' · pré-contrato':''}</div><b class="mj-clube">${esc(t.nome)}</b>
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
function _nivelEmp(n){n=+n||1;return `<span class="emj-st" title="nível ${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;}
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
      ${t?`<div class="ctj" style="--clube:${corDoClube(t)}">
          <div class="ctj-top">${escudo(t,52)}<div><b class="mj-clube">${esc(t.nome)}</b><span class="dim">Tier ${t.tier} · ${esc(nomeLiga(t))}</span></div>
            <span class="ctj-sel">${icone('contrato')} contrato</span></div>
          <div class="ctj-anos">${Array.from({length:Math.max(1,Math.min(4,p.contrato))},(_,i)=>`<i class="${i===0?'agora':''} ${p.contrato<=1?'fim':''}"><b>${G.ano+i}</b></i>`).join('')}<span>${p.contrato} ano${p.contrato===1?'':'s'} restando</span></div>
          <div class="ctj-nums">
            <div><span>${icone('dinheiro')} Salário</span><b class="num">${moneyJ(p.salario)}</b><em>por mês</em></div>
            <div><span>${icone('cadeado')} Multa</span><b class="num">${moneyJ(multaDe(p))}</b><em>para sair antes</em></div>
          </div>
          <div class="ctj-cl">${cl.titular?`<span class="chip t">${icone('estrela')} cláusula de titular</span>`:''}${cl.bonusTitulo?`<span class="chip t">${icone('trofeu')} bônus por título ${moneyJ(cl.bonusTitulo)}</span>`:''}${!cl.titular&&!cl.bonusTitulo?'<span class="dim">sem cláusulas especiais</span>':''}</div>
        </div>
        ${p.preContrato?`<p><b>Pré-contrato assinado</b> com o ${esc((G.times[p.preContrato.clubeId]||{}).nome||'')}: você se apresenta na virada.</p>`:''}
        ${p.contrato<=1?`<p class="dim">Último ano. ${props.some(x=>x.tipo==='renovacao')?'Tem renovação na mesa.':'A renovação, se vier, chega a partir da semana 18.'} Sem renovar, você sai livre na virada.</p>`:''}
        ${cl.titular?`<p class="dim">Com a cláusula de titular, ${BANCO_LIBERA_CLAUSULA} semanas seguidas no banco liberam a saída sem multa (hoje: ${G.voce.semBanco||0}).</p>`:''}
        <div class="rl-ops">${pediu?'<button class="btn ghost sm" data-mjsaida="cancelar">Retirar o pedido de saída</button>':'<button class="btn ghost sm" data-mjsaida="pedir" title="Mais propostas e o clube vende mais fácil. O técnico não gosta.">Pedir para ser negociado</button>'}
          <button class="btn ghost sm" data-mjsaida="forcar" title="Se você está no banco ou na geladeira, o clube rescinde. Titular, não: e o técnico fecha a cara.">Forçar a saída</button></div>
        ${pediu?'<p class="dim">Você pediu para sair: o clube sabe e vende mais fácil.</p>':''}`
      :`<p><b>Sem clube.</b> Ranked, olheiros e convites para teste. A ranked e a fama sobem o seu radar (hoje ${Math.round(G.voce.radar||0)}).</p>`}
      <label class="sj-auto" style="text-align:left;max-width:none;margin-top:10px"><input type="checkbox" id="mjAuto" ${G.voce.autoContrato===true?'checked':''}> Assistente de contrato (desligado = só você decide): aceita a renovação do meu clube; livre, faz os testes e fica com a melhor proposta; e, depois de 8 semanas no banco, aceita uma saída para jogar</label>
    </div>
    <div class="card"><div class="eyebrow">Empresário</div>
      ${e?`<div class="emj on"><span class="emj-ic">${icone('maleta')}</span><div><b>${esc(e.nome)}</b>${_nivelEmp(e.nivel)}
          <em>${esc(EMPRESARIO_NIVEIS[e.nivel].nome)} · ${Math.round(e.comissao*100)}% do salário</em></div></div>
        <p class="dim">Traz mais propostas e negocia um teto mais alto (+${e.nivel*4}% no que o clube aceita pagar).</p>
        <button class="btn ghost sm" data-mjemp="demitir">Dispensar</button>`
      :`<p class="dim">Sem empresário as propostas chegam mais devagar e o teto é o do clube. Ele cobra luvas para assinar e uma comissão do salário.</p>
        <div class="emj-l">${cand.map(c=>`<div class="emj ${c.aceita?'':'off'}"><span class="emj-ic">${icone(c.aceita?'maleta':'cadeado')}</span>
          <div><b>${esc(c.nome)}</b>${_nivelEmp(c.nivel)}<em>${esc(c.rot)} · ${Math.round(c.comissao*100)}% · luvas ${moneyJ(c.luvas)}</em></div>
          ${c.aceita?`<button class="btn sm" data-mjemp="${c.nivel}">Contratar</button>`:`<span class="emj-lock">over ${c.minOver}</span>`}</div>`).join('')}</div>`}
    </div></div>
  <div class="card"><div class="eyebrow">Propostas</div>
    ${props.length?`<div class="mj-props">${props.map(_cartaoProposta).join('')}</div>`
      :vazio(t?'<b>Nenhuma proposta agora.</b> Elas chegam na janela, no último ano de contrato ou quando você pede para ser negociado. Empresário e fama aceleram.':'<b>Nenhuma proposta agora.</b> Jogue ranked, faça lives e treine: os olheiros olham o over e o radar.','troca')}
  </div>`;
}
/* A mesa de negociação do treinador, vista do outro lado: a sala com a placa
   do clube que quer você, de onde você sai e para onde vai, o que eles
   oferecem e o que você pede, a paciência deles e a conversa. Com empresário,
   ele lê a mesa e diz até onde dá para puxar. */
let _mjChat={}, _mjPed={};
function modalNegociar(id){
  const pr=propostasJogador().find(x=>x.id===id);if(!pr)return;
  const p=meuJogador(), t=G.times[pr.clubeId], origem=p.timeId&&pr.tipo!=='renovacao'?G.times[p.timeId]:null;
  const emp=G.voce.empresario, chat=_mjChat[id]=_mjChat[id]||[{de:'clube',txt:`${moneyJ(pr.salario)}/mês por ${pr.anos} ano${pr.anos>1?'s':''}${pr.taxa?` (e ${moneyJ(pr.taxa)} ao seu clube)`:''}. É a nossa proposta.`}];
  const cena=typeof cenaFoto==='function'?cenaFoto('cenas','sala-negociacao',t,{cls:'neg-fundo',foco:95,ansioso:true}):'';
  const lado=(time,rot,extra)=>`<div class="neg-lado">${time?escudo(time,64):'<div class="neg-semclube">SEM<br>CLUBE</div>'}
    <div class="eyebrow">${rot}</div><b>${time?esc(time.nome):'Agente livre'}</b>${extra||''}</div>`;
  /* o seu último pedido continua no formulário (a recusa não apaga o que você digitou) */
  const v=Object.assign({salario:pr.salario,anos:pr.anos,multa:pr.multa,bonusTitulo:pr.bonusTitulo||0,titular:!!pr.titular},pr.acordo?{}:(_mjPed[id]||{}));
  const pac=Array.from({length:PACIENCIA_CLUBE},(_,i)=>`<i class="${i<pr.paciencia?'on':''}"></i>`).join('');
  pintarModal(`<div class="ovl"><div class="box jx-neg">
    <div class="neg-palco">${cena}
      ${pr.tipo==='renovacao'?lado(t,'Renovar com',`<div class="dim neg-sub">hoje ${moneyJ(p.salario)}/mês</div>`):lado(origem,origem?'Você sai de':'Você está',origem?`<div class="dim neg-sub">contrato até ${p.contrato} ano${p.contrato>1?'s':''}</div>`:'<div class="dim neg-sub">sem taxa</div>')}
      <div class="neg-centro">${cartaJogador(p,{w:140})}<div class="neg-perfil">${emp?`Empresário: <b>${esc(emp.nome)}</b>`:'Sem empresário'}</div></div>
      <div class="neg-seta ${pr.acordo?'ok':''}"><span></span></div>
      ${pr.tipo==='renovacao'?`<div class="neg-lado"><div class="eyebrow">Tipo</div><b>${_TIPO_PROP[pr.tipo]}</b></div>`:lado(t,'Proposta de',`<div class="dim neg-sub">${esc(nomeLiga(t))}</div>`)}
    </div>
    <div class="jx-neg-corpo">
      <div class="jx-neg-form">
        <div class="eyebrow">Seu pedido · ${_TIPO_PROP[pr.tipo]}</div>
        <div class="jx-neg-linhas">
          <label><span>Salário por mês</span><input type="number" id="mjSal" value="${v.salario}" step="100" min="100"><i class="dim">oferta ${moneyJ(pr.salario)}</i></label>
          <label><span>Anos</span><select id="mjAnos">${[1,2,3,4].map(a=>`<option ${a===v.anos?'selected':''}>${a}</option>`).join('')}</select><i class="dim">oferta ${pr.anos}</i></label>
          <label><span>Multa rescisória</span><select id="mjMulta">${Object.entries(_MULTA_ROT).map(([k,r])=>`<option value="${k}" ${k===v.multa?'selected':''}>${r}</option>`).join('')}</select><i class="dim">baixa facilita sair</i></label>
          <label><span>Bônus por título</span><input type="number" id="mjBonus" value="${v.bonusTitulo||0}" step="500" min="0"><i class="dim">até 2 salários</i></label>
          <label class="mj-chk"><input type="checkbox" id="mjTit" ${v.titular?'checked':''}> <span>Cláusula de titular</span><i class="dim">só para quem já ganhou a vaga</i></label>
        </div>
      </div>
      <div class="jx-neg-lado">
        <div class="jx-neg-pac"><span>Paciência do clube</span><div>${pac}</div></div>
        ${emp?`<div class="jx-neg-term"><span>O que ${esc(emp.nome.split(' ')[0])} lê na mesa</span><div class="jx-neg-barra"><i class="ok"></i><i class="meio"></i><i class="alto"></i><b id="mjMarca"></b></div><em id="mjLeitura" class="dim"></em></div>`
          :`<div class="jx-neg-term vazio"><span>Sem empresário você negocia no escuro.</span><em class="dim">Com um, ele mostra até onde dá para puxar (Contrato e mercado).</em></div>`}
        <div class="neg-chat" id="mjChat">${chat.map(h=>`<div class="neg-msg m-${h.de}">${h.de==='voce'?'<span class="neg-quem">Você</span>':`<span class="neg-quem">${esc(t.tag)}</span>`}${esc(h.txt)}</div>`).join('')}</div>
      </div>
    </div>
    <p id="mjResp" class="mj-resp"></p>
    <div class="dj-acoes"><button class="btn ghost" id="mjFechar">Fechar</button><button class="btn" id="mjEnviar">${pr.acordo?'Assinar':'Enviar o pedido'}</button></div></div></div>`);
  const ped=()=>({salario:+$('#mjSal').value,anos:+$('#mjAnos').value,multa:$('#mjMulta').value,bonusTitulo:+$('#mjBonus').value,titular:$('#mjTit').checked});
  const ler=()=>{
    const mk=$('#mjMarca');if(!mk||typeof tetoDoClube!=='function')return;
    /* o empresário lê com a margem do nível dele: o bom erra pouco */
    const r=_custoPedido(pr,ped())/Math.max(1,tetoDoClube(pr)), erro=(5-Math.min(5,emp.nivel||1))*0.03;
    const pos=clamp((r-0.75)/0.6,0,1);
    mk.style.left=(pos*100).toFixed(1)+'%';
    $('#mjLeitura').textContent=r<=1-erro?'Eles devem topar.':r<=1.15?'No limite: vem contraproposta.':'Alto demais: pode irritar.';
  };
  document.querySelectorAll('#mjSal,#mjAnos,#mjMulta,#mjBonus,#mjTit').forEach(el=>{el.oninput=ler;el.onchange=ler;});ler();
  const ch=$('#mjChat');if(ch)ch.scrollTop=ch.scrollHeight;
  $('#mjFechar').onclick=()=>{$('#modal').innerHTML='';render();};
  const assinar=()=>{const a=aceitarPropostaJogador(id);flash(a.ok?a.msg:a.motivo);delete _mjChat[id];$('#modal').innerHTML='';render();if(typeof pintarSide==='function')pintarSide();if(typeof pintarTop==='function')pintarTop();};
  $('#mjEnviar').onclick=()=>{
    if(pr.acordo){assinar();return;}
    const q=ped();_mjPed[id]=q;
    chat.push({de:'voce',txt:`Peço ${moneyJ(q.salario)}/mês por ${q.anos} ano${q.anos>1?'s':''}, multa ${String(_MULTA_ROT[q.multa]||q.multa).toLowerCase()}${q.bonusTitulo?`, ${moneyJ(q.bonusTitulo)} por título`:''}${q.titular?' e cláusula de titular':''}.`});
    const r=negociarProposta(id,q);
    chat.push({de:'clube',txt:r.ok?r.msg:r.motivo});
    if(r.fim==='retirada'){delete _mjChat[id];pintarModal(`<div class="ovl"><div class="box sj-res"><div class="eyebrow">Negociação · ${esc(t.nome)}</div><h2 class="dn">${esc(r.msg)}</h2><div class="dj-acoes"><button class="btn" id="mjOk">Ok</button></div></div></div>`);$('#mjOk').onclick=()=>{$('#modal').innerHTML='';render();};return;}
    modalNegociar(id);
    if(r.fim==='acordo'){const resp=$('#mjResp');if(resp){resp.textContent='Acordo fechado. É só assinar.';resp.className='mj-resp up';}}
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
  /* o patrimônio semana a semana, de trás para frente pelo extrato */
  const todos=(G.voce.extrato||[]).slice(0,40);let saldo=cx;const serie=[cx];
  for(const x of todos){saldo-=x.valor;serie.push(saldo);}serie.reverse();
  const W=520,H=120,mn=Math.min(0,...serie),mx=Math.max(1,...serie);
  const X=i=>(i/Math.max(1,serie.length-1)*W).toFixed(1),Y=v=>(H-6-(v-mn)/(mx-mn||1)*(H-16)).toFixed(1);
  const linha=serie.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  const graf=serie.length>1?`<svg class="jx-graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="jxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18E5B4" stop-opacity=".35"/><stop offset="1" stop-color="#18E5B4" stop-opacity="0"/></linearGradient></defs>
    <polygon points="0,${H} ${linha} ${W},${H}" fill="url(#jxg)"/><polyline points="${linha}" fill="none" stroke="#18E5B4" stroke-width="2"/>${mn<0?`<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="rgba(255,70,85,.5)" stroke-dasharray="4 4"/>`:''}</svg>`:'';
  const FOTO_STAFF={personal:'academia',psicologo:'mente',fisio:'saude'};
  const fotoP=k=>typeof cenaFoto==='function'?cenaFoto('estrutura',k,clubeDoJogador(),{foco:40}):'';
  return `<section class="card sj-topo jx-fin"><div class="split"><div class="eyebrow">Finanças pessoais</div><span class="dim">patrimônio nas últimas ${Math.max(0,serie.length-1)} semanas</span></div>
      ${graf}
      <div class="jg-st mj-fin">${num('patrimônio',moneyJ(cx),cx<0?'dn':'')}${num('salário por mês',moneyJ(renda))}${num('gastos por mês',moneyJ(gasto))}${num('sobra por mês',moneyJ(renda-gasto),renda-gasto<0?'dn':'up')}${num('patrocínios por mês',moneyJ(typeof patrociniosMensais==='function'?patrociniosMensais():0))}</div>
      <p class="dim">Entram salário, a sua parte dos prêmios do clube (titular leva o dobro de quem está no banco), bônus por título e lives. Saem comissão do empresário, staff pessoal, estilo de vida e o setup. No vermelho, o staff vai embora e o padrão de vida desce.</p></section>
    <div class="grid g2 cx-linha">
      <div class="card jx-setup"><span class="jx-setup-f com-cena">${fotoP('equip')}</span><div class="eyebrow">Setup</div>
        ${SETUP_ITENS.map(it=>{const n=s[it.id]||0, prox=it.niveis[n];
          return `<div class="mj-item"><div><b>${esc(it.nome)}</b> <span class="dim">${n?esc(it.niveis[n-1].txt):'o básico'}</span><p class="dim">${esc(it.desc)}</p>
            <span class="jx-pips">${it.niveis.map((_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}<em>nível ${n}/${it.niveis.length}</em></span></div>
            ${prox?`<button class="btn sm" data-mjsetup="${it.id}">${esc(prox.txt)} · ${moneyJ(prox.preco)}</button>`:'<span class="chip up">no topo</span>'}</div>`;}).join('')}
      </div>
      <div class="card"><div class="eyebrow">Staff pessoal</div>
        ${STAFF_PESSOAL.map(it=>`<div class="mj-item jx-staff ${st[it.id]?'on':''}"><span class="jx-staff-f com-cena">${fotoP(FOTO_STAFF[it.id])}</span><div><b>${esc(it.nome)}</b> <span class="dim">${moneyJ(it.mes)}/mês</span><p class="dim">${esc(it.desc)}</p></div>
          <button class="btn ${st[it.id]?'ghost':''} sm" data-mjstaff="${it.id}">${st[it.id]?'Dispensar':'Contratar'}</button></div>`).join('')}
        <div class="eyebrow" style="margin-top:14px">Estilo de vida</div>
        <div class="dj-modos">${ESTILOS_VIDA.map(e=>`<button class="nj-papel ${ev.id===e.id?'on':''}" data-mjvida="${e.id}"><b>${esc(e.nome)}</b><span>${esc(e.desc)}</span><i>${moneyJ(e.mes)}/mês</i></button>`).join('')}</div>
      </div></div>
    <div class="card"><div class="eyebrow">Extrato</div>
      ${ext.length?(()=>{const mxv=Math.max(1,...ext.map(x=>Math.abs(x.valor)));
        return `<div class="jxe">${ext.map(x=>`<div class="jxe-l"><span class="jxe-d">${x.ano}<b>S${x.semana}</b></span><span class="jxe-t">${esc(x.txt)}</span>
          <span class="jxe-b"><i class="${x.valor<0?'n':'p'}" style="width:${Math.round(Math.abs(x.valor)/mxv*50)}%"></i></span>
          <b class="num ${x.valor<0?'dn':'up'}">${x.valor>0?'+':''}${moneyJ(x.valor)}</b></div>`).join('')}</div>`;})()
        :vazio('<b>Nada ainda.</b> A primeira semana fecha com o salário.','dinheiro')}</div>`;
}

function ligarMercadoJogador(v,on){
  const depois=r=>{flash(r.ok?(r.msg||'Feito.'):r.motivo);render();if(typeof pintarSide==='function')pintarSide();if(typeof pintarTop==='function')pintarTop();};
  on('[data-mjaceitar]',el=>depois(aceitarPropostaJogador(el.dataset.mjaceitar)));
  on('[data-mjrecusar]',el=>depois(recusarPropostaJogador(el.dataset.mjrecusar)));
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
