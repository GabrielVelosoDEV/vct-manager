/* ============================================================
   PARTIDA 5 CONTRA 5 (etapa 1)
   Rounds com fase de compra, spike (plantar, explodir, desarmar),
   economia, troca de lado no round 13, prorrogação e fim da partida.
   Os dois times são 'A' e 'B'; J.lados diz quem ataca em cada round.
   A loja é automática por função e pelo dinheiro do time. A tática
   aqui é a base (ataque escolhe um bomb, defesa se divide e gira,
   retake depois do plant); os planos de round entram na etapa 2.
   ============================================================ */
'use strict';

GP.PARTIDA = {compra: 30, round: 100, fimRound: 4, vence: 13, meio: 12};
GP.SPIKE = {planta: 4, pavio: 45, desarme: 7, marco: 3.5, raio: 13, alcance: 1.3};
GP.ECON = {inicio: 800, max: 9000, abate: 200, vitoria: 3000, derrota: [1900, 2400, 2900], plant: 300, prorrogacao: 5000};
GP.CUSTO_HAB = {c: 200, q: 250};      /* E é a assinatura: uma carga de graça por round */
GP.PRECO_ESCUDO = {leve: 400, pesado: 1000};
GP.AGRESSIVO_PAPEL = {duelista: 0.75, iniciador: 0.5, controlador: 0.4, sentinela: 0.3};

/* ---------- montar ---------- */
GP._comporTime = function (fixos, rnd) {
  const usados = new Set(fixos.filter(Boolean)), time = fixos.filter(Boolean).slice(0, 5);
  const papeis = time.map(a => GP.AGENTES[a].papel);
  const falta = ['duelista', 'iniciador', 'controlador', 'sentinela'].filter(p => !papeis.includes(p));
  while (time.length < 5) {
    const papel = falta.shift() || (rnd() < 0.6 ? 'duelista' : 'iniciador');
    const op = Object.values(GP.AGENTES).filter(a => a.papel === papel && !usados.has(a.id) && GP.HABS[a.id]);
    if (!op.length) continue;
    const a = op[Math.floor(rnd() * op.length)];
    usados.add(a.id); time.push(a.id);
  }
  return time;
};

GP.montarPartida = function (o) {
  const J = GP.novoJogo({...o, modo: 'partida'});
  /* comp: do elenco (mains + meta do mapa) ou só do meta do mapa */
  const comp = {}, jog = {};
  J.nomesTimes = {A: 'Time A', B: 'Time B'};
  for (const time of ['A', 'B']) {
    const T = o['time' + time], fixos = (o['agentes' + time] || []).slice();
    if (T && T.jogadores && T.jogadores.length >= 5) {
      let js = T.jogadores.slice(0, 5);
      if (time === 'A' && o.jogador && fixos[0]) {
        /* você entra no lugar de quem joga a função do seu agente */
        const pap = GP.AGENTES[fixos[0]].papel;
        let i = js.findIndex(j => GP.PAPEL_DA_FUNCAO[j.funcao] === pap);
        if (i < 0) i = js.reduce((b, j, k) => (j.over || 0) < (js[b].over || 0) ? k : b, 0);
        js = [{nome: o.nome || 'Você', funcao: js[i].funcao, humano: true, agentes: [fixos[0]]}, ...js.filter((_, k) => k !== i)];
      }
      jog[time] = js;
      comp[time] = GP.compDoElenco(o.mapa, js, J.rnd, time === 'A' && o.jogador ? [fixos[0]] : fixos);
      J.nomesTimes[time] = T.sigla || T.nome;
    } else comp[time] = GP.compDoMapa(o.mapa, J.rnd, fixos);
  }
  for (const time of ['A', 'B']) comp[time].forEach((ag, i) => {
    const jogador = time === 'A' && i === 0 && o.jogador;
    const J5 = jog[time] && jog[time][i];
    const at = o['atrib' + time];
    const atrib = jogador ? ((Array.isArray(at) ? at[0] : at) || {}) : J5 && J5.at ? GP.atribDoManager(J5.at) : ((Array.isArray(at) ? at[i] : at) || {});
    const papel = GP.AGENTES[ag].papel;
    const nome = jogador ? (o.nome || 'Você') : J5 ? J5.nome : GP.AGENTES[ag].nome;
    const e = GP.criarAgente({id: time + i, nome, time, bot: !jogador,
      atrib, agente: ag, primaria: null, secundaria: 'classic', escudo: 'nenhum', agressivo: GP.estiloDe ? GP.estiloDe(atrib, papel) : GP.AGRESSIVO_PAPEL[papel]});
    Object.assign(e, {papel, creditos: GP.ECON.inicio, pontosUlt: 0, prefRifle: J.rnd() < 0.55 ? 'vandal' : 'phantom', funcao: J5 ? J5.funcao : null, over: J5 ? J5.over : null});
    Object.assign(e.st, {plants: 0, desarmes: 0, fb: 0, assist: 0});
    J.ents.push(e);
  });
  J.eu = J.ents[0];
  J.placar = {A: 0, B: 0}; J.lados = {A: 'atk', B: 'def'}; J.derrotas = {A: 0, B: 0};
  J.historico = []; J.compra = {}; J.duracaoRound = GP.PARTIDA.round;
  J.tempoCompra = o.tempoCompra != null ? o.tempoCompra : GP.PARTIDA.compra;
  J._evEcon = 0;
  GP._prepararPontos(J.m);
  GP.novoRound(J);
  return J;
};

GP._timeAtk = J => J.lados.A === 'atk' ? 'A' : 'B';
GP._timeDef = J => J.lados.A === 'atk' ? 'B' : 'A';
GP._ladoNoRound = function (n) {
  const P = GP.PARTIDA;
  if (n <= P.meio) return 'A';
  if (n <= 2 * P.meio) return 'B';
  return (n - 2 * P.meio) % 2 === 1 ? 'A' : 'B';   /* prorrogação: troca todo round */
};

/* pontos de navegação de cada bomb (para plantar e segurar) */
GP._prepararPontos = function (m) {
  if (m.pontosSitio) return;
  const n = m.nav; m.pontosSitio = {};
  for (const L of Object.keys(m.sitios)) {
    const cod = GP.SITIO_COD[L], pts = [];
    for (let i = 0; i < n.W * n.H; i++) {
      if (!n.livre[i]) continue;
      const x = (i % n.W + 0.5) * n.passo, y = ((i / n.W | 0) + 0.5) * n.passo;
      if (m.sitio[Math.floor(y / m.cel) * m.W + Math.floor(x / m.cel)] === cod) pts.push({x, y});
    }
    m.pontosSitio[L] = pts.length ? pts : [{x: m.sitios[L].x, y: m.sitios[L].y}];
  }
};
GP._pontoLivrePerto = function (m, x, y) {
  if (GP.navLivre(m, x, y)) return {x, y};
  const i = GP._navPerto(m, x, y), n = m.nav;
  return i < 0 ? {x, y} : {x: (i % n.W + 0.5) * n.passo, y: ((i / n.W | 0) + 0.5) * n.passo};
};
/* para onde olhar segurando um ponto: o primeiro trecho do caminho até o inimigo */
GP._olharPara = function (m, p, alvo) {
  const cam = GP.caminho(m, p.x, p.y, alvo.x, alvo.y);
  if (cam) for (const q of cam) if (Math.hypot(q.x - p.x, q.y - p.y) > 3) return Math.atan2(q.y - p.y, q.x - p.x);
  return Math.atan2(alvo.y - p.y, alvo.x - p.x);
};

/* ---------- round ---------- */
GP._novoRoundPartida = function (J) {
  const R = J.round, P = GP.PARTIDA, m = J.m;
  R.n++;
  const atkAgora = GP._ladoNoRound(R.n), trocou = J.lados[atkAgora] !== 'atk';
  J.lados = {A: atkAgora === 'A' ? 'atk' : 'def', B: atkAgora === 'B' ? 'atk' : 'def'};
  const pistola = R.n === 1 || R.n === P.meio + 1, prorrog = R.n > 2 * P.meio;
  J.tiros = []; J.sons = []; J.marcas = []; J.efx = [];
  if (GP.resetarMecanicas) GP.resetarMecanicas(m);
  for (const e of J.ents) {
    /* quem morreu perde as armas; quem sobreviveu fica com elas (e com o escudo) */
    if (!e.vivo || pistola || (trocou && !prorrog)) { e.armas.primaria = null; e.armas.secundaria = {id: 'classic'}; e.escudo = 0; }
    if (pistola) { e.creditos = GP.ECON.inicio; e.cargas = {c: 0, q: 0, e: 0, x: e.cargas ? e.cargas.x : 0}; }
    if (prorrog) e.creditos = GP.ECON.prorrogacao;
    for (const s of ['primaria', 'secundaria']) if (e.armas[s]) { const A = GP.ARMAS[e.armas[s].id]; e.armas[s].municao = A.pente; e.armas[s].reserva = A.reserva; }
    e.slot = e.armas.primaria ? 'primaria' : 'secundaria';
    e.hp = 100; e.vivo = true; e.spray = 0; e.recarregaAte = 0; e.equipaAte = 0; e._viuEm = 0; e._reagiu = false; e._susto = null; e._morreuEm = 0;
    e.viagem = null; e._tpCarga = 0; e._tpAte = 0; e._acaoSpike = false; e.vx = e.vy = 0;
    if (e.ia) Object.assign(e.ia, {estado: 'patrulha', caminho: null, alvoPonto: null, vista: null, ouviu: null, seguraAte: 0, pausaAte: 0, obj: null, objAte: 0, ctx: ''});
  }
  if (GP.resetarHabilidades) GP.resetarHabilidades(J);
  /* nascem espalhados em volta do spawn do lado */
  for (const time of ['A', 'B']) {
    const sp = m.spawn[J.lados[time]];
    J.ents.filter(e => e.time === time).forEach((e, i) => {
      const a = i / 5 * Math.PI * 2, p = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * 1.6 * (i ? 1 : 0), sp.y + Math.sin(a) * 1.6 * (i ? 1 : 0));
      e.x = p.x; e.y = p.y;
      e.ang = Math.atan2(m.alturaM / 2 - e.y, m.larguraM / 2 - e.x);
      if (!e.bot) e.cmd.ang = e.ang;
    });
  }
  GP._comprarTodos(J);
  /* a spike vai para um atacante (de preferência quem não abre o bomb) */
  const atk = J.ents.filter(e => e.time === GP._timeAtk(J));
  const ordem = {sentinela: 0, controlador: 1, iniciador: 2, duelista: 3};
  const dono = atk.filter(e => e.bot).sort((a, b) => ordem[a.papel] - ordem[b.papel])[0] || atk[0];
  J.spike = {estado: 'carregada', dono: dono.id, x: dono.x, y: dono.y, progresso: 0, desarme: 0};
  GP._planejarRound(J);
  R.fase = 'compra'; R.ate = J.t + J.tempoCompra; R.vencedor = null; R.como = null; R.plantou = false; R.primeiroSangue = false;
  J.eventos.push({tipo: 'inicio', t: J.t, n: R.n, lados: {...J.lados}, compra: {...J.compra}});
};

/* ---------- economia e loja ---------- */
GP._darArma = function (e, id, slot) {
  const A = GP.ARMAS[id];
  e.armas[slot] = {id, municao: A.pente, reserva: A.reserva};
  if (slot === 'primaria') e.slot = 'primaria';
};
GP._comprarTodos = function (J) {
  const n = J.round.n, P = GP.PARTIDA;
  for (const time of ['A', 'B']) {
    const tm = J.ents.filter(e => e.time === time);
    const media = tm.reduce((s, e) => s + e.creditos, 0) / tm.length;
    let modo;
    if (n === 1 || n === P.meio + 1) modo = 'pistola';
    else if (n > 2 * P.meio) modo = 'cheia';
    else if (media >= 3900) modo = 'cheia';
    else if (media >= 3100 || (J.derrotas[time] >= 2 && media >= 2400)) modo = 'forca';
    else modo = 'eco';
    J.compra[time] = modo;
    let operador = tm.some(e => e.armas.primaria && e.armas.primaria.id === 'operator');
    /* quem compra primeiro é quem tem mais dinheiro */
    for (const e of tm.slice().sort((a, b) => b.creditos - a.creditos)) {
      const gasta = v => e.creditos >= v ? (e.creditos -= v, true) : false;
      const prim = e.armas.primaria && e.armas.primaria.id;
      if (modo === 'pistola') {
        if (e.papel === 'duelista' && gasta(500)) GP._darArma(e, 'ghost', 'secundaria');
        else if (gasta(GP.PRECO_ESCUDO.leve)) e.escudo = Math.max(e.escudo, GP.ESCUDOS.leve);
      } else if (modo === 'cheia') {
        if (!prim || GP.ARMAS[prim].tipo !== 'rifle' && prim !== 'operator') {
          const querOp = !operador && (e.papel === 'sentinela' || (e.atrib.mira || 50) >= 82) && e.creditos >= 4700 + 1000;
          if (querOp && gasta(4700)) { GP._darArma(e, 'operator', 'primaria'); operador = true; }
          else if (gasta(2900)) GP._darArma(e, e.prefRifle, 'primaria');
          else if (gasta(1600)) GP._darArma(e, 'spectre', 'primaria');
        }
        if (e.escudo < GP.ESCUDOS.pesado && gasta(GP.PRECO_ESCUDO.pesado)) e.escudo = GP.ESCUDOS.pesado;
        else if (e.escudo < GP.ESCUDOS.leve && gasta(GP.PRECO_ESCUDO.leve)) e.escudo = GP.ESCUDOS.leve;
      } else if (modo === 'forca') {
        if (!prim) { if (gasta(1600)) GP._darArma(e, 'spectre', 'primaria'); else if (gasta(800)) GP._darArma(e, 'sheriff', 'secundaria'); }
        if (e.escudo < GP.ESCUDOS.leve && gasta(GP.PRECO_ESCUDO.leve)) e.escudo = GP.ESCUDOS.leve;
      }
      /* habilidades: no eco só se sobrar para o round que vem */
      const H = GP.HABS[e.agente];
      if (H) for (const k of ['c', 'q']) {
        const h = H[k]; if (!h || h.semDuelo || !h.cargas) continue;
        while (e.cargas[k] < h.cargas && e.creditos >= GP.CUSTO_HAB[k] + (modo === 'eco' ? 2000 : 0)) { e.creditos -= GP.CUSTO_HAB[k]; e.cargas[k]++; }
      }
    }
  }
};
GP._ganhar = (e, v) => { e.creditos = Math.min(GP.ECON.max, e.creditos + v); };

/* ---------- a cada passo ---------- */
GP._fluxoPartida = function (J, dt) {
  const R = J.round, E = GP.ECON;
  if (J.fim) return;
  /* abates: crédito, primeiro sangue */
  for (; J._evEcon < J.eventos.length; J._evEcon++) {
    const ev = J.eventos[J._evEcon];
    if (ev.tipo !== 'morte') continue;
    const de = J.ents.find(o => o.id === ev.de), em = J.ents.find(o => o.id === ev.em);
    if (de && em && de.time !== em.time) {
      GP._ganhar(de, E.abate);
      if (!R.primeiroSangue) { R.primeiroSangue = true; de.st.fb++; }
    }
  }
  if (GP._estatPasso) GP._estatPasso(J);
  if (R.fase === 'compra') {
    if (J.t >= R.ate) { R.fase = 'ativo'; R.inicio = J.t; R.ate = J.t + J.duracaoRound; }
    return;
  }
  if (R.fase === 'ativo') {
    GP._passoSpike(J, dt || 1 / 120);
    GP._contato(J);
    if (GP._utilTime) GP._utilTime(J);
    const atk = GP._timeAtk(J), def = GP._timeDef(J), sp = J.spike;
    const vivos = t => J.ents.some(e => e.vivo && e.time === t);
    let venc = null, como = '';
    if (sp.estado === 'desarmada') { venc = def; como = 'desarme'; }
    else if (sp.estado === 'plantada' && J.t >= sp.explode) { GP._explodir(J); venc = atk; como = 'explosão'; }
    else if (!vivos(def)) { venc = atk; como = 'eliminação'; }
    else if (!vivos(atk) && sp.estado !== 'plantada') { venc = def; como = 'eliminação'; }
    else if (sp.estado !== 'plantada' && J.t >= R.ate) { venc = def; como = 'tempo'; }
    if (venc) GP._fimDoRound(J, venc, como);
  } else if (R.fase === 'fim' && J.t >= R.ate) GP.novoRound(J);
};

GP._fimDoRound = function (J, venc, como) {
  const R = J.round, E = GP.ECON, perd = venc === 'A' ? 'B' : 'A', atk = GP._timeAtk(J);
  R.fase = 'fim'; R.vencedor = venc; R.como = como; R.ate = J.t + GP.PARTIDA.fimRound;
  J.placar[venc]++;
  J.derrotas[venc] = 0; J.derrotas[perd]++;
  for (const e of J.ents) {
    if (e.time === venc) GP._ganhar(e, E.vitoria);
    else GP._ganhar(e, E.derrota[Math.min(J.derrotas[perd], 3) - 1]);
    if (R.plantou && e.time === atk) GP._ganhar(e, E.plant);
  }
  const pl = J.plano || {};
  J.historico.push({n: R.n, vencedor: venc, como, atk, planoAtk: pl.atk && pl.atk.tipo, alvo: pl.alvo, nomeAtk: pl.nomeAtk, nomeDef: pl.nomeDef, plant: R.plantou ? J.spike.letra : null, compra: {...J.compra}, placar: {...J.placar},
    duracao: Math.round(J.t - (R.inicio || J.t))});
  J.eventos.push({tipo: 'round', t: J.t, vencedor: venc, como, n: R.n});
  const a = J.placar.A, b = J.placar.B;
  if (Math.max(a, b) >= GP.PARTIDA.vence && Math.abs(a - b) >= 2) {
    const v = a > b ? 'A' : 'B';
    J.fim = {modo: 'partida', vencedor: v, venceu: J.eu.time === v};
  }
};

/* a spike: carregar, cair, pegar, plantar, desarmar */
GP._passoSpike = function (J, dt) {
  const sp = J.spike, S = GP.SPIKE, m = J.m, t = J.t, atk = GP._timeAtk(J), def = GP._timeDef(J);
  for (const e of J.ents) e._acaoSpike = false;
  const quieto = e => e.vivo && Math.hypot(e.vx, e.vy) < 0.6 && !e.cmd.atirar && !e.viagem;
  if (sp.estado === 'carregada') {
    const d = J.ents.find(e => e.id === sp.dono);
    if (!d || !d.vivo) { sp.estado = 'chao'; sp.dono = null; sp.progresso = 0; J.eventos.push({tipo: 'spike', t, acao: 'caiu', x: sp.x, y: sp.y}); }
    else {
      sp.x = d.x; sp.y = d.y;
      const letra = GP.sitioEm(m, d.x, d.y);
      if (d.cmd.spike && letra && quieto(d)) {
        d._acaoSpike = true; sp.progresso += dt;
        if (t - (sp.som || 0) > 0.45) { sp.som = t; J.sons.push({x: d.x, y: d.y, t, dono: d.id, time: d.time, r: 14}); }
        if (sp.progresso >= S.planta) {
          Object.assign(sp, {estado: 'plantada', dono: null, letra, explode: t + S.pavio, desarme: 0, quem: d.id});
          J.round.ate = sp.explode; J.round.plantou = true; d.st.plants++;
          J.sons.push({x: d.x, y: d.y, t, dono: d.id, time: d.time, r: 60, tiro: true});
          J.eventos.push({tipo: 'spike', t, acao: 'plantada', letra, de: d.id});
        }
      } else sp.progresso = 0;
    }
  }
  if (sp.estado === 'chao') {
    const p = J.ents.find(e => e.vivo && e.time === atk && Math.hypot(e.x - sp.x, e.y - sp.y) < 1);
    if (p) { sp.estado = 'carregada'; sp.dono = p.id; J.eventos.push({tipo: 'spike', t, acao: 'pegou', de: p.id}); }
  }
  if (sp.estado === 'plantada') {
    const q = J.ents.find(e => e.time === def && e.cmd.spike && quieto(e) && Math.hypot(e.x - sp.x, e.y - sp.y) < S.alcance);
    if (q) {
      q._acaoSpike = true; sp.desarme += dt; sp.desarmador = q.id;
      if (t - (sp.som || 0) > 0.45) { sp.som = t; J.sons.push({x: q.x, y: q.y, t, dono: q.id, time: q.time, r: 16}); }
      if (sp.desarme >= S.desarme) { sp.estado = 'desarmada'; q.st.desarmes++; J.eventos.push({tipo: 'spike', t, acao: 'desarmada', de: q.id}); }
    } else { sp.desarme = sp.desarme >= S.marco ? S.marco : 0; sp.desarmador = null; }
    /* o bip: todo mundo sabe onde está */
    if (t - (sp.bip || 0) > Math.max(0.25, (sp.explode - t) / 45 * 1.2)) { sp.bip = t; J.sons.push({x: sp.x, y: sp.y, t, dono: 'spike', time: null, r: 30}); }
  }
};
GP._explodir = function (J) {
  const sp = J.spike;
  sp.estado = 'explodiu';
  for (const e of J.ents) if (e.vivo && Math.hypot(e.x - sp.x, e.y - sp.y) < GP.SPIKE.raio) {
    e.hp = 0; e.vivo = false; e.st.mortes++; e._morreuEm = J.t;
    J.eventos.push({tipo: 'morte', t: J.t, de: null, em: e.id, arma: 'Spike', cabeca: false});
  }
  (J.efx || (J.efx = [])).push({tipo: 'explosao', x: sp.x, y: sp.y, t: J.t});
};

/* quem da defesa viu ou ouviu o ataque perto de um bomb: o time gira */
GP._contato = function (J) {
  if (J.t - (J._contatoEm || 0) < 0.5) return;
  J._contatoEm = J.t;
  const atk = J.ents.filter(e => e.vivo && e.time === GP._timeAtk(J)), def = J.ents.filter(e => e.vivo && e.time === GP._timeDef(J));
  for (const a of atk) {
    if (!def.some(d => GP.ve(J, d, a) || (a.ef && a.ef.revelado > J.t))) continue;
    let melhor = null;
    for (const L in J.m.sitios) { const s = J.m.sitios[L], d = Math.hypot(a.x - s.x, a.y - s.y); if (d < 22 && (!melhor || d < melhor.d)) melhor = {L, d}; }
    if (melhor) { J.plano.contato = {letra: melhor.L, t: J.t, n: (J.plano.contato && J.plano.contato.letra === melhor.L ? J.plano.contato.n : 0) + 1}; }
  }
};

/* ---------- a tática base ---------- */
GP._planejarRound = function (J) {
  const m = J.m, letras = Object.keys(m.sitios), rnd = J.rnd;
  const def = J.ents.filter(e => e.time === GP._timeDef(J));
  const ordem = {sentinela: 0, controlador: 1, iniciador: 2, duelista: 3};
  def.sort((a, b) => ordem[a.papel] - ordem[b.papel]);
  const dist = letras.length === 3 ? ['a', 'b', 'c', 'b', 'a'] : ['a', 'b', 'a', 'b', 'meio'];
  const deSitio = {};
  def.forEach((e, i) => { const L = dist[i] in m.sitios || dist[i] === 'meio' ? dist[i] : letras[i % letras.length]; deSitio[e.id] = L; });
  /* a âncora de cada bomb é o primeiro da lista nele: não gira */
  const ancora = {};
  for (const e of def) if (!ancora[deSitio[e.id]]) ancora[deSitio[e.id]] = e.id;
  J.plano = {alvo: letras[Math.floor(rnd() * letras.length)], deSitio, ancora, contato: null};
};
GP._sortear = (J, lista) => lista[Math.floor(J.rnd() * lista.length)];

GP._escolherObjetivo = function (J, e) {
  const m = J.m, sp = J.spike, ia = e.ia, pl = J.plano, atk = e.time === GP._timeAtk(J);
  const inimigoSpawn = m.spawn[atk ? 'def' : 'atk'];
  let ctx, faz;
  if (atk) {
    if (sp.estado === 'chao') {
      const perto = J.ents.filter(o => o.vivo && o.time === e.time).sort((a, b) => Math.hypot(a.x - sp.x, a.y - sp.y) - Math.hypot(b.x - sp.x, b.y - sp.y))[0];
      if (perto === e) { ctx = 'pegar'; faz = () => ({x: sp.x, y: sp.y, acao: 'ir'}); }
    }
    if (!ctx && sp.estado === 'carregada' && sp.dono === e.id) {
      ctx = 'plantar' + pl.alvo;
      faz = () => ({...GP._sortear(J, m.pontosSitio[pl.alvo]), acao: 'plantar'});
    }
    if (!ctx && sp.estado === 'plantada') {
      ctx = 'posplant';
      faz = () => {
        const cand = [];
        for (let k = 0; k < 40; k++) {
          const a = J.rnd() * Math.PI * 2, r = 6 + J.rnd() * 8, p = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * r, sp.y + Math.sin(a) * r);
          if (GP.linhaLivre(m, p.x, p.y, sp.x, sp.y)) cand.push(p);
        }
        const p = cand[0] || {x: sp.x, y: sp.y};
        return {...p, acao: 'segurar', olhar: Math.atan2(sp.y - p.y, sp.x - p.x)};
      };
    }
    if (!ctx) {
      ctx = 'entrar' + pl.alvo;
      faz = () => { const p = GP._sortear(J, m.pontosSitio[pl.alvo]); return {...p, acao: 'segurar', olhar: GP._olharPara(m, p, inimigoSpawn)}; };
    }
  } else {
    if (sp.estado === 'plantada') {
      const perto = J.ents.filter(o => o.vivo && o.time === e.time).sort((a, b) => Math.hypot(a.x - sp.x, a.y - sp.y) - Math.hypot(b.x - sp.x, b.y - sp.y))[0];
      ctx = perto === e ? 'desarmar' : 'retake';
      faz = perto === e ? () => ({x: sp.x, y: sp.y, acao: 'desarmar'})
        : () => { const a = J.rnd() * Math.PI * 2, p = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * 4, sp.y + Math.sin(a) * 4); return {...p, acao: 'segurar', olhar: Math.atan2(sp.y - p.y, sp.x - p.x)}; };
    } else {
      let L = pl.deSitio[e.id];
      const c = pl.contato;
      if (c && J.t - c.t < 12 && c.letra !== L && pl.ancora[L] !== e.id) L = c.letra;   /* gira */
      ctx = 'segurar' + L;
      faz = () => {
        let p;
        if (L === 'meio') {
          const ls = Object.values(m.sitios);
          p = GP._pontoLivrePerto(m, (ls[0].x + ls[1].x) / 2, (ls[0].y + ls[1].y) / 2);
        } else p = GP._sortear(J, m.pontosSitio[L]);
        return {...p, acao: 'segurar', olhar: GP._olharPara(m, p, inimigoSpawn)};
      };
    }
  }
  if (ia.ctx !== ctx || !ia.obj) { ia.ctx = ctx; ia.obj = faz(); ia.caminho = null; }
  if (ia.obj && ia.obj.acao !== 'segurar' && (ctx === 'pegar' || ctx === 'desarmar')) { ia.obj.x = sp.x; ia.obj.y = sp.y; }
};

/* chamado pela IA quando não tem inimigo à vista: devolve true se já decidiu o comando */
GP._objetivoPartida = function (J, e, dt) {
  const ia = e.ia, c = e.cmd;
  c.spike = false;
  if (J.t >= (ia.objAte || 0)) { ia.objAte = J.t + 0.5; GP._escolherObjetivo(J, e); }
  const ob = ia.obj; if (!ob) return null;
  const d = Math.hypot(ob.x - e.x, ob.y - e.y);
  if (ob.acao === 'plantar' && d < 2.5 && GP.sitioEm(J.m, e.x, e.y)) { c.mx = c.my = 0; c.spike = true; c.modo = 'agacha'; return true; }
  if (ob.acao === 'desarmar' && d < GP.SPIKE.alcance * 0.8) { c.mx = c.my = 0; c.spike = true; c.modo = 'agacha'; return true; }
  if (ob.acao === 'segurar' && d < 1.2) {
    c.mx = c.my = 0; c.modo = 'anda'; ia.segurando = J.t;
    if (ob.olhar != null) GP._virarPara(e, ob.olhar, e.p.giro * 0.5, dt);
    return true;
  }
  /* entrando no bomb: perto, anda em silêncio (o duelista vai correndo) */
  const sitio = ob.acao !== 'desarmar' && J.m.sitios[(ia.ctx.match(/[abc]$/) || [])[0]];
  const modo = sitio && Math.hypot(sitio.x - e.x, sitio.y - e.y) < 20 && e.papel !== 'duelista' && J.spike.estado !== 'plantada' ? 'anda' : 'corre';
  return {ponto: ob, modo: ob.modo || modo};
};

/* ---------- desenho ---------- */
GP.desenharSpike = function (g, J) {
  const sp = J.spike;
  if (!sp) return;
  const man = GP.manifesto ? GP.manifesto().objetos || {} : {};
  const im = man.spike && GP.imagem(man.spike.src);
  const t = J.t;
  const pinta = (x, y, w) => { if (im) g.drawImage(im, x - w / 2, y - w / 2, w, w * im.height / im.width); else { g.fillStyle = '#ff4655'; g.fillRect(x - 0.3, y - 0.3, 0.6, 0.6); } };
  if (sp.estado === 'chao' || sp.estado === 'plantada') {
    if (sp.estado === 'plantada') {
      const k = Math.max(0, (sp.explode - t) / GP.SPIKE.pavio), pul = (t * (3 + (1 - k) * 8)) % 1;
      g.save(); g.strokeStyle = `rgba(255,70,85,${0.7 * (1 - pul)})`; g.lineWidth = 0.12;
      g.beginPath(); g.arc(sp.x, sp.y, 0.6 + pul * 2.5, 0, 7); g.stroke(); g.restore();
    }
    pinta(sp.x, sp.y, 0.9);
  } else if (sp.estado === 'carregada') {
    const d = J.ents.find(e => e.id === sp.dono);
    if (d && d.time === J.eu.time) pinta(d.x + 0.55, d.y - 1.5, 0.5);
  }
  /* barra de plantar / desarmar em cima de quem está fazendo */
  for (const e of J.ents) {
    if (!e._acaoSpike || !(e.time === J.eu.time || e._visivel)) continue;
    const plantando = sp.estado === 'carregada', f = plantando ? sp.progresso / GP.SPIKE.planta : sp.desarme / GP.SPIKE.desarme;
    g.fillStyle = 'rgba(10,14,20,.8)'; g.fillRect(e.x - 0.8, e.y - 2.6, 1.6, 0.22);
    g.fillStyle = plantando ? '#ff4655' : '#18e5b4'; g.fillRect(e.x - 0.8, e.y - 2.6, 1.6 * Math.min(1, f), 0.22);
    if (!plantando) { g.fillStyle = '#ffffff'; g.fillRect(e.x - 0.8 + 1.6 * GP.SPIKE.marco / GP.SPIKE.desarme - 0.02, e.y - 2.65, 0.04, 0.32); }
  }
  for (const f of J.efx || []) if (f.tipo === 'explosao') {
    const k = (t - f.t) / 1.2; if (k > 1) continue;
    g.save(); g.globalAlpha = 1 - k; g.fillStyle = '#ffb36b'; g.beginPath(); g.arc(f.x, f.y, GP.SPIKE.raio * (0.3 + 0.7 * k), 0, 7); g.fill(); g.restore();
  }
};
