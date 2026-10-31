/* ============================================================
   AFINIDADE DE MAPA POR JOGADOR
   ------------------------------------------------------------
   Até aqui só o TIME tinha preferência de mapa, o que é meio
   time: no cenário real quem gosta de Icebox é um jogador, e é a
   soma dos cinco que faz o clube ser bom lá.

   A afinidade nasce sorteada — não existe dado real de mapa por
   jogador, e inventar um número "informado" seria pior que
   assumir o sorteio — e depois EVOLUI: quem vai bem num mapa
   passa a ir melhor nele, quem apanha vai piorando. Em algumas
   temporadas cada jogador tem um perfil de mapa que ele mesmo
   construiu jogando.
   ============================================================ */

const AFIN_MIN=-8, AFIN_MAX=8;
/* Quantos mapas cada jogador tem opinião forte sobre. O resto fica perto de
   zero: um jogador que ama ou odeia doze mapas não tem identidade nenhuma. */
const AFIN_FORTES=3;
/* Quanto um mapa se move por partida. Pequeno de propósito: perfil de mapa é
   coisa de temporada, não de jogo. */
const AFIN_PASSO=0.55;
const AFIN_PASSO_MAX=1.6;

function afinidadeInicial(){
  const m={};
  const pool=shuffle(MAP_POOL.slice());
  pool.forEach((mapa,i)=>{
    /* os primeiros da lista embaralhada ganham opinião forte, positiva ou
       negativa; os demais ficam num ruído baixo */
    m[mapa]= i<AFIN_FORTES ? clamp(Math.round(gauss(0,1)*0+ (rnd()<0.5?-1:1)*ri(4,8)),AFIN_MIN,AFIN_MAX)
                           : clamp(Math.round(gauss(0,1.6)),AFIN_MIN,AFIN_MAX);
  });
  return m;
}
function afinidadeDe(p,mapa){
  if(!p)return 0;
  if(!p.mapas)p.mapas=afinidadeInicial();
  const v=p.mapas[mapa];
  return typeof v==='number'?v:0;
}
/* Média dos titulares. É o que entra na força do time — um jogador que adora o
   mapa não salva os outros quatro, mas inclina. */
function afinidadeElenco(t,mapa){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(!tit.length)return 0;
  return tit.reduce((s,p)=>s+afinidadeDe(p,mapa),0)/tit.length;
}
/* Os mapas em que o jogador é melhor e pior, para a ficha. */
function mapasDe(p){
  return MAP_POOL.map(m=>({mapa:m,v:afinidadeDe(p,m)}))
                 .sort((a,b)=>b.v-a.v);
}

/* ---------- evolução ----------
   O jogador melhora no mapa em que foi bem e piora naquele em que apanhou. A
   régua é o DESEMPENHO DELE MESMO nessa partida contra o que ele costuma
   render — comparar com a média da liga puniria quem é ruim por ser ruim, e a
   afinidade deixaria de falar sobre o mapa. */
function evoluirAfinidade(p,mapa,acsNoMapa){
  if(!p||!mapa)return 0;
  if(!p.mapas)p.mapas=afinidadeInicial();
  const media=p.temp&&p.temp.maps?p.temp.acs/p.temp.maps:acsNoMapa;
  if(!media)return 0;
  const rel=(acsNoMapa-media)/Math.max(40,media);   /* fração acima/abaixo de si */
  const passo=clamp(rel*AFIN_PASSO*4,-AFIN_PASSO_MAX,AFIN_PASSO_MAX);
  const antes=p.mapas[mapa]||0;
  p.mapas[mapa]=clamp(antes+passo,AFIN_MIN,AFIN_MAX);
  return p.mapas[mapa]-antes;
}

/* ============================================================
   ROTAÇÃO DO POOL ATIVO
   ------------------------------------------------------------
   O pool tem doze mapas, mas só sete entram em jogo por vez —
   é assim na VCT, e é isso que torna treinar mapa uma decisão:
   com doze para manter de pé, ninguém domina nenhum.

   A rotação acontece três vezes por temporada, depois de cada
   Masters e depois do Champions, que é quando a Riot mexe de
   verdade. Dois mapas saem, dois entram.

   Afinidade de mapa fora de rotação NÃO é apagada: você sabia
   jogar Split, e vai continuar sabendo quando ele voltar. O que
   ela faz é escorregar devagar sem uso — ver evoluirAfinidade e
   esquecerMapas.
   ============================================================ */
/* Oito, como o pool competitivo real de 2026. */
const MAPAS_ATIVOS=8;
const ROTACAO_TROCA=2;          /* quantos entram e saem por rotação */

function poolInicial(){
  /* O pool real de 2026 (POOL_2026 em data/mundo.js, tirado das estatísticas
     de mapa das três ligas no vlr.gg). A rotação assume dali em diante, e o
     pool continua editável no Banco de dados como o resto da base. */
  const real=(typeof POOL_2026!=='undefined'?POOL_2026:[]).filter(m=>MAP_POOL.includes(m));
  if(real.length===MAPAS_ATIVOS)return real.slice();
  return MAP_POOL.slice(0,MAPAS_ATIVOS);
}
/* Vitória do ataque no mapa, em pontos de força. O dado é real (MAPA_ATK) e a
   conversão é a inversa da logística do round: dif = 26·ln(p/(1-p)). Em Abyss
   (55% ATK) isso dá +1,3 para quem ataca; em Ascent (47%) dá −0,8. */
function viesLado(mapa,lado){
  const atk=(typeof MAPA_ATK!=='undefined'&&MAPA_ATK[mapa])||50;
  const p=clamp(atk/100,0.2,0.8);
  const dif=26*Math.log(p/(1-p));
  return lado==='atk'?dif/2:-dif/2;
}
function mapaAtivo(m){return (G.mapasAtivos||MAP_POOL).includes(m);}
/* Roda a rotação. `motivo` entra na notícia para o jogador saber por que o
   pool mudou — sem isso o mapa que ele treinou seis semanas simplesmente
   desaparece da tela. */
function rotacionarMapas(motivo){
  const ativos=(G.mapasAtivos||poolInicial()).slice();
  const fora=MAP_POOL.filter(m=>!ativos.includes(m));
  if(!fora.length)return null;
  const quantos=Math.min(ROTACAO_TROCA,fora.length,Math.max(0,ativos.length-3));
  if(quantos<=0)return null;
  /* Sai quem está há mais tempo em rotação: guardar desde quando cada mapa
     entrou evita que o mesmo mapa saia duas vezes seguidas por azar. */
  G.mapaDesde=G.mapaDesde||{};
  ativos.forEach(m=>{if(G.mapaDesde[m]==null)G.mapaDesde[m]=0;});
  const saem=ativos.slice().sort((a,b)=>(G.mapaDesde[a]||0)-(G.mapaDesde[b]||0))
    .slice(0,quantos);
  const entram=shuffle(fora.slice()).slice(0,quantos);
  const novos=ativos.filter(m=>!saem.includes(m)).concat(entram);
  G.mapasAtivos=novos;
  const marca=(G.ano||0)*100+(G.semana||0);
  entram.forEach(m=>{G.mapaDesde[m]=marca;});
  saem.forEach(m=>{delete G.mapaDesde[m];});
  if(typeof noticia==='function')
    noticia('🗺 Rotação de mapas'+(motivo?' ('+motivo+')':'')+': entram '+entram.join(' e ')+
            ', saem '+saem.join(' e ')+'.',{c:'meta',imp:2});
  /* Todo clube que estava treinando um mapa que acabou de sair precisa saber
     agora, e não descobrir seis semanas depois que treinou o vazio. */
  if(typeof limparPlano==='function')
    for(const id in G.times)limparPlano(G.times[id]);
  return{entram,saem};
}
/* Mapa que ninguém treina nem joga escorrega para o meio. É o que impede o
   clube de ser bom em doze mapas ao mesmo tempo, e é o que dá conteúdo ao
   veto: todo time tem mapa que não quer jogar. */
/* Mede-se pelo par: com 0,06 contra treino de 0,9 o abandono não aparecia.
   Em uma temporada isto tira ~5 pontos de um mapa esquecido — o bastante para
   o clube ter mapa que ele não quer jogar, que é o que dá conteúdo ao veto. */
const AFIN_ESQUECE=0.10;
/* Semana sem mapa escolhido não é semana parada: o elenco scrimma de qualquer
   jeito, só sem direção. Medido: com o esquecimento cheio nas semanas sem
   escolha, o clube que nunca abre a tela de Treino ia de um leque de 4,0 pontos
   entre o melhor e o pior mapa para 1,0 em 42 semanas — a identidade de mapa
   desaparecia inteira e o veto virava sorteio. Meia dose deixa a escolha
   valendo sem apagar o sistema de quem não escolheu. */
const AFIN_ESQUECE_SEM_PLANO=0.045;
/* Média sustentável do pool ativo. Sem um teto na MÉDIA, o treino de mapa era
   ganho líquido toda semana: o clube subia o pool inteiro e acabava bom em
   tudo. O puxão desconta o excesso de TODOS os mapas por igual, então ele
   derruba o nível e preserva o leque — especializar continua valendo, acumular
   não. */
const AFIN_MEDIA_TETO=1.2;
const AFIN_PUXAO=0.30;
function normalizarPool(t){
  if(!t)return;
  const pool=(G.mapasAtivos||MAP_POOL);
  if(!pool.length)return;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.mapas)continue;
    let soma=0;
    for(const m of pool)soma+=p.mapas[m]||0;
    const excesso=soma/pool.length-AFIN_MEDIA_TETO;
    if(excesso<=0)continue;
    const desconto=excesso*AFIN_PUXAO;
    for(const m of pool)p.mapas[m]=clamp((p.mapas[m]||0)-desconto,AFIN_MIN,AFIN_MAX);
  }
}
function esquecerMapas(t,pouparMapa){
  if(!t)return;
  const taxa=pouparMapa?AFIN_ESQUECE:AFIN_ESQUECE_SEM_PLANO;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.mapas)continue;
    for(const m of MAP_POOL){
      if(m===pouparMapa)continue;
      const v=p.mapas[m]||0;
      if(!v)continue;
      const passo=Math.min(taxa,Math.abs(v));
      p.mapas[m]=v>0?v-passo:v+passo;
    }
  }
}
