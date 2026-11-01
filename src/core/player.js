/* ---------- Cálculos de jogador ---------- */
function over(p){
  const w=ROLE_W[p.role];let t=0;
  for(const k in w)t+=p.at[k]*w[k];
  return Math.round(t);
}
function ovClass(o){return o>=85?'a':o>=78?'b':o>=70?'c':o>=62?'d':'e';}
function valor(p){
  const o=over(p),a=p.idade;
  let v=Math.pow(Math.max(PISO_SALARIO_JOGADOR+4,o)-PISO_SALARIO_JOGADOR,2.6)*38;
  /* O valor de mercado precisava de degraus acima dos 30, senão um jogador de
     31 e um de 40 valiam o mesmo e a IA comprava veterano como se fosse aposta
     de futuro. */
  v*= a<=20?1.45:a<=22?1.30:a<=26?1.12:a<=28?.80:a<=30?.52
     :a<=33?.34:a<=36?.20:a<=39?.11:.05;
  v*= 1+Math.max(0,p.pot-o)/95;
  v*= .9+p.forma*.2;
  return Math.round(v/500)*500;
}
/* Com o clube, o salário sai na régua da divisão dele: o Tier 1 paga pelo
   índice salarial do circuito (economia.js), que sobe quando os clubes de cima
   acumulam dinheiro sem ter onde gastar. Sem clube, é o salário de referência. */
function salario(p,t,explicado){
  const o=over(p);
  let s=Math.pow(Math.max(PISO_SALARIO_JOGADOR+4,o)-PISO_SALARIO_JOGADOR,2.1)*K_SALARIO_JOGADOR;
  if(p.idade<=20)s*=.72;
  if(t&&typeof indiceSalarial==='function')s*=indiceSalarial(t.tier);
  /* o que depende do clube e do momento: quem chama com `explicado` mostra
     cada fator numa linha própria (detalharPedido, pedidoRenovacao) */
  if(t&&!explicado){
    if(typeof fatorRiqueza==='function')s*=fatorRiqueza(t);
    s*=descontoSemClube(p);
  }
  /* piso de 100: garoto fraco, sem clube há meses, em clube com desconto,
     arredondava para zero, e salário zero quebra empréstimo e folha */
  return Math.max(100,Math.round(s/100)*100);
}
/* Quem está sem clube há meses baixa o pedido. Sem isto o veterano de 84 que
   não renovou ficava no mercado pedindo o salário cheio e ninguém pagava: em
   vinte temporadas, metade dos agentes livres tinha over 84 ou mais enquanto o
   pior titular do Tier 1 tinha 75. */
const DESCONTO_LIVRE_SEMANA=0.008, DESCONTO_LIVRE_MAX=0.4;
function descontoSemClube(p){
  if(!p||p.timeId||!p.semLivre)return 1;
  return 1-Math.min(DESCONTO_LIVRE_MAX,p.semLivre*DESCONTO_LIVRE_SEMANA);
}
function nomeUnico(usados){
  for(let i=0;i<400;i++){
    let n=pick(NS1)+(rnd()<.55?pick(NS2):'');
    if(rnd()<.18)n+=ri(0,99);
    n=n[0].toUpperCase()+n.slice(1);
    if(!usados.has(n)){usados.add(n);return n;}
  }
  return 'Player'+ri(1000,9999);
}
/* Quanto o perfil da função afasta os atributos da média do jogador.

   Antes todos nasciam em gauss(alvo,7) e só depois os atributos-chave eram
   puxados para o over bater. O resultado era gente quase uniforme: um
   Controlador tinha mira parecida com a de um Duelista, e por isso QUALQUER
   função servia como secundária — 100% do mundo tinha uma. Função sem perfil
   é rótulo, não característica.

   Agora o atributo que a função IGNORA nasce abaixo da média. Repare que a
   escultura é só para baixo, e isso é deliberado: o laço logo abaixo empurra
   os atributos-chave até o over bater o alvo, então subir os dois lados fazia
   o ajuste desfazer metade do trabalho e o perfil saía achatado de novo.
   Cavando só os atributos que a função não usa, a normalização é obrigada a
   levantar os que ela usa — e o contraste aparece nas duas pontas.

   O over final continua sendo o alvo pedido. O que muda é o formato, e é o
   formato que decide quem consegue jogar onde. */
const PERFIL_FUNCAO=30;
function makePlayer(alvo,role,pais,idade,usados,tier){
  const at={};
  const w=ROLE_W[role];
  const wMax=Math.max(...Object.values(w));
  for(const[k]of ATTRS){
    const rel=(w[k]||0)/wMax;
    at[k]=clamp(Math.round(gauss(alvo-(1-rel)*PERFIL_FUNCAO,6)),25,99);
  }
  // puxa os atributos-chave do papel pra cima para o "over" bater no alvo
  for(let it=0;it<14;it++){
    const cur=(()=>{let t=0;for(const k in w)t+=at[k]*w[k];return t;})();
    const d=alvo-cur; if(Math.abs(d)<.6)break;
    for(const k in w)at[k]=clamp(at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS)at[k]=clamp(Math.round(at[k]),25,99);
  at.lider=clamp(Math.round(gauss(alvo-8,13)),20,99);
  const p={
    id:'p'+(G.seqP++), nome:nomeUnico(usados), pais, role, at, idade, genero:'m',
    pot:0, contrato:ri(1,3), salario:0, moral:ri(60,85)/100, forma:ri(45,75)/100,
    fadiga:ri(0,15)/100, timeId:null, agentes:sortearAgentes(role), agenteNivel:null,
    hist:[], temp:novaTemp(), carreira:{maps:0,k:0,d:0,a:0,acs:0,mvp:0,titulos:0,intl:0},
    lesao:0, igl:false, role2:null, roleAtual:role,
    mapas:afinidadeInicial()
  };
  const o=over(p);
  /* tier vem de quem chama; agente livre e promessa sem clube contam como
     Tier 2, que é a divisão com espaço para crescer */
  p.pot=potencialDe(o,idade,tier||2);
  p.pico=o;
  /* familiaridade com os agentes dele, semeada aqui e nunca no render */
  if(typeof semearAgentes==='function')semearAgentes(p);
  ajustarSecundaria(p);
  p.salario=salario(p);
  p.valor=valor(p);
  return p;
}
function novaTemp(){return{maps:0,k:0,d:0,a:0,acs:0,fk:0,cl:0,mvp:0};}

/* reescala os atributos para atingir um over alvo, preservando o perfil da função */
function aplicarOver(p,alvo){
  const w=ROLE_W[p.role];
  for(let it=0;it<24;it++){
    let cur=0;for(const k in w)cur+=p.at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.4)break;
    for(const k in w)p.at[k]=clamp(p.at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS)p.at[k]=clamp(Math.round(p.at[k]),25,99);
  const principal=Object.keys(w).sort((a,b)=>w[b]-w[a]);
  for(let i=0;i<16&&over(p)!==alvo;i++){
    const k=principal[i%principal.length];
    p.at[k]=clamp(p.at[k]+(over(p)<alvo?1:-1),25,99);
  }
  p.pot=Math.max(p.pot,over(p));p.valor=valor(p);p.salario=salario(p);
  ajustarSecundaria(p);
}

/* ---------- funções secundária e efetiva ----------
   O over já é uma média dos atributos ponderada pela função. Isso significa
   que "quanto custa jogar fora de posição" não precisa de tabela nova: é a
   diferença entre o over na função de origem e o over na função pedida.

   E resolve de graça a regra que o Gabriel pediu: um jogador de mira ruim
   nunca vira Duelista, porque Duelista pesa mira .30 e reflexo .24, então o
   over dele nessa função desaba e ele não passa no teto de custo. Sem lista
   de exceções, sem número mágico por função. */
function overComo(p,role){
  const w=ROLE_W[role]||ROLE_W[p.role];
  let t=0;for(const k in w)t+=p.at[k]*w[k];
  return Math.round(t);
}
/* Quanto o jogador perde ao atuar nessa função. Negativo significa que ele
   seria MELHOR ali do que na função de origem — acontece, e é uma dica de que
   a função principal está mal atribuída. */
function custoDeFuncao(p,role){return over(p)-overComo(p,role);}

/* Teto de perda para uma função entrar como secundária. Seis pontos é pouco o
   bastante para exigir perfil de verdade e folgado o bastante para um Flex ou
   um Iniciador com boa mira alcançarem o Duelista. */
const CUSTO_MAX_SECUNDARIA=6;
function funcoesElegiveis(p){
  return ROLES.filter(r=>r!==p.role&&custoDeFuncao(p,r)<=CUSTO_MAX_SECUNDARIA);
}
/* A melhor secundária possível, ou null quando o jogador é especialista puro —
   e ficar sem secundária é um resultado legítimo, não uma falha. */
function melhorSecundaria(p){
  const el=funcoesElegiveis(p);
  if(!el.length)return null;
  return el.sort((a,b)=>custoDeFuncao(p,a)-custoDeFuncao(p,b))[0];
}
/* Recalcula a secundária depois de mexer em atributos ou na função principal.
   Mantém a escolha atual se ela continuar válida, para que treinar um pouco de
   mira não fique trocando a segunda função do jogador toda semana. */
function ajustarSecundaria(p){
  if(p.role2===p.role)p.role2=null;
  if(p.role2&&custoDeFuncao(p,p.role2)<=CUSTO_MAX_SECUNDARIA)return p.role2;
  p.role2=melhorSecundaria(p);
  return p.role2;
}
/* Todas as funções que o jogador cobre. Flex continua sendo coringa: é o que
   a função significa, e o resto do motor já contava com isso. */
function funcoesDe(p){
  if(p.role==='Flex')return ROLES.filter(r=>r!=='Flex');
  const out=[p.role];
  if(p.role2&&p.role2!==p.role)out.push(p.role2);
  return out;
}
function cobre(p,role){return p.role==='Flex'||p.role===role||p.role2===role;}
