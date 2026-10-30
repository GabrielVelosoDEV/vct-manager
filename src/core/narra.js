/* ============================================================
   NARRAÇÃO DE ROUND
   ------------------------------------------------------------
   Transforma o registro cru de um round numa frase, e diz o
   quanto aquele round PESA. O peso é o que dá ritmo à tela ao
   vivo: round comum passa rápido, match point respira.

   Fica no core, sem DOM, por dois motivos: dá para testar a
   frase, e a mesma narração serve para a tela ao vivo e para o
   resumo escrito da partida.
   ============================================================ */

/* Peso de 0 a 1. É o que a tela usa para decidir quanto tempo segurar. */
function pesoDoRound(h,ctx){
  let p=0.25;
  if(h.pistol)p+=0.30;
  const a=h.sa,b=h.sb;
  const meu=ctx.souA?a:b, dele=ctx.souA?b:a;
  /* match point dos dois lados, e a virada no fio */
  if(meu>=12||dele>=12)p+=0.30;
  if(Math.abs(a-b)<=1&&(a+b)>=16)p+=0.20;
  if(h.clutch)p+=0.35;
  if(h.sobrou===0)p+=0.10;          /* round trocado inteiro */
  if(h.r===13)p+=0.15;              /* troca de lado */
  if(h.r>24)p+=0.30;                /* prorrogação */
  if(ctx.streak>=4)p+=0.20;         /* sequência longa */
  if(ctx.ultimo)p+=0.35;            /* o round que fecha o mapa segura mais */
  return clamp(p,0,1);
}

/* Nome curto para caber na linha. */
function _nn(id){const p=G.jogadores[id];return p?p.nome:'—';}

/* A frase. Varia com o que de fato aconteceu, e nunca afirma o que o registro
   não guarda — se não houve primeira morte registrada, a frase não inventa uma. */
/* Escolha determinística de variante. NÃO usa rnd(): o gerador é o do motor,
   semeado, e chamá-lo daqui adiantaria o fluxo e mudaria a simulação seguinte.
   Uma narração cosmética não pode alterar o jogo. */
function _variante(lista,semente){
  return lista[Math.abs(semente)%lista.length];
}
function narrarRound(h,ctx){
  const vencedorMeu=ctx.souA?h.v:!h.v;
  const nomeV=vencedorMeu?ctx.meuTag:ctx.advTag;
  const lado=(ctx.souA?h.lado:(h.lado==='atk'?'def':'atk'));
  const partes=[];
  const sem=h.r*7+h.sa*3+h.sb;

  if(h.pistol)partes.push('Pistol');
  else if(h.r===13)partes.push('Troca de lado');
  else if(h.r===25)partes.push('Prorrogação');

  /* A abertura vem primeiro quando existe: um nome próprio prende muito mais
     que "round do SEN", e antes ela era engolida pelos casos genéricos. */
  const abertura=h.fk?_nn(h.fk)+' abriu em cima de '+_nn(h.fd):'';
  const placarNome=nomeV;

  if(h.clutch){
    partes.push(_variante([
      _nn(h.clutch)+' segurou sozinho — round do '+placarNome,
      _nn(h.clutch)+' resolveu em desvantagem para o '+placarNome,
      'Clutch de '+_nn(h.clutch)+', '+placarNome+' rouba o round'],sem));
  }else if(abertura&&h.sobrou>=4){
    partes.push(abertura+' e o '+placarNome+' passou limpo');
  }else if(abertura&&h.sobrou===0){
    partes.push(abertura+', mas o round foi trocado inteiro — '+placarNome);
  }else if(abertura){
    partes.push(abertura+' · round do '+placarNome);
  }else if(h.sobrou>=4){
    partes.push(_variante([
      placarNome+' passou sem perder ninguém',
      placarNome+' fechou sem baixas',
      'Round limpo do '+placarNome],sem));
  }else if(h.sobrou===0){
    partes.push(placarNome+' vence trocando o round inteiro');
  }else{
    partes.push(_variante([
      'Round do '+placarNome,
      placarNome+' leva',
      placarNome+' converte'],sem));
  }

  const ecoPerdedor=vencedorMeu?(ctx.souA?h.ecoB:h.ecoA):(ctx.souA?h.ecoA:h.ecoB);
  if(!h.pistol&&ecoPerdedor===0)partes.push('em eco');
  if(!h.pistol&&ctx.streak>=4)partes.push(ctx.streak+' seguidos');

  const meu=ctx.souA?h.sa:h.sb, dele=ctx.souA?h.sb:h.sa;
  /* Chegar a 13 NÃO encerra o mapa: com um round de diferença o jogo segue, e
     em prorrogação o placar passa de 13. Quem sabe que acabou é a posição na
     lista, não o número — anunciar por número dava "mapa deles" no 12–13 e o
     mapa continuava até 14. */
  if(ctx.ultimo)partes.push(meu>dele?'MAPA SEU':'mapa deles');
  else if(meu>=12&&dele>=12)partes.push(meu+'–'+dele);
  else if(meu>=12)partes.push('match point');
  else if(dele>=12)partes.push('match point contra');

  return{texto:partes.join(' · '),meu:vencedorMeu,lado,
         placar:{meu,dele},peso:pesoDoRound(h,ctx)};
}

/* Percorre o mapa inteiro e devolve a sequência já narrada, com o contexto
   acumulado (sequências de vitória) que a frase sozinha não teria. */
function narrarMapa(mapa,souA,meuTag,advTag){
  const out=[];let streak=0,ultimo=null;
  const lista=mapa.hist||[];
  lista.forEach((h,i)=>{
    const vencedorMeu=souA?h.v:!h.v;
    if(ultimo===vencedorMeu)streak++;else streak=1;
    ultimo=vencedorMeu;
    out.push(narrarRound(h,{souA,meuTag,advTag,streak,ultimo:i===lista.length-1}));
  });
  return out;
}

/* Frase de fechamento do mapa, para a tela não terminar no vazio. */
function narrarFimDeMapa(mapa,souA,meuTag,advTag){
  const meu=souA?mapa.sa:mapa.sb, dele=souA?mapa.sb:mapa.sa;
  const dif=meu-dele;
  if(dif>0){
    if(dif>=9)return{texto:meuTag+' atropelou em '+mapa.mapa+', '+meu+'–'+dele,tom:'bom'};
    if(dif<=2)return{texto:meuTag+' sobreviveu em '+mapa.mapa+', '+meu+'–'+dele,tom:'bom'};
    return{texto:meuTag+' fechou '+mapa.mapa+' em '+meu+'–'+dele,tom:'bom'};
  }
  if(dif===0)return{texto:'Empate técnico em '+mapa.mapa,tom:'neutro'};
  if(dif<=-9)return{texto:advTag+' atropelou em '+mapa.mapa+', '+dele+'–'+meu,tom:'ruim'};
  if(dif>=-2)return{texto:'Escapou por pouco: '+advTag+' leva '+mapa.mapa+' por '+dele+'–'+meu,tom:'ruim'};
  return{texto:advTag+' leva '+mapa.mapa+' em '+dele+'–'+meu,tom:'ruim'};
}
