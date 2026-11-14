/* ============================================================
   MODO JOGADOR — FAMA E MÍDIA (J6)
   ------------------------------------------------------------
   SEGUIDORES  o número que a fama mede. Sobem com partida boa,
               jogada grande, título, live e ranked; caem com fase
               ruim, polêmica mal resolvida e sumiço. A fama (0 a
               100) é a escala log deles: 1 mil = 0, 10 mil = 20,
               100 mil = 40, 1 milhão = 60, 10 milhões = 80.
   IMAGEM      de −100 (polêmico) a +100 (querido). Patrocinador
               olha para ela; post provocador e coletiva atravessada
               descem, resposta madura sobe.
   REDES       depois de vitória, derrota, jogada grande, título ou
               polêmica aparece um post para publicar, com três tons:
               humilde, confiante e provocador. Cada um mexe em
               seguidores, imagem, técnico, colegas e torcida.
   ENTREVISTA  depois de série grande, MVP, derrota feia ou rumor de
               mercado, a imprensa pede entrevista: três perguntas,
               três respostas cada.
   MANCHETES   jogada grande, fase ruim (três semanas abaixo do seu
               normal), polêmica, título e marcas de seguidores viram
               notícia no feed.
   PATROCÍNIO  marcas do catálogo (G.marcas) oferecem contrato mensal
               conforme fama e imagem; até três ao mesmo tempo. Imagem
               que despenca faz a marca rescindir.
   A fama também pesa no mercado (core/carreira-mercado.js): mais
   propostas, interesse maior e empresário melhor.
   Sorteios por (ano, semana, assunto), fora do gerador do mundo.
   ============================================================ */

const SEG_INICIAL={ranked:3000,tier2:15000,banco:60000,titular:250000,lenda:2000000};
const PATROCINIOS_MAX=3;

function _sorteFama(salt){return typeof _sorteRel==='function'?_sorteRel('f|'+salt):0.5;}
function seguidores(){if(!G.voce)return 0;if(G.voce.seg==null)G.voce.seg=SEG_INICIAL[G.voce.inicio]||10000;return G.voce.seg;}
function famaJogador(){const s=seguidores();return Math.max(0,Math.min(100,Math.round(20*Math.log10(Math.max(1000,s)/1000))));}
function imagemJogador(){if(!G.voce)return 0;if(G.voce.imagem==null)G.voce.imagem=10;return G.voce.imagem;}
function rotuloImagem(v){return v>=50?'Querido':v>=15?'Boa imagem':v>-15?'Neutra':v>-50?'Polêmico':'Encrenqueiro';}
function rotuloFama(f){return f>=75?'Estrela mundial':f>=60?'Ídolo':f>=45?'Conhecido no circuito':f>=30?'Nome em ascensão':f>=15?'Conhecido na cena':'Desconhecido';}
function fmtSeg(n){n=Math.round(n||0);return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace('.',',')+' mi':n>=1e3?Math.round(n/1e3)+' mil':String(n);}
/* mexe nos seguidores: fração do que tem + um piso absoluto */
function ganharSeguidores(frac,piso,txt){
  if(!G.voce)return 0;
  const antes=seguidores();
  /* conta grande cresce devagar em proporção: o mesmo post rende menos
     por cento para quem já tem milhões */
  const k=frac>0?Math.max(0.2,1-famaJogador()/110):1;
  const d=Math.round(antes*frac*k+(piso||0));
  G.voce.seg=Math.max(500,antes+d);
  /* marcas redondas viram manchete */
  for(const m of [100000,1000000,10000000])
    if(antes<m&&G.voce.seg>=m&&typeof noticia==='function'){
      const p=meuJogador();noticia(`📈 ${p.nome} passa de ${fmtSeg(m)} de seguidores.`,{c:'carreira',p:[p.id],imp:2});}
  if(txt){if(!G.voce.famaLog)G.voce.famaLog=[];G.voce.famaLog.unshift({ano:G.ano,semana:G.semana,d,txt});G.voce.famaLog.length=Math.min(G.voce.famaLog.length,14);}
  return d;
}
function mexerImagem(d){if(!G.voce)return;G.voce.imagem=Math.max(-100,Math.min(100,Math.round((imagemJogador()+d)*10)/10));}

/* ---------- a semana da fama ---------- */
function famaSemana(p,t,rel){
  if(!G.voce||!p)return;
  seguidores();
  const d=rel&&rel.partidasDiff, maps=rel&&rel.partidas?rel.partidas.maps:0;
  if(!G.voce.formaHist)G.voce.formaHist=[];
  if(maps){
    const acs=d&&d.acs!=null?d.acs:200;
    G.voce.formaHist.unshift(acs);G.voce.formaHist.length=Math.min(G.voce.formaHist.length,12);
    /* partida: o público cresce com o que você faz em quadra */
    const k=Math.max(-0.01,Math.min(0.025,(acs-185)/4000))*Math.min(3,maps);
    ganharSeguidores(k,maps*150,null);
    /* jogada grande: clutch na semana ou um mapa de ACS muito alto */
    if((d&&d.cl>0&&_sorteFama('clutch')<0.6)||acs>=265){
      const txt=d&&d.cl>0?`Clutch de ${p.nome} viraliza${t?' e a torcida do '+t.nome+' vai à loucura':''}.`:`${p.nome} amassa: ACS ${Math.round(acs)} na semana.`;
      if(typeof noticia==='function')noticia('🔥 '+txt,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:2});
      ganharSeguidores(0.04,3000,'Jogada grande virou notícia.');
      _abrirPost('jogada');
    }else if(t&&t.seq!=null)_abrirPost(t.seq>0?'vitoria':'derrota');
    /* fase ruim: três semanas seguidas bem abaixo do normal dele (ou abaixo de 165) */
    const ult=G.voce.formaHist.slice(0,3), resto=G.voce.formaHist.slice(3);
    /* o normal é o dele (ACS de controlador e de duelista são outra escala):
       só julga depois de seis semanas com jogo */
    const normal=resto.length>=3?resto.reduce((s,x)=>s+x,0)/resto.length:null;
    if(normal&&ult.length===3&&ult.every(x=>x<normal*0.88)&&!(G.voce.faseRuim&&_sAbsF()-G.voce.faseRuim<6)){
      G.voce.faseRuim=_sAbsF();
      if(typeof noticia==='function')noticia(`📉 Fase ruim: ${p.nome} soma três semanas abaixo do próprio nível (ACS ${Math.round(ult.reduce((s,x)=>s+x,0)/3)}). Torcida${t?' do '+t.nome:''} cobra nas redes.`,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:2});
      ganharSeguidores(-0.03,0,'A fase ruim virou manchete.');
      mexerImagem(-2);
      _abrirEntrevista('fase');
    }
    /* entrevista depois de semana grande */
    if(acs>=240&&_sorteFama('entrev')<0.35)_abrirEntrevista('destaque');
    else if(t&&t.seq<=-2&&_sorteFama('entrevd')<0.3)_abrirEntrevista('derrota');
  }else{
    /* sumiu: sem jogo, sem live, o público esquece um pouco */
    const s=G.voce.sem||{feitas:[]};
    if(!s.feitas.some(f=>f.id==='live'||f.id==='ranked'))ganharSeguidores(-0.004,0,null);
  }
  if(p.pedidoSaida&&!p.pedidoSaida.negado&&_sorteFama('rumor')<0.15)_abrirEntrevista('mercado');
  /* conflito do vestiário vira polêmica se você respondeu atravessado */
  if(G.voce.polemica&&_sAbsF()-G.voce.polemica<=1)_abrirPost('polemica');
  if(typeof estiloVida==='function'&&estiloVida().id==='luxo')ganharSeguidores(0.003,0,null);
  /* imagem volta devagar para perto do neutro positivo */
  mexerImagem((10-imagemJogador())*0.03);
  _expirarMidia();
  gerarPatrocinios(p);
  pagarPatrocinios(p);
}
/* cita sem cortar palavra no meio */
function _citar(t,n){t=String(t);if(t.length<=n)return t;const c=t.slice(0,n);return c.slice(0,c.lastIndexOf(' '))+'…';}
function _sAbsF(){return typeof semAbs==='function'?semAbs():(G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function _expirarMidia(){
  const a=_sAbsF();
  if(G.voce.post&&a-G.voce.post.sem>1)G.voce.post=null;
  if(G.voce.entrevista&&a-G.voce.entrevista.sem>1){G.voce.entrevista=null;}
}
/* chamado quando o clube do jogador ganha um título (core/carreira-mercado.js) */
function famaTitulo(nome){
  if(!G.voce)return;
  const p=meuJogador();
  ganharSeguidores(0.12,15000,`Título${nome?' do '+nome:''}.`);mexerImagem(4);
  _abrirPost('titulo');_abrirEntrevista('titulo');
}

/* ---------- redes ---------- */
const POSTS={
  vitoria:{rot:'Depois da vitória',tons:{
    humilde:'Vitória do time. Cada um fez a sua parte, e a gente segue. Obrigado a quem apoia! 🙏',
    confiante:'Mais uma. Esse time está ficando perigoso. 😤',
    provocador:'Disseram que a gente não chegava. Cadê vocês agora? 🤫'}},
  derrota:{rot:'Depois da derrota',tons:{
    humilde:'Não foi o nosso dia. A responsabilidade é nossa, e a gente volta mais forte.',
    confiante:'Uma derrota não define a gente. Semana que vem é outra história.',
    provocador:'Tem gente aí torcendo contra que vai ter que engolir o que falou. Anotado.'}},
  jogada:{rot:'Depois da jogada grande',tons:{
    humilde:'Só consegui porque o time me deixou na posição certa. Clipe de todo mundo. 💪',
    confiante:'Assiste de novo. Eu espero. 🎯',
    provocador:'Dá pra contar quantos tentaram me parar? Eu não consegui. 😂'}},
  titulo:{rot:'Campeão',tons:{
    humilde:'CAMPEÕES. De todo mundo: time, staff e torcida. Obrigado! 🏆',
    confiante:'Troféu na mão. Agora vem o próximo. 🏆',
    provocador:'Avisei. Quem duvidou, segura essa. 🏆😏'}},
  premio:{rot:'Prêmio do ano',tons:{
    humilde:'Prêmio individual num jogo de cinco. Divido com o time e com quem me ajudou a chegar aqui. 🙏',
    confiante:'Trabalho de um ano inteiro. E ainda tem mais. 🏅',
    provocador:'Disseram que era sorte. Uma temporada inteira de sorte, então. 🏅😏'}},
  polemica:{rot:'Depois da polêmica',tons:{
    humilde:'Passei do ponto. Já conversei com quem precisava. Foco no time.',
    confiante:'Falo o que penso. Resolvido internamente, bola pra frente.',
    provocador:'Não vou pedir desculpa por ser competitivo. Quem não aguenta, que saia da frente.'}}
};
const POST_EF={
  humilde:{seg:0.006,piso:300,img:3,conf:0.5,torc:0.3,dupla:1},
  confiante:{seg:0.012,piso:600,img:0,conf:0,torc:0.1,dupla:0},
  provocador:{seg:0.025,piso:1200,img:-6,conf:-1.5,torc:-0.2,dupla:-1}
};
function _abrirPost(ctx){
  if(!G.voce||!POSTS[ctx])return;
  if(G.voce.post&&G.voce.post.ctx==='titulo')return;
  G.voce.post={ctx,sem:_sAbsF()};
}
function postarNasRedes(tom){
  const post=G.voce&&G.voce.post;
  if(!post)return{ok:false,motivo:'Nada para postar agora.'};
  const e=POST_EF[tom], P=POSTS[post.ctx];
  if(!e||!P)return{ok:false,motivo:'Tom desconhecido.'};
  const p=meuJogador(), t=clubeDoJogador();
  /* depois de derrota ou polêmica, provocar pega muito pior */
  const ruim=(post.ctx==='derrota'||post.ctx==='polemica')&&tom==='provocador';
  const d=ganharSeguidores(e.seg*(ruim?1.4:1),e.piso,`Post ${tom} (${P.rot.toLowerCase()}).`);
  mexerImagem(e.img*(ruim?2:1));
  if(t){
    if(e.conf)mexerConf(e.conf*(ruim?2:1),tom==='provocador'?'Post provocador nas redes.':null);
    if(e.torc)t.torcida=Math.max(0,Math.min(100,(t.torcida||0)+e.torc));
    if(e.dupla)for(const id of t.elenco||[])if(id!==p.id)mexerDupla(t,p.id,id,e.dupla*(ruim?2:1));
    if(typeof atualizarSinergia==='function')atualizarSinergia(t);
  }
  if(ruim&&typeof noticia==='function'){
    noticia(`🔥 Polêmica: ${p.nome} provoca nas redes${post.ctx==='derrota'?' depois da derrota':''}. "${_citar(P.tons[tom],90)}"`,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:2});
    G.voce.polemica=_sAbsF();
  }
  G.voce.post=null;
  return{ok:true,msg:`Postado. ${d>=0?'+':''}${fmtSeg(d)} seguidores.${e.img<0?' A imagem sentiu.':''}`};
}

/* ---------- entrevista ---------- */
const ENTREVISTAS={
  destaque:{rot:'Semana de destaque',q:[
    ['Você foi o melhor do time. É o seu melhor momento?',['É o momento do time. Eu só aproveitei o espaço que eles abriram.','Estou me sentindo bem, sim.','Sempre fui o melhor do time, agora só ficou óbvio.']],
    ['Já se vê numa seleção do ano?',['Penso no próximo jogo. Prêmio é consequência.','Seria um sonho.','Se não me colocarem, vai ser roubado.']]]},
  derrota:{rot:'Sequência de derrotas',q:[
    ['O que está acontecendo com o time?',['A gente está errando em coisas simples. Vamos corrigir juntos.','Fase ruim acontece.','Pergunta para quem está errando. Eu estou fazendo a minha parte.']],
    ['O técnico está certo nas escolhas?',['Confio nele. A gente executa, a responsabilidade é nossa.','Não sou eu quem decide.','Tem coisa que eu faria diferente, e todo mundo sabe.']]]},
  fase:{rot:'Fase ruim',q:[
    ['Os números caíram. O que houve?',['Não estou no meu nível e sei disso. Estou treinando para voltar.','Fase, só isso.','Os números não mostram tudo. Quem entende sabe.']],
    ['A torcida está pedindo outro na sua vaga. Como lida?',['Entendo a cobrança. Respondo no servidor.','Não leio comentário.','Torcida muda de opinião toda semana.']]]},
  titulo:{rot:'Título',q:[
    ['Campeão! Para quem é esse título?',['Para o time inteiro e para quem acreditou desde o começo.','Para a minha família.','Para quem duvidou de mim.']],
    ['Agora é ir atrás do mundial?',['Um passo de cada vez. Hoje é comemorar.','É o objetivo.','O mundial é nosso, ninguém segura.']]]},
  mercado:{rot:'Rumor de mercado',q:[
    ['Você quer sair do clube?',['Tenho contrato e respeito o clube. O resto é com o meu empresário.','Sem comentários.','Quero jogar num lugar que me valorize. Aqui não está rolando.']],
    ['Há propostas de fora?',['Se houver, a gente conversa no momento certo.','Pode ser.','Várias. Os melhores times do mundo sabem quem eu sou.']]]}
};
function _abrirEntrevista(ctx){
  if(!G.voce||!ENTREVISTAS[ctx]||G.voce.entrevista)return;
  G.voce.entrevista={ctx,sem:_sAbsF()};
}
function perguntasEntrevista(){
  const e=G.voce&&G.voce.entrevista;if(!e)return null;
  const E=ENTREVISTAS[e.ctx];
  return{ctx:e.ctx,rot:E.rot,perguntas:E.q.map(([p,rs],i)=>({p,rs:rs.map((txt,k)=>({k,txt}))
    .sort((a,b)=>_sorteFama('ord'+i+a.k)-_sorteFama('ord'+i+b.k))}))};
}
/* respostas: lista de índices k (0 = madura, 1 = morna, 2 = atravessada) */
function responderEntrevista(ks){
  const e=G.voce&&G.voce.entrevista;if(!e)return{ok:false,motivo:'Nenhuma entrevista marcada.'};
  const p=meuJogador(), t=clubeDoJogador(), E=ENTREVISTAS[e.ctx];
  let img=0,conf=0,seg=0,marcante=null;
  ks.forEach((k,i)=>{
    if(k===0){img+=3;conf+=0.7;seg+=0.004;}
    else if(k===1){seg+=0.002;}
    else{img-=6;conf-=1.5;seg+=0.012;marcante=E.q[i][1][2];}
  });
  if(!marcante){const boa=ks.findIndex(k=>k===0);if(boa>=0)marcante=E.q[boa][1][0];}
  mexerImagem(img);if(t&&conf)mexerConf(conf,conf<0?'Entrevista atravessada.':null);
  const d=ganharSeguidores(seg,500,'Entrevista.');
  if(marcante&&typeof noticia==='function')noticia(`🎙 ${p.nome}: "${marcante}"`,{c:'carreira',p:[p.id],t:t?[t.id]:[],imp:img<0?2:1});
  if(img<-5)G.voce.polemica=_sAbsF();
  G.voce.entrevista=null;
  return{ok:true,msg:`${img>=0?'Saiu bem':'Pegou mal'}: imagem ${img>=0?'+':''}${img}, ${d>=0?'+':''}${fmtSeg(d)} seguidores.`};
}
function recusarEntrevista(){if(!G.voce||!G.voce.entrevista)return{ok:false,motivo:'Nada marcado.'};G.voce.entrevista=null;mexerImagem(-1);return{ok:true,msg:'A assessoria recusou por você. A imprensa não gostou muito.'};}

/* ---------- patrocínio pessoal ---------- */
function patrociniosJogador(){if(!G.voce)return[];if(!G.voce.patroc)G.voce.patroc=[];return G.voce.patroc;}
function ofertasPatrocinio(){if(!G.voce)return[];if(!G.voce.ofertasPatroc)G.voce.ofertasPatroc=[];
  G.voce.ofertasPatroc=G.voce.ofertasPatroc.filter(o=>o.validoAte>=_sAbsF()&&G.marcas&&G.marcas[o.marca]);return G.voce.ofertasPatroc;}
/* exigência de cada nível de marca */
function exigenciaMarca(m){
  const n=m.nivel||1;
  /* setores que toleram polêmica: bebida energética, apostas, streaming, games */
  const tolera=/energ|bebida|game|stream|aposta|bet/i.test(m.setor||'');
  return{fama:8+n*11,imagem:tolera?-60:n>=4?20:0};
}
/* calibrado na J8: com três marcas globais, uma lenda ganha de patrocínio
   algo perto do salário, não o dobro dele */
function valorMarca(m){return Math.round((110*Math.pow(m.nivel||1,2))*(1+famaJogador()/60)/50)*50;}
function _marcasPossiveis(p){
  if(!G.marcas)return[];
  const pais=p.pais, reg=p.timeId?G.times[p.timeId].regiao:(typeof regiaoDoPaisMarca==='function'?regiaoDoPaisMarca(pais):null);
  const ja=new Set([...patrociniosJogador().map(x=>x.marca),...ofertasPatrocinio().map(x=>x.marca)]);
  const setores=new Set(patrociniosJogador().map(x=>(G.marcas[x.marca]||{}).setor));
  return Object.values(G.marcas).filter(m=>!ja.has(m.id)&&!setores.has(m.setor)&&
    (m.regiao==='GLOBAL'||(reg&&m.regiao===reg))&&(!m.paises||!m.paises.length||m.paises.includes(pais)))
    .filter(m=>{const e=exigenciaMarca(m);return famaJogador()>=e.fama&&imagemJogador()>=e.imagem;});
}
function gerarPatrocinios(p){
  if(patrociniosJogador().length+ofertasPatrocinio().length>=PATROCINIOS_MAX+1)return;
  const f=famaJogador();
  if(_sorteFama('patroc')>0.04+f*0.0035)return;
  const lista=_marcasPossiveis(p).sort((a,b)=>(b.nivel-a.nivel)||(_sorteFama('m'+a.id)-_sorteFama('m'+b.id)));
  if(!lista.length)return;
  /* a marca mais alta que topa, com um pouco de sorte para baixo */
  const m=lista[Math.min(lista.length-1,Math.floor(_sorteFama('qual')*3))];
  ofertasPatrocinio().push({id:'po'+_sAbsF()+m.id,marca:m.id,mes:valorMarca(m),anos:1+(_sorteFama('anosm')<0.4?1:0),validoAte:_sAbsF()+3});
}
function aceitarPatrocinio(id){
  const o=ofertasPatrocinio().find(x=>x.id===id);
  if(!o)return{ok:false,motivo:'Essa oferta não existe mais.'};
  if(patrociniosJogador().length>=PATROCINIOS_MAX)return{ok:false,motivo:`No máximo ${PATROCINIOS_MAX} patrocinadores ao mesmo tempo.`};
  const m=G.marcas[o.marca];
  patrociniosJogador().push({marca:o.marca,mes:o.mes,ate:_sAbsF()+o.anos*SEMANAS_ANO,desde:_sAbsF()});
  G.voce.ofertasPatroc=ofertasPatrocinio().filter(x=>x!==o);
  const p=meuJogador();
  if(typeof noticia==='function')noticia(`🤝 ${m.nome} fecha patrocínio pessoal com ${p.nome}.`,{c:'carreira',p:[p.id],imp:1});
  return{ok:true,msg:`${m.nome}: ${typeof moneyJ==='function'?moneyJ(o.mes):o.mes}/mês por ${o.anos} ano${o.anos>1?'s':''}.`};
}
function recusarPatrocinio(id){G.voce.ofertasPatroc=ofertasPatrocinio().filter(x=>x.id!==id);return{ok:true,msg:'Oferta recusada.'};}
function patrociniosMensais(){return patrociniosJogador().reduce((s,x)=>s+x.mes,0);}
function pagarPatrocinios(p){
  const a=_sAbsF();
  const ativos=[];
  for(const x of patrociniosJogador()){
    const m=G.marcas&&G.marcas[x.marca];
    if(!m||a>x.ate){if(m&&typeof noticia==='function')noticia(`Acabou o contrato de ${p.nome} com ${m.nome}.`,{c:'carreira',p:[p.id]});continue;}
    /* imagem abaixo do que a marca aceita: rescisão */
    if(imagemJogador()<exigenciaMarca(m).imagem-10){
      if(typeof noticia==='function')noticia(`💔 ${m.nome} rompe o patrocínio com ${p.nome} depois da polêmica.`,{c:'carreira',p:[p.id],imp:2});
      continue;
    }
    ativos.push(x);
  }
  G.voce.patroc=ativos;
  const sem=patrociniosMensais()*12/SEMANAS_ANO;
  if(sem>0&&typeof lancar==='function')lancar(sem,'Patrocínios pessoais','patrocinio');
}
/* assistente: aceita a melhor oferta de patrocínio que ficou parada */
function assistenteDePatrocinio(){
  if(!G.voce||G.voce.autoContrato===false)return;
  const o=ofertasPatrocinio().filter(x=>_sAbsF()-(x.validoAte-3)>=2).sort((a,b)=>b.mes-a.mes)[0];
  if(o&&patrociniosJogador().length<PATROCINIOS_MAX)aceitarPatrocinio(o.id);
}
