/* ============================================================
   MINIGAMES DE GESTÃO — fase 6 do modo Dono
   ------------------------------------------------------------
   Cinco momentos de dono, cada um com um minigame e a opção de
   delegar a um funcionário (resultado médio):

     Lançamento de uniforme  duas janelas por ano (semanas 1–8 e
                             27–34): modelo, cores, preço e tiragem;
                             a coleção vende ao longo de oito semanas
     Fan fest                uma vez por temporada: local, atrações e
                             ingresso; o dia em ritmo decide o público
     Pitch para investidores coletiva com os investidores: as respostas
                             mexem no preço da fatia e na meta
     Mesa de patrocínio      uma vez por temporada: renegociar o máster
                             (aumento e duração), com a paciência da marca
     Crise de imagem         evento: responder em coletiva antes de a
                             crise crescer

   O estado mora em G.manager.empresa.mini. O que parece sorte sai de
   hash: o gerador do mundo não anda.
   ============================================================ */
const UNI_JANELAS=[[1,8],[27,34]], UNI_SEMANAS=8;
const UNI_MODELOS={
  classico:{nome:'Clássico',desc:'Listras limpas e escudo no peito. Vende sempre, raramente explode.',apelo:1.00},
  street:{nome:'Street',desc:'Corte largo, estampa grande. Pega o público jovem.',apelo:0.95},
  retro:{nome:'Retrô',desc:'Inspirado no primeiro uniforme do clube. Nostalgia vende.',apelo:0.92},
  ousado:{nome:'Ousado',desc:'Grafismo forte e assimétrico. Ou vira febre, ou encalha.',apelo:0.85}
};
const UNI_CORES={
  clube:{nome:'Cores do clube',apelo:1.10},
  invertida:{nome:'Invertida',apelo:1.00},
  edicao:{nome:'Edição preta e dourada',apelo:1.12,custo:6}
};
const UNI_PRECOS={1:[59,79,99,129],2:[39,59,79,99]};
const UNI_TIRAGENS={1:[1000,2500,5000,9000],2:[300,800,1600,3000]};
const UNI_CUSTO=22;

const FF_LOCAIS={
  pequena:{nome:'Arena pequena',cap:{1:1500,2:400},custo:{1:40000,2:10000}},
  media:{nome:'Ginásio',cap:{1:4000,2:1000},custo:{1:110000,2:28000}},
  grande:{nome:'Arena grande',cap:{1:10000,2:2500},custo:{1:260000,2:65000}}
};
const FF_ATRACOES={
  autografos:{nome:'Sessão de autógrafos',custo:{1:10000,2:3000},apelo:0.15,desc:'O elenco inteiro na mesa. O vestiário gosta.'},
  show:{nome:'Show de abertura',custo:{1:60000,2:15000},apelo:0.35,desc:'Um artista conhecido abre o evento.'},
  torneio:{nome:'Torneio de fãs',custo:{1:20000,2:6000},apelo:0.20,desc:'Os fãs jogam; o campeão enfrenta o time.'},
  trofeus:{nome:'Exposição de troféus',custo:{1:5000,2:2000},apelo:0.10,desc:'A sala dos títulos aberta ao público.'}
};
const FF_PRECOS={1:[15,30,50],2:[10,20,35]};

function _hMini(s){return typeof _hashTxt==='function'?_hashTxt(s):0;}
function miniDono(){
  const e=typeof empresa==='function'?empresa():null;if(!e)return null;
  if(!e.mini)e.mini={colecoes:[],fanfest:null,patroc:null,crise:null,crises:[],pitch:null};
  e.mini.colecoes=e.mini.colecoes||[];e.mini.crises=e.mini.crises||[];
  return e.mini;
}
function _tierK(t){return t&&t.tier===1?1:2;}

/* ---------- uniforme ---------- */
function janelaUniforme(){
  const s=G.semana||1;
  const i=UNI_JANELAS.findIndex(([a,b])=>s>=a&&s<=b);
  return i<0?null:{i,chave:G.ano+'-'+i,ini:UNI_JANELAS[i][0],fim:UNI_JANELAS[i][1]};
}
function uniformeDisponivel(){
  const j=janelaUniforme();if(!j||!empresaAtiva())return null;
  if(empresa().loja<1)return null;
  return miniDono().colecoes.some(c=>c.chave===j.chave)?null:j;
}
/* a moda do ano: um modelo está em alta e outro em baixa */
function modaDoAno(){
  const ks=Object.keys(UNI_MODELOS),h=_hMini('moda|'+(G.seed||0)+'|'+G.ano);
  const alta=ks[h%ks.length];let baixa=ks[(h>>>4)%ks.length];if(baixa===alta)baixa=ks[(ks.indexOf(alta)+1)%ks.length];
  return{alta,baixa};
}
function apeloUniforme(o){
  const m=UNI_MODELOS[o.modelo]||UNI_MODELOS.classico, c=UNI_CORES[o.cores]||UNI_CORES.clube, moda=modaDoAno();
  let a=m.apelo*c.apelo;
  if(o.modelo===moda.alta)a*=o.modelo==='ousado'?1.45:1.25;
  if(o.modelo===moda.baixa)a*=o.modelo==='ousado'?0.6:0.82;
  return a;
}
function demandaUniforme(t,o){
  const k=_tierK(t),loja=empresa().loja||1;
  const preco=o.preco||UNI_PRECOS[k][1], ref=UNI_PRECOS[k][1];
  const base=(t.torcida||0)*(k===1?25:8)*(1+0.25*(loja-1));
  const bonus=typeof _bonusOrigem==='function'?_bonusOrigem('loja'):1;
  return Math.round(base*apeloUniforme(o)*Math.pow(ref/preco,1.4)*bonus);
}
/* a pesquisa com a torcida: uma faixa em volta da demanda, mais larga sem nota */
function pesquisaUniforme(t,o){const d=demandaUniforme(t,o);return{min:Math.round(d*0.8/50)*50,max:Math.round(d*1.2/50)*50};}
function lancarUniforme(o,delegado){
  const t=G.times[G.meuTime],j=uniformeDisponivel();
  if(!t||!j)return{ok:false,erro:'Fora da janela de lançamento (ou sem loja aberta).'};
  const k=_tierK(t);
  if(delegado){
    /* o gerente da loja: modelo clássico, cores do clube, preço do meio, tiragem pela demanda */
    o={modelo:'classico',cores:'clube',preco:UNI_PRECOS[k][1]};
    const d=demandaUniforme(t,o);o.tiragem=UNI_TIRAGENS[k].reduce((b,x)=>Math.abs(x-d)<Math.abs(b-d)?x:b,UNI_TIRAGENS[k][0]);
  }
  const custoU=UNI_CUSTO+((UNI_CORES[o.cores]||{}).custo||0);
  const custo=o.tiragem*custoU;
  if(t.caixa<custo)return{ok:false,erro:'A produção custa '+money(custo)+'.'};
  t.caixa-=custo;
  const c={chave:j.chave,ano:G.ano,ini:G.semana,modelo:o.modelo,cores:o.cores,preco:o.preco,tiragem:o.tiragem,custo,
    demanda:demandaUniforme(t,o),vendidos:0,receita:0,fim:false,delegado:!!delegado};
  miniDono().colecoes.unshift(c);miniDono().colecoes.length=Math.min(miniDono().colecoes.length,8);
  noticia('👕 O '+t.nome+' lança a coleção '+UNI_MODELOS[o.modelo].nome.toLowerCase()+' ('+UNI_CORES[o.cores].nome.toLowerCase()+') por '+money(o.preco)+'.',{c:'clube',t:[t.id]});
  return{ok:true,msg:'Coleção lançada: '+o.tiragem+' peças produzidas por '+money(custo)+'.'};
}
/* venda semana a semana: metade nas duas primeiras semanas */
const UNI_CURVA=[0.28,0.20,0.14,0.11,0.09,0.07,0.06,0.05];
function semanaUniformes(t){
  for(const c of miniDono().colecoes){
    if(c.fim)continue;
    const w=(G.ano*SEMANAS_ANO+G.semana)-(c.ano*SEMANAS_ANO+c.ini);
    if(w<0)continue;
    if(w>=UNI_SEMANAS){
      /* fim da coleção: o que sobrou vai para a liquidação a 30% */
      const sobra=c.tiragem-c.vendidos, liq=Math.round(sobra*c.preco*0.3);
      t.caixa+=liq;c.receita+=liq;c.sobra=sobra;c.fim=true;
      const lucro=c.receita-c.custo;
      const enc=sobra/c.tiragem;
      t.torcida=clamp((t.torcida||0)+(apeloUniforme(c)-1)*4-(c.preco>=UNI_PRECOS[_tierK(t)][3]?1:0)+(enc<0.1?1:0),0,TORCIDA_MAX);
      if(typeof empresa==='function')empresa().receitas.loja+=lucro;
      noticia('👕 Fim da coleção do '+t.nome+': '+c.vendidos+' peças vendidas'+(sobra?', '+sobra+' na liquidação':'')+' · '+(lucro>=0?'lucro':'prejuízo')+' de '+money(Math.abs(lucro))+'.',{c:'clube',t:[t.id]});
      continue;
    }
    const quer=Math.round(c.demanda*UNI_CURVA[w]);
    const v=Math.min(quer,c.tiragem-c.vendidos);
    c.vendidos+=v;c.receita+=v*c.preco;t.caixa+=v*c.preco;
    if(v<quer)c.esgotou=c.esgotou||G.semana;
  }
}

/* ---------- fan fest ---------- */
function fanFestDisponivel(){
  if(!empresaAtiva())return false;
  const f=miniDono().fanfest;
  return !(f&&f.ano===G.ano)&&(G.semana||1)<=48;
}
function custoFanFest(t,o){
  const k=_tierK(t),L=FF_LOCAIS[o.local]||FF_LOCAIS.pequena;
  return L.custo[k]+(o.atracoes||[]).reduce((s,a)=>s+((FF_ATRACOES[a]||{}).custo||{})[k]||0,0);
}
function demandaFanFest(t,o){
  const k=_tierK(t),preco=o.preco||FF_PRECOS[k][1];
  const titulos=(t.titulos||[]).length;
  const apelo=(o.atracoes||[]).reduce((s,a)=>s+(a==='trofeus'&&!titulos?0.02:(FF_ATRACOES[a]||{}).apelo||0),0);
  return Math.round((t.torcida||0)*(k===1?110:35)*(1+apelo)*Math.pow(FF_PRECOS[k][1]/preco,1.2));
}
/* nota 0..1 do dia (o jogo de ritmo, ou 0,5 se delegado) */
function realizarFanFest(o,nota,delegado){
  const t=G.times[G.meuTime];if(!t||!fanFestDisponivel())return{ok:false,erro:'O fan fest desta temporada já aconteceu.'};
  const k=_tierK(t),L=FF_LOCAIS[o.local]||FF_LOCAIS.pequena;
  const custo=custoFanFest(t,o);
  if(t.caixa<custo)return{ok:false,erro:'O evento custa '+money(custo)+'.'};
  nota=clamp(delegado?0.5:+nota||0,0,1);
  const dem=demandaFanFest(t,o);
  const publico=Math.min(L.cap[k],Math.round(dem*(0.8+0.4*nota)));
  const ocup=publico/L.cap[k];
  const receita=publico*o.preco+publico*(k===1?12:5);
  t.caixa+=receita-custo;
  const dt=(ocup>=0.7?2:ocup>=0.4?1:-1)+nota*3;
  t.torcida=clamp((t.torcida||0)+dt,0,TORCIDA_MAX);
  if((o.atracoes||[]).includes('autografos'))for(const id of t.elenco){const p=G.jogadores[id];if(p)p.moral=clamp(p.moral+0.02+nota*0.02,0.2,1);}
  const r={ano:G.ano,semana:G.semana,local:o.local,atracoes:o.atracoes||[],preco:o.preco,publico,cap:L.cap[k],ocup,receita,custo,lucro:receita-custo,torcida:Math.round(dt*10)/10,nota,delegado:!!delegado};
  miniDono().fanfest=r;
  if(typeof empresa==='function')empresa().receitas.eventos=(empresa().receitas.eventos||0)+r.lucro;
  noticia('🎪 Fan fest do '+t.nome+': '+publico+' pessoas na '+L.nome.toLowerCase()+(ocup>=0.95?' lotada':'')+'. '+(r.lucro>=0?'Lucro':'Prejuízo')+' de '+money(Math.abs(r.lucro))+'.',{c:'clube',t:[t.id],imp:2});
  return{ok:true,r,msg:publico+' pessoas, '+(r.lucro>=0?'lucro de ':'prejuízo de ')+money(Math.abs(r.lucro))+', torcida '+(dt>=0?'+':'')+dt.toFixed(1)+'.'};
}

/* ---------- pitch para investidores ----------
   Quatro perguntas; cada uma tem uma resposta ambiciosa, uma equilibrada
   e uma prudente. O que agrada depende do perfil do fundo. */
const PERFIS_INVEST={
  crescimento:{nome:'Fundo de crescimento',quer:'amb',dica:'Quer ouvir sobre escala, títulos e expansão.'},
  conservador:{nome:'Fundo conservador',quer:'pru',dica:'Quer ouvir sobre contas, risco e caixa.'},
  family:{nome:'Family office',quer:'equ',dica:'Quer um projeto equilibrado, sem loucura e sem medo.'}
};
const PERGUNTAS_PITCH=[
  ['Por que investir no {clube} agora?',{amb:'Porque em dois anos isso aqui vale o dobro. Vamos brigar por título.',equ:'Temos base sólida e espaço para crescer com o seu capital.',pru:'Porque as contas estão em dia e o risco é baixo.'}],
  ['O que vocês fazem com o dinheiro?',{amb:'Reforço de peso já na próxima janela.',equ:'Metade em elenco, metade em estrutura e marca.',pru:'Reserva de caixa e dívida mais curta.'}],
  ['E se a temporada for ruim?',{amb:'Não vai ser. Montamos para ganhar.',equ:'Temos plano B: a base e a marca seguram o valor.',pru:'O caixa aguenta dois anos ruins sem vender ninguém.'}],
  ['Qual retorno vocês prometem?',{amb:'O maior do circuito. Esports é crescimento.',equ:'Valorização constante, com dividendo quando der.',pru:'Pouco, mas certo. Dividendo todo ano.'}],
  ['Quem decide no dia a dia?',{amb:'Eu. Rápido e sem comitê.',equ:'Eu, com o conselho informado de tudo.',pru:'O conselho aprova as decisões grandes.'}],
  ['Vocês venderiam um craque para fechar as contas?',{amb:'Nunca. Craque é o que valoriza a marca.',equ:'Só se a proposta for muito acima do valor.',pru:'Sim. A saúde financeira vem primeiro.'}]
];
function perfilInvestidorDoTrimestre(){
  const ks=Object.keys(PERFIS_INVEST);
  return ks[_hMini('pitch|'+G.meuTime+'|'+G.ano+'|'+Math.ceil((G.semana||1)/13))%ks.length];
}
/* depois do pitch: ofertas com o preço mexido pela nota e a meta pelo tom */
function aplicarPitch(nota,tom){
  const r=typeof buscarInvestidores==='function'?buscarInvestidores():{ok:false};
  if(!r.ok)return r;
  const e=empresa();
  const meta=tom==='amb'?(G.times[G.meuTime].tier===1&&G.times[G.meuTime].prestigio>=75?'titulo':'posicao'):tom==='pru'?'lucro':'torcida';
  for(const o of e.ofertas){
    o.aporte=Math.round(o.aporte*(0.88+0.3*clamp(nota,0,1))/5000)*5000;
    if(!o.silencioso)o.meta=meta;
    o.pitch=true;
  }
  miniDono().pitch={ano:G.ano,nota,tom};
  return{ok:true,msg:e.ofertas.length+' proposta'+(e.ofertas.length>1?'s':'')+' na mesa depois do pitch.'};
}

/* ---------- mesa de patrocínio ---------- */
function mesaPatrocinioDisponivel(){
  if(!empresaAtiva())return null;
  const t=G.times[G.meuTime],c=typeof contratoDe==='function'?contratoDe(t,'master'):null;
  if(!c)return null;
  const p=miniDono().patroc;
  if(p&&p.ano===G.ano)return null;
  return c;
}
/* o máximo de aumento que a marca aceita (fração), escondido do jogador */
function tetoPatrocinio(t,c){
  const tor=(t.torcida||0)-((c.torcidaMin||0)+PATROC_QUEDA_TORCIDA);
  const tit=(t.titulos||[]).filter(x=>parseInt(String(x))>=G.ano-1).length;
  let k=0.04+Math.max(0,tor)*0.005+tit*0.05+((atratividade(t)||1)-1)*0.08;
  const o=G.manager&&G.manager.origem;
  if(o==='empresario')k+=0.06;
  if(o==='criador')k-=0.04;
  k+=((_hMini('mk|'+c.marca+'|'+G.ano)%100)/100-0.5)*0.06;
  return clamp(k,0.02,0.35);
}
function abrirMesaPatrocinio(){
  const t=G.times[G.meuTime],c=mesaPatrocinioDisponivel();
  if(!c)return null;
  const m=miniDono();
  if(!m.mesa||m.mesa.ano!==G.ano)m.mesa={ano:G.ano,paciencia:3,teto:tetoPatrocinio(t,c),hist:[],contra:null};
  return m.mesa;
}
/* pct: aumento pedido (0,10 = 10%); anos: temporadas a mais no contrato */
function proporPatrocinio(pct,anos){
  const t=G.times[G.meuTime],c=mesaPatrocinioDisponivel(),mesa=abrirMesaPatrocinio();
  if(!c||!mesa)return{ok:false,erro:'Não há o que negociar agora.'};
  pct=clamp(Math.round(pct*100)/100,0,0.6);anos=clamp(Math.round(anos||0),0,2);
  const mk=marca(c.marca);
  /* contrato mais longo vale para a marca: cada ano a mais abre 3 pontos */
  const teto=mesa.teto+anos*0.03;
  mesa.hist.push({de:'voce',txt:'Propomos +'+Math.round(pct*100)+'% no fixo'+(anos?' e mais '+anos+' temporada'+(anos>1?'s':'')+' de contrato':'')+'.'});
  if(pct<=teto){
    _fecharPatrocinio(t,c,pct,anos);
    mesa.hist.push({de:'marca',txt:'Fechado. A '+(mk?mk.nome:'marca')+' segue no peito do '+t.nome+'.'});
    return{ok:true,resposta:'aceita',msg:'Contrato renovado: +'+Math.round(pct*100)+'% no fixo.'};
  }
  const ofensa=pct>teto*1.8+0.05;
  mesa.paciencia-=ofensa?2:1;
  if(mesa.paciencia<=0){
    miniDono().patroc={ano:G.ano,pct:0,anos:0,falhou:true};
    mesa.hist.push({de:'marca',txt:ofensa?'Assim não dá. Mantemos o contrato como está.':'Não chegamos a um acordo. O contrato segue como está.'});
    return{ok:true,resposta:'encerrada',msg:'A marca encerrou a conversa. O contrato segue igual.'};
  }
  mesa.contra=Math.max(0,Math.round(teto*100-((_hMini(c.marca+'|'+mesa.paciencia)%3)))/100);
  mesa.contraAnos=anos;
  mesa.hist.push({de:'marca',txt:(ofensa?'Isso está muito acima do que o clube entrega. ':'')+'Podemos chegar a +'+Math.round(mesa.contra*100)+'%'+(anos?' com os '+anos+' anos a mais':'')+'.'});
  return{ok:true,resposta:'contra',valor:mesa.contra,msg:'Contraproposta: +'+Math.round(mesa.contra*100)+'%.'};
}
function _fecharPatrocinio(t,c,pct,anos){
  c.valor=Math.round(c.valor*(1+pct)/1000)*1000;
  c.fixo=Math.round(c.fixo*(1+pct)/1000)*1000;
  if(anos)c.ate=Math.max(c.ate||G.ano,G.ano)+anos;
  t.patroc=receitaCaixa(t);
  miniDono().patroc={ano:G.ano,pct,anos};
  noticia('🤝 '+(G.manager?G.manager.nome:'O dono')+' renova o máster do '+t.nome+': +'+Math.round(pct*100)+'% no fixo'+(anos?', contrato até '+c.ate:'')+'.',{c:'clube',t:[t.id]});
}
function delegarPatrocinio(){
  const t=G.times[G.meuTime],c=mesaPatrocinioDisponivel();if(!c)return{ok:false,erro:'Não há o que negociar agora.'};
  const pct=Math.round(tetoPatrocinio(t,c)*0.5*100)/100;
  _fecharPatrocinio(t,c,pct,0);
  return{ok:true,msg:'O diretor comercial fechou +'+Math.round(pct*100)+'% no fixo.'};
}

/* ---------- crise de imagem ---------- */
const CRISES={
  polemica:{nome:'Polêmica nas redes',txt:p=>`${p} publicou uma provocação pesada contra a torcida de um rival. O vídeo viralizou.`,
    perguntas:[['{p} vai ser punido?',['O clube não compactua com isso. Ele vai se desculpar e cumprir uma punição interna.','Vamos conversar com ele internamente.','Foi brincadeira. O pessoal leva tudo a sério demais.']],
      ['A torcida rival pede respeito. O que você diz a ela?',['Rivalidade é dentro do servidor. Peço desculpas em nome do clube.','Respeitamos todas as torcidas.','Eles provocaram primeiro.']],
      ['Isso afeta o vestiário?',['O grupo é maduro. Ele mesmo já reconheceu o erro.','Não comento o vestiário.','Afeta quem é fraco de cabeça.']]]},
  vazamento:{nome:'Vazamento de salários',txt:()=>`A folha salarial do clube vazou num portal. Jogadores descobriram quanto o colega ganha.`,
    perguntas:[['Os salários vazados são verdadeiros?',['Não comentamos valores, mas vamos apurar como isso saiu.','Sem comentários.','São, e todo mundo aqui ganha o que merece.']],
      ['Tem jogador insatisfeito depois disso?',['Conversei com cada um. Contrato é individual e todos sabem disso.','É natural ter algum desconforto.','Quem estiver insatisfeito pode procurar outro clube.']],
      ['O clube vai processar o portal?',['Nosso foco é proteger os jogadores, e o jurídico cuida do resto.','Estamos avaliando.','Vamos tirar esse portal do ar.']]]},
  briga:{nome:'Briga no treino',txt:p=>`Uma discussão no treino entre ${p} e um colega terminou em empurrão. Alguém gravou.`,
    perguntas:[['O que aconteceu no treino?',['Uma discussão que passou do ponto. Os dois já se acertaram.','Coisa de vestiário.','Quem não aguenta pressão não serve para esse clube.']],
      ['Algum dos dois vai sair?',['Não. Os dois sabem onde erraram e seguem com a gente.','Vamos avaliar.','Se acontecer de novo, rua.']],
      ['O ambiente está ruim?',['Está competitivo. A gente transforma isso em resultado.','Normal.','Ambiente ruim é de quem perde.']]]},
  patrocinador:{nome:'Marca incomodada',txt:p=>`Uma marca do clube reclamou publicamente de uma live de ${p} com linguagem ofensiva.`,
    perguntas:[['A marca pode sair?',['Já falamos com eles. O clube leva a parceria e a imagem a sério.','Vamos conversar com a marca.','Se quiser sair, tem fila de patrocinador.']],
      ['{p} vai continuar fazendo live?',['Vai, com orientação da nossa equipe de conteúdo.','Isso é com ele.','Live é dele, ele fala o que quiser.']],
      ['Qual o recado para os patrocinadores?',['Que a nossa marca tem regras, e elas valem para todos.','Seguimos parceiros.','Patrocinador entra sabendo como é esporte.']]]}
};
function crisePendente(){
  if(!empresaAtiva())return null;
  const c=miniDono().crise;
  return c&&!c.fim?c:null;
}
function _sortearCrise(t){
  const m=miniDono();
  if(m.crise&&!m.crise.fim)return;
  const ult=m.crises[0];
  if(ult&&(G.ano*SEMANAS_ANO+G.semana)-(ult.ano*SEMANAS_ANO+ult.semana)<14)return;
  const h=_hMini('crise|'+t.id+'|'+G.ano+'|'+G.semana);
  if(h%100>=5)return;
  const tipos=Object.keys(CRISES), tipo=tipos[(h>>>7)%tipos.length];
  const el=(t.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const p=el.length?el[(h>>>11)%el.length]:null;
  m.crise={tipo,ano:G.ano,semana:G.semana,ate:G.ano*SEMANAS_ANO+G.semana+2,jogador:p?p.id:null,nome:p?p.nome:'um jogador',fim:false};
  noticia('🔥 '+CRISES[tipo].nome+' no '+t.nome+': '+CRISES[tipo].txt(p?p.nome:'um jogador'),{c:'clube',t:[t.id],imp:3});
  G.criseNova=true;
}
/* nota 0..1 da coletiva (0,5 delegado; 0,25 se ninguém respondeu) */
function resolverCrise(nota,como){
  const t=G.times[G.meuTime],c=crisePendente();if(!t||!c)return null;
  nota=clamp(nota,0,1);
  const dt=Math.round((nota*5-3)*10)/10;            /* −3 a +2 */
  const multa=Math.round((1-nota)*(t.patroc||0)*0.03/1000)*1000;
  t.torcida=clamp((t.torcida||0)+dt,0,TORCIDA_MAX);
  t.caixa-=multa;
  const e=empresa();e.humor=clamp(e.humor+Math.round(nota*6-4),0,100);
  const p=c.jogador&&G.jogadores[c.jogador];
  if(p)p.moral=clamp(p.moral+(nota>=0.6?0.02:-0.05),0.2,1);
  c.fim=true;c.nota=nota;c.como=como;c.efeito={torcida:dt,multa};
  miniDono().crises.unshift(c);miniDono().crises.length=Math.min(miniDono().crises.length,10);
  miniDono().crise=null;
  noticia(nota>=0.6?'🧯 A resposta do '+t.nome+' apagou o incêndio: a crise passou.':nota>=0.35?'🧯 A crise no '+t.nome+' esfria, mas deixa marca.':'🔥 A resposta do '+t.nome+' piorou tudo: a crise cresce.',{c:'clube',t:[t.id],imp:2});
  return c.efeito;
}
function semanaMiniDono(t){
  if(!t||t.id!==G.meuTime||!empresaAtiva())return;
  semanaUniformes(t);
  const c=crisePendente();
  if(c&&G.ano*SEMANAS_ANO+G.semana>c.ate)resolverCrise(0.25,'ignorada');
  else _sortearCrise(t);
}
/* o que está esperando o dono, para a Central */
function agendaDoDono(){
  if(!empresaAtiva())return[];
  const out=[];
  const cr=crisePendente();if(cr)out.push({id:'crise',urg:true,txt:CRISES[cr.tipo].nome+': responda antes de a crise crescer.'});
  const u=uniformeDisponivel();if(u)out.push({id:'uniforme',txt:'Janela de lançamento de uniforme aberta até a semana '+u.fim+'.'});
  if(fanFestDisponivel())out.push({id:'fanfest',txt:'O fan fest desta temporada ainda não aconteceu.'});
  if(mesaPatrocinioDisponivel())out.push({id:'patroc',txt:'O máster pode ser renegociado nesta temporada.'});
  return out;
}
