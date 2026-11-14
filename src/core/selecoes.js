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
const SELECAO_IDADE_MIN=15;
function convocaveis(pais){
  return Object.values(G.jogadores).filter(p=>p&&p.pais===pais&&(p.idade||0)>=SELECAO_IDADE_MIN);
}
/* Os livres que não podem sumir do mundo no corte de fim de ano: os de
   países que ficariam abaixo do mínimo de convocáveis sem eles. */
function protegidosDaCopa(){
  const out=new Set();
  if(typeof COPA_SELECOES==='undefined')return out;
  for(const pais of paisesDaCopa()){
    const l=convocaveis(pais);
    if(l.length>SELECAO_MINIMO+1)continue;
    for(const p of l)if(!p.timeId&&!p.base)out.add(p.id);
  }
  return out;
}
/* o melhor cinco do país: a conta da escalação, num elenco de mentira */
function _cincoDoPais(lista){
  if(lista.length<5)return lista.map(p=>p.id);
  /* só os 14 melhores entram na busca: o resto não muda o cinco e deixa a conta lenta */
  const el=lista.slice().sort((a,b)=>over(b)-over(a)).slice(0,14);
  const falso={elenco:el.map(p=>p.id),titulares:[]};
  return (typeof melhorEscalacao==='function'?melhorEscalacao(falso):null)||el.slice(0,5).map(p=>p.id);
}
/* a convocação da semana fica guardada: a tela da Copa pede as 40 várias
   vezes e cada uma passa pela conta da escalação */
let _convSemana={g:null,chave:'',mapa:{}};
function convocacao(pais){
  const chave=G.ano+'|'+G.semana+'|'+G.seqP;
  if(_convSemana.g!==G||_convSemana.chave!==chave)_convSemana={g:G,chave,mapa:{}};
  if(!(pais in _convSemana.mapa))_convSemana.mapa[pais]=_convocacao(pais);
  return _convSemana.mapa[pais];
}
function _convocacao(pais){
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

/* ---------- convidadas e eliminatórias ----------
   As duas contas usam o ranking do momento: chamadas no dia do sorteio
   (fim do ano ímpar), o resultado fica gravado na edição (C2); chamadas
   antes disso, mostram como seria se o sorteio fosse hoje. */
function convidadasDaCopa(ano){
  ano=proximaCopa(ano);
  const sede=sedeDoAno(ano).pais, rk=rankingPaises().filter(x=>convocacao(x.pais));
  const l=[sede];
  for(const x of rk){if(l.length>=COPA_CONVITES)break;if(x.pais!==sede)l.push(x.pais);}
  return l;
}
/* os grupos das eliminatórias: por continente, potes pelo ranking, sorteio
   local (a mesma carreira sorteia sempre os mesmos grupos e o mundo não muda) */
function gruposEliminatorias(ano,convidadas){
  ano=proximaCopa(ano);
  const conv=new Set(convidadas||convidadasDaCopa(ano)), rk=rankingPaises();
  const fila=rk.filter(x=>!conv.has(x.pais)&&convocacao(x.pais));
  const tam=ELIM_POR_GRUPO;
  return comSorteioLocal('elim|'+(G.seed||0)+'|'+ano,()=>{
    const embaralha=l=>{l=l.slice();for(let i=l.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[l[i],l[j]]=[l[j],l[i]];}return l;};
    /* potes: as melhores de cada fatia de tamanho g vão uma para cada grupo */
    const montar=(lista,nome)=>{
      const g=Math.floor(lista.length/tam);if(!g)return [];
      const gs=Array.from({length:g},()=>[]);
      for(let p=0;p<tam;p++)embaralha(lista.slice(p*g,p*g+g)).forEach((x,i)=>gs[i].push(x.pais));
      lista.slice(g*tam).forEach((x,i)=>gs[gs.length-1-(i%g)].push(x.pais));   /* só se faltar seleção */
      return gs.map(paises=>({cont:nome,paises}));
    };
    const grupos=[], sobras=[];
    for(const cont of Object.keys(COPA_CONTINENTES)){
      const l=fila.filter(x=>x.cont===cont);
      const n=Math.floor(l.length/tam)*tam;
      grupos.push(...montar(l.slice(0,n),cont));
      sobras.push(...l.slice(n));      /* as mais fracas do continente */
    }
    sobras.sort((a,b)=>b.pts-a.pts);
    grupos.push(...montar(sobras,'INTER'));
    return grupos.map((x,i)=>Object.assign(x,{letra:String.fromCharCode(65+i)}));
  });
}

/* ---------- nacionalidade dos agentes livres gerados ----------
   Chamado na criação do mundo, depois dos agentes livres, e em saves
   antigos na primeira vez que a Copa é aberta. Só mexe em gerado sem
   clube, nunca em jogador real, e nunca tira um país de 7 ou mais. */
function orientarNacionalidadesCopa(soEstes){
  if(!G||!G.jogadores)return 0;
  const conta={};
  for(const p of Object.values(G.jogadores))if(p&&p.pais)conta[p.pais]=(conta[p.pais]||0)+1;
  const falta=[];
  for(const pais of paisesDaCopa()){const f=SELECAO_MINIMO-(conta[pais]||0);for(let i=0;i<f;i++)falta.push(pais);}
  if(!falta.length)return 0;
  /* doadores: gerados sem clube. A cada vaga, sai o doador do país que está
     com mais gente (empate: ordem de criação), e ninguém deixa o próprio
     país abaixo de 7 — a conta é estável e não usa o gerador do mundo. */
  const naCopa=new Set(paisesDaCopa());
  const doadores=(soEstes||G.livres||[]).map(i=>G.jogadores[i])
    .filter(p=>p&&!p.real&&!p.timeId&&!p.base&&!p.voce)
    .sort((a,b)=>(+String(a.id).slice(1))-(+String(b.id).slice(1)));
  const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
  let feitos=0;
  while(falta.length){
    let p=null;
    for(const d of doadores){
      if(naCopa.has(d.pais)&&(conta[d.pais]||0)<=SELECAO_MINIMO)continue;
      if(!p||(naCopa.has(p.pais)&&(!naCopa.has(d.pais)||(conta[d.pais]||0)>(conta[p.pais]||0))))p=d;
    }
    if(!p)break;
    doadores.splice(doadores.indexOf(p),1);
    const de=p.pais, para=falta.shift();
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
  if(feitos)_convSemana={g:null,chave:'',mapa:{}};
  return feitos;
}
