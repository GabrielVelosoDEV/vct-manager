/* ============================================================
   SHELL DO MENU — fora da partida
   ------------------------------------------------------------
   Menu principal, banco de dados, partidas salvas, configurações
   e créditos. Nenhuma dessas telas tem sidebar ou topbar: elas
   não são "onde você joga", são onde você prepara e configura.

   O banco de dados aparece aqui E dentro do jogo (mesma função
   vEditor), mas com alcances diferentes: aqui ele edita a BASE
   (permanente, vale para toda carreira nova — ver data/base.js);
   dentro do jogo ele edita só aquele save.
   ============================================================ */
const VERSAO_JOGO='0.4';

function renderMenu(limpo){
  const el=$('#shellMenu');
  /* mesma pintura sem piscar do jogo (pintarRaiz em shell.js) */
  const entra=como=>{if(como!=='morfou'&&typeof animacaoLigada==='function'&&animacaoLigada()){
    el.classList.remove('entra');void el.offsetWidth;el.classList.add('entra');}};
  if(telaMenu==='menu'){entra(pintarRaiz(el,vMenuPrincipal(),'menu|menu',{limpo}));ligarMenuPrincipal();return;}
  const mapa={
    banco:['Banco de dados',vEditor],
    runs:['Partidas salvas',vRuns],
    config:['Configurações',vConfig],
    creditos:['Créditos',vCreditos]
  }[telaMenu];
  if(!mapa){telaMenu='menu';return renderMenu();}
  entra(pintarRaiz(el,`
    <div class="menu-topo">
      <button class="btn ghost sm" id="menuVoltar">‹ Menu</button>
      <h2 class="sec" style="margin:0">${esc(mapa[0])}</h2>
      ${telaMenu==='banco'?'<button class="btn" id="menuComecar">Novo jogo com esta base</button>':''}
      ${carreiraAberta()?'<button class="btn teal" id="menuVoltarJogo">Voltar ao jogo</button>':''}
    </div>
    <div class="menu-corpo" id="menuCorpo">${mapa[1]()}</div>`,'menu|'+telaMenu,{limpo}));
  $('#menuVoltar').onclick=()=>{telaMenu='menu';render();};
  const bc=$('#menuComecar');if(bc)bc.onclick=()=>novaCarreira();
  const bv=$('#menuVoltarJogo');if(bv)bv.onclick=()=>{telaMenu='menu';Base.fecharEdicao();entrarNoJogo();};
  /* cada edição na base é gravada logo depois de repintar */
  if(telaMenu==='banco')Base.agendarGravacao();
  const corpo=$('#menuCorpo');
  corpo.querySelectorAll('.jrow').forEach(r=>r.onclick=()=>modalJogador(r.dataset.p));
  ligarEventos();
}

/* a carreira em memória, mesmo com a base aberta no Banco de dados do menu */
function carreiraAberta(){
  const g=Base.editando?Base._guardaG:G;
  return !!(g&&g.meuTime);
}

/* vMenuPrincipal e ligarMenuPrincipal moram em ui/abertura.js (tela inicial) */

/* ---------- transições de modo ---------- */
function entrarNoJogo(){
  if(!G||!G.meuTime){flash('Assuma um clube primeiro.');return;}
  modo='jogo';
  if(typeof garantirManagerNaComissao==='function')garantirManagerNaComissao();
  if(typeof _titulosVistos!=='undefined')_titulosVistos=null;
  if(!hist.length){hist=[tela];histPos=0;}
  render();
}
function sairParaMenu(t){
  modo='menu';telaMenu=t||'menu';render();
}

/* ---------- novo jogo ----------
   Carreira nova sempre nasce da base de dados: cópia do mundo guardado,
   com semente nova para o que vai acontecer nele. Não há mais etapa de
   montar o mundo antes de escolher o clube — isso é o Banco de dados do
   menu, e vale para todas as carreiras. */
async function novaCarreira(semente){
  /* a carreira em andamento é gravada antes de sair de cena */
  Base.fecharEdicao();
  if(G&&G.meuTime){await salvarRun(G.runNome);await atualizarRuns();}
  iniciarPreRun(semente);
  modo='menu';telaMenu='menu';render();
  telaNovoJogo();
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */
function vConfig(){
  const sw=(k,rot,desc)=>`<div class="opt"><div class="txt"><b>${rot}</b><span>${desc}</span></div>
    <div class="ctl"><button class="sw ${Prefs.get(k)?'on':''}" data-pref="${k}"
      role="switch" aria-checked="${!!Prefs.get(k)}" aria-label="${esc(rot)}"></button></div></div>`;
  return `
  <details class="card cfg-sec" open><summary><span class="eyebrow">${icone('jogar')} Partida</span><span class="dim">relatório, veto, ao vivo, salvamento</span></summary>
    ${sw('prePartida','Relatório e veto antes da partida',
         'Nas suas partidas, abre o relatório de scouting do adversário e passa o veto de mapas '+
         'para você. O nível de detalhe do relatório vem do seu analista e do seu olheiro. '+
         'Desligado, a comissão veta sozinha, como antes.')}
    ${sw('tempoTecnico','Pedir tempo durante a partida',
         'Libera o pedido de tempo na transmissão ao vivo: dois por mapa, para cortar uma sequência '+
         'de rounds perdidos. Exige assistir ao vivo.')}
    ${sw('aoVivo','Assistir a partida ao vivo',
         'Revela a partida round a round, com ritmo que desacelera nos momentos que pesam. '+
         'A partida já foi decidida pelo motor — assistir não muda nada, e dá para pular a qualquer momento.')}
    ${sw('modalPartida','Abrir a ficha da minha partida',
         'Ao avançar, mostra o placar round a round e o box score do seu jogo. Desligado, o resultado entra direto no histórico.')}
    ${sw('resumoRodada','Mostrar resumo das outras partidas',
         'Quando você não joga na rodada, abre um resumo do que aconteceu no circuito.')}
    ${sw('turnosNaJanela','Janela de transferências em turnos de dois dias',
         'Com a janela aberta, cada Avançar move dois dias em vez de uma semana: três momentos por semana '+
         'para responder propostas e fechar negócios antes da concorrência. O volume de negócios da semana é o mesmo. '+
         'Desligado, a janela anda de semana em semana, como antes.')}
    ${sw('autosave','Salvar automaticamente ao avançar',
         'Grava a run a cada rodada resolvida. Desligado, só salva no botão Salvar.')}
  </details>

  <details class="card cfg-sec" open><summary><span class="eyebrow">${icone('olho')} Interface</span><span class="dim">dicas, animação, rostos, tema</span></summary>
    ${sw('dicas','Dicas da primeira temporada',
         'Mostra uma dica no topo de cada tela na primeira visita e a lista de primeiros passos na Central, '+
         'só durante a primeira temporada da carreira.')}
    ${G&&G.meuTime?`<div class="opt"><div class="txt"><b>Dificuldade desta carreira: ${esc(dificuldade().nome)}</b>
      <span>${esc(dificuldade().resumo)} Escolhida na carreira nova e fixa até o fim dela.</span></div></div>`:''}
    ${sw('animacoes','Animação de entrada dos painéis',
         'Painéis entram com um leve deslocamento. Desligue se preferir a tela estática.')}
    <div class="opt"><div class="txt"><b>Rostos gerados</b>
      <span>${Rostos.pronto()?'Pacote com '+Rostos.quantos()+' retratos montado.'
        :'Nenhum pacote montado — rode tools/rostos.py. Sem ele o jogo desenha o monograma.'}
      A base tem 447 nomes de jogadores reais: rosto sintético ao lado de um nome real
      se lê como foto da pessoa, e não é. Por isso o padrão cobre só quem é fictício.</span></div>
      <div class="ctl"><select id="cfgRostos">${[['ficticios','Só fictícios'],['todos','Todos'],['nenhum','Ninguém']]
        .map(([k,n])=>`<option value="${k}" ${Prefs.get('rostosGerados')===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="opt"><div class="txt"><b>Tema</b><span>Escuro. O tema claro saiu na versão 0.4 — a paleta hoje é a do Valorant sobre fundo escuro.</span></div>
      <div class="ctl"><span class="chip">escuro</span></div></div>
    <div class="opt"><div class="txt"><b>Idioma</b><span>Português do Brasil. Sem outros idiomas por enquanto.</span></div>
      <div class="ctl"><span class="chip">pt-BR</span></div></div>
  </details>

  <details class="card flat cfg-sec"><summary><span class="eyebrow">${icone('disco')} Armazenamento</span><span class="dim">${esc(Storage.modo)} · save v${RUN_VERSAO}</span></summary>
    <table><tbody>
      <tr><td>Camada ativa</td><td class="r"><b>${esc(Storage.modo)}</b></td></tr>
      <tr><td>Versão do save</td><td class="r num">${RUN_VERSAO}</td></tr>
      <tr><td>Partidas salvas</td><td class="r num">${listaRuns.length}</td></tr>
      <tr><td>Pacote de imagens</td><td class="r num">${Imgs.quantos()} · ${Math.round(Imgs.bytes()/1024)} KB</td></tr>
      <tr><td>Semente do mundo atual</td><td class="r num">${G?G.seed:'—'}</td></tr>
    </tbody></table>
    <p class="dim" style="margin-top:8px">O formato canônico de backup é o arquivo <code>.vctrun.json</code>,
    em Partidas salvas. Nenhuma camada do navegador é confiável em todo contexto.</p>
  </details>

  <details class="card cfg-sec risco"><summary><span class="eyebrow">${icone('alerta','red')} Zona de risco</span><span class="dim">ações sem desfazer</span></summary>
    <p class="dim">Estas ações não têm desfazer.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="btn ghost" id="cfgApagarRuns">Apagar todas as partidas salvas</button>
      <button class="btn ghost" id="cfgLimparImgs">Limpar o pacote de imagens</button>
    </div>
  </details>`;
}

/* ============================================================
   CRÉDITOS
   ============================================================ */
function vCreditos(){
  return `
  <div class="card"><div class="eyebrow">O que é isto</div>
    <h3 class="sub">VCT Manager v${VERSAO_JOGO}</h3>
    <p class="dim">Simulador de gestão de e-sports de Valorant: elenco, táticas, treino, mercado,
    base, finanças e o circuito internacional rodando ao redor. Projeto pessoal, sem fins comerciais.</p>
  </div>

  <div class="card flat"><div class="eyebrow">Dados</div>
    <p class="dim">As 80 organizações e os 447 jogadores do elenco de partida vêm da base pública do
    <b>vlr.gg</b>, lidos em 28/08/2026. Nome de clube, tag e nick são dado real. Função, over, idade e
    país são estimativa — os endpoints de estatística por jogador vinham vazios na coleta, então não há
    ACS nem rating de onde derivar. O prestígio do Tier 1 é calibrado pelo aproveitamento real de 2026.</p>
    <p class="dim" style="margin-top:8px">A comissão técnica real (técnicos, assistentes, analistas e
    managers) vem da <b>Liquipedia</b> (liquipedia.net/valorant), sob licença CC-BY-SA 3.0, e da
    seção de staff do <b>vlr.gg</b>, ambas lidas em 30/10/2026. Cargo sem dado real continua gerado.</p>
  </div>

  <div class="card flat"><div class="eyebrow">Tecnologia</div>
    <p class="dim">JavaScript sem dependência, sem build e sem servidor: o <code>index.html</code> abre
    com duplo clique. Tipografia Bebas Neue, Inter e JetBrains Mono. Simulação determinística por
    semente, com xorshift próprio em vez de <code>Math.random</code>.</p>
  </div>

  <div class="card" style="border-left:3px solid var(--line2)"><div class="eyebrow">Aviso</div>
    <p class="dim">Projeto de fã, sem qualquer vínculo, patrocínio ou aprovação da Riot Games.
    VALORANT e VCT são marcas da Riot Games, Inc. Nomes de organizações, jogadores e comissão
    técnica, escudos e fotos aparecem a título informativo e pertencem aos seus titulares.</p>
  </div>`;
}
