/* ============================================================
   HABILIDADES · SENTINELAS
   O que eles trazem de novo:
     muro sólido    parede que bloqueia andar, ver e atirar, com vida
                    (Sage, Barrier Mesh, Shear) — vira parede na grade
     objeto         coisa no chão com vida que leva tiro (torreta, câmera,
                    alarme, Lockdown, interceptador, casulo)
     arma especial  Headhunter e Tour De Force do Chamber
     imune          Evolution do Veto limpa os efeitos ruins
   Simplificações: a Resurrection da Sage não entra (não há aliado no
   duelo); o Neural Theft revela direto, sem precisar de corpo.
   ============================================================ */
'use strict';

GP._obj = (J, o) => { const ob = {t0: J.t, tam: 1, hp: 100, ...o}; GP._hab(J).objs.push(ob); return ob; };

/* muro sólido: as células viram parede enquanto ele durar */
GP._muro = function (J, e, a, b, o) {
  const m = J.m, H = GP._hab(J), c = m.cel, esp = o.esp || 0.45;
  const w = GP._parede(J, {a, b, dono: e, esconde: true, hp: o.hp || 800, ...o, solido: true});
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  w.celulas = [];
  const x0 = Math.floor((Math.min(a[0], b[0]) - 1) / c), x1 = Math.ceil((Math.max(a[0], b[0]) + 1) / c);
  const y0 = Math.floor((Math.min(a[1], b[1]) - 1) / c), y1 = Math.ceil((Math.max(a[1], b[1]) + 1) / c);
  for (let y = Math.max(0, y0); y <= Math.min(m.H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(m.W - 1, x1); x++) {
    const i = y * m.W + x; if (m.solido[i]) continue;
    const px = (x + 0.5) * c - a[0], py = (y + 0.5) * c - a[1], t = px * ux + py * uy, n = Math.abs(-px * uy + py * ux);
    if (t >= 0 && t <= L && n <= esp) { m.solido[i] = 1; w.celulas.push(i); }
  }
  if (GP._navRefazer) GP._navRefazer(m, {a, b});
  for (const o2 of J.ents) if (o2.vivo && GP.colide(m, o2.x, o2.y, o2.raioCol)) GP._empurrar(m, o2, o2.raioCol);
  for (const o2 of J.ents) if (o2.ia) o2.ia.caminho = null;
  H.muros.push(w);
  return w;
};
GP._tirarMuro = function (J, w) {
  for (const i of w.celulas) J.m.solido[i] = 0;
  w.celulas = []; w.ate = Math.min(w.ate, J.t);
  if (GP._navRefazer) GP._navRefazer(J.m, {a: w.a, b: w.b});
  for (const o of J.ents) if (o.ia) o.ia.caminho = null;
};

/* a linha de parede a parede que passa por p, perpendicular a ang */
GP._deParedeAParede = function (m, p, ang, max) {
  const n = ang + Math.PI / 2;
  const d1 = Math.min(max, GP.raio(m, p.x, p.y, n, max)), d2 = Math.min(max, GP.raio(m, p.x, p.y, n + Math.PI, max));
  return {a: [p.x + Math.cos(n) * d1, p.y + Math.sin(n) * d1], b: [p.x - Math.cos(n) * d2, p.y - Math.sin(n) * d2]};
};

Object.assign(GP.HABS, {
  sage: {
    c: {nome: 'Barrier Orb', cargas: 1, usar(J, e) {
      const p = GP._pontoMirado(J, e, 6), n = e.ang + Math.PI / 2;
      GP._muro(J, e, [p.x - Math.cos(n) * 5, p.y - Math.sin(n) * 5], [p.x + Math.cos(n) * 5, p.y + Math.sin(n) * 5],
        {ate: J.t + 30, hp: 800, img: 'c_parede', ag: 'sage', alto: 1.1, nome: 'Barrier Orb'});
    }},
    q: {nome: 'Slow Orb', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 20);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'q_projetil', ag: 'sage', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3.6, ate: J.t + 7, lento: true, dono: e, img: 'q_area', ag: 'sage', alfa: 0.7})});
    }},
    e: {nome: 'Healing Orb', cargas: 1, usar(J, e) { GP._fx(J, {x: e.x, y: e.y, img: 'e_clarao', ag: 'sage', r: 1.4, dur: 0.7}); GP._ef(e).cura = {ate: J.t + 5, porSeg: 12, max: 100}; }},
    x: {nome: 'Resurrection', cargas: 0, semDuelo: true, usar() {}},
  },
  cypher: {
    c: {nome: 'Trapwire', cargas: 2, usar(J, e) {
      const p = GP._pontoMirado(J, e, 10), s = GP._deParedeAParede(J.m, p, e.ang, 8);
      GP._parede(J, {a: s.a, b: s.b, dono: e, ate: J.t + 999, fio: true, estica: true, img: 'c_parede', ag: 'cypher', alto: 0.5});
    }},
    q: {nome: 'Cyber Cage', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'q_objeto', ag: 'cypher', escala: 0.6, aoParar: (J, p) => GP._fumaca(J, e, p, 2.7, 7, 'q_area', 'cypher')});
    }},
    e: {nome: 'Spycam', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 25); GP._obj(J, {tipo: 'camera', x: p.x, y: p.y, ang: e.ang + Math.PI, dono: e, hp: 50, img: 'e_objeto', ag: 'cypher', tam: 0.9}); }},
    x: {nome: 'Neural Theft', cargas: 1, usar(J, e) {
      GP._pulsos(J, {x: e.x, y: e.y, pulsos: [0.5, 3], aoPulso: J => { for (const o of GP._inimigosDe(J, e)) { GP._revelar(J, o, 2.5); GP._fx(J, {x: o.x, y: o.y, img: 'x_clarao', ag: 'cypher', r: 2, dur: 0.8}); } }});
    }},
  },
  killjoy: {
    c: {nome: 'Nanoswarm', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'c_objeto', ag: 'killjoy', escala: 0.5, aoParar: (J, p) => GP._obj(J, {tipo: 'enxame', x: p.x, y: p.y, dono: e, hp: 20, img: 'c_objeto', ag: 'killjoy', tam: 0.7, escondido: true})});
    }},
    q: {nome: 'Alarmbot', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 8); GP._obj(J, {tipo: 'alarme', x: p.x, y: p.y, ang: e.ang, dono: e, hp: 60, img: 'q_objeto', ag: 'killjoy', tam: 0.9}); }},
    e: {nome: 'Turret', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 6); GP._obj(J, {tipo: 'torreta', x: p.x, y: p.y, ang: e.ang, base: e.ang, dono: e, hp: 125, img: 'e_objeto', ag: 'killjoy', tam: 1.1}); }},
    x: {nome: 'Lockdown', cargas: 1, usar(J, e) { GP._obj(J, {tipo: 'lockdown', x: e.x + Math.cos(e.ang) * 0.8, y: e.y + Math.sin(e.ang) * 0.8, dono: e, hp: 150, img: 'x_objeto', ag: 'killjoy', tam: 1.4, dispara: J.t + 13}); }},
  },
  chamber: {
    c: {nome: 'Trademark', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 10); GP._obj(J, {tipo: 'marca', x: p.x, y: p.y, dono: e, hp: 20, img: 'c_objeto', ag: 'chamber', tam: 0.8}); }},
    q: {nome: 'Headhunter', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.hh = 8; ef.hhOn = true; }},
    e: {nome: 'Rendezvous', cargas: 1, usar(J, e) { GP._ef(e).ancoraCh = {x: e.x, y: e.y}; }},
    x: {nome: 'Tour De Force', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.tdf = 5; ef.tdfOn = true; ef.hhOn = false; }},
  },
  deadlock: {
    c: {nome: 'GravNet', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'c_projetil', ag: 'deadlock', aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'c_area', ag: 'deadlock', r: 3.5, dur: 1.2});
        for (const o of GP._noRaio(J, e, p.x, p.y, 3.5, true)) GP._ef(o).lento = J.t + 5;
      }});
    }},
    q: {nome: 'Sonic Sensor', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 8); GP._obj(J, {tipo: 'sensor', x: p.x, y: p.y, dono: e, hp: 80, img: 'q_objeto', ag: 'deadlock', tam: 0.8}); }},
    e: {nome: 'Barrier Mesh', cargas: 1, usar(J, e) {
      const p = GP._pontoMirado(J, e, 5), r = 3.3, o = {ate: J.t + 30, hp: 400, semDesenho: true, nome: 'Barrier Mesh'};
      for (const a of [e.ang + Math.PI / 4, e.ang - Math.PI / 4]) GP._muro(J, e, [p.x - Math.cos(a) * r, p.y - Math.sin(a) * r], [p.x + Math.cos(a) * r, p.y + Math.sin(a) * r], o);
      GP._obj(J, {tipo: 'malha', x: p.x, y: p.y, ang: e.ang + Math.PI / 4, dono: e, hp: 9999, img: 'e_objeto', ag: 'deadlock', tam: r * 2, ate: J.t + 30});
    }},
    x: {nome: 'Annihilation', cargas: 1, usar(J, e) {
      GP._lancar(J, e, {vel: 30, alcance: 40, acertaGente: true, img: 'x_rastro', ag: 'deadlock', escala: 2.5, aoParar: (J, p) => {
        const o = p.acertou; if (!o) return;
        GP._prender(J, o, 7); GP._suprimir(J, o, 7); GP._ef(o).jam = J.t + 7;
        GP._obj(J, {tipo: 'casulo', x: o.x, y: o.y, dono: e, preso: o, hp: 150, img: 'x_objeto', ag: 'deadlock', tam: 1.5, mata: J.t + 7});
      }});
    }},
  },
  vyse: {
    c: {nome: 'Razorvine', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: null, aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 3.2, ate: J.t + 10, navalha: true, dono: e, img: 'c_area', ag: 'vyse', alfa: 0.8})});
    }},
    q: {nome: 'Shear', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 12); GP._obj(J, {tipo: 'shear', x: p.x, y: p.y, ang: e.ang, dono: e, hp: 9999, tam: 0, escondido: true}); }},
    e: {nome: 'Arc Rose', cargas: 2, usar(J, e) { const p = GP._pontoMirado(J, e, 14); GP._obj(J, {tipo: 'rosa', x: p.x, y: p.y, dono: e, hp: 30, img: 'e_objeto', ag: 'vyse', tam: 0.8}); }},
    x: {nome: 'Steel Garden', cargas: 1, usar(J, e) {
      const x = e.x, y = e.y;
      GP._area(J, {x, y, r: 16, ate: J.t + 2.5, img: 'x_area', ag: 'vyse', alfa: 0.35, desenho: 9, aoFim: J => {
        GP._area(J, {x, y, r: 16, ate: J.t + 8, img: 'x_area', ag: 'vyse', alfa: 0.55, desenho: 9});
        for (const o of GP._noRaio(J, e, x, y, 16, false)) GP._ef(o).jam = J.t + 8;
      }});
    }},
  },
  veto: {
    c: {nome: 'Crosscut', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 20); GP._ef(e).corte = {x: p.x, y: p.y}; }},
    q: {nome: 'Chokehold', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'q_projetil', ag: 'veto', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 2.8, ate: J.t + 1.2, img: 'q_area', ag: 'veto', aoFim: J => {
        for (const o of GP._noRaio(J, e, p.x, p.y, 2.8, true)) { GP._prender(J, o, 2.5); GP._decai(J, e, o, 30, 'Chokehold'); }
      }})});
    }},
    e: {nome: 'Interceptor', cargas: 1, usar(J, e) { const p = GP._pontoMirado(J, e, 10); GP._obj(J, {tipo: 'interceptor', x: p.x, y: p.y, dono: e, hp: 100, img: 'e_objeto', ag: 'veto', tam: 0.9}); }},
    x: {nome: 'Evolution', cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.imune = J.t + 60; ef.estim = J.t + 60; GP._fx(J, {x: e.x, y: e.y, img: 'x_area', ag: 'veto', r: 2, dur: 0.8}); }},
  },
});

/* ---------- segundo toque ---------- */
{
  const ini = GP._segundoToqueIni;
  GP._segundoToqueIni = function (J, e, k) {
    const ef = GP._ef(e), H = GP._hab(J);
    if (e.agente === 'killjoy' && k === 'c') {
      const enx = H.objs.filter(o => o.tipo === 'enxame' && o.dono === e && !o.ativo);
      if (enx.length) {
        for (const o of enx) { o.ativo = true; o.fim = true; GP._area(J, {x: o.x, y: o.y, r: 2.6, ate: J.t + 4, dps: 45, dono: e, img: 'c_area', ag: 'killjoy', nome: 'Nanoswarm'}); }
        return true;
      }
    }
    if (e.agente === 'chamber' && k === 'q' && ef.hh > 0) { ef.hhOn = !ef.hhOn; if (ef.hhOn) ef.tdfOn = false; return true; }
    if (e.agente === 'chamber' && k === 'x' && ef.tdf > 0) { ef.tdfOn = !ef.tdfOn; if (ef.tdfOn) ef.hhOn = false; return true; }
    if (e.agente === 'chamber' && k === 'e' && ef.ancoraCh) {
      const a = ef.ancoraCh;
      if (Math.hypot(a.x - e.x, a.y - e.y) <= 15) { GP._fx(J, {x: e.x, y: e.y, img: 'c_area', ag: 'chamber', r: 1.2, dur: 0.4}); e.x = a.x; e.y = a.y; e.vx = e.vy = 0; ef.ancoraCh = null; }
      return true;
    }
    if (e.agente === 'veto' && k === 'c' && ef.corte) {
      const a = ef.corte;
      if (Math.hypot(a.x - e.x, a.y - e.y) <= 30) { GP._fx(J, {x: e.x, y: e.y, img: 'c_objeto', ag: 'veto', r: 1.2, dur: 0.4}); e.x = a.x; e.y = a.y; e.vx = e.vy = 0; GP._empurrar(J.m, e, e.raioCol); ef.corte = null; }
      return true;
    }
    if (e.agente === 'vyse' && k === 'e') {
      const rosa = H.objs.find(o => o.tipo === 'rosa' && o.dono === e);
      if (rosa) {
        rosa.fim = true; GP._clarao(J, e, rosa.x, rosa.y, 1.6); GP._fx(J, {x: rosa.x, y: rosa.y, img: 'e_clarao', ag: 'vyse', r: 2.4, dur: 0.5});
        return true;
      }
    }
    return ini ? ini(J, e, k) : false;
  };
}

/* ---------- a cada passo ---------- */
GP.passoSentinelas = function (J, dt) {
  const H = GP._hab(J), m = J.m, t = J.t;
  /* muros: acabou o tempo ou a vida, sai da grade */
  for (const w of H.muros) if ((w.hp <= 0 || t >= w.ate) && w.celulas.length) GP._tirarMuro(J, w);
  H.muros = H.muros.filter(w => w.celulas.length);
  /* fios do Cypher */
  for (const w of H.paredes) if (w.fio) for (const o of GP._inimigosDe(J, w.dono)) {
    if (GP._distSeg(o.x, o.y, w.a, w.b) > 0.5) continue;
    GP._prender(J, o, 3); GP._revelar(J, o, 3); GP._ef(o).conc = t + 4.5; w.ate = t;
    J.sons.push({x: o.x, y: o.y, t, dono: w.dono.id, time: w.dono.time, r: 40, tiro: true});
  }
  /* Razorvine: corta quem anda dentro */
  for (const a of H.areas) if (a.navalha) for (const o of GP._noRaio(J, a.dono, a.x, a.y, a.r, false)) {
    GP._ef(o).lento = Math.max(GP._ef(o).lento || 0, t + 0.3);
    if (Math.hypot(o.vx, o.vy) > 1.5) { o._navalha = (o._navalha || 0) + 25 * dt; if (o._navalha >= 5) { GP._habDano(J, a.dono, o, o._navalha, 'Razorvine'); o._navalha = 0; } }
  }
  for (const ob of H.objs) {
    if (ob.hp <= 0 || (ob.ate && t >= ob.ate)) { ob.fim = true; if (ob.tipo === 'casulo' && ob.preso) { const ef = GP._ef(ob.preso); ef.preso = ef.supr = ef.jam = 0; } continue; }
    const ini = GP._inimigosDe(J, ob.dono), ve = o => Math.hypot(o.x - ob.x, o.y - ob.y) < 30 && GP.linhaLivre(m, ob.x, ob.y, o.x, o.y);
    if (ob.tipo === 'camera') for (const o of ini) if (ve(o)) GP._revelar(J, o, 0.3);
    if (ob.tipo === 'torreta') {
      const alvo = ini.find(o => ve(o) && Math.abs(GP.angDif(ob.base, Math.atan2(o.y - ob.y, o.x - ob.x))) < Math.PI / 2);
      if (alvo) {
        ob.ang = Math.atan2(alvo.y - ob.y, alvo.x - ob.x);
        if (!ob.viuEm) ob.viuEm = t;
        if (t - ob.viuEm > 0.5 && t - (ob.tiro || 0) > 0.2) {
          ob.tiro = t;
          const err = (J.rnd() - 0.5) * 0.12, a = ob.ang + err, d = Math.hypot(alvo.x - ob.x, alvo.y - ob.y);
          const acerta = Math.abs(Math.sin(err)) * d < alvo.raio;
          J.tiros.push({x0: ob.x, y0: ob.y, x1: ob.x + Math.cos(a) * d, y1: ob.y + Math.sin(a) * d, t, dono: ob.dono.id, time: ob.dono.time, acertou: acerta});
          J.sons.push({x: ob.x, y: ob.y, t, dono: ob.dono.id, time: ob.dono.time, r: 30, tiro: true});
          if (acerta) { GP._habDano(J, ob.dono, alvo, 9, 'Turret'); GP._ef(alvo).lento = Math.max(GP._ef(alvo).lento || 0, t + 0.25); }
        }
      } else ob.viuEm = 0;
    }
    if (ob.tipo === 'alarme') {
      const alvo = ob.alvo || ini.find(o => Math.hypot(o.x - ob.x, o.y - ob.y) < 7 && GP.linhaLivre(m, ob.x, ob.y, o.x, o.y));
      if (alvo) {
        ob.alvo = alvo; ob.ang = Math.atan2(alvo.y - ob.y, alvo.x - ob.x);
        const nx = ob.x + Math.cos(ob.ang) * 7 * dt, ny = ob.y + Math.sin(ob.ang) * 7 * dt;
        if (!GP.solidoEm(m, nx, ny)) { ob.x = nx; ob.y = ny; }
        if (Math.hypot(alvo.x - ob.x, alvo.y - ob.y) < 1.2) {
          ob.fim = true; GP._fx(J, {x: ob.x, y: ob.y, img: 'x_area', ag: 'killjoy', r: 2, dur: 0.5});
          for (const o of GP._noRaio(J, ob.dono, ob.x, ob.y, 3, true)) { GP._ef(o).fragil = t + 4; GP._revelar(J, o, 4); }
        }
      }
    }
    if (ob.tipo === 'lockdown' && t >= ob.dispara) {
      ob.fim = true; GP._fx(J, {x: ob.x, y: ob.y, img: 'x_area', ag: 'killjoy', r: 16, dur: 1});
      for (const o of GP._noRaio(J, ob.dono, ob.x, ob.y, 16, false)) { GP._prender(J, o, 8); GP._suprimir(J, o, 8); GP._ef(o).jam = t + 8; }
    }
    if (ob.tipo === 'marca') {
      const o = ini.find(o => Math.hypot(o.x - ob.x, o.y - ob.y) < 5 && GP.linhaLivre(m, ob.x, ob.y, o.x, o.y));
      if (o) { ob.fim = true; GP._area(J, {x: ob.x, y: ob.y, r: 4, ate: t + 6, lento: true, dono: ob.dono, img: 'c_area', ag: 'chamber', alfa: 0.7}); }
    }
    if (ob.tipo === 'sensor') {
      const o = ini.find(o => Math.hypot(o.x - ob.x, o.y - ob.y) < 7 && Math.hypot(o.vx, o.vy) > 4 && GP.linhaLivre(m, ob.x, ob.y, o.x, o.y));
      if (o) { ob.fim = true; GP._fx(J, {x: ob.x, y: ob.y, img: 'c_area', ag: 'deadlock', r: 3, dur: 0.6}); for (const v of GP._noRaio(J, ob.dono, ob.x, ob.y, 6, true)) GP._concussao(J, v, 3); }
    }
    if (ob.tipo === 'casulo') {
      if (ob.preso.vivo) { ob.preso.vx = ob.preso.vy = 0; ob.x = ob.preso.x; ob.y = ob.preso.y; }
      if (t >= ob.mata) { ob.fim = true; if (ob.preso.vivo) GP._habDano(J, ob.dono, ob.preso, 999, 'Annihilation'); }
    }
    if (ob.tipo === 'shear') {
      const o = ini.find(o => Math.hypot(o.x - ob.x, o.y - ob.y) < 1.6);
      if (o && !ob.arma) ob.arma = t + 0.45;
      if (ob.arma && t >= ob.arma) {
        ob.fim = true;
        const s = GP._deParedeAParede(m, ob, ob.ang, 4.5);
        GP._muro(J, ob.dono, s.a, s.b, {ate: t + 6, hp: 600, img: 'q_parede', ag: 'vyse', alto: 1.1, nome: 'Shear'});
      }
    }
    if (ob.tipo === 'interceptor') {
      const perto = (x, y) => Math.hypot(x - ob.x, y - ob.y) < 6;
      for (const p of H.proj) if (p.dono && p.dono.time !== ob.dono.time && perto(p.x, p.y)) { p.morto = true; p.aoParar = null; GP._fx(J, {x: p.x, y: p.y, img: 'e_objeto', ag: 'veto', r: 0.6, dur: 0.3}); }
      for (const a of H.areas) if (a.dono && a.dono.time !== ob.dono.time && perto(a.x, a.y)) { a.ate = t; a.aoFim = null; }
      for (const b of H.bichos.concat(H.robos)) if (b.dono.time !== ob.dono.time && perto(b.x, b.y)) { b.fim = true; b.ate = 0; b.aoAlcancar = () => {}; }
      for (const o of H.objs) if (o !== ob && o.dono.time !== ob.dono.time && perto(o.x, o.y)) o.hp = 0;
    }
  }
  H.objs = H.objs.filter(o => !o.fim);
  /* Evolution: limpa o que é ruim e regenera */
  for (const e of J.ents) {
    const ef = e.ef; if (!ef || !e.vivo) continue;
    if (ef.imune > t) { ef.cego = ef.conc = ef.lento = ef.preso = ef.miope = ef.supr = ef.fragil = ef.jam = 0; e.hp = Math.min(100, e.hp + 10 * dt); }
  }
};

/* bala para nos objetos inimigos (torreta, câmera…) e nos muros; aí tira vida deles */
{
  const tiroHab = GP.tiroEmHab;
  GP.tiroEmHab = function (J, ox, oy, dx, dy, tMax) {
    tMax = tiroHab ? tiroHab(J, ox, oy, dx, dy, tMax) : tMax;
    const H = J.hab, quem = J._atirando; if (!H || !quem) return tMax;
    for (const ob of H.objs) {
      if (ob.dono.time === quem.time || ob.escondido && ob.tipo === 'shear') continue;
      const rx = ob.x - ox, ry = ob.y - oy, tt = rx * dx + ry * dy;
      if (tt > 0 && tt < tMax && Math.abs(rx * dy - ry * dx) < Math.max(0.35, ob.tam * 0.4)) tMax = tt;
    }
    return tMax;
  };
  const acertou = GP.tiroAcertou;
  GP.tiroAcertou = function (J, x, y, dano) {
    const H = J.hab, quem = J._atirando;
    if (H && quem) {
      for (const ob of H.objs) if (ob.dono.time !== quem.time && Math.hypot(ob.x - x, ob.y - y) < Math.max(0.6, ob.tam * 0.5)) { ob.hp -= dano; return; }
      for (const w of H.muros) if (GP._distSeg(x, y, w.a, w.b) < 1) { w.hp -= dano; return; }
    }
    if (acertou) acertou(J, x, y, dano);
  };
}

/* armas do Chamber */
{
  const tem = GP.temArmaHab, atira = GP.atirarHab, sem = GP.semTiro;
  GP.temArmaHab = (J, e) => !!(e.ef && (e.ef.hhOn && e.ef.hh > 0 || e.ef.tdfOn && e.ef.tdf > 0)) || (tem ? tem(J, e) : false);
  GP.semTiro = (J, e) => !!(e.ef && e.ef.jam > J.t) || (sem ? sem(J, e) : false);
  GP.atirarHab = function (J, e) {
    const ef = e.ef, t = J.t;
    const hh = ef && ef.hhOn && ef.hh > 0, tdf = ef && ef.tdfOn && ef.tdf > 0;
    if (!hh && !tdf) return atira ? atira(J, e) : false;
    const erro = (tdf ? 0.15 : 0.5) + GP.erroAtual(e, t) * (tdf ? 0.2 : 0.5);
    const ang = e.ang + GP._gauss(J.rnd) * (erro / 2) * Math.PI / 180;
    const ox = e.x + Math.cos(ang) * 0.3, oy = e.y + Math.sin(ang) * 0.3, dx = Math.cos(ang), dy = Math.sin(ang);
    J._atirando = e;
    let tMax = GP.raio(J.m, ox, oy, ang, 100);
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
    J.tiros.push({x0: ox, y0: oy, x1: ox + dx * tMax, y1: oy + dy * tMax, t, dono: e.id, time: e.time, acertou: !!alvo});
    J.sons.push({x: e.x, y: e.y, t, dono: e.id, time: e.time, r: 45, tiro: true});
    if (hh) { ef.hh--; e.proxTiro = t + 0.4; } else { ef.tdf--; e.proxTiro = t + 1.4; }
    if (alvo) {
      const parte = pA < GP.ZONA_CABECA ? 0 : 1;
      const dano = tdf ? 200 : (parte === 0 ? 159 : 55);
      GP._dano(J, e, alvo, dano, parte, {nome: tdf ? 'Tour De Force' : 'Headhunter'});
      if (tdf && !alvo.vivo) GP._area(J, {x: alvo.x, y: alvo.y, r: 4, ate: t + 4, lento: true, dono: e, img: 'x_area', ag: 'chamber', alfa: 0.7});
    } else if (GP.tiroAcertou) GP.tiroAcertou(J, ox + dx * (tMax + 0.05), oy + dy * (tMax + 0.05), tdf ? 200 : 55);
    J._atirando = null;
    return true;
  };
}

/* ---------- desenho ---------- */
GP.desenharSentinelas = function (g, J) {
  const H = J.hab; if (!H) return;
  const t = J.t, eu = J.eu;
  const spr = (r, x, y, ang, w, alfa) => { if (!r) return; const h = w * r.e.h / r.e.w; g.save(); g.translate(x, y); g.rotate(ang || 0); g.globalAlpha = alfa == null ? 1 : alfa; g.drawImage(r.im, -w / 2, -h / 2, w, h); g.restore(); };
  for (const ob of H.objs) {
    if (ob.escondido && ob.dono !== eu) continue;
    if (!ob.img) { if (ob.dono === eu) { g.strokeStyle = 'rgba(220,80,70,.6)'; g.lineWidth = 0.08; g.beginPath(); g.arc(ob.x, ob.y, 0.6, 0, 7); g.stroke(); } continue; }
    const r = GP._imgHab(ob.ag, ob.img);
    if (ob.tipo === 'lockdown') {
      const k = Math.max(0, Math.min(1, 1 - (ob.dispara - t) / 13));
      spr(GP._imgHab('killjoy', 'x_area'), ob.x, ob.y, t * 0.3, 32, 0.15 + 0.25 * k);
    }
    const gira = ob.tipo === 'torreta' || ob.tipo === 'alarme' || ob.tipo === 'camera' ? ob.ang : ob.tipo === 'malha' ? ob.ang : 0;
    if (r) spr(r, ob.x, ob.y, gira, ob.tam, ob.escondido ? 0.6 : 1);
    if (ob.tipo === 'interceptor') { g.save(); g.strokeStyle = 'rgba(120,255,140,.25)'; g.lineWidth = 0.07; g.setLineDash([0.3, 0.2]); g.beginPath(); g.arc(ob.x, ob.y, 6, 0, 7); g.stroke(); g.restore(); }
  }
  for (const e of J.ents) {
    const ef = e.ef; if (!ef || !e.vivo) continue;
    if (ef.ancoraCh && e === eu) spr(GP._imgHab('chamber', 'e_objeto'), ef.ancoraCh.x, ef.ancoraCh.y, 0, 0.9, 0.9);
    if (ef.corte && e === eu) spr(GP._imgHab('veto', 'c_objeto'), ef.corte.x, ef.corte.y, t, 1.3, 0.9);
    if (ef.imune > t && (e === eu || e._visivel)) spr(GP._imgHab('veto', 'x_area'), e.x, e.y, t, 2, 0.45);
  }
};
