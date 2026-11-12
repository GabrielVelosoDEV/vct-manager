/* ============================================================
   GAMEPLAY · OS AGENTES E AS IMAGENS DELES
   Lista dos 30 agentes com o papel de cada um, e o carregador das
   imagens que já chegaram (data/gameplay/imagens.js, gerado por
   tools/gameplay-imagens.py). Sem imagem, o jogo desenha o boneco
   simples de sempre — nada quebra se faltar arquivo.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.PAPEIS = {duelista: 'Duelista', iniciador: 'Iniciador', controlador: 'Controlador', sentinela: 'Sentinela'};
GP.AGENTES = {};
[
  ['duelista', 'jett:Jett phoenix:Phoenix reyna:Reyna raze:Raze yoru:Yoru neon:Neon iso:Iso waylay:Waylay hush:Hush'],
  ['iniciador', 'sova:Sova breach:Breach skye:Skye kayo:KAY/O fade:Fade gekko:Gekko tejo:Tejo'],
  ['controlador', 'brimstone:Brimstone viper:Viper omen:Omen astra:Astra harbor:Harbor clove:Clove miks:Miks'],
  ['sentinela', 'sage:Sage cypher:Cypher killjoy:Killjoy chamber:Chamber deadlock:Deadlock vyse:Vyse veto:Veto'],
].forEach(([papel, lista]) => lista.split(' ').forEach(par => {
  const [id, nome] = par.split(':');
  GP.AGENTES[id] = {id, nome, papel};
}));

/* ---------- imagens ---------- */
GP.IMG = {cache: {}, tintas: {}};
GP.manifesto = () => (typeof IMAGENS_GAMEPLAY !== 'undefined' ? IMAGENS_GAMEPLAY : {agentes: {}, armas: {}, efeitos: {}, objetos: {}, texturas: {}});
/* a <img> de um arquivo (criada na primeira vez); null enquanto não carregou */
GP.imagem = function (src) {
  if (!src || typeof Image === 'undefined') return null;
  let im = GP.IMG.cache[src];
  if (!im) { im = GP.IMG.cache[src] = new Image(); im.src = src; }
  return im.complete && im.naturalWidth ? im : null;
};
GP.temImagem = (grupo, id, peca) => {
  const g = GP.manifesto()[grupo] || {};
  return peca ? !!(g[id] && g[id][peca]) : !!g[id];
};
GP.agenteImg = (id, peca) => ((GP.manifesto().agentes || {})[id] || {})[peca] || null;
/* pré-carrega tudo de um agente (para não piscar no primeiro quadro) */
GP.precarregarAgente = function (id) {
  const a = (GP.manifesto().agentes || {})[id]; if (!a) return;
  for (const k in a) { GP.imagem(a[k].src); if (a[k].mascara) GP.imagem(a[k].mascara); }
};
/* Quadro do boneco com a faixa na cor do time: a base por baixo e a máscara
   pintada por cima (composição 'source-in', sem ler pixel — funciona em
   file:// e no app de PC). Fica guardado por agente, quadro e cor. */
GP.quadroTingido = function (ent, cor) {
  const base = GP.imagem(ent.src); if (!base) return null;
  if (!ent.mascara) return base;
  const masc = GP.imagem(ent.mascara); if (!masc) return base;
  const k = ent.src + '|' + cor;
  if (GP.IMG.tintas[k]) return GP.IMG.tintas[k];
  const tinta = document.createElement('canvas'); tinta.width = ent.w; tinta.height = ent.h;
  const t = tinta.getContext('2d');
  t.drawImage(masc, 0, 0, ent.w, ent.h);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = cor; t.fillRect(0, 0, ent.w, ent.h);
  const cv = document.createElement('canvas'); cv.width = ent.w; cv.height = ent.h;
  const g = cv.getContext('2d');
  g.drawImage(base, 0, 0, ent.w, ent.h);
  g.globalCompositeOperation = 'multiply'; g.drawImage(tinta, 0, 0);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(base, 0, 0, ent.w, ent.h);
  return (GP.IMG.tintas[k] = cv);
};
/* qual quadro mostrar agora (não muda o estado: só lê) */
GP.quadroDoAgente = function (o, t) {
  if (!o.vivo) return 'caido';
  if (t - o.ultimoTiro < 0.12) return 'tiro';
  const vel = Math.hypot(o.vx, o.vy);
  if (vel < 0.6) return 'parado';
  const ciclo = 0.42 * (GP.VEL.corre / Math.max(1.5, vel));
  return (t % ciclo) < ciclo / 2 ? 'passo1' : 'passo2';
};
/* tamanho do boneco no mundo: a largura dos ombros (o lado curto da imagem) = 1,25 m */
GP.BONECO_OMBROS_M = 1.25;
