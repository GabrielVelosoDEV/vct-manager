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
      (buff.length?buff.join(' e ')+' levaram buff':'')+'.');
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
