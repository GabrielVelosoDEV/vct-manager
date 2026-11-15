/* ============================================================
   MODO DONO — CRIAR A SUA ORGANIZAÇÃO (fase 2)
   ------------------------------------------------------------
   Quem escolhe "criar a sua" no modo Dono monta a persona (de onde
   vem o dinheiro), escolhe como entra no circuito e desenha a
   equipe. Três caminhos:

     COMPRA  paga o preço da vaga de um clube. Leva vaga, elenco,
             comissão e contratos; o clube vendido some do circuito
             (a história dele fica para trás, guardada à parte) e a
             torcida antiga começa desconfiada.
     FUSÃO   paga bem menos e divide o clube com o dono antigo, que
             vira sócio com 40%. Vaga, elenco, história e boa parte
             da torcida ficam; o nome pode ser o seu, o dele ou os
             dois juntos.
     FUNDAR  paga a inscrição e entra no Challengers da região no
             lugar do clube mais fraco, que sai do circuito com o
             elenco liberado no mercado. Começa sem torcida, sem
             patrocínio, sem história e com cinco agentes livres.

   O dono do outro lado responde pelo perfil dele (data/donos.js):
   quem é paciente não vende o projeto, quem é ambicioso só vende
   caro e não aceita sócio, e assim por diante.

   Dinheiro: o patrimônio vem da origem (× 1,5 no Fácil). Dá para
   financiar até metade dele; o empréstimo é da organização e a
   parcela sai do caixa toda semana (cobrarDividaDono).
   Nada aqui usa o gerador do motor.
   ============================================================ */
const ORIGENS_DONO=[
  {id:'herdeiro',  nome:'Herdeiro bilionário',  patrimonio:25000000, forte:'Aporte pessoal todo ano; pode cobrir prejuízo.', fraco:'Investidores e torcida desconfiam no começo.'},
  {id:'empresario',nome:'Empresário',           patrimonio:12000000, forte:'+15% em patrocínio e loja; negocia melhor com marcas.', fraco:'Nenhum bônus esportivo.'},
  {id:'criador',   nome:'Criador de conteúdo',  patrimonio: 6000000, forte:'Torcida e seguidores já no começo; loja e conteúdo rendem mais.', fraco:'Patrocinador tradicional pede mais para fechar.'},
  {id:'expro',     nome:'Ex-jogador profissional',patrimonio:4000000,forte:'Jogadores aceitam mais fácil; você enxerga o potencial real.', fraco:'Menos dinheiro e menos contatos comerciais.'},
  {id:'fundo',     nome:'Fundo de investimento',patrimonio:35000000, forte:'O maior caixa.', fraco:'O conselho cobra lucro todo trimestre.'},
  {id:'futebol',   nome:'Clube de futebol',     patrimonio:15000000, forte:'Torcida de partida maior; saúde e base já no nível 3.', fraco:'Decisão grande demora para ser aprovada.'}
];
function origemDono(id){return ORIGENS_DONO.find(o=>o.id===id)||ORIGENS_DONO[1];}
function patrimonioInicial(origem,facil){
  return Math.round(origemDono(origem).patrimonio*(facil||(G&&G.dificuldade==='facil')?1.5:1));
}
const FUSAO_FATOR=0.45, FUSAO_FATIA=0.40, TAXA_FUNDACAO=400000;
const FINANC_MAX=0.5, JUROS_DONO=0.12, PRAZO_DONO=3;

/* ---------- preço e resposta do dono ---------- */
function precoVaga(t){
  if(!t)return 0;
  const p=t.prestigio||50, tor=t.torcida||0;
  const v=t.tier===1?6000000+p*60000+tor*30000:600000+p*10000+tor*8000;
  return Math.round(v*(typeof bolsoDe==='function'?Math.max(1,bolsoDe(t)):1)/50000)*50000;
}
/* {aceita, preco, motivo} para 'compra' ou 'fusao' */
function respostaDoDono(t,tipo){
  const d=t&&t.dono||{perfil:'economico',tipo:'org'};
  const base=precoVaga(t);
  const preco=f=>Math.round(base*(tipo==='fusao'?FUSAO_FATOR:1)*f/50000)*50000;
  if(d.voce)return{aceita:false,motivo:'É o seu clube.'};
  if(tipo==='compra'&&t.tier===1&&d.tipo==='empresa'&&(t.bolso||1)>=1.7)
    return{aceita:false,motivo:'A '+d.nome+' não vende: o clube é estratégico para a empresa.'};
  switch(d.perfil){
    case 'paciente':
      return tipo==='compra'?{aceita:false,motivo:'Não vende o projeto; aceita conversar sobre fusão.'}
        :{aceita:true,preco:preco(1),motivo:'Topa a fusão para o projeto ganhar fôlego.'};
    case 'ambicioso':
      return tipo==='fusao'?{aceita:false,motivo:'Não divide o comando com ninguém.'}
        :{aceita:true,preco:preco(1.6),motivo:'Vende, mas só por muito acima do valor.'};
    case 'midiatico':return{aceita:true,preco:preco(1.3),motivo:'Cobra caro pela marca e pela torcida.'};
    case 'investidor':return{aceita:true,preco:preco(1),motivo:'Vende pelo valor de mercado: é negócio.'};
    default:return{aceita:true,preco:preco(0.9),motivo:'Aceita um pouco abaixo do valor para fechar logo.'};
  }
}
/* o clube que sai para a vaga aberta do Challengers: o mais fraco da região */
function vagaParaFundar(regiao){
  const ids=(G.regioes&&G.regioes[regiao]&&G.regioes[regiao].t2)||[];
  return ids.map(T).filter(t=>t&&t.id!==G.meuTime&&!(t.dono&&t.dono.voce))
    .sort((a,b)=>a.prestigio-b.prestigio||(a.torcida||0)-(b.torcida||0))[0]||null;
}

/* ---------- a conta antes de confirmar ---------- */
function contaDaEntrada(o){
  const pat=patrimonioInicial(o.origem,o.facil);
  const emp=Math.round(pat*clamp(o.financiamento||0,0,FINANC_MAX)/50000)*50000;
  let preco=0,clube=null,socio=null,ok=true,erro='';
  if(o.entrada==='fundar'){
    clube=vagaParaFundar(o.regiao);preco=TAXA_FUNDACAO;
    if(!clube){ok=false;erro='Escolha a região onde a organização nasce.';}
  }else{
    clube=o.timeId&&G.times[o.timeId];
    if(!clube){ok=false;erro='Escolha o clube.';}
    else{const r=respostaDoDono(clube,o.entrada);
      if(!r.aceita){ok=false;erro=r.motivo;}else preco=r.preco;
      if(o.entrada==='fusao')socio={nome:clube.dono?clube.dono.nome:clube.nome,fatia:FUSAO_FATIA,perfil:clube.dono?clube.dono.perfil:'paciente'};}
  }
  const disponivel=pat+emp;
  const aporte=clamp(Math.round(o.aporte||0),0,Math.max(0,disponivel-preco));
  if(ok&&preco>disponivel){ok=false;erro='Faltam '+money(preco-disponivel)+' para pagar a entrada. Financie mais ou escolha outro caminho.';}
  const caixaHerdado=o.entrada==='fundar'?0:(clube?clube.caixa:0);
  const caixa=caixaHerdado+aporte;
  const parcela=emp?Math.round(emp*(1+JUROS_DONO*PRAZO_DONO)/(PRAZO_DONO*SEMANAS_ANO)):0;
  return{ok,erro,patrimonio:pat,emprestimo:emp,disponivel,preco,aporte,caixaHerdado,caixa,
    restante:Math.max(0,disponivel-preco-aporte),parcela,socio,clube};
}

/* ---------- aplicar ---------- */
function _separarHistoria(t){
  const id=t.id, fantasma='ex:'+id;
  for(const h of G.historico||[])if(h&&h.timeId===id)h.timeId=fantasma;
  t.historiaAnterior={nome:t.nome,tag:t.tag,ate:G.ano,temporadas:t.temporadas||[]};
  t.temporadas=[];
}
function _novaIdentidade(t,o){
  (t.nomesAntigos=t.nomesAntigos||[]).push({nome:t.nome,tag:t.tag,ate:G.ano});
  t.nome=String(o.nome).trim().slice(0,32);t.tag=String(o.tag).trim().toUpperCase().slice(0,4);
  if(o.escudo||!o.manterEscudo){t.logo=o.escudo||null;t.logoArq=null;}
  if(o.cor)t.cor=o.cor;
  if(o.cor2)t.cor2=o.cor2;
  if(o.pais){t.pais=o.pais;t.paisSede=o.pais;}
  if(o.cidade)t.cidadeSede=String(o.cidade).slice(0,40);
}
function siglaLivre(tag,menos){
  tag=String(tag||'').trim().toUpperCase();
  return tag.length>=2&&!Object.values(G.times).some(t=>t.id!==menos&&String(t.tag).toUpperCase()===tag);
}
function criarOrganizacaoPropria(o){
  const c=contaDaEntrada(o);
  if(!c.ok)return{ok:false,erro:c.erro};
  if(!String(o.nome||'').trim())return{ok:false,erro:'Dê um nome à organização.'};
  const t=c.clube;
  if(!(o.entrada==='fusao'&&o.nomeFusao==='dele')&&!siglaLivre(o.tag,t.id))return{ok:false,erro:'Sigla vazia ou já usada por outro clube.'};
  const antes={nome:t.nome,dono:t.dono?t.dono.nome:null};
  /* quem ia comprar ou se fundir com este clube durante a carreira desiste */
  for(const e of G.aquisicoes||[])if(!e.feita&&e.de===(t.tagOriginal||t.tag))e.feita={ano:G.ano,sem:true,porVoce:true};
  const piso=typeof pisoTorcida==='function'?pisoTorcida(t):0;
  if(o.entrada==='compra'){
    _separarHistoria(t);_novaIdentidade(t,o);
    t.torcida=clamp(Math.round((t.torcida||0)*0.6),piso,TORCIDA_MAX);
    t.prestigio=clamp(t.prestigio-5,20,99);
  }else if(o.entrada==='fusao'){
    if(o.nomeFusao==='dele'){if(o.cor)t.cor=o.cor;if(o.pais){t.pais=o.pais;t.paisSede=o.pais;}if(o.cidade)t.cidadeSede=o.cidade;}
    else{
      const nome=o.nomeFusao==='juntos'?(String(o.nome).trim()+' '+t.nome).slice(0,32):o.nome;
      _novaIdentidade(t,Object.assign({},o,{nome,manterEscudo:true}));
    }
    t.torcida=clamp(Math.round((t.torcida||0)*0.85),piso,TORCIDA_MAX);
    t.prestigio=clamp(t.prestigio-2,20,99);
    t.socios=[{nome:c.socio.nome,fatia:FUSAO_FATIA,perfil:c.socio.perfil,desde:G.ano}];
  }else{
    /* fundar: o clube mais fraco sai e a vaga é sua, sem nada dele */
    for(const pid of t.elenco.slice()){const p=G.jogadores[pid];if(!p)continue;
      p.timeId=null;p.contrato=0;G.livres.push(pid);}
    t.elenco=[];t.titulares=[];
    if(t.base)t.base=[];
    _separarHistoria(t);_novaIdentidade(t,o);
    t.prestigio=30;t.torcida=piso;t.sinergia=20;t.duplas=null;
    if(t.patrocinios)t.patrocinios={master:null,secundario:null,fornecedor:null};
    if(typeof receitaCaixa==='function')t.patroc=receitaCaixa(t);
    if(t.estrutura)for(const k in t.estrutura)t.estrutura[k]=1;
    if(typeof semearDuplas==='function')semearDuplas(t);
  }
  t.caixa=c.caixa;
  if(o.origem==='futebol'&&t.estrutura){t.estrutura.saude=Math.max(t.estrutura.saude||1,3);t.estrutura.academia=Math.max(t.estrutura.academia||1,3);}
  if(o.origem==='criador')t.torcida=clamp((t.torcida||0)+12,piso,TORCIDA_MAX);
  /* você vira o dono; quem era fica registrado (na fusão, vira sócio) */
  G.meuTime=t.id;
  const m=G.manager;
  if(m){m.origem=origemDono(o.origem).id;m.patrimonio=c.restante;
    m.divida=c.emprestimo?{saldo:Math.round(c.emprestimo*(1+JUROS_DONO*PRAZO_DONO)),parcela:c.parcela,desde:G.ano}:null;
    m.entrada={tipo:o.entrada,ano:G.ano,preco:c.preco,de:antes.nome};}
  if(typeof tornarVoceDono==='function')tornarVoceDono(t);
  if(o.entrada==='fundar')_elencoInicial(t);
  if(typeof autoEscalar==='function')autoEscalar(t);
  const txt=o.entrada==='compra'?`🏢 ${m?m.nome:'Um novo dono'} compra a vaga do ${antes.nome} por ${money(c.preco)}: o clube passa a se chamar ${t.nome} (${t.tag}).`
    :o.entrada==='fusao'?`🤝 ${antes.nome} se funde com a organização de ${m?m.nome:'um novo dono'}: o clube joga como ${t.nome} (${t.tag}), e ${c.socio.nome} fica com ${Math.round(FUSAO_FATIA*100)}%.`
    :`🌱 Nasce o ${t.nome} (${t.tag}), de ${m?m.nome:'um novo dono'}: a organização entra no Challengers no lugar do ${antes.nome}, que deixa o circuito.`;
  noticia(txt,{c:'mercado',t:[t.id],imp:3,meu:true});
  return{ok:true,t};
}
/* fundar: cinco agentes livres da região, um por função quando dá, os
   melhores que o caixa paga por uma temporada */
function _elencoInicial(t){
  const reg=t.regiao;
  const livres=G.livres.map(i=>G.jogadores[i]).filter(p=>p&&!p.voce&&(typeof regiaoDoJogador!=='function'||regiaoDoJogador(p)===reg));
  const teto=Math.max(2500,t.caixa/12/5/6);
  const pode=p=>(typeof salario==='function'?salario(p,t):p.salario||0)<=teto;
  const escolhidos=[];
  for(const f of ['Duelista','Iniciador','Controlador','Sentinela']){
    const p=livres.filter(x=>!escolhidos.includes(x)&&x.role===f&&pode(x)).sort((a,b)=>over(b)-over(a))[0];
    if(p)escolhidos.push(p);
  }
  for(const p of livres.filter(x=>!escolhidos.includes(x)&&pode(x)).sort((a,b)=>over(b)-over(a))){if(escolhidos.length>=5)break;escolhidos.push(p);}
  for(const p of G.livres.map(i=>G.jogadores[i]).filter(x=>x&&!x.voce&&!escolhidos.includes(x)).sort((a,b)=>over(b)-over(a))){if(escolhidos.length>=5)break;escolhidos.push(p);}
  for(const p of escolhidos)contratar(p,t,1,typeof salario==='function'?salario(p,t):p.salario);
}
/* a parcela do financiamento sai do caixa toda semana */
function cobrarDividaDono(t){
  const d=G.manager&&G.manager.divida;
  if(!d||!t||t.id!==G.meuTime||d.saldo<=0)return;
  const v=Math.min(d.parcela,d.saldo);
  t.caixa-=v;d.saldo-=v;
  if(d.saldo<=0){G.manager.divida=null;noticia('🏦 O financiamento da organização foi quitado.',{c:'clube',t:[t.id],imp:1});}
}
