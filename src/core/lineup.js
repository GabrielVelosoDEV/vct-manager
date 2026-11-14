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
    const opcoes=funcoesNaEscalacao(p);
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

/* O que um jogador pode fazer na escalação: a função dele, a secundária e
   toda função em que ele DOMINA um boneco — o duelista main de Chamber cobre a
   vaga de Sentinela, pagando a diferença de over que a conta já cobra. */
function funcoesNaEscalacao(p){
  if(p.role==='Flex')return FUNCOES_BASE;
  const out=[p.role];
  if(p.role2&&!out.includes(p.role2))out.push(p.role2);
  if(typeof funcoesPorDominio==='function')
    for(const f of funcoesPorDominio(p))if(!out.includes(f))out.push(f);
  return out;
}
/* Nota de um conjunto de cinco. É esta função que decide tudo: mexer no peso
   da cobertura aqui muda o comportamento de todos os 80 clubes de uma vez. */
/* `aj` (opcional) soma pontos por jogador: é por onde o técnico do clube do
   modo jogador pesa forma, cansaço e confiança (core/relacoes.js). Sem ele a
   conta é a de sempre. */
function notaEscalacao(ids,aj){
  const rs=ids.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length<5)return -Infinity;
  let n=distribuirFuncoes(rs).nota;
  if(aj)for(const p of rs)n+=aj(p)||0;
  return n;
}

/* Quanto um jogador em recuperação rende. Não é zero: no cenário real quem
   está com a mão ruim entra e joga pior, e é isso que a escalação de emergência
   tem de custar. */
const PENA_LESAO=0.72;
function autoEscalar(t,aj){
  const esc=melhorEscalacao(t,aj);
  if(!esc){t.titulares=[];t.igl=null;return;}
  aplicarEscalacao(t,esc);
}
/* o melhor cinco pela nota, sem mexer em nada (null se não há ninguém) */
function melhorEscalacao(t,aj){
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
  if(!el.length)return null;

  /* Ponto de partida: os cinco de maior over. Começar pelo time mais forte e
     corrigir a cobertura depois dá resultado melhor do que o contrário —
     cobertura custa 4 pontos, over costuma custar mais. */
  let esc=el.slice().sort((a,b)=>over(b)-over(a)+(aj?(aj(b)||0)-(aj(a)||0):0)).slice(0,5).map(p=>p.id);
  let nota=notaEscalacao(esc,aj);

  /* Trocas de melhoria até estabilizar. Com no máximo 9 no elenco isso é um
     punhado de combinações; o laço externo existe porque uma troca boa às
     vezes abre espaço para outra. */
  for(let volta=0;volta<6;volta++){
    let mudou=false;
    const fora=el.filter(p=>!esc.includes(p.id));
    for(const cand of fora){
      for(let i=0;i<esc.length;i++){
        const tentativa=esc.slice();tentativa[i]=cand.id;
        const n=notaEscalacao(tentativa,aj);
        if(n>nota+0.001){esc=tentativa;nota=n;mudou=true;break;}
      }
      if(mudou)break;
    }
    if(!mudou)break;
  }

  /* modo jogador: quem chegou prometido como titular joga a primeira
     temporada no cinco (core/jogador.js; a titularidade de verdade é J4) */
  const fixo=t.titularFixo;
  if(fixo&&fixo.ano===G.ano&&el.some(p=>p.id===fixo.id)&&!esc.includes(fixo.id)){
    let melhor=null;
    for(let i=0;i<esc.length;i++){const tt=esc.slice();tt[i]=fixo.id;const n=notaEscalacao(tt,aj);if(!melhor||n>melhor.n)melhor={tt,n};}
    if(melhor)esc=melhor.tt;
  }
  return esc;
}
function aplicarEscalacao(t,esc){
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
  /* o entrosamento do time é o dos cinco que jogam: mudou o cinco, muda ele */
  if(typeof atualizarSinergia==='function'&&t.duplas)atualizarSinergia(t);
}

/* Troca manual: `sai` vai para o banco e `entra` assume o lugar dele (ou, se
   os dois forem titulares, só trocam de posição na fila). As funções dos
   cinco são redistribuídas, o IGL segue em quadra e o entrosamento é
   recalculado (ou, sem duplas, cai 5 como nas trocas pelos botões). */
function trocarTitular(t,sai,entra){
  if(!t||sai===entra)return{ok:false};
  const tit=t.titulares.slice();
  const iS=tit.indexOf(sai),iE=tit.indexOf(entra);
  if(iS<0&&iE<0)return{ok:false,erro:'Nenhum dos dois está entre os titulares.'};
  if(iS>=0&&iE>=0){tit[iS]=entra;tit[iE]=sai;t.titulares=tit;return{ok:true,so:'ordem'};}
  const fora=iS>=0?entra:sai, dentro=iS>=0?sai:entra;
  if(!t.elenco.includes(fora))return{ok:false,erro:'Jogador fora do elenco.'};
  tit[tit.indexOf(dentro)]=fora;
  t.titulares=tit;
  const rs=tit.map(i=>G.jogadores[i]).filter(Boolean);
  if(rs.length===5){const d=distribuirFuncoes(rs);rs.forEach((p,i)=>{p.roleAtual=d.atrib[i];});}
  const pd=G.jogadores[dentro];if(pd)pd.roleAtual=pd.role;
  if(!tit.includes(t.igl))t.igl=tit[0];
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(p)p.igl=(id===t.igl);});
  if(typeof atualizarSinergia==='function'&&t.duplas)atualizarSinergia(t);
  else t.sinergia=clamp(t.sinergia-5,0,100);
  const pf=G.jogadores[fora];
  return{ok:true,entrou:pf,saiu:pd,lesionado:!!(pf&&pf.lesao)};
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
