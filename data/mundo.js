/* ---------- Dados do mundo ---------- */
/* Summit entrou no pool competitivo de 2026 — está nas estatísticas de mapa
   das três ligas no vlr.gg (Americas Stage 2, EMEA Stage 2, Pacific Stage 2). */
const MAP_POOL=['Ascent','Bind','Haven','Split','Lotus','Sunset','Summit','Icebox','Breeze','Fracture','Pearl','Abyss','Corrode'];
/* ---------- pool ativo de 2026 (real) ----------
   Os oito mapas que apareceram nos Stage 2 das três ligas. */
const POOL_2026=['Ascent','Split','Haven','Lotus','Sunset','Summit','Breeze','Abyss'];
/* ---------- viés de lado por mapa (real) ----------
   Vitória do ATAQUE em %, média das três ligas no Stage 2 de 2026
   (vlr.gg /event/agents). Mapa não é só "quem gosta mais": em Abyss o ataque
   ganha 55% dos rounds e em Ascent 47%, e isso muda quem quer qual mapa. */
const MAPA_ATK={
  /* pool de 2026 — Americas, EMEA e Pacific Stage 2 */
  Abyss:55, Haven:53, Breeze:51, Lotus:51, Split:51, Sunset:48, Summit:48, Ascent:47,
  /* fora do pool de 2026: a última vez em que cada um foi jogado no circuito.
     Corrode, Bind e Icebox saem de 2025 (Pacific e China Stage 2, Champions);
     Pearl e Fracture de 2023 (Champions e Americas League), que foi quando
     estiveram em rotação. Entram aqui porque a rotação do jogo pode trazê-los
     de volta, e mapa sem dado ficaria neutro — o que apaga a diferença entre
     mapa de ataque e mapa de defesa justo na temporada em que ele volta. */
  Pearl:53, Corrode:52, Fracture:52, Icebox:50, Bind:48
};
/* ---------- meta de agentes (real) ----------
   Taxa de escolha em %, média das três ligas no Stage 2 de 2026. É daqui que
   sai a força inicial de cada agente no meta — nada inventado. Agente fora
   desta lista aparece abaixo de 1% nas três ligas. */
const AGENT_PICK_2026={
  Omen:79, Neon:64, Sova:56, Cypher:41, Phoenix:34, Viper:34, Fade:33,
  Chamber:21, Raze:19, Jett:17, Yoru:16, Waylay:13, Vyse:12, Harbor:12,
  Astra:11, Skye:10, Sage:10, 'KAY/O':7, Killjoy:2, Deadlock:1, Breach:1,
  Brimstone:1
};
const ROLES=['Duelista','Iniciador','Controlador','Sentinela','Flex'];
const AGENTS={
  Duelista:['Jett','Raze','Phoenix','Reyna','Yoru','Neon','Iso','Waylay'],
  Iniciador:['Sova','Skye','Breach','KAY/O','Fade','Gekko','Tejo'],
  Controlador:['Brimstone','Omen','Viper','Astra','Harbor','Clove','Mix'],
  Sentinela:['Killjoy','Cypher','Sage','Chamber','Deadlock','Vyse','Veto'],
  Flex:['Omen','Sage','KAY/O','Raze','Viper','Skye','Cypher']
};
const ATTRS=[['mira','Mira'],['reflexo','Reflexo'],['mov','Movimentação'],['util','Utilidade'],
             ['visao','Visão de Jogo'],['clutch','Clutch'],['consist','Consistência'],['lider','Liderança']];
const ROLE_W={
  Duelista   :{mira:.30,reflexo:.24,mov:.18,util:.06,visao:.08,clutch:.08,consist:.06},
  Iniciador  :{mira:.20,reflexo:.12,mov:.08,util:.26,visao:.22,clutch:.06,consist:.06},
  Controlador:{mira:.16,reflexo:.08,mov:.06,util:.28,visao:.26,clutch:.08,consist:.08},
  Sentinela  :{mira:.20,reflexo:.10,mov:.06,util:.22,visao:.22,clutch:.12,consist:.08},
  Flex       :{mira:.20,reflexo:.15,mov:.12,util:.18,visao:.18,clutch:.09,consist:.08}
};
const FRAG_W={Duelista:1.30,Iniciador:1.00,Controlador:.82,Sentinela:.88,Flex:1.02};

const REGIONS=[
  {id:'AMER',nome:'VCT Americas',t2:'Challengers Americas',
   paises:['BR','BR','BR','US','US','US','CA','AR','CL','MX','PE','CO']},
  {id:'EMEA',nome:'VCT EMEA',t2:'Challengers EMEA',
   paises:['FR','FR','ES','ES','GB','DE','SE','PL','TR','TR','FI','DK','UA','IT','NL']},
  {id:'PAC',nome:'VCT Pacific',t2:'Challengers Pacific',
   paises:['KR','KR','KR','JP','JP','ID','TH','PH','SG','IN','AU','VN','MY']},
  {id:'CN',nome:'VCT China',t2:'Challengers China',paises:['CN','CN','CN','CN','CN','KR']}
];
const FLAG={BR:'🇧🇷',US:'🇺🇸',CA:'🇨🇦',AR:'🇦🇷',CL:'🇨🇱',MX:'🇲🇽',PE:'🇵🇪',CO:'🇨🇴',FR:'🇫🇷',ES:'🇪🇸',
  GB:'🇬🇧',DE:'🇩🇪',SE:'🇸🇪',PL:'🇵🇱',TR:'🇹🇷',FI:'🇫🇮',DK:'🇩🇰',UA:'🇺🇦',IT:'🇮🇹',NL:'🇳🇱',KR:'🇰🇷',
  JP:'🇯🇵',ID:'🇮🇩',TH:'🇹🇭',PH:'🇵🇭',SG:'🇸🇬',IN:'🇮🇳',AU:'🇦🇺',VN:'🇻🇳',MY:'🇲🇾',CN:'🇨🇳',
  PT:'🇵🇹',BE:'🇧🇪',NO:'🇳🇴',CH:'🇨🇭',AT:'🇦🇹',CZ:'🇨🇿',RO:'🇷🇴',RS:'🇷🇸',BG:'🇧🇬',GR:'🇬🇷',IL:'🇮🇱',
  MA:'🇲🇦',EG:'🇪🇬',ZA:'🇿🇦',NZ:'🇳🇿',HK:'🇭🇰',TW:'🇹🇼',KZ:'🇰🇿',LV:'🇱🇻',LT:'🇱🇹',EE:'🇪🇪',IE:'🇮🇪',
  RU:'🇷🇺',AM:'🇦🇲',MD:'🇲🇩',MK:'🇲🇰',ME:'🇲🇪',TN:'🇹🇳',DZ:'🇩🇿',SA:'🇸🇦',AE:'🇦🇪',QA:'🇶🇦',JO:'🇯🇴',
  IS:'🇮🇸',HU:'🇭🇺',SK:'🇸🇰',SI:'🇸🇮',HR:'🇭🇷',BA:'🇧🇦',AL:'🇦🇱',CY:'🇨🇾',LU:'🇱🇺',BY:'🇧🇾',GE:'🇬🇪',
  AZ:'🇦🇿',UZ:'🇺🇿',PK:'🇵🇰',BD:'🇧🇩',LK:'🇱🇰',NP:'🇳🇵',MM:'🇲🇲',KH:'🇰🇭',BN:'🇧🇳',UY:'🇺🇾',PY:'🇵🇾',
  BO:'🇧🇴',EC:'🇪🇨',VE:'🇻🇪',GT:'🇬🇹',CR:'🇨🇷',PA:'🇵🇦',DO:'🇩🇴',PR:'🇵🇷',JM:'🇯🇲',HN:'🇭🇳',SV:'🇸🇻'};


/* Nome do país por código ISO, em pt-BR. Existe para o Editor poder mostrar
   bandeira e nome em vez de exigir que você acerte a sigla de cabeça —
   'SE' e 'SI', 'AR' e 'AM' são fáceis de trocar. Ordenado por nome. */
const PAISES={
  AL:'Albânia',DE:'Alemanha',AR:'Argentina',DZ:'Argélia',AM:'Armênia',SA:'Arábia Saudita',
  AU:'Austrália',AZ:'Azerbaijão',BD:'Bangladesh',BY:'Belarus',BO:'Bolívia',BR:'Brasil',
  BN:'Brunei',BG:'Bulgária',BE:'Bélgica',BA:'Bósnia e Herzegovina',KH:'Camboja',CA:'Canadá',
  QA:'Catar',KZ:'Cazaquistão',CL:'Chile',CN:'China',CY:'Chipre',CO:'Colômbia',
  KR:'Coreia do Sul',CR:'Costa Rica',HR:'Croácia',DK:'Dinamarca',EG:'Egito',
  SV:'El Salvador',AE:'Emirados Árabes',EC:'Equador',SK:'Eslováquia',SI:'Eslovênia',
  ES:'Espanha',US:'Estados Unidos',EE:'Estônia',PH:'Filipinas',FI:'Finlândia',FR:'França',
  GE:'Geórgia',GR:'Grécia',GT:'Guatemala',HN:'Honduras',HK:'Hong Kong',HU:'Hungria',
  ID:'Indonésia',IE:'Irlanda',IS:'Islândia',IL:'Israel',IT:'Itália',JM:'Jamaica',JP:'Japão',
  JO:'Jordânia',LV:'Letônia',LT:'Lituânia',LU:'Luxemburgo',MK:'Macedônia do Norte',
  MY:'Malásia',MA:'Marrocos',MM:'Mianmar',MD:'Moldávia',MN:'Mongólia',ME:'Montenegro',
  MX:'México',NP:'Nepal',NO:'Noruega',NZ:'Nova Zelândia',PA:'Panamá',PK:'Paquistão',
  PY:'Paraguai',NL:'Países Baixos',PE:'Peru',PL:'Polônia',PR:'Porto Rico',PT:'Portugal',
  KG:'Quirguistão',GB:'Reino Unido',DO:'Rep. Dominicana',RO:'Romênia',RU:'Rússia',
  SG:'Singapura',LK:'Sri Lanka',SE:'Suécia',CH:'Suíça',RS:'Sérvia',TH:'Tailândia',
  TW:'Taiwan',CZ:'Tchéquia',TN:'Tunísia',TR:'Turquia',UA:'Ucrânia',UY:'Uruguai',
  UZ:'Uzbequistão',VE:'Venezuela',VN:'Vietnã',ZA:'África do Sul',AT:'Áustria',IN:'Índia'
};
const LISTA_PAISES=Object.keys(PAISES).sort((a,b)=>PAISES[a].localeCompare(PAISES[b],'pt-BR'));


/* ---------- Comissão técnica ----------
   Cinco cargos, quatro atributos. O over de um membro é a média dos atributos
   ponderada pelo cargo, do mesmo jeito que o over de jogador é ponderado pela
   função — e por isso mudar alguém de cargo muda o over sem mudar atributo. */
const CARGOS=[
  {id:'tecnico', nome:'Head coach',        curto:'Coach',   efeito:'Força de jogo e evolução do elenco'},
  {id:'analista',nome:'Analista',          curto:'Analista',efeito:'Força de jogo, leitura de mapa'},
  {id:'mental',  nome:'Preparador mental', curto:'Mental',  efeito:'Moral semanal do elenco'},
  {id:'fisio',   nome:'Fisioterapeuta',    curto:'Fisio',   efeito:'Recuperação de fadiga e tempo de lesão'},
  {id:'olheiro', nome:'Olheiro',           curto:'Olheiro', efeito:'Chance e teto das promessas da base'}
];
const CARGO_W={
  tecnico :{tecnica:.34,visao:.30,gestao:.22,disciplina:.14},
  analista:{visao:.42,tecnica:.30,disciplina:.20,gestao:.08},
  mental  :{gestao:.46,disciplina:.28,visao:.14,tecnica:.12},
  fisio   :{disciplina:.44,gestao:.30,tecnica:.20,visao:.06},
  olheiro :{visao:.44,tecnica:.28,disciplina:.20,gestao:.08}
};
const ATTRS_STAFF=[['tecnica','Técnica'],['gestao','Gestão de pessoas'],
                   ['visao','Visão de jogo'],['disciplina','Método']];
/* nomes civis: staff tem nome de gente, não nick */
/* separados por gênero porque o retrato gerado é escolhido por ele: nome de
   mulher com rosto de homem é o tipo de erro que salta na tela */
const SN1M=['Adrian','Alex','Andrei','Bruno','Caio','Carlos','Daniel','David','Diego','Eduardo',
 'Emil','Enzo','Erik','Fabio','Felix','Gabriel','Gustavo','Henrik','Hugo','Igor','Jakub','Jonas',
 'Jorge','Juan','Kai','Kenji','Lars','Leo','Lucas','Marc','Marco','Mateo','Mathias','Miguel',
 'Nicolas','Oliver','Omar','Pablo','Patrik','Paulo','Pedro','Rafael','Rasmus','Renan','Ricardo',
 'Robin','Rodrigo','Samuel','Sebastian','Sergio','Simon','Stefan','Thiago','Tobias','Tomas',
 'Victor','Vinicius','Yannick','Yuri'];
const SN1F=['Ana','Bianca','Camila','Clara','Elena','Emma','Ines','Julia','Karin','Laura','Lena',
 'Maja','Mariana','Nadia','Nora','Paula','Sofia','Tatiana','Vera'];
const SN1=SN1M.concat(SN1F);
const SN2=['Almeida','Andersen','Bauer','Bergman','Cardoso','Castro','Chen','Costa','Dias','Duarte',
 'Ferreira','Fischer','Gomes','Hansen','Herrera','Hoffmann','Ibrahim','Ivanov','Jensen','Kaya',
 'Kim','Klein','Kovac','Lambert','Lima','Lindqvist','Lopes','Marques','Martins','Mendes','Moreau',
 'Nakamura','Navarro','Neves','Nowak','Oliveira','Pereira','Petrov','Pinto','Ramos','Reis','Ribeiro',
 'Richter','Rocha','Rossi','Sandberg','Santos','Schmidt','Silva','Sousa','Suzuki','Tanaka','Teixeira',
 'Torres','Vargas','Vieira','Wagner','Weber','Yilmaz','Zhang'];

const NS1=['zen','kry','vex','nov','gho','ryu','ace','byt','sha','pul','fro','emb','kai','onx','tem','dri','lum','sab',
 'rif','voi','ape','ech','qua','sbr','hal','jnx','lok','mis','nyx','orb','pri','qak','rav','sol','tit','umb','ver','wis',
 'xen','zep','klr','dyn','stn','arc','blz','crv','dsk','flx','grv','hvn','irk','jol','kad','lyn','mox','nex','opz','ptr',
 'qrz','rze','svn','trx','uzi','vlt','wrx','yko','zad','brn','cly','dov'];
const NS2=['ix','ko','zz','en','ux','ra','os','el','ar','yn','oz','ik','us','an','ez','or','il','ax','um','yx','ey','ie'];
const TN1=['Crimson','Iron','Nova','Vortex','Obsidian','Solar','Phantom','Lunar','Titan','Azure','Ember','Silent','Neon',
 'Arcane','Zenith','Prime','Rogue','Cobalt','Vermilion','Onyx','Nimbus','Rift','Halcyon','Volt','Astral','Feral','Quantum',
 'Sable','Torch','Vanta','Aurora','Basalt','Cinder','Delta','Echo'];
const TN2=['Legion','Syndicate','Collective','Dynasty','Vanguard','Order','Union','Force','Guild','Squad','Division',
 'Society','Corps','Circuit','Company','Front','Assembly','Crew','Faction','Line','Pack','Sect','Wing'];
