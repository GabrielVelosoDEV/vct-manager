/* ============================================================
   MECÂNICAS DOS MAPAS
   Peças que mudam durante a partida, por cima do mapa pintado:
     porta      fecha/abre/quebra; muda a grade (colisão, visão e tiro)
                variações: interruptor (Ascent), uma vez (Sunset), automática
                (Breeze, Fracture), giratória com botão (Lotus), destrutível
                (Abyss, Haven, Lotus), muro que cai com o interruptor (Summit)
     teleporte  plataforma de mão única (Bind)
     tirolesa / corda   atalho por cima dos muros (E numa das pontas)
   Os lugares vêm de data/gameplay/mecanicas.js (tools/mapas/mecanicas.py).
   ============================================================ */
'use strict';

GP.MEC = {
  ESPESSURA: 0.45,      /* meia-espessura da porta (m): as células até aqui viram parede */
  ALCANCE_USO: 1.6,     /* E funciona até esta distância */
  AUTO_ABRE: 2.8,       /* porta automática abre com alguém a esta distância */
  AUTO_FECHA: 1.4,      /* e fecha depois de tantos segundos sem ninguém */
  GIRA_ABERTA: 7,       /* porta giratória fica aberta por tantos segundos */
  TP_ESPERA: 0.45,      /* segundos parado na plataforma até teleportar */
  TP_RAIO: 1.1,
  VEL: {tirolesa: 11, corda: 6.5},
  SOM: 40,              /* alcance do barulho das peças */
};

/* monta as peças do mapa (chamado pelo carregarMapa) */
GP.montarMecanicas = function (m) {
  const lista = (typeof MECANICAS_GAMEPLAY !== 'undefined' && MECANICAS_GAMEPLAY[m.nome]) || [];
  m.mec = lista.map(p => JSON.parse(JSON.stringify(p)));
  m.solidoBase = m.solido.slice();
  for (const p of m.mec) if (p.tipo === 'porta') {
    const [ax, ay] = p.a, [bx, by] = p.b, L = Math.hypot(bx - ax, by - ay) || 1;
    p.L = L; p.ang = Math.atan2(by - ay, bx - ax);
    p.cx = (ax + bx) / 2; p.cy = (ay + by) / 2;
    p.celulas = [];
    const ux = (bx - ax) / L, uy = (by - ay) / L, e = GP.MEC.ESPESSURA, c = m.cel;
    const x0 = Math.floor((Math.min(ax, bx) - 1) / c), x1 = Math.ceil((Math.max(ax, bx) + 1) / c);
    const y0 = Math.floor((Math.min(ay, by) - 1) / c), y1 = Math.ceil((Math.max(ay, by) + 1) / c);
    for (let y = Math.max(0, y0); y <= Math.min(m.H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(m.W - 1, x1); x++) {
      const i = y * m.W + x;
      if (m.solidoBase[i]) continue;
      const px = (x + 0.5) * c - ax, py = (y + 0.5) * c - ay;
      const t = px * ux + py * uy, n = Math.abs(-px * uy + py * ux);
      if (t >= -0.3 && t <= L + 0.3 && n <= e) p.celulas.push(i);
    }
    p.estado0 = p.estado;
    if (p.hp) p.hpMax = p.hp;
    if (p.hp_interruptor) p.hpIntMax = p.hp_interruptor;
  }
  GP.resetarMecanicas(m);
};

/* tudo volta como estava no começo do round */
GP.resetarMecanicas = function (m) {
  if (!m.mec) return;
  for (let i = 0; i < m.solido.length; i++) m.solido[i] = m.solidoBase[i];
  for (const p of m.mec) {
    if (p.tipo !== 'porta') continue;
    p.estado = p.estado0; p.hp = p.hpMax; p.hpInt = p.hpIntMax; p.ate = 0; p.vazio = 0;
    GP._aplicarPorta(m, p, null);
  }
};

/* a porta conta como parede? (aberta, quebrada e muro de pé deixam passar) */
GP._portaBloqueia = p => p.estado === 'fechada';

GP._aplicarPorta = function (m, p, J) {
  const v = GP._portaBloqueia(p) ? 1 : 0;
  for (const i of p.celulas) m.solido[i] = v;
  /* a navegação dos bots: porta automática conta sempre como livre (abre quando chegam) */
  if (m.nav && !p.auto) GP._navRefazer(m, p);
  /* quem ficou no meio da porta que fechou é empurrado para fora (ou esmagado pelo muro) */
  if (J && v) for (const e of J.ents) {
    if (!e.vivo || !GP.colide(m, e.x, e.y, e.raioCol || GP.RAIO_COLISAO)) continue;
    if (p.fecha === 'derruba') {
      e.hp = 0; e.vivo = false; e.st.mortes++; e._morreuEm = J.t;
      J.eventos.push({tipo: 'morte', t: J.t, de: null, em: e.id, arma: 'muro', cabeca: false});
    } else {
      const nx = -Math.sin(p.ang), ny = Math.cos(p.ang);
      const lado = ((e.x - p.cx) * nx + (e.y - p.cy) * ny) >= 0 ? 1 : -1;
      e.x += nx * lado * (GP.MEC.ESPESSURA + 0.5); e.y += ny * lado * (GP.MEC.ESPESSURA + 0.5);
      GP._empurrar(m, e, e.raioCol || GP.RAIO_COLISAO);
    }
  }
};

GP._navRefazer = function (m, p) {
  const n = m.nav, r = 1.2;
  const x0 = Math.max(0, Math.floor((Math.min(p.a[0], p.b[0]) - r) / n.passo)), x1 = Math.min(n.W - 1, Math.floor((Math.max(p.a[0], p.b[0]) + r) / n.passo));
  const y0 = Math.max(0, Math.floor((Math.min(p.a[1], p.b[1]) - r) / n.passo)), y1 = Math.min(n.H - 1, Math.floor((Math.max(p.a[1], p.b[1]) + r) / n.passo));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    n.livre[y * n.W + x] = GP.colide(m, (x + 0.5) * n.passo, (y + 0.5) * n.passo, 0.42) ? 0 : 1;
};

GP._mudarPorta = function (J, p, estado) {
  if (p.estado === estado) return;
  p.estado = estado;
  GP._aplicarPorta(J.m, p, J);
  J.sons.push({x: p.cx, y: p.cy, t: J.t, dono: null, time: null, r: GP.MEC.SOM, tiro: true});
  J.eventos.push({tipo: 'mecanica', t: J.t, id: p.id, estado});
  /* os bots refazem o caminho */
  for (const e of J.ents) if (e.ia) e.ia.caminho = null;
};

/* ---------- a cada passo do motor ---------- */
GP.passoMecanicas = function (J, dt) {
  const m = J.m;
  if (!m.mec || !m.mec.length) { for (const e of J.ents) if (e.cmd) e.cmd.usar = false; return; }
  const K = GP.MEC;
  for (const p of m.mec) {
    if (p.tipo !== 'porta') continue;
    if (p.auto) {
      const perto = J.ents.some(e => e.vivo && Math.hypot(e.x - p.cx, e.y - p.cy) < K.AUTO_ABRE + p.L / 2 * 0.5);
      if (perto) { p.vazio = 0; if (p.estado === 'fechada') GP._mudarPorta(J, p, 'aberta'); }
      else if (p.estado === 'aberta' && (p.vazio += dt) > K.AUTO_FECHA) GP._mudarPorta(J, p, 'fechada');
    }
    if (p.giratoria && p.estado === 'aberta' && J.t > p.ate) GP._mudarPorta(J, p, 'fechada');
  }
  for (const e of J.ents) {
    if (!e.vivo) { e.viagem = null; continue; }
    /* andando na tirolesa / corda */
    if (e.viagem) {
      const v = e.viagem, p = v.p, a = v.ida ? p.a : p.b, b = v.ida ? p.b : p.a;
      v.s += K.VEL[p.tipo] * dt;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), f = Math.min(1, v.s / L);
      e.x = a[0] + (b[0] - a[0]) * f; e.y = a[1] + (b[1] - a[1]) * f; e.vx = e.vy = 0;
      if (f >= 1) { e.viagem = null; GP._empurrar(m, e, e.raioCol || GP.RAIO_COLISAO); }
    }
    /* teleporte: parado na plataforma por um instante */
    let naPlat = null;
    /* (os bots ainda não sabem usar: passam por cima sem teleportar) */
    if (!e.bot) for (const p of m.mec) if (p.tipo === 'teleporte' && Math.hypot(e.x - p.de[0], e.y - p.de[1]) < K.TP_RAIO) naPlat = p;
    if (naPlat && J.t > (e._tpAte || 0)) {
      const p = naPlat;
      e._tpCarga = (e._tpCarga || 0) + dt;
      if (e._tpCarga >= K.TP_ESPERA) {
        e._tpCarga = 0; e._tpAte = J.t + 2;
        (J.efx || (J.efx = [])).push({tipo: 'tp', x: p.de[0], y: p.de[1], t: J.t}, {tipo: 'tp', x: p.para[0], y: p.para[1], t: J.t});
        e.x = p.para[0]; e.y = p.para[1]; e.vx = e.vy = 0;
        GP._empurrar(m, e, e.raioCol || GP.RAIO_COLISAO);
        J.sons.push({x: p.de[0], y: p.de[1], t: J.t, dono: null, time: null, r: K.SOM, tiro: true},
                    {x: p.para[0], y: p.para[1], t: J.t, dono: null, time: null, r: K.SOM, tiro: true});
        if (e.ia) e.ia.caminho = null;
      }
    } else e._tpCarga = 0;
    if (e.cmd && e.cmd.usar) { e.cmd.usar = false; GP._usar(J, e); }
  }
  if (J.efx) J.efx = J.efx.filter(f => J.t - f.t < 0.7);
};

/* o que o E faz aqui (para a dica na tela e para o uso) */
GP.usoPerto = function (J, e) {
  const m = J.m, K = GP.MEC;
  if (!m.mec || !e.vivo || e.viagem) return null;
  let melhor = null;
  const cand = (d, o) => { if (d <= K.ALCANCE_USO && (!melhor || d < melhor.d)) melhor = {d, ...o}; };
  for (const p of m.mec) {
    if (p.tipo === 'tirolesa' || p.tipo === 'corda') {
      const nome = p.tipo === 'corda' ? 'subir na corda' : 'usar a tirolesa';
      cand(Math.hypot(e.x - p.a[0], e.y - p.a[1]), {p, acao: 'viagem', ida: true, texto: nome});
      cand(Math.hypot(e.x - p.b[0], e.y - p.b[1]), {p, acao: 'viagem', ida: false, texto: nome});
    } else if (p.tipo === 'porta') {
      if (p.fecha === 'interruptor' && p.estado === 'aberta' && p.interruptor)
        cand(Math.hypot(e.x - p.interruptor[0], e.y - p.interruptor[1]), {p, acao: 'fechar', texto: 'fechar a porta'});
      if (p.fecha === 'uma_vez' && p.estado === 'aberta')
        cand(Math.hypot(e.x - p.cx, e.y - p.cy) - 0.6, {p, acao: 'fechar', texto: 'fechar a porta (só uma vez)'});
      if (p.giratoria && p.estado === 'fechada')
        for (const b of p.botoes || []) cand(Math.hypot(e.x - b[0], e.y - b[1]), {p, acao: 'girar', texto: 'girar a porta'});
    }
  }
  return melhor;
};

GP._usar = function (J, e) {
  const u = GP.usoPerto(J, e);
  if (!u) return;
  if (u.acao === 'viagem') { e.viagem = {p: u.p, ida: u.ida, s: 0}; J.sons.push({x: e.x, y: e.y, t: J.t, dono: e.id, time: e.time, r: 20}); }
  else if (u.acao === 'fechar') GP._mudarPorta(J, u.p, 'fechada');
  else if (u.acao === 'girar') { u.p.ate = J.t + GP.MEC.GIRA_ABERTA; GP._mudarPorta(J, u.p, 'aberta'); }
};

/* ---------- tiros ----------
   o interruptor do Summit é um alvo (125 de vida) que fica na frente da parede */
GP.tiroEmMecanica = function (J, ox, oy, dx, dy, tMax) {
  const m = J.m;
  if (!m.mec) return tMax;
  for (const p of m.mec) {
    if (p.tipo !== 'porta' || !p.hpIntMax || p.hpInt <= 0 || !p.interruptor) continue;
    const rx = p.interruptor[0] - ox, ry = p.interruptor[1] - oy, t = rx * dx + ry * dy;
    if (t <= 0 || t >= tMax + 0.6) continue;
    if (Math.abs(rx * dy - ry * dx) < 0.45) { p._acertoInt = t; return Math.min(tMax, t); }
  }
  return tMax;
};

/* o tiro parou em (x, y): se foi numa porta destrutível ou num interruptor, tira vida */
GP.tiroAcertou = function (J, x, y, dano) {
  const m = J.m;
  if (!m.mec) return;
  for (const p of m.mec) {
    if (p.tipo !== 'porta') continue;
    if (p.hpIntMax && p.hpInt > 0 && p.interruptor && Math.hypot(x - p.interruptor[0], y - p.interruptor[1]) < 0.6) {
      p.hpInt -= dano;
      if (p.hpInt <= 0 && p.fecha === 'derruba') GP._mudarPorta(J, p, 'fechada');
      return;
    }
    if (!p.hpMax || p.estado !== 'fechada' || p.hp <= 0) continue;
    const ux = Math.cos(p.ang), uy = Math.sin(p.ang), px = x - p.a[0], py = y - p.a[1];
    const t = px * ux + py * uy, n = Math.abs(-px * uy + py * ux);
    if (t < -0.4 || t > p.L + 0.4 || n > GP.MEC.ESPESSURA + 0.35) continue;
    p.hp -= dano;
    if (p.hp <= 0) GP._mudarPorta(J, p, 'quebrada');
    return;
  }
};

/* ---------- desenho (por cima do mapa, embaixo dos bonecos) ---------- */
GP._imgMec = function (mapa, nome) {
  const man = GP.manifesto ? GP.manifesto().mecanicas || {} : {};
  const e = (man[mapa] || {})[nome];
  const im = e && GP.imagem && GP.imagem(e.src);
  return im ? {im, e} : null;
};
/* nome da arte de cada estado (cai para o mais parecido se faltar) */
GP._arteDaPorta = function (mapa, p) {
  const A = p.arte, est = p.estado;
  const ordem = {
    porta: {fechada: ['porta_fechada'], aberta: ['porta_aberta'], quebrada: ['porta_quebrada', 'porta_aberta']},
    garagem: {fechada: ['garagem_fechada'], quebrada: ['garagem_quebrada']},
    porta_fragil: {fechada: ['porta_fragil'], quebrada: ['porta_fragil_quebrada']},
    porta_giratoria: {fechada: ['porta_giratoria_fechada'], aberta: ['porta_giratoria_aberta']},
    muro: {aberta: ['muro_em_pe'], fechada: ['muro_caido']},
  }[A] || {};
  for (const n of (ordem[est] || [])) { const r = GP._imgMec(mapa, n); if (r) return {...r, nome: n}; }
  return null;
};

GP.desenharMecanicas = function (g, J) {
  const m = J.m;
  if (!m.mec || !m.mec.length) return;
  const sprite = (r, x, y, ang, w, h, alfa) => {
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = alfa == null ? 1 : alfa;
    g.drawImage(r.im, -w / 2, -h / 2, w, h); g.restore();
  };
  for (const p of m.mec) {
    if (p.tipo === 'porta') {
      const r = GP._arteDaPorta(m.nome, p);
      if (r) {
        const prop = r.e.h / r.e.w;
        if (r.nome === 'porta_giratoria_aberta') {
          /* a pedra girou: fica atravessada no meio do vão */
          const h = p.L * 0.78, w = h / prop;
          sprite(r, p.cx, p.cy, p.ang, w, h);
        } else {
          const w = p.L / 0.82, h = Math.min(w * prop, 1.5);
          sprite(r, p.cx, p.cy, p.ang, w, h, r.nome === 'muro_em_pe' ? 0.6 : 1);
        }
      } else if (GP._portaBloqueia(p)) {
        g.strokeStyle = '#3a3f47'; g.lineWidth = GP.MEC.ESPESSURA * 2; g.beginPath();
        g.moveTo(p.a[0], p.a[1]); g.lineTo(p.b[0], p.b[1]); g.stroke();
      }
      if (p.interruptor) {
        const n = p.hpIntMax && p.hpInt <= 0 ? 'interruptor_quebrado' : 'interruptor';
        const ri = GP._imgMec(m.nome, n) || GP._imgMec(m.nome, 'interruptor');
        if (ri) { const t = 0.85; sprite(ri, p.interruptor[0], p.interruptor[1], 0, t, t * ri.e.h / ri.e.w); }
      }
      for (const b of p.botoes || []) {
        const rb = GP._imgMec(m.nome, 'botao');
        if (rb) sprite(rb, b[0], b[1], 0, 0.75, 0.75 * rb.e.h / rb.e.w);
      }
    } else if (p.tipo === 'teleporte') {
      const re = GP._imgMec(m.nome, 'teleporte_entrada'), rs = GP._imgMec(m.nome, 'teleporte_saida');
      const d = 2.6;
      if (re) sprite(re, p.de[0], p.de[1], 0, d, d * re.e.h / re.e.w);
      else { g.fillStyle = 'rgba(255,140,0,.5)'; g.beginPath(); g.arc(p.de[0], p.de[1], 1.2, 0, 7); g.fill(); }
      if (rs) sprite(rs, p.para[0], p.para[1], 0, d, d * rs.e.h / rs.e.w);
    } else if (p.tipo === 'tirolesa' || p.tipo === 'corda') {
      const rt = GP._imgMec(m.nome, p.tipo + '_trecho'), rp = GP._imgMec(m.nome, p.tipo + '_ponta');
      const ang = Math.atan2(p.b[1] - p.a[1], p.b[0] - p.a[0]), L = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]);
      g.save(); g.translate(p.a[0], p.a[1]); g.rotate(ang);
      if (rt) {
        const h = 0.34, passo = h * rt.e.w / rt.e.h, iw = rt.im.naturalWidth || rt.im.width, ih = rt.im.naturalHeight || rt.im.height;
        for (let s = 0; s < L; s += passo) {
          const f = Math.min(1, (L - s) / passo);
          g.drawImage(rt.im, 0, 0, iw * f, ih, s, -h / 2, passo * f, h);
        }
      } else { g.strokeStyle = '#555'; g.lineWidth = 0.12; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke(); }
      g.restore();
      if (rp) for (const [q, o] of [[p.a, p.b], [p.b, p.a]]) {
        const a2 = Math.atan2(o[1] - q[1], o[0] - q[0]);
        const poste = 1.25, w = poste / (rp.e.pw || 0.3), h = w * rp.e.h / rp.e.w;
        g.save(); g.translate(q[0], q[1]); g.rotate(a2);
        g.drawImage(rp.im, -(rp.e.ax || 0.2) * w, -(rp.e.ay || 0.5) * h, w, h); g.restore();
      }
    }
  }
  /* clarão do teleporte */
  const rb = GP._imgMec(m.nome, 'teleporte_brilho');
  for (const f of J.efx || []) {
    const k = (J.t - f.t) / 0.7, d = 2 + k * 3;
    if (rb) sprite(rb, f.x, f.y, k * 2, d, d * rb.e.h / rb.e.w, 1 - k);
    else { g.fillStyle = `rgba(255,170,60,${1 - k})`; g.beginPath(); g.arc(f.x, f.y, d / 2, 0, 7); g.fill(); }
  }
};

/* o que aparece em cima do jogador quando dá para usar alguma coisa */
GP.desenharDicaDeUso = function (g, J) {
  const eu = J.eu, u = GP.usoPerto(J, eu);
  if (!u) return;
  g.save(); g.font = '700 0.55px Inter, sans-serif'; g.textAlign = 'center';
  const txt = 'E  ' + u.texto, w = g.measureText(txt).width + 0.5;
  g.fillStyle = 'rgba(10,14,20,.78)'; g.fillRect(eu.x - w / 2, eu.y - 2.3, w, 0.8);
  g.fillStyle = '#eafff9'; g.fillText(txt, eu.x, eu.y - 1.7);
  g.restore();
};
