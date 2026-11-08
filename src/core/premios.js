/* ============================================================
   PRÊMIOS DA TEMPORADA E HALL DA FAMA
   ------------------------------------------------------------
   Até aqui o jogo esquecia tudo na virada do ano: o melhor de
   cada torneio era eleito, mas ninguém era o melhor DO ANO, e o
   jogador que se aposentava sumia do save junto com a história
   dele.

   A temporada é lida dos stages do calendário, que ainda estão
   todos lá quando fimDeTemporada() começa. Cada stage pesa pelo
   tamanho do palco: um Champions vale mais que um split de
   Challengers, e é por isso que o MVP do ano sai do Tier 1 mesmo
   quando um garoto do Challengers faz 300 de ACS.

   Nada aqui sorteia: os prêmios são uma leitura do que já
   aconteceu, e o gerador semeado é do motor.
   ============================================================ */

/* Mínimo de mapas para concorrer: quem jogou um torneio e brilhou não é o
   melhor do ano. */
const PREMIO_MIN_MAPAS=14;
const PREMIO_MIN_MAPAS_REVELACAO=10;
const IDADE_REVELACAO=20;
/* Corte do Hall da Fama, em pontos de carreira (ver pontosDeLenda). */
const LENDA_CORTE=14;
/* Quanto a comparação é contra a própria função (o resto é contra todos). */
const PREMIO_PESO_FUNCAO=0.7;

/* ---------- a régua: desempenho e conquistas ----------
   A nota de cada prêmio tem duas metades explícitas, cada uma medida em
   desvios em relação aos candidatos do ano (assim as duas falam a mesma
   língua): DESEMPENHO, o que o jogador fez (rendimento contra a função,
   K/D, MVPs de mapa, volume em palco grande), e CONQUISTAS, o que o time
   dele ganhou com ele em campo (títulos, finais e campanha internacional,
   Champions acima de Masters, Masters acima de liga).
   A fatia de conquistas muda por prêmio: o MVP do ano é de quem ganhou;
   a seleção e o MVP regional pesam menos o troféu; a revelação é só sobre
   o jogador. Medido com tools/premios.mjs em 20 temporadas. */
const PREMIO_CONQUISTAS={mvp:0.4,selecao:0.3,regional:0.25,revelacao:0};
/* Fora da curva: quem não chegou a nenhuma final internacional só leva o
   MVP do ano se o desempenho dele passar o do segundo melhor por esta
   margem, em desvios dos candidatos. */
const PREMIO_FORA_MARGEM=0.55;
/* Pontos por colocação no mata-mata: campeão, vice, top 4, top 8. */
const CONQ_LUGAR={champions:[10,6,3.5,1.8],masters:[6,3.6,2,1],liga:[2.4,1.3,0.6,0],acesso:[0.6,0.3,0,0]};
/* Estar no internacional já é campanha, mesmo caindo na fase de grupos. */
const CONQ_GRUPO={champions:0.6,masters:0.4};

function classeConquista(s){
  if(s.regiao==='INT')return s.torneioId==='champions'||/^ch/.test(s.id)?'champions':'masters';
  return s.tier===2?'acesso':'liga';
}
function pontosDeLugar(cl,i){
  const f=i===0?0:i===1?1:i>=2&&i<=3?2:i>=4&&i<=7?3:-1;
  return f<0?0:CONQ_LUGAR[cl][f];
}

function pesoDoStagePremio(s){
  if(s.tier===2)return 0.4;
  if(s.regiao==='INT')return /^ch/.test(s.id)?1.8:1.4;
  return 1;
}

/* Função contra a qual o jogador é comparado: a que ele joga. Flex não
   tem grupo próprio grande o bastante e é comparado com todo mundo. */
function funcaoPremio(p){
  const r=p.roleAtual&&p.roleAtual!=='Flex'?p.roleAtual:p.role;
  return r==='Flex'?'todos':r;
}
/* Soma da temporada de cada jogador e de cada time, stage a stage. */
function lerTemporada(){
  const jog={},times={};
  const stages=(G.calendario||[]).flatMap(b=>b.stages||[]).filter(s=>s&&s.feito);
  for(const s of stages){
    const w=pesoDoStagePremio(s);
    const rk=s.ranking||[];
    const n=Math.max(1,rk.length-1);
    rk.forEach((id,i)=>{
      const r=times[id]||(times[id]={camp:0,peso:0,titulos:0});
      r.camp+=w*(1-i/n);r.peso+=w;
      if(i===0&&s.tipo!=='grupos'&&s.tipo!=='swiss')r.titulos+=w;
    });
    if(!s.stats)continue;
    /* ACS e K/D comparados com a média da função no próprio stage. Contra a
       média geral pura, Duelista ganhava todo prêmio: ele faz mais abate por
       desenho, não por jogar melhor. */
    const fn={todos:{acs:0,maps:0,k:0,d:0}};
    for(const id in s.stats){
      const e=s.stats[id],p=G.jogadores[id];if(!e.maps||!p)continue;
      for(const k of [funcaoPremio(p),'todos']){
        const f=fn[k]||(fn[k]={acs:0,maps:0,k:0,d:0});
        f.acs+=e.acs;f.maps+=e.maps;f.k+=e.k;f.d+=e.d;
      }
    }
    const pos=id=>{const i=rk.indexOf(id);return i<0?0.35:1-i/n;};
    /* conquistas: cada um leva a parte do time na proporção dos mapas que
       jogou — o reserva que entrou num mapa não é campeão do mesmo jeito */
    const cl=classeConquista(s),mata=s.tipo==='de'||s.tipo==='ko';
    const maxTime={};
    for(const id in s.stats){const e=s.stats[id];if(e.maps&&e.timeId)maxTime[e.timeId]=Math.max(maxTime[e.timeId]||0,e.maps);}
    for(const id in s.stats){
      const e=s.stats[id],p=G.jogadores[id];if(!e.maps||!p)continue;
      const f=fn[funcaoPremio(p)];
      /* parte função, parte geral: só contra a função, um Controlador de
         170 de ACS virava MVP do ano, e ninguém olha para isso e concorda */
      const T=fn.todos;
      const q=PREMIO_PESO_FUNCAO;
      const acsFn=q*f.acs/Math.max(1,f.maps)+(1-q)*T.acs/Math.max(1,T.maps);
      const kdFn=q*f.k/Math.max(1,f.d)+(1-q)*T.k/Math.max(1,T.d);
      const a=jog[id]||(jog[id]={maps:0,k:0,d:0,acs:0,mvp:0,rel:0,krel:0,wd:0,wm:0,camp:0,timeId:null,
        conq:0,finalInt:false,lista:[]});
      a.maps+=e.maps;a.k+=e.k;a.d+=e.d;a.acs+=e.acs;a.mvp+=e.mvp;
      a.rel+=w*e.acs/Math.max(1,acsFn);a.krel+=w*e.k/Math.max(0.1,kdFn);a.wd+=w*e.d;
      a.wm+=w*e.maps;a.camp+=w*e.maps*pos(e.timeId);
      a.timeId=e.timeId||a.timeId;
      const fr=Math.min(1,e.maps/Math.max(1,maxTime[e.timeId]||e.maps));
      if(mata){
        const i=rk.indexOf(e.timeId),pts=i<0?0:pontosDeLugar(cl,i)*fr;
        if(pts>0){a.conq+=pts;
          if(pts>=1)a.lista.push({ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,i,cl,pts:Math.round(pts*10)/10});}
        if(s.regiao==='INT'&&i>=0&&i<=1&&fr>=0.5)a.finalInt=true;
      }else if(CONQ_GRUPO[cl])a.conq+=CONQ_GRUPO[cl]*fr;
    }
  }
  return{jog,times};
}

/* Metade DESEMPENHO: a nota do ano sem a campanha. */
function desempenhoDoAno(a){
  const rel=a.rel/Math.max(1,a.wm);
  const kd=a.krel/Math.max(1,a.wd);
  return (rel-1)*1.9+(Math.min(2.2,kd)-1)*0.55+(a.mvp/a.maps)*0.95+0.35*Math.min(1,a.wm/60);
}
/* Nota do ano antiga (desempenho + um pouco de campanha). Ficou para o IGL
   do ano, que já soma a campanha do time por fora, e para a medição de
   antes e depois em tools/premios.mjs. Mesmo desenho da nota de MVP de torneio
   (notaMVP em formatos.js), com ACS e K/D relativos à função, mais um termo de palco: quem jogou muito mapa
   em torneio grande ganha até 0,35. */
function notaDoAno(a){
  const rel=a.rel/Math.max(1,a.wm);
  const kd=a.krel/Math.max(1,a.wd);
  return (rel-1)*1.9+(Math.min(2.2,kd)-1)*0.55+(a.mvp/a.maps)*0.95
        +0.35*Math.min(1,a.wm/60)+0.25*(a.camp/Math.max(1,a.wm));
}

/* Foto do premiado, como a do MVP de torneio: ele pode se aposentar e
   ser apagado, o prêmio não. */
function fichaPremio(id,a,r){
  const p=G.jogadores[id];if(!p)return null;
  const t=a&&a.timeId&&G.times[a.timeId];
  const f={id,nome:p.nome,pais:p.pais,role:p.role,idade:p.idade,
    timeId:t?t.id:null,tag:t?t.tag:'—',
    maps:a?a.maps:0,acs:a?Math.round(a.acs/Math.max(1,a.maps)):0,
    kd:a?Number((a.d?a.k/a.d:a.k).toFixed(2)):0,
    ov:over(p),mvps:a?a.mvp:0};
  /* a régua de quem levou: nota final, as duas metades em percentil entre os
     candidatos e o que o time conquistou com ele (é isso que a tela mostra) */
  if(r){f.n=Math.round(r.n*100)/100;f.pD=r.pD;f.pC=r.pC;
    if(r.conq)f.conq=r.conq;}
  return f;
}

function darPremio(id,tipo,rot){
  const p=G.jogadores[id];if(!p)return;
  (p.premios=p.premios||[]).push({ano:G.ano,tipo,rot});
}

const ROT_PREMIO={mvp:'MVP do ano',regional:'MVP regional',selecao:'Seleção do ano',
                  revelacao:'Revelação do ano',igl:'IGL do ano'};

/* Elege tudo de uma vez e grava em G.premios. Chamada no começo da virada,
   antes de aposentadoria, contrato e empréstimo mexerem nos elencos. */
/* Régua dos candidatos do ano: desempenho e conquistas em desvios, medidos
   contra quem tem mapas para concorrer, e aplicados a todo mundo (a
   revelação concorre com menos mapas). */
function reguaDoAno(jog,cand){
  const D={},C={};
  for(const id in jog)if(jog[id].maps){D[id]=desempenhoDoAno(jog[id]);C[id]=jog[id].conq||0;}
  const norm=v=>{const xs=cand.map(id=>v[id]);const m=xs.reduce((s,x)=>s+x,0)/xs.length;
    const sd=Math.sqrt(xs.reduce((s,x)=>s+(x-m)*(x-m),0)/xs.length)||1;
    const z={};for(const id in v)z[id]=(v[id]-m)/sd;return z;};
  const zD=norm(D),zC=norm(C);
  const pct=v=>{const xs=cand.map(id=>v[id]).sort((a,b)=>a-b);
    return id=>{let k=0;while(k<xs.length&&xs[k]<v[id])k++;return Math.round(k/xs.length*100);};};
  const pD=pct(D),pC=pct(C);
  return{zD,zC,
    nota:(id,tipo)=>{const w=PREMIO_CONQUISTAS[tipo]||0;return (1-w)*zD[id]+w*zC[id];},
    ficha:(id,tipo,comConq)=>({n:(1-(PREMIO_CONQUISTAS[tipo]||0))*zD[id]+(PREMIO_CONQUISTAS[tipo]||0)*zC[id],
      pD:pD(id),pC:pC(id),conq:comConq?jog[id].lista.slice().sort((a,b)=>b.pts-a.pts).slice(0,5):null})};
}

/* Elege tudo de uma vez e grava em G.premios. Chamada no começo da virada,
   antes de aposentadoria, contrato e empréstimo mexerem nos elencos. */
function premiarTemporada(){
  const {jog,times}=lerTemporada();
  const cand=Object.keys(jog).filter(id=>G.jogadores[id]&&jog[id].maps>=PREMIO_MIN_MAPAS);
  if(!cand.length)return null;
  const nota={};
  for(const id in jog)if(jog[id].maps)nota[id]=notaDoAno(jog[id]);
  const R=reguaDoAno(jog,cand);
  const ordem=tipo=>(a,b)=>R.nota(b,tipo)-R.nota(a,tipo);
  const fichaDe=(id,tipo,comConq)=>fichaPremio(id,jog[id],R.ficha(id,tipo,comConq));
  /* pódio: os três primeiros, com a nota de cada um */
  const podio=(ids,tipo)=>ids.slice(0,3).map(id=>fichaDe(id,tipo));

  const reg={ano:G.ano,mvp:null,regioes:{},selecao:[],revelacao:null,igl:null,treinador:null,podios:{}};

  /* MVP: o melhor da régua entre quem chegou a uma final internacional; o
     fora da curva fura a fila só com um desempenho muito acima do segundo */
  const porMvp=cand.slice().sort(ordem('mvp'));
  const finalistas=porMvp.filter(id=>jog[id].finalInt);
  const porD=cand.slice().sort((a,b)=>R.zD[b]-R.zD[a]);
  const topo=porD[0],gap=porD.length>1?R.zD[topo]-R.zD[porD[1]]:0;
  const fora=!jog[topo].finalInt&&gap>=PREMIO_FORA_MARGEM;
  const mvp=fora?topo:(finalistas[0]||porMvp[0]);
  reg.mvp=fichaDe(mvp,'mvp',true);
  if(fora)reg.mvp.fora=Math.round(gap*100)/100;
  reg.podios.mvp=[reg.mvp,...podio(porMvp.filter(id=>id!==mvp),'mvp').slice(0,2)];
  darPremio(mvp,'mvp',ROT_PREMIO.mvp);

  const porReg=cand.slice().sort(ordem('regional'));
  for(const Rg of REGIONS){
    const ids=porReg.filter(i=>{const t=G.times[jog[i].timeId];return t&&t.regiao===Rg.id&&t.tier===1;});
    if(!ids.length)continue;
    reg.regioes[Rg.id]=fichaDe(ids[0],'regional',true);
    reg.podios['reg_'+Rg.id]=podio(ids,'regional');
    darPremio(ids[0],'regional',ROT_PREMIO.regional+' · '+Rg.nome);
  }

  /* um por função e o quinto é o melhor que sobrou, como as seleções de
     verdade fazem com o flex */
  const porSel=cand.slice().sort(ordem('selecao'));
  const usados=new Set();
  for(const role of ROLES.filter(r=>r!=='Flex')){
    const id=porSel.find(i=>!usados.has(i)&&G.jogadores[i].role===role);
    if(id)usados.add(id);
  }
  /* o quinto é o melhor que sobrou; se faltou alguma função entre os
     candidatos, o melhor que sobrou cobre também essa vaga */
  for(const id of porSel){if(usados.size>=5)break;usados.add(id);}
  reg.selecao=[...usados].sort(ordem('selecao')).map(id=>fichaDe(id,'selecao'));
  usados.forEach(id=>darPremio(id,'selecao',ROT_PREMIO.selecao));

  const revs=Object.keys(jog).filter(id=>{const p=G.jogadores[id];
    return p&&p.idade<=IDADE_REVELACAO&&jog[id].maps>=PREMIO_MIN_MAPAS_REVELACAO;}).sort(ordem('revelacao'));
  const rev=revs[0];
  if(rev){reg.revelacao=fichaDe(rev,'revelacao');reg.podios.revelacao=podio(revs,'revelacao');
    darPremio(rev,'revelacao',ROT_PREMIO.revelacao);}

  /* IGL e treinador são prêmio de campanha: o desempenho individual pesa
     pouco no IGL e nada no treinador */
  const campanha=id=>{const r=times[id];return r?r.camp+r.titulos*0.6:0;};
  const t1=Object.values(G.times).filter(t=>t.tier===1);
  const igl=t1.filter(t=>t.igl&&G.jogadores[t.igl]&&jog[t.igl])
    .map(t=>({id:t.igl,n:campanha(t.id)+0.4*(nota[t.igl]||0)})).sort((a,b)=>b.n-a.n)[0];
  if(igl){reg.igl=fichaPremio(igl.id,jog[igl.id]);darPremio(igl.id,'igl',ROT_PREMIO.igl);}

  /* treinador: campanha, com um empurrão para quem fez mais com menos */
  /* clube sem head coach no momento não tem quem receber: o prêmio vai para o
     próximo da fila, em vez de ficar sem treinador do ano */
  const fila=t1.map(t=>({t,n:campanha(t.id)+(60-t.prestigio)*0.03})).sort((a,b)=>b.n-a.n);
  for(const tr of fila){
    const t=tr.t,m=membroDe(t,'tecnico');
    const voce=t.id===G.meuTime&&G.manager&&G.manager.papel==='treinador'&&!G.manager.demitido;
    const nome=voce?G.manager.nome:m?m.nome:null;
    if(!nome)continue;
    reg.treinador={nome,timeId:t.id,tag:t.tag,staffId:voce?null:m.id,voce};
    if(m&&!voce)(m.premios=m.premios||[]).push({ano:G.ano,tipo:'treinador',rot:'Treinador do ano'});
    break;
  }

  (G.premios=G.premios||[]).push(reg);
  /* reconhecimento vale vestiário */
  const premiados=new Set([mvp,...usados,rev,igl&&igl.id].filter(Boolean));
  premiados.forEach(id=>{const p=G.jogadores[id];if(p)p.moral=clamp(p.moral+0.05,0.05,1);});

  noticia('🏅 '+reg.mvp.nome+' ('+reg.mvp.tag+') é o MVP de '+G.ano+(reg.mvp.fora?', numa temporada fora da curva':'')+'.',{c:'carreira',p:[reg.mvp.id],t:[reg.mvp.timeId],imp:3});
  const meus=[...premiados].filter(id=>G.jogadores[id].timeId===G.meuTime);
  if(meus.length)noticia('🏅 Prêmios de '+G.ano+' no seu clube: '+
    meus.map(id=>G.jogadores[id].nome).join(', ')+'.',{c:'carreira',p:meus,t:[G.meuTime],imp:2});
  if(reg.treinador&&reg.treinador.voce)noticia('🏅 Você foi eleito o treinador do ano de '+G.ano+'.',{c:'carreira',t:[G.meuTime],imp:3});
  return reg;
}

/* ---------- hall da fama ---------- */
/* Pontos de carreira: prêmio do ano vale mais que título regional, título
   internacional vale mais que qualquer um dos dois. */
function pontosDeLenda(p){
  const c=p.carreira||{};
  const pr=p.premios||[];
  const conta=t=>pr.filter(x=>x.tipo===t).length;
  return conta('mvp')*5+conta('selecao')*2+conta('regional')*1.5+conta('igl')*1.5+conta('revelacao')
        +(c.intl||0)*2+(c.titulos||0)*0.3+(c.mvpTorneios||0)*0.75+Math.floor((c.maps||0)/400);
}
/* Resumo de carreira, usado na ficha e no Hall da Fama. */
function resumoCarreira(p){
  const c=p.carreira||{};
  return{maps:c.maps||0,k:c.k||0,d:c.d||0,a:c.a||0,
    acs:c.maps?Math.round((c.acs||0)/c.maps):0,
    kd:Number(((c.k||0)/Math.max(1,c.d||0)).toFixed(2)),
    mvp:c.mvp||0,titulos:c.titulos||0,intl:c.intl||0,mvpTorneios:c.mvpTorneios||0,
    premios:(p.premios||[]).length};
}
/* Chamada na aposentadoria, antes de o jogador ser apagado. */
function talvezHallDaFama(p){
  const pts=pontosDeLenda(p);
  if(pts<LENDA_CORTE)return null;
  const clubes=[...new Set((p.hist||[]).map(h=>h.time).filter(n=>n&&n!=='Sem clube'))];
  const l={id:p.id,nome:p.nome,pais:p.pais,role:p.role,ano:G.ano,idade:p.idade,
    pico:p.pico||over(p),pontos:Math.round(pts*10)/10,clubes,
    carreira:resumoCarreira(p),premios:(p.premios||[]).map(x=>({ano:x.ano,rot:x.rot}))};
  (G.lendas=G.lendas||[]).push(l);
  noticia('🏛 '+p.nome+' se aposenta e entra para o Hall da Fama.',{c:'carreira',imp:2});
  return l;
}

/* ---------- peso do save ---------- */
/* As temporadas antigas da ficha guardam só o que a tabela de carreira
   mostra. O detalhe (assistências, first kills, clutches) já está somado
   em p.carreira. */
const HIST_DETALHE=5;
function podarHistorico(p){
  const h=p.hist;if(!h||h.length<=HIST_DETALHE)return;
  for(let i=0;i<h.length-HIST_DETALHE;i++){
    const e=h[i];if(e.c)continue;
    h[i]={ano:e.ano,time:e.time,over:e.over,maps:e.maps,k:e.k,d:e.d,mvp:e.mvp,c:1};
  }
}
