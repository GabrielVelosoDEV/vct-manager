/* ============================================================
   ORGANIZAÇÕES — dinheiro do dono e quem chega durante a carreira
   ------------------------------------------------------------
   Anotado por você na LISTA de escudos (11/11/2026).

   BOLSO: o quanto o dono põe no clube. 1 é o normal da divisão.
     pouco 0,75 · médio 1 · acima da média 1,3 · muito 1,7 ·
     muito, muito, muito 2,6
   Entra no caixa de largada e num aporte do dono a cada virada de
   temporada (core/organizacoes.js). Caixa maior é mercado maior: a
   IA contrata pelo caixa (core/market.js).

   ENTRANTES: organizações que compram a vaga de um clube (ou se
   fundem com ele) em algum momento da carreira. O clube continua o
   mesmo — elenco, títulos, histórico —, muda nome, sigla, escudo,
   dono, dinheiro e torcida. Cada uma acontece numa virada de
   temporada dentro da janela; até o último ano dela, com certeza.
   `logo` é o nome do arquivo em assets/logos (sem extensão).
   ============================================================ */
const BOLSO={pouco:0.75,medio:1,acima:1.3,muito:1.7,muitissimo:2.6};
const TORCIDA_PERFIL={pouca:{porte:2,fanatismo:0.45},media:{porte:3,fanatismo:0.65},muita:{porte:4,fanatismo:0.85}};

/* clubes que já nascem na base com dono de bolso diferente */
const ORGANIZACOES={
  WBG:{bolso:'muito'},
  CR:{bolso:'muito',torcida:'muita',logo:'crc',cor:'#D00D17'},
  GAM:{bolso:'medio',torcida:'media',cor:'#FEBF10'}
};

const ENTRANTES=[
  {de:'2G',  tipo:'fusao', nome:'paiN Gaming',         tag:'PAIN', logo:'paingaming',       pais:'BR', bolso:'medio', torcida:'muita', janela:[2027,2030]},
  {de:'SAD', tipo:'compra',nome:'9z Team',             tag:'9Z',   logo:'9zteam',           pais:'AR', bolso:'medio', torcida:'media', janela:[2027,2030]},
  {de:'NBG', tipo:'compra',nome:'Lyon Gaming',         tag:'LNS',  logo:'lns',              pais:'MX', bolso:'acima', torcida:'muita', janela:[2027,2030]},
  {de:'JL',  tipo:'compra',nome:'Ninjas in Pyjamas',   tag:'NIP',  logo:'ninjasinpyjamas',  pais:'SE', bolso:'pouco', torcida:'muita', janela:[2027,2030]},
  {de:'MISA',tipo:'compra',nome:'Team Falcons',        tag:'FLC',  logo:'falcons',          pais:'SA', bolso:'muitissimo',torcida:'pouca',janela:[2027,2030]},
  {de:'MDR', tipo:'fusao', nome:'FaZe Clan',           tag:'FAZE', logo:'fazeclan',         pais:'US', bolso:'medio', torcida:'muita', janela:[2027,2030]},
  {de:'MIR', tipo:'compra',nome:'Team Spirit',         tag:'SPT',  logo:'spirit',           pais:'RU', bolso:'acima', torcida:'muita', janela:[2027,2030]},
  {de:'FL',  tipo:'compra',nome:'Hanwha Life Esports', tag:'HLE',  logo:'hanwhalife',       pais:'KR', bolso:'muito', torcida:'pouca', janela:[2027,2030]}
];
