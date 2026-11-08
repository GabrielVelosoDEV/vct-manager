/* ============================================================
   CIRCUITO › PRÊMIOS — o MVP em destaque, pódios e a seleção
   (a régua mora em core/premios.js)
   ------------------------------------------------------------
   A nota exibida é a da régua do prêmio (desempenho e conquistas em
   desvios dos candidatos), passada para uma escala de 0 a 100 em que
   60 é a média dos candidatos e cada desvio vale 10 pontos. É ela que
   mostra a distância entre o primeiro e o segundo do pódio.
   Saves de antes da régua nova não têm nota nem pódio: a tela mostra
   o que existe.
   ============================================================ */
let premioAno=null;

function notaPremio(n){return n==null?null:Math.max(0,Math.min(99.9,60+10*n));}
function txtNota(n){const v=notaPremio(n);return v==null?'—':v.toFixed(1).replace('.',',');}
function lugarConq(i){return i===0?'campeão':i===1?'vice':i<=3?'top 4':'top 8';}

/* carta do premiado congelada no ano: o over é o daquela temporada, e quem
   se aposentou continua com carta (só não abre a ficha) */
function cartaPremiado(f,w){
  if(!f)return '';
  const p=P(f.id);
  const base=p||{id:f.id,nome:f.nome,role:f.role,timeId:f.timeId,pais:f.pais};
  return cartaJogador(base,{w,o:f.ov||(p?over(p):70),clique:!!p});
}
function nomePremiado(f){
  if(!f)return '—';
  const vivo=!!P(f.id);
  return `<span class="${vivo?'jrow pr-link':''}" ${vivo?`data-p="${f.id}"`:''}>${esc(f.nome)}</span> ${FLAG[f.pais]||''}`;
}
function barraRegua(rot,v,cls){
  if(v==null)return '';
  return `<div class="pr-bar"><span>${rot}</span><div class="vb"><i class="${cls||''}" style="width:${v}%"></i></div>
    <b class="num">${v}</b></div>`;
}

/* pódio 2-1-3; a diferença para o primeiro aparece em cada degrau */
function podioPremio(lista){
  if(!lista||lista.length<2)return '';
  const n1=notaPremio(lista[0].n);
  const deg=(f,k)=>{
    if(!f)return `<div class="pr-deg d${k+1} vazio"></div>`;
    const n=notaPremio(f.n);
    return `<div class="pr-deg d${k+1} ${f.timeId===G.meuTime?'me':''}">
      <div class="pr-quem">${nomePremiado(f)}<div class="dim">${esc(f.tag)} · ${f.role}</div>
        <div class="num pr-n">${txtNota(f.n)}${k&&n!=null&&n1!=null?` <span class="dn">−${(n1-n).toFixed(1).replace('.',',')}</span>`:''}</div></div>
      <div class="pr-bloco"><span>${k+1}</span></div></div>`;};
  return `<div class="pr-podio">${deg(lista[1],1)}${deg(lista[0],0)}${deg(lista[2],2)}</div>`;
}
/* lista compacta para os pódios menores (revelação, regionais) */
function podioCurto(lista){
  if(!lista||lista.length<2)return '';
  const n1=notaPremio(lista[0].n);
  return `<div class="pr-curto">${lista.slice(1).map((f,k)=>{const n=notaPremio(f.n);
    return `<div><span class="dim">${k+2}º</span> ${nomePremiado(f)} <span class="dim">${esc(f.tag)}</span>
      <span class="num dim">${txtNota(f.n)}${n!=null&&n1!=null?' · −'+(n1-n).toFixed(1).replace('.',','):''}</span></div>`;}).join('')}</div>`;
}

function heroMvp(r){
  const m=r.mvp,t=m.timeId&&G.times[m.timeId];
  const nums=[['Mapas',m.maps],['ACS',m.acs],['K/D',Number(m.kd).toFixed(2)],['MVPs de mapa',m.mvps!=null?m.mvps:'—'],['Nota',txtNota(m.n)]];
  const conq=(m.conq||[]).map(c=>`<span class="pr-conq ${c.i===0?'ouro':''}">${c.i===0?imgTrofeu(trofeuDoTitulo(r.ano,c.ev),16,c.ev)+' ':''}${esc(c.ev)} · ${lugarConq(c.i)}</span>`).join('');
  return `<div class="card pr-hero">
    <div class="pr-carta">${cartaPremiado(m,200)}</div>
    <div class="pr-info">
      <div class="pr-titulo">${imgTrofeu(arquivoTrofeuPremio('mvp'),54,'MVP do ano')}
        <div><div class="eyebrow">MVP de ${r.ano}</div>
        <h2 class="pr-nome">${nomePremiado(m)}</h2>
        <div class="dim">${t?escudo(t,16)+' ':''}${esc(t?t.nome:m.tag)} · ${m.role}${m.idade?' · '+m.idade+' anos':''}</div></div></div>
      ${m.fora!=null?`<div class="pr-fora" title="Sem final internacional: levou porque o desempenho passou o do segundo melhor por ${String(m.fora).replace('.',',')} desvio(s)">★ Temporada fora da curva</div>`:''}
      <div class="pr-nums">${nums.map(([k,v])=>`<div><span>${k}</span><b class="num">${v}</b></div>`).join('')}</div>
      ${m.pD!=null?`<div class="pr-regua">${barraRegua('Desempenho',m.pD,'g')}${barraRegua('Conquistas',m.pC,'')}
        <div class="dim" style="font-size:11.5px">Percentil entre os candidatos do ano. A nota soma 60% desempenho e 40% conquistas.</div></div>`:''}
      ${conq?`<div class="eyebrow" style="margin-top:12px">O que pesou na escolha</div><div class="pr-conqs">${conq}</div>`:''}
    </div>
    ${r.podios&&r.podios.mvp?`<div class="pr-lado"><div class="eyebrow">Mais votados</div>${podioPremio(r.podios.mvp)}</div>`:''}
  </div>`;
}

function selecaoDoAno(r){
  return `<div class="card"><div class="split"><div class="eyebrow">${imgTrofeu(arquivoTrofeuPremio('selecao'),18,'Seleção do ano')} Seleção do ano</div>
      <span class="dim">70% desempenho · 30% conquistas, um por função e o melhor que sobrou</span></div>
    <div class="pr-sel">${r.selecao.map(f=>`<div class="pr-sel-j">${cartaPremiado(f,138)}
      <div class="pr-sel-n"><span class="dim">${esc(f.tag)}</span>${f.n!=null?` <span class="num">${txtNota(f.n)}</span>`:''}</div></div>`).join('')}</div>
  </div>`;
}

function cartaoPremio(trof,rot,f,extra){
  return `<div class="card pr-mini">
    <div class="pr-mini-top">${imgTrofeu(trof,32,rot)}<div><div class="eyebrow">${esc(rot)}</div>
      ${f?`<h3 class="pr-mini-nome">${f.nome!=null&&f.role?nomePremiado(f):esc(f.nome)}</h3>
      <div class="dim">${esc(f.tag)}${f.maps?` · ${f.maps} mapas · ${f.acs} de ACS · ${Number(f.kd).toFixed(2)} de K/D`:''}</div>`:'<div class="dim">—</div>'}</div></div>
    ${extra||''}</div>`;
}

function vPremios(){
  const lista=G.premios||[];
  const anos=lista.map(r=>r.ano);
  if(premioAno==null||!anos.includes(premioAno))premioAno=anos[anos.length-1];
  const r=lista.find(x=>x.ano===premioAno);
  const i=anos.indexOf(premioAno);
  const nav=anos.length?`<div class="pr-nav">
      <button class="btn ghost sm" ${i>0?`data-pano="${anos[i-1]}"`:'disabled'}>‹ ${i>0?anos[i-1]:''}</button>
      <div class="pr-anos">${anos.slice().reverse().map(a=>`<button data-pano="${a}" class="${a===premioAno?'on':''}">${a}
        ${(lista.find(x=>x.ano===a)||{}).mvp?`<span>${esc(lista.find(x=>x.ano===a).mvp.nome)}</span>`:''}</button>`).join('')}</div>
      <button class="btn ghost sm" ${i<anos.length-1?`data-pano="${anos[i+1]}"`:'disabled'}>${i<anos.length-1?anos[i+1]:''} ›</button></div>`:'';

  const corpo=!r?`<div class="card flat"><div class="empty">Os prêmios saem na virada da temporada.
      O primeiro vai ser entregue no fim de ${G.ano}.</div></div>`:`
  ${heroMvp(r)}
  ${selecaoDoAno(r)}
  <div class="grid g3">
    ${cartaoPremio(arquivoTrofeuPremio('treinador'),'Treinador do ano',r.treinador&&{nome:r.treinador.nome+(r.treinador.voce?' (você)':''),tag:r.treinador.tag})}
    ${cartaoPremio(arquivoTrofeuPremio('igl'),'IGL do ano',r.igl)}
    ${cartaoPremio(arquivoTrofeuPremio('revelacao'),'Revelação do ano',r.revelacao,
      r.podios&&podioCurto(r.podios.revelacao))}
  </div>
  <div class="eyebrow" style="margin:6px 0 8px">MVP regional</div>
  <div class="grid g4">${REGIONS.map(R=>cartaoPremio(arquivoTrofeuPremio('regional'),R.nome,r.regioes[R.id],
      r.podios&&podioCurto(r.podios['reg_'+R.id]))).join('')}</div>`;

  const lendas=(G.lendas||[]).slice().sort((a,b)=>b.pontos-a.pontos);
  return `<div class="eyebrow">Circuito</div><h2 class="sec">Prêmios</h2>
  ${nav}
  ${corpo}
  <div class="card flat"><div class="eyebrow">Hall da Fama</div>
    ${lendas.length?`<div class="rolagem"><table><thead><tr><th>Jogador</th><th>Função</th><th class="c">Aposentou</th><th class="c">Pico</th>
      <th class="r">Títulos</th><th class="r">Internac.</th><th class="r">Prêmios</th><th class="r">Mapas</th><th class="r">K/D</th><th>Clubes</th></tr></thead>
    <tbody>${lendas.map(l=>`<tr><td><b>${esc(l.nome)}</b> ${FLAG[l.pais]||''}</td>
      <td><span class="tag ${l.role}">${l.role}</span></td><td class="c num">${l.ano} · ${l.idade}a</td>
      <td class="c num">${l.pico}</td><td class="r num">${l.carreira.titulos}</td><td class="r num">${l.carreira.intl}</td>
      <td class="r num" title="${esc(l.premios.map(x=>x.ano+' '+x.rot).join('\n'))}">${l.premios.length}</td>
      <td class="r num">${l.carreira.maps}</td><td class="r num">${l.carreira.kd.toFixed(2)}</td>
      <td class="dim">${esc(l.clubes.slice(-3).join(', '))}</td></tr>`).join('')}</tbody></table></div>`
    :`<div class="empty">Ninguém ainda. Entra quem se aposenta com prêmios do ano, títulos internacionais
      e uma carreira longa.</div>`}</div>`;
}
