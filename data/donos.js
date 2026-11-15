/* ============================================================
   DONOS DAS ORGANIZAÇÕES
   ------------------------------------------------------------
   Tier 1: a lista que você montou (donostier1.docx, 15/11/2026).
   Challengers e entrantes: pesquisa de 15/11/2026, a conferir —
   quem não foi confirmado entra como a própria organização.

   tipo     'pessoa'  o rosto do clube é uma pessoa (nome e foto)
            'empresa' controlado por uma empresa: mostra a empresa
            'org'     dono não confirmado: mostra a organização
   nome     o que aparece como "dono"
   junto    outras pessoas associadas à propriedade (texto livre)
   empresa  a empresa controladora, quando há
   perfil   o ESTILO DE GESTÃO que a IA usa para este clube (não é um
            juízo sobre a pessoa real; troque à vontade):
              ambicioso · paciente · investidor · economico · midiatico
   foto     assets/donos/<slug do nome>.<ext>, como a dos jogadores;
            sem foto, um retrato com as iniciais nas cores do clube

   As chaves são as siglas da base (data/times.js) e as dos entrantes
   (data/organizacoes.js), que ganham o dono quando compram a vaga.
   ============================================================ */
const PERFIS_DONO={
  ambicioso:{nome:'Ambicioso', desc:'Gasta acima do caixa e troca de técnico rápido atrás de título.'},
  paciente :{nome:'Paciente',  desc:'Projeto longo: segura técnico, aposta na base e aceita ano ruim.'},
  investidor:{nome:'Investidor',desc:'Compra barato e vende caro: o clube é um ativo que precisa dar retorno.'},
  economico:{nome:'Econômico', desc:'Folha enxuta e contas em dia; raramente paga o preço de um craque.'},
  midiatico:{nome:'Midiático', desc:'Marca e torcida em primeiro lugar: contratação que vira manchete.'}
};

const DONOS={
/* ---------------- VCT Americas ---------------- */
  '100T':{tipo:'pessoa', nome:'Matthew "Nadeshot" Haag', empresa:'100 Thieves LLC', junto:'e outros coproprietários', perfil:'midiatico'},
  C9   :{tipo:'pessoa', nome:'Jack Etienne', empresa:'Cloud9 Esports Inc.', perfil:'paciente'},
  EG   :{tipo:'empresa',nome:'PEAK6 Investments', junto:'grupo de investimentos', perfil:'investidor'},
  FUR  :{tipo:'pessoa', nome:'Jaime Pádua', empresa:'FURIA Esports', junto:'André Akkari e Cris Guedes', perfil:'paciente'},
  'KRÜ':{tipo:'pessoa', nome:'Sergio "Kun" Agüero', empresa:'Slak Esports Europa', junto:'Lionel Messi', perfil:'midiatico'},
  LEV  :{tipo:'pessoa', nome:'Fernando Diez', empresa:'Leviatán', perfil:'paciente'},
  LOUD :{tipo:'pessoa', nome:'Bruno PlayHard', empresa:'LOUD Ltd.', junto:'Jean Ortega e Matthew Ho', perfil:'midiatico'},
  MIBR :{tipo:'empresa',nome:'Spun Mídia', junto:'grupo empresarial', perfil:'ambicioso'},
  NRG  :{tipo:'pessoa', nome:'Andy Miller', empresa:'Grey Matter Capital', junto:'Mark Mastrov', perfil:'investidor'},
  SEN  :{tipo:'pessoa', nome:'Rob Moore', empresa:'Sentinels Corporation', perfil:'ambicioso'},
  G2   :{tipo:'pessoa', nome:'Jens Hilgers', empresa:'G Esports Holding GmbH', perfil:'investidor'},
  ENVY :{tipo:'pessoa', nome:'Mike "Hastr0" Rufail', empresa:'Envy Gaming', perfil:'paciente'},
/* ---------------- VCT EMEA ---------------- */
  BBL  :{tipo:'org',    nome:'BBL Esports', junto:'fundadores turcos da organização', perfil:'economico'},
  FNC  :{tipo:'pessoa', nome:'Sam Mathews', empresa:'Fnatic Ltd.', perfil:'paciente'},
  FUT  :{tipo:'empresa',nome:'Futbolist Sportif Hizmetler A.Ş.', junto:'empresários turcos', perfil:'economico'},
  KC   :{tipo:'pessoa', nome:'Kameto', empresa:'Karmine Corp SAS', junto:'Prime', perfil:'midiatico'},
  NAVI :{tipo:'pessoa', nome:'Maksym Krippa', empresa:'Natus Vincere Esport CY Ltd.', perfil:'ambicioso'},
  TH   :{tipo:'pessoa', nome:'Antonio Catena', empresa:'Team Heretics S.L.', perfil:'paciente'},
  TL   :{tipo:'empresa',nome:'aXiomatic Gaming', junto:'investidores liderados por Peter Guber e Ted Leonsis', perfil:'investidor'},
  VIT  :{tipo:'pessoa', nome:'Nicolas Maurer', empresa:'Team Vitality', junto:'Fabien Devide', perfil:'ambicioso'},
  GX   :{tipo:'empresa',nome:'JRJ Group', junto:'grupo empresarial', perfil:'investidor'},
  M8   :{tipo:'pessoa', nome:'Squeezie', empresa:'OZI', junto:'Gotaga e Brawks', perfil:'midiatico'},
  PCF  :{tipo:'org',    nome:'PCIFIC Esports', junto:'proprietários não confirmados', perfil:'economico'},
  EF   :{tipo:'org',    nome:'Eternal Fire', junto:'fundada por jogadores e empresários turcos', perfil:'paciente'},
  AUR  :{tipo:'org',    nome:'Aurora Gaming', perfil:'ambicioso'},
/* ---------------- VCT Pacific ---------------- */
  DFM  :{tipo:'pessoa', nome:'Nobuyuki Umezaki', empresa:'DetonatioN Inc.', perfil:'paciente'},
  KRX  :{tipo:'empresa',nome:'DRX Corp.', perfil:'paciente'},
  GEN  :{tipo:'pessoa', nome:'Kevin Chou', empresa:'KSV eSports Korea', perfil:'investidor'},
  GE   :{tipo:'pessoa', nome:'Rushindra Sinha', empresa:'Global Esports', perfil:'ambicioso'},
  PRX  :{tipo:'pessoa', nome:'Nikhil Hathiramani', empresa:'IMPLS Entertainment', junto:'Matt Djojonegoro, Harley Örwall e Gad Tan', perfil:'paciente'},
  RRQ  :{tipo:'pessoa', nome:'Andrian Pauline', empresa:'PT Qeon Interactive', junto:'Riki Kawano Suliawan', perfil:'midiatico'},
  T1   :{tipo:'empresa',nome:'SK Telecom', empresa:'SK Telecom CS T1', junto:'Comcast', perfil:'paciente'},
  TS   :{tipo:'pessoa', nome:'John Yao', empresa:'Secret Esports LLC', perfil:'economico'},
  ZETA :{tipo:'empresa',nome:'GANYMEDE Inc.', junto:'grupo fundador', perfil:'midiatico'},
  FS   :{tipo:'org',    nome:'FULL SENSE', junto:'proprietários não confirmados', perfil:'economico'},
  NS   :{tipo:'empresa',nome:'Nongshim Corporation', perfil:'paciente'},
  VL   :{tipo:'empresa',nome:'CELLORB Inc.', perfil:'economico'},
  CR   :{tipo:'org',    nome:'Crazy Raccoon', perfil:'ambicioso'},
/* ---------------- VCT China ---------------- */
  AG   :{tipo:'empresa',nome:'Orinno Capital', perfil:'investidor'},
  BLG  :{tipo:'empresa',nome:'Bilibili Inc.', perfil:'ambicioso'},
  EDG  :{tipo:'empresa',nome:'SUPERGEN Inc.', perfil:'paciente'},
  FPX  :{tipo:'empresa',nome:'FunPlus', perfil:'investidor'},
  JDG  :{tipo:'empresa',nome:'JD.com Inc.', perfil:'ambicioso'},
  NOVA :{tipo:'empresa',nome:'Imperium Group', perfil:'economico'},
  TEC  :{tipo:'empresa',nome:'Titan Sports', perfil:'economico'},
  TE   :{tipo:'empresa',nome:'Trace Culture', perfil:'paciente'},
  TYL  :{tipo:'empresa',nome:'Tailu Technology Ltd.', perfil:'paciente'},
  DRG  :{tipo:'empresa',nome:'Renren Sports Culture', perfil:'economico'},
  XLG  :{tipo:'empresa',nome:'XILONG INT', perfil:'investidor'},
  WBG  :{tipo:'empresa',nome:'Weibo', perfil:'ambicioso'},
/* ---------------- Challengers (a conferir) ---------------- */
  M80  :{tipo:'pessoa', nome:'Marco Mereu', empresa:'M80', perfil:'economico'},
  SRB  :{tipo:'empresa',nome:'Shopify', perfil:'investidor'},
  RED  :{tipo:'org',    nome:'RED Canids', perfil:'midiatico'},
  FX   :{tipo:'empresa',nome:'W7M Investments Group', junto:'o Fluxo de Nobru', perfil:'midiatico'},
  '2G' :{tipo:'org',    nome:'2Game Esports', perfil:'economico'},
  BST  :{tipo:'pessoa', nome:'Papo', empresa:'BESTIA', perfil:'midiatico'},
  SAD  :{tipo:'org',    nome:'SaD Esports', perfil:'economico'},
  NBG  :{tipo:'org',    nome:'Nightblood Gaming', perfil:'economico'},
  EP   :{tipo:'org',    nome:'Enterprise Esports', perfil:'economico'},
  FF   :{tipo:'org',    nome:'Fire Flux Esports', perfil:'economico'},
  JL   :{tipo:'org',    nome:'Joblife', perfil:'economico'},
  SGE  :{tipo:'empresa',nome:'Eintracht Frankfurt', junto:'o clube de futebol', perfil:'paciente'},
  MISA :{tipo:'org',    nome:'Misa Esports', perfil:'economico'},
  MDR  :{tipo:'org',    nome:'Mandatory', perfil:'midiatico'},
  MIR  :{tipo:'org',    nome:'MIR', perfil:'economico'},
  ONG  :{tipo:'org',    nome:'ONSIDE GAMING', perfil:'economico'},
  DK   :{tipo:'empresa',nome:'Dplus', perfil:'paciente'},
  FL   :{tipo:'org',    nome:'FENNEL', perfil:'midiatico'},
  RC   :{tipo:'org',    nome:'REJECT', perfil:'paciente'},
  GAM  :{tipo:'org',    nome:'GAM Esports', perfil:'economico'},
  QTD  :{tipo:'org',    nome:'QT DIG∞', perfil:'economico'},
  XIP  :{tipo:'org',    nome:'Xipto Esports', perfil:'economico'},
  RA   :{tipo:'org',    nome:'Rare Atom', perfil:'economico'},
  WOL  :{tipo:'empresa',nome:'Fosun International', perfil:'investidor'},
  KBG  :{tipo:'org',    nome:'KeepBest Gaming', perfil:'economico'},
  AT   :{tipo:'org',    nome:'A Team', perfil:'economico'},
  AQ   :{tipo:'org',    nome:'Any Questions Gaming', perfil:'economico'},
  WSIG :{tipo:'empresa',nome:'Invictus Gaming', perfil:'ambicioso'},
  ODG  :{tipo:'org',    nome:'Octagonal Disposition Gaming', perfil:'economico'},
  VLG  :{tipo:'org',    nome:'Victory No Limits Gaming', perfil:'economico'},
/* ---------------- entrantes (data/organizacoes.js) ---------------- */
  PAIN :{tipo:'pessoa', nome:'Arthur "PAADA" Zarzur', empresa:'paiN Gaming', perfil:'paciente'},
  '9Z' :{tipo:'pessoa', nome:'Frankkaster', empresa:'9z Team', perfil:'midiatico'},
  LNS  :{tipo:'pessoa', nome:'Thyak', empresa:'Lyon Gaming', perfil:'ambicioso'},
  NIP  :{tipo:'empresa',nome:'NIP Group', perfil:'investidor'},
  FLC  :{tipo:'org',    nome:'Team Falcons', perfil:'ambicioso'},
  FAZE :{tipo:'empresa',nome:'GameSquare', perfil:'midiatico'},
  SPT  :{tipo:'org',    nome:'Team Spirit', perfil:'paciente'},
  HLE  :{tipo:'empresa',nome:'Hanwha Life', perfil:'ambicioso'}
};
