/* ---------- Geração do mundo ---------- */
function criarMundo(seedVal){
  srand(seedVal);
  G={seed:seedVal,seqP:1,ano:2027,times:{},jogadores:{},livres:[],regioes:{},h2h:{},manager:null,
     meuTime:null,caixa:0,log:[],historico:[],bloco:0,fase:'',temporadaFim:false,
     mapasAtivos:poolInicial(),mapaDesde:{},janela:true,noticias:[],negociacoes:[],transferencias:[],
     meta:(typeof metaInicial==='function'?metaInicial():{}),patches:[],patchFeito:{}};
  montarTorneios();montarAgentes();montarMarcas();
  const usadosT=new Set(), usadosP=new Set();
  /* Reserva de saída TODOS os nicks reais antes de gerar qualquer jogador.
     Sem isso, nomeUnico() só conhece os nicks já inseridos, e um reserva
     gerado para um time de Americas podia nascer com um nick que só ia
     aparecer de verdade num time da China — dois jogadores com o mesmo nome
     na base. */
  if(typeof ELENCOS_REAIS!=='undefined')
    for(const tag in ELENCOS_REAIS)
      for(const linha of ELENCOS_REAIS[tag])usadosP.add(linha[0]);
  let ti=1;
  for(const R of REGIONS){
    /* R.t2 vem de data/mundo.js com o NOME da liga de Challengers, e a linha
       abaixo o substitui pela lista de ids dos times. O nome era destruído e a
       interface passava a mostrar "t14,t16,t18…" no lugar de "Challengers
       Americas". Guardado antes de sobrescrever. */
    G.regioes[R.id]={...R,nomeT2:R.t2,t1:[],t2:[],pontos:{}};
    for(const tier of [1,2]){
      const qtd = tier===1?12:8;
      const reais = TIMES_REAIS[R.id][tier===1?'t1':'t2'];
      for(let i=0;i<qtd;i++){
        let nome,tag,prest;
        if(reais&&reais[i]){
          [nome,tag,prest]=reais[i];
          /* Tier 1 mantém o prestígio calibrado pelo aproveitamento real. No
             Tier 2 todo mundo começa igual: os títulos de Challengers não são
             relevantes o bastante para hierarquizar a divisão, e o que
             diferencia um clube de Challengers do outro é a torcida, não a
             reputação herdada. */
          prest = tier===1 ? clamp(Math.round(prest+gauss(0,1.5)),35,92) : PRESTIGIO_T2;
        }
        else{
          do{ nome = rnd()<.35 ? pick(TN1) : pick(TN1)+' '+pick(TN2); }while(usadosT.has(nome));
          tag = nome.replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,3);
          prest = tier===1 ? ri(60,88) : PRESTIGIO_T2;
        }
        usadosT.add(nome);
        const t={
          /* tierInicial é a divisão de origem do clube e nunca muda. Serve
             para separar quem é de Challengers de nascença de quem caiu do
             Tier 1 — sem isso não dá para dizer nada sobre "o prestígio do
             Tier 2", porque a divisão vai se enchendo de rebaixados. */
          id:'t'+(ti++), nome, tag, regiao:R.id, tier, tierInicial:tier, prestigio:prest,
          /* Tier 2 recebeu mais patrocínio junto com a régua de over. Não é
             generosidade: uma liga cujos jogadores são 69–80 não é a mesma
             liga amadora de over 48 para a qual esses números foram ajustados.
             Com o valor antigo a folha de Challengers comia 92% da receita e
             a divisão inteira quebrava em três temporadas. */
          caixa: caixaInicialDe(tier,prest), patroc: 0,
          elenco:[], titulares:[], igl:null, sinergia:ri(35,70),
          staff:{tecnico:clamp(Math.round(prest/18),1,5),analista:clamp(Math.round(prest/20),1,5),mental:clamp(Math.round(prest/22),1,5)},
          estrutura:{gh:clamp(Math.round(prest/20),1,5),treino:clamp(Math.round(prest/20),1,5),academia:clamp(Math.round(prest/22),1,5)},
          tatica:{agres:3,foco:'default',scrim:3,treino:'mira'},
          torcida:0, patrocinios:{master:null,secundario:null,fornecedor:null},
          legado:0, vices:0,
          pais:(typeof CLUBES_BASE!=='undefined'&&CLUBES_BASE&&CLUBES_BASE[tag]
                &&CLUBES_BASE[tag].pais)||null,
          mapPref:{}, temporada:{v:0,d:0,mv:0,md:0,pts:0}, titulos:[],
          treino:{mapa:null,individual:{}}, comps:{}
        };
        for(const m of MAP_POOL)t.mapPref[m]=Math.round(gauss(0,4));
        /* elenco real, quando existir para a tag */
        const reaisEl=(typeof ELENCOS_REAIS!=='undefined'&&t.tag!=='LIVRE'
                       &&ELENCOS_REAIS[t.tag])||null;
        if(reaisEl){
          t.elencoReal=true;
          /* As linhas de ELENCOS_REAIS são progressivas: só o nick é obrigatório.
             Função, over, idade e país que faltarem são preenchidos como se o
             jogador fosse gerado — assim um roster real pode entrar no jogo sem
             que ninguém invente número, e ir sendo refinado no Editor. */
          const cobertos=new Set(reaisEl.map(r=>r[1]).filter(Boolean));
          /* Quem veio só com o nick não pode nascer melhor que o melhor
             jogador com over escrito no arquivo. Sem esse teto, um nome sem
             dado nenhum virava o astro do time por sorteio, passando por
             cima do número que foi ajustado à mão. */
          const dados=reaisEl.map(r=>r[2]).filter(v=>typeof v==='number');
          const tetoSemDado=dados.length?Math.max(...dados):FAIXAS.jogador[tier][1];
          for(const[nick,roleDado,ovDado,idadeDada,paisDado]of reaisEl){
            const role=roleDado||ROLES.find(r=>!cobertos.has(r))||pick(ROLES);
            if(!roleDado)cobertos.add(role);
            const idade=idadeDada||ri(19,26);
            const pais=paisDado||pick(R.paises);
            /* Sem over no arquivo, o jogador nasce na régua da divisão.
               Com over no arquivo, o arquivo manda — é lá que ficam os
               ajustes feitos à mão no Editor. */
            const ov=ovDado||Math.min(tetoSemDado,overAlvo('jogador',tier,prest,3));
            const p=makePlayer(ov,role,pais,idade,usadosP,tier);
            aplicarOver(p,ov);
            p.nome=nick;usadosP.add(nick);
            /* marca quem carrega nome de pessoa real: rosto sintético
               fotorrealista ao lado de um nome real se lê como foto dela */
            p.real=true;
            /* País VEIO DO ARQUIVO, não foi sorteado. A distinção importa: sem
               ela, um nick sem país recebia um país da região e o clube passava
               a "ter sede" naquele país por acaso — dado inventado com cara de
               dado real. */
            if(paisDado)p.paisReal=true;
            if(ovDado){aplicarOver(p,ov);p.overFixo=true;}
            p.pot=potencialDe(over(p),idade,tier);
            p.salario=salario(p);p.valor=valor(p);p.contrato=ri(1,3);
            p.timeId=t.id;G.jogadores[p.id]=p;t.elenco.push(p.id);
          }
        }
        /* teto dos reservas gerados: nunca acima do titular real mais fraco,
           para que o line-up importado continue sendo o line-up */
        /* Reserva nunca acima do titular real mais fraco: o line-up importado
           tem de continuar sendo o line-up. O piso da divisão continua valendo,
           então em time forte a diferença entre titular e reserva é pequena. */
        const[pisoDiv]=FAIXAS.jogador[tier];
        let tetoReserva=FAIXAS.jogador[tier][1];
        if(reaisEl){
          const overs=reaisEl.map(r=>r[2]).filter(v=>typeof v==='number');
          if(overs.length)tetoReserva=Math.max(pisoDiv,Math.min(...overs)-2);
        }
        const roles=['Duelista','Iniciador','Controlador','Sentinela','Flex','Duelista','Iniciador'];
        /* Até o MÍNIMO, não até sete. Antes o mundo nascia com todo clube em
           sete e dois deles eram inventados: um roster real de cinco entrava
           no jogo com dois nomes que não existem, e o elenco que você abria na
           primeira semana não era o elenco de verdade. Quem tem cinco começa
           com cinco; o banco se monta no mercado, como na vida. */
        const alvoElenco=(typeof ELENCO_MIN!=='undefined')?ELENCO_MIN:5;
        for(let j=t.elenco.length;j<alvoElenco;j++){
          const alvo=clamp(overAlvo('jogador',tier,prest,3,4),pisoDiv,tetoReserva);
          const idade = j>=5 && rnd()<.5 ? ri(16,20) : ri(18,29);
          const p=makePlayer(alvo,roles[j],pick(R.paises),idade,usadosP,tier);
          /* makePlayer aproxima o alvo mexendo em atributos inteiros e pode
             errar por 1. Sem este ajuste a faixa da divisão vaza — o Tier 2
             aparecia com 68 e 81 numa régua que promete 69–80. */
          aplicarOver(p,alvo);p.pot=potencialDe(alvo,idade,tier);
          p.timeId=t.id; G.jogadores[p.id]=p; t.elenco.push(p.id);
        }
        autoEscalar(t);
        t.torcida=torcidaInicial(t);
        G.times[t.id]=t;
        G.regioes[R.id][tier===1?'t1':'t2'].push(t.id);
      }
    }
  }
  /* Reais sem clube, se o elencos.js trouxer a chave LIVRE. Vêm antes dos
     gerados para que o nick real nunca perca a vaga para um sorteado. */
  if(typeof ELENCOS_REAIS!=='undefined'&&ELENCOS_REAIS.LIVRE){
    for(const[nick,roleDado,ovDado,idadeDada,paisDado,potDado]of ELENCOS_REAIS.LIVRE){
      const R=pick(REGIONS);
      const role=roleDado||pick(ROLES);
      const idade=idadeDada||ri(19,28);
      const ov=ovDado||overAlvo('jogador',2,ri(45,58),3);
      const p=makePlayer(ov,role,paisDado||pick(R.paises),idade,usadosP,ovDado>=FAIXAS.jogador[1][0]?1:2);
      p.nome=nick;usadosP.add(nick);p.real=true;
      if(paisDado)p.paisReal=true;
      aplicarOver(p,ov);if(ovDado)p.overFixo=true;
      /* potencial escrito no arquivo manda: é o que separa a promessa do
         veterano com o mesmo over */
      if(potDado){p.pot=clamp(potDado,over(p),99);p.potFixo=true;}
      p.contrato=0;p.regiaoOrigem=R.id;p.salario=salario(p);p.valor=valor(p);
      G.jogadores[p.id]=p;G.livres.push(p.id);
    }
  }
  // agentes livres
  for(let i=0;i<70;i++){
    const R=pick(REGIONS);
    /* O mercado tem de conversar com as duas divisões: a maioria serve ao
       Tier 2, uma minoria é opção real para o Tier 1. Sem isso o Tier 1
       fica sem nenhum reforço possível e o mercado morre. */
    /* gerado sem clube é promessa: over baixo, idade de base, potencial do
       Tier 2 — ver overLivreGerado() */
    const alvo=overLivreGerado();
    const p=makePlayer(alvo,pick(ROLES),pick(R.paises),ri(16,20),usadosP,2);
    aplicarOver(p,alvo);p.pot=potencialDe(alvo,p.idade,2);
    p.contrato=0;p.regiaoOrigem=R.id;G.jogadores[p.id]=p;G.livres.push(p.id);
  }
  /* país de sede congelado agora, com o elenco real ainda inteiro: é dele que
     saem os garotos da base e as marcas nacionais (ver paisDoClube) */
  for(const id in G.times){const t=G.times[id];if(!t.pais&&!t.paisSede)t.paisSede=paisDoClube(t)||null;}
  /* a comissão precisa de todos os times já criados para semear por prestígio */
  montarStaff();
  /* patrocínio por último: quem escolhe primeiro é o clube mais atraente, e
     atratividade depende de torcida, que depende de todos os clubes existirem */
  /* história antes do patrocínio: a torcida herdada de quem já foi campeão
     muda a atratividade, e é a atratividade que decide quem escolhe marca
     primeiro */
  semearHistoria();
  atribuirPatrocinios();
  for(const id in G.times)G.times[id].patroc=receitaAnual(G.times[id]);
  return G;
}
