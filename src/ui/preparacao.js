/* ============================================================
   CLUBE › TREINAMENTO & PREPARAÇÃO
   ------------------------------------------------------------
   Táticas, Comps e Treino eram três telas que falavam pouco entre
   si. Aqui viram abas de uma só, organizadas em volta da pergunta
   que importa: quão pronto o time está para cada mapa. O número
   de preparo sai de core/treino.js (preparoDoMapa) e é feito dos
   mesmos termos que o motor de partida usa.
   ============================================================ */
let prepAba='mapas';
const PREP_ABAS=[['mapas','Preparo por mapa'],['semana','Plano da semana'],['taticas','Táticas'],['comps','Comps']];

function sparkPreparo(vals,w,h){
  if(!vals||vals.length<2)return '';
  const min=Math.min(30,...vals),max=Math.max(70,...vals);
  const X=i=>(i/(vals.length-1))*(w-2)+1, Y=v=>h-1-((v-min)/(max-min))*(h-2);
  const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
  const ult=vals[vals.length-1],pri=vals[0];
  return `<svg class="prep-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <line x1="0" x2="${w}" y1="${Y(50).toFixed(1)}" y2="${Y(50).toFixed(1)}" stroke="rgba(255,255,255,.12)" stroke-dasharray="2 3"/>
    <path d="${d}" fill="none" stroke="${ult>=pri?'var(--teal)':'var(--red)'}" stroke-width="1.6"/></svg>`;
}
function corPreparo(n){return n>=65?'var(--teal)':n>=45?'var(--amber)':'var(--red)';}
function anelPreparo(n,px){
  const r=(px-8)/2,c=2*Math.PI*r,pct=clamp(n/100,0,1);
  return `<svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" class="prep-anel">
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="rgba(11,18,24,.55)" stroke="rgba(255,255,255,.14)" stroke-width="5"/>
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${corPreparo(n)}" stroke-width="5"
      stroke-dasharray="${(c*pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${px/2} ${px/2})"/>
    <text x="${px/2}" y="${px/2+8}" text-anchor="middle">${n}</text></svg>`;
}

function vPreparo(){
  const t=meu();
  const pl=planoDe(t);
  const div=divisaoTreino(pl);
  const px=proximoConfronto();
  const adv=px&&px.adv?T(px.adv):null;
  const verAdv=adv&&typeof nivelScout==='function'&&nivelScout(t)>=3;
  const hist=(t.preparoHist||[]).filter(f=>f.ano===G.ano||true).slice(-12);
  const preps=(G.mapasAtivos||[]).map(mp=>preparoDoMapa(t,mp)).sort((a,b)=>b.nota-a.nota);
  const parte=(rot,v)=>`<span class="prep-p ${v>0.4?'up':v<-0.4?'dn':''}">${rot} ${v>0?'+':''}${v.toFixed(1)}</span>`;
  const cards=preps.map(p=>{
    const d=div.find(x=>x.mapa===p.mapa);
    const serie=hist.map(f=>f.m[p.mapa]).filter(v=>typeof v==='number');
    const pa=verAdv?preparoDoMapa(adv,p.mapa).nota:null;
    return `<div class="prep-card ${d?'on':''}" style="${fundoMapa(p.mapa,0.66)}">
      <div class="prep-topo"><div><div class="prep-nome">${esc(p.mapa)}</div>
        ${d?`<span class="chip t">treinando · ${PRIO_NOME[d.prio]}</span>`:''}
        ${p.especifica?'<span class="chip">tática própria</span>':''}</div>${anelPreparo(p.nota,64)}</div>
      <div class="prep-partes">${parte('clube',p.partes.clube)}${parte('elenco',p.partes.elenco)}
        ${parte('comp',p.partes.comp)}${parte('tática',p.partes.tatica)}</div>
      <div class="prep-pe">${sparkPreparo(serie,120,26)}
        ${pa!=null?`<span class="dim">${esc(adv.tag)} <b style="color:${corPreparo(pa)}">${pa}</b></span>`:''}
        <button class="btn ghost sm" data-treinomapa="${esc(p.mapa)}">${d?'Tirar do treino':'Treinar'}</button></div>
    </div>`;
  }).join('');
  const melhor=preps[0],pior=preps[preps.length-1];
  return `${explica(`O preparo junta o que pesa na partida e muda de
    mapa para mapa: a identidade do clube, a afinidade dos cinco titulares, a comp escalada e a tática. 50 é um mapa
    neutro; cada ponto de força na partida vale 4 aqui. É o mesmo número que o veto enxerga.
    ${adv?(verAdv?` Ao lado, o preparo do <b>${esc(adv.tag)}</b>, seu próximo adversário, pelo seu analista.`
      :` Com analista e olheiro melhores você também veria o preparo do <b>${esc(adv.tag)}</b>.`):''}`,'Como o preparo é calculado')}
  <div class="grid g4" style="margin-bottom:14px">
    <div class="kpi teal"><div class="lb">Mapa mais forte</div><div class="vl">${esc(melhor?melhor.mapa:'—')}</div>
      <div class="sb">preparo ${melhor?melhor.nota:'—'}</div></div>
    <div class="kpi red"><div class="lb">Mapa mais fraco</div><div class="vl">${esc(pior?pior.mapa:'—')}</div>
      <div class="sb">preparo ${pior?pior.nota:'—'} — candidato a ban</div></div>
    <div class="kpi"><div class="lb">Média do pool</div><div class="vl">${preps.length?Math.round(preps.reduce((s,p)=>s+p.nota,0)/preps.length):'—'}</div>
      <div class="sb">${preps.length} mapas em rotação</div></div>
    <div class="kpi"><div class="lb">Treino da semana</div><div class="vl">${div.length||'—'}</div>
      <div class="sb">${div.length?div.map(x=>x.mapa).join(', '):'nenhum mapa marcado'}</div></div>
  </div>
  <div class="prep-grid">${cards}</div>`;
}

function vTaticasPorMapa(){
  const t=meu();
  const focos=[['execucao','Execução'],['default','Default'],['retake','Retake']];
  const linhas=(G.mapasAtivos||[]).map(mp=>{
    const tm=(t.taticaMapa&&t.taticaMapa[mp])||{};
    const p=preparoDoMapa(t,mp);
    return `<tr><td><span class="mp-mini" style="${fundoMapa(mp,0.2)}"></span> <b>${esc(mp)}</b></td>
      <td><select data-tmagres="${esc(mp)}"><option value="">padrão (${t.tatica.agres})</option>
        ${[1,2,3,4,5].map(n=>`<option value="${n}" ${tm.agres===n?'selected':''}>${n}</option>`).join('')}</select></td>
      <td><select data-tmfoco="${esc(mp)}"><option value="">padrão (${esc((focos.find(f=>f[0]===t.tatica.foco)||focos[1])[1])})</option>
        ${focos.map(([k,n])=>`<option value="${k}" ${tm.foco===k?'selected':''}>${n}</option>`).join('')}</select></td>
      <td class="r num ${p.partes.tatica>0.4?'up':p.partes.tatica<-0.4?'dn':''}">${p.partes.tatica>0?'+':''}${p.partes.tatica.toFixed(1)}</td>
      <td class="r num"><b style="color:${corPreparo(p.nota)}">${p.nota}</b></td></tr>`;}).join('');
  return `<div class="card flat"><div class="eyebrow">Tática por mapa</div>
    <p class="dim">A tática geral (acima) vale em todo mapa onde você não marcou outra. Execução rende mais em mapa
    que favorece o ataque, retake em mapa que favorece a defesa; agressividade combina com elenco de duelo.
    O pedido de tempo durante a partida continua mexendo por cima.</p>
    <table class="wide"><thead><tr><th>Mapa</th><th>Agressividade</th><th>Foco</th>
      <th class="r">Tática no preparo</th><th class="r">Preparo</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
}

function vPreparacao(){
  const abas=`<div class="tabs">${PREP_ABAS.map(([k,n])=>
    `<button data-prepaba="${k}" class="${prepAba===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(typeof guiaMarcar==='function'&&prepAba!=='mapas')guiaMarcar(prepAba==='semana'?'treino':prepAba);
  const corpo=prepAba==='semana'?vTreino():prepAba==='taticas'?vTaticas()+vTaticasPorMapa():prepAba==='comps'?vComps():vPreparo();
  return `<div class="eyebrow">Clube</div><h2 class="sec">Treinamento & Preparação</h2>${abas}
    <div class="prep-corpo">${corpo}</div>`;
}
