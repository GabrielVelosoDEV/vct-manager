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
