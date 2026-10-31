/* ============================================================
   NOVO JOGO
   ============================================================ */
let escRegiao='AMER',escTier=1,escPapel='treinador',escNome='',escDif='normal';
function telaNovoJogo(){
  const val=edValidar();
  if(!val.ok){
    /* deixar começar com a base quebrada gera erro no meio da temporada, longe
       da causa; melhor barrar aqui e mandar para a aba que explica o problema */
    $('#modal').innerHTML=`<div class="ovl"><div class="box">
      <div class="eyebrow">Não dá para começar ainda</div>
      <h2 class="sec">${val.erros.length} erro(s) na base</h2>
      <p class="dim">O Banco de dados do menu deixa a base ficar inconsistente enquanto você monta, mas a
      temporada precisa dela fechada. Resolva o que está abaixo e volte.</p>
      <div class="card flat" style="margin-top:10px"><div class="feed">
        ${val.erros.slice(0,14).map(e=>'<div class="err">· '+esc(e)+'</div>').join('')}
        ${val.erros.length>14?'<div class="dim">… e mais '+(val.erros.length-14)+'</div>':''}
      </div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn" id="njValidar">Abrir a aba Validação</button>
        <button class="btn ghost" data-close>Fechar</button></div></div></div>`;
    $('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=fechar);
    $('#njValidar').onclick=()=>{edAba='validar';$('#modal').innerHTML='';modo='menu';telaMenu='banco';render();};
    return;
  }
  const times=G?G.regioes[escRegiao][escTier===1?'t1':'t2'].slice().sort((a,b)=>T(b).prestigio-T(a).prestigio):[];
  $('#modal').innerHTML=`<div class="ovl"><div class="box wide">
    <div class="eyebrow">Novo jogo</div><h2 class="sec">Quem é você</h2>
    <div class="nj-quem">
      <label class="dim">Seu nome
        <input type="text" id="njNome" value="${esc(escNome)}" maxlength="28"
          placeholder="como a imprensa vai te chamar"></label>
      <div class="nj-papeis">${PAPEIS.map(p=>`
        <button class="nj-papel ${escPapel===p.id?'on':''}" data-papel="${p.id}">
          <b>${esc(p.nome)}</b>
          <span>${esc(p.resumo)}</span>
          <i>${esc(p.detalhe)}</i>
        </button>`).join('')}</div>
    </div>
    <div class="eyebrow" style="margin-top:16px">Dificuldade</div>
    <div class="nj-papeis">${Object.entries(DIFICULDADES).map(([k,d])=>`
      <button class="nj-papel ${escDif===k?'on':''}" data-dif="${k}"><b>${esc(d.nome)}</b><span>${esc(d.resumo)}</span></button>`).join('')}</div>
    <h2 class="sec" style="margin-top:18px">Escolha seu clube</h2>
    <p class="dim">Você assume a gestão esportiva: escalação, táticas, treino, mercado, base e finanças. O circuito roda sozinho ao seu redor.</p>
    <div class="tabs" style="margin-top:14px">${REGIONS.map(r=>`<button data-rg="${r.id}" class="${escRegiao===r.id?'on':''}">${r.nome}</button>`).join('')}</div>
    <div class="tabs">${[[1,'Liga principal (Tier 1)'],[2,'Challengers (Tier 2) — modo difícil']].map(([k,n])=>`<button data-tr="${k}" class="${escTier===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="card flat"><table><thead><tr><th>Equipe</th><th class="c">Prestígio</th><th class="c">Over</th><th class="r">Caixa</th><th class="r">Folha</th><th></th></tr></thead>
    <tbody>${times.map(id=>{const t=T(id);const ov=Math.round(t.titulares.reduce((s,i)=>s+over(P(i)),0)/5);
      const fo=t.elenco.reduce((s,i)=>s+P(i).salario,0);
      return `<tr><td><span class="linha-t">${escudo(t,24)}<b>${esc(t.nome)}</b> <span class="dim">${t.tag}</span></span></td><td class="c num">${Math.round(t.prestigio)}</td>
      <td class="c"><span class="ov ${ovClass(ov)}">${ov}</span></td><td class="r num">${money(t.caixa)}</td>
      <td class="r num">${money(fo)}</td><td class="r"><button class="btn sm" data-pick="${id}">Assumir</button></td></tr>`;}).join('')}
    </tbody></table></div>
    <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
      <span class="dim">Times e elencos vêm da base de dados (${Base.reg&&Base.reg.editada?'editada por você':'original'}).
        Para mudar, use o Banco de dados do menu principal.</span>
      <button class="btn ghost" data-close>Cancelar</button></div>
  </div></div>`;
  /* o nome digitado sobrevive a cada repintura da tela: sem isso, trocar de
     região no meio do preenchimento apagava o que a pessoa escreveu */
  const guardaNome=()=>{const el=$('#njNome');if(el)escNome=el.value;};
  const inNome=$('#njNome');
  if(inNome)inNome.oninput=guardaNome;
  $('#modal').querySelectorAll('[data-papel]').forEach(b=>b.onclick=()=>{
    guardaNome();escPapel=b.dataset.papel;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-dif]').forEach(b=>b.onclick=()=>{guardaNome();escDif=b.dataset.dif;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-rg]').forEach(b=>b.onclick=()=>{guardaNome();escRegiao=b.dataset.rg;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{guardaNome();escTier=+b.dataset.tr;telaNovoJogo();});
  $('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=fechar);
  $('#modal').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
    guardaNome();
    G.meuTime=b.dataset.pick;
    G.iniciadaEm=Date.now();
    aplicarDificuldade(escDif,T(G.meuTime));
    iniciarGuia();
    criarManager(escNome,escPapel);
    iniciarBase(T(G.meuTime));
    montarMetas();
    const eu=G.manager;
    noticia((souTreinador()?'👔 ':'🏛 ')+eu.nome+' assumiu como '+
            (souTreinador()?'treinador':'diretoria')+' do '+T(G.meuTime).nome+'.',{c:'clube',t:[G.meuTime]});
    if(souTreinador()&&eu.metas.length)
      noticia('🎯 Meta da diretoria para '+G.ano+': '+eu.metas[0].texto+'.',{c:'clube',t:[G.meuTime]});
    salvarRun(G.runNome);
    $('#modal').innerHTML='';
    tela='inicio';hist=['inicio'];histPos=0;
    entrarNoJogo();
    flash('Boa sorte no comando do '+T(G.meuTime).nome+'.');
  });
}
