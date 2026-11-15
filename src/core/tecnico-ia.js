/* ============================================================
   O TÉCNICO IA — modo Dono puro e Dono-técnico (fase 3)
   ------------------------------------------------------------
   No modo Dono de verdade quem treina o time é o head coach da
   comissão. Ele escala, monta a tática, define o treino da semana
   e veta os mapas com a mesma IA que os rivais usam; você assiste.

   A relação com ele mora em G.manager.tecIA:
     confianca 0..100   o quanto ele confia em você. Sobe quando você
                        entrega o que ele pede e dá tempo; cai com
                        pedido negado, verba curta e interferência.
                        Abaixo de 25 ele pede para sair.
     mandato            meta da temporada, verba de transferências e
                        diretriz (jovens, veteranos, a cara do país)
     pedidos            reforço, renovação e dispensa, durante a janela
     interf             jogadores vetados e exigidos no cinco
     exige              o que ele pediu para assinar (verba mínima,
                        não interferir), da entrevista
     noBanco            Dono-técnico: você demitiu o técnico e sentou
                        no banco; o time volta a ser seu

   Nada aqui consome o gerador do mundo: o que parece sorteio sai de
   hash de (ano, semana, assunto), como as conversas do modo jogador.
   ============================================================ */
const TEC_CONF_INICIO=60, TEC_CONF_SAIDA=25;
const TEC_PEDIDOS_MAX=3, TEC_PEDIDO_SEMANAS=6;
const TEC_CUSTO_INTERF=6;               /* cada veto ou exigência nova */
const TEC_MULTA_SEMANAS=4;              /* multa = salário × anos de contrato × 4 */

const DIRETRIZES_TEC=[
  {id:'livre',nome:'Sem diretriz',desc:'O técnico escala quem rende mais.'},
  {id:'jovens',nome:'Apostar nos jovens',desc:'Garotos de até 21 anos ganham minutos, mesmo custando um pouco de força.'},
  {id:'veteranos',nome:'Experiência',desc:'Quem já tem estrada (26 anos ou mais) tem a preferência nas vagas apertadas.'},
  {id:'casa',nome:'A cara do país',desc:'Jogadores do país-sede têm a preferência nas vagas apertadas.'}
];
const ESTILOS_TEC={visao:'Estrategista',tecnica:'Técnico',gestao:'Motivador',disciplina:'Disciplinador'};
const PRIORIDADES_TEC={
  verba:{nome:'Verba',desc:'Quer dinheiro para montar o time do jeito dele.'},
  autonomia:{nome:'Autonomia',desc:'Não aceita dono escalando por cima dele.'},
  projeto:{nome:'Projeto',desc:'Quer saber para onde o clube vai antes de assinar.'},
  jovens:{nome:'Formar jogadores',desc:'Gosta de lapidar garoto da casa.'}
};

function donoComTecnico(){
  return typeof souDono==='function'&&souDono()&&!!G.manager&&(G.manager.variante==='puro'||G.manager.variante==='hibrido');
}
function souHibrido(){return donoComTecnico()&&G.manager.variante==='hibrido';}
/* o seu clube está nas mãos do técnico (ou do interino): a IA decide */
function tecnicoComanda(t){
  return !!t&&!!G&&t.id===G.meuTime&&donoComTecnico()&&!(G.manager.tecIA&&G.manager.tecIA.noBanco);
}
function _hTec(s){return typeof _hashTxt==='function'?_hashTxt(s):0;}
function _semTec(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}

function tecIA(){
  const m=G.manager;if(!m)return null;
  if(!m.tecIA)m.tecIA={confianca:TEC_CONF_INICIO,mandato:null,pedidos:[],interf:{vetos:[],exige:[]},
    exige:{},noBanco:false,log:[],seq:0};
  const x=m.tecIA;
  x.pedidos=x.pedidos||[];x.interf=x.interf||{vetos:[],exige:[]};x.log=x.log||[];x.exige=x.exige||{};
  return x;
}
function tecnicoAtual(t){
  t=t||G.times[G.meuTime];
  const m=t&&typeof membroDe==='function'?membroDe(t,'tecnico'):null;
  return m&&!m.voce?m:null;
}
function logTec(d,txt){
  const x=tecIA();if(!x)return;
  x.log.unshift({ano:G.ano,semana:G.semana,d:Math.round((d||0)*10)/10,txt});
  x.log.length=Math.min(x.log.length,24);
}
function mexerConfTec(d,txt){
  const x=tecIA();if(!x||!d)return;
  x.confianca=clamp(Math.round((x.confianca+d)*10)/10,0,100);
  if(txt)logTec(d,txt);
}
function rotuloConfTec(c){return c>=80?'Fechado com você':c>=60?'Confia no projeto':c>=45?'Desconfiado':c>=TEC_CONF_SAIDA?'Insatisfeito':'De saída';}

/* ---------- a personalidade dele ----------
   Sai dos atributos e de um hash do id: o mesmo técnico tem sempre o
   mesmo jeito, em qualquer save. */
function perfilTecnico(m){
  if(!m)return null;
  const top=Object.keys(m.at||{}).sort((a,b)=>m.at[b]-m.at[a])[0]||'visao';
  const o=overStaff(m), h=_hTec(m.id+'|'+m.nome+'|ego');
  const egoN=clamp((o-60)/30+((h%100)/100-0.5)*0.9,0,1);
  const ego=egoN>=0.62?'alto':egoN>=0.32?'medio':'baixo';
  const prios=Object.keys(PRIORIDADES_TEC);
  let prioridade=prios[(h>>>7)%prios.length];
  if(m.idade>=50&&prioridade==='jovens')prioridade='projeto';
  return{estilo:ESTILOS_TEC[top]||'Estrategista',estiloAt:top,ego,egoN,prioridade};
}
/* quanto o ego dele amplia o que você faz de errado */
function _pesoEgo(){
  const p=perfilTecnico(tecnicoAtual());
  return p?(p.ego==='alto'?1.35:p.ego==='baixo'?0.75:1):1;
}

/* ---------- o mandato ---------- */
function _ligaTec(t){return (G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).length||8;}
function metasDoMandato(t){
  t=t||G.times[G.meuTime];if(!t)return[];
  const de=_ligaTec(t);
  const real=typeof _posicaoAlvo==='function'?_posicaoAlvo(t):Math.ceil(de/2);
  const amb=Math.max(1,real-2), mod=Math.min(Math.max(2,de-2),real+2);
  const txt=a=>a<=1?'Terminar a liga em primeiro':'Terminar a liga entre os '+a+' primeiros';
  return[
    {id:'ambiciosa',nome:'Ambiciosa',alvo:amb,texto:t.tier===2&&amb<=2?'Brigar pelo acesso: '+txt(amb).toLowerCase():txt(amb),
     desc:'Mais cobrança. Um técnico vaidoso adora; um cauteloso estranha.'},
    {id:'realista',nome:'Realista',alvo:real,texto:txt(real),desc:'O que o tamanho do clube pede.'},
    {id:'modesta',nome:'Reconstrução',alvo:mod,texto:txt(mod),desc:'Ano de montar a casa. Tira a pressão, mas técnico ambicioso não gosta.'}
  ];
}
/* a verba que ele acha justa: uma fatia do caixa, respeitando a reserva */
function verbaDesejada(t){
  t=t||G.times[G.meuTime];if(!t)return 0;
  const rec=typeof receitaAnual==='function'?receitaAnual(t):t.caixa;
  const p=perfilTecnico(tecnicoAtual(t));
  const k=p?(p.prioridade==='verba'?0.55:p.ego==='alto'?0.45:0.35):0.35;
  return Math.max(0,Math.round(Math.max(0,t.caixa-rec*0.15)*k/5000)*5000);
}
function mandatoPendente(){
  if(!donoComTecnico()||!G.meuTime)return false;
  const x=tecIA();
  return !x.mandato||x.mandato.ano!==G.ano;
}
/* m = {meta:'ambiciosa'|'realista'|'modesta', verba, diretriz} */
function definirMandato(o){
  const t=G.times[G.meuTime],x=tecIA();
  if(!t||!x)return{ok:false,erro:'Sem clube.'};
  const metas=metasDoMandato(t);
  const meta=metas.find(z=>z.id===o.meta)||metas[1];
  const verba=Math.max(0,Math.round((+o.verba||0)/5000)*5000);
  const diretriz=DIRETRIZES_TEC.some(d=>d.id===o.diretriz)?o.diretriz:'livre';
  const antes=x.mandato&&x.mandato.ano===G.ano?x.mandato:null;
  const tec=tecnicoAtual(t), pf=perfilTecnico(tec);
  /* a reação dele: só conta na primeira definição do ano; rever no meio
     da temporada custa (ele lê como desconfiança) */
  let d=0;const motivos=[];
  if(tec){
    const desej=verbaDesejada(t);
    const min=x.exige.verbaMin||0;
    if(min&&verba<min){d-=10;motivos.push('verba abaixo do que ele exigiu para assinar');}
    else if(desej&&verba<desej*0.5){d-=7;motivos.push('verba curta');}
    else if(desej&&verba>=desej){d+=3;motivos.push('verba generosa');}
    if(meta.id==='ambiciosa')d+=pf.ego==='alto'?3:pf.ego==='baixo'?-3:0;
    if(meta.id==='modesta')d+=pf.ego==='alto'?-4:2;
    if(diretriz==='jovens'&&pf.prioridade==='jovens'){d+=3;motivos.push('diretriz que ele queria');}
    if(antes&&G.semana>4){d-=5;motivos.push('mandato mudado no meio da temporada');}
  }
  x.mandato={ano:G.ano,meta:meta.id,alvo:meta.alvo,texto:meta.texto,de:_ligaTec(t),tier:t.tier,verba,diretriz,
    definido:_semTec()};
  /* a verba vira o orçamento da temporada (core/orcamento.js) */
  if(typeof orcamentoDe==='function'){
    const ob=orcamentoDe(t);ob.verba=verba;if(!antes)ob.inicial=verba;
  }
  if(d)mexerConfTec(d,'Mandato '+G.ano+': '+(motivos.join(', ')||meta.nome.toLowerCase()));
  else logTec(0,'Mandato '+G.ano+' definido: '+meta.texto.toLowerCase()+'.');
  if(typeof noticia==='function')noticia('🏢 '+G.manager.nome+' define o mandato de '+G.ano+' do '+t.nome+': '+meta.texto.toLowerCase()+
    ', verba de '+money(verba)+'.',{c:'clube',t:[t.id]});
  return{ok:true,delta:d,msg:'Mandato definido.'+(tec&&d?' '+tec.nome+(d>0?' gostou ('+'+'+d+').':' não gostou ('+d+').'):'')};
}

/* ---------- a escalação dele ----------
   A mesma conta que move a IA dos rivais (core/lineup.js), com três
   ajustes: condição física, a diretriz do mandato e as suas
   interferências, que valem mais que qualquer over. */
function ajusteDonoTecnico(t){
  const x=tecIA(), md=x.mandato&&x.mandato.ano===G.ano?x.mandato:null;
  const atuais=new Set(t.titulares||[]);
  const vetos=new Set(x.interf.vetos||[]), exige=new Set(x.interf.exige||[]);
  const pais=typeof paisDoClube==='function'?paisDoClube(t):null;
  return p=>{
    let a=((typeof condicao==='function'?condicao(p):1)-1)*25;
    if(atuais.has(p.id))a+=1;
    if(md){
      if(md.diretriz==='jovens'&&p.idade<=21)a+=4;
      if(md.diretriz==='veteranos'&&p.idade>=26)a+=3;
      if(md.diretriz==='casa'&&pais&&p.pais===pais)a+=4;
    }
    if(vetos.has(p.id))a-=60;
    if(exige.has(p.id))a+=60;
    return a;
  };
}
function escalarPeloTecnico(){
  const t=G.meuTime&&G.times[G.meuTime];
  if(!t||!tecnicoComanda(t)||!t.elenco||!t.elenco.length)return;
  _limparInterf(t);
  autoEscalar(t,ajusteDonoTecnico(t));
}
function _limparInterf(t){
  const x=tecIA(),el=new Set(t.elenco||[]);
  x.interf.vetos=(x.interf.vetos||[]).filter(i=>el.has(i));
  x.interf.exige=(x.interf.exige||[]).filter(i=>el.has(i));
}

/* ---------- interferir ---------- */
function interferir(pid,tipo){
  const t=G.times[G.meuTime],x=tecIA(),p=G.jogadores[pid];
  if(!t||!p||p.timeId!==t.id)return{ok:false,erro:'Jogador fora do elenco.'};
  if(!tecnicoComanda(t))return{ok:false,erro:'O time está com você: escale direto no Elenco.'};
  const lista=tipo==='veto'?x.interf.vetos:x.interf.exige, outra=tipo==='veto'?x.interf.exige:x.interf.vetos;
  if(lista.includes(pid))return{ok:false,erro:'Já está valendo.'};
  if(tipo==='exige'&&x.interf.exige.length>=5)return{ok:false,erro:'Cinco exigências já fecham o time inteiro.'};
  const i=outra.indexOf(pid);if(i>=0)outra.splice(i,1);
  lista.push(pid);
  const custo=TEC_CUSTO_INTERF*_pesoEgo()*(x.exige.naoInterferir?1.6:1);
  mexerConfTec(-custo,(tipo==='veto'?'Vetou ':'Exigiu ')+p.nome+(tipo==='veto'?' no cinco.':' entre os titulares.'));
  if(tipo==='veto')p.moral=clamp(p.moral-0.08,0.2,1);
  /* o vestiário percebe quem é escalado pelo dono */
  else for(const id of t.elenco)if(id!==pid){const q=G.jogadores[id];if(q&&!(t.titulares||[]).includes(id))q.moral=clamp(q.moral-0.02,0.2,1);}
  escalarPeloTecnico();
  return{ok:true,msg:(tipo==='veto'?p.nome+' não joga enquanto o veto valer.':p.nome+' joga, o técnico querendo ou não.')+' Confiança −'+Math.round(custo)+'.'};
}
function retirarInterferencia(pid){
  const x=tecIA();
  x.interf.vetos=x.interf.vetos.filter(i=>i!==pid);x.interf.exige=x.interf.exige.filter(i=>i!==pid);
  const p=G.jogadores[pid];
  logTec(0,'Devolveu a decisão sobre '+(p?p.nome:'um jogador')+' ao técnico.');
  escalarPeloTecnico();
  return{ok:true,msg:'O técnico volta a decidir sozinho.'};
}

/* ---------- os pedidos dele ---------- */
function pedidosTec(){return tecIA().pedidos;}
function pedidosAbertos(){return pedidosTec().filter(p=>p.status==='aberto');}
function _novoIdPedido(){const x=tecIA();return 'tp'+G.ano+'_'+(x.seq=(x.seq||0)+1);}
function _sugestaoReforco(t,funcao,overMin,teto){
  if(typeof cabeNoPedido!=='function')return null;
  const x={funcao,idadeMin:16,idadeMax:34,teto,overMin};
  let melhor=null,nota=-Infinity;
  for(const p of Object.values(G.jogadores)){
    if(over(p)<overMin||!cabeNoPedido(x,p,t))continue;
    const n=Math.max(typeof overComo==='function'?overComo(p,funcao):over(p),over(p))
      -(p.timeId?(typeof precoPedido==='function'?precoPedido(p):0)/Math.max(200000,teto||1)*4:0);
    if(n>nota){nota=n;melhor=p;}
  }
  return melhor;
}
function _gerarPedido(t,tec){
  const abertos=pedidosAbertos();
  if(abertos.length>=TEC_PEDIDOS_MAX)return null;
  const ja=k=>pedidosTec().some(p=>p.chave===k&&(p.status==='aberto'||p.status==='aprovado'||G.ano===p.ano&&_semTec()-p.criado<8));
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const media=tit.length?tit.reduce((s,p)=>s+over(p),0)/tit.length:70;
  /* 1. renovar quem segura o time */
  const renovar=tit.filter(p=>p.contrato<=1&&over(p)>=media-1&&!p.preContrato).sort((a,b)=>over(b)-over(a))[0];
  if(renovar&&!ja('renovar:'+renovar.id))
    return{tipo:'renovar',chave:'renovar:'+renovar.id,jogadorId:renovar.id,
      texto:'Renove com '+renovar.nome+'. O contrato acaba no fim do ano e ele é peça do cinco.'};
  /* 2. reforço na função mais fraca */
  const car=typeof carenciaDe==='function'?carenciaDe(t):null;
  if(car&&(t.elenco||[]).length<9){
    const verba=typeof verbaDisponivel==='function'?verbaDisponivel(t):t.caixa*0.3;
    const overMin=Math.round(clamp(Math.max(car.alvo+3,media-2),55,95));
    const k='reforco:'+car.role;
    if(!ja(k)&&(car.alvo<media-3||tit.length<5)){
      const sug=_sugestaoReforco(t,car.role,overMin,verba);
      return{tipo:'reforco',chave:k,funcao:car.role,overMin,teto:verba,sugestaoId:sug?sug.id:null,
        texto:'Preciso de um '+car.role.toLowerCase()+' acima de '+overMin+'.'+(sug?' Gosto do '+sug.nome+'.':'')};
    }
  }
  /* 3. dispensar quem pesa e não joga */
  const banco=(t.elenco||[]).map(i=>G.jogadores[i]).filter(p=>p&&!(t.titulares||[]).includes(p.id)&&!p.base&&!p.emprestimo);
  const peso=banco.filter(p=>over(p)<media-9&&p.idade>=22&&p.contrato>=1).sort((a,b)=>b.salario-a.salario)[0];
  if(peso&&(t.elenco||[]).length>6&&!ja('dispensar:'+peso.id))
    return{tipo:'dispensar',chave:'dispensar:'+peso.id,jogadorId:peso.id,
      texto:'Libere '+peso.nome+'. Não entra no cinco e ocupa folha.'};
  return null;
}
function aprovarPedido(id){
  const x=tecIA(),pd=x.pedidos.find(p=>p.id===id),t=G.times[G.meuTime];
  if(!pd||pd.status!=='aberto'||!t)return{ok:false,erro:'Pedido não está aberto.'};
  if(pd.tipo==='dispensar'){
    const p=G.jogadores[pd.jogadorId];
    if(!p||p.timeId!==t.id){pd.status='expirou';return{ok:false,erro:'Ele já saiu do clube.'};}
    if(t.elenco.length<=5)return{ok:false,erro:'Com cinco no elenco não dá para dispensar ninguém.'};
    const multa=Math.round(p.salario*Math.max(1,p.contrato)*6);
    t.caixa-=multa;liberar(p);
    pd.status='cumprido';pd.fim=_semTec();
    mexerConfTec(3,'Liberou '+p.nome+', como ele pediu.');
    return{ok:true,msg:p.nome+' dispensado. Multa de '+money(multa)+'.'};
  }
  pd.status='aprovado';pd.aprovado=_semTec();
  if(pd.tipo==='reforco'&&typeof publicarPedido==='function'){
    const r=publicarPedido({funcao:pd.funcao,idadeMin:16,idadeMax:34,teto:pd.teto,overMin:pd.overMin});
    if(r&&r.ok)pd.pedidoMercado=r.pedido.id;
  }
  logTec(0,'Aprovou: '+pd.texto);
  return{ok:true,msg:pd.tipo==='reforco'?'Aprovado. O pedido foi publicado em Mercado › Pedidos; a negociação é sua.'
    :'Aprovado. Abra a renovação e feche com ele.'};
}
function negarPedido(id){
  const x=tecIA(),pd=x.pedidos.find(p=>p.id===id);
  if(!pd||pd.status!=='aberto')return{ok:false,erro:'Pedido não está aberto.'};
  pd.status='negado';pd.fim=_semTec();
  const d=-(pd.tipo==='reforco'?5:pd.tipo==='renovar'?4:2)*_pesoEgo();
  mexerConfTec(d,'Negou: '+pd.texto);
  return{ok:true,msg:'Pedido negado. Confiança '+Math.round(d)+'.'};
}
/* confere, toda semana, o que andou com cada pedido */
function _conferirPedidos(t){
  const x=tecIA(),agora=_semTec();
  for(const pd of x.pedidos){
    if(pd.status!=='aberto'&&pd.status!=='aprovado')continue;
    if(pd.tipo==='reforco'){
      const chegou=(t.elenco||[]).map(i=>G.jogadores[i]).find(p=>p&&(p.chegouSem||0)>=pd.criadoNeg
        &&cobre(p,pd.funcao)&&over(p)>=pd.overMin-1);
      if(chegou){pd.status='cumprido';pd.fim=agora;pd.quem=chegou.id;
        mexerConfTec(pd.aprovado?7:5,'Chegou '+chegou.nome+', o '+pd.funcao.toLowerCase()+' que ele pediu.');continue;}
    }else if(pd.tipo==='renovar'){
      const p=G.jogadores[pd.jogadorId];
      if(!p||p.timeId!==t.id){pd.status='falhou';pd.fim=agora;mexerConfTec(-5*_pesoEgo(),(p?p.nome:'O jogador')+' saiu sem renovar.');continue;}
      if(p.contrato>pd.contratoAntes){pd.status='cumprido';pd.fim=agora;mexerConfTec(4,'Renovou com '+p.nome+'.');continue;}
    }else if(pd.tipo==='dispensar'){
      const p=G.jogadores[pd.jogadorId];
      if(!p||p.timeId!==t.id){pd.status='cumprido';pd.fim=agora;continue;}
    }
    /* venceu o prazo, ou a janela fechou com reforço por fazer */
    const venceu=agora-pd.criado>=TEC_PEDIDO_SEMANAS||(pd.tipo==='reforco'&&!G.janela&&agora-pd.criado>=1);
    if(venceu){
      const ignorado=pd.status==='aberto';
      pd.status='expirou';pd.fim=agora;
      mexerConfTec((ignorado?-4:-3)*_pesoEgo(),ignorado?'Ficou sem resposta: '+pd.texto:'Aprovou e não fez: '+pd.texto);
    }
  }
  /* guarda só o que interessa */
  if(x.pedidos.length>30)x.pedidos=x.pedidos.filter(p=>p.status==='aberto'||p.status==='aprovado'||agora-(p.fim||p.criado)<30).slice(0,30);
}

/* ---------- a semana ----------
   Chamada do relógio para o seu clube, depois da folha. */
function semanaTecnicoIA(t){
  if(!t||t.id!==G.meuTime||!donoComTecnico())return;
  const x=tecIA(),tec=tecnicoAtual(t),agora=_semTec();
  _conferirPedidos(t);
  /* contratações e vendas que você fez sem ele pedir */
  const antes=new Set(x.elencoVisto||[]);
  if(x.elencoVisto&&tec&&!x.noBanco){
    for(const id of t.elenco)if(!antes.has(id)){
      const p=G.jogadores[id];
      if(p&&!p.base&&!pedidosTec().some(pd=>pd.quem===id))mexerConfTec(-1.5*_pesoEgo(),'Contratou '+p.nome+' sem consultar.');
    }
    for(const id of antes)if(!t.elenco.includes(id)&&(x.titVistos||[]).includes(id)){
      const p=G.jogadores[id];
      if(p&&!pedidosTec().some(pd=>pd.jogadorId===id&&pd.tipo==='dispensar'))mexerConfTec(-4*_pesoEgo(),'Vendeu '+p.nome+', titular dele.');
    }
  }
  x.elencoVisto=(t.elenco||[]).slice();x.titVistos=(t.titulares||[]).slice();
  if(x.noBanco||!tec)return;
  /* o tempo trabalha a favor; interferência acesa cobra toda semana */
  const interf=(x.interf.vetos.length+x.interf.exige.length);
  if(interf)mexerConfTec(-0.5*interf*(x.exige.naoInterferir?1.5:1));
  else if(x.confianca<70)mexerConfTec(0.4);
  /* pedido novo: na janela, uma vez por semana no máximo, e nem toda semana */
  if(G.janela&&(_hTec(tec.id+'|ped|'+agora)%100)<60){
    const pd=_gerarPedido(t,tec);
    if(pd){
      pd.id=_novoIdPedido();pd.criado=agora;pd.criadoNeg=typeof _semanaNeg==='function'?_semanaNeg():agora;pd.ano=G.ano;pd.status='aberto';
      if(pd.tipo==='renovar')pd.contratoAntes=G.jogadores[pd.jogadorId].contrato;
      x.pedidos.unshift(pd);
      if(typeof noticia==='function')noticia('📋 '+tec.nome+' pede: '+pd.texto,{c:'clube',t:[t.id],imp:2});
    }
  }
  /* abaixo do limite, ele pede para sair */
  if(x.confianca<TEC_CONF_SAIDA)tecnicoPedeDemissao(t,tec);
}
function tecnicoPedeDemissao(t,tec){
  const x=tecIA();
  if(typeof liberarStaff==='function')liberarStaff(tec.id);
  x.interf={vetos:[],exige:[]};x.exige={};
  x.pedidos.forEach(p=>{if(p.status==='aberto'||p.status==='aprovado')p.status='expirou';});
  x.confianca=TEC_CONF_INICIO;
  logTec(0,tec.nome+' pediu demissão.');
  x.saidas=(x.saidas||0)+1;
  if(typeof noticia==='function')noticia('🚪 '+tec.nome+' pede demissão do '+t.nome+': "não dá para trabalhar assim". O auxiliar assume como interino.',{c:'clube',t:[t.id],imp:3});
  G.tecSaiuPendente={nome:tec.nome};
}

/* ---------- demitir e contratar ---------- */
function multaTecnico(m){return m?Math.round(m.salario*Math.max(1,m.contrato)*TEC_MULTA_SEMANAS):0;}
function demitirTecnico(){
  const t=G.times[G.meuTime],tec=tecnicoAtual(t),x=tecIA();
  if(!t||!tec)return{ok:false,erro:'Não há técnico contratado.'};
  const multa=multaTecnico(tec);
  t.caixa-=multa;
  liberarStaff(tec.id);
  x.interf={vetos:[],exige:[]};x.exige={};x.confianca=TEC_CONF_INICIO;
  x.pedidos.forEach(p=>{if(p.status==='aberto'||p.status==='aprovado')p.status='expirou';});
  x.demissoes=(x.demissoes||0)+1;
  logTec(0,'Demitiu '+tec.nome+' (multa de '+money(multa)+').');
  /* trocar de técnico toda hora pesa no vestiário */
  for(const id of t.elenco){const p=G.jogadores[id];if(p)p.moral=clamp(p.moral-0.03,0.2,1);}
  noticia('✂ '+G.manager.nome+' demite '+tec.nome+' do comando do '+t.nome+'. Multa de '+money(multa)+'.',{c:'clube',t:[t.id],imp:3});
  return{ok:true,msg:tec.nome+' demitido. Multa de '+money(multa)+'. O auxiliar assume até você contratar outro.'};
}
/* três candidatos, do mais caro ao mais em conta. O primeiro pode ter
   clube (aí tem taxa de liberação); os outros vêm do mercado livre. */
function candidatosTecnico(){
  const t=G.times[G.meuTime];if(!t)return[];
  const caixa=Math.max(0,t.caixa);
  const cabe=m=>{const sal=salarioPedidoStaff(m,t),taxa=m.timeId?pedidoStaff(m):0;return taxa+sal*12<=Math.max(120000,caixa*0.6);};
  const livres=(G.staffLivres||[]).map(i=>G.staff[i]).filter(m=>m&&!m.voce&&(m.cargo==='tecnico'||overStaff(m)>=60)).filter(cabe)
    .sort((a,b)=>overStaff(b)-overStaff(a));
  const comClube=Object.values(G.times).filter(x=>x.id!==t.id&&x.prestigio<=t.prestigio+4)
    .map(x=>membroDe(x,'tecnico')).filter(m=>m&&!m.voce&&cabe(m)).sort((a,b)=>overStaff(b)-overStaff(a));
  const out=[];
  const top=[livres[0],comClube[0]].filter(Boolean).sort((a,b)=>overStaff(b)-overStaff(a))[0];
  if(top)out.push(top);
  const resto=livres.filter(m=>!out.includes(m));
  if(resto.length){out.push(resto[Math.min(resto.length-1,Math.floor(resto.length*0.25))]);}
  const jovem=resto.filter(m=>!out.includes(m)&&m.idade<=36).sort((a,b)=>(b.pot-overStaff(b))-(a.pot-overStaff(a)))[0]
    ||resto.filter(m=>!out.includes(m))[0];
  if(jovem)out.push(jovem);
  return out.slice(0,3);
}
/* o que o candidato traz para a mesa: salário, taxa e as exigências */
function fichaCandidato(m){
  const t=G.times[G.meuTime],pf=perfilTecnico(m);
  const sal=salarioPedidoStaff(m,t), taxa=m.timeId?pedidoStaff(m):0;
  const desej=verbaDesejada(t);
  return{m,pf,sal,taxa,
    verbaMin:pf.prioridade==='verba'||pf.ego==='alto'?Math.round(desej*0.7/5000)*5000:0,
    naoInterferir:pf.prioridade==='autonomia'||(pf.ego==='alto'&&pf.prioridade!=='projeto'),
    salMin:Math.round(sal*0.85/100)*100,salMax:Math.round(sal*1.2/100)*100};
}
/* as perguntas da entrevista. Cada uma revela uma coisa; a que bate com
   a prioridade dele vale confiança de partida. */
const PERGUNTAS_TEC=[
  {id:'estilo',txt:'Como o seu time joga?',revela:'estilo'},
  {id:'precisa',txt:'Do que você precisa para trabalhar?',revela:'exigencias',prio:'verba'},
  {id:'cobranca',txt:'Como você lida com cobrança do dono?',revela:'ego',prio:'autonomia'},
  {id:'projeto',txt:'Para onde você levaria este clube em três anos?',revela:'projeto',prio:'projeto'},
  {id:'base',txt:'O que você faz com um garoto de 18 anos?',revela:'jovens',prio:'jovens'},
  {id:'salario',txt:'Quanto você quer ganhar?',revela:'salario'}
];
const PERGUNTAS_POR_CANDIDATO=3;
function respostaCandidato(f,qid){
  const m=f.m,pf=f.pf,t=G.times[G.meuTime];
  const fraca=typeof carenciaDe==='function'?carenciaDe(t):null;
  switch(qid){
    case'estilo':return{txt:{Estrategista:'"Jogo de leitura. Preparo cada mapa e cada adversário."',Técnico:'"Execução. Mira, utilitário e treino individual todo dia."',
      Motivador:'"Vestiário unido rende mais que qualquer tática."',Disciplinador:'"Rotina, método, horário. Sem isso não tem time."'}[pf.estilo],dado:'Estilo: '+pf.estilo};
    case'precisa':return{txt:f.verbaMin?'"Verba. Com menos de '+money(f.verbaMin)+' por temporada eu não monto o que quero."':f.naoInterferir?'"Liberdade. Quem escala sou eu."':'"Tempo e um elenco que treine."',
      dado:f.verbaMin?'Exige verba mínima de '+money(f.verbaMin):f.naoInterferir?'Exige não interferência':'Sem exigências'};
    case'cobranca':return{txt:pf.ego==='alto'?'"Cobrança eu aceito. Dono escalando por cima, não."':pf.ego==='baixo'?'"Cobrança faz parte. A gente conversa."':'"Depende do tom. Resultado eu entrego."',
      dado:'Ego '+pf.ego};
    case'projeto':return{txt:pf.prioridade==='projeto'?'"Esse é o tipo de pergunta que eu queria ouvir. Três anos e o clube briga lá em cima."':'"Primeiro o ano, depois a gente pensa em três."',
      dado:pf.prioridade==='projeto'?'Quer um projeto':'Pensa no curto prazo'};
    case'base':return{txt:pf.prioridade==='jovens'?'"Joga. Garoto bom aprende em quadra, não no banco."':'"Banco e scrim até estar pronto."',
      dado:pf.prioridade==='jovens'?'Gosta de formar jogadores':'Prefere elenco pronto'};
    case'salario':return{txt:'"'+money(f.sal)+' por mês'+(f.taxa?', e o clube dele pede '+money(f.taxa)+' para liberar':'')+'."',dado:'Salário '+money(f.sal)+'/mês'};
  }
  return{txt:'—',dado:''};
}
/* confiança com que ele chega: base, mais o que a entrevista acertou */
function confiancaDeChegada(f,perguntadas){
  let c=56;
  for(const q of PERGUNTAS_TEC)if(perguntadas.includes(q.id)&&q.prio===f.pf.prioridade)c+=9;
  if(perguntadas.length>=PERGUNTAS_POR_CANDIDATO)c+=2;
  c+=dificuldade().confianca>=70?4:0;
  return clamp(c,40,80);
}
function contratarTecnico(id,perguntadas){
  const t=G.times[G.meuTime],m=G.staff[id],x=tecIA();
  if(!t||!m)return{ok:false,erro:'Candidato não encontrado.'};
  const f=fichaCandidato(m);
  if(t.caixa<f.taxa)return{ok:false,erro:'Caixa insuficiente para a taxa de liberação.'};
  /* sair do banco: o seu cadastro deixa a comissão sem passar pelo mercado */
  _tirarDonoDoBanco(t);
  if(m.timeId&&typeof relTecnicoRoubado==='function')relTecnicoRoubado(G.times[m.timeId],m);
  executarPropostaStaff(m,t,'tecnico',f.taxa,f.sal,2);
  x.confianca=confiancaDeChegada(f,perguntadas||[]);
  x.exige={verbaMin:f.verbaMin,naoInterferir:f.naoInterferir};
  x.interf={vetos:[],exige:[]};
  x.noBanco=false;
  x.contratados=(x.contratados||0)+1;
  logTec(0,'Contratou '+m.nome+' (confiança de chegada '+x.confianca+').');
  /* a verba prometida agora precisa caber na exigência dele */
  if(f.verbaMin&&x.mandato&&x.mandato.ano===G.ano&&x.mandato.verba<f.verbaMin)
    mexerConfTec(-6,'A verba do mandato está abaixo do que ele pediu.');
  escalarPeloTecnico();
  return{ok:true,msg:m.nome+' é o novo técnico do '+t.nome+'.'};
}
/* o diretor esportivo escolhe por você: o melhor da lista, confiança neutra */
function contratarTecnicoDelegado(){
  const c=candidatosTecnico()[0];
  if(!c)return{ok:false,erro:'Nenhum técnico disponível cabe no caixa.'};
  const r=contratarTecnico(c.id,[]);
  if(r.ok)tecIA().confianca=55;
  return r;
}

/* ---------- Dono-técnico: sentar no banco ----------
   O seu nível de coach sai da origem: ex-pro entende de jogo, o resto
   aprende no banco. Fica em G.staff com voce:true, como o treinador. */
const BONUS_DONO_BANCO={expro:6,futebol:3,criador:0,empresario:-1,herdeiro:-2,fundo:-2};
function _membroDoDono(){
  const g=G.manager;
  if(g.staffId&&G.staff[g.staffId])return G.staff[g.staffId];
  /* um coach comum da divisão, como o treinador que começa do zero */
  const t=G.times[G.meuTime];
  const o=(typeof overInicialManager==='function'&&t?modoTreinador('carreira').over[t.tier===2?2:1]:74)+(BONUS_DONO_BANCO[g.origem]||0);
  const at={tecnica:o,gestao:o,visao:o,disciplina:o};
  const m={id:'s'+(G.seqS=(G.seqS||0)+1),nome:g.nome,genero:g.genero||'m',cargo:'tecnico',pais:g.pais||'BR',
    idade:g.idade||40,at,pot:o+6,timeId:null,contrato:9,salario:0,valor:0,
    temp:{v:0,d:0,titulos:0},carreira:{anos:0,titulos:0},hist:[],voce:true,foto:g.foto||null};
  aplicarOverStaff(m,o);m.salario=0;m.valor=0;
  G.staff[m.id]=m;g.staffId=m.id;
  return m;
}
function assumirBanco(){
  const t=G.times[G.meuTime],x=tecIA();
  if(!t||!souHibrido())return{ok:false,erro:'Só no modo Dono-técnico.'};
  if(x.noBanco)return{ok:false,erro:'Você já está no banco.'};
  const tec=tecnicoAtual(t);
  let multa=0;
  if(tec){multa=multaTecnico(tec);const r=demitirTecnico();if(!r.ok)return r;}
  const m=_membroDoDono();
  t.comissao=t.comissao||{};t.comissao.tecnico=m.id;m.timeId=t.id;m.salario=0;
  G.staffLivres=(G.staffLivres||[]).filter(i=>i!==m.id);
  atualizarComissao(t);
  x.noBanco=true;x.noBancoDesde=_semTec();x.interf={vetos:[],exige:[]};
  t.torcida=clamp((t.torcida||0)-2,0,100);
  logTec(0,'Sentou no banco.');
  noticia('🎧 '+G.manager.nome+', dono do '+t.nome+', assume o comando técnico. A partir de agora quem escala é ele.',{c:'clube',t:[t.id],imp:3});
  return{ok:true,msg:'Você está no banco. Escalação, tática, treino e veto agora são seus.'+(multa?' Multa de '+money(multa)+'.':'')};
}
function _tirarDonoDoBanco(t){
  const g=G.manager,m=g&&g.staffId&&G.staff[g.staffId];
  if(m&&t.comissao&&t.comissao.tecnico===m.id){t.comissao.tecnico=null;m.timeId=null;atualizarComissao(t);}
  if(m)G.staffLivres=(G.staffLivres||[]).filter(i=>i!==m.id);
}

/* ---------- fim de temporada: o técnico cumpriu o mandato? ---------- */
function avaliarMandato(){
  if(!donoComTecnico()||!G.meuTime)return null;
  const t=G.times[G.meuTime],x=tecIA(),md=x.mandato;
  if(!t||!md||md.ano!==G.ano)return null;
  const{pos,de}=posicaoNaLiga(t);
  let alvo=md.alvo;if(md.de&&md.de!==de)alvo=clamp(Math.round(md.alvo*de/md.de),1,Math.max(1,de-2));
  const cumpriu=pos<=alvo;
  const titulos=(t.titulos||[]).filter(z=>String(z).startsWith(String(G.ano))).length;
  const tec=tecnicoAtual(t);
  const reg={ano:G.ano,clube:t.nome,meta:md.texto,alvo,pos,de,cumpriu,titulos,tecnico:tec?tec.nome:null,
    noBanco:!!x.noBanco,confAntes:x.confianca};
  if(tec&&!x.noBanco){
    /* bater a meta deixa ele satisfeito com você também: foi o projeto que funcionou */
    mexerConfTec(cumpriu?6+Math.min(6,(alvo-pos)*2):-2,cumpriu?'Bateu a meta de '+G.ano+'.':'Ficou abaixo da meta de '+G.ano+'.');
    tec.mandatos=(tec.mandatos||0)+1;
  }
  reg.conf=x.confianca;
  (x.balancos=x.balancos||[]).unshift(reg);x.balancos.length=Math.min(x.balancos.length,10);
  return reg;
}
