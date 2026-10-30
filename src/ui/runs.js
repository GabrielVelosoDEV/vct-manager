/* ============================================================
   TELA DE RUNS — criar, carregar, exportar e importar partidas
   ============================================================ */
let listaRuns=[];
async function atualizarRuns(){listaRuns=await Storage.listar();}
function dataBr(ts){
  if(!ts)return '—';
  const d=new Date(ts);
  return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function vRuns(){
  const modoTxt={indexeddb:'IndexedDB (sem limite prático)',localstorage:'localStorage (~5 MB)',memoria:'somente memória — exporte antes de fechar'}[Storage.modo];
  return `<div class="eyebrow">Arquivo</div><h2 class="sec">Runs</h2>
  <p class="dim">Armazenamento ativo: <b>${modoTxt}</b>. O arquivo <code>.vctrun.json</code> é o backup canônico e pode ser versionado na pasta <code>/runs</code>.</p>

  <div class="card"><div class="split"><div class="eyebrow">Run atual</div>
    <span class="chip ${G&&G.meuTime?'t':'g'}">${G&&G.meuTime?'em andamento':'pré-run'}</span></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px">
      <input type="text" id="runNome" style="width:260px" placeholder="Nome da run" value="${esc(G&&G.runNome?G.runNome:'')}">
      <button class="btn" id="runSalvar">Salvar</button>
      <button class="btn ghost" id="runBaixar">Exportar .json</button>
    </div>
    <p class="dim" style="margin-top:8px">Semente do mundo: <b class="num">${G?G.seed:'—'}</b> · a mesma semente sempre gera os mesmos elencos.</p>
  </div>

  <div class="card flat"><div class="eyebrow">Runs salvas</div>
    ${listaRuns.length?listaRuns.map(r=>`<div class="runrow">
      <div class="n"><b>${esc(r.nome)}</b><div class="dim">${esc(r.clube||'—')} · ${r.ano} · ${esc(r.fase||'')} · ${dataBr(r.atualizado)}</div></div>
      <button class="btn sm" data-runload="${r.id}">Carregar</button>
      <button class="btn ghost sm" data-rundel="${r.id}">Apagar</button></div>`).join('')
      :'<div class="empty">Nenhuma run salva ainda.</div>'}
  </div>

  <div class="card flat"><div class="eyebrow">Importar run</div>
    <div class="dropzone" id="runDrop">Arraste um arquivo <b>.vctrun.json</b> aqui ou
      <label style="text-decoration:underline;cursor:pointer">escolha um arquivo<input type="file" id="runFile" accept=".json" style="display:none"></label>
    </div></div>

  <div class="card"><div class="eyebrow">Nova run</div>
    <p class="dim">Gera um mundo novo com os clubes reais. Você pode editar times e elencos antes de escolher o clube e começar.</p>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="dim">Semente</span><input type="number" id="runSeed" value="${Math.floor(Math.random()*900000)+1000}" style="width:120px">
      <button class="btn" id="runNova">Criar mundo</button></div>
  </div>`;
}
/* monta um mundo novo em pré-run. Não navega: quem chamou decide para onde
   ir, porque o menu e o botão de dentro do jogo querem destinos diferentes. */
function iniciarPreRun(seed){
  criarMundo(seed);montarCalendario();
  G.runId=novaRunId();G.runNome='Run '+new Date().toLocaleDateString('pt-BR');
  G.meuTime=null;
  tela='inicio';hist=[];histPos=-1;
}
