/* ============================================================
   A TORCIDA NA TELA
   ------------------------------------------------------------
   O motor (core/torcida.js) guarda o humor e o contexto de cada
   conversa; aqui ela vira comentário. Aparece no relatório de antes
   do jogo, na ficha da partida, na Central, na página do clube e
   numa aba própria das Notícias.
   ============================================================ */

/* palavrão some com asterisco quando a opção está desligada */
const PALAVROES_RE=/\b(porra|caralho|merda|puta|pqp|bosta)\b/gi;
function censurarTorcida(txt){
  if(Prefs.get('palavroes')!==false)return txt;
  return String(txt).replace(PALAVROES_RE,w=>w[0]+'*'.repeat(w.length-1));
}
function corHumor(h){return h>=63?'var(--teal)':h>=47?'var(--amber)':'var(--red)';}
function chipHumor(h,rot){
  return `<span class="tc-humor" style="--h:${corHumor(h)}"><i style="width:${clamp(h,2,100)}%"></i><b>${esc(rot)}</b><span class="num">${h}</span></span>`;
}
function comentarioTorcidaHTML(c,t){
  const trad=c.autor.lingua&&c.autor.lingua!=='pt'?LINGUA_NOME[c.autor.lingua]:null;
  return `<div class="tc-c ${c.tom>0?'tc-pos':c.nivel>=2?'tc-neg2':c.tom<0?'tc-neg':''}">
    ${monogramaImprensa(c.autor.nome,corDoClube(t),34,true)}
    <div class="tc-cc">
      <div class="tc-quem"><b>${esc(c.autor.nome)}</b><span class="ps-arroba">@${esc(c.autor.arroba)}</span><span class="tc-selo">torcedor</span></div>
      <div class="tc-txt">${esc(censurarTorcida(c.txt))}</div>
      ${trad?`<div class="ps-trad">Traduzido do ${trad}</div>`:''}
    </div>
    <span class="tc-like">${ico('coracao')}${numCurto(c.curtidas)}</span>
  </div>`;
}
/* Uma conversa inteira: cabeçalho com o jogo e o humor, depois os comentários. */
function blocoTorcida(e,opc){
  if(!e)return '';
  opc=opc||{};
  const t=G.times[e.t],adv=G.times[e.adv];
  if(!t)return '';
  const cs=comentariosTorcida(e,opc.quantos);
  if(!cs.length)return '';
  const fase=e.fase==='pre'?'Antes do jogo':'Depois do jogo';
  const placar=e.fase==='pos'?`<b class="tc-placar ${e.venceu?'tc-v':'tc-d'}">${e.eu}–${e.ele}</b>`:'';
  return `<div class="${opc.semCard?'':'card flat '}tc-bloco">
    <div class="split tc-cab"><div class="eyebrow">${esc(opc.titulo||('Torcida do '+t.tag+' · '+fase))}</div>
      ${adv?`<span class="tc-jogo">${fase.toLowerCase()} · vs ${escudo(adv,18)} ${esc(adv.tag)} ${placar}</span>`:''}</div>
    ${opc.semHumor?'':`<div class="tc-linha-h">${chipHumor(e.humor,rotuloHumor(e.humor))}
      <span class="dim">${e.esp>=0.62?'favorito':e.esp<=0.38?'azarão':'jogo parelho'} na cabeça da torcida</span></div>`}
    <div class="tc-lista">${cs.map(c=>comentarioTorcidaHTML(c,t)).join('')}</div>
  </div>`;
}
function rotuloHumor(h){
  return h>=78?'Em êxtase':h>=63?'Confiante':h>=47?'Dividida':h>=32?'Impaciente':h>=18?'Revoltada':'Em guerra com o clube';
}
/* A conversa de depois de uma série do seu clube, se existir. */
function conversaDaSerie(res){
  if(!res||!G.torcidaFeed)return null;
  const adv=res.aId===G.meuTime?res.bId:res.aId;
  return G.torcidaFeed.find(e=>e.fase==='pos'&&e.adv===adv&&e.ano===G.ano)||null;
}

/* ---------- clima: humor, técnico, pedidos ---------- */
function climaTorcidaHTML(t,opc){
  opc=opc||{};
  const c=climaTorcida(t);
  const coach=membroDe(t,'tecnico');
  const ped=pedidosTorcida(t);
  const ult=(c.ult||[]).slice(0,6);
  return `<div class="tc-clima">
    <div class="tc-medidores">
      <div>${medidor('<span class="dim">humor</span>',c.humor/100,opc.px||64)}<b>${esc(c.rotulo)}</b></div>
      <div>${medidor('<span class="dim">com o coach</span>',c.tecnico/100,opc.px||64)}<b>${esc(c.rotuloTecnico)}</b>
        ${coach?`<span class="dim">${esc(coach.nome)}</span>`:''}</div>
    </div>
    ${ult.length?`<div class="tc-ult"><span class="eyebrow">Últimas</span>${ult.map(x=>`<i class="${x==='V'?'tc-v':'tc-d'}">${x}</i>`).join('')}
      ${Math.abs(c.seq)>=3?`<span class="dim">${Math.abs(c.seq)} ${c.seq>0?'vitórias':'derrotas'} seguidas</span>`:''}</div>`:''}
    ${ped.length?`<div class="tc-pedidos"><span class="eyebrow">A torcida pede</span>${ped.map(p=>
      `<span class="tc-ped tc-${p.tipo}" ${p.p?`data-p="${p.p.id}"`:''}>${esc(p.txt)}</span>`).join('')}</div>`
      :'<div class="dim" style="font-size:12px">Ninguém pedindo nada por enquanto.</div>'}
  </div>`;
}
/* Central: clima à esquerda, a conversa que interessa agora à direita
   (antes do próximo jogo, ou a última depois de jogo). */
function cardTorcida(t,px){
  const advId=px&&px.adv;
  const pre=advId?conversaPreJogo(t,G.times[advId],px.stage?px.stage.nome:''):null;
  const ultima=(G.torcidaFeed||[]).find(e=>e.fase==='pos')||null;
  const e=pre||ultima;
  return `<div class="card tc-card"><div class="split"><div class="eyebrow">Torcida do ${esc(t.tag)}</div>
      <button class="btn ghost sm" data-torcidafeed>Ver tudo ›</button></div>
    <div class="tc-card-g">
      ${climaTorcidaHTML(t,{px:58})}
      <div>${e?blocoTorcida(e,{semCard:true,semHumor:true,quantos:4,
        titulo:pre?'Antes do jogo':'Depois do último jogo'})
        :'<div class="dim">A torcida começa a falar quando a bola rolar.</div>'}</div>
    </div></div>`;
}
/* Página do clube: aprovação de cada jogador. */
function painelTorcidaClube(t,souEu){
  const ap=aprovacaoJogadores(t);
  const linhas=ap.map(a=>{
    const v=a.v,w=Math.abs(v)/2;
    const rot={fora:'#Fora',renova:'renova!',titular:'quer de titular',idolo:'ídolo'}[a.pedido]||'';
    return `<div class="tc-ap" data-p="${a.p.id}">${retrato(a.p,26)}<b>${esc(a.p.nome)}</b><span class="dim">${a.titular?'':'reserva'}</span>
      <span class="tc-ap-barra"><i class="${v>=0?'tc-pos':'tc-neg'}" style="${v>=0?'left:50%':'right:50%'};width:${w}%"></i></span>
      <span class="num ${v>=20?'up':v<=-20?'dn':''}">${v>0?'+':''}${v}</span><span>${rot?`<span class="tc-ap-rot tc-${a.pedido}">${rot}</span>`:''}</span></div>`;
  }).join('');
  const conv=souEu?(G.torcidaFeed||[]).find(e=>e.t===t.id):null;
  return `<div class="card"><div class="eyebrow">Torcida · porte ${porteTorcida(t)} de 5 · fanatismo ${Math.round(fanatismoDe(t)*100)}</div>
      ${climaTorcidaHTML(t)}
      <div class="eyebrow" style="margin-top:14px">Moral com a torcida</div>
      <div class="tc-aps">${linhas||'<div class="dim">Sem jogadores.</div>'}</div>
      <p class="dim" style="font-size:11.5px;margin-top:8px">Sobe com atuação acima dos companheiros e com vitória; cai com
        atuação apagada e derrota. Torcida fanática oscila mais — e cobra mais alto.</p></div>
    ${conv?blocoTorcida(conv):''}`;
}

/* ---------- aba Torcida das Notícias ---------- */
function abaTorcidaHTML(){
  const t=meu();
  const lista=(G.torcidaFeed||[]).filter(e=>e.t===t.id).slice(0,newsLimite);
  return `<div class="card flat">${climaTorcidaHTML(t)}</div>
    ${lista.length?lista.map(e=>blocoTorcida(e)).join('')
      :vazio('<b>A torcida ainda não falou.</b> Ela comenta antes e depois de cada jogo do seu clube.','clube')}`;
}
function ligarTorcida(raiz){
  (raiz||document).querySelectorAll('.tc-ped[data-p],.tc-ap[data-p]').forEach(b=>b.onclick=()=>modalJogador(b.dataset.p));
}

/* ---------- clássico (core/legado.js decide; aqui só o selo) ---------- */
function classicoDe(a,b){return typeof classicoEntre==='function'&&a&&b?classicoEntre(a,b):null;}
function seloClassico(a,b,opc){
  const c=classicoDe(a,b);
  if(!c)return '';
  opc=opc||{};
  return `<span class="cl-selo cl-${c.tipo}${opc.grande?' cl-gd':''}" title="${esc(c.nome)}: vale mais para o vestiário e para a torcida">${ico('fogo')}<span>${esc(c.nome)}</span></span>`;
}
