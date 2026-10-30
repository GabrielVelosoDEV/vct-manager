/* ============================================================
   MERCADO DE AGENTES LIVRES
   ------------------------------------------------------------
   O que decide se um jogador aceita mudar de clube mora em
   core/transferencia.js, e vale igual para você e para a IA.
   Aqui ficou só o preenchimento de elenco a partir de quem
   está sem contrato.
   ============================================================ */
function mercadoIA(){
  const times=Object.values(G.times).sort((a,b)=>b.prestigio-a.prestigio);
  for(const t of times){
    if(t.id===G.meuTime)continue;
    /* Dois tetos, e os dois precisam ser respeitados. O caixa diz o que o
       clube tem hoje; a folga salarial diz o que a receita sustenta todo mês.
       Só o caixa era conferido — por isso um clube com dinheiro no banco e
       nenhuma folga na receita continuava assinando, e a folha do Challengers
       chegava a 100% da receita. O elenco mínimo continua garantido depois,
       por garantirElencos(): pôr cinco em quadra vem antes do orçamento. */
    while(t.elenco.length<7&&G.livres.length){
      const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
      const folga=folgaSalarial(t);
      if(folga<=0)break;
      const teto=Math.min(Math.max(60000,t.caixa*.35),folga*12);
      const alvo=G.livres.map(i=>G.jogadores[i])
        .filter(p=>p.role===falta||p.role==='Flex')
        .sort((a,b)=>over(b)-over(a))
        .find(p=>salario(p)*12<teto&&Math.abs(over(p)-t.prestigio)<16);
      const esc=alvo
        ||G.livres.map(i=>G.jogadores[i]).sort((a,b)=>over(b)-over(a)).find(p=>salario(p)*12<teto)
        ||G.livres.map(i=>G.jogadores[i]).sort((a,b)=>salario(a)-salario(b))
            .find(p=>salario(p)*12<teto);
      if(!esc)break;
      contratar(esc,t,ri(1,3),salario(esc));
    }
    /* Reforço: trocar o pior titular. Antes era um dado de 30% e pronto, o que
       deixava clube rico sentado em cima de meio milhão de folga enquanto o
       mercado ficava entupido de jogador bom sem clube. Agora quem tem folga
       larga tenta sempre — é o que um clube com dinheiro faz, e é o que faz o
       dinheiro ganho vencendo virar elenco em vez de saldo parado. */
    const folgaLarga=folgaSalarial(t)*12>receitaLivre(t)*0.25;
    if((folgaLarga||rnd()<.30)&&t.elenco.length<9){
      const pior=t.titulares.map(i=>G.jogadores[i]).sort((a,b)=>over(a)-over(b))[0];
      if(!pior)continue;
      const tetoR=Math.min(t.caixa*.4,folgaSalarial(t)*12);
      const alvo=G.livres.map(i=>G.jogadores[i]).filter(p=>over(p)>over(pior)+3&&salario(p)*12<tetoR)
        .sort((a,b)=>over(b)-over(a))[0];
      if(alvo)contratar(alvo,t,ri(2,3),salario(alvo));
    }
    autoEscalar(t);
  }
  garantirElencos();
}

/* Rede de segurança do mercado.

   `mercadoIA` só sabe contratar de `G.livres`; quando o mercado secava, o
   laço saía sem preencher e o clube ficava com quatro jogadores para sempre —
   não havia nada que o trouxesse de volta. Agora o elenco mínimo é garantido
   por construção: se não há ninguém disponível, o clube promove alguém da
   base. É o que um clube de verdade faria, e transforma "elenco entre 5 e 9"
   de torcida em invariante. */
const ELENCO_MIN=5, ELENCO_MAX=9;
/* Idade de todo jogador que o jogo GERA depois do mundo pronto: 15 ou 16.
   Quem entra, entra pela base — não aparece pronto. Vale para a promessa da
   academia, para o sangue novo do mercado e para a promoção de emergência. */
const IDADE_NOVO_MIN=15, IDADE_NOVO_MAX=16;
function garantirElencos(){
  for(const id in G.times)reporElenco(G.times[id]);
}
/* Reposição de UM clube. Vive separada porque não é só rede de fim de
   temporada: é o que o clube faz no instante em que perde um jogador. Vender
   e ficar com quatro em quadra não é uma possibilidade que o jogo deva
   oferecer a ninguém, nem à IA nem a você. */
function reporElenco(t){
  if(!t)return 0;
  if(t._repondo)return 0;          /* reporElenco chama contratar, que chama reporElenco */
  t._repondo=true;
  try{
    const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
    let emergencias=0;
    while(t.elenco.length<ELENCO_MIN){
      /* Primeiro o melhor que CABE no orçamento. Se nada couber, o MAIS
         BARATO — não o melhor. Pegar sempre o melhor da lista era o que
         devolvia ao clube endividado o mesmo salário que ele acabara de
         cortar: o clube demitia o jogador de 108k, ele caía no mercado como o
         melhor livre disponível, e no minuto seguinte o mesmo clube o
         recontratava. O buraco nunca fechava. Cinco em quadra continua vindo
         antes do orçamento — o que muda é quem entra. */
      const disp=G.livres.map(i=>G.jogadores[i]).filter(Boolean)
        .sort((a,b)=>over(b)-over(a));
      const teto=folgaSalarial(t)*12;
      const livre=disp.find(p=>salario(p)*12<=teto)
        ||disp.slice().sort((a,b)=>salario(a)-salario(b))[0];
      if(livre){contratar(livre,t,ri(1,2),salario(livre));continue;}
      const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
      const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
      const[piso]=FAIXAS.jogador[t.tier];
      const p=makePlayer(clamp(piso-8+ri(0,6),FAIXAS.jogador[2][0]-14,piso),
                         falta,pick(R.paises),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
      p.contrato=2;p.salario=salario(p);p.valor=valor(p);
      p.timeId=t.id;G.jogadores[p.id]=p;t.elenco.push(p.id);
      emergencias++;
      if(emergencias>6)break;   /* cinto de segurança contra laço infinito */
    }
    if(emergencias&&t.id===G.meuTime)
      noticia('⚠ Sem opção no mercado: '+emergencias+' jogador(es) promovido(s) da base às pressas.');
    autoEscalar(t);
    return emergencias;
  }finally{ delete t._repondo; }
}
