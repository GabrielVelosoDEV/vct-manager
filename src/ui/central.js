/* ============================================================
   CENTRAL DE COMANDO — a tela de abertura da carreira (pacote V5)
   ------------------------------------------------------------
   Ordem de leitura, do mais urgente ao que é só contexto:
     1. onde estou na temporada (faixa do circuito, na cor de cada torneio);
     2. quem sou: topo do clube com escudo grande na cor dele;
     3. o que vem: o próximo jogo como cartão de confronto, ao lado da
        tabela da casa;
     4. se o clube está numa chave, a chave compacta logo abaixo;
     5. como está a casa: vestiário em retratos com anel de moral, e a
        sala de imprensa com a manchete ilustrada.
   Só monta HTML. Os cliques genéricos (data-ir, data-avancar) moram em
   events.js; jogadores (.jrow) e clubes (data-tid) já são ligados pelo
   render.
   ============================================================ */

/* posição do clube na tabela que está valendo agora */
function posicaoNaTabela(t,rr){
  if(!rr)return null;
  if(rr.tipo==='grupos'){
    const g=(rr.grupos||[]).find(x=>x.times.includes(t.id));
    if(!g||!g.tabela)return null;
    const ord=ordenarGrupo(g);
    return{pos:ord.indexOf(t.id)+1,de:ord.length,onde:g.nome};
  }
  if(!rr.tabela||!rr.tabela[t.id])return null;
  const rk=rr.ranking&&rr.ranking.length?rr.ranking:ordenarTabela(rr);
  const i=rk.indexOf(t.id);
  return i<0?null:{pos:i+1,de:rk.length,onde:null};
}

function overTitulares(t){
  return Math.round(t.titulares.reduce((s,i)=>s+over(P(i)),0)/Math.max(1,t.titulares.length));
}

/* ---------- 2. topo do clube ---------- */
function heroClube(t,rr){
  const cor=corDoClube(t),ovm=overTitulares(t);
  const pos=posicaoNaTabela(t,rr);
  const nomeTab=rr?((typeof nomeStage==='function'&&nomeStage(rr))||nomeLiga(t)):null;
  const tp=t.temporada||{v:0,d:0};
  const folha=t.elenco.reduce((s,i)=>s+P(i).salario,0);
  return `<section class="cx-hero" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
    <div class="cx-marca" aria-hidden="true">${escudo(t,260)}</div>
    <div class="cx-id">
      <div class="cx-escudo">${escudo(t,104)}</div>
      <div class="cx-tit">
        <div class="eyebrow">${esc(nomeLiga(t))} · temporada ${G.ano}</div>
        <h1 class="cx-nome">${esc(t.nome)}</h1>
        <div class="cx-chips">
          ${pos&&(tp.v+tp.d)>0?`<span class="cx-pos"><b>${pos.pos}º</b> ${pos.onde?esc(pos.onde)+' · ':''}${esc(nomeTab)}</span>`:''}
          <span class="cx-chip"><b class="num">${tp.v}–${tp.d}</b> na temporada</span>
          <span class="cx-chip">forma ${formaRecente(t.id,5)}</span>
        </div>
      </div>
    </div>
    <div class="cx-kpis">
      <div class="kpi"><div class="lb">Over do time</div><div class="vl">${ovm}</div><div class="sb">${t.titulares.length} titulares</div></div>
      <div class="kpi teal"><div class="lb">Entrosamento</div><div class="vl">${Math.round(t.sinergia)}</div><div class="sb">tempo juntos</div></div>
      <div class="kpi"><div class="lb">Prestígio</div><div class="vl">${Math.round(t.prestigio)}</div><div class="sb">${t.tier===1?'Liga principal':'Challengers'}</div></div>
      <div class="kpi ${t.caixa<0?'red':'gold'}"><div class="lb">Caixa</div><div class="vl">${money(t.caixa)}</div><div class="sb">folha ${money(folha)}/mês</div></div>
    </div>
  </section>`;
}

/* ---------- 3. próximo jogo ---------- */
function mapasFortesMeus(t,n){
  const pool=(G.mapasAtivos&&G.mapasAtivos.length?G.mapasAtivos:MAP_POOL);
  if(typeof preparoDoMapa!=='function')return [];
  return pool.map(m=>({mapa:m,v:preparoDoMapa(t,m).nota})).sort((a,b)=>b.v-a.v).slice(0,n||3);
}
function chipMapa(m,texto){
  const fundo=typeof fundoMapa==='function'?fundoMapa(m,0.62):'';
  return `<span class="cx-mapa" style="${fundo}"><b>${esc(m)}</b>${texto!=null?`<i>${esc(String(texto))}</i>`:''}</span>`;
}
function sedeDoStage(s){
  return s&&s.torneioId&&typeof sedeDe==='function'?sedeDe(s.torneioId):null;
}
/* bloco do calendário que ainda não foi montado não tem stage: a sede sai
   pelo nome do bloco e pela liga do clube */
function sedeDoBloco(b,t){
  if(!b||typeof sedeDe!=='function')return null;
  const s0=(b.stages||[]).find(s=>s.torneioId);
  if(s0)return sedeDe(s0.torneioId);
  const n=b.nome||'',r=t.regiao,t2=t.tier===2;
  const id=/^Masters II\b/.test(n)?'masters2':/^Masters I\b/.test(n)?'masters1':/^Champions/.test(n)?'champions'
    :/^Kickoff/.test(n)?'kickoff_'+r:/^Stage 1/.test(n)?(t2?'split1_':'stage1_')+r
    :/^Stage 2/.test(n)?(t2?'split2_':'stage2_')+r:/^Ascension/.test(n)?'asc_'+r:null;
  return id?sedeDe(id):null;
}
function ladoConfronto(x,rotulo){
  const tp=x.temporada||{v:0,d:0};
  return `<div class="vs-lado" style="--clube:${corDoClube(x)}">
    <div class="vs-escudo">${escudo(x,84)}</div>
    <b class="vs-nome">${esc(x.nome)}</b>
    <span class="vs-info"><span class="num">over ${overTitulares(x)}</span> · <span class="num">${tp.v}V ${tp.d}D</span></span>
    ${rotulo?`<span class="vs-rot">${rotulo}</span>`:''}
  </div>`;
}
function cardConfronto(t,px){
  if(!px)return `<div class="card cx-prox"><div class="eyebrow">Próximo compromisso</div>
    ${vazio('<b>Sem jogo marcado.</b> Use o tempo para treino e mercado.','jogar')}</div>`;
  /* sem jogo nesta semana: contagem para o próximo torneio */
  if(px.espera){
    const b=px.espera;
    const sede=sedeDoBloco(b,t);
    return `<div class="card cx-prox cx-espera" ${sede?`style="${fundoCidade(sede.slug,0.82)}"`:''}>
      <div class="eyebrow">Próximo compromisso</div>
      <div class="cx-conta"><span class="num" data-conta>${px.semanas}</span><span>semana${px.semanas===1?'':'s'}</span></div>
      <h3 class="sub" style="margin:0">${esc(nomeBloco(b))}</h3>
      <p class="dim" style="margin:4px 0 0">${rotuloPeriodo(G.ano,b.ini,b.fim)}${sede?' · '+esc(sede.nome):''}</p>
      <p class="dim" style="margin-top:10px">Até lá o elenco treina, quem está machucado se recupera e o mercado continua girando.</p>
      <div class="vs-acoes"><button class="btn ghost sm" data-ir="preparacao">Planejar a semana</button>
        <button class="btn ghost sm" data-ir="mercado">Mercado</button></div>
    </div>`;
  }
  const s=px.stage,sede=sedeDoStage(s);
  const quando=typeof rotuloSemana==='function'?rotuloSemana(G.ano,G.semana||1):'';
  if(px.bye)return `<div class="card cx-prox" ${sede?`style="${fundoCidade(sede.slug,0.7)}"`:''}>
    <div class="eyebrow">Próximo compromisso · ${esc(nomeStage(s))}</div>
    <h3 class="sub">Bye nesta rodada</h3>
    <p class="dim">O clube avança direto e espera o adversário da próxima fase.</p></div>`;
  const adv=T(px.adv);
  const nv=typeof nivelScoutContra==='function'?nivelScoutContra(t,adv):typeof nivelScout==='function'?nivelScout(t):1;
  const deles=typeof leituraPreparo==='function'?leituraPreparo(adv,nv).slice(0,2):[];
  const meus=mapasFortesMeus(t,2);
  const h2h=typeof confronto==='function'?confronto(t.id,adv.id):null;
  return `<div class="card cx-prox cx-vs" ${sede?`style="${fundoCidade(sede.slug,0.74)}"`:''}>
    <div class="split"><div class="eyebrow">Próximo jogo · ${esc(nomeStage(s))}</div>
      <span class="chip">MD${s.bo}</span></div>
    <div class="vs-linha">
      ${ladoConfronto(t,'você')}
      <div class="vs-meio"><span class="vs-vs">VS</span>
        <span class="vs-quando">${esc(quando)}</span>
        ${sede?`<span class="vs-sede">${ico('mapa')}${esc(sede.nome)}</span>`:''}
        ${h2h&&h2h.jogos?`<span class="vs-h2h num">${h2h.vitorias||0}–${h2h.derrotas||0} no histórico</span>`:''}
      </div>
      ${ladoConfronto(adv,'adversário')}
    </div>
    <div class="vs-mapas">
      <div><div class="eyebrow">Seus mapas mais treinados</div>
        <div class="cx-mapas">${meus.map(m=>chipMapa(m.mapa,m.v)).join('')||'<span class="dim">—</span>'}</div></div>
      <div><div class="eyebrow">Onde eles ficam à vontade</div>
        <div class="cx-mapas">${nv>=2&&deles.length?deles.map(m=>chipMapa(m.mapa,m.v!=null?m.v:m.palavra)).join('')
          :'<span class="dim">Sem leitura — o analista precisa melhorar.</span>'}</div></div>
    </div>
    <div class="vs-acoes">
      <button class="btn ghost sm" data-clube="${adv.id}">Ficha do ${esc(adv.tag)}</button>
      <button class="btn ghost sm" data-ir="preparacao">Preparar o jogo</button>
      ${typeof minigamesLigados==='function'&&minigamesLigados()&&typeof vodDisponivel==='function'&&vodDisponivel(t)?'<button class="btn ghost sm" data-quizvod>Revisar o VOD</button>':''}
      <button class="btn sm" data-avancar>Ir para o veto ›</button>
    </div>
  </div>`;
}

/* ---------- 4. a chave do torneio em andamento ---------- */
function cardChaveAtual(px){
  const s=px&&px.stage;
  if(!s||s.tipo!=='de'||typeof chaveDesenhada!=='function')return '';
  const d=chaveDesenhada(s,{compacta:true});
  if(!d)return '';
  return `<div class="card cx-chave"><div class="split">
      <div class="eyebrow">${esc(nomeStage(s))} · ${esc(s.nomeRodada||'chave')}</div>
      <button class="btn ghost sm" data-ir="comp">Ver o torneio ›</button></div>${d}</div>`;
}

/* ---------- 5a. vestiário em retratos ---------- */
function corMental(m){return m>=0.6?'var(--teal)':m>=0.45?'var(--amber)':'var(--red)';}
function retratoComAnel(p,px,extra){
  const m=typeof mentalDe==='function'?mentalDe(p):(p.moral==null?0.6:p.moral);
  return `<button class="vr jrow ${extra||''}" data-p="${p.id}" title="${esc(p.nome)} · moral ${Math.round(m*100)}%">
    <span class="vr-anel" style="--m:${Math.round(m*100)};--cor:${corMental(m)}">${retrato(p,px)}</span>
    <b>${esc(p.nome)}</b><span class="vr-sub">${esc(p.roleAtual||p.role)}${p.lesao?' · <span class="dn">lesão</span>':''}</span>
  </button>`;
}
function cardVestiario(t){
  const chateados=(typeof insatisfeitos==='function')?insatisfeitos(t):[];
  const marca=new Set(chateados.map(x=>x.p.id));
  const tit=t.titulares.map(P).filter(Boolean);
  const res=t.elenco.filter(i=>!t.titulares.includes(i)).map(P).filter(Boolean);
  const mm=tit.length?tit.reduce((s,p)=>s+(typeof mentalDe==='function'?mentalDe(p):p.moral||0.6),0)/tit.length:0.6;
  return `<div class="card cx-vest"><div class="split">
      <div class="eyebrow">Vestiário</div>
      <span class="dim">moral média dos titulares <b class="num" style="color:${corMental(mm)}">${Math.round(mm*100)}%</b></span></div>
    <div class="vr-fila">${tit.map(p=>retratoComAnel(p,58,marca.has(p.id)?'alerta':'')).join('')}</div>
    ${res.length?`<div class="vr-fila res">${res.map(p=>retratoComAnel(p,40,marca.has(p.id)?'alerta':'')).join('')}</div>`:''}
    ${chateados.length?`<div class="vr-conversa">
      ${chateados.slice(0,3).map(({p,motivo})=>`<div class="slot jrow" data-p="${p.id}">
        <span class="n"><b>${esc(p.nome)}</b> <span class="dim">${esc(motivo.texto)}</span></span>
        ${p.promessa?'<span class="chip r">promessa em aberto</span>'
          :(typeof podeConversar==='function'&&podeConversar(p))?'<span class="chip">pode conversar</span>'
          :'<span class="chip dim">conversou há pouco</span>'}</div>`).join('')}
      </div>`:'<p class="dim" style="margin:10px 0 0">Ninguém pedindo conversa.</p>'}
    <div class="vs-acoes"><button class="btn ghost sm" data-ir="vestiario">Abrir o vestiário ›</button></div>
  </div>`;
}

/* ---------- 5b. sala de imprensa ---------- */
function imagemDaNoticia(n,px){
  const p=n.p&&n.p.length?G.jogadores[n.p[0]]:null;
  if(p)return{html:retrato(p,px||92),cor:p.timeId&&G.times[p.timeId]?corDoClube(G.times[p.timeId]):null,cls:'foto'};
  const t=n.t&&n.t.length?G.times[n.t[0]]:null;
  if(t)return{html:escudo(t,px?Math.round(px*0.86):80),cor:corDoClube(t),cls:'escudo'};
  return null;
}
function cardImprensa(){
  const m=manchete();
  const img=m?imagemDaNoticia(m):null;
  const tit=m?(typeof iconizar==='function'?iconizar(esc(m.txt)):esc(m.txt)):'';
  return `<div class="card cx-imprensa"><div class="split"><div class="eyebrow">Sala de imprensa</div>
      <button class="btn ghost sm" data-ir="news">Todas ›</button></div>
    ${m?`<div class="cx-manchete ${m.meu?'me':''}" ${img&&img.cor?`style="--clube:${img.cor};--clube-rgb:${rgbDe(img.cor)}"`:''}>
      ${img?`<div class="cxm-img ${img.cls}">${img.html}</div>`:''}
      <div><div class="eyebrow">Manchete da semana</div><h3 class="sub">${tit}</h3></div></div>`:''}
    <div class="feed">${G.noticias.filter(n=>n.txt&&n.c!=='sistema'&&n!==m).slice(0,7).map(linhaNoticia).join('')
      ||'<div class="dim">Nada por enquanto.</div>'}</div>
  </div>`;
}

/* retrato do manager: o cadastro de coach quando existe, senão a foto enviada */
function retratoManager(px){
  const g=G.manager;if(!g)return '';
  const mm=typeof membroManager==='function'&&membroManager();
  const img=mm?retratoStaff(mm,px)
    :g.foto?`<img class="foto-j" src="${g.foto}" width="${px}" height="${Math.round(px*1.25)}" alt="">`
    :`<span class="mgr-semfoto" style="width:${px}px;height:${Math.round(px*1.25)}px">${icone('mais')}</span>`;
  /* clicar na foto troca a foto, a qualquer momento da carreira */
  return `<button class="mgr-foto" data-mgrfoto title="Trocar a sua foto">${img}<span class="mgr-foto-ed">${icone('caneta')}</span></button>`;
}
function modalFotoManager(){
  const g=G.manager;if(!g)return;
  abrir(`<div class="eyebrow">Você</div><h2 class="sec">Sua foto</h2>
    <div class="mgrf">
      <div class="mgrf-img">${g.foto?`<img src="${g.foto}" alt="">`:`<span>${icone('mais')}<b>sem foto</b></span>`}</div>
      <div class="mgrf-txt"><p class="dim">Aparece na Central, na comissão técnica e na sua ficha de coach.
        A imagem é recortada em 4:5 e guardada dentro do save.</p>
        <div class="mgrf-bts"><label class="btn">Escolher imagem<input type="file" id="mgrFotoIn" accept="image/*" hidden></label>
          ${g.foto?'<button class="btn ghost" id="mgrFotoTira">Tirar a foto</button>':''}
          <button class="btn ghost" data-close>Fechar</button></div></div>
    </div>`);
  const inp=$('#mgrFotoIn');
  if(inp)inp.onchange=async()=>{
    try{const f=await fotoDoArquivo(inp.files[0]);definirFotoManager(f);render();modalFotoManager();flash('Foto atualizada.');}
    catch(e){flash(e.message);}
  };
  const tira=$('#mgrFotoTira');if(tira)tira.onclick=()=>{definirFotoManager(null);render();modalFotoManager();};
}
/* ---------- a tela ---------- */
function vInicio(){
  const t=meu();
  /* qual metade da temporada estamos vivendo; os Challengers usam c1_/c2_ */
  const metade=(G.semana||1)>=25?'2':'1';
  const pre=(t.tier===1?'s':'c')+metade+'_';
  const px=proximoConfronto();
  /* a tabela da casa é a do torneio que o clube está jogando agora (o Kickoff
     também tem grupos); fora dele, a do Stage da metade do ano */
  const rrAgora=px&&px.stage&&(px.stage.tipo==='grupos'||px.stage.tipo==='rr')?px.stage:null;
  /* nos playoffs do Kickoff o Stage 1 ainda não existe: vale a fase de grupos dele */
  const rr=rrAgora||acharStage(pre+t.regiao)||acharStage((t.tier===1?'s1_':'c1_')+t.regiao)
          ||(t.tier===1?acharStage('kg_'+t.regiao):null)
          ||acharStage((t.tier===1?'s2_':'c2_')+t.regiao);
  const sit=typeof situacaoManager==='function'?situacaoManager():null;
  return `${faixaCircuito()}${typeof guiaPassosHTML==='function'?guiaPassosHTML():''}
  ${heroClube(t,rr)}
  ${typeof cardColetiva==='function'?cardColetiva():''}
  ${sit?`<div class="card mgr ${sit.livre?'':sit.tom}">
    <div class="split">
      <div class="mgr-quem">${retratoManager(52)}<div><div class="eyebrow">${esc(G.manager.nome)} · ${esc(sit.papel)}${(()=>{const mm=typeof membroManager==='function'&&membroManager();
          return mm?` · coach <b class="num">${overStaff(mm)}</b>${G.manager.modo==='lenda'?' · lenda':''}`:'';})()}</div>
        <div style="margin-top:4px">${esc(sit.texto)}</div></div></div>
      ${sit.livre?'':`<div class="mgr-conf">${medidor('<span class="dim">confiança</span>',sit.confianca/100,54)}</div>`}
    </div>
    ${sit.demitido?`<div class="mgr-ofertas">
      <div class="eyebrow">Clubes interessados</div>
      ${(sit.ofertas||[]).map(x=>`<button class="btn ghost sm" data-assumir="${x.id}">
        ${escudo(x,18)} ${esc(x.nome)} <span class="dim">${esc(nomeLiga(x))} · prestígio ${Math.round(x.prestigio)}</span>
      </button>`).join('')}</div>`:''}
    ${sit.livre||!sit.metas.length?'':`<div class="mgr-metas">${sit.metas.map(m=>{
      const est=m.cumprida===true?'ok':m.cumprida===false?'nao':'';
      return `<div class="mgr-meta ${est}">${m.peso?'<b>Meta</b>':m.momento==='meio'?'<b>Meio do ano</b>':'<span class="dim">Bônus</span>'}
        <span>${esc(m.texto)}</span></div>`;}).join('')}</div>`}
  </div>`:''}
  <div class="grid g2 cx-linha">
    ${cardConfronto(t,px)}
    ${cardTabelaDaCasa(t,rr)}
  </div>
  ${cardChaveAtual(px)}
  <div class="grid g2 cx-linha">
    ${cardVestiario(t)}
    ${cardImprensa()}
  </div>`;
}
