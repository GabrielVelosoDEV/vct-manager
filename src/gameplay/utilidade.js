/* ============================================================
   UTILITÁRIA DOS BOTS (etapa 3)
   Os bots usam as mesmas teclas do jogador (vira, mira, aperta), mas
   quem decide é o time, para não desperdiçar:
     ataque   antes de entrar: recon/drone no bomb
              execução: smoke nos pontos de defesa da entrada, parede
              cortando o fogo cruzado, flash/cc quando o primeiro vai
              passar a entrada, molly em quem já foi visto (só duelista
              e iniciador — controlador e sentinela guardam para depois)
              pós-plant: smoke no caminho do retake, molly/ult na spike
              quando alguém desarma, cc em quem chega
     defesa   começo do round: sentinelas montam armadilhas nas entradas
              rush/contato: smoke e molly na entrada, parede da Sage
              plantando: molly em quem planta
              retake: recon, depois flash/cc e smoke em quem está no bomb
     ult      5 abates custam caro: só em execução, retake, anti-desarme
              ou no começo de uma briga com 2+ inimigos vivos
   Regras das smokes (da casa):
     · ninguém atravessa smoke: o bot procura outro caminho ou espera na
       borda segurando a mira; só o muito agressivo (ou com pressa de
       plantar/desarmar) passa
     · dá para se esconder dentro de smoke que não dá dano; lá dentro só
       se enxerga de perto
   ============================================================ */
'use strict';

/* ---------- catálogo: o que cada tecla é para o bot ----------
   forma  cursor  cai no ponto (atravessa parede)
          reto    projétil até o ponto ou a primeira parede
          fim     vai até o alcance ou a parede (não para no cursor)
          atras   aparece depois da primeira parede (Breach)
          linha   efeito numa faixa reta a partir do corpo
          dir     só a direção importa (paredes, bichos, cones)
          self    no próprio corpo
   raio   alcance do efeito (cc, flash, recon) ou meia-abertura do cone */
const U = (tipo, forma, alc, raio) => ({tipo, forma, alc: alc || 0, raio: raio || 0});
GP.UTIL = {
  jett: {c: U('fumaca', 'reto', 18, 2.6), e: U('dash', 'dir', 7), x: U('arma', 'self')},
  phoenix: {c: U('parede', 'dir', 13), q: U('flash', 'fim', 9, 22), e: U('molly', 'reto', 15, 2.4), x: U('ultEntrada', 'self')},
  reyna: {c: U('cc', 'fim', 9, 20), q: U('curaOrbe', 'self'), e: U('fugaOrbe', 'self'), x: U('arma', 'self')},
  raze: {c: U('cc', 'fim', 30, 9), e: U('molly', 'reto', 14, 4), x: U('ultAlvo', 'dir', 45)},
  yoru: {c: U('fake', 'dir', 30), q: U('flash', 'fim', 22, 22)},
  neon: {c: U('parede', 'dir', 20), q: U('cc', 'reto', 24, 3.5), x: U('arma', 'self')},
  iso: {c: U('escudo', 'dir', 12), q: U('ccAlvo', 'dir', 30), e: U('buffLuta', 'self'), x: U('ultAlvo', 'dir', 36)},
  waylay: {c: U('cc', 'reto', 16, 3), q: U('dash', 'dir', 6), x: U('ultCone', 'dir', 30, 0.32)},
  sova: {c: U('drone', 'self'), q: U('molly', 'reto', 30, 4), e: U('recon', 'reto', 40, 30), x: U('ultAlvo', 'dir', 60)},
  breach: {c: U('molly', 'atras', 3, 2.8), q: U('flash', 'atras', 10, 22), e: U('cc', 'linha', 22, 1.6), x: U('ultCone', 'dir', 28, 0.42)},
  skye: {c: U('curaTime', 'self'), q: U('cc', 'linha', 27, 1.3), e: U('flash', 'fim', 28, 22), x: U('ultBusca', 'self')},
  kayo: {c: U('molly', 'reto', 18, 3), q: U('flash', 'reto', 16, 22), e: U('recon', 'fim', 40, 15), x: U('ultSelf', 'self', 0, 30)},
  fade: {c: U('cc', 'fim', 22, 12), q: U('cc', 'reto', 24, 3.2), e: U('recon', 'reto', 30, 30), x: U('ultCone', 'dir', 32, 0.45)},
  gekko: {c: U('molly', 'reto', 18, 3.2), q: U('cc', 'fim', 20, 14), e: U('flash', 'fim', 20, 22), x: U('ultBicho', 'dir', 30, 0.4)},
  tejo: {c: U('drone', 'self'), q: U('cc', 'reto', 20, 4.5), e: U('molly', 'cursor', 40, 3.5), x: U('ultLinha', 'linha', 27, 2.6)},
  brimstone: {c: U('estimulo', 'self', 8, 6), q: U('molly', 'reto', 18, 3), e: U('fumaca', 'cursor', 50, 3.4), x: U('ultMolly', 'cursor', 60, 4.5)},
  viper: {c: U('molly', 'reto', 18, 2.6), q: U('fumaca', 'reto', 16, 3.3), e: U('parede', 'dir', 40), x: U('ultPit', 'self', 0, 9)},
  omen: {q: U('cc', 'linha', 30, 1.8), e: U('fumaca', 'cursor', 40, 3.2)},
  astra: {c: U('cc', 'cursor', 40, 4.5), q: U('cc', 'cursor', 40, 4.5), e: U('fumaca', 'cursor', 40, 3.4)},
  harbor: {c: U('cc', 'reto', 18, 3.5), q: U('parede', 'dir', 32), e: U('fumaca', 'cursor', 30, 3.2), x: U('ultCone', 'dir', 30, 0.4)},
  clove: {c: U('curaAbate', 'self'), q: U('cc', 'reto', 18, 3.2), e: U('fumaca', 'cursor', 40, 3.2), x: U('ultSelf', 'self', 0, 0)},
  miks: {c: U('cc', 'reto', 16, 5), q: U('buff', 'self'), e: U('fumaca', 'cursor', 35, 3.2), x: U('ultCone', 'dir', 26, 0.5)},
  sage: {c: U('muro', 'reto', 6), q: U('cc', 'reto', 20, 3.6), e: U('curaSelf', 'self')},
  cypher: {c: U('trap', 'reto', 10), q: U('fumaca', 'reto', 18, 2.7), e: U('camera', 'reto', 25), x: U('ultRecon', 'self')},
  killjoy: {c: U('enxame', 'reto', 18, 2.6), q: U('trap', 'reto', 8), e: U('torreta', 'reto', 6), x: U('ultLockdown', 'self', 0, 16)},
  chamber: {c: U('trap', 'reto', 10), x: U('arma', 'self')},
  deadlock: {c: U('cc', 'reto', 18, 3.5), q: U('trap', 'reto', 8), e: U('muro', 'reto', 5), x: U('ultAlvo', 'dir', 40)},
  vyse: {c: U('molly', 'reto', 18, 3.2), q: U('trap', 'reto', 12), e: U('rosa', 'reto', 14), x: U('ultSelf', 'self', 0, 16)},
  veto: {q: U('cc', 'reto', 18, 2.8), e: U('interceptor', 'reto', 10), x: U('buffLuta', 'self')},
};
GP.ULT_EXECUCAO = ['ultEntrada', 'ultCone', 'ultBusca', 'ultBicho', 'ultSelf', 'ultLockdown'];

GP._info = (e, k) => (GP.UTIL[e.agente] || {})[k] || null;
/* as teclas do bot com carga para esses tipos */
GP._chaves = (J, e, tipos) => ['c', 'q', 'e', 'x'].filter(k => { const i = GP._info(e, k); return i && tipos.includes(i.tipo) && GP.podeUsar(J, e, k); });
GP._livre = e => e.bot && e.vivo && e.ia && !e.ia.lanca && e.ia.estado !== 'combate' && !(e.ef && e.ef.drone) && !e._acaoSpike && !e.viagem;
GP._u = J => { const P = J.plano; if (!P) return null; return P.u || (P.u = {fumacas: [], stall: {}, flashes: 0, usos: 0, setup: {}, ult: 0}); };

/* pedir: o bot vira para ang e solta k mirando em ponto */
GP._pedir = function (J, e, k, ponto, ang, extra) {
  if (!e.ia || e.ia.lanca) return false;
  /* utilidade baixa: a habilidade cai menos onde devia */
  const err = 1 - GP._q(e.atrib.utilidade == null ? 70 : e.atrib.utilidade);
  if (err > 0) {
    ang += GP._gauss(J.rnd) * err * 0.09;
    if (ponto) { const d = Math.hypot(ponto.x - e.x, ponto.y - e.y); ponto = {x: ponto.x + GP._gauss(J.rnd) * err * (0.6 + d * 0.06), y: ponto.y + GP._gauss(J.rnd) * err * (0.6 + d * 0.06)}; }
  }
  e.ia.lanca = {k, ponto: ponto ? {x: ponto.x, y: ponto.y} : null, ang, ate: J.t + 1.4, ...extra};
  const u = GP._u(J); if (u) u.usos++;
  return true;
};

/* ---------- onde o efeito vai cair ---------- */
GP._pontoEfeito = function (J, e, info, ang, alvo) {
  const m = J.m, at = d => ({x: e.x + Math.cos(ang) * d, y: e.y + Math.sin(ang) * d});
  const dAlvo = alvo ? Math.hypot(alvo.x - e.x, alvo.y - e.y) : info.alc;
  switch (info.forma) {
    case 'cursor': {
      let x = alvo.x, y = alvo.y; const d = Math.hypot(x - e.x, y - e.y);
      if (d > info.alc) { x = e.x + (x - e.x) * info.alc / d; y = e.y + (y - e.y) * info.alc / d; }
      if (GP.solidoEm(m, x, y)) return null;
      return {x, y};
    }
    case 'reto': return at(Math.min(info.alc, dAlvo, GP._ateParede(m, e.x, e.y, ang, info.alc)));
    case 'fim': case 'dir': return at(GP._ateParede(m, e.x, e.y, ang, info.alc));
    case 'atras': return GP._atrasDaParede(m, e.x, e.y, ang, info.alc, info.alc > 5 ? 8 : 6);
    case 'linha': return at(Math.min(info.alc, dAlvo + 2));
    default: return {x: e.x, y: e.y};
  }
};

/* quantos alvos o efeito pega (alvos = pontos onde deve ter inimigo) */
GP._nota = function (J, e, info, p, ang, alvos) {
  const m = J.m;
  let n = 0;
  for (const a of alvos) {
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (info.tipo === 'flash' || info.tipo === 'recon') { if (d < info.raio && GP.linhaLivre(m, p.x, p.y, a.x, a.y)) n++; }
    else if (info.forma === 'linha') { if (GP._distSeg(a.x, a.y, [e.x, e.y], [p.x, p.y]) < info.raio) n++; }
    else if (info.tipo === 'ultCone' || info.tipo === 'ultBicho') {
      const da = Math.hypot(a.x - e.x, a.y - e.y);
      if (da < info.alc && Math.abs(GP.angDif(ang, Math.atan2(a.y - e.y, a.x - e.x))) < info.raio) n++;
    } else if (d < info.raio && (info.raio < 6 || GP.linhaLivre(m, p.x, p.y, a.x, a.y))) n++;
  }
  return n;
};
/* o clarão pega todo mundo: quantos aliados ficariam cegos (olhando e com linha) */
GP._aliadosCegos = function (J, e, p) {
  let n = 0;
  for (const o of J.ents) {
    if (!o.vivo || o === e || o.time !== e.time) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d > 24 || !GP.linhaLivre(J.m, p.x, p.y, o.x, o.y)) continue;
    if (Math.abs(GP.angDif(o.ang, Math.atan2(p.y - o.y, p.x - o.x))) < 1.9) n++;
  }
  return n;
};
/* procura a melhor direção perto da direção do alvo */
GP._melhorMira = function (J, e, k, centro, alvos, minimo) {
  const info = GP._info(e, k); if (!info) return null;
  const base = Math.atan2(centro.y - e.y, centro.x - e.x);
  const offs = info.forma === 'cursor' || info.forma === 'self' ? [0] : [0, -0.12, 0.12, -0.25, 0.25, -0.4, 0.4, -0.6, 0.6];
  let best = null;
  for (const o of offs) {
    const ang = base + o, p = GP._pontoEfeito(J, e, info, ang, centro);
    if (!p) continue;
    let nota = GP._nota(J, e, info, p, ang, alvos) - Math.abs(o) * 0.3;
    if (info.tipo === 'flash') nota -= 3 * GP._aliadosCegos(J, e, p);
    if (!best || nota > best.nota) best = {ang, ponto: p, nota, k};
  }
  return best && best.nota >= minimo ? best : null;
};
/* acerta exatamente um ponto (smoke, molly): onde cai fica a menos de tol */
GP._miraNoPonto = function (J, e, k, alvo, tol) {
  const info = GP._info(e, k); if (!info) return null;
  if (Math.hypot(alvo.x - e.x, alvo.y - e.y) > info.alc + tol) return null;
  const ang = Math.atan2(alvo.y - e.y, alvo.x - e.x), p = GP._pontoEfeito(J, e, info, ang, alvo);
  if (!p || Math.hypot(p.x - alvo.x, p.y - alvo.y) > tol) return null;
  return {ang, ponto: info.forma === 'cursor' ? alvo : p, k};
};

/* ---------- o que o time sabe dos inimigos ---------- */
GP._atualizarSabe = function (J) {
  const t = J.t, S0 = J.sabe || (J.sabe = {});
  for (const time of ['A', 'B']) {
    const S = S0[time] || (S0[time] = {});
    const meus = J.ents.filter(e => e.vivo && e.time === time);
    for (const o of J.ents) {
      if (o.time === time) continue;
      if (!o.vivo) { delete S[o.id]; continue; }
      if ((o.ef && o.ef.revelado > t) || meus.some(a => GP.ve(J, a, o) || GP.ouve(J, a, o))) S[o.id] = {x: o.x, y: o.y, t, id: o.id};
    }
  }
};
GP._conhecidos = (J, time, idade) => Object.values((J.sabe || {})[time] || {}).filter(s => J.t - s.t <= idade);

/* ponto no caminho entre a e b, a dist metros antes de b */
GP._antesDe = function (m, a, b, dist) {
  const cam = GP.caminho(m, a.x, a.y, b.x, b.y);
  if (!cam || cam.length < 2) return {x: b.x, y: b.y};
  const D = GP._densa(cam), fim = D[D.length - 1].s;
  return GP._noCaminho(D, Math.max(0, fim - dist));
};
/* um ponto com linha até alvo, no caminho de quem vem de 'de', a ~dist dele */
GP._pontoDeLancar = function (m, de, alvo, dist) {
  const cam = GP.caminho(m, de.x, de.y, alvo.x, alvo.y);
  if (!cam || cam.length < 2) return {x: de.x, y: de.y};
  const D = GP._densa(cam), fim = D[D.length - 1].s;
  for (let s = fim - dist; s >= 0; s -= 0.5) { const p = GP._noCaminho(D, s); if (GP.linhaLivre(m, p.x, p.y, alvo.x, alvo.y)) return p; }
  return {x: de.x, y: de.y};
};
/* pontos de pós-plant em volta da spike (de onde o ataque segura) */
GP._pontosPosPlant = function (J, sp) {
  const m = J.m, out = [];
  for (let k = 0; k < 36; k++) {
    const a = k / 36 * Math.PI * 2, r = 7 + (k % 3) * 4, q = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * r, sp.y + Math.sin(a) * r);
    if (GP.linhaLivre(m, q.x, q.y, sp.x, sp.y) && !out.some(o => Math.hypot(o.x - q.x, o.y - q.y) < 4)) out.push(q);
  }
  return out.slice(0, 8);
};
GP._fumacaPerto = (J, p, r) => (J.hab ? J.hab.areas : []).some(a => a.fumaca && Math.hypot(a.x - p.x, a.y - p.y) < r);

/* ============================================================
   O TIME DECIDE (a cada 0,2 s)
   ============================================================ */
GP._utilTime = function (J) {
  if (J.modo !== 'partida' || !J.plano || !J.plano.atk || J.round.fase !== 'ativo') return;
  if (J.t - (J._utilEm || 0) < 0.2) return;
  J._utilEm = J.t;
  if (J._utilPlano !== J.plano) { J._utilPlano = J.plano; J.sabe = {}; }
  GP._atualizarSabe(J);
  GP._utilAtaque(J, GP._timeAtk(J));
  GP._utilDefesa(J, GP._timeDef(J));
};

/* manda o melhor candidato usar algo de 'tipos' para pegar 'alvos' */
GP._mandar = function (J, bots, tipos, centro, alvos, minimo, filtro) {
  let best = null;
  for (const e of bots) {
    if (!GP._livre(e) || (filtro && !filtro(e))) continue;
    for (const k of GP._chaves(J, e, tipos)) {
      const info = GP._info(e, k);
      if (Math.hypot(centro.x - e.x, centro.y - e.y) > info.alc + 12 && info.forma !== 'self') continue;
      const r = GP._melhorMira(J, e, k, centro, alvos, minimo);
      if (r && (!best || r.nota > best.nota)) best = {...r, e};
    }
  }
  if (!best) return null;
  GP._pedir(J, best.e, best.k, best.ponto, best.ang);
  return best;
};
/* smoke (ou molly) num ponto exato */
GP._mandarNoPonto = function (J, bots, tipos, alvo, tol, filtro) {
  let best = null;
  for (const e of bots) {
    if (!GP._livre(e) || (filtro && !filtro(e))) continue;
    for (const k of GP._chaves(J, e, tipos)) {
      const r = GP._miraNoPonto(J, e, k, alvo, tol);
      const d = Math.hypot(alvo.x - e.x, alvo.y - e.y);
      if (r && (!best || d < best.d)) best = {...r, e, d};
    }
  }
  if (!best) return null;
  GP._pedir(J, best.e, best.k, best.ponto, best.ang);
  return best;
};

GP._utilAtaque = function (J, time) {
  const P = J.plano, A = P.atk, u = GP._u(J), t = J.t, m = J.m, T = GP._tatica(m), sp = J.spike;
  const vivos = J.ents.filter(e => e.vivo && e.time === time), bots = vivos.filter(e => e.bot);
  const inimigos = J.ents.filter(e => e.vivo && e.time !== time);
  if (!bots.length || !inimigos.length) return;
  const L = A.alvo, sitio = m.sitios[L], inicio = J.round.inicio || t;
  const sabe = GP._conhecidos(J, time, 4);
  if (sp.estado !== 'plantada') {
    if (!sitio) return;
    const spots = T.defesa[L] || [];
    const alvos = sabe.filter(s => Math.hypot(s.x - sitio.x, s.y - sitio.y) < 30).concat(spots);
    const naExecucao = A.fase === 'ir' && A.decidido && t - A.tIr < 14;
    /* recon/drone antes de entrar (um por round) */
    if (!u.recon && A.decidido && ((A.fase === 'formar' && t - inicio > 10) || naExecucao)) {
      for (const e of bots) {
        if (!GP._livre(e)) continue;
        const dr = GP._chaves(J, e, ['drone'])[0];
        if (dr && Math.hypot(e.x - sitio.x, e.y - sitio.y) < 45) { GP._pedir(J, e, dr, null, Math.atan2(sitio.y - e.y, sitio.x - e.x), {drone: {x: sitio.x, y: sitio.y}}); u.recon = t; break; }
      }
      if (!u.recon && GP._mandar(J, bots, ['recon'], sitio, spots, 2)) u.recon = t;
    }
    if (naExecucao) {
      const papeis = A.papeis;
      const entrantes = vivos.filter(e => papeis[e.id] && !['lurk', 'fake', 'flanco'].includes(papeis[e.id].f) && papeis[e.id].L === L);
      const usadas = [...new Set(entrantes.map(e => papeis[e.id].k))];
      /* smokes: nos pontos de defesa que olham as entradas usadas */
      const total = bots.reduce((s, e) => s + GP._chaves(J, e, ['fumaca']).reduce((a, k) => a + e.cargas[k], 0), 0);
      const quer = A.tipo === 'rush' ? 1 : Math.min(2, total > 2 ? total - 1 : total);
      if (u.fumacas.length < quer) {
        const cands = spots.slice().sort((a, b) => (usadas.includes(a.entrada) ? 0 : 1) - (usadas.includes(b.entrada) ? 0 : 1));
        for (const s of cands) {
          if (u.fumacas.some(f => Math.hypot(f.x - s.x, f.y - s.y) < 6) || GP._fumacaPerto(J, s, 4)) continue;
          const E = T.entradas[L][s.entrada] || T.entradas[L][0], d = Math.hypot(E.x - s.x, E.y - s.y) || 1;
          if (d < 8) continue;   /* colado na entrada: o time limpa na mão, a smoke só cegaria quem entra */
          const p = GP._pontoLivrePerto(m, s.x + (E.x - s.x) / d * 1.2, s.y + (E.y - s.y) / d * 1.2);
          if (GP._mandarNoPonto(J, bots, ['fumaca'], p, 2.5)) { u.fumacas.push(p); break; }
        }
      }
      /* estímulo e buffs quando o time sai */
      if (!u.estim) for (const e of bots) {
        if (!GP._livre(e)) continue;
        const k = GP._chaves(J, e, ['estimulo'])[0];
        if (k && vivos.filter(o => Math.hypot(o.x - e.x, o.y - e.y) < 6).length >= 3) { GP._pedir(J, e, k, {x: e.x, y: e.y}, e.ang); u.estim = t; }
      }
      for (const e of bots) {
        const k = GP._chaves(J, e, ['buff'])[0], p = papeis[e.id];
        if (k && GP._livre(e) && p && p.L === L && t >= A.tIr + (p.atraso || 0)) GP._pedir(J, e, k, null, e.ang);
      }
      /* o primeiro a entrar: quando chega na entrada, sai flash/cc/parede */
      const ord = entrantes.slice().sort((a, b) => (papeis[a.id].atraso || 0) - (papeis[b.id].atraso || 0));
      const e0 = ord.find(e => GP.sitioEm(m, e.x, e.y) !== L) || ord[0];
      if (e0) {
        const E0 = T.entradas[L][Math.min(papeis[e0.id].k, T.entradas[L].length - 1)];
        const d0 = Math.hypot(e0.x - E0.x, e0.y - E0.y), chegando = d0 < 9 && GP.sitioEm(m, e0.x, e0.y) !== L;
        /* paredes: quem está na entrada corta o bomb ao meio */
        for (const e of bots) {
          if (!GP._livre(e) || u['parede' + e.id]) continue;
          const k = GP._chaves(J, e, ['parede', 'escudo'])[0], p = papeis[e.id];
          if (!k || !p || p.L !== L) continue;
          const Ee = T.entradas[L][Math.min(p.k, T.entradas[L].length - 1)];
          if (Math.hypot(e.x - Ee.x, e.y - Ee.y) < 5) { GP._pedir(J, e, k, sitio, Math.atan2(sitio.y - e.y, sitio.x - e.x)); u['parede' + e.id] = t; }
        }
        if (chegando && u.flashes < 3 && t - (u.ultFlash || 0) > 1.6) {
          const r = GP._mandar(J, bots, ['flash', 'cc'], {x: (E0.x * 2 + sitio.x) / 3, y: (E0.y * 2 + sitio.y) / 3}, alvos, 1,
            e => Math.hypot(e.x - E0.x, e.y - E0.y) < 30);
          if (r) { u.flashes++; u.ultFlash = t; }
        }
        /* duelista: arrancada para dentro do bomb */
        for (const e of bots) {
          const p = papeis[e.id]; if (!p || p.L !== L || !GP._livre(e) || t < A.tIr + (p.atraso || 0)) continue;
          const k = GP._chaves(J, e, ['dash'])[0]; if (!k) continue;
          const Ee = T.entradas[L][Math.min(p.k, T.entradas[L].length - 1)], ang = Math.atan2(sitio.y - e.y, sitio.x - e.x);
          if (Math.hypot(e.x - Ee.x, e.y - Ee.y) < 3.5 && GP._ateParede(m, e.x, e.y, ang, 8) > 5) GP._pedir(J, e, k, null, ang);
        }
        /* ult na execução: uma, com o time inteiro ainda de pé */
        if (!u.ultExec && d0 < 12 && vivos.length >= 3 && inimigos.length >= 2) {
          for (const e of bots) {
            if (!GP._livre(e)) continue;
            const k = GP._chaves(J, e, GP.ULT_EXECUCAO)[0]; if (!k) continue;
            const info = GP._info(e, k), dS = Math.hypot(e.x - sitio.x, e.y - sitio.y);
            if (info.tipo === 'ultEntrada' && e !== e0) continue;
            if ((info.tipo === 'ultLockdown' || info.tipo === 'ultSelf') && dS > (info.raio || 20)) continue;
            if (info.tipo === 'ultCone' || info.tipo === 'ultBicho') {
              const r = GP._melhorMira(J, e, k, sitio, alvos, 2); if (!r) continue;
              GP._pedir(J, e, k, r.ponto, r.ang);
            } else GP._pedir(J, e, k, sitio, Math.atan2(sitio.y - e.y, sitio.x - e.x));
            u.ultExec = t; break;
          }
        }
      }
      /* molly em quem já foi visto: só duelista e iniciador (o resto guarda) */
      if (t - (u.ultMolly || 0) > 3) for (const s of sabe.filter(s => t - s.t < 2 && Math.hypot(s.x - sitio.x, s.y - sitio.y) < 22)) {
        if (GP._mandarNoPonto(J, bots, ['molly'], s, 2, e => e.papel === 'duelista' || e.papel === 'iniciador')) { u.ultMolly = t; break; }
      }
    }
    /* fake: o Yoru solta os passos no bomb do fake */
    for (const e of bots) {
      const p = A.papeis[e.id]; if (!p || p.f !== 'fake' || !GP._livre(e) || u['fake' + e.id]) continue;
      const k = GP._chaves(J, e, ['fake'])[0], E = T.entradas[p.L][0];
      if (k && Math.hypot(e.x - E.x, e.y - E.y) < 8) { GP._pedir(J, e, k, m.sitios[p.L], Math.atan2(m.sitios[p.L].y - e.y, m.sitios[p.L].x - e.x)); u['fake' + e.id] = t; }
    }
    return;
  }
  /* ---- pós-plant ---- */
  if (!u.pp) u.pp = {t, choke: GP._antesDe(m, m.spawn.def, sp, 14)};
  const pp = u.pp;
  if (!pp.fumaca && t - pp.t > 0.5 && !GP._fumacaPerto(J, pp.choke, 4)) {
    if (GP._mandarNoPonto(J, bots, ['fumaca'], pp.choke, 2.5)) pp.fumaca = t;
  }
  /* alguém desarmando: molly na spike (a ult só se não tiver molly) */
  if (sp.desarmador && sp.desarme > 0.3 && t - (u.antiDef || 0) > 2.5) {
    let r = GP._mandarNoPonto(J, bots, ['molly'], sp, 1.6);
    if (!r && (sp.desarme > 2 || sp.desarme >= GP.SPIKE.marco)) r = GP._mandarNoPonto(J, bots, ['ultMolly', 'ultLinha'], sp, 1.6);
    if (!r) {
      for (const e of bots) { const k = GP._chaves(J, e, ['ultPit'])[0]; if (k && GP._livre(e) && Math.hypot(e.x - sp.x, e.y - sp.y) < 6) { GP._pedir(J, e, k, null, e.ang); r = true; break; } }
    }
    if (r) u.antiDef = t;
  }
  /* retake chegando: cc/flash em quem vem */
  const chegam = sabe.filter(s => t - s.t < 1.5 && Math.hypot(s.x - sp.x, s.y - sp.y) < 22);
  if (chegam.length && t - (u.ultFlash || 0) > 2.5 && (u.flashPP || 0) < 2) {
    const c = chegam.reduce((a, s) => ({x: a.x + s.x / chegam.length, y: a.y + s.y / chegam.length}), {x: 0, y: 0});
    if (GP._mandar(J, bots, ['flash', 'cc'], c, chegam, 1)) { u.ultFlash = t; u.flashPP = (u.flashPP || 0) + 1; }
  }
};

GP._utilDefesa = function (J, time) {
  const P = J.plano, D = P.def, u = GP._u(J), t = J.t, m = J.m, T = GP._tatica(m), sp = J.spike;
  const vivos = J.ents.filter(e => e.vivo && e.time === time), bots = vivos.filter(e => e.bot);
  const inimigos = J.ents.filter(e => e.vivo && e.time !== time);
  if (!bots.length || !inimigos.length) return;
  const inicio = J.round.inicio || t, sabe = GP._conhecidos(J, time, 4);
  /* começo do round: sentinelas montam as armadilhas */
  if (!u.setupDef && t - inicio > 0.3) {
    u.setupDef = t;
    for (const e of bots) { const pos = D.posicao[e.id]; if (pos && pos.L !== 'meio' && m.sitios[pos.L]) e.ia.setups = GP._setupsDefesa(J, e, pos); }
  }
  if (sp.estado !== 'plantada') {
    /* contato: seguram a entrada (smoke, molly, cc, parede da Sage) */
    for (const L in m.sitios) {
      const perto = sabe.filter(s => t - s.t < 3 && T.entradas[L].some(E => Math.hypot(s.x - E.x, s.y - E.y) < 15));
      const ouvidos = Object.values(P.avisos[L] || {}).filter(x => t - x < 4).length;
      if (!perto.length || (perto.length < 2 && ouvidos < 2) || t - (u.stall[L] || 0) < 8) continue;
      const c = perto.reduce((a, s) => ({x: a.x + s.x / perto.length, y: a.y + s.y / perto.length}), {x: 0, y: 0});
      const E = T.entradas[L].slice().sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
      let n = 0;
      if (!GP._fumacaPerto(J, E, 4) && GP._mandarNoPonto(J, bots, ['fumaca'], E, 2.5)) n++;
      if (GP._mandar(J, bots, ['molly', 'cc'], c, perto, 1)) n++;
      /* parede de controlador (Viper, Harbor) ou duelista corta a entrada */
      for (const e of bots) {
        const k = GP._chaves(J, e, ['parede'])[0];
        if (k && GP._livre(e) && Math.hypot(e.x - E.x, e.y - E.y) < GP._info(e, k).alc - 2 && GP.linhaLivre(m, e.x, e.y, E.x, E.y)) { GP._pedir(J, e, k, E, Math.atan2(E.y - e.y, E.x - e.x)); n++; break; }
      }
      for (const e of bots) {
        const k = GP._chaves(J, e, ['muro'])[0];
        if (k && GP._livre(e) && Math.hypot(e.x - E.x, e.y - E.y) < 9 && GP.linhaLivre(m, e.x, e.y, E.x, E.y)) { GP._pedir(J, e, k, E, Math.atan2(E.y - e.y, E.x - e.x)); n++; break; }
      }
      if (n) u.stall[L] = t;
    }
    /* atacantes amontoados perto do bomb (a execução): molly ou cc no meio deles */
    if (t - (u.antiExec || 0) > 5) {
      const juntos = sabe.filter(s => t - s.t < 1.5 && Object.values(m.sitios).some(S => Math.hypot(s.x - S.x, s.y - S.y) < 22));
      for (const s of juntos) {
        const viz = juntos.filter(o => Math.hypot(o.x - s.x, o.y - s.y) < 5);
        if (viz.length < 2) continue;
        const c = viz.reduce((a, o) => ({x: a.x + o.x / viz.length, y: a.y + o.y / viz.length}), {x: 0, y: 0});
        if (GP._mandar(J, bots, ['molly', 'cc', 'ultMolly'].slice(0, inimigos.length >= 3 ? 3 : 2), c, viz, 2)) { u.antiExec = t; break; }
      }
    }
    /* re-peek: quem sabe de um atacante colado atrás da parede joga a flash antes de aparecer */
    for (const e of bots) {
      if (!GP._livre(e) || t - (e.ia.flashRepeek || 0) < 6) continue;
      const s = sabe.find(s => t - s.t < 1.2 && Math.hypot(s.x - e.x, s.y - e.y) < 14 && !GP.linhaLivre(m, e.x, e.y, s.x, s.y));
      if (!s) continue;
      const k = GP._chaves(J, e, ['flash', 'cc'])[0]; if (!k) continue;
      const r = GP._melhorMira(J, e, k, s, [s], 1);
      if (r) { GP._pedir(J, e, k, r.ponto, r.ang); e.ia.flashRepeek = t; }
    }
    /* plantando: molly/cc em quem planta */
    if (sp.estado === 'carregada' && sp.progresso > 0.4 && t - (u.antiPlant || 0) > 4) {
      const pl = J.ents.find(o => o.id === sp.dono), s = pl && (J.sabe[time] || {})[pl.id];
      if (s && t - s.t < 1) {
        if (GP._mandarNoPonto(J, bots, ['molly'], s, 2) || GP._mandar(J, bots, ['cc', 'flash'], s, [s], 1)) u.antiPlant = t;
      }
    }
    return;
  }
  /* ---- retake ---- */
  const Rt = P.retake; if (!Rt) return;
  if (!u.rt) u.rt = {spots: GP._pontosPosPlant(J, sp)};
  const rt = u.rt, alvos = sabe.filter(s => Math.hypot(s.x - sp.x, s.y - sp.y) < 26).concat(rt.spots);
  if (!rt.recon && t - Rt.t > 0.8) {
    for (const e of bots) {
      const k = GP._chaves(J, e, ['ultRecon'])[0];
      if (k && GP._livre(e)) { GP._pedir(J, e, k, null, e.ang); rt.recon = t; break; }
    }
    if (!rt.recon && GP._mandar(J, bots, ['recon'], sp, alvos, 2)) rt.recon = t;
    if (!rt.recon) for (const e of bots) {
      const k = GP._chaves(J, e, ['drone'])[0];
      if (k && GP._livre(e) && Math.hypot(e.x - sp.x, e.y - sp.y) < 40) { GP._pedir(J, e, k, null, Math.atan2(sp.y - e.y, sp.x - e.x), {drone: {x: sp.x, y: sp.y}}); rt.recon = t; break; }
    }
  }
  if (Rt.fase !== 'entrar') return;
  const perto = vivos.filter(e => Math.hypot(e.x - sp.x, e.y - sp.y) < 20);
  if (!perto.length) return;
  /* smoke em quem já se sabe onde está, para isolar */
  if ((rt.fumacas || 0) < 2 && t - (rt.ultFum || 0) > 1) {
    const s = sabe.find(s => t - s.t < 3 && !GP._fumacaPerto(J, s, 3.5) && Math.hypot(s.x - sp.x, s.y - sp.y) < 26);
    if (s && GP._mandarNoPonto(J, bots, ['fumaca'], s, 2.5)) { rt.fumacas = (rt.fumacas || 0) + 1; rt.ultFum = t; }
  }
  if ((rt.flashes || 0) < 3 && t - (rt.ultFlash || 0) > 1.4) {
    if (GP._mandar(J, bots, ['flash', 'cc'], sp, alvos, 1)) { rt.flashes = (rt.flashes || 0) + 1; rt.ultFlash = t; }
  }
  if (!rt.ult && inimigos.length >= 2) {
    for (const e of bots) {
      if (!GP._livre(e)) continue;
      const k = GP._chaves(J, e, ['ultCone', 'ultBusca', 'ultBicho', 'ultSelf', 'ultLockdown', 'ultMolly', 'ultLinha'])[0]; if (!k) continue;
      const info = GP._info(e, k), dS = Math.hypot(e.x - sp.x, e.y - sp.y);
      if ((info.tipo === 'ultLockdown' || info.tipo === 'ultSelf') && dS > (info.raio || 20)) continue;
      if (['ultCone', 'ultBicho', 'ultLinha'].includes(info.tipo)) {
        const r = GP._melhorMira(J, e, k, sp, alvos, 2); if (!r) continue;
        GP._pedir(J, e, k, r.ponto, r.ang);
      } else if (info.tipo === 'ultMolly') {
        const s = sabe.find(s => t - s.t < 2); if (!s) continue;
        const r = GP._miraNoPonto(J, e, k, s, 2); if (!r) continue;
        GP._pedir(J, e, k, r.ponto, r.ang);
      } else GP._pedir(J, e, k, sp, Math.atan2(sp.y - e.y, sp.x - e.x));
      rt.ult = t; break;
    }
  }
};

/* armadilhas da defesa: na entrada do bomb que o sentinela segura */
GP._setupsDefesa = function (J, e, pos) {
  const m = J.m, T = GP._tatica(m), L = pos.L, s = m.sitios[L], spot = pos.spot, ate = (J.round.inicio || J.t) + 24;
  const ents = T.entradas[L].slice().sort((a, b) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(b.x - spot.x, b.y - spot.y));
  const out = [], add = (k, ponto, de) => out.push({k, ponto, de, ate});
  const cargas = k => (e.cargas[k] || 0);
  let i = 0;
  for (const k of ['c', 'q', 'e']) {
    const info = GP._info(e, k); if (!info) continue;
    for (let n = 0; n < cargas(k); n++) {
      if (info.tipo === 'trap' || info.tipo === 'enxame') {
        const E = ents[i++ % ents.length]; add(k, E, GP._pontoDeLancar(m, spot, E, Math.min(info.alc * 0.6, 6)));
      } else if (info.tipo === 'rosa') {
        const E = ents[0], d = Math.hypot(s.x - E.x, s.y - E.y) || 1, p = GP._pontoLivrePerto(m, E.x + (s.x - E.x) / d * 3, E.y + (s.y - E.y) / d * 3);
        add(k, p, GP._pontoDeLancar(m, spot, p, 6));
      } else if (info.tipo === 'torreta' && n === 0) {
        const E = ents[0], d = Math.hypot(E.x - spot.x, E.y - spot.y) || 1;
        add(k, {x: spot.x + (E.x - spot.x) / d * 1.2, y: spot.y + (E.y - spot.y) / d * 1.2}, spot);
      } else if (info.tipo === 'camera' && n === 0) {
        if (GP.linhaLivre(m, spot.x, spot.y, s.x, s.y) && Math.hypot(s.x - spot.x, s.y - spot.y) < 24) add(k, s, spot);
      } else if (info.tipo === 'interceptor' && n === 0) {
        add(k, Math.hypot(s.x - spot.x, s.y - spot.y) < 9 && GP.linhaLivre(m, spot.x, spot.y, s.x, s.y) ? s : spot, spot);
      }
    }
  }
  return out;
};

/* ============================================================
   O BOT FAZ (a cada quadro, antes do combate)
   devolve true quando tomou conta do movimento neste quadro
   ============================================================ */
GP._utilBot = function (J, e, dt, alvo) {
  const ia = e.ia, c = e.cmd, t = J.t, m = J.m, ef = e.ef || {};
  if (J.round.fase !== 'ativo') return false;
  /* pilotando drone: o corpo fica parado, o drone vai até o bomb */
  if (ef.drone) {
    const d = ef.drone, alvoD = ia.droneAlvo || {x: d.x, y: d.y};
    if (!ia.droneCam || t > (ia.droneCamAte || 0)) { ia.droneCam = GP.caminho(m, d.x, d.y, alvoD.x, alvoD.y) || []; ia.droneCamAte = t + 1; }
    while (ia.droneCam.length && Math.hypot(ia.droneCam[0].x - d.x, ia.droneCam[0].y - d.y) < 0.8) ia.droneCam.shift();
    const prox = ia.droneCam[0];
    if (prox) { const dd = Math.hypot(prox.x - d.x, prox.y - d.y) || 1; c.mx = (prox.x - d.x) / dd; c.my = (prox.y - d.y) / dd; } else c.mx = c.my = 0;
    const visto = GP._noRaio(J, e, d.x, d.y, d.tiro === 'pulso' ? 5 : 13, true)[0];
    c.mira = visto ? {x: visto.x, y: visto.y} : prox || alvoD;
    if (visto && !d.usou) c.atirar = true;
    if (d.usou || !prox || t > (ia.droneAte || 0) || alvo) c.hab = 'c';   /* segundo toque: volta */
    return true;
  }
  /* parado no fogo inimigo: sai (a não ser que esteja quase plantando/desarmando) */
  if (J.hab && !alvo) {
    const fogo = J.hab.areas.find(a => (a.dps || a.decai) && a.dono && a.dono.time !== e.time && Math.hypot(a.x - e.x, a.y - e.y) < a.r + 0.3);
    const sp = J.spike, quase = e._acaoSpike && ((sp.estado === 'plantada' && sp.desarme > GP.SPIKE.desarme - 1.2) || (sp.estado === 'carregada' && sp.progresso > GP.SPIKE.planta - 1));
    if (fogo && !quase) {
      const d = Math.hypot(e.x - fogo.x, e.y - fogo.y) || 1;
      c.mx = (e.x - fogo.x) / d; c.my = (e.y - fogo.y) / d; c.modo = 'corre'; c.spike = false; ia.caminho = null;
      return true;
    }
  }
  /* na briga: só o que vale na hora (ult de arma, buff, ult no alvo) */
  if (alvo) {
    if (ia.lanca && !ia.lanca.luta) ia.lanca = null;
    if (!ia.emLuta) { ia.emLuta = true; ia.lutaDesde = t; }
    if (t - (ia.utilLuta || 0) < 0.4) return false;
    ia.utilLuta = t;
    const ini = J.ents.filter(o => o.vivo && o.time !== e.time).length, dA = Math.hypot(alvo.x - e.x, alvo.y - e.y);
    for (const k of ['e', 'x', 'q']) {
      const info = GP._info(e, k); if (!info || !GP.podeUsar(J, e, k)) continue;
      const comeco = t - ia.lutaDesde < 1.5;
      if ((info.tipo === 'arma' || info.tipo === 'buffLuta') && (k !== 'x' || ini >= 2) && comeco) { c.hab = k; return false; }
      if ((info.tipo === 'ultAlvo' || info.tipo === 'ccAlvo') && dA > 5 && dA < info.alc && t >= ia.reacaoAte && Math.abs(GP.angDif(e.ang, Math.atan2(alvo.y - e.y, alvo.x - e.x))) < 0.08 && (k !== 'x' || ini >= 1)) {
        c.mira = {x: alvo.x, y: alvo.y}; c.hab = k; return false;
      }
    }
    return false;
  }
  ia.emLuta = false;
  /* pedido do time: vira e solta */
  if (ia.lanca) {
    const L = ia.lanca;
    if (t > L.ate || !GP.podeUsar(J, e, L.k)) { ia.lanca = null; J.utilFalhas = (J.utilFalhas || 0) + 1; return false; }
    c.mx = c.my = 0; c.modo = 'anda'; c.atirar = false; c.spike = false;
    GP._virarPara(e, L.ang, e.p.giro * 1.6, dt);
    if (Math.abs(GP.angDif(e.ang, L.ang)) < 0.07) {
      e.ang = L.ang; c.mira = L.ponto; c.hab = L.k; ia.lanca = null;
      if (L.drone) { ia.droneAlvo = L.drone; ia.droneAte = t + 5.5; ia.droneCam = null; }
    }
    return true;
  }
  /* sozinho: curas e orbes */
  if (t - (ia.utilSo || 0) > 0.25) {
    ia.utilSo = t;
    const viuAgora = ia.vista && t - ia.vista.t < 2.5;
    for (const k of ['c', 'q', 'e']) {
      const info = GP._info(e, k); if (!info || !GP.podeUsar(J, e, k)) continue;
      const tp = info.tipo;
      if ((tp === 'curaOrbe' && e.hp < 95) || (tp === 'fugaOrbe' && e.hp < 45) || (tp === 'curaAbate' && e.hp < 85) || (tp === 'curaSelf' && e.hp < 60 && !viuAgora)) { c.hab = k; return false; }
      if (tp === 'curaTime' && !viuAgora && J.ents.filter(o => o.vivo && o !== e && o.time === e.time && o.hp < 70 && Math.hypot(o.x - e.x, o.y - e.y) < 9).length >= 2) { c.hab = k; return false; }
    }
    /* Killjoy: solta o enxame quando passa alguém; Vyse: a rosa */
    if (J.hab) for (const ob of J.hab.objs) {
      if (ob.dono !== e) continue;
      if (ob.tipo === 'enxame' && !ob.ativo && J.ents.some(o => o.vivo && o.time !== e.time && Math.hypot(o.x - ob.x, o.y - ob.y) < 2.4 && (o._acaoSpike || J.t - (((J.sabe || {})[e.time] || {})[o.id] || {t: -9}).t < 0.6))) { c.hab = 'c'; return false; }
      if (ob.tipo === 'rosa' && J.ents.some(o => o.vivo && o.time !== e.time && Math.hypot(o.x - ob.x, o.y - ob.y) < 7 && GP.linhaLivre(m, ob.x, ob.y, o.x, o.y)) && GP._aliadosCegos(J, e, ob) === 0) { c.hab = 'e'; return false; }
    }
    /* sentinela no ataque: armadilha no flanco; Killjoy no pós-plant */
    GP._setupsAtaque(J, e);
  }
  /* armadilhas da lista: vai até o ponto e solta */
  while (ia.setups && ia.setups.length) {
    const s = ia.setups[0];
    if (t > s.ate || !GP.podeUsar(J, e, s.k) || (ia.vista && t - ia.vista.t < 3)) { ia.setups.shift(); continue; }
    if (Math.hypot(e.x - s.de.x, e.y - s.de.y) > 1.2) { GP._irPara(J, e, s.de, 'anda', dt); return true; }
    ia.setups.shift();
    GP._pedir(J, e, s.k, s.ponto, Math.atan2(s.ponto.y - e.y, s.ponto.x - e.x));
    return true;
  }
  GP._esconderNaFumaca(J, e);
  return false;
};

GP._setupsAtaque = function (J, e) {
  const ia = e.ia, u = GP._u(J), t = J.t, m = J.m, P = J.plano;
  if (!u || !P || e.time !== GP._timeAtk(J) || u.setup[e.id] || !ia.obj || ia.obj.acao !== 'segurar' || t - (ia.segurando || -9) > 0.3) return;
  const sp = J.spike, ctx = ia.ctx || '';
  if (/^(flanco|lurk)/.test(ctx) && sp.estado !== 'plantada') {
    const k = GP._chaves(J, e, ['trap'])[0]; if (!k) return;
    const a = ia.obj.olhar != null ? ia.obj.olhar : e.ang;
    const p = GP._pontoLivrePerto(m, e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6);
    if (GP.linhaLivre(m, e.x, e.y, p.x, p.y)) { GP._pedir(J, e, k, p, Math.atan2(p.y - e.y, p.x - e.x)); u.setup[e.id] = t; }
  } else if (ctx === 'posplant' && sp.estado === 'plantada') {
    u.setup[e.id] = t;
    const lista = [];
    const ch = (u.pp && u.pp.choke) || m.spawn.def, d = Math.hypot(ch.x - e.x, ch.y - e.y) || 1;
    for (const k of GP._chaves(J, e, ['torreta'])) lista.push({k, ponto: {x: e.x + (ch.x - e.x) / d * 1.2, y: e.y + (ch.y - e.y) / d * 1.2}, de: {x: e.x, y: e.y}, ate: t + 8});
    for (const k of GP._chaves(J, e, ['enxame', 'rosa'])) if (GP._miraNoPonto(J, e, k, sp, 1.5)) lista.push({k, ponto: {x: sp.x, y: sp.y}, de: {x: e.x, y: e.y}, ate: t + 8});
    ia.setups = lista;
  }
};

/* defensor cujo ponto foi tomado por smoke: o agressivo se esconde dentro,
   o cauteloso troca para outro ponto do bomb que ainda enxerga */
GP._esconderNaFumaca = function (J, e) {
  const ia = e.ia, ob = ia.obj, P = J.plano;
  if (!ob || ob.acao !== 'segurar' || ob.fumacaVista || !J.hab || !P || e.time !== GP._timeDef(J) || J.spike.estado === 'plantada') return;
  const f = J.hab.areas.find(a => a.fumaca && !a.decai && !a.dps && a.dono && a.dono.time !== e.time && Math.hypot(a.x - ob.x, a.y - ob.y) < a.r + 2.5);
  if (!f) return;
  ob.fumacaVista = true;
  if (ia.agressivo >= 0.6) {
    const d = Math.hypot(ob.x - f.x, ob.y - f.y) || 1, q = GP._pontoLivrePerto(J.m, f.x + (ob.x - f.x) / d * f.r * 0.4, f.y + (ob.y - f.y) / d * f.r * 0.4);
    Object.assign(ob, {x: q.x, y: q.y, naFumaca: true});
  } else {
    const pos = P.def.posicao[e.id], lst = pos && GP._tatica(J.m).defesa[pos.L];
    const alt = lst && lst.find(s => !J.hab.areas.some(a => a.fumaca && Math.hypot(a.x - s.x, a.y - s.y) < a.r + 3));
    if (alt) Object.assign(ob, {x: alt.x, y: alt.y, olhar: alt.olhar});
  }
  ia.caminho = null;
};

/* ============================================================
   SMOKE NO CAMINHO
   O caminho é feito com as smokes fechadas; se não houver outro jeito, o
   bot anda até a borda e segura a mira nela. Passa só quem é muito
   agressivo ou tem pressa (plantar/desarmar no fim do tempo).
   ============================================================ */
GP.CRUZA_SMOKE = 0.7;
GP._pressa = function (J, e) {
  const ctx = e.ia.ctx || '', sp = J.spike;
  if (/desarmar|retake/.test(ctx)) return sp.estado === 'plantada' && sp.explode - J.t < GP.SPIKE.desarme + 9;
  if (/plantar|pegar/.test(ctx)) return J.round.ate - J.t < 25;
  if (/entrar|juntar/.test(ctx) && sp.estado === 'plantada') return sp.explode - J.t < GP.SPIKE.desarme + 12;
  return J.round.ate - J.t < 15;
};
GP._fumacasAtivas = J => (J.hab ? J.hab.areas : []).filter(a => a.fumaca && J.t < a.ate);
GP._caminhoBot = function (J, e, alvo) {
  const m = J.m, n = m.nav;
  const fum = e.bot && J.modo === 'partida' && !(e.ia.agressivo >= GP.CRUZA_SMOKE) && !GP._pressa(J, e) ? GP._fumacasAtivas(J) : [];
  const bloq = fum.filter(a => Math.hypot(a.x - e.x, a.y - e.y) > a.r + 0.8 && Math.hypot(a.x - alvo.x, a.y - alvo.y) > a.r + 0.8);
  e.ia.smokeNoCaminho = null;
  if (!bloq.length) return GP.caminho(m, e.x, e.y, alvo.x, alvo.y);
  const salvo = [];
  for (const a of bloq) {
    const r = a.r + 0.4;
    for (let Y = Math.max(0, Math.floor((a.y - r) / n.passo)); Y <= Math.min(n.H - 1, Math.floor((a.y + r) / n.passo)); Y++)
      for (let X = Math.max(0, Math.floor((a.x - r) / n.passo)); X <= Math.min(n.W - 1, Math.floor((a.x + r) / n.passo)); X++) {
        const i = Y * n.W + X;
        if (n.livre[i] && Math.hypot((X + 0.5) * n.passo - a.x, (Y + 0.5) * n.passo - a.y) <= r) { salvo.push(i); n.livre[i] = 0; }
      }
  }
  const desvio = GP.caminho(m, e.x, e.y, alvo.x, alvo.y);
  for (const i of salvo) n.livre[i] = 1;
  const direto = GP.caminho(m, e.x, e.y, alvo.x, alvo.y);
  const comp = c => c ? c.reduce((s, p, i) => i ? s + Math.hypot(p.x - c[i - 1].x, p.y - c[i - 1].y) : 0, 0) : 1e9;
  if (desvio && comp(desvio) <= comp(direto) * 1.6 + 12) return desvio;
  /* sem desvio bom: vai pelo direto, mas para na borda da smoke */
  if (direto) for (const p of direto) {
    const a = bloq.find(a => Math.hypot(p.x - a.x, p.y - a.y) < a.r + 0.5);
    if (a) { e.ia.smokeNoCaminho = a; break; }
  }
  return direto;
};
/* chamado pelo _irPara: perto da borda de uma smoke que não pode passar, segura */
GP._pararNaFumaca = function (J, e, dt) {
  const a = e.ia.smokeNoCaminho;
  if (!a || J.t >= a.ate || !J.hab || !J.hab.areas.includes(a) || GP._pressa(J, e)) { e.ia.smokeNoCaminho = null; return false; }
  const d = Math.hypot(a.x - e.x, a.y - e.y);
  if (d > a.r + 2.2) return false;
  const c = e.cmd;
  c.mx = c.my = 0; c.modo = 'anda';
  GP._virarPara(e, Math.atan2(a.y - e.y, a.x - e.x), e.p.giro * 0.5, dt);
  e.ia.segurando = J.t; e.ia.caminhoAte = Math.min(e.ia.caminhoAte || 0, J.t + 0.5);
  return true;
};
