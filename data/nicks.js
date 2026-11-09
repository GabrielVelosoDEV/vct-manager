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
