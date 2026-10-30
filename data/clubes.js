/* ============================================================
   DADOS DE CLUBE — exportado do Editor em 2026-08-29
   ------------------------------------------------------------
   80 clube(s) com sede definida. Copie por cima de
   data/clubes.js e todo jogo novo já nasce com eles.
   ============================================================ */
const CLUBES_BASE={
  "100T":{pais:"US"},   /* 100 Thieves · Tier 1 */
  "AG":{pais:"CN"},   /* All Gamers · Tier 1 */
  "AUR":{pais:"RS"},   /* Aurora Gaming · Tier 1 */
  "BBL":{pais:"TR"},   /* BBL Esports · Tier 1 */
  "BLG":{pais:"CN"},   /* Guangzhou Huadu Bilibili Gaming · Tier 1 */
  "C9":{pais:"US"},   /* Cloud9 · Tier 1 */
  "DFM":{pais:"JP"},   /* DetonatioN FocusMe · Tier 1 */
  "DRG":{pais:"CN"},   /* Dragon Ranger Gaming · Tier 1 */
  "EDG":{pais:"CN"},   /* EDward Gaming · Tier 1 */
  "EF":{pais:"TR"},   /* Eternal Fire · Tier 1 */
  "EG":{pais:"US"},   /* Evil Geniuses · Tier 1 */
  "ENVY":{pais:"US"},   /* ENVY · Tier 1 */
  "FNC":{pais:"GB"},   /* FNATIC · Tier 1 */
  "FPX":{pais:"CN"},   /* FunPlus Phoenix · Tier 1 */
  "FS":{pais:"TH"},   /* FULL SENSE · Tier 1 */
  "FUR":{pais:"BR"},   /* FURIA · Tier 1 */
  "FUT":{pais:"TR"},   /* FUT Esports · Tier 1 */
  "G2":{pais:"US"},   /* G2 Esports · Tier 1 */
  "GE":{pais:"IN"},   /* Global Esports · Tier 1 */
  "GEN":{pais:"KR"},   /* Gen.G · Tier 1 */
  "GX":{pais:"ES"},   /* GIANTX · Tier 1 */
  "JDG":{pais:"CN"},   /* JD Gaming · Tier 1 */
  "KC":{pais:"FR"},   /* Karmine Corp · Tier 1 */
  "KRÜ":{pais:"AR"},   /* KRÜ Esports · Tier 1 */
  "KRX":{pais:"KR"},   /* KIWOOM DRX · Tier 1 */
  "LEV":{pais:"AR"},   /* LEVIATÁN · Tier 1 */
  "LOUD":{pais:"BR"},   /* LOUD · Tier 1 */
  "M8":{pais:"FR"},   /* Gentle Mates · Tier 1 */
  "MIBR":{pais:"BR"},   /* MIBR · Tier 1 */
  "NAVI":{pais:"UA"},   /* Natus Vincere · Tier 1 */
  "NOVA":{pais:"CN"},   /* Nova Esports · Tier 1 */
  "NRG":{pais:"US"},   /* NRG · Tier 1 */
  "NS":{pais:"KR"},   /* Nongshim RedForce · Tier 1 */
  "PRX":{pais:"SG"},   /* Paper Rex · Tier 1 */
  "RRQ":{pais:"ID"},   /* Rex Regum Qeon · Tier 1 */
  "SEN":{pais:"US"},   /* Sentinels · Tier 1 */
  "T1":{pais:"KR"},   /* T1 · Tier 1 */
  "TE":{pais:"CN"},   /* Trace Esports · Tier 1 */
  "TEC":{pais:"CN"},   /* Wuxi Titan Esports Club · Tier 1 */
  "TH":{pais:"ES"},   /* Team Heretics · Tier 1 */
  "TL":{pais:"NL"},   /* Team Liquid · Tier 1 */
  "TS":{pais:"PH"},   /* Team Secret · Tier 1 */
  "TYL":{pais:"CN"},   /* TYLOO · Tier 1 */
  "VIT":{pais:"FR"},   /* Team Vitality · Tier 1 */
  "VL":{pais:"JP"},   /* VARREL · Tier 1 */
  "WOL":{pais:"CN"},   /* Wolves Esports · Tier 1 */
  "XLG":{pais:"CN"},   /* Xi Lai Gaming · Tier 1 */
  "ZETA":{pais:"JP"},   /* ZETA DIVISION · Tier 1 */
  "2G":{pais:"BR"},   /* 2Game Esports · Tier 2 */
  "AQ":{pais:"CN"},   /* Any Questions Gaming · Tier 2 */
  "ART":{pais:"KR"},   /* ARETE · Tier 2 */
  "AT":{pais:"CN"},   /* A Team · Tier 2 */
  "BST":{pais:"CL"},   /* BESTIA · Tier 2 */
  "DK":{pais:"KR"},   /* Dplus Esports · Tier 2 */
  "EP":{pais:"CZ"},   /* Enterprise Esports · Tier 2 */
  "FF":{pais:"TR"},   /* Fire Flux Esports · Tier 2 */
  "FL":{pais:"JP"},   /* FENNEL · Tier 2 */
  "FX":{pais:"BR"},   /* Fluxo W7M · Tier 2 */
  "JL":{pais:"DE"},   /* Joblife · Tier 2 */
  "KBG":{pais:"CN"},   /* KeepBest Gaming · Tier 2 */
  "M80":{pais:"US"},   /* M80 · Tier 2 */
  "MDR":{pais:"FR"},   /* Mandatory · Tier 2 */
  "MIR":{pais:"RU"},   /* MIR · Tier 2 */
  "MISA":{pais:"TR"},   /* Misa Esports · Tier 2 */
  "NBG":{pais:"US"},   /* Nightblood Gaming · Tier 2 */
  "PCF":{pais:"TR"},   /* PCIFIC Esports · Tier 2 */
  "ODG":{pais:"CN"},   /* Octagonal Disposition Gaming · Tier 2 */
  "ONG":{pais:"KR"},   /* ONSIDE GAMING · Tier 2 */
  "QTD":{pais:"JP"},   /* QT DIG∞ · Tier 2 */
  "RA":{pais:"CN"},   /* Rare Atom · Tier 2 */
  "RC":{pais:"JP"},   /* REJECT · Tier 2 */
  "RED":{pais:"BR"},   /* RED Canids · Tier 2 */
  "SAD":{pais:"US"},   /* SaD Esports · Tier 2 */
  "SGE":{pais:"DE"},   /* Eintracht Frankfurt · Tier 2 */
  "SP":{pais:"TH"},   /* Sharper Esports · Tier 2 */
  "SRB":{pais:"US"},   /* Shopify Rebellion Black · Tier 2 */
  "VLG":{pais:"CN"},   /* Victory No Limits Gaming · Tier 2 */
  "WBG":{pais:"CN"},   /* Weibo Gaming · Tier 2 */
  "WSIG":{pais:"CN"},   /* World Sports Invictus Gaming · Tier 2 */
  "XIP":{pais:"TH"},   /* Xipto Esports · Tier 2 */
};
