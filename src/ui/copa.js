/* ============================================================
   VALORANT WORLD CUP — o hub do evento (C4)
   ------------------------------------------------------------
   Capa com a cidade da final, o logo da edição, a taça e a contagem;
   a linha do ciclo (eliminatórias → sorteio → grupos → mata-mata →
   final); e as abas:
     Visão geral   pódio (ou a última Copa), a seleção aberta com a
                   convocação e a comissão, os últimos jogos
     Chave         grupos e mata-mata da Copa, com a final em destaque;
                   antes dela, as eliminatórias
     Seleções      as 40, com escudo, ranking e situação no ciclo
     Estatísticas  líderes da Copa (ou das eliminatórias)
     Ranking       pontos, variação desde a última Copa e títulos
     Campeões      as edições já jogadas
     Amistoso      duas seleções no motor, sem valer nada
   ============================================================ */
let copaVer=null;            /* país aberto na tela */
let copaSelAtual=null;       /* o país que a tela está mostrando (o aberto, o seu ou o 1º) */
let copaCicloMostrado=null;  /* o ciclo cujo mata-mata e grupos estão na tela */
let copaAba='geral';
let copaAdv=null;
const COPA_ABAS=[['geral','Visão geral'],['chave','Chave'],['selecoes','Seleções'],['stats','Estatísticas'],['ranking','Ranking'],['campeoes','Campeões'],['amistoso','Amistoso']];

function semanasAteFinalDaCopa(){
  const ano=proximaCopa(G.ano);
  return Math.max(0,(ano-G.ano)*SEMANAS_ANO+(SEMANA_FINAL_COPA()-(G.semana||1)));
}
function SEMANA_FINAL_COPA(){return typeof COPA_SEM_FINAL!=='undefined'?COPA_SEM_FINAL:SEMANAS_ANO;}
function _sigSel(p){const i=infoSelecao(p);return i?i.sigla:p;}
function timeVisualSelecao(pais){
  const i=infoSelecao(pais)||{nome:pais,sigla:pais};
  return{nome:i.nome,tag:i.sigla,logo:ASSETS.logoSelecao(pais)||ASSETS.bandeira(pais)||''};
}

/* ---------- o contexto da tela ---------- */
function _ctxCopa(){
  garantirCopa();
  const ano=proximaCopa(G.ano), s=sedeDoAno(ano);
  const cic=cicloDaCopa(ano,false);
  /* no ano seguinte, até o sorteio das eliminatórias, a última Copa segue no topo */
  const ult=anoDeEliminatorias(G.ano)&&!(cic&&cic.convidadas)?cicloDaCopa(G.ano-1,false):null;
  const ultima=ult&&ult.copa&&ult.copa.fim?ult:null;
  const meuPais=typeof meuJogador==='function'&&meuJogador()?meuJogador().pais:null;
  const rk=rankingPaises();
  const sel=copaVer&&infoSelecao(copaVer)?copaVer:(meuPais&&infoSelecao(meuPais)?meuPais:rk[0].pais);
  copaSelAtual=sel;
  copaCicloMostrado=cic&&cic.copa?cic:ultima;
  const cid=typeof cidadeDaCopa==='function'?cidadeDaCopa(s.pais):null;
  return{ano,s,cic,ultima,sel,rk,cid,meuPais};
}
/* a etapa do ciclo, para a linha da capa e o texto */
function _etapasCopa(x){
  const{ano,cic}=x, el=ano-1;
  const feito=k=>({elim:!!(cic&&cic.classificados),sorteio:!!(cic&&cic.copa),grupos:!!(cic&&cic.copa&&cic.copa.mata.oitavas),
    mata:!!(cic&&cic.copa&&cic.copa.mata.semis),final:!!(cic&&cic.copa&&cic.copa.fim)})[k];
  const l=[['elim','Eliminatórias',`fim de ${el} · sem. ${ELIM_SEM_SORTEIO}–${ELIM_SEM_CLASSIFICADOS}`],
    ['sorteio','Sorteio',`${ano} · sem. ${COPA_SEM_SORTEIO}`],['grupos','Grupos',`sem. ${COPA_SEM_R12}–${COPA_SEM_R3} · MD3`],
    ['mata','Oitavas e quartas',`sem. ${COPA_SEM_OITAVAS} · MD5`],['final','Semis, bronze e final',`sem. ${COPA_SEM_FINAL} · MD5`]];
  const atual=l.findIndex(([k])=>!feito(k));
  return l.map(([k,n,q],i)=>({k,n,q,feito:feito(k),agora:i===atual}));
}
function _textoFase(x){
  const{ano,cic}=x, el=ano-1;
  if(cic&&cic.copa&&cic.copa.fim)return `${_nomeSel(cic.copa.podio[0])} é a campeã do mundo`;
  if(cic&&cic.copa&&cic.copa.mata.oitavas)return 'Mata-mata em andamento';
  if(cic&&cic.copa&&cic.copa.convocados)return 'Fase de grupos em andamento';
  if(cic&&cic.copa)return `Grupos sorteados · a Copa começa na semana ${COPA_SEM_R12}`;
  if(cic&&cic.classificados)return `Os 32 estão definidos · sorteio dos grupos na semana ${COPA_SEM_SORTEIO} de ${ano}`;
  if(cic&&cic.grupos)return 'Eliminatórias em andamento';
  if(G.ano<el)return `Eliminatórias no fim de ${el}`;
  return `Eliminatórias no fim desta temporada · convites e sorteio na semana ${ELIM_SEM_SORTEIO}`;
}

/* ---------- a capa ---------- */
function capaCopa(x){
  const{ano,s,cic,cid}=x;
  const logo=ASSETS.copa('sede-'+ASSETS.slug(s.nome))||ASSETS.copa('logo'), taca=ASSETS.copa('trofeu');
  const falta=semanasAteFinalDaCopa(), fim=cic&&cic.copa&&cic.copa.fim;
  const fundo=cid?`background-image:linear-gradient(90deg,rgba(9,14,19,.96) 0%,rgba(9,14,19,.82) 42%,rgba(9,14,19,.55) 100%),radial-gradient(60% 90% at 82% 20%,rgba(226,180,90,.28),transparent 70%),${urlCSS(ASSETS.cidade(cid.slug))};background-size:cover;background-position:center`:'';
  const et=_etapasCopa(x);
  return `<section class="cpx-capa" style="${fundo}">
    <div class="cpx-capa-in">
      <div class="cpx-logo">${logo?`<img src="${logo}" alt="Logo da World Cup ${ano}">`:ico('trofeu')}</div>
      <div class="cpx-capa-txt">
        <div class="cpx-eyebrow">Valorant World Cup · ${s.edicao}ª edição</div>
        <h1 class="cpx-tit">${esc(s.nome)} <span>${ano}</span></h1>
        <div class="cpx-sub">${bandeira(s.pais)} ${cid?`Final em <b>${esc(cid.nome)}</b> · `:''}32 seleções · 8 grupos de 4</div>
        <div class="cpx-fase">${esc(_textoFase(x))}</div>
      </div>
      <div class="cpx-conta">${fim?`${escudoSelecao(cic.copa.podio[0],64)}<span>campeã ${ano}</span>`
        :`<b class="num">${falta}</b><span>semana${falta===1?'':'s'} para a final</span>`}</div>
      ${taca?`<img class="cpx-taca" src="${taca}" alt="">`:''}
    </div>
    <ol class="cpx-etapas">${et.map(e=>`<li class="${e.feito?'feito':''} ${e.agora?'agora':''}"><i></i><b>${e.n}</b><span>${e.q}</span></li>`).join('')}</ol>
  </section>`;
}

/* ---------- a tela ---------- */
function vCopa(){
  const x=_ctxCopa();
  const corpo=copaAba==='chave'?abaChave(x):copaAba==='selecoes'?abaSelecoes(x):copaAba==='stats'?abaStats(x)
    :copaAba==='ranking'?abaRanking(x):copaAba==='campeoes'?abaCampeoes(x):copaAba==='amistoso'?cardAmistoso(x.sel):abaGeral(x);
  return capaCopa(x)+`<div class="tabs cpx-abas">${COPA_ABAS.map(([k,n])=>`<button data-cpaba="${k}" class="${copaAba===k?'on':''}">${n}</button>`).join('')}</div>`+corpo;
}

/* ---------- visão geral ---------- */
function abaGeral(x){
  const cic=copaCicloMostrado;
  const ed=cic&&cic.copa&&cic.copa.fim?edicoesDaCopa().find(e=>e.ano===cic.ano):null;
  return `${ed?cardFinalEspecial(cic,ed):''}
    <div class="cpx-g2">${cardSelecao(x)}${cardUltimosJogos(x)}</div>
    ${cic&&cic.copa&&!ed?cardChaveCompacta(cic,x.sel):''}`;
}
/* a final em destaque: a taça, a campeã, o placar, o MVP e o pódio */
function cardFinalEspecial(cic,ed){
  const f=ed.final, pro=f.v===f.a?f.wa:f.wb, contra=f.v===f.a?f.wb:f.wa;
  const nome=id=>ed.nomes[id]||(G.jogadores[id]||{}).nome||'—';
  const pm=ed.mvp&&G.jogadores[ed.mvp], taca=ASSETS.copa('trofeu');
  const premio=k=>ASSETS.copa('premio-'+k);
  return `<section class="cpx-final" style="${fundoDaSede(cic,.86)}">
    <div class="cpx-final-topo"><span>${cic.ano<G.ano?'A última Copa · ':''}World Cup ${cic.ano} · ${esc(cic.nomeSede)}</span>
      <button class="btn ghost sm" data-cpmomento="campea|${cic.ano}">Rever a final</button></div>
    <div class="cpx-final-in">
      <div class="cpx-final-taca">${taca?`<img src="${taca}" alt="">`:''}</div>
      <div class="cpx-final-meio">
        <div class="cpx-eyebrow">Campeã do mundo</div>
        <div class="cpx-final-campea">${escudoSelecao(ed.campeao,96)}<h2>${esc(_nomeSel(ed.campeao))}</h2></div>
        <div class="cpx-final-placar" data-cpfinal="${ed.ano}">${escudoSelecao(ed.campeao,30)}<b class="num">${pro}</b><i>×</i><b class="num">${contra}</b>${escudoSelecao(ed.vice,30)}
          <span>final contra ${esc(_nomeSel(ed.vice))} · ver a ficha</span></div>
        <div class="cpx-podio">
          ${[['ouro',ed.campeao,'Campeã'],['prata',ed.vice,'Vice'],['bronze',ed.bronze,'Bronze']].map(([m,p,r])=>`<div class="cpx-pd cpx-pd-${m}" data-copapais="${p}">
            <span class="cpx-med ${m}"></span>${escudoSelecao(p,32)}<b>${esc(_nomeSel(p))}</b><em>${r}</em></div>`).join('')}
        </div>
      </div>
      <div class="cpx-final-premios">
        <div class="cpx-premio">${premio('mvp')?`<img src="${premio('mvp')}" alt="">`:''}<div><span>MVP da Copa</span>
          ${pm?`<b class="jrow" data-p="${pm.id}">${esc(pm.nome)}</b><em>${bandeira(pm.pais)} ${esc(pm.role)}</em>`:`<b>${esc(nome(ed.mvp))}</b>`}</div></div>
        <div class="cpx-premio">${premio('time-ideal')?`<img src="${premio('time-ideal')}" alt="">`:''}<div><span>Time ideal</span>
          <div class="cpx-ti">${ed.timeIdeal.map(id=>`<b class="${G.jogadores[id]?'jrow':''}" data-p="${id}">${esc(nome(id))}</b>`).join('')}</div></div></div>
        ${ed.tecnicoCampeao?`<div class="cpx-premio">${premio('treinador')?`<img src="${premio('treinador')}" alt="">`:''}<div><span>Técnico campeão</span><b>${esc(ed.nomes[ed.tecnicoCampeao]||'')}</b></div></div>`:''}
      </div>
    </div></section>`;
}
/* a seleção aberta: escudo, situação, comissão e convocação */
function _situacao(x,pais){
  const cic=x.cic, ed=x.ultima&&edicoesDaCopa().find(e=>e.ano===x.ultima.ano);
  if(cic&&cic.copa){
    const C=cic.copa;
    if(C.fim){const i=C.podio.indexOf(pais);return i===0?['ouro','Campeã do mundo']:i===1?['prata','Vice-campeã']:i===2?['bronze','Bronze']:i===3?['','4º lugar']:cic.classificados.includes(pais)?['','Jogou a Copa']:['fora','Fora da Copa'];}
    const vivo=(()=>{for(const k of ['final','semis','quartas','oitavas']){const l=C.mata[k];if(l)return l.some(j=>(j.a===pais||j.b===pais)&&(!j.f||j.f.v===pais));}
      return cic.classificados.includes(pais);})();
    return cic.classificados.includes(pais)?(vivo?['vivo','Na disputa']:['fora','Eliminada']):['fora','Fora da Copa'];
  }
  const s=situacaoNoCiclo(cic,pais);
  if(s==='convidada')return['vivo','Convidada'];
  if(s==='classificada')return['vivo','Classificada'];
  if(s==='fora')return['fora','Fora da Copa'];
  if(s==='eliminatorias')return['','Nas eliminatórias'];
  if(ed&&ed.campeao===pais)return['ouro','Campeã de '+ed.ano];
  x.convHoje=x.convHoje||convidadasDaCopa(x.ano);
  return x.convHoje.includes(pais)?['','Convidada se fosse hoje']:['','Iria às eliminatórias'];
}
function cardSelecao(x){
  const pais=x.sel, info=infoSelecao(pais);if(!info)return '';
  const C=x.cic&&x.cic.copa, cv=C&&C.convocados&&C.convocados[pais];
  const c=cv||convocacao(pais), rk=x.rk.find(r=>r.pais===pais);
  const com=comissaoDaSelecao(pais), tec=com.tecnico&&G.staff[com.tecnico], ana=com.analista&&G.staff[com.analista];
  const [cls,sit]=_situacao(x,pais), tit=titulosMundiais(pais);
  const linha=(id,t)=>{const p=G.jogadores[id];if(!p)return '';const cl=p.timeId&&G.times[p.timeId];
    return `<div class="cpx-conv-j jrow ${t?'tit':''}" data-p="${p.id}">${retrato(p,34)}<div><b>${esc(p.nome)}${p.voce?' <span class="chip up">você</span>':''}</b>
      <span>${esc(p.roleAtual&&t?p.role:p.role)} · ${cl?esc(cl.tag||cl.nome):p.base?'base':'sem clube'}</span></div><em class="num">${over(p)}</em></div>`;};
  const pessoa=(m,rot)=>m?`<div class="cpx-staff">${retratoStaff(m,34)}<div><span>${rot}</span><b>${esc(m.nome)}</b><em>${bandeira(m.pais)} ${m.pais===pais?'do país':'estrangeiro'}</em></div></div>`:'';
  const outras=x.rk.filter(r=>r.pais!==pais);
  return `<div class="card cpx-sel">
    <div class="cpx-sel-topo">${escudoSelecao(pais,84)}<div>
      <div class="cpx-eyebrow">${bandeira(pais)} ${esc(info.sigla)} · ${esc(COPA_CONTINENTES[info.cont])}</div>
      <h2>${esc(info.nome)}</h2>
      <div class="cpx-sel-chips"><span class="cpx-sit ${cls}">${esc(sit)}</span><span>${rk?rk.pos+'º no ranking · '+rk.pts+' pts':''}</span>${tit?`<span class="cpx-tit-m">${'★'.repeat(Math.min(tit,5))} ${tit} título${tit>1?'s':''}</span>`:''}</div></div>
      <select class="cpx-sel-troca" data-cptroca>${[x.rk.find(r=>r.pais===pais)].concat(outras).map(r=>`<option value="${r.pais}" ${r.pais===pais?'selected':''}>${esc(r.nome)}</option>`).join('')}</select></div>
    <div class="cpx-staffs">${pessoa(tec,'Técnico')}${pessoa(ana,'Analista')}</div>
    <div class="cpx-eyebrow">${cv?'Convocação da Copa':'Convocação de hoje'} · ${c?c.titulares.length+c.reservas.length:0} jogadores</div>
    ${c?`<div class="cpx-conv"><div class="cpx-conv-col"><span class="cpx-rot">Titulares</span>${c.titulares.map(i=>linha(i,true)).join('')}</div>
      <div class="cpx-conv-col"><span class="cpx-rot">Reservas</span>${c.reservas.map(i=>linha(i,false)).join('')}</div></div>
      <p class="dim cpx-nota">Força do melhor cinco: <b>${forcaSelecao(pais,c)}</b>. ${convocaveis(pais).length} convocáveis no mundo${cv?'; a convocação ficou fixa no início da Copa':'; o cinco sai da mesma conta da escalação dos clubes'}.</p>`
      :vazio(`<b>${esc(info.nome)} não tem 7 jogadores agora.</b>`,'elenco')}
  </div>`;
}
/* os jogos mais recentes do ciclo, da seleção aberta primeiro */
function _jogosDoCiclo(cic){
  if(!cic)return [];
  const l=[];
  for(const g of cic.grupos||[])for(const f of g.jogos||[])l.push(f);
  if(cic.copa){for(const g of cic.copa.grupos)for(const f of g.jogos||[])l.push(f);
    for(const [k] of COPA_FASES)for(const j of cic.copa.mata[k]||[])if(j.f)l.push(j.f);}
  return l;
}
function cardUltimosJogos(x){
  const cic=x.cic&&(x.cic.copa||x.cic.grupos)?x.cic:x.ultima;
  const todos=_jogosDoCiclo(cic);
  const meus=todos.filter(f=>f.a===x.sel||f.b===x.sel).slice(-6).reverse();
  const outros=todos.slice(-8).reverse();
  const linha=f=>`<div class="cpx-jogo ${f.det&&f.det.mp&&f.det.mp.length?'':'sem'}" ${f.det?`data-cpjogo="${_chaveJogo(cic,f)}"`:''}>
    <span class="cpx-j-fase">${esc(f.fase||'')}</span>
    <span class="cpx-j-l ${f.v===f.a?'w':''}">${escudoSelecao(f.a,22)}${esc(_sigSel(f.a))}</span><b class="num">${f.wa}–${f.wb}</b>
    <span class="cpx-j-l r ${f.v===f.b?'w':''}">${esc(_sigSel(f.b))}${escudoSelecao(f.b,22)}</span></div>`;
  return `<div class="card cpx-jogos"><div class="cpx-eyebrow">${cic?'Jogos · '+(cic.copa?'World Cup ':'Eliminatórias · Copa ')+cic.ano:'Jogos'}</div>
    ${meus.length?`<div class="cpx-rot">${esc(_nomeSel(x.sel))}</div>${meus.map(linha).join('')}`:''}
    ${outros.length?`<div class="cpx-rot">${meus.length?'Os mais recentes':'Os mais recentes do ciclo'}</div>${outros.map(linha).join('')}`
      :`<div class="cpx-vazio">${ico('jogar')}<b>Nenhum jogo de seleção ainda.</b><span>As eliminatórias começam na semana ${ELIM_SEM_RODADA1} de ${x.ano-1}. Enquanto isso, dá para jogar um amistoso.</span>
        <button class="btn ghost sm" data-cpaba="amistoso">Jogar um amistoso</button></div>`}
  </div>`;
}
function _chaveJogo(cic,f){
  for(const g of cic.grupos||[]){const i=(g.jogos||[]).indexOf(f);if(i>=0)return 'e|'+g.letra+'|'+i+'|'+cic.ano;}
  if(cic.copa){for(const g of cic.copa.grupos){const i=(g.jogos||[]).indexOf(f);if(i>=0)return 'g|'+g.letra+'|'+i+'|'+cic.ano;}
    for(const [k] of COPA_FASES){const i=(cic.copa.mata[k]||[]).findIndex(j=>j.f===f);if(i>=0)return 'm|'+k+'|'+i+'|'+cic.ano;}}
  return '';
}
function _abrirJogo(chave){
  const [t,k,i,ano]=chave.split('|');const cic=cicloDaCopa(+ano,false);if(!cic)return;
  if(t==='e'){const g=(cic.grupos||[]).find(x=>x.letra===k);if(g&&g.jogos)modalSerieSelecao(g.jogos[+i]);return;}
  const C=cic.copa;if(!C)return;
  if(t==='g'){const g=C.grupos.find(x=>x.letra===k);if(g&&g.jogos)modalSerieSelecao(g.jogos[+i]);return;}
  const j=(C.mata[k]||[])[+i];
  if(j&&j.f&&j.f.det)modalSerieSelecao(j.f);
  else if(k==='final'){const e=edicoesDaCopa().find(z=>z.ano===cic.ano);if(e)modalSerieSelecao(e.final);}
}

/* ---------- chave ---------- */
function abaChave(x){
  const cic=copaCicloMostrado;
  if(cic&&cic.copa)return cardChave(cic,x.sel)+cardGruposCopa(cic,x.sel);
  return cardEliminatorias(x.ano,x.sel);
}
function _jogoChave(j,chave,sel,grande){
  if(!j)return `<div class="cpx-mm-j vazio"><div class="cpx-mm-l"><i></i><span>a definir</span></div><div class="cpx-mm-l"><i></i><span>a definir</span></div></div>`;
  const f=j.f, l=(p,w)=>`<div class="cpx-mm-l ${f&&f.v===p?'w':f?'l':''} ${p===sel?'me':''}">${escudoSelecao(p,grande?34:22)}<span>${esc(grande?_nomeSel(p):_sigSel(p))}</span>${f?`<b class="num">${w}</b>`:''}</div>`;
  return `<div class="cpx-mm-j ${grande?'grande':''}" ${f?`data-cpjogo="${chave}"`:''}>${l(j.a,f&&f.wa)}${l(j.b,f&&f.wb)}${j.orig&&!f?`<div class="cpx-mm-o">${esc(j.orig)}</div>`:''}</div>`;
}
/* a chave em duas metades que se encontram na final, como no pôster */
function cardChave(cic,sel){
  const C=cic.copa, M=C.mata, k=(f,i)=>'m|'+f+'|'+i+'|'+cic.ano, taca=ASSETS.copa('trofeu');
  const col=(fase,ids,tit)=>`<div class="cpx-mm-c cpx-mm-${fase}"><div class="cpx-mm-t">${tit}</div>${ids.map(i=>_jogoChave((M[fase]||[])[i],k(fase,i),sel)).join('')}</div>`;
  const fin=(M.final||[])[0], br=(M.bronze||[])[0];
  return `<section class="cpx-chave" style="${fundoDaSede(cic,.9)}">
    <div class="cpx-chave-topo"><div class="cpx-eyebrow">Mata-mata · MD5</div>
      ${C.fim?`<button class="btn ghost sm" data-cpmomento="campea|${cic.ano}">Rever a final</button>`:''}</div>
    <div class="cpx-mm">
      ${col('oitavas',[0,1,2,3],'Oitavas')}${col('quartas',[0,1],'Quartas')}${col('semis',[0],'Semifinal')}
      <div class="cpx-mm-c cpx-mm-centro">
        ${taca?`<img class="cpx-mm-taca" src="${taca}" alt="">`:''}
        <div class="cpx-mm-t ouro">Final · ${esc((cidadeDaCopa(cic.sede)||{}).nome||cic.nomeSede)}</div>
        ${_jogoChave(fin,k('final',0),sel,true)}
        <div class="cpx-mm-t">Disputa do bronze</div>${_jogoChave(br,k('bronze',0),sel)}
      </div>
      ${col('semis',[1],'Semifinal')}${col('quartas',[2,3],'Quartas')}${col('oitavas',[4,5,6,7],'Oitavas')}
    </div>
    ${M.oitavas?'':`<p class="dim cpx-nota">Oitavas na semana ${COPA_SEM_OITAVAS}: o 1º de cada grupo enfrenta o 2º do grupo vizinho, e as duas metades só se cruzam na final.</p>`}
  </section>`;
}
function cardChaveCompacta(cic,sel){return cardChave(cic,sel);}
function cardGruposCopa(cic,sel){
  const C=cic.copa;
  return `<div class="card cx-linha"><div class="cpx-eyebrow">Fase de grupos · MD3 · os dois primeiros avançam</div>
    <div class="cpx-grupos">${C.grupos.map(g=>{
      const t=linhasDoGrupo(g,cic.pontosCopa), passou=g.classificados||[];
      return `<div class="cpx-grupo"><div class="cpx-grupo-l">Grupo <b>${g.letra}</b></div>
        ${t.map((r,i)=>`<div class="cpx-gl ${r.pais===sel?'me':''} ${passou.includes(r.pais)?'passou':passou.length?'caiu':''}" data-copapais="${r.pais}">
          <span class="cpx-gl-p">${i+1}</span>${escudoSelecao(r.pais,26)}<b>${esc(_nomeSel(r.pais))}</b>
          <span class="num">${r.v}-${r.d}</span><span class="num dim">${r.mp}:${r.mc}</span></div>`).join('')}
        ${(g.jogos||[]).length?`<div class="cpx-g-jogos">${g.jogos.map((f,i)=>`<span data-cpjogo="g|${g.letra}|${i}|${cic.ano}">${esc(_sigSel(f.a))} <b>${f.wa}–${f.wb}</b> ${esc(_sigSel(f.b))}</span>`).join('')}</div>`
          :`<div class="cpx-g-jogos dim">Rodadas 1 e 2 na semana ${COPA_SEM_R12}, rodada 3 na ${COPA_SEM_R3}.</div>`}
      </div>`;}).join('')}</div>
    ${C.convocados?'':`<div class="cpx-acoes"><button class="btn ghost sm" data-cpmomento="sorteio|${cic.ano}">Rever o sorteio</button></div>`}</div>`;
}
/* eliminatórias: o sorteio de verdade ou a simulação "se fosse hoje" */
function cardEliminatorias(ano,sel){
  const cic=cicloDaCopa(ano,false), sorteado=!!(cic&&cic.grupos);
  const conv=sorteado?cic.convidadas:convidadasDaCopa(ano);
  const grupos=sorteado?cic.grupos:gruposEliminatorias(ano).map(g=>Object.assign({jogos:[]},g));
  const chip=p=>`<span class="cpx-chip ${p===sel?'me':''}" data-copapais="${p}">${escudoSelecao(p,22)}${esc(_nomeSel(p))}</span>`;
  return `<div class="card cx-linha cpx-elim"><div class="cpx-eyebrow">${!sorteado?'Eliminatórias · se o sorteio fosse hoje':cic.classificados?'Eliminatórias · os 32 classificados':'Eliminatórias'}</div>
    <p class="dim">${sorteado
      ?`Sorteio feito na semana ${ELIM_SEM_SORTEIO}. Grupos de 3 em MD3, todos contra todos; os dois primeiros vão à Copa. Desempate: vitórias, saldo de mapas, saldo de rounds, confronto direto e ranking.`
      :`A sede e as 15 melhores do ranking vão direto. As outras 24 jogam no fim de ${ano-1}: 8 grupos de 3 por continente, em MD3; os dois primeiros de cada grupo vão à Copa. O sorteio é na semana ${ELIM_SEM_SORTEIO}.`}</p>
    <div class="cpx-linha-chips"><span class="cpx-rot">Convidadas</span>${conv.map(chip).join('')}</div>
    ${cic&&cic.classificados?`<div class="cpx-linha-chips"><span class="cpx-rot">Das eliminatórias</span>${cic.dasEliminatorias.map(chip).join('')}</div>`:''}
    <div class="cpx-grupos">${grupos.map(g=>{
      const t=sorteado?linhasDoGrupo(g,cic.pontosNoSorteio):g.paises.map(p=>({pais:p,v:0,d:0,mp:0,mc:0}));
      const passou=g.classificados||[];
      return `<div class="cpx-grupo"><div class="cpx-grupo-l">Grupo <b>${g.letra}</b> <span>${g.cont==='INTER'?'Intercontinental':esc(COPA_CONTINENTES[g.cont])}</span></div>
        ${t.map((r,i)=>`<div class="cpx-gl ${r.pais===sel?'me':''} ${passou.includes(r.pais)?'passou':passou.length?'caiu':''}" data-copapais="${r.pais}">
          <span class="cpx-gl-p">${i+1}</span>${escudoSelecao(r.pais,26)}<b>${esc(_nomeSel(r.pais))}</b>
          ${sorteado&&(g.jogos||[]).length?`<span class="num">${r.v}-${r.d}</span><span class="num dim">${r.mp}:${r.mc}</span>`:''}</div>`).join('')}
        ${(g.jogos||[]).length?`<div class="cpx-g-jogos">${g.jogos.map((f,i)=>`<span data-cpjogo="e|${g.letra}|${i}|${ano}">${esc(_sigSel(f.a))} <b>${f.wa}–${f.wb}</b> ${esc(_sigSel(f.b))}</span>`).join('')}</div>`
          :sorteado?`<div class="cpx-g-jogos dim">Jogos nas semanas ${ELIM_SEM_RODADA1} e ${ELIM_SEM_RODADA2}.</div>`:''}
      </div>`;}).join('')}</div>
    ${sorteado?`<div class="cpx-acoes"><button class="btn ghost sm" data-cpmomento="convidadas|${ano}">Rever as convidadas</button>
      ${cic.classificados?`<button class="btn ghost sm" data-cpmomento="classificados|${ano}">Rever os classificados</button>`:''}</div>`:''}
  </div>`;
}

/* ---------- as 40 seleções ---------- */
function abaSelecoes(x){
  const cic=x.cic;
  const grupos=[['vivo','Na Copa'],['','Nas eliminatórias'],['fora','Fora'],['','No ciclo']];
  const sit=p=>_situacao(x,p);
  const lad=r=>{const [c,t]=sit(r.pais);const tit=titulosMundiais(r.pais);
    return `<div class="cpx-lad ${r.pais===x.sel?'me':''}" data-copapais="${r.pais}" data-cpaba="geral">
      ${escudoSelecao(r.pais,64)}<b>${esc(r.nome)}</b><span>${bandeira(r.pais)} ${esc(r.sigla)} · ${r.pos}º</span>
      <em class="cpx-sit ${c}">${esc(t)}</em>${tit?`<i class="cpx-lad-t">${'★'.repeat(Math.min(tit,5))}</i>`:''}</div>`;};
  const porCont=Object.keys(COPA_CONTINENTES).map(k=>[k,x.rk.filter(r=>r.cont===k)]);
  return `<div class="card cx-linha"><div class="cpx-eyebrow">As 40 seleções · ${cic&&cic.classificados?'32 na Copa '+x.ano:'ciclo da Copa '+x.ano}</div>
    ${porCont.map(([k,l])=>`<div class="cpx-cont"><div class="cpx-cont-t">${esc(COPA_CONTINENTES[k])} <span>${l.length}</span></div>
      <div class="cpx-lads">${l.map(lad).join('')}</div></div>`).join('')}</div>`;
}

/* ---------- estatísticas ---------- */
function abaStats(x){
  const cic=copaCicloMostrado||x.cic;
  const naCopa=!!(cic&&cic.copa);
  const jogos=naCopa?jogosDaCopa(cic):_jogosDoCiclo(cic).filter(f=>f.det);
  const S=Object.values(statsDeJogos(jogos)).filter(s=>G.jogadores[s.id]);
  if(!S.length)return `<div class="card cx-linha"><div class="cpx-vazio">${ico('grafico')}<b>Ainda não há números.</b><span>Os líderes aparecem quando as seleções entrarem em quadra: eliminatórias no fim de ${x.ano-1}, Copa no fim de ${x.ano}.</span></div></div>`;
  const min=Math.max(2,Math.round(Math.max(...S.map(s=>s.maps))*0.4));
  const tabela=(tit,campo,fmt,filtro)=>{
    const l=S.filter(filtro||(()=>true)).sort((a,b)=>b[campo]-a[campo]).slice(0,8);
    return `<div class="card cpx-lider"><div class="cpx-eyebrow">${tit}</div>${l.map((s,i)=>{const p=G.jogadores[s.id];
      return `<div class="cpx-lid jrow ${i===0?'top':''}" data-p="${s.id}"><span class="cpx-lid-p">${i+1}</span>${retrato(p,i?30:42)}
        <div><b>${esc(p.nome)}</b><span>${bandeira(s.pais)} ${esc(_sigSel(s.pais))} · ${s.maps} mapas</span></div><em class="num">${fmt(s[campo])}</em></div>`;}).join('')}</div>`;};
  /* seleções: mapas e rounds */
  const T={};
  for(const f of jogos){for(const [p,w,l] of [[f.a,f.wa,f.wb],[f.b,f.wb,f.wa]]){const t=T[p]=T[p]||{pais:p,s:0,v:0,mp:0,mc:0,rp:0,rc:0};t.s++;if(f.v===p)t.v++;t.mp+=w;t.mc+=l;}
    for(const m of (f.det&&f.det.mp)||[]){T[f.a].rp+=m.a;T[f.a].rc+=m.b;T[f.b].rp+=m.b;T[f.b].rc+=m.a;}}
  const tl=Object.values(T).sort((a,b)=>b.v-a.v||(b.mp-b.mc)-(a.mp-a.mc)).slice(0,12);
  return `<div class="cpx-stats-cab"><div class="cpx-eyebrow">${naCopa?'World Cup '+cic.ano:'Eliminatórias · Copa '+cic.ano} · ${jogos.length} séries · ${jogos.reduce((s,f)=>s+((f.det&&f.det.mp)||[]).length,0)} mapas</div></div>
    <div class="cpx-g3">
      ${tabela('Kills','k',v=>v)}
      ${tabela('ACS médio','acsM',v=>Math.round(v),s=>s.maps>=min)}
      ${tabela('K/D','kd',v=>v.toFixed(2),s=>s.maps>=min)}
    </div>
    <div class="cpx-g2">
      ${tabela('MVP de série','mvp',v=>v,s=>s.mvp>0)}
      <div class="card cpx-lider"><div class="cpx-eyebrow">Seleções</div>
        <table class="tbl"><thead><tr><th></th><th class="c">Séries</th><th class="c">V</th><th class="c">Mapas</th><th class="c">Rounds</th></tr></thead><tbody>
        ${tl.map(t=>`<tr data-copapais="${t.pais}" style="cursor:pointer"><td>${escudoSelecao(t.pais,22)} <b>${esc(_nomeSel(t.pais))}</b></td><td class="c num">${t.s}</td><td class="c num">${t.v}</td>
          <td class="c num">${t.mp}:${t.mc}</td><td class="c num">${t.rp}:${t.rc}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
}

/* ---------- ranking ---------- */
function abaRanking(x){
  const c=garantirCopa(), antes=c.rankingUltimaEdicao||{};
  const linha=r=>{const d=antes[r.pais]!=null?r.pts-antes[r.pais]:0, tit=titulosMundiais(r.pais), [cls,sit]=_situacao(x,r.pais);
    return `<tr class="${r.pais===x.sel?'me':''}" data-copapais="${r.pais}" style="cursor:pointer">
      <td class="num cpx-rk-p">${r.pos}</td><td><span class="cpx-rk-s">${escudoSelecao(r.pais,30)}<span><b>${esc(r.nome)}</b><em>${bandeira(r.pais)} ${esc(r.sigla)} · ${esc(COPA_CONTINENTES[r.cont])}</em></span></span></td>
      <td class="num">${forcaSelecao(r.pais)}</td><td class="num"><b>${r.pts}</b></td>
      <td class="num ${d>0?'up':d<0?'dn':'dim'}">${d>0?'▲ '+d:d<0?'▼ '+(-d):'—'}</td>
      <td class="cpx-rk-t">${tit?'★'.repeat(Math.min(tit,5))+(tit>5?' '+tit:''):''}</td><td><span class="cpx-sit ${cls}">${esc(sit)}</span></td></tr>`;};
  return `<div class="card cx-linha"><div class="cpx-eyebrow">Ranking de países</div>
    <table class="tbl cpx-rk"><thead><tr><th>#</th><th>Seleção</th><th>Força</th><th>Pontos</th><th>${edicoesDaCopa().length?'Desde o sorteio da última Copa':'Desde o início'}</th><th>Títulos</th><th>Situação</th></tr></thead>
    <tbody>${x.rk.map(linha).join('')}</tbody></table>
    <p class="dim cpx-nota">${x.cic&&x.cic.convidadas?`As convidadas saíram deste ranking no dia do sorteio (semana ${ELIM_SEM_SORTEIO}).`:`Hoje, as ${COPA_CONVITES} primeiras seriam convidadas (a sede entra sempre).`}
      O ranking nasce da força do melhor cinco de cada país, anda com cada série entre seleções (mais na Copa que nas eliminatórias, mais no mata-mata que nos grupos) e, a cada virada de ano, um pouco em direção à força atual do elenco.</p></div>`;
}

/* ---------- campeões ---------- */
function abaCampeoes(){
  const eds=edicoesDaCopa();
  if(!eds.length)return `<div class="card cx-linha"><div class="cpx-vazio">${ASSETS.copa('trofeu')?`<img src="${ASSETS.copa('trofeu')}" alt="" class="cpx-vazio-taca">`:ico('trofeu')}<b>A taça ainda não tem dono.</b><span>A primeira Valorant World Cup é em ${esc(sedeDoAno(COPA_PRIMEIRA).nome)}, no fim de ${COPA_PRIMEIRA}.</span></div></div>`;
  return `<div class="cpx-galeria">${eds.slice().reverse().map(e=>{const fv=e.final.v===e.final.a?e.final.wa+'–'+e.final.wb:e.final.wb+'–'+e.final.wa;
    const logo=ASSETS.copa('sede-'+ASSETS.slug(e.nomeSede));
    return `<div class="cpx-ed">
      <div class="cpx-ed-topo">${logo?`<img src="${logo}" alt="">`:''}<div><b>${e.ano}</b><span>${e.edicao}ª · ${esc(e.nomeSede)}${e.cidade?' · '+esc(e.cidade):''}</span></div></div>
      <div class="cpx-ed-campea" data-copapais="${e.campeao}">${escudoSelecao(e.campeao,72)}<b>${esc(_nomeSel(e.campeao))}</b></div>
      <div class="cpx-ed-final" data-cpfinal="${e.ano}">final <b class="num">${fv}</b> ${escudoSelecao(e.vice,20)} ${esc(_nomeSel(e.vice))}</div>
      <div class="cpx-ed-pe"><span>🥉 ${esc(_nomeSel(e.bronze))}</span>${e.mvp?`<span class="jrow" data-p="${e.mvp}">MVP ${esc(e.nomes[e.mvp]||'')}</span>`:''}</div>
    </div>`;}).join('')}</div>`;
}

/* ---------- amistoso ---------- */
function cardAmistoso(sel){
  const c=garantirCopa();
  const outros=rankingPaises().filter(x=>x.pais!==sel);
  const adv=copaAdv&&copaAdv!==sel&&infoSelecao(copaAdv)?copaAdv:outros[0].pais;
  const lista=(c.amistosos||[]);
  return `<div class="card cx-linha cp-amistoso"><div class="cpx-eyebrow">Amistoso</div>
    <p class="dim">Duas seleções no mesmo motor dos clubes, com veto, mapa a mapa e ficha. Não vale ponto no ranking nem mexe em ninguém.</p>
    <div class="cpx-am">
      <div class="cpx-am-t">${escudoSelecao(sel,96)}<b>${esc(_nomeSel(sel))}</b><span>${bandeira(sel)} a seleção aberta</span></div>
      <div class="cpx-am-x">×</div>
      <div class="cpx-am-t">${escudoSelecao(adv,96)}<select id="cpAdv">${outros.map(x=>`<option value="${x.pais}" ${x.pais===adv?'selected':''}>${esc(x.nome)} (${x.sigla})</option>`).join('')}</select><span>${bandeira(adv)} adversária</span></div>
    </div>
    <div class="cpx-acoes c"><button class="btn" data-cpamistoso="3">Jogar MD3</button><button class="btn ghost" data-cpamistoso="5">Jogar MD5</button></div>
    ${lista.length?`<div class="cpx-rot">Últimos amistosos</div>${lista.map((f,i)=>`<div class="cpx-jogo" data-cpficha="${i}">
      <span class="cpx-j-fase">MD${f.bo}</span><span class="cpx-j-l ${f.v===f.a?'w':''}">${escudoSelecao(f.a,22)}${esc(_sigSel(f.a))}</span><b class="num">${f.wa}–${f.wb}</b>
      <span class="cpx-j-l r ${f.v===f.b?'w':''}">${esc(_sigSel(f.b))}${escudoSelecao(f.b,22)}</span></div>`).join('')}`:''}
  </div>`;
}

/* ---------- ficha de série de seleção (a final ganha a sua cara) ---------- */
function modalSerieSelecao(f){
  if(!f)return;
  const sig=p=>{const i=infoSelecao(p);return i?i.sigla:p;};
  const lado=pm=>f.esc&&f.esc.a.includes(pm.id)?sig(f.a):sig(f.b);
  const tec=['a','b'].map(k=>{const m=f.tec&&f.tec[k]&&G.staff&&G.staff[f.tec[k]];
    return m?`<span>${bandeira(f[k])} técnico: <b>${esc(m.nome)}</b> ${bandeira(m.pais)}</span>`:'';}).join('');
  const final=f.fase==='Final';
  abrir(htmlFichaSerie(f,timeVisualSelecao(f.a),timeVisualSelecao(f.b),{cor:'#e2b45a',classe:'sr-selecao'+(final?' sr-final-copa':''),
    cab:`${final&&ASSETS.copa('trofeu')?`<img class="sr-taca" src="${ASSETS.copa('trofeu')}" alt="">`:''}Valorant World Cup · ${esc(f.nome||'Amistoso')}${f.fase?' · '+esc(f.fase):''} · MD${f.bo}`,
    doMvp:lado,rodape:tec?`<div class="sr-tecnicos dim">${tec}</div>`:''}),true);
  _ligarFichaSerie();
}

/* ---------- a faixa da Copa na Central ----------
   Aparece quando o evento está perto ou acontecendo: do Champions até a
   virada nos anos de eliminatórias e de Copa, e nas primeiras semanas
   depois de uma final. */
function cardCopaCentral(){
  if(typeof garantirCopa!=='function'||!G||G.ano<COPA_PRIMEIRA-1)return '';
  const sem=G.semana||1;
  const x=_ctxCopa();
  const perto=sem>=44||(x.ultima&&sem<=6);
  if(!perto)return '';
  const cic=x.ultima&&sem<=6?x.ultima:x.cic;
  const s=cic?{nome:cic.nomeSede,pais:cic.sede,ano:cic.ano,edicao:cic.edicao}:Object.assign({},x.s,{ano:x.ano});
  const logo=ASSETS.copa('sede-'+ASSETS.slug(s.nome))||ASSETS.copa('logo');
  const ed=cic&&cic.copa&&cic.copa.fim?edicoesDaCopa().find(e=>e.ano===cic.ano):null;
  const meu=typeof meuJogador==='function'&&meuJogador();
  const minha=meu&&infoSelecao(meu.pais)?meu.pais:null;
  const sit=minha?_situacao(x,minha):null;
  const cv=minha&&cic&&cic.copa&&cic.copa.convocados&&cic.copa.convocados[minha];
  const chamado=cv&&cv.titulares.concat(cv.reservas).includes(meu.id);
  const texto=ed?`${esc(_nomeSel(ed.campeao))} é a campeã do mundo`:esc(_textoFase(x));
  return `<section class="cpx-faixa" style="${cic?fundoDaSede(cic,.84):''}">
    ${logo?`<img class="cpx-faixa-logo" src="${logo}" alt="">`:''}
    <div class="cpx-faixa-txt"><div class="cpx-eyebrow">Valorant World Cup · ${esc(s.nome)} ${s.ano}</div>
      <b>${texto}</b>
      ${minha?`<span>${escudoSelecao(minha,20)} ${esc(_nomeSel(minha))}: ${esc(sit[1])}${chamado?' · <em>você foi convocado</em>':''}</span>`:''}</div>
    ${ed?`<div class="cpx-faixa-c">${escudoSelecao(ed.campeao,54)}</div>`:''}
    <button class="btn cpx-faixa-btn" data-ir="copa">Abrir a World Cup ›</button>
  </section>`;
}
function ligarCopa(v,on){
  on('[data-cpaba]',el=>{copaAba=el.dataset.cpaba;render();window.scrollTo(0,0);});
  on('[data-copapais]',el=>{copaVer=el.dataset.copapais;if(el.dataset.cpaba){copaAba=el.dataset.cpaba;window.scrollTo(0,0);}render();});
  const tr=document.querySelector('[data-cptroca]');if(tr)tr.onchange=()=>{copaVer=tr.value;render();};
  const adv=document.querySelector('#cpAdv');if(adv)adv.onchange=()=>{copaAdv=adv.value;render();};
  on('[data-cpamistoso]',el=>{
    const sel=document.querySelector('#cpAdv'), minha=copaSelAtual;
    if(!sel||!minha)return;
    copaAdv=sel.value;
    const f=amistosoSelecoes(minha,sel.value,+el.dataset.cpamistoso);
    render();modalSerieSelecao(f);
  });
  on('[data-cpjogo]',el=>_abrirJogo(el.dataset.cpjogo));
  on('[data-cpfinal]',el=>{const e=edicoesDaCopa().find(x=>x.ano===+el.dataset.cpfinal);if(e)modalSerieSelecao(e.final);});
  on('[data-cpficha]',el=>{const c=garantirCopa();modalSerieSelecao((c.amistosos||[])[+el.dataset.cpficha]);});
  on('[data-cpmomento]',el=>{const [t,a]=el.dataset.cpmomento.split('|');reverMomentoCopa(t,+a);});
}
