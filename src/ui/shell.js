/* ============================================================
   SHELL — estado de tela, sidebar, topbar e primitivas de UI
   ------------------------------------------------------------
   O app tem dois shells e o modo mora numa classe do <body>:

     modo-menu → menu principal, banco de dados, runs, configurações
     modo-jogo → HUD com sidebar + topbar + conteúdo

   render() é a única porta de entrada: ela decide qual shell
   pintar. Quem chama render() não precisa saber onde está.
   ============================================================ */
const $=s=>document.querySelector(s);

let modo='menu';        /* 'menu' | 'jogo' */
let telaMenu='menu';    /* tela dentro do shell do menu */
let tela='inicio';      /* tela dentro do HUD */
let hist=[],histPos=-1; /* histórico das setas da topbar */

/* [chave, rótulo, grupo, ícone] — fonte única da sidebar e do título da topbar */
const NAV=[
  ['inicio','Central','Clube','casa'],
  ['elenco','Elenco','Clube','elenco'],
  ['taticas','Táticas','Clube','tatica'],
  ['treino','Treino','Clube','base'],
  ['comps','Comps','Clube','tatica'],
  ['base','Base','Clube','base'],
  ['historia','História','Clube','trofeu'],
  ['comp','Competições','Circuito','trofeu'],
  ['stats','Líderes','Circuito','grafico'],
  ['premios','Prêmios','Circuito','trofeu'],
  ['news','Notícias','Circuito','jornal'],
  ['mercado','Mercado','Gestão','troca'],
  ['financas','Finanças','Gestão','dinheiro'],
  ['editor','Banco de dados','Sistema','banco'],
  ['config','Configurações','Sistema','engrenagem']
];

/* ---------- ícones (SVG inline: sem fonte externa, funciona offline) ---------- */
const ICONES={
  casa:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  elenco:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6"/><path d="M16 5.6a3 3 0 0 1 0 5.6"/><path d="M18.5 20c0-2.5-.9-4.3-2.5-5.3"/>',
  tatica:'<path d="M4 5h16v14H4z"/><path d="M4 12h16"/><circle cx="8" cy="8.5" r="1.3"/><circle cx="16" cy="15.5" r="1.3"/>',
  base:'<path d="M12 3l7.5 4v6c0 4.3-3.2 7.4-7.5 8.4C7.7 20.4 4.5 17.3 4.5 13V7z"/><path d="M9 12l2.3 2.3L15.6 10"/>',
  trofeu:'<path d="M8 4h8v5.2a4 4 0 0 1-8 0z"/><path d="M8 5.6H5.4v2.2A3.2 3.2 0 0 0 8 11"/><path d="M16 5.6h2.6v2.2A3.2 3.2 0 0 1 16 11"/><path d="M12 13.2v3.6"/><path d="M8.5 20h7"/>',
  grafico:'<path d="M4.5 20V11"/><path d="M10 20V4.5"/><path d="M15.5 20v-6.5"/><path d="M21 20V8"/><path d="M3 20h18"/>',
  jornal:'<path d="M4 5h13v14H4z"/><path d="M17 8.5h3V17a2 2 0 0 1-3 1.7"/><path d="M7 8.6h7M7 12h7M7 15.4h4.5"/>',
  troca:'<path d="M3.5 8.5h14l-3.4-3.4"/><path d="M20.5 15.5h-14l3.4 3.4"/>',
  dinheiro:'<circle cx="12" cy="12" r="8.3"/><path d="M12 7v10"/><path d="M14.7 9.8c0-1.2-1.2-1.9-2.7-1.9s-2.7.7-2.7 1.8c0 2.5 5.4 1.3 5.4 3.8 0 1.2-1.2 1.9-2.7 1.9s-2.7-.8-2.7-2"/>',
  banco:'<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  engrenagem:'<circle cx="12" cy="12" r="3"/><path d="M12 3.2v2.6M12 18.2v2.6M4.6 7.6l2.3 1.3M17.1 15.1l2.3 1.3M4.6 16.4l2.3-1.3M17.1 8.9l2.3-1.3"/>',
  jogar:'<path d="M6.5 4.2 19.5 12 6.5 19.8z"/>',
  disco:'<path d="M4 4h11.5L20 8.5V20H4z"/><path d="M8.5 4v5.5h7V6"/><circle cx="12" cy="15" r="2.4"/>',
  info:'<circle cx="12" cy="12" r="8.4"/><path d="M12 11.2v5.4"/><circle cx="12" cy="7.9" r="1"/>',
  saida:'<path d="M14 4.5H5v15h9"/><path d="M18.5 12H9.5"/><path d="M15.3 8.6 18.7 12l-3.4 3.4"/>',
  seta_e:'<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  seta_d:'<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  duplo:'<path d="M5 5.5 11 12l-6 6.5"/><path d="M13 5.5 19 12l-6 6.5"/>',
  mais:'<path d="M12 5v14M5 12h14"/>'
};
function ico(n){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]||''}</svg>`;
}

/* ---------- atalhos de leitura do estado ---------- */
function T(id){return G.times[id];}
function P(id){return G.jogadores[id];}
function nomeT(id){const t=T(id);return t?t.nome:'—';}
function tagT(id){const t=T(id);return t?t.tag:'???';}
function meu(){return G&&G.meuTime?T(G.meuTime):null;}
function preRun(){return !G||!G.meuTime;}
function nomeTela(k){const it=NAV.find(x=>x[0]===k);return it?it[1]:'—';}

/* raiz onde o conteúdo da tela atual está: os handlers de ligarEventos()
   valem nos dois shells, então precisam perguntar onde procurar. */
function raizAtual(){
  return modo==='menu' ? ($('#menuCorpo')||$('#shellMenu')) : $('#view');
}

/* ============================================================
   RENDER
   ============================================================ */
function render(){
  document.body.className='modo-'+modo+(Prefs.get('animacoes')?'':' sem-anim');
  /* Banco de dados do MENU edita a base; qualquer outra tela usa a carreira.
     Toda navegação passa por aqui, então é aqui que o G troca de mãos. */
  if(modo==='menu'&&telaMenu==='banco')Base.abrirEdicao();
  else Base.fecharEdicao();
  if(modo==='menu'){renderMenu();return;}
  pintarSide();pintarTop();
  const v=$('#view');
  const fn={inicio:vInicio,elenco:vElenco,taticas:vTaticas,treino:vTreino,comps:vComps,comp:vComp,mercado:vMercado,
            base:vBase,historia:vHistoria,financas:vFinancas,stats:vStats,premios:vPremios,news:vNews,
            editor:vEditor,config:vConfig}[tela];
  if(typeof guiaMarcar==='function')guiaMarcar(tela);
  v.innerHTML=(typeof guiaBanner==='function'?guiaBanner(tela):'')+(fn||vInicio)();
  v.querySelectorAll('.jrow').forEach(r=>r.onclick=()=>modalJogador(r.dataset.p));
  ligarEventos();
}
function irPara(k,semHist){
  tela=k;
  if(!semHist){
    hist=hist.slice(0,histPos+1);
    if(hist[histPos]!==k){hist.push(k);histPos=hist.length-1;}
  }
  render();
}

function pintarSide(){
  const t=meu();
  const grupos=[];
  NAV.forEach(([k,n,g,i])=>{
    if(!grupos.length||grupos[grupos.length-1].g!==g)grupos.push({g,itens:[]});
    grupos[grupos.length-1].itens.push([k,n,i]);
  });
  $('#side').innerHTML=
    `<div class="side-org">${t?escudo(t,34):''}<div class="n">
       <b>${esc(t?t.tag:'VCT')}</b><span>${esc(t?t.nome:'sem clube')}</span></div></div>
     <div class="side-nav">`+
    grupos.map(gr=>`<div class="side-grp">${gr.g}</div>`+
      gr.itens.map(([k,n,i])=>{
        const av=avisoDaTela(k);
        return `<a href="#" data-t="${k}" class="${tela===k?'on':''}">${ico(i)}<span>${n}</span>${
          av?`<span class="aviso">${av}</span>`:''}</a>`;
      }).join('')).join('')+
    `</div>
     <div class="side-pe"><button class="btn ghost sm" id="btnMenu" style="width:100%">Menu principal</button></div>`;
  $('#side').querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();irPara(a.dataset.t);});
  $('#btnMenu').onclick=()=>sairParaMenu();
}
/* badge vermelho na sidebar: só onde existe pendência real */
function avisoDaTela(k){
  if(k==='editor'){const n=edValidar().erros.length;return n?n:0;}
  return 0;
}

function pintarTop(){
  const t=meu();
  const i=typeof blocoDaSemana==='function'?blocoDaSemana(G.semana||1):null;
  const b=i==null?null:G.calendario[i];
  $('#top').innerHTML=`
    <div class="top-hist">
      <button id="hVolta" ${histPos<=0?'disabled':''} title="Tela anterior">${ico('seta_e')}</button>
      <button id="hFrente" ${histPos>=hist.length-1?'disabled':''} title="Tela seguinte">${ico('seta_d')}</button>
    </div>
    <div class="top-titulo">${esc(nomeTela(tela))}</div>
    <div class="top-spacer"></div>
    <div class="top-bit">Temporada<strong>${G.ano}</strong></div>
    <div class="top-bit" title="Semana ${G.semana||1} de ${SEMANAS_ANO}">Semana ${G.semana||1}<strong>${
      rotuloSemana(G.ano,G.semana||1)}</strong></div>
    <div class="top-bit">Agenda<strong>${esc(b?b.nome:proximaAgenda())}</strong></div>
    <div class="top-bit">Caixa<strong>${t?money(t.caixa):'—'}</strong></div>
    <div class="top-acoes">
      <button class="btn ghost sm" id="btnSave">Salvar</button>
      <button class="btn" id="btnNext">Avançar</button>
      <button class="btn-fim" id="btnFim" title="Avançar até o próximo jogo do seu clube">${ico('duplo')}</button>
    </div>`;
  $('#hVolta').onclick=()=>{if(histPos>0){histPos--;irPara(hist[histPos],true);}};
  $('#hFrente').onclick=()=>{if(histPos<hist.length-1){histPos++;irPara(hist[histPos],true);}};
  ligarAcoesTopo();
}

/* O que a topbar mostra numa semana sem torneio: não é "—", é a espera pelo
   próximo compromisso, que é uma informação de planejamento. */
function proximaAgenda(){
  const nb=typeof proximoBloco==='function'?proximoBloco(G.semana||1):null;
  if(!nb)return 'Fim da temporada';
  const faltam=nb.ini-(G.semana||1);
  return nb.nome+' em '+faltam+' semana'+(faltam===1?'':'s');
}

/* ---------- avisos ---------- */
function flash(msg){
  const c=$('#toast');if(!c)return;
  const d=document.createElement('div');
  d.className='toast';d.textContent=msg;
  c.appendChild(d);
  setTimeout(()=>d.remove(),2400);
}

/* ---------- células reaproveitadas em várias telas ---------- */
function ovTag(p){const o=over(p);return `<span class="ov ${ovClass(o)}">${o}</span>`;}
function linhaJog(p,opts={}){
  return `<tr data-p="${p.id}" class="jrow ${opts.me?'me':''}">
    <td><span class="linha-t">${retrato(p,26)}<b>${esc(p.nome)}</b> <span class="dim">${bandeira(p.pais)}</span></span>${p.igl?' <span class="pill">IGL</span>':''}${p.lesao?' <span class="badge no">lesão '+p.lesao+'</span>':''}</td>
    <td><span class="tag ${p.role}">${p.role}</span></td>
    <td class="c num">${p.idade}</td>
    <td class="c">${ovTag(p)}</td>
    <td class="c num dim">${p.pot}</td>
    <td class="c num">${(p.forma*100).toFixed(0)}</td>
    <td class="c num">${(p.moral*100).toFixed(0)}</td>
    <td class="r num">${money(p.valor)}</td>
    <td class="r num">${money(p.salario)}</td>
    <td class="c num">${p.contrato}a</td></tr>`;
}
const THJ=`<tr><th>Jogador</th><th>Função</th><th class="c">Idade</th><th class="c">Over</th><th class="c">Pot</th>
  <th class="c">Forma</th><th class="c">Moral</th><th class="r">Valor</th><th class="r">Salário</th><th class="c">Contr.</th></tr>`;

/* ---------- seletor de país ----------
   Sigla de duas letras é fácil de errar: SE/SI, AR/AM, CL/CH. O select mostra
   bandeira, nome em português e a sigla, então dá para conferir os três. */
function selectPais(attrs,atual){
  const cod=String(atual||'').toUpperCase();
  const fora=cod&&!PAISES[cod]
    ? `<option value="${esc(cod)}" selected>🏳 ${esc(cod)} — fora da lista</option>` : '';
  return `<select ${attrs||''}>${fora}`+LISTA_PAISES.map(c=>
    `<option value="${c}" ${c===cod?'selected':''}>${FLAG[c]||''} ${esc(PAISES[c])} · ${c}</option>`
  ).join('')+`</select>`;
}
function bandeira(cod){
  const c=String(cod||'').toUpperCase();
  return `<span title="${esc(PAISES[c]||c)}">${FLAG[c]||'🏳'}</span>`;
}
function nomePais(cod){const c=String(cod||'').toUpperCase();return PAISES[c]||c;}

/* ---------- medidor circular ---------- */
/* v de 0 a 1; cor pela faixa, para o painel ler de longe */
/* Nome da liga em que o clube joga. Um lugar só, porque a origem do nome do
   Tier 2 mudou e estava replicada em três telas. `nomeT2` só existe em mundos
   criados depois da correção; runs antigas caem no nome da região. */
function nomeLiga(t){
  const R=G.regioes[t.regiao]||{};
  if(t.tier===1)return R.nome||t.regiao;
  return R.nomeT2||('Challengers '+(R.nome||t.regiao).replace(/^VCT\s*/,''));
}
function medidor(rotulo,v,px){
  px=px||62;
  const r=(px-8)/2,c=2*Math.PI*r,pct=clamp(v,0,1);
  const cor=pct>=.7?'var(--teal)':pct>=.45?'var(--amber)':'var(--red)';
  return `<div class="gauge"><svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="var(--panel2)" stroke-width="5"/>
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="5"
      stroke-dasharray="${(c*pct).toFixed(1)} ${c.toFixed(1)}" stroke-linecap="butt"
      transform="rotate(-90 ${px/2} ${px/2})"/>
    <text class="v" x="${px/2}" y="${px/2+7}" text-anchor="middle">${Math.round(pct*100)}</text>
  </svg>${rotulo}</div>`;
}
/* ---------- radar de perfil ---------- */
/* eixos: [[rótulo, valor 0..99], ...] */
function radar(eixos,px){
  px=px||190;
  const cx=px/2,cy=px/2+4,r=px/2-46,n=eixos.length;
  const ponto=(i,f)=>{
    const a=-Math.PI/2+i*2*Math.PI/n;
    return [cx+Math.cos(a)*r*f,cy+Math.sin(a)*r*f];
  };
  const anel=f=>eixos.map((_,i)=>ponto(i,f).map(v=>v.toFixed(1)).join(',')).join(' ');
  const area=eixos.map((e,i)=>ponto(i,clamp(e[1],0,99)/99).map(v=>v.toFixed(1)).join(',')).join(' ');
  return `<svg class="radar" width="${px}" height="${px+6}" viewBox="0 0 ${px} ${px+6}">
    ${[1,.75,.5,.25].map(f=>`<polygon class="malha" points="${anel(f)}"/>`).join('')}
    ${eixos.map((_,i)=>{const[x,y]=ponto(i,1);
      return `<line class="eixo" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;}).join('')}
    <polygon class="area" points="${area}"/>
    ${eixos.map((e,i)=>{
      const[x,y]=ponto(i,1.16);
      /* ancorar pelo lado evita o rótulo sair do viewBox nos eixos laterais */
      const anc=x<cx-6?'end':x>cx+6?'start':'middle';
      return `<text class="rot" x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="${anc}">${esc(e[0])}</text>`;}).join('')}
  </svg>`;
}

/* ---------- arquivos ---------- */
function ligarDropzone(zona,input,cb,multi){
  if(!zona)return;
  const soltar=lista=>{
    const fs=[...(lista||[])].filter(Boolean);
    if(!fs.length)return;
    multi?cb(fs):cb(fs[0]);
  };
  zona.addEventListener('dragover',e=>{e.preventDefault();zona.classList.add('on');});
  zona.addEventListener('dragleave',()=>zona.classList.remove('on'));
  zona.addEventListener('drop',e=>{e.preventDefault();zona.classList.remove('on');
    soltar(e.dataTransfer&&e.dataTransfer.files);});
  if(input)input.addEventListener('change',e=>soltar(e.target.files));
}
function baixarJSON(nome,obj){
  const blob=new Blob([JSON.stringify(obj)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=nome;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
/* Mesma ideia de baixarJSON, mas para arquivo de texto qualquer — o
   data/elencos.js gerado sai por aqui. */
function baixarTexto(nome,texto,tipo){
  const blob=new Blob([texto],{type:(tipo||'text/plain')+';charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=nome;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function lerJSON(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{try{res(JSON.parse(fr.result));}catch(e){rej(e);}};
    fr.onerror=()=>rej(fr.error);
    fr.readAsText(file);
  });
}
