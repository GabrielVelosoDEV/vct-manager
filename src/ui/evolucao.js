/* ============================================================
   MODO JOGADOR — a rotina diária e a evolução na tela (Etapa 4)
   O motor mora em core/evolucao-jogador.js. Aqui: a barra do over
   que anda a cada treino, o próximo marco, a curva das semanas,
   os desafios, os momentos, o foco do split, o bootcamp e a rotina
   dos sete dias.
   ============================================================ */
let _evjFocoSel=null;
const EVJ_IC={desafio:'alvo',marco:'trofeu',mvp:'estrela',titulo:'trofeu',semana:'fogo',maestria:'medalha'};

function _evjSpark(h,w,hh){
  if(!h||h.length<2)return '';
  const v=h.map(x=>x.o), min=Math.min(...v)-0.5, max=Math.max(...v)+0.5;
  const X=i=>(i/(v.length-1))*(w-4)+2, Y=x=>hh-2-((x-min)/(max-min||1))*(hh-4);
  const d=v.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x).toFixed(1)).join(' ');
  return `<svg class="evj-spark" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true">
    <path d="${d} L ${X(v.length-1).toFixed(1)} ${hh} L 2 ${hh} Z" fill="rgba(31,210,180,.12)"/>
    <path d="${d}" fill="none" stroke="var(--teal)" stroke-width="2"/>
    <circle cx="${X(v.length-1).toFixed(1)}" cy="${Y(v[v.length-1]).toFixed(1)}" r="3" fill="var(--teal)"/></svg>`;
}
function medalhasHTML(id){
  if(typeof medalhasDe!=='function')return '';
  const m=medalhasDe(id);
  if(!m.ouro&&!m.prata&&!m.bronze)return '';
  return `<span class="evj-meds">${['ouro','prata','bronze'].map(k=>m[k]?`<i class="evj-med ${k}" title="${MEDALHA_NOME[k]}">${m[k]}</i>`:'').join('')}${m.rec!=null?`<span class="dim">recorde ${m.rec.toFixed(2)}</span>`:''}</span>`;
}

function evolucaoHTML(p){
  if(!p||typeof overExatoJ!=='function')return '';
  garantirDesafios(p);
  if(!G.voce.marcos)_checarMarcos(p);
  const nomes=Object.fromEntries(ATTRS);
  const ox=overExatoJ(p), o=over(p), pct=Math.round(clamp(ox-(o-0.5),0,0.999)*100);
  const pm=proximoMarco(p), ant=[...MARCOS].reverse().find(m=>m<=o)||Math.max(50,o-5);
  const pctM=pm?Math.round(clamp((ox-ant)/(pm-ant),0,1)*100):100;
  const h=G.voce.overHist||[];
  const ganho=h.length>1?Math.round((h[h.length-1].o-h[Math.max(0,h.length-9)].o)*10)/10:null;
  /* desafios */
  const dzs=desafiosAtivos().map((dz,i)=>{
    const d=desafioJDef(dz.id), resta=DESAFIO_SEMANAS-(_semAbsJ()-dz.ini);
    const atr=d.atr||(ativJogador(dz.alvo)&&ativJogador(dz.alvo).xp?Object.keys(ativJogador(dz.alvo).xp).slice(0,2):[]);
    const pr=d.binario?(dz.prog>=dz.meta?1:0):clamp(dz.prog/dz.meta,0,1);
    return `<div class="evj-dz" style="--i:${i}"><span class="evj-dz-ic">${ico(dz.id==='ouro'||dz.id==='medalhas'?'medalha':dz.id==='agente'?'estrela':dz.id==='ranked'?'controle':'alvo')}</span>
      <div class="evj-dz-t"><b>${esc(textoDesafio(dz))}</b>
        <span class="dim">${d.binario?'numa semana só':dz.id==='agente'?`hoje ${Math.round(nivelAgente(p,dz.alvo))}`:`${dz.prog} de ${dz.meta}`} · ${resta} semana${resta===1?'':'s'}</span>
        <u><i style="width:${Math.round(pr*100)}%"></i></u></div>
      <span class="evj-dz-r">${atr.map(k=>`<i>${esc(nomes[k]||k)}</i>`).join('')}</span></div>`;}).join('');
  /* foco */
  const foco=focoAtual(), sel=_evjFocoSel||foco.slice(), espera=porqueNaoFoco();
  const focoHTML=`<div class="evj-foco">${ATTRS.map(([k,n])=>`<button class="${sel.includes(k)?'on':''} ${foco.includes(k)?'atual':''}" data-evjfoco="${k}">${esc(n)}</button>`).join('')}</div>
    ${_evjFocoSel&&(sel.join()!==foco.join())?`<button class="btn sm" data-evjfocook="1" ${sel.length!==2||(espera&&foco.length)?'disabled':''}>Definir foco</button>`:''}
    <span class="dim evj-mini">${foco.length?`+${Math.round((FOCO_MULT-1)*100)}% de XP em ${foco.map(k=>esc(nomes[k])).join(' e ')}.${espera?' '+esc(espera):''}`:'Escolha dois atributos: eles ganham +30% de XP no split.'}</span>`;
  /* bootcamp */
  const bc=bootcampAtivo(), bcM=porqueNaoBootcamp(), bcI=G.voce.bootcamp;
  const bcHTML=bc?`<b class="up">Em andamento</b><span class="dim evj-mini">XP +${Math.round((BOOTCAMP_MULT-1)*100)}% em tudo até a semana ${bcI.ini+BOOTCAMP_SEMANAS-1-(G.ano||0)*SEMANAS_ANO}.</span>`
    :`<button class="btn sm" data-evjboot="1" ${bcM?'disabled':''}>Marcar · ${moneyJ(precoBootcamp())}</button><span class="dim evj-mini">${bcM?esc(bcM):`${BOOTCAMP_SEMANAS} semanas com um mentor: XP +${Math.round((BOOTCAMP_MULT-1)*100)}% em tudo.`}</span>`;
  /* momentos */
  const moms=(G.voce.momentos||[]).slice(0,6).map(m=>`<div class="evj-mom ${m.visto?'':'novo'} t-${m.tipo}"><span>${ico(EVJ_IC[m.tipo]||'estrela')}</span>
      <div><b>${esc(m.txt)}</b><span class="dim">${esc(m.sub||'')}${m.sub?' · ':''}sem. ${m.semana}</span></div></div>`).join('');
  const marcoNovo=G.voce.marcoNovo;
  return `${marcoNovo?`<section class="evj-marco"><span>${ico('trofeu')}</span><div><div class="eyebrow">Novo patamar</div><h3>Over ${marcoNovo}</h3>
      <p class="dim">${marcoNovo>=90?'Entre os melhores do mundo.':marcoNovo>=85?'Nível de estrela: os gigantes estão olhando.':marcoNovo>=80?'Nível de titular de Tier 1.':'Um degrau acima.'}</p></div>
      <button class="btn sm" data-evjmarco="1">Seguir</button></section>`:''}
  <section class="card evj">
    <div class="evj-l">
      <div class="eyebrow">Evolução</div>
      <div class="evj-over"><b class="num">${o}</b><div class="evj-ob"><span>até ${o+1}</span><u><i style="width:${pct}%"></i></u></div>
        ${_evjSpark(h.slice(-16),150,44)}</div>
      <div class="evj-marcos">${MARCOS.map(m=>`<i class="${G.voce.marcos&&G.voce.marcos[m]?'on':''} ${m===pm?'prox':''}">${m}</i>`).join('')}
        ${pm?`<span class="dim">próximo marco: <b>${pm}</b> · ${pctM}% do caminho${ganho!=null?` · ${ganho>=0?'+':''}${ganho} em 8 semanas`:''}</span>`:'<span class="dim">todos os marcos</span>'}</div>
      <div class="evj-linha"><div class="evj-bloco"><div class="eyebrow">Foco do split</div>${focoHTML}</div>
        <div class="evj-bloco evj-boot"><div class="eyebrow">Bootcamp com mentor</div>${bcHTML}</div></div>
    </div>
    <div class="evj-r">
      <div class="eyebrow">Desafios · ${G.voce.dzFeitos||0} cumpridos</div>
      <div class="evj-dzs">${dzs||'<p class="dim">Os desafios aparecem no fechamento da semana.</p>'}</div>
      <p class="dim evj-mini">Cada desafio vale meio ponto nos dois atributos marcados, no nível em que você estiver; acima de 85, um pouco mais.</p>
      ${moms?`<div class="eyebrow" style="margin-top:12px">Momentos</div><div class="evj-moms">${moms}</div>`:''}
    </div>
  </section>`;
}

/* ---------- a rotina dos sete dias ---------- */
function rotinaJHTML(p){
  if(!p||typeof planoDoDiaJ!=='function')return '';
  const s=semanaJogador(), t=clubeDoJogador(), jogos=_jogosDoMeuClube(), hoje=G.turno||0, dias=_diaAtivo();
  const nomes=Object.fromEntries(ATIV_JOGADOR.map(a=>[a.id,a.nome]));
  const r=rotinaJ();
  const col=d=>{
    const jogo=jogos.includes(d), feitas=s.feitas.filter(f=>(f.dia||0)===d), plano=planoDoDiaJ(d,jogos);
    const passou=dias&&d<hoje, ehHoje=dias&&d===hoje;
    const fixos=plano.filter(id=>id==='coletivo'||id==='vod');
    const opt=(slot)=>{const v=r[d][slot]||'';
      return `<select data-rjdia="${d}" data-rjslot="${slot}" ${passou?'disabled':''}><option value="">${slot?'—':'descanso'}</option>${ROTINA_J_OPCOES.map(id=>`<option value="${id}" ${v===id?'selected':''}>${esc(nomes[id]||id)}</option>`).join('')}</select>`;};
    return `<div class="rj-dia ${jogo?'jogo':''} ${ehHoje?'hoje':''} ${passou?'passou':''}">
      <div class="rj-cab"><b>${DIAS_CURTO[d]}</b><span class="num">${typeof _dataDoDia==='function'?_dataDoDia(d):''}</span>${ehHoje?'<em>hoje</em>':''}</div>
      ${jogo?`<div class="rj-jogo">${ico('alvo')}<b>Dia de jogo</b><span class="dim">uma atividade, no máximo</span></div>`:''}
      ${fixos.filter(id=>!passou&&!ehHoje&&!feitas.some(f=>f.id===id)).map(id=>`<span class="rj-fixo">${ico(SJ_ICONE[id]||'mira')} ${esc(nomes[id])}<i>${id==='coletivo'?'clube':'véspera'}</i></span>`).join('')}
      ${feitas.length?`<div class="rj-feitas">${feitas.map(f=>`<span class="rj-f ${f.med||''}">${ico('check')} ${esc(nomes[f.id]||f.id)}${f.auto?' <i>rotina</i>':f.simulado?' <i>simulado</i>':f.med?` <i class="evj-med ${f.med}"></i>`:''}</span>`).join('')}</div>`:''}
      ${ehHoje&&!jogo?_rjAgora(plano,feitas):''}
      ${!jogo&&!passou?`<div class="rj-sel">${opt(0)}${(r[d]||[]).length?opt(1):''}</div>`:''}
      ${!jogo&&passou&&!feitas.length?'<span class="dim rj-desc">descanso · +'+ENERGIA_DESCANSO_DIA+' energia</span>':''}
    </div>`;
  };
  return `<section class="card rj"><div class="split"><div><div class="eyebrow">Sua rotina · vale toda semana</div>
      <p class="dim" style="margin:4px 0 0">${dias?'Cada dia que passa roda o que está marcado, simulado (60% do XP). Jogue você mesmo a atividade de hoje para render mais e ganhar medalha. Dia vazio é descanso e devolve energia.'
        :'No fechamento, o assistente roda a rotina da semana inteira, simulada. Marcou algo à mão? Aí a semana é sua.'}
        ${t?' O treino do clube cai no primeiro dia livre e o VOD na véspera do jogo.':''}</p></div>
      <button class="btn ghost sm" data-rjpadrao="1">Rotina padrão</button></div>
    <div class="rj-grade">${Array.from({length:TURNOS_SEMANA},(_,d)=>col(d)).join('')}</div></section>`;
}

/* hoje: o que a rotina marcou, com o atalho para jogar você mesmo */
function _rjAgora(plano,feitas){
  const mini=typeof minigamesLigados!=='function'||minigamesLigados();
  const l=plano.filter(id=>!feitas.some(f=>f.id===id)).map(id=>{
    const a=ativJogador(id);if(!a)return '';
    const m=porqueNaoAtividade(id);
    const bt=a.grupo==='jogavel'?`<button class="btn sm" data-sjjogar="${id}" ${m?'disabled':''}>${ico('jogar')} Jogar</button>`
      :SJ_MINI[id]&&mini?`<button class="btn sm" data-sjmini="${id}" ${m?'disabled':''}>${ico('jogar')} Jogar</button>`:'';
    return `<div class="rj-agora"><b>${esc(a.nome)}</b>${bt}</div>`;}).join('');
  return l?`<div class="rj-agoras"><span class="eyebrow">agora</span>${l}</div>`:'';
}
function ligarEvolucao(v,on){
  on('[data-evjfoco]',el=>{const k=el.dataset.evjfoco;const sel=(_evjFocoSel||focoAtual().slice());
    const i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else{sel.push(k);if(sel.length>2)sel.shift();}
    _evjFocoSel=sel;render();});
  on('[data-evjfocook]',()=>{const r=definirFoco(_evjFocoSel);_evjFocoSel=null;flash(r.ok?r.msg:r.motivo);render();});
  on('[data-evjboot]',()=>{const r=iniciarBootcamp();flash(r.ok?r.msg:r.motivo);render();});
  on('[data-evjmarco]',()=>{G.voce.marcoNovo=null;render();});
  on('[data-rjpadrao]',()=>{voltarRotinaJPadrao();render();});
  v.querySelectorAll('[data-rjdia]').forEach(el=>{el.onchange=()=>{const r=definirRotinaJ(+el.dataset.rjdia,+el.dataset.rjslot,el.value);if(!r.ok)flash(r.motivo);render();};});
}
