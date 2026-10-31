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

  ${G&&G.meuTime?`<div class="card"><div class="split"><div class="eyebrow">Run atual</div>
    <span class="chip t">em andamento</span></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px">
      <input type="text" id="runNome" style="width:260px" placeholder="Nome da run" value="${esc(G.runNome||'')}">
      <button class="btn" id="runSalvar">Salvar</button>
      <button class="btn ghost" id="runBaixar">Exportar .json</button>
    </div>
  </div>`:''}

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
    <p class="dim">Toda carreira nova começa da base de dados. Para mudar times e elencos de todas as
    carreiras daqui para frente, edite o Banco de dados do menu principal; para mudar só uma carreira,
    use o Banco de dados de dentro dela.</p>
    <button class="btn" id="runNova">Novo jogo</button>
  </div>`;
}
/* monta o mundo de uma carreira nova, copiado da base de dados (ver
   data/base.js), ainda sem clube. A semente só decide o que acontece daqui
   para frente: os elencos são os da base. Não navega: quem chamou decide
   para onde ir. */
function iniciarPreRun(seed){
  Base.novoMundo(seed);
  G.runId=novaRunId();G.runNome='Run '+new Date().toLocaleDateString('pt-BR');
  G.meuTime=null;
  tela='inicio';hist=[];histPos=-1;
}
