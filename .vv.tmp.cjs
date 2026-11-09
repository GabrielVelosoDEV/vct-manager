/* ============================================================
   VCT MANAGER — motor de simulação de e-sports (Valorant)
   ============================================================ */

/* ---------- RNG determinístico ---------- */
let _s = 1;
function srand(s){ _s = (s>>>0) || 1; }
function rnd(){ _s^=_s<<13;_s>>>=0;_s^=_s>>17;_s^=_s<<5;_s>>>=0;return _s/4294967296; }
const ri=(a,b)=>Math.floor(rnd()*(b-a+1))+a;
const pick=a=>a[Math.floor(rnd()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function gauss(m,s){let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const money=v=>{const n=Math.round(v);if(Math.abs(n)>=1e6)return '$'+(n/1e6).toFixed(2)+'M';if(Math.abs(n)>=1e3)return '$'+(n/1e3).toFixed(0)+'k';return '$'+n;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

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

/* Gerado por tools/cores.py a partir de assets/logos: cor de destaque
   de cada clube (sigla → cor). Ajuste fino: Banco de dados › Times. */
const CORES_CLUBES={"100T": "#ED3333","2G": "#794AFB","AG": "#DB251C","AQ": "#D6DCE2","ART": "#D6DCE2","AT": "#D6DCE2","AUR": "#0FC7BB","BBL": "#C5920B","BLG": "#36D2F6","BST": "#D6DCE2","C9": "#26ADE3","CRC": "#D00D17","DFM": "#2467EF","DK": "#D6DCE2","DRG": "#2E60FB","EDG": "#D6DCE2","EF": "#9E8A57","EG": "#22A8E6","ENVY": "#D6DCE2","EP": "#E81F42","FF": "#14D9F4","FL": "#D6DCE2","FNC": "#FF5900","FPX": "#FF0600","FS": "#FD7C01","FUR": "#D6DCE2","FUT": "#D6DCE2","FX": "#8100D7","G2": "#FF3B3B","GAM": "#FEBF10","GE": "#20509E","GEN": "#D3B474","GX": "#D6DCE2","JDG": "#C9102E","JL": "#D6DCE2","KBG": "#EAB651","KC": "#3AA0FF","KRU": "#FF1990","KRX": "#D6DCE2","LEV": "#6AADDE","LNS": "#B99766","LOUD": "#13FF00","M8": "#D6DCE2","M80": "#D3F501","MDR": "#E81D36","MIBR": "#D6DCE2","MIR": "#D6DCE2","MISA": "#D6DCE2","NAVI": "#FFEF00","NBG": "#9E0033","NOVA": "#D6DCE2","NRG": "#FA3E0A","NS": "#D92027","NVJ": "#FFEF00","ODG": "#BB363D","ONG": "#D6DCE2","PCF": "#26A7C2","PRX": "#FF5EA0","QTD": "#E70012","RA": "#D6DCE2","RC": "#D6DCE2","RED": "#B12337","RRQ": "#F4AB36","SAD": "#137EC0","SEN": "#CE0037","SGE": "#E1161E","SRB": "#D6DCE2","T1": "#E4012D","TE": "#F7BE37","TEC": "#D6DCE2","TH": "#D6DCE2","TL": "#2E7BE0","TS": "#D6DCE2","TYL": "#C3342E","VIT": "#FFFF00","VL": "#D6DCE2","VLG": "#D6DCE2","WBG": "#E7182E","WOL": "#F6A61E","WSIG": "#D6DCE2","XIP": "#C30000","XLG": "#02A3B1","ZETA": "#D6DCE2"};

/* ============================================================
   NICKS COM SOTAQUE — banco de nicks por região e país
   ------------------------------------------------------------
   Todo jogador gerado (base, agente livre, promessa da IA, conta do
   radar das rankeds) tira o nick daqui, pelo país dele. Cada grupo tem:

     palavras  nicks inteiros, do jeito que a cena daquele lugar usa
               (gíria brasileira, bicho e mito, palavra local);
     pre/suf   pedaços que se combinam ("Kaik" + "zin");
     caixa     'alta' (muito comum na Coreia), 'baixa' (China) ou normal;
     num       chance de vir com número no fim.

   Sem acento e sem caractere especial: nick vira nome de arquivo de
   foto e chave de busca. Quem não tem grupo usa o banco genérico de
   data/mundo.js (NS1/NS2).
   ============================================================ */
const NICKS={
  BR:{palavras:['Mito','Brabo','Guri','Moleque','Tchola','Fera','Craque','Bala','Raio','Trovao','Jacare','Tatu','Saci',
      'Curupira','Gambiarra','Pipoca','Farofa','Picanha','Cangaco','Lampiao','Sertao','Caju','Acai','Pivete','Zica','Treta',
      'Malandro','Parca','Coringa','Pacoca','Bagual','Xodo','Marrento','Brisa','Sossego','Fumaca','Quebrada','Mandacaru',
      'Pirata','Caboclo','Tropeiro','Cuscuz','Goiaba','Jabuti','Capivara','Boto','Siri','Bode','Dendê'].map(x=>x.replace('ê','e')),
    pre:['Dud','Gab','Lip','Raf','Tet','Bru','Kaik','Vini','Thig','Lucc','Gui','Ped','Dav','Cai','Mat','Heit','Enz','Art',
      'Jow','Lek','Nan','Tav','Rod','Fel','Juj','Kau'],
    suf:['inho','zin','ao','ito','era','ola','eta','ix','zera','ozo','inha','ex','ow'],num:0.12},
  ES:{palavras:['Lobo','Fuego','Chamo','Pibe','Gaucho','Tigre','Diablo','Rayo','Chino','Flaco','Pana','Cuervo','Toro',
      'Picante','Mate','Tango','Charro','Zorro','Coyote','Pulpo','Cholo','Jaguar','Condor','Puma','Tiburon','Brujo',
      'Caudillo','Gringo','Cumbia','Bandido','Chispa','Trueno','Sombra','Mono','Gallo','Alacran'],
    pre:['Nach','Fran','Sant','Mati','Tom','Agus','Feli','Jua','Laut','Benj','Emil','Rodr','Pach','Lalo','Chuy','Memo'],
    suf:['ito','o','ii','e','ox','in','ero','iyo','ete','azo'],num:0.14},
  EN:{palavras:['Hollow','Skyline','Bandit','Maverick','Ripper','Havoc','Ricochet','Wrecker','Nomad','Outlaw','Ranger',
      'Specter','Crash','Blitz','Hex','Rook','Jinx','Drifter','Rogue','Grizzly','Riptide','Whiplash','Fable','Lynx',
      'Cinder','Static','Patriot','Tundra','Mustang','Kodiak','Sniper','Wildcard','Pilot','Rebel','Comet','Gambit'],
    pre:['Jay','Ky','Bry','Cole','Tre','Dex','Jax','Ash','Zay','Ty','Mav','Ry','Bran','Chase','Hunt','Kade'],
    suf:['den','son','ler','ez','ix','zy','er','o','ton','yy','iee','ster'],num:0.18},
  KR:{palavras:['Haneul','Byeol','Baram','Dokkaebi','Horangi','Mirae','Kkami','Saebyeok','Nabi','Gureum','Taeyang','Bom',
      'Ttang','Bada','Noeul','Hwarang','Dalbit','Sanchae','Yeowoo','Gamja','Mandu','Kimbap','Chingu','Daebak'],
    pre:['Min','Jun','Seo','Hyun','Jae','Do','Woo','Ha','Ji','Sung','Tae','Yeon','Dae','Gyu','Hee','Kyung','Bin','Chan',
      'Eun','Soo','Hwan','Joon'],
    suf:['jin','woo','ho','hyun','min','su','bin','seok','yul','jun','gi','won','ha','rang'],caixa:'alta',num:0.1},
  JP:{palavras:['Kaze','Yuki','Ren','Kumo','Hayate','Raijin','Kitsune','Shiro','Kuro','Sora','Akane','Tsubasa','Hikari',
      'Yami','Tora','Mochi','Tanuki','Kappa','Oni','Hotaru','Kaminari','Shinobi','Sakura','Kage','Tsuki'],
    pre:['Ta','Ke','Hi','Yu','Ka','Ri','Sho','Ryo','Mi','Na','Ko','Ha','Su','Ao','Hayo'],
    suf:['kun','to','ya','ru','zu','ki','ro','ne','ma','shi','chi','tan'],num:0.1},
  CN:{palavras:['Xiaolong','Feng','Long','Lei','Hu','Bai','Yun','Tian','Jin','Shen','Mo','Ying','Ling','Huolong','Xingyu',
      'Baozi','Jiaozi','Tuzi','Xiaoyu','Haixin','Qinglong','Fengbao','Shandian'],
    pre:['Xiao','Zhi','Hao','Yu','Chen','Wei','Jun','Bo','Qi','Kai','Lin','Zi','Yi','Hong','Rui'],
    suf:['bai','feng','lin','yu','xi','an','hao','chen','ming','ze','long','tian'],caixa:'baixa',num:0.22},
  LESTE:{palavras:['Wolk','Kot','Zlo','Grom','Volk','Moroz','Sokol','Medved','Kruk','Burza','Zima','Sowa','Kosmos','Dym',
      'Szczur','Lis','Orzel','Tygrys','Bobr','Kozak','Sapsan','Chort','Buran','Shtorm','Yastreb'],
    pre:['Kub','Wojt','Bart','Ole','Sash','Dim','Max','Igo','Pash','Vla','Mik','Tym','Kost','Yar','Zhen'],
    suf:['ek','ko','ik','yk','ov','ski','ich','ka','son','uha','yn'],num:0.16},
  TR:{palavras:['Aslan','Kurt','Bora','Kartal','Simsek','Yildiz','Deli','Bozkurt','Pasa','Efe','Kral','Tufan','Duman',
      'Atlas','Kaplan','Sahin','Firtina','Volkan','Ejder','Yavuz','Cesur','Akrep','Turna'],
    pre:['Ar','Ber','Can','Emr','Kaa','Mer','Ozz','Tun','Yig','Bur','Cem','Sel','Bat','Ege','Alp'],
    suf:['an','ay','em','ik','kan','er','o','az','ur','ec','han'],num:0.14},
  OESTE:{palavras:['Loup','Faucon','Sturm','Fuchs','Volpe','Lupo','Falke','Storm','Vind','Ulv','Ravn','Kraken','Draug',
      'Garou','Brume','Orage','Blitzer','Eisen','Nebbia','Corvo','Halcon','Toro','Frost','Varg','Tempest','Gecko','Mistral'],
    pre:['Lu','Ma','Ni','Ste','Fab','Alex','Kev','Jo','Lars','Sve','Ben','Theo','Hugo','Nil','Ole','Pim'],
    suf:['x','rio','ian','ki','sen','ou','er','io','ne','ze','an','ke'],num:0.15},
  SEA:{palavras:['Garuda','Harimau','Naga','Bayu','Elang','Badai','Kilat','Mangga','Rusa','Bulan','Sinag','Bagyo','Diwa',
      'Rong','Kancil','Merlion','Tuktuk','Pandan','Durian','Adobo','Lontong','Bunga','Ombak','Petir'],
    pre:['Bud','Adi','Rizk','Nong','Kit','Jun','Ang','Quan','Duc','Aril','Ezz','Bam','Tam','Paco','Jom'],
    suf:['i','an','ny','zz','ko','yo','x','ix','on','ah','ee'],num:0.18},
  IN:{palavras:['Bagh','Garud','Toofan','Vayu','Agni','Shera','Rudra','Chakra','Tandav','Nandi','Masala','Bijli','Sher'],
    pre:['Ani','Raj','Dev','Kar','Arj','Vik','Ish','Rah','Sid','Yash','Adi','Kab'],
    suf:['an','ik','u','ya','ush','av','in','esh'],num:0.2}
};
/* país → grupo */
const NICK_PAIS={BR:'BR',AR:'ES',CL:'ES',MX:'ES',PE:'ES',CO:'ES',ES:'ES',US:'EN',CA:'EN',GB:'EN',AU:'EN',
  KR:'KR',JP:'JP',CN:'CN',PL:'LESTE',UA:'LESTE',RU:'LESTE',TR:'TR',
  FR:'OESTE',DE:'OESTE',IT:'OESTE',NL:'OESTE',SE:'OESTE',DK:'OESTE',FI:'OESTE',
  ID:'SEA',TH:'SEA',PH:'SEA',SG:'SEA',VN:'SEA',MY:'SEA',IN:'IN'};

/* ============================================================
   PATROCINADORES — catálogo de marcas reais
   ------------------------------------------------------------
   Base fixa: toda carreira nova nasce com este catálogo. O Editor
   (Banco de dados › Patrocinadores) muda só o save atual.

   Cada marca tem três classificações:

     · PATAMAR  alto  = multinacional, patrocina qualquer clube do
                        mundo (nível 4 ou 5);
                medio = marca grande de um país ou de um bloco de
                        países (nível 2 ou 3);
                baixo = marca local, quase sempre loja de hardware
                        ou periférico do país (nível 1 ou 2).
     · REGIÃO   GLOBAL, AMER, EMEA, PAC ou CN.
     · PAÍSES   para quem a marca assina. Lista vazia = a região
                inteira. Um clube só recebe marca global, da região
                dele com lista vazia, ou cuja lista tem o país dele.

   O NÍVEL (1 a 5) é o que pesa no dinheiro: decide quanto o
   contrato vale e quais clubes alcançam a marca (ver economia.js).

   LOGO: assets/marcas/<id>.png, onde o id é o nome em minúsculas,
   sem acento, com hífen no lugar de espaço e símbolo
   (Mercedes-Benz → mercedes-benz.png, Guaraná Antarctica →
   guarana-antarctica.png). A lista completa com o nome exato de
   cada arquivo é gerada em assets/marcas/LISTA.md pelo build.
   Sem logo, o jogo desenha uma assinatura com o nome da marca.
   ============================================================ */

const PATAMARES={
  alto:  {nome:'Alto',  desc:'Global',   faixa:[4,5]},
  medio: {nome:'Médio', desc:'Nacional', faixa:[2,3]},
  baixo: {nome:'Baixo', desc:'Local',    faixa:[1,2]}
};

/* Blocos de países que algumas marcas atendem juntos. */
const BLOCOS_MARCA={
  LATAM:['BR','AR','CL','MX','CO','PE','UY','PY','BO','EC','VE','GT','CR','PA','DO','PR','HN','SV'],
  SEA:['SG','ID','TH','PH','MY','VN','KH','MM','BN']
};
const NOME_BLOCO_MARCA={LATAM:'América Latina',SEA:'Sudeste Asiático'};

const PATROCINADORES=(()=>{
  const L=[];
  /* g(patamar, região, países, [[nome, setor, nível], ...]) */
  const g=(patamar,regiao,paises,itens)=>itens.forEach(([nome,setor,nivel])=>
    L.push({nome,setor,patamar,regiao,paises:paises.slice(),nivel}));

  /* ---------------- ALTO · GLOBAL ---------------- */
  g('alto','GLOBAL',[],[
    ['Mercedes-Benz','Automotivo',5], ['Red Bull','Energético',5], ['PlayStation','Games',5],
    ['Uber','Mobilidade',5],          ['Nike','Vestuário',5],      ['Coca-Cola','Bebida',5],
    ['Intel','Hardware',5],           ['Samsung','Eletrônicos',5], ['Mastercard','Pagamentos',5],
    ['AWS','Nuvem',5],
    ['Monster Energy','Energético',4],['Logitech G','Periféricos',4],['Razer','Periféricos',4],
    ['HyperX','Periféricos',4],       ['Secretlab','Cadeiras',4],  ['AMD','Hardware',4],
    ['NVIDIA','Hardware',4],          ['Adidas','Vestuário',4],    ['Puma','Vestuário',4],
    ['Visa','Pagamentos',4],          ['BMW','Automotivo',4],      ['Honda','Automotivo',4],
    ['McDonald\'s','Alimentação',4],  ['KFC','Alimentação',4],     ['DHL','Logística',4],
    ['Spotify','Streaming',4],        ['Lenovo Legion','Computadores',4],['Pepsi','Bebida',4],
    ['Discord','Software',4]
  ]);

  /* ---------------- AMÉRICAS ---------------- */
  g('medio','AMER',['BR'],[
    ['Guaraná Antarctica','Bebida',3], ['iFood','Delivery',3],      ['Itaú','Banco',3],
    ['Nubank','Banco',3],              ['Vivo','Telecom',3],        ['Natura','Cosméticos',3],
    ['Havaianas','Vestuário',3],       ['Magalu','Varejo',3],       ['Bradesco','Banco',3],
    ['Sadia','Alimentos',2],           ['Positivo Tecnologia','Computadores',2],
    ['TIM Brasil','Telecom',2],        ['PicPay','Pagamentos',2],   ['Localiza','Mobilidade',2],
    ['Riachuelo','Vestuário',2]
  ]);
  g('baixo','AMER',['BR'],[
    ['KaBuM!','Hardware',2], ['Pichau','Hardware',1], ['Terabyte Shop','Hardware',1],
    ['DT3 Sports','Cadeiras',1], ['Gamers Club','Plataforma',1]
  ]);
  g('medio','AMER',['US','CA'],[
    ['Verizon','Telecom',3],      ['T-Mobile','Telecom',3],     ['State Farm','Seguros',3],
    ['Chipotle','Alimentação',3], ['Mountain Dew','Bebida',3],  ['Doritos','Snacks',3],
    ['Bank of America','Banco',3],['Ford','Automotivo',3],      ['GEICO','Seguros',2],
    ['Wendy\'s','Alimentação',2], ['Taco Bell','Alimentação',2],['Gatorade','Bebida',2],
    ['Best Buy','Varejo',2],      ['Xfinity','Telecom',2]
  ]);
  g('baixo','AMER',['US','CA'],[
    ['Corsair','Periféricos',2], ['Turtle Beach','Áudio',2], ['NZXT','Hardware',2],
    ['SCUF Gaming','Periféricos',1], ['G Fuel','Energético',1], ['CyberPowerPC','Computadores',1]
  ]);
  g('medio','AMER',BLOCOS_MARCA.LATAM,[
    ['Mercado Livre','E-commerce',3], ['Claro','Telecom',3], ['Rappi','Delivery',2],
    ['Movistar','Telecom',2],         ['Bimbo','Alimentos',2], ['Despegar','Turismo',2]
  ]);
  g('medio','AMER',['AR'],[
    ['YPF','Energia',3], ['Arcor','Alimentos',3], ['Personal','Telecom',2],
    ['Banco Galicia','Banco',2], ['Ualá','Pagamentos',2]
  ]);
  g('baixo','AMER',['AR'],[['Compra Gamer','Hardware',1]]);
  g('medio','AMER',['CL'],[
    ['Falabella','Varejo',3], ['Entel','Telecom',3], ['LATAM Airlines','Aviação',3],
    ['Banco de Chile','Banco',2], ['Copec','Energia',2]
  ]);
  g('baixo','AMER',['CL'],[['SP Digital','Hardware',1]]);
  g('medio','AMER',['MX'],[
    ['Telcel','Telecom',3], ['OXXO','Varejo',3], ['Banorte','Banco',2]
  ]);

  /* ---------------- EMEA ---------------- */
  g('medio','EMEA',[],[
    ['Vodafone','Telecom',3], ['Zalando','E-commerce',3], ['Booking.com','Turismo',3],
    ['Revolut','Pagamentos',3], ['IKEA','Casa',3], ['Bolt','Mobilidade',3],
    ['Ryanair','Aviação',3], ['Lidl','Varejo',2], ['Elgato','Streaming',2],
    ['Wolt','Delivery',2], ['Glovo','Delivery',2], ['Raiffeisen Bank','Banco',2],
    ['Bitdefender','Software',2], ['DPD','Logística',2]
  ]);
  g('baixo','EMEA',[],[
    ['noblechairs','Cadeiras',1], ['Endgame Gear','Periféricos',1], ['CHERRY','Periféricos',1],
    ['be quiet!','Hardware',1]
  ]);
  g('medio','EMEA',['FR'],[
    ['Orange','Telecom',3], ['Renault','Automotivo',3], ['BNP Paribas','Banco',3],
    ['Carrefour','Varejo',3], ['Decathlon','Esporte',3], ['Peugeot','Automotivo',2],
    ['Lacoste','Vestuário',2], ['Ubisoft','Games',2]
  ]);
  g('baixo','EMEA',['FR'],[['LDLC','Hardware',2], ['Materiel.net','Hardware',1], ['Konix','Periféricos',1]]);
  g('medio','EMEA',['ES'],[
    ['Telefónica','Telecom',3], ['Santander','Banco',3], ['SEAT','Automotivo',3],
    ['Zara','Vestuário',3], ['Iberia','Aviação',2], ['El Corte Inglés','Varejo',2]
  ]);
  g('baixo','EMEA',['ES'],[['PcComponentes','Hardware',2], ['Newskill','Periféricos',1], ['Mars Gaming','Periféricos',1]]);
  g('medio','EMEA',['DE','AT'],[
    ['Deutsche Telekom','Telecom',3], ['Volkswagen','Automotivo',3], ['Allianz','Seguros',3],
    ['MediaMarkt','Varejo',3], ['Lufthansa','Aviação',2], ['Haribo','Doces',2]
  ]);
  g('baixo','EMEA',['DE','AT'],[['Caseking','Hardware',1], ['Mindfactory','Hardware',1]]);
  g('medio','EMEA',['GB','IE'],[
    ['BT','Telecom',3], ['Barclays','Banco',3], ['Tesco','Varejo',3],
    ['JD Sports','Vestuário',2], ['Deliveroo','Delivery',2], ['Monzo','Banco',2]
  ]);
  g('baixo','EMEA',['GB','IE'],[['Scan','Hardware',1], ['Overclockers UK','Hardware',1]]);
  g('medio','EMEA',['TR'],[
    ['Turkcell','Telecom',3], ['Turkish Airlines','Aviação',3], ['Beko','Eletrodomésticos',3],
    ['Ülker','Snacks',3], ['Trendyol','E-commerce',3], ['Garanti BBVA','Banco',2],
    ['Getir','Delivery',2]
  ]);
  g('baixo','EMEA',['TR'],[['Monster Notebook','Computadores',2], ['Rampage','Periféricos',1]]);
  g('medio','EMEA',['NL','BE'],[
    ['Philips','Eletrônicos',3], ['ING','Banco',3], ['KLM','Aviação',2], ['bol.com','E-commerce',2]
  ]);
  g('medio','EMEA',['CZ','SK'],[['Škoda','Automotivo',3], ['Alza','Varejo',2]]);
  g('medio','EMEA',['PL'],[['Allegro','E-commerce',3], ['Orlen','Energia',3]]);
  g('baixo','EMEA',['PL'],[['x-kom','Hardware',1]]);

  /* ---------------- PACÍFICO ---------------- */
  g('medio','PAC',BLOCOS_MARCA.SEA,[
    ['Grab','Mobilidade',3], ['Shopee','E-commerce',3], ['Lazada','E-commerce',2],
    ['AirAsia','Aviação',2], ['foodpanda','Delivery',2]
  ]);
  g('medio','PAC',['KR'],[
    ['SK Telecom','Telecom',3], ['Hyundai','Automotivo',3], ['Kia','Automotivo',3],
    ['LG','Eletrônicos',3], ['Woori Bank','Banco',3], ['Nongshim','Alimentos',3],
    ['Lotte','Varejo',3], ['Coupang','E-commerce',3], ['Kakao','Software',3],
    ['KT','Telecom',2], ['Shinhan','Banco',2], ['Baemin','Delivery',2],
    ['Hanwha Life','Seguros',2], ['Naver','Streaming',2]
  ]);
  g('baixo','PAC',['KR'],[['ABKO','Periféricos',1], ['Hansung','Computadores',1]]);
  g('medio','PAC',['JP'],[
    ['Toyota','Automotivo',3], ['NTT Docomo','Telecom',3], ['Uniqlo','Vestuário',3],
    ['Nissin','Alimentos',3], ['Rakuten','E-commerce',3], ['SoftBank','Telecom',3],
    ['Pocari Sweat','Bebida',2], ['Lawson','Varejo',2], ['Mynavi','Serviços',2]
  ]);
  g('baixo','PAC',['JP'],[['ELECOM','Periféricos',1], ['GALLERIA','Computadores',1]]);
  g('medio','PAC',['TH'],[
    ['AIS','Telecom',3], ['CP Group','Alimentos',3], ['True','Telecom',2],
    ['Kasikornbank','Banco',2], ['Central','Varejo',2]
  ]);
  g('baixo','PAC',['TH'],[['Nubwo','Periféricos',1]]);
  g('medio','PAC',['ID'],[
    ['Telkomsel','Telecom',3], ['Indomie','Alimentos',3], ['Gojek','Mobilidade',3],
    ['Tokopedia','E-commerce',2], ['Bank Mandiri','Banco',2]
  ]);
  g('baixo','PAC',['ID'],[['Rexus','Periféricos',1]]);
  g('medio','PAC',['PH'],[
    ['Smart','Telecom',3], ['Jollibee','Alimentação',3], ['Globe','Telecom',2], ['GCash','Pagamentos',2]
  ]);
  g('medio','PAC',['SG'],[
    ['Singtel','Telecom',3], ['DBS','Banco',3], ['Singapore Airlines','Aviação',2]
  ]);
  g('medio','PAC',['IN'],[
    ['Jio','Telecom',3], ['Tata Motors','Automotivo',3], ['boAt','Áudio',2],
    ['Zomato','Delivery',2], ['Paytm','Pagamentos',2]
  ]);
  g('baixo','PAC',['IN'],[['Ant Esports','Periféricos',1]]);

  /* ---------------- CHINA ---------------- */
  g('medio','CN',[],[
    ['Huawei','Eletrônicos',3], ['Xiaomi','Eletrônicos',3], ['JD.com','E-commerce',3],
    ['Meituan','Delivery',3],   ['Nongfu Spring','Bebida',3],['Li-Ning','Vestuário',3],
    ['BYD','Automotivo',3],     ['China Mobile','Telecom',3],['Bilibili','Streaming',3],
    ['Yili','Laticínios',3],    ['Alipay','Pagamentos',3],
    ['Anta','Vestuário',2],     ['Geely','Automotivo',2],    ['Luckin Coffee','Bebida',2],
    ['iQOO','Eletrônicos',2],   ['Douyu','Streaming',2],     ['Huya','Streaming',2],
    ['Mengniu','Laticínios',2], ['Pop Mart','Colecionáveis',2],['Haier','Eletrodomésticos',2],
    ['Wahaha','Bebida',2],      ['RedMagic','Eletrônicos',2]
  ]);
  g('baixo','CN',[],[
    ['AULA','Periféricos',1], ['Royal Kludge','Periféricos',1], ['Rapoo','Periféricos',1],
    ['Machenike','Computadores',1], ['Thunderobot','Computadores',1]
  ]);
  return L;
})();

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

/* ============================================================
   ELENCOS DE PARTIDA — exportado do Editor em 2026-08-29
   ------------------------------------------------------------
   455 jogadores, todos no formato completo:
     ['nick','Função',over,idade,'PA']
   Em LIVRE pode vir um sexto campo, o potencial: é o que faz a jovem
   promessa sem clube nascer com teto alto e o veterano não.

   Este arquivo foi gerado a partir de uma base editada no jogo, então
   função, over, idade e país são as SUAS escolhas, não estimativa.
   Reservas gerados ficaram de fora de propósito: eles voltam a ser
   sorteados a cada run, que é o que mantém os elencos variados.
   ============================================================ */
const ELENCOS_REAIS={
/* ---------------- VCT Americas ---------------- */
NRG:[['keiko','Flex',90,23,'GB'],
     ['skuba','Sentinela',87,23,'US'],
     ['Ethan','Controlador',86,28,'US'],
     ['mada','Duelista',86,22,'CA'],
     ['brawk','Iniciador',86,24,'US']],
LEV:[['Neon','Controlador',91,18,'AR'],
     ['spike','Duelista',90,19,'BR'],
     ['Sato','Duelista',89,19,'BR'],
     ['kiNgg','Flex',87,23,'CL'],
     ['blowz','Iniciador',86,19,'BR']],
'100T':[['Cryocells','Sentinela',90,23,'US'],
        ['Asuna','Flex',85,23,'US'],
        ['vora','Iniciador',85,19,'CA'],
        ['Timotino','Duelista',85,19,'CA'],
        ['bang','Controlador',84,23,'US']],
G2:[['trent','Iniciador',92,23,'US'],
    ['valyn','Controlador',89,24,'US'],
    ['BABYBAY','Sentinela',84,27,'US'],
    ['leaf','Flex',83,23,'CA'],
    ['jawgemo','Duelista',83,25,'US']],
LOUD:[['lukxo','Sentinela',90,20,'BR'],
      ['tkzin','Duelista',84,21,'BR'],
      ['erde','Flex',84,19,'BR'],
      ['Darker','Controlador',84,22,'CO'],
      ['DaviH','Iniciador',80,24,'PT']],
MIBR:[['aspas','Duelista',95,23,'BR'],
      ['zekken','Flex',91,22,'US'],
      ['Verno','Duelista',88,23,'US'],
      ['Mazino','Sentinela',83,24,'CL'],
      ['tex','Iniciador',82,22,'GE']],
EG:[['dgzin','Duelista',89,22,'BR'],
    ['zerona','Flex',83,21,'US'],
    ['Paincakes','Iniciador',81,25,'US'],
    ['supamen','Sentinela',80,23,'US'],
    ['bao','Controlador',80,23,'US']],
'KRÜ':[['Less','Sentinela',91,23,'BR'],
       ['saadhak','Controlador',85,27,'AR'],
       ['heat','Flex',85,25,'BR'],
       ['mwzera','Iniciador',84,23,'BR'],
       ['Dantedeu5','Duelista',81,18,'CL']],
C9:[['OXY','Duelista',88,22,'US'],
    ['Zellsis','Iniciador',82,28,'US'],
    ['FireBallOps','Sentinela',82,19,'US'],
    ['v1c','Flex',82,25,'US'],
    ['Jackk','Iniciador',80,18,'US']],
ENVY:[['keznit','Duelista',84,24,'CL'],
      ['nightz','Flex',84,23,'US'],
      ['Demon1','Flex',83,23,'US'],
      ['Rossy','Sentinela',80,25,'US'],
      ['GLYPH','Controlador',80,25,'US']],
SEN:[['johnqt','Sentinela',88,25,'MA'],
     ['cortezia','Sentinela',86,22,'BR'],
     ['Jerrwin','Duelista',84,24,'IN'],
     ['Reduxx','Flex',82,21,'US'],
     ['JonahP','Iniciador',81,23,'US'],
     ['Marved','Controlador',80,27,'CA']],
FUR:[['basic','Flex',86,18,'BR'],
     ['artzin','Controlador',83,22,'BR'],
     ['Shyy','Sentinela',83,23,'CL'],
     ['koalanoob','Duelista',83,24,'CA'],
     ['C0M','Iniciador',81,23,'US']],
M80:[['Kyu','Iniciador',80,25,'CA'],
     ['Boni','Duelista',80,22,'TH'],
     ['NiSMO','Flex',80,19,'LT'],
     ['alvinboy','Sentinela',80,21,'CN'],
     ['Spaz','Controlador',79,24,'US']],
'2G':[['gobera','Duelista',80,21,'BR'],
      ['qck','Duelista',80,22,'BR'],
      ['xenom','Controlador',80,21,'BR'],
      ['frz','Iniciador',80,23,'BR'],
      ['Brinks','Sentinela',79,19,'BR']],
SRB:[['zander','Controlador',80,24,'BR'],
     ['satellite','Duelista',79,23,'CN'],
     ['exa','Sentinela',79,19,'KR'],
     ['Smoke','Flex',77,23,'US'],
     ['NaturE','Iniciador',76,20,'US']],
SAD:[['payne','Controlador',75,26,'CO'],
     ['zaj','Sentinela',74,20,'BR'],
     ['welyy','Iniciador',73,19,'CA'],
     ['Pa1nt','Flex',73,24,'AR'],
     ['vita','Duelista',73,25,'US']],
RED:[['forbanz','Duelista',77,25,'BR'],
     ['prozin','Flex',76,22,'BR'],
     ['RgLMeister','Controlador',76,26,'BR'],
     ['sw','Sentinela',75,24,'BR'],
     ['Urango','Iniciador',69,25,'BR']],
FX:[['Zanatsu','Flex',75,26,'BR'],
    ['tuyz','Controlador',74,22,'BR'],
    ['jzz','Sentinela',73,22,'BR'],
    ['Palla','Duelista',73,23,'BR'],
    ['mazin','Iniciador',70,26,'BR']],
NBG:[['toozy','Controlador',75,25,'BR'],
     ['sonofcar','Duelista',74,26,'US'],
     ['zeek','Flex',74,25,'US'],
     ['stellar','Iniciador',73,25,'US'],
     ['stunna','Sentinela',72,19,'BR'],
     ['mas','Sentinela',72,26,'BR']],
BST:[['Loss','Duelista',78,18,'BR'],
     ['Melser','Controlador',72,26,'CL'],
     ['Tacolilla','Duelista',70,23,'CL'],
     ['chubizin','Iniciador',69,25,'CL'],
     ['david','Sentinela',69,22,'CL']],

/* ---------------- VCT EMEA ---------------- */
FUT:[['xeus','Duelista',85,25,'TR'],
     ['s0pp','Duelista',85,23,'TR'],
     ['yetujey','Sentinela',85,22,'TR'],
     ['sociablEE','Flex',83,22,'TR'],
     ['KROSTALY','Iniciador',81,26,'TR']],
KC:[['SUYGETSU','Sentinela',86,20,'RU'],
    ['N4RRATE','Flex',86,21,'US'],
    ['dos9','Controlador',83,21,'CZ'],
    ['LewN','Duelista',83,22,'TR'],
    ['Avez','Iniciador',82,21,'EG']],
TL:[['nAts','Sentinela',88,22,'RU'],
    ['kamo','Flex',83,23,'PL'],
    ['trexx','Iniciador',83,22,'RU'],
    ['purp0','Duelista',82,21,'RU'],
    ['Kicks','Flex',81,25,'SV']],
BBL:[['Lar0k','Flex',87,25,'TR'],
     ['Crewen','Sentinela',82,26,'TR'],
     ['Loita','Controlador',81,23,'TR'],
     ['lovers rock','Duelista',81,25,'TR'],
     ['Rosé','Iniciador',80,24,'TR']],
VIT:[['Derke','Duelista',93,24,'FI'],
     ['Chronicle','Sentinela',88,26,'RU'],
     ['Jamppi','Flex',83,25,'FI'],
     ['PROFEK','Controlador',82,23,'PL'],
     ['Sayonara','Iniciador',82,20,'MD']],
TH:[['RieNs','Iniciador',90,26,'TR'],
    ['Wo0t','Duelista',87,23,'TR'],
    ['Boo','Controlador',84,27,'LT'],
    ['koshmaras','Flex',84,20,'LT'],
    ['benjyfishy','Sentinela',83,22,'GB']],
FNC:[['Alfajer','Sentinela',92,22,'TR'],
     ['kaajak','Duelista',90,22,'PL'],
     ['crashies','Iniciador',83,28,'US'],
     ['Cloud','Flex',82,24,'RU'],
     ['Veqaj','Flex',81,26,'FR'],
     ['Boaster','Controlador',80,26,'GB']],
EF:[['Spear','Flex',83,26,'TR'],
    ['Izzy','Flex',83,23,'TR'],
    ['Favian','Duelista',82,21,'TR'],
    ['echo','Sentinela',81,23,'TR'],
    ['nekky','Iniciador',80,21,'TR'],
    ['audaz','Controlador',80,23,'TR']],
NAVI:[['chloric','Iniciador',81,25,'US'],
      ['hiro','Sentinela',81,26,'TR'],
      ['ExiT','Duelista',80,25,'SA'],
      ['Ruxic','Controlador',80,25,'TR'],
      ['Kolosha','Duelista',80,19,'TR']],
M8:[['marteen','Duelista',86,19,'CZ'],
    ['starxo','Iniciador',80,24,'PL'],
    ['Proxh','Controlador',80,25,'TR'],
    ['H1ber','Sentinela',80,22,'FI'],
    ['Minny','Flex',80,25,'CZ']],
GX:[['neT','Iniciador',81,24,'US'],
    ['westside','Sentinela',81,25,'PL'],
    ['Flickless','Flex',80,20,'BE'],
    ['ara','Duelista',80,26,'RO'],
    ['Jesse','Controlador',80,23,'TH']],
AUR:[['Javelin','Duelista',82,23,'SE'],
     ['Darxcioo','Iniciador',81,24,'DE'],
     ['sizo','Sentinela',80,20,'FR'],
     ['avey','Controlador',80,26,'UA']],
EP:[['paTiTek','Controlador',80,19,'PL'],
    ['kozzy','Duelista',80,20,'RO'],
    ['MAGNUM','Sentinela',79,26,'CZ'],
    ['Lime','Duelista',79,21,'FI'],
    ['iluri','Iniciador',77,22,'FI']],
FF:[['batujnax','Iniciador',80,24,'TR'],
    ['hezacoil','Sentinela',80,24,'TR'],
    ['Kachoww','Duelista',80,20,'TR'],
    ['DeadInk','Duelista',80,22,'TR'],
    ['reazy','Controlador',80,22,'TR'],
    ['b1squw1','Flex',78,26,'TR']],
JL:[['UNFAKE','Duelista',80,23,'NL'],
    ['kamyk','Iniciador',80,24,'FI'],
    ['chiwa','Sentinela',80,21,'DE'],
    ['runneR','Flex',77,23,'IT'],
    ['doma','Controlador',76,21,'TR'],
    ['Pa1ze','Sentinela',76,25,'PL']],
SGE:[['azury','Iniciador',76,22,'PL'],
     ['Fizzy','Sentinela',76,26,'ES'],
     ['MONSTEERR','Flex',75,26,'DK'],
     ['musashi','Duelista',73,19,'FR'],
     ['kendo','Controlador',72,26,'ES'],
     ['Jamelinho213','Controlador',70,20,'IT']],
MISA:[['sh1va','Controlador',74,25,'GB'],
      ['Ronniee','Sentinela',74,25,'DE'],
      ['MERZ','Flex',73,26,'TR'],
      ['Riser','Duelista',73,21,'DK'],
      ['Fortres','Duelista',72,26,'DK'],
      ['pAwn1','Iniciador',71,20,'FR']],
MDR:[['Kada','Iniciador',74,24,'TR'],
     ['Sevire','Sentinela',74,22,'FR'],
     ['nataNk','Duelista',72,19,'ES'],
     ['sh1n','Controlador',72,19,'IT'],
     ['TakaS','Flex',71,19,'TR']],
MIR:[['Bishepss','Sentinela',73,21,'SE'],
     ['Redgar','Duelista',70,20,'FR'],
     ['Raz','Flex',70,21,'SE'],
     ['reblyik','Iniciador',69,19,'NL'],
     ['kospa1n','Controlador',69,26,'DK']],
PCF:[['qpert','Controlador',80,22,'SV'],
     ['al0rante','Flex',80,22,'GE'],
     ['NINJA','Sentinela',80,22,'PL'],
     ['seven','Duelista',80,21,'MX'],
     ['waddle','Iniciador',80,20,'GB']],

/* ---------------- VCT Pacific ---------------- */
GEN:[['t3xture','Flex',93,22,'KR'],
     ['Karon','Controlador',87,22,'KR'],
     ['Ash','Duelista',84,24,'KR'],
     ['Efina','Iniciador',84,26,'KR'],
     ['Raxcal','Sentinela',84,19,'KR']],
NS:[['Dambi','Duelista',89,24,'KR'],
    ['Rb','Controlador',85,24,'KR'],
    ['Francis','Duelista',85,26,'PH'],
    ['Xross','Iniciador',84,22,'SG'],
    ['Ivy','Sentinela',81,23,'TH']],
GE:[['PatMen','Flex',89,24,'KR'],
    ['UdoTan','Duelista',82,21,'PH'],
    ['Autumn','Duelista',82,22,'MY'],
    ['xavi8k','Controlador',81,22,'TH'],
    ['Kr1stal','Iniciador',80,26,'KR']],
T1:[['Meteor','Flex',87,24,'KR'],
    ['BuZz','Duelista',86,25,'KR'],
    ['Munchkin','Controlador',86,28,'KR'],
    ['DH','Sentinela',86,19,'AU'],
    ['stax','Sentinela',84,27,'KR'],
    ['iZu','Iniciador',82,24,'KR']],
PRX:[['f0rsakeN','Flex',95,23,'ID'],
     ['Jinggg','Duelista',91,22,'SG'],
     ['something','Duelista',90,24,'RU'],
     ['d4v41','Sentinela',86,24,'ID'],
     ['invy','Iniciador',84,23,'PH']],
DFM:[['Caedye','Sentinela',91,19,'JP'],
     ['yatsuka','Duelista',84,25,'JP'],
     ['SSeeS','Controlador',81,20,'JP'],
     ['Akame','Iniciador',81,25,'JP'],
     ['Meiy','Duelista',80,23,'JP']],
VL:[['Klaus','Controlador',82,21,'KR'],
    ['oonzmlp','Sentinela',81,24,'KR'],
    ['Foxy9','Flex',80,24,'KR'],
    ['C1ndeR','Controlador',80,19,'KR'],
    ['XuNa','Iniciador',80,23,'KR'],
    ['Zexy','Duelista',80,20,'KR']],
KRX:[['MaKo','Controlador',88,25,'KR'],
     ['HYUNMIN','Duelista',86,26,'KR'],
     ['BeYN','Iniciador',85,22,'KR'],
     ['yong','Sentinela',83,20,'KR'],
     ['free1ng','Flex',80,22,'KR']],
ZETA:[['eKo','Flex',83,22,'KR'],
      ['SugarZ3ro','Controlador',82,24,'JP'],
      ['Absol','Duelista',82,24,'JP'],
      ['SyouTa','Sentinela',80,23,'JP'],
      ['Xdll','Iniciador',80,25,'JP']],
FS:[['primmie','Duelista',89,20,'TH'],
    ['seph1roth','Sentinela',81,19,'TH'],
    ['Killua','Iniciador',80,26,'TH'],
    ['JitBoyS','Duelista',80,19,'TH']],
RRQ:[['Monyet','Controlador',86,19,'ID'],
     ['xffero','Sentinela',82,23,'ID'],
     ['crazyguy','Iniciador',82,24,'VN'],
     ['Xan','Duelista',81,26,'MY'],
     ['Jemkin','Flex',80,26,'RU'],
     ['Kushy','Controlador',80,21,'MY']],
TS:[['Sylvan','Controlador',81,25,'KR'],
    ['kellyS','Flex',80,22,'PH'],
    ['natz','Sentinela',80,24,'IN'],
    ['STYRON','Iniciador',80,23,'SG'],
    ['Zeus','Duelista',80,19,'PH']],
ONG:[['Ray','Iniciador',80,26,'ID'],
     ['Cloudy','Controlador',80,23,'TH'],
     ['Wolverine','Sentinela',80,24,'JP'],
     ['Faither','Flex',80,20,'PH'],
     ['Mobugi','Controlador',80,25,'AU'],
     ['Hermes','Duelista',77,19,'IN']],
DK:[['Kally','Duelista',80,19,'KR'],
    ['shu','Controlador',79,22,'KR'],
    ['JaXe','Sentinela',78,22,'AU'],
    ['CabezA','Flex',76,25,'PH'],
    ['Ramgi','Iniciador',75,22,'AU']],
FL:[['Hals','Iniciador',79,19,'PH'],
    ['CLZ','Controlador',78,19,'SG'],
    ['GangPin','Flex',78,26,'TH'],
    ['Anthem','Sentinela',76,25,'JP'],
    ['Aace','Duelista',75,19,'MY']],
SP:[['Laz','Sentinela',78,23,'JP'],
    ['PTC','Duelista',76,22,'KR'],
    ['Kadoom','Iniciador',75,23,'KR'],
    ['Apinya','Controlador',75,26,'KR'],
    ['NIZ','Flex',74,20,'TH']],
RC:[['Jremy','Flex',78,24,'KR'],
    ['Persia','Controlador',77,22,'PH'],
    ['BRIAN','Sentinela',76,23,'VN'],
    ['Yoshiii','Duelista',74,21,'IN'],
    ['hiroronn','Sentinela',74,20,'MY'],
    ['Dep','Iniciador',73,20,'SG']],
ART:[['RedLight','Flex',76,22,'KR'],
     ['Rico','Sentinela',73,20,'JP'],
     ['ANNYEON','Iniciador',72,20,'KR'],
     ['JaebiN','Controlador',72,25,'MY'],
     ['XIV','Duelista',71,25,'ID']],
XIP:[['canady','Duelista',73,19,'PH'],
     ['endoist','Flex',73,24,'KR'],
     ['aLerT','Controlador',71,24,'ID'],
     ['doffy','Iniciador',70,26,'KR'],
     ['Surf','Sentinela',70,25,'KR'],
     ['bnwgiggs','Sentinela',70,24,'AU']],
QTD:[['Misaya','Iniciador',73,19,'KR'],
     ['yuran','Controlador',72,22,'KR'],
     ['Kippei','Duelista',69,24,'KR'],
     ['Pkm','Sentinela',69,23,'MY'],
     ['margaret','Flex',69,19,'KR']],

/* ---------------- VCT China ---------------- */
NOVA:[['Ezeir','Controlador',81,25,'CN'],
      ['qiutiaN','Iniciador',80,19,'CN'],
      ['cb','Duelista',80,25,'CN'],
      ['GuanG','Sentinela',80,19,'CN'],
      ['swagzor','Duelista',80,25,'RU'],
      ['kodeth','Duelista',80,23,'CN']],
TYL:[['SiuFatBB','Iniciador',83,23,'HK'],
     ['Scales','Flex',83,20,'CN'],
     ['slowly','Duelista',83,20,'CN'],
     ['Erv','Controlador',82,24,'CN'],
     ['splash','Duelista',80,20,'ID'],
     ['xihe','Controlador',80,22,'CN']],
BLG:[['yilai','Sentinela',84,25,'CN'],
     ['rushia','Flex',82,19,'CN'],
     ['nephh','Iniciador',82,22,'SG'],
     ['Knight','Flex',82,22,'CN'],
     ['whzy','Duelista',81,22,'CN']],
JDG:[['zhe','Flex',84,26,'CN'],
     ['BerLIN','Iniciador',83,21,'TW'],
     ['jkuro','Duelista',80,22,'CN'],
     ['Yuicaw','Sentinela',80,23,'TW'],
     ['crownfisher','Controlador',80,25,'CN']],
EDG:[['ZmjjKK','Duelista',93,23,'CN'],
     ['CHICHOO','Sentinela',89,26,'CN'],
     ['nobody','Iniciador',84,25,'CN'],
     ['Smoggy','Controlador',83,25,'CN'],
     ['stew','Sentinela',83,23,'KR'],
     ['Jieni7','Flex',81,20,'KR']],
XLG:[['happywei','Sentinela',85,26,'TW'],
     ['WsLeo','Iniciador',83,21,'TW'],
     ['Lysoar','Controlador',83,26,'CN'],
     ['Sharks','Iniciador',82,20,'CN'],
     ['NoMan','Duelista',81,24,'HK'],
     ['Rarga','Duelista',80,22,'RU']],
TE:[['deLb','Sentinela',84,20,'ID'],
    ['LuoK1ng','Controlador',83,23,'CN'],
    ['Kai','Iniciador',83,25,'CN'],
    ['FKEY','Iniciador',83,20,'CN'],
    ['Abo','Iniciador',81,26,'CN'],
    ['FengF','Duelista',80,21,'CN']],
TEC:[['Dynamite','Duelista',84,26,'CN'],
     ['ra1ny','Duelista',84,23,'CN'],
     ['Haodong','Sentinela',83,24,'CN'],
     ['Coco','Controlador',83,24,'CN'],
     ['Spitfires','Flex',81,20,'CN'],
     ['lucas','Iniciador',80,22,'CN']],
WOL:[['Spring','Controlador',85,21,'TW'],
     ['aluba','Iniciador',85,26,'CN'],
     ['Deryeon','Flex',84,26,'SG'],
     ['yosemite','Sentinela',81,23,'CN'],
     ['glacier','Duelista',80,23,'TW'],
     ['nothing','Iniciador',80,23,'CN']],
AG:[['Bai','Sentinela',84,23,'CN'],
    ['Shr1mp','Iniciador',83,20,'CN'],
    ['K1ra','Flex',83,19,'CN'],
    ['f4ngeer','Duelista',81,19,'RU'],
    ['iamgrq','Controlador',80,25,'CN']],
FPX:[['Xlele','Duelista',84,23,'KR'],
     ['Setrod','Flex',84,20,'CN'],
     ['coconut','Iniciador',83,20,'KR'],
     ['AAAAY','Sentinela',82,22,'KR'],
     ['PHO','Controlador',82,23,'CN']],
DRG:[['vo0kashu','Sentinela',85,20,'CN'],
     ['Nicc','Iniciador',83,23,'TW'],
     ['SpiritZ1','Duelista',83,23,'CN'],
     ['Life','Duelista',82,25,'KR'],
     ['Flex1n','Iniciador',80,26,'CN'],
     ['Verse','Controlador',80,20,'CN']],
WBG:[['AcMe','Duelista',80,22,'CN'],
     ['Satoshi','Controlador',80,22,'CN'],
     ['heybay','Sentinela',78,24,'CN'],
     ['Leav3u','Flex',77,22,'CN'],
     ['Yoyo','Iniciador',76,21,'CN']],
RA:[['Guran','Duelista',79,20,'CN'],
    ['Croudy','Sentinela',79,23,'CN'],
    ['Potter','Iniciador',77,22,'KR'],
    ['Z1yan','Sentinela',77,23,'CN'],
    ['nnono','Controlador',75,21,'CN'],
    ['Ben1Ley','Flex',75,21,'CN']],
KBG:[['sibeastw0w','Iniciador',80,25,'KR'],
     ['Akeman','Duelista',78,23,'KR'],
     ['coldfish','Flex',78,19,'CN'],
     ['Tonk','Controlador',77,24,'CN'],
     ['Ying','Sentinela',76,20,'CN'],
     ['Krst1Ng','Flex',75,23,'CN']],
AT:[['Dingwei','Sentinela',78,19,'KR'],
    ['Layla','Flex',76,23,'CN'],
    ['Folykiki','Controlador',75,21,'CN'],
    ['monk','Duelista',73,25,'CN'],
    ['Eren','Iniciador',73,25,'CN'],
    ['Pink','Iniciador',72,20,'CN']],
AQ:[['Juicy','Duelista',76,19,'CN'],
    ['S1Mon','Iniciador',75,25,'CN'],
    ['5CM','Controlador',75,25,'KR'],
    ['Dannyy','Flex',75,22,'CN'],
    ['FFs','Sentinela',73,26,'CN']],
WSIG:[['M1ng929','Duelista',74,19,'CN'],
      ['Ye','Controlador',74,26,'CN'],
      ['jowa','Flex',73,20,'CN'],
      ['Levius','Sentinela',71,25,'KR'],
      ['Apathy','Iniciador',70,22,'CN'],
      ['Ugly','Flex',70,24,'CN']],
ODG:[['XyuS','Duelista',78,22,'CN'],
     ['ZiXuan','Controlador',74,21,'CN'],
     ['YHchen','Iniciador',73,24,'CN'],
     ['W1nner','Sentinela',72,24,'KR']],
VLG:[['Nana','Duelista',75,26,'KR'],
     ['p1katong','Controlador',72,23,'KR'],
     ['maofish','Sentinela',71,20,'CN'],
     ['Ayu','Iniciador',69,25,'KR'],
     ['Yunni','Flex',69,20,'CN']],

/* ---------------- Sem clube ---------------- */
LIVRE:[['TenZ','Duelista',86,25,'CA'],
       ['Sacy','Iniciador',84,29,'BR'],
       ['eeiu','Iniciador',83,24,'US'],
       ['cauanzin','Duelista',80,21,'BR'],
       ['GSR','Flex',75,26,'SE'],
       ['sheydos','Controlador',75,26,'RU'],
       ['Shao','Iniciador',74,25,'RU'],
       ['Eggsterr','Controlador',69,21,'PE'],
       ['tomaszy','Iniciador',69,24,'GB'],
       ['bipo','Controlador',69,21,'IT'],
       ['Flicker','Duelista',69,24,'KR'],
       ['thyy','Flex',69,22,'AU'],
       ['Leviathan','Flex',69,24,'PH'],
       ['Crws','Iniciador',75,29,'TH'],
       ['CyvOph','Flex',76,27,'FR'],
       ['Filu','Duelista',75,27,'PL'],
       ['Moves','Iniciador',74,27,'KR'],
       ['zjc','Iniciador',74,26,'CN'],
       ['GREEN','Duelista',73,27,'TW'],
       ['niffy','Duelista',73,26,'TH'],
       ['MiniBoo','Duelista',74,26,'LT'],
       ['FT','Controlador',73,26,'CN'],
       ['MiradaNinja','Sentinela',72,20,'CL',89],
       ['wayne','Controlador',72,20,'SG',89],
       ['suyjing','Flex',72,20,'CN',88],
       ['Tiyosta','Sentinela',71,19,'TR',88],
       ['aztex','Controlador',71,18,'BR',90],
       ['peixeh','Controlador',70,18,'BR',89],
       ['Luid','Duelista',71,18,'BR',91],
       ['turkish','Sentinela',70,18,'BR',88],
       ['sanoj','Flex',69,17,'BR',92],
       ['znajder','Duelista',69,17,'BR',93]],
};

/* ============================================================
   COMISSÃO TÉCNICA REAL — por tag de clube
   ------------------------------------------------------------
   Fontes, lidas em 2026-10-30 — o crédito está nos Créditos do jogo:
   - os 10 primeiros clubes: Liquipedia (liquipedia.net/valorant),
     página de cada time, texto sob CC-BY-SA 3.0;
   - os demais (blocos marcados "vlr.gg"): seção "staff" da página de
     cada time no vlr.gg, a mesma base de data/times.js. Função vem do
     vlr em minúsculas e foi só capitalizada; "Staff" é função genérica
     do vlr e vira equipe do clube.
   Clube sem staff publicado (AQ, WSIG, VLG, BST) fica de fora e mantém
   comissão gerada.
   - comissão que ficou sem clube na janela de out/2026 (perfil de cada
     um no vlr.gg) foi empregada em vaga de técnico ou analista que
     estava sem dono real: kaplan (M80), termi (ART), alexRr (WOL),
     KUNDIKUNDI e Mavera (M8), ENGH (FNC), pipsoN (GX), Spin (TS),
     Warbirds (RRQ), Argency (KRX), Sungmin (NS), yoman (DK), Faded
     (NBG), PAL (JL); e, só com o nick da foto, alvez (RED), joaovictor
     (FX), neves (2G) e phill (SAD). Os demais acréscimos são do próprio clube no vlr.
   - AURORA herdou a comissão da NAVI Junior junto com o elenco.

   Formato progressivo, como ELENCOS_REAIS:
     ['nick','Função','Nome Completo','PA']
   Só o nick é obrigatório. A função é a da Liquipedia, em inglês, e
   staff.js traduz para o cargo do jogo (cargoDeFuncao):
     Head Coach / Coach            → tecnico
     Assistant Coach / Analyst     → analista
     Performance / Mental Coach    → mental
     Physio                        → fisio
     Scout                         → olheiro
   Função sem cargo no jogo (Manager, General Manager) ou cargo já
   ocupado vira "equipe do clube": aparece com nome e foto, sem efeito
   na partida. Vaga que não está aqui continua gerada.

   Foto: assets/staff/<nick em slug>.png|jpg|webp — mesma regra de
   assets/players/. Clube ausente desta lista mantém comissão gerada.
   ============================================================ */
const COMISSAO_REAL={
/* ---------------- VCT Americas ---------------- */
SEN:[['Ewok','Head Coach','Marthinus Jacobus van der Walt','ZA'],
     ['GUNTER','Assistant Coach','Luke Clives','GB'],
     ['Zyto','Team Manager','Bryan Ybanez','US']],
NRG:[['bonkar','Head Coach','Malkolm Rench','SE'],
     ['Strong','Assistant Coach','Joseph Edwards','GB'],
     ['bikeage','General Manager','Jaime Cohenca','US'],
     ['mitch','Assistant Coach','Mitch Semago','US']],
LOUD:[['Romanilly','Head Coach','Gonzalo Manzano','AR'],
      ['Bati','Assistant Coach','Miguel Batista','PT'],
      ['Wenty','Team Manager','Carlos Lira Portela','BR'],
      ['bajerski','Performance Coach','Lucas Bajerski Pereira','BR']],
'100T':[['Nbs','Head Coach','Laurynas Kisielius',''],
        ['d00mbr0s','Assistant Coach','Carl Erik Victor William Sandgren','SE'],
        ['Kaimera','Analyst','Nathan McAdams','']],
MIBR:[['fRoD','Coach','Daniel Montaner','US'],
      ['Happy','Assistant Coach','Vincent Cervoni Schopenhauer','FR'],
      ['Chivitz','Manager','Felipe Chivitz','BR']],
EG:[['potter','Head Coach','Christine Chi','US'],
    ['pho','Assistant Coach','Mike Panza','US']],
FUR:[['shaW','Head Coach','Ian Jardim','BR'],
     ['Kamino','Assistant Coach','Lucas Kamino','BR'],
     ['zaz','Head of Performance','Júlia Medeiros','BR'],
     ['lukzera','Manager','Lucas Soares','BR']],
/* ---------------- VCT EMEA ---------------- */
TH:[['Neilzinho','Head Coach','Neil Finlay',''],
    ['weber','Coach','Brandon William Weber',''],
    ['EsportsRyan','Performance Coach','Ryan Scollan',''],
    ['Niklas','Manager','Niklas Geiss','DE']],
TL:[['LohaN','Head Coach','Ivo Renato Da Silva Santos Albino','PT'],
    ['yaotziN','Assistant Coach','Daniel Roczniak','PL'],
    ['7Teen','Performance Coach','Tanner Curtis','US'],
    ['cauzed','Manager','Eamon Drea','GB'],
    ['Mol','Manager','Berke Mol','TR']],
/* ---------------- VCT Pacific ---------------- */
PRX:[['alecks','Coach','Alexandre Sallé','FR'],
     ['Wendler','Assistant Coach','Ashton Wendler','US'],
     ['Panda','Performance Coach','Laijhun Cheng','US'],
     ['Tommy','Team Manager','Kumaresan Ramani','SG']],
/* ---------------- VCT Americas — vlr.gg ---------------- */
LEV:[['Onur','Head Coach','Rodrigo Dalmagro','AR']],
G2:[['JoshRT','Head Coach','Josh Lee','US'],
    ['shhhack','Assistant Coach','Peter Belej','SK'],
    ['Robert','Performance Coach','Robert Yip','IE'],
    ['Ambrose','Manager','Ambrose Lai','US']],
C9:[['Veer','Head Coach','Wyatt Blevins','US'],
    ['Immi','Assistant Coach','Ian Harding','GB']],
'KRÜ':[['ZONYK','Head Coach','Nicolas Carboni','CL'],
       ['Fadeout','Analyst','Alex Argüello','AR'],
       ['torito','Manager','Cristobal Quintana','CL']],
ENVY:[['Stunner','Head Coach','Dakota MacLeod','CA'],
      ['WKN','Coach','Alvaro Bustos','CL']],
/* ---------------- VCT Americas Challengers — vlr.gg ---------------- */
SRB:[['effys','Head Coach','Loic Sauvageau','CA'],
     ['oderus','Assistant Coach','Chad Miller','US'],
     ['lyka','Manager','Angelika Alda','CA']],
RED:[['DRAGziKW','Head Coach','Elias Santiles','BR'],
     ['alvez','Assistant Coach','','']],
FX:[['stkJ','Coach','Jordan Nunes','BR'],
    ['joaovictor','Assistant Coach','','']],
'2G':[['gaabxx','Head Coach','Gabriel Carli','BR'],
      ['neves','Assistant Coach','','']],
SAD:[['mikey','Head Coach','','US'],
     ['kaitlynxe','Manager','Kaitlyn Perkovic','US'],
     ['phill','Assistant Coach','','']],
NBG:[['practo','Assistant Coach','Christopher Ryu','KR'],
     ['mas','Staff','Michael Smith','US'],
     ['Faded','Head Coach','Daniel Hwang','US']],
M80:[['kaplan','Head Coach','Adam Kaplan','US']],
/* ---------------- VCT EMEA — vlr.gg ---------------- */
FNC:[['Desmo','Assistant Coach','Casper Rasmussen','DK'],
     ['Szed','Performance Coach','Philipp Schickor','DE'],
     ['CoJo','Manager','Colin Johnson','US'],
     ['ENGH','Head Coach','Andrey Sholokhov','RU']],
GX:[['wayLander','Assistant Coach','Jan Rahkonen','FI'],
    ['Mew','Performance Coach','Théo Ponzoni','FR'],
    ['Hehnal','Manager','Alexandra Hehn','DE'],
    ['pipsoN','Head Coach','Daniil Mesheryakov','RU']],
KC:[['ZE1SH','Head Coach','Ahmed El Sheikh','EG'],
    ['simoz','Assistant Coach','Simone Giovannini','IT']],
EF:[['afr0nfire','Head Coach','Hakan Pınarbaşı','TR'],
    ['casteLL0','Assistant Coach','Hazım Orhun Dalbeyler','TR']],
VIT:[['Scuttt','Coach','Benjamin Hutchinson','IE'],
     ['slk','Analyst','Aleksey Lynksov','RU'],
     ['Bangovic','Manager','Andy Zajimovic','DE']],
FUT:[['Vlad','Head Coach','Berke Kantürk','TR'],
     ['Bambino','Assistant Coach','Tyler Jay','GB'],
     ['Mighty','Manager','Berkalp Kaan Yılmazoğlu','TR']],
BBL:[['KEY','Head Coach','Mert Çelebi','TR'],
     ['Viento','Assistant Coach','Göktuğ Alp Çebi','TR']],
M8:[['ManyFender','Manager','Marc Kowolik','FR'],
    ['Luinwess','Staff','Sinan Koyuncu','TR'],
    ['KUNDIKUNDI','Head Coach','Jiri Honkala','FI'],
    ['Mavera','Assistant Coach','Erim Sasal','TR']],
/* org inativa no vlr desde out/2026: última comissão publicada */
NAVI:[['ANGE1','Head Coach','Kyrylo Karasov','UA'],
      ['salah','Assistant Coach','Salah Barakat','GB'],
      ['Zuzanna','Performance Coach','Zuzanna Hejduk-Mostowy','PL']],
AUR:[['Johnta','Coach','Ivan Shevtsov','UA']],
/* ---------------- VCT EMEA Challengers — vlr.gg ---------------- */
EP:[['Itopata','Head Coach','Dimitar Staev','BG'],
    ['ShadoW','Assistant Coach','Tobias Flodström','SE'],
    ['daky','Staff','Roland Nguyen','SK']],
FF:[['Lev','Coach','Levent Köktürk','TR'],
    ['XovLoV','Assistant Coach','Buğra Erdönmez','TR']],
JL:[['pakko','Head Coach','Pavle Kostic','RS'],
    ['Bilal','Manager','','MA'],
    ['PAL','Assistant Coach','Gregor Morton','GB']],
SGE:[['TonY','Head Coach','','NL'],
     ['Sebe','Coach','Sebastian Kruft','DE'],
     ['Lenz','Manager','Christian Lenz','DE']],
MISA:[['Draken','Head Coach','Baran Elüstü','TR'],
      ['Leise','Assistant Coach','','TR']],
MDR:[['Larsson','Head Coach','','FR'],
     ['SKAZZ','Assistant Coach','','FR']],
MIR:[['pops','Head Coach','Egor Zinoviev','RU'],
     ['NightMaster','Manager','Maksim Pechkurov','RU']],
PCF:[['thinkii','Head Coach','Manuel Martínez','ES'],
     ['ZaeS','Assistant Coach','Dario Gomez','ES'],
     ['Koyo','Analyst','Koray Arpat','DE']],
/* ---------------- VCT Pacific — vlr.gg ---------------- */
T1:[['KDG','Head Coach','Kim Dong-gun','KR'],
    ['Norman','Manager','Shin Jun-ho','KR'],
    ['CheongGak','Assistant Coach','Lee Il-ho','KR']],
GEN:[['solo','Head Coach','Kang Geun-chul','KR'],
     ['HSK','Coach','Kim Hae-seong','KR'],
     ['peri','Coach','Jung Bum-ki','KR']],
KRX:[['glow','Coach','Kim Min-soo','KR'],
     ['Argency','Assistant Coach','Kwon Soon-woo','KR']],
/* org inativa no vlr desde out/2026: última comissão publicada */
GE:[['Platoon','Head Coach','Daniel Zhou','CA'],
    ['Aimix Strange','Assistant Coach','Derren dela Cruz','PH'],
    ['Fields','Analyst','Sam Greenfield','GB'],
    ['Vatsal','Manager','Vatsal Uniyal','IN'],
    ['taeri','Staff','Hose Son','KR']],
NS:[['SilKanoN','Head Coach','Kim Gyeong-min','KR'],
    ['Sungmin','Assistant Coach','So Seong-min','KR']],
RRQ:[['Rebecca','Performance Coach','Rebecca Wong','MY'],
     ['SeasoNz','Manager','Joe Lai','MY'],
     ['Jomengz','Staff','Jonathan Hoo','ID'],
     ['Warbirds','Coach','Evan Olzem','US']],
DFM:[['Vorz','Head Coach','Kakeru Ikarashi','JP'],
     ['Melofovia','Coach','Hirotaka Okazaki','JP'],
     ['NorthernLights','Coach','Tsubasa Ando','JP']],
TS:[['skye','Analyst','Felipe Skye Lim','SG'],
    ['yamyam yui','Manager','Yamyam Villanueva Yui','PH'],
    ['Spin','Head Coach','Peter Bradford','GB']],
VL:[['TK9','Head Coach','Goo Tae-kyun','KR'],
    ['R3THME','Analyst','Kim Ki-woon','KR']],
FS:[['FrosT','Head Coach','Hector Rosario','US'],
    ['THEELOVEFAMILY','Coach','Thanaphat Limpaphan','TH'],
    ['Sushiboys','Assistant Coach','Panyawat Subsiriroj','TH']],
ZETA:[['ryota-','Head Coach','Ryota Okayama','JP'],
      ['XQQ','Assistant Coach','Motoyama Hibiki','JP'],
      ['gya9','Analyst','','JP']],
/* ---------------- VCT Pacific Challengers — vlr.gg ---------------- */
/* org inativa no vlr desde out/2026: última comissão publicada */
ONG:[['Hype','Head Coach','Park Min-soo','KR'],
     ['Mobugi','Coach','Yoo Jee-hoon','KR'],
     ['Doo','Coach','Jung Hyeon-doo','KR'],
     ['Leg1t','Coach','','KR']],
DK:[['empty','Coach','Lee Won-bin','KR'],
    ['yoman','Assistant Coach','Chae Young-moon','KR']],
FL:[['Euler','Head Coach','Kazuki Kubota','JP'],
    ['sieg','Coach','','JP']],
RC:[['Egi','Head Coach','','JP'],
    ['Bullco','Coach','','KR'],
    ['shuu','Assistant Coach','','JP']],
SP:[['Leaf','Head Coach','Leaf Thammarongseri','TH'],
    ['MYM','Assistant Coach','Piyangoon Kitisin','TH'],
    ['Psychopath','Analyst','','TH']],
QTD:[['Relife','Head Coach','','JP']],
XIP:[['ASI','Coach','','TH'],
     ['PoomOneLove','Assistant Coach','Rujipoom Changkrut','TH'],
     ['bnwgiggs','Staff','','TH']],
ART:[['termi','Head Coach','Pyeon Seon-ho','KR']],
/* ---------------- VCT China — vlr.gg ---------------- */
NOVA:[['24K','Head Coach','Shao Yubo','CN'],
      ['OnbusH','Coach','Kim Taek-soo','KR']],
TYL:[['hypnotizing','Head Coach','Xie Haozhi','CN'],
     ['Billyo','Assistant Coach','Li Xinyu','CN'],
     ['sword9','Assistant Coach','Li Wei','CN'],
     ['Ominous','Analyst','Sushant Jha','NP'],
     ['fc4t','Manager','Yang Jiawei','CN']],
JDG:[['bail','Head Coach','Lee Sung-jae','KR'],
     ['Desire','Assistant Coach','Peng Siji','CN'],
     ['JIANDAN','Manager','Wang Sai','CN'],
     ['Phong','Staff','Huang Chunfeng','CN']],
BLG:[['Anaks','Head Coach','Ye Sang-jun','KR'],
     ['YaoXie','Coach','Zhang Jihang','CN'],
     ['Jexen','Coach','Wang Lin Xiao','CN'],
     ['Gandolf','Manager','Jiang Hao','CN'],
     ['Rain','Staff','Deng Shiyao','CN']],
TE:[['destroyeR','Head Coach','Gu Jiaming','CN'],
    ['Yiyee','Coach','Zhang Tianyuan','CN'],
    ['Viva','Coach','Lifan Ran','CN'],
    ['KaKa','Manager','Zhou Wenxing','CN'],
    ['Draven','Staff','','CN']],
AG:[['ED101','Head Coach','Han Tianqi','CN'],
    ['ANXiOS','Assistant Coach','Victor Troshkin','RU'],
    ['AaRon0','Manager','Xu Maoxiao','CN'],
    ['Master','Staff','Cheng Zihan','CN']],
TEC:[['AfteR','Head Coach','Lo Wen-Hsin','TW'],
     ['Muggle','Coach','Tang Shijun','CN'],
     ['3water','Assistant Coach','Liu Miao','CN'],
     ['sora','Analyst','Hao Jinyu','CN'],
     ['Gazero','Manager','Li Zhe','CN'],
     ['LemoN','Staff','Liu Qirui','CN']],
XLG:[['hvoya','Head Coach','Aleksandr Eremin','RU'],
     ['steady','Assistant Coach','Dmitry Prutkov','RU'],
     ['Fayde','Analyst','Chong Hoc Wah','MY'],
     ['Arty','Manager','Yang Zhe','CN'],
     ['Coffin0','Staff','Tao Yumeng','CN']],
EDG:[['Autumn','Head Coach','Yoon Eu-teum','KR'],
     ['Indigo','Coach','Seol Do-hoon','KR'],
     ['signed','Coach','Dale Tang','NZ'],
     ['Hibari','Manager','Jin Xingyu','CN']],
FPX:[['LEGIJA','Head Coach','Nikola Ninić','DE'],
     ['York','Assistant Coach','Yao Kun','CN'],
     ['9hr','Manager','Guan Haoran','CN'],
     ['PHO','Staff','Zhang Shicheng','CN']],
DRG:[['NaThanD','Head Coach','Deng Senqiao','CN'],
     ['Alti','Coach','','CN'],
     ['1t','Assistant Coach','Huang Biaohong','CN'],
     ['Melon','Analyst','','CN']],
WOL:[['Chao','Manager','','CN'],
     ['Ja7','Staff','','CN'],
     ['alexRr','Head Coach','Alexander Frisch','DE']],
/* ---------------- VCT China Challengers — vlr.gg ---------------- */
RA:[['mikiya','Coach','Zhu Jianan','CN'],
    ['Punch1','Staff','Wang Yiquan','CN']],
WBG:[['Milan','Head Coach','Milan de Meij','NL'],
     ['Stardust','Coach','','CN'],
     ['Scott Currie','Assistant Coach','Scott Currie','IE']],
KBG:[['Naint','Coach','Mingiyan Goldaev','RU']],
AT:[['Malix','Head Coach','Yoon Kyung-ho','KR']],
ODG:[['Oi','Coach','Liu Zhiwei','CN']]
};

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

/* ============================================================
   PRÉ-HISTÓRIA DO CIRCUITO — 2021 a 2026
   ------------------------------------------------------------
   PROVENIÊNCIA: resultados reais, lidos da página "Valorant
   Champions Tour" da Wikipédia em 29/08/2026. Não há nada
   estimado aqui — campeão e vice são o que a fonte diz, e onde a
   fonte não trazia o vice o campo fica vazio em vez de chute.

   2026 veio do vlr.gg (páginas de cada evento, lidas em
   31/10/2026), com campeão e vice. A carreira começa em 2027:
   os elencos da base são os de 2026, e o que eles ganharam em
   2026 já faz parte da história do clube.

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
  {ano:2025,escopo:'CN',  evento:'Stage 2 China',    campeao:'Bilibili Gaming', vice:''},
  /* ---------------- 2026 (vlr.gg) ---------------- */
  {ano:2026,escopo:'AMER',evento:'Kickoff Americas', campeao:'FURIA',              vice:'G2 Esports'},
  {ano:2026,escopo:'EMEA',evento:'Kickoff EMEA',     campeao:'BBL Esports',        vice:'Gentle Mates'},
  {ano:2026,escopo:'PAC', evento:'Kickoff Pacific',  campeao:'Nongshim RedForce',  vice:'T1'},
  {ano:2026,escopo:'CN',  evento:'Kickoff China',    campeao:'All Gamers',         vice:'Xi Lai Gaming'},
  {ano:2026,escopo:'INT', evento:'Masters Santiago', campeao:'Nongshim RedForce',  vice:'Paper Rex'},
  {ano:2026,escopo:'AMER',evento:'Stage 1 Americas', campeao:'G2 Esports',         vice:'LEVIATÁN'},
  {ano:2026,escopo:'EMEA',evento:'Stage 1 EMEA',     campeao:'Team Heretics',      vice:'Team Vitality'},
  {ano:2026,escopo:'PAC', evento:'Stage 1 Pacific',  campeao:'Paper Rex',          vice:'FULL SENSE'},
  {ano:2026,escopo:'CN',  evento:'Stage 1 China',    campeao:'EDward Gaming',      vice:'Xi Lai Gaming'},
  {ano:2026,escopo:'INT', evento:'Masters Londres',  campeao:'LEVIATÁN',           vice:'Paper Rex'},
  {ano:2026,escopo:'AMER',evento:'Stage 2 Americas', campeao:'100 Thieves',        vice:'LOUD'},
  {ano:2026,escopo:'EMEA',evento:'Stage 2 EMEA',     campeao:'Karmine Corp',       vice:'Team Liquid'},
  {ano:2026,escopo:'PAC', evento:'Stage 2 Pacific',  campeao:'Global Esports',     vice:'Nongshim RedForce'},
  {ano:2026,escopo:'CN',  evento:'Stage 2 China',    campeao:'TYLOO',              vice:'JD Gaming'},
  {ano:2026,escopo:'INT', evento:'Champions Xangai', campeao:'LOUD',               vice:'Team Vitality'}
];

/* Quanto cada tipo de título pesa no legado do clube: torcida herdada e
   posição nas rivalidades. Internacional vale muito mais que liga, e é o que
   separa "clube grande" de "clube que ganhou o campeonato de casa". */
const PESO_TITULO={INT:1, AMER:0.34, EMEA:0.34, PAC:0.34, CN:0.34};

/* ============================================================
   CIDADES-SEDE de Masters e Champions
   ------------------------------------------------------------
   Semente do catálogo G.cidades, que é editável no Banco de dados (aba
   Torneios). A imagem de cada uma fica em assets/cidades/<slug>.webp — a
   lista com os nomes de arquivo está no LEIAME.md daquela pasta.

   tipo   'champions' = pode receber Champions (e também Masters)
          'masters'   = só Masters
   maior  true quando é a maior cidade do país. No sorteio do Masters, quem
          NÃO é a maior tem o dobro de chance: o Masters gira pelo mundo, o
          Champions fica nas grandes capitais e metrópoles.
   pais   sigla de duas letras, a mesma do resto do jogo; dois Masters do
          mesmo ano nunca caem no mesmo país.
   ============================================================ */
const SEDES=[
  /* Champions — grandes capitais e metrópoles (também recebem Masters; maior:false = chance dobrada lá) */
  {nome:'Amsterdã',pais:'NL',tipo:'champions',maior:true},
  {nome:'Bangkok',pais:'TH',tipo:'champions',maior:true},
  {nome:'Berlim',pais:'DE',tipo:'champions',maior:true},
  {nome:'Buenos Aires',pais:'AR',tipo:'champions',maior:true},
  {nome:'Cidade do México',pais:'MX',tipo:'champions',maior:true},
  {nome:'Lisboa',pais:'PT',tipo:'champions',maior:true},
  {nome:'Londres',pais:'GB',tipo:'champions',maior:true},
  {nome:'Madri',pais:'ES',tipo:'champions',maior:true},
  {nome:'Nova York',pais:'US',tipo:'champions',maior:true},
  {nome:'Paris',pais:'FR',tipo:'champions',maior:true},
  {nome:'Pequim',pais:'CN',tipo:'champions',maior:false},
  {nome:'Riad',pais:'SA',tipo:'champions',maior:true},
  {nome:'Rio de Janeiro',pais:'BR',tipo:'champions',maior:false},
  {nome:'Roma',pais:'IT',tipo:'champions',maior:true},
  {nome:'São Paulo',pais:'BR',tipo:'champions',maior:true},
  {nome:'Seul',pais:'KR',tipo:'champions',maior:true},
  {nome:'Singapura',pais:'SG',tipo:'champions',maior:true},
  {nome:'Tóquio',pais:'JP',tipo:'champions',maior:true},
  {nome:'Xangai',pais:'CN',tipo:'champions',maior:true},
  /* Masters — fora da maior cidade do país, chance dobrada */
  {nome:'Atlanta',pais:'US',tipo:'masters',maior:false},
  {nome:'Barcelona',pais:'ES',tipo:'masters',maior:false},
  {nome:'Belo Horizonte',pais:'BR',tipo:'masters',maior:false},
  {nome:'Brasília',pais:'BR',tipo:'masters',maior:false},
  {nome:'Busan',pais:'KR',tipo:'masters',maior:false},
  {nome:'Chengdu',pais:'CN',tipo:'masters',maior:false},
  {nome:'Chicago',pais:'US',tipo:'masters',maior:false},
  {nome:'Colônia',pais:'DE',tipo:'masters',maior:false},
  {nome:'Curitiba',pais:'BR',tipo:'masters',maior:false},
  {nome:'Dallas',pais:'US',tipo:'masters',maior:false},
  {nome:'Fukuoka',pais:'JP',tipo:'masters',maior:false},
  {nome:'Guadalajara',pais:'MX',tipo:'masters',maior:false},
  {nome:'Guangzhou',pais:'CN',tipo:'masters',maior:false},
  {nome:'Hamburgo',pais:'DE',tipo:'masters',maior:false},
  {nome:'Hangzhou',pais:'CN',tipo:'masters',maior:false},
  {nome:'Incheon',pais:'KR',tipo:'masters',maior:false},
  {nome:'Katowice',pais:'PL',tipo:'masters',maior:false},
  {nome:'Las Vegas',pais:'US',tipo:'masters',maior:false},
  {nome:'Los Angeles',pais:'US',tipo:'masters',maior:false},
  {nome:'Manchester',pais:'GB',tipo:'masters',maior:false},
  {nome:'Miami',pais:'US',tipo:'masters',maior:false},
  {nome:'Milão',pais:'IT',tipo:'masters',maior:false},
  {nome:'Montreal',pais:'CA',tipo:'masters',maior:false},
  {nome:'Munique',pais:'DE',tipo:'masters',maior:false},
  {nome:'Osaka',pais:'JP',tipo:'masters',maior:false},
  {nome:'Porto',pais:'PT',tipo:'masters',maior:false},
  {nome:'Porto Alegre',pais:'BR',tipo:'masters',maior:false},
  {nome:'Seattle',pais:'US',tipo:'masters',maior:false},
  {nome:'Shenzhen',pais:'CN',tipo:'masters',maior:false},
  {nome:'Taipé',pais:'TW',tipo:'masters',maior:false},
  /* Masters — maior cidade do país, chance normal */
  {nome:'Copenhague',pais:'DK',tipo:'masters',maior:true},
  {nome:'Estocolmo',pais:'SE',tipo:'masters',maior:true},
  {nome:'Ho Chi Minh',pais:'VN',tipo:'masters',maior:true},
  {nome:'Istambul',pais:'TR',tipo:'masters',maior:true},
  {nome:'Jacarta',pais:'ID',tipo:'masters',maior:true},
  {nome:'Kuala Lumpur',pais:'MY',tipo:'masters',maior:true},
  {nome:'Manila',pais:'PH',tipo:'masters',maior:true},
  {nome:'Reykjavík',pais:'IS',tipo:'masters',maior:true},
  {nome:'Santiago',pais:'CL',tipo:'masters',maior:true},
  {nome:'Toronto',pais:'CA',tipo:'masters',maior:true},
  {nome:'Varsóvia',pais:'PL',tipo:'masters',maior:true}
];

/* Sedes reais das duas temporadas antes da carreira: o sorteio de 2027 evita
   repetir estas, como evita as dos dois anos anteriores em qualquer ano. */
const SEDES_REAIS={
  2025:{masters1:'bangkok', masters2:'toronto', champions:'paris'},
  2026:{masters1:'santiago',masters2:'londres', champions:'xangai'}
};

/* Gerado por tools/rostos.py — não edite à mão.
   Fonte: SFHQ (MIT). Imagens sintéticas, não são pessoas reais. */
const ROSTOS={
 "versao": 1,
 "dir": "assets/rostos/",
 "ext": "webp",
 "lado": 256,
 "fonte": "SFHQ (MIT)",
 "baldes": {
  "AMER_jovem_m": 280,
  "AMER_veterano_m": 140,
  "AMER_jovem_f": 50,
  "AMER_veterano_f": 30,
  "EMEA_jovem_m": 280,
  "EMEA_veterano_m": 140,
  "EMEA_jovem_f": 50,
  "EMEA_veterano_f": 30,
  "PAC_jovem_m": 280,
  "PAC_veterano_m": 140,
  "PAC_jovem_f": 50,
  "PAC_veterano_f": 30,
  "CN_jovem_m": 280,
  "CN_veterano_m": 140,
  "CN_jovem_f": 50,
  "CN_veterano_f": 30
 }
};

/* Gerado por tools/imagens.mjs — não edite à mão; rode `npm run imagens`.
   Chave: '<pasta de assets>/<slug>'. Valor: a extensão do arquivo. */
const MIDIA={
  arquivos:{
    'agentes/astra':'png',
    'agentes/breach':'png',
    'agentes/brimstone':'png',
    'agentes/chamber':'png',
    'agentes/clove':'png',
    'agentes/cypher':'png',
    'agentes/deadlock':'png',
    'agentes/fade':'png',
    'agentes/gekko':'png',
    'agentes/harbor':'png',
    'agentes/iso':'png',
    'agentes/jett':'png',
    'agentes/kay-o':'png',
    'agentes/killjoy':'png',
    'agentes/mix':'png',
    'agentes/neon':'png',
    'agentes/omen':'png',
    'agentes/phoenix':'png',
    'agentes/raze':'png',
    'agentes/reyna':'png',
    'agentes/sage':'png',
    'agentes/skye':'png',
    'agentes/sova':'png',
    'agentes/tejo':'png',
    'agentes/veto':'png',
    'agentes/viper':'png',
    'agentes/vyse':'png',
    'agentes/waylay':'png',
    'agentes/yoru':'png',
    'cidades/amsterda':'webp',
    'cidades/atlanta':'webp',
    'cidades/bangkok':'webp',
    'cidades/barcelona':'webp',
    'cidades/belo-horizonte':'webp',
    'cidades/berlim':'webp',
    'cidades/brasilia':'webp',
    'cidades/buenos-aires':'webp',
    'cidades/busan':'webp',
    'cidades/chengdu':'webp',
    'cidades/chicago':'webp',
    'cidades/cidade-do-mexico':'webp',
    'cidades/colonia':'webp',
    'cidades/copenhague':'webp',
    'cidades/curitiba':'webp',
    'cidades/dallas':'webp',
    'cidades/estocolmo':'webp',
    'cidades/fukuoka':'webp',
    'cidades/guadalajara':'webp',
    'cidades/guangzhou':'webp',
    'cidades/hamburgo':'webp',
    'cidades/hangzhou':'webp',
    'cidades/ho-chi-minh':'webp',
    'cidades/incheon':'webp',
    'cidades/istambul':'webp',
    'cidades/jacarta':'webp',
    'cidades/katowice':'webp',
    'cidades/kuala-lumpur':'webp',
    'cidades/las-vegas':'webp',
    'cidades/lisboa':'webp',
    'cidades/londres':'webp',
    'cidades/los-angeles':'webp',
    'cidades/madri':'webp',
    'cidades/manchester':'webp',
    'cidades/manila':'webp',
    'cidades/miami':'webp',
    'cidades/milao':'webp',
    'cidades/montreal':'webp',
    'cidades/munique':'webp',
    'cidades/nova-york':'webp',
    'cidades/osaka':'webp',
    'cidades/paris':'webp',
    'cidades/pequim':'webp',
    'cidades/porto':'webp',
    'cidades/porto-alegre':'webp',
    'cidades/reykjavik':'webp',
    'cidades/riad':'webp',
    'cidades/rio-de-janeiro':'webp',
    'cidades/roma':'webp',
    'cidades/santiago':'webp',
    'cidades/sao-paulo':'webp',
    'cidades/seattle':'webp',
    'cidades/seul':'webp',
    'cidades/shenzhen':'webp',
    'cidades/singapura':'webp',
    'cidades/taipe':'webp',
    'cidades/toquio':'webp',
    'cidades/toronto':'webp',
    'cidades/varsovia':'webp',
    'cidades/xangai':'webp',
    'logos/100t':'png',
    'logos/2g':'png',
    'logos/ag':'png',
    'logos/aq':'png',
    'logos/art':'png',
    'logos/at':'png',
    'logos/aur':'png',
    'logos/bbl':'png',
    'logos/blg':'png',
    'logos/bst':'png',
    'logos/c9':'png',
    'logos/crc':'png',
    'logos/dfm':'png',
    'logos/dk':'png',
    'logos/drg':'png',
    'logos/edg':'png',
    'logos/ef':'png',
    'logos/eg':'png',
    'logos/envy':'png',
    'logos/ep':'png',
    'logos/ff':'png',
    'logos/fl':'png',
    'logos/fnc':'png',
    'logos/fpx':'png',
    'logos/fs':'png',
    'logos/fur':'png',
    'logos/fut':'png',
    'logos/fx':'png',
    'logos/g2':'png',
    'logos/gam':'png',
    'logos/ge':'png',
    'logos/gen':'png',
    'logos/gx':'png',
    'logos/jdg':'png',
    'logos/jl':'png',
    'logos/kbg':'png',
    'logos/kc':'png',
    'logos/kru':'png',
    'logos/krx':'png',
    'logos/lev':'png',
    'logos/lns':'png',
    'logos/loud':'png',
    'logos/m8':'png',
    'logos/m80':'png',
    'logos/mdr':'png',
    'logos/mibr':'png',
    'logos/mir':'png',
    'logos/misa':'png',
    'logos/navi':'png',
    'logos/nbg':'png',
    'logos/nova':'png',
    'logos/nrg':'png',
    'logos/ns':'png',
    'logos/nvj':'png',
    'logos/odg':'png',
    'logos/ong':'png',
    'logos/pcf':'png',
    'logos/prx':'png',
    'logos/qtd':'png',
    'logos/ra':'png',
    'logos/rc':'png',
    'logos/red':'png',
    'logos/rrq':'png',
    'logos/sad':'png',
    'logos/sen':'png',
    'logos/sge':'png',
    'logos/srb':'png',
    'logos/t1':'png',
    'logos/te':'png',
    'logos/tec':'png',
    'logos/th':'png',
    'logos/tl':'png',
    'logos/ts':'png',
    'logos/tyl':'png',
    'logos/vit':'png',
    'logos/vl':'png',
    'logos/vlg':'png',
    'logos/wbg':'png',
    'logos/wol':'png',
    'logos/wsig':'png',
    'logos/xip':'png',
    'logos/xlg':'png',
    'logos/zeta':'png',
    'mapas/abyss':'webp',
    'mapas/ascent':'webp',
    'mapas/bind':'webp',
    'mapas/breeze':'webp',
    'mapas/corrode':'webp',
    'mapas/fracture':'webp',
    'mapas/haven':'webp',
    'mapas/icebox':'webp',
    'mapas/lotus':'webp',
    'mapas/pearl':'webp',
    'mapas/split':'webp',
    'mapas/summit':'webp',
    'mapas/sunset':'webp',
    'marcas/abko':'png',
    'marcas/adidas':'png',
    'marcas/airasia':'png',
    'marcas/ais':'png',
    'marcas/alipay':'png',
    'marcas/allegro':'png',
    'marcas/allianz':'png',
    'marcas/alza':'png',
    'marcas/amd':'png',
    'marcas/ant-esports':'png',
    'marcas/anta':'png',
    'marcas/arcor':'png',
    'marcas/aula':'png',
    'marcas/aws':'png',
    'marcas/baemin':'png',
    'marcas/banco-de-chile':'png',
    'marcas/banco-galicia':'png',
    'marcas/bank-mandiri':'png',
    'marcas/bank-of-america':'png',
    'marcas/banorte':'png',
    'marcas/barclays':'png',
    'marcas/be-quiet':'png',
    'marcas/beko':'png',
    'marcas/best-buy':'png',
    'marcas/bilibili':'png',
    'marcas/bimbo':'png',
    'marcas/bitdefender':'png',
    'marcas/bmw':'png',
    'marcas/bnp-paribas':'png',
    'marcas/boat':'png',
    'marcas/bol-com':'png',
    'marcas/bolt':'png',
    'marcas/booking-com':'png',
    'marcas/bradesco':'png',
    'marcas/bt':'png',
    'marcas/byd':'png',
    'marcas/carrefour':'png',
    'marcas/caseking':'png',
    'marcas/central':'png',
    'marcas/cherry':'png',
    'marcas/china-mobile':'png',
    'marcas/chipotle':'png',
    'marcas/claro':'png',
    'marcas/coca-cola':'png',
    'marcas/compra-gamer':'png',
    'marcas/copec':'png',
    'marcas/corsair':'png',
    'marcas/coupang':'png',
    'marcas/cp-group':'png',
    'marcas/cyberpowerpc':'png',
    'marcas/dbs':'png',
    'marcas/decathlon':'png',
    'marcas/deliveroo':'png',
    'marcas/despegar':'png',
    'marcas/deutsche-telekom':'png',
    'marcas/dhl':'png',
    'marcas/discord':'png',
    'marcas/doritos':'png',
    'marcas/douyu':'png',
    'marcas/dpd':'png',
    'marcas/dt3-sports':'png',
    'marcas/el-corte-ingles':'png',
    'marcas/elecom':'png',
    'marcas/elgato':'png',
    'marcas/endgame-gear':'png',
    'marcas/entel':'png',
    'marcas/falabella':'png',
    'marcas/foodpanda':'png',
    'marcas/ford':'png',
    'marcas/g-fuel':'png',
    'marcas/galleria':'png',
    'marcas/gamers-club':'png',
    'marcas/garanti-bbva':'png',
    'marcas/gatorade':'png',
    'marcas/gcash':'png',
    'marcas/geely':'png',
    'marcas/geico':'png',
    'marcas/getir':'png',
    'marcas/globe':'png',
    'marcas/glovo':'png',
    'marcas/gojek':'png',
    'marcas/grab':'png',
    'marcas/guarana-antarctica':'png',
    'marcas/haier':'png',
    'marcas/hansung':'png',
    'marcas/hanwha-life':'png',
    'marcas/haribo':'png',
    'marcas/havaianas':'png',
    'marcas/honda':'png',
    'marcas/huawei':'png',
    'marcas/huya':'png',
    'marcas/hyperx':'png',
    'marcas/hyundai':'png',
    'marcas/iberia':'png',
    'marcas/ifood':'png',
    'marcas/ikea':'png',
    'marcas/indomie':'png',
    'marcas/ing':'png',
    'marcas/intel':'png',
    'marcas/iqoo':'png',
    'marcas/itau':'png',
    'marcas/jd-com':'png',
    'marcas/jd-sports':'png',
    'marcas/jio':'png',
    'marcas/jollibee':'png',
    'marcas/kabum':'png',
    'marcas/kakao':'png',
    'marcas/kasikornbank':'png',
    'marcas/kfc':'png',
    'marcas/kia':'png',
    'marcas/klm':'png',
    'marcas/konix':'png',
    'marcas/kt':'png',
    'marcas/lacoste':'png',
    'marcas/latam-airlines':'png',
    'marcas/lawson':'png',
    'marcas/lazada':'png',
    'marcas/ldlc':'png',
    'marcas/lenovo-legion':'png',
    'marcas/lg':'png',
    'marcas/li-ning':'png',
    'marcas/lidl':'png',
    'marcas/localiza':'png',
    'marcas/logitech-g':'png',
    'marcas/lotte':'png',
    'marcas/luckin-coffee':'png',
    'marcas/lufthansa':'png',
    'marcas/machenike':'png',
    'marcas/magalu':'png',
    'marcas/mars-gaming':'png',
    'marcas/mastercard':'png',
    'marcas/materiel-net':'png',
    'marcas/mcdonalds':'png',
    'marcas/mediamarkt':'png',
    'marcas/meituan':'png',
    'marcas/mengniu':'png',
    'marcas/mercado-livre':'png',
    'marcas/mercedes-benz':'png',
    'marcas/mindfactory':'png',
    'marcas/monster-energy':'png',
    'marcas/monster-notebook':'png',
    'marcas/monzo':'png',
    'marcas/mountain-dew':'png',
    'marcas/movistar':'png',
    'marcas/mynavi':'png',
    'marcas/natura':'png',
    'marcas/naver':'png',
    'marcas/newskill':'png',
    'marcas/nike':'png',
    'marcas/nissin':'png',
    'marcas/noblechairs':'png',
    'marcas/nongfu-spring':'png',
    'marcas/nongshim':'png',
    'marcas/ntt-docomo':'png',
    'marcas/nubank':'png',
    'marcas/nubwo':'png',
    'marcas/nvidia':'png',
    'marcas/nzxt':'png',
    'marcas/orange':'png',
    'marcas/orlen':'png',
    'marcas/overclockers-uk':'png',
    'marcas/oxxo':'png',
    'marcas/paytm':'png',
    'marcas/pccomponentes':'png',
    'marcas/pepsi':'png',
    'marcas/personal':'png',
    'marcas/peugeot':'png',
    'marcas/philips':'png',
    'marcas/pichau':'png',
    'marcas/picpay':'png',
    'marcas/playstation':'png',
    'marcas/pocari-sweat':'png',
    'marcas/pop-mart':'png',
    'marcas/positivo-tecnologia':'png',
    'marcas/puma':'png',
    'marcas/raiffeisen-bank':'png',
    'marcas/rakuten':'png',
    'marcas/rampage':'png',
    'marcas/rapoo':'png',
    'marcas/rappi':'png',
    'marcas/razer':'png',
    'marcas/red-bull':'png',
    'marcas/redmagic':'png',
    'marcas/renault':'png',
    'marcas/revolut':'png',
    'marcas/rexus':'png',
    'marcas/riachuelo':'png',
    'marcas/royal-kludge':'png',
    'marcas/ryanair':'png',
    'marcas/sadia':'png',
    'marcas/samsung':'png',
    'marcas/santander':'png',
    'marcas/scan':'png',
    'marcas/scuf-gaming':'png',
    'marcas/seat':'png',
    'marcas/secretlab':'png',
    'marcas/shinhan':'png',
    'marcas/shopee':'png',
    'marcas/singapore-airlines':'png',
    'marcas/singtel':'png',
    'marcas/sk-telecom':'png',
    'marcas/skoda':'png',
    'marcas/smart':'png',
    'marcas/softbank':'png',
    'marcas/sp-digital':'png',
    'marcas/spotify':'png',
    'marcas/state-farm':'png',
    'marcas/t-mobile':'png',
    'marcas/taco-bell':'png',
    'marcas/tata-motors':'png',
    'marcas/telcel':'png',
    'marcas/telefonica':'png',
    'marcas/telkomsel':'png',
    'marcas/terabyte-shop':'png',
    'marcas/tesco':'png',
    'marcas/thunderobot':'png',
    'marcas/tim-brasil':'png',
    'marcas/tokopedia':'png',
    'marcas/toyota':'png',
    'marcas/trendyol':'png',
    'marcas/true':'png',
    'marcas/turkcell':'png',
    'marcas/turkish-airlines':'png',
    'marcas/turtle-beach':'png',
    'marcas/uala':'png',
    'marcas/uber':'png',
    'marcas/ubisoft':'png',
    'marcas/ulker':'png',
    'marcas/uniqlo':'png',
    'marcas/verizon':'png',
    'marcas/visa':'png',
    'marcas/vivo':'png',
    'marcas/vodafone':'png',
    'marcas/volkswagen':'png',
    'marcas/wahaha':'png',
    'marcas/wendys':'png',
    'marcas/wolt':'png',
    'marcas/woori-bank':'png',
    'marcas/x-kom':'png',
    'marcas/xfinity':'png',
    'marcas/xiaomi':'png',
    'marcas/yili':'png',
    'marcas/ypf':'png',
    'marcas/zalando':'png',
    'marcas/zara':'png',
    'marcas/zomato':'png',
    'players/5cm':'png',
    'players/aaaay':'png',
    'players/aace':'png',
    'players/abo':'png',
    'players/absol':'png',
    'players/acme':'png',
    'players/akame':'png',
    'players/al0rante':'png',
    'players/alert':'png',
    'players/alfajer':'png',
    'players/aluba':'png',
    'players/anthem':'png',
    'players/apinya':'png',
    'players/artzin':'png',
    'players/aspas':'png',
    'players/asuna':'png',
    'players/audaz':'png',
    'players/autumn':'png',
    'players/avey':'png',
    'players/avez':'png',
    'players/aztex':'png',
    'players/azury':'png',
    'players/babybay':'png',
    'players/bai':'png',
    'players/bang':'png',
    'players/basic':'png',
    'players/batujnax':'png',
    'players/benjyfishy':'png',
    'players/berlin':'png',
    'players/beyn':'png',
    'players/bipo':'png',
    'players/bishepss':'png',
    'players/blowz':'png',
    'players/boaster':'png',
    'players/boo':'png',
    'players/brawk':'png',
    'players/brinks':'png',
    'players/buzz':'png',
    'players/c0m':'png',
    'players/c1nder':'png',
    'players/caedye':'png',
    'players/cauanzin':'png',
    'players/cb':'png',
    'players/chichoo':'png',
    'players/chloric':'png',
    'players/chronicle':'png',
    'players/chubizin':'png',
    'players/cloud':'png',
    'players/cloudy':'png',
    'players/clz':'png',
    'players/coco':'png',
    'players/coconut':'png',
    'players/coldfish':'png',
    'players/cortezia':'png',
    'players/crashies':'png',
    'players/crazyguy':'png',
    'players/crewen':'png',
    'players/crws':'png',
    'players/cryocells':'png',
    'players/cyvoph':'png',
    'players/d4v41':'png',
    'players/dambi':'png',
    'players/dantedeu5':'png',
    'players/darker':'png',
    'players/darxcioo':'png',
    'players/david':'png',
    'players/davih':'png',
    'players/deadink':'png',
    'players/delb':'png',
    'players/demon1':'png',
    'players/dep':'png',
    'players/derke':'png',
    'players/deryeon':'png',
    'players/dgzin':'png',
    'players/dh':'png',
    'players/dingwei':'png',
    'players/doma':'png',
    'players/dos9':'png',
    'players/dynamite':'png',
    'players/echo':'png',
    'players/eeiu':'png',
    'players/efina':'png',
    'players/eko':'png',
    'players/erde':'png',
    'players/eren':'png',
    'players/ethan':'png',
    'players/exa':'png',
    'players/ezeir':'png',
    'players/f0rsaken':'png',
    'players/favian':'png',
    'players/fengf':'png',
    'players/filu':'png',
    'players/fireballops':'png',
    'players/fizzy':'png',
    'players/flex1n':'png',
    'players/flickless':'png',
    'players/forbanz':'png',
    'players/fortres':'png',
    'players/foxy9':'png',
    'players/francis':'png',
    'players/free1ng':'png',
    'players/frz':'png',
    'players/ft':'png',
    'players/gangpin':'png',
    'players/glyph':'png',
    'players/gobera':'png',
    'players/green':'png',
    'players/guang':'png',
    'players/guran':'png',
    'players/h1ber':'png',
    'players/hals':'png',
    'players/haodong':'png',
    'players/happywei':'png',
    'players/heat':'png',
    'players/heybay':'png',
    'players/hezacoil':'png',
    'players/hiro':'png',
    'players/hiroronn':'png',
    'players/hyunmin':'png',
    'players/iluri':'png',
    'players/invy':'png',
    'players/ivy':'png',
    'players/izu':'png',
    'players/izzy':'png',
    'players/jaebin':'png',
    'players/jamelinho213':'png',
    'players/jamppi':'png',
    'players/javelin':'png',
    'players/jawgemo':'png',
    'players/jemkin':'png',
    'players/jesse':'png',
    'players/jieni7':'png',
    'players/jinggg':'png',
    'players/jitboys':'png',
    'players/jkuro':'png',
    'players/johnqt':'png',
    'players/jonahp':'png',
    'players/jremy':'png',
    'players/juicy':'png',
    'players/jzz':'png',
    'players/k1ra':'png',
    'players/kaajak':'png',
    'players/kachoww':'png',
    'players/kada':'png',
    'players/kadoom':'png',
    'players/kai':'png',
    'players/kamo':'png',
    'players/kamyk':'png',
    'players/karon':'png',
    'players/keiko':'png',
    'players/kellys':'png',
    'players/keznit':'png',
    'players/kicks':'png',
    'players/killua':'png',
    'players/kingg':'png',
    'players/knight':'png',
    'players/koalanoob':'png',
    'players/kolosha':'png',
    'players/kozzy':'png',
    'players/kr1stal':'png',
    'players/krostaly':'png',
    'players/kushy':'png',
    'players/kyu':'png',
    'players/lar0k':'png',
    'players/layla':'png',
    'players/laz':'png',
    'players/leaf':'png',
    'players/less':'png',
    'players/leviathan':'png',
    'players/levius':'png',
    'players/lewn':'png',
    'players/life':'png',
    'players/lime':'png',
    'players/loita':'png',
    'players/loss':'png',
    'players/lovers-rock':'png',
    'players/luid':'png',
    'players/lukxo':'png',
    'players/luok1ng':'png',
    'players/lysoar':'png',
    'players/mada':'png',
    'players/magnum':'png',
    'players/mako':'png',
    'players/marteen':'png',
    'players/marved':'png',
    'players/mazin':'png',
    'players/mazino':'png',
    'players/meiy':'png',
    'players/melser':'png',
    'players/merz':'png',
    'players/meteor':'png',
    'players/miniboo':'png',
    'players/minny':'png',
    'players/miradaninja':'png',
    'players/monk':'png',
    'players/monsteerr':'png',
    'players/monyet':'png',
    'players/moves':'png',
    'players/munchkin':'png',
    'players/musashi':'png',
    'players/mwzera':'png',
    'players/n4rrate':'png',
    'players/natank':'png',
    'players/nats':'png',
    'players/nature':'png',
    'players/natz':'png',
    'players/nekky':'png',
    'players/neon':'png',
    'players/nephh':'png',
    'players/net':'png',
    'players/nicc':'png',
    'players/niffy':'png',
    'players/nightz':'png',
    'players/ninja':'png',
    'players/nismo':'png',
    'players/nobody':'png',
    'players/oxy':'png',
    'players/pa1ze':'png',
    'players/paincakes':'png',
    'players/palla':'png',
    'players/patitek':'png',
    'players/patmen':'png',
    'players/pawn1':'png',
    'players/peixeh':'png',
    'players/persia':'png',
    'players/primmie':'png',
    'players/profek':'png',
    'players/proxh':'png',
    'players/prozin':'png',
    'players/ptc':'png',
    'players/purp0':'png',
    'players/qck':'png',
    'players/qiutian':'png',
    'players/qpert':'png',
    'players/rarga':'png',
    'players/raxcal':'png',
    'players/raz':'png',
    'players/rb':'png',
    'players/reazy':'png',
    'players/redgar':'png',
    'players/redlight':'png',
    'players/reduxx':'png',
    'players/rglmeister':'png',
    'players/riens':'png',
    'players/ronniee':'png',
    'players/rose':'png',
    'players/rossy':'png',
    'players/runner':'png',
    'players/rushia':'png',
    'players/ruxic':'png',
    'players/s1mon':'png',
    'players/saadhak':'png',
    'players/sacy':'png',
    'players/sanoj':'png',
    'players/satellite':'png',
    'players/sato':'png',
    'players/satoshi':'png',
    'players/sayonara':'png',
    'players/scales':'png',
    'players/seph1roth':'png',
    'players/seven':'png',
    'players/sevire':'png',
    'players/sh1n':'png',
    'players/sh1va':'png',
    'players/shao':'png',
    'players/shr1mp':'png',
    'players/shu':'png',
    'players/shyy':'png',
    'players/sibeastw0w':'png',
    'players/siufatbb':'png',
    'players/sizo':'png',
    'players/skuba':'png',
    'players/slowly':'png',
    'players/smoggy':'png',
    'players/sociablee':'png',
    'players/something':'png',
    'players/spear':'png',
    'players/spike':'png',
    'players/spiritz1':'png',
    'players/spitfires':'png',
    'players/spring':'png',
    'players/ssees':'png',
    'players/starxo':'png',
    'players/stax':'png',
    'players/stellar':'png',
    'players/stew':'png',
    'players/stunna':'png',
    'players/styron':'png',
    'players/sugarz3ro':'png',
    'players/supamen':'png',
    'players/suygetsu':'png',
    'players/suyjing':'png',
    'players/sw':'png',
    'players/sylvan':'png',
    'players/syouta':'png',
    'players/t3xture':'png',
    'players/tacolilla':'png',
    'players/takas':'png',
    'players/tenz':'png',
    'players/tex':'png',
    'players/thyy':'png',
    'players/timotino':'png',
    'players/tiyosta':'png',
    'players/tkzin':'png',
    'players/trent':'png',
    'players/trexx':'png',
    'players/turkish':'png',
    'players/tuyz':'png',
    'players/udotan':'png',
    'players/unfake':'png',
    'players/urango':'png',
    'players/v1c':'png',
    'players/valyn':'png',
    'players/veqaj':'png',
    'players/verno':'png',
    'players/vo0kashu':'png',
    'players/vora':'png',
    'players/waddle':'png',
    'players/wayne':'png',
    'players/welyy':'png',
    'players/westside':'png',
    'players/whzy':'png',
    'players/wo0t':'png',
    'players/wsleo':'png',
    'players/xavi8k':'png',
    'players/xdll':'png',
    'players/xenom':'png',
    'players/xeus':'png',
    'players/xffero':'png',
    'players/xross':'png',
    'players/xyus':'png',
    'players/yatsuka':'png',
    'players/yetujey':'png',
    'players/yosemite':'png',
    'players/yoshiii':'png',
    'players/yoyo':'png',
    'players/yuicaw':'png',
    'players/yuran':'png',
    'players/z1yan':'png',
    'players/zanatsu':'png',
    'players/zander':'png',
    'players/zekken':'png',
    'players/zellsis':'png',
    'players/zerona':'png',
    'players/zeus':'png',
    'players/zhe':'png',
    'players/zjc':'png',
    'players/zmjjkk':'png',
    'players/znajder':'png',
    'staff/1t':'png',
    'staff/24k':'png',
    'staff/3water':'png',
    'staff/9hr':'png',
    'staff/afr0nfire':'png',
    'staff/after':'png',
    'staff/aimix-strange':'png',
    'staff/alecks':'png',
    'staff/alexrr':'png',
    'staff/alvez':'png',
    'staff/anaks':'png',
    'staff/ange1':'png',
    'staff/argency':'png',
    'staff/autumn':'png',
    'staff/bail':'png',
    'staff/bajerski':'png',
    'staff/bambino':'png',
    'staff/bangovic':'png',
    'staff/bati':'png',
    'staff/billyo':'png',
    'staff/bonkar':'png',
    'staff/bullco':'png',
    'staff/castell0':'png',
    'staff/cheonggak':'png',
    'staff/chivitz':'png',
    'staff/cojo':'png',
    'staff/d00mbr0s':'png',
    'staff/daky':'png',
    'staff/desmo':'png',
    'staff/destroyer':'png',
    'staff/dragzikw':'png',
    'staff/draken':'png',
    'staff/effys':'png',
    'staff/engh':'png',
    'staff/euler':'png',
    'staff/ewok':'png',
    'staff/faded':'png',
    'staff/fadeout':'png',
    'staff/fayde':'png',
    'staff/fields':'png',
    'staff/frod':'png',
    'staff/frost':'png',
    'staff/gaabxx':'png',
    'staff/gandolf':'png',
    'staff/glow':'png',
    'staff/gya9':'png',
    'staff/happy':'png',
    'staff/hsk':'png',
    'staff/hvoya':'png',
    'staff/hypnotizing':'png',
    'staff/immi':'png',
    'staff/indigo':'png',
    'staff/itopata':'png',
    'staff/jexen':'png',
    'staff/joaovictor':'png',
    'staff/johnta':'png',
    'staff/jomengz':'png',
    'staff/joshrt':'png',
    'staff/kaplan':'png',
    'staff/kdg':'png',
    'staff/key':'png',
    'staff/koyo':'png',
    'staff/kundikundi':'png',
    'staff/larsson':'png',
    'staff/leaf':'png',
    'staff/legija':'png',
    'staff/lenz':'png',
    'staff/lohan':'png',
    'staff/luinwess':'png',
    'staff/malix':'png',
    'staff/manyfender':'png',
    'staff/mas':'png',
    'staff/mavera':'png',
    'staff/melofovia':'png',
    'staff/mighty':'png',
    'staff/mikiya':'png',
    'staff/milan':'png',
    'staff/mitch':'png',
    'staff/mobugi':'png',
    'staff/mol':'png',
    'staff/muggle':'png',
    'staff/mym':'png',
    'staff/naint':'png',
    'staff/nathand':'png',
    'staff/nbs':'png',
    'staff/neilzinho':'png',
    'staff/neves':'png',
    'staff/niklas':'png',
    'staff/norman':'png',
    'staff/northernlights':'png',
    'staff/oderus':'png',
    'staff/oi':'png',
    'staff/ominous':'png',
    'staff/onur':'png',
    'staff/pakko':'png',
    'staff/pal':'png',
    'staff/panda':'png',
    'staff/phill':'png',
    'staff/pho':'png',
    'staff/pipson':'png',
    'staff/platoon':'png',
    'staff/poomonelove':'png',
    'staff/potter':'png',
    'staff/psychopath':'png',
    'staff/rain':'png',
    'staff/romanilly':'png',
    'staff/ryota':'png',
    'staff/salah':'png',
    'staff/scott-currie':'png',
    'staff/scuttt':'png',
    'staff/seasonz':'png',
    'staff/sebe':'png',
    'staff/shadow':'png',
    'staff/shaw':'png',
    'staff/shhhack':'png',
    'staff/sieg':'png',
    'staff/silkanon':'png',
    'staff/simoz':'png',
    'staff/skazz':'png',
    'staff/skye':'png',
    'staff/slk':'png',
    'staff/solo':'png',
    'staff/spin':'png',
    'staff/stkj':'png',
    'staff/stunner':'png',
    'staff/sungmin':'png',
    'staff/sushiboys':'png',
    'staff/sword9':'png',
    'staff/szed':'png',
    'staff/termi':'png',
    'staff/theelovefamily':'png',
    'staff/thinkii':'png',
    'staff/tommy':'png',
    'staff/tony':'png',
    'staff/torito':'png',
    'staff/vatsal':'png',
    'staff/veer':'png',
    'staff/viento':'png',
    'staff/viva':'png',
    'staff/vlad':'png',
    'staff/vorz':'png',
    'staff/warbirds':'png',
    'staff/weber':'png',
    'staff/wendler':'png',
    'staff/wenty':'png',
    'staff/wkn':'png',
    'staff/xqq':'png',
    'staff/yamyam-yui':'png',
    'staff/yaotzin':'png',
    'staff/yiyee':'png',
    'staff/yoman':'png',
    'staff/york':'png',
    'staff/zaes':'png',
    'staff/ze1sh':'png',
    'staff/zonyk':'png',
    'staff/zyto':'png',
    'torneios/asc-amer':'png',
    'torneios/asc-cn':'png',
    'torneios/asc-emea':'png',
    'torneios/asc-pac':'png',
    'torneios/champions':'png',
    'torneios/cp1-amer':'png',
    'torneios/cp1-cn':'png',
    'torneios/cp1-emea':'png',
    'torneios/cp1-pac':'png',
    'torneios/cp2-amer':'png',
    'torneios/cp2-cn':'png',
    'torneios/cp2-emea':'png',
    'torneios/cp2-pac':'png',
    'torneios/kickoff-amer':'png',
    'torneios/kickoff-cn':'png',
    'torneios/kickoff-emea':'png',
    'torneios/kickoff-pac':'png',
    'torneios/masters1':'png',
    'torneios/masters2':'png',
    'torneios/po1-amer':'png',
    'torneios/po1-cn':'png',
    'torneios/po1-emea':'png',
    'torneios/po1-pac':'png',
    'torneios/po2-amer':'png',
    'torneios/po2-cn':'png',
    'torneios/po2-emea':'png',
    'torneios/po2-pac':'png',
    'torneios/split1-amer':'png',
    'torneios/split1-cn':'png',
    'torneios/split1-emea':'png',
    'torneios/split1-pac':'png',
    'torneios/split2-amer':'png',
    'torneios/split2-cn':'png',
    'torneios/split2-emea':'png',
    'torneios/split2-pac':'png',
    'torneios/stage1-amer':'png',
    'torneios/stage1-cn':'png',
    'torneios/stage1-emea':'png',
    'torneios/stage1-pac':'png',
    'torneios/stage2-amer':'png',
    'torneios/stage2-cn':'png',
    'torneios/stage2-emea':'png',
    'torneios/stage2-pac':'png',
    'trofeus/ascension-amer':'png',
    'trofeus/ascension-cn':'png',
    'trofeus/ascension-emea':'png',
    'trofeus/ascension-pac':'png',
    'trofeus/challengers-amer':'png',
    'trofeus/challengers-cn':'png',
    'trofeus/challengers-emea':'png',
    'trofeus/challengers-pac':'png',
    'trofeus/champions-01':'png',
    'trofeus/champions-02':'png',
    'trofeus/champions-03':'png',
    'trofeus/champions-04':'png',
    'trofeus/champions-05':'png',
    'trofeus/champions-06':'png',
    'trofeus/champions-07':'png',
    'trofeus/champions-08':'png',
    'trofeus/champions-09':'png',
    'trofeus/champions-10':'png',
    'trofeus/kickoff-amer':'png',
    'trofeus/kickoff-cn':'png',
    'trofeus/kickoff-emea':'png',
    'trofeus/kickoff-pac':'png',
    'trofeus/masters-01':'png',
    'trofeus/masters-02':'png',
    'trofeus/masters-03':'png',
    'trofeus/masters-04':'png',
    'trofeus/masters-05':'png',
    'trofeus/masters-06':'png',
    'trofeus/masters-07':'png',
    'trofeus/masters-08':'png',
    'trofeus/masters-09':'png',
    'trofeus/masters-10':'png',
    'trofeus/padrao':'png',
    'trofeus/premio-igl':'png',
    'trofeus/premio-mvp':'png',
    'trofeus/premio-selecao':'png',
    'trofeus/premio-treinador':'png',
    'trofeus/stage1-amer':'png',
    'trofeus/stage1-cn':'png',
    'trofeus/stage1-emea':'png',
    'trofeus/stage1-pac':'png',
    'trofeus/stage2-amer':'png',
    'trofeus/stage2-cn':'png',
    'trofeus/stage2-emea':'png',
    'trofeus/stage2-pac':'png'
  }
};

/* ============================================================
   SEMANAS E DATAS
   ------------------------------------------------------------
   Até aqui o tempo do jogo era uma lista de blocos: você apertava
   AVANÇAR e caía no torneio seguinte. Não dava para planejar nada,
   porque não existia "daqui a três semanas" — existia só "o próximo
   campeonato".

   Agora a temporada é um ano de verdade, semana a semana, com data.
   Torneio ocupa um intervalo de semanas; entre um e outro sobra
   tempo, e é nesse tempo que elenco treina, jogador se recupera e
   você decide alguma coisa.

   A semana 1 é a que contém 1º de janeiro. Datas são só para leitura
   — nada no motor depende delas, então fuso e feriado não importam.
   ============================================================ */
const SEMANAS_ANO=52;
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
             'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTO=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/* Segunda-feira da semana N. */
function segundaDaSemana(ano,semana){
  const jan1=Date.UTC(ano,0,1);
  const dow=(new Date(jan1).getUTCDay()+6)%7;      /* 0 = segunda */
  return new Date(jan1-dow*86400000+(clamp(semana,1,SEMANAS_ANO)-1)*7*86400000);
}
function mesDaSemana(ano,semana){
  /* o mês da quinta-feira: é ele que decide a que mês a semana pertence,
     a mesma regra da norma ISO, para uma semana a cavalo não contar duas vezes */
  return new Date(segundaDaSemana(ano,semana).getTime()+3*86400000).getUTCMonth();
}
function rotuloSemana(ano,semana){
  const a=segundaDaSemana(ano,semana), b=new Date(a.getTime()+6*86400000);
  const da=a.getUTCDate(), db=b.getUTCDate();
  const ma=MESES_CURTO[a.getUTCMonth()], mb=MESES_CURTO[b.getUTCMonth()];
  return ma===mb ? `${da}–${db} ${ma}` : `${da} ${ma} – ${db} ${mb}`;
}
function rotuloCurto(ano,semana){
  const a=segundaDaSemana(ano,semana);
  return `${a.getUTCDate()} ${MESES_CURTO[a.getUTCMonth()]}`;
}
/* Intervalo de um torneio, para a ficha dele. */
function rotuloPeriodo(ano,ini,fim){
  const a=segundaDaSemana(ano,ini), b=new Date(segundaDaSemana(ano,fim).getTime()+6*86400000);
  const ma=MESES_CURTO[a.getUTCMonth()], mb=MESES_CURTO[b.getUTCMonth()];
  return ma===mb ? `${a.getUTCDate()}–${b.getUTCDate()} de ${MESES[a.getUTCMonth()].toLowerCase()}`
                 : `${a.getUTCDate()} ${ma} – ${b.getUTCDate()} ${mb}`;
}
/* ---------- janelas de transferência ----------
   Duas por ano, pelo calendário e não pelos torneios: novembro a janeiro
   (atravessa a virada da temporada) e junho a julho. A semana pertence ao
   mês da quinta-feira dela, a mesma regra de mesDaSemana. */
const MESES_JANELA=[10,11,0,5,6];
function janelaAberta(ano,semana){return MESES_JANELA.includes(mesDaSemana(ano,semana));}
/* A semana seguinte, atravessando o ano. */
function proximaSemana(ano,semana){return semana>=SEMANAS_ANO?{ano:ano+1,semana:1}:{ano,semana:semana+1};}
function nomeDaJanela(ano,semana){
  const m=mesDaSemana(ano,semana);
  return m===5||m===6?'janela de junho e julho':'janela de novembro a janeiro';
}
/* Próxima abertura de janela a partir de uma semana (inclusive), para a tela. */
function proximaJanela(ano,semana){
  let a=ano,s=semana;
  for(let i=0;i<SEMANAS_ANO+1;i++){if(janelaAberta(a,s))return{ano:a,semana:s};({ano:a,semana:s}=proximaSemana(a,s));}
  return null;
}
/* Quantas semanas faltam de um intervalo, contando a atual. */
function semanasRestantes(semana,fim){return Math.max(1,fim-semana+1);}

/* ---------- turnos de dois dias na janela ----------
   Com a janela aberta a semana anda em três turnos: segunda e terça, quarta
   e quinta, sexta a domingo. O motor continua semanal (partidas, treino,
   folha); os turnos existem para o mercado. Ver avancarTurno() em clock.js. */
const TURNOS_SEMANA=3;
const TURNO_DIAS=[[0,1],[2,3],[4,6]];
const DIAS_CURTO=['seg','ter','qua','qui','sex','sáb','dom'];
function rotuloTurno(ano,semana,turno){
  const seg=segundaDaSemana(ano,semana).getTime();
  const [i,f]=TURNO_DIAS[clamp(turno||0,0,TURNOS_SEMANA-1)];
  const a=new Date(seg+i*86400000), b=new Date(seg+f*86400000);
  const ma=MESES_CURTO[a.getUTCMonth()], mb=MESES_CURTO[b.getUTCMonth()];
  return `${DIAS_CURTO[i]} ${a.getUTCDate()}${ma===mb?'':' '+ma} – ${DIAS_CURTO[f]} ${b.getUTCDate()} ${mb}`;
}
/* Dias até a janela fechar, contando a partir do turno atual (o último dia
   aberto é o domingo da última semana de janela). */
function diasAteFecharJanela(ano,semana,turno){
  if(!janelaAberta(ano,semana))return 0;
  let a=ano,s=semana,semanas=0;
  for(let i=0;i<SEMANAS_ANO;i++){const n=proximaSemana(a,s);if(!janelaAberta(n.ano,n.semana))break;semanas++;a=n.ano;s=n.semana;}
  const hoje=TURNO_DIAS[clamp(turno||0,0,TURNOS_SEMANA-1)][0];
  return semanas*7+(6-hoje)+1;
}

/* ---------- Estado global ---------- */
let G=null;

/* ============================================================
   DIFICULDADE
   ------------------------------------------------------------
   Escolhida na carreira nova e fixa até o fim dela. Mexe só no
   que cerca o SEU clube: dinheiro para começar, paciência da
   diretoria, meta de posição e quanto o jogador cobra de você.
   O motor de partida e a IA não mudam — vencer continua sendo
   a mesma coisa em qualquer nível.
   ============================================================ */
const DIFICULDADES={
  facil  :{nome:'Fácil',  resumo:'Mais caixa, diretoria paciente e jogador que cobra menos.',
           caixa:1.5, confianca:72, cobranca:0.7,  alvo:1,  salario:0.92},
  normal :{nome:'Normal', resumo:'O jogo como foi calibrado.',
           caixa:1,   confianca:62, cobranca:1,    alvo:0,  salario:1},
  dificil:{nome:'Difícil',resumo:'Menos caixa, diretoria exigente e jogador que cobra mais.',
           caixa:0.6, confianca:52, cobranca:1.3,  alvo:-1, salario:1.10}
};
function dificuldade(){return DIFICULDADES[(G&&G.dificuldade)||'normal']||DIFICULDADES.normal;}

/* Na carreira nova: grava o nível e ajusta o caixa do clube escolhido. */
function aplicarDificuldade(id,t){
  G.dificuldade=DIFICULDADES[id]?id:'normal';
  const d=dificuldade();
  if(t&&d.caixa!==1)t.caixa=Math.round(t.caixa*d.caixa/1000)*1000;
  return d;
}
/* Quanto uma queda de confiança pesa. Ganho de confiança não muda. */
function pesoDaCobranca(delta){return delta<0?delta*dificuldade().cobranca:delta;}

/* ============================================================
   PADRONIZAÇÃO DE OVER, POTENCIAL E AGENTES
   ------------------------------------------------------------
   Um lugar só decide a que altura cada divisão joga. Antes isso
   estava espalhado: o over de jogador nascia em world.js, o da
   comissão em staff.js, e o potencial tinha três fórmulas
   diferentes que discordavam entre si. Espalhado assim, mudar a
   régua de uma divisão exigia caçar constante em três arquivos —
   e foi como o Tier 2 acabou com jogador de over 39.

   As faixas abaixo são decisão de design, não medição:
     · comissão Tier 1  80–99, com 99 reservado a pouquíssimos
     · comissão Tier 2  62–78
     · jogador  Tier 2  69–80
   Jogador de Tier 1 NÃO entra aqui de propósito: esses overs são
   editados à mão em data/elencos.js e sobrescrevê-los apagaria o
   trabalho. O que a padronização toca no Tier 1 é só potencial e
   agentes.
   ============================================================ */

/* Faixa de over por tipo e divisão. */
const FAIXAS={
  jogador :{1:[80,99], 2:[69,80]},
  comissao:{1:[80,99], 2:[62,78]}
};

/* Prestígio realmente presente em data/times.js — é o eixo que
   posiciona cada clube dentro da faixa da divisão. Fixo em vez de
   medido para que editar o prestígio de UM time no Editor não
   redesenhe a régua do mundo inteiro. */
const PRESTIGIO_FAIXA={1:[58,86], 2:[45,58]};

/* O sorteio normal nunca passa daqui. O topo real da faixa é
   distribuído depois, à mão, para poucos — senão "99" vira régua e
   deixa de significar melhor do mundo. */
const TETO_SORTEIO=97;
const QUANTOS_NO_TOPO={jogador:2, comissao:2};

/* Jogador GERADO sem clube é promessa, não estrela pronta. Antes uma parte do
   mercado nascia na régua do Tier 1 e aparecia regen de 90 sem clube no meio
   dos melhores jogadores reais. Agora o teto dele fica abaixo do piso do
   Tier 2 e o que o torna interessante é o potencial. Quem é bom e está sem
   clube de verdade vem escrito em LIVRE, no data/elencos.js. */
const TETO_LIVRE_GERADO=68;
function overLivreGerado(){
  return clamp(Math.round(gauss(60,4)),50,TETO_LIVRE_GERADO);
}

/* Posição do clube dentro da divisão, de 0 (lanterna) a 1 (topo). */
function pesoPrestigio(tier,prestigio){
  const[pl,ph]=PRESTIGIO_FAIXA[tier]||PRESTIGIO_FAIXA[2];
  return clamp((prestigio-pl)/(ph-pl),0,1);
}

/* Over alvo de alguém desse tipo, nessa divisão, nesse clube.
   `folga` desloca para baixo quem não é titular/cargo principal. */
function overAlvo(tipo,tier,prestigio,desvio,folga){
  return overAlvoPeso(tipo,tier,pesoPrestigio(tier,prestigio),desvio,folga);
}
/* A mesma conta quando quem posiciona dentro da faixa não é o prestígio.
   O Tier 2 tem prestígio igual para todo mundo — foi o pedido —, então lá
   quem separa um clube do outro precisa ser outra coisa. */
function overAlvoPeso(tipo,tier,peso,desvio,folga){
  const[lo,hi]=(FAIXAS[tipo]||FAIXAS.jogador)[tier]||FAIXAS[tipo][2];
  const teto=Math.min(hi,TETO_SORTEIO);
  const base=lo+clamp(peso,0,1)*(teto-lo)-(folga||0);
  return clamp(Math.round(gauss(base,desvio==null?2.6:desvio)),lo,teto);
}

/* Potencial. Duas forças: a divisão dá o espaço máximo de evolução,
   a idade diz quanto desse espaço ainda está disponível.

   Tier 1 tem folga pequena de propósito — foi o pedido: "o potencial
   é maior, mas bem próximo do que já tá, já que tem muito menos
   espaço pra evoluir". Quem já joga a elite aos 25 anos não vira
   outro jogador; quem tem 17 ainda pode. */
const FOLGA_TIER={1:11, 2:22};
function fatorIdade(idade){
  return idade<=17?1.00 : idade<=19?0.86 : idade<=21?0.66
       : idade<=23?0.46 : idade<=25?0.30 : idade<=27?0.16
       : idade<=30?0.07 : 0;   /* depois dos 30 não sobra evolução nenhuma */
}
function potencialDe(ov,idade,tier){
  const espaco=(FOLGA_TIER[tier]||FOLGA_TIER[2])*fatorIdade(idade);
  return clamp(Math.round(ov+espaco*(0.65+rnd()*0.7)),ov,99);
}
/* Comissão envelhece diferente de jogador: um coach de 34 anos ainda
   cresce muito, um de 55 não. Mesma ideia, escala própria. */
function potencialStaffDe(ov,idade,tier){
  const f=idade<=28?1.0:idade<=34?0.72:idade<=40?0.46:idade<=47?0.22:0.06;
  const espaco=(tier===1?9:16)*f;
  return clamp(Math.round(ov+espaco*(0.65+rnd()*0.7)),ov,99);
}

/* Exatamente três agentes da função, sem repetir. Se a função tiver
   menos de três no catálogo (dá para apagar agentes no Editor), leva
   os que houver em vez de quebrar. */
const AGENTES_POR_JOGADOR=3;
function sortearAgentes(role){
  const pool=agentesDe(role).slice();
  return shuffle(pool).slice(0,Math.min(AGENTES_POR_JOGADOR,pool.length));
}

/* ---------- promoção ao topo da faixa ----------
   Sobe os melhores até o topo real (98/99). Determinístico dado o
   seed: ordena por over e desempata por id, nunca por ordem de
   iteração de objeto, que não é garantida. */
function promoverAoTopo(lista,tipo,aplicar){
  const quantos=QUANTOS_NO_TOPO[tipo]||2;
  const ord=lista.slice().sort((a,b)=>(b.ov-a.ov)||(a.id<b.id?-1:1));
  const n=Math.min(quantos,ord.length);
  for(let i=0;i<n;i++)aplicar(ord[i].ref, i===0?99:98);
  /* E quem NÃO foi promovido volta para dentro do teto de sorteio. Promover
     sem rebaixar não fecha a régua: quem cresceu até 99 jogando continuava lá,
     e "no máximo dois no topo do mundo" virava três a cada padronização.
     Padronizar é rebaselinar — é o único momento em que rebaixar por régua é
     o certo. */
  const promovidos=new Set(ord.slice(0,n).map(x=>x.id));
  for(const x of ord)
    if(!promovidos.has(x.id)&&x.ov>TETO_SORTEIO)aplicar(x.ref,TETO_SORTEIO);
  return n;
}

/* A promoção de JOGADOR ao topo foi removida, e a remoção é a correção de um
   bug — fica registrado para ninguém reintroduzir.

   A ideia era: se ninguém no mundo alcança 99, suba os melhores. Para não
   reescrever os overs vindos de data/elencos.js, ela pulava quem tinha
   `overFixo`. Funcionou enquanto o arquivo trazia poucos overs. Quando passou a
   trazer TODOS, os únicos candidatos que sobravam eram os reservas GERADOS — e
   o sistema promovia justamente o preenchimento de banco a melhor do mundo. A
   NRG nascia com um reserva de 97 sentado atrás de um titular de 86.

   O teto de reserva já impede que alguém gerado passe do titular real mais
   fraco. Se o topo do mundo tem de ser 99, o lugar de dizer isso é o arquivo.
   A promoção da COMISSÃO continua abaixo, porque comissão é toda gerada. */

/* Mesma ideia para a comissão: 99 é para uma ou duas pessoas no mundo
   inteiro, não para a prateleira de cima de todo clube grande. */
function promoverComissaoAoTopo(){
  /* Promover é privilégio de quem está no Tier 1. Mas o TETO vale para o mundo
     inteiro: um coach livre ou de Challengers que cresceu até 99 ficava fora
     da lista e por isso fora da régua — era o terceiro 99 que aparecia. */
  const cand=[], todos=[];
  for(const id in G.staff){
    const m=G.staff[id];
    const t=m.timeId?G.times[m.timeId]:null;
    const item={id:m.id,ov:overStaff(m),ref:m};
    todos.push(item);
    if(t&&t.tier===1)cand.push(item);
  }
  const aplicar=(m,alvo)=>{aplicarOverStaff(m,alvo);m.pot=Math.max(m.pot,alvo);};
  const n=promoverAoTopo(cand,'comissao',aplicar);
  const promovidos=new Set(cand.slice()
    .sort((a,b)=>(b.ov-a.ov)||(a.id<b.id?-1:1)).slice(0,n).map(x=>x.id));
  for(const x of todos)
    if(!promovidos.has(x.id)&&overStaff(x.ref)>TETO_SORTEIO)aplicar(x.ref,TETO_SORTEIO);
  for(const id in G.times)atualizarComissao(G.times[id]);
  return n;
}

/* ---------- economia ----------
   Salário é função de potência do over. Isso quer dizer que mover a régua
   de over move a folha de pagamento junto, elevada a 2.1 (jogador) e ao
   cubo (comissão) — foi o que quebrou as finanças na primeira tentativa
   desta padronização: 33 dos 80 clubes no vermelho até 2030.

   O conserto não é apertar salário no braço, é reconhecer o que a origem
   da curva significa. `PISO_*` é o "nível de reposição": o over a partir
   do qual alguém começa a custar dinheiro. Quando o piso profissional do
   jogo era over 39, 38 era a origem correta. Com o piso em 69, um reserva
   de Challengers estava sendo precificado como titular de Tier 1 era antes.

   Os números abaixo foram ajustados até a razão folha/receita de cada
   divisão voltar ao que era, medida por tools/fin.mjs. */
const PISO_SALARIO_JOGADOR=55;
const K_SALARIO_JOGADOR=5.8;
const PISO_SALARIO_STAFF=52;
const K_SALARIO_STAFF=0.15;

/* Caixa inicial. O patrocínio saiu daqui: virou o sistema de marcas e
   aporte de liga em core/economia.js, porque `prestígio × constante` era
   exatamente a rigidez que produzia a espiral do fundo da tabela.
   patrocinioDe() continua existindo como o ponto único de recálculo, mas
   quem responde é a economia. */
const CAIXA_BASE ={1:40000, 2:16000};
function patrocinioDe(t){
  if(typeof receitaCaixa==='function')return receitaCaixa(t);
  if(typeof receitaAnual==='function')return receitaAnual(t);
  return Math.round((t.tier===1?20000:8500)*t.prestigio);
}
function caixaInicialDe(tier,prestigio){
  return Math.round((CAIXA_BASE[tier]||CAIXA_BASE[2])*prestigio);
}

/* ============================================================
   PADRONIZAR UMA BASE JÁ EXISTENTE
   ------------------------------------------------------------
   O mundo novo já nasce na régua. Este bloco é para o save que
   você já tem: leva a base atual para a mesma régua sem apagar o
   que foi editado à mão.

   Regra de ouro: over de jogador de Tier 1 NÃO é reescrito, porque
   é ele que você ajustou no Editor. Só sobe quem está abaixo do
   piso da divisão — que são os reservas gerados, não os seus
   ajustes. Tudo mais (Tier 2, comissão, potencial, agentes) é
   redistribuído dentro da faixa preservando a ordem interna: quem
   era o melhor do clube continua sendo.
   ============================================================ */
function padronizarBase(opts){
  const o=opts||{};
  const conta={jogadoresT1:0,jogadoresT2:0,comissao:0,potencial:0,agentes:0,topo:0};

  /* alvos ordenados: preserva quem é melhor que quem dentro do clube */
  const distribuir=(itens,tipo,tier,prest,folga)=>{
    const alvos=itens.map(()=>overAlvo(tipo,tier,prest,2.6,folga)).sort((a,b)=>b-a);
    return itens.slice().sort((a,b)=>b.ov-a.ov).map((it,i)=>({...it,alvo:alvos[i]}));
  };

  for(const id in G.times){
    const t=G.times[id];
    const[piso,teto]=FAIXAS.jogador[t.tier]||FAIXAS.jogador[2];

    /* ---- jogadores ---- */
    const elenco=(t.elenco||[]).map(pid=>G.jogadores[pid]).filter(Boolean);
    if(t.tier===2){
      for(const it of distribuir(elenco.map(p=>({p,ov:over(p)})),'jogador',2,t.prestigio)){
        if(over(it.p)!==it.alvo){aplicarOver(it.p,it.alvo);conta.jogadoresT2++;}
      }
    }else{
      /* Tier 1: só quem está abaixo do piso. Acima dele é edição sua. */
      const abaixo=elenco.filter(p=>over(p)<piso);
      if(abaixo.length){
        for(const it of distribuir(abaixo.map(p=>({p,ov:over(p)})),'jogador',1,t.prestigio,4)){
          aplicarOver(it.p,Math.max(piso,it.alvo));conta.jogadoresT1++;
        }
      }
    }
    /* potencial e agentes valem para as duas divisões */
    for(const p of elenco){
      const novo=potencialDe(over(p),p.idade,t.tier);
      if(novo!==p.pot){p.pot=novo;conta.potencial++;}
      const ag=sortearAgentes(p.role);
      if((p.agentes||[]).length!==ag.length){conta.agentes++;}
      const trocou=ag.some(a=>!(p.agentes||[]).includes(a));
      p.agentes=ag;
      /* trocar os mains sem re-semear deixava a familiaridade apontando para
         bonecos que ele não joga mais, e os novos mains sem nível nenhum */
      if(trocou&&typeof semearAgentes==='function')semearAgentes(p);
      p.salario=salario(p);p.valor=valor(p);
    }

    /* ---- comissão ---- */
    if(G.staff&&t.comissao){
      const membros=CARGOS.map(c=>G.staff[t.comissao[c.id]]).filter(Boolean);
      for(const it of distribuir(membros.map(m=>({m,ov:overStaff(m)})),'comissao',t.tier,t.prestigio)){
        if(overStaff(it.m)!==it.alvo){aplicarOverStaff(it.m,it.alvo);conta.comissao++;}
        it.m.pot=potencialStaffDe(overStaff(it.m),it.m.idade,t.tier);
      }
      atualizarComissao(t);
    }
    t.patroc=patrocinioDe(t);
    /* garotos da categoria de base só acompanham o catálogo de agentes */
    for(const p of (t.base||[]).map(pid=>G.jogadores[pid]).filter(Boolean)){
      const ag=sortearAgentes(p.role);
      const trocou=ag.some(a=>!(p.agentes||[]).includes(a));
      p.agentes=ag;
      if(trocou&&typeof semearAgentes==='function')semearAgentes(p);
    }
  }

  /* ---- sem clube: acompanham a régua, senão o mercado fica inútil ---- */
  for(const pid of (G.livres||[])){
    const p=G.jogadores[pid];if(!p)continue;
    const paraT1=over(p)>=FAIXAS.jogador[1][0];
    const tier=paraT1?1:2;
    /* real segue a régua da divisão; gerado só tem teto, nunca é empurrado
       para cima do over de promessa */
    if(p.real)aplicarOver(p,clamp(over(p),FAIXAS.jogador[tier][0],FAIXAS.jogador[tier][1]));
    else if(over(p)>TETO_LIVRE_GERADO)aplicarOver(p,TETO_LIVRE_GERADO);
    if(!p.potFixo)p.pot=potencialDe(over(p),p.idade,tier);
    const agL=sortearAgentes(p.role);
    const trocouL=agL.some(a=>!(p.agentes||[]).includes(a));
    p.agentes=agL;
    if(trocouL&&typeof semearAgentes==='function')semearAgentes(p);
    p.salario=salario(p);p.valor=valor(p);
  }
  for(const sid of (G.staffLivres||[])){
    const m=G.staff&&G.staff[sid];if(!m)continue;
    const tier=overStaff(m)>=FAIXAS.comissao[1][0]?1:2;
    aplicarOverStaff(m,clamp(overStaff(m),FAIXAS.comissao[tier][0],FAIXAS.comissao[tier][1]));
    m.pot=potencialStaffDe(overStaff(m),m.idade,tier);
  }

  /* Só a comissão é promovida ao topo aqui. Jogador não: a promoção mexe no
     over, e no save o over de Tier 1 é edição sua — inclusive a de quem já
     está no topo. Em mundo novo a promoção de jogadores continua rodando,
     porque lá quem veio do arquivo está protegido por p.overFixo. */
  if(o.topo!==false)conta.topo=promoverComissaoAoTopo();
  /* Rede de segurança: mexer em over depois do time montado deixa a escalação
     obsoleta em silêncio, que foi exatamente como o reserva de 97 ficou no
     banco. Reescalar no fim custa nada e fecha essa classe de erro. */
  for(const id in G.times)autoEscalar(G.times[id]);
  return conta;
}

/* Saves criados antes de p.real existir não têm ninguém marcado, e por isso a
   exportação saía VAZIA — o arquivo gerado tinha zero jogadores e, copiado por
   cima de data/elencos.js, apagava os 447 nomes reais.

   Esta função remarca pelo nick: quem tem nome que consta em ELENCOS_REAIS é
   real, esteja em que clube estiver. É seguro rodar sempre, porque só
   ACRESCENTA marcação. */
function remarcarReais(){
  if(typeof ELENCOS_REAIS==='undefined'||!ELENCOS_REAIS)return 0;
  const nicks=new Set();
  for(const tag in ELENCOS_REAIS)
    for(const linha of ELENCOS_REAIS[tag])nicks.add(String(linha[0]));
  let n=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!p.real&&nicks.has(p.nome)){p.real=true;n++;}
  }
  return n;
}
function quantosReais(){
  let n=0;for(const id in G.jogadores)if(G.jogadores[id].real)n++;
  return n;
}

/* Gera o conteúdo de data/elencos.js a partir da base carregada, para que
   os ajustes feitos no Editor deixem de morar só no save. Exporta apenas
   quem carrega nome real (p.real): os reservas gerados voltam a ser gerados
   na próxima run, que é o que os mantém variados de partida para partida. */
/* Gera data/clubes.js. Arquivo próprio, e não um apêndice do elencos.js, por
   dois motivos: é dado de CLUBE e não de jogador, e principalmente porque não
   depende de ninguém estar marcado como real — o elencos.js exige isso, e foi
   por causa dessa exigência que a primeira exportação saiu vazia. */
function gerarClubesJS(){
  const linhas=[];
  const ord=Object.values(G.times).sort((a,b)=>(a.tier-b.tier)||a.tag.localeCompare(b.tag));
  for(const t of ord){
    if(!t.pais)continue;
    linhas.push('  '+JSON.stringify(t.tag)+':{pais:'+JSON.stringify(t.pais)+'},'+
                '   /* '+t.nome+' · Tier '+t.tier+' */');
  }
  if(!linhas.length)return null;
  return '/* ============================================================\n'+
    '   DADOS DE CLUBE — exportado do Editor em '+new Date().toISOString().slice(0,10)+'\n'+
    '   ------------------------------------------------------------\n'+
    '   '+linhas.length+' clube(s) com sede definida. Copie por cima de\n'+
    '   data/clubes.js e todo jogo novo já nasce com eles.\n'+
    '   ============================================================ */\n'+
    'const CLUBES_BASE={\n'+linhas.join('\n')+'\n};\n';
}

function gerarElencosJS(){
  /* Recupera marcação perdida antes de decidir se há o que exportar. */
  remarcarReais();
  const linhas=[];
  const porRegiao={};
  for(const id in G.times){
    const t=G.times[id];
    const reais=(t.elenco||[]).map(p=>G.jogadores[p])
      .filter(p=>p&&p.real).sort((a,b)=>over(b)-over(a));
    if(!reais.length)continue;
    (porRegiao[t.regiao]=porRegiao[t.regiao]||[]).push({t,reais});
  }
  const asp=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
  for(const R of REGIONS){
    const grupos=(porRegiao[R.id]||[]).sort((a,b)=>(a.t.tier-b.t.tier)||(b.t.prestigio-a.t.prestigio));
    if(!grupos.length)continue;
    linhas.push('\n/* ---------------- '+R.nome+' ---------------- */');
    for(const{t,reais}of grupos){
      const corpo=reais.map(p=>'['+[asp(p.nome),asp(p.role),over(p),p.idade,asp(p.pais)].join(',')+']');
      /* '100T' e afins não são identificador JS válido: sem aspas o arquivo
         gerado não carrega. Só aspas onde precisa, para o resto continuar
         legível como o elencos.js escrito à mão. */
      const chave=/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t.tag)?t.tag:asp(t.tag);
      linhas.push(chave+':['+corpo.join(',\n'+' '.repeat(chave.length+2))+'],');
    }
  }
  /* Real que está sem clube tem de sair daqui também, senão some: ele não
     pertence a nenhuma tag e a exportação anterior simplesmente o esquecia,
     e na run seguinte um jogador gerado ocupava o lugar dele. */
  const livres=(G.livres||[]).map(id=>G.jogadores[id])
    .filter(p=>p&&p.real).sort((a,b)=>over(b)-over(a));
  if(livres.length){
    linhas.push('\n/* ---------------- Sem clube ---------------- */');
    const corpo=livres.map(p=>'['+[asp(p.nome),asp(p.role),over(p),p.idade,asp(p.pais)]
      .concat(p.potFixo?[p.pot]:[]).join(',')+']');
    linhas.push('LIVRE:['+corpo.join(',\n       ')+'],');
  }
  const total=livres.length+Object.values(porRegiao).reduce((s,g)=>s+g.reduce((x,y)=>x+y.reais.length,0),0);
  /* Um arquivo vazio sobrescrevendo data/elencos.js apaga a base inteira, e foi
     exatamente o que aconteceu na primeira vez que este botão foi usado. Se não
     há nada para exportar, o certo é falhar alto, não devolver um arquivo. */
  if(!total)return null;
  return '/* ============================================================\n'+
    '   ELENCOS DE PARTIDA — exportado do Editor em '+new Date().toISOString().slice(0,10)+'\n'+
    '   ------------------------------------------------------------\n'+
    '   '+total+' jogadores, todos no formato completo:\n'+
    "     ['nick','Função',over,idade,'PA']\n\n"+
    '   Este arquivo foi gerado a partir de uma base editada no jogo, então\n'+
    '   função, over, idade e país são as SUAS escolhas, não estimativa.\n'+
    '   Reservas gerados ficaram de fora de propósito: eles voltam a ser\n'+
    '   sorteados a cada run, que é o que mantém os elencos variados.\n'+
    '   ============================================================ */\n'+
    'const ELENCOS_REAIS={'+linhas.join('\n')+'\n};\n';
}

/* ============================================================
   ECONOMIA: PATROCÍNIO, TORCIDA E PREMIAÇÃO
   ------------------------------------------------------------
   Antes a receita era uma linha só: prestígio × constante. O
   efeito era a espiral que aparecia da sexta temporada em diante
   — o clube do fundo tinha receita fixa, folha crescendo com a
   evolução dos jogadores, e nenhuma forma de reagir. Prêmio não
   resolvia porque prêmio ia para quem ganha, e quem ganha não é
   quem estava quebrando.

   Agora a receita tem três fontes com comportamentos diferentes:

     · PATROCÍNIO  varia com o clube. Marca boa vai para clube
                   atraente, e vai embora quando ele cai. É a
                   parte que premia jogar bem.
     · APORTE DA LIGA  é o piso. Time de Tier 1 é franquiado e
                   recebe da Riot mesmo perdendo tudo, com uma
                   parcela por torcida. É o que impede a espiral.
     · PREMIAÇÃO   agora chega ao último colocado. Pouco, mas
                   chega — participar de Champions passou a valer
                   dinheiro, não só prestígio.

   TORCIDA é o que liga as três: cresce com vitória e título, cai
   devagar sozinha, e entra no aporte e no valor do patrocínio.
   ============================================================ */

/* ---------- torcida ---------- */
/* Escala 0–100. Não é número de pessoas: é o quanto o clube pesa
   no mercado, que é o que a economia precisa saber. */
/* Piso por divisão, não um piso único. Estar numa liga reconhecida já vale
   público: um clube de Tier 1 que perde tudo continua sendo um clube de Tier 1.

   Com um piso único de 5, um clube de Challengers que passasse anos perdendo
   afundava a torcida até o mínimo e travava a receita lá — mas a folha não
   travava junto, porque a régua de over obriga o elenco a custar dinheiro. Era
   o que produzia clubes com razão folha/receita acima de 1.0 na décima quinta
   temporada, e nenhuma saída possível. */
const TORCIDA_PISO={1:26, 2:11};
/* Todo clube de Tier 2 começa com o mesmo prestígio: no Challengers, título de
   campeonato menor não hierarquiza ninguém. O que diferencia um do outro é a
   torcida, e é ela que decide patrocínio e aporte. */
const PRESTIGIO_T2=48;
const TORCIDA_MAX=100;
/* Quanto some por temporada se nada acontecer. Sem isso, campeão
   de 2027 continua enchendo estádio em 2040. */
const TORCIDA_DECAIMENTO=0.06;

function pisoTorcida(t){return TORCIDA_PISO[t.tier]||TORCIDA_PISO[2];}

/* ---------- popularidade por país ----------
   No Tier 2 todo clube tem o mesmo prestígio, então o que separa um do outro é
   público — e público depende de onde o clube joga. Um clube brasileiro nasce
   com mais torcida que um clube de um país de cena pequena, mesmo empatados em
   tudo o mais.

   POP_PAIS é PARÂMETRO DE JOGO, não medição: 1.0 é a média. Está aqui em cima e
   é editável de propósito, porque é a espécie de número que só quem acompanha a
   cena sabe ajustar. Os países ausentes valem 1.0. */
/* Os nove que o Gabriel apontou como principais do jogo. O resto fica em 1.0
   de propósito, e não abaixo: Valorant é popular no mundo todo, então país fora
   da lista é a média, não um lugar sem cena. Mexer aqui muda a torcida de base
   de todo clube sediado naquele país. */
const POP_PAIS={
  BR:1.35, US:1.30, KR:1.28, CN:1.26, TR:1.22,
  FR:1.18, GB:1.15, DE:1.14, CL:1.12
};
/* País do clube. Sai do elenco — a nacionalidade mais comum entre os jogadores
   de nome real — e pode ser fixada à mão no Editor. Derivar do elenco é o que
   permite o sistema funcionar sem uma tabela escrita à mão para 80 clubes. */
function paisDoClube(t){
  if(t.pais)return t.pais;
  /* congelado na criação do mundo: sem isso, quando os jogadores de nome
     real se aposentam o clube "perde" o país, e é dele que saem a base e as
     marcas nacionais */
  if(t.paisSede)return t.paisSede;
  const conta={};
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    /* só país que veio do arquivo conta: país sorteado para um nick sem dado
       não diz nada sobre onde o clube fica */
    if(!p||!p.paisReal||!p.pais)continue;
    conta[p.pais]=(conta[p.pais]||0)+1;
  }
  const ord=Object.keys(conta).sort((a,b)=>conta[b]-conta[a]);
  return ord[0]||null;
}
function popularidadeDoClube(t){
  const pais=paisDoClube(t);
  return pais&&POP_PAIS[pais]!=null?POP_PAIS[pais]:1;
}
function torcidaInicial(t){
  /* No Tier 1 o prestígio já carrega a história do clube e domina. No Tier 2 o
     prestígio é igual para todos, então a popularidade do país é o que
     diferencia — é o pedido, e é onde ela pesa mais. */
  const base=t.tier===1?t.prestigio*0.82:t.prestigio*0.45;
  const pop=popularidadeDoClube(t);
  const peso=t.tier===1?1+(pop-1)*0.35:pop;
  return clamp(Math.round(base*peso+gauss(0,4)),pisoTorcida(t),TORCIDA_MAX);
}
/* Chamado na virada de temporada, depois de contabilizada a campanha. */
function atualizarTorcida(t){
  /* Save antigo chega sem o campo, e a linha do decaimento abaixo lê t.torcida
     ANTES de qualquer fallback: undefined ali vira NaN, o NaN vaza para
     aporteLiga e daí para o caixa do clube. Normalizar aqui, antes da conta, é
     o que impede isso. */
  if(typeof t.torcida!=='number'||!isFinite(t.torcida))t.torcida=torcidaInicial(t);
  const c=t.temporada||{v:0,d:0};
  const jogos=c.v+c.d;
  /* aproveitamento acima de 50% engorda, abaixo encolhe */
  const desempenho=jogos?((c.v/jogos)-0.5)*2:0;
  const titulosAno=(t.titulos||[]).filter(x=>String(x).startsWith(String(G.ano))).length;
  const alvoTier=t.tier===1?55:22;   /* para onde a torcida tende sem resultado */
  let d=desempenho*7+titulosAno*9;
  d+=(alvoTier-t.torcida)*TORCIDA_DECAIMENTO;
  t.torcida=clamp(Math.round(t.torcida+d),pisoTorcida(t),TORCIDA_MAX);
  return t.torcida;
}
/* O quanto o clube interessa a um patrocinador. Prestígio é reputação
   histórica, torcida é audiência agora — as duas contam, e nenhuma
   sozinha decide. */
function atratividade(t){
  return 0.55+0.25*(t.prestigio/99)+0.45*((t.torcida||0)/100);
}

/* ---------- catálogo de marcas ---------- */
/* Marcas reais, em data/patrocinadores.js: cada uma com região, países,
   setor, patamar e nível. Toda carreira nova copia o catálogo para G.marcas,
   e o Editor (aba Patrocinadores) muda só o save. */
const REGIOES_MARCA=['GLOBAL','AMER','EMEA','PAC','CN'];
const SETORES=[...new Set((typeof PATROCINADORES!=='undefined'?PATROCINADORES:[]).map(m=>m.setor))]
  .sort((a,b)=>a.localeCompare(b,'pt-BR'));
/* a mesma regra de ASSETS.slug: o id da marca é o nome do arquivo do logo */
function slugMarca(s){
  /* apóstrofo some em vez de virar hífen: McDonald's → mcdonalds */
  return String(s).replace(/['’]/g,'').normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
}
function idMarcaLivre(nome){
  const base=slugMarca(nome)||'marca';
  let id=base,i=2;
  while(G.marcas[id])id=base+'-'+(i++);
  return id;
}
function nivelNoPatamar(patamar,nivel){
  const f=(PATAMARES[patamar]||PATAMARES.medio).faixa;
  return clamp(Math.round(nivel)||f[0],f[0],f[1]);
}
function montarMarcas(){
  G.marcas={};
  for(const m of PATROCINADORES){
    const id=idMarcaLivre(m.nome);
    G.marcas[id]={id,nome:m.nome,setor:m.setor,patamar:m.patamar,regiao:m.regiao,
                  paises:(m.paises||[]).slice(),nivel:nivelNoPatamar(m.patamar,m.nivel)};
  }
  return G.marcas;
}
function marca(id){return (G&&G.marcas&&G.marcas[id])||null;}
function listaMarcas(){
  const ordR=r=>{const i=REGIOES_MARCA.indexOf(r);return i<0?99:i;};
  return Object.values(G.marcas||{}).sort((a,b)=>
    b.nivel-a.nivel||ordR(a.regiao)-ordR(b.regiao)||a.nome.localeCompare(b.nome,'pt-BR'));
}
/* A marca topa assinar com este clube? Global assina com qualquer um; as
   outras só com clube da região delas e, se tiverem lista de países, do
   país do clube. Clube sem país conhecido aceita as marcas da região. */
function marcaAtende(mk,t){
  if(!mk||!t)return false;
  if(!mk.regiao||mk.regiao==='GLOBAL')return true;
  if(mk.regiao!==t.regiao)return false;
  if(!mk.paises||!mk.paises.length)return true;
  const pais=paisDoClube(t);
  return !pais||mk.paises.includes(pais);
}
/* Rótulo curto de onde a marca atua: "Global", "Brasil", "América Latina". */
function areaMarca(mk){
  if(!mk||!mk.regiao||mk.regiao==='GLOBAL')return 'Global';
  const ps=mk.paises||[];
  if(!ps.length){const R=(typeof REGIONS!=='undefined')&&REGIONS.find(r=>r.id===mk.regiao);
    return mk.regiao==='CN'?'China':(R?R.nome.replace('VCT ',''):mk.regiao);}
  for(const b in BLOCOS_MARCA)if(BLOCOS_MARCA[b].join()===ps.join())return NOME_BLOCO_MARCA[b];
  const nome=c=>(typeof PAISES!=='undefined'&&PAISES[c])||c;
  return ps.map(nome).join(', ');
}
function patamarDe(mk){return PATAMARES[mk&&mk.patamar]||PATAMARES.medio;}

/* ---------- as três vagas ---------- */
const VAGAS=[
  {id:'master',     nome:'Máster',      peso:1.00, exclusiva:true,  desc:'Nome no peito. Uma marca por clube, sem repetir no mundo.'},
  {id:'secundario', nome:'Secundário',  peso:0.42, exclusiva:false, desc:'Manga e verso. A mesma marca pode atender alguns clubes.'},
  {id:'fornecedor', nome:'Fornecedor',  peso:0.26, exclusiva:false, desc:'Uniforme e periférico. É a vaga mais fácil de preencher.'}
];
/* Quantos clubes uma marca não exclusiva aceita ao mesmo tempo. */
const MAX_CLUBES_POR_MARCA=4;

/* Valor anual de um contrato. Nível da marca e peso da vaga dizem o
   tamanho; a atratividade do clube diz se ele consegue esse contrato e
   por quanto. */
/* Quanto vale um ponto de nível de marca numa vaga, por divisão. Os dois
   números são próximos e isso não é engano: a diferença entre as divisões já
   está contada duas vezes antes daqui — o clube de Challengers só alcança
   marca de nível 1 ou 2 (ver tetoNivel) e tem atratividade menor. Se a base
   também fosse muito menor, os três efeitos se multiplicariam e o patrocínio
   de Tier 2 viraria troco. Os valores saem da calibragem contra a folha que
   cada divisão carrega — tools/fin.mjs é quem confere. */
const BASE_VAGA={1:178000, 2:117000};
function valorContrato(mk,t,vagaId){
  if(!mk)return 0;
  const vaga=VAGAS.find(v=>v.id===vagaId)||VAGAS[0];
  return Math.round(BASE_VAGA[t.tier]*mk.nivel*vaga.peso*atratividade(t)/1000)*1000;
}
function patrociniosDe(t){
  return VAGAS.map(v=>({vaga:v,mk:marca(t.patrocinios&&t.patrocinios[v.id])}));
}
/* Receita de patrocínio do ano: o fixo mais o bônus que a marca adianta ao
   longo da temporada (o resto, ou o desconto, vem no acerto da virada — ver
   core/patrocinio.js). Vaga sem contrato (save antigo, Editor) vale a tabela. */
function receitaPatrocinio(t){
  if(!t.patrocinios)return 0;
  return VAGAS.reduce((s,v)=>{
    const c=typeof contratoDe==='function'?contratoDe(t,v.id):null;
    return s+(c?c.fixo+(c.adiant||0):valorContrato(marca(t.patrocinios[v.id]),t,v.id));},0);
}
/* t.patroc: a receita anual que o relógio divide pelas semanas */
function receitaCaixa(t){return receitaPatrocinio(t)+aporteLiga(t);}

/* Redistribui as marcas entre todos os clubes. Roda na criação do mundo e
   em toda virada de temporada: é isso que faz o patrocinador ir embora
   quando o clube cai, e chegar quando ele sobe.

   Clube mais atraente escolhe primeiro. Não é leilão porque leilão daria
   o mesmo resultado com dez vezes mais código. */
/* Setores de quem faz uniforme e periférico: o fornecedor prefere estes. */
const SETORES_FORNECEDOR=new Set(['Vestuário','Periféricos','Hardware','Cadeiras','Computadores','Áudio','Esporte']);
function atribuirPatrocinios(anoInicio){
  const ano=anoInicio||G.ano;
  const clubes=Object.values(G.times).sort((a,b)=>atratividade(b)-atratividade(a));
  const usoExclusivo=new Set();
  const uso={};
  const todas=listaMarcas();
  /* Contrato que ainda vale para a temporada que começa fica: a marca não
     troca de clube no meio do contrato. Ele entra primeiro no uso, para a
     exclusividade do máster continuar valendo para todo mundo. */
  const fica=(t,v)=>{const c=t.contratos&&t.contratos[v.id];
    return c&&c.ate>=ano&&t.patrocinios&&t.patrocinios[v.id]===c.marca&&marca(c.marca)?c:null;};
  for(const t of clubes)for(const v of VAGAS){
    const c=fica(t,v);if(!c)continue;
    uso[c.marca]=(uso[c.marca]||0)+1;
    if(v.exclusiva)usoExclusivo.add(c.marca);
  }
  /* Clube por clube, e dentro do clube na ordem das vagas. Antes o laço era
     vaga por vaga: quando chegava no secundário havia marca grande sobrando e
     o clube acabava com um secundário nível 4 ao lado de um máster nível 3,
     que não faz sentido nenhum. Fechando o pacote de uma vez, o máster é
     sempre a maior marca que o clube alcança. */
  for(const t of clubes){
    const antes=t.patrocinios||{};
    const contratos=t.contratos||{};
    t.patrocinios={master:null,secundario:null,fornecedor:null};
    t.contratos={};
    /* O clube alcança o nível de marca que a atratividade dele permite. Sem
       esse teto, o lanterna do Tier 2 ficaria com a sobra do topo e a vaga de
       máster não significaria nada. */
    let teto=Math.max(1,Math.round(atratividade(t)*(t.tier===1?4.2:2.8)));
    const setores=new Set();
    for(const v of VAGAS){
      const c=contratos[v.id];
      if(c&&c.ate>=ano&&antes[v.id]===c.marca&&marca(c.marca)){
        const mk=marca(c.marca);
        t.patrocinios[v.id]=c.marca;t.contratos[v.id]=c;
        if(c.ano!==ano&&typeof renovarMetas==='function')renovarMetas(t,c,ano);
        setores.add(mk.setor);teto=Math.max(1,Math.min(teto,mk.nivel));
        continue;
      }
      const livre=mk=>{
        if(mk.nivel>teto)return false;
        if(v.exclusiva)return !usoExclusivo.has(mk.id);
        return (uso[mk.id]||0)<MAX_CLUBES_POR_MARCA&&t.patrocinios.master!==mk.id
               &&t.patrocinios.secundario!==mk.id;
      };
      /* Marca da região/país do clube e de setor que ele ainda não tem. Se
         não houver nenhuma (catálogo editado, país sem marca), afrouxa o
         setor e depois a região, para a vaga não ficar aberta à toa. */
      let cand=todas.filter(mk=>livre(mk)&&marcaAtende(mk,t)&&!setores.has(mk.setor));
      if(!cand.length)cand=todas.filter(mk=>livre(mk)&&marcaAtende(mk,t));
      if(!cand.length)cand=todas.filter(mk=>livre(mk)&&(mk.regiao===t.regiao||mk.regiao==='GLOBAL'));
      if(!cand.length)continue;
      /* entre as elegíveis, a melhor — com um empurrãozinho aleatório para
         que duas temporadas iguais não deem exatamente o mesmo quadro */
      /* Mesmo nível, a marca mais próxima ganha: nacional antes de regional,
         regional antes de global. É o que deixa as marcas de bloco para o
         clube de país pequeno, que não tem marca nacional nenhuma. */
      const pais=paisDoClube(t);
      const perto=mk=>mk.regiao==='GLOBAL'?0:(mk.paises&&mk.paises.length&&pais&&mk.paises.includes(pais))?
        (mk.paises.length<=2?0.35:0.2):0.1;
      const bonus=mk=>perto(mk)+(v.id==='fornecedor'&&SETORES_FORNECEDOR.has(mk.setor)?0.6:0);
      const nota=new Map(cand.map(mk=>[mk.id,mk.nivel+bonus(mk)+rnd()*0.9]));
      const escolhida=cand.sort((a,b)=>nota.get(b.id)-nota.get(a.id))[0];
      t.patrocinios[v.id]=escolhida.id;
      if(typeof novoContrato==='function')t.contratos[v.id]=novoContrato(t,escolhida,v.id,ano);
      uso[escolhida.id]=(uso[escolhida.id]||0)+1;
      if(v.exclusiva)usoExclusivo.add(escolhida.id);
      setores.add(escolhida.setor);
      teto=escolhida.nivel;   /* a próxima vaga não pode superar esta */
    }
  }
}

/* ---------- estrutura ----------
   A tabela de preço morava em src/ui/views.js, onde só o clube do jogador
   alcançava. Com ela aqui, a IA também constrói — e é isso que dá ao dinheiro
   ganho um destino: sem nada em que gastar, o caixa de todo clube vencedor
   virava poça parada. Construir não é punição, é o prêmio virando estrutura,
   e custa mais para manter depois (ver o custeio em clock.js). */
const CUSTO_UPGRADE=[0,120000,220000,380000,600000];
/* Sobra anual que a obra tem de deixar de pé depois de pronta. */
const MARGEM_OBRA=0.12;
const ESTRUTURA_MAX=5;
function custoUpgrade(nv){return CUSTO_UPGRADE[nv]||0;}
/* Reserva que o clube não encosta: uma temporada inteira de folha. É o que
   garante que investir nunca quebre ninguém — foi o pedido explícito, clube
   falindo não é divertido. */
function reservaMinima(t){
  return (typeof folhaAnual==='function')?folhaAnual(t):receitaAnual(t)*0.6;
}
/* Uma obra por clube por temporada, na área mais atrasada. Uma de cada vez
   para o clube crescer ao longo de anos em vez de nascer pronto.

   Duas travas, e as duas existem pelo mesmo motivo: clube quebrando não é
   divertido. A primeira é a obra caber no caixa deixando a reserva intacta. A
   segunda é a obra caber na OPERAÇÃO depois de pronta — estrutura maior custa
   mais para manter todo ano, e sem esta segunda trava o Challengers construía
   um centro de treino que a receita dele não sustentava e ia para o vermelho
   sem ter feito nada de errado. */
function investirEstrutura(t){
  if(!t||!t.estrutura)return null;
  /* a área mais atrasada; no empate, a ordem dos departamentos (o CT
     primeiro, porque é o que mais mexe na evolução) */
  const ordem=typeof DEPTOS!=='undefined'?DEPTOS.map(d=>d.id):Object.keys(t.estrutura);
  const areas=ordem.filter(k=>typeof t.estrutura[k]==='number'&&t.estrutura[k]<ESTRUTURA_MAX);
  if(!areas.length)return null;
  areas.sort((a,b)=>t.estrutura[a]-t.estrutura[b]||ordem.indexOf(a)-ordem.indexOf(b));
  const alvo=areas[0];
  const custo=typeof custoObra==='function'?custoObra(alvo,t.estrutura[alvo]):custoUpgrade(t.estrutura[alvo]);
  if(!custo||t.caixa-custo<reservaMinima(t))return null;
  /* simula a conta anual com a obra de pé */
  const antes=t.estrutura[alvo];
  t.estrutura[alvo]++;
  const folha=(typeof folhaAnual==='function')?folhaAnual(t):0;
  /* Margem, não empate. Construir até a conta fechar no zero funciona no ano
     da obra e quebra no seguinte, porque receita cai: torcida encolhe, o
     patrocinador troca de clube, o time é rebaixado. A estrutura, essa, não
     encolhe junto — ela custa o mesmo para manter. A folga exigida aqui é o
     que impede o clube de construir um centro de treino que ele só consegue
     pagar enquanto está ganhando. */
  const sustenta=receitaAnual(t)-custeioAnual(t)-folha>=receitaAnual(t)*MARGEM_OBRA;
  if(!sustenta){t.estrutura[alvo]=antes;return null;}
  t.caixa-=custo;
  return{area:alvo,nivel:t.estrutura[alvo],custo};
}
function investimentoIA(){
  let obras=0;
  for(const id in G.times){
    if(id===G.meuTime)continue;
    /* Até duas obras por temporada: com sete departamentos, uma só deixava
       o clube rico vinte anos sem terminar o CT. A segunda passa pelas
       mesmas travas de caixa e de operação. */
    for(let i=0;i<2;i++){
      const r=investirEstrutura(G.times[id]);
      if(!r)break;
      obras++;
    }
  }
  return obras;
}

/* ---------- aporte da liga ---------- */
/* A parcela fixa é o piso da economia: clube franqueado de Tier 1 recebe
   por estar na liga, ganhando ou perdendo. É de propósito que ela não
   dependa de resultado — é ela que impede a espiral do fundo da tabela. */
const APORTE_FIXO={1:380000, 2:130000};
const APORTE_POR_TORCIDA={1:3500, 2:2700};
function aporteLiga(t){
  return Math.round(APORTE_FIXO[t.tier]+APORTE_POR_TORCIDA[t.tier]*(t.torcida||0));
}

/* Receita anual total, que o relógio semanal divide por 44. */
function receitaAnual(t){
  return receitaPatrocinio(t)+aporteLiga(t);
}
/* Custo de manter o clube de pé: estrutura e scrims. Estava escrito dentro do
   relógio semanal, onde ninguém mais enxergava — e por isso o teto de folha
   fingia que a receita inteira estava disponível para salário. Aqui, quem
   decide contratar sabe o que já está comprometido. */
function custeioSemanal(t){
  const e=t.estrutura||{gh:1,treino:1,academia:1};
  const scrim=(t.tatica&&t.tatica.scrim)||3;
  const base=(typeof custoDaBase==='function')?custoDaBase(t):0;
  /* cada departamento cobra pelo nível (core/estrutura.js); a soma dos pesos
     é a mesma das três áreas antigas a 400 cada */
  const est=typeof custeioEstruturaBase==='function'?custeioEstruturaBase(t):(e.gh+e.treino+e.academia)*400;
  return (est+scrim*600)*(t.tier===1?2:0.6)+base;
}
function custeioAnual(t){return custeioSemanal(t)*SEMANAS_ANO;}
/* O que sobra da receita depois do custeio: é daqui que sai a folha. */
function receitaLivre(t){return Math.max(0,receitaAnual(t)-custeioAnual(t));}

/* ---------- índice salarial do Tier 1 ----------
   Sem isto o dinheiro parava no topo: o salário saía só do over, a estrutura
   chegava ao nível máximo em poucas temporadas e o Tier 1 terminava vinte anos
   com mediana de 5 milhões no caixa e folha em um quarto da receita. Ganhar
   dinheiro deixava de significar alguma coisa.

   Agora o mercado reage à riqueza, como num circuito de verdade: quando os
   clubes de cima guardam mais do que precisam, o salário pedido no Tier 1
   sobe; quando apertam, ele cede. Vale para contrato novo e renovação, então
   o efeito chega aos poucos. O Challengers fica fora: lá a folha já come
   metade da receita. Só aritmética: não sorteia nada. */
const INDICE_SAL_MIN=1, INDICE_SAL_MAX=3;
/* Quantos anos de receita no caixa o mercado considera normal. */
const INDICE_SAL_ALVO=1.5;
const INDICE_SAL_PASSO=0.05, INDICE_SAL_SOBE=0.08, INDICE_SAL_DESCE=0.05;
function indiceSalarial(tier){
  if(tier!==1)return 1;
  return (typeof G!=='undefined'&&G&&G.indiceSalario)||1;
}
/* Clube com dinheiro sobrando paga mais pelo mesmo jogador: o empresário sabe
   quanto tem no banco. O índice acompanha a mediana do Tier 1 e não alcança os
   ricos de verdade (o p90 terminava vinte anos com 17 milhões); isto alcança.
   Até três anos de receita guardados não muda nada. */
const RIQUEZA_ANOS_LIVRES=3, RIQUEZA_POR_ANO=0.10, RIQUEZA_TETO=0.6;
function fatorRiqueza(t){
  if(!t)return 1;
  const rec=receitaAnual(t);
  if(!(rec>0))return 1;
  const anos=(t.caixa||0)/rec;
  return 1+clamp((anos-RIQUEZA_ANOS_LIVRES)*RIQUEZA_POR_ANO,0,RIQUEZA_TETO);
}
function _mediana(xs){
  const v=xs.slice().sort((a,b)=>a-b);
  return v.length?v[Math.floor(v.length/2)]:0;
}
/* Anos de receita que o Tier 1 tem guardados (mediana, sem o seu clube). */
function folegoDoTier1(){
  const ts=Object.values(G.times).filter(t=>t.tier===1&&t.id!==G.meuTime);
  const rec=_mediana(ts.map(receitaAnual));
  return rec>0?_mediana(ts.map(t=>t.caixa||0))/rec:0;
}
function atualizarIndiceSalarial(){
  const antes=G.indiceSalario||1;
  const r=folegoDoTier1();
  const f=clamp(1+(r-INDICE_SAL_ALVO)*INDICE_SAL_PASSO,1-INDICE_SAL_DESCE,1+INDICE_SAL_SOBE);
  const depois=Math.round(clamp(antes*f,INDICE_SAL_MIN,INDICE_SAL_MAX)*1000)/1000;
  G.indiceSalario=depois;
  (G.indiceHist=G.indiceHist||[]).push({ano:G.ano,i:depois});
  if(G.indiceHist.length>40)G.indiceHist.shift();
  const pct=Math.round((depois/antes-1)*100);
  if(Math.abs(pct)>=2&&typeof noticia==='function')
    noticia((pct>0?'📈 Os salários do Tier 1 subiram ':'📉 Os salários do Tier 1 caíram ')+Math.abs(pct)+
      '% na virada: '+(pct>0?'os clubes de cima estão com dinheiro sobrando.':'os clubes de cima apertaram o cinto.'),
      {c:'mercado',imp:1});
  return depois;
}

/* ---------- edição no Banco de dados ----------
   Como no resto do Editor, estas funções não conhecem DOM: recebem valores,
   devolvem {ok, msg|erro}. É o que permite testá-las sem navegador. */
/* Países digitados no Editor: "BR, ar" → ['BR','AR']. Aceita o nome de um
   bloco (LATAM, SEA) no lugar da lista. */
function lerPaisesMarca(txt){
  const out=[];
  for(const x of String(txt||'').split(/[\s,;]+/).map(s=>s.trim().toUpperCase()).filter(Boolean)){
    if(BLOCOS_MARCA[x])out.push(...BLOCOS_MARCA[x]);else out.push(x);
  }
  return [...new Set(out)];
}
function edMarcaAplicar(id,campos){
  const mk=marca(id);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  if(campos.nome!=null){
    const nome=String(campos.nome).trim();
    if(!nome)return{ok:false,erro:'A marca precisa de um nome.'};
    if(Object.values(G.marcas).some(x=>x.id!==id&&x.nome.toLowerCase()===nome.toLowerCase()))
      return{ok:false,erro:nome+' já existe no catálogo.'};
    mk.nome=nome;
  }
  if(campos.setor!=null)mk.setor=String(campos.setor).trim()||mk.setor;
  if(campos.regiao!=null){
    const r=String(campos.regiao).trim().toUpperCase();
    if(!REGIOES_MARCA.includes(r))return{ok:false,erro:'Região inválida: '+r+'.'};
    mk.regiao=r;
    if(r==='GLOBAL')mk.paises=[];
  }
  if(campos.paises!=null&&mk.regiao!=='GLOBAL')mk.paises=lerPaisesMarca(campos.paises);
  if(campos.patamar!=null){
    if(!PATAMARES[campos.patamar])return{ok:false,erro:'Patamar inválido.'};
    mk.patamar=campos.patamar;
  }
  if(campos.nivel!=null){
    const n=Math.round(parseFloat(campos.nivel));
    if(!(n>=1&&n<=5))return{ok:false,erro:'Nível vai de 1 a 5.'};
    mk.nivel=n;
  }
  /* o patamar manda na faixa de nível: marca global não vale 1, loja local
     não vale 5 */
  mk.nivel=nivelNoPatamar(mk.patamar||'medio',mk.nivel);
  return{ok:true,msg:mk.nome+' atualizada.'};
}
function edMarcaCriar(nome,nivel,setor,patamar,regiao,paises){
  if(!G.marcas)montarMarcas();
  nome=String(nome||'').trim();
  if(!nome)return{ok:false,erro:'Dê um nome à marca.'};
  if(Object.values(G.marcas).some(x=>x.nome.toLowerCase()===nome.toLowerCase()))
    return{ok:false,erro:nome+' já existe no catálogo.'};
  const n=Math.round(parseFloat(nivel)||3);
  if(!(n>=1&&n<=5))return{ok:false,erro:'Nível vai de 1 a 5.'};
  /* sem patamar dito, sai do nível: 4–5 global, 2–3 nacional, 1 local */
  const pat=PATAMARES[patamar]?patamar:(n>=4?'alto':n>=2?'medio':'baixo');
  let reg=String(regiao||'').trim().toUpperCase();
  if(!REGIOES_MARCA.includes(reg))reg=pat==='alto'?'GLOBAL':
    ((G.meuTime&&G.times[G.meuTime]&&G.times[G.meuTime].regiao)||'GLOBAL');
  const id=idMarcaLivre(nome);
  G.marcas[id]={id,nome,setor:String(setor||'').trim()||'Outros',patamar:pat,regiao:reg,
                paises:reg==='GLOBAL'?[]:lerPaisesMarca(paises),nivel:nivelNoPatamar(pat,n)};
  return{ok:true,msg:nome+' entrou no catálogo.',id};
}
function edMarcaRemover(id){
  const mk=marca(id);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  if(Object.keys(G.marcas).length<=VAGAS.length)
    return{ok:false,erro:'O catálogo ficaria pequeno demais para preencher as vagas.'};
  /* solta as vagas que ela ocupava, senão o clube fica apontando para nada */
  let soltas=0;
  for(const tid in G.times){
    const t=G.times[tid];if(!t.patrocinios)continue;
    for(const v of VAGAS)if(t.patrocinios[v.id]===id){t.patrocinios[v.id]=null;if(t.contratos)delete t.contratos[v.id];soltas++;}
    t.patroc=receitaCaixa(t);
  }
  delete G.marcas[id];
  return{ok:true,msg:mk.nome+' removida'+(soltas?' — '+soltas+' vaga(s) ficaram abertas.':'.')};
}
/* Troca manual de uma vaga. Respeita a exclusividade do máster: sem isso o
   Editor conseguiria criar um estado que a redistribuição nunca produziria. */
function edPatrocinioTrocar(timeId,vagaId,marcaId){
  const t=G.times[timeId];
  if(!t)return{ok:false,erro:'Time não encontrado.'};
  const vaga=VAGAS.find(v=>v.id===vagaId);
  if(!vaga)return{ok:false,erro:'Vaga inválida.'};
  if(!t.patrocinios)t.patrocinios={master:null,secundario:null,fornecedor:null};
  if(!marcaId){t.patrocinios[vagaId]=null;if(t.contratos)delete t.contratos[vagaId];t.patroc=receitaCaixa(t);return{ok:true,msg:'Vaga aberta.'};}
  const mk=marca(marcaId);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  const outros=Object.values(G.times).filter(x=>x.id!==timeId&&x.patrocinios);
  if(vaga.exclusiva){
    const dono=outros.find(x=>x.patrocinios[vagaId]===marcaId);
    if(dono)return{ok:false,erro:mk.nome+' já é máster do '+dono.tag+'. A vaga é exclusiva.'};
  }else{
    const n=outros.filter(x=>x.patrocinios[vagaId]===marcaId).length;
    if(n>=MAX_CLUBES_POR_MARCA)
      return{ok:false,erro:mk.nome+' já atende '+n+' clubes nessa vaga (máximo '+MAX_CLUBES_POR_MARCA+').'};
  }
  t.patrocinios[vagaId]=marcaId;
  if(typeof novoContrato==='function')(t.contratos=t.contratos||{})[vagaId]=novoContrato(t,mk,vagaId,G.ano);
  t.patroc=receitaCaixa(t);
  return{ok:true,msg:mk.nome+' agora é '+vaga.nome.toLowerCase()+' do '+t.tag+'.'};
}

/* Caixa do seu clube semana a semana (gráfico de Finanças). Só leitura do
   que já aconteceu: não sorteia e não mexe em dinheiro. Guarda dois anos. */
const CAIXA_HIST_MAX=SEMANAS_ANO*2;
function registrarCaixaSemana(){
  const t=G.meuTime&&G.times[G.meuTime];
  if(!t)return;
  const h=G.caixaHist||(G.caixaHist=[]);
  const ult=h[h.length-1];
  const reg={a:G.ano,s:G.semana,c:Math.round(t.caixa),id:t.id};
  if(ult&&ult.a===reg.a&&ult.s===reg.s)h[h.length-1]=reg;else h.push(reg);
  if(h.length>CAIXA_HIST_MAX)h.splice(0,h.length-CAIXA_HIST_MAX);
}

/* ============================================================
   ESTRUTURA DO CLUBE — os departamentos
   ------------------------------------------------------------
   Eram três números soltos (gaming house, centro de treino, academia) e um
   botão de melhorar no canto da tela de Treinamento. Agora são sete
   departamentos, cada um com um papel claro, e o peso principal deles é na
   EVOLUÇÃO: é aqui que o clube transforma dinheiro em jogador melhor.

     treino    Centro de treinamento (CT) — multiplica toda evolução e o
               treino de mapa. É o departamento mais caro.
     equip     Equipamentos e servidores — evolução da mecânica (mira,
               reflexo, movimentação) e um pouco de rendimento em jogo.
               Envelhece: sem renovação, perde um nível a cada 3 temporadas.
     analise   Sala de análise — evolução tática (visão, utilidade), treino
               de mapa mais rápido e um pouco de preparo para o jogo.
     saude     Centro de performance (fisiologia, nutrição, sono) — desgaste,
               risco de lesão por esgotamento e o declínio da idade.
     mente     Psicologia e bem-estar — moral da semana, evolução do lado
               mental (clutch, consistência) e o tombo do esgotamento.
     gh        Gaming house — recuperação de desgaste e um pouco de moral.
     academia  Academia de base — quantidade e qualidade dos garotos.

   Todo efeito é centrado no nível 3: um clube com tudo em 3 joga e evolui
   exatamente como antes desta mudança. Abaixo disso perde, acima ganha.

   Nada aqui sorteia: é só aritmética sobre o nível, para a semente da
   carreira continuar a mesma.
   ============================================================ */
const EST_NEUTRO=3;
/* custo: multiplicador sobre CUSTO_UPGRADE (economia.js).
   custeio: quanto cada nível cobra por semana, antes do fator do tier. A
   soma dos sete é 1200, a mesma de antes com três áreas a 400: um clube com
   a mesma média de nível paga o mesmo para manter a estrutura de pé. */
const DEPTOS=[
  {id:'treino',nome:'Centro de treinamento',curto:'CT',grupo:'evolucao',ic:'controle',custo:1.15,custeio:240,
   desc:'Salas de treino, campo de scrim e a rotina do dia. Multiplica toda a evolução do elenco e o ganho do treino de mapa.'},
  {id:'equip',nome:'Equipamentos',curto:'Equipamentos',grupo:'evolucao',ic:'monitor',custo:0.55,custeio:150,
   desc:'Computadores, monitores de alta taxa, periféricos e servidor próprio de treino. Acelera a mecânica e dá um pouco de rendimento em jogo.'},
  {id:'analise',nome:'Sala de análise',curto:'Análise',grupo:'evolucao',ic:'grafico',custo:0.7,custeio:130,
   desc:'Vídeo, dados e o banco de demos dos adversários. Acelera a leitura de jogo e a utilidade, e o treino de mapa rende mais.'},
  {id:'saude',nome:'Centro de performance',curto:'Performance',grupo:'condicao',ic:'coracao',custo:0.8,custeio:140,
   desc:'Fisiologia, nutrição, sono e fisioterapia. Recupera o desgaste, corta lesão por esgotamento e segura o declínio dos veteranos.'},
  {id:'mente',nome:'Psicologia e bem-estar',curto:'Bem-estar',grupo:'condicao',ic:'mente',custo:0.6,custeio:120,
   desc:'Espaço de descanso, acompanhamento e rotina fora do jogo. Moral da semana, evolução do lado mental e menos tombo no esgotamento.'},
  {id:'gh',nome:'Gaming house',curto:'Gaming house',grupo:'condicao',ic:'predio',custo:1.0,custeio:220,
   desc:'Onde o elenco mora e convive. Recupera o desgaste da semana e ajuda um pouco na moral.'},
  {id:'academia',nome:'Academia de base',curto:'Academia',grupo:'base',ic:'broto',custo:0.9,custeio:200,
   desc:'Peneira, alojamento e treino dos garotos. Mais vagas na base, mais revelações por ano e potencial maior.'}
];
const GRUPOS_EST={evolucao:'Evolução',condicao:'Condição física e mental',base:'Base'};
/* A quais atributos cada departamento acelera a evolução. */
const EST_ATRIBUTOS={equip:['mira','reflexo','mov'],analise:['visao','util'],mente:['clutch','consist']};
const EST_POR_ATRIBUTO=0.07;          /* ±14% de evolução do atributo nos extremos */
const EQUIP_VIDA=3;                   /* temporadas até o equipamento ficar defasado */
const RENOVAR_FRAC=0.5;               /* renovar custa metade da obra do nível atual */

function deptoDe(k){return DEPTOS.find(d=>d.id===k)||null;}
function nivelEst(t,k){
  const v=t&&t.estrutura&&t.estrutura[k];
  return typeof v==='number'&&isFinite(v)?v:EST_NEUTRO;
}
/* Níveis do clube recém-criado, pelo prestígio. As três áreas antigas
   continuam com a régua de antes para o mundo inicial não mudar. */
function estruturaInicial(prest){
  const n=d=>clamp(Math.round(prest/d),1,5);
  return{gh:n(20),treino:n(20),academia:n(22),equip:n(20),analise:n(21),saude:n(22),mente:n(24)};
}
/* Saves de antes dos departamentos: completa o que falta pelo prestígio. */
function garantirEstrutura(t){
  if(!t)return;
  if(!t.estrutura)t.estrutura={};
  const ini=estruturaInicial(t.prestigio||50);
  for(const d of DEPTOS)
    if(typeof t.estrutura[d.id]!=='number'||!isFinite(t.estrutura[d.id]))t.estrutura[d.id]=ini[d.id];
  if(!t.estruturaIdade)t.estruturaIdade={equip:0};
}

/* ---------- custo ---------- */
function custoObra(k,nv){
  const d=deptoDe(k);
  const c=(typeof custoUpgrade==='function'?custoUpgrade(nv):0)*(d?d.custo:1);
  return Math.round(c/1000)*1000;
}
function custeioEstruturaBase(t){
  let s=0;
  for(const d of DEPTOS)s+=nivelEst(t,d.id)*d.custeio;
  return s;
}
/* custeio anual de UM nível do departamento, já com o fator do tier */
function custeioNivelAnual(t,k){
  const d=deptoDe(k);
  return d?d.custeio*(t&&t.tier===1?2:0.6)*(typeof SEMANAS_ANO!=='undefined'?SEMANAS_ANO:52):0;
}
function custoRenovacao(t){
  const n=nivelEst(t,'equip');
  return Math.round(custoObra('equip',Math.max(1,n-1))*RENOVAR_FRAC/1000)*1000;
}

/* ---------- efeitos (todos recebem o nível, para a tela poder mostrar
   a tabela de 1 a 5 com a mesma conta que o jogo usa) ---------- */
/* CT: o termo que já existia em clock.js, 0,45 + nível × 0,09 */
function efCT(n){return 0.45+n*0.09;}
function efCTRel(n){return efCT(n)/efCT(EST_NEUTRO);}
/* treino de mapa: CT (o termo antigo de treino.js) × sala de análise */
function efMapaCT(n){return 0.7+n*0.08;}
function efMapaAnalise(n){return 1+(n-EST_NEUTRO)*0.06;}
/* atributos acelerados por equipamentos, análise e bem-estar */
function efAtributo(n){return 1+(n-EST_NEUTRO)*EST_POR_ATRIBUTO;}
/* desgaste recuperado por semana (somado ao que já se recupera) */
function efRecupGH(n){return n*0.004;}
function efRecupSaude(n){return (n-EST_NEUTRO)*0.003;}
/* risco de lesão por esgotamento: multiplicador */
function efLesaoSaude(n){return Math.max(0.3,1-(n-EST_NEUTRO)*0.15);}
/* declínio da idade: multiplicador */
function efDeclinioSaude(n){return 1-(n-EST_NEUTRO)*0.08;}
/* moral por semana */
function efMoralGH(n){return (n-EST_NEUTRO)*0.0004;}
function efMoralMente(n){return (n-EST_NEUTRO)*0.0008;}
/* tombo de moral no esgotamento: multiplicador */
function efBurnoutMente(n){return 1-(n-EST_NEUTRO)*0.12;}
/* rendimento em jogo: multiplica a condição de cada titular */
function efJogoEquip(n){return (n-EST_NEUTRO)*0.004;}
function efJogoAnalise(n){return (n-EST_NEUTRO)*0.003;}

/* ---------- o que o resto do jogo consulta ---------- */
function fatorEvolucaoAtributo(t,k){
  for(const dep in EST_ATRIBUTOS)if(EST_ATRIBUTOS[dep].includes(k))return efAtributo(nivelEst(t,dep));
  return 1;
}
function fatorDeclinioEst(t){return efDeclinioSaude(nivelEst(t,'saude'));}
function recuperacaoEst(t){return efRecupGH(nivelEst(t,'gh'))+efRecupSaude(nivelEst(t,'saude'));}
function moralEst(t){return efMoralGH(nivelEst(t,'gh'))+efMoralMente(nivelEst(t,'mente'));}
function fatorLesaoEst(t){return efLesaoSaude(nivelEst(t,'saude'));}
function fatorBurnoutEst(t){return efBurnoutMente(nivelEst(t,'mente'));}
function fatorTreinoMapaEst(t){return efMapaCT(nivelEst(t,'treino'))*efMapaAnalise(nivelEst(t,'analise'));}
function fatorJogoEst(t){return 1+efJogoEquip(nivelEst(t,'equip'))+efJogoAnalise(nivelEst(t,'analise'));}

/* Quanto a estrutura deste clube mexe na evolução de um jogador, comparada
   com a estrutura padrão (tudo em 3). Vale para quem ainda cresce; para o
   veterano em declínio o número que importa é o do centro de performance. */
function impactoEvolucao(t,p,alvos){
  const lista=alvos&&alvos.length?alvos:['mira','util','visao','clutch'];
  const m=lista.reduce((s,k)=>s+fatorEvolucaoAtributo(t,k),0)/lista.length;
  return efCTRel(nivelEst(t,'treino'))*m;
}
/* Índice de 1 a 5 para comparar clubes: média ponderada pelo custo, para o
   CT pesar mais que a sala de bem-estar. */
function indiceEstrutura(t){
  let s=0,w=0;
  for(const d of DEPTOS){s+=nivelEst(t,d.id)*d.custo;w+=d.custo;}
  return w?s/w:EST_NEUTRO;
}

/* ---------- obra e renovação ---------- */
function podeMelhorar(t,k){
  const d=deptoDe(k);
  if(!d)return{ok:false,erro:'Departamento desconhecido.'};
  const n=nivelEst(t,k);
  if(n>=ESTRUTURA_MAX)return{ok:false,erro:'Nível máximo.'};
  const custo=custoObra(k,n);
  if(t.caixa<custo)return{ok:false,erro:'Caixa insuficiente: '+money(custo)+' necessários.',custo};
  return{ok:true,custo};
}
function melhorarEstrutura(t,k){
  const r=podeMelhorar(t,k);
  if(!r.ok)return r;
  t.caixa-=r.custo;
  t.estrutura[k]=nivelEst(t,k)+1;
  if(k==='equip'){garantirEstrutura(t);t.estruturaIdade.equip=0;}
  if(typeof registrarGasto==='function')registrarGasto(t,'estrutura',r.custo);
  return{ok:true,custo:r.custo,nivel:t.estrutura[k],depto:deptoDe(k)};
}
function renovarEquipamento(t){
  garantirEstrutura(t);
  const c=custoRenovacao(t);
  if(!t.estruturaIdade.equip)return{ok:false,erro:'O equipamento acabou de ser trocado.'};
  if(t.caixa<c)return{ok:false,erro:'Caixa insuficiente: '+money(c)+' necessários.'};
  t.caixa-=c;t.estruturaIdade.equip=0;
  if(typeof registrarGasto==='function')registrarGasto(t,'estrutura',c);
  return{ok:true,custo:c};
}
/* Virada de temporada: o equipamento envelhece. Quem não renova perde um
   nível ao completar EQUIP_VIDA temporadas — o PC de ponta de três anos
   atrás é o PC comum de hoje. A IA renova quando o caixa deixa. */
function envelhecerEstrutura(){
  for(const id in G.times){
    const t=G.times[id];
    garantirEstrutura(t);
    const idade=++t.estruturaIdade.equip;
    const n=nivelEst(t,'equip');
    if(id!==G.meuTime&&idade>=EQUIP_VIDA-1&&n>1&&t.caixa-custoRenovacao(t)>=reservaMinima(t)){
      t.caixa-=custoRenovacao(t);t.estruturaIdade.equip=0;continue;
    }
    if(idade>=EQUIP_VIDA){
      t.estruturaIdade.equip=0;
      if(n>1){
        t.estrutura.equip=n-1;
        if(id===G.meuTime&&typeof noticia==='function')
          noticia('Os equipamentos do clube ficaram defasados e caíram para o nível '+(n-1)+'. Renove na aba Estrutura para não perder outro.',{c:'clube',t:[t.id]});
      }
    }else if(id===G.meuTime&&idade===EQUIP_VIDA-1&&n>1&&typeof noticia==='function'){
      noticia('Os equipamentos completam '+idade+' temporadas: sem renovação, caem um nível na próxima virada.',{c:'clube',t:[t.id]});
    }
  }
}

/* ---------- Cálculos de jogador ---------- */
function over(p){
  const w=ROLE_W[p.role];let t=0;
  for(const k in w)t+=p.at[k]*w[k];
  return Math.round(t);
}
function ovClass(o){return o>=85?'a':o>=78?'b':o>=70?'c':o>=62?'d':'e';}
function valor(p){
  const o=over(p),a=p.idade;
  let v=Math.pow(Math.max(PISO_SALARIO_JOGADOR+4,o)-PISO_SALARIO_JOGADOR,2.6)*38;
  /* O valor de mercado precisava de degraus acima dos 30, senão um jogador de
     31 e um de 40 valiam o mesmo e a IA comprava veterano como se fosse aposta
     de futuro. */
  v*= a<=20?1.45:a<=22?1.30:a<=26?1.12:a<=28?.80:a<=30?.52
     :a<=33?.34:a<=36?.20:a<=39?.11:.05;
  v*= 1+Math.max(0,p.pot-o)/95;
  v*= .9+p.forma*.2;
  return Math.round(v/500)*500;
}
/* Com o clube, o salário sai na régua da divisão dele: o Tier 1 paga pelo
   índice salarial do circuito (economia.js), que sobe quando os clubes de cima
   acumulam dinheiro sem ter onde gastar. Sem clube, é o salário de referência. */
function salario(p,t,explicado){
  const o=over(p);
  let s=Math.pow(Math.max(PISO_SALARIO_JOGADOR+4,o)-PISO_SALARIO_JOGADOR,2.1)*K_SALARIO_JOGADOR;
  if(p.idade<=20)s*=.72;
  if(t&&typeof indiceSalarial==='function')s*=indiceSalarial(t.tier);
  /* o que depende do clube e do momento: quem chama com `explicado` mostra
     cada fator numa linha própria (detalharPedido, pedidoRenovacao) */
  if(t&&!explicado){
    if(typeof fatorRiqueza==='function')s*=fatorRiqueza(t);
    s*=descontoSemClube(p);
  }
  /* piso de 100: garoto fraco, sem clube há meses, em clube com desconto,
     arredondava para zero, e salário zero quebra empréstimo e folha */
  return Math.max(100,Math.round(s/100)*100);
}
/* Quem está sem clube há meses baixa o pedido. Sem isto o veterano de 84 que
   não renovou ficava no mercado pedindo o salário cheio e ninguém pagava: em
   vinte temporadas, metade dos agentes livres tinha over 84 ou mais enquanto o
   pior titular do Tier 1 tinha 75. */
const DESCONTO_LIVRE_SEMANA=0.008, DESCONTO_LIVRE_MAX=0.4;
function descontoSemClube(p){
  if(!p||p.timeId||!p.semLivre)return 1;
  return 1-Math.min(DESCONTO_LIVRE_MAX,p.semLivre*DESCONTO_LIVRE_SEMANA);
}
/* Nick com sotaque (data/nicks.js): metade das vezes uma palavra inteira do
   grupo do país, metade um pedaço + um final; às vezes um número. Repetido
   ganha número; sem grupo, cai no banco genérico abaixo. */
function nickDoPais(pais,usados){
  const g=typeof NICKS!=='undefined'&&typeof NICK_PAIS!=='undefined'&&NICKS[NICK_PAIS[pais]];
  if(!g)return null;
  for(let i=0;i<60;i++){
    let n=rnd()<0.5?pick(g.palavras):pick(g.pre)+pick(g.suf);
    if(rnd()<(g.num||0.12)||i>30)n+=ri(1,99);
    n=g.caixa==='alta'&&rnd()<0.45?n.toUpperCase():g.caixa==='baixa'&&rnd()<0.5?n.toLowerCase():n[0].toUpperCase()+n.slice(1);
    if(!usados.has(n)){usados.add(n);return n;}
  }
  return null;
}
function nomeUnico(usados,pais){
  const regional=pais?nickDoPais(pais,usados):null;
  if(regional)return regional;
  for(let i=0;i<400;i++){
    let n=pick(NS1)+(rnd()<.55?pick(NS2):'');
    if(rnd()<.18)n+=ri(0,99);
    n=n[0].toUpperCase()+n.slice(1);
    if(!usados.has(n)){usados.add(n);return n;}
  }
  return 'Player'+ri(1000,9999);
}
/* Quanto o perfil da função afasta os atributos da média do jogador.

   Antes todos nasciam em gauss(alvo,7) e só depois os atributos-chave eram
   puxados para o over bater. O resultado era gente quase uniforme: um
   Controlador tinha mira parecida com a de um Duelista, e por isso QUALQUER
   função servia como secundária — 100% do mundo tinha uma. Função sem perfil
   é rótulo, não característica.

   Agora o atributo que a função IGNORA nasce abaixo da média. Repare que a
   escultura é só para baixo, e isso é deliberado: o laço logo abaixo empurra
   os atributos-chave até o over bater o alvo, então subir os dois lados fazia
   o ajuste desfazer metade do trabalho e o perfil saía achatado de novo.
   Cavando só os atributos que a função não usa, a normalização é obrigada a
   levantar os que ela usa — e o contraste aparece nas duas pontas.

   O over final continua sendo o alvo pedido. O que muda é o formato, e é o
   formato que decide quem consegue jogar onde. */
const PERFIL_FUNCAO=30;
function makePlayer(alvo,role,pais,idade,usados,tier){
  const at={};
  const w=ROLE_W[role];
  const wMax=Math.max(...Object.values(w));
  for(const[k]of ATTRS){
    const rel=(w[k]||0)/wMax;
    at[k]=clamp(Math.round(gauss(alvo-(1-rel)*PERFIL_FUNCAO,6)),25,99);
  }
  // puxa os atributos-chave do papel pra cima para o "over" bater no alvo
  for(let it=0;it<14;it++){
    const cur=(()=>{let t=0;for(const k in w)t+=at[k]*w[k];return t;})();
    const d=alvo-cur; if(Math.abs(d)<.6)break;
    for(const k in w)at[k]=clamp(at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS)at[k]=clamp(Math.round(at[k]),25,99);
  at.lider=clamp(Math.round(gauss(alvo-8,13)),20,99);
  const p={
    id:'p'+(G.seqP++), nome:nomeUnico(usados,pais), pais, role, at, idade, genero:'m',
    pot:0, contrato:ri(1,3), salario:0, moral:ri(60,85)/100, forma:ri(45,75)/100,
    fadiga:ri(0,15)/100, timeId:null, agentes:sortearAgentes(role), agenteNivel:null,
    hist:[], temp:novaTemp(), carreira:{maps:0,k:0,d:0,a:0,acs:0,mvp:0,titulos:0,intl:0},
    lesao:0, igl:false, role2:null, roleAtual:role,
    mapas:afinidadeInicial()
  };
  const o=over(p);
  /* tier vem de quem chama; agente livre e promessa sem clube contam como
     Tier 2, que é a divisão com espaço para crescer */
  p.pot=potencialDe(o,idade,tier||2);
  p.pico=o;
  /* familiaridade com os agentes dele, semeada aqui e nunca no render */
  if(typeof semearAgentes==='function')semearAgentes(p);
  ajustarSecundaria(p);
  p.salario=salario(p);
  p.valor=valor(p);
  return p;
}
function novaTemp(){return{maps:0,k:0,d:0,a:0,acs:0,fk:0,cl:0,mvp:0};}

/* reescala os atributos para atingir um over alvo, preservando o perfil da função */
function aplicarOver(p,alvo){
  const w=ROLE_W[p.role];
  for(let it=0;it<24;it++){
    let cur=0;for(const k in w)cur+=p.at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.4)break;
    for(const k in w)p.at[k]=clamp(p.at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS)p.at[k]=clamp(Math.round(p.at[k]),25,99);
  const principal=Object.keys(w).sort((a,b)=>w[b]-w[a]);
  for(let i=0;i<16&&over(p)!==alvo;i++){
    const k=principal[i%principal.length];
    p.at[k]=clamp(p.at[k]+(over(p)<alvo?1:-1),25,99);
  }
  p.pot=Math.max(p.pot,over(p));p.valor=valor(p);p.salario=salario(p);
  ajustarSecundaria(p);
}

/* ---------- funções secundária e efetiva ----------
   O over já é uma média dos atributos ponderada pela função. Isso significa
   que "quanto custa jogar fora de posição" não precisa de tabela nova: é a
   diferença entre o over na função de origem e o over na função pedida.

   E resolve de graça a regra que o Gabriel pediu: um jogador de mira ruim
   nunca vira Duelista, porque Duelista pesa mira .30 e reflexo .24, então o
   over dele nessa função desaba e ele não passa no teto de custo. Sem lista
   de exceções, sem número mágico por função. */
function overComo(p,role){
  const w=ROLE_W[role]||ROLE_W[p.role];
  let t=0;for(const k in w)t+=p.at[k]*w[k];
  return Math.round(t);
}
/* Quanto o jogador perde ao atuar nessa função. Negativo significa que ele
   seria MELHOR ali do que na função de origem — acontece, e é uma dica de que
   a função principal está mal atribuída. */
function custoDeFuncao(p,role){return over(p)-overComo(p,role);}

/* Teto de perda para uma função entrar como secundária. Seis pontos é pouco o
   bastante para exigir perfil de verdade e folgado o bastante para um Flex ou
   um Iniciador com boa mira alcançarem o Duelista. */
const CUSTO_MAX_SECUNDARIA=6;
function funcoesElegiveis(p){
  return ROLES.filter(r=>r!==p.role&&custoDeFuncao(p,r)<=CUSTO_MAX_SECUNDARIA);
}
/* A melhor secundária possível, ou null quando o jogador é especialista puro —
   e ficar sem secundária é um resultado legítimo, não uma falha. */
function melhorSecundaria(p){
  const el=funcoesElegiveis(p);
  if(!el.length)return null;
  return el.sort((a,b)=>custoDeFuncao(p,a)-custoDeFuncao(p,b))[0];
}
/* Recalcula a secundária depois de mexer em atributos ou na função principal.
   Mantém a escolha atual se ela continuar válida, para que treinar um pouco de
   mira não fique trocando a segunda função do jogador toda semana. */
function ajustarSecundaria(p){
  if(p.role2===p.role)p.role2=null;
  if(p.role2&&custoDeFuncao(p,p.role2)<=CUSTO_MAX_SECUNDARIA)return p.role2;
  p.role2=melhorSecundaria(p);
  return p.role2;
}
/* Todas as funções que o jogador cobre. Flex continua sendo coringa: é o que
   a função significa, e o resto do motor já contava com isso. */
function funcoesDe(p){
  if(p.role==='Flex')return ROLES.filter(r=>r!=='Flex');
  const out=[p.role];
  if(p.role2&&p.role2!==p.role)out.push(p.role2);
  return out;
}
function cobre(p,role){return p.role==='Flex'||p.role===role||p.role2===role;}

/* ---------- Geração do mundo ---------- */
function criarMundo(seedVal){
  srand(seedVal);
  G={seed:seedVal,seqP:1,ano:2027,times:{},jogadores:{},livres:[],regioes:{},h2h:{},manager:null,
     meuTime:null,caixa:0,log:[],historico:[],bloco:0,fase:'',temporadaFim:false,
     mapasAtivos:poolInicial(),mapaDesde:{},janela:true,noticias:[],negociacoes:[],transferencias:[],
     meta:(typeof metaInicial==='function'?metaInicial():{}),patches:[],patchFeito:{}};
  montarTorneios();montarAgentes();montarMarcas();montarCidades();
  const usadosT=new Set(), usadosP=new Set();
  /* Reserva de saída TODOS os nicks reais antes de gerar qualquer jogador.
     Sem isso, nomeUnico() só conhece os nicks já inseridos, e um reserva
     gerado para um time de Americas podia nascer com um nick que só ia
     aparecer de verdade num time da China — dois jogadores com o mesmo nome
     na base. */
  if(typeof ELENCOS_REAIS!=='undefined')
    for(const tag in ELENCOS_REAIS)
      for(const linha of ELENCOS_REAIS[tag])usadosP.add(linha[0]);
  let ti=1;
  for(const R of REGIONS){
    /* R.t2 vem de data/mundo.js com o NOME da liga de Challengers, e a linha
       abaixo o substitui pela lista de ids dos times. O nome era destruído e a
       interface passava a mostrar "t14,t16,t18…" no lugar de "Challengers
       Americas". Guardado antes de sobrescrever. */
    G.regioes[R.id]={...R,nomeT2:R.t2,t1:[],t2:[],pontos:{}};
    for(const tier of [1,2]){
      const qtd = tier===1?12:8;
      const reais = TIMES_REAIS[R.id][tier===1?'t1':'t2'];
      for(let i=0;i<qtd;i++){
        let nome,tag,prest;
        if(reais&&reais[i]){
          [nome,tag,prest]=reais[i];
          /* Tier 1 mantém o prestígio calibrado pelo aproveitamento real. No
             Tier 2 todo mundo começa igual: os títulos de Challengers não são
             relevantes o bastante para hierarquizar a divisão, e o que
             diferencia um clube de Challengers do outro é a torcida, não a
             reputação herdada. */
          prest = tier===1 ? clamp(Math.round(prest+gauss(0,1.5)),35,92) : PRESTIGIO_T2;
        }
        else{
          do{ nome = rnd()<.35 ? pick(TN1) : pick(TN1)+' '+pick(TN2); }while(usadosT.has(nome));
          tag = nome.replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,3);
          prest = tier===1 ? ri(60,88) : PRESTIGIO_T2;
        }
        usadosT.add(nome);
        const t={
          /* tierInicial é a divisão de origem do clube e nunca muda. Serve
             para separar quem é de Challengers de nascença de quem caiu do
             Tier 1 — sem isso não dá para dizer nada sobre "o prestígio do
             Tier 2", porque a divisão vai se enchendo de rebaixados. */
          id:'t'+(ti++), nome, tag, regiao:R.id, tier, tierInicial:tier, prestigio:prest,
          /* Tier 2 recebeu mais patrocínio junto com a régua de over. Não é
             generosidade: uma liga cujos jogadores são 69–80 não é a mesma
             liga amadora de over 48 para a qual esses números foram ajustados.
             Com o valor antigo a folha de Challengers comia 92% da receita e
             a divisão inteira quebrava em três temporadas. */
          caixa: caixaInicialDe(tier,prest), patroc: 0,
          elenco:[], titulares:[], igl:null, sinergia:ri(35,70),
          staff:{tecnico:clamp(Math.round(prest/18),1,5),analista:clamp(Math.round(prest/20),1,5),mental:clamp(Math.round(prest/22),1,5)},
          estrutura:estruturaInicial(prest), estruturaIdade:{equip:0},
          tatica:{agres:3,foco:'default',scrim:3,treino:'mira'},
          torcida:0, patrocinios:{master:null,secundario:null,fornecedor:null},
          legado:0, vices:0,
          pais:(typeof CLUBES_BASE!=='undefined'&&CLUBES_BASE&&CLUBES_BASE[tag]
                &&CLUBES_BASE[tag].pais)||null,
          mapPref:{}, temporada:{v:0,d:0,mv:0,md:0,pts:0}, titulos:[],
          treino:{mapa:null,individual:{}}, comps:{}
        };
        for(const m of MAP_POOL)t.mapPref[m]=Math.round(gauss(0,4));
        /* elenco real, quando existir para a tag */
        const reaisEl=(typeof ELENCOS_REAIS!=='undefined'&&t.tag!=='LIVRE'
                       &&ELENCOS_REAIS[t.tag])||null;
        if(reaisEl){
          t.elencoReal=true;
          /* As linhas de ELENCOS_REAIS são progressivas: só o nick é obrigatório.
             Função, over, idade e país que faltarem são preenchidos como se o
             jogador fosse gerado — assim um roster real pode entrar no jogo sem
             que ninguém invente número, e ir sendo refinado no Editor. */
          const cobertos=new Set(reaisEl.map(r=>r[1]).filter(Boolean));
          /* Quem veio só com o nick não pode nascer melhor que o melhor
             jogador com over escrito no arquivo. Sem esse teto, um nome sem
             dado nenhum virava o astro do time por sorteio, passando por
             cima do número que foi ajustado à mão. */
          const dados=reaisEl.map(r=>r[2]).filter(v=>typeof v==='number');
          const tetoSemDado=dados.length?Math.max(...dados):FAIXAS.jogador[tier][1];
          for(const[nick,roleDado,ovDado,idadeDada,paisDado]of reaisEl){
            const role=roleDado||ROLES.find(r=>!cobertos.has(r))||pick(ROLES);
            if(!roleDado)cobertos.add(role);
            const idade=idadeDada||ri(19,26);
            const pais=paisDado||pick(R.paises);
            /* Sem over no arquivo, o jogador nasce na régua da divisão.
               Com over no arquivo, o arquivo manda — é lá que ficam os
               ajustes feitos à mão no Editor. */
            const ov=ovDado||Math.min(tetoSemDado,overAlvo('jogador',tier,prest,3));
            const p=makePlayer(ov,role,pais,idade,usadosP,tier);
            aplicarOver(p,ov);
            p.nome=nick;usadosP.add(nick);
            /* marca quem carrega nome de pessoa real: rosto sintético
               fotorrealista ao lado de um nome real se lê como foto dela */
            p.real=true;
            /* País VEIO DO ARQUIVO, não foi sorteado. A distinção importa: sem
               ela, um nick sem país recebia um país da região e o clube passava
               a "ter sede" naquele país por acaso — dado inventado com cara de
               dado real. */
            if(paisDado)p.paisReal=true;
            if(ovDado){aplicarOver(p,ov);p.overFixo=true;}
            p.pot=potencialDe(over(p),idade,tier);
            p.salario=salario(p);p.valor=valor(p);p.contrato=ri(1,3);
            p.timeId=t.id;G.jogadores[p.id]=p;t.elenco.push(p.id);
          }
        }
        /* teto dos reservas gerados: nunca acima do titular real mais fraco,
           para que o line-up importado continue sendo o line-up */
        /* Reserva nunca acima do titular real mais fraco: o line-up importado
           tem de continuar sendo o line-up. O piso da divisão continua valendo,
           então em time forte a diferença entre titular e reserva é pequena. */
        const[pisoDiv]=FAIXAS.jogador[tier];
        let tetoReserva=FAIXAS.jogador[tier][1];
        if(reaisEl){
          const overs=reaisEl.map(r=>r[2]).filter(v=>typeof v==='number');
          if(overs.length)tetoReserva=Math.max(pisoDiv,Math.min(...overs)-2);
        }
        const roles=['Duelista','Iniciador','Controlador','Sentinela','Flex','Duelista','Iniciador'];
        /* Até o MÍNIMO, não até sete. Antes o mundo nascia com todo clube em
           sete e dois deles eram inventados: um roster real de cinco entrava
           no jogo com dois nomes que não existem, e o elenco que você abria na
           primeira semana não era o elenco de verdade. Quem tem cinco começa
           com cinco; o banco se monta no mercado, como na vida. */
        const alvoElenco=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
        for(let j=t.elenco.length;j<alvoElenco;j++){
          const alvo=clamp(overAlvo('jogador',tier,prest,3,4),pisoDiv,tetoReserva);
          const idade = j>=5 && rnd()<.5 ? ri(16,20) : ri(18,29);
          const p=makePlayer(alvo,roles[j],pick(R.paises),idade,usadosP,tier);
          /* makePlayer aproxima o alvo mexendo em atributos inteiros e pode
             errar por 1. Sem este ajuste a faixa da divisão vaza — o Tier 2
             aparecia com 68 e 81 numa régua que promete 69–80. */
          aplicarOver(p,alvo);p.pot=potencialDe(alvo,idade,tier);
          p.timeId=t.id; G.jogadores[p.id]=p; t.elenco.push(p.id);
        }
        autoEscalar(t);
        t.torcida=torcidaInicial(t);
        G.times[t.id]=t;
        G.regioes[R.id][tier===1?'t1':'t2'].push(t.id);
      }
    }
  }
  /* Reais sem clube, se o elencos.js trouxer a chave LIVRE. Vêm antes dos
     gerados para que o nick real nunca perca a vaga para um sorteado. */
  if(typeof ELENCOS_REAIS!=='undefined'&&ELENCOS_REAIS.LIVRE){
    for(const[nick,roleDado,ovDado,idadeDada,paisDado,potDado]of ELENCOS_REAIS.LIVRE){
      const R=pick(REGIONS);
      const role=roleDado||pick(ROLES);
      const idade=idadeDada||ri(19,28);
      const ov=ovDado||overAlvo('jogador',2,ri(45,58),3);
      const p=makePlayer(ov,role,paisDado||pick(R.paises),idade,usadosP,ovDado>=FAIXAS.jogador[1][0]?1:2);
      p.nome=nick;usadosP.add(nick);p.real=true;
      if(paisDado)p.paisReal=true;
      aplicarOver(p,ov);if(ovDado)p.overFixo=true;
      /* potencial escrito no arquivo manda: é o que separa a promessa do
         veterano com o mesmo over */
      if(potDado){p.pot=clamp(potDado,over(p),99);p.potFixo=true;}
      p.contrato=0;p.regiaoOrigem=R.id;p.salario=salario(p);p.valor=valor(p);
      G.jogadores[p.id]=p;G.livres.push(p.id);
    }
  }
  // agentes livres
  for(let i=0;i<70;i++){
    const R=pick(REGIONS);
    /* O mercado tem de conversar com as duas divisões: a maioria serve ao
       Tier 2, uma minoria é opção real para o Tier 1. Sem isso o Tier 1
       fica sem nenhum reforço possível e o mercado morre. */
    /* gerado sem clube é promessa: over baixo, idade de base, potencial do
       Tier 2 — ver overLivreGerado() */
    const alvo=overLivreGerado();
    const p=makePlayer(alvo,pick(ROLES),pick(R.paises),ri(16,20),usadosP,2);
    aplicarOver(p,alvo);p.pot=potencialDe(alvo,p.idade,2);
    p.contrato=0;p.regiaoOrigem=R.id;G.jogadores[p.id]=p;G.livres.push(p.id);
  }
  /* país de sede congelado agora, com o elenco real ainda inteiro: é dele que
     saem os garotos da base e as marcas nacionais (ver paisDoClube) */
  for(const id in G.times){const t=G.times[id];if(!t.pais&&!t.paisSede)t.paisSede=paisDoClube(t)||null;}
  /* a comissão precisa de todos os times já criados para semear por prestígio */
  montarStaff();
  /* patrocínio por último: quem escolhe primeiro é o clube mais atraente, e
     atratividade depende de torcida, que depende de todos os clubes existirem */
  /* história antes do patrocínio: a torcida herdada de quem já foi campeão
     muda a atratividade, e é a atratividade que decide quem escolhe marca
     primeiro */
  semearHistoria();
  atribuirPatrocinios();
  for(const id in G.times)G.times[id].patroc=receitaCaixa(G.times[id]);
  /* entrosamento por dupla, semeado do número do clube (core/vestiario.js) */
  if(typeof semearDuplas==='function')for(const id in G.times)semearDuplas(G.times[id]);
  return G;
}

/* ============================================================
   AFINIDADE DE MAPA POR JOGADOR
   ------------------------------------------------------------
   Até aqui só o TIME tinha preferência de mapa, o que é meio
   time: no cenário real quem gosta de Icebox é um jogador, e é a
   soma dos cinco que faz o clube ser bom lá.

   A afinidade nasce sorteada — não existe dado real de mapa por
   jogador, e inventar um número "informado" seria pior que
   assumir o sorteio — e depois EVOLUI: quem vai bem num mapa
   passa a ir melhor nele, quem apanha vai piorando. Em algumas
   temporadas cada jogador tem um perfil de mapa que ele mesmo
   construiu jogando.
   ============================================================ */

const AFIN_MIN=-8, AFIN_MAX=8;
/* Quantos mapas cada jogador tem opinião forte sobre. O resto fica perto de
   zero: um jogador que ama ou odeia doze mapas não tem identidade nenhuma. */
const AFIN_FORTES=3;
/* Quanto um mapa se move por partida. Pequeno de propósito: perfil de mapa é
   coisa de temporada, não de jogo. */
const AFIN_PASSO=0.55;
const AFIN_PASSO_MAX=1.6;

function afinidadeInicial(){
  const m={};
  const pool=shuffle(MAP_POOL.slice());
  pool.forEach((mapa,i)=>{
    /* os primeiros da lista embaralhada ganham opinião forte, positiva ou
       negativa; os demais ficam num ruído baixo */
    m[mapa]= i<AFIN_FORTES ? clamp(Math.round(gauss(0,1)*0+ (rnd()<0.5?-1:1)*ri(4,8)),AFIN_MIN,AFIN_MAX)
                           : clamp(Math.round(gauss(0,1.6)),AFIN_MIN,AFIN_MAX);
  });
  return m;
}
function afinidadeDe(p,mapa){
  if(!p)return 0;
  if(!p.mapas)p.mapas=afinidadeInicial();
  const v=p.mapas[mapa];
  return typeof v==='number'?v:0;
}
/* Média dos titulares. É o que entra na força do time — um jogador que adora o
   mapa não salva os outros quatro, mas inclina. */
function afinidadeElenco(t,mapa){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(!tit.length)return 0;
  return tit.reduce((s,p)=>s+afinidadeDe(p,mapa),0)/tit.length;
}
/* Os mapas em que o jogador é melhor e pior, para a ficha. */
function mapasDe(p){
  return MAP_POOL.map(m=>({mapa:m,v:afinidadeDe(p,m)}))
                 .sort((a,b)=>b.v-a.v);
}

/* ---------- evolução ----------
   O jogador melhora no mapa em que foi bem e piora naquele em que apanhou. A
   régua é o DESEMPENHO DELE MESMO nessa partida contra o que ele costuma
   render — comparar com a média da liga puniria quem é ruim por ser ruim, e a
   afinidade deixaria de falar sobre o mapa. */
function evoluirAfinidade(p,mapa,acsNoMapa){
  if(!p||!mapa)return 0;
  if(!p.mapas)p.mapas=afinidadeInicial();
  const media=p.temp&&p.temp.maps?p.temp.acs/p.temp.maps:acsNoMapa;
  if(!media)return 0;
  const rel=(acsNoMapa-media)/Math.max(40,media);   /* fração acima/abaixo de si */
  const passo=clamp(rel*AFIN_PASSO*4,-AFIN_PASSO_MAX,AFIN_PASSO_MAX);
  const antes=p.mapas[mapa]||0;
  p.mapas[mapa]=clamp(antes+passo,AFIN_MIN,AFIN_MAX);
  return p.mapas[mapa]-antes;
}

/* ============================================================
   ROTAÇÃO DO POOL ATIVO
   ------------------------------------------------------------
   O pool tem doze mapas, mas só sete entram em jogo por vez —
   é assim na VCT, e é isso que torna treinar mapa uma decisão:
   com doze para manter de pé, ninguém domina nenhum.

   A rotação acontece três vezes por temporada, depois de cada
   Masters e depois do Champions, que é quando a Riot mexe de
   verdade. Dois mapas saem, dois entram.

   Afinidade de mapa fora de rotação NÃO é apagada: você sabia
   jogar Split, e vai continuar sabendo quando ele voltar. O que
   ela faz é escorregar devagar sem uso — ver evoluirAfinidade e
   esquecerMapas.
   ============================================================ */
/* Oito, como o pool competitivo real de 2026. */
const MAPAS_ATIVOS=8;
const ROTACAO_TROCA=2;          /* quantos entram e saem por rotação */

function poolInicial(){
  /* O pool real de 2026 (POOL_2026 em data/mundo.js, tirado das estatísticas
     de mapa das três ligas no vlr.gg). A rotação assume dali em diante, e o
     pool continua editável no Banco de dados como o resto da base. */
  const real=(typeof POOL_2026!=='undefined'?POOL_2026:[]).filter(m=>MAP_POOL.includes(m));
  if(real.length===MAPAS_ATIVOS)return real.slice();
  return MAP_POOL.slice(0,MAPAS_ATIVOS);
}
/* Vitória do ataque no mapa, em pontos de força. O dado é real (MAPA_ATK) e a
   conversão é a inversa da logística do round: dif = 26·ln(p/(1-p)). Em Abyss
   (55% ATK) isso dá +1,3 para quem ataca; em Ascent (47%) dá −0,8. */
function viesLado(mapa,lado){
  const atk=(typeof MAPA_ATK!=='undefined'&&MAPA_ATK[mapa])||50;
  const p=clamp(atk/100,0.2,0.8);
  const dif=26*Math.log(p/(1-p));
  return lado==='atk'?dif/2:-dif/2;
}
function mapaAtivo(m){return (G.mapasAtivos||MAP_POOL).includes(m);}
/* Roda a rotação. `motivo` entra na notícia para o jogador saber por que o
   pool mudou — sem isso o mapa que ele treinou seis semanas simplesmente
   desaparece da tela. */
function rotacionarMapas(motivo){
  const ativos=(G.mapasAtivos||poolInicial()).slice();
  const fora=MAP_POOL.filter(m=>!ativos.includes(m));
  if(!fora.length)return null;
  const quantos=Math.min(ROTACAO_TROCA,fora.length,Math.max(0,ativos.length-3));
  if(quantos<=0)return null;
  /* Sai quem está há mais tempo em rotação: guardar desde quando cada mapa
     entrou evita que o mesmo mapa saia duas vezes seguidas por azar. */
  G.mapaDesde=G.mapaDesde||{};
  ativos.forEach(m=>{if(G.mapaDesde[m]==null)G.mapaDesde[m]=0;});
  const saem=ativos.slice().sort((a,b)=>(G.mapaDesde[a]||0)-(G.mapaDesde[b]||0))
    .slice(0,quantos);
  const entram=shuffle(fora.slice()).slice(0,quantos);
  const novos=ativos.filter(m=>!saem.includes(m)).concat(entram);
  G.mapasAtivos=novos;
  const marca=(G.ano||0)*100+(G.semana||0);
  entram.forEach(m=>{G.mapaDesde[m]=marca;});
  saem.forEach(m=>{delete G.mapaDesde[m];});
  if(typeof noticia==='function')
    noticia('🗺 Rotação de mapas'+(motivo?' ('+motivo+')':'')+': entram '+entram.join(' e ')+
            ', saem '+saem.join(' e ')+'.',{c:'meta',imp:2});
  /* Todo clube que estava treinando um mapa que acabou de sair precisa saber
     agora, e não descobrir seis semanas depois que treinou o vazio. */
  if(typeof limparPlano==='function')
    for(const id in G.times)limparPlano(G.times[id]);
  return{entram,saem};
}
/* Mapa que ninguém treina nem joga escorrega para o meio. É o que impede o
   clube de ser bom em doze mapas ao mesmo tempo, e é o que dá conteúdo ao
   veto: todo time tem mapa que não quer jogar. */
/* Mede-se pelo par: com 0,06 contra treino de 0,9 o abandono não aparecia.
   Em uma temporada isto tira ~5 pontos de um mapa esquecido — o bastante para
   o clube ter mapa que ele não quer jogar, que é o que dá conteúdo ao veto. */
const AFIN_ESQUECE=0.10;
/* Semana sem mapa escolhido não é semana parada: o elenco scrimma de qualquer
   jeito, só sem direção. Medido: com o esquecimento cheio nas semanas sem
   escolha, o clube que nunca abre a tela de Treino ia de um leque de 4,0 pontos
   entre o melhor e o pior mapa para 1,0 em 42 semanas — a identidade de mapa
   desaparecia inteira e o veto virava sorteio. Meia dose deixa a escolha
   valendo sem apagar o sistema de quem não escolheu. */
const AFIN_ESQUECE_SEM_PLANO=0.045;
/* Média sustentável do pool ativo. Sem um teto na MÉDIA, o treino de mapa era
   ganho líquido toda semana: o clube subia o pool inteiro e acabava bom em
   tudo. O puxão desconta o excesso de TODOS os mapas por igual, então ele
   derruba o nível e preserva o leque — especializar continua valendo, acumular
   não. */
const AFIN_MEDIA_TETO=1.2;
const AFIN_PUXAO=0.30;
function normalizarPool(t){
  if(!t)return;
  const pool=(G.mapasAtivos||MAP_POOL);
  if(!pool.length)return;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.mapas)continue;
    let soma=0;
    for(const m of pool)soma+=p.mapas[m]||0;
    const excesso=soma/pool.length-AFIN_MEDIA_TETO;
    if(excesso<=0)continue;
    const desconto=excesso*AFIN_PUXAO;
    for(const m of pool)p.mapas[m]=clamp((p.mapas[m]||0)-desconto,AFIN_MIN,AFIN_MAX);
  }
}
function esquecerMapas(t,pouparMapa){
  if(!t)return;
  /* aceita um mapa ou a lista dos mapas treinados na semana */
  const poupar=new Set(Array.isArray(pouparMapa)?pouparMapa:pouparMapa?[pouparMapa]:[]);
  const taxa=poupar.size?AFIN_ESQUECE:AFIN_ESQUECE_SEM_PLANO;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.mapas)continue;
    for(const m of MAP_POOL){
      if(poupar.has(m))continue;
      const v=p.mapas[m]||0;
      if(!v)continue;
      const passo=Math.min(taxa,Math.abs(v));
      p.mapas[m]=v>0?v-passo:v+passo;
    }
  }
}

/* ============================================================
   META DE AGENTES
   ------------------------------------------------------------
   O meta é a resposta a uma pergunta simples: quanto vale, HOJE,
   pegar aquele boneco? Ele não é opinião minha — a força inicial
   sai da taxa de escolha real das três ligas no Stage 2 de 2026
   (AGENT_PICK_2026, em data/mundo.js): Omen em 79% dos mapas,
   Neon 64%, Sova 56%, e a cauda toda abaixo de 20%.

   Depois disso o meta ANDA. Riot mexe no que está dominando, e é
   isso que o patch faz aqui: quem está no topo e sendo escolhido
   por todo mundo leva nerf, quem está esquecido leva buff. Quem
   montou o elenco em cima do boneco da moda paga a conta; quem
   tem gente que sabe jogar coisa fora do meta, de repente, tem
   um trunfo. É esse ciclo que faz "ir contra o meta" ser uma
   aposta e não um erro.
   ============================================================ */

/* 50 é neutro. A conversão da taxa de escolha para força é linear e a
   escala foi escolhida para o topo real (Omen, 79%) chegar perto de 80 e a
   cauda (Brimstone, 1%) ficar perto de 38 — quatro pontos de força de
   diferença entre um agente médio e o melhor do meta, que é o que o teste de
   decisão mostra valer uma escolha de verdade sem virar o jogo. */
const META_NEUTRO=50;
const META_MIN=30, META_MAX=88;
function forcaDaTaxa(pick){return clamp(Math.round(38+pick*0.53),META_MIN,META_MAX);}

/* Os nomes de todos os agentes do catálogo. Não confundir com todosAgentes()
   de torneios.js, que devolve {nome,role} para o Banco de dados — a primeira
   versão disto se chamava igual e a declaração de lá venceu a minha: o meta
   nascia com UMA chave, "[object Object]", e todo agente valia neutro. */
function nomesDeAgentes(){
  const vistos=new Set(),out=[];
  const cat=(typeof G!=='undefined'&&G&&G.agentes)?G.agentes:AGENTS;
  for(const f in cat)for(const a of cat[f])if(!vistos.has(a)){vistos.add(a);out.push(a);}
  return out;
}
/* Semeia o meta com o dado real. Agente que não aparece na tabela ficou
   abaixo de 1% nas três ligas — entra como esquecido, não como neutro. */
function metaInicial(){
  const tab=(typeof AGENT_PICK_2026!=='undefined')?AGENT_PICK_2026:{};
  const m={};
  for(const a of nomesDeAgentes())m[a]=forcaDaTaxa(tab[a]!==undefined?tab[a]:0.4);
  return m;
}
function forcaMeta(ag){
  if(!ag)return META_NEUTRO;
  const v=G.meta&&G.meta[ag];
  return typeof v==='number'?v:META_NEUTRO;
}
/* Quanto o agente está acima ou abaixo do meta neutro, em pontos de força de
   round. Um agente do topo vale cerca de +1,5 e um esquecido cerca de −1,0
   por jogador — cinco jogadores multiplicam isso. */
const META_PESO=0.05;
function pesoMeta(ag){return (forcaMeta(ag)-META_NEUTRO)*META_PESO;}

/* Rótulo para a tela: é isso que faz o jogador entender por que o boneco
   mudou de preço. */
function faixaMeta(ag){
  const v=forcaMeta(ag);
  if(v>=70)return{id:'topo',rot:'topo do meta'};
  if(v>=58)return{id:'forte',rot:'meta'};
  if(v>=45)return{id:'ok',rot:'jogável'};
  if(v>=38)return{id:'fraco',rot:'fora do meta'};
  return{id:'esq',rot:'esquecido'};
}
/* Os N melhores da função, pelo meta de hoje. É o que o preset Meta usa e o
   que o relatório de scouting espera do adversário. */
function topoDoMeta(role,n){
  const pool=(typeof agentesDe==='function'?agentesDe(role):(AGENTS[role]||[])).slice();
  return pool.sort((a,b)=>forcaMeta(b)-forcaMeta(a)).slice(0,n||3);
}

/* ---------- o patch ----------
   Quatro por ano. Nerfa quem está dominando e buffa quem ninguém pega, com a
   notícia dizendo o que mudou — a mudança só vira decisão se você souber.

   Quem "está dominando" é medido no mundo, não na tabela: conta em quantas
   comps de clube o agente aparece. Assim o meta responde ao que os clubes
   REALMENTE estão jogando, inclusive às suas próprias escolhas. */
/* Um patch NÃO é "tira do topo, dá para a cauda". Medido: com nerf de −7 e
   buff de +6, o desvio da força do meta caía de 11,0 para 2,9 em três anos —
   todo agente convergia para 50 e o meta simplesmente deixava de existir, o
   mesmo achatamento que a rotação de mapas tinha.

   Patch de verdade DESTRONA: quem dominava desce e alguém que ninguém pegava
   sobe para perto do topo. Por isso o buff não é um incremento, é um destino:
   o agente buffado vira o novo rei, ou quase. O desvio se mantém e a coroa
   troca de cabeça — que é o que faz o elenco precisar se adaptar. */
const PATCH_NERF=-9;
const PATCH_QUANTOS=2;
const PATCH_NOVO_REI=6;   /* o buffado chega a (topo − até isto) */
function usoNoMundo(){
  const conta={};
  for(const id in G.times){
    const t=G.times[id];
    for(const mapa in (t.comps||{}))
      for(const pid in t.comps[mapa]){
        const ag=t.comps[mapa][pid];
        if(ag)conta[ag]=(conta[ag]||0)+1;
      }
  }
  return conta;
}
function aplicarPatch(motivo){
  if(!G.meta)G.meta=metaInicial();
  const uso=usoNoMundo();
  const ags=nomesDeAgentes();
  /* nota de "está dominando": força no meta mais o uso real, normalizado */
  const maxUso=Math.max(1,...ags.map(a=>uso[a]||0));
  const nota=a=>forcaMeta(a)+((uso[a]||0)/maxUso)*18;
  const ordenados=ags.slice().sort((a,b)=>nota(b)-nota(a));
  const fortes=ordenados.slice(0,PATCH_QUANTOS);
  const topoAtual=Math.max(...ags.map(a=>forcaMeta(a)));
  /* O candidato a novo rei sai do TERÇO DE BAIXO, sorteado — se fosse sempre o
     último da lista, o ciclo do meta viraria uma fila previsível. */
  const cauda=ordenados.slice(Math.floor(ordenados.length*0.6))
    .filter(a=>!fortes.includes(a));
  const mudou=[];
  for(const a of fortes){
    const antes=G.meta[a];
    G.meta[a]=clamp(antes+PATCH_NERF,META_MIN,META_MAX);
    if(G.meta[a]!==antes)mudou.push({ag:a,de:antes,para:G.meta[a],tipo:'nerf'});
  }
  const sorteados=shuffle(cauda.slice()).slice(0,PATCH_QUANTOS);
  for(const a of sorteados){
    const antes=G.meta[a];
    G.meta[a]=clamp(Math.max(antes+4,topoAtual-ri(0,PATCH_NOVO_REI)),META_MIN,META_MAX);
    if(G.meta[a]!==antes)mudou.push({ag:a,de:antes,para:G.meta[a],tipo:'buff'});
  }
  G.patches=G.patches||[];
  G.patches.unshift({ano:G.ano,semana:G.semana,motivo:motivo||'',mudou});
  if(G.patches.length>40)G.patches.length=40;
  if(typeof noticia==='function'&&mudou.length){
    const nerf=mudou.filter(x=>x.tipo==='nerf').map(x=>x.ag);
    const buff=mudou.filter(x=>x.tipo==='buff').map(x=>x.ag);
    noticia('🩹 Patch: '+(nerf.length?nerf.join(' e ')+' levaram nerf':'')+
      (nerf.length&&buff.length?'; ':'')+
      (buff.length?buff.join(' e ')+' levaram buff':'')+'.',{c:'meta',imp:2});
  }
  /* Comp montada em cima de um boneco nerfado continua válida — a conta é o
     jogador descobrir que ela ficou pior. Nada é desmontado por baixo. */
  return mudou;
}
/* Semanas de patch: espalhadas pelo ano, longe da virada de temporada. */
const SEMANAS_PATCH=[8,20,33,45];
function patchDaSemana(){
  if(!SEMANAS_PATCH.includes(G.semana))return null;
  const chave=G.ano+'-'+G.semana;
  G.patchFeito=G.patchFeito||{};
  if(G.patchFeito[chave])return null;
  G.patchFeito[chave]=true;
  return aplicarPatch('rotina');
}

/* ============================================================
   A SEMANA DE TREINO
   ------------------------------------------------------------
   Até aqui o desenvolvimento vinha de um seletor que você marcava
   na primeira temporada e esquecia. Medindo (tools/decisoes.mjs),
   as cinco coisas que mais decidem uma partida — descanso, forma,
   posição, moral e comissão — eram todas coisas que você NÃO
   decidia. Este módulo é a resposta: o que o elenco faz na semana
   passa a ser seu, jogador por jogador.

   Duas camadas, como foi pedido:

   · INDIVIDUAL — cada jogador tem o próprio plano: um atributo,
     um agente para aprender, ou descanso.
   · MAPA — separado do individual, o time treina UM mapa da
     rotação por semana. É esse trabalho que dá conteúdo ao veto:
     banir bem só significa algo se o seu pool for construído.

   E o preço de tudo é a perna. Treinar cansa, descansar recupera,
   e cansaço é o maior fator isolado de derrota do jogo (+44 na
   medição). A decisão da semana é sempre a mesma pergunta: ganhar
   sábado, ou ganhar em setembro?
   ============================================================ */

const TREINO_TIPOS=[
  {id:'atributo', nome:'Atributo',  ajuda:'Concentra a evolução num atributo só.'},
  {id:'agente',   nome:'Agente',    ajuda:'Aprende um agente novo. Leva semanas.'},
  {id:'descanso', nome:'Descanso',  ajuda:'Recupera fadiga. Não evolui nada.'}
];
/* Quanto o plano individual mexe na fadiga da semana, além da recuperação
   normal. Treinar cansa; descansar é o único jeito de chegar inteiro numa
   série decisiva. */
/* Calibrado em duas passadas, e as duas foram medindo (tools/treino.mjs).

   Com 0,022 a fadiga dos dois clubes terminava a temporada em ZERO: a
   recuperação normal engolia o custo e "descansar ou treinar" não era decisão
   nenhuma. Com 0,075 foi para o outro extremo — cinco titulares em 100% de
   fadiga na semana 18, ou seja, treinar duas semanas seguidas passou a ser
   proibido.

   Instrumentando semana a semana, a conta apareceu: uma semana de TREINO soma
   1,4 ponto de fadiga; uma semana com JOGO soma de 8 a 22. Quem cansa é a
   partida — o treino só precisa custar o suficiente para o saldo não fechar
   sozinho. Com 0,020 a semana de treino é levemente negativa, o bloco de
   torneio empurra a fadiga para cima, e o descanso (−0,075, saldo de −0,11) é
   a única ferramenta que a limpa.

   A decisão que sobra é a certa: depois de um bloco pesado, gasto duas semanas
   descansando e perco desenvolvimento, ou entro no próximo torneio cansado? */
const FADIGA_TREINO=0.020;
const FADIGA_DESCANSO=-0.075;
/* Concentrar num atributo rende mais NAQUELE atributo do que espalhar — é o
   ponto de escolher. O total continua limitado pelo potencial. */
const FOCO_CONCENTRADO=2.1;
/* Aprender agente: por semana de plano individual, e o dobro disso quando o
   clube inteiro está no mesmo agente. */
/* Com 2,5 dava 35 semanas para chegar a 70 — uma temporada inteira num agente
   só, o que tornava correr atrás do meta impossível em vez de caro. */
const AGENTE_POR_SEMANA=6.0;
const AGENTE_POR_MAPA_JOGADO=0.6;
const AGENTE_ENFERRUJA=0.25;
/* Treino de mapa: quanto sobe por semana e onde o retorno começa a secar. */
/* Com 0,9 o mapa treinado terminava a temporada empatado com o abandonado: o
   sinal não passava do ruído das partidas. Em ~6 semanas um mapa agora sai do
   zero para perto do teto, que é o ritmo de um bloco de treino de verdade. */
const MAPA_POR_SEMANA=1.6;
const FADIGA_TREINO_MAPA=0.008;

function planoVazio(){return{mapa:null,individual:{}};}
function planoDe(t){
  if(!t)return planoVazio();
  if(!t.treino)t.treino=planoVazio();
  if(!t.treino.individual)t.treino.individual={};
  return t.treino;
}
function planoDoJogador(t,p){
  const pl=planoDe(t).individual[p.id];
  if(pl&&pl.tipo)return pl;
  /* Save antigo e clube sem plano caem no antigo seletor de time, para nada
     parar de funcionar enquanto o jogador não escolhe. */
  const antigo=(t.tatica&&t.tatica.treino)||'mira';
  return{tipo:'atributo',alvo:antigo==='utilidade'?'util':antigo==='tatica'?'visao'
    :antigo==='mental'?'clutch':'mira',herdado:true};
}
function definirPlano(t,jogadorId,tipo,alvo){
  const pl=planoDe(t);
  if(!tipo||!TREINO_TIPOS.some(x=>x.id===tipo)){delete pl.individual[jogadorId];return pl;}
  /* Alvo tem de existir. Sem esta guarda, um save mexido à mão criava nível de
     familiaridade para um agente que não está no catálogo — e o jogador
     ficava com um boneco fantasma na ficha. */
  if(tipo==='atributo'&&!ATTRS.some(a=>a[0]===alvo))return pl;
  if(tipo==='agente'&&!funcaoConhece(alvo))return pl;
  pl.individual[jogadorId]={tipo,alvo:tipo==='descanso'?null:alvo};
  return pl;
}
function funcaoConhece(ag){
  for(const f in AGENTS)if((AGENTS[f]||[]).includes(ag))return true;
  return false;
}
/* Tira do plano quem não está mais no elenco.
   Sem isto o plano crescia sem parar — doze entradas para nove jogadores — e
   um id reaproveitado herdaria o plano de quem foi vendido. */
function limparPlano(t){
  const pl=planoDe(t);
  const dentro=new Set(t.elenco||[]);
  for(const id in pl.individual)if(!dentro.has(id))delete pl.individual[id];
  /* mapa que saiu de rotação não treina nada: melhor avisar do que treinar o
     vazio em silêncio por seis semanas */
  const fora=mapasDoTreino(pl,true).filter(x=>!mapaAtivo(x.mapa));
  if(fora.length){
    definirMapasTreino(t,mapasDoTreino(pl,true).filter(x=>mapaAtivo(x.mapa)));
    if(t.id===G.meuTime&&typeof noticia==='function')
      noticia('🗺 '+fora.map(x=>x.mapa).join(' e ')+' saiu de rotação e deixou o treino de mapa da semana.',{c:'meta',t:[G.meuTime]});
  }
  return pl;
}
/* ---------- até três mapas por semana ----------
   Cada mapa do plano tem prioridade: alta, média ou baixa, e o trabalho da
   semana se divide nessa proporção (5 : 3 : 2 — com três mapas, 50/30/20).
   O ganho TOTAL cresce menos que o número de mapas: um mapa rende 1, dois
   rendem 1,15 e três 1,3. Espalhar mantém o pool; concentrar faz um mapa
   subir de verdade. O cansaço do treino de mapa acompanha o ganho total. */
const MAPAS_TREINO_MAX=3;
const PRIO_TREINO={alta:5,media:3,baixa:2};
const PRIO_NOME={alta:'alta',media:'média',baixa:'baixa'};
const GANHO_EXTRA_MAPA=0.15;
function fatorTreinoMapas(n){return n?1+GANHO_EXTRA_MAPA*(n-1):0;}
/* A lista de mapas do plano. Planos antigos têm só pl.mapa. */
function mapasDoTreino(pl,todos){
  let l=Array.isArray(pl.mapas)?pl.mapas:(pl.mapa?[{mapa:pl.mapa,prio:'alta'}]:[]);
  l=l.filter(x=>x&&x.mapa&&PRIO_TREINO[x.prio]);
  return todos?l:l.filter(x=>mapaAtivo(x.mapa));
}
function definirMapasTreino(t,lista){
  const pl=planoDe(t),vistos=new Set(),out=[];
  for(const x of lista||[]){
    if(!x||!x.mapa||vistos.has(x.mapa)||!mapaAtivo(x.mapa))continue;
    vistos.add(x.mapa);out.push({mapa:x.mapa,prio:PRIO_TREINO[x.prio]?x.prio:'media'});
    if(out.length>=MAPAS_TREINO_MAX)break;
  }
  pl.mapas=out;pl.mapa=out.length?out[0].mapa:null;
  return pl;
}
function definirMapaTreino(t,mapa){
  return definirMapasTreino(t,mapa?[{mapa,prio:'alta'}]:[]);
}
/* Clique num mapa da tela: entra (com a prioridade que falta) ou sai. */
function alternarMapaTreino(t,mapa){
  const l=mapasDoTreino(planoDe(t),true).slice();
  const i=l.findIndex(x=>x.mapa===mapa);
  if(i>=0)l.splice(i,1);
  else{
    if(l.length>=MAPAS_TREINO_MAX)return{ok:false,erro:'No máximo '+MAPAS_TREINO_MAX+' mapas por semana. Tire um antes.'};
    const usadas=new Set(l.map(x=>x.prio));
    l.push({mapa,prio:['alta','media','baixa'].find(p=>!usadas.has(p))||'baixa'});
  }
  definirMapasTreino(t,l);
  return{ok:true};
}
function definirPrioridadeMapa(t,mapa,prio){
  const l=mapasDoTreino(planoDe(t),true).map(x=>x.mapa===mapa?{mapa,prio}:x);
  definirMapasTreino(t,l);
  return{ok:true};
}
/* Quanto cada mapa recebe da semana: fração do ganho de um mapa só. */
function divisaoTreino(pl){
  const l=mapasDoTreino(pl);
  const soma=l.reduce((s,x)=>s+PRIO_TREINO[x.prio],0)||1;
  const total=fatorTreinoMapas(l.length);
  return l.map(x=>({mapa:x.mapa,prio:x.prio,frac:PRIO_TREINO[x.prio]/soma*total}));
}

/* ---------- familiaridade com agente ----------
   p.agentes continua sendo os mains. p.agenteNivel é o quanto ele sabe jogar
   cada um, de 0 a 100 — e é ela que o meta vai ler. */
/* Semeia a familiaridade UMA vez, no nascimento do jogador. Fazer isso na
   primeira leitura era cômodo e errado: a tela de Treino pergunta o nível de
   todo agente de todo jogador para montar a lista, e cada pergunta puxava um
   sorteio — desenhar a tela empurrava o gerador semeado do motor e mudava o
   futuro da simulação. O teste de pureza de render pegou exatamente isso. */
function semearAgentes(p){
  p.agenteNivel={};
  /* O sorteio nasce limitado pelo teto da função. Sem isso metade do mundo
     nascia ACIMA do próprio teto — o jogador de Tier 2 começava com 90 num
     boneco cujo teto era 60 — e aí o teto não significava nada na largada e,
     depois de enferrujar, ele nunca mais voltava ao nível de origem. */
  (p.agentes||[]).forEach((ag,i)=>{
    const bruto=ri(72,95)-i*ri(0,6);
    p.agenteNivel[ag]=clamp(Math.min(bruto,tetoAgente(p,ag)),0,100);
  });
  return p.agenteNivel;
}
/* Leitura PURA: nunca sorteia, nunca cria. Agente que ninguém treinou vale 0,
   e main de save antigo cai num valor derivado do próprio jogador — sem
   aleatoriedade, para poder ser chamado de dentro do render. */
function nivelAgente(p,ag){
  if(!p)return 0;
  const n=p.agenteNivel&&p.agenteNivel[ag];
  if(typeof n==='number')return n;
  if((p.agentes||[]).includes(ag))return 78;
  return 0;
}
/* Teto de aprendizado: o agente cobra atributos, e quem não tem não chega ao
   fim. É isso que impede "todo mundo aprende tudo" — e é por isso que um clube
   às vezes tem de COMPRAR um main em vez de retreinar o que tem. */
function tetoAgente(p,ag){
  const fun=funcaoDoAgente(ag);
  const w=(typeof ROLE_W!=='undefined'&&ROLE_W[fun])||null;
  if(!w)return 90;
  let soma=0,peso=0;
  for(const k in w){soma+=(p.at[k]||0)*w[k];peso+=w[k];}
  const aptidao=peso?soma/peso:60;
  /* própria função é casa: aprende mais alto. Fora da função, teto menor. */
  const casa=p.role===fun||p.role==='Flex'||fun==='Flex';
  return clamp(Math.round(aptidao*(casa?1.02:0.86)),35,99);
}
function funcaoDoAgente(ag){
  for(const f in AGENTS)if((AGENTS[f]||[]).includes(ag))return f;
  return 'Flex';
}
function treinarAgente(p,ag,quanto){
  if(!p)return 0;
  /* boneco que não existe no catálogo não entra na ficha: aceitar a string
     criava um agente fantasma com nível próprio, que depois aparecia na tela */
  if(!funcaoConhece(ag))return 0;
  if(!p.agenteNivel)semearAgentes(p);
  /* zerar aqui apagava o nível implícito de quem é main do boneco: ele caía de
     78 para 0 no primeiro treino, e treinar BAIXAVA o nível */
  if(p.agenteNivel[ag]==null)p.agenteNivel[ag]=nivelAgente(p,ag);
  const teto=tetoAgente(p,ag);
  const atual=nivelAgente(p,ag);
  if(atual>=teto)return 0;
  /* retorno decrescente perto do teto: os últimos pontos custam caro */
  const folga=(teto-atual)/Math.max(1,teto);
  const passo=quanto*(0.35+folga*0.9);
  p.agenteNivel[ag]=clamp(atual+passo,0,teto);
  return p.agenteNivel[ag]-atual;
}
/* Agente sem uso enferruja. Os mains enferrujam mais devagar: você não
   desaprende o boneco da sua carreira em três meses. */
function enferrujarAgentes(p,usados){
  if(!p||!p.agenteNivel)return;
  for(const ag in p.agenteNivel){
    if(usados&&usados.includes(ag))continue;
    const main=(p.agentes||[]).includes(ag);
    const passo=AGENTE_ENFERRUJA*(main?0.4:1);
    p.agenteNivel[ag]=Math.max(0,p.agenteNivel[ag]-passo);
  }
}

/* ---------- treino de mapa ----------
   Sobe a afinidade dos titulares no mapa da semana. Reserva também treina,
   mas menos: quem não entra em quadra aprende o mapa pela metade. */
function treinarMapa(t){
  const div=divisaoTreino(planoDe(t));
  if(!div.length)return null;
  let mexeu=0;
  for(const d of div)mexeu=treinarUmMapa(t,d.mapa,d.frac).jogadores;
  return{mapa:div[0].mapa,mapas:div.map(d=>d.mapa),jogadores:mexeu};
}
function treinarUmMapa(t,mapa,frac){
  /* CT e sala de análise (core/estrutura.js) e o head coach */
  const nivelTreino=fatorTreinoMapaEst(t)
                       +(((t.staff&&t.staff.tecnico)||2)-2)*0.05;
  let mexeu=0;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    if(!p.mapas)p.mapas=afinidadeInicial();
    const titular=(t.titulares||[]).includes(id);
    const atual=p.mapas[mapa]||0;
    /* retorno decrescente: de −8 para 0 é rápido, de +6 para +8 é lento */
    const folga=(AFIN_MAX-atual)/(AFIN_MAX-AFIN_MIN);
    const passo=MAPA_POR_SEMANA*nivelTreino*(titular?1:0.5)*(0.35+folga)*(frac==null?1:frac);
    p.mapas[mapa]=clamp(atual+passo,AFIN_MIN,AFIN_MAX);
    mexeu++;
  }
  return{mapa,jogadores:mexeu};
}

/* ---------- a semana ----------
   Chamado uma vez por semana por clube, pelo relógio. Devolve o que aconteceu,
   para a interface poder contar. */
function aplicarTreinoSemanal(t){
  if(!t)return null;
  const pl=limparPlano(t);
  const r={mapa:null,agentes:[],descansando:0,treinando:0};
  const doMapa=treinarMapa(t);
  if(doMapa){r.mapa=doMapa.mapa;r.mapas=doMapa.mapas;esquecerMapas(t,doMapa.mapas);}
  else esquecerMapas(t,null);
  if(typeof normalizarPool==='function')normalizarPool(t);
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    const plano=planoDoJogador(t,p);
    if(plano.tipo==='descanso')r.descansando++;
    else r.treinando++;
    if(plano.tipo==='agente'&&plano.alvo){
      const ganho=treinarAgente(p,plano.alvo,AGENTE_POR_SEMANA);
      if(ganho>0.05)r.agentes.push({nome:p.nome,agente:plano.alvo,nivel:Math.round(nivelAgente(p,plano.alvo))});
    }
    /* agente que ninguém usou nem treinou enferruja */
    enferrujarAgentes(p,[plano.tipo==='agente'?plano.alvo:null].filter(Boolean)
      .concat((p.agentes||[]).slice(0,1)));
  }
  return r;
}
/* Quantos mapas o clube trata como "os dele". Três é o bastante para o veto ter
   conteúdo: banindo dois, sobra um confortável para cada lado. */
const CONFORTO=3;
/* O mapa que a IA treina nesta semana. Treinar SEMPRE o pior parecia sensato e
   era o que homogeneizava o mundo: em uma temporada todo clube ficava bom em
   tudo (leque de 4,0 pontos entre melhor e pior mapa caía para 1,0) e o veto
   perdia sentido, porque não havia mapa que ninguém quisesse jogar. Clube de
   verdade escolhe um pool e mora nele; de vez em quando tapa um buraco. */
/* A IA usa a mesma regra de três mapas: o da rotação dela como alta, e os
   dois seguintes da ordem de conforto como média e baixa. */
function mapasDaSemanaIA(t){
  const um=mapaDaSemanaIA(t);
  if(!um)return[];
  const ordem=(G.mapasAtivos||[]).slice().sort((a,b)=>
    ((t.mapPref&&t.mapPref[b]||0)*2+afinidadeElenco(t,b))-((t.mapPref&&t.mapPref[a]||0)*2+afinidadeElenco(t,a)))
    .filter(m=>m!==um);
  return[{mapa:um,prio:'alta'},...ordem.slice(0,2).map((m,i)=>({mapa:m,prio:i?'baixa':'media'}))];
}
function mapaDaSemanaIA(t){
  const pool=(G.mapasAtivos||[]).slice();
  if(!pool.length)return null;
  /* preferência do clube primeiro, afinidade como desempate: a identidade fica
     estável de semana em semana, em vez de perseguir o buraco do momento */
  const ordem=pool.sort((a,b)=>
    ((t.mapPref&&t.mapPref[b]||0)*2+afinidadeElenco(t,b))
   -((t.mapPref&&t.mapPref[a]||0)*2+afinidadeElenco(t,a)));
  const conforto=ordem.slice(0,CONFORTO);
  const pior=ordem[ordem.length-1];
  /* três semanas no pool de conforto, uma tapando o buraco — rotação pelo
     número da semana, sem sorteio, para o mundo continuar reproduzível */
  const passo=(G.semana||1)%(CONFORTO+1);
  return passo===CONFORTO?pior:(conforto[passo]||conforto[0]);
}
/* A IA também precisa escolher, senão o mundo para de evoluir e você ganha por
   ausência. Prioridade simples e legível: elenco cansado descansa, elenco novo
   treina atributo, e o mapa da semana sai do pool de conforto do clube. */
function planoIA(t){
  if(!t||t.id===G.meuTime)return null;
  const pl=planoDe(t);
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const fadigaMedia=tit.length?tit.reduce((s,p)=>s+p.fadiga,0)/tit.length:0;
  definirMapasTreino(t,fadigaMedia>0.72?[]:mapasDaSemanaIA(t));
  pl.individual={};
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p)continue;
    if(p.fadiga>0.7||p.lesao){pl.individual[id]={tipo:'descanso',alvo:null};continue;}
    const gap=(p.pot||0)-over(p);
    if(gap<=1){pl.individual[id]={tipo:'descanso',alvo:null};continue;}
    /* O atributo que mais rende over: peso na função vezes o espaço que ainda
       tem até 99. A conta antiga (o mais fraco pelo peso, at/w) escolhia a
       mira do Duelista mesmo com a mira em 99, e todo o treino se perdia no
       teto: o regen empacava aos 20 anos com 74 de over e potencial 88, e a
       média do Tier 1 caía de 84 para 79 conforme os reais se aposentavam. */
    const w=ROLE_W[p.role]||ROLE_W.Flex;
    const alvo=Object.keys(w).sort((a,b)=>
      w[b]*(99-(p.at[b]||0))-w[a]*(99-(p.at[a]||0)))[0]||'mira';
    pl.individual[id]={tipo:'atributo',alvo};
  }
  return pl;
}

/* ---------- preparo por mapa ----------
   Um número de 0 a 100 para "quão pronto o time está neste mapa", feito
   SÓ dos termos que o motor de partida usa e que mudam de mapa para mapa
   (forcaTime em match.js): identidade do clube, afinidade dos cinco, a comp
   escalada e a tática do mapa. É o mesmo número que o veto enxerga, então a
   tela de preparo e a pré-partida não podem discordar. Cada ponto de força
   vale 4 pontos na escala; 50 é um mapa neutro. */
const PREPARO_ESCALA=4;
function taticaNoMapa(t,mapa){
  return Object.assign({},t.tatica,(t.taticaMapa&&t.taticaMapa[mapa])||{});
}
function definirTaticaMapa(t,mapa,campo,valor){
  if(!t.taticaMapa)t.taticaMapa={};
  const tm=Object.assign({},t.taticaMapa[mapa]||{});
  if(valor==null||valor===''||String(valor)===String(t.tatica[campo]))delete tm[campo];
  else tm[campo]=campo==='agres'?clamp(parseInt(valor)||3,1,5):valor;
  if(Object.keys(tm).length)t.taticaMapa[mapa]=tm;else delete t.taticaMapa[mapa];
  return{ok:true};
}
function preparoDoMapa(t,mapa){
  const clube=(t.mapPref[mapa]||0)*0.6;
  const elenco=afinidadeElenco(t,mapa)*0.6;
  const comp=typeof pesoComp==='function'?pesoComp(t,mapa):0;
  const guarda=t.tatica;
  let tatica=0;
  try{
    t.tatica=taticaNoMapa(t,mapa);
    tatica=((pesoAgressividade(t,mapa,'atk')+pesoFoco(t,mapa,'atk'))
           +(pesoAgressividade(t,mapa,'def')+pesoFoco(t,mapa,'def')))/2;
  }finally{t.tatica=guarda;}
  const pontos=clube+elenco+comp+tatica;
  return{mapa,pontos,nota:Math.round(clamp(50+pontos*PREPARO_ESCALA,0,100)),
         partes:{clube,elenco,comp,tatica},especifica:!!(t.taticaMapa&&t.taticaMapa[mapa])};
}
/* Foto semanal do preparo do seu clube, para o gráfico de evolução. Só do
   seu: guardar de 80 clubes inflaria o save sem ninguém olhar. */
function registrarPreparo(t){
  if(!t||t.id!==G.meuTime)return;
  const f={ano:G.ano,s:G.semana,m:{}};
  for(const mp of G.mapasAtivos||[])f.m[mp]=preparoDoMapa(t,mp).nota;
  (t.preparoHist=t.preparoHist||[]).push(f);
  if(t.preparoHist.length>40)t.preparoHist.shift();
}

/* ============================================================
   COMPOSIÇÃO DE AGENTES POR MAPA
   ------------------------------------------------------------
   Quem pega qual boneco, mapa por mapa. Três coisas se cruzam
   aqui, e é o cruzamento que faz a escolha ser escolha:

     1. FAMILIARIDADE (treino.js) — o quanto aquele jogador sabe
        jogar aquele agente, de 0 a 100. Sobe com treino, cai com
        abandono, e tem teto de aptidão.
     2. META (meta.js) — quanto o boneco vale hoje. Vem da taxa
        de escolha real de 2026 e muda a cada patch.
     3. FUNÇÃO — agente fora da função do jogador cobra caro,
        porque o teto de aprendizado dele é mais baixo.

   Uma comp de mains em bonecos do meta é o caminho seguro. Uma
   comp fora do meta custa força de round, e paga em SURPRESA:
   o analista do adversário prepara o que é comum, e o que ele
   não preparou vale menos no relatório dele. É esse o "ir contra
   o meta" — aposta, não erro.
   ============================================================ */

/* Pesos em pontos de força de round. Medidos: uma comp boa contra uma comp
   ruim tem de valer algo entre a comissão (+31 pontos de vitória) e as
   táticas (+6), porque é uma escolha por mapa e não por temporada. */
/* Calibração medida em pontos de FORÇA DE ROUND, sabendo que oito pontos de
   força valem cerca de trinta e dois pontos de vitória (é o que a comissão 5
   contra 1 entrega). A primeira tentativa usou 0,055 por ponto de
   familiaridade e a conta deu −19 pontos de força para um time de bonecos
   nunca treinados: 99,3% de derrota, mais decisivo do que oito pontos de over.
   Comp é escolha por mapa, não pode valer mais que o elenco.

   Segunda passada, com a régua já consertada (os gêmeos batiam 54% antes):
   familiaridade caiu de 0,014 para 0,010 porque um time de bonecos nunca
   treinados perdia 36,8 pontos de vitória, mais do que oito pontos de over
   valem; e o peso do meta subiu de 0,020 para 0,028, porque treinar a comp
   que o meta pede rendia só 4,1 e precisa competir com especializar o pool de
   mapas, que rende 7,2. */
const COMP_PESO_FAMILIAR=0.010;   /* por ponto de familiaridade acima de 70 */
const COMP_FAMILIAR_BASE=70;
const COMP_PESO_META=0.028;       /* por ponto de força do agente no meta */
const COMP_PENA_SEM_SMOKE=2.6;    /* comp sem controlador não fecha mapa */
const COMP_PENA_SEM_INICIA=1.4;
const COMP_PENA_DUPLA=1.2;        /* dois jogadores no mesmo agente */

function compsDe(t){
  if(!t.comps)t.comps={};
  return t.comps;
}
function compDe(t,mapa){
  const c=compsDe(t);
  if(!c[mapa])c[mapa]={};
  return c[mapa];
}
/* O agente com que ESTE jogador entra neste mapa. Sem escolha, o melhor que
   ele sabe jogar — ninguém entra em quadra sem boneco. */
function agenteDe(t,mapa,p){
  if(!p)return null;
  const c=(t.comps&&t.comps[mapa])||{};
  if(c[p.id]&&funcaoConhece(c[p.id]))return c[p.id];
  return melhorAgenteDe(p);
}
function melhorAgenteDe(p){
  const pool=(p.agentes||[]).slice();
  if(!pool.length)return (AGENTS[p.role]||[])[0]||null;
  return pool.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
}
function definirAgente(t,mapa,jogadorId,ag){
  const c=compDe(t,mapa);
  if(!ag){delete c[jogadorId];return c;}
  if(!funcaoConhece(ag))return c;
  c[jogadorId]=ag;
  return c;
}
/* A comp que entra em quadra: os cinco titulares com o boneco de cada um. */
function compEscalada(t,mapa){
  return (t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .map(p=>({p,ag:agenteDe(t,mapa,p),
              nivel:nivelAgente(p,agenteDe(t,mapa,p)),
              fun:funcaoDoAgente(agenteDe(t,mapa,p))}));
}
/* ---------- o mapa pede coisas diferentes ----------
   Sem isto a comp era a MESMA nos oito mapas — o relatório de scouting mostrava
   literalmente a mesma linha oito vezes — e escolher "por mapa" não queria
   dizer nada.

   O critério não é inventado: sai do viés de lado real de cada mapa
   (MAPA_ATK, média das três ligas em 2026). Mapa onde o ataque ganha (Abyss,
   55%) pede quem entra: duelista e iniciador. Mapa onde a defesa ganha
   (Ascent, 47%) pede quem segura: sentinela e controlador. É a mesma lógica
   que faz um time levar Viper para mapa aberto — só que ancorada em número
   medido, e não em opinião minha sobre cada agente. */
const COMP_PESO_MAPA=0.9;
function pendorDoMapa(mapa){
  const atk=(typeof MAPA_ATK!=='undefined'&&MAPA_ATK[mapa])||50;
  return (atk-50)/5;      /* −0,6 (Ascent) a +1,0 (Abyss) */
}
function encaixeNoMapa(fun,mapa){
  const p=pendorDoMapa(mapa);
  const entra={Duelista:1,Iniciador:0.6,Flex:0,Controlador:-0.4,Sentinela:-1}[fun];
  return (entra===undefined?0:entra)*p*COMP_PESO_MAPA;
}
/* O que ESTE agente, com ESTE jogador, neste mapa, adiciona à força do round.
   É a mesma conta que pesoComp soma — ter uma função só evita que o preset e
   a força discordem. */
function valorDoAgente(p,ag,mapa){
  if(!ag)return -99;
  return (nivelAgente(p,ag)-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR
       + (forcaMeta(ag)-META_NEUTRO)*COMP_PESO_META
       + encaixeNoMapa(funcaoDoAgente(ag),mapa);
}
/* ---------- o que a comp vale ----------
   Entra em forcaTime como um termo só, para o efeito ser legível e medível. */
function pesoComp(t,mapa){
  const linhas=compEscalada(t,mapa);
  if(!linhas.length)return 0;
  let f=0;
  const funs={},usados={};
  for(const l of linhas){
    if(!l.ag)continue;
    /* familiaridade: 70 é o main comum; 95 é o especialista; 20 é quem foi
       jogar de boneco que nunca treinou */
    f+=(l.nivel-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR;
    /* meta: quanto o boneco vale hoje */
    f+=(forcaMeta(l.ag)-META_NEUTRO)*COMP_PESO_META;
    /* e o que este mapa pede */
    f+=encaixeNoMapa(l.fun,mapa);
    funs[l.fun]=(funs[l.fun]||0)+1;
    usados[l.ag]=(usados[l.ag]||0)+1;
  }
  /* buracos de comp: é a regra do próprio jogo, não invenção. Sem controlador
     não se fecha um site; sem iniciador não se entra num. */
  const smokes=(funs['Controlador']||0)+(funs['Flex']||0);
  if(!smokes)f-=COMP_PENA_SEM_SMOKE;
  if(!(funs['Iniciador']||0))f-=COMP_PENA_SEM_INICIA;
  for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
  return f;
}
/* ---------- surpresa ----------
   O quanto a comp foge do que o mundo joga. É isso que o analista adversário
   NÃO preparou, e é o que desconta a vantagem de scouting dele. 0 = comp de
   manual, 1 = ninguém esperava. */
function surpresaDaComp(t,mapa){
  const linhas=compEscalada(t,mapa);
  if(!linhas.length)return 0;
  let fora=0;
  for(const l of linhas){
    if(!l.ag)continue;
    const topo=topoDoMeta(l.fun,3);
    if(!topo.includes(l.ag))fora++;
    if(l.p.role!==l.fun&&l.fun!=='Flex'&&l.p.role!=='Flex')fora+=0.5;
  }
  return clamp(fora/(linhas.length*1.5),0,1);
}

/* ---------- presets ----------
   Gabriel pediu presets, e presets fixos por mapa envelheceriam no primeiro
   patch. Estes são calculados na hora, a partir do meta de hoje e do elenco
   de hoje — o preset Meta muda sozinho quando a Riot mexe no jogo. */
const PRESETS_COMP=[
  {id:'melhor',  rot:'Melhor agora',  dica:'A comp mais forte HOJE: cruza familiaridade, meta e o que este mapa pede.'},
  {id:'meta',    rot:'Meta',          dica:'O que o meta pede, mesmo que ninguém saiba jogar ainda — é o alvo do treino.'},
  {id:'conforto',rot:'Conforto',      dica:'O que cada um sabe jogar melhor, meta ou não.'},
  {id:'contra',  rot:'Contra o meta', dica:'Foge do que o adversário preparou: perde força de round e ganha surpresa.'}
];
function aplicarPreset(t,mapa,preset){
  const c=compDe(t,mapa);
  const linhas=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  /* Melhor agora é a comp INTEIRA mais forte, não cinco escolhas boas uma de
     cada vez. Parte do guloso e do conforto, melhora os dois trocando boneco
     entre jogadores, e fica com o que pesoComp mais gostar. */
  if(preset==='melhor'){
    const cands=['_guloso','conforto'].map(pr=>{
      const x=Object.assign({},c);
      montarPreset(t,mapa,pr==='_guloso'?'melhor':pr,x,linhas);
      repararComp(t,mapa,x,linhas);
      return melhorarComp(mapa,x,linhas);
    });
    const melhor=cands.sort((a,b)=>notaDaComp(mapa,b,linhas)-notaDaComp(mapa,a,linhas))[0];
    linhas.forEach(p=>{if(melhor[p.id])c[p.id]=melhor[p.id];});
    return c;
  }
  montarPreset(t,mapa,preset,c,linhas);
  return repararComp(t,mapa,c,linhas);
}
function montarPreset(t,mapa,preset,c,linhas){
  const tomados=new Set();
  const escolher=p=>{
    const dele=(p.agentes||[]).slice();
    const daFuncao=(agentesDe(p.roleAtual||p.role)||[]).slice();
    const pool=[...new Set([...dele,...daFuncao])].filter(a=>!tomados.has(a));
    if(!pool.length)return melhorAgenteDe(p);
    if(preset==='melhor')
      return pool.sort((a,b)=>valorDoAgente(p,b,mapa)-valorDoAgente(p,a,mapa))[0];
    if(preset==='conforto')
      return pool.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
    if(preset==='contra'){
      /* o que ele sabe jogar E está fora do topo do meta: surpresa que ainda
         é jogável, não suicídio */
      const topo=topoDoMeta(p.roleAtual||p.role,3);
      const fora=pool.filter(a=>!topo.includes(a)&&nivelAgente(p,a)>=45);
      const alvo=(fora.length?fora:pool);
      return alvo.sort((a,b)=>nivelAgente(p,b)-nivelAgente(p,a))[0];
    }
    /* meta: o que o meta PEDE, sem olhar o que ele já sabe.
       A primeira versão pesava familiaridade aqui e o resultado media zero: o
       main tem 70 a 95 de familiaridade e quem nunca treinou tem 0, então a
       familiaridade dominava a conta e o preset Meta nunca saía dos mains —
       ou seja, treinar agente não teria para que servir. O preset agora aponta
       o alvo do treino, e escalar antes de treinar CUSTA. É essa a decisão. */
    return pool.sort((a,b)=>forcaMeta(b)-forcaMeta(a))[0];
  };
  for(const p of linhas){
    const ag=escolher(p);
    if(ag){c[p.id]=ag;tomados.add(ag);}
  }
  return c;
}
/* A mesma conta de pesoComp, só que sobre uma comp candidata em vez da que
   está gravada no time. As duas têm de concordar, senão o preset otimiza uma
   coisa e a partida mede outra. */
function notaDaComp(mapa,c,linhas){
  let f=0;
  const funs={},usados={};
  for(const p of linhas){
    const ag=(c[p.id]&&funcaoConhece(c[p.id]))?c[p.id]:melhorAgenteDe(p);
    if(!ag)continue;
    const fun=funcaoDoAgente(ag);
    f+=(nivelAgente(p,ag)-COMP_FAMILIAR_BASE)*COMP_PESO_FAMILIAR
      +(forcaMeta(ag)-META_NEUTRO)*COMP_PESO_META
      +encaixeNoMapa(fun,mapa);
    funs[fun]=(funs[fun]||0)+1;
    usados[ag]=(usados[ag]||0)+1;
  }
  if(!((funs['Controlador']||0)+(funs['Flex']||0)))f-=COMP_PENA_SEM_SMOKE;
  if(!(funs['Iniciador']||0))f-=COMP_PENA_SEM_INICIA;
  for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
  return f;
}
/* Busca local: troca o boneco de um jogador, ou troca bonecos entre dois, e
   aceita o movimento que mais sobe a nota. O guloso errava justamente aqui:
   dois controladores que sabem Astra e Harbor, e o primeiro da lista pegava o
   boneco em que o segundo era melhor. Roda toda semana para os 80 clubes, então
   o valor de cada jogador em cada boneco é calculado uma vez só e a nota da
   comp vira soma de tabela. Nada aqui sorteia. */
function melhorarComp(mapa,c,linhas){
  const x={};
  const pools=linhas.map(p=>{
    const lista=[...new Set([c[p.id],...(p.agentes||[]),...(agentesDe(p.roleAtual||p.role)||[])])]
      .filter(a=>a&&funcaoConhece(a));
    const val={},fun={};
    lista.forEach(a=>{val[a]=valorDoAgente(p,a,mapa);fun[a]=funcaoDoAgente(a);});
    return{p,lista,val,fun};
  });
  pools.forEach(({p,lista})=>{x[p.id]=(c[p.id]&&funcaoConhece(c[p.id]))?c[p.id]:(melhorAgenteDe(p)||lista[0]);});
  const nota=y=>{
    let f=0,smoke=0,inicia=0;const usados={};
    for(const{p,val,fun}of pools){
      const ag=y[p.id];if(!ag)continue;
      if(val[ag]===undefined){val[ag]=valorDoAgente(p,ag,mapa);fun[ag]=funcaoDoAgente(ag);}
      f+=val[ag];
      if(fun[ag]==='Controlador'||fun[ag]==='Flex')smoke++;
      if(fun[ag]==='Iniciador')inicia++;
      usados[ag]=(usados[ag]||0)+1;
    }
    if(!smoke)f-=COMP_PENA_SEM_SMOKE;
    if(!inicia)f-=COMP_PENA_SEM_INICIA;
    for(const ag in usados)if(usados[ag]>1)f-=COMP_PENA_DUPLA*(usados[ag]-1);
    return f;
  };
  for(let it=0;it<20;it++){
    const base=nota(x);
    let melhor=null;
    for(const{p,lista}of pools){
      for(const a of lista){
        if(a===x[p.id])continue;
        const dono=linhas.find(q=>q.id!==p.id&&x[q.id]===a);
        const antes=x[p.id];
        if(dono)x[dono.id]=antes;
        x[p.id]=a;
        const n=nota(x);
        x[p.id]=antes;
        if(dono)x[dono.id]=a;
        if(n>base+1e-9&&(!melhor||n>melhor.n))melhor={n,p,a,dono};
      }
    }
    if(!melhor)break;
    if(melhor.dono)x[melhor.dono.id]=x[melhor.p.id];
    x[melhor.p.id]=melhor.a;
  }
  return Object.assign({},c,x);
}
/* Escolher jogador a jogador é guloso e cego para a comp inteira: medido, o
   preset "melhor" saía PIOR que o "conforto" em Ascent (1,22 contra 1,79)
   porque cinco escolhas individualmente boas montavam uma comp sem iniciador,
   e o buraco custa mais do que os cinco ganhos somados. Este passo fecha os
   buracos trocando quem perde menos com a troca. */
function repararComp(t,mapa,c,linhas){
  const precisa=[
    {funs:['Controlador','Flex'],rot:'Controlador'},
    {funs:['Iniciador'],rot:'Iniciador'}
  ];
  for(const req of precisa){
    const temNa=linhas.some(p=>req.funs.includes(funcaoDoAgente(c[p.id])));
    if(temNa)continue;
    let melhorTroca=null;
    for(const p of linhas){
      /* candidatos da função que falta, entre os que ele conhece e os da
         função dele — sem duplicar quem já está em quadra */
      const usados=new Set(linhas.filter(x=>x.id!==p.id).map(x=>c[x.id]));
      const cand=[...new Set([...(p.agentes||[]),...(agentesDe(req.rot)||[]),...topoDoMeta(req.rot,3)])]
        .filter(a=>req.funs.includes(funcaoDoAgente(a))&&!usados.has(a));
      for(const a of cand){
        const perda=valorDoAgente(p,c[p.id],mapa)-valorDoAgente(p,a,mapa);
        if(!melhorTroca||perda<melhorTroca.perda)melhorTroca={p,a,perda};
      }
    }
    if(melhorTroca)c[melhorTroca.p.id]=melhorTroca.a;
  }
  return c;
}
/* Tira do mapa da comp quem saiu do elenco, e do pool o mapa que saiu de
   rotação — a mesma faxina do plano de treino. */
function limparComps(t){
  const c=compsDe(t);
  const dentro=new Set(t.elenco||[]);
  for(const mapa in c){
    if(!mapaAtivo(mapa)){delete c[mapa];continue;}
    for(const pid in c[mapa]){
      if(!dentro.has(pid)||!funcaoConhece(c[mapa][pid]))delete c[mapa][pid];
    }
  }
  return c;
}
/* A IA também escolhe comp, senão ela entraria sempre no automático e o meta
   não teria com quem girar. Preset Meta para quem tem elenco descansado, e
   Conforto para quem tem gente sem familiaridade no que o meta pede. */
/* A IA escolhe a comp mais forte que ela consegue montar HOJE, mapa a mapa.
   A primeira versão dela usava o preset Meta quando o elenco conhecia o meta,
   e o resultado aparecia no relatório de scouting: clubes escalando Deadlock
   com familiaridade 0 porque o meta pedia. Time nenhum faz isso — o meta é
   alvo de treino, não escalação de sábado. */
/* A busca da comp inteira custa, e roda para 80 clubes. Ela só é refeita
   quando algo que a decide mudou — titulares, patch, rotação de mapas — ou a
   cada quatro semanas, que é o ritmo em que a familiaridade anda o bastante
   para trocar um boneco. */
const COMP_IA_INTERVALO=4;
function compIA(t){
  if(!t||t.id===G.meuTime)return null;
  const ativos=G.mapasAtivos||[];
  const assin=(t.titulares||[]).join(',')+'|'+ativos.join(',')+'|'+JSON.stringify(G.meta||{});
  const semana=(G.ano||0)*100+(G.semana||0);
  const faltaMapa=ativos.some(m=>!(t.comps&&t.comps[m]));
  if(!faltaMapa&&t.compAssin===assin&&semana-(t.compSemana||0)<COMP_IA_INTERVALO)return t.comps;
  for(const mapa of ativos)aplicarPreset(t,mapa,'melhor');
  t.compAssin=assin;t.compSemana=semana;
  return t.comps;
}

/* ============================================================
   ESCALAÇÃO
   ------------------------------------------------------------
   A versão antiga preenchia as quatro funções primeiro e só
   depois olhava over. Com roster real isso ficava visível: a
   Paper Rex escalava um Controlador de 65 no lugar de um
   Duelista de 88, porque cobertura vinha antes de força.

   Agora existe uma nota para a escalação inteira — soma dos
   overs efetivos mais a penalidade de cobertura — e o algoritmo
   procura o melhor conjunto de cinco por essa nota. Cobertura
   continua valendo, mas passou a ter PREÇO: quatro pontos de
   over por função descoberta. Vinte e três pontos de over ganham
   dessa conta; três pontos não ganham.

   A função secundária entra aqui: um jogador pode cobrir a vaga
   de outra função pagando só a diferença de over entre as duas,
   em vez de deixar o buraco aberto ou escalar um titular pior.
   ============================================================ */

/* Quanto vale, em pontos de over, cada função que fica descoberta. */
const PESO_COBERTURA=4;
/* Punição por empilhar gente demais na mesma função. */
const PESO_DUPLICIDADE=2;
const FUNCOES_BASE=['Duelista','Iniciador','Controlador','Sentinela'];

/* Distribui os cinco titulares entre as funções, maximizando o over efetivo.
   Cinco jogadores e quatro funções é pequeno o bastante para resolver por
   força bruta honesta: testa toda atribuição e fica com a melhor. */
function distribuirFuncoes(rs){
  const atrib=rs.map(p=>p.role);
  let melhor=null;
  const buscar=(i,usadas,acc)=>{
    if(i===rs.length){
      const desc=FUNCOES_BASE.filter(r=>!usadas.has(r)).length;
      const nota=acc-desc*PESO_COBERTURA;
      if(!melhor||nota>melhor.nota)melhor={nota,atrib:atrib.slice()};
      return;
    }
    const p=rs[i];
    const opcoes=p.role==='Flex'?FUNCOES_BASE:[p.role,...(p.role2&&p.role2!==p.role?[p.role2]:[])];
    for(const r of opcoes){
      atrib[i]=r;
      const nova=usadas.has(r);
      usadas.add(r);
      buscar(i+1,usadas,acc+overComo(p,r)-(nova?PESO_DUPLICIDADE:0));
      if(!nova)usadas.delete(r);
    }
  };
  buscar(0,new Set(),0);
  return melhor||{nota:rs.reduce((s,p)=>s+over(p),0),atrib:rs.map(p=>p.role)};
}

/* Nota de um conjunto de cinco. É esta função que decide tudo: mexer no peso
   da cobertura aqui muda o comportamento de todos os 80 clubes de uma vez. */
function notaEscalacao(ids){
  const rs=ids.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length<5)return -Infinity;
  return distribuirFuncoes(rs).nota;
}

/* Quanto um jogador em recuperação rende. Não é zero: no cenário real quem
   está com a mão ruim entra e joga pior, e é isso que a escalação de emergência
   tem de custar. */
const PENA_LESAO=0.72;
function autoEscalar(t){
  const sadios=t.elenco.map(id=>G.jogadores[id]).filter(p=>p&&!p.lesao);
  /* Cinco em quadra SEMPRE, mesmo que doa.

     Antes o elenco disponível era só quem estava inteiro. Com sete jogadores e
     uma sequência ruim de lesões — e ela acontece, entre a lesão de partida e
     o desgaste — sobrava menos de cinco, a escalação saía vazia e a partida
     estourava no meio da temporada, sem save nem recuperação. Agora quem está
     em recuperação entra, do menos machucado para o mais, e paga o preço de
     entrar assim. */
  let el=sadios;
  if(sadios.length<5){
    const machucados=t.elenco.map(id=>G.jogadores[id]).filter(p=>p&&p.lesao)
      .sort((a,b)=>a.lesao-b.lesao||over(b)-over(a));
    el=sadios.concat(machucados.slice(0,5-sadios.length));
    if(t.id===G.meuTime&&machucados.length&&typeof noticia==='function')
      noticia('🩹 Sem gente inteira: '+Math.min(machucados.length,5-sadios.length)+
              ' jogador(es) entram em recuperação e rendem menos.',{c:'clube',t:[t.id]});
  }
  if(!el.length){t.titulares=[];t.igl=null;return;}

  /* Ponto de partida: os cinco de maior over. Começar pelo time mais forte e
     corrigir a cobertura depois dá resultado melhor do que o contrário —
     cobertura custa 4 pontos, over costuma custar mais. */
  let esc=el.slice().sort((a,b)=>over(b)-over(a)).slice(0,5).map(p=>p.id);
  let nota=notaEscalacao(esc);

  /* Trocas de melhoria até estabilizar. Com no máximo 9 no elenco isso é um
     punhado de combinações; o laço externo existe porque uma troca boa às
     vezes abre espaço para outra. */
  for(let volta=0;volta<6;volta++){
    let mudou=false;
    const fora=el.filter(p=>!esc.includes(p.id));
    for(const cand of fora){
      for(let i=0;i<esc.length;i++){
        const tentativa=esc.slice();tentativa[i]=cand.id;
        const n=notaEscalacao(tentativa);
        if(n>nota+0.001){esc=tentativa;nota=n;mudou=true;break;}
      }
      if(mudou)break;
    }
    if(!mudou)break;
  }

  t.titulares=esc;
  /* registra em que função cada um vai jogar: é o que o motor de partida lê
     para cobrar o preço de atuar fora de posição */
  const rs=esc.map(i=>G.jogadores[i]);
  const dist=distribuirFuncoes(rs);
  rs.forEach((p,i)=>{p.roleAtual=dist.atrib[i];});
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(!esc.includes(id))p.roleAtual=p.role;});

  const cand=rs.slice().sort((a,b)=>b.at.lider-a.at.lider)[0];
  t.igl=cand?cand.id:null;
  t.elenco.forEach(id=>G.jogadores[id].igl=(id===t.igl));
  /* o entrosamento do time é o dos cinco que jogam: mudou o cinco, muda ele */
  if(typeof atualizarSinergia==='function'&&t.duplas)atualizarSinergia(t);
}

/* Troca manual: `sai` vai para o banco e `entra` assume o lugar dele (ou, se
   os dois forem titulares, só trocam de posição na fila). As funções dos
   cinco são redistribuídas, o IGL segue em quadra e o entrosamento é
   recalculado (ou, sem duplas, cai 5 como nas trocas pelos botões). */
function trocarTitular(t,sai,entra){
  if(!t||sai===entra)return{ok:false};
  const tit=t.titulares.slice();
  const iS=tit.indexOf(sai),iE=tit.indexOf(entra);
  if(iS<0&&iE<0)return{ok:false,erro:'Nenhum dos dois está entre os titulares.'};
  if(iS>=0&&iE>=0){tit[iS]=entra;tit[iE]=sai;t.titulares=tit;return{ok:true,so:'ordem'};}
  const fora=iS>=0?entra:sai, dentro=iS>=0?sai:entra;
  if(!t.elenco.includes(fora))return{ok:false,erro:'Jogador fora do elenco.'};
  tit[tit.indexOf(dentro)]=fora;
  t.titulares=tit;
  const rs=tit.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length===5){const d=distribuirFuncoes(rs);rs.forEach((p,i)=>{p.roleAtual=d.atrib[i];});}
  const pd=G.jogadores[dentro];if(pd)pd.roleAtual=pd.role;
  if(!tit.includes(t.igl))t.igl=tit[0];
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(p)p.igl=(id===t.igl);});
  if(typeof atualizarSinergia==='function'&&t.duplas)atualizarSinergia(t);
  else t.sinergia=clamp(t.sinergia-5,0,100);
  const pf=G.jogadores[fora];
  return{ok:true,entrou:pf,saiu:pd,lesionado:!!(pf&&pf.lesao)};
}

/* Diagnóstico para a interface e para os testes: o que a escalação atual
   cobre e o que deixou de fora. */
function coberturaFuncoes(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  let pen=0;
  const cobertas=new Set(rs.map(p=>p.roleAtual||p.role));
  for(const r of FUNCOES_BASE)if(!cobertas.has(r))pen-=PESO_COBERTURA;
  const dup={};rs.forEach(p=>{const r=p.roleAtual||p.role;dup[r]=(dup[r]||0)+1;});
  for(const r in dup)if(dup[r]>1)pen-=PESO_DUPLICIDADE*(dup[r]-1);
  return pen;
}
function funcoesDescobertas(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  const cobertas=new Set(rs.map(p=>p.roleAtual||p.role));
  return FUNCOES_BASE.filter(r=>!cobertas.has(r));
}
/* Quem está atuando fora da função principal, e quanto isso custa. */
function foraDePosicao(t){
  return (t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .filter(p=>p.roleAtual&&p.roleAtual!==p.role)
    .map(p=>({p,role:p.roleAtual,custo:custoDeFuncao(p,p.roleAtual)}));
}

/* ============================================================
   CONVERSA COM O ELENCO
   ------------------------------------------------------------
   Moral é o segundo maior fator de derrota do jogo — medido, um
   elenco com moral cheia bate um com moral no chão em 85% das
   séries. E até aqui ela só subia e descia sozinha: você
   assistia. Isto é o botão que faltava.

   Duas regras seguram o botão para ele não virar fonte de moral
   de graça:

   1. PROMESSA É DÍVIDA. Prometer titularidade levanta o jogador
      agora e cobra depois se você não cumprir — e cobra mais do
      que levantou. É a única opção com efeito grande, e é a
      única que pode explodir na sua mão.

   2. O PREPARADOR MENTAL PESA. Uma conversa conduzida por um
      clube com psicólogo bom rende mais e erra menos. É o que
      tira o cargo do limbo de "número somado à moral semanal".
   ============================================================ */

const CONVERSA_ESPERA=6;        /* semanas até poder chamar o mesmo jogador */
const PROMESSA_PRAZO=8;         /* semanas para cumprir a titularidade */

/* Por que ele está insatisfeito. Devolve null quando não está. */
function motivoDeInsatisfacao(t,p){
  if(!p||p.timeId!==t.id)return null;
  const titular=(t.titulares||[]).includes(p.id);
  if(p.moral<=0.42)return{id:'moral',peso:3,
    texto:'Moral no chão — '+Math.round(p.moral*100)+'%.'};
  if(!titular&&over(p)>=(t.titulares||[]).reduce((s,i)=>Math.min(s,over(G.jogadores[i])),99))
    return{id:'banco',peso:2,
      texto:'Está no banco sendo melhor que titular seu.'};
  if(p.anuncio)return{id:'anuncio',peso:2,
    texto:'Sabe que está na vitrine.'};
  if(p.contrato<=1)return{id:'contrato',peso:1,
    texto:'Contrato acabando e nada de conversa.'};
  if(p.fadiga>=0.8)return{id:'fadiga',peso:1,
    texto:'Está no limite físico e ninguém perguntou.'};
  return null;
}
function insatisfeitos(t){
  return (t.elenco||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .map(p=>({p,motivo:motivoDeInsatisfacao(t,p)}))
    .filter(x=>x.motivo)
    .sort((a,b)=>b.motivo.peso-a.motivo.peso||a.p.moral-b.p.moral);
}
function podeConversar(p){
  if(!p)return false;
  if(!p.ultimaConversa)return true;
  const passou=(G.ano-p.ultimaConversa.ano)*SEMANAS_ANO+(G.semana-p.ultimaConversa.semana);
  return passou>=CONVERSA_ESPERA;
}
function semanasAteConversar(p){
  if(podeConversar(p))return 0;
  const passou=(G.ano-p.ultimaConversa.ano)*SEMANAS_ANO+(G.semana-p.ultimaConversa.semana);
  return Math.max(1,CONVERSA_ESPERA-passou);
}
/* As opções que fazem sentido para ESTE jogador neste momento. Oferecer
   "prometer titularidade" a quem já é titular seria conversa de menu, não de
   vestiário. */
function opcoesDeConversa(t,p){
  const m=motivoDeInsatisfacao(t,p);
  const titular=(t.titulares||[]).includes(p.id);
  const out=[{id:'franco',rot:'Ser franco',
    dica:'Diz o que você pensa dele, sem promessa. Mexe pouco e nunca vira dívida.'}];
  if(!titular)out.push({id:'promessa',rot:'Prometer titularidade',
    dica:'Levanta muito agora. Se ele não for titular em '+PROMESSA_PRAZO+
         ' semanas, cai o dobro e o vestiário fica sabendo.'});
  out.push({id:'elogio',rot:'Elogiar publicamente',
    dica:'Levanta ele e incomoda quem está atrás na fila.'});
  out.push({id:'cobranca',rot:'Cobrar',
    dica:'Custa moral e rende trabalho: ele treina com mais foco por algumas semanas.'});
  if(m&&m.id==='fadiga')out.push({id:'poupar',rot:'Prometer descanso',
    dica:'Tira o peso da semana: fadiga cai agora, e ele volta inteiro.'});
  return out;
}
/* O modificador do preparador mental, no mesmo ponto neutro das outras
   fórmulas do jogo. */
function pesoMental(t){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  return 1+(((t.staff&&t.staff.mental)||neutro)-neutro)*0.16;
}
/* Conversa de verdade: muda o mundo e devolve o que dizer na tela. */
function conversarCom(t,p,opcao){
  if(!t||!p)return{ok:false,erro:'Ninguém para conversar.'};
  if(p.timeId!==t.id)return{ok:false,erro:p.nome+' não é do seu elenco.'};
  if(!podeConversar(p))
    return{ok:false,erro:'Você conversou com '+p.nome+' há pouco. Espere '+
           semanasAteConversar(p)+' semana(s).'};
  const k=pesoMental(t);
  const antes=p.moral;
  let msg='';
  if(opcao==='franco'){
    /* franco funciona melhor com quem tem cabeça: liderança e consistência */
    const cabeca=(p.at.lider*0.6+p.at.consist*0.4-55)/100;
    p.moral=clamp(p.moral+(0.05+cabeca*0.10)*k,0.05,1);
    msg='Conversa direta com '+p.nome+'. '+(cabeca>0?'Ele entendeu.':'Ele ouviu, mas não gostou muito.');
  }else if(opcao==='promessa'){
    p.moral=clamp(p.moral+0.16*k,0.05,1);
    p.promessa={tipo:'titular',ate:(G.semana||1)+PROMESSA_PRAZO,ano:G.ano,clube:t.id};
    msg=p.nome+' saiu da sala acreditando. Agora é com você.';
  }else if(opcao==='elogio'){
    p.moral=clamp(p.moral+0.10*k,0.05,1);
    /* elogio público é comparação: quem está atrás na fila sente */
    const outros=(t.elenco||[]).map(i=>G.jogadores[i])
      .filter(x=>x&&x.id!==p.id&&!(t.titulares||[]).includes(x.id));
    outros.forEach(x=>{x.moral=clamp(x.moral-0.03,0.05,1);});
    msg='Elogio público a '+p.nome+'. '+(outros.length?'O banco ouviu também.':'');
  }else if(opcao==='cobranca'){
    p.moral=clamp(p.moral-0.07,0.05,1);
    p.cobrado={ate:(G.semana||1)+4,ano:G.ano};
    msg='Cobrança em cima de '+p.nome+'. Ele saiu calado e vai treinar sério.';
  }else if(opcao==='poupar'){
    p.fadiga=clamp(p.fadiga-0.22,0,1);
    p.moral=clamp(p.moral+0.07*k,0.05,1);
    msg=p.nome+' vai ser poupado. Ele agradeceu.';
  }else{
    return{ok:false,erro:'Opção que não existe.'};
  }
  p.ultimaConversa={ano:G.ano,semana:G.semana,opcao};
  return{ok:true,msg,delta:Math.round((p.moral-antes)*100)};
}
/* Cobrança das promessas. Roda uma vez por semana, pelo relógio. */
function cobrarPromessas(t){
  if(!t)return 0;
  let quebradas=0;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.promessa)continue;
    const pr=p.promessa;
    if(pr.clube!==t.id){delete p.promessa;continue;}
    if((t.titulares||[]).includes(p.id)){
      /* cumprida: nada de festa, só a dívida saindo do quadro */
      delete p.promessa;
      continue;
    }
    const venceu=(G.ano>pr.ano)||(G.ano===pr.ano&&G.semana>=pr.ate);
    if(!venceu)continue;
    p.moral=clamp(p.moral-0.32,0.05,1);
    delete p.promessa;
    /* guardado para a renovação: ele lembra na hora de assinar */
    p.promessaQuebrada={ano:G.ano,semana:G.semana};
    quebradas++;
    /* o vestiário toma conhecimento: promessa quebrada não fica entre dois */
    (t.elenco||[]).forEach(i=>{const x=G.jogadores[i];
      if(x&&x.id!==p.id)x.moral=clamp(x.moral-0.04,0.05,1);});
    if(t.id===G.meuTime&&typeof noticia==='function')
      noticia('💬 '+p.nome+' cobrou a promessa de titularidade que não veio. O vestiário ouviu.',{c:'clube',p:[p.id]});
  }
  return quebradas;
}
/* A cobrança que rende: enquanto durar, ele evolui mais. Lido por clock.js. */
function estaCobrado(p){
  if(!p||!p.cobrado)return false;
  const dentro=(G.ano<p.cobrado.ano)||(G.ano===p.cobrado.ano&&G.semana<p.cobrado.ate);
  if(!dentro){delete p.cobrado;return false;}
  return true;
}

/* ============================================================
   RELATÓRIO DE SCOUTING
   ------------------------------------------------------------
   O que você sabe do adversário ANTES de vetar mapa. E o quanto
   você sabe não é de graça: sai do analista e do olheiro.

   Essa é a peça que faz a comissão técnica girar. Antes, o
   analista era um número somado à força de jogo e o olheiro só
   servia para a base — dois cargos que ninguém sentia. Agora o
   relatório tem cinco níveis, e a diferença entre o nível 1 e o
   nível 5 é a diferença entre "eles são fortes" e "eles vão
   banir Icebox primeiro e escalam Sova com um jogador que só
   tem 40 de familiaridade".

   Nada aqui sorteia: o relatório é desenhado na tela, e a tela
   não pode tocar no gerador semeado do motor. Onde o relatório
   precisa ser IMPRECISO — nível baixo mostrando número redondo
   demais — a imprecisão vem de um embaralhador determinístico
   dos ids, não de rnd().
   ============================================================ */

const SCOUT_MAX=5;
/* Analista pesa mais que olheiro: ler o adversário é o trabalho dele. O
   olheiro entra porque é quem assiste os outros clubes — e é o que finalmente
   dá a ele uma função fora da base. */
function nivelScout(t){
  if(!t||!t.staff)return 1;
  const a=t.staff.analista||1, o=t.staff.olheiro||1;
  return clamp(Math.round((a*1.3+o*0.7)/2),1,SCOUT_MAX);
}
/* Ruído determinístico: mesma pergunta, mesma resposta, sem gerador semeado. */
function borrar(chave,amplitude){
  let h=2166136261;
  const s=String(chave);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  const u=((h>>>0)%1000)/1000;      /* 0..1 estável */
  return (u-0.5)*2*amplitude;
}
/* Número que o relatório mostra: exato no nível alto, arredondado e torto no
   nível baixo. Devolve null quando o nível não dá nem para chutar. */
function numeroBorrado(valor,nivel,chave,minimo){
  if(nivel>=(minimo||3)+2)return valor;
  if(nivel<(minimo||3))return null;
  const amp=nivel>=(minimo||3)+1?0.8:1.8;
  return valor+borrar(chave,amp);
}
function palavraAfinidade(v){
  if(v>=3.5)return'casa deles';
  if(v>=1.5)return'confortável';
  if(v>=-0.5)return'neutro';
  if(v>=-2.5)return'incomodados';
  return'fogem dele';
}
function palavraForma(f){
  if(f>=0.78)return'em alta';
  if(f>=0.6)return'regular';
  if(f>=0.45)return'oscilando';
  return'em baixa';
}
function palavraFadiga(f){
  if(f>=0.72)return'pernas pesadas';
  if(f>=0.5)return'rodados';
  if(f>=0.3)return'inteiros';
  return'descansados';
}
/* Últimos resultados do adversário, do mais recente para o mais antigo.
   `jogos` no h2h é uma CONTAGEM, não uma lista — a lista é `ultimos`. Ler o
   número como se fosse array estourava a tela inteira do relatório. */
function ultimosDe(t,n){
  const out=[];
  for(const par in (G.h2h||{})){
    const reg=G.h2h[par];
    if(!reg||(reg.a!==t.id&&reg.b!==t.id))continue;
    const rival=reg.a===t.id?reg.b:reg.a;
    for(const u of (reg.ultimos||[]))
      out.push({ano:u.ano,ctx:u.ctx,rival,venceu:u.v===t.id});
  }
  return out.sort((x,y)=>y.ano-x.ano).slice(0,n||5);
}

/* ---------- o relatório ----------
   Devolve dados, não HTML: a tela decide como mostrar, e o teste consegue
   perguntar "o nível 2 vazou número que só o nível 4 deveria ter?". */
function relatorioScout(meuT,advT,bo){
  const nv=nivelScout(meuT);
  const pool=(G.mapasAtivos||MAP_POOL).slice();
  const surpAdv=(typeof surpresaDaComp==='function')
    ? pool.reduce((s,mp)=>s+surpresaDaComp(advT,mp),0)/Math.max(1,pool.length) : 0;
  /* Comp fora do manual esconde: o que o adversário faz de estranho, o seu
     analista não tem como ter preparado. */
  const nvComp=clamp(Math.round(nv-surpAdv*2.2),1,SCOUT_MAX);

  const tit=(advT.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const forma=tit.length?tit.reduce((s,p)=>s+p.forma,0)/tit.length:0.6;
  const fadiga=tit.length?tit.reduce((s,p)=>s+p.fadiga,0)/tit.length:0;

  const mapas=pool.map(mp=>{
    const real=afinidadeElenco(advT,mp)+ (advT.mapPref[mp]||0)*0.5;
    return{
      mapa:mp,
      palavra:nv>=2?palavraAfinidade(real):null,
      valor:numeroBorrado(real,nv,advT.id+mp+G.ano,3),
      /* comp provável: só a partir do nível 4, e menos se eles surpreendem */
      comp:nvComp>=4&&typeof compEscalada==='function'
        ? compEscalada(advT,mp).map(l=>({nome:l.p.nome,ag:l.ag,
            nivel:nvComp>=5?Math.round(l.nivel):null})) : null
    };
  }).sort((a,b)=>(b.valor!==null&&a.valor!==null)?b.valor-a.valor:0);

  const chave=tit.slice().sort((a,b)=>over(b)-over(a))[0]||null;
  const lesionados=(advT.elenco||[]).map(i=>G.jogadores[i]).filter(p=>p&&p.lesao);

  return{
    nivel:nv, nivelComp:nvComp, surpresaDeles:surpAdv,
    clube:advT, bo:bo||3,
    campanha:{v:advT.temporada?advT.temporada.v:0, d:advT.temporada?advT.temporada.d:0,
              pts:advT.temporada?advT.temporada.pts:0},
    h2h:(typeof confronto==='function')?confronto(meuT.id,advT.id):null,
    ultimos:nv>=3?ultimosDe(advT,5):null,
    forma:{palavra:palavraForma(forma), valor:nv>=4?Math.round(forma*100):null},
    fadiga:{palavra:nv>=3?palavraFadiga(fadiga):null, valor:nv>=5?Math.round(fadiga*100):null},
    mapas,
    /* ordem de veto provável: só o nível 5 enxerga */
    vetoProvavel:nv>=5?ordemDeVetoProvavel(advT,pool):null,
    chave:nv>=3&&chave?{nome:chave.nome,role:chave.roleAtual||chave.role,
                        over:over(chave),acs:chave.temp&&chave.temp.maps?Math.round(chave.temp.acs/chave.temp.maps):null}:null,
    lesionados:nv>=4?lesionados.map(p=>({nome:p.nome,semanas:p.lesao})):null,
    tatica:nv>=4?{agres:advT.tatica.agres,foco:advT.tatica.foco}:null,
    sinergia:nv>=5?advT.sinergia:null
  };
}
/* O que eles provavelmente banem primeiro e escolhem primeiro. É leitura pura
   da mesma conta que a IA usa no veto — sem o ruído, que é justamente o que o
   relatório não consegue prever. */
function ordemDeVetoProvavel(t,pool){
  const g=m=>(typeof gostaDeMapa==='function')?gostaDeMapa(t,m):0;
  const ord=pool.slice().sort((a,b)=>g(b)-g(a));
  return{picks:ord.slice(0,2),bans:ord.slice(-2).reverse()};
}
/* Frase de abertura: o relatório tem de dizer alguma coisa mesmo no nível 1,
   senão contratar analista vira abstração. */
function resumoScout(r){
  const t=r.clube;
  if(r.nivel<=1)
    /* nomeLiga() recebe o CLUBE, não a região — passar a região estourava a
       tela inteira do relatório no nível 1, que é justamente o nível de quem
       ainda não contratou analista nenhum. */
    return 'Sabemos o essencial: '+t.nome+', '+
           ((typeof nomeLiga==='function')?nomeLiga(t):t.regiao)+
           ', '+r.campanha.v+' vitórias e '+r.campanha.d+' derrotas na temporada. '+
           'Com um analista melhor, saberíamos em que mapa eles moram.';
  const melhor=r.mapas[0], pior=r.mapas[r.mapas.length-1];
  let s=t.nome+' está '+r.forma.palavra+'. ';
  if(melhor&&pior)s+='Moram em '+melhor.mapa+' e fogem de '+pior.mapa+'. ';
  if(r.fadiga.palavra)s+='Chegam '+r.fadiga.palavra+'. ';
  if(r.nivel>=4&&r.tatica)
    s+='Jogam com agressividade '+r.tatica.agres+' e foco '+
       ({execucao:'em execuções',retake:'em retakes',default:'equilibrado'}[r.tatica.foco]||r.tatica.foco)+'. ';
  if(r.surpresaDeles>=0.45)
    s+='Atenção: eles fogem do meta nas comps, e é o que o nosso analista tem menos como prever.';
  return s.trim();
}

/* ---------- a IA também escolhe tática ----------
   Sem isto o mundo inteiro ficaria em default e agressividade 3 para sempre, e
   o pedra-papel-tesoura do foco não teria com quem jogar: acertar o contra-foco
   seria acertar contra ninguém.

   E a IA lê o adversário com a MESMA régua que você: um clube com analista
   bom escolhe o foco que bate no seu; um clube com analista ruim escolhe pelo
   próprio perfil e torce. É o que faz a comissão valer dos dois lados. */
function proximoAdversarioDe(t){
  const i=blocoDaSemana(G.semana||1);
  const b=i==null?null:G.calendario[i];
  if(!b)return null;
  for(const s of b.stages){
    if(s.feito)continue;
    const par=(s.rodadaAtual||[]).find(x=>x.includes(t.id));
    if(par)return G.times[par[0]===t.id?par[1]:par[0]]||null;
  }
  return null;
}
function focoNatural(t){
  const perfil=(typeof perfilAgressivo==='function')?perfilAgressivo(t):0;
  return perfil>=3?'execucao':perfil<=-3?'retake':'default';
}
function taticaIA(t){
  if(!t||t.id===G.meuTime)return null;
  /* agressividade: o elenco decide, porque é o elenco que paga */
  const perfil=(typeof perfilAgressivo==='function')?perfilAgressivo(t):0;
  t.tatica.agres=clamp(3+Math.round(perfil/5),1,5);
  const adv=proximoAdversarioDe(t);
  const nv=nivelScout(t);
  /* Só quem tem leitura escolhe pelo adversário. Abaixo do nível 3 o clube
     joga o que ele é, que é exatamente o que um clube sem analista faz. */
  if(adv&&nv>=3){
    const contra={default:'execucao',retake:'default',execucao:'retake'};
    t.tatica.foco=contra[adv.tatica.foco||'default']||focoNatural(t);
  }else{
    t.tatica.foco=focoNatural(t);
  }
  return t.tatica;
}

/* ============================================================
   VETO INTERATIVO
   ------------------------------------------------------------
   O ritual do Valorant: dois bans, os picks, e o decider que
   ninguém quis vetar. Antes isso acontecia dentro do motor e
   você só via o resultado; agora, na SUA partida, a vez é sua.

   Duas regras que valem a pena guardar:

   1. A vez da máquina NÃO SORTEIA. O veto acontece a partir de
      um clique na tela, e o gerador semeado do motor é do motor:
      se cada clique consumisse sorteio, a mesma run daria mundos
      diferentes conforme você clicasse rápido ou devagar. A IA
      aqui usa gostaDeMapa(), que é leitura pura — e é a mesma
      conta que o relatório de scouting nível 5 te mostra. Isso é
      de propósito: pagar analista é o que te deixa prever.

   2. O estado é um objeto simples e o resultado sai no MESMO
      formato do veto automático ({seq,mapas}), então o motor não
      sabe nem precisa saber se quem escolheu foi você.
   ============================================================ */

function iniciarVeto(meuId,advId,bo,euComeco){
  const pool=(G.mapasAtivos||MAP_POOL).slice();
  return{
    meuId,advId,bo:bo||3,
    /* lado 0 é quem abre o veto. Em torneio quem abre é o cabeça de chave;
       aqui é quem está listado primeiro, igual ao veto automático. */
    euSouLado:euComeco?0:1,
    pool, passos:comLados(roteiroVeto(bo||3,pool.length)),
    i:0, seq:[], fim:false
  };
}
/* ---------- lado de início ----------
   No circuito quem escolhe o mapa não escolhe o lado: o outro time decide se
   começa atacando ou defendendo. No decider, escolhe quem NÃO fez o último
   ban. O passo de lado entra logo depois do mapa a que ele se refere, e o
   lado fica gravado no próprio mapa da sequência (lado0 = lado de início de
   quem abriu o veto, que é o time A da série). */
function comLados(passos){
  const out=[];
  let ultimoBan=0;
  for(const p of passos){
    out.push(p);
    if(p.tipo==='ban')ultimoBan=p.lado;
    if(p.tipo==='pick')out.push({tipo:'lado',lado:1-p.lado});
    if(p.tipo==='dec')out.push({tipo:'lado',lado:1-ultimoBan});
  }
  return out;
}
const outroLado=l=>l==='atk'?'def':'atk';
/* O lado em que o clube prefere começar: o mais forte dele naquele mapa. Lê
   forcaTime, que não sorteia. */
function ladoPreferido(t,mapa){
  if(!t||typeof forcaTime!=='function')return 'def';
  return forcaTime(t,mapa,'atk')>forcaTime(t,mapa,'def')?'atk':'def';
}
/* O mapa cujo lado está sendo decidido: o último que não foi banido. */
function vetoMapaDoLado(V){
  for(let i=V.seq.length-1;i>=0;i--)if(V.seq[i].tipo!=='ban')return V.seq[i];
  return null;
}
function vetoPasso(V){return V&&!V.fim?V.passos[V.i]:null;}
function vetoMinhaVez(V){
  const p=vetoPasso(V);
  return !!p&&p.tipo!=='dec'&&p.lado===V.euSouLado;
}
function vetoRestantes(V){
  const usados=new Set(V.seq.map(x=>x.m));
  return V.pool.filter(m=>!usados.has(m));
}
/* O mapa que a máquina escolheria agora. Leitura pura, sem sorteio. */
function vetoEscolhaIA(V){
  const p=vetoPasso(V);
  if(!p)return null;
  const t=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
  if(p.tipo==='lado'){const x=vetoMapaDoLado(V);return x?ladoPreferido(t,x.m):'def';}
  const restam=vetoRestantes(V);
  if(!restam.length)return null;
  const ord=restam.slice().sort((a,b)=>gostaDeMapa(t,b)-gostaDeMapa(t,a));
  return p.tipo==='ban'?ord[ord.length-1]:ord[0];
}
/* Aplica uma escolha. Devolve o que aconteceu, para a tela narrar. */
function vetoEscolher(V,mapa){
  const p=vetoPasso(V);
  if(!p||V.fim)return null;
  if(p.tipo==='lado'){
    const x=vetoMapaDoLado(V);
    const escolha=(mapa==='atk'||mapa==='def')?mapa:vetoEscolhaIA(V);
    const dono=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
    if(x){x.lado0=p.lado===0?escolha:outroLado(escolha);x.ladoPor=dono.tag;}
    V.i++;
    if(V.i>=V.passos.length)V.fim=true;
    return{m:x&&x.m,tipo:'lado',lado:escolha,meu:p.lado===V.euSouLado};
  }
  const restam=vetoRestantes(V);
  if(p.tipo==='dec'){
    const m=restam[0];
    V.seq.push({m,tipo:'dec',t:'—'});
    V.i++;
    if(V.i>=V.passos.length)V.fim=true;
    return{m,tipo:'dec'};
  }
  const m=(mapa&&restam.includes(mapa))?mapa:vetoEscolhaIA(V);
  if(!m)return null;
  const dono=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
  V.seq.push({m,tipo:p.tipo,t:dono.tag,meu:p.lado===V.euSouLado});
  V.i++;
  if(V.i>=V.passos.length)V.fim=true;
  return{m,tipo:p.tipo,meu:p.lado===V.euSouLado};
}
/* Resolve tudo o que não é seu até chegar a sua vez (ou ao fim). */
function vetoAvancarAteMim(V){
  let voltas=0;
  while(!V.fim&&!vetoMinhaVez(V)&&voltas++<40)vetoEscolher(V,null);
  return V;
}
/* No formato que simPartida consome. */
function vetoResultado(V){
  const jogados=V.seq.filter(x=>x.tipo!=='ban');
  return{seq:V.seq,mapas:jogados.map(x=>x.m),lados:jogados.map(x=>x.lado0||null)};
}
/* Um veto inteiro resolvido pela máquina, sem sorteio — usado quando você
   desliga o veto manual e quando o teste precisa de um veto reprodutível. */
function vetoAutomatico(meuId,advId,bo,euComeco){
  const V=iniciarVeto(meuId,advId,bo,euComeco);
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  return vetoResultado(V);
}

/* ============================================================
   MOTOR DE PARTIDA
   ============================================================ */
/* Condição do jogador no dia. E-sports é cabeça antes de perna: o desgaste
   tira no máximo 8% (era 22%) e o mental — confiança e moral, ver
   core/vestiario.js — mexe até 22% (a moral sozinha mexia 14%). As bases
   foram acertadas para um jogador típico (desgaste 0,3, mental 0,6) render o
   mesmo de antes: o que muda é o que pesa, não o nível do circuito. */
function condicao(p){
  const mental=typeof mentalDe==='function'?mentalDe(p):p.moral;
  return (0.88 + p.forma*0.24) * (1 - p.fadiga*0.08) * (0.83 + mental*0.22);
}
/* ---------- variância ----------
   Dois níveis, de propósito:
     RUIDO_ROUND  vale para todos e representa o que o round tem de sorte.
     desvioDoDia  é o time chegar bem ou mal, e varia com a consistência.
   Separar os dois é o que faz a consistência importar: o primeiro se anula
   ao longo do mapa, o segundo não. */
const RUIDO_ROUND=9;
const DIA_MAX=9.5;   /* consistência 40: time que oscila muito */
const DIA_MIN=2.0;   /* consistência 99: time que não tem dia ruim */
function desvioDoDia(t){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(!tit.length)return (DIA_MAX+DIA_MIN)/2;
  const c=tit.reduce((s,p)=>s+p.at.consist,0)/tit.length;
  return DIA_MIN+(DIA_MAX-DIA_MIN)*clamp((99-c)/59,0,1);
}

function forcaTime(t,mapa,lado){
  const rs=t.titulares.map(id=>G.jogadores[id]).filter(Boolean);
  if(!rs.length)return 40;
  let mira=0,util=0,visao=0,base=0;
  /* equipamentos e sala de análise: pouco, mas em todo round */
  const fe=typeof fatorJogoEst==='function'?fatorJogoEst(t):1;
  rs.forEach(p=>{
    /* entrar machucado custa: é o preço da escalação de emergência */
    const c=condicao(p)*(p.lesao?PENA_LESAO:1)*fe;
    /* over NA FUNÇÃO EM QUE ELE VAI JOGAR. Sem isso a função secundária seria
       almoço grátis: o clube cobriria qualquer buraco sem pagar nada, e a
       escalação ótima viraria "os cinco de maior over, sempre". */
    base+=overComo(p,p.roleAtual||p.role)*c;
    mira+=(p.at.mira*.6+p.at.reflexo*.4)*c;
    util+=p.at.util*c; visao+=p.at.visao*c;
  });
  /* Divide pelo número de titulares DE VERDADE. O 5 fixo assumia que o time
     sempre tem cinco; quando não tem — um elenco curto por corte de folha —
     a força despencava para perto de zero e o jogo virava atropelo, em vez de
     um time desfalcado jogando mal. */
  const n=rs.length;
  base/=n;mira/=n;util/=n;visao/=n;
  /* jogar com menos de cinco é penalidade, e uma grande */
  if(n<5){const falta=(5-n)/5;base*=1-falta*0.55;mira*=1-falta*0.5;util*=1-falta*0.5;visao*=1-falta*0.5;}
  const igl=G.jogadores[t.igl];
  const iglB=igl?(igl.at.lider-60)*0.10:-2;
  /* Escrito em torno do mesmo ponto neutro que clock.js usa. O -4 antigo era
     exatamente isto: (1.1+0.9)*NIVEL_NEUTRO. Fica explícito para as três
     fórmulas que leem comissão não saírem de novo do compasso. */
  const neutroS=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  const staffB=(t.staff.tecnico*1.1+t.staff.analista*.9)-(1.1+0.9)*neutroS;
  const sinB=(t.sinergia-55)*0.09;
  /* O mapa deixou de ser só do clube: metade vem da identidade tática do time
     e metade dos cinco que entram em quadra. Os pesos somam perto do que o
     termo valia sozinho, para não inflar de repente a importância do mapa. */
  const mapB=(t.mapPref[mapa]||0)*0.6 + afinidadeElenco(t,mapa)*0.6;
  let f = base*0.62 + mira*0.16 + util*0.11 + visao*0.11;
  f += iglB+staffB+sinB+mapB;
  f += lado==='atk' ? (mira-base)*0.10 : (visao-base)*0.10;
  f += pesoAgressividade(t,mapa,lado);
  f += pesoFoco(t,mapa,lado);
  f += coberturaFuncoes(t);
  /* A comp de agentes entra aqui: familiaridade de quem pegou o boneco, força
     do boneco no meta de hoje, e os buracos da composição. Sem este termo,
     treinar agente não mudava um round — a familiaridade existia só na ficha. */
  if(typeof pesoComp==='function')f+=pesoComp(t,mapa);
  /* Viés de lado do mapa, do dado real: em Abyss o ataque ganha 55% dos
     rounds, em Ascent 47%. É o que faz o mapa mudar de valor conforme o lado. */
  if(typeof viesLado==='function')f+=viesLado(mapa,lado);
  return f;
}
/* ---------- táticas ----------
   Medido antes de mexer, com a régua já consertada: agressividade 5 valia
   +2,4 e agressividade 1 valia −1,4; foco execução valia +3,0 e retake −0,2;
   e escolher "o foco certo para o mapa" dava −2,4. Ou seja: dois botões com
   uma resposta certa fixa e um terceiro que não fazia nada. Isso não é
   decisão, é imposto — todo clube do mundo deveria estar em agressividade 5 e
   execução, e estaria.

   O conserto tem duas partes, e as duas se apoiam em coisa que já existe:

   1. O MAPA opina. O viés de lado é dado real (MAPA_ATK, média das três ligas
      em 2026): em Abyss o ataque ganha 55% dos rounds e em Ascent 47%. Ser
      agressivo em mapa de ataque rende; ser agressivo em mapa de defesa
      cobra. A resposta certa passa a depender de onde você está jogando.

   2. O ADVERSÁRIO opina. Foco vira pedra-papel-tesoura: execução atropela
      quem está em default, default lê quem espera retake, e retake come
      execução. E como o relatório de scouting nível 4 mostra o foco deles, a
      comissão que você paga é o que transforma isso em leitura em vez de
      chute. É o mesmo motivo pelo qual existe analista no jogo. */
const TATICA_AGRES=0.85;      /* por ponto acima ou abaixo de 3, no lado */
const TATICA_PERFIL=0.035;    /* o quanto o perfil do elenco decide o resto */
const TATICA_LEITURA=0.8;     /* o que vale acertar o contra-foco */
/* Agressividade não pode ter resposta certa fixa, e a primeira tentativa ainda
   tinha: o lado que ela ajudava rendia mais do que o lado que ela cobrava, e
   agressividade 5 era de graça. Agora o efeito de LADO é simétrico — some no
   mapa inteiro, porque todo time ataca metade dos rounds — e o que sobra é o
   seu ELENCO. Cinco jogadores de mira e reflexo ganham jogando para frente;
   cinco de utilidade e visão perdem. A escolha passa a ser sobre o time que
   você montou, e não sobre qual número é maior. */
function perfilAgressivo(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  if(!rs.length)return 0;
  let duelo=0,controle=0;
  rs.forEach(p=>{duelo+=p.at.mira*0.5+p.at.reflexo*0.3+p.at.mov*0.2;
                 controle+=p.at.util*0.5+p.at.visao*0.4+p.at.consist*0.1;});
  return (duelo-controle)/rs.length;   /* tipicamente −12 a +12 */
}
function pesoAgressividade(t,mapa,lado){
  const a=(t.tatica.agres||3)-3;
  /* lado: simétrico de propósito */
  const porLado=lado==='atk'?a*TATICA_AGRES:-a*TATICA_AGRES;
  /* elenco: é aqui que mora a decisão */
  return porLado+a*perfilAgressivo(t)*TATICA_PERFIL;
}
function pesoFoco(t,mapa,lado){
  const f=t.tatica.foco||'default';
  const pend=(typeof pendorDoMapa==='function')?pendorDoMapa(mapa):0;
  if(f==='execucao')return lado==='atk'?1.1+pend*0.5:-0.6;
  if(f==='retake')  return lado==='def'?1.1-pend*0.5:-0.6;
  return 0.45;   /* default não brilha em lado nenhum e não perde em nenhum */
}
/* Pedra-papel-tesoura do foco. Precisa dos DOIS times, então mora fora de
   forcaTime e entra em abrirMapa, onde os dois estão à mão. */
const FOCO_VENCE={execucao:'default',default:'retake',retake:'execucao'};
function vantagemTatica(t,adv){
  const meu=t.tatica.foco||'default', dele=adv.tatica.foco||'default';
  if(meu===dele)return 0;
  return FOCO_VENCE[meu]===dele?TATICA_LEITURA:-TATICA_LEITURA;
}
function pesoFrag(p){return (p.at.mira*.5+p.at.reflexo*.3+p.at.mov*.2)*FRAG_W[p.role]*condicao(p);}

/* Quanto um clube quer um mapa. Sem ruído: é a leitura que o relatório de
   scouting mostra e a que o veto interativo usa para a vez da máquina — se
   sorteasse, um clique no veto mexeria no gerador semeado do motor. */
function gostaDeMapa(t,m){
  return (t.mapPref[m]||0)*0.6+afinidadeElenco(t,m)*0.6;
}
/* A sequência de pick/ban, no formato do circuito:
     Bo1  — bans alternados até sobrar um.
     Bo3  — ban, ban, pick, pick, e bans até sobrar o decider.
     Bo5  — ban, ban, quatro picks, e o que sobra é o decider.
   `passos` descreve isso sem números mágicos espalhados, e é o mesmo roteiro
   que o veto automático e o interativo seguem. */
function roteiroVeto(bo,tamPool){
  const picks = bo===1?0 : bo===3?2 : 4;
  const passos=[];
  if(picks){passos.push({tipo:'ban',lado:0});passos.push({tipo:'ban',lado:1});}
  for(let i=0;i<picks;i++)passos.push({tipo:'pick',lado:i%2});
  let restam=tamPool-passos.length, v=0;
  while(restam>1){passos.push({tipo:'ban',lado:v%2});restam--;v++;}
  passos.push({tipo:'dec',lado:null});
  return passos;
}
function veto(A,B,bo){
  const pool=G.mapasAtivos.slice();
  const seq=[];
  /* No pick/ban o clube também olha o próprio elenco: escolher um mapa que o
     time gosta e os jogadores odeiam era exatamente o tipo de decisão que só a
     preferência do clube conseguia produzir. */
  const gosta=(t,m)=>gostaDeMapa(t,m)+gauss(0,1.5);
  const banir=t=>{pool.sort((a,b)=>gosta(t,a)-gosta(t,b));const m=pool.shift();seq.push({m,tipo:'ban',t:t.tag});};
  /* quem escolhe o mapa entrega o lado ao outro, como no circuito */
  const escolher=t=>{pool.sort((a,b)=>gosta(t,b)-gosta(t,a));const m=pool.shift();
    const outro=t===A?B:A, l=ladoPreferido(outro,m);
    seq.push({m,tipo:'pick',t:t.tag,lado0:outro===A?l:(l==='atk'?'def':'atk'),ladoPor:outro.tag});};
  const ordem=[A,B];
  const picks = bo===1?0 : bo===3?2 : 4;
  /* dois bans de abertura, depois os picks alternados */
  if(picks){banir(A);banir(B);}
  for(let i=0;i<picks;i++)escolher(ordem[i%2]);
  /* bans alternados até sobrar um: o decider é o mapa que ninguém quis vetar.
     Fazer isso por contagem (e não por número fixo de bans) mantém o veto
     correto com qualquer tamanho de pool. */
  let v=0,ultimo=null;
  while(pool.length>1){ultimo=ordem[v%2];banir(ultimo);v++;}
  /* no decider o lado é de quem não fez o último ban */
  const dono=ultimo===A?B:A, ld=ladoPreferido(dono,pool[0]);
  seq.push({m:pool[0],tipo:'dec',t:'—',lado0:dono===A?ld:(ld==='atk'?'def':'atk'),ladoPor:dono.tag});
  const jogados=seq.filter(s=>s.tipo!=='ban');
  return{seq,mapas:jogados.map(s=>s.m),lados:jogados.map(s=>s.lado0||null)};
}

/* ============================================================
   O MAPA, ROUND A ROUND
   ------------------------------------------------------------
   simMapa() era um laço fechado: entrava time e mapa, saía
   placar. Isso bastava enquanto a transmissão ao vivo só
   REVELAVA o que já tinha acontecido — mas pedido de tempo
   dentro de um resultado já calculado é teatro.

   Então o laço virou três peças: abrirMapa() monta o estado,
   passoRound() joga UM round, e fecharMapa() devolve o mesmo
   objeto de sempre. simMapa() continua existindo e continua
   sendo o laço — só que agora escrito em cima delas, então o
   motor é literalmente o mesmo (conferido round a round contra
   uma fotografia dos resultados anteriores). A diferença é que
   a tela também consegue conduzir, e aí o tempo pedido no 3-8
   muda o que vem depois.
   ============================================================ */
function abrirMapa(A,B,mapa,ladoInicialA){
  const st={};
  [A,B].forEach(t=>t.titulares.forEach(id=>{
    st[id]={k:0,d:0,a:0,fk:0,fd:0,cl:0,rounds:0};
  }));
  /* O "dia" do time: um deslocamento sorteado uma vez e válido para o mapa
     inteiro. É AQUI que a consistência pesa, e não no ruído por round.

     Medido antes de mexer: variar a consistência de 40 a 95 mudava o σ do
     ruído por round de 20.3 para 5.0 — quatro vezes — e a vitória do favorito
     ia de 77.1% para 80.7%. Três pontos. O motivo é que ruído por round é
     simétrico e some na média de vinte e tantos rounds; o atributo custava o
     mesmo que qualquer outro no over e não entregava quase nada.

     Dia ruim não se anula: contamina o mapa todo. Amarrar consistência a ele
     é o que dá sentido à palavra — time consistente não tem dia ruim. */
  const diaA=gauss(0,desvioDoDia(A)),diaB=gauss(0,desvioDoDia(B));
  const vA=vantagemTatica(A,B), vB=-vA;
  const fA={atk:forcaTime(A,mapa,'atk')+vA,def:forcaTime(A,mapa,'def')+vA};
  const fB={atk:forcaTime(B,mapa,'atk')+vB,def:forcaTime(B,mapa,'def')+vB};
  /* Quem começa atacando é sorteado, como no round de faca.

     Antes era sempre o time A, e isso valia 6 pontos percentuais de vitória:
     com elencos IDÊNTICOS o A ganhava 43% dos mapas. O lado mais fraco vinha
     primeiro para ele sempre, e quem cai atrás no primeiro tempo às vezes
     perde o mapa antes de chegar ao tempo em que era forte. Estar listado
     primeiro numa tabela não pode custar partida. */
  const sorteio=rnd()<0.5?'atk':'def';
  /* O lado escolhido no veto vale mais que a moeda. O sorteio acontece mesmo
     assim, para o resto do mapa consumir o gerador na mesma ordem de sempre. */
  const ladoA=(ladoInicialA==='atk'||ladoInicialA==='def')?ladoInicialA:sorteio;
  const M={A,B,mapa,st,sa:0,sb:0,hist:[],
         ecoA:2,ecoB:2,perdaA:0,perdaB:0,
         diaA,diaB,fA,fB,ladoA,r:0,fim:false,
         /* pedido de tempo: dois por mapa para cada lado, como no jogo */
         temposA:TEMPOS_POR_MAPA,temposB:TEMPOS_POR_MAPA,bonusA:0,bonusB:0};
  /* Tática por mapa (Treinamento & Preparação): o que você marcou para este
     mapa vale desde o primeiro round, por cima da tática geral do clube — e o
     pedido de tempo continua mexendo por cima dela. Sem tática por mapa, nada
     muda: as forças acima já são as finais. */
  const tmA=A.taticaMapa&&A.taticaMapa[mapa], tmB=B.taticaMapa&&B.taticaMapa[mapa];
  if(tmA||tmB){
    if(tmA)M.tatA=Object.assign({},tmA);
    if(tmB)M.tatB=Object.assign({},tmB);
    _recalcularMapa(M);
  }
  return M;
}
const TEMPOS_POR_MAPA=2;
/* Quanto o tempo pedido vale, e por quantos rounds. Não é um botão de vencer:
   é um respiro que corta a bola de neve do eco e da cabeça. */
const TEMPO_BONUS=6.5;
const TEMPO_ROUNDS=2;
function podePedirTempo(M,ehA){
  if(!M||M.fim)return false;
  return (ehA?M.temposA:M.temposB)>0;
}
/* O que se faz com o tempo. Antes ele era um bônus só; agora é a hora em que
   o foco tático e a agressividade viram resposta ao que está acontecendo, em
   vez de preferência marcada antes da partida. Mudança de tática vale até o
   fim do mapa; o próximo mapa volta ao que está na tela de Táticas. */
const TEMPO_OPCOES=[
  {id:'acalmar',  rot:'Acalmar o time',   dica:'Corta a bola de neve: dois rounds de respiro.'},
  {id:'agressivo',rot:'Partir para cima', dica:'Agressividade +2 até o fim do mapa.'},
  {id:'travado',  rot:'Jogar travado',    dica:'Agressividade −2 até o fim do mapa.'},
  {id:'execucao', rot:'Foco: execução',   dica:'Atropela quem está em default; perde para retake.'},
  {id:'default',  rot:'Foco: default',    dica:'Lê quem espera retake; perde para execução.'},
  {id:'retake',   rot:'Foco: retake',     dica:'Come execução; perde para default.'}
];
/* Recalcula a força dos dois lados com a tática de mapa em vigor. Lê
   forcaTime e vantagemTatica, que não sorteiam. */
function _recalcularMapa(M){
  const{A,B}=M;
  const tA=A.tatica,tB=B.tatica;
  A.tatica=Object.assign({},tA,M.tatA||{});
  B.tatica=Object.assign({},tB,M.tatB||{});
  try{
    const vA=vantagemTatica(A,B), vB=-vA;
    M.fA={atk:forcaTime(A,M.mapa,'atk')+vA,def:forcaTime(A,M.mapa,'def')+vA};
    M.fB={atk:forcaTime(B,M.mapa,'atk')+vB,def:forcaTime(B,M.mapa,'def')+vB};
  }finally{A.tatica=tA;B.tatica=tB;}
}
/* Devolve o que aconteceu, para a narração ter o que dizer. */
function pedirTempo(M,ehA,opcao){
  if(!podePedirTempo(M,ehA))return null;
  const op=TEMPO_OPCOES.find(o=>o.id===opcao)||TEMPO_OPCOES[0];
  if(ehA)M.temposA--;else M.temposB--;
  if(op.id==='acalmar'){
    if(ehA)M.bonusA=TEMPO_ROUNDS;else M.bonusB=TEMPO_ROUNDS;
  }else{
    const t=ehA?M.A:M.B;
    const atual=Object.assign({},t.tatica,(ehA?M.tatA:M.tatB)||{});
    const mud=op.id==='agressivo'?{agres:clamp((atual.agres||3)+2,1,5)}
             :op.id==='travado'?{agres:clamp((atual.agres||3)-2,1,5)}
             :{foco:op.id};
    if(ehA)M.tatA=Object.assign({},M.tatA||{},mud);else M.tatB=Object.assign({},M.tatB||{},mud);
    _recalcularMapa(M);
  }
  return{ehA,opcao:op.id,rot:op.rot,restam:ehA?M.temposA:M.temposB,rounds:TEMPO_ROUNDS};
}
/* A comissão pede tempo sozinha quando o time sangra: quatro rounds
   perdidos em sequência. Vale para todo clube que não está sendo conduzido
   por você na tela. É a mesma regra para os dois lados, então não desloca a
   vitória de ninguém — só corta a bola de neve, como no jogo de verdade. */
const TEMPO_IA_SEQUENCIA=4;
function tempoDaComissao(M){
  for(const ehA of [true,false]){
    if(ehA?M.manualA:M.manualB)continue;
    if((ehA?M.seqPerdaA:M.seqPerdaB)>=TEMPO_IA_SEQUENCIA&&podePedirTempo(M,ehA)){
      pedirTempo(M,ehA,'acalmar');
      if(ehA)M.seqPerdaA=0;else M.seqPerdaB=0;
      return ehA?'A':'B';
    }
  }
  return null;
}
const ecoDeN=n=>n===0?2:n===1?(rnd()<.6?0:1):n===2?(rnd()<.5?1:2):2;
/* Um round. Toda a aleatoriedade do mapa passa por aqui, na mesma ordem de
   sempre — é o que garante que o laço reescrito dê exatamente o resultado
   antigo. */
function passoRound(M){
  if(M.fim)return null;
  const{A,B}=M;
  M.r++;
  const r=M.r;
  if(r===13)M.ladoA=M.ladoA==='atk'?'def':'atk';
  if(r>24&&(r-25)%2===0)M.ladoA=M.ladoA==='atk'?'def':'atk';
  const ladoA=M.ladoA, ladoB=ladoA==='atk'?'def':'atk';
  const pistol=(r===1||r===13||(r>24&&(r-25)%2===0));
  let dif=M.fA[ladoA]-M.fB[ladoB]+M.diaA-M.diaB;
  const ecoAntesA=M.ecoA, ecoAntesB=M.ecoB;
  if(!pistol)dif+=(M.ecoA-M.ecoB)*2.0;
  if(pistol)dif+=(((M.tatA&&M.tatA.agres)||A.tatica.agres)-((M.tatB&&M.tatB.agres)||B.tatica.agres))*1.2;
  /* Round é aleatório por natureza, e essa aleatoriedade é a mesma para
     todo mundo: um único parâmetro, sem depender de atributo. */
  dif+=gauss(0,RUIDO_ROUND);
  if(r>=22||Math.abs(M.sa-M.sb)<=1&&r>18){
    const clA=A.titulares.reduce((s,i)=>s+G.jogadores[i].at.clutch,0)/5;
    const clB=B.titulares.reduce((s,i)=>s+G.jogadores[i].at.clutch,0)/5;
    dif+=(clA-clB)*0.10;
  }
  /* o tempo pedido entra DEPOIS do ruído: ele não muda a natureza do round,
     muda quem chega melhor nele */
  if(M.bonusA>0){dif+=TEMPO_BONUS;M.bonusA--;}
  if(M.bonusB>0){dif-=TEMPO_BONUS;M.bonusB--;}
  const p=1/(1+Math.exp(-dif/26));
  const venceA=rnd()<p;
  if(venceA){M.sa++;M.perdaA=0;M.perdaB++;M.ecoA=2;M.ecoB=ecoDeN(M.perdaB);}
  else{M.sb++;M.perdaB=0;M.perdaA++;M.ecoB=2;M.ecoA=ecoDeN(M.perdaA);}
  // distribuição de abates
  const W=venceA?A:B, L=venceA?B:A;
  const mortosL = rnd()<.14?4:5;
  const mortosW = Math.min(4, Math.max(0, Math.round(gauss(2.1,1.3))));
  const abertura=distribuir(W,L,mortosL,M.st);
  distribuir(L,W,mortosW,M.st);
  const heroi = venceA?A:B;
  let clutch=null;
  if(mortosW>=4 && rnd()<.42){
    const vivos=heroi.titulares.map(i=>G.jogadores[i]);
    const h=escolherPorPeso(vivos);M.st[h.id].cl++;clutch=h.id;
  }
  /* O round guarda o suficiente para ser NARRADO depois, não só contado.
     Sem placar, economia e nome de quem abriu, a tela ao vivo vira uma
     barra de progresso — e o que prende é saber o que aconteceu. */
  /* Como o round acabou, tirado do que o próprio round registra: todo o time
     perdedor morto é eliminação; sobrou gente do perdedor, foi o spike que
     decidiu — explodiu (ataque venceu) ou foi desarmado / o tempo acabou
     (defesa venceu). Conta fixa, sem sorteio: não mexe no gerador. */
  const ladoV=venceA?ladoA:(ladoA==='atk'?'def':'atk');
  const como=mortosL===5?'elim':ladoV==='atk'?'spike':((r*7+M.sa*3+M.sb)%10<7?'defuse':'tempo');
  const linha={v:venceA,lado:ladoA,r,sa:M.sa,sb:M.sb,pistol,como,
               ecoA:ecoAntesA,ecoB:ecoAntesB,
               sobrou:5-mortosW,           /* quantos do vencedor sobreviveram */
               fk:abertura?abertura.de:null, fd:abertura?abertura.em:null,
               clutch};
  M.hist.push(linha);
  [...A.titulares,...B.titulares].forEach(i=>M.st[i].rounds++);
  if((M.sa>=13||M.sb>=13)&&Math.abs(M.sa-M.sb)>=2)M.fim=true;
  if(r>=24&&Math.abs(M.sa-M.sb)>=2&&(M.sa>=13||M.sb>=13))M.fim=true;
  if(r>60)M.fim=true;
  if(venceA){M.seqPerdaA=0;M.seqPerdaB=(M.seqPerdaB||0)+1;}
  else{M.seqPerdaB=0;M.seqPerdaA=(M.seqPerdaA||0)+1;}
  if(!M.fim){const q=tempoDaComissao(M);if(q)linha.tempoPedido=q;}
  return linha;
}
function fecharMapa(M){
  /* empate só acontece no corte de 60 rounds; decidir sempre para o B era um
     viés silencioso a mais */
  const vencedor = M.sa===M.sb ? (rnd()<0.5?M.A.id:M.B.id) : (M.sa>M.sb?M.A.id:M.B.id);
  return{mapa:M.mapa,sa:M.sa,sb:M.sb,hist:M.hist,st:M.st,vencedor};
}
function simMapa(A,B,mapa){
  const M=abrirMapa(A,B,mapa);
  while(!M.fim)passoRound(M);
  return fecharMapa(M);
}
function escolherPorPeso(arr){
  const w=arr.map(p=>Math.max(1,pesoFrag(p)));
  const tot=w.reduce((a,b)=>a+b,0);let x=rnd()*tot;
  for(let i=0;i<arr.length;i++){x-=w[i];if(x<=0)return arr[i];}
  return arr[arr.length-1];
}
/* Devolve quem abriu o round, quando abriu. A narração da partida ao vivo
   precisa de um NOME — "round vencido" não emociona ninguém. */
function distribuir(atacante,vitima,n,st){
  if(n<=0)return null;
  const ka=atacante.titulares.map(i=>G.jogadores[i]);
  const kv=vitima.titulares.map(i=>G.jogadores[i]);
  const mortos=shuffle(kv.slice()).slice(0,n);
  let primeiro=null;
  mortos.forEach((m,idx)=>{
    const k=escolherPorPeso(ka);
    st[k.id].k++; st[m.id].d++;
    if(idx===0&&rnd()<.55){st[k.id].fk++;st[m.id].fd++;primeiro={de:k.id,em:m.id};}
    if(rnd()<.42){
      const outros=ka.filter(x=>x.id!==k.id);
      const as=outros[Math.floor(rnd()*outros.length)];
      if(as)st[as.id].a++;
    }
  });
  return primeiro;
}
function acsDe(s){
  if(!s.rounds)return 0;
  return Math.round((s.k*212+s.a*58+s.fk*18)/s.rounds);
}
/* ---------- a série, também em passos ----------
   Mesmo motivo do mapa: para a tela poder conduzir em vez de só reproduzir.
   simPartida() continua sendo o laço completo, escrito em cima destas peças. */
function abrirSerie(aId,bId,bo,vetoPronto){
  const A=G.times[aId],B=G.times[bId];
  /* Veto pronto vindo de fora é o veto que VOCÊ fez na tela. Chega por aqui
     para o motor continuar sendo o único dono do sorteio: a tela escolhe os
     mapas, o motor joga. */
  const v=(vetoPronto&&vetoPronto.mapas&&vetoPronto.mapas.length)
    ?{seq:vetoPronto.seq||[],mapas:vetoPronto.mapas.slice(),lados:(vetoPronto.lados||[]).slice()}
    :veto(A,B,bo);
  return{A,B,aId,bId,bo,veto:v,need:Math.ceil(bo/2),
         mapas:[],wa:0,wb:0,idx:0,M:null,fim:false};
}
function serieAcabou(S){return S.wa===S.need||S.wb===S.need||S.idx>=S.veto.mapas.length;}
/* Abre o próximo mapa da série, ou devolve null quando não há mais. */
function serieAbrirMapa(S){
  if(serieAcabou(S)){S.fim=true;S.M=null;return null;}
  S.M=abrirMapa(S.A,S.B,S.veto.mapas[S.idx],(S.veto.lados||[])[S.idx]);
  /* o lado conduzido na tela pede o próprio tempo; o outro é da comissão */
  S.M.manualA=!!S.manualA;S.M.manualB=!!S.manualB;
  return S.M;
}
/* Fecha o mapa corrente e contabiliza. */
function serieFecharMapa(S){
  if(!S.M)return null;
  const r=fecharMapa(S.M);
  S.mapas.push(r);
  if(r.vencedor===S.A.id)S.wa++;else S.wb++;
  S.idx++;S.M=null;
  if(serieAcabou(S))S.fim=true;
  return r;
}
/* Fecha a série: consolida, aplica o que a partida deixa no mundo e devolve o
   MESMO objeto que simPartida sempre devolveu. */
function fecharSerie(S,ctx){
  const{A,B,aId,bId,bo}=S;
  const vencedor=S.wa>S.wb?aId:bId, perdedor=S.wa>S.wb?bId:aId;
  const agg={};
  S.mapas.forEach(mp=>{for(const id in mp.st){
    agg[id]=agg[id]||{k:0,d:0,a:0,fk:0,cl:0,rounds:0,maps:0,acsSoma:0};
    const s=mp.st[id];agg[id].k+=s.k;agg[id].d+=s.d;agg[id].a+=s.a;agg[id].fk+=s.fk;agg[id].cl+=s.cl;agg[id].rounds+=s.rounds;
    if(s.rounds>0){agg[id].maps++;agg[id].acsSoma+=acsDe(s);}
  }});
  let mvp=null,best=-1;
  for(const id in agg){
    if(G.jogadores[id].timeId!==vencedor)continue;
    const sc=acsDe(agg[id])+agg[id].cl*30;
    if(sc>best){best=sc;mvp=id;}
  }
  /* decisão: grande final em Bo5 ou série de mata-mata — mexe em dobro na
     confiança de quem joga */
  const st=ctx&&ctx.stage&&typeof acharStage==='function'?acharStage(ctx.stage):null;
  const decisiva=bo>=5||!!(st&&(st.tipo==='de'||st.tipo==='ko'));
  aplicarPos(A,B,vencedor,agg,mvp,ctx,decisiva);
  /* Afinidade é POR MAPA, então tem de ser aplicada mapa a mapa — a
     consolidação acima soma tudo e perderia justamente a informação que
     interessa aqui: em qual mapa cada um foi bem. */
  S.mapas.forEach(mp=>{
    for(const id in mp.st){
      const p=G.jogadores[id],st=mp.st[id];
      if(!p||!st.rounds)continue;
      evoluirAfinidade(p,mp.mapa,acsDe(st));
    }
  });
  return{aId,bId,bo,veto:S.veto.seq,mapas:S.mapas,wa:S.wa,wb:S.wb,
         vencedor,perdedor,agg,mvp,ctx:ctx||{}};
}
function simPartida(aId,bId,bo,ctx){
  const S=abrirSerie(aId,bId,bo,ctx&&ctx.veto);
  while(!S.fim){
    if(!serieAbrirMapa(S))break;
    while(!S.M.fim)passoRound(S.M);
    serieFecharMapa(S);
  }
  return fecharSerie(S,ctx);
}
function aplicarPos(A,B,vencedor,agg,mvp,ctx,decisiva){
  for(const id in agg){
    const p=G.jogadores[id],s=agg[id];
    p.temp.maps+=s.maps; p.temp.k+=s.k;p.temp.d+=s.d;p.temp.a+=s.a;
    p.temp.fk+=s.fk;p.temp.cl+=s.cl;p.temp.acs+=s.acsSoma;
    p.carreira.k+=s.k;p.carreira.d+=s.d;p.carreira.a+=s.a;p.carreira.maps+=s.maps;
    p.carreira.acs=(p.carreira.acs||0)+s.acsSoma;
    if(id===mvp){p.temp.mvp++;p.carreira.mvp=(p.carreira.mvp||0)+1;}
    const kd=s.d?s.k/s.d:2;
    p.forma=clamp(p.forma+(kd-1.02)*0.055+gauss(0,.03),.15,1);
    p.fadiga=clamp(p.fadiga+0.05+ (A.tatica.scrim+B.tatica.scrim)/300,0,1);
    const ganhou=p.timeId===vencedor;
    p.moral=clamp(p.moral+(ganhou?0.035:-0.045),.15,1);
    /* Lesão em e-sports é rara e curta (punho, mão, coluna): era 0,6% a 1,8%
       por série, agora 0,2% a 0,6%, e dura uma ou duas semanas. */
    if(rnd()<0.002+p.fadiga*0.004){
      const tp=G.times[p.timeId];
      /* Fisioterapeuta bom encurta a lesão. O ponto neutro é o mesmo das
         outras fórmulas (staff.js); com o 3 antigo, TODO clube de Tier 2
         alongava a lesão dos próprios jogadores mesmo com o melhor fisio da
         divisão. O k caiu junto para o Tier 1 continuar cortando o mesmo. */
      const neutroF=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
      const corte=tp?Math.round(((tp.staff.fisio||neutroF)-neutroF)*0.25):0;
      p.lesao=clamp(ri(1,2)-corte,1,4);
    }
  }
  /* confiança e entrosamento: core/vestiario.js */
  [A,B].forEach(t=>{
    const ganhou=t.id===vencedor;
    if(typeof confiancaPosSerie==='function'){confiancaPosSerie(t,ganhou,!!decisiva,agg);entrosamentoPosSerie(t,ganhou,!!decisiva);}
    else t.sinergia=clamp(t.sinergia+0.7,0,100);
  });
  const V=G.times[vencedor],P=vencedor===A.id?B:A;
  V.temporada.v++;P.temporada.d++;
  if(typeof CARGOS!=='undefined')CARGOS.forEach(c=>{
    const mv=membroDe(V,c.id);if(mv)mv.temp.v++;
    const mp=membroDe(P,c.id);if(mp)mp.temp.d++;
  });
  V.prestigio=clamp(V.prestigio+0.06,20,99);P.prestigio=clamp(P.prestigio-0.05,20,99);
}

/* ============================================================
   FORMATOS DE TORNEIO
   ------------------------------------------------------------
   Os torneios eram pontos corridos ou eliminação simples, sem
   sorteio, sem grupo e sem chave. Um playoff era uma lista de
   nomes que ia encolhendo — não dava para olhar e entender por
   onde seu time passa nem quem ele pega se ganhar.

   O que existe aqui saiu do formato real da VCT 2026, conferido
   no vlr.gg:

   · Stage regional: fase de grupos (Alpha e Omega) e depois
     playoffs de 8 em DUPLA ELIMINAÇÃO, Bo3, final Bo5.
   · Masters: fase suíça para semear, e a mesma dupla eliminação.
   · Champions: 16 times, grupos e playoffs.

   Dupla eliminação é o ponto: perder uma vez não elimina, e é
   isso que faz o chaveamento ter duas metades e valer a pena
   olhar.
   ============================================================ */

/* ---------- sorteio por potes ----------
   Cabeça de chave não cai com cabeça de chave. Sem potes, o sorteio
   às vezes juntava os quatro melhores num grupo e a fase inteira
   perdia a graça antes de começar. */
function sortearGrupos(ids,nGrupos,nomes){
  const ordem=ids.slice().sort((a,b)=>forcaSemeadura(b)-forcaSemeadura(a));
  const grupos=[];
  for(let i=0;i<nGrupos;i++)
    grupos.push({id:String.fromCharCode(65+i),nome:(nomes&&nomes[i])||('Grupo '+String.fromCharCode(65+i)),
                 times:[],tabela:{}});
  const sorteio=[];
  const porPote=Math.ceil(ordem.length/nGrupos);
  for(let p=0;p<porPote;p++){
    const pote=shuffle(ordem.slice(p*nGrupos,(p+1)*nGrupos));
    /* serpentina: o pote seguinte entra na ordem inversa, para o grupo que
       levou o melhor do pote 1 levar o pior do pote 2 */
    const alvo=p%2?grupos.slice().reverse():grupos;
    pote.forEach((id,i)=>{
      if(!alvo[i])return;
      alvo[i].times.push(id);
      sorteio.push({pote:p+1,time:id,grupo:alvo[i].id});
    });
  }
  return{grupos,sorteio};
}
/* Quem é cabeça de chave. Prestígio manda, e os pontos de circuito da
   temporada corrente desempatam — quem foi bem este ano entra semeado. */
function forcaSemeadura(id){
  const t=G.times[id];
  if(!t)return 0;
  const R=G.regioes[t.regiao];
  const pts=(R&&R.pontos&&R.pontos[id])||0;
  return t.prestigio+pts*0.8;
}

/* ---------- fase de grupos ---------- */
const NOMES_GRUPOS=['Alpha','Omega','Delta','Sigma'];
function montarGrupos(s){
  const n=s.nGrupos||2;
  const{grupos,sorteio}=sortearGrupos(s.times,n,NOMES_GRUPOS);
  s.grupos=grupos;s.sorteio=sorteio;
  s._grupoDe={};
  for(const g of grupos){
    g.times.forEach(id=>{
      g.tabela[id]={v:0,d:0,mv:0,md:0,rv:0,rd:0};
      s._grupoDe[id]=g.id;
    });
    g.rodadas=roundRobin(shuffle(g.times.slice()));
  }
  s.rodadasMax=Math.max(...grupos.map(g=>g.rodadas.length));
  return s;
}
function grupoDe(s,id){return (s.grupos||[]).find(g=>g.id===(s._grupoDe||{})[id])||null;}
/* Classificação de um grupo. Mesma régua da tabela corrida: vitórias, saldo de
   mapas, saldo de rounds. */
function ordenarGrupo(g){
  return g.times.slice().sort((x,y)=>{
    const a=g.tabela[x],b=g.tabela[y];
    return b.v-a.v||(b.mv-b.md)-(a.mv-a.md)||(b.rv-b.rd)-(a.rv-a.rd);
  });
}
/* Quem passa: os N primeiros de cada grupo, intercalados para o chaveamento
   sair com 1ºA contra 4ºB, que é como um playoff é montado. */
function classificadosDosGrupos(s){
  const passam=s.passam||Math.max(1,Math.floor(s.times.length/(s.grupos.length*2)));
  const porGrupo=s.grupos.map(ordenarGrupo);
  const out=[];
  for(let pos=0;pos<passam;pos++)
    porGrupo.forEach(g=>{if(g[pos])out.push(g[pos]);});
  return out;
}

/* ---------- dupla eliminação ----------
   Perder uma vez manda para a chave inferior; perder duas elimina.

   A ordem das rodadas sai de uma regra só, e não de uma tabela por tamanho:
   joga-se a chave SUPERIOR quando não há ninguém recém-caído esperando E a
   inferior já está enxuta o bastante para receber os próximos eliminados.
   Fora disso, joga a inferior. É essa alternância que produz o desenho
   clássico — inferior joga duas vezes para cada uma da superior. */
function montarDE(s){
  s.ub=s.times.slice();      /* chave superior */
  s.lb=[];                   /* chave inferior */
  s.fila=[];                 /* quem acabou de cair da superior */
  s.chave=[];                /* histórico de rodadas, para desenhar a chave */
  s.elim=[];
  return s;
}
function faseDE(s){
  if(s.ub.length<=1&&s.lb.length<=1&&!s.fila.length)return 'gf';
  if(!s.fila.length&&s.ub.length>1&&s.lb.length<=s.ub.length/2)return 'ub';
  return 'lb';
}
function paresDE(s){
  const f=faseDE(s);
  if(f==='gf'){
    if(s.ub.length===1&&s.lb.length===1)return{fase:'gf',pares:[[s.ub[0],s.lb[0]]],byes:[]};
    return{fase:'gf',pares:[],byes:[]};
  }
  if(f==='ub'){
    const r=paresKO(s.ub);
    return{fase:'ub',pares:r.pares,byes:r.byes};
  }
  /* inferior: ou os recém-caídos entre si, ou os sobreviventes contra eles */
  if(s.fila.length&&!s.lb.length){
    const r=paresKO(s.fila);
    return{fase:'lb',pares:r.pares,byes:r.byes,cruz:false};
  }
  if(s.fila.length&&s.lb.length){
    /* cruzado: quem já estava embaixo pega quem acabou de cair, na ordem
       inversa, para o último a cair não reencontrar quem o eliminou */
    const a=s.lb.slice(), b=s.fila.slice().reverse(), pares=[], byes=[];
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++)pares.push([a[i],b[i]]);
    byes.push(...a.slice(n),...b.slice(n));
    return{fase:'lb',pares,byes,cruz:true};
  }
  const r=paresKO(s.lb);
  return{fase:'lb',pares:r.pares,byes:r.byes,cruz:false};
}
function nomeRodadaDE(s){
  const f=faseDE(s);
  if(f==='gf')return 'Grande final';
  if(f==='ub')return s.ub.length<=2?'Final da chave superior'
             :s.ub.length<=4?'Semifinal superior':'Quartas superiores';
  /* A rodada inferior só é FINAL quando dela sai o adversário da grande final:
     um contra um, o sobrevivente de baixo contra quem acabou de cair da final
     de cima. Chamar de final toda rodada com dois nomes fazia aparecer duas
     "finais da chave inferior" no mesmo chaveamento. */
  const lb=(s.lb||[]).length, fila=(s.fila||[]).length;
  if(lb===1&&fila===1)return 'Final da chave inferior';
  if(lb+fila<=2)return 'Semifinal inferior';
  return 'Chave inferior';
}
function avancarDE(s,vencedores,perdedores,fase){
  if(fase==='ub'){
    s.ub=vencedores;
    s.fila=perdedores;
  }else if(fase==='lb'){
    s.lb=vencedores;
    s.fila=[];
    s.elim.push(...perdedores);
  }else{
    s.campeao=vencedores[0];
    s.vice=perdedores[0];
    s.ub=vencedores;s.lb=[];
  }
}

/* ---------- fase suíça ----------
   Usada nos Masters, e só para semear: todo mundo passa, mas passa numerado.
   Cada rodada junta quem tem a mesma campanha, o que faz a última rodada
   valer alguma coisa mesmo para quem já está classificado. */
function montarSwiss(s){
  s.suico={};
  s.times.forEach(id=>s.suico[id]={v:0,d:0,adv:[]});
  s.rodadasMax=s.rodadasMax||Math.max(3,Math.ceil(Math.log2(s.times.length)));
  return s;
}
function paresSwiss(s){
  const grupos={};
  for(const id of s.times){
    const k=s.suico[id].v+'-'+s.suico[id].d;
    (grupos[k]=grupos[k]||[]).push(id);
  }
  const pares=[],sobra=[];
  Object.keys(grupos).sort().forEach(k=>{
    const fila=shuffle(grupos[k].slice()).concat(sobra.splice(0));
    while(fila.length>1){
      const a=fila.shift();
      /* evita revanche enquanto houver com quem jogar */
      let j=fila.findIndex(b=>!s.suico[a].adv.includes(b));
      if(j<0)j=0;
      pares.push([a,fila.splice(j,1)[0]]);
    }
    if(fila.length)sobra.push(fila[0]);
  });
  while(sobra.length>1)pares.push([sobra.shift(),sobra.shift()]);
  return{pares,byes:sobra.slice()};
}
function ordenarSwiss(s){
  return s.times.slice().sort((x,y)=>{
    const a=s.suico[x],b=s.suico[y],ta=s.tabela[x],tb=s.tabela[y];
    return b.v-a.v||(tb.mv-tb.md)-(ta.mv-ta.md)||(tb.rv-tb.rd)-(ta.rv-ta.rd);
  });
}

/* ============================================================
   MELHOR JOGADOR DO TORNEIO
   ------------------------------------------------------------
   p.temp acumula a temporada inteira, então não responde "quem
   foi o melhor DESTE campeonato". Aqui cada stage guarda a
   própria estatística, e no encerramento sai o MVP.

   O peso da campanha do time é de propósito: prêmio de melhor
   jogador em torneio vai quase sempre para quem chegou longe, e
   um jogador excepcional num time eliminado cedo raramente leva.
   Sem isso o MVP virava só a maior média de abates.
   ============================================================ */
function acumularStats(s,res){
  if(!res||!res.agg)return;
  s.stats=s.stats||{};
  for(const id in res.agg){
    const a=res.agg[id];
    const e=s.stats[id]||(s.stats[id]={maps:0,k:0,d:0,a:0,acs:0,fk:0,cl:0,mvp:0,timeId:(G.jogadores[id]||{}).timeId});
    e.maps+=a.maps;e.k+=a.k;e.d+=a.d;e.a+=a.a;
    e.acs+=a.acsSoma;e.fk+=a.fk;e.cl+=a.cl;
  }
  if(res.mvp&&s.stats[res.mvp])s.stats[res.mvp].mvp++;
}
const MVP_MIN_MAPAS=4;
/* Média de ACS do próprio torneio. Comparar contra um número fixo não serve:
   um Challengers inteiro joga com ACS mais baixo que um Masters, e o prêmio é
   de melhor DAQUELE campeonato. */
function acsMedioDoStage(s){
  let soma=0,mapas=0;
  for(const id in s.stats){soma+=s.stats[id].acs;mapas+=s.stats[id].maps;}
  return mapas?soma/mapas:220;
}
function notaMVP(s,id,e,media,minMapas){
  if(!e||e.maps<minMapas)return -Infinity;
  const acs=e.acs/e.maps;
  const kd=e.d?e.k/e.d:e.k;
  const porMapa=e.mvp/e.maps;              /* quantas vezes foi o melhor em quadra */
  /* onde o time dele terminou, de 1 (campeão) a 0 (último) */
  const pos=(s.ranking||[]).indexOf(e.timeId);
  const campanha=pos<0?0.35:1-(pos/Math.max(1,(s.ranking||[]).length-1));
  /* A campanha pesa, porque prêmio de torneio quase sempre vai para quem
     chegou longe — mas pesa MENOS que o desempenho somado, senão o MVP vira
     um sorteio dentro do campeão e o número na tela não significa nada. */
  return (acs/media-1)*1.9 + (Math.min(2.2,kd)-1)*0.55 + porMapa*0.95 + campanha*0.38;
}
function melhorDoTorneio(s){
  if(!s||!s.stats)return null;
  const media=acsMedioDoStage(s);
  /* O corte de mapas evita premiar quem entrou em dois e brilhou. Mas num
     torneio curto — um Ascension é uma série só — ninguém chega ao corte fixo,
     e aí ele passa a ser "quem mais jogou", que é o mesmo espírito. */
  const teto=Math.max(0,...Object.values(s.stats).map(e=>e.maps));
  const minMapas=Math.min(MVP_MIN_MAPAS,teto);
  let melhor=null,nota=-Infinity;
  for(const id in s.stats){
    const n=notaMVP(s,id,s.stats[id],media,minMapas);
    if(n>nota){nota=n;melhor=id;}
  }
  return melhor;
}
/* Foto do prêmio, gravada na hora em que ele é dado.

   O jogador pode se aposentar — e aposentado é APAGADO de G.jogadores. Sem
   esta foto, o MVP de um Champions desaparecia do registro junto com ele, e a
   tela ficava sem dizer quem tinha ganho. Prêmio é história: não pode depender
   de a pessoa ainda estar em atividade. */
function fixarMVP(s){
  const id=s&&s.mvp;const p=id&&G.jogadores[id];const e=id&&s.stats&&s.stats[id];
  if(!p||!e)return null;
  s.mvpFicha={id,nome:p.nome,pais:p.pais,role:p.role,
    tag:e.timeId&&G.times[e.timeId]?G.times[e.timeId].tag:'—',
    timeId:e.timeId||null,
    maps:e.maps,acs:Math.round(e.acs/Math.max(1,e.maps)),
    kd:Number((e.d?e.k/e.d:e.k).toFixed(2)),mvps:e.mvp};
  return s.mvpFicha;
}
/* Linha de leitura do MVP, para a tela e para a notícia. Prefere o jogador
   vivo, para a ficha dele abrir; cai na foto quando ele já se aposentou. */
function resumoMVP(s){
  const id=s&&s.mvp;const p=id&&G.jogadores[id];const e=id&&s.stats&&s.stats[id];
  if(p&&e)return{p,maps:e.maps,acs:Math.round(e.acs/Math.max(1,e.maps)),
         kd:(e.d?e.k/e.d:e.k).toFixed(2),mvps:e.mvp,
         time:e.timeId&&G.times[e.timeId]?G.times[e.timeId]:null};
  const f=s&&s.mvpFicha;
  if(!f)return null;
  return{p:{id:f.id,nome:f.nome,pais:f.pais,role:f.role,aposentado:true},
         maps:f.maps,acs:f.acs,kd:String(f.kd),mvps:f.mvps,
         time:f.timeId&&G.times[f.timeId]?G.times[f.timeId]:{tag:f.tag,nome:f.tag}};
}

/* ============================================================
   COMPETIÇÕES
   ============================================================ */
/* Premiação — uma escada só, derivada da importância do torneio.
   PREMIO_BASE é o prêmio do campeão do Champions; cada competição vale uma
   fração dela (PESO_EVENTO) e as colocações seguem a curva do próprio torneio.
   Reequilibrar a economia é mexer em PESO_EVENTO, não em números soltos.
   Ordem resultante: Champions > Masters > playoffs regional > Ascension >
   Kickoff > split de Challengers. */
const PREMIO_BASE=1000000;
const PESO_EVENTO={champions:1, masters:.40, po:.16, ascension:.13, kickoff:.10, chall:.04};
const CURVA_PREMIO={
  champions:[1,.52,.30,.20,.12,.12,.07,.07],
  masters  :[1,.52,.32,.22,.12,.12,.07,.07],
  po       :[1,.55,.34,.22,.13,.13,.075,.075],
  kickoff  :[1,.55,.32,.20],
  chall    :[1,.55,.32,.20],
  ascension:[1,.38]
};
/* Tabela de referência, usada como padrão quando não há catálogo. Em jogo quem
   manda é o prêmio de cada torneio em G.torneios, editável no Banco de dados —
   ver premiosDoStage() em core/torneios.js. */
/* A curva acima cobre o pódio e pouco mais. Champions tem 16 times e pagava
   8: metade do torneio saía sem nada, e era justamente a metade que estava
   quebrando. Agora a cauda continua decaindo até um piso — participar passou
   a valer dinheiro.

   PISO_PREMIO é fração do prêmio do campeão. 4% do Champions ainda é dinheiro
   de verdade; 4% de um split de Challengers é quase nada, que é o certo. */
const PISO_PREMIO=0.04;
const DECAI_CAUDA=0.82;
function curvaPremio(categoria,n){
  const base=(CURVA_PREMIO[categoria]||CURVA_PREMIO.kickoff).slice();
  if(!n||n<=base.length)return base;
  let f=base[base.length-1];
  while(base.length<n){
    f=Math.max(PISO_PREMIO,f*DECAI_CAUDA);
    base.push(f);
  }
  return base;
}
const PREMIOS=Object.fromEntries(Object.entries(CURVA_PREMIO).map(([k,c])=>
  [k,c.map(f=>Math.round(PREMIO_BASE*PESO_EVENTO[k]*f/1000)*1000)]));

const PTS_PO=[10,8,6,5,3,3,1,1];

function roundRobin(ids){
  const a=ids.slice(); if(a.length%2)a.push(null);
  const n=a.length,rodadas=[];
  for(let r=0;r<n-1;r++){
    const rd=[];
    for(let i=0;i<n/2;i++){const x=a[i],y=a[n-1-i];if(x&&y)rd.push([x,y]);}
    a.splice(1,0,a.pop());
    rodadas.push(rd);
  }
  return rodadas;
}
function novoStage(o){
  const s=Object.assign({tipo:'rr',bo:3,idx:0,feito:false,tabela:{},rodadas:[],
    vivos:[],elim:[],ranking:[],resultados:[]},o);
  s.torneioId=torneioDeStage(s.id);
  s.times.forEach(id=>s.tabela[id]={v:0,d:0,mv:0,md:0,rv:0,rd:0});
  if(s.tipo==='grupos')montarGrupos(s);
  else if(s.tipo==='de')montarDE(s);
  else if(s.tipo==='swiss')montarSwiss(s);
  else if(s.tipo==='rr')s.rodadas=roundRobin(shuffle(s.times.slice()));
  else s.vivos=s.times.slice();
  return s;
}
/* ---------- rodada: preparar é do motor, ler é de todo mundo ----------
   Sortear confronto consome o gerador semeado. Se a interface chamasse a
   função que sorteia só para desenhar "seu próximo jogo", ela empurraria o
   fluxo do RNG e mudaria o futuro da simulação — o mesmo erro que a narração
   quase cometeu. Por isso a rodada é montada UMA vez, pelo relógio, e fica
   guardada em s.rodadaAtual; quem só quer olhar lê de lá. */
function prepararRodada(s){
  if(s.feito||s.rodadaAtual)return s.rodadaAtual;
  s._rodadaV=[];s._rodadaP=[];
  s._resAntes=s.resultados.length;
  if(s.tipo==='rr'){
    s.rodadaAtual=s.rodadas[s.idx]||null;
  }else if(s.tipo==='grupos'){
    const rd=[];
    for(const g of s.grupos)(g.rodadas[s.idx]||[]).forEach(par=>rd.push(par));
    s.rodadaAtual=rd.length?rd:null;
    s.nomeRodada='Rodada '+(s.idx+1)+' de '+s.rodadasMax;
  }else if(s.tipo==='swiss'){
    if(s.idx>=s.rodadasMax){s.rodadaAtual=null;}
    else{
      const r=paresSwiss(s);
      s._byes=r.byes;s.rodadaAtual=r.pares.length?r.pares:null;
      s.nomeRodada='Rodada suíça '+(s.idx+1)+' de '+s.rodadasMax;
    }
  }else if(s.tipo==='de'){
    const r=paresDE(s);
    s.faseAtual=r.fase;s._byesDE=r.byes||[];
    s.nomeRodada=nomeRodadaDE(s);
    s.rodadaAtual=r.pares.length?r.pares:null;
  }else{
    s.rodadaAtual=s.vivos.length<=1?null:seedKO(s);
    s.nomeRodada=s.vivos.length<=2?'Final':s.vivos.length<=4?'Semifinal':'Eliminatória';
  }
  return s.rodadaAtual;
}
/* seedKO vive em core/bracket.js, junto do paresKO usado nos previews da UI */
function stageRodadaAtual(s){
  if(!s||s.feito)return null;
  return s.rodadaAtual||null;
}
/* Quantos duelos ainda faltam para o stage acabar. */
function rodadasDoStage(s){
  if(!s||s.feito)return 0;
  if(s.tipo==='rr')return Math.max(0,s.rodadas.length-s.idx);
  if(s.tipo==='grupos')return Math.max(0,s.rodadasMax-s.idx);
  if(s.tipo==='swiss')return Math.max(0,s.rodadasMax-s.idx);
  if(s.tipo==='de'){
    /* superior + inferior + grande final, com folga: é estimativa para o
       relógio caber o torneio no intervalo, não precisa ser exata */
    const n=(s.ub||[]).length+(s.lb||[]).length+(s.fila||[]).length;
    return Math.max(1,Math.ceil(Math.log2(Math.max(2,n)))*2+1);
  }
  return Math.ceil(Math.log2(Math.max(1,(s.vivos||[]).length)));
}
function stageAplicar(s,res){
  const{aId,bId,vencedor,perdedor,wa,wb}=res;
  const somar=(tab)=>{
    const ta=tab[aId],tb=tab[bId];
    if(!ta||!tb)return;
    (vencedor===aId?ta:tb).v++;(vencedor===aId?tb:ta).d++;
    ta.mv+=wa;ta.md+=wb;tb.mv+=wb;tb.md+=wa;
    res.mapas.forEach(m=>{ta.rv+=m.sa;ta.rd+=m.sb;tb.rv+=m.sb;tb.rd+=m.sa;});
  };
  somar(s.tabela);
  /* o grupo tem tabela própria: é ela que classifica, e é ela que a tela
     mostra. A tabela do stage inteiro continua existindo para o ranking final */
  if(s.tipo==='grupos'){const g=grupoDe(s,aId);if(g)somar(g.tabela);}
  if(s.tipo==='swiss'&&s.suico){
    s.suico[vencedor].v++;s.suico[perdedor].d++;
    s.suico[aId].adv.push(bId);s.suico[bId].adv.push(aId);
  }
  if(s.tipo==='de'){
    (s._rodadaV=s._rodadaV||[]).push(vencedor);
    (s._rodadaP=s._rodadaP||[]).push(perdedor);
  }
  /* Estatística POR TORNEIO. p.temp acumula a temporada inteira e não serve
     para eleger o melhor de um campeonato — o que se quer saber é quem foi o
     melhor naquelas três semanas, não no ano. */
  acumularStats(s,res);
  /* Ficha da série guardada enxuta, para qualquer jogo do ano poder ser
     aberto em Competições: veto, placar e lado de início de cada mapa, e a
     linha de cada jogador (K, D, A, ACS, first kills). Vive no stage, que é
     remontado a cada temporada — o save carrega só o ano em curso. */
  /* A linha de cada jogador é o que pesa no save (≈0,6 KB por série). Fica
     nas séries que alguém volta para olhar: as do seu clube, as dos
     internacionais e as de playoffs. Na fase de grupos regional dos outros
     ficam veto e placar por mapa. */
  const comBox=aId===G.meuTime||bId===G.meuTime||s.regiao==='INT'||s.tipo==='de'||s.tipo==='ko';
  const det={
    v:(res.veto||[]).map(x=>[x.m,x.tipo==='ban'?'b':x.tipo==='dec'?'d':'p',x.t||'']),
    mp:(res.mapas||[]).map(m=>({m:m.mapa,a:m.sa,b:m.sb,l:m.hist&&m.hist[0]?m.hist[0].lado:null,
      /* "id:k,d,a,acs|id:…" — texto em vez de objeto: um terço menor no save */
      st:!comBox?null:Object.entries(m.st||{}).filter(([,x])=>x&&x.rounds>0)
        .map(([id,x])=>id+':'+x.k+','+x.d+','+x.a+','+Math.round(typeof acsDe==='function'?acsDe(x):0)).join('|')})),
    mvp:res.mvp||null};
  s.resultados.push({a:aId,b:bId,wa,wb,v:vencedor,mapa:res.mapas.map(m=>m.mapa+' '+m.sa+'-'+m.sb).join(', '),
    n:s.resultados.length,rd:s.nomeRodada||(s.tipo==='rr'||s.tipo==='grupos'?'Rodada '+(s.idx+1):''),
    sem:res.semana||G.semana,det});
  /* Confronto direto: registrado aqui, no único lugar por onde TODO resultado
     de série passa. Espalhar isso pelos pontos que chamam simSerie deixaria
     algum torneio de fora e o histórico ficaria mentindo por omissão. */
  if(typeof registrarConfronto==='function')
    registrarConfronto(aId,bId,vencedor,nomeStage(s)||s.id);
  if(typeof aplicarClassico==='function')aplicarClassico(vencedor,perdedor);
  /* ranking mundial (core/estatisticas.js) */
  if(typeof atualizarElo==='function')atualizarElo(s,res);
  if(s.tipo==='ko')s.elim.push(perdedor);
}
/* Depois de resolver uma rodada, já monta a próxima. É de propósito: assim a
   interface consegue mostrar QUEM VEM antes de você mandar avançar — sem isso
   o chaveamento fica sempre um passo atrás e "próximo compromisso" nunca sabe
   contra quem você joga. Continua sendo o motor sorteando, e sempre no mesmo
   ponto da sequência, então a simulação não muda. */
function stageAvancar(s){
  const r=avancarStage(s);
  if(!s.feito)prepararRodada(s);
  return r;
}
function avancarStage(s){
  s.rodadaAtual=null;
  if(s.tipo==='rr'){
    s.idx++;
    if(s.idx>=s.rodadas.length){s.feito=true;s.ranking=ordenarTabela(s);}
    return;
  }
  if(s.tipo==='grupos'){
    s.idx++;
    if(s.idx>=s.rodadasMax){
      s.feito=true;
      /* o ranking do stage é a ordem de classificação: primeiro os que passam,
         na ordem em que entram no chaveamento, depois o resto por grupo */
      const passam=classificadosDosGrupos(s);
      const resto=s.grupos.flatMap(ordenarGrupo).filter(id=>!passam.includes(id));
      s.ranking=[...passam,...resto];
      s.classificados=passam;
    }
    return;
  }
  if(s.tipo==='swiss'){
    s.idx++;
    if(s.idx>=s.rodadasMax){s.feito=true;s.ranking=ordenarSwiss(s);s.classificados=s.ranking.slice();}
    return;
  }
  if(s.tipo==='de'){
    const v=[...(s._byesDE||[]),...(s._rodadaV||[])].filter((x,i,a)=>a.indexOf(x)===i);
    const p=(s._rodadaP||[]).slice();
    /* os jogos DESTA rodada, marcados na hora de montá-la. Cortar pelo fim da
       lista errava sempre que a rodada tinha bye. */
    s.chave.push({fase:s.faseAtual,nome:s.nomeRodada,
                  jogos:s.resultados.slice(s._resAntes||0)});
    avancarDE(s,v,p,s.faseAtual);
    s._byesDE=[];s._rodadaV=[];s._rodadaP=[];
    s.idx++;
    if(s.campeao){
      s.feito=true;
      s.ranking=[s.campeao,s.vice,...s.elim.slice().reverse()].filter((x,i,a)=>x&&a.indexOf(x)===i);
    }
    return;
  }
  const perdedores=new Set(s.elim);
  s.vivos=[...(s._byes||[]),...s.vivos.filter(id=>!perdedores.has(id))].filter((v,i,a)=>a.indexOf(v)===i);
  s._byes=[];
  if(s.vivos.length<=1){s.feito=true;s.ranking=[...s.vivos,...s.elim.slice().reverse()];}
  s.idx++;
}
function ordenarTabela(s){
  return s.times.slice().sort((x,y)=>{
    const a=s.tabela[x],b=s.tabela[y];
    return b.v-a.v||(b.mv-b.md)-(a.mv-a.md)||(b.rv-b.rd)-(a.rv-a.rd);
  });
}
/* Metade do prêmio é dos jogadores, como no circuito de verdade. Com o prêmio
   inteiro no caixa, quem ganhava Masters e Champions terminava dez temporadas
   com 15 milhões parados, que nem salário nem estrutura conseguiam gastar. O
   bônus deixa o elenco um pouco mais feliz. Não sorteia nada. */
const PARTE_DOS_JOGADORES=0.5;
function pagar(ids,tabela){
  ids.forEach((id,i)=>{const v=tabela[i]||0;if(!v)return;
    const t=G.times[id];if(!t)return;
    const clube=Math.round(v*(1-PARTE_DOS_JOGADORES));
    t.caixa+=clube;
    /* soma do ano, para a tela de Finanças separar a premiação */
    if(!t.premiosAno||t.premiosAno.ano!==G.ano)t.premiosAno={ano:G.ano,v:0};
    t.premiosAno.v+=clube;
    (t.elenco||[]).forEach(pid=>{const p=G.jogadores[pid];if(p)p.moral=clamp(p.moral+0.02,0.05,1);});
    if(id===G.meuTime)noticia('Premiação: '+money(v)+'. '+money(clube)+' ficam no clube e o resto vai de bônus para os jogadores.',{c:'clube',t:[id]});});
}
/* Encerramento de um stage: paga, entrega o título e elege o melhor jogador.
   Num lugar só porque as três coisas acontecem sempre juntas — espalhadas por
   fimDeBloco(), sempre faltava uma em algum torneio. Fases de grupo e suíça
   não encerram nada: elas classificam, quem paga é o mata-mata. */
function encerrarStage(s){
  if(!s||s._encerrado)return null;
  s._encerrado=true;
  pagar(s.ranking,premiosDoStage(s));
  const campeao=s.ranking&&s.ranking[0];
  if(campeao){titulo(campeao,nomeTitulo(s),s.regiao==='INT'?3:s.tier===2?1:2,s.torneioId);
    /* título internacional conta à parte: é ele que separa lenda de bom jogador */
    if(s.regiao==='INT'&&G.times[campeao])G.times[campeao].titulares.forEach(pid=>{
      const c=G.jogadores[pid]&&G.jogadores[pid].carreira;if(c)c.intl=(c.intl||0)+1;});}
  /* O vice também entra na história. Só a semeadura de 2021–2025 contava
     finais perdidas: no jogo, um clube podia perder dez decisões e a ficha
     dele continuava marcando zero vice — um número que nunca mudava e por
     isso não dizia nada. */
  const vice=s.ranking&&s.ranking[1];
  if(vice&&G.times[vice]&&campeao&&vice!==campeao){
    const tv=G.times[vice];
    tv.vices=(tv.vices||0)+1;
    tv.prestigio=clamp(tv.prestigio+0.6,20,99);
  }
  s.mvp=melhorDoTorneio(s);
  fixarMVP(s);              /* grava a foto antes de o jogador poder se aposentar */
  const r=resumoMVP(s);
  if(r){
    r.p.carreira.mvpTorneios=(r.p.carreira.mvpTorneios||0)+1;
    noticia('⭐ '+r.p.nome+' ('+(r.time?r.time.tag:'—')+') é o melhor jogador de '+
            nomeTitulo(s)+' — '+r.acs+' de ACS e '+r.kd+' de K/D em '+r.maps+' mapas.',{c:'competicoes',p:[r.p.id],t:[r.time&&r.time.id]});
  }
  return s.mvp;
}
function titulo(id,nome,imp,torneioId){
  const t=G.times[id];if(!t)return;
  t.titulos.push(G.ano+' · '+nome);t.prestigio=clamp(t.prestigio+2.2,20,99);
  t.titulares.forEach(pid=>G.jogadores[pid].carreira.titulos++);
  if(typeof CARGOS!=='undefined')CARGOS.forEach(c=>{
    const m=membroDe(t,c.id);if(m)m.temp.titulos++;
  });
  /* torneioId e o arquivo do troféu ficam gravados: a sede e o troféu são
     do ano em que o título saiu, mesmo que o catálogo de cidades mude depois */
  G.historico.push({ano:G.ano,evento:nome,campeao:t.nome,timeId:t.id,
    torneioId:torneioId||null,
    trofeu:torneioId&&typeof arquivoTrofeu==='function'?arquivoTrofeu(torneioId,G.ano):null});
  noticia('🏆 '+t.nome+' é campeão de '+nome+'.',{c:'competicoes',t:[t.id],imp:imp||2});
}
/* ---------- sala de imprensa ----------
   Cada notícia tem categoria (o) e quem ela cita: jogadores (p) e clubes (t).
   "Do seu clube" é decidido aqui, na hora, e não na tela: o jogador pode
   trocar de clube depois, e a notícia continua sendo de quando aconteceu.
   imp vai de 1 a 3 e escolhe a manchete da semana na Central. */
const CAT_NOTICIA={clube:'Meu clube',mercado:'Mercado',competicoes:'Competições',meta:'Meta e mapas',carreira:'Carreira'};
const NOTICIAS_MAX=240;
function noticia(txt,o){
  o=o||{};
  const p=(o.p||[]).filter(id=>id&&G.jogadores[id]);
  const t=(o.t||[]).filter(id=>id&&G.times[id]).filter((x,i,a)=>a.indexOf(x)===i);
  const n={b:G.bloco,ano:G.ano,s:G.semana,txt,c:o.c||'outros'};
  const eu=G.meuTime;
  if(eu&&(t.includes(eu)||p.some(id=>{const j=G.jogadores[id];return j.timeId===eu||j.base===eu;})))n.meu=1;
  if(p.length)n.p=p;
  if(t.length)n.t=t;
  if(o.imp)n.imp=o.imp;
  G.noticias.unshift(n);
  if(G.noticias.length>NOTICIAS_MAX)G.noticias.pop();
}
/* A manchete: a notícia mais importante das duas últimas semanas, com
   peso extra para o que é do seu clube. */
function manchete(){
  let melhor=null,nota=0;
  for(const n of G.noticias){
    if(n.ano!==G.ano||n.s==null||n.s<(G.semana||1)-1)break;
    if(n.c==='sistema'||!n.txt)continue;
    const v=(n.imp||1)+(n.meu?1.5:0);
    if(v>nota){nota=v;melhor=n;}
  }
  return nota>=2?melhor:null;
}

/* ---------- Calendário da temporada ----------
   As semanas saem do calendário real da VCT 2026, conferido no vlr.gg: os
   Stages regionais duram cerca de sete semanas (o Americas Stage 2 foi de 16
   de julho a 7 de setembro), os Masters cerca de três, e o Champions quatro
   (24 de setembro a 18 de outubro). Entre um torneio e outro sobra semana
   vazia de propósito: é nela que o elenco treina e você resolve o que fazer.

   `ini` e `fim` são semanas do ano. Todo bloco cabe no intervalo dele por
   construção — ver rodadasPorSemana(), que aperta o ritmo quando falta tempo
   em vez de deixar um torneio vazar para o mês seguinte. */
const TEMPORADA=[
  {nome:'Pré-temporada',          ini:1,  fim:4,  endKey:'preseason'},
  {nome:'Kickoff · Grupos',       ini:5,  fim:7,  endKey:'kickGrupos',montar:'kickGrupos'},
  {nome:'Kickoff · Playoffs',     ini:8,  fim:9,  endKey:'kickoff',   montar:'kickPO'},
  {nome:'Masters I · Suíço',      ini:11, fim:12, endKey:'m1Suico',   montar:'m1Suico'},
  {nome:'Masters I · Playoffs',   ini:13, fim:14, endKey:'masters1',  montar:'m1PO'},
  {nome:'Stage 1 · Grupos',       ini:16, fim:20, endKey:'stage1',    montar:'stage1'},
  {nome:'Stage 1 · Playoffs',     ini:21, fim:23, endKey:'po1',       montar:'po1'},
  {nome:'Masters II · Suíço',     ini:25, fim:26, endKey:'m2Suico',   montar:'m2Suico'},
  {nome:'Masters II · Playoffs',  ini:27, fim:28, endKey:'masters2',  montar:'m2PO'},
  {nome:'Pausa do meio do ano',   ini:29, fim:30, endKey:'window'},
  {nome:'Stage 2 · Grupos',       ini:31, fim:35, endKey:'stage2',    montar:'stage2'},
  {nome:'Stage 2 · Playoffs',     ini:36, fim:38, endKey:'po2',       montar:'po2'},
  {nome:'Champions · Grupos',     ini:40, fim:42, endKey:'chGrupos',  montar:'chGrupos'},
  {nome:'Champions · Playoffs',   ini:43, fim:45, endKey:'champions', montar:'chPO'},
  /* Ascension DEPOIS do Champions, como no circuito real. Antes ele vinha
     antes, e a troca de divisão acontecia com o mundial ainda por disputar:
     um clube podia ser rebaixado e, por já não ser mais do Tier 1, sumir da
     conta de quem vai ao Champions. Quem sobe agora sobe para a temporada
     seguinte, que é o que Ascension significa. */
  {nome:'Ascension',              ini:47, fim:48, endKey:'ascension', montar:'ascension'},
  {nome:'Fim de temporada',       ini:49, fim:52, endKey:'offseason'}
];

/* O nome da liga de Challengers da região. Mora em G.regioes[].nomeT2 porque
   REGIONS[].t2 já foi usado para duas coisas — o nome e a lista de times — e a
   segunda apagava a primeira. */
function nomeT2(R){
  const g=G.regioes&&G.regioes[R.id];
  return (g&&g.nomeT2)||R.t2||('Challengers '+String(R.nome||R.id).replace(/^VCT\s*/,''));
}
function montarCalendario(){
  G.calendario=TEMPORADA.map(b=>Object.assign({stages:[]},b));
  G.semana=1;G.bloco=0;
  G.qual={masters1:[],masters2:[],champions:[]};
  /* em que divisão cada clube COMEÇOU o ano: o Ascension troca a divisão antes
     da virada, e a linha da temporada tem de dizer onde ele jogou */
  for(const id in G.times)G.times[id].tierAno=G.times[id].tier;
  /* sedes do ano: sorteio próprio, fora do gerador do motor (core/sedes.js) */
  if(typeof sedesDoAno==='function')sedesDoAno(G.ano);
  REGIONS.forEach(R=>{G.regioes[R.id].pontos={};G.regioes[R.id].t1.forEach(id=>G.regioes[R.id].pontos[id]=0);});
}
/* O bloco que cobre uma semana, ou null se a semana está livre. */
function blocoDaSemana(sem){
  const i=G.calendario.findIndex(b=>sem>=b.ini&&sem<=b.fim);
  return i<0?null:i;
}
/* O próximo bloco a partir de uma semana, para a tela dizer o que vem. */
function proximoBloco(sem){
  return G.calendario.find(b=>b.ini>sem)||null;
}
/* Quantos passam de cada grupo. Quatro por grupo em liga de 12, para o playoff
   sair com oito — que é o tamanho da dupla eliminação real. */
function novoGrupos(o){return novoStage(Object.assign({tipo:'grupos',bo:3,nGrupos:2,rotulo:'Grupos'},o));}
function novoDE(o){return novoStage(Object.assign({tipo:'de',bo:3},o));}
function montarBloco(b){
  if(b.montar==='kickGrupos'){
    b.stages=REGIONS.map(R=>novoGrupos({id:'kg_'+R.id,nome:'Kickoff '+R.nome+' · Grupos',
      regiao:R.id,tier:1,passam:4,times:G.regioes[R.id].t1.slice()}));
  }
  if(b.montar==='kickPO'){
    b.stages=REGIONS.map(R=>{
      const g=acharStage('kg_'+R.id);
      return novoDE({id:'kick_'+R.id,nome:'Kickoff '+R.nome,rotulo:'Playoffs',regiao:R.id,tier:1,
        times:(g&&g.classificados||[]).slice(0,8)});
    });
  }
  if(b.montar==='stage1'||b.montar==='stage2'){
    const n=b.montar==='stage1'?1:2;
    b.stages=[
      ...REGIONS.map(R=>novoGrupos({id:'s'+n+'_'+R.id,nome:'Stage '+n+' · '+R.nome,
        regiao:R.id,tier:1,passam:4,times:G.regioes[R.id].t1.slice()})),
      /* Challengers tem 8 clubes: dois grupos de quatro, passam dois de cada */
      ...REGIONS.map(R=>novoGrupos({id:'c'+n+'_'+R.id,nome:'Split '+n+' · '+nomeT2(R),
        regiao:R.id,tier:2,passam:2,times:G.regioes[R.id].t2.slice()}))
    ];
  }
  if(b.montar==='po1'||b.montar==='po2'){
    const n=b.montar==='po1'?1:2;
    const st=[];
    REGIONS.forEach(R=>{
      const g=acharStage('s'+n+'_'+R.id);
      st.push(novoDE({id:'po'+n+'_'+R.id,nome:'Stage '+n+' · '+R.nome,rotulo:'Playoffs',
        regiao:R.id,tier:1,times:(g&&g.classificados||[]).slice(0,8)}));
      const c=acharStage('c'+n+'_'+R.id);
      st.push(novoDE({id:'cp'+n+'_'+R.id,nome:'Split '+n+' · '+nomeT2(R),rotulo:'Playoffs',
        regiao:R.id,tier:2,times:(c&&c.classificados||[]).slice(0,4)}));
    });
    b.stages=st;
  }
  /* Masters: fase suíça para semear e dupla eliminação para decidir, que é o
     que o Masters faz de verdade desde 2025. */
  if(b.montar==='m1Suico'||b.montar==='m2Suico'){
    const key=b.montar==='m1Suico'?'masters1':'masters2';
    const times=G.qual[key].slice();
    b.stages=times.length>=4?[novoStage({id:key+'_sw',nome:(key==='masters1'?'Masters I':'Masters II')+' · Fase suíça',
      tipo:'swiss',bo:3,rotulo:'Fase suíça',regiao:'INT',tier:1,times,rodadasMax:3})]:[];
  }
  if(b.montar==='m1PO'||b.montar==='m2PO'){
    const key=b.montar==='m1PO'?'masters1':'masters2';
    const sw=acharStage(key+'_sw');
    const times=(sw&&sw.classificados||G.qual[key]||[]).slice(0,8);
    b.stages=times.length>=2?[novoDE({id:key,nome:key==='masters1'?'Masters I':'Masters II',rotulo:'Playoffs',
      regiao:'INT',tier:1,times})]:[];
  }
  if(b.montar==='ascension'){
    b.stages=REGIONS.map(R=>novoStage({id:'asc_'+R.id,nome:'Ascension · '+R.nome,
      tipo:'de',bo:3,regiao:R.id,tier:2,times:vagasAscension(R)}));
  }
  if(b.montar==='chGrupos'){
    const t=[];
    REGIONS.forEach(R=>{
      const P=G.regioes[R.id].pontos;
      const rk=G.regioes[R.id].t1.slice().sort((x,y)=>(P[y]||0)-(P[x]||0)
        ||(G.times[y].temporada.v-G.times[y].temporada.d)-(G.times[x].temporada.v-G.times[x].temporada.d)
        ||G.times[y].prestigio-G.times[x].prestigio);
      t.push(...rk.slice(0,4));
    });
    /* 16 times em quatro grupos de quatro, passam dois — o desenho do
       Champions desde que ele virou torneio de 16. */
    b.stages=[novoGrupos({id:'ch_gr',nome:'Champions '+G.ano+' · Grupos',
      regiao:'INT',tier:1,nGrupos:4,passam:2,times:t})];
  }
  if(b.montar==='chPO'){
    const g=acharStage('ch_gr');
    const times=(g&&g.classificados||[]).slice(0,8);
    b.stages=times.length>=2?[novoDE({id:'champs',nome:'Valorant Champions '+G.ano,rotulo:'Playoffs',
      regiao:'INT',tier:1,times})]:[];
  }
}
/* Quem disputa o Ascension: os quatro melhores da temporada de Challengers,
   somando os dois splits.

   Antes iam só os dois campeões de split — e em três de cada quatro regiões o
   mesmo clube ganhava os dois, então o Ascension virava um jogo que não
   acontecia: subia sem jogar, sem prêmio distribuído e sem melhor jogador.
   Somar a temporada dá um torneio de verdade todo ano, e é mais perto do que
   o Ascension é de fato: a decisão do ano inteiro da divisão de acesso. */
const PONTOS_ASCENSION=[12,8,5,3,2,1];
function vagasAscension(R){
  const pontos={};
  const somar=(id,p)=>{if(id)pontos[id]=(pontos[id]||0)+p;};
  for(const pre of ['cp1_','cp2_']){
    const s=acharStage(pre+R.id);
    if(!s)continue;
    (s.ranking||[]).forEach((id,i)=>somar(id,PONTOS_ASCENSION[i]||0));
  }
  /* a fase de grupos entra como desempate leve: quem foi melhor no ano todo */
  for(const pre of ['c1_','c2_']){
    const s=acharStage(pre+R.id);
    if(!s)continue;
    (s.ranking||[]).forEach((id,i)=>somar(id,Math.max(0,4-i)*0.25));
  }
  const t2=(G.regioes[R.id].t2||[]).slice();
  return t2.sort((x,y)=>(pontos[y]||0)-(pontos[x]||0)
    ||G.times[y].prestigio-G.times[x].prestigio).slice(0,4);
}
function acharStage(id){
  for(const b of G.calendario)for(const s of b.stages)if(s.id===id)return s;
  return null;
}
function fimDeBloco(b){
  const k=b.endKey;
  if(k==='kickoff'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      G.qual.masters1.push(s.ranking[0],s.ranking[1]);
    });
  }
  if(k==='masters1'||k==='masters2'){
    const s=b.stages[0];if(!s)return;
    encerrarStage(s);
    s.ranking.forEach((id,i)=>{const R=G.times[id].regiao;G.regioes[R].pontos[id]=(G.regioes[R].pontos[id]||0)+[9,7,5,4,2,2,1,1][i];});
    /* A Riot mexe no pool depois dos torneios internacionais. É aqui que o
       mapa que você treinou meia temporada pode sair de circulação — e é isso
       que faz o treino de mapa ser aposta e não acúmulo. */
    if(typeof rotacionarMapas==='function')
      rotacionarMapas('depois do '+(k==='masters1'?'Masters I':'Masters II'));
  }
  if(k==='po1'||k==='po2'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      if(s.tier===1){
        s.ranking.forEach((id,i)=>{G.regioes[s.regiao].pontos[id]=(G.regioes[s.regiao].pontos[id]||0)+(PTS_PO[i]||0);});
        if(k==='po1'){G.qual.masters2.push(s.ranking[0],s.ranking[1]);}
      }
    });
  }
  if(k==='ascension'){
    b.stages.forEach(s=>{
      encerrarStage(s);
      const sobe=s.ranking[0];if(!sobe)return;
      const R=G.regioes[s.regiao];
      /* pior time da liga: pontos de circuito, depois campanha da temporada.
         sem o desempate, todos os times fora dos playoffs empatam em 0 e o
         rebaixado virava simplesmente o primeiro do array. */
      const ult=R.t1.slice().sort((x,y)=>{
        const a=G.times[x],b=G.times[y];
        return (R.pontos[x]||0)-(R.pontos[y]||0)
          ||(a.temporada.v-a.temporada.d)-(b.temporada.v-b.temporada.d)
          ||(a.temporada.mv-a.temporada.md)-(b.temporada.mv-b.temporada.md)
          ||a.prestigio-b.prestigio;
      })[0];
      R.t1=R.t1.filter(x=>x!==ult);R.t2=R.t2.filter(x=>x!==sobe);
      R.t1.push(sobe);R.t2.push(ult);
      G.times[sobe].tier=1;G.times[ult].tier=2;
      R.pontos[sobe]=R.pontos[sobe]||0;
      G.times[sobe].prestigio=clamp(G.times[sobe].prestigio+6,20,99);
      G.times[ult].prestigio=clamp(G.times[ult].prestigio-8,20,99);
      if(typeof declararCrise==='function')declararCrise(G.times[ult],'rebaixado');
      noticia('⬆ '+G.times[sobe].nome+' subiu para a liga principal · ⬇ '+G.times[ult].nome+' foi rebaixado.',{c:'competicoes',t:[sobe,ult],imp:2});
    });
  }
  if(k==='champions'){
    const s=b.stages[0];if(!s)return;
    encerrarStage(s);
    G.campeaoMundial=s.ranking[0];
    if(typeof rotacionarMapas==='function')rotacionarMapas('depois do Champions');
  }
  if(k==='offseason')fimDeTemporada();
}

/* ============================================================
   AVANÇO DE TEMPO
   ============================================================ */
/* Quantas rodadas ainda faltam num stage. É isso que permite espremer o
   torneio dentro do intervalo dele em vez de deixá-lo vazar para o mês
   seguinte e atropelar o próximo. */
function rodadasRestantes(s){return rodadasDoStage(s);}
/* Ritmo do bloco nesta semana: normalmente uma rodada por semana, que é como
   uma liga funciona. Só acelera quando o que falta não cabe mais no que resta
   de calendário. */
function rodadasPorSemana(b){
  const falta=Math.max(0,...b.stages.map(rodadasRestantes));
  if(!falta)return 0;
  return Math.max(1,Math.ceil(falta/semanasRestantes(G.semana,b.fim)));
}
/* Uma semana. Sempre uma semana — é o que dá ao jogo uma linha do tempo em vez
   de uma sequência de campeonatos. Semana sem jogo não é tempo perdido: o
   elenco treina, quem está lesionado se recupera e as propostas circulam. */
/* Põe a semana em pé antes de ela ser jogada: acha o bloco do calendário,
   monta os stages dele se for a primeira semana do bloco e deixa a rodada de
   cada stage preparada.

   Era a primeira coisa que avancar() fazia, e só ele fazia. A tela pergunta
   "tem jogo meu?" ANTES de avançar, para abrir o relatório e o veto — e na
   primeira semana de cada torneio a resposta vinha "não", porque o torneio
   ainda não existia. O relógio então simulava a sua partida sem veto. Em duas
   temporadas do SEN, 7 de 32 jogos caíam aqui.

   Agora quem pergunta e quem joga passam pela mesma porta. Ela é idempotente
   (bloco montado não remonta, rodada preparada não reprepara) e, num avanço
   sem tela, roda exatamente no mesmo ponto da sequência de sorteio de antes:
   é a primeira coisa da semana nos dois caminhos. */
function prepararSemana(){
  if(!G.semana)G.semana=1;
  const idx=blocoDaSemana(G.semana);
  const b=idx==null?null:G.calendario[idx];
  if(b){
    G.bloco=idx;
    if(b.montar&&!b._montado){montarBloco(b);b._montado=true;}
    G.fase=b.nome;
    for(const s of b.stages)if(!s.feito)prepararRodada(s);
  }else{
    G.fase='Intervalo';
  }
  return{b,idx};
}
/* O compromisso do seu clube nesta semana — ou, numa semana de rodada dupla,
   no próximo passo dela. É o que permite a tela abrir o relatório e o veto
   ANTES de a partida ser jogada. Devolve null quando não há jogo seu. */
function compromissoDaSemana(){
  if(!G.meuTime)return null;
  const {b}=prepararSemana();
  if(!b)return null;
  /* semana cujo calendário já não pede rodada nenhuma: nada vai ser jogado */
  if(!G.semanaEmCurso&&!rodadasPorSemana(b))return null;
  for(const s of b.stages){
    if(s.feito)continue;
    const rd=s.rodadaAtual||[];
    const par=rd.find(x=>x.includes(G.meuTime));
    if(!par)continue;
    const bo=((s.tipo==='ko'&&s.vivos.length<=2)||(s.tipo==='de'&&s.faseAtual==='gf'))
      ?Math.max(s.bo,5):s.bo;
    return{stage:s,aId:par[0],bId:par[1],bo,
           advId:par[0]===G.meuTime?par[1]:par[0],
           euSouA:par[0]===G.meuTime};
  }
  return null;
}
/* Tem jogo do seu clube na rodada que acabou de ser preparada? É a pergunta
   que decide se a semana para no meio. */
function meuJogoPreparado(b){
  return !!(G.meuTime&&b&&b.stages.some(s=>!s.feito&&(s.rodadaAtual||[]).some(x=>x.includes(G.meuTime))));
}
/* ---------- turnos de dois dias na janela ----------
   A janela de transferências anda devagar: cada Avançar move dois dias, e a
   semana vira três turnos (TURNOS_SEMANA em datas.js). Nos dois primeiros só
   o mercado anda — propostas chegando, a IA contratando, ligações por gente
   sua —, cada um com um terço da chance semanal. O terceiro fecha a semana
   como sempre: partidas, treino, folha e o último terço do mercado.

   Assim a semana tem o mesmo volume de negócios, mas você tem três momentos
   para reagir em vez de um. Os prazos (proposta, multa, conversa fechada)
   continuam contados em semanas, então negociar fica mais folgado, não mais
   apertado. Num avanço sem turnos (avanço rápido, ferramentas de teste) nada
   disso roda e o mercado faz exatamente o que fazia. */
function turnoDisponivel(){
  return !!(G&&G.meuTime&&!G.semanaEmCurso&&janelaAberta(G.ano,G.semana||1)
            &&(G.turno||0)<TURNOS_SEMANA-1);
}
function avancarTurno(){
  if(!turnoDisponivel())return null;
  if(!G.turno){
    /* primeiro turno da semana: o começo dela roda aqui, não no fechamento */
    G.janela=janelaAberta(G.ano,G.semana);
    if(typeof limparNegociacoes==='function')limparNegociacoes();
  }
  const antes=new Set((G.propostas||[]).map(x=>x.id));
  G._noTurno=true;G._fracaoMercado=1/TURNOS_SEMANA;
  try{
    if(typeof gerarPropostas==='function')gerarPropostas();
    if(typeof mercadoVivo==='function')mercadoVivo();
  }finally{G._noTurno=false;G._fracaoMercado=1;}
  G.turno=(G.turno||0)+1;G.turnoUsado=true;
  const novas=(G.propostas||[]).filter(x=>!antes.has(x.id)&&G.jogadores[x.jogadorId]
    &&G.jogadores[x.jogadorId].timeId===G.meuTime);
  return{tipo:'turno',turno:G.turno,semana:G.semana,novas};
}

/* `plano` é o que VOCÊ decidiu antes de a semana rodar: por enquanto o veto de
   mapa da sua partida. Vem da tela e desce até simPartida por ctx — o motor
   continua dono do sorteio, a tela só entrega escolhas. */
function avancar(plano){
  /* Continuação de uma semana de rodada dupla que parou antes do seu segundo
     jogo: o começo da semana (janela, negociações vencidas) já rodou. */
  const em=G.semanaEmCurso||null;
  const {b,idx}=prepararSemana();
  if(!em&&!G.turnoUsado){
    /* a janela segue o calendário (novembro a janeiro, junho e julho), não os torneios */
    G.janela=janelaAberta(G.ano,G.semana);
    if(typeof limparNegociacoes==='function')limparNegociacoes();
  }

  const resultados=[];let minhaPartida=null;
  if(b){
    /* O número de rodadas da semana é decidido UMA vez, no começo dela: numa
       continuação, o que falta do torneio já é outro número. */
    const passos=em?em.passos:rodadasPorSemana(b);
    for(let k=em?em.feitos:0;k<passos;k++){
      const ativos=b.stages.filter(s=>!s.feito);
      if(!ativos.length)break;
      for(const s of ativos){
        /* montar a rodada é privilégio do relógio (aqui e em prepararSemana,
           que roda no mesmo ponto da sequência): é onde o sorteio consome o
           gerador semeado */
        const rd=prepararRodada(s);
        if(!rd||!rd.length){
          s.feito=true;
          s.ranking=(s.ranking&&s.ranking.length)?s.ranking
            :s.tipo==='rr'?ordenarTabela(s)
            :[...(s.vivos||[]),...s.elim.slice().reverse()];
          continue;
        }
        for(const[a,bb]of rd){
          /* Grande final em Bo5, como no circuito de verdade. */
          const bo=((s.tipo==='ko'&&s.vivos.length<=2)||(s.tipo==='de'&&s.faseAtual==='gf'))
            ?Math.max(s.bo,5):s.bo;
          const meuJogo=(a===G.meuTime||bb===G.meuTime);
          const ctx={stage:s.id,nome:s.nome,semana:G.semana};
          if(meuJogo&&plano&&plano.veto&&plano.veto.mapas&&plano.veto.mapas.length
             &&plano.stageId===s.id)ctx.veto=plano.veto;
          /* A SUA partida pode ter sido CONDUZIDA pela tela, round a round,
             para o pedido de tempo valer alguma coisa: nesse caso ela já
             aconteceu e chega aqui pronta, em vez de ser simulada.

             A tentativa anterior era o contrário — o relógio parava no meio da
             semana e devolvia a série aberta para a tela terminar. Parar ali
             deixava as OUTRAS partidas da rodada por jogar, e retomar de
             dentro de três laços aninhados é a receita de uma semana pela
             metade. Assim a ordem fica simples: a tela joga a sua série antes,
             o relógio roda a semana inteira depois. */
          const res=(meuJogo&&plano&&plano.serieFeita&&plano.stageId===s.id
                     &&(plano.serieFeita.aId===a||plano.serieFeita.bId===a))
            ?plano.serieFeita
            :simPartida(a,bb,bo,ctx);
          res.semana=G.semana;
          stageAplicar(s,res);
          resultados.push({stage:s,res});
          if(a===G.meuTime||bb===G.meuTime)minhaPartida=res;
        }
        stageAvancar(s);
      }
      /* Rodada dupla: o calendário apertado põe duas rodadas na mesma semana.
         Se a próxima tem jogo seu, a semana PARA aqui — esse jogo precisa do
         próprio relatório e do próprio veto. Antes ele era simulado direto, e
         a tela só mostrava o último (5 de 32 jogos do SEN em duas temporadas).
         Vale também quando você não jogou a primeira rodada (folga na chave):
         o ritual da semana só enxergava a rodada de abertura.

         Parar entre dois passos do laço não muda a ordem do sorteio: o que
         roda depois é exatamente o que rodaria em seguida. As outras partidas
         da rodada já foram jogadas; a semana só fecha (treino, folha, notícias)
         quando o último passo terminar. */
      if(k+1<passos&&meuJogoPreparado(b)){
        G.semanaEmCurso={passos,feitos:k+1};
        return{tipo:'rodada',resultados,minhaPartida,parcial:true,
               bloco:b.nome,semana:G.semana,encerrado:null};
      }
    }
  }
  G.semanaEmCurso=null;
  return fecharSemana(b,resultados,minhaPartida,idx);
}
/* A segunda metade da semana: tudo o que acontece DEPOIS das partidas. Virou
   função própria porque a sua partida pode ser conduzida pela tela, e nesse
   caso esta parte só roda quando ela terminar. */
function fecharSemana(b,resultados,minhaPartida,idx){
  /* semana que andou em turnos: o fechamento é o último terço do mercado */
  G._fracaoMercado=G.turnoUsado?1/TURNOS_SEMANA:1;
  try{semana();}finally{G._fracaoMercado=1;}
  if(typeof fotoDoRanking==='function')fotoDoRanking();
  if(typeof pagarMetasDaSemana==='function')pagarMetasDaSemana();
  if(typeof radarSemanal==='function')radarSemanal();
  G.turno=0;G.turnoUsado=false;

  /* O bloco encerra quando o último jogo dele acabou — é aí que se paga, se
     entrega o título e se elege o melhor jogador, não numa semana qualquer
     depois. */
  let encerrado=null;
  if(b&&!b._fechado&&(b.stages.length?b.stages.every(s=>s.feito):G.semana>=b.fim)){
    b._fechado=true;encerrado=b.nome;
    fimDeBloco(b);
  }

  /* a diretoria fala no meio do ano, na abertura da janela */
  if(typeof cobrancaDoMeioDoAno==='function'&&G.semana===SEMANA_COBRANCA){
    const v=cobrancaDoMeioDoAno();
    if(v)G.vereditoPendente=v;
  }
  if(typeof registrarCaixaSemana==='function')registrarCaixaSemana();
  const anoAntes=G.ano;
  G.semana++;
  if(G.semana>SEMANAS_ANO){
    /* fimDeTemporada() já vira o ano e remonta o calendário */
    if(G.ano===anoAntes&&typeof fimDeTemporada==='function')fimDeTemporada();
    if(G.ano===anoAntes){G.ano++;montarCalendario();}
    G.semana=1;
  }
  return{tipo:resultados.length?'rodada':'semana',resultados,minhaPartida,
         bloco:b?b.nome:'Intervalo',semana:G.semana-1<1?SEMANAS_ANO:G.semana-1,
         encerrado};
}
/* Semanas até o próximo jogo do seu clube, para o botão de pular o vazio.
   Devolve 0 se há jogo nesta semana. */
function semanasAteMeuJogo(){
  if(!G.meuTime)return 0;
  for(let d=0;d<SEMANAS_ANO;d++){
    const sem=G.semana+d;
    if(sem>SEMANAS_ANO)return d;                 /* vira o ano: pare aqui */
    const i=blocoDaSemana(sem);
    if(i==null)continue;
    const b=G.calendario[i];
    if(!b.stages.length&&b.montar)return d;      /* bloco que ainda vai montar */
    if(b.stages.some(s=>!s.feito&&(s.times||[]).includes(G.meuTime)))return d;
  }
  return 0;
}
function semana(){
  for(const id in G.times){
    const t=G.times[id];
    let folha=0;t.elenco.forEach(pid=>folha+=G.jogadores[pid].salario);
    /* a comissão agora é gente com salário, então saiu do custeio e entrou na
       folha; o custeio ficou só com estrutura e scrims */
    folha+=folhaStaff(t);
    /* Parte do salário de quem está emprestado continua com o dono: é o que
       impede o empréstimo de virar um truque para zerar folha. */
    if(typeof custoEmprestimosDe==='function')folha+=custoEmprestimosDe(t);
    const custeio=custeioSemanal(t);   /* a conta mora em economia.js */
    /* O ano tem SEMANAS_ANO semanas e o relógio anda uma por vez: a receita
       anual entra dividida por elas. Antes o divisor era 44, herdado de quando
       o avanço era por rodada de torneio e o número de avanços por ano era
       aproximado. */
    t.caixa+= t.patroc/SEMANAS_ANO - (folha*12)/SEMANAS_ANO - custeio;
    /* entrosamento por dupla: scrims, insatisfeitos, função disputada,
       sequência de derrotas e a atividade da semana (core/vestiario.js) */
    if(typeof entrosamentoSemanal==='function')entrosamentoSemanal(t);
    else t.sinergia=clamp(t.sinergia+(t.tatica.scrim-3)*0.30,0,100);
    /* A IA escolhe o plano da semana antes de a semana ser aplicada; o seu
       clube usa o que VOCÊ deixou marcado na tela de Treino. */
    if(typeof planoIA==='function')planoIA(t);
    if(typeof aplicarTreinoSemanal==='function')aplicarTreinoSemanal(t);
    if(typeof registrarPreparo==='function')registrarPreparo(t);
    /* comp e tática da semana: a IA reescolhe, o seu clube usa o que você marcou */
    if(typeof limparComps==='function')limparComps(t);
    if(typeof compIA==='function')compIA(t);
    if(typeof taticaIA==='function')taticaIA(t);
    /* promessa não cumprida cobra sozinha, na semana em que vence */
    if(typeof cobrarPromessas==='function')cobrarPromessas(t);
    t.elenco.forEach(pid=>desenvolver(G.jogadores[pid],t));
    if(typeof conferirCartas==='function')conferirCartas(t);
    if(t.base&&t.base.length)baseDe(t).forEach(p=>crescerNaBase(p,t));
    if(t.caixa<0&&id!==G.meuTime)venderPorDinheiro(t);
  }
  G.livres.forEach(pid=>{const p=G.jogadores[pid];p.semLivre=(p.semLivre||0)+1;p.fadiga=clamp(p.fadiga-.05,0,1);p.forma=clamp(p.forma+gauss(0,.02),.2,1);});
  /* Propostas pelos jogadores que você anunciou chegam ao longo da janela,
     uma por vez, e não todas de uma vez quando você aperta um botão. */
  if(typeof gerarPropostas==='function')gerarPropostas();
  /* último ano de contrato: clubes sondam e assinam pré-contrato com os seus */
  if(typeof rondaPreContratos==='function')rondaPreContratos();
  /* mercado vivo: propostas sem anúncio, multa paga, pedidos de saída, a IA
     negociando entre si e o último dia da janela */
  if(typeof mercadoVivo==='function')mercadoVivo();
  /* O patch da Riot cai na semana marcada, depois de o mundo ter jogado com o
     meta antigo — assim o nerf responde ao uso da temporada. */
  if(typeof patchDaSemana==='function')patchDaSemana();
}
function desenvolver(p,t){
  /* O ponto neutro da comissão é NIVEL_NEUTRO (staff.js), não o meio da
     escala: metade do mundo é Tier 2 e a escala de nível é do mundo inteiro.
     Estas duas linhas usavam um 3 escrito à mão, o que deixava TODO clube de
     Challengers no prejuízo — moral que nunca subia e mais lesão — mesmo
     contratando o melhor fisio e o melhor psicólogo que a divisão tem. Os k
     foram reescalados junto para o efeito no Tier 1 continuar o mesmo. */
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  /* O plano da semana deste jogador. É ele que decide se a semana foi de
     evoluir ou de recuperar a perna — e cansaço é o maior fator de derrota do
     jogo, então a escolha custa de verdade. */
  const plano=(typeof planoDoJogador==='function')?planoDoJogador(t,p)
             :{tipo:'atributo',alvo:'mira'};
  const custoPlano=plano.tipo==='descanso'
    ?FADIGA_DESCANSO
    :FADIGA_TREINO+FADIGA_TREINO_MAPA*fatorTreinoMapas(mapasDoTreino(planoDe(t)).length);
  p.fadiga=clamp(p.fadiga-0.035-recuperacaoEst(t)+(t.tatica.scrim-2)*0.008
                 -((t.staff.fisio||neutro)-neutro)*0.0027+custoPlano,0,1);
  if(p.lesao>0){p.lesao--;if(!p.lesao&&t.id===G.meuTime)noticia(p.nome+' está recuperado.',{c:'clube',p:[p.id]});}
  p.moral=clamp(p.moral+((t.staff.mental||neutro)-neutro)*0.0009+0.004+moralEst(t),.15,1);
  if(typeof confiancaSemanal==='function')confiancaSemanal(t,p);
  /* burnout: fadiga acumulada cobra moral e abre risco de lesão */
  if(p.fadiga>0.82){
    p.moral=clamp(p.moral-0.022*fatorBurnoutEst(t),.15,1);
    /* o centro de performance corta o risco; o sorteio é o mesmo de antes */
    if(rnd()<(0.02+ (p.fadiga-0.82)*0.10)*fatorLesaoEst(t)){p.lesao=ri(1,2);
      if(t.id===G.meuTime)noticia('🩹 '+p.nome+' quebrou por desgaste — '+p.lesao+' semana(s) fora.',{c:'clube',p:[p.id]});}
  }
  const o=over(p),gap=p.pot-o;
  /* Pico e declínio acompanham a carreira mais longa: cresce até 27, estabiliza
     até 30, cai a partir dos 31. O declínio acelera com a idade, mas devagar o
     bastante para um jogador de 38 anos ainda ser aproveitável — se ele cai a
     pique, esticar a aposentadoria não serve para nada, porque ninguém contrata
     um veterano inútil. */
  const taxa = p.idade<=19?.016 : p.idade<=22?.010 : p.idade<=24?.005
             : p.idade<=27?.002 : p.idade<=30?0 : -.008;
  const titular=t.titulares.includes(p.id);
  /* Cobrança dá trabalho: quem levou bronca na conversa treina com mais foco
     por algumas semanas. É o que faz a opção que CUSTA moral valer a pena. */
  const bronca=(typeof estaCobrado==='function'&&estaCobrado(p))?1.25:1;
  const mult=(efCT(nivelEst(t,'treino'))+t.staff.tecnico*0.07)*(titular?1.15:0.75)*(0.7+p.moral*0.5)*(0.85+t.tatica.scrim*0.05)*bronca;
  /* o declínio da idade é freado (ou acelerado) pelo centro de performance */
  let g = taxa>0 ? gap*taxa*mult : taxa*(p.idade-29)*fatorDeclinioEst(t);
  if(Math.abs(g)<0.0004)return;
  /* Para onde a evolução vai. Antes era um foco de TIME; agora é o plano do
     jogador. Quem descansa não evolui, e quem está aprendendo agente põe o
     trabalho na familiaridade em vez dos atributos — o que é o custo real de
     correr atrás do meta. */
  let alvos, concentra=1;
  if(plano.tipo==='descanso'){alvos=[];}
  else if(plano.tipo==='agente'){alvos=[];}
  else if(plano.alvo&&ATTRS.some(a=>a[0]===plano.alvo)){
    alvos=[plano.alvo];concentra=FOCO_CONCENTRADO;
  }else{
    alvos=['mira','util','visao','clutch'];
  }
  /* O que cai primeiro é a parte física: reflexo, mira, movimentação. Leitura
     de jogo e utilidade envelhecem bem, e é por isso que veterano costuma
     migrar para função de suporte em vez de sumir.

     Mas TUDO precisa cair um pouco, senão um Controlador nunca envelhece —
     era o que estava acontecendo: metade dos titulares do circuito passou dos
     30 com over acima da média da liga, e os garotos não achavam vaga. */
  const decl=['reflexo','mira','mov'];
  const lista = g>0?alvos:decl;
  /* equipamentos, sala de análise e bem-estar aceleram cada um o seu grupo
     de atributos (core/estrutura.js) */
  lista.forEach(k=>{p.at[k]=clamp(p.at[k]+g*(g>0?2.4*concentra*fatorEvolucaoAtributo(t,k):1.6),25,99);});
  if(g<0)for(const[k]of ATTRS)
    if(!decl.includes(k)&&k!=='lider')p.at[k]=clamp(p.at[k]+g*0.55,25,99);
  /* O empurrãozinho aleatório só existe para quem TREINOU. Sem esta guarda o
     jogador em descanso continuava evoluindo por aqui, e a semana de descanso
     saía de graça — foi exatamente o que a medição mostrou. */
  if(g>0&&alvos.length&&rnd()<.25)p.at[pick(['mira','util','visao','clutch','consist','mov','reflexo'])]+=g;
  for(const[k]of ATTRS)p.at[k]=clamp(p.at[k],25,99);
  /* O perfil mudou, então a segunda função pode ter deixado de fazer sentido —
     ou passado a fazer. Sem revalidar aqui, o jogador carregava para sempre a
     secundária que ganhou no dia em que nasceu. */
  ajustarSecundaria(p);
  /* Marca de quão bom ele já foi. É a régua do declínio: quem caiu muito do
     próprio pico é quem pendura o mouse, independentemente da idade. */
  p.pico=Math.max(p.pico||0,over(p));
  p.valor=valor(p);p.salarioJusto=salario(p,p.timeId&&G.times[p.timeId]);
}
function venderPorDinheiro(t){
  if(t.elenco.length<=5)return;
  const cand=t.elenco.map(i=>G.jogadores[i]).filter(p=>!t.titulares.includes(p.id));
  if(!cand.length)return;
  const p=cand.sort((a,b)=>b.valor-a.valor)[0];
  t.caixa+=p.valor*.8;liberar(p);
}
/* Um jogador deixa de existir em três lugares — aposentadoria, poda do mercado
   de agentes livres e o Apagar do Banco de dados — e cada um deles apagava só
   o que lembrava de apagar. Aqui mora a limpeza inteira: o que aponta para ele
   sai junto, senão fica proposta por um fantasma, plano de treino de quem não
   existe e crachá de IGL pendurado num id morto. */
function esquecerJogador(pid){
  if(!pid)return;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==pid);
  for(const tid in G.times){
    const t=G.times[tid];
    if(t.treino&&t.treino.individual)delete t.treino.individual[pid];
    if(t.igl===pid)t.igl=(t.titulares||[]).find(x=>x!==pid)||null;
  }
}
function liberar(p){
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  const t=G.times[p.timeId];
  if(t){t.elenco=t.elenco.filter(x=>x!==p.id);t.titulares=t.titulares.filter(x=>x!==p.id);
    if(typeof esquecerDuplas==='function')esquecerDuplas(t,p.id);else t.sinergia=clamp(t.sinergia-12,0,100);
    autoEscalar(t);
    /* o plano de treino perde a linha dele agora, não na semana que vem: quem
       saiu no meio da semana ficava planejado até o próximo aplicarTreino, e a
       tela de Treino mostrava o nome de quem já não era do clube */
    if(typeof limparPlano==='function')limparPlano(t);}
  p.timeId=null;p.contrato=0;p.semLivre=0;G.livres.push(p.id);
}
function contratar(p,time,anos,sal){
  let origem=null;
  if(p.timeId){origem=G.times[p.timeId];
    origem.elenco=origem.elenco.filter(x=>x!==p.id);
    origem.titulares=origem.titulares.filter(x=>x!==p.id);
    if(typeof esquecerDuplas==='function')esquecerDuplas(origem,p.id);else origem.sinergia=clamp(origem.sinergia-10,0,100);
    autoEscalar(origem);
    if(typeof limparPlano==='function')limparPlano(origem);}
  G.livres=G.livres.filter(x=>x!==p.id);
  delete p.semLivre;
  p.timeId=time.id;p.contrato=anos;p.salario=sal;p.moral=clamp(p.moral+.08,.2,1);
  /* contrato novo, multa nova: quem fecha pela mesa fixa o valor logo depois */
  delete p.multa;delete p.sondado;delete p.pedidoSaida;delete p.semInfeliz;
  if(p.preContrato&&p.preContrato.clubeId!==time.id)delete p.preContrato;
  if(G.negociacoes)G.negociacoes=G.negociacoes.filter(n=>n.jogadorId!==p.id||n.fase==='fechada');
  /* O anúncio é do clube que anunciou, não do jogador: mudou de clube, o
     anúncio morre. Sem isto ele chegava ao clube novo já com a plaquinha de
     "à venda" no pescoço, e as propostas continuavam chegando para quem
     acabara de contratá-lo. */
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  time.elenco.push(p.id);
  /* entrosamento: as duplas do recém-chegado começam abaixo da média do time */
  if(typeof chegarAoElenco==='function')chegarAoElenco(time,p.id);else time.sinergia=clamp(time.sinergia-8,0,100);
  autoEscalar(time);
  /* Quem vende repõe na hora. A trava mora AQUI, e não em cada tela que
     negocia, porque toda transferência do jogo passa por esta função — foi
     exatamente por não estar aqui que comprar de um clube com cinco jogadores
     deixava aquele clube com quatro e quebrava a escalação dele. Liberar por
     corte de folha continua podendo descer de cinco: aquilo é decisão de
     diretoria e o fim de temporada repõe. Vender, não. */
  if(origem&&typeof reporElenco==='function')reporElenco(origem);
}

/* ============================================================
   MERCADO DE AGENTES LIVRES
   ------------------------------------------------------------
   O que decide se um jogador aceita mudar de clube mora em
   core/transferencia.js, e vale igual para você e para a IA.
   Aqui ficou só o preenchimento de elenco a partir de quem
   está sem contrato.
   ============================================================ */
function mercadoIA(){
  const times=Object.values(G.times).sort((a,b)=>b.prestigio-a.prestigio);
  for(const t of times){
    if(t.id===G.meuTime)continue;
    /* Dois tetos, e os dois precisam ser respeitados. O caixa diz o que o
       clube tem hoje; a folga salarial diz o que a receita sustenta todo mês.
       Só o caixa era conferido — por isso um clube com dinheiro no banco e
       nenhuma folga na receita continuava assinando, e a folha do Challengers
       chegava a 100% da receita. O elenco mínimo continua garantido depois,
       por garantirElencos(): pôr cinco em quadra vem antes do orçamento. */
    while(t.elenco.length<7&&G.livres.length){
      const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
      const folga=folgaSalarial(t);
      if(folga<=0)break;
      const teto=Math.min(Math.max(60000,t.caixa*.35),folga*12);
      const alvo=G.livres.map(i=>G.jogadores[i])
        .filter(p=>p.role===falta||p.role==='Flex')
        .sort((a,b)=>over(b)-over(a))
        .find(p=>salario(p,t)*12<teto&&Math.abs(over(p)-t.prestigio)<16);
      const esc=alvo
        ||G.livres.map(i=>G.jogadores[i]).sort((a,b)=>over(b)-over(a)).find(p=>salario(p,t)*12<teto)
        ||G.livres.map(i=>G.jogadores[i]).sort((a,b)=>salario(a,t)-salario(b,t))
            .find(p=>salario(p,t)*12<teto);
      if(!esc)break;
      contratar(esc,t,ri(1,3),salario(esc,t));
    }
    /* Reforço: trocar o pior titular. Antes era um dado de 30% e pronto, o que
       deixava clube rico sentado em cima de meio milhão de folga enquanto o
       mercado ficava entupido de jogador bom sem clube. Agora quem tem folga
       larga tenta sempre — é o que um clube com dinheiro faz, e é o que faz o
       dinheiro ganho vencendo virar elenco em vez de saldo parado. */
    const folgaLarga=folgaSalarial(t)*12>receitaLivre(t)*0.25;
    if((folgaLarga||rnd()<.30)&&t.elenco.length<9){
      const pior=t.titulares.map(i=>G.jogadores[i]).sort((a,b)=>over(a)-over(b))[0];
      if(!pior)continue;
      const tetoR=Math.min(t.caixa*.4,folgaSalarial(t)*12);
      const alvo=G.livres.map(i=>G.jogadores[i]).filter(p=>over(p)>over(pior)+3&&salario(p,t)*12<tetoR)
        .sort((a,b)=>over(b)-over(a))[0];
      if(alvo)contratar(alvo,t,ri(2,3),salario(alvo,t));
    }
    autoEscalar(t);
  }
  garantirElencos();
}

/* Rede de segurança do mercado.

   `mercadoIA` só sabe contratar de `G.livres`; quando o mercado secava, o
   laço saía sem preencher e o clube ficava com quatro jogadores para sempre —
   não havia nada que o trouxesse de volta. Agora o elenco mínimo é garantido
   por construção: se não há ninguém disponível, o clube promove alguém da
   base. É o que um clube de verdade faria, e transforma "elenco entre 5 e 9"
   de torcida em invariante. */
const ELENCO_MIN=5, ELENCO_MAX=9;
/* Idade de todo jogador que o jogo GERA depois do mundo pronto: 15 ou 16.
   Quem entra, entra pela base — não aparece pronto. Vale para a promessa da
   academia, para o sangue novo do mercado e para a promoção de emergência. */
const IDADE_NOVO_MIN=15, IDADE_NOVO_MAX=16;
function garantirElencos(){
  for(const id in G.times)reporElenco(G.times[id]);
}
/* Reposição de UM clube. Vive separada porque não é só rede de fim de
   temporada: é o que o clube faz no instante em que perde um jogador. Vender
   e ficar com quatro em quadra não é uma possibilidade que o jogo deva
   oferecer a ninguém, nem à IA nem a você. */
function reporElenco(t){
  if(!t)return 0;
  if(t._repondo)return 0;          /* reporElenco chama contratar, que chama reporElenco */
  t._repondo=true;
  try{
    const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
    let emergencias=0;
    while(t.elenco.length<ELENCO_MIN){
      /* Primeiro o melhor que CABE no orçamento. Se nada couber, o MAIS
         BARATO — não o melhor. Pegar sempre o melhor da lista era o que
         devolvia ao clube endividado o mesmo salário que ele acabara de
         cortar: o clube demitia o jogador de 108k, ele caía no mercado como o
         melhor livre disponível, e no minuto seguinte o mesmo clube o
         recontratava. O buraco nunca fechava. Cinco em quadra continua vindo
         antes do orçamento — o que muda é quem entra. */
      const disp=G.livres.map(i=>G.jogadores[i]).filter(Boolean)
        .sort((a,b)=>over(b)-over(a));
      const teto=folgaSalarial(t)*12;
      const livre=disp.find(p=>salario(p,t)*12<=teto)
        ||disp.slice().sort((a,b)=>salario(a,t)-salario(b,t))[0];
      if(livre){contratar(livre,t,ri(1,2),salario(livre,t));continue;}
      const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
      const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
      const[piso]=FAIXAS.jogador[t.tier];
      const p=makePlayer(clamp(piso-8+ri(0,6),FAIXAS.jogador[2][0]-14,piso),
                         falta,pick(R.paises),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
      p.contrato=2;p.salario=salario(p,t);p.valor=valor(p);
      p.timeId=t.id;G.jogadores[p.id]=p;t.elenco.push(p.id);
      emergencias++;
      if(emergencias>6)break;   /* cinto de segurança contra laço infinito */
    }
    if(emergencias&&t.id===G.meuTime)
      noticia('⚠ Sem opção no mercado: '+emergencias+' jogador(es) promovido(s) da base às pressas.',{c:'clube',t:[t.id]});
    autoEscalar(t);
    return emergencias;
  }finally{ delete t._repondo; }
}

/* ============================================================
   TRANSFERÊNCIAS
   ------------------------------------------------------------
   Antes: a IA só assinava agente livre, só na virada, e 82% dos
   contratos renovavam sozinhos. Não existia transferência entre
   clubes — o mercado era um depósito, não um mercado.

   O modelo aqui é UM só, e vale para os dois lados: a proposta
   que você faz e a que a IA faz passam pela mesma avaliação. Se
   um clube da IA não consegue tirar um jogador do rival por
   aquele dinheiro, você também não consegue.

   A ideia central é que TUDO vira preço. Em vez de uma lista de
   "não pode", cada coisa que desagrada o jogador vira um prêmio
   salarial que alguém tem de pagar:

     · cair de divisão               premio grande
     · ir para um clube mais fraco   proporcional à queda
     · virar reserva                 proporcional ao rebaixamento
     · mudar de região               conforme a distância
     · ir para a China               o maior de todos

   Assim a resposta nunca é um "não" opaco: é sempre "não por
   esse valor", e a interface consegue dizer quanto falta. As
   poucas recusas que dinheiro NÃO compra estão em recusasDuras()
   e são de ambição, não de conta.
   ============================================================ */

/* ---------- de onde o jogador é ---------- */
/* A região natal sai do país, não do clube atual: um brasileiro que joga na
   Europa continua sendo brasileiro na hora de decidir para onde vai. */
function regiaoNatal(p){
  for(const R of REGIONS)if((R.paises||[]).includes(p.pais))return R.id;
  return p.regiaoOrigem||(p.timeId&&G.times[p.timeId]?G.times[p.timeId].regiao:REGIONS[0].id);
}

/* Quanto custa convencer alguém a se mudar para cada região, quando não é a
   dele. Não é julgamento sobre os lugares: é fuso, idioma, visto e distância
   do circuito em que ele construiu a carreira. A China paga mais caro porque
   é a mudança mais dura para quem vem de fora — e é assim no cenário real. */
const DIFICULDADE_REGIAO={AMER:1.00, EMEA:1.04, PAC:1.12, CN:1.26};
/* Prêmio só por sair de casa, qualquer que seja o destino. */
const PREMIO_EXPATRIADO=1.10;
/* Regiões que compartilham fuso e circuito pesam menos entre si. */
const VIZINHAS={AMER:['AMER'], EMEA:['EMEA'], PAC:['PAC','CN'], CN:['CN','PAC']};

function premioRegiao(p,destino){
  const casa=regiaoNatal(p), alvo=destino.regiao;
  if(alvo===casa)return 1;
  const dif=DIFICULDADE_REGIAO[alvo]||1.10;
  /* mudança dentro da vizinhança (Pacífico ↔ China) dói menos */
  const perto=(VIZINHAS[casa]||[]).includes(alvo);
  return 1+(PREMIO_EXPATRIADO*dif-1)*(perto?0.55:1);
}

/* ---------- o que ele encontra no destino ---------- */
/* Em que posição do elenco ele entraria, considerando a função em que jogaria.
   1 a 5 é titular; acima disso é banco, e banco tem preço. */
function posicaoNoElenco(p,destino){
  const atuais=(destino.elenco||[]).map(i=>G.jogadores[i]).filter(x=>x&&x.id!==p.id);
  const meu=Math.max(overComo(p,p.role),p.role2?overComo(p,p.role2):0);
  return 1+atuais.filter(x=>over(x)>meu).length;
}
/* Força esportiva do clube, do ponto de vista de quem vai assinar: o que pesa
   é o elenco titular e o peso do nome, não o caixa. */
function nivelDoClube(t){
  if(!t)return 40;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const forca=tit.length?tit.reduce((s,x)=>s+over(x),0)/tit.length:t.prestigio;
  return forca*0.62+t.prestigio*0.28+(t.tier===1?10:0);
}

/* ---------- perfil ----------
   Todo jogador tem um jeito de decidir, e ele não muda: é o que faz dois
   jogadores de mesmo over reagirem diferente à mesma proposta. O perfil não
   inventa motivo novo, ele muda o PESO dos que já existem: o ambicioso sente o
   dobro a queda de nível, o mercenário quase não sente, o patriota sofre para
   sair de casa. Sai do nome, então é estável entre saves e não depende da
   base; o Editor pode fixar outro em p.perfil. */
const PERFIS={
  ambicioso:  {nome:'Ambicioso', desc:'Quer título. Clube forte vale mais que salário, e clube fraco ele recusa.',
               esporte:1.5, lugar:1},
  mercenario: {nome:'Mercenário',desc:'Vai atrás do maior salário. O projeto pesa pouco, luvas pesam muito.',
               esporte:0.5, lugar:0.6, premio:1.08, luvas:1.5},
  leal:       {nome:'Leal',      desc:'Apegado ao clube. Renova mais barato e é difícil de tirar de onde está.',
               esporte:1, lugar:1, saida:1.15, renova:0.93},
  patriota:   {nome:'Patriota',  desc:'Quer jogar perto de casa. Sair da região custa o dobro.',
               esporte:1, lugar:2},
  equilibrado:{nome:'Equilibrado',desc:'Pesa tudo na mesma medida.',esporte:1, lugar:1}
};
function _hashTxt(s){let h=2166136261;s=String(s);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function perfilDe(p){
  if(p&&p.perfil&&PERFIS[p.perfil])return p.perfil;
  const r=_hashTxt((p&&p.nome)+'|perfil')%100;
  return r<20?'ambicioso':r<38?'mercenario':r<52?'leal':r<66?'patriota':'equilibrado';
}
/* Temporadas seguidas no clube atual, contadas do histórico. */
function temporadasNoClube(p){
  const t=p.timeId?G.times[p.timeId]:null;if(!t)return 0;
  let n=0;
  for(let i=(p.hist||[]).length-1;i>=0;i--){if(p.hist[i].time===t.nome)n++;else break;}
  return n;
}
/* Rival de verdade, pela mesma régua do clássico (legado.js). Olha só o
   confronto direto entre os dois: varrer todos os rivais do clube a cada
   pedido custaria caro, porque a IA pede preço de centenas de jogadores. */
function saoRivais(a,b){
  if(!a||!b||a.id===b.id||typeof confronto!=='function'||typeof notaRivalidade!=='function')return false;
  const c=confronto(a.id,b.id);
  if(!c.jogos)return false;
  const corte=(typeof RIV_CLASSICO!=='undefined')?RIV_CLASSICO:0.28;
  return notaRivalidade(a,{...c,time:b})>corte;
}
function titulosRecentes(t){
  const desde=(G.ano||0)-1;
  return (t.titulos||[]).filter(x=>parseInt(String(x),10)>=desde).length;
}

/* ---------- o pedido salarial ---------- */
const PREMIO_QUEDA_DIVISAO=1.55;   /* Tier 1 → Tier 2 */
const DESCONTO_SUBIDA_DIVISAO=0.88;/* Tier 2 → Tier 1: ele quer ir, aceita menos */
const PREMIO_POR_PONTO_QUEDA=0.014;/* por ponto de nível de clube perdido */
const DESCONTO_POR_PONTO_SUBIDA=0.006;
const PREMIO_BANCO=[1,1,1,1,1,1.18,1.30,1.42,1.52];  /* por posição no elenco */
const PREMIO_RIVAL=1.22, PREMIO_RIVAL_LEAL=1.40;

/* Detalhamento do pedido, para a interface conseguir explicar linha a linha
   em vez de mostrar um número que caiu do céu.

   Cada linha tem um TIPO. O que não é dinheiro (nível, minutos, lugar,
   história, momento) é também o que decide o INTERESSE dele pelo clube —
   interessePor() lê as mesmas linhas, então o termômetro da tela e o salário
   pedido nunca discordam. `opts.promessa` é a titularidade prometida no
   contrato. */
function detalharPedido(p,destino,opts){
  opts=opts||{};
  const origem=p.timeId?G.times[p.timeId]:null;
  const base=salario(p,destino,true);
  const pf=PERFIS[perfilDe(p)];
  const itens=[];
  const juntar=(rot,f,tipo,k)=>{
    if(k!=null&&k!==1)f=Math.pow(f,k);
    if(Math.abs(f-1)>0.005)itens.push({rot,fator:f,tipo:tipo||'dinheiro'});
    return f;
  };

  let f=1;
  /* divisão */
  if(origem&&origem.tier===1&&destino.tier===2)f*=juntar('Cair para o Tier 2',PREMIO_QUEDA_DIVISAO,'esporte',pf.esporte);
  else if(origem&&origem.tier===2&&destino.tier===1)f*=juntar('Subir para o Tier 1',DESCONTO_SUBIDA_DIVISAO,'esporte',pf.esporte);

  /* qualidade do clube */
  const nOrigem=origem?nivelDoClube(origem):nivelDoClube(destino)-6;
  const nDestino=nivelDoClube(destino);
  const salto=nDestino-nOrigem;
  if(salto<0)f*=juntar('Clube mais fraco que o atual',1+(-salto)*PREMIO_POR_PONTO_QUEDA,'esporte',pf.esporte);
  else if(salto>0)f*=juntar('Clube melhor que o atual',1-Math.min(0.14,salto*DESCONTO_POR_PONTO_SUBIDA),'esporte',pf.esporte);
  const tr=titulosRecentes(destino);
  if(tr)f*=juntar('Clube campeão recente ('+tr+' título'+(tr>1?'s':'')+')',1-Math.min(0.09,tr*0.03),'esporte',pf.esporte);

  /* minutos */
  const pos=posicaoNoElenco(p,destino);
  const jovem=p.idade<=21;
  if(opts.promessa){
    f*=juntar('Titularidade prometida em contrato',pos>5?1.03:0.97,'minutos');
  }else if(pos>5){
    f*=juntar('Entraria como reserva ('+pos+'º do elenco)',
              PREMIO_BANCO[Math.min(pos,PREMIO_BANCO.length-1)],'minutos',jovem?1.3:1);
  }
  if(origem&&origem.id!==destino.id&&!(origem.titulares||[]).includes(p.id)&&(pos<=5||opts.promessa))
    f*=juntar('Ganharia a vaga de titular que não tem hoje',0.92,'minutos',jovem?1.3:1);

  /* região */
  const pr=premioRegiao(p,destino);
  if(pr!==1){
    const casa=regiaoNatal(p);
    const R=REGIONS.find(r=>r.id===destino.regiao);
    f*=juntar('Mudar de '+casa+' para '+((R&&R.nome)||destino.regiao),pr,'lugar',pf.lugar);
  }

  /* história: rival, clube formador, raízes no clube atual */
  if(origem&&origem.id!==destino.id){
    if(saoRivais(origem,destino))
      f*=juntar('Ir para o rival do '+origem.nome,perfilDe(p)==='leal'?PREMIO_RIVAL_LEAL:PREMIO_RIVAL,'historia');
    const anos=temporadasNoClube(p);
    if(pf.saida&&anos>=2)f*=juntar('Identificado com o '+origem.nome+' ('+anos+' temporadas)',pf.saida,'historia');
    else if(anos>=4)f*=juntar('Raízes no '+origem.nome+' ('+anos+' temporadas)',1.05,'historia');
    /* o momento no clube atual: quem está mal quer sair */
    if(p.moral<0.45)f*=juntar('Infeliz no '+origem.nome+': quer sair',0.92,'momento');
  }
  if(p.daCasa&&p.daCasa===destino.id&&(!origem||origem.id!==destino.id))
    f*=juntar('Voltar ao clube que o revelou',0.88,'historia');

  /* idade e ambição: garoto troca dinheiro por projeto, veterano não */
  if(p.idade<=21&&salto>4)f*=juntar('Jovem em ascensão: aceita menos por projeto',0.93,'esporte');
  if(p.idade>=28)f*=juntar('Veterano: quer garantir o contrato',1.06);
  if(pf.premio)f*=juntar('Perfil mercenário: quer o melhor salário do mercado',pf.premio);
  if(typeof fatorRiqueza==='function')f*=juntar('O clube tem muito dinheiro em caixa',fatorRiqueza(destino));
  if(!p.timeId&&p.semLivre>=4)f*=juntar('Sem clube há '+p.semLivre+' semanas',descontoSemClube(p),'momento');
  /* dificuldade da carreira: só no que é cobrado de você */
  if(destino.id===G.meuTime&&dificuldade().salario!==1)
    f*=juntar('Dificuldade '+dificuldade().nome.toLowerCase(),dificuldade().salario);

  return{base,fator:f,itens,pos,salto,perfil:perfilDe(p),
         pedido:Math.max(300,Math.round(base*f/100)*100)};
}

/* ---------- interesse ----------
   De 0 a 100, quanto ele quer jogar no clube, deixando o dinheiro de fora.
   Sai das mesmas linhas do pedido: um fator de ×1,30 tira cerca de 15
   pontos, um de ×0,88 dá cerca de 7. Abaixo de INTERESSE_MIN ele nem atende
   — é a recusa que salário não compra. */
const INTERESSE_MIN=15;
const INTERESSE_ESCALA=58, INTERESSE_NEUTRO=52;
const FAIXAS_INTERESSE=[
  {min:70,id:'empolgado', nome:'Empolgado',  txt:'Quer muito vir. Aceita até ganhar um pouco menos.'},
  {min:48,id:'interessado',nome:'Interessado',txt:'Gosta do projeto. Aceita o salário justo.'},
  {min:30,id:'morno',     nome:'Morno',      txt:'Ouve a proposta, mas só vem se o dinheiro compensar.'},
  {min:INTERESSE_MIN,id:'frio',nome:'Frio',  txt:'Não se anima. Só vem bem acima do normal.'},
  {min:0, id:'fechado',   nome:'Não atende', txt:'Não quer nem conversar com o clube.'}];
function pontosDoFator(f){return -INTERESSE_ESCALA*Math.log(f);}
function faixaInteresse(n){return FAIXAS_INTERESSE.find(x=>n>=x.min)||FAIXAS_INTERESSE[FAIXAS_INTERESSE.length-1];}
function interessePor(p,destino,opts){
  const d=(opts&&opts.d)||detalharPedido(p,destino,opts);
  const itens=d.itens.filter(i=>i.tipo!=='dinheiro')
    .map(i=>({...i,pontos:Math.round(pontosDoFator(i.fator))}));
  let pts=INTERESSE_NEUTRO;
  for(const i of itens)pts+=pontosDoFator(i.fator);
  const nota=clamp(Math.round(pts),0,100);
  return{nota,faixa:faixaInteresse(nota),itens,perfil:d.perfil};
}
function salarioPedido(p,destino){return detalharPedido(p,destino).pedido;}

/* ---------- o pedido do clube dono ---------- */
function pedidoDeVenda(p){
  const t=p.timeId?G.times[p.timeId]:null;
  if(!t)return 0;
  const titular=(t.titulares||[]).includes(p.id);
  /* Contrato longo e titularidade encarecem; folga de potencial também, porque
     o clube sabe que está vendendo o que o jogador ainda vai ser. */
  let m=1+(titular?.45:.10)+(p.contrato*.18)+Math.max(0,p.pot-over(p))*.012;
  /* Clube no elenco mínimo cobra mais: vender significa ter de repor no mesmo
     dia, e a reposição sai do bolso dele. É por isso que na vida real ninguém
     tira um titular de um elenco curto pelo preço de tabela. */
  const min=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
  if((t.elenco||[]).length<=min)m*=1.35;
  else if((t.elenco||[]).length<=min+1)m*=1.12;
  /* clube sem dinheiro aceita menos: é a válvula que faz o mercado girar */
  if(t.caixa<t.patroc*0.15)m*=0.78;
  return Math.round(p.valor*m/500)*500;
}

/* ---------- multa rescisória ----------
   Todo contrato tem uma. Paga a multa, o clube dono não tem como recusar: só
   o jogador decide. Enquanto ninguém fixa um valor (contrato vindo da base de
   dados), ela segue o valor de mercado e os anos restantes. */
function multaPadrao(p,anos){
  const a=anos!=null?anos:(p.contrato||1);
  return Math.max(25000,Math.round((p.valor||valor(p))*(1.7+0.25*a)/5000)*5000);
}
function multaDe(p){
  if(!p||!p.timeId)return 0;
  return p.multa>0?p.multa:multaPadrao(p);
}

/* ---------- postura do clube dono ----------
   Antes de qualquer número, o clube tem uma posição sobre o jogador. É o que
   aparece na mesa ao lado do escudo, e é o que decide se dá para negociar ou
   se a única porta é a multa. */
const POSTURAS={
  intransferivel:{nome:'Intransferível',cls:'r'},
  negociavel:    {nome:'Negociável',    cls:''},
  avenda:        {nome:'À venda',       cls:'t'},
  livre:         {nome:'Sem clube',     cls:'t'}};
function posturaDoClube(p){
  const t=p.timeId?G.times[p.timeId]:null;
  if(!t)return{id:'livre',...POSTURAS.livre,motivo:'Agente livre: não há taxa de transferência.'};
  const min=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
  const titular=(t.titulares||[]).includes(p.id);
  const apertado=t.caixa<0||t.caixa<t.patroc*0.15;
  const ordem=(t.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const rank=ordem.findIndex(x=>x.id===p.id);
  const r=(id,motivo)=>({id,...POSTURAS[id],motivo});
  if(p.anuncio)return r('avenda','O próprio clube colocou o jogador no mercado.');
  if(p.emprestimo)return r('intransferivel','Está emprestado: o clube dono decide no fim do empréstimo.');
  if(typeof emCrise==='function'&&emCrise(t))return r('avenda','Clube em crise ('+t.crise.motivo+'): liquidação do elenco.');
  if(p.pedidoSaida&&!p.pedidoSaida.negado)return r('avenda','Pediu para ser negociado.');
  if(titular&&rank>=0&&rank<2&&p.contrato>=2&&!apertado)
    return r('intransferivel','Um dos dois melhores do elenco, com contrato longo.');
  if(apertado)return r('avenda','O clube precisa de caixa e aceita menos.');
  if(!titular&&rank>=6)return r('avenda','Sem espaço no elenco.');
  if(p.moral<0.40)return r('avenda','O jogador está insatisfeito e quer sair.');
  if(p.contrato<=1)return r('negociavel','Último ano de contrato: o clube prefere vender a perder de graça.');
  if((t.elenco||[]).length<=min+1)return r('negociavel','Elenco curto: vender obriga a repor, e isso entra no preço.');
  return r('negociavel',titular?'Titular, mas tem preço.':'Reserva com preço de mercado.');
}
/* O preço que o clube pede, já com a postura. Intransferível = multa. */
function precoPedido(p){
  if(!p.timeId)return 0;
  const ps=posturaDoClube(p);
  if(ps.id==='intransferivel')return multaDe(p);
  const base=p.anuncio&&p.anuncio.pedido?p.anuncio.pedido:pedidoDeVenda(p);
  /* "à venda" por elenco cheio ou jogador infeliz baixa o preço; o desconto
     do clube sem caixa já mora em pedidoDeVenda */
  const dono=G.times[p.timeId];
  const desc=typeof emCrise==='function'&&emCrise(dono)&&!p.anuncio?CRISE_DESCONTO
    :ps.id==='avenda'&&!p.anuncio&&!(dono.caixa<dono.patroc*0.15)?0.88:1;
  return Math.min(multaDe(p),Math.round(base*desc/500)*500);
}

/* ---------- comissão do empresário ----------
   Quem traz o jogador cobra: um pedaço da taxa, das luvas e do contrato.
   Estrela tem empresário mais caro. Sai do caixa de quem contrata e não vai
   para clube nenhum. */
function comissaoEmpresario(p,taxa,sal,anos,luvas){
  const k=over(p)>=85?1.5:over(p)>=78?1.2:1;
  const v=((taxa||0)*0.04+(sal||0)*12*(anos||1)*0.04+(luvas||0)*0.05)*k;
  return Math.round(v/500)*500;
}

/* ---------- recusas que dinheiro não compra ---------- */
function recusasDuras(p,destino,anos){
  const fora=[];
  const origem=p.timeId?G.times[p.timeId]:null;
  if(destino.elenco.length>=9)fora.push('Elenco cheio (máximo 9). Libere alguém antes.');
  if(anos<1||anos>4)fora.push('Duração de contrato inaceitável.');
  if(origem&&origem.id===destino.id)fora.push('O jogador já é do clube.');
  if(p.base)fora.push(p.nome+' é da categoria de base de '+((G.times[p.base]||{}).nome||'outro clube')+' e não está à venda.');
  /* Um titular de elite não desce de divisão por dinheiro nenhum enquanto
     ainda está no auge. É a única barreira de ambição pura do modelo. */
  if(origem&&origem.tier===1&&destino.tier===2&&over(p)>=88&&p.idade<=27)
    fora.push(p.nome+' está no auge no Tier 1 e não considera cair de divisão.');
  /* Nem vai para um clube muito pior só para ser reserva. */
  if(origem&&nivelDoClube(destino)<nivelDoClube(origem)-14&&posicaoNoElenco(p,destino)>5)
    fora.push('Clube mais fraco E sem vaga de titular: o jogador não vê sentido.');
  /* O interesse é a última porta: só conta se nada acima já fechou. */
  if(!fora.length&&!(origem&&origem.id===destino.id)){
    const it=interessePor(p,destino);
    if(it.nota<INTERESSE_MIN){
      const pior=it.itens.slice().sort((a,b)=>a.pontos-b.pontos)[0];
      fora.push(p.nome+' não tem interesse no '+destino.nome+(pior?' — pesa: '+pior.rot.toLowerCase():'')+'.');
    }
  }
  return fora;
}

/* ---------- avaliação de uma proposta ---------- */
/* Devolve lista de motivos. Vazia significa aceito. */
function avaliarProposta(p,destino,taxa,sal,anos){
  const motivos=recusasDuras(p,destino,anos);
  if(p.timeId&&p.timeId!==destino.id){
    const multa=multaDe(p);
    if(taxa<multa){
      const ps=posturaDoClube(p);
      const pedido=precoPedido(p);
      if(ps.id==='intransferivel')motivos.push('O clube não vende: só pela multa de '+money(multa)+'.');
      else if(taxa<pedido*0.92)motivos.push('O clube pede cerca de '+money(pedido)+' pelo passe.');
      else if(taxa<pedido&&rnd()<.5)motivos.push('O clube recusou por pouco. Suba a proposta.');
    }
  }
  const d=detalharPedido(p,destino);
  if(sal<d.pedido*0.95){
    const principal=d.itens.slice().sort((a,b)=>b.fator-a.fator)[0];
    motivos.push('O jogador quer perto de '+money(d.pedido)+'/mês'+
                 (principal&&principal.fator>1.05?' — pesa: '+principal.rot.toLowerCase():'')+'.');
  }
  if(destino.caixa<taxa)motivos.push('Caixa insuficiente.');
  return motivos;
}
function executarProposta(p,destino,taxa,sal,anos){
  const origem=p.timeId?G.times[p.timeId]:null;
  destino.caixa-=taxa;if(origem)origem.caixa+=taxa;
  const de=origem?origem.tag:'sem clube';
  contratar(p,destino,anos,sal);
  if(typeof registrarTransferencia==='function')registrarTransferencia(p,origem,destino,taxa,origem?'compra':'livre');
  noticia('✍ '+p.nome+' ('+de+') assinou com '+destino.nome+
          (taxa?' por '+money(taxa):' — livre')+'.',{c:'mercado',p:[p.id],t:[destino.id,origem&&origem.id],imp:over(p)>=88?2:1});
  return true;
}

/* ============================================================
   MERCADO DA IA
   ------------------------------------------------------------
   Só na virada de temporada, que é quando elenco troca de verdade
   no cenário real. Durante o ano a janela segue existindo para
   agente livre e para você.
   ============================================================ */

/* Teto de folha: quanto da receita anual o clube aceita comprometer com
   salários. É este número que impede a IA de desfazer o equilíbrio econômico
   — sem ele, todo clube gasta até quebrar e a espiral volta pela porta dos
   fundos. 0.62 é o que os clubes praticam hoje em tools/fin.mjs. */
/* Fração da receita JÁ LIVRE DE CUSTEIO que pode virar folha. Antes o teto
   era 0.66 da receita bruta, o que ignorava o custo de manter o clube: um
   clube com estrutura no máximo pagava 38% da receita só em custeio e ainda
   podia comprometer 66% em salário — não fechava, e ele terminava no vermelho
   sem ter feito nada de errado. */
const TETO_FOLHA=0.88;
/* Quanto do caixa o clube arrisca numa única taxa de transferência. */
const TETO_TAXA=0.30;

function folhaAnual(t){
  const jog=(t.elenco||[]).reduce((s,i)=>s+(G.jogadores[i]?G.jogadores[i].salario:0),0);
  const empr=(typeof custoEmprestimosDe==='function')?custoEmprestimosDe(t):0;
  return (jog+folhaStaff(t)+empr)*12;
}
/* Teto máximo que a reserva consegue comprar. Acima disso o clube estaria
   apostando o futuro numa temporada, que é justamente o que leva à falência. */
const TETO_FOLHA_MAX=0.98;
const TETO_POR_ANO_DE_RESERVA=0.04;
/* Caixa parado além de uma temporada de receita amplia o teto de folha.

   Sem isto o teto olhava só para a receita, então um clube com 16 milhões no
   banco não podia gastar um centavo a mais que o lanterna da liga com a mesma
   receita — e o dinheiro de quem vencia só empoçava. Aqui ele volta como
   elenco melhor, que é o que um clube rico faz de verdade. É autolimitado:
   gastar derruba a reserva, e o teto desce junto. */
/* Teto de quem está devendo. Precisa sobrar dinheiro todo ano, senão o clube
   que entrou no vermelho — quase sempre um rebaixado que ficou com folha de
   Tier 1 e receita de Challengers — fica ali para sempre: a folha empata com
   a receita, ele não quebra mas também nunca sai do buraco. Com o aperto, ele
   corta, junta e volta. É o caminho de volta que faltava. */
const TETO_FOLHA_AUSTERIDADE=0.68;
function tetoFolhaDe(t){
  const rec=receitaAnual(t);
  if(!(rec>0))return TETO_FOLHA;
  if((t.caixa||0)<0)return TETO_FOLHA_AUSTERIDADE;
  const anosDeReserva=Math.max(0,(t.caixa||0)-rec)/rec;
  return Math.min(TETO_FOLHA_MAX,TETO_FOLHA+anosDeReserva*TETO_POR_ANO_DE_RESERVA);
}
function folgaSalarial(t){
  return Math.max(0,receitaLivre(t)*tetoFolhaDe(t)-folhaAnual(t))/12;
}

/* O que falta no elenco: devolve a função mais fraca e o over do titular que
   seria substituído. É o que dá intenção à IA — ela procura o buraco dela, em
   vez de comprar o melhor jogador disponível. */
function carenciaDe(t){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(tit.length<5)return{role:ROLES.find(r=>!tit.some(x=>cobre(x,r)))||pick(ROLES),alvo:0,pior:null};
  const pior=tit.slice().sort((a,b)=>over(a)-over(b))[0];
  return{role:pior.roleAtual||pior.role,alvo:over(pior),pior};
}

/* Uma rodada de negociação de um clube. Devolve o negócio fechado, ou null. */
function tentarReforco(t,candidatos){
  const car=carenciaDe(t);
  const folga=folgaSalarial(t);
  const tetoTaxa=Math.max(0,t.caixa*TETO_TAXA);
  if(folga<=0)return null;

  const avaliados=[];
  for(const p of candidatos){
    if(p.timeId===t.id)continue;
    if(t.elenco.length>=9)break;
    /* só interessa quem melhora a escalação de verdade */
    const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
    if(ganho<2)continue;
    const d=detalharPedido(p,t);
    if(d.pedido>folga)continue;
    const taxa=p.timeId?precoPedido(p):0;
    if(taxa>tetoTaxa)continue;
    /* intransferível só sai pela multa, e a IA só paga multa por salto grande */
    if(p.timeId&&taxa>=multaDe(p)&&ganho<5)continue;
    if(recusasDuras(p,t,3).length)continue;
    /* nota do negócio: ganho esportivo por real gasto */
    avaliados.push({p,d,taxa,nota:ganho/(1+(taxa+d.pedido*12)/500000)});
  }
  if(!avaliados.length)return null;
  avaliados.sort((a,b)=>b.nota-a.nota);
  const esc=avaliados[0];

  /* o clube dono precisa querer vender: só solta titular por proposta acima do
     pedido, ou se estiver apertado de caixa */
  const origem=esc.p.timeId?G.times[esc.p.timeId]:null;
  /* multa paga não tem recusa do clube: é para isso que ela existe */
  const viaMulta=origem&&esc.taxa>=multaDe(esc.p);
  if(origem&&!viaMulta){
    const titular=(origem.titulares||[]).includes(esc.p.id);
    const apertado=origem.caixa<origem.patroc*0.2||(typeof emCrise==='function'&&emCrise(origem));
    if(titular&&!apertado&&origem.elenco.length<=5)return null;
    if(titular&&!apertado&&rnd()<0.45)return null;
  }
  executarProposta(esc.p,t,esc.taxa,esc.d.pedido,ri(2,3));
  /* jovem vendido entre clubes da IA às vezes leva revenda junto */
  if(origem&&esc.taxa>0&&esc.p.idade<=21&&typeof fixarRevenda==='function'&&rnd()<0.25)fixarRevenda(esc.p,origem.id,10);
  return esc;
}

/* Mercado inteiro da virada. Os clubes agem em ordem de atratividade, e cada
   um faz no máximo duas contratações — sem esse limite um clube rico esvazia
   o mercado inteiro numa temporada. */
function mercadoTransferencias(){
  const clubes=Object.values(G.times)
    .filter(t=>t.id!==G.meuTime)
    .sort((a,b)=>atratividade(b)-atratividade(a));
  let fechados=0;
  for(const t of clubes){
    for(let n=0;n<2;n++){
      /* candidatos: quem está em outro clube da IA, mais os agentes livres.
         Seu elenco fica de fora: a IA não tira jogador seu pelas suas costas. */
      const cand=Object.values(G.jogadores).filter(p=>{
        if(p.timeId===G.meuTime)return false;
        if(p.base)return false;                   /* garoto de base não é mercado */
        if(p.lesao)return false;
        if(p.timeId&&p.contrato>2)return false;   /* contrato longo não sai */
        return true;
      });
      const feito=tentarReforco(t,cand);
      if(!feito)break;
      fechados++;
    }
  }
  for(const id in G.times)autoEscalar(G.times[id]);
  return fechados;
}

/* ============================================================
   MESA DE NEGOCIAÇÃO
   ------------------------------------------------------------
   Até aqui comprar era um formulário: três números, e a resposta
   era sim ou não. Aqui vira negociação de verdade, em duas
   conversas, na ordem em que acontece no cenário real:

     1. COM O CLUBE DONO  a taxa. O clube tem uma postura
        (intransferível, negociável, à venda), abre pedindo um
        pouco acima do preço e responde com contraproposta.
        Pagar a multa rescisória pula esta conversa.
     2. COM O JOGADOR     salário, anos, luvas e promessa de
        titularidade. Ele responde com o que quer.

   Os dois lados têm PACIÊNCIA. Proposta recusada gasta um
   ponto, proposta ofensiva gasta dois. Acabou a paciência, a
   conversa fecha por algumas semanas.

   O que ele aceita é o mesmo pedido que a IA paga
   (detalharPedido em transferencia.js): o jogo não tem uma régua
   para você e outra para os clubes da IA. O que muda é que você
   negocia em rodadas e vê a resposta.

   Nada aqui sorteia. O mínimo escondido de cada lado sai do
   próprio jogador, do clube e do ano, para o mesmo clique dar
   sempre a mesma resposta e não mexer no gerador do motor.
   ============================================================ */

const NEG_ESPERA=6;               /* semanas de conversa fechada depois de esgotar a paciência */
const NEG_ABERTURA_CLUBE=1.06;    /* o clube abre pedindo acima do preço */
const NEG_OFENSA=0.60;            /* abaixo disto do pedido, a proposta ofende */
const LUVAS_PESO=1.2;             /* quanto um real de luvas vale contra um real de salário */

function _semanaNeg(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function _arred(v,passo){return Math.round(v/passo)*passo;}
/* money() arredonda para o milhar; na mesa a diferença de 7,6k para 8k é a
   diferença entre fechar e não fechar, então o valor aparece inteiro. */
function dinheiro(v){
  const n=Math.round(v||0),a=Math.abs(n);
  if(a>=1e6)return '$'+(n/1e6).toFixed(2).replace('.',',')+'M';
  if(a>=1e5)return '$'+Math.round(n/1e3)+'k';
  if(a>=1e3)return '$'+(n/1e3).toFixed(1).replace('.',',').replace(',0','')+'k';
  return '$'+n;
}

/* Fração do pedido abaixo da qual cada lado não desce. Varia de jogador para
   jogador e de ano para ano, mas não de clique para clique. */
function _ocultoClube(p,dest){return 0.92+(_hashTxt(p.id+'|c|'+dest.id+'|'+G.ano)%8)/100;}
function _ocultoJogador(p,dest){return 0.95+(_hashTxt(p.id+'|j|'+dest.id+'|'+G.ano)%6)/100;}

/* Anos que ele quer. Mesma regra da renovação. */
function anosPreferidos(p){
  if(p.idade<=22&&p.pot-over(p)>=5)return{faixa:[1,2],txt:'Está crescendo: quer contrato curto para renegociar valorizado.'};
  if(p.idade>=29)return{faixa:[2,4],txt:'Veterano: prefere contrato longo.'};
  return{faixa:[2,3],txt:'Aceita de dois a três anos.'};
}
function premioAnos(p,anos){
  const f=anosPreferidos(p).faixa;
  const fora=anos<f[0]?f[0]-anos:anos>f[1]?anos-f[1]:0;
  return 1+fora*((typeof RENOV_PREMIO_ANO!=='undefined')?RENOV_PREMIO_ANO:0.07);
}
/* Salário que ele pede para essa duração e essas condições. */
function pedidoContrato(p,dest,anos,promessa){
  const d=detalharPedido(p,dest,{promessa});
  return{d,pedido:Math.max(300,_arred(d.pedido*premioAnos(p,anos),100))};
}
/* Luvas viram salário equivalente: o que ele recebe na assinatura, diluído
   pelo contrato. O mercenário valoriza mais o dinheiro na mão. */
function salarioEquivalente(p,sal,anos,luvas){
  const k=(PERFIS[perfilDe(p)].luvas||LUVAS_PESO);
  return (sal||0)+((luvas||0)*k)/(Math.max(1,anos)*12);
}

/* ---------- estado ---------- */
function negociacoes(){return G.negociacoes||(G.negociacoes=[]);}
function negociacao(id){return negociacoes().find(n=>n.id===id)||null;}
function negociacaoAtivaDe(jogadorId){
  return negociacoes().find(n=>n.jogadorId===jogadorId&&n.destinoId===G.meuTime
    &&(n.fase==='clube'||n.fase==='jogador'))||null;
}
function conversaFechada(p){return !!(p.negBloq&&_semanaNeg()<p.negBloq);}
function semanasAteNegociar(p){return conversaFechada(p)?p.negBloq-_semanaNeg():0;}

function _fala(n,de,txt,extra){
  n.hist.push({de,txt,sem:G.semana,ano:G.ano,...(extra||{})});
}

/* Abre (ou devolve a que já existe) a negociação do seu clube por um jogador. */
function abrirNegociacao(p,dest){
  dest=dest||G.times[G.meuTime];
  if(!p||!dest)return{ok:false,erro:'Negociação inválida.'};
  const ja=negociacaoAtivaDe(p.id);
  if(ja)return{ok:true,neg:ja};
  if(p.timeId===dest.id)return{ok:false,erro:p.nome+' já é do seu clube.'};
  if(conversaFechada(p))
    return{ok:false,erro:'A conversa por '+p.nome+' está fechada. Tente de novo em '+semanasAteNegociar(p)+' semana(s).'};
  const origem=p.timeId?G.times[p.timeId]:null;
  if(!G.janela&&!podePreContrato(p,dest))
    return{ok:false,erro:'A janela está fechada.'};
  const ps=posturaDoClube(p);
  const it=interessePor(p,dest);
  const preco=precoPedido(p);
  const n={tipo:'compra',id:'ng'+G.ano+'_'+(_hashTxt(p.id+'|'+_semanaNeg()+'|'+negociacoes().length)%1e6).toString(36),
    jogadorId:p.id,origemId:origem?origem.id:null,destinoId:dest.id,
    fase:origem?'clube':'jogador',
    postura:ps.id,
    pacClube:origem?(ps.id==='avenda'?5:ps.id==='negociavel'?4:2):0,
    pacJog:3+(it.nota>=48?1:0)+(it.nota>=70?1:0),
    pacClubeMax:0,pacJogMax:0,
    pedidaClube:origem?(ps.id==='intransferivel'?preco:_arred(preco*NEG_ABERTURA_CLUBE,5000)):0,
    taxa:0,viaMulta:false,contraJog:null,
    hist:[],ano:G.ano,semana:G.semana};
  n.pacClubeMax=n.pacClube;n.pacJogMax=n.pacJog;
  if(origem){
    _fala(n,'clube',ps.id==='intransferivel'
      ?'Ele não está à venda. Só sai pela multa rescisória de '+dinheiro(multaDe(p))+'.'
      :'Para conversar sobre '+p.nome+', pensamos em '+dinheiro(n.pedidaClube)+'.');
  }else{
    _fala(n,'jogador','Estou sem clube e aberto a propostas. Vamos conversar.');
  }
  negociacoes().push(n);
  /* com a janela fechada, o único caminho é o pré-contrato */
  if(!G.janela&&origem)irParaPreContrato(n);
  return{ok:true,neg:n};
}

/* ---------- pré-contrato ----------
   No último ano de contrato, da segunda metade da temporada em diante, o
   jogador pode acertar com outro clube sem taxa nenhuma. Ele cumpre o
   contrato até o fim e só se apresenta na virada. É a porta que faz renovar
   cedo valer a pena. */
const SEMANA_PRECONTRATO=27;
function janelaPreContrato(){return (G.semana||1)>=SEMANA_PRECONTRATO;}
function podePreContrato(p,dest){
  return !!(p&&p.timeId&&dest&&p.timeId!==dest.id&&p.contrato<=1&&janelaPreContrato()
    &&!p.preContrato&&!p.emprestimo&&!p.base);
}
function irParaPreContrato(n){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  if(!podePreContrato(p,dest))return{ok:false,erro:p.nome+' não está no último ano de contrato, ou ainda não é a segunda metade da temporada.'};
  n.tipo='precontrato';n.fase='jogador';n.taxa=0;
  _fala(n,'voce','Queremos acertar um pré-contrato: você chega de graça quando o contrato com o '+G.times[p.timeId].nome+' acabar.');
  _abrirJogador(n);
  return{ok:true};
}

/* ---------- renovação na mesa ---------- */
function abrirRenovacao(p,t){
  t=t||G.times[G.meuTime];
  if(!p||!t||p.timeId!==t.id)return{ok:false,erro:'Só dá para renovar com jogador do seu elenco.'};
  const ja=negociacaoAtivaDe(p.id);
  if(ja&&ja.tipo==='renovacao')return{ok:true,neg:ja};
  const duras=recusasRenovacao(p,t,anosPreferidos(p).faixa[0]);
  if(duras.length)return{ok:false,erro:duras.join(' ')};
  const it=interesseEmFicar(p,t);
  const n={tipo:'renovacao',id:'rn'+G.ano+'_'+(_hashTxt(p.id+'|r|'+_semanaNeg()+'|'+negociacoes().length)%1e6).toString(36),
    jogadorId:p.id,origemId:t.id,destinoId:t.id,fase:'jogador',postura:'',
    pacClube:0,pacClubeMax:0,
    pacJog:RENOV_TENTATIVAS+(it.nota>=48?1:0)+(it.nota>=70?1:0),pacJogMax:0,
    pedidaClube:0,taxa:0,viaMulta:false,contraJog:null,hist:[],ano:G.ano,semana:G.semana};
  n.pacJogMax=n.pacJog;
  negociacoes().push(n);
  _abrirJogador(n);
  return{ok:true,neg:n};
}

/* Fecha a conversa, gastando ou não o tempo de espera. */
function _encerrar(n,quem){
  const p=G.jogadores[n.jogadorId];
  n.fase='encerrada';
  if(p&&n.tipo==='renovacao'){
    /* renovação usa a trava própria (renovacao.js), que a ficha e Finanças leem */
    p.renovTent=0;p.renovBloq=_semanaNeg()+RENOV_ESPERA;p.moral=clamp(p.moral-0.05,0.05,1);
    _fala(n,'sistema',p.nome+' cansou e encerrou a conversa. Dá para tentar de novo em '+RENOV_ESPERA+' semanas.');
    return;
  }
  if(p){p.negBloq=_semanaNeg()+NEG_ESPERA;}
  _fala(n,'sistema',(quem==='clube'?'O clube':'O jogador')+' encerrou as conversas. Dá para tentar de novo em '+NEG_ESPERA+' semanas.');
}

/* ---------- 1. conversa com o clube ---------- */
/* Devolve {ok, resposta:'aceita'|'contra'|'recusa'|'encerrada', valor, erro} */
function proporAoClube(n,taxa,revenda){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  taxa=Math.max(0,_arred(taxa||0,500));
  if(dest.caixa<taxa)return{ok:false,erro:'Caixa insuficiente: você tem '+dinheiro(dest.caixa)+'.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(dest,taxa);
  if(fv)return{ok:false,erro:fv};
  const ps=posturaDoClube(p);
  const multa=multaDe(p);
  const preco=precoPedido(p);
  revenda=(typeof REVENDA_OPCOES!=='undefined'&&REVENDA_OPCOES.includes(+revenda))?+revenda:0;
  _fala(n,'voce','Oferecemos '+dinheiro(taxa)+' por '+p.nome+(revenda?', mais '+revenda+'% de uma venda futura':'')+'.',{valor:taxa});
  if(taxa>=multa)return pagarMulta(n,true);
  const minimo=ps.id==='intransferivel'?multa:_arred(preco*_ocultoClube(p,dest),500);
  /* a revenda vale dinheiro para quem vende: a oferta conta como maior */
  const equiv=revenda&&ps.id!=='intransferivel'?taxa*(1+revenda/100*pesoRevenda(p)):taxa;
  if(equiv>=minimo){
    n.taxa=taxa;n.revenda=revenda;n.fase='jogador';
    _fala(n,'clube','Fechado: '+dinheiro(taxa)+(revenda?' e '+revenda+'% de revenda':'')+'. Podem falar com o jogador.');
    _abrirJogador(n);
    return{ok:true,resposta:'aceita',valor:taxa};
  }
  const ofensa=equiv<preco*NEG_OFENSA;
  n.pacClube-=ofensa?2:1;
  if(n.pacClube<=0){
    _fala(n,'clube',ofensa?'Isso é uma piada. Não temos mais o que conversar.':'Não chegamos a um acordo.');
    _encerrar(n,'clube');
    return{ok:true,resposta:'encerrada'};
  }
  if(ps.id==='intransferivel'){
    _fala(n,'clube','Já dissemos: ele não está à venda. A multa é '+dinheiro(multa)+'.');
    return{ok:true,resposta:'recusa',valor:multa};
  }
  /* a contraproposta anda na sua direção, mas nunca abaixo do mínimo dele */
  n.pedidaClube=Math.max(minimo,_arred(n.pedidaClube-(n.pedidaClube-equiv)*0.35,5000));
  _fala(n,'clube',(ofensa?'Proposta muito abaixo do que ele vale. ':'')+'Aceitamos '+dinheiro(n.pedidaClube)+'.',{valor:n.pedidaClube});
  return{ok:true,resposta:'contra',valor:n.pedidaClube};
}
function aceitarContraClube(n){return proporAoClube(n,n.pedidaClube);}
/* Multa paga: o clube não tem como recusar. */
function pagarMulta(n,jaFalou){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  const multa=multaDe(p);
  if(dest.caixa<multa)return{ok:false,erro:'A multa é '+dinheiro(multa)+' e você tem '+dinheiro(dest.caixa)+' em caixa.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(dest,multa);
  if(fv)return{ok:false,erro:fv};
  if(!jaFalou)_fala(n,'voce','Vamos pagar a multa rescisória de '+dinheiro(multa)+'.',{valor:multa});
  n.taxa=multa;n.viaMulta=true;n.fase='jogador';
  _fala(n,'clube','Multa é multa. Não podemos impedir. Agora é com ele.');
  _abrirJogador(n);
  return{ok:true,resposta:'aceita',valor:multa,multa:true};
}
/* ---------- multa no contrato novo ----------
   Multa baixa facilita a saída e o jogador gosta; multa alta prende e ele
   cobra por isso. */
const NIVEIS_MULTA={
  baixa: {nome:'Baixa', k:0.7, f:0.96, txt:'Facilita a saída: ele pede um pouco menos.'},
  padrao:{nome:'Padrão',k:1,   f:1,    txt:'Pelo valor de mercado e os anos de contrato.'},
  alta:  {nome:'Alta',  k:1.5, f:1.06, txt:'Prende o jogador: ele cobra mais por isso.'}};
function _nivelMulta(m){return NIVEIS_MULTA[m]?m:'padrao';}

/* Pedido do jogador para esta conversa: compra e pré-contrato usam o pedido
   de mudança de clube; renovação usa o de ficar. */
function pedidoDaNeg(n,anos,promessa,multa){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const fm=NIVEIS_MULTA[_nivelMulta(multa)].f;
  if(n.tipo==='renovacao'){
    const d=pedidoRenovacao(p,dest,{promessa});
    return{d,pedido:Math.max(300,_arred(d.pedido*premioAnos(p,anos)*fm,100))};
  }
  const r=pedidoContrato(p,dest,anos,promessa);
  return{d:r.d,pedido:Math.max(300,_arred(r.pedido*fm,100))};
}
function interesseDaNeg(n,promessa){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  return n.tipo==='renovacao'?interesseEmFicar(p,dest,{promessa}):interessePor(p,dest,{promessa});
}

function _abrirJogador(n){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const it=interesseDaNeg(n,false);
  const pref=anosPreferidos(p);
  const {pedido}=pedidoDaNeg(n,pref.faixa[0],false,'padrao');
  n.contraJog={sal:pedido,anos:pref.faixa[0],luvas:0,multa:'padrao'};
  let txt;
  if(n.tipo==='renovacao')
    txt=it.nota>=70?'Quero ficar. Por '+dinheiro(pedido)+'/mês a gente fecha rápido.'
      :it.nota>=48?'Topo conversar. Penso em '+dinheiro(pedido)+'/mês por '+pref.faixa[0]+' ano(s).'
      :it.nota>=INTERESSE_MIN?'Não sei se fico. Para ficar, quero '+dinheiro(pedido)+'/mês.'
      :'Estou pensando em sair. Só fico por '+dinheiro(pedido)+'/mês.';
  else
    txt=it.nota>=70?'Seria um sonho jogar no '+dest.nome+'. Penso em '+dinheiro(pedido)+'/mês.'
      :it.nota>=48?'Gosto do projeto. Penso em '+dinheiro(pedido)+'/mês por '+pref.faixa[0]+' ano(s).'
      :'Posso ouvir. Mas para mudar quero '+dinheiro(pedido)+'/mês.';
  _fala(n,'jogador',txt,{valor:pedido});
}

/* ---------- 2. conversa com o jogador ---------- */
/* oferta = {sal, anos, luvas, promessa, multa} */
function avaliarOfertaJogador(n,oferta){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const anos=clamp(parseInt(oferta.anos)||2,1,4);
  const {d,pedido}=pedidoDaNeg(n,anos,!!oferta.promessa,oferta.multa);
  const eq=salarioEquivalente(p,oferta.sal,anos,oferta.luvas);
  const minimo=pedido*_ocultoJogador(p,dest);
  /* na renovação o empresário leva metade: não há transferência a intermediar */
  const comissao=Math.round(comissaoEmpresario(p,n.taxa,oferta.sal,anos,oferta.luvas)*(n.tipo==='renovacao'?0.5:1)/500)*500;
  const custo=(n.taxa||0)+(oferta.luvas||0)+comissao;
  const duras=n.tipo==='renovacao'?recusasRenovacao(p,dest,anos):recusasDuras(p,dest,anos);
  return{d,pedido,eq,minimo,anos,comissao,custo,razao:eq/Math.max(1,pedido),duras};
}
function _limparOferta(o){
  return{sal:Math.max(0,_arred(o.sal||0,100)),anos:clamp(parseInt(o.anos)||2,1,4),
         luvas:Math.max(0,_arred(o.luvas||0,500)),promessa:!!o.promessa,multa:_nivelMulta(o.multa)};
}
function proporAoJogador(n,oferta){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  if(!p||!dest||n.fase!=='jogador')return{ok:false,erro:'Essa etapa não está aberta.'};
  if(n.tipo==='compra'&&!G.janela)return{ok:false,erro:'A janela está fechada.'};
  oferta=_limparOferta(oferta);
  const a=avaliarOfertaJogador(n,oferta);
  if(a.duras.length)return{ok:false,erro:a.duras.join(' ')};
  if(dest.caixa<a.custo)return{ok:false,erro:'Caixa insuficiente: '+(n.taxa?'taxa, ':'')+'luvas e comissão somam '+dinheiro(a.custo)+'.'};
  if(n.tipo==='compra'&&typeof foraDaVerba==='function'){const fv=foraDaVerba(dest,a.custo);if(fv)return{ok:false,erro:fv};}
  _fala(n,'voce',dinheiro(oferta.sal)+'/mês por '+oferta.anos+' ano(s)'+
    (oferta.luvas?', '+dinheiro(oferta.luvas)+' de luvas':'')+(oferta.promessa?', titularidade garantida':'')+
    (oferta.multa!=='padrao'?', multa '+NIVEIS_MULTA[oferta.multa].nome.toLowerCase():'')+'.',{valor:oferta.sal});
  if(a.eq>=a.minimo){
    concluirNegociacao(n,oferta,a);
    return{ok:true,resposta:'aceita'};
  }
  const ofensa=a.eq<a.pedido*0.70;
  n.pacJog-=ofensa?2:1;
  if(n.pacJog<=0){
    _fala(n,'jogador',ofensa?'Vocês não me levam a sério. Não tenho interesse.':'Não vamos chegar a um acordo.');
    _encerrar(n,'jogador');
    return{ok:true,resposta:'encerrada'};
  }
  /* o que ele quer: a duração dele e o salário que fecha, já descontadas as
     luvas que você ofereceu */
  const pref=anosPreferidos(p).faixa;
  const anos=clamp(oferta.anos,pref[0],pref[1]);
  const quer=pedidoDaNeg(n,anos,oferta.promessa,oferta.multa).pedido;
  const k=(PERFIS[perfilDe(p)].luvas||LUVAS_PESO);
  const sal=Math.max(300,_arred(quer-(oferta.luvas*k)/(anos*12)+50,100));
  n.contraJog={sal,anos,luvas:oferta.luvas,promessa:oferta.promessa,multa:oferta.multa};
  const principal=a.d.itens.filter(i=>i.fator>1.04).sort((x,y)=>y.fator-x.fator)[0];
  _fala(n,'jogador',(ofensa?'Isso está muito longe. ':'')+'Fecho por '+dinheiro(sal)+'/mês e '+anos+' ano(s)'+
    (oferta.luvas?' com as luvas':'')+'.'+(principal?' Pesa para mim: '+principal.rot.toLowerCase()+'.':''),{valor:sal});
  return{ok:true,resposta:'contra',contra:n.contraJog};
}
function aceitarContraJogador(n){
  if(!n.contraJog)return{ok:false,erro:'Ele ainda não fez contraproposta.'};
  return proporAoJogador(n,n.contraJog);
}

/* ---------- fechamento ---------- */
function _promessaEmContrato(p,clubeId){
  const prazo=(typeof PROMESSA_PRAZO!=='undefined')?PROMESSA_PRAZO:8;
  p.promessa={tipo:'titular',ate:(G.semana||1)+prazo,ano:G.ano,clube:clubeId};
}
function concluirNegociacao(n,oferta,a){
  const p=G.jogadores[n.jogadorId], dest=G.times[n.destinoId];
  const origem=p.timeId?G.times[p.timeId]:null;
  n.fase='fechada';
  n.interesse=interesseDaNeg(n,oferta.promessa);
  n.final={...oferta,taxa:n.taxa,comissao:a.comissao,deId:origem?origem.id:null};
  const empolgado=n.interesse.nota>=70;
  if(n.tipo==='renovacao'){
    dest.caixa-=(oferta.luvas||0)+a.comissao;
    const generoso=a.eq>=a.pedido*1.10;
    p.contrato=oferta.anos;p.salario=Math.round(oferta.sal);
    p.multa=Math.round(multaPadrao(p,oferta.anos)*NIVEIS_MULTA[oferta.multa].k/5000)*5000;
    p.renovTent=0;delete p.renovBloq;delete p.sondado;
    p.moral=clamp(p.moral+(generoso?0.09:0.05),0.05,1);
    if(oferta.promessa&&!(dest.titulares||[]).includes(p.id))_promessaEmContrato(p,dest.id);
    _fala(n,'jogador',empolgado?'Fechado! Aqui é a minha casa.':'Fechado. Sigo com vocês.');
    noticia('📄 '+p.nome+' renovou com '+dest.nome+' por '+oferta.anos+' ano(s), '+dinheiro(p.salario)+'/mês'+
      (oferta.luvas?' e '+dinheiro(oferta.luvas)+' de luvas':'')+'.',{c:'mercado',p:[p.id],t:[dest.id]});
    return;
  }
  if(n.tipo==='precontrato'){
    dest.caixa-=a.comissao;
    p.preContrato={clubeId:dest.id,sal:oferta.sal,anos:oferta.anos,luvas:oferta.luvas,
                   multa:oferta.multa,promessa:oferta.promessa,ano:G.ano};
    _fala(n,'jogador','Combinado. Cumpro meu contrato e no fim da temporada sou do '+dest.nome+'.');
    noticia('🤝 '+p.nome+' ('+(origem?origem.tag:'')+') assinou pré-contrato com '+dest.nome+
      ' e chega de graça na virada da temporada.',{c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id],imp:over(p)>=85?2:1});
    return;
  }
  dest.caixa-=(n.taxa||0)+(oferta.luvas||0)+a.comissao;
  if(origem)origem.caixa+=(n.taxa||0);
  /* a taxa entra na verba pelo registro da transferência; luvas e comissão aqui */
  if(typeof gastarVerba==='function')gastarVerba(dest,(oferta.luvas||0)+a.comissao);
  const de=origem?origem.tag:'sem clube';
  _fala(n,'jogador',empolgado?'Fechado! Mal posso esperar para começar.':'Fechado. Vamos trabalhar.');
  contratar(p,dest,oferta.anos,oferta.sal);
  p.multa=Math.round(multaPadrao(p,oferta.anos)*NIVEIS_MULTA[oferta.multa].k/5000)*5000;
  if(oferta.promessa)_promessaEmContrato(p,dest.id);
  /* quem chega empolgado chega motivado */
  if(empolgado)p.moral=clamp(p.moral+0.05,0.05,1);
  registrarTransferencia(p,origem,dest,n.taxa||0,n.viaMulta?'multa':origem?'compra':'livre');
  if(origem&&n.revenda&&typeof fixarRevenda==='function')fixarRevenda(p,origem.id,n.revenda);
  noticia('✍ '+p.nome+' ('+de+') assinou com '+dest.nome+
    (n.viaMulta?' — multa rescisória de '+dinheiro(n.taxa)+' paga':n.taxa?' por '+dinheiro(n.taxa):' — livre')+'.',
    {c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id],imp:over(p)>=88||n.viaMulta?2:1});
  /* contratar() limpa as negociações do jogador; a fechada fica para a tela */
  if(!negociacoes().includes(n))negociacoes().push(n);
}

/* ---------- pré-contratos da IA pelos seus jogadores ----------
   Da semana 27 em diante, quem está no último ano e não renovou vira alvo.
   Primeiro o clube sonda (notícia, para você ter tempo de renovar); duas
   semanas depois, se ninguém renovou, pode assinar. Roda toda semana. */
const PRECONTRATO_AVISO=2;
const PRECONTRATO_CHANCE=0.35;
function rondaPreContratos(){
  if(!janelaPreContrato()||!G.meuTime)return 0;
  const eu=G.times[G.meuTime];if(!eu)return 0;
  let assinados=0;
  for(const id of (eu.elenco||[]).slice()){
    const p=G.jogadores[id];
    if(!p||p.contrato>1||p.preContrato||p.emprestimo||p.base)continue;
    if(p.sondado&&!G.times[p.sondado.clubeId])delete p.sondado;
    if(!p.sondado){
      const cand=Object.values(G.times).filter(t=>t.id!==eu.id&&(t.elenco||[]).length<ELENCO_MAX)
        .map(t=>({t,n:interesseDe(t,p)}))
        .filter(x=>x.n>0&&salarioPedido(p,x.t)<=folgaSalarial(x.t)*1.15)
        .sort((a,b)=>b.n-a.n);
      if(!cand.length||rnd()>0.30)continue;
      const t=cand[0].t;
      p.sondado={clubeId:t.id,ano:G.ano,semana:G.semana};
      noticia('👀 '+t.nome+' está sondando '+p.nome+', que está no último ano de contrato. Renove antes que ele assine um pré-contrato.',
        {c:'mercado',p:[p.id],t:[t.id,eu.id],imp:2});
      continue;
    }
    const sd=p.sondado;
    const passou=(G.ano-sd.ano)*SEMANAS_ANO+(G.semana-sd.semana);
    if(passou<PRECONTRATO_AVISO||rnd()>PRECONTRATO_CHANCE)continue;
    const t=G.times[sd.clubeId];
    /* ele só vai se quiser mais o clube novo que o atual */
    const vaiQuerer=interessePor(p,t).nota>=interesseEmFicar(p,eu).nota-5;
    if(!vaiQuerer||recusasDuras(p,t,2).length){delete p.sondado;continue;}
    p.preContrato={clubeId:t.id,sal:salarioPedido(p,t),anos:anosPreferidos(p).faixa[1],luvas:0,multa:'padrao',ano:G.ano};
    delete p.sondado;assinados++;
    noticia('🤝 '+p.nome+' assinou pré-contrato com '+t.nome+'. Cumpre o contrato e sai de graça no fim da temporada.',
      {c:'mercado',p:[p.id],t:[t.id,eu.id],imp:2});
  }
  return assinados;
}
/* Virada: quem tinha pré-contrato e ficou sem contrato se apresenta no clube
   novo. Devolve true se ele foi. Chamado por fimDeTemporada. */
function cumprirPreContrato(p){
  const pc=p.preContrato;
  if(!pc)return false;
  delete p.preContrato;
  const dest=G.times[pc.clubeId];
  if(!dest||(dest.elenco||[]).length>=ELENCO_MAX)return false;
  const origem=p.timeId?G.times[p.timeId]:null;
  dest.caixa-=pc.luvas||0;
  contratar(p,dest,pc.anos||2,pc.sal||salario(p,dest));
  p.multa=Math.round(multaPadrao(p,pc.anos||2)*NIVEIS_MULTA[_nivelMulta(pc.multa)].k/5000)*5000;
  if(pc.promessa)_promessaEmContrato(p,dest.id);
  registrarTransferencia(p,origem,dest,0,'precontrato');
  noticia('🤝 '+p.nome+' se apresentou ao '+dest.nome+' pelo pré-contrato'+(origem?', deixando o '+origem.nome:'')+'.',
    {c:'mercado',p:[p.id],t:[dest.id,origem&&origem.id]});
  return true;
}

/* Registro do mercado, para a Central e as notícias de maiores negócios. */
function registrarTransferencia(p,origem,dest,taxa,tipo){
  G.transferencias=G.transferencias||[];
  if(tipo!=='troca'&&tipo!=='emprestimo'&&typeof pagarRevenda==='function')pagarRevenda(p,origem,dest,taxa);
  /* verba da diretoria: o que entra no seu clube gasta, o que sai devolve parte */
  if(taxa>0&&typeof gastarVerba==='function'){gastarVerba(dest,taxa);if(origem)creditarVenda(origem,taxa);}
  if(typeof conferirRecordeTransferencia==='function')conferirRecordeTransferencia(p,origem,dest,taxa);
  G.transferencias.push({ano:G.ano,semana:G.semana,jogadorId:p.id,nome:p.nome,over:over(p),
    de:origem?origem.id:null,para:dest.id,taxa:taxa||0,tipo:tipo||'compra'});
  /* só as últimas temporadas: o save não precisa carregar a história inteira */
  const corte=(G.ano||0)-3;
  if(G.transferencias.length>400)G.transferencias=G.transferencias.filter(x=>x.ano>=corte).slice(-400);
}

/* Fim de janela: o que estava em andamento cai. Fechadas e encerradas antigas
   saem da lista. */
function limparNegociacoes(){
  const agora=_semanaNeg();
  G.negociacoes=negociacoes().filter(n=>{
    /* renovação e pré-contrato não dependem da janela */
    const foraDaJanela=n.tipo==='renovacao'||n.tipo==='precontrato';
    if(n.fase==='clube'||n.fase==='jogador')return !!G.janela||foraDaJanela;
    return agora-((n.ano||0)*SEMANAS_ANO+(n.semana||1))<NEG_ESPERA+2&&(!!G.janela||foraDaJanela);
  });
}

/* ============================================================
   TROCAS
   ------------------------------------------------------------
   Um ou dois jogadores seus por um ou dois de outro clube, com
   dinheiro para qualquer lado: você manda o mais caro e recebe o
   mais barato mais a diferença, ou completa com dinheiro para
   levar o melhor.

   Três pessoas precisam dizer sim:
     · O CLUBE    põe numa balança o que recebe (o quanto cada
                  jogador seu VALE PARA ELE, mais o dinheiro) contra
                  o que entrega (o preço que pede pelos dele). Jogador
                  que tapa o buraco do elenco dele vale mais; jogador
                  que vai sentar no banco vale menos.
     · CADA JOGADOR que muda de clube, pelo mesmo interesse da
                  contratação. Quem vai morno mantém o contrato; quem
                  vai frio só vai ganhando o que pede; quem não atende
                  trava a troca.

   O contrato viaja com o jogador: anos que faltam e salário, a
   não ser que ele peça mais para ir.
   ============================================================ */

const TROCA_MAX_LADO=2;
const TROCA_PACIENCIA=3;
const TROCA_INTERESSE_OK=30;      /* a partir daqui vai com o contrato que tem */

function _semanaTroca(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function _ocultoTroca(t,ids){return 0.96+(_hashTxt(t.id+'|t|'+ids.join(',')+'|'+G.ano)%7)/100;}

/* Quanto um jogador que CHEGA vale para o clube que recebe. */
function valorParaClube(t,p){
  const car=carenciaDe(t);
  const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
  let f=1;
  if(ganho>0)f*=1+Math.min(0.35,ganho*0.04);       /* tapa o buraco */
  const pos=posicaoNoElenco(p,t);
  if(pos>6)f*=0.70;else if(pos>5)f*=0.85;          /* vai para o banco */
  /* salário que a receita dele não sustenta pesa contra */
  const folga=folgaSalarial(t);
  if(p.salario>folga*1.2)f*=0.85;
  return Math.round((p.valor||valor(p))*f/500)*500;
}
/* Quanto o clube pede por um jogador dele numa troca: o mesmo preço da venda. */
function precoNaTroca(p){return precoPedido(p);}

/* Como cada jogador reage a ir para o outro lado. */
function reacaoNaTroca(p,dest){
  const it=interessePor(p,dest);
  const duras=recusasDuras(p,{...dest,elenco:(dest.elenco||[]).slice(0,ELENCO_MAX-1)},Math.max(1,p.contrato||1));
  if(it.nota<INTERESSE_MIN||duras.length)
    return{ok:false,nota:it.nota,faixa:it.faixa,sal:p.salario,
           txt:duras[0]||p.nome+' não aceita ir para o '+dest.nome+'.'};
  if(it.nota>=TROCA_INTERESSE_OK)
    return{ok:true,nota:it.nota,faixa:it.faixa,sal:p.salario,txt:'Vai com o contrato que tem.'};
  const pede=Math.max(p.salario,salarioPedido(p,dest));
  return{ok:true,nota:it.nota,faixa:it.faixa,sal:pede,
         txt:pede>p.salario?'Só vai ganhando '+dinheiro(pede)+'/mês.':'Vai com o contrato que tem.'};
}

/* ---------- avaliação ----------
   troca = {envia:[ids seus], recebe:[ids deles], dinheiro} — dinheiro
   positivo você paga, negativo você recebe. */
function avaliarTroca(eu,outro,tr){
  const envia=(tr.envia||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const recebe=(tr.recebe||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const din=Math.round(tr.dinheiro||0);
  const erros=[];
  if(!envia.length||!recebe.length)erros.push('Escolha ao menos um jogador de cada lado.');
  if(envia.length>TROCA_MAX_LADO||recebe.length>TROCA_MAX_LADO)erros.push('No máximo dois jogadores de cada lado.');
  for(const p of envia){
    if(p.timeId!==eu.id)erros.push(p.nome+' não é do seu elenco.');
    if(p.emprestimo)erros.push(p.nome+' está emprestado.');
    if(p.preContrato)erros.push(p.nome+' já assinou pré-contrato com outro clube.');
  }
  for(const p of recebe){
    if(p.timeId!==outro.id)erros.push(p.nome+' não é do '+outro.nome+'.');
    if(p.emprestimo)erros.push(p.nome+' está emprestado.');
    if(p.preContrato)erros.push(p.nome+' já assinou pré-contrato com outro clube.');
  }
  const meuDepois=eu.elenco.length-envia.length+recebe.length;
  const deleDepois=outro.elenco.length-recebe.length+envia.length;
  if(meuDepois<ELENCO_MIN)erros.push('Você ficaria com '+meuDepois+' jogadores (mínimo '+ELENCO_MIN+').');
  if(meuDepois>ELENCO_MAX)erros.push('Você ficaria com '+meuDepois+' jogadores (máximo '+ELENCO_MAX+').');
  if(deleDepois<ELENCO_MIN||deleDepois>ELENCO_MAX)erros.push('O '+outro.nome+' ficaria com '+deleDepois+' jogadores.');
  if(din>0&&eu.caixa<din)erros.push('Caixa insuficiente para pagar '+dinheiro(din)+'.');
  if(din>0&&typeof foraDaVerba==='function'){const fv=foraDaVerba(eu,din);if(fv)erros.push(fv);}
  if(din<0&&outro.caixa<-din)erros.push('O '+outro.nome+' não tem '+dinheiro(-din)+' em caixa.');

  /* reações dos jogadores */
  const reacoes={};
  envia.forEach(p=>reacoes[p.id]=reacaoNaTroca(p,outro));
  recebe.forEach(p=>reacoes[p.id]=reacaoNaTroca(p,eu));

  /* balança do clube */
  const valorRecebe=envia.reduce((s,p)=>s+valorParaClube(outro,p),0);
  const valorEntrega=recebe.reduce((s,p)=>s+precoNaTroca(p),0);
  const lado=valorRecebe+din;
  const exige=Math.round(valorEntrega*_ocultoTroca(outro,[...(tr.envia||[]),...(tr.recebe||[])].sort())/500)*500;
  /* folha do outro clube: o que chega menos o que sai precisa caber */
  const salChega=envia.reduce((s,p)=>s+reacoes[p.id].sal,0);
  const salSai=recebe.reduce((s,p)=>s+p.salario,0);
  const folhaOk=salChega-salSai<=Math.max(0,folgaSalarial(outro))*1.1;
  const falta=Math.max(0,exige-lado);
  return{envia,recebe,din,erros,reacoes,valorRecebe,valorEntrega,exige,lado,falta,folhaOk,
         clubeAceita:!erros.length&&folhaOk&&lado>=exige,
         jogadoresAceitam:Object.values(reacoes).every(r=>r.ok),
         razao:lado/Math.max(1,valorEntrega)};
}

/* ---------- estado ---------- */
function trocaAtiva(clubeId){
  return negociacoes().find(n=>n.tipo==='troca'&&n.origemId===clubeId&&n.fase==='troca')||null;
}
function abrirTroca(outro,recebeIds){
  const eu=G.times[G.meuTime];
  if(!outro||!eu||outro.id===eu.id)return{ok:false,erro:'Troca inválida.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada: troca só com a janela aberta.'};
  if(outro.trocaBloq&&_semanaTroca()<outro.trocaBloq)
    return{ok:false,erro:'O '+outro.nome+' não quer falar de troca agora. Tente em '+(outro.trocaBloq-_semanaTroca())+' semana(s).'};
  let n=trocaAtiva(outro.id);
  if(!n){
    n={tipo:'troca',id:'tr'+G.ano+'_'+(_hashTxt(outro.id+'|'+_semanaTroca()+'|'+negociacoes().length)%1e6).toString(36),
       origemId:outro.id,destinoId:eu.id,jogadorId:(recebeIds||[])[0]||null,fase:'troca',
       envia:[],recebe:(recebeIds||[]).slice(0,TROCA_MAX_LADO),dinheiro:0,
       pacClube:TROCA_PACIENCIA,pacClubeMax:TROCA_PACIENCIA,contra:null,hist:[],ano:G.ano,semana:G.semana};
    _fala(n,'clube','Topamos ouvir uma proposta de troca. Quem vocês oferecem?');
    negociacoes().push(n);
  }
  return{ok:true,neg:n};
}

function proporTroca(n,tr){
  const eu=G.times[n.destinoId], outro=G.times[n.origemId];
  if(!eu||!outro||n.fase!=='troca')return{ok:false,erro:'Essa troca não está aberta.'};
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  n.envia=(tr.envia||[]).slice(0,TROCA_MAX_LADO);n.recebe=(tr.recebe||[]).slice(0,TROCA_MAX_LADO);
  n.dinheiro=Math.round((tr.dinheiro||0)/500)*500;
  const a=avaliarTroca(eu,outro,n);
  if(a.erros.length)return{ok:false,erro:a.erros.join(' ')};
  const nomes=l=>l.map(p=>p.nome).join(' e ');
  _fala(n,'voce',nomes(a.envia)+(a.din>0?' mais '+dinheiro(a.din):'')+' por '+nomes(a.recebe)+
    (a.din<0?' mais '+dinheiro(-a.din)+' para nós':'')+'.',{valor:a.din});
  const recusa=Object.values(a.reacoes).find(r=>!r.ok);
  if(recusa){
    _fala(n,'jogador',recusa.txt);
    return{ok:true,resposta:'jogador',txt:recusa.txt};
  }
  if(a.clubeAceita){
    executarTroca(n,a);
    return{ok:true,resposta:'aceita'};
  }
  n.pacClube-=1;
  if(n.pacClube<=0){
    n.fase='encerrada';outro.trocaBloq=_semanaTroca()+NEG_ESPERA;
    _fala(n,'clube','Não chegamos a lugar nenhum. Vamos parar por aqui.');
    _fala(n,'sistema','O '+outro.nome+' encerrou a conversa de troca por '+NEG_ESPERA+' semanas.');
    return{ok:true,resposta:'encerrada'};
  }
  if(!a.folhaOk){
    _fala(n,'clube','Não cabe na nossa folha: os salários que chegam são altos demais para o que sai.');
    return{ok:true,resposta:'folha'};
  }
  /* contraproposta: o dinheiro que falta para fechar a balança */
  const falta=Math.round((a.exige-a.lado)/5000+0.5)*5000;
  n.contra={envia:n.envia.slice(),recebe:n.recebe.slice(),dinheiro:n.dinheiro+falta};
  const c=n.contra.dinheiro;
  _fala(n,'clube',c>0?'Fechamos se vierem mais '+dinheiro(c)+' junto.'
                     :'Fechamos se a diferença para nós cair para '+dinheiro(-c)+'.',{valor:c});
  return{ok:true,resposta:'contra',contra:n.contra};
}
function aceitarContraTroca(n){
  if(!n.contra)return{ok:false,erro:'Ainda não há contraproposta.'};
  return proporTroca(n,n.contra);
}

function executarTroca(n,a){
  const eu=G.times[n.destinoId], outro=G.times[n.origemId];
  n.fase='fechada';
  n.final={envia:n.envia.slice(),recebe:n.recebe.slice(),dinheiro:a.din};
  eu.caixa-=a.din;outro.caixa+=a.din;
  if(typeof gastarVerba==='function'){if(a.din>0)gastarVerba(eu,a.din);else creditarVenda(eu,-a.din);}
  /* trava de reposição: enquanto a troca anda, nenhum dos dois clubes pode
     sair contratando no meio — o elenco só fecha a conta no fim */
  eu._repondo=true;outro._repondo=true;
  try{
    for(const p of a.envia){const anos=Math.max(1,p.contrato||1);contratar(p,outro,anos,a.reacoes[p.id].sal);}
    for(const p of a.recebe){const anos=Math.max(1,p.contrato||1);contratar(p,eu,anos,a.reacoes[p.id].sal);}
  }finally{delete eu._repondo;delete outro._repondo;}
  [...a.envia,...a.recebe].forEach(p=>registrarTransferencia(p,G.times[p.timeId===eu.id?outro.id:eu.id],G.times[p.timeId],0,'troca'));
  const nomes=l=>l.map(p=>p.nome).join(' e ');
  _fala(n,'clube','Negócio fechado. Bem-vindos.');
  noticia('🔄 Troca: '+nomes(a.recebe)+' chega ao '+eu.nome+' e '+nomes(a.envia)+' vai para o '+outro.nome+
    (a.din>0?', com '+dinheiro(a.din)+' de compensação':a.din<0?', e o '+eu.nome+' ainda recebe '+dinheiro(-a.din):'')+'.',
    {c:'mercado',p:[...n.envia,...n.recebe],t:[eu.id,outro.id],imp:2});
  if(!negociacoes().includes(n))negociacoes().push(n);
  autoEscalar(eu);autoEscalar(outro);
}

/* ---------- a IA oferece troca ----------
   Pelos jogadores que você anunciou para venda: o clube interessado pode
   oferecer um jogador dele e completar com dinheiro. Chamado por
   gerarPropostas() quando o clube decide fazer proposta de compra. */
function montarTrocaIA(p,alvo){
  const eu=G.times[p.timeId];
  if(!eu||p.preContrato||p.emprestimo||(alvo.elenco||[]).length<=ELENCO_MIN)return null;
  const preco=p.anuncio&&p.anuncio.pedido?p.anuncio.pedido:precoPedido(p);
  /* o que o clube aceita soltar: fora os dois melhores, e quem quer ir */
  const ordem=(alvo.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const cand=ordem.slice(2).filter(q=>!q.emprestimo&&!q.preContrato&&!q.base
    &&precoNaTroca(q)<preco&&reacaoNaTroca(q,eu).ok&&reacaoNaTroca(p,alvo).ok);
  if(!cand.length)return null;
  /* o que mais se aproxima do preço, para o dinheiro ser complemento */
  const q=cand.sort((a,b)=>precoNaTroca(b)-precoNaTroca(a))[0];
  const oferta=Math.round(valorParaClube(alvo,p)*(0.85+rnd()*0.2)/500)*500;
  const din=Math.max(0,Math.round((oferta-precoNaTroca(q))/5000)*5000);
  if(din>alvo.caixa*TETO_TAXA)return null;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'troca',oferecidoId:q.id,
         taxa:din,salario:reacaoNaTroca(p,alvo).sal,anos:Math.max(1,p.contrato||1),opcaoCompra:0,
         prazo:PRAZO_PROPOSTA,pedido:preco};
}
/* Aceitar a troca oferecida pela IA. */
function executarTrocaIA(pr){
  const p=G.jogadores[pr.jogadorId], q=G.jogadores[pr.oferecidoId];
  const eu=G.times[G.meuTime], outro=G.times[pr.clubeId];
  if(!p||!q||!eu||!outro||q.timeId!==outro.id||p.timeId!==eu.id)return{ok:false,erro:'A troca não está mais de pé.'};
  const n={tipo:'troca',id:'tri'+pr.id,origemId:outro.id,destinoId:eu.id,jogadorId:q.id,fase:'troca',
           envia:[p.id],recebe:[q.id],dinheiro:-pr.taxa,pacClube:1,pacClubeMax:1,hist:[],ano:G.ano,semana:G.semana};
  const a=avaliarTroca(eu,outro,n);
  if(a.erros.length)return{ok:false,erro:a.erros.join(' ')};
  if(!a.jogadoresAceitam)return{ok:false,erro:Object.values(a.reacoes).find(r=>!r.ok).txt};
  executarTroca(n,a);
  return{ok:true,msg:p.nome+' trocado por '+q.nome+(pr.taxa?' mais '+dinheiro(pr.taxa):'')+'.'};
}

/* ============================================================
   MERCADO VIVO
   ------------------------------------------------------------
   Até aqui o mercado só se mexia quando você mexia: anunciou,
   chegou proposta; não anunciou, ninguém olhava. No mundo real o
   telefone toca sozinho. Este módulo junta o que faz o mercado
   respirar durante a janela:

   - propostas espontâneas pelos seus jogadores, sem anúncio;
   - multa paga pela IA: o clube não pode recusar, só o jogador;
   - pedido de transferência de quem está infeliz;
   - leilão quando dois ou mais clubes querem o mesmo jogador;
   - clube em crise (rebaixado ou devendo) vira liquidação;
   - percentual de revenda, que segue o jogador para a próxima venda;
   - empréstimo pedido por você, na mesa;
   - último dia da janela, com tudo mais acelerado;
   - a IA negocia entre si durante a janela, com o mesmo motor.

   Tudo usa as mesmas peças das etapas anteriores: interessePor,
   posturaDoClube, precoPedido e tentarReforco.
   ============================================================ */

/* Chance semanal, por jogador seu, de chegar proposta sem anúncio. Sobe com
   o over: estrela recebe ligação toda janela, reserva quase nunca. Calibrada
   para as duas janelas de calendário, que somam cerca de 22 semanas por ano. */
const ESPONTANEA_BASE=0.045;
const ESPONTANEA_POR_OVER=0.012;    /* por ponto de over acima de 75 */
const ESPONTANEA_MAX=0.25;
/* A IA só paga multa por um salto grande no time dela, e com folga no caixa. */
const MULTA_IA_GANHO=6;
const MULTA_IA_CAIXA=0.6;
const MULTA_IA_CHANCE=0.5;
const PRAZO_MULTA=2;
/* Aumento que você oferece para segurar quem teve a multa paga. */
const SEGURAR_AUMENTO=0.25;
/* Pedido de transferência: semanas infeliz antes de pedir, e a chance por semana. */
const PEDIDO_SEMANAS=4, PEDIDO_MORAL=0.35, PEDIDO_CHANCE=0.25;
/* Clube em crise vende com desconto, durante as próximas janelas. */
const CRISE_DESCONTO=0.80, CRISE_SEMANAS=34;
/* Revenda: o que cada ponto percentual vale para quem vende agora. Jovem
   vale mais, porque a próxima venda tende a ser maior. */
const REVENDA_OPCOES=[0,10,20];
function pesoRevenda(p){return p.idade<=22?0.9:0.5;}
/* IA durante a janela: chance por semana de cada clube tentar um reforço. */
const IA_JANELA_CHANCE=0.025, IA_PRAZO_FINAL=0.14;

/* ---------- último dia da janela ---------- */
function ultimoDiaDaJanela(){
  if(!G||!G.janela)return false;
  const n=proximaSemana(G.ano,G.semana||1);
  return !janelaAberta(n.ano,n.semana);
}

/* ---------- crise ---------- */
function emCrise(t){
  return !!(t&&t.crise&&_semanaNeg()<=t.crise.ate);
}
function declararCrise(t,motivo){
  if(!t)return;
  t.crise={motivo,ate:_semanaNeg()+CRISE_SEMANAS};
  if(t.id===G.meuTime){
    noticia('📉 '+t.nome+' entrou em crise ('+motivo+'). Os outros clubes vão chegar com propostas mais baixas, e os ambiciosos podem pedir para sair.',{c:'mercado',t:[t.id],imp:2});
    /* quem é bom demais para a situação pede para sair */
    t.elenco.map(i=>G.jogadores[i]).filter(p=>p&&!p.emprestimo&&over(p)>=78&&perfilDe(p)!=='leal')
      .forEach(p=>abrirPedidoSaida(p,'O clube está em crise ('+motivo+') e ele quer jogar mais alto.'));
  }else{
    noticia('🏷 '+t.nome+' está em crise ('+motivo+') e abre liquidação do elenco.',{c:'mercado',t:[t.id]});
  }
}
/* Virada de temporada: quem terminou no vermelho também entra. */
function conferirCrises(){
  for(const id in G.times){
    const t=G.times[id];
    if(t.caixa<0&&!emCrise(t))declararCrise(t,'dívidas');
  }
}

/* ---------- pedido de transferência ---------- */
function abrirPedidoSaida(p,motivo){
  if(!p||!p.timeId||p.pedidoSaida||p.emprestimo||p.preContrato)return false;
  p.pedidoSaida={ano:G.ano,semana:G.semana,motivo};
  if(p.timeId===G.meuTime)
    noticia('✋ '+p.nome+' pediu para ser negociado. '+motivo,{c:'mercado',p:[p.id],imp:2});
  return true;
}
function aceitarPedidoSaida(p){
  if(!p||!p.pedidoSaida)return{ok:false,erro:'Ele não pediu para sair.'};
  const r=anunciarJogador(p,'venda',false,pedidoDeVenda(p));
  if(!r.ok)return r;
  p.pedidoSaida.aceito=true;delete p.pedidoSaida.negado;
  p.moral=clamp(p.moral+0.06,0.05,1);
  return{ok:true,msg:p.nome+' foi colocado à venda, como ele pediu.'};
}
function negarPedidoSaida(p){
  if(!p||!p.pedidoSaida)return{ok:false,erro:'Ele não pediu para sair.'};
  p.pedidoSaida.negado=true;
  p.moral=clamp(p.moral-0.08,0.05,1);
  return{ok:true,msg:p.nome+' fica. Ele não gostou.'};
}
/* Semanal, o ano inteiro: quem está infeliz há semanas pede para sair; quem
   teve o pedido negado e voltou a sorrir desiste. */
function rondaPedidosSaida(){
  const t=G.times[G.meuTime];if(!t)return;
  for(const pid of t.elenco){
    const p=G.jogadores[pid];if(!p)continue;
    if(p.moral<PEDIDO_MORAL)p.semInfeliz=(p.semInfeliz||0)+1;else delete p.semInfeliz;
    if(p.pedidoSaida){
      if(p.pedidoSaida.negado){
        p.moral=clamp(p.moral-0.01,0.05,1);
        if(p.moral>0.6){delete p.pedidoSaida;noticia('🙂 '+p.nome+' desistiu de sair.',{c:'mercado',p:[p.id]});}
      }
      continue;
    }
    if((p.semInfeliz||0)>=PEDIDO_SEMANAS&&rnd()<PEDIDO_CHANCE)
      abrirPedidoSaida(p,'Está insatisfeito há semanas.');
  }
}

/* ---------- propostas espontâneas e multa paga ---------- */
function chanceEspontanea(p){
  let c=ESPONTANEA_BASE+Math.max(0,over(p)-75)*ESPONTANEA_POR_OVER;
  if(p.pedidoSaida&&!p.pedidoSaida.negado)c*=2.5;
  if(ultimoDiaDaJanela())c*=2;
  return Math.min(ESPONTANEA_MAX,c);
}
function propostasEspontaneas(){
  if(!G.janela)return 0;
  const eu=G.times[G.meuTime];if(!eu)return 0;
  G.propostas=G.propostas||[];
  let novas=0;
  for(const pid of eu.elenco){
    const p=G.jogadores[pid];
    if(!p||p.anuncio||p.emprestimo||p.preContrato||p.base)continue;
    if(propostasDe(p.id).length>=MAX_PROPOSTAS_POR_JOGADOR)continue;
    if(rnd()>chanceEspontanea(p)*fracaoMercado())continue;
    const cand=Object.values(G.times).filter(t=>t.id!==eu.id)
      .map(t=>({t,n:interesseDe(t,p)})).filter(x=>x.n>0&&!propostasDe(p.id).some(y=>y.clubeId===x.t.id))
      .sort((a,b)=>b.n-a.n);
    if(!cand.length)continue;
    /* até três clubes tentam, do mais interessado para baixo: quem mais
       precisa nem sempre tem caixa ou folha para bancar */
    let pr=null,alvo=null;
    for(let k=0;k<3&&!pr&&cand.length;k++){
      const i=Math.min(cand.length-1,Math.floor(Math.pow(rnd(),1.8)*cand.length));
      alvo=cand[i].t;pr=montarEspontanea(p,alvo,cand[i].n);cand.splice(i,1);
    }
    if(!pr)continue;
    G.propostas.push(pr);novas++;
    noticia(pr.tipo==='multa'
      ?'💥 '+alvo.nome+' pagou a multa rescisória de '+p.nome+' ('+money(pr.taxa)+'). Você não pode recusar: só ele decide.'
      :'📞 '+alvo.nome+' ligou por '+p.nome+', que nem estava à venda: '+money(pr.taxa)+(pr.revenda?' e '+pr.revenda+'% de revenda':'')+'.',
      {c:'mercado',p:[p.id],t:[alvo.id],imp:pr.tipo==='multa'?2:1});
  }
  return novas;
}
function montarEspontanea(p,alvo,ganho){
  const eu=G.times[p.timeId];
  if(alvo.elenco.length>=ELENCO_MAX)return null;
  const sal=salarioPedido(p,alvo);
  if(sal>folgaSalarial(alvo)*1.1)return null;
  const multa=multaDe(p), ps=posturaDoClube(p);
  const teto=Math.max(0,alvo.caixa*TETO_TAXA);
  /* multa: o salto precisa ser grande, o caixa precisa aguentar, e o jogador
     precisa preferir ir */
  /* metade das vezes o clube tenta antes negociar: multa é o último recurso */
  if(ganho>=MULTA_IA_GANHO&&rnd()<MULTA_IA_CHANCE&&alvo.caixa*MULTA_IA_CAIXA>=multa
     &&interessePor(p,alvo).nota>=interesseEmFicar(p,eu).nota+5){
    return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'multa',taxa:multa,
           salario:Math.round(sal),anos:ri(2,4),opcaoCompra:0,prazo:PRAZO_MULTA,espontanea:true};
  }
  if(ps.id==='intransferivel'&&rnd()<0.6)return null;
  const preco=precoPedido(p);
  let oferta=Math.round(Math.min(teto,preco*(0.80+rnd()*0.25))/5000)*5000;
  if(oferta<=0||oferta<preco*0.6)return null;
  /* jovem: às vezes a oferta vem com revenda, e um pouco menor por isso */
  let revenda=0;
  if(p.idade<=21&&rnd()<0.35){revenda=rnd()<0.5?10:15;oferta=Math.round(oferta*0.95/5000)*5000;}
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'compra',taxa:oferta,
         salario:Math.round(sal),anos:ri(2,3),opcaoCompra:0,prazo:PRAZO_PROPOSTA,
         pedido:preco,espontanea:true,revenda};
}
/* A multa paga pela IA: liberar é aceitar. Também é o que acontece se o prazo
   vence sem você reagir. */
function executarMultaIA(pr){
  const p=G.jogadores[pr.jogadorId], dest=G.times[pr.clubeId];
  if(!p||!dest||p.timeId===dest.id)return{ok:false,erro:'A proposta não está mais de pé.'};
  const origem=G.times[p.timeId];
  if(dest.caixa<pr.taxa)return{ok:false,erro:dest.nome+' não tem mais o dinheiro da multa.'};
  executarProposta(p,dest,pr.taxa,pr.salario,pr.anos);
  if(G.transferencias&&G.transferencias.length)G.transferencias[G.transferencias.length-1].tipo='multa';
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:p.nome+' saiu pela multa: '+money(pr.taxa)+' entraram no caixa do '+(origem?origem.nome:'clube')+'.'};
}
/* Tentar segurar: você oferece aumento; ele compara ficar (com o aumento)
   contra ir. Uma tentativa só: se não der, ele vai. */
function segurarJogador(prId){
  const pr=proposta(prId);
  if(!pr||pr.tipo!=='multa')return{ok:false,erro:'Proposta inexistente.'};
  const p=G.jogadores[pr.jogadorId], eu=G.times[p.timeId], dest=G.times[pr.clubeId];
  const ficar=interesseEmFicar(p,eu).nota+pontosDoFator(1/(1+SEGURAR_AUMENTO));
  const ir=interessePor(p,dest).nota;
  const novoSal=Math.round(p.salario*(1+SEGURAR_AUMENTO)/100)*100;
  const folgaOk=folgaSalarial(eu)>=novoSal-p.salario;
  if(folgaOk&&ficar>=ir){
    p.salario=novoSal;p.moral=clamp(p.moral+0.05,0.05,1);
    G.propostas=G.propostas.filter(x=>x.id!==pr.id);
    noticia('🛡 '+p.nome+' recusou o '+dest.nome+' e fica, com aumento para '+money(novoSal)+'/mês.',{c:'mercado',p:[p.id],t:[dest.id]});
    return{ok:true,ficou:true,msg:p.nome+' fica, com '+money(novoSal)+'/mês.'};
  }
  const r=executarMultaIA(pr);
  return{...r,ficou:false,msg:(folgaOk?p.nome+' agradeceu, mas quer ir. ':'A folha não comporta o aumento. ')+(r.msg||r.erro||'')};
}

/* ---------- leilão ----------
   Dois ou mais clubes querem o mesmo jogador: você chama todos para cobrir.
   Cada um tem um teto (o caixa e o quanto ele precisa do jogador); o leilão
   sobe em degraus até sobrar um. Quem perde retira a proposta. */
function _tetoLeilao(t,p,x){
  const ganho=interesseDe(t,p);
  /* cada um estica pelo menos um pouco além da própria proposta; quem precisa
     mais do jogador estica mais */
  const quer=precoPedido(p)*(1+Math.min(10,ganho)*0.03)*(0.95+(_hashTxt(t.id+p.id)%100)/1000);
  return Math.round(Math.max(x.taxa*1.08,Math.min(t.caixa*TETO_TAXA*1.4,quer))/5000)*5000;
}
function podeLeiloar(jogadorId){
  return propostasDe(jogadorId).filter(x=>x.tipo==='compra').length>=2;
}
function abrirLeilao(jogadorId){
  const p=G.jogadores[jogadorId];
  const props=propostasDe(jogadorId).filter(x=>x.tipo==='compra');
  if(!p||props.length<2)return{ok:false,erro:'Leilão precisa de pelo menos duas propostas de compra.'};
  const lances=props.map(x=>({x,t:G.times[x.clubeId],teto:_tetoLeilao(G.times[x.clubeId],p,x),valor:x.taxa,fora:false}));
  const rodadas=[];
  let atual=Math.max(...lances.map(l=>l.valor));
  let lider=lances.find(l=>l.valor===atual);
  rodadas.push({clube:lider.t.id,valor:atual,txt:lider.t.nome+' abre com '+money(atual)+'.'});
  for(let guarda=0;guarda<40;guarda++){
    const ativos=lances.filter(l=>!l.fora&&l!==lider);
    if(!ativos.length)break;
    const passo=Math.max(5000,Math.round(atual*0.025/5000)*5000);
    let cobriu=false;
    for(const l of ativos){
      if(l.teto>=atual+passo){
        atual+=passo;l.valor=atual;lider=l;cobriu=true;
        rodadas.push({clube:l.t.id,valor:atual,txt:l.t.nome+' cobre: '+money(atual)+'.'});
        break;
      }
      l.fora=true;rodadas.push({clube:l.t.id,valor:l.valor,txt:l.t.nome+' desiste.',fora:true});
    }
    if(!cobriu&&!lances.some(l=>!l.fora&&l!==lider))break;
  }
  /* quem ganhou fica com a proposta; os outros saem da mesa */
  lider.x.taxa=atual;lider.x.prazo=PRAZO_PROPOSTA;lider.x.leilao=true;
  G.propostas=G.propostas.filter(x=>x.jogadorId!==jogadorId||x===lider.x||x.tipo!=='compra');
  rodadas.push({clube:lider.t.id,valor:atual,txt:lider.t.nome+' vence o leilão com '+money(atual)+'.',vence:true});
  noticia('🔨 Leilão por '+p.nome+': '+lider.t.nome+' venceu com '+money(atual)+'.',{c:'mercado',p:[p.id],t:[lider.t.id]});
  return{ok:true,vencedor:lider.t.id,valor:atual,rodadas,propostaId:lider.x.id};
}

/* ---------- revenda ----------
   Quem vende pode guardar um pedaço da próxima venda. A conta é paga
   quando o jogador sai de novo por dinheiro, por quem o vende. */
function pagarRevenda(p,origem,dest,taxa){
  const r=p.revenda;
  if(!r||!(taxa>0)||!origem)return 0;
  const dono=G.times[r.clubeId];
  delete p.revenda;
  if(!dono||dono.id===origem.id)return 0;
  const parte=Math.round(taxa*r.pct/100/500)*500;
  if(parte<=0)return 0;
  origem.caixa-=parte;dono.caixa+=parte;
  if(dono.id===G.meuTime||origem.id===G.meuTime)
    noticia('🧾 Revenda: '+dono.nome+' recebeu '+money(parte)+' ('+r.pct+'%) pela venda de '+p.nome+' ao '+dest.nome+'.',{c:'mercado',p:[p.id],t:[dono.id]});
  return parte;
}
function fixarRevenda(p,clubeId,pct){
  if(pct>0&&clubeId)p.revenda={clubeId,pct};
}

/* ---------- empréstimo pedido por você ---------- */
/* oferta = {parte (0.5..1, fração do salário que você paga), opcao (valor ou 0)} */
function avaliarEmprestimoPedido(n,oferta){
  const p=G.jogadores[n.jogadorId], dono=G.times[n.origemId], eu=G.times[n.destinoId];
  const parte=clamp(+oferta.parte||0.75,0.5,1), opcao=Math.max(0,_arred(+oferta.opcao||0,5000));
  const ordem=dono.elenco.map(i=>G.jogadores[i]).filter(Boolean).sort((a,b)=>over(b)-over(a));
  const rank=ordem.findIndex(x=>x.id===p.id);
  const titular=dono.titulares.includes(p.id);
  const erros=[];
  if(p.emprestimo)erros.push('Ele já está emprestado.');
  if(titular&&rank<5)erros.push('Ele é titular do '+dono.nome+': não sai emprestado.');
  if(dono.elenco.length<=ELENCO_MIN)erros.push('O '+dono.nome+' está com o elenco no mínimo.');
  if(eu.elenco.length>=ELENCO_MAX)erros.push('Seu elenco está cheio.');
  /* quanto do salário eles querem que você pague: jovem que precisa jogar sai mais barato */
  const minParte=clamp((p.idade<=20?0.5:0.65)+(opcao?0.1:0),0.5,1);
  const precoOpcao=_arred(precoPedido(p)*_ocultoClube(p,eu),5000);
  const sal=_arred(p.salario*parte,100);
  const taxa=_arred(Math.max(0,(p.valor||0)*0.03),500);
  /* o jogador: quer minutos. Quem está no banco topa mais fácil */
  const it=interessePor(p,eu);
  const vontade=it.nota+(rank>=5?15:0);
  const clubeOk=!erros.length&&parte>=minParte&&(!opcao||opcao>=precoOpcao);
  const jogadorOk=vontade>=TROCA_INTERESSE_OK&&!recusasDuras(p,eu,1).length;
  if(folgaSalarial(eu)<sal)erros.push('A folha não comporta '+money(sal)+'/mês.');
  if(eu.caixa<taxa)erros.push('Caixa insuficiente para a taxa de '+money(taxa)+'.');
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(eu,taxa);if(fv)erros.push(fv);
  return{parte,opcao,minParte,precoOpcao,sal,taxa,clubeOk,jogadorOk,vontade,erros,rank};
}
function proporEmprestimo(n,oferta){
  const p=G.jogadores[n.jogadorId], dono=G.times[n.origemId], eu=G.times[n.destinoId];
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  if(!p||!dono||n.fase!=='clube')return{ok:false,erro:'Essa etapa já passou.'};
  const a=avaliarEmprestimoPedido(n,oferta);
  _fala(n,'voce','Queremos '+p.nome+' emprestado: pagamos '+Math.round(a.parte*100)+'% do salário'+
    (a.opcao?', com opção de compra de '+dinheiro(a.opcao):'')+'.');
  if(a.erros.length){_fala(n,'clube',a.erros[0]);return{ok:true,resposta:'recusa',erro:a.erros[0]};}
  if(!a.clubeOk){
    n.pacClube-=1;
    const txt=a.parte<a.minParte?'Só emprestamos se vocês pagarem pelo menos '+Math.round(a.minParte*100)+'% do salário.'
      :'Opção de compra só a partir de '+dinheiro(a.precoOpcao)+'.';
    _fala(n,'clube',txt);
    if(n.pacClube<=0){_encerrar(n,'clube');return{ok:true,resposta:'encerrada'};}
    return{ok:true,resposta:'contra',erro:txt,minParte:a.minParte,precoOpcao:a.precoOpcao};
  }
  if(!a.jogadorOk){
    _fala(n,'jogador','Agradeço, mas não quero ir emprestado para o '+eu.nome+'.');
    return{ok:true,resposta:'recusa',erro:p.nome+' não quer ir emprestado.'};
  }
  n.interesse=interessePor(p,eu);
  executarEmprestimo(p,eu,{taxa:a.taxa,salario:a.sal,opcaoCompra:a.opcao});
  registrarTransferencia(p,dono,eu,a.taxa,'emprestimo');
  n.fase='fechada';n.emprestimo=true;n.taxa=a.taxa;
  n.final={taxa:a.taxa,sal:a.sal,anos:1,luvas:0,comissao:0};
  _fala(n,'clube','Fechado. Cuidem bem dele.');
  if(!negociacoes().includes(n))negociacoes().push(n);
  return{ok:true,resposta:'aceita'};
}
/* Opção de compra de quem está emprestado para você: decisão sua, não sorteio. */
function exercerOpcao(p){
  const e=p&&p.emprestimo, eu=G.times[G.meuTime];
  if(!e||p.timeId!==eu.id||!e.opcaoCompra)return{ok:false,erro:'Não há opção de compra.'};
  if(!G.janela)return{ok:false,erro:'Só com a janela aberta.'};
  if(eu.caixa<e.opcaoCompra)return{ok:false,erro:'Caixa insuficiente: a opção é '+money(e.opcaoCompra)+'.'};
  const fv=typeof foraDaVerba==='function'&&foraDaVerba(eu,e.opcaoCompra);if(fv)return{ok:false,erro:fv};
  const dono=G.times[e.donoId];
  eu.caixa-=e.opcaoCompra;if(dono)dono.caixa+=e.opcaoCompra;
  delete p.emprestimo;p.contrato=Math.max(2,p.contrato||1);
  registrarTransferencia(p,dono,eu,e.opcaoCompra,'compra');
  noticia('💰 '+eu.nome+' exerceu a opção de compra de '+p.nome+' por '+money(e.opcaoCompra)+'.',{c:'mercado',p:[p.id],t:[eu.id]});
  return{ok:true,msg:p.nome+' agora é seu.'};
}

/* ---------- IA negociando durante a janela ---------- */
function mercadoNaJanela(){
  if(!G.janela)return 0;
  /* a virada de temporada tem o mercado grande dela; aqui é o do meio */
  if((G.semana||1)>=49)return 0;
  const chance=ultimoDiaDaJanela()?IA_PRAZO_FINAL:IA_JANELA_CHANCE;
  const ocupados=new Set(negociacoes().filter(n=>n.fase==='clube'||n.fase==='jogador'||n.fase==='troca').map(n=>n.jogadorId));
  const cand=Object.values(G.jogadores).filter(p=>p.timeId!==G.meuTime&&!p.base&&!p.lesao&&!p.emprestimo
    &&!p.preContrato&&!ocupados.has(p.id)&&(!p.timeId||p.contrato<=2||emCrise(G.times[p.timeId])||p.pedidoSaida));
  let feitos=0;
  for(const t of Object.values(G.times)){
    if(t.id===G.meuTime||rnd()>chance*fracaoMercado())continue;
    const r=tentarReforco(t,cand);
    if(r){feitos++;autoEscalar(t);}
  }
  return feitos;
}

/* ---------- a semana ---------- */
/* Fração da semana que este passo do mercado representa. Com a janela andando
   em turnos de dois dias (TURNOS_SEMANA em clock.js), cada turno e a virada
   da semana rodam o mercado com 1/3 da chance semanal: o volume de negócios
   da semana é o mesmo, só chega espalhado. Fora dos turnos vale 1, e o
   mercado faz exatamente o que fazia — inclusive a mesma sequência de sorteio. */
function fracaoMercado(){return (G&&G._fracaoMercado)||1;}
function mercadoVivo(){
  /* pedido de saída e prazo de multa são semanais: num turno não andam */
  if(G._noTurno){
    if(!G.janela)return;
    propostasEspontaneas();
    mercadoNaJanela();
    return;
  }
  rondaPedidosSaida();
  /* multa paga corre o prazo com a janela aberta ou fechada: o negócio foi
     feito dentro dela, e sem reação sua ele sai */
  for(const x of (G.propostas||[]).filter(y=>y.tipo==='multa')){
    if(--x.prazo<=0){const r=executarMultaIA(x);if(!r.ok)G.propostas=G.propostas.filter(y=>y!==x);}
  }
  if(!G.janela){
    /* janela fechou: proposta de compra, troca e empréstimo caem junto */
    const antes=(G.propostas||[]).length;
    G.propostas=(G.propostas||[]).filter(x=>x.tipo==='multa');
    if(antes>G.propostas.length&&G._janelaAberta)noticia('🔒 A janela fechou. As propostas que estavam na mesa caíram.',{c:'mercado'});
    G._janelaAberta=false;
    return;
  }
  G._janelaAberta=true;
  if(ultimoDiaDaJanela()&&G._prazoAvisado!==_semanaNeg()){
    G._prazoAvisado=_semanaNeg();
    noticia('⏰ Último dia da janela! Os clubes correm atrás de reforço e as propostas chegam mais rápido.',{c:'mercado',imp:2});
  }
  propostasEspontaneas();
  mercadoNaJanela();
}

/* ============================================================
   ORÇAMENTO DA DIRETORIA
   ------------------------------------------------------------
   No modo Treinador a diretoria libera uma verba de transferências
   por temporada. Taxa, multa, luvas, comissão, dinheiro em troca,
   taxa de empréstimo e opção de compra saem dela; metade do que
   você vende volta para ela. Uma vez por janela dá para pedir mais,
   e a resposta depende da confiança da diretoria.

   No modo Diretoria quem manda é você: a verba aparece como
   referência, mas o único limite é o caixa.
   ============================================================ */
/* Parte do caixa livre (acima da reserva) que vira verba. */
const VERBA_FRACAO=0.55;
/* Reserva que a diretoria não deixa gastar: uma fração da receita anual. */
const VERBA_RESERVA=0.20;
/* Quanto de cada venda volta para a verba. */
const VERBA_RETORNO_VENDA=0.5;
/* Pedido de reforço de verba: confiança mínima e quanto ela libera. */
const VERBA_PEDIDO_CONF=55, VERBA_PEDIDO_EXTRA=0.30, VERBA_PEDIDO_CUSTO=3;

function _verbaInicial(t){
  const rec=receitaAnual(t);
  return Math.max(0,Math.round((t.caixa-rec*VERBA_RESERVA)*VERBA_FRACAO/5000)*5000);
}
/* A verba da temporada. Nasce na primeira consulta do ano. */
function orcamentoDe(t){
  t=t||G.times[G.meuTime];
  if(!t)return null;
  if(!t.orcamento||t.orcamento.ano!==G.ano){
    const v=_verbaInicial(t);
    t.orcamento={ano:G.ano,inicial:v,verba:v,gasto:0,vendas:0,pedidos:{}};
  }
  return t.orcamento;
}
function verbaVale(){return typeof souTreinador==='function'&&souTreinador();}
function verbaDisponivel(t){
  const o=orcamentoDe(t);
  return o?Math.max(0,o.verba-o.gasto+o.vendas*VERBA_RETORNO_VENDA):0;
}
/* Devolve a mensagem de recusa, ou null se cabe. Só trava no modo Treinador
   e só para o seu clube. */
function foraDaVerba(t,valor){
  if(!t||t.id!==G.meuTime||!verbaVale()||!(valor>0))return null;
  const d=verbaDisponivel(t);
  return valor>d?'A diretoria liberou '+dinheiro(d)+' para transferências e isso custa '+dinheiro(valor)+'. Peça mais verba ou venda alguém.':null;
}
function gastarVerba(t,valor){
  if(!t||t.id!==G.meuTime||!(valor>0))return;
  orcamentoDe(t).gasto+=valor;
}
function creditarVenda(t,valor){
  if(!t||t.id!==G.meuTime||!(valor>0))return;
  orcamentoDe(t).vendas+=valor;
}
/* Uma vez por janela. A diretoria olha a confiança: alta libera, baixa nega. */
function pedirMaisVerba(){
  const t=G.times[G.meuTime], o=orcamentoDe(t);
  if(!verbaVale())return{ok:false,erro:'No modo Diretoria quem decide é você: o limite é o caixa.'};
  if(!G.janela)return{ok:false,erro:'Só com a janela aberta.'};
  const chave=G.ano+'-'+(G.semana<=10?'ini':G.semana<=40?'meio':'fim');
  if(o.pedidos[chave])return{ok:false,erro:'Você já pediu nesta janela. A resposta foi '+(o.pedidos[chave]>0?'sim':'não')+'.'};
  const conf=(G.manager&&G.manager.confianca)||50;
  const extra=Math.round(Math.min(Math.max(0,t.caixa-verbaDisponivel(t)),Math.max(o.inicial,100000)*VERBA_PEDIDO_EXTRA)/5000)*5000;
  if(conf<VERBA_PEDIDO_CONF||extra<=0){
    o.pedidos[chave]=-1;
    return{ok:true,aceito:false,msg:conf<VERBA_PEDIDO_CONF
      ?'A diretoria negou: com a confiança em '+conf+', primeiro querem ver resultado.'
      :'A diretoria negou: não há caixa sobrando para isso.'};
  }
  o.pedidos[chave]=extra;o.verba+=extra;
  if(G.manager)G.manager.confianca=clamp(conf-VERBA_PEDIDO_CUSTO,0,100);
  noticia('🏢 A diretoria liberou mais '+dinheiro(extra)+' para transferências.',{c:'clube',t:[t.id]});
  return{ok:true,aceito:true,extra,msg:'A diretoria liberou mais '+dinheiro(extra)+'. Ela vai cobrar resultado.'};
}

/* ---------- balanço da temporada para a central ---------- */
function movimentosDoClube(t,ano){
  const lst=(G.transferencias||[]).filter(x=>x.ano===ano&&(x.de===t.id||x.para===t.id));
  const entradas=lst.filter(x=>x.para===t.id), saidas=lst.filter(x=>x.de===t.id);
  const soma=l=>l.reduce((s,x)=>s+(x.taxa||0),0);
  return{entradas,saidas,gasto:soma(entradas),receita:soma(saidas)};
}
function maioresTransferencias(ano,n){
  return (G.transferencias||[]).filter(x=>x.ano===ano&&x.taxa>0).sort((a,b)=>b.taxa-a.taxa).slice(0,n||10);
}
function clubesEmCrise(){
  return Object.values(G.times).filter(t=>typeof emCrise==='function'&&emCrise(t));
}

/* ============================================================
   RENOVAÇÃO DE CONTRATO
   ------------------------------------------------------------
   Até aqui renovar era uma pergunta de sim ou não: sempre três
   anos, sempre 12% a mais, e o jogador nunca dizia não. O único
   contrato que você assinava sem negociar era o do próprio
   elenco.

   Agora é a mesma lógica da compra (transferencia.js): o jogador
   tem um pedido explicado linha a linha e uma duração que ele
   quer. Três coisas mexem no pedido:
     · COMO ELE ESTÁ NO CLUBE  moral, minutos, promessa quebrada
     · O QUE ELE VALE LÁ FORA  quem é melhor que o clube cobra
                               para ficar
     · A FASE DA CARREIRA      garoto em ascensão quer contrato
                               curto para renegociar valorizado;
                               veterano quer segurança

   Nada aqui sorteia. A negociação acontece a partir de um clique,
   e o gerador semeado é do motor — o mesmo motivo do veto.
   ============================================================ */

/* Propostas recusadas antes de ele fechar a porta, e por quanto tempo. */
const RENOV_TENTATIVAS=3;
const RENOV_ESPERA=8;
/* Prêmio por ano fora da duração que ele quer. */
const RENOV_PREMIO_ANO=0.07;

function _semanaAbs(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
/* O que ele pede para ficar, e por quê. Cada linha tem um tipo, como no
   pedido de compra: o que não é dinheiro decide a VONTADE DE FICAR
   (interesseEmFicar), o termômetro da mesa de renovação. */
function pedidoRenovacao(p,t,opts){
  opts=opts||{};
  const base=salario(p,t,true);
  const pf=PERFIS[perfilDe(p)];
  const itens=[];
  const juntar=(rot,f,tipo,k)=>{
    if(k!=null&&k!==1)f=Math.pow(f,k);
    if(Math.abs(f-1)>0.005)itens.push({rot,fator:f,tipo:tipo||'dinheiro'});return f;};
  let f=1;
  const titular=(t.titulares||[]).includes(p.id);

  if(p.moral<0.45)f*=juntar('Insatisfeito no clube (moral '+Math.round(p.moral*100)+'%)',1.15,'momento');
  else if(p.moral>=0.80)f*=juntar('Feliz no clube',0.95,'momento');
  if(opts.promessa)f*=juntar('Titularidade prometida em contrato',titular?0.98:1.0,'minutos');
  else if(!titular)f*=juntar('Quer jogar mais do que joga',1.08,'minutos',p.idade<=21?1.3:1);
  /* promessa quebrada pesa por um ano */
  const pq=p.promessaQuebrada;
  if(pq&&((G.ano-pq.ano)*SEMANAS_ANO+((G.semana||1)-pq.semana))<SEMANAS_ANO)
    f*=juntar('Você quebrou uma promessa com ele',1.20,'historia');

  /* quem é melhor que o próprio clube tem mercado e sabe disso */
  const folga=over(p)-nivelDoClube(t);
  if(folga>4)f*=juntar('Tem mercado melhor que o clube',1+Math.min(0.20,folga*0.012),'esporte',pf.esporte);
  const tr=titulosRecentes(t);
  if(tr)f*=juntar('Clube campeão recente ('+tr+' título'+(tr>1?'s':'')+')',1-Math.min(0.06,tr*0.02),'esporte',pf.esporte);
  const anosClube=temporadasNoClube(p);
  if(pf.renova&&anosClube>=1)f*=juntar('Leal ao clube',pf.renova,'historia');
  if(p.daCasa===t.id)f*=juntar('Cria da casa',0.95,'historia');

  if(p.idade>=28)f*=juntar('Veterano: quer garantir o contrato',1.04);
  if(pf.premio)f*=juntar('Perfil mercenário: quer o melhor salário do mercado',pf.premio);
  if(typeof fatorRiqueza==='function')f*=juntar('O clube tem muito dinheiro em caixa',fatorRiqueza(t));
  if(t.id===G.meuTime&&dificuldade().salario!==1)
    f*=juntar('Dificuldade '+dificuldade().nome.toLowerCase(),dificuldade().salario);
  /* nunca aceita ganhar menos do que já ganha, a não ser que esteja caindo */
  const caindo=p.pico&&over(p)<p.pico-4;
  let pedido=Math.round(base*f/100)*100;
  if(!caindo&&pedido<p.salario){
    itens.push({rot:'Não aceita ganhar menos que hoje',fator:p.salario/Math.max(1,base*f),tipo:'dinheiro'});
    pedido=p.salario;
  }

  /* a duração que ele quer: mesma regra da contratação */
  const pref=anosPreferidos(p);
  return{base,itens,pedido:Math.max(300,pedido),anos:pref.faixa,motivoAnos:pref.txt,perfil:perfilDe(p)};
}
/* Vontade de ficar, de 0 a 100, pela mesma régua do interesse de compra. */
function interesseEmFicar(p,t,opts){
  const d=pedidoRenovacao(p,t,opts);
  const itens=d.itens.filter(i=>i.tipo!=='dinheiro').map(i=>({...i,pontos:Math.round(pontosDoFator(i.fator))}));
  let pts=INTERESSE_NEUTRO;for(const i of itens)pts+=pontosDoFator(i.fator);
  const nota=clamp(Math.round(pts),0,100);
  return{nota,faixa:faixaInteresse(nota),itens,perfil:d.perfil};
}
/* O pedido para uma duração específica: cada ano fora do que ele quer custa. */
function pedidoParaAnos(d,anos){
  const fora=anos<d.anos[0]?d.anos[0]-anos:anos>d.anos[1]?anos-d.anos[1]:0;
  return Math.round(d.pedido*(1+fora*RENOV_PREMIO_ANO)/100)*100;
}
function renovacaoFechada(p){
  return !!(p.renovBloq&&_semanaAbs()<p.renovBloq);
}
function semanasAteRenovar(p){
  return renovacaoFechada(p)?p.renovBloq-_semanaAbs():0;
}
/* Recusa que dinheiro não resolve. */
function recusasRenovacao(p,t,anos){
  const fora=[];
  if(p.timeId!==t.id)fora.push(p.nome+' não é do seu elenco.');
  if(anos<1||anos>4)fora.push('Duração de contrato inaceitável (1 a 4 anos).');
  if(renovacaoFechada(p))
    fora.push(p.nome+' encerrou a conversa. Tente de novo em '+semanasAteRenovar(p)+' semana(s).');
  if(p.preContrato&&G.times[p.preContrato.clubeId])
    fora.push(p.nome+' já assinou pré-contrato com o '+G.times[p.preContrato.clubeId].nome+' e sai no fim da temporada.');
  if(p.moral<0.25&&!(t.titulares||[]).includes(p.id))
    fora.push(p.nome+' não quer renovar: está no banco e infeliz. Converse com ele antes.');
  return fora;
}
/* Lista de motivos; vazia é acordo. */
function avaliarRenovacao(p,t,sal,anos){
  const mot=recusasRenovacao(p,t,anos);
  if(mot.length)return mot;
  const d=pedidoRenovacao(p,t);
  const alvo=pedidoParaAnos(d,anos);
  if(sal<alvo*0.97){
    const principal=d.itens.slice().sort((a,b)=>b.fator-a.fator)[0];
    mot.push('Ele quer perto de '+money(alvo)+'/mês por '+anos+' ano(s)'+
      (principal&&principal.fator>1.04?' — pesa: '+principal.rot.toLowerCase():'')+'.');
  }
  return mot;
}
/* Proposta enviada. Recusa conta tentativa; acordo fecha contrato. */
function proporRenovacao(p,t,sal,anos){
  const mot=avaliarRenovacao(p,t,sal,anos);
  if(mot.length){
    if(!renovacaoFechada(p)&&p.timeId===t.id){
      p.renovTent=(p.renovTent||0)+1;
      if(p.renovTent>=RENOV_TENTATIVAS){
        p.renovTent=0;p.renovBloq=_semanaAbs()+RENOV_ESPERA;
        p.moral=clamp(p.moral-0.05,0.05,1);
        mot.push(p.nome+' cansou de proposta baixa e fechou a conversa por '+RENOV_ESPERA+' semanas.');
      }else{
        mot.push('Restam '+(RENOV_TENTATIVAS-p.renovTent)+' proposta(s) antes de ele fechar a conversa.');
      }
    }
    return{ok:false,motivos:mot};
  }
  const d=pedidoRenovacao(p,t);
  const generoso=sal>=pedidoParaAnos(d,anos)*1.10;
  p.contrato=anos;p.salario=Math.round(sal);
  p.renovTent=0;delete p.renovBloq;
  p.moral=clamp(p.moral+(generoso?0.09:0.05),0.05,1);
  noticia('📄 '+p.nome+' renovou com '+t.nome+' por '+anos+' ano(s), '+money(p.salario)+'/mês.',{c:'mercado',p:[p.id],t:[t.id]});
  return{ok:true,msg:p.nome+' renovou por '+anos+' ano(s).'+(generoso?' Saiu valorizado.':'')};
}

/* ============================================================
   SAÍDAS: VENDER E EMPRESTAR
   ------------------------------------------------------------
   Até aqui a transferência só existia numa direção: você comprava,
   e o resto do mundo comprava entre si. Vender o seu próprio
   jogador não era possível — e sem isso não existe gestão de
   elenco, só acúmulo.

   A ideia é a mesma do resto do módulo de transferência: você
   anuncia, os clubes que precisam daquela função e cabem no
   próprio orçamento fazem PROPOSTAS, e você aceita ou não. Não
   existe "vender para o mercado" — existe alguém do outro lado
   que quis, e é isso que faz o preço significar alguma coisa.

   Empréstimo é a segunda saída, e existe por um motivo diferente
   de dinheiro: jovem que não joga não evolui. Sai com ou sem
   opção de compra, e essa é uma decisão sua na hora de anunciar.
   ============================================================ */

/* Quantas semanas uma proposta fica de pé antes de o clube desistir. */
const PRAZO_PROPOSTA=3;
/* Teto de propostas simultâneas por jogador, para a lista não virar ruído. */
const MAX_PROPOSTAS_POR_JOGADOR=3;
/* Fração do salário que o clube que toma emprestado assume. O dono paga o
   resto — é o que torna o empréstimo um custo, e não um truque para zerar
   folha. */
const EMPRESTIMO_SALARIO=0.75;

function anunciados(){
  return Object.values(G.jogadores).filter(p=>p.anuncio&&p.timeId);
}
/* Anunciar. `modo` é 'venda', 'emprestimo' ou 'ambos'; `opcao` diz se o
   empréstimo sai com opção de compra. */
function anunciarJogador(p,modo,opcao,pedido){
  if(!p||!p.timeId)return{ok:false,erro:'Jogador sem clube.'};
  if(p.emprestimo)return{ok:false,erro:'Jogador emprestado não pode ser anunciado.'};
  if(p.preContrato)return{ok:false,erro:p.nome+' já assinou pré-contrato e sai no fim da temporada.'};
  const t=G.times[p.timeId];
  if((t.elenco||[]).length<=ELENCO_MIN&&modo!=='emprestimo')
    return{ok:false,erro:'Com '+t.elenco.length+' jogadores o clube não pode abrir mão de ninguém. Contrate antes de anunciar.'};
  p.anuncio={modo,opcao:!!opcao,pedido:Math.max(0,Math.round(pedido||pedidoDeVenda(p)))};
  return{ok:true,msg:p.nome+' anunciado.'};
}
function retirarAnuncio(p){
  if(!p)return{ok:false};
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:'Anúncio retirado.'};
}

/* ---------- interesse da IA ----------
   Um clube só propõe pelo que ele realmente precisa: a função em falta, ou
   um titular melhor que o pior que ele tem. É a mesma carência que move
   tentarReforco(), para o mercado ter uma lógica só. */
function interesseDe(t,p){
  if(!t||t.id===p.timeId)return 0;
  if((t.elenco||[]).length>=ELENCO_MAX)return 0;
  const car=carenciaDe(t);
  const ganho=Math.max(overComo(p,car.role),over(p))-car.alvo;
  if(ganho<1)return 0;
  if(recusasDuras(p,t,2).length)return 0;
  return ganho;
}
function propostasDe(jogadorId){
  return (G.propostas||[]).filter(x=>x.jogadorId===jogadorId);
}
function proposta(id){return (G.propostas||[]).find(x=>x.id===id)||null;}

/* Uma rodada de propostas. Chamada uma vez por semana pelo relógio. */
function gerarPropostas(){
  if(!G.janela)return 0;
  G.propostas=G.propostas||[];
  let novas=0;
  for(const p of anunciados()){
    if(propostasDe(p.id).length>=MAX_PROPOSTAS_POR_JOGADOR)continue;
    const dono=G.times[p.timeId];
    const candidatos=Object.values(G.times)
      .filter(t=>t.id!==G.meuTime&&t.id!==p.timeId)
      .map(t=>({t,n:interesseDe(t,p)}))
      .filter(x=>x.n>0)
      .sort((a,b)=>b.n-a.n);
    if(!candidatos.length)continue;
    /* Um por semana, e nem sempre: proposta que chega em rajada tira o peso
       de cada uma. O clube mais interessado tem mais chance de aparecer. */
    if(rnd()>0.45*fracaoMercado())continue;
    const alvo=candidatos[Math.min(candidatos.length-1,Math.floor(Math.pow(rnd(),1.8)*candidatos.length))].t;
    if(propostasDe(p.id).some(x=>x.clubeId===alvo.id))continue;
    const quer=p.anuncio.modo;
    const podeEmprestar=quer==='emprestimo'||quer==='ambos';
    const podeComprar=quer==='venda'||quer==='ambos';
    /* Clube pequeno prefere empréstimo; clube grande prefere comprar. */
    const tipo=(podeComprar&&podeEmprestar)
      ? (nivelDoClube(alvo)>=nivelDoClube(dono)-6?'compra':'emprestimo')
      : (podeComprar?'compra':'emprestimo');
    /* às vezes, em vez de dinheiro, o clube oferece um jogador dele mais a diferença */
    let pr=null;
    if(tipo==='compra'&&p.timeId===G.meuTime&&typeof montarTrocaIA==='function'&&rnd()<0.30)pr=montarTrocaIA(p,alvo);
    if(!pr)pr=tipo==='compra'?montarCompra(p,alvo):montarEmprestimo(p,alvo);
    if(!pr)continue;
    G.propostas.push(pr);novas++;
    if(p.timeId===G.meuTime)
      noticia('📨 '+alvo.nome+' fez uma proposta por '+p.nome+
              (pr.tipo==='troca'?' — troca por '+G.jogadores[pr.oferecidoId].nome+(pr.taxa?' mais '+money(pr.taxa):'')
               :tipo==='compra'?' — '+money(pr.taxa):' — empréstimo'+(pr.opcaoCompra?' com opção de compra':'')),{c:'mercado',p:[p.id],t:[alvo.id]});
  }
  /* prazos vencem — contados em semanas: num turno de dois dias da janela
     eles não andam, só na virada da semana */
  if(G._noTurno)return novas;
  G.propostas=G.propostas.filter(x=>{
    if(x.tipo==='multa')return true;   /* corre em mercadoVivo */
    x.prazo--;
    if(x.prazo>0)return true;
    const p=G.jogadores[x.jogadorId];
    if(p&&p.timeId===G.meuTime)noticia('⌛ '+G.times[x.clubeId].nome+' retirou a proposta por '+p.nome+'.',{c:'mercado',p:[p.id]});
    return false;
  });
  return novas;
}
let _seqProp=0;
function novoIdProposta(){return 'pr'+(G.ano||0)+'_'+(++_seqProp)+'_'+Math.floor(rnd()*1e6).toString(36);}

function montarCompra(p,alvo){
  const pedido=p.anuncio.pedido||pedidoDeVenda(p);
  const folga=folgaSalarial(alvo);
  const sal=salarioPedido(p,alvo);
  if(sal>folga)return null;
  const teto=Math.max(0,alvo.caixa*TETO_TAXA);
  /* Ele oferece o que acha justo, não o que você pediu: entre 72% e 108% do
     anúncio, limitado ao que o caixa dele aguenta. Uma proposta que sempre
     bate o pedido não é negociação, é botão. */
  const oferta=Math.round(Math.min(teto,pedido*(0.72+rnd()*0.36))/500)*500;
  if(oferta<=0)return null;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'compra',
         taxa:oferta,salario:Math.round(sal),anos:ri(2,3),opcaoCompra:0,
         prazo:PRAZO_PROPOSTA,pedido};
}
function montarEmprestimo(p,alvo){
  const sal=Math.round(salarioPedido(p,alvo)*EMPRESTIMO_SALARIO);
  if(sal>folgaSalarial(alvo))return null;
  /* Taxa de empréstimo é pequena: quem empresta quer minutos para o jogador,
     não lucro. */
  const taxa=Math.round(Math.max(0,p.valor*0.04*(0.6+rnd()*0.8))/500)*500;
  const opcao=p.anuncio.opcao
    ? Math.round(pedidoDeVenda(p)*(0.9+rnd()*0.35)/500)*500 : 0;
  return{id:novoIdProposta(),jogadorId:p.id,clubeId:alvo.id,tipo:'emprestimo',
         taxa,salario:sal,anos:1,opcaoCompra:opcao,prazo:PRAZO_PROPOSTA,
         pedido:p.anuncio.pedido};
}

/* ---------- aceitar ---------- */
function aceitarProposta(id){
  const pr=proposta(id);
  if(!pr)return{ok:false,erro:'Proposta expirada.'};
  const p=G.jogadores[pr.jogadorId], destino=G.times[pr.clubeId];
  if(!p||!destino)return{ok:false,erro:'Proposta inválida.'};
  const origem=G.times[p.timeId];
  if(!origem)return{ok:false,erro:'O jogador não está em nenhum clube.'};
  if(pr.tipo==='multa')return executarMultaIA(pr);
  if(pr.tipo==='troca'){
    const r=executarTrocaIA(pr);
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id&&x.jogadorId!==p.id);
    if(r.ok)delete p.anuncio;
    return r;
  }
  if((origem.elenco||[]).length<=ELENCO_MIN&&pr.tipo==='compra')
    return{ok:false,erro:'Você ficaria com menos de '+ELENCO_MIN+' jogadores.'};
  /* A proposta ficou de pé algumas semanas. Nesse tempo o caixa do outro clube
     pode ter secado — aceitar assim mesmo jogava o comprador no vermelho por
     um negócio que ele não podia mais bancar. */
  if(destino.caixa<pr.taxa){
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
    return{ok:false,erro:destino.nome+' não tem mais caixa para bancar a proposta. Ela foi retirada.'};
  }
  if((destino.elenco||[]).length>=ELENCO_MAX){
    G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
    return{ok:false,erro:destino.nome+' já está com o elenco cheio. A proposta foi retirada.'};
  }
  const r=pr.tipo==='compra'
    ? executarProposta(p,destino,pr.taxa,pr.salario,pr.anos)
    : executarEmprestimo(p,destino,pr);
  if(!r)return{ok:false,erro:'A negociação não pôde ser concluída.'};
  if(pr.tipo==='compra'&&pr.revenda&&typeof fixarRevenda==='function')fixarRevenda(p,origem.id,pr.revenda);
  if(p.pedidoSaida&&pr.tipo==='compra')delete p.pedidoSaida;
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  return{ok:true,msg:pr.tipo==='compra'
    ?p.nome+' vendido ao '+destino.nome+' por '+money(pr.taxa)+'.'
    :p.nome+' emprestado ao '+destino.nome+'.'};
}
function recusarProposta(id){
  const pr=proposta(id);
  if(!pr)return{ok:false};
  G.propostas=(G.propostas||[]).filter(x=>x.id!==id);
  return{ok:true,msg:'Proposta recusada.'};
}

/* ---------- empréstimo ----------
   O jogador muda de elenco mas não muda de dono. O clube que toma paga a
   maior parte do salário; o dono paga o resto, e é isso que impede o
   empréstimo de virar um jeito de zerar folha sem custo. */
function executarEmprestimo(p,destino,pr){
  const dono=G.times[p.timeId];
  if(!dono)return false;
  destino.caixa-=pr.taxa;dono.caixa+=pr.taxa;
  const contratoOriginal=p.contrato, salarioOriginal=p.salario;
  contratar(p,destino,1,pr.salario);
  p.emprestimo={donoId:dono.id,fim:(G.ano||0),opcaoCompra:pr.opcaoCompra||0,
                contrato:contratoOriginal,salario:salarioOriginal,
                over:over(p),
                parteDono:Math.max(0,salarioOriginal-pr.salario)};
  noticia('🔁 '+p.nome+' foi emprestado ao '+destino.nome+' por uma temporada'+
          (pr.opcaoCompra?' com opção de compra de '+money(pr.opcaoCompra):'')+'.',{c:'mercado',p:[p.id],t:[destino.id]});
  return true;
}
/* Fim de temporada: quem estava emprestado volta, ou é comprado. */
function resolverEmprestimos(){
  let voltas=0,compras=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!p.emprestimo)continue;
    const e=p.emprestimo, dono=G.times[e.donoId], atual=G.times[p.timeId];
    if(!dono){delete p.emprestimo;continue;}
    /* A opção só é exercida se ele JOGOU e não regrediu, e se o clube sustenta
       o salário. A condição antiga comparava o over dele com ele mesmo
       (over(p)>=over(p)-1), o que é verdade sempre: na prática nada era
       conferido além dos mapas. Agora o over do início do empréstimo fica
       guardado e serve de referência de verdade. */
    const jogou=(p.temp&&p.temp.maps)||0;
    const partiuDe=typeof e.over==='number'?e.over:over(p);
    const rende=jogou>=8&&over(p)>=partiuDe-1;
    const cabe=atual&&atual.caixa>e.opcaoCompra&&folgaSalarial(atual)>=e.salario;
    /* no seu clube a opção é decisão sua (exercerOpcao), não sorteio */
    if(e.opcaoCompra&&atual&&atual.id!==dono.id&&atual.id!==G.meuTime&&rende&&cabe&&rnd()<0.6){
      atual.caixa-=e.opcaoCompra;dono.caixa+=e.opcaoCompra;
      delete p.emprestimo;p.contrato=ri(2,3);p.salario=e.salario;
      noticia('💰 '+atual.nome+' exerceu a opção de compra de '+p.nome+' por '+money(e.opcaoCompra)+'.',{c:'mercado',p:[p.id],t:[atual.id]});
      compras++;continue;
    }
    if(atual&&atual.id!==dono.id){
      contratar(p,dono,Math.max(1,e.contrato),e.salario);
      noticia('↩ '+p.nome+' voltou ao '+dono.nome+' após o empréstimo.',{c:'mercado',p:[p.id],t:[dono.id]});
    }
    delete p.emprestimo;voltas++;
  }
  return{voltas,compras};
}
/* O dono continua pagando a parte dele — cobrada pelo relógio semanal. */
function custoEmprestimosDe(t){
  if(!t)return 0;
  let s=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(p.emprestimo&&p.emprestimo.donoId===t.id&&p.timeId!==t.id)s+=p.emprestimo.parteDono||0;
  }
  return s;
}
/* Quem o clube tem emprestado por aí, para a tela. */
function emprestadosDe(t){
  return Object.values(G.jogadores)
    .filter(p=>p.emprestimo&&p.emprestimo.donoId===t.id&&p.timeId!==t.id);
}

/* ============================================================
   NEGOCIAR A PROPOSTA — a mesa ao contrário
   ------------------------------------------------------------
   Antes a proposta que chegava por um jogador seu só tinha dois
   botões: aceitar ou recusar. Agora dá para pedir mais, do mesmo
   jeito que você negocia quando compra, só que do outro lado da
   mesa: você pede, o clube que quer o jogador responde subindo a
   oferta ou parando no limite dele, e tem paciência — pedido
   recusado gasta um ponto, pedido fora da realidade gasta dois.
   Acabou a paciência, ele retira a proposta.

   O limite do comprador é escondido e não sorteia: sai do valor do
   jogador, do quanto ele precisa da função, do caixa dele e de um
   embaralhador fixo da proposta — o mesmo pedido dá sempre a mesma
   resposta e o gerador do motor não anda.
   Pedir parte de uma venda futura (revenda) também vale: ele aceita
   pagar menos agora em troca, como você faz quando compra.
   ============================================================ */
const VENDA_PAC=3;
const VENDA_EXAGERO=1.45;      /* acima disto do limite dele, o pedido ofende */
function vendaNegociavel(pr){return !!pr&&(pr.tipo==='compra'||pr.tipo==='emprestimo');}
/* o máximo que o comprador paga por esta proposta */
function limiteDoComprador(pr){
  const p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
  if(!p||!c)return pr.taxa||0;
  const h=_hashTxt(pr.id+'|limite');
  if(pr.tipo==='emprestimo'){
    const lim=Math.max(pr.taxa,Math.round(p.valor*(0.06+(h%5)/100)/500)*500);
    return Math.min(Math.max(pr.taxa,c.caixa*0.5),lim);
  }
  /* quanto mais ele precisa do jogador, mais esticado o limite */
  const necessidade=Math.min(0.12,Math.max(0,interesseDe(c,p))*0.012);
  const base=Math.max(pr.taxa,pr.pedido||0,pedidoDeVenda(p));
  const lim=Math.round(base*(1.02+(h%20)/100+necessidade)/500)*500;
  const caixa=Math.max(0,c.caixa*TETO_TAXA);
  return Math.max(pr.taxa,Math.min(caixa,lim));
}
function _falaVenda(pr,de,txt,extra){(pr.neg.hist=pr.neg.hist||[]).push({de,txt,sem:G.semana,ano:G.ano,...(extra||{})});}
function abrirNegociacaoVenda(id){
  const pr=proposta(id);
  if(!pr)return{ok:false,erro:'A proposta não está mais na mesa.'};
  if(!vendaNegociavel(pr))return{ok:false,erro:pr.tipo==='multa'?'Multa paga não se negocia: só ele decide.':'Essa proposta não se negocia.'};
  if(!pr.neg){
    const p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
    pr.neg={pac:VENDA_PAC,pacMax:VENDA_PAC,inicial:pr.taxa,hist:[]};
    _falaVenda(pr,'clube',pr.tipo==='emprestimo'
      ?'Queremos '+p.nome+' emprestado por uma temporada: '+dinheiro(pr.taxa)+' de taxa'+(pr.opcaoCompra?' e opção de compra de '+dinheiro(pr.opcaoCompra):'')+'.'
      :'Oferecemos '+dinheiro(pr.taxa)+' por '+p.nome+'. Ele receberia '+dinheiro(pr.salario)+'/mês aqui no '+c.nome+'.');
  }
  return{ok:true,pr};
}
/* Você pede `valor` (e, na venda, `revenda`% de uma venda futura).
   Devolve {ok, resposta:'aceita'|'contra'|'limite'|'retirada', valor, venda} */
function pedirNaVenda(id,valor,revenda){
  const a=abrirNegociacaoVenda(id);if(!a.ok)return a;
  const pr=a.pr,p=G.jogadores[pr.jogadorId],c=G.times[pr.clubeId];
  if(!G.janela)return{ok:false,erro:'A janela está fechada.'};
  valor=Math.max(0,Math.round((valor||0)/500)*500);
  revenda=pr.tipo==='compra'&&REVENDA_OPCOES.includes(+revenda)?+revenda:0;
  if(valor<=pr.taxa&&!revenda)return{ok:false,erro:'Isso é o que eles já oferecem: é só aceitar.'};
  _falaVenda(pr,'voce','Pedimos '+dinheiro(valor)+(revenda?' e '+revenda+'% de uma venda futura':'')+'.',{valor});
  /* revenda custa para quem compra: o pedido pesa como se fosse maior */
  const custo=revenda?valor*(1+revenda/100*pesoRevenda(p)):valor;
  const lim=limiteDoComprador(pr);
  if(custo<=lim){
    pr.taxa=valor;pr.revenda=revenda||pr.revenda||0;
    _falaVenda(pr,'clube','Fechado: '+dinheiro(valor)+(revenda?' e '+revenda+'% da próxima venda':'')+'.');
    const r=aceitarProposta(pr.id);
    return{ok:r.ok,erro:r.erro,resposta:'aceita',valor,venda:r};
  }
  const exagero=custo>lim*VENDA_EXAGERO;
  pr.neg.pac-=exagero?2:1;
  if(pr.neg.pac<=0){
    _falaVenda(pr,'clube',exagero?'Esse valor está fora da realidade. Retiramos a proposta.':'Não chegamos a um acordo. Retiramos a proposta.');
    G.propostas=(G.propostas||[]).filter(x=>x.id!==pr.id);
    noticia('🚪 '+c.nome+' desistiu de '+p.nome+' depois da negociação.',{c:'mercado',p:[p.id],t:[c.id]});
    return{ok:true,resposta:'retirada',hist:pr.neg.hist};
  }
  /* a contraproposta sobe na sua direção, mas nunca passa do limite dele */
  const antes=pr.taxa;
  const nova=Math.min(lim,Math.max(antes+5000,Math.round((antes+(Math.min(custo,lim*1.2)-antes)*0.45)/5000)*5000));
  pr.taxa=Math.max(antes,Math.round(nova/500)*500);
  pr.prazo=Math.max(pr.prazo||1,2);
  const noLimite=pr.taxa>=lim;
  _falaVenda(pr,'clube',(exagero?'Muito acima do que ele vale para nós. ':'')+
    (noLimite?'Esse é o nosso limite: '+dinheiro(pr.taxa)+'.':'Subimos para '+dinheiro(pr.taxa)+'.'),{valor:pr.taxa});
  return{ok:true,resposta:noLimite?'limite':'contra',valor:pr.taxa};
}

/* ============================================================
   LEGADO: TÍTULOS ANTIGOS, CONFRONTO DIRETO E RIVALIDADE
   ------------------------------------------------------------
   Um clube sem passado é um nome com um escudo. Este módulo dá
   enredo às franquias em três camadas:

     · o que já ganharam antes de 2027 (data/historia.js)
     · quem enfrentaram desde então, e com que placar
     · de quem eles não gostam, e por quê

   A terceira camada não é escrita à mão: rivalidade é DERIVADA do
   confronto direto e do histórico. Escrever "Sentinels odeia
   100 Thieves" numa tabela envelhece mal — depois de dez
   temporadas simuladas a rivalidade seria mentira. Derivando,
   ela acompanha o que aconteceu na sua run.
   ============================================================ */

/* ---------- semeadura da pré-história ---------- */
/* Normalização própria em vez de ASSETS.slug: o motor roda sem a camada de
   dados em tools/verificar.mjs, e uma dependência de UI dentro do core faria a
   simulação parar de subir. Tira acento, caixa e pontuação — o suficiente para
   'LEVIATÁN' casar com 'Leviatán' e 'EDward Gaming' com 'Edward Gaming'. */
function _chaveNome(x){
  return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
}
function acharClubePorNome(nome){
  const alvo=_chaveNome(ALIAS_CLUBE[nome]||nome);
  for(const id in G.times)if(_chaveNome(G.times[id].nome)===alvo)return G.times[id];
  return null;
}

/* Torcida herdada. Um clube que ganhou Champions em 2022 chega em 2027 com
   público maior do que um que nunca ganhou nada, mesmo que hoje jogue igual.
   É por isso que legado é diferente de prestígio: prestígio é o que você é
   agora, torcida é o que você já foi. */
const TORCIDA_POR_TITULO=7;
const TORCIDA_TETO_LEGADO=26;

function semearHistoria(){
  G.historico=G.historico||[];
  if(typeof HISTORIA_REAL==='undefined')return 0;
  let semeados=0;
  for(const h of HISTORIA_REAL){
    /* o registro do mundo guarda TODOS, inclusive campeões que não existem
       mais: é o que faz 2021 parecer que aconteceu */
    G.historico.push({ano:h.ano,evento:h.evento,campeao:h.campeao,vice:h.vice||'',
                      escopo:h.escopo,pre:true});
    const t=acharClubePorNome(h.campeao);
    if(!t)continue;
    t.titulos=t.titulos||[];
    t.titulos.push(h.ano+' · '+h.evento);
    t.legado=(t.legado||0)+(PESO_TITULO[h.escopo]||0.34);
    semeados++;
    const v=h.vice&&acharClubePorNome(h.vice);
    if(v){v.vices=(v.vices||0)+1;}
  }
  /* a torcida herdada entra depois, para o peso total já estar somado */
  for(const id in G.times){
    const t=G.times[id];
    if(!t.legado)continue;
    t.torcida=clamp(Math.round(t.torcida+Math.min(TORCIDA_TETO_LEGADO,t.legado*TORCIDA_POR_TITULO)),
                    pisoTorcida(t),TORCIDA_MAX);
  }
  G.historico.sort((a,b)=>a.ano-b.ano);
  return semeados;
}
/* Resumo do passado de um clube, para a interface. */
function legadoDe(t){
  const titulos=(t.titulos||[]);
  const inter=titulos.filter(x=>/Champions|Masters|LOCK/.test(x));
  return{total:titulos.length,internacionais:inter.length,
         peso:t.legado||0,vices:t.vices||0,titulos};
}

/* ---------- confronto direto ---------- */
/* Guardado em G.h2h com chave ordenada, para "A contra B" e "B contra A"
   caírem no mesmo registro. Sem a ordenação seriam dois históricos separados
   que nunca conversariam. */
/* Quantos confrontos recentes cada par guarda. Eram 12: com 80 clubes isso era
   um quarto do save depois de vinte temporadas, e a tela mostra menos que isso. */
const H2H_ULTIMOS=6;
function chaveH2H(a,b){return a<b?a+'|'+b:b+'|'+a;}
function registrarConfronto(idA,idB,vencedorId,ctx){
  if(!idA||!idB||idA===idB)return null;
  G.h2h=G.h2h||{};
  const k=chaveH2H(idA,idB);
  const r=G.h2h[k]||(G.h2h[k]={a:idA<idB?idA:idB,b:idA<idB?idB:idA,va:0,vb:0,jogos:0,ultimos:[]});
  r.jogos++;
  if(vencedorId===r.a)r.va++;else if(vencedorId===r.b)r.vb++;
  r.ultimos.unshift({ano:G.ano,v:vencedorId,ctx:ctx||''});
  if(r.ultimos.length>H2H_ULTIMOS)r.ultimos.pop();
  return r;
}
function confronto(idA,idB){
  const r=G.h2h&&G.h2h[chaveH2H(idA,idB)];
  if(!r)return{jogos:0,vitorias:0,derrotas:0,ultimos:[]};
  const eu=idA===r.a;
  return{jogos:r.jogos,vitorias:eu?r.va:r.vb,derrotas:eu?r.vb:r.va,ultimos:r.ultimos};
}
/* Todos os confrontos de um clube, do mais jogado para o menos. */
function confrontosDe(id){
  const out=[];
  for(const k in (G.h2h||{})){
    const r=G.h2h[k];
    if(r.a!==id&&r.b!==id)continue;
    const outro=r.a===id?r.b:r.a;
    if(!G.times[outro])continue;
    const eu=r.a===id;
    out.push({time:G.times[outro],jogos:r.jogos,vitorias:eu?r.va:r.vb,
              derrotas:eu?r.vb:r.va,ultimos:r.ultimos});
  }
  return out.sort((a,b)=>b.jogos-a.jogos);
}

/* ---------- rivalidade ---------- */
/* A nota de rivalidade responde a uma pergunta: o quanto esse jogo importa?
   Importa quando os dois se enfrentam muito, quando o histórico é equilibrado
   (goleada crônica não é rivalidade, é freguesia), quando os dois são grandes,
   e quando são da mesma região — clássico de vizinho pesa mais. */
const RIV_MIN_JOGOS=4;
function notaRivalidade(t,c){
  if(c.jogos<RIV_MIN_JOGOS)return 0;
  const volume=Math.min(1,c.jogos/14);
  const equilibrio=1-Math.abs(c.vitorias-c.derrotas)/c.jogos;   /* 1 = empatado */
  const porte=Math.min(1,((t.torcida||0)+(c.time.torcida||0))/160);
  const vizinhos=t.regiao===c.time.regiao?1:0.55;
  const legado=Math.min(1,(((t.legado||0)+(c.time.legado||0))/6));
  return (volume*0.32+equilibrio*0.30+porte*0.18+legado*0.20)*vizinhos;
}
/* ---------- o clássico pesa ----------
   Até aqui a rivalidade era só uma linha na tela História: nada no jogo
   mudava por ganhar ou perder do rival. Agora o clássico mexe no vestiário e
   na torcida, na proporção da nota — clássico morno mexe pouco, o grande
   clássico da liga mexe muito. A torcida é o que leva isso ao patrocínio
   (atratividade em economia.js). Nada sorteia. */
const RIV_CLASSICO=0.28;   /* a mesma régua de rivaisDe */
function aplicarClassico(vencedorId,perdedorId){
  const V=G.times[vencedorId],P=G.times[perdedorId];
  if(!V||!P)return null;
  const nota=notaRivalidade(V,{...confronto(V.id,P.id),time:P});
  if(nota<=RIV_CLASSICO)return null;
  const k=Math.min(1.6,nota/0.5);
  const mexer=(t,dm)=>(t.titulares||[]).forEach(id=>{const p=G.jogadores[id];
    if(p)p.moral=clamp(p.moral+dm,0.15,1);});
  mexer(V,0.04*k);
  /* conta para a meta de patrocínio "vencer um clássico" */
  V.classicos=V.classicos&&V.classicos.ano===G.ano?{ano:G.ano,n:V.classicos.n+1}:{ano:G.ano,n:1};
  mexer(P,-0.05*k);
  const piso=t=>(typeof pisoTorcida==='function')?pisoTorcida(t):0;
  const teto=(typeof TORCIDA_MAX!=='undefined')?TORCIDA_MAX:100;
  if(typeof V.torcida==='number')V.torcida=clamp(V.torcida+Math.round(2*k),piso(V),teto);
  if(typeof P.torcida==='number')P.torcida=clamp(P.torcida-Math.round(1.5*k),piso(P),teto);
  if((V.id===G.meuTime||P.id===G.meuTime)&&typeof noticia==='function')
    noticia('🔥 Clássico: '+V.nome+' venceu '+P.nome+'. '+
      (V.id===G.meuTime?'A torcida foi à loucura e o vestiário cresceu.':'Derrota que dói: o vestiário sentiu e a torcida cobrou.'),{c:'competicoes',t:[V.id,P.id],imp:2});
  return{nota,k};
}
function rivaisDe(id,quantos){
  const t=G.times[id];if(!t)return[];
  return confrontosDe(id)
    .map(c=>({...c,nota:notaRivalidade(t,c)}))
    .filter(c=>c.nota>0.28)
    .sort((a,b)=>b.nota-a.nota)
    .slice(0,quantos||3);
}
/* Por que esses dois são rivais — em uma frase, montada do que de fato
   aconteceu. Sem isso a rivalidade é um número e não conta história. */
function motivoRivalidade(t,c){
  const partes=[];
  partes.push(c.jogos+' confrontos');
  if(c.vitorias===c.derrotas)partes.push('empatados em '+c.vitorias+'–'+c.derrotas);
  else partes.push(c.vitorias+'–'+c.derrotas+(c.vitorias>c.derrotas?' para você':' contra você'));
  const tit=(c.time.titulos||[]).length;
  if(tit)partes.push('o rival tem '+tit+' título'+(tit>1?'s':''));
  if(t.regiao===c.time.regiao)partes.push('mesma liga');
  return partes.join(' · ');
}

/* ============================================================
   PRÊMIOS DA TEMPORADA E HALL DA FAMA
   ------------------------------------------------------------
   Até aqui o jogo esquecia tudo na virada do ano: o melhor de
   cada torneio era eleito, mas ninguém era o melhor DO ANO, e o
   jogador que se aposentava sumia do save junto com a história
   dele.

   A temporada é lida dos stages do calendário, que ainda estão
   todos lá quando fimDeTemporada() começa. Cada stage pesa pelo
   tamanho do palco: um Champions vale mais que um split de
   Challengers, e é por isso que o MVP do ano sai do Tier 1 mesmo
   quando um garoto do Challengers faz 300 de ACS.

   Nada aqui sorteia: os prêmios são uma leitura do que já
   aconteceu, e o gerador semeado é do motor.
   ============================================================ */

/* Mínimo de mapas para concorrer: quem jogou um torneio e brilhou não é o
   melhor do ano. */
const PREMIO_MIN_MAPAS=14;
const PREMIO_MIN_MAPAS_REVELACAO=10;
const IDADE_REVELACAO=20;
/* Corte do Hall da Fama, em pontos de carreira (ver pontosDeLenda). */
const LENDA_CORTE=14;
/* Quanto a comparação é contra a própria função (o resto é contra todos). */
const PREMIO_PESO_FUNCAO=0.7;

/* ---------- a régua: desempenho e conquistas ----------
   A nota de cada prêmio tem duas metades explícitas, cada uma medida em
   desvios em relação aos candidatos do ano (assim as duas falam a mesma
   língua): DESEMPENHO, o que o jogador fez (rendimento contra a função,
   K/D, MVPs de mapa, volume em palco grande), e CONQUISTAS, o que o time
   dele ganhou com ele em campo (títulos, finais e campanha internacional,
   Champions acima de Masters, Masters acima de liga).
   A fatia de conquistas muda por prêmio: o MVP do ano é de quem ganhou;
   a seleção e o MVP regional pesam menos o troféu; a revelação é só sobre
   o jogador. Medido com tools/premios.mjs em 20 temporadas. */
const PREMIO_CONQUISTAS={mvp:0.4,selecao:0.3,regional:0.25,revelacao:0};
/* Fora da curva: quem não chegou a nenhuma final internacional só leva o
   MVP do ano se o desempenho dele passar o do segundo melhor por esta
   margem, em desvios dos candidatos. */
const PREMIO_FORA_MARGEM=0.55;
/* Pontos por colocação no mata-mata: campeão, vice, top 4, top 8. */
const CONQ_LUGAR={champions:[10,6,3.5,1.8],masters:[6,3.6,2,1],liga:[2.4,1.3,0.6,0],acesso:[0.6,0.3,0,0]};
/* Estar no internacional já é campanha, mesmo caindo na fase de grupos. */
const CONQ_GRUPO={champions:0.6,masters:0.4};

function classeConquista(s){
  if(s.regiao==='INT')return s.torneioId==='champions'||/^ch/.test(s.id)?'champions':'masters';
  return s.tier===2?'acesso':'liga';
}
function pontosDeLugar(cl,i){
  const f=i===0?0:i===1?1:i>=2&&i<=3?2:i>=4&&i<=7?3:-1;
  return f<0?0:CONQ_LUGAR[cl][f];
}

function pesoDoStagePremio(s){
  if(s.tier===2)return 0.4;
  if(s.regiao==='INT')return /^ch/.test(s.id)?1.8:1.4;
  return 1;
}

/* Função contra a qual o jogador é comparado: a que ele joga. Flex não
   tem grupo próprio grande o bastante e é comparado com todo mundo. */
function funcaoPremio(p){
  const r=p.roleAtual&&p.roleAtual!=='Flex'?p.roleAtual:p.role;
  return r==='Flex'?'todos':r;
}
/* Soma da temporada de cada jogador e de cada time, stage a stage. */
function lerTemporada(){
  const jog={},times={};
  const stages=(G.calendario||[]).flatMap(b=>b.stages||[]).filter(s=>s&&s.feito);
  for(const s of stages){
    const w=pesoDoStagePremio(s);
    const rk=s.ranking||[];
    const n=Math.max(1,rk.length-1);
    rk.forEach((id,i)=>{
      const r=times[id]||(times[id]={camp:0,peso:0,titulos:0});
      r.camp+=w*(1-i/n);r.peso+=w;
      if(i===0&&s.tipo!=='grupos'&&s.tipo!=='swiss')r.titulos+=w;
    });
    if(!s.stats)continue;
    /* ACS e K/D comparados com a média da função no próprio stage. Contra a
       média geral pura, Duelista ganhava todo prêmio: ele faz mais abate por
       desenho, não por jogar melhor. */
    const fn={todos:{acs:0,maps:0,k:0,d:0}};
    for(const id in s.stats){
      const e=s.stats[id],p=G.jogadores[id];if(!e.maps||!p)continue;
      for(const k of [funcaoPremio(p),'todos']){
        const f=fn[k]||(fn[k]={acs:0,maps:0,k:0,d:0});
        f.acs+=e.acs;f.maps+=e.maps;f.k+=e.k;f.d+=e.d;
      }
    }
    const pos=id=>{const i=rk.indexOf(id);return i<0?0.35:1-i/n;};
    /* conquistas: cada um leva a parte do time na proporção dos mapas que
       jogou — o reserva que entrou num mapa não é campeão do mesmo jeito */
    const cl=classeConquista(s),mata=s.tipo==='de'||s.tipo==='ko';
    const maxTime={};
    for(const id in s.stats){const e=s.stats[id];if(e.maps&&e.timeId)maxTime[e.timeId]=Math.max(maxTime[e.timeId]||0,e.maps);}
    for(const id in s.stats){
      const e=s.stats[id],p=G.jogadores[id];if(!e.maps||!p)continue;
      const f=fn[funcaoPremio(p)];
      /* parte função, parte geral: só contra a função, um Controlador de
         170 de ACS virava MVP do ano, e ninguém olha para isso e concorda */
      const T=fn.todos;
      const q=PREMIO_PESO_FUNCAO;
      const acsFn=q*f.acs/Math.max(1,f.maps)+(1-q)*T.acs/Math.max(1,T.maps);
      const kdFn=q*f.k/Math.max(1,f.d)+(1-q)*T.k/Math.max(1,T.d);
      const a=jog[id]||(jog[id]={maps:0,k:0,d:0,acs:0,mvp:0,rel:0,krel:0,wd:0,wm:0,camp:0,timeId:null,
        conq:0,finalInt:false,lista:[]});
      a.maps+=e.maps;a.k+=e.k;a.d+=e.d;a.acs+=e.acs;a.mvp+=e.mvp;
      a.rel+=w*e.acs/Math.max(1,acsFn);a.krel+=w*e.k/Math.max(0.1,kdFn);a.wd+=w*e.d;
      a.wm+=w*e.maps;a.camp+=w*e.maps*pos(e.timeId);
      a.timeId=e.timeId||a.timeId;
      const fr=Math.min(1,e.maps/Math.max(1,maxTime[e.timeId]||e.maps));
      if(mata){
        const i=rk.indexOf(e.timeId),pts=i<0?0:pontosDeLugar(cl,i)*fr;
        if(pts>0){a.conq+=pts;
          if(pts>=1)a.lista.push({ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,i,cl,pts:Math.round(pts*10)/10});}
        if(s.regiao==='INT'&&i>=0&&i<=1&&fr>=0.5)a.finalInt=true;
      }else if(CONQ_GRUPO[cl])a.conq+=CONQ_GRUPO[cl]*fr;
    }
  }
  return{jog,times};
}

/* Metade DESEMPENHO: a nota do ano sem a campanha. */
function desempenhoDoAno(a){
  const rel=a.rel/Math.max(1,a.wm);
  const kd=a.krel/Math.max(1,a.wd);
  return (rel-1)*1.9+(Math.min(2.2,kd)-1)*0.55+(a.mvp/a.maps)*0.95+0.35*Math.min(1,a.wm/60);
}
/* Nota do ano antiga (desempenho + um pouco de campanha). Ficou para o IGL
   do ano, que já soma a campanha do time por fora, e para a medição de
   antes e depois em tools/premios.mjs. Mesmo desenho da nota de MVP de torneio
   (notaMVP em formatos.js), com ACS e K/D relativos à função, mais um termo de palco: quem jogou muito mapa
   em torneio grande ganha até 0,35. */
function notaDoAno(a){
  const rel=a.rel/Math.max(1,a.wm);
  const kd=a.krel/Math.max(1,a.wd);
  return (rel-1)*1.9+(Math.min(2.2,kd)-1)*0.55+(a.mvp/a.maps)*0.95
        +0.35*Math.min(1,a.wm/60)+0.25*(a.camp/Math.max(1,a.wm));
}

/* Foto do premiado, como a do MVP de torneio: ele pode se aposentar e
   ser apagado, o prêmio não. */
function fichaPremio(id,a,r){
  const p=G.jogadores[id];if(!p)return null;
  const t=a&&a.timeId&&G.times[a.timeId];
  const f={id,nome:p.nome,pais:p.pais,role:p.role,idade:p.idade,
    timeId:t?t.id:null,tag:t?t.tag:'—',
    maps:a?a.maps:0,acs:a?Math.round(a.acs/Math.max(1,a.maps)):0,
    kd:a?Number((a.d?a.k/a.d:a.k).toFixed(2)):0,
    ov:over(p),mvps:a?a.mvp:0};
  /* a régua de quem levou: nota final, as duas metades em percentil entre os
     candidatos e o que o time conquistou com ele (é isso que a tela mostra) */
  if(r){f.n=Math.round(r.n*100)/100;f.pD=r.pD;f.pC=r.pC;
    if(r.conq)f.conq=r.conq;}
  return f;
}

function darPremio(id,tipo,rot){
  const p=G.jogadores[id];if(!p)return;
  (p.premios=p.premios||[]).push({ano:G.ano,tipo,rot});
}

const ROT_PREMIO={mvp:'MVP do ano',regional:'MVP regional',selecao:'Seleção do ano',
                  revelacao:'Revelação do ano',igl:'IGL do ano'};

/* Elege tudo de uma vez e grava em G.premios. Chamada no começo da virada,
   antes de aposentadoria, contrato e empréstimo mexerem nos elencos. */
/* Régua dos candidatos do ano: desempenho e conquistas em desvios, medidos
   contra quem tem mapas para concorrer, e aplicados a todo mundo (a
   revelação concorre com menos mapas). */
function reguaDoAno(jog,cand){
  const D={},C={};
  for(const id in jog)if(jog[id].maps){D[id]=desempenhoDoAno(jog[id]);C[id]=jog[id].conq||0;}
  const norm=v=>{const xs=cand.map(id=>v[id]);const m=xs.reduce((s,x)=>s+x,0)/xs.length;
    const sd=Math.sqrt(xs.reduce((s,x)=>s+(x-m)*(x-m),0)/xs.length)||1;
    const z={};for(const id in v)z[id]=(v[id]-m)/sd;return z;};
  const zD=norm(D),zC=norm(C);
  const pct=v=>{const xs=cand.map(id=>v[id]).sort((a,b)=>a-b);
    return id=>{let k=0;while(k<xs.length&&xs[k]<v[id])k++;return Math.round(k/xs.length*100);};};
  const pD=pct(D),pC=pct(C);
  return{zD,zC,
    nota:(id,tipo)=>{const w=PREMIO_CONQUISTAS[tipo]||0;return (1-w)*zD[id]+w*zC[id];},
    ficha:(id,tipo,comConq)=>({n:(1-(PREMIO_CONQUISTAS[tipo]||0))*zD[id]+(PREMIO_CONQUISTAS[tipo]||0)*zC[id],
      pD:pD(id),pC:pC(id),conq:comConq?jog[id].lista.slice().sort((a,b)=>b.pts-a.pts).slice(0,5):null})};
}

/* Elege tudo de uma vez e grava em G.premios. Chamada no começo da virada,
   antes de aposentadoria, contrato e empréstimo mexerem nos elencos. */
function premiarTemporada(){
  const {jog,times}=lerTemporada();
  const cand=Object.keys(jog).filter(id=>G.jogadores[id]&&jog[id].maps>=PREMIO_MIN_MAPAS);
  if(!cand.length)return null;
  const nota={};
  for(const id in jog)if(jog[id].maps)nota[id]=notaDoAno(jog[id]);
  const R=reguaDoAno(jog,cand);
  const ordem=tipo=>(a,b)=>R.nota(b,tipo)-R.nota(a,tipo);
  const fichaDe=(id,tipo,comConq)=>fichaPremio(id,jog[id],R.ficha(id,tipo,comConq));
  /* pódio: os três primeiros, com a nota de cada um */
  const podio=(ids,tipo)=>ids.slice(0,3).map(id=>fichaDe(id,tipo));

  const reg={ano:G.ano,mvp:null,regioes:{},selecao:[],revelacao:null,igl:null,treinador:null,podios:{}};

  /* MVP: o melhor da régua entre quem chegou a uma final internacional; o
     fora da curva fura a fila só com um desempenho muito acima do segundo */
  const porMvp=cand.slice().sort(ordem('mvp'));
  const finalistas=porMvp.filter(id=>jog[id].finalInt);
  const porD=cand.slice().sort((a,b)=>R.zD[b]-R.zD[a]);
  const topo=porD[0],gap=porD.length>1?R.zD[topo]-R.zD[porD[1]]:0;
  const fora=!jog[topo].finalInt&&gap>=PREMIO_FORA_MARGEM;
  const mvp=fora?topo:(finalistas[0]||porMvp[0]);
  reg.mvp=fichaDe(mvp,'mvp',true);
  if(fora)reg.mvp.fora=Math.round(gap*100)/100;
  reg.podios.mvp=[reg.mvp,...podio(porMvp.filter(id=>id!==mvp),'mvp').slice(0,2)];
  darPremio(mvp,'mvp',ROT_PREMIO.mvp);

  const porReg=cand.slice().sort(ordem('regional'));
  for(const Rg of REGIONS){
    const ids=porReg.filter(i=>{const t=G.times[jog[i].timeId];return t&&t.regiao===Rg.id&&t.tier===1;});
    if(!ids.length)continue;
    reg.regioes[Rg.id]=fichaDe(ids[0],'regional',true);
    reg.podios['reg_'+Rg.id]=podio(ids,'regional');
    darPremio(ids[0],'regional',ROT_PREMIO.regional+' · '+Rg.nome);
  }

  /* um por função e o quinto é o melhor que sobrou, como as seleções de
     verdade fazem com o flex */
  const porSel=cand.slice().sort(ordem('selecao'));
  const usados=new Set();
  for(const role of ROLES.filter(r=>r!=='Flex')){
    const id=porSel.find(i=>!usados.has(i)&&G.jogadores[i].role===role);
    if(id)usados.add(id);
  }
  /* o quinto é o melhor que sobrou; se faltou alguma função entre os
     candidatos, o melhor que sobrou cobre também essa vaga */
  for(const id of porSel){if(usados.size>=5)break;usados.add(id);}
  reg.selecao=[...usados].sort(ordem('selecao')).map(id=>fichaDe(id,'selecao'));
  usados.forEach(id=>darPremio(id,'selecao',ROT_PREMIO.selecao));

  const revs=Object.keys(jog).filter(id=>{const p=G.jogadores[id];
    return p&&p.idade<=IDADE_REVELACAO&&jog[id].maps>=PREMIO_MIN_MAPAS_REVELACAO;}).sort(ordem('revelacao'));
  const rev=revs[0];
  if(rev){reg.revelacao=fichaDe(rev,'revelacao');reg.podios.revelacao=podio(revs,'revelacao');
    darPremio(rev,'revelacao',ROT_PREMIO.revelacao);}

  /* IGL e treinador são prêmio de campanha: o desempenho individual pesa
     pouco no IGL e nada no treinador */
  const campanha=id=>{const r=times[id];return r?r.camp+r.titulos*0.6:0;};
  const t1=Object.values(G.times).filter(t=>t.tier===1);
  const igl=t1.filter(t=>t.igl&&G.jogadores[t.igl]&&jog[t.igl])
    .map(t=>({id:t.igl,n:campanha(t.id)+0.4*(nota[t.igl]||0)})).sort((a,b)=>b.n-a.n)[0];
  if(igl){reg.igl=fichaPremio(igl.id,jog[igl.id]);darPremio(igl.id,'igl',ROT_PREMIO.igl);}

  /* treinador: campanha, com um empurrão para quem fez mais com menos */
  /* clube sem head coach no momento não tem quem receber: o prêmio vai para o
     próximo da fila, em vez de ficar sem treinador do ano */
  const fila=t1.map(t=>({t,n:campanha(t.id)+(60-t.prestigio)*0.03})).sort((a,b)=>b.n-a.n);
  for(const tr of fila){
    const t=tr.t,m=membroDe(t,'tecnico');
    const voce=t.id===G.meuTime&&G.manager&&G.manager.papel==='treinador'&&!G.manager.demitido;
    const nome=voce?G.manager.nome:m?m.nome:null;
    if(!nome)continue;
    reg.treinador={nome,timeId:t.id,tag:t.tag,staffId:voce?null:m.id,voce};
    if(m&&!voce)(m.premios=m.premios||[]).push({ano:G.ano,tipo:'treinador',rot:'Treinador do ano'});
    break;
  }

  (G.premios=G.premios||[]).push(reg);
  /* reconhecimento vale vestiário */
  const premiados=new Set([mvp,...usados,rev,igl&&igl.id].filter(Boolean));
  premiados.forEach(id=>{const p=G.jogadores[id];if(p)p.moral=clamp(p.moral+0.05,0.05,1);});

  noticia('🏅 '+reg.mvp.nome+' ('+reg.mvp.tag+') é o MVP de '+G.ano+(reg.mvp.fora?', numa temporada fora da curva':'')+'.',{c:'carreira',p:[reg.mvp.id],t:[reg.mvp.timeId],imp:3});
  const meus=[...premiados].filter(id=>G.jogadores[id].timeId===G.meuTime);
  if(meus.length)noticia('🏅 Prêmios de '+G.ano+' no seu clube: '+
    meus.map(id=>G.jogadores[id].nome).join(', ')+'.',{c:'carreira',p:meus,t:[G.meuTime],imp:2});
  if(reg.treinador&&reg.treinador.voce)noticia('🏅 Você foi eleito o treinador do ano de '+G.ano+'.',{c:'carreira',t:[G.meuTime],imp:3});
  return reg;
}

/* ---------- hall da fama ---------- */
/* Pontos de carreira: prêmio do ano vale mais que título regional, título
   internacional vale mais que qualquer um dos dois. */
function pontosDeLenda(p){
  const c=p.carreira||{};
  const pr=p.premios||[];
  const conta=t=>pr.filter(x=>x.tipo===t).length;
  return conta('mvp')*5+conta('selecao')*2+conta('regional')*1.5+conta('igl')*1.5+conta('revelacao')
        +(c.intl||0)*2+(c.titulos||0)*0.3+(c.mvpTorneios||0)*0.75+Math.floor((c.maps||0)/400);
}
/* Resumo de carreira, usado na ficha e no Hall da Fama. */
function resumoCarreira(p){
  const c=p.carreira||{};
  return{maps:c.maps||0,k:c.k||0,d:c.d||0,a:c.a||0,
    acs:c.maps?Math.round((c.acs||0)/c.maps):0,
    kd:Number(((c.k||0)/Math.max(1,c.d||0)).toFixed(2)),
    mvp:c.mvp||0,titulos:c.titulos||0,intl:c.intl||0,mvpTorneios:c.mvpTorneios||0,
    premios:(p.premios||[]).length};
}
/* Chamada na aposentadoria, antes de o jogador ser apagado. */
function talvezHallDaFama(p){
  const pts=pontosDeLenda(p);
  if(pts<LENDA_CORTE)return null;
  const clubes=[...new Set((p.hist||[]).map(h=>h.time).filter(n=>n&&n!=='Sem clube'))];
  const l={id:p.id,nome:p.nome,pais:p.pais,role:p.role,ano:G.ano,idade:p.idade,
    pico:p.pico||over(p),pontos:Math.round(pts*10)/10,clubes,
    carreira:resumoCarreira(p),premios:(p.premios||[]).map(x=>({ano:x.ano,rot:x.rot}))};
  (G.lendas=G.lendas||[]).push(l);
  noticia('🏛 '+p.nome+' se aposenta e entra para o Hall da Fama.',{c:'carreira',imp:2});
  return l;
}

/* ---------- peso do save ---------- */
/* As temporadas antigas da ficha guardam só o que a tabela de carreira
   mostra. O detalhe (assistências, first kills, clutches) já está somado
   em p.carreira. */
const HIST_DETALHE=5;
function podarHistorico(p){
  const h=p.hist;if(!h||h.length<=HIST_DETALHE)return;
  for(let i=0;i<h.length-HIST_DETALHE;i++){
    const e=h[i];if(e.c)continue;
    h[i]={ano:e.ano,time:e.time,over:e.over,maps:e.maps,k:e.k,d:e.d,mvp:e.mvp,c:1};
  }
}

/* ============================================================
   PÓS-CARREIRA — quem pendura o mouse não some
   ------------------------------------------------------------
   Antes o aposentado era apagado do save (só o Hall da Fama ficava).
   Agora, na aposentadoria, cada jogador com carreira de verdade ganha
   um destino conforme o perfil:

     head coach  liderança alta (ou era o IGL)
     analista    visão de jogo e utilidade altas
     olheiro     carreira longa, qualquer função
     caster      relevância alta (pontosDeLenda), vira voz do circuito
     dono        lenda de verdade, uma a cada várias temporadas: compra
                 um clube da região, de preferência do Tier 2

   Os três primeiros entram no mercado de comissão como membros de
   verdade (core/staff.js), com o nick e a foto de jogador. Quem jogou
   no seu clube lembra dele: pede menos para voltar.

   O destino é sorteado num gerador LOCAL, semeado pelo próprio
   jogador e pelo ano, e o gerador do motor volta intacto. Assim a
   aposentadoria não empurra a sequência de sorteios do circuito.
   ============================================================ */
const POS_MAPAS_MIN=150;          /* abaixo disso a carreira foi curta demais */
const POS_LIDER=72, POS_VISAO=79;
const DONO_PONTOS=10;             /* pontosDeLenda para comprar um clube (o Hall da Fama pede 14) */
const DONO_INTERVALO=3;           /* temporadas mínimas entre dois donos novos */
const CASTERS_MAX=8;
const DESCONTO_EX_CLUBE=0.85;     /* ex-jogador seu pede 15% menos para voltar */

/* gerador local: guarda o estado do motor, sorteia, devolve o estado */
function _hashPos(txt){let h=2166136261;const s=String(txt);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function comSorteioLocal(chave,fn){
  const guarda=_s;srand(_hashPos(chave)||1);
  try{return fn();}finally{_s=guarda;}
}

function regiaoDoJogador(p){
  const R=REGIONS.find(r=>r.paises.includes(p.pais));
  if(R)return R.id;
  const t=p.timeId&&G.times[p.timeId];
  return t?t.regiao:REGIONS[0].id;
}
/* clubes por onde passou, em ids (o histórico guarda nomes) */
function clubesDoJogador(p){
  const ids=new Set();
  for(const h of p.hist||[]){
    const t=typeof acharClubePorNome==='function'?acharClubePorNome(h.time):null;
    if(t)ids.add(t.id);
  }
  if(p.timeId)ids.add(p.timeId);
  return[...ids];
}
function podeTerDono(){
  const ult=(G.donos||[]).slice(-1)[0];
  return !ult||G.ano-ult.ano>=DONO_INTERVALO;
}

/* Qual destino, se algum. Pesos, não regras: o IGL tende a virar coach, mas
   pode virar caster; quem não tem perfil nenhum simplesmente sai de cena. */
function destinoDe(p){
  const c=p.carreira||{},L=typeof pontosDeLenda==='function'?pontosDeLenda(p):0;
  /* carreira de verdade: mapas jogados na carreira ou um pico de elite (o
     veterano que se aposenta nas primeiras temporadas tem poucos mapas no save) */
  if((c.maps||0)<POS_MAPAS_MIN&&(p.pico||0)<80&&L<3)return null;
  const at=p.at||{};
  return comSorteioLocal('pos|'+p.id+'|'+G.ano,()=>{
    if(L>=DONO_PONTOS&&podeTerDono()&&rnd()<0.6)return 'dono';
    const op=[];
    const lider=at.lider||0,leitura=((at.visao||0)+(at.util||0))/2;
    if(lider>=POS_LIDER||p.igl)op.push(['tecnico',1+Math.max(0,lider-POS_LIDER)/8]);
    if(leitura>=POS_VISAO)op.push(['analista',1+Math.max(0,leitura-POS_VISAO)/10]);
    if((c.maps||0)>=350||p.idade>=32)op.push(['olheiro',0.5]);
    if(L>=3||(p.pico||0)>=88)op.push(['caster',0.6+Math.min(1,L/12)]);
    op.push([null,4]);
    const tot=op.reduce((s,x)=>s+x[1],0);
    let r=rnd()*tot;
    for(const[d,w]of op){r-=w;if(r<=0)return d;}
    return null;
  });
}

/* ---------- ex-jogador na comissão ---------- */
function staffDeExJogador(p,cargo){
  const at=p.at||{},c=p.carreira||{};
  const base={tecnico:(at.lider||60)*0.55+(at.visao||60)*0.45,
              analista:(at.visao||60)*0.55+(at.util||60)*0.45,
              olheiro:(at.visao||60)*0.5+(at.consist||60)*0.5}[cargo]||60;
  const pedigree=Math.min(12,(c.intl||0)*3+(c.titulos||0)*0.5);
  const alvo=clamp(Math.round(46+(base-60)*0.6+pedigree),48,84);
  const t=p.timeId&&G.times[p.timeId];
  return comSorteioLocal('staff|'+p.id+'|'+G.ano,()=>{
    const m=criarMembro(cargo,alvo,p.pais,p.idade,nomesStaffUsados(),t?t.tier:2);
    m.nome=p.nome;m.genero='m';m.contrato=0;m.regiaoOrigem=regiaoDoJogador(p);
    /* começa cedo e com teto: o ex-jogador evolui na função */
    m.pot=Math.max(m.pot,Math.min(92,overStaff(m)+8));
    m.ex={id:p.id,nome:p.nome,role:p.role,clubes:clubesDoJogador(p),
      titulos:c.titulos||0,intl:c.intl||0,ano:G.ano,foto:p.foto||null};
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    G.staff[m.id]=m;(G.staffLivres=G.staffLivres||[]).push(m.id);
    return m;
  });
}
/* desconto de quem volta para casa: usado em salarioPedidoStaff */
function voltaParaCasa(m,destino){return !!(m&&m.ex&&destino&&(m.ex.clubes||[]).includes(destino.id));}

/* ---------- dono de clube ---------- */
function comprarClube(p){
  const reg=regiaoDoJogador(p);
  const livre=t=>!t.dono&&t.regiao===reg;
  let cands=Object.values(G.times).filter(t=>livre(t)&&t.tier===2);
  if(!cands.length)cands=Object.values(G.times).filter(t=>livre(t)).sort((a,b)=>a.prestigio-b.prestigio).slice(0,3);
  if(!cands.length)return null;
  const t=comSorteioLocal('dono|'+p.id+'|'+G.ano,()=>pick(cands.sort((a,b)=>a.id<b.id?-1:1)));
  const aporte=Math.round((typeof receitaAnual==='function'?receitaAnual(t):500000)*0.6/1000)*1000;
  t.caixa+=aporte;
  t.torcida=clamp((t.torcida||0)+8,typeof pisoTorcida==='function'?pisoTorcida(t):0,typeof TORCIDA_MAX!=='undefined'?TORCIDA_MAX:100);
  t.prestigio=clamp(t.prestigio+3,20,99);
  t.dono={nome:p.nome,pais:p.pais,desde:G.ano,exId:p.id,aporte};
  (G.donos=G.donos||[]).push({nome:p.nome,timeId:t.id,ano:G.ano});
  noticia('🏢 '+p.nome+' se aposenta e compra o '+t.nome+': aporte de '+money(aporte)+' e o clube vira o projeto dele.',
    {c:'carreira',t:[t.id],imp:3});
  return t;
}

/* ---------- caster ---------- */
function virarCaster(p){
  (G.casters=G.casters||[]).push({nome:p.nome,pais:p.pais,ano:G.ano,role:p.role});
  if(G.casters.length>CASTERS_MAX)G.casters.shift();
  noticia('🎙 '+p.nome+' pendura o mouse e vai para a cabine: agora é caster do circuito.',{c:'carreira',imp:1});
}

/* Chamada na aposentadoria, depois do Hall da Fama e antes de o jogador ser
   apagado. Registra a despedida (a cerimônia mostra as notáveis). */
const ROT_DESTINO={tecnico:'vira head coach',analista:'vira analista',olheiro:'vira olheiro',caster:'vira caster',dono:'compra um clube'};
function posCarreira(p){
  const destino=destinoDe(p);
  let clube=null;
  if(destino==='tecnico'||destino==='analista'||destino==='olheiro'){
    staffDeExJogador(p,destino);
    const meuEx=G.meuTime&&clubesDoJogador(p).includes(G.meuTime);
    noticia('🎓 '+p.nome+' se aposenta e '+ROT_DESTINO[destino]+(meuEx?' — e lembra com carinho do seu clube':'')+'. Está no mercado de comissão.',
      {c:'carreira',imp:meuEx?2:1});
  }else if(destino==='caster')virarCaster(p);
  else if(destino==='dono')clube=comprarClube(p);
  const c=p.carreira||{},L=typeof pontosDeLenda==='function'?pontosDeLenda(p):0;
  const t=p.timeId&&G.times[p.timeId];
  const notavel=L>=4||(p.pico||0)>=86||(G.meuTime&&p.timeId===G.meuTime)||destino==='dono';
  if(notavel)(G._despedidas=G._despedidas||[]).push({id:p.id,nome:p.nome,pais:p.pais,role:p.role,idade:p.idade,
    tag:t?t.tag:((p.hist||[]).slice().reverse().find(h=>h.time&&h.time!=='Sem clube'&&!/^Base/.test(h.time))||{time:'sem clube'}).time,titulos:c.titulos||0,intl:c.intl||0,maps:c.maps||0,pts:Math.round(L*10)/10,
    destino:destino||null,clube:clube?clube.nome:null,meu:!!(G.meuTime&&p.timeId===G.meuTime)});
  return destino;
}

/* ============================================================
   PATROCÍNIO COM METAS — contrato fixo + bônus
   ------------------------------------------------------------
   Antes cada vaga pagava um valor fixo por temporada. Agora o contrato
   tem duas partes, sobre o valor de tabela da vaga (valorContrato):

     FIXO   80% (Challengers 90%) — garantido;
     BÔNUS  até 40% (Challengers 25%) — repartido entre duas ou três
            metas que a marca escolhe pelo próprio perfil.

   Quem cumpre tudo recebe mais do que antes; quem não cumpre nada,
   menos. A marca ADIANTA 45% do bônus ao longo da temporada (perto do
   que as metas pagam na média do circuito) e na virada faz o acerto:
   paga o que faltou ou desconta o que adiantou demais — sem encostar na
   reserva do clube (uma temporada de folha), porque marca nenhuma quebra
   o clube que leva o nome dela. Assim o caixa semana a semana se comporta como antes, e
   o resultado das metas aparece de uma vez, na virada certa.

   O contrato dura uma ou duas temporadas. Rebaixamento ou torcida
   abaixo do piso combinado dão à marca o direito de sair no fim da
   temporada — e ela sai.

   Metas e duração são sorteadas num gerador local (comSorteioLocal,
   core/poscarreira.js): o motor não anda por causa delas.
   ============================================================ */
/* Challengers vive com margem curta: lá o contrato é mais fixo (90% + até
   25%), para um ano ruim de metas não quebrar o clube. */
const PATROC_PARTES={1:{fixo:0.80,bonus:0.40},2:{fixo:0.90,bonus:0.25}};
/* parte do bônus adiantada semana a semana (e a que o planejamento conta) */
const PATROC_ADIANTAMENTO=0.45;
function partesDe(t){return PATROC_PARTES[t.tier]||PATROC_PARTES[1];}
const PATROC_QUEDA_TORCIDA=12;   /* pontos de torcida abaixo do início que liberam a saída */

/* Setor → o que a marca quer ver. Tecnologia quer palco e resultado;
   consumo quer audiência e barulho; corporativo quer resultado e marca. */
const SETOR_TECH=new Set(['Periféricos','Hardware','Computadores','Cadeiras','Áudio','Games','Software','Eletrônicos','Streaming','Nuvem','Plataforma','Telecom']);
const SETOR_CONSUMO=new Set(['Bebida','Energético','Alimentos','Alimentação','Snacks','Doces','Laticínios','Delivery','Varejo','E-commerce','Cosméticos','Vestuário','Esporte','Colecionáveis']);
function pesosDeMetas(mk){
  if(SETOR_TECH.has(mk.setor))return{liga:3,masters:2.5,champions:2,titulo:2,selecao:2,torcida:0.8,classico:0.8,aproveitamento:1.5,playoffs:2};
  if(SETOR_CONSUMO.has(mk.setor))return{liga:1.5,masters:1,champions:1,titulo:1.5,selecao:0.8,torcida:3,classico:2.5,aproveitamento:1,playoffs:1};
  return{liga:2.5,masters:2,champions:1.5,titulo:2.5,selecao:1,torcida:1.6,classico:1,aproveitamento:2,playoffs:1.5};
}

/* Onde o clube "deveria" terminar pela força (prestígio) dentro da liga dele. */
function rankNaLiga(t){
  const liga=Object.values(G.times).filter(x=>x.regiao===t.regiao&&x.tier===t.tier)
    .sort((a,b)=>b.prestigio-a.prestigio||(a.id<b.id?-1:1));
  return{r:liga.indexOf(t)+1,n:liga.length};
}
/* Metas possíveis para este clube, já com o alvo ajustado ao tamanho dele:
   ninguém pede título ao lanterna nem top 8 ao campeão. */
function metasPossiveis(t,mk){
  const{r,n}=rankNaLiga(t);
  const op=[];
  /* no Challengers a força pesa menos (todo mundo tem o mesmo prestígio):
     a meta de posição dá mais folga */
  const topN=t.tier===1?clamp(r<=2?2:r<=4?4:Math.ceil(r*0.75+1),2,Math.max(2,n-2))
                       :clamp(r<=2?3:Math.ceil(r*0.75+2),3,Math.max(3,n-2));
  op.push({tipo:'liga',alvo:topN,txt:'Terminar entre os '+topN+' da liga'});
  if(t.tier===1){
    if(r<=Math.ceil(n*0.6))op.push({tipo:'masters',alvo:1,txt:'Classificar para um Masters'});
    if(r<=Math.ceil(n*0.35))op.push({tipo:'champions',alvo:1,txt:'Chegar ao Champions'});
  }
  const ap=r<=Math.ceil(n/3)?60:r<=Math.ceil(n*2/3)?50:40;
  op.push({tipo:'aproveitamento',alvo:ap,txt:'Vencer '+ap+'% das séries do ano'});
  if(r>2)op.push({tipo:'playoffs',alvo:1,txt:'Chegar aos playoffs de um stage da liga'});
  if(r<=Math.max(3,Math.ceil(n*0.3)))op.push({tipo:'titulo',alvo:1,txt:t.tier===1?'Ganhar um título (liga ou internacional)':'Ganhar um split do Challengers'});
  if(t.tier===1&&r<=Math.ceil(n*0.5))op.push({tipo:'selecao',alvo:1,txt:'Ter um jogador na seleção do ano'});
  const tor=Math.round(t.torcida||0);
  const sobe=t.tier===1?Math.max(3,Math.round(tor*0.08)):Math.max(2,Math.round(tor*0.06));
  op.push({tipo:'torcida',alvo:tor+sobe,ini:tor,txt:'Fazer a torcida chegar a '+(tor+sobe)});
  op.push({tipo:'classico',alvo:1,txt:'Vencer um clássico'});
  /* marca de um país: quer ver gente da casa no elenco */
  if(mk.regiao&&mk.regiao!=='GLOBAL'&&mk.paises&&mk.paises.length){
    const nomes=mk.paises.length<=2&&typeof PAISES!=='undefined'?mk.paises.map(c=>PAISES[c]||c).join(' ou '):'da área da marca';
    op.push({tipo:'regional',alvo:2,paises:mk.paises.slice(),txt:'Manter dois jogadores de '+nomes+' no elenco',peso:3});
  }
  return op;
}
/* metas que as outras marcas do clube já pedem neste ano: cada marca puxa
   para o seu lado, em vez de as três pedirem a mesma coisa */
function metasJaPedidas(t,ano,vagaId){
  const s=new Set();
  for(const v of VAGAS){if(v.id===vagaId)continue;const c=t.contratos&&t.contratos[v.id];
    if(c&&c.ano===ano)for(const m of c.metas||[])s.add(m.tipo);}
  return s;
}
function sortearMetas(t,mk,valor,ano,vagaId){
  const ja=metasJaPedidas(t,ano,vagaId);
  return comSorteioLocal('metas|'+t.id+'|'+mk.id+'|'+ano,()=>{
    const pesos=pesosDeMetas(mk);
    let op=metasPossiveis(t,mk);
    const n=mk.nivel>=3?3:2;
    const escolhidas=[];
    while(escolhidas.length<n&&op.length){
      const w=op.map(m=>(m.peso||pesos[m.tipo]||1)*(ja.has(m.tipo)?0.15:1));
      let x=rnd()*w.reduce((s,v)=>s+v,0),k=0;
      for(;k<op.length-1;k++){x-=w[k];if(x<=0)break;}
      escolhidas.push(op[k]);
      /* masters e champions juntos pedem duas vezes a mesma coisa */
      const tipo=op[k].tipo;
      op=op.filter((m,i)=>i!==k&&!((tipo==='champions'&&m.tipo==='masters')||(tipo==='masters'&&m.tipo==='champions')));
    }
    const pote=Math.round(valor*partesDe(t).bonus/1000)*1000;
    return escolhidas.map(m=>Object.assign({},m,{valor:Math.round(pote/escolhidas.length/1000)*1000}));
  });
}
/* adiantamento do bônus para a temporada: a taxa do próprio clube */
function adiantamentoDe(t,metas){return Math.round((metas||[]).reduce((x,m)=>x+m.valor,0)*PATROC_ADIANTAMENTO/1000)*1000;}
function novoContrato(t,mk,vagaId,ano){
  const valor=valorContrato(mk,t,vagaId);
  const anos=comSorteioLocal('dur|'+t.id+'|'+mk.id+'|'+ano,()=>rnd()<0.5?1:2);
  const tor=Math.round(t.torcida||0);
  return _comAdiantamento(t,{marca:mk.id,vaga:vagaId,valor,fixo:Math.round(valor*partesDe(t).fixo/1000)*1000,de:ano,ate:ano+anos-1,
    torcidaMin:Math.max(typeof pisoTorcida==='function'?pisoTorcida(t):0,tor-PATROC_QUEDA_TORCIDA),
    clausulaRebaixamento:t.tier===1,ano,metas:sortearMetas(t,mk,valor,ano,vagaId),adiant:0});
}
function _comAdiantamento(t,c){c.adiant=adiantamentoDe(t,c.metas);return c;}
/* contrato que segue para mais uma temporada: metas novas, mesmo valor */
function renovarMetas(t,c,ano){
  const mk=marca(c.marca);if(!mk)return;
  c.ano=ano;c.metas=sortearMetas(t,mk,c.valor,ano,c.vaga);_comAdiantamento(t,c);
}
function contratoDe(t,vagaId){
  const c=t.contratos&&t.contratos[vagaId];
  return c&&t.patrocinios&&t.patrocinios[vagaId]===c.marca?c:null;
}

/* ---------- metas: onde estão ---------- */
function _noTorneio(t,re){
  for(const b of G.calendario||[])for(const s of b.stages||[])
    if(re.test(s.torneioId||'')&&((s.times||[]).includes(t.id)||(s.ranking||[]).includes(t.id)))return true;
  return false;
}
/* As vagas do torneio já foram todas definidas? Os blocos só montam os
   stages quando começam, então "fechado" é: todo bloco daquele torneio já
   montou o seu. Antes disso a meta continua em aberto. */
const BLOCOS_DO_TORNEIO={masters:['m1Suico','m1PO','m2Suico','m2PO'],champions:['chGrupos','chPO'],
  playoffs:['kickPO','po1','po2']};
function _torneioFechado(tipo){
  const ms=BLOCOS_DO_TORNEIO[tipo]||[];
  const bs=(G.calendario||[]).filter(b=>ms.includes(b.montar));
  return bs.length>0&&bs.every(b=>(b.stages||[]).length>0);
}
/* {estado:'ok'|'andamento'|'perdida', txt, prog 0..1}. Lê o ano em curso. */
function avaliarMetaPatroc(t,m,final){
  const reg=(G.premios||[]).find(r=>r.ano===G.ano);
  switch(m.tipo){
    case 'liga':{
      const p=typeof posicaoNoAno==='function'?posicaoNoAno(t).pos:posicaoNaLiga(t).pos;
      const ok=p&&p<=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:p?p+'º agora':'—',prog:p?clamp((m.alvo+1-p)/m.alvo+0.5,0,1):0,bom:ok};
    }
    case 'masters':case 'champions':{
      const re=m.tipo==='masters'?/^masters/:/^champions$/;
      if(_noTorneio(t,re))return{estado:'ok',txt:'classificado',prog:1,bom:true};
      const fechado=_torneioFechado(m.tipo);
      return{estado:final||fechado?'perdida':'andamento',txt:fechado||final?'ficou de fora':'em disputa',prog:0};
    }
    case 'aproveitamento':{
      const c=t.temporada||{v:0,d:0},j=c.v+c.d,pct=j?Math.round(c.v/j*100):0,ok=j>=6&&pct>=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:j?pct+'% ('+c.v+'–'+c.d+')':'sem séries',prog:clamp(pct/m.alvo,0,1),bom:ok};
    }
    case 'playoffs':{
      let ok=false;
      for(const b of G.calendario||[])for(const s of b.stages||[]){
        if(s.regiao==='INT'||!(s.tipo==='de'||s.tipo==='ko'))continue;
        if(s.regiao!==t.regiao||s.tier!==t.tier||/^asc/.test(s.id))continue;
        if((s.times||[]).length&&(s.times||[]).length<(G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).length&&(s.times||[]).includes(t.id))ok=true;
      }
      const aberto=!_torneioFechado('playoffs');
      return{estado:ok?'ok':final||!aberto?'perdida':'andamento',txt:ok?'classificado':aberto?'em disputa':'ficou de fora',prog:ok?1:0,bom:ok};
    }
    case 'titulo':{
      const n=(G.historico||[]).filter(h=>h&&h.ano===G.ano&&h.timeId===t.id).length;
      return{estado:n?'ok':final?'perdida':'andamento',txt:n?n+' título'+(n>1?'s':''):'nenhum ainda',prog:n?1:0,bom:!!n};
    }
    case 'selecao':{
      if(!reg)return{estado:final?'perdida':'andamento',txt:'sai na virada',prog:0};
      const ok=(reg.selecao||[]).some(f=>f.timeId===t.id);
      return{estado:ok?'ok':'perdida',txt:ok?'na seleção':'ninguém na seleção',prog:ok?1:0};
    }
    case 'torcida':{
      const v=Math.round(t.torcida||0),ok=v>=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:v+' de '+m.alvo,prog:clamp((v-(m.ini||0))/Math.max(1,m.alvo-(m.ini||0)),0,1),bom:ok};
    }
    case 'classico':{
      const n=t.classicos&&t.classicos.ano===G.ano?t.classicos.n:0;
      return{estado:n?'ok':final?'perdida':'andamento',txt:n?n+' vencido'+(n>1?'s':''):'nenhum ainda',prog:n?1:0,bom:!!n};
    }
    case 'regional':{
      const n=(t.elenco||[]).filter(id=>G.jogadores[id]&&(m.paises||[]).includes(G.jogadores[id].pais)).length;
      return{estado:final?(n>=m.alvo?'ok':'perdida'):'andamento',txt:n+' de '+m.alvo,prog:clamp(n/m.alvo,0,1),bom:n>=m.alvo};
    }
  }
  return{estado:'andamento',txt:'',prog:0};
}

/* ---------- metas cumpridas e acerto ---------- */
/* Na semana em que sai — título, vaga em internacional, playoffs,
   clássico — a meta fica cumprida e a notícia sai na hora; o dinheiro entra
   no acerto da virada. */
const METAS_NA_HORA=new Set(['titulo','masters','champions','classico','playoffs']);
function _registroAno(t){return (t.patrocAno&&t.patrocAno.ano===G.ano)?t.patrocAno:(t.patrocAno={ano:G.ano,bonus:0,ok:0,n:0,acerto:0});}
function pagarMetasDaSemana(){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c||c.ano!==G.ano)continue;
      for(const m of c.metas||[]){
        if(m.pago!=null||!METAS_NA_HORA.has(m.tipo))continue;
        if(avaliarMetaPatroc(t,m,false).estado!=='ok')continue;
        m.pago=m.valor;
        const h=_registroAno(t);h.bonus+=m.valor;h.ok++;h.n++;
        if(t.id===G.meuTime){const mk=marca(c.marca);
          noticia('💼 Meta de patrocínio cumprida: '+m.txt.toLowerCase()+' — '+money(m.valor)+' de '+(mk?mk.nome:'bônus')+' no acerto da virada.',{c:'clube',t:[t.id]});}
      }
    }
  }
}
/* Fase 1 (começo da virada, campanha ainda intacta): confere as metas de
   resultado. Fase 2 (depois da torcida da virada): a meta de torcida e o
   acerto com cada marca. */
function pagarMetasPatrocinio(fase){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    const h=_registroAno(t);
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c||c.ano!==G.ano)continue;
      for(const m of c.metas||[]){
        if(m.pago!=null)continue;
        if(fase===1&&m.tipo==='torcida')continue;
        const a=avaliarMetaPatroc(t,m,true);
        m.pago=a.estado==='ok'?m.valor:0;
        h.bonus+=m.pago;h.n++;if(m.pago)h.ok++;
      }
    }
    if(fase!==2)continue;
    /* acerto: o que as metas pagaram menos o que a marca adiantou. Desconto
       só até onde o caixa alcança — a marca não quebra o clube por isso. */
    let adiant=0;
    for(const v of VAGAS){const c=contratoDe(t,v.id);if(c&&c.ano===G.ano)adiant+=c.adiant||0;}
    let acerto=h.bonus-adiant;
    /* o desconto respeita a reserva do clube (uma temporada de folha): marca
       nenhuma empurra para a crise o clube que leva o nome dela */
    const folga=Math.max(0,t.caixa-(typeof reservaMinima==='function'?reservaMinima(t):0));
    if(acerto<0)acerto=-Math.min(-acerto,folga);
    t.caixa+=acerto;h.acerto=acerto;
    if(t.id===G.meuTime&&h.n)
      noticia('💼 Metas de patrocínio de '+G.ano+': '+h.ok+' de '+h.n+' cumpridas, '+money(h.bonus)+' em bônus. '+
        (acerto>=0?'Acerto com as marcas: +'+money(acerto)+'.':'As marcas descontaram '+money(-acerto)+' do que tinham adiantado.'),{c:'clube',t:[t.id],imp:2});
  }
}
/* Fase 2, depois da torcida: cláusulas de saída. A marca que tem o direito
   sai; o contrato que chegou ao fim também. atribuirPatrocinios preenche. */
function clausulasDeSaida(){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c)continue;
      const caiu=c.clausulaRebaixamento&&(t.tierAno||1)===1&&t.tier===2;
      /* subiu de divisão: o contrato de Challengers não paga uma operação de
         Tier 1, e a marca renegocia — a vaga volta para a mesa na virada */
      if((t.tierAno||t.tier)===2&&t.tier===1&&c.ate>G.ano){c.ate=G.ano;c.saida='acesso';continue;}
      const torcida=(t.torcida||0)<c.torcidaMin;
      if((caiu||torcida)&&c.ate>G.ano){
        c.ate=G.ano;c.saida=caiu?'rebaixamento':'torcida';
        const mk=marca(c.marca);
        if(t.id===G.meuTime)noticia('📉 '+(mk?mk.nome:'O patrocinador')+' usou a cláusula de saída ('+(caiu?'rebaixamento':'torcida abaixo do combinado')+') e deixa o clube no fim da temporada.',{c:'clube',t:[t.id],imp:2});
      }
    }
  }
}
/* aviso para a tela de Finanças: cláusula que pode disparar */
function riscoDeClausula(t,c){
  if(!c)return null;
  if(c.ate<=G.ano)return null;
  if(c.clausulaRebaixamento&&t.tier===1){
    const p=typeof posicaoNoAno==='function'?posicaoNoAno(t):null;
    if(p&&p.pos>=p.de-1&&(t.temporada&&t.temporada.v+t.temporada.d>=4))return 'O clube está na zona de rebaixamento: cair dá à marca o direito de sair.';
  }
  if((t.torcida||0)<c.torcidaMin+4)return 'A torcida está perto do piso do contrato ('+c.torcidaMin+'): abaixo dele a marca pode sair.';
  return null;
}
/* Receita do ano em três cenários, para a tela de Finanças. */
function cenariosPatrocinio(t){
  let fixo=0,atual=0,tudo=0;
  for(const v of VAGAS){
    const c=contratoDe(t,v.id);if(!c)continue;
    fixo+=c.fixo;tudo+=c.fixo;atual+=c.fixo;
    for(const m of c.metas||[]){
      tudo+=m.valor;
      const a=m.pago!=null?{estado:m.pago?'ok':'perdida'}:avaliarMetaPatroc(t,m,false);
      if(a.estado==='ok'||(a.estado==='andamento'&&a.bom))atual+=m.valor;
    }
  }
  return{fixo,atual,tudo};
}

/* ============================================================
   RADAR DAS RANKEDS — como um garoto chega à sua base
   ------------------------------------------------------------
   A base deixou de revelar garoto por sorteio na virada. Agora o seu
   olheiro varre a ladder ranqueada da região toda semana e o radar
   mostra as contas que ele está acompanhando: rank ("Radiante #142"),
   agente principal, idade aproximada e semanas de observação.

   Cada conta começa com o relatório borrado (como o scouting de
   adversário) e fica mais nítida a cada semana: olheiro melhor
   enxerga mais rápido e erra menos o potencial. Quando a leitura
   estiver boa, você convida para uma semana de teste — o teste mostra
   tudo — e decide: entra na base ou é dispensado.

   Os rivais também olham a ladder: uma conta boa que fica muito tempo
   no radar pode ser levada por outro clube. E conta que ninguém chama
   some depois de algumas semanas.

   Só o seu clube tem radar (os clubes da IA seguem com a base
   resumida de offseason.js). Tudo aqui sorteia num gerador local
   (comSorteioLocal): o motor do circuito não anda por causa do radar.
   ============================================================ */
const RADAR_MAX=6;            /* contas acompanhadas ao mesmo tempo */
const RADAR_VIDA=10;          /* semanas até a conta sumir se ninguém chamar */
const RADAR_HIST=8;

function nivelOlheiroDe(t){
  return (t&&t.staff&&t.staff.olheiro)||((typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2);
}
function radarRanked(){return G.radar||(G.radar={contas:[],seq:0,hist:[]});}
function contasAtivas(){return radarRanked().contas.filter(c=>c.estado==='radar'||c.estado==='teste'||c.estado==='decisao');}

/* Rank na ladder, pelo que o garoto realmente é. Os melhores aparecem com a
   posição no Radiante; os outros, no Imortal. */
function rankDaConta(ov,pot,ruido){
  const score=ov*0.4+pot*0.6;
  if(score>=66){
    const pos=clamp(Math.round(700-(score-66)*28+ruido*90),1,1500);
    return{txt:'Radiante #'+pos,ord:pos};
  }
  const div=score>=62?3:score>=58?2:1;
  return{txt:'Imortal '+div,ord:2000+(4-div)*100};
}

function novaConta(t){
  const R=radarRanked();
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  const olh=nivelOlheiroDe(t),acad=(t.estrutura&&t.estrutura.academia)||1;
  const Rg=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
  const paisClube=typeof paisDoClube==='function'?paisDoClube(t):null;
  const pais=paisClube&&rnd()<0.7?paisClube:pick(Rg.paises);
  const role=t.baseFoco&&rnd()<0.7?t.baseFoco:pick(ROLES.filter(r=>r!=='Flex'));
  const ov=clamp(Math.round(gauss(50+acad*1.5+(olh-neutro)*2,5)),42,68);
  /* a maioria é boa de ranked e só; de vez em quando aparece uma joia */
  const joia=rnd()<0.1;
  const pot=clamp(Math.round(ov+ri(10,24)+(joia?ri(6,12):0)+(olh-neutro)),ov+8,96);
  const usados=typeof usadosNomes==='function'?usadosNomes():new Set();
  for(const c of R.contas)usados.add(c.nome);
  const nome=nomeUnico(usados,pais);
  const rk=rankDaConta(ov,pot,gauss(0,1));
  const ag=((typeof AGENTS!=='undefined'&&AGENTS[role])||['—']);
  const c={id:'r'+(++R.seq),nome,pais,role,agente:pick(ag),idade:ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),
    ov,pot,rank:rk.txt,rankOrd:rk.ord,partidas:ri(40,160),obs:0,desde:{ano:G.ano,s:G.semana},estado:'radar'};
  R.contas.push(c);
  return c;
}

/* Quão nítida está a leitura: 0 a 1. */
function precisaoDaConta(c,t){
  if(c.estado==='teste'||c.estado==='decisao')return 1;
  return clamp(c.obs*(0.04+0.025*nivelOlheiroDe(t)),0,0.92);
}
/* O que o relatório mostra: faixa de over e de potencial. O centro da faixa
   erra (olheiro fraco erra mais o potencial), a largura fecha com o tempo. */
function leituraDaConta(c,t){
  const p=precisaoDaConta(c,t);
  if(p>=1)return{p:1,ov:[c.ov,c.ov],pot:[c.pot,c.pot]};
  const olh=nivelOlheiroDe(t);
  const ampO=1+(1-p)*9,ampP=2+(1-p)*14;
  const errP=borrar(c.id+'|pot|'+Math.floor(c.obs/2),(1-p)*8*(1.4-olh*0.18));
  const errO=borrar(c.id+'|ov|'+Math.floor(c.obs/2),(1-p)*5);
  const cO=c.ov+errO,cP=c.pot+errP;
  return{p,ov:[Math.round(cO-ampO),Math.round(cO+ampO)],pot:[Math.round(cP-ampP),Math.min(99,Math.round(cP+ampP))]};
}

function _histRadar(c,txt){
  const R=radarRanked();
  R.hist.unshift({ano:G.ano,s:G.semana,nome:c.nome,pais:c.pais,role:c.role,txt});
  R.hist=R.hist.slice(0,RADAR_HIST);
}

/* Toda semana, depois das partidas. */
function radarSemanal(){
  const t=G.meuTime&&G.times[G.meuTime];
  if(!t)return;
  const R=radarRanked();
  comSorteioLocal('radar|'+G.ano+'|'+G.semana+'|'+R.seq,()=>{
    for(const c of R.contas){
      if(c.estado==='teste'){
        if(G.ano>c.testeAte.ano||G.semana>=c.testeAte.s){c.estado='decisao';
          noticia('🧪 Acabou a semana de teste de '+c.nome+': decida na Base se ele entra na categoria.',{c:'clube',t:[t.id],imp:2});}
        continue;
      }
      if(c.estado!=='radar')continue;
      c.obs++;
      const idade=(G.ano-c.desde.ano)*SEMANAS_ANO+(G.semana-c.desde.s);
      /* rival leva: quanto melhor a conta e mais tempo exposta, maior a chance */
      const chanceRival=c.obs>=2?0.02+Math.max(0,c.pot-78)*0.006:0;
      if(rnd()<chanceRival){
        const rivais=Object.values(G.times).filter(x=>x.regiao===t.regiao&&x.id!==t.id);
        const r=rivais.length?pick(rivais):null;
        c.estado='rival';c.rival=r?r.tag:null;
        _histRadar(c,'foi para a base do '+(r?r.nome:'um rival'));
        noticia('👀 '+c.nome+' ('+c.rank+'), que estava no seu radar, foi chamado para a base do '+(r?r.nome:'um rival')+'.',{c:'clube',t:[t.id].concat(r?[r.id]:[]),imp:1});
        continue;
      }
      if(idade>=RADAR_VIDA){c.estado='sumiu';_histRadar(c,'sumiu da ladder');}
    }
    R.contas=R.contas.filter(c=>c.estado==='radar'||c.estado==='teste'||c.estado==='decisao');
    /* conta nova: olheiro melhor encontra mais */
    const olh=nivelOlheiroDe(t);
    if(contasAtivas().length<RADAR_MAX&&rnd()<0.04+0.025*olh){
      const c=novaConta(t);
      if(c.pot>=84&&precisaoDaConta(c,t)<0.5)
        noticia('📡 O olheiro marcou uma conta nova no radar: '+c.nome+', '+c.rank+'.',{c:'clube',t:[t.id]});
    }
  });
}

/* ---------- ações ---------- */
function convidarParaTeste(id){
  const t=G.meuTime&&G.times[G.meuTime];const c=radarRanked().contas.find(x=>x.id===id);
  if(!t||!c||c.estado!=='radar')return{ok:false,erro:'Essa conta não está mais no radar.'};
  if(radarRanked().contas.some(x=>x.estado==='teste'||x.estado==='decisao'))
    return{ok:false,erro:'Já tem um garoto em teste. Decida sobre ele antes de chamar outro.'};
  if(baseDe(t).length>=vagasDaBase(t))
    return{ok:false,erro:'A categoria está cheia ('+vagasDaBase(t)+' vagas). Promova ou dispense alguém antes.'};
  c.estado='teste';c.testeAte={ano:G.ano,s:G.semana+1};
  return{ok:true,msg:c.nome+' vem treinar com a base nesta semana. No fim dela você decide.'};
}
function aceitarDoTeste(id){
  const t=G.meuTime&&G.times[G.meuTime];const R=radarRanked();const c=R.contas.find(x=>x.id===id);
  if(!t||!c||c.estado!=='decisao')return{ok:false,erro:'Esse teste não está esperando decisão.'};
  if(baseDe(t).length>=vagasDaBase(t))return{ok:false,erro:'A categoria está cheia.'};
  const usados=usadosNomes();
  const p=makePlayer(c.ov,c.role,c.pais,c.idade,usados,t.tier);
  aplicarOver(p,c.ov);
  p.nome=c.nome;p.pot=Math.max(c.pot,over(p)+6);
  p.timeId=null;p.contrato=0;p.salario=0;
  p.base=t.id;p.daCasa=t.id;p.baseDesde=G.ano;p.doRadar={rank:c.rank,agente:c.agente};
  G.jogadores[p.id]=p;(t.base=t.base||[]).push(p.id);
  R.contas=R.contas.filter(x=>x.id!==id);
  _histRadar(c,'entrou na sua base');
  noticia('🌱 '+p.nome+' ('+c.rank+', '+p.role+') passou no teste e entrou na base.',{c:'clube',p:[p.id],t:[t.id],imp:2});
  return{ok:true,msg:p.nome+' está na categoria de base.'};
}
function dispensarDoTeste(id){
  const R=radarRanked();const c=R.contas.find(x=>x.id===id);
  if(!c)return{ok:false,erro:'Conta não encontrada.'};
  R.contas=R.contas.filter(x=>x.id!==id);
  _histRadar(c,c.estado==='radar'?'tirado do radar':'dispensado depois do teste');
  return{ok:true,msg:c.nome+(c.estado==='radar'?' saiu do radar.':' foi dispensado.')};
}

/* ============================================================
   CERIMÔNIA DE ENCERRAMENTO — o que a virada do ano mostra
   ------------------------------------------------------------
   Montada no fim de fimDeTemporada(), depois dos prêmios, das
   aposentadorias e do veredito, e ANTES de o calendário ser remontado
   (é dele que sai a campanha do seu clube torneio a torneio). Fica
   gravada no registro de prêmios do ano (G.premios[...].cer) para ser
   revista na tela de Prêmios, e G.cerimoniaPendente avisa a interface
   que ela abre antes do veredito.

   Só leitura: nada aqui sorteia nem muda o mundo.
   ============================================================ */
function lugarNoTorneio(s,id){
  const i=(s.ranking||[]).indexOf(id);
  if(s.tipo==='de'||s.tipo==='ko'){
    if(i===0)return{txt:'campeão',ord:0};
    if(i===1)return{txt:'vice',ord:1};
    if(i>=2&&i<=3)return{txt:'top 4',ord:2};
    if(i>=4&&i<=7)return{txt:'top 8',ord:3};
    return{txt:'playoffs',ord:4};
  }
  return{txt:i>=0?(i+1)+'º na fase de grupos':'fase de grupos',ord:5};
}
/* a campanha torneio a torneio: o último stage de cada torneio em que o
   clube apareceu diz até onde ele foi */
function campanhaPorTorneio(id){
  const por={},ordem=[];
  for(const b of G.calendario||[])for(const s of b.stages||[]){
    if(!(s.times||[]).includes(id)&&!(s.ranking||[]).includes(id))continue;
    const k=s.torneioId||s.id;
    if(!por[k])ordem.push(k);
    por[k]=s;
  }
  return ordem.map(k=>{const s=por[k],l=lugarNoTorneio(s,id);
    return{ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,lugar:l.txt,ord:l.ord,int:s.regiao==='INT',
      tr:l.ord===0&&s.torneioId&&typeof arquivoTrofeu==='function'?arquivoTrofeu(s.torneioId,G.ano):null};});
}
function maiorVitoriaDe(id){
  let melhor=null;
  for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[]){
    if(r.v!==id)continue;
    const eu=r.a===id,wa=eu?r.wa:r.wb,wb=eu?r.wb:r.wa;
    const rounds=((r.det&&r.det.mp)||[]).reduce((t,m)=>t+(eu?m.a-m.b:m.b-m.a),0);
    const adv=G.times[eu?r.b:r.a];if(!adv)continue;
    const peso=(wa-wb)*100+rounds+(s.regiao==='INT'?60:0)+(s.tipo==='de'||s.tipo==='ko'?25:0)+(adv.elo||1200)/40;
    if(!melhor||peso>melhor.peso)melhor={peso,advId:adv.id,adv:adv.nome,tag:adv.tag,placar:wa+'–'+wb,rounds,
      ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,rd:r.rd||''};
  }
  if(melhor)delete melhor.peso;
  return melhor;
}
function melhorDoClube(id){
  if(typeof lerTemporada!=='function')return null;
  const {jog}=lerTemporada();
  let m=null;
  for(const pid in jog){
    const a=jog[pid],p=G.jogadores[pid];
    if(!p||a.timeId!==id||a.maps<6)continue;
    const n=desempenhoDoAno(a);
    if(!m||n>m.n)m={n,id:pid,nome:p.nome,pais:p.pais,role:p.role,ov:over(p),maps:a.maps,
      acs:Math.round(a.acs/Math.max(1,a.maps)),kd:Number((a.d?a.k/a.d:a.k).toFixed(2)),mvps:a.mvp};
  }
  if(m)delete m.n;
  return m;
}

function montarCerimonia(){
  const reg=(G.premios||[]).find(r=>r.ano===G.ano);
  if(!reg)return null;
  const t=G.meuTime&&G.times[G.meuTime];
  const linha=t&&(t.temporadas||[]).slice(-1)[0];
  const cer={ano:G.ano,
    apres:(G.casters||[]).slice(-2).map(c=>c.nome),
    clube:t?{id:t.id,nome:t.nome,tag:t.tag,linha:linha&&linha.a===G.ano?linha:null,
      torneios:campanhaPorTorneio(t.id),
      graf:(G.eloHist||[]).filter(f=>f.ano===G.ano).map(f=>({s:f.s,p:typeof posicaoNaFoto==='function'?posicaoNaFoto(f,t.id):null})),
      melhor:melhorDoClube(t.id),vitoria:maiorVitoriaDe(t.id)}:null,
    campeoes:(G.historico||[]).filter(h=>h&&h.ano===G.ano&&!h.pre).map(h=>({ev:h.evento,timeId:h.timeId,nome:h.campeao,
      tag:h.timeId&&G.times[h.timeId]?G.times[h.timeId].tag:'',tr:h.trofeu||null,
      int:/^(champions|masters)/.test(h.torneioId||'')})),
    despedidas:(G._despedidas||[]).slice().sort((a,b)=>(b.meu?50:0)+b.pts-((a.meu?50:0)+a.pts)).slice(0,8),
    hall:(G.lendas||[]).filter(l=>l.ano===G.ano).map(l=>({nome:l.nome,pais:l.pais,role:l.role,pontos:l.pontos})),
    donos:(G.donos||[]).filter(d=>d.ano===G.ano)};
  reg.cer=cer;
  G.cerimoniaPendente=G.ano;
  G._despedidas=[];
  return cer;
}

/* ============================================================
   ESTATÍSTICAS DO MUNDO — ranking, temporadas de cada clube e
   recordes
   ------------------------------------------------------------
   Três registros novos, todos determinísticos (não tocam rnd):

   RANKING MUNDIAL (t.elo): rating por resultado de série, como o
   ranking da comunidade. Ganhar de quem está acima vale mais do que
   ganhar de quem está abaixo; internacional pesa 1,5×; série
   apertada mexe menos que atropelo. A cada quatro semanas o jogo
   tira uma foto (G.eloHist), e é ela que mostra a evolução dos
   últimos doze meses.

   TEMPORADAS DO CLUBE (t.temporadas): na virada, cada clube guarda
   uma linha da temporada — posição na liga, campanha, melhor
   resultado internacional, títulos e o cinco que mais jogou. É a
   linha do tempo da tela História.

   RECORDES (G.recordes): o maior over já visto e a maior
   transferência, que não dá para recalcular depois — quem fez o
   recorde pode ter se aposentado e sumido do save.
   ============================================================ */
const ELO_K=20, ELO_INT=1.5, ELO_FOTO_SEMANAS=4, ELO_FOTOS=13;
const TEMPORADAS_GUARDADAS=12, TEMPORADAS_GUARDADAS_MEU=40;

function eloInicial(t){return Math.round(1200+(t.prestigio||50)*5);}
function eloDe(t){if(typeof t.elo!=='number')t.elo=eloInicial(t);return t.elo;}
function atualizarElo(s,res){
  const A=G.times[res.aId],B=G.times[res.bId];if(!A||!B)return;
  const ra=eloDe(A),rb=eloDe(B);
  const esperado=1/(1+Math.pow(10,(rb-ra)/400));
  const ganhouA=res.vencedor===A.id?1:0;
  const margem=1+0.25*Math.max(0,Math.abs((res.wa||0)-(res.wb||0))-1);
  const k=ELO_K*(s&&s.regiao==='INT'?ELO_INT:1)*margem;
  const d=k*(ganhouA-esperado);
  A.elo=Math.round((ra+d)*10)/10;B.elo=Math.round((rb-d)*10)/10;
}
function fotoDoRanking(){
  if((G.semana||1)%ELO_FOTO_SEMANAS)return;
  const v={};
  for(const id in G.times)v[id]=Math.round(eloDe(G.times[id]));
  (G.eloHist=G.eloHist||[]).push({ano:G.ano,s:G.semana,v});
  if(G.eloHist.length>ELO_FOTOS)G.eloHist.shift();
}
function rankingMundial(){
  return Object.values(G.times).slice().sort((a,b)=>eloDe(b)-eloDe(a));
}
/* posição de cada clube numa foto antiga, para a seta de subiu/desceu */
function posicaoNaFoto(foto,id){
  if(!foto)return null;
  const ord=Object.keys(foto.v).sort((a,b)=>foto.v[b]-foto.v[a]);
  const i=ord.indexOf(id);return i<0?null:i+1;
}

/* ---------- temporadas de cada clube ---------- */
/* Melhor campanha internacional do ano, lida dos stages ainda vivos. */
function campanhaInternacional(t){
  const rot={masters1:'Masters',masters2:'Masters',champions:'Champions'};
  let melhor=null;
  for(const b of G.calendario||[])for(const s of b.stages||[]){
    if(s.regiao!=='INT'||!(s.tipo==='de'||s.tipo==='ko'))continue;
    const i=(s.ranking||[]).indexOf(t.id);
    if(i<0)continue;
    const peso=(s.torneioId==='champions'?100:50)-i;
    const lugar=i===0?'campeão':i===1?'vice':i<=3?'top 4':i<=7?'top 8':'playoffs';
    if(!melhor||peso>melhor.peso)melhor={peso,txt:(typeof nomeDoAno==='function'&&nomeDoAno(s.torneioId))||rot[s.torneioId]||'Internacional',lugar};
  }
  if(!melhor){
    /* foi ao internacional e caiu antes dos playoffs */
    for(const b of G.calendario||[])for(const s of b.stages||[])
      if(s.regiao==='INT'&&(s.times||[]).includes(t.id))
        return{txt:(typeof nomeDoAno==='function'&&nomeDoAno(s.torneioId))||'Internacional',lugar:'fase inicial'};
  }
  return melhor;
}
function posicaoNoAno(t){
  const tier=t.tierAno||t.tier;
  const liga=Object.values(G.times).filter(x=>x.regiao===t.regiao&&(x.tierAno||x.tier)===tier);
  const camp=x=>{const c=x.temporada||{v:0,d:0,mv:0,md:0};return[c.v-c.d,(c.mv||0)-(c.md||0)];};
  liga.sort((a,b)=>{const A=camp(a),B=camp(b);return B[0]-A[0]||B[1]-A[1];});
  return{pos:liga.indexOf(t)+1,de:liga.length,tier};
}
function registrarTemporadaDoClube(t){
  const pos=posicaoNoAno(t);
  const intl=campanhaInternacional(t);
  const tecnico=t.id===G.meuTime&&G.manager&&G.manager.nome?G.manager.nome
    :(typeof membroDe==='function'&&membroDe(t,'tecnico')||{}).nome||null;
  const subiu=t.tier<pos.tier,caiu=t.tier>pos.tier;
  const linha={a:G.ano,tier:pos.tier,mov:subiu?'subiu':caiu?'caiu':null,p:pos.pos,de:pos.de,v:(t.temporada||{}).v||0,d:(t.temporada||{}).d||0,
    i:intl?intl.txt+' · '+intl.lugar:null,
    t:(t.titulos||[]).filter(x=>parseInt(x)===G.ano).map(x=>x.split(' · ').slice(1).join(' · ')),
    e:(t.titulares||[]).map(id=>G.jogadores[id]&&G.jogadores[id].nome).filter(Boolean),
    c:tecnico,elo:Math.round(eloDe(t))};
  (t.temporadas=t.temporadas||[]).push(linha);
  const max=t.id===G.meuTime?TEMPORADAS_GUARDADAS_MEU:TEMPORADAS_GUARDADAS;
  if(t.temporadas.length>max)t.temporadas.splice(0,t.temporadas.length-max);
}

/* ---------- recordes ---------- */
function recordes(){return G.recordes||(G.recordes={});}
function conferirRecordeOver(){
  const r=recordes();
  for(const id in G.jogadores){
    const p=G.jogadores[id],o=over(p);
    if(!r.over||o>r.over.v)r.over={v:o,nome:p.nome,ano:G.ano,time:p.timeId?G.times[p.timeId].tag:'—'};
  }
}
function conferirRecordeTransferencia(p,origem,dest,taxa){
  if(!taxa)return;
  const r=recordes();
  if(!r.transferencia||taxa>r.transferencia.v)
    r.transferencia={v:taxa,nome:p.nome,ano:G.ano,de:origem?origem.tag:'livre',para:dest.tag};
}

/* ============================================================
   CARTAS DO JOGADOR — a moldura muda com a faixa de over
   ------------------------------------------------------------
   Quatro cartas, uma por faixa. A faixa sai sempre do over da
   hora (over(p)), então a carta nunca fica desatualizada: o que
   este arquivo guarda é só a ÚLTIMA faixa que o seu clube viu
   (p.carta), para avisar quando um jogador seu sobe de carta.

     Recruta       0–70   aço escovado, grafite
     Profissional 71–80   metal azul com neon
     Elite        81–90   ouro e preto
     Lenda        91–99   ouro e vermelho

   Os cortes batem com o mundo inicial: ~100 recrutas, ~230
   profissionais, ~185 elites e só uma dúzia de lendas.
   Nada aqui toca o DOM; o desenho mora em src/ui/cartas.js.
   ============================================================ */
const CARTAS=[
  {id:'recruta',     nome:'Recruta',      min:0,  max:70},
  {id:'profissional',nome:'Profissional', min:71, max:80},
  {id:'elite',       nome:'Elite',        min:81, max:90},
  {id:'lenda',       nome:'Lenda',        min:91, max:100}
];
function indiceCarta(o){
  for(let i=CARTAS.length-1;i>0;i--)if(o>=CARTAS[i].min)return i;
  return 0;
}
function cartaDe(p){return CARTAS[indiceCarta(over(p))];}

/* Roda no fim da semana, depois de desenvolver(), só para o seu clube.
   Primeira vez que vê o jogador: só anota, sem festa (é a carta que ele já
   tinha). Subiu: notícia e entra na fila da revelação, que a interface abre
   na próxima brecha. Caiu: a carta na tela troca sozinha (ela sai do over); a anotação só
   desce depois de 3 pontos abaixo do corte, para quem oscila entre 80 e 81
   não ganhar festa toda semana. */
function conferirCartas(t){
  if(!t||t.id!==G.meuTime)return;
  if(!G.cartasNovas)G.cartasNovas=[];
  for(const pid of t.elenco){
    const p=G.jogadores[pid];if(!p)continue;
    const agora=indiceCarta(over(p));
    /* p.cartaT: de que clube é a anotação. Quem saiu e voltou melhor não
       ganha festa atrasada. */
    if(p.carta==null||p.cartaT!==t.id){p.carta=agora;p.cartaT=t.id;continue;}
    if(agora>p.carta){
      const de=p.carta;p.carta=agora;
      noticia('🃏 '+p.nome+' subiu para a carta '+CARTAS[agora].nome+' ('+over(p)+' de over).',
        {c:'clube',p:[p.id],t:[t.id],imp:agora>=3?3:2});
      /* um jogador só aparece uma vez na fila, com a carta mais alta */
      const ja=G.cartasNovas.find(x=>x.pid===p.id);
      if(ja)ja.para=agora;else G.cartasNovas.push({pid:p.id,de,para:agora});
    }else if(agora<p.carta&&over(p)<=CARTAS[p.carta].min-3)p.carta=agora;
  }
}

/* ============================================================
   CATEGORIA DE BASE
   ------------------------------------------------------------
   A academia era uma chance por temporada de aparecer alguém
   pronto no elenco, e uma lista. Agora o seu clube tem garotos
   de verdade, fora do elenco principal, que crescem conforme a
   academia e o head coach, e cada um pede uma decisão: promover
   para o elenco ou dispensar. Quem chega aos 20 sem ser
   promovido sai para o mercado.

   A categoria existe para o clube que você comanda. Os clubes da
   IA continuam com a versão resumida (uma chance de revelar
   quando falta gente, em offseason.js): dar base de verdade a 80
   clubes punha 300 garotos a mais no save e na simulação sem
   ninguém olhando para eles.

   Sorteio só na revelação, que é parte da virada do ano. O resto
   (crescer, promover, dispensar, mudar o foco) não toca o
   gerador do motor.
   ============================================================ */

const BASE_IDADE_SAI=20;
/* Custo semanal de cada garoto, somado ao custeio do clube. */
const BASE_CUSTO_SEMANA=200;
/* Base mais rara: um garoto quando você assume o clube, e de 2 a 4 vagas
   (a academia abre uma a cada dois níveis). O resto chega pelo radar das
   rankeds (core/radar.js), um de cada vez e por escolha sua. */
const BASE_INICIAL=1;

function vagasDaBase(t){return 2+Math.floor((((t.estrutura&&t.estrutura.academia)||1)-1)/2);}
function baseDe(t){return ((t&&t.base)||[]).map(id=>G.jogadores[id]).filter(Boolean);}
function custoDaBase(t){return ((t&&t.base)||[]).length*BASE_CUSTO_SEMANA;}

/* Um garoto novo na categoria. O olheiro procura a função do foco, se
   houver; a academia e o olheiro mexem no nível e no teto. */
function revelarUm(t,usados){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  const olh=(t.staff&&t.staff.olheiro)||neutro;
  const acad=(t.estrutura&&t.estrutura.academia)||1;
  /* Garoto de 15 ou 16 anos: na régua do agente livre gerado (60), um pouco
     acima com academia e olheiro bons. É projeto de três ou quatro anos. */
  const alvo=clamp(Math.round(gauss(52+acad*2+(olh-neutro)*2+(t.tier===1?2:0),4)),45,70);
  const role=t.baseFoco||pick(ROLES);
  const p=makePlayer(alvo,role,paisDaBase(t),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
  aplicarOver(p,alvo);
  p.pot=clamp(Math.round(over(p)+ri(14,28)+acad+(olh-neutro)),over(p)+10,96);
  p.timeId=null;p.contrato=0;p.salario=0;
  p.base=t.id;p.daCasa=t.id;p.baseDesde=G.ano;
  G.jogadores[p.id]=p;
  (t.base=t.base||[]).push(p.id);
  return p;
}
/* A base só revela garoto do país do clube. O sorteio de país continua
   acontecendo (e é descartado) para não deslocar o gerador do resto da
   virada; clube sem país conhecido usa o sorteado da região. */
function paisDaBase(t){
  const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
  const sorteado=pick(R.paises);
  return (typeof paisDoClube==='function'&&paisDoClube(t))||sorteado;
}
function usadosNomes(){return new Set(Object.values(G.jogadores).map(p=>p.nome));}

/* Primeira leva, quando você assume o clube. */
function iniciarBase(t){
  if(!t||t.base)return;
  t.base=[];
  const usados=usadosNomes();
  for(let i=0;i<BASE_INICIAL;i++)revelarUm(t,usados);
}

/* Virada do ano, depois do aniversário: quem fez 20 sai, e a academia revela
   a turma nova. */
function virarBase(usados){
  for(const id in G.times){
    const t=G.times[id];
    if(!t.base||!t.base.length)continue;
    for(const p of baseDe(t)){
      if(p.idade<BASE_IDADE_SAI)continue;
      sairDaBase(t,p);G.livres.push(p.id);
      if(t.id===G.meuTime)noticia('🎓 '+p.nome+' fez '+p.idade+' anos sem ser promovido e deixou a base.',{c:'clube',p:[p.id],t:[t.id]});
    }
  }
  /* A turma nova não cai mais do céu na virada: ela vem do radar das
     rankeds, ao longo do ano (core/radar.js). */
  const t=G.meuTime&&G.times[G.meuTime];
  if(t&&!t.base)t.base=[];
  return 0;
}

function sairDaBase(t,p){
  t.base=(t.base||[]).filter(x=>x!==p.id);
  delete p.base;
}

/* Cresce toda semana, sem jogar: academia e head coach no lugar dos minutos.
   O progresso acumula em fração e vira ponto de over quando passa de 1. */
function crescerNaBase(p,t){
  const o=over(p),gap=p.pot-o;
  if(gap<=0)return;
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  const acad=(t.estrutura&&t.estrutura.academia)||1;
  const tec=(t.staff&&t.staff.tecnico)||neutro;
  /* calibrado para uns 6 pontos por ano com academia 3 e 25 de folga até o
     potencial: o garoto de 60 chega perto de 80 aos 19 */
  const taxa=p.idade<=17?0.006:0.0045;
  p.baseProg=(p.baseProg||0)+gap*taxa*(0.5+acad*0.1+(tec-neutro)*0.05);
  if(p.baseProg>=1){
    const sobe=Math.floor(p.baseProg);
    p.baseProg-=sobe;
    aplicarOver(p,Math.min(p.pot,o+sobe));
    p.salario=0;
  }
}

function promoverDaBase(t,id){
  const p=G.jogadores[id];
  if(!p||p.base!==t.id)return{ok:false,msg:'Esse jogador não está na sua base.'};
  if(t.elenco.length>=9)return{ok:false,msg:'O elenco já tem nove jogadores. Libere uma vaga antes de promover.'};
  sairDaBase(t,p);
  p.timeId=t.id;t.elenco.push(p.id);
  p.contrato=3;p.salario=salario(p,t);p.valor=valor(p);
  p.moral=clamp(p.moral+0.08,0.05,1);
  noticia('⭐ '+p.nome+' sobe da base para o elenco de '+t.nome+' ('+p.role+', pot. '+p.pot+').',{c:'clube',p:[p.id],t:[t.id]});
  return{ok:true,msg:p.nome+' agora é do elenco principal, com contrato de 3 anos.'};
}

function dispensarDaBase(t,id){
  const p=G.jogadores[id];
  if(!p||p.base!==t.id)return{ok:false,msg:'Esse jogador não está na sua base.'};
  sairDaBase(t,p);
  p.contrato=0;G.livres.push(p.id);
  noticia(p.nome+' foi dispensado da base de '+t.nome+'.',{c:'clube',p:[p.id],t:[t.id]});
  return{ok:true,msg:p.nome+' foi dispensado e está no mercado.'};
}

function definirFocoBase(t,role){
  t.baseFoco=role&&ROLES.includes(role)?role:null;
}

/* Quem saiu da sua base e onde está hoje. */
function reveladosPelaCasa(t){
  return Object.values(G.jogadores).filter(p=>p.daCasa===t.id&&p.base!==t.id)
    .sort((a,b)=>over(b)-over(a));
}

/* ============================================================
   PARSER DA PÁGINA DE TIME DO VLR.GG
   ------------------------------------------------------------
   Colar a página de um time e sair com as linhas do importador.

   A regra que orienta tudo aqui: NÃO INVENTAR. A página do vlr
   traz nick, nome real e — se você colar o HTML — a bandeira do
   país. Ela NÃO traz função nem over: isso não existe lá. Então o
   parser devolve esses campos vazios e avisa, em vez de preencher
   com um palpite que depois viraria dado.

   Três formas de colar, porque cada navegador entrega uma coisa:

     1. Ctrl+A / Ctrl+C na página  → texto, uma célula por linha
     2. selecionar só o elenco     → texto com 'nick — Nome Real'
     3. copiar o HTML do elemento  → aí vem também o país

   Só o caso 3 tem país. Nos outros dois o campo sai vazio e o
   importador usa a região do clube, como sempre fez.
   ============================================================ */

/* Rótulos de comissão que aparecem na página. Servem para separar quem é
   jogador de quem é staff — não para adivinhar cargo, que o jogo tem os seus. */
const VLR_ROTULOS_STAFF=['head coach','assistant coach','coach','manager','analyst',
                         'analista','tecnico','técnico','owner','director','staff'];
/* Marcações que o vlr põe ao lado do nick e que não fazem parte do nome. */
const VLR_MARCAS=['(inactive)','(stand-in)','(sub)','(substitute)','(loan)','(trial)',
                  '(inativo)','(reserva)','(captain)','(igl)'];

/* Separa o rótulo entre parênteses do resto: 'Fulano (head coach)' vira
   {texto:'Fulano', rotulo:'head coach'}. Sem isso o parêntese entrava no nome,
   a linha deixava de parecer nome de pessoa, e o head coach era DESCARTADO em
   silêncio — nem jogador, nem comissão, nem aviso. */
function _vlrSepararRotulo(x){
  const s=String(x||'').trim();
  const m=s.match(/^(.*?)\s*\(([^()]{2,40})\)\s*$/);
  return m?{texto:_vlrLimpo(m[1]),rotulo:m[2].trim()}:{texto:_vlrLimpo(s),rotulo:''};
}
function _vlrLimpo(x){
  let s=String(x||'').replace(/ /g,' ').trim();
  for(const m of VLR_MARCAS)s=s.replace(new RegExp(m.replace(/[()]/g,'\\$&'),'ig'),'');
  return s.replace(/\s+/g,' ').trim();
}
function _vlrEhStaff(linha){
  const l=String(linha||'').toLowerCase();
  return VLR_ROTULOS_STAFF.some(r=>l.includes(r));
}
/* Nome real: duas ou mais palavras. Nick: uma palavra, ou algo com dígito,
   símbolo ou caixa irregular. Não é infalível — por isso existe a prévia. */
function _vlrPareceNome(x){
  const s=_vlrLimpo(x);
  if(!s||s.length<4)return false;
  /* Caixa alta inteira é título de seção, não nome de pessoa. Sem esta linha,
     'CLASSIFICAÇÃO' + 'RANKING MUNDIAL' virava um jogador chamado
     CLASSIFICAÇÃO — o parser lia o cabeçalho da página como elenco. */
  if(s===s.toUpperCase()&&/[A-ZÀ-Ý]/.test(s))return false;
  const palavras=s.split(' ').filter(Boolean);
  if(palavras.length<2)return false;
  if(palavras.length>6)return false;   /* frase, não nome */
  return palavras.every(p=>/^[A-Za-zÀ-ÿ'.-]+$/.test(p))
      && palavras.some(p=>/^[A-ZÀ-Ý]/.test(p));   /* ao menos uma inicial maiúscula */
}

/* País a partir do HTML. O vlr marca a bandeira com uma classe terminada no
   código do país; outras bibliotecas usam formatos parecidos. Aceitamos
   qualquer um deles, mas SÓ se o código existir na lista de países do jogo —
   assim uma classe qualquer não vira nacionalidade por acidente. */
function _vlrPaisDe(trecho){
  const padroes=[/\bmod-([a-z]{2})\b/i,/\bflag-([a-z]{2})\b/i,/\bfi-([a-z]{2})\b/i,
                 /\bcountry-([a-z]{2})\b/i];
  for(const p of padroes){
    const m=String(trecho||'').match(p);
    if(!m)continue;
    const pais=m[1].toUpperCase();
    if(typeof PAISES==='undefined'||!PAISES||PAISES[pais])return pais;
  }
  return '';
}

/* ---------- extração ---------- */
function _vlrDoHTML(html){
  const achados=[];
  /* Cada entrada de elenco no vlr é um bloco de link com o nick em destaque e o
     nome real logo abaixo. Em vez de depender de uma classe específica — que
     muda quando o site muda —, fatiamos por âncora de jogador e lemos o texto. */
  const blocos=String(html).split(/<a\b/i).slice(1);
  for(const bruto of blocos){
    const bloco='<a'+bruto;
    if(!/\/player\//i.test(bloco))continue;
    const texto=bloco.replace(/<[^>]*>/g,'\n');
    const partes=texto.split('\n').map(_vlrLimpo).filter(Boolean);
    if(!partes.length)continue;
    const nick=partes[0];
    const nome=partes.slice(1).find(_vlrPareceNome)||'';
    const staff=_vlrEhStaff(bloco.replace(/<[^>]*>/g,' '));
    achados.push({nick,nome,pais:_vlrPaisDe(bloco),staff});
  }
  return achados;
}

function _vlrDoTexto(texto){
  const linhas=String(texto).split(/\r?\n/).map(_vlrLimpo);
  const achados=[];
  for(let i=0;i<linhas.length;i++){
    const l=linhas[i];
    if(!l)continue;
    /* forma 'nick — Nome Real', com travessão, hífen ou barra vertical.
       O rótulo entre parênteses sai antes de julgar o formato do nome. */
    const sep=l.match(/^(.+?)\s*[—–\-|]\s*(.+)$/);
    if(sep){
      const esq=_vlrSepararRotulo(sep[1]), dir=_vlrSepararRotulo(sep[2]);
      if(_vlrPareceNome(dir.texto)&&!_vlrPareceNome(esq.texto)){
        achados.push({nick:esq.texto,nome:dir.texto,pais:'',
                      rotulo:dir.rotulo||esq.rotulo||'',
                      staff:_vlrEhStaff(dir.rotulo||esq.rotulo||l)});
        continue;
      }
    }
    /* forma de duas linhas: nick numa, nome real na seguinte */
    const prox=_vlrSepararRotulo(linhas[i+1]||'');
    if(!_vlrPareceNome(l)&&_vlrPareceNome(prox.texto)){
      const contexto=l+' '+(linhas[i+1]||'')+' '+(linhas[i+2]||'');
      achados.push({nick:_vlrSepararRotulo(l).texto,nome:prox.texto,pais:'',
                    rotulo:prox.rotulo||'',staff:_vlrEhStaff(contexto)});
      i++;continue;
    }
    /* nick sozinho: só aceita se não parecer título de seção nem rótulo */
    if(!_vlrPareceNome(l)&&l.length<=20&&!/^[A-ZÀ-Ý\s]{6,}$/.test(l)
       &&!_vlrEhStaff(l)&&!/^\d+$/.test(l))
      achados.push({nick:l,nome:'',pais:'',staff:false});
  }
  return achados;
}

/* ---------- entrada única ---------- */
/* Devolve tudo o que entendeu MAIS o que não entendeu. A prévia é a peça
   central deste recurso: uma página colada errada não pode virar elenco sem
   você ver antes. */
function parsearVlr(texto,tag){
  const bruto=String(texto||'').trim();
  if(!bruto)return{ok:false,erro:'Cole a página do time primeiro.'};
  const html=/<\w+[\s>]/.test(bruto);
  const achados=html?_vlrDoHTML(bruto):_vlrDoTexto(bruto);

  const vistos=new Set();
  const jogadores=[],staff=[],avisos=[];
  for(const a of achados){
    if(!a.nick||a.nick.length>24)continue;
    const k=a.nick.toLowerCase();
    if(vistos.has(k))continue;
    vistos.add(k);
    (a.staff?staff:jogadores).push(a);
  }
  if(!jogadores.length)
    return{ok:false,erro:html?'Não achei nenhum jogador no HTML colado. Confira se copiou o bloco do elenco.'
                            :'Não achei nenhum jogador no texto colado. Tente selecionar só a área do elenco, ou cole o HTML.'};

  if(!html)avisos.push('Colagem em texto: a bandeira do país não vem junto. '+
                       'Para trazer o país também, copie o HTML do elemento.');
  const semPais=jogadores.filter(j=>!j.pais).length;
  if(html&&semPais)avisos.push(semPais+' jogador(es) sem país reconhecido no HTML.');
  avisos.push('O vlr não publica função nem over — esses campos saem vazios. '+
              'O importador vai assumir Flex e o over do prestígio do clube; '+
              'ajuste antes de importar, ou depois na aba Jogadores.');
  if(jogadores.length>9)
    avisos.push(jogadores.length+' jogadores encontrados, e o elenco comporta 9. '+
                'Provavelmente entraram inativos ou ex-jogadores — revise a lista.');
  if(staff.length)
    avisos.push(staff.length+' pessoa(s) de comissão foram separadas e NÃO entram nas linhas: '+
                staff.map(s=>s.nick).join(', ')+'. A comissão tem aba própria.');

  const tagUso=String(tag||'').trim()||'TAG';
  const linhas=jogadores.map(j=>[tagUso,j.nick,'','','','',j.pais].join(' | ')
    .replace(/\s+\|\s+$/,' | '));
  return{ok:true,formato:html?'html':'texto',jogadores,staff,avisos,
         linhas:linhas.join('\n')};
}

/* ============================================================
   NARRAÇÃO DE ROUND
   ------------------------------------------------------------
   Transforma o registro cru de um round numa frase, e diz o
   quanto aquele round PESA. O peso é o que dá ritmo à tela ao
   vivo: round comum passa rápido, match point respira.

   Fica no core, sem DOM, por dois motivos: dá para testar a
   frase, e a mesma narração serve para a tela ao vivo e para o
   resumo escrito da partida.
   ============================================================ */

/* Peso de 0 a 1. É o que a tela usa para decidir quanto tempo segurar. */
function pesoDoRound(h,ctx){
  let p=0.25;
  if(h.pistol)p+=0.30;
  const a=h.sa,b=h.sb;
  const meu=ctx.souA?a:b, dele=ctx.souA?b:a;
  /* match point dos dois lados, e a virada no fio */
  if(meu>=12||dele>=12)p+=0.30;
  if(Math.abs(a-b)<=1&&(a+b)>=16)p+=0.20;
  if(h.clutch)p+=0.35;
  if(h.sobrou===0)p+=0.10;          /* round trocado inteiro */
  if(h.r===13)p+=0.15;              /* troca de lado */
  if(h.r>24)p+=0.30;                /* prorrogação */
  if(ctx.streak>=4)p+=0.20;         /* sequência longa */
  if(ctx.ultimo)p+=0.35;            /* o round que fecha o mapa segura mais */
  return clamp(p,0,1);
}

/* Nome curto para caber na linha. */
function _nn(id){const p=G.jogadores[id];return p?p.nome:'—';}

/* A frase. Varia com o que de fato aconteceu, e nunca afirma o que o registro
   não guarda — se não houve primeira morte registrada, a frase não inventa uma. */
/* Escolha determinística de variante. NÃO usa rnd(): o gerador é o do motor,
   semeado, e chamá-lo daqui adiantaria o fluxo e mudaria a simulação seguinte.
   Uma narração cosmética não pode alterar o jogo. */
function _variante(lista,semente){
  return lista[Math.abs(semente)%lista.length];
}
function narrarRound(h,ctx){
  const vencedorMeu=ctx.souA?h.v:!h.v;
  const nomeV=vencedorMeu?ctx.meuTag:ctx.advTag;
  const lado=(ctx.souA?h.lado:(h.lado==='atk'?'def':'atk'));
  const partes=[];
  const sem=h.r*7+h.sa*3+h.sb;

  if(h.pistol)partes.push('Pistol');
  else if(h.r===13)partes.push('Troca de lado');
  else if(h.r===25)partes.push('Prorrogação');

  /* A abertura vem primeiro quando existe: um nome próprio prende muito mais
     que "round do SEN", e antes ela era engolida pelos casos genéricos. */
  const abertura=h.fk?_nn(h.fk)+' abriu em cima de '+_nn(h.fd):'';
  const placarNome=nomeV;

  if(h.clutch){
    partes.push(_variante([
      _nn(h.clutch)+' segurou sozinho — round do '+placarNome,
      _nn(h.clutch)+' resolveu em desvantagem para o '+placarNome,
      'Clutch de '+_nn(h.clutch)+', '+placarNome+' rouba o round'],sem));
  }else if(abertura&&h.sobrou>=4){
    partes.push(abertura+' e o '+placarNome+' passou limpo');
  }else if(abertura&&h.sobrou===0){
    partes.push(abertura+', mas o round foi trocado inteiro — '+placarNome);
  }else if(abertura){
    partes.push(abertura+' · round do '+placarNome);
  }else if(h.sobrou>=4){
    partes.push(_variante([
      placarNome+' passou sem perder ninguém',
      placarNome+' fechou sem baixas',
      'Round limpo do '+placarNome],sem));
  }else if(h.sobrou===0){
    partes.push(placarNome+' vence trocando o round inteiro');
  }else{
    partes.push(_variante([
      'Round do '+placarNome,
      placarNome+' leva',
      placarNome+' converte'],sem));
  }

  /* como acabou, quando não foi eliminação (o registro guarda) */
  if(h.como==='spike')partes.push('spike explodiu');
  else if(h.como==='defuse')partes.push('spike desarmado');
  else if(h.como==='tempo')partes.push('no tempo');
  const ecoPerdedor=vencedorMeu?(ctx.souA?h.ecoB:h.ecoA):(ctx.souA?h.ecoA:h.ecoB);
  if(!h.pistol&&ecoPerdedor===0)partes.push('em eco');
  if(!h.pistol&&ctx.streak>=4)partes.push(ctx.streak+' seguidos');

  const meu=ctx.souA?h.sa:h.sb, dele=ctx.souA?h.sb:h.sa;
  /* Chegar a 13 NÃO encerra o mapa: com um round de diferença o jogo segue, e
     em prorrogação o placar passa de 13. Quem sabe que acabou é a posição na
     lista, não o número — anunciar por número dava "mapa deles" no 12–13 e o
     mapa continuava até 14. */
  if(ctx.ultimo)partes.push(meu>dele?'MAPA SEU':'mapa deles');
  else if(meu>=12&&dele>=12)partes.push(meu+'–'+dele);
  else if(meu>=12)partes.push('match point');
  else if(dele>=12)partes.push('match point contra');

  return{texto:partes.join(' · '),meu:vencedorMeu,lado,
         placar:{meu,dele},peso:pesoDoRound(h,ctx),
         /* para a tela: quem abriu o round, como acabou, se foi pistol/clutch */
         fk:h.fk||null,como:h.como||'elim',pistol:!!h.pistol,clutch:h.clutch||null,streak:ctx.streak||0};
}

/* Percorre o mapa inteiro e devolve a sequência já narrada, com o contexto
   acumulado (sequências de vitória) que a frase sozinha não teria. */
function narrarMapa(mapa,souA,meuTag,advTag){
  const out=[];let streak=0,ultimo=null;
  const lista=mapa.hist||[];
  lista.forEach((h,i)=>{
    const vencedorMeu=souA?h.v:!h.v;
    if(ultimo===vencedorMeu)streak++;else streak=1;
    ultimo=vencedorMeu;
    out.push(narrarRound(h,{souA,meuTag,advTag,streak,ultimo:i===lista.length-1}));
  });
  return out;
}

/* Frase de fechamento do mapa, para a tela não terminar no vazio. */
function narrarFimDeMapa(mapa,souA,meuTag,advTag){
  const meu=souA?mapa.sa:mapa.sb, dele=souA?mapa.sb:mapa.sa;
  const dif=meu-dele;
  if(dif>0){
    if(dif>=9)return{texto:meuTag+' atropelou em '+mapa.mapa+', '+meu+'–'+dele,tom:'bom'};
    if(dif<=2)return{texto:meuTag+' sobreviveu em '+mapa.mapa+', '+meu+'–'+dele,tom:'bom'};
    return{texto:meuTag+' fechou '+mapa.mapa+' em '+meu+'–'+dele,tom:'bom'};
  }
  if(dif===0)return{texto:'Empate técnico em '+mapa.mapa,tom:'neutro'};
  if(dif<=-9)return{texto:advTag+' atropelou em '+mapa.mapa+', '+dele+'–'+meu,tom:'ruim'};
  if(dif>=-2)return{texto:'Escapou por pouco: '+advTag+' leva '+mapa.mapa+' por '+dele+'–'+meu,tom:'ruim'};
  return{texto:advTag+' leva '+mapa.mapa+' em '+dele+'–'+meu,tom:'ruim'};
}

/* ============================================================
   O MANAGER: PAPEL, METAS E DEMISSÃO
   ------------------------------------------------------------
   Duas maneiras de jogar, e a diferença não é cosmética:

     TREINADOR  responde à diretoria. Recebe metas no começo de
                cada temporada, é avaliado no fim, e pode ser
                demitido. É o modo com consequência.

     DIRETORIA  não responde a ninguém. Sem meta, sem cobrança,
                sem demissão. É o modo livre — quem manda é você,
                e não existe alguém acima para cobrar.

   As metas são de propósito SIMPLES: posição na liga e um alvo
   de bônus. Meta complicada vira planilha, e ninguém joga um
   manager para conferir planilha.
   ============================================================ */

const PAPEIS=[
  {id:'treinador',nome:'Treinador',
   resumo:'A diretoria define metas todo ano e cobra no fim da temporada. Falhar seguido custa o emprego.',
   detalhe:'Modo com consequência: existe alguém acima de você.'},
  {id:'diretoria',nome:'Diretoria',
   resumo:'Sem metas e sem cobrança. Você responde a você mesmo e conduz o clube como quiser.',
   detalhe:'Modo livre: ninguém te demite.'}
];
function papelAtual(){return (G.manager&&G.manager.papel)||'diretoria';}
function souTreinador(){return papelAtual()==='treinador';}

/* Trajetória do treinador: começar no topo ou subir trabalhando. */
const MODOS_TREINADOR=[
  {id:'carreira',nome:'Do zero',resumo:'Começa como um coach comum da divisão e evolui com resultados, títulos e anos de trabalho, até poder chegar ao topo do mundo.',over:{1:80,2:64},pot:97},
  {id:'lenda',nome:'Lenda',resumo:'Já começa entre os melhores do mundo. O elenco rende mais desde a primeira semana, mas o salário pesa na folha e há pouco para evoluir.',over:{1:94,2:94},pot:99}
];
/* Estilo: puxa um atributo da comissão para cima e outro um pouco para baixo,
   sem mudar o over — muda o PERFIL, como a função de um jogador. */
const ESTILOS_TREINADOR=[
  {id:'estrategista',nome:'Estrategista',desc:'Leitura de jogo e preparação de mapa.',mais:'visao',menos:'gestao'},
  {id:'tecnico',nome:'Técnico',desc:'Mecânica, execução e evolução individual.',mais:'tecnica',menos:'disciplina'},
  {id:'motivador',nome:'Motivador',desc:'Vestiário unido e cabeça no lugar.',mais:'gestao',menos:'tecnica'},
  {id:'disciplinador',nome:'Disciplinador',desc:'Rotina, método e cobrança.',mais:'disciplina',menos:'visao'}
];
function modoTreinador(id){return MODOS_TREINADOR.find(x=>x.id===id)||MODOS_TREINADOR[0];}
function estiloTreinador(id){return ESTILOS_TREINADOR.find(x=>x.id===id)||ESTILOS_TREINADOR[0];}

function criarManager(nome,papel,opc){
  const p=PAPEIS.some(x=>x.id===papel)?papel:'diretoria';
  opc=opc||{};
  G.manager={
    nome:String(nome||'').trim().slice(0,28)||'Manager',
    papel:p, desde:G.ano, confianca:dificuldade().confianca,
    metas:[], historico:[], demitido:false, clubes:[],
    pais:opc.pais||null, idade:clamp(parseInt(opc.idade)||34,22,70), genero:opc.genero==='f'?'f':'m',
    modo:modoTreinador(opc.modo).id, estilo:estiloTreinador(opc.estilo).id,
    foto:opc.foto||null, staffId:null
  };
  return G.manager;
}

/* ============================================================
   O TREINADOR NA COMISSÃO
   ------------------------------------------------------------
   No papel de treinador você É o head coach: entra na comissão no
   lugar do coach do clube, que vai para o mercado. O seu nível vale
   no motor e no treino como o de qualquer coach (t.staff.tecnico),
   evolui com o trabalho (ou já começa no topo, se você escolheu a
   trajetória de lenda) e vai com você quando trocar de clube.
   Na diretoria o coach do clube continua — quem manda é você, quem
   treina é ele.
   Nada aqui sorteia: o seu cadastro é montado na mão, sem gerador.
   ============================================================ */
function membroManager(){
  const m=G.manager;
  return m&&m.staffId&&G.staff?G.staff[m.staffId]||null:null;
}
function _criarMembroManager(overAlvo){
  const g=G.manager,t=G.times[G.meuTime];
  const est=estiloTreinador(g.estilo);
  const at={tecnica:overAlvo,gestao:overAlvo,visao:overAlvo,disciplina:overAlvo};
  at[est.mais]+=7;at[est.menos]-=4;
  const R=t?REGIONS.find(r=>r.id===t.regiao):null;
  const m={id:'s'+(G.seqS=(G.seqS||0)+1),nome:g.nome,genero:g.genero,cargo:'tecnico',
    pais:g.pais||(t&&typeof paisDoClube==='function'&&paisDoClube(t))||(R?R.paises[0]:'BR'),
    idade:g.idade,at,pot:modoTreinador(g.modo).pot,timeId:null,contrato:9,salario:0,valor:0,
    temp:{v:0,d:0,titulos:0},carreira:{anos:0,titulos:0},hist:[],voce:true,foto:g.foto||null};
  aplicarOverStaff(m,overAlvo);
  m.pot=Math.max(m.pot,overStaff(m));
  G.staff[m.id]=m;
  g.staffId=m.id;
  return m;
}
/* over de partida: lenda no topo; do zero, um coach comum da divisão */
function overInicialManager(t){
  const md=modoTreinador(G.manager.modo);
  return md.over[t&&t.tier===2?2:1];
}
/* Coloca você no cargo de head coach do clube. O coach que estava lá vai
   para o mercado. Vale na carreira nova e ao assumir outro clube. */
function instalarManagerNoClube(t){
  if(!t||!souTreinador()||!G.staff)return null;
  let m=membroManager();
  if(!m)m=_criarMembroManager(overInicialManager(t));
  const antigo=membroDe(t,'tecnico');
  if(antigo&&antigo.id!==m.id){
    moverStaff(antigo.id,null);
    noticia('👔 '+antigo.nome+' deixa o comando técnico do '+t.nome+' e vai para o mercado: quem treina agora é '+m.nome+'.',{c:'clube',t:[t.id]});
  }
  /* sai de onde estava, sem passar pelo mercado */
  for(const x of Object.values(G.times))if(x.comissao&&x.comissao.tecnico===m.id&&x.id!==t.id){x.comissao.tecnico=null;atualizarComissao(x);}
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==m.id);
  m.timeId=t.id;m.contrato=9;
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  t.comissao=t.comissao||{};t.comissao.tecnico=m.id;
  atualizarComissao(t);
  return m;
}
/* Você sai do clube (demissão): o clube contrata o melhor coach livre que
   couber, para não ficar com interino. */
function retirarManagerDoClube(t){
  const m=membroManager();
  if(!t||!m||!t.comissao||t.comissao.tecnico!==m.id)return;
  t.comissao.tecnico=null;m.timeId=null;
  const livre=(G.staffLivres||[]).map(i=>G.staff[i]).filter(x=>x&&!x.voce&&x.cargo==='tecnico')
    .sort((a,b)=>overStaff(b)-overStaff(a))[0];
  if(livre){moverStaff(livre.id,t.id,'tecnico');
    noticia('👔 '+livre.nome+' é o novo head coach do '+t.nome+'.',{c:'mercado',t:[t.id]});}
  else atualizarComissao(t);
}
/* Saves de antes: o treinador ainda não estava na comissão. Entra no lugar do
   coach, com o mesmo nível dele, para a troca não mexer na força do time. */
function garantirManagerNaComissao(){
  const g=G.manager,t=G.meuTime&&G.times[G.meuTime];
  if(!g||!t||!souTreinador()||g.demitido||!G.staff)return;
  if(membroManager()&&t.comissao&&t.comissao.tecnico===g.staffId)return;
  if(!membroManager()){
    if(!g.modo)g.modo='carreira';
    if(!g.estilo)g.estilo='estrategista';
    if(!g.idade)g.idade=34;
    const atual=membroDe(t,'tecnico');
    _criarMembroManager(atual?overStaff(atual):overInicialManager(t));
  }
  instalarManagerNoClube(t);
}
/* Evolução de fim de temporada do seu cadastro de coach. Do zero sobe com
   o trabalho e o resultado; a lenda quase não sobe, mas também não cai cedo. */
function evoluirManagerStaff(m){
  const g=G.manager||{};
  const jogos=m.temp.v+m.temp.d,aprov=jogos?m.temp.v/jogos:0.5;
  m.hist.push({ano:G.ano,time:m.timeId&&G.times[m.timeId]?G.times[m.timeId].nome:'Sem clube',over:overStaff(m),
    v:m.temp.v,d:m.temp.d,titulos:m.temp.titulos});
  if(m.hist.length>20)m.hist.shift();
  m.carreira.anos++;m.carreira.titulos+=m.temp.titulos;
  const o=overStaff(m),gap=Math.max(0,m.pot-o);
  const metas=(g.metas||[]).filter(x=>x.peso&&x.cumprida===true).length;
  let d=g.modo==='lenda'
    ?(aprov-0.5)*1.6+m.temp.titulos*0.6
    :(m.timeId?1.0:0)+(aprov-0.5)*4.5+m.temp.titulos*2.4+metas*0.8;
  if(m.idade>=58)d-=(m.idade-57)*0.4;
  if(d>0)d=Math.min(d,gap*0.5);
  if(Math.abs(d)>=0.3)aplicarOverStaff(m,clamp(Math.round(o+d),40,99));
  m.idade++;g.idade=m.idade;
  m.temp={v:0,d:0,titulos:0};
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  if(m.timeId&&Math.round(overStaff(m))>o&&typeof noticia==='function')
    noticia('📈 '+m.nome+' fecha a temporada como coach '+overStaff(m)+' (era '+o+').',{c:'carreira',t:[m.timeId]});
}

/* ---------- metas ----------
   Saem do tamanho do clube, não de um número fixo: exigir top 4 de um lanterna
   seria demissão marcada, e exigir top 8 do favorito seria não exigir nada. */
function _ligaDe(t){return (G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).slice();}
/* Alvo de posição. Duas travas aprendidas na simulação de carreira:

   · nunca `n-1`, senão terminar em ÚLTIMO cumpre a meta — foi o que aconteceu
     com "entre os 9 primeiros" numa liga de 8 times;
   · nunca 1, porque exigir o título todo ano de um clube médio é demissão
     marcada, não meta. */
function _posicaoAlvo(t){
  const ord=_ligaDe(t).sort((a,b)=>G.times[b].prestigio-G.times[a].prestigio);
  const onde=ord.indexOf(t.id)+1;            /* 1 = mais prestigiado da liga */
  const n=ord.length;
  if(n<4)return 1;
  return clamp(Math.round(onde-Math.max(1,n*0.12))+dificuldade().alvo,2,n-2);
}
function _textoPosicao(alvo){
  return alvo<=1?'Terminar a liga em primeiro'
                :'Terminar a liga entre os '+alvo+' primeiros';
}
function montarMetas(){
  if(!souTreinador())return[];
  const t=G.times[G.meuTime];
  if(!t)return[];
  const alvo=_posicaoAlvo(t);
  const metas=[{
    id:'posicao',tipo:'posicao',alvo,de:_ligaDe(t).length,tier:t.tier,
    texto:_textoPosicao(alvo),
    peso:1, cumprida:null
  }];
  /* A segunda meta é bônus: cumprir dá fôlego, falhar não pune. Serve para o
     ano ter um objetivo além de não ser rebaixado. */
  if(t.tier===1)metas.push({id:'titulo',tipo:'titulo',alvo:1,peso:0,cumprida:null,
    texto:'Conquistar qualquer título na temporada'});
  else{
    const sobe=Math.max(1,Math.min(2,alvo-1));
    metas.push({id:'acesso',tipo:'posicao',alvo:sobe,de:_ligaDe(t).length,tier:t.tier,peso:0,cumprida:null,
      texto:'Brigar pelo acesso: '+(sobe<=1?'terminar em primeiro':'terminar entre os '+sobe+' primeiros')});
  }
  /* As do meio do ano só entram se a janela ainda está por vir: quem assume
     um clube em setembro não pode ser cobrado por julho. */
  if((G.semana||1)<SEMANA_COBRANCA)metas.push(...metasDoMeio(t,alvo));
  G.manager.metas=metas;
  return metas;
}

/* ---------- a cobrança do meio do ano ----------
   Antes a diretoria só falava no fim da temporada, e as semanas entre um
   torneio e outro não tinham tensão nenhuma no modo treinador. Agora, na
   janela do meio do ano, ela confere duas coisas: como o clube está na liga
   até ali, e uma meta de gestão que sai da situação do clube — dar minutos à
   promessa da casa, ou arrumar as contas. Pesa menos que o fim do ano, mas
   pesa, e quem já chega no limite pode cair ali mesmo. */
const SEMANA_COBRANCA=29;         /* Pausa do meio do ano (calendar.js), dentro da janela de junho e julho */
const MAPAS_PROMESSA=8;
function metasDoMeio(t,alvo){
  const de=_ligaDe(t).length;
  const parcial=clamp(alvo+1,2,Math.max(2,de-2));
  const out=[{id:'parcial',tipo:'parcial',momento:'meio',alvo:parcial,de,peso:0,cumprida:null,
    texto:'Chegar à janela do meio do ano entre os '+parcial+' primeiros da liga'}];
  const promessa=(t.elenco||[]).map(id=>G.jogadores[id])
    .filter(p=>p&&p.idade<=21&&p.pot>=84&&!(t.titulares||[]).includes(p.id))
    /* a diretoria cobra primeiro o garoto que saiu da própria base */
    .sort((a,b)=>((b.daCasa===t.id)-(a.daCasa===t.id))||b.pot-a.pot)[0];
  if(promessa)out.push({id:'promessa',tipo:'promessa',momento:'meio',jogador:promessa.id,
    alvo:MAPAS_PROMESSA,peso:0,cumprida:null,
    texto:'Dar minutos a '+promessa.nome+': '+MAPAS_PROMESSA+' mapas até o meio do ano'});
  else out.push({id:'contas',tipo:'contas',momento:'meio',peso:0,cumprida:null,
    texto:'Chegar ao meio do ano com caixa positivo e folha dentro do teto'});
  return out;
}
function cobrancaDoMeioDoAno(){
  if(!souTreinador())return null;
  const m=G.manager, t=G.times[G.meuTime];
  if(!m||m.demitido||!t)return null;
  const doMeio=(m.metas||[]).filter(x=>x.momento==='meio'&&x.cumprida===null);
  if(!doMeio.length)return null;
  const{pos,de}=posicaoNaLiga(t);
  let delta=0;
  for(const meta of doMeio){
    if(meta.tipo==='parcial'){
      const alvo=Math.min(meta.alvo,Math.max(2,de-2));
      meta.cumprida=pos<=alvo;
      meta.resultado=pos+'º de '+de;
      delta+=meta.cumprida?6+Math.min(6,(alvo-pos)*2):-6-Math.min(12,(pos-alvo)*3);
    }else if(meta.tipo==='promessa'){
      const p=G.jogadores[meta.jogador];
      if(!p||p.timeId!==t.id){
        /* vendeu ou emprestou a promessa: a diretoria não cobra o que você
           decidiu negociar, mas também não aplaude */
        meta.cumprida=null;meta.resultado='saiu do clube';continue;
      }
      const mapas=(p.temp&&p.temp.maps)||0;
      meta.cumprida=mapas>=meta.alvo;
      meta.resultado=mapas+' mapa(s)';
      delta+=meta.cumprida?5:-5;
    }else if(meta.tipo==='contas'){
      const folga=(typeof folgaSalarial==='function')?folgaSalarial(t):0;
      meta.cumprida=t.caixa>=0&&folga>=0;
      meta.resultado=money(t.caixa)+' em caixa';
      delta+=meta.cumprida?5:-6;
    }
  }
  delta=Math.round(pesoDaCobranca(delta));
  m.confianca=clamp(Math.round(m.confianca+delta),0,100);
  const registro={meio:true,ano:G.ano,clube:t.nome,tag:t.tag,pos,de,titulos:0,
    metas:doMeio.map(x=>({texto:x.texto,cumprida:x.cumprida,resultado:x.resultado})),
    confianca:m.confianca,delta};
  const demitido=m.confianca<=CONF_MIN;
  if(demitido)demitirManager(t);
  noticia('🏢 Balanço do meio do ano: confiança da diretoria '+(delta>=0?'+':'')+delta+' → '+m.confianca+'.',{c:'clube',t:[t.id],imp:2});
  return{...registro,demitido,avisado:!demitido&&m.confianca<=CONF_PISO_DEMISSAO};
}

/* Posição do clube na liga pela campanha da temporada corrente. */
function posicaoNaLiga(t){
  const liga=(G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).slice();
  const camp=x=>{const c=G.times[x].temporada||{v:0,d:0,mv:0,md:0};
                 return[c.v-c.d,(c.mv||0)-(c.md||0)];};
  liga.sort((a,b)=>{const A=camp(a),B=camp(b);return B[0]-A[0]||B[1]-A[1];});
  return{pos:liga.indexOf(t.id)+1,de:liga.length};
}

/* ---------- avaliação de fim de temporada ---------- */
const CONF_MIN=0;             /* abaixo disso, demissão */
const CONF_PISO_DEMISSAO=18;  /* margem em que a diretoria ainda avisa */

function avaliarTemporada(){
  if(!souTreinador())return null;
  const m=G.manager, t=G.times[G.meuTime];
  if(!t||!m.metas.length)return null;
  const{pos,de}=posicaoNaLiga(t);
  const titulosAno=(t.titulos||[]).filter(x=>String(x).startsWith(String(G.ano))).length;

  for(const meta of m.metas){
    if(meta.momento==='meio')continue;   /* já cobradas na janela do meio do ano */
    if(meta.tipo==='posicao'){
      /* Acesso ou rebaixamento entre a definição da meta e a avaliação mudam o
         tamanho da liga. Reescalar mantém a exigência equivalente em vez de
         herdar um número que não faz mais sentido — e o teto de `de-2` garante
         que terminar em último nunca cumpra meta nenhuma. */
      let alvo=meta.alvo;
      if(meta.de&&meta.de!==de){
        alvo=clamp(Math.round(meta.alvo*de/meta.de),2,Math.max(1,de-2));
        meta.ajustada=meta.alvo+' → '+alvo+' (a liga mudou de tamanho)';
        meta.alvo=alvo;meta.de=de;meta.texto=_textoPosicao(alvo);
      }
      alvo=Math.min(alvo,Math.max(1,de-2));
      meta.cumprida=pos<=alvo;
    }
    else if(meta.tipo==='titulo')meta.cumprida=titulosAno>=meta.alvo;
    meta.resultado=meta.tipo==='posicao'?(pos+'º de '+de):(titulosAno+' título(s)');
  }
  const principal=m.metas.find(x=>x.peso>0);
  const bonus=m.metas.filter(x=>x.peso===0&&x.momento!=='meio'&&x.cumprida).length;

  /* A confiança se move pela DISTÂNCIA da meta, não por acertou/errou: ficar
     uma posição fora não pode custar o mesmo que ficar dez. */
  let delta;
  if(principal&&principal.cumprida)delta=14+Math.min(12,(principal.alvo-pos)*3);
  else delta=-10-Math.min(24,(pos-(principal?principal.alvo:pos))*4);
  delta+=bonus*10;
  if(titulosAno)delta+=8;
  delta=Math.round(pesoDaCobranca(delta));
  m.confianca=clamp(Math.round(m.confianca+delta),0,100);

  const registro={ano:G.ano,clube:t.nome,tag:t.tag,pos,de,titulos:titulosAno,
                  metas:m.metas.map(x=>({texto:x.texto,cumprida:x.cumprida,resultado:x.resultado})),
                  confianca:m.confianca,delta};
  m.historico.push(registro);
  const demitido=m.confianca<=CONF_MIN;
  if(demitido)demitirManager(t);
  return{...registro,demitido,avisado:!demitido&&m.confianca<=CONF_PISO_DEMISSAO};
}

/* ---------- demissão e recolocação ---------- */
function demitirManager(t){
  const m=G.manager;
  m.demitido=true;
  retirarManagerDoClube(t);
  m.clubes.push({tag:t.tag,nome:t.nome,de:m.desde,ate:G.ano});
  noticia('📉 '+m.nome+' foi demitido do '+t.nome+'.',{c:'clube',t:[t.id],imp:3});
}
/* Clubes dispostos a contratar quem acabou de ser demitido. Ninguém de topo
   chama um treinador que acabou de cair — a lista sai do prestígio para baixo,
   e é isso que faz a carreira ter forma de carreira. */
function ofertasDeEmprego(){
  const m=G.manager;
  const ultimo=m.clubes[m.clubes.length-1];
  const antigo=Object.values(G.times).find(x=>x.tag===(ultimo&&ultimo.tag));
  const teto=(antigo?antigo.prestigio:60)-4;
  const outros=Object.values(G.times).filter(x=>x.id!==(antigo&&antigo.id));
  const dentro=outros.filter(x=>x.prestigio<=teto)
    .sort((a,b)=>b.prestigio-a.prestigio).slice(0,6);
  /* Sempre existe alguma porta. Uma lista vazia encerrava a carreira sem
     aviso — e "nenhum clube do mundo te quer" não é consequência de duas
     temporadas ruins, é um beco sem saída da minha regra de teto. */
  if(dentro.length)return dentro;
  return outros.sort((a,b)=>a.prestigio-b.prestigio).slice(0,4);
}
function assumirClube(id){
  const t=G.times[id];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  G.meuTime=id;
  const m=G.manager;
  m.demitido=false;m.desde=G.ano;m.confianca=dificuldade().confianca-4;
  if(typeof iniciarBase==='function')iniciarBase(t);
  instalarManagerNoClube(t);
  montarMetas();
  noticia('✍ '+m.nome+' assume o comando do '+t.nome+'.',{c:'clube',t:[t.id],imp:2});
  return{ok:true,msg:'Você assumiu o '+t.nome+'.'};
}

/* Texto curto do estado atual, para a Central. */
function situacaoManager(){
  const m=G.manager;
  if(!m)return null;
  if(!souTreinador())return{papel:'Diretoria',livre:true,
    texto:'Sem metas e sem cobrança — o clube é conduzido do jeito que você decidir.'};
  /* Demitido é um ESTADO, não um evento que passa.

     Antes a demissão só existia dentro do modal do veredito: quem fechasse o
     modal sem escolher clube continuava "treinando" o clube que o demitiu,
     com as metas velhas na tela e a confiança congelada, e nenhuma temporada
     voltava a ser avaliada. A carreira acabava em silêncio e o jogo fingia
     que não. Agora o estado aparece na Central e a porta de volta fica
     sempre aberta. */
  if(m.demitido)return{papel:'Treinador',livre:true,demitido:true,
    texto:'Sem clube. '+(m.clubes.length?'Último trabalho: '+m.clubes[m.clubes.length-1].nome+'. ':'')+
          'Escolha abaixo por onde recomeçar.',
    ofertas:ofertasDeEmprego()};
  const c=m.confianca;
  const tom=c>=70?'bom':c>=35?'neutro':'ruim';
  const texto=c>=80?'A diretoria confia no trabalho.'
    :c>=55?'A diretoria está satisfeita, sem euforia.'
    :c>=35?'A diretoria observa de perto.'
    :c>=CONF_PISO_DEMISSAO?'A diretoria está impaciente.'
    :'Cadeira ameaçada. Outro ano assim e acabou.';
  return{papel:'Treinador',livre:false,confianca:c,tom,texto,metas:m.metas};
}

/* ============================================================
   FIM DE TEMPORADA
   ============================================================ */
/* Quem para de jogar, e quando.

   Idade sozinha não explica: um atleta de e-sports PODE jogar até os 35–40, e
   é isso que a curva etária permite. O que encerra a maioria das carreiras
   antes disso é o rendimento — quem caiu muito do próprio pico não encontra
   mais clube e pendura o mouse.

   Foi a peça que faltava na primeira tentativa: só esticando a idade, metade
   dos titulares do circuito passou dos 30 e os garotos não achavam vaga.
   Somando o declínio, a carreira longa continua possível para quem se mantém
   bom, e quem cai sai — que é como o esporte funciona. */
const APOS_IDADE=[[42,1],[39,.34],[36,.16],[33,.06],[30,.02]];
/* Renovação com o teto de folha na frente.

   Antes o clube renovava de olhos fechados pelo salário de mercado. Como o
   jogador evolui todo ano, o salário de mercado sobe todo ano, e a folha
   subia junto sem ninguém conferir: em dez temporadas o Challengers inteiro
   estava com 100% da receita comprometida em salário e sangrando. O clube
   agora só renova o que cabe; o que não cabe vai para o mercado, que é onde
   um clube que PODE pagar vai buscá-lo — é assim que o jogador bom sobe de
   divisão em vez de apodrecer num clube que não o sustenta. */
function renovarSePuder(p){
  const t=G.times[p.timeId];
  if(!t){liberar(p);return false;}
  /* quem não quer ficar não fica, nem por dinheiro: a mesma régua da sua mesa */
  if(typeof interesseEmFicar==='function'&&t.elenco.length>5&&interesseEmFicar(p,t).nota<INTERESSE_MIN){liberar(p);return false;}
  const novo=salario(p,t);
  const depois=folhaAnual(t)-(p.salario||0)*12+novo*12;
  const teto=receitaLivre(t)*tetoFolhaDe(t);
  if(depois>teto&&t.elenco.length>5){liberar(p);return false;}
  p.contrato=ri(2,3);p.salario=novo;
  return true;
}

/* Corte de folha fora da renovação.

   Renovar com o teto na frente resolve o contrato que vence, mas não o clube
   que perdeu receita no meio do caminho — caiu de divisão, esvaziou a torcida,
   perdeu o patrocinador — e ficou com uma folha que era compatível com o
   orçamento do ano passado. Sem esta passagem ele só tinha um caminho: sangrar
   até o caixa virar negativo. Aqui ele corta o mais caro do banco, que é o que
   uma diretoria faz de verdade, e o jogador cai no mercado inteiro.

   O banco sai primeiro. Se mesmo com cinco a folha não fecha — clube que caiu
   de divisão e ficou com um salário de elite no elenco —, o titular mais caro
   também sai: garantirElencos() repõe logo depois com quem cabe no orçamento,
   nem que seja um moleque da base. Sem essa saída o clube ficava preso a um
   contrato que não podia pagar e sangrava até o caixa virar negativo, que é o
   único jeito de um clube quebrar aqui. Nunca toca no clube do jogador —
   quem manda no dinheiro dele é ele. */
function ajustarFolha(){
  let cortes=0;
  for(const id in G.times){
    if(id===G.meuTime)continue;
    const t=G.times[id];
    let guarda=0;
    while(t.elenco.length>4&&folhaAnual(t)>receitaLivre(t)*tetoFolhaDe(t)&&guarda++<8){
      const banco=t.elenco.map(i=>G.jogadores[i])
        .filter(p=>p&&!(t.titulares||[]).includes(p.id));
      const alvo=(banco.length?banco:t.elenco.map(i=>G.jogadores[i]).filter(Boolean))
        .sort((a,b)=>b.salario-a.salario)[0];
      if(!alvo)break;
      liberar(alvo);cortes++;
    }
    /* A comissão também é folha. Clube que caiu de divisão com comissão de
       Tier 1 não fechava a conta só cortando jogador (o elenco tem piso) e
       sangrava o caixa por anos: aqui o membro mais caro sai e entra um do
       mercado que custe no máximo metade. */
    guarda=0;
    while(folhaAnual(t)>receitaLivre(t)*tetoFolhaDe(t)&&guarda++<5&&typeof CARGOS!=='undefined'){
      const m=CARGOS.map(c=>membroDe(t,c.id)).filter(Boolean).sort((a,b)=>b.salario-a.salario)[0];
      if(!m||m.salario<=600)break;
      const sub=(G.staffLivres||[]).map(i=>G.staff[i])
        .filter(x=>x&&x.cargo===m.cargo&&salarioStaff(x)<=m.salario*0.5)
        .sort((a,b)=>overStaff(b)-overStaff(a))[0];
      if(!sub)break;
      const cargo=m.cargo;
      liberarStaff(m.id);moverStaff(sub.id,t.id,cargo);sub.salario=salarioStaff(sub);sub.contrato=Math.max(1,sub.contrato||1);
      cortes++;
    }
  }
  return cortes;
}

/* Teto do mercado de agentes livres: o resto (os de menor over+potencial)
   some do mundo na virada. Era 170; 120 ainda é mercado farto e pesa menos no save. */
const LIVRES_MAX=120;
function chanceAposentadoria(p){
  let c=0;
  for(const[idade,ch]of APOS_IDADE)if(p.idade>=idade){c=ch;break;}
  /* O declínio só pesa quando já faz sentido pesar. Sem esta rampa, um jogador
     de 28 anos que perdeu cinco pontos de over pendurava o mouse — e a mediana
     de carreira caía para 33, longe dos 35 a 40 que era o alvo. */
  const peso=clamp((p.idade-29)/8,0,1);         /* 0 aos 29, cheio aos 37 */
  if(peso<=0)return c;
  const queda=Math.max(0,(p.pico||over(p))-over(p));
  c+=queda*0.035*peso;                          /* 10 pontos abaixo do pico: até +35% */
  if(!p.timeId)c+=0.20*peso;                    /* sem clube, o convite não vem */
  return clamp(c,0,1);
}

function fimDeTemporada(){
  /* PRIMEIRA coisa da virada: quem estava emprestado volta para o dono.

     O empréstimo dá ao jogador um contrato de um ano com o clube que o tomou.
     Se a rotina de contratos rodasse antes, esse um ano vencia, o clube não
     renovava, e o jogador — que continuava sendo de outro clube, com anos de
     contrato pelo meio — caía no mercado como agente livre. O dono perdia um
     titular de graça sem nunca ser avisado. Devolver antes de qualquer conta
     é o que faz o contrato de verdade dele voltar a valer. */
  /* os prêmios leem os elencos como a temporada terminou: antes de o
     empréstimo voltar e de alguém se aposentar */
  G._despedidas=[];
  if(typeof premiarTemporada==='function')premiarTemporada();
  /* a linha da temporada de cada clube e o recorde de over: antes de
     empréstimo voltar, de alguém se aposentar e de a campanha ser zerada */
  if(typeof registrarTemporadaDoClube==='function')for(const id in G.times)registrarTemporadaDoClube(G.times[id]);
  if(typeof conferirRecordeOver==='function')conferirRecordeOver();
  /* bônus de patrocínio pelas metas de resultado, com a campanha ainda
     intacta e antes de alguém ser declarado em crise por caixa */
  if(typeof pagarMetasPatrocinio==='function')pagarMetasPatrocinio(1);
  if(typeof resolverEmprestimos==='function')resolverEmprestimos();
  /* o mercado reage ao dinheiro guardado antes das renovações da virada */
  if(typeof atualizarIndiceSalarial==='function')atualizarIndiceSalarial();
  /* quem fechou o ano no vermelho entra em crise e abre liquidação */
  if(typeof conferirCrises==='function')conferirCrises();
  const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
  let aposentados=0;
  // aposentadorias e contratos
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    p.hist.push({ano:G.ano,time:p.timeId?G.times[p.timeId].nome:p.base&&G.times[p.base]?'Base · '+G.times[p.base].nome:'Sem clube',over:over(p),...p.temp});
    if(typeof podarHistorico==='function')podarHistorico(p);
    p.temp=novaTemp();p.idade++;p.contrato=Math.max(0,p.contrato-1);
    const chanceApos=chanceAposentadoria(p);
    if(rnd()<chanceApos){
      if(p.timeId)noticia('👋 '+p.nome+' anunciou aposentadoria aos '+p.idade+' anos.',{c:'carreira',p:[p.id],t:[p.timeId]});
      if(typeof talvezHallDaFama==='function')talvezHallDaFama(p);
      /* destino depois de parar: comissão, cabine ou a compra de um clube */
      if(typeof posCarreira==='function')posCarreira(p);
      if(p.timeId){const t=G.times[p.timeId];t.elenco=t.elenco.filter(x=>x!==p.id);t.titulares=t.titulares.filter(x=>x!==p.id);}
      G.livres=G.livres.filter(x=>x!==p.id);
      if(typeof esquecerJogador==='function')esquecerJogador(p.id);
      delete G.jogadores[id];aposentados++;continue;
    }
    /* pré-contrato assinado na temporada: ele se apresenta no clube novo */
    if(p.contrato===0&&p.timeId&&p.preContrato&&typeof cumprirPreContrato==='function'&&cumprirPreContrato(p)){}
    else if(p.contrato===0&&p.timeId){
      if(p.timeId===G.meuTime){noticia('📄 '+p.nome+' deixou o clube: contrato encerrado.',{c:'mercado',p:[p.id],t:[G.meuTime]});liberar(p);}
      else if(rnd()<.82)renovarSePuder(p);
      else liberar(p);
    }
    p.fadiga=0;p.forma=clamp(gauss(.6,.12),.3,.9);
    p.valor=valor(p);
  }
  /* categoria de base do seu clube: sai quem fez 20, entra a turma nova. Não
     conta como promessa: garoto de base não é oferta de mercado */
  if(typeof virarBase==='function')virarBase(usados);
  // promessas da base
  let promessas=0;
  for(const tid in G.times){
    const t=G.times[tid];
    /* Olheiro entra como multiplicador, neutro em NIVEL_NEUTRO como todo o
       resto. Ancorado no 3 antigo, a base do Challengers rendia menos que a
       de qualquer clube de Tier 1 mesmo com o melhor olheiro da divisão — a
       única fábrica de talento que o Tier 2 tem, penalizada por definição. */
    const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
    const olh=(t.staff&&t.staff.olheiro)||neutro;
    /* Clube com o elenco mínimo em pé NÃO fabrica jogador. A base subia
       promessa para qualquer clube com menos de nove, e o mundo enchia de
       gente gerada que ninguém pediu — elenco de oito, nove, todos
       inventados. Agora a fábrica só liga quando falta gente para jogar. */
    if((t.elenco||[]).length>=ELENCO_MIN)continue;
    const n=(rnd()<t.estrutura.academia*0.16*(1-neutro*0.05+olh*0.05))?1:0;
    if(!n)continue;
    /* Promessa nasce abaixo do piso da divisão de propósito: é projeto, não
       titular. O potencial é que a torna interessante. */
    const[piso]=FAIXAS.jogador[t.tier];
    /* Academia e olheiro mexem pouco, de propósito. Com academia*2 e teto de
       potencial em 99, a academia 5 (que todo clube de Tier 1 tem depois de
       poucas temporadas) fabricava garoto já no piso e com potencial 99: em
       vinte temporadas, metade dos cinquenta melhores do mundo era 98. */
    const alvo=clamp(Math.round(gauss(piso-12+t.estrutura.academia+(olh-neutro),5)),
                     FAIXAS.jogador[2][0]-14,piso-2);
    const p=makePlayer(alvo,pick(ROLES),paisDaBase(t),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
    p.pot=clamp(over(p)+ri(8,20)+t.estrutura.academia,over(p)+6,96);
    p.salario=salario(p,t);p.contrato=3;p.daCasa=t.id;
    G.jogadores[p.id]=p;promessas++;
    if(t.elenco.length<9){p.timeId=t.id;t.elenco.push(p.id);
      if(t.id===G.meuTime)noticia('⭐ Promessa da base promovida: '+p.nome+' ('+p.role+', pot. '+p.pot+').',{c:'clube',p:[p.id],t:[t.id]});}
    else{p.timeId=null;G.livres.push(p.id);}
  }
  /* Novos nomes no mercado.

     Eram 12 fixos por temporada, contra 40 a 60 aposentadorias. O saldo
     negativo esvaziava o mercado devagar e, por volta da décima quinta
     temporada, os clubes não conseguiam mais repor: apareciam times de Tier 1
     com um jogador só. A oferta agora acompanha a demanda, com um piso para o
     mercado nunca ficar sem opção nenhuma. */
  /* Sem folga em cima da reposição: com os regens crescendo de verdade, o
     "+6" e o piso de 14 enchiam o mercado de garotos que ninguém contratava
     (160 livres em vinte temporadas, e o save crescendo junto). */
  const novos=Math.max(10,aposentados-promessas);
  for(let i=0;i<novos;i++){
    const R=pick(REGIONS);
    /* Sangue novo entra pela base, na idade da base. Antes entrava pronto,
       entre 17 e 27, e o mercado se renovava com estranhos de 25 anos que
       apareciam do nada. */
    const idade=ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX);
    const alvo=overLivreGerado();
    const p=makePlayer(alvo,pick(ROLES),pick(R.paises),idade,usados,2);
    aplicarOver(p,alvo);p.pot=potencialDe(alvo,idade,2);
    p.contrato=0;G.jogadores[p.id]=p;G.livres.push(p.id);
  }
  evoluirStaff();
  mercadoStaffIA();
  /* Corte antes de qualquer contratação: quem está acima do teto tem de
     desovar primeiro, senão entra no mercado comprando o que não sustenta. */
  ajustarFolha();
  /* Obra depois: o dinheiro que virou estrutura não está mais disponível para
     folha, e a obra só passa se a operação a sustentar. */
  /* o equipamento envelhece antes: a IA decide a obra já sabendo o que caiu */
  if(typeof envelhecerEstrutura==='function')envelhecerEstrutura();
  if(typeof investimentoIA==='function')investimentoIA();
  /* transferências entre clubes ANTES do preenchimento por agente livre: quem
     tem dinheiro tenta o reforço bom primeiro e só depois sobra o mercado de
     graça, que é a ordem em que isso acontece de verdade */
  mercadoTransferencias();
  mercadoIA();
  if(G.livres.length>LIVRES_MAX){
    const ordenados=G.livres.map(i=>G.jogadores[i]).sort((a,b)=>(over(b)+b.pot)-(over(a)+a.pot));
    ordenados.slice(LIVRES_MAX).forEach(p=>{noticia('');
      if(typeof esquecerJogador==='function')esquecerJogador(p.id);
      delete G.jogadores[p.id];});
    G.noticias=G.noticias.filter(n=>n.txt);
    G.livres=ordenados.slice(0,LIVRES_MAX).map(p=>p.id);
  }
  const meuT=G.times[G.meuTime];
  if(meuT){
    while(meuT.elenco.length<5&&G.livres.length){
      const alvo=G.livres.map(i=>G.jogadores[i]).sort((a,b)=>over(b)-over(a))
        .find(p=>salario(p,meuT)*12<Math.max(0,meuT.caixa)*.5)||G.jogadores[G.livres[G.livres.length-1]];
      contratar(alvo,meuT,2,salario(alvo,meuT));
      noticia('⚠ Elenco abaixo do mínimo: a diretoria contratou '+alvo.nome+' em caráter emergencial.',{c:'clube',p:[alvo.id],t:[meuT.id]});
    }
  }
  /* torcida antes das marcas: é a campanha recém-encerrada que decide quem
     ficou atraente para os patrocinadores desta temporada */
  for(const id in G.times)atualizarTorcida(G.times[id]);
  /* com a torcida nova: a meta de torcida e as cláusulas de saída */
  if(typeof pagarMetasPatrocinio==='function')pagarMetasPatrocinio(2);
  if(typeof clausulasDeSaida==='function')clausulasDeSaida();
  atribuirPatrocinios(G.ano+1);
  /* A campanha só é zerada depois de avaliada: avaliarTemporada() lê
     t.temporada para saber em que posição o clube terminou. */
  if(typeof avaliarTemporada==='function'&&G.manager&&!G.manager.demitido)
    G.vereditoPendente=avaliarTemporada();
  for(const id in G.times){
    const t=G.times[id];
    t.temporada={v:0,d:0,mv:0,md:0,pts:0};
    t.patroc=receitaCaixa(t);
    if(typeof entrosamentoVirada==='function'&&t.duplas)entrosamentoVirada(t);
    else t.sinergia=clamp(t.sinergia+4,0,100);
    for(const m of MAP_POOL)t.mapPref[m]=clamp(Math.round((t.mapPref[m]||0)+gauss(0,2)),-8,8);
    autoEscalar(t);
  }
  /* O pool ativo NÃO é resetado na virada: ele vem da rotação, que acontece
     três vezes por temporada. Zerar aqui apagaria a rotação inteira e devolvia
     os doze mapas, que é o que tirava o sentido de treinar mapa. */
  if(!G.mapasAtivos||!G.mapasAtivos.length)G.mapasAtivos=poolInicial();
  /* a cerimônia lê o calendário que está acabando: antes de virar o ano */
  if(typeof montarCerimonia==='function')montarCerimonia();
  G.ano++;
  /* metas novas para a temporada que começa */
  if(typeof montarMetas==='function'&&G.manager&&!G.manager.demitido)montarMetas();
  montarCalendario();
  G.semana=1;
  noticia('=== Início da temporada '+G.ano+' ===',{c:'sistema'});
}

/* preview de chaveamento sem efeitos colaterais */
function paresKO(vivos){
  const n=vivos.length;
  if(n<=1)return{pares:[],byes:vivos.slice()};
  let m=1;while(m*2<=n)m*=2;
  const nm=m===n?n/2:n-m;
  const byes=vivos.slice(0,n-nm*2),jogam=vivos.slice(n-nm*2),pares=[];
  for(let i=0;i<nm;i++)pares.push([jogam[i],jogam[jogam.length-1-i]]);
  return{pares,byes};
}
function seedKO(s){const r=paresKO(s.vivos);s._byes=r.byes;return r.pares;}

/* ============================================================
   CATÁLOGO DE TORNEIOS E DE AGENTES
   ------------------------------------------------------------
   O calendário é remontado a cada temporada, então nome e arte
   de competição não podem morar nos stages: eles são recriados
   todo ano. Ficam aqui, num catálogo estável dentro de G, com
   chave que não muda — 'champions', 'kickoff_AMER', 'asc_PAC'.
   O stage só guarda o torneioId e pergunta o nome ao catálogo,
   o que faz um rename no Editor valer na hora, inclusive na
   temporada em andamento.

   Os agentes seguem a mesma ideia: AGENTS em data/mundo.js é a
   semente, G.agentes é a cópia editável da run. Assim dá para
   acompanhar lançamento de agente sem mexer no arquivo de dados.
   ============================================================ */
function montarTorneios(){
  const T={};
  const add=(id,nome,curto,escopo,tier,premio)=>{T[id]={id,nome,curto,escopo,tier,premio};};
  /* premio = quanto o campeão leva. As demais colocações saem da curva da
     categoria em core/competition.js. Zero significa fase sem premiação: os
     pontos corridos não pagam, quem paga é o mata-mata que vem depois. */
  add('champions','Valorant Champions','Champions','INT',1,1000000);
  add('masters1','Masters I','Masters I','INT',1,400000);
  add('masters2','Masters II','Masters II','INT',1,400000);
  /* Um torneio por EVENTO, nunca por fase. Grupos e playoffs do Stage 1 são o
     mesmo torneio, como já eram os do Kickoff, do Masters e do Champions:
     quem é campeão é campeão do Stage 1, não "dos playoffs do Stage 1". Só a
     fase final é encerrada (fimDeBloco), então o prêmio do evento continua
     sendo pago uma vez só, ao fim dos playoffs. */
  for(const R of REGIONS){
    add('kickoff_'+R.id,'Kickoff '+R.nome,'Kickoff',R.id,1,100000);
    add('stage1_'+R.id,'Stage 1 · '+R.nome,'Stage 1',R.id,1,160000);
    add('stage2_'+R.id,'Stage 2 · '+R.nome,'Stage 2',R.id,1,160000);
    add('split1_'+R.id,'Split 1 · '+R.t2,'Split 1',R.id,2,40000);
    add('split2_'+R.id,'Split 2 · '+R.t2,'Split 2',R.id,2,40000);
    add('asc_'+R.id,'Ascension '+R.nome,'Ascension',R.id,2,130000);
  }
  G.torneios=T;
  return T;
}
/* Saves e bases de antes do torneio por evento tinham uma entrada para os
   playoffs (po1_, cp1_…) separada do Stage/Split. O prêmio que estava nela (e
   que pode ter sido editado) passa para o evento, e a entrada sai. Idempotente. */
function unificarTorneios(){
  if(!G||!G.torneios)return 0;
  let n=0;
  const par={po1:'stage1',po2:'stage2',cp1:'split1',cp2:'split2'};
  for(const id of Object.keys(G.torneios)){
    const corte=id.indexOf('_');if(corte<0)continue;
    const alvo=par[id.slice(0,corte)];if(!alvo)continue;
    const ev=G.torneios[alvo+id.slice(corte)];
    if(ev&&!ev.premio)ev.premio=G.torneios[id].premio||0;
    delete G.torneios[id];n++;
  }
  return n;
}

/* qual curva de premiação cada torneio usa */
function categoriaTorneio(id){
  const direto={champions:'champions',masters1:'masters',masters2:'masters'}[id];
  if(direto)return direto;
  const pre=String(id).split('_')[0];
  return {kickoff:'kickoff',stage1:'po',stage2:'po',split1:'chall',split2:'chall',asc:'ascension'}[pre]||null;
}
/* tabela de premiação de um stage, já em dinheiro, a partir do catálogo */
function premiosDoStage(s){
  const t=torneio(s&&s.torneioId);
  if(!t||!t.premio)return[];
  /* a curva é esticada até o número de participantes do stage, para que o
     último colocado também receba — ver curvaPremio() em competition.js */
  const n=(s&&s.times&&s.times.length)||0;
  const curva=curvaPremio(categoriaTorneio(t.id)||'kickoff',n);
  return curva.map(f=>Math.round(t.premio*f/1000)*1000);
}

/* traduz o id do stage no calendário para a chave do catálogo */
const PREFIXO_TORNEIO={kick:'kickoff',kg:'kickoff',s1:'stage1',s2:'stage2',po1:'stage1',po2:'stage2',
                       c1:'split1',c2:'split2',cp1:'split1',cp2:'split2',asc:'asc'};
function torneioDeStage(idStage){
  const direto={masters1:'masters1',masters2:'masters2',champs:'champions',
                masters1_sw:'masters1',masters2_sw:'masters2',ch_gr:'champions'}[idStage];
  if(direto)return direto;
  const corte=String(idStage).indexOf('_');
  if(corte<0)return null;
  const pre=PREFIXO_TORNEIO[idStage.slice(0,corte)];
  return pre?pre+'_'+idStage.slice(corte+1):null;
}
function torneio(id){return (G&&G.torneios&&G.torneios[id])||null;}
function nomeTorneio(id){const t=torneio(id);return t?t.nome:null;}
/* Nome de exibição do torneio NESTA temporada: o internacional leva a cidade
   ("Masters Osaka"), a não ser que você o tenha renomeado no Banco de dados —
   aí vale o seu nome. */
const NOME_PADRAO_TORNEIO={masters1:'Masters I',masters2:'Masters II',champions:'Valorant Champions'};
function nomeDoAno(id,ano){
  const t=torneio(id);if(!t)return null;
  if(NOME_PADRAO_TORNEIO[id]&&t.nome===NOME_PADRAO_TORNEIO[id]&&typeof nomeComSede==='function')
    return nomeComSede(id,ano)||t.nome;
  return t.nome;
}
/* nome de exibição de um stage: catálogo primeiro, rótulo do stage como reserva */
function nomeStage(s){
  if(!s)return '—';
  const base=(s.torneioId&&nomeDoAno(s.torneioId))||s.nome||'—';
  /* Um torneio tem mais de uma fase, e as duas apontam para a mesma entrada do
     catálogo — sem o rótulo, a fase de grupos e os playoffs do Champions
     apareciam com o mesmo nome em toda tela e em todo título. O catálogo
     continua com uma linha por torneio, que é o que você edita. */
  return s.rotulo?base+' · '+s.rotulo:base;
}
/* O nome sem a fase: é o que vale como TÍTULO, porque quem é campeão é campeão
   do torneio, não da fase final dele. */
function nomeTitulo(s){
  if(!s)return '—';
  return (s.torneioId&&nomeDoAno(s.torneioId))||s.nome||'—';
}
function edAplicarTorneio(id,c){
  const t=torneio(id);
  if(!t)return{ok:false,erro:'Torneio não encontrado.'};
  if(typeof c.nome==='string'&&c.nome.trim())t.nome=c.nome.trim();
  if(typeof c.curto==='string'&&c.curto.trim())t.curto=c.curto.trim().slice(0,14);
  if(c.premio!=null)t.premio=Math.max(0,Math.round(parseFloat(c.premio)||0));
  return{ok:true};
}

/* ---------- agentes ---------- */
function montarAgentes(){
  G.agentes={};
  for(const r of ROLES)G.agentes[r]=AGENTS[r].slice();
  return G.agentes;
}
function agentesDe(role){
  return (G&&G.agentes&&G.agentes[role])||AGENTS[role]||[];
}
function todosAgentes(){
  const vistos=new Set(),out=[];
  for(const r of ROLES)for(const a of agentesDe(r))
    if(!vistos.has(a)){vistos.add(a);out.push({nome:a,role:r});}
  return out.sort((a,b)=>a.nome.localeCompare(b.nome));
}
function edAddAgente(role,nome){
  if(!ROLES.includes(role))return{ok:false,erro:'Função inválida.'};
  nome=String(nome||'').trim();
  if(!nome)return{ok:false,erro:'Dê um nome ao agente.'};
  if(!G.agentes)montarAgentes();
  if(G.agentes[role].some(a=>a.toLowerCase()===nome.toLowerCase()))
    return{ok:false,erro:nome+' já está em '+role+'.'};
  G.agentes[role].push(nome);
  return{ok:true,msg:nome+' entrou em '+role+'.'};
}
function edRemoverAgente(role,nome){
  if(!G.agentes)montarAgentes();
  const antes=G.agentes[role].length;
  G.agentes[role]=G.agentes[role].filter(a=>a!==nome);
  if(G.agentes[role].length===antes)return{ok:false,erro:'Agente não encontrado.'};
  if(!G.agentes[role].length){G.agentes[role]=[nome];return{ok:false,erro:role+' ficaria sem nenhum agente.'};}
  return{ok:true,msg:nome+' saiu de '+role+'.'};
}

/* Nome de um bloco do calendário com a sede: "Masters Osaka · Suíço" em vez
   de "Masters I · Suíço". Os blocos são fixos (calendar.js); a cidade é do ano. */
function nomeBloco(b){
  if(!b)return '';
  const k=/^Masters II\b/.test(b.nome)?'masters2':/^Masters I\b/.test(b.nome)?'masters1':/^Champions\b/.test(b.nome)?'champions':null;
  const n=k&&typeof nomeDoAno==='function'?nomeDoAno(k):null;
  if(!n)return b.nome;
  return b.nome.replace(/^(Masters II|Masters I|Champions)\b/,k==='champions'&&/^Valorant /.test(n)?'Champions':n);
}

/* ============================================================
   SEDES E TROFÉUS de Masters e Champions
   ------------------------------------------------------------
   Cada temporada sorteia onde acontecem Masters I, Masters II e
   Champions, e o torneio passa a levar o nome da cidade: "Masters
   Osaka", "Champions Paris".

   O sorteio NÃO usa o gerador do motor (rnd). Ele sai de um hash da
   semente da carreira com o ano, então:
     · a mesma carreira tem sempre as mesmas sedes;
     · sortear sede não desloca nenhum outro sorteio — o circuito, os
       elencos e as partidas saem idênticos com ou sem este módulo.

   Regras (data/sedes.js explica os campos):
     · Champions só em cidade de tipo 'champions';
     · Masters em qualquer cidade, com o dobro de chance para quem não
       é a maior do país;
     · nenhuma cidade repete as sedes dos dois anos anteriores;
     · os dois Masters do ano nunca no mesmo país, e nenhum deles na
       cidade do Champions do mesmo ano.

   O resultado fica gravado em G.sedes[ano]: editar o catálogo de
   cidades depois não reescreve o passado.

   TORNEIOS REGIONAIS também têm sede (Kickoff, Stage 1 e 2, Splits do
   Challengers, Ascension): acontecem numa cidade de verdade, só não
   levam o nome dela. Regras:
     · cidade da própria região;
     · cada cidade recebe UM torneio por ano — quem é sede de Masters ou
       Champions no ano não recebe torneio menor;
     · o Stage 2 (o que dá vaga no Champions) prefere a maior cidade
       do país; o Challengers prefere as outras;
     · região sem cidade livre (a China tem seis, e às vezes uma delas é
       sede internacional) pega emprestada a vizinha (Pacific).
   ============================================================ */
const SEDE_EVENTOS=['masters1','masters2','champions'];
const SEDE_PESO_FORA_DA_MAIOR=2;
const SEDE_ANOS_SEM_REPETIR=2;
const SEDE_REGIONAIS=['stage2','kickoff','stage1','split1','split2','asc'];
const SEDE_REGIOES=['AMER','EMEA','PAC','CN'];
/* país → região do circuito, para as cidades do catálogo */
const REGIAO_DA_CIDADE={BR:'AMER',US:'AMER',CA:'AMER',MX:'AMER',AR:'AMER',CL:'AMER',CO:'AMER',PE:'AMER',
  NL:'EMEA',DE:'EMEA',PT:'EMEA',GB:'EMEA',ES:'EMEA',FR:'EMEA',SA:'EMEA',IT:'EMEA',PL:'EMEA',DK:'EMEA',SE:'EMEA',
  TR:'EMEA',IS:'EMEA',FI:'EMEA',UA:'EMEA',AE:'EMEA',
  TH:'PAC',KR:'PAC',SG:'PAC',JP:'PAC',TW:'PAC',VN:'PAC',ID:'PAC',MY:'PAC',PH:'PAC',IN:'PAC',AU:'PAC',
  CN:'CN',HK:'CN'};
const SEDE_VIZINHA={CN:'PAC',PAC:'CN',AMER:'AMER',EMEA:'EMEA'};

function slugCidade(nome){
  return String(nome).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
}
function montarCidades(){
  G.cidades=SEDES.map(c=>Object.assign({slug:slugCidade(c.nome)},c));
  return G.cidades;
}
function cidades(){
  if(G&&Array.isArray(G.cidades)&&G.cidades.length)return G.cidades;
  return SEDES.map(c=>Object.assign({slug:slugCidade(c.nome)},c));
}
function cidade(slug){return slug?cidades().find(c=>c.slug===slug)||null:null;}

/* FNV-1a de 32 bits: estável entre navegadores e Node */
function _hashSede(txt){
  let h=0x811c9dc5;
  for(let i=0;i<txt.length;i++){h^=txt.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
  return h>>>0;
}
/* gerador local (mulberry32), separado do rnd() do motor */
function _rngSede(semente){
  let a=semente>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return((t^(t>>>14))>>>0)/4294967296;};
}
function _sortearPeso(lista,peso,r){
  const tot=lista.reduce((s,c)=>s+peso(c),0);
  if(!tot)return null;
  let x=r()*tot;
  for(const c of lista){x-=peso(c);if(x<0)return c;}
  return lista[lista.length-1];
}

/* As sedes de um ano, sorteadas na primeira vez que alguém pergunta. */
function sedesDoAno(ano){
  if(!G)return null;
  if(!G.sedes)G.sedes={};
  if(G.sedes[ano]){if(ano>=2027)sedesRegionais(ano,G.sedes[ano]);return G.sedes[ano];}
  if(typeof SEDES_REAIS!=='undefined'&&SEDES_REAIS[ano])return SEDES_REAIS[ano];
  /* nada antes do histórico real: o sorteio começa em 2027 */
  if(ano<2027)return null;
  const recentes=new Set();
  for(let k=1;k<=SEDE_ANOS_SEM_REPETIR;k++){
    const s=sedesDoAno(ano-k);
    if(s)SEDE_EVENTOS.forEach(e=>s[e]&&recentes.add(s[e]));
  }
  const r=_rngSede(_hashSede('sedes|'+(G.seed||1)+'|'+ano));
  const todas=cidades().filter(c=>!recentes.has(c.slug));
  /* catálogo pequeno demais (editado no Banco de dados): relaxa a regra de
     não repetir em vez de deixar o torneio sem sede */
  const base=todas.length>=4?todas:cidades();
  const out={};
  const ch=_sortearPeso(base.filter(c=>c.tipo==='champions'),()=>1,r)
         ||_sortearPeso(base,()=>1,r);
  out.champions=ch?ch.slug:null;
  const pesoM=c=>c.maior?1:SEDE_PESO_FORA_DA_MAIOR;
  const m1=_sortearPeso(base.filter(c=>c.slug!==out.champions),pesoM,r);
  out.masters1=m1?m1.slug:null;
  const m2=_sortearPeso(base.filter(c=>c.slug!==out.champions&&c.slug!==out.masters1
           &&(!m1||c.pais!==m1.pais)),pesoM,r)
         ||_sortearPeso(base.filter(c=>c.slug!==out.champions&&c.slug!==out.masters1),pesoM,r);
  out.masters2=m2?m2.slug:null;
  sedesRegionais(ano,out);
  G.sedes[ano]=out;
  return out;
}
/* Completa o ano com as sedes regionais (também em saves de antes desta
   regra, sem mexer nas internacionais já sorteadas). */
function sedesRegionais(ano,out){
  if(out['stage2_AMER']!==undefined)return out;
  const r=_rngSede(_hashSede('sedesreg|'+(G.seed||1)+'|'+ano));
  const usadas=new Set(SEDE_EVENTOS.map(e=>out[e]).filter(Boolean));
  const ant=G.sedes&&G.sedes[ano-1]||{};
  const daRegiao=R=>cidades().filter(c=>REGIAO_DA_CIDADE[c.pais]===R&&!usadas.has(c.slug));
  for(const ev of SEDE_REGIONAIS)for(const R of SEDE_REGIOES){
    const id=ev+'_'+R;
    let pool=daRegiao(R);
    if(!pool.length)pool=daRegiao(SEDE_VIZINHA[R]);
    if(!pool.length)pool=cidades().filter(c=>!usadas.has(c.slug));
    if(!pool.length){out[id]=null;continue;}
    /* não repete a mesma cidade do mesmo torneio do ano anterior, se der */
    const semRepetir=pool.filter(c=>c.slug!==ant[id]);
    if(semRepetir.length)pool=semRepetir;
    const peso=ev==='stage2'?(c=>c.maior?3:1):(ev==='split1'||ev==='split2'||ev==='asc')?(c=>c.maior?1:2):(()=>1);
    const c=_sortearPeso(pool,peso,r);
    out[id]=c?c.slug:null;
    if(c)usadas.add(c.slug);
  }
  return out;
}
/* A cidade de um torneio internacional (id do catálogo de torneios). */
function sedeDe(torneioId,ano){
  if(!torneioId)return null;
  const s=sedesDoAno(ano||G.ano);
  return s&&s[torneioId]?cidade(s[torneioId]):null;
}
/* Nome com a cidade: "Masters Osaka", "Champions Paris". Sem sede (catálogo
   vazio, torneio regional), devolve null e quem chamou usa o nome de sempre. */
function nomeComSede(torneioId,ano){
  if(!SEDE_EVENTOS.includes(torneioId))return null;   /* regional não leva o nome da cidade */
  const c=sedeDe(torneioId,ano);
  if(!c)return null;
  return (torneioId==='champions'?'Champions ':'Masters ')+c.nome;
}

/* ---------- troféus ----------
   Champions e Masters: uma variante numerada por cidade, sempre a mesma
   para a mesma cidade (hash do nome), entre as que existirem na pasta.
   Regionais: um por torneio e região. Prêmios da temporada: premio-<tipo>. */
const TROFEU_VARIANTES_MAX=10;
const TROFEU_PREFIXO={kickoff:'kickoff',stage1:'stage1',stage2:'stage2',
                      split1:'challengers',split2:'challengers',asc:'ascension'};
const TROFEU_REGIAO={AMER:'amer',EMEA:'emea',PAC:'pac',CN:'cn'};
function _variantesTrofeu(tipo){
  if(typeof MIDIA==='undefined'||!MIDIA.arquivos)return TROFEU_VARIANTES_MAX;
  let n=0;
  for(let i=1;i<=TROFEU_VARIANTES_MAX;i++)
    if(MIDIA.arquivos['trofeus/'+tipo+'-'+String(i).padStart(2,'0')])n=i;else break;
  return n||TROFEU_VARIANTES_MAX;
}
/* nome do arquivo (sem pasta e sem extensão) do troféu de um torneio */
function arquivoTrofeu(torneioId,ano){
  if(torneioId==='champions'||torneioId==='masters1'||torneioId==='masters2'){
    const tipo=torneioId==='champions'?'champions':'masters';
    const c=sedeDe(torneioId,ano);
    const n=_variantesTrofeu(tipo);
    const v=c?(_hashSede(c.slug)%n)+1:1;
    return tipo+'-'+String(v).padStart(2,'0');
  }
  const corte=String(torneioId||'').indexOf('_');
  if(corte>0){
    const pre=TROFEU_PREFIXO[torneioId.slice(0,corte)];
    const reg=TROFEU_REGIAO[torneioId.slice(corte+1)];
    if(pre&&reg)return pre+'-'+reg;
  }
  return 'padrao';
}
function arquivoTrofeuPremio(tipo){return 'premio-'+String(tipo).replace('regional','mvp-regional');}

/* ---------- Banco de dados ---------- */
function edAplicarCidade(slug,c){
  if(!G.cidades)montarCidades();
  const x=G.cidades.find(k=>k.slug===slug);
  if(!x)return{ok:false,erro:'Cidade não encontrada.'};
  if(typeof c.nome==='string'&&c.nome.trim())x.nome=c.nome.trim();
  if(typeof c.pais==='string'&&/^[A-Z]{2}$/.test(c.pais))x.pais=c.pais;
  if(c.tipo==='champions'||c.tipo==='masters')x.tipo=c.tipo;
  if(c.maior!=null)x.maior=!!c.maior;
  return{ok:true};
}
function edAddCidade(nome,pais,tipo){
  if(!G.cidades)montarCidades();
  nome=String(nome||'').trim();
  if(!nome)return{ok:false,erro:'Dê um nome à cidade.'};
  const slug=slugCidade(nome);
  if(G.cidades.some(c=>c.slug===slug))return{ok:false,erro:nome+' já está na lista.'};
  if(!/^[A-Z]{2}$/.test(pais||''))return{ok:false,erro:'Escolha o país.'};
  G.cidades.push({slug,nome,pais,tipo:tipo==='champions'?'champions':'masters',maior:false});
  return{ok:true,msg:nome+' entrou na lista de sedes. A imagem vai em assets/cidades/'+slug+'.webp.'};
}
function edRemoverCidade(slug){
  if(!G.cidades)montarCidades();
  if(G.cidades.length<=6)return{ok:false,erro:'A lista precisa de pelo menos seis cidades.'};
  const resto=G.cidades.filter(c=>c.slug!==slug);
  if(resto.length===G.cidades.length)return{ok:false,erro:'Cidade não encontrada.'};
  if(!resto.some(c=>c.tipo==='champions'))
    return{ok:false,erro:'Sem nenhuma cidade de Champions o sorteio não fecha.'};
  G.cidades=resto;
  return{ok:true};
}

/* ============================================================
   COMISSÃO TÉCNICA
   ------------------------------------------------------------
   Antes staff era três números de 1 a 5 dentro do time. Agora são
   pessoas: têm nome, idade, país, atributos, contrato, salário e
   valor de mercado, evoluem com o trabalho e podem ser contratadas
   de outro clube.

   O que NÃO mudou de propósito: `t.staff` continua sendo um mapa
   cargo → nível 1..5, porque é assim que o motor de partida e o
   treino leem a comissão. A diferença é que agora esse mapa é
   DERIVADO de quem está contratado — atualizarComissao() recalcula
   — e é contínuo em vez de inteiro. Isso manteve as fórmulas de
   match.js e clock.js intactas e o balanceamento no lugar.

   NIVEL_NEUTRO é o ponto onde a comissão não muda nada: efeitos são
   escritos como (nivel-NIVEL_NEUTRO)*k. Ele NÃO é o meio da escala,
   e isso é de propósito — ver o comentário de ancoraNivel().
   ============================================================ */
function overStaff(m){
  if(!m)return 0;
  const w=CARGO_W[m.cargo]||CARGO_W.tecnico;
  let t=0;for(const k in w)t+=m.at[k]*w[k];
  return Math.round(t);
}
/* Converte over em nível 1..5, que é o que match.js e clock.js leem.

   A âncora acompanha a régua de padrao.js: o piso da divisão mais baixa vira
   nível 1 e o topo absoluto vira 5. Antes a âncora era 40, um over que hoje
   não existe mais em lugar nenhum — o efeito era todo o Tier 1 espremido
   entre 3.7 e 5.0, ou seja, comissão boa e comissão medíocre quase não se
   distinguiam e todo clube de Tier 1 ganhava bônus por existir.

   Com a âncora no piso real, Tier 2 fica de 1.0 a 2.7 e Tier 1 de 2.9 a 5.0.
   A escala é do MUNDO, não da divisão: um coach de Challengers não pode valer
   o mesmo que um da elite só por ser o melhor de Challengers, senão subir de
   divisão não significaria comissão melhor.

   Consequência: o ponto neutro não é o meio da escala. Metade do mundo é
   Tier 2, então a comissão "mediana do mundo" mora embaixo. Por isso
   NIVEL_NEUTRO é 2 e não 3 — é o que faz o Tier 2 poder investir e sair
   ganhando, em vez de tomar penalidade mesmo contratando o melhor da divisão,
   enquanto o Tier 1 (2.9 a 5.0) segue inteiramente acima do neutro, que é o
   que se espera dos 40 melhores clubes do mundo.

   O 2 não foi escolhido aqui: match.js já usava (tecnico*1.1+analista*0.9)-4,
   que zera exatamente no nível 2. Quem estava fora do compasso era clock.js,
   com um 3 escrito à mão. */
const NIVEL_NEUTRO=2;
function ancoraNivel(){
  const piso=(typeof FAIXAS!=='undefined'&&FAIXAS.comissao)?FAIXAS.comissao[2][0]:40;
  return{piso,passo:(99-piso)/4};
}
function nivelStaff(over){
  const{piso,passo}=ancoraNivel();
  return clamp(1+(over-piso)/passo,1,5);
}
/* Onde a comissão de um clube fica dentro da faixa da própria divisão.
   No Tier 1 é o prestígio. No Tier 2 todo clube tem o mesmo prestígio, então
   sem isto a divisão inteira empilhava no piso da faixa (62–73 de uma faixa
   que promete 62–78) e nenhum clube se distinguia. Lá quem separa é o
   público: torcida grande sustenta comissão melhor — a mesma régua que já
   diferencia o Tier 2 na economia. */
function pesoComissao(t){
  if(!t)return 0.5;
  if(t.tier===1)return pesoPrestigio(1,t.prestigio);
  const t2=Object.values(G.times).filter(x=>x.tier===2).map(x=>x.torcida||0);
  const lo=Math.min(...t2), hi=Math.max(...t2);
  return hi>lo?clamp(((t.torcida||lo)-lo)/(hi-lo),0,1):0.5;
}
function nivelDe(m){return nivelStaff(overStaff(m));}
/* Curva de potência, não linear: um coach de elite custa muitas vezes o preço de
   um mediano, que é o que separa quem pode contratar de quem não pode. Calibrada
   para a folha de uma comissão de Tier 1 bater o que a mesma comissão custava
   quando era só um nível numérico no custeio. */
function salarioStaff(m){
  const o=overStaff(m);
  return Math.max(300,Math.round(Math.pow(Math.max(PISO_SALARIO_STAFF+4,o)-PISO_SALARIO_STAFF,3)
                                  *K_SALARIO_STAFF/100)*100);
}
function valorStaff(m){
  const o=overStaff(m);
  let v=Math.pow(Math.max(PISO_SALARIO_STAFF+4,o)-PISO_SALARIO_STAFF,2.2)*90;
  v*= m.idade<=32?1.25:m.idade<=42?1.0:m.idade<=50?.7:.4;
  v*= 1+Math.max(0,m.pot-o)/110;
  return Math.round(v/500)*500;
}
function nomeStaffUnico(usados,genero){
  const pool=genero==='f'?SN1F:SN1M;
  for(let i=0;i<400;i++){
    const n=pick(pool)+' '+pick(SN2);
    if(!usados.has(n)){usados.add(n);return n;}
  }
  return 'Staff '+ri(1000,9999);
}
function criarMembro(cargo,alvo,pais,idade,usados,tier){
  const at={};
  const w=CARGO_W[cargo];
  for(const[k]of ATTRS_STAFF)at[k]=clamp(Math.round(gauss(alvo,8)),25,99);
  /* puxa os atributos-chave do cargo para o over bater no alvo */
  for(let it=0;it<14;it++){
    let cur=0;for(const k in w)cur+=at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.6)break;
    for(const k in w)at[k]=clamp(at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS_STAFF)at[k]=clamp(Math.round(at[k]),25,99);
  const genero=rnd()<0.18?'f':'m';
  const m={
    id:'s'+(G.seqS=(G.seqS||0)+1), nome:nomeStaffUnico(usados,genero), genero, cargo, pais, idade, at,
    pot:0, timeId:null, contrato:ri(1,3), salario:0, valor:0,
    temp:{v:0,d:0,titulos:0}, carreira:{anos:0,titulos:0}, hist:[]
  };
  const o=overStaff(m);
  m.pot=potencialStaffDe(o,idade,tier||2);
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  return m;
}

/* Reescala os atributos para bater um over alvo, preservando o perfil do
   cargo — o espelho de aplicarOver() para jogador. Existe porque tanto a
   promoção ao topo quanto a padronização da base precisam MOVER alguém já
   criado, e mexer no over sem mexer nos atributos deixaria os dois
   discordando (o over é derivado, não armazenado). */
function aplicarOverStaff(m,alvo){
  const w=CARGO_W[m.cargo]||CARGO_W.tecnico;
  for(let it=0;it<24;it++){
    let cur=0;for(const k in w)cur+=m.at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.4)break;
    for(const k in w)m.at[k]=clamp(m.at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS_STAFF)m.at[k]=clamp(Math.round(m.at[k]),25,99);
  const principal=Object.keys(w).sort((a,b)=>w[b]-w[a]);
  for(let i=0;i<16&&overStaff(m)!==alvo;i++){
    const k=principal[i%principal.length];
    m.at[k]=clamp(m.at[k]+(overStaff(m)<alvo?1:-1),25,99);
  }
  m.pot=Math.max(m.pot,overStaff(m));
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  return m;
}

/* recalcula t.staff a partir de quem está contratado.
   Vaga aberta vale nível 1: o clube fica com um interino ruim, não com nada. */
function atualizarComissao(t){
  if(!t)return null;
  if(!t.comissao)t.comissao={};
  t.staff=t.staff||{};
  for(const c of CARGOS){
    const m=t.comissao[c.id]&&G.staff?G.staff[t.comissao[c.id]]:null;
    t.staff[c.id]=m?nivelDe(m):1;
  }
  return t.staff;
}
function membroDe(t,cargo){
  const id=t&&t.comissao?t.comissao[cargo]:null;
  return id&&G.staff?G.staff[id]||null:null;
}
function comissaoDe(t){return CARGOS.map(c=>({cargo:c,membro:membroDe(t,c.id)}));}
function folhaStaff(t){
  return CARGOS.reduce((s,c)=>{const m=membroDe(t,c.id);return s+(m?m.salario:0);},0);
}

/* ---------- movimentação ---------- */
/* Igual ao Editor de jogadores: mover aqui é edição de base, não transferência.
   Quem mexe em dinheiro é executarPropostaStaff(). */
function moverStaff(sid,destinoId,cargo){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const destino=destinoId?G.times[destinoId]:null;
  if(destinoId&&!destino)return{ok:false,erro:'Clube de destino não encontrado.'};
  cargo=cargo||m.cargo;
  if(!CARGOS.some(c=>c.id===cargo))return{ok:false,erro:'Cargo inválido.'};
  const origem=m.timeId?G.times[m.timeId]:null;
  if(origem){
    for(const c of CARGOS)if(origem.comissao[c.id]===sid)origem.comissao[c.id]=null;
    atualizarComissao(origem);
  }
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==sid);
  if(destino){
    /* quem já ocupava a vaga vai para o mercado */
    const antigo=destino.comissao[cargo];
    if(antigo&&antigo!==sid){
      const a=G.staff[antigo];
      if(a){a.timeId=null;a.contrato=0;G.staffLivres.push(antigo);}
    }
    m.cargo=cargo;m.timeId=destino.id;
    if(!m.contrato)m.contrato=ri(1,3);
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    destino.comissao[cargo]=sid;
    atualizarComissao(destino);
  }else{
    m.timeId=null;m.contrato=0;
    G.staffLivres.push(sid);
  }
  return{ok:true,msg:m.nome+(destino?' virou '+cargo+' do '+destino.tag:' está sem clube')+'.'};
}
function liberarStaff(sid){return moverStaff(sid,null);}
function apagarStaff(sid){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const t=m.timeId?G.times[m.timeId]:null;
  if(t){for(const c of CARGOS)if(t.comissao[c.id]===sid)t.comissao[c.id]=null;atualizarComissao(t);}
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==sid);
  delete G.staff[sid];
  return{ok:true,msg:m.nome+' apagado da base.'};
}
function nomesStaffUsados(){return new Set(Object.values(G.staff||{}).map(m=>m.nome));}
function criarStaffLivre(campos){
  campos=campos||{};
  const R=REGIONS.find(r=>r.id===campos.regiao)||pick(REGIONS);
  const m=criarMembro(
    CARGOS.some(c=>c.id===campos.cargo)?campos.cargo:pick(CARGOS).id,
    clamp(campos.over||ri(48,72),30,99),
    campos.pais||pick(R.paises),
    clamp(campos.idade||ri(28,48),20,70),
    nomesStaffUsados());
  if(campos.nome)m.nome=campos.nome;
  if(campos.genero==='f'||campos.genero==='m')m.genero=campos.genero;
  m.contrato=0;m.regiaoOrigem=R.id;
  G.staff[m.id]=m;(G.staffLivres=G.staffLivres||[]).push(m.id);
  return{ok:true,id:m.id,msg:m.nome+' entrou no mercado.'};
}

/* ---------- mercado ---------- */
function pedidoStaff(m){
  if(!m.timeId)return 0;
  return Math.round(m.valor*(1+m.contrato*0.16)/500)*500;
}
function salarioPedidoStaff(m,destino){
  const base=salarioStaff(m);
  const orig=m.timeId?G.times[m.timeId].prestigio:55;
  const gap=orig-destino.prestigio;
  /* ex-jogador que volta para um clube onde jogou pede menos */
  const casa=typeof voltaParaCasa==='function'&&voltaParaCasa(m,destino)?DESCONTO_EX_CLUBE:1;
  return Math.round(base*(1.08+Math.max(0,gap)*0.010)*casa/100)*100;
}
function avaliarPropostaStaff(m,destino,cargo,taxa,sal,anos){
  const motivos=[];
  if(cargo==='tecnico'&&destino&&destino.id===G.meuTime&&typeof souTreinador==='function'&&souTreinador()&&!(G.manager&&G.manager.demitido))
    motivos.push('Você é o head coach do clube: a vaga não está aberta.');
  if(m.voce)motivos.push('Esse é você.');
  if(m.timeId){
    const pedido=pedidoStaff(m);
    if(taxa<pedido*0.92)motivos.push('O clube pede cerca de '+money(pedido)+' para liberar.');
  }
  const pd=salarioPedidoStaff(m,destino);
  if(sal<pd*0.95)motivos.push('Ele quer perto de '+money(pd)+'/mês.');
  if(anos<1||anos>4)motivos.push('Duração de contrato inaceitável.');
  if(destino.caixa<taxa)motivos.push('Caixa insuficiente.');
  if(m.cargo!==cargo&&overStaff(m)<55)
    motivos.push('Ele não se vê fora da função de '+m.cargo+'.');
  return motivos;
}
function executarPropostaStaff(m,destino,cargo,taxa,sal,anos){
  const origem=m.timeId?G.times[m.timeId]:null;
  destino.caixa-=taxa;if(origem)origem.caixa+=taxa;
  moverStaff(m.id,destino.id,cargo);
  m.salario=sal;m.contrato=anos;
  noticia('🎓 '+m.nome+' é o novo '+cargo+' do '+destino.nome+
          (taxa?' por '+money(taxa):' (livre)')+'.',{c:'mercado',t:[destino.id]});
}
/* a IA preenche vagas e troca quem está muito abaixo do prestígio do clube */
function mercadoStaffIA(){
  const livres=()=>(G.staffLivres||[]).map(i=>G.staff[i]).filter(Boolean);
  for(const t of Object.values(G.times).sort((a,b)=>b.prestigio-a.prestigio)){
    if(t.id===G.meuTime)continue;
    for(const c of CARGOS){
      const atual=membroDe(t,c.id);
      /* O alvo tem de morar dentro da faixa da divisão. A conta anterior
         mandava o Tier 2 para um over de ~52, que não existe na régua: dava
         nível 1 para todo mundo, e com alvo 1 a IA nunca trocava ninguém —
         a comissão de Challengers ficava congelada no pior nível possível. */
      const alvoNivel=nivelStaff(overAlvoPeso('comissao',t.tier,pesoComissao(t),0));
      if(atual&&nivelDe(atual)>=alvoNivel-0.7)continue;
      /* O caixa diz o que o clube tem; a folga salarial diz o que a receita
         sustenta. Só o caixa era conferido, e a comissão virava um custo fixo
         que sobrevivia à queda de receita do clube — parte do buraco de quem
         cai de divisão vinha daqui, não do elenco. */
      const folgaAno=(typeof folgaSalarial==='function')?folgaSalarial(t)*12:Infinity;
      const teto=Math.min(Math.max(40000,t.caixa*0.25),
                          Math.max(0,folgaAno+(atual?atual.salario*12:0)));
      const cand=livres()
        .filter(m=>salarioStaff(m)*12<teto)
        .sort((a,b)=>(overStaff(b)+(b.cargo===c.id?6:0)+(voltaParaCasa(b,t)?3:0))-(overStaff(a)+(a.cargo===c.id?6:0)+(voltaParaCasa(a,t)?3:0)))[0];
      if(!cand)continue;
      if(atual&&overStaff(cand)<=overStaff(atual))continue;
      moverStaff(cand.id,t.id,c.id);
    }
  }
}

/* ---------- evolução ---------- */
/* Trabalho e resultado movem o over; o teto é o potencial e a idade cobra depois
   dos 50. Um coach que ganha título sobe mais do que um que só cumpre tabela. */
function evoluirStaff(){
  const usados=nomesStaffUsados();
  for(const id in G.staff){
    const m=G.staff[id];
    /* você: evolução própria, sem aposentadoria nem fim de contrato e sem
       tocar no gerador (core/manager.js) */
    if(m.voce){if(typeof evoluirManagerStaff==='function')evoluirManagerStaff(m);continue;}
    const t=m.timeId?G.times[m.timeId]:null;
    const jogos=m.temp.v+m.temp.d;
    const aprov=jogos?m.temp.v/jogos:0.5;
    m.hist.push({ano:G.ano,time:t?t.nome:'Sem clube',over:overStaff(m),
                 v:m.temp.v,d:m.temp.d,titulos:m.temp.titulos});
    if(m.hist.length>12)m.hist.shift();
    m.carreira.anos++;m.carreira.titulos+=m.temp.titulos;
    const o=overStaff(m),gap=m.pot-o;
    let g=0;
    if(t){
      const base = m.idade<=32?.55 : m.idade<=40?.38 : m.idade<=48?.22 : .08;
      g = gap*0.10*base + (aprov-0.5)*2.2 + m.temp.titulos*1.6;
    }else g=-0.6;                       /* parado, enferruja */
    if(m.idade>=52)g-=(m.idade-51)*0.35;
    /* o potencial é teto, não marca d'água: sem este corte um coach campeão
       subia 3 pontos por ano para sempre e a base inteira encostava em 99 */
    if(g>0)g=Math.min(g,Math.max(0,gap)*0.35);
    if(Math.abs(g)>0.05){
      const w=CARGO_W[m.cargo];
      const chaves=Object.keys(w).sort((a,b)=>w[b]-w[a]);
      chaves.forEach((k,i)=>{m.at[k]=clamp(m.at[k]+g*(i<2?0.8:0.4),25,99);});
      for(const[k]of ATTRS_STAFF)m.at[k]=clamp(Math.round(m.at[k]),25,99);
    }
    m.pot=Math.max(m.pot,overStaff(m));
    m.idade++;m.contrato=Math.max(0,m.contrato-1);
    m.temp={v:0,d:0,titulos:0};
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    /* aposentadoria */
    const chance = m.idade>=66?1 : m.idade>=60?.35 : m.idade>=55?.12 : 0;
    if(rnd()<chance){
      if(t&&t.id===G.meuTime)noticia('👔 '+m.nome+' se aposentou aos '+m.idade+' anos.',{c:'clube',t:[t.id]});
      apagarStaff(id);continue;
    }
    if(!m.contrato&&t){
      if(t.id===G.meuTime){noticia('📄 '+m.nome+' encerrou contrato e deixou a comissão.',{c:'clube',t:[t.id]});liberarStaff(id);}
      else if(rnd()<.80)m.contrato=ri(2,3);
      else liberarStaff(id);
    }
  }
  /* Rede de segurança do clube do jogador: a IA não contrata por você, mas
     deixar a comissão vazia por esquecimento vira nível 1 em tudo sem aviso.
     A diretoria põe um interino e avisa — mesma lógica do elenco abaixo de 5. */
  const meu=G.meuTime?G.times[G.meuTime]:null;
  if(meu){
    for(const c of CARGOS){
      if(membroDe(meu,c.id))continue;
      /* interino é solução de emergência, não upgrade grátis: pega o do meio da
         lista, nunca o melhor, e por um ano só. Quem quer comissão boa contrata
         no Mercado. */
      const pool=(G.staffLivres||[]).map(i=>G.staff[i]).filter(Boolean)
        .filter(x=>x.cargo===c.id).sort((a,b)=>overStaff(a)-overStaff(b));
      let cand=pool.length?pool[Math.floor(pool.length/2)]:null;
      if(!cand){
        const r=criarStaffLivre({cargo:c.id,over:clamp(Math.round(gauss(50,6)),36,66)});
        cand=G.staff[r.id];
      }
      moverStaff(cand.id,meu.id,c.id);
      cand.contrato=1;
      noticia('⚠ '+c.nome+' vago: a diretoria pôs '+cand.nome+' como interino por um ano.',{c:'clube',t:[meu.id]});
    }
  }

  /* reposição do mercado */
  const faltam=Math.max(0,26-(G.staffLivres||[]).length);
  for(let i=0;i<faltam;i++)criarStaffLivre({over:clamp(Math.round(gauss(60,10)),38,88)});
  if(G.staffLivres.length>90){
    const ord=G.staffLivres.map(i=>G.staff[i]).filter(Boolean)
      .sort((a,b)=>overStaff(b)+(b.ex?8:0)-overStaff(a)-(a.ex?8:0));
    ord.slice(90).forEach(m=>{delete G.staff[m.id];});
    G.staffLivres=ord.slice(0,90).map(m=>m.id);
  }
  Object.values(G.times).forEach(atualizarComissao);
}

/* ---------- comissão real ----------
   A função vem da Liquipedia, em inglês e sem padrão fixo ("Head Coach",
   "Coach", "Head of Performance"). A ordem dos testes importa: "assistant
   coach" contém "coach", então o assistente é lido antes do técnico. */
function cargoDeFuncao(f){
  const s=String(f||'').toLowerCase();
  if(/assist|analy|strateg/.test(s))return 'analista';
  if(/perform|mental|psych/.test(s))return 'mental';
  if(/physio|fisio/.test(s))return 'fisio';
  if(/scout|olheiro/.test(s))return 'olheiro';
  if(/coach|t[eé]cnico/.test(s))return 'tecnico';
  return null;
}
/* Distribui a comissão real de um clube pelos cargos do jogo. Quem não tem
   cargo (manager) ou chega com o cargo já ocupado vai para `extra`: entra no
   clube com nome e foto, sem efeito em partida. Leitura pura, sem sorteio. */
function comissaoRealDe(tag){
  const lista=typeof COMISSAO_REAL!=='undefined'?COMISSAO_REAL[tag]:null;
  const cargos={},extra=[];
  for(const l of lista||[]){
    const [nick,funcao,nomeReal,pais]=l;
    if(!nick)continue;
    const r={nick:String(nick).trim(),funcao:funcao||'',nomeReal:nomeReal||'',pais:pais||''};
    let c=cargoDeFuncao(funcao);
    /* segundo técnico ("Coach" ao lado do "Head Coach") é auxiliar na prática */
    if(c==='tecnico'&&cargos.tecnico)c='analista';
    if(c&&!cargos[c])cargos[c]=r;else extra.push(r);
  }
  return{cargos,extra};
}

/* ---------- semeadura ---------- */
function montarStaff(){
  G.staff={};G.staffLivres=[];G.seqS=0;
  const usados=new Set();
  /* nome real reservado antes de gerar qualquer fictício, como os nicks em
     world.js: sem isso o gerador poderia batizar alguém com o nick de um
     técnico de verdade */
  if(typeof COMISSAO_REAL!=='undefined')
    for(const tag in COMISSAO_REAL)for(const l of COMISSAO_REAL[tag])if(l[0])usados.add(String(l[0]).trim());
  for(const id in G.times){
    const t=G.times[id];
    t.comissao={};
    const R=REGIONS.find(r=>r.id===t.regiao);
    const real=comissaoRealDe(t.tag);
    t.equipeExtra=real.extra.map(r=>({nome:r.nick,nomeReal:r.nomeReal,funcao:r.funcao,
      pais:r.pais,real:true}));
    for(const c of CARGOS){
      /* Challengers emprega comissão mais barata, e é isso que mantém a divisão
         viável: com o mesmo padrão do Tier 1 a folha comeria o patrocínio */
      /* A régua está em padrao.js: Tier 1 80–99, Tier 2 62–78. Challengers
         continua empregando comissão mais barata — é isso que mantém a
         divisão viável — mas deixou de empregar amador. */
      const alvo=overAlvoPeso('comissao',t.tier,pesoComissao(t),3);
      const m=criarMembro(c.id,alvo,pick(R.paises),ri(27,52),usados,t.tier);
      aplicarOverStaff(m,alvo);m.pot=potencialStaffDe(alvo,m.idade,t.tier);
      /* a pessoa real ocupa o membro já sorteado: atributos, idade e contrato
         seguem a régua do clube, e o fluxo do gerador fica idêntico ao de um
         mundo sem comissão real */
      const r=real.cargos[c.id];
      if(r){m.nome=r.nick;m.nomeReal=r.nomeReal;m.funcao=r.funcao;if(r.pais)m.pais=r.pais;m.real=true;}
      m.timeId=t.id;G.staff[m.id]=m;t.comissao[c.id]=m.id;
    }
    atualizarComissao(t);
  }
  /* Mercado de comissão: como no de jogadores, a maioria serve ao Tier 2 e
     uma minoria é opção de verdade para o Tier 1. */
  for(let i=0;i<40;i++){
    const paraT1=rnd()<0.3;
    criarStaffLivre({over:paraT1?overAlvo('comissao',1,ri(58,74),4)
                                :overAlvo('comissao',2,ri(45,58),4)});
  }
  promoverComissaoAoTopo();
  return G.staff;
}
/* runs anteriores à v6 tinham só os níveis; recria gente equivalente para
   que a força do clube não mude ao carregar um save antigo */
function migrarStaffAntigo(){
  G.staff={};G.staffLivres=[];G.seqS=0;
  const usados=new Set();
  for(const id in G.times){
    const t=G.times[id];
    const antigos=t.staff||{};
    t.comissao={};
    const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
    for(const c of CARGOS){
      const nivel=antigos[c.id]||3;
      const a=ancoraNivel();
      const alvo=clamp(Math.round(a.piso+(nivel-1)*a.passo),FAIXAS.comissao[2][0],97);
      const m=criarMembro(c.id,alvo,pick(R.paises),ri(28,50),usados);
      m.timeId=t.id;G.staff[m.id]=m;t.comissao[c.id]=m.id;
    }
    atualizarComissao(t);
  }
  for(let i=0;i<40;i++)criarStaffLivre({over:clamp(Math.round(gauss(58,10)),38,86)});
}

/* aplica um patch completo de membro da comissão */
function edAplicarStaff(sid,c){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const antes=m.nome;
  if(typeof c.nome==='string'&&c.nome.trim())m.nome=c.nome.trim();
  if(CARGOS.some(x=>x.id===c.cargo)&&c.cargo!==m.cargo){
    const t=m.timeId?G.times[m.timeId]:null;
    if(t){ /* trocar de cargo dentro do clube move a vaga junto */
      for(const x of CARGOS)if(t.comissao[x.id]===sid)t.comissao[x.id]=null;
      const antigo=t.comissao[c.cargo];
      if(antigo&&antigo!==sid){const a=G.staff[antigo];
        if(a){a.timeId=null;a.contrato=0;(G.staffLivres=G.staffLivres||[]).push(antigo);}}
      t.comissao[c.cargo]=sid;
    }
    m.cargo=c.cargo;
  }
  if(c.idade!=null)m.idade=clamp(parseInt(c.idade)||m.idade,20,70);
  if(typeof c.pais==='string'&&c.pais.trim())m.pais=c.pais.trim().toUpperCase().slice(0,2);
  if(c.genero==='f'||c.genero==='m')m.genero=c.genero;
  if(c.at)for(const[k]of ATTRS_STAFF)
    if(c.at[k]!=null)m.at[k]=clamp(parseFloat(c.at[k]),25,99);
  if(c.pot!=null)m.pot=clamp(parseInt(c.pot)||m.pot,overStaff(m),99);
  else m.pot=Math.max(m.pot,overStaff(m));
  if(c.contrato!=null)m.contrato=clamp(parseInt(c.contrato)||0,0,6);
  if(c.salario!=null)m.salario=Math.max(0,Math.round(parseFloat(c.salario)||0));
  else m.salario=salarioStaff(m);
  if(c.foto!=null)m.foto=String(c.foto).trim()||undefined;
  m.valor=valorStaff(m);
  if(m.timeId)atualizarComissao(G.times[m.timeId]);
  return{ok:true,renomeado:antes!==m.nome?{de:antes,para:m.nome}:null};
}

/* ============================================================
   VESTIÁRIO — mental, desgaste e entrosamento
   ------------------------------------------------------------
   Em e-sports o que decide jogo é a cabeça, não a perna. Até aqui a
   fadiga tirava até 22% da condição do jogador e a moral inteira
   mexia 14% — a proporção de um esporte físico. Agora:

     forma     a fase técnica, sobe e desce com o desempenho    (igual)
     desgaste  o cansaço de jogo e viagem                       até 8%
     mental    confiança (nova) + moral                         até 22%

   CONFIANÇA (p.confianca, 0..1) é o estado de jogo: sobe com vitória
   e com jogar acima do próprio normal, cai com derrota — cada derrota
   de uma sequência pesa mais que a anterior — e as decisões (final,
   eliminação) mexem em dobro. O preparador mental amortece as quedas
   e acelera a volta; um IGL de liderança alta segura o time depois de
   uma derrota. A MORAL continua sendo o que era: satisfação com
   clube, contrato e minutos. O mental do jogador é a mistura das duas.

   ENTROSAMENTO deixa de ser um número só do clube e passa a ser de cada
   DUPLA de jogadores (t.duplas). O do time — t.sinergia, que o motor de
   partida lê — é a média das dez duplas entre os titulares, recalculada
   sempre que o cinco muda. Por isso trocar um titular derruba o
   entrosamento sem precisar de um "-8" escrito à mão: as quatro duplas
   do recém-chegado começam do zero que ele tem com cada um.

   Nada aqui consome o gerador do motor: são contas determinísticas.
   ============================================================ */

/* ---------- mental ---------- */
const CONF_INICIAL=0.6;
const CONF_PESO=0.6;                 /* mental = 60% confiança + 40% moral */
const CONF_VITORIA=0.03, CONF_DERROTA=0.04;
const CONF_DECISAO=2;                /* final e eliminação mexem em dobro */
const CONF_SEQUENCIA=0.15;           /* cada derrota seguida pesa +15%, até 4 */
/* Resultado sozinho não afunda ninguém abaixo disto: o fundo do poço existe,
   mas sem ele uma sequência ruim virava espiral (medido: sequências maiores
   em todo o circuito sem o piso). */
const CONF_PISO_RESULTADO=0.3;
const CONF_DESEMPENHO=0.06;          /* jogar 100% acima do normal = +0.06 */
const CONF_VOLTA=0.04;               /* por semana, de volta ao ponto de equilíbrio */

function confiancaDe(p){return typeof p.confianca==='number'?p.confianca:CONF_INICIAL;}
function mentalDe(p){return CONF_PESO*confiancaDe(p)+(1-CONF_PESO)*(p.moral==null?0.6:p.moral);}

/* Nível do preparador mental, neutro em NIVEL_NEUTRO (staff.js). */
function _nivelMental(t){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  return{n:(t&&t.staff&&t.staff.mental)||neutro,neutro};
}
/* Quanto de uma queda de confiança passa: preparador bom e IGL líder seguram. */
function amortecedor(t){
  const {n,neutro}=_nivelMental(t);
  const igl=t&&t.igl&&G.jogadores[t.igl];
  const lider=igl?igl.at.lider:60;
  return clamp((1-(n-neutro)*0.12)*(1-(lider-60)/400),0.55,1.3);
}
/* Uma série jogada: resultado do time, sequência e desempenho de cada um. */
function confiancaPosSerie(t,ganhou,decisiva,agg){
  t.seq=ganhou?Math.max(1,(t.seq>0?t.seq+1:1)):Math.min(-1,(t.seq<0?t.seq-1:-1));
  const derrotas=Math.max(0,-t.seq);
  const peso=decisiva?CONF_DECISAO:1;
  const amort=amortecedor(t);
  for(const id of t.titulares||[]){
    const p=G.jogadores[id];if(!p)continue;
    let d=ganhou?CONF_VITORIA*peso:-CONF_DERROTA*peso*(1+CONF_SEQUENCIA*Math.min(4,derrotas-1));
    /* desempenho contra o próprio normal: K/D da série sobre o da carreira */
    const s=agg&&agg[id];
    if(s&&s.maps){
      const kdSerie=s.d?s.k/s.d:Math.min(2,s.k||1);
      const c=p.carreira||{};
      const kdNormal=c.maps>=20&&c.d?c.k/c.d:1;
      d+=clamp((kdSerie/Math.max(0.4,kdNormal)-1)*CONF_DESEMPENHO,-0.05,0.05);
    }
    if(d<0){d*=amort;p.confianca=Math.max(Math.min(confiancaDe(p),CONF_PISO_RESULTADO),confiancaDe(p)+d);}
    else p.confianca=clamp(confiancaDe(p)+d,0.1,1);
  }
}
/* A semana: a confiança volta devagar para o ponto de equilíbrio, mais
   rápido com preparador bom; desgaste demais (burnout) derruba. */
function confiancaSemanal(t,p){
  const {n,neutro}=_nivelMental(t);
  const alvo=CONF_INICIAL+(n-neutro)*0.03;
  const c=confiancaDe(p);
  p.confianca=clamp(c+(alvo-c)*(CONF_VOLTA+(n-neutro)*0.01),0.1,1);
  if(p.fadiga>0.82)p.confianca=clamp(p.confianca-0.02,0.1,1);
}

/* ---------- entrosamento por dupla ---------- */
const DUPLA_POR_SERIE=0.7;           /* era o +0.7 do time por série */
const DUPLA_SCRIM=0.30;              /* por ponto de scrim acima de 3, por semana */
const DUPLA_VIRADA=4;                /* pré-temporada juntos */
const DUPLA_CONVIVENCIA=0.15, DUPLA_TETO_CONVIVENCIA=55;

function chaveDupla(a,b){return a<b?a+'|'+b:b+'|'+a;}
function _mesmaLingua(p,q){
  if(p.pais===q.pais)return true;
  const lusofono=['BR','PT'],hispano=['AR','CL','MX','ES','CO','PE','UY','VE','EC','BO','PY','GT','CR','DO','PR','SV','HN','NI','PA'];
  const anglo=['US','CA','GB','AU','NZ','IE'];
  return [lusofono,hispano,anglo].some(g=>g.includes(p.pais)&&g.includes(q.pais));
}
/* De onde uma dupla nova começa: perto da média do time, mais perto quando
   falam a mesma língua e quando as funções se completam. */
function duplaInicial(t,p,q,base){
  let v=(base==null?35:base);
  v+=_mesmaLingua(p,q)?5:-4;
  if(p.role===q.role&&p.role!=='Flex')v-=4;
  return clamp(v,0,100);
}
function duplas(t){if(!t.duplas)t.duplas={};return t.duplas;}
function dupla(t,a,b){
  const D=duplas(t),k=chaveDupla(a,b);
  if(D[k]==null){
    const p=G.jogadores[a],q=G.jogadores[b];
    D[k]=p&&q?duplaInicial(t,p,q,25):25;
  }
  return D[k];
}
function mexerDupla(t,a,b,d){
  if(a===b)return;
  const D=duplas(t),k=chaveDupla(a,b);
  D[k]=clamp(dupla(t,a,b)+d,0,100);
}
function paresDe(ids){
  const out=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)out.push([ids[i],ids[j]]);
  return out;
}
/* O entrosamento do time é o dos cinco que jogam. */
function sinergiaDe(t){
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const pr=paresDe(tit);
  if(!pr.length)return t.sinergia||50;
  return pr.reduce((s,[a,b])=>s+dupla(t,a,b),0)/pr.length;
}
function atualizarSinergia(t){
  if(!t||!t.titulares)return;
  t.sinergia=Math.round(sinergiaDe(t)*10)/10;
}
/* Save e base de antes das duplas: todo par do elenco nasce do número antigo
   do clube, com o ajuste de língua e função. A média dos titulares fica
   perto de onde estava. */
function semearDuplas(t){
  if(t.duplas&&Object.keys(t.duplas).length)return;
  t.duplas={};
  const base=typeof t.sinergia==='number'?t.sinergia:50;
  for(const [a,b] of paresDe(t.elenco||[])){
    const p=G.jogadores[a],q=G.jogadores[b];if(!p||!q)continue;
    t.duplas[chaveDupla(a,b)]=duplaInicial(t,p,q,base);
  }
  /* recentra: a média dos titulares volta ao número antigo, e as diferenças
     entre duplas ficam */
  const agora=sinergiaDe(t),dif=base-agora;
  for(const k in t.duplas)t.duplas[k]=clamp(t.duplas[k]+dif,0,100);
  atualizarSinergia(t);
}
/* Saiu do elenco: as duplas dele somem (voltar um dia começa de novo). */
function esquecerDuplas(t,id){
  const D=duplas(t);
  for(const k of Object.keys(D)){const [a,b]=k.split('|');if(a===id||b===id)delete D[k];}
}
/* Chegou ao elenco: duplas novas, abaixo da média do time. */
function chegarAoElenco(t,id){
  const p=G.jogadores[id];if(!p)return;
  const media=sinergiaDe(t);
  for(const o of t.elenco||[]){
    if(o===id)continue;const q=G.jogadores[o];if(!q)continue;
    duplas(t)[chaveDupla(id,o)]=duplaInicial(t,p,q,Math.min(media,40)-8);
  }
}

/* Série jogada: quem jogou junto se entende mais, vitória dura mais ainda,
   e sequência de derrota corrói. */
function entrosamentoPosSerie(t,ganhou,decisiva){
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const extra=ganhou&&decisiva?0.3:0;
  const corroi=!ganhou&&t.seq<=-3?0.5:0;
  for(const [a,b] of paresDe(tit))mexerDupla(t,a,b,DUPLA_POR_SERIE+extra-corroi);
  atualizarSinergia(t);
}
/* O que mexe no entrosamento numa semana, com o motivo — a mesma lista que a
   tela mostra. Cada item: {txt, delta, pares:[[a,b]...]}. */
function fatoresDaSemana(t){
  const out=[];
  const el=(t.elenco||[]).filter(id=>G.jogadores[id]);
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const scrim=((t.tatica&&t.tatica.scrim)||3)-3;
  if(scrim)out.push({txt:'Scrims '+(scrim>0?'intensos':'leves'),delta:scrim*DUPLA_SCRIM,pares:paresDe(el)});
  for(const id of el){
    const p=G.jogadores[id];
    if(p.moral<0.35)out.push({txt:p.nome+' está insatisfeito',delta:-0.3,pares:el.filter(o=>o!==id).map(o=>[id,o])});
  }
  for(const [a,b] of paresDe(tit)){
    const p=G.jogadores[a],q=G.jogadores[b];
    if(p.role===q.role&&p.role!=='Flex'&&p.roleAtual===q.roleAtual)
      out.push({txt:p.nome+' e '+q.nome+' disputam a mesma função',delta:-0.15,pares:[[a,b]]});
  }
  /* desigualdade: quem ganha menos de um quarto do mais bem pago entre os
     titulares sente — um item por jogador, não um por dupla */
  const teto=Math.max(1,...tit.map(id=>G.jogadores[id].salario||0));
  for(const id of tit){
    const p=G.jogadores[id];
    if((p.salario||0)*4<teto)out.push({txt:p.nome+' ganha muito menos que os colegas de time',delta:-0.1,
      pares:tit.filter(o=>o!==id&&(G.jogadores[o].salario||0)>=teto/2).map(o=>[id,o])});
  }
  if(t.seq<=-3)out.push({txt:Math.abs(t.seq)+' derrotas seguidas pesam no grupo',delta:-0.2,pares:paresDe(tit)});
  /* convivência: quem treina junto todo dia se entende um pouco mais, até um
     teto — dali para cima só jogo, scrim e atividade levam */
  const baixos=paresDe(el).filter(([a,b])=>dupla(t,a,b)<DUPLA_TETO_CONVIVENCIA);
  if(baixos.length)out.push({txt:'Convivência no dia a dia',delta:DUPLA_CONVIVENCIA,pares:baixos});
  return out;
}
function entrosamentoSemanal(t){
  if(!t.duplas)semearDuplas(t);
  /* duplas de quem já saiu (aposentadoria, empréstimo, Banco de dados) */
  const no=new Set(t.elenco||[]);
  for(const k of Object.keys(t.duplas)){const [a,b]=k.split('|');if(!no.has(a)||!no.has(b))delete t.duplas[k];}
  for(const f of fatoresDaSemana(t))for(const [a,b] of f.pares)mexerDupla(t,a,b,f.delta);
  if(t.id===G.meuTime)aplicarAtividade(t);
  atualizarSinergia(t);
  /* histórico curto para a tela mostrar a tendência */
  (t.sinHist=t.sinHist||[]).push(Math.round(t.sinergia));
  if(t.sinHist.length>12)t.sinHist.shift();
}
function entrosamentoVirada(t){
  for(const [a,b] of paresDe((t.elenco||[]).filter(id=>G.jogadores[id])))mexerDupla(t,a,b,DUPLA_VIRADA);
  atualizarSinergia(t);
}
/* Banco de dados: definir o entrosamento do time põe todas as duplas lá. */
function definirSinergia(t,v){
  t.duplas={};t.sinergia=clamp(v,0,100);semearDuplas(t);
}

/* ---------- atividades da semana (só o seu clube) ----------
   Uma por semana, escolhida na tela do Vestiário. Fica marcada até você
   trocar; o bootcamp tem intervalo mínimo e volta para "nenhuma". */
const ATIVIDADES=[
  {id:'nenhuma', nome:'Nenhuma', desc:'Semana normal: só o que treino, scrims e jogos já fazem.'},
  {id:'bootcamp',nome:'Bootcamp', desc:'Uma semana fora, todo mundo junto. O maior ganho de entrosamento, mas custa caixa e cansa.',
   custo:t=>t.tier===1?25000:8000, intervalo:8},
  {id:'ranked',  nome:'Ranked em duo', desc:'Dois jogadores escolhidos jogam ranqueada juntos a semana inteira. De graça, só para a dupla.'},
  {id:'stream',  nome:'Stream juntos', desc:'Conteúdo do time na live. Ganho pequeno de entrosamento e um pouco de torcida.'},
  {id:'jantar',  nome:'Jantar do time', desc:'Programa fora do jogo. Entrosamento e confiança sobem um pouco.',
   custo:()=>3000},
  {id:'sessao',  nome:'Sessão com o preparador mental', desc:'Trabalho de cabeça com o elenco. Recupera a confiança; rende mais com preparador bom.'},
  {id:'folga',   nome:'Folga coletiva', desc:'Todo mundo descansa. Tira desgaste e não mexe em entrosamento.'}
];
function atividade(id){return ATIVIDADES.find(a=>a.id===id)||ATIVIDADES[0];}
function semanaAbsVest(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function atividadeDisponivel(t,id){
  const a=atividade(id);
  if(a.intervalo&&t.ultimoBootcamp&&semanaAbsVest()-t.ultimoBootcamp<a.intervalo)
    return{ok:false,erro:'O último bootcamp foi há '+(semanaAbsVest()-t.ultimoBootcamp)+' semana(s). Dá para repetir com '+a.intervalo+'.'};
  if(a.custo&&t.caixa<a.custo(t))return{ok:false,erro:'Caixa insuficiente: '+money(a.custo(t))+'.'};
  return{ok:true};
}
function escolherAtividade(t,id,par){
  const a=atividade(id);
  const d=atividadeDisponivel(t,a.id);if(!d.ok)return d;
  if(a.id==='ranked'){
    if(!par||par.length!==2||par[0]===par[1]||!par.every(x=>(t.elenco||[]).includes(x)))
      return{ok:false,erro:'Escolha dois jogadores do elenco.'};
    t.atividadePar=par.slice();
  }
  t.atividade=a.id;
  return{ok:true,msg:a.nome+' marcado para esta semana.'};
}
/* O que a atividade faria — a tela mostra antes de você escolher. */
function efeitoAtividade(t,id){
  const a=atividade(id),el=(t.elenco||[]).filter(x=>G.jogadores[x]);
  const {n,neutro}=_nivelMental(t);
  switch(a.id){
    case 'bootcamp':return{duplas:3,desgaste:0.06,custo:a.custo(t)};
    case 'ranked':  return{dupla:3};
    case 'stream':  return{duplas:0.8,torcida:0.2};
    case 'jantar':  return{duplas:1,confianca:0.02,custo:a.custo(t)};
    case 'sessao':  return{duplas:0.3,confianca:0.03+(n-neutro)*0.015};
    case 'folga':   return{desgaste:-0.15,confianca:0.01};
    default:return{};
  }
}
function aplicarAtividade(t){
  const a=atividade(t.atividade);
  if(a.id==='nenhuma')return;
  const ok=atividadeDisponivel(t,a.id);
  if(!ok.ok){t.atividade='nenhuma';return;}
  const e=efeitoAtividade(t,a.id);
  const el=(t.elenco||[]).filter(x=>G.jogadores[x]);
  if(e.custo)t.caixa-=e.custo;
  if(e.duplas){
    const tit=new Set(t.titulares||[]);
    for(const [x,y] of paresDe(el))mexerDupla(t,x,y,tit.has(x)&&tit.has(y)?e.duplas:e.duplas/2);
  }
  if(e.dupla&&t.atividadePar)mexerDupla(t,t.atividadePar[0],t.atividadePar[1],e.dupla);
  for(const id of el){
    const p=G.jogadores[id];
    if(e.desgaste)p.fadiga=clamp(p.fadiga+e.desgaste,0,1);
    if(e.confianca)p.confianca=clamp(confiancaDe(p)+e.confianca,0.1,1);
  }
  if(e.torcida&&typeof t.torcida==='number')t.torcida=clamp(t.torcida+e.torcida,0,100);
  if(a.id==='bootcamp'){t.ultimoBootcamp=semanaAbsVest();t.atividade='nenhuma';}
  t.ultimaAtividade={id:a.id,ano:G.ano,semana:G.semana};
}
/* Vestiário vira notícia quando pesa: quarta derrota seguida, ou uma dupla
   de titulares que não se entende. Uma vez por temporada cada. */
function noticiasDoVestiario(t){
  if(t.id!==G.meuTime)return;
  t.vestAvisos=t.vestAvisos&&t.vestAvisos.ano===G.ano?t.vestAvisos:{ano:G.ano,seq:false,pares:{}};
  if(t.seq<=-4&&!t.vestAvisos.seq){
    t.vestAvisos.seq=true;
    noticia('😶 Clima pesado no '+t.nome+' depois da '+Math.abs(t.seq)+'ª derrota seguida. A confiança do elenco caiu.',{c:'clube',t:[t.id],imp:2});
  }
  for(const [a,b] of paresDe((t.titulares||[]).filter(id=>G.jogadores[id]))){
    const k=chaveDupla(a,b);
    if(dupla(t,a,b)<20&&!t.vestAvisos.pares[k]){
      t.vestAvisos.pares[k]=true;
      noticia('🧩 '+G.jogadores[a].nome+' e '+G.jogadores[b].nome+' ainda não se entendem em jogo. Ranked juntos ou um bootcamp ajudam.',
              {c:'clube',p:[a,b],t:[t.id]});
    }
  }
}

/* ============================================================
   OPERAÇÕES DE BASE DO EDITOR
   ------------------------------------------------------------
   Tudo aqui é edição de banco de dados, não simulação: mover um
   jogador entre clubes aqui NÃO mexe em caixa, moral ou contrato,
   diferente de contratar() em core/market.js. Nada toca o DOM,
   então tools/verificar.mjs consegue exercitar estas funções.

   O Editor é permissivo de propósito: montar uma base passa por
   estados temporariamente inválidos (tirar cinco jogadores de um
   time antes de colocar outros cinco). Quem cobra a consistência
   é edValidar(), e é ela que libera o início da run.
   ============================================================ */

/* mantém titulares coerentes preservando a escalação manual */
function edRemendarEscalacao(t){
  if(!t)return;
  t.titulares=t.titulares.filter(id=>t.elenco.includes(id)&&G.jogadores[id]);
  if(t.titulares.length<5){
    t.elenco.filter(id=>!t.titulares.includes(id)&&G.jogadores[id])
      .sort((a,b)=>over(G.jogadores[b])-over(G.jogadores[a]))
      .forEach(id=>{if(t.titulares.length<5)t.titulares.push(id);});
  }
  if(t.titulares.length>5)t.titulares=t.titulares.slice(0,5);
  if(!t.titulares.includes(t.igl))t.igl=t.titulares[0]||null;
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(p)p.igl=(id===t.igl);});
}

/* destino null = Sem clube (entra no mercado e pode ser contratado por qualquer time) */
function edMover(pid,destinoId){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const destino=destinoId?G.times[destinoId]:null;
  if(destinoId&&!destino)return{ok:false,erro:'Clube de destino não encontrado.'};
  if(destino&&destino.id===p.timeId)return{ok:true,msg:'Já está nesse clube.'};
  if(destino&&destino.elenco.length>=9)
    return{ok:false,erro:'Elenco do '+destino.tag+' está cheio (máximo 9).'};
  const origem=p.timeId?G.times[p.timeId]:null;
  if(origem){
    origem.elenco=origem.elenco.filter(x=>x!==pid);
    origem.titulares=origem.titulares.filter(x=>x!==pid);
    edRemendarEscalacao(origem);
  }
  G.livres=G.livres.filter(x=>x!==pid);
  /* garoto da categoria de base sai dela ao ser movido ou apagado */
  if(p.base&&G.times[p.base]){G.times[p.base].base=(G.times[p.base].base||[]).filter(x=>x!==pid);}
  delete p.base;
  if(destino){
    p.timeId=destino.id;
    if(!p.contrato)p.contrato=ri(2,3);
    destino.elenco.push(pid);
    edRemendarEscalacao(destino);
  }else{
    /* guarda a região para o filtro do Mercado continuar funcionando */
    if(origem)p.regiaoOrigem=origem.regiao;
    else if(!p.regiaoOrigem)p.regiaoOrigem=REGIONS[0].id;
    p.timeId=null;p.contrato=0;p.igl=false;
    G.livres.push(pid);
  }
  return{ok:true,msg:p.nome+(destino?' agora é do '+destino.tag:' está sem clube')+'.'};
}
function edLiberar(pid){return edMover(pid,null);}

function edApagar(pid){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const t=p.timeId?G.times[p.timeId]:null;
  if(t){
    t.elenco=t.elenco.filter(x=>x!==pid);
    t.titulares=t.titulares.filter(x=>x!==pid);
    edRemendarEscalacao(t);
  }
  G.livres=G.livres.filter(x=>x!==pid);
  /* garoto da categoria de base sai dela ao ser movido ou apagado */
  if(p.base&&G.times[p.base]){G.times[p.base].base=(G.times[p.base].base||[]).filter(x=>x!==pid);}
  delete p.base;
  /* Tudo o que aponta para ele sai junto — proposta, plano de treino, crachá
     de IGL. A limpeza é a mesma da aposentadoria, e mora em clock.js. */
  if(typeof esquecerJogador==='function')esquecerJogador(pid);
  delete G.jogadores[pid];
  return{ok:true,msg:p.nome+' apagado da base.'};
}

function edNomesUsados(){return new Set(Object.values(G.jogadores).map(p=>p.nome));}

/* cria jogador no clube informado, ou sem clube quando timeId é null */
function edCriarJogador(timeId,campos){
  campos=campos||{};
  const t=timeId?G.times[timeId]:null;
  if(timeId&&!t)return{ok:false,erro:'Clube não encontrado.'};
  if(t&&t.elenco.length>=9)return{ok:false,erro:'Elenco do '+t.tag+' está cheio (máximo 9).'};
  const R=t?REGIONS.find(r=>r.id===t.regiao):REGIONS[0];
  const base=t?Math.round(t.prestigio-4):56;
  const p=makePlayer(
    clamp(campos.over||base,30,99),
    ROLES.includes(campos.role)?campos.role:pick(ROLES),
    campos.pais||pick(R.paises),
    clamp(campos.idade||ri(typeof IDADE_NOVO_MIN!=='undefined'?IDADE_NOVO_MIN:15,
                          typeof IDADE_NOVO_MAX!=='undefined'?IDADE_NOVO_MAX:16),15,40),
    edNomesUsados());
  if(campos.nome)p.nome=campos.nome;
  if(campos.over)aplicarOver(p,clamp(campos.over,30,99));
  p.pot=clamp(campos.pot||p.pot,over(p),99);
  p.salario=salario(p);p.valor=valor(p);
  G.jogadores[p.id]=p;
  if(t){p.timeId=t.id;p.contrato=ri(2,3);t.elenco.push(p.id);edRemendarEscalacao(t);}
  else{p.timeId=null;p.contrato=0;p.regiaoOrigem=R.id;G.livres.push(p.id);}
  return{ok:true,id:p.id,msg:p.nome+' criado.'};
}

/* preenche o elenco com jogadores gerados até n (5 a 9) */
function edPreencherElenco(timeId,n){
  const t=G.times[timeId];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  n=clamp(n||5,5,9);
  let add=0;
  while(t.elenco.length<n){
    const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
    const r=edCriarJogador(timeId,{role:falta,over:Math.round(t.prestigio-6)});
    if(!r.ok)break;
    add++;
  }
  return{ok:true,msg:add?add+' jogador(es) gerado(s) no '+t.tag+'.':'Nada a preencher.'};
}

/* aplica um patch completo de jogador, com limites do modelo de dados */
const ED_FAIXA_AT=[25,99];
function edAplicarJogador(pid,c){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const antes=p.nome;
  if(typeof c.nome==='string'&&c.nome.trim())p.nome=c.nome.trim();
  if(ROLES.includes(c.role)&&c.role!==p.role){
    p.role=c.role;
    p.agentes=sortearAgentes(c.role);
    p.role2=null;   /* a secundária antiga pode não fazer sentido na nova função */
  }
  /* Secundária: '' limpa, 'auto' recalcula, e uma função só entra se o jogador
     tiver perfil para ela. Recusar é a regra que o Gabriel pediu — um jogador
     de mira ruim não vira Duelista nem por edição manual. */
  if(c.role2!=null){
    const r2=String(c.role2);
    if(!r2)p.role2=null;
    else if(r2==='auto')p.role2=melhorSecundaria(p);
    else if(!ROLES.includes(r2))return{ok:false,erro:'Função secundária inválida.'};
    else if(r2===p.role)p.role2=null;
    else if(custoDeFuncao(p,r2)>CUSTO_MAX_SECUNDARIA)
      return{ok:false,erro:p.nome+' perderia '+custoDeFuncao(p,r2)+
             ' pontos de over como '+r2+'. O limite é '+CUSTO_MAX_SECUNDARIA+'.'};
    else p.role2=r2;
  }
  if(c.idade!=null)p.idade=clamp(parseInt(c.idade)||p.idade,15,40);
  if(typeof c.pais==='string'&&c.pais.trim())p.pais=c.pais.trim().toUpperCase().slice(0,2);
  if(c.genero==='f'||c.genero==='m')p.genero=c.genero;
  if(c.real!=null)p.real=!!c.real;
  if(c.at)for(const[k]of ATTRS)
    if(c.at[k]!=null)p.at[k]=clamp(parseFloat(c.at[k]),ED_FAIXA_AT[0],ED_FAIXA_AT[1]);
  if(c.over!=null)aplicarOver(p,clamp(parseInt(c.over)||over(p),30,99));
  if(c.pot!=null)p.pot=clamp(parseInt(c.pot)||p.pot,over(p),99);
  else p.pot=Math.max(p.pot,over(p));
  ajustarSecundaria(p);   /* atributos ou over podem ter mudado o perfil */
  if(c.contrato!=null)p.contrato=clamp(parseInt(c.contrato)||0,0,6);
  if(c.salario!=null)p.salario=Math.max(0,Math.round(parseFloat(c.salario)||0));
  for(const k of ['moral','forma','fadiga'])
    if(c[k]!=null)p[k]=clamp(parseFloat(c[k]),0,1);
  if(c.lesao!=null)p.lesao=clamp(parseInt(c.lesao)||0,0,52);
  if(Array.isArray(c.agentes))p.agentes=c.agentes.filter(a=>typeof a==='string').slice(0,5);
  if(c.foto!=null)p.foto=String(c.foto).trim()||undefined;
  p.valor=valor(p);
  if(c.salario==null&&c.over!=null)p.salario=salario(p);
  if(p.timeId){
    const t=G.times[p.timeId];
    if(c.igl===true){t.igl=pid;t.elenco.forEach(i=>{G.jogadores[i].igl=(i===pid);});}
    edRemendarEscalacao(t);
  }
  return{ok:true,renomeado:antes!==p.nome?{de:antes,para:p.nome}:null};
}

/* aplica um patch completo de time */
function edAplicarTime(tid,c){
  const t=G.times[tid];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  const tagAntes=t.tag;
  if(typeof c.nome==='string'&&c.nome.trim())t.nome=c.nome.trim();
  if(typeof c.tag==='string'&&c.tag.trim()){
    const nova=c.tag.trim().slice(0,5);
    const usada=Object.values(G.times).find(x=>x.id!==tid&&x.tag.toLowerCase()===nova.toLowerCase());
    if(usada)return{ok:false,erro:'A tag '+nova+' já é do '+usada.nome+'.'};
    t.tag=nova;
  }
  /* País da sede. Vazio volta a derivar do elenco, que é o padrão. */
  if(c.pais!=null){
    const pais=String(c.pais).trim().toUpperCase().slice(0,2);
    t.pais=pais||null;
    t.torcida=torcidaInicial(t);
    t.patroc=patrocinioDe(t);
  }
  if(c.prestigio!=null){
    t.prestigio=clamp(parseInt(c.prestigio)||t.prestigio,20,99);
    if(c.patroc==null)t.patroc=patrocinioDe(t);
  }
  if(c.caixa!=null)t.caixa=Math.round(parseFloat(c.caixa)||0);
  if(c.patroc!=null)t.patroc=Math.max(0,Math.round(parseFloat(c.patroc)||0));
  if(c.sinergia!=null){
    const v=clamp(parseInt(c.sinergia)||t.sinergia,0,100);
    if(typeof definirSinergia==='function'&&Math.round(v)!==Math.round(t.sinergia))definirSinergia(t,v);else t.sinergia=v;
  }
  if(c.staff)for(const k of ['tecnico','analista','mental'])
    /* nível com uma casa decimal: antes o parseInt truncava 3,5 em 3 ao
       aplicar qualquer mudança do time */
    if(c.staff[k]!=null){const v=parseFloat(String(c.staff[k]).replace(',','.'));
      if(Math.abs(v-(t.staff[k]||0))>=0.05)t.staff[k]=clamp(Math.round((v||1)*10)/10,1,5);}
  if(c.estrutura)for(const k of (typeof DEPTOS!=='undefined'?DEPTOS.map(d=>d.id):['gh','treino','academia']))
    if(c.estrutura[k]!=null)t.estrutura[k]=clamp(parseInt(c.estrutura[k])||1,1,5);
  if(c.mapPref)for(const m in c.mapPref)
    if(MAP_POOL.includes(m))t.mapPref[m]=clamp(parseInt(c.mapPref[m])||0,-8,8);
  if(c.logo!=null)t.logo=String(c.logo).trim()||undefined;
  /* cor do clube: vazia (ou igual à tirada do escudo) volta para a do escudo */
  if(c.cor!=null){const k=String(c.cor).trim();
    t.cor=/^#[0-9a-f]{6}$/i.test(k)&&k.toUpperCase()!==corDoEscudo(t).toUpperCase()?k.toUpperCase():undefined;}
  const trocou=(c.regiao&&c.regiao!==t.regiao)||(c.tier&&+c.tier!==t.tier);
  if(trocou)edMudarLiga(tid,c.regiao||t.regiao,+(c.tier||t.tier));
  return{ok:true,tagTrocada:tagAntes!==t.tag?{de:tagAntes,para:t.tag}:null};
}

/* troca o time de liga e/ou divisão, mantendo os índices de G.regioes */
function edMudarLiga(tid,regiaoId,tier){
  const t=G.times[tid];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  if(!REGIONS.some(r=>r.id===regiaoId))return{ok:false,erro:'Região inválida.'};
  tier=tier===2?2:1;
  const antiga=G.regioes[t.regiao];
  antiga.t1=antiga.t1.filter(x=>x!==tid);
  antiga.t2=antiga.t2.filter(x=>x!==tid);
  if(antiga.pontos)delete antiga.pontos[tid];
  t.regiao=regiaoId;t.tier=tier;
  const nova=G.regioes[regiaoId];
  const lista=tier===1?nova.t1:nova.t2;
  if(!lista.includes(tid))lista.push(tid);
  if(tier===1&&nova.pontos)nova.pontos[tid]=nova.pontos[tid]||0;
  t.patroc=patrocinioDe(t);
  return{ok:true,msg:t.tag+' agora é '+(tier===1?nova.nome:nova.t2)+'.'};
}

/* ---------- validação da base ---------- */
/* devolve {erros,avisos}: erros travam o início da run, avisos não */
function edValidar(){
  const erros=[],avisos=[];
  const nomes={};
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    nomes[p.nome]=(nomes[p.nome]||0)+1;
    if(p.timeId&&!G.times[p.timeId])
      erros.push('Jogador '+p.nome+' aponta para um clube que não existe.');
    if(p.timeId&&!G.times[p.timeId].elenco.includes(id))
      erros.push('Jogador '+p.nome+' diz ser do '+G.times[p.timeId].tag+', mas não está no elenco.');
    if(!p.timeId&&!p.base&&!G.livres.includes(id))
      erros.push('Jogador '+p.nome+' está sem clube e fora da lista de agentes livres.');
    if(p.base&&!(G.times[p.base]&&(G.times[p.base].base||[]).includes(id)))
      erros.push('Jogador '+p.nome+' diz ser da base de um clube que não o tem na categoria.');
    if(p.pot<over(p))avisos.push(p.nome+' tem potencial abaixo do over atual.');
  }
  for(const n in nomes)if(nomes[n]>1)
    erros.push('Nick repetido na base: '+n+' ('+nomes[n]+' jogadores).');
  const tags={};
  for(const id in G.times){
    const t=G.times[id];
    tags[t.tag.toLowerCase()]=(tags[t.tag.toLowerCase()]||0)+1;
    if(t.elenco.length<5)erros.push(t.tag+' tem só '+t.elenco.length+' jogador(es); o mínimo é 5.');
    if(t.elenco.length>9)erros.push(t.tag+' tem '+t.elenco.length+' jogadores; o máximo é 9.');
    if(t.elenco.some(p=>!G.jogadores[p]))erros.push(t.tag+' referencia jogador que não existe.');
    if(t.elenco.length>=5&&t.titulares.length!==5)
      erros.push(t.tag+' tem '+t.titulares.length+' titulares; precisa de 5.');
    if(t.igl&&!t.elenco.includes(t.igl))erros.push(t.tag+' tem IGL fora do elenco.');
    const rs=t.titulares.map(i=>G.jogadores[i]).filter(Boolean);
    const faltando=['Duelista','Iniciador','Controlador','Sentinela']
      .filter(r=>!rs.some(p=>p.role===r||p.role==='Flex'));
    if(faltando.length)avisos.push(t.tag+' escala sem '+faltando.join(', ')+' — leva penalidade em partida.');
  }
  for(const k in tags)if(tags[k]>1)erros.push('Tag repetida: '+k.toUpperCase()+'.');
  for(const R of REGIONS){
    const r=G.regioes[R.id];
    if(r.t1.length!==12)erros.push(R.nome+' tem '+r.t1.length+' times na liga principal; o calendário espera 12.');
    if(r.t2.length!==8)erros.push(R.t2+' tem '+r.t2.length+' times; o calendário espera 8.');
  }
  if(G.staff){
    for(const id in G.times){
      const t=G.times[id];
      for(const c of CARGOS){
        const sid=t.comissao&&t.comissao[c.id];
        if(!sid){avisos.push(t.tag+' está sem '+c.nome.toLowerCase()+' — a vaga vale nível 1.');continue;}
        const m=G.staff[sid];
        if(!m)erros.push(t.tag+' aponta para um membro de comissão que não existe.');
        else if(m.timeId!==id)erros.push(m.nome+' está na comissão do '+t.tag+' mas diz ser de outro clube.');
      }
    }
    for(const sid in G.staff){
      const m=G.staff[sid];
      if(!m.timeId&&!(G.staffLivres||[]).includes(sid))
        erros.push(m.nome+' está sem clube e fora da lista de comissão livre.');
    }
  }
  const orfaos=G.livres.filter(id=>!G.jogadores[id]);
  if(orfaos.length)erros.push(G.livres.length&&orfaos.length+' agente(s) livre(s) aponta(m) para jogador inexistente.');
  if(!G.livres.length)avisos.push('Nenhum agente livre na base — a IA não tem de onde repor elenco no offseason.');
  return{erros,avisos,ok:!erros.length};
}

/* ---------- países de sede em massa ----------
   Uma linha por clube: TAG = PA. Existe porque preencher 80 clubes num campo
   de cada vez é o tipo de tarefa que ninguém faz duas vezes. */
function edAplicarPaises(texto){
  const linhas=String(texto||'').split(/\r?\n/);
  let ok=0; const erros=[];
  for(const bruta of linhas){
    const l=bruta.split('//')[0].trim();
    if(!l)continue;
    const m=l.match(/^(.+?)\s*[=|:]\s*([A-Za-z]{2})$/);
    if(!m){erros.push('não entendi: '+l);continue;}
    const tag=m[1].trim(), pais=m[2].toUpperCase();
    const t=Object.values(G.times).find(x=>x.tag.toLowerCase()===tag.toLowerCase());
    if(!t){erros.push('tag desconhecida: '+tag);continue;}
    if(typeof PAISES!=='undefined'&&PAISES&&!PAISES[pais]){erros.push(pais+' não é um país da lista ('+tag+')');continue;}
    t.pais=pais;
    t.torcida=torcidaInicial(t);
    t.patroc=receitaCaixa(t);
    ok++;
  }
  return{ok:true,n:ok,erros};
}
function edListarPaises(){
  return Object.values(G.times)
    .sort((a,b)=>(a.tier-b.tier)||a.regiao.localeCompare(b.regiao)||a.tag.localeCompare(b.tag))
    .map(t=>t.tag+' = '+(t.pais||'??')+'   // '+t.nome+' · Tier '+t.tier+' · '+t.regiao)
    .join('\n');
}

/* ============================================================
   ARMAZENAMENTO — runs (partidas salvas)
   ------------------------------------------------------------
   Uma "run" = um mundo + uma temporada em andamento + histórico.
   Estratégia em camadas, da melhor para a mais simples:
     1. IndexedDB   (sem limite prático; exige http:// ou app empacotado)
     2. localStorage (~5 MB; funciona em file:// na maioria dos navegadores)
     3. memória      (só durante a sessão)
   Independente da camada, exportar/importar .json sempre funciona
   e é o formato canônico de backup, versionável no git em /runs.
   ============================================================ */
const RUNS_DB='vctmanager', RUNS_STORE='runs', RUNS_LS='vct_runs_v3';
/* versão 2 do banco: acrescenta o store 'imgs' do pacote de imagens.
   Bancos da versão 1 sobem sozinhos no onupgradeneeded, sem perder runs. */
const RUNS_DB_VERSAO=2;
const Storage={
  modo:'memoria', _db:null, _mem:{},

  async iniciar(){
    if(await this._tentarIDB())this.modo='indexeddb';
    else if(this._tentarLS())this.modo='localstorage';
    else this.modo='memoria';
    return this.modo;
  },
  _tentarIDB(){
    return new Promise(res=>{
      if(!self.indexedDB)return res(false);
      let req;try{req=indexedDB.open(RUNS_DB,RUNS_DB_VERSAO);}catch(e){return res(false);}
      req.onupgradeneeded=()=>{const db=req.result;
        if(!db.objectStoreNames.contains(RUNS_STORE))db.createObjectStore(RUNS_STORE,{keyPath:'id'});
        if(!db.objectStoreNames.contains(IMGS_STORE))db.createObjectStore(IMGS_STORE,{keyPath:'k'});};
      req.onsuccess=()=>{this._db=req.result;res(true);};
      req.onerror=()=>res(false);
      setTimeout(()=>res(!!this._db),1500);
    });
  },
  _tentarLS(){try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true;}catch(e){return false;}},
  _store(loja,fn,modo){
    return new Promise((res,rej)=>{
      if(!this._db)return rej(new Error('IndexedDB indisponível.'));
      const tx=this._db.transaction(loja,modo||'readonly');
      const req=fn(tx.objectStore(loja));
      req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);
    });
  },
  _idb(fn,modo){return this._store(RUNS_STORE,fn,modo);},
  _lsTudo(){try{return JSON.parse(localStorage.getItem(RUNS_LS)||'{}');}catch(e){return{};}},
  _lsGravar(o){try{localStorage.setItem(RUNS_LS,JSON.stringify(o));return true;}catch(e){return false;}},

  async listar(){
    let itens=[];
    if(this.modo==='indexeddb')itens=await this._idb(st=>st.getAll());
    else if(this.modo==='localstorage')itens=Object.values(this._lsTudo());
    else itens=Object.values(this._mem);
    /* o registro da base de dados mora no mesmo store, mas não é partida */
    return itens.filter(r=>r&&r.id!==BASE_ID).map(r=>({id:r.id,nome:r.nome,ano:r.ano,clube:r.clube,fase:r.fase,atualizado:r.atualizado}))
      .sort((a,b)=>(b.atualizado||0)-(a.atualizado||0));
  },
  async gravar(reg){
    reg.atualizado=Date.now();
    if(this.modo==='indexeddb'){await this._idb(st=>st.put(reg),'readwrite');return true;}
    if(this.modo==='localstorage'){const o=this._lsTudo();o[reg.id]=reg;return this._lsGravar(o);}
    this._mem[reg.id]=reg;return true;
  },
  async ler(id){
    if(this.modo==='indexeddb')return await this._idb(st=>st.get(id));
    if(this.modo==='localstorage')return this._lsTudo()[id]||null;
    return this._mem[id]||null;
  },
  async apagar(id){
    if(this.modo==='indexeddb'){await this._idb(st=>st.delete(id),'readwrite');return;}
    if(this.modo==='localstorage'){const o=this._lsTudo();delete o[id];this._lsGravar(o);return;}
    delete this._mem[id];
  }
};

/* ---------- preferências do app ----------
   Ficam fora da run de propósito: são de quem joga, não da partida.
   Trocar de save não deve mudar como o jogo se comporta. */
const PREFS_LS='vct_prefs_v1';
const Prefs={
  padrao:{modalPartida:true,resumoRodada:true,autosave:true,animacoes:true,
          rostosGerados:'ficticios',
          aoVivo:true, velocidadeAoVivo:'1',
          prePartida:true, tempoTecnico:true, dicas:true, turnosNaJanela:true},
  dados:null,
  iniciar(){
    this.dados=Object.assign({},this.padrao);
    try{Object.assign(this.dados,JSON.parse(localStorage.getItem(PREFS_LS)||'{}'));}catch(e){}
    return this.dados;
  },
  get(k){if(!this.dados)this.iniciar();return this.dados[k];},
  set(k,v){
    if(!this.dados)this.iniciar();
    this.dados[k]=v;
    try{localStorage.setItem(PREFS_LS,JSON.stringify(this.dados));return true;}catch(e){return false;}
  }
};

/* ---------- serialização da run ---------- */
const RUN_VERSAO=11;
function novaRunId(){return 'run_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*1e4).toString(36);}
function empacotarRun(nome){
  return{
    id:G.runId, versao:RUN_VERSAO, nome:nome||G.runNome||'Sem nome',
    ano:G.ano, clube:G.meuTime?G.times[G.meuTime].nome:'—',
    fase:G.calendario&&G.calendario[G.bloco]?G.calendario[G.bloco].nome:'',
    atualizado:Date.now(), semente:_s, estado:G
  };
}
/* ---------- migração de save ----------
   Toda vez que um sistema novo entra, ele acrescenta um campo que o save
   gravado antes dele não tem. Se ninguém preenche esse campo na carga, o motor
   recebe undefined onde espera número — foi exatamente assim que a torcida
   virou NaN e contaminou o caixa. A regra aqui é: preencher o que falta, nunca
   sobrescrever o que já existe.

   A migração sorteia (afinidade de mapa, torcida inicial). Fazer isso na
   sequência da própria run mudaria todo o futuro dela só por ter sido
   carregada. Então ela sorteia num desvio e devolve o fluxo onde estava. */
function migrarRun(reg){
  const de=reg.versao||0;
  const guarda=_s;
  srand(((reg.semente||1)^0x5f3a7c1d)>>>0);
  try{
    /* --- estado do mundo --- */
    if(!G.h2h)G.h2h={};
    if(!G.noticias)G.noticias=[];
    if(!G.historico)G.historico=[];
    if(G.manager===undefined)G.manager=null;
    if(!G.mapasAtivos||!G.mapasAtivos.length)G.mapasAtivos=poolInicial();
    /* save com os doze mapas ativos veio de antes da rotação */
    if(G.mapasAtivos.length>MAPAS_ATIVOS)G.mapasAtivos=poolInicial();
    if(!G.mapaDesde)G.mapaDesde={};
    /* meta de agentes e comps: save de antes do meta cai no meta real de 2026,
       que é o mesmo ponto de partida de uma run nova */
    if(!G.meta||!Object.keys(G.meta).length)
      G.meta=(typeof metaInicial==='function')?metaInicial():{};
    if(!G.patches)G.patches=[];
    if(!G.patchFeito)G.patchFeito={};
    for(const id in G.times)if(!G.times[id].comps)G.times[id].comps={};
    /* Summit entrou no pool de 2026: save antigo que tinha o pool de sete
       mapas recebe o pool real, senão ficaria com um mapa a menos para
       sempre e o veto não bateria com o formato de hoje */
    if((G.mapasAtivos||[]).length!==MAPAS_ATIVOS)G.mapasAtivos=poolInicial();
    /* plano de treino: nasce vazio e cai no seletor antigo das Táticas até o
       jogador escolher, para nada parar de evoluir num save que veio de antes */
    for(const id in G.times)if(!G.times[id].treino)G.times[id].treino={mapa:null,individual:{}};
    if(!G.propostas)G.propostas=[];
    if(!G.negociacoes)G.negociacoes=[];
    if(!G.transferencias)G.transferencias=[];
    /* Calendário antigo: os blocos não tinham semana. Sem `ini`/`fim`,
       blocoDaSemana() não acha bloco nenhum, o relógio passa o ano inteiro em
       "Intervalo" e a temporada some sem um único jogo — e sem erro, que é o
       pior jeito de quebrar. Remontar é a única saída: o calendário velho não
       guarda em que semana cada torneio acontecia, porque semana não existia.
       O que dá para preservar é ONDE o jogador estava: o bloco em andamento
       vira a semana em que aquele mesmo bloco começa no calendário novo. */
    const semSemana=!Array.isArray(G.calendario)||!G.calendario.length
                    ||G.calendario[0].ini===undefined;
    if(semSemana){
      const antigo=(G.calendario||[])[G.bloco||0];
      const chave=antigo&&antigo.endKey;
      montarCalendario();
      const alvo=chave&&G.calendario.find(b=>b.endKey===chave||String(b.endKey).startsWith(chave));
      G.semana=alvo?alvo.ini:1;
      G.bloco=alvo?G.calendario.indexOf(alvo):0;
      if(typeof noticia==='function')
        noticia('📅 O calendário virou semanas com data. A temporada foi remontada a partir de '+
                (alvo?alvo.nome:'a pré-temporada')+'.',{c:'outros'});
    }
    if(typeof G.semana!=='number'||!(G.semana>=1&&G.semana<=SEMANAS_ANO))G.semana=1;
    if(!G.torneios)montarTorneios();
    if(!G.agentes)montarAgentes();
    if(!Array.isArray(G.cidades)||!G.cidades.length)montarCidades();
    if(!G.sedes)G.sedes={};
    /* Torneio por evento, não por fase: os playoffs do Stage e do Split eram
       entradas próprias do catálogo e davam título com o nome da fase
       ("Playoffs Stage 1 · VCT Americas"). O catálogo é unificado, os stages
       da temporada em curso passam a apontar para o evento e os títulos já
       ganhos são renomeados. */
    if(unificarTorneios()||!G._titulosPorEvento){
      for(const b of G.calendario||[])for(const st of b.stages||[]){
        st.torneioId=torneioDeStage(st.id);
        if(st.tipo==='de'&&!st.rotulo&&/^(kick|po|cp|masters|champs)/.test(st.id))st.rotulo='Playoffs';
        if(/^(po|cp)\d_/.test(st.id))st.nome=String(st.nome).replace(/^Playoffs (Stage|Split) /,'$1 ').replace(/^Playoffs (Challengers)/,'Split '+st.id[2]+' · $1');
      }
      const renomear=txt=>String(txt).replace(/Playoffs (Stage|Split) (\d) · /g,'$1 $2 · ');
      for(const h of G.historico)if(h&&h.evento)h.evento=renomear(h.evento);
      for(const id in G.times){const t=G.times[id];if(Array.isArray(t.titulos))t.titulos=t.titulos.map(renomear);}
      G._titulosPorEvento=true;
    }
    if(typeof sedesDoAno==='function')sedesDoAno(G.ano);
    /* Títulos internacionais de carreira gravados antes das sedes ("2028 ·
       Masters I") ganham a cidade daquele ano, a mesma que o sorteio dá a ele
       agora — senão a galeria diria "Masters I" ao lado de um troféu de Osaka. */
    if(!G._titulosComSede&&typeof nomeComSede==='function'){
      const genericos={'Masters I':'masters1','Masters II':'masters2','Valorant Champions':'champions'};
      const comSede=(ano,ev)=>{const k=genericos[ev];return k&&ano>=2027?(nomeComSede(k,ano)||ev):ev;};
      for(const h of G.historico)if(h&&!h.pre&&h.evento)h.evento=comSede(h.ano,h.evento);
      for(const id in G.times){const t=G.times[id];if(Array.isArray(t.titulos))
        t.titulos=t.titulos.map(x=>{const i=x.indexOf(' · ');if(i<0)return x;const ano=parseInt(x);return x.slice(0,i+3)+comSede(ano,x.slice(i+3));});}
      G._titulosComSede=true;
    }
    if(!G.staff)migrarStaffAntigo();
    if(!G.marcas||!Object.keys(G.marcas).length)montarMarcas();

    /* --- jogadores --- */
    for(const id in G.jogadores){
      const p=G.jogadores[id];
      if(!p)continue;
      if(p.role2===undefined)p.role2=null;
      if(!p.roleAtual)p.roleAtual=p.role;
      if(!p.mapas)p.mapas=afinidadeInicial();
      if(!p.agenteNivel&&typeof semearAgentes==='function')semearAgentes(p);
      if(!p.mapas)p.mapas=afinidadeInicial();
      if(typeof p.pico!=='number'||!isFinite(p.pico))p.pico=over(p);
      if(typeof p.lesao!=='number')p.lesao=0;
    }

    /* --- clubes --- */
    let semPatroc=0;
    for(const id in G.times){
      const t=G.times[id];
      if(!t)continue;
      if(!Array.isArray(t.titulos))t.titulos=[];
      if(!t.tierInicial)t.tierInicial=t.tier;
      if(typeof t.legado!=='number')t.legado=0;
      if(typeof t.vices!=='number')t.vices=0;
      if(!t.pais&&!t.paisSede)t.paisSede=paisDoClube(t)||null;
      if(typeof t.torcida!=='number'||!isFinite(t.torcida))t.torcida=torcidaInicial(t);
      if(!t.patrocinios){t.patrocinios={master:null,secundario:null,fornecedor:null};semPatroc++;}
      if(typeof atualizarComissao==='function')atualizarComissao(t);
      /* entrosamento por dupla: nasce do número antigo do clube */
      if(typeof semearDuplas==='function'&&!t.duplas)semearDuplas(t);
      if(typeof t.seq!=='number')t.seq=0;
      /* departamentos novos da estrutura (core/estrutura.js) */
      if(typeof garantirEstrutura==='function')garantirEstrutura(t);
    }

    /* História real só pode entrar uma vez: rodar de novo duplicaria títulos e
       torcida. O marcador pre:true é quem sabe se ela já entrou. */
    if(!G.historico.some(h=>h&&h.pre)&&typeof semearHistoria==='function')semearHistoria();
    if(semPatroc)atribuirPatrocinios();
    for(const id in G.times){
      const t=G.times[id];
      if(typeof t.patroc!=='number'||!isFinite(t.patroc))t.patroc=receitaCaixa(t);
    }

    /* Saves anteriores à marcação de nome real não sabem quem é real, e sem
       isso a exportação de elencos sai vazia. Remarcar pelo nick cura. */
    if(typeof remarcarReais==='function')remarcarReais();
  }finally{ _s=guarda; }
  reg.versao=RUN_VERSAO;
  return de;
}

function desempacotarRun(reg){
  if(!reg||!reg.estado)return false;
  const antiga=reg.versao!==RUN_VERSAO;
  G=reg.estado;_s=reg.semente||1;
  G.runId=reg.id;G.runNome=reg.nome;
  migrarRun(reg);
  if(antiga)console.info('Save migrado para a versão',RUN_VERSAO+'.');
  return true;
}
async function salvarRun(nome){
  if(!G)return false;
  if(!G.runId)G.runId=novaRunId();
  if(nome)G.runNome=nome;
  const ok=await Storage.gravar(empacotarRun(G.runNome));
  return ok;
}
async function carregarRun(id){
  const reg=await Storage.ler(id);
  return desempacotarRun(reg);
}
function baixarRun(){
  const reg=empacotarRun(G.runNome);
  const blob=new Blob([JSON.stringify(reg,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=ASSETS.slug(reg.nome||'run')+'-'+reg.ano+'.vctrun.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function lerArquivoRun(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{try{res(JSON.parse(fr.result));}catch(e){rej(e);}};
    fr.onerror=()=>rej(fr.error);
    fr.readAsText(file);
  });
}

/* ============================================================
   BASE DE DADOS — o mundo de onde toda carreira nova nasce
   ------------------------------------------------------------
   Duas coisas diferentes, que antes eram uma só:

     · a BASE: mundo inicial fixo, guardado no navegador/app.
       Só muda pelo Banco de dados do MENU PRINCIPAL, e a mudança
       é permanente: vale para toda carreira criada dali em diante.
     · o SAVE: a carreira. O Banco de dados de DENTRO do jogo
       edita só ela; a base não fica sabendo.

   A base nasce dos arquivos de data/ (times, elencos, comissão...)
   com uma semente fixa, então o mundo "original" é sempre o mesmo,
   inclusive os reservas gerados. Ela fica guardada no mesmo
   armazenamento das runs, num registro reservado que a lista de
   partidas salvas não mostra.

   Carreira nova = cópia da base + semente nova para a simulação.
   O mundo é o mesmo; o que acontece nele é que muda de carreira
   para carreira.

   Quando os arquivos de data/ mudam (um elenco novo no repositório),
   a assinatura muda. Base que você nunca editou se refaz sozinha a
   partir dos dados novos; base editada é mantida e o Banco de dados
   avisa, oferecendo restaurar a original.
   ============================================================ */
const BASE_ID='__base__';
const BASE_SEMENTE=2027;
/* subir este número força a base original a ser refeita (mudança na
   geração do mundo que os arquivos de data/ não denunciam) */
const BASE_VERSAO=1;

/* impressão digital dos dados de partida: muda se qualquer arquivo de
   data/ que alimenta o mundo mudar */
function baseAssinatura(){
  const fontes=[
    typeof REGIONS!=='undefined'?REGIONS:null,
    typeof TIMES_REAIS!=='undefined'?TIMES_REAIS:null,
    typeof ELENCOS_REAIS!=='undefined'?ELENCOS_REAIS:null,
    typeof COMISSAO_REAL!=='undefined'?COMISSAO_REAL:null,
    typeof CLUBES_BASE!=='undefined'?CLUBES_BASE:null,
    typeof HISTORIA_REAL!=='undefined'?HISTORIA_REAL:null,
    typeof PATROCINADORES!=='undefined'?PATROCINADORES:null,
    typeof MAP_POOL!=='undefined'?MAP_POOL:null,
    typeof POOL_2026!=='undefined'?POOL_2026:null];
  const txt=JSON.stringify([BASE_VERSAO,typeof RUN_VERSAO!=='undefined'?RUN_VERSAO:0,fontes]);
  let h=5381;
  for(let i=0;i<txt.length;i++)h=((h<<5)+h+txt.charCodeAt(i))|0;
  return (h>>>0).toString(36)+'.'+txt.length.toString(36);
}

const Base={
  reg:null,          /* {id, versao, semente, assinatura, editada, estado, atualizado} */
  desatualizada:false, /* base editada, mas os arquivos de data/ mudaram depois */
  editando:false,    /* o G global é a base (Banco de dados do menu aberto) */
  _guardaG:null,_guardaS:1,_ultimoJson:'',_timer:null,

  async iniciar(){
    let r=null;
    try{r=await Storage.ler(BASE_ID);}catch(e){r=null;}
    const ass=baseAssinatura();
    if(r&&r.estado&&r.assinatura!==ass){
      if(!r.editada)r=null;          /* nunca editada: refaz dos dados novos */
      else this.desatualizada=true;  /* editada: mantém e avisa */
    }
    if(r&&r.estado){
      this.reg=r;
      /* mesma migração de um save: campo novo do motor entra preenchido */
      const guardaG=G,guardaS=_s;
      try{G=r.estado;migrarRun(r);}finally{G=guardaG;_s=guardaS;}
      r.id=BASE_ID;
    }else{
      this.gerarOriginal();
      await this.gravar();
    }
    this._ultimoJson=JSON.stringify(this.reg.estado);
    return this.reg;
  },

  /* monta a base original a partir de data/, sem mexer no G de quem chamou */
  gerarOriginal(){
    const guardaG=G,guardaS=_s;
    try{
      criarMundo(BASE_SEMENTE);montarCalendario();
      G.meuTime=null;delete G.runId;delete G.runNome;
      this.reg={id:BASE_ID,versao:RUN_VERSAO,semente:_s,assinatura:baseAssinatura(),
                editada:false,estado:G,atualizado:Date.now()};
    }finally{G=guardaG;_s=guardaS;}
    this.desatualizada=false;
    return this.reg;
  },

  async gravar(){
    if(!this.reg)return false;
    try{return !!(await Storage.gravar(this.reg));}catch(e){return false;}
  },

  /* quantos clubes / jogadores, para o menu */
  resumo(){
    const e=this.reg&&this.reg.estado;
    return e?{times:Object.keys(e.times).length,jogadores:Object.keys(e.jogadores).length}:{times:0,jogadores:0};
  },

  /* ---------- edição pelo menu ----------
     O Editor trabalha sobre o G global. Para editar a base, o G da carreira
     sai de cena enquanto o Banco de dados do menu está aberto, e volta assim
     que a tela é deixada. render() é quem chama as duas pontas. */
  abrirEdicao(){
    if(this.editando||!this.reg)return;
    this._guardaG=G;this._guardaS=_s;
    G=this.reg.estado;_s=this.reg.semente||BASE_SEMENTE;
    this.editando=true;
  },
  fecharEdicao(){
    if(!this.editando)return;
    this.salvarSeMudou();
    G=this._guardaG;_s=this._guardaS;
    this._guardaG=null;
    this.editando=false;
  },
  /* grava se o estado mudou desde a última gravação; marca como editada */
  salvarSeMudou(){
    if(!this.editando||!this.reg)return false;
    this.reg.semente=_s;
    const j=JSON.stringify(this.reg.estado);
    if(j===this._ultimoJson)return false;
    this._ultimoJson=j;
    this.reg.editada=true;
    this.gravar();
    return true;
  },
  /* chamada a cada repintura do Banco de dados do menu: junta várias
     edições seguidas numa gravação só */
  agendarGravacao(){
    clearTimeout(this._timer);
    this._timer=setTimeout(()=>this.salvarSeMudou(),400);
  },

  /* volta para a base de data/, descartando as edições */
  async restaurarOriginal(){
    this.gerarOriginal();
    this._ultimoJson=JSON.stringify(this.reg.estado);
    /* com o Banco de dados do menu aberto, o Editor passa a ver a base nova */
    if(this.editando){G=this.reg.estado;_s=this.reg.semente;}
    await this.gravar();
  },

  /* G novo para uma carreira: cópia funda da base e semente nova */
  novoMundo(semente){
    if(!this.reg)this.gerarOriginal();
    if(this.editando)this.salvarSeMudou();
    const s=(semente>>>0)||(Math.floor(Math.random()*900000)+1000);
    const estado=JSON.parse(JSON.stringify(this.reg.estado));
    estado.seed=s;estado.meuTime=null;
    G=estado;srand(s);
    return G;
  }
};

/* ============================================================
   PACOTE DE IMAGENS — escudos e fotos enviados pelo Editor
   ------------------------------------------------------------
   Por que existe: rodando em file:// o navegador não escreve na
   pasta assets/, então "subir uma imagem" não pode significar
   gravar arquivo. O pacote resolve guardando as imagens num
   store próprio do IndexedDB, FORA da run — a decisão de
   arquitetura de não colocar imagem no save continua valendo
   (ver docs/ARQUITETURA.md): o save segue leve e o pacote pode
   ser trocado sem tocar na run.

   Chave: 'logo:<slug da tag>' e 'foto:<slug do nick>'. É a mesma
   convenção de assets/, então o pacote e a pasta são
   intercambiáveis, e renomear tag ou nick no Editor re-chaveia a
   imagem em vez de perdê-la.

   Toda imagem é reduzida para 256×256 PNG na entrada, o que
   mantém o pacote na casa de dezenas de KB por item. O cache em
   memória é síncrono de propósito: escudo() e retrato() montam
   HTML na hora e não podem esperar promessa.
   ============================================================ */
const IMGS_STORE='imgs';
const Imgs={
  cache:new Map(),
  modo:'memoria',
  lado:256,              /* imagens são normalizadas para lado×lado */
  limiteAviso:400*1024,  /* acima disso avisa antes de reduzir */

  /* cada tipo tem seu formato de normalização; escudo e arte são quadrados,
     retrato de agente é 4:5 porque é o enquadramento das artes oficiais */
  formatos:{logo:[256,256],foto:[256,256],arte:[256,256],agente:[256,320],staff:[256,320],
            marca:[320,160]},
  chaveTime(tag){return 'logo:'+ASSETS.slug(tag);},
  chaveJog(nick){return 'foto:'+ASSETS.slug(nick);},
  chaveTorneio(id){return 'arte:'+ASSETS.slug(id);},
  chaveAgente(nome){return 'agente:'+ASSETS.slug(nome);},
  chaveStaff(nome){return 'staff:'+ASSETS.slug(nome);},
  /* logo de patrocinador é deitado, não quadrado: marca é assinatura horizontal */
  chaveMarca(id){return 'marca:'+ASSETS.slug(id);},
  formatoDaChave(k){return this.formatos[String(k).split(':')[0]]||[this.lado,this.lado];},
  get(k){return this.cache.get(k)||null;},
  tem(k){return this.cache.has(k);},
  quantos(){return this.cache.size;},
  bytes(){let n=0;for(const v of this.cache.values())n+=v.length*0.75;return Math.round(n);},

  async iniciar(){
    try{
      if(Storage.modo==='indexeddb'&&Storage._db&&
         Storage._db.objectStoreNames.contains(IMGS_STORE)){
        this.modo='indexeddb';
        const itens=await Storage._store(IMGS_STORE,st=>st.getAll());
        (itens||[]).forEach(i=>{if(i&&i.k&&i.v)this.cache.set(i.k,i.v);});
      }else this.modo='memoria';
    }catch(e){this.modo='memoria';}
    return this.modo;
  },
  async gravar(k,uri){
    this.cache.set(k,uri);
    if(this.modo==='indexeddb'){
      try{await Storage._store(IMGS_STORE,st=>st.put({k,v:uri}),'readwrite');}
      catch(e){return false;}
    }
    return true;
  },
  async apagar(k){
    this.cache.delete(k);
    if(this.modo==='indexeddb'){
      try{await Storage._store(IMGS_STORE,st=>st.delete(k),'readwrite');}catch(e){}
    }
  },
  async renomear(de,para){
    if(de===para)return;
    const v=this.cache.get(de);
    if(!v)return;
    await this.gravar(para,v);
    await this.apagar(de);
  },
  async limpar(){
    const ks=[...this.cache.keys()];
    for(const k of ks)await this.apagar(k);
  },

  /* lê um File, encaixa em larg×alt preservando proporção e devolve data URI PNG */
  doArquivo(file,larg,alt){
    return new Promise((res,rej)=>{
      if(!file)return rej(new Error('Nenhum arquivo.'));
      if(!/^image\//.test(file.type||''))return rej(new Error(file.name+': não é imagem.'));
      const fr=new FileReader();
      fr.onload=()=>{
        const im=new Image();
        im.onload=()=>{
          try{
            const nx=larg||this.lado,ny=alt||larg||this.lado;
            const cv=document.createElement('canvas');
            cv.width=nx;cv.height=ny;
            const cx=cv.getContext('2d');
            const e=Math.min(nx/im.width,ny/im.height);
            const w=Math.round(im.width*e),h=Math.round(im.height*e);
            cx.drawImage(im,Math.round((nx-w)/2),Math.round((ny-h)/2),w,h);
            res(cv.toDataURL('image/png'));
          }catch(err){rej(err);}
        };
        im.onerror=()=>rej(new Error(file.name+': não deu para decodificar.'));
        im.src=fr.result;
      };
      fr.onerror=()=>rej(fr.error||new Error('Falha ao ler o arquivo.'));
      fr.readAsDataURL(file);
    });
  },

  /* deduz a chave pelo nome do arquivo: sen.png -> logo:sen se a tag existir.
     A ordem importa — tag, depois torneio, depois agente, depois jogador —
     porque um nome curto pode casar em mais de um lugar. */
  chavePorNome(nomeArquivo){
    const base=ASSETS.slug(String(nomeArquivo).replace(/\.[^.]+$/,''));
    if(!base)return null;
    const t=Object.values(G.times).find(x=>ASSETS.slug(x.tag)===base);
    if(t)return{k:this.chaveTime(t.tag),tipo:'logo',alvo:t.nome};
    if(G.torneios){
      const tor=Object.values(G.torneios).find(x=>ASSETS.slug(x.id)===base);
      if(tor)return{k:this.chaveTorneio(tor.id),tipo:'arte',alvo:tor.nome};
    }
    const ag=todosAgentes().find(a=>ASSETS.slug(a.nome)===base);
    if(ag)return{k:this.chaveAgente(ag.nome),tipo:'agente',alvo:ag.nome};
    if(G.staff){
      const st=Object.values(G.staff).find(x=>ASSETS.slug(x.nome)===base);
      if(st)return{k:this.chaveStaff(st.nome),tipo:'staff',alvo:st.nome};
    }
    const p=Object.values(G.jogadores).find(x=>ASSETS.slug(x.nome)===base);
    if(p)return{k:this.chaveJog(p.nome),tipo:'foto',alvo:p.nome};
    return null;
  },

  exportar(){
    return{tipo:'vct-manager-imagens',versao:1,lado:this.lado,
           itens:Object.fromEntries(this.cache)};
  },
  async importar(obj){
    if(!obj||obj.tipo!=='vct-manager-imagens'||!obj.itens)
      return{ok:false,erro:'Arquivo não parece um pacote de imagens.'};
    let n=0;
    for(const k in obj.itens){
      if(typeof obj.itens[k]==='string'&&obj.itens[k].startsWith('data:image/')){
        await this.gravar(k,obj.itens[k]);n++;
      }
    }
    return{ok:true,n};
  }
};

/* ============================================================
   ROSTOS GERADOS
   ------------------------------------------------------------
   O pacote é finito e fixo: ~2000 retratos sintéticos separados
   em baldes por região, faixa etária e gênero. O jogo não gera
   nada — só escolhe, e escolhe sempre igual para a mesma pessoa,
   porque a escolha é hash(id) dentro do balde.

   Consequência a lembrar: mudar a CONTAGEM de um balde reembaralha
   todos os rostos daquele balde. O pacote se congela e só cresce
   por append; se precisar trocar imagem, troque o arquivo, não a
   posição.
   ============================================================ */
const Rostos={
  /* o manifesto entra por aqui em vez de ser lido direto da constante: assim dá
     para trocar de pacote sem recarregar a página, e para testar sem arquivo */
  manifesto:null,
  /* Separado de `manifesto` de propósito. Antes, usar(null) zerava o manifesto
     e iniciar() logo recarregava a constante global — ou seja, com um pacote
     de verdade em data/rostos.js não havia como desligar o pacote. Agora
     "ninguém carregou ainda" e "foi desligado de propósito" são estados
     diferentes. */
  carregado:false,
  iniciar(){
    if(!this.carregado){
      this.carregado=true;
      if(typeof ROSTOS!=='undefined'&&ROSTOS&&ROSTOS.baldes)this.manifesto=ROSTOS;
    }
    return this.manifesto;
  },
  usar(m){this.carregado=true;this.manifesto=m&&m.baldes?m:null;return this.manifesto;},
  /* volta ao estado de fábrica: relê data/rostos.js na próxima consulta */
  redefinir(){this.carregado=false;this.manifesto=null;return this;},
  pronto(){return !!(this.iniciar()&&this.manifesto.baldes);},
  /* FNV-1a: barato, bem distribuído e estável entre navegadores */
  hash(s){
    let h=0x811c9dc5;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h>>>0;
  },
  faixa(idade){return idade<28?'jovem':'veterano';},
  regiao(pessoa){
    if(pessoa.timeId&&G.times[pessoa.timeId])return G.times[pessoa.timeId].regiao;
    return pessoa.regiaoOrigem||REGIONS[0].id;
  },
  balde(pessoa){
    return this.regiao(pessoa)+'_'+this.faixa(pessoa.idade)+'_'+(pessoa.genero==='f'?'f':'m');
  },
  /* quem recebe rosto gerado depende da preferência: 'ficticios' é o padrão
     porque a base tem 447 nomes de jogadores reais */
  elegivel(pessoa){
    const modo=Prefs.get('rostosGerados');
    if(modo==='nenhum')return false;
    if(modo==='todos')return true;
    return !pessoa.real;
  },
  caminho(pessoa){
    if(!this.pronto()||!this.elegivel(pessoa))return null;
    let b=this.balde(pessoa);
    let n=this.manifesto.baldes[b];
    if(!n){                                   /* balde ausente: cai no genérico */
      b=(pessoa.genero==='f'?'f':'m')+'_'+this.faixa(pessoa.idade);
      n=this.manifesto.baldes[b];
      if(!n){b=Object.keys(this.manifesto.baldes)[0];n=this.manifesto.baldes[b];}
      if(!n)return null;
    }
    const i=this.hash(String(pessoa.id)+'|'+b)%n;
    return this.manifesto.dir+b+'/'+String(i).padStart(4,'0')+'.'+this.manifesto.ext;
  },
  quantos(){
    if(!this.pronto())return 0;
    return Object.values(this.manifesto.baldes).reduce((a,b)=>a+b,0);
  }
};

/* stubs do que storage.js espera do navegador */
module.exports={criarMundo,montarCalendario,avancar,desempacotarRun,empacotarRun,
  RUN_VERSAO,acharStage,blocoDaSemana,get G(){return G;},set G(v){G=v;},
  get semente(){return _s;}};