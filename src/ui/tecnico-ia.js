/* ============================================================
   COMANDO TÉCNICO — a tela do modo Dono com técnico IA
   ------------------------------------------------------------
   Quem treina o time, o mandato da temporada, os pedidos dele,
   as suas interferências, e as três portas: demitir, contratar
   (pela entrevista) e, no Dono-técnico, sentar no banco.
   O núcleo mora em core/tecnico-ia.js.
   ============================================================ */
let ENT=null;   /* estado da entrevista aberta */

function _barraConf(c){
  const cor=c>=60?'var(--teal)':c>=45?'var(--amber)':'var(--red)';
  return `<div class="ti-conf"><div class="ti-conf-b"><i style="width:${clamp(c,0,100)}%;background:${cor}"></i>
    <span class="ti-conf-l" style="left:${TEC_CONF_SAIDA}%" title="Abaixo daqui ele pede para sair"></span></div>
    <div class="ti-conf-t"><b class="num">${Math.round(c)}</b><span>${esc(rotuloConfTec(c))}</span></div></div>`;
}
function _cartaoTecnico(t,tec,x){
  if(x.noBanco){
    const m=G.manager.staffId&&G.staff[G.manager.staffId];
    return `<div class="ti-quem">${typeof retratoManager==='function'?retratoManager(84):''}<div>
      <div class="eyebrow">No banco</div><h3 class="ti-nome">${esc(G.manager.nome)}</h3>
      <div class="dim">Você é o dono e o técnico${m?' · coach <b class="num">'+overStaff(m)+'</b>':''}. Escalação, tática, treino e veto são seus.</div></div></div>`;
  }
  if(!tec)return `<div class="ti-quem"><div class="ti-vazio">${icone('elenco')}</div><div>
    <div class="eyebrow">Interino</div><h3 class="ti-nome">Auxiliar técnico</h3>
    <div class="dim">Sem head coach contratado. O auxiliar escala e treina, mas rende como uma comissão de nível 1.</div></div></div>`;
  const pf=perfilTecnico(tec);
  return `<div class="ti-quem">${retratoStaff(tec,84)}<div>
    <div class="eyebrow">Head coach · ${esc(pf.estilo)}</div>
    <h3 class="ti-nome" data-fichastaff="${tec.id}">${esc(tec.nome)} ${bandeira(tec.pais)}</h3>
    <div class="ti-chips"><span class="ov ${ovClass(overStaff(tec))}">${overStaff(tec)}</span>
      <span class="pill">${tec.idade} anos</span><span class="pill">contrato ${tec.contrato}a</span>
      <span class="pill">${money(tec.salario)}/mês</span><span class="pill">ego ${esc(pf.ego)}</span>
      <span class="pill">quer ${esc(PRIORIDADES_TEC[pf.prioridade].nome.toLowerCase())}</span></div>
    ${x.exige.verbaMin||x.exige.naoInterferir?`<div class="dim ti-exige">Assinou exigindo ${[x.exige.verbaMin?'verba mínima de '+money(x.exige.verbaMin):'',x.exige.naoInterferir?'não interferência':''].filter(Boolean).join(' e ')}.</div>`:''}
  </div></div>`;
}
function _cardMandato(t,x){
  const md=x.mandato&&x.mandato.ano===G.ano?x.mandato:null;
  if(!md)return `<div class="card ti-mandato pend"><div class="eyebrow">Mandato ${G.ano}</div>
    <p>O técnico espera o mandato da temporada: a meta, a verba e a diretriz.</p>
    <button class="btn" id="tiMandato">Definir o mandato</button></div>`;
  const dir=DIRETRIZES_TEC.find(d=>d.id===md.diretriz)||DIRETRIZES_TEC[0];
  const disp=typeof verbaDisponivel==='function'?verbaDisponivel(t):md.verba;
  const{pos,de}=posicaoNaLiga(t);
  return `<div class="card ti-mandato"><div class="split"><div class="eyebrow">Mandato ${G.ano}</div>
      <button class="btn ghost sm" id="tiMandato">Rever</button></div>
    <div class="ti-md">
      <div><span class="dim">Meta</span><b>${esc(md.texto)}</b><span class="dim">hoje: ${pos}º de ${de}</span></div>
      <div><span class="dim">Verba</span><b class="num">${money(md.verba)}</b><span class="dim">${money(disp)} disponível</span></div>
      <div><span class="dim">Diretriz</span><b>${esc(dir.nome)}</b><span class="dim">${esc(dir.desc)}</span></div>
    </div></div>`;
}
function _linhaPedido(pd){
  const p=pd.jogadorId?G.jogadores[pd.jogadorId]:null, s=pd.sugestaoId?G.jogadores[pd.sugestaoId]:null;
  const rot={reforco:'Reforço',renovar:'Renovação',dispensar:'Dispensa'}[pd.tipo];
  const st={aberto:'',aprovado:'<span class="chip">aprovado</span>',cumprido:'<span class="chip up">cumprido</span>',
    negado:'<span class="chip dn">negado</span>',expirou:'<span class="chip dn">expirou</span>',falhou:'<span class="chip dn">falhou</span>'}[pd.status]||'';
  return `<div class="ti-ped ${pd.status}">
    <div class="ti-ped-ic">${icone(pd.tipo==='reforco'?'mais':pd.tipo==='renovar'?'disco':'saida')}</div>
    <div class="ti-ped-c"><div><b>${rot}</b> ${st}</div><div>${esc(pd.texto)}</div>
      ${s&&pd.status!=='cumprido'?`<div class="dim ti-ped-s">${retrato(s,22)} sugestão: <a href="#" data-p="${s.id}" class="jlink">${esc(s.nome)}</a> · ${s.role} · over ${over(s)} · ${s.timeId?esc(tagT(s.timeId)):'livre'}</div>`:''}
    </div>
    <div class="ti-ped-a">${pd.status==='aberto'?`<button class="btn sm" data-tiaprova="${pd.id}">Aprovar</button>
      <button class="btn ghost sm" data-tinega="${pd.id}">Negar</button>`
      :pd.status==='aprovado'&&pd.tipo==='renovar'&&p?`<button class="btn ghost sm" data-renov="${p.id}">Renovar</button>`
      :pd.status==='aprovado'&&pd.tipo==='reforco'?`${s?`<button class="btn ghost sm" data-tineg="${s.id}">Negociar ${esc(s.nome)}</button>`:''}<button class="btn ghost sm" data-ir-merc="pedidos">Ver respostas</button>`:''}</div>
  </div>`;
}
function _cardInterf(t,x){
  const nomes=ids=>ids.map(i=>G.jogadores[i]).filter(Boolean);
  const vet=nomes(x.interf.vetos),exi=nomes(x.interf.exige);
  const chip=(p,k)=>`<span class="ti-int ${k}">${retrato(p,22)} ${esc(p.nome)}<button data-tiretira="${p.id}" title="Devolver a decisão ao técnico">×</button></span>`;
  const opts=t.elenco.map(P).filter(Boolean).sort((a,b)=>over(b)-over(a))
    .map(p=>`<option value="${p.id}">${esc(p.nome)} · ${p.role} · ${over(p)}${t.titulares.includes(p.id)?' · titular':''}</option>`).join('');
  return `<div class="card"><div class="eyebrow">Interferir na escalação</div>
    <p class="dim">Funciona, mas custa: cada veto ou exigência tira ${TEC_CUSTO_INTERF} de confiança${x.exige.naoInterferir?' (mais, porque ele assinou pedindo autonomia)':''} e meio ponto por semana enquanto valer. O vestiário percebe.</p>
    <div class="ti-int-l">${vet.map(p=>chip(p,'veto')).join('')}${exi.map(p=>chip(p,'exige')).join('')||''}${!vet.length&&!exi.length?'<span class="dim">Nenhuma interferência: quem escala é ele.</span>':''}</div>
    <div class="ti-int-f"><select id="tiIntJog">${opts}</select>
      <button class="btn ghost sm" data-tiint="veto">Vetar no cinco</button>
      <button class="btn ghost sm" data-tiint="exige">Exigir titular</button></div></div>`;
}
function vTecnico(){
  const t=meu();
  if(!t||!donoComTecnico())return `<div class="card"><p>Esta tela é do modo Dono puro e do Dono-técnico.</p></div>`;
  const x=tecIA(),tec=tecnicoAtual(t);
  const abertos=x.pedidos.filter(p=>p.status==='aberto'||p.status==='aprovado');
  const antigos=x.pedidos.filter(p=>!(p.status==='aberto'||p.status==='aprovado')).slice(0,6);
  const acoes=[];
  if(x.noBanco)acoes.push(`<button class="btn" id="tiContrata">Contratar um técnico e voltar à tribuna</button>`);
  else{
    if(tec)acoes.push(`<button class="btn ghost" id="tiDemite">Demitir ${esc(tec.nome)} <span class="dim">multa ${money(multaTecnico(tec))}</span></button>`);
    else acoes.push(`<button class="btn" id="tiContrata">Contratar um técnico</button>`);
    if(souHibrido())acoes.push(`<button class="btn ghost" id="tiBanco">Sentar no banco</button>`);
  }
  return `<div class="eyebrow">Modo ${esc(varianteDono(G.manager.variante).nome)}</div><h2 class="sec">Comando técnico</h2>
  <div class="card ti-hero" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    ${typeof cenaFoto==='function'?cenaFoto('cenas','sala-diretoria',t,{cls:'ti-fundo cn-direita',foco:'placa'}):''}
    <div class="ti-hero-c">${_cartaoTecnico(t,tec,x)}
      ${!x.noBanco&&tec?`<div class="ti-hero-d"><div class="eyebrow">Confiança dele em você</div>${_barraConf(x.confianca)}</div>`:''}</div>
    <div class="ti-acoes">${acoes.join('')}</div>
  </div>
  ${x.noBanco?'':_cardMandato(t,x)}
  ${x.noBanco?'':`<div class="grid g2">
    <div class="card"><div class="split"><div class="eyebrow">Pedidos do técnico</div><span class="dim">${G.janela?'janela aberta':'chegam com a janela aberta'}</span></div>
      ${abertos.length?abertos.map(_linhaPedido).join(''):'<p class="dim">Nada pendente. Durante a janela ele pede reforços, renovações e dispensas.</p>'}
      ${antigos.length?`<div class="eyebrow" style="margin-top:12px">Anteriores</div>${antigos.map(_linhaPedido).join('')}`:''}</div>
    ${_cardInterf(t,x)}</div>`}
  <div class="card"><div class="eyebrow">A relação</div>
    ${x.log.length?`<div class="ti-log">${x.log.slice(0,12).map(l=>`<div><span class="dim num">S${l.semana} ${l.ano}</span><span>${esc(l.txt)}</span>${l.d?`<b class="${l.d>0?'up':'dn'} num">${l.d>0?'+':''}${l.d}</b>`:'<b></b>'}</div>`).join('')}</div>`:'<p class="dim">Ainda nada registrado.</p>'}
    ${(x.balancos||[]).length?`<div class="eyebrow" style="margin-top:12px">Temporadas</div>${x.balancos.map(b=>`<div class="ti-bal"><b>${b.ano}</b><span>${esc(b.meta)}</span><span class="${b.cumpriu?'up':'dn'}">${b.pos}º de ${b.de}</span><span class="dim">${esc(b.noBanco?'você no banco':b.tecnico||'interino')}</span></div>`).join('')}`:''}
  </div>`;
}
function ligarTecnico(v){
  const b=(s,f)=>{const e=v.querySelector(s);if(e)e.onclick=f;};
  b('#tiMandato',()=>modalMandato());
  b('#tiContrata',()=>abrirEntrevista());
  b('#tiDemite',async()=>{
    const tec=tecnicoAtual();if(!tec)return;
    if(!await confirmar('Demitir '+tec.nome+'? Multa de '+money(multaTecnico(tec))+'. O auxiliar assume até você contratar outro.','Demitir'))return;
    const r=demitirTecnico();flash(r.ok?r.msg:r.erro);render();
  });
  b('#tiBanco',async()=>{
    const tec=tecnicoAtual();
    if(!await confirmar((tec?'Você demite '+tec.nome+' (multa de '+money(multaTecnico(tec))+') e ':'Você ')+'senta no banco. A torcida estranha e o vestiário passa a cobrar o dono pelos resultados.','Sentar no banco'))return;
    const r=assumirBanco();flash(r.ok?r.msg:r.erro);render();
  });
  v.querySelectorAll('[data-tiaprova]').forEach(e=>e.onclick=()=>{
    const pd=tecIA().pedidos.find(p=>p.id===e.dataset.tiaprova);
    const r=aprovarPedido(e.dataset.tiaprova);flash(r.ok?r.msg:r.erro);render();
    if(r.ok&&pd&&pd.tipo==='renovar'&&typeof modalRenovacao==='function')modalRenovacao(pd.jogadorId);
  });
  v.querySelectorAll('[data-tinega]').forEach(e=>e.onclick=()=>{const r=negarPedido(e.dataset.tinega);flash(r.ok?r.msg:r.erro);render();});
  v.querySelectorAll('[data-tineg]').forEach(e=>e.onclick=()=>modalNegociacao(e.dataset.tineg));
  v.querySelectorAll('.jlink[data-p]').forEach(e=>e.onclick=ev=>{ev.preventDefault();modalJogador(e.dataset.p);});
  v.querySelectorAll('[data-tiretira]').forEach(e=>e.onclick=()=>{const r=retirarInterferencia(e.dataset.tiretira);flash(r.msg);render();});
  v.querySelectorAll('[data-tiint]').forEach(e=>e.onclick=()=>{
    const pid=v.querySelector('#tiIntJog').value;
    const r=interferir(pid,e.dataset.tiint);flash(r.ok?r.msg:r.erro);render();
  });
}

/* ---------- o mandato ---------- */
function modalMandato(depois){
  const t=meu(),x=tecIA();if(!t)return;
  const md=x.mandato&&x.mandato.ano===G.ano?x.mandato:null;
  const metas=metasDoMandato(t);
  const desej=verbaDesejada(t), max=Math.max(desej*2,Math.round(Math.max(0,t.caixa)/5000)*5000,50000);
  const st={meta:md?md.meta:'realista',verba:md?md.verba:desej,diretriz:md?md.diretriz:'livre'};
  const tec=tecnicoAtual(t);
  const pinta=()=>{
    pintarModal(`<div class="ovl ti-ovl"><div class="box wide">
      <div class="eyebrow">Temporada ${G.ano} · ${esc(t.nome)}</div><h2 class="sec">O mandato do técnico</h2>
      <p class="dim">${tec?esc(tec.nome)+' trabalha em cima disto o ano todo. No fim da temporada a meta é conferida, e o que você prometeu pesa na confiança dele.':'Sem técnico contratado: o interino segue o mandato até você contratar alguém.'}${md&&G.semana>4?' <b class="dn">Mudar o mandato no meio da temporada custa confiança.</b>':''}</p>
      <div class="eyebrow" style="margin-top:12px">Meta esportiva</div>
      <div class="ti-op3">${metas.map(m=>`<button class="ti-op ${st.meta===m.id?'on':''}" data-mdmeta="${m.id}"><b>${esc(m.nome)}</b><span>${esc(m.texto)}</span><small class="dim">${esc(m.desc)}</small></button>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px">Verba de transferências</div>
      <label class="og-range"><span><b class="num" id="mdVerbaN">${money(st.verba)}</b> <span class="dim">· ele acha justo ${money(desej)}${x.exige.verbaMin?' · exigiu '+money(x.exige.verbaMin):''} · caixa ${money(t.caixa)}</span></span>
        <input type="range" id="mdVerba" min="0" max="${max}" step="5000" value="${Math.min(st.verba,max)}"></label>
      <div class="eyebrow" style="margin-top:14px">Diretriz</div>
      <div class="ti-op4">${DIRETRIZES_TEC.map(d=>`<button class="ti-op ${st.diretriz===d.id?'on':''}" data-mddir="${d.id}"><b>${esc(d.nome)}</b><small class="dim">${esc(d.desc)}</small></button>`).join('')}</div>
      <div class="og-pe">${depois?'':'<button class="btn ghost" id="mdFecha">Cancelar</button>'}<span class="og-pe-c"></span><button class="btn" id="mdOk">Entregar o mandato</button></div>
    </div></div>`);
    document.querySelectorAll('[data-mdmeta]').forEach(e=>e.onclick=()=>{st.meta=e.dataset.mdmeta;pinta();});
    document.querySelectorAll('[data-mddir]').forEach(e=>e.onclick=()=>{st.diretriz=e.dataset.mddir;pinta();});
    const r=$('#mdVerba');r.oninput=()=>{st.verba=+r.value;$('#mdVerbaN').textContent=money(st.verba);};
    const f=$('#mdFecha');if(f)f.onclick=()=>fechar();
    $('#mdOk').onclick=()=>{
      const res=definirMandato(st);
      $('#modal').innerHTML='';
      flash(res.ok?res.msg:res.erro);
      if(depois)depois();else render();
    };
  };
  pinta();
}

/* ---------- a entrevista (minigame) ----------
   Três candidatos, três perguntas para cada. As respostas revelam o
   estilo, o ego, as exigências e o salário; perguntar o que importa
   para ele faz o técnico chegar confiando mais em você. */
function abrirEntrevista(){
  const cands=candidatosTecnico();
  if(!cands.length){avisar('Nenhum técnico do mercado cabe no seu caixa agora.');return;}
  ENT={fichas:cands.map(fichaCandidato),atual:0,perg:cands.map(()=>[]),escolha:null};
  pintarEntrevista();
}
function pintarEntrevista(){
  const f=ENT.fichas[ENT.atual],m=f.m,perg=ENT.perg[ENT.atual];
  const resta=PERGUNTAS_POR_CANDIDATO-perg.length;
  const dados=perg.map(q=>respostaCandidato(f,q).dado).filter(Boolean);
  pintarModal(`<div class="ovl ti-ovl"><div class="box wide ti-ent">
    <div class="eyebrow">Entrevista · candidato ${ENT.atual+1} de ${ENT.fichas.length}</div><h2 class="sec">Contratar o técnico</h2>
    <div class="ti-ent-abas">${ENT.fichas.map((x,i)=>`<button class="${i===ENT.atual?'on':''}" data-entc="${i}">${retratoStaff(x.m,28)}<span>${esc(x.m.nome)}</span><small class="dim">${ENT.perg[i].length}/${PERGUNTAS_POR_CANDIDATO}</small></button>`).join('')}</div>
    <div class="ti-ent-g">
      <div class="ti-ent-c">${retratoStaff(m,96)}
        <h3>${esc(m.nome)} ${bandeira(m.pais)}</h3>
        <div class="ti-chips"><span class="ov ${ovClass(overStaff(m))}">${overStaff(m)}</span><span class="pill">${m.idade} anos</span>
          <span class="pill">${m.timeId?'no '+esc(tagT(m.timeId)):'livre'}</span></div>
        <div class="dim">${perg.includes('salario')?'Salário '+money(f.sal)+'/mês':'Salário entre '+money(f.salMin)+' e '+money(f.salMax)+'/mês'}${f.taxa?' · taxa '+money(f.taxa):''}</div>
        ${dados.length?`<ul class="ti-ent-d">${dados.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>`:'<p class="dim">Pergunte para conhecer.</p>'}
      </div>
      <div class="ti-ent-q">
        ${perg.map(q=>{const pq=PERGUNTAS_TEC.find(z=>z.id===q);return `<div class="ti-ent-r"><b>${esc(pq.txt)}</b><p>${esc(respostaCandidato(f,q).txt)}</p></div>`;}).join('')}
        ${resta>0?`<div class="eyebrow">${resta} pergunta${resta>1?'s':''} para ${esc(m.nome.split(' ')[0])}</div>
          <div class="ti-ent-ps">${PERGUNTAS_TEC.filter(q=>!perg.includes(q.id)).map(q=>`<button class="btn ghost sm" data-entq="${q.id}">${esc(q.txt)}</button>`).join('')}</div>`
          :'<p class="dim">Sem mais perguntas para ele.</p>'}
      </div>
    </div>
    <div class="og-pe"><button class="btn ghost" id="entFecha">Fechar</button><button class="btn ghost" id="entDelega">Deixar o diretor escolher</button>
      <span class="og-pe-c"></span><button class="btn" id="entContrata">Contratar ${esc(m.nome)}</button></div>
  </div></div>`);
  document.querySelectorAll('[data-entc]').forEach(e=>e.onclick=()=>{ENT.atual=+e.dataset.entc;pintarEntrevista();});
  document.querySelectorAll('[data-entq]').forEach(e=>e.onclick=()=>{ENT.perg[ENT.atual].push(e.dataset.entq);pintarEntrevista();});
  $('#entFecha').onclick=()=>{ENT=null;fechar();};
  $('#entDelega').onclick=()=>{const r=contratarTecnicoDelegado();ENT=null;$('#modal').innerHTML='';flash(r.ok?r.msg:r.erro);render();};
  $('#entContrata').onclick=async()=>{
    const f2=ENT.fichas[ENT.atual];
    const exig=[f2.verbaMin&&ENT.perg[ENT.atual].includes('precisa')?'verba mínima de '+money(f2.verbaMin):'',
      f2.naoInterferir&&(ENT.perg[ENT.atual].includes('precisa')||ENT.perg[ENT.atual].includes('cobranca'))?'não interferir':''].filter(Boolean);
    if(!await confirmar('Contratar '+f2.m.nome+' por '+money(f2.sal)+'/mês, dois anos'+(f2.taxa?', com taxa de '+money(f2.taxa):'')+'?'+(exig.length?' Ele exige '+exig.join(' e ')+'.':''),'Contratar')){pintarEntrevista();return;}
    const r=contratarTecnico(f2.m.id,ENT.perg[ENT.atual]);ENT=null;$('#modal').innerHTML='';
    flash(r.ok?r.msg+' Confiança de chegada: '+tecIA().confianca+'.':r.erro);render();
  };
}

/* ---------- Central e avisos ---------- */
function cardTecnicoIA(t){
  if(!t||!donoComTecnico())return '';
  const x=tecIA(),tec=tecnicoAtual(t);
  const abertos=x.pedidos.filter(p=>p.status==='aberto').length;
  const txt=x.noBanco?'Você está no banco: o time é seu.'
    :!tec?'Sem head coach. O interino segura o time até você contratar.'
    :mandatoPendente()?'Ele espera o mandato da temporada.'
    :abertos?abertos+' pedido'+(abertos>1?'s':'')+' esperando a sua resposta.'
    :rotuloConfTec(x.confianca)+'.';
  return `<div class="card ti-mini" data-ir-tela="tecnico">
    <div class="ti-mini-r">${x.noBanco&&typeof retratoManager==='function'?retratoManager(48):tec?retratoStaff(tec,48):`<div class="ti-vazio p">${icone('elenco')}</div>`}</div>
    <div class="ti-mini-c"><div class="eyebrow">Comando técnico</div><b>${esc(x.noBanco?G.manager.nome:tec?tec.nome:'Interino')}</b><span class="dim">${esc(txt)}</span></div>
    ${!x.noBanco&&tec?`<div class="ti-mini-g">${medidor('<span class="dim">confiança</span>',x.confianca/100,54)}</div>`:''}
  </div>`;
}
/* o menu do Dono com técnico: as telas de campo saem enquanto ele manda */
function navDono(base){
  if(!donoComTecnico())return base;
  const manda=tecnicoComanda(meu());
  const out=[];
  for(const it of base){
    if(manda&&(it[0]==='vestiario'||it[0]==='preparacao'))continue;
    out.push(it);
    if(it[0]==='inicio')out.push(['tecnico','Comando técnico','Clube','tatica']);
  }
  return out;
}

/* ---------- o balanço do mandato, no fim da temporada ---------- */
function modalBalancoTecnico(b){
  if(!b)return;
  const t=meu();
  abrir(`<div class="ti-balanco ${b.cumpriu?'bom':'ruim'}">
    <div class="eyebrow">${esc(b.clube)} · mandato ${b.ano}</div>
    <h2 class="sec">${b.cumpriu?'Meta cumprida':'Meta não cumprida'}</h2>
    <div class="ti-md">
      <div><span class="dim">Meta</span><b>${esc(b.meta)}</b></div>
      <div><span class="dim">Terminou</span><b class="${b.cumpriu?'up':'dn'}">${b.pos}º de ${b.de}</b></div>
      <div><span class="dim">${b.noBanco?'No banco':'Técnico'}</span><b>${esc(b.noBanco?G.manager.nome:b.tecnico||'interino')}</b>
        ${!b.noBanco&&b.tecnico?`<span class="dim">confiança ${Math.round(b.confAntes)} → ${Math.round(b.conf)}</span>`:''}</div>
    </div>
    <p class="dim" style="margin-top:12px">${b.noBanco?'O resultado é seu: você estava no banco.'
      :b.cumpriu?'O projeto andou. Ele começa a próxima temporada mais seguro do trabalho e de você.'
      :'Ficou abaixo do combinado. Você pode manter, rever o mandato ou trocar o comando em Comando técnico.'}
      A próxima temporada começa com um mandato novo.</p>
    <div class="og-pe"><span class="og-pe-c"></span>${t&&donoComTecnico()?'<button class="btn ghost" id="balIr">Comando técnico</button>':''}<button class="btn" id="balOk">Seguir</button></div>
  </div>`);
  const ir=$('#balIr');if(ir)ir.onclick=()=>{$('#modal').innerHTML='';irPara('tecnico');};
  $('#balOk').onclick=()=>fechar();
}
