/* ============================================================
   EDITOR — banco de dados do mundo
   ------------------------------------------------------------
   Seis abas: Times, Jogadores, Sem clube, Imagens, Importar e
   Validação. As operações de dados moram em core/editar.js;
   aqui só desenha e liga eventos.
   ============================================================ */
let edTime=null,edModo='substituir',edSaida='';
let edAba='times';
let edFiltro={busca:'',role:'',reg:'',time:'',status:'todos',ordem:'over'};
let edFeedImg='';

const ED_ABAS=[['times','Times'],['jogadores','Jogadores'],['livres','Sem clube'],
               ['comissao','Comissão'],['torneios','Torneios'],['patrocinadores','Patrocinadores'],
               ['agentes','Agentes'],['imagens','Imagens'],
               ['io','Importar / Exportar'],['validar','Validação']];

/* ---------- helpers ---------- */
function edTimesOrdenados(){
  const out=[];
  REGIONS.forEach(R=>{
    out.push({grupo:R.nome,ids:G.regioes[R.id].t1.slice()});
    out.push({grupo:R.t2,ids:G.regioes[R.id].t2.slice()});
  });
  return out;
}
function edSelectTimes(attrs,atual,livre){
  const grupos=edTimesOrdenados().map(g=>
    `<optgroup label="${esc(g.grupo)}">`+
    g.ids.map(id=>`<option value="${id}" ${id===atual?'selected':''}>${esc(T(id).nome)} (${esc(T(id).tag)})</option>`).join('')+
    `</optgroup>`).join('');
  return `<select ${attrs}>${livre?`<option value="" ${!atual?'selected':''}>— Sem clube —</option>`:''}${grupos}</select>`;
}
function edChip(p){
  const t=p.timeId?T(p.timeId):null;
  return t?`<span class="linha-t">${escudo(t,18)}<span class="dim">${esc(t.tag)}</span></span>`
          :'<span class="chip t">Sem clube</span>';
}
function edLinhaAcoes(p){
  return `<td class="r nowrap">
    <button class="btn ghost sm" data-edp="${p.id}">Editar</button>
    ${p.timeId?`<button class="btn ghost sm" data-edlivre="${p.id}" title="Manda para o mercado">Sem clube</button>`:''}
    <button class="btn ghost sm" data-eddel="${p.id}" title="Apaga da base">✕</button></td>`;
}

/* ============================================================
   ABA TIMES
   ============================================================ */
function edvTimes(){
  if(!edTime||!G.times[edTime])edTime=G.meuTime||G.regioes[REGIONS[0].id].t1[0];
  const t=G.times[edTime];
  const chaveImg=Imgs.chaveTime(t.tag);
  const temImg=Imgs.tem(chaveImg);
  const folha=t.elenco.reduce((s,i)=>s+P(i).salario,0);

  const linhas=t.elenco.map(id=>{
    const p=P(id),tit=t.titulares.includes(id);
    return `<tr class="${tit?'me':''}">
      <td>${retrato(p,30)}</td>
      <td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}${tit?' <span class="chip">Titular</span>':''}${p.igl?' <span class="pill">IGL</span>':''}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td>
      <td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td>
      <td class="c num dim">${p.pot}</td>
      <td class="c num">${p.contrato}a</td>
      <td class="r num">${money(p.salario)}</td>
      <td>${edSelectTimes('data-edmover="'+p.id+'" style="max-width:150px"',p.timeId,true)}</td>
      ${edLinhaAcoes(p)}</tr>`;}).join('');

  const mapas=MAP_POOL.map(m=>`<label class="mp"><span>${m}</span>
    <input type="number" data-edmap="${m}" value="${t.mapPref[m]||0}" min="-8" max="8" step="1"></label>`).join('');

  return `
  <div class="card"><div class="split">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      ${escudo(t,40)}
      ${edSelectTimes('id="edSel" style="min-width:280px"',edTime,false)}
    </div>
    <span class="dim num">${t.elenco.length} no elenco · folha ${money(folha)}/mês</span>
  </div></div>

  <div class="grid g2">
    <div class="card flat"><div class="eyebrow">Identidade e liga</div>
      <div class="campos">
        <label>Nome<input type="text" id="edNome" value="${esc(t.nome)}"></label>
        <label>Tag<input type="text" id="edTag" value="${esc(t.tag)}" maxlength="5"></label>
        <label>Região<select id="edRegiao">${REGIONS.map(r=>
          `<option value="${r.id}" ${t.regiao===r.id?'selected':''}>${esc(r.nome)}</option>`).join('')}</select></label>
        <label>Divisão<select id="edTier">
          <option value="1" ${t.tier===1?'selected':''}>Liga principal (Tier 1)</option>
          <option value="2" ${t.tier===2?'selected':''}>Challengers (Tier 2)</option></select></label>
        <label>Prestígio<input type="number" id="edPrest" value="${Math.round(t.prestigio)}" min="20" max="99"></label>
        <label>País da sede${selectPais('id="edPaisClube"',paisDoClube(t)||'')}
          <span class="dim" style="font-size:11px">decide a torcida de base — pesa mais no Tier 2,
          onde o prestígio é igual para todos</span></label>
        <label>Entrosamento<input type="number" id="edSin" value="${Math.round(t.sinergia)}" min="0" max="100"></label>
        <label>Caixa<input type="number" id="edCaixa" value="${Math.round(t.caixa)}" step="10000"></label>
        <label>Patrocínio anual<input type="number" id="edPatroc" value="${Math.round(t.patroc)}" step="10000"></label>
      </div>
      <p class="dim" style="margin-top:8px">Trocar região ou divisão move o time nos índices das ligas.
      O calendário espera 12 na principal e 8 no Challengers — a aba Validação cobra isso.</p>
    </div>

    <div class="card flat"><div class="eyebrow">Comissão técnica e estrutura</div>
      <div class="campos">
        ${[['tecnico','Head coach'],['analista','Analista'],['mental','Preparador mental']].map(([k,n])=>
          `<label>${n}<input type="number" data-edstaff="${k}" value="${t.staff[k]}" min="1" max="5"></label>`).join('')}
        ${[['gh','Gaming house'],['treino','Centro de treino'],['academia','Academia de base']].map(([k,n])=>
          `<label>${n}<input type="number" data-edest="${k}" value="${t.estrutura[k]}" min="1" max="5"></label>`).join('')}
      </div>
      <div class="eyebrow" style="margin-top:14px">Escudo</div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-top:6px">
        <img src="${ASSETS.logo(t)}" width="64" height="64" alt=""
          style="border:1px solid var(--line);background:var(--paper2)"
          onerror="this.onerror=null;this.src='${monogramaTime(t.tag,64)}'">
        <div style="flex:1">
          <div class="dropzone sm" id="edDropLogo">Arraste um PNG aqui ou
            <label class="lk">escolha o arquivo<input type="file" id="edFileLogo" accept="image/*" style="display:none"></label>
          </div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap">
            <span class="chip ${temImg?'t':'g'}">${temImg?'no pacote':'sem imagem'}</span>
            ${temImg?`<button class="btn ghost sm" data-edimgdel="${chaveImg}">Remover do pacote</button>`:''}
          </div>
          <label style="margin-top:8px;display:block">Caminho manual (opcional)
            <input type="text" id="edLogo" value="${esc(t.logo||'')}" placeholder="${esc(ASSETS.arq('logos',t.tag))}"></label>
        </div>
      </div>
    </div>
  </div>

  <div class="card flat"><div class="eyebrow">Afinidade de mapa · −8 a +8</div>
    <div class="mapgrid">${mapas}</div></div>

  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px">
    <button class="btn" id="edSalvarT">Aplicar alterações do time</button>
    <button class="btn ghost" id="edAdd">Adicionar jogador</button>
    <button class="btn ghost" id="edPreencher5">Preencher até 5</button>
    <button class="btn ghost" id="edPreencher7">Preencher até 7</button>
    <button class="btn ghost" id="edAuto">Escalação automática</button>
  </div>

  <div class="card flat"><div class="eyebrow">Elenco do ${esc(t.tag)}</div>
    <table class="wide"><thead><tr><th></th><th>Nick</th><th>Função</th><th class="c">Idade</th>
      <th class="c">Over</th><th class="c">Pot</th><th class="c">Contr.</th><th class="r">Salário</th>
      <th>Clube</th><th class="r">Ações</th></tr></thead>
      <tbody>${linhas||'<tr><td colspan="10" class="dim">Elenco vazio.</td></tr>'}</tbody></table>
    <p class="dim" style="margin-top:8px">O select de clube move o jogador na hora, inclusive para
    <b>Sem clube</b> — de onde qualquer time pode contratá-lo no Mercado.</p></div>`;
}

/* ============================================================
   ABA JOGADORES — busca global
   ============================================================ */
function edvJogadores(){
  let lista=Object.values(G.jogadores);
  const f=edFiltro;
  if(f.status==='livres')lista=lista.filter(p=>!p.timeId);
  if(f.status==='clube')lista=lista.filter(p=>p.timeId);
  if(f.time)lista=lista.filter(p=>p.timeId===f.time);
  if(f.role)lista=lista.filter(p=>p.role===f.role);
  if(f.reg)lista=lista.filter(p=>p.timeId?T(p.timeId).regiao===f.reg:p.regiaoOrigem===f.reg);
  if(f.busca){const q=f.busca.toLowerCase();lista=lista.filter(p=>p.nome.toLowerCase().includes(q));}
  const total=lista.length;
  lista.sort((a,b)=>f.ordem==='over'?over(b)-over(a)
    :f.ordem==='pot'?b.pot-a.pot
    :f.ordem==='idade'?a.idade-b.idade
    :a.nome.localeCompare(b.nome));
  const corte=lista.slice(0,80);

  return `
  <div class="card flat"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="text" id="edfBusca" placeholder="Buscar nick" value="${esc(f.busca)}" style="width:170px">
    <select id="edfStatus">${[['todos','Todos'],['clube','Com clube'],['livres','Sem clube']]
      .map(([k,n])=>`<option value="${k}" ${f.status===k?'selected':''}>${n}</option>`).join('')}</select>
    <select id="edfRole"><option value="">Todas as funções</option>${ROLES.map(r=>
      `<option ${f.role===r?'selected':''}>${r}</option>`).join('')}</select>
    <select id="edfReg"><option value="">Todas as regiões</option>${REGIONS.map(r=>
      `<option value="${r.id}" ${f.reg===r.id?'selected':''}>${esc(r.nome)}</option>`).join('')}</select>
    ${edSelectTimes('id="edfTime" style="max-width:200px"',f.time,true).replace('— Sem clube —','— Qualquer clube —')}
    <select id="edfOrdem">${[['over','Over'],['pot','Potencial'],['idade','Idade'],['nome','Nome']]
      .map(([k,n])=>`<option value="${k}" ${f.ordem===k?'selected':''}>Ordenar por ${n.toLowerCase()}</option>`).join('')}</select>
    <span class="dim num">${total} encontrado(s)${total>80?' · mostrando 80':''}</span>
  </div></div>

  <div class="card flat"><table class="wide"><thead><tr><th></th><th>Nick</th><th>Clube</th><th>Função</th>
    <th class="c">Idade</th><th class="c">País</th><th class="c">Over</th><th class="c">Pot</th>
    <th class="r">Valor</th><th>Mover para</th><th class="r">Ações</th></tr></thead>
    <tbody>${corte.map(p=>`<tr>
      <td>${retrato(p,28)}</td>
      <td><b>${esc(p.nome)}</b></td>
      <td>${edChip(p)}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td>
      <td class="c num">${p.idade}</td>
      <td class="c">${FLAG[p.pais]||''} <span class="dim num">${esc(p.pais)}</span></td>
      <td class="c">${ovTag(p)}</td>
      <td class="c num dim">${p.pot}</td>
      <td class="r num">${money(p.valor)}</td>
      <td>${edSelectTimes('data-edmover="'+p.id+'" style="max-width:150px"',p.timeId,true)}</td>
      ${edLinhaAcoes(p)}</tr>`).join('')||'<tr><td colspan="11" class="dim">Nada encontrado.</td></tr>'}
    </tbody></table></div>`;
}

/* ============================================================
   ABA SEM CLUBE
   ============================================================ */
function edvLivres(){
  const livres=G.livres.map(P).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const porRegiao={};
  livres.forEach(p=>{const r=p.regiaoOrigem||'—';porRegiao[r]=(porRegiao[r]||0)+1;});
  return `
  <div class="card"><div class="eyebrow">Mercado de agentes livres</div>
    <p class="dim">Jogador sem clube fica visível no Mercado para você e para a IA: qualquer time pode
    contratá-lo sem taxa de transferência, e no offseason a IA usa essa lista para repor elenco.
    É aqui que ficam os jogadores que você tirou de um time sem colocar em outro.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px">
      <span class="pill">${livres.length} sem clube</span>
      ${REGIONS.map(r=>`<span class="pill">${esc(r.id)}: ${porRegiao[r.id]||0}</span>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn" id="edNovoLivre">Criar jogador sem clube</button>
    </div>
  </div>
  <div class="card flat"><table class="wide"><thead><tr><th></th><th>Nick</th><th>Função</th>
    <th class="c">Idade</th><th class="c">País</th><th class="c">Over</th><th class="c">Pot</th>
    <th class="r">Salário pedido</th><th>Contratar por</th><th class="r">Ações</th></tr></thead>
    <tbody>${livres.map(p=>`<tr>
      <td>${retrato(p,28)}</td>
      <td><b>${esc(p.nome)}</b></td>
      <td><span class="tag ${p.role}">${p.role}</span></td>
      <td class="c num">${p.idade}</td>
      <td class="c">${FLAG[p.pais]||''}</td>
      <td class="c">${ovTag(p)}</td>
      <td class="c num dim">${p.pot}</td>
      <td class="r num">${money(p.salario)}</td>
      <td>${edSelectTimes('data-edmover="'+p.id+'" style="max-width:150px"',null,true)}</td>
      ${edLinhaAcoes(p)}</tr>`).join('')||'<tr><td colspan="10" class="dim">Ninguém sem clube.</td></tr>'}
    </tbody></table></div>`;
}

/* ============================================================
   ABA TORNEIOS
   ============================================================ */
function edvTorneios(){
  if(!G.torneios)montarTorneios();
  const grupos=[{k:'INT',rot:'Internacional'},
    ...REGIONS.map(R=>({k:R.id,rot:R.nome+' e '+R.t2}))];
  const linha=t=>{
    const cat=categoriaTorneio(t.id);
    const p=premiosDoStage({torneioId:t.id});
    return `<tr>
      <td>${arteTorneio(t,34)}</td>
      <td><input type="text" value="${esc(t.nome)}" data-tnome="${esc(t.id)}" style="width:230px"></td>
      <td><input type="text" value="${esc(t.curto)}" data-tcurto="${esc(t.id)}" style="width:100px" maxlength="14"></td>
      <td class="c"><span class="chip ${t.tier===1?'':'g'}">Tier ${t.tier}</span></td>
      <td class="r"><input type="number" value="${t.premio}" data-tpremio="${esc(t.id)}" step="5000" style="width:110px"></td>
      <td class="r num dim">${p.length?money(p[0])+' · '+money(p[1]||0):'não premia'}</td>
      <td class="r nowrap">
        <label class="lk">arte<input type="file" accept="image/*" data-tarte="${esc(t.id)}" style="display:none"></label>
        ${Imgs.tem(Imgs.chaveTorneio(t.id))?`<button class="btn ghost sm" data-edimgdel="${esc(Imgs.chaveTorneio(t.id))}">✕</button>`:''}
      </td></tr>`;};
  return `
  <div class="card"><div class="eyebrow">Catálogo de competições</div>
    <p class="dim">O calendário é remontado a cada temporada, então nome e arte não podem morar
    nos confrontos — eles vivem aqui, com chave estável. Renomear vale <b>na hora</b>, inclusive
    na temporada em andamento e nos títulos que ainda vão ser conquistados.</p>
    <p class="dim" style="margin-top:8px">O prêmio é o que o <b>campeão</b> leva; as demais colocações
    saem da curva da categoria. Zero significa fase sem premiação — os pontos corridos não pagam,
    quem paga é o mata-mata que vem depois. Mexer aqui muda o dinheiro que entra no circuito.</p>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <button class="btn" id="edSalvarTor">Aplicar alterações</button>
      <span class="dim">Arte normalizada em ${Imgs.formatos.arte[0]}×${Imgs.formatos.arte[1]} PNG.
      Em lote, o arquivo tem de se chamar como o id: <code>champions.png</code>, <code>kickoff_amer.png</code>.</span>
    </div>
  </div>
  ${grupos.map(g=>{
    const itens=Object.values(G.torneios).filter(t=>t.escopo===g.k);
    if(!itens.length)return '';
    return `<div class="card flat"><div class="eyebrow">${esc(g.rot)}</div>
      <table class="wide"><thead><tr><th></th><th>Nome</th><th>Curto</th><th class="c">Divisão</th>
        <th class="r">Prêmio do campeão</th><th class="r">Campeão · vice</th><th class="r">Arte</th></tr></thead>
      <tbody>${itens.map(linha).join('')}</tbody></table></div>`;}).join('')}`;
}

/* ============================================================
   ABA AGENTES
   ============================================================ */
function edvAgentes(){
  if(!G.agentes)montarAgentes();
  const lista=todosAgentes();
  const usoDe=nome=>Object.values(G.jogadores).filter(p=>p.agentes.includes(nome)).length;
  return `
  <div class="card"><div class="eyebrow">Agentes do jogo</div>
    <p class="dim">A lista de agentes é da run, não do arquivo de dados: dá para acompanhar
    lançamento sem editar <code>data/mundo.js</code>. Cada jogador sorteia de dois a quatro
    agentes da função dele, então tirar um agente não mexe em quem já o tinha.</p>
    <p class="dim" style="margin-top:8px">Retrato normalizado em ${Imgs.formatos.agente[0]}×${Imgs.formatos.agente[1]} PNG,
    proporção 4:5 — o enquadramento das artes oficiais. Em lote, o arquivo é o nome do agente:
    <code>jett.png</code>, <code>kayo.png</code>.</p>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <input type="text" id="agNovo" placeholder="Nome do agente" style="width:180px">
      <select id="agNovoRole">${ROLES.map(r=>`<option>${r}</option>`).join('')}</select>
      <button class="btn" id="agAdd">Adicionar agente</button>
      <span class="dim">${lista.length} agentes em ${ROLES.length} funções</span>
    </div>
  </div>
  <div class="card flat"><div class="eyebrow">Elenco de agentes</div>
    <div class="aggrid">${lista.map(a=>`
      <div class="agcard">
        ${retratoAgente(a.nome,54)}
        <div class="n">
          <div class="topo"><b>${esc(a.nome)}</b><span class="dim num">${usoDe(a.nome)} jog.</span></div>
          <select data-agrole="${esc(a.nome)}" data-agde="${esc(a.role)}">
            ${ROLES.map(r=>`<option ${r===a.role?'selected':''}>${r}</option>`).join('')}</select>
          <div class="acoes">
            <label class="lk">enviar arte<input type="file" accept="image/*" data-agarte="${esc(a.nome)}" style="display:none"></label>
            ${Imgs.tem(Imgs.chaveAgente(a.nome))?`<button class="lk" data-edimgdel="${esc(Imgs.chaveAgente(a.nome))}">remover arte</button>`:''}
            <button class="lk" data-agdel="${esc(a.nome)}" data-agde="${esc(a.role)}" style="color:var(--red)">excluir</button>
          </div>
        </div>
      </div>`).join('')}</div>
  </div>`;
}

/* ============================================================
   ABA IMAGENS
   ============================================================ */
function edvImagens(){
  const itens=[...Imgs.cache.keys()].sort();
  const alvo=k=>{
    const slug=k.slice(k.indexOf(':')+1);
    if(k.startsWith('logo:')){
      const t=Object.values(G.times).find(x=>ASSETS.slug(x.tag)===slug);
      return t?{nome:t.nome,extra:'escudo · '+t.tag,orfa:false}:{nome:slug,extra:'sem time',orfa:true};
    }
    if(k.startsWith('arte:')){
      const tor=G.torneios&&Object.values(G.torneios).find(x=>ASSETS.slug(x.id)===slug);
      return tor?{nome:tor.nome,extra:'torneio',orfa:false}:{nome:slug,extra:'sem torneio',orfa:true};
    }
    if(k.startsWith('agente:')){
      const ag=todosAgentes().find(a=>ASSETS.slug(a.nome)===slug);
      return ag?{nome:ag.nome,extra:'agente · '+ag.role,orfa:false}:{nome:slug,extra:'sem agente',orfa:true};
    }
    const p=Object.values(G.jogadores).find(x=>ASSETS.slug(x.nome)===slug);
    return p?{nome:p.nome,extra:'foto · '+(p.timeId?T(p.timeId).tag:'sem clube'),orfa:false}
            :{nome:slug,extra:'sem jogador',orfa:true};
  };
  const kb=Math.round(Imgs.bytes()/1024);
  const modoTxt={indexeddb:'IndexedDB — o pacote sobrevive ao fechar o navegador',
    memoria:'somente memória — exporte o pacote antes de fechar'}[Imgs.modo];

  return `
  <div class="card"><div class="eyebrow">Como o pacote funciona</div>
    <p class="dim">Rodando por <code>file://</code> o navegador não pode gravar em <code>assets/</code>,
    então subir imagem aqui guarda no <b>pacote</b>: um store próprio do IndexedDB, separado da run.
    O save continua leve e você pode trocar o pacote sem tocar na partida. Toda imagem entra
    reduzida para ${Imgs.lado}×${Imgs.lado} PNG.</p>
    <p class="dim" style="margin-top:8px">A chave segue a mesma convenção da pasta:
    <code>logo:&lt;tag&gt;</code> e <code>foto:&lt;nick&gt;</code>. Renomear tag ou nick no Editor
    re-chaveia a imagem em vez de perdê-la. Se um dia você colocar os arquivos em
    <code>assets/</code>, é só limpar o pacote — a resolução cai para a pasta sozinha.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px">
      <span class="pill">${Imgs.quantos()} imagem(ns)</span>
      <span class="pill">${kb} KB</span>
      <span class="chip ${Imgs.modo==='indexeddb'?'t':''}">${modoTxt}</span>
    </div>
  </div>

  <div class="card"><div class="eyebrow">Subir em lote</div>
    <p class="dim">Solte vários PNG de uma vez. O destino sai do nome do arquivo pelo slug:
    <code>sen.png</code> vira o escudo da tag SEN, <code>champions.png</code> a arte do torneio,
    <code>jett.png</code> o retrato do agente e <code>aspas.png</code> a foto do jogador.
    A ordem de busca é tag, torneio, agente, jogador — arquivo que não casa é reportado e ignorado.</p>
    <div class="dropzone" id="edDropLote">Arraste os arquivos aqui ou
      <label class="lk">escolha os arquivos<input type="file" id="edFileLote" accept="image/*" multiple style="display:none"></label>
    </div>
    ${edFeedImg?`<div style="margin-top:10px">${edFeedImg}</div>`:''}
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn ghost" id="edImgExport">Exportar pacote .json</button>
      <label class="btn ghost lk" style="display:inline-block">Importar pacote
        <input type="file" id="edImgImport" accept=".json" style="display:none"></label>
      <button class="btn ghost" id="edImgLimpar">Limpar pacote</button>
    </div>
  </div>

  <div class="card flat"><div class="eyebrow">No pacote</div>
    ${itens.length?`<div class="imggrid">${itens.map(k=>{const a=alvo(k);
      return `<div class="imgcard ${a.orfa?'orfa':''}">
        <img src="${Imgs.get(k)}" width="56" height="56" alt="">
        <div class="n"><b>${esc(a.nome)}</b><div class="dim">${esc(a.extra)}</div></div>
        <button class="btn ghost sm" data-edimgdel="${esc(k)}">✕</button></div>`;}).join('')}</div>`
      :'<div class="empty">Nenhuma imagem no pacote. O jogo desenha monograma no lugar.</div>'}
    ${itens.some(k=>alvo(k).orfa)?'<p class="dim" style="margin-top:8px">Itens marcados em vermelho não casam com nenhuma tag ou nick da base — provavelmente sobraram de um rename feito fora do Editor.</p>':''}
  </div>`;
}

/* ============================================================
   ABA IMPORTAR / EXPORTAR
   ============================================================ */
function edvIO(){
  return `
  <div class="card"><div class="eyebrow">Importar elencos em massa</div>
    <p class="dim">Uma linha por jogador, separada por <b>|</b>, <b>;</b> ou tabulação:<br>
    <code>TAG | nick | função | over | potencial | idade | país</code><br>
    Só os três primeiros campos são obrigatórios. Para mandar para o mercado, use
    <code>LIVRE</code> no lugar da tag. Para renomear um time: <code>SEN = Novo Nome / TAG</code>.
    Linhas com <b>//</b> são ignoradas.</p>
    <textarea id="impTxt" rows="10" class="cod"
      placeholder="SEN | zekken | Duelista | 88 | 92 | 21 | US&#10;SEN | johnqt | Sentinela | 86 | 88 | 24 | MA&#10;LIVRE | tenz | Duelista | 90 | 90 | 25 | CA"></textarea>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
      <select id="impModo">
        <option value="substituir" ${edModo==='substituir'?'selected':''}>Substituir o elenco dos times citados</option>
        <option value="adicionar" ${edModo==='adicionar'?'selected':''}>Adicionar aos elencos existentes</option>
      </select>
      <button class="btn" id="impGo">Importar</button>
      <button class="btn ghost" id="expGo">Exportar tudo no mesmo formato</button>
    </div>
    <div id="impFeed" style="margin-top:10px"></div>
    ${edSaida?`<textarea rows="10" class="cod" style="margin-top:10px">${esc(edSaida)}</textarea>`:''}
  </div>

  <div class="card"><div class="eyebrow">Colar do vlr.gg</div>
    <p class="dim">Abra a página do time no vlr.gg, selecione a área do elenco e cole aqui.
    Funciona com texto puro, mas <b>copiando o HTML do elemento</b> (botão direito › Inspecionar ›
    Copy › Copy outerHTML) vem também a bandeira, e o país é preenchido sozinho.</p>
    <p class="dim">O vlr não publica <b>função</b> nem <b>over</b> — esses campos saem vazios de
    propósito. Preencha na prévia antes de importar, ou depois na aba Jogadores.</p>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <label class="dim">Tag do clube ${edSelectTimes('id="vlrTime" style="min-width:240px"',edTime,false)}</label>
    </div>
    <textarea id="vlrTxt" rows="7" class="cod"
      placeholder="johnqt&#10;Mohamed Amine Ouarid&#10;Reduxx&#10;Yassin Aboulalazm&#10;…"></textarea>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
      <button class="btn" id="vlrGo">Ler a colagem</button>
      <span class="dim">gera as linhas do importador acima — nada entra na base ainda</span>
    </div>
    <div id="vlrFeed" style="margin-top:10px"></div></div>

  <div class="card"><div class="eyebrow">Padronizar a base</div>
    <p class="dim">Recoloca a base inteira na régua do jogo:
    <b>comissão</b> ${FAIXAS.comissao[1][0]}–${FAIXAS.comissao[1][1]} no Tier 1 e
    ${FAIXAS.comissao[2][0]}–${FAIXAS.comissao[2][1]} no Tier 2,
    <b>jogadores de Tier 2</b> ${FAIXAS.jogador[2][0]}–${FAIXAS.jogador[2][1]},
    potencial proporcional à idade e à divisão, e exatamente
    ${AGENTES_POR_JOGADOR} agentes da função por jogador.</p>
    <p class="dim">O over dos jogadores de <b>Tier 1</b> não é reescrito — é o que você
    ajustou à mão. Só sobe quem estiver abaixo de ${FAIXAS.jogador[1][0]}, que são os
    reservas gerados. Dentro de cada clube a ordem é preservada: quem era o melhor
    continua sendo.</p>
    <button class="btn" id="edPadronizar">Padronizar agora</button>
    <div id="edPadFeed" style="margin-top:10px"></div></div>

  <div class="card"><div class="eyebrow">Países de sede · ${Object.values(G.times).filter(t=>t.pais).length} de ${Object.keys(G.times).length}</div>
    <p class="dim">O país da sede decide a torcida de base do clube, e pesa mais no
    <b>Tier 2</b>, onde o prestígio é igual para todos. Preencha em massa aqui, uma linha
    por clube: <code>TAG = PA</code>. Linhas com <b>//</b> são ignoradas.</p>
    <textarea id="paisTxt" rows="6" class="cod"
      placeholder="SEN = US&#10;LOUD = BR&#10;KRÜ = AR&#10;FUR = BR"></textarea>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
      <button class="btn" id="paisGo">Aplicar países</button>
      <button class="btn ghost" id="paisExp">Listar os atuais</button>
      <button class="btn ghost" id="edGerarClubes">Baixar data/clubes.js</button>
    </div>
    <p class="dim" style="margin-top:8px">Preencher aqui vale só para <b>este save</b>.
    Para não repetir a cada jogo novo, baixe o <code>data/clubes.js</code> e copie por
    cima do que está na pasta <code>data/</code> — aí todo mundo novo já nasce com eles.</p>
    <div id="paisFeed" style="margin-top:10px"></div></div>

  <div class="card"><div class="eyebrow">Salvar os elencos no projeto</div>
    <p class="dim">Gera o <code>data/elencos.js</code> a partir desta base e baixa o arquivo.
    Ponha ele na pasta <code>data/</code> do projeto, por cima do que está lá, e todo jogo novo
    passa a começar com os seus ajustes — hoje eles existem só neste save.</p>
    <p class="dim">Só entram jogadores de nome real. Reservas gerados ficam de fora de
    propósito: eles voltam a ser sorteados a cada partida nova, e é isso que mantém
    os elencos variados.</p>
    <button class="btn" id="edGerarElencos">Baixar data/elencos.js</button>
    <button class="btn ghost" id="edVerElencos">Ver antes de baixar</button>
    <div id="edElencosFeed" style="margin-top:10px"></div></div>

  <div class="card"><div class="eyebrow">Zona de risco</div>
    <p class="dim">Gerar um mundo novo apaga a base editada e recomeça dos dados de
    <code>data/times.js</code> e <code>data/elencos.js</code>. O pacote de imagens não é afetado.</p>
    <button class="btn ghost" id="edNovo">Começar novo jogo</button></div>`;
}

/* ============================================================
   ABA VALIDAÇÃO
   ============================================================ */
function edvValidar(){
  const v=edValidar();
  const curtos=Object.values(G.times).filter(t=>t.elenco.length<5);
  return `
  <div class="card"><div class="split"><div class="eyebrow">Consistência da base</div>
    <span class="chip ${v.ok?'t':'r'}">${v.ok?'pronta para começar':v.erros.length+' erro(s)'}</span></div>
    <p class="dim">O Editor deixa a base ficar temporariamente inconsistente de propósito — trocar cinco
    jogadores de time passa por aí. Erro trava o início da run; aviso não.</p>
    ${curtos.length?`<div style="margin-top:10px"><button class="btn ghost" id="edFixCurtos">Preencher os ${curtos.length} elenco(s) curto(s) até 5</button></div>`:''}
  </div>

  <div class="card flat"><div class="eyebrow">Erros — travam a run</div>
    ${v.erros.length?`<div class="feed">${v.erros.map(e=>`<div class="err">· ${esc(e)}</div>`).join('')}</div>`
      :'<div class="empty">Nada. A base está consistente.</div>'}</div>

  <div class="card flat"><div class="eyebrow">Avisos — só para você saber</div>
    ${v.avisos.length?`<div class="feed">${v.avisos.map(e=>`<div>· ${esc(e)}</div>`).join('')}</div>`
      :'<div class="empty">Nenhum aviso.</div>'}</div>

  <div class="card flat"><div class="eyebrow">Números da base</div>
    <table><tbody>
      <tr><td>Organizações</td><td class="r num">${Object.keys(G.times).length}</td></tr>
      <tr><td>Jogadores</td><td class="r num">${Object.keys(G.jogadores).length}</td></tr>
      <tr><td>Sem clube</td><td class="r num">${G.livres.length}</td></tr>
      <tr><td>Imagens no pacote</td><td class="r num">${Imgs.quantos()}</td></tr>
      ${REGIONS.map(r=>`<tr><td>${esc(r.nome)}</td><td class="r num">${G.regioes[r.id].t1.length} + ${G.regioes[r.id].t2.length}</td></tr>`).join('')}
    </tbody></table></div>`;
}

/* ============================================================
   SHELL DO EDITOR
   ============================================================ */
function vEditor(){
  const v=edValidar();
  const corpo={times:edvTimes,jogadores:edvJogadores,livres:edvLivres,
               comissao:edvComissao,torneios:edvTorneios,patrocinadores:edvPatrocinadores,
               agentes:edvAgentes,
               imagens:edvImagens,io:edvIO,validar:edvValidar}[edAba]||edvTimes;
  return `<div class="eyebrow">Banco de dados</div><h2 class="sec">Editor</h2>
  ${preRun()?'':'<div class="card" style="border-left:4px solid var(--gold)">A run já começou. Editar over e atributos agora muda a temporada em andamento — o lugar de montar a base é a pré-run.</div>'}
  ${v.erros.length?`<div class="card" style="border-left:4px solid var(--red)">
    <b>${v.erros.length} erro(s) de consistência.</b> <span class="dim">A run não começa até resolver.</span>
    <button class="btn ghost sm" data-edaba="validar" style="margin-left:8px">Ver na aba Validação</button></div>`:''}
  <div class="tabs">${ED_ABAS.map(([k,n])=>
    `<button data-edaba="${k}" class="${edAba===k?'on':''}">${n}</button>`).join('')}</div>
  ${corpo()}`;
}

/* ============================================================
   IMPORTADOR / EXPORTADOR EM TEXTO
   ============================================================ */
function acharTime(chave){
  const c=String(chave).trim().toLowerCase();
  return Object.values(G.times).find(t=>t.tag.toLowerCase()===c)
      || Object.values(G.times).find(t=>t.nome.toLowerCase()===c)
      || Object.values(G.times).find(t=>t.nome.toLowerCase().startsWith(c)&&c.length>2);
}
const ED_LIVRE=['livre','livres','sem clube','semclube','free','-'];
function importarElencos(texto,modo){
  const usados=edNomesUsados();
  const linhas=texto.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('//')&&!l.startsWith('#'));
  const limpos=new Set();let add=0,ren=0,erros=[];
  const tocados=new Set();
  for(const linha of linhas){
    if(!/[|;\t]/.test(linha)&&linha.includes('=')){
      const[a,b]=linha.split('=');const t=acharTime(a);
      if(!t){erros.push('Time não encontrado: '+a.trim());continue;}
      const novo=b.trim();
      const tagAntes=t.tag;
      if(novo.includes('/')){const[n,g]=novo.split('/');
        const r=edAplicarTime(t.id,{nome:n.trim(),tag:g.trim()});
        if(!r.ok){erros.push(r.erro);continue;}
        if(r.tagTrocada)Imgs.renomear(Imgs.chaveTime(tagAntes),Imgs.chaveTime(t.tag));
      }else edAplicarTime(t.id,{nome:novo});
      ren++;continue;
    }
    const c=linha.split(/\s*[|;\t]\s*/);
    if(c.length<3){erros.push('Linha inválida: '+linha);continue;}
    const chave=c[0].trim();
    const livre=ED_LIVRE.includes(chave.toLowerCase());
    const t=livre?null:acharTime(chave);
    if(!livre&&!t){erros.push('Time não encontrado: '+chave);continue;}
    if(t&&modo==='substituir'&&!limpos.has(t.id)){
      limpos.add(t.id);
      /* passa por edApagar em vez de deletar na mão: é ele que limpa proposta,
         plano de treino e IGL apontando para quem deixou de existir */
      t.elenco.slice().forEach(id=>{edApagar(id);});
      t.elenco=[];t.titulares=[];t.igl=null;
    }
    const nome=c[1].trim();
    let role=(c[2]||'').trim();
    role=ROLES.find(r=>r.toLowerCase()===role.toLowerCase())
      ||{duel:'Duelista',dueli:'Duelista',init:'Iniciador',inic:'Iniciador',contr:'Controlador',
         control:'Controlador',sent:'Sentinela',sentin:'Sentinela',flex:'Flex'}[role.toLowerCase().slice(0,6)]
      ||'Flex';
    const ov=clamp(parseInt(c[3])||(t?Math.round(t.prestigio):56),30,99);
    const pot=clamp(parseInt(c[4])||0,0,99);
    const idade=clamp(parseInt(c[5])||ri(19,25),15,40);
    const regiao=t?REGIONS.find(r=>r.id===t.regiao):REGIONS[0];
    const pais=(c[6]||'').trim().toUpperCase()||pick(regiao.paises);
    if(t&&t.elenco.length>=9){erros.push('Elenco cheio em '+t.tag+': '+nome);continue;}
    const p=makePlayer(ov,role,pais,idade,usados);
    p.nome=nome;
    aplicarOver(p,ov);
    p.pot=Math.max(pot,over(p));
    p.salario=salario(p);p.valor=valor(p);
    G.jogadores[p.id]=p;
    if(t){p.contrato=ri(2,3);p.timeId=t.id;t.elenco.push(p.id);tocados.add(t.id);}
    else{p.contrato=0;p.timeId=null;p.regiaoOrigem=regiao.id;G.livres.push(p.id);}
    add++;
  }
  tocados.forEach(id=>edRemendarEscalacao(G.times[id]));
  limpos.forEach(id=>{const t=G.times[id];
    if(t.elenco.length<5)edPreencherElenco(id,5);
    edRemendarEscalacao(t);});
  return{add,ren,erros};
}
function exportarElencos(){
  const times=Object.values(G.times).map(t=>
    '// '+t.nome+'\n'+t.tag+' = '+t.nome+' / '+t.tag+'\n'+
    t.elenco.map(id=>{const p=P(id);
      return [t.tag,p.nome,p.role,over(p),p.pot,p.idade,p.pais].join(' | ');}).join('\n')
  ).join('\n\n');
  const livres=G.livres.map(P).filter(Boolean);
  if(!livres.length)return times;
  return times+'\n\n// Sem clube\n'+livres.map(p=>
    ['LIVRE',p.nome,p.role,over(p),p.pot,p.idade,p.pais].join(' | ')).join('\n');
}

/* ============================================================
   ABA PATROCINADORES
   ============================================================ */
function edvPatrocinadores(){
  if(!G.marcas)montarMarcas();
  if(!edTime||!G.times[edTime])edTime=G.meuTime||G.regioes[REGIONS[0].id].t1[0];
  const t=G.times[edTime];
  if(!t.patrocinios)atribuirPatrocinios();

  const ocupacao={};
  for(const id in G.times)for(const v of VAGAS){
    const mid=G.times[id].patrocinios&&G.times[id].patrocinios[v.id];
    if(mid)(ocupacao[mid]=ocupacao[mid]||[]).push(G.times[id].tag);
  }

  const selMarca=(vagaId,atual)=>`<select data-patroc="${vagaId}" style="max-width:220px">
    <option value="">— vaga aberta —</option>
    ${listaMarcas().map(mk=>`<option value="${mk.id}" ${mk.id===atual?'selected':''}>
       ${esc(mk.nome)} · nível ${mk.nivel}</option>`).join('')}</select>`;

  const linhaVaga=({vaga,mk})=>`<tr>
    <td>${mk?logoMarca(mk,96):''}</td>
    <td><b>${esc(vaga.nome)}</b><div class="dim" style="font-size:11px">${esc(vaga.desc)}</div></td>
    <td>${mk?`<b>${esc(mk.nome)}</b><div class="dim" style="font-size:11px">${esc(mk.setor)}</div>`
            :'<span class="dn">vaga aberta</span>'}</td>
    <td class="c num">${mk?mk.nivel:'—'}</td>
    <td class="r num">${mk?money(valorContrato(mk,t,vaga.id)):'—'}/ano</td>
    <td>${selMarca(vaga.id,mk?mk.id:'')}</td></tr>`;

  const linhaMarca=mk=>`<tr>
    <td>${logoMarca(mk,88)}</td>
    <td><input type="text" value="${esc(mk.nome)}" data-mknome="${esc(mk.id)}" style="width:190px"></td>
    <td><input type="text" value="${esc(mk.setor)}" data-mksetor="${esc(mk.id)}" style="width:150px"></td>
    <td class="c"><input type="number" value="${mk.nivel}" data-mknivel="${esc(mk.id)}"
        min="1" max="5" step="1" style="width:62px"></td>
    <td class="dim">${(ocupacao[mk.id]||[]).join(', ')||'sem clube'}</td>
    <td class="r nowrap">
      <label class="lk">logo<input type="file" accept="image/*" data-mklogo="${esc(mk.id)}" style="display:none"></label>
      ${Imgs.tem(Imgs.chaveMarca(mk.id))?`<button class="btn ghost sm" data-edimgdel="${esc(Imgs.chaveMarca(mk.id))}">✕</button>`:''}
      <button class="btn ghost sm" data-mkdel="${esc(mk.id)}">excluir</button>
    </td></tr>`;

  return `
  <div class="card"><div class="eyebrow">Como o patrocínio pesa</div>
    <p class="dim">A receita de um clube tem duas partes. O <b>aporte da liga</b> é o piso: chega
    todo ano, ganhando ou perdendo, e é maior conforme a torcida. O <b>patrocínio</b> é a parte
    que varia — marca boa procura clube atraente, e vai embora quando ele cai de rendimento.</p>
    <p class="dim">A redistribuição acontece na virada de temporada: o clube mais atraente escolhe
    primeiro. A vaga de <b>máster</b> é exclusiva no mundo inteiro; as outras duas a mesma marca
    pode ocupar em até ${MAX_CLUBES_POR_MARCA} clubes.</p>
    <p class="dim">Logo normalizado em ${Imgs.formatos.marca[0]}×${Imgs.formatos.marca[1]} PNG — deitado,
    não quadrado. Em lote, o arquivo tem de se chamar como o id da marca: <code>m1.png</code>.</p>
  </div>

  <div class="card"><div class="split">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      ${escudo(t,36)}${edSelectTimes('id="edSel" style="min-width:280px"',edTime,false)}
    </div>
    <span class="dim num">torcida ${t.torcida||0} · patrocínio ${money(receitaPatrocinio(t))}/ano
      · aporte ${money(aporteLiga(t))}/ano</span>
  </div></div>

  <div class="card flat"><div class="eyebrow">Vagas do ${esc(t.tag)}</div>
    <table class="wide"><thead><tr><th></th><th>Vaga</th><th>Marca</th>
      <th class="c">Nível</th><th class="r">Contrato</th><th>Trocar</th></tr></thead>
    <tbody>${patrociniosDe(t).map(linhaVaga).join('')}</tbody></table>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <button class="btn ghost" id="edRedistribuir">Redistribuir o mundo inteiro</button>
      <span class="dim">Refaz a escolha de todos os clubes pela atratividade atual.</span>
    </div>
  </div>

  <div class="card"><div class="eyebrow">Catálogo de marcas · ${listaMarcas().length}</div>
    <p class="dim">Nível vai de 1 (marca local) a 5 (global) e decide quanto o contrato vale e
    quais clubes conseguem alcançar a marca. São fictícias de propósito — troque por nomes que
    façam sentido para você.</p>
    <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;align-items:center">
      <input type="text" id="mkNovo" placeholder="Nome da marca" style="width:200px">
      <input type="number" id="mkNovoNivel" value="3" min="1" max="5" style="width:62px">
      <button class="btn" id="mkAdd">Adicionar</button>
      <button class="btn ghost" id="edSalvarMarcas">Aplicar alterações</button>
    </div>
    <div class="rolagem"><table class="wide"><thead><tr><th></th><th>Nome</th><th>Setor</th>
      <th class="c">Nível</th><th>Patrocina</th><th class="r">Logo</th></tr></thead>
    <tbody>${listaMarcas().map(linhaMarca).join('')}</tbody></table></div>
  </div>`;
}

/* ============================================================
   ABA COMISSÃO TÉCNICA
   ============================================================ */
function edvComissao(){
  if(!G.staff)migrarStaffAntigo();
  if(!edTime||!G.times[edTime])edTime=G.meuTime||G.regioes[REGIONS[0].id].t1[0];
  const t=G.times[edTime];
  const livres=(G.staffLivres||[]).map(i=>G.staff[i]).filter(Boolean)
    .sort((a,b)=>overStaff(b)-overStaff(a));

  const selMembro=(cargo,atual)=>{
    /* quem já está em outro clube aparece agrupado, para dar para roubar */
    const doCargo=Object.values(G.staff).filter(m=>m.cargo===cargo);
    const livresC=doCargo.filter(m=>!m.timeId);
    const empregados=doCargo.filter(m=>m.timeId&&m.timeId!==t.id);
    const opt=m=>`<option value="${m.id}" ${m.id===atual?'selected':''}>${esc(m.nome)} · ${overStaff(m)}</option>`;
    const meus=doCargo.filter(m=>m.timeId===t.id);
    return `<select data-comissao="${cargo}" style="max-width:200px">
      <option value="">— vaga aberta —</option>
      ${meus.length?`<optgroup label="Neste clube">${meus.map(opt).join('')}</optgroup>`:''}
      ${livresC.length?`<optgroup label="Sem clube">${livresC.map(opt).join('')}</optgroup>`:''}
      ${empregados.length?`<optgroup label="Em outros clubes">${empregados.map(opt).join('')}</optgroup>`:''}
    </select>`;};

  const linha=({cargo,membro})=>`<tr>
    <td>${membro?retratoStaff(membro,32):''}</td>
    <td><b>${esc(cargo.nome)}</b><div class="dim" style="font-size:11px">${esc(cargo.efeito)}</div></td>
    <td>${membro?`<b>${esc(membro.nome)}</b> ${bandeira(membro.pais)}`:'<span class="dn">vago</span>'}</td>
    <td class="c num">${membro?membro.idade:'—'}</td>
    <td class="c">${membro?`<span class="ov ${ovClass(overStaff(membro))}">${overStaff(membro)}</span>`:'—'}</td>
    <td class="c num dim">${membro?membro.pot:'—'}</td>
    <td class="c num">${membro?(t.staff[cargo.id]||1).toFixed(1):'1.0'}</td>
    <td class="c num">${membro?membro.contrato+'a':'—'}</td>
    <td class="r num">${membro?money(membro.salario):'—'}</td>
    <td>${selMembro(cargo.id,membro?membro.id:'')}</td>
    <td class="r nowrap">
      ${membro?`<button class="btn ghost sm" data-edstaffp="${membro.id}">Editar</button>
                <button class="btn ghost sm" data-edstafflivre="${membro.id}">Dispensar</button>`:''}
      <button class="btn ghost sm" data-edstaffnovo="${cargo.id}">+ criar</button>
    </td></tr>`;

  return `
  <div class="card"><div class="split">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      ${escudo(t,36)}${edSelectTimes('id="edSel" style="min-width:280px"',edTime,false)}
    </div>
    <span class="dim num">folha da comissão ${money(folhaStaff(t))}/mês</span>
  </div></div>

  <div class="card"><div class="eyebrow">Como a comissão pesa</div>
    <p class="dim">Cada cargo vira um nível de 1 a 5 derivado do over de quem ocupa a vaga, e é
    esse nível que o motor lê. <b>Nível ${NIVEL_NEUTRO} é o ponto neutro</b>: acima ajuda, abaixo
    atrapalha, e vaga aberta vale 1. A escala vai do piso do Challengers (over ${FAIXAS.comissao[2][0]})
    ao topo do mundo (99), então o neutro não fica no meio: metade dos clubes do mundo é Tier 2. Trocar alguém aqui é edição de base — não mexe em caixa nem em contrato.
    Para comprar de outro clube com dinheiro, use o Mercado.</p>
    <p class="dim" style="margin-top:8px">Retrato normalizado em ${Imgs.formatos.staff[0]}×${Imgs.formatos.staff[1]} PNG.
    Em lote, o arquivo é o nome da pessoa: <code>carlos-silva.png</code>.</p>
  </div>

  <div class="card flat"><div class="eyebrow">Comissão do ${esc(t.tag)}</div>
    <table class="wide"><thead><tr><th></th><th>Cargo</th><th>Nome</th><th class="c">Idade</th>
      <th class="c">Over</th><th class="c">Pot</th><th class="c">Nível</th><th class="c">Contr.</th>
      <th class="r">Salário</th><th>Ocupante</th><th class="r">Ações</th></tr></thead>
    <tbody>${comissaoDe(t).map(linha).join('')}</tbody></table></div>

  <div class="card flat"><div class="split"><div class="eyebrow">Sem clube · ${livres.length}</div>
    <button class="btn ghost sm" id="edStaffNovoLivre">Criar membro sem clube</button></div>
    <table class="wide"><thead><tr><th></th><th>Nome</th><th>Cargo</th><th class="c">Idade</th>
      <th class="c">Over</th><th class="c">Pot</th><th class="r">Salário</th><th>Contratar como</th>
      <th class="r">Ações</th></tr></thead>
    <tbody>${livres.slice(0,50).map(m=>`<tr>
      <td>${retratoStaff(m,26)}</td>
      <td><b>${esc(m.nome)}</b> ${bandeira(m.pais)}</td>
      <td><span class="tag">${esc((CARGOS.find(c=>c.id===m.cargo)||{curto:m.cargo}).curto)}</span></td>
      <td class="c num">${m.idade}</td>
      <td class="c"><span class="ov ${ovClass(overStaff(m))}">${overStaff(m)}</span></td>
      <td class="c num dim">${m.pot}</td>
      <td class="r num">${money(m.salario)}</td>
      <td><select data-contratarstaff="${m.id}"><option value="">— escolher cargo —</option>
        ${CARGOS.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></td>
      <td class="r nowrap">
        <button class="btn ghost sm" data-edstaffp="${m.id}">Editar</button>
        <button class="btn ghost sm" data-edstaffdel="${m.id}">✕</button></td>
    </tr>`).join('')||'<tr><td colspan="9" class="dim">Ninguém sem clube.</td></tr>'}</tbody></table>
    ${livres.length>50?`<p class="dim" style="margin-top:8px">Mostrando 50 de ${livres.length}.</p>`:''}
  </div>`;
}
