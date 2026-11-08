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
