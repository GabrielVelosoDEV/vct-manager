/* ============================================================
   O PROJETO DO CLUBE — a visão de três temporadas
   ------------------------------------------------------------
   As metas da diretoria olhavam um ano por vez. O projeto é o
   que o clube quer SER: revelar talentos, ganhar agora, ter a
   cara do país, crescer com as contas em dia, ou subir para o
   Tier 1. Você escolhe entre as propostas da diretoria (uma vem
   recomendada pelo perfil do clube), e ele dura três temporadas.

   Três coisas acompanham o projeto:
   · METAS — umas valem todo ano, outras para o ciclo inteiro. O
     balanço sai na virada de cada temporada e mexe na confiança
     da diretoria; o veredito do ciclo mexe mais.
   · TORCIDA — ela sabe qual é o projeto e cobra coerência. Projeto
     de jovens com titular veterano e sem potencial vira crítica;
     projeto de título com elenco fraco vira cobrança por craque.
   · ALINHAMENTO — um número de −1 a 1, à vista na tela, que diz se
     o elenco de hoje combina com o que o clube prometeu.

   Leitura pura (estadoProjeto, alinhamentoProjeto) não muda nada:
   a tela pergunta à vontade. Só a virada de temporada escreve.
   ============================================================ */
const PROJETO_ANOS=3;

const PROJETOS={
  jovens:{nome:'Revelar talentos',ic:'broto',
    desc:'Elenco jovem, minutos para quem tem potencial e venda de promessas valorizadas.',
    torcida:'jovens com potencial em quadra'},
  titulos:{nome:'Vencer agora',ic:'trofeu',
    desc:'O clube investe para ganhar já: Champions todo ano e um título grande no ciclo.',
    torcida:'craques e título'},
  nacional:{nome:'Identidade da casa',ic:'bandeira',
    desc:'Um time com a cara do país: maioria de jogadores da casa e cria da base entre os titulares.',
    torcida:'jogadores da casa em quadra'},
  sustentavel:{nome:'Crescer com as contas em dia',ic:'dinheiro2',
    desc:'Caixa crescendo, folha saudável e estrutura melhor ao fim do ciclo.',
    torcida:'um clube que não quebra'},
  acesso:{nome:'Rumo ao Tier 1',ic:'sobe',
    desc:'Brigar no topo do Challengers e subir para a liga principal.',
    torcida:'acesso'}
};

function projetoAtivo(){
  const p=G&&G.projeto;
  return p&&!p.encerrado&&p.clubeId===G.meuTime?p:null;
}
function _somaEstrutura(t){
  return (typeof DEPTOS!=='undefined'?DEPTOS:[]).reduce((s,d)=>s+(typeof nivelEst==='function'?nivelEst(t,d.id):0),0);
}
function _idadeMediaTit(t){
  const ps=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  return ps.length?ps.reduce((s,p)=>s+p.idade,0)/ps.length:0;
}
function _overMedioTit(t){
  const ps=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  return ps.length?ps.reduce((s,p)=>s+over(p),0)/ps.length:0;
}
function _nacionaisTit(t){
  const pais=typeof paisDoClube==='function'?paisDoClube(t):null;
  return pais?(t.titulares||[]).map(i=>G.jogadores[i]).filter(p=>p&&p.pais===pais).length:0;
}
/* mapas na temporada: na virada o contador já foi para o histórico */
function _mapasNoAno(p){
  const vivo=(p.temp&&p.temp.maps)||0;
  if(vivo)return vivo;
  const h=(p.hist||[]).filter(x=>x.ano===G.ano).pop();
  return (h&&h.maps)||0;
}
function _foiAoChampions(t){
  for(const b of G.calendario||[])for(const s of b.stages||[])
    if(s.regiao==='INT'&&/champions/i.test(String(s.torneioId||s.nome||''))&&(s.times||[]).includes(t.id))return true;
  return false;
}
function _tituloGrande(t,desde){
  return (t.titulos||[]).some(x=>parseInt(x,10)>=desde&&/masters|champions/i.test(String(x)));
}
function _gentilico(t){
  const pais=typeof paisDoClube==='function'?paisDoClube(t):null;
  return pais&&typeof PAISES!=='undefined'&&PAISES[pais]?'da casa ('+PAISES[pais]+')':'da casa';
}

/* ---------- as metas de cada projeto ----------
   tipo 'ano' é conferida em toda virada; 'ciclo' só conta no fim, mas a tela
   mostra o andamento. checar(t,proj) devolve {ok, txt}. */
function metasDoProjeto(id,t){
  const L={
    jovens:[
      {id:'idade',tipo:'ano',texto:'Titulares com média de idade de até 23 anos',
        checar:t=>{const m=_idadeMediaTit(t);return{ok:m<=23,txt:'média '+m.toFixed(1)+' anos'};}},
      {id:'minutos',tipo:'ano',texto:'Dois jogadores de até 21 anos com 20 mapas ou mais na temporada',
        checar:t=>{const n=(t.elenco||[]).map(i=>G.jogadores[i]).filter(p=>p&&p.idade<=21&&_mapasNoAno(p)>=20).length;
          return{ok:n>=2,txt:n+' de 2'};}},
      {id:'venda',tipo:'ciclo',texto:'Vender uma promessa (até 22 anos) por 500 mil ou mais',
        checar:(t,pj)=>{const v=(G.transferencias||[]).filter(x=>x.de===t.id&&x.taxa>=500000&&x.ano>=pj.inicio
            &&G.jogadores[x.jogadorId]&&G.jogadores[x.jogadorId].idade-(G.ano-x.ano)<=22);
          return{ok:v.length>0,txt:v.length?v[0].nome+' por '+money(v[0].taxa):'nenhuma ainda'};}}
    ],
    titulos:[
      {id:'top',tipo:'ano',texto:'Terminar a liga entre os 3 primeiros',
        checar:t=>{const{pos,de}=posicaoNaLiga(t);return{ok:pos<=3,txt:pos+'º de '+de};}},
      {id:'champions',tipo:'ano',texto:'Jogar o Champions',
        checar:t=>{const ok=_foiAoChampions(t);return{ok,txt:ok?'classificado':'fora'};}},
      {id:'grande',tipo:'ciclo',texto:'Ganhar um Masters ou o Champions',
        checar:(t,pj)=>{const ok=_tituloGrande(t,pj.inicio);return{ok,txt:ok?'conquistado':'ainda não'};}}
    ],
    nacional:[
      {id:'nacionais',tipo:'ano',texto:'Pelo menos 3 titulares '+_gentilico(t),
        checar:t=>{const n=_nacionaisTit(t);return{ok:n>=3,txt:n+' de 3'};}},
      {id:'cria',tipo:'ciclo',texto:'Um cria da base entre os titulares',
        checar:t=>{const n=(t.titulares||[]).map(i=>G.jogadores[i]).filter(p=>p&&p.daCasa===t.id).length;return{ok:n>=1,txt:n?n+' em quadra':'nenhum'};}},
      {id:'meio',tipo:'ano',texto:'Terminar a liga na metade de cima',
        checar:t=>{const{pos,de}=posicaoNaLiga(t);return{ok:pos<=Math.ceil(de/2),txt:pos+'º de '+de};}}
    ],
    sustentavel:[
      {id:'caixa',tipo:'ano',texto:'Fechar a temporada com mais caixa do que começou',
        checar:(t,pj)=>{const ref=(pj.caixaAno!=null?pj.caixaAno:pj.base.caixa);return{ok:t.caixa>=ref,txt:money(t.caixa)+' (era '+money(ref)+')'};}},
      {id:'folha',tipo:'ano',texto:'Folha dentro do teto saudável',
        checar:t=>{const f=typeof folgaSalarial==='function'?folgaSalarial(t):0;return{ok:f>0,txt:f>0?'folga de '+money(f)+'/mês':'acima do teto'};}},
      {id:'estrutura',tipo:'ciclo',texto:'Subir a estrutura em 3 níveis somados',
        checar:(t,pj)=>{const d=_somaEstrutura(t)-pj.base.estrutura;return{ok:d>=3,txt:(d>=0?'+':'')+d+' de 3'};}}
    ],
    acesso:[
      {id:'top2',tipo:'ano',texto:'Terminar o Challengers entre os 2 primeiros',
        checar:t=>{const{pos,de}=posicaoNaLiga(t);return{ok:t.tier===1||pos<=2,txt:t.tier===1?'já no Tier 1':pos+'º de '+de};}},
      {id:'tier1',tipo:'ciclo',texto:'Chegar ao Tier 1',
        checar:t=>({ok:t.tier===1,txt:t.tier===1?'no Tier 1':'ainda no Challengers'})}
    ]
  };
  return L[id]||[];
}

/* As propostas da diretoria, a mais coerente com o clube primeiro. */
function projetosParaClube(t){
  t=t||G.times[G.meuTime];if(!t)return[];
  const nota={
    jovens:(23.5-_idadeMediaTit(t))*2+((t.elenco||[]).filter(i=>G.jogadores[i]&&G.jogadores[i].pot-over(G.jogadores[i])>=6).length)+nivelEst(t,'academia'),
    titulos:t.tier===1?(_overMedioTit(t)-80)*0.8+(t.prestigio-70)*0.15+((t.bolso||1)-1)*6:-99,
    nacional:_nacionaisTit(t)*2+(typeof fanatismoDe==='function'?fanatismoDe(t)*4:0),
    sustentavel:(t.caixa<(t.patroc||0)*0.4?6:0)+((t.bolso||1)<1?4:0)+1,
    acesso:t.tier===2?12:-99
  };
  return Object.keys(PROJETOS).filter(k=>nota[k]>-50).sort((a,b)=>nota[b]-nota[a])
    .map((k,i)=>({id:k,...PROJETOS[k],recomendado:i===0,metas:metasDoProjeto(k,t).map(m=>({texto:m.texto,tipo:m.tipo}))}));
}
function escolherProjeto(id){
  const t=G.times[G.meuTime];
  if(!t||!PROJETOS[id])return{ok:false,erro:'Projeto inválido.'};
  if(projetoAtivo())return{ok:false,erro:'O clube já tem um projeto em andamento.'};
  const recomendado=(projetosParaClube(t)[0]||{}).id===id;
  G.projeto={id,clubeId:t.id,inicio:G.ano,fim:G.ano+PROJETO_ANOS-1,recomendado,
    base:{caixa:t.caixa,estrutura:_somaEstrutura(t)},caixaAno:t.caixa,anos:[],encerrado:false};
  delete G.projetoPendente;
  noticia('🏛 '+t.nome+' apresenta o projeto "'+PROJETOS[id].nome+'" para as próximas '+PROJETO_ANOS+' temporadas. A torcida quer '+PROJETOS[id].torcida+'.',{c:'clube',t:[t.id],imp:2});
  return{ok:true,msg:'Projeto "'+PROJETOS[id].nome+'" definido até '+G.projeto.fim+'.'};
}
/* O andamento agora, sem mudar nada. */
function estadoProjeto(){
  const pj=projetoAtivo();if(!pj)return null;
  const t=G.times[pj.clubeId];if(!t)return null;
  const metas=metasDoProjeto(pj.id,t).map(m=>{const r=m.checar(t,pj);return{id:m.id,texto:m.texto,tipo:m.tipo,ok:r.ok,txt:r.txt};});
  return{pj,def:PROJETOS[pj.id],metas,ano:G.ano-pj.inicio+1,anos:PROJETO_ANOS,alinhamento:alinhamentoProjeto(t)};
}

/* ---------- o elenco combina com o projeto? (−1 a 1) ---------- */
function alinhamentoProjeto(t){
  const pj=projetoAtivo();
  if(!pj||!t||pj.clubeId!==t.id)return 0;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(!tit.length)return 0;
  if(pj.id==='jovens'){
    const idade=_idadeMediaTit(t);
    const velhosSemFuturo=tit.filter(p=>p.idade>=27&&(p.pot||0)-over(p)<=2).length;
    return clamp((24.5-idade)/3-velhosSemFuturo*0.2,-1,1);
  }
  if(pj.id==='titulos'){
    const liga=(G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).map(i=>G.times[i]).filter(Boolean);
    const media=liga.reduce((s,x)=>s+_overMedioTit(x),0)/Math.max(1,liga.length);
    return clamp((_overMedioTit(t)-media-1)/4,-1,1);
  }
  if(pj.id==='nacional')return clamp((_nacionaisTit(t)-2)/2,-1,1);
  if(pj.id==='sustentavel'){
    const f=typeof folgaSalarial==='function'?folgaSalarial(t):0;
    return clamp((t.caixa-(pj.caixaAno!=null?pj.caixaAno:pj.base.caixa))/Math.max(200000,(t.patroc||1)*0.3)+(f>0?0.3:-0.4),-1,1);
  }
  if(pj.id==='acesso'){
    if(t.tier===1)return 1;
    const{pos,de}=posicaoNaLiga(t);return clamp((de/2-pos)/(de/2),-1,1);
  }
  return 0;
}
/* O que a torcida pede por causa do projeto (entra em pedidosTorcida). */
function pedidoDoProjeto(t){
  const pj=projetoAtivo();
  if(!pj||!t||pj.clubeId!==t.id)return null;
  const al=alinhamentoProjeto(t);
  if(al>=0.15)return null;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const banco=(t.elenco||[]).filter(i=>!(t.titulares||[]).includes(i)).map(i=>G.jogadores[i]).filter(Boolean);
  const peso=30+Math.round(-al*40);
  if(pj.id==='jovens'){
    const jovem=banco.filter(p=>p.idade<=21).sort((a,b)=>(b.pot||0)-(a.pot||0))[0];
    if(jovem)return{tipo:'titular',p:jovem,txt:'Projeto de jovens? Põe o '+jovem.nome,peso};
    const velho=tit.filter(p=>p.idade>=27&&(p.pot||0)-over(p)<=2).sort((a,b)=>b.idade-a.idade)[0];
    return velho?{tipo:'fora',p:velho,txt:'Cadê o projeto de jovens? #Fora'+semEspaco(velho.nome),peso}:null;
  }
  if(pj.id==='titulos')return{tipo:'contrata',txt:'Projeto de título com esse elenco? Contrata craque',peso};
  if(pj.id==='nacional')return{tipo:'contrata',txt:'Mais jogadores '+_gentilico(t)+' no time',peso};
  if(pj.id==='sustentavel')return{tipo:'contrata',txt:'Arruma as contas, diretoria',peso};
  if(pj.id==='acesso')return{tipo:'contrata',txt:'Assim não sobe. Reforça o time',peso};
  return null;
}

/* ---------- a virada: balanço do ano e veredito do ciclo ----------
   Chamado em fimDeTemporada, depois de avaliarTemporada e antes de a
   campanha ser zerada. Devolve o resumo para o veredito mostrar. */
const PROJETO_ANO_OK=4, PROJETO_ANO_FALHA=-5, PROJETO_CICLO_OK=14, PROJETO_CICLO_FALHA=-16;
function avaliarProjeto(){
  const pj=projetoAtivo();
  const t=pj&&G.times[pj.clubeId];
  if(!pj||!t){
    /* sem projeto: a diretoria propõe na temporada que vem */
    if(G.meuTime&&!G.projeto)G.projetoPendente=true;
    return null;
  }
  const metas=metasDoProjeto(pj.id,t).map(m=>{const r=m.checar(t,pj);return{id:m.id,texto:m.texto,tipo:m.tipo,ok:r.ok,txt:r.txt};});
  const doAno=metas.filter(m=>m.tipo==='ano');
  let delta=doAno.reduce((s,m)=>s+(m.ok?PROJETO_ANO_OK:PROJETO_ANO_FALHA),0);
  const ultimo=G.ano>=pj.fim;
  let veredito=null;
  if(ultimo){
    const doCiclo=metas.filter(m=>m.tipo==='ciclo');
    /* o ciclo conta as do ciclo agora e o histórico das anuais */
    const anuais=pj.anos.concat([{metas:doAno}]).flatMap(a=>a.metas.filter(m=>m.tipo==='ano'));
    const pctAnual=anuais.length?anuais.filter(m=>m.ok).length/anuais.length:1;
    const cicloOk=doCiclo.filter(m=>m.ok).length;
    const sucesso=cicloOk>=Math.ceil(doCiclo.length/2)&&pctAnual>=0.5;
    delta+=sucesso?PROJETO_CICLO_OK:PROJETO_CICLO_FALHA;
    t.prestigio=clamp(t.prestigio+(sucesso?2:-1),20,99);
    const f=typeof fasDe==='function'?fasDe(t):null;
    if(f)f.humor=clamp(f.humor+(sucesso?10:-10),0,100);
    veredito={sucesso,cicloOk,deCiclo:doCiclo.length,pctAnual:Math.round(pctAnual*100)};
    pj.encerrado=true;pj.resultado=veredito;
    (G.projetosPassados=G.projetosPassados||[]).push({id:pj.id,clube:t.nome,inicio:pj.inicio,fim:pj.fim,sucesso});
    G.projetoPendente=true;
    noticia((sucesso?'🏛 Projeto cumprido: ':'📉 Projeto não cumprido: ')+'"'+PROJETOS[pj.id].nome+'" ('+pj.inicio+'–'+pj.fim+'). '+
      (sucesso?'A diretoria e a torcida aplaudem.':'A diretoria cobra e a torcida está desconfiada.'),{c:'clube',t:[t.id],imp:3});
  }
  pj.anos.push({ano:G.ano,metas});
  pj.caixaAno=t.caixa;
  if(G.manager&&typeof souTreinador==='function'&&souTreinador()&&!G.manager.demitido){
    G.manager.confianca=clamp(Math.round(G.manager.confianca+delta),0,100);
  }
  return{id:pj.id,nome:PROJETOS[pj.id].nome,ano:G.ano-pj.inicio+1,de:PROJETO_ANOS,metas,delta,veredito};
}
/* Trocou de clube (demissão, proposta aceita): o projeto fica com o clube. */
function projetoTrocouDeClube(){
  if(G.projeto&&G.projeto.clubeId!==G.meuTime){G.projeto.encerrado=true;G.projetoPendente=true;}
}
