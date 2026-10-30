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
    pool, passos:comLados(roteiroVeto(bo||3,pool.length)),
    i:0, seq:[], fim:false
  };
}
/* ---------- lado de início ----------
   No circuito quem escolhe o mapa não escolhe o lado: o outro time decide se
   começa atacando ou defendendo. No decider, escolhe quem NÃO fez o último
   ban. O passo de lado entra logo depois do mapa a que ele se refere, e o
   lado fica gravado no próprio mapa da sequência (lado0 = lado de início de
   quem abriu o veto, que é o time A da série). */
function comLados(passos){
  const out=[];
  let ultimoBan=0;
  for(const p of passos){
    out.push(p);
    if(p.tipo==='ban')ultimoBan=p.lado;
    if(p.tipo==='pick')out.push({tipo:'lado',lado:1-p.lado});
    if(p.tipo==='dec')out.push({tipo:'lado',lado:1-ultimoBan});
  }
  return out;
}
const outroLado=l=>l==='atk'?'def':'atk';
/* O lado em que o clube prefere começar: o mais forte dele naquele mapa. Lê
   forcaTime, que não sorteia. */
function ladoPreferido(t,mapa){
  if(!t||typeof forcaTime!=='function')return 'def';
  return forcaTime(t,mapa,'atk')>forcaTime(t,mapa,'def')?'atk':'def';
}
/* O mapa cujo lado está sendo decidido: o último que não foi banido. */
function vetoMapaDoLado(V){
  for(let i=V.seq.length-1;i>=0;i--)if(V.seq[i].tipo!=='ban')return V.seq[i];
  return null;
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
  if(p.tipo==='lado'){const x=vetoMapaDoLado(V);return x?ladoPreferido(t,x.m):'def';}
  const restam=vetoRestantes(V);
  if(!restam.length)return null;
  const ord=restam.slice().sort((a,b)=>gostaDeMapa(t,b)-gostaDeMapa(t,a));
  return p.tipo==='ban'?ord[ord.length-1]:ord[0];
}
/* Aplica uma escolha. Devolve o que aconteceu, para a tela narrar. */
function vetoEscolher(V,mapa){
  const p=vetoPasso(V);
  if(!p||V.fim)return null;
  if(p.tipo==='lado'){
    const x=vetoMapaDoLado(V);
    const escolha=(mapa==='atk'||mapa==='def')?mapa:vetoEscolhaIA(V);
    const dono=G.times[p.lado===V.euSouLado?V.meuId:V.advId];
    if(x){x.lado0=p.lado===0?escolha:outroLado(escolha);x.ladoPor=dono.tag;}
    V.i++;
    if(V.i>=V.passos.length)V.fim=true;
    return{m:x&&x.m,tipo:'lado',lado:escolha,meu:p.lado===V.euSouLado};
  }
  const restam=vetoRestantes(V);
  if(p.tipo==='dec'){
    const m=restam[0];
    V.seq.push({m,tipo:'dec',t:'—'});
    V.i++;
    if(V.i>=V.passos.length)V.fim=true;
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
  const jogados=V.seq.filter(x=>x.tipo!=='ban');
  return{seq:V.seq,mapas:jogados.map(x=>x.m),lados:jogados.map(x=>x.lado0||null)};
}
/* Um veto inteiro resolvido pela máquina, sem sorteio — usado quando você
   desliga o veto manual e quando o teste precisa de um veto reprodutível. */
function vetoAutomatico(meuId,advId,bo,euComeco){
  const V=iniciarVeto(meuId,advId,bo,euComeco);
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  return vetoResultado(V);
}
