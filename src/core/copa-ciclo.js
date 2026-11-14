/* ============================================================
   VALORANT WORLD CUP — O CICLO E AS ELIMINATÓRIAS (C2)
   ------------------------------------------------------------
   Cada Copa tem um ciclo de dois anos, guardado em
   G.copa.ciclos[anoDaCopa]. No ano ímpar, antes dela:

     semana 1   anúncio da sede e da edição; a comissão das 40
                seleções é escolhida de novo
     semana 48  convites (a sede + as 15 melhores do ranking) e o
                sorteio dos 8 grupos de 3 das eliminatórias
     semana 49  rodada 1: 1º × 3º e 2º × 3º de cada grupo
     semana 50  rodada 2: 1º × 2º, o jogo que costuma decidir o grupo
     semana 51  anúncio dos 32 classificados

   Tudo no fim da temporada, com o calendário dos clubes encerrado:
   a convocação não toca no mercado e a janela segue como estava.

   copaSemana() roda no fechamento de cada semana (clock.js) e faz
   tudo o que está atrasado — um save que pula semanas, ou que chega
   à Copa já no meio do ano, recupera as etapas na ordem.

   Toda virada de ano, os pontos do ranking andam um pouco em direção
   à força atual de cada país: geração boa sobe sem jogar, e quem
   envelhece cai.
   ============================================================ */
const COPA_SEM_SEDE=1, ELIM_SEM_SORTEIO=48, ELIM_SEM_RODADA1=49, ELIM_SEM_RODADA2=50, ELIM_SEM_CLASSIFICADOS=51;
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
    const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(cic.sede):null;
    momentoCopa('sede',{ano:cic.ano});
    noticia(`🌍 ${cic.nomeSede} recebe a ${cic.edicao}ª Valorant World Cup, no fim de ${cic.ano}${cid?', com a final em '+cid.nome:''}. As eliminatórias são no fim desta temporada.`,
      {c:'competicoes',imp:2});
  }
  if(!cic.convidadas&&sem>=ELIM_SEM_SORTEIO)sortearEliminatorias(cic);
  if(cic.grupos&&sem>=ELIM_SEM_RODADA1)jogarRodadaEliminatorias(cic,1);
  if(cic.grupos&&sem>=ELIM_SEM_RODADA2)jogarRodadaEliminatorias(cic,2);
  if(cic.grupos&&!cic.classificados&&sem>=ELIM_SEM_CLASSIFICADOS)fecharEliminatorias(cic);
}

/* ---------- semana 48: convites e sorteio ---------- */
function sortearEliminatorias(cic){
  cic.convidadas=convidadasDaCopa(cic.ano);
  cic.pontosNoSorteio=Object.assign({},garantirCopa().ranking);
  cic.grupos=gruposEliminatorias(cic.ano,cic.convidadas)
    .map(g=>({letra:g.letra,cont:g.cont,paises:g.paises.slice(),jogos:[],rodadas:0}));
  momentoCopa('convidadas',{ano:cic.ano});
  noticia(`✉️ World Cup ${cic.ano}: ${cic.convidadas.length} seleções convidadas — ${cic.convidadas.map(_nomeSel).join(', ')}. As outras ${cic.grupos.reduce((s,g)=>s+g.paises.length,0)} disputam 16 vagas nas eliminatórias.`,
    {c:'competicoes',imp:_impSelecao(cic.convidadas)});
  noticia(`🎲 Sorteio das eliminatórias: ${cic.grupos.map(g=>g.letra+' ('+g.paises.map(p=>infoSelecao(p).sigla).join(', ')+')').join(' · ')}.`,
    {c:'competicoes',imp:1});
}

/* ---------- semanas 49 e 50: os jogos ----------
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
function jogarRodadaEliminatorias(cic,r){
  for(const g of cic.grupos){
    if((g.rodadas||0)>=r)continue;
    for(const [a,b] of _jogosDaRodada(g,r)){
      const f=jogarSerieSelecoes(a,b,{bo:ELIM_MD,nome:'Eliminatórias da World Cup '+cic.ano,fase:'Grupo '+g.letra+' · rodada '+r,peso:1,
        semana:r===1?ELIM_SEM_RODADA1:ELIM_SEM_RODADA2});
      f.rodada=r;
      g.jogos.push(f);
    }
    g.rodadas=r;
  }
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

/* ---------- semana 51: os 32 ---------- */
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
