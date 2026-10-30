/* ============================================================
   FIM DE TEMPORADA
   ============================================================ */
/* Quem para de jogar, e quando.

   Idade sozinha não explica: um atleta de e-sports PODE jogar até os 35–40, e
   é isso que a curva etária permite. O que encerra a maioria das carreiras
   antes disso é o rendimento — quem caiu muito do próprio pico não encontra
   mais clube e pendura o mouse.

   Foi a peça que faltava na primeira tentativa: só esticando a idade, metade
   dos titulares do circuito passou dos 30 e os garotos não achavam vaga.
   Somando o declínio, a carreira longa continua possível para quem se mantém
   bom, e quem cai sai — que é como o esporte funciona. */
const APOS_IDADE=[[42,1],[39,.34],[36,.16],[33,.06],[30,.02]];
/* Renovação com o teto de folha na frente.

   Antes o clube renovava de olhos fechados pelo salário de mercado. Como o
   jogador evolui todo ano, o salário de mercado sobe todo ano, e a folha
   subia junto sem ninguém conferir: em dez temporadas o Challengers inteiro
   estava com 100% da receita comprometida em salário e sangrando. O clube
   agora só renova o que cabe; o que não cabe vai para o mercado, que é onde
   um clube que PODE pagar vai buscá-lo — é assim que o jogador bom sobe de
   divisão em vez de apodrecer num clube que não o sustenta. */
function renovarSePuder(p){
  const t=G.times[p.timeId];
  if(!t){liberar(p);return false;}
  const novo=salario(p);
  const depois=folhaAnual(t)-(p.salario||0)*12+novo*12;
  const teto=receitaLivre(t)*tetoFolhaDe(t);
  if(depois>teto&&t.elenco.length>5){liberar(p);return false;}
  p.contrato=ri(2,3);p.salario=novo;
  return true;
}

/* Corte de folha fora da renovação.

   Renovar com o teto na frente resolve o contrato que vence, mas não o clube
   que perdeu receita no meio do caminho — caiu de divisão, esvaziou a torcida,
   perdeu o patrocinador — e ficou com uma folha que era compatível com o
   orçamento do ano passado. Sem esta passagem ele só tinha um caminho: sangrar
   até o caixa virar negativo. Aqui ele corta o mais caro do banco, que é o que
   uma diretoria faz de verdade, e o jogador cai no mercado inteiro.

   O banco sai primeiro. Se mesmo com cinco a folha não fecha — clube que caiu
   de divisão e ficou com um salário de elite no elenco —, o titular mais caro
   também sai: garantirElencos() repõe logo depois com quem cabe no orçamento,
   nem que seja um moleque da base. Sem essa saída o clube ficava preso a um
   contrato que não podia pagar e sangrava até o caixa virar negativo, que é o
   único jeito de um clube quebrar aqui. Nunca toca no clube do jogador —
   quem manda no dinheiro dele é ele. */
function ajustarFolha(){
  let cortes=0;
  for(const id in G.times){
    if(id===G.meuTime)continue;
    const t=G.times[id];
    let guarda=0;
    while(t.elenco.length>4&&folhaAnual(t)>receitaLivre(t)*tetoFolhaDe(t)&&guarda++<8){
      const banco=t.elenco.map(i=>G.jogadores[i])
        .filter(p=>p&&!(t.titulares||[]).includes(p.id));
      const alvo=(banco.length?banco:t.elenco.map(i=>G.jogadores[i]).filter(Boolean))
        .sort((a,b)=>b.salario-a.salario)[0];
      if(!alvo)break;
      liberar(alvo);cortes++;
    }
  }
  return cortes;
}

function chanceAposentadoria(p){
  let c=0;
  for(const[idade,ch]of APOS_IDADE)if(p.idade>=idade){c=ch;break;}
  /* O declínio só pesa quando já faz sentido pesar. Sem esta rampa, um jogador
     de 28 anos que perdeu cinco pontos de over pendurava o mouse — e a mediana
     de carreira caía para 33, longe dos 35 a 40 que era o alvo. */
  const peso=clamp((p.idade-29)/8,0,1);         /* 0 aos 29, cheio aos 37 */
  if(peso<=0)return c;
  const queda=Math.max(0,(p.pico||over(p))-over(p));
  c+=queda*0.035*peso;                          /* 10 pontos abaixo do pico: até +35% */
  if(!p.timeId)c+=0.20*peso;                    /* sem clube, o convite não vem */
  return clamp(c,0,1);
}

function fimDeTemporada(){
  /* PRIMEIRA coisa da virada: quem estava emprestado volta para o dono.

     O empréstimo dá ao jogador um contrato de um ano com o clube que o tomou.
     Se a rotina de contratos rodasse antes, esse um ano vencia, o clube não
     renovava, e o jogador — que continuava sendo de outro clube, com anos de
     contrato pelo meio — caía no mercado como agente livre. O dono perdia um
     titular de graça sem nunca ser avisado. Devolver antes de qualquer conta
     é o que faz o contrato de verdade dele voltar a valer. */
  if(typeof resolverEmprestimos==='function')resolverEmprestimos();
  const usados=new Set(Object.values(G.jogadores).map(p=>p.nome));
  let aposentados=0;
  // aposentadorias e contratos
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    p.hist.push({ano:G.ano,time:p.timeId?G.times[p.timeId].nome:'Sem clube',over:over(p),...p.temp});
    p.temp=novaTemp();p.idade++;p.contrato=Math.max(0,p.contrato-1);
    const chanceApos=chanceAposentadoria(p);
    if(rnd()<chanceApos){
      if(p.timeId)noticia('👋 '+p.nome+' anunciou aposentadoria aos '+p.idade+' anos.');
      if(p.timeId){const t=G.times[p.timeId];t.elenco=t.elenco.filter(x=>x!==p.id);t.titulares=t.titulares.filter(x=>x!==p.id);}
      G.livres=G.livres.filter(x=>x!==p.id);
      if(typeof esquecerJogador==='function')esquecerJogador(p.id);
      delete G.jogadores[id];aposentados++;continue;
    }
    if(p.contrato===0&&p.timeId){
      if(p.timeId===G.meuTime){noticia('📄 '+p.nome+' deixou o clube: contrato encerrado.');liberar(p);}
      else if(rnd()<.82)renovarSePuder(p);
      else liberar(p);
    }
    p.fadiga=0;p.forma=clamp(gauss(.6,.12),.3,.9);
    p.valor=valor(p);
  }
  // promessas da base
  let promessas=0;
  for(const tid in G.times){
    const t=G.times[tid];
    /* Olheiro entra como multiplicador, neutro em NIVEL_NEUTRO como todo o
       resto. Ancorado no 3 antigo, a base do Challengers rendia menos que a
       de qualquer clube de Tier 1 mesmo com o melhor olheiro da divisão — a
       única fábrica de talento que o Tier 2 tem, penalizada por definição. */
    const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
    const olh=(t.staff&&t.staff.olheiro)||neutro;
    /* Clube com o elenco mínimo em pé NÃO fabrica jogador. A base subia
       promessa para qualquer clube com menos de nove, e o mundo enchia de
       gente gerada que ninguém pediu — elenco de oito, nove, todos
       inventados. Agora a fábrica só liga quando falta gente para jogar. */
    if((t.elenco||[]).length>=ELENCO_MIN)continue;
    const n=(rnd()<t.estrutura.academia*0.16*(1-neutro*0.05+olh*0.05))?1:0;
    if(!n)continue;
    const R=REGIONS.find(r=>r.id===t.regiao);
    /* Promessa nasce abaixo do piso da divisão de propósito: é projeto, não
       titular. O potencial é que a torna interessante. */
    const[piso]=FAIXAS.jogador[t.tier];
    const alvo=clamp(Math.round(gauss(piso-10+t.estrutura.academia*2+(olh-3)*2,5)),
                     FAIXAS.jogador[2][0]-14,piso+2);
    const p=makePlayer(alvo,pick(ROLES),pick(R.paises),ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),usados,t.tier);
    p.pot=clamp(over(p)+ri(10,28)+t.estrutura.academia*2,over(p)+8,99);
    p.salario=salario(p);p.contrato=3;
    G.jogadores[p.id]=p;promessas++;
    if(t.elenco.length<9){p.timeId=t.id;t.elenco.push(p.id);
      if(t.id===G.meuTime)noticia('⭐ Promessa da base promovida: '+p.nome+' ('+p.role+', pot. '+p.pot+').');}
    else{p.timeId=null;G.livres.push(p.id);}
  }
  /* Novos nomes no mercado.

     Eram 12 fixos por temporada, contra 40 a 60 aposentadorias. O saldo
     negativo esvaziava o mercado devagar e, por volta da décima quinta
     temporada, os clubes não conseguiam mais repor: apareciam times de Tier 1
     com um jogador só. A oferta agora acompanha a demanda, com um piso para o
     mercado nunca ficar sem opção nenhuma. */
  const novos=Math.max(14,aposentados-promessas+6);
  for(let i=0;i<novos;i++){
    const R=pick(REGIONS);
    /* Sangue novo entra pela base, na idade da base. Antes entrava pronto,
       entre 17 e 27, e o mercado se renovava com estranhos de 25 anos que
       apareciam do nada. */
    const idade=ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX);
    const p=makePlayer(overAlvo('jogador',rnd()<0.25?1:2,ri(45,66),4),
                       pick(ROLES),pick(R.paises),idade,usados,2);
    p.contrato=0;G.jogadores[p.id]=p;G.livres.push(p.id);
  }
  evoluirStaff();
  mercadoStaffIA();
  /* Corte antes de qualquer contratação: quem está acima do teto tem de
     desovar primeiro, senão entra no mercado comprando o que não sustenta. */
  ajustarFolha();
  /* Obra depois: o dinheiro que virou estrutura não está mais disponível para
     folha, e a obra só passa se a operação a sustentar. */
  if(typeof investimentoIA==='function')investimentoIA();
  /* transferências entre clubes ANTES do preenchimento por agente livre: quem
     tem dinheiro tenta o reforço bom primeiro e só depois sobra o mercado de
     graça, que é a ordem em que isso acontece de verdade */
  mercadoTransferencias();
  mercadoIA();
  if(G.livres.length>170){
    const ordenados=G.livres.map(i=>G.jogadores[i]).sort((a,b)=>(over(b)+b.pot)-(over(a)+a.pot));
    ordenados.slice(170).forEach(p=>{noticia('');
      if(typeof esquecerJogador==='function')esquecerJogador(p.id);
      delete G.jogadores[p.id];});
    G.noticias=G.noticias.filter(n=>n.txt);
    G.livres=ordenados.slice(0,170).map(p=>p.id);
  }
  const meuT=G.times[G.meuTime];
  if(meuT){
    while(meuT.elenco.length<5&&G.livres.length){
      const alvo=G.livres.map(i=>G.jogadores[i]).sort((a,b)=>over(b)-over(a))
        .find(p=>salario(p)*12<Math.max(0,meuT.caixa)*.5)||G.jogadores[G.livres[G.livres.length-1]];
      contratar(alvo,meuT,2,salario(alvo));
      noticia('⚠ Elenco abaixo do mínimo: a diretoria contratou '+alvo.nome+' em caráter emergencial.');
    }
  }
  /* torcida antes das marcas: é a campanha recém-encerrada que decide quem
     ficou atraente para os patrocinadores desta temporada */
  for(const id in G.times)atualizarTorcida(G.times[id]);
  atribuirPatrocinios();
  /* A campanha só é zerada depois de avaliada: avaliarTemporada() lê
     t.temporada para saber em que posição o clube terminou. */
  if(typeof avaliarTemporada==='function'&&G.manager&&!G.manager.demitido)
    G.vereditoPendente=avaliarTemporada();
  for(const id in G.times){
    const t=G.times[id];
    t.temporada={v:0,d:0,mv:0,md:0,pts:0};
    t.patroc=receitaAnual(t);
    t.sinergia=clamp(t.sinergia+4,0,100);
    for(const m of MAP_POOL)t.mapPref[m]=clamp(Math.round((t.mapPref[m]||0)+gauss(0,2)),-8,8);
    autoEscalar(t);
  }
  /* O pool ativo NÃO é resetado na virada: ele vem da rotação, que acontece
     três vezes por temporada. Zerar aqui apagaria a rotação inteira e devolvia
     os doze mapas, que é o que tirava o sentido de treinar mapa. */
  if(!G.mapasAtivos||!G.mapasAtivos.length)G.mapasAtivos=poolInicial();
  G.ano++;
  /* metas novas para a temporada que começa */
  if(typeof montarMetas==='function'&&G.manager&&!G.manager.demitido)montarMetas();
  montarCalendario();
  G.semana=1;
  noticia('=== Início da temporada '+G.ano+' ===');
}
