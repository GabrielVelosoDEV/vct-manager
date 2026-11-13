/* ============================================================
   HABILIDADES · CONTROLADORES
   O que eles trazem de novo:
     fumaça no cursor   cai onde se mira, atrás da parede também
     decaimento         tira vida mas não mata (Viper, Clove, Fade)
     bolha que segura bala (Cove do Harbor)
     puxão             o poço da Astra arrasta para o centro
     estímulo          o sinalizador do Brimstone: mais rápido e atira mais
     teleporte         Omen (passo curto e ultimate pelo mapa)
     voltar da morte   ultimate da Clove: precisa de um abate em 10 s
   Simplificações: a Astra põe a estrela direto no cursor (sem a forma
   astral); a Viper não tem combustível, as nuvens duram um tempo fixo.
   ============================================================ */
'use strict';

/* um ponto de chão no cursor (até max m), atravessando parede */
GP._noCursor = function (J, e, max) {
  const c = e.cmd.mira || {x: e.x + Math.cos(e.ang) * max, y: e.y + Math.sin(e.ang) * max};
  let dx = c.x - e.x, dy = c.y - e.y; const d = Math.hypot(dx, dy);
  if (d > max) { dx *= max / d; dy *= max / d; }
  let x = e.x + dx, y = e.y + dy;
  if (GP.solidoEm(J.m, x, y)) { const i = GP._navPerto(J.m, x, y), n = J.m.nav; if (i >= 0) { x = (i % n.W + 0.5) * n.passo; y = ((i / n.W | 0) + 0.5) * n.passo; } }
  return {x, y};
};
GP._decai = (J, de, o, dano, nome) => { const d = Math.min(dano, o.hp - 1); if (d > 0) GP._habDano(J, de, o, d, nome); };
GP._fumaca = (J, e, p, r, dur, img, ag, extra) => GP._area(J, {x: p.x, y: p.y, r, ate: J.t + dur, fumaca: true, img, ag, dono: e, ...extra});
/* parede que atravessa o mapa (Toxic Screen, Cosmic Divide, High Tide) */
GP._paredeReta = (J, e, ini, ang, L, o) => GP._parede(J, {a: [ini.x, ini.y], b: [ini.x + Math.cos(ang) * L, ini.y + Math.sin(ang) * L], dono: e, ...o});

Object.assign(GP.HABS, {
  brimstone: {
    c: {nome: 'Stim Beacon', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 8); GP._area(J, {x: p.x, y: p.y, r: 6, ate: J.t + 12, estimulo: true, dono: e, img: 'c_area', ag: 'brimstone', alfa: 0.55}); }},
    q: {nome: 'Incendiary', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'q_projetil', ag: 'brimstone', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3, ate: J.t + 7, dps: 60, dono: e, img: 'q_area', ag: 'brimstone', nome: 'Incendiary'})});
    }},
    e: {nome: 'Sky Smoke', cargas: 3, usar(J, e) { GP._fumaca(J, e, GP._noCursor(J, e, 50), 3.4, 16, 'e_area', 'brimstone'); }},
    x: {nome: 'Orbital Strike', cargas: 1, usar(J, e) {
      const p = GP._noCursor(J, e, 60);
      GP._area(J, {x: p.x, y: p.y, r: 4.5, ate: J.t + 4, dps: 0, dono: e, img: 'x_area', ag: 'brimstone', alfa: 0.4, orbital: J.t + 1.2, nome: 'Orbital Strike'});
    }},
  },
  viper: {
    c: {nome: 'Snake Bite', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'c_projetil', ag: 'viper', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 2.6, ate: J.t + 6.5, dps: 24, fragiliza: true, dono: e, img: 'c_area', ag: 'viper', nome: 'Snake Bite'})});
    }},
    q: {nome: 'Poison Cloud', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 16);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'q_objeto', ag: 'viper', escala: 0.8, aoParar: (J, p) => {
        GP._area(J, {x: p.x, y: p.y, r: 0.5, ate: J.t + 15, objeto: true, img: 'q_objeto', ag: 'viper', escala: 0.9});
        GP._fumaca(J, e, p, 3.3, 15, 'q_area', 'viper', {decai: 10, nome: 'Poison Cloud'});
      }});
    }},
    e: {nome: 'Toxic Screen', cargas: 1, usar(J, e) {
      GP._paredeReta(J, e, {x: e.x + Math.cos(e.ang) * 1, y: e.y + Math.sin(e.ang) * 1}, e.ang, 40, {ate: J.t + 15, esconde: true, decai: 10, img: 'e_parede', ag: 'viper', alto: 1.3, nome: 'Toxic Screen'});
    }},
    x: {nome: "Viper's Pit", cargas: 1, usar(J, e) { GP._fumaca(J, e, {x: e.x, y: e.y}, 9, 18, 'x_area', 'viper', {decai: 10, miopeDentro: true, donoVe: true, nome: "Viper's Pit"}); }},
  },
  omen: {
    c: {nome: 'Shrouded Step', cargas: 2, usar(J, e) {
      const p = GP._noCursor(J, e, 12);
      GP._area(J, {x: p.x, y: p.y, r: 1.2, ate: J.t + 0.9, img: 'c_area', ag: 'omen', aoFim: J => { if (e.vivo) { e.x = p.x; e.y = p.y; e.vx = e.vy = 0; GP._empurrar(J.m, e, e.raioCol); } }});
      GP._prender(J, e, 0.9);
      J.sons.push({x: p.x, y: p.y, t: J.t, dono: e.id, time: e.time, r: 20});
    }},
    q: {nome: 'Paranoia', cargas: 1, usar(J, e) {
      const ang = e.ang, x = e.x, y = e.y, L = 30, a = [x, y], b = [x + Math.cos(ang) * L, y + Math.sin(ang) * L];
      GP._fx(J, {x, y, ang, img: 'q_rastro', ag: 'omen', rastro: L, dur: 1.2});
      GP._area(J, {x, y, r: 0, ate: J.t + 0.4, aoFim: J => {
        for (const o of GP._inimigosDe(J, e)) if (GP._distSeg(o.x, o.y, a, b) < 1.8) { const ef = GP._ef(o); ef.cego = Math.max(ef.cego || 0, J.t + 2); ef.cegoDur = 2; }
      }});
    }},
    e: {nome: 'Dark Cover', cargas: 2, usar(J, e) { GP._fumaca(J, e, GP._noCursor(J, e, 40), 3.2, 15, 'e_area', 'omen'); }},
    x: {nome: 'From the Shadows', cargas: 1, usar(J, e) {
      const p = GP._noCursor(J, e, 400);
      GP._prender(J, e, 3); GP._ef(e).supr = J.t + 3;
      GP._area(J, {x: p.x, y: p.y, r: 1.6, ate: J.t + 3, img: 'x_area', ag: 'omen', aoFim: J => { if (e.vivo) { e.x = p.x; e.y = p.y; e.vx = e.vy = 0; GP._empurrar(J.m, e, e.raioCol); } }});
      J.sons.push({x: p.x, y: p.y, t: J.t, dono: e.id, time: e.time, r: 40, tiro: true});
    }},
  },
  astra: {
    c: {nome: 'Gravity Well', cargas: 1, usar(J, e) {
      const p = GP._noCursor(J, e, 40);
      GP._area(J, {x: p.x, y: p.y, r: 0.5, ate: J.t + 0.7, objeto: true, img: 'c_objeto', ag: 'astra', escala: 1.2, aoFim: J => {
        GP._area(J, {x: p.x, y: p.y, r: 4.5, ate: J.t + 2.5, puxa: 3.5, dono: e, img: 'c_area', ag: 'astra', aoFim: J => {
          for (const o of GP._noRaio(J, e, p.x, p.y, 4.5, false)) GP._ef(o).fragil = J.t + 4;
        }});
      }});
    }},
    q: {nome: 'Nova Pulse', cargas: 1, usar(J, e) {
      const p = GP._noCursor(J, e, 40);
      GP._area(J, {x: p.x, y: p.y, r: 0.5, ate: J.t + 1, objeto: true, img: 'c_objeto', ag: 'astra', escala: 1.2, aoFim: J => {
        GP._fx(J, {x: p.x, y: p.y, img: 'q_area', ag: 'astra', r: 4.5, dur: 0.6});
        for (const o of GP._noRaio(J, e, p.x, p.y, 4.5, false)) GP._concussao(J, o, 3.5);
      }});
    }},
    e: {nome: 'Nebula', cargas: 2, usar(J, e) { GP._fumaca(J, e, GP._noCursor(J, e, 40), 3.4, 14, 'e_area', 'astra'); }},
    x: {nome: 'Cosmic Divide', cargas: 1, usar(J, e) {
      const p = GP._noCursor(J, e, 20), L = 70, ang = e.ang;
      GP._paredeReta(J, e, {x: p.x - Math.cos(ang) * L / 2, y: p.y - Math.sin(ang) * L / 2}, ang, L, {ate: J.t + 20, esconde: true, seguraBala: true, img: 'x_parede', ag: 'astra', alto: 1.2, nome: 'Cosmic Divide'});
    }},
  },
  harbor: {
    c: {nome: 'Cascade', cargas: 1, usar(J, e) {
      const nx = -Math.sin(e.ang), ny = Math.cos(e.ang), cx = e.x + Math.cos(e.ang), cy = e.y + Math.sin(e.ang);
      GP._parede(J, {a: [cx - nx * 3.5, cy - ny * 3.5], b: [cx + nx * 3.5, cy + ny * 3.5], ate: J.t + 7, esconde: true, lentoToque: true,
        anda: {vx: Math.cos(e.ang) * 6, vy: Math.sin(e.ang) * 6, ate: J.t + 2.2}, dono: e, img: 'c_parede', ag: 'harbor', alto: 1.1, nome: 'Cascade'});
    }},
    q: {nome: 'Cove', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 20);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: null, aoParar: (J, p) => GP._fumaca(J, e, p, 3.2, 12, 'q_area', 'harbor', {seguraBala: true, hpBolha: 500})});
    }},
    e: {nome: 'High Tide', cargas: 1, usar(J, e) {
      GP._paredeReta(J, e, {x: e.x + Math.cos(e.ang), y: e.y + Math.sin(e.ang)}, e.ang, 32, {ate: J.t + 14, esconde: true, lentoToque: true, img: 'e_parede', ag: 'harbor', alto: 1.3, nome: 'High Tide'});
    }},
    x: {nome: 'Reckoning', cargas: 1, usar(J, e) {
      for (let onda = 0; onda < 3; onda++) GP._area(J, {x: e.x, y: e.y, r: 0, ate: J.t + 0.6 + onda * 1.2, aoFim: J => {
        for (const o of GP._noRaio(J, e, e.x, e.y, 28, false)) {
          const x = o.x, y = o.y;
          GP._area(J, {x, y, r: 1.8, ate: J.t + 1, img: 'x_area', ag: 'harbor', alfa: 0.6, aoFim: J => { for (const v of GP._noRaio(J, e, x, y, 1.8, false)) GP._concussao(J, v, 3); }});
        }
      }});
    }},
  },
  clove: {
    c: {nome: 'Pick-Me-Up', cargas: 1, precisa: 'abate', usar(J, e) {
      GP._fx(J, {x: e.x, y: e.y, img: 'c_clarao', ag: 'clove', r: 1.8, dur: 0.6});
      GP._ef(e).cura = {ate: J.t + 1, porSeg: 100, max: 200}; GP._ef(e).rapido = {ate: J.t + 6, k: 1.15};
    }},
    q: {nome: 'Meddle', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'q_projetil', ag: 'clove', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3.2, ate: J.t + 0.8, img: 'q_area', ag: 'clove', aoFim: J => {
        for (const o of GP._noRaio(J, e, p.x, p.y, 3.2, false)) GP._decai(J, e, o, 50, 'Meddle');
      }})});
    }},
    e: {nome: 'Ruse', cargas: 2, usar(J, e) { GP._fumaca(J, e, GP._noCursor(J, e, 40), 3.2, 14, 'e_area', 'clove'); }},
    x: {nome: 'Not Dead Yet', cargas: 1, usar(J, e) { GP._ef(e).naoMorta = J.t + 40; }},
  },
  miks: {
    c: {nome: 'M-Pulse', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 16);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'c_objeto', ag: 'miks', escala: 0.8, aoParar: (J, p) => GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.8], img: 'c_objeto', ag: 'miks', objeto: true, escala: 0.9, resto: 0.1, aoPulso: J => {
        GP._fx(J, {x: p.x, y: p.y, img: 'c_area', ag: 'miks', r: 5, dur: 0.6});
        GP._fx(J, {x: p.x, y: p.y, img: 'c_area_cura', ag: 'miks', r: 4, dur: 0.8});
        for (const o of GP._noRaio(J, e, p.x, p.y, 5, true)) GP._concussao(J, o, 2.5);
        for (const o of J.ents) if (o.vivo && o.time === e.time && Math.hypot(o.x - p.x, o.y - p.y) < 5) o.hp = Math.min(100, o.hp + 30);
      }})});
    }},
    q: {nome: 'Harmonize', cargas: 1, usar(J, e) { GP._fx(J, {x: e.x, y: e.y, img: 'q_clarao', ag: 'miks', r: 1.6, dur: 0.6}); const ef = GP._ef(e); ef.estim = J.t + 10; ef.harmonia = true; }},
    e: {nome: 'Waveform', cargas: 2, usar(J, e) { GP._fumaca(J, e, GP._noCursor(J, e, 35), 3.2, 14, 'e_area', 'miks'); }},
    x: {nome: 'Bassquake', cargas: 1, usar(J, e) {
      const x = e.x, y = e.y, ang = e.ang;
      GP._prender(J, e, 0.8);
      GP._area(J, {x, y, r: 0, ate: J.t + 0.8, aoFim: J => {
        GP._hab(J).fx.push({x, y, ang, img: 'x_cone', ag: 'miks', cone: 26, dur: 1.2, t: J.t});
        for (const o of GP._noLeque(J, e, x, y, ang, 26, 0.5)) {
          GP._concussao(J, o, 3); GP._ef(o).lento = J.t + 4;
          GP._arrancar(J, o, Math.atan2(o.y - y, o.x - x), 4, 0.3);
        }
      }});
    }},
  },
});

/* ---------- a cada passo ---------- */
GP.passoControladores = function (J, dt) {
  const H = GP._hab(J), m = J.m, t = J.t;
  for (const a of H.areas) {
    if (a.orbital && t >= a.orbital) a.dps = 200;
    for (const o of J.ents) {
      if (!o.vivo || Math.hypot(o.x - a.x, o.y - a.y) >= a.r) continue;
      const inimigo = a.dono && o.time !== a.dono.time, ef = GP._ef(o);
      if (a.decai && inimigo) { o._decai = (o._decai || 0) + a.decai * dt; if (o._decai >= 3) { GP._decai(J, a.dono, o, o._decai, a.nome); o._decai = 0; } }
      if (a.fragiliza && inimigo) ef.fragil = Math.max(ef.fragil || 0, t + 0.3);
      if (a.miopeDentro && inimigo) GP._miope(J, o, 0.3);
      if (a.estimulo && !inimigo) ef.estim = Math.max(ef.estim || 0, t + 0.3);
      if (a.puxa && inimigo) {
        const d = Math.hypot(a.x - o.x, a.y - o.y) || 1;
        GP.mover(m, o, (a.x - o.x) / d * a.puxa * dt, (a.y - o.y) / d * a.puxa * dt);
      }
    }
  }
  for (const w of H.paredes) if (w.decai || w.lentoToque) for (const o of GP._inimigosDe(J, w.dono)) {
    if (GP._distSeg(o.x, o.y, w.a, w.b) > 1) continue;
    if (w.lentoToque) GP._ef(o).lento = Math.max(GP._ef(o).lento || 0, t + 0.6);
    if (w.decai) { o._decai = (o._decai || 0) + w.decai * dt; if (o._decai >= 3) { GP._decai(J, w.dono, o, o._decai, w.nome); o._decai = 0; } }
  }
  /* Cove: a bolha quebra com tiro */
  H.areas = H.areas.filter(a => !(a.hpBolha != null && a.hpBolha <= 0));
  /* Clove voltou e precisa de um abate */
  for (const e of J.ents) {
    const ef = e.ef; if (!ef || !e.vivo) continue;
    if (ef.ultimaChance && t > ef.ultimaChance) {
      ef.ultimaChance = 0; e.hp = 0; e.vivo = false; e.st.mortes++; e._morreuEm = t;
      J.eventos.push({tipo: 'morte', t, de: null, em: e.id, arma: 'Not Dead Yet', cabeca: false});
    }
  }
};

/* abates: Clove precisa disso para a cura e para continuar viva */
GP._abateControlador = function (J, de) {
  const ef = GP._ef(de);
  ef.ultimoAbate = J.t;
  if (ef.ultimaChance) ef.ultimaChance = 0;
  if (ef.harmonia && ef.estim > J.t) ef.estim = J.t + 10;
};

/* bala na bolha do Harbor (ou que sai dela) para no contorno */
GP.tiroEmBolha = function (J, ox, oy, dx, dy, tMax) {
  const H = J.hab; if (!H) return tMax;
  for (const a of H.areas) {
    if (!a.seguraBala) continue;
    const fx = ox - a.x, fy = oy - a.y, b = fx * dx + fy * dy, c = fx * fx + fy * fy - a.r * a.r, disc = b * b - c;
    if (disc < 0) continue;
    const s = Math.sqrt(disc), t1 = -b - s, t2 = -b + s;
    const tt = t1 > 0 ? t1 : t2 > 0 ? t2 : null;
    if (tt != null && tt < tMax) { tMax = tt; a._acerto = true; if (a.hpBolha != null) a.hpBolha -= 30; }
  }
  return tMax;
};

/* Clove: morreu com a ultimate armada, volta onde caiu */
GP._naoMorreClove = function (J, e) {
  const ef = e.ef;
  if (!ef || !(ef.naoMorta > J.t)) return false;
  ef.naoMorta = 0; e.hp = 100; ef.ultimaChance = J.t + 10;
  GP._fx(J, {x: e.x, y: e.y, img: 'x_area', ag: 'clove', r: 2, dur: 1});
  return true;
};

GP.desenharControladores = function (g, J) {
  const t = J.t;
  for (const e of J.ents) {
    const ef = e.ef; if (!ef || !e.vivo || !(e === J.eu || e._visivel)) continue;
    if (ef.ultimaChance > t) { const r = GP._imgHab('clove', 'x_area'); if (r) { const d = 2.4; g.save(); g.globalAlpha = 0.6; g.translate(e.x, e.y); g.rotate(t); g.drawImage(r.im, -d / 2, -d / 2, d, d * r.e.h / r.e.w); g.restore(); } }
    if (ef.estim > t) { g.save(); g.strokeStyle = 'rgba(255,170,60,.55)'; g.lineWidth = 0.08; g.beginPath(); g.arc(e.x, e.y + 0.9, 0.85 + 0.08 * Math.sin(t * 10), 0, 7); g.stroke(); g.restore(); }
  }
};
