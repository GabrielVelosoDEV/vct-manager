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
  for(const R of REGIONS){
    add('kickoff_'+R.id,'Kickoff '+R.nome,'Kickoff',R.id,1,100000);
    add('stage1_'+R.id,'Stage 1 · '+R.nome,'Stage 1',R.id,1,0);
    add('stage2_'+R.id,'Stage 2 · '+R.nome,'Stage 2',R.id,1,0);
    add('po1_'+R.id,'Playoffs Stage 1 · '+R.nome,'Playoffs 1',R.id,1,160000);
    add('po2_'+R.id,'Playoffs Stage 2 · '+R.nome,'Playoffs 2',R.id,1,160000);
    add('split1_'+R.id,'Split 1 · '+R.t2,'Split 1',R.id,2,0);
    add('split2_'+R.id,'Split 2 · '+R.t2,'Split 2',R.id,2,0);
    add('cp1_'+R.id,'Playoffs Split 1 · '+R.t2,'PO Split 1',R.id,2,40000);
    add('cp2_'+R.id,'Playoffs Split 2 · '+R.t2,'PO Split 2',R.id,2,40000);
    add('asc_'+R.id,'Ascension '+R.nome,'Ascension',R.id,2,130000);
  }
  G.torneios=T;
  return T;
}

/* qual curva de premiação cada torneio usa */
function categoriaTorneio(id){
  const direto={champions:'champions',masters1:'masters',masters2:'masters'}[id];
  if(direto)return direto;
  const pre=String(id).split('_')[0];
  return {kickoff:'kickoff',po1:'po',po2:'po',cp1:'chall',cp2:'chall',asc:'ascension'}[pre]||null;
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
const PREFIXO_TORNEIO={kick:'kickoff',kg:'kickoff',s1:'stage1',s2:'stage2',po1:'po1',po2:'po2',
                       c1:'split1',c2:'split2',cp1:'cp1',cp2:'cp2',asc:'asc'};
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
/* nome de exibição de um stage: catálogo primeiro, rótulo do stage como reserva */
function nomeStage(s){
  if(!s)return '—';
  const base=(s.torneioId&&nomeTorneio(s.torneioId))||s.nome||'—';
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
  return (s.torneioId&&nomeTorneio(s.torneioId))||s.nome||'—';
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
