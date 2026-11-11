/* ============================================================
   ANTES DA PARTIDA — relatório e veto
   ------------------------------------------------------------
   O ritual: você lê o que a sua comissão conseguiu levantar
   sobre o adversário e, com isso na mão, faz os seus bans e
   picks. O relatório vem de scout.js e o veto de veto.js; aqui
   é só a tela.

   A ordem importa. Primeiro o relatório, depois o veto: o
   objetivo é que o analista que você contratou mude o clique
   que você dá. Um clube com analista 1 chuta; um com analista 5
   sabe que mapa o adversário vai banir primeiro.
   ============================================================ */

let PP=null;   /* {comp, V, etapa:'relatorio'|'veto'|'comps'} */

function prePartidaDisponivel(){
  if(!G||!G.meuTime)return null;
  if(typeof compromissoDaSemana!=='function')return null;
  return compromissoDaSemana();
}
/* Ponto de entrada: chamado pelo botão de avançar antes de a semana rodar. */
function abrirPrePartida(comp,depois){
  const meu=G.times[G.meuTime], adv=G.times[comp.advId];
  if(typeof guiaMarcar==='function')guiaMarcar('partida');
  PP={comp,adv,meu,depois,etapa:'relatorio',
      V:iniciarVeto(G.meuTime,comp.advId,comp.bo,comp.euSouA)};
  vetoAvancarAteMim(PP.V);
  ppPintar();
}
function ppFechar(){
  const d=PP&&PP.depois;PP=null;
  const m=$('#modal');if(m)m.innerHTML='';
  if(d)d();
}
/* Segue sem escolher nada: o veto vira automático e a semana roda. */
function ppPular(){
  if(!PP)return;
  const V=PP.V;
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  ppConfirmar();
}
/* Mapa da série sem nenhuma escolha sua: a comissão monta a melhor comp, em
   vez de cada um entrar no boneco que mais joga — que às vezes eram três
   iniciadores e nenhum controlador. O que você escolheu não é tocado. */
function ppCompsAutomaticas(){
  const t=PP.meu;
  for(const x of PP.V.seq){
    if(x.tipo==='ban')continue;
    const c=(t.comps&&t.comps[x.m])||{};
    if(!(t.titulares||[]).some(id=>c[id]))aplicarPreset(t,x.m,'melhor');
  }
}
function ppConfirmar(){
  if(!PP)return;
  const V=PP.V;
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  ppCompsAutomaticas();
  const comp=PP.comp;
  const plano={stageId:comp.stage.id,veto:vetoResultado(V)};
  const d=PP.depois;PP=null;
  const m=$('#modal');if(m)m.innerHTML='';
  /* Com tempo técnico e transmissão ao vivo ligados, a SUA série é jogada
     agora, na tela, round a round — é o que faz o pedido de tempo mudar o que
     vem depois. O resultado pronto desce para o relógio, que roda o resto da
     semana em cima dele. */
  if(Prefs.get('tempoTecnico')&&Prefs.get('aoVivo')&&typeof partidaConduzida==='function'){
    const ctx={stage:comp.stage.id,nome:comp.stage.nome,semana:G.semana};
    const S=abrirSerie(comp.aId,comp.bId,comp.bo,plano.veto);
    partidaConduzida(S,ctx,res=>{
      res.semana=G.semana;
      plano.serieFeita=res;
      if(d)d(plano);
    });
    return;
  }
  if(d)d(plano);
}
/* Lado de início do SEU clube num mapa da sequência. lado0 é sempre do time
   que abriu o veto. */
function ppMeuLado(x){
  if(!x||!x.lado0)return null;
  return PP.V.euSouLado===0?x.lado0:(x.lado0==='atk'?'def':'atk');
}
function ppNomeLado(l){return l==='atk'?'atacando':l==='def'?'defendendo':'—';}
/* O passo de lado: quem não escolheu o mapa decide onde começa. A tela mostra
   a sua força de cada lado naquele mapa e o viés real do mapa. */
function ppLadoHTML(minha){
  const V=PP.V, x=vetoMapaDoLado(V);
  if(!x)return '';
  const atk=forcaTime(PP.meu,x.m,'atk'), def=forcaTime(PP.meu,x.m,'def');
  const vies=(typeof MAPA_ATK!=='undefined'&&MAPA_ATK[x.m])||50;
  const melhor=atk>def?'atk':'def';
  return `<div class="card vt-ladocard" style="${fundoMapa(x.m,0.78)}"><div class="eyebrow">${minha?'Sua vez de escolher o LADO':'Vez do '+esc(PP.adv.tag)+' escolher o lado'} · ${esc(x.m)}</div>
    <div class="dim" style="margin-bottom:8px">${esc(x.m)}: o ataque ganha ${vies}% dos rounds no circuito.
      Seu time é mais forte ${ppNomeLado(melhor)} aqui (ataque ${atk.toFixed(1)} · defesa ${def.toFixed(1)}).</div>
    ${minha?`<div style="display:flex;gap:8px">
      <button class="btn ${melhor==='atk'?'':'ghost'}" data-pplado="atk">${icone('spike')} Começar atacando</button>
      <button class="btn ${melhor==='def'?'':'ghost'}" data-pplado="def">${icone('escudo2')} Começar defendendo</button></div>`
      :'<div class="dim">Eles estão decidindo.</div>'}
  </div>`;
}
function ppEscolher(mapa){
  if(!PP||!PP.V)return;
  if(!vetoMinhaVez(PP.V))return;
  vetoEscolher(PP.V,mapa);
  vetoAvancarAteMim(PP.V);
  ppPintar();
}
function ppIrParaVeto(){if(PP){PP.etapa='veto';ppPintar();}}

/* ---------- desenho ---------- */
function ppPintar(){
  if(!PP)return;
  /* mesma etapa: redesenha no lugar (sem piscar e sem voltar ao topo) */
  const mesma=PP._etapaPintada===PP.etapa;PP._etapaPintada=PP.etapa;
  abrir(PP.etapa==='relatorio'?ppRelatorioHTML():PP.etapa==='comps'?ppCompsHTML():ppVetoHTML(),true,mesma);
  const M=$('#modal');
  M.querySelectorAll('[data-ppmapa]').forEach(b=>b.onclick=()=>ppEscolher(b.dataset.ppmapa));
  M.querySelectorAll('[data-pplado]').forEach(b=>b.onclick=()=>ppEscolher(b.dataset.pplado));
  M.querySelectorAll('[data-pppreset]').forEach(b=>b.onclick=()=>{
    const [mapa,preset]=b.dataset.pppreset.split('|');
    const mapas=mapa==='*'?PP.V.seq.filter(x=>x.tipo!=='ban').map(x=>x.m):[mapa];
    mapas.forEach(m=>aplicarPreset(PP.meu,m,preset));ppPintar();});
  M.querySelectorAll('[data-ppag]').forEach(el=>el.onchange=()=>{
    const [mapa,pid]=el.dataset.ppag.split('|');
    definirAgente(PP.meu,mapa,pid,el.value);ppPintar();});
  const lcomp=M.querySelector('#ppComps');if(lcomp)lcomp.onclick=()=>{ppCompsAutomaticas();PP.etapa='comps';ppPintar();};
  const lvv=M.querySelector('#ppVoltarVeto');if(lvv)lvv.onclick=()=>{PP.etapa='veto';ppPintar();};
  const li=M.querySelector('#ppVeto');if(li)li.onclick=ppIrParaVeto;
  const lp=M.querySelector('#ppPular');if(lp)lp.onclick=ppPular;
  const lc=M.querySelector('#ppOk');if(lc)lc.onclick=ppConfirmar;
  const lv=M.querySelector('#ppVoltar');if(lv)lv.onclick=()=>{PP.etapa='relatorio';ppPintar();};
}
/* ---------- relatório (pacote V7) ----------
   Os dois lados frente a frente: escudos grandes, comparativo em barras
   espelhadas e os mapas como cartas com a imagem e a comp provável em
   retratos. O que o relatório não enxerga aparece como "?" ou como faixa
   listrada (estimativa pela palavra), nunca como número inventado. */
const PP_FORMA_EST={'em alta':85,'regular':69,'oscilando':52,'em baixa':38};
const PP_DESCANSO_EST={'pernas pesadas':20,'rodados':38,'inteiros':60,'descansados':80};
function ppMedia(t,campo){
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  return tit.length?tit.reduce((s,p)=>s+(p[campo]||0),0)/tit.length:0;
}
function ppAprov(c){return c&&(c.v+c.d)?Math.round(c.v/(c.v+c.d)*100):null;}
function ppJogadorPorNome(t,nome){
  return (t.elenco||[]).map(i=>G.jogadores[i]).find(p=>p&&p.nome===nome)||null;
}
function ppRelatorioHTML(){
  const r=relatorioScout(PP.meu,PP.adv,PP.comp.bo);
  const meuT=PP.meu,advT=PP.adv,nv=r.nivel;
  const estrelas=`<span class="rel-niv">${Array.from({length:SCOUT_MAX},(_,i)=>`<i class="${i<nv?'on':''}"></i>`).join('')}</span>`;
  /* comparativo */
  const fM=Math.round(ppMedia(meuT,'forma')*100), dM=Math.round(100-ppMedia(meuT,'fadiga')*100);
  const fA=r.forma.valor!=null?r.forma.valor:PP_FORMA_EST[r.forma.palavra];
  const dA=r.fadiga.valor!=null?100-r.fadiga.valor:r.fadiga.palavra?PP_DESCANSO_EST[r.fadiga.palavra]:null;
  const apM=ppAprov(meuT.temporada), apA=ppAprov(r.campanha);
  const tpM=meuT.temporada||{v:0,d:0};
  const barras=[
    barraEspelho('Força',overTitulares(meuT),overTitulares(advT),{min:55,max:95}),
    barraEspelho('Forma',fM,fA,{estimado:r.forma.valor==null,fb:()=>r.forma.valor!=null?r.forma.valor:r.forma.palavra}),
    barraEspelho('Descanso',dM,dA,{estimado:r.fadiga.valor==null&&dA!=null,fb:()=>r.fadiga.valor!=null?100-r.fadiga.valor:r.fadiga.palavra}),
    barraEspelho('Entrosamento',meuT.sinergia,r.sinergia),
    apM==null&&apA==null?'':barraEspelho('Campanha',apM||0,apA==null?0:apA,
      {fa:()=>tpM.v+'–'+tpM.d,fb:()=>r.campanha.v+'–'+r.campanha.d})
  ].join('');
  /* gente */
  const pc=r.chave?ppJogadorPorNome(advT,r.chave.nome):null;
  const gente=`${r.chave?`<div class="rel-chave">${pc?retrato(pc,64):''}<div>
        <div class="eyebrow">Jogador-chave</div><b>${esc(r.chave.nome)}</b>
        <div class="dim">${esc(r.chave.role)} · over <b class="num">${r.chave.over}</b>${r.chave.acs?' · ACS '+r.chave.acs:''}</div></div></div>`
      :'<div class="dim">Sem leitura do elenco — precisa de analista melhor.</div>'}
    ${r.lesionados?`<div class="rel-linha"><span class="eyebrow">Lesionados</span>${r.lesionados.length
      ?r.lesionados.map(l=>`<span class="chip r">${icone('lesao')} ${esc(l.nome)} · ${l.semanas} sem.</span>`).join('')
      :'<span class="chip g">nenhum</span>'}</div>`:''}
    ${r.h2h&&r.h2h.jogos?`<div class="rel-linha"><span class="eyebrow">Você contra eles</span>
      <b class="num">${r.h2h.vitorias||0}–${r.h2h.derrotas||0}</b><span class="dim">em ${r.h2h.jogos} séries</span></div>`:''}
    ${r.ultimos&&r.ultimos.length?`<div class="rel-linha"><span class="eyebrow">Últimas deles</span>
      ${r.ultimos.map(u=>`<span class="rel-ult ${u.venceu?'v':'d'}" title="${u.venceu?'venceu':'perdeu'} do ${esc(nomeT(u.rival))}">${escudo(T(u.rival),20)}</span>`).join('')}</div>`:''}
    ${r.vetoProvavel?`<div class="rel-linha"><span class="eyebrow">Devem banir</span>${r.vetoProvavel.bans.map(m=>`<span class="rel-mp ban" style="${fundoMapa(m,0.5)}">${esc(m)}</span>`).join('')}</div>
      <div class="rel-linha"><span class="eyebrow">Devem escolher</span>${r.vetoProvavel.picks.map(m=>`<span class="rel-mp pick" style="${fundoMapa(m,0.5)}">${esc(m)}</span>`).join('')}</div>`
      :'<div class="dim" style="margin-top:8px;font-size:12px">Prever o veto deles exige relatório nível 5.</div>'}`;
  /* mapas */
  const mapas=r.mapas.map(m=>`<div class="rel-mapa" style="${fundoMapa(m.mapa,0.66)}">
      <div class="split"><b class="rel-mn">${esc(m.mapa)}</b>${m.valor===null?'<span class="dim">—</span>'
        :`<span class="pill ${m.valor>=1.5?'g':m.valor<=-1.5?'r':''}">${m.valor>0?'+':''}${m.valor.toFixed(1)}</span>`}</div>
      <div class="rel-pal">${m.palavra?esc(m.palavra):'sem leitura'}</div>
      <div class="rel-comp">${m.comp?m.comp.map(c=>`<span title="${esc(c.nome)} · ${esc(c.ag)}">${retratoAgente(c.ag,30)}${c.nivel!==null?`<i class="num">${c.nivel}</i>`:''}</span>`).join('')
        :'<span class="dim">comp desconhecida</span>'}</div></div>`).join('');
  const meio=`<span class="eyebrow">Relatório de scouting</span><b class="ff-vs">VS</b>
    <span class="ff-sub">${esc(nomeStage(PP.comp.stage))} · MD${PP.comp.bo}</span>${estrelas}
    <span class="ff-sub dim">analista ${(meuT.staff.analista||1).toFixed(1)} · olheiro ${(meuT.staff.olheiro||1).toFixed(1)}</span>`;
  return `<div class="dj" ${ppCores()}>
    ${frenteAFrente(meuT,advT,meio,{info:t=>'over '+overTitulares(t)})}
    <div class="rel-resumo">${icone('olho')}<p>${esc(resumoScout(r))}</p></div>
    <div class="grid g2">
      <div class="card flat"><div class="eyebrow">Frente a frente</div><div class="be-lista">${barras}</div>
        ${nv<4?'<p class="dim" style="font-size:11px;margin:8px 0 0">Faixa listrada = estimativa do analista; com relatório melhor vira número.</p>':''}</div>
      <div class="card flat"><div class="eyebrow">Gente</div>${gente}</div>
    </div>
    <div class="card flat"><div class="eyebrow">Mapas deles${r.nivelComp<r.nivel?' · comps parcialmente escondidas (eles fogem do meta)':''}</div>
      <div class="rel-mapas">${mapas}</div>
      ${nv<3?'<p class="dim" style="margin-top:8px">Com analista e olheiro melhores, este relatório traz números em vez de palavras — e, no nível 5, a ordem de veto deles.</p>':''}
    </div>
    ${typeof blocoTorcida==='function'?blocoTorcida(conversaPreJogo(meuT,advT,nomeStage(PP.comp.stage)),{titulo:'A torcida antes do jogo'}):''}
    <div class="split" style="margin-top:14px">
      <button class="btn ghost" id="ppPular">Deixar a comissão vetar</button>
      <button class="btn" id="ppVeto">Ir para o veto de mapas ›</button>
    </div></div>`;
}

/* ---------- veto (pacote V7) ----------
   Todos os mapas do pool ficam na mesa: o ban escurece e risca a carta com
   o escudo de quem baniu; o pick acende na cor de quem escolheu. O que acabou
   de acontecer (o seu clique e a resposta deles) entra com animação curta.
   No topo, a sequência inteira como trilha. */
function ppCores(){return `style="--ca:${corDoClube(PP.meu)};--cb:${corDoClube(PP.adv)}"`;}
function ppDonoDoPasso(p){return p.tipo==='dec'?null:(p.lado===PP.V.euSouLado?PP.meu:PP.adv);}
function ppTrilhaVeto(){
  const V=PP.V;let k=0;
  return `<div class="vt-trilha">${V.passos.map((p,i)=>{
    const dono=ppDonoDoPasso(p),feito=i<V.i,agora=i===V.i&&!V.fim;
    let txt='',cls=p.tipo;
    if(p.tipo==='lado'){
      const x=V.seq[k-1];
      if(feito&&x&&x.lado0){const l0=p.lado===0?x.lado0:(x.lado0==='atk'?'def':'atk');txt=l0==='atk'?'ataque':'defesa';}
    }else{const x=V.seq[k++];if(feito&&x)txt=x.m;}
    const rot={ban:'Ban',pick:'Pick',dec:'Decider',lado:'Lado'}[p.tipo];
    return `<div class="vt-p ${cls} ${feito?'feito':''} ${agora?'agora':''}" ${dono?`style="--clube:${corDoClube(dono)}"`:''}>
      ${dono?escudo(dono,18):'<span class="vt-dec">★</span>'}<span class="vt-r">${rot}</span>${txt?`<b>${esc(txt)}</b>`:''}</div>`;
  }).join('')}</div>`;
}
function ppMesaVeto(minha,passo){
  const V=PP.V,meuT=PP.meu,advT=PP.adv;
  const visto=PP.vistoSeq||0;
  const mostraAdv=(typeof nivelScoutContra==='function'?nivelScoutContra(meuT,advT):nivelScout(meuT))>=3;
  const ordem=V.seq.filter(x=>x.tipo!=='ban');
  const html=V.pool.map(mp=>{
    const i=V.seq.findIndex(x=>x.m===mp),e=i>=0?V.seq[i]:null;
    const novo=e&&i>=visto?' novo':'';
    const atraso=e&&i>=visto?`;--atraso:${((i-visto)*0.32).toFixed(2)}s`:'';
    const meuA=afinidadeElenco(meuT,mp)+(meuT.mapPref[mp]||0)*0.5;
    const advA=afinidadeElenco(advT,mp)+(advT.mapPref[mp]||0)*0.5;
    const vals=`<div class="vt-vals"><span class="${meuA>=2?'up':meuA<=-2?'dn':''}">você ${meuA>0?'+':''}${meuA.toFixed(1)}</span>
      <span>${esc(advT.tag)} ${mostraAdv?(advA>0?'+':'')+advA.toFixed(1):'?'}</span></div>`;
    if(e){
      const dono=e.tipo==='dec'?null:(e.meu?meuT:advT);
      const n=ordem.indexOf(e)+1;
      const corD=dono?corDoClube(dono):'var(--gold)';
      return `<div class="vt-card ${e.tipo}${novo}" style="${fundoMapa(mp,e.tipo==='ban'?0.6:0.45)};--dono:${corD}${atraso}">
        <div class="vt-nome">${esc(mp)}</div>
        ${e.tipo==='ban'?`<div class="vt-x"></div><div class="vt-selo">${dono?escudo(dono,22):''}<span>ban ${esc(e.t)}</span></div>`
          :`<div class="vt-selo">${dono?escudo(dono,22):'★'}<span>${e.tipo==='dec'?'decider':'pick '+esc(e.t)}</span></div>
            <div class="vt-n">Mapa ${n}</div>
            ${e.lado0?`<div class="vt-lado">você começa ${ppNomeLado(ppMeuLado(e))}</div>`:''}`}
      </div>`;
    }
    const pode=minha&&passo&&(passo.tipo==='ban'||passo.tipo==='pick');
    return `<button class="vt-card livre ${pode?'pode '+passo.tipo:''}" data-ppmapa="${esc(mp)}" ${pode?'':'disabled'}
      style="${fundoMapa(mp,0.45)}"><div class="vt-nome">${esc(mp)}</div>${vals}
      ${pode?`<div class="vt-acao">${passo.tipo==='ban'?'banir':'escolher'}</div>`:''}</button>`;
  }).join('');
  PP.vistoSeq=V.seq.length;
  return `<div class="vt-mesa">${html}</div>`;
}
function ppVetoHTML(){
  const V=PP.V;
  const passo=vetoPasso(V);
  const minha=vetoMinhaVez(V);
  const meuT=PP.meu, advT=PP.adv;
  const meio=`<span class="eyebrow">Veto de mapas</span><b class="ff-vs">VS</b>
    <span class="ff-sub">${esc(nomeStage(PP.comp.stage))} · MD${V.bo}</span>
    <span class="ff-sub num">${Math.min(V.i,V.passos.length)}/${V.passos.length}</span>`;
  const aviso=V.fim?`<div class="vt-aviso fim">${icone('check')}<b>Veto encerrado.</b> <span class="dim">Monte as comps ou vá direto para a partida.</span></div>`
    :passo.tipo==='lado'?ppLadoHTML(minha)
    :`<div class="vt-aviso ${minha?(passo.tipo==='ban'?'ban':'pick'):''}">${minha
        ?`<b>${passo.tipo==='ban'?'Sua vez de banir':'Sua vez de escolher o mapa'}</b>
          <span class="dim">${passo.tipo==='ban'?'Tire da mesa o mapa em que eles são mais fortes que você.'
                                               :'Escolha o mapa em que a diferença está do seu lado.'}</span>`
        :`<b>Vez do ${esc(advT.tag)}</b> <span class="dim">Eles estão decidindo.</span>`}</div>`;
  return `<div class="dj" ${ppCores()}>
    ${frenteAFrente(meuT,advT,meio,{px:56,compacto:true})}
    ${ppTrilhaVeto()}
    ${aviso}
    ${ppMesaVeto(minha,passo)}
    <div class="split" style="margin-top:14px">
      <button class="btn ghost" id="ppVoltar">‹ Relatório</button>
      ${V.fim?'<span><button class="btn ghost" id="ppComps">Montar as comps ›</button> <button class="btn" id="ppOk">Jogar a partida ›</button></span>'
             :'<button class="btn ghost" id="ppPular">Deixar a comissão terminar</button>'}
    </div></div>`;
}

/* ---------- comps da série ----------
   Depois do veto você sabe os mapas, e é agora que a comp de cada um importa.
   É a mesma comp da tela Comps (gravada por mapa no clube), só que limitada
   aos mapas desta série e com a comp provável deles ao lado, quando o seu
   analista consegue ler. */
function ppCompsHTML(){
  const V=PP.V, meuT=PP.meu;
  const jogados=V.seq.filter(x=>x.tipo!=='ban');
  const r=relatorioScout(meuT,PP.adv,PP.comp.bo);
  const blocos=jogados.map((x,i)=>{
    const mp=x.m;
    const peso=pesoComp(meuT,mp);
    const deles=(r.mapas.find(m=>m.mapa===mp)||{}).comp;
    const funs={};compEscalada(meuT,mp).forEach(l=>{funs[l.fun]=(funs[l.fun]||0)+1;});
    const buracos=[];
    if(!((funs['Controlador']||0)+(funs['Flex']||0)))buracos.push('sem controlador');
    if(!(funs['Iniciador']||0))buracos.push('sem iniciador');
    const linhas=compEscalada(meuT,mp).map(({p,ag,nivel})=>`<tr>
      <td><b>${esc(p.nome)}</b> <span class="dim" style="font-size:11px">${esc(p.roleAtual||p.role)}</span></td>
      <td class="pp-ag">${retratoAgente(ag,28)}<select data-ppag="${esc(mp)}|${p.id}">
        ${agentesParaComp(p).map(a=>`<option value="${esc(a.nome)}" ${a.nome===ag?'selected':''}
          >${esc(a.nome)} · ${a.nivel}/${a.teto} · meta ${forcaMeta(a.nome)}</option>`).join('')}
      </select></td>
      <td class="c"><span class="num ${nivel>=75?'up':nivel<=45?'dn':'am'}">${Math.round(nivel)}</span></td>
    </tr>`).join('');
    return `<div class="card flat pp-cmapa"><div class="pp-cmapa-topo" style="${fundoMapa(mp,0.6)}"><div class="split">
        <div class="eyebrow">Mapa ${i+1} · ${esc(mp)}${x.lado0?' · você começa '+ppNomeLado(ppMeuLado(x)):''}</div>
        <span class="dim">força da comp <b class="num ${peso>=1.5?'up':peso<=0?'dn':''}">${peso>0?'+':''}${peso.toFixed(2)}</b></span>
      </div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${PRESETS_COMP.map(pr=>
        `<button class="btn ghost sm" data-pppreset="${esc(mp)}|${pr.id}" title="${esc(pr.dica)}">${esc(pr.rot)}</button>`).join('')}</div>
      <table class="wide"><thead><tr><th>Jogador</th><th>Agente</th><th class="c">Sabe</th></tr></thead>
        <tbody>${linhas}</tbody></table>
      ${buracos.length?`<div style="color:var(--red);font-size:12px;margin-top:6px">⚠ ${buracos.join(' · ')}: a comp perde força em todo round</div>`:''}
      <div class="dim" style="font-size:11px;margin-top:6px">${esc(PP.adv.tag)}: ${deles
        ?deles.map(c=>esc(c.ag)+(c.nivel!==null?' '+c.nivel:'')).join(' · ')
        :'comp desconhecida (o relatório precisa de nível 4)'}</div>
    </div>`;
  }).join('');
  return `<div class="dj" ${ppCores()}>${frenteAFrente(meuT,PP.adv,`<span class="eyebrow">Comps da série</span><b class="ff-vs">VS</b><span class="ff-sub">MD${V.bo}</span>`,{px:48,compacto:true})}
    <div class="split" style="margin:8px 0"><p class="dim" style="margin:0">Quem pega o quê em cada mapa. O que você muda aqui fica gravado na comp do mapa, a mesma da tela Comps.</p>
      <button class="btn ghost sm" data-pppreset="*|melhor">Melhor agora nos ${jogados.length} mapas</button></div>
    ${blocos}
    <div class="split" style="margin-top:14px">
      <button class="btn ghost" id="ppVoltarVeto">‹ Veto</button>
      <button class="btn" id="ppOk">Jogar a partida ›</button>
    </div></div>`;
}
