/* ============================================================
   PÓS-CARREIRA — quem pendura o mouse não some
   ------------------------------------------------------------
   Antes o aposentado era apagado do save (só o Hall da Fama ficava).
   Agora, na aposentadoria, cada jogador com carreira de verdade ganha
   um destino conforme o perfil:

     head coach  liderança alta (ou era o IGL)
     analista    visão de jogo e utilidade altas
     olheiro     carreira longa, qualquer função
     caster      relevância alta (pontosDeLenda), vira voz do circuito
     dono        lenda de verdade, uma a cada várias temporadas: compra
                 um clube da região, de preferência do Tier 2

   Os três primeiros entram no mercado de comissão como membros de
   verdade (core/staff.js), com o nick e a foto de jogador. Quem jogou
   no seu clube lembra dele: pede menos para voltar.

   O destino é sorteado num gerador LOCAL, semeado pelo próprio
   jogador e pelo ano, e o gerador do motor volta intacto. Assim a
   aposentadoria não empurra a sequência de sorteios do circuito.
   ============================================================ */
const POS_MAPAS_MIN=150;          /* abaixo disso a carreira foi curta demais */
const POS_LIDER=72, POS_VISAO=79;
const DONO_PONTOS=10;             /* pontosDeLenda para comprar um clube (o Hall da Fama pede 14) */
const DONO_INTERVALO=3;           /* temporadas mínimas entre dois donos novos */
const CASTERS_MAX=8;
const DESCONTO_EX_CLUBE=0.85;     /* ex-jogador seu pede 15% menos para voltar */

/* gerador local: guarda o estado do motor, sorteia, devolve o estado */
function _hashPos(txt){let h=2166136261;const s=String(txt);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function comSorteioLocal(chave,fn){
  const guarda=_s;srand(_hashPos(chave)||1);
  try{return fn();}finally{_s=guarda;}
}

function regiaoDoJogador(p){
  const R=REGIONS.find(r=>r.paises.includes(p.pais));
  if(R)return R.id;
  const t=p.timeId&&G.times[p.timeId];
  return t?t.regiao:REGIONS[0].id;
}
/* clubes por onde passou, em ids (o histórico guarda nomes) */
function clubesDoJogador(p){
  const ids=new Set();
  for(const h of p.hist||[]){
    const t=typeof acharClubePorNome==='function'?acharClubePorNome(h.time):null;
    if(t)ids.add(t.id);
  }
  if(p.timeId)ids.add(p.timeId);
  return[...ids];
}
function podeTerDono(){
  const ult=(G.donos||[]).slice(-1)[0];
  return !ult||G.ano-ult.ano>=DONO_INTERVALO;
}

/* Qual destino, se algum. Pesos, não regras: o IGL tende a virar coach, mas
   pode virar caster; quem não tem perfil nenhum simplesmente sai de cena. */
function destinoDe(p){
  const c=p.carreira||{},L=typeof pontosDeLenda==='function'?pontosDeLenda(p):0;
  /* carreira de verdade: mapas jogados na carreira ou um pico de elite (o
     veterano que se aposenta nas primeiras temporadas tem poucos mapas no save) */
  if((c.maps||0)<POS_MAPAS_MIN&&(p.pico||0)<80&&L<3)return null;
  const at=p.at||{};
  return comSorteioLocal('pos|'+p.id+'|'+G.ano,()=>{
    if(L>=DONO_PONTOS&&podeTerDono()&&rnd()<0.6)return 'dono';
    const op=[];
    const lider=at.lider||0,leitura=((at.visao||0)+(at.util||0))/2;
    if(lider>=POS_LIDER||p.igl)op.push(['tecnico',1+Math.max(0,lider-POS_LIDER)/8]);
    if(leitura>=POS_VISAO)op.push(['analista',1+Math.max(0,leitura-POS_VISAO)/10]);
    if((c.maps||0)>=350||p.idade>=32)op.push(['olheiro',0.5]);
    if(L>=3||(p.pico||0)>=88)op.push(['caster',0.6+Math.min(1,L/12)]);
    op.push([null,4]);
    const tot=op.reduce((s,x)=>s+x[1],0);
    let r=rnd()*tot;
    for(const[d,w]of op){r-=w;if(r<=0)return d;}
    return null;
  });
}

/* ---------- ex-jogador na comissão ---------- */
function staffDeExJogador(p,cargo){
  const at=p.at||{},c=p.carreira||{};
  const base={tecnico:(at.lider||60)*0.55+(at.visao||60)*0.45,
              analista:(at.visao||60)*0.55+(at.util||60)*0.45,
              olheiro:(at.visao||60)*0.5+(at.consist||60)*0.5}[cargo]||60;
  const pedigree=Math.min(12,(c.intl||0)*3+(c.titulos||0)*0.5);
  const alvo=clamp(Math.round(46+(base-60)*0.6+pedigree),48,84);
  const t=p.timeId&&G.times[p.timeId];
  return comSorteioLocal('staff|'+p.id+'|'+G.ano,()=>{
    const m=criarMembro(cargo,alvo,p.pais,p.idade,nomesStaffUsados(),t?t.tier:2);
    m.nome=p.nome;m.genero='m';m.contrato=0;m.regiaoOrigem=regiaoDoJogador(p);
    /* começa cedo e com teto: o ex-jogador evolui na função */
    m.pot=Math.max(m.pot,Math.min(92,overStaff(m)+8));
    m.ex={id:p.id,nome:p.nome,role:p.role,clubes:clubesDoJogador(p),
      titulos:c.titulos||0,intl:c.intl||0,ano:G.ano,foto:p.foto||null};
    m.salario=salarioStaff(m);m.valor=valorStaff(m);
    G.staff[m.id]=m;(G.staffLivres=G.staffLivres||[]).push(m.id);
    return m;
  });
}
/* desconto de quem volta para casa: usado em salarioPedidoStaff */
function voltaParaCasa(m,destino){return !!(m&&m.ex&&destino&&(m.ex.clubes||[]).includes(destino.id));}

/* ---------- dono de clube ---------- */
function comprarClube(p){
  const reg=regiaoDoJogador(p);
  const livre=t=>!t.dono&&t.regiao===reg;
  let cands=Object.values(G.times).filter(t=>livre(t)&&t.tier===2);
  if(!cands.length)cands=Object.values(G.times).filter(t=>livre(t)).sort((a,b)=>a.prestigio-b.prestigio).slice(0,3);
  if(!cands.length)return null;
  const t=comSorteioLocal('dono|'+p.id+'|'+G.ano,()=>pick(cands.sort((a,b)=>a.id<b.id?-1:1)));
  const aporte=Math.round((typeof receitaAnual==='function'?receitaAnual(t):500000)*0.6/1000)*1000;
  t.caixa+=aporte;
  t.torcida=clamp((t.torcida||0)+8,typeof pisoTorcida==='function'?pisoTorcida(t):0,typeof TORCIDA_MAX!=='undefined'?TORCIDA_MAX:100);
  t.prestigio=clamp(t.prestigio+3,20,99);
  t.dono={nome:p.nome,pais:p.pais,desde:G.ano,exId:p.id,aporte};
  (G.donos=G.donos||[]).push({nome:p.nome,timeId:t.id,ano:G.ano});
  noticia('🏢 '+p.nome+' se aposenta e compra o '+t.nome+': aporte de '+money(aporte)+' e o clube vira o projeto dele.',
    {c:'carreira',t:[t.id],imp:3});
  return t;
}

/* ---------- caster ---------- */
function virarCaster(p){
  (G.casters=G.casters||[]).push({nome:p.nome,pais:p.pais,ano:G.ano,role:p.role});
  if(G.casters.length>CASTERS_MAX)G.casters.shift();
  noticia('🎙 '+p.nome+' pendura o mouse e vai para a cabine: agora é caster do circuito.',{c:'carreira',imp:1});
}

/* Chamada na aposentadoria, depois do Hall da Fama e antes de o jogador ser
   apagado. Registra a despedida (a cerimônia mostra as notáveis). */
const ROT_DESTINO={tecnico:'vira head coach',analista:'vira analista',olheiro:'vira olheiro',caster:'vira caster',dono:'compra um clube'};
function posCarreira(p){
  const destino=destinoDe(p);
  let clube=null;
  if(destino==='tecnico'||destino==='analista'||destino==='olheiro'){
    staffDeExJogador(p,destino);
    const meuEx=G.meuTime&&clubesDoJogador(p).includes(G.meuTime);
    noticia('🎓 '+p.nome+' se aposenta e '+ROT_DESTINO[destino]+(meuEx?' — e lembra com carinho do seu clube':'')+'. Está no mercado de comissão.',
      {c:'carreira',imp:meuEx?2:1});
  }else if(destino==='caster')virarCaster(p);
  else if(destino==='dono')clube=comprarClube(p);
  const c=p.carreira||{},L=typeof pontosDeLenda==='function'?pontosDeLenda(p):0;
  const t=p.timeId&&G.times[p.timeId];
  const notavel=L>=4||(p.pico||0)>=86||(G.meuTime&&p.timeId===G.meuTime)||destino==='dono';
  if(notavel)(G._despedidas=G._despedidas||[]).push({id:p.id,nome:p.nome,pais:p.pais,role:p.role,idade:p.idade,
    tag:t?t.tag:((p.hist||[]).slice().reverse().find(h=>h.time&&h.time!=='Sem clube'&&!/^Base/.test(h.time))||{time:'sem clube'}).time,titulos:c.titulos||0,intl:c.intl||0,maps:c.maps||0,pts:Math.round(L*10)/10,
    destino:destino||null,clube:clube?clube.nome:null,meu:!!(G.meuTime&&p.timeId===G.meuTime)});
  return destino;
}
