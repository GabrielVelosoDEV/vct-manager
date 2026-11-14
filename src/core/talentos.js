/* ============================================================
   MODO JOGADOR — A ÁRVORE DE TALENTOS (J3)
   ------------------------------------------------------------
   Uma árvore por função, com três ramos e seis fileiras. Cada
   fileira abre numa faixa de over (65, 70, 75, 80, 85, 90). Os
   pontos vêm do over: cada ponto acima de 65 no seu melhor over
   (o pico) vale um ponto de talento. Um jogador de over 90 tem 25
   pontos para 46 possíveis, então ninguém fecha a árvore.

   Fileiras 1 a 5: três níveis cada. A fileira 6 é o talento-
   assinatura do ramo: um nível só, e só uma assinatura na carreira.
   Para comprar um talento, o de cima no mesmo ramo precisa ter
   pelo menos um ponto.

   Os efeitos são poucos tipos, todos já entendidos pelo jogo:
     a      atributo na partida (motor e gameplay), por nível
     xp     XP a mais nesses atributos, por nível (fração)
     en     energia a menos por atividade, por nível (fração)
     dec    freia a queda da idade, por nível (fração)
     fam    aprende agente mais rápido, por nível (fração)
     vida   vida recuperada a cada abate, na partida
     ult    ponto de ultimate a mais por abate (fração acumulada)
     forma  forma que o treino do clube dá, por nível
     vod    bônus da revisão de VOD, por nível (fração)
   ============================================================ */

const TALENTO_FILEIRAS=[65,70,75,80,85,90];
const TALENTO_NIVEIS=3;
const TALENTO_BASE=65;

const T_=(id,nome,ef,txt)=>({id,nome,ef,txt});
const TALENTOS={
  Duelista:[
    {id:'entrada',nome:'Entrada',estilos:['entrada'],desc:'Abrir o bomb e trocar a primeira vida.',t:[
      T_('due_e1','Pé no acelerador',{a:{mov:1}},'Chega primeiro no espaço.'),
      T_('due_e2','Abre-alas',{vida:5},'Cada abate devolve vida.'),
      T_('due_e3','Treino de entrada',{xp:{mov:.08,reflexo:.06}},'O treino rende mais no corpo.'),
      T_('due_e4','Sem medo do contato',{a:{reflexo:1,mov:1}},'Reage antes no primeiro duelo.'),
      T_('due_e5','Dash recarregado',{ult:.12},'Abate empurra a ultimate.'),
      T_('due_e6','Ponta de lança',{vida:20,a:{mov:3}},'Assinatura: cada abate cura forte e você não para.')]},
    {id:'mira',nome:'Mira',estilos:['mira'],desc:'Duelo puro: mira e reflexo.',t:[
      T_('due_m1','Mão firme',{a:{mira:1}},'Bala mais assentada.'),
      T_('due_m2','Range diário',{xp:{mira:.08,reflexo:.06}},'Range e deathmatch rendem mais.'),
      T_('due_m3','Reflexo afiado',{a:{reflexo:1}},'Do pixel ao tiro, mais rápido.'),
      T_('due_m4','Cabeça fria no duelo',{a:{mira:1,consist:1}},'Duelo ganho não depende do dia.'),
      T_('due_m5','Spray controlado',{a:{mira:1,reflexo:1}},'Segunda e terceira balas no lugar.'),
      T_('due_m6','Mira de elite',{a:{mira:4,reflexo:2}},'Assinatura: a mira mais limpa do servidor.')]},
    {id:'lurker',nome:'Lurker',estilos:['lurker'],desc:'Flanco, informação e tempo de jogo.',t:[
      T_('due_l1','Passos leves',{a:{visao:1}},'Lê o mapa enquanto anda.'),
      T_('due_l2','Tempo de jogo',{a:{clutch:1}},'Sabe esperar o round vir.'),
      T_('due_l3','Estudo de VOD',{vod:.35,xp:{visao:.08}},'Revisar adversário rende mais.'),
      T_('due_l4','Flanco perfeito',{a:{visao:1,clutch:1}},'Aparece onde ninguém olhou.'),
      T_('due_l5','Último vivo',{a:{clutch:2}},'Clutch é o seu round.'),
      T_('due_l6','Fantasma',{a:{clutch:3,visao:3}},'Assinatura: o round tardio é seu.')]}
  ],
  Iniciador:[
    {id:'info',nome:'Informação',estilos:['lurker'],desc:'Achar o inimigo antes de todo mundo.',t:[
      T_('ini_i1','Olho no minimapa',{a:{visao:1}},'Informação vira call.'),
      T_('ini_i2','Recon caprichado',{a:{util:1}},'A utilidade acha gente.'),
      T_('ini_i3','Sala de vídeo',{vod:.35,xp:{visao:.08}},'Revisar adversário rende mais.'),
      T_('ini_i4','Leitura de setup',{a:{visao:1,util:1}},'Sabe onde a defesa está.'),
      T_('ini_i5','Recarga rápida',{ult:.12},'A ultimate chega antes.'),
      T_('ini_i6','Radar humano',{a:{visao:4,util:2}},'Assinatura: o time joga sabendo tudo.')]},
    {id:'apoio',nome:'Apoio de entrada',estilos:['suporte','entrada'],desc:'Flash e entrada junto com o duelista.',t:[
      T_('ini_a1','Flash no tempo',{a:{util:1}},'A flash estoura na hora certa.'),
      T_('ini_a2','Troca garantida',{a:{reflexo:1}},'Entra logo atrás e troca.'),
      T_('ini_a3','Lineups de casa',{xp:{util:.08,mov:.06}},'Prática de utilidade rende mais.'),
      T_('ini_a4','Dupla de entrada',{a:{util:1,mov:1}},'Abre o espaço junto.'),
      T_('ini_a5','Reabastece no abate',{vida:6},'Abate devolve vida.'),
      T_('ini_a6','Abre-bomb',{a:{util:3,reflexo:2},vida:8},'Assinatura: o bomb abre quando você chega.')]},
    {id:'cerebro',nome:'Cérebro',estilos:['ancora'],desc:'Jogo pensado, meio de round, pós-plant.',t:[
      T_('ini_c1','Calma',{a:{consist:1}},'Joga igual em qualquer placar.'),
      T_('ini_c2','Pós-plant',{a:{clutch:1}},'Segura o bomb depois do plant.'),
      T_('ini_c3','Agenda organizada',{en:.06},'Cada atividade cansa menos.'),
      T_('ini_c4','Mid-round',{a:{visao:1,clutch:1}},'Ajusta o round no meio.'),
      T_('ini_c5','Leitura de economia',{a:{visao:1,consist:1}},'Sabe quando o rival está quebrado.'),
      T_('ini_c6','Professor',{a:{visao:3,clutch:2,consist:2}},'Assinatura: o round sai como foi desenhado.')]}
  ],
  Controlador:[
    {id:'fumaca',nome:'Fumaças',estilos:['suporte'],desc:'Smokes no lugar e no tempo.',t:[
      T_('con_f1','Smoke de casa',{a:{util:1}},'A fumaça cai onde deve.'),
      T_('con_f2','Lineups',{xp:{util:.10}},'Prática de utilidade rende mais.'),
      T_('con_f3','Timing',{a:{util:1,visao:1}},'Cobre a entrada na hora.'),
      T_('con_f4','Cortina dupla',{a:{util:2}},'Isola dois ângulos de uma vez.'),
      T_('con_f5','Recarga de ultimate',{ult:.15},'A ultimate chega antes.'),
      T_('con_f6','Arquiteto',{a:{util:5,visao:2}},'Assinatura: o mapa vira o que você desenha.')]},
    {id:'ancora',nome:'Âncora',estilos:['ancora'],desc:'Segurar o bomb e o pós-plant.',t:[
      T_('con_a1','Não se apavora',{a:{clutch:1}},'Aguenta sozinho.'),
      T_('con_a2','Paciência',{a:{consist:1}},'Não dá o pico de graça.'),
      T_('con_a3','Corpo inteiro',{en:.06},'Cada atividade cansa menos.'),
      T_('con_a4','Pós-plant de molly',{a:{util:1,clutch:1}},'Negar o desarme é arte.'),
      T_('con_a5','Veterano',{dec:.25},'A idade pesa menos.'),
      T_('con_a6','Muralha',{a:{clutch:4,consist:3}},'Assinatura: o bomb só cai pagando caro.')]},
    {id:'igl',nome:'Leitura',estilos:['lurker','mira'],desc:'Ler o jogo e chamar o time.',t:[
      T_('con_l1','Calls curtas',{a:{visao:1}},'Fala pouco, fala certo.'),
      T_('con_l2','Caderno de VOD',{vod:.35,xp:{visao:.08}},'Revisar adversário rende mais.'),
      T_('con_l3','Estudo do meta',{fam:.25},'Aprende agente mais rápido.'),
      T_('con_l4','Leitura de rotação',{a:{visao:2}},'Chega antes da rotação deles.'),
      T_('con_l5','Treino coletivo',{forma:.008},'O treino do clube rende forma.'),
      T_('con_l6','Mestre de xadrez',{a:{visao:4,consist:2},vod:.5},'Assinatura: o adversário joga o seu jogo.')]}
  ],
  Sentinela:[
    {id:'ancora',nome:'Âncora',estilos:['ancora'],desc:'Segurar o bomb sozinho.',t:[
      T_('sen_a1','Ângulo travado',{a:{consist:1}},'O ângulo não abre.'),
      T_('sen_a2','Retake',{a:{clutch:1}},'Retake começa por você.'),
      T_('sen_a3','Treino de retake',{xp:{clutch:.08,visao:.06}},'Retake rende mais.'),
      T_('sen_a4','Atraso',{a:{clutch:1,consist:1}},'Compra tempo até o reforço.'),
      T_('sen_a5','Veterano',{dec:.25},'A idade pesa menos.'),
      T_('sen_a6','Dono do bomb',{a:{clutch:4,consist:3}},'Assinatura: o bomb é seu.')]},
    {id:'armadilha',nome:'Armadilhas',estilos:['suporte'],desc:'Utilidade que segura flanco.',t:[
      T_('sen_t1','Trap no tempo',{a:{util:1}},'A armadilha pega gente.'),
      T_('sen_t2','Setups',{xp:{util:.10}},'Prática de utilidade rende mais.'),
      T_('sen_t3','Informação de flanco',{a:{util:1,visao:1}},'Ninguém passa em silêncio.'),
      T_('sen_t4','Setup duplo',{a:{util:2}},'Dois setups por round.'),
      T_('sen_t5','Recarga de ultimate',{ult:.15},'A ultimate chega antes.'),
      T_('sen_t6','Fortaleza',{a:{util:4,visao:3}},'Assinatura: o flanco fechado a round inteiro.')]},
    {id:'operador',nome:'Operador',estilos:['mira','entrada'],desc:'A arma grande e o primeiro abate.',t:[
      T_('sen_o1','Olho de águia',{a:{mira:1}},'O tiro de longe sai.'),
      T_('sen_o2','Reposicionar',{a:{mov:1}},'Troca de ângulo depois do tiro.'),
      T_('sen_o3','Range de precisão',{xp:{mira:.08,reflexo:.06}},'Range rende mais.'),
      T_('sen_o4','Primeiro abate',{a:{mira:1,reflexo:1}},'Abre o round de longe.'),
      T_('sen_o5','Abate que acalma',{vida:6},'Abate devolve vida.'),
      T_('sen_o6','Sniper',{a:{mira:4,reflexo:3}},'Assinatura: o Operator mais temido da liga.')]}
  ],
  Flex:[
    {id:'coringa',nome:'Coringa',estilos:['suporte'],desc:'Joga onde o time precisa.',t:[
      T_('flx_c1','Pool largo',{fam:.25},'Aprende agente mais rápido.'),
      T_('flx_c2','Versátil',{a:{util:1}},'Utilidade de qualquer função.'),
      T_('flx_c3','Agenda leve',{en:.06},'Cada atividade cansa menos.'),
      T_('flx_c4','Duas funções',{a:{util:1,visao:1}},'Muda de papel no meio do mapa.'),
      T_('flx_c5','Pool de elite',{fam:.35},'O agente novo fica pronto rápido.'),
      T_('flx_c6','Canivete suíço',{a:{util:3,visao:2,mira:2}},'Assinatura: qualquer buraco do time é seu.')]},
    {id:'mira',nome:'Mira',estilos:['mira','entrada'],desc:'Duelo antes de tudo.',t:[
      T_('flx_m1','Mão firme',{a:{mira:1}},'Bala mais assentada.'),
      T_('flx_m2','Range diário',{xp:{mira:.08,reflexo:.06}},'Range rende mais.'),
      T_('flx_m3','Reflexo',{a:{reflexo:1}},'Reage antes.'),
      T_('flx_m4','Duelista reserva',{a:{mira:1,mov:1}},'Assume a entrada quando precisa.'),
      T_('flx_m5','Abate que cura',{vida:6},'Abate devolve vida.'),
      T_('flx_m6','Mira de elite',{a:{mira:4,reflexo:2}},'Assinatura: a mira do time.')]},
    {id:'leitura',nome:'Leitura',estilos:['lurker','ancora'],desc:'Jogo pensado e round tardio.',t:[
      T_('flx_l1','Calma',{a:{consist:1}},'Joga igual em qualquer placar.'),
      T_('flx_l2','Sala de vídeo',{vod:.35,xp:{visao:.08}},'Revisar adversário rende mais.'),
      T_('flx_l3','Round tardio',{a:{clutch:1}},'O fim do round é seu.'),
      T_('flx_l4','Leitura de jogo',{a:{visao:1,clutch:1}},'Antecipa a rotação.'),
      T_('flx_l5','Veterano',{dec:.25},'A idade pesa menos.'),
      T_('flx_l6','Cabeça do time',{a:{visao:3,clutch:3,consist:2}},'Assinatura: decide o round com a cabeça.')]}
  ]
};

/* ---------- consultas ---------- */
function arvoreDe(p){return TALENTOS[(p&&(p.role||p.roleAtual))]||TALENTOS.Flex;}
function _talentoPorId(id){
  for(const f in TALENTOS)for(const r of TALENTOS[f])for(let i=0;i<r.t.length;i++)
    if(r.t[i].id===id)return{t:r.t[i],ramo:r,fileira:i,funcao:f};
  return null;
}
function talentosDoJogador(){
  if(!G.voce)return{};
  if(!G.voce.talentos)G.voce.talentos={};
  return G.voce.talentos;
}
function nivelTalento(id){return talentosDoJogador()[id]||0;}
function maxNivelTalento(fileira){return fileira===5?1:TALENTO_NIVEIS;}
/* pontos: cada ponto de over acima de 65 no pico; o talento do estilo é de graça */
function pontosTalento(p){return Math.max(0,Math.round((p&&(p.pico||over(p)))||0)-TALENTO_BASE);}
function pontosGastos(){
  const tt=talentosDoJogador(), gratis=G.voce&&G.voce.talentoGratis;
  let n=0;for(const id in tt)n+=tt[id]-(id===gratis?1:0);
  return n;
}
function pontosLivres(p){return pontosTalento(p)-pontosGastos();}
function fileiraAberta(p,fileira){return Math.round(p.pico||over(p))>=TALENTO_FILEIRAS[fileira];}
function assinaturaEscolhida(){
  const tt=talentosDoJogador();
  for(const id in tt){const x=_talentoPorId(id);if(x&&x.fileira===5&&tt[id]>0)return id;}
  return null;
}
/* devolve null se pode, ou o motivo de não poder */
function porqueNaoTalento(p,id){
  const x=_talentoPorId(id);
  if(!x)return 'Talento desconhecido.';
  if(!arvoreDe(p).includes(x.ramo))return 'Esse ramo é de outra função.';
  if(nivelTalento(id)>=maxNivelTalento(x.fileira))return 'Já está no máximo.';
  if(!fileiraAberta(p,x.fileira))return `Abre com over ${TALENTO_FILEIRAS[x.fileira]}.`;
  if(x.fileira>0&&!nivelTalento(x.ramo.t[x.fileira-1].id))return `Precisa de um ponto em ${x.ramo.t[x.fileira-1].nome}.`;
  if(x.fileira===5&&assinaturaEscolhida()&&assinaturaEscolhida()!==id)return 'Você já tem uma assinatura.';
  if(pontosLivres(p)<1)return 'Sem pontos livres. Cada ponto de over acima de 65 dá um.';
  return null;
}
function comprarTalento(id){
  const p=meuJogador();
  const motivo=porqueNaoTalento(p,id);
  if(motivo)return{ok:false,motivo};
  talentosDoJogador()[id]=nivelTalento(id)+1;
  return{ok:true};
}
/* o talento de partida do estilo escolhido na criação: o primeiro do ramo do
   estilo, um nível, sem custar ponto */
function darTalentoDoEstilo(p){
  if(!G.voce||G.voce.talentoGratis)return;
  const arv=arvoreDe(p), est=G.voce.estilo;
  const ramo=arv.find(r=>(r.estilos||[]).includes(est))||arv[0];
  const id=ramo.t[0].id;
  talentosDoJogador()[id]=Math.max(1,nivelTalento(id));
  G.voce.talentoGratis=id;
}
/* soma de todos os efeitos comprados */
function efeitosTalentos(){
  const tot={a:{},xp:{},en:0,dec:0,fam:0,vida:0,ult:0,forma:0,vod:0};
  const tt=talentosDoJogador();
  for(const id in tt){
    const n=tt[id], x=_talentoPorId(id);if(!x||!n)continue;
    const ef=x.t.ef;
    for(const k in ef.a||{})tot.a[k]=(tot.a[k]||0)+ef.a[k]*n;
    for(const k in ef.xp||{})tot.xp[k]=(tot.xp[k]||0)+ef.xp[k]*n;
    for(const k of ['en','dec','fam','vida','ult','forma','vod'])if(ef[k])tot[k]+=ef[k]*n;
  }
  tot.en=Math.min(.4,tot.en);tot.dec=Math.min(.75,tot.dec);
  return tot;
}
/* texto curto do efeito de um nível */
function textoEfeito(ef){
  const nomes=Object.fromEntries(ATTRS);
  const out=[];
  for(const k in ef.a||{})out.push(`+${ef.a[k]} ${nomes[k]||k} na partida`);
  for(const k in ef.xp||{})out.push(`+${Math.round(ef.xp[k]*100)}% XP em ${nomes[k]||k}`);
  if(ef.en)out.push(`−${Math.round(ef.en*100)}% de energia por atividade`);
  if(ef.dec)out.push(`−${Math.round(ef.dec*100)}% na queda da idade`);
  if(ef.fam)out.push(`+${Math.round(ef.fam*100)}% no treino de agente`);
  if(ef.vida)out.push(`+${ef.vida} de vida por abate`);
  if(ef.ult)out.push(`+${Math.round(ef.ult*100)}% de ponto de ultimate por abate`);
  if(ef.forma)out.push(`treino do clube dá mais forma`);
  if(ef.vod)out.push(`+${Math.round(ef.vod*100)}% no bônus de VOD`);
  return out.join(' · ');
}
