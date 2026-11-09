/* ============================================================
   CERIMÔNIA DE ENCERRAMENTO — telas que você passa uma a uma
   (os dados vêm prontos de core/cerimonia.js, em G.premios[].cer)
   ------------------------------------------------------------
   Abertura → a temporada do seu clube → os campeões do ano → os
   prêmios do menor para o maior (revelação, IGL, treinador, seleção,
   MVPs regionais, MVP do ano) → despedidas → fim. "Pular" fecha tudo
   de uma vez e segue para o veredito. Na tela de Prêmios dá para
   rever a de qualquer ano.
   ============================================================ */
let CER=null;   /* {reg, cer, i, telas, fim} */

function abrirCerimonia(reg,fim,comVeredito){
  if(!reg||!reg.cer){if(fim)fim();return;}
  CER={reg,cer:reg.cer,i:0,fim:fim||null,veredito:!!comVeredito};
  CER.telas=telasDaCerimonia(reg,reg.cer);
  pintarCerimonia();
}
function fimCerimonia(){
  const f=CER&&CER.fim;CER=null;
  $('#modal').innerHTML='';
  if(f)f();else render();
}

function lugarCor(l){return /campeão/.test(l)?'ouro':/vice/.test(l)?'prata':/top 4/.test(l)?'bronze':'';}
function graficoPosicao(graf){
  const pts=(graf||[]).filter(x=>x.p);
  if(pts.length<2)return '';
  const W=420,H=120,max=Math.max(...pts.map(x=>x.p),10);
  const xy=pts.map((x,k)=>[16+k*(W-32)/(pts.length-1),12+(x.p-1)/(max-1)*(H-30)]);
  const d=xy.map(([x,y],k)=>(k?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');
  return `<svg class="cer-graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="16" x2="${W-16}" y1="12" y2="12" class="g0"/><text x="${W-14}" y="15" class="gt">1º</text>
    <path d="${d}" class="gl"/>
    ${xy.map(([x,y],k)=>`<circle cx="${x}" cy="${y}" r="3.5"/><text x="${x}" y="${y+17}" class="gv">${pts[k].p}º</text>`).join('')}
  </svg>`;
}
function cartaoFicha(f,rot,trof,extra){
  if(!f)return '';
  return `<div class="cer-premio">
    ${trof?imgTrofeu(trof,64,rot):''}
    <div class="cer-p-carta">${cartaPremiado(f,170)}</div>
    <div class="cer-p-nome">${esc(f.nome)} ${FLAG[f.pais]||''}</div>
    <div class="dim">${esc(f.tag)} · ${f.role}${f.maps?` · ${f.maps} mapas · ${f.acs} de ACS · ${Number(f.kd).toFixed(2)} K/D`:''}</div>
    ${extra||''}</div>`;
}

function telasDaCerimonia(reg,c){
  const T=[];
  /* abertura */
  T.push({rot:'Abertura',fundo:'cidade',html:`<div class="cer-abre">
      <div class="eyebrow">VCT · ${c.ano}</div>
      <h1 class="cer-h1">Cerimônia de encerramento</h1>
      <p class="dim">${c.apres&&c.apres.length?'Apresentação: <b>'+c.apres.map(esc).join('</b> e <b>')+'</b>, ex-jogadores do circuito.':'A temporada '+c.ano+' acabou. Antes da diretoria falar, o circuito celebra quem fez o ano.'}</p>
    </div>`});

  /* a temporada do seu clube */
  const cl=c.clube;
  if(cl){
    const t=G.times[cl.id];
    const l=cl.linha;
    T.push({rot:'Sua temporada',fundo:'clube',html:`<div class="cer-tit"><div class="eyebrow">A temporada do seu clube</div>
        <h2>${t?escudo(t,34):''} ${esc(cl.nome)}</h2></div>
      <div class="cer-grid">
        <div>
          ${l?`<div class="cer-big"><b>${l.p}º</b><span>de ${l.de} na ${l.tier===2?'Challengers':'liga'} · ${l.v}–${l.d} em séries${l.mov==='subiu'?' · <span class="up">subiu para o VCT</span>':l.mov==='caiu'?' · <span class="dn">rebaixado</span>':''}</span></div>`:''}
          <div class="eyebrow" style="margin-top:12px">Torneio a torneio</div>
          <div class="cer-torn">${(cl.torneios||[]).map(x=>`<div class="${lugarCor(x.lugar)}">
            ${x.tr?imgTrofeu(x.tr,18,x.ev):x.int?icone('mundo','azul'):'·'} <span>${esc(x.ev)}</span><b>${esc(x.lugar)}</b></div>`).join('')||'<div class="dim">—</div>'}</div>
          ${cl.graf&&cl.graf.filter(x=>x.p).length>1?`<div class="eyebrow" style="margin-top:12px">Posição no ranking mundial</div>${graficoPosicao(cl.graf)}`:''}
        </div>
        <div>
          ${cl.melhor?`<div class="eyebrow">Melhor jogador do clube</div>
            <div class="cer-melhor">${cartaPremiado(cl.melhor,130)}<div><b>${esc(cl.melhor.nome)}</b>
              <div class="dim">${cl.melhor.role}</div><div class="num">${cl.melhor.maps} mapas · ${cl.melhor.acs} ACS · ${Number(cl.melhor.kd).toFixed(2)} K/D · ${cl.melhor.mvps} MVPs</div></div></div>`:''}
          ${cl.vitoria?`<div class="eyebrow" style="margin-top:14px">Maior vitória</div>
            <div class="cer-vit">${G.times[cl.vitoria.advId]?escudo(G.times[cl.vitoria.advId],30):''}
              <div><b class="num">${esc(cl.vitoria.placar)}</b> sobre <b>${esc(cl.vitoria.adv)}</b>
              <div class="dim">${esc(cl.vitoria.ev)}${cl.vitoria.rd?' · '+esc(cl.vitoria.rd):''}${cl.vitoria.rounds>0?' · saldo de '+cl.vitoria.rounds+' rounds':''}</div></div></div>`:''}
        </div>
      </div>`});
  }

  /* campeões do ano */
  const ints=(c.campeoes||[]).filter(x=>x.int),regs=(c.campeoes||[]).filter(x=>!x.int);
  T.push({rot:'Campeões',fundo:'cidade',html:`<div class="cer-tit"><div class="eyebrow">Os campeões de ${c.ano}</div><h2>Quem levantou troféu</h2></div>
    <div class="cer-ints">${ints.map(x=>{const t=G.times[x.timeId];return `<div class="cer-int">
      ${imgTrofeu(x.tr||trofeuDoTitulo(c.ano,x.ev),70,x.ev)}<div class="eyebrow">${esc(x.ev)}</div>
      <div class="cer-int-c">${t?escudo(t,30):''}<b>${esc(x.nome)}</b></div></div>`;}).join('')}</div>
    ${regs.length?`<div class="cer-regs">${regs.map(x=>{const t=G.times[x.timeId];
      return `<div>${imgTrofeu(x.tr||trofeuDoTitulo(c.ano,x.ev),16,x.ev)} <span class="dim">${esc(x.ev)}</span> ${t?escudo(t,16):''}<b>${esc(t?t.tag:x.nome)}</b></div>`;}).join('')}</div>`:''}`});

  /* prêmios, do menor para o maior */
  if(reg.revelacao)T.push({rot:'Revelação',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">Prêmio · ${c.ano}</div><h2>Revelação do ano</h2></div>
    ${cartaoFicha(reg.revelacao,'Revelação do ano',arquivoTrofeuPremio('revelacao'),reg.podios&&podioCurto(reg.podios.revelacao))}`});
  if(reg.igl)T.push({rot:'IGL',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">Prêmio · ${c.ano}</div><h2>IGL do ano</h2></div>
    ${cartaoFicha(reg.igl,'IGL do ano',arquivoTrofeuPremio('igl'))}`});
  if(reg.treinador){const tr=reg.treinador,t=G.times[tr.timeId];
    T.push({rot:'Treinador',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">Prêmio · ${c.ano}</div><h2>Treinador do ano</h2></div>
    <div class="cer-premio">${imgTrofeu(arquivoTrofeuPremio('treinador'),80,'Treinador do ano')}
      <div class="cer-p-nome">${esc(tr.nome)}${tr.voce?' <span class="chip t">você</span>':''}</div>
      <div class="dim">${t?escudo(t,18)+' ':''}${esc(t?t.nome:tr.tag)}</div></div>`});}
  if(reg.selecao&&reg.selecao.length)T.push({rot:'Seleção',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">Prêmio · ${c.ano}</div>
      <h2>${imgTrofeu(arquivoTrofeuPremio('selecao'),30,'Seleção do ano')} Seleção do ano</h2></div>
    <div class="pr-sel">${reg.selecao.map(f=>`<div class="pr-sel-j cer-in">${cartaPremiado(f,140)}<div class="pr-sel-n"><span class="dim">${esc(f.tag)}</span></div></div>`).join('')}</div>`});
  const regioes=REGIONS.filter(R=>reg.regioes&&reg.regioes[R.id]);
  if(regioes.length)T.push({rot:'MVPs regionais',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">Prêmio · ${c.ano}</div><h2>MVP de cada região</h2></div>
    <div class="cer-regmvp">${regioes.map(R=>{const f=reg.regioes[R.id];return `<div class="cer-in">
      <div class="eyebrow">${esc(R.nome)}</div>${cartaPremiado(f,130)}<b>${esc(f.nome)}</b><span class="dim">${esc(f.tag)}</span></div>`;}).join('')}</div>`});
  if(reg.mvp){const m=reg.mvp;
    T.push({rot:'MVP do ano',fundo:'palco',html:`<div class="cer-tit"><div class="eyebrow">O maior prêmio · ${c.ano}</div><h2>MVP do ano</h2></div>
    <div class="cer-mvp">
      ${imgTrofeu(arquivoTrofeuPremio('mvp'),90,'MVP do ano')}
      <div class="cer-mvp-carta">${(()=>{const p=P(m.id);const base=p||{id:m.id,nome:m.nome,role:m.role,timeId:m.timeId,pais:m.pais};
        return cartaJogador(base,{w:230,o:m.ov||(p?over(p):70),anima:true});})()}</div>
      <div class="cer-mvp-info"><div class="cer-p-nome" style="font-size:44px">${esc(m.nome)} ${FLAG[m.pais]||''}</div>
        <div class="dim">${esc(m.tag)} · ${m.role}</div>
        <div class="pr-nums" style="grid-template-columns:repeat(2,1fr)">${[['Mapas',m.maps],['ACS',m.acs],['K/D',Number(m.kd).toFixed(2)],['MVPs de mapa',m.mvps!=null?m.mvps:'—']]
          .map(([k,v])=>`<div><span>${k}</span><b class="num">${v}</b></div>`).join('')}</div>
        ${m.fora!=null?'<div class="pr-fora">★ Temporada fora da curva</div>':''}
        ${(m.conq||[]).length?`<div class="pr-conqs">${m.conq.slice(0,3).map(x=>`<span class="pr-conq ${x.i===0?'ouro':''}">${esc(x.ev)} · ${lugarConq(x.i)}</span>`).join('')}</div>`:''}
      </div></div>`});}

  /* despedidas */
  if((c.despedidas||[]).length||(c.hall||[]).length){
    const dest=d=>d.destino==='dono'?'compra o '+esc(d.clube||'clube'):d.destino?esc(ROT_DESTINO[d.destino]||d.destino):'sai de cena';
    T.push({rot:'Despedidas',fundo:'despedida',html:`<div class="cer-tit"><div class="eyebrow">Despedidas · ${c.ano}</div><h2>Quem pendurou o mouse</h2></div>
      ${(c.hall||[]).length?`<div class="cer-hall">${icone('coluna','ouro')} Entram no Hall da Fama: ${c.hall.map(h=>`<b>${esc(h.nome)}</b> ${FLAG[h.pais]||''}`).join(', ')}</div>`:''}
      <div class="cer-desp">${(c.despedidas||[]).map(d=>`<div class="${d.meu?'me':''}">
        <b>${esc(d.nome)}</b> ${FLAG[d.pais]||''} <span class="tag ${d.role}">${d.role}</span>
        <span class="dim">${d.idade} anos · ${esc(d.tag)} · ${d.titulos} título${d.titulos===1?'':'s'}${d.intl?' · '+d.intl+' internacional'+(d.intl===1?'':'is'):''}</span>
        <em>${dest(d)}</em></div>`).join('')}</div>`});
  }
  T.push({rot:'Fim',fundo:'cidade',html:`<div class="cer-abre"><div class="eyebrow">VCT · ${c.ano}</div><h1 class="cer-h1">Até ${c.ano+1}</h1>
    <p class="dim">${CER&&CER.veredito?'Agora a diretoria quer falar com você.':'Bom descanso — a pré-temporada começa já.'}</p></div>`});
  return T;
}

function pintarCerimonia(){
  if(!CER)return;
  const T=CER.telas,i=CER.i,ult=i===T.length-1;
  /* fundo por momento: a cidade da final, o palco dos prêmios, a cor do clube */
  const f=T[i].fundo;
  const sede=typeof sedeDe==='function'?sedeDe('champions',CER.cer.ano):null;
  const meuT=G.meuTime&&G.times[G.meuTime];
  /* Campeões tem três colunas de texto sobre a foto: escurece por igual, não só à esquerda */
  const estilo=f==='cidade'&&sede&&T[i].rot==='Campeões'
      ?`background-image:linear-gradient(180deg,rgba(11,18,24,.78),rgba(11,18,24,.9)),${urlCSS(ASSETS.cidade(sede.slug))};background-size:cover;background-position:center`
    :f==='cidade'&&sede?fundoCidade(sede.slug,0.74)
    :f==='palco'&&typeof temCena==='function'&&temCena('cenas','palco-premios')
      ?`background-image:radial-gradient(60% 55% at 50% 30%,rgba(226,180,90,.22),transparent 70%),linear-gradient(180deg,rgba(11,18,24,.55),rgba(11,18,24,.88) 70%),${urlCSS(ASSETS.arq('cenas','palco-premios'))};background-size:cover;background-position:center 30%`
    :f==='clube'&&meuT?`--clube:${corDoClube(meuT)};--clube-rgb:${rgbDe(corDoClube(meuT))}`:'';
  pintarModal(`<div class="ovl cer-ovl"><div class="cer cer-f-${f||'nada'}" ${estilo?`style="${estilo}"`:''}>
    <div class="cer-topo"><div class="cer-pontos">${T.map((x,k)=>`<i class="${k===i?'on':k<i?'feito':''}" data-cerir="${k}" title="${esc(x.rot)}"><span>${esc(x.rot)}</span></i>`).join('')}</div>
      <button class="btn ghost sm" data-cer="pular">${CER.fim?'Pular cerimônia':'Fechar'}</button></div>
    <div class="cer-corpo" key="${i}">${T[i].html}</div>
    <div class="cer-pe">
      <button class="btn ghost" data-cer="voltar" ${i?'':'disabled'}>‹ Voltar</button>
      <span class="dim">${esc(T[i].rot)} · ${i+1} de ${T.length}</span>
      <button class="btn" data-cer="seguir">${ult?(CER.veredito?'Ver o veredito':CER.fim?'Seguir':'Fechar'):i===0?'Começar ›':'Próximo ›'}</button>
    </div></div></div>`);
  const md=$('#modal');
  md.querySelectorAll('[data-cerir]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const k=+b.dataset.cerir;if(k<=CER.i||k===CER.i+1){CER.i=k;pintarCerimonia();}});
  md.querySelectorAll('[data-cer]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const a=b.dataset.cer;
    if(a==='pular')return fimCerimonia();
    if(a==='voltar'){CER.i=Math.max(0,CER.i-1);return pintarCerimonia();}
    if(CER.i>=T.length-1)return fimCerimonia();
    CER.i++;pintarCerimonia();
  });
}
