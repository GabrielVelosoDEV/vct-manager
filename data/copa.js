/* ============================================================
   VALORANT WORLD CUP — os dados fixos
   ------------------------------------------------------------
   Copa de seleções de 2 em 2 anos, no fim da temporada. A primeira é
   em 2028; no ano anterior a cada Copa (ímpar), as eliminatórias.
   As sedes seguem esta ordem e recomeçam depois da 20ª edição.

   As 40 seleções são os países com mais jogadores reais na base
   (data/elencos.js). Os 20 primeiros fecham 7 só com reais; os outros
   completam com os agentes livres gerados que toda carreira nova já
   sorteia (core/selecoes.js orienta a nacionalidade deles).

   Continente: AMER (Américas), EMEA (Europa, Oriente Médio e África)
   e AP (Ásia-Pacífico, com a China). Decide os grupos das
   eliminatórias e o sorteio da Copa.
   ============================================================ */

const COPA_PRIMEIRA=2028;
const COPA_INTERVALO=2;
const COPA_VAGAS=32, COPA_CONVITES=16;

/* [código, nome da sede] — o código é o país da sede; Inglaterra sedia
   pelo Reino Unido (GB), que é a seleção */
const COPA_SEDES=[
  ['JP','Japão'],['BR','Brasil'],['US','Estados Unidos'],['CN','China'],['TR','Turquia'],
  ['GB','Inglaterra'],['FR','França'],['DE','Alemanha'],['ES','Espanha'],['AR','Argentina'],
  ['KR','Coreia do Sul'],['CA','Canadá'],['MX','México'],['SA','Arábia Saudita'],['RU','Rússia'],
  ['ID','Indonésia'],['IT','Itália'],['CL','Chile'],['IN','Índia'],['AU','Austrália']
];

/* as 40 seleções, na ordem de jogadores reais na base, com a sigla de três
   letras do placar e o continente */
const COPA_SELECOES=[
  ['CN','CHN','AP'],['KR','KOR','AP'],['BR','BRA','AMER'],['US','USA','AMER'],['TR','TUR','EMEA'],
  ['JP','JPN','AP'],['PH','PHI','AP'],['RU','RUS','EMEA'],['TH','THA','AP'],['CA','CAN','AMER'],
  ['CL','CHI','AMER'],['DE','GER','EMEA'],['PL','POL','EMEA'],['IN','IND','AP'],['FR','FRA','EMEA'],
  ['ES','ESP','EMEA'],['ID','INA','AP'],['TW','TPE','AP'],['SG','SGP','AP'],['MY','MAS','AP'],
  ['FI','FIN','EMEA'],['GB','GBR','EMEA'],['AU','AUS','AP'],['CZ','CZE','EMEA'],['AR','ARG','AMER'],
  ['MX','MEX','AMER'],['LT','LTU','EMEA'],['SE','SWE','EMEA'],['IT','ITA','EMEA'],['DK','DEN','EMEA'],
  ['CO','COL','AMER'],['UA','UKR','EMEA'],['SA','KSA','EMEA'],['NL','NED','EMEA'],['HK','HKG','AP'],
  ['GE','GEO','EMEA'],['SV','SLV','AMER'],['RO','ROU','EMEA'],['VN','VIE','AP'],['MD','MDA','EMEA']
];
const COPA_CONTINENTES={AMER:'Américas',EMEA:'EMEA',AP:'Ásia-Pacífico'};
/* convocação: 5 titulares e 5 reservas; abaixo de 7 o país não tem seleção */
const SELECAO_TAMANHO=10, SELECAO_MINIMO=7;
