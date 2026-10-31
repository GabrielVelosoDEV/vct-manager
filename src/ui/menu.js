/* ============================================================
   SHELL DO MENU — fora da partida
   ------------------------------------------------------------
   Menu principal, banco de dados, partidas salvas, configurações
   e créditos. Nenhuma dessas telas tem sidebar ou topbar: elas
   não são "onde você joga", são onde você prepara e configura.

   O banco de dados aparece aqui E dentro do jogo (mesma função
   vEditor), porque montar base é pré-jogo mas corrigir um nick
   no meio da temporada também acontece.
   ============================================================ */
const VERSAO_JOGO='0.4';

function renderMenu(){
  const el=$('#shellMenu');
  if(telaMenu==='menu'){el.innerHTML=vMenuPrincipal();ligarMenuPrincipal();return;}
  const mapa={
    banco:['Banco de dados',vEditor],
    runs:['Partidas salvas',vRuns],
    config:['Configurações',vConfig],
    creditos:['Créditos',vCreditos]
  }[telaMenu];
  if(!mapa){telaMenu='menu';return renderMenu();}
  el.innerHTML=`
    <div class="menu-topo">
      <button class="btn ghost sm" id="menuVoltar">‹ Menu</button>
      <h2 class="sec" style="margin:0">${esc(mapa[0])}</h2>
      ${telaMenu==='banco'&&G&&preRun()?'<button class="btn" id="menuComecar">Escolher clube e começar</button>':''}
      ${G&&G.meuTime?'<button class="btn teal" id="menuVoltarJogo">Voltar ao jogo</button>':''}
    </div>
    <div class="menu-corpo" id="menuCorpo">${mapa[1]()}</div>`;
  $('#menuVoltar').onclick=()=>{telaMenu='menu';render();};
  const bc=$('#menuComecar');if(bc)bc.onclick=()=>telaNovoJogo();
  const bv=$('#menuVoltarJogo');if(bv)bv.onclick=()=>entrarNoJogo();
  const corpo=$('#menuCorpo');
  corpo.querySelectorAll('.jrow').forEach(r=>r.onclick=()=>modalJogador(r.dataset.p));
  ligarEventos();
}

function vMenuPrincipal(){
  const salvaComClube=listaRuns.find(r=>r.clube&&r.clube!=='—');
  const podeContinuar=!!(G&&G.meuTime)||!!salvaComClube;
  const ondeEstou=(G&&G.meuTime)?T(G.meuTime).nome+' · '+G.ano
    :salvaComClube?salvaComClube.clube+' · '+salvaComClube.ano:'nenhuma partida em andamento';
  /* mosaico de escudos: ordem fixa dos ids, sem tocar no RNG do motor */
  /* repete a lista para o mosaico encher a área sem buracos; ordem fixa dos
     ids, sem tocar no RNG do motor */
  const base=G?Object.values(G.times):[];
  const escudos=base.length?Array.from({length:130},(_,i)=>base[i%base.length]):[];
  const item=(id,icone,rot,sub,attrs)=>
    `<button class="menu-item ${attrs&&attrs.destaque?'destaque':''}" id="${id}" ${attrs&&attrs.off?'disabled':''}>
       ${ico(icone)}<span>${rot}</span>${sub?`<span class="sub">${esc(sub)}</span>`:''}</button>`;
  return `
  <div class="menu-wrap">
    <div class="menu-lado">
      <div class="menu-marca">
        <span class="l1">VCT</span><span class="l2">MANAGER</span>
        <span class="ver">v${VERSAO_JOGO} · temporada 2026</span>
      </div>
      <div class="menu-lista">
        ${item('mnContinuar','jogar','Continuar',ondeEstou,{destaque:podeContinuar,off:!podeContinuar})}
        ${item('mnNovo','mais','Novo jogo','gera um mundo novo')}
        ${item('mnRuns','disco','Partidas salvas',listaRuns.length+' salva(s)')}
        ${item('mnBanco','banco','Banco de dados',G?Object.keys(G.times).length+' clubes':'')}
        ${item('mnConfig','engrenagem','Configurações')}
        ${item('mnCreditos','info','Créditos')}
      </div>
      <div class="menu-pe">
        <span>Armazenamento: <b>${Storage.modo}</b></span>
        <span>Imagens: <b>${Imgs.quantos()}</b></span>
        <span>Save v${RUN_VERSAO}</span>
      </div>
    </div>
    <div class="menu-arte">
      <div class="menu-mosaico">${escudos.map(t=>`<div>${escudo(t,44)}</div>`).join('')}</div>
      <div class="vinheta"></div>
      <div class="menu-selo">
        <div class="t">CIRCUITO<br><em>MUNDIAL</em></div>
        <div class="s">Americas · EMEA · Pacific · China</div>
      </div>
    </div>
  </div>`;
}
function ligarMenuPrincipal(){
  const liga=(id,fn)=>{const el=$('#'+id);if(el&&!el.disabled)el.onclick=fn;};
  liga('mnContinuar',async()=>{
    if(G&&G.meuTime){entrarNoJogo();return;}
    const r=listaRuns.find(x=>x.clube&&x.clube!=='—');
    if(!r)return;
    const ok=await carregarRun(r.id);
    if(!ok){flash('Não deu para carregar essa partida.');return;}
    entrarNoJogo();
  });
  liga('mnNovo',()=>modalNovoMundo());
  liga('mnRuns',()=>{telaMenu='runs';render();});
  liga('mnBanco',()=>{telaMenu='banco';render();});
  liga('mnConfig',()=>{telaMenu='config';render();});
  liga('mnCreditos',()=>{telaMenu='creditos';render();});
}

/* ---------- transições de modo ---------- */
function entrarNoJogo(){
  if(!G||!G.meuTime){flash('Assuma um clube primeiro.');return;}
  modo='jogo';
  if(!hist.length){hist=[tela];histPos=0;}
  render();
}
function sairParaMenu(t){
  modo='menu';telaMenu=t||'menu';render();
}

/* ---------- novo mundo ---------- */
function modalNovoMundo(){
  const semente=Math.floor(Math.random()*900000)+1000;
  abrir(`<div class="eyebrow">Novo jogo</div><h2 class="sec">Gerar o mundo</h2>
    <p class="dim">A semente define os elencos gerados: a mesma semente sempre produz o mesmo mundo.
    Depois de gerar você cai no Banco de dados para ajustar times e elencos, e só então escolhe o clube.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:14px">
      <label class="dim" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase">Semente</label>
      <input type="number" id="nmSeed" value="${semente}" style="width:130px">
      <button class="btn ghost sm" id="nmSorteia">Sortear outra</button>
    </div>
    ${G&&G.meuTime?'<div class="card flat" style="border-left:3px solid var(--amber);margin-top:14px">Você tem uma partida em andamento. Gerar um mundo novo não apaga o que está salvo, mas sai da partida atual — salve antes se quiser voltar.</div>':''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn" id="nmGerar">Gerar mundo</button>
      <button class="btn ghost" data-close>Cancelar</button></div>`);
  $('#nmSorteia').onclick=()=>{$('#nmSeed').value=Math.floor(Math.random()*900000)+1000;};
  $('#nmGerar').onclick=()=>{
    const s=parseInt($('#nmSeed').value)||semente;
    iniciarPreRun(s);
    $('#modal').innerHTML='';
    modo='menu';telaMenu='banco';render();
    flash('Mundo gerado com a semente '+s+'.');
  };
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */
function vConfig(){
  const sw=(k,rot,desc)=>`<div class="opt"><div class="txt"><b>${rot}</b><span>${desc}</span></div>
    <div class="ctl"><button class="sw ${Prefs.get(k)?'on':''}" data-pref="${k}"
      role="switch" aria-checked="${!!Prefs.get(k)}" aria-label="${esc(rot)}"></button></div></div>`;
  return `
  <div class="card"><div class="eyebrow">Partida</div>
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
    ${sw('autosave','Salvar automaticamente ao avançar',
         'Grava a run a cada rodada resolvida. Desligado, só salva no botão Salvar.')}
  </div>

  <div class="card"><div class="eyebrow">Interface</div>
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
  </div>

  <div class="card flat"><div class="eyebrow">Armazenamento</div>
    <table><tbody>
      <tr><td>Camada ativa</td><td class="r"><b>${esc(Storage.modo)}</b></td></tr>
      <tr><td>Versão do save</td><td class="r num">${RUN_VERSAO}</td></tr>
      <tr><td>Partidas salvas</td><td class="r num">${listaRuns.length}</td></tr>
      <tr><td>Pacote de imagens</td><td class="r num">${Imgs.quantos()} · ${Math.round(Imgs.bytes()/1024)} KB</td></tr>
      <tr><td>Semente do mundo atual</td><td class="r num">${G?G.seed:'—'}</td></tr>
    </tbody></table>
    <p class="dim" style="margin-top:8px">O formato canônico de backup é o arquivo <code>.vctrun.json</code>,
    em Partidas salvas. Nenhuma camada do navegador é confiável em todo contexto.</p>
  </div>

  <div class="card"><div class="eyebrow">Zona de risco</div>
    <p class="dim">Estas ações não têm desfazer.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="btn ghost" id="cfgApagarRuns">Apagar todas as partidas salvas</button>
      <button class="btn ghost" id="cfgLimparImgs">Limpar o pacote de imagens</button>
    </div>
  </div>`;
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
