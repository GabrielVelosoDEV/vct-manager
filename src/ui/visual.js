/* ============================================================
   VISUAL — peças de interface reaproveitadas (pacote V1)
   ------------------------------------------------------------
   · ícones novos no conjunto de shell.js (ICONES/ico);
   · iconizar(): troca os emojis das notícias e avisos pelos ícones
     do jogo, para a interface não misturar dois estilos;
   · explica(): texto explicativo longo vira "Como funciona" que
     abre e fecha, em vez de um parágrafo cinza no topo da tela;
   · vazio(): estado vazio com ícone e, quando faz sentido, ação.
   ============================================================ */
Object.assign(ICONES,{
  externo:'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/><path d="M7 12l3-3 2 2 4-4"/>',
  coracao:'<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M6 12h3l1.5-2.5 2 4.5 1.5-2h4"/>',
  mente:'<path d="M9 21v-3.2A7 7 0 0 1 5 11.5 7 7 0 0 1 12 4.5a6.8 6.8 0 0 1 6.9 6.3l1.6 3h-1.7V17a1.6 1.6 0 0 1-1.6 1.6H15V21"/><path d="M10 10.5a2 2 0 1 1 3 1.7V14"/>',
  estrela:'<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  medalha:'<circle cx="12" cy="15" r="5"/><path d="m8.5 3 3.5 7 3.5-7"/><path d="m11 14.5 1-1v4"/>',
  alerta:'<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.4"/><circle cx="12" cy="17.2" r=".9"/>',
  contrato:'<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19"/><path d="M9 12.5h7M9 16h5"/>',
  maleta:'<path d="M4 8h16v11H4z"/><path d="M9 8V5.5h6V8"/><path d="M4 13h16"/>',
  broto:'<path d="M12 21v-8"/><path d="M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z"/><path d="M12 15c0-3.2-2.4-5.2-5.6-5.2 0 3.2 2.4 5.2 5.6 5.2z"/>',
  aperto:'<path d="M3 11.5 7.5 7l4 2.5 3-2.5L21 11.5"/><path d="M7.5 7v6.5l4 4 5.5-5"/><path d="M11.5 17.5 9 15"/>',
  coluna:'<path d="M3.5 8 12 3.5 20.5 8z"/><path d="M5.5 8v10M10 8v10M14 8v10M18.5 8v10"/><path d="M3.5 20.5h17"/>',
  queda:'<path d="M3 6.5 9.5 13l4-4 7.5 7.5"/><path d="M21 11.5V16.5h-5"/>',
  alta:'<path d="M3 17.5 9.5 11l4 4 7.5-7.5"/><path d="M21 12.5V7.5h-5"/>',
  lesao:'<rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M10.5 10.5h.01M13.5 13.5h.01M10.5 13.5h.01M13.5 10.5h.01"/>',
  clube:'<path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z"/>',
  diploma:'<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8V11"/><path d="M21.5 9v5"/>',
  caneta:'<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M14 7l3 3"/>',
  olho:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  mapa:'<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  gravata:'<path d="M9.5 3.5h5l-1 3 2 9.5L12 20l-3.5-4 2-9.5z"/>',
  bandeira:'<path d="M5 21V4"/><path d="M5 4.5h12l-2.5 4 2.5 4H5"/>',
  mundo:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>',
  sobe:'<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  desce:'<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  microfone:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
  predio:'<path d="M4 21V5.5L12 3v18"/><path d="M12 9h8v12"/><path d="M7 8h2M7 11.5h2M7 15h2M15 13h2M15 16.5h2"/><path d="M2.5 21h19"/>',
  pecas:'<path d="M5 5h5.5v2a2 2 0 1 0 3 0V5H19v5.5h-2a2 2 0 1 0 0 3h2V19h-5.5v-2a2 2 0 1 0-3 0v2H5z"/>',
  frasco:'<path d="M9.5 3.5h5"/><path d="M10.5 3.5v6L5 18.5A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.5l-5.5-9v-6"/><path d="M7.5 15h9"/>',
  radar:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 18 6"/>',
  balao:'<path d="M4 5h16v11H9l-5 4z"/>',
  dinheiro2:'<rect x="3" y="6.5" width="18" height="11"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  cadeado:'<rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  ciclo:'<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1"/><path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4"/>',
  fogo:'<path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-3.6 2.8-5.3 3.6-9.3 2.4 1.6 3.4 3.7 3.4 5.6 1-1 1.6-2.2 1.6-3.6 2.6 1.9 4.4 4.6 4.4 7.3 0 3.5-2.5 6.2-6.5 6.2z"/>',
  alvo:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  escudo2:'<path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z"/><path d="M9 12l2.3 2.3L15.6 10"/>',
  martelo:'<path d="M13 5.5 18.5 11"/><path d="M11.5 7 16.5 2"/><path d="M15 14.5 20 9.5"/><path d="M13.5 9 4 18.5 5.5 20 15 10.5"/>',
  telefone:'<path d="M5 4h4l1.5 4.5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4z"/>',
  envelope:'<rect x="3" y="5.5" width="18" height="13"/><path d="m3 6.5 9 6.5 9-6.5"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  seta:'<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  spike:'<path d="M12 2.5 15 9h-6z"/><path d="M8.5 9h7l-1 9.5h-5z"/><path d="M10.5 18.5 12 21.5l1.5-3"/>',
  desarme:'<path d="M14.5 4.5a4.5 4.5 0 0 0-5.6 5.6L3.5 15.5l2 2 .9-.9 1.3 1.3 1.6-1.6-1.3-1.3 2.6-2.6a4.5 4.5 0 0 0 5.6-5.6l-2.6 2.6-2.3-.6-.6-2.3z"/>',
  relogio:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4.5l3 1.8"/><path d="M9.5 2.5h5"/>',
  caveira:'<path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.4 1.1 4 2.7 4.9V19h9.6v-3.6c1.6-.9 2.7-2.5 2.7-4.9 0-4-3.1-7-7.5-7z"/><circle cx="9.2" cy="11" r="1.6"/><circle cx="14.8" cy="11" r="1.6"/><path d="M10.5 19v-2M13.5 19v-2"/>',
  controle:'<path d="M6.5 8h11a3.5 3.5 0 0 1 3.4 4.3l-1.2 4.8a2.3 2.3 0 0 1-4 .8L14 16h-4l-1.7 1.9a2.3 2.3 0 0 1-4-.8l-1.2-4.8A3.5 3.5 0 0 1 6.5 8z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="16" cy="12" r=".8"/>'
});

/* emoji → ícone. A cor acompanha o sentido (ouro para conquista, vermelho
   para problema, teal para algo bom) — é a mesma régua da paleta. */
const EMOJI_ICONE={
  '🏆':['trofeu','ouro'],'🏅':['medalha','ouro'],'★':['estrela','ouro'],'⭐':['estrela','ouro'],
  '⚠':['alerta','ambar'],'🤝':['aperto','teal'],'🏛':['coluna','ouro'],'📉':['queda','red'],'📈':['alta','teal'],
  '📄':['contrato',''],'🩹':['lesao','red'],'🏢':['predio','ouro'],'🎓':['diploma','azul'],'✍':['caneta','teal'],
  '💼':['maleta','ouro'],'👀':['olho',''],'🗺':['mapa','azul'],'👔':['gravata',''],'💰':['dinheiro2','teal'],
  '🏳':['bandeira',''],'🌍':['mundo','azul'],'⬆':['sobe','teal'],'⬇':['desce','red'],'🎙':['microfone','azul'],
  '👋':['saida',''],'🧩':['pecas',''],'🧪':['frasco','azul'],'📡':['radar','teal'],'🌱':['broto','teal'],
  '💬':['balao',''],'🔄':['ciclo',''],'🔁':['ciclo',''],'↻':['ciclo',''],'🏷':['maleta',''],'✋':['alerta','red'],
  '💥':['fogo','red'],'📞':['telefone',''],'🛡':['escudo2','teal'],'🔨':['martelo',''],'🧾':['contrato',''],
  '🔒':['cadeado',''],'🔥':['fogo','red'],'📨':['envelope',''],'🎯':['alvo',''],'🎮':['controle','azul'],
  '✓':['check','teal'],'✕':['x','red']
};
const _RE_EMOJI=new RegExp('('+Object.keys(EMOJI_ICONE).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\uFE0F?','g');
function icone(nome,cls){return `<i class="ic ${cls||''}">${ico(nome)}</i>`;}
/* texto já escapado → mesmo texto com os emojis trocados por ícone */
function iconizar(html){
  return String(html).replace(_RE_EMOJI,(m,e)=>{const x=EMOJI_ICONE[e];return x?icone(x[0],x[1]):m;})
    .replace(/[😶🙂]️?\s?/g,'');
}

/* HTML pronto: troca só nos trechos de texto, nunca dentro de uma tag (um
   title="🏆 …" com SVG dentro quebraria o atributo) */
function iconizarHtml(html){
  return String(html).split(/(<[^>]*>)/).map(p=>p.charAt(0)==='<'?p:iconizar(p)).join('');
}
/* "Como funciona": a explicação existe, mas não ocupa o topo da tela */
function explica(html,rot){
  return `<details class="explica"><summary>${ico('info')}<span>${esc(rot||'Como funciona')}</span></summary><div>${html}</div></details>`;
}
/* estado vazio com ícone e, se houver, um botão */
function vazio(txt,iconeNome,acao){
  return `<div class="vazio">${icone(iconeNome||'info')}<div>${txt}</div>${acao||''}</div>`;
}

/* ============================================================
   V2 — MOVIMENTO
   Discreto no dia a dia (troca de tela, abas, números, barras) e
   vistoso nos momentos que merecem (título do seu clube). Tudo some
   com "Animação" desligada nas Configurações ou com movimento reduzido
   no sistema.
   ============================================================ */
function animacaoLigada(){
  if(document.body.classList.contains('sem-anim'))return false;
  return !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
let _telaAnimada=null;
/* chamado por render() depois de pintar a tela */
/* `como` vem de pintarRaiz: só tela nova ou aba nova anima; o redesenho da
   mesma tela (morfar) fica parado, que era de onde vinha o pisca-pisca */
function animarTela(v,telaAtual,como){
  const mudou=como?como!=='morfou':telaAtual!==_telaAnimada;
  _telaAnimada=telaAtual;
  animarAbas(v);
  if(!mudou||!animacaoLigada())return;
  v.classList.remove('entra','aba');void v.offsetWidth;v.classList.add('entra');
  /* troca de aba: só a fusão, sem o deslize (o cabeçalho da tela é o mesmo) */
  if(como==='aba')v.classList.add('aba');else contarNumeros(v);
}
/* indicador das abas desliza da aba anterior para a nova */
const _abaAnterior=new Map();
function animarAbas(raiz){
  raiz.querySelectorAll('.tabs').forEach(tb=>{
    const on=tb.querySelector('button.on');
    const chave=[...tb.querySelectorAll('button')].map(b=>b.textContent.trim().slice(0,12)).join('|');
    if(!on){tb.style.removeProperty('--tab-w');return;}
    const x=on.offsetLeft,w=on.offsetWidth;
    const ant=_abaAnterior.get(chave);
    tb.classList.add('tabs-ind');
    if(ant&&animacaoLigada()&&(ant.x!==x||ant.w!==w)){
      tb.style.setProperty('--tab-x',ant.x+'px');tb.style.setProperty('--tab-w',ant.w+'px');
      tb.classList.add('sem-trans');void tb.offsetWidth;tb.classList.remove('sem-trans');
      requestAnimationFrame(()=>{tb.style.setProperty('--tab-x',x+'px');tb.style.setProperty('--tab-w',w+'px');});
    }else{tb.style.setProperty('--tab-x',x+'px');tb.style.setProperty('--tab-w',w+'px');}
    _abaAnterior.set(chave,{x,w});
  });
}
/* números de KPI contam até o valor ("$4.59M", "82", "13 derrotas") */
function contarNumeros(raiz){
  raiz.querySelectorAll('.kpi .vl, [data-conta]').forEach(el=>{
    if(el.children.length)return;
    const txt=el.textContent;
    const m=txt.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/);
    if(!m)return;
    const alvo=parseFloat(m[2].replace(',','.'));if(!isFinite(alvo)||alvo===0)return;
    const casas=(m[2].split(/[.,]/)[1]||'').length,sep=m[2].includes(',')?',':'.';
    const t0=performance.now(),dur=650;
    const passo=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
      el.textContent=m[1]+(alvo*e).toFixed(casas).replace('.',sep)+m[3];
      if(k<1)requestAnimationFrame(passo);else el.textContent=txt;};
    requestAnimationFrame(passo);
  });
}

/* ---------- momento: título do seu clube ---------- */
let _titulosVistos=null;
function titulosDoMeuClube(){return (G&&G.historico||[]).filter(h=>h&&!h.pre&&G.meuTime&&h.timeId===G.meuTime);}
function conferirCelebracao(){
  if(!G||!G.meuTime)return;
  const tits=titulosDoMeuClube();
  if(_titulosVistos==null){_titulosVistos=tits.length;return;}
  const novos=tits.slice(_titulosVistos);_titulosVistos=tits.length;
  if(novos.length)celebrar(novos[novos.length-1]);
}
function celebrar(h){
  const t=G.times[h.timeId];
  const cores=['#FF4655','#E2B45A','#18E5B4','#ECE8E1','#4C8DFF'];
  const confete=animacaoLigada()?Array.from({length:70},(_,i)=>`<i style="left:${(i*137)%100}%;background:${cores[i%5]};
    animation-delay:${(i%14)*0.06}s;animation-duration:${1.8+(i%7)*0.18}s;transform:rotate(${i*47}deg)"></i>`).join(''):'';
  const d=document.createElement('div');d.className='celebra';
  d.innerHTML=`<div class="celebra-confete">${confete}</div>
    <div class="celebra-caixa">
      <div class="celebra-trofeu">${typeof imgTrofeu==='function'?imgTrofeu(h.trofeu||(typeof trofeuDoTitulo==='function'?trofeuDoTitulo(h.ano,h.evento):null),110,h.evento):''}</div>
      <div class="eyebrow">Campeão · ${h.ano}</div>
      <h1>${esc(h.evento)}</h1>
      <div class="celebra-clube">${t?escudo(t,34):''}<b>${esc(h.campeao)}</b></div>
      <button class="btn">Comemorar</button></div>`;
  document.body.appendChild(d);
  const fim=()=>{d.classList.add('sai');setTimeout(()=>d.remove(),300);};
  d.querySelector('button').onclick=fim;d.onclick=e=>{if(e.target===d)fim();};
  setTimeout(()=>{if(document.body.contains(d))fim();},9000);
}

/* ============================================================
   V4 — TABELAS
   Uma linha de clube igual em toda tabela do jogo: posição em selo,
   escudo, nome com a sigla, faixa colorida pela regra do torneio e
   forma recente. Tabelas com class "ordenavel" ordenam ao clicar no
   cabeçalho.
   ============================================================ */
/* posição; zona: 'po' (avança), 'q' (vaga em internacional), 'cai' */
function selo(n,zona){return `<span class="pos ${zona||''}">${n}</span>`;}
function celClube(id,px){
  const t=G.times[id];if(!t)return '—';
  return `<span class="cel-clube">${escudo(t,px||22)}<span class="cel-nome">${esc(t.nome)}</span><span class="cel-tag">${esc(t.tag)}</span></span>`;
}
/* últimas séries do clube no ano, da mais antiga para a mais recente */
function ultimasSeries(id,n){
  const out=[];
  for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[]){
    if(r.a!==id&&r.b!==id)continue;
    const adv=r.a===id?r.b:r.a,pl=r.a===id?r.wa+'–'+r.wb:r.wb+'–'+r.wa;
    out.push({v:r.v===id,sem:r.sem||0,txt:(r.v===id?'V ':'D ')+pl+' '+tagT(adv)});
  }
  out.sort((a,b)=>a.sem-b.sem);
  return out.slice(-(n||5));
}
function formaRecente(id,n){
  const l=ultimasSeries(id,n||5);
  if(!l.length)return '<span class="forma vazia">—</span>';
  return `<span class="forma">${l.map(x=>`<i class="${x.v?'v':'d'}" title="${esc(x.txt)}"></i>`).join('')}</span>`;
}
function legendaZonas(itens){
  return `<div class="tb-legenda">${itens.map(([z,txt])=>`<span><i class="lz ${z}"></i>${esc(txt)}</span>`).join('')}</div>`;
}
/* ordenação ao clicar no cabeçalho */
function _valorCelula(td){
  if(!td)return '';
  if(td.dataset.v!=null)return parseFloat(td.dataset.v);
  const t=td.textContent.trim();
  const limpo=t.replace(/[▲▼$+\s]/g,'').replace('−','-');
  const m=limpo.match(/^(-?\d+(?:[.,]\d+)?)([kKmM]?)(?![\w])/);
  if(m){let v=parseFloat(m[1].replace(',','.'));if(/k/i.test(m[2]))v*=1e3;if(/m/i.test(m[2]))v*=1e6;return v;}
  return t.toLowerCase();
}
function ligarOrdenacao(raiz){
  if(!raiz)return;
  raiz.querySelectorAll('table.ordenavel').forEach(tb=>{
    const ths=[...tb.querySelectorAll('thead th')];
    ths.forEach((th,i)=>{
      if(th.classList.contains('sem-ord')||!th.textContent.trim())return;
      th.classList.add('ord');
      th.onclick=()=>{
        const tbody=tb.tBodies[0];if(!tbody)return;
        const asc=th.dataset.dir==='desc';
        ths.forEach(x=>{delete x.dataset.dir;x.classList.remove('asc','desc');});
        th.dataset.dir=asc?'asc':'desc';th.classList.add(asc?'asc':'desc');
        const linhas=[...tbody.rows];
        linhas.sort((a,b)=>{const va=_valorCelula(a.cells[i]),vb=_valorCelula(b.cells[i]);
          const r=(typeof va==='number'&&typeof vb==='number')?va-vb:String(va).localeCompare(String(vb),'pt-BR');
          return asc?r:-r;});
        linhas.forEach(l=>tbody.appendChild(l));
      };
    });
  });
}

/* ============================================================
   V7 — DIA DE JOGO: peças reaproveitadas
   ============================================================ */
/* ícone do jeito que o round acabou (h.como, gravado pelo motor) */
const COMO_ROUND={elim:['caveira','eliminação'],spike:['spike','spike explodiu'],
  defuse:['desarme','spike desarmado'],tempo:['relogio','tempo esgotado']};
function iconeRound(como){return ico((COMO_ROUND[como]||COMO_ROUND.elim)[0]);}
/* Trilha de rounds: um bloco por round com o ícone de como acabou. Quadrado
   = você atacando, cantos redondos = defendendo; meio do mapa marcado. */
function trilhaRounds(hist,souA,opc){
  opc=opc||{};
  return `<div class="rt${opc.grande?' g':''}">${(hist||[]).map((h,i)=>{
    const meuW=souA?h.v:!h.v;
    const lado=souA?h.lado:(h.lado==='atk'?'def':'atk');
    const c=COMO_ROUND[h.como]||COMO_ROUND.elim;
    return (i===12?'<span class="rt-meio"></span>':'')+(i>=24&&(i-24)%2===0?'<span class="rt-meio ot"></span>':'')+
      `<i class="${meuW?'w':'l'} ${lado}${h.pistol?' pistol':''}${i===hist.length-1&&opc.agora?' agora':''}"
        title="Round ${i+1} · ${meuW?'seu':'deles'} · ${c[1]}${h.pistol?' · pistol':''}">${ico(c[0])}</i>`;
  }).join('')}</div>`;
}
/* Barra espelhada do comparativo: você para a esquerda, eles para a direita.
   b=null → o relatório não enxerga; estimado → faixa listrada (palavra). */
function barraEspelho(rot,a,b,opc){
  opc=opc||{};
  const mn=opc.min||0,mx=opc.max||100,esc01=v=>clamp((v-mn)/(mx-mn),0,1);
  const pa=esc01(a),pb=b==null?0:esc01(b);
  const fa=opc.fa?opc.fa(a):Math.round(a), fb=b==null?'?':opc.fb?opc.fb(b):Math.round(b);
  const melhor=b==null?'':a>b+(opc.empate||1)?'a':b>a+(opc.empate||1)?'b':'';
  return `<div class="be ${melhor?'m-'+melhor:''}">
    <span class="be-v a num">${fa}</span>
    <span class="be-t a"><u style="--p:${(pa*100).toFixed(1)}%"></u></span>
    <span class="be-rot">${rot}</span>
    <span class="be-t b ${opc.estimado?'est':''} ${b==null?'nada':''}"><u style="--p:${(pb*100).toFixed(1)}%"></u></span>
    <span class="be-v b num">${fb}</span></div>`;
}
/* Os dois clubes frente a frente, com a cor de cada um. */
function frenteAFrente(A,B,meio,opc){
  opc=opc||{};const px=opc.px||72;
  const lado=(t,cls)=>`<div class="ff-lado ${cls}" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    <div class="ff-escudo">${escudo(t,px)}</div>
    <div class="ff-nome"><b>${esc(t.nome)}</b><span>${esc(t.tag)}${opc.info?' · '+opc.info(t):''}</span></div></div>`;
  return `<div class="ff${opc.compacto?' compacto':''}" style="--ca:${corDoClube(A)};--cb:${corDoClube(B)}">
    ${lado(A,'a')}<div class="ff-meio">${meio||'<b class="ff-vs">VS</b>'}</div>${lado(B,'b')}</div>`;
}
