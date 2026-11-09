/* ============================================================
   CIRCUITO › COMPETIÇÕES — hub da temporada, página de torneio
   e ficha da série
   ------------------------------------------------------------
   Um torneio aqui é o EVENTO (torneioId), não a fase: grupos e
   playoffs do Stage 1 são uma página só, com as fases dentro.
   Torneio que ainda não começou vem do calendário (o bloco ainda
   não foi montado), para a linha do tempo mostrar o ano inteiro.
   ============================================================ */
let compFiltro='todos', compSel=null, compSelAba='chave';

/* torneios que cada bloco do calendário abre, antes de ser montado */
function torneiosDoBloco(b){
  const R=REGIONS.map(r=>r.id);
  switch(b.montar){
    case 'kickGrupos':case 'kickPO':return R.map(r=>'kickoff_'+r);
    case 'm1Suico':case 'm1PO':return['masters1'];
    case 'm2Suico':case 'm2PO':return['masters2'];
    case 'stage1':case 'po1':return[...R.map(r=>'stage1_'+r),...R.map(r=>'split1_'+r)];
    case 'stage2':case 'po2':return[...R.map(r=>'stage2_'+r),...R.map(r=>'split2_'+r)];
    case 'chGrupos':case 'chPO':return['champions'];
    case 'ascension':return R.map(r=>'asc_'+r);
    default:return[];
  }
}
/* Os eventos da temporada, montados ou não, na ordem do calendário. */
function eventosDoAno(){
  const ev={},ordem=[];
  const sem=G.semana||1;
  (G.calendario||[]).forEach(b=>{
    for(const id of torneiosDoBloco(b)){
      if(!ev[id]){ev[id]={id,tor:torneio(id),stages:[],blocos:[],ini:b.ini,fim:b.fim};ordem.push(id);}
      const e=ev[id];e.blocos.push(b);e.ini=Math.min(e.ini,b.ini);e.fim=Math.max(e.fim,b.fim);
    }
    for(const s of b.stages||[]){
      const id=s.torneioId;if(!id)continue;
      if(!ev[id]){ev[id]={id,tor:torneio(id),stages:[],blocos:[b],ini:b.ini,fim:b.fim};ordem.push(id);}
      if(!ev[id].stages.includes(s))ev[id].stages.push(s);
    }
  });
  return ordem.map(id=>{
    const e=ev[id],t=e.tor||{};
    e.regiao=t.escopo||(e.stages[0]&&e.stages[0].regiao)||'INT';
    e.tier=t.tier||(e.stages[0]&&e.stages[0].tier)||1;
    const final=e.stages.filter(s=>s.tipo==='de'||s.tipo==='ko').slice(-1)[0]||e.stages.slice(-1)[0]||null;
    e.final=final;
    const acabou=!!(final&&final.feito&&(final.tipo==='de'||final.tipo==='ko'||e.id.startsWith('asc_')));
    e.status=acabou?'encerrado':e.stages.length||sem>=e.ini?'andamento':'futuro';
    e.campeao=acabou&&final.ranking&&final.ranking[0]||null;
    e.times=new Set(e.stages.flatMap(s=>s.times||[]));
    e.nome=nomeDoAno(id)||(t.nome||id);
    return e;
  });
}
function eventoDoMeuClube(e){
  const eu=G.meuTime;
  if(e.times.has(eu))return true;
  const t=meu();
  return e.status==='futuro'&&(e.regiao===t.regiao&&e.tier===t.tier);
}
/* cor do circuito (V1): é ela que pinta a barra, o cartão e a capa */
function corDoEvento(e){
  const id=String(e.id||'');
  if(id==='champions')return 'var(--c-champions)';
  if(id.startsWith('masters'))return 'var(--c-masters)';
  if(id.startsWith('asc'))return 'var(--c-ascension)';
  if(e.tier===2||id.startsWith('split'))return 'var(--c-challengers)';
  if(id.startsWith('kickoff'))return 'var(--c-kickoff)';
  return 'var(--c-stage)';
}

/* ---------- hub ---------- */
function linhaDoTempo(evs){
  const sem=G.semana||1,W=SEMANAS_ANO;
  const pos=s=>((s-1)/W*100).toFixed(2)+'%';
  const meses=MESES_CURTO.map((m,i)=>{
    const s=Math.max(1,Math.round(i*W/12)+1);
    return `<span class="lt-mes" style="left:${pos(s)}">${m}</span>`;}).join('');
  /* uma faixa por tipo: internacional, Tier 1 regional, Challengers — os blocos
     de uma faixa não se sobrepõem, e assim os quatro regionais viram uma barra */
  const faixas=[['INT','Internacional',e=>e.regiao==='INT'],['T1','VCT',e=>e.regiao!=='INT'&&e.tier===1],['T2','Challengers',e=>e.regiao!=='INT'&&e.tier===2]];
  const linhas=faixas.map(([k,rot,f])=>{
    const doTipo=evs.filter(f);
    const porBloco=new Map();
    for(const e of doTipo){const k2=e.ini+'-'+e.fim+'-'+(e.regiao==='INT'?e.id:String(e.tor&&e.tor.curto||e.id));
      if(!porBloco.has(k2))porBloco.set(k2,[]);porBloco.get(k2).push(e);}
    const barras=[...porBloco.values()].map(l=>{
      const e=l[0],larg=((e.fim-e.ini+1)/W*100).toFixed(2)+'%';
      const meu=l.find(eventoDoMeuClube);
      const alvo=meu||l[0];
      const camp=e.regiao==='INT'&&e.campeao?G.times[e.campeao]:null;
      const sd=e.regiao==='INT'&&typeof sedeDe==='function'?sedeDe(e.id):null;
      const rot=e.regiao==='INT'?(sd?sd.nome:e.nome):(e.tor&&e.tor.curto)||e.nome;
      return `<button class="lt-bar ${e.status} ${meu?'meu':''}" style="left:${pos(e.ini)};width:${larg};--cor:${corDoEvento(e)}"
          data-evento="${esc(alvo.id)}" title="${esc(rot)} · ${rotuloPeriodo(G.ano,e.ini,e.fim)}">
        <span>${esc(rot)}</span>${camp?`<i class="lt-camp">${escudo(camp,18)}</i>`:''}</button>`;}).join('');
    return `<div class="lt-faixa"><div class="lt-rot">${rot}</div><div class="lt-trilho">${barras}</div></div>`;
  }).join('');
  return `<div class="card lt"><div class="split"><div class="eyebrow">Temporada ${G.ano}</div>
      <span class="dim">${rotuloSemana(G.ano,sem)}</span></div>
    <div class="lt-corpo"><div class="lt-meses">${meses}</div>${linhas}
      <div class="lt-agora" style="left:calc(110px + (100% - 110px) * ${((sem-0.5)/W).toFixed(4)})"></div></div></div>`;
}
function cartaoEvento(e){
  const camp=e.campeao?G.times[e.campeao]:null;
  const sede=typeof sedeDe==='function'?sedeDe(e.id):null;
  const meuJoga=e.times.has(G.meuTime);
  const est=e.status==='encerrado'?'Encerrado':e.status==='andamento'?'Em disputa':'Em '+Math.max(0,e.ini-(G.semana||1))+' sem.';
  return `<button class="ev-card ${e.status} ${meuJoga?'meu':''}" data-evento="${esc(e.id)}"
      style="--cor:${corDoEvento(e)};${sede?fundoCidade(sede.slug,0.62):''}">
    <div class="ev-topo">${e.tor?arteTorneio(e.tor,30):''}<div><b>${esc(e.nome)}</b>
      <span class="dim">${rotuloPeriodo(G.ano,e.ini,e.fim)}${sede?' · '+esc(sede.nome):''}</span></div></div>
    <div class="ev-pe"><span class="chip ${e.status==='andamento'?'t':''}">${esc(est)}</span>
      ${meuJoga?'<span class="chip r">seu clube</span>':''}
      ${camp?`<span class="ev-camp">${imgTrofeu(arquivoTrofeu(e.id),16,'Troféu')} ${escudo(camp,18)} <b>${esc(camp.tag)}</b></span>`:''}</div>
  </button>`;
}
function corridaAoChampions(){
  const t=meu();
  return REGIONS.map(R=>{
    const rk=G.regioes[R.id].t1.slice().sort((x,y)=>(G.regioes[R.id].pontos[y]||0)-(G.regioes[R.id].pontos[x]||0));
    return `<div class="card flat"><div class="eyebrow">${R.nome}</div><table class="tb"><thead><tr><th>#</th><th>Equipe</th><th class="r">Pontos</th><th class="c">Forma</th></tr></thead>
    <tbody>${rk.map((id,i)=>{const z=i<4?'q':i===rk.length-1?'cai':'';
      return `<tr class="${id===t.id?'me':''} ${z?'z-'+z:''}"><td>${selo(i+1,z)}</td><td>${celClube(id,22)}</td>
    <td class="r num"><b>${G.regioes[R.id].pontos[id]||0}</b></td><td class="c">${formaRecente(id,5)}</td></tr>`;}).join('')}</tbody></table></div>`;
  }).join('')+legendaZonas([['q','Vaga no Champions'],['cai','Rebaixamento: o último cai para o Challengers']]);
}
function vComp(){
  if(compSel)return paginaTorneio(compSel);
  const t=meu();
  const evs=eventosDoAno();
  const filtros=[['todos','Todos'],['meu','Onde meu clube está'],['INT','Internacional'],
    ...REGIONS.map(r=>[r.id,r.nome.replace('VCT ','')]),['pts','Corrida ao Champions']];
  const passa=e=>compFiltro==='todos'||compFiltro==='meu'&&eventoDoMeuClube(e)
    ||compFiltro==='INT'&&e.regiao==='INT'||e.regiao===compFiltro;
  const vis=evs.filter(passa);
  const grupo=(st,rot)=>{const l=vis.filter(e=>e.status===st);
    if(st==='encerrado')l.reverse();
    return l.length?`<div class="eyebrow" style="margin-top:14px">${rot} · ${l.length}</div><div class="ev-grid">${l.map(cartaoEvento).join('')}</div>`:'';};
  const corpo=compFiltro==='pts'?corridaAoChampions()
    :(grupo('andamento','Em disputa')+grupo('futuro','A seguir')+grupo('encerrado','Encerrados'))
     ||'<div class="empty">Nenhum torneio com esse filtro nesta temporada.</div>';
  return `<div class="eyebrow">Circuito ${G.ano}</div><h2 class="sec">Competições</h2>
  ${linhaDoTempo(evs)}
  <div class="tabs">${filtros.map(([k,n])=>`<button data-cfiltro="${k}" class="${compFiltro===k?'on':''}">${n}</button>`).join('')}</div>
  ${corpo}`;
}

/* ---------- página do torneio ---------- */
function statsDoEvento(e){
  const tot={};
  for(const s of e.stages)for(const id in s.stats||{}){
    const x=s.stats[id],o=tot[id]||(tot[id]={maps:0,k:0,d:0,a:0,acs:0,fk:0,cl:0,mvp:0,timeId:x.timeId});
    o.maps+=x.maps;o.k+=x.k;o.d+=x.d;o.a+=x.a;o.acs+=x.acs;o.fk+=x.fk;o.cl+=x.cl;o.mvp+=x.mvp;
  }
  return tot;
}
function paginaTorneio(id){
  const e=eventosDoAno().find(x=>x.id===id);
  if(!e){compSel=null;return vComp();}
  const t=meu();
  const sede=typeof sedeDe==='function'?sedeDe(e.id):null;
  const camp=e.campeao?G.times[e.campeao]:null;
  const premios=e.final?premiosDoStage(e.final):[];
  const total=premios.reduce((s,v)=>s+v,0);
  const fases=e.stages.map(s=>s.rotulo||nomeStage(s)).join(' → ')||'começa em '+rotuloPeriodo(G.ano,e.ini,e.fim);
  const capa=`<div class="tp-capa" style="--cor:${corDoEvento(e)};${sede?fundoCidade(sede.slug,0.42):''}">
    <div class="tp-id">${e.tor?arteTorneio(e.tor,64):''}<div>
      <div class="eyebrow">${e.regiao==='INT'?'Internacional':esc(nomeLiga({regiao:e.regiao,tier:e.tier})||e.regiao)}</div>
      <div class="tp-nome">${esc(e.nome)}</div>
      <div class="dim">${sede?bandeira(sede.pais)+' '+esc(sede.nome)+' · ':''}${rotuloPeriodo(G.ano,e.ini,e.fim)}</div></div></div>
    <div class="tp-trofeu ${camp?'ganho':''}">${imgTrofeu(arquivoTrofeu(e.id),camp?64:54,'Troféu de '+e.nome)}
      <div>${camp?`<div class="eyebrow">Campeão</div>${timeInline(camp.id,26)}`
        :`<div class="eyebrow">${e.status==='andamento'?'Em disputa':e.status==='encerrado'?'Encerrado':'A seguir'}</div>
          <div class="dim">${e.status==='andamento'?'o troféu ainda não tem dono':rotuloPeriodo(G.ano,e.ini,e.fim)}</div>`}</div></div>
  </div>
  <div class="tn-info" style="margin:10px 0 4px">
    <span>${esc(fases)}</span>
    ${total?`<span class="gold">${money(total)} em prêmios · ${money(premios[0])} ao campeão</span>`:''}
    <span>${e.times.size?e.times.size+' equipes':'equipes a definir'}</span>
    ${e.times.has(t.id)?'<span class="chip r">seu clube joga</span>':''}
  </div>`;
  const abas=[['chave','Chave e tabela'],['jogos','Jogos'],['stats','Estatísticas'],['premios','Premiação']];
  let corpo='';
  if(!e.stages.length)corpo=`<div class="empty">O torneio ainda não começou. Começa em ${rotuloPeriodo(G.ano,e.ini,e.fim)}.</div>`;
  else if(compSelAba==='jogos')corpo=jogosDoEvento(e);
  else if(compSelAba==='stats')corpo=estatisticasDoEvento(e);
  else if(compSelAba==='premios')corpo=premiacaoDoEvento(e,premios);
  else corpo=e.stages.slice().reverse().map(s=>renderStage(s,true)).join('');
  return `<button class="btn ghost sm" id="compVoltar">‹ Todas as competições</button>
  ${capa}
  <div class="tabs">${abas.map(([k,n])=>`<button data-csaba="${k}" class="${compSelAba===k?'on':''}">${n}</button>`).join('')}</div>
  ${corpo}`;
}
/* Jogos em cartões de partida: escudos grandes, placar em destaque e os
   mapas em miniatura com o placar de cada um. */
function cartaoPartida(s,r,t){
  const A=G.times[r.a],B=G.times[r.b],vA=r.v===r.a;
  const mapas=((r.det&&r.det.mp)||[]).map(mp=>`<span class="pt-mapa" style="${fundoMapa(mp.m,0.5)}">
      <b>${esc(mp.m)}</b><span><i class="${mp.a>mp.b?'w':''}">${mp.a}</i>–<i class="${mp.b>mp.a?'w':''}">${mp.b}</i></span></span>`).join('')
    ||(r.mapa?`<span class="dim">${esc(r.mapa)}</span>`:'');
  const meu=t&&(r.a===t.id||r.b===t.id);
  return `<button class="partida ${meu?'me':''}" data-serie="${esc(s.id)}|${r.n!=null?r.n:''}" ${r.n==null?'disabled':''}>
    <div class="pt-lados">
      <div class="pt-time ${vA?'w':'l'}">${escudo(A,40)}<b>${esc(A?A.tag:'—')}</b><span>${esc(A?A.nome:'')}</span></div>
      <div class="pt-placar"><span class="${vA?'w':''}">${r.wa}</span><i>:</i><span class="${vA?'':'w'}">${r.wb}</span></div>
      <div class="pt-time ${vA?'l':'w'}">${escudo(B,40)}<b>${esc(B?B.tag:'—')}</b><span>${esc(B?B.nome:'')}</span></div>
    </div>
    <div class="pt-mapas">${mapas}</div>
  </button>`;
}
function jogosDoEvento(e){
  const t=meu();
  return e.stages.slice().reverse().map(s=>{
    const rs=(s.resultados||[]).slice();
    if(!rs.length)return '';
    const porRodada=new Map();
    for(const r of rs){const k=r.rd||'';if(!porRodada.has(k))porRodada.set(k,[]);porRodada.get(k).push(r);}
    return `<div class="card flat"><div class="eyebrow">${esc(nomeStage(s))} · ${rs.length} série${rs.length===1?'':'s'}</div>
      ${[...porRodada].reverse().map(([rd,l])=>`<div class="jg-rod">${rd?`<div class="jg-rod-t">${esc(rd)}${l[0]&&l[0].sem?' · '+esc(rotuloSemana(G.ano,l[0].sem)):''}</div>`:''}
        <div class="partidas">${l.map(r=>cartaoPartida(s,r,t)).join('')}</div></div>`).join('')}
    </div>`;}).join('')||'<div class="empty">Nenhum jogo disputado ainda.</div>';
}
function estatisticasDoEvento(e){
  const st=statsDoEvento(e);
  const lista=Object.entries(st).filter(([id,x])=>x.maps>=Math.min(3,Math.max(1,...Object.values(st).map(y=>y.maps)))&&G.jogadores[id]);
  /* os três primeiros em mini pódio com foto; o resto em lista */
  const tab=(rot,f,fmt)=>{
    const top=lista.slice().sort((a,b)=>f(b[1])-f(a[1])).slice(0,8);
    const pod=top.slice(0,3).map(([id,x],i)=>{const p=G.jogadores[id],tm=G.times[x.timeId||p.timeId];
      return `<div class="st-pod p${i+1} jrow" data-p="${id}">${retrato(p,i===0?64:52)}
        <span class="pos ${i===0?'top':''}">${i+1}</span><b>${esc(p.nome)}</b>
        <span class="dim">${tm?escudo(tm,14)+' '+esc(tm.tag):''}</span><span class="st-v num">${fmt(x)}</span></div>`;});
    const ordemPod=pod.length===3?[pod[1],pod[0],pod[2]]:pod;
    return `<div class="card flat"><div class="eyebrow">${rot}</div>
      ${top.length?`<div class="st-podio">${ordemPod.join('')}</div>`:''}
      <table class="tb"><tbody>${top.slice(3).map(([id,x],i)=>{const p=G.jogadores[id];
      return `<tr class="jrow ${p.timeId===G.meuTime?'me':''}" data-p="${id}"><td>${selo(i+4)}</td>
        <td><span class="linha-t">${retrato(p,22)}<b>${esc(p.nome)}</b></span> <span class="dim">${esc(tagT(x.timeId||p.timeId))}</span></td>
        <td class="r num"><b>${fmt(x)}</b></td></tr>`;}).join('')||(top.length?'':'<tr><td class="dim">Sem dados ainda.</td></tr>')}</tbody></table></div>`;};
  const mapas={};
  for(const s of e.stages)for(const r of s.resultados||[])for(const mp of (r.det&&r.det.mp)||[])mapas[mp.m]=(mapas[mp.m]||0)+1;
  const mapasOrd=Object.entries(mapas).sort((a,b)=>b[1]-a[1]);
  return `${e.final?rodapeMVP(e.final):''}
  <div class="grid g2">
    ${tab('ACS médio',x=>x.acs/Math.max(1,x.maps),x=>Math.round(x.acs/Math.max(1,x.maps)))}
    ${tab('K/D',x=>x.k/Math.max(1,x.d),x=>(x.k/Math.max(1,x.d)).toFixed(2))}
    ${tab('First kills',x=>x.fk,x=>x.fk)}
    ${tab('Clutches',x=>x.cl,x=>x.cl)}
  </div>
  ${mapasOrd.length?`<div class="card flat"><div class="eyebrow">Mapas mais jogados</div><div class="mp-uso">${mapasOrd.map(([m,n])=>
    `<div class="mp-uso-i" style="${fundoMapa(m,0.55)}"><b>${esc(m)}</b><span>${n} mapa${n===1?'':'s'}</span></div>`).join('')}</div></div>`:''}`;
}
function premiacaoDoEvento(e,premios){
  const t=meu();
  const f=e.final;
  if(!f||!premios.length)return '<div class="empty">Este torneio não paga premiação: é fase classificatória.</div>';
  const rk=f.feito&&f.ranking&&f.ranking.length?f.ranking:null;
  return `<div class="card flat"><div class="eyebrow">Premiação · ${money(premios.reduce((s,v)=>s+v,0))} no total</div>
    <table class="wide tb"><thead><tr><th>Colocação</th><th>Equipe</th><th class="r">Prêmio</th></tr></thead><tbody>
    ${premios.map((v,i)=>{const id=rk&&rk[i];return `<tr class="${id===t.id?'me':''} ${i===0?'pr-1':''}">
      <td>${i===0?imgTrofeu(arquivoTrofeu(e.id),26,'Troféu')+' ':''}${selo((i+1)+'º',i===0?'top':i===1?'prata':i===2?'bronze':'')}</td>
      <td>${id?celClube(id,24):'<span class="dim">a definir</span>'}</td><td class="r num"><b>${money(v)}</b></td></tr>`;}).join('')}
    </tbody></table><p class="dim" style="margin-top:8px">Metade do prêmio vai aos jogadores, como bônus.</p></div>`;
}

/* ---------- ficha da série ---------- */
function modalSerie(chave){
  const [sid,n]=String(chave).split('|');
  const s=acharStage(sid);
  const r=s&&(s.resultados||[])[+n];
  if(!r)return;
  const A=G.times[r.a],B=G.times[r.b],d=r.det||{};
  const vA=r.v===r.a;
  const linhasDe=(stStr)=>String(stStr||'').split('|').filter(Boolean).map(x=>{
    const [id,nums]=x.split(':');const [k,de,a,acs]=nums.split(',').map(Number);return{id,k,d:de,a,acs};});
  const veto=(d.v||[]).map(([m,tp,tag])=>`<span class="chip ${tp==='b'?'r':tp==='d'?'':'g'}">${tp==='b'?'✕':tp==='d'?'★':'✓'} ${esc(m)}
    <span class="dim">${tp==='d'?'decider':esc(tag)}</span></span>`).join(' ');
  const mapas=(d.mp||[]).map((mp,i)=>{
    const ls=linhasDe(mp.st);
    const meio=Math.ceil(ls.length/2);
    const tabela=(lista,time)=>`<table class="box"><thead><tr><th>${escudo(time,16)} ${esc(time?time.tag:'—')}</th>
      <th class="r">K</th><th class="r">D</th><th class="r">A</th><th class="r">ACS</th></tr></thead><tbody>
      ${lista.sort((x,y)=>y.acs-x.acs).map(l=>{const p=G.jogadores[l.id];
        return `<tr class="${p?'jrow':''} ${l.id===d.mvp?'mvp':''}" ${p?`data-p="${l.id}"`:''}><td><span class="linha-t">${p?retrato(p,22):''}<span>${esc(p?p.nome:'—')}</span></span>${l.id===d.mvp?' <span class="chip g">MVP</span>':''}</td>
        <td class="r num">${l.k}</td><td class="r num">${l.d}</td><td class="r num">${l.a}</td><td class="r num"><b>${l.acs}</b></td></tr>`;}).join('')}</tbody></table>`;
    const ladoA=mp.l==='atk'?'atacando':mp.l==='def'?'defendendo':'';
    return `<div class="sr-mapa">
      <div class="sr-mapa-topo" style="${fundoMapa(mp.m,0.55)}">
        <span class="sr-n">Mapa ${i+1}</span><b class="sr-m">${esc(mp.m)}</b>
        <span class="sr-placar"><b class="${mp.a>mp.b?'w':''}">${mp.a}</b> – <b class="${mp.b>mp.a?'w':''}">${mp.b}</b></span>
        ${ladoA?`<span class="dim">${esc(A?A.tag:'')} começou ${ladoA}</span>`:''}</div>
      ${ls.length?`<div class="grid g2">${tabela(ls.slice(0,meio),A)}${tabela(ls.slice(meio),B)}</div>`
        :'<div class="dim" style="padding:8px 0">Linha dos jogadores guardada só nas séries de playoffs, internacionais e do seu clube.</div>'}
    </div>`;}).join('')||`<div class="dim">${esc(r.mapa||'')}</div>`;
  /* MVP da série com a carta e a soma dos mapas */
  let mvpBox='';
  const pm=d.mvp&&G.jogadores[d.mvp];
  if(pm){
    let k=0,de=0,a=0,acs=0,n=0;
    for(const mp of d.mp||[])for(const l of linhasDe(mp.st))if(l.id===d.mvp){k+=l.k;de+=l.d;a+=l.a;acs+=l.acs;n++;}
    mvpBox=`<div class="sr-mvp">${cartaJogador(pm,{w:92,clique:true})}<div>
      <div class="eyebrow gold">MVP da série</div><b class="sr-mvp-n">${esc(pm.nome)}</b>
      <div class="dim">${esc(tagT(pm.timeId))} · ${esc(pm.role)}</div>
      ${n?`<div class="sr-mvp-st"><span><b class="num">${k}/${de}/${a}</b>K/D/A</span><span><b class="num">${Math.round(acs/n)}</b>ACS</span><span><b class="num">${(k/Math.max(1,de)).toFixed(2)}</b>K/D</span></div>`:''}
    </div></div>`;
  }
  const corS=typeof corDoEvento==='function'&&s.torneioId?corDoEvento({id:s.torneioId,tier:s.tier}):'var(--red)';
  abrir(`<div class="sr" style="--cor:${corS}">
    <div class="sr-cabeca">
      <div class="eyebrow">${s.torneioId?arteTorneio(torneio(s.torneioId),18)+' ':''}${esc(nomeStage(s))}${r.rd?' · '+esc(r.rd):''}${r.sem?' · '+rotuloSemana(G.ano,r.sem):''}</div>
      <div class="sr-topo">
        <div class="sr-time ${vA?'w':'l'}">${escudo(A,72)}<div><b>${esc(A?A.nome:'—')}</b><span class="dim">${esc(A?A.tag:'')}</span></div></div>
        <div class="sr-score"><span class="${vA?'w':''}">${r.wa}</span><i>:</i><span class="${vA?'':'w'}">${r.wb}</span></div>
        <div class="sr-time r ${vA?'l':'w'}"><div><b>${esc(B?B.nome:'—')}</b><span class="dim">${esc(B?B.tag:'')}</span></div>${escudo(B,72)}</div>
      </div>
    </div>
    ${mvpBox}
    ${veto?`<div class="sr-veto"><span class="eyebrow">Veto</span> ${veto}</div>`:''}
    ${mapas}
    <div class="split" style="margin-top:12px"><span></span><button class="btn ghost" id="srFechar">Fechar</button></div>
  </div>`,true);
  const f=document.querySelector('#srFechar');if(f)f.onclick=()=>fechar();
  document.querySelectorAll('#modal .jrow').forEach(x=>x.onclick=()=>modalJogador(x.dataset.p));
}

function ligarCompeticoes(v,on){
  on('[data-cfiltro]',el=>{compFiltro=el.dataset.cfiltro;render();});
  on('[data-evento]',el=>{compSel=el.dataset.evento;compSelAba='chave';if(tela!=='comp')irPara('comp');else render();window.scrollTo(0,0);});
  on('[data-csaba]',el=>{compSelAba=el.dataset.csaba;render();});
  on('#compVoltar',()=>{compSel=null;render();});
  on('[data-serie]',el=>{const k=el.dataset.serie;if(k&&!/\|$/.test(k))modalSerie(k);});
}
