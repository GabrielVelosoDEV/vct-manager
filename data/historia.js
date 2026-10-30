/* ============================================================
   PRÉ-HISTÓRIA DO CIRCUITO — 2021 a 2025
   ------------------------------------------------------------
   PROVENIÊNCIA: resultados reais, lidos da página "Valorant
   Champions Tour" da Wikipédia em 29/08/2026. Não há nada
   estimado aqui — campeão e vice são o que a fonte diz, e onde a
   fonte não trazia o vice o campo fica vazio em vez de chute.

   A temporada de 2026 NÃO entra: ela é a temporada em que o jogo
   começa, e quem ganha o quê é o que você vai jogar. Semear
   Kickoff 2026 aqui faria o título ser conquistado duas vezes.

   Clubes que já não competem (Acend, Gambit, OpTic) continuam no
   registro. Eles não recebem nada — não existem mais — mas o
   mundo lembra que ganharam, e é isso que faz 2021 parecer que
   aconteceu de verdade.
   ============================================================ */

/* apelidos: o nome do campeão na fonte nem sempre é o nome do clube em
   data/times.js. Sem esta tabela, DRX e Bilibili Gaming perdiam os títulos
   deles em silêncio — foi o que aconteceu na primeira montagem. */
const ALIAS_CLUBE={
  'DRX':'KIWOOM DRX',
  'Bilibili Gaming':'Guangzhou Huadu Bilibili Gaming',
  'Edward Gaming':'EDward Gaming',
  'Fnatic':'FNATIC',
  'Furia':'FURIA',
  'Leviatán':'LEVIATÁN'
};

/* escopo: 'INT' vale para o mundo todo; AMER/EMEA/PAC/CN são de liga. */
const HISTORIA_REAL=[
  /* ---------------- 2021 ---------------- */
  {ano:2021,escopo:'INT',evento:'Masters Reykjavík',campeao:'Sentinels',      vice:'Fnatic'},
  {ano:2021,escopo:'INT',evento:'Masters Berlim',   campeao:'Gambit Esports', vice:'Team Envy'},
  {ano:2021,escopo:'INT',evento:'Champions Berlim', campeao:'Acend',          vice:'Gambit Esports'},
  /* ---------------- 2022 ---------------- */
  {ano:2022,escopo:'INT',evento:'Masters Reykjavík',  campeao:'OpTic Gaming',    vice:'LOUD'},
  {ano:2022,escopo:'INT',evento:'Masters Copenhague', campeao:'FunPlus Phoenix', vice:'Paper Rex'},
  {ano:2022,escopo:'INT',evento:'Champions Istambul', campeao:'LOUD',            vice:'OpTic Gaming'},
  /* ---------------- 2023 ---------------- */
  {ano:2023,escopo:'INT', evento:'LOCK//IN São Paulo',    campeao:'Fnatic',        vice:'LOUD'},
  {ano:2023,escopo:'INT', evento:'Masters Tóquio',        campeao:'Fnatic',        vice:'Evil Geniuses'},
  {ano:2023,escopo:'INT', evento:'Champions Los Angeles', campeao:'Evil Geniuses', vice:'Paper Rex'},
  {ano:2023,escopo:'AMER',evento:'VCT Americas',          campeao:'LOUD',          vice:''},
  {ano:2023,escopo:'EMEA',evento:'VCT EMEA',              campeao:'Team Liquid',   vice:''},
  {ano:2023,escopo:'PAC', evento:'VCT Pacific',           campeao:'Paper Rex',     vice:''},
  /* ---------------- 2024 ---------------- */
  {ano:2024,escopo:'INT', evento:'Masters Madri',    campeao:'Sentinels',     vice:'Gen.G'},
  {ano:2024,escopo:'INT', evento:'Masters Xangai',   campeao:'Gen.G',         vice:'Team Heretics'},
  {ano:2024,escopo:'INT', evento:'Champions Seul',   campeao:'Edward Gaming', vice:'Team Heretics'},
  {ano:2024,escopo:'AMER',evento:'Kickoff Americas', campeao:'Sentinels',     vice:''},
  {ano:2024,escopo:'EMEA',evento:'Kickoff EMEA',     campeao:'Karmine Corp',  vice:''},
  {ano:2024,escopo:'PAC', evento:'Kickoff Pacific',  campeao:'Gen.G',         vice:''},
  {ano:2024,escopo:'CN',  evento:'Kickoff China',    campeao:'Edward Gaming', vice:''},
  {ano:2024,escopo:'AMER',evento:'Stage 1 Americas', campeao:'100 Thieves',   vice:''},
  {ano:2024,escopo:'EMEA',evento:'Stage 1 EMEA',     campeao:'Fnatic',        vice:''},
  {ano:2024,escopo:'PAC', evento:'Stage 1 Pacific',  campeao:'Paper Rex',     vice:''},
  {ano:2024,escopo:'CN',  evento:'Stage 1 China',    campeao:'Edward Gaming', vice:''},
  {ano:2024,escopo:'AMER',evento:'Stage 2 Americas', campeao:'Leviatán',      vice:''},
  {ano:2024,escopo:'EMEA',evento:'Stage 2 EMEA',     campeao:'Fnatic',        vice:''},
  {ano:2024,escopo:'PAC', evento:'Stage 2 Pacific',  campeao:'Gen.G',         vice:''},
  {ano:2024,escopo:'CN',  evento:'Stage 2 China',    campeao:'Edward Gaming', vice:''},
  /* ---------------- 2025 ---------------- */
  {ano:2025,escopo:'INT', evento:'Masters Bangkok',  campeao:'T1',              vice:'G2 Esports'},
  {ano:2025,escopo:'INT', evento:'Masters Toronto',  campeao:'Paper Rex',       vice:'Fnatic'},
  {ano:2025,escopo:'INT', evento:'Champions Paris',  campeao:'NRG',             vice:'Fnatic'},
  {ano:2025,escopo:'AMER',evento:'Kickoff Americas', campeao:'G2 Esports',      vice:''},
  {ano:2025,escopo:'EMEA',evento:'Kickoff EMEA',     campeao:'Team Vitality',   vice:''},
  {ano:2025,escopo:'PAC', evento:'Kickoff Pacific',  campeao:'DRX',             vice:''},
  {ano:2025,escopo:'CN',  evento:'Kickoff China',    campeao:'Edward Gaming',   vice:''},
  {ano:2025,escopo:'AMER',evento:'Stage 1 Americas', campeao:'G2 Esports',      vice:''},
  {ano:2025,escopo:'EMEA',evento:'Stage 1 EMEA',     campeao:'Fnatic',          vice:''},
  {ano:2025,escopo:'PAC', evento:'Stage 1 Pacific',  campeao:'Rex Regum Qeon',  vice:''},
  {ano:2025,escopo:'CN',  evento:'Stage 1 China',    campeao:'Xi Lai Gaming',   vice:''},
  {ano:2025,escopo:'AMER',evento:'Stage 2 Americas', campeao:'G2 Esports',      vice:''},
  {ano:2025,escopo:'EMEA',evento:'Stage 2 EMEA',     campeao:'Team Liquid',     vice:''},
  {ano:2025,escopo:'PAC', evento:'Stage 2 Pacific',  campeao:'Paper Rex',       vice:''},
  {ano:2025,escopo:'CN',  evento:'Stage 2 China',    campeao:'Bilibili Gaming', vice:''}
];

/* Quanto cada tipo de título pesa no legado do clube: torcida herdada e
   posição nas rivalidades. Internacional vale muito mais que liga, e é o que
   separa "clube grande" de "clube que ganhou o campeonato de casa". */
const PESO_TITULO={INT:1, AMER:0.34, EMEA:0.34, PAC:0.34, CN:0.34};
