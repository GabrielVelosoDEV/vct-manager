/* ============================================================
   MODO JOGADOR — as telas da semana e dos talentos (J3)
   Semana e treinos: a energia, as atividades e o que a semana deu.
   Talentos: a árvore da sua função (core/talentos.js).
   ============================================================ */

const _NOME_ATR=()=>Object.fromEntries(ATTRS);
function _xpTexto(xp){
  const n=_NOME_ATR();
  return Object.entries(xp||{}).filter(([,v])=>v>0.05).map(([k,v])=>`${n[k]||k} +${v.toFixed(1)}`).join(' · ');
}
function _subiuTexto(sub){
  const n=_NOME_ATR();
  return Object.entries(sub||{}).map(([k,v])=>`<b class="up">${esc(n[k]||k)} +${v}</b>`).join(' ');
}
function _barraEnergia(s){
  const pct=Math.round(s.energia), ini=Math.round(s.ini);
  const tom=pct<30?'dn':pct<55?'':'up';
  return `<div class="sj-en"><div class="sj-en-b"><i class="sj-ini" style="width:${ini}%"></i><i class="sj-agora ${tom}" style="width:${pct}%"></i></div>
    <div class="sj-en-n"><b class="num">${pct}</b><span>de ${ini} de energia nesta semana</span></div></div>`;
}

/* ---------- Semana e treinos ---------- */
function vJSemana(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const s=semanaJogador(), t=clubeDoJogador(), adv=adversarioDaSemana(), rv=nivelDoRival();
  const lab=typeof rotuloSemana==='function'?rotuloSemana(G.ano,G.semana):'Semana '+G.semana;
  const nomes=_NOME_ATR();
  const card=a=>{
    const motivo=porqueNaoAtividade(a.id), feitas=vezesFeita(a.id);
    const alvo=a.xp?Object.keys(a.xp).map(k=>nomes[k]||k).join(', '):a.id==='agente'?'familiaridade':a.id==='live'?'fãs e dinheiro':'';
    let botoes='';
    if(a.grupo==='jogavel')botoes=`<button class="btn sm" data-sjjogar="${a.id}" ${motivo?'disabled':''}>Jogar</button><button class="btn ghost sm" data-sjsim="${a.id}" ${motivo?'disabled':''}>Simular (60%)</button>`;
    else if(a.id==='agente'){
      const pool=[...new Set([...(p.agentes||[]),...((typeof AGENTS!=='undefined'&&AGENTS[p.role])||[])])];
      botoes=`<select id="sjAgente" ${motivo?'disabled':''}>${pool.map(x=>`<option>${esc(x)}</option>`).join('')}</select><button class="btn sm" data-sjfazer="agente" ${motivo?'disabled':''}>Treinar</button>`;
    }else botoes=`<button class="btn sm" data-sjfazer="${a.id}" ${motivo?'disabled':''}>${a.grupo==='clube'?'Ir ao treino':'Fazer'}</button>`;
    return `<div class="sj-at ${motivo?'off':''} ${feitas?'feita':''}">
      <div class="sj-at-top"><b>${esc(a.nome)}</b><span class="chip">${custoEnergia(a)} energia</span></div>
      <p class="dim">${esc(a.desc)}${a.id==='duelo'&&rv.over?` Rival de over ${rv.over}.`:''}${a.id==='vod'&&adv?` Adversário: ${esc(adv.nome)}.`:''}</p>
      ${alvo?`<div class="sj-alvo">${esc(alvo)}</div>`:''}
      <div class="sj-at-b">${botoes}${feitas?`<span class="dim">feito ${feitas}×${a.unico?'':' · repetir rende menos'}</span>`:''}</div>
      ${motivo&&!feitas?`<div class="sj-motivo">${esc(motivo)}</div>`:''}</div>`;
  };
  const grupo=(g,titulo,sub)=>{const l=ATIV_JOGADOR.filter(a=>a.grupo===g&&(g!=='clube'||t));return l.length?`<div class="card"><div class="eyebrow">${titulo}</div>${sub?`<p class="dim">${sub}</p>`:''}<div class="sj-grid">${l.map(card).join('')}</div></div>`:'';};
  const feitas=s.feitas.map(f=>{const a=ativJogador(f.id);
    return `<div class="sj-feita"><b>${esc(a?a.nome:f.id)}</b>${f.alvo?` · ${esc(f.alvo)}`:''}<span class="dim">${f.simulado?'simulado':f.nota!=null?'nota '+f.nota.toFixed(2):''} · −${f.gasto} energia</span>
      <span>${_xpTexto(f.xp)}${f.fam?` familiaridade +${f.fam}`:''}${f.seg?` +${fmtSeg(f.seg)} seguidores`:''}${f.din?` · ${moneyJ(f.din)}`:''}</span>${_subiuTexto(f.subiu)}</div>`;}).join('');
  const u=G.voce.ultimaSemana;
  return `<section class="card sj-topo">
      <div class="split"><div><div class="eyebrow">Semana e treinos · ${esc(lab)}</div>
        <h2 class="sj-tit">${adv?`Jogo nesta semana: ${esc(adv.nome)}`:t?'Semana sem jogo do seu clube':'Ranked e treino por conta própria'}</h2></div>
        <label class="sj-auto"><input type="checkbox" id="sjAuto" ${G.voce.auto?'checked':''}> Assistente monta a semana se eu não marcar nada</label></div>
      ${_barraEnergia(s)}
      <p class="dim">Cada atividade gasta energia; o que sobrar vira descanso quando a semana fechar. ${adv?'Abaixo de 40 de energia você chega ao jogo cansado e rende menos.':''} Treinar jogando rende mais que simular: o XP sai de como você jogou.</p>
    </section>
    ${grupo('clube','Treino do clube','O técnico conta presença. Faltar derruba a forma, e a forma pesa na escalação.')}
    ${grupo('jogavel','Treinos jogáveis','Abrem a gameplay por cima do manager. Esc pausa e deixa encerrar.')}
    ${grupo('clique','Fora do jogo')}
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Feito nesta semana</div>${feitas||vazio('<b>Nada ainda.</b> '+(G.voce.auto?'Se você avançar assim, o assistente faz uma semana padrão simulada.':'Se você avançar assim, a semana inteira vira descanso.'),'treino')}</div>
      <div class="card"><div class="eyebrow">Semana passada</div>${u?`
        <p>${u.auto?'O assistente montou a semana. ':''}Gastou ${Math.round(u.ini-u.energia)} de ${Math.round(u.ini)} de energia.${u.coletivo===false?' <b class="dn">Faltou ao treino do clube.</b>':''}</p>
        ${u.partidas?`<p>${u.partidas.maps} mapa${u.partidas.maps>1?'s':''} jogado${u.partidas.maps>1?'s':''}: ${_xpTexto(u.partidas.xp)} ${_subiuTexto(u.partidas.subiu)}</p>`:'<p class="dim">Sem partida sua.</p>'}`
        :vazio('<b>A primeira semana ainda não fechou.</b>','grafico')}</div>
    </div>`;
}

/* abre a gameplay para um treino jogável */
function mapaDoTreino(){
  const ativos=(G.mapasAtivos||[]).filter(m=>typeof MAPAS_GAMEPLAY!=='undefined'&&MAPAS_GAMEPLAY[motorMapaId(m)]);
  const t=clubeDoJogador(), pl=t&&typeof planoDe==='function'?planoDe(t):null;
  const m=(pl&&pl.mapa&&ativos.includes(pl.mapa)?pl.mapa:null)||ativos[(G.semana||0)%Math.max(1,ativos.length)]||'Ascent';
  return motorMapaId(m);
}
function jogarTreino(id){
  const motivo=porqueNaoAtividade(id);if(motivo){flash(motivo);return;}
  if(typeof GP==='undefined'||!GP.treinarNoManager){flash('A gameplay não carregou nesta página.');return;}
  const a=ativJogador(id), p=meuJogador(), t=clubeDoJogador(), rv=nivelDoRival();
  const at=Object.assign({},p.at);bonusDoJogadorNaPartida(p,at,null);
  const ag=GP.idAgente((p.agentes||[])[0])||null;
  GP.treinarNoManager({modo:a.modo,mapa:mapaDoTreino(),nome:p.nome,euMid:p.id,funcao:p.roleAtual||p.role,over:over(p),atrib:at,agente:ag,
    rival:{over:rv.over||70,funcao:'Duelista'},aliados:{over:t?overMedioTime(t):over(p)}})
  .then(r=>{
    const nota=notaDoTreino(a.modo,r);
    const res=fazerAtividade(id,{simulado:false,nota,resumo:{kills:r.kills,mortes:r.mortes,precisao:r.precisao,hs:r.hs,eu:r.eu,eles:r.eles,venceu:r.venceu}});
    render();
    if(res.ok)modalResultadoTreino(a,res.feito,r);
  }).catch(e=>{console.error(e);flash('O treino não abriu.');});
}
function modalResultadoTreino(a,f,r){
  const linha=a.modo==='range'?`${r.kills} abates · ${r.precisao}% de precisão · ${r.hs}% na cabeça`
    :a.modo==='duelo'?`${r.eu}–${r.eles} no duelo`
    :a.modo==='dm'?`${r.kills} abates e ${r.mortes} mortes`
    :`${r.venceu?'Retake ganho':'Retake perdido'} · ${r.kills} abate${r.kills===1?'':'s'}`;
  pintarModal(`<div class="ovl"><div class="box sj-res">
    <div class="eyebrow">${esc(a.nome)}</div><h2>${esc(linha)}</h2>
    <p>Nota <b class="num">${(f.nota||0).toFixed(2)}</b> · rendeu ${Math.round(f.mult*100)}% do XP base · −${f.gasto} energia</p>
    <p>${_xpTexto(f.xp)}</p>${Object.keys(f.subiu).length?`<p>Subiu: ${_subiuTexto(f.subiu)}</p>`:''}
    <div class="dj-acoes"><button class="btn" id="sjOk">Voltar para a semana</button></div></div></div>`);
  $('#sjOk').onclick=()=>{$('#modal').innerHTML='';render();};
}

/* ---------- Talentos ---------- */
function vJTalentos(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  if(!G.voce.talentoGratis)darTalentoDoEstilo(p);   /* carreira criada antes da J3 */
  const arv=arvoreDe(p), livres=pontosLivres(p), total=pontosTalento(p), pico=Math.round(p.pico||over(p));
  const prox=TALENTO_FILEIRAS.find(x=>x>pico);
  const col=r=>`<div class="tl-ramo"><div class="tl-ramo-n"><b>${esc(r.nome)}</b><span class="dim">${esc(r.desc)}</span></div>
    ${r.t.map((x,i)=>{
      const n=nivelTalento(x.id), max=maxNivelTalento(i), motivo=porqueNaoTalento(p,x.id), aberta=fileiraAberta(p,i);
      return `<div class="tl ${n?'on':''} ${aberta?'':'fechado'} ${i===5?'assin':''}">
        <div class="tl-top"><span class="tl-f">${TALENTO_FILEIRAS[i]}</span><b>${esc(x.nome)}</b><span class="tl-n">${Array.from({length:max},(_,j)=>`<i class="${j<n?'on':''}"></i>`).join('')}</span></div>
        <p>${esc(textoEfeito(x.ef))}${max>1?' <span class="dim">por nível</span>':''}</p>
        <p class="dim">${esc(x.txt)}${G.voce.talentoGratis===x.id?' · <b>talento do seu estilo</b>':''}</p>
        ${motivo?`<div class="tl-mot">${esc(motivo)}</div>`:`<button class="btn sm" data-tlcompra="${x.id}">+1 nível</button>`}</div>`;}).join('')}</div>`;
  return `<section class="card sj-topo"><div class="eyebrow">Talentos · ${esc(p.role)}</div>
      <h2 class="sj-tit">${livres} ponto${livres===1?'':'s'} livre${livres===1?'':'s'} <span class="dim">de ${total}</span></h2>
      <p class="dim">Cada ponto de over acima de 65 no seu melhor over (hoje ${pico}) vale um ponto. As fileiras abrem em ${TALENTO_FILEIRAS.join(', ')}${prox?`; a próxima abre com over ${prox}`:''}. A fileira de cima precisa de um ponto antes da de baixo, e a assinatura (90) é uma só na carreira.</p></section>
    <div class="tl-arvore">${arv.map(col).join('')}</div>`;
}

/* ---------- eventos ---------- */
function ligarJogador(v,on){
  on('[data-sjjogar]',el=>jogarTreino(el.dataset.sjjogar));
  on('[data-sjsim]',el=>{const r=fazerAtividade(el.dataset.sjsim,{simulado:true});if(!r.ok)flash(r.motivo);render();});
  on('[data-sjfazer]',el=>{
    const id=el.dataset.sjfazer;
    const alvo=id==='agente'?(v.querySelector('#sjAgente')||{}).value:null;
    const r=fazerAtividade(id,{simulado:true,alvo});
    if(!r.ok)flash(r.motivo);
    else if(id==='live')flash(`Live feita: +${fmtSeg(r.feito.seg)} seguidores e ${moneyJ(r.feito.din)}.`);
    else if(id==='agente')flash(`${alvo}: familiaridade +${r.feito.fam}.`);
    render();
  });
  const au=v.querySelector('#sjAuto');if(au)au.onchange=()=>{G.voce.auto=au.checked;};
  if(typeof ligarRelacoes==='function')ligarRelacoes(v,on);
  if(typeof ligarMercadoJogador==='function')ligarMercadoJogador(v,on);
  if(typeof ligarMidia==='function')ligarMidia(v,on);
  on('[data-tlcompra]',el=>{const r=comprarTalento(el.dataset.tlcompra);if(!r.ok)flash(r.motivo);render();});
}
