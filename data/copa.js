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
  ['GE','GEO','EMEA'],['SV','SLV','AMER'],['RO','ROU','EMEA'],['VN','VIE','AP'],['PT','POR','EMEA']
];
/* formato da Copa: 8 grupos de 4 em MD3, os dois primeiros avançam; daí em
   diante (oitavas, quartas, semis, disputa do bronze e final) tudo em MD5 */
const COPA_GRUPOS=8, COPA_POR_GRUPO=4, COPA_AVANCAM=2;
const COPA_MD_GRUPOS=3, COPA_MD_PLAYOFFS=5;

/* ELIMINATÓRIAS (fim da temporada do ano ímpar)
   Convidadas: a sede da Copa seguinte e as 15 melhores do ranking no dia
   do sorteio. As outras 24 jogam as eliminatórias por 16 vagas:
     · 8 grupos de 3, em MD3, todos contra todos; os dois primeiros vão à Copa;
     · os grupos são continentais: cada continente divide as suas seleções
       em grupos de 3, com cabeças de chave pelo ranking (potes);
     · quem sobra num continente (1 ou 2) vai para o grupo intercontinental,
       com as sobras dos outros — a soma das sobras sempre fecha grupos de 3.
   Desempate: vitórias, saldo de mapas, saldo de rounds, confronto direto,
   ranking. */
const ELIM_POR_GRUPO=3, ELIM_AVANCAM=2, ELIM_MD=3;
const COPA_CONTINENTES={AMER:'Américas',EMEA:'EMEA',AP:'Ásia-Pacífico'};
/* convocação: 5 titulares e 5 reservas; abaixo de 7 o país não tem seleção */
const SELECAO_TAMANHO=10, SELECAO_MINIMO=7;

/* CALENDÁRIO — tudo em novembro, um jogo a cada dois dias, com a janela de
   transferências aberta (ela vai de novembro a janeiro): o mercado da
   pré-temporada corre junto. Cada data é [semana, dia], dia 0 = segunda.
   Com os dias da janela (core/clock.js, avancarTurno), os jogos saem no dia
   deles; num avanço de semana inteira, saem todos no fechamento dela.
     ano ímpar  sorteio das eliminatórias no domingo da semana 45; rodada 1
                na terça e na quinta da 46, rodada 2 no sábado; os 32 no
                domingo
     ano par    sorteio da Copa no domingo da 45; grupos na terça, quinta e
                sábado da 46; oitavas, quartas e semis na terça, quinta e
                sábado da 47; bronze no sábado e a final no domingo da 48 */
const ELIM_DIAS={sorteio:[45,6],r1:[[46,1],[46,3]],r2:[46,5],classificados:[46,6]};
const COPA_DIAS={sorteio:[45,6],g1:[46,1],g2:[46,3],g3:[46,5],
  oitavas:[47,1],quartas:[47,3],semis:[47,5],bronze:[48,5],final:[48,6]};

/* CORES DAS SELEÇÕES — [principal, secundária, terceira], das bandeiras e dos
   uniformes. A principal pinta a moldura da carta da seleção e o topo da
   página; a secundária vira o brilho; a terceira entra só na faixa. Os tons
   escuros de bandeira foram clareados para a moldura não sumir no fundo. */
const CORES_SELECAO={
  CN:['#DE2910','#FFDE00','#FFDE00'], KR:['#CD2E3A','#2A5FC9','#FFFFFF'], BR:['#009C3B','#FFDF00','#2A4FB0'],
  US:['#B22234','#4A5AA8','#FFFFFF'], TR:['#E30A17','#FFFFFF','#FFFFFF'], JP:['#BC002D','#FFFFFF','#FFFFFF'],
  PH:['#1F55C2','#FCD116','#CE1126'], RU:['#1F5BC4','#FFFFFF','#D52B1E'], TH:['#A51931','#F4F5F8','#2D3A8C'],
  CA:['#D80621','#FFFFFF','#FFFFFF'], CL:['#D52B1E','#FFFFFF','#1F4FB0'], DE:['#DD0000','#FFCE00','#1A1A1A'],
  PL:['#DC143C','#FFFFFF','#FFFFFF'], IN:['#FF9933','#FFFFFF','#138808'], FR:['#1F66C9','#FFFFFF','#EF4135'],
  ES:['#AA151B','#F1BF00','#F1BF00'], ID:['#CE1126','#FFFFFF','#FFFFFF'], TW:['#1A3FBF','#FFFFFF','#FE0000'],
  SG:['#EF3340','#FFFFFF','#FFFFFF'], MY:['#CC0001','#FFCC00','#1A2A99'], FI:['#1E5BB8','#FFFFFF','#FFFFFF'],
  GB:['#C8102E','#FFFFFF','#1E4FA8'], AU:['#00843D','#FFCD00','#FFCD00'], CZ:['#1F5AA8','#FFFFFF','#D7141A'],
  AR:['#5FA2DB','#FFFFFF','#F6B40E'], MX:['#006847','#FFFFFF','#CE1126'], LT:['#FDB913','#006A44','#C1272D'],
  SE:['#006AA7','#FECC00','#FECC00'], IT:['#1A5FC4','#FFFFFF','#009246'], DK:['#C8102E','#FFFFFF','#FFFFFF'],
  CO:['#FCD116','#1F4FB0','#CE1126'], UA:['#1F6FD1','#FFD700','#FFD700'], SA:['#0A8A45','#FFFFFF','#FFFFFF'],
  NL:['#FF6C00','#FFFFFF','#21468B'], HK:['#DE2910','#FFFFFF','#FFFFFF'], GE:['#E8112D','#FFFFFF','#FFFFFF'],
  SV:['#1A5BD1','#FFFFFF','#FFFFFF'], RO:['#1E4FB0','#FCD116','#CE1126'], VN:['#DA251D','#FFFF00','#FFFF00'],
  PT:['#C8102E','#FFE000','#006600']
};
