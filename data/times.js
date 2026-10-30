/* ---------- Organizações reais do circuito (editáveis no jogo) ----------
   Composição das quatro ligas franqueadas e do Tier 2, conforme a base do
   vlr.gg em 28/08/2026 (temporada VCT 2026 em andamento).

   Nome e tag: dados do vlr.
   Prestígio: no Tier 1, calibrado pelo aproveitamento real de 2026 — as
   últimas dez partidas de VCT de cada equipe, com encolhimento bayesiano
   para não superestimar amostra curta. No Tier 2 é estimativa, porque as
   ligas de Challengers de 2026 são sub-regionais e não dão um recorte
   comparável entre regiões.

   Nota de formato: em 2026 o Tier 2 não é uma liga de oito por região.
   Americas se divide em Challengers NA ACE, Brazil e LATAM Norte/Sul;
   Pacific em Korea WDG, Japan e Southeast Asia; China em National
   Tournament e Evolution Series. As oito equipes de cada região aqui são
   as de Challengers com presença confirmada em 2026 e roster publicado —
   escolha, não recorte oficial.

   Mudança pedida em 30/10/2026: a Aurora Gaming ocupa a vaga da PCIFIC
   no Tier 1 EMEA, com o elenco e a comissão que eram da NAVI Junior; a
   PCIFIC desce para o Challengers no lugar da NAVI Junior, levando o
   próprio elenco.                                                      */
const TIMES_REAIS={
 AMER:{
   t1:[['Sentinels','SEN',65],['NRG','NRG',85],
     ['LEVIATÁN','LEV',86],['G2 Esports','G2',76],
     ['LOUD','LOUD',75],['100 Thieves','100T',79],
     ['Cloud9','C9',65],['MIBR','MIBR',75],
     ['FURIA','FUR',64],['KRÜ Esports','KRÜ',66],
     ['Evil Geniuses','EG',70],['ENVY','ENVY',64]],
   t2:[['M80','M80',57],['Shopify Rebellion Black','SRB',55],
     ['RED Canids','RED',52],['Fluxo W7M','FX',51],
     ['2Game Esports','2G',54],['BESTIA','BST',50],
     ['SaD Esports','SAD',49],['Nightblood Gaming','NBG',47]]},
 EMEA:{
   t1:[['Team Heretics','TH',70],['FNATIC','FNC',65],
     ['GIANTX','GX',61],['Karmine Corp','KC',81],
     ['Team Liquid','TL',75],['Eternal Fire','EF',65],
     ['Team Vitality','VIT',73],['FUT Esports','FUT',81],
     ['BBL Esports','BBL',73],['Gentle Mates','M8',63],
     ['Natus Vincere','NAVI',63],['Aurora Gaming','AUR',58]],
   t2:[['Enterprise Esports','EP',58],['Fire Flux Esports','FF',57],
     ['Joblife','JL',55],['Eintracht Frankfurt','SGE',52],
     ['Misa Esports','MISA',50],['Mandatory','MDR',49],
     ['MIR','MIR',48],['PCIFIC Esports','PCF',53]]},
 PAC:{
   t1:[['Paper Rex','PRX',73],['T1','T1',76],
     ['Gen.G','GEN',81],['KIWOOM DRX','KRX',66],
     ['Global Esports','GE',78],['Nongshim RedForce','NS',76],
     ['Rex Regum Qeon','RRQ',63],['DetonatioN FocusMe','DFM',72],
     ['Team Secret','TS',61],['VARREL','VL',73],
     ['FULL SENSE','FS',64],['ZETA DIVISION','ZETA',65]],
   t2:[['ONSIDE GAMING','ONG',58],['Dplus Esports','DK',56],
     ['FENNEL','FL',54],['REJECT','RC',53],
     ['ARETE','ART',51],['Sharper Esports','SP',50],
     ['QT DIG∞','QTD',48],['Xipto Esports','XIP',46]]},
 CN:{
   t1:[['Nova Esports','NOVA',82],['TYLOO','TYL',78],
     ['JD Gaming','JDG',74],['Guangzhou Huadu Bilibili Gaming','BLG',74],
     ['Trace Esports','TE',70],['All Gamers','AG',70],
     ['Wuxi Titan Esports Club','TEC',70],['Xi Lai Gaming','XLG',72],
     ['EDward Gaming','EDG',72],['FunPlus Phoenix','FPX',68],
     ['Dragon Ranger Gaming','DRG',66],['Wolves Esports','WOL',64]],
   t2:[['Rare Atom','RA',55],['Weibo Gaming','WBG',54],
     ['KeepBest Gaming','KBG',53],['A Team','AT',52],
     ['Any Questions Gaming','AQ',50],['World Sports Invictus Gaming','WSIG',49],
     ['Octagonal Disposition Gaming','ODG',47],['Victory No Limits Gaming','VLG',45]]}
};
