/* ---------- telas ----------
   render() mora em ui/shell.js: é ele que sabe em qual shell estamos.
   Aqui ficam só as funções que devolvem o HTML de cada tela. */

/* faixa do circuito: o calendário inteiro numa linha, com o bloco atual
   destacado e os torneios grandes em ouro. Serve para responder de relance
   "onde estou na temporada e o que vem". */
function faixaCircuito(){
  const grande=b=>/Champions|Masters/.test(b.nome);
  const sem=G.semana||1;
  return `<div class="tl">`+G.calendario.map(b=>{
    const passou=sem>b.fim, agora=sem>=b.ini&&sem<=b.fim;
    const est=passou?'done':agora?'on':'';
    /* A data é o que transforma a faixa de "lista de campeonatos" em
       calendário: sem ela não dá para saber se o Champions é daqui a duas
       semanas ou daqui a cinco meses, e planejar fica impossível. */
    const quando=passou?'encerrado'
      :agora?'semana '+(sem-b.ini+1)+' de '+(b.fim-b.ini+1)
      :'em '+(b.ini-sem)+' sem.';
    return `<div class="tl-item ${est} ${grande(b)?'major':''}">
      <div class="q">${quando}</div>
      <div class="n">${esc(b.nome)}</div>
      <div class="d">${rotuloPeriodo(G.ano,b.ini,b.fim)}</div></div>`;
  }).join('')+`</div>`;
}

function proximoConfronto(){
  const i=blocoDaSemana(G.semana||1);
  const b=i==null?null:G.calendario[i];
  /* A rodada já vem montada pelo motor (s.rodadaAtual): ler dela vale para
     TODOS os formatos. Antes esta função só sabia ler pontos corridos e
     tentava adivinhar o resto por s.vivos, que não existe em grupo nem em
     chaveamento — o resultado é que a Central dizia "esperando o próximo
     torneio" nas semanas em que o clube tinha jogo marcado. */
  if(b)for(const s of b.stages){
    if(s.feito)continue;
    const rd=s.rodadaAtual||[];
    const par=rd.find(x=>x.includes(G.meuTime));
    if(par)return{stage:s,adv:par[0]===G.meuTime?par[1]:par[0]};
    /* segue vivo no torneio mas não joga esta rodada: é bye */
    const vivo=s.tipo==='de'?[...(s.ub||[]),...(s.lb||[]),...(s.fila||[])].includes(G.meuTime)
              :s.tipo==='ko'?(s.vivos||[]).includes(G.meuTime)
              :false;
    if(vivo&&rd.length)return{stage:s,adv:null,bye:true};
  }
  /* Sem jogo nesta semana, o que interessa é QUANDO volta a ter. Antes a tela
     dizia só "sem jogo nesta fase", que não ajuda a decidir nada. */
  const nb=proximoBloco(G.semana||1);
  if(nb)return{espera:nb,semanas:nb.ini-(G.semana||1)};
  return null;
}
/* A tabela que interessa a VOCÊ é a do seu grupo, não a soma dos dois.
   Empilhar Alpha e Omega numa lista só dava um "1º ao 6º" que não existe em
   lugar nenhum: o clube em 5º da lista podia estar em 2º no grupo dele. */
function cardTabelaDaCasa(t,rr){
  if(!rr)return `<div class="card"><div class="eyebrow">${esc(nomeLiga(t))}</div>
    <p class="dim">Tabela ainda não iniciada.</p></div>`;
  if(rr.tipo==='grupos'){
    const g=(rr.grupos||[]).find(x=>x.times.includes(t.id))||(rr.grupos||[])[0];
    if(!g)return `<div class="card"><div class="eyebrow">${esc(nomeLiga(t))}</div>
      <p class="dim">Sorteio ainda não realizado.</p></div>`;
    const ord=ordenarGrupo(g);
    return `<div class="card"><div class="split">
      <div class="eyebrow">${esc(nomeLiga(t))} · ${esc(g.nome)}</div>
      <span class="dim">rodada ${Math.min(rr.idx+1,rr.rodadasMax)}/${rr.rodadasMax}</span></div>
      <table><tbody>${ord.map((id,i)=>{const x=g.tabela[id];
        return `<tr class="${id===t.id?'me':''}"><td class="num">${i+1}</td><td>${timeInline(id,20)}</td>
        <td class="r num">${x.v}-${x.d}</td>
        <td class="r num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td>
        <td class="r">${i<rr.passam?'<span class="chip t">PO</span>':''}</td></tr>`;}).join('')}
      </tbody></table></div>`;
  }
  const rk=rr.ranking.length?rr.ranking:ordenarTabela(rr);
  return `<div class="card"><div class="eyebrow">${esc(nomeLiga(t))}</div>
    <table><tbody>${rk.slice(0,6).map((id,i)=>{const x=rr.tabela[id];
      return `<tr class="${id===t.id?'me':''}"><td class="num">${i+1}</td><td>${timeInline(id,20)}</td>
      <td class="r num">${x.v}-${x.d}</td><td class="r num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td></tr>`;}).join('')
      ||'<tr><td class="dim">Tabela ainda não iniciada.</td></tr>'}</tbody></table></div>`;
}
function vInicio(){
  const t=meu();const R=G.regioes[t.regiao];
  /* os stages de Challengers usam prefixo c1_/c2_, não s1_/s2_ */
  /* Qual metade da temporada estamos vivendo. Ia por índice de bloco, que
     deixou de significar tempo quando o calendário virou semanas. */
  const metade=(G.semana||1)>=25?'2':'1';
  const pre=(t.tier===1?'s':'c')+metade+'_';
  const rr=acharStage(pre+t.regiao)||acharStage((t.tier===1?'s1_':'c1_')+t.regiao)
          ||acharStage((t.tier===1?'s2_':'c2_')+t.regiao);
  const ovm=Math.round(t.titulares.reduce((s,i)=>s+over(P(i)),0)/Math.max(1,t.titulares.length));
  const px=proximoConfronto();
  const sit=typeof situacaoManager==='function'?situacaoManager():null;
  const chateados=(typeof insatisfeitos==='function')?insatisfeitos(t):[];
  return `${faixaCircuito()}
  <div class="eyebrow">Central de comando</div>
  ${chateados.length?`<div class="card flat" style="border-left:4px solid var(--amber)">
    <div class="split"><div class="eyebrow">Vestiário</div>
      <span class="dim">${chateados.length} jogador${chateados.length===1?'':'es'} para conversar</span></div>
    ${chateados.slice(0,4).map(({p,motivo})=>`<div class="slot jrow" data-p="${p.id}">
      <span class="n"><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}
        <div class="dim" style="font-size:11px">${esc(motivo.texto)}</div></span>
      <span class="num ${p.moral>=.6?'up':p.moral>=.45?'am':'dn'}">${Math.round(p.moral*100)}%</span>
      ${p.promessa?'<span class="chip r">promessa em aberto</span>'
        :(typeof podeConversar==='function'&&podeConversar(p))?'<span class="chip">pode conversar</span>'
        :'<span class="chip dim">conversou há pouco</span>'}
    </div>`).join('')}
  </div>`:''}
  ${sit?`<div class="card mgr ${sit.livre?'':sit.tom}">
    <div class="split">
      <div><div class="eyebrow">${esc(G.manager.nome)} · ${esc(sit.papel)}</div>
        <div style="margin-top:4px">${esc(sit.texto)}</div></div>
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
  <div class="hero-t">${escudo(t,64)}<div><h2 class="sec" style="margin:0">${esc(t.nome)}</h2>
  <span class="dim">${esc(nomeLiga(t))} · temporada ${G.ano}</span></div></div>
  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi"><div class="lb">Over do time</div><div class="vl">${ovm}</div><div class="sb">5 titulares</div></div>
    <div class="kpi teal"><div class="lb">Entrosamento</div><div class="vl">${Math.round(t.sinergia)}</div><div class="sb">quanto mais tempo juntos, melhor</div></div>
    <div class="kpi"><div class="lb">Prestígio</div><div class="vl">${Math.round(t.prestigio)}</div><div class="sb">${t.tier===1?'Liga principal':'Challengers'}</div></div>
    <div class="kpi red"><div class="lb">Caixa</div><div class="vl">${money(t.caixa)}</div><div class="sb">Folha ${money(t.elenco.reduce((s,i)=>s+P(i).salario,0))}/mês</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><div class="eyebrow">Próximo compromisso</div>
      ${px&&px.espera?`<h3 class="sub">${esc(px.espera.nome)}</h3>
       <p class="dim">Começa em ${rotuloPeriodo(G.ano,px.espera.ini,px.espera.fim)} —
       ${px.semanas} semana${px.semanas===1?'':'s'} daqui. Até lá o elenco treina, quem está
       machucado se recupera e o mercado continua girando.</p>`
      :px?(px.bye?`<h3 class="sub">Bye</h3><p class="dim">${esc(px.stage.nome)} — avança direto para a próxima fase.</p>`:
      `<div class="hero-t" style="margin-bottom:6px">${escudo(T(px.adv),44)}<h3 class="sub" style="margin:0">${esc(nomeT(px.adv))}</h3></div>
       <p class="dim">${esc(nomeStage(px.stage))} · MD${px.stage.bo}</p>
       <div style="margin-top:10px"><span class="pill">Over ${Math.round(T(px.adv).titulares.reduce((s,i)=>s+over(P(i)),0)/5)}</span>
       <span class="pill">Prestígio ${Math.round(T(px.adv).prestigio)}</span>
       <span class="pill">${T(px.adv).temporada.v}V-${T(px.adv).temporada.d}D</span></div>`)
      :`<h3 class="sub">Sem jogo nesta fase</h3><p class="dim">Use o tempo para treino e mercado.</p>`}
    </div>
    ${cardTabelaDaCasa(t,rr)}
  </div>
  <div class="card"><div class="eyebrow">Sala de imprensa</div>
    ${(()=>{const m=manchete();return m?`<div class="manchete ${m.meu?'me':''}"><div class="eyebrow">Manchete da semana</div>
      <h3 class="sub" style="margin:4px 0 0">${esc(m.txt)}</h3></div>`:'';})()}
    <div class="feed">${G.noticias.filter(n=>n.txt&&n.c!=='sistema').slice(0,9).map(linhaNoticia).join('')||'<div class="dim">Nada por enquanto.</div>'}</div>
  </div>`;
}
function vElenco(){
  const t=meu();
  const tit=t.titulares.map(P),res=t.elenco.filter(i=>!t.titulares.includes(i)).map(P);
  return `<div class="eyebrow">Elenco e escalação</div><h2 class="sec">Line-up</h2>
  <div class="card"><div class="split"><div><div class="eyebrow">Titulares</div>
    <span class="dim">Clique num reserva para trocar. O IGL define leitura de rounds.</span></div>
    <button class="btn ghost sm" id="autoEsc">Escalação automática</button></div>
    <div style="margin-top:12px">${tit.map(p=>`<div class="slot"><span class="tag ${p.role}">${p.role}</span>
      <span class="n"><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''} ${p.igl?'<span class="pill">IGL</span>':''} ${p.lesao?'<span class="pill">Lesionado '+p.lesao+'</span>':''}</span>
      ${ovTag(p)} <button class="btn ghost sm" data-igl="${p.id}">IGL</button>
      <button class="btn ghost sm" data-banco="${p.id}">Banco</button></div>`).join('')}</div>
  </div>
  <div class="card"><div class="eyebrow">Reservas e base</div>
    <div style="margin-top:8px">${res.length?res.map(p=>`<div class="slot"><span class="tag ${p.role}">${p.role}</span>
      <span class="n"><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''} <span class="dim num">${p.idade}a · pot ${p.pot}</span></span>
      ${ovTag(p)} <button class="btn ghost sm" data-tit="${p.id}">Escalar</button></div>`).join(''):'<div class="empty">Sem reservas.</div>'}</div>
  </div>
  <div class="card flat"><div class="eyebrow">Ficha completa</div>
    <table><thead>${THJ}</thead><tbody>${t.elenco.map(i=>linhaJog(P(i),{me:t.titulares.includes(i)})).join('')}</tbody></table>
    <p class="dim" style="margin-top:8px">Linhas destacadas = titulares. Clique num jogador para abrir a ficha.</p></div>`;
}
function vTaticas(){
  const t=meu();
  /* Duas colunas porque são duas coisas: a identidade tática do clube e o que
     os cinco em quadra sabem jogar. Um clube pode gostar de um mapa que o
     elenco atual detesta — e é exatamente isso que a tabela precisa mostrar. */
  const mp=G.mapasAtivos.map(m=>{
    const clube=t.mapPref[m]||0, elenco=afinidadeElenco(t,m), soma=clube*0.6+elenco*0.6;
    return `<tr><td>${m}</td>
      <td class="c"><span class="pill">${clube>0?'+':''}${clube}</span></td>
      <td class="c"><span class="pill ${elenco>=1?'g':elenco<=-1?'r':''}">${elenco>0?'+':''}${elenco.toFixed(1)}</span></td>
      <td><div class="bar"><i style="width:${clamp(50+soma*6,4,100)}%"></i></div></td></tr>`;}).join('');
  return `<div class="eyebrow">Preparação</div><h2 class="sec">Táticas e treino</h2>
  <div class="grid g2">
   <div class="card"><div class="eyebrow">Estilo de jogo</div>
    <label>Agressividade <b class="num" id="lbAg">${t.tatica.agres}</b>/5</label>
    <input type="range" min="1" max="5" value="${t.tatica.agres}" id="agres">
    <p class="dim" style="margin-bottom:12px">Agressivo ganha mais pistols e rounds de ataque, mas perde em retake e sofre em eco.</p>
    <label>Foco tático</label><br>
    <select id="foco">${[['execucao','Execuções coordenadas (ataque)'],['default','Default equilibrado'],['retake','Retakes e pós-plant (defesa)']]
      .map(([k,n])=>`<option value="${k}" ${t.tatica.foco===k?'selected':''}>${n}</option>`).join('')}</select>
    <br><br><label>Intensidade de scrims <b class="num" id="lbSc">${t.tatica.scrim}</b>/5</label>
    <input type="range" min="1" max="5" value="${t.tatica.scrim}" id="scrim">
    <p class="dim">Acima de 3, scrims somam entrosamento e aceleram a evolução; abaixo, poupam o elenco. Intensidade alta acumula fadiga, e acima de 82 de fadiga o jogador perde moral e pode quebrar.</p>
   </div>
   <div class="card"><div class="eyebrow">Bloco de treino</div>
    <select id="treino">${[['mira','Mira e duelo (mira, reflexo)'],['utilidade','Utilidade e movimentação'],
      ['tatica','Leitura e chamada (visão, liderança)'],['mental','Mental e consistência'],['geral','Geral (equilibrado)']]
      .map(([k,n])=>`<option value="${k}" ${t.tatica.treino===k?'selected':''}>${n}</option>`).join('')}</select>
    <p class="dim" style="margin-top:8px">O treino direciona onde os jogadores evoluem rumo ao potencial. Jovens ganham muito mais que veteranos.</p>
    <div class="eyebrow" style="margin-top:18px">Comissão técnica</div>
    ${comissaoDe(t).map(({cargo,membro})=>`<div class="slot">
       ${membro?retratoStaff(membro,30):''}
       <span class="n">${membro?`<b>${esc(membro.nome)}</b> ${bandeira(membro.pais)}
         <div class="dim" style="font-size:11px">${cargo.nome}${membro.nomeReal?' · '+esc(membro.nomeReal):''} · ${membro.idade}a · ${money(membro.salario)}/mês</div>`
         :`<b class="dn">${cargo.nome} vago</b><div class="dim" style="font-size:11px">a vaga vale nível 1</div>`}</span>
       <span class="ov ${ovClass(membro?overStaff(membro):40)}">${membro?overStaff(membro):'—'}</span>
       ${membro?`<button class="btn ghost sm" data-fichastaff="${membro.id}">Ficha</button>`:''}
      </div>`).join('')}
    ${(t.equipeExtra||[]).map(x=>`<div class="slot">
       ${retratoStaff(x,30)}
       <span class="n"><b>${esc(x.nome)}</b> ${x.pais?bandeira(x.pais):''}
         <div class="dim" style="font-size:11px">${esc(x.funcao||'Equipe')}${x.nomeReal?' · '+esc(x.nomeReal):''}</div></span>
      </div>`).join('')}
    <p class="dim" style="margin-top:6px">Comissão não se compra com upgrade: contrate no
    <b>Mercado › Comissão</b>. Nível ${NIVEL_NEUTRO} é o ponto neutro — acima ajuda, abaixo
    atrapalha. A escala é do mundo inteiro: o Tier 1 vive acima do neutro, e no Challengers
    dá para passar dele contratando bem.</p>
    <div class="eyebrow" style="margin-top:14px">Estrutura</div>
    ${[['gh','Gaming house'],['treino','Centro de treino'],['academia','Academia de base']].map(([k,n])=>
      `<div class="slot"><span class="n">${n} <b class="num">nv ${t.estrutura[k]}</b></span>
       <button class="btn ghost sm" data-up="estrutura.${k}" ${t.estrutura[k]>=5?'disabled':''}>Melhorar ${money(custoUpgrade(t.estrutura[k]))}</button></div>`).join('')}
   </div>
  </div>
  <div class="card flat"><div class="eyebrow">Rotação de mapas · afinidade do time</div>
   <table><thead><tr><th>Mapa</th><th class="c">Clube</th><th class="c">Elenco</th><th>Conforto</th></tr></thead><tbody>${mp}</tbody></table>
   <p class="dim" style="margin-top:8px"><b>Clube</b> é a identidade tática, editável no Banco de dados.
   <b>Elenco</b> é a média dos cinco titulares — muda quando você troca de escalação e evolui
   conforme cada jogador vai bem ou mal em cada mapa.</p>
   <p class="dim" style="margin-top:8px">Oito mapas em rotação, como no circuito de 2026.
   Ela guia o veto de bans e picks — e em <b>Comps</b> você decide quem pega qual agente em cada um.</p></div>`;
}

/* ============================================================
   COMPS — quem pega qual agente, mapa a mapa
   ============================================================ */
let compMapa=null;
function mapaDaTelaComps(){
  const pool=G.mapasAtivos||[];
  if(compMapa&&pool.includes(compMapa))return compMapa;
  return pool[0]||null;
}
function vComps(){
  const t=meu();
  const mapa=mapaDaTelaComps();
  const pool=G.mapasAtivos||[];
  if(!mapa)return `<h2 class="sec">Comps</h2><div class="card flat">Sem mapas em rotação.</div>`;

  /* ---- abas de mapa: a comp é POR MAPA, então o mapa é a primeira escolha ---- */
  const abas=pool.map(mp=>{
    const escolhidos=Object.keys((t.comps&&t.comps[mp])||{}).length;
    return `<button class="btn ${mp===mapa?'':'ghost'} sm" data-compmapa="${esc(mp)}">${esc(mp)}
      ${escolhidos?`<span class="chip">${escolhidos}</span>`:''}</button>`;
  }).join(' ');

  const linhas=compEscalada(t,mapa).map(({p,ag,nivel,fun})=>{
    const escolhido=((t.comps&&t.comps[mapa])||{})[p.id];
    const pool2=agentesParaComp(p);
    const fx=faixaMeta(ag);
    const foraDaFuncao=fun!==(p.roleAtual||p.role)&&fun!=='Flex'&&(p.roleAtual||p.role)!=='Flex';
    return `<tr>
      <td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}
        <div class="dim" style="font-size:11px">${esc(p.roleAtual||p.role)}</div></td>
      <td class="c"><span class="ov ${ovClass(over(p))}">${over(p)}</span></td>
      <td>
        <select data-compag="${p.id}">
          ${pool2.map(a=>`<option value="${esc(a.nome)}" ${a.nome===ag?'selected':''}
            >${esc(a.nome)} · ${a.nivel}/${a.teto} · ${esc(faixaMeta(a.nome).rot)}</option>`).join('')}
        </select>
        ${escolhido?'':'<div class="dim" style="font-size:10.5px">automático</div>'}
      </td>
      <td class="c"><span class="num ${nivel>=75?'up':nivel<=45?'dn':'am'}">${Math.round(nivel)}</span></td>
      <td class="c"><span class="pill ${fx.id==='topo'||fx.id==='forte'?'g':fx.id==='esq'?'r':''}"
        >${forcaMeta(ag)}</span></td>
      <td class="dim">${foraDaFuncao?'<span class="chip r">fora da função</span>':esc(fx.rot)}</td>
    </tr>`;
  }).join('');

  /* ---- o que a comp vale, dito em português ---- */
  const peso=pesoComp(t,mapa), surp=surpresaDaComp(t,mapa);
  const linhasC=compEscalada(t,mapa);
  const funs={};linhasC.forEach(l=>{funs[l.fun]=(funs[l.fun]||0)+1;});
  const usados={};linhasC.forEach(l=>{usados[l.ag]=(usados[l.ag]||0)+1;});
  const alertas=[];
  if(!((funs['Controlador']||0)+(funs['Flex']||0)))alertas.push('sem controlador: ninguém fecha o site');
  if(!(funs['Iniciador']||0))alertas.push('sem iniciador: entrar num site vai custar caro');
  for(const a in usados)if(usados[a]>1)alertas.push(usados[a]+' jogadores em '+a);

  /* ---- o meta de hoje ---- */
  const porFuncao=['Duelista','Iniciador','Controlador','Sentinela'].map(r=>
    `<div class="slot"><span class="n"><b>${r}</b>
      <div class="dim" style="font-size:11px">${topoDoMeta(r,3).map(a=>esc(a)+' '+forcaMeta(a)).join(' · ')}</div></span></div>`).join('');
  const patches=(G.patches||[]).slice(0,4).map(pt=>
    `<div class="slot"><span class="n"><b>${pt.ano} · semana ${pt.semana}</b>
      <div class="dim" style="font-size:11px">${pt.mudou.map(x=>
        (x.tipo==='nerf'?'▼ ':'▲ ')+esc(x.ag)+' '+x.de+'→'+x.para).join(' · ')||'sem mudanças'}</div></span></div>`).join('')
    ||'<div class="dim">Nenhum patch ainda nesta temporada.</div>';

  return `<div class="eyebrow">Preparação</div><h2 class="sec">Comps de agente</h2>
  <div class="card"><div class="split">
    <div><div class="eyebrow">Mapa</div>
      <div class="dim">A comp é por mapa: o que serve em ${esc(pool[0]||'')} não serve no resto.</div></div>
    <div>${PRESETS_COMP.map(pr=>`<button class="btn ghost sm" data-preset="${pr.id}"
      title="${esc(pr.dica)}">${esc(pr.rot)}</button>`).join(' ')}
      <button class="btn ghost sm" data-presettodos="meta" title="Aplica o preset Meta em todos os mapas da rotação">Meta em todos</button></div>
  </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${abas}</div>
  </div>

  <div class="card flat"><div class="split">
    <div class="eyebrow">${esc(mapa)} · quem pega o quê</div>
    <span class="dim">força da comp <b class="num ${peso>=1.5?'up':peso<=0?'dn':''}">${peso>0?'+':''}${peso.toFixed(2)}</b>
      · surpresa <b class="num">${Math.round(surp*100)}%</b></span>
  </div>
    <table class="wide"><thead><tr><th>Jogador</th><th class="c">Over</th><th>Agente</th>
      <th class="c">Sabe</th><th class="c">Meta</th><th>Situação</th></tr></thead>
    <tbody>${linhas}</tbody></table>
    ${alertas.length?`<p class="dim" style="margin-top:8px;color:var(--red)">⚠ ${alertas.map(esc).join(' · ')}</p>`:''}
    <p class="dim" style="margin-top:8px"><b>Sabe</b> é a familiaridade do jogador com aquele agente
    (sobe treinando em <b>Treino</b>, cai com abandono). <b>Meta</b> é o quanto o boneco vale hoje —
    e muda a cada patch. Escalar alguém num agente que ele nunca treinou custa caro; treinar antes
    é o caminho. Fugir do meta perde força de round e ganha <b>surpresa</b>, que corta a vantagem
    do analista adversário no relatório sobre você.</p>
  </div>

  <div class="grid g2">
    <div class="card"><div class="eyebrow">O meta de hoje</div>${porFuncao}
      <p class="dim" style="margin-top:6px">A força de largada vem da taxa de escolha real das três
      ligas no Stage 2 de 2026 (vlr.gg). Dali em diante, quem domina leva nerf.</p></div>
    <div class="card"><div class="eyebrow">Últimos patches</div>${patches}
      <p class="dim" style="margin-top:6px">Quatro patches por ano. O que está sendo escolhido por
      todo mundo desce, e alguém esquecido vira o novo topo — quem treinou na hora certa sai na
      frente.</p></div>
  </div>`;
}
/* Agentes que podem ser oferecidos na comp: os mains dele, os da função dele e
   os do topo do meta da função — para o alvo de treino estar sempre à vista. */
function agentesParaComp(p){
  const fun=p.roleAtual||p.role;
  const pool=[...(p.agentes||[]),...(agentesDe(fun)||[]),...topoDoMeta(fun,3)]
    .filter((a,i,arr)=>arr.indexOf(a)===i);
  return pool.map(nome=>({nome,nivel:Math.round(nivelAgente(p,nome)),teto:tetoAgente(p,nome)}))
    .sort((a,b)=>(forcaMeta(b.nome)+b.nivel*0.5)-(forcaMeta(a.nome)+a.nivel*0.5));
}

let compAba='minha';
function vComp(){
  const bi=blocoDaSemana(G.semana||1);
  const b=bi==null?null:G.calendario[bi];
  const t=meu();
  const abas=[['minha','Minha região'],...REGIONS.filter(r=>r.id!==t.regiao).map(r=>[r.id,r.nome.replace('VCT ','')]),['INT','Internacional'],['pts','Corrida ao Champions']];
  let corpo='';
  if(compAba==='pts'){
    corpo=REGIONS.map(R=>{
      const rk=G.regioes[R.id].t1.slice().sort((x,y)=>(G.regioes[R.id].pontos[y]||0)-(G.regioes[R.id].pontos[x]||0));
      return `<div class="card flat"><div class="eyebrow">${R.nome}</div><table><thead><tr><th>#</th><th>Equipe</th><th class="r">Pontos</th></tr></thead>
      <tbody>${rk.map((id,i)=>`<tr class="${id===t.id?'me':''}${i<4?'':''}"><td class="num">${i+1}</td><td>${esc(nomeT(id))} ${i<4?'<span class="chip g">Champions</span>':''}</td>
      <td class="r num">${G.regioes[R.id].pontos[id]||0}</td></tr>`).join('')}</tbody></table></div>`;
    }).join('');
  }else{
    const alvo=compAba==='minha'?t.regiao:compAba;
    const sts=[];
    G.calendario.forEach(bl=>bl.stages.forEach(s=>{if(s.regiao===alvo)sts.push(s);}));
    /* Em disputa primeiro, encerrados depois e do mais recente para o mais
       antigo. Empilhar na ordem do calendário obrigava a rolar por cima do
       Kickoff de janeiro para chegar ao torneio de setembro que está
       acontecendo agora. */
    const sem=G.semana||1;
    const ini=x=>{const bl=blocoDoStage(x);return bl?bl.ini:0;};
    sts.sort((x,y)=>(x.feito?1:0)-(y.feito?1:0)
      ||(x.feito?ini(y)-ini(x):ini(x)-ini(y)));
    corpo=sts.length?sts.map(x=>x.feito&&ini(x)<sem-6
      ?`<details class="stg-old"><summary>${esc(nomeStage(x))} <span class="dim">${
         x.ranking&&x.ranking[0]?'· campeão '+esc(tagT(x.ranking[0])):''}</span></summary>${renderStage(x)}</details>`
      :renderStage(x)).join('')
      :'<div class="empty">Nada agendado ainda para esta região.</div>';
  }
  return `<div class="eyebrow">Circuito ${G.ano}</div><h2 class="sec">${esc(b?b.nome:'')}</h2>
  <div class="tabs">${abas.map(([k,n])=>`<button data-ca="${k}" class="${compAba===k?'on':''}">${n}</button>`).join('')}</div>${corpo}`;
}
function renderStage(s){
  const t=meu();
  const corpo=s.tipo==='grupos'?corpoGrupos(s,t)
             :s.tipo==='de'?corpoChave(s,t)
             :s.tipo==='swiss'?corpoSwiss(s,t)
             :s.tipo==='rr'?corpoTabela(s,t)
             :corpoMataMata(s,t);
  return `<div class="card flat">${cabecaTorneio(s)}${corpo}${rodapeMVP(s)}</div>`;
}
/* ---------- cabeçalho: o que é este torneio ----------
   Antes o stage era só uma tabela solta. Data, formato, quem disputa e quanto
   paga são o que transformam "uma lista de jogos" em campeonato. */
function blocoDoStage(s){
  return G.calendario.find(b=>b.stages.includes(s))||null;
}
function descreverFormato(s){
  if(s.tipo==='grupos')return (s.grupos||[]).length+' grupos de '+
    ((s.grupos&&s.grupos[0]&&s.grupos[0].times.length)||0)+', passam '+s.passam+' de cada · MD'+s.bo;
  if(s.tipo==='de')return 'Dupla eliminação · '+s.times.length+' equipes · MD'+s.bo+', grande final MD5';
  if(s.tipo==='swiss')return 'Fase suíça · '+s.rodadasMax+' rodadas · MD'+s.bo;
  if(s.tipo==='rr')return 'Pontos corridos · turno único · MD'+s.bo;
  return 'Mata-mata · MD'+s.bo;
}
function estadoStage(s){
  /* Fase de grupos e fase suíça não têm campeão: elas classificam. Chamar o
     primeiro colocado de campeão da fase de grupos é dizer uma coisa errada
     numa tela que existe para informar. */
  if(s.feito&&(s.tipo==='grupos'||s.tipo==='swiss'))
    return{cls:'t',txt:'Classificados: '+(s.classificados||[]).map(tagT).slice(0,4).join(', ')+
      ((s.classificados||[]).length>4?'…':'')};
  if(s.feito)return{cls:'t',txt:s.ranking&&s.ranking[0]?'Campeão: '+tagT(s.ranking[0]):'Encerrado'};
  if(s.tipo==='grupos')return{cls:'',txt:'Rodada '+Math.min(s.idx+1,s.rodadasMax)+'/'+s.rodadasMax};
  if(s.tipo==='swiss')return{cls:'',txt:'Rodada '+Math.min(s.idx+1,s.rodadasMax)+'/'+s.rodadasMax};
  if(s.tipo==='de')return{cls:'',txt:s.nomeRodada||'Em disputa'};
  if(s.tipo==='rr')return{cls:'',txt:'Rodada '+(s.idx+1)+'/'+s.rodadas.length};
  return{cls:'',txt:'Em disputa'};
}
function cabecaTorneio(s){
  const b=blocoDoStage(s), tn=torneio(s.torneioId);
  const est=estadoStage(s);
  const premio=premiosDoStage(s)[0]||0;
  return `<div class="split">
    <div class="eyebrow">${arteTorneio(tn,22)} ${esc(nomeStage(s))}</div>
    <span class="chip ${est.cls}">${esc(est.txt)}</span></div>
  <div class="tn-info">
    ${b?`<span>${rotuloPeriodo(G.ano,b.ini,b.fim)}</span>`:''}
    <span>${esc(descreverFormato(s))}</span>
    ${premio&&s.tipo!=='grupos'&&s.tipo!=='swiss'
      ?`<span class="gold">${money(premio)} ao campeão</span>`
      :premio?`<span class="dim">classificatória · quem paga é o mata-mata</span>`:''}
    <span>${s.times.length} equipes</span>
  </div>`;
}
/* ---------- MVP ---------- */
function rodapeMVP(s){
  const r=typeof resumoMVP==='function'?resumoMVP(s):null;
  if(!r)return '';
  return `<div class="mvp-box">
    <div class="mvp-sel">${r.p.aposentado?'':retrato(r.p,44)}</div>
    <div>
      <div class="eyebrow gold">Melhor jogador do torneio</div>
      <div class="mvp-nome">${esc(r.p.nome)} ${FLAG[r.p.pais]||''}
        <span class="dim">${r.time?esc(r.time.tag):''} · ${esc(r.p.role)}${
          r.p.aposentado?' · já aposentado':''}</span></div>
      <div class="dim">${r.acs} de ACS · ${r.kd} de K/D · melhor em quadra ${r.mvps}×
        em ${r.maps} mapas</div>
    </div></div>`;
}
/* ---------- fase de grupos ---------- */
function corpoGrupos(s,t){
  const grupos=(s.grupos||[]).map(g=>{
    const ord=ordenarGrupo(g);
    return `<div class="gr">
      <div class="gr-tit">${esc(g.nome)}</div>
      <table><tbody>${ord.map((id,i)=>{
        const x=g.tabela[id];
        return `<tr class="${id===t.id?'me':''} ${i<s.passam?'passa':''}">
          <td class="num">${i+1}</td><td>${timeInline(id,20)}</td>
          <td class="r num">${x.v}-${x.d}</td>
          <td class="r num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td></tr>`;}).join('')}
      </tbody></table></div>`;
  }).join('');
  return `<div class="grades">${grupos}</div>
    <p class="dim" style="margin-top:6px">Os ${s.passam} primeiros de cada grupo vão aos playoffs.</p>
    ${sorteioBox(s)}`;
}
/* O sorteio fica guardado: dá para conferir de que pote saiu cada clube, que é
   metade da graça de ter sorteio. */
function sorteioBox(s){
  if(!s.sorteio||!s.sorteio.length)return '';
  const potes={};
  s.sorteio.forEach(x=>{(potes[x.pote]=potes[x.pote]||[]).push(x);});
  return `<details class="sorteio"><summary>Sorteio</summary>
    <table><tbody>${Object.keys(potes).map(k=>`<tr>
      <td class="dim">Pote ${k}</td>
      <td>${potes[k].map(x=>`<span class="pill">${esc(tagT(x.time))} <span class="dim">${x.grupo}</span></span>`).join(' ')}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim">Os melhores classificados entram no pote 1 e não podem cair no mesmo grupo.</p>
  </details>`;
}
/* ---------- chaveamento de dupla eliminação ---------- */
function cartaoJogo(j,t){
  const vA=j.v===j.a;
  return `<div class="jg">
    <div class="jg-l ${vA?'w':''} ${j.a===t.id?'me':''}"><span>${esc(tagT(j.a))}</span><b>${j.wa}</b></div>
    <div class="jg-l ${vA?'':'w'} ${j.b===t.id?'me':''}"><span>${esc(tagT(j.b))}</span><b>${j.wb}</b></div>
  </div>`;
}
function corpoChave(s,t){
  const linha=(fase,rot)=>{
    const cols=(s.chave||[]).filter(r=>r.fase===fase);
    if(!cols.length)return '';
    return `<div class="ch-lin"><div class="ch-rot">${rot}</div>
      <div class="ch-cols">${cols.map(r=>`<div class="ch-col">
        <div class="ch-nome">${esc(r.nome)}</div>
        ${r.jogos.map(j=>cartaoJogo(j,t)).join('')||'<div class="dim">bye</div>'}
      </div>`).join('')}</div></div>`;
  };
  /* o que está para acontecer agora, para o chaveamento não parecer parado */
  const pend=(!s.feito&&s.rodadaAtual&&s.rodadaAtual.length)?`
    <div class="ch-lin"><div class="ch-rot on">A jogar</div>
      <div class="ch-cols"><div class="ch-col"><div class="ch-nome">${esc(s.nomeRodada||'')}</div>
      ${s.rodadaAtual.map(([a,b])=>`<div class="jg prox">
        <div class="jg-l ${a===t.id?'me':''}"><span>${esc(tagT(a))}</span><b>·</b></div>
        <div class="jg-l ${b===t.id?'me':''}"><span>${esc(tagT(b))}</span><b>·</b></div>
      </div>`).join('')}</div></div></div>`:'';
  const vazio=!(s.chave||[]).length&&!pend;
  return `<div class="chave">
    ${linha('ub','Chave superior')}
    ${linha('lb','Chave inferior')}
    ${linha('gf','Grande final')}
    ${pend}
    ${vazio?'<div class="dim">O chaveamento sai quando a fase de grupos terminar.</div>':''}
  </div>
  <p class="dim" style="margin-top:4px">Dupla eliminação: perder uma vez manda para a chave inferior, perder duas elimina.</p>`;
}
/* ---------- fase suíça ---------- */
function corpoSwiss(s,t){
  const ord=s.feito&&s.ranking.length?s.ranking:ordenarSwiss(s);
  return `<table><thead><tr><th>#</th><th>Equipe</th><th class="r">Campanha</th><th class="r">Mapas</th></tr></thead>
    <tbody>${ord.map((id,i)=>{const su=s.suico[id],x=s.tabela[id];
      return `<tr class="${id===t.id?'me':''}"><td class="num">${i+1}</td><td>${timeInline(id,20)}</td>
      <td class="r num">${su.v}-${su.d}</td><td class="r num dim">${x.mv}-${x.md}</td></tr>`;}).join('')}
    </tbody></table>
    <p class="dim" style="margin-top:6px">Cada rodada junta quem tem a mesma campanha. Todos avançam — o que a fase decide é o chaveamento.</p>`;
}
/* ---------- pontos corridos (formato antigo, ainda usado por saves velhos) ---------- */
function corpoTabela(s,t){
  const rk=s.ranking.length?s.ranking:ordenarTabela(s);
  return `<table><thead><tr><th>#</th><th>Equipe</th><th class="r">V-D</th><th class="r">Mapas</th><th class="r">Rounds</th></tr></thead>
    <tbody>${rk.map((id,i)=>{const x=s.tabela[id];return `<tr class="${id===t.id?'me':''}"><td class="num">${i+1}</td>
    <td>${timeInline(id,20)}</td>
    <td class="r num">${x.v}-${x.d}</td><td class="r num dim">${x.mv}-${x.md}</td>
    <td class="r num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td></tr>`;}).join('')}</tbody></table>`;
}
function corpoMataMata(s,t){
  const rk=s.ranking.length?s.ranking:s.vivos;
  return `<div style="margin:8px 0">${rk.map((id,i)=>`<span class="pill ${id===t.id?'me':''}">${s.feito?(i+1)+'º ':''}${esc(tagT(id))}</span> `).join('')}</div>
    ${s.resultados.length?`<table><thead><tr><th>Confronto</th><th class="c">Placar</th><th>Mapas</th></tr></thead><tbody>
      ${s.resultados.slice(-12).reverse().map(r=>`<tr><td>${esc(nomeT(r.a))} × ${esc(nomeT(r.b))}</td>
      <td class="c num"><b>${r.wa}-${r.wb}</b></td><td class="dim num">${esc(r.mapa)}</td></tr>`).join('')}</tbody></table>`:''}`;
}

/* ============================================================
   TREINO — o plano da semana
   ------------------------------------------------------------
   É aqui que a temporada é construída. Medindo (tools/decisoes.mjs), os
   fatores que mais decidem uma partida eram todos automáticos: fadiga, forma,
   posição, moral. Esta tela devolve os dois primeiros para as suas mãos,
   jogador por jogador, e põe o treino de mapa em separado — porque banir bem
   no veto só significa algo se o seu pool for construído por você.
   ============================================================ */
function vTreino(){
  const t=meu();
  const pl=planoDe(t);
  const px=proximoConfronto();
  const adv=px&&px.adv?T(px.adv):null;
  const fad=id=>P(id).fadiga;
  const cor=v=>v>=0.75?'dn':v>=0.5?'am':'up';

  /* ---- mapas da rotação ---- */
  const mapas=(G.mapasAtivos||[]).map(mp=>{
    const meuA=afinidadeElenco(t,mp);
    const advA=adv?afinidadeElenco(adv,mp):null;
    const treinando=pl.mapa===mp;
    return `<button class="mp-card ${treinando?'on':''}" data-treinomapa="${esc(mp)}">
      <div class="mp-nome">${esc(mp)}</div>
      <div class="mp-val ${meuA>=3?'up':meuA<=-2?'dn':''}">${meuA>0?'+':''}${meuA.toFixed(1)}</div>
      ${adv?`<div class="mp-adv">${esc(adv.tag)} ${advA>0?'+':''}${advA.toFixed(1)}</div>`:''}
      <div class="mp-tag">${treinando?'treinando':'treinar'}</div>
    </button>`;
  }).join('');

  /* ---- quadro individual ---- */
  const attrs=ATTRS.map(([k,n])=>[k,n]);
  const linhas=t.elenco.map(P).sort((a,b)=>over(b)-over(a)).map(p=>{
    const plano=planoDoJogador(t,p);
    const gap=Math.max(0,(p.pot||0)-over(p));
    const meusAg=agentesDoJogador(p);
    return `<tr class="${plano.tipo==='descanso'?'descansa':''}">
      <td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}
        ${t.titulares.includes(p.id)?'<span class="chip">titular</span>':''}
        ${p.lesao?'<span class="chip r">'+p.lesao+' sem. fora</span>':''}</td>
      <td class="c">${p.idade}</td>
      <td class="c"><span class="ov ${ovClass(over(p))}">${over(p)}</span></td>
      <td class="c num dim">${gap?'+'+gap:'—'}</td>
      <td class="c"><span class="num ${cor(fad(p.id))}">${Math.round(fad(p.id)*100)}%</span></td>
      <td>
        <select data-plano="${p.id}">
          <option value="descanso" ${plano.tipo==='descanso'?'selected':''}>Descanso</option>
          <optgroup label="Atributo">
            ${attrs.map(([k,n])=>`<option value="atributo:${k}"
              ${plano.tipo==='atributo'&&plano.alvo===k?'selected':''}>${esc(n)}</option>`).join('')}
          </optgroup>
          <optgroup label="Aprender agente">
            ${meusAg.map(a=>`<option value="agente:${esc(a.nome)}"
              ${plano.tipo==='agente'&&plano.alvo===a.nome?'selected':''}
              >${esc(a.nome)} · ${a.nivel}/${a.teto}${a.nivel>=a.teto?' (no teto)':''}</option>`).join('')}
          </optgroup>
        </select>
        ${plano.herdado?'<span class="dim" style="font-size:10.5px"> herdado das Táticas</span>':''}
      </td>
    </tr>`;
  }).join('');

  const descansando=t.elenco.filter(id=>planoDoJogador(t,P(id)).tipo==='descanso').length;
  return `<div class="eyebrow">Semana ${G.semana} · ${esc(rotuloSemana(G.ano,G.semana))}</div>
  <h2 class="sec">Plano da semana</h2>
  ${px&&!px.espera?`<div class="card flat" style="border-left:4px solid var(--red)">
    <b>Tem jogo nesta semana</b> — ${px.bye?'bye':'contra '+esc(nomeT(px.adv))}. Quem treina pesado
    entra cansado, e cansaço é o que mais custa partida.</div>`
   :px&&px.espera?`<div class="card flat"><b>${esc(px.espera.nome)}</b> em ${px.semanas}
    semana${px.semanas===1?'':'s'} — é agora que dá para trabalhar sem pagar caro no sábado.</div>`:''}

  <div class="card"><div class="split">
    <div><div class="eyebrow">Treino de mapa</div>
      <div class="dim">Sete mapas em rotação. O que você treina sobe; o que você abandona
      escorrega. É esse pool que o veto vai defender.</div></div>
    <div>${pl.mapa?`<button class="btn ghost sm" data-treinomapa="">Nenhum mapa esta semana</button>`:''}</div>
  </div>
    <div class="mp-grid">${mapas}</div>
  </div>

  <div class="card"><div class="split">
    <div><div class="eyebrow">Intensidade do trabalho</div>
      <div class="dim">Vale para todos: acima de 3 o entrosamento sobe mais rápido e o elenco
      cansa mais.</div></div>
    <div style="min-width:220px">
      <input type="range" id="trScrim" min="1" max="5" value="${t.tatica.scrim}">
      <div class="dim">nível <b id="lbScrim">${t.tatica.scrim}</b></div></div>
  </div></div>

  <div class="card flat"><div class="split">
    <div class="eyebrow">Trabalho individual</div>
    <span class="dim">${descansando} descansando · ${t.elenco.length-descansando} treinando</span>
  </div>
    <table class="wide"><thead><tr><th>Jogador</th><th class="c">Idade</th><th class="c">Over</th>
      <th class="c">A evoluir</th><th class="c">Fadiga</th><th>Nesta semana</th></tr></thead>
    <tbody>${linhas}</tbody></table>
    <p class="dim" style="margin-top:8px">Aprender um agente da própria função leva cerca de 14
    semanas. Fora da função, o teto de aptidão pode impedir de chegar lá — é por isso que às vezes
    sai mais barato comprar um main do que retreinar quem você tem.</p>
  </div>`;
}
/* Agentes que vale a pena oferecer a este jogador: os dele primeiro, depois os
   da função, com nível e teto — para a escolha ser informada e não um chute. */
function agentesDoJogador(p){
  const fun=p.role;
  const pool=[...(p.agentes||[]),...((AGENTS[fun]||[]))]
    .filter((a,i,arr)=>arr.indexOf(a)===i);
  return pool.map(nome=>({nome,nivel:Math.round(nivelAgente(p,nome)),teto:tetoAgente(p,nome)}))
    .sort((a,b)=>b.nivel-a.nivel);
}

let mFiltro={busca:'',role:'',reg:'',so:'todos',ordem:'over'};
let mercAba='jogadores';
function vMercado(){
  const t=meu();
  const pend=(G.propostas||[]).filter(x=>{const p=P(x.jogadorId);return p&&p.timeId===t.id;}).length;
  const abas=`<div class="tabs">${[['jogadores','Jogadores'],['comissao','Comissão técnica'],
      ['saidas','Saídas'+(pend?' ('+pend+')':'')]]
    .map(([k,n])=>`<button data-merc="${k}" class="${mercAba===k?'on':''}">${n}</button>`).join('')}</div>`;
  return `<div class="eyebrow">Mercado ${G.janela?'· janela aberta':'· janela fechada'}</div>
    <h2 class="sec">${mercAba==='saidas'?'Negociar saídas':'Scout'}</h2>${abas}${
    mercAba==='comissao'?vMercadoStaff(t):mercAba==='saidas'?vMercadoSaidas(t):vMercadoJogadores(t)}`;
}
/* ---------- saídas: vender e emprestar ----------
   A tela é deliberadamente do lado de cá do balcão: você anuncia, e as
   propostas CHEGAM ao longo das semanas. Não existe botão de vender, porque
   não existe comprador garantido — é isso que faz o preço significar algo. */
function vMercadoSaidas(t){
  const props=(G.propostas||[]).filter(x=>{const p=P(x.jogadorId);return p&&p.timeId===t.id;});
  const fora=typeof emprestadosDe==='function'?emprestadosDe(t):[];
  const podeSair=t.elenco.length>ELENCO_MIN;

  const cxPropostas=props.length?`
  <div class="card flat"><div class="eyebrow">Propostas na mesa</div>
    <table class="wide"><thead><tr><th>Jogador</th><th>Clube</th><th>Tipo</th>
      <th class="r">Valor</th><th class="r">Salário</th><th class="c">Prazo</th><th></th></tr></thead>
    <tbody>${props.map(x=>{const p=P(x.jogadorId),c=T(x.clubeId);return `<tr>
      <td><b>${esc(p.nome)}</b> <span class="ov ${ovClass(over(p))}">${over(p)}</span></td>
      <td>${esc(c.nome)} <span class="dim">${nomeLiga(c)}</span></td>
      <td>${x.tipo==='compra'?'<span class="chip">Compra</span>'
            :'<span class="chip t">Empréstimo</span>'+(x.opcaoCompra?' <span class="dim">opção '+money(x.opcaoCompra)+'</span>':'')}</td>
      <td class="r num">${money(x.taxa)}${x.tipo==='compra'&&x.pedido?`<div class="dim" style="font-size:11px">pediu ${money(x.pedido)}</div>`:''}</td>
      <td class="r num dim">${money(x.salario)}/mês</td>
      <td class="c num dim">${x.prazo} sem.</td>
      <td class="r"><button class="btn sm" data-aceitar="${x.id}">Aceitar</button>
        <button class="btn ghost sm" data-recusar="${x.id}">Recusar</button></td>
    </tr>`;}).join('')}</tbody></table></div>`
  :`<div class="card flat"><div class="eyebrow">Propostas na mesa</div>
      <p class="dim">Nenhuma no momento. Anuncie um jogador abaixo e os clubes que precisam
      da função dele vão aparecer ao longo das semanas — se a janela estiver aberta.</p></div>`;

  const cxFora=fora.length?`
  <div class="card flat"><div class="eyebrow">Emprestados por você</div>
    <table><tbody>${fora.map(p=>`<tr>
      <td><b>${esc(p.nome)}</b></td><td class="dim">no ${esc(nomeT(p.timeId))}</td>
      <td class="r num dim">você paga ${money(p.emprestimo.parteDono)}/mês</td>
      <td class="r dim">${p.emprestimo.opcaoCompra?'opção de '+money(p.emprestimo.opcaoCompra):'sem opção'}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim" style="margin-top:6px">Voltam na virada de temporada, a menos que o clube exerça a opção.</p></div>`:'';

  return `${G.janela?'':'<div class="card" style="border-left:4px solid var(--red)">A janela está fechada. Você pode anunciar, mas proposta só chega com a janela aberta.</div>'}
  ${cxPropostas}${cxFora}
  <div class="card flat"><div class="eyebrow">Seu elenco</div>
    ${podeSair?'':`<p class="dim">Com ${t.elenco.length} jogadores você não pode vender ninguém — o mínimo é ${ELENCO_MIN}. Emprestar também não, porque o elenco ficaria curto.</p>`}
    <table class="wide"><thead><tr><th>Jogador</th><th>Função</th><th class="c">Idade</th>
      <th class="c">Over</th><th class="c">Pot</th><th class="r">Vale</th><th>Situação</th><th></th></tr></thead>
    <tbody>${t.elenco.map(P).sort((a,b)=>over(b)-over(a)).map(p=>`<tr>
      <td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}${t.titulares.includes(p.id)?' <span class="chip">titular</span>':''}</td>
      <td class="dim">${esc(p.role)}</td>
      <td class="c num">${p.idade}</td>
      <td class="c"><span class="ov ${ovClass(over(p))}">${over(p)}</span></td>
      <td class="c num dim">${p.pot}</td>
      <td class="r num">${money(pedidoDeVenda(p))}</td>
      <td>${p.anuncio
        ?`<span class="chip t">${p.anuncio.modo==='venda'?'à venda':p.anuncio.modo==='emprestimo'?'para empréstimo':'venda ou empréstimo'}</span>
          <span class="dim">${money(p.anuncio.pedido)}</span>`
        :'<span class="dim">—</span>'}</td>
      <td class="r">${p.anuncio
        ?`<button class="btn ghost sm" data-desanunciar="${p.id}">Retirar</button>`
        :`<button class="btn ghost sm" data-anunciar="${p.id}" ${podeSair?'':'disabled'}>Anunciar</button>`}</td>
    </tr>`).join('')}</tbody></table></div>`;
}
function vMercadoStaff(t){
  const lista=Object.values(G.staff||{}).filter(m=>m.timeId!==t.id)
    .sort((a,b)=>overStaff(b)-overStaff(a)).slice(0,60);
  return `${G.janela?'':'<div class="card" style="border-left:4px solid var(--red)">A janela está fechada. Você pode observar, mas contratar só na pré-temporada ou na janela do meio de ano.</div>'}
  <div class="card flat"><div class="eyebrow">Sua comissão hoje</div>
    <table><tbody>${comissaoDe(t).map(({cargo,membro})=>`<tr>
      <td>${cargo.nome}</td>
      <td>${membro?`<span class="linha-t">${retratoStaff(membro,24)}<b>${esc(membro.nome)}</b></span>`:'<span class="dn">vago</span>'}</td>
      <td class="c">${membro?`<span class="ov ${ovClass(overStaff(membro))}">${overStaff(membro)}</span>`:'—'}</td>
      <td class="r num dim">${membro?money(membro.salario)+'/mês':''}</td>
      <td class="r">${membro?`<button class="btn ghost sm" data-dispstaff="${membro.id}">Dispensar</button>`:''}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim" style="margin-top:8px">${esc(CARGOS.map(c=>c.curto+': '+c.efeito.toLowerCase()).join(' · '))}</p>
  </div>
  <div class="card flat"><table class="wide"><thead><tr><th></th><th>Nome</th><th>Cargo</th><th>Clube</th>
    <th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th><th class="r">Pedido</th>
    <th class="r">Salário</th><th></th></tr></thead>
    <tbody>${lista.map(m=>`<tr>
      <td>${retratoStaff(m,26)}</td>
      <td><b>${esc(m.nome)}</b> ${bandeira(m.pais)}</td>
      <td><span class="tag">${esc((CARGOS.find(c=>c.id===m.cargo)||{curto:m.cargo}).curto)}</span></td>
      <td class="dim">${m.timeId?esc(tagT(m.timeId)):'<span class="chip t">Livre</span>'}</td>
      <td class="c num">${m.idade}</td>
      <td class="c"><span class="ov ${ovClass(overStaff(m))}">${overStaff(m)}</span></td>
      <td class="c num dim">${m.pot}</td>
      <td class="r num">${m.timeId?money(pedidoStaff(m)):'—'}</td>
      <td class="r num">${money(salarioPedidoStaff(m,t))}</td>
      <td class="r"><button class="btn sm" data-propstaff="${m.id}" ${G.janela?'':'disabled'}>Propor</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}
function vMercadoJogadores(t){
  let lista=Object.values(G.jogadores).filter(p=>p.timeId!==t.id&&!p.base);
  if(mFiltro.so==='livres')lista=lista.filter(p=>!p.timeId);
  if(mFiltro.so==='promessas')lista=lista.filter(p=>p.idade<=21&&p.pot-over(p)>=8);
  if(mFiltro.role)lista=lista.filter(p=>p.role===mFiltro.role);
  if(mFiltro.reg)lista=lista.filter(p=>p.timeId?T(p.timeId).regiao===mFiltro.reg:p.regiaoOrigem===mFiltro.reg);
  if(mFiltro.busca)lista=lista.filter(p=>p.nome.toLowerCase().includes(mFiltro.busca.toLowerCase()));
  lista.sort((a,b)=>mFiltro.ordem==='over'?over(b)-over(a):mFiltro.ordem==='pot'?(b.pot-b.idade*1.5)-(a.pot-a.idade*1.5):a.valor-b.valor);
  lista=lista.slice(0,60);
  return `${G.janela?'':'<div class="card" style="border-left:4px solid var(--red)">A janela está fechada. Você pode observar e montar alvos, mas contratações só na pré-temporada ou na janela do meio de ano.</div>'}
  <div class="card flat"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="text" id="fBusca" placeholder="Buscar jogador" value="${esc(mFiltro.busca)}">
    <select id="fSo">${[['todos','Todos'],['livres','Agentes livres'],['promessas','Promessas']].map(([k,n])=>`<option value="${k}" ${mFiltro.so===k?'selected':''}>${n}</option>`).join('')}</select>
    <select id="fRole"><option value="">Todas as funções</option>${ROLES.map(r=>`<option ${mFiltro.role===r?'selected':''}>${r}</option>`).join('')}</select>
    <select id="fReg"><option value="">Todas as regiões</option>${REGIONS.map(r=>`<option value="${r.id}" ${mFiltro.reg===r.id?'selected':''}>${r.nome}</option>`).join('')}</select>
    <select id="fOrd">${[['over','Ordenar por over'],['pot','Ordenar por potencial'],['valor','Ordenar por preço']].map(([k,n])=>`<option value="${k}" ${mFiltro.ordem===k?'selected':''}>${n}</option>`).join('')}</select>
    <span class="dim">${lista.length} resultados</span></div></div>
  <div class="card flat"><table><thead><tr><th>Jogador</th><th>Clube</th><th>Função</th><th class="c">Idade</th>
    <th class="c">Over</th><th class="c">Pot</th><th class="r">Pedido</th><th class="r">Salário</th><th></th></tr></thead>
    <tbody>${lista.map(p=>`<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}</td>
      <td class="dim">${p.timeId?esc(nomeT(p.timeId)):'<span class="chip t">Livre</span>'}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td><td class="c num dim">${p.pot}</td>
      <td class="r num">${p.timeId?money(pedidoDeVenda(p)):'—'}</td>
      <td class="r num">${money(salarioPedido(p,t))}</td>
      <td class="r"><button class="btn sm" data-prop="${p.id}" ${G.janela?'':'disabled'}>Propor</button></td></tr>`).join('')}
    </tbody></table></div>`;
}
function vBase(){
  const t=meu();
  const jovens=t.elenco.map(P).filter(p=>p.idade<=22).sort((a,b)=>b.pot-a.pot);
  const prom=Object.values(G.jogadores).filter(p=>p.idade<=19&&p.pot>=82&&!p.base).sort((a,b)=>b.pot-a.pot).slice(0,15);
  const base=baseDe(t).sort((a,b)=>b.pot-a.pot);
  const vagas=vagasDaBase(t);
  const casa=reveladosPelaCasa(t).slice(0,20);
  const cheio=t.elenco.length>=9;
  return `<div class="eyebrow">Desenvolvimento</div><h2 class="sec">Base e promessas</h2>
  <div class="card"><div class="eyebrow">Academia nível ${t.estrutura.academia}</div>
    <p class="dim">${base.length} de ${vagas} vagas na categoria. Cada nível de academia abre uma vaga, revela garotos
    melhores e acelera o crescimento; o head coach também conta. Cada garoto custa ${money(BASE_CUSTO_SEMANA)} por semana.
    Na virada do ano a academia revela a turma nova, e quem faz ${BASE_IDADE_SAI} anos sem ser promovido vai embora.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <span class="dim">O olheiro procura:</span>
      ${[['','Qualquer função'],...ROLES.filter(r=>r!=='Flex').map(r=>[r,r])].map(([k,n])=>
        `<button class="btn sm ${(t.baseFoco||'')===k?'':'ghost'}" data-basefoco="${k}">${n}</button>`).join('')}
    </div></div>
  <div class="card flat"><div class="eyebrow">Categoria de base</div>
    ${base.length?`<table><thead><tr><th>Jogador</th><th>Função</th><th class="c">Idade</th><th class="c">Over</th>
      <th class="c">Pot</th><th class="c">Na base desde</th><th class="r"></th></tr></thead>
    <tbody>${base.map(p=>`<tr><td><b class="jrow" data-p="${p.id}" style="cursor:pointer">${esc(p.nome)}</b> ${FLAG[p.pais]||''}
      ${p.idade>=BASE_IDADE_SAI-1?' <span class="chip">último ano</span>':''}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td><td class="c num" style="color:var(--gold);font-weight:700">${p.pot}</td>
      <td class="c num">${p.baseDesde||'—'}</td>
      <td class="r" style="white-space:nowrap"><button class="btn sm" data-bpromo="${p.id}" ${cheio?'disabled title="elenco com nove"':''}>Promover</button>
        <button class="btn sm ghost" data-bdisp="${p.id}">Dispensar</button></td></tr>`).join('')}</tbody></table>`
    :'<div class="empty">Nenhum garoto na categoria agora. A academia revela a próxima turma na virada do ano.</div>'}</div>
  <div class="card flat"><div class="eyebrow">Jovens no elenco</div>
    ${jovens.length?`<table><thead>${THJ}</thead><tbody>${jovens.map(p=>linhaJog(p)).join('')}</tbody></table>`:'<div class="empty">Nenhum jogador com 22 anos ou menos.</div>'}</div>
  <div class="card flat"><div class="eyebrow">Revelados pela casa</div>
    ${casa.length?`<table><thead><tr><th>Jogador</th><th>Clube hoje</th><th>Função</th><th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th></tr></thead>
    <tbody>${casa.map(p=>`<tr class="jrow ${p.timeId===t.id?'me':''}" data-p="${p.id}"><td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}</td>
      <td class="dim">${p.timeId?esc(nomeT(p.timeId)):'<span class="chip t">Livre</span>'}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td><td class="c num">${p.pot}</td></tr>`).join('')}</tbody></table>`
    :'<div class="empty">Ninguém saiu da sua base ainda.</div>'}</div>
  <div class="card flat"><div class="eyebrow">Radar mundial de talentos (sub-19)</div>
    <table><thead><tr><th>Jogador</th><th>Clube</th><th>Função</th><th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th><th class="r">Pedido</th></tr></thead>
    <tbody>${prom.map(p=>`<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}</td>
      <td class="dim">${p.timeId?esc(nomeT(p.timeId)):'<span class="chip t">Livre</span>'}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td><td class="c num" style="color:var(--gold);font-weight:700">${p.pot}</td>
      <td class="r num">${p.timeId?money(pedidoDeVenda(p)):'livre'}</td></tr>`).join('')}</tbody></table></div>`;
}
function vFinancas(){
  const t=meu();
  const folha=t.elenco.reduce((s,i)=>s+P(i).salario,0)+folhaStaff(t);
  const patro=receitaPatrocinio(t), aporte=aporteLiga(t), rec=patro+aporte;
  return `<div class="eyebrow">Gestão</div><h2 class="sec">Finanças</h2>
  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi"><div class="lb">Caixa</div><div class="vl">${money(t.caixa)}</div></div>
    <div class="kpi"><div class="lb">Receita anual</div><div class="vl">${money(rec)}</div>
      <div class="sb">${money(patro)} de marca · ${money(aporte)} da liga</div></div>
    <div class="kpi red"><div class="lb">Folha mensal</div><div class="vl">${money(folha)}</div><div class="sb">elenco + comissão · ${money(folha*12)}/ano</div></div>
    <div class="kpi teal"><div class="lb">Resultado anual</div><div class="vl">${money(rec-folha*12-custeioAnual(t))}</div>
      <div class="sb">já com ${money(custeioAnual(t))} de custeio · sem premiações</div></div>
  </div>
  <div class="card flat"><div class="split">
    <div><div class="eyebrow">Orçamento</div>
      <div class="dim">Custeio é o que a estrutura e os scrims cobram todo ano, aconteça o que
      acontecer. O que sobra dele é o que sustenta salário — e é esse teto que a diretoria de
      qualquer clube respeita na hora de contratar.</div></div>
    <div style="min-width:260px">
      <table><tbody>
        <tr><td>Custeio anual</td><td class="r num">${money(custeioAnual(t))}</td></tr>
        <tr><td>Receita livre</td><td class="r num">${money(receitaLivre(t))}</td></tr>
        <tr><td>Teto de folha</td><td class="r num">${money(receitaLivre(t)*tetoFolhaDe(t))}</td></tr>
        <tr><td>Folga para contratar</td><td class="r num">${money(folgaSalarial(t))}/mês</td></tr>
      </tbody></table>
    </div>
  </div></div>
  <div class="card"><div class="split">
    <div><div class="eyebrow">Torcida</div>
      <div class="dim">Cresce com vitória e título, encolhe sozinha quando o clube some.
      Ela decide o aporte da liga e o tamanho da marca que você alcança.</div></div>
    <div style="min-width:200px">${medidor('<span class="dim">de '+TORCIDA_MAX+'</span>',(t.torcida||0)/TORCIDA_MAX,100)}</div>
  </div></div>
  <div class="card flat"><div class="eyebrow">Patrocinadores</div>
    <table><thead><tr><th></th><th>Vaga</th><th>Marca</th><th class="c">Nível</th><th class="r">Por ano</th></tr></thead>
    <tbody>${patrociniosDe(t).map(({vaga,mk})=>`<tr>
      <td style="width:104px">${mk?logoMarca(mk,96):''}</td>
      <td><b>${esc(vaga.nome)}</b></td>
      <td>${mk?esc(mk.nome)+' <span class="dim">· '+esc(mk.setor)+'</span>':'<span class="dn">vaga aberta</span>'}</td>
      <td class="c num">${mk?mk.nivel:'—'}</td>
      <td class="r num">${mk?money(valorContrato(mk,t,vaga.id)):'—'}</td></tr>`).join('')}
    </tbody></table>
    <p class="dim" style="margin-top:8px">Os contratos são revistos na virada de temporada:
    clube mais atraente escolhe primeiro.</p></div>
  <div class="card flat"><div class="eyebrow">Folha salarial</div>
    <table><thead><tr><th>Jogador</th><th class="c">Over</th><th class="r">Salário/mês</th><th class="r">% da folha</th><th class="c">Contrato</th><th></th></tr></thead>
    <tbody>${t.elenco.map(i=>{const p=P(i);return `<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b></td><td class="c">${ovTag(p)}</td>
      <td class="r num">${money(p.salario)}</td><td class="r num dim">${(p.salario/folha*100).toFixed(1)}%</td>
      <td class="c num ${p.contrato<=1?'dn':''}">${p.contrato}a</td>
      <td class="r"><button class="btn ghost sm" data-renov="${p.id}">Renovar</button>
      <button class="btn ghost sm" data-disp="${p.id}">Dispensar</button></td></tr>`;}).join('')}</tbody></table></div>
  <div class="card"><div class="eyebrow">Premiações que você pode disputar</div>
    <table><thead><tr><th>Competição</th><th class="r">Campeão</th><th class="r">Vice</th></tr></thead><tbody>
      ${['champions','masters1',(t.tier===1?'po2_':'cp2_')+t.regiao,(t.tier===1?'kickoff_':'asc_')+t.regiao]
        .map(id=>{const tor=torneio(id);if(!tor||!tor.premio)return '';
          const p=premiosDoStage({torneioId:id});
          return `<tr><td>${torneioInline(id,20)}</td><td class="r num">${money(p[0]||0)}</td>
            <td class="r num">${p[1]?money(p[1]):'—'}</td></tr>`;}).join('')}
    </tbody></table>
    <p class="dim" style="margin-top:8px">Os valores saem do catálogo de torneios e são editáveis
    no Banco de dados › Torneios.</p></div>`;
}
function vStats(){
  const jog=Object.values(G.jogadores).filter(p=>p.temp.maps>=3);
  const rating=p=>((p.temp.k+p.temp.a*.35)/Math.max(1,p.temp.d));
  const tabs=[['acs','ACS médio',p=>Math.round(p.temp.acs/p.temp.maps)],
    ['kd','K/D',p=>(p.temp.k/Math.max(1,p.temp.d)).toFixed(2)],
    ['fk','First kills',p=>p.temp.fk],['cl','Clutches',p=>p.temp.cl],['mvp','MVPs',p=>p.temp.mvp]];
  return `<div class="eyebrow">Temporada ${G.ano}</div><h2 class="sec">Líderes</h2>
  <div class="grid g2">${tabs.map(([k,n,f])=>{
    const top=jog.slice().sort((a,b)=>parseFloat(f(b))-parseFloat(f(a))).slice(0,10);
    return `<div class="card flat"><div class="eyebrow">${n}</div><table><tbody>${top.map((p,i)=>
      `<tr class="jrow ${p.timeId===G.meuTime?'me':''}" data-p="${p.id}"><td class="num dim">${i+1}</td>
      <td><b>${esc(p.nome)}</b> <span class="dim">${p.timeId?esc(tagT(p.timeId)):''}</span></td>
      <td class="r num"><b>${f(p)}</b></td></tr>`).join('')||'<tr><td class="dim">Sem dados ainda.</td></tr>'}</tbody></table></div>`;
  }).join('')}</div>
  <div class="card flat"><div class="eyebrow">Galeria de títulos</div>
    <table><thead><tr><th class="c">Ano</th><th>Competição</th><th>Campeão</th></tr></thead>
    <tbody>${G.historico.slice().reverse().slice(0,40).map(h=>`<tr><td class="c num">${h.ano}</td><td>${esc(h.evento)}</td><td><b>${esc(h.campeao)}</b></td></tr>`).join('')||'<tr><td class="dim">Ainda sem títulos registrados.</td></tr>'}</tbody></table></div>`;
}
/* ============================================================
   PRÊMIOS E HALL DA FAMA
   ============================================================ */
let premioAno=null;
function linhaPremiado(f,rot){
  if(!f)return '';
  const vivo=!!P(f.id);
  return `<tr class="${vivo?'jrow':''} ${f.timeId===G.meuTime?'me':''}" ${vivo?`data-p="${f.id}"`:''}>
    ${rot?`<td class="dim">${esc(rot)}</td>`:''}
    <td><b>${esc(f.nome)}</b> ${FLAG[f.pais]||''}${vivo?'':' <span class="chip">aposentado</span>'}</td>
    <td><span class="tag ${f.role}">${f.role}</span></td><td class="dim">${esc(f.tag)}</td>
    <td class="r num">${f.maps}</td><td class="r num">${f.acs}</td><td class="r num">${Number(f.kd).toFixed(2)}</td></tr>`;
}
const TH_PREMIO=(rot)=>`<thead><tr>${rot?'<th></th>':''}<th>Jogador</th><th>Função</th><th>Clube</th>
  <th class="r">Mapas</th><th class="r">ACS</th><th class="r">K/D</th></tr></thead>`;
function vPremios(){
  const lista=G.premios||[];
  const anos=lista.map(r=>r.ano);
  if(premioAno==null||!anos.includes(premioAno))premioAno=anos[anos.length-1];
  const r=lista.find(x=>x.ano===premioAno);
  const corpo=!r?`<div class="card flat"><div class="empty">Os prêmios saem na virada da temporada.
      O primeiro vai ser entregue no fim de ${G.ano}.</div></div>`:`
  <div class="grid g2">
    <div class="card"><div class="eyebrow">MVP de ${r.ano}</div>
      <h3 style="margin:4px 0">${esc(r.mvp.nome)} ${FLAG[r.mvp.pais]||''}</h3>
      <div class="dim">${esc(r.mvp.tag)} · ${r.mvp.role} · ${r.mvp.maps} mapas · ${r.mvp.acs} de ACS · ${Number(r.mvp.kd).toFixed(2)} de K/D</div></div>
    <div class="card"><div class="eyebrow">Treinador do ano</div>
      ${r.treinador?`<h3 style="margin:4px 0">${esc(r.treinador.nome)}${r.treinador.voce?' <span class="chip t">você</span>':''}</h3>
      <div class="dim">${esc(r.treinador.tag)}</div>`:'<div class="dim">—</div>'}</div>
  </div>
  <div class="card flat"><div class="eyebrow">Seleção do ano</div>
    <table>${TH_PREMIO(false)}<tbody>${r.selecao.map(f=>linhaPremiado(f)).join('')}</tbody></table></div>
  <div class="card flat"><div class="eyebrow">Destaques</div>
    <table>${TH_PREMIO(true)}<tbody>
      ${REGIONS.map(R=>linhaPremiado(r.regioes[R.id],'MVP · '+R.nome)).join('')}
      ${linhaPremiado(r.revelacao,'Revelação')}${linhaPremiado(r.igl,'IGL do ano')}
    </tbody></table></div>`;
  const lendas=(G.lendas||[]).slice().sort((a,b)=>b.pontos-a.pontos);
  return `<div class="eyebrow">Circuito</div><h2 class="sec">Prêmios</h2>
  ${anos.length>1?`<div class="tabs">${anos.slice().reverse().map(a=>
    `<button data-pano="${a}" class="${a===premioAno?'on':''}">${a}</button>`).join('')}</div>`:''}
  ${corpo}
  <div class="card flat"><div class="eyebrow">Hall da Fama</div>
    ${lendas.length?`<table><thead><tr><th>Jogador</th><th>Função</th><th class="c">Aposentou</th><th class="c">Pico</th>
      <th class="r">Títulos</th><th class="r">Internac.</th><th class="r">Prêmios</th><th class="r">Mapas</th><th class="r">K/D</th><th>Clubes</th></tr></thead>
    <tbody>${lendas.map(l=>`<tr><td><b>${esc(l.nome)}</b> ${FLAG[l.pais]||''}</td>
      <td><span class="tag ${l.role}">${l.role}</span></td><td class="c num">${l.ano} · ${l.idade}a</td>
      <td class="c num">${l.pico}</td><td class="r num">${l.carreira.titulos}</td><td class="r num">${l.carreira.intl}</td>
      <td class="r num" title="${esc(l.premios.map(x=>x.ano+' '+x.rot).join('\n'))}">${l.premios.length}</td>
      <td class="r num">${l.carreira.maps}</td><td class="r num">${l.carreira.kd.toFixed(2)}</td>
      <td class="dim">${esc(l.clubes.slice(-3).join(', '))}</td></tr>`).join('')}</tbody></table>`
    :`<div class="empty">Ninguém ainda. Entra quem se aposenta com prêmios do ano, títulos internacionais
      e uma carreira longa.</div>`}</div>`;
}
/* ---------- notícias ---------- */
let newsAba='tudo';
function linhaNoticia(n){
  if(n.c==='sistema')return `<div class="news-sep">${esc(n.txt.replace(/=/g,'').trim())}</div>`;
  /* o nome de quem a notícia cita vira link para a ficha */
  let txt=esc(n.txt);
  for(const id of (n.p||[]).slice(0,4)){
    const p=P(id);if(!p)continue;
    const nm=esc(p.nome),i=txt.indexOf(nm);
    if(i<0)continue;
    txt=txt.slice(0,i)+`<span class="jrow news-link" data-p="${id}">${nm}</span>`+txt.slice(i+nm.length);
  }
  return `<div class="news ${n.meu?'me':''}"><span class="dim num">${n.s?rotuloSemanaCurto(n.ano,n.s):n.ano}</span> <span>${txt}</span></div>`;
}
function rotuloSemanaCurto(ano,s){return ano+' · S'+s;}
function noticiasDaAba(aba){
  if(aba==='tudo')return G.noticias;
  if(aba==='clube')return G.noticias.filter(n=>n.meu);
  return G.noticias.filter(n=>n.c===aba);
}
function vNews(){
  const abas=[['tudo','Tudo'],...Object.entries(CAT_NOTICIA)];
  const lista=noticiasDaAba(newsAba).filter(n=>n.txt);
  return `<div class="eyebrow">Imprensa</div><h2 class="sec">Notícias</h2>
  <div class="tabs">${abas.map(([k,n])=>{
    const q=noticiasDaAba(k).filter(x=>x.txt&&x.c!=='sistema').length;
    return `<button data-newsaba="${k}" class="${newsAba===k?'on':''}">${n} <span class="dim">${q}</span></button>`;}).join('')}</div>
  <div class="card flat"><div class="feed" style="max-height:none">${lista.map(linhaNoticia).join('')||'<div class="dim">Sem notícias aqui.</div>'}</div></div>`;
}

/* ============================================================
   HISTÓRIA DO CLUBE
   ------------------------------------------------------------
   Três blocos: o que o clube já ganhou, contra quem ele mais
   joga, e de quem ele não gosta. O terceiro é derivado dos dois
   primeiros — rivalidade escrita à mão envelhece mal.
   ============================================================ */
function vHistoria(){
  const t=meu();
  const l=legadoDe(t);
  const conf=confrontosDe(t.id);
  const rivais=rivaisDe(t.id,4);
  const idsRivais=new Set(rivais.map(r=>r.time.id));

  const linhaConf=c=>{
    const saldo=c.vitorias-c.derrotas;
    const ult=c.ultimos.slice(0,5).map(u=>
      `<i class="${u.v===t.id?'w':'l'}" title="${esc(String(u.ano)+' · '+(u.ctx||''))}"></i>`).join('');
    return `<tr>
      <td>${escudo(c.time,22)}</td>
      <td><b>${esc(c.time.nome)}</b>${idsRivais.has(c.time.id)?' <span class="chip">rival</span>':''}
        <div class="dim" style="font-size:11px">${esc(nomeLiga(c.time))}</div></td>
      <td class="c num">${c.jogos}</td>
      <td class="c num up">${c.vitorias}</td>
      <td class="c num dn">${c.derrotas}</td>
      <td class="c num ${saldo>0?'up':saldo<0?'dn':''}">${saldo>0?'+':''}${saldo}</td>
      <td class="c"><span class="serie">${ult}</span></td></tr>`;};

  /* o mundo lembra de campeões que já não competem: é o que faz a linha do
     tempo parecer que aconteceu, em vez de começar em 2026 do nada */
  const pre=(G.historico||[]).filter(h=>h.pre);
  const anos=[...new Set(pre.map(h=>h.ano))].sort((a,b)=>b-a);

  return `<div class="eyebrow">Clube</div><h2 class="sec">História</h2>

  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi"><div class="lb">Títulos</div><div class="vl">${l.total}</div>
      <div class="sb">${l.internacionais} internacional${l.internacionais===1?'':'is'}</div></div>
    <div class="kpi teal"><div class="lb">Torcida</div><div class="vl">${t.torcida||0}</div>
      <div class="sb">de 100</div></div>
    <div class="kpi"><div class="lb">Vices</div><div class="vl">${l.vices}</div>
      <div class="sb">finais perdidas na história do clube</div></div>
    <div class="kpi red"><div class="lb">Rivais</div><div class="vl">${rivais.length}</div>
      <div class="sb">pelo histórico, não por decreto</div></div>
  </div>

  <div class="grid g2">
    <div class="card"><div class="eyebrow">Galeria de títulos</div>
      ${l.titulos.length?`<div class="titulos">${l.titulos.slice().reverse().map(x=>
        `<div class="tit-linha"><span class="num dim">${esc(x.split(' · ')[0])}</span>
          <b>${esc(x.split(' · ').slice(1).join(' · '))}</b></div>`).join('')}</div>`
        :'<div class="empty">Nenhum título ainda. É por isso que você está aqui.</div>'}
    </div>
    <div class="card"><div class="eyebrow">Rivalidades</div>
      ${rivais.length?rivais.map(r=>`<div class="riv">
          <div class="split"><div style="display:flex;gap:8px;align-items:center">
            ${escudo(r.time,26)}<b>${esc(r.time.nome)}</b></div>
            <span class="num dim">${r.vitorias}–${r.derrotas}</span></div>
          <div class="dim" style="font-size:11.5px;margin-top:4px">${esc(motivoRivalidade(t,r))}</div>
          ${medidor('<span class="dim">intensidade</span>',r.nota,54)}</div>`).join('')
        :`<div class="empty">Rivalidade se constrói jogando. Volte depois de algumas
           temporadas — são precisos pelo menos ${RIV_MIN_JOGOS} confrontos.</div>`}
    </div>
  </div>

  <div class="card"><div class="eyebrow">Confronto direto · ${conf.length} adversários</div>
    ${conf.length?`<div class="rolagem"><table class="wide"><thead><tr><th></th><th>Adversário</th>
      <th class="c">J</th><th class="c">V</th><th class="c">D</th><th class="c">Saldo</th>
      <th class="c">Últimos</th></tr></thead>
      <tbody>${conf.map(linhaConf).join('')}</tbody></table></div>`
      :'<div class="empty">Nenhuma partida disputada ainda nesta run.</div>'}
  </div>

  <div class="card"><div class="eyebrow">Antes de você · o circuito de 2021 a 2025</div>
    <p class="dim">Resultados reais. Alguns campeões já não competem — o circuito
    lembra deles mesmo assim.</p>
    ${anos.map(a=>`<div class="ano-bloco"><div class="ano-rot num">${a}</div>
      <table><tbody>${pre.filter(h=>h.ano===a).map(h=>{
        const c=acharClubePorNome(h.campeao);
        return `<tr>
          <td class="dim">${esc(h.evento)}</td>
          <td>${c?escudo(c,20):''} <b>${esc(h.campeao)}</b>${c?'':' <span class="dim">(não compete mais)</span>'}</td>
          <td class="dim r">${h.vice?'vice: '+esc(h.vice):''}</td></tr>`;}).join('')}
      </tbody></table></div>`).join('')}
  </div>`;
}
