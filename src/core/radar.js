/* ============================================================
   RADAR DAS RANKEDS — como um garoto chega à sua base
   ------------------------------------------------------------
   A base deixou de revelar garoto por sorteio na virada. Agora o seu
   olheiro varre a ladder ranqueada da região toda semana e o radar
   mostra as contas que ele está acompanhando: rank ("Radiante #142"),
   agente principal, idade aproximada e semanas de observação.

   Cada conta começa com o relatório borrado (como o scouting de
   adversário) e fica mais nítida a cada semana: olheiro melhor
   enxerga mais rápido e erra menos o potencial. Quando a leitura
   estiver boa, você convida para uma semana de teste — o teste mostra
   tudo — e decide: entra na base ou é dispensado.

   Os rivais também olham a ladder: uma conta boa que fica muito tempo
   no radar pode ser levada por outro clube. E conta que ninguém chama
   some depois de algumas semanas.

   Só o seu clube tem radar (os clubes da IA seguem com a base
   resumida de offseason.js). Tudo aqui sorteia num gerador local
   (comSorteioLocal): o motor do circuito não anda por causa do radar.
   ============================================================ */
const RADAR_MAX=6;            /* contas acompanhadas ao mesmo tempo */
const RADAR_VIDA=10;          /* semanas até a conta sumir se ninguém chamar */
const RADAR_HIST=8;

function nivelOlheiroDe(t){
  return (t&&t.staff&&t.staff.olheiro)||((typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2);
}
function radarRanked(){return G.radar||(G.radar={contas:[],seq:0,hist:[]});}
function contasAtivas(){return radarRanked().contas.filter(c=>c.estado==='radar'||c.estado==='teste'||c.estado==='decisao');}

/* Rank na ladder, pelo que o garoto realmente é. Os melhores aparecem com a
   posição no Radiante; os outros, no Imortal. */
function rankDaConta(ov,pot,ruido){
  const score=ov*0.4+pot*0.6;
  if(score>=66){
    const pos=clamp(Math.round(700-(score-66)*28+ruido*90),1,1500);
    return{txt:'Radiante #'+pos,ord:pos};
  }
  const div=score>=62?3:score>=58?2:1;
  return{txt:'Imortal '+div,ord:2000+(4-div)*100};
}

function novaConta(t){
  const R=radarRanked();
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:2;
  const olh=nivelOlheiroDe(t),acad=(t.estrutura&&t.estrutura.academia)||1;
  const Rg=REGIONS.find(r=>r.id===t.regiao)||REGIONS[0];
  const paisClube=typeof paisDoClube==='function'?paisDoClube(t):null;
  const pais=paisClube&&rnd()<0.7?paisClube:pick(Rg.paises);
  const role=t.baseFoco&&rnd()<0.7?t.baseFoco:pick(ROLES.filter(r=>r!=='Flex'));
  const ov=clamp(Math.round(gauss(50+acad*1.5+(olh-neutro)*2,5)),42,68);
  /* a maioria é boa de ranked e só; de vez em quando aparece uma joia */
  const joia=rnd()<0.1;
  const pot=clamp(Math.round(ov+ri(10,24)+(joia?ri(6,12):0)+(olh-neutro)),ov+8,96);
  const usados=typeof usadosNomes==='function'?usadosNomes():new Set();
  for(const c of R.contas)usados.add(c.nome);
  const nome=nomeUnico(usados,pais);
  const rk=rankDaConta(ov,pot,gauss(0,1));
  const ag=((typeof AGENTS!=='undefined'&&AGENTS[role])||['—']);
  const c={id:'r'+(++R.seq),nome,pais,role,agente:pick(ag),idade:ri(IDADE_NOVO_MIN,IDADE_NOVO_MAX),
    ov,pot,rank:rk.txt,rankOrd:rk.ord,partidas:ri(40,160),obs:0,desde:{ano:G.ano,s:G.semana},estado:'radar'};
  R.contas.push(c);
  return c;
}

/* Quão nítida está a leitura: 0 a 1. */
function precisaoDaConta(c,t){
  if(c.estado==='teste'||c.estado==='decisao')return 1;
  return clamp(c.obs*(0.04+0.025*nivelOlheiroDe(t)),0,0.92);
}
/* O que o relatório mostra: faixa de over e de potencial. O centro da faixa
   erra (olheiro fraco erra mais o potencial), a largura fecha com o tempo. */
function leituraDaConta(c,t){
  const p=precisaoDaConta(c,t);
  if(p>=1)return{p:1,ov:[c.ov,c.ov],pot:[c.pot,c.pot]};
  const olh=nivelOlheiroDe(t);
  const ampO=1+(1-p)*9,ampP=2+(1-p)*14;
  const errP=borrar(c.id+'|pot|'+Math.floor(c.obs/2),(1-p)*8*(1.4-olh*0.18));
  const errO=borrar(c.id+'|ov|'+Math.floor(c.obs/2),(1-p)*5);
  const cO=c.ov+errO,cP=c.pot+errP;
  return{p,ov:[Math.round(cO-ampO),Math.round(cO+ampO)],pot:[Math.round(cP-ampP),Math.min(99,Math.round(cP+ampP))]};
}

function _histRadar(c,txt){
  const R=radarRanked();
  R.hist.unshift({ano:G.ano,s:G.semana,nome:c.nome,pais:c.pais,role:c.role,txt});
  R.hist=R.hist.slice(0,RADAR_HIST);
}

/* Toda semana, depois das partidas. */
function radarSemanal(){
  const t=G.meuTime&&G.times[G.meuTime];
  if(!t)return;
  const R=radarRanked();
  comSorteioLocal('radar|'+G.ano+'|'+G.semana+'|'+R.seq,()=>{
    for(const c of R.contas){
      if(c.estado==='teste'){
        if(G.ano>c.testeAte.ano||G.semana>=c.testeAte.s){c.estado='decisao';
          noticia('🧪 Acabou a semana de teste de '+c.nome+': decida na Base se ele entra na categoria.',{c:'clube',t:[t.id],imp:2});}
        continue;
      }
      if(c.estado!=='radar')continue;
      c.obs++;
      const idade=(G.ano-c.desde.ano)*SEMANAS_ANO+(G.semana-c.desde.s);
      /* rival leva: quanto melhor a conta e mais tempo exposta, maior a chance */
      const chanceRival=c.obs>=2?0.02+Math.max(0,c.pot-78)*0.006:0;
      if(rnd()<chanceRival){
        const rivais=Object.values(G.times).filter(x=>x.regiao===t.regiao&&x.id!==t.id);
        const r=rivais.length?pick(rivais):null;
        c.estado='rival';c.rival=r?r.tag:null;
        _histRadar(c,'foi para a base do '+(r?r.nome:'um rival'));
        noticia('👀 '+c.nome+' ('+c.rank+'), que estava no seu radar, foi chamado para a base do '+(r?r.nome:'um rival')+'.',{c:'clube',t:[t.id].concat(r?[r.id]:[]),imp:1});
        continue;
      }
      if(idade>=RADAR_VIDA){c.estado='sumiu';_histRadar(c,'sumiu da ladder');}
    }
    R.contas=R.contas.filter(c=>c.estado==='radar'||c.estado==='teste'||c.estado==='decisao');
    /* conta nova: olheiro melhor encontra mais */
    const olh=nivelOlheiroDe(t);
    if(contasAtivas().length<RADAR_MAX&&rnd()<0.04+0.025*olh){
      const c=novaConta(t);
      if(c.pot>=84&&precisaoDaConta(c,t)<0.5)
        noticia('📡 O olheiro marcou uma conta nova no radar: '+c.nome+', '+c.rank+'.',{c:'clube',t:[t.id]});
    }
  });
}

/* ---------- ações ---------- */
function convidarParaTeste(id){
  const t=G.meuTime&&G.times[G.meuTime];const c=radarRanked().contas.find(x=>x.id===id);
  if(!t||!c||c.estado!=='radar')return{ok:false,erro:'Essa conta não está mais no radar.'};
  if(radarRanked().contas.some(x=>x.estado==='teste'||x.estado==='decisao'))
    return{ok:false,erro:'Já tem um garoto em teste. Decida sobre ele antes de chamar outro.'};
  if(baseDe(t).length>=vagasDaBase(t))
    return{ok:false,erro:'A categoria está cheia ('+vagasDaBase(t)+' vagas). Promova ou dispense alguém antes.'};
  c.estado='teste';c.testeAte={ano:G.ano,s:G.semana+1};
  return{ok:true,msg:c.nome+' vem treinar com a base nesta semana. No fim dela você decide.'};
}
function aceitarDoTeste(id){
  const t=G.meuTime&&G.times[G.meuTime];const R=radarRanked();const c=R.contas.find(x=>x.id===id);
  if(!t||!c||c.estado!=='decisao')return{ok:false,erro:'Esse teste não está esperando decisão.'};
  if(baseDe(t).length>=vagasDaBase(t))return{ok:false,erro:'A categoria está cheia.'};
  const usados=usadosNomes();
  const p=makePlayer(c.ov,c.role,c.pais,c.idade,usados,t.tier);
  aplicarOver(p,c.ov);
  p.nome=c.nome;p.pot=Math.max(c.pot,over(p)+6);
  p.timeId=null;p.contrato=0;p.salario=0;
  p.base=t.id;p.daCasa=t.id;p.baseDesde=G.ano;p.doRadar={rank:c.rank,agente:c.agente};
  G.jogadores[p.id]=p;(t.base=t.base||[]).push(p.id);
  R.contas=R.contas.filter(x=>x.id!==id);
  _histRadar(c,'entrou na sua base');
  noticia('🌱 '+p.nome+' ('+c.rank+', '+p.role+') passou no teste e entrou na base.',{c:'clube',p:[p.id],t:[t.id],imp:2});
  return{ok:true,msg:p.nome+' está na categoria de base.'};
}
function dispensarDoTeste(id){
  const R=radarRanked();const c=R.contas.find(x=>x.id===id);
  if(!c)return{ok:false,erro:'Conta não encontrada.'};
  R.contas=R.contas.filter(x=>x.id!==id);
  _histRadar(c,c.estado==='radar'?'tirado do radar':'dispensado depois do teste');
  return{ok:true,msg:c.nome+(c.estado==='radar'?' saiu do radar.':' foi dispensado.')};
}
