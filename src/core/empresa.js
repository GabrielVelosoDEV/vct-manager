/* ============================================================
   A ORGANIZAÇÃO COMO EMPRESA — modo Dono puro e Dono-técnico (fase 4)
   ------------------------------------------------------------
   O placar do dono é o VALOR DE MERCADO da organização, refeito
   toda semana: vaga na liga + elenco + marca + caixa − dívida.

   G.manager.empresa guarda:
     hist          valor, caixa e dívida semana a semana (dois anos)
     loja          nível 0..3 (0 = sem loja); rende com a torcida
     criadores     criadores de conteúdo contratados (0..4)
     emprestimos   [{id, saldo, parcela, juros, prazo, ano}]
     investidores  [{id, nome, fatia, aporte, meta, falhas, ano}]
     ofertas       propostas de investidores na mesa
     humor         0..100: o conselho de sócios e investidores
     negativas     semanas seguidas com caixa negativo
     receitas      {ano, loja, itens, conteudo, juros, custos}
     reunioes      as reuniões trimestrais do conselho
     perdeu        {motivo, ano, semana}: a carreira acabou

   Perder o time (só nas variantes com técnico; o Dono livre não quebra):
     · FALÊNCIA: oito semanas seguidas no vermelho sem empréstimo
       possível. No Fácil, um sócio-interventor salva uma vez.
     · PERDA DE CONTROLE: os outros sócios somam mais da metade e o
       humor do conselho fecha a temporada abaixo de 25.
   Os dois chegam com avisos.

   Nada sorteia: ofertas e cartas do conselho saem de hash.
   ============================================================ */
const EMP_HIST_MAX=SEMANAS_ANO*2;
const LOJA_CUSTO={1:[150000,260000,420000],2:[40000,70000,120000]};
const LOJA_POR_TORCIDA={1:1500,2:650};                 /* por ano, por nível */
const ITENS_FIXO=60000, ITENS_POR_TORCIDA=2600, ITENS_TITULO=45000;
const CRIADOR_SAL={1:6000,2:2400}, CRIADOR_REC={1:3500,2:1600}, CRIADOR_TORCIDA={1:400,2:250}, CRIADORES_MAX=4;
const EMP_JUROS={facil:0.07,normal:0.10,dificil:0.13};
const EMP_LIMITE=0.30;                                 /* do valor de mercado */
const FALENCIA_SEMANAS=8;
const HUMOR_INICIO=60, HUMOR_CONTROLE=25;
const NOMES_INVESTIDORES=['Atlas Capital','Horizonte Ventures','Pico Partners','Quarta Onda Fundos','Meridiano Investimentos',
  'Aurora Growth','Vértice Holdings','Lince Capital','Estuário Partners','Nexo Esports Fund','Farol Participações','Cobalto Capital'];

function empresaAtiva(){return typeof donoComTecnico==='function'&&donoComTecnico()&&!!G.meuTime;}
function _hEmp(s){return typeof _hashTxt==='function'?_hashTxt(s):0;}
function empresa(){
  const m=G.manager;if(!m)return null;
  if(!m.empresa){
    m.empresa={hist:[],loja:0,criadores:0,emprestimos:[],investidores:[],ofertas:[],humor:HUMOR_INICIO,negativas:0,
      receitas:{ano:G.ano,loja:0,itens:0,conteudo:0,juros:0,custos:0},reunioes:[],seq:0};
    /* quem assumiu um clube pronto também tem bolso: o patrimônio que sobrou da compra */
    if(m.patrimonio==null)m.patrimonio=Math.round((G.dificuldade==='facil'?4500000:3000000));
  }
  const e=m.empresa;
  e.emprestimos=e.emprestimos||[];e.investidores=e.investidores||[];e.ofertas=e.ofertas||[];e.reunioes=e.reunioes||[];
  return e;
}
function _bonusOrigem(linha){
  const o=G.manager&&G.manager.origem, p=G.manager&&G.manager.perfilDono;
  let k=1;
  if(o==='empresario'&&(linha==='loja'||linha==='patroc'))k+=0.15;
  if(o==='criador'&&(linha==='loja'||linha==='conteudo'))k+=0.30;
  if(o==='expro'&&linha==='loja')k-=0.10;
  if(p==='midiatico'&&(linha==='loja'||linha==='conteudo'))k+=0.10;
  return k;
}

/* ---------- valor de mercado ---------- */
function valorVaga(t){return t.tier===1?6000000+(t.prestigio||50)*60000:600000+(t.prestigio||48)*10000;}
function valorMarcaOrg(t){
  const recentes=(t.titulos||[]).filter(x=>parseInt(String(x))>=G.ano-2).length;
  return Math.round((t.torcida||0)*(t.tier===1?30000:8000)+recentes*250000+empresa().loja*(t.tier===1?120000:30000)
    +empresa().criadores*(t.tier===1?40000:12000));
}
function valorElenco(t){return Math.round((t.elenco||[]).reduce((s,i)=>s+((G.jogadores[i]&&G.jogadores[i].valor)||0),0)*0.7);}
function dividaTotal(){
  const e=empresa(),d=G.manager&&G.manager.divida;
  return Math.round((d&&d.saldo>0?d.saldo:0)+e.emprestimos.reduce((s,x)=>s+x.saldo,0));
}
function composicaoValor(t){
  t=t||G.times[G.meuTime];
  const c={vaga:valorVaga(t),elenco:valorElenco(t),marca:valorMarcaOrg(t),caixa:Math.round(t.caixa),divida:-dividaTotal()};
  c.total=Math.max(0,c.vaga+c.elenco+c.marca+c.caixa+c.divida);
  return c;
}
function valorDaOrg(t){return composicaoValor(t).total;}
/* fatias: você, o sócio da fusão e os investidores */
function fatiasDaOrg(t){
  t=t||G.times[G.meuTime];
  const e=empresa(), out=[];
  for(const s of (t&&t.socios)||[])out.push({nome:s.nome,fatia:s.fatia,tipo:'socio'});
  for(const i of e.investidores)out.push({nome:i.nome,fatia:i.fatia,tipo:'investidor',meta:i.meta});
  const outros=out.reduce((s,x)=>s+x.fatia,0);
  return{minha:Math.max(0,Math.round((1-outros)*1000)/1000),outros,lista:out};
}

/* ---------- receitas novas ---------- */
function receitaLojaAno(t){const e=empresa();return e.loja?Math.round(e.loja*(t.torcida||0)*LOJA_POR_TORCIDA[t.tier===1?1:2]*_bonusOrigem('loja')):0;}
function receitaItensAno(t){
  if(t.tier!==1)return 0;   /* o repasse dos itens é das parceiras da liga */
  const recentes=(t.titulos||[]).filter(x=>parseInt(String(x))>=G.ano-1).length;
  return Math.round(ITENS_FIXO+(t.torcida||0)*ITENS_POR_TORCIDA+recentes*ITENS_TITULO);
}
function receitaConteudoAno(t){const e=empresa(),k=t.tier===1?1:2;return Math.round(e.criadores*(CRIADOR_REC[k]*12+(t.torcida||0)*CRIADOR_TORCIDA[k])*_bonusOrigem('conteudo'));}
function custoConteudoAno(t){return empresa().criadores*CRIADOR_SAL[t.tier===1?1:2]*12;}
function custoLojaAno(t){return Math.round(receitaLojaAno(t)*0.25);}
function proximoNivelLoja(t){const e=empresa();return e.loja>=3?null:{nivel:e.loja+1,custo:LOJA_CUSTO[t.tier===1?1:2][e.loja]};}
function melhorarLoja(){
  const t=G.times[G.meuTime],e=empresa(),px=proximoNivelLoja(t);
  if(!px)return{ok:false,erro:'A loja já está no nível máximo.'};
  if(t.caixa<px.custo)return{ok:false,erro:'Caixa insuficiente: custa '+money(px.custo)+'.'};
  t.caixa-=px.custo;e.loja=px.nivel;e.receitas.custos+=px.custo;
  noticia('🛍 O '+t.nome+' '+(px.nivel===1?'abre a loja oficial':'amplia a loja oficial (nível '+px.nivel+')')+'.',{c:'clube',t:[t.id]});
  return{ok:true,msg:px.nivel===1?'Loja aberta.':'Loja no nível '+px.nivel+'.'};
}
function mudarCriadores(d){
  const t=G.times[G.meuTime],e=empresa();
  const n=clamp(e.criadores+d,0,CRIADORES_MAX);
  if(n===e.criadores)return{ok:false,erro:d>0?'No máximo '+CRIADORES_MAX+' criadores.':'Nenhum criador contratado.'};
  e.criadores=n;
  return{ok:true,msg:d>0?'Criador contratado: '+money(CRIADOR_SAL[t.tier===1?1:2])+'/mês.':'Contrato com um criador encerrado.'};
}

/* ---------- empréstimos ---------- */
function jurosEmprestimo(){return EMP_JUROS[G.dificuldade]||EMP_JUROS.normal;}
function limiteEmprestimo(t){
  t=t||G.times[G.meuTime];
  const c=composicaoValor(t);
  const bruto=c.vaga+c.elenco+c.marca+Math.max(0,c.caixa);
  return Math.max(0,Math.round((bruto*EMP_LIMITE-dividaTotal())/5000)*5000);
}
function tomarEmprestimo(valor,prazo){
  const t=G.times[G.meuTime],e=empresa();
  valor=Math.round((+valor||0)/5000)*5000;prazo=clamp(Math.round(+prazo||2),1,4);
  if(valor<=0)return{ok:false,erro:'Escolha um valor.'};
  if(valor>limiteEmprestimo(t))return{ok:false,erro:'O banco empresta no máximo '+money(limiteEmprestimo(t))+'.'};
  const j=jurosEmprestimo(), total=Math.round(valor*(1+j*prazo));
  const x={id:'emp'+(e.seq=(e.seq||0)+1),valor,saldo:total,parcela:Math.round(total/(prazo*SEMANAS_ANO)),juros:j,prazo,ano:G.ano,sem:G.semana};
  e.emprestimos.push(x);t.caixa+=valor;
  e.humor=clamp(e.humor-2,0,100);
  noticia('🏦 O '+t.nome+' toma um empréstimo de '+money(valor)+' em '+prazo+' temporada'+(prazo>1?'s':'')+'.',{c:'clube',t:[t.id]});
  return{ok:true,msg:'Empréstimo de '+money(valor)+'. Parcela de '+money(x.parcela)+' por semana.'};
}
function quitarEmprestimo(id){
  const t=G.times[G.meuTime],e=empresa(),x=e.emprestimos.find(z=>z.id===id);
  if(!x)return{ok:false,erro:'Empréstimo não encontrado.'};
  /* quitar antes desconta metade dos juros que faltam */
  const desc=Math.round(x.saldo-(x.saldo/(1+x.juros*x.prazo))*(1+x.juros*x.prazo/2));
  const custo=Math.max(0,x.saldo-Math.max(0,desc));
  if(t.caixa<custo)return{ok:false,erro:'Caixa insuficiente: quitar custa '+money(custo)+'.'};
  t.caixa-=custo;e.emprestimos=e.emprestimos.filter(z=>z!==x);e.humor=clamp(e.humor+3,0,100);
  return{ok:true,msg:'Empréstimo quitado por '+money(custo)+'.'};
}

/* ---------- investidores ---------- */
const METAS_INVESTIDOR={
  lucro:{nome:'Lucro',texto:'Fechar a temporada com mais caixa do que começou'},
  torcida:{nome:'Torcida',texto:'Crescer a torcida em 5 pontos na temporada'},
  posicao:{nome:'Resultado',texto:'Terminar a liga na metade de cima'},
  titulo:{nome:'Título',texto:'Ganhar um título na temporada'}
};
function gerarOfertas(motivo){
  const t=G.times[G.meuTime],e=empresa();
  const fs=fatiasDaOrg(t);
  const v=valorDaOrg(t);
  const chave=G.ano+'|'+G.semana+'|'+(motivo||'');
  const out=[];
  for(const f of [0.10,0.20,0.30]){
    if(fs.outros+f>0.85)continue;
    const h=_hEmp(chave+'|'+f);
    const nome=NOMES_INVESTIDORES[h%NOMES_INVESTIDORES.length];
    const metas=Object.keys(METAS_INVESTIDOR).filter(k=>k!=='titulo'||t.tier===1&&t.prestigio>=75);
    const meta=metas[(h>>>5)%metas.length];
    const desconto=0.78+((h>>>9)%15)/100+(e.humor-50)/500;
    out.push({id:'of'+(e.seq=(e.seq||0)+1),nome,fatia:f,aporte:Math.round(v*f*desconto/5000)*5000,meta,
      silencioso:f===0.10&&((h>>>13)%3===0),ate:G.ano*SEMANAS_ANO+G.semana+6});
  }
  e.ofertas=out.filter(o=>!e.investidores.some(i=>i.nome===o.nome));
  return e.ofertas;
}
function aceitarOferta(id){
  const t=G.times[G.meuTime],e=empresa(),o=e.ofertas.find(x=>x.id===id);
  if(!o)return{ok:false,erro:'A oferta não está mais na mesa.'};
  const caixaAntes=t.caixa,torcidaAntes=t.torcida||0;
  t.caixa+=o.aporte;
  e.investidores.push({id:o.id,nome:o.nome,fatia:o.fatia,aporte:o.aporte,meta:o.silencioso?null:o.meta,falhas:0,ano:G.ano,
    base:{caixa:caixaAntes,torcida:torcidaAntes,ano:G.ano}});
  e.ofertas=e.ofertas.filter(x=>x!==o);
  e.humor=clamp(e.humor+4,0,100);
  noticia('💼 '+o.nome+' compra '+Math.round(o.fatia*100)+'% do '+t.nome+' por '+money(o.aporte)+'.',{c:'mercado',t:[t.id],imp:2});
  const fs=fatiasDaOrg(t);
  return{ok:true,msg:o.nome+' entrou com '+money(o.aporte)+'. Você fica com '+Math.round(fs.minha*100)+'%.'+(fs.minha<0.5?' Atenção: você não tem mais a maioria.':'')};
}
function recomprarFatia(id){
  const t=G.times[G.meuTime],e=empresa(),i=e.investidores.find(x=>x.id===id);
  if(!i)return{ok:false,erro:'Investidor não encontrado.'};
  const preco=Math.round(valorDaOrg(t)*i.fatia*1.15/5000)*5000;
  const pat=G.manager.patrimonio||0;
  if(pat<preco)return{ok:false,erro:'A recompra custa '+money(preco)+' do seu patrimônio (você tem '+money(pat)+').'};
  G.manager.patrimonio=pat-preco;
  e.investidores=e.investidores.filter(x=>x!==i);
  noticia('🔁 '+G.manager.nome+' recompra a fatia de '+i.nome+' no '+t.nome+'.',{c:'mercado',t:[t.id]});
  return{ok:true,msg:'Fatia recomprada por '+money(preco)+'.'};
}
/* buscar investidor: uma vez por trimestre */
function buscarInvestidores(){
  const e=empresa(),k=G.ano+'-'+Math.ceil((G.semana||1)/13);
  if(e.buscou===k)return{ok:false,erro:'O mercado já ouviu você neste trimestre. Tente no próximo.'};
  e.buscou=k;
  const of=gerarOfertas('busca');
  return{ok:true,msg:of.length?of.length+' proposta'+(of.length>1?'s':'')+' na mesa.':'Ninguém quer entrar agora.'};
}
function aportePessoal(valor){
  const t=G.times[G.meuTime],m=G.manager;
  valor=Math.round((+valor||0)/5000)*5000;
  if(valor<=0)return{ok:false,erro:'Escolha um valor.'};
  if((m.patrimonio||0)<valor)return{ok:false,erro:'Seu patrimônio é '+money(m.patrimonio||0)+'.'};
  m.patrimonio-=valor;t.caixa+=valor;
  empresa().humor=clamp(empresa().humor+2,0,100);
  return{ok:true,msg:money(valor)+' do seu bolso no caixa do clube.'};
}
function _metaCumprida(i,t){
  const b=i.base&&i.base.ano===G.ano?i.base:{caixa:(i.caixaAno!=null?i.caixaAno:t.caixa),torcida:(i.torcidaAno!=null?i.torcidaAno:t.torcida)};
  switch(i.meta){
    case'lucro':return t.caixa>=b.caixa;
    case'torcida':return (t.torcida||0)>=b.torcida+5;
    case'posicao':{const{pos,de}=posicaoNaLiga(t);return pos<=Math.ceil(de/2);}
    case'titulo':return (t.titulos||[]).some(x=>String(x).startsWith(String(G.ano)));
  }
  return true;
}

/* ---------- a semana ---------- */
function semanaEmpresa(t){
  if(!t||t.id!==G.meuTime||!empresaAtiva())return;
  const e=empresa(),m=G.manager;
  if(e.receitas.ano!==G.ano)e.receitas={ano:G.ano,loja:0,itens:0,conteudo:0,juros:0,custos:0};
  /* receitas novas, por semana */
  const loja=receitaLojaAno(t)-custoLojaAno(t), itens=receitaItensAno(t), cont=receitaConteudoAno(t)-custoConteudoAno(t);
  const sem=v=>Math.round(v/SEMANAS_ANO);
  t.caixa+=sem(loja)+sem(itens)+sem(cont);
  e.receitas.loja+=sem(loja);e.receitas.itens+=sem(itens);e.receitas.conteudo+=sem(cont);
  /* criadores trazem gente nova */
  if(e.criadores)t.torcida=clamp((t.torcida||0)+e.criadores*0.04*_bonusOrigem('conteudo'),0,TORCIDA_MAX);
  /* parcelas */
  for(const x of e.emprestimos){
    const v=Math.min(x.parcela,x.saldo);t.caixa-=v;x.saldo-=v;e.receitas.juros+=v;
  }
  const quitados=e.emprestimos.filter(x=>x.saldo<=0);
  if(quitados.length){e.emprestimos=e.emprestimos.filter(x=>x.saldo>0);noticia('🏦 Um empréstimo do '+t.nome+' foi quitado.',{c:'clube',t:[t.id]});}
  /* falência: oito semanas seguidas no vermelho, sem crédito */
  if(t.caixa<0){
    e.negativas++;
    if(e.negativas===3||e.negativas===5||e.negativas===7){
      const faltam=FALENCIA_SEMANAS-e.negativas;
      noticia('⚠ Caixa do '+t.nome+' no vermelho há '+e.negativas+' semanas. Mais '+faltam+' e a organização quebra. Empréstimo, aporte ou venda.',{c:'clube',t:[t.id],imp:3});
      G.avisoEmpresaPendente={tipo:'falencia',semanas:e.negativas,faltam};
    }
    if(e.negativas>=FALENCIA_SEMANAS&&limiteEmprestimo(t)<Math.abs(t.caixa))_quebrar(t);
  }else e.negativas=0;
  /* propostas vencidas saem da mesa */
  const agoraAbs=G.ano*SEMANAS_ANO+G.semana;
  e.ofertas=e.ofertas.filter(o=>!o.ate||o.ate>=agoraAbs);
  /* conselho no fim de cada trimestre */
  if(G.semana%13===0&&!e.perdeu)G.conselhoPendente=montarConselho(t);
  /* histórico do valor */
  const c=composicaoValor(t);
  const ult=e.hist[e.hist.length-1];
  const reg={a:G.ano,s:G.semana,v:c.total,c:c.caixa,d:-c.divida};
  if(ult&&ult.a===reg.a&&ult.s===reg.s)e.hist[e.hist.length-1]=reg;else e.hist.push(reg);
  if(e.hist.length>EMP_HIST_MAX)e.hist.splice(0,e.hist.length-EMP_HIST_MAX);
  e.pico=Math.max(e.pico||0,c.total);
  /* o herdeiro recebe da família no começo do ano */
  if(G.semana===1&&m.origem==='herdeiro'&&m.mesadaAno!==G.ano){m.mesadaAno=G.ano;m.patrimonio=(m.patrimonio||0)+1200000;}
}
function _quebrar(t){
  const e=empresa();
  if(G.dificuldade==='facil'&&!e.interventor){
    /* no Fácil, uma vez: um sócio-interventor cobre o rombo e fica com uma fatia */
    const aporte=Math.round((Math.abs(t.caixa)+Math.max(200000,receitaAnual(t)*0.15))/5000)*5000;
    t.caixa+=aporte;e.negativas=0;e.interventor=true;
    e.investidores.push({id:'interv',nome:'Sócio-interventor',fatia:0.25,aporte,meta:'lucro',falhas:0,ano:G.ano,base:{caixa:t.caixa,torcida:t.torcida,ano:G.ano}});
    e.humor=clamp(e.humor-15,0,100);
    noticia('🛟 Um sócio-interventor salva o '+t.nome+' da falência: entra com '+money(aporte)+' e fica com 25%.',{c:'clube',t:[t.id],imp:3});
    G.avisoEmpresaPendente={tipo:'interventor',aporte};
    return;
  }
  perderOTime('falencia');
}
function perderOTime(motivo){
  const t=G.times[G.meuTime],e=empresa();
  if(e.perdeu)return;
  e.perdeu={motivo,ano:G.ano,semana:G.semana,valor:valorDaOrg(t),pico:e.pico||0,clube:t.nome,anos:G.ano-(G.manager.desde||G.ano)};
  /* o clube ganha outro dono */
  if(t.dono&&t.dono.voce){(t.donosAntigos=t.donosAntigos||[]).push(Object.assign({ate:G.ano},t.dono));}
  t.dono={tipo:'empresa',nome:motivo==='falencia'?'Massa falida (administração judicial)':'Conselho de investidores',perfil:'economico',desde:G.ano};
  noticia(motivo==='falencia'
    ?'📉 Fim da linha: o '+t.nome+' quebra e '+G.manager.nome+' perde a organização.'
    :'📉 O conselho do '+t.nome+' afasta '+G.manager.nome+': os investidores assumem o controle.',{c:'clube',t:[t.id],imp:3});
  G.fimDonoPendente=e.perdeu;
}
function timePerdido(){return !!(G&&G.manager&&G.manager.empresa&&G.manager.empresa.perdeu);}

/* ---------- o conselho trimestral ----------
   Um balanço e até três cartas de decisão. As cartas saem do momento do
   clube (caixa, dívida, torcida) e de um hash do trimestre. */
function _cartasConselho(t,e,res){
  const T1=t.tier===1, cartas=[];
  const div=e.emprestimos.reduce((s,x)=>s+x.saldo,0);
  if(res<0)cartas.push({id:'cortar',titulo:'Cortar custos',txt:'Os investidores querem enxugar: menos scrims pagos e viagens. Economiza agora, mas o elenco sente.',
    sim:'Cortar',nao:'Manter',efeito:{caixa:Math.round(custeioSemanal(t)*6),moral:-0.04,humor:5}});
  if(div>0&&t.caixa>div*0.3)cartas.push({id:'amortizar',titulo:'Amortizar a dívida',txt:'Usar parte do caixa para abater '+money(Math.round(div*0.25))+' dos empréstimos.',
    sim:'Amortizar',nao:'Agora não',efeito:{amortizar:Math.round(div*0.25),humor:5}});
  cartas.push({id:'marca',titulo:'Campanha de marca',txt:'Uma campanha com a torcida: '+money(T1?120000:35000)+' por mais gente na arquibancada e nas redes.',
    sim:'Investir',nao:'Recusar',efeito:{caixa:-(T1?120000:35000),torcida:3,humor:res<0?-3:0}});
  if(t.caixa>(T1?1500000:400000))cartas.push({id:'dividendo',titulo:'Dividendos aos sócios',txt:'Distribuir '+money(Math.round(t.caixa*0.08))+' aos sócios. A sua parte vai para o seu patrimônio; o conselho adora, o caixa nem tanto.',
    sim:'Distribuir',nao:'Reinvestir',efeito:{caixa:-Math.round(t.caixa*0.08),dividendo:Math.round(t.caixa*0.08),humor:10,naoHumor:-2}});
  cartas.push({id:'bonus',titulo:'Bônus ao elenco',txt:'Um bônus por desempenho de '+money(T1?80000:20000)+' para o vestiário.',
    sim:'Pagar',nao:'Não pagar',efeito:{caixa:-(T1?80000:20000),moral:0.05}});
  if(fatiasDaOrg(t).outros<0.6)cartas.push({id:'rodada',titulo:'Rodada de investimento',txt:'Fundos querem conversar. Abrir a rodada traz propostas para a mesa (em Empresa › Dinheiro).',
    sim:'Abrir',nao:'Fechar a porta',efeito:{ofertas:true}});
  const h=_hEmp(t.id+'|conselho|'+G.ano+'|'+G.semana);
  const fixas=cartas.filter(c=>c.id==='cortar'||c.id==='amortizar');
  const resto=cartas.filter(c=>!fixas.includes(c)).sort((a,b)=>(_hEmp(a.id+h)%97)-(_hEmp(b.id+h)%97));
  return [...fixas,...resto].slice(0,3);
}
function montarConselho(t){
  const e=empresa();
  const tri=Math.round(G.semana/13);
  const antes=e.hist.find(x=>x.a===G.ano&&x.s===Math.max(1,G.semana-13))||e.hist[0]||{v:valorDaOrg(t),c:t.caixa};
  const c=composicaoValor(t);
  const res=Math.round(c.caixa-antes.c);
  /* o humor: resultado do trimestre e a cara do conselho */
  const fs=fatiasDaOrg(t);
  let d=res>=0?3+Math.min(5,res/Math.max(50000,receitaAnual(t)*0.05)):-3-Math.min(9,-res/Math.max(50000,receitaAnual(t)*0.05));
  if(G.manager.origem==='fundo')d*=d<0?1.5:1;
  if(G.manager.perfilDono==='paciente'&&d<0)d*=0.7;
  if(G.dificuldade==='facil'&&d<0)d*=0.7;
  if(!fs.lista.length)d*=0.5;   /* sem sócio, o conselho é só você */
  e.humor=clamp(Math.round(e.humor+d),0,100);
  const r={ano:G.ano,tri,semana:G.semana,valor:c.total,valorAntes:antes.v,resultado:res,caixa:c.caixa,divida:-c.divida,
    humor:e.humor,delta:Math.round(d),cartas:_cartasConselho(t,e,res),decisoes:{}};
  /* fim do ano: as metas dos investidores */
  if(tri===4){
    r.metas=[];
    let falhou=false;
    for(const i of e.investidores){
      if(!i.meta)continue;
      const ok=_metaCumprida(i,t);
      i.falhas=ok?0:(i.falhas||0)+1;
      if(!ok)falhou=true;
      r.metas.push({nome:i.nome,texto:METAS_INVESTIDOR[i.meta].texto,ok,falhas:i.falhas});
      e.humor=clamp(e.humor+(ok?6:-8*(i.falhas>=2?1.6:1)),0,100);
      i.caixaAno=null;i.torcidaAno=null;i.base={caixa:t.caixa,torcida:t.torcida||0,ano:G.ano+1};
    }
    r.humor=e.humor;
    /* perda de controle: os outros têm a maioria e o conselho fecha o ano sem paciência */
    if(fs.minha<0.5&&e.humor<HUMOR_CONTROLE){
      if(e.avisoControle){r.afastado=true;perderOTime('controle');}
      else{e.avisoControle=G.ano;r.ultimato=true;
        noticia('⚠ O conselho do '+t.nome+' dá um ultimato a '+G.manager.nome+': mais um ano assim e ele é afastado.',{c:'clube',t:[t.id],imp:3});}
    }else if(e.humor>=HUMOR_CONTROLE+10)e.avisoControle=null;
  }
  e.reunioes.unshift(r);e.reunioes.length=Math.min(e.reunioes.length,12);
  return r;
}
function decidirCarta(r,id,sim){
  const t=G.times[G.meuTime],e=empresa(),c=r&&r.cartas.find(x=>x.id===id);
  if(!c||r.decisoes[id]!=null)return;
  r.decisoes[id]=!!sim;
  const f=c.efeito;
  if(sim){
    if(f.caixa)t.caixa+=f.caixa;
    if(f.moral)for(const pid of t.elenco){const p=G.jogadores[pid];if(p)p.moral=clamp(p.moral+f.moral,0.2,1);}
    if(f.torcida)t.torcida=clamp((t.torcida||0)+f.torcida,0,TORCIDA_MAX);
    if(f.humor)e.humor=clamp(e.humor+f.humor,0,100);
    if(f.amortizar){
      let resta=Math.min(f.amortizar,Math.max(0,t.caixa));t.caixa-=resta;
      for(const x of e.emprestimos){const v=Math.min(resta,x.saldo);x.saldo-=v;resta-=v;}
      e.emprestimos=e.emprestimos.filter(x=>x.saldo>0);
    }
    if(f.ofertas)gerarOfertas('conselho');
    if(f.dividendo)G.manager.patrimonio=(G.manager.patrimonio||0)+Math.round(f.dividendo*fatiasDaOrg(t).minha);
  }else if(f.naoHumor)e.humor=clamp(e.humor+f.naoHumor,0,100);
}
