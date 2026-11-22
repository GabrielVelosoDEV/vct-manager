/* ============================================================
   MODO JOGADOR — A ROTINA DIÁRIA E A NOVA EVOLUÇÃO (Etapa 4)
   ------------------------------------------------------------
   A rotina: você monta uma vez o que cada dia da semana tem (até
   duas atividades), e ela roda sozinha, dia a dia, simulada. O treino
   do clube cai no primeiro dia livre, o VOD na véspera do jogo, e o
   dia de jogo fica limpo. Quer render mais? Jogue a atividade do dia
   você mesmo: a nota vira XP e medalha. Dia sem nada é descanso e
   devolve energia.

   A evolução: o treino continua enchendo a barra de cada atributo,
   mas o topo da carreira ganha saltos que não dependem de grind:
     · desafios — três por vez, de partida e de treino, com quatro
       semanas para cumprir; cada um vale meio ponto em dois
       atributos, no nível em que você estiver
     · marcos de over (70, 75, 80, 85, 90, 95), com notícia e público
     · momentos — MVP de série, título, semana monstruosa — dão XP na hora
     · foco do split: dois atributos com +30% de XP
     · bootcamp com mentor: duas semanas de +35% de XP, pago
     · medalhas (bronze, prata, ouro) e recorde em cada treino jogado
     · maestria de agente: Aprendiz, Sólido, Especialista e Mestre
   ============================================================ */

/* ---------- a rotina ---------- */
const ROTINA_J_PADRAO=[['range'],['duelo'],['utilidade'],[],[],[],[]];
const ROTINA_J_OPCOES=['range','duelo','dm','retake','utilidade','agente','ranked','live'];
const ENERGIA_DESCANSO_DIA=6;
function rotinaJ(){
  if(!G.voce)return ROTINA_J_PADRAO;
  if(!Array.isArray(G.voce.rotinaJ)||G.voce.rotinaJ.length!==TURNOS_SEMANA)G.voce.rotinaJ=ROTINA_J_PADRAO.map(d=>d.slice());
  return G.voce.rotinaJ;
}
function definirRotinaJ(d,slot,id){
  const r=rotinaJ();
  if(d<0||d>=TURNOS_SEMANA||slot<0||slot>1)return{ok:false,motivo:'Dia inválido.'};
  const l=r[d].slice();
  if(!id){l.splice(slot,1);}
  else{
    if(!ROTINA_J_OPCOES.includes(id))return{ok:false,motivo:'Atividade inválida.'};
    if(l.includes(id)&&l.indexOf(id)!==slot)return{ok:false,motivo:'Já está nesse dia.'};
    l[slot]=id;
  }
  r[d]=l.filter(Boolean).slice(0,ATIV_POR_DIA);
  return{ok:true};
}
function voltarRotinaJPadrao(){if(G.voce)G.voce.rotinaJ=ROTINA_J_PADRAO.map(d=>d.slice());}
function _jogosDoMeuClube(){const t=clubeDoJogador();return t&&typeof diasDeJogoDoClube==='function'?diasDeJogoDoClube(t.id):[];}
/* o primeiro dia sem jogo, de segunda a sábado: é quando o clube treina */
function diaDoColetivo(jogos){
  jogos=jogos||_jogosDoMeuClube();
  for(let d=0;d<TURNOS_SEMANA-1;d++)if(!jogos.includes(d))return d;
  return null;
}
/* o que a rotina põe num dia: [ids] */
function planoDoDiaJ(d,jogos){
  const t=clubeDoJogador();
  jogos=jogos||_jogosDoMeuClube();
  if(jogos.includes(d))return [];
  const l=[];
  if(t&&d===diaDoColetivo(jogos))l.push('coletivo');
  if(t&&jogos.includes(d+1))l.push('vod');
  for(const id of rotinaJ()[d]||[])if(!l.includes(id))l.push(id);
  return l.slice(0,ATIV_POR_DIA);
}
/* fecha um dia: roda o que a rotina marcou e ainda não foi feito; dia vazio
   devolve energia */
function rotinaJogadorDoDia(d){
  const s=semanaJogador(), p=meuJogador();
  if(!s||!p||s.dias[d])return false;
  s.dias[d]=true;
  let fez=false;
  if(G.voce.auto!==false&&!p.lesao){
    const jogos=_jogosDoMeuClube();
    for(const id of planoDoDiaJ(d,jogos)){
      if(s.feitas.some(f=>f.id===id&&(f.dia||0)===d))continue;
      if(porqueNaoAtividade(id,d))continue;
      const alvo=id==='agente'?(G.voce.rotinaAgente&&(p.agentes||[]).includes(G.voce.rotinaAgente)?G.voce.rotinaAgente:(p.agentes||[])[0]):null;
      const r=fazerAtividade(id,{simulado:true,auto:true,dia:d,alvo});
      if(r.ok)fez=true;
    }
  }
  if(!s.feitas.some(f=>(f.dia||0)===d))s.energia=Math.min(ENERGIA_MAX,s.energia+ENERGIA_DESCANSO_DIA);
  return fez;
}

/* ---------- foco do split e bootcamp ---------- */
const FOCO_MULT=1.3, FOCO_ESPERA=6;
const BOOTCAMP_MULT=1.35, BOOTCAMP_SEMANAS=2, BOOTCAMP_ESPERA=10;
function _semAbsJ(){return typeof semAbs==='function'?semAbs():(G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function focoAtual(){const f=G.voce&&G.voce.foco;return f&&Array.isArray(f.a)?f.a:[];}
function porqueNaoFoco(){
  const f=G.voce&&G.voce.foco;
  if(f&&f.sem!=null&&_semAbsJ()-f.sem<FOCO_ESPERA)return `O foco muda de ${FOCO_ESPERA} em ${FOCO_ESPERA} semanas: faltam ${FOCO_ESPERA-(_semAbsJ()-f.sem)}.`;
  return null;
}
function definirFoco(lista){
  if(!G.voce)return{ok:false,motivo:'Sem carreira.'};
  const ks=[...new Set(lista||[])].filter(k=>ATTRS.some(a=>a[0]===k)).slice(0,2);
  if(ks.length!==2)return{ok:false,motivo:'Escolha dois atributos.'};
  const m=porqueNaoFoco();
  const atual=focoAtual();
  if(m&&atual.length)return{ok:false,motivo:m};
  G.voce.foco={a:ks,sem:_semAbsJ()};
  return{ok:true,msg:'Foco do split: '+ks.map(k=>(ATTRS.find(a=>a[0]===k)||[k,k])[1]).join(' e ')+'.'};
}
function precoBootcamp(){const p=meuJogador();return Math.round((4000+Math.max(0,(p?over(p):60)-60)*450)/100)*100;}
function bootcampAtivo(){const b=G.voce&&G.voce.bootcamp;return !!(b&&_semAbsJ()>=b.ini&&_semAbsJ()<b.ini+BOOTCAMP_SEMANAS);}
function porqueNaoBootcamp(){
  const b=G.voce&&G.voce.bootcamp;
  if(bootcampAtivo())return 'Bootcamp em andamento.';
  if(b&&_semAbsJ()-b.ini<BOOTCAMP_ESPERA)return `O próximo bootcamp abre em ${BOOTCAMP_ESPERA-(_semAbsJ()-b.ini)} semana(s).`;
  if(typeof caixaJogador==='function'&&caixaJogador()<precoBootcamp())return `Custa ${typeof moneyJ==='function'?moneyJ(precoBootcamp()):precoBootcamp()}.`;
  return null;
}
function iniciarBootcamp(){
  const m=porqueNaoBootcamp();if(m)return{ok:false,motivo:m};
  if(typeof lancar==='function')lancar(-precoBootcamp(),'Bootcamp com mentor','bootcamp');
  G.voce.bootcamp={ini:_semAbsJ()};
  return{ok:true,msg:`Bootcamp marcado: ${BOOTCAMP_SEMANAS} semanas de XP +${Math.round((BOOTCAMP_MULT-1)*100)}%.`};
}
function multEvolucao(k){
  if(!G||!G.voce)return 1;
  return (focoAtual().includes(k)?FOCO_MULT:1)*(bootcampAtivo()?BOOTCAMP_MULT:1);
}

/* ---------- medalhas e recordes ---------- */
const MEDALHAS=[['ouro',1.2],['prata',0.9],['bronze',0.6]];
const MEDALHA_NOME={ouro:'Ouro',prata:'Prata',bronze:'Bronze'};
function medalhaDaNota(n){for(const [m,v] of MEDALHAS)if(n>=v)return m;return null;}
function medalhasDe(id){const M=(G.voce&&G.voce.medalhas)||{};return M[id]||{ouro:0,prata:0,bronze:0,rec:null};}

/* ---------- maestria de agente ---------- */
const MAESTRIA=[{n:40,nome:'Aprendiz'},{n:60,nome:'Sólido'},{n:75,nome:'Especialista'},{n:90,nome:'Mestre'}];
function tierMaestria(nivel){let t=-1;MAESTRIA.forEach((m,i)=>{if(nivel>=m.n)t=i;});return t;}
function maestriaDe(p,ag){const n=typeof nivelAgente==='function'?nivelAgente(p,ag):0;const t=tierMaestria(n);return{nivel:n,tier:t,nome:t>=0?MAESTRIA[t].nome:'Novato',prox:MAESTRIA[t+1]||null};}
function _checarMaestria(p){
  if(!G.voce||!p)return;
  const M=G.voce.maestria||(G.voce.maestria={});
  const novo=!G.voce.maestriaIni;
  for(const ag of p.agentes||[]){
    const t=maestriaDe(p,ag).tier;
    if(M[ag]==null||novo){M[ag]=t;continue;}
    if(t>M[ag]){
      M[ag]=t;
      if(t>=2){_xpPontos(p,['util','visao'],0.3);}
      if(typeof ganharSeguidores==='function')ganharSeguidores(t>=3?0.01:0.003,t>=3?1500:300,null);
      _momento(p,'maestria',`${ag}: ${MAESTRIA[t].nome}`,t>=2?'+XP de utilidade e visão':'');
      if(t>=3&&typeof noticia==='function')noticia(`${p.nome} virou referência de ${ag}: maestria de Mestre.`,{c:'carreira',p:[p.id]});
    }
  }
  G.voce.maestriaIni=true;
}

/* ---------- XP em "pontos" ----------
   Uma recompensa que vale o mesmo em qualquer nível: o XP de um ponto no
   valor atual do atributo (o potencial e a idade continuam cobrando). */
function _xpPontos(p,ks,pontos){
  const sub={};
  for(const k of ks){if(!(k in p.at))continue;const n=ganharXP(p,k,custoPonto(p.at[k],p)*pontos);if(n)sub[k]=(sub[k]||0)+n;}
  _aposEvoluir(p);
  return sub;
}
function _momento(p,tipo,txt,sub){
  const l=G.voce.momentos||(G.voce.momentos=[]);
  l.unshift({tipo,txt,sub:sub||'',ano:G.ano,semana:G.semana,visto:false});
  l.length=Math.min(l.length,14);
}
function momentosNovos(){return ((G.voce&&G.voce.momentos)||[]).filter(m=>!m.visto);}
function marcarMomentosVistos(){for(const m of (G.voce&&G.voce.momentos)||[])m.visto=true;}

/* ---------- desafios ---------- */
const DESAFIO_SEMANAS=4, DESAFIOS_ATIVOS=3;
const DESAFIOS_J=[
  {id:'abates',clube:true,atr:['mira','reflexo'],meta:()=>60,txt:n=>`Faça ${n} abates em partidas oficiais`},
  {id:'mvp',clube:true,atr:['consist','mira'],meta:()=>2,txt:n=>`Seja o MVP de ${n} séries`},
  {id:'clutch',clube:true,atr:['clutch','visao'],meta:()=>4,txt:n=>`Vença ${n} clutches em partidas oficiais`},
  {id:'entrada',clube:true,atr:['reflexo','mov'],meta:()=>12,txt:n=>`Abra ${n} rounds com o primeiro abate`},
  {id:'vitorias',clube:true,atr:['visao','util'],meta:()=>3,txt:n=>`Vença ${n} séries com o seu clube`},
  {id:'acs',clube:true,atr:['mira','consist'],meta:p=>Math.round((180+Math.max(0,over(p)-60)*2.5)/5)*5,binario:true,
    txt:n=>`Feche uma semana com ACS médio de ${n} ou mais (dois mapas ou mais)`},
  {id:'ouro',atr:null,meta:()=>1,txt:(n,x)=>`Tire ouro no ${(ativJogador(x)||{}).nome||x}`},
  {id:'medalhas',atr:['consist','mira'],meta:()=>3,txt:n=>`Ganhe ${n} medalhas de prata ou ouro nos treinos jogados`},
  {id:'agente',atr:['util','visao'],meta:null,txt:(n,x)=>`Leve ${x} a ${n} de familiaridade`},
  {id:'ranked',semClube:true,atr:['mira','reflexo'],meta:()=>4,txt:n=>`Jogue ${n} ranked`}
];
function desafioJDef(id){return DESAFIOS_J.find(d=>d.id===id);}
function desafiosAtivos(){return (G.voce&&G.voce.desafios)||[];}
function textoDesafio(dz){const d=desafioJDef(dz.id);return d?d.txt(dz.meta,dz.alvo):dz.id;}
function _sorteDz(salt){return typeof _sorteRel==='function'?_sorteRel('dz|'+salt):0.5;}
function _novoDesafio(p,n){
  const t=clubeDoJogador(), ativos=new Set(desafiosAtivos().map(d=>d.id));
  const ult=new Set((G.voce.dzUlt||[]).slice(0,3));
  const cand=DESAFIOS_J.filter(d=>!ativos.has(d.id)&&(!d.clube||t)&&(!d.semClube||!t));
  const pref=cand.filter(d=>!ult.has(d.id));
  const pool=pref.length?pref:cand;
  if(!pool.length)return null;
  const d=pool[Math.floor(_sorteDz('q'+n)*pool.length)%pool.length];
  const dz={id:d.id,prog:0,ini:_semAbsJ(),n};
  if(d.id==='ouro'){const l=['range','duelo','dm','retake'];dz.alvo=l[Math.floor(_sorteDz('o'+n)*l.length)%l.length];dz.meta=1;}
  else if(d.id==='agente'){
    const ags=(p.agentes||[]).map(a=>({a,n:typeof nivelAgente==='function'?nivelAgente(p,a):0})).filter(x=>x.n<88).sort((a,b)=>a.n-b.n);
    if(!ags.length)return null;
    const x=ags[0];dz.alvo=x.a;dz.meta=Math.min(95,Math.ceil((x.n+10)/5)*5);
  }else dz.meta=d.meta(p);
  return dz;
}
function garantirDesafios(p){
  if(!G.voce||!p)return;
  if(!G.voce.desafios)G.voce.desafios=[];
  /* vencidos saem sem castigo */
  G.voce.desafios=G.voce.desafios.filter(dz=>_semAbsJ()-dz.ini<DESAFIO_SEMANAS&&!dz.feito);
  /* um novo por semana (três de saída): cumprir tudo de uma vez não enche a lista */
  const novo=G.voce.dzSem!==_semAbsJ();
  let guarda=0, vagas=!G.voce.dzSeq?DESAFIOS_ATIVOS:(novo?1:0);
  while(G.voce.desafios.length<DESAFIOS_ATIVOS&&vagas>0&&guarda++<6){
    vagas--;G.voce.dzSem=_semAbsJ();
    G.voce.dzSeq=(G.voce.dzSeq||0)+1;
    const dz=_novoDesafio(p,G.voce.dzSeq);
    if(dz)G.voce.desafios.push(dz);
  }
}
function _recompensaDesafio(p,dz){
  const d=desafioJDef(dz.id);
  let atr=d.atr;
  if(!atr){const a=ativJogador(dz.alvo);atr=a&&a.xp?Object.keys(a.xp).slice(0,2):['mira','consist'];}
  const elite=over(p)>=85?1.2:1;
  const sub=_xpPontos(p,atr,0.55*elite);
  if(typeof ganharSeguidores==='function')ganharSeguidores(0.003,250,null);
  return {atr,sub};
}
function _avancarDesafio(p,id,quanto,valor){
  if(!G.voce||!G.voce.desafios)return;
  for(const dz of G.voce.desafios){
    if(dz.feito||dz.id!==id)continue;
    const d=desafioJDef(id);
    if(d.binario){if(valor>=dz.meta)dz.prog=dz.meta;else continue;}
    else if(id==='agente')dz.prog=Math.round(valor);
    else dz.prog=Math.min(dz.meta,dz.prog+quanto);
    if(dz.prog>=dz.meta){
      dz.feito=true;
      const r=_recompensaDesafio(p,dz);
      const nomes=Object.fromEntries(ATTRS);
      _momento(p,'desafio',textoDesafio(dz),Object.keys(r.sub).length?Object.entries(r.sub).map(([k,v])=>`${nomes[k]||k} +${v}`).join(' · '):'XP em '+r.atr.map(k=>nomes[k]||k).join(' e '));
      G.voce.dzFeitos=(G.voce.dzFeitos||0)+1;
      (G.voce.dzUlt||(G.voce.dzUlt=[])).unshift(id);G.voce.dzUlt.length=Math.min(G.voce.dzUlt.length,5);
    }
  }
}

/* ---------- marcos de over ---------- */
const MARCOS=[70,75,80,85,90,95];
function _checarMarcos(p){
  if(!G.voce||!p)return;
  const o=over(p);
  if(!G.voce.marcos){G.voce.marcos={};for(const m of MARCOS)if(o>=m)G.voce.marcos[m]={ini:true};return;}
  for(const m of MARCOS){
    if(o<m||G.voce.marcos[m])continue;
    G.voce.marcos[m]={ano:G.ano,semana:G.semana};
    if(typeof ganharSeguidores==='function')ganharSeguidores(m>=85?0.02:0.008,m>=85?3000:600,null);
    _momento(p,'marco',`Over ${m}`,m>=90?'elite mundial':m>=85?'nível de estrela':m>=80?'titular de Tier 1':'um degrau acima');
    G.voce.marcoNovo=m;
    if(m>=80&&typeof noticia==='function')noticia(`${p.nome} chega a over ${m}${m>=90?': entre os melhores do mundo':m>=85?' e entra no radar dos gigantes':''}.`,{c:'carreira',p:[p.id]});
  }
}
function proximoMarco(p){const o=over(p);return MARCOS.find(m=>m>o)||null;}
/* over com a fração das barras de XP: anda a cada treino */
function overExatoJ(p){
  const w=ROLE_W[p.role]||ROLE_W.Flex;let t=0;
  for(const k in w){const v=p.at[k]||0,x=(p.xp&&p.xp[k])||0;t+=(v+Math.min(0.99,x/custoPonto(v,p)))*w[k];}
  return t;
}

/* ---------- depois de cada atividade ---------- */
function aposAtividade(a,f,p){
  if(!G.voce)return;
  if(f.med){
    const M=G.voce.medalhas||(G.voce.medalhas={});
    const m=M[a.id]||(M[a.id]={ouro:0,prata:0,bronze:0,rec:null});
    m[f.med]++;
    if(f.nota!=null&&(m.rec==null||f.nota>m.rec)){f.recorde=m.rec!=null;m.rec=f.nota;}
    if(f.med==='ouro')_avancarDesafio(p,'ouro',a.id===((desafiosAtivos().find(d=>d.id==='ouro')||{}).alvo)?1:0);
    if(f.med==='ouro'||f.med==='prata')_avancarDesafio(p,'medalhas',1);
  }
  if(a.id==='ranked')_avancarDesafio(p,'ranked',1);
  if(a.id==='agente'&&f.alvo){
    const dz=desafiosAtivos().find(d=>d.id==='agente'&&d.alvo===f.alvo);
    if(dz)_avancarDesafio(p,'agente',0,nivelAgente(p,f.alvo));
    _checarMaestria(p);
  }
  _checarMarcos(p);
}

/* ---------- o fechamento da semana ----------
   w: o que você fez nas partidas da semana {k,d,cl,fk,mvp,maps,acs} */
function evolucaoSemana(p,t,rel,w){
  if(!G.voce||!p)return;
  garantirDesafios(p);
  const vit=t?_vitoriasDaSemana(t.id):0;
  /* desafios de partida */
  if(w.maps){
    _avancarDesafio(p,'abates',w.k);_avancarDesafio(p,'mvp',w.mvp);_avancarDesafio(p,'clutch',w.cl);
    _avancarDesafio(p,'entrada',w.fk);
    if(w.maps>=2)_avancarDesafio(p,'acs',0,w.acs);
  }
  if(vit)_avancarDesafio(p,'vitorias',vit);
  for(const dz of desafiosAtivos())if(dz.id==='agente'&&!dz.feito)_avancarDesafio(p,'agente',0,nivelAgente(p,dz.alvo));
  /* momentos */
  const nomes=Object.fromEntries(ATTRS);
  const subTxt=sub=>Object.entries(sub).map(([k,v])=>`${nomes[k]||k} +${v}`).join(' · ');
  if(w.mvp>0){
    const sub=_xpPontos(p,['mira','consist'],0.2*Math.min(2,w.mvp));
    _momento(p,'mvp',w.mvp>1?`MVP de ${w.mvp} séries`:'MVP da série',subTxt(sub)||'XP de mira e consistência');
  }
  const tit=(p.carreira&&p.carreira.titulos)||0;
  if(G.voce.titAntes==null)G.voce.titAntes=tit;
  if(tit>G.voce.titAntes){
    const wr=ROLE_W[p.role]||ROLE_W.Flex;
    const top=Object.keys(wr).sort((a,b)=>wr[b]-wr[a]).slice(0,3);
    const sub=_xpPontos(p,top,0.5);
    if(typeof ganharSeguidores==='function')ganharSeguidores(0.015,2000,null);
    _momento(p,'titulo','Campeão',subTxt(sub)||'XP nos atributos da função');
  }
  G.voce.titAntes=tit;
  const metaAcs=desafioJDef('acs').meta(p);
  if(w.maps>=2&&w.acs>=metaAcs+25){
    const sub=_xpPontos(p,['mira','reflexo'],0.25);
    _momento(p,'semana',`Semana monstruosa: ACS ${Math.round(w.acs)}`,subTxt(sub)||'XP de mira e reflexo');
  }
  _checarMaestria(p);
  _checarMarcos(p);
  garantirDesafios(p);
  /* a curva do over, semana a semana */
  const h=G.voce.overHist||(G.voce.overHist=[]);
  h.push({a:G.ano,s:G.semana,o:Math.round(overExatoJ(p)*10)/10});
  if(h.length>40)h.splice(0,h.length-40);
}
function _vitoriasDaSemana(id){
  let n=0;
  for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[])
    if(r.sem===G.semana&&(r.ano==null||r.ano===G.ano)&&r.v===id)n++;
  return n;
}
