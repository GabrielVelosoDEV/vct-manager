/* ============================================================
   HABILIDADES · INICIADORES
   Peças novas que eles trazem (servem para os próximos também):
     revelar   o inimigo fica marcado por um tempo
     suprimir  não usa habilidade
     míope     só enxerga de perto
     preso     não anda
     drone     a tecla de movimento passa a pilotar o drone (Sova, Tejo)
     bicho     criatura que anda sozinha e caça (Skye, Fade, Gekko)
     pulsos    área que estoura várias vezes (Breach, KAY/O, Sova)
   ============================================================ */
'use strict';

GP._revelar = (J, o, s) => { const ef = GP._ef(o); ef.revelado = Math.max(ef.revelado || 0, J.t + s); };
GP._suprimir = (J, o, s) => { const ef = GP._ef(o); ef.supr = Math.max(ef.supr || 0, J.t + s); };
GP._miope = (J, o, s) => { const ef = GP._ef(o); ef.miope = Math.max(ef.miope || 0, J.t + s); };
GP._prender = (J, o, s) => { const ef = GP._ef(o); ef.preso = Math.max(ef.preso || 0, J.t + s); };
GP._concussao = (J, o, s) => { const ef = GP._ef(o); ef.conc = Math.max(ef.conc || 0, J.t + s); };

/* inimigos num raio, com ou sem precisar de linha livre */
GP._noRaio = (J, de, x, y, r, linha) => GP._inimigosDe(J, de).filter(o =>
  Math.hypot(o.x - x, o.y - y) <= r && (!linha || GP.linhaLivre(J.m, x, y, o.x, o.y)));
/* inimigos num leque (atravessa parede) */
GP._noLeque = (J, de, x, y, ang, L, abre) => GP._inimigosDe(J, de).filter(o =>
  Math.hypot(o.x - x, o.y - y) <= L && Math.abs(GP.angDif(ang, Math.atan2(o.y - y, o.x - x))) <= abre);

/* o primeiro ponto livre depois da primeira parede (o flash do Breach, o Aftershock) */
GP._atrasDaParede = function (m, x, y, ang, max, alem) {
  const d = GP.raio(m, x, y, ang, max);
  if (d >= max) return null;
  for (let s = d + 0.25; s < d + alem; s += 0.25) {
    const px = x + Math.cos(ang) * s, py = y + Math.sin(ang) * s;
    if (!GP.solidoEm(m, px, py)) return {x: px + Math.cos(ang) * 0.8, y: py + Math.sin(ang) * 0.8, d};
  }
  return null;
};

/* área que estoura n vezes */
GP._pulsos = (J, o) => GP._area(J, {r: 0, ...o, pulsos: o.pulsos.map(s => J.t + s), ate: J.t + o.pulsos[o.pulsos.length - 1] + (o.resto || 0.2)});

/* bicho: anda sozinho; persegue quem vê; faz algo ao alcançar */
GP._bicho = (J, o) => { const b = {t0: J.t, ang: 0, vel: 7, persegue: 10, alcanca: 1.3, ...o}; GP._hab(J).bichos.push(b); return b; };

/* drone pilotado */
GP._drone = function (J, e, o) {
  const H = GP._hab(J), ef = GP._ef(e);
  const d = {dono: e, x: e.x + Math.cos(e.ang) * 0.8, y: e.y + Math.sin(e.ang) * 0.8, ang: e.ang, ate: J.t + o.dur, vel: o.vel || 8, ...o};
  H.drones.push(d); ef.drone = d;
  return d;
};

Object.assign(GP.HABS, {
  sova: {
    c: {nome: 'Owl Drone', cargas: 1, usar(J, e) { GP._drone(J, e, {dur: 7, img: 'c_objeto', ag: 'sova', tiro: 'dardo'}); }},
    q: {nome: 'Shock Bolt', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 30);
      GP._lancar(J, e, {vel: 30, alcance: alvo.d + 0.1, quica: 1, img: 'q_projetil', ag: 'sova', aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'q_area', ag: 'sova', r: 2.6, dur: 0.5});
        GP._explosao(J, p.dono, p.x, p.y, 4, 75, 'Shock Bolt', 0.3);
      }});
    }},
    e: {nome: 'Recon Bolt', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 40);
      GP._lancar(J, e, {vel: 30, alcance: alvo.d + 0.1, quica: 1, img: 'e_projetil', ag: 'sova', aoParar: (J, p) => {
        GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.6, 2], img: 'e_projetil', ag: 'sova', objeto: true, aoPulso: J => {
          GP._fx(J, {x: p.x, y: p.y, img: 'e_area', ag: 'sova', r: 9, dur: 0.9});
          for (const o of GP._noRaio(J, p.dono, p.x, p.y, 30, true)) GP._revelar(J, o, 2);
        }});
      }});
    }},
    x: {nome: "Hunter's Fury", cargas: 1, usar(J, e) { const ef = GP._ef(e); ef.furia = 3; ef.furiaAte = J.t + 6; }},
  },
  breach: {
    c: {nome: 'Aftershock', cargas: 1, usar(J, e) {
      const p = GP._atrasDaParede(J.m, e.x, e.y, e.ang, 3, 6) || GP._pontoMirado(J, e, 3);
      GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.9, 1.5, 2.1], aoPulso: J => {
        GP._fx(J, {x: p.x, y: p.y, img: 'c_area', ag: 'breach', r: 2.6, dur: 0.5});
        for (const o of GP._noRaio(J, e, p.x, p.y, 2.8, false)) GP._habDano(J, e, o, 60, 'Aftershock');
      }});
    }},
    q: {nome: 'Flashpoint', cargas: 2, usar(J, e) {
      const atras = GP._atrasDaParede(J.m, e.x, e.y, e.ang, 10, 8);
      const p = atras || (() => { const a = GP._pontoMirado(J, e, 18); return {x: a.x - Math.cos(e.ang) * 1.5, y: a.y - Math.sin(e.ang) * 1.5}; })();
      GP._area(J, {x: p.x, y: p.y, r: 0, ate: J.t + 0.6, aoFim: J => { GP._clarao(J, e, p.x, p.y, 2); GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'breach', r: 2.6, dur: 0.5}); }});
    }},
    e: {nome: 'Fault Line', cargas: 1, usar(J, e) {
      const L = Math.min(22, e.cmd.mira ? Math.hypot(e.cmd.mira.x - e.x, e.cmd.mira.y - e.y) + 2 : 22), ang = e.ang;
      const a = [e.x, e.y], b = [e.x + Math.cos(ang) * L, e.y + Math.sin(ang) * L];
      GP._fx(J, {x: e.x, y: e.y, ang, img: 'e_rastro', ag: 'breach', rastro: L, dur: 1.4});
      GP._area(J, {x: e.x, y: e.y, r: 0, ate: J.t + 0.7, aoFim: J => {
        for (const o of GP._inimigosDe(J, e)) if (GP._distSeg(o.x, o.y, a, b) < 1.6) GP._concussao(J, o, 3);
      }});
    }},
    x: {nome: 'Rolling Thunder', cargas: 1, usar(J, e) {
      GP._hab(J).fx.push({x: e.x, y: e.y, ang: e.ang, img: 'x_cone', ag: 'breach', cone: 28, dur: 1.4, t: J.t});
      const x = e.x, y = e.y, ang = e.ang;
      GP._area(J, {x, y, r: 0, ate: J.t + 0.8, aoFim: J => { for (const o of GP._noLeque(J, e, x, y, ang, 28, 0.42)) GP._concussao(J, o, 4); }});
    }},
  },
  skye: {
    c: {nome: 'Regrowth', cargas: 1, usar(J, e) {
      /* cura os aliados em volta (ela não se cura: no duelo só aparece) */
      GP._area(J, {x: e.x, y: e.y, r: 9, ate: J.t + 5, segue: e, cura: 0, curaAliado: 15, desenho: 4.5, alfa: 0.55, dono: e, img: 'c_area', ag: 'skye'});
    }},
    q: {nome: 'Trailblazer', cargas: 1, usar(J, e) {
      GP._bicho(J, {dono: e, x: e.x, y: e.y, ang: e.ang, vel: 9, ate: J.t + 3, img: 'q_objeto', ag: 'skye', tam: 1.8, persegue: 0,
        aoAlcancar: (J, b, o) => { GP._concussao(J, o, 3.5); GP._habDano(J, e, o, 30, 'Trailblazer'); GP._fx(J, {x: b.x, y: b.y, img: 'e_clarao', ag: 'skye', r: 1.8, dur: 0.4}); }});
    }},
    e: {nome: 'Guiding Light', cargas: 2, usar(J, e) {
      const ef = GP._ef(e);
      ef.falcao = GP._lancar(J, e, {vel: 14, alcance: 28, img: 'e_projetil', ag: 'skye', escala: 1.6, aoParar: (J, p) => { if (ef.falcao === p) ef.falcao = null; GP._clarao(J, e, p.x, p.y, 1.8); GP._fx(J, {x: p.x, y: p.y, img: 'e_clarao', ag: 'skye', r: 2.4, dur: 0.5}); }});
    }},
    x: {nome: 'Seekers', cargas: 1, usar(J, e) {
      const alvos = GP._inimigosDe(J, e).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(0, 3);
      alvos.forEach((o, i) => GP._bicho(J, {dono: e, x: e.x, y: e.y, ang: e.ang + (i - 1) * 0.5, vel: 8, ate: J.t + 10, img: 'x_projetil', ag: 'skye', tam: 1.3,
        alvoFixo: o, aoAlcancar: (J, b, alvo) => GP._miope(J, alvo, 3)}));
    }},
  },
  kayo: {
    c: {nome: 'FRAG/ment', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'c_projetil', ag: 'kayo', aoParar: (J, p) => GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.5, 1, 1.5, 2], img: 'c_projetil', ag: 'kayo', objeto: true,
        aoPulso: J => { GP._fx(J, {x: p.x, y: p.y, img: 'c_area', ag: 'kayo', r: 2.6, dur: 0.4}); GP._explosao(J, e, p.x, p.y, 3, 40, 'FRAG/ment', 0.25); }})});
    }},
    q: {nome: 'FLASH/drive', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 16);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, quica: 1, img: 'q_projetil', ag: 'kayo', aoParar: (J, p) => GP._area(J, {x: p.x, y: p.y, r: 0, ate: J.t + 0.5, objeto: true, img: 'q_projetil', ag: 'kayo',
        aoFim: J => { GP._clarao(J, e, p.x, p.y, 2); GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'kayo', r: 2.6, dur: 0.5}); }})});
    }},
    e: {nome: 'ZERO/point', cargas: 1, usar(J, e) {
      GP._lancar(J, e, {vel: 32, alcance: 40, img: 'e_projetil', ag: 'kayo', aoParar: (J, p) => GP._pulsos(J, {x: p.x, y: p.y, pulsos: [1], img: 'e_projetil', ag: 'kayo', objeto: true, resto: 0.1,
        aoPulso: J => { GP._fx(J, {x: p.x, y: p.y, img: 'e_area', ag: 'kayo', r: 10, dur: 0.9}); for (const o of GP._noRaio(J, e, p.x, p.y, 15, true)) { GP._suprimir(J, o, 8); GP._revelar(J, o, 2); } }})});
    }},
    x: {nome: 'NULL/cmd', cargas: 1, usar(J, e) {
      GP._ef(e).empress = J.t + 12;
      GP._pulsos(J, {x: e.x, y: e.y, segue: e, pulsos: [0.3, 1.3, 2.3, 3.3, 4.3], aoPulso: (J, a) => {
        GP._fx(J, {x: a.x, y: a.y, img: 'x_area', ag: 'kayo', r: 12, dur: 0.8});
        for (const o of GP._noRaio(J, e, a.x, a.y, 30, false)) GP._suprimir(J, o, 1.2);
      }});
    }},
  },
  fade: {
    c: {nome: 'Prowler', cargas: 2, usar(J, e) {
      GP._bicho(J, {dono: e, x: e.x, y: e.y, ang: e.ang, vel: 7.5, ate: J.t + 3, img: 'c_objeto', ag: 'fade', tam: 1.6, persegue: 12,
        aoAlcancar: (J, b, o) => GP._miope(J, o, 2.5)});
    }},
    q: {nome: 'Seize', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 24);
      GP._lancar(J, e, {vel: 18, alcance: alvo.d, img: 'q_projetil', ag: 'fade', aoParar: (J, p) => {
        GP._area(J, {x: p.x, y: p.y, r: 3.2, ate: J.t + 1.6, img: 'q_area', ag: 'fade', dono: e});
        for (const o of GP._noRaio(J, e, p.x, p.y, 3.2, true)) { GP._prender(J, o, 3); GP._revelar(J, o, 3); }
      }});
    }},
    e: {nome: 'Haunt', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 30);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: 'e_objeto', ag: 'fade', aoParar: (J, p) => GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.5, 1.5], img: 'e_objeto', ag: 'fade', objeto: true, escala: 1.4,
        aoPulso: J => { for (const o of GP._noRaio(J, e, p.x, p.y, 30, true)) GP._revelar(J, o, 2.5); }})});
    }},
    x: {nome: 'Nightfall', cargas: 1, usar(J, e) {
      GP._hab(J).fx.push({x: e.x, y: e.y, ang: e.ang, img: 'x_cone', ag: 'fade', cone: 32, dur: 1.8, t: J.t});
      const x = e.x, y = e.y, ang = e.ang;
      GP._area(J, {x, y, r: 0, ate: J.t + 0.8, aoFim: J => {
        for (const o of GP._noLeque(J, e, x, y, ang, 32, 0.45)) { GP._revelar(J, o, 12); GP._concussao(J, o, 2); GP._habDano(J, e, o, Math.min(40, o.hp - 1), 'Nightfall'); }
      }});
    }},
  },
  gekko: {
    c: {nome: 'Mosh Pit', cargas: 1, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 18);
      GP._lancar(J, e, {vel: 16, alcance: alvo.d, img: null, aoParar: (J, p) => {
        GP._area(J, {x: p.x, y: p.y, r: 3.2, ate: J.t + 3, dps: 10, dono: e, img: 'c_area', ag: 'gekko', nome: 'Mosh Pit', aoFim: J => {
          GP._fx(J, {x: p.x, y: p.y, img: 'x_area', ag: 'gekko', r: 3.6, dur: 0.5});
          for (const o of GP._noRaio(J, e, p.x, p.y, 3.4, false)) GP._habDano(J, e, o, 150, 'Mosh Pit');
        }});
      }});
    }},
    q: {nome: 'Wingman', cargas: 1, usar(J, e) {
      GP._bicho(J, {dono: e, x: e.x, y: e.y, ang: e.ang, vel: 6, ate: J.t + 6, img: 'q_objeto', ag: 'gekko', tam: 1.4, persegue: 14, alcanca: 6, porLinha: true,
        aoAlcancar: (J, b, o) => { GP._fx(J, {x: o.x, y: o.y, img: 'x_area', ag: 'gekko', r: 2, dur: 0.5}); for (const v of GP._noRaio(J, e, o.x, o.y, 3, true)) GP._concussao(J, v, 3); }});
    }},
    e: {nome: 'Dizzy', cargas: 1, usar(J, e) {
      GP._lancar(J, e, {vel: 12, alcance: Math.min(20, GP._ateParede(J.m, e.x, e.y, e.ang, 20)), img: 'e_objeto', ag: 'gekko', escala: 1.3, aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'e_clarao', ag: 'gekko', r: 3, dur: 0.6});
        for (const o of GP._noRaio(J, e, p.x, p.y, 22, true)) { const ef = GP._ef(o); ef.cego = Math.max(ef.cego || 0, J.t + 2); ef.cegoDur = 2; GP._revelar(J, o, 2); }
      }});
    }},
    x: {nome: 'Thrash', cargas: 1, usar(J, e) {
      GP._bicho(J, {dono: e, x: e.x, y: e.y, ang: e.ang, vel: 9, ate: J.t + 5, img: 'x_objeto', ag: 'gekko', tam: 2, persegue: 12, alcanca: 2.2,
        aoAlcancar: (J, b, o) => { GP._fx(J, {x: b.x, y: b.y, img: 'x_area', ag: 'gekko', r: 3, dur: 0.6}); for (const v of GP._noRaio(J, e, b.x, b.y, 3, false)) GP._prender(J, v, 4); }});
    }},
  },
  tejo: {
    c: {nome: 'Stealth Drone', cargas: 1, usar(J, e) { GP._drone(J, e, {dur: 7, img: 'c_objeto', ag: 'tejo', tiro: 'pulso'}); }},
    q: {nome: 'Special Delivery', cargas: 2, usar(J, e) {
      const alvo = GP._pontoMirado(J, e, 20);
      GP._lancar(J, e, {vel: 22, alcance: alvo.d, img: 'q_projetil', ag: 'tejo', aoParar: (J, p) => GP._pulsos(J, {x: p.x, y: p.y, pulsos: [0.6], img: 'q_projetil', ag: 'tejo', objeto: true, resto: 0.1,
        aoPulso: J => { GP._fx(J, {x: p.x, y: p.y, img: 'q_clarao', ag: 'tejo', r: 3, dur: 0.6}); for (const o of GP._noRaio(J, e, p.x, p.y, 4.5, true)) GP._concussao(J, o, 3); }})});
    }},
    e: {nome: 'Guided Salvo', cargas: 2, usar(J, e) {
      /* o míssil vai pelo alto até o cursor: passa por cima das paredes */
      const c = e.cmd.mira || {x: e.x + Math.cos(e.ang) * 20, y: e.y + Math.sin(e.ang) * 20};
      const d = Math.min(40, Math.hypot(c.x - e.x, c.y - e.y));
      GP._lancar(J, e, {vel: 20, alcance: d, atravessa: true, img: 'e_projetil', ag: 'tejo', escala: 1.1, aoParar: (J, p) => {
        GP._fx(J, {x: p.x, y: p.y, img: 'e_area', ag: 'tejo', r: 2.6, dur: 0.5});
        GP._explosao(J, e, p.x, p.y, 3.5, 70, 'Guided Salvo', 0.4);
      }});
    }},
    x: {nome: 'Armageddon', cargas: 1, usar(J, e) {
      const ang = e.ang;
      for (let i = 0; i < 6; i++) {
        const x = e.x + Math.cos(ang) * (6 + i * 3.5), y = e.y + Math.sin(ang) * (6 + i * 3.5);
        GP._area(J, {x, y, r: 0, ate: J.t + 1.4 + i * 0.35, aoFim: J => {
          GP._fx(J, {x, y, img: 'x_area', ag: 'tejo', r: 3.2, dur: 0.6});
          for (const o of GP._noRaio(J, e, x, y, 2.6, false)) GP._habDano(J, e, o, 80, 'Armageddon');
          J.sons.push({x, y, t: J.t, dono: e.id, time: e.time, r: 40, tiro: true});
        }});
      }
    }},
  },
});

/* ---------- segundo toque: Skye estoura o falcão; drone volta ---------- */
GP._segundoToqueIni = function (J, e, k) {
  const ef = GP._ef(e);
  if (e.agente === 'skye' && k === 'e' && ef.falcao && !ef.falcao.morto) { ef.falcao.morto = true; ef.falcao.aoParar(J, ef.falcao); return true; }
  if (ef.drone && k === 'c' && (e.agente === 'sova' || e.agente === 'tejo')) { ef.drone.ate = 0; return true; }
  return false;
};

/* ---------- a cada passo ---------- */
GP.passoIniciadores = function (J, dt) {
  const H = GP._hab(J), m = J.m, t = J.t;
  /* áreas que seguem alguém (Regrowth, NULL/cmd) e cura de aliado */
  for (const a of H.areas) {
    if (a.segue) { a.x = a.segue.x; a.y = a.segue.y; }
    if (a.curaAliado) for (const o of J.ents) if (o.vivo && o !== a.dono && o.time === a.dono.time && Math.hypot(o.x - a.x, o.y - a.y) < a.r && GP.linhaLivre(m, a.x, a.y, o.x, o.y)) o.hp = Math.min(100, o.hp + a.curaAliado * dt);
    if (a.pulsos) while (a.pulsos.length && t >= a.pulsos[0]) { a.pulsos.shift(); a.aoPulso(J, a); }
  }
  /* drones */
  for (const d of H.drones) {
    const e = d.dono, c = e.cmd;
    if (!e.vivo || t >= d.ate) { d.fim = true; if (e.ef) e.ef.drone = null; continue; }
    let mx = c.mx || 0, my = c.my || 0; const n = Math.hypot(mx, my); if (n > 1) { mx /= n; my /= n; }
    const nx = d.x + mx * d.vel * dt, ny = d.y + my * d.vel * dt;
    if (!GP.colide(m, nx, d.y, 0.3)) d.x = nx;
    if (!GP.colide(m, d.x, ny, 0.3)) d.y = ny;
    if (c.mira) d.ang = Math.atan2(c.mira.y - d.y, c.mira.x - d.x);
    /* o drone enxerga em volta */
    for (const o of GP._noRaio(J, e, d.x, d.y, 14, true)) GP._revelar(J, o, 0.3);
    if (c.atirar && !d.usou) {
      d.usou = true; c.atirar = false;
      if (d.tiro === 'dardo') {
        GP._lancar(J, {x: d.x, y: d.y, ang: d.ang, agente: 'sova', time: e.time}, {vel: 30, alcance: 25, img: 'q_projetil', ag: 'sova', escala: 0.6, acertaGente: true,
          aoParar: (J, p) => { if (p.acertou) GP._revelar(J, p.acertou, 6); }}).dono = e;
      } else {
        GP._fx(J, {x: d.x, y: d.y, img: 'q_clarao', ag: 'tejo', r: 4, dur: 0.5});
        for (const o of GP._noRaio(J, e, d.x, d.y, 5.5, true)) { GP._suprimir(J, o, 4); GP._revelar(J, o, 4); }
      }
    }
    if (t - (d.som || 0) > 0.5) { d.som = t; J.sons.push({x: d.x, y: d.y, t, dono: e.id, time: e.time, r: d.tiro === 'pulso' ? 6 : 12}); }
  }
  H.drones = H.drones.filter(d => !d.fim);
  /* bichos */
  for (const b of H.bichos) {
    let alvo = b.alvoFixo && b.alvoFixo.vivo ? b.alvoFixo : null;
    if (!alvo && b.persegue) alvo = GP._noRaio(J, b.dono, b.x, b.y, b.persegue, true).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0];
    if (alvo) {
      let mira = alvo;
      if (b.alvoFixo && !GP.linhaLivre(m, b.x, b.y, alvo.x, alvo.y)) {
        if (!b.cam || t > (b.camAte || 0)) { b.cam = GP.caminho(m, b.x, b.y, alvo.x, alvo.y) || []; b.camAte = t + 0.5; }
        while (b.cam.length && Math.hypot(b.cam[0].x - b.x, b.cam[0].y - b.y) < 0.7) b.cam.shift();
        if (b.cam[0]) mira = b.cam[0];
      }
      const quer = Math.atan2(mira.y - b.y, mira.x - b.x);
      b.ang += Math.max(-5 * dt, Math.min(5 * dt, GP.angDif(b.ang, quer)));
    }
    const v = b.vel * dt, nx = b.x + Math.cos(b.ang) * v, ny = b.y + Math.sin(b.ang) * v;
    if (GP.colide(m, nx, ny, 0.25)) { if (b.alvoFixo) { if (!GP.colide(m, nx, b.y, 0.25)) b.x = nx; else if (!GP.colide(m, b.x, ny, 0.25)) b.y = ny; } else b.fim = true; }
    else { b.x = nx; b.y = ny; }
    const perto = alvo && Math.hypot(alvo.x - b.x, alvo.y - b.y) < b.alcanca && (!b.porLinha || GP.linhaLivre(m, b.x, b.y, alvo.x, alvo.y));
    if (!perto && !b.alvoFixo) {   /* passou por alguém sem estar perseguindo */
      const o = GP._noRaio(J, b.dono, b.x, b.y, b.alcanca, true)[0];
      if (o) { b.aoAlcancar(J, b, o); b.fim = true; }
    }
    if (perto) { b.aoAlcancar(J, b, alvo); b.fim = true; }
    if (t >= b.ate) b.fim = true;
    if (!b.fim && t - (b.som || 0) > 0.4) { b.som = t; J.sons.push({x: b.x, y: b.y, t, dono: b.dono.id, time: b.dono.time, r: 12}); }
  }
  H.bichos = H.bichos.filter(b => !b.fim);
};

/* Hunter's Fury: três raios que atravessam parede */
GP.atirarFuria = function (J, e) {
  const ef = e.ef, t = J.t;
  if (!(ef && ef.furia > 0 && ef.furiaAte > t)) return false;
  const ang = e.ang, dx = Math.cos(ang), dy = Math.sin(ang), L = 60;
  for (const o of GP._inimigosDe(J, e)) {
    const rx = o.x - e.x, ry = o.y - e.y, tt = rx * dx + ry * dy;
    if (tt > 0 && tt < L && Math.abs(rx * dy - ry * dx) < o.raio + 0.3) { GP._habDano(J, e, o, 80, "Hunter's Fury"); GP._revelar(J, o, 3); }
  }
  J.tiros.push({x0: e.x, y0: e.y, x1: e.x + dx * L, y1: e.y + dy * L, t, dono: e.id, time: e.time, hab: 'furia'});
  J.sons.push({x: e.x, y: e.y, t, dono: e.id, time: e.time, r: 60, tiro: true});
  ef.furia--; e.proxTiro = t + 1.1; e.ultimoTiro = t;
  return true;
};

/* ---------- desenho ---------- */
GP.desenharIniciadores = function (g, J) {
  const H = J.hab; if (!H) return;
  const t = J.t;
  const spr = (r, x, y, ang, w, alfa) => { if (!r) return; const h = w * r.e.h / r.e.w; g.save(); g.translate(x, y); g.rotate(ang || 0); g.globalAlpha = alfa == null ? 1 : alfa; g.drawImage(r.im, -w / 2, -h / 2, w, h); g.restore(); };
  for (const b of H.bichos) spr(GP._imgHab(b.ag, b.img), b.x, b.y, b.ang, b.tam || 1.4);
  for (const d of H.drones) {
    const r = GP._imgHab(d.ag, d.img);
    g.save(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(d.x + 0.3, d.y + 0.6, 0.6, 0.25, 0, 0, 7); g.fill(); g.restore();
    spr(r, d.x, d.y, d.ang + Math.PI / 2 * 0, 1.4);
    if (d.dono === J.eu) { g.strokeStyle = 'rgba(120,220,255,.25)'; g.lineWidth = 0.08; g.beginPath(); g.arc(d.x, d.y, 14, 0, 7); g.stroke(); }
  }
  /* rastros do Hunter's Fury */
  for (const tr of J.tiros) if (tr.hab === 'furia') {
    const r = GP._imgHab('sova', 'x_rastro'); if (!r) continue;
    const L = Math.hypot(tr.x1 - tr.x0, tr.y1 - tr.y0);
    g.save(); g.translate(tr.x0, tr.y0); g.rotate(Math.atan2(tr.y1 - tr.y0, tr.x1 - tr.x0)); g.globalAlpha = Math.max(0, 1 - (t - tr.t) / 0.6); g.drawImage(r.im, 0, -0.6, L, 1.2); g.restore();
  }
  /* marcas em quem foi revelado / preso / suprimido */
  for (const o of J.ents) {
    const ef = o.ef; if (!ef || !o.vivo || o === J.eu) continue;
    if (ef.revelado > t) {
      const p = 0.5 + 0.5 * Math.sin(t * 8);
      g.save(); g.strokeStyle = `rgba(255,70,85,${0.5 + 0.4 * p})`; g.lineWidth = 0.12;
      g.beginPath(); g.moveTo(o.x, o.y - 2.6); g.lineTo(o.x + 0.45, o.y - 2.1); g.lineTo(o.x, o.y - 1.6); g.lineTo(o.x - 0.45, o.y - 2.1); g.closePath(); g.stroke();
      g.beginPath(); g.arc(o.x, o.y + 0.9, 0.9 + p * 0.25, 0, 7); g.stroke(); g.restore();
    }
    if (ef.preso > t) { g.save(); g.strokeStyle = 'rgba(40,220,190,.7)'; g.lineWidth = 0.1; g.setLineDash([0.25, 0.15]); g.beginPath(); g.arc(o.x, o.y + 0.9, 0.75, 0, 7); g.stroke(); g.restore(); }
  }
};
GP.desenharTelaIni = function (g, J, W, H) {
  const ef = J.eu.ef, t = J.t; if (!ef) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (ef.miope > t) {
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.08, W / 2, H / 2, Math.min(W, H) * 0.32);
    gr.addColorStop(0, 'rgba(5,10,20,0)'); gr.addColorStop(1, 'rgba(5,10,20,.93)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  if (ef.supr > t) { g.fillStyle = 'rgba(80,150,255,.08)'; g.fillRect(0, 0, W, H); }
  if (ef.drone) { g.strokeStyle = 'rgba(120,220,255,.5)'; g.lineWidth = 3; g.strokeRect(6, 6, W - 12, H - 12); }
};
