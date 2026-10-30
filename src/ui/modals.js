/* ============================================================
   MODAIS
   ============================================================ */
function abrir(html,wide){
  $('#modal').innerHTML=`<div class="ovl"><div class="box ${wide?'wide':''}">${html}</div></div>`;
  const ovl=$('#modal .ovl');
  ovl.onclick=e=>{if(e.target===ovl)fechar();};
  $('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=fechar);
  $('#modal').querySelectorAll('[data-prop]').forEach(b=>b.onclick=e=>{e.stopPropagation();modalProposta(b.dataset.prop);});
  $('#modal').querySelectorAll('[data-fichastaff]').forEach(b=>b.onclick=e=>{e.stopPropagation();modalStaff(b.dataset.fichastaff);});
}
function fechar(){$('#modal').innerHTML='';render();}

function modalJogador(id){
  const p=P(id);if(!p)return;
  const t=meu();
  const barra=(k)=>`<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
    <span style="width:118px;font-size:11.5px">${ATTRS.find(a=>a[0]===k)[1]}</span>
    <div class="bar" style="flex:1"><i class="${ovClass(Math.round(p.at[k]))}" style="width:${p.at[k]}%"></i></div>
    <b class="num" style="width:26px;text-align:right">${Math.round(p.at[k])}</b></div>`;
  const st=p.temp;
  return abrir(`<div class="split"><div class="linha-t" style="align-items:flex-start;gap:14px">${retrato(p,72)}<div>
    <div class="eyebrow">${p.timeId?esc(nomeT(p.timeId)):'Agente livre'}</div>
    <h2 class="sec">${esc(p.nome)} ${bandeira(p.pais)}</h2>
    <div class="dim" style="font-size:12px;margin:-4px 0 6px">${esc(nomePais(p.pais))}</div>
    <span class="tag ${p.role}">${p.role}</span>${p.role2?
      `<span class="tag ${p.role2}" style="opacity:.55" title="função secundária: perde ${
        custoDeFuncao(p,p.role2)} de over">2ª ${p.role2}</span>`:''} <span class="pill">${p.idade} anos</span>
    <span class="pill">Contrato ${p.contrato}a</span> ${p.igl?'<span class="pill">IGL</span>':''}
    <div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">
      <span class="badge ${p.lesao?'no':'ok'}">${p.lesao?'lesionado · '+p.lesao+' sem.':'apto'}</span>
      <span class="badge ${p.moral>=.7?'ok':p.moral>=.45?'at':'no'}">${p.moral>=.7?'motivado':p.moral>=.45?'neutro':'insatisfeito'}</span>
      <span class="badge ${p.fadiga<=.4?'ok':p.fadiga<=.75?'at':'no'}">${p.fadiga<=.4?'descansado':p.fadiga<=.75?'desgastado':'exausto'}</span>
    </div></div></div>
    <div style="text-align:right"><div class="ov ${ovClass(over(p))}" style="font-size:52px">${over(p)}</div>
    <div class="dim">Potencial <b style="color:var(--gold)">${p.pot}</b></div></div></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card flat"><div class="eyebrow">Atributos</div>${ATTRS.map(a=>barra(a[0])).join('')}
      <div class="eyebrow" style="margin-top:14px">Perfil</div>
      ${radar([['Mira',p.at.mira],['Util.',p.at.util],['Visão',p.at.visao],
               ['Clutch',p.at.clutch],['Cons.',p.at.consist]],210)}
    </div>
    <div class="card flat"><div class="eyebrow">Condição</div>
      <div class="gauges" style="justify-content:space-around;margin:4px 0 14px">
        ${medidor('Forma',p.forma)}${medidor('Moral',p.moral)}${medidor('Descanso',1-p.fadiga)}
      </div>
      <div class="eyebrow">Mapas</div>
      <div class="mapa-tira">${mapasDe(p).map(x=>`
        <div class="mapa-item ${x.v>=2?'bom':x.v<=-2?'ruim':''}" title="${esc(x.mapa)}: ${x.v>0?'+':''}${x.v.toFixed(1)}">
          <span>${esc(x.mapa)}</span>
          <div class="bar"><i style="width:${clamp(50+x.v*6,4,100)}%"></i></div>
        </div>`).join('')}</div>
      <p class="dim" style="font-size:11px;margin:6px 0 12px">Afinidade individual: sobe nos mapas
      em que ele rende acima do próprio normal e cai nos outros.</p>
      <div class="eyebrow">Situação</div>
      <table><tbody>
      <tr><td>Valor de mercado</td><td class="r num">${money(p.valor)}</td></tr>
      <tr><td>Salário</td><td class="r num">${money(p.salario)}/mês</td></tr>
      <tr><td>Pedido do clube</td><td class="r num">${p.timeId?money(pedidoDeVenda(p)):'livre'}</td></tr>
      <tr><td>Agentes</td><td class="r"><span class="agmini">${
        p.agentes.map(a=>`<span title="${esc(a)}">${retratoAgente(a,26)}</span>`).join('')}</span></td></tr>
      </tbody></table>
      <div class="eyebrow" style="margin-top:12px">Temporada ${G.ano}</div>
      <table><tbody><tr><td>Mapas</td><td class="r num">${st.maps}</td></tr>
      <tr><td>K / D / A</td><td class="r num">${st.k} / ${st.d} / ${st.a}</td></tr>
      <tr><td>ACS médio</td><td class="r num">${st.maps?Math.round(st.acs/st.maps):0}</td></tr>
      <tr><td>First kills · clutches</td><td class="r num">${st.fk} · ${st.cl}</td></tr>
      <tr><td>MVPs</td><td class="r num">${st.mvp}</td></tr></tbody></table>
    </div></div>
  ${p.hist.length?`<div class="card flat"><div class="eyebrow">Carreira</div><table><thead><tr><th>Ano</th><th>Clube</th><th class="c">Over</th><th class="r">K/D</th><th class="r">MVPs</th></tr></thead>
    <tbody>${p.hist.slice().reverse().map(h=>`<tr><td class="num">${h.ano}</td><td>${esc(h.time)}</td><td class="c num">${h.over}</td>
    <td class="r num">${(h.k/Math.max(1,h.d)).toFixed(2)}</td><td class="r num">${h.mvp}</td></tr>`).join('')}</tbody></table></div>`:''}
  ${p.timeId===t.id?blocoConversa(t,p):''}
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
    ${p.timeId!==t.id&&G.janela?`<button class="btn" data-prop="${p.id}">Fazer proposta</button>`:''}
    <button class="btn ghost" data-close>Fechar</button></div>`,true);
}
/* A conversa mora na ficha do jogador: é onde você já está olhando quando
   percebe que ele está mal. */
function blocoConversa(t,p){
  if(typeof opcoesDeConversa!=='function')return '';
  const mot=motivoDeInsatisfacao(t,p);
  const pode=podeConversar(p);
  const prom=p.promessa;
  const opts=opcoesDeConversa(t,p);
  return `<div class="card flat" style="margin-top:12px"><div class="split">
      <div class="eyebrow">Conversa</div>
      <span class="dim">${mot?esc(mot.texto):'Nada pendente com ele.'}</span>
    </div>
    ${prom?`<p class="dim" style="color:var(--amber);margin:6px 0">
      ⚠ Você prometeu titularidade — vence na semana ${prom.ate}. Promessa quebrada derruba
      ele e o vestiário junto.</p>`:''}
    ${pode?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      ${opts.map(o=>`<button class="btn ghost sm" data-conversa="${p.id}:${o.id}"
        title="${esc(o.dica)}">${esc(o.rot)}</button>`).join('')}</div>
      <p class="dim" style="margin-top:8px">O preparador mental do clube (nível
      ${((t.staff&&t.staff.mental)||1).toFixed(1)}) decide o quanto a conversa rende.
      Depois de falar, só dá para chamar de novo em ${CONVERSA_ESPERA} semanas.</p>`
     :`<p class="dim" style="margin-top:8px">Vocês conversaram há pouco. Dá para chamar de novo
       em ${semanasAteConversar(p)} semana(s).</p>`}
  </div>`;
}
function modalProposta(id){
  const p=P(id),t=meu();
  const taxa=p.timeId?pedidoDeVenda(p):0;
  const d=detalharPedido(p,t);
  const duras=recusasDuras(p,t,2);
  const R=REGIONS.find(r=>r.id===t.regiao);
  const casa=regiaoNatal(p);

  /* Mostrar a conta linha a linha é o ponto: sem isso o pedido salarial é um
     número que caiu do céu, e você não tem como saber se vale insistir, subir
     a oferta ou procurar outro jogador. */
  const conta=d.itens.length?`
    <div class="card flat" style="margin-top:12px"><div class="eyebrow">Por que ele pede isso</div>
      <table><tbody>
        <tr><td class="dim">Salário de mercado pelo over</td><td class="r num">${money(d.base)}</td></tr>
        ${d.itens.map(i=>`<tr><td>${esc(i.rot)}</td>
          <td class="r num ${i.fator>1?'dn':'up'}">${i.fator>1?'+':''}${Math.round((i.fator-1)*100)}%</td></tr>`).join('')}
        <tr><td><b>Pedido</b></td><td class="r num"><b>${money(d.pedido)}</b>/mês</td></tr>
      </tbody></table></div>`:'';

  const contexto=`<p class="dim">${
    p.timeId?'Sob contrato com <b>'+esc(nomeT(p.timeId))+'</b> por mais '+p.contrato+' ano(s).'
            :'Agente livre — sem taxa de transferência.'}
    Natural de ${esc(casa)}${casa!==t.regiao?', jogaria fora da região dele':''}.
    Entraria como <b>${d.pos<=5?d.pos+'º e titular':d.pos+'º do elenco, no banco'}</b>.</p>`;

  abrir(`<div class="eyebrow">Proposta</div><h2 class="sec">${esc(p.nome)}</h2>
  ${contexto}
  ${duras.length?`<div class="card flat" style="border-left:4px solid var(--red);margin-top:10px">
    <b>Não é questão de dinheiro:</b>${duras.map(x=>'<div>· '+esc(x)+'</div>').join('')}</div>`:''}
  <div class="grid g3" style="margin-top:12px">
    <div><label class="dim">Taxa de transferência</label><br>
      <input type="number" id="pTaxa" value="${taxa}" step="5000" ${p.timeId?'':'disabled'}></div>
    <div><label class="dim">Salário mensal</label><br>
      <input type="number" id="pSal" value="${d.pedido}" step="500"></div>
    <div><label class="dim">Anos de contrato</label><br>
      <input type="number" id="pAnos" value="2" min="1" max="4"></div>
  </div>
  ${conta}
  <div id="pFeed" style="margin-top:12px"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
    <button class="btn ghost" id="pJusto">Preencher com o que ele aceita</button>
    <button class="btn" id="pEnviar" ${duras.length?'disabled':''}>Enviar proposta</button>
    <button class="btn ghost" data-close>Cancelar</button></div>`);

  $('#pJusto').onclick=()=>{
    $('#pTaxa').value=taxa;$('#pSal').value=d.pedido;
  };
  $('#pEnviar').onclick=()=>{
    const taxa2=parseFloat($('#pTaxa').value)||0,sal2=parseFloat($('#pSal').value)||0,
          anos=parseInt($('#pAnos').value)||2;
    const m=avaliarProposta(p,t,taxa2,sal2,anos);
    if(m.length){$('#pFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--red)">${
      m.map(x=>'<div>· '+esc(x)+'</div>').join('')}</div>`;return;}
    executarProposta(p,t,taxa2,sal2,anos);
    $('#pFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--teal)"><b>Acordo fechado.</b> ${
      esc(p.nome)} é jogador do ${esc(t.nome)}.</div>`;
    $('#pEnviar').disabled=true;
  };
}
/* ---------- anunciar um jogador ----------
   Três decisões, e as três importam: se aceita venda, se aceita empréstimo, e
   se o empréstimo sai com opção de compra. Pedir muito acima do que ele vale
   é um jeito legítimo de dizer "só saio se pagarem". */
function modalAnunciar(id){
  const p=P(id),t=meu();
  if(!p||!t)return;
  const justo=pedidoDeVenda(p);
  const titular=t.titulares.includes(p.id);
  abrir(`<div class="eyebrow">Anunciar</div><h2 class="sec">${esc(p.nome)}</h2>
  <p class="dim">${p.idade} anos · ${esc(p.role)} · over ${over(p)} · potencial ${p.pot}
    · contrato de mais ${p.contrato} ano(s)${titular?' · <b>é titular hoje</b>':''}.
    O mercado avalia o passe dele em <b>${money(justo)}</b>.</p>
  ${p.pot-over(p)>=8&&p.idade<=21?`<div class="card flat" style="border-left:4px solid var(--teal);margin-top:10px">
    <b>Vale considerar o empréstimo.</b> Ele ainda tem ${p.pot-over(p)} pontos de evolução pela frente,
    e jogador que não entra em quadra não evolui.</div>`:''}
  <div class="grid g3" style="margin-top:12px">
    <div><label class="dim">Aceita</label><br>
      <select id="aModo">
        <option value="venda">Só venda</option>
        <option value="emprestimo">Só empréstimo</option>
        <option value="ambos" selected>Venda ou empréstimo</option>
      </select></div>
    <div><label class="dim">Pedido pelo passe</label><br>
      <input type="number" id="aPedido" value="${justo}" step="5000"></div>
    <div><label class="dim">Empréstimo</label><br>
      <select id="aOpcao">
        <option value="0">Sem opção de compra</option>
        <option value="1">Com opção de compra</option>
      </select></div>
  </div>
  <div id="aFeed" style="margin-top:12px"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
    <button class="btn" id="aOk">Anunciar</button>
    <button class="btn ghost" data-close>Cancelar</button></div>`);
  $('#aOk').onclick=()=>{
    const r=anunciarJogador(p,$('#aModo').value,$('#aOpcao').value==='1',
                            parseFloat($('#aPedido').value)||justo);
    if(!r.ok){$('#aFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--red)">${esc(r.erro)}</div>`;return;}
    fechar();
  };
}

let aba=0;
function modalPartida(res){
  const eu=res.aId===G.meuTime?res.aId:res.bId, adv=res.aId===G.meuTime?res.bId:res.aId;
  const meuLadoA=res.aId===G.meuTime;
  const wEu=meuLadoA?res.wa:res.wb, wAd=meuLadoA?res.wb:res.wa;
  const venceu=res.vencedor===G.meuTime;
  const mp=res.mapas[Math.min(aba,res.mapas.length-1)];
  const hist=mp.hist.map((h,i)=>{
    const meuWin=meuLadoA?h.v:!h.v;
    const meuLado=meuLadoA?h.lado:(h.lado==='atk'?'def':'atk');
    return (i===12?'<span class="half"></span>':'')+`<i class="${meuWin?'w':'l'} ${meuLado}"></i>`;
  }).join('');
  const linhas=ids=>ids.map(id=>{const p=P(id),s=mp.st[id]||{k:0,d:0,a:0,fk:0,cl:0,rounds:0};
    return `<tr class="jrow ${p.timeId===G.meuTime?'me':''}" data-p="${p.id}"><td><b>${esc(p.nome)}</b> ${p.igl?'<span class="pill">IGL</span>':''}${id===res.mvp?' <span class="chip g">MVP</span>':''}</td>
    <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${acsDe(s)}</td>
    <td class="c num">${s.k}</td><td class="c num">${s.d}</td><td class="c num">${s.a}</td>
    <td class="c num ${s.k-s.d>0?'up':s.k-s.d<0?'dn':''}">${s.k-s.d>0?'+':''}${s.k-s.d}</td>
    <td class="c num">${s.fk}</td><td class="c num">${s.cl}</td></tr>`;}).join('');
  abrir(`<div class="eyebrow">${esc(res.ctx.nome||'Partida')} · MD${res.bo}</div>
  <div class="scoreline">${escudo(T(eu),34)}<span class="${venceu?'win':'lose'}">${esc(nomeT(eu))}</span>
    <span class="s">${wEu} — ${wAd}</span><span>${esc(nomeT(adv))}</span>${escudo(T(adv),34)}</div>
  <div class="veto">${res.veto.map(s=>`<span class="${s.tipo==='ban'?'ban':s.tipo==='pick'?'pk':'dec'}">${s.tipo==='ban'?'ban':s.tipo==='pick'?'pick '+s.t:'decider'} · ${s.m}</span>`).join('')}</div>
  <div class="tabs">${res.mapas.map((m,i)=>{const e=meuLadoA?m.sa:m.sb,a=meuLadoA?m.sb:m.sa;
    return `<button data-ab="${i}" class="${i===Math.min(aba,res.mapas.length-1)?'on':''}">${m.mapa} ${e}-${a}</button>`;}).join('')}</div>
  <div class="card flat"><div class="eyebrow">Histórico de rounds · quadrado = ataque, círculo = defesa</div>
    <div class="rh">${hist}</div>
    <div class="split"><span class="dim">Placar final em ${mp.mapa}</span>
      <b class="num" style="font-size:18px">${meuLadoA?mp.sa:mp.sb} - ${meuLadoA?mp.sb:mp.sa}</b></div></div>
  <div class="card flat"><div class="eyebrow">${esc(nomeT(eu))}</div>
    <table><thead><tr><th>Jogador</th><th>Função</th><th class="c">ACS</th><th class="c">K</th><th class="c">D</th><th class="c">A</th>
    <th class="c">+/-</th><th class="c">FK</th><th class="c">CL</th></tr></thead><tbody>${linhas(T(eu).titulares)}</tbody></table></div>
  <div class="card flat"><div class="eyebrow">${esc(nomeT(adv))}</div>
    <table><thead><tr><th>Jogador</th><th>Função</th><th class="c">ACS</th><th class="c">K</th><th class="c">D</th><th class="c">A</th>
    <th class="c">+/-</th><th class="c">FK</th><th class="c">CL</th></tr></thead><tbody>${linhas(T(adv).titulares)}</tbody></table></div>
  <div style="display:flex;justify-content:flex-end"><button class="btn" data-close>Continuar</button></div>`,true);
  $('#modal').querySelectorAll('[data-ab]').forEach(b=>b.onclick=()=>{aba=+b.dataset.ab;modalPartida(res);});
  $('#modal').querySelectorAll('.jrow').forEach(r=>r.onclick=()=>modalJogador(r.dataset.p));
}
function modalResumo(r){
  const dest=r.resultados.filter(x=>x.stage.tier===1).slice(0,14);
  abrir(`<div class="eyebrow">${esc(r.bloco)}</div><h2 class="sec">Rodada disputada</h2>
   ${dest.length?`<div class="card flat"><table><thead><tr><th>Competição</th><th>Confronto</th><th class="c">Placar</th></tr></thead>
   <tbody>${dest.map(x=>`<tr><td class="dim">${esc(x.stage.nome)}</td>
   <td>${timeInline(x.res.vencedor,18)} <span class="dim">venceu</span> ${timeInline(x.res.perdedor,18)}</td>
   <td class="c num">${Math.max(x.res.wa,x.res.wb)}-${Math.min(x.res.wa,x.res.wb)}</td></tr>`).join('')}</tbody></table></div>`
   :'<div class="empty">Sem partidas nesta rodada.</div>'}
   <div style="display:flex;justify-content:flex-end"><button class="btn" data-close>Continuar</button></div>`);
}

/* ============================================================
   FICHA EDITÁVEL — usada pelo Editor
   ------------------------------------------------------------
   Edita tudo que o modelo de dados guarda de um jogador: os oito
   atributos, potencial, contrato, condição, agentes, clube e foto.
   O over é derivado dos atributos (ver docs/DADOS.md), então aqui
   ele aparece como leitura ao vivo — e há um campo separado que
   reescala os atributos para um over alvo, que é o atalho de quem
   está montando base a partir de uma lista de overs.
   ============================================================ */
function modalEditarJogador(id){
  const p=P(id);if(!p)return;
  const chaveFoto=Imgs.chaveJog(p.nome);
  const temFoto=Imgs.tem(chaveFoto);
  const t=p.timeId?T(p.timeId):null;
  const linhaAt=k=>{
    const nome=ATTRS.find(a=>a[0]===k)[1];
    return `<div class="atrow">
      <span class="lb">${nome}</span>
      <input type="range" min="25" max="99" value="${Math.round(p.at[k])}" data-atr="${k}">
      <input type="number" min="25" max="99" value="${Math.round(p.at[k])}" data-atn="${k}" class="num">
    </div>`;};

  abrir(`<div class="split">
    <div class="linha-t" style="align-items:flex-start;gap:14px">${retrato(p,64)}<div>
      <div class="eyebrow">${t?esc(t.nome):'Sem clube'}</div>
      <h2 class="sec">Editar ${esc(p.nome)}</h2>
      <span class="dim">id ${esc(p.id)}</span></div></div>
    <div style="text-align:right">
      <div class="ov ${ovClass(over(p))}" id="edjOver" style="font-size:44px">${over(p)}</div>
      <div class="dim">over ao vivo</div></div>
  </div>

  <div class="grid g2" style="margin-top:12px">
    <div class="card flat"><div class="eyebrow">Ficha</div>
      <div class="campos">
        <label>Nick<input type="text" id="edjNome" value="${esc(p.nome)}"></label>
        <label>Função<select id="edjRole">${ROLES.map(r=>
          `<option ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></label>
        <label>Secundária<select id="edjRole2">
          <option value="" ${!p.role2?'selected':''}>— nenhuma —</option>
          <option value="auto">↻ a melhor possível</option>
          ${p.role2&&custoDeFuncao(p,p.role2)>CUSTO_MAX_SECUNDARIA?
            `<option value="${p.role2}" selected>${p.role2} · não vale mais (−${
              custoDeFuncao(p,p.role2)})</option>`:''}
          ${ROLES.filter(r=>r!==p.role).map(r=>{
            const custo=custoDeFuncao(p,r), pode=custo<=CUSTO_MAX_SECUNDARIA;
            /* uma opção desabilitada nunca vem marcada: o navegador ignoraria a
               marcação e o campo apareceria vazio, como se o jogador não tivesse
               secundária nenhuma */
            const atual=p.role2===r&&pode;
            return `<option value="${r}" ${atual?'selected':''} ${pode?'':'disabled'}>${r}${
              pode?(custo>0?' (−'+custo+')':' (+'+(-custo)+')'):' · perfil não permite'}</option>`;
          }).join('')}</select></label>
        <label>Idade<input type="number" id="edjIdade" value="${p.idade}" min="15" max="40"></label>
        <label>País${selectPais('id="edjPais"',p.pais)}</label>
        <label>Gênero<select id="edjGenero">
          <option value="m" ${p.genero!=='f'?'selected':''}>Masculino</option>
          <option value="f" ${p.genero==='f'?'selected':''}>Feminino</option></select></label>
        <label>Potencial<input type="number" id="edjPot" value="${p.pot}" min="30" max="99"></label>
        <label>Contrato (anos)<input type="number" id="edjContrato" value="${p.contrato}" min="0" max="6"></label>
        <label>Salário / mês<input type="number" id="edjSalario" value="${Math.round(p.salario)}" step="100"></label>
        <label>Clube${edSelectTimes('id="edjTime"',p.timeId,true)}</label>
      </div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px">
        <input type="checkbox" id="edjIgl" ${p.igl?'checked':''} ${t?'':'disabled'}>
        <span>É o IGL do time</span></label>
      <div class="eyebrow" style="margin-top:14px">Reescalar para um over alvo</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <input type="number" id="edjAlvo" placeholder="${over(p)}" min="30" max="99" style="width:90px">
        <button class="btn ghost sm" id="edjAplicarAlvo">Aplicar</button>
        <span class="dim">mantém o perfil da função</span>
      </div>
    </div>

    <div class="card flat"><div class="eyebrow">Atributos · 25 a 99</div>
      ${ATTRS.map(a=>linhaAt(a[0])).join('')}
      <p class="dim" style="margin-top:6px">O over é a média destes atributos ponderada pelos pesos
      da função, então mudar de função muda o over sem mudar atributo nenhum.</p>
    </div>
  </div>

  <div class="grid g2">
    <div class="card flat"><div class="eyebrow">Condição</div>
      <div class="campos">
        <label>Moral (0–100)<input type="number" id="edjMoral" value="${Math.round(p.moral*100)}" min="0" max="100"></label>
        <label>Forma (0–100)<input type="number" id="edjForma" value="${Math.round(p.forma*100)}" min="0" max="100"></label>
        <label>Fadiga (0–100)<input type="number" id="edjFadiga" value="${Math.round(p.fadiga*100)}" min="0" max="100"></label>
        <label>Lesão (semanas)<input type="number" id="edjLesao" value="${p.lesao||0}" min="0" max="52"></label>
      </div>
      <label style="display:block;margin-top:10px">Agentes (separados por vírgula)
        <input type="text" id="edjAgentes" value="${esc(p.agentes.join(', '))}"></label>
      <p class="dim" style="margin-top:6px">Sugestões da função: ${esc(AGENTS[p.role].join(', '))}</p>
    </div>

    <div class="card flat"><div class="eyebrow">Foto</div>
      <div style="display:flex;gap:12px;align-items:flex-start">
        <img src="${ASSETS.foto(p)}" width="72" height="72" alt=""
          style="border:1px solid var(--line);background:var(--paper2)"
          onerror="this.onerror=null;this.src='${monogramaJogador(p.nome,72)}'">
        <div style="flex:1">
          <div class="dropzone sm" id="edjDrop">Arraste um PNG aqui ou
            <label class="lk">escolha o arquivo<input type="file" id="edjFile" accept="image/*" style="display:none"></label>
          </div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap">
            <span class="chip ${temFoto?'t':'g'}">${temFoto?'no pacote':'sem imagem'}</span>
            ${temFoto?`<button class="btn ghost sm" id="edjFotoDel">Remover do pacote</button>`:''}
          </div>
          <label style="margin-top:8px;display:block">Caminho manual (opcional)
            <input type="text" id="edjFoto" value="${esc(p.foto||'')}" placeholder="${esc(ASSETS.dirFotos+ASSETS.slug(p.nome)+'.'+ASSETS.ext)}"></label>
        </div>
      </div>
      <p class="dim" style="margin-top:8px">Renomear o nick re-chaveia a imagem no pacote sozinho.</p>
    </div>
  </div>

  <div id="edjFeed"></div>
  <div style="display:flex;gap:8px;justify-content:space-between;margin-top:10px">
    <button class="btn ghost" id="edjApagar" style="border-color:var(--red);color:var(--red-d)">Apagar da base</button>
    <div style="display:flex;gap:8px">
      <button class="btn" id="edjSalvar">Salvar</button>
      <button class="btn ghost" data-close>Cancelar</button>
    </div></div>`,true);

  const M=$('#modal');
  const num=s=>{const el=M.querySelector(s);return el?parseFloat(el.value):null;};
  /* over ao vivo: recalcula pelos mesmos pesos do motor, sem tocar no jogador */
  const repintarOver=()=>{
    const role=M.querySelector('#edjRole').value;
    const w=ROLE_W[role];let tot=0;
    for(const k in w){
      const el=M.querySelector('[data-atn="'+k+'"]');
      tot+=(el?parseFloat(el.value)||0:p.at[k])*w[k];
    }
    const o=Math.round(tot);
    const alvo=$('#edjOver');
    alvo.textContent=o;
    alvo.className='ov '+ovClass(o);
  };
  ATTRS.forEach(([k])=>{
    const r=M.querySelector('[data-atr="'+k+'"]'),n=M.querySelector('[data-atn="'+k+'"]');
    r.addEventListener('input',()=>{n.value=r.value;repintarOver();});
    n.addEventListener('input',()=>{r.value=n.value;repintarOver();});
  });
  M.querySelector('#edjRole').addEventListener('change',repintarOver);

  M.querySelector('#edjAplicarAlvo').onclick=()=>{
    const alvo=num('#edjAlvo');
    if(!alvo)return;
    /* usa o próprio aplicarOver do motor num clone dos atributos */
    const clone={role:M.querySelector('#edjRole').value,at:{},pot:p.pot,idade:p.idade,forma:p.forma};
    for(const[k]of ATTRS)clone.at[k]=parseFloat(M.querySelector('[data-atn="'+k+'"]').value)||p.at[k];
    aplicarOver(clone,clamp(Math.round(alvo),30,99));
    for(const[k]of ATTRS){
      M.querySelector('[data-atn="'+k+'"]').value=Math.round(clone.at[k]);
      M.querySelector('[data-atr="'+k+'"]').value=Math.round(clone.at[k]);
    }
    repintarOver();
  };

  const subirFoto=async file=>{
    try{
      const uri=await Imgs.doArquivo(file);
      await Imgs.gravar(Imgs.chaveJog(M.querySelector('#edjNome').value.trim()||p.nome),uri);
      $('#edjFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--teal)">Foto no pacote.</div>';
      modalEditarJogador(id);
    }catch(e){
      $('#edjFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--red)">'+esc(e.message||'Falha ao subir.')+'</div>';
    }
  };
  ligarDropzone(M.querySelector('#edjDrop'),M.querySelector('#edjFile'),f=>subirFoto(f));
  const bDel=M.querySelector('#edjFotoDel');
  if(bDel)bDel.onclick=async()=>{await Imgs.apagar(chaveFoto);modalEditarJogador(id);};

  M.querySelector('#edjApagar').onclick=()=>{
    if(!confirm('Apagar '+p.nome+' da base? Não dá para desfazer.'))return;
    const r=edApagar(id);
    fechar();flash(r.ok?r.msg:r.erro);
  };

  M.querySelector('#edjSalvar').onclick=async()=>{
    const nomeAntes=p.nome;
    const at={};
    for(const[k]of ATTRS)at[k]=parseFloat(M.querySelector('[data-atn="'+k+'"]').value);
    const r=edAplicarJogador(id,{
      nome:M.querySelector('#edjNome').value,
      role:M.querySelector('#edjRole').value,
      role2:M.querySelector('#edjRole2').value,
      idade:num('#edjIdade'), pais:M.querySelector('#edjPais').value,
      genero:M.querySelector('#edjGenero').value,
      at, pot:num('#edjPot'), contrato:num('#edjContrato'), salario:num('#edjSalario'),
      moral:num('#edjMoral')/100, forma:num('#edjForma')/100, fadiga:num('#edjFadiga')/100,
      lesao:num('#edjLesao'),
      agentes:M.querySelector('#edjAgentes').value.split(',').map(x=>x.trim()).filter(Boolean),
      foto:M.querySelector('#edjFoto').value,
      igl:M.querySelector('#edjIgl').checked
    });
    if(!r.ok){$('#edjFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--red)">'+esc(r.erro)+'</div>';return;}
    if(r.renomeado)await Imgs.renomear(Imgs.chaveJog(r.renomeado.de),Imgs.chaveJog(r.renomeado.para));
    const destino=M.querySelector('#edjTime').value||null;
    if(destino!==(p.timeId||null)){
      const mv=edMover(id,destino);
      if(!mv.ok){$('#edjFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--red)">'+esc(mv.erro)+'</div>';return;}
    }
    fechar();flash(nomeAntes===p.nome?'Ficha salva.':'Ficha salva — '+nomeAntes+' virou '+p.nome+'.');
  };
}

/* ============================================================
   COMISSÃO TÉCNICA — ficha, edição e proposta
   ============================================================ */
function cargoNome(id){const c=CARGOS.find(x=>x.id===id);return c?c.nome:id;}

function modalStaff(id){
  const m=G.staff[id];if(!m)return;
  const t=m.timeId?T(m.timeId):null;
  const o=overStaff(m);
  const barra=k=>`<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
    <span style="width:130px;font-size:11.5px">${ATTRS_STAFF.find(a=>a[0]===k)[1]}</span>
    <div class="bar" style="flex:1"><i class="${ovClass(Math.round(m.at[k]))}" style="width:${m.at[k]}%"></i></div>
    <b class="num" style="width:26px;text-align:right">${Math.round(m.at[k])}</b></div>`;
  abrir(`<div class="split">
    <div class="linha-t" style="align-items:flex-start;gap:14px">${retratoStaff(m,72)}<div>
      <div class="eyebrow">${t?esc(t.nome):'Sem clube'}</div>
      <h2 class="sec">${esc(m.nome)} ${bandeira(m.pais)}</h2>
      <div class="dim" style="font-size:12px;margin:-4px 0 6px">${esc(nomePais(m.pais))}</div>
      <span class="tag">${esc(cargoNome(m.cargo))}</span> <span class="pill">${m.idade} anos</span>
      <span class="pill">Contrato ${m.contrato}a</span></div></div>
    <div style="text-align:right"><div class="ov ${ovClass(o)}" style="font-size:52px">${o}</div>
      <div class="dim">Potencial <b style="color:var(--gold)">${m.pot}</b></div>
      <div class="dim num">nível ${nivelDe(m).toFixed(1)} / 5</div></div>
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card flat"><div class="eyebrow">Atributos</div>${ATTRS_STAFF.map(a=>barra(a[0])).join('')}
      <div class="eyebrow" style="margin-top:14px">Perfil</div>
      ${radar(ATTRS_STAFF.map(([k,n])=>[n.split(' ')[0],m.at[k]]),200)}
      <p class="dim">${esc((CARGOS.find(c=>c.id===m.cargo)||{efeito:''}).efeito)}</p>
    </div>
    <div class="card flat"><div class="eyebrow">Situação</div>
      <table><tbody>
        <tr><td>Valor de mercado</td><td class="r num">${money(m.valor)}</td></tr>
        <tr><td>Salário</td><td class="r num">${money(m.salario)}/mês</td></tr>
        <tr><td>Pedido do clube</td><td class="r num">${m.timeId?money(pedidoStaff(m)):'livre'}</td></tr>
        <tr><td>Temporada</td><td class="r num">${m.temp.v}V-${m.temp.d}D · ${m.temp.titulos} título(s)</td></tr>
        <tr><td>Carreira</td><td class="r num">${m.carreira.anos} ano(s) · ${m.carreira.titulos} título(s)</td></tr>
      </tbody></table>
      ${m.hist.length?`<div class="eyebrow" style="margin-top:12px">Histórico</div>
      <table><thead><tr><th>Ano</th><th>Clube</th><th class="c">Over</th><th class="r">V-D</th><th class="r">Tít.</th></tr></thead>
      <tbody>${m.hist.slice().reverse().slice(0,10).map(h=>`<tr><td class="num">${h.ano}</td>
        <td>${esc(h.time)}</td><td class="c num">${h.over}</td>
        <td class="r num">${h.v}-${h.d}</td><td class="r num">${h.titulos}</td></tr>`).join('')}</tbody></table>`:''}
    </div></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
    ${m.timeId!==G.meuTime&&G.janela?`<button class="btn" data-propstaff="${m.id}">Fazer proposta</button>`:''}
    <button class="btn ghost" data-close>Fechar</button></div>`,true);
  const bp=$('#modal [data-propstaff]');
  if(bp)bp.onclick=()=>modalPropostaStaff(id);
}

function modalPropostaStaff(id){
  const m=G.staff[id],t=meu();
  if(!m||!t)return;
  const taxa=m.timeId?pedidoStaff(m):0;
  const sal=salarioPedidoStaff(m,t);
  abrir(`<div class="eyebrow">Proposta</div><h2 class="sec">${esc(m.nome)}</h2>
  <p class="dim">${m.timeId?'Sob contrato com '+esc(nomeT(m.timeId))+' por mais '+m.contrato+' ano(s).'
    :'Sem clube — não há taxa de liberação.'}</p>
  <div class="grid g2" style="margin-top:12px">
    <div><label class="dim">Cargo no seu clube</label><br>
      <select id="psCargo">${CARGOS.map(c=>`<option value="${c.id}" ${c.id===m.cargo?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>
    <div><label class="dim">Anos de contrato</label><br><input type="number" id="psAnos" value="2" min="1" max="4"></div>
    <div><label class="dim">Taxa de liberação</label><br>
      <input type="number" id="psTaxa" value="${taxa}" step="5000" ${m.timeId?'':'disabled'}></div>
    <div><label class="dim">Salário mensal</label><br><input type="number" id="psSal" value="${sal}" step="100"></div>
  </div>
  <div id="psFeed" style="margin-top:12px"></div>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
    <button class="btn" id="psEnviar">Enviar proposta</button>
    <button class="btn ghost" data-close>Cancelar</button></div>`);
  $('#psEnviar').onclick=()=>{
    const cargo=$('#psCargo').value;
    const taxa2=parseFloat($('#psTaxa').value)||0;
    const sal2=parseFloat($('#psSal').value)||0;
    const anos=parseInt($('#psAnos').value)||2;
    const mot=avaliarPropostaStaff(m,t,cargo,taxa2,sal2,anos);
    if(mot.length){$('#psFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--red)">${
      mot.map(x=>'<div>· '+esc(x)+'</div>').join('')}</div>`;return;}
    executarPropostaStaff(m,t,cargo,taxa2,sal2,anos);
    $('#psFeed').innerHTML=`<div class="card flat" style="border-left:4px solid var(--teal)"><b>Acordo fechado.</b> ${
      esc(m.nome)} é o novo ${esc(cargoNome(cargo))} do ${esc(t.nome)}.</div>`;
    $('#psEnviar').disabled=true;
  };
}

function modalEditarStaff(id){
  const m=G.staff[id];if(!m)return;
  const chave=Imgs.chaveStaff(m.nome);
  const linhaAt=k=>`<div class="atrow">
    <span class="lb">${ATTRS_STAFF.find(a=>a[0]===k)[1]}</span>
    <input type="range" min="25" max="99" value="${Math.round(m.at[k])}" data-satr="${k}">
    <input type="number" min="25" max="99" value="${Math.round(m.at[k])}" data-satn="${k}" class="num"></div>`;
  abrir(`<div class="split">
    <div class="linha-t" style="align-items:flex-start;gap:14px">${retratoStaff(m,64)}<div>
      <div class="eyebrow">${m.timeId?esc(nomeT(m.timeId)):'Sem clube'}</div>
      <h2 class="sec">Editar ${esc(m.nome)}</h2><span class="dim">id ${esc(m.id)}</span></div></div>
    <div style="text-align:right"><div class="ov ${ovClass(overStaff(m))}" id="edsOver" style="font-size:44px">${overStaff(m)}</div>
      <div class="dim">over ao vivo</div></div></div>
  <div class="grid g2" style="margin-top:12px">
    <div class="card flat"><div class="eyebrow">Ficha</div>
      <div class="campos">
        <label>Nome<input type="text" id="edsNome" value="${esc(m.nome)}"></label>
        <label>Cargo<select id="edsCargo">${CARGOS.map(c=>
          `<option value="${c.id}" ${c.id===m.cargo?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></label>
        <label>Idade<input type="number" id="edsIdade" value="${m.idade}" min="20" max="70"></label>
        <label>País${selectPais('id="edsPais"',m.pais)}</label>
        <label>Gênero<select id="edsGenero">
          <option value="m" ${m.genero!=='f'?'selected':''}>Masculino</option>
          <option value="f" ${m.genero==='f'?'selected':''}>Feminino</option></select></label>
        <label>Potencial<input type="number" id="edsPot" value="${m.pot}" min="30" max="99"></label>
        <label>Contrato (anos)<input type="number" id="edsContrato" value="${m.contrato}" min="0" max="6"></label>
        <label>Salário / mês<input type="number" id="edsSalario" value="${Math.round(m.salario)}" step="100"></label>
      </div>
      <div class="eyebrow" style="margin-top:14px">Foto</div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-top:4px">
        ${retratoStaff(m,64)}
        <div style="flex:1">
          <div class="dropzone sm" id="edsDrop">Arraste um PNG aqui ou
            <label class="lk">escolha o arquivo<input type="file" id="edsFile" accept="image/*" style="display:none"></label></div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap">
            <span class="chip ${Imgs.tem(chave)?'t':'g'}">${Imgs.tem(chave)?'no pacote':'sem imagem'}</span>
            ${Imgs.tem(chave)?`<button class="btn ghost sm" id="edsFotoDel">Remover do pacote</button>`:''}</div>
        </div></div>
    </div>
    <div class="card flat"><div class="eyebrow">Atributos · 25 a 99</div>
      ${ATTRS_STAFF.map(a=>linhaAt(a[0])).join('')}
      <p class="dim" style="margin-top:6px">O over é a média ponderada pelos pesos do cargo, então
      mudar de cargo muda o over sem mudar atributo nenhum. O nível que o motor lê sai desse over.</p>
      <div class="eyebrow" style="margin-top:14px">Nível resultante</div>
      <div class="ov" id="edsNivel" style="font-size:26px">${nivelDe(m).toFixed(1)} / 5</div>
    </div></div>
  <div id="edsFeed"></div>
  <div style="display:flex;gap:8px;justify-content:space-between;margin-top:10px">
    <button class="btn ghost" id="edsApagar" style="border-color:var(--red);color:var(--red)">Apagar da base</button>
    <div style="display:flex;gap:8px">
      <button class="btn" id="edsSalvar">Salvar</button>
      <button class="btn ghost" data-close>Cancelar</button></div></div>`,true);

  const M=$('#modal');
  const num=s=>{const el=M.querySelector(s);return el?parseFloat(el.value):null;};
  const repintar=()=>{
    const cargo=M.querySelector('#edsCargo').value;
    const w=CARGO_W[cargo]||CARGO_W.tecnico;let tot=0;
    for(const k in w){const el=M.querySelector('[data-satn="'+k+'"]');
      tot+=(el?parseFloat(el.value)||0:m.at[k])*w[k];}
    const o=Math.round(tot);
    const alvo=$('#edsOver');alvo.textContent=o;alvo.className='ov '+ovClass(o);
    $('#edsNivel').textContent=nivelStaff(o).toFixed(1)+' / 5';
  };
  ATTRS_STAFF.forEach(([k])=>{
    const r=M.querySelector('[data-satr="'+k+'"]'),n=M.querySelector('[data-satn="'+k+'"]');
    r.addEventListener('input',()=>{n.value=r.value;repintar();});
    n.addEventListener('input',()=>{r.value=n.value;repintar();});
  });
  M.querySelector('#edsCargo').addEventListener('change',repintar);

  const subir=async file=>{
    try{
      const[lg,al]=Imgs.formatoDaChave(Imgs.chaveStaff(m.nome));
      const uri=await Imgs.doArquivo(file,lg,al);
      await Imgs.gravar(Imgs.chaveStaff(M.querySelector('#edsNome').value.trim()||m.nome),uri);
      modalEditarStaff(id);
    }catch(e){$('#edsFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--red)">'+esc(e.message||'Falha ao subir.')+'</div>';}
  };
  ligarDropzone(M.querySelector('#edsDrop'),M.querySelector('#edsFile'),f=>subir(f));
  const bd=M.querySelector('#edsFotoDel');
  if(bd)bd.onclick=async()=>{await Imgs.apagar(chave);modalEditarStaff(id);};

  M.querySelector('#edsApagar').onclick=()=>{
    if(!confirm('Apagar '+m.nome+' da base?'))return;
    const r=apagarStaff(id);fechar();flash(r.ok?r.msg:r.erro);
  };
  M.querySelector('#edsSalvar').onclick=async()=>{
    const at={};
    for(const[k]of ATTRS_STAFF)at[k]=parseFloat(M.querySelector('[data-satn="'+k+'"]').value);
    const r=edAplicarStaff(id,{
      nome:M.querySelector('#edsNome').value, cargo:M.querySelector('#edsCargo').value,
      idade:num('#edsIdade'), pais:M.querySelector('#edsPais').value,
      genero:M.querySelector('#edsGenero').value,
      at, pot:num('#edsPot'), contrato:num('#edsContrato'), salario:num('#edsSalario')
    });
    if(!r.ok){$('#edsFeed').innerHTML='<div class="card flat" style="border-left:4px solid var(--red)">'+esc(r.erro)+'</div>';return;}
    if(r.renomeado)await Imgs.renomear(Imgs.chaveStaff(r.renomeado.de),Imgs.chaveStaff(r.renomeado.para));
    fechar();flash('Ficha salva.');
  };
}

/* ============================================================
   VEREDITO DA DIRETORIA
   ------------------------------------------------------------
   O momento que dá peso ao modo treinador. Sem esta tela, a
   confiança seria um número mudando sozinho num canto — a
   cobrança precisa ter hora marcada e olho no olho.
   ============================================================ */
function modalVeredito(v){
  if(!v)return;
  const m=G.manager;
  const principal=v.metas.find(x=>/^Terminar|^Brigar/.test(x.texto))||v.metas[0];
  const bateu=principal&&principal.cumprida;
  const tom=v.demitido?'ruim':bateu?'bom':v.avisado?'ruim':'neutro';
  const titulo=v.demitido?'Você está demitido'
    :bateu?'Temporada aprovada'
    :v.avisado?'Último aviso':'Temporada abaixo do esperado';

  abrir(`<div class="ver ${tom}">
    <div class="eyebrow">${esc(v.clube)} · temporada ${v.ano}</div>
    <h2 class="sec ver-t">${titulo}</h2>
    <p class="dim">${v.pos}º de ${v.de} na liga${v.titulos?' · '+v.titulos+' título(s)':''}.</p>
    <div class="card flat"><div class="eyebrow">O que foi cobrado</div>
      ${v.metas.map(x=>`<div class="mgr-meta ${x.cumprida?'ok':'nao'}" style="margin-bottom:6px">
        <b>${x.cumprida?'Cumprida':'Não cumprida'}</b>
        <span>${esc(x.texto)} — <span class="dim">${esc(x.resultado||'')}</span></span></div>`).join('')}
    </div>
    <div class="split" style="margin-top:12px">
      <span class="dim">Confiança da diretoria</span>
      <span class="num ${v.delta>=0?'up':'dn'}">${v.delta>=0?'+':''}${v.delta} → ${v.confianca}</span>
    </div>
    ${v.demitido?`
      <div class="card" style="margin-top:14px"><div class="eyebrow">Sua carreira continua</div>
        <p class="dim">Clubes dispostos a te contratar agora. Nenhum de topo chama quem
        acabou de cair — é assim que a carreira ganha forma.</p>
        <table><tbody>${ofertasDeEmprego().map(t=>`<tr>
          <td>${escudo(t,24)}</td>
          <td><b>${esc(t.nome)}</b> <span class="dim">${esc(nomeLiga(t))}</span></td>
          <td class="c num dim">prest. ${Math.round(t.prestigio)}</td>
          <td class="r"><button class="btn sm" data-assumir="${t.id}">Assumir</button></td>
        </tr>`).join('')}</tbody></table>
        <p class="dim" style="margin-top:8px">Ou feche esta janela e encerre a carreira por aqui.</p>
      </div>`:''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button class="btn ghost" data-close>${v.demitido?'Encerrar a carreira':'Seguir em frente'}</button>
    </div></div>`,true);

  $('#modal').querySelectorAll('[data-assumir]').forEach(b=>b.onclick=()=>{
    const r=assumirClube(b.dataset.assumir);
    fechar();render();flash(r.ok?r.msg:r.erro);
  });
}
