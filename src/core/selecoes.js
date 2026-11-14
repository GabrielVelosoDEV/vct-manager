/* ============================================================
   VALORANT WORLD CUP — AS SELEÇÕES (C0)
   ------------------------------------------------------------
   Uma seleção não é um clube: não está em G.times, não tem caixa,
   não joga liga nem compra ninguém. É o país (data/copa.js) mais a
   lista dos convocáveis, que são TODOS os jogadores daquela
   nacionalidade: com clube, livres ou da base, reais ou gerados.

   Convocação: o melhor cinco possível do país pela mesma conta da
   escalação dos clubes (lineup.js: over na função e cobertura das
   funções), e depois os melhores reservas, até 10. País com menos
   de 7 convocáveis fica sem seleção.

   Na criação do mundo, os 70 agentes livres gerados que toda
   carreira já sorteia têm a nacionalidade orientada para cobrir o
   que falta para cada seleção chegar a 7 (ninguém é criado a mais).
   O nome novo sai de um sorteio local, então o gerador do mundo
   continua na mesma sequência.

   O estado da Copa mora em G.copa:
     {ranking:{BR:pts…}, edicoes:[…], ...}
   ============================================================ */

function infoSelecao(pais){
  const x=COPA_SELECOES.find(s=>s[0]===pais);
  return x?{pais:x[0],sigla:x[1],cont:x[2],nome:(typeof PAISES!=='undefined'&&PAISES[x[0]])||x[0]}:null;
}
function paisesDaCopa(){return COPA_SELECOES.map(s=>s[0]);}

/* ---------- quem pode ser convocado ---------- */
function convocaveis(pais){
  return Object.values(G.jogadores).filter(p=>p&&p.pais===pais&&(p.idade||0)>=16);
}
/* o melhor cinco do país: a conta da escalação, num elenco de mentira */
function _cincoDoPais(lista){
  if(lista.length<5)return lista.map(p=>p.id);
  /* só os 14 melhores entram na busca: o resto não muda o cinco e deixa a conta lenta */
  const el=lista.slice().sort((a,b)=>over(b)-over(a)).slice(0,14);
  const falso={elenco:el.map(p=>p.id),titulares:[]};
  return (typeof melhorEscalacao==='function'?melhorEscalacao(falso):null)||el.slice(0,5).map(p=>p.id);
}
function convocacao(pais){
  const todos=convocaveis(pais).filter(p=>!p.lesao);
  if(todos.length<SELECAO_MINIMO)return null;
  const titulares=_cincoDoPais(todos);
  const reservas=todos.filter(p=>!titulares.includes(p.id)).sort((a,b)=>over(b)-over(a))
    .slice(0,SELECAO_TAMANHO-titulares.length).map(p=>p.id);
  return{pais,titulares,reservas};
}
/* força: a nota do melhor cinco dividida por cinco (over efetivo médio) */
function forcaSelecao(pais,conv){
  conv=conv||convocacao(pais);
  if(!conv)return 0;
  const rs=conv.titulares.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length<5)return rs.length?rs.reduce((s,p)=>s+over(p),0)/rs.length-6:0;
  const n=typeof distribuirFuncoes==='function'?distribuirFuncoes(rs).nota:rs.reduce((s,p)=>s+over(p),0);
  return Math.round(n/5*10)/10;
}

/* ---------- o estado da Copa ---------- */
const RANKING_BASE=1500, RANKING_POR_PONTO=25;
function garantirCopa(){
  if(!G)return null;
  /* save de antes da Copa: orienta os livres gerados que houver e começa o ranking */
  if(!G.copa){orientarNacionalidadesCopa();G.copa={ranking:{},edicoes:[],criada:G.ano};}
  const c=G.copa;
  if(!c.ranking)c.ranking={};
  for(const pais of paisesDaCopa())
    if(c.ranking[pais]==null){
      const f=forcaSelecao(pais);
      c.ranking[pais]=Math.round(RANKING_BASE+(f-75)*RANKING_POR_PONTO);
    }
  return c;
}
function rankingPaises(){
  const c=garantirCopa();if(!c)return[];
  return paisesDaCopa().map(p=>({pais:p,pts:c.ranking[p],...infoSelecao(p)}))
    .sort((a,b)=>b.pts-a.pts||a.pais.localeCompare(b.pais))
    .map((x,i)=>Object.assign(x,{pos:i+1}));
}
/* a edição de um ano (par a partir de 2028) e a sede dela */
function anoDeCopa(ano){return ano>=COPA_PRIMEIRA&&(ano-COPA_PRIMEIRA)%COPA_INTERVALO===0;}
function anoDeEliminatorias(ano){return anoDeCopa(ano+1);}
function proximaCopa(ano){
  ano=ano==null?G.ano:ano;
  if(ano<=COPA_PRIMEIRA)return COPA_PRIMEIRA;
  const resto=(ano-COPA_PRIMEIRA)%COPA_INTERVALO;
  return resto===0?ano:ano+(COPA_INTERVALO-resto);
}
function edicaoDoAno(ano){return Math.floor((ano-COPA_PRIMEIRA)/COPA_INTERVALO)+1;}
function sedeDoAno(ano){
  const i=(edicaoDoAno(ano)-1)%COPA_SEDES.length;
  const [pais,nome]=COPA_SEDES[(i+COPA_SEDES.length)%COPA_SEDES.length];
  return{pais,nome,edicao:edicaoDoAno(ano),ano};
}

/* ---------- nacionalidade dos agentes livres gerados ----------
   Chamado na criação do mundo, depois dos agentes livres, e em saves
   antigos na primeira vez que a Copa é aberta. Só mexe em gerado sem
   clube, nunca em jogador real, e nunca tira um país de 7 ou mais. */
function orientarNacionalidadesCopa(){
  if(!G||!G.jogadores)return 0;
  const conta={};
  for(const p of Object.values(G.jogadores))if(p&&p.pais)conta[p.pais]=(conta[p.pais]||0)+1;
  const falta=[];
  for(const pais of paisesDaCopa()){const f=SELECAO_MINIMO-(conta[pais]||0);for(let i=0;i<f;i++)falta.push(pais);}
  if(!falta.length)return 0;
  /* doadores: gerados sem clube, de países com folga (ou fora das 40), na
     ordem de criação (estável) */
  const naCopa=new Set(paisesDaCopa());
  const doadores=(G.livres||[]).map(i=>G.jogadores[i])
    .filter(p=>p&&!p.real&&!p.timeId&&!p.base&&!p.voce)
    .sort((a,b)=>(+String(a.id).slice(1))-(+String(b.id).slice(1)));
  const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
  let feitos=0;
  for(const p of doadores){
    if(!falta.length)break;
    const de=p.pais;
    if(naCopa.has(de)&&(conta[de]||0)<=SELECAO_MINIMO+2)continue;   /* não desfalca quem está no limite */
    const para=falta.shift();
    conta[de]=(conta[de]||0)-1;conta[para]=(conta[para]||0)+1;
    p.pais=para;
    /* nick com o sotaque do país novo, de um sorteio local (o mundo não muda) */
    usados.delete(p.nome);
    const nome=typeof comSorteioLocal==='function'&&typeof nomeUnico==='function'
      ?comSorteioLocal('nac|'+p.id+'|'+para,()=>nomeUnico(usados,para)):null;
    if(nome){p.nome=nome;usados.add(nome);}
    const R=typeof REGIONS!=='undefined'&&REGIONS.find(r=>r.paises.includes(para));
    if(R)p.regiaoOrigem=R.id;
    feitos++;
  }
  return feitos;
}
