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
  const modoTxt={indexeddb:'no navegador (IndexedDB)',localstorage:'no navegador (localStorage, ~5 MB)',memoria:'só na memória — exporte antes de fechar'}[Storage.modo];
  return `<div class="eyebrow">Arquivo</div><h2 class="sec">Partidas salvas</h2>
  <p class="dim">Tudo o que você joga fica no seu computador: o site não guarda partida de ninguém. Hoje as carreiras estão
    salvas <b>${modoTxt}</b>${Pasta.estado==='ligada'?` e na pasta <b>${esc(Pasta.nome)}</b>`:''}. O arquivo <code>.vctrun.json</code> é o backup de uma carreira.</p>
  ${cartaoPasta()}

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
/* ---------- pasta no PC (data/storage.js › Pasta) ---------- */
function cartaoPasta(){
  if(Pasta.noApp())return `<div class="card flat pst"><div class="pst-ic">${ico('disco')}</div><div><div class="eyebrow">Saves no seu computador</div>
    <p class="dim">No app de PC as carreiras já ficam guardadas no seu usuário do Windows e continuam lá ao atualizar o app.
    Para levar uma carreira do site para cá (ou daqui para o site), use <b>Exportar .json</b> e <b>Importar run</b>.</p></div></div>`;
  if(Pasta.estado==='sem-suporte')return `<div class="card flat pst"><div class="pst-ic">${ico('disco')}</div><div><div class="eyebrow">Salvar numa pasta do PC</div>
    <p class="dim">Este navegador não deixa sites gravarem numa pasta (só Chrome, Edge e Opera no computador deixam). Suas carreiras
    continuam salvas no navegador; se você limpar os dados de navegação, elas vão junto. Use <b>Exportar .json</b> de vez em quando para ter uma cópia.</p></div></div>`;
  if(Pasta.estado==='ligada')return `<div class="card pst ok"><div class="pst-ic">${ico('check')}</div><div><div class="eyebrow">Salvando também numa pasta do seu PC</div>
    <p class="dim">Pasta <b>${esc(Pasta.nome)}</b>: cada carreira é um arquivo <code>.vctrun.json</code> e a sua versão do Banco de dados é
    <code>base-de-dados.vctbase.json</code>. Pode copiar a pasta para outro computador ou fazer backup dela.</p>
    <div class="pst-bts"><button class="btn ghost sm" id="pastaEscolher">Trocar de pasta</button>
      <button class="btn ghost sm" id="pastaDesligar">Parar de usar a pasta</button></div></div></div>`;
  if(Pasta.estado==='pendente')return `<div class="card pst pend"><div class="pst-ic">${ico('alerta')}</div><div><div class="eyebrow">A pasta precisa da sua permissão</div>
    <p class="dim">A pasta <b>${esc(Pasta.nome)}</b> está ligada, mas o navegador pede que você confirme o acesso de novo. Até lá, o jogo
    salva só no navegador; ao permitir, o que estiver mais novo vai para a pasta.</p>
    <div class="pst-bts"><button class="btn sm" id="pastaReconectar">Permitir acesso à pasta</button>
      <button class="btn ghost sm" id="pastaDesligar">Parar de usar a pasta</button></div></div></div>`;
  return `<div class="card pst"><div class="pst-ic">${ico('disco')}</div><div><div class="eyebrow">Guarde suas carreiras numa pasta do PC</div>
    <p class="dim">Por enquanto elas estão só no navegador. Com uma pasta, cada carreira vira um arquivo no seu computador: não some se
    você limpar os dados do navegador, dá para fazer backup e levar para o app de PC.</p>
    <div class="pst-bts"><button class="btn sm" id="pastaEscolher">Escolher a pasta</button></div></div></div>`;
}
/* o pedido de acesso, com o motivo dito antes do navegador perguntar */
function modalPasta(){
  abrir(`<div class="pst-modal"><div class="eyebrow">Pasta de saves</div><h2 class="sec">Salvar no seu computador</h2>
    <p>O VCT Manager não tem servidor: suas carreiras ficam só com você. Para guardá-las como arquivos, o navegador vai pedir que você
    escolha um lugar, como <b>Documentos</b>. O jogo cria ali uma pasta <b>${esc(PASTA_NOME)}</b> e só mexe dentro dela.</p>
    <ul class="pst-lista">
      <li>${ico('check')} grava cada carreira (<code>.vctrun.json</code>) e a sua versão do Banco de dados</li>
      <li>${ico('check')} lê essa pasta ao abrir o jogo, para continuar de onde você parou</li>
      <li>${ico('x')} não lê nem altera nenhum outro arquivo do seu computador</li>
      <li>${ico('x')} não envia nada para a internet</li>
    </ul>
    <p class="dim">O navegador pode pedir para confirmar o acesso de novo em outras visitas. Dá para parar de usar a pasta quando quiser;
    os arquivos continuam lá.</p>
    <div class="neg-bts" style="justify-content:flex-end"><button class="btn ghost" data-close>Agora não</button>
      <button class="btn" id="pastaOk">Escolher a pasta</button></div></div>`);
  const b=$('#pastaOk');
  if(b)b.onclick=async()=>{
    const r=await Pasta.escolher();
    if(!r.ok){if(!r.cancelou)flash(r.erro);return;}
    fechar();
    await depoisDaPasta(r);
    flash('Salvando em '+r.caminho+(r.vieram?' — '+r.vieram+' arquivo(s) carregado(s) da pasta':'')+'.');
  };
}
async function depoisDaPasta(r){
  /* uma base editada que veio da pasta passa a valer no menu */
  if(r&&r.vieram&&typeof Base!=='undefined'&&!Base.editando)await Base.iniciar();
  await atualizarRuns();render();
}
async function reconectarPasta(){
  const ok=await Pasta.reconectar();
  if(!ok){flash('O navegador não liberou a pasta.');return;}
  await depoisDaPasta({vieram:1});
  flash('Pasta '+Pasta.nome+' conectada.');
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
