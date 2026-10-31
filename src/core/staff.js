/* ============================================================
   COMISSÃO TÉCNICA
   ------------------------------------------------------------
   Antes staff era três números de 1 a 5 dentro do time. Agora são
   pessoas: têm nome, idade, país, atributos, contrato, salário e
   valor de mercado, evoluem com o trabalho e podem ser contratadas
   de outro clube.

   O que NÃO mudou de propósito: `t.staff` continua sendo um mapa
   cargo → nível 1..5, porque é assim que o motor de partida e o
   treino leem a comissão. A diferença é que agora esse mapa é
   DERIVADO de quem está contratado — atualizarComissao() recalcula
   — e é contínuo em vez de inteiro. Isso manteve as fórmulas de
   match.js e clock.js intactas e o balanceamento no lugar.

   NIVEL_NEUTRO é o ponto onde a comissão não muda nada: efeitos são
   escritos como (nivel-NIVEL_NEUTRO)*k. Ele NÃO é o meio da escala,
   e isso é de propósito — ver o comentário de ancoraNivel().
   ============================================================ */
function overStaff(m){
  if(!m)return 0;
  const w=CARGO_W[m.cargo]||CARGO_W.tecnico;
  let t=0;for(const k in w)t+=m.at[k]*w[k];
  return Math.round(t);
}
/* Converte over em nível 1..5, que é o que match.js e clock.js leem.

   A âncora acompanha a régua de padrao.js: o piso da divisão mais baixa vira
   nível 1 e o topo absoluto vira 5. Antes a âncora era 40, um over que hoje
   não existe mais em lugar nenhum — o efeito era todo o Tier 1 espremido
   entre 3.7 e 5.0, ou seja, comissão boa e comissão medíocre quase não se
   distinguiam e todo clube de Tier 1 ganhava bônus por existir.

   Com a âncora no piso real, Tier 2 fica de 1.0 a 2.7 e Tier 1 de 2.9 a 5.0.
   A escala é do MUNDO, não da divisão: um coach de Challengers não pode valer
   o mesmo que um da elite só por ser o melhor de Challengers, senão subir de
   divisão não significaria comissão melhor.

   Consequência: o ponto neutro não é o meio da escala. Metade do mundo é
   Tier 2, então a comissão "mediana do mundo" mora embaixo. Por isso
   NIVEL_NEUTRO é 2 e não 3 — é o que faz o Tier 2 poder investir e sair
   ganhando, em vez de tomar penalidade mesmo contratando o melhor da divisão,
   enquanto o Tier 1 (2.9 a 5.0) segue inteiramente acima do neutro, que é o
   que se espera dos 40 melhores clubes do mundo.

   O 2 não foi escolhido aqui: match.js já usava (tecnico*1.1+analista*0.9)-4,
   que zera exatamente no nível 2. Quem estava fora do compasso era clock.js,
   com um 3 escrito à mão. */
const NIVEL_NEUTRO=2;
function ancoraNivel(){
  const piso=(typeof FAIXAS!=='undefined'&&FAIXAS.comissao)?FAIXAS.comissao[2][0]:40;
  return{piso,passo:(99-piso)/4};
}
function nivelStaff(over){
  const{piso,passo}=ancoraNivel();
  return clamp(1+(over-piso)/passo,1,5);
}
/* Onde a comissão de um clube fica dentro da faixa da própria divisão.
   No Tier 1 é o prestígio. No Tier 2 todo clube tem o mesmo prestígio, então
   sem isto a divisão inteira empilhava no piso da faixa (62–73 de uma faixa
   que promete 62–78) e nenhum clube se distinguia. Lá quem separa é o
   público: torcida grande sustenta comissão melhor — a mesma régua que já
   diferencia o Tier 2 na economia. */
function pesoComissao(t){
  if(!t)return 0.5;
  if(t.tier===1)return pesoPrestigio(1,t.prestigio);
  const t2=Object.values(G.times).filter(x=>x.tier===2).map(x=>x.torcida||0);
  const lo=Math.min(...t2), hi=Math.max(...t2);
  return hi>lo?clamp(((t.torcida||lo)-lo)/(hi-lo),0,1):0.5;
}
function nivelDe(m){return nivelStaff(overStaff(m));}
/* Curva de potência, não linear: um coach de elite custa muitas vezes o preço de
   um mediano, que é o que separa quem pode contratar de quem não pode. Calibrada
   para a folha de uma comissão de Tier 1 bater o que a mesma comissão custava
   quando era só um nível numérico no custeio. */
function salarioStaff(m){
  const o=overStaff(m);
  return Math.max(300,Math.round(Math.pow(Math.max(PISO_SALARIO_STAFF+4,o)-PISO_SALARIO_STAFF,3)
                                  *K_SALARIO_STAFF/100)*100);
}
function valorStaff(m){
  const o=overStaff(m);
  let v=Math.pow(Math.max(PISO_SALARIO_STAFF+4,o)-PISO_SALARIO_STAFF,2.2)*90;
  v*= m.idade<=32?1.25:m.idade<=42?1.0:m.idade<=50?.7:.4;
  v*= 1+Math.max(0,m.pot-o)/110;
  return Math.round(v/500)*500;
}
function nomeStaffUnico(usados,genero){
  const pool=genero==='f'?SN1F:SN1M;
  for(let i=0;i<400;i++){
    const n=pick(pool)+' '+pick(SN2);
    if(!usados.has(n)){usados.add(n);return n;}
  }
  return 'Staff '+ri(1000,9999);
}
function criarMembro(cargo,alvo,pais,idade,usados,tier){
  const at={};
  const w=CARGO_W[cargo];
  for(const[k]of ATTRS_STAFF)at[k]=clamp(Math.round(gauss(alvo,8)),25,99);
  /* puxa os atributos-chave do cargo para o over bater no alvo */
  for(let it=0;it<14;it++){
    let cur=0;for(const k in w)cur+=at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.6)break;
    for(const k in w)at[k]=clamp(at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS_STAFF)at[k]=clamp(Math.round(at[k]),25,99);
  const genero=rnd()<0.18?'f':'m';
  const m={
    id:'s'+(G.seqS=(G.seqS||0)+1), nome:nomeStaffUnico(usados,genero), genero, cargo, pais, idade, at,
    pot:0, timeId:null, contrato:ri(1,3), salario:0, valor:0,
    temp:{v:0,d:0,titulos:0}, carreira:{anos:0,titulos:0}, hist:[]
  };
  const o=overStaff(m);
  m.pot=potencialStaffDe(o,idade,tier||2);
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  return m;
}

/* Reescala os atributos para bater um over alvo, preservando o perfil do
   cargo — o espelho de aplicarOver() para jogador. Existe porque tanto a
   promoção ao topo quanto a padronização da base precisam MOVER alguém já
   criado, e mexer no over sem mexer nos atributos deixaria os dois
   discordando (o over é derivado, não armazenado). */
function aplicarOverStaff(m,alvo){
  const w=CARGO_W[m.cargo]||CARGO_W.tecnico;
  for(let it=0;it<24;it++){
    let cur=0;for(const k in w)cur+=m.at[k]*w[k];
    const d=alvo-cur;if(Math.abs(d)<.4)break;
    for(const k in w)m.at[k]=clamp(m.at[k]+d*w[k]*2.2,25,99);
  }
  for(const[k]of ATTRS_STAFF)m.at[k]=clamp(Math.round(m.at[k]),25,99);
  const principal=Object.keys(w).sort((a,b)=>w[b]-w[a]);
  for(let i=0;i<16&&overStaff(m)!==alvo;i++){
    const k=principal[i%principal.length];
    m.at[k]=clamp(m.at[k]+(overStaff(m)<alvo?1:-1),25,99);
  }
  m.pot=Math.max(m.pot,overStaff(m));
  m.salario=salarioStaff(m);m.valor=valorStaff(m);
  return m;
}

/* recalcula t.staff a partir de quem está contratado.
   Vaga aberta vale nível 1: o clube fica com um interino ruim, não com nada. */
function atualizarComissao(t){
  if(!t)return null;
  if(!t.comissao)t.comissao={};
  t.staff=t.staff||{};
  for(const c of CARGOS){
    const m=t.comissao[c.id]&&G.staff?G.staff[t.comissao[c.id]]:null;
    t.staff[c.id]=m?nivelDe(m):1;
  }
  return t.staff;
}
function membroDe(t,cargo){
  const id=t&&t.comissao?t.comissao[cargo]:null;
  return id&&G.staff?G.staff[id]||null:null;
}
function comissaoDe(t){return CARGOS.map(c=>({cargo:c,membro:membroDe(t,c.id)}));}
function folhaStaff(t){
  return CARGOS.reduce((s,c)=>{const m=membroDe(t,c.id);return s+(m?m.salario:0);},0);
}

/* ---------- movimentação ---------- */
/* Igual ao Editor de jogadores: mover aqui é edição de base, não transferência.
   Quem mexe em dinheiro é executarPropostaStaff(). */
function moverStaff(sid,destinoId,cargo){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const destino=destinoId?G.times[destinoId]:null;
  if(destinoId&&!destino)return{ok:false,erro:'Clube de destino não encontrado.'};
  cargo=cargo||m.cargo;
  if(!CARGOS.some(c=>c.id===cargo))return{ok:false,erro:'Cargo inválido.'};
  const origem=m.timeId?G.times[m.timeId]:null;
  if(origem){
    for(const c of CARGOS)if(origem.comissao[c.id]===sid)origem.comissao[c.id]=null;
    atualizarComissao(origem);
  }
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==sid);
  if(destino){
    /* quem já ocupava a vaga vai para o mercado */
    const antigo=destino.comissao[cargo];
    if(antigo&&antigo!==sid){
      const a=G.staff[antigo];
      if(a){a.timeId=null;a.contrato=0;G.staffLivres.push(antigo);}
    }
    m.cargo=cargo;m.timeId=destino.id;
    if(!m.contrato)m.contrato=ri(1,3);
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    destino.comissao[cargo]=sid;
    atualizarComissao(destino);
  }else{
    m.timeId=null;m.contrato=0;
    G.staffLivres.push(sid);
  }
  return{ok:true,msg:m.nome+(destino?' virou '+cargo+' do '+destino.tag:' está sem clube')+'.'};
}
function liberarStaff(sid){return moverStaff(sid,null);}
function apagarStaff(sid){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const t=m.timeId?G.times[m.timeId]:null;
  if(t){for(const c of CARGOS)if(t.comissao[c.id]===sid)t.comissao[c.id]=null;atualizarComissao(t);}
  G.staffLivres=(G.staffLivres||[]).filter(x=>x!==sid);
  delete G.staff[sid];
  return{ok:true,msg:m.nome+' apagado da base.'};
}
function nomesStaffUsados(){return new Set(Object.values(G.staff||{}).map(m=>m.nome));}
function criarStaffLivre(campos){
  campos=campos||{};
  const R=REGIONS.find(r=>r.id===campos.regiao)||pick(REGIONS);
  const m=criarMembro(
    CARGOS.some(c=>c.id===campos.cargo)?campos.cargo:pick(CARGOS).id,
    clamp(campos.over||ri(48,72),30,99),
    campos.pais||pick(R.paises),
    clamp(campos.idade||ri(28,48),20,70),
    nomesStaffUsados());
  if(campos.nome)m.nome=campos.nome;
  if(campos.genero==='f'||campos.genero==='m')m.genero=campos.genero;
  m.contrato=0;m.regiaoOrigem=R.id;
  G.staff[m.id]=m;(G.staffLivres=G.staffLivres||[]).push(m.id);
  return{ok:true,id:m.id,msg:m.nome+' entrou no mercado.'};
}

/* ---------- mercado ---------- */
function pedidoStaff(m){
  if(!m.timeId)return 0;
  return Math.round(m.valor*(1+m.contrato*0.16)/500)*500;
}
function salarioPedidoStaff(m,destino){
  const base=salarioStaff(m);
  const orig=m.timeId?G.times[m.timeId].prestigio:55;
  const gap=orig-destino.prestigio;
  return Math.round(base*(1.08+Math.max(0,gap)*0.010)/100)*100;
}
function avaliarPropostaStaff(m,destino,cargo,taxa,sal,anos){
  const motivos=[];
  if(m.timeId){
    const pedido=pedidoStaff(m);
    if(taxa<pedido*0.92)motivos.push('O clube pede cerca de '+money(pedido)+' para liberar.');
  }
  const pd=salarioPedidoStaff(m,destino);
  if(sal<pd*0.95)motivos.push('Ele quer perto de '+money(pd)+'/mês.');
  if(anos<1||anos>4)motivos.push('Duração de contrato inaceitável.');
  if(destino.caixa<taxa)motivos.push('Caixa insuficiente.');
  if(m.cargo!==cargo&&overStaff(m)<55)
    motivos.push('Ele não se vê fora da função de '+m.cargo+'.');
  return motivos;
}
function executarPropostaStaff(m,destino,cargo,taxa,sal,anos){
  const origem=m.timeId?G.times[m.timeId]:null;
  destino.caixa-=taxa;if(origem)origem.caixa+=taxa;
  moverStaff(m.id,destino.id,cargo);
  m.salario=sal;m.contrato=anos;
  noticia('🎓 '+m.nome+' é o novo '+cargo+' do '+destino.nome+
          (taxa?' por '+money(taxa):' (livre)')+'.',{c:'mercado',t:[destino.id]});
}
/* a IA preenche vagas e troca quem está muito abaixo do prestígio do clube */
function mercadoStaffIA(){
  const livres=()=>(G.staffLivres||[]).map(i=>G.staff[i]).filter(Boolean);
  for(const t of Object.values(G.times).sort((a,b)=>b.prestigio-a.prestigio)){
    if(t.id===G.meuTime)continue;
    for(const c of CARGOS){
      const atual=membroDe(t,c.id);
      /* O alvo tem de morar dentro da faixa da divisão. A conta anterior
         mandava o Tier 2 para um over de ~52, que não existe na régua: dava
         nível 1 para todo mundo, e com alvo 1 a IA nunca trocava ninguém —
         a comissão de Challengers ficava congelada no pior nível possível. */
      const alvoNivel=nivelStaff(overAlvoPeso('comissao',t.tier,pesoComissao(t),0));
      if(atual&&nivelDe(atual)>=alvoNivel-0.7)continue;
      /* O caixa diz o que o clube tem; a folga salarial diz o que a receita
         sustenta. Só o caixa era conferido, e a comissão virava um custo fixo
         que sobrevivia à queda de receita do clube — parte do buraco de quem
         cai de divisão vinha daqui, não do elenco. */
      const folgaAno=(typeof folgaSalarial==='function')?folgaSalarial(t)*12:Infinity;
      const teto=Math.min(Math.max(40000,t.caixa*0.25),
                          Math.max(0,folgaAno+(atual?atual.salario*12:0)));
      const cand=livres()
        .filter(m=>salarioStaff(m)*12<teto)
        .sort((a,b)=>(overStaff(b)+(b.cargo===c.id?6:0))-(overStaff(a)+(a.cargo===c.id?6:0)))[0];
      if(!cand)continue;
      if(atual&&overStaff(cand)<=overStaff(atual))continue;
      moverStaff(cand.id,t.id,c.id);
    }
  }
}

/* ---------- evolução ---------- */
/* Trabalho e resultado movem o over; o teto é o potencial e a idade cobra depois
   dos 50. Um coach que ganha título sobe mais do que um que só cumpre tabela. */
function evoluirStaff(){
  const usados=nomesStaffUsados();
  for(const id in G.staff){
    const m=G.staff[id];
    const t=m.timeId?G.times[m.timeId]:null;
    const jogos=m.temp.v+m.temp.d;
    const aprov=jogos?m.temp.v/jogos:0.5;
    m.hist.push({ano:G.ano,time:t?t.nome:'Sem clube',over:overStaff(m),
                 v:m.temp.v,d:m.temp.d,titulos:m.temp.titulos});
    if(m.hist.length>12)m.hist.shift();
    m.carreira.anos++;m.carreira.titulos+=m.temp.titulos;
    const o=overStaff(m),gap=m.pot-o;
    let g=0;
    if(t){
      const base = m.idade<=32?.55 : m.idade<=40?.38 : m.idade<=48?.22 : .08;
      g = gap*0.10*base + (aprov-0.5)*2.2 + m.temp.titulos*1.6;
    }else g=-0.6;                       /* parado, enferruja */
    if(m.idade>=52)g-=(m.idade-51)*0.35;
    /* o potencial é teto, não marca d'água: sem este corte um coach campeão
       subia 3 pontos por ano para sempre e a base inteira encostava em 99 */
    if(g>0)g=Math.min(g,Math.max(0,gap)*0.35);
    if(Math.abs(g)>0.05){
      const w=CARGO_W[m.cargo];
      const chaves=Object.keys(w).sort((a,b)=>w[b]-w[a]);
      chaves.forEach((k,i)=>{m.at[k]=clamp(m.at[k]+g*(i<2?0.8:0.4),25,99);});
      for(const[k]of ATTRS_STAFF)m.at[k]=clamp(Math.round(m.at[k]),25,99);
    }
    m.pot=Math.max(m.pot,overStaff(m));
    m.idade++;m.contrato=Math.max(0,m.contrato-1);
    m.temp={v:0,d:0,titulos:0};
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    /* aposentadoria */
    const chance = m.idade>=66?1 : m.idade>=60?.35 : m.idade>=55?.12 : 0;
    if(rnd()<chance){
      if(t&&t.id===G.meuTime)noticia('👔 '+m.nome+' se aposentou aos '+m.idade+' anos.',{c:'clube',t:[t.id]});
      apagarStaff(id);continue;
    }
    if(!m.contrato&&t){
      if(t.id===G.meuTime){noticia('📄 '+m.nome+' encerrou contrato e deixou a comissão.',{c:'clube',t:[t.id]});liberarStaff(id);}
      else if(rnd()<.80)m.contrato=ri(2,3);
      else liberarStaff(id);
    }
  }
  /* Rede de segurança do clube do jogador: a IA não contrata por você, mas
     deixar a comissão vazia por esquecimento vira nível 1 em tudo sem aviso.
     A diretoria põe um interino e avisa — mesma lógica do elenco abaixo de 5. */
  const meu=G.meuTime?G.times[G.meuTime]:null;
  if(meu){
    for(const c of CARGOS){
      if(membroDe(meu,c.id))continue;
      /* interino é solução de emergência, não upgrade grátis: pega o do meio da
         lista, nunca o melhor, e por um ano só. Quem quer comissão boa contrata
         no Mercado. */
      const pool=(G.staffLivres||[]).map(i=>G.staff[i]).filter(Boolean)
        .filter(x=>x.cargo===c.id).sort((a,b)=>overStaff(a)-overStaff(b));
      let cand=pool.length?pool[Math.floor(pool.length/2)]:null;
      if(!cand){
        const r=criarStaffLivre({cargo:c.id,over:clamp(Math.round(gauss(50,6)),36,66)});
        cand=G.staff[r.id];
      }
      moverStaff(cand.id,meu.id,c.id);
      cand.contrato=1;
      noticia('⚠ '+c.nome+' vago: a diretoria pôs '+cand.nome+' como interino por um ano.',{c:'clube',t:[meu.id]});
    }
  }

  /* reposição do mercado */
  const faltam=Math.max(0,26-(G.staffLivres||[]).length);
  for(let i=0;i<faltam;i++)criarStaffLivre({over:clamp(Math.round(gauss(60,10)),38,88)});
  if(G.staffLivres.length>90){
    const ord=G.staffLivres.map(i=>G.staff[i]).filter(Boolean)
      .sort((a,b)=>overStaff(b)-overStaff(a));
    ord.slice(90).forEach(m=>{delete G.staff[m.id];});
    G.staffLivres=ord.slice(0,90).map(m=>m.id);
  }
  Object.values(G.times).forEach(atualizarComissao);
}

/* ---------- comissão real ----------
   A função vem da Liquipedia, em inglês e sem padrão fixo ("Head Coach",
   "Coach", "Head of Performance"). A ordem dos testes importa: "assistant
   coach" contém "coach", então o assistente é lido antes do técnico. */
function cargoDeFuncao(f){
  const s=String(f||'').toLowerCase();
  if(/assist|analy|strateg/.test(s))return 'analista';
  if(/perform|mental|psych/.test(s))return 'mental';
  if(/physio|fisio/.test(s))return 'fisio';
  if(/scout|olheiro/.test(s))return 'olheiro';
  if(/coach|t[eé]cnico/.test(s))return 'tecnico';
  return null;
}
/* Distribui a comissão real de um clube pelos cargos do jogo. Quem não tem
   cargo (manager) ou chega com o cargo já ocupado vai para `extra`: entra no
   clube com nome e foto, sem efeito em partida. Leitura pura, sem sorteio. */
function comissaoRealDe(tag){
  const lista=typeof COMISSAO_REAL!=='undefined'?COMISSAO_REAL[tag]:null;
  const cargos={},extra=[];
  for(const l of lista||[]){
    const [nick,funcao,nomeReal,pais]=l;
    if(!nick)continue;
    const r={nick:String(nick).trim(),funcao:funcao||'',nomeReal:nomeReal||'',pais:pais||''};
    let c=cargoDeFuncao(funcao);
    /* segundo técnico ("Coach" ao lado do "Head Coach") é auxiliar na prática */
    if(c==='tecnico'&&cargos.tecnico)c='analista';
    if(c&&!cargos[c])cargos[c]=r;else extra.push(r);
  }
  return{cargos,extra};
}

/* ---------- semeadura ---------- */
function montarStaff(){
  G.staff={};G.staffLivres=[];G.seqS=0;
  const usados=new Set();
  /* nome real reservado antes de gerar qualquer fictício, como os nicks em
     world.js: sem isso o gerador poderia batizar alguém com o nick de um
     técnico de verdade */
  if(typeof COMISSAO_REAL!=='undefined')
    for(const tag in COMISSAO_REAL)for(const l of COMISSAO_REAL[tag])if(l[0])usados.add(String(l[0]).trim());
  for(const id in G.times){
    const t=G.times[id];
    t.comissao={};
    const R=REGIONS.find(r=>r.id===t.regiao);
    const real=comissaoRealDe(t.tag);
    t.equipeExtra=real.extra.map(r=>({nome:r.nick,nomeReal:r.nomeReal,funcao:r.funcao,
      pais:r.pais,real:true}));
    for(const c of CARGOS){
      /* Challengers emprega comissão mais barata, e é isso que mantém a divisão
         viável: com o mesmo padrão do Tier 1 a folha comeria o patrocínio */
      /* A régua está em padrao.js: Tier 1 80–99, Tier 2 62–78. Challengers
         continua empregando comissão mais barata — é isso que mantém a
         divisão viável — mas deixou de empregar amador. */
      const alvo=overAlvoPeso('comissao',t.tier,pesoComissao(t),3);
      const m=criarMembro(c.id,alvo,pick(R.paises),ri(27,52),usados,t.tier);
      aplicarOverStaff(m,alvo);m.pot=potencialStaffDe(alvo,m.idade,t.tier);
      /* a pessoa real ocupa o membro já sorteado: atributos, idade e contrato
         seguem a régua do clube, e o fluxo do gerador fica idêntico ao de um
         mundo sem comissão real */
      const r=real.cargos[c.id];
      if(r){m.nome=r.nick;m.nomeReal=r.nomeReal;m.funcao=r.funcao;if(r.pais)m.pais=r.pais;m.real=true;}
      m.timeId=t.id;G.staff[m.id]=m;t.comissao[c.id]=m.id;
    }
    atualizarComissao(t);
  }
  /* Mercado de comissão: como no de jogadores, a maioria serve ao Tier 2 e
     uma minoria é opção de verdade para o Tier 1. */
  for(let i=0;i<40;i++){
    const paraT1=rnd()<0.3;
    criarStaffLivre({over:paraT1?overAlvo('comissao',1,ri(58,74),4)
                                :overAlvo('comissao',2,ri(45,58),4)});
  }
  promoverComissaoAoTopo();
  return G.staff;
}
/* runs anteriores à v6 tinham só os níveis; recria gente equivalente para
   que a força do clube não mude ao carregar um save antigo */
function migrarStaffAntigo(){
  G.staff={};G.staffLivres=[];G.seqS=0;
  const usados=new Set();
  for(const id in G.times){
    const t=G.times[id];
    const antigos=t.staff||{};
    t.comissao={};
    const R=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
    for(const c of CARGOS){
      const nivel=antigos[c.id]||3;
      const a=ancoraNivel();
      const alvo=clamp(Math.round(a.piso+(nivel-1)*a.passo),FAIXAS.comissao[2][0],97);
      const m=criarMembro(c.id,alvo,pick(R.paises),ri(28,50),usados);
      m.timeId=t.id;G.staff[m.id]=m;t.comissao[c.id]=m.id;
    }
    atualizarComissao(t);
  }
  for(let i=0;i<40;i++)criarStaffLivre({over:clamp(Math.round(gauss(58,10)),38,86)});
}

/* aplica um patch completo de membro da comissão */
function edAplicarStaff(sid,c){
  const m=G.staff[sid];
  if(!m)return{ok:false,erro:'Membro não encontrado.'};
  const antes=m.nome;
  if(typeof c.nome==='string'&&c.nome.trim())m.nome=c.nome.trim();
  if(CARGOS.some(x=>x.id===c.cargo)&&c.cargo!==m.cargo){
    const t=m.timeId?G.times[m.timeId]:null;
    if(t){ /* trocar de cargo dentro do clube move a vaga junto */
      for(const x of CARGOS)if(t.comissao[x.id]===sid)t.comissao[x.id]=null;
      const antigo=t.comissao[c.cargo];
      if(antigo&&antigo!==sid){const a=G.staff[antigo];
        if(a){a.timeId=null;a.contrato=0;(G.staffLivres=G.staffLivres||[]).push(antigo);}}
      t.comissao[c.cargo]=sid;
    }
    m.cargo=c.cargo;
  }
  if(c.idade!=null)m.idade=clamp(parseInt(c.idade)||m.idade,20,70);
  if(typeof c.pais==='string'&&c.pais.trim())m.pais=c.pais.trim().toUpperCase().slice(0,2);
  if(c.genero==='f'||c.genero==='m')m.genero=c.genero;
  if(c.at)for(const[k]of ATTRS_STAFF)
    if(c.at[k]!=null)m.at[k]=clamp(parseFloat(c.at[k]),25,99);
  if(c.pot!=null)m.pot=clamp(parseInt(c.pot)||m.pot,overStaff(m),99);
  else m.pot=Math.max(m.pot,overStaff(m));
  if(c.contrato!=null)m.contrato=clamp(parseInt(c.contrato)||0,0,6);
  if(c.salario!=null)m.salario=Math.max(0,Math.round(parseFloat(c.salario)||0));
  else m.salario=salarioStaff(m);
  if(c.foto!=null)m.foto=String(c.foto).trim()||undefined;
  m.valor=valorStaff(m);
  if(m.timeId)atualizarComissao(G.times[m.timeId]);
  return{ok:true,renomeado:antes!==m.nome?{de:antes,para:m.nome}:null};
}
