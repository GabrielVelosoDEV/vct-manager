/* ============================================================
   GAMEPLAY · O VISUAL DE CADA MAPA
   Paleta própria (não copia arte da Riot), puxada do lugar onde
   cada mapa se passa. chao: piso; chao2: variação do piso;
   parede: o corpo da parede; topo: a beirada de cima; acento:
   detalhes, letra do bomb e spawn; sitio: tinta da área de planta.
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.TEMAS = {
  ascent:   {lugar: 'Veneza, Itália', clima: 'pedra clara, telhas e canais',
    chao: '#8a7d6a', chao2: '#958772', parede: '#2c2522', topo: '#6a4a3a', acento: '#d0763f', sitio: '#d2b25c', fundo: '#14110f'},
  bind:     {lugar: 'Rabat, Marrocos', clima: 'areia, arcos e teleportes',
    chao: '#a08560', chao2: '#ab8f69', parede: '#3a2a1e', topo: '#7a5536', acento: '#2fb3a5', sitio: '#e1c06a', fundo: '#18120c'},
  haven:    {lugar: 'Timbu, Butão', clima: 'mosteiro, madeira vermelha e musgo',
    chao: '#80806c', chao2: '#8a8a74', parede: '#2e2620', topo: '#7d3328', acento: '#c9563b', sitio: '#d8bb5a', fundo: '#121410'},
  split:    {lugar: 'Tóquio, Japão', clima: 'concreto, neon e cordas',
    chao: '#6f747d', chao2: '#787d86', parede: '#1d2029', topo: '#3c4152', acento: '#ff4f8b', sitio: '#d9c05e', fundo: '#0e1016'},
  icebox:   {lugar: 'Ilha Bennett, Rússia', clima: 'neve, contêineres e tirolesas',
    chao: '#9fb2bf', chao2: '#a9bcc8', parede: '#26394a', topo: '#4b6a82', acento: '#ef7d2d', sitio: '#e6cf6e', fundo: '#0d141b'},
  breeze:   {lugar: 'Triângulo das Bermudas', clima: 'areia, pedra clara e mar turquesa',
    chao: '#b6a67c', chao2: '#c0b086', parede: '#2c4239', topo: '#4f7a68', acento: '#25c3bd', sitio: '#efd36f', fundo: '#0d1715'},
  fracture: {lugar: 'Santa Fé, Novo México', clima: 'deserto rachado, laranja e azul',
    chao: '#97735a', chao2: '#a27c61', parede: '#34262b', topo: '#6b4a3d', acento: '#4c9be8', sitio: '#e6c062', fundo: '#140e0f'},
  pearl:    {lugar: 'Lisboa submersa, Portugal', clima: 'azulejo, coral e luz azul do fundo do mar',
    chao: '#71889a', chao2: '#7a91a3', parede: '#1b2c3a', topo: '#2f5a7a', acento: '#e0ae5c', sitio: '#dfc56c', fundo: '#0a121a'},
  lotus:    {lugar: 'Gates Ocidentais, Índia', clima: 'templo, ouro e mata',
    chao: '#808566', chao2: '#8a8f6f', parede: '#28301f', topo: '#5c6a3c', acento: '#d9a738', sitio: '#e8cc6a', fundo: '#10130c'},
  sunset:   {lugar: 'Los Angeles, EUA', clima: 'fim de tarde, laranja e roxo',
    chao: '#988073', chao2: '#a2897b', parede: '#2c1f2d', topo: '#5d3a58', acento: '#f39243', sitio: '#ecc867', fundo: '#120c12'},
  abyss:    {lugar: 'base secreta, Noruega', clima: 'aço, precipício e luz fria',
    chao: '#707c88', chao2: '#7a8693', parede: '#0f171e', topo: '#26343f', acento: '#3cc2d1', sitio: '#d6c26a', fundo: '#05090c'},
  corrode:  {lugar: 'Mont-Saint-Michel, França', clima: 'mina de sal, castelo e cristais roxos',
    chao: '#8e867d', chao2: '#989087', parede: '#2a2230', topo: '#5a4470', acento: '#a46cf0', sitio: '#dcc56e', fundo: '#0f0c12'},
  summit:   {lugar: 'Zhangjiajie, China', clima: 'pedra, montanha e templo vermelho',
    chao: '#83826f', chao2: '#8d8c78', parede: '#24301f', topo: '#4f5e3c', acento: '#cf4535', sitio: '#e2c463', fundo: '#0e120c'},
};
GP.NOME_MAPA = {ascent: 'Ascent', bind: 'Bind', haven: 'Haven', split: 'Split', icebox: 'Icebox', breeze: 'Breeze',
  fracture: 'Fracture', pearl: 'Pearl', lotus: 'Lotus', sunset: 'Sunset', abyss: 'Abyss', corrode: 'Corrode', summit: 'Summit'};
