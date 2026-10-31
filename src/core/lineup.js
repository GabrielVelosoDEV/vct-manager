/* ============================================================
   ESCALAÇÃO
   ------------------------------------------------------------
   A versão antiga preenchia as quatro funções primeiro e só
   depois olhava over. Com roster real isso ficava visível: a
   Paper Rex escalava um Controlador de 65 no lugar de um
   Duelista de 88, porque cobertura vinha antes de força.

   Agora existe uma nota para a escalação inteira — soma dos
   overs efetivos mais a penalidade de cobertura — e o algoritmo
   procura o melhor conjunto de cinco por essa nota. Cobertura
   continua valendo, mas passou a ter PREÇO: quatro pontos de
   over por função descoberta. Vinte e três pontos de over ganham
   dessa conta; três pontos não ganham.

   A função secundária entra aqui: um jogador pode cobrir a vaga
   de outra função pagando só a diferença de over entre as duas,
   em vez de deixar o buraco aberto ou escalar um titular pior.
   ============================================================ */

/* Quanto vale, em pontos de over, cada função que fica descoberta. */
const PESO_COBERTURA=4;
/* Punição por empilhar gente demais na mesma função. */
const PESO_DUPLICIDADE=2;
const FUNCOES_BASE=['Duelista','Iniciador','Controlador','Sentinela'];

/* Distribui os cinco titulares entre as funções, maximizando o over efetivo.
   Cinco jogadores e quatro funções é pequeno o bastante para resolver por
   força bruta honesta: testa toda atribuição e fica com a melhor. */
function distribuirFuncoes(rs){
  const atrib=rs.map(p=>p.role);
  let melhor=null;
  const buscar=(i,usadas,acc)=>{
    if(i===rs.length){
      const desc=FUNCOES_BASE.filter(r=>!usadas.has(r)).length;
      const nota=acc-desc*PESO_COBERTURA;
      if(!melhor||nota>melhor.nota)melhor={nota,atrib:atrib.slice()};
      return;
    }
    const p=rs[i];
    const opcoes=p.role==='Flex'?FUNCOES_BASE:[p.role,...(p.role2&&p.role2!==p.role?[p.role2]:[])];
    for(const r of opcoes){
      atrib[i]=r;
      const nova=usadas.has(r);
      usadas.add(r);
      buscar(i+1,usadas,acc+overComo(p,r)-(nova?PESO_DUPLICIDADE:0));
      if(!nova)usadas.delete(r);
    }
  };
  buscar(0,new Set(),0);
  return melhor||{nota:rs.reduce((s,p)=>s+over(p),0),atrib:rs.map(p=>p.role)};
}

/* Nota de um conjunto de cinco. É esta função que decide tudo: mexer no peso
   da cobertura aqui muda o comportamento de todos os 80 clubes de uma vez. */
function notaEscalacao(ids){
  const rs=ids.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length<5)return -Infinity;
  return distribuirFuncoes(rs).nota;
}

/* Quanto um jogador em recuperação rende. Não é zero: no cenário real quem
   está com a mão ruim entra e joga pior, e é isso que a escalação de emergência
   tem de custar. */
const PENA_LESAO=0.72;
function autoEscalar(t){
  const sadios=t.elenco.map(id=>G.jogadores[id]).filter(p=>p&&!p.lesao);
  /* Cinco em quadra SEMPRE, mesmo que doa.

     Antes o elenco disponível era só quem estava inteiro. Com sete jogadores e
     uma sequência ruim de lesões — e ela acontece, entre a lesão de partida e
     o desgaste — sobrava menos de cinco, a escalação saía vazia e a partida
     estourava no meio da temporada, sem save nem recuperação. Agora quem está
     em recuperação entra, do menos machucado para o mais, e paga o preço de
     entrar assim. */
  let el=sadios;
  if(sadios.length<5){
    const machucados=t.elenco.map(id=>G.jogadores[id]).filter(p=>p&&p.lesao)
      .sort((a,b)=>a.lesao-b.lesao||over(b)-over(a));
    el=sadios.concat(machucados.slice(0,5-sadios.length));
    if(t.id===G.meuTime&&machucados.length&&typeof noticia==='function')
      noticia('🩹 Sem gente inteira: '+Math.min(machucados.length,5-sadios.length)+
              ' jogador(es) entram em recuperação e rendem menos.',{c:'clube',t:[t.id]});
  }
  if(!el.length){t.titulares=[];t.igl=null;return;}

  /* Ponto de partida: os cinco de maior over. Começar pelo time mais forte e
     corrigir a cobertura depois dá resultado melhor do que o contrário —
     cobertura custa 4 pontos, over costuma custar mais. */
  let esc=el.slice().sort((a,b)=>over(b)-over(a)).slice(0,5).map(p=>p.id);
  let nota=notaEscalacao(esc);

  /* Trocas de melhoria até estabilizar. Com no máximo 9 no elenco isso é um
     punhado de combinações; o laço externo existe porque uma troca boa às
     vezes abre espaço para outra. */
  for(let volta=0;volta<6;volta++){
    let mudou=false;
    const fora=el.filter(p=>!esc.includes(p.id));
    for(const cand of fora){
      for(let i=0;i<esc.length;i++){
        const tentativa=esc.slice();tentativa[i]=cand.id;
        const n=notaEscalacao(tentativa);
        if(n>nota+0.001){esc=tentativa;nota=n;mudou=true;break;}
      }
      if(mudou)break;
    }
    if(!mudou)break;
  }

  t.titulares=esc;
  /* registra em que função cada um vai jogar: é o que o motor de partida lê
     para cobrar o preço de atuar fora de posição */
  const rs=esc.map(i=>G.jogadores[i]);
  const dist=distribuirFuncoes(rs);
  rs.forEach((p,i)=>{p.roleAtual=dist.atrib[i];});
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(!esc.includes(id))p.roleAtual=p.role;});

  const cand=rs.slice().sort((a,b)=>b.at.lider-a.at.lider)[0];
  t.igl=cand?cand.id:null;
  t.elenco.forEach(id=>G.jogadores[id].igl=(id===t.igl));
}

/* Diagnóstico para a interface e para os testes: o que a escalação atual
   cobre e o que deixou de fora. */
function coberturaFuncoes(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  let pen=0;
  const cobertas=new Set(rs.map(p=>p.roleAtual||p.role));
  for(const r of FUNCOES_BASE)if(!cobertas.has(r))pen-=PESO_COBERTURA;
  const dup={};rs.forEach(p=>{const r=p.roleAtual||p.role;dup[r]=(dup[r]||0)+1;});
  for(const r in dup)if(dup[r]>1)pen-=PESO_DUPLICIDADE*(dup[r]-1);
  return pen;
}
function funcoesDescobertas(t){
  const rs=(t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean);
  const cobertas=new Set(rs.map(p=>p.roleAtual||p.role));
  return FUNCOES_BASE.filter(r=>!cobertas.has(r));
}
/* Quem está atuando fora da função principal, e quanto isso custa. */
function foraDePosicao(t){
  return (t.titulares||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .filter(p=>p.roleAtual&&p.roleAtual!==p.role)
    .map(p=>({p,role:p.roleAtual,custo:custoDeFuncao(p,p.roleAtual)}));
}
