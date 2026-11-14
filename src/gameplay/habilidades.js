/* ============================================================
   HABILIDADES (C · Q · E · X)
   Cada agente tem as 4 teclas. O motor oferece peças comuns e cada
   habilidade é uma combinação delas:
     projétil  voa até o cursor (ou até a parede) e faz algo ao parar
     área      círculo no chão por um tempo: fumaça (esconde), fogo
               (dano/cura), lentidão, concussão
     parede    segmento por um tempo: esconde e/ou queima e/ou segura bala
     clarão    cega quem estiver olhando
     explosão  dano em raio, com queda e precisando de linha livre
     efeito    no próprio corpo: arrancada, invisível, mais rápido…
   Os bots usam as habilidades pelo mesmo caminho (cmd.hab + cmd.mira);
   quem decide quando é o time, em utilidade.js.
   ============================================================ */
'use strict';

GP.HAB_TESTE = true;      /* laboratório: C, Q e E com cargas cheias todo round */
GP.PONTOS_ULT = 5;        /* regra da casa: 5 abates liberam a ultimate, para todos */

/* ---------- utilitários ---------- */
GP._hab = J => J.hab || (J.hab = {proj: [], areas: [], paredes: [], fx: [], orbes: [], robos: [], passos: [], bichos: [], drones: [], objs: [], muros: [], ev: 0});
GP._ef = e => e.ef || (e.ef = {});
GP._dir = e => ({x: Math.cos(e.ang), y: Math.sin(e.ang)});
GP._inimigosDe = (J, e) => J.ents.filter(o => o.vivo && o.time !== e.time);

/* até onde se chega em linha reta, sem atravessar parede */
GP._ateParede = function (m, x, y, ang, max) {
  return Math.max(0, Math.min(max, GP.raio(m, x, y, ang, max) - 0.35));
};
/* o ponto mirado: o cursor, limitado ao alcance e à primeira parede */
GP._pontoMirado = function (J, e, max) {
  const c = e.cmd.mira;
  let d = c ? Math.hypot(c.x - e.x, c.y - e.y) : max;
  d = Math.min(max, d, GP._ateParede(J.m, e.x, e.y, e.ang, max));
  return {x: e.x + Math.cos(e.ang) * d, y: e.y + Math.sin(e.ang) * d, d};
};

GP._habDano = function (J, de, alvo, dano, nome) {
  if (!alvo.vivo || dano <= 0) return;
  GP._dano(J, de, alvo, dano, 1, {nome});
};

GP._explosao = function (J, de, x, y, raio, dano, nome, minimo = 0.4) {
  for (const o of J.ents) {
    if (!o.vivo || o === de || o.time === de.time) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d > raio || !GP.linhaLivre(J.m, x, y, o.x, o.y)) continue;
    GP._habDano(J, de, o, dano * (1 - (1 - minimo) * d / raio), nome);
  }
  J.sons.push({x, y, t: J.t, dono: de.id, time: de.time, r: 40, tiro: true});
};

/* clarão: cega quem tem linha livre até o estouro, mais se estiver olhando */
GP._clarao = function (J, de, x, y, dur) {
  for (const o of J.ents) {
    if (!o.vivo || o === de) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d > 24 || !GP.linhaLivre(J.m, x, y, o.x, o.y)) continue;
    const olha = Math.abs(GP.angDif(o.ang, Math.atan2(y - o.y, x - o.x)));
    const f = olha < 1.05 ? 1 : olha < 1.9 ? 0.45 : 0.15;
    const ef = GP._ef(o);
    ef.cego = Math.max(ef.cego || 0, J.t + dur * f);
    ef.cegoDur = dur * f;
  }
};

GP._fx = (J, o) => GP._hab(J).fx.push({t: J.t, dur: 0.5, ...o});

/* projétil: anda reto; para na parede (ou quica uma vez) e chama aoParar */
GP._lancar = function (J, e, o) {
  const H = GP._hab(J), ang = o.ang != null ? o.ang : e.ang;
  const p = {dono: e, x: e.x + Math.cos(ang) * 0.5, y: e.y + Math.sin(ang) * 0.5, ang, vel: o.vel || 20,
    resta: o.alcance, quica: o.quica || 0, img: o.img, ag: e.agente, aoParar: o.aoParar, atravessa: o.atravessa,
    acertaGente: o.acertaGente, t0: J.t, escala: o.escala || 0.9};
  H.proj.push(p);
  return p;
};

GP._area = (J, o) => { const a = {t0: J.t, ...o}; GP._hab(J).areas.push(a); return a; };
GP._parede = (J, o) => { const p = {t0: J.t, ...o}; GP._hab(J).paredes.push(p); return p; };

/* arrancada: velocidade fixa por um instante (a colisão continua valendo) */
GP._arrancar = function (J, e, ang, dist, dur, img) {
  const ef = GP._ef(e);
  ef.dash = {vx: Math.cos(ang) * dist / dur, vy: Math.sin(ang) * dist / dur, ate: J.t + dur, x0: e.x, y0: e.y, img};
};
GP._dirMovimento = function (e) {
  const c = e.cmd, n = Math.hypot(c.mx || 0, c.my || 0);
  return n > 0.1 ? Math.atan2(c.my, c.mx) : e.ang;
};

/* ---------- os agentes ---------- */
GP.HABS = {
  jett: {
    c: {nome: 'Cloudburst', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 22, alcance: alvo.d, img: null, aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 2.6, ate: J.t + 4.5, fumaca: true, img: 'c_area', ag: 'jett'})});
    }},
    q: {nome: 'Updraft', cargas: 2, usar(J, e) {
      GP._fx(J, {x: e.x, y: e.y, img: 'q_clarao', ag: 'jett', r: 1.6, dur: 0.6});
      GP._arrancar(J, e, GP._dirMovimento(e), 3.2, 0.3);
    }},
    e: {nome: 'Tailwind', cargas: 1, usar(J, e) { GP._arrancar(J, e, GP._dirMovimento(e), 7, 0.18, 'e_rastro'); }},
    x: {nome: 'Blade Storm', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.facas = 5; ef.facasAte = J.t + 40; }},
  },
  phoenix: {
    c: {nome: 'Blaze', cargas: 1, usar(J, e) {
      const L = GP._ateParede(J.m, e.x, e.y, e.ang, 13);
      GP._parede(J, {a: [e.x + Math.cos(e.ang) * 0.6, e.y + Math.sin(e.ang) * 0.6], b: [e.x + Math.cos(e.ang) * L, e.y + Math.sin(e.ang) * L],
        ate: J.t + 8, esconde: true, dps: 30, cura: 12, dono: e, img: 'c_parede', ag: 'phoenix', alto: 1.1, nome: 'Blaze'});
    }},
    q: {nome: 'Curveball', cargas: 2, usar(J, e) {
      const d = GP._ateParede(J.m, e.x, e.y, e.ang, 9);
      GP._lancar(J, e, {vel: 18, alcance: d, img: 'q_projetil', aoParar: (J, p) => { GP._clarao(J, p.dono, p.x, p.y, 1.1); GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'phoenix', r: 2.4, dur: 0.5}); }});
    }},
    e: {nome: 'Hot Hands', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 15);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'e_projetil', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 2.4, ate: J.t + 4, dps: 60, cura: 12, dono: p.dono, img: 'e_area', ag: 'phoenix', nome: 'Hot Hands'})});
    }},
    x: {nome: 'Run It Back', cargas: 1, usar(J, e) { GP._ef(e).volta = {x: e.x, y: e.y, ate: J.t + 10}; }},
  },
  reyna: {
    c: {nome: 'Leer', cargas: 2, usar(J, e) {
      const d = GP._ateParede(J.m, e.x, e.y, e.ang, 9);
      GP._area(J, {x: e.x + Math.cos(e.ang) * d, y: e.y + Math.sin(e.ang) * d, r: 0.7, ate: J.t + 2.2, olho: true, dono: e, img: 'c_objeto', ag: 'reyna', objeto: true});
    }},
    q: {nome: 'Devour', cargas: 4, precisa: 'orbe', usar(J, e, orbe) { orbe.usado = true; GP._ef(e).cura = {ate: J.t + 3, porSeg: 100 / 3, max: 150}; }},
    e: {nome: 'Dismiss', cargas: 2, precisa: 'orbe', usar(J, e, orbe) { orbe.usado = true; const ef = GP._ef(e); ef.invis = J.t + 2; ef.rapido = {ate: J.t + 2, k: 1.4}; }},
    x: {nome: 'Empress', cargas: 1, usar(J, e) { GP._ef(e).empress = J.t + 30; }},
  },
  raze: {
    c: {nome: 'Boom Bot', cargas: 1, usar(J, e) { GP._hab(J).robos.push({dono: e, x: e.x + Math.cos(e.ang) * 0.6, y: e.y + Math.sin(e.ang) * 0.6, ang: e.ang, ate: J.t + 5}); }},
    q: {nome: 'Blast Pack', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 7);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'q_projetil', aoParar: (J, p) => {
        GP._area(J, {x: p.x, y: p.y, r: 0.5, ate: J.t + 0.45, objeto: true, img: 'q_projetil', ag: 'raze', aoFim: J => {
          GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'raze', r: 2.2, dur: 0.45});
          GP._explosao(J, p.dono, p.x, p.y, 3.5, 40, 'Blast Pack');
          /* empurra quem estiver perto (a própria Raze inclusive): é o pulo dela */
          for (const o of J.ents) { const d = Math.hypot(o.x - p.x, o.y - p.y); if (o.vivo && d < 3.5) GP._arrancar(J, o, Math.atan2(o.y - p.y, o.x - p.x) + (d < 0.05 ? o.ang : 0), 6.5 * (1 - d / 5), 0.3); }
        }});
      }});
    }},
    e: {nome: 'Paint Shells', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 14);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'e_projetil', aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'e_clarao', ag: 'raze', r: 2.4, dur: 0.45});
        GP._explosao(J, p.dono, p.x, p.y, 4, 55, 'Paint Shells');
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + J.rnd() * 0.8, d = GP._ateParede(J.m, p.x, p.y, a, 2.6);
          const sx = p.x + Math.cos(a) * d, sy = p.y + Math.sin(a) * d;
          GP._area(J, {x: sx, y: sy, r: 0.3, ate: J.t + 0.7 + k * 0.08, objeto: true, img: 'e_projetil', ag: 'raze', escala: 0.45, aoFim: J => {
            GP._fx(J, {x: sx, y: sy, img: 'e_clarao', ag: 'raze', r: 1.6, dur: 0.4});
            GP._explosao(J, p.dono, sx, sy, 2.5, 55, 'Paint Shells');
          }});
        }
      }});
    }},
    x: {nome: 'Showstopper', cargas: 1, usar(J, e) {
      GP._lancar(J, e, {vel: 36, alcance: 60, img: 'x_projetil', escala: 1.2, acertaGente: true, aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'x_clarao', ag: 'raze', r: 4.5, dur: 0.6});
        GP._explosao(J, p.dono, p.x, p.y, 5, 150, 'Showstopper', 0.3);
      }});
    }},
  },
  yoru: {
    c: {nome: 'Fakeout', cargas: 1, usar(J, e) { GP._hab(J).passos.push({dono: e, x: e.x, y: e.y, ang: e.ang, ate: J.t + 6, rastro: [[e.x, e.y]], som: 0}); }},
    q: {nome: 'Blindside', cargas: 2, usar(J, e) {
      GP._lancar(J, e, {vel: 26, alcance: 22, quica: 1, img: 'q_projetil', aoParar: (J, p) => { GP._clarao(J, p.dono, p.x, p.y, 1.5); GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'yoru', r: 2.4, dur: 0.5}); }});
    }},
    e: {nome: 'Gatecrash', cargas: 1, usar(J, e) {
      const ef = GP._ef(e);
      GP._lancar(J, e, {vel: 6, alcance: 30, img: 'e_objeto', escala: 1.1, aoParar: (J, p) => { ef.portal = {x: p.x, y: p.y, ate: J.t + 30}; }});
      ef.portalProj = GP._hab(J).proj[GP._hab(J).proj.length - 1];
    }},
    x: {nome: 'Dimensional Drift', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.invis = J.t + 8; ef.drift = J.t + 8; ef.rapido = {ate: J.t + 8, k: 1.15}; }},
  },
  neon: {
    c: {nome: 'Fast Lane', cargas: 1, usar(J, e) {
      for (const lado of [-1, 1]) {
        const ox = e.x - Math.sin(e.ang) * 1.7 * lado, oy = e.y + Math.cos(e.ang) * 1.7 * lado;
        const ini = GP.solidoEm(J.m, ox, oy) ? null : [ox, oy];
        if (!ini) continue;
        const L = GP._ateParede(J.m, ox, oy, e.ang, 20);
        GP._parede(J, {a: ini, b: [ox + Math.cos(e.ang) * L, oy + Math.sin(e.ang) * L], ate: J.t + 6, esconde: true, dono: e, img: 'c_parede', ag: 'neon', alto: 0.8, nome: 'Fast Lane'});
      }
    }},
    q: {nome: 'Relay Bolt', cargas: 1, usar(J, e) {
      const c = e.cmd.mira, alc = c ? Math.min(24, Math.hypot(c.x - e.x, c.y - e.y)) : 24;   /* vai até o cursor, quicando uma vez se bater */
      GP._lancar(J, e, {vel: 22, alcance: alc, quica: 1, img: 'q_projetil', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3.5, ate: J.t + 0.6, conc: 2.5, dono: p.dono, img: 'q_area', ag: 'neon', umaVez: true})});
    }},
    e: {nome: 'High Gear', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.gear = !ef.gear; if (ef.combustivel == null) ef.combustivel = 6; }},
    x: {nome: 'Overdrive', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.overdrive = J.t + 12; ef.rapido = {ate: J.t + 12, k: 1.2}; }},
  },
  iso: {
    c: {nome: 'Contingency', cargas: 1, usar(J, e) {
      const nx = -Math.sin(e.ang), ny = Math.cos(e.ang), cx = e.x + Math.cos(e.ang) * 1, cy = e.y + Math.sin(e.ang) * 1;
      GP._parede(J, {a: [cx - nx * 3, cy - ny * 3], b: [cx + nx * 3, cy + ny * 3], ate: J.t + 4, esconde: true, seguraBala: true, anda: {vx: Math.cos(e.ang) * 5, vy: Math.sin(e.ang) * 5, ate: J.t + 2.4},
        dono: e, img: 'c_parede', ag: 'iso', alto: 0.6, cor: 'rgba(160,110,255,.55)', nome: 'Contingency'});
    }},
    q: {nome: 'Undercut', cargas: 2, usar(J, e) {
      GP._lancar(J, e, {vel: 32, alcance: 30, atravessa: true, acertaGente: true, img: 'q_projetil', aoParar: (J, p) => { if (p.acertou) GP._ef(p.acertou).fragil = J.t + 4; }});
    }},
    e: {nome: 'Double Tap', cargas: 1, usar(J, e) { GP._ef(e).escudoUm = J.t + 12; }},
    x: {nome: 'Kill Contract', cargas: 1, usar(J, e) {
      /* a parede de energia vai reto; quem ela pega é puxado para uma arena
         quadrada com o Iso: só os dois lá dentro, até um cair (ou 12 s) */
      GP._lancar(J, e, {vel: 26, alcance: 36, atravessa: true, acertaGente: true, img: 'c_parede', escala: 3, aoParar: (J, p) => {
        const o = p.acertou; if (!o || !e.vivo || !GP._muro) return;
        const L = 12, h = L / 2, a = e.ang, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
        const cx = e.x + ux * 4, cy = e.y + uy * 4;
        o.x = cx + ux * 3; o.y = cy + uy * 3; o.vx = o.vy = 0; e.x = cx - ux * 3; e.y = cy - uy * 3; e.vx = e.vy = 0;
        const c = (s, t) => [cx + ux * s * h + vx * t * h, cy + uy * s * h + vy * t * h];
        const ate = J.t + 12, op = {ate, hp: 99999, semDesenho: true, nome: 'Kill Contract'};
        for (const [p1, p2] of [[c(-1, -1), c(1, -1)], [c(1, -1), c(1, 1)], [c(1, 1), c(-1, 1)], [c(-1, 1), c(-1, -1)]]) GP._muro(J, e, p1, p2, op);
        GP._area(J, {x: cx, y: cy, r: 0.01, desenho: L / 2.25 * 1.1, ate, img: 'x_area', ag: 'iso', alfa: 0.55, ang: a});
        GP._empurrar(J.m, o, o.raioCol); GP._empurrar(J.m, e, e.raioCol);
      }});
    }},
  },
  waylay: {
    c: {nome: 'Saturate', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 16);
      GP._lancar(J, e, {vel: 20, alcance: alvo.d, img: 'c_projetil', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3, ate: J.t + 3.5, lento: true, dono: p.dono, img: 'c_area', ag: 'waylay'})});
    }},
    q: {nome: 'Lightspeed', cargas: 2, usar(J, e) { GP._arrancar(J, e, GP._dirMovimento(e), 6, 0.2, 'q_rastro'); }},
    e: {nome: 'Refract', cargas: 1, usar(J, e) { GP._ef(e).ancora = {x: e.x, y: e.y, ate: J.t + 7}; }},
    x: {nome: 'Convergent Paths', cargas: 1, usar(J, e) {
      const H = GP._hab(J), o = {x: e.x, y: e.y, ang: e.ang, L: 30, abre: 0.32, t0: J.t, dono: e};
      H.fx.push({x: e.x, y: e.y, ang: e.ang, img: 'x_cone', ag: 'waylay', cone: 30, dur: 1.2, t: J.t});
      GP._area(J, {x: e.x, y: e.y, r: 0, ate: J.t + 0.6, aoFim: J => {
        for (const v of GP._inimigosDe(J, o.dono)) {
          const d = Math.hypot(v.x - o.x, v.y - o.y), a = Math.abs(GP.angDif(o.ang, Math.atan2(v.y - o.y, v.x - o.x)));
          if (d < o.L && a < o.abre && GP.linhaLivre(J.m, o.x, o.y, v.x, v.y)) GP._ef(v).lento = J.t + 5;
        }
      }});
      GP._ef(e).rapido = {ate: J.t + 6, k: 1.3};
    }},
  },
};

/* habilidades com segundo toque (a mesma tecla de novo) */
GP._segundoToque = function (J, e, k) {
  if (GP._segundoToqueIni && GP._segundoToqueIni(J, e, k)) return true;
  const ef = GP._ef(e);
  if (e.agente === 'yoru' && k === 'e' && (ef.portal || ef.portalProj)) {
    const p = ef.portal || ef.portalProj;
    if (ef.portalProj) { ef.portalProj.morto = true; ef.portalProj = null; }
    GP._fx(J, {x: e.x, y: e.y, img: 'q_clarao', ag: 'yoru', r: 1.6, dur: 0.4});
    e.x = p.x; e.y = p.y; e.vx = e.vy = 0; GP._empurrar(J.m, e, e.raioCol);
    J.sons.push({x: p.x, y: p.y, t: J.t, dono: e.id, time: e.time, r: 30, tiro: true});
    ef.portal = null;
    return true;
  }
  if (e.agente === 'waylay' && k === 'e' && ef.ancora) {
    GP._fx(J, {x: e.x, y: e.y, ang: Math.atan2(ef.ancora.y - e.y, ef.ancora.x - e.x), img: 'q_rastro', ag: 'waylay', rastro: Math.hypot(ef.ancora.x - e.x, ef.ancora.y - e.y), dur: 0.4});
    e.x = ef.ancora.x; e.y = ef.ancora.y; e.vx = e.vy = 0; ef.ancora = null;
    return true;
  }
  if (e.agente === 'yoru' && k === 'x' && ef.drift > J.t) { ef.drift = ef.invis = J.t; ef.rapido = null; return true; }
  if (e.agente === 'neon' && k === 'e' && ef.gear) { ef.gear = false; return true; }
  return false;
};

GP.resetarHabilidades = function (J) {
  if (J.hab && GP._tirarMuro) for (const w of J.hab.muros || []) GP._tirarMuro(J, w);
  J.hab = null; GP._hab(J).ev = J.eventos.length;
  for (const e of J.ents) {
    e.ef = {};
    const H = GP.HABS[e.agente];
    if (J.modo === 'partida' && e.cargas) {
      /* na partida as cargas ficam de um round para o outro (e se compram);
         a assinatura (E) ganha uma de graça por round */
      if (H && H.e && H.e.cargas && !H.e.semDuelo) e.cargas.e = Math.min(H.e.cargas, Math.max(e.cargas.e || 0, 1));
    } else {
      e.cargas = {c: 0, q: 0, e: 0, x: 0};
      if (H) for (const k of ['c', 'q', 'e', 'x']) e.cargas[k] = H[k] ? H[k].cargas : 0;
    }
    /* ultimate: só com 5 abates (os pontos ficam de um round para o outro) */
    e.pontosUlt = e.pontosUlt || 0;
    e.cargas.x = H && H.x && H.x.cargas && e.pontosUlt >= GP.PONTOS_ULT ? 1 : 0;
  }
};

GP._orbePerto = (J, e) => GP._hab(J).orbes.find(o => !o.usado && J.t < o.ate && Math.hypot(o.x - e.x, o.y - e.y) < 5);

/* aperte a tecla: dá para usar agora? (para a HUD também) */
GP.podeUsar = function (J, e, k) {
  const H = GP.HABS[e.agente], h = H && H[k];
  if (!h || h.semDuelo || !e.vivo || J.round.fase !== 'ativo') return false;
  if (h.precisa === 'orbe' && !GP._orbePerto(J, e)) return false;
  if (e.ef && e.ef.supr > J.t) return false;
  if (h.precisa === 'abate' && !(e.ef && e.ef.ultimoAbate > J.t - 3)) return false;
  return (e.cargas[k] || 0) > 0;
};

/* ---------- a cada passo ---------- */
GP.passoHabilidades = function (J, dt) {
  const H = GP._hab(J), m = J.m, t = J.t;
  /* teclas */
  for (const e of J.ents) {
    const k = e.cmd && e.cmd.hab;
    if (!k) continue;
    e.cmd.hab = null;
    if (!e.vivo || J.round.fase !== 'ativo') continue;
    if (GP._segundoToque(J, e, k)) continue;
    if (!GP.podeUsar(J, e, k)) continue;
    const h = GP.HABS[e.agente][k];
    h.usar(J, e, h.precisa === 'orbe' ? GP._orbePerto(J, e) : null);
    e.cargas[k]--;
    if (k === 'x') e.pontosUlt = 0;
    J.eventos.push({tipo: 'habilidade', t, dono: e.id, tecla: k, nome: h.nome});
  }
  /* abates: orbe de alma da Reyna, faca da Jett volta, ultimate do Neon renova */
  for (; H.ev < J.eventos.length; H.ev++) {
    const ev = J.eventos[H.ev];
    if (ev.tipo !== 'morte') continue;
    const de = J.ents.find(o => o.id === ev.de), em = J.ents.find(o => o.id === ev.em);
    if (!de || !em) continue;
    /* talentos do modo jogador (core/talentos.js): vida e ultimate por abate */
    if (de.tal && de.time !== em.time) {
      if (de.tal.vida && de.vivo) de.hp = Math.min(100, de.hp + de.tal.vida);
      if (de.tal.ult) { de._ultFrac = (de._ultFrac || 0) + de.tal.ult; if (de._ultFrac >= 1 && de.pontosUlt != null) { de._ultFrac -= 1; de.pontosUlt++; } }
    }
    if (de.time !== em.time && de.pontosUlt != null && de.pontosUlt < GP.PONTOS_ULT) {
      de.pontosUlt++;
      const HH = GP.HABS[de.agente];
      if (de.pontosUlt >= GP.PONTOS_ULT && HH && HH.x && HH.x.cargas) de.cargas.x = 1;
    }
    if (GP._abateControlador) GP._abateControlador(J, de);
    if (de.agente === 'reyna') H.orbes.push({x: em.x, y: em.y, ate: t + 3, dono: de});
    const ef = GP._ef(de);
    if (ef.facas != null && ef.facasAte > t) ef.facas = 5;
    if (ef.empress > t) ef.empress = t + 30;
    if (ef.overdrive > t) ef.overdrive = t + 12;
  }
  /* projéteis */
  for (const p of H.proj) {
    if (p.morto) continue;
    let passo = p.vel * dt;
    while (passo > 0 && !p.morto) {
      const s = Math.min(passo, 0.25); passo -= s;
      const nx = p.x + Math.cos(p.ang) * s, ny = p.y + Math.sin(p.ang) * s;
      if (!p.atravessa && GP.solidoEm(m, nx, ny)) {
        if (p.quica > 0) {
          p.quica--;
          /* reflete no eixo que bateu */
          const bx = GP.solidoEm(m, nx, p.y), by = GP.solidoEm(m, p.x, ny);
          if (bx) p.ang = Math.PI - p.ang;
          if (by || !bx) p.ang = -p.ang;
          continue;
        }
        p.morto = true; break;
      }
      p.x = nx; p.y = ny; p.resta -= s;
      if (p.acertaGente) for (const o of GP._inimigosDe(J, p.dono)) if (Math.hypot(o.x - p.x, o.y - p.y) < o.raio + 0.2) { p.acertou = o; p.morto = true; break; }
      if (p.resta <= 0) p.morto = true;
    }
    if (p.morto && p.aoParar) p.aoParar(J, p);
  }
  H.proj = H.proj.filter(p => !p.morto);
  /* áreas */
  for (const a of H.areas) {
    if (a.olho && a.dono) for (const o of GP._inimigosDe(J, a.dono)) {
      if (Math.hypot(o.x - a.x, o.y - a.y) < 22 && GP.linhaLivre(m, a.x, a.y, o.x, o.y)) { const ef = GP._ef(o); ef.miope = Math.max(ef.miope || 0, t + 0.25); }
    }
    for (const o of J.ents) {
      if (!o.vivo) continue;
      const den = Math.hypot(o.x - a.x, o.y - a.y) < a.r;
      if (!den) continue;
      const ef = GP._ef(o), inimigo = a.dono && o.time !== a.dono.time;
      if (a.dps && inimigo) { o._queima = (o._queima || 0) + a.dps * dt; if (o._queima >= 5) { GP._habDano(J, a.dono, o, o._queima, a.nome || 'fogo'); o._queima = 0; } }
      if (a.cura && o === a.dono) o.hp = Math.min(100, o.hp + a.cura * dt);
      if (a.lento && inimigo) ef.lento = Math.max(ef.lento || 0, t + 0.3);
      if (a.conc && inimigo && !a._conc) ef.conc = t + a.conc;
    }
    if (a.conc) a._conc = true;
    if (t >= a.ate) { a.fim = true; if (a.aoFim) a.aoFim(J, a); }
  }
  H.areas = H.areas.filter(a => !a.fim);
  /* paredes */
  for (const w of H.paredes) {
    if (w.anda && t < w.anda.ate) {
      const dx = w.anda.vx * dt, dy = w.anda.vy * dt, mx = (w.a[0] + w.b[0]) / 2 + dx, my = (w.a[1] + w.b[1]) / 2 + dy;
      if (!GP.solidoEm(m, mx, my)) { w.a[0] += dx; w.a[1] += dy; w.b[0] += dx; w.b[1] += dy; } else w.anda = null;
    }
    if (w.dps || w.cura) for (const o of J.ents) {
      if (!o.vivo || GP._distSeg(o.x, o.y, w.a, w.b) > 0.9) continue;
      if (w.dps && o.time !== w.dono.time) { o._queima = (o._queima || 0) + w.dps * dt; if (o._queima >= 5) { GP._habDano(J, w.dono, o, o._queima, w.nome); o._queima = 0; } }
      if (w.cura && o === w.dono) o.hp = Math.min(100, o.hp + w.cura * dt);
    }
  }
  H.paredes = H.paredes.filter(w => t < w.ate);
  /* Boom Bot: anda, quica na parede, persegue quem vê e explode perto */
  for (const r of H.robos) {
    const alvo = GP._inimigosDe(J, r.dono).find(o => Math.hypot(o.x - r.x, o.y - r.y) < 10 && GP.linhaLivre(m, r.x, r.y, o.x, o.y));
    if (alvo) r.ang += Math.max(-4 * dt, Math.min(4 * dt, GP.angDif(r.ang, Math.atan2(alvo.y - r.y, alvo.x - r.x))));
    const v = 6.5 * dt, nx = r.x + Math.cos(r.ang) * v, ny = r.y + Math.sin(r.ang) * v;
    if (GP.solidoEm(m, nx, ny)) { if (GP.solidoEm(m, nx, r.y)) r.ang = Math.PI - r.ang; else r.ang = -r.ang; } else { r.x = nx; r.y = ny; }
    if ((alvo && Math.hypot(alvo.x - r.x, alvo.y - r.y) < 1.3) || t > r.ate) {
      r.fim = true;
      GP._fx(J, {x: r.x, y: r.y, img: 'q_clarao', ag: 'raze', r: 2.2, dur: 0.45});
      GP._explosao(J, r.dono, r.x, r.y, 3, 125, 'Boom Bot', 0.5);
    } else if (J.t - (r.som || 0) > 0.4) { r.som = J.t; J.sons.push({x: r.x, y: r.y, t: J.t, dono: r.dono.id, time: r.dono.time, r: 14}); }
  }
  H.robos = H.robos.filter(r => !r.fim);
  /* Fakeout: passos andando para a frente, fazendo barulho */
  for (const s of H.passos) {
    const v = 5.5 * dt, nx = s.x + Math.cos(s.ang) * v, ny = s.y + Math.sin(s.ang) * v;
    if (!GP.solidoEm(m, nx, ny)) { s.x = nx; s.y = ny; } else s.parado = true;
    const u = s.rastro[s.rastro.length - 1];
    if (Math.hypot(u[0] - s.x, u[1] - s.y) > 0.7) s.rastro.push([s.x, s.y]);
    if (t - s.som > 0.32 && !s.parado) { s.som = t; J.sons.push({x: s.x, y: s.y, t, dono: s.dono.id, time: s.dono.time, r: GP.ALCANCE_SOM}); }
  }
  H.passos = H.passos.filter(s => t < s.ate);
  H.orbes = H.orbes.filter(o => !o.usado && t < o.ate);
  if (GP.passoIniciadores) GP.passoIniciadores(J, dt);
  if (GP.passoControladores) GP.passoControladores(J, dt);
  if (GP.passoSentinelas) GP.passoSentinelas(J, dt);
  H.fx = H.fx.filter(f => t - f.t < f.dur);
  /* efeitos no corpo */
  for (const e of J.ents) {
    const ef = e.ef; if (!ef) continue;
    if (ef.cura && t < ef.cura.ate && e.vivo) e.hp = Math.min(ef.cura.max, e.hp + ef.cura.porSeg * dt);
    if (ef.gear) { ef.combustivel -= dt; if (ef.combustivel <= 0 || e.cmd.atirar) ef.gear = false; }
    if (ef.dash && t >= ef.dash.ate) {
      if (ef.dash.img) GP._fx(J, {x: ef.dash.x0, y: ef.dash.y0, ang: Math.atan2(e.y - ef.dash.y0, e.x - ef.dash.x0), img: ef.dash.img, ag: e.agente, rastro: Math.hypot(e.x - ef.dash.x0, e.y - ef.dash.y0), dur: 0.35});
      ef.dash = null;
    }
    if (ef.ancora && t > ef.ancora.ate) ef.ancora = null;
    if (ef.portal && t > ef.portal.ate) ef.portal = null;
  }
};

GP._distSeg = function (x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2));
  return Math.hypot(x - a[0] - dx * k, y - a[1] - dy * k);
};
GP._cruza = function (ax, ay, bx, by, c, d) {
  const r = (p, q, s) => (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
  const A = [ax, ay], B = [bx, by];
  return r(A, B, c) * r(A, B, d) < 0 && r(c, d, A) * r(c, d, B) < 0;
};

/* ---------- ganchos no motor ---------- */
/* a fumaça e as paredes escondem; cego não vê; invisível não é visto */
GP.vistaBloqueada = function (J, a, b) {
  const H = J.hab, t = J.t;
  if (a.ef && a.ef.cego > t) return true;
  if (b.ef && b.ef.invis > t) return true;
  if (a.ef && a.ef.miope > t && Math.hypot(a.x - b.x, a.y - b.y) > 4.5) return true;
  if (!H) return false;
  /* dentro da smoke só se enxerga de perto */
  const colado = Math.hypot(a.x - b.x, a.y - b.y) < 2.2;
  for (const ar of H.areas) if (ar.fumaca && !colado && !(ar.donoVe && a === ar.dono)) {
    const d = GP._distSeg(ar.x, ar.y, [a.x, a.y], [b.x, b.y]);
    if (d < ar.r) return true;
  }
  for (const w of H.paredes) if (w.esconde && GP._cruza(a.x, a.y, b.x, b.y, w.a, w.b)) return true;
  return false;
};
GP.multVel = function (J, e) {
  const ef = e.ef, t = J.t; if (!ef) return 1;
  let k = 1;
  if (ef.rapido && t < ef.rapido.ate) k *= ef.rapido.k;
  if (ef.gear) k *= 1.45;
  if (ef.estim > t) k *= 1.1;
  if (ef.preso > t || ef.drone) return 0;
  if (ef.lento > t) k *= 0.6;
  if (ef.conc > t) k *= 0.55;
  return k;
};
GP.erroExtra = function (e, t) {
  const ef = e.ef; if (!ef) return 0;
  let x = 0;
  if (ef.conc > t) x += 5;
  if (ef.lento > t) x += 2;
  if (ef.cego > t && e.bot) x += 12;
  return x;
};
GP.semTiro = (J, e) => !!(e.ef && (e.ef.drift > J.t || e.ef.gear || e.ef.drone));
GP.temArmaHab = (J, e) => !!(e.ef && (e.ef.facas > 0 && e.ef.facasAte > J.t || e.ef.overdrive > J.t || e.ef.furia > 0 && e.ef.furiaAte > J.t));
GP.velDash = (J, e) => (e.ef && e.ef.dash && J.t < e.ef.dash.ate) ? e.ef.dash : null;
GP.multDano = function (J, alvo) {
  const ef = alvo.ef, t = J.t; if (!ef) return 1;
  if (ef.escudoUm > t) { ef.escudoUm = 0; return 0; }
  return ef.fragil > t ? 1.3 : 1;
};
/* morreu com o Run It Back ligado: volta no marcador */
GP.antesDeMorrer = function (J, e) {
  if (GP._naoMorreClove && GP._naoMorreClove(J, e)) return true;
  const v = e.ef && e.ef.volta;
  if (!v || J.t > v.ate) return false;
  e.ef.volta = null; e.hp = 100; e.x = v.x; e.y = v.y; e.vx = e.vy = 0;
  GP._fx(J, {x: v.x, y: v.y, img: 'x_objeto', ag: 'phoenix', r: 2, dur: 0.7});
  return true;
};
/* armas das ultimates: facas da Jett e o raio do Neon */
GP.atirarHab = function (J, e) {
  const ef = e.ef, t = J.t; if (!ef) return false;
  if (GP.atirarFuria && GP.atirarFuria(J, e)) return true;
  let modo = null;
  if (ef.facas > 0 && ef.facasAte > t) modo = 'facas';
  else if (ef.overdrive > t) modo = 'raio';
  if (!modo) return false;
  const erro = (modo === 'facas' ? 0.6 : 0.5) + GP.erroExtra(e, t);
  const ang = e.ang + GP._gauss(J.rnd) * (erro / 2) * Math.PI / 180;
  const ox = e.x + Math.cos(ang) * 0.3, oy = e.y + Math.sin(ang) * 0.3, dx = Math.cos(ang), dy = Math.sin(ang);
  let tMax = GP.raio(J.m, ox, oy, ang, 80);
  if (GP.tiroEmHab) tMax = GP.tiroEmHab(J, ox, oy, dx, dy, tMax);
  let alvo = null, pA = 0;
  for (const o of J.ents) {
    if (o === e || !o.vivo || o.time === e.time) continue;
    const rx = o.x - ox, ry = o.y - oy, tt = rx * dx + ry * dy;
    if (tt <= 0 || tt >= tMax) continue;
    const pp = Math.abs(rx * dy - ry * dx);
    if (pp < o.raio) { alvo = o; tMax = tt; pA = pp; }
  }
  e.st.tiros++; e.ultimoTiro = t;
  J.tiros.push({x0: ox, y0: oy, x1: ox + dx * tMax, y1: oy + dy * tMax, t, dono: e.id, time: e.time, acertou: !!alvo, hab: modo});
  J.sons.push({x: e.x, y: e.y, t, dono: e.id, time: e.time, r: 40, tiro: true});
  if (modo === 'facas') { ef.facas--; e.proxTiro = t + 0.33; if (ef.facas <= 0) ef.facasAte = 0; }
  else e.proxTiro = t + 1 / 15;
  if (alvo) {
    const parte = pA < GP.ZONA_CABECA ? 0 : 1;
    const dano = modo === 'facas' ? (parte === 0 ? 150 : 50) : (parte === 0 ? 54 : 18);
    GP._dano(J, e, alvo, dano, parte, {nome: modo === 'facas' ? 'Blade Storm' : 'Overdrive'});
  }
  return true;
};
GP.posTiro = function (J, e) { if (e.ef && (e.ef.empress > J.t || e.ef.estim > J.t)) e.proxTiro = J.t + (e.proxTiro - J.t) / 1.3; };
/* Contingency do Iso segura bala */
GP.tiroEmHab = function (J, ox, oy, dx, dy, tMax) {
  const H = J.hab; if (!H) return tMax;
  if (GP.tiroEmBolha) tMax = GP.tiroEmBolha(J, ox, oy, dx, dy, tMax);
  for (const w of H.paredes) if (w.seguraBala) {
    const bx = ox + dx * tMax, by = oy + dy * tMax;
    if (!GP._cruza(ox, oy, bx, by, w.a, w.b)) continue;
    /* ponto de cruzamento */
    const ex = w.b[0] - w.a[0], ey = w.b[1] - w.a[1], den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const tt = ((w.a[0] - ox) * ey - (w.a[1] - oy) * ex) / den;
    if (tt > 0 && tt < tMax) tMax = tt;
  }
  return tMax;
};

/* ---------- desenho ---------- */
GP._imgHab = function (ag, nome) {
  const man = GP.manifesto ? GP.manifesto().habilidades || {} : {};
  const e = (man[ag] || {})[nome];
  const im = e && GP.imagem && GP.imagem(e.src);
  return im ? {im, e} : null;
};
GP.desenharHabilidades = function (g, J) {
  const H = J.hab; if (!H) return;
  const t = J.t;
  const spr = (r, x, y, ang, w, h, alfa) => { g.save(); g.translate(x, y); g.rotate(ang || 0); g.globalAlpha = alfa == null ? 1 : alfa; g.drawImage(r.im, -w / 2, -h / 2, w, h); g.restore(); };
  const circ = (x, y, r, cor) => { g.fillStyle = cor; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  for (const a of H.areas) {
    if (!a.r && !a.img) continue;
    const r = a.img && GP._imgHab(a.ag, a.img);
    const nasce = Math.min(1, (t - a.t0) / 0.25), some = Math.min(1, (a.ate - t) / 0.4);
    if (a.objeto) { if (r) { const w = (a.escala || 1) * 1.2; spr(r, a.x, a.y, 0, w, w * r.e.h / r.e.w); } else circ(a.x, a.y, 0.4, '#ffb347'); continue; }
    const d = (a.desenho || a.r) * 2.25;
    if (r) spr(r, a.x, a.y, a.fumaca ? t * 0.08 : (a.ang || 0), d, d * r.e.h / r.e.w, (a.alfa || (a.fumaca ? 0.95 : 0.85)) * nasce * some);
    else circ(a.x, a.y, a.r, a.fumaca ? 'rgba(220,230,240,.85)' : 'rgba(255,140,60,.4)');
  }
  for (const w of H.paredes) {
    if (w.semDesenho) continue;
    const r = w.img && GP._imgHab(w.ag, w.img), L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]), ang = Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
    const some = Math.min(1, (w.ate - t) / 0.4);
    g.save(); g.translate(w.a[0], w.a[1]); g.rotate(ang); g.globalAlpha = some;
    if (r && w.estica) { const h = w.alto || 0.5; g.drawImage(r.im, 0, -h / 2, L, h); }
    else if (r) {
      const h = w.alto || 1, iw = r.im.naturalWidth || r.im.width, ih = r.im.naturalHeight || r.im.height, passo = h * iw / ih;
      for (let s = 0; s < L; s += passo) { const f = Math.min(1, (L - s) / passo); g.drawImage(r.im, 0, 0, iw * f, ih, s, -h / 2, passo * f, h); }
    } else { g.fillStyle = w.cor || 'rgba(255,120,40,.6)'; g.fillRect(0, -(w.alto || 0.6) / 2, L, w.alto || 0.6); }
    g.restore();
  }
  for (const o of H.orbes) { const r = GP._imgHab('reyna', 'q_objeto'); const pul = 1 + Math.sin(t * 6) * 0.06; if (r) spr(r, o.x, o.y, 0, 1.1 * pul, 1.1 * pul * r.e.h / r.e.w); else circ(o.x, o.y, 0.45, '#b04bff'); }
  for (const s of H.passos) {
    const r = GP._imgHab('yoru', 'c_rastro');
    for (let i = 1; i < s.rastro.length; i++) {
      const [x0, y0] = s.rastro[i - 1], [x1, y1] = s.rastro[i];
      const al = 0.35 + 0.65 * i / s.rastro.length;
      if (r) spr(r, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), 0.9, 0.9 * r.e.h / r.e.w * 4, al * 0.8);
    }
  }
  for (const rb of H.robos) { const r = GP._imgHab('raze', 'c_objeto'); if (r) spr(r, rb.x, rb.y, rb.ang, 1.1, 1.1 * r.e.h / r.e.w); else circ(rb.x, rb.y, 0.4, '#ff8a2a'); }
  for (const p of H.proj) {
    const r = p.img && GP._imgHab(p.ag, p.img);
    if (r) { const w = p.escala || 0.9; spr(r, p.x, p.y, p.ang, w, w * r.e.h / r.e.w); } else circ(p.x, p.y, 0.22, '#ffffff');
  }
  for (const e of J.ents) {
    const ef = e.ef; if (!ef || !e.vivo) continue;
    if (ef.portal) { const r = GP._imgHab('yoru', 'e_objeto'); if (r) spr(r, ef.portal.x, ef.portal.y, 0, 1.2, 1.2 * r.e.h / r.e.w, 0.9); }
    if (ef.ancora) { const r = GP._imgHab('waylay', 'e_objeto'); if (r) spr(r, ef.ancora.x, ef.ancora.y, t, 1, r.e.h / r.e.w); }
    if (ef.volta && t < ef.volta.ate) { const r = GP._imgHab('phoenix', 'x_objeto'); if (r) spr(r, ef.volta.x, ef.volta.y, 0, 1.8, 1.8 * r.e.h / r.e.w, 0.85); }
    if (e === J.eu || e._visivel) {
      if (ef.empress > t) { const r = GP._imgHab('reyna', 'x_area'); if (r) spr(r, e.x, e.y, 0, 2, 2 * r.e.h / r.e.w, 0.55); }
      if (ef.drift > t && e === J.eu) { const r = GP._imgHab('yoru', 'x_area'); if (r) spr(r, e.x, e.y, t, 2.2, 2.2 * r.e.h / r.e.w, 0.6); }
      if (ef.escudoUm > t) { const r = GP._imgHab('iso', 'e_area'); if (r) spr(r, e.x, e.y, 0, 2, 2 * r.e.h / r.e.w, 0.55); else circ(e.x, e.y, 0.8, 'rgba(170,120,255,.25)'); }
      if (ef.gear) { const r = GP._imgHab('neon', 'e_rastro'); const a = Math.atan2(e.vy, e.vx); if (r && Math.hypot(e.vx, e.vy) > 2) spr(r, e.x - Math.cos(a) * 1.4, e.y - Math.sin(a) * 1.4, a, 2.6, 2.6 * r.e.h / r.e.w, 0.8); }
    }
  }
  for (const f of H.fx) {
    const k = (t - f.t) / f.dur, r = GP._imgHab(f.ag, f.img);
    if (!r) continue;
    if (f.cone) { g.save(); g.translate(f.x, f.y); g.rotate(f.ang); g.globalAlpha = 1 - k; const h = f.cone * 0.7; g.drawImage(r.im, 0, -h / 2, f.cone, h); g.restore(); }
    else if (f.rastro) { g.save(); g.translate(f.x, f.y); g.rotate(f.ang); g.globalAlpha = 1 - k; const h = 1.1; g.drawImage(r.im, 0, -h / 2, Math.max(1, f.rastro), h); g.restore(); }
    else { const d = f.r * 2 * (0.7 + 0.5 * k); spr(r, f.x, f.y, 0, d, d * r.e.h / r.e.w, 1 - k * k); }
  }
  if (GP.desenharIniciadores) GP.desenharIniciadores(g, J);
  if (GP.desenharControladores) GP.desenharControladores(g, J);
  if (GP.desenharSentinelas) GP.desenharSentinelas(g, J);
  /* rastros das armas das ultimates */
  for (const tr of J.tiros) if (tr.hab === 'raio') {
    const r = GP._imgHab('neon', 'x_rastro'); if (!r) continue;
    const L = Math.hypot(tr.x1 - tr.x0, tr.y1 - tr.y0);
    g.save(); g.translate(tr.x0, tr.y0); g.rotate(Math.atan2(tr.y1 - tr.y0, tr.x1 - tr.x0)); g.globalAlpha = 1 - (t - tr.t) / 0.25; g.drawImage(r.im, 0, -0.35, L, 0.7); g.restore();
  } else if (tr.hab === 'facas') {
    const r = GP._imgHab('jett', 'x_projetil'); if (!r) continue;
    const k = Math.min(1, (t - tr.t) / 0.12), x = tr.x0 + (tr.x1 - tr.x0) * k, y = tr.y0 + (tr.y1 - tr.y0) * k;
    if (k < 1) spr(r, x, y, Math.atan2(tr.y1 - tr.y0, tr.x1 - tr.x0), 1, r.e.h / r.e.w);
  }
};
/* o que cobre a tela de quem joga: clarão (cegueira) */
GP.desenharTelaHab = function (g, J, W, H) {
  const ef = J.eu.ef; if (!ef) return;
  if (ef.cego > J.t) {
    const resta = ef.cego - J.t, a = Math.min(1, resta / Math.max(0.3, (ef.cegoDur || 1) * 0.5));
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,255,255,${0.97 * a})`; g.fillRect(0, 0, W, H);
  }
  if (GP.desenharTelaIni) GP.desenharTelaIni(g, J, W, H);
  if (ef.conc > J.t) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(80,140,255,.12)'; g.fillRect(0, 0, W, H); }
};
