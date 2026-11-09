/* ---------- telas ----------
   render() mora em ui/shell.js: é ele que sabe em qual shell estamos.
   Aqui ficam só as funções que devolvem o HTML de cada tela. */

/* faixa do circuito: o calendário inteiro numa linha, com o bloco atual
   destacado e os torneios grandes em ouro. Serve para responder de relance
   "onde estou na temporada e o que vem". */
function circuitoDoBloco(b){
  const n=String(b.nome||'');
  if(/Champions/.test(n))return{cor:'var(--c-champions)',ic:'trofeu'};
  if(/Masters/.test(n))return{cor:'var(--c-masters)',ic:'estrela'};
  if(/Kickoff/.test(n))return{cor:'var(--c-kickoff)',ic:'bandeira'};
  if(/Ascension/.test(n))return{cor:'var(--c-ascension)',ic:'sobe'};
  if(/Stage|Split/.test(n))return{cor:meu()&&meu().tier===2?'var(--c-challengers)':'var(--c-stage)',ic:'jogar'};
  return{cor:'var(--dim)',ic:'ciclo'};
}
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
    const cc=circuitoDoBloco(b);
    return `<div class="tl-item ${est} ${grande(b)?'major':''}" style="--cor:${cc.cor}">
      <div class="q">${ico(cc.ic)}${quando}</div>
      <div class="n">${esc(nomeBloco(b))}</div>
      <div class="d">${rotuloPeriodo(G.ano,b.ini,b.fim)}</div></div>`;
  }).join('')+`</div>`;
}

function proximoConfronto(){
  /* Na primeira semana de um torneio ele ainda não estava montado, e a Central
     dizia "começa daqui a 0 semanas" com o jogo marcado para agora. */
  if(typeof prepararSemana==='function')prepararSemana();
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
    ${typeof vazio==='function'?vazio('<b>Tabela ainda não iniciada.</b> Ela aparece aqui quando a liga do clube começar.','grafico'):'<p class="dim">Tabela ainda não iniciada.</p>'}</div>`;
  if(rr.tipo==='grupos'){
    const g=(rr.grupos||[]).find(x=>x.times.includes(t.id))||(rr.grupos||[])[0];
    if(!g)return `<div class="card"><div class="eyebrow">${esc(nomeLiga(t))}</div>
      <p class="dim">Sorteio ainda não realizado.</p></div>`;
    const ord=ordenarGrupo(g);
    return `<div class="card"><div class="split">
      <div class="eyebrow">${esc((typeof nomeStage==='function'&&nomeStage(rr))||nomeLiga(t))} · ${esc(g.nome)}</div>
      <span class="dim">rodada ${Math.min(rr.idx+1,rr.rodadasMax)}/${rr.rodadasMax}</span></div>
      <table class="tb"><thead><tr><th>#</th><th>Equipe</th><th class="c">V–D</th><th class="c">Rounds</th><th class="c">Forma</th></tr></thead>
      <tbody>${ord.map((id,i)=>{const x=g.tabela[id],z=i<rr.passam?'po':'';
        return `<tr class="${id===t.id?'me':''} ${z?'z-'+z:''}"><td>${selo(i+1,z)}</td><td>${celClube(id,22)}</td>
        <td class="c num"><b>${x.v}–${x.d}</b></td>
        <td class="c num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td><td class="c">${formaRecente(id,5)}</td></tr>`;}).join('')}
      </tbody></table>${legendaZonas([['po','Vai aos playoffs']])}</div>`;
  }
  const rk=rr.ranking.length?rr.ranking:ordenarTabela(rr);
  return `<div class="card"><div class="eyebrow">${esc(nomeLiga(t))}</div>
    <table class="tb"><tbody>${rk.slice(0,6).map((id,i)=>{const x=rr.tabela[id];
      return `<tr class="${id===t.id?'me':''}"><td>${selo(i+1)}</td><td>${celClube(id,22)}</td>
      <td class="c num"><b>${x.v}–${x.d}</b></td><td class="c num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td><td class="c">${formaRecente(id,5)}</td></tr>`;}).join('')
      ||'<tr><td class="dim">Tabela ainda não iniciada.</td></tr>'}</tbody></table></div>`;
}
/* vInicio (a Central) mora em ui/central.js */
/* ---------- elenco ----------
   Cada jogador com o que decide a semana: forma, desgaste, mental (core/
   vestiario.js), entrosamento médio com os titulares, mapas jogados,
   contrato (aviso quando acaba em menos de um ano) e o peso do salário. */
let elencoOrd='over', elencoFiltro='';
function barraElenco(v,cls,rot){
  const pct=Math.round(clamp(v,0,1)*100);
  return `<div class="vb el-vb" title="${esc(rot||'')}"><i class="${cls||''}" style="width:${pct}%"></i><span>${pct}</span></div>`;
}
function linhaElenco(t,p,titular,maxSal){
  const outros=t.titulares.filter(i=>i!==p.id);
  const ent=outros.length&&typeof dupla==='function'?outros.reduce((s,i)=>s+dupla(t,p.id,i),0)/outros.length:null;
  const men=typeof mentalDe==='function'?mentalDe(p):p.moral;
  const vence=p.contrato<=1;
  return `<tr class="${titular?'':'el-res'}">
    <td><span class="tag ${p.roleAtual||p.role}">${(p.roleAtual||p.role).slice(0,3)}</span></td>
    <td><b class="jrow el-nome" data-p="${p.id}">${esc(p.nome)}</b> ${FLAG[p.pais]||''}
      ${p.igl?'<span class="pill">IGL</span>':''}${p.lesao?' <span class="badge no">lesão '+p.lesao+'</span>':''}
      <div class="dim el-sub">${p.idade}a · pot ${p.pot}</div></td>
    <td class="c">${ovTag(p)}</td>
    <td>${barraElenco(p.forma,p.forma>=0.7?'g':p.forma<0.4?'r':'','Forma')}</td>
    <td>${barraElenco(p.fadiga,p.fadiga>0.7?'r':'','Desgaste')}</td>
    <td>${barraElenco(men,men>=0.7?'g':men<0.4?'r':'','Mental')}</td>
    <td class="c num">${ent==null?'—':`<span class="vm-pill" style="background:${typeof corDaDupla==='function'?corDaDupla(ent):'transparent'}">${Math.round(ent)}</span>`}</td>
    <td class="c num">${(p.temp&&p.temp.maps)||0}</td>
    <td class="c num ${vence?'dn':''}" title="${vence?'Contrato acaba nesta temporada':''}">${vence?'⚠ ':''}${p.contrato}a</td>
    <td><div class="el-sal"><div class="bar"><i style="width:${Math.round((p.salario||0)/Math.max(1,maxSal)*100)}%"></i></div>
      <span class="num dim">${money(p.salario||0)}</span></div></td>
    <td class="r el-bt">${titular?`<button class="btn ghost sm" data-igl="${p.id}">IGL</button>
      <button class="btn ghost sm" data-banco="${p.id}">Banco</button>`
      :`<button class="btn ghost sm" data-tit="${p.id}">Escalar</button>`}</td></tr>`;
}
function resumoElenco(t){
  const js=t.elenco.map(P).filter(Boolean);
  const funcoes=ROLES.filter(r=>r!=='Flex');
  /* titular conta pela função em que está jogando (roleAtual) */
  const cob=funcoes.map(r=>{const ts=js.filter(p=>t.titulares.includes(p.id)&&(p.roleAtual||p.role)===r).length,
    rs=js.filter(p=>!t.titulares.includes(p.id)&&(p.role===r||p.role2===r)).length;return{r,ts,rs};});
  const flex=js.filter(p=>p.role==='Flex').length;
  const idade=js.length?js.reduce((s,p)=>s+p.idade,0)/js.length:0;
  const idTit=t.titulares.length?t.titulares.map(P).reduce((s,p)=>s+p.idade,0)/t.titulares.length:0;
  const falta=cob.filter(c=>!c.ts).map(c=>'nenhum '+c.r.toLowerCase()+' entre os titulares')
    .concat(cob.filter(c=>c.ts&&!c.rs).map(c=>'sem reserva de '+c.r.toLowerCase()));
  const sobra=cob.filter(c=>c.ts+c.rs>=3).map(c=>c.r.toLowerCase()+' ('+(c.ts+c.rs)+')');
  const vencem=js.filter(p=>p.contrato<=1);
  return `<div class="card"><div class="eyebrow">Resumo do elenco</div>
    <div class="el-cob">${cob.map(c=>`<div class="${c.ts?'':'falta'}"><span class="tag ${c.r}">${c.r}</span>
      <span><b class="num">${c.ts}</b> <span class="dim">titular${c.ts===1?'':'es'}</span> · <b class="num">${c.rs}</b> <span class="dim">no banco</span></span></div>`).join('')}
      ${flex?`<div><span class="tag Flex">Flex</span><span><b class="num">${flex}</b> <span class="dim">no elenco, cobre qualquer função</span></span></div>`:''}</div>
    <div class="el-res-l">
      <div><span class="dim">Idade média</span><b class="num">${idade.toFixed(1)}</b><span class="dim">titulares ${idTit.toFixed(1)}</span></div>
      <div><span class="dim">Falta</span><b>${falta.length?esc(falta.join(' · ')):'nada'}</b></div>
      <div><span class="dim">Sobra</span><b>${sobra.length?esc(sobra.join(' · ')):'nada'}</b></div>
      <div><span class="dim">Contratos no fim</span><b class="${vencem.length?'dn':''}">${vencem.length?esc(vencem.map(p=>p.nome).join(', ')):'nenhum'}</b></div>
    </div></div>`;
}
function vElenco(){
  const t=meu();
  const tit=t.titulares.map(P),res=t.elenco.filter(i=>!t.titulares.includes(i)).map(P);
  const maxSal=Math.max(1,...t.elenco.map(i=>P(i).salario||0));
  const TH=`<thead><tr><th></th><th>Jogador</th><th class="c">Over</th><th>Forma</th><th>Desgaste</th><th>Mental</th>
    <th class="c" title="Entrosamento médio com os titulares">Entros.</th><th class="c" title="Mapas jogados na temporada">Mapas</th>
    <th class="c">Contrato</th><th>Salário</th><th></th></tr></thead>`;
  return `<div class="eyebrow">Elenco e escalação</div><h2 class="sec">Line-up</h2>
  ${escalacaoHTML(t,{editavel:true,botoes:'<button class="btn ghost sm" id="autoEsc">Escalação automática</button>'})}
  ${resumoElenco(t)}
  <div class="card"><div class="split"><div><div class="eyebrow">A semana do elenco</div>
    <span class="dim">Forma, desgaste e mental são da semana; o entrosamento é a média das duplas dele com os outros titulares.</span></div></div>
    <div class="rolagem"><table class="wide el-tab">${TH}<tbody>${tit.map(p=>linhaElenco(t,p,true,maxSal)).join('')}
      ${res.length?`<tr class="el-div"><td colspan="11">Banco</td></tr>`+res.map(p=>linhaElenco(t,p,false,maxSal)).join(''):''}</tbody></table></div>
  </div>
  <div class="card flat"><div class="eyebrow">Ficha completa</div>
    <table class="tb ordenavel"><thead>${THJ}</thead><tbody>${t.elenco.map(i=>linhaJog(P(i),{me:t.titulares.includes(i)})).join('')}</tbody></table>
    <p class="dim" style="margin-top:8px">Linhas destacadas = titulares. Clique num jogador para abrir a ficha.</p></div>`;
}
/* ============================================================
   TÁTICAS (pacote V11)
   ------------------------------------------------------------
   Sliders com marcação e prévia do efeito que muda enquanto você
   arrasta; foco e bloco de treino como cartões; a rotação de mapas
   junta a afinidade e a tática de cada mapa no mesmo cartão (antes
   eram duas tabelas que não se falavam); comissão e estrutura em
   cartões com retrato.
   ============================================================ */
const MARCAS_AGRES=['Cauteloso','Contido','Equilibrado','Agressivo','All-in'];
const MARCAS_SCRIM=['Leve','Moderado','Normal','Puxado','Intenso'];
const FOCOS_TAT=[
  {id:'execucao',nome:'Execuções',ic:'spike',desc:'Entradas coordenadas no site. Rende mais em mapa que favorece o ataque.'},
  {id:'default',nome:'Default',ic:'ciclo',desc:'Equilibrado: lê o round antes de decidir. Não ganha nem perde muito em lugar nenhum.'},
  {id:'retake',nome:'Retakes',ic:'escudo2',desc:'Defesa que cede o site e volta junto. Rende mais em mapa de defesa.'}];
const BLOCOS_TREINO=[
  {id:'mira',nome:'Mira e duelo',ic:'alvo',at:'mira, reflexo'},
  {id:'utilidade',nome:'Utilidade',ic:'pecas',at:'utilidade, movimentação'},
  {id:'tatica',nome:'Leitura e chamada',ic:'olho',at:'visão, liderança'},
  {id:'mental',nome:'Mental',ic:'balao',at:'clutch, consistência'},
  {id:'geral',nome:'Geral',ic:'ciclo',at:'tudo um pouco'}];
/* prévia: o que muda em relação ao meio da régua, em pontinhos */
function pontosEfeito(n){
  const a=Math.min(3,Math.abs(n));
  if(!a)return '<span class="pv-pts">neutro</span>';
  return `<span class="pv-pts ${n>0?'up':n<0?'dn':''}">${n>0?'▲':n<0?'▼':'•'}${'●'.repeat(a)}${'○'.repeat(3-a)}</span>`;
}
function previewAgres(v){
  const d=v-3;
  return [['Pistols',d],['Rounds de ataque',d],['Retakes',-d],['Rounds de eco',-Math.round(d*1.5)]]
    .map(([r,n])=>`<span class="pv">${r} ${pontosEfeito(clamp(Math.round(n),-3,3))}</span>`).join('');
}
function previewScrim(v){
  const d=v-3;
  return [['Entrosamento',d],['Evolução',d>0?1:d<0?-1:0],['Desgaste',d*1.5]]
    .map(([r,n])=>`<span class="pv">${r} ${pontosEfeito(clamp(Math.round(r==='Desgaste'?-n:n),-3,3))}</span>`).join('')
    +(v>=5?'<span class="pv aviso">acima de 82 de fadiga o jogador perde moral e pode quebrar</span>':'');
}
function sliderMarcado(id,v,marcas,lb){
  return `<div class="sl"><input type="range" min="1" max="5" step="1" value="${v}" id="${id}">
    <div class="sl-marcas">${marcas.map((m,i)=>`<span class="${i+1===v?'on':''}" data-marca="${i+1}">${m}</span>`).join('')}</div></div>`;
}
function vTaticas(){
  const t=meu();
  const focos=[['execucao','Execução'],['default','Default'],['retake','Retake']];
  const nomeFoco=k=>(focos.find(f=>f[0]===k)||focos[1])[1];
  const mapas=(G.mapasAtivos||[]).map(mp=>{
    const clube=t.mapPref[mp]||0, elenco=afinidadeElenco(t,mp), soma=clube*0.6+elenco*0.6;
    const tm=(t.taticaMapa&&t.taticaMapa[mp])||{};
    const p=preparoDoMapa(t,mp);
    return `<div class="tat-mapa" style="${fundoMapa(mp,0.7)}">
      <div class="split"><b class="tat-mn">${esc(mp)}</b>${anelPreparo(p.nota,46)}</div>
      <div class="tat-af"><span>clube <b class="num">${clube>0?'+':''}${clube}</b></span><span>elenco <b class="num ${elenco>=1?'up':elenco<=-1?'dn':''}">${elenco>0?'+':''}${elenco.toFixed(1)}</b></span></div>
      <div class="tat-conf"><i style="width:${clamp(50+soma*6,4,100)}%"></i></div>
      <div class="tat-sel">
        <select data-tmagres="${esc(mp)}" title="Agressividade neste mapa"><option value="">agres. ${t.tatica.agres} (padrão)</option>
          ${[1,2,3,4,5].map(n=>`<option value="${n}" ${tm.agres===n?'selected':''}>agres. ${n}</option>`).join('')}</select>
        <select data-tmfoco="${esc(mp)}" title="Foco neste mapa"><option value="">${esc(nomeFoco(t.tatica.foco))} (padrão)</option>
          ${focos.map(([k,n])=>`<option value="${k}" ${tm.foco===k?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="tat-pe ${p.partes.tatica>0.4?'up':p.partes.tatica<-0.4?'dn':''}">tática no preparo <b class="num">${p.partes.tatica>0?'+':''}${p.partes.tatica.toFixed(1)}</b>
        ${tm.agres||tm.foco?'<span class="chip t">própria</span>':''}</div>
    </div>`;}).join('');
  const comissao=comissaoDe(t).map(({cargo,membro})=>membro?`<div class="stf-c ${membro.voce?'voce':''}">
      ${retratoStaff(membro,58)}
      <div class="stf-i"><span class="eyebrow">${esc(cargo.nome)}${membro.voce?' · você':''}</span><b>${esc(membro.nome)} ${bandeira(membro.pais)}</b>
        <span class="dim">${membro.nomeReal?esc(membro.nomeReal)+' · ':''}${membro.idade}a · ${money(membro.salario)}/mês</span></div>
      <span class="ov ${ovClass(overStaff(membro))}">${overStaff(membro)}</span>
      <button class="btn ghost sm" data-fichastaff="${membro.id}">Ficha</button></div>`
    :`<div class="stf-c vago"><span class="stf-vago">${icone('gravata')}</span><div class="stf-i"><span class="eyebrow">${esc(cargo.nome)}</span>
      <b class="dn">vago</b><span class="dim">a vaga vale nível 1 · contrate no Mercado</span></div></div>`).join('');
  const extra=(t.equipeExtra||[]).map(x=>`<div class="stf-c">${retratoStaff(x,58)}<div class="stf-i"><span class="eyebrow">${esc(x.funcao||'Equipe')}</span>
      <b>${esc(x.nome)} ${x.pais?bandeira(x.pais):''}</b>${x.nomeReal?`<span class="dim">${esc(x.nomeReal)}</span>`:''}</div></div>`).join('');
  /* a estrutura saiu daqui e ganhou aba própria (ui/estrutura.js); fica o
     resumo do que mexe no treino, com o atalho */
  const estrutura=['treino','equip','analise'].map(k=>{const d=deptoDe(k),n=nivelEst(t,k);
    return `<div class="est-c"><span class="est-ic">${icone(d.ic)}</span><div><b>${esc(d.nome)}</b>
      <div class="est-nv">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}<span class="num">nível ${n}</span></div></div>
      <span class="dim num">${(()=>{const e=efeitosDepto(k,n)[0];return Math.abs(e.v)<1e-9?'padrão':e.f(e.v);})()}</span></div>`;}).join('');
  return `
  <div class="grid g2">
   <div class="card"><div class="eyebrow">Estilo de jogo</div>
    <div class="tat-sl"><div class="split"><span>Agressividade</span><b class="num" id="lbAg">${t.tatica.agres}</b></div>
      ${sliderMarcado('agres',t.tatica.agres,MARCAS_AGRES)}
      <div class="pv-l" id="pvAg">${previewAgres(t.tatica.agres)}</div></div>
    <div class="eyebrow" style="margin-top:16px">Foco tático</div>
    <div class="tat-focos">${FOCOS_TAT.map(f=>`<button class="tat-foco ${t.tatica.foco===f.id?'on':''}" data-focotat="${f.id}">
      <i>${ico(f.ic)}</i><b>${f.nome}</b><span>${esc(f.desc)}</span></button>`).join('')}</div>
    <div class="tat-sl" style="margin-top:16px"><div class="split"><span>Intensidade de scrims</span><b class="num" id="lbSc">${t.tatica.scrim}</b></div>
      ${sliderMarcado('scrim',t.tatica.scrim,MARCAS_SCRIM)}
      <div class="pv-l" id="pvSc">${previewScrim(t.tatica.scrim)}</div></div>
   </div>
   <div class="card"><div class="eyebrow">Bloco de treino</div>
    <div class="tat-blocos">${BLOCOS_TREINO.map(b=>`<button class="tat-bloco ${t.tatica.treino===b.id?'on':''}" data-blocotreino="${b.id}">
      <i>${ico(b.ic)}</i><b>${b.nome}</b><span>${b.at}</span></button>`).join('')}</div>
    <p class="dim" style="margin-top:8px;font-size:12px">O treino direciona onde os jogadores evoluem rumo ao potencial. Jovens ganham muito mais que veteranos. O plano de cada um fica em <b>Plano da semana</b>.</p>
    <div class="split" style="margin-top:16px"><div class="eyebrow">Estrutura que acelera o treino</div>
      <button class="btn ghost sm" data-ir="estrutura">Abrir Estrutura</button></div>
    <div class="est-l">${estrutura}</div>
   </div>
  </div>
  <div class="card"><div class="split"><div class="eyebrow">Rotação de mapas · afinidade e tática por mapa</div>
    <span class="dim">a tática geral vale onde você não marcou outra</span></div>
    <div class="tat-mapas">${mapas}</div>
    <p class="dim" style="margin-top:8px;font-size:12px"><b>Clube</b> é a identidade tática (editável no Banco de dados); <b>elenco</b> é a média dos cinco titulares.
    Execução rende mais em mapa que favorece o ataque, retake em mapa de defesa; agressividade combina com elenco de duelo.
    O anel é o preparo do mapa, o mesmo da aba Preparo e do veto.</p></div>
  <div class="card"><div class="split"><div class="eyebrow">Comissão técnica</div>
    <span class="dim">nível ${NIVEL_NEUTRO} é o neutro: acima ajuda, abaixo atrapalha</span></div>
    <div class="stf-grade">${comissao}${extra}</div></div>`;
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
    return `<button class="cmp-aba ${mp===mapa?'on':''}" data-compmapa="${esc(mp)}" style="${fundoMapa(mp,mp===mapa?0.35:0.65)}">${esc(mp)}
      ${escolhidos?`<span class="chip">${escolhidos}</span>`:''}</button>`;
  }).join(' ');

  const linhas=compEscalada(t,mapa).map(({p,ag,nivel,fun})=>{
    const escolhido=((t.comps&&t.comps[mapa])||{})[p.id];
    const pool2=agentesParaComp(p);
    const fx=faixaMeta(ag);
    const foraDaFuncao=fun!==(p.roleAtual||p.role)&&fun!=='Flex'&&(p.roleAtual||p.role)!=='Flex';
    return `<tr>
      <td><span class="merc-j">${retrato(p,32)}<span><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}
        <div class="dim" style="font-size:11px">${esc(p.roleAtual||p.role)}</div></span></span></td>
      <td class="c"><span class="ov ${ovClass(over(p))}">${over(p)}</span></td>
      <td><div class="cmp-ag">${retratoAgente(ag,40)}<div>
        <select data-compag="${p.id}">
          ${pool2.map(a=>`<option value="${esc(a.nome)}" ${a.nome===ag?'selected':''}
            >${esc(a.nome)} · ${a.nivel}/${a.teto} · ${esc(faixaMeta(a.nome).rot)}</option>`).join('')}
        </select>
        ${escolhido?'':'<div class="dim" style="font-size:10.5px">automático</div>'}
      </div></div></td>
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
    `<div class="cmp-meta"><span class="tag ${r}">${r}</span><div class="cmp-meta-l">${topoDoMeta(r,3).map((a,i)=>`<span class="cmp-mag ${i===0?'top':''}" title="${esc(a)}">${retratoAgente(a,40)}<b>${esc(a)}</b><i class="num">${forcaMeta(a)}</i></span>`).join('')}</div></div>`).join('');
  const patches=(G.patches||[]).slice(0,4).map(pt=>
    `<div class="slot"><span class="n"><b>${pt.ano} · semana ${pt.semana}</b>
      <div class="cmp-patch">${pt.mudou.map(x=>`<span class="cmp-pt ${x.tipo==='nerf'?'dn':'up'}">${retratoAgente(x.ag,26)}${x.tipo==='nerf'?'▼':'▲'} ${esc(x.ag)} <i class="num">${x.de}→${x.para}</i></span>`).join('')||'<span class="dim">sem mudanças</span>'}</div></span></div>`).join('')
    ||'<div class="dim">Nenhum patch ainda nesta temporada.</div>';

  return `
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

/* vComp mora em ui/competicoes.js (pacote 3) */
let compAba='minha';
function renderStage(s,semFaixa){
  const t=meu();
  const corpo=s.tipo==='grupos'?corpoGrupos(s,t)
             :s.tipo==='de'?corpoChave(s,t)
             :s.tipo==='swiss'?corpoSwiss(s,t)
             :s.tipo==='rr'?corpoTabela(s,t)
             :corpoMataMata(s,t);
  return `<div class="card flat">${cabecaTorneio(s,semFaixa)}${corpo}${rodapeMVP(s)}</div>`;
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
function cabecaTorneio(s,semFaixa){
  const b=blocoDoStage(s), tn=torneio(s.torneioId);
  const est=estadoStage(s);
  const premio=premiosDoStage(s)[0]||0;
  /* Internacional: faixa da cidade-sede atrás do cabeçalho. Fase final já
     decidida: o troféu do evento ao lado do campeão. */
  const sede=typeof sedeDe==='function'?sedeDe(s.torneioId):null;
  const campeao=s.feito&&s.ranking&&s.ranking[0]&&s.tipo!=='grupos'&&s.tipo!=='swiss'?G.times[s.ranking[0]]:null;
  const trofeu=campeao&&typeof arquivoTrofeu==='function'?arquivoTrofeu(s.torneioId):null;
  const faixa=!semFaixa&&(sede||campeao)?`<div class="tn-faixa"${sede?` style="${fundoCidade(sede.slug,0.45)}"`:''}>
      <div>${sede?`<div class="eyebrow">Sede</div><div class="tn-cidade">${esc(sede.nome)}</div>
        <div class="dim">${bandeira(sede.pais)} ${esc(nomePais(sede.pais))}</div>`:''}</div>
      ${campeao?`<div class="tn-campeao">${imgTrofeu(trofeu,44,'Troféu de '+nomeTitulo(s))}
        <div><div class="eyebrow">Campeão</div>${timeInline(campeao.id,22)}</div></div>`:''}
    </div>`:'';
  return `${faixa}<div class="split">
    <div class="eyebrow">${arteDoStage(s,22)} ${esc(nomeStage(s))}</div>
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
      <table class="tb"><thead><tr><th>#</th><th>Equipe</th><th class="c">V–D</th><th class="c">Mapas</th><th class="c">Rounds</th><th class="c">Forma</th></tr></thead><tbody>${ord.map((id,i)=>{
        const x=g.tabela[id],z=i<s.passam?'po':'';
        return `<tr class="${id===t.id?'me':''} ${z?'z-'+z:''}">
          <td>${selo(i+1,z)}</td><td>${celClube(id,22)}</td>
          <td class="c num"><b>${x.v}–${x.d}</b></td><td class="c num dim">${x.mv}–${x.md}</td>
          <td class="c num dim">${x.rv-x.rd>0?'+':''}${x.rv-x.rd}</td><td class="c">${formaRecente(id,5)}</td></tr>`;}).join('')}
      </tbody></table></div>`;
  }).join('');
  return `<div class="grades">${grupos}</div>
    ${legendaZonas([['po','Os '+s.passam+' primeiros de cada grupo vão aos playoffs']])}
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
function cartaoJogo(j,t,sid){
  const vA=j.v===j.a;
  /* com a ficha guardada, o jogo abre a série (ui/competicoes.js) */
  const abre=sid&&j.n!=null?` data-serie="${esc(sid)}|${j.n}" title="Abrir a ficha da série"`:'';
  return `<div class="jg ${abre?'abre':''}"${abre}>
    <div class="jg-l ${vA?'w':''} ${j.a===t.id?'me':''}"><span>${esc(tagT(j.a))}</span><b>${j.wa}</b></div>
    <div class="jg-l ${vA?'':'w'} ${j.b===t.id?'me':''}"><span>${esc(tagT(j.b))}</span><b>${j.wb}</b></div>
  </div>`;
}
function corpoChave(s,t){
  /* chave desenhada (ui/chave.js): esqueleto completo, linhas e troféu */
  if(typeof chaveDesenhada==='function'&&(s.times||[]).length>=2){
    const d=chaveDesenhada(s);
    if(d)return d+`<p class="dim" style="margin-top:8px">Dupla eliminação: perder uma vez manda para a chave inferior, perder duas elimina. Clique num jogo para abrir a série.</p>`;
  }
  const linha=(fase,rot)=>{
    const cols=(s.chave||[]).filter(r=>r.fase===fase);
    if(!cols.length)return '';
    return `<div class="ch-lin"><div class="ch-rot">${rot}</div>
      <div class="ch-cols">${cols.map(r=>`<div class="ch-col">
        <div class="ch-nome">${esc(r.nome)}</div>
        ${r.jogos.map(j=>cartaoJogo(j,t,s.id)).join('')||'<div class="dim">bye</div>'}
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
  const desenho=typeof suicoDesenhado==='function'?suicoDesenhado(s):'';
  return `${desenho}<details class="sorteio"${desenho?'':' open'}><summary>Tabela da fase suíça</summary><table class="tb"><thead><tr><th>#</th><th>Equipe</th><th class="c">Campanha</th><th class="c">Mapas</th></tr></thead>
    <tbody>${ord.map((id,i)=>{const su=s.suico[id],x=s.tabela[id];
      return `<tr class="${id===t.id?'me':''}"><td>${selo(i+1)}</td><td>${celClube(id,22)}</td>
      <td class="c num"><b>${su.v}–${su.d}</b></td><td class="c num dim">${x.mv}–${x.md}</td></tr>`;}).join('')}
    </tbody></table>
    </details><p class="dim" style="margin-top:6px">Cada rodada junta quem tem a mesma campanha. Todos avançam — o que a fase decide é o chaveamento.</p>`;
}
/* ---------- pontos corridos (formato antigo, ainda usado por saves velhos) ---------- */
function corpoTabela(s,t){
  const rk=s.ranking.length?s.ranking:ordenarTabela(s);
  return `<table class="tb"><thead><tr><th>#</th><th>Equipe</th><th class="r">V-D</th><th class="r">Mapas</th><th class="r">Rounds</th></tr></thead>
    <tbody>${rk.map((id,i)=>{const x=s.tabela[id];return `<tr class="${id===t.id?'me':''}"><td>${selo(i+1)}</td>
    <td>${celClube(id,22)}</td>
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
  const div=divisaoTreino(pl);
  const mapas=(G.mapasAtivos||[]).map(mp=>{
    const meuA=afinidadeElenco(t,mp);
    const advA=adv?afinidadeElenco(adv,mp):null;
    const d=div.find(x=>x.mapa===mp);
    return `<div class="mp-card ${d?'on':''}" style="${fundoMapa(mp,0.62)}">
      <button class="mp-alvo" data-treinomapa="${esc(mp)}" title="${d?'Tirar do treino':'Treinar esta semana'}">
      <div class="mp-nome">${esc(mp)}</div>
      <div class="mp-val ${meuA>=3?'up':meuA<=-2?'dn':''}">${meuA>0?'+':''}${meuA.toFixed(1)}</div>
      ${adv?`<div class="mp-adv">${esc(adv.tag)} ${advA>0?'+':''}${advA.toFixed(1)}</div>`:''}
      <div class="mp-tag">${d?'treinando · '+Math.round(d.frac*100)+'%':'treinar'}</div></button>
      ${d?`<div class="mp-niv" title="Prioridade no treino">${['baixa','media','alta'].map((p,i)=>
        `<button data-prioset="${esc(mp)}|${p}" class="${['baixa','media','alta'].indexOf(d.prio)>=i?'on':''}" title="${PRIO_NOME[p]}"></button>`).join('')}
        <span>${PRIO_NOME[d.prio]}</span></div>`:''}
    </div>`;
  }).join('');

  /* ---- quadro individual ---- */
  const attrs=ATTRS.map(([k,n])=>[k,n]);
  const linhas=t.elenco.map(P).sort((a,b)=>over(b)-over(a)).map(p=>{
    const plano=planoDoJogador(t,p);
    const gap=Math.max(0,(p.pot||0)-over(p));
    const meusAg=agentesDoJogador(p);
    return `<tr class="${plano.tipo==='descanso'?'descansa':''}">
      <td>${retrato(p,26)} <b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}
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

  ${px&&!px.espera?`<div class="card flat" style="border-left:4px solid var(--red)">
    <b>Tem jogo nesta semana</b> — ${px.bye?'bye':'contra '+esc(nomeT(px.adv))}. Quem treina pesado
    entra cansado, e cansaço é o que mais custa partida.</div>`
   :px&&px.espera?`<div class="card flat"><b>${esc(nomeBloco(px.espera))}</b> em ${px.semanas}
    semana${px.semanas===1?'':'s'} — é agora que dá para trabalhar sem pagar caro no sábado.</div>`:''}
  ${typeof cardRange==='function'?cardRange(t):''}

  <div class="card"><div class="split">
    <div><div class="eyebrow">Treino de mapa · até ${MAPAS_TREINO_MAX} por semana</div>
      <div class="dim">O que você treina sobe; o que você abandona escorrega. Com mais de um mapa o
      trabalho se divide pela prioridade (alta, média, baixa = 5 : 3 : 2), e o ganho total é maior
      que o de um só, mas não o triplo: um mapa rende 100%, dois 115%, três 130%. A porcentagem em
      cada mapa é quanto ele recebe de uma semana dedicada só a ele.</div></div>
    <div>${div.length?`<button class="btn ghost sm" data-treinomapa="">Nenhum mapa esta semana</button>`:''}</div>
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
  const venc=t.elenco.map(P).filter(p=>p&&p.contrato<=1).length;
  const abas=`<div class="tabs">${[['central','Central'],['jogadores','Jogadores'],['comissao','Comissão técnica'],
      ['saidas','Saídas'+(pend?' ('+pend+')':'')],
      ['contratos','Contratos'+(venc?' ('+venc+')':'')]]
    .map(([k,n])=>`<button data-merc="${k}" class="${mercAba===k?'on':''}">${n}</button>`).join('')}</div>`;
  const prazo=typeof ultimoDiaDaJanela==='function'&&ultimoDiaDaJanela();
  return `<div class="eyebrow">Mercado ${G.janela?'· janela aberta':'· janela fechada'}</div>
    ${(()=>{
      /* Reta final da janela: contagem em dias e o que ainda está em aberto.
         Quem não fechar até o domingo da última semana só fecha na próxima. */
      if(!janelaAberta(G.ano,G.semana||1))return '';
      const d=diasAteFecharJanela(G.ano,G.semana||1,G.turno||0);
      if(d>7&&!prazo)return '';
      const abertas=(G.negociacoes||[]).filter(n=>n.fase==='clube'||n.fase==='jogador'||n.fase==='troca');
      const nomes=abertas.slice(0,4).map(n=>{const p=P(n.jogadorId);return p?esc(p.nome):null;}).filter(Boolean);
      return `<div class="merc-prazo">⏰ <b>${d<=1?'Dia do fechamento.':d<=3?'Fechamento da janela em '+d+' dias.':'A janela fecha em '+d+' dias.'}</b>
        ${prazo?' Os clubes estão correndo atrás de reforço: propostas chegam mais rápido.':''}
        ${abertas.length?` Negociações em aberto: <b>${nomes.join(', ')}</b>${abertas.length>nomes.length?' e mais '+(abertas.length-nomes.length):''}.`:''}
        ${pend?` ${pend} proposta${pend>1?'s':''} por jogadores seus esperando resposta.`:''}
        Quem não fechar até lá só fecha na próxima janela.</div>`;
    })()}
    <h2 class="sec">${mercAba==='central'?'Central de transferências':mercAba==='saidas'?'Negociar saídas':mercAba==='contratos'?'Contratos e pré-contratos':'Scout'}</h2>${abas}${
    mercAba==='central'?vMercadoCentral(t):mercAba==='comissao'?vMercadoStaff(t):mercAba==='contratos'?vMercadoContratos(t):mercAba==='saidas'?vMercadoSaidas(t):vMercadoJogadores(t)}`;
}
/* ---------- saídas: vender e emprestar ----------
   A tela é deliberadamente do lado de cá do balcão: você anuncia, e as
   propostas CHEGAM ao longo das semanas. Não existe botão de vender, porque
   não existe comprador garantido — é isso que faz o preço significar algo. */
function vMercadoSaidas(t){
  const props=(G.propostas||[]).filter(x=>{const p=P(x.jogadorId);return p&&p.timeId===t.id;});
  const fora=typeof emprestadosDe==='function'?emprestadosDe(t):[];
  const podeSair=t.elenco.length>ELENCO_MIN;

  /* propostas agrupadas por jogador: cada um vira um cartão, com o leilão
     quando dois clubes ou mais querem o mesmo */
  const porJog={};props.forEach(x=>(porJog[x.jogadorId]=porJog[x.jogadorId]||[]).push(x));
  const linhaProp=x=>{const c=T(x.clubeId);const o=x.tipo==='troca'?P(x.oferecidoId):null;
    const tipo=x.tipo==='multa'?'<span class="chip r">Multa paga</span>'
      :x.tipo==='troca'&&o?`<span class="chip g">Troca</span> por <b class="jrow" data-p="${o.id}">${esc(o.nome)}</b> ${ovTag(o)}`
      :x.tipo==='compra'?'<span class="chip">Compra</span>'+(x.leilao?' <span class="chip t">leilão</span>':'')+(x.espontanea?' <span class="dim">sem anúncio</span>':'')
      :'<span class="chip t">Empréstimo</span>'+(x.opcaoCompra?' <span class="dim">opção '+money(x.opcaoCompra)+'</span>':'');
    return `<div class="prop-linha ${x.tipo==='multa'?'multa':''}">
      ${escudo(c,30)}<div class="prop-clube"><b>${esc(c.nome)}</b><span class="dim">${nomeLiga(c)}</span></div>
      <div class="prop-tipo">${tipo}</div>
      <div class="prop-valor num"><b>${x.tipo==='troca'?(x.taxa?'+ '+money(x.taxa):'só a troca'):money(x.taxa)}</b>
        ${x.revenda?`<span class="chip t" title="Você fica com ${x.revenda}% de uma venda futura">+${x.revenda}% revenda</span>`:''}
        ${x.tipo==='compra'&&x.pedido?`<span class="dim">pede ${money(x.pedido)}</span>`:''}</div>
      <div class="prop-sal dim num">${money(x.salario)}/mês</div>
      <div class="prop-prazo dim">${x.prazo} sem.</div>
      <div class="prop-bts">${x.tipo==='multa'
        ?`<button class="btn sm" data-segurar="${x.id}" title="Oferece ${Math.round(SEGURAR_AUMENTO*100)}% de aumento; uma tentativa só">Tentar segurar</button>
          <button class="btn ghost sm" data-aceitar="${x.id}">Liberar</button>`
        :`${x.tipo!=='troca'?`<button class="btn teal sm" data-negvenda="${x.id}" title="Peça mais: o clube responde subindo a oferta ou parando no limite dele">${x.neg?'Mesa':'Negociar'}</button>`:''}
          <button class="btn sm" data-aceitar="${x.id}">Aceitar</button>
          <button class="btn ghost sm" data-recusar="${x.id}">Recusar</button>`}</div></div>`;};
  const cxPropostas=props.length?`
  <div class="card flat"><div class="eyebrow">Propostas na mesa</div>
    ${Object.keys(porJog).map(pid=>{const p=P(pid),lst=porJog[pid];
      const multa=lst.find(x=>x.tipo==='multa');
      return `<div class="prop-card ${multa?'multa':''}">
        <div class="prop-jog">${cartaJogador(p,{w:74})}<div><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b>
          <div class="dim">${esc(p.role)} · ${p.idade} anos · ${p.contrato}a de contrato</div>
          <div class="dim">Vale ${money(pedidoDeVenda(p))} · multa ${money(multaDe(p))}</div>
          ${multa?`<div class="prop-alerta">${esc(T(multa.clubeId).nome)} pagou a multa. O clube não pode recusar: só ele decide, e ele quer ir.</div>`:''}
          ${podeLeiloar(pid)?`<button class="btn teal sm" data-leilao="${pid}" style="margin-top:6px">Abrir leilão (${lst.filter(x=>x.tipo==='compra').length} clubes)</button>`:''}
        </div></div>
        <div class="prop-lista">${lst.map(linhaProp).join('')}</div></div>`;}).join('')}
  </div>`
  :`<div class="card flat"><div class="eyebrow">Propostas na mesa</div>
      <p class="dim">Nenhuma no momento. Anuncie um jogador abaixo e os clubes que precisam
      da função dele vão aparecer ao longo das semanas. Com a janela aberta, clubes também ligam por quem não está à venda.</p></div>`;

  const pedidos=t.elenco.map(P).filter(p=>p&&p.pedidoSaida&&!p.pedidoSaida.aceito);
  const cxPedidos=pedidos.length?`
  <div class="card flat" style="border-left:4px solid var(--amber,#e0a030)"><div class="eyebrow">Pedidos de saída</div>
    ${pedidos.map(p=>`<div class="prop-linha">
      <span class="ov ${ovClass(over(p))}">${over(p)}</span>
      <div class="prop-clube"><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b><span class="dim">${esc(p.pedidoSaida.motivo||'')}</span></div>
      <div class="prop-bts">${p.pedidoSaida.negado?'<span class="chip r">negado</span>'
        :`<button class="btn sm" data-psaida="sim:${p.id}">Aceitar e pôr à venda</button>
          <button class="btn ghost sm" data-psaida="nao:${p.id}">Negar</button>`}</div></div>`).join('')}
    <p class="dim" style="margin-top:6px">Negar segura o jogador, mas a moral dele cai toda semana até ele desistir.</p></div>`:'';

  const comigo=t.elenco.map(P).filter(p=>p&&p.emprestimo&&p.emprestimo.donoId!==t.id);
  const cxComigo=comigo.length?`
  <div class="card flat"><div class="eyebrow">Emprestados para você</div>
    <table><tbody>${comigo.map(p=>`<tr>
      <td><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b></td><td class="dim">do ${esc(nomeT(p.emprestimo.donoId))}</td>
      <td class="r num dim">você paga ${money(p.salario)}/mês</td>
      <td class="r">${p.emprestimo.opcaoCompra?`<button class="btn sm" data-opcao="${p.id}" ${G.janela?'':'disabled'}>Exercer opção (${money(p.emprestimo.opcaoCompra)})</button>`:'<span class="dim">sem opção</span>'}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim" style="margin-top:6px">Voltam ao dono na virada da temporada, a menos que você exerça a opção.</p></div>`:'';

  const cxFora=fora.length?`
  <div class="card flat"><div class="eyebrow">Emprestados por você</div>
    <table><tbody>${fora.map(p=>`<tr>
      <td><b>${esc(p.nome)}</b></td><td class="dim">no ${esc(nomeT(p.timeId))}</td>
      <td class="r num dim">você paga ${money(p.emprestimo.parteDono)}/mês</td>
      <td class="r dim">${p.emprestimo.opcaoCompra?'opção de '+money(p.emprestimo.opcaoCompra):'sem opção'}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim" style="margin-top:6px">Voltam na virada de temporada, a menos que o clube exerça a opção.</p></div>`:'';

  return `${G.janela?'':'<div class="card" style="border-left:4px solid var(--red)">A janela está fechada. Você pode anunciar, mas proposta só chega com a janela aberta.</div>'}
  ${cxPedidos}${cxPropostas}${cxComigo}${cxFora}
  <div class="card flat"><div class="eyebrow">Seu elenco</div>
    ${podeSair?'':`<p class="dim">Com ${t.elenco.length} jogadores você não pode vender ninguém — o mínimo é ${ELENCO_MIN}. Emprestar também não, porque o elenco ficaria curto.</p>`}
    <table class="wide tb ordenavel"><thead><tr><th>Jogador</th><th>Função</th><th class="c">Idade</th>
      <th class="c">Over</th><th class="c">Pot</th><th class="r">Vale</th><th>Situação</th><th></th></tr></thead>
    <tbody>${t.elenco.map(P).sort((a,b)=>over(b)-over(a)).map(p=>`<tr>
      <td><span class="merc-j">${retrato(p,28)}<span><b class="jrow" data-p="${p.id}">${esc(p.nome)}</b> ${FLAG[p.pais]||''}${t.titulares.includes(p.id)?' <span class="chip">titular</span>':''}</span></span></td>
      <td><span class="tag ${p.role}">${esc(p.role)}</span></td>
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
      <td class="r">${membro&&membro.voce?'<span class="chip t">você</span>':membro?`<button class="btn ghost sm" data-dispstaff="${membro.id}">Dispensar</button>`:''}</td>
    </tr>`).join('')}</tbody></table>
    <p class="dim" style="margin-top:8px">${esc(CARGOS.map(c=>c.curto+': '+c.efeito.toLowerCase()).join(' · '))}</p>
  </div>
  <div class="card flat"><table class="wide tb ordenavel merc-tab"><thead><tr><th></th><th>Nome</th><th>Cargo</th><th>Clube</th>
    <th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th><th class="r">Pedido</th>
    <th class="r">Salário</th><th></th></tr></thead>
    <tbody>${lista.map(m=>`<tr>
      <td>${retratoStaff(m,26)}</td>
      <td><b>${esc(m.nome)}</b> ${bandeira(m.pais)}</td>
      <td><span class="tag">${esc((CARGOS.find(c=>c.id===m.cargo)||{curto:m.cargo}).curto)}</span></td>
      <td>${m.timeId?`<span class="linha-t">${escudo(T(m.timeId),18)}<span class="dim">${esc(tagT(m.timeId))}</span></span>`:'<span class="chip t">Livre</span>'}</td>
      <td class="c num">${m.idade}</td>
      <td class="c"><span class="ov ${ovClass(overStaff(m))}">${overStaff(m)}</span></td>
      <td class="c num dim">${m.pot}</td>
      <td class="r num">${m.timeId?money(pedidoStaff(m)):'—'}</td>
      <td class="r num">${money(salarioPedidoStaff(m,t))}</td>
      <td class="r">${G.janela?`<button class="btn-ic" data-propstaff="${m.id}" title="Propor contrato">${ico('contrato')}<span>Propor</span></button>`:''}</td>
    </tr>`).join('')}</tbody></table></div>`;
}
/* ---------- contratos ----------
   Quem vence, quanto cada um quer ficar e quem já está sendo sondado. Do
   outro lado, quem está no último ano nos outros clubes: alvo de pré-contrato. */
function vMercadoContratos(t){
  const meus=t.elenco.map(P).filter(Boolean).sort((a,b)=>a.contrato-b.contrato||over(b)-over(a));
  const situacao=p=>{
    if(p.preContrato&&T(p.preContrato.clubeId))return `<span class="chip r">Pré-contrato com ${esc(T(p.preContrato.clubeId).tag)}</span>`;
    if(p.sondado&&T(p.sondado.clubeId))return `<span class="chip" style="color:var(--amber)">Sondado pelo ${esc(T(p.sondado.clubeId).tag)}</span>`;
    if(renovacaoFechada(p))return `<span class="dim">conversa fechada · ${semanasAteRenovar(p)} sem.</span>`;
    if(negociacaoAtivaDe(p.id))return '<span class="chip t">em negociação</span>';
    return p.contrato<=1?'<span class="dn">vence no fim da temporada</span>':'<span class="dim">—</span>';
  };
  const ficar=p=>{const it=interesseEmFicar(p,t);
    return `<span class="int-mini f-${it.faixa.id}" title="${esc(it.faixa.nome)}"><span class="int-tr"><i style="width:${it.nota}%"></i></span><b class="num">${it.nota}</b></span>`;};
  const outros=Object.values(G.jogadores).filter(p=>p.timeId&&p.timeId!==t.id&&p.contrato<=1&&!p.base&&!p.emprestimo)
    .sort((a,b)=>over(b)-over(a)).slice(0,30);
  const aberto=janelaPreContrato();
  return `<div class="card flat"><div class="eyebrow">Seus contratos</div>
    <p class="dim" style="margin-bottom:8px">Da semana ${SEMANA_PRECONTRATO} em diante, quem está no último ano pode assinar
    pré-contrato com outro clube e sair de graça. Renove antes.</p>
    <table class="wide tb ordenavel"><thead><tr><th>Jogador</th><th class="c">Over</th><th class="r">Salário</th><th class="c">Contrato</th>
      <th class="c">Vontade de ficar</th><th>Situação</th><th></th></tr></thead>
    <tbody>${meus.map(p=>`<tr><td class="jrow" data-p="${p.id}"><b>${esc(p.nome)}</b> ${bandeira(p.pais)}</td>
      <td class="c">${ovTag(p)}</td><td class="r num">${money(p.salario)}</td>
      <td class="c num ${p.contrato<=1?'dn':''}">${p.contrato}a</td><td class="c">${ficar(p)}</td>
      <td>${situacao(p)}</td>
      <td class="r"><button class="btn ghost sm" data-renov="${p.id}" ${p.preContrato?'disabled':''}>Renovar</button></td></tr>`).join('')}
    </tbody></table></div>
  <div class="card flat"><div class="eyebrow">Último ano em outros clubes</div>
    <p class="dim" style="margin-bottom:8px">${aberto?'Pré-contrato liberado: negocie direto com o jogador, sem taxa. Ele chega na virada.'
      :'O pré-contrato abre na semana '+SEMANA_PRECONTRATO+'. Até lá, só comprando do clube.'}</p>
    <table class="wide tb ordenavel merc-tab"><thead><tr><th>Jogador</th><th>Clube</th><th class="c">Over</th><th class="c">Idade</th>
      <th class="c">Interesse</th><th>Situação</th><th></th></tr></thead>
    <tbody>${outros.map(p=>`<tr class="merc-tr"><td class="jrow" data-p="${p.id}"><span class="merc-j">${retrato(p,28)}<span><b>${esc(p.nome)}</b> ${bandeira(p.pais)}</span></span></td>
      <td><span class="linha-t">${escudo(T(p.timeId),18)}<span class="dim">${esc(nomeT(p.timeId))}</span></span></td><td class="c">${ovTag(p)}</td><td class="c num">${p.idade}</td>
      <td class="c">${interesseMini(p,t)}</td>
      <td>${p.preContrato&&T(p.preContrato.clubeId)?'<span class="chip r">acertado com '+esc(T(p.preContrato.clubeId).tag)+'</span>':'<span class="dim">livre para conversar</span>'}</td>
      <td class="r">${p.preContrato?'':`<button class="btn-ic" data-prop="${p.id}" title="${aberto?'Pré-contrato':'Negociar'}">${ico(aberto?'contrato':'aperto')}<span>${aberto?'Pré-contrato':'Negociar'}</span></button>`}</td></tr>`).join('')}
    </tbody></table></div>`;
}
/* termômetro de bolso para a lista do mercado */
function interesseMini(p,t){
  const it=interessePor(p,t);
  return `<span class="int-mini f-${it.faixa.id}" title="${esc(it.faixa.nome)}: ${esc(it.faixa.txt)}"><span class="int-tr"><i style="width:${it.nota}%"></i></span><b class="num">${it.nota}</b></span>`;
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
  <div class="card flat"><table class="wide merc-tab"><thead><tr><th>Jogador</th><th>Clube</th><th>Função</th><th class="c">Idade</th>
    <th class="c">Over</th><th class="c">Pot</th><th class="c">Interesse</th><th class="r">Pedido</th><th class="r">Salário</th><th></th></tr></thead>
    <tbody>${lista.map(p=>{const c=p.timeId?T(p.timeId):null,mesa=negociacaoAtivaDe(p.id);
      return `<tr class="jrow" data-p="${p.id}"><td><span class="merc-j">${retrato(p,30)}<span><b>${esc(p.nome)}</b> ${FLAG[p.pais]||''}</span></span></td>
      <td>${c?`<span class="linha-t">${escudo(c,20)}<span class="dim">${esc(c.nome)}</span></span>`:'<span class="chip t">Livre</span>'}</td>
      <td><span class="tag ${p.role}">${p.role}</span></td><td class="c num">${p.idade}</td>
      <td class="c">${ovTag(p)}</td><td class="c num dim">${p.pot}</td>
      <td class="c">${interesseMini(p,t)}</td>
      <td class="r num">${p.timeId?money(precoPedido(p)):'—'}${p.timeId&&posturaDoClube(p).id==='intransferivel'?' <span class="chip r" title="Só pela multa">multa</span>':''}</td>
      <td class="r num">${money(salarioPedido(p,t))}</td>
      <td class="r"><button class="btn-ic ${mesa?'on':''}" data-prop="${p.id}" title="${mesa?'Voltar à mesa':'Negociar'}">${ico(mesa?'balao':'aperto')}<span>${mesa?'Mesa':'Negociar'}</span></button></td></tr>`;}).join('')}
    </tbody></table></div>`;
}
/* Radar das rankeds (core/radar.js): contas que o olheiro acompanha, com a
   leitura borrada que fica nítida a cada semana, o teste e a decisão. */
/* Selo de rank desenhado (Radiante e Imortal), sem depender de arquivo. */
function seloRank(rank,px){
  px=px||40;
  const rad=/^Radiante/.test(rank),num=(String(rank).match(/#(\d+)/)||[])[1],div=(String(rank).match(/Imortal (\d)/)||[])[1];
  const c1=rad?'#FFF2B0':'#FF6B8A',c2=rad?'#E2B45A':'#B5174A',id='rk'+(rad?'r':'i')+(div||'');
  const forma=rad
    ?`<path d="M20 3 27 12 37 14 30 22 32 33 20 28 8 33 10 22 3 14 13 12z" fill="url(#${id})" stroke="#FFF7D6" stroke-width="1.2"/>
       <circle cx="20" cy="18" r="5" fill="#fff" opacity=".85"/>`
    :`<path d="M6 10 13 16 20 6 27 16 34 10 31 30H9z" fill="url(#${id})" stroke="#FFC2CF" stroke-width="1.2"/>
       ${Array.from({length:+div||1},(_,i)=>`<rect x="${14+i*5}" y="22" width="3" height="5" fill="#fff" opacity=".85"/>`).join('')}`;
  return `<span class="rk-selo ${rad?'rad':'imo'}" title="${esc(rank)}"><svg width="${px}" height="${px}" viewBox="0 0 40 40">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>${forma}</svg>
    ${num?`<b class="num">#${num}</b>`:''}</span>`;
}
const COR_OLHEIRO=['var(--red)','var(--red)','var(--amber)','#E8D25A','var(--teal)','var(--gold)'];
/* Radar das rankeds (core/radar.js) como uma ladder: o selo do rank, a
   leitura enchendo na cor do olheiro e o teste em destaque. */
function blocoRadar(t){
  if(typeof radarRanked!=='function')return '';
  const R=radarRanked(),nv=nivelOlheiroDe(t);
  const corO=COR_OLHEIRO[clamp(Math.round(nv),1,5)];
  const ativas=R.contas.slice().sort((a,b)=>({decisao:0,teste:1,radar:2}[a.estado]-{decisao:0,teste:1,radar:2}[b.estado])||a.rankOrd-b.rankOrd);
  const faixa=(a,b)=>a===b?String(a):a+'–'+b;
  const destaque=ativas.filter(c=>c.estado!=='radar');
  const ladder=ativas.filter(c=>c.estado==='radar');
  const linha=(c,i)=>{const L=leituraDaConta(c,t);
    return `<div class="rd-c rd-${c.estado}">
      <span class="rd-pos num">${i+1}</span>
      ${seloRank(c.rank,38)}
      <div class="rd-id"><b>${esc(c.nome)}</b> ${FLAG[c.pais]||''} <span class="tag ${c.role}">${c.role}</span>
        <div class="dim">${esc(c.rank)} · ${retratoAgente(c.agente,18)} ${esc(c.agente)} · ~${c.idade} anos · ${c.partidas+c.obs*12} partidas vistas</div></div>
      <div class="rd-leit"><div class="rd-barra" style="--cor:${corO}"><i style="width:${Math.round(L.p*100)}%"></i></div>
        <span class="dim">${'leitura '+Math.round(L.p*100)+'% · '+c.obs+' sem.'}</span></div>
      <div class="rd-num"><span class="dim">Over</span><b class="num">${faixa(L.ov[0],L.ov[1])}</b></div>
      <div class="rd-num"><span class="dim">Potencial</span><b class="num" style="color:var(--gold)">${faixa(L.pot[0],L.pot[1])}</b></div>
      <div class="rd-bt">${typeof minigamesLigados==='function'&&minigamesLigados()&&typeof vodBaseDisponivel==='function'&&vodBaseDisponivel(t)
          ?`<button class="btn ghost sm" data-vodconta="${c.id}" title="Quiz de VOD: até +${VOD_BASE_MAX} semanas de observação">VOD</button>`:''}
          <button class="btn ghost sm" data-rteste="${c.id}">Chamar para teste</button>
          <button class="btn sm ghost" data-rtira="${c.id}">Tirar</button></div>
    </div>`;};
  const cartaoTeste=c=>{const L=leituraDaConta(c,t);
    return `<div class="rd-teste ${c.estado}">
      ${seloRank(c.rank,64)}
      <div class="rd-t-id"><span class="eyebrow">${c.estado==='teste'?'Em teste nesta semana':'Teste encerrado · decida'}</span>
        <b>${esc(c.nome)} ${FLAG[c.pais]||''}</b>
        <div class="dim">${esc(c.rank)} · ${c.role} · ~${c.idade} anos · main ${esc(c.agente)}</div></div>
      <div class="rd-t-nums"><div><span>Over</span><b class="num">${faixa(L.ov[0],L.ov[1])}</b></div>
        <div><span>Potencial</span><b class="num" style="color:var(--gold)">${faixa(L.pot[0],L.pot[1])}</b></div></div>
      <div class="rd-bt">${c.estado==='teste'?'<span class="chip t">resultado no fim da semana</span>'
        :`<button class="btn sm" data-raceita="${c.id}">Aceitar na base</button><button class="btn sm ghost" data-rtira="${c.id}">Dispensar</button>`}</div>
    </div>`;};
  return `<div class="card"><div class="split"><div class="eyebrow">Radar das rankeds · ${esc(nomeLiga(t).replace(/^VCT /,''))}</div>
      <span class="rd-olh" style="--cor:${corO}">olheiro <b class="num">${nv.toFixed(1)}</b> de 5 · ${ativas.length} de ${RADAR_MAX} contas</span></div>
    ${explica(`O olheiro varre a ladder toda semana. Cada conta começa borrada e fica mais nítida a cada
    semana de observação — olheiro melhor lê mais rápido e erra menos o potencial. O teste dura uma semana e mostra tudo.
    Conta que ninguém chama some em ${RADAR_VIDA} semanas, e os rivais também estão olhando.`,'Como o radar funciona')}
    ${destaque.map(cartaoTeste).join('')}
    ${ladder.length?`<div class="rd-lista">${ladder.map(linha).join('')}</div>`:destaque.length?'':'<div class="empty">O olheiro ainda não marcou nenhuma conta. Elas aparecem ao longo das semanas.</div>'}
    ${(R.hist||[]).length?`<div class="rd-hist">${R.hist.slice(0,5).map(h=>`<span><b>${esc(h.nome)}</b> ${FLAG[h.pais]||''} ${esc(h.txt)} <span class="dim">· ${h.ano} S${h.s}</span></span>`).join('')}</div>`:''}
  </div>`;
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
    <p class="dim">${base.length} de ${vagas} vagas na categoria (a academia abre uma vaga a cada dois níveis e acelera
    o crescimento; o head coach também conta). Cada garoto custa ${money(BASE_CUSTO_SEMANA)} por semana. Ninguém cai do céu:
    os garotos chegam pelo radar das rankeds, e quem faz ${BASE_IDADE_SAI} anos sem ser promovido vai embora.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <span class="dim">O olheiro procura na ladder:</span>
      ${[['','Qualquer função'],...ROLES.filter(r=>r!=='Flex').map(r=>[r,r])].map(([k,n])=>
        `<button class="btn sm ${(t.baseFoco||'')===k?'':'ghost'}" data-basefoco="${k}">${n}</button>`).join('')}
    </div></div>
  ${blocoRadar(t)}
  <div class="card flat"><div class="split"><div class="eyebrow">Categoria de base</div><span class="dim">${base.length} de ${vagas} vagas</span></div>
    ${base.length||vagas?`<div class="base-cartas">${base.map(p=>`<div class="base-c">
      ${cartaJogador(p,{w:118,clique:true})}
      <div class="base-pot"><span>pot</span><b class="num">${p.pot}</b></div>
      <span class="dim">${p.idade} anos · desde ${p.baseDesde||'—'}${p.idade>=BASE_IDADE_SAI-1?' · <span class="am">último ano</span>':''}</span>
      <div class="base-bt"><button class="btn sm" data-bpromo="${p.id}" ${cheio?'disabled title="elenco com nove"':''}>Promover</button>
        <button class="btn sm ghost" data-bdisp="${p.id}">Dispensar</button></div></div>`).join('')}
      ${Array.from({length:Math.max(0,vagas-base.length)},()=>`<div class="base-c vaga"><span>${icone('broto')}</span><b>vaga aberta</b><span class="dim">chame alguém do radar para um teste</span></div>`).join('')}</div>`
    :'<div class="empty">Nenhum garoto na categoria agora. Chame alguém do radar para um teste.</div>'}</div>
  <div class="card flat"><div class="eyebrow">Jovens no elenco</div>
    ${jovens.length?`<table class="tb ordenavel"><thead>${THJ}</thead><tbody>${jovens.map(p=>linhaJog(p)).join('')}</tbody></table>`:'<div class="empty">Nenhum jogador com 22 anos ou menos.</div>'}</div>
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
/* anel de progresso de uma meta de patrocínio */
function anelMeta(v,estado){
  const r=12,c=2*Math.PI*r,p=clamp(v,0,1);
  const cor=estado==='ok'?'var(--teal)':estado==='perdida'?'var(--red)':'var(--gold)';
  return `<svg class="pt-anel" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="${r}" class="f"/>
    <circle cx="16" cy="16" r="${r}" class="v" style="stroke:${cor};stroke-dasharray:${(c*p).toFixed(1)} ${c.toFixed(1)}"/>
    ${estado==='ok'?`<path d="M11 16.5l3.2 3 6-6.5" fill="none" stroke="${cor}" stroke-width="2"/>`:`<text x="16" y="19.5" text-anchor="middle">${Math.round(p*100)}</text>`}</svg>`;
}
/* Patrocinadores com o contrato: fixo, metas com barra de progresso e o
   valor de cada uma, e a receita do ano em três cenários (core/patrocinio.js). */
function blocoPatrocinios(t){
  const cen=typeof cenariosPatrocinio==='function'?cenariosPatrocinio(t):null;
  const avisos=[];
  const linhas=patrociniosDe(t).map(({vaga,mk})=>{
    const c=typeof contratoDe==='function'?contratoDe(t,vaga.id):null;
    if(!mk)return `<div class="pt-c vazio"><b>${esc(vaga.nome)}</b> <span class="dn">vaga aberta</span></div>`;
    const risco=c&&typeof riscoDeClausula==='function'?riscoDeClausula(t,c):null;
    if(risco)avisos.push(mk.nome+': '+risco);
    const metas=c?(c.metas||[]).map(m=>{
      const a=m.pago!=null?{estado:m.pago?'ok':'perdida',txt:m.pago?'cumprida':'não cumprida',prog:m.pago?1:0}:avaliarMetaPatroc(t,m,false);
      if(a.estado==='perdida'&&m.pago==null)avisos.push(mk.nome+': a meta "'+m.txt.toLowerCase()+'" não tem mais como ser cumprida.');
      return `<div class="pt-m ${a.estado}">
        <span class="pt-m-t">${esc(m.txt)}</span>
        ${anelMeta(a.estado==='ok'?1:a.prog||0,a.estado)}
        <span class="dim pt-m-s">${esc(a.estado==='ok'?'cumprida':a.estado==='perdida'?'perdida':a.txt)}</span>
        <b class="num ${a.estado==='ok'?'up':a.estado==='perdida'?'dim':''}">${money(m.valor)}</b></div>`;}).join(''):'';
    return `<div class="pt-c">
      <div class="pt-c-topo">${logoMarca(mk,110)}<div><b>${esc(vaga.nome)} · ${esc(mk.nome)}</b>
        <div class="dim">${esc(mk.setor)} · ${esc(areaMarca(mk))} · nível ${mk.nivel}</div></div>
        <div class="pt-c-val">${c?`<span class="num">${money(c.fixo)}</span><span class="dim">fixo/ano${c.adiant?' + '+money(c.adiant)+' de bônus adiantado':''}</span>
          <span class="dim">${c.ate>G.ano?'contrato até '+c.ate:'último ano'}${c.saida?' · sai por cláusula':''}</span>`
          :`<span class="num">${money(valorContrato(mk,t,vaga.id))}</span><span class="dim">por ano</span>`}</div></div>
      ${metas?`<div class="pt-ms">${metas}</div>`:''}</div>`;
  }).join('');
  return `<div class="card flat"><div class="split"><div class="eyebrow">Patrocinadores</div>
      ${cen?`<div class="pt-cen"><div><span class="dim">Só o fixo</span><b class="num">${money(cen.fixo)}</b></div>
        <div><span class="dim">No ritmo atual</span><b class="num">${money(cen.atual)}</b></div>
        <div><span class="dim">Tudo cumprido</span><b class="num up">${money(cen.tudo)}</b></div></div>`:''}</div>
    ${avisos.length?`<div class="pt-aviso">${avisos.map(x=>'⚠ '+esc(x)).join('<br>')}</div>`:''}
    <div class="pt-cs">${linhas}</div>
    <p class="dim" style="margin-top:8px">O fixo e um adiantamento de 45% do bônus entram semana a semana. Na virada a
    marca faz o acerto: paga as metas cumpridas que passarem do adiantado, ou desconta a diferença (sem encostar
    na reserva do clube). Título, vaga em internacional, playoffs e clássico ficam marcados na semana em que
    acontecem. Rebaixamento ou torcida abaixo do piso do contrato deixam a marca sair no fim da temporada; subir de
    divisão reabre a negociação. Vaga aberta ou contrato no fim é preenchida na virada: clube mais atraente
    escolhe primeiro.</p></div>`;
}
/* Gráfico do caixa na temporada (pacote V10): o que já aconteceu, semana a
   semana (G.caixaHist), e a projeção até a virada pelo ritmo de hoje —
   receita fixa menos folha e custeio, sem premiação nem negócio. */
function graficoCaixa(t){
  const W=760,H=210,pl=56,pr=14,pt=14,pb=26;
  const pts=(G.caixaHist||[]).filter(x=>x.a===G.ano&&(!x.id||x.id===t.id)).map(x=>({s:x.s,c:x.c}));
  const agora={s:Math.min(SEMANAS_ANO,G.semana||1),c:Math.round(t.caixa)};
  if(!pts.length||pts[pts.length-1].s<agora.s)pts.push(agora);
  const folha=t.elenco.reduce((a,i)=>a+P(i).salario,0)+folhaStaff(t)+(typeof custoEmprestimosDe==='function'?custoEmprestimosDe(t):0);
  const ritmo=t.patroc/SEMANAS_ANO-(folha*12)/SEMANAS_ANO-custeioSemanal(t);
  const proj=[];for(let s=agora.s;s<=SEMANAS_ANO;s++)proj.push({s,c:Math.round(agora.c+ritmo*(s-agora.s))});
  const todos=pts.concat(proj).map(x=>x.c);
  let mn=Math.min(0,...todos),mx=Math.max(...todos);
  const folga=(mx-mn)*0.08||100000;mn-=mn<0?folga:0;mx+=folga;
  const X=s=>pl+(s-1)/(SEMANAS_ANO-1)*(W-pl-pr),Y=c=>pt+(mx-c)/(mx-mn)*(H-pt-pb);
  const linha=l=>l.map((x,i)=>(i?'L':'M')+X(x.s).toFixed(1)+' '+Y(x.c).toFixed(1)).join(' ');
  const area=pts.length>1?linha(pts)+` L${X(pts[pts.length-1].s).toFixed(1)} ${Y(Math.max(mn,0)).toFixed(1)} L${X(pts[0].s).toFixed(1)} ${Y(Math.max(mn,0)).toFixed(1)} Z`:'';
  const ticks=[mn<0?mn:0,(mn+mx)/2,mx].map(v=>Math.round(v/50000)*50000);
  const fim=proj[proj.length-1];
  /* blocos do calendário em faixa no rodapé, com a cor do circuito */
  const faixas=(G.calendario||[]).filter(b=>b.stages&&b.montar).map(b=>{const cc=typeof circuitoDoBloco==='function'?circuitoDoBloco(b):{cor:'var(--line2)'};
    return `<rect x="${X(b.ini).toFixed(1)}" y="${H-pb+6}" width="${Math.max(2,X(b.fim)-X(b.ini)).toFixed(1)}" height="4" fill="${cc.cor}" opacity=".7"><title>${esc(nomeBloco(b))}</title></rect>`;}).join('');
  return `<svg class="fin-graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Caixa na temporada">
    <defs><linearGradient id="finG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gold)" stop-opacity=".35"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="g${v===0?' zero':''}"/>
      <text x="${pl-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end" class="t">${money(v)}</text>`).join('')}
    ${[1,13,26,39,SEMANAS_ANO].map(s=>`<text x="${X(s).toFixed(1)}" y="${H-pb+20}" text-anchor="middle" class="t">S${s}</text>`).join('')}
    ${faixas}
    ${area?`<path d="${area}" fill="url(#finG)"/>`:''}
    <path d="${linha(pts)}" class="real"/>
    <path d="${linha(proj)}" class="proj ${fim.c<0?'neg':''}"/>
    <circle cx="${X(agora.s).toFixed(1)}" cy="${Y(agora.c).toFixed(1)}" r="4.5" class="hoje"/>
    <text x="${X(fim.s).toFixed(1)}" y="${(Y(fim.c)-8).toFixed(1)}" text-anchor="end" class="t fimt ${fim.c<0?'neg':''}">${money(fim.c)} na virada</text>
  </svg>`;
}
/* Receita e despesa do ano em barras empilhadas, com legenda e valor. */
function barrasFinanceiras(t){
  const mov=typeof movimentosDoClube==='function'?movimentosDoClube(t,G.ano):{receita:0,gasto:0};
  const premios=t.premiosAno&&t.premiosAno.ano===G.ano?t.premiosAno.v:0;
  const salJ=t.elenco.reduce((a,i)=>a+P(i).salario,0)*12, salS=folhaStaff(t)*12;
  const rec=[['Patrocínio',receitaPatrocinio(t),'#E2B45A'],['Liga',aporteLiga(t),'#4C8DFF'],['Premiações',premios,'#18E5B4'],['Vendas',mov.receita||0,'#9B6BFF']];
  const des=[['Salários do elenco',salJ,'#FF4655'],['Comissão',salS,'#FF8A72'],['Custeio',custeioAnual(t),'#FF9F43'],['Compras',mov.gasto||0,'#C66BFF']];
  const tot=Math.max(rec.reduce((a,x)=>a+x[1],0),des.reduce((a,x)=>a+x[1],0),1);
  const barra=(rot,l)=>{const soma=l.reduce((a,x)=>a+x[1],0);
    return `<div class="fin-bl"><div class="split"><span class="eyebrow">${rot}</span><b class="num">${money(soma)}</b></div>
      <div class="fin-barra">${l.filter(x=>x[1]>0).map(x=>`<i style="width:${(x[1]/tot*100).toFixed(2)}%;background:${x[2]}" title="${esc(x[0])}: ${money(x[1])}"></i>`).join('')}</div>
      <div class="fin-leg">${l.map(x=>`<span><i style="background:${x[2]}"></i>${esc(x[0])} <b class="num">${money(x[1])}</b></span>`).join('')}</div></div>`;};
  return barra('Entradas do ano',rec)+barra('Saídas do ano',des);
}
function vFinancas(){
  const t=meu();
  const folha=t.elenco.reduce((s,i)=>s+P(i).salario,0)+folhaStaff(t);
  const patro=receitaPatrocinio(t), aporte=aporteLiga(t), rec=patro+aporte;
  return `<div class="eyebrow">Gestão</div><h2 class="sec">Finanças</h2>
  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi"><div class="lb">Caixa</div><div class="vl">${money(t.caixa)}</div></div>
    <div class="kpi"><div class="lb">Receita anual</div><div class="vl">${money(rec)}</div>
      <div class="sb">${money(patro)} de marca (fixo + bônus adiantado) · ${money(aporte)} da liga</div></div>
    <div class="kpi red"><div class="lb">Folha mensal</div><div class="vl">${money(folha)}</div><div class="sb">elenco + comissão · ${money(folha*12)}/ano</div></div>
    <div class="kpi teal"><div class="lb">Resultado anual</div><div class="vl">${money(rec-folha*12-custeioAnual(t))}</div>
      <div class="sb">já com ${money(custeioAnual(t))} de custeio · sem premiações</div></div>
  </div>
  <div class="grid g2 fin-topo">
    <div class="card"><div class="split"><div class="eyebrow">Caixa em ${G.ano}</div>
      <span class="fin-leg-g"><span><i class="real"></i>até hoje</span><span><i class="proj"></i>projeção pelo ritmo de hoje</span></span></div>
      ${graficoCaixa(t)}
      <p class="dim" style="font-size:11.5px;margin:4px 0 0">A projeção não conta premiação nem negócio: é o que sobra se nada mudar.</p></div>
    <div class="card">${barrasFinanceiras(t)}</div>
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
        ${t.tier===1?`<tr><td title="Sobe quando os clubes do Tier 1 guardam dinheiro demais e cede quando apertam">Índice salarial do Tier 1</td><td class="r num">×${indiceSalarial(1).toFixed(2)}</td></tr>`:''}
        ${fatorRiqueza(t)>1?`<tr><td title="Com mais de três anos de receita no caixa, os jogadores pedem mais">Acréscimo de clube rico</td><td class="r num">+${Math.round((fatorRiqueza(t)-1)*100)}%</td></tr>`:''}
      </tbody></table>
    </div>
  </div></div>
  <div class="card"><div class="split">
    <div><div class="eyebrow">Torcida</div>
      <div class="dim">Cresce com vitória e título, encolhe sozinha quando o clube some.
      Ela decide o aporte da liga e o tamanho da marca que você alcança.</div></div>
    <div style="min-width:200px">${medidor('<span class="dim">de '+TORCIDA_MAX+'</span>',(t.torcida||0)/TORCIDA_MAX,100)}</div>
  </div></div>
${blocoPatrocinios(t)}
  <div class="card flat"><div class="eyebrow">Folha salarial</div>
    <table class="tb ordenavel"><thead><tr><th>Jogador</th><th class="c">Over</th><th class="r">Salário/mês</th><th class="r">% da folha</th><th class="c">Contrato</th><th></th></tr></thead>
    <tbody>${t.elenco.map(i=>{const p=P(i);return `<tr class="jrow" data-p="${p.id}"><td><b>${esc(p.nome)}</b></td><td class="c">${ovTag(p)}</td>
      <td class="r num">${money(p.salario)}</td><td class="r num dim">${(p.salario/folha*100).toFixed(1)}%</td>
      <td class="c num ${p.contrato<=1?'dn':''}">${p.contrato}a</td>
      <td class="r"><button class="btn ghost sm" data-renov="${p.id}">Renovar</button>
      <button class="btn ghost sm" data-disp="${p.id}">Dispensar</button></td></tr>`;}).join('')}</tbody></table></div>
  <div class="card"><div class="eyebrow">Premiações que você pode disputar</div>
    <table><thead><tr><th>Competição</th><th class="r">Campeão</th><th class="r">Vice</th></tr></thead><tbody>
      ${['champions','masters1',(t.tier===1?'stage2_':'split2_')+t.regiao,(t.tier===1?'kickoff_':'asc_')+t.regiao]
        .map(id=>{const tor=torneio(id);if(!tor||!tor.premio)return '';
          const p=premiosDoStage({torneioId:id});
          return `<tr><td>${torneioInline(id,20)}</td><td class="r num">${money(p[0]||0)}</td>
            <td class="r num">${p[1]?money(p[1]):'—'}</td></tr>`;}).join('')}
    </tbody></table>
    <p class="dim" style="margin-top:8px">Os valores saem do catálogo de torneios e são editáveis
    no Banco de dados › Torneios.</p></div>`;
}
/* Líderes virou Estatísticas do mundo: ui/mundo.js */
/* Prêmios e Hall da Fama: ui/premios.js */
/* ---------- notícias ---------- */
let newsAba='tudo';
function linhaNoticia(n){
  if(n.c==='sistema')return `<div class="news-sep">${esc(n.txt.replace(/=/g,'').trim())}</div>`;
  return `<div class="news ${n.meu?'me':''}"><span class="dim num">${n.s?rotuloSemanaCurto(n.ano,n.s):n.ano}</span> <span>${textoNoticia(n)}</span></div>`;
}
/* o texto da notícia com os nomes de clube e de jogador virando link */
function textoNoticia(n){
  /* o nome de quem a notícia cita vira link para a ficha */
  let txt=esc(n.txt);
  /* o clube citado vira link para a página dele; entra como marcador antes
     dos jogadores para um nick dentro do nome do clube não quebrar o link */
  const clubes=[];
  for(const id of (n.t||[]).slice(0,3)){
    const t=G.times[id];if(!t)continue;
    const nm=esc(t.nome),i=txt.indexOf(nm);
    if(i<0)continue;
    clubes.push(`<span class="clube-link news-link" data-clube="${id}">${nm}</span>`);
    txt=txt.slice(0,i)+'\u0001'+(clubes.length-1)+'\u0001'+txt.slice(i+nm.length);
  }
  for(const id of (n.p||[]).slice(0,4)){
    const p=P(id);if(!p)continue;
    const nm=esc(p.nome),i=txt.indexOf(nm);
    if(i<0)continue;
    txt=txt.slice(0,i)+`<span class="jrow news-link" data-p="${id}">${nm}</span>`+txt.slice(i+nm.length);
  }
  txt=txt.replace(/\u0001(\d+)\u0001/g,(_,k)=>clubes[+k]);
  if(typeof iconizar==='function')txt=iconizar(txt);
  return txt;
}
function rotuloSemanaCurto(ano,s){return ano+' · S'+s;}
function noticiasDaAba(aba){
  if(aba==='tudo')return G.noticias;
  if(aba==='clube')return G.noticias.filter(n=>n.meu);
  return G.noticias.filter(n=>n.c===aba);
}
/* Notícias (pacote V12): cartões agrupados por semana, cada um com a
   imagem de quem a notícia cita e o ícone da categoria; a manchete grande no
   topo; filtros fixos e "carregar mais" no lugar da página interminável. */
let newsLimite=40;
const ICONE_CAT={clube:'clube',mercado:'aperto',competicoes:'trofeu',meta:'mapa',carreira:'gravata',outros:'jornal'};
function cartaoNoticia(n){
  const img=typeof imagemDaNoticia==='function'?imagemDaNoticia(n,52):null;
  const cor=img&&img.cor?img.cor:null;
  /* sem jogador nem clube com imagem: a foto do assunto (assets/cenas/news-*) */
  const cena=!img&&typeof cenaDaNoticia==='function'?cenaDaNoticia(n):null;
  return `<div class="nw ${n.meu?'me':''} ${n.imp>=2?'imp':''}" ${cor?`style="--clube:${cor};--clube-rgb:${rgbDe(cor)}"`:''}>
    <span class="nw-img ${img?img.cls:cena?'cena com-cena':'vazio'}">${img?img.html:cena?cenaFoto('cenas',cena,timeDaNoticia(n),{foco:40}):icone(ICONE_CAT[n.c]||'jornal')}</span>
    <div class="nw-txt"><span class="nw-cat">${icone(ICONE_CAT[n.c]||'jornal')}${esc(CAT_NOTICIA[n.c]||'Circuito')}</span>
      <div class="nw-corpo">${textoNoticia(n)}</div></div>
  </div>`;
}
function vNews(){
  const abas=[['tudo','Tudo'],...Object.entries(CAT_NOTICIA)];
  const todas=noticiasDaAba(newsAba).filter(n=>n.txt&&n.c!=='sistema');
  const lista=todas.slice(0,newsLimite);
  const m=typeof manchete==='function'?manchete():null;
  const grupos=[];
  for(const n of lista){
    const k=n.ano+'|'+(n.s||0);
    if(!grupos.length||grupos[grupos.length-1].k!==k)grupos.push({k,ano:n.ano,s:n.s,itens:[]});
    grupos[grupos.length-1].itens.push(n);
  }
  return `<div class="eyebrow">Imprensa</div><h2 class="sec">Notícias</h2>
  <div class="nw-filtros">${abas.map(([k,n])=>{
    const q=noticiasDaAba(k).filter(x=>x.txt&&x.c!=='sistema').length;
    return `<button data-newsaba="${k}" class="${newsAba===k?'on':''}">${k==='tudo'?'':icone(ICONE_CAT[k]||'jornal')}${n} <span class="num">${q}</span></button>`;}).join('')}</div>
  ${m&&newsAba==='tudo'&&typeof imagemDaNoticia==='function'?(()=>{const img=imagemDaNoticia(m,120);
    const cena=typeof cenaDaNoticia==='function'?cenaDaNoticia(m):null;
    return `<div class="nw-manchete ${m.meu?'me':''} ${cena?'com-cena':''}" ${img&&img.cor?`style="--clube:${img.cor};--clube-rgb:${rgbDe(img.cor)}"`:''}>
      ${cena?cenaFoto('cenas',cena,timeDaNoticia(m),{cls:'nw-fundo cn-direita',foco:'placa'}):''}
      ${img?`<div class="nwm-img ${img.cls}">${img.html}</div>`:''}
      <div><div class="eyebrow">Manchete da semana</div><h3>${iconizar(esc(m.txt))}</h3>
        <span class="dim">${m.s?rotuloSemana(m.ano,m.s)+' · ':''}${esc(CAT_NOTICIA[m.c]||'Circuito')}</span></div></div>`;})():''}
  ${grupos.length?grupos.map(g=>`<div class="nw-sem"><div class="nw-sem-t"><b>${g.s?'Semana '+g.s:g.ano}</b>
      <span class="dim">${g.s?esc(rotuloSemana(g.ano,g.s))+' · '+g.ano:''}</span><u></u></div>
    <div class="nw-l">${g.itens.map(cartaoNoticia).join('')}</div></div>`).join('')
    :vazio('<b>Sem notícias aqui.</b> Elas chegam a cada semana que você avança.','jornal')}
  ${todas.length>newsLimite?`<div class="nw-mais"><button class="btn ghost" data-newsmais>Carregar mais <span class="dim">(${todas.length-newsLimite} restantes)</span></button></div>`:''}`;
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

  /* Linha do tempo do clube: uma linha por temporada jogada na carreira
     (core/estatisticas.js grava na virada) e, antes dela, os títulos reais
     do clube na pré-história. A galeria do mundo foi para Estatísticas. */
  const temps=(t.temporadas||[]).slice().reverse();
  const preDoClube=(G.historico||[]).filter(h=>h.pre&&(h.campeao===t.nome||(typeof acharClubePorNome==='function'&&acharClubePorNome(h.campeao)===t)));
  const linhaTemp=linhaTemporadaClube;
  /* lendas do clube: quem mais vestiu a camisa, entre os que ainda estão no
     save (o histórico por temporada de cada jogador) e o Hall da Fama */
  const porClube=Object.values(G.jogadores).map(p=>{
    const hs=(p.hist||[]).filter(h=>h.time===t.nome);
    const atual=p.timeId===t.id?1:0;
    return{p,anos:hs.length+atual,maps:hs.reduce((s,h)=>s+(h.maps||0),0)+(atual?p.temp.maps:0)};
  }).filter(x=>x.anos>=1&&x.maps>0).sort((a,b)=>b.maps-a.maps).slice(0,8);
  const hall=(G.lendas||[]).filter(l=>(l.clubes||[]).includes(t.nome));
  const casa=typeof reveladosPelaCasa==='function'?reveladosPelaCasa(t).slice(0,6):[];

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

  <div class="card"><div class="split"><div class="eyebrow">Galeria de títulos</div><span class="dim">${l.titulos.length} troféu${l.titulos.length===1?'':'s'}</span></div>
    ${l.titulos.length?`<div class="tit-galeria" style="margin-top:10px">${l.titulos.slice().reverse().map(x=>{
      const ano=parseInt(x.split(' · ')[0]),ev=x.split(' · ').slice(1).join(' · ');
      return `<div class="tit-pec ${ehInternacional(ev)?'intl':''}"><div class="tit-trof">${imgTrofeu(trofeuDoTitulo(ano,ev),48,ev)}</div>
        <div class="tit-ped">${escudo(t,22)}<b class="num">${esc(String(ano))}</b></div><div class="tit-ev">${esc(ev)}</div></div>`;}).join('')}</div>`
      :'<div class="empty">Nenhum título ainda. É por isso que você está aqui.</div>'}
  </div>
  <div class="grid g2">
    <div class="card"><div class="eyebrow">Linha do tempo do clube</div>
      ${temps.length?`<div class="hc-trilha" style="--clube:${corDoClube(t)}">${temps.map(linhaTemp).join('')}</div>`:'<div class="empty">A primeira temporada entra aqui na virada do ano.</div>'}
      ${preDoClube.length?`<div class="eyebrow" style="margin-top:14px">Antes da carreira · títulos reais</div>
        ${preDoClube.slice().reverse().map(h=>`<div class="hc-pre">${imgTrofeu(trofeuDoTitulo(h.ano,h.evento),16,h.evento)}
          <span class="num dim">${h.ano}</span> ${esc(h.evento)}</div>`).join('')}`:''}
      <button class="btn ghost sm" data-irmundo="titulos" style="margin-top:10px">Galeria de títulos do mundo ›</button>
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
  <div class="${casa.length?'grid g2':''}">
      <div class="card"><div class="eyebrow">Lendas do clube</div>
        ${porClube.length?`<div class="hc-lendas">${porClube.map(x=>`<div class="hc-lenda">${cartaJogador(x.p,{w:96,clique:true})}
            <span class="num"><b>${x.maps}</b> mapas · ${x.anos} temp.</span>
            ${x.p.timeId===t.id?'<span class="chip t">no elenco</span>':'<span class="dim">'+(x.p.timeId?esc(tagT(x.p.timeId)):'livre')+'</span>'}</div>`).join('')}</div>`
          :'<div class="empty">Ainda ninguém com história no clube.</div>'}
        ${hall.length?`<div class="eyebrow" style="margin-top:12px">No Hall da Fama</div>${hall.map(l=>`<div class="hc-pre">${icone('coluna','ouro')} <b>${esc(l.nome)}</b>
          <span class="dim">${l.carreira.titulos} títulos · aposentou em ${l.ano}</span></div>`).join('')}`:''}
      </div>
      ${casa.length?`<div class="card"><div class="eyebrow">Revelados pela casa</div>
        ${casa.map(p=>`<div class="hc-pre jrow" data-p="${p.id}" style="cursor:pointer">${retrato(p,22)} <b>${esc(p.nome)}</b>
          <span class="ov ${ovClass(over(p))}">${over(p)}</span> <span class="dim">${p.timeId?esc(tagT(p.timeId)):'livre'}</span></div>`).join('')}</div>`:''}
  </div>
  <div class="card"><div class="eyebrow">Confronto direto · ${conf.length} adversários</div>
    ${conf.length?`<div class="rolagem"><table class="wide tb ordenavel"><thead><tr><th></th><th>Adversário</th>
      <th class="c">J</th><th class="c">V</th><th class="c">D</th><th class="c">Saldo</th>
      <th class="c">Últimos</th></tr></thead>
      <tbody>${conf.map(linhaConf).join('')}</tbody></table></div>`
      :'<div class="empty">Nenhuma partida disputada ainda nesta run.</div>'}
  </div>`;
}
