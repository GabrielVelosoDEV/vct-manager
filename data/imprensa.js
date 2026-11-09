/* ============================================================
   IMPRENSA — veículos e pessoas que postam no feed de notícias
   ------------------------------------------------------------
   VEICULOS: sites e perfis reais que cobrem Valorant e esports.
     regiao   'GLOBAL' ou AMER / EMEA / PAC / CN
     paises   de onde o veículo é (cobre mais os clubes desses países)
     lingua   pt, es, en, fr, de, tr, uk, ko, ja, zh, in, sea — decide
              o nome dos jornalistas fictícios e o "traduzido do…"
     foco     categorias de notícia que o veículo mais cobre
              (clube, mercado, competicoes, meta, carreira)
     alcance  1 a 3: quanto o veículo pesa e quanto engajamento tem
     equipe   quantos jornalistas fictícios ele tem
   Logo opcional em assets/veiculos/<id>.png (ver a LISTA.md de lá).

   PERSONALIDADES: pessoas reais que você adiciona. A foto vai em
   assets/imprensa/<nome-em-slug>.png. Uma foto sem cadastro aqui
   entra sozinha como jornalista brasileiro independente, com o nome
   tirado do arquivo; cadastre para dar o tipo, o veículo e o @.
     tipo     'jornalista' (assina notícias), 'streamer', 'caster' ou
              'criador' (reagem às notícias grandes)
     veiculo  id de um VEICULO (opcional; sem ele, independente)
     pais     país de quem ela cobre / com quem ela fala (padrão BR)
     arroba   @ sem o arroba (opcional; sem ele, sai do nome)
   ============================================================ */
const VEICULOS=[
  /* ---------- global (inglês) ---------- */
  {id:'dexerto',     nome:'Dexerto',          arroba:'Dexerto',      regiao:'GLOBAL',paises:[],    lingua:'en',cor:'#E8262E',foco:['mercado','competicoes'],alcance:3,equipe:3},
  {id:'dotesports',  nome:'Dot Esports',      arroba:'dotesports',   regiao:'GLOBAL',paises:[],    lingua:'en',cor:'#E5473B',foco:['competicoes','meta'],alcance:3,equipe:3},
  {id:'sheep',       nome:'Sheep Esports',    arroba:'SheepEsports', regiao:'GLOBAL',paises:['FR'],lingua:'en',cor:'#8C6CF2',foco:['mercado','carreira'],alcance:3,equipe:3},
  {id:'esportsgg',   nome:'esports.gg',       arroba:'esportsgg',    regiao:'GLOBAL',paises:[],    lingua:'en',cor:'#1FB5FF',foco:['competicoes','mercado'],alcance:2,equipe:2},
  {id:'thespike',    nome:'THESPIKE.GG',      arroba:'thespikegg',   regiao:'GLOBAL',paises:['GB'],lingua:'en',cor:'#F25C54',foco:['competicoes','mercado'],alcance:2,equipe:2},
  {id:'vlr',         nome:'VLR.gg',           arroba:'vlrdotgg',     regiao:'GLOBAL',paises:[],    lingua:'en',cor:'#C9473F',foco:['competicoes','meta'],alcance:3,equipe:1},
  {id:'escharts',    nome:'Esports Charts',   arroba:'EsportsCharts',regiao:'GLOBAL',paises:[],    lingua:'en',cor:'#2E9BFF',foco:['competicoes'],alcance:1,equipe:1},
  /* ---------- Américas ---------- */
  {id:'maisesports', nome:'Mais Esports',     arroba:'maisesports',  regiao:'AMER',paises:['BR'],lingua:'pt',cor:'#FFC21A',foco:['mercado','competicoes','clube'],alcance:3,equipe:3},
  {id:'geesports',   nome:'ge esports',       arroba:'geesports',    regiao:'AMER',paises:['BR'],lingua:'pt',cor:'#06AA48',foco:['competicoes','clube','carreira'],alcance:3,equipe:2},
  {id:'theenemy',    nome:'The Enemy',        arroba:'theenemy',     regiao:'AMER',paises:['BR'],lingua:'pt',cor:'#E5262D',foco:['meta','competicoes'],alcance:2,equipe:2},
  {id:'valorantzone',nome:'Valorant Zone',    arroba:'valorantzone', regiao:'AMER',paises:['BR'],lingua:'pt',cor:'#FF4655',foco:['mercado','clube','meta'],alcance:2,equipe:2},
  {id:'hotspawn',    nome:'Hotspawn',         arroba:'hotspawn',     regiao:'AMER',paises:['US','CA'],lingua:'en',cor:'#F7931E',foco:['competicoes','mercado'],alcance:1,equipe:2},
  {id:'levelup',     nome:'LevelUp',          arroba:'LevelUp',      regiao:'AMER',paises:['MX'],lingua:'es',cor:'#E31B23',foco:['competicoes','clube'],alcance:2,equipe:2},
  {id:'libero',      nome:'Líbero Esports',   arroba:'liberoesports',regiao:'AMER',paises:['PE','CL','CO'],lingua:'es',cor:'#E30613',foco:['competicoes','mercado'],alcance:1,equipe:1},
  {id:'culturageek', nome:'Cultura Geek',     arroba:'culturageekar',regiao:'AMER',paises:['AR','CL'],lingua:'es',cor:'#00A3E0',foco:['competicoes','meta'],alcance:1,equipe:1},
  /* ---------- EMEA ---------- */
  {id:'millenium',   nome:'Millenium',        arroba:'MilleniumFR',  regiao:'EMEA',paises:['FR','BE'],lingua:'fr',cor:'#E4002B',foco:['competicoes','mercado'],alcance:2,equipe:2},
  {id:'mggespana',   nome:'MGG España',       arroba:'MGG_ES',       regiao:'EMEA',paises:['ES'],lingua:'es',cor:'#D7263D',foco:['competicoes','meta'],alcance:1,equipe:1},
  {id:'gaminginturkey',nome:'Gaming in Turkey',arroba:'gaminginturkey',regiao:'EMEA',paises:['TR'],lingua:'tr',cor:'#E30A17',foco:['mercado','competicoes'],alcance:2,equipe:2},
  {id:'rtparena',    nome:'RTP Arena',        arroba:'RTPArena',     regiao:'EMEA',paises:['PT'],lingua:'pt',cor:'#00A651',foco:['competicoes','carreira'],alcance:1,equipe:1},
  {id:'esportsnet',  nome:'esports.net',      arroba:'esportsnet',   regiao:'EMEA',paises:['DE','AT','PL'],lingua:'de',cor:'#3D7BF7',foco:['competicoes','meta'],alcance:1,equipe:2},
  {id:'playersua',   nome:'Players.com.ua',   arroba:'playerscomua', regiao:'EMEA',paises:['UA','RU'],lingua:'uk',cor:'#F5C400',foco:['mercado','competicoes'],alcance:1,equipe:1},
  /* ---------- Pacífico ---------- */
  {id:'invenglobal', nome:'Inven Global',     arroba:'InvenGlobal',  regiao:'PAC',paises:['KR'],lingua:'ko',cor:'#E6007E',foco:['competicoes','carreira'],alcance:2,equipe:2},
  {id:'osen',        nome:'OSEN',             arroba:'osen_esports', regiao:'PAC',paises:['KR'],lingua:'ko',cor:'#1A6FD1',foco:['competicoes','clube'],alcance:2,equipe:2},
  {id:'saiganak',    nome:'SAIGANAK',         arroba:'saiganak',     regiao:'PAC',paises:['JP'],lingua:'ja',cor:'#111C2E',foco:['competicoes','clube'],alcance:1,equipe:2},
  {id:'valorantnewsjp',nome:'VALORANT NEWS JP',arroba:'valorantnewsjp',regiao:'PAC',paises:['JP'],lingua:'ja',cor:'#FF5A5F',foco:['meta','mercado'],alcance:1,equipe:1},
  {id:'valo2asia',   nome:'VALO2ASIA',        arroba:'valo2asia',    regiao:'PAC',paises:['SG','MY','TH','VN','ID','PH'],lingua:'sea',cor:'#FF6B35',foco:['competicoes','mercado'],alcance:2,equipe:2},
  {id:'oneesports',  nome:'ONE Esports',      arroba:'ONEEsports',   regiao:'PAC',paises:['SG','PH','ID','TH'],lingua:'sea',cor:'#F0A202',foco:['competicoes','carreira'],alcance:2,equipe:2},
  {id:'afkgaming',   nome:'AFK Gaming',       arroba:'afkgaming',    regiao:'PAC',paises:['IN'],lingua:'in',cor:'#2BB673',foco:['competicoes','mercado'],alcance:1,equipe:2},
  {id:'sportskeeda', nome:'Sportskeeda Esports',arroba:'SKEsports',  regiao:'PAC',paises:['IN'],lingua:'in',cor:'#F15A24',foco:['meta','competicoes'],alcance:1,equipe:1},
  /* ---------- China ---------- */
  {id:'gamersky',    nome:'游民星空 Gamersky', arroba:'gamersky',     regiao:'CN',paises:['CN'],lingua:'zh',cor:'#E73B3B',foco:['meta','competicoes'],alcance:2,equipe:2},
  {id:'wanplus',     nome:'玩加电竞 Wanplus',  arroba:'wanplus',      regiao:'CN',paises:['CN'],lingua:'zh',cor:'#FF7A00',foco:['competicoes','mercado'],alcance:2,equipe:2},
  {id:'hupu',        nome:'虎扑电竞 Hupu',     arroba:'hupuesports',  regiao:'CN',paises:['CN'],lingua:'zh',cor:'#C8102E',foco:['clube','mercado'],alcance:2,equipe:1},
  {id:'sinaesports', nome:'新浪电竞 Sina',     arroba:'sinaesports',  regiao:'CN',paises:['CN'],lingua:'zh',cor:'#E6162D',foco:['competicoes','carreira'],alcance:1,equipe:1}
];

/* Cadastre aqui as pessoas reais cujas fotos você colocar em assets/imprensa/.
   Exemplo (descomente e troque):
   {nome:'Nome da Pessoa', tipo:'jornalista', veiculo:'maisesports', pais:'BR', arroba:'nomedapessoa'},
   {nome:'Nome do Streamer', tipo:'streamer', pais:'BR'},                                          */
const PERSONALIDADES=[
];
