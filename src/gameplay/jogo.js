/* ============================================================
   GAMEPLAY · A TELA (menu, controles, laço, HUD, relatório)
   Laboratório do modo carreira jogador — fase 1: duelo 1v1 e
   treino de alvos em qualquer um dos 13 mapas.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.NIVEIS = {
  ranked: {nome: 'Ranked', desc: 'imortal das ranqueadas', a: {mira: 56, reflexo: 55, movimento: 54, visao: 52, clutch: 50, consistencia: 48}},
  tier2:  {nome: 'Tier 2', desc: 'Challengers', a: {mira: 71, reflexo: 70, movimento: 68, visao: 66, clutch: 66, consistencia: 66}},
  tier1:  {nome: 'Tier 1', desc: 'franquia do VCT', a: {mira: 86, reflexo: 86, movimento: 82, visao: 80, clutch: 82, consistencia: 84}},
};
GP.ATRIB_ROTULO = {mira: 'Mira', reflexo: 'Reflexo', movimento: 'Movimento', visao: 'Visão', clutch: 'Controle (clutch)', consistencia: 'Consistência'};
GP.ATRIB_EFEITO = {
  mira: 'erro do tiro', reflexo: 'a mão firma mais rápido quando o inimigo aparece', movimento: 'velocidade e parada',
  visao: 'abertura do cone', clutch: 'controle da rajada', consistencia: 'só no bot: oscila menos'};

GP.UI = {
  opc: {mapa: 'ascent', modo: 'duelo', arma: 'vandal', nivelEu: 'tier2', nivelBot: 'tier2', spawns: 'rapido', rounds: 5, agenteEu: 'jett', agenteBot: 'aleatorio'},
  atribEu: null,
};
GP._salvarOpc = function () { try { localStorage.setItem('vct-gameplay-opc', JSON.stringify({opc: GP.UI.opc, atribEu: GP.UI.atribEu})); } catch (e) { /* sem armazenamento */ } };
GP._lerOpc = function () {
  try { const s = JSON.parse(localStorage.getItem('vct-gameplay-opc') || 'null'); if (s) { Object.assign(GP.UI.opc, s.opc || {}); GP.UI.atribEu = s.atribEu || null; } } catch (e) { /* ignora */ }
  if (!GP.NIVEIS[GP.UI.opc.nivelBot]) GP.UI.opc.nivelBot = 'tier2';
  if (!GP.AGENTES[GP.UI.opc.agenteEu]) GP.UI.opc.agenteEu = 'jett';
  if (GP.UI.opc.agenteBot !== 'aleatorio' && !GP.AGENTES[GP.UI.opc.agenteBot]) GP.UI.opc.agenteBot = 'aleatorio';
  if (!GP.UI.atribEu) GP.UI.atribEu = {...GP.NIVEIS[GP.UI.opc.nivelEu in GP.NIVEIS ? GP.UI.opc.nivelEu : 'tier2'].a};
};
const $gp = s => document.querySelector(s);
const escGP = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/* ---------- agentes no menu ---------- */
GP._rostoAgente = function (id, cls) {
  const r = GP.agenteImg(id, 'retrato'), A = GP.AGENTES[id];
  return r ? `<img class="${cls || ''}" src="${r.src}" alt="">` : `<span class="${cls || ''} gp-ini">${escGP(A.nome.slice(0, 2).toUpperCase())}</span>`;
};
GP._gradeAgentes = function (sel) {
  return Object.keys(GP.PAPEIS).map(papel => `<div class="gp-pap"><span class="gp-pap-n">${GP.PAPEIS[papel]}</span><div class="gp-ags">
    ${Object.values(GP.AGENTES).filter(a => a.papel === papel).map(a => `<button class="gp-ag ${sel === a.id ? 'on' : ''} ${GP.temImagem('agentes', a.id, 'parado') ? 'img' : ''}" data-op="agenteEu" data-val="${a.id}" title="${escGP(a.nome)}">
      ${GP._rostoAgente(a.id, 'gp-ag-r')}<b>${escGP(a.nome)}</b></button>`).join('')}</div></div>`).join('');
};
/* o rival: o escolhido, ou um duelista sorteado (de preferência um que já tem boneco) */
GP._agenteDoRival = function () {
  const o = GP.UI.opc;
  if (o.agenteBot !== 'aleatorio') return o.agenteBot;
  const duel = Object.values(GP.AGENTES).filter(a => a.papel === 'duelista' && a.id !== o.agenteEu);
  const comImg = duel.filter(a => GP.temImagem('agentes', a.id, 'parado'));
  const pool = comImg.length ? comImg : duel;
  return pool[Math.floor(Math.random() * pool.length)].id;
};

/* ---------- menu ---------- */
GP.menu = function () {
  const o = GP.UI.opc, a = GP.UI.atribEu;
  const bt = (grupo, val, rot, sub) => `<button class="gp-op ${o[grupo] === val ? 'on' : ''}" data-op="${grupo}" data-val="${val}"><b>${escGP(rot)}</b>${sub ? `<span>${escGP(sub)}</span>` : ''}</button>`;
  const mapas = Object.keys(GP.NOME_MAPA).sort().map(k => {
    const t = GP.TEMAS[k];
    return `<button class="gp-mapa ${o.mapa === k ? 'on' : ''}" data-op="mapa" data-val="${k}" style="--c1:${t.chao};--c2:${t.topo};--c3:${t.acento}">
      <i></i><b>${GP.NOME_MAPA[k]}</b><span>${escGP(t.lugar)}</span></button>`;
  }).join('');
  const armas = ['vandal', 'phantom', 'spectre', 'sheriff', 'operator', 'classic'].map(k => bt('arma', k, GP.ARMAS[k].nome, GP.ARMAS[k].preco ? GP.ARMAS[k].preco + ' créditos' : 'de graça')).join('');
  const sliders = Object.keys(GP.ATRIB_ROTULO).filter(k => k !== 'consistencia').map(k => `<label class="gp-sl"><span>${GP.ATRIB_ROTULO[k]} <i>${GP.ATRIB_EFEITO[k]}</i></span>
      <input type="range" min="40" max="95" value="${a[k]}" data-atr="${k}"><b class="num">${a[k]}</b></label>`).join('');
  $gp('#gpMenu').innerHTML = `<div class="gp-menu-in">
    <div class="gp-topo"><a class="gp-volta" href="index.html">← VCT Manager</a>
      <div><div class="gp-eyebrow">Modo carreira jogador · laboratório</div><h1>Gameplay de cima</h1>
      <p class="gp-dim">Fase 1 do protótipo: o seu bonequinho contra bots, nos 13 mapas extraídos dos minimapas. Os atributos mexem no jogo de verdade — mude e sinta a diferença.</p></div></div>
    <div class="gp-sec"><div class="gp-eyebrow">Mapa</div><div class="gp-mapas">${mapas}</div>
      <p class="gp-dim gp-tema">${escGP(GP.NOME_MAPA[o.mapa])}: ${escGP(GP.TEMAS[o.mapa].clima)}.</p></div>
    <div class="gp-cols">
      <div class="gp-sec"><div class="gp-eyebrow">Modo</div><div class="gp-ops">
        ${bt('modo', 'duelo', 'Duelo 1v1', 'round a round')}${bt('modo', 'alvos', 'Treino de alvos', '60 s, bots que não atiram')}</div>
        <div class="gp-eyebrow" style="margin-top:14px">Arma</div><div class="gp-ops gp-ops3">${armas}</div>
        <div class="gp-eyebrow" style="margin-top:14px">Rival</div><div class="gp-ops gp-ops3">
        ${Object.keys(GP.NIVEIS).map(k => bt('nivelBot', k, GP.NIVEIS[k].nome, GP.NIVEIS[k].desc)).join('')}</div>
        ${o.modo === 'duelo' ? `<div class="gp-eyebrow" style="margin-top:14px">Onde nasce</div><div class="gp-ops">
        ${bt('spawns', 'rapido', 'Perto', '20–40 m, sem se ver')}${bt('spawns', 'oficiais', 'Spawns do mapa', 'ataque × defesa')}</div>
        <div class="gp-eyebrow" style="margin-top:14px">Vence quem fizer</div><div class="gp-ops gp-ops3">
        ${bt('rounds', 3, '3 rounds')}${bt('rounds', 5, '5 rounds')}${bt('rounds', 7, '7 rounds')}</div>` : ''}
      </div>
      <div class="gp-sec"><div class="gp-eyebrow">O seu agente</div>${GP._gradeAgentes(o.agenteEu)}
        <p class="gp-dim gp-nota">Com contorno verde: já tem boneco. As habilidades entram na próxima fase; por enquanto o agente muda só o visual.</p>
        <label class="gp-rival">Agente do rival <select id="gpAgBot"><option value="aleatorio">um duelista sorteado</option>
          ${Object.values(GP.AGENTES).map(a => `<option value="${a.id}" ${o.agenteBot === a.id ? 'selected' : ''}>${escGP(a.nome)} · ${GP.PAPEIS[a.papel]}</option>`).join('')}</select></label>
        <div class="gp-eyebrow" style="margin-top:16px">O seu jogador</div><div class="gp-ops gp-ops3">
        ${Object.keys(GP.NIVEIS).map(k => bt('nivelEu', k, GP.NIVEIS[k].nome, 'atributos de ' + GP.NIVEIS[k].nome)).join('')}</div>
        <div class="gp-sls">${sliders}</div>
        <div class="gp-teclas"><div class="gp-eyebrow">Controles</div>
          <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> mover · <kbd>Shift</kbd> andar (sem barulho, mais preciso) · <kbd>Ctrl</kbd> agachar</p>
          <p><kbd>mouse</kbd> mirar · <kbd>clique</kbd> atirar · <kbd>botão direito</kbd> luneta (Operator) · <kbd>R</kbd> recarregar · <kbd>1</kbd><kbd>2</kbd> trocar arma · <kbd>roda</kbd> zoom · <kbd>Esc</kbd> pausa</p>
          <p class="gp-dim">Correndo, o tiro abre. Pare (solte as teclas ou segure Shift) antes de atirar e dê rajadas curtas. Os círculos vermelhos são passos que você ouve.</p></div>
      </div>
    </div>
    <div class="gp-acoes"><button class="gp-jogar" id="gpJogar">Jogar</button></div>
  </div>`;
  $gp('#gpMenu').hidden = false;
  document.querySelectorAll('#gpMenu [data-op]').forEach(el => el.onclick = () => {
    const g = el.dataset.op, v = el.dataset.val;
    o[g] = g === 'rounds' ? +v : v;
    if (g === 'nivelEu') GP.UI.atribEu = {...GP.NIVEIS[v].a};
    GP._salvarOpc(); GP.menu();
  });
  document.querySelectorAll('#gpMenu [data-atr]').forEach(el => el.oninput = () => {
    a[el.dataset.atr] = +el.value; el.nextElementSibling.textContent = el.value; o.nivelEu = 'personalizado';
    document.querySelectorAll('#gpMenu [data-op="nivelEu"]').forEach(b => b.classList.remove('on'));
    GP._salvarOpc();
  });
  $gp('#gpAgBot').onchange = e => { o.agenteBot = e.target.value; GP._salvarOpc(); };
  $gp('#gpJogar').onclick = GP.comecar;
};

/* ---------- partida ---------- */
GP.S = null;   /* a sessão em andamento */

GP.comecar = function () {
  const o = GP.UI.opc;
  for (const id of Object.keys(GP.AGENTES)) GP.precarregarAgente(id);
  for (const id of GP.ORDEM_ARMAS) if (GP.temImagem('armas', id)) GP.imagem(GP.manifesto().armas[id].src);
  const J = GP.montarDuelo({
    mapa: o.mapa, modo: o.modo, arma: o.arma, armaBot: o.arma === 'operator' ? 'vandal' : o.arma,
    atribEu: GP.UI.atribEu, atribBot: GP.NIVEIS[o.nivelBot].a, spawns: o.spawns, rounds: o.rounds,
    semente: (Date.now() & 0xffffff) || 1, agenteEu: o.agenteEu, agentesBot: [GP._agenteDoRival()],
    nome: GP.AGENTES[o.agenteEu].nome, nomesBot: ['Rival', 'Alvo 2', 'Alvo 3', 'Alvo 4'],
    agressivo: 0.5,
  });
  const cv = $gp('#gpTela');
  const R = {cv, g: cv.getContext('2d'), fog: document.createElement('canvas'), dpr: Math.min(2, window.devicePixelRatio || 1), arte: GP.desenharMapa(J.m)};
  R.fg = R.fog.getContext('2d');
  for (const b of J.ents) if (b.bot && b.agente && J.modo === 'duelo') b.nome = GP.AGENTES[b.agente].nome;
  GP.S = {J, R, cam: {x: J.eu.x, y: J.eu.y, escala: 1}, ui: {mouse: null, teclas: {}, poligono: [[0, 0]], botao: false, direito: false},
    ult: performance.now(), acum: 0, pausa: false, hudEm: 0, eventosVistos: 0, feed: []};
  GP._ajustarTela();
  $gp('#gpMenu').hidden = true; $gp('#gpFim').hidden = true; $gp('#gpPausa').hidden = true;
  $gp('#gpHud').hidden = false;
  document.body.classList.add('gp-jogando');
  requestAnimationFrame(GP._quadro);
};

GP._ajustarTela = function () {
  const S = GP.S; if (!S) return;
  const R = S.R, w = window.innerWidth, h = window.innerHeight;
  R.cv.width = Math.round(w * R.dpr); R.cv.height = Math.round(h * R.dpr);
  R.cv.style.width = w + 'px'; R.cv.style.height = h + 'px';
  R.fog.width = R.cv.width; R.fog.height = R.cv.height;
  /* a tela mostra ~68 m na largura (menos em tela estreita); a roda do mouse
     aproxima ou afasta (fica guardado) */
  S.metrosLargura = Math.max(40, Math.min(84, 68 * Math.sqrt(w / 1400))) * (GP.UI.opc.zoom || 1);
};

GP._comando = function () {
  const S = GP.S, J = S.J, eu = J.eu, k = S.ui.teclas, c = eu.cmd;
  c.mx = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
  c.my = (k.KeyS ? 1 : 0) - (k.KeyW ? 1 : 0);
  c.modo = k.ControlLeft || k.ControlRight ? 'agacha' : k.ShiftLeft || k.ShiftRight ? 'anda' : 'corre';
  c.luneta = S.ui.direito;
  if (S.ui.mouse) {
    const R = S.R, esc = S.cam.escala;
    const wx = S.cam.x + (S.ui.mouse.x * R.dpr - R.cv.width / 2) / esc;
    const wy = S.cam.y + (S.ui.mouse.y * R.dpr - R.cv.height / 2) / esc;
    c.ang = Math.atan2(wy - eu.y, wx - eu.x);
  }
  /* clique rápido (aperta e solta no mesmo quadro) ainda vale um tiro;
     arma automática atira enquanto o botão estiver apertado */
  const auto = GP.defArma(eu).auto;
  if (J.round.fase !== 'ativo') c.atirar = false;
  else if (S.ui.cliqueNovo) c.atirar = true;
  else if (auto) c.atirar = S.ui.botao;
  S.ui.cliqueNovo = false;
  if (J.round.fase !== 'ativo') { c.mx = c.my = 0; }
};

GP._quadro = function (agora) {
  const S = GP.S; if (!S) return;
  const J = S.J;
  let dt = Math.min(0.1, (agora - S.ult) / 1000); S.ult = agora;
  if (!S.pausa && !J.fim) {
    S.acum += dt;
    const h = 1 / 120;
    while (S.acum >= h) { GP._comando(); GP.passo(J, h); S.acum -= h; }
    GP.atualizarVisaoDoJogador(J);
  }
  /* câmera: segue você e puxa um pouco para onde você mira */
  const R = S.R, eu = J.eu;
  S.cam.escala = R.cv.width / (S.metrosLargura * (eu.luneta ? 1.35 : 1));
  let ox = 0, oy = 0;
  if (S.ui.mouse) {
    const fx = (S.ui.mouse.x * R.dpr - R.cv.width / 2) / S.cam.escala, fy = (S.ui.mouse.y * R.dpr - R.cv.height / 2) / S.cam.escala;
    const k = eu.luneta ? 0.55 : 0.32;
    ox = fx * k; oy = fy * k;
  }
  const tx = eu.x + ox, ty = eu.y + oy;
  S.cam.x += (tx - S.cam.x) * Math.min(1, dt * 10); S.cam.y += (ty - S.cam.y) * Math.min(1, dt * 10);
  S.ui.poligono = GP.poligonoVisao(J, eu, GP.ALCANCE_VISTA * (eu.luneta ? 1.4 : 1));
  GP.render(R, J, S.cam, S.ui);
  GP._lerEventos();
  if (agora - S.hudEm > 66) { S.hudEm = agora; GP._hud(); }
  if (J.fim && !S.fimMostrado) { S.fimMostrado = true; setTimeout(GP._fim, 900); }
  requestAnimationFrame(GP._quadro);
};

GP._lerEventos = function () {
  const S = GP.S, J = S.J;
  for (; S.eventosVistos < J.eventos.length; S.eventosVistos++) {
    const ev = J.eventos[S.eventosVistos];
    if (ev.tipo === 'morte') {
      const de = J.ents.find(o => o.id === ev.de), em = J.ents.find(o => o.id === ev.em);
      S.feed.unshift({t: performance.now(), de: de.nome, em: em.nome, arma: ev.arma, cabeca: ev.cabeca, meu: de === J.eu, morri: em === J.eu});
      S.feed = S.feed.slice(0, 5);
    }
  }
};

GP._hud = function () {
  const S = GP.S, J = S.J, eu = J.eu, R = J.round;
  const arm = GP.armaDe(eu), A = GP.defArma(eu);
  const resta = R.fase === 'ativo' ? Math.max(0, R.ate - J.t) : R.fase === 'pre' ? Math.max(0, R.ate - J.t) : 0;
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const alvos = J.modo === 'alvos';
  $gp('#gpPlacar').innerHTML = alvos
    ? `<span class="gp-pl-eu num">${eu.st.kills}</span><span class="gp-pl-meio"><b class="num">${mmss(resta)}</b><i>treino de alvos</i></span><span class="gp-pl-ele num">${eu.st.tiros ? Math.round(eu.st.cabecas / Math.max(1, eu.st.acertos) * 100) : 0}%<i>HS</i></span>`
    : `<span class="gp-pl-eu num">${J.placar.eu}</span><span class="gp-pl-meio"><b class="num">${R.fase === 'pre' ? 'em ' + Math.ceil(resta) : mmss(resta)}</b><i>round ${R.n} · primeiro a ${J.alvoRounds}</i></span><span class="gp-pl-ele num">${J.placar.eles}</span>`;
  $gp('#gpVida').innerHTML = `${eu.agente ? GP._rostoAgente(eu.agente, 'gp-hud-r') : ''}<div class="gp-hp"><b class="num">${Math.ceil(eu.hp)}</b><span>vida</span></div>
    <div class="gp-esc"><b class="num">${Math.ceil(eu.escudo)}</b><span>escudo</span></div>
    <div class="gp-modo">${eu.modo === 'corre' ? 'correndo' : eu.modo === 'anda' ? 'andando' : 'agachado'}${Math.hypot(eu.vx, eu.vy) > 3 ? ' · <em>tiro aberto</em>' : ''}</div>`;
  const silh = GP.temImagem('armas', arm.id) ? `<img class="gp-arma-img" src="${GP.manifesto().armas[arm.id].src}" alt="">` : '';
  $gp('#gpArma').innerHTML = `${silh}<div class="gp-arma-n">${A.nome}${eu.luneta ? ' · luneta' : ''}</div>
    <div class="gp-mun"><b class="num">${arm.municao}</b><span class="num">/ ${arm.reserva}</span></div>
    <div class="gp-dim">${eu.recarregaAte ? 'recarregando…' : J.t < eu.equipaAte ? 'sacando…' : '1 primária · 2 pistola'}</div>`;
  if (eu.agente && S.habDe !== eu.agente) {
    S.habDe = eu.agente;
    $gp('#gpHab').innerHTML = ['c', 'q', 'e', 'x'].map(k => {
      const ic = GP.agenteImg(eu.agente, k);
      return `<div class="gp-hab">${ic ? `<img src="${ic.src}" alt="">` : '<i></i>'}<kbd>${k.toUpperCase()}</kbd></div>`;
    }).join('') + '<span class="gp-hab-nota">habilidades na próxima fase</span>';
  }
  $gp('#gpArea').textContent = [GP.NOME_MAPA[J.m.nome], GP.areaEm(J.m, eu.x, eu.y), GP.sitioEm(J.m, eu.x, eu.y) ? 'bomb ' + GP.sitioEm(J.m, eu.x, eu.y).toUpperCase() : ''].filter(Boolean).join(' · ');
  const agora = performance.now();
  $gp('#gpFeed').innerHTML = S.feed.filter(f => agora - f.t < 6000).map(f => `<div class="gp-kf ${f.meu ? 'meu' : ''} ${f.morri ? 'morri' : ''}">
    <b>${escGP(f.de)}</b><span>${escGP(f.arma)}${f.cabeca ? ' ✦' : ''}</span><b>${escGP(f.em)}</b></div>`).join('');
  let faixa = '';
  if (R.fase === 'pre') faixa = alvos ? 'Prepare-se' : R.n === 1 ? 'Duelo — ' + GP.NOME_MAPA[J.m.nome] : 'Round ' + R.n;
  else if (R.fase === 'fim' && R.vencedor) faixa = R.vencedor === 'eu' ? 'Round seu' : R.vencedor === 'eles' ? 'Round perdido' : 'Tempo esgotado';
  const fx = $gp('#gpFaixa');
  fx.textContent = faixa; fx.className = 'gp-faixa' + (faixa ? ' on' : '') + (R.vencedor === 'eu' ? ' ok' : R.vencedor === 'eles' ? ' no' : '');
};

/* ---------- fim: números e o que treinar ---------- */
GP._fim = function () {
  const S = GP.S; if (!S) return;
  const J = S.J, r = GP.resumo(J), alvos = J.modo === 'alvos';
  const dicas = [];
  if (r.tiros >= 8 && r.correndo >= 30) dicas.push(`<b>${r.correndo}%</b> dos seus tiros saíram correndo. Correndo o tiro abre muito: solte as teclas (ou segure Shift) um instante antes de atirar.`);
  if (r.tiros >= 10 && r.abertos >= 35) dicas.push(`<b>${r.abertos}%</b> dos tiros com a rajada já aberta. Atire em rajadas de 3–5 e solte; de longe, tiro a tiro.`);
  if (r.acertos >= 6 && r.hs < 20) dicas.push(`Só <b>${r.hs}%</b> na cabeça. Mire no centro do boneco e espere o círculo da mira fechar.`);
  if (r.reacaoMs && r.reacaoMs > 450) dicas.push(`Do inimigo aparecer ao seu primeiro tiro: <b>${r.reacaoMs} ms</b>. Ande com a mira já apontada para onde ele pode surgir.`);
  if (!dicas.length) dicas.push(r.precisao >= 30 ? 'Mira e disciplina boas. Tente o rival um nível acima.' : 'Jogue de novo com Shift nas esquinas: andar não faz barulho e deixa o tiro mais preciso.');
  const titulo = alvos ? `${r.kills} abates em 60 s` : (J.fim.venceu ? 'Vitória ' : 'Derrota ') + J.placar.eu + '–' + J.placar.eles;
  $gp('#gpFim').innerHTML = `<div class="gp-fim-in"><div class="gp-eyebrow">${alvos ? 'Treino de alvos' : 'Duelo'} · ${GP.NOME_MAPA[J.m.nome]} · ${GP.ARMAS[GP.UI.opc.arma].nome}</div>
    <h2 class="${alvos ? '' : J.fim.venceu ? 'ok' : 'no'}">${titulo}</h2>
    <div class="gp-nums">
      <div><b class="num">${r.kills}/${r.mortes}</b><span>abates / mortes</span></div>
      <div><b class="num">${r.precisao}%</b><span>precisão</span></div>
      <div><b class="num">${r.hs}%</b><span>na cabeça</span></div>
      <div><b class="num">${r.reacaoMs != null ? r.reacaoMs + ' ms' : '—'}</b><span>reação média</span></div>
      <div><b class="num">${r.dano}</b><span>dano</span></div>
    </div>
    <div class="gp-eyebrow">O que treinar</div><ul class="gp-dicas">${dicas.map(d => `<li>${d}</li>`).join('')}</ul>
    <div class="gp-acoes"><button class="gp-jogar" id="gpDeNovo">Jogar de novo</button><button class="gp-sec-bt" id="gpMenuBt">Mudar opções</button></div></div>`;
  $gp('#gpFim').hidden = false;
  $gp('#gpDeNovo').onclick = GP.comecar;
  $gp('#gpMenuBt').onclick = GP.sair;
};
GP.sair = function () {
  GP.S = null;
  document.body.classList.remove('gp-jogando');
  $gp('#gpHud').hidden = true; $gp('#gpFim').hidden = true; $gp('#gpPausa').hidden = true;
  const R = $gp('#gpTela').getContext('2d'); R.setTransform(1, 0, 0, 1, 0, 0); R.clearRect(0, 0, 99999, 99999);
  GP.menu();
};
GP.pausar = function (on) {
  const S = GP.S; if (!S || S.J.fim) return;
  S.pausa = on; S.ui.teclas = {}; S.ui.botao = false;
  $gp('#gpPausa').hidden = !on;
  if (on) $gp('#gpPausa').innerHTML = `<div class="gp-fim-in"><h2>Pausa</h2><div class="gp-acoes">
    <button class="gp-jogar" id="gpVoltar">Voltar ao jogo</button><button class="gp-sec-bt" id="gpDesistir">Sair da partida</button></div></div>`;
  if (on) { $gp('#gpVoltar').onclick = () => GP.pausar(false); $gp('#gpDesistir').onclick = GP.sair; }
};

/* ---------- entrada ---------- */
GP.ligar = function () {
  GP._lerOpc();
  const cv = $gp('#gpTela');
  window.addEventListener('resize', GP._ajustarTela);
  window.addEventListener('keydown', e => {
    if (!GP.S) return;
    if (e.code === 'Escape') { GP.pausar(!GP.S.pausa); e.preventDefault(); return; }
    if (GP.S.pausa) return;
    GP.S.ui.teclas[e.code] = true;
    const c = GP.S.J.eu.cmd;
    if (e.code === 'KeyR') c.recarregar = true;
    if (e.code === 'Digit1') c.trocar = 'primaria';
    if (e.code === 'Digit2') c.trocar = 'secundaria';
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ControlLeft', 'ShiftLeft', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { if (GP.S) GP.S.ui.teclas[e.code] = false; });
  window.addEventListener('blur', () => { if (GP.S && !GP.S.J.fim) GP.pausar(true); });
  cv.addEventListener('mousemove', e => { if (GP.S) GP.S.ui.mouse = {x: e.clientX, y: e.clientY}; });
  cv.addEventListener('mousedown', e => {
    if (!GP.S || GP.S.pausa) return;
    if (e.button === 0) { GP.S.ui.botao = true; GP.S.ui.cliqueNovo = true; }
    if (e.button === 2) GP.S.ui.direito = true;
  });
  window.addEventListener('mouseup', e => { if (!GP.S) return; if (e.button === 0) GP.S.ui.botao = false; if (e.button === 2) GP.S.ui.direito = false; });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => {
    if (!GP.S) return;
    e.preventDefault();
    GP.UI.opc.zoom = Math.max(0.65, Math.min(1.5, (GP.UI.opc.zoom || 1) * (e.deltaY > 0 ? 1.08 : 1 / 1.08)));
    GP._salvarOpc(); GP._ajustarTela();
  }, {passive: false});
  /* no navegador, Ctrl+W fecha a aba: pergunta antes, no meio da partida */
  window.addEventListener('beforeunload', e => { if (GP.S && !GP.S.J.fim) { e.preventDefault(); e.returnValue = ''; } });
  GP.menu();
};
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', GP.ligar);
