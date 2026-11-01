/* ============================================================
   MESA DE NEGOCIAÇÃO — tela
   ------------------------------------------------------------
   No topo, o palco: o clube de onde ele sai, a carta dele e o
   seu clube. Embaixo, à esquerda, o que ele pensa do seu clube
   (termômetro de interesse, linha a linha); à direita, a
   conversa da vez (clube ou jogador) com os controles e as
   barras que mostram, ao vivo, onde a sua oferta está. No pé,
   a conversa inteira em balões.

   Toda ação passa pelo motor (core/negociacao.js) e redesenha
   a mesa. Os controles só mexem nas barras, sem gastar nada.
   ============================================================ */

/* o que você estava montando, para o redesenho não apagar */
let _mesaRasc={};

function modalProposta(id){return modalNegociacao(id);}
function modalNegociacao(id){
  const p=P(id),t=meu();
  if(!p||!t)return;
  let n=negociacaoAtivaDe(p.id);
  if(!n){
    /* janela fechada ou porta fechada: mostra a mesa só para olhar */
    const bloqueio=!G.janela&&!podePreContrato(p,t)?'A janela está fechada. Dá para estudar o jogador, mas propostas só com a janela aberta (ou pré-contrato, no último ano dele, da semana '+SEMANA_PRECONTRATO+' em diante).'
      :conversaFechada(p)?'A conversa por '+p.nome+' está fechada. Tente de novo em '+semanasAteNegociar(p)+' semana(s).'
      :null;
    const duras=recusasDuras(p,t,2);
    if(bloqueio||duras.length)return mesa(p,null,bloqueio||duras.join(' '));
    const r=abrirNegociacao(p,t);
    if(!r.ok)return mesa(p,null,r.erro);
    n=r.neg;
    _mesaRasc={};
  }
  mesa(p,n,null);
}
/* renovação: a mesma mesa, só com a conversa com o jogador */
function modalRenovacao(id){
  const p=P(id),t=meu();
  if(!p||!t)return;
  let n=negociacaoAtivaDe(p.id);
  if(!n||n.tipo!=='renovacao'){
    const r=abrirRenovacao(p,t);
    if(!r.ok)return mesa(p,null,r.erro,'renovacao');
    n=r.neg;_mesaRasc={};
  }
  mesa(p,n,null);
}
/* reabre a mesa de uma negociação que acabou de fechar, pelo id */
function mesaPorId(negId){
  const n=negociacao(negId);if(!n)return;
  mesa(P(n.jogadorId),n,null);
}

function _barraNeg(razao,zonas,legenda){
  /* razao 0..1.3 → 0..100% da barra; as zonas são cortes no mesmo eixo */
  const pos=clamp(razao/1.3*100,0,100);
  return `<div class="neg-medidor">
    <div class="neg-escala">${zonas.map(z=>`<span class="z-${z.c}" style="width:${z.w}%"></span>`).join('')}</div>
    <i style="left:${pos}%"></i>
  </div><div class="neg-leg"><b>${esc(legenda)}</b></div>`;
}
const _ZONAS_NEG=[{c:'r',w:0.70/1.3*100},{c:'a',w:(0.95-0.70)/1.3*100},{c:'y',w:(1-0.95)/1.3*100},{c:'t',w:0.30/1.3*100}];
function _legClube(razao,multa,intrans){
  if(multa)return 'Multa rescisória: o clube não pode recusar';
  if(intrans)return 'Intransferível: abaixo da multa eles recusam';
  return razao<NEG_OFENSA?'Ofensiva: gasta duas vezes a paciência':razao<0.92?'Abaixo do preço: vão contrapropor'
    :razao<1?'Perto do que eles querem':'No preço ou acima';
}
function _legJog(razao){
  return razao<0.70?'Ofensiva: gasta duas vezes a paciência':razao<0.95?'Abaixo do que ele quer'
    :razao<1?'Perto: pode passar':'Ele aceita';
}
function _pac(n,max){
  return `<span class="neg-pac" title="Paciência: cada proposta recusada gasta um ponto">${
    Array.from({length:max},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
}
function _termometro(it){
  const f=it.faixa;
  return `<div class="neg-termo f-${f.id}">
    <div class="neg-termo-barra"><div class="neg-termo-escala"></div><i style="left:${it.nota}%"></i></div>
    <div class="neg-termo-marcas"><span>Não atende</span><span>Frio</span><span>Morno</span><span>Interessado</span><span>Empolgado</span></div>
    <div class="neg-termo-nota"><b class="num">${it.nota}</b><div><b>${esc(f.nome)}</b><div class="dim">${esc(f.txt)}</div></div></div>
  </div>`;
}
function _fatores(it){
  if(!it.itens.length)return '<p class="dim">Nada pesa a favor nem contra: ele avalia só o dinheiro.</p>';
  return `<div class="neg-fatores">${it.itens.slice().sort((a,b)=>b.pontos-a.pontos).map(i=>`
    <div class="neg-fator"><span>${esc(i.rot)}</span>
      <b class="num ${i.pontos>0?'up':i.pontos<0?'dn':''}">${i.pontos>0?'+':''}${i.pontos}</b></div>`).join('')}</div>`;
}
function _chat(n){
  if(!n||!n.hist.length)return '';
  const quem={voce:'Você',clube:'Clube',jogador:'Jogador',sistema:''};
  return `<div class="neg-chat">${n.hist.map(h=>`
    <div class="neg-msg m-${h.de}">${quem[h.de]?`<span class="neg-quem">${quem[h.de]}</span>`:''}${esc(h.txt)}</div>`).join('')}</div>`;
}

function mesa(p,n,bloqueio,tipoBloq){
  const t=meu();
  const tipo=n?n.tipo||'compra':tipoBloq||'compra';
  const renov=tipo==='renovacao', pre=tipo==='precontrato';
  const fechada=n&&n.fase==='fechada';
  /* depois de assinar ele já é seu: o lado de lá e o termômetro ficam como estavam na mesa */
  const origem=fechada?(n.origemId?T(n.origemId):null):p.timeId?T(p.timeId):null;
  const ps=posturaDoClube(p);
  const promRasc=!!_mesaRasc.promessa;
  const it=fechada&&n.interesse?n.interesse:n?interesseDaNeg(n,promRasc)
    :renov?interesseEmFicar(p,t):interessePor(p,t);
  const pf=PERFIS[perfilDe(p)];
  const fase=n?n.fase:'bloqueada';
  const multa=multaDe(p);
  const preco=precoPedido(p);

  const lado=(time,rot,extra)=>`<div class="neg-lado">
    ${time?escudo(time,64):'<div class="neg-semclube">SEM<br>CLUBE</div>'}
    <div class="eyebrow">${rot}</div><b>${time?esc(time.nome):'Agente livre'}</b>${extra||''}</div>`;
  const palco=renov?`<div class="neg-palco">
    <div class="neg-lado"><div class="neg-contrato"><span class="eyebrow">Contrato atual</span>
      <b class="num">${dinheiro(fechada&&n.final?n.final.sal:p.salario)}/mês</b>
      <span class="dim">${fechada?'renovado':p.contrato<=1?'vence no fim desta temporada':'mais '+p.contrato+' ano(s)'}</span>
      <span class="dim">Multa ${dinheiro(multaDe(p))}</span></div></div>
    <div class="neg-centro">${cartaJogador(p,{w:150})}
      <div class="neg-perfil" title="${esc(pf.desc)}">Perfil: <b>${esc(pf.nome)}</b></div></div>
    <div class="neg-seta${fase==='fechada'?' ok':''}"><span></span></div>
    ${lado(t,'Renova com',`<div class="dim neg-sub">Caixa ${dinheiro(t.caixa)}</div>`)}
  </div>`:`<div class="neg-palco">
    ${lado(origem,'Sai de',fechada?'':origem?`<div><span class="chip ${ps.cls}">${esc(ps.nome)}</span></div>
      <div class="dim neg-sub">Multa ${dinheiro(multa)}</div>`:'<div class="dim neg-sub">Sem taxa de transferência</div>')}
    <div class="neg-centro">${cartaJogador(p,{w:150})}
      <div class="neg-perfil" title="${esc(pf.desc)}">Perfil: <b>${esc(pf.nome)}</b></div></div>
    <div class="neg-seta${fase==='fechada'?' ok':''}"><span></span></div>
    ${lado(t,'Vai para',`<div class="dim neg-sub">Caixa ${dinheiro(t.caixa)}</div>`)}
  </div>`;

  const passo=(k,rot,est)=>`<div class="neg-passo ${est}"><i>${k}</i>${rot}</div>`;
  const est1=!origem?'pulado':fase==='clube'?'atual':(fase==='jogador'||fase==='fechada'||(n&&n.taxa))?'feito':'';
  const est2=fase==='jogador'?'atual':fase==='fechada'?'feito':'';
  const passos=renov?`<div class="neg-passos">${passo(1,'Proposta de renovação',fase==='jogador'?'atual':fase==='fechada'?'feito':'')}
    <b></b>${passo(2,'Assinatura',fase==='fechada'?'feito':'')}</div>`
   :`<div class="neg-passos">${passo(1,pre?'Pré-contrato: sem taxa':origem?'Acordo com o clube':'Sem clube a negociar',pre?'feito':est1)}
    <b></b>${passo(2,'Contrato com o jogador',est2)}<b></b>${passo(3,'Assinatura',fase==='fechada'?'feito':'')}</div>`;

  const esquerda=`<div class="neg-col">
    <div class="eyebrow">${renov?'Vontade de ficar no ':'O que ele pensa do '}${esc(t.nome)}</div>
    ${_termometro(it)}
    ${_fatores(it)}
    <p class="dim neg-nota">${esc(pf.nome)}: ${esc(pf.desc)}</p>
  </div>`;

  let direita='';
  if(fase==='bloqueada'){
    direita=`<div class="neg-col"><div class="neg-aviso">${esc(bloqueio||'')}</div>
      <p class="dim">Preço pedido pelo clube: <b>${origem?dinheiro(preco):'—'}</b>. ${origem?'Multa: <b>'+dinheiro(multa)+'</b>.':''}</p></div>`;
  }else if(fase==='clube'){
    const taxa0=_mesaRasc.taxa!=null?_mesaRasc.taxa:_arred(preco*0.85,5000);
    const max=Math.max(multa,preco)*1.05;
    direita=`<div class="neg-col">
      <div class="split"><div class="eyebrow">Conversa com o ${esc(origem.nome)}</div>${_pac(n.pacClube,n.pacClubeMax)}</div>
      <p class="dim">${esc(ps.motivo)}</p>
      <div class="neg-numeros">
        <div><span class="dim">Eles pedem</span><b class="num">${dinheiro(n.pedidaClube)}</b></div>
        <div><span class="dim">Multa rescisória</span><b class="num">${dinheiro(multa)}</b></div>
        ${verbaVale()?`<div><span class="dim">Verba da diretoria</span><b class="num">${dinheiro(verbaDisponivel(t))}</b></div>`:''}
      </div>
      <label class="neg-campo"><span>Sua oferta pelo passe</span>
        <input type="range" id="cTaxaR" min="0" max="${Math.round(max)}" step="5000" value="${taxa0}">
        <input type="number" id="pTaxa" value="${taxa0}" step="5000"></label>
      ${ps.id!=='intransferivel'?`<div class="neg-campo"><span>Percentual de revenda <span class="dim">(o ${esc(origem.nome)} fica com uma parte da próxima venda e aceita menos agora${p.idade<=22?'; jovem, vale mais':''})</span></span>
        <div class="neg-anos neg-multa">${REVENDA_OPCOES.map(v=>`<button class="${(+_mesaRasc.revenda||0)===v?'on':''}" data-revenda="${v}">${v?v+'%':'Sem'}</button>`).join('')}</div></div>`:''}
      <div id="cBarra"></div>
      <div class="neg-bts">
        <button class="btn" id="cEnviar">Enviar proposta</button>
        ${ps.id!=='intransferivel'?`<button class="btn ghost" id="cContra">Aceitar ${dinheiro(n.pedidaClube)}</button>`:''}
        <button class="btn ghost" id="cMulta" ${t.caixa<multa?'disabled':''}>Pagar a multa (${dinheiro(multa)})</button>
        ${G.janela?`<button class="btn ghost" id="cTroca" title="Ofereça jogadores seus, com ou sem dinheiro">Propor troca</button>`:''}
        ${G.janela&&!p.emprestimo?`<button class="btn ghost" id="cEmp" title="Ele vem por uma temporada; você paga parte do salário">Pedir empréstimo</button>`:''}
        ${podePreContrato(p,t)?`<button class="btn teal" id="cPre" title="Último ano de contrato: ele chega de graça na virada">Pré-contrato (sem taxa)</button>`:''}
      </div>
      <div id="pFeed"></div>
      <div class="neg-previa"><div class="eyebrow">Depois, com o jogador</div>
        <p class="dim">Ele deve pedir perto de <b>${dinheiro(pedidoContrato(p,t,anosPreferidos(p).faixa[0],false).pedido)}/mês</b>.
        ${esc(anosPreferidos(p).txt)}</p></div>
    </div>`;
  }else if(fase==='jogador'){
    const c=n.contraJog||{};
    const sal0=_mesaRasc.sal!=null?_mesaRasc.sal:(c.sal||0);
    const anos0=_mesaRasc.anos||c.anos||2;
    const luvas0=_mesaRasc.luvas!=null?_mesaRasc.luvas:(c.luvas||0);
    const maxSal=Math.max(1000,Math.round((c.sal||1000)*1.8/100)*100);
    const maxLuvas=Math.max(10000,Math.round((c.sal||1000)*24/500)*500);
    const multa0=_mesaRasc.multa||c.multa||'padrao';
    const d=pedidoDaNeg(n,anos0,promRasc,multa0).d;
    direita=`<div class="neg-col">
      <div class="split"><div class="eyebrow">Conversa com ${esc(p.nome)}</div>${_pac(n.pacJog,n.pacJogMax)}</div>
      ${pre?`<p class="dim">Pré-contrato: ele cumpre o contrato com o ${esc(T(p.timeId).nome)} e chega de graça na virada. ${esc(anosPreferidos(p).txt)}</p>`
       :n.taxa?`<p class="dim">${n.viaMulta?'Multa paga':'Taxa acertada'}: <b>${dinheiro(n.taxa)}</b>. ${esc(anosPreferidos(p).txt)}</p>`
              :`<p class="dim">${esc(anosPreferidos(p).txt)}</p>`}
      <label class="neg-campo"><span>Salário mensal</span>
        <input type="range" id="pSalR" min="0" max="${maxSal}" step="100" value="${sal0}">
        <input type="number" id="pSal" value="${sal0}" step="100"></label>
      <div class="neg-campo"><span>Anos de contrato</span>
        <div class="neg-anos">${[1,2,3,4].map(a=>`<button class="${a===anos0?'on':''}" data-anos="${a}">${a}</button>`).join('')}</div>
        <input type="hidden" id="pAnos" value="${anos0}"></div>
      <label class="neg-campo"><span>Luvas (na assinatura)</span>
        <input type="range" id="pLuvasR" min="0" max="${maxLuvas}" step="500" value="${luvas0}">
        <input type="number" id="pLuvas" value="${luvas0}" step="500"></label>
      <div class="neg-campo"><span>Multa rescisória</span>
        <div class="neg-anos neg-multa">${Object.entries(NIVEIS_MULTA).map(([k,m])=>`<button class="${k===multa0?'on':''}" data-multa="${k}" title="${esc(m.txt)}">${m.nome}</button>`).join('')}</div>
        <input type="hidden" id="pMulta" value="${multa0}"></div>
      <label class="neg-check"><input type="checkbox" id="pProm" ${promRasc?'checked':''}>
        Prometer titularidade em contrato <span class="dim">(se ele não for titular em ${typeof PROMESSA_PRAZO!=='undefined'?PROMESSA_PRAZO:8} semanas, a moral despenca)</span></label>
      <div id="pBarra"></div>
      <div id="pCusto"></div>
      <div class="neg-bts">
        <button class="btn" id="pEnviar">Enviar proposta</button>
        ${n.contraJog?`<button class="btn ghost" id="jContra">Aceitar ${dinheiro(c.sal)}/mês · ${c.anos}a</button>`:''}
        <button class="btn ghost" id="pJusto">Preencher com o que ele aceita</button>
      </div>
      <div id="pFeed"></div>
      <details class="neg-conta"><summary>Por que ele pede isso</summary>
        <table><tbody>
          <tr><td class="dim">Salário de mercado pelo over</td><td class="r num">${dinheiro(d.base)}</td></tr>
          ${d.itens.map(i=>`<tr><td>${esc(i.rot)}</td>
            <td class="r num ${i.fator>1?'dn':'up'}">${i.fator>1?'+':''}${Math.round((i.fator-1)*100)}%</td></tr>`).join('')}
          ${multa0!=='padrao'?`<tr><td>Multa ${NIVEIS_MULTA[multa0].nome.toLowerCase()}</td><td class="r num ${NIVEIS_MULTA[multa0].f>1?'dn':'up'}">${NIVEIS_MULTA[multa0].f>1?'+':''}${Math.round((NIVEIS_MULTA[multa0].f-1)*100)}%</td></tr>`:''}
          ${premioAnos(p,anos0)>1?`<tr><td>Fora da duração que ele quer</td><td class="r num dn">+${Math.round((premioAnos(p,anos0)-1)*100)}%</td></tr>`:''}
        </tbody></table></details>
    </div>`;
  }else if(fase==='fechada'){
    const f=n.final||{};
    direita=`<div class="neg-col neg-fechada">
      <div class="neg-carimbo">${renov?'Renovado':pre?'Pré-contrato':n.emprestimo?'Emprestado':'Contratado'}</div>
      ${pre?`<p class="dim">Chega na virada da temporada, quando o contrato atual dele acabar.</p>`:''}
      <table><tbody>
        ${f.taxa?`<tr><td>${n.viaMulta?'Multa rescisória':'Taxa de transferência'}</td><td class="r num">${dinheiro(f.taxa)}</td></tr>`:''}
        <tr><td>Salário</td><td class="r num">${dinheiro(f.sal)}/mês por ${f.anos} ano(s)</td></tr>
        ${f.luvas?`<tr><td>Luvas</td><td class="r num">${dinheiro(f.luvas)}</td></tr>`:''}
        ${n.emprestimo?`<tr><td colspan="2">Por uma temporada${p.emprestimo&&p.emprestimo.opcaoCompra?', com opção de compra de '+dinheiro(p.emprestimo.opcaoCompra):''}</td></tr>`
          :`<tr><td>Comissão do empresário</td><td class="r num">${dinheiro(f.comissao)}</td></tr>`}
        ${f.promessa?'<tr><td colspan="2">Titularidade prometida em contrato</td></tr>':''}
        ${pre||n.emprestimo?'':`<tr><td>Nova multa rescisória</td><td class="r num">${dinheiro(multaDe(p))}</td></tr>`}
      </tbody></table></div>`;
  }else{
    direita=`<div class="neg-col"><div class="neg-aviso">A conversa terminou sem acordo.
      Dá para tentar de novo em ${renov?semanasAteRenovar(p):semanasAteNegociar(p)} semana(s).</div></div>`;
  }

  abrir(`<div class="neg">
    <div class="eyebrow">${renov?'Renovação':pre?'Pré-contrato':'Negociação'}</div><h2 class="sec">${esc(p.nome)}</h2>
    ${palco}${passos}
    <div class="neg-corpo">${esquerda}${direita}</div>
    ${_chat(n)}
    <div class="neg-bts" style="justify-content:flex-end">
      <button class="btn ghost" data-ficha="${p.id}">Ver ficha</button>
      <button class="btn ghost" data-close>Fechar</button></div>
  </div>`,true);
  const bf=$('#modal [data-ficha]');if(bf)bf.onclick=()=>modalJogador(p.id);
  if(n)_ligarMesa(p,n);
  const chat=$('#modal .neg-chat');if(chat)chat.scrollTop=chat.scrollHeight;
}

function _ligarMesa(p,n){
  const t=meu();
  const par=(r,num,onChange)=>{
    const a=$(r),b=$(num);if(!a||!b)return;
    a.oninput=()=>{b.value=a.value;onChange();};
    b.oninput=()=>{a.value=b.value;onChange();};
  };
  const feed=(txt,ok)=>{const f=$('#pFeed');if(f)f.innerHTML=`<div class="neg-aviso ${ok?'ok':''}">${esc(txt)}</div>`;};
  const depois=()=>mesa(p,n,null);

  if(n.fase==='clube'){
    const viva=()=>{
      const taxa=parseFloat($('#pTaxa').value)||0;
      _mesaRasc.taxa=taxa;
      const preco=precoPedido(p),multa=multaDe(p);
      const rv=+_mesaRasc.revenda||0;
      const eq=rv?taxa*(1+rv/100*pesoRevenda(p)):taxa;
      $('#cBarra').innerHTML=_barraNeg(eq/Math.max(1,preco),_ZONAS_NEG,_legClube(eq/Math.max(1,preco),taxa>=multa,posturaDoClube(p).id==='intransferivel'));
    };
    par('#cTaxaR','#pTaxa',viva);viva();
    $('#cEnviar').onclick=()=>{
      const r=proporAoClube(n,parseFloat($('#pTaxa').value)||0,+_mesaRasc.revenda||0);
      if(!r.ok)return feed(r.erro);
      if(r.resposta==='contra')_mesaRasc.taxa=r.valor;
      depois();
    };
    const bt=$('#cTroca');if(bt)bt.onclick=()=>modalTroca(p.timeId,p.id);
    const be=$('#cEmp');if(be)be.onclick=()=>modalEmprestimoMesa(n);
    $('#modal').querySelectorAll('[data-revenda]').forEach(b=>b.onclick=()=>{_mesaRasc.revenda=+b.dataset.revenda;
      $('#modal').querySelectorAll('[data-revenda]').forEach(x=>x.classList.toggle('on',x===b));viva();});
    const bp=$('#cPre');if(bp)bp.onclick=()=>{const r=irParaPreContrato(n);if(!r.ok)return feed(r.erro);depois();};
    const cc=$('#cContra');if(cc)cc.onclick=()=>{const r=aceitarContraClube(n);if(!r.ok)return feed(r.erro);depois();};
    $('#cMulta').onclick=async()=>{
      const ok=await confirmar('Pagar a multa rescisória de '+dinheiro(multaDe(p))+'? O clube não pode recusar, mas o dinheiro só sai se o jogador assinar.','Pagar a multa');
      if(!ok)return;
      const r=pagarMulta(n);if(!r.ok)return feed(r.erro);depois();
    };
  }
  if(n.fase==='jogador'){
    const oferta=()=>({sal:parseFloat($('#pSal').value)||0,anos:parseInt($('#pAnos').value)||2,
      luvas:parseFloat($('#pLuvas').value)||0,promessa:$('#pProm').checked,multa:$('#pMulta').value});
    const viva=()=>{
      const o=oferta();
      Object.assign(_mesaRasc,o);
      const a=avaliarOfertaJogador(n,o);
      $('#pBarra').innerHTML=_barraNeg(a.razao,_ZONAS_NEG,_legJog(a.razao));
      const folha=o.sal*12*o.anos;
      const caixaDepois=t.caixa-a.custo;
      $('#pCusto').innerHTML=`<table class="neg-custo"><tbody>
        ${n.taxa?`<tr><td>${n.viaMulta?'Multa':'Taxa'}</td><td class="r num">${dinheiro(n.taxa)}</td></tr>`:''}
        ${o.luvas?`<tr><td>Luvas</td><td class="r num">${dinheiro(o.luvas)}</td></tr>`:''}
        <tr><td>Comissão do empresário</td><td class="r num">${dinheiro(a.comissao)}</td></tr>
        <tr><td><b>Sai do caixa agora</b></td><td class="r num"><b>${dinheiro(a.custo)}</b></td></tr>
        <tr><td class="dim">Salários no contrato inteiro</td><td class="r num dim">${dinheiro(folha)}</td></tr>
        <tr><td class="dim">Caixa depois</td><td class="r num ${caixaDepois<0?'dn':'dim'}">${dinheiro(caixaDepois)}</td></tr>
      </tbody></table>`;
      if(a.duras.length)feed(a.duras.join(' '));
    };
    par('#pSalR','#pSal',viva);par('#pLuvasR','#pLuvas',viva);
    $('#modal').querySelectorAll('[data-anos]').forEach(b=>b.onclick=()=>{
      $('#pAnos').value=b.dataset.anos;_mesaRasc.anos=+b.dataset.anos;
      $('#modal').querySelectorAll('[data-anos]').forEach(x=>x.classList.toggle('on',x===b));viva();});
    $('#modal').querySelectorAll('[data-multa]').forEach(b=>b.onclick=()=>{
      $('#pMulta').value=b.dataset.multa;Object.assign(_mesaRasc,oferta());depois();});
    /* a promessa muda o pedido e o interesse: redesenha a mesa inteira */
    $('#pProm').onchange=()=>{Object.assign(_mesaRasc,oferta());depois();};
    viva();
    $('#pEnviar').onclick=()=>{
      const r=proporAoJogador(n,oferta());
      if(!r.ok)return feed(r.erro);
      if(r.resposta==='contra')Object.assign(_mesaRasc,{sal:r.contra.sal,anos:r.contra.anos});
      depois();
    };
    const jc=$('#jContra');if(jc)jc.onclick=()=>{const r=aceitarContraJogador(n);if(!r.ok)return feed(r.erro);depois();};
    $('#pJusto').onclick=()=>{
      const o=oferta();
      const {pedido}=pedidoDaNeg(n,o.anos,o.promessa,o.multa);
      const k=(PERFIS[perfilDe(p)].luvas||LUVAS_PESO);
      const sal=Math.max(300,Math.ceil((pedido-(o.luvas*k)/(o.anos*12))/100)*100);
      $('#pSal').value=sal;$('#pSalR').value=sal;viva();
    };
  }
}
