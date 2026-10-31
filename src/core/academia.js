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
const BASE_INICIAL=2;

function vagasDaBase(t){return 2+((t.estrutura&&t.estrutura.academia)||1);}
function baseDe(t){return ((t&&t.base)||[]).map(id=>G.jogadores[id]).filter(Boolean);}
function custoDaBase(t){return ((t&&t.base)||[]).length*BASE_CUSTO_SEMANA;}

/* Um garoto novo na categoria. O olheiro procura a função do foco, se
   houver; a academia e o olheiro mexem no nível e no teto. */
function revelarUm(t,usados){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  const olh=(t.staff&&t.staff.olheiro)||neutro;
  const acad=(t.estrutura&&t.estrutura.academia)||1;
  const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
  /* Garoto de 15 ou 16 anos: na régua do agente livre gerado (60), um pouco
     acima com academia e olheiro bons. É projeto de três ou quatro anos. */
  const alvo=clamp(Math.round(gauss(52+acad*2+(olh-neutro)*2+(t.tier===1?2:0),4)),45,70);
  const role=t.baseFoco||pick(ROLES);
  const p=makePlayer(alvo,role,pick(R.paises),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
  aplicarOver(p,alvo);
  p.pot=clamp(Math.round(over(p)+ri(14,28)+acad+(olh-neutro)),over(p)+10,96);
  p.timeId=null;p.contrato=0;p.salario=0;
  p.base=t.id;p.daCasa=t.id;p.baseDesde=G.ano;
  G.jogadores[p.id]=p;
  (t.base=t.base||[]).push(p.id);
  return p;
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
  const t=G.meuTime&&G.times[G.meuTime];
  if(!t)return 0;
  if(!t.base)t.base=[];
  const vagas=vagasDaBase(t)-baseDe(t).length;
  if(vagas<=0)return 0;
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  const olh=(t.staff&&t.staff.olheiro)||neutro;
  const acad=(t.estrutura&&t.estrutura.academia)||1;
  const n=Math.min(vagas,1+(rnd()<acad*0.15+(olh-neutro)*0.05?1:0));
  const novos=[];
  for(let i=0;i<n;i++)novos.push(revelarUm(t,usados));
  noticia('🌱 A academia revelou '+novos.map(p=>p.nome+' ('+p.role+', pot. '+p.pot+')').join(' e ')+'.',{c:'clube',p:novos.map(p=>p.id),t:[t.id]});
  return n;
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
