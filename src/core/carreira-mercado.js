/* ============================================================
   MODO JOGADOR — CONTRATO, MERCADO E FINANÇAS PESSOAIS (J5)
   ------------------------------------------------------------
   Aqui caem as proteções provisórias da J0: o contrato não renova
   mais sozinho, e o clube pode cortar você na virada. Em troca você
   decide a carreira:

   CONTRATO   salário, anos, multa (baixa, padrão, alta) e duas
              cláusulas: titularidade (o técnico pesa ela na escalação;
              seis semanas seguidas no banco liberam a saída sem multa)
              e bônus por título.
   EMPRESÁRIO opcional. Cobra comissão do salário e luvas para assinar;
              traz mais propostas e negocia teto mais alto. Os bons só
              aceitam quem já é alguém.
   PROPOSTAS  renovação do seu clube (último ano de contrato), clubes
              querendo você (na janela, no último ano, ou quando você
              pede para ser negociado), contratos para quem está livre
              e convites para teste (ranked e agente livre).
              Aceitar, recusar ou negociar: o clube aceita, devolve uma
              contraproposta ou perde a paciência.
   SAÍDA      pedir para ser negociado (mais propostas, o clube vende
              mais fácil, o técnico não gosta) ou forçar a saída
              (rescisão se você está no banco ou na geladeira).
   FINANÇAS   salário, prêmios e lives entram; comissão, staff pessoal,
              estilo de vida e o setup saem. O setup e o staff dão
              bônus pequenos no treino e na cabeça.

   O assistente de contrato (ligado por padrão) aceita a renovação do
   seu clube e a melhor proposta quando você está livre, se você não
   decidir. Os sorteios usam (ano, semana, assunto), não o gerador
   do mundo.
   ============================================================ */

const CAIXA_INICIAL={ranked:2000,tier2:9000,banco:22000,titular:45000,lenda:160000};
const PROPOSTA_VALIDADE=3;          /* semanas */
const PACIENCIA_CLUBE=3;            /* rodadas de negociação */
const BANCO_LIBERA_CLAUSULA=6;      /* semanas seguidas no banco com cláusula de titular */

/* ---------- utilidades ---------- */
/* dinheiro com uma casa entre mil e dez mil: salário de Challengers é $1,6k, não $2k */
function moneyJ(v){const n=Math.round(v||0),a=Math.abs(n);return a>=1e6?'$'+(n/1e6).toFixed(2)+'M':a>=1e4?'$'+Math.round(n/1e3)+'k':a>=1e3?'$'+(n/1e3).toFixed(1).replace('.',',')+'k':'$'+n;}
function _sorteMerc(salt){return typeof _sorteRel==='function'?_sorteRel('m|'+salt):0.5;}
function _sAbs(){return typeof semAbs==='function'?semAbs():(G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function caixaJogador(){if(!G.voce)return 0;if(G.voce.caixa==null)G.voce.caixa=CAIXA_INICIAL[G.voce.inicio]||5000;return G.voce.caixa;}
function lancar(valor,txt,tipo){
  if(!G.voce||!valor)return;
  caixaJogador();
  G.voce.caixa=Math.round(G.voce.caixa+valor);
  if(!G.voce.extrato)G.voce.extrato=[];
  G.voce.extrato.unshift({ano:G.ano,semana:G.semana,valor:Math.round(valor),txt,tipo:tipo||(valor>0?'entra':'sai')});
  G.voce.extrato.length=Math.min(G.voce.extrato.length,40);
}

/* ---------- setup, staff pessoal e estilo de vida ---------- */
const SETUP_ITENS=[
  {id:'monitor',nome:'Monitor',niveis:[{preco:900,txt:'144 Hz'},{preco:2800,txt:'240 Hz'},{preco:6500,txt:'360 Hz OLED'}],ef:{xp:{mira:.04,reflexo:.04}},desc:'XP de mira e reflexo nos treinos.'},
  {id:'perifericos',nome:'Mouse e teclado',niveis:[{preco:400,txt:'bons'},{preco:1200,txt:'de pro'},{preco:3000,txt:'sob medida'}],ef:{xpTodos:.025},desc:'Um pouco mais de XP em tudo.'},
  {id:'cadeira',nome:'Cadeira e mesa',niveis:[{preco:600,txt:'ergonômica'},{preco:1800,txt:'de escritório bom'},{preco:4000,txt:'completa'}],ef:{en:.03},desc:'Cada atividade gasta menos energia.'}
];
const STAFF_PESSOAL=[
  {id:'personal',nome:'Personal de mira',mes:2500,ef:{xp:{mira:.10,reflexo:.08}},desc:'+10% XP de mira e +8% de reflexo.'},
  {id:'psicologo',nome:'Psicólogo',mes:2200,ef:{moral:.012,cabeca:.01},desc:'Moral e cabeça sobem toda semana.'},
  {id:'fisio',nome:'Fisioterapeuta',mes:1800,ef:{fadiga:-.012},desc:'Recupera um pouco mais do cansaço por semana.'}
];
const ESTILOS_VIDA=[
  {id:'simples',nome:'Simples',mes:600,moral:-0.004,desc:'Guarda dinheiro. A cabeça sente um pouco.'},
  {id:'confortavel',nome:'Confortável',mes:3500,moral:0,desc:'O padrão de quem vive do jogo.'},
  {id:'luxo',nome:'Luxo',mes:12000,moral:0.006,desc:'Moral em cima e mais fama. Caro.'}
];
function setupJogador(){if(!G.voce)return{};if(!G.voce.setup)G.voce.setup={};return G.voce.setup;}
function staffPessoal(){if(!G.voce)return{};if(!G.voce.staffP)G.voce.staffP={};return G.voce.staffP;}
function estiloVida(){return ESTILOS_VIDA.find(e=>e.id===(G.voce&&G.voce.vida))||ESTILOS_VIDA[1];}
function comprarSetup(id){
  const it=SETUP_ITENS.find(x=>x.id===id), s=setupJogador();
  if(!it)return{ok:false,motivo:'Item desconhecido.'};
  const n=s[id]||0;
  if(n>=it.niveis.length)return{ok:false,motivo:'Já está no topo.'};
  const preco=it.niveis[n].preco;
  if(caixaJogador()<preco)return{ok:false,motivo:`Custa ${moneyJ(preco)}; você tem ${moneyJ(caixaJogador())}.`};
  lancar(-preco,`${it.nome}: ${it.niveis[n].txt}`,'setup');
  s[id]=n+1;
  return{ok:true,msg:`${it.nome} novo: ${it.niveis[n].txt}.`};
}
function alternarStaffPessoal(id){
  const it=STAFF_PESSOAL.find(x=>x.id===id), s=staffPessoal();
  if(!it)return{ok:false,motivo:'Desconhecido.'};
  if(s[id]){delete s[id];return{ok:true,msg:`${it.nome} dispensado.`};}
  if(caixaJogador()<it.mes)return{ok:false,motivo:`Precisa de pelo menos um mês (${moneyJ(it.mes)}) em caixa.`};
  s[id]=true;return{ok:true,msg:`${it.nome} contratado: ${moneyJ(it.mes)}/mês.`};
}
function definirEstiloVida(id){if(!G.voce||!ESTILOS_VIDA.some(e=>e.id===id))return;G.voce.vida=id;}
/* soma dos bônus do setup e do staff */
function efeitosSetup(){
  const tot={xp:{},xpTodos:0,en:0,moral:0,cabeca:0,fadiga:0};
  const s=setupJogador(), st=staffPessoal();
  for(const it of SETUP_ITENS){const n=s[it.id]||0;if(!n)continue;
    for(const k in it.ef.xp||{})tot.xp[k]=(tot.xp[k]||0)+it.ef.xp[k]*n;
    tot.xpTodos+=(it.ef.xpTodos||0)*n;tot.en+=(it.ef.en||0)*n;}
  for(const it of STAFF_PESSOAL){if(!st[it.id])continue;
    for(const k in it.ef.xp||{})tot.xp[k]=(tot.xp[k]||0)+it.ef.xp[k];
    tot.moral+=it.ef.moral||0;tot.cabeca+=it.ef.cabeca||0;tot.fadiga+=it.ef.fadiga||0;}
  tot.moral+=estiloVida().moral||0;
  return tot;
}
function gastoMensal(){
  const st=staffPessoal();
  let g=estiloVida().mes;
  for(const it of STAFF_PESSOAL)if(st[it.id])g+=it.mes;
  const e=G.voce&&G.voce.empresario, p=meuJogador();
  if(e&&p&&p.timeId)g+=Math.round(p.salario*e.comissao);
  return g;
}
function rendaMensal(){const p=meuJogador();return (p&&p.timeId?p.salario:0)+(typeof patrociniosMensais==='function'?patrociniosMensais():0);}

/* ---------- empresário ---------- */
const EMPRESARIO_NIVEIS=[null,
  {nome:'Iniciante',comissao:.05,luvas:500,minOver:0},
  {nome:'Regional',comissao:.07,luvas:2000,minOver:68},
  {nome:'Conhecido',comissao:.09,luvas:6000,minOver:74},
  {nome:'Grande',comissao:.11,luvas:15000,minOver:80},
  {nome:'Superagente',comissao:.14,luvas:40000,minOver:86}];
function candidatosEmpresario(){
  const p=meuJogador();if(!p)return[];
  const usados=new Set(), out=[];
  const nomes=(typeof SN1M!=='undefined'?SN1M:['Rafael','Bruno','Diego']), sob=(typeof SN2!=='undefined'?SN2:['Silva','Costa','Lima']);
  const fama=(typeof famaJogador==='function'?famaJogador():0);
  for(let n=1;n<=5;n++){
    const nv=EMPRESARIO_NIVEIS[n];
    const k=Math.floor(_sorteMerc('emp'+n+'|'+G.ano)*nomes.length), j=Math.floor(_sorteMerc('emps'+n+'|'+G.ano)*sob.length);
    let nome=nomes[k]+' '+sob[j];if(usados.has(nome))nome+=' Jr.';usados.add(nome);
    const aceita=Math.round(p.pico||over(p))+Math.min(6,fama/8)>=nv.minOver;
    out.push({nivel:n,nome,comissao:nv.comissao,luvas:nv.luvas,rot:nv.nome,aceita,minOver:nv.minOver});
  }
  return out;
}
function contratarEmpresario(nivel){
  const c=candidatosEmpresario().find(x=>x.nivel===+nivel);
  if(!c)return{ok:false,motivo:'Empresário desconhecido.'};
  if(!c.aceita)return{ok:false,motivo:`${c.nome} só trabalha com quem tem over ${c.minOver} (ou fama equivalente).`};
  if(caixaJogador()<c.luvas)return{ok:false,motivo:`As luvas são ${moneyJ(c.luvas)}; você tem ${moneyJ(caixaJogador())}.`};
  lancar(-c.luvas,`Luvas do empresário ${c.nome}`,'empresario');
  G.voce.empresario={nivel:c.nivel,nome:c.nome,comissao:c.comissao,desde:G.ano};
  return{ok:true,msg:`${c.nome} agora cuida da sua carreira (${Math.round(c.comissao*100)}% do salário).`};
}
function demitirEmpresario(){if(!G.voce||!G.voce.empresario)return{ok:false,motivo:'Você não tem empresário.'};const n=G.voce.empresario.nome;G.voce.empresario=null;return{ok:true,msg:`${n} deixou de cuidar da sua carreira.`};}
function nivelEmpresario(){return (G.voce&&G.voce.empresario&&G.voce.empresario.nivel)||0;}

/* ---------- interesse dos clubes ---------- */
function _piorTitularDaFuncao(t,p){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const mesma=tit.filter(q=>(q.roleAtual||q.role)===p.role);
  const lista=mesma.length?mesma:tit;
  return lista.length?Math.min(...lista.map(q=>over(q))):60;
}
/* quanto o clube t quer você: >0 quer. Mais alto, mais quer. */
function interesseDoClube(t,p){
  if(!t||t.id===p.timeId||(t.elenco||[]).length>=(typeof ELENCO_MAX!=='undefined'?ELENCO_MAX:9))return -99;
  const ganho=over(p)-_piorTitularDaFuncao(t,p);
  const sal=salario(p,t);
  const folga=typeof folgaSalarial==='function'?folgaSalarial(t):sal;
  if(folga<sal*0.75)return -99;
  /* tier: o Tier 1 só olha quem já joga em nível de Tier 1 */
  if(t.tier===1&&over(p)<74)return -99;
  return ganho+2+(t.tier===2?1:0)+Math.min(3,(typeof famaJogador==='function'?famaJogador():0)/20);
}
function clubesInteressados(p,n){
  return Object.values(G.times).map(t=>({t,i:interesseDoClube(t,p)})).filter(x=>x.i>0)
    .sort((a,b)=>b.i-a.i||(_sorteMerc('ord'+a.t.id)-_sorteMerc('ord'+b.t.id))).slice(0,n||6);
}

/* ---------- propostas ---------- */
function propostasJogador(){
  if(!G.voce)return[];
  if(!G.voce.propostas)G.voce.propostas=[];
  const agora=_sAbs();
  G.voce.propostas=G.voce.propostas.filter(x=>x.validoAte>=agora&&G.times[x.clubeId]);
  return G.voce.propostas;
}
function _novaProposta(tipo,t,p,extra){
  const emp=nivelEmpresario();
  const base=salario(p,t)*(0.95+_sorteMerc('sal'+t.id)*0.15)*(1+emp*0.025);
  const pr=Object.assign({id:'pr'+_sAbs()+'_'+t.id+'_'+tipo,tipo,clubeId:t.id,salario:Math.round(base/100)*100,
    anos:tipo==='renovacao'?2:2+(_sorteMerc('anos'+t.id)<0.4?1:0),multa:'padrao',titular:false,bonusTitulo:0,
    paciencia:PACIENCIA_CLUBE,validoAte:_sAbs()+PROPOSTA_VALIDADE,criada:_sAbs()},extra||{});
  propostasJogador().push(pr);
  return pr;
}
function _jaTem(tipo,tid){return propostasJogador().some(x=>x.tipo===tipo&&x.clubeId===tid);}
/* uma vez por semana, no fechamento */
function gerarPropostasSemana(p){
  if(!G.voce||!p)return;
  const t=p.timeId?G.times[p.timeId]:null, emp=nivelEmpresario(), fama=(typeof famaJogador==='function'?famaJogador():0);
  const lista=propostasJogador();
  /* renovação: último ano, a partir da semana 18 */
  if(t&&p.contrato<=1&&G.semana>=18&&!_jaTem('renovacao',t.id)&&!(G.voce.semRenov&&_sAbs()-G.voce.semRenov<6)){
    const quer=over(p)>=_piorTitularDaFuncao(t,p)-4||confTecnico()>=55;
    if(quer){_novaProposta('renovacao',t,p,{validoAte:_sAbs()+8});
      if(typeof noticia==='function')noticia(`${t.nome} oferece renovação a ${p.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});}
    else if(!G.voce.avisoSemRenov||G.voce.avisoSemRenov!==G.ano){G.voce.avisoSemRenov=G.ano;
      if(typeof noticia==='function')noticia(`${t.nome} não pretende renovar com ${p.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});}
  }
  /* livre: convites para teste e contratos */
  if(!t){
    const radar=G.voce.radar||0;
    if(lista.filter(x=>x.tipo==='teste'||x.tipo==='livre').length<3&&_sorteMerc('livre')<0.22+radar*0.015+emp*0.05+fama*0.002){
      const c=clubesInteressados(p,4)[Math.floor(_sorteMerc('qual')*Math.min(4,clubesInteressados(p,4).length))];
      if(c&&!_jaTem('teste',c.t.id)&&!_jaTem('livre',c.t.id)){
        /* olheiro sem certeza chama para teste; com empresário bom ou over alto, contrato direto */
        if(emp>=3||over(p)>=_piorTitularDaFuncao(c.t,p)+3)_novaProposta('livre',c.t,p);
        else _novaProposta('teste',c.t,p,{validoAte:_sAbs()+2});
      }
    }
    return;
  }
  /* com clube: na janela, no último ano ou pedindo para sair */
  const pediu=p.pedidoSaida&&!p.pedidoSaida.negado;
  if(G.janela||p.contrato<=1||pediu){
    if(lista.filter(x=>x.tipo==='transferencia').length<2&&_sorteMerc('transf')<0.07+emp*0.035+(pediu?0.18:0)+fama*0.002){
      const c=clubesInteressados(p,5)[Math.floor(_sorteMerc('qualt')*Math.min(5,clubesInteressados(p,5).length))];
      if(c&&!_jaTem('transferencia',c.t.id)){
        const taxa=Math.round((p.valor||valor(p))*(0.8+_sorteMerc('taxa'+c.t.id)*0.4)/5000)*5000;
        _novaProposta('transferencia',c.t,p,{taxa,preContrato:p.contrato<=1&&!G.janela});
        if(typeof noticia==='function')noticia(`${c.t.nome} quer ${p.nome}.`,{c:'mercado',p:[p.id],t:[c.t.id]});
      }
    }
  }
}

/* ---------- negociar ----------
   pedido: {salario, anos, multa, titular, bonusTitulo} */
function tetoDoClube(pr){
  const t=G.times[pr.clubeId], p=meuJogador();
  let teto=salario(p,t)*(1.08+nivelEmpresario()*0.04);
  if(pr.tipo==='renovacao')teto*=1+(confTecnico()-50)/250;
  /* clube que precisa muito paga mais */
  teto*=1+Math.max(0,Math.min(0.12,(over(p)-_piorTitularDaFuncao(t,p))/50));
  return Math.round(teto/100)*100;
}
function _custoPedido(pr,ped){
  const k={baixa:1.04,padrao:1,alta:0.94}[ped.multa]||1;
  return ped.salario*k*(ped.anos>=4?1.03:1)+(ped.bonusTitulo||0)/12;
}
function aceitaTitularidade(pr){
  const t=G.times[pr.clubeId], p=meuJogador();
  if(over(p)>=_piorTitularDaFuncao(t,p)+1)return true;
  return pr.tipo==='renovacao'&&confTecnico()>=65;
}
function negociarProposta(id,ped){
  const pr=propostasJogador().find(x=>x.id===id);
  if(!pr)return{ok:false,motivo:'Essa proposta não existe mais.'};
  if(pr.tipo==='teste')return{ok:false,motivo:'Teste não se negocia: primeiro passe nele.'};
  const t=G.times[pr.clubeId];
  ped=Object.assign({salario:pr.salario,anos:pr.anos,multa:pr.multa,titular:pr.titular,bonusTitulo:pr.bonusTitulo},ped||{});
  ped.salario=Math.max(100,Math.round(+ped.salario/100)*100);ped.anos=Math.max(1,Math.min(4,+ped.anos||2));
  ped.bonusTitulo=Math.max(0,Math.min(ped.salario*2,Math.round(+ped.bonusTitulo||0)));
  if(ped.titular&&!aceitaTitularidade(pr)){
    pr.paciencia--;
    if(pr.paciencia<=0){_retirar(pr);return{ok:true,fim:'retirada',msg:`${t.nome} encerrou a conversa: cláusula de titular, não.`};}
    return{ok:true,fim:'recusa',msg:`${t.nome} não dá cláusula de titular para quem ainda não ganhou a vaga. Tire a cláusula ou ganhe espaço.`};
  }
  const teto=tetoDoClube(pr), custo=_custoPedido(pr,ped);
  if(custo<=teto){Object.assign(pr,ped,{acordo:true});return{ok:true,fim:'acordo',msg:`${t.nome} topou: ${moneyJ(ped.salario)}/mês por ${ped.anos} ano${ped.anos>1?'s':''}.`};}
  pr.paciencia--;
  if(pr.paciencia<=0){_retirar(pr);return{ok:true,fim:'retirada',msg:`${t.nome} perdeu a paciência e retirou a proposta.`};}
  if(custo<=teto*1.15){
    const contra=Math.round(Math.min(teto,(teto+pr.salario)/2+((ped.salario-pr.salario)*0.35))/100)*100;
    Object.assign(pr,ped,{salario:Math.min(ped.salario,contra)});
    return{ok:true,fim:'contra',msg:`${t.nome} volta com ${moneyJ(pr.salario)}/mês e o resto como você pediu.`};
  }
  return{ok:true,fim:'recusa',msg:`${t.nome} achou o pedido alto demais. ${pr.paciencia} rodada${pr.paciencia>1?'s':''} de paciência.`};
}
function _retirar(pr){G.voce.propostas=propostasJogador().filter(x=>x!==pr);}
function recusarProposta(id){
  const pr=propostasJogador().find(x=>x.id===id);
  if(!pr)return{ok:false,motivo:'Essa proposta não existe mais.'};
  _retirar(pr);
  if(pr.tipo==='renovacao'){G.voce.semRenov=_sAbs();mexerConf(-2,'Recusou a renovação.');}
  return{ok:true,msg:`Proposta do ${G.times[pr.clubeId].nome} recusada.`};
}
/* o clube atual topa vender pelo valor? */
function clubeTopaVender(pr){
  const p=meuJogador(), dono=p.timeId&&G.times[p.timeId];
  if(!dono)return{ok:true};
  if(pr.preContrato)return{ok:true,pre:true};
  const multa=typeof multaDe==='function'?multaDe(p):0;
  if(pr.taxa>=multa)return{ok:true,multa:true};
  let d=typeof disposicaoDeVender==='function'?disposicaoDeVender(p):0.5;
  if(p.pedidoSaida&&!p.pedidoSaida.negado)d=Math.max(d,0.8);
  d*=Math.min(1.3,pr.taxa/Math.max(1,p.valor||valor(p)));
  return _sorteMerc('vende'+pr.id)<d?{ok:true}:{ok:false,motivo:`${dono.nome} não aceitou vender por ${moneyJ(pr.taxa)}. A multa é ${moneyJ(multa)}.`};
}
function _aplicarContrato(p,pr){
  p.contrato=pr.anos;p.salario=pr.salario;
  if(typeof multaPadrao==='function')p.multa=Math.round(multaPadrao(p,pr.anos)*({baixa:.7,padrao:1,alta:1.5}[pr.multa]||1)/5000)*5000;
  p.clausulas={titular:!!pr.titular,bonusTitulo:pr.bonusTitulo||0};
  G.voce.semBanco=0;
}
function aceitarProposta(id){
  const pr=propostasJogador().find(x=>x.id===id);
  if(!pr)return{ok:false,motivo:'Essa proposta não existe mais.'};
  if(pr.tipo==='teste')return{ok:false,motivo:'Faça o teste primeiro.'};
  const p=meuJogador(), t=G.times[pr.clubeId];
  if(pr.tipo==='renovacao'){
    _aplicarContrato(p,pr);_retirar(pr);mexerConf(1,'Renovou o contrato.');
    if(typeof noticia==='function')noticia(`${p.nome} renova com o ${t.nome} por ${pr.anos} ano${pr.anos>1?'s':''}.`,{c:'mercado',p:[p.id],t:[t.id]});
    return{ok:true,msg:`Renovado: ${moneyJ(pr.salario)}/mês por ${pr.anos} ano${pr.anos>1?'s':''}.`};
  }
  if((t.elenco||[]).length>=(typeof ELENCO_MAX!=='undefined'?ELENCO_MAX:9))return{ok:false,motivo:`${t.nome} fechou o elenco nesse meio-tempo.`};
  if(pr.tipo==='transferencia'){
    const v=clubeTopaVender(pr);
    if(!v.ok)return v;
    if(v.pre){
      /* último ano fora da janela: pré-contrato, você vai na virada */
      p.preContrato={clubeId:t.id,anos:pr.anos,sal:pr.salario,multa:pr.multa,ano:G.ano};
      G.voce.preJ5=Object.assign({},pr);_retirar(pr);
      if(typeof noticia==='function')noticia(`${p.nome} assina pré-contrato com o ${t.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});
      return{ok:true,msg:`Pré-contrato assinado. Você se apresenta ao ${t.nome} na virada da temporada.`};
    }
    const dono=G.times[p.timeId], taxa=v.multa?multaDe(p):pr.taxa;
    t.caixa-=taxa;if(dono)dono.caixa+=taxa;
    contratar(p,t,pr.anos,pr.salario);
  }else contratar(p,t,pr.anos,pr.salario);
  _aplicarContrato(p,pr);
  _chegouNoClube(p,t);
  if(typeof noticia==='function')noticia(`${p.nome} é o novo jogador do ${t.nome}.`,{c:'mercado',p:[p.id],t:[t.id],imp:2});
  return{ok:true,msg:`Fechado: ${t.nome}, ${moneyJ(pr.salario)}/mês por ${pr.anos} ano${pr.anos>1?'s':''}.`};
}
/* clube novo: técnico novo, confiança do zero (mais alta para quem chega para jogar) */
function _chegouNoClube(p,t){
  G.voce.propostas=[];G.voce.chance=null;G.voce.eventos=[];G.voce.semBanco=0;
  G.voce.confTec=Math.max(45,Math.min(65,50+(over(p)-_piorTitularDaFuncao(t,p))*2));
  if(typeof escalarClubeDoJogador==='function')escalarClubeDoJogador();
}
/* teste: res {aprovado} */
function resolverTeste(id,aprovado){
  const pr=propostasJogador().find(x=>x.id===id&&x.tipo==='teste');
  if(!pr)return{ok:false,motivo:'Esse teste não existe mais.'};
  const t=G.times[pr.clubeId], p=meuJogador();
  _retirar(pr);
  if(!aprovado){G.voce.radar=Math.max(0,(G.voce.radar||0)-1);return{ok:true,msg:`Não foi dessa vez: o ${t.nome} agradeceu e seguiu procurando.`};}
  _novaProposta('livre',t,p,{validoAte:_sAbs()+3});
  G.voce.radar=(G.voce.radar||0)+2;
  return{ok:true,msg:`Aprovado no teste! O ${t.nome} mandou uma proposta de contrato.`};
}
function simularTeste(id){
  const pr=propostasJogador().find(x=>x.id===id&&x.tipo==='teste');
  if(!pr)return{ok:false,motivo:'Esse teste não existe mais.'};
  const t=G.times[pr.clubeId], p=meuJogador();
  const chance=Math.max(0.1,Math.min(0.9,0.5+(over(p)-_piorTitularDaFuncao(t,p))*0.08));
  return resolverTeste(id,_sorteMerc('teste'+id)<chance);
}

/* ---------- pedir para sair ---------- */
function pedirParaSerNegociado(){
  const p=meuJogador(), t=clubeDoJogador();
  if(!t)return{ok:false,motivo:'Você não tem clube.'};
  if(p.pedidoSaida&&!p.pedidoSaida.negado)return{ok:false,motivo:'Você já pediu.'};
  p.pedidoSaida={ano:G.ano,semana:G.semana};
  mexerConf(-4,'Pediu para ser negociado.');
  if(typeof noticia==='function')noticia(`${p.nome} pede para deixar o ${t.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});
  return{ok:true,msg:'O clube sabe que você quer sair. Mais propostas devem chegar, e eles vendem mais fácil.'};
}
function cancelarPedidoSaida(){const p=meuJogador();if(p)delete p.pedidoSaida;return{ok:true,msg:'Você ficou. O pedido de saída foi retirado.'};}
function forcarSaida(){
  const p=meuJogador(), t=clubeDoJogador();
  if(!t)return{ok:false,motivo:'Você não tem clube.'};
  const tit=(t.titulares||[]).includes(p.id);
  const clausula=p.clausulas&&p.clausulas.titular&&(G.voce.semBanco||0)>=BANCO_LIBERA_CLAUSULA;
  if(clausula||!tit||confTecnico()<30){
    if(typeof noticia==='function')noticia(`${t.nome} rescinde com ${p.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});
    liberar(p);delete p.pedidoSaida;p.clausulas=null;G.voce.propostas=[];G.voce.eventos=[];
    return{ok:true,msg:clausula?'Cláusula de titularidade acionada: você sai livre, sem multa.':'Rescisão assinada. Você está livre no mercado.'};
  }
  mexerConf(-20,'Tentou forçar a saída sendo titular.');
  p.moral=Math.max(.05,p.moral-0.08);
  p.pedidoSaida=p.pedidoSaida||{ano:G.ano,semana:G.semana};
  return{ok:true,msg:'"Você tem contrato e é titular." O clube não liberou, e o técnico ficou de cara fechada.'};
}

/* ---------- a semana do dinheiro ----------
   chamado no fechamento da semana do jogador (fecharSemanaJogador) */
function financasSemana(p,t){
  if(!G.voce||!p)return;
  caixaJogador();
  const sem=12/SEMANAS_ANO;
  const sal=t?p.salario*sem:0;
  const e=G.voce.empresario;
  let sai=estiloVida().mes*sem;
  const st=staffPessoal();for(const it of STAFF_PESSOAL)if(st[it.id])sai+=it.mes*sem;
  const com=e&&t?p.salario*e.comissao*sem:0;
  const liquido=sal-com-sai;
  G.voce.caixa=Math.round(G.voce.caixa+liquido);
  /* extrato: uma linha por semana com o saldo, para não lotar */
  if(!G.voce.extrato)G.voce.extrato=[];
  G.voce.extrato.unshift({ano:G.ano,semana:G.semana,valor:Math.round(liquido),tipo:'semana',
    txt:`Semana: salário ${moneyJ(sal)}${com?` · comissão −${moneyJ(com)}`:''} · gastos −${moneyJ(sai)}`});
  G.voce.extrato.length=Math.min(G.voce.extrato.length,40);
  /* efeitos semanais do setup, do staff e do estilo de vida */
  const ef=efeitosSetup();
  p.moral=Math.max(.05,Math.min(1,p.moral+ef.moral));
  if(ef.cabeca&&typeof confiancaDe==='function')p.confianca=Math.min(1,confiancaDe(p)+ef.cabeca);
  if(ef.fadiga)p.fadiga=Math.max(0,p.fadiga+ef.fadiga);
  /* no vermelho: o staff vai embora e o estilo de vida desce */
  if(G.voce.caixa<0){
    const tinha=Object.keys(st).length||estiloVida().id!=='simples';
    G.voce.staffP={};if(estiloVida().id!=='simples')G.voce.vida=estiloVida().id==='luxo'?'confortavel':'simples';
    if(tinha&&typeof noticia==='function')noticia(`${p.nome} está no vermelho: cortou staff pessoal e gastos.`,{c:'carreira',p:[p.id]});
    p.moral=Math.max(.05,p.moral-0.02);
  }
  /* banco com cláusula de titular conta semana */
  if(t){G.voce.semBanco=(t.titulares||[]).includes(p.id)?0:(G.voce.semBanco||0)+1;}
  gerarPropostasSemana(p);
  assistenteDeContrato(p);
}
/* parte dos prêmios do clube (competition.js pagar): metade do prêmio é dos
   jogadores; titular leva o dobro de quem ficou no banco */
function receberPremio(t,parteJogadores,colocacao,nomeTorneio){
  if(!G.voce)return;
  const p=meuJogador();if(!p||p.timeId!==t.id)return;
  const el=(t.elenco||[]).length||5, tit=(t.titulares||[]).includes(p.id);
  const cotas=(t.titulares||[]).length*2+(el-(t.titulares||[]).length);
  const minha=Math.round(parteJogadores*(tit?2:1)/Math.max(1,cotas));
  if(minha>0)lancar(minha,`Premiação${nomeTorneio?' · '+nomeTorneio:''}`,'premio');
  if(colocacao===0&&typeof famaTitulo==='function')famaTitulo(nomeTorneio);
  if(colocacao===0&&p.clausulas&&p.clausulas.bonusTitulo)lancar(p.clausulas.bonusTitulo,`Bônus por título${nomeTorneio?' · '+nomeTorneio:''}`,'premio');
}
/* virada de temporada: contrato que acabou. Devolve true se tratou. */
function viradaContratoJogador(p){
  if(!p||!p.voce||!p.timeId||p.contrato>0)return false;
  const t=G.times[p.timeId];
  const renov=propostasJogador().find(x=>x.tipo==='renovacao'&&x.clubeId===t.id);
  if(renov&&G.voce.autoContrato!==false){
    aceitarProposta(renov.id);
    if(typeof noticia==='function')noticia(`O assistente aceitou a renovação de ${p.nome} com o ${t.nome}.`,{c:'mercado',p:[p.id],t:[t.id]});
    return true;
  }
  if(typeof noticia==='function')noticia(`${p.nome} deixa o ${t.nome}: contrato encerrado.`,{c:'mercado',p:[p.id],t:[t.id],imp:2});
  liberar(p);p.clausulas=null;G.voce.propostas=[];G.voce.eventos=[];
  return true;
}
/* o assistente de contrato, para quem está livre: depois de duas semanas
   sem decidir, fica com a melhor proposta (e simula o teste) */
function assistenteDeContrato(p){
  if(!G.voce||G.voce.autoContrato===false||!p||p.timeId)return;
  const lista=propostasJogador();
  const livre=lista.filter(x=>x.tipo==='livre').sort((a,b)=>b.salario-a.salario)[0];
  if(livre&&_sAbs()-livre.criada>=2){aceitarProposta(livre.id);return;}
  const teste=lista.find(x=>x.tipo==='teste'&&_sAbs()-x.criada>=1);
  if(teste)simularTeste(teste.id);
}
