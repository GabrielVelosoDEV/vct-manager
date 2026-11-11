/* ============================================================
   O MANAGER: PAPEL, METAS E DEMISSÃO
   ------------------------------------------------------------
   Duas maneiras de jogar, e a diferença não é cosmética:

     TREINADOR  responde à diretoria. Recebe metas no começo de
                cada temporada, é avaliado no fim, e pode ser
                demitido. É o modo com consequência.

     DIRETORIA  não responde a ninguém. Sem meta, sem cobrança,
                sem demissão. É o modo livre — quem manda é você,
                e não existe alguém acima para cobrar.

   As metas são de propósito SIMPLES: posição na liga e um alvo
   de bônus. Meta complicada vira planilha, e ninguém joga um
   manager para conferir planilha.
   ============================================================ */

const PAPEIS=[
  {id:'treinador',nome:'Treinador',
   resumo:'A diretoria define metas todo ano e cobra no fim da temporada. Falhar seguido custa o emprego.',
   detalhe:'Modo com consequência: existe alguém acima de você.'},
  {id:'diretoria',nome:'Diretoria',
   resumo:'Sem metas e sem cobrança. Você responde a você mesmo e conduz o clube como quiser.',
   detalhe:'Modo livre: ninguém te demite.'}
];
function papelAtual(){return (G.manager&&G.manager.papel)||'diretoria';}
function souTreinador(){return papelAtual()==='treinador';}

/* Trajetória do treinador: começar no topo ou subir trabalhando. */
const MODOS_TREINADOR=[
  {id:'carreira',nome:'Do zero',resumo:'Começa como um coach comum da divisão e evolui com resultados, títulos e anos de trabalho, até poder chegar ao topo do mundo.',over:{1:80,2:64},pot:97},
  {id:'lenda',nome:'Lenda',resumo:'Já começa entre os melhores do mundo. O elenco rende mais desde a primeira semana, mas o salário pesa na folha e há pouco para evoluir.',over:{1:94,2:94},pot:99}
];
/* Estilo: puxa um atributo da comissão para cima e outro um pouco para baixo,
   sem mudar o over — muda o PERFIL, como a função de um jogador. */
const ESTILOS_TREINADOR=[
  {id:'estrategista',nome:'Estrategista',desc:'Leitura de jogo e preparação de mapa.',mais:'visao',menos:'gestao'},
  {id:'tecnico',nome:'Técnico',desc:'Mecânica, execução e evolução individual.',mais:'tecnica',menos:'disciplina'},
  {id:'motivador',nome:'Motivador',desc:'Vestiário unido e cabeça no lugar.',mais:'gestao',menos:'tecnica'},
  {id:'disciplinador',nome:'Disciplinador',desc:'Rotina, método e cobrança.',mais:'disciplina',menos:'visao'}
];
function modoTreinador(id){return MODOS_TREINADOR.find(x=>x.id===id)||MODOS_TREINADOR[0];}
function estiloTreinador(id){return ESTILOS_TREINADOR.find(x=>x.id===id)||ESTILOS_TREINADOR[0];}

function criarManager(nome,papel,opc){
  const p=PAPEIS.some(x=>x.id===papel)?papel:'diretoria';
  opc=opc||{};
  G.manager={
    nome:String(nome||'').trim().slice(0,28)||'Manager',
    papel:p, desde:G.ano, confianca:dificuldade().confianca,
    metas:[], historico:[], demitido:false, clubes:[],
    pais:opc.pais||null, idade:clamp(parseInt(opc.idade)||34,22,70), genero:opc.genero==='f'?'f':'m',
    modo:modoTreinador(opc.modo).id, estilo:estiloTreinador(opc.estilo).id,
    foto:opc.foto||null, staffId:null
  };
  return G.manager;
}

/* ============================================================
   O TREINADOR NA COMISSÃO
   ------------------------------------------------------------
   No papel de treinador você É o head coach: entra na comissão no
   lugar do coach do clube, que vai para o mercado. O seu nível vale
   no motor e no treino como o de qualquer coach (t.staff.tecnico),
   evolui com o trabalho (ou já começa no topo, se você escolheu a
   trajetória de lenda) e vai com você quando trocar de clube.
   Na diretoria o coach do clube continua — quem manda é você, quem
   treina é ele.
   Nada aqui sorteia: o seu cadastro é montado na mão, sem gerador.
   ============================================================ */
function membroManager(){
  const m=G.manager;
  return m&&m.staffId&&G.staff?G.staff[m.staffId]||null:null;
}
function _criarMembroManager(overAlvo){
  const g=G.manager,t=G.times[G.meuTime];
  const est=estiloTreinador(g.estilo);
  const at={tecnica:overAlvo,gestao:overAlvo,visao:overAlvo,disciplina:overAlvo};
  at[est.mais]+=7;at[est.menos]-=4;
  const R=t?REGIONS.find(r=>r.id===t.regiao):null;
  const m={id:'s'+(G.seqS=(G.seqS||0)+1),nome:g.nome,genero:g.genero,cargo:'tecnico',
    pais:g.pais||(t&&typeof paisDoClube==='function'&&paisDoClube(t))||(R?R.paises[0]:'BR'),
    idade:g.idade,at,pot:modoTreinador(g.modo).pot,timeId:null,contrato:9,salario:0,valor:0,
    temp:{v:0,d:0,titulos:0},carreira:{anos:0,titulos:0},hist:[],voce:true,foto:g.foto||null};
  aplicarOverStaff(m,overAlvo);
  m.pot=Math.max(m.pot,overStaff(m));
  G.staff[m.id]=m;
  g.staffId=m.id;
  return m;
}
/* over de partida: lenda no topo; do zero, um coach comum da divisão */
function overInicialManager(t){
  const md=modoTreinador(G.manager.modo);
  return md.over[t&&t.tier===2?2:1];
}
/* Coloca você no cargo de head coach do clube. O coach que estava lá vai
   para o mercado. Vale na carreira nova e ao assumir outro clube. */
function instalarManagerNoClube(t){
  if(!t||!souTreinador()||!G.staff)return null;
  let m=membroManager();
  if(!m)m=_criarMembroManager(overInicialManager(t));
  const antigo=membroDe(t,'tecnico');
  if(antigo&&antigo.id!==m.id){
    moverStaff(antigo.id,null);
    noticia('👔 '+antigo.nome+' deixa o comando técnico do '+t.nome+' e vai para o mercado: quem treina agora é '+m.nome+'.',{c:'clube',t:[t.id]});
  }
  /* sai de onde estava, sem passar pelo mercado */
  for(const x of Object.values(G.times))if(x.comissao&&x.comissao.tecnico===m.id&&x.id!==t.id){x.comissao.tecnico=null;atualizarComissao(x);}
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==m.id);
  m.timeId=t.id;m.contrato=9;
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  t.comissao=t.comissao||{};t.comissao.tecnico=m.id;
  atualizarComissao(t);
  return m;
}
/* Você sai do clube (demissão): o clube contrata o melhor coach livre que
   couber, para não ficar com interino. */
function retirarManagerDoClube(t){
  const m=membroManager();
  if(!t||!m||!t.comissao||t.comissao.tecnico!==m.id)return;
  t.comissao.tecnico=null;m.timeId=null;
  const livre=(G.staffLivres||[]).map(i=>G.staff[i]).filter(x=>x&&!x.voce&&x.cargo==='tecnico')
    .sort((a,b)=>overStaff(b)-overStaff(a))[0];
  if(livre){moverStaff(livre.id,t.id,'tecnico');
    noticia('👔 '+livre.nome+' é o novo head coach do '+t.nome+'.',{c:'mercado',t:[t.id]});}
  else atualizarComissao(t);
}
/* Saves de antes: o treinador ainda não estava na comissão. Entra no lugar do
   coach, com o mesmo nível dele, para a troca não mexer na força do time. */
/* A foto mora no cadastro do manager e no do coach; as duas andam juntas. */
function definirFotoManager(foto){
  const g=G.manager;if(!g)return;
  g.foto=foto||null;
  const mm=membroManager();if(mm)mm.foto=g.foto;
}
function garantirManagerNaComissao(){
  const g=G.manager,t=G.meuTime&&G.times[G.meuTime];
  /* coach criado sem a foto (save de antes dela, ou foto posta depois):
     a do cadastro do manager vale */
  {const mm=g&&membroManager();if(mm&&g.foto&&!mm.foto)mm.foto=g.foto;}
  if(!g||!t||!souTreinador()||g.demitido||!G.staff)return;
  if(membroManager()&&t.comissao&&t.comissao.tecnico===g.staffId)return;
  if(!membroManager()){
    if(!g.modo)g.modo='carreira';
    if(!g.estilo)g.estilo='estrategista';
    if(!g.idade)g.idade=34;
    const atual=membroDe(t,'tecnico');
    _criarMembroManager(atual?overStaff(atual):overInicialManager(t));
  }
  instalarManagerNoClube(t);
}
/* Evolução de fim de temporada do seu cadastro de coach. Do zero sobe com
   o trabalho e o resultado; a lenda quase não sobe, mas também não cai cedo. */
function evoluirManagerStaff(m){
  const g=G.manager||{};
  const jogos=m.temp.v+m.temp.d,aprov=jogos?m.temp.v/jogos:0.5;
  m.hist.push({ano:G.ano,time:m.timeId&&G.times[m.timeId]?G.times[m.timeId].nome:'Sem clube',over:overStaff(m),
    v:m.temp.v,d:m.temp.d,titulos:m.temp.titulos});
  if(m.hist.length>20)m.hist.shift();
  m.carreira.anos++;m.carreira.titulos+=m.temp.titulos;
  const o=overStaff(m),gap=Math.max(0,m.pot-o);
  const metas=(g.metas||[]).filter(x=>x.peso&&x.cumprida===true).length;
  let d=g.modo==='lenda'
    ?(aprov-0.5)*1.6+m.temp.titulos*0.6
    :(m.timeId?1.0:0)+(aprov-0.5)*4.5+m.temp.titulos*2.4+metas*0.8;
  if(m.idade>=58)d-=(m.idade-57)*0.4;
  if(d>0)d=Math.min(d,gap*0.5);
  if(Math.abs(d)>=0.3)aplicarOverStaff(m,clamp(Math.round(o+d),40,99));
  m.idade++;g.idade=m.idade;
  m.temp={v:0,d:0,titulos:0};
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  if(m.timeId&&Math.round(overStaff(m))>o&&typeof noticia==='function')
    noticia('📈 '+m.nome+' fecha a temporada como coach '+overStaff(m)+' (era '+o+').',{c:'carreira',t:[m.timeId]});
}

/* ---------- metas ----------
   Saem do tamanho do clube, não de um número fixo: exigir top 4 de um lanterna
   seria demissão marcada, e exigir top 8 do favorito seria não exigir nada. */
function _ligaDe(t){return (G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).slice();}
/* Alvo de posição. Duas travas aprendidas na simulação de carreira:

   · nunca `n-1`, senão terminar em ÚLTIMO cumpre a meta — foi o que aconteceu
     com "entre os 9 primeiros" numa liga de 8 times;
   · nunca 1, porque exigir o título todo ano de um clube médio é demissão
     marcada, não meta. */
function _posicaoAlvo(t){
  const ord=_ligaDe(t).sort((a,b)=>G.times[b].prestigio-G.times[a].prestigio);
  const onde=ord.indexOf(t.id)+1;            /* 1 = mais prestigiado da liga */
  const n=ord.length;
  if(n<4)return 1;
  return clamp(Math.round(onde-Math.max(1,n*0.12))+dificuldade().alvo,2,n-2);
}
function _textoPosicao(alvo){
  return alvo<=1?'Terminar a liga em primeiro'
                :'Terminar a liga entre os '+alvo+' primeiros';
}
function montarMetas(){
  if(!souTreinador())return[];
  const t=G.times[G.meuTime];
  if(!t)return[];
  const alvo=_posicaoAlvo(t);
  const metas=[{
    id:'posicao',tipo:'posicao',alvo,de:_ligaDe(t).length,tier:t.tier,
    texto:_textoPosicao(alvo),
    peso:1, cumprida:null
  }];
  /* A segunda meta é bônus: cumprir dá fôlego, falhar não pune. Serve para o
     ano ter um objetivo além de não ser rebaixado. */
  if(t.tier===1)metas.push({id:'titulo',tipo:'titulo',alvo:1,peso:0,cumprida:null,
    texto:'Conquistar qualquer título na temporada'});
  else{
    const sobe=Math.max(1,Math.min(2,alvo-1));
    metas.push({id:'acesso',tipo:'posicao',alvo:sobe,de:_ligaDe(t).length,tier:t.tier,peso:0,cumprida:null,
      texto:'Brigar pelo acesso: '+(sobe<=1?'terminar em primeiro':'terminar entre os '+sobe+' primeiros')});
  }
  /* As do meio do ano só entram se a janela ainda está por vir: quem assume
     um clube em setembro não pode ser cobrado por julho. */
  if((G.semana||1)<SEMANA_COBRANCA)metas.push(...metasDoMeio(t,alvo));
  G.manager.metas=metas;
  return metas;
}

/* ---------- a cobrança do meio do ano ----------
   Antes a diretoria só falava no fim da temporada, e as semanas entre um
   torneio e outro não tinham tensão nenhuma no modo treinador. Agora, na
   janela do meio do ano, ela confere duas coisas: como o clube está na liga
   até ali, e uma meta de gestão que sai da situação do clube — dar minutos à
   promessa da casa, ou arrumar as contas. Pesa menos que o fim do ano, mas
   pesa, e quem já chega no limite pode cair ali mesmo. */
const SEMANA_COBRANCA=29;         /* Pausa do meio do ano (calendar.js), dentro da janela de junho e julho */
const MAPAS_PROMESSA=8;
function metasDoMeio(t,alvo){
  const de=_ligaDe(t).length;
  const parcial=clamp(alvo+1,2,Math.max(2,de-2));
  const out=[{id:'parcial',tipo:'parcial',momento:'meio',alvo:parcial,de,peso:0,cumprida:null,
    texto:'Chegar à janela do meio do ano entre os '+parcial+' primeiros da liga'}];
  const promessa=(t.elenco||[]).map(id=>G.jogadores[id])
    .filter(p=>p&&p.idade<=21&&p.pot>=84&&!(t.titulares||[]).includes(p.id))
    /* a diretoria cobra primeiro o garoto que saiu da própria base */
    .sort((a,b)=>((b.daCasa===t.id)-(a.daCasa===t.id))||b.pot-a.pot)[0];
  if(promessa)out.push({id:'promessa',tipo:'promessa',momento:'meio',jogador:promessa.id,
    alvo:MAPAS_PROMESSA,peso:0,cumprida:null,
    texto:'Dar minutos a '+promessa.nome+': '+MAPAS_PROMESSA+' mapas até o meio do ano'});
  else out.push({id:'contas',tipo:'contas',momento:'meio',peso:0,cumprida:null,
    texto:'Chegar ao meio do ano com caixa positivo e folha dentro do teto'});
  return out;
}
function cobrancaDoMeioDoAno(){
  if(!souTreinador())return null;
  const m=G.manager, t=G.times[G.meuTime];
  if(!m||m.demitido||!t)return null;
  const doMeio=(m.metas||[]).filter(x=>x.momento==='meio'&&x.cumprida===null);
  if(!doMeio.length)return null;
  const{pos,de}=posicaoNaLiga(t);
  let delta=0;
  for(const meta of doMeio){
    if(meta.tipo==='parcial'){
      const alvo=Math.min(meta.alvo,Math.max(2,de-2));
      meta.cumprida=pos<=alvo;
      meta.resultado=pos+'º de '+de;
      delta+=meta.cumprida?6+Math.min(6,(alvo-pos)*2):-6-Math.min(12,(pos-alvo)*3);
    }else if(meta.tipo==='promessa'){
      const p=G.jogadores[meta.jogador];
      if(!p||p.timeId!==t.id){
        /* vendeu ou emprestou a promessa: a diretoria não cobra o que você
           decidiu negociar, mas também não aplaude */
        meta.cumprida=null;meta.resultado='saiu do clube';continue;
      }
      const mapas=(p.temp&&p.temp.maps)||0;
      meta.cumprida=mapas>=meta.alvo;
      meta.resultado=mapas+' mapa(s)';
      delta+=meta.cumprida?5:-5;
    }else if(meta.tipo==='contas'){
      const folga=(typeof folgaSalarial==='function')?folgaSalarial(t):0;
      meta.cumprida=t.caixa>=0&&folga>=0;
      meta.resultado=money(t.caixa)+' em caixa';
      delta+=meta.cumprida?5:-6;
    }
  }
  delta=Math.round(pesoDaCobranca(delta));
  m.confianca=clamp(Math.round(m.confianca+delta),0,100);
  const registro={meio:true,ano:G.ano,clube:t.nome,tag:t.tag,pos,de,titulos:0,
    metas:doMeio.map(x=>({texto:x.texto,cumprida:x.cumprida,resultado:x.resultado})),
    confianca:m.confianca,delta};
  const demitido=m.confianca<=CONF_MIN;
  if(demitido)demitirManager(t);
  noticia('🏢 Balanço do meio do ano: confiança da diretoria '+(delta>=0?'+':'')+delta+' → '+m.confianca+'.',{c:'clube',t:[t.id],imp:2});
  return{...registro,demitido,avisado:!demitido&&m.confianca<=CONF_PISO_DEMISSAO};
}

/* Posição do clube na liga pela campanha da temporada corrente. */
function posicaoNaLiga(t){
  const liga=(G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).slice();
  const camp=x=>{const c=G.times[x].temporada||{v:0,d:0,mv:0,md:0};
                 return[c.v-c.d,(c.mv||0)-(c.md||0)];};
  liga.sort((a,b)=>{const A=camp(a),B=camp(b);return B[0]-A[0]||B[1]-A[1];});
  return{pos:liga.indexOf(t.id)+1,de:liga.length};
}

/* ---------- avaliação de fim de temporada ---------- */
const CONF_MIN=0;             /* abaixo disso, demissão */
const CONF_PISO_DEMISSAO=18;  /* margem em que a diretoria ainda avisa */

function avaliarTemporada(){
  if(!souTreinador())return null;
  const m=G.manager, t=G.times[G.meuTime];
  if(!t||!m.metas.length)return null;
  const{pos,de}=posicaoNaLiga(t);
  const titulosAno=(t.titulos||[]).filter(x=>String(x).startsWith(String(G.ano))).length;

  for(const meta of m.metas){
    if(meta.momento==='meio')continue;   /* já cobradas na janela do meio do ano */
    if(meta.tipo==='posicao'){
      /* Acesso ou rebaixamento entre a definição da meta e a avaliação mudam o
         tamanho da liga. Reescalar mantém a exigência equivalente em vez de
         herdar um número que não faz mais sentido — e o teto de `de-2` garante
         que terminar em último nunca cumpra meta nenhuma. */
      let alvo=meta.alvo;
      if(meta.de&&meta.de!==de){
        alvo=clamp(Math.round(meta.alvo*de/meta.de),2,Math.max(1,de-2));
        meta.ajustada=meta.alvo+' → '+alvo+' (a liga mudou de tamanho)';
        meta.alvo=alvo;meta.de=de;meta.texto=_textoPosicao(alvo);
      }
      alvo=Math.min(alvo,Math.max(1,de-2));
      meta.cumprida=pos<=alvo;
    }
    else if(meta.tipo==='titulo')meta.cumprida=titulosAno>=meta.alvo;
    meta.resultado=meta.tipo==='posicao'?(pos+'º de '+de):(titulosAno+' título(s)');
  }
  const principal=m.metas.find(x=>x.peso>0);
  const bonus=m.metas.filter(x=>x.peso===0&&x.momento!=='meio'&&x.cumprida).length;

  /* A confiança se move pela DISTÂNCIA da meta, não por acertou/errou: ficar
     uma posição fora não pode custar o mesmo que ficar dez. */
  let delta;
  if(principal&&principal.cumprida)delta=14+Math.min(12,(principal.alvo-pos)*3);
  else delta=-10-Math.min(24,(pos-(principal?principal.alvo:pos))*4);
  delta+=bonus*10;
  if(titulosAno)delta+=8;
  delta=Math.round(pesoDaCobranca(delta));
  m.confianca=clamp(Math.round(m.confianca+delta),0,100);

  const registro={ano:G.ano,clube:t.nome,tag:t.tag,pos,de,titulos:titulosAno,
                  metas:m.metas.map(x=>({texto:x.texto,cumprida:x.cumprida,resultado:x.resultado})),
                  confianca:m.confianca,delta};
  m.historico.push(registro);
  const demitido=m.confianca<=CONF_MIN;
  if(demitido)demitirManager(t);
  return{...registro,demitido,avisado:!demitido&&m.confianca<=CONF_PISO_DEMISSAO};
}

/* ---------- demissão e recolocação ---------- */
function demitirManager(t){
  const m=G.manager;
  m.demitido=true;
  retirarManagerDoClube(t);
  m.clubes.push({tag:t.tag,nome:t.nome,de:m.desde,ate:G.ano});
  noticia('📉 '+m.nome+' foi demitido do '+t.nome+'.',{c:'clube',t:[t.id],imp:3});
}
/* Clubes dispostos a contratar quem acabou de ser demitido. Ninguém de topo
   chama um treinador que acabou de cair — a lista sai do prestígio para baixo,
   e é isso que faz a carreira ter forma de carreira. */
function ofertasDeEmprego(){
  const m=G.manager;
  const ultimo=m.clubes[m.clubes.length-1];
  const antigo=Object.values(G.times).find(x=>x.tag===(ultimo&&ultimo.tag));
  const teto=(antigo?antigo.prestigio:60)-4;
  const outros=Object.values(G.times).filter(x=>x.id!==(antigo&&antigo.id));
  const dentro=outros.filter(x=>x.prestigio<=teto)
    .sort((a,b)=>b.prestigio-a.prestigio).slice(0,6);
  /* Sempre existe alguma porta. Uma lista vazia encerrava a carreira sem
     aviso — e "nenhum clube do mundo te quer" não é consequência de duas
     temporadas ruins, é um beco sem saída da minha regra de teto. */
  if(dentro.length)return dentro;
  return outros.sort((a,b)=>a.prestigio-b.prestigio).slice(0,4);
}
function assumirClube(id){
  const t=G.times[id];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  G.meuTime=id;
  const m=G.manager;
  m.demitido=false;m.desde=G.ano;m.confianca=dificuldade().confianca-4;
  if(typeof iniciarBase==='function')iniciarBase(t);
  instalarManagerNoClube(t);
  montarMetas();
  if(typeof projetoTrocouDeClube==='function')projetoTrocouDeClube();
  noticia('✍ '+m.nome+' assume o comando do '+t.nome+'.',{c:'clube',t:[t.id],imp:2});
  return{ok:true,msg:'Você assumiu o '+t.nome+'.'};
}

/* Texto curto do estado atual, para a Central. */
function situacaoManager(){
  const m=G.manager;
  if(!m)return null;
  if(!souTreinador())return{papel:'Diretoria',livre:true,
    texto:'Sem metas e sem cobrança — o clube é conduzido do jeito que você decidir.'};
  /* Demitido é um ESTADO, não um evento que passa.

     Antes a demissão só existia dentro do modal do veredito: quem fechasse o
     modal sem escolher clube continuava "treinando" o clube que o demitiu,
     com as metas velhas na tela e a confiança congelada, e nenhuma temporada
     voltava a ser avaliada. A carreira acabava em silêncio e o jogo fingia
     que não. Agora o estado aparece na Central e a porta de volta fica
     sempre aberta. */
  if(m.demitido)return{papel:'Treinador',livre:true,demitido:true,
    texto:'Sem clube. '+(m.clubes.length?'Último trabalho: '+m.clubes[m.clubes.length-1].nome+'. ':'')+
          'Escolha abaixo por onde recomeçar.',
    ofertas:ofertasDeEmprego()};
  const c=m.confianca;
  const tom=c>=70?'bom':c>=35?'neutro':'ruim';
  const texto=c>=80?'A diretoria confia no trabalho.'
    :c>=55?'A diretoria está satisfeita, sem euforia.'
    :c>=35?'A diretoria observa de perto.'
    :c>=CONF_PISO_DEMISSAO?'A diretoria está impaciente.'
    :'Cadeira ameaçada. Outro ano assim e acabou.';
  return{papel:'Treinador',livre:false,confianca:c,tom,texto,metas:m.metas};
}
