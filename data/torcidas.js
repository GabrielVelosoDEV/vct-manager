/* ============================================================
   TORCIDAS — tamanho e temperamento de cada clube
   ------------------------------------------------------------
   porte      1 a 5: o tamanho do público do clube no Valorant,
              além do que os títulos já dão (legado.js cuida disso).
   fanatismo  0 a 1: o quanto a torcida oscila. Torcida fanática
              comemora mais alto, xinga mais alto e pede cabeça mais
              cedo; torcida fria só some.

   PROVENIÊNCIA (pesquisa de 11/11/2026). Não existe um número único
   e comparável de "tamanho de torcida" por time de Valorant, então
   o porte é uma leitura de vários sinais públicos, e não medição:
     - Liquipedia, times de Valorant mais vistos em 2025: Paper Rex,
       FNATIC, Sentinels (1º em 2024), NRG, G2; EDG é o único chinês
       no top 20; Vitality e RRQ entram no top 10.
     - Esports Charts, organizações mais assistidas de 2025: T1, Team
       Liquid, G2, Gen.G (o elenco de Valorant da Gen.G foi o 2º mais
       popular do ano), Vitality, RRQ, NAVI. FURIA é top 5 no 1º
       trimestre de 2026.
     - As partidas mais vistas de 2025 (esports.gg): Paper Rex em
       cinco delas, FNATIC em quatro. LOUD tem o pico histórico de
       1,5 milhão (Champions 2022); MIBR, 681 mil (Champions 2025).
     - LOUD é a organização com mais seguidores no Brasil e já foi a
       segunda do mundo (ge.globo, 2022).
     - O público em português segurou a audiência das Américas em
       2025 enquanto o inglês caiu; a final da EMEA teve mais de 100
       mil espectadores turcos ao vivo (BBL); o clássico japonês ZETA
       x DFM bateu 153 mil só em japonês (Esports Charts).
   O fanatismo segue a fama das torcidas: Brasil, Argentina, Turquia,
   França (a KCorp), Indonésia e Filipinas no topo.

   Clube fora da lista usa porte 3 no Tier 1 e porte 1 no Tier 2.
   Editável à mão: é um arquivo de dados como os outros.
   ============================================================ */
const TORCIDAS={
  /* ---- Américas ---- */
  SEN:{porte:5,fanatismo:0.75}, NRG:{porte:4,fanatismo:0.55}, LEV:{porte:3,fanatismo:0.75},
  G2:{porte:4,fanatismo:0.6},   LOUD:{porte:5,fanatismo:0.95},'100T':{porte:4,fanatismo:0.55},
  C9:{porte:4,fanatismo:0.6},   MIBR:{porte:4,fanatismo:0.9}, FUR:{porte:4,fanatismo:0.9},
  'KRÜ':{porte:3,fanatismo:0.85},EG:{porte:3,fanatismo:0.5}, ENVY:{porte:3,fanatismo:0.5},
  FX:{porte:3,fanatismo:0.85},  RED:{porte:3,fanatismo:0.85}, '2G':{porte:2,fanatismo:0.75},
  BST:{porte:2,fanatismo:0.8},  M80:{porte:2,fanatismo:0.6},  SRB:{porte:2,fanatismo:0.5},
  /* ---- EMEA ---- */
  TH:{porte:4,fanatismo:0.75},  FNC:{porte:5,fanatismo:0.8},  GX:{porte:3,fanatismo:0.65},
  KC:{porte:5,fanatismo:0.95},  TL:{porte:4,fanatismo:0.6},   EF:{porte:4,fanatismo:0.9},
  VIT:{porte:4,fanatismo:0.65}, FUT:{porte:4,fanatismo:0.9},  BBL:{porte:4,fanatismo:0.95},
  M8:{porte:3,fanatismo:0.7},   NAVI:{porte:4,fanatismo:0.75},AUR:{porte:2,fanatismo:0.55},
  /* ---- Pacífico ---- */
  PRX:{porte:5,fanatismo:0.95}, T1:{porte:5,fanatismo:0.8},   GEN:{porte:4,fanatismo:0.7},
  KRX:{porte:4,fanatismo:0.75}, GE:{porte:3,fanatismo:0.8},   NS:{porte:2,fanatismo:0.55},
  RRQ:{porte:4,fanatismo:0.9},  DFM:{porte:3,fanatismo:0.75}, TS:{porte:3,fanatismo:0.8},
  VL:{porte:2,fanatismo:0.6},   FS:{porte:3,fanatismo:0.75},  ZETA:{porte:4,fanatismo:0.85},
  DK:{porte:3,fanatismo:0.7},
  /* ---- China ---- */
  EDG:{porte:5,fanatismo:0.85}, BLG:{porte:4,fanatismo:0.75}, FPX:{porte:4,fanatismo:0.7},
  JDG:{porte:4,fanatismo:0.65}, TE:{porte:3,fanatismo:0.6},   XLG:{porte:3,fanatismo:0.6},
  AG:{porte:3,fanatismo:0.6},   TEC:{porte:3,fanatismo:0.6},  DRG:{porte:3,fanatismo:0.65},
  WOL:{porte:3,fanatismo:0.65}, NOVA:{porte:3,fanatismo:0.6}, TYL:{porte:3,fanatismo:0.6}
};
