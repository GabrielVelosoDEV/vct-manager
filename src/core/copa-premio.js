/* ============================================================
   VALORANT WORLD CUP — A PREMIAÇÃO (C8)
   ------------------------------------------------------------
   A maior premiação do jogo: o campeão do mundo leva uma vez e meia
   o prêmio do campeão do Champions (que é editável no Banco de dados:
   a conta acompanha, então a Copa segue sendo a maior). Vice e
   terceiro seguem a curva do Champions.

   O dinheiro de cada seleção do pódio é dividido assim:
     jogadores   a maior parte, entre os 10 convocados — titular leva
                 duas cotas, reserva uma
     comissão    técnico e analista da seleção
     clubes      o clube de cada convocado, pelas mesmas cotas:
                 quem cedeu o jogador recebe junto
     cena local  só no título: os clubes do país campeão, que formaram
                 essa geração (clube da elite pesa o dobro)

   Além do pódio, todo clube com jogador na Copa recebe um bônus por
   convocado, pago no fim dela.

   O que é de clube entra no caixa e na premiação do ano (Finanças);
   o que é de jogador vira bônus — no modo jogador, a sua cota cai na
   sua conta.
   ============================================================ */
const COPA_PREMIO_FATOR=1.5;               /* × o prêmio do campeão do Champions */
const COPA_CURVA_PODIO=[1,.52,.30];
const COPA_DIVISAO={
  campeao:{jogadores:.55,comissao:.15,clubes:.18,cena:.12},
  podio  :{jogadores:.62,comissao:.15,clubes:.23,cena:0}
};
const COPA_BONUS_CONVOCADO=12000;          /* por jogador cedido, ao clube dele */

function premioCampeaoCopa(){
  const ch=G.torneios&&G.torneios.champions&&G.torneios.champions.premio;
  return Math.round((ch||PREMIO_BASE)*COPA_PREMIO_FATOR/1000)*1000;
}
function premiosDaCopa(){return COPA_CURVA_PODIO.map(f=>Math.round(premioCampeaoCopa()*f/1000)*1000);}

function _creditarClube(t,v){
  if(!t||!v)return;
  t.caixa+=v;
  if(!t.premiosAno||t.premiosAno.ano!==G.ano)t.premiosAno={ano:G.ano,v:0};
  t.premiosAno.v+=v;
}
/* clubes do país campeão: os da elite valem dois pesos, os do Challengers um.
   Sem clube com sede no país, vale onde os jogadores do país jogam. */
function _cenaLocal(pais){
  const l=Object.values(G.times||{}).filter(t=>t&&t.pais===pais&&!String(t.id).startsWith('SEL-'));
  if(l.length)return l.map(t=>({t,peso:t.tier===1?2:1}));
  const conta={};
  for(const p of Object.values(G.jogadores))if(p.pais===pais&&p.timeId&&G.times[p.timeId])conta[p.timeId]=(conta[p.timeId]||0)+1;
  return Object.entries(conta).map(([id,n])=>({t:G.times[id],peso:n}));
}

/* paga o pódio e o bônus dos convocados; devolve o resumo para a edição */
function pagarPremiosDaCopa(cic,podio){
  const C=cic.copa, valores=premiosDaCopa(), resumo={total:0,podio:{},bonus:{}};
  const porClube={};          /* para uma notícia só por clube */
  const somar=(tid,k,v)=>{if(!tid||!v)return;const x=porClube[tid]=porClube[tid]||{bonus:0,premio:0,cena:0,n:0};x[k]+=v;};
  podio.slice(0,3).forEach((pais,i)=>{
    const cv=C.convocados&&C.convocados[pais];if(!cv)return;
    const v=valores[i], d=i===0?COPA_DIVISAO.campeao:COPA_DIVISAO.podio;
    const ids=cv.titulares.concat(cv.reservas).filter(id=>G.jogadores[id]);
    const cota=id=>cv.titulares.includes(id)?2:1, cotas=ids.reduce((s,id)=>s+cota(id),0)||1;
    const r={total:v,jogadores:Math.round(v*d.jogadores),comissao:Math.round(v*d.comissao),
      clubes:Math.round(v*d.clubes),cena:Math.round(v*d.cena),porJogador:{}};
    for(const id of ids){
      const p=G.jogadores[id], parte=Math.round(r.jogadores*cota(id)/cotas);
      r.porJogador[id]=parte;
      p.moral=clamp((p.moral||0.6)+(i===0?0.08:0.04),.05,1);
      if(p.voce&&typeof lancar==='function')lancar(parte,`Premiação da World Cup ${cic.ano} · ${['campeão','vice','bronze'][i]}`,'premio');
      const t=p.timeId&&G.times[p.timeId];
      if(t){const c=Math.round(r.clubes*cota(id)/cotas);_creditarClube(t,c);somar(t.id,'premio',c);}
    }
    if(r.cena){
      const l=_cenaLocal(pais), soma=l.reduce((s,x)=>s+x.peso,0)||1;
      r.cenaClubes=l.length;
      for(const x of l){const c=Math.round(r.cena*x.peso/soma);_creditarClube(x.t,c);somar(x.t.id,'cena',c);}
    }
    resumo.podio[pais]=r;resumo.total+=v;
  });
  /* o bônus de quem cedeu jogador */
  for(const pais in C.convocados||{}){
    const cv=C.convocados[pais];
    for(const id of cv.titulares.concat(cv.reservas)){
      const p=G.jogadores[id], t=p&&p.timeId&&G.times[p.timeId];if(!t)continue;
      _creditarClube(t,COPA_BONUS_CONVOCADO);somar(t.id,'bonus',COPA_BONUS_CONVOCADO);porClube[t.id].n++;
      resumo.bonus[t.id]=(resumo.bonus[t.id]||0)+COPA_BONUS_CONVOCADO;resumo.total+=COPA_BONUS_CONVOCADO;
    }
  }
  /* as notícias: a premiação, e o que entrou no seu clube */
  const [v1,v2,v3]=valores;
  noticia(`💰 Premiação da World Cup ${cic.ano}: ${money(v1)} para ${_nomeSel(podio[0])}, ${money(v2)} para ${_nomeSel(podio[1])} e ${money(v3)} para ${_nomeSel(podio[2])} — a maior bolada do Valorant. Jogadores e comissão ficam com a maior parte; os clubes de cada convocado recebem junto, e os clubes ${_doPais(podio[0])} dividem ${money(resumo.podio[podio[0]]?resumo.podio[podio[0]].cena:0)} pela cena que formou os campeões.`,
    {c:'competicoes',imp:2});
  const meu=typeof clubeDoUsuario==='function'?clubeDoUsuario():G.meuTime;
  const x=meu&&porClube[meu];
  if(x&&!G.voce){
    const partes=[x.n?`${money(x.bonus)} de bônus por ${x.n} convocado${x.n>1?'s':''}`:'',
      x.premio?`${money(x.premio)} da premiação do pódio`:'',x.cena?`${money(x.cena)} pela cena local campeã`:''].filter(Boolean);
    noticia(`🌍 A World Cup ${cic.ano} rendeu ${money(x.bonus+x.premio+x.cena)} ao clube: ${partes.join(', ')}.`,{c:'clube',t:[meu],imp:2});
  }
  /* técnico da seleção no pódio */
  const eu=typeof selecaoDoTecnico==='function'?selecaoDoTecnico():null;
  if(eu&&resumo.podio[eu])noticia(`A comissão de ${_nomeSel(eu)} recebe ${money(resumo.podio[eu].comissao)} da premiação da World Cup.`,{c:'clube',imp:2});
  return resumo;
}
/* "do Brasil", "da Coreia do Sul", "dos Estados Unidos" — o suficiente para a notícia */
function _doPais(pais){
  const n=_nomeSel(pais);
  if(/^(Estados Unidos|Países Baixos|Emirados)/.test(n))return 'dos '+n;
  if(/^(Filipinas)/.test(n))return 'das '+n;
  const fem=/^(Arábia|Argentina|Austrália|Alemanha|China|Colômbia|Coreia|Dinamarca|Espanha|Finlândia|França|Geórgia|Índia|Indonésia|Inglaterra|Itália|Lituânia|Malásia|Polônia|Romênia|Rússia|Suécia|Tailândia|Turquia|Ucrânia|República)/.test(n);
  const sem=/^(Taiwan|Hong Kong|El Salvador|Portugal|Singapura|Israel)/.test(n);
  return sem?'de '+n:(fem?'da ':'do ')+n;
}
