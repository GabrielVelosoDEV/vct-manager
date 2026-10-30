/* ============================================================
   CONVERSA COM O ELENCO
   ------------------------------------------------------------
   Moral é o segundo maior fator de derrota do jogo — medido, um
   elenco com moral cheia bate um com moral no chão em 85% das
   séries. E até aqui ela só subia e descia sozinha: você
   assistia. Isto é o botão que faltava.

   Duas regras seguram o botão para ele não virar fonte de moral
   de graça:

   1. PROMESSA É DÍVIDA. Prometer titularidade levanta o jogador
      agora e cobra depois se você não cumprir — e cobra mais do
      que levantou. É a única opção com efeito grande, e é a
      única que pode explodir na sua mão.

   2. O PREPARADOR MENTAL PESA. Uma conversa conduzida por um
      clube com psicólogo bom rende mais e erra menos. É o que
      tira o cargo do limbo de "número somado à moral semanal".
   ============================================================ */

const CONVERSA_ESPERA=6;        /* semanas até poder chamar o mesmo jogador */
const PROMESSA_PRAZO=8;         /* semanas para cumprir a titularidade */

/* Por que ele está insatisfeito. Devolve null quando não está. */
function motivoDeInsatisfacao(t,p){
  if(!p||p.timeId!==t.id)return null;
  const titular=(t.titulares||[]).includes(p.id);
  if(p.moral<=0.42)return{id:'moral',peso:3,
    texto:'Moral no chão — '+Math.round(p.moral*100)+'%.'};
  if(!titular&&over(p)>=(t.titulares||[]).reduce((s,i)=>Math.min(s,over(G.jogadores[i])),99))
    return{id:'banco',peso:2,
      texto:'Está no banco sendo melhor que titular seu.'};
  if(p.anuncio)return{id:'anuncio',peso:2,
    texto:'Sabe que está na vitrine.'};
  if(p.contrato<=1)return{id:'contrato',peso:1,
    texto:'Contrato acabando e nada de conversa.'};
  if(p.fadiga>=0.8)return{id:'fadiga',peso:1,
    texto:'Está no limite físico e ninguém perguntou.'};
  return null;
}
function insatisfeitos(t){
  return (t.elenco||[]).map(id=>G.jogadores[id]).filter(Boolean)
    .map(p=>({p,motivo:motivoDeInsatisfacao(t,p)}))
    .filter(x=>x.motivo)
    .sort((a,b)=>b.motivo.peso-a.motivo.peso||a.p.moral-b.p.moral);
}
function podeConversar(p){
  if(!p)return false;
  if(!p.ultimaConversa)return true;
  const passou=(G.ano-p.ultimaConversa.ano)*SEMANAS_ANO+(G.semana-p.ultimaConversa.semana);
  return passou>=CONVERSA_ESPERA;
}
function semanasAteConversar(p){
  if(podeConversar(p))return 0;
  const passou=(G.ano-p.ultimaConversa.ano)*SEMANAS_ANO+(G.semana-p.ultimaConversa.semana);
  return Math.max(1,CONVERSA_ESPERA-passou);
}
/* As opções que fazem sentido para ESTE jogador neste momento. Oferecer
   "prometer titularidade" a quem já é titular seria conversa de menu, não de
   vestiário. */
function opcoesDeConversa(t,p){
  const m=motivoDeInsatisfacao(t,p);
  const titular=(t.titulares||[]).includes(p.id);
  const out=[{id:'franco',rot:'Ser franco',
    dica:'Diz o que você pensa dele, sem promessa. Mexe pouco e nunca vira dívida.'}];
  if(!titular)out.push({id:'promessa',rot:'Prometer titularidade',
    dica:'Levanta muito agora. Se ele não for titular em '+PROMESSA_PRAZO+
         ' semanas, cai o dobro e o vestiário fica sabendo.'});
  out.push({id:'elogio',rot:'Elogiar publicamente',
    dica:'Levanta ele e incomoda quem está atrás na fila.'});
  out.push({id:'cobranca',rot:'Cobrar',
    dica:'Custa moral e rende trabalho: ele treina com mais foco por algumas semanas.'});
  if(m&&m.id==='fadiga')out.push({id:'poupar',rot:'Prometer descanso',
    dica:'Tira o peso da semana: fadiga cai agora, e ele volta inteiro.'});
  return out;
}
/* O modificador do preparador mental, no mesmo ponto neutro das outras
   fórmulas do jogo. */
function pesoMental(t){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  return 1+(((t.staff&&t.staff.mental)||neutro)-neutro)*0.16;
}
/* Conversa de verdade: muda o mundo e devolve o que dizer na tela. */
function conversarCom(t,p,opcao){
  if(!t||!p)return{ok:false,erro:'Ninguém para conversar.'};
  if(p.timeId!==t.id)return{ok:false,erro:p.nome+' não é do seu elenco.'};
  if(!podeConversar(p))
    return{ok:false,erro:'Você conversou com '+p.nome+' há pouco. Espere '+
           semanasAteConversar(p)+' semana(s).'};
  const k=pesoMental(t);
  const antes=p.moral;
  let msg='';
  if(opcao==='franco'){
    /* franco funciona melhor com quem tem cabeça: liderança e consistência */
    const cabeca=(p.at.lider*0.6+p.at.consist*0.4-55)/100;
    p.moral=clamp(p.moral+(0.05+cabeca*0.10)*k,0.05,1);
    msg='Conversa direta com '+p.nome+'. '+(cabeca>0?'Ele entendeu.':'Ele ouviu, mas não gostou muito.');
  }else if(opcao==='promessa'){
    p.moral=clamp(p.moral+0.16*k,0.05,1);
    p.promessa={tipo:'titular',ate:(G.semana||1)+PROMESSA_PRAZO,ano:G.ano,clube:t.id};
    msg=p.nome+' saiu da sala acreditando. Agora é com você.';
  }else if(opcao==='elogio'){
    p.moral=clamp(p.moral+0.10*k,0.05,1);
    /* elogio público é comparação: quem está atrás na fila sente */
    const outros=(t.elenco||[]).map(i=>G.jogadores[i])
      .filter(x=>x&&x.id!==p.id&&!(t.titulares||[]).includes(x.id));
    outros.forEach(x=>{x.moral=clamp(x.moral-0.03,0.05,1);});
    msg='Elogio público a '+p.nome+'. '+(outros.length?'O banco ouviu também.':'');
  }else if(opcao==='cobranca'){
    p.moral=clamp(p.moral-0.07,0.05,1);
    p.cobrado={ate:(G.semana||1)+4,ano:G.ano};
    msg='Cobrança em cima de '+p.nome+'. Ele saiu calado e vai treinar sério.';
  }else if(opcao==='poupar'){
    p.fadiga=clamp(p.fadiga-0.22,0,1);
    p.moral=clamp(p.moral+0.07*k,0.05,1);
    msg=p.nome+' vai ser poupado. Ele agradeceu.';
  }else{
    return{ok:false,erro:'Opção que não existe.'};
  }
  p.ultimaConversa={ano:G.ano,semana:G.semana,opcao};
  return{ok:true,msg,delta:Math.round((p.moral-antes)*100)};
}
/* Cobrança das promessas. Roda uma vez por semana, pelo relógio. */
function cobrarPromessas(t){
  if(!t)return 0;
  let quebradas=0;
  for(const id of (t.elenco||[])){
    const p=G.jogadores[id];
    if(!p||!p.promessa)continue;
    const pr=p.promessa;
    if(pr.clube!==t.id){delete p.promessa;continue;}
    if((t.titulares||[]).includes(p.id)){
      /* cumprida: nada de festa, só a dívida saindo do quadro */
      delete p.promessa;
      continue;
    }
    const venceu=(G.ano>pr.ano)||(G.ano===pr.ano&&G.semana>=pr.ate);
    if(!venceu)continue;
    p.moral=clamp(p.moral-0.32,0.05,1);
    delete p.promessa;
    quebradas++;
    /* o vestiário toma conhecimento: promessa quebrada não fica entre dois */
    (t.elenco||[]).forEach(i=>{const x=G.jogadores[i];
      if(x&&x.id!==p.id)x.moral=clamp(x.moral-0.04,0.05,1);});
    if(t.id===G.meuTime&&typeof noticia==='function')
      noticia('💬 '+p.nome+' cobrou a promessa de titularidade que não veio. O vestiário ouviu.');
  }
  return quebradas;
}
/* A cobrança que rende: enquanto durar, ele evolui mais. Lido por clock.js. */
function estaCobrado(p){
  if(!p||!p.cobrado)return false;
  const dentro=(G.ano<p.cobrado.ano)||(G.ano===p.cobrado.ano&&G.semana<p.cobrado.ate);
  if(!dentro){delete p.cobrado;return false;}
  return true;
}
