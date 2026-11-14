/* ============================================================
   TELA DE RUNS — criar, carregar, exportar e importar partidas
   ============================================================ */
let listaRuns=[];
async function atualizarRuns(){listaRuns=await Storage.listar();}
/* Apagar some da tela NA HORA e grava depois. Antes o clique esperava o
   armazenamento e a releitura de todas as carreiras para redesenhar; e se a
   partida apagada era a que estava aberta, o salvamento automático (ao sair,
   ao começar um jogo novo) a gravava de novo e ela "voltava". Agora ela é
   fechada e fica marcada como apagada. */
async function apagarPartidas(ids){
  const set=new Set(ids);
  listaRuns=listaRuns.filter(r=>!set.has(r.id));
  if(G&&G.runId&&set.has(G.runId)){G=null;modo='menu';telaMenu='runs';}
  /* a tela não pode impedir a exclusão: se desenhar falhar, apaga mesmo assim */
  try{render();}catch(e){console.error(e);}
  flash(ids.length>1?ids.length+' partidas apagadas.':'Partida apagada.');
  try{for(const id of ids)await Storage.apagar(id);}
  catch(e){flash('Não deu para apagar no armazenamento: '+(e&&e.message||e));}
  await atualizarRuns();
  if(modo==='menu')try{render();}catch(e){console.error(e);}
}
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

  ${G&&(G.meuTime||G.voce)?`<div class="card"><div class="split"><div class="eyebrow">Run atual</div>
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
  const app=Pasta.noApp();
  const mais=`<button class="btn ghost sm" data-savesinfo>Vantagens e desvantagens</button>`;
  if(Pasta.estado==='sem-suporte')return `<div class="card flat pst"><div class="pst-ic">${ico('disco')}</div><div><div class="eyebrow">Salvar numa pasta do PC</div>
    <p class="dim">${motivoSemPasta()} Enquanto isso, suas carreiras continuam salvas ${app?'no app':'no navegador'}${app?'':'; se você limpar os dados de navegação, elas vão junto'}.
    Use <b>Exportar .json</b> de vez em quando para ter uma cópia.</p>
    <div class="pst-bts">${mais}</div></div></div>`;
  if(Pasta.estado==='ligada')return `<div class="card pst ok"><div class="pst-ic">${ico('check')}</div><div><div class="eyebrow">Salvando também numa pasta do seu PC</div>
    <p class="dim">Pasta <b>${esc(Pasta.caminho||Pasta.nome)}</b>: cada carreira é um arquivo <code>.vctrun.json</code> e a sua versão do Banco de dados é
    <code>base-de-dados.vctbase.json</code>. Pode copiar a pasta para outro computador, pôr no OneDrive/Google Drive ou fazer backup dela.</p>
    <div class="pst-bts">${app?'<button class="btn ghost sm" id="pastaAbrir">Abrir a pasta</button>':''}
      <button class="btn ghost sm" id="pastaTrocar">Trocar de pasta</button>
      <button class="btn ghost sm" id="pastaDesligar">Parar de usar a pasta</button>${mais}</div></div></div>`;
  if(Pasta.estado==='pendente')return `<div class="card pst pend"><div class="pst-ic">${ico('alerta')}</div><div><div class="eyebrow">A pasta precisa da sua permissão</div>
    <p class="dim">A pasta <b>${esc(Pasta.nome)}</b> está ligada, mas o navegador pede que você confirme o acesso de novo. Até lá, o jogo
    salva só no navegador; ao permitir, o que estiver mais novo vai para a pasta.</p>
    <div class="pst-bts"><button class="btn sm" id="pastaReconectar">Permitir acesso à pasta</button>
      <button class="btn ghost sm" id="pastaDesligar">Parar de usar a pasta</button>${mais}</div></div></div>`;
  return `<div class="card pst"><div class="pst-ic">${ico('disco')}</div><div><div class="eyebrow">Guarde suas carreiras numa pasta do PC</div>
    <p class="dim">Por enquanto elas estão só ${app?'dentro do app':'no navegador'}. Com uma pasta, cada carreira vira um arquivo no seu computador:
    ${app?'dá para abrir, copiar, fazer backup e levar para o site ou para outro PC.':'não some se você limpar os dados do navegador, dá para fazer backup e levar para o app de PC.'}</p>
    <div class="pst-bts"><button class="btn sm" id="pastaEscolher">${app?'Salvar em Documentos\\VCT Manager':'Escolher a pasta'}</button>${mais}</div></div></div>`;
}
/* Por que a pasta não está disponível aqui, dito de um jeito que o jogador
   consiga resolver: cada caso tem uma saída diferente. */
function motivoSemPasta(){
  const ua=navigator.userAgent||'';
  if(Pasta.noApp())return 'Esta instalação do app de PC é de antes da pasta de saves. Instale a versão mais nova (Releases no GitHub) por cima desta: as carreiras continuam.';
  if(!self.isSecureContext)return 'O jogo foi aberto por um endereço sem HTTPS, e o navegador só libera pastas em páginas seguras. Abra pelo endereço oficial (https://).';
  if(navigator.brave)return 'O Brave desliga esse recurso por padrão. Para ligar: abra <code>brave://flags/#file-system-access-api</code>, mude para <b>Enabled</b> e reinicie o Brave. Ou use o Chrome, o Edge ou o app de PC.';
  if(/Firefox\//.test(ua))return 'O Firefox não deixa sites gravarem numa pasta. Use o Chrome, o Edge ou o Opera no computador, ou o app de PC.';
  if(/Safari\//.test(ua)&&!/Chrome|Chromium|Edg\//.test(ua))return 'O Safari não deixa sites gravarem numa pasta. Use o Chrome ou o Edge, ou o app de PC.';
  if(/Android|iPhone|iPad|Mobile/.test(ua))return 'No celular nenhum navegador deixa sites gravarem numa pasta.';
  return 'Este navegador não deixa sites gravarem numa pasta (só Chrome, Edge e Opera no computador deixam, ou o app de PC).';
}
/* Onde as carreiras ficam, com prós e contras de cada jeito. Abre do menu
   principal e da tela de partidas salvas: o jogador tem de saber disso antes
   de perder uma carreira por limpar o navegador. */
function textoOndeSalva(){
  const app=Pasta.noApp();
  if(Pasta.estado==='ligada')return 'na pasta '+(Pasta.caminho||Pasta.nome)+(app?' e no app':' e no navegador');
  if(Pasta.estado==='pendente')return 'só no navegador: a pasta pede permissão';
  return app?'dentro do app (sem pasta)':'só no navegador';
}
function modalSaves(){
  const app=Pasta.noApp();
  const pode=Pasta.suporta();
  const atual=Pasta.estado==='ligada';
  const lado=(titulo,on,pros,contras,rodape)=>`<div class="sv-op ${on?'on':''}">
    <div class="sv-op-t"><b>${titulo}</b>${on?'<span class="chip g">você está usando</span>':''}</div>
    <ul class="pst-lista">${pros.map(t=>`<li>${ico('check')} ${t}</li>`).join('')}${contras.map(t=>`<li class="sv-c">${ico('x')} ${t}</li>`).join('')}</ul>
    ${rodape||''}</div>`;
  const soLocal=app
    ?lado('Só dentro do app',!atual,
      ['nada para configurar: salva sozinho a cada rodada','continua lá ao atualizar ou reinstalar o app'],
      ['fica escondido em %APPDATA%\\VCT Manager, num banco de dados, e não como arquivos','não aparece no site nem em outro computador; para levar, só exportando a carreira (.vctrun.json)','desinstalar apagando os dados do app leva as carreiras junto'])
    :lado('Só no navegador',!atual,
      ['nada para configurar: salva sozinho a cada rodada','funciona em qualquer navegador, inclusive no celular'],
      ['limpar os dados de navegação (ou "cookies e dados de sites") apaga as carreiras','aba anônima, outro navegador ou outro computador não enxergam o que você jogou','não dá para ver nem copiar os arquivos; o backup é exportar carreira por carreira']);
  const pasta=lado(app?'Numa pasta do PC (Documentos\\VCT Manager)':'Numa pasta do PC',atual,
    ['cada carreira vira um arquivo .vctrun.json que você vê no Explorer','dá para fazer backup, pôr no OneDrive/Google Drive e levar para outro PC',
     app?'a mesma pasta serve para o site (no Chrome ou no Edge): o mais novo de cada lado vale':'não some ao limpar o navegador, e serve também para o app de PC'],
    app?['os arquivos são seus: se apagar a pasta, apaga a cópia (o app ainda guarda a dele)']
       :['só Chrome, Edge e Opera no computador deixam (Firefox, Safari e celular não)','o navegador pode pedir para você confirmar o acesso de novo em algumas visitas','os arquivos são seus: se apagar a pasta, apaga a cópia'],
    !pode?`<p class="dim" style="font-size:12px">${motivoSemPasta()}</p>`:'');
  abrir(`<div class="sv-modal"><div class="eyebrow">Seus saves</div><h2 class="sec">Onde ficam suas carreiras</h2>
    <p>O VCT Manager não tem servidor: nada do que você joga sai do seu computador. Agora suas carreiras estão
      <b>${esc(textoOndeSalva())}</b>.</p>
    <div class="sv-ops">${soLocal}${pasta}</div>
    <p class="dim" style="font-size:12px">Usar a pasta não tira o jeito automático: o jogo continua salvando ${app?'no app':'no navegador'} e também grava na pasta.
      Em qualquer modo, <b>Partidas salvas › Exportar .json</b> gera um arquivo de uma carreira para guardar ou mandar para alguém.</p>
    <div class="neg-bts" style="justify-content:flex-end;flex-wrap:wrap">
      ${atual&&app?'<button class="btn ghost" id="svAbrir">Abrir a pasta</button>':''}
      ${atual?'<button class="btn ghost" id="svParar">Parar de usar a pasta</button>':''}
      <button class="btn ghost" data-close>Fechar</button>
      ${!atual&&pode?`<button class="btn" id="svPasta">${app?'Usar Documentos\\VCT Manager':'Escolher a pasta'}</button>`:''}
    </div></div>`);
  try{Prefs.set('savesVisto',true);}catch(e){}
  const on=(id,fn)=>{const b=$('#'+id);if(b)b.onclick=fn;};
  on('svPasta',()=>{fechar();app?usarPastaDoApp(false):modalPasta();});
  on('svAbrir',()=>Pasta.abrirNoPC());
  on('svParar',async()=>{await Pasta.desligar();fechar();render();flash('O jogo parou de gravar na pasta. Os arquivos continuam lá.');});
}
async function usarPastaDoApp(trocar){
  const r=await Pasta.escolher(trocar);
  if(!r.ok){if(!r.cancelou)flash(r.erro);return;}
  await depoisDaPasta(r);
  flash('Salvando também em '+r.caminho+(r.vieram?' — '+r.vieram+' arquivo(s) carregado(s) da pasta':'')+'.');
}
/* o pedido de acesso, com o motivo dito antes do navegador perguntar */
function modalPasta(){
  if(Pasta.noApp())return usarPastaDoApp(false);
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
