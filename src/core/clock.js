/* ============================================================
   AVANÇO DE TEMPO
   ============================================================ */
/* Quantas rodadas ainda faltam num stage. É isso que permite espremer o
   torneio dentro do intervalo dele em vez de deixá-lo vazar para o mês
   seguinte e atropelar o próximo. */
function rodadasRestantes(s){return rodadasDoStage(s);}
/* Ritmo do bloco nesta semana: normalmente uma rodada por semana, que é como
   uma liga funciona. Só acelera quando o que falta não cabe mais no que resta
   de calendário. */
function rodadasPorSemana(b){
  const falta=Math.max(0,...b.stages.map(rodadasRestantes));
  if(!falta)return 0;
  return Math.max(1,Math.ceil(falta/semanasRestantes(G.semana,b.fim)));
}
/* Uma semana. Sempre uma semana — é o que dá ao jogo uma linha do tempo em vez
   de uma sequência de campeonatos. Semana sem jogo não é tempo perdido: o
   elenco treina, quem está lesionado se recupera e as propostas circulam. */
/* O compromisso do seu clube nesta semana, SEM consumir sorteio: a rodada já
   foi montada pelo relógio (s.rodadaAtual), então dá para olhar sem mexer em
   nada. É o que permite a tela abrir o relatório e o veto ANTES de a semana
   ser jogada. Devolve null quando não há jogo seu. */
function compromissoDaSemana(){
  if(!G.meuTime)return null;
  const i=blocoDaSemana(G.semana||1);
  const b=i==null?null:G.calendario[i];
  if(!b)return null;
  for(const s of b.stages){
    if(s.feito)continue;
    const rd=s.rodadaAtual||[];
    const par=rd.find(x=>x.includes(G.meuTime));
    if(!par)continue;
    const bo=((s.tipo==='ko'&&s.vivos.length<=2)||(s.tipo==='de'&&s.faseAtual==='gf'))
      ?Math.max(s.bo,5):s.bo;
    return{stage:s,aId:par[0],bId:par[1],bo,
           advId:par[0]===G.meuTime?par[1]:par[0],
           euSouA:par[0]===G.meuTime};
  }
  return null;
}
/* `plano` é o que VOCÊ decidiu antes de a semana rodar: por enquanto o veto de
   mapa da sua partida. Vem da tela e desce até simPartida por ctx — o motor
   continua dono do sorteio, a tela só entrega escolhas. */
function avancar(plano){
  if(!G.semana)G.semana=1;
  const idx=blocoDaSemana(G.semana);
  const b=idx==null?null:G.calendario[idx];
  if(b){
    G.bloco=idx;
    if(b.montar&&!b._montado){montarBloco(b);b._montado=true;}
    G.fase=b.nome;
  }else{
    G.fase='Intervalo';
  }
  /* a janela segue o calendário (novembro a janeiro, junho e julho), não os torneios */
  G.janela=janelaAberta(G.ano,G.semana);
  if(typeof limparNegociacoes==='function')limparNegociacoes();

  const resultados=[];let minhaPartida=null;
  if(b){
    const passos=rodadasPorSemana(b);
    for(let k=0;k<passos;k++){
      const ativos=b.stages.filter(s=>!s.feito);
      if(!ativos.length)break;
      for(const s of ativos){
        /* montar a rodada é privilégio do relógio: é aqui que o sorteio
           consome o gerador semeado, e em nenhum outro lugar */
        const rd=prepararRodada(s);
        if(!rd||!rd.length){
          s.feito=true;
          s.ranking=(s.ranking&&s.ranking.length)?s.ranking
            :s.tipo==='rr'?ordenarTabela(s)
            :[...(s.vivos||[]),...s.elim.slice().reverse()];
          continue;
        }
        for(const[a,bb]of rd){
          /* Grande final em Bo5, como no circuito de verdade. */
          const bo=((s.tipo==='ko'&&s.vivos.length<=2)||(s.tipo==='de'&&s.faseAtual==='gf'))
            ?Math.max(s.bo,5):s.bo;
          const meuJogo=(a===G.meuTime||bb===G.meuTime);
          const ctx={stage:s.id,nome:s.nome,semana:G.semana};
          if(meuJogo&&plano&&plano.veto&&plano.veto.mapas&&plano.veto.mapas.length
             &&plano.stageId===s.id)ctx.veto=plano.veto;
          /* A SUA partida pode ter sido CONDUZIDA pela tela, round a round,
             para o pedido de tempo valer alguma coisa: nesse caso ela já
             aconteceu e chega aqui pronta, em vez de ser simulada.

             A tentativa anterior era o contrário — o relógio parava no meio da
             semana e devolvia a série aberta para a tela terminar. Parar ali
             deixava as OUTRAS partidas da rodada por jogar, e retomar de
             dentro de três laços aninhados é a receita de uma semana pela
             metade. Assim a ordem fica simples: a tela joga a sua série antes,
             o relógio roda a semana inteira depois. */
          const res=(meuJogo&&plano&&plano.serieFeita&&plano.stageId===s.id
                     &&(plano.serieFeita.aId===a||plano.serieFeita.bId===a))
            ?plano.serieFeita
            :simPartida(a,bb,bo,ctx);
          res.semana=G.semana;
          stageAplicar(s,res);
          resultados.push({stage:s,res});
          if(a===G.meuTime||bb===G.meuTime)minhaPartida=res;
        }
        stageAvancar(s);
      }
    }
  }
  return fecharSemana(b,resultados,minhaPartida,idx);
}
/* A segunda metade da semana: tudo o que acontece DEPOIS das partidas. Virou
   função própria porque a sua partida pode ser conduzida pela tela, e nesse
   caso esta parte só roda quando ela terminar. */
function fecharSemana(b,resultados,minhaPartida,idx){
  semana();

  /* O bloco encerra quando o último jogo dele acabou — é aí que se paga, se
     entrega o título e se elege o melhor jogador, não numa semana qualquer
     depois. */
  let encerrado=null;
  if(b&&!b._fechado&&(b.stages.length?b.stages.every(s=>s.feito):G.semana>=b.fim)){
    b._fechado=true;encerrado=b.nome;
    fimDeBloco(b);
  }

  /* a diretoria fala no meio do ano, na abertura da janela */
  if(typeof cobrancaDoMeioDoAno==='function'&&G.semana===SEMANA_COBRANCA){
    const v=cobrancaDoMeioDoAno();
    if(v)G.vereditoPendente=v;
  }
  const anoAntes=G.ano;
  G.semana++;
  if(G.semana>SEMANAS_ANO){
    /* fimDeTemporada() já vira o ano e remonta o calendário */
    if(G.ano===anoAntes&&typeof fimDeTemporada==='function')fimDeTemporada();
    if(G.ano===anoAntes){G.ano++;montarCalendario();}
    G.semana=1;
  }
  return{tipo:resultados.length?'rodada':'semana',resultados,minhaPartida,
         bloco:b?b.nome:'Intervalo',semana:G.semana-1<1?SEMANAS_ANO:G.semana-1,
         encerrado};
}
/* Semanas até o próximo jogo do seu clube, para o botão de pular o vazio.
   Devolve 0 se há jogo nesta semana. */
function semanasAteMeuJogo(){
  if(!G.meuTime)return 0;
  for(let d=0;d<SEMANAS_ANO;d++){
    const sem=G.semana+d;
    if(sem>SEMANAS_ANO)return d;                 /* vira o ano: pare aqui */
    const i=blocoDaSemana(sem);
    if(i==null)continue;
    const b=G.calendario[i];
    if(!b.stages.length&&b.montar)return d;      /* bloco que ainda vai montar */
    if(b.stages.some(s=>!s.feito&&(s.times||[]).includes(G.meuTime)))return d;
  }
  return 0;
}
function semana(){
  for(const id in G.times){
    const t=G.times[id];
    let folha=0;t.elenco.forEach(pid=>folha+=G.jogadores[pid].salario);
    /* a comissão agora é gente com salário, então saiu do custeio e entrou na
       folha; o custeio ficou só com estrutura e scrims */
    folha+=folhaStaff(t);
    /* Parte do salário de quem está emprestado continua com o dono: é o que
       impede o empréstimo de virar um truque para zerar folha. */
    if(typeof custoEmprestimosDe==='function')folha+=custoEmprestimosDe(t);
    const custeio=custeioSemanal(t);   /* a conta mora em economia.js */
    /* O ano tem SEMANAS_ANO semanas e o relógio anda uma por vez: a receita
       anual entra dividida por elas. Antes o divisor era 44, herdado de quando
       o avanço era por rodada de torneio e o número de avanços por ano era
       aproximado. */
    t.caixa+= t.patroc/SEMANAS_ANO - (folha*12)/SEMANAS_ANO - custeio;
    /* scrims: entrosamento sobe com a intensidade (neutro em 3) */
    t.sinergia=clamp(t.sinergia+(t.tatica.scrim-3)*0.30,0,100);
    /* A IA escolhe o plano da semana antes de a semana ser aplicada; o seu
       clube usa o que VOCÊ deixou marcado na tela de Treino. */
    if(typeof planoIA==='function')planoIA(t);
    if(typeof aplicarTreinoSemanal==='function')aplicarTreinoSemanal(t);
    /* comp e tática da semana: a IA reescolhe, o seu clube usa o que você marcou */
    if(typeof limparComps==='function')limparComps(t);
    if(typeof compIA==='function')compIA(t);
    if(typeof taticaIA==='function')taticaIA(t);
    /* promessa não cumprida cobra sozinha, na semana em que vence */
    if(typeof cobrarPromessas==='function')cobrarPromessas(t);
    t.elenco.forEach(pid=>desenvolver(G.jogadores[pid],t));
    if(typeof conferirCartas==='function')conferirCartas(t);
    if(t.base&&t.base.length)baseDe(t).forEach(p=>crescerNaBase(p,t));
    if(t.caixa<0&&id!==G.meuTime)venderPorDinheiro(t);
  }
  G.livres.forEach(pid=>{const p=G.jogadores[pid];p.semLivre=(p.semLivre||0)+1;p.fadiga=clamp(p.fadiga-.05,0,1);p.forma=clamp(p.forma+gauss(0,.02),.2,1);});
  /* Propostas pelos jogadores que você anunciou chegam ao longo da janela,
     uma por vez, e não todas de uma vez quando você aperta um botão. */
  if(typeof gerarPropostas==='function')gerarPropostas();
  /* último ano de contrato: clubes sondam e assinam pré-contrato com os seus */
  if(typeof rondaPreContratos==='function')rondaPreContratos();
  /* mercado vivo: propostas sem anúncio, multa paga, pedidos de saída, a IA
     negociando entre si e o último dia da janela */
  if(typeof mercadoVivo==='function')mercadoVivo();
  /* O patch da Riot cai na semana marcada, depois de o mundo ter jogado com o
     meta antigo — assim o nerf responde ao uso da temporada. */
  if(typeof patchDaSemana==='function')patchDaSemana();
}
function desenvolver(p,t){
  /* O ponto neutro da comissão é NIVEL_NEUTRO (staff.js), não o meio da
     escala: metade do mundo é Tier 2 e a escala de nível é do mundo inteiro.
     Estas duas linhas usavam um 3 escrito à mão, o que deixava TODO clube de
     Challengers no prejuízo — moral que nunca subia e mais lesão — mesmo
     contratando o melhor fisio e o melhor psicólogo que a divisão tem. Os k
     foram reescalados junto para o efeito no Tier 1 continuar o mesmo. */
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  /* O plano da semana deste jogador. É ele que decide se a semana foi de
     evoluir ou de recuperar a perna — e cansaço é o maior fator de derrota do
     jogo, então a escolha custa de verdade. */
  const plano=(typeof planoDoJogador==='function')?planoDoJogador(t,p)
             :{tipo:'atributo',alvo:'mira'};
  const custoPlano=plano.tipo==='descanso'
    ?FADIGA_DESCANSO
    :FADIGA_TREINO+((t.treino&&t.treino.mapa)?FADIGA_TREINO_MAPA:0);
  p.fadiga=clamp(p.fadiga-0.035-(t.estrutura.gh*0.004)+(t.tatica.scrim-2)*0.008
                 -((t.staff.fisio||neutro)-neutro)*0.0027+custoPlano,0,1);
  if(p.lesao>0){p.lesao--;if(!p.lesao&&t.id===G.meuTime)noticia(p.nome+' está recuperado.',{c:'clube',p:[p.id]});}
  p.moral=clamp(p.moral+((t.staff.mental||neutro)-neutro)*0.0009+0.004,.15,1);
  /* burnout: fadiga acumulada cobra moral e abre risco de lesão */
  if(p.fadiga>0.82){
    p.moral=clamp(p.moral-0.022,.15,1);
    if(rnd()<0.02+ (p.fadiga-0.82)*0.10){p.lesao=ri(1,2);
      if(t.id===G.meuTime)noticia('🩹 '+p.nome+' quebrou por desgaste — '+p.lesao+' semana(s) fora.',{c:'clube',p:[p.id]});}
  }
  const o=over(p),gap=p.pot-o;
  /* Pico e declínio acompanham a carreira mais longa: cresce até 27, estabiliza
     até 30, cai a partir dos 31. O declínio acelera com a idade, mas devagar o
     bastante para um jogador de 38 anos ainda ser aproveitável — se ele cai a
     pique, esticar a aposentadoria não serve para nada, porque ninguém contrata
     um veterano inútil. */
  const taxa = p.idade<=19?.016 : p.idade<=22?.010 : p.idade<=24?.005
             : p.idade<=27?.002 : p.idade<=30?0 : -.008;
  const titular=t.titulares.includes(p.id);
  /* Cobrança dá trabalho: quem levou bronca na conversa treina com mais foco
     por algumas semanas. É o que faz a opção que CUSTA moral valer a pena. */
  const bronca=(typeof estaCobrado==='function'&&estaCobrado(p))?1.25:1;
  const mult=(0.45+t.estrutura.treino*0.09+t.staff.tecnico*0.07)*(titular?1.15:0.75)*(0.7+p.moral*0.5)*(0.85+t.tatica.scrim*0.05)*bronca;
  let g = taxa>0 ? gap*taxa*mult : taxa*(p.idade-29);
  if(Math.abs(g)<0.0004)return;
  /* Para onde a evolução vai. Antes era um foco de TIME; agora é o plano do
     jogador. Quem descansa não evolui, e quem está aprendendo agente põe o
     trabalho na familiaridade em vez dos atributos — o que é o custo real de
     correr atrás do meta. */
  let alvos, concentra=1;
  if(plano.tipo==='descanso'){alvos=[];}
  else if(plano.tipo==='agente'){alvos=[];}
  else if(plano.alvo&&ATTRS.some(a=>a[0]===plano.alvo)){
    alvos=[plano.alvo];concentra=FOCO_CONCENTRADO;
  }else{
    alvos=['mira','util','visao','clutch'];
  }
  /* O que cai primeiro é a parte física: reflexo, mira, movimentação. Leitura
     de jogo e utilidade envelhecem bem, e é por isso que veterano costuma
     migrar para função de suporte em vez de sumir.

     Mas TUDO precisa cair um pouco, senão um Controlador nunca envelhece —
     era o que estava acontecendo: metade dos titulares do circuito passou dos
     30 com over acima da média da liga, e os garotos não achavam vaga. */
  const decl=['reflexo','mira','mov'];
  const lista = g>0?alvos:decl;
  lista.forEach(k=>{p.at[k]=clamp(p.at[k]+g*(g>0?2.4*concentra:1.6),25,99);});
  if(g<0)for(const[k]of ATTRS)
    if(!decl.includes(k)&&k!=='lider')p.at[k]=clamp(p.at[k]+g*0.55,25,99);
  /* O empurrãozinho aleatório só existe para quem TREINOU. Sem esta guarda o
     jogador em descanso continuava evoluindo por aqui, e a semana de descanso
     saía de graça — foi exatamente o que a medição mostrou. */
  if(g>0&&alvos.length&&rnd()<.25)p.at[pick(['mira','util','visao','clutch','consist','mov','reflexo'])]+=g;
  for(const[k]of ATTRS)p.at[k]=clamp(p.at[k],25,99);
  /* O perfil mudou, então a segunda função pode ter deixado de fazer sentido —
     ou passado a fazer. Sem revalidar aqui, o jogador carregava para sempre a
     secundária que ganhou no dia em que nasceu. */
  ajustarSecundaria(p);
  /* Marca de quão bom ele já foi. É a régua do declínio: quem caiu muito do
     próprio pico é quem pendura o mouse, independentemente da idade. */
  p.pico=Math.max(p.pico||0,over(p));
  p.valor=valor(p);p.salarioJusto=salario(p,p.timeId&&G.times[p.timeId]);
}
function venderPorDinheiro(t){
  if(t.elenco.length<=5)return;
  const cand=t.elenco.map(i=>G.jogadores[i]).filter(p=>!t.titulares.includes(p.id));
  if(!cand.length)return;
  const p=cand.sort((a,b)=>b.valor-a.valor)[0];
  t.caixa+=p.valor*.8;liberar(p);
}
/* Um jogador deixa de existir em três lugares — aposentadoria, poda do mercado
   de agentes livres e o Apagar do Banco de dados — e cada um deles apagava só
   o que lembrava de apagar. Aqui mora a limpeza inteira: o que aponta para ele
   sai junto, senão fica proposta por um fantasma, plano de treino de quem não
   existe e crachá de IGL pendurado num id morto. */
function esquecerJogador(pid){
  if(!pid)return;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==pid);
  for(const tid in G.times){
    const t=G.times[tid];
    if(t.treino&&t.treino.individual)delete t.treino.individual[pid];
    if(t.igl===pid)t.igl=(t.titulares||[]).find(x=>x!==pid)||null;
  }
}
function liberar(p){
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  const t=G.times[p.timeId];
  if(t){t.elenco=t.elenco.filter(x=>x!==p.id);t.titulares=t.titulares.filter(x=>x!==p.id);
    t.sinergia=clamp(t.sinergia-12,0,100);autoEscalar(t);
    /* o plano de treino perde a linha dele agora, não na semana que vem: quem
       saiu no meio da semana ficava planejado até o próximo aplicarTreino, e a
       tela de Treino mostrava o nome de quem já não era do clube */
    if(typeof limparPlano==='function')limparPlano(t);}
  p.timeId=null;p.contrato=0;p.semLivre=0;G.livres.push(p.id);
}
function contratar(p,time,anos,sal){
  let origem=null;
  if(p.timeId){origem=G.times[p.timeId];
    origem.elenco=origem.elenco.filter(x=>x!==p.id);
    origem.titulares=origem.titulares.filter(x=>x!==p.id);
    origem.sinergia=clamp(origem.sinergia-10,0,100);autoEscalar(origem);
    if(typeof limparPlano==='function')limparPlano(origem);}
  G.livres=G.livres.filter(x=>x!==p.id);
  delete p.semLivre;
  p.timeId=time.id;p.contrato=anos;p.salario=sal;p.moral=clamp(p.moral+.08,.2,1);
  /* contrato novo, multa nova: quem fecha pela mesa fixa o valor logo depois */
  delete p.multa;delete p.sondado;delete p.pedidoSaida;delete p.semInfeliz;
  if(p.preContrato&&p.preContrato.clubeId!==time.id)delete p.preContrato;
  if(G.negociacoes)G.negociacoes=G.negociacoes.filter(n=>n.jogadorId!==p.id||n.fase==='fechada');
  /* O anúncio é do clube que anunciou, não do jogador: mudou de clube, o
     anúncio morre. Sem isto ele chegava ao clube novo já com a plaquinha de
     "à venda" no pescoço, e as propostas continuavam chegando para quem
     acabara de contratá-lo. */
  delete p.anuncio;
  G.propostas=(G.propostas||[]).filter(x=>x.jogadorId!==p.id);
  time.elenco.push(p.id);time.sinergia=clamp(time.sinergia-8,0,100);autoEscalar(time);
  /* Quem vende repõe na hora. A trava mora AQUI, e não em cada tela que
     negocia, porque toda transferência do jogo passa por esta função — foi
     exatamente por não estar aqui que comprar de um clube com cinco jogadores
     deixava aquele clube com quatro e quebrava a escalação dele. Liberar por
     corte de folha continua podendo descer de cinco: aquilo é decisão de
     diretoria e o fim de temporada repõe. Vender, não. */
  if(origem&&typeof reporElenco==='function')reporElenco(origem);
}
