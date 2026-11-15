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

/* ---------- Semana e treinos ----------
   Cada atividade é um cartão com a foto de onde ela acontece (o CT do clube,
   a sala de análise, o mapa da semana, a ranked, a live), o que ela treina
   com a barra do seu atributo, e dois jeitos de fazer: jogando (a gameplay
   ou um minigame do vestiário) ou simulando. */
const SJ_FOTO={coletivo:['estrutura','treino'],vod:['estrutura','analise'],ranked:['cenas','ativ-ranked'],live:['cenas','ativ-stream']};
const SJ_MINI={coletivo:'bootcamp',vod:'vod',utilidade:'enigmas',ranked:'ranked',live:'stream'};
const SJ_ICONE={coletivo:'clube',range:'mira',duelo:'alvo',dm:'caveira',retake:'desarme',utilidade:'mapa',vod:'jogar',agente:'estrela',ranked:'controle',live:'microfone'};
function _sjNomeMapa(id){return (typeof MAP_POOL!=='undefined'&&MAP_POOL.find(m=>m.toLowerCase()===id))||id;}
function _sjFoto(a,t,mapaNome,adv){
  const f=SJ_FOTO[a.id];
  if(f&&typeof cenaFoto==='function'){const h=cenaFoto(f[0],f[1],t,{foco:a.id==='coletivo'?'placa':35});
    if(h)return `<span class="jx-at-foto com-cena">${h}${a.id==='vod'&&adv?`<span class="jx-at-sobre">${escudo(adv,46)}</span>`:''}</span>`;}
  if(['range','duelo','dm','retake','utilidade'].includes(a.id))
    return `<span class="jx-at-foto jx-mapa" style="background-image:${urlCSS(ASSETS.mapa(mapaNome))}"><span class="jx-at-mapa">${esc(mapaNome)}</span></span>`;
  return `<span class="jx-at-foto vazio"><i>${ico(SJ_ICONE[a.id]||'mira')}</i></span>`;
}
/* anel de energia */
function _sjAnel(s){
  const px=132,r=56,c=2*Math.PI*r,pct=clamp(s.energia/Math.max(1,s.ini),0,1),ini=clamp(s.ini/100,0,1);
  const cor=s.energia<30?'var(--red)':s.energia<55?'var(--amber)':'var(--teal)';
  return `<div class="jx-anel"><svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10"/>
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="10" stroke-dasharray="${(c*ini).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 66 66)"/>
    <circle class="jx-anel-v" cx="66" cy="66" r="${r}" fill="none" stroke="${cor}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${(c*pct*ini).toFixed(1)} ${c.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 66 66)"/></svg>
    <div class="jx-anel-t"><b class="num">${Math.round(s.energia)}</b><span>energia</span></div></div>`;
}
/* o atributo que a atividade treina, com o quanto falta para o próximo ponto */
function _sjAtrib(p,k,peso){
  const n=_NOME_ATR()[k]||k, v=Math.round(p.at[k]||0), xp=(p.xp&&p.xp[k])||0, custo=typeof custoPonto==='function'?custoPonto(p.at[k]||0,p):15;
  return `<div class="jx-atr" title="${esc(n)}: ${v} · ${Math.round(xp)}/${Math.round(custo)} de XP até o próximo ponto">
    <span>${esc(n)}${peso>=0.5?' <b>●</b>':''}</span><b class="num">${v}</b><u><i style="width:${Math.round(clamp(xp/custo,0,1)*100)}%"></i></u></div>`;
}
function vJSemana(){
  const p=meuJogador();
  if(!p)return `<div class="card flat">${vazio('<b>Sem jogador nesta carreira.</b>','elenco')}</div>`;
  const s=semanaJogador(), t=clubeDoJogador(), adv=adversarioDaSemana(), rv=nivelDoRival();
  const lab=typeof rotuloSemana==='function'?rotuloSemana(G.ano,G.semana):'Semana '+G.semana;
  const mapaNome=_sjNomeMapa(mapaDoTreino());
  const mini=typeof minigamesLigados!=='function'||minigamesLigados();
  const cor=t?corDoClube(t):'#5a6b7d';
  const card=(a,i)=>{
    const motivo=porqueNaoAtividade(a.id), feitas=vezesFeita(a.id);
    let botoes='';
    if(a.grupo==='jogavel')botoes=`<button class="btn sm" data-sjjogar="${a.id}" ${motivo?'disabled':''}>${ico('jogar')} Jogar</button><button class="btn ghost sm" data-sjsim="${a.id}" ${motivo?'disabled':''}>Simular · 60%</button>`;
    else if(a.id==='agente')botoes='';
    else if(SJ_MINI[a.id]&&mini)botoes=`<button class="btn sm" data-sjmini="${a.id}" ${motivo?'disabled':''}>${ico('jogar')} ${a.id==='coletivo'?'Ir ao treino':'Jogar'}</button><button class="btn ghost sm" data-sjfazer="${a.id}" ${motivo?'disabled':''}>Simular · 60%</button>`;
    else botoes=`<button class="btn sm" data-sjfazer="${a.id}" ${motivo?'disabled':''}>${a.grupo==='clube'?'Ir ao treino':'Fazer'}</button>`;
    const extra=a.id==='duelo'&&rv.over?` Rival de over ${rv.over}.`:a.id==='vod'&&adv?` Adversário: ${esc(adv.nome)}.`:'';
    const tipo=a.grupo==='jogavel'?'gameplay':SJ_MINI[a.id]&&mini?'minigame':'';
    return `<article class="jx-at ${motivo?'off':''} ${feitas?'feita':''}" style="--i:${i}">
      ${_sjFoto(a,t,mapaNome,adv)}
      <div class="jx-at-cab"><span class="jx-at-ic">${ico(SJ_ICONE[a.id]||'mira')}</span><b>${esc(a.nome)}</b>
        <span class="jx-en">${ico('fogo')} ${custoEnergia(a)}</span></div>
      ${tipo?`<span class="jx-tipo ${tipo}">${tipo==='gameplay'?'gameplay':'minigame'}</span>`:''}
      ${feitas?`<span class="jx-feito">${ico('check')} feito${feitas>1?' '+feitas+'×':''}</span>`:''}
      <p class="dim">${esc(a.desc)}${extra}</p>
      ${a.xp?`<div class="jx-atrs">${Object.entries(a.xp).sort((x,y)=>y[1]-x[1]).map(([k,w])=>_sjAtrib(p,k,w)).join('')}</div>`:a.id==='live'?`<div class="jx-atrs jx-live"><span>${ico('estrela')} ${fmtSeg(seguidores())} seguidores</span></div>`:''}
      <div class="jx-at-b">${botoes}</div>
      ${motivo&&!feitas?`<div class="jx-motivo">${esc(motivo)}</div>`:feitas&&!a.unico?'<div class="jx-motivo neutro">repetir rende menos</div>':''}</article>`;
  };
  /* treinar agente: o pool com retrato e familiaridade */
  const ag=ativJogador('agente'), motivoAg=porqueNaoAtividade('agente');
  const pool=[...new Set([...(p.agentes||[]),...((typeof AGENTS!=='undefined'&&AGENTS[p.role])||[])])];
  const agSel=_sjAgSel&&pool.includes(_sjAgSel)?_sjAgSel:pool[0];
  const nv=a=>typeof nivelAgente==='function'?Math.round(nivelAgente(p,a)):0;
  const agentes=`<section class="card jx-ags ${motivoAg?'off':''}"><div class="split"><div><div class="eyebrow">Treinar um agente · ${custoEnergia(ag)} de energia</div>
      <p class="dim">Familiaridade com um agente do seu pool, ou um novo da sua função (com 40 ele entra no pool e o técnico pode escalar).</p></div>
      <div class="jx-at-b"><input type="hidden" id="sjAgente" value="${esc(agSel||'')}"><button class="btn sm" data-sjfazer="agente" ${motivoAg?'disabled':''}>Treinar ${esc(agSel||'')}</button></div></div>
    <div class="jx-ag-grade">${pool.map(a=>{const n=nv(a),meu=(p.agentes||[]).includes(a);return `<button class="jx-ag ${a===agSel?'on':''} ${meu?'':'novo'}" data-sjag="${esc(a)}">
      ${retratoAgente(a,58)}<b>${esc(a)}</b><u><i style="width:${n}%"></i></u><span class="num">${n}</span>${meu?'':'<em>novo</em>'}</button>`;}).join('')}</div>
    ${motivoAg?`<div class="jx-motivo">${esc(motivoAg)}</div>`:''}</section>`;
  const grupo=(g,titulo,sub)=>{const l=ATIV_JOGADOR.filter(a=>a.grupo===g&&a.id!=='agente'&&(g!=='clube'||t));return l.length?`<section class="jx-grupo"><div class="jx-grupo-t"><div class="eyebrow">${titulo}</div>${sub?`<span class="dim">${sub}</span>`:''}</div><div class="jx-at-grade">${l.map(card).join('')}</div></section>`:'';};
  const feitas=s.feitas.map((f,i)=>{const a=ativJogador(f.id);
    return `<div class="jx-tl" style="--i:${i}"><span class="jx-tl-ic">${ico(SJ_ICONE[f.id]||'mira')}</span><div><b>${esc(a?a.nome:f.id)}</b>${f.alvo?` · ${esc(f.alvo)}`:''}
      <span class="dim">${f.simulado?'simulado':f.nota!=null?'nota '+f.nota.toFixed(2):''} · −${f.gasto} energia</span>
      <div class="jx-xp">${Object.entries(f.xp||{}).filter(([,v])=>v>0.05).map(([k,v])=>`<i>${esc(_NOME_ATR()[k]||k)} +${v.toFixed(1)}</i>`).join('')}${f.fam?`<i>familiaridade +${f.fam}</i>`:''}${f.seg?`<i>+${fmtSeg(f.seg)} seguidores</i>`:''}${f.din?`<i>${moneyJ(f.din)}</i>`:''}${Object.entries(f.subiu||{}).map(([k,v])=>`<i class="up">${esc(_NOME_ATR()[k]||k)} +${v}</i>`).join('')}</div></div></div>`;}).join('');
  const u=G.voce.ultimaSemana;
  const foto=t&&typeof cenaFoto==='function'?cenaFoto('estrutura','treino',t,{cls:'cn-direita',foco:'placa'}):(typeof cenaFoto==='function'?cenaFoto('cenas','ativ-ranked',null,{cls:'cn-direita'}):'');
  return `<section class="jx-hero ${foto?'com-cena':''}" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">${foto}
      <div class="jx-hero-in">
        ${_sjAnel(s)}
        <div class="jx-hero-t"><div class="eyebrow">Semana e treinos · ${esc(lab)}</div>
          <h2>${adv?'Semana de jogo':t?'Semana sem jogo':'Ranked e treino por conta própria'}</h2>
          ${adv?`<div class="jx-vs">${t?escudo(t,40):''}<b>${esc(t?t.tag:'')}</b><span>×</span><b>${esc(adv.tag)}</b>${escudo(adv,40)}<i class="dim">over ${overMedioTime(adv)} · ${esc(mapaNome)} no treino</i></div>`
            :`<p class="dim">Treinos no ${esc(mapaNome)}. ${t?'Sem jogo: dá para gastar a energia toda.':'Ranked e lives sobem o radar dos olheiros.'}</p>`}
          <p class="dim jx-hero-nota">Cada atividade gasta energia; o que sobra vira descanso. ${adv?'Abaixo de 40 você chega ao jogo cansado. ':''}Jogar rende mais que simular: o XP sai da sua nota.</p>
          <label class="sj-auto"><input type="checkbox" id="sjAuto" ${G.voce.auto?'checked':''}> Assistente monta a semana se eu não marcar nada</label>
        </div>
        <div class="jx-hero-carta">${typeof cartaJogador==='function'?cartaJogador(p,{w:118}):''}</div>
      </div></section>
    ${grupo('clube','Treino do clube','O técnico conta presença: faltar derruba a forma, e a forma pesa na escalação.')}
    ${grupo('jogavel','Treinos jogáveis','Abrem a gameplay por cima do manager. Esc pausa.')}
    ${grupo('clique','Fora do servidor','Minigames do vestiário: a nota vira XP.')}
    ${agentes}
    <div class="grid g2 cx-linha">
      <div class="card"><div class="eyebrow">Feito nesta semana</div>${feitas?`<div class="jx-tls">${feitas}</div>`:vazio('<b>Nada ainda.</b> '+(G.voce.auto?'Se você avançar assim, o assistente faz uma semana padrão simulada.':'Se você avançar assim, a semana inteira vira descanso.'),'treino')}</div>
      <div class="card"><div class="eyebrow">Semana passada</div>${u?`
        <p>${u.auto?'O assistente montou a semana. ':''}Gastou ${Math.round(u.ini-u.energia)} de ${Math.round(u.ini)} de energia.${u.coletivo===false?' <b class="dn">Faltou ao treino do clube.</b>':''}</p>
        ${u.partidas?`<p>${u.partidas.maps} mapa${u.partidas.maps>1?'s':''} jogado${u.partidas.maps>1?'s':''}: ${_xpTexto(u.partidas.xp)} ${_subiuTexto(u.partidas.subiu)}</p>`:'<p class="dim">Sem partida sua.</p>'}`
        :vazio('<b>A primeira semana ainda não fechou.</b>','grafico')}
        <div class="eyebrow" style="margin-top:14px">Seus atributos</div>
        <div class="jx-atrs jx-atrs-todos">${ATTRS.map(([k])=>_sjAtrib(p,k,0)).join('')}</div></div>
    </div>`;
}
let _sjAgSel=null;

/* ---------- minigames da semana (os do vestiário, na visão do jogador) ----------
   A nota do minigame vira a nota da atividade (core/semana-jogador.js). */
function _sjParceiro(){
  const p=meuJogador(), t=clubeDoJogador();
  const l=t?(t.elenco||[]).filter(i=>i!==p.id).map(i=>G.jogadores[i]).filter(Boolean):[];
  return l.sort((a,b)=>(typeof dupla==='function'?dupla(t,p.id,b.id)-dupla(t,p.id,a.id):0))[0]||null;
}
function jogarMiniDaSemana(id){
  const motivo=porqueNaoAtividade(id);if(motivo){flash(motivo);return;}
  if(typeof abrirMinigame!=='function'){const r=fazerAtividade(id,{simulado:true});flash(r.ok?'Feito.':r.motivo);render();return;}
  const a=ativJogador(id), p=meuJogador(), t=clubeDoJogador(), adv=adversarioDaSemana();
  const mapaNome=_sjNomeMapa(mapaDoTreino());
  const f=SJ_FOTO[id];
  const pseudo={tag:t?t.tag:p.nome,atividadePar:[p.id,(_sjParceiro()||{}).id].filter(Boolean)};
  const J=typeof jogosRitmo==='function'?jogosRitmo(pseudo):{};
  let jogo, titulo, desc, controles;
  if(id==='vod'){
    if(!adv){flash('Sem adversário nesta semana.');return;}
    titulo='Revisão de VOD';desc=`Os VODs do <b>${esc(adv.nome)}</b>: 8 perguntas, ${QZ_SEG} segundos cada. A nota vira visão de jogo e leitura do adversário na partida.`;
    controles=['1','2','3','4','Mouse'];
    jogo=(ctx,fim)=>jogarQuiz(ctx,fim,montarQuiz(qzAdversario(adv),8),{rotulo:adv.tag,cor:corDoClube(adv)});
  }else if(id==='utilidade'){
    titulo='Lineups no '+mapaNome;desc=`Três enigmas de estudo do <b>${esc(mapaNome)}</b> em ${EN_TEMPO} segundos: a leitura do adversário, as smokes do bomb e o mapa embaralhado.`;
    controles=['Mouse'];jogo=(ctx,fim)=>jogarEnigmas(ctx,fim,mapaNome);
  }else{
    const R=J[SJ_MINI[id]];if(!R){const r=fazerAtividade(id,{simulado:true});flash(r.ok?'Feito.':r.motivo);render();return;}
    titulo=R.nome;desc=R.desc;controles=R.teclasTxt;jogo=(ctx,fim)=>jogarRitmo(ctx,R,fim);
  }
  abrirMinigame({
    id:'sj-'+id,titulo,eyebrow:'Semana · '+a.nome,desc,controles,
    fundo:()=>f&&typeof cenaFoto==='function'?cenaFoto(f[0],f[1],t,{cls:'cn-direita',foco:'placa',ansioso:true}):'',
    arte:()=>'',
    vale:()=>!porqueNaoAtividade(id),
    efeitoTxt:()=>`Vale como <b>${esc(a.nome)}</b> desta semana (${custoEnergia(a)} de energia): a nota define o XP, de <b class="dn">30%</b> a <b class="up">140%</b> do normal. Simular rende 60%.`,
    efeitoFeito:res=>{const fx=res.feito;if(!fx)return 'A atividade não pôde ser registrada.';
      return `Rendeu <b class="${fx.mult>=0.6?'up':'dn'}">${Math.round(fx.mult*100)}%</b> do XP: ${_xpTexto(fx.xp)||'—'}${fx.seg?` · +${fmtSeg(fx.seg)} seguidores`:''}${fx.din?` · ${moneyJ(fx.din)}`:''} ${_subiuTexto(fx.subiu)}`;},
    rotuloComissao:'Simular (60%)',msgComissao:'Atividade simulada: rendeu 60% do XP.',
    comissao:()=>{fazerAtividade(id,{simulado:true});render();},
    dica:()=>'',
    registrar:(res,vale)=>{
      if(vale){const r=fazerAtividade(id,{simulado:false,nota:res.nota});if(r.ok)res.feito=r.feito;}
      return typeof registrarRecordeMini==='function'?registrarRecordeMini('sj-'+id,res.pts,res.nota):null;
    },
    jogar:jogo
  });
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
      return `<div class="tl-no ${n?'on':''} ${aberta?'':'fechado'} ${i===5?'assin':''}">
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
  on('[data-sjmini]',el=>jogarMiniDaSemana(el.dataset.sjmini));
  on('[data-sjag]',el=>{_sjAgSel=el.dataset.sjag;render();});
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
  if(typeof ligarLegado==='function')ligarLegado(v,on);
  on('[data-tlcompra]',el=>{const r=comprarTalento(el.dataset.tlcompra);if(!r.ok)flash(r.motivo);render();});
}
