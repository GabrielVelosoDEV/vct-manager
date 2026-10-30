/* ============================================================
   VETO INTERATIVO
   ------------------------------------------------------------
   O ritual do Valorant: dois bans, os picks, e o decider que
   ninguém quis vetar. Antes isso acontecia dentro do motor e
   você só via o resultado; agora, na SUA partida, a vez é sua.

   Duas regras que valem a pena guardar:

   1. A vez da máquina NÃO SORTEIA. O veto acontece a partir de
      um clique na tela, e o gerador semeado do motor é do motor:
      se cada clique consumisse sorteio, a mesma run daria mundos
      diferentes conforme você clicasse rápido ou devagar. A IA
      aqui usa gostaDeMapa(), que é leitura pura — e é a mesma
      conta que o relatório de scouting nível 5 te mostra. Isso é
      de propósito: pagar analista é o que te deixa prever.

   2. O estado é um objeto simples e o resultado sai no MESMO
      formato do veto automático ({seq,mapas}), então o motor não
      sabe nem precisa saber se quem escolheu foi você.
   ============================================================ */

function iniciarVeto(meuId,advId,bo,euComeco){
  const pool=(G.mapasAtivos||MAP_POOL).slice();
  return{
    meuId,advId,bo:bo||3,
    /* lado 0 é quem abre o veto. Em torneio quem abre é o cabeça de chave;
       aqui é quem está listado primeiro, igual ao veto automático. */
    euSouLado:euComeco?0:1,
    pool, passos:roteiroVeto(bo||3,pool.length),
    i:0, seq:[], fim:false
  };
}
function vetoPasso(V){return V&&!V.fim?V.passos[V.i]:null;}
function vetoMinhaVez(V){
  const p=vetoPasso(V);
  return !!p&&p.tipo!=='dec'&&p.lado===V.euSouLado;
}
function vetoRestantes(V){
  const usados=new Set(V.seq.map(x=>x.m));
  return V.pool.filter(m=>!usados.has(m));
}
/* O mapa que a máquina escolheria agora. Leitura pura, sem sorteio. */
function vetoEscolhaIA(V){
  const p=vetoPasso(V);
  if(!p)return null;
  const t=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
  const restam=vetoRestantes(V);
  if(!restam.length)return null;
  const ord=restam.slice().sort((a,b)=>gostaDeMapa(t,b)-gostaDeMapa(t,a));
  return p.tipo==='ban'?ord[ord.length-1]:ord[0];
}
/* Aplica uma escolha. Devolve o que aconteceu, para a tela narrar. */
function vetoEscolher(V,mapa){
  const p=vetoPasso(V);
  if(!p||V.fim)return null;
  const restam=vetoRestantes(V);
  if(p.tipo==='dec'){
    const m=restam[0];
    V.seq.push({m,tipo:'dec',t:'—'});
    V.i++;V.fim=true;
    return{m,tipo:'dec'};
  }
  const m=(mapa&&restam.includes(mapa))?mapa:vetoEscolhaIA(V);
  if(!m)return null;
  const dono=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
  V.seq.push({m,tipo:p.tipo,t:dono.tag,meu:p.lado===V.euSouLado});
  V.i++;
  if(V.i>=V.passos.length)V.fim=true;
  return{m,tipo:p.tipo,meu:p.lado===V.euSouLado};
}
/* Resolve tudo o que não é seu até chegar a sua vez (ou ao fim). */
function vetoAvancarAteMim(V){
  let voltas=0;
  while(!V.fim&&!vetoMinhaVez(V)&&voltas++<40)vetoEscolher(V,null);
  return V;
}
/* No formato que simPartida consome. */
function vetoResultado(V){
  return{seq:V.seq,mapas:V.seq.filter(x=>x.tipo!=='ban').map(x=>x.m)};
}
/* Um veto inteiro resolvido pela máquina, sem sorteio — usado quando você
   desliga o veto manual e quando o teste precisa de um veto reprodutível. */
function vetoAutomatico(meuId,advId,bo,euComeco){
  const V=iniciarVeto(meuId,advId,bo,euComeco);
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  return vetoResultado(V);
}
