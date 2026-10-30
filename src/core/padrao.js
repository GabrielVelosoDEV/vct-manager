/* ============================================================
   PADRONIZAÇÃO DE OVER, POTENCIAL E AGENTES
   ------------------------------------------------------------
   Um lugar só decide a que altura cada divisão joga. Antes isso
   estava espalhado: o over de jogador nascia em world.js, o da
   comissão em staff.js, e o potencial tinha três fórmulas
   diferentes que discordavam entre si. Espalhado assim, mudar a
   régua de uma divisão exigia caçar constante em três arquivos —
   e foi como o Tier 2 acabou com jogador de over 39.

   As faixas abaixo são decisão de design, não medição:
     · comissão Tier 1  80–99, com 99 reservado a pouquíssimos
     · comissão Tier 2  62–78
     · jogador  Tier 2  69–80
   Jogador de Tier 1 NÃO entra aqui de propósito: esses overs são
   editados à mão em data/elencos.js e sobrescrevê-los apagaria o
   trabalho. O que a padronização toca no Tier 1 é só potencial e
   agentes.
   ============================================================ */

/* Faixa de over por tipo e divisão. */
const FAIXAS={
  jogador :{1:[80,99], 2:[69,80]},
  comissao:{1:[80,99], 2:[62,78]}
};

/* Prestígio realmente presente em data/times.js — é o eixo que
   posiciona cada clube dentro da faixa da divisão. Fixo em vez de
   medido para que editar o prestígio de UM time no Editor não
   redesenhe a régua do mundo inteiro. */
const PRESTIGIO_FAIXA={1:[58,86], 2:[45,58]};

/* O sorteio normal nunca passa daqui. O topo real da faixa é
   distribuído depois, à mão, para poucos — senão "99" vira régua e
   deixa de significar melhor do mundo. */
const TETO_SORTEIO=97;
const QUANTOS_NO_TOPO={jogador:2, comissao:2};

/* Posição do clube dentro da divisão, de 0 (lanterna) a 1 (topo). */
function pesoPrestigio(tier,prestigio){
  const[pl,ph]=PRESTIGIO_FAIXA[tier]||PRESTIGIO_FAIXA[2];
  return clamp((prestigio-pl)/(ph-pl),0,1);
}

/* Over alvo de alguém desse tipo, nessa divisão, nesse clube.
   `folga` desloca para baixo quem não é titular/cargo principal. */
function overAlvo(tipo,tier,prestigio,desvio,folga){
  return overAlvoPeso(tipo,tier,pesoPrestigio(tier,prestigio),desvio,folga);
}
/* A mesma conta quando quem posiciona dentro da faixa não é o prestígio.
   O Tier 2 tem prestígio igual para todo mundo — foi o pedido —, então lá
   quem separa um clube do outro precisa ser outra coisa. */
function overAlvoPeso(tipo,tier,peso,desvio,folga){
  const[lo,hi]=(FAIXAS[tipo]||FAIXAS.jogador)[tier]||FAIXAS[tipo][2];
  const teto=Math.min(hi,TETO_SORTEIO);
  const base=lo+clamp(peso,0,1)*(teto-lo)-(folga||0);
  return clamp(Math.round(gauss(base,desvio==null?2.6:desvio)),lo,teto);
}

/* Potencial. Duas forças: a divisão dá o espaço máximo de evolução,
   a idade diz quanto desse espaço ainda está disponível.

   Tier 1 tem folga pequena de propósito — foi o pedido: "o potencial
   é maior, mas bem próximo do que já tá, já que tem muito menos
   espaço pra evoluir". Quem já joga a elite aos 25 anos não vira
   outro jogador; quem tem 17 ainda pode. */
const FOLGA_TIER={1:11, 2:22};
function fatorIdade(idade){
  return idade<=17?1.00 : idade<=19?0.86 : idade<=21?0.66
       : idade<=23?0.46 : idade<=25?0.30 : idade<=27?0.16
       : idade<=30?0.07 : 0;   /* depois dos 30 não sobra evolução nenhuma */
}
function potencialDe(ov,idade,tier){
  const espaco=(FOLGA_TIER[tier]||FOLGA_TIER[2])*fatorIdade(idade);
  return clamp(Math.round(ov+espaco*(0.65+rnd()*0.7)),ov,99);
}
/* Comissão envelhece diferente de jogador: um coach de 34 anos ainda
   cresce muito, um de 55 não. Mesma ideia, escala própria. */
function potencialStaffDe(ov,idade,tier){
  const f=idade<=28?1.0:idade<=34?0.72:idade<=40?0.46:idade<=47?0.22:0.06;
  const espaco=(tier===1?9:16)*f;
  return clamp(Math.round(ov+espaco*(0.65+rnd()*0.7)),ov,99);
}

/* Exatamente três agentes da função, sem repetir. Se a função tiver
   menos de três no catálogo (dá para apagar agentes no Editor), leva
   os que houver em vez de quebrar. */
const AGENTES_POR_JOGADOR=3;
function sortearAgentes(role){
  const pool=agentesDe(role).slice();
  return shuffle(pool).slice(0,Math.min(AGENTES_POR_JOGADOR,pool.length));
}

/* ---------- promoção ao topo da faixa ----------
   Sobe os melhores até o topo real (98/99). Determinístico dado o
   seed: ordena por over e desempata por id, nunca por ordem de
   iteração de objeto, que não é garantida. */
function promoverAoTopo(lista,tipo,aplicar){
  const quantos=QUANTOS_NO_TOPO[tipo]||2;
  const ord=lista.slice().sort((a,b)=>(b.ov-a.ov)||(a.id<b.id?-1:1));
  const n=Math.min(quantos,ord.length);
  for(let i=0;i<n;i++)aplicar(ord[i].ref, i===0?99:98);
  /* E quem NÃO foi promovido volta para dentro do teto de sorteio. Promover
     sem rebaixar não fecha a régua: quem cresceu até 99 jogando continuava lá,
     e "no máximo dois no topo do mundo" virava três a cada padronização.
     Padronizar é rebaselinar — é o único momento em que rebaixar por régua é
     o certo. */
  const promovidos=new Set(ord.slice(0,n).map(x=>x.id));
  for(const x of ord)
    if(!promovidos.has(x.id)&&x.ov>TETO_SORTEIO)aplicar(x.ref,TETO_SORTEIO);
  return n;
}

/* A promoção de JOGADOR ao topo foi removida, e a remoção é a correção de um
   bug — fica registrado para ninguém reintroduzir.

   A ideia era: se ninguém no mundo alcança 99, suba os melhores. Para não
   reescrever os overs vindos de data/elencos.js, ela pulava quem tinha
   `overFixo`. Funcionou enquanto o arquivo trazia poucos overs. Quando passou a
   trazer TODOS, os únicos candidatos que sobravam eram os reservas GERADOS — e
   o sistema promovia justamente o preenchimento de banco a melhor do mundo. A
   NRG nascia com um reserva de 97 sentado atrás de um titular de 86.

   O teto de reserva já impede que alguém gerado passe do titular real mais
   fraco. Se o topo do mundo tem de ser 99, o lugar de dizer isso é o arquivo.
   A promoção da COMISSÃO continua abaixo, porque comissão é toda gerada. */

/* Mesma ideia para a comissão: 99 é para uma ou duas pessoas no mundo
   inteiro, não para a prateleira de cima de todo clube grande. */
function promoverComissaoAoTopo(){
  /* Promover é privilégio de quem está no Tier 1. Mas o TETO vale para o mundo
     inteiro: um coach livre ou de Challengers que cresceu até 99 ficava fora
     da lista e por isso fora da régua — era o terceiro 99 que aparecia. */
  const cand=[], todos=[];
  for(const id in G.staff){
    const m=G.staff[id];
    const t=m.timeId?G.times[m.timeId]:null;
    const item={id:m.id,ov:overStaff(m),ref:m};
    todos.push(item);
    if(t&&t.tier===1)cand.push(item);
  }
  const aplicar=(m,alvo)=>{aplicarOverStaff(m,alvo);m.pot=Math.max(m.pot,alvo);};
  const n=promoverAoTopo(cand,'comissao',aplicar);
  const promovidos=new Set(cand.slice()
    .sort((a,b)=>(b.ov-a.ov)||(a.id<b.id?-1:1)).slice(0,n).map(x=>x.id));
  for(const x of todos)
    if(!promovidos.has(x.id)&&overStaff(x.ref)>TETO_SORTEIO)aplicar(x.ref,TETO_SORTEIO);
  for(const id in G.times)atualizarComissao(G.times[id]);
  return n;
}

/* ---------- economia ----------
   Salário é função de potência do over. Isso quer dizer que mover a régua
   de over move a folha de pagamento junto, elevada a 2.1 (jogador) e ao
   cubo (comissão) — foi o que quebrou as finanças na primeira tentativa
   desta padronização: 33 dos 80 clubes no vermelho até 2030.

   O conserto não é apertar salário no braço, é reconhecer o que a origem
   da curva significa. `PISO_*` é o "nível de reposição": o over a partir
   do qual alguém começa a custar dinheiro. Quando o piso profissional do
   jogo era over 39, 38 era a origem correta. Com o piso em 69, um reserva
   de Challengers estava sendo precificado como titular de Tier 1 era antes.

   Os números abaixo foram ajustados até a razão folha/receita de cada
   divisão voltar ao que era, medida por tools/fin.mjs. */
const PISO_SALARIO_JOGADOR=55;
const K_SALARIO_JOGADOR=5.8;
const PISO_SALARIO_STAFF=52;
const K_SALARIO_STAFF=0.15;

/* Caixa inicial. O patrocínio saiu daqui: virou o sistema de marcas e
   aporte de liga em core/economia.js, porque `prestígio × constante` era
   exatamente a rigidez que produzia a espiral do fundo da tabela.
   patrocinioDe() continua existindo como o ponto único de recálculo, mas
   quem responde é a economia. */
const CAIXA_BASE ={1:40000, 2:16000};
function patrocinioDe(t){
  if(typeof receitaAnual==='function')return receitaAnual(t);
  return Math.round((t.tier===1?20000:8500)*t.prestigio);
}
function caixaInicialDe(tier,prestigio){
  return Math.round((CAIXA_BASE[tier]||CAIXA_BASE[2])*prestigio);
}

/* ============================================================
   PADRONIZAR UMA BASE JÁ EXISTENTE
   ------------------------------------------------------------
   O mundo novo já nasce na régua. Este bloco é para o save que
   você já tem: leva a base atual para a mesma régua sem apagar o
   que foi editado à mão.

   Regra de ouro: over de jogador de Tier 1 NÃO é reescrito, porque
   é ele que você ajustou no Editor. Só sobe quem está abaixo do
   piso da divisão — que são os reservas gerados, não os seus
   ajustes. Tudo mais (Tier 2, comissão, potencial, agentes) é
   redistribuído dentro da faixa preservando a ordem interna: quem
   era o melhor do clube continua sendo.
   ============================================================ */
function padronizarBase(opts){
  const o=opts||{};
  const conta={jogadoresT1:0,jogadoresT2:0,comissao:0,potencial:0,agentes:0,topo:0};

  /* alvos ordenados: preserva quem é melhor que quem dentro do clube */
  const distribuir=(itens,tipo,tier,prest,folga)=>{
    const alvos=itens.map(()=>overAlvo(tipo,tier,prest,2.6,folga)).sort((a,b)=>b-a);
    return itens.slice().sort((a,b)=>b.ov-a.ov).map((it,i)=>({...it,alvo:alvos[i]}));
  };

  for(const id in G.times){
    const t=G.times[id];
    const[piso,teto]=FAIXAS.jogador[t.tier]||FAIXAS.jogador[2];

    /* ---- jogadores ---- */
    const elenco=(t.elenco||[]).map(pid=>G.jogadores[pid]).filter(Boolean);
    if(t.tier===2){
      for(const it of distribuir(elenco.map(p=>({p,ov:over(p)})),'jogador',2,t.prestigio)){
        if(over(it.p)!==it.alvo){aplicarOver(it.p,it.alvo);conta.jogadoresT2++;}
      }
    }else{
      /* Tier 1: só quem está abaixo do piso. Acima dele é edição sua. */
      const abaixo=elenco.filter(p=>over(p)<piso);
      if(abaixo.length){
        for(const it of distribuir(abaixo.map(p=>({p,ov:over(p)})),'jogador',1,t.prestigio,4)){
          aplicarOver(it.p,Math.max(piso,it.alvo));conta.jogadoresT1++;
        }
      }
    }
    /* potencial e agentes valem para as duas divisões */
    for(const p of elenco){
      const novo=potencialDe(over(p),p.idade,t.tier);
      if(novo!==p.pot){p.pot=novo;conta.potencial++;}
      const ag=sortearAgentes(p.role);
      if((p.agentes||[]).length!==ag.length){conta.agentes++;}
      const trocou=ag.some(a=>!(p.agentes||[]).includes(a));
      p.agentes=ag;
      /* trocar os mains sem re-semear deixava a familiaridade apontando para
         bonecos que ele não joga mais, e os novos mains sem nível nenhum */
      if(trocou&&typeof semearAgentes==='function')semearAgentes(p);
      p.salario=salario(p);p.valor=valor(p);
    }

    /* ---- comissão ---- */
    if(G.staff&&t.comissao){
      const membros=CARGOS.map(c=>G.staff[t.comissao[c.id]]).filter(Boolean);
      for(const it of distribuir(membros.map(m=>({m,ov:overStaff(m)})),'comissao',t.tier,t.prestigio)){
        if(overStaff(it.m)!==it.alvo){aplicarOverStaff(it.m,it.alvo);conta.comissao++;}
        it.m.pot=potencialStaffDe(overStaff(it.m),it.m.idade,t.tier);
      }
      atualizarComissao(t);
    }
    t.patroc=patrocinioDe(t);
  }

  /* ---- sem clube: acompanham a régua, senão o mercado fica inútil ---- */
  for(const pid of (G.livres||[])){
    const p=G.jogadores[pid];if(!p)continue;
    const paraT1=over(p)>=FAIXAS.jogador[1][0];
    const tier=paraT1?1:2;
    aplicarOver(p,clamp(over(p),FAIXAS.jogador[tier][0],FAIXAS.jogador[tier][1]));
    p.pot=potencialDe(over(p),p.idade,tier);
    const agL=sortearAgentes(p.role);
    const trocouL=agL.some(a=>!(p.agentes||[]).includes(a));
    p.agentes=agL;
    if(trocouL&&typeof semearAgentes==='function')semearAgentes(p);
    p.salario=salario(p);p.valor=valor(p);
  }
  for(const sid of (G.staffLivres||[])){
    const m=G.staff&&G.staff[sid];if(!m)continue;
    const tier=overStaff(m)>=FAIXAS.comissao[1][0]?1:2;
    aplicarOverStaff(m,clamp(overStaff(m),FAIXAS.comissao[tier][0],FAIXAS.comissao[tier][1]));
    m.pot=potencialStaffDe(overStaff(m),m.idade,tier);
  }

  /* Só a comissão é promovida ao topo aqui. Jogador não: a promoção mexe no
     over, e no save o over de Tier 1 é edição sua — inclusive a de quem já
     está no topo. Em mundo novo a promoção de jogadores continua rodando,
     porque lá quem veio do arquivo está protegido por p.overFixo. */
  if(o.topo!==false)conta.topo=promoverComissaoAoTopo();
  /* Rede de segurança: mexer em over depois do time montado deixa a escalação
     obsoleta em silêncio, que foi exatamente como o reserva de 97 ficou no
     banco. Reescalar no fim custa nada e fecha essa classe de erro. */
  for(const id in G.times)autoEscalar(G.times[id]);
  return conta;
}

/* Saves criados antes de p.real existir não têm ninguém marcado, e por isso a
   exportação saía VAZIA — o arquivo gerado tinha zero jogadores e, copiado por
   cima de data/elencos.js, apagava os 447 nomes reais.

   Esta função remarca pelo nick: quem tem nome que consta em ELENCOS_REAIS é
   real, esteja em que clube estiver. É seguro rodar sempre, porque só
   ACRESCENTA marcação. */
function remarcarReais(){
  if(typeof ELENCOS_REAIS==='undefined'||!ELENCOS_REAIS)return 0;
  const nicks=new Set();
  for(const tag in ELENCOS_REAIS)
    for(const linha of ELENCOS_REAIS[tag])nicks.add(String(linha[0]));
  let n=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!p.real&&nicks.has(p.nome)){p.real=true;n++;}
  }
  return n;
}
function quantosReais(){
  let n=0;for(const id in G.jogadores)if(G.jogadores[id].real)n++;
  return n;
}

/* Gera o conteúdo de data/elencos.js a partir da base carregada, para que
   os ajustes feitos no Editor deixem de morar só no save. Exporta apenas
   quem carrega nome real (p.real): os reservas gerados voltam a ser gerados
   na próxima run, que é o que os mantém variados de partida para partida. */
/* Gera data/clubes.js. Arquivo próprio, e não um apêndice do elencos.js, por
   dois motivos: é dado de CLUBE e não de jogador, e principalmente porque não
   depende de ninguém estar marcado como real — o elencos.js exige isso, e foi
   por causa dessa exigência que a primeira exportação saiu vazia. */
function gerarClubesJS(){
  const linhas=[];
  const ord=Object.values(G.times).sort((a,b)=>(a.tier-b.tier)||a.tag.localeCompare(b.tag));
  for(const t of ord){
    if(!t.pais)continue;
    linhas.push('  '+JSON.stringify(t.tag)+':{pais:'+JSON.stringify(t.pais)+'},'+
                '   /* '+t.nome+' · Tier '+t.tier+' */');
  }
  if(!linhas.length)return null;
  return '/* ============================================================\n'+
    '   DADOS DE CLUBE — exportado do Editor em '+new Date().toISOString().slice(0,10)+'\n'+
    '   ------------------------------------------------------------\n'+
    '   '+linhas.length+' clube(s) com sede definida. Copie por cima de\n'+
    '   data/clubes.js e todo jogo novo já nasce com eles.\n'+
    '   ============================================================ */\n'+
    'const CLUBES_BASE={\n'+linhas.join('\n')+'\n};\n';
}

function gerarElencosJS(){
  /* Recupera marcação perdida antes de decidir se há o que exportar. */
  remarcarReais();
  const linhas=[];
  const porRegiao={};
  for(const id in G.times){
    const t=G.times[id];
    const reais=(t.elenco||[]).map(p=>G.jogadores[p])
      .filter(p=>p&&p.real).sort((a,b)=>over(b)-over(a));
    if(!reais.length)continue;
    (porRegiao[t.regiao]=porRegiao[t.regiao]||[]).push({t,reais});
  }
  const asp=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
  for(const R of REGIONS){
    const grupos=(porRegiao[R.id]||[]).sort((a,b)=>(a.t.tier-b.t.tier)||(b.t.prestigio-a.t.prestigio));
    if(!grupos.length)continue;
    linhas.push('\n/* ---------------- '+R.nome+' ---------------- */');
    for(const{t,reais}of grupos){
      const corpo=reais.map(p=>'['+[asp(p.nome),asp(p.role),over(p),p.idade,asp(p.pais)].join(',')+']');
      /* '100T' e afins não são identificador JS válido: sem aspas o arquivo
         gerado não carrega. Só aspas onde precisa, para o resto continuar
         legível como o elencos.js escrito à mão. */
      const chave=/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t.tag)?t.tag:asp(t.tag);
      linhas.push(chave+':['+corpo.join(',\n'+' '.repeat(chave.length+2))+'],');
    }
  }
  /* Real que está sem clube tem de sair daqui também, senão some: ele não
     pertence a nenhuma tag e a exportação anterior simplesmente o esquecia,
     e na run seguinte um jogador gerado ocupava o lugar dele. */
  const livres=(G.livres||[]).map(id=>G.jogadores[id])
    .filter(p=>p&&p.real).sort((a,b)=>over(b)-over(a));
  if(livres.length){
    linhas.push('\n/* ---------------- Sem clube ---------------- */');
    const corpo=livres.map(p=>'['+[asp(p.nome),asp(p.role),over(p),p.idade,asp(p.pais)].join(',')+']');
    linhas.push('LIVRE:['+corpo.join(',\n       ')+'],');
  }
  const total=livres.length+Object.values(porRegiao).reduce((s,g)=>s+g.reduce((x,y)=>x+y.reais.length,0),0);
  /* Um arquivo vazio sobrescrevendo data/elencos.js apaga a base inteira, e foi
     exatamente o que aconteceu na primeira vez que este botão foi usado. Se não
     há nada para exportar, o certo é falhar alto, não devolver um arquivo. */
  if(!total)return null;
  return '/* ============================================================\n'+
    '   ELENCOS DE PARTIDA — exportado do Editor em '+new Date().toISOString().slice(0,10)+'\n'+
    '   ------------------------------------------------------------\n'+
    '   '+total+' jogadores, todos no formato completo:\n'+
    "     ['nick','Função',over,idade,'PA']\n\n"+
    '   Este arquivo foi gerado a partir de uma base editada no jogo, então\n'+
    '   função, over, idade e país são as SUAS escolhas, não estimativa.\n'+
    '   Reservas gerados ficaram de fora de propósito: eles voltam a ser\n'+
    '   sorteados a cada run, que é o que mantém os elencos variados.\n'+
    '   ============================================================ */\n'+
    'const ELENCOS_REAIS={'+linhas.join('\n')+'\n};\n';
}
