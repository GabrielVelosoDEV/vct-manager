/* ============================================================
   OS TRÊS MODOS — identidade visual
   ------------------------------------------------------------
   O jogo é um só; o que muda é a roupa. Cada papel tem a sua cor,
   a sua imagem, o seu vocabulário e a sua cerimônia:

     Treinador  sala tática    vermelho Valorant + azul-tático
     Jogador    holofote       ciano neon + roxo
     Dono       escritório     dourado (ui/escritorio.js)

   Aqui moram os textos e os portais do Novo jogo; o tema de cada
   modo dentro da carreira vem nas próximas etapas.
   ============================================================ */
const MODO_NJ={
  treinador:{nome:'Treinador',ic:'tatica',cor:'#FF4655',img:['estrutura','analise'],slogan:'Você comanda o time.',
    decide:'Escalação, tática, treino, veto e mercado dentro da verba.',dia:'Você monta o plano e o veto, e joga ou simula a série.',
    perde:'Quando a diretoria perde a paciência e te demite.',
    selo:'Credencial · head coach',secVoce:'O treinador',secVoceSub:'Como a imprensa e o vestiário vão te conhecer.',
    sec2:'Trajetória e estilo',sec2Sub:'De onde você começa e como você trabalha.',sec3Sub:'Quanto a diretoria cobra e quanto o mercado aperta.',
    sec4:'O clube que você vai comandar',sec4Sub:'Você entra no lugar do head coach; o dono continua.'},
  jogador:{nome:'Jogador',ic:'mira',cor:'#18E5B4',img:['cenas','ativ-ranked'],slogan:'Você é o jogador.',
    decide:'Seu treino, seus agentes, seu contrato e a sua imagem.',dia:'Você entra em quadra na gameplay, round a round.',
    perde:'O corpo cansa: a carreira acaba quando você pendura o mouse.',
    selo:'Player card',secVoce:'O jogador',secVoceSub:'O nick no placar, o país e a idade com que você estreia.',
    sec2:'A sua ficha',sec2Sub:'Função, agentes, estilo, ponto de partida, over e potencial.',sec3Sub:'Quanto o técnico, a torcida e o mercado exigem de você.',
    sec4:'Onde você assina',sec4Sub:'O clube é da IA: você disputa a vaga no cinco.'},
  dono:{nome:'Dono',ic:'coroa',cor:'#E2B45A',img:['cenas','sala-diretoria'],slogan:'A organização é sua.',
    decide:'Técnico, verba, marca, investidores e o futuro do clube.',dia:'Você assiste, ou senta no banco no Dono-técnico.',
    perde:'Quando o caixa quebra ou os sócios tomam o controle.',
    selo:'Proprietário',secVoce:'O dono',secVoceSub:'O nome na porta do escritório.',
    sec2:'Como você comanda',sec2Sub:'Variante, estilo de gestão e como você chega ao circuito.',sec3Sub:'Mais caixa e investidores pacientes no Fácil; o contrário no Difícil.',
    sec4:'A organização',sec4Sub:'Assuma uma que já existe, ou monte a sua do zero.'}
};
/* a arte animada de cada portal: setas táticas, mira, brilho dourado */
function arteDoModo(id){
  if(id==='treinador')return `<svg class="pm-arte pm-tat" viewBox="0 0 300 200" aria-hidden="true">
      <path class="pm-seta" d="M40 160 C 80 120, 110 130, 150 90" /><path class="pm-seta d2" d="M60 60 C 110 70, 150 40, 200 70" />
      <path class="pm-seta d3" d="M250 160 C 220 130, 200 120, 175 100" />
      <circle cx="40" cy="160" r="7" class="pm-o"/><circle cx="60" cy="60" r="7" class="pm-o"/><circle cx="250" cy="160" r="7" class="pm-o"/>
      <path d="M143 82l14 14M157 82l-14 14M193 62l14 14M207 62l-14 14M168 92l14 14M182 92l-14 14" class="pm-x"/></svg>`;
  if(id==='jogador')return `<svg class="pm-arte pm-mira" viewBox="0 0 300 200" aria-hidden="true">
      <circle cx="150" cy="100" r="34" class="pm-anel"/><circle cx="150" cy="100" r="3" class="pm-ponto"/>
      <path d="M150 52v26M150 122v26M102 100h26M172 100h26" class="pm-cruz"/></svg><i class="pm-scan"></i>`;
  return `<i class="pm-brilho"></i><svg class="pm-arte pm-ouro" viewBox="0 0 300 200" aria-hidden="true">
      <path d="M0 150 L300 40" class="pm-veio"/><path d="M0 175 L300 70" class="pm-veio v2"/></svg>`;
}
function portaisDeModo(selT){
  return `<div class="pm-l">${['treinador','jogador','dono'].map((id,i)=>{
    const M=MODO_NJ[id],on=escPapel===id;
    return `<button class="pm pm-${id} ${on?'on':''}" data-papel="${id}" style="--pm:${M.cor};--i:${i}">
      <span class="pm-img">${typeof cenaFoto==='function'?cenaFoto(M.img[0],M.img[1],selT,{cls:'pm-foto',foco:'placa',ansioso:true}):''}</span>
      <span class="pm-veu"></span>${arteDoModo(id)}
      <span class="pm-c">
        <span class="pm-ic">${icone(M.ic)}</span>
        <span class="pm-nome">${esc(M.nome)}</span>
        <span class="pm-slogan">${esc(M.slogan)}</span>
        <span class="pm-linhas">
          <span><em>Você decide</em>${esc(M.decide)}</span>
          <span><em>No dia de jogo</em>${esc(M.dia)}</span>
          <span><em>Você perde quando</em>${esc(M.perde)}</span>
        </span>
        <span class="pm-cta">${on?icone('check')+' Modo escolhido':'Escolher este modo'}</span>
      </span></button>`;}).join('')}</div>`;
}

/* ============================================================
   DENTRO DA CARREIRA: o tema de cada modo
   ============================================================ */
function papelDaCarreira(){
  if(!G)return null;
  if(typeof modoJogador==='function'&&modoJogador())return 'jogador';
  if(!G.meuTime||!G.manager)return null;
  return typeof souDono==='function'&&souDono()?'dono':'treinador';
}
function aplicarTemaModo(){
  if(typeof document==='undefined')return;
  const p=modo==='jogo'?papelDaCarreira():null;
  document.body.classList.toggle('tema-treinador',p==='treinador');
  document.body.classList.toggle('tema-jogador',p==='jogador');
  if(typeof aplicarTemaDono==='function')aplicarTemaDono();
}

/* ---------- Treinador: a sala tática ---------- */
function navDoTreinador(){
  return [
    ['inicio','Sala tática','Comando','tatica'],['elenco','Elenco','Comando','elenco'],['vestiario','Vestiário','Comando','vestiario'],['preparacao','Treinamento','Comando','alvo'],
    ['estrutura','Estrutura','Clube','estrutura'],['base','Base','Clube','base'],['historia','História','Clube','trofeu'],
    ['mercado','Mercado','Gestão','troca'],['financas','Finanças','Gestão','dinheiro'],
    ['comp','Competições','Circuito','trofeu'],['copa','World Cup','Circuito','estrela'],['stats','Estatísticas','Circuito','grafico'],
    ['premios','Prêmios','Circuito','trofeu'],['news','Notícias','Circuito','jornal'],['donos','Donos','Circuito','gravata'],
    ['editor','Banco de dados','Sistema','banco'],['config','Configurações','Sistema','engrenagem']
  ];
}
function sideCabecalhoTreinador(t){
  const m=typeof membroManager==='function'&&membroManager();
  return `<div class="side-org side-tr">
    <div class="side-tr-r">${m?retratoStaff(m,34):G.manager.foto?`<img src="${G.manager.foto}" alt="">`:`<span class="side-tr-ini">${esc(String(G.manager.nome||'?')[0])}</span>`}</div>
    <div class="n"><b>${esc(G.manager.nome)}</b><span>head coach · ${esc(t.tag)}</span></div><span class="side-tr-esc">${escudo(t,22)}</span></div>`;
}
function anelSimples(v,px,cor,rot){
  const r=px/2-6,c=2*Math.PI*r,k=clamp(v,0,100)/100;
  return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" class="st-anel"><circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(c*k).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${px/2} ${px/2})" class="st-anel-v"/>
    <text x="${px/2}" y="${px/2+8}" text-anchor="middle" class="st-anel-n">${Math.round(v)}</text>${rot?`<text x="${px/2}" y="${px/2+26}" text-anchor="middle" class="st-anel-t">${rot}</text>`:''}</svg>`;
}
function salaTaticaHero(t,rr,sit){
  const g=G.manager,m=typeof membroManager==='function'&&membroManager();
  const pos=typeof posicaoNaTabela==='function'?posicaoNaTabela(t,rr):null,tp=t.temporada||{v:0,d:0};
  const est=typeof estiloTreinador==='function'?estiloTreinador(g.estilo):{nome:''};
  const md=typeof modoTreinador==='function'?modoTreinador(g.modo):{nome:''};
  const meta=(sit&&sit.metas||[]).find(x=>x.peso>0);
  const c=sit&&sit.confianca!=null?sit.confianca:50;
  const cor=c>=60?'#18E5B4':c>=35?'#E8A33D':'#FF4655';
  const chefe=sit&&sit.chefe;
  return `<section class="st-hero" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    ${typeof cenaFoto==='function'?cenaFoto('estrutura','analise',t,{cls:'st-hero-f',foco:'placa',ansioso:true}):''}
    <div class="st-hero-v"></div>
    <svg class="st-hero-tat" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"><path d="M30 250 C 120 200, 160 210, 230 150"/><path class="d2" d="M60 90 C 150 110, 220 60, 300 100"/><path class="d3" d="M560 260 C 500 210, 470 190, 420 160"/></svg>
    <div class="st-hero-c">
      <div class="st-quem">
        <div class="st-cred"><span class="st-cred-clip"></span>${retratoManager(96)}<span class="st-cred-rot">HEAD COACH</span><span class="st-cred-esc">${escudo(t,30)}</span></div>
        <div>
          <div class="eyebrow">Sala tática · temporada ${G.ano}</div>
          <h1 class="st-nome">${esc(g.nome)}</h1>
          <div class="st-cargo">Head coach do <b>${esc(t.nome)}</b> · ${esc(nomeLiga(t))}</div>
          <div class="st-tags"><span class="st-tag v">${esc(md.nome)}</span><span class="st-tag">${esc(est.nome)}</span>${m?`<span class="st-tag">coach <b class="num">${overStaff(m)}</b></span>`:''}</div>
        </div>
      </div>
      <div class="st-conf">
        ${anelSimples(c,112,cor,'confiança')}
        <div class="st-conf-t"><div class="st-conf-l">${chefe?'Quem cobra':'Diretoria'}</div><b>${esc(chefe?chefe.d.nome:'A diretoria')}</b>
          <span class="dim">${esc(sit?sit.texto:'')}</span>
          </div>
      </div>
    </div>
    ${(sit&&sit.metas||[]).length?`<div class="st-metas">${sit.metas.map(x=>{const est=x.cumprida===true?'ok':x.cumprida===false?'nao':'';
      return `<span class="st-m ${est} ${x.peso?'princ':''}">${icone(x.cumprida===true?'check':x.cumprida===false?'x':'alvo')}<em>${x.peso?'Meta':x.momento==='meio'?'Meio do ano':'Bônus'}</em>${esc(x.texto)}</span>`;}).join('')}</div>`:''}
    <div class="st-pills">
      <div><span>Campanha</span><b class="num">${tp.v}–${tp.d}</b></div>
      <div><span>Posição</span><b class="num">${pos&&(tp.v+tp.d)>0?pos.pos+'º':'—'}</b></div>
      <div><span>Over do time</span><b class="num">${overTitulares(t)}</b></div>
      <div><span>Entrosamento</span><b class="num">${Math.round(t.sinergia)}</b></div>
      <div><span>Forma</span><b>${formaRecente(t.id,5)}</b></div>
    </div>
  </section>`;
}

/* ============================================================
   NOVO JOGO — o criador de personagem
   À esquerda, a sua carta ao vivo (crachá, player card ou retrato
   do dono), que muda a cada escolha; à direita, as escolhas em
   peças grandes com ícone, e não em campos de formulário.
   ============================================================ */
const IC_NJ={
  estrategista:'mapa',tecnico:'mira',motivador:'vestiario',disciplinador:'relogio',carreira:'arvore',lenda:'estrela',
  facil:'base',normal:'alvo',dificil:'fogo',
  livre:'casa',puro:'predio',hibrido:'tatica',ambicioso:'fogo',paciente:'relogio',investidor:'grafico',economico:'dinheiro',midiatico:'estrela',
  assumir:'aperto',criar:'mais',
  Duelista:'fogo',Iniciador:'olho',Controlador:'mapa',Sentinela:'base',Flex:'troca',
  entrada:'fogo',suporte:'elenco',ancora:'base',lurker:'olho',mira:'mira',
  ranked:'mira',tier2:'trofeu',banco:'elenco',titular:'estrela'
};
function icNJ(k){return `<span class="cr-tic">${icone(IC_NJ[k]||'alvo')}</span>`;}
function _fotoPrev(){
  return `<label class="crd-foto" title="Escolher foto">${escFoto?`<img src="${escFoto}" alt="">`:`<span>${icone('mais')}<b>Sua foto</b></span>`}
    <input type="file" id="njFoto" accept="image/*" hidden></label>`;
}
function previewPersonagem(selT){
  const nome=esc(String(escNome||'').trim()||(escPapel==='jogador'?'SEU NICK':'SEU NOME'));
  const pais=`<span class="crd-pais">${bandeira(escPais)} ${esc(PAISES[escPais]||escPais)}</span>`;
  if(escPapel==='jogador'){
    const fake={id:'njprev',nome:String(escNome||'').trim()||'Você',role:escJ.funcao,foto:escFoto||(typeof silhuetaCarta==='function'?silhuetaCarta():''),timeId:selT?selT.id:null,pais:escPais,genero:escGenero,idade:escIdade};
    const ini=typeof inicioJogador==='function'?inicioJogador(escJ.inicio):{nome:''};
    return `<div class="crd crd-jg">
      <div class="crd-carta">${cartaJogador(fake,{w:230,o:escJ.over,semMundial:true})}<i class="crd-brilho"></i></div>
      <label class="crd-trocafoto">${icone('caneta')} ${escFoto?'trocar foto':'pôr a sua foto'}<input type="file" id="njFoto" accept="image/*" hidden></label>
      <div class="crd-nome" id="crNome">${nome}</div>
      <div class="crd-sub">${pais}<span id="crIdade">${escIdade} anos</span></div>
      <div class="crd-ags">${(escJ.ag||[]).map((a,i)=>`<span class="crd-ag ${i?'':'main'}"><img src="${ASSETS.agente(a)}" alt="" onerror="this.style.opacity=0"><b>${esc(a)}</b></span>`).join('')}</div>
      <div class="crd-stats"><div><span>Over</span><b class="num">${escJ.over}</b></div><div><span>Teto</span><b class="num">${escJ.pot}</b></div><div><span>Começa</span><b>${esc(ini.nome)}</b></div></div>
    </div>`;
  }
  if(escPapel==='dono'){
    const v=typeof varianteDono==='function'?varianteDono(escVariante):{nome:''};
    const pf=(typeof PERFIS_DONO!=='undefined'&&PERFIS_DONO[escPerfilDono])||{nome:''};
    return `<div class="crd crd-dn">
      <i class="crd-brilho"></i>
      <div class="crd-topo"><span>PROPRIETÁRIO</span>${selT&&escComeco!=='criar'?escudo(selT,28):icone('coroa')}</div>
      ${_fotoPrev()}
      <div class="crd-nome" id="crNome">${nome}</div>
      <div class="crd-sub">${pais}<span id="crIdade">${escIdade} anos</span></div>
      <div class="crd-stats"><div><span>Comando</span><b>${esc(v.nome)}</b></div><div><span>Gestão</span><b>${esc(pf.nome)}</b></div>
        <div><span>Organização</span><b>${escComeco==='criar'?'a fundar':selT?esc(selT.tag):'—'}</b></div></div>
    </div>`;
  }
  const md=typeof modoTreinador==='function'?modoTreinador(escModo):{nome:'',over:{1:80,2:64}};
  const est=typeof estiloTreinador==='function'?estiloTreinador(escEstilo):{nome:''};
  return `<div class="crd crd-tr">
    <span class="crd-clip"></span>
    <div class="crd-topo"><span>VCT ${G?G.ano:''} · STAFF</span>${selT?escudo(selT,28):''}</div>
    ${_fotoPrev()}
    <div class="crd-nome" id="crNome">${nome}</div>
    <div class="crd-cargo">HEAD COACH${selT?' · '+esc(selT.tag):''}</div>
    <div class="crd-sub">${pais}<span id="crIdade">${escIdade} anos</span></div>
    <div class="crd-stats"><div><span>Coach</span><b class="num">${md.over[escTier]||md.over[1]}</b></div><div><span>Estilo</span><b>${esc(est.nome)}</b></div><div><span>Trajetória</span><b>${esc(md.nome)}</b></div></div>
    <div class="crd-barras" aria-hidden="true">${Array.from({length:34},(_,i)=>`<i style="width:${[1,2,1,3,1,2][i%6]}px"></i>`).join('')}</div>
  </div>`;
}
/* a seção 1 em forma de criador: nome grande, país, idade e gênero */
function camposPersonagem(){
  const jog=escPapel==='jogador';
  return `<div class="cr-campos">
    <label class="cr-nome-l"><span>${jog?'Seu nick':'Seu nome'}</span>
      <input type="text" id="njNome" class="cr-nome-in" value="${esc(escNome)}" maxlength="${jog?20:28}" placeholder="${jog?'o nome no placar':'como a imprensa vai te chamar'}" autocomplete="off"></label>
    ${jog?`<label class="cr-c"><span>Nome real</span><input type="text" id="njNomeReal" value="${esc(escJ.nomeReal)}" maxlength="40" placeholder="opcional"></label>`:''}
    <div class="cr-row">
      <label class="cr-c"><span>Nacionalidade</span>${selectPais('id="njPais"',escPais)}</label>
      <label class="cr-c"><span>Idade</span><div class="cr-idade"><input type="range" id="njIdade" value="${escIdade}" min="${jog?15:22}" max="${jog?40:70}"><b class="num" id="crIdadeN">${escIdade}</b></div></label>
    </div>
    <div class="cr-c"><span>Gênero</span><div class="cr-gen">
      <button type="button" class="${escGenero==='m'?'on':''}" data-gen="m">Masculino</button><button type="button" class="${escGenero==='f'?'on':''}" data-gen="f">Feminino</button></div>
      <select id="njGenero" hidden><option value="m" ${escGenero==='m'?'selected':''}>m</option><option value="f" ${escGenero==='f'?'selected':''}>f</option></select></div>
    ${escFoto?'<button class="btn ghost sm cr-tira" id="njFotoTira">Tirar a foto</button>':''}
  </div>`;
}
/* medidores da dificuldade */
function medidoresDif(k){
  const d=DIFICULDADES[k];
  const m=(rot,v,max,inv)=>{const f=clamp(v/max,0,1);return `<span class="cr-med"><em>${rot}</em><i><u class="${inv?'inv':''}" style="width:${Math.round(f*100)}%"></u></i></span>`;};
  return `<span class="cr-meds">${m('Caixa',d.caixa,1.5)}${m('Cobrança',d.cobranca,1.3,true)}${m('Salários',d.salario-0.8,0.3,true)}</span>`;
}

/* ============================================================
   CABEÇALHO COM IMAGEM POR MODO
   As telas de trabalho de cada modo abrem com uma faixa de foto do
   ambiente, o ícone do modo e dois ou três números da tela. Para as
   telas que já começam com eyebrow + título, a faixa toma o lugar
   deles; nas que não têm título, entra antes do conteúdo.
   ============================================================ */
const CAB_MODO={
  treinador:{
    elenco:{img:['estrutura','gh'],ic:'elenco',sub:'Quem joga, quem espera e como cada um chega à semana.',
      chips:t=>{const ti=t.titulares.map(P).filter(Boolean),om=ti.length?Math.round(ti.reduce((s,p)=>s+over(p),0)/ti.length):0,les=t.elenco.map(P).filter(p=>p&&p.lesao).length;
        return [['elenco',t.elenco.length+' no elenco'],['estrela','over titular '+om],les?['lesao',les+' lesionado'+(les>1?'s':'')]:['base','ninguém lesionado']];}},
    vestiario:{img:['estrutura','mente'],ic:'vestiario',sub:'Entrosamento das duplas, moral e a atividade da semana. O time joga como convive.',
      chips:t=>{const js=t.elenco.map(P).filter(Boolean),mo=js.length?Math.round(js.reduce((s,p)=>s+(p.moral||0),0)/js.length*100):0;
        return [['coracao','moral média '+mo],['elenco',js.length+' no vestiário']];}},
    preparacao:{img:['estrutura','treino'],ic:'alvo',sub:'Plano da semana, táticas, comps e o preparo de cada mapa para o próximo jogo.',
      chips:t=>{const a=typeof proximoAdversarioDe==='function'?proximoAdversarioDe(t):null;return [a?['mira','próximo: '+(a.tag||a.nome)]:['relogio','sem jogo nesta semana'],['tatica','agressividade '+t.tatica.agres]];}},
    mercado:{img:['cenas','sala-negociacao'],ic:'troca',sub:'Scout, propostas, comissão técnica e contratos. Tudo que entra e sai do clube.',
      chips:t=>[[G.janela?'troca':'cadeado',G.janela?'janela aberta':'janela fechada'],['dinheiro','caixa '+money(t.caixa)],['contrato','folga '+money(typeof folgaSalarial==='function'?folgaSalarial(t):0)+'/mês']]},
    financas:{img:['cenas','sala-diretoria'],ic:'dinheiro',sub:'De onde vem e para onde vai o dinheiro, e quanto a diretoria deixa gastar.',
      chips:t=>[['dinheiro','caixa '+money(t.caixa)]]},
    base:{img:['estrutura','academia'],ic:'base',sub:'A categoria de base, o radar das rankeds e as promessas que podem subir.',chips:null},
    historia:{img:['cenas','palco-premios'],ic:'trofeu',sub:'Títulos, campanhas e quem fez história com essa camisa.',chips:null}
  },
  jogador:{
    talentos:{img:['cenas','ativ-sessao'],ic:'arvore',titulo:'Talentos',eyebrow:'Carreira',sub:'Onde os pontos do seu auge viram jeito de jogar.',chips:null},
    contrato:{img:['cenas','sala-negociacao'],ic:'troca',titulo:'Contrato e mercado',eyebrow:'Carreira',sub:'O que você assinou, quem quer você e o que dá para pedir.',
      chips:()=>{const p=meuJogador(),c=clubeDoJogador();if(!p)return null;return [c?['clube',c.nome]:['mira','sem clube'],['dinheiro',(typeof moneyJ==='function'?moneyJ:money)(p.salario||0)+'/mês'],['contrato',(p.contrato||0)+' ano'+(p.contrato===1?'':'s')+' de contrato']];}},
    financas:{img:['cenas','ativ-folga'],ic:'dinheiro',titulo:'Finanças',eyebrow:'Carreira',sub:'Salário, lives e patrocínio de um lado; empresário, staff e estilo de vida do outro.',
      chips:()=>{const p=meuJogador();return p?[['dinheiro','caixa '+(typeof moneyJ==='function'?moneyJ:money)((G.voce&&G.voce.caixa)||0)],['contrato',(typeof moneyJ==='function'?moneyJ:money)(p.salario||0)+'/mês']]:null;}}
  }
};
function cabecalhoModo(papel,c,eyebrow,titulo,t){
  const chips=c.chips?c.chips(t):null;
  return `<section class="mcab mcab-${papel}" ${t?`style="--clube:${corDoClube(t)}"`:''}>
    ${typeof cenaFoto==='function'?cenaFoto(c.img[0],c.img[1],t,{cls:'mcab-f',foco:'placa',ansioso:true}):''}
    <i class="mcab-tex" aria-hidden="true"></i>
    <div class="mcab-c"><span class="mcab-ic">${icone(c.ic)}</span>
      <div class="mcab-t"><div class="eyebrow">${eyebrow}</div><h2 class="sec">${titulo}</h2><p>${c.sub}</p>
      ${chips&&chips.length?`<div class="mcab-chips">${chips.filter(Boolean).map(([ic,txt])=>`<span>${icone(ic)}${esc(txt)}</span>`).join('')}</div>`:''}</div></div>
  </section>`;
}
/* chamado pelo render() com o html pronto da tela */
function aplicarCabecalhoModo(html,k){
  try{
    const papel=typeof papelDaCarreira==='function'?papelDaCarreira():null;
    if(papel!=='treinador'&&papel!=='jogador')return html;
    if(papel==='treinador'&&G.manager&&G.manager.demitido)return html;
    const c=(CAB_MODO[papel]||{})[k];if(!c)return html;
    const t=papel==='jogador'?(typeof clubeDoJogador==='function'?clubeDoJogador():null):meu();
    const re=/^((?:\s*<div class="guia">[\s\S]*?<\/div>)?)\s*<div class="eyebrow">([^<]*)<\/div>\s*<h2 class="sec">([^<]*)<\/h2>/;
    const m=html.match(re);
    if(m)return m[1]+cabecalhoModo(papel,c,m[2],m[3],t)+html.slice(m[0].length);
    if(!c.titulo)return html;
    const g=html.match(/^\s*<div class="guia">[\s\S]*?<\/div>/);
    const pre=g?g[0]:'';
    return pre+cabecalhoModo(papel,c,esc(c.eyebrow),esc(c.titulo),t)+html.slice(pre.length);
  }catch(e){return html;}
}

/* ============================================================
   BOAS-VINDAS DO TREINADOR E DO JOGADOR
   A mesma ideia da chegada do dono: uma cena curta, uma vez por
   carreira, com o que é seu agora e o que se espera de você.
   ============================================================ */
function _bvFechar(){const o=$('#modal .ovl');if(o)o.classList.add('sai');setTimeout(()=>{$('#modal').innerHTML='';render();},260);}
function talvezBoasVindasModo(){
  if(typeof document==='undefined'||$('#modal').innerHTML)return;
  const papel=typeof papelDaCarreira==='function'?papelDaCarreira():null;
  if(papel==='treinador'){
    const g=G.manager;if(!g||g.demitido||g.boasVindasTr)return;
    const t=meu();if(!t)return;
    g.boasVindasTr=G.ano;
    /* save antigo, já no meio da carreira: marca e não interrompe */
    if((G.semana||1)>3||(g.historico||[]).length)return;
    const m=typeof membroManager==='function'&&membroManager();
    const sit=typeof situacaoManager==='function'?situacaoManager():null;
    const meta=(sit&&sit.metas||[]).find(x=>x.peso>0)||(g.metas||[])[0];
    const ti=t.titulares.map(P).filter(Boolean),om=ti.length?Math.round(ti.reduce((s,p)=>s+over(p),0)/ti.length):0;
    const chefe=typeof chefeDoClube==='function'?chefeDoClube():null;
    const md=typeof modoTreinador==='function'?modoTreinador(g.modo):{nome:''};
    $('#modal').innerHTML=`<div class="ovl bv-ovl"><div class="bv bv-tr" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
      ${typeof cenaFoto==='function'?cenaFoto('estrutura','analise',t,{cls:'bv-f',foco:'placa',ansioso:true}):''}
      <div class="bv-v"></div><i class="bv-grade" aria-hidden="true"></i>
      <div class="bv-c">
        <div class="bv-linha"></div>
        <div class="bv-cracha"><span class="bv-clip"></span><span class="bv-cr-top">VCT ${G.ano} · STAFF ${escudo(t,22)}</span>
          <span class="bv-cr-foto">${m?retratoStaff(m,110):g.foto?`<img src="${g.foto}" alt="">`:''}</span>
          <b>${esc(g.nome)}</b><em>HEAD COACH · ${esc(t.tag)}</em></div>
        <div class="bv-ey">${esc(md.nome)} · temporada ${G.ano}</div>
        <h1 class="bv-t">O comando é seu</h1>
        <div class="bv-s">${esc(g.nome)}, a partir de hoje o vestiário do <b>${esc(t.nome)}</b> responde a você.</div>
        <div class="bv-n">
          <div><span>Over dos titulares</span><b class="num">${om}</b></div>
          <div><span>Quem cobra</span><b>${esc(chefe?chefe.curto:'a diretoria')}</b></div>
          <div><span>Confiança</span><b class="num">${Math.round(g.confianca||50)}</b></div>
        </div>
        ${meta?`<div class="bv-meta">${icone('alvo')} <span>Meta da temporada: <b>${esc(meta.texto)}</b></span></div>`:''}
        <p class="bv-p">Você escala, monta a tática, define o treino e o veto, e joga ou simula as séries. A confiança sobe com resultado e cai com derrota; se chegar ao fundo, a diretoria te demite.</p>
        <button class="btn bv-b" id="bvEntrar">Entrar na sala tática</button>
      </div></div></div>`;
    $('#bvEntrar').onclick=_bvFechar;
    return;
  }
  if(papel==='jogador'){
    const p=meuJogador();if(!p||!G.voce||G.voce.boasVindas||G.voce.aposentado)return;
    G.voce.boasVindas=G.ano;
    if((G.semana||1)>3||(G.voce.desde&&G.voce.desde!==G.ano))return;
    const t=clubeDoJogador();
    const ch=t&&typeof chanceDeJogar==='function'?chanceDeJogar():null;
    const ini=typeof inicioJogador==='function'?inicioJogador(G.voce.inicio):{nome:''};
    $('#modal').innerHTML=`<div class="ovl bv-ovl"><div class="bv bv-jg" style="--clube:${t?corDoClube(t):'#18E5B4'};--clube-rgb:${t?rgbDe(corDoClube(t)):'24,229,180'}">
      ${typeof cenaFoto==='function'?cenaFoto('cenas',t?'ativ-sessao':'ativ-ranked',t,{cls:'bv-f',foco:'placa',ansioso:true}):''}
      <div class="bv-v"></div><i class="bv-scan" aria-hidden="true"></i>
      <div class="bv-c">
        <div class="bv-linha"></div>
        <div class="bv-carta">${typeof cartaJogador==='function'?cartaJogador(p,{w:170}):''}</div>
        <div class="bv-ey">${esc(p.role)} · ${p.idade} anos · ${esc(ini.nome)}</div>
        <h1 class="bv-t">${t?'Bem-vindo ao '+esc(t.tag||t.nome):'A ladder te espera'}</h1>
        <div class="bv-s">${t?`<b>${esc(p.nome)}</b>, o seu nome já está no elenco do <b>${esc(t.nome)}</b>.`:`<b>${esc(p.nome)}</b>, sem clube ainda: é na ranked que os olheiros procuram.`}</div>
        <div class="bv-n">
          <div><span>Over</span><b class="num">${over(p)}</b></div>
          <div><span>Potencial</span><b class="num">${p.pot}</b></div>
          ${t?`<div><span>Salário</span><b class="num">${money(p.salario||0)}/mês</b></div>`:''}
          ${ch?`<div><span>Chance de jogar</span><b class="num">${ch.pct}%</b></div>`:''}
        </div>
        <p class="bv-p">Você treina, escolhe os agentes, cuida do corpo, da fama e do contrato. O técnico decide quem joga, e é a sua semana que convence ele. A carreira acaba quando você pendurar o mouse.</p>
        <button class="btn bv-b" id="bvEntrar">Começar a carreira</button>
      </div></div></div>`;
    $('#bvEntrar').onclick=_bvFechar;
  }
}
