/* ============================================================
   VALORANT WORLD CUP — A PARTIDA DE SELEÇÃO (C1)
   ------------------------------------------------------------
   Uma seleção não mora em G.times: não joga liga, não tem caixa e
   não entra no mercado. Para jogar, ela vira um time de verdade só
   durante a série — entra em G.times com o id SEL-<país>, joga no
   mesmo motor dos clubes (veto, mapa a mapa, round a round) e sai.

   Durante a série, os convocados jogam na função que a seleção dá a
   eles (roleAtual); depois, cada um volta para a função do clube.
   Clube, elenco, contrato e mercado não são tocados.

   O que fica da série:
     · a ficha (veto, placar e linha de cada jogador por mapa, MVP);
     · as estatísticas de seleção de cada convocado (p.selecao), que
       não se misturam com as da temporada do clube;
     · forma, cansaço e moral, mais leves que numa série de clube;
     · a afinidade de mapa, como em qualquer partida;
     · os pontos do ranking de países (menos no amistoso).

   Comissão: cada seleção tem técnico e analista escolhidos entre
   todos os profissionais do mundo — com ou sem clube, porque a
   seleção só joga no fim da temporada. As federações preferem quem
   é do país; sem ninguém de nível alto em casa, vão atrás de
   estrangeiros. Escolha sem sorteio, refeita a cada ciclo.
   ============================================================ */

const SEL_PREFERE_NACIONAL=1.5;   /* em níveis de comissão (1 a 5): nacional vale um nível e meio a mais */
const SEL_SINERGIA_BASE=44;       /* seleção treina pouco junta: abaixo do clube médio (55) */
const SEL_SINERGIA_DUPLA=3;       /* por dupla de titulares que joga no mesmo clube */
const SEL_SINERGIA_MAX=68;
const SEL_K_RANKING=32;           /* Elo: o quanto uma série mexe nos pontos */

/* ---------- a comissão ---------- */
function _candidatosComissao(cargo){
  return Object.values(G.staff||{}).filter(m=>m&&m.cargo===cargo&&!m.aposentado)
    .map(m=>({m,n:typeof nivelDe==='function'?nivelDe(m):2}));
}
/* Todas de uma vez, das mais fortes para as mais fracas: a federação maior
   escolhe primeiro. Ninguém comanda duas seleções. */
function escolherComissoesSelecoes(){
  const c=garantirCopa();if(!c)return null;
  c.comissao={};c.comissaoAno=G.ano;
  const usados=new Set();
  const ordem=rankingPaises().map(x=>x.pais);
  for(const cargo of ['tecnico','analista']){
    const cand=_candidatosComissao(cargo);
    for(const pais of ordem){
      let melhor=null,nota=-1;
      for(const x of cand){
        if(usados.has(x.m.id))continue;
        const v=x.n+(x.m.pais===pais?SEL_PREFERE_NACIONAL:0);
        if(v>nota||(v===nota&&melhor&&String(x.m.id)<String(melhor.id))){nota=v;melhor=x.m;}
      }
      (c.comissao[pais]=c.comissao[pais]||{})[cargo]=melhor?melhor.id:null;
      if(melhor)usados.add(melhor.id);
    }
  }
  return c.comissao;
}
function comissaoDaSelecao(pais){
  const c=garantirCopa();if(!c)return{};
  const viva=id=>id&&G.staff&&G.staff[id]&&!G.staff[id].aposentado;
  if(!c.comissao||!c.comissao[pais]||!viva(c.comissao[pais].tecnico))escolherComissoesSelecoes();
  return c.comissao[pais]||{};
}

/* ---------- a seleção como time ---------- */
function idSelecao(pais){return 'SEL-'+pais;}
function paisDoTimeSelecao(id){return String(id||'').startsWith('SEL-')?String(id).slice(4):null;}
function sinergiaSelecao(titulares){
  const rs=titulares.map(i=>G.jogadores[i]).filter(Boolean);
  let duplas=0;
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)
    if(rs[i].timeId&&rs[i].timeId===rs[j].timeId)duplas++;
  return clamp(SEL_SINERGIA_BASE+duplas*SEL_SINERGIA_DUPLA,0,SEL_SINERGIA_MAX);
}
/* O time de uma partida: convocação de agora, comissão da federação,
   tática pelo perfil do elenco. `conv` permite escalar outra convocação
   (o técnico da seleção, na C7). */
function timeDaSelecao(pais,conv){
  const info=infoSelecao(pais);
  conv=conv||convocacao(pais);
  if(!info||!conv||conv.titulares.length<5)return null;
  const com=comissaoDaSelecao(pais);
  const nivel=id=>{const m=id&&G.staff&&G.staff[id];return m&&typeof nivelDe==='function'?nivelDe(m):NIVEL_NEUTRO;};
  const tit=conv.titulares.slice(0,5);
  const t={
    id:idSelecao(pais),selecao:pais,nome:info.nome,tag:info.sigla,regiao:null,tier:1,
    logo:(typeof ASSETS!=='undefined'&&(ASSETS.logoSelecao(pais)||ASSETS.bandeira(pais)))||'',
    elenco:tit.concat(conv.reservas||[]),titulares:tit,igl:null,
    comissao:{tecnico:com.tecnico||null,analista:com.analista||null},
    staff:{tecnico:nivel(com.tecnico),analista:nivel(com.analista),mental:NIVEL_NEUTRO,fisio:NIVEL_NEUTRO,olheiro:NIVEL_NEUTRO},
    sinergia:sinergiaSelecao(tit),mapPref:{},
    tatica:{agres:3,foco:'default',scrim:0},
    comps:{},temporada:{v:0,d:0},prestigio:50
  };
  const rs=tit.map(i=>G.jogadores[i]).filter(Boolean);
  const cand=rs.slice().sort((a,b)=>b.at.lider-a.at.lider)[0];
  t.igl=cand?cand.id:null;
  /* elenco de mira joga para frente; de utilidade, travado (táticas de match.js) */
  const perfil=typeof perfilAgressivo==='function'?perfilAgressivo(t):0;
  t.tatica.agres=clamp(3+Math.round(perfil/6),2,4);
  return t;
}

/* Põe as seleções no mundo só enquanto `fn` roda. Os convocados jogam na
   função da seleção e voltam para a do clube no fim, aconteça o que acontecer. */
function comSelecoesEmCampo(times,fn){
  const guardaRole={}, guardaTime={};
  try{
    for(const t of times){
      guardaTime[t.id]=G.times[t.id];
      G.times[t.id]=t;
      const rs=t.titulares.map(i=>G.jogadores[i]).filter(Boolean);
      const dist=distribuirFuncoes(rs);
      rs.forEach((p,i)=>{if(!(p.id in guardaRole))guardaRole[p.id]=p.roleAtual;p.roleAtual=dist.atrib[i];});
      if(typeof compIA==='function')compIA(t);
    }
    return fn();
  }finally{
    for(const id in guardaRole){const p=G.jogadores[id];if(p)p.roleAtual=guardaRole[id];}
    for(const id in guardaTime){if(guardaTime[id])G.times[id]=guardaTime[id];else delete G.times[id];}
  }
}

/* ---------- a série ----------
   ctx: {bo, nome (da competição), fase, peso (no ranking; 0 = não conta), conv,
         amistoso (sorteio local e nada muda no mundo), semana}
   Devolve a ficha enxuta, no formato que a tela de série já sabe ler. */
function jogarSerieSelecoes(paisA,paisB,ctx){
  ctx=ctx||{};
  const bo=ctx.bo||COPA_MD_GRUPOS;
  /* ctx.conv: convocação congelada (a da Copa), por país */
  const cv=ctx.conv||{};
  const A=timeDaSelecao(paisA,cv[paisA]), B=timeDaSelecao(paisB,cv[paisB]);
  if(!A||!B)return _woSelecoes(paisA,paisB,A,B,bo,ctx);
  const jogar=()=>comSelecoesEmCampo([A,B],()=>{
    const S=abrirSerie(A.id,B.id,bo,ctx.veto,null);
    while(!S.fim){
      if(!serieAbrirMapa(S))break;
      while(!S.M.fim)passoRound(S.M);
      serieFecharMapa(S);
    }
    return Object.assign({S},consolidarSerie(S));
  });
  const r=ctx.amistoso&&typeof comSorteioLocal==='function'
    ?comSorteioLocal('amistoso|'+(G.seed||0)+'|'+paisA+'|'+paisB+'|'+(ctx.n||0),jogar):jogar();
  const ficha=_fichaSelecoes(paisA,paisB,A,B,bo,r,ctx);
  if(!ctx.amistoso){
    _posSerieSelecoes(r);
    if(ctx.peso!==0)rankingPosSerie(ficha,ctx.peso==null?1:ctx.peso);
  }
  return ficha;
}
function _fichaSelecoes(paisA,paisB,A,B,bo,r,ctx){
  const S=r.S, venc=r.vencedor===A.id?paisA:paisB;
  return{
    a:paisA,b:paisB,wa:S.wa,wb:S.wb,v:venc,bo,ano:G.ano,sem:ctx.semana||G.semana,
    nome:ctx.nome||'',fase:ctx.fase||'',amistoso:!!ctx.amistoso,
    esc:{a:A.titulares.slice(),b:B.titulares.slice()},
    tec:{a:A.comissao.tecnico,b:B.comissao.tecnico},
    mapa:S.mapas.map(m=>m.mapa+' '+m.sa+'-'+m.sb).join(', '),
    det:{
      v:(S.veto.seq||[]).map(x=>[x.m,x.tipo==='ban'?'b':x.tipo==='dec'?'d':'p',x.t||'']),
      mp:S.mapas.map(m=>({m:m.mapa,a:m.sa,b:m.sb,l:m.hist&&m.hist[0]?m.hist[0].lado:null,
        st:Object.entries(m.st||{}).filter(([,x])=>x&&x.rounds>0)
          .map(([id,x])=>id+':'+x.k+','+x.d+','+x.a+','+Math.round(acsDe(x))).join('|')})),
      mvp:r.mvp||null}
  };
}
/* Seleção sem cinco convocáveis perde sem jogar (placar mínimo). */
function _woSelecoes(paisA,paisB,A,B,bo,ctx){
  const venc=A&&!B?paisA:B&&!A?paisB:paisA, need=Math.ceil(bo/2);
  return{a:paisA,b:paisB,wa:venc===paisA?need:0,wb:venc===paisB?need:0,v:venc,bo,ano:G.ano,sem:ctx.semana||G.semana,
    nome:ctx.nome||'',fase:ctx.fase||'',amistoso:!!ctx.amistoso,mapa:'W.O.',wo:venc===paisA?paisB:paisA,det:{v:[],mp:[],mvp:null}};
}

/* ---------- o que a série deixa ---------- */
function statsSelecao(p){
  if(!p.selecao)p.selecao={series:0,v:0,maps:0,k:0,d:0,a:0,fk:0,cl:0,acs:0,mvp:0,estreia:G.ano};
  return p.selecao;
}
function _posSerieSelecoes(r){
  const venc=r.vencedor, ganhou=new Set((r.S[venc===r.S.A.id?'A':'B'].titulares)||[]);
  for(const id in r.agg){
    const p=G.jogadores[id],s=r.agg[id];if(!p)continue;
    const x=statsSelecao(p);
    x.series++;if(ganhou.has(id))x.v++;
    x.maps+=s.maps;x.k+=s.k;x.d+=s.d;x.a+=s.a;x.fk+=s.fk;x.cl+=s.cl;x.acs+=s.acsSoma;
    if(id===r.mvp)x.mvp++;
    const kd=s.d?s.k/s.d:2;
    p.forma=clamp(p.forma+(kd-1.02)*0.04,.15,1);
    p.fadiga=clamp(p.fadiga+0.04,0,1);
    p.moral=clamp(p.moral+(ganhou.has(id)?0.03:-0.035),.15,1);
  }
  for(const mp of r.S.mapas)for(const id in mp.st){
    const p=G.jogadores[id],st=mp.st[id];
    if(p&&st.rounds&&typeof evoluirAfinidade==='function')evoluirAfinidade(p,mp.mapa,acsDe(st));
  }
}
/* Elo do ranking de países. Ganhar de quem está acima vale mais; o placar
   largo (2–0, 3–0) vale um pouco mais que o apertado. `peso` é o tamanho
   da partida: eliminatórias 1, grupos da Copa 1,5, mata-mata 2. */
function rankingPosSerie(f,peso){
  const c=garantirCopa();if(!c||!f||f.amistoso)return 0;
  const ra=c.ranking[f.a]||RANKING_BASE, rb=c.ranking[f.b]||RANKING_BASE;
  const esperado=1/(1+Math.pow(10,(rb-ra)/400));
  const res=f.v===f.a?1:0;
  const margem=1+0.25*Math.max(0,Math.abs(f.wa-f.wb)-1);
  const d=Math.round(SEL_K_RANKING*(peso||1)*margem*(res-esperado));
  c.ranking[f.a]=ra+d;c.ranking[f.b]=rb-d;
  return d;
}

/* ---------- amistoso (a tela da Copa) ----------
   Sorteio local: o mundo não muda, nem os pontos. Guarda os últimos cinco
   para a ficha poder ser reaberta. */
const AMISTOSOS_GUARDADOS=5;
function amistosoSelecoes(paisA,paisB,bo){
  const c=garantirCopa();if(!c)return null;
  c.nAmistoso=(c.nAmistoso||0)+1;
  const f=jogarSerieSelecoes(paisA,paisB,{bo:bo||COPA_MD_GRUPOS,amistoso:true,nome:'Amistoso',n:c.nAmistoso});
  c.amistosos=[f].concat(c.amistosos||[]).slice(0,AMISTOSOS_GUARDADOS);
  return f;
}
