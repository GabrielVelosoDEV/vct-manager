/* ============================================================
   O PLANO NA TELA (o motor mora em core/plano.js)
   Aba "Plano" da Preparação: estilo, semana, próximo jogo e os
   relatórios. A pré-partida ganha o "Plano para o jogo"; a ficha
   da partida ganha o relatório do analista.
   ============================================================ */
function estrelasHTML(n){return `<span class="pl-est">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;}

/* ---------- relatório do analista ---------- */
function relatorioAnalistaHTML(a,opc){
  if(!a)return '';
  opc=opc||{};
  const lista=(rot,cls,itens)=>itens.length?`<div class="ra-col ${cls}"><div class="eyebrow">${rot}</div>${itens.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'';
  const[aw,al]=a.lados.atk,[dw,dl]=a.lados.def;
  return `<div class="card flat ra"><div class="split"><div class="eyebrow">${icone('radar')} Relatório do analista${opc.titulo?' · '+esc(opc.titulo):''}</div>
      <span class="dim ra-meta">${esc(nomeEstilo(a.estilo))} contra ${esc(nomeEstilo(a.estiloAdv))} · ataque ${aw}–${al} · defesa ${dw}–${dl}${a.pistol[1]?' · pistols '+a.pistol[0]+'/'+a.pistol[1]:''}</span></div>
    <div class="ra-grade">${lista('O que funcionou','ok',a.funcionou)}${lista('O que custou','no',a.custou)}${lista('O que mudar','mud',a.mudar)}</div>
  </div>`;
}
/* ---------- relatório da semana de treino ---------- */
function relatorioSemanaHTML(rs){
  if(!rs)return '';
  const ev=rs.evolucoes.map(e=>`<span class="rs-it">${esc(e.nome)} <b class="up">+${e.d.toFixed(1)}</b> ${esc(e.attr)}${Math.abs(e.dOver)>=0.05?` <span class="dim">(over ${e.dOver>0?'+':''}${e.dOver.toFixed(1)})</span>`:''}</span>`).join('');
  const ag=rs.agentes.map(a=>`<span class="rs-it">${esc(a.nome)} · ${esc(a.agente)} <b>${a.de}% → ${a.ate}%</b></span>`).join('');
  const mp=rs.mapas.map(m=>`<span class="rs-it">${esc(m.mapa)} <b class="${m.ate>=m.de?'up':'dn'}">${m.de} → ${m.ate}</b></span>`).join('');
  const df=rs.fadDepois-rs.fadAntes;
  return `<div class="card flat rs"><div class="split"><div class="eyebrow">${icone('controle')} A semana de treino · ${esc(nomeModoSemana(rs.modo))}</div>
      <span class="dim">semana ${rs.semana}</span></div>
    <div class="rs-linha"><span class="eyebrow">Evoluíram</span>${ev||'<span class="dim">ninguém — semana de descanso ou elenco no teto</span>'}</div>
    ${ag?`<div class="rs-linha"><span class="eyebrow">Agentes</span>${ag}</div>`:''}
    ${mp?`<div class="rs-linha"><span class="eyebrow">Preparo</span>${mp}</div>`:''}
    <div class="rs-linha"><span class="eyebrow">Cansaço dos titulares</span><b>${rs.fadAntes}% → ${rs.fadDepois}%</b>
      <span class="${df>0?'dn':'up'}">${df>0?'+':''}${df} pts</span>${rs.descansaram?`<span class="dim">· ${rs.descansaram} descansaram</span>`:''}</div>
  </div>`;
}

/* ---------- a aba Plano ---------- */
function vPlano(){
  const t=meu();
  const est=estiloDe(t),modo=semanaModoDe(t);
  const enc=encaixeEstilos(t);
  const px=proximoConfronto();
  const adv=px&&px.adv?T(px.adv):null;
  const leitura=adv?(typeof nivelScoutContra==='function'?nivelScoutContra(t,adv):nivelScout(t)):0;
  const cartaoEstilo=k=>{
    const e=ESTILOS[k],rt=retrospectoEstilo(k,10),ad=k==='adaptavel'?taticaDoEstilo(t,'adaptavel',adv):null;
    return `<button class="pl-card ${est===k?'on':''}" data-estilo="${k}">
      <div class="split"><span class="pl-ic">${icone(e.ic,est===k?'ouro':'')}</span>${estrelasHTML(enc[k].estrelas)}</div>
      <b>${esc(e.nome)}</b><span class="pl-desc">${esc(e.desc)}</span>
      ${e.forte?`<span class="pl-rps"><span class="up">forte contra ${esc(ESTILOS[e.forte].nome)}</span> · <span class="dn">fraco contra ${esc(ESTILOS[e.fraco].nome)}</span></span>`
        :`<span class="pl-rps">${ad?'hoje: '+esc(nomeEstilo(ESTILO_DO_FOCO[ad.foco]))+(adv&&leitura>=3?' contra o '+esc(adv.tag):' (sem leitura do adversário)'):''}</span>`}
      <span class="pl-hist">${rt.v+rt.d?`<b class="num">${rt.v}V ${rt.d}D</b> nos últimos ${rt.v+rt.d} mapas`:'ainda sem mapas com ele'}</span>
    </button>`;
  };
  const cartaoSemana=k=>{
    const m=MODOS_SEMANA[k],pv=previsaoSemana(t,k);
    const evol=pv.evolucao<=0.01?'evolução parada':pv.evolucao>=1.08?'evolução alta (×'+pv.evolucao.toFixed(1)+')':pv.evolucao<=0.85?'evolução menor (×'+pv.evolucao.toFixed(1)+')':'evolução normal';
    return `<button class="pl-card pl-sem ${modo===k?'on':''}" data-semana="${k}">
      <div class="split"><span class="pl-ic">${icone(m.ic,modo===k?'ouro':'')}</span><span class="dim num">scrim ${m.scrim}</span></div>
      <b>${esc(m.nome)}</b><span class="pl-desc">${esc(m.desc)}</span>
      <span class="pl-prev"><span class="${pv.fadiga>0?'dn':'up'}">cansaço ${pv.fadiga>0?'+':''}${pv.fadiga} pts</span> · ${evol}
        ${pv.mapas?' · '+pv.mapas+' mapa'+(pv.mapas>1?'s':''):''}${k==='estudar'?(pv.adv?' · contra o '+esc(pv.adv):' · sem adversário à vista'):''}</span>
    </button>`;
  };
  const ult=(G.relatorios||[])[0];
  const proximo=adv?(()=>{
    const tatEle=adv.tatica||{};
    const sabe=leitura>=3;
    const sug=sabe?ESTILO_DO_FOCO[CONTRA_FOCO[tatEle.foco||'default']]:null;
    return `<div class="card flat pl-prox"><div class="eyebrow">Próximo jogo</div>
      <div class="pl-prox-l">${escudo(adv,40)}<div><b>${esc(adv.nome)}</b>
        <div class="dim">${sabe?'O analista lê: eles jogam <b>'+esc(nomeEstilo(estiloAparente(tatEle)))+'</b>. Contra isso, o <b>'+esc(nomeEstilo(sug))+'</b> leva vantagem.'
          :'Ainda sem leitura do estilo deles. Uma semana de <b>Estudar o adversário</b> ou um analista melhor resolve.'}</div></div></div>
      <p class="dim" style="font-size:12px;margin-top:6px">No relatório antes do jogo você confirma o plano para a partida: manter o seu estilo ou usar o que o analista sugerir só naquele jogo.</p></div>`;
  })():'';
  const personal=est==='personalizado'||modo==='personalizada';
  return `<div class="pl-intro">${explica(`Três decisões: o <b>estilo</b> do time, a <b>semana</b> de treino e, antes de cada jogo, o <b>plano para a partida</b>.
      As estrelas dizem o quanto cada estilo rende para o seu elenco contra a sua liga, com as contas do próprio motor.
      Depois de cada jogo o analista diz o que funcionou e o que mudar; depois de cada semana, quem evoluiu.
      Os controles finos (tática por mapa, plano de cada jogador, comps) continuam em <b>Avançado</b>.`,'Como funciona')}</div>
    ${personal?`<div class="card flat pl-aviso">Você está usando ajustes do Avançado (${est==='personalizado'?'tática personalizada':''}${est==='personalizado'&&modo==='personalizada'?' e ':''}${modo==='personalizada'?'semana personalizada':''}).
      Escolher um estilo ou uma semana aqui volta para o automático.</div>`:''}
    <div class="eyebrow pl-tit">Estilo do time</div>
    <div class="pl-grade">${['agressivo','controle','defensivo','adaptavel'].map(cartaoEstilo).join('')}</div>
    <div class="eyebrow pl-tit">A semana</div>
    <div class="pl-grade">${Object.keys(MODOS_SEMANA).map(cartaoSemana).join('')}</div>
    <div class="grid g2" style="margin-top:14px">${proximo}${relatorioSemanaHTML(G.relatorioSemana)||'<div class="card flat"><div class="eyebrow">A semana de treino</div><p class="dim">O relatório aparece depois da primeira semana.</p></div>'}</div>
    ${ult?relatorioAnalistaHTML(ult.r,{titulo:(ult.venceu?'vitória ':'derrota ')+ult.eu+'–'+ult.ele+' contra o '+ult.advTag})
      :'<div class="card flat"><div class="eyebrow">Relatório do analista</div><p class="dim">Depois do primeiro jogo, o analista conta aqui o que funcionou e o que mudar.</p></div>'}`;
}
function ligarPlano(v,on){
  on('[data-estilo]',el=>{const r=definirEstilo(meu(),el.dataset.estilo);render();flash(r.ok?r.msg:r.erro);});
  on('[data-semana]',el=>{const r=definirModoSemana(meu(),el.dataset.semana);render();flash(r.ok?r.msg:r.erro);});
}

/* ---------- pré-partida: plano para o jogo ---------- */
function ppPlanoJogoHTML(){
  if(!PP)return '';
  const t=PP.meu,adv=PP.adv;
  const est=estiloDe(t);
  const leitura=typeof nivelScoutContra==='function'?nivelScoutContra(t,adv):nivelScout(t);
  const tatEle=adv.tatica||{};
  const sabe=leitura>=3;
  const sug=sabe?ESTILO_DO_FOCO[CONTRA_FOCO[tatEle.foco||'default']]:null;
  const atual=PP.tatica?ESTILO_DO_FOCO[PP.tatica.foco]:null;
  const mapas=G.mapasAtivos||[];
  const ganho=sug&&leitura>=4?_forcaComTatica(t,ESTILOS[sug].tatica,mapas,tatEle)-_forcaComTatica(t,t.tatica,mapas,tatEle):null;
  const meuEf=ESTILO_DO_FOCO[(t.tatica||{}).foco||'default'];
  const igual=sug&&sug===meuEf;
  return `<div class="card flat pp-plano"><div class="eyebrow">${icone('radar')} Plano para o jogo</div>
    <p>${sabe?`O ${esc(adv.tag)} vem jogando <b>${esc(nomeEstilo(estiloAparente(tatEle)))}</b>. `
      +(igual?`O seu ${esc(nomeEstilo(est))} já é o contra-estilo: mantenha.`
        :`O analista sugere <b>${esc(nomeEstilo(sug))}</b> neste jogo${ganho!=null?` (cerca de ${ganho>=0?'+':''}${ganho.toFixed(1)} por round)`:''}.`)
      :`Sem leitura do estilo do ${esc(adv.tag)} — o time entra com o seu ${esc(nomeEstilo(est))}. Estudar o adversário na semana ou um analista melhor mostraria o estilo deles.`}</p>
    ${sabe&&!igual?`<div class="pp-plano-bts">
      <button class="btn ${atual===sug?'':'ghost'} sm" data-ppplano="${sug}">${atual===sug?'✓ ':''}Usar ${esc(nomeEstilo(sug))} neste jogo</button>
      <button class="btn ${!PP.tatica?'':'ghost'} sm" data-ppplano="">${!PP.tatica?'✓ ':''}Manter ${esc(nomeEstilo(est))}</button></div>`:''}
  </div>`;
}
