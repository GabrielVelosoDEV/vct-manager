/* ============================================================
   GAMEPLAY · A GRADE DO MAPA
   O mapa vem de data/gameplay/mapas.js (extraído dos minimapas):
   células de CELULA metros, parede ou chão, com as áreas de planta.
   Tudo aqui trabalha em METROS; a célula é detalhe interno.
   Sem DOM: dá para rodar no node (tools/gameplay.mjs).
   Um único global, GP, para não trombar com o jogo de gestão.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.SITIO_COD = {'.': 0, 'a': 1, 'b': 2, 'c': 3};

/* RLE → linha de texto */
GP._desfazRLE = function (s) {
  let out = '', num = '';
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') { num += ch; continue; }
    out += ch.repeat(num ? +num : 1); num = '';
  }
  return out;
};

GP.carregarMapa = function (nome) {
  const d = MAPAS_GAMEPLAY[nome];
  if (!d) throw new Error('mapa de gameplay inexistente: ' + nome);
  const W = d.largura, H = d.altura, cel = d.celula_m;
  const solido = new Uint8Array(W * H), sitio = new Uint8Array(W * H);
  d.grade.forEach((lin, y) => {
    const t = GP._desfazRLE(lin);
    for (let x = 0; x < W; x++) {
      const ch = t[x] || '#';
      if (ch === '#') solido[y * W + x] = 1;
      else sitio[y * W + x] = GP.SITIO_COD[ch] || 0;
    }
  });
  const centro = c => ({x: (c[0] + 0.5) * cel, y: (c[1] + 0.5) * cel});
  const m = {
    nome, W, H, cel, solido, sitio,
    larguraM: W * cel, alturaM: H * cel,
    spawn: d.spawn ? {atk: centro(d.spawn.atk), def: centro(d.spawn.def)} : null,
    areas: (d.areas || []).map(a => ({nome: a.nome, ...centro(a.c)})),
    sitios: {},
  };
  /* centro de cada área de planta (para a IA e para o desenho da letra) */
  const soma = {};
  for (let i = 0; i < W * H; i++) if (sitio[i]) {
    const k = sitio[i], s = soma[k] || (soma[k] = {x: 0, y: 0, n: 0});
    s.x += i % W; s.y += (i / W) | 0; s.n++;
  }
  for (const k in soma) {
    const s = soma[k], letra = 'abc'[k - 1];
    m.sitios[letra] = {x: (s.x / s.n + 0.5) * cel, y: (s.y / s.n + 0.5) * cel, celulas: s.n};
  }
  GP._prepararNav(m);
  return m;
};

/* ---------- consultas básicas ---------- */
GP.celSolida = function (m, cx, cy) {
  if (cx < 0 || cy < 0 || cx >= m.W || cy >= m.H) return true;
  return m.solido[cy * m.W + cx] === 1;
};
GP.solidoEm = function (m, x, y) {
  return GP.celSolida(m, Math.floor(x / m.cel), Math.floor(y / m.cel));
};
GP.sitioEm = function (m, x, y) {
  const cx = Math.floor(x / m.cel), cy = Math.floor(y / m.cel);
  if (cx < 0 || cy < 0 || cx >= m.W || cy >= m.H) return '';
  const k = m.sitio[cy * m.W + cx];
  return k ? 'abc'[k - 1] : '';
};
/* o nome da área mais próxima com linha de visão (ou só a mais próxima) */
GP.areaEm = function (m, x, y) {
  let melhor = null, dm = 1e9;
  for (const a of m.areas) {
    if (!a.nome) continue;
    const d = Math.hypot(a.x - x, a.y - y) + (GP.linhaLivre(m, x, y, a.x, a.y) ? 0 : 12);
    if (d < dm) { dm = d; melhor = a; }
  }
  return melhor ? melhor.nome : '';
};

/* ---------- raio até a parede (DDA na grade) ----------
   devolve a distância em metros até a primeira célula sólida, até `max` */
GP.raio = function (m, x0, y0, ang, max) {
  const c = m.cel, dx = Math.cos(ang), dy = Math.sin(ang);
  let cx = Math.floor(x0 / c), cy = Math.floor(y0 / c);
  if (GP.celSolida(m, cx, cy)) return 0;
  const passoX = dx > 0 ? 1 : -1, passoY = dy > 0 ? 1 : -1;
  const tDx = dx !== 0 ? Math.abs(c / dx) : Infinity, tDy = dy !== 0 ? Math.abs(c / dy) : Infinity;
  let tX = dx !== 0 ? ((dx > 0 ? (cx + 1) * c - x0 : x0 - cx * c) / Math.abs(dx)) : Infinity;
  let tY = dy !== 0 ? ((dy > 0 ? (cy + 1) * c - y0 : y0 - cy * c) / Math.abs(dy)) : Infinity;
  let t = 0;
  while (t < max) {
    if (tX < tY) { t = tX; tX += tDx; cx += passoX; }
    else { t = tY; tY += tDy; cy += passoY; }
    if (GP.celSolida(m, cx, cy)) return Math.min(t, max);
  }
  return max;
};
GP.linhaLivre = function (m, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  if (d < 1e-6) return true;
  return GP.raio(m, x0, y0, Math.atan2(y1 - y0, x1 - x0), d) >= d - 1e-6;
};

/* ---------- movimento com colisão (círculo contra a grade) ----------
   resolve um eixo de cada vez: escorrega na parede em vez de grudar */
GP.colide = function (m, x, y, r) {
  const c = m.cel;
  const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
  const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    if (!GP.celSolida(m, cx, cy)) continue;
    /* ponto da célula mais perto do centro */
    const px = Math.max(cx * c, Math.min(x, (cx + 1) * c));
    const py = Math.max(cy * c, Math.min(y, (cy + 1) * c));
    if ((px - x) * (px - x) + (py - y) * (py - y) < r * r) return true;
  }
  return false;
};
GP.mover = function (m, e, dx, dy) {
  const r = e.raio;
  /* passos curtos: nada atravessa parede fina em quadro lento */
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (m.cel * 0.45)));
  const sx = dx / n, sy = dy / n;
  let bateu = false;
  for (let i = 0; i < n; i++) {
    if (!GP.colide(m, e.x + sx, e.y, r)) e.x += sx; else bateu = true;
    if (!GP.colide(m, e.x, e.y + sy, r)) e.y += sy; else bateu = true;
  }
  return bateu;
};

/* ---------- navegação ----------
   A* numa grade de 1 m (2×2 células) com folga de parede, para a IA.
   Um bloco de navegação é livre se o corpo (raio ~0,4 m) cabe no centro dele. */
GP._prepararNav = function (m) {
  const f = 2, W = Math.ceil(m.W / f), H = Math.ceil(m.H / f), passo = m.cel * f;
  const livre = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    livre[y * W + x] = GP.colide(m, (x + 0.5) * passo, (y + 0.5) * passo, 0.42) ? 0 : 1;
  m.nav = {W, H, passo, livre};
};
GP.navLivre = function (m, x, y) {
  const n = m.nav, cx = Math.floor(x / n.passo), cy = Math.floor(y / n.passo);
  return cx >= 0 && cy >= 0 && cx < n.W && cy < n.H && n.livre[cy * n.W + cx] === 1;
};
/* o bloco livre mais perto de um ponto (o ponto pode cair numa quina) */
GP._navPerto = function (m, x, y) {
  const n = m.nav, cx = Math.floor(x / n.passo), cy = Math.floor(y / n.passo);
  for (let r = 0; r < 12; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const X = cx + dx, Y = cy + dy;
      if (X >= 0 && Y >= 0 && X < n.W && Y < n.H && n.livre[Y * n.W + X]) return Y * n.W + X;
    }
  return -1;
};
GP.caminho = function (m, ax, ay, bx, by) {
  const n = m.nav, W = n.W;
  const ini = GP._navPerto(m, ax, ay), fim = GP._navPerto(m, bx, by);
  if (ini < 0 || fim < 0) return null;
  const g = new Float32Array(W * n.H).fill(Infinity), de = new Int32Array(W * n.H).fill(-1);
  const fechado = new Uint8Array(W * n.H);
  const fx = fim % W, fy = (fim / W) | 0;
  const h = i => { const dx = Math.abs(i % W - fx), dy = Math.abs(((i / W) | 0) - fy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  /* heap binário simples */
  const heap = [], pri = [];
  const push = (i, p) => { heap.push(i); pri.push(p); let k = heap.length - 1;
    while (k > 0) { const pa = (k - 1) >> 1; if (pri[pa] <= pri[k]) break;
      [heap[pa], heap[k]] = [heap[k], heap[pa]]; [pri[pa], pri[k]] = [pri[k], pri[pa]]; k = pa; } };
  const pop = () => { const top = heap[0], ult = heap.pop(), up = pri.pop();
    if (heap.length) { heap[0] = ult; pri[0] = up; let k = 0;
      for (;;) { const a = 2 * k + 1, b = a + 1; let s = k;
        if (a < heap.length && pri[a] < pri[s]) s = a; if (b < heap.length && pri[b] < pri[s]) s = b;
        if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; [pri[s], pri[k]] = [pri[k], pri[s]]; k = s; } }
    return top; };
  g[ini] = 0; push(ini, h(ini));
  const viz = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let achou = false, guarda = 0;
  while (heap.length && guarda++ < 60000) {
    const i = pop();
    if (fechado[i]) continue;
    if (i === fim) { achou = true; break; }
    fechado[i] = 1;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy, custo] of viz) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= n.H) continue;
      const j = Y * W + X;
      if (!n.livre[j] || fechado[j]) continue;
      if (dx && dy && (!n.livre[y * W + X] || !n.livre[Y * W + x])) continue; /* sem cortar quina */
      const ng = g[i] + custo;
      if (ng < g[j]) { g[j] = ng; de[j] = i; push(j, ng + h(j)); }
    }
  }
  if (!achou) return null;
  const pts = [];
  for (let i = fim; i !== -1; i = de[i]) pts.push({x: (i % W + 0.5) * n.passo, y: (((i / W) | 0) + 0.5) * n.passo});
  pts.reverse();
  /* encurta: pula pontos enquanto houver linha livre com folga de corpo */
  const curto = [pts[0]];
  let k = 0;
  while (k < pts.length - 1) {
    let j = pts.length - 1;
    while (j > k + 1 && !GP._corredorLivre(m, pts[k], pts[j])) j--;
    curto.push(pts[j]); k = j;
  }
  curto.push({x: bx, y: by});
  return curto;
};
GP._corredorLivre = function (m, a, b) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), d = Math.hypot(b.x - a.x, b.y - a.y);
  const ox = -Math.sin(ang) * 0.4, oy = Math.cos(ang) * 0.4;
  return GP.linhaLivre(m, a.x, a.y, b.x, b.y) &&
    GP.linhaLivre(m, a.x + ox, a.y + oy, b.x + ox, b.y + oy) &&
    GP.linhaLivre(m, a.x - ox, a.y - oy, b.x - ox, b.y - oy) && d < 80;
};
/* um ponto de chão sorteado (para a IA e para o duelo sem spawn definido) */
GP.pontoLivre = function (m, rnd) {
  const n = m.nav;
  for (let t = 0; t < 4000; t++) {
    const i = Math.floor(rnd() * n.W * n.H);
    if (n.livre[i]) return {x: (i % n.W + 0.5) * n.passo, y: (((i / n.W) | 0) + 0.5) * n.passo};
  }
  return {x: m.larguraM / 2, y: m.alturaM / 2};
};

/* RNG com semente (mulberry32): o gameplay é reproduzível nos testes */
GP.rng = function (semente) {
  let a = semente >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
