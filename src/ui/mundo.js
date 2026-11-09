/* ============================================================
   CIRCUITO › ESTATÍSTICAS DO MUNDO (era Líderes)
   Visão geral, líderes, títulos de 2021 até hoje, recordes e o
   ranking mundial. As contas novas moram em core/estatisticas.js.
   ============================================================ */
let mundoAba='geral', lidEscopo='temp', lidRegiao='todas', lidFuncao='todas', titFiltro='todos';

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
  const sel=(id,val,ops)=>`<select data-lidf="${id}">${ops.map(([k,n])=>`<option value="${k}" ${val===k?'selected':''}>${n}</option>`).join('')}</select>`;
  return `<div class="mundo-filtros">
    ${sel('escopo',lidEscopo,[['temp','Temporada '+G.ano],['carreira','Carreira inteira']])}
    ${sel('regiao',lidRegiao,[['todas','Todas as regiões'],...REGIONS.map(r=>[r.id,r.nome])])}
    ${sel('funcao',lidFuncao,[['todas','Todas as funções'],...ROLES.map(r=>[r,r])])}
    <span class="dim">${jog.length} jogadores com ${minMaps}+ mapas</span></div>
  <div class="grid g2">${tabs.map(([rot,f,fmt])=>{
    const top=jog.slice().sort((a,b)=>f(b)-f(a)).slice(0,10);
    return `<div class="card flat"><div class="eyebrow">${rot}</div><table><tbody>${
      top.map((p,i)=>linhaJogadorMini(p,fmt(f(p)),i)).join('')||'<tr><td class="dim">Sem dados.</td></tr>'}</tbody></table></div>`;}).join('')}</div>`;
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
  return `<div class="tabs" style="margin-top:4px">${filtros.map(([k,n])=>`<button data-titf="${k}" class="${titFiltro===k?'on':''}">${n}</button>`).join('')}</div>
  <p class="dim">Do primeiro Masters de 2021 até hoje: a pré-história real e a sua carreira na mesma galeria.
  Títulos da temporada em curso abrem a página do torneio.</p>
  ${anos.map(a=>{const l=h.filter(x=>x.ano===a&&filtra(x));if(!l.length)return '';
    return `<div class="tit-ano"><div class="tit-ano-n">${a}${a<2027?' <span class="dim">· real</span>':''}</div>
      <div class="titulo-lista">${l.map(x=>{const c=(x.timeId&&G.times[x.timeId])||(typeof acharClubePorNome==='function'?acharClubePorNome(x.campeao):null);
        const ev=x.ano===G.ano&&x.torneioId?` data-evento="${esc(x.torneioId)}"`:'';
        return `<div class="titulo-item ${c&&c.id===G.meuTime?'meu':''} ${ev?'abre':''}"${ev}>${imgTrofeu(trofeuDoTitulo(x.ano,x.evento),30,x.evento)}
          <div><div class="ev">${esc(x.evento)}</div>
          <div class="ano">${c?escudo(c,14)+' ':''}${esc(x.campeao)}${x.vice?' · vice '+esc(x.vice):''}</div></div></div>`;}).join('')}</div></div>`;}).join('')}`;
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
  const bloco=(rot,linhas)=>`<div class="card flat"><div class="eyebrow">${rot}</div><table><tbody>${linhas||'<tr><td class="dim">—</td></tr>'}</tbody></table></div>`;
  const lt=(l,f)=>l.map((x,i)=>`<tr class="${x.t&&x.t.id===G.meuTime?'me':''}"><td class="num dim">${i+1}</td><td>${f(x)}</td><td class="r num"><b>${x.v}</b></td></tr>`).join('');
  return `<div class="grid g3">
    <div class="kpi gold"><div class="lb">Maior over já registrado</div><div class="vl">${r.over?r.over.v:'—'}</div>
      <div class="sb">${r.over?esc(r.over.nome)+' · '+esc(r.over.time)+' · '+r.over.ano:'conferido a cada virada de temporada'}</div></div>
    <div class="kpi"><div class="lb">Maior transferência</div><div class="vl">${r.transferencia?money(r.transferencia.v):'—'}</div>
      <div class="sb">${r.transferencia?esc(r.transferencia.nome)+' · '+esc(r.transferencia.de)+' → '+esc(r.transferencia.para)+' · '+r.transferencia.ano:'nenhuma ainda nesta carreira'}</div></div>
    <div class="kpi"><div class="lb">Hall da Fama</div><div class="vl">${lendas.length}</div><div class="sb">lendas aposentadas</div></div>
  </div>
  <div class="grid g2" style="margin-top:12px">
    ${bloco('Mais títulos por clube',lt(topT(t=>(t.titulos||[]).length),x=>timeInline(x.t.id,18)))}
    ${bloco('Mais títulos de Champions',lt(topT(t=>conta(t,/Champions/)),x=>timeInline(x.t.id,18)))}
    ${bloco('Mais títulos de Masters',lt(topT(t=>conta(t,/Masters/)),x=>timeInline(x.t.id,18)))}
    ${bloco('Mais títulos por jogador',lt(titJog,x=>`<b>${esc(x.nome)}</b>${x.lenda?' <span class="chip">Hall da Fama</span>':''}`))}
    ${bloco('Carreira mais longa (mapas)',lt(carreira,x=>`<b>${esc(x.nome)}</b>${x.lenda?' <span class="chip">Hall da Fama</span>':''}`))}
    ${bloco('Mais vices',lt(topT(t=>t.vices||0),x=>timeInline(x.t.id,18)))}
  </div>`;
}

/* ---------- ranking mundial ---------- */
function sparkElo(id){
  const vals=(G.eloHist||[]).map(f=>f.v[id]).filter(v=>typeof v==='number');
  if(vals.length<2)return '';
  const w=90,h=22,min=Math.min(...vals),max=Math.max(...vals,min+1);
  const d=vals.map((v,i)=>(i?'L':'M')+(i/(vals.length-1)*(w-2)+1).toFixed(1)+' '+(h-1-(v-min)/(max-min)*(h-2)).toFixed(1)).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none"
    stroke="${vals[vals.length-1]>=vals[0]?'var(--teal)':'var(--red)'}" stroke-width="1.5"/></svg>`;
}
function mundoRanking(){
  const rk=rankingMundial();
  const foto=(G.eloHist||[])[0]||null;
  return `${explica(`Rating por resultado de série: vencer quem está acima vale mais, internacional pesa 1,5× e
  atropelo mexe mais que série apertada. A coluna de variação compara com a foto mais antiga dos últimos doze meses.`,'Como o ranking é calculado')}
  <div class="card flat"><table class="wide"><thead><tr><th>#</th><th>Clube</th><th>Liga</th><th class="r">Rating</th>
    <th class="c">Variação</th><th>12 meses</th></tr></thead><tbody>
  ${rk.map((t,i)=>{const pa=posicaoNaFoto(foto,t.id),dv=pa?pa-(i+1):0;
    return `<tr class="${t.id===G.meuTime?'me':''}"><td class="num">${i+1}</td><td>${timeInline(t.id,20)}</td>
      <td class="dim">${esc(nomeLiga(t))}</td><td class="r num"><b>${Math.round(eloDe(t))}</b></td>
      <td class="c num ${dv>0?'up':dv<0?'dn':'dim'}">${dv>0?'▲ '+dv:dv<0?'▼ '+(-dv):'—'}</td><td>${sparkElo(t.id)}</td></tr>`;}).join('')}
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
  v.querySelectorAll('[data-lidf]').forEach(el=>el.onchange=()=>{
    const k=el.dataset.lidf;if(k==='escopo')lidEscopo=el.value;else if(k==='regiao')lidRegiao=el.value;else lidFuncao=el.value;render();});
  v.querySelectorAll('.mg-dest .jrow').forEach(el=>el.onclick=()=>modalJogador(el.dataset.p));
}
