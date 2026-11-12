/* ============================================================
   GAMEPLAY · O DESENHO (canvas, visão de cima)
   O mapa é desenhado uma vez numa tela grande (fora da vista) e
   recortado pela câmera a cada quadro. Por cima: sons, tiros,
   agentes, a névoa (o que o seu cone não vê fica escuro) e a mira.
   Render não muda o estado do jogo.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.PX_M = 20;            /* resolução da tela do mapa: pixels por metro */

GP._hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
GP._hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* tamanho de uma repetição da textura, em metros */
GP.TEXTURA_PISO_M = 3.5;
GP.TEXTURA_PAREDE_M = 3;
/* texturas com desenho grande (faixas de pedestre, marcas no chão) pedem repetição maior */
GP.TEXTURA_ESCALA = {split: {piso: 9}};
/* as duas texturas do mapa, se já chegaram e carregaram */
GP.texturasDoMapa = function (nome) {
  const t = GP.manifesto ? GP.manifesto().texturas || {} : {};
  const a = t[nome + '_piso'], b = t[nome + '_parede'];
  const ia = a && GP.imagem(a.src), ib = b && GP.imagem(b.src);
  return ia && ib ? {piso: ia, parede: ib} : null;
};
/* Os blocos de parede soltos no meio do chão (as caixas do minimapa) viram
   objetos de cobertura com imagem: caixa, caixas, contêiner, mureta ou sacos.
   Só o desenho muda: a colisão e a visão continuam as da grade. */
GP.coberturas = function (m) {
  if (m._cob) return m._cob;
  const {W, H} = m, visto = new Uint8Array(W * H), out = [];
  for (let i = 0; i < W * H; i++) {
    if (!m.solido[i] || visto[i]) continue;
    const fila = [i]; visto[i] = 1; let borda = false, n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (fila.length) {
      const k = fila.pop(), x = k % W, y = (k / W) | 0; n++;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) borda = true;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      if (n > 400) borda = true;
      for (const j of [k - 1, k + 1, k - W, k + W]) if (j >= 0 && j < W * H && m.solido[j] && !visto[j] && Math.abs((j % W) - x) <= 1) { visto[j] = 1; fila.push(j); }
    }
    if (borda || n < 3 || n > 220) continue;
    const c = m.cel, w = (x1 - x0 + 1) * c, h = (y1 - y0 + 1) * c;
    const longo = Math.max(w, h), curto = Math.min(w, h), razao = longo / curto;
    let tipo = razao >= 1.8 ? (longo >= 5 ? 'conteiner' : curto <= 1.2 ? (GP._hash(x0, y0) < 0.5 ? 'barreira' : 'sacos') : 'caixa2')
      : (n <= 20 ? 'caixa' : 'caixa2');
    out.push({tipo, x: x0 * c, y: y0 * c, w, h, deitado: h > w * 1.15});
  }
  return (m._cob = out);
};
GP._objetosDeCobertura = function (g, m, S) {
  const ob = GP.manifesto ? GP.manifesto().objetos || {} : {};
  for (const o of GP.coberturas(m)) {
    const ent = ob[o.tipo] || ob.caixa; if (!ent) continue;
    const im = GP.imagem(ent.src); if (!im) continue;
    const f = 0.12;
    g.save(); g.translate((o.x + o.w / 2) * S, (o.y + o.h / 2) * S);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect((-o.w / 2 + 0.25) * S, (-o.h / 2 + 0.3) * S, o.w * S, o.h * S);
    if (o.deitado) g.rotate(Math.PI / 2);
    const w = (o.deitado ? o.h : o.w) + f, h = (o.deitado ? o.w : o.h) + f;
    g.drawImage(im, -w / 2 * S, -h / 2 * S, w * S, h * S);
    g.restore();
  }
};

GP.desenharMapa = function (m) {
  const tema = GP.TEMAS[m.nome] || GP.TEMAS.ascent;
  const {W, H} = m, S = GP.PX_M, c = m.cel;
  const [c1, c2, pa, to, fu, si] = [tema.chao, tema.chao2, tema.parede, tema.topo, tema.fundo, tema.sitio].map(GP._hex);
  /* campos por célula: sólido, distância até o piso (dentro da parede), bomb */
  const sol = new Float32Array(W * H), dist = new Float32Array(W * H), sit = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { sol[i] = m.solido[i]; sit[i] = m.sitio[i] ? 1 : 0; dist[i] = m.solido[i] ? 99 : 0; }
  for (let passo = 0; passo < 8; passo++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!m.solido[i]) continue;
    let d = dist[i];
    if (x > 0) d = Math.min(d, dist[i - 1] + 1); if (x < W - 1) d = Math.min(d, dist[i + 1] + 1);
    if (y > 0) d = Math.min(d, dist[i - W] + 1); if (y < H - 1) d = Math.min(d, dist[i + W] + 1);
    dist[i] = d;
  }
  /* amostra bilinear de um campo em coordenada de célula */
  const bil = (f, u, v) => {
    u -= 0.5; v -= 0.5;
    let x0 = Math.floor(u), y0 = Math.floor(v); const fx = u - x0, fy = v - y0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? (f === sol ? 1 : f === dist ? 9 : 0) : f[y * W + x];
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  };
  const tela = document.createElement('canvas');
  const TW = tela.width = Math.round(W * c * S), TH = tela.height = Math.round(H * c * S);
  const g = tela.getContext('2d'), img = g.createImageData(TW, TH), d = img.data;
  /* Com textura do mapa: o piso e o topo da parede vêm das imagens, e por cima
     vai uma camada nossa com sombra, fundo escuro, tinta do bomb e contornos.
     A imagem é só desenhada (nunca lida de volta): funciona em file://. */
  const tx = GP.texturasDoMapa(m.nome);
  const ov = tx ? g.createImageData(TW, TH) : null, od = ov && ov.data;
  const mk = tx ? g.createImageData(TW, TH) : null, md = mk && mk.data;
  const kc = 1 / (c * S);
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    const u = (px + 0.5) * kc, v = (py + 0.5) * kc, wx = (px + 0.5) / S, wy = (py + 0.5) / S;
    const s = bil(sol, u, v), o = (py * TW + px) * 4;
    let r, gg, b;
    if (s > 0.5) {
      /* parede: beirada clara colada no piso, corpo escuro e o fundo */
      const dd = bil(dist, u, v);
      const n = 0.94 + 0.1 * GP._hash(Math.floor(wx), Math.floor(wy));
      if (dd < 1.25) { r = to[0]; gg = to[1]; b = to[2]; const l = dd < 0.55 ? 1.12 : 1; r *= l; gg *= l; b *= l; }
      else { const t = Math.min(1, (dd - 1.25) / 4); r = (pa[0] * (1 - t) + fu[0] * t) * n; gg = (pa[1] * (1 - t) + fu[1] * t) * n; b = (pa[2] * (1 - t) + fu[2] * t) * n; }
      if (ov) {
        md[o + 3] = 255;
        /* a textura do topo vale na beirada (~1,5 m); mais fundo, escurece até o fundo */
        const t = Math.max(0, Math.min(1, (dd - 2.2) / 3));
        if (dd < 0.45) { od[o] = od[o + 1] = od[o + 2] = 255; od[o + 3] = 55; }
        else { od[o] = fu[0]; od[o + 1] = fu[1]; od[o + 2] = fu[2]; od[o + 3] = Math.round(255 * (0.12 + 0.88 * t)); }
      }
    } else {
      /* piso em lajotas de 2 m */
      const tx2 = Math.floor(wx / 2), ty2 = Math.floor(wy / 2);
      const base = (tx2 + ty2) & 1 ? c1 : c2;
      let k = 0.97 + 0.07 * GP._hash(tx2, ty2) + 0.025 * (GP._hash(Math.floor(wx * 2), Math.floor(wy * 2)) - 0.5);
      const jx = wx - tx2 * 2, jy = wy - ty2 * 2;
      if (jx < 0.07 || jy < 0.07) k *= 0.9;
      /* canto escuro perto da parede e sombra projetada (luz de baixo à direita) */
      const ao = 0.32 * Math.min(1, s * 2) * Math.min(1, s * 2), sombra = 0.3 * Math.min(1, bil(sol, u - 0.55, v - 0.8));
      k *= (1 - ao) * (1 - sombra);
      r = base[0] * k; gg = base[1] * k; b = base[2] * k;
      /* com textura: um véu escuro leve no piso todo, para o boneco destacar */
      if (ov) { od[o + 3] = Math.round(255 * (1 - (1 - 0.14) * (1 - ao * 1.2) * (1 - sombra * 1.4))); }
      const st = bil(sit, u, v);
      if (st > 0.02) {
        const a = 0.3 * Math.min(1, st * 1.4);
        r = r * (1 - a) + si[0] * a; gg = gg * (1 - a) + si[1] * a; b = b * (1 - a) + si[2] * a;
        if (ov) { const a0 = od[o + 3] / 255, a2 = a * 0.8, at = a0 + a2 * (1 - a0);
          od[o] = si[0] * a2 / Math.max(.01, at); od[o + 1] = si[1] * a2 / Math.max(.01, at); od[o + 2] = si[2] * a2 / Math.max(.01, at); od[o + 3] = Math.round(at * 255); }
        /* contorno tracejado da área de planta */
        if (st > 0.3 && st < 0.7 && ((wx + wy) * 1.6 % 1) < 0.55) {
          r = si[0]; gg = si[1]; b = si[2];
          if (ov) { od[o] = si[0]; od[o + 1] = si[1]; od[o + 2] = si[2]; od[o + 3] = 230; }
        }
      }
    }
    d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
  }
  if (!tx) g.putImageData(img, 0, 0);
  else {
    const camada = dados => { const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; cv.getContext('2d').putImageData(dados, 0, 0); return cv; };
    const padrao = (im, metros) => { const p = g.createPattern(im, 'repeat'); const k = metros * S / im.width; p.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0])); return p; };
    const esc = GP.TEXTURA_ESCALA[m.nome] || {};
    g.fillStyle = padrao(tx.piso, esc.piso || GP.TEXTURA_PISO_M); g.fillRect(0, 0, TW, TH);
    const pa2 = document.createElement('canvas'); pa2.width = TW; pa2.height = TH;
    const pg = pa2.getContext('2d');
    pg.fillStyle = padrao(tx.parede, esc.parede || GP.TEXTURA_PAREDE_M); pg.fillRect(0, 0, TW, TH);
    pg.globalCompositeOperation = 'destination-in'; pg.drawImage(camada(mk), 0, 0);
    g.drawImage(pa2, 0, 0);
    g.drawImage(camada(ov), 0, 0);
  }
  GP._objetosDeCobertura(g, m, S);
  /* minimapa: uma célula por pixel */
  const mini = document.createElement('canvas'); mini.width = W; mini.height = H;
  const mg = mini.getContext('2d'), mi = mg.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const cor = m.solido[i] ? (dist[i] < 2 ? to : fu) : m.sitio[i] ? si.map((x, j) => x * 0.5 + c1[j] * 0.5) : c1;
    mi.data[i * 4] = cor[0]; mi.data[i * 4 + 1] = cor[1]; mi.data[i * 4 + 2] = cor[2]; mi.data[i * 4 + 3] = 255;
  }
  mg.putImageData(mi, 0, 0);
  /* área de planta: contorno e letra pintada no chão */
  for (const L in m.sitios) {
    const st = m.sitios[L];
    g.save();
    g.font = `${Math.round(9 * S)}px "Bebas Neue", Impact, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = tema.sitio; g.globalAlpha = 0.22;
    g.fillText(L.toUpperCase(), st.x * S, st.y * S);
    g.restore();
  }
  /* spawns */
  if (m.spawn) for (const [lado, cor] of [['atk', '#ff4655'], ['def', '#18e5b4']]) {
    const p = m.spawn[lado], gr = g.createRadialGradient(p.x * S, p.y * S, 0, p.x * S, p.y * S, 7 * S);
    gr.addColorStop(0, cor + '40'); gr.addColorStop(1, cor + '00');
    g.fillStyle = gr; g.fillRect((p.x - 7) * S, (p.y - 7) * S, 14 * S, 14 * S);
  }
  /* nomes das áreas, bem discretos */
  g.save(); g.font = `600 ${Math.round(0.95 * S)}px Inter, system-ui, sans-serif`; g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,.2)';
  for (const a of m.areas) if (a.nome) g.fillText(a.nome.toUpperCase(), a.x * S, a.y * S - 1.2 * S);
  g.restore();
  return {tela, mini, tema};
};

/* ---------- visão: o polígono do que o cone enxerga ---------- */
GP.poligonoVisao = function (J, e, alcance) {
  const m = J.m, fov = e.p.fov * Math.PI / 180, pts = [];
  const passo = 0.35 * Math.PI / 180;
  const a0 = e.ang - fov / 2, n = Math.ceil(fov / passo);
  pts.push([e.x, e.y]);
  for (let i = 0; i <= n; i++) {
    const a = a0 + i * fov / n, d = GP.raio(m, e.x, e.y, a, alcance);
    pts.push([e.x + Math.cos(a) * d, e.y + Math.sin(a) * d]);
  }
  return pts;
};

/* ---------- o quadro ---------- */
GP.render = function (R, J, cam, ui) {
  const g = R.g, Wc = R.cv.width, Hc = R.cv.height, esc = cam.escala, S = GP.PX_M;
  const eu = J.eu, tema = R.arte.tema;
  const W2S = (x, y) => [(x - cam.x) * esc + Wc / 2, (y - cam.y) * esc + Hc / 2];
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = tema.fundo; g.fillRect(0, 0, Wc, Hc);
  /* mapa */
  const vw = Wc / esc, vh = Hc / esc;
  const sx = (cam.x - vw / 2) * S, sy = (cam.y - vh / 2) * S;
  g.imageSmoothingEnabled = true;
  g.drawImage(R.arte.tela, sx, sy, vw * S, vh * S, 0, 0, Wc, Hc);
  g.imageSmoothingEnabled = true;
  g.setTransform(esc, 0, 0, esc, Wc / 2 - cam.x * esc, Hc / 2 - cam.y * esc);

  /* sons que você ouve (passos e tiros de quem você não vê) */
  for (const s of J.sons) {
    if (s.time === eu.time) continue;
    const dono = J.ents.find(o => o.id === s.dono);
    if (dono && dono._visivel) continue;
    const d = Math.hypot(s.x - eu.x, s.y - eu.y);
    if (d > s.r) continue;
    const idade = (J.t - s.t) / 1.2, j = GP._hash(Math.round(s.t * 100), 7) * 2 - 1, j2 = GP._hash(7, Math.round(s.t * 100)) * 2 - 1;
    const erro = s.tiro ? 1.2 : 2.2;
    g.strokeStyle = s.tiro ? `rgba(255,200,120,${0.75 * (1 - idade)})` : `rgba(255,90,100,${0.6 * (1 - idade)})`;
    g.lineWidth = 0.12;
    g.beginPath(); g.arc(s.x + j * erro, s.y + j2 * erro, 0.4 + idade * (s.tiro ? 3.2 : 2.2), 0, Math.PI * 2); g.stroke();
  }
  /* rastros dos tiros */
  for (const t of J.tiros) {
    const vis = t.dono === eu.id || (J.ents.find(o => o.id === t.dono) || {})._visivel;
    if (!vis) continue;
    const a = 1 - (J.t - t.t) / 0.25;
    g.strokeStyle = t.time === eu.time ? `rgba(255,236,170,${0.85 * a})` : `rgba(255,120,120,${0.85 * a})`;
    g.lineWidth = 0.06;
    g.beginPath(); g.moveTo(t.x0, t.y0); g.lineTo(t.x1, t.y1); g.stroke();
    if (J.t - t.t < 0.05) { g.fillStyle = 'rgba(255,230,160,.9)'; g.beginPath(); g.arc(t.x0, t.y0, 0.22, 0, Math.PI * 2); g.fill(); }
  }
  for (const k of J.marcas) if (k.tipo === 'parede') {
    const a = 1 - (J.t - k.t) / 0.9;
    g.fillStyle = `rgba(230,220,200,${0.6 * a})`;
    g.beginPath(); g.arc(k.x, k.y, 0.1 + (1 - a) * 0.25, 0, Math.PI * 2); g.fill();
  }
  /* agentes */
  /* quem está de pé é desenhado de cima para baixo (quem está mais embaixo
     na tela fica na frente) */
  const vivos = J.ents.filter(o => o.vivo && (o === eu || o._visivel)).sort((a, b) => a.y - b.y);
  for (const o of J.ents) {
    if (o === eu) continue;
    if (o.vivo && o._visivel) continue;
    else if (o.vivo && o._vistoEm && J.t - o._vistoEm < 1.1) {
      /* último lugar em que você o viu */
      g.globalAlpha = 0.35 * (1 - (J.t - o._vistoEm) / 1.1);
      g.strokeStyle = '#ff4655'; g.lineWidth = 0.08; g.setLineDash([0.2, 0.15]);
      g.beginPath(); g.arc(o._vistoX, o._vistoY, o.raio, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.globalAlpha = 1;
    } else if (!o.vivo && o._morreuEm && J.t - o._morreuEm < 4 && GP.linhaLivre(J.m, eu.x, eu.y, o.x, o.y)) GP._corpo(g, o, J.t);
  }
  if (!eu.vivo) GP._corpo(g, eu, J.t);
  for (const o of vivos) GP._agente(g, o, o === eu ? '#18e5b4' : '#ff4655', 1, J.t);

  /* névoa: escurece o que o cone não vê */
  if (eu.vivo) {
    const f = R.fog, fg = R.fg;
    fg.setTransform(1, 0, 0, 1, 0, 0);
    fg.globalCompositeOperation = 'source-over';
    fg.clearRect(0, 0, Wc, Hc);
    fg.fillStyle = 'rgba(4,7,10,.66)'; fg.fillRect(0, 0, Wc, Hc);
    fg.setTransform(esc, 0, 0, esc, Wc / 2 - cam.x * esc, Hc / 2 - cam.y * esc);
    fg.globalCompositeOperation = 'destination-out';
    const pol = ui.poligono;
    const gr = fg.createRadialGradient(eu.x, eu.y, 1, eu.x, eu.y, GP.ALCANCE_VISTA * (eu.luneta ? 1.4 : 1));
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,.6)');
    fg.fillStyle = gr;
    fg.beginPath(); fg.moveTo(pol[0][0], pol[0][1]); for (let i = 1; i < pol.length; i++) fg.lineTo(pol[i][0], pol[i][1]); fg.closePath(); fg.fill();
    fg.fillStyle = 'rgba(0,0,0,.85)'; fg.beginPath(); fg.arc(eu.x, eu.y, 2.5, 0, Math.PI * 2); fg.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(f, 0, 0);
    g.setTransform(esc, 0, 0, esc, Wc / 2 - cam.x * esc, Hc / 2 - cam.y * esc);
  }
  /* números de dano e marcas de acerto (por cima da névoa) */
  for (const k of J.marcas) if (k.tipo === 'acerto' && (k.de === eu.id || k.em === eu.id)) {
    const a = 1 - (J.t - k.t) / 0.9;
    g.save(); g.globalAlpha = a;
    g.font = `700 ${k.parte === 0 ? 0.9 : 0.7}px Inter, sans-serif`; g.textAlign = 'center';
    g.fillStyle = k.em === eu.id ? '#ff4655' : k.parte === 0 ? '#ffd166' : '#ffffff';
    g.fillText(String(k.dano), k.x + 0.6, k.y - 0.7 - (1 - a) * 0.8);
    g.restore();
  }
  /* indicador de inimigo visto fora da tela */
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const o of J.ents) {
    if (o === eu || !o.vivo || !o._visivel) continue;
    const [px, py] = W2S(o.x, o.y);
    if (px > 0 && py > 0 && px < Wc && py < Hc) continue;
    /* seta na borda da tela, na direção dele */
    const a = Math.atan2(py - Hc / 2, px - Wc / 2), m = 34 * R.dpr;
    const kx = (Wc / 2 - m) / Math.max(1e-6, Math.abs(Math.cos(a))), ky = (Hc / 2 - m) / Math.max(1e-6, Math.abs(Math.sin(a)));
    const r = Math.min(kx, ky);
    const x = Wc / 2 + Math.cos(a) * r, y = Hc / 2 + Math.sin(a) * r;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#ff4655';
    g.beginPath(); g.moveTo(14 * R.dpr, 0); g.lineTo(-8 * R.dpr, 9 * R.dpr); g.lineTo(-8 * R.dpr, -9 * R.dpr); g.closePath(); g.fill(); g.restore();
  }
  /* mira com o círculo do erro atual */
  if (eu.vivo && ui.mouse) {
    const mx = ui.mouse.x * R.dpr, my = ui.mouse.y * R.dpr;
    const [ex, ey] = W2S(eu.x, eu.y);
    const dist = Math.hypot(mx - ex, my - ey);
    const erro = GP.erroAtual(eu, J.t) * Math.PI / 180;
    const r = Math.max(5 * R.dpr, Math.tan(erro / 2) * dist);
    const cor = eu.recarregaAte ? 'rgba(255,255,255,.4)' : '#eafff9';
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3 * R.dpr;
    g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = cor; g.lineWidth = 1.4 * R.dpr;
    g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = cor; g.fillRect(mx - 1.5 * R.dpr, my - 1.5 * R.dpr, 3 * R.dpr, 3 * R.dpr);
    /* marca de acerto: X branco, dourado na cabeça */
    const hit = J.marcas.filter(k => k.tipo === 'acerto' && k.de === eu.id && J.t - k.t < 0.18).pop();
    if (hit) {
      g.strokeStyle = hit.parte === 0 ? '#ffd166' : '#ffffff'; g.lineWidth = 2 * R.dpr;
      const k = 7 * R.dpr, k2 = 13 * R.dpr; g.beginPath();
      for (const [sx2, sy2] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { g.moveTo(mx + sx2 * k, my + sy2 * k); g.lineTo(mx + sx2 * k2, my + sy2 * k2); }
      g.stroke();
    }
  }
  /* minimapa */
  GP._minimapa(R, J);
};

/* Boneco com imagem (se o agente já tem): em pé, virado para o lado da mira
   (espelha para a esquerda), pés numa sombra com a cor do time e uma setinha
   mostrando para onde ele olha. */
GP._sprite = function (g, o, cor, t, quadro) {
  if (!o.agente) return false;
  const ent = GP.agenteImg(o.agente, quadro) || (quadro !== 'caido' ? GP.agenteImg(o.agente, 'parado') : null);
  if (!ent) return false;
  const img = GP.imagem(ent.src);
  if (!img) return false;
  const ref = GP.agenteImg(o.agente, 'parado') || ent;
  const k = GP.BONECO_ALTURA_M / ref.h;
  const esq = Math.cos(o.ang) < 0;
  const pesY = o.y + (quadro === 'caido' ? 0.25 : GP.BONECO_PES_M);
  /* sombra e anel do time nos pés */
  g.save();
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.ellipse(o.x, pesY, 0.62, 0.26, 0, 0, Math.PI * 2); g.fill();
  if (o.vivo) {
    g.strokeStyle = cor; g.lineWidth = 0.09; g.globalAlpha = 0.9;
    g.beginPath(); g.ellipse(o.x, pesY, 0.56, 0.22, 0, 0, Math.PI * 2); g.stroke();
    const ax = o.x + Math.cos(o.ang) * 0.75, ay = pesY + Math.sin(o.ang) * 0.32;
    g.fillStyle = cor; g.beginPath();
    g.moveTo(ax + Math.cos(o.ang) * 0.22, ay + Math.sin(o.ang) * 0.1);
    g.lineTo(ax + Math.cos(o.ang + 2.3) * 0.16, ay + Math.sin(o.ang + 2.3) * 0.08);
    g.lineTo(ax + Math.cos(o.ang - 2.3) * 0.16, ay + Math.sin(o.ang - 2.3) * 0.08);
    g.closePath(); g.fill();
  }
  g.restore();
  g.save(); g.translate(o.x, pesY);
  if (esq) g.scale(-1, 1);
  if (quadro === 'caido') g.drawImage(img, -ent.cx * k, -ent.py * k, ent.w * k, ent.h * k);
  else g.drawImage(img, -ent.px * k, -ent.py * k, ent.w * k, ent.h * k);
  g.restore();
  return true;
};
GP._agente = function (g, o, cor, alfa, t) {
  if (GP._sprite(g, o, cor, t, GP.quadroDoAgente(o, t))) { GP._vidaInimigo(g, o); return; }
  /* sem imagem: o boneco simples, um pouco maior que o corpo de verdade */
  g.save(); g.translate(o.x, o.y); g.rotate(o.ang); g.scale(1.35, 1.35);
  g.globalAlpha = alfa;
  /* sombra, ombros, cabeça e arma */
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0.08, 0.1, o.raio * 1.05, o.raio * 1.05, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = cor; g.beginPath(); g.ellipse(0, 0, o.raio * 0.78, o.raio, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0d141b'; g.fillRect(o.raio * 0.2, 0.06, o.raio * 1.55, 0.13);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(0.02, 0, o.raio * 0.42, 0, Math.PI * 2); g.fill();
  g.fillStyle = cor; g.beginPath(); g.arc(0.02, 0, o.raio * 0.3, 0, Math.PI * 2); g.fill();
  g.restore();
  GP._vidaInimigo(g, o);
};
/* barra de vida curta para o inimigo */
GP._vidaInimigo = function (g, o) {
  if (o.time === 'eu' || o.hp >= 100) return;
  const y = o.agente && GP.agenteImg(o.agente, 'parado') ? o.y + GP.BONECO_PES_M - GP.BONECO_ALTURA_M - 0.25 : o.y - 0.95;
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(o.x - 0.5, y, 1, 0.12);
  g.fillStyle = '#ff4655'; g.fillRect(o.x - 0.5, y, o.hp / 100, 0.12);
};
GP._corpo = function (g, o, t) {
  if (GP._sprite(g, o, o.time === 'eu' ? '#18e5b4' : '#ff4655', t, 'caido')) return;
  g.save(); g.globalAlpha = 0.55; g.strokeStyle = o.time === 'eu' ? '#18e5b4' : '#ff4655'; g.lineWidth = 0.1;
  g.beginPath(); g.moveTo(o.x - 0.3, o.y - 0.3); g.lineTo(o.x + 0.3, o.y + 0.3); g.moveTo(o.x + 0.3, o.y - 0.3); g.lineTo(o.x - 0.3, o.y + 0.3); g.stroke();
  g.restore();
};
GP._minimapa = function (R, J) {
  const g = R.g, m = J.m, lado = 170 * R.dpr, k = lado / Math.max(m.larguraM, m.alturaM);
  const x0 = R.cv.width - lado - 14 * R.dpr, y0 = R.cv.height - lado * (m.alturaM / Math.max(m.larguraM, m.alturaM)) - 126 * R.dpr;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 0.85; g.imageSmoothingEnabled = false;
  g.drawImage(R.arte.mini, x0, y0, m.larguraM * k, m.alturaM * k);
  g.imageSmoothingEnabled = true; g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(x0 - 0.5, y0 - 0.5, m.larguraM * k + 1, m.alturaM * k + 1);
  for (const o of J.ents) {
    if (!o.vivo || (o !== J.eu && !o._visivel)) continue;
    g.fillStyle = o === J.eu ? '#18e5b4' : '#ff4655';
    g.beginPath(); g.arc(x0 + o.x * k, y0 + o.y * k, 3.2 * R.dpr, 0, Math.PI * 2); g.fill();
    if (o === J.eu) { g.strokeStyle = '#18e5b4'; g.lineWidth = 1.5 * R.dpr; g.beginPath(); g.moveTo(x0 + o.x * k, y0 + o.y * k);
      g.lineTo(x0 + (o.x + Math.cos(o.ang) * 9) * k, y0 + (o.y + Math.sin(o.ang) * 9) * k); g.stroke(); }
  }
  g.restore();
};
