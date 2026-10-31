/* ============================================================
   ECONOMIA: PATROCÍNIO, TORCIDA E PREMIAÇÃO
   ------------------------------------------------------------
   Antes a receita era uma linha só: prestígio × constante. O
   efeito era a espiral que aparecia da sexta temporada em diante
   — o clube do fundo tinha receita fixa, folha crescendo com a
   evolução dos jogadores, e nenhuma forma de reagir. Prêmio não
   resolvia porque prêmio ia para quem ganha, e quem ganha não é
   quem estava quebrando.

   Agora a receita tem três fontes com comportamentos diferentes:

     · PATROCÍNIO  varia com o clube. Marca boa vai para clube
                   atraente, e vai embora quando ele cai. É a
                   parte que premia jogar bem.
     · APORTE DA LIGA  é o piso. Time de Tier 1 é franquiado e
                   recebe da Riot mesmo perdendo tudo, com uma
                   parcela por torcida. É o que impede a espiral.
     · PREMIAÇÃO   agora chega ao último colocado. Pouco, mas
                   chega — participar de Champions passou a valer
                   dinheiro, não só prestígio.

   TORCIDA é o que liga as três: cresce com vitória e título, cai
   devagar sozinha, e entra no aporte e no valor do patrocínio.
   ============================================================ */

/* ---------- torcida ---------- */
/* Escala 0–100. Não é número de pessoas: é o quanto o clube pesa
   no mercado, que é o que a economia precisa saber. */
/* Piso por divisão, não um piso único. Estar numa liga reconhecida já vale
   público: um clube de Tier 1 que perde tudo continua sendo um clube de Tier 1.

   Com um piso único de 5, um clube de Challengers que passasse anos perdendo
   afundava a torcida até o mínimo e travava a receita lá — mas a folha não
   travava junto, porque a régua de over obriga o elenco a custar dinheiro. Era
   o que produzia clubes com razão folha/receita acima de 1.0 na décima quinta
   temporada, e nenhuma saída possível. */
const TORCIDA_PISO={1:26, 2:11};
/* Todo clube de Tier 2 começa com o mesmo prestígio: no Challengers, título de
   campeonato menor não hierarquiza ninguém. O que diferencia um do outro é a
   torcida, e é ela que decide patrocínio e aporte. */
const PRESTIGIO_T2=48;
const TORCIDA_MAX=100;
/* Quanto some por temporada se nada acontecer. Sem isso, campeão
   de 2027 continua enchendo estádio em 2040. */
const TORCIDA_DECAIMENTO=0.06;

function pisoTorcida(t){return TORCIDA_PISO[t.tier]||TORCIDA_PISO[2];}

/* ---------- popularidade por país ----------
   No Tier 2 todo clube tem o mesmo prestígio, então o que separa um do outro é
   público — e público depende de onde o clube joga. Um clube brasileiro nasce
   com mais torcida que um clube de um país de cena pequena, mesmo empatados em
   tudo o mais.

   POP_PAIS é PARÂMETRO DE JOGO, não medição: 1.0 é a média. Está aqui em cima e
   é editável de propósito, porque é a espécie de número que só quem acompanha a
   cena sabe ajustar. Os países ausentes valem 1.0. */
/* Os nove que o Gabriel apontou como principais do jogo. O resto fica em 1.0
   de propósito, e não abaixo: Valorant é popular no mundo todo, então país fora
   da lista é a média, não um lugar sem cena. Mexer aqui muda a torcida de base
   de todo clube sediado naquele país. */
const POP_PAIS={
  BR:1.35, US:1.30, KR:1.28, CN:1.26, TR:1.22,
  FR:1.18, GB:1.15, DE:1.14, CL:1.12
};
/* País do clube. Sai do elenco — a nacionalidade mais comum entre os jogadores
   de nome real — e pode ser fixada à mão no Editor. Derivar do elenco é o que
   permite o sistema funcionar sem uma tabela escrita à mão para 80 clubes. */
function paisDoClube(t){
  if(t.pais)return t.pais;
  const conta={};
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    /* só país que veio do arquivo conta: país sorteado para um nick sem dado
       não diz nada sobre onde o clube fica */
    if(!p||!p.paisReal||!p.pais)continue;
    conta[p.pais]=(conta[p.pais]||0)+1;
  }
  const ord=Object.keys(conta).sort((a,b)=>conta[b]-conta[a]);
  return ord[0]||null;
}
function popularidadeDoClube(t){
  const pais=paisDoClube(t);
  return pais&&POP_PAIS[pais]!=null?POP_PAIS[pais]:1;
}
function torcidaInicial(t){
  /* No Tier 1 o prestígio já carrega a história do clube e domina. No Tier 2 o
     prestígio é igual para todos, então a popularidade do país é o que
     diferencia — é o pedido, e é onde ela pesa mais. */
  const base=t.tier===1?t.prestigio*0.82:t.prestigio*0.45;
  const pop=popularidadeDoClube(t);
  const peso=t.tier===1?1+(pop-1)*0.35:pop;
  return clamp(Math.round(base*peso+gauss(0,4)),pisoTorcida(t),TORCIDA_MAX);
}
/* Chamado na virada de temporada, depois de contabilizada a campanha. */
function atualizarTorcida(t){
  /* Save antigo chega sem o campo, e a linha do decaimento abaixo lê t.torcida
     ANTES de qualquer fallback: undefined ali vira NaN, o NaN vaza para
     aporteLiga e daí para o caixa do clube. Normalizar aqui, antes da conta, é
     o que impede isso. */
  if(typeof t.torcida!=='number'||!isFinite(t.torcida))t.torcida=torcidaInicial(t);
  const c=t.temporada||{v:0,d:0};
  const jogos=c.v+c.d;
  /* aproveitamento acima de 50% engorda, abaixo encolhe */
  const desempenho=jogos?((c.v/jogos)-0.5)*2:0;
  const titulosAno=(t.titulos||[]).filter(x=>String(x).startsWith(String(G.ano))).length;
  const alvoTier=t.tier===1?55:22;   /* para onde a torcida tende sem resultado */
  let d=desempenho*7+titulosAno*9;
  d+=(alvoTier-t.torcida)*TORCIDA_DECAIMENTO;
  t.torcida=clamp(Math.round(t.torcida+d),pisoTorcida(t),TORCIDA_MAX);
  return t.torcida;
}
/* O quanto o clube interessa a um patrocinador. Prestígio é reputação
   histórica, torcida é audiência agora — as duas contam, e nenhuma
   sozinha decide. */
function atratividade(t){
  return 0.55+0.25*(t.prestigio/99)+0.45*((t.torcida||0)/100);
}

/* ---------- catálogo de marcas ---------- */
/* Marcas fictícias, geradas por combinação. São editáveis no Banco de
   dados (aba Patrocinadores), inclusive nome, setor, nível e logo — a
   ideia é você trocar por marcas que façam sentido para você. */
const MARCA_A=['Nova','Vertex','Hyper','Aurora','Titan','Orbit','Zenit','Kraken','Lumen','Pulsar',
               'Ember','Quantum','Rift','Solaris','Vanta','Nimbus','Cobalt','Helix','Volt','Arcadia',
               'Meridian','Onyx','Prisma','Stellar'];
/* O sufixo decide o setor. Sorteá-los em separado produzia "Arcadia Beverage,
   setor Automotivo", que denuncia o gerador na primeira olhada. */
const RAMOS=[['Energy','Energético'],['Bank','Banco'],['Mobile','Telecom'],['Tech','Hardware'],
             ['Motors','Automotivo'],['Gear','Periféricos'],['Labs','Tecnologia'],
             ['Foods','Alimentos'],['Wear','Vestuário'],['Chips','Snacks'],
             ['Telecom','Telecom'],['Seguros','Seguros'],['Beverage','Bebida'],
             ['Systems','Software'],['Audio','Áudio'],['Cloud','Nuvem']];
const SETORES=RAMOS.map(r=>r[1]);
/* Pirâmide: poucas marcas globais, muitas locais. É o que faz a vaga de
   máster valer alguma coisa. */
const PIRAMIDE_NIVEL=[5,5,5,5, 4,4,4,4,4,4,4,4, 3,3,3,3,3,3,3,3,3,3,3,3,
                      2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2, 1,1,1,1,1,1,1,1];
const MARCAS_POR_MUNDO=96;

function montarMarcas(){
  G.marcas={};
  const usados=new Set();
  for(let i=0;i<MARCAS_POR_MUNDO;i++){
    let nome,ramo;
    for(let tent=0;tent<60;tent++){
      ramo=pick(RAMOS);
      nome=pick(MARCA_A)+' '+ramo[0];
      if(!usados.has(nome))break;
    }
    if(usados.has(nome))nome=nome+' '+(i+1);
    usados.add(nome);
    const id='m'+(i+1);
    G.marcas[id]={id,nome,setor:ramo[1],nivel:PIRAMIDE_NIVEL[i%PIRAMIDE_NIVEL.length]};
  }
  return G.marcas;
}
function marca(id){return (G&&G.marcas&&G.marcas[id])||null;}
function listaMarcas(){
  return Object.values(G.marcas||{}).sort((a,b)=>b.nivel-a.nivel||a.nome.localeCompare(b.nome,'pt-BR'));
}

/* ---------- as três vagas ---------- */
const VAGAS=[
  {id:'master',     nome:'Máster',      peso:1.00, exclusiva:true,  desc:'Nome no peito. Uma marca por clube, sem repetir no mundo.'},
  {id:'secundario', nome:'Secundário',  peso:0.42, exclusiva:false, desc:'Manga e verso. A mesma marca pode atender alguns clubes.'},
  {id:'fornecedor', nome:'Fornecedor',  peso:0.26, exclusiva:false, desc:'Uniforme e periférico. É a vaga mais fácil de preencher.'}
];
/* Quantos clubes uma marca não exclusiva aceita ao mesmo tempo. */
const MAX_CLUBES_POR_MARCA=4;

/* Valor anual de um contrato. Nível da marca e peso da vaga dizem o
   tamanho; a atratividade do clube diz se ele consegue esse contrato e
   por quanto. */
/* Quanto vale um ponto de nível de marca numa vaga, por divisão. Os dois
   números são próximos e isso não é engano: a diferença entre as divisões já
   está contada duas vezes antes daqui — o clube de Challengers só alcança
   marca de nível 1 ou 2 (ver tetoNivel) e tem atratividade menor. Se a base
   também fosse muito menor, os três efeitos se multiplicariam e o patrocínio
   de Tier 2 viraria troco. Os valores saem da calibragem contra a folha que
   cada divisão carrega — tools/fin.mjs é quem confere. */
const BASE_VAGA={1:178000, 2:117000};
function valorContrato(mk,t,vagaId){
  if(!mk)return 0;
  const vaga=VAGAS.find(v=>v.id===vagaId)||VAGAS[0];
  return Math.round(BASE_VAGA[t.tier]*mk.nivel*vaga.peso*atratividade(t)/1000)*1000;
}
function patrociniosDe(t){
  return VAGAS.map(v=>({vaga:v,mk:marca(t.patrocinios&&t.patrocinios[v.id])}));
}
function receitaPatrocinio(t){
  if(!t.patrocinios)return 0;
  return VAGAS.reduce((s,v)=>s+valorContrato(marca(t.patrocinios[v.id]),t,v.id),0);
}

/* Redistribui as marcas entre todos os clubes. Roda na criação do mundo e
   em toda virada de temporada: é isso que faz o patrocinador ir embora
   quando o clube cai, e chegar quando ele sobe.

   Clube mais atraente escolhe primeiro. Não é leilão porque leilão daria
   o mesmo resultado com dez vezes mais código. */
function atribuirPatrocinios(){
  const clubes=Object.values(G.times).sort((a,b)=>atratividade(b)-atratividade(a));
  const usoExclusivo=new Set();
  const uso={};
  const todas=listaMarcas();
  /* Clube por clube, e dentro do clube na ordem das vagas. Antes o laço era
     vaga por vaga: quando chegava no secundário havia marca grande sobrando e
     o clube acabava com um secundário nível 4 ao lado de um máster nível 3,
     que não faz sentido nenhum. Fechando o pacote de uma vez, o máster é
     sempre a maior marca que o clube alcança. */
  for(const t of clubes){
    t.patrocinios={master:null,secundario:null,fornecedor:null};
    /* O clube alcança o nível de marca que a atratividade dele permite. Sem
       esse teto, o lanterna do Tier 2 ficaria com a sobra do topo e a vaga de
       máster não significaria nada. */
    let teto=Math.max(1,Math.round(atratividade(t)*(t.tier===1?4.2:2.8)));
    for(const v of VAGAS){
      const cand=todas.filter(mk=>{
        if(mk.nivel>teto)return false;
        if(v.exclusiva)return !usoExclusivo.has(mk.id);
        return (uso[mk.id]||0)<MAX_CLUBES_POR_MARCA&&t.patrocinios.master!==mk.id
               &&t.patrocinios.secundario!==mk.id;
      });
      if(!cand.length)continue;
      /* entre as elegíveis, a melhor — com um empurrãozinho aleatório para
         que duas temporadas iguais não deem exatamente o mesmo quadro */
      const escolhida=cand.sort((a,b)=>(b.nivel+rnd()*0.9)-(a.nivel+rnd()*0.9))[0];
      t.patrocinios[v.id]=escolhida.id;
      uso[escolhida.id]=(uso[escolhida.id]||0)+1;
      if(v.exclusiva)usoExclusivo.add(escolhida.id);
      teto=escolhida.nivel;   /* a próxima vaga não pode superar esta */
    }
  }
}

/* ---------- estrutura ----------
   A tabela de preço morava em src/ui/views.js, onde só o clube do jogador
   alcançava. Com ela aqui, a IA também constrói — e é isso que dá ao dinheiro
   ganho um destino: sem nada em que gastar, o caixa de todo clube vencedor
   virava poça parada. Construir não é punição, é o prêmio virando estrutura,
   e custa mais para manter depois (ver o custeio em clock.js). */
const CUSTO_UPGRADE=[0,120000,220000,380000,600000];
/* Sobra anual que a obra tem de deixar de pé depois de pronta. */
const MARGEM_OBRA=0.12;
const ESTRUTURA_MAX=5;
function custoUpgrade(nv){return CUSTO_UPGRADE[nv]||0;}
/* Reserva que o clube não encosta: uma temporada inteira de folha. É o que
   garante que investir nunca quebre ninguém — foi o pedido explícito, clube
   falindo não é divertido. */
function reservaMinima(t){
  return (typeof folhaAnual==='function')?folhaAnual(t):receitaAnual(t)*0.6;
}
/* Uma obra por clube por temporada, na área mais atrasada. Uma de cada vez
   para o clube crescer ao longo de anos em vez de nascer pronto.

   Duas travas, e as duas existem pelo mesmo motivo: clube quebrando não é
   divertido. A primeira é a obra caber no caixa deixando a reserva intacta. A
   segunda é a obra caber na OPERAÇÃO depois de pronta — estrutura maior custa
   mais para manter todo ano, e sem esta segunda trava o Challengers construía
   um centro de treino que a receita dele não sustentava e ia para o vermelho
   sem ter feito nada de errado. */
function investirEstrutura(t){
  if(!t||!t.estrutura)return null;
  const areas=Object.keys(t.estrutura).filter(k=>t.estrutura[k]<ESTRUTURA_MAX);
  if(!areas.length)return null;
  areas.sort((a,b)=>t.estrutura[a]-t.estrutura[b]);
  const alvo=areas[0];
  const custo=custoUpgrade(t.estrutura[alvo]);
  if(!custo||t.caixa-custo<reservaMinima(t))return null;
  /* simula a conta anual com a obra de pé */
  const antes=t.estrutura[alvo];
  t.estrutura[alvo]++;
  const folha=(typeof folhaAnual==='function')?folhaAnual(t):0;
  /* Margem, não empate. Construir até a conta fechar no zero funciona no ano
     da obra e quebra no seguinte, porque receita cai: torcida encolhe, o
     patrocinador troca de clube, o time é rebaixado. A estrutura, essa, não
     encolhe junto — ela custa o mesmo para manter. A folga exigida aqui é o
     que impede o clube de construir um centro de treino que ele só consegue
     pagar enquanto está ganhando. */
  const sustenta=receitaAnual(t)-custeioAnual(t)-folha>=receitaAnual(t)*MARGEM_OBRA;
  if(!sustenta){t.estrutura[alvo]=antes;return null;}
  t.caixa-=custo;
  return{area:alvo,nivel:t.estrutura[alvo],custo};
}
function investimentoIA(){
  let obras=0;
  for(const id in G.times){
    if(id===G.meuTime)continue;
    const r=investirEstrutura(G.times[id]);
    if(r)obras++;
  }
  return obras;
}

/* ---------- aporte da liga ---------- */
/* A parcela fixa é o piso da economia: clube franqueado de Tier 1 recebe
   por estar na liga, ganhando ou perdendo. É de propósito que ela não
   dependa de resultado — é ela que impede a espiral do fundo da tabela. */
const APORTE_FIXO={1:380000, 2:130000};
const APORTE_POR_TORCIDA={1:3500, 2:2700};
function aporteLiga(t){
  return Math.round(APORTE_FIXO[t.tier]+APORTE_POR_TORCIDA[t.tier]*(t.torcida||0));
}

/* Receita anual total, que o relógio semanal divide por 44. */
function receitaAnual(t){
  return receitaPatrocinio(t)+aporteLiga(t);
}
/* Custo de manter o clube de pé: estrutura e scrims. Estava escrito dentro do
   relógio semanal, onde ninguém mais enxergava — e por isso o teto de folha
   fingia que a receita inteira estava disponível para salário. Aqui, quem
   decide contratar sabe o que já está comprometido. */
function custeioSemanal(t){
  const e=t.estrutura||{gh:1,treino:1,academia:1};
  const scrim=(t.tatica&&t.tatica.scrim)||3;
  const base=(typeof custoDaBase==='function')?custoDaBase(t):0;
  return ((e.gh+e.treino+e.academia)*400+scrim*600)*(t.tier===1?2:0.6)+base;
}
function custeioAnual(t){return custeioSemanal(t)*SEMANAS_ANO;}
/* O que sobra da receita depois do custeio: é daqui que sai a folha. */
function receitaLivre(t){return Math.max(0,receitaAnual(t)-custeioAnual(t));}

/* ---------- índice salarial do Tier 1 ----------
   Sem isto o dinheiro parava no topo: o salário saía só do over, a estrutura
   chegava ao nível máximo em poucas temporadas e o Tier 1 terminava vinte anos
   com mediana de 5 milhões no caixa e folha em um quarto da receita. Ganhar
   dinheiro deixava de significar alguma coisa.

   Agora o mercado reage à riqueza, como num circuito de verdade: quando os
   clubes de cima guardam mais do que precisam, o salário pedido no Tier 1
   sobe; quando apertam, ele cede. Vale para contrato novo e renovação, então
   o efeito chega aos poucos. O Challengers fica fora: lá a folha já come
   metade da receita. Só aritmética: não sorteia nada. */
const INDICE_SAL_MIN=1, INDICE_SAL_MAX=3;
/* Quantos anos de receita no caixa o mercado considera normal. */
const INDICE_SAL_ALVO=1.5;
const INDICE_SAL_PASSO=0.05, INDICE_SAL_SOBE=0.08, INDICE_SAL_DESCE=0.05;
function indiceSalarial(tier){
  if(tier!==1)return 1;
  return (typeof G!=='undefined'&&G&&G.indiceSalario)||1;
}
/* Clube com dinheiro sobrando paga mais pelo mesmo jogador: o empresário sabe
   quanto tem no banco. O índice acompanha a mediana do Tier 1 e não alcança os
   ricos de verdade (o p90 terminava vinte anos com 17 milhões); isto alcança.
   Até três anos de receita guardados não muda nada. */
const RIQUEZA_ANOS_LIVRES=3, RIQUEZA_POR_ANO=0.10, RIQUEZA_TETO=0.6;
function fatorRiqueza(t){
  if(!t)return 1;
  const rec=receitaAnual(t);
  if(!(rec>0))return 1;
  const anos=(t.caixa||0)/rec;
  return 1+clamp((anos-RIQUEZA_ANOS_LIVRES)*RIQUEZA_POR_ANO,0,RIQUEZA_TETO);
}
function _mediana(xs){
  const v=xs.slice().sort((a,b)=>a-b);
  return v.length?v[Math.floor(v.length/2)]:0;
}
/* Anos de receita que o Tier 1 tem guardados (mediana, sem o seu clube). */
function folegoDoTier1(){
  const ts=Object.values(G.times).filter(t=>t.tier===1&&t.id!==G.meuTime);
  const rec=_mediana(ts.map(receitaAnual));
  return rec>0?_mediana(ts.map(t=>t.caixa||0))/rec:0;
}
function atualizarIndiceSalarial(){
  const antes=G.indiceSalario||1;
  const r=folegoDoTier1();
  const f=clamp(1+(r-INDICE_SAL_ALVO)*INDICE_SAL_PASSO,1-INDICE_SAL_DESCE,1+INDICE_SAL_SOBE);
  const depois=Math.round(clamp(antes*f,INDICE_SAL_MIN,INDICE_SAL_MAX)*1000)/1000;
  G.indiceSalario=depois;
  (G.indiceHist=G.indiceHist||[]).push({ano:G.ano,i:depois});
  if(G.indiceHist.length>40)G.indiceHist.shift();
  const pct=Math.round((depois/antes-1)*100);
  if(Math.abs(pct)>=2&&typeof noticia==='function')
    noticia((pct>0?'📈 Os salários do Tier 1 subiram ':'📉 Os salários do Tier 1 caíram ')+Math.abs(pct)+
      '% na virada: '+(pct>0?'os clubes de cima estão com dinheiro sobrando.':'os clubes de cima apertaram o cinto.'),
      {c:'mercado',imp:1});
  return depois;
}

/* ---------- edição no Banco de dados ----------
   Como no resto do Editor, estas funções não conhecem DOM: recebem valores,
   devolvem {ok, msg|erro}. É o que permite testá-las sem navegador. */
function edMarcaAplicar(id,campos){
  const mk=marca(id);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  if(campos.nome!=null){
    const nome=String(campos.nome).trim();
    if(!nome)return{ok:false,erro:'A marca precisa de um nome.'};
    if(Object.values(G.marcas).some(x=>x.id!==id&&x.nome.toLowerCase()===nome.toLowerCase()))
      return{ok:false,erro:nome+' já existe no catálogo.'};
    mk.nome=nome;
  }
  if(campos.setor!=null)mk.setor=String(campos.setor).trim()||mk.setor;
  if(campos.nivel!=null){
    const n=Math.round(parseFloat(campos.nivel));
    if(!(n>=1&&n<=5))return{ok:false,erro:'Nível vai de 1 a 5.'};
    mk.nivel=n;
  }
  return{ok:true,msg:mk.nome+' atualizada.'};
}
function edMarcaCriar(nome,nivel,setor){
  if(!G.marcas)montarMarcas();
  nome=String(nome||'').trim();
  if(!nome)return{ok:false,erro:'Dê um nome à marca.'};
  if(Object.values(G.marcas).some(x=>x.nome.toLowerCase()===nome.toLowerCase()))
    return{ok:false,erro:nome+' já existe no catálogo.'};
  const n=Math.round(parseFloat(nivel)||3);
  if(!(n>=1&&n<=5))return{ok:false,erro:'Nível vai de 1 a 5.'};
  let i=1;while(G.marcas['m'+i])i++;
  const id='m'+i;
  G.marcas[id]={id,nome,setor:String(setor||'').trim()||pick(SETORES),nivel:n};
  return{ok:true,msg:nome+' entrou no catálogo.',id};
}
function edMarcaRemover(id){
  const mk=marca(id);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  if(Object.keys(G.marcas).length<=VAGAS.length)
    return{ok:false,erro:'O catálogo ficaria pequeno demais para preencher as vagas.'};
  /* solta as vagas que ela ocupava, senão o clube fica apontando para nada */
  let soltas=0;
  for(const tid in G.times){
    const t=G.times[tid];if(!t.patrocinios)continue;
    for(const v of VAGAS)if(t.patrocinios[v.id]===id){t.patrocinios[v.id]=null;soltas++;}
    t.patroc=receitaAnual(t);
  }
  delete G.marcas[id];
  return{ok:true,msg:mk.nome+' removida'+(soltas?' — '+soltas+' vaga(s) ficaram abertas.':'.')};
}
/* Troca manual de uma vaga. Respeita a exclusividade do máster: sem isso o
   Editor conseguiria criar um estado que a redistribuição nunca produziria. */
function edPatrocinioTrocar(timeId,vagaId,marcaId){
  const t=G.times[timeId];
  if(!t)return{ok:false,erro:'Time não encontrado.'};
  const vaga=VAGAS.find(v=>v.id===vagaId);
  if(!vaga)return{ok:false,erro:'Vaga inválida.'};
  if(!t.patrocinios)t.patrocinios={master:null,secundario:null,fornecedor:null};
  if(!marcaId){t.patrocinios[vagaId]=null;t.patroc=receitaAnual(t);return{ok:true,msg:'Vaga aberta.'};}
  const mk=marca(marcaId);
  if(!mk)return{ok:false,erro:'Marca não encontrada.'};
  const outros=Object.values(G.times).filter(x=>x.id!==timeId&&x.patrocinios);
  if(vaga.exclusiva){
    const dono=outros.find(x=>x.patrocinios[vagaId]===marcaId);
    if(dono)return{ok:false,erro:mk.nome+' já é máster do '+dono.tag+'. A vaga é exclusiva.'};
  }else{
    const n=outros.filter(x=>x.patrocinios[vagaId]===marcaId).length;
    if(n>=MAX_CLUBES_POR_MARCA)
      return{ok:false,erro:mk.nome+' já atende '+n+' clubes nessa vaga (máximo '+MAX_CLUBES_POR_MARCA+').'};
  }
  t.patrocinios[vagaId]=marcaId;
  t.patroc=receitaAnual(t);
  return{ok:true,msg:mk.nome+' agora é '+vaga.nome.toLowerCase()+' do '+t.tag+'.'};
}
