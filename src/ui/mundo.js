/* ============================================================
   CIRCUITO › ESTATÍSTICAS DO MUNDO (era Líderes)
   Visão geral, líderes, títulos de 2021 até hoje, recordes e o
   ranking mundial. As contas novas moram em core/estatisticas.js.
   ============================================================ */
let mundoAba='geral', lidEscopo='temp', lidRegiao='todas', lidFuncao='todas', titFiltro='todos', rkRegiao='todas';
/* filtros em chips (pacote V9) */
function chipsFiltro(attr,atual,ops){
  return `<div class="chips-f">${ops.map(([k,n])=>`<button data-${attr}="${k}" class="${atual===k?'on':''}">${n}</button>`).join('')}</div>`;
}

function ehInternacional(ev){return /^(Champions|Masters|Valorant Champions)/.test(ev||'');}
function linhaJogadorMini(p,valor,i,extra){
  return `<tr class="jrow ${p.timeId===G.meuTime?'me':''}" data-p="${p.id}"><td class="num dim">${i+1}</td>
    <td>${retrato(p,22)} <b>${esc(p.nome)}</b> ${FLAG[p.pais]||''} <span class="dim">${p.timeId?esc(tagT(p.timeId)):'livre'}</span></td>
    ${extra||''}<td class="r num"><b>${valor}</b></td></tr>`;
}

/* ---------- visão geral ---------- */
function mundoGeral(){
  const evs=typeof eventosDoAno==='function'?eventosDoAno():[];
  const intl=evs.filter(e=>e.regiao==='INT');
  const jog=Object.values(G.jogadores).filter(p=>p.timeId&&p.temp.maps>=8);
  const nota=p=>(p.temp.acs/p.temp.maps)*Math.min(1.6,p.temp.k/Math.max(1,p.temp.d));
  const destaque=jog.slice().sort((a,b)=>nota(b)-nota(a))[0];
  const rk=rankingMundial();
  const foto=(G.eloHist||[]).length>3?G.eloHist[G.eloHist.length-4]:null;
  const subida=foto?rk.map(t=>({t,d:eloDe(t)-(foto.v[t.id]||eloDe(t))})).sort((a,b)=>b.d-a.d)[0]:null;
  const seq=Object.values(G.times).slice().sort((a,b)=>(b.seq||0)-(a.seq||0))[0];
  const cards=intl.map(e=>{const c=e.campeao?G.times[e.campeao]:null;
    return `<button class="mg-ev" data-evento="${esc(e.id)}" ${typeof sedeDe==='function'&&sedeDe(e.id)?`style="${fundoCidade(sedeDe(e.id).slug,0.55)}"`:''}>
      <div class="eyebrow">${esc(e.nome)}</div>
      ${c?`<div class="mg-camp">${imgTrofeu(arquivoTrofeu(e.id),40,'Troféu')}${escudo(c,32)}<b>${esc(c.nome)}</b></div>`
        :`<div class="dim">${e.status==='andamento'?'Em disputa':'Começa em '+rotuloPeriodo(G.ano,e.ini,e.fim)}</div>`}</button>`;}).join('');
  return `<div class="eyebrow" style="margin-top:6px">Internacionais de ${G.ano}</div>
  <div class="mg-evs">${cards}</div>
  <div class="grid g3" style="margin-top:14px">
    <div class="card mg-dest">${destaque?`<div class="eyebrow">Melhor jogador da temporada</div>
      <div style="display:flex;gap:14px;align-items:center">${typeof cartaJogador==='function'?cartaJogador(destaque,{w:110}):retrato(destaque,60)}
      <div><b class="jrow" data-p="${destaque.id}" style="cursor:pointer;font-size:18px">${esc(destaque.nome)}</b>
        <div class="dim">${esc(tagT(destaque.timeId))} · ${esc(destaque.role)}</div>
        <div class="num" style="margin-top:6px">${Math.round(destaque.temp.acs/destaque.temp.maps)} ACS · ${(destaque.temp.k/Math.max(1,destaque.temp.d)).toFixed(2)} K/D</div>
        <div class="dim">${destaque.temp.maps} mapas · ${destaque.temp.mvp} MVPs</div></div></div>`
      :'<div class="eyebrow">Melhor jogador da temporada</div><div class="empty">Poucos mapas jogados ainda.</div>'}</div>
    <div class="card"><div class="eyebrow">Clube em melhor fase</div>
      ${subida&&subida.d>0?`<div class="mg-clube">${escudo(subida.t,40)}<div><b>${esc(subida.t.nome)}</b>
        <div class="up num">+${Math.round(subida.d)} no ranking em 12 semanas</div></div></div>`:'<div class="dim">O ranking ainda está se formando.</div>'}
      ${seq&&(seq.seq||0)>=3?`<div class="mg-clube" style="margin-top:12px">${escudo(seq,40)}<div><b>${esc(seq.nome)}</b>
        <div class="num">${seq.seq} vitórias seguidas</div></div></div>`:''}</div>
    <div class="card"><div class="eyebrow">Top 5 do ranking mundial</div>
      <table><tbody>${rk.slice(0,5).map((t,i)=>`<tr class="${t.id===G.meuTime?'me':''}"><td class="num dim">${i+1}</td>
        <td>${timeInline(t.id,20)}</td><td class="r num"><b>${Math.round(eloDe(t))}</b></td></tr>`).join('')}</tbody></table>
      <button class="btn ghost sm" data-mundo="ranking" style="margin-top:8px">Ver o ranking inteiro</button></div>
  </div>`;
}

/* ---------- líderes ---------- */
function mundoLideres(){
  const car=lidEscopo==='carreira';
  const base=p=>car?p.carreira:p.temp;
  const minMaps=car?40:3;
  const jog=Object.values(G.jogadores).filter(p=>{
    const b=base(p);if(!b||(b.maps||0)<minMaps)return false;
    if(lidFuncao!=='todas'&&p.role!==lidFuncao)return false;
    if(lidRegiao!=='todas'){const t=p.timeId&&G.times[p.timeId];if(!t||t.regiao!==lidRegiao)return false;}
    return true;});
  const tabs=[['ACS médio',p=>base(p).acs/base(p).maps,v=>Math.round(v)],
    ['K/D',p=>base(p).k/Math.max(1,base(p).d),v=>v.toFixed(2)],
    ['MVPs',p=>base(p).mvp||0,v=>v],
    [car?'Mapas':'First kills',p=>car?base(p).maps:(base(p).fk||0),v=>v],
    [car?'Títulos':'Clutches',p=>car?(base(p).titulos||0):(base(p).cl||0),v=>v]];
  const regs=[['todas','Todas'],...REGIONS.map(r=>[r.id,r.nome.replace(/^VCT /,'')])];
  return `<div class="mundo-filtros">
    ${chipsFiltro('lidesc',lidEscopo,[['temp','Temporada '+G.ano],['carreira','Carreira']])}
    ${chipsFiltro('lidreg',lidRegiao,regs)}
    ${chipsFiltro('lidfun',lidFuncao,[['todas','Todas as funções'],...ROLES.map(r=>[r,r])])}
    <span class="dim">${jog.length} jogadores com ${minMaps}+ mapas</span></div>
  <div class="grid g2">${tabs.map(([rot,f,fmt])=>{
    const top=jog.slice().sort((a,b)=>f(b)-f(a)).slice(0,10);
    const p1=top[0];
    return `<div class="card flat lid-card"><div class="eyebrow">${rot}</div>
      ${p1?`<div class="lid-top jrow" data-p="${p1.id}" style="--clube:${p1.timeId?corDoClube(G.times[p1.timeId]):'#8A96A3'}">
        <span class="lid-foto">${retrato(p1,72)}</span>
        <div class="lid-q"><span class="lid-pos">1º</span><b>${esc(p1.nome)}</b> ${FLAG[p1.pais]||''}
          <div class="dim">${p1.timeId?escudo(G.times[p1.timeId],16)+' '+esc(tagT(p1.timeId)):'livre'} · ${esc(p1.role)}</div></div>
        <b class="lid-v num">${fmt(f(p1))}</b></div>`:''}
      <table><tbody>${top.slice(1).map((p,i)=>linhaJogadorMini(p,fmt(f(p)),i+1)).join('')||(p1?'':'<tr><td class="dim">Sem dados.</td></tr>')}</tbody></table></div>`;}).join('')}</div>`;
}

/* ---------- títulos ---------- */
function mundoTitulos(){
  const h=(G.historico||[]).filter(x=>x&&x.evento);
  const filtra=x=>titFiltro==='todos'||titFiltro==='INT'&&ehInternacional(x.evento)
    ||titFiltro!=='INT'&&!ehInternacional(x.evento)&&(REGIONS.find(r=>r.id===titFiltro)||{}).nome
      &&(x.evento.includes(REGIONS.find(r=>r.id===titFiltro).nome)||x.evento.includes(REGIONS.find(r=>r.id===titFiltro).nome.replace('VCT ',''))
         ||x.evento.includes(REGIONS.find(r=>r.id===titFiltro).t2));
  const anos=[...new Set(h.map(x=>x.ano))].sort((a,b)=>b-a);
  const filtros=[['todos','Todos'],['INT','Internacionais'],...REGIONS.map(r=>[r.id,r.nome.replace('VCT ','')])];
  return `<div class="mundo-filtros">${chipsFiltro('titf',titFiltro,filtros)}</div>
  <p class="dim">Do primeiro Masters de 2021 até hoje: a pré-história real e a sua carreira na mesma galeria.
  Títulos da temporada em curso abrem a página do torneio.</p>
  ${anos.map(a=>{const l=h.filter(x=>x.ano===a&&filtra(x));if(!l.length)return '';
    return `<div class="tit-ano" style="--ano:hsl(${(a*47)%360} 70% 62%)"><div class="tit-ano-n"><span>${a}</span>${a<2027?' <i>real</i>':''}<u></u></div>
      <div class="tit-galeria">${l.map(x=>{const c=(x.timeId&&G.times[x.timeId])||(typeof acharClubePorNome==='function'?acharClubePorNome(x.campeao):null);
        const v=x.vice&&typeof acharClubePorNome==='function'?acharClubePorNome(x.vice):null;
        const ev=x.ano===G.ano&&x.torneioId?` data-evento="${esc(x.torneioId)}"`:'';
        return `<div class="tit-pec ${c&&c.id===G.meuTime?'meu':''} ${ev?'abre':''} ${ehInternacional(x.evento)?'intl':''}"${ev}>
          <div class="tit-trof">${imgTrofeu(trofeuDoTitulo(x.ano,x.evento),48,x.evento)}</div>
          <div class="tit-ped">${c?escudo(c,26):''}<b>${esc(x.campeao)}</b></div>
          <div class="tit-ev">${esc(x.evento)}</div>
          ${x.vice?`<div class="tit-vice">vice ${v?escudo(v,14)+' ':''}${esc(x.vice)}</div>`:''}</div>`;}).join('')}</div></div>`;}).join('')}`;
}

/* ---------- recordes ---------- */
function mundoRecordes(){
  const ts=Object.values(G.times);
  const conta=(t,re)=>(t.titulos||[]).filter(x=>re.test(x)).length;
  const topT=(f,n)=>ts.map(t=>({t,v:f(t)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,n||5);
  const vivos=Object.values(G.jogadores);
  const lendas=G.lendas||[];
  const titJog=[...vivos.map(p=>({nome:p.nome,v:p.carreira.titulos||0,p})),...lendas.map(l=>({nome:l.nome,v:l.carreira.titulos||0,lenda:true}))]
    .sort((a,b)=>b.v-a.v).slice(0,5);
  const carreira=[...vivos.map(p=>({nome:p.nome,v:p.carreira.maps||0,p})),...lendas.map(l=>({nome:l.nome,v:l.carreira.maps||0,lenda:true}))]
    .sort((a,b)=>b.v-a.v).slice(0,5);
  const r=recordes();
  const vivoPorNome=n=>vivos.find(p=>p.nome===n)||null;
  const imgT=(x,px)=>escudo(x.t,px||30),imgJ=(x,px)=>x.p?retrato(x.p,px||30):`<span class="rec-hall">${icone('coluna')}</span>`;
  /* o primeiro de cada lista ganha a imagem grande; o resto segue em linhas */
  const bloco=(rot,lista,img,nome)=>{
    if(!lista.length)return `<div class="card flat"><div class="eyebrow">${rot}</div><div class="dim">—</div></div>`;
    const x1=lista[0];
    return `<div class="card flat rec-card"><div class="eyebrow">${rot}</div>
      <div class="rec-top ${x1.t&&x1.t.id===G.meuTime?'me':''}"><span class="rec-img">${img(x1,56)}</span>
        <div>${nome(x1)}</div><b class="num">${x1.v}</b></div>
      <table><tbody>${lista.slice(1).map((x,i)=>`<tr class="${x.t&&x.t.id===G.meuTime?'me':''}"><td class="num dim">${i+2}</td><td>${nome(x)}</td><td class="r num"><b>${x.v}</b></td></tr>`).join('')}</tbody></table></div>`;
  };
  const nT=x=>timeInline(x.t.id,18),nJ=x=>`<b>${esc(x.nome)}</b>${x.lenda?' <span class="chip">Hall da Fama</span>':''}`;
  const pOver=r.over&&vivoPorNome(r.over.nome),pTr=r.transferencia&&vivoPorNome(r.transferencia.nome);
  return `<div class="grid g3">
    <div class="kpi gold rec-kpi">${pOver?retrato(pOver,52):''}<div><div class="lb">Maior over já registrado</div><div class="vl">${r.over?r.over.v:'—'}</div>
      <div class="sb">${r.over?esc(r.over.nome)+' · '+esc(r.over.time)+' · '+r.over.ano:'conferido a cada virada de temporada'}</div></div></div>
    <div class="kpi rec-kpi">${pTr?retrato(pTr,52):''}<div><div class="lb">Maior transferência</div><div class="vl">${r.transferencia?money(r.transferencia.v):'—'}</div>
      <div class="sb">${r.transferencia?esc(r.transferencia.nome)+' · '+esc(r.transferencia.de)+' → '+esc(r.transferencia.para)+' · '+r.transferencia.ano:'nenhuma ainda nesta carreira'}</div></div></div>
    <div class="kpi rec-kpi"><span class="rec-hall g">${icone('coluna')}</span><div><div class="lb">Hall da Fama</div><div class="vl">${lendas.length}</div><div class="sb">lendas aposentadas</div></div></div>
  </div>
  <div class="grid g3" style="margin-top:12px">
    ${bloco('Mais títulos por clube',topT(t=>(t.titulos||[]).length),imgT,nT)}
    ${bloco('Mais títulos de Champions',topT(t=>conta(t,/Champions/)),imgT,nT)}
    ${bloco('Mais títulos de Masters',topT(t=>conta(t,/Masters/)),imgT,nT)}
    ${bloco('Mais títulos por jogador',titJog.filter(x=>x.v>0),imgJ,nJ)}
    ${bloco('Carreira mais longa (mapas)',carreira.filter(x=>x.v>0),imgJ,nJ)}
    ${bloco('Mais vices',topT(t=>t.vices||0),imgT,nT)}
  </div>`;
}

/* ---------- ranking mundial ---------- */
function sparkElo(id,w,h){
  const vals=(G.eloHist||[]).map(f=>f.v[id]).filter(v=>typeof v==='number');
  if(vals.length<2)return '';
  w=w||140;h=h||30;
  const min=Math.min(...vals),max=Math.max(...vals,min+1);
  const pts=vals.map((v,i)=>[(i/(vals.length-1)*(w-2)+1),(h-2-(v-min)/(max-min)*(h-5))]);
  const d=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  const cor=vals[vals.length-1]>=vals[0]?'var(--teal)':'var(--red)';
  const ult=pts[pts.length-1];
  return `<svg class="spk" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <path d="${d} L${ult[0].toFixed(1)} ${h} L1 ${h} Z" fill="${cor}" opacity=".12"/>
    <path d="${d}" fill="none" stroke="${cor}" stroke-width="1.6"/><circle cx="${ult[0].toFixed(1)}" cy="${ult[1].toFixed(1)}" r="2.4" fill="${cor}"/></svg>`;
}
function mundoRanking(){
  const todos=rankingMundial();
  const foto=(G.eloHist||[])[0]||null;
  const posMundo=new Map(todos.map((t,i)=>[t.id,i+1]));
  const rk=rkRegiao==='todas'?todos:todos.filter(t=>t.regiao===rkRegiao);
  const varDe=t=>{const pa=posicaoNaFoto(foto,t.id);return pa?pa-posMundo.get(t.id):0;};
  const setaVar=dv=>dv>0?`<span class="up">▲ ${dv}</span>`:dv<0?`<span class="dn">▼ ${-dv}</span>`:'<span class="dim">—</span>';
  const deg=(t,k)=>{if(!t)return '<div class="rk-deg vazio"></div>';
    const cor=corDoClube(t);
    return `<div class="rk-deg d${k} ${t.id===G.meuTime?'me':''}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
      <div class="rk-esc">${escudo(t,k===1?96:72)}</div>
      <b class="rk-nome">${linkClube(t)}</b>
      <div class="rk-sub"><span class="chip reg-${t.regiao}">${esc(nomeLiga(t).replace(/^VCT /,''))}</span> ${setaVar(varDe(t))}</div>
      <div class="rk-rt num">${Math.round(eloDe(t))}</div>
      ${sparkElo(t.id,120,26)}
      <div class="rk-bloco"><span>${posMundo.get(t.id)}</span></div></div>`;};
  const regs=[['todas','Mundo'],...REGIONS.map(r=>[r.id,r.nome.replace(/^VCT /,'')])];
  return `${explica(`Rating por resultado de série: vencer quem está acima vale mais, internacional pesa 1,5× e
  atropelo mexe mais que série apertada. A coluna de variação compara com a foto mais antiga dos últimos doze meses.`,'Como o ranking é calculado')}
  <div class="mundo-filtros">${chipsFiltro('rkreg',rkRegiao,regs)}<span class="dim">${rk.length} clubes</span></div>
  <div class="rk-podio">${deg(rk[1],2)}${deg(rk[0],1)}${deg(rk[2],3)}</div>
  <div class="card flat"><table class="wide tb ordenavel"><thead><tr><th>#</th><th>Clube</th><th>Liga</th><th class="r">Rating</th>
    <th class="c">Variação</th><th class="c sem-ord">Forma</th><th class="sem-ord">12 meses</th></tr></thead><tbody>
  ${rk.slice(3).map(t=>{const i=posMundo.get(t.id),dv=varDe(t);
    return `<tr class="${t.id===G.meuTime?'me':''}"><td data-v="${i}">${selo(i,i<=3?'top':'')}</td><td>${celClube(t.id,24)}</td>
      <td><span class="chip reg-${t.regiao}">${esc(nomeLiga(t).replace(/^VCT /,''))}</span></td><td class="r num"><b>${Math.round(eloDe(t))}</b></td>
      <td class="c num" data-v="${dv}">${setaVar(dv)}</td><td class="c">${formaRecente(t.id,5)}</td><td>${sparkElo(t.id)}</td></tr>`;}).join('')}
  </tbody></table></div>`;
}

function vMundo(){
  const abas=[['geral','Visão geral'],['lideres','Líderes'],['titulos','Títulos'],['recordes','Recordes'],['ranking','Ranking mundial']];
  const corpo=mundoAba==='lideres'?mundoLideres():mundoAba==='titulos'?mundoTitulos()
    :mundoAba==='recordes'?mundoRecordes():mundoAba==='ranking'?mundoRanking():mundoGeral();
  return `<div class="eyebrow">Circuito</div><h2 class="sec">Estatísticas do mundo</h2>
  <div class="tabs">${abas.map(([k,n])=>`<button data-mundo="${k}" class="${mundoAba===k?'on':''}">${n}</button>`).join('')}</div>
  ${corpo}`;
}
function ligarMundo(v,on){
  on('[data-mundo]',el=>{mundoAba=el.dataset.mundo;render();});
  on('[data-irmundo]',el=>{mundoAba=el.dataset.irmundo;irPara('stats');});
  on('[data-titf]',el=>{titFiltro=el.dataset.titf;render();});
  on('[data-rkreg]',el=>{rkRegiao=el.dataset.rkreg;render();});
  on('[data-lidesc]',el=>{lidEscopo=el.dataset.lidesc;render();});
  on('[data-lidreg]',el=>{lidRegiao=el.dataset.lidreg;render();});
  on('[data-lidfun]',el=>{lidFuncao=el.dataset.lidfun;render();});
  v.querySelectorAll('[data-lidf]').forEach(el=>el.onchange=()=>{
    const k=el.dataset.lidf;if(k==='escopo')lidEscopo=el.value;else if(k==='regiao')lidRegiao=el.value;else lidFuncao=el.value;render();});
  v.querySelectorAll('.mg-dest .jrow,.lid-top').forEach(el=>el.onclick=()=>modalJogador(el.dataset.p));
}
