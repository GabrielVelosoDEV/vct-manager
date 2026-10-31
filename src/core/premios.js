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
    for(const id in s.stats){
      const e=s.stats[id],p=G.jogadores[id];if(!e.maps||!p)continue;
      const f=fn[funcaoPremio(p)];
      /* parte função, parte geral: só contra a função, um Controlador de
         170 de ACS virava MVP do ano, e ninguém olha para isso e concorda */
      const T=fn.todos;
      const q=PREMIO_PESO_FUNCAO;
      const acsFn=q*f.acs/Math.max(1,f.maps)+(1-q)*T.acs/Math.max(1,T.maps);
      const kdFn=q*f.k/Math.max(1,f.d)+(1-q)*T.k/Math.max(1,T.d);
      const a=jog[id]||(jog[id]={maps:0,k:0,d:0,acs:0,mvp:0,rel:0,krel:0,wd:0,wm:0,camp:0,timeId:null});
      a.maps+=e.maps;a.k+=e.k;a.d+=e.d;a.acs+=e.acs;a.mvp+=e.mvp;
      a.rel+=w*e.acs/Math.max(1,acsFn);a.krel+=w*e.k/Math.max(0.1,kdFn);a.wd+=w*e.d;
      a.wm+=w*e.maps;a.camp+=w*e.maps*pos(e.timeId);
      a.timeId=e.timeId||a.timeId;
    }
  }
  return{jog,times};
}

/* Nota do ano de um jogador. Mesmo desenho da nota de MVP de torneio
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
function fichaPremio(id,a){
  const p=G.jogadores[id];if(!p)return null;
  const t=a&&a.timeId&&G.times[a.timeId];
  return{id,nome:p.nome,pais:p.pais,role:p.role,idade:p.idade,
    timeId:t?t.id:null,tag:t?t.tag:'—',
    maps:a?a.maps:0,acs:a?Math.round(a.acs/Math.max(1,a.maps)):0,
    kd:a?Number((a.d?a.k/a.d:a.k).toFixed(2)):0};
}

function darPremio(id,tipo,rot){
  const p=G.jogadores[id];if(!p)return;
  (p.premios=p.premios||[]).push({ano:G.ano,tipo,rot});
}

const ROT_PREMIO={mvp:'MVP do ano',regional:'MVP regional',selecao:'Seleção do ano',
                  revelacao:'Revelação do ano',igl:'IGL do ano'};

/* Elege tudo de uma vez e grava em G.premios. Chamada no começo da virada,
   antes de aposentadoria, contrato e empréstimo mexerem nos elencos. */
function premiarTemporada(){
  const {jog,times}=lerTemporada();
  const cand=Object.keys(jog).filter(id=>G.jogadores[id]&&jog[id].maps>=PREMIO_MIN_MAPAS);
  if(!cand.length)return null;
  const nota={};
  for(const id in jog)if(jog[id].maps)nota[id]=notaDoAno(jog[id]);
  const porNota=(a,b)=>nota[b]-nota[a];
  cand.sort(porNota);

  const reg={ano:G.ano,mvp:null,regioes:{},selecao:[],revelacao:null,igl:null,treinador:null};
  const mvp=cand[0];
  reg.mvp=fichaPremio(mvp,jog[mvp]);darPremio(mvp,'mvp',ROT_PREMIO.mvp);

  for(const R of REGIONS){
    const id=cand.find(i=>{const t=G.times[jog[i].timeId];return t&&t.regiao===R.id&&t.tier===1;});
    if(!id)continue;
    reg.regioes[R.id]=fichaPremio(id,jog[id]);
    darPremio(id,'regional',ROT_PREMIO.regional+' · '+R.nome);
  }

  /* um por função e o quinto é o melhor que sobrou, como as seleções de
     verdade fazem com o flex */
  const usados=new Set();
  for(const role of ROLES.filter(r=>r!=='Flex')){
    const id=cand.find(i=>!usados.has(i)&&G.jogadores[i].role===role);
    if(id)usados.add(id);
  }
  const flex=cand.find(i=>!usados.has(i));
  if(flex)usados.add(flex);
  reg.selecao=[...usados].sort(porNota).map(id=>fichaPremio(id,jog[id]));
  usados.forEach(id=>darPremio(id,'selecao',ROT_PREMIO.selecao));

  const rev=Object.keys(jog).filter(id=>{const p=G.jogadores[id];
    return p&&p.idade<=IDADE_REVELACAO&&jog[id].maps>=PREMIO_MIN_MAPAS_REVELACAO;}).sort(porNota)[0];
  if(rev){reg.revelacao=fichaPremio(rev,jog[rev]);darPremio(rev,'revelacao',ROT_PREMIO.revelacao);}

  /* IGL e treinador são prêmio de campanha: o desempenho individual pesa
     pouco no IGL e nada no treinador */
  const campanha=id=>{const r=times[id];return r?r.camp+r.titulos*0.6:0;};
  const t1=Object.values(G.times).filter(t=>t.tier===1);
  const igl=t1.filter(t=>t.igl&&G.jogadores[t.igl]&&jog[t.igl])
    .map(t=>({id:t.igl,n:campanha(t.id)+0.4*(nota[t.igl]||0)})).sort((a,b)=>b.n-a.n)[0];
  if(igl){reg.igl=fichaPremio(igl.id,jog[igl.id]);darPremio(igl.id,'igl',ROT_PREMIO.igl);}

  /* treinador: campanha, com um empurrão para quem fez mais com menos */
  const tr=t1.map(t=>({t,n:campanha(t.id)+(60-t.prestigio)*0.03})).sort((a,b)=>b.n-a.n)[0];
  if(tr){
    const t=tr.t,m=membroDe(t,'tecnico');
    const voce=t.id===G.meuTime&&G.manager&&G.manager.papel==='treinador'&&!G.manager.demitido;
    const nome=voce?G.manager.nome:m?m.nome:null;
    if(nome){
      reg.treinador={nome,timeId:t.id,tag:t.tag,staffId:voce?null:m.id,voce};
      if(m&&!voce)(m.premios=m.premios||[]).push({ano:G.ano,tipo:'treinador',rot:'Treinador do ano'});
    }
  }

  (G.premios=G.premios||[]).push(reg);
  /* reconhecimento vale vestiário */
  const premiados=new Set([mvp,...usados,rev,igl&&igl.id].filter(Boolean));
  premiados.forEach(id=>{const p=G.jogadores[id];if(p)p.moral=clamp(p.moral+0.05,0.05,1);});

  noticia('🏅 '+reg.mvp.nome+' ('+reg.mvp.tag+') é o MVP de '+G.ano+'.',{c:'carreira',p:[reg.mvp.id],t:[reg.mvp.timeId],imp:3});
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
