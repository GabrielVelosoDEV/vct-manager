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
