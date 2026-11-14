/* ============================================================
   VALORANT WORLD CUP — O CICLO E AS ELIMINATÓRIAS (C2)
   ------------------------------------------------------------
   Cada Copa tem um ciclo de dois anos, guardado em
   G.copa.ciclos[anoDaCopa]. No ano ímpar, antes dela:

     semana 1   anúncio da sede e da edição; a comissão das 40
                seleções é escolhida de novo
     novembro   (as datas estão em data/copa.js, ELIM_DIAS)
       dom 45   convites (a sede + as 15 melhores do ranking) e o
                sorteio dos 8 grupos de 3 das eliminatórias
       ter 46   rodada 1: 1º × 3º
       qui 46   rodada 1: 2º × 3º
       sáb 46   rodada 2: 1º × 2º, o jogo que costuma decidir o grupo
       dom 46   anúncio dos 32 classificados

   Depois dos playoffs do Champions, com a janela aberta: a convocação
   não toca no mercado e a pré-temporada segue.

   copaSemana() roda no fechamento de cada semana (clock.js) e faz
   tudo o que está atrasado — um save que pula semanas, ou que chega
   à Copa já no meio do ano, recupera as etapas na ordem.

   Toda virada de ano, os pontos do ranking andam um pouco em direção
   à força atual de cada país: geração boa sobe sem jogar, e quem
   envelhece cai.
   ============================================================ */
const COPA_SEM_SEDE=1, ELIM_SEM_SORTEIO=ELIM_DIAS.sorteio[0], ELIM_SEM_RODADA1=ELIM_DIAS.r1[0][0],
      ELIM_SEM_RODADA2=ELIM_DIAS.r2[0], ELIM_SEM_CLASSIFICADOS=ELIM_DIAS.classificados[0];

/* O dia de hoje para a Copa: num dia da janela (core/clock.js) só sai o que
   está marcado até ele; no fechamento da semana, tudo dela. `ano` é o ano em
   que a data cai: o que é de um ano que já passou chegou faz tempo. */
function _hojeCopa(){return G._copaHoje!=null?G._copaHoje:6;}
function _chegou(q,ano){
  if(ano!=null&&G.ano!==ano)return G.ano>ano;
  const s=G.semana||1;
  return s>q[0]||(s===q[0]&&q[1]<=_hojeCopa());
}
/* um dia da janela que passou: os jogos de seleção marcados até ele */
function copaDoDia(dia){
  G._copaHoje=dia;
  try{copaSemana();}finally{G._copaHoje=null;}
}
const RANKING_DERIVA=0.15;     /* fração do caminho até a força atual, por ano */

function cicloDaCopa(anoCopa,criar){
  const c=garantirCopa();if(!c)return null;
  c.ciclos=c.ciclos||{};
  if(!c.ciclos[anoCopa]&&criar){
    const s=sedeDoAno(anoCopa);
    c.ciclos[anoCopa]={ano:anoCopa,edicao:s.edicao,sede:s.pais,nomeSede:s.nome,
      anunciada:false,convidadas:null,grupos:null,classificados:null};
  }
  return c.ciclos[anoCopa]||null;
}
/* o ciclo que a tela mostra: o da próxima Copa */
function cicloAtual(){return cicloDaCopa(proximaCopa(G.ano),false);}

function _impSelecao(paises){
  const p=typeof meuJogador==='function'?meuJogador():null;
  return p&&paises.includes(p.pais)?3:1;
}
function _nomeSel(p){const i=infoSelecao(p);return i?i.nome:p;}

/* ---------- momentos ----------
   As telas que param o jogo (core → ui/copa-momentos.js): apresentação da
   sede, convidadas, classificados, sorteio e a campeã. Ficam numa fila até a
   tela abrir; o jogo sem tela (tools/) só acumula, com teto. */
function momentoCopa(tipo,dados){
  G.copaMomentos=(G.copaMomentos||[]).filter(m=>m.tipo!==tipo||m.ano!==dados.ano);
  G.copaMomentos.push(Object.assign({tipo},dados));
  if(G.copaMomentos.length>6)G.copaMomentos.shift();
}

/* ---------- a semana ---------- */
function copaSemana(){
  if(!G||G.ano<COPA_PRIMEIRA-1)return;
  const c=garantirCopa();if(!c)return;
  /* virada: o ranking anda em direção à força de hoje */
  if(c.deriva!==G.ano){c.deriva=G.ano;if(c.criada!==G.ano)derivarRanking();}
  /* ciclo de Copa que já passou vira resumo (core/copa-torneio.js) */
  if(typeof arquivarCiclo==='function')for(const k in c.ciclos||{})if(+k<G.ano)arquivarCiclo(c.ciclos[k]);
  if(anoDeEliminatorias(G.ano))_semanaEliminatorias(cicloDaCopa(G.ano+1,true));
  if(anoDeCopa(G.ano)&&typeof _semanaCopa==='function')_semanaCopa(cicloDaCopa(G.ano,true));
}
function derivarRanking(){
  const c=garantirCopa();
  for(const pais of paisesDaCopa()){
    const alvo=RANKING_BASE+(forcaSelecao(pais)-75)*RANKING_POR_PONTO;
    const atual=c.ranking[pais]==null?alvo:c.ranking[pais];
    c.ranking[pais]=Math.round(atual+(alvo-atual)*RANKING_DERIVA);
  }
}
function _semanaEliminatorias(cic){
  const sem=G.semana;
  if(!cic.anunciada&&sem>=COPA_SEM_SEDE){
    cic.anunciada=true;
    if(typeof escolherComissoesSelecoes==='function')escolherComissoesSelecoes();
    if(typeof abrirConvitesDeSelecao==='function')abrirConvitesDeSelecao(cic);
    const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(cic.sede):null;
    momentoCopa('sede',{ano:cic.ano});
    noticia(`🌍 ${cic.nomeSede} recebe a ${cic.edicao}ª Valorant World Cup, em novembro de ${cic.ano}${cid?', com a final em '+cid.nome:''}. As eliminatórias são em novembro, depois do Champions.`,
      {c:'competicoes',imp:2});
  }
  const ano=cic.ano-1;
  if(!cic.convidadas&&_chegou(ELIM_DIAS.sorteio,ano))sortearEliminatorias(cic);
  if(cic.grupos&&_chegou(ELIM_DIAS.r1[0],ano))jogarRodadaEliminatorias(cic,1);
  if(cic.grupos&&_chegou(ELIM_DIAS.r2,ano))jogarRodadaEliminatorias(cic,2);
  if(cic.grupos&&!cic.classificados&&_chegou(ELIM_DIAS.classificados,ano))fecharEliminatorias(cic);
}

/* ---------- domingo da 45: convites e sorteio ---------- */
function sortearEliminatorias(cic){
  cic.convidadas=convidadasDaCopa(cic.ano);
  cic.pontosNoSorteio=Object.assign({},garantirCopa().ranking);
  cic.grupos=gruposEliminatorias(cic.ano,cic.convidadas)
    .map(g=>({letra:g.letra,cont:g.cont,paises:g.paises.slice(),jogos:[],rodadas:0}));
  /* a convocação das eliminatórias sai no dia do sorteio e vale para os dois jogos */
  cic.convocadosElim={};
  for(const g of cic.grupos)for(const p of g.paises){const c=convocacao(p);if(c)cic.convocadosElim[p]={titulares:c.titulares.slice(),reservas:c.reservas.slice()};}
  if(typeof aoConvocarSelecao==='function')aoConvocarSelecao('elim',cic,cic.convocadosElim);
  momentoCopa('convidadas',{ano:cic.ano});
  noticia(`✉️ World Cup ${cic.ano}: ${cic.convidadas.length} seleções convidadas — ${cic.convidadas.map(_nomeSel).join(', ')}. As outras ${cic.grupos.reduce((s,g)=>s+g.paises.length,0)} disputam 16 vagas nas eliminatórias.`,
    {c:'competicoes',imp:_impSelecao(cic.convidadas)});
  noticia(`🎲 Sorteio das eliminatórias: ${cic.grupos.map(g=>g.letra+' ('+g.paises.map(p=>infoSelecao(p).sigla).join(', ')+')').join(' · ')}.`,
    {c:'competicoes',imp:1});
}

/* ---------- semana 46: os jogos ----------
   Grupo de 3 com a ordem do pote: rodada 1 é 1º×3º e 2º×3º, rodada 2 é
   1º×2º. Grupo de 4 (só se faltar seleção): todos contra todos em duas
   rodadas de três jogos. */
function _jogosDaRodada(g,r){
  const p=g.paises;
  if(p.length===3)return r===1?[[p[0],p[2]],[p[1],p[2]]]:[[p[0],p[1]]];
  const todos=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)todos.push([p[i],p[j]]);
  const meio=Math.ceil(todos.length/2);
  return r===1?todos.slice(0,meio):todos.slice(meio);
}
/* um jogo de cada vez: o que já foi jogado (inclusive antes, na tela do modo
   jogador) não se joga de novo, e a notícia sai quando a rodada fecha */
function _jaJogado(g,a,b,r){return (g.jogos||[]).some(f=>f.rodada===r&&((f.a===a&&f.b===b)||(f.a===b&&f.b===a)));}
/* a data de cada jogo: na rodada 1, o primeiro na terça e o segundo na quinta */
function _diaElim(r,i){return r===1?ELIM_DIAS.r1[Math.min(i,ELIM_DIAS.r1.length-1)]:ELIM_DIAS.r2;}
function jogarRodadaEliminatorias(cic,r){
  const cv=cic.convocadosElim||{};
  let completa=true;
  for(const g of cic.grupos){
    if((g.rodadas||0)>=r)continue;
    let falta=false;
    _jogosDaRodada(g,r).forEach(([a,b],i)=>{
      if(_jaJogado(g,a,b,r))return;
      const q=_diaElim(r,i);
      if(!_chegou(q,cic.ano-1)){falta=true;return;}
      const f=jogarSerieSelecoes(a,b,{bo:ELIM_MD,nome:'Eliminatórias da World Cup '+cic.ano,fase:'Grupo '+g.letra+' · rodada '+r,peso:1,
        semana:q[0],dia:q[1],conv:{[a]:cv[a],[b]:cv[b]}});
      f.rodada=r;
      g.jogos.push(f);
    });
    if(falta)completa=false;else g.rodadas=r;
  }
  if(!completa)return;
  cic.noticias=cic.noticias||{};
  if(cic.noticias['elim'+r])return;
  cic.noticias['elim'+r]=true;
  /* a rodada em uma notícia: os placares, sem um texto por série */
  const placar=f=>`${infoSelecao(f.a).sigla} ${f.wa}–${f.wb} ${infoSelecao(f.b).sigla}`;
  const daRodada=cic.grupos.flatMap(g=>g.jogos.filter(f=>f.rodada===r));
  noticia(`⚔️ Eliminatórias da World Cup, rodada ${r}: ${daRodada.map(placar).join(' · ')}.`,
    {c:'competicoes',imp:_impSelecao(daRodada.flatMap(f=>[f.a,f.b]))});
}

/* ---------- a tabela do grupo ----------
   Desempate: vitórias, saldo de mapas, saldo de rounds, confronto direto e
   o ranking do dia do sorteio. */
function tabelaGrupo(g,pontos){
  const L={};
  for(const p of g.paises)L[p]={pais:p,j:0,v:0,d:0,mp:0,mc:0,rp:0,rc:0};
  for(const f of g.jogos){
    const A=L[f.a],B=L[f.b];if(!A||!B)continue;
    A.j++;B.j++;
    if(f.v===f.a){A.v++;B.d++;}else{B.v++;A.d++;}
    A.mp+=f.wa;A.mc+=f.wb;B.mp+=f.wb;B.mc+=f.wa;
    for(const m of (f.det&&f.det.mp)||[]){A.rp+=m.a;A.rc+=m.b;B.rp+=m.b;B.rc+=m.a;}
  }
  const direto=(x,y)=>{const f=g.jogos.find(k=>(k.a===x&&k.b===y)||(k.a===y&&k.b===x));return f?(f.v===x?-1:1):0;};
  const rk=pontos||garantirCopa().ranking;
  return Object.values(L).sort((x,y)=>y.v-x.v||(y.mp-y.mc)-(x.mp-x.mc)||(y.rp-y.rc)-(x.rp-x.rc)
    ||direto(x.pais,y.pais)||(rk[y.pais]||0)-(rk[x.pais]||0)||x.pais.localeCompare(y.pais));
}

/* ---------- domingo da 46: os 32 ---------- */
function fecharEliminatorias(cic){
  if(cic.grupos.some(g=>(g.rodadas||0)<2)){jogarRodadaEliminatorias(cic,1);jogarRodadaEliminatorias(cic,2);}
  const vindos=[];
  for(const g of cic.grupos){
    const t=tabelaGrupo(g,cic.pontosNoSorteio);
    g.classificados=t.slice(0,ELIM_AVANCAM).map(x=>x.pais);
    vindos.push(...g.classificados);
  }
  cic.classificados=cic.convidadas.concat(vindos);
  cic.dasEliminatorias=vindos;
  const fora=cic.grupos.flatMap(g=>g.paises.filter(p=>!g.classificados.includes(p)));
  momentoCopa('classificados',{ano:cic.ano});
  noticia(`🏁 Os 32 da World Cup ${cic.ano} estão definidos. Das eliminatórias: ${vindos.map(_nomeSel).join(', ')}. Ficaram fora: ${fora.map(_nomeSel).join(', ')}.`,
    {c:'competicoes',imp:Math.max(_impSelecao(vindos),_impSelecao(fora),2)});
  return cic.classificados;
}

/* ---------- consultas para a tela ---------- */
function situacaoNoCiclo(cic,pais){
  if(!cic)return null;
  if(cic.classificados)return cic.classificados.includes(pais)?(cic.convidadas.includes(pais)?'convidada':'classificada'):'fora';
  if(cic.convidadas)return cic.convidadas.includes(pais)?'convidada':'eliminatorias';
  return null;
}
