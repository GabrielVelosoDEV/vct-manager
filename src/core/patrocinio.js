/* ============================================================
   PATROCÍNIO COM METAS — contrato fixo + bônus
   ------------------------------------------------------------
   Antes cada vaga pagava um valor fixo por temporada. Agora o contrato
   tem duas partes, sobre o valor de tabela da vaga (valorContrato):

     FIXO   80% (Challengers 90%) — garantido;
     BÔNUS  até 40% (Challengers 25%) — repartido entre duas ou três
            metas que a marca escolhe pelo próprio perfil.

   Quem cumpre tudo recebe mais do que antes; quem não cumpre nada,
   menos. A marca ADIANTA 45% do bônus ao longo da temporada (perto do
   que as metas pagam na média do circuito) e na virada faz o acerto:
   paga o que faltou ou desconta o que adiantou demais — sem encostar na
   reserva do clube (uma temporada de folha), porque marca nenhuma quebra
   o clube que leva o nome dela. Assim o caixa semana a semana se comporta como antes, e
   o resultado das metas aparece de uma vez, na virada certa.

   O contrato dura uma ou duas temporadas. Rebaixamento ou torcida
   abaixo do piso combinado dão à marca o direito de sair no fim da
   temporada — e ela sai.

   Metas e duração são sorteadas num gerador local (comSorteioLocal,
   core/poscarreira.js): o motor não anda por causa delas.
   ============================================================ */
/* Challengers vive com margem curta: lá o contrato é mais fixo (90% + até
   25%), para um ano ruim de metas não quebrar o clube. */
const PATROC_PARTES={1:{fixo:0.80,bonus:0.40},2:{fixo:0.90,bonus:0.25}};
/* parte do bônus adiantada semana a semana (e a que o planejamento conta) */
const PATROC_ADIANTAMENTO=0.45;
function partesDe(t){return PATROC_PARTES[t.tier]||PATROC_PARTES[1];}
const PATROC_QUEDA_TORCIDA=12;   /* pontos de torcida abaixo do início que liberam a saída */

/* Setor → o que a marca quer ver. Tecnologia quer palco e resultado;
   consumo quer audiência e barulho; corporativo quer resultado e marca. */
const SETOR_TECH=new Set(['Periféricos','Hardware','Computadores','Cadeiras','Áudio','Games','Software','Eletrônicos','Streaming','Nuvem','Plataforma','Telecom']);
const SETOR_CONSUMO=new Set(['Bebida','Energético','Alimentos','Alimentação','Snacks','Doces','Laticínios','Delivery','Varejo','E-commerce','Cosméticos','Vestuário','Esporte','Colecionáveis']);
function pesosDeMetas(mk){
  if(SETOR_TECH.has(mk.setor))return{liga:3,masters:2.5,champions:2,titulo:2,selecao:2,torcida:0.8,classico:0.8,aproveitamento:1.5,playoffs:2};
  if(SETOR_CONSUMO.has(mk.setor))return{liga:1.5,masters:1,champions:1,titulo:1.5,selecao:0.8,torcida:3,classico:2.5,aproveitamento:1,playoffs:1};
  return{liga:2.5,masters:2,champions:1.5,titulo:2.5,selecao:1,torcida:1.6,classico:1,aproveitamento:2,playoffs:1.5};
}

/* Onde o clube "deveria" terminar pela força (prestígio) dentro da liga dele. */
function rankNaLiga(t){
  const liga=Object.values(G.times).filter(x=>x.regiao===t.regiao&&x.tier===t.tier)
    .sort((a,b)=>b.prestigio-a.prestigio||(a.id<b.id?-1:1));
  return{r:liga.indexOf(t)+1,n:liga.length};
}
/* Metas possíveis para este clube, já com o alvo ajustado ao tamanho dele:
   ninguém pede título ao lanterna nem top 8 ao campeão. */
function metasPossiveis(t,mk){
  const{r,n}=rankNaLiga(t);
  const op=[];
  /* no Challengers a força pesa menos (todo mundo tem o mesmo prestígio):
     a meta de posição dá mais folga */
  const topN=t.tier===1?clamp(r<=2?2:r<=4?4:Math.ceil(r*0.75+1),2,Math.max(2,n-2))
                       :clamp(r<=2?3:Math.ceil(r*0.75+2),3,Math.max(3,n-2));
  op.push({tipo:'liga',alvo:topN,txt:'Terminar entre os '+topN+' da liga'});
  if(t.tier===1){
    if(r<=Math.ceil(n*0.6))op.push({tipo:'masters',alvo:1,txt:'Classificar para um Masters'});
    if(r<=Math.ceil(n*0.35))op.push({tipo:'champions',alvo:1,txt:'Chegar ao Champions'});
  }
  const ap=r<=Math.ceil(n/3)?60:r<=Math.ceil(n*2/3)?50:40;
  op.push({tipo:'aproveitamento',alvo:ap,txt:'Vencer '+ap+'% das séries do ano'});
  if(r>2)op.push({tipo:'playoffs',alvo:1,txt:'Chegar aos playoffs de um stage da liga'});
  if(r<=Math.max(3,Math.ceil(n*0.3)))op.push({tipo:'titulo',alvo:1,txt:t.tier===1?'Ganhar um título (liga ou internacional)':'Ganhar um split do Challengers'});
  if(t.tier===1&&r<=Math.ceil(n*0.5))op.push({tipo:'selecao',alvo:1,txt:'Ter um jogador na seleção do ano'});
  const tor=Math.round(t.torcida||0);
  const sobe=t.tier===1?Math.max(3,Math.round(tor*0.08)):Math.max(2,Math.round(tor*0.06));
  op.push({tipo:'torcida',alvo:tor+sobe,ini:tor,txt:'Fazer a torcida chegar a '+(tor+sobe)});
  op.push({tipo:'classico',alvo:1,txt:'Vencer um clássico'});
  /* marca de um país: quer ver gente da casa no elenco */
  if(mk.regiao&&mk.regiao!=='GLOBAL'&&mk.paises&&mk.paises.length){
    const nomes=mk.paises.length<=2&&typeof PAISES!=='undefined'?mk.paises.map(c=>PAISES[c]||c).join(' ou '):'da área da marca';
    op.push({tipo:'regional',alvo:2,paises:mk.paises.slice(),txt:'Manter dois jogadores de '+nomes+' no elenco',peso:3});
  }
  return op;
}
/* metas que as outras marcas do clube já pedem neste ano: cada marca puxa
   para o seu lado, em vez de as três pedirem a mesma coisa */
function metasJaPedidas(t,ano,vagaId){
  const s=new Set();
  for(const v of VAGAS){if(v.id===vagaId)continue;const c=t.contratos&&t.contratos[v.id];
    if(c&&c.ano===ano)for(const m of c.metas||[])s.add(m.tipo);}
  return s;
}
function sortearMetas(t,mk,valor,ano,vagaId){
  const ja=metasJaPedidas(t,ano,vagaId);
  return comSorteioLocal('metas|'+t.id+'|'+mk.id+'|'+ano,()=>{
    const pesos=pesosDeMetas(mk);
    let op=metasPossiveis(t,mk);
    const n=mk.nivel>=3?3:2;
    const escolhidas=[];
    while(escolhidas.length<n&&op.length){
      const w=op.map(m=>(m.peso||pesos[m.tipo]||1)*(ja.has(m.tipo)?0.15:1));
      let x=rnd()*w.reduce((s,v)=>s+v,0),k=0;
      for(;k<op.length-1;k++){x-=w[k];if(x<=0)break;}
      escolhidas.push(op[k]);
      /* masters e champions juntos pedem duas vezes a mesma coisa */
      const tipo=op[k].tipo;
      op=op.filter((m,i)=>i!==k&&!((tipo==='champions'&&m.tipo==='masters')||(tipo==='masters'&&m.tipo==='champions')));
    }
    const pote=Math.round(valor*partesDe(t).bonus/1000)*1000;
    return escolhidas.map(m=>Object.assign({},m,{valor:Math.round(pote/escolhidas.length/1000)*1000}));
  });
}
/* adiantamento do bônus para a temporada: a taxa do próprio clube */
function adiantamentoDe(t,metas){return Math.round((metas||[]).reduce((x,m)=>x+m.valor,0)*PATROC_ADIANTAMENTO/1000)*1000;}
function novoContrato(t,mk,vagaId,ano){
  const valor=valorContrato(mk,t,vagaId);
  const anos=comSorteioLocal('dur|'+t.id+'|'+mk.id+'|'+ano,()=>rnd()<0.5?1:2);
  const tor=Math.round(t.torcida||0);
  return _comAdiantamento(t,{marca:mk.id,vaga:vagaId,valor,fixo:Math.round(valor*partesDe(t).fixo/1000)*1000,de:ano,ate:ano+anos-1,
    torcidaMin:Math.max(typeof pisoTorcida==='function'?pisoTorcida(t):0,tor-PATROC_QUEDA_TORCIDA),
    clausulaRebaixamento:t.tier===1,ano,metas:sortearMetas(t,mk,valor,ano,vagaId),adiant:0});
}
function _comAdiantamento(t,c){c.adiant=adiantamentoDe(t,c.metas);return c;}
/* contrato que segue para mais uma temporada: metas novas, mesmo valor */
function renovarMetas(t,c,ano){
  const mk=marca(c.marca);if(!mk)return;
  c.ano=ano;c.metas=sortearMetas(t,mk,c.valor,ano,c.vaga);_comAdiantamento(t,c);
}
function contratoDe(t,vagaId){
  const c=t.contratos&&t.contratos[vagaId];
  return c&&t.patrocinios&&t.patrocinios[vagaId]===c.marca?c:null;
}

/* ---------- metas: onde estão ---------- */
function _noTorneio(t,re){
  for(const b of G.calendario||[])for(const s of b.stages||[])
    if(re.test(s.torneioId||'')&&((s.times||[]).includes(t.id)||(s.ranking||[]).includes(t.id)))return true;
  return false;
}
/* As vagas do torneio já foram todas definidas? Os blocos só montam os
   stages quando começam, então "fechado" é: todo bloco daquele torneio já
   montou o seu. Antes disso a meta continua em aberto. */
const BLOCOS_DO_TORNEIO={masters:['m1Suico','m1PO','m2Suico','m2PO'],champions:['chGrupos','chPO'],
  playoffs:['kickPO','po1','po2']};
function _torneioFechado(tipo){
  const ms=BLOCOS_DO_TORNEIO[tipo]||[];
  const bs=(G.calendario||[]).filter(b=>ms.includes(b.montar));
  return bs.length>0&&bs.every(b=>(b.stages||[]).length>0);
}
/* {estado:'ok'|'andamento'|'perdida', txt, prog 0..1}. Lê o ano em curso. */
function avaliarMetaPatroc(t,m,final){
  const reg=(G.premios||[]).find(r=>r.ano===G.ano);
  switch(m.tipo){
    case 'liga':{
      const p=typeof posicaoNoAno==='function'?posicaoNoAno(t).pos:posicaoNaLiga(t).pos;
      const ok=p&&p<=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:p?p+'º agora':'—',prog:p?clamp((m.alvo+1-p)/m.alvo+0.5,0,1):0,bom:ok};
    }
    case 'masters':case 'champions':{
      const re=m.tipo==='masters'?/^masters/:/^champions$/;
      if(_noTorneio(t,re))return{estado:'ok',txt:'classificado',prog:1,bom:true};
      const fechado=_torneioFechado(m.tipo);
      return{estado:final||fechado?'perdida':'andamento',txt:fechado||final?'ficou de fora':'em disputa',prog:0};
    }
    case 'aproveitamento':{
      const c=t.temporada||{v:0,d:0},j=c.v+c.d,pct=j?Math.round(c.v/j*100):0,ok=j>=6&&pct>=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:j?pct+'% ('+c.v+'–'+c.d+')':'sem séries',prog:clamp(pct/m.alvo,0,1),bom:ok};
    }
    case 'playoffs':{
      let ok=false;
      for(const b of G.calendario||[])for(const s of b.stages||[]){
        if(s.regiao==='INT'||!(s.tipo==='de'||s.tipo==='ko'))continue;
        if(s.regiao!==t.regiao||s.tier!==t.tier||/^asc/.test(s.id))continue;
        if((s.times||[]).length&&(s.times||[]).length<(G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).length&&(s.times||[]).includes(t.id))ok=true;
      }
      const aberto=!_torneioFechado('playoffs');
      return{estado:ok?'ok':final||!aberto?'perdida':'andamento',txt:ok?'classificado':aberto?'em disputa':'ficou de fora',prog:ok?1:0,bom:ok};
    }
    case 'titulo':{
      const n=(G.historico||[]).filter(h=>h&&h.ano===G.ano&&h.timeId===t.id).length;
      return{estado:n?'ok':final?'perdida':'andamento',txt:n?n+' título'+(n>1?'s':''):'nenhum ainda',prog:n?1:0,bom:!!n};
    }
    case 'selecao':{
      if(!reg)return{estado:final?'perdida':'andamento',txt:'sai na virada',prog:0};
      const ok=(reg.selecao||[]).some(f=>f.timeId===t.id);
      return{estado:ok?'ok':'perdida',txt:ok?'na seleção':'ninguém na seleção',prog:ok?1:0};
    }
    case 'torcida':{
      const v=Math.round(t.torcida||0),ok=v>=m.alvo;
      return{estado:final?(ok?'ok':'perdida'):'andamento',txt:v+' de '+m.alvo,prog:clamp((v-(m.ini||0))/Math.max(1,m.alvo-(m.ini||0)),0,1),bom:ok};
    }
    case 'classico':{
      const n=t.classicos&&t.classicos.ano===G.ano?t.classicos.n:0;
      return{estado:n?'ok':final?'perdida':'andamento',txt:n?n+' vencido'+(n>1?'s':''):'nenhum ainda',prog:n?1:0,bom:!!n};
    }
    case 'regional':{
      const n=(t.elenco||[]).filter(id=>G.jogadores[id]&&(m.paises||[]).includes(G.jogadores[id].pais)).length;
      return{estado:final?(n>=m.alvo?'ok':'perdida'):'andamento',txt:n+' de '+m.alvo,prog:clamp(n/m.alvo,0,1),bom:n>=m.alvo};
    }
  }
  return{estado:'andamento',txt:'',prog:0};
}

/* ---------- metas cumpridas e acerto ---------- */
/* Na semana em que sai — título, vaga em internacional, playoffs,
   clássico — a meta fica cumprida e a notícia sai na hora; o dinheiro entra
   no acerto da virada. */
const METAS_NA_HORA=new Set(['titulo','masters','champions','classico','playoffs']);
function _registroAno(t){return (t.patrocAno&&t.patrocAno.ano===G.ano)?t.patrocAno:(t.patrocAno={ano:G.ano,bonus:0,ok:0,n:0,acerto:0});}
function pagarMetasDaSemana(){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c||c.ano!==G.ano)continue;
      for(const m of c.metas||[]){
        if(m.pago!=null||!METAS_NA_HORA.has(m.tipo))continue;
        if(avaliarMetaPatroc(t,m,false).estado!=='ok')continue;
        m.pago=m.valor;
        const h=_registroAno(t);h.bonus+=m.valor;h.ok++;h.n++;
        if(t.id===G.meuTime){const mk=marca(c.marca);
          noticia('💼 Meta de patrocínio cumprida: '+m.txt.toLowerCase()+' — '+money(m.valor)+' de '+(mk?mk.nome:'bônus')+' no acerto da virada.',{c:'clube',t:[t.id]});}
      }
    }
  }
}
/* Fase 1 (começo da virada, campanha ainda intacta): confere as metas de
   resultado. Fase 2 (depois da torcida da virada): a meta de torcida e o
   acerto com cada marca. */
function pagarMetasPatrocinio(fase){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    const h=_registroAno(t);
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c||c.ano!==G.ano)continue;
      for(const m of c.metas||[]){
        if(m.pago!=null)continue;
        if(fase===1&&m.tipo==='torcida')continue;
        const a=avaliarMetaPatroc(t,m,true);
        m.pago=a.estado==='ok'?m.valor:0;
        h.bonus+=m.pago;h.n++;if(m.pago)h.ok++;
      }
    }
    if(fase!==2)continue;
    /* acerto: o que as metas pagaram menos o que a marca adiantou. Desconto
       só até onde o caixa alcança — a marca não quebra o clube por isso. */
    let adiant=0;
    for(const v of VAGAS){const c=contratoDe(t,v.id);if(c&&c.ano===G.ano)adiant+=c.adiant||0;}
    let acerto=h.bonus-adiant;
    /* o desconto respeita a reserva do clube (uma temporada de folha): marca
       nenhuma empurra para a crise o clube que leva o nome dela */
    const folga=Math.max(0,t.caixa-(typeof reservaMinima==='function'?reservaMinima(t):0));
    if(acerto<0)acerto=-Math.min(-acerto,folga);
    t.caixa+=acerto;h.acerto=acerto;
    if(t.id===G.meuTime&&h.n)
      noticia('💼 Metas de patrocínio de '+G.ano+': '+h.ok+' de '+h.n+' cumpridas, '+money(h.bonus)+' em bônus. '+
        (acerto>=0?'Acerto com as marcas: +'+money(acerto)+'.':'As marcas descontaram '+money(-acerto)+' do que tinham adiantado.'),{c:'clube',t:[t.id],imp:2});
  }
}
/* Fase 2, depois da torcida: cláusulas de saída. A marca que tem o direito
   sai; o contrato que chegou ao fim também. atribuirPatrocinios preenche. */
function clausulasDeSaida(){
  for(const id in G.times){
    const t=G.times[id];if(!t.contratos)continue;
    for(const v of VAGAS){
      const c=contratoDe(t,v.id);if(!c)continue;
      const caiu=c.clausulaRebaixamento&&(t.tierAno||1)===1&&t.tier===2;
      /* subiu de divisão: o contrato de Challengers não paga uma operação de
         Tier 1, e a marca renegocia — a vaga volta para a mesa na virada */
      if((t.tierAno||t.tier)===2&&t.tier===1&&c.ate>G.ano){c.ate=G.ano;c.saida='acesso';continue;}
      const torcida=(t.torcida||0)<c.torcidaMin;
      if((caiu||torcida)&&c.ate>G.ano){
        c.ate=G.ano;c.saida=caiu?'rebaixamento':'torcida';
        const mk=marca(c.marca);
        if(t.id===G.meuTime)noticia('📉 '+(mk?mk.nome:'O patrocinador')+' usou a cláusula de saída ('+(caiu?'rebaixamento':'torcida abaixo do combinado')+') e deixa o clube no fim da temporada.',{c:'clube',t:[t.id],imp:2});
      }
    }
  }
}
/* aviso para a tela de Finanças: cláusula que pode disparar */
function riscoDeClausula(t,c){
  if(!c)return null;
  if(c.ate<=G.ano)return null;
  if(c.clausulaRebaixamento&&t.tier===1){
    const p=typeof posicaoNoAno==='function'?posicaoNoAno(t):null;
    if(p&&p.pos>=p.de-1&&(t.temporada&&t.temporada.v+t.temporada.d>=4))return 'O clube está na zona de rebaixamento: cair dá à marca o direito de sair.';
  }
  if((t.torcida||0)<c.torcidaMin+4)return 'A torcida está perto do piso do contrato ('+c.torcidaMin+'): abaixo dele a marca pode sair.';
  return null;
}
/* Receita do ano em três cenários, para a tela de Finanças. */
function cenariosPatrocinio(t){
  let fixo=0,atual=0,tudo=0;
  for(const v of VAGAS){
    const c=contratoDe(t,v.id);if(!c)continue;
    fixo+=c.fixo;tudo+=c.fixo;atual+=c.fixo;
    for(const m of c.metas||[]){
      tudo+=m.valor;
      const a=m.pago!=null?{estado:m.pago?'ok':'perdida'}:avaliarMetaPatroc(t,m,false);
      if(a.estado==='ok'||(a.estado==='andamento'&&a.bom))atual+=m.valor;
    }
  }
  return{fixo,atual,tudo};
}
