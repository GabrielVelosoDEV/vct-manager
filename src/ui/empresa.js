/* ============================================================
   EMPRESA — a tela do dono como empresário (fase 4)
   ------------------------------------------------------------
   Quatro abas: Visão geral (valor de mercado, composição, fatias,
   alertas), Comercial (loja, itens, criadores), Dinheiro
   (empréstimos, investidores, aporte do seu bolso) e Conselho
   (as reuniões trimestrais). O núcleo mora em core/empresa.js.
   ============================================================ */
let empAba='geral';

function graficoValor(e){
  const W=760,H=200,pl=60,pr=14,pt=14,pb=24;
  const pts=e.hist.slice(-SEMANAS_ANO);
  if(pts.length<2)return '<p class="dim">O gráfico começa a desenhar depois da primeira semana.</p>';
  const vs=pts.map(x=>x.v);
  let mn=Math.min(...vs),mx=Math.max(...vs);const f=(mx-mn)*0.12||mx*0.05||100000;mn=Math.max(0,mn-f);mx+=f;
  const X=i=>pl+i/(pts.length-1)*(W-pl-pr),Y=v=>pt+(mx-v)/(mx-mn)*(H-pt-pb);
  const d=pts.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x.v).toFixed(1)).join(' ');
  const area=d+` L${X(pts.length-1).toFixed(1)} ${(H-pb).toFixed(1)} L${X(0).toFixed(1)} ${(H-pb).toFixed(1)} Z`;
  const ticks=[mn,(mn+mx)/2,mx];
  const marcas=pts.map((x,i)=>({x,i})).filter(o=>o.x.s===1||o.i===0||o.i===pts.length-1);
  const ult=pts[pts.length-1];
  return `<svg class="fin-graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Valor de mercado">
    <defs><linearGradient id="empG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--teal)" stop-opacity=".32"/><stop offset="1" stop-color="var(--teal)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="g"/><text x="${pl-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end" class="t">${money(v)}</text>`).join('')}
    ${marcas.map(o=>`<text x="${X(o.i).toFixed(1)}" y="${H-6}" text-anchor="${o.i===0?'start':o.i===pts.length-1?'end':'middle'}" class="t">S${o.x.s} ${o.x.a}</text>`).join('')}
    <path d="${area}" fill="url(#empG)"/><path d="${d}" class="real" style="stroke:var(--teal)"/>
    <circle cx="${X(pts.length-1).toFixed(1)}" cy="${Y(ult.v).toFixed(1)}" r="4.5" class="hoje"/>
  </svg>`;
}
function _alertasEmpresa(t,e){
  const out=[];
  if(e.negativas>0)out.push(`<div class="emp-alerta ruim">${icone('alerta')} <span>Caixa no vermelho há <b>${e.negativas}</b> semana${e.negativas>1?'s':''}. Com ${FALENCIA_SEMANAS} seguidas e sem crédito, a organização quebra${G.dificuldade==='facil'&&!e.interventor?' (no Fácil, um sócio-interventor salva uma vez)':''}.</span></div>`);
  const fs=fatiasDaOrg(t);
  if(fs.minha<0.5)out.push(`<div class="emp-alerta ${e.humor<HUMOR_CONTROLE+10?'ruim':''}">${icone('alerta')} <span>Você tem ${Math.round(fs.minha*100)}%: os outros sócios têm a maioria. Se o humor do conselho fechar o ano abaixo de ${HUMOR_CONTROLE}, ${e.avisoControle?'você é afastado':'vem um ultimato'}.</span></div>`);
  return out.join('');
}
function _abaGeral(t,e){
  const c=composicaoValor(t),fs=fatiasDaOrg(t);
  const ant=e.hist.find(x=>x.a===G.ano-1&&x.s===G.semana)||e.hist[0];
  const delta=ant?c.total-ant.v:0;
  const partes=[['Vaga na liga',c.vaga,'#4C8DFF'],['Elenco',c.elenco,'#9B6BFF'],['Marca',c.marca,'#E2B45A'],['Caixa',Math.max(0,c.caixa),'#18E5B4']];
  const soma=partes.reduce((s,x)=>s+x[1],0)||1;
  return `${_alertasEmpresa(t,e)}
  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi teal"><div class="lb">Valor de mercado</div><div class="vl">${money(c.total)}</div><div class="sb"><span class="${delta>=0?'up':'dn'}">${delta>=0?'+':''}${money(delta)}</span> desde ${ant?'S'+ant.s+' '+ant.a:'o início'}</div></div>
    <div class="kpi"><div class="lb">Caixa</div><div class="vl">${money(t.caixa)}</div><div class="sb">seu patrimônio: ${money(G.manager.patrimonio||0)}</div></div>
    <div class="kpi red"><div class="lb">Dívida</div><div class="vl">${money(-c.divida)}</div><div class="sb">crédito livre ${money(limiteEmprestimo(t))}</div></div>
    <div class="kpi"><div class="lb">Humor do conselho</div><div class="vl">${Math.round(e.humor)}</div><div class="sb">${e.humor>=65?'satisfeito':e.humor>=45?'atento':e.humor>=HUMOR_CONTROLE?'impaciente':'em revolta'}</div></div>
  </div>
  <div class="grid g2 fin-topo">
    <div class="card"><div class="eyebrow">Valor de mercado</div>${graficoValor(e)}</div>
    <div class="card"><div class="eyebrow">Do que é feito</div>
      <div class="fin-barra emp-barra">${partes.filter(x=>x[1]>0).map(x=>`<i style="width:${(x[1]/soma*100).toFixed(2)}%;background:${x[2]}" title="${esc(x[0])}: ${money(x[1])}"></i>`).join('')}</div>
      <div class="emp-comp">${partes.map(x=>`<div><i style="background:${x[2]}"></i><span>${esc(x[0])}</span><b class="num">${money(x[1])}</b></div>`).join('')}
        <div><i style="background:var(--red)"></i><span>Dívida</span><b class="num dn">${money(c.divida)}</b></div></div>
      <div class="eyebrow" style="margin-top:16px">Quem é dono</div>
      <div class="emp-fatias"><div class="emp-fbar"><i class="eu" style="width:${(fs.minha*100).toFixed(1)}%"></i>${fs.lista.map((x,i)=>`<i style="width:${(x.fatia*100).toFixed(1)}%;opacity:${0.85-i*0.12}" title="${esc(x.nome)}"></i>`).join('')}</div>
        <div class="emp-comp"><div><i style="background:var(--teal)"></i><span>${esc(G.manager.nome)} (você)</span><b class="num">${Math.round(fs.minha*100)}%</b></div>
        ${fs.lista.map(x=>`<div><i style="background:var(--line2)"></i><span>${esc(x.nome)} <span class="dim">${x.tipo==='socio'?'sócio da fusão':'investidor'+(x.meta?' · meta: '+esc(METAS_INVESTIDOR[x.meta].nome.toLowerCase()):'')}</span></span><b class="num">${Math.round(x.fatia*100)}%</b></div>`).join('')}</div></div>
    </div>
  </div>`;
}
function _abaComercial(t,e){
  const px=proximoNivelLoja(t);
  const linhas=[
    ['Patrocínio',receitaPatrocinio(t),'contratos com as marcas (Finanças)'],
    ['Aporte da liga',aporteLiga(t),t.tier===1?'o piso da franquia':'a ajuda do Challengers'],
    ['Loja e uniformes',receitaLojaAno(t)-custoLojaAno(t),e.loja?'nível '+e.loja+', líquido do custo':'sem loja aberta'],
    ['Itens do jogo',receitaItensAno(t),t.tier===1?'o repasse dos itens com a marca do clube':'só parceiras da liga recebem'],
    ['Conteúdo',receitaConteudoAno(t)-custoConteudoAno(t),e.criadores?e.criadores+' criador'+(e.criadores>1?'es':'')+', líquido dos salários':'nenhum criador contratado']
  ];
  return `<div class="grid g2">
    <div class="card"><div class="eyebrow">Receitas por ano, no ritmo de hoje</div>
      <table class="tb emp-rec">${linhas.map(l=>`<tr><td><b>${esc(l[0])}</b><div class="dim">${esc(l[2])}</div></td><td class="r num ${l[1]<0?'dn':''}">${money(l[1])}</td></tr>`).join('')}</table>
      <p class="dim">Em ${G.ano} até agora: loja ${money(e.receitas.loja)}, itens ${money(e.receitas.itens)}, conteúdo ${money(e.receitas.conteudo)}.</p></div>
    <div>
      <div class="card emp-linha"><div class="split"><div><div class="eyebrow">Loja oficial</div><b>${e.loja?'Nível '+e.loja+' de 3':'Fechada'}</b></div>
        ${px?`<button class="btn sm" id="empLoja">${e.loja?'Ampliar':'Abrir'} · ${money(px.custo)}</button>`:'<span class="chip up">no máximo</span>'}</div>
        <p class="dim">Camisa, moletom e coleção. Rende pela torcida; quanto maior a loja, mais vende (e mais custa manter). ${_bonusOrigem('loja')>1?'Sua origem ajuda: +'+Math.round((_bonusOrigem('loja')-1)*100)+'%.':''}</p></div>
      <div class="card emp-linha"><div class="split"><div><div class="eyebrow">Criadores de conteúdo</div><b>${e.criadores} de ${CRIADORES_MAX}</b></div>
        <div><button class="btn ghost sm" id="empCriMenos" ${e.criadores?'':'disabled'}>−</button> <button class="btn sm" id="empCriMais" ${e.criadores>=CRIADORES_MAX?'disabled':''}>Contratar · ${money(CRIADOR_SAL[t.tier===1?1:2])}/mês</button></div></div>
        <p class="dim">Lives, vídeos e bastidores. Cada um traz torcida nova toda semana e uma receita que cobre o salário com folga quando a torcida é grande.</p></div>
      <div class="card emp-linha"><div class="eyebrow">Itens do jogo</div>
        <p class="dim">${t.tier===1?'Parceiras da liga recebem uma parte da venda dos itens com a marca. Cresce com a torcida e com título.':'Só as parceiras da liga principal recebem. Suba para o Tier 1 para entrar.'}</p></div>
    </div></div>
    ${typeof comercialMiniHTML==='function'?comercialMiniHTML(t):''}`;
}
function _abaDinheiro(t,e){
  const lim=limiteEmprestimo(t), j=jurosEmprestimo();
  const fin=G.manager.divida&&G.manager.divida.saldo>0?G.manager.divida:null;
  return `<div class="grid g2">
    <div class="card"><div class="eyebrow">Empréstimo</div>
      <p class="dim">O banco empresta até ${Math.round(EMP_LIMITE*100)}% do valor da organização, menos o que você já deve. Juros de ${Math.round(j*100)}% por temporada; a parcela sai do caixa toda semana.</p>
      ${lim>0?`<label class="og-range"><span>Valor <b class="num" id="empEmpN">${money(Math.min(lim,Math.round(lim/2/5000)*5000))}</b> <span class="dim">· até ${money(lim)}</span></span>
        <input type="range" id="empEmpV" min="5000" max="${lim}" step="5000" value="${Math.min(lim,Math.round(lim/2/5000)*5000)}"></label>
        <div class="emp-prazos">${[1,2,3,4].map(p=>`<button class="btn ghost sm ${p===2?'on':''}" data-empprazo="${p}">${p} temporada${p>1?'s':''}</button>`).join('')}</div>
        <button class="btn" id="empEmp">Tomar empréstimo</button>`:'<p><b>Sem crédito agora.</b> A dívida já encosta no limite.</p>'}
      ${fin||e.emprestimos.length?`<div class="eyebrow" style="margin-top:14px">O que você deve</div>
        ${fin?`<div class="emp-div"><span>Financiamento da compra</span><span class="num">${money(fin.saldo)}</span><span class="dim num">${money(fin.parcela)}/sem.</span><span></span></div>`:''}
        ${e.emprestimos.map(x=>`<div class="emp-div"><span>Empréstimo de ${x.ano}</span><span class="num">${money(x.saldo)}</span><span class="dim num">${money(x.parcela)}/sem.</span><button class="btn ghost sm" data-empquita="${x.id}">Quitar</button></div>`).join('')}`:''}
    </div>
    <div class="card"><div class="split"><div class="eyebrow">Investidores</div><button class="btn ghost sm" id="empBusca">Apresentar aos investidores</button></div>
      <p class="dim">Um investidor compra uma fatia com dinheiro novo e, quase sempre, uma meta por temporada. Meta perdida azeda o conselho; se os outros sócios tiverem a maioria, o conselho pode afastar você.</p>
      ${e.ofertas.length?e.ofertas.map(o=>`<div class="emp-of"><div><b>${esc(o.nome)}</b><div class="dim">${Math.round(o.fatia*100)}% por <b class="num">${money(o.aporte)}</b> · ${o.silencioso?'sócio silencioso, sem meta':'meta: '+esc(METAS_INVESTIDOR[o.meta].texto.toLowerCase())}</div></div>
        <button class="btn sm" data-empaceita="${o.id}">Aceitar</button></div>`).join(''):'<p class="dim">Nenhuma proposta na mesa.</p>'}
      ${e.investidores.length?`<div class="eyebrow" style="margin-top:14px">Na sociedade</div>${e.investidores.map(i=>`<div class="emp-of"><div><b>${esc(i.nome)}</b> <span class="dim">${Math.round(i.fatia*100)}% · entrou em ${i.ano} com ${money(i.aporte)}</span>
        <div class="dim">${i.meta?'Meta: '+esc(METAS_INVESTIDOR[i.meta].texto.toLowerCase())+(i.falhas?' · <span class="dn">'+i.falhas+' temporada(s) perdida(s)</span>':''):'Sem meta'}</div></div>
        ${i.id==='interv'?'':`<button class="btn ghost sm" data-emprecompra="${i.id}">Recomprar</button>`}</div>`).join('')}`:''}
    </div>
    <div class="card"><div class="eyebrow">Do seu bolso</div>
      <p class="dim">Seu patrimônio pessoal é <b class="num">${money(G.manager.patrimonio||0)}</b>${G.manager.origem==='herdeiro'?' (a família repõe '+money(1200000)+' todo começo de ano)':''}. Pôr dinheiro seu no clube não dilui ninguém e acalma o conselho.</p>
      ${(G.manager.patrimonio||0)>=5000?`<label class="og-range"><span>Aporte <b class="num" id="empApN">${money(Math.min(G.manager.patrimonio,500000))}</b></span>
        <input type="range" id="empApV" min="5000" max="${Math.round(G.manager.patrimonio/5000)*5000}" step="5000" value="${Math.min(Math.round(G.manager.patrimonio/5000)*5000,500000)}"></label>
        <button class="btn ghost" id="empAp">Aportar no clube</button>`:''}</div>
  </div>`;
}
function _abaConselho(t,e){
  if(!e.reunioes.length)return `<div class="card"><p class="dim">O conselho se reúne no fim de cada trimestre (semanas 13, 26, 39 e 52): balanço, humor dos sócios e até três decisões.</p></div>`;
  return e.reunioes.map(r=>`<div class="card emp-reu"><div class="split"><div class="eyebrow">${r.tri}º trimestre de ${r.ano}</div><span class="dim">humor ${r.humor} (${r.delta>=0?'+':''}${r.delta})</span></div>
    <div class="emp-reu-n"><span>Valor <b class="num">${money(r.valor)}</b></span><span>Resultado <b class="num ${r.resultado<0?'dn':'up'}">${money(r.resultado)}</b></span><span>Caixa <b class="num">${money(r.caixa)}</b></span></div>
    ${r.cartas.map(c=>`<div class="emp-reu-c"><b>${esc(c.titulo)}</b><span class="${r.decisoes[c.id]==null?'dim':r.decisoes[c.id]?'up':''}">${r.decisoes[c.id]==null?'sem decisão':r.decisoes[c.id]?esc(c.sim):esc(c.nao)}</span></div>`).join('')}
    ${(r.metas||[]).map(m=>`<div class="emp-reu-c"><span>${esc(m.nome)}: ${esc(m.texto.toLowerCase())}</span><span class="${m.ok?'up':'dn'}">${m.ok?'cumprida':'perdida'}</span></div>`).join('')}
    ${r.ultimato?'<div class="emp-alerta ruim">Ultimato: mais um ano assim e você é afastado.</div>':''}</div>`).join('');
}
function vEmpresa(){
  const t=meu();
  if(!t||!empresaAtiva())return `<div class="card"><p>A empresa é do modo Dono puro e do Dono-técnico.</p></div>`;
  const e=empresa();
  if(e.perdeu)return telaFimDono(e.perdeu);
  const abas=[['geral','Visão geral','grafico'],['comercial','Comercial','pasta'],['dinheiro','Dinheiro','dinheiro'],['conselho','Conselho','predio']];
  const corpo={geral:_abaGeral,comercial:_abaComercial,dinheiro:_abaDinheiro,conselho:_abaConselho}[empAba]||_abaGeral;
  return `${typeof cabecalhoDono==='function'?cabecalhoDono('Escritório · '+t.nome,'Empresa','Valor de mercado, receitas, dinheiro de fora e o conselho de sócios. Aqui é onde a organização vira negócio.','grafico')
      :`<div class="eyebrow">Gestão · ${esc(t.nome)}</div><h2 class="sec">Empresa</h2>`}
    <div class="tabs emp-abas">${abas.map(([k,n,i])=>`<button class="${empAba===k?'on':''}" data-empaba="${k}">${icone(i)}${n}</button>`).join('')}</div>
    ${corpo(t,e)}`;
}
function ligarEmpresa(v){
  const b=(s,f)=>{const x=v.querySelector(s);if(x)x.onclick=f;};
  const fl=r=>{flash(r.ok?r.msg:r.erro);render();};
  b('#fimMenu',()=>sairParaMenu());
  v.querySelectorAll('[data-empaba]').forEach(x=>x.onclick=()=>{empAba=x.dataset.empaba;render();});
  b('#empLoja',()=>fl(melhorarLoja()));
  b('#empCriMais',()=>fl(mudarCriadores(1)));
  b('#empCriMenos',()=>fl(mudarCriadores(-1)));
  let prazo=2;
  v.querySelectorAll('[data-empprazo]').forEach(x=>x.onclick=()=>{prazo=+x.dataset.empprazo;v.querySelectorAll('[data-empprazo]').forEach(y=>y.classList.toggle('on',y===x));});
  const rg=v.querySelector('#empEmpV');if(rg)rg.oninput=()=>{v.querySelector('#empEmpN').textContent=money(+rg.value);};
  b('#empEmp',async()=>{const val=+rg.value,j=jurosEmprestimo();
    if(!await confirmar('Tomar '+money(val)+' em '+prazo+' temporada(s)? Você devolve '+money(Math.round(val*(1+j*prazo)))+'.','Tomar'))return;fl(tomarEmprestimo(val,prazo));});
  v.querySelectorAll('[data-empquita]').forEach(x=>x.onclick=()=>fl(quitarEmprestimo(x.dataset.empquita)));
  b('#empBusca',()=>typeof abrirPitch==='function'?abrirPitch():fl(buscarInvestidores()));
  v.querySelectorAll('[data-empaceita]').forEach(x=>x.onclick=async()=>{
    const o=empresa().ofertas.find(z=>z.id===x.dataset.empaceita);if(!o)return;
    if(!await confirmar(o.nome+' entra com '+money(o.aporte)+' por '+Math.round(o.fatia*100)+'% da organização. Você fica com '+Math.round((fatiasDaOrg().minha-o.fatia)*100)+'%.','Aceitar'))return;
    fl(aceitarOferta(o.id));});
  v.querySelectorAll('[data-emprecompra]').forEach(x=>x.onclick=async()=>{
    if(!await confirmar('Recomprar a fatia com dinheiro do seu patrimônio, pagando 15% acima do valor de mercado?','Recomprar'))return;
    fl(recomprarFatia(x.dataset.emprecompra));});
  const ap=v.querySelector('#empApV');if(ap)ap.oninput=()=>{v.querySelector('#empApN').textContent=money(+ap.value);};
  b('#empAp',()=>fl(aportePessoal(+ap.value)));
}

/* ---------- a reunião do conselho ---------- */
function modalConselho(r,depois){
  const t=meu();
  const fim=()=>{$('#modal').innerHTML='';if(depois)depois();else render();};
  const pinta=()=>{
    abrir(`<div class="emp-cons">
      ${t&&typeof cenaFoto==='function'?cenaFoto('cenas','sala-diretoria',t,{cls:'emp-cons-f cn-direita',foco:'placa'}):''}
      <div class="emp-cons-c">
      <div class="eyebrow">${esc(t?t.nome:'')} · ${r.tri}º trimestre de ${r.ano}</div><h2 class="sec">Reunião do conselho</h2>
      <div class="emp-reu-n"><span>Valor <b class="num">${money(r.valor)}</b> <small class="${r.valor>=r.valorAntes?'up':'dn'}">${r.valor>=r.valorAntes?'+':''}${money(r.valor-r.valorAntes)}</small></span>
        <span>Resultado do trimestre <b class="num ${r.resultado<0?'dn':'up'}">${money(r.resultado)}</b></span>
        <span>Humor <b class="num">${empresa().humor}</b> <small class="${r.delta>=0?'up':'dn'}">${r.delta>=0?'+':''}${r.delta}</small></span></div>
      ${(r.metas||[]).length?`<div class="eyebrow" style="margin-top:12px">Metas dos investidores</div>${r.metas.map(m=>`<div class="emp-reu-c"><span>${esc(m.nome)}: ${esc(m.texto.toLowerCase())}</span><span class="${m.ok?'up':'dn'}">${m.ok?'cumprida':'perdida'+(m.falhas>=2?' de novo':'')}</span></div>`).join('')}`:''}
      ${r.ultimato?'<div class="emp-alerta ruim">Ultimato: os outros sócios têm a maioria e perderam a paciência. Mais um ano assim e você é afastado.</div>':''}
      <div class="eyebrow" style="margin-top:14px">Decisões</div>
      <div class="emp-cartas">${r.cartas.map(c=>{const d=r.decisoes[c.id];return `<div class="emp-carta ${d==null?'':d?'sim':'nao'}">
        <b>${esc(c.titulo)}</b><p>${esc(c.txt)}</p>
        ${d==null?`<div class="emp-carta-a"><button class="btn sm" data-cs="${c.id}">${esc(c.sim)}</button><button class="btn ghost sm" data-cn="${c.id}">${esc(c.nao)}</button></div>`
          :`<span class="chip ${d?'up':''}">${esc(d?c.sim:c.nao)}</span>`}</div>`;}).join('')}</div>
      <div class="og-pe"><span class="og-pe-c dim">Carta sem decisão conta como recusada.</span><button class="btn" id="consFim">Encerrar a reunião</button></div>
    </div></div>`,true);
    document.querySelectorAll('[data-cs]').forEach(x=>x.onclick=()=>{decidirCarta(r,x.dataset.cs,true);pinta();});
    document.querySelectorAll('[data-cn]').forEach(x=>x.onclick=()=>{decidirCarta(r,x.dataset.cn,false);pinta();});
    $('#consFim').onclick=()=>{for(const c of r.cartas)if(r.decisoes[c.id]==null)decidirCarta(r,c.id,false);fim();};
  };
  pinta();
}

/* ---------- perder o time ---------- */
function telaFimDono(f){
  return `<div class="card emp-fim"><div class="eyebrow">${esc(f.clube)} · ${f.ano}</div>
    <h2 class="sec">${f.motivo==='falencia'?'A organização quebrou':'Você foi afastado'}</h2>
    <p>${f.motivo==='falencia'?'Oito semanas no vermelho, sem crédito e sem quem cobrisse. A organização foi para a administração judicial e você perdeu o time.'
      :'Os outros sócios tinham a maioria e o conselho perdeu a paciência. Os investidores assumiram o controle e você perdeu o time.'}</p>
    <div class="emp-reu-n"><span>Temporadas no comando <b class="num">${Math.max(1,f.anos+1)}</b></span><span>Valor no fim <b class="num">${money(f.valor)}</b></span><span>Maior valor <b class="num">${money(f.pico)}</b></span></div>
    <p class="dim">A carreira de dono acaba aqui. O save continua aberto para consulta; para jogar de novo, comece uma carreira nova no menu principal.</p>
    <button class="btn" id="fimMenu">Voltar ao menu principal</button></div>`;
}
function modalFimDono(f){
  abrir(telaFimDono(f));
  const b=$('#fimMenu');if(b)b.onclick=()=>{$('#modal').innerHTML='';sairParaMenu();};
}
function modalAvisoEmpresa(a){
  if(a.tipo==='interventor')return avisar('Um sócio-interventor cobriu o rombo com '+money(a.aporte)+' e ficou com 25% da organização. Isso só acontece uma vez.','Salvo da falência');
  return avisar('O caixa está no vermelho há '+a.semanas+' semanas. Mais '+a.faltam+' e, sem crédito, a organização quebra e você perde o time. Saídas: empréstimo, aporte do seu bolso, investidor ou venda de jogador (Empresa › Dinheiro).','Risco de falência');
}
function cardEmpresa(t){
  if(!t||!empresaAtiva())return '';
  const e=empresa(),c=composicaoValor(t);
  const ant=e.hist.length>4?e.hist[e.hist.length-5]:null;
  return `<div class="card ti-mini emp-mini" data-ir-tela="empresa">
    <div class="ti-mini-r"><div class="emp-ic">${icone('grafico')}</div></div>
    <div class="ti-mini-c"><div class="eyebrow">Valor de mercado</div><b class="num">${money(c.total)}</b>
      <span class="dim">${ant?`<span class="${c.total>=ant.v?'up':'dn'}">${c.total>=ant.v?'+':''}${money(c.total-ant.v)}</span> em quatro semanas · `:''}humor do conselho ${Math.round(e.humor)}${e.negativas?' · <span class="dn">caixa no vermelho há '+e.negativas+' sem.</span>':''}</span></div>
  </div>`;
}
