/* ============================================================
   RELATÓRIO DE SCOUTING
   ------------------------------------------------------------
   O que você sabe do adversário ANTES de vetar mapa. E o quanto
   você sabe não é de graça: sai do analista e do olheiro.

   Essa é a peça que faz a comissão técnica girar. Antes, o
   analista era um número somado à força de jogo e o olheiro só
   servia para a base — dois cargos que ninguém sentia. Agora o
   relatório tem cinco níveis, e a diferença entre o nível 1 e o
   nível 5 é a diferença entre "eles são fortes" e "eles vão
   banir Icebox primeiro e escalam Sova com um jogador que só
   tem 40 de familiaridade".

   Nada aqui sorteia: o relatório é desenhado na tela, e a tela
   não pode tocar no gerador semeado do motor. Onde o relatório
   precisa ser IMPRECISO — nível baixo mostrando número redondo
   demais — a imprecisão vem de um embaralhador determinístico
   dos ids, não de rnd().
   ============================================================ */

const SCOUT_MAX=5;
/* Analista pesa mais que olheiro: ler o adversário é o trabalho dele. O
   olheiro entra porque é quem assiste os outros clubes — e é o que finalmente
   dá a ele uma função fora da base. */
function nivelScout(t){
  if(!t||!t.staff)return 1;
  const a=t.staff.analista||1, o=t.staff.olheiro||1;
  return clamp(Math.round((a*1.3+o*0.7)/2),1,SCOUT_MAX);
}
/* Ruído determinístico: mesma pergunta, mesma resposta, sem gerador semeado. */
function borrar(chave,amplitude){
  let h=2166136261;
  const s=String(chave);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  const u=((h>>>0)%1000)/1000;      /* 0..1 estável */
  return (u-0.5)*2*amplitude;
}
/* Número que o relatório mostra: exato no nível alto, arredondado e torto no
   nível baixo. Devolve null quando o nível não dá nem para chutar. */
function numeroBorrado(valor,nivel,chave,minimo){
  if(nivel>=(minimo||3)+2)return valor;
  if(nivel<(minimo||3))return null;
  const amp=nivel>=(minimo||3)+1?0.8:1.8;
  return valor+borrar(chave,amp);
}
function palavraAfinidade(v){
  if(v>=3.5)return'casa deles';
  if(v>=1.5)return'confortável';
  if(v>=-0.5)return'neutro';
  if(v>=-2.5)return'incomodados';
  return'fogem dele';
}
function palavraForma(f){
  if(f>=0.78)return'em alta';
  if(f>=0.6)return'regular';
  if(f>=0.45)return'oscilando';
  return'em baixa';
}
function palavraFadiga(f){
  if(f>=0.72)return'pernas pesadas';
  if(f>=0.5)return'rodados';
  if(f>=0.3)return'inteiros';
  return'descansados';
}
/* Últimos resultados do adversário, do mais recente para o mais antigo.
   `jogos` no h2h é uma CONTAGEM, não uma lista — a lista é `ultimos`. Ler o
   número como se fosse array estourava a tela inteira do relatório. */
function ultimosDe(t,n){
  const out=[];
  for(const par in (G.h2h||{})){
    const reg=G.h2h[par];
    if(!reg||(reg.a!==t.id&&reg.b!==t.id))continue;
    const rival=reg.a===t.id?reg.b:reg.a;
    for(const u of (reg.ultimos||[]))
      out.push({ano:u.ano,ctx:u.ctx,rival,venceu:u.v===t.id});
  }
  return out.sort((x,y)=>y.ano-x.ano).slice(0,n||5);
}

/* ---------- o relatório ----------
   Devolve dados, não HTML: a tela decide como mostrar, e o teste consegue
   perguntar "o nível 2 vazou número que só o nível 4 deveria ter?". */
function relatorioScout(meuT,advT,bo){
  const nv=nivelScout(meuT);
  const pool=(G.mapasAtivos||MAP_POOL).slice();
  const surpAdv=(typeof surpresaDaComp==='function')
    ? pool.reduce((s,mp)=>s+surpresaDaComp(advT,mp),0)/Math.max(1,pool.length) : 0;
  /* Comp fora do manual esconde: o que o adversário faz de estranho, o seu
     analista não tem como ter preparado. */
  const nvComp=clamp(Math.round(nv-surpAdv*2.2),1,SCOUT_MAX);

  const tit=(advT.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const forma=tit.length?tit.reduce((s,p)=>s+p.forma,0)/tit.length:0.6;
  const fadiga=tit.length?tit.reduce((s,p)=>s+p.fadiga,0)/tit.length:0;

  const mapas=pool.map(mp=>{
    const real=afinidadeElenco(advT,mp)+ (advT.mapPref[mp]||0)*0.5;
    return{
      mapa:mp,
      palavra:nv>=2?palavraAfinidade(real):null,
      valor:numeroBorrado(real,nv,advT.id+mp+G.ano,3),
      /* comp provável: só a partir do nível 4, e menos se eles surpreendem */
      comp:nvComp>=4&&typeof compEscalada==='function'
        ? compEscalada(advT,mp).map(l=>({nome:l.p.nome,ag:l.ag,
            nivel:nvComp>=5?Math.round(l.nivel):null})) : null
    };
  }).sort((a,b)=>(b.valor!==null&&a.valor!==null)?b.valor-a.valor:0);

  const chave=tit.slice().sort((a,b)=>over(b)-over(a))[0]||null;
  const lesionados=(advT.elenco||[]).map(i=>G.jogadores[i]).filter(p=>p&&p.lesao);

  return{
    nivel:nv, nivelComp:nvComp, surpresaDeles:surpAdv,
    clube:advT, bo:bo||3,
    campanha:{v:advT.temporada?advT.temporada.v:0, d:advT.temporada?advT.temporada.d:0,
              pts:advT.temporada?advT.temporada.pts:0},
    h2h:(typeof confronto==='function')?confronto(meuT.id,advT.id):null,
    ultimos:nv>=3?ultimosDe(advT,5):null,
    forma:{palavra:palavraForma(forma), valor:nv>=4?Math.round(forma*100):null},
    fadiga:{palavra:nv>=3?palavraFadiga(fadiga):null, valor:nv>=5?Math.round(fadiga*100):null},
    mapas,
    /* ordem de veto provável: só o nível 5 enxerga */
    vetoProvavel:nv>=5?ordemDeVetoProvavel(advT,pool):null,
    chave:nv>=3&&chave?{nome:chave.nome,role:chave.roleAtual||chave.role,
                        over:over(chave),acs:chave.temp&&chave.temp.maps?Math.round(chave.temp.acs/chave.temp.maps):null}:null,
    lesionados:nv>=4?lesionados.map(p=>({nome:p.nome,semanas:p.lesao})):null,
    tatica:nv>=4?{agres:advT.tatica.agres,foco:advT.tatica.foco}:null,
    sinergia:nv>=5?advT.sinergia:null
  };
}
/* O que eles provavelmente banem primeiro e escolhem primeiro. É leitura pura
   da mesma conta que a IA usa no veto — sem o ruído, que é justamente o que o
   relatório não consegue prever. */
function ordemDeVetoProvavel(t,pool){
  const g=m=>(typeof gostaDeMapa==='function')?gostaDeMapa(t,m):0;
  const ord=pool.slice().sort((a,b)=>g(b)-g(a));
  return{picks:ord.slice(0,2),bans:ord.slice(-2).reverse()};
}
/* Frase de abertura: o relatório tem de dizer alguma coisa mesmo no nível 1,
   senão contratar analista vira abstração. */
function resumoScout(r){
  const t=r.clube;
  if(r.nivel<=1)
    /* nomeLiga() recebe o CLUBE, não a região — passar a região estourava a
       tela inteira do relatório no nível 1, que é justamente o nível de quem
       ainda não contratou analista nenhum. */
    return 'Sabemos o essencial: '+t.nome+', '+
           ((typeof nomeLiga==='function')?nomeLiga(t):t.regiao)+
           ', '+r.campanha.v+' vitórias e '+r.campanha.d+' derrotas na temporada. '+
           'Com um analista melhor, saberíamos em que mapa eles moram.';
  const melhor=r.mapas[0], pior=r.mapas[r.mapas.length-1];
  let s=t.nome+' está '+r.forma.palavra+'. ';
  if(melhor&&pior)s+='Moram em '+melhor.mapa+' e fogem de '+pior.mapa+'. ';
  if(r.fadiga.palavra)s+='Chegam '+r.fadiga.palavra+'. ';
  if(r.nivel>=4&&r.tatica)
    s+='Jogam com agressividade '+r.tatica.agres+' e foco '+
       ({execucao:'em execuções',retake:'em retakes',default:'equilibrado'}[r.tatica.foco]||r.tatica.foco)+'. ';
  if(r.surpresaDeles>=0.45)
    s+='Atenção: eles fogem do meta nas comps, e é o que o nosso analista tem menos como prever.';
  return s.trim();
}

/* ---------- a IA também escolhe tática ----------
   Sem isto o mundo inteiro ficaria em default e agressividade 3 para sempre, e
   o pedra-papel-tesoura do foco não teria com quem jogar: acertar o contra-foco
   seria acertar contra ninguém.

   E a IA lê o adversário com a MESMA régua que você: um clube com analista
   bom escolhe o foco que bate no seu; um clube com analista ruim escolhe pelo
   próprio perfil e torce. É o que faz a comissão valer dos dois lados. */
function proximoAdversarioDe(t){
  const i=blocoDaSemana(G.semana||1);
  const b=i==null?null:G.calendario[i];
  if(!b)return null;
  for(const s of b.stages){
    if(s.feito)continue;
    const par=(s.rodadaAtual||[]).find(x=>x.includes(t.id));
    if(par)return G.times[par[0]===t.id?par[1]:par[0]]||null;
  }
  return null;
}
function focoNatural(t){
  const perfil=(typeof perfilAgressivo==='function')?perfilAgressivo(t):0;
  return perfil>=3?'execucao':perfil<=-3?'retake':'default';
}
function taticaIA(t){
  if(!t||t.id===G.meuTime)return null;
  /* agressividade: o elenco decide, porque é o elenco que paga */
  const perfil=(typeof perfilAgressivo==='function')?perfilAgressivo(t):0;
  t.tatica.agres=clamp(3+Math.round(perfil/5),1,5);
  const adv=proximoAdversarioDe(t);
  const nv=nivelScout(t);
  /* Só quem tem leitura escolhe pelo adversário. Abaixo do nível 3 o clube
     joga o que ele é, que é exatamente o que um clube sem analista faz. */
  if(adv&&nv>=3){
    const contra={default:'execucao',retake:'default',execucao:'retake'};
    t.tatica.foco=contra[adv.tatica.foco||'default']||focoNatural(t);
  }else{
    t.tatica.foco=focoNatural(t);
  }
  return t.tatica;
}
