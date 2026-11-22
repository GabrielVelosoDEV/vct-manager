/* ============================================================
   AJUSTES ESTRUTURAIS DOS MAPAS (Etapa 5)
   A grade vem dos minimapas (data/gameplay/mapas.js, gerado) e não se
   edita à mão. O equilíbrio entre ataque e defesa, medido com
   tools/balanco-gameplay.sh, pede mexer na estrutura de alguns mapas.
   Os ajustes entram por cima da grade aqui, em METROS:

     caixas       coberturas novas {x, y, w, h} (canto de cima à esquerda):
                  viram parede na grade (bloqueiam passo, bala e visão) e a
                  tela desenha cada uma como uma caixa do mapa
     cortePlanta  {x, y, r}: a área de planta perde as células a até r
                  metros do ponto — o bomb fica mais fundo, longe da entrada
                  do ataque, e a defesa chega antes
     planta       {x, y, w, h}: retângulo que deixa de ser área de planta

   Mapas que favoreciam o ataque (pós-plant quase sempre ganho) perderam
   um pedaço do bomb: em Bind, Abyss e no B de Icebox a ponta perto da
   entrada; em Pearl e no A de Icebox também o fundo (lá o plant fundo era o
   que segurava o pós-plant). Os que favoreciam a defesa (Sunset,
   Fracture, Haven) ganharam caixas para quem entra e segura o pós-plant.
   ============================================================ */
const AJUSTES_MAPAS = {
  pearl: {cortePlanta: [{x: 76.5, y: 60.5, r: 4.5}, {x: 9, y: 70, r: 5}]},
  bind: {cortePlanta: [{x: 21.9, y: 39.5, r: 6}, {x: 74.2, y: 47.8, r: 3.5}], caixas: [{x: 18, y: 30.5, w: 1.6, h: 1.6}, {x: 84, y: 36, w: 1.6, h: 1.6}]},
  icebox: {cortePlanta: [{x: 5, y: 75, r: 6}, {x: 14.6, y: 63.5, r: 4}, {x: 72.5, y: 48, r: 5}]},
  abyss: {cortePlanta: [{x: 15.6, y: 34.4, r: 4}, {x: 78.9, y: 52.9, r: 5.5}]},
  corrode: {caixas: [{x: 66, y: 34.5, w: 1.6, h: 1.6}, {x: 16.5, y: 33.5, w: 1.6, h: 1.6}]},
  haven: {caixas: [{x: 9, y: 54.5, w: 1.6, h: 1.6}, {x: 44.5, y: 56, w: 1.6, h: 1.6}, {x: 71.5, y: 55, w: 1.6, h: 1.6}]},
  sunset: {caixas: [{x: 77, y: 41, w: 1.6, h: 1.6}, {x: 5, y: 47.5, w: 1.6, h: 1.6}]},
  fracture: {caixas: [{x: 80, y: 35, w: 1.6, h: 1.6}]},
};
