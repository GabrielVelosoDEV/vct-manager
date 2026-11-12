/* ============================================================
   GAMEPLAY · ARMAS
   Números de dano, cadência, pente e recarga seguem a tabela
   pública do Valorant. O erro (spread) foi ajustado para a visão
   de cima: com o mouse, mirar no centro de um ponto é fácil; o
   que separa um jogador bom é parar para atirar, controlar a
   rajada e acertar a cabeça.
   dano: [cabeça, corpo, perna] por faixa de distância (até m).
   erro em graus: parado no 1º tiro; correndo; por tiro da rajada.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.ARMAS = {
  classic: {nome: 'Classic', tipo: 'pistola', preco: 0, cadencia: 6.75, pente: 12, reserva: 36, recarga: 1.75, equipa: 0.75,
    dano: [{ate: 30, v: [78, 26, 22]}, {ate: 999, v: [66, 22, 18]}],
    erro: {base: 0.55, mov: 2.2, rajada: 0.9, max: 4.5, recupera: 0.35}, auto: false, velMult: 1.0},
  ghost: {nome: 'Ghost', tipo: 'pistola', preco: 500, cadencia: 6.75, pente: 15, reserva: 45, recarga: 1.5, equipa: 0.75,
    dano: [{ate: 30, v: [105, 30, 25]}, {ate: 999, v: [88, 25, 21]}],
    erro: {base: 0.4, mov: 2.0, rajada: 0.8, max: 4, recupera: 0.3}, auto: false, velMult: 1.0},
  sheriff: {nome: 'Sheriff', tipo: 'pistola', preco: 800, cadencia: 4, pente: 6, reserva: 24, recarga: 2.25, equipa: 1.0,
    dano: [{ate: 30, v: [159, 55, 46]}, {ate: 999, v: [145, 50, 43]}],
    erro: {base: 0.35, mov: 3.0, rajada: 2.4, max: 6, recupera: 0.45}, auto: false, velMult: 1.0},
  spectre: {nome: 'Spectre', tipo: 'smg', preco: 1600, cadencia: 13.33, pente: 30, reserva: 90, recarga: 2.25, equipa: 0.75,
    dano: [{ate: 20, v: [78, 26, 22]}, {ate: 999, v: [66, 22, 18]}],
    erro: {base: 0.6, mov: 1.6, rajada: 0.35, max: 4.5, recupera: 0.3}, auto: true, velMult: 1.0},
  phantom: {nome: 'Phantom', tipo: 'rifle', preco: 2900, cadencia: 11, pente: 30, reserva: 60, recarga: 2.5, equipa: 1.0,
    dano: [{ate: 15, v: [156, 39, 33]}, {ate: 30, v: [140, 35, 29]}, {ate: 999, v: [124, 31, 26]}],
    erro: {base: 0.28, mov: 4.0, rajada: 0.38, max: 5, recupera: 0.4}, auto: true, velMult: 1.0},
  vandal: {nome: 'Vandal', tipo: 'rifle', preco: 2900, cadencia: 9.75, pente: 25, reserva: 50, recarga: 2.5, equipa: 1.0,
    dano: [{ate: 999, v: [160, 40, 34]}],
    erro: {base: 0.3, mov: 4.4, rajada: 0.48, max: 5.5, recupera: 0.42}, auto: true, velMult: 1.0},
  operator: {nome: 'Operator', tipo: 'sniper', preco: 4700, cadencia: 0.6, pente: 5, reserva: 10, recarga: 3.7, equipa: 1.5,
    dano: [{ate: 999, v: [255, 150, 127]}],
    erro: {base: 3.5, mov: 9, rajada: 0, max: 9, recupera: 1.2, mira: 0.05}, auto: false, velMult: 0.92, luneta: true},
};
GP.ORDEM_ARMAS = ['classic', 'ghost', 'sheriff', 'spectre', 'phantom', 'vandal', 'operator'];

GP.danoArma = function (arma, dist, parte) {
  const faixa = arma.dano.find(f => dist <= f.ate) || arma.dano[arma.dano.length - 1];
  return faixa.v[parte];
};

/* Velocidades (m/s): a corrida do Valorant com faca é 6,75 — aqui vale para
   todas as armas, porque visto de cima a corrida mais lenta parecia arrastada.
   Andar (Shift) é silencioso; agachar é mais lento e mais preciso. */
GP.VEL = {corre: 6.75, anda: 3.6, agacha: 2.4};
GP.ESCUDOS = {nenhum: 0, leve: 25, pesado: 50};
