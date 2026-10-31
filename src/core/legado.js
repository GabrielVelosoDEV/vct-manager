/* ============================================================
   LEGADO: TÍTULOS ANTIGOS, CONFRONTO DIRETO E RIVALIDADE
   ------------------------------------------------------------
   Um clube sem passado é um nome com um escudo. Este módulo dá
   enredo às franquias em três camadas:

     · o que já ganharam antes de 2027 (data/historia.js)
     · quem enfrentaram desde então, e com que placar
     · de quem eles não gostam, e por quê

   A terceira camada não é escrita à mão: rivalidade é DERIVADA do
   confronto direto e do histórico. Escrever "Sentinels odeia
   100 Thieves" numa tabela envelhece mal — depois de dez
   temporadas simuladas a rivalidade seria mentira. Derivando,
   ela acompanha o que aconteceu na sua run.
   ============================================================ */

/* ---------- semeadura da pré-história ---------- */
/* Normalização própria em vez de ASSETS.slug: o motor roda sem a camada de
   dados em tools/verificar.mjs, e uma dependência de UI dentro do core faria a
   simulação parar de subir. Tira acento, caixa e pontuação — o suficiente para
   'LEVIATÁN' casar com 'Leviatán' e 'EDward Gaming' com 'Edward Gaming'. */
function _chaveNome(x){
  return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
}
function acharClubePorNome(nome){
  const alvo=_chaveNome(ALIAS_CLUBE[nome]||nome);
  for(const id in G.times)if(_chaveNome(G.times[id].nome)===alvo)return G.times[id];
  return null;
}

/* Torcida herdada. Um clube que ganhou Champions em 2022 chega em 2027 com
   público maior do que um que nunca ganhou nada, mesmo que hoje jogue igual.
   É por isso que legado é diferente de prestígio: prestígio é o que você é
   agora, torcida é o que você já foi. */
const TORCIDA_POR_TITULO=7;
const TORCIDA_TETO_LEGADO=26;

function semearHistoria(){
  G.historico=G.historico||[];
  if(typeof HISTORIA_REAL==='undefined')return 0;
  let semeados=0;
  for(const h of HISTORIA_REAL){
    /* o registro do mundo guarda TODOS, inclusive campeões que não existem
       mais: é o que faz 2021 parecer que aconteceu */
    G.historico.push({ano:h.ano,evento:h.evento,campeao:h.campeao,vice:h.vice||'',
                      escopo:h.escopo,pre:true});
    const t=acharClubePorNome(h.campeao);
    if(!t)continue;
    t.titulos=t.titulos||[];
    t.titulos.push(h.ano+' · '+h.evento);
    t.legado=(t.legado||0)+(PESO_TITULO[h.escopo]||0.34);
    semeados++;
    const v=h.vice&&acharClubePorNome(h.vice);
    if(v){v.vices=(v.vices||0)+1;}
  }
  /* a torcida herdada entra depois, para o peso total já estar somado */
  for(const id in G.times){
    const t=G.times[id];
    if(!t.legado)continue;
    t.torcida=clamp(Math.round(t.torcida+Math.min(TORCIDA_TETO_LEGADO,t.legado*TORCIDA_POR_TITULO)),
                    pisoTorcida(t),TORCIDA_MAX);
  }
  G.historico.sort((a,b)=>a.ano-b.ano);
  return semeados;
}
/* Resumo do passado de um clube, para a interface. */
function legadoDe(t){
  const titulos=(t.titulos||[]);
  const inter=titulos.filter(x=>/Champions|Masters|LOCK/.test(x));
  return{total:titulos.length,internacionais:inter.length,
         peso:t.legado||0,vices:t.vices||0,titulos};
}

/* ---------- confronto direto ---------- */
/* Guardado em G.h2h com chave ordenada, para "A contra B" e "B contra A"
   caírem no mesmo registro. Sem a ordenação seriam dois históricos separados
   que nunca conversariam. */
/* Quantos confrontos recentes cada par guarda. Eram 12: com 80 clubes isso era
   um quarto do save depois de vinte temporadas, e a tela mostra menos que isso. */
const H2H_ULTIMOS=6;
function chaveH2H(a,b){return a<b?a+'|'+b:b+'|'+a;}
function registrarConfronto(idA,idB,vencedorId,ctx){
  if(!idA||!idB||idA===idB)return null;
  G.h2h=G.h2h||{};
  const k=chaveH2H(idA,idB);
  const r=G.h2h[k]||(G.h2h[k]={a:idA<idB?idA:idB,b:idA<idB?idB:idA,va:0,vb:0,jogos:0,ultimos:[]});
  r.jogos++;
  if(vencedorId===r.a)r.va++;else if(vencedorId===r.b)r.vb++;
  r.ultimos.unshift({ano:G.ano,v:vencedorId,ctx:ctx||''});
  if(r.ultimos.length>H2H_ULTIMOS)r.ultimos.pop();
  return r;
}
function confronto(idA,idB){
  const r=G.h2h&&G.h2h[chaveH2H(idA,idB)];
  if(!r)return{jogos:0,vitorias:0,derrotas:0,ultimos:[]};
  const eu=idA===r.a;
  return{jogos:r.jogos,vitorias:eu?r.va:r.vb,derrotas:eu?r.vb:r.va,ultimos:r.ultimos};
}
/* Todos os confrontos de um clube, do mais jogado para o menos. */
function confrontosDe(id){
  const out=[];
  for(const k in (G.h2h||{})){
    const r=G.h2h[k];
    if(r.a!==id&&r.b!==id)continue;
    const outro=r.a===id?r.b:r.a;
    if(!G.times[outro])continue;
    const eu=r.a===id;
    out.push({time:G.times[outro],jogos:r.jogos,vitorias:eu?r.va:r.vb,
              derrotas:eu?r.vb:r.va,ultimos:r.ultimos});
  }
  return out.sort((a,b)=>b.jogos-a.jogos);
}

/* ---------- rivalidade ---------- */
/* A nota de rivalidade responde a uma pergunta: o quanto esse jogo importa?
   Importa quando os dois se enfrentam muito, quando o histórico é equilibrado
   (goleada crônica não é rivalidade, é freguesia), quando os dois são grandes,
   e quando são da mesma região — clássico de vizinho pesa mais. */
const RIV_MIN_JOGOS=4;
function notaRivalidade(t,c){
  if(c.jogos<RIV_MIN_JOGOS)return 0;
  const volume=Math.min(1,c.jogos/14);
  const equilibrio=1-Math.abs(c.vitorias-c.derrotas)/c.jogos;   /* 1 = empatado */
  const porte=Math.min(1,((t.torcida||0)+(c.time.torcida||0))/160);
  const vizinhos=t.regiao===c.time.regiao?1:0.55;
  const legado=Math.min(1,(((t.legado||0)+(c.time.legado||0))/6));
  return (volume*0.32+equilibrio*0.30+porte*0.18+legado*0.20)*vizinhos;
}
/* ---------- o clássico pesa ----------
   Até aqui a rivalidade era só uma linha na tela História: nada no jogo
   mudava por ganhar ou perder do rival. Agora o clássico mexe no vestiário e
   na torcida, na proporção da nota — clássico morno mexe pouco, o grande
   clássico da liga mexe muito. A torcida é o que leva isso ao patrocínio
   (atratividade em economia.js). Nada sorteia. */
const RIV_CLASSICO=0.28;   /* a mesma régua de rivaisDe */
function aplicarClassico(vencedorId,perdedorId){
  const V=G.times[vencedorId],P=G.times[perdedorId];
  if(!V||!P)return null;
  const nota=notaRivalidade(V,{...confronto(V.id,P.id),time:P});
  if(nota<=RIV_CLASSICO)return null;
  const k=Math.min(1.6,nota/0.5);
  const mexer=(t,dm)=>(t.titulares||[]).forEach(id=>{const p=G.jogadores[id];
    if(p)p.moral=clamp(p.moral+dm,0.15,1);});
  mexer(V,0.04*k);
  mexer(P,-0.05*k);
  const piso=t=>(typeof pisoTorcida==='function')?pisoTorcida(t):0;
  const teto=(typeof TORCIDA_MAX!=='undefined')?TORCIDA_MAX:100;
  if(typeof V.torcida==='number')V.torcida=clamp(V.torcida+Math.round(2*k),piso(V),teto);
  if(typeof P.torcida==='number')P.torcida=clamp(P.torcida-Math.round(1.5*k),piso(P),teto);
  if((V.id===G.meuTime||P.id===G.meuTime)&&typeof noticia==='function')
    noticia('🔥 Clássico: '+V.nome+' venceu '+P.nome+'. '+
      (V.id===G.meuTime?'A torcida foi à loucura e o vestiário cresceu.':'Derrota que dói: o vestiário sentiu e a torcida cobrou.'),{c:'competicoes',t:[V.id,P.id],imp:2});
  return{nota,k};
}
function rivaisDe(id,quantos){
  const t=G.times[id];if(!t)return[];
  return confrontosDe(id)
    .map(c=>({...c,nota:notaRivalidade(t,c)}))
    .filter(c=>c.nota>0.28)
    .sort((a,b)=>b.nota-a.nota)
    .slice(0,quantos||3);
}
/* Por que esses dois são rivais — em uma frase, montada do que de fato
   aconteceu. Sem isso a rivalidade é um número e não conta história. */
function motivoRivalidade(t,c){
  const partes=[];
  partes.push(c.jogos+' confrontos');
  if(c.vitorias===c.derrotas)partes.push('empatados em '+c.vitorias+'–'+c.derrotas);
  else partes.push(c.vitorias+'–'+c.derrotas+(c.vitorias>c.derrotas?' para você':' contra você'));
  const tit=(c.time.titulos||[]).length;
  if(tit)partes.push('o rival tem '+tit+' título'+(tit>1?'s':''));
  if(t.regiao===c.time.regiao)partes.push('mesma liga');
  return partes.join(' · ');
}
