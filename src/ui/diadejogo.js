/* ============================================================
   MODO JOGADOR — O DIA DE JOGO (J2)
   ------------------------------------------------------------
   Semana com jogo do seu clube: antes da série abre esta tela.
   O técnico (IA) já vetou e escalou; você vê se é titular, o seu
   agente em cada mapa, e escolhe POR MAPA como quer viver:
     Jogar tudo         o mapa inteiro na gameplay, no seu boneco
     Melhores momentos  o motor joga e para nos rounds que pesam
                        (pistols, um do meio, reta final apertada,
                        match point, prorrogação); nesses, você entra
     Simular            o motor joga; você acompanha a transmissão
   É sempre a MESMA partida do motor (M.J): os rounds que você joga
   e os que o motor joga contam igual para tabela, estatística,
   torcida e prêmios. No banco, a série é só transmissão.
   ============================================================ */

const DJ_MODOS=[
  {id:'tudo',     nome:'Jogar tudo',        desc:'O mapa inteiro na gameplay, round a round.', tempo:'~25 min por mapa'},
  {id:'momentos', nome:'Melhores momentos', desc:'Você entra nos rounds que pesam; o motor joga o resto.', tempo:'~6 rounds por mapa'},
  {id:'simular',  nome:'Simular',           desc:'O motor joga; você acompanha a transmissão.', tempo:'segundos'}
];
let DJ=null;

/* semana com jogo do seu clube, no modo jogador */
function diaDeJogoDisponivel(){
  if(typeof modoJogador!=='function'||!modoJogador())return null;
  const t=clubeDoJogador();
  if(!t||(typeof emCondicaoDeJogo==='function'&&!emCondicaoDeJogo(t)))return null;
  return typeof compromissoDaSemana==='function'?compromissoDaSemana():null;
}

/* o round que vem é seu? (a transmissão pergunta antes de cada round) */
function rodadaDoJogador(S){
  const M=S&&S.M, info=S&&S.jogador;
  if(!M||!M.J||M.fim||!info)return null;
  const J=M.J;
  if(J.historico.length>M.hist.length)return null;            /* esse round já foi jogado */
  if(!J.ents.some(e=>e.mid===info.euMid))return null;          /* você não está em quadra */
  const modo=info.escolhas[S.idx]||'simular';
  if(modo==='simular')return null;
  if(modo==='tudo')return info.mapaJogado===S.idx?null:'mapa';
  const r=M.hist.length+1, a=M.sa, b=M.sb;
  const momento=r===1||r===13||r>=25||Math.max(a,b)>=12||(r>=20&&Math.abs(a-b)<=2)||r===7||r===18;
  return momento?'round':null;
}

/* chamado pela transmissão conduzida antes de jogar um round: se o round é
   seu, abre a gameplay e devolve true (a transmissão espera) */
function avTalvezJogar(){
  if(!AV||!AV.S||AV.jogando||typeof GP==='undefined'||!GP.jogarNoManager)return false;
  const S=AV.S, ate=rodadaDoJogador(S);
  if(!ate)return false;
  AV.jogando=true;
  if(AV.timer){clearTimeout(AV.timer);AV.timer=null;}
  avPintar();
  GP.jogarNoManager(S.M.J,{euMid:S.jogador.euMid,ate}).then(()=>{
    AV.jogando=false;
    if(ate==='mapa'){S.jogador.mapaJogado=S.idx;AV.velAntes=AV.vel;AV.vel=0.06;}   /* as linhas do mapa jogado passam rápido */
    avPassoConduzido();
  }).catch(e=>{AV.jogando=false;console.error(e);avPassoConduzido();});
  return true;
}

/* ---------- a tela antes da série ---------- */
function abrirDiaDeJogo(comp,depois){
  /* o técnico fecha o cinco agora, com o que sabe hoje (core/relacoes.js) */
  if(typeof escalarClubeDoJogador==='function')escalarClubeDoJogador();
  const p=meuJogador(), t=clubeDoJogador();
  const A=G.times[comp.aId], B=G.times[comp.bId], adv=G.times[comp.advId];
  const v=veto(A,B,comp.bo);
  const titular=(t.titulares||[]).includes(p.id);
  DJ={comp,depois,v,titular,escolhas:v.mapas.map(()=>titular?'momentos':'simular')};
  pintarDiaDeJogo();
}
function pintarDiaDeJogo(){
  const {comp,v,titular}=DJ, p=meuJogador(), t=clubeDoJogador(), adv=G.times[comp.advId];
  const ovT=x=>Math.round(x.titulares.reduce((s,i)=>s+over(P(i)),0)/5);
  const linhaMapa=(mapa,i)=>{
    const ag=typeof agenteDe==='function'?agenteDe(t,mapa,p):null;
    return `<div class="dj-mapa">
      <div class="dj-mapa-n"><span class="dim">Mapa ${i+1}</span><b>${esc(mapa)}</b>${ag&&titular?_djAgentes(p,mapa,ag,i):''}</div>
      <div class="dj-modos">${DJ_MODOS.map(m=>`<button class="nj-papel ${DJ.escolhas[i]===m.id?'on':''}" data-djm="${i}:${m.id}" ${!titular&&m.id!=='simular'?'disabled':''}>
        <b>${esc(m.nome)}</b><span>${esc(m.desc)}</span><i>${esc(m.tempo)}</i></button>`).join('')}</div></div>`;
  };
  pintarModal(`<div class="ovl"><div class="box wide dj-box">
    <div class="eyebrow">Dia de jogo · ${esc(comp.stage.nome||'')} · MD${comp.bo}</div>
    <div class="dj-vs">
      <div class="dj-t">${escudo(t,64)}<b>${esc(t.nome)}</b><span class="dim">over ${ovT(t)}</span></div>
      <div class="dj-x">×</div>
      <div class="dj-t">${escudo(adv,64)}<b>${esc(adv.nome)}</b><span class="dim">over ${ovT(adv)}</span></div>
    </div>
    <p class="${titular?'':'dim'}">${titular
      ?`<b>Você é titular.</b> O técnico vetou e montou a comp; escolha como viver cada mapa.`
      :`<b>Você está no banco nesta série.</b> O técnico escala pelo over na função, pela condição e pela confiança dele em você (veja Relações); a série vai ser transmitida e você acompanha de fora.`}</p>
    ${v.mapas.map(linhaMapa).join('')}
    ${titular?`<p class="dim">Na gameplay: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> anda, mouse mira, clique atira, <kbd>C</kbd><kbd>Q</kbd><kbd>E</kbd><kbd>X</kbd> habilidades, <kbd>F</kbd> planta/desarma, <kbd>Esc</kbd> pausa (dá para deixar o bot terminar o round).</p>`:''}
    <div class="dj-acoes">
      ${titular?'<button class="btn ghost" id="djSimTudo">Simular a série inteira</button>':''}
      <button class="btn" id="djComecar">${titular?'Começar a série':'Acompanhar a série'} ›</button>
    </div>
  </div></div>`);
  document.querySelectorAll('[data-djm]').forEach(b=>b.onclick=()=>{const [i,m]=b.dataset.djm.split(':');DJ.escolhas[+i]=m;pintarDiaDeJogo();});
  document.querySelectorAll('[data-djag]').forEach(s=>s.onchange=()=>{
    const r=pedirAgente(clubeDoJogador(),DJ.v.mapas[+s.dataset.djag],s.value);
    flash(r.ok?r.msg:r.motivo);pintarDiaDeJogo();});
  const st=$('#djSimTudo');if(st)st.onclick=()=>{DJ.escolhas=DJ.escolhas.map(()=>'simular');comecarDiaDeJogo();};
  $('#djComecar').onclick=comecarDiaDeJogo;
}
/* o seu agente no mapa: dá para pedir outro do pool; o técnico decide */
function _djAgentes(p,mapa,ag,i){
  const pool=[...new Set([ag,...(p.agentes||[])])];
  if(typeof pedirAgente!=='function'||pool.length<2)return `<span class="chip">${esc(ag)}</span>`;
  const nv=a=>typeof nivelAgente==='function'?Math.round(nivelAgente(p,a)):'';
  return `<select class="dj-ag" data-djag="${i}" title="Pedir outro agente ao técnico">${pool.map(a=>`<option value="${esc(a)}" ${a===ag?'selected':''}>${esc(a)} · ${nv(a)}</option>`).join('')}</select>`;
}
function comecarDiaDeJogo(){
  const {comp,depois,v,escolhas}=DJ;DJ=null;
  if(typeof guiaMarcar==='function')guiaMarcar('jogou');
  $('#modal').innerHTML='';
  const ctx={stage:comp.stage.id,nome:comp.stage.nome,semana:G.semana};
  const S=abrirSerie(comp.aId,comp.bId,comp.bo,{seq:v.seq,mapas:v.mapas,lados:v.lados});
  S.jogador={escolhas,euMid:G.voce.id};
  const plano={stageId:comp.stage.id,veto:{seq:v.seq,mapas:v.mapas,lados:v.lados}};
  partidaConduzida(S,ctx,res=>{res.semana=G.semana;plano.serieFeita=res;if(depois)depois(plano);});
}

/* ============================================================
   O DIA DE JOGO PELA SELEÇÃO (World Cup, C6)
   ------------------------------------------------------------
   Mesma tela e mesmos três jeitos de viver cada mapa, com a sua
   seleção em vez do clube. O técnico da seleção (IA) já vetou e
   escalou: titular entra em quadra; reserva assiste. A série é
   jogada na tela antes de o relógio chegar nela e entregue pronta
   (core/selecao-jogo.js, injetarSerieSelecao).
   ============================================================ */
let DJS=null;
function abrirDiaDeJogoSelecao(pend,depois){
  const p=meuJogador(), cv=(pend.ctx&&pend.ctx.conv)||{};
  const A=timeDaSelecao(pend.a,cv[pend.a]), B=timeDaSelecao(pend.b,cv[pend.b]);
  if(!A||!B){if(depois)depois();return;}
  const meu=p.pais===pend.a?A:B, adv=meu===A?B:A;
  /* o veto com as seleções em campo só durante a conta; elas entram de verdade
     quando a série começa e saem quando ela fecha */
  const v=comSelecoesEmCampo([A,B],()=>veto(A,B,pend.ctx.bo));
  const titular=meu.titulares.includes(p.id);
  DJS={pend,depois,A,B,meu,adv,v,titular,escolhas:v.mapas.map(()=>titular?'momentos':'simular')};
  pintarDiaDeJogoSelecao();
}
function pintarDiaDeJogoSelecao(){
  const {pend,v,titular,meu,adv}=DJS, p=meuJogador();
  const ovT=x=>Math.round(x.titulares.reduce((s,i)=>s+over(P(i)),0)/5);
  const tec=meu.comissao&&meu.comissao.tecnico&&G.staff[meu.comissao.tecnico];
  const linhaMapa=(mapa,i)=>{
    const ag=typeof agenteDe==='function'?agenteDe(meu,mapa,p):null;
    return `<div class="dj-mapa">
      <div class="dj-mapa-n"><span class="dim">Mapa ${i+1}</span><b>${esc(mapa)}</b>${ag&&titular?`<span class="chip">${esc(ag)}</span>`:''}</div>
      <div class="dj-modos">${DJ_MODOS.map(m=>`<button class="nj-papel ${DJS.escolhas[i]===m.id?'on':''}" data-djsm="${i}:${m.id}" ${!titular&&m.id!=='simular'?'disabled':''}>
        <b>${esc(m.nome)}</b><span>${esc(m.desc)}</span><i>${esc(m.tempo)}</i></button>`).join('')}</div></div>`;
  };
  const cic=cicloAtual();
  pintarModal(`<div class="ovl"><div class="box wide dj-box dj-selecao" ${cic?`style="${fundoDaSede(cic,.9)}"`:''}>
    <div class="cpx-eyebrow">Dia de jogo pela seleção · ${esc(pend.ctx.nome||'')} · ${esc(pend.ctx.fase||'')} · MD${pend.ctx.bo}</div>
    <div class="dj-vs">
      <div class="dj-t">${escudoSelecao(meu.selecao,72)}<b>${esc(meu.nome)}</b><span class="dim">over ${ovT(meu)}${tec?' · técnico '+esc(tec.nome):''}</span></div>
      <div class="dj-x">×</div>
      <div class="dj-t">${escudoSelecao(adv.selecao,72)}<b>${esc(adv.nome)}</b><span class="dim">over ${ovT(adv)}</span></div>
    </div>
    <p class="${titular?'':'dim'}">${titular
      ?`<b>Você é titular da ${esc(meu.nome)}.</b> O técnico da seleção vetou e montou a comp; escolha como viver cada mapa.`
      :`<b>Você está entre os reservas nesta série.</b> O cinco da seleção é o melhor possível pela conta das funções; a série vai ser transmitida e você acompanha do banco.`}</p>
    ${v.mapas.map(linhaMapa).join('')}
    <div class="dj-acoes">
      ${titular?'<button class="btn ghost" id="djsSim">Simular a série inteira</button>':''}
      <button class="btn cpx-faixa-btn" id="djsComecar">${titular?'Entrar em quadra':'Acompanhar a série'} ›</button>
    </div>
  </div></div>`);
  document.querySelectorAll('[data-djsm]').forEach(b=>b.onclick=()=>{const [i,m]=b.dataset.djsm.split(':');DJS.escolhas[+i]=m;pintarDiaDeJogoSelecao();});
  const st=$('#djsSim');if(st)st.onclick=()=>{DJS.escolhas=DJS.escolhas.map(()=>'simular');comecarDiaDeJogoSelecao();};
  $('#djsComecar').onclick=comecarDiaDeJogoSelecao;
}
function comecarDiaDeJogoSelecao(){
  const {pend,depois,A,B,meu,v,escolhas}=DJS;DJS=null;
  $('#modal').innerHTML='';
  const sair=entrarSelecoesEmCampo([A,B]);
  G._selecaoEmTela=meu.id;
  const S=abrirSerie(A.id,B.id,pend.ctx.bo,{seq:v.seq,mapas:v.mapas,lados:v.lados});
  S.jogador={escolhas,euMid:G.voce.id};
  let ficha=null;
  const ctx={meuId:meu.id,nome:pend.ctx.nome,semana:G.semana,
    /* fecha como série de seleção: ficha, estatística de seleção e ranking */
    fechar:S2=>{
      ficha=fecharSerieSelecaoConduzida(S2,A,B,pend);
      G._selecaoEmTela=null;sair();
      return Object.assign(consolidarSerie(S2),{aId:S2.aId,bId:S2.bId,bo:S2.bo,mapas:S2.mapas,wa:S2.wa,wb:S2.wb,veto:S2.veto.seq,ficha});
    },
    verFicha:(r,d)=>{if(ficha&&typeof modalSerieSelecao==='function')modalSerieSelecao(ficha,d);else if(d)d();},
    /* o avanço segue quando você fecha a transmissão (ou a ficha) */
    aoFechar:()=>{if(depois)depois();}};
  partidaConduzida(S,ctx,()=>{if(ficha)injetarSerieSelecao(ficha);});
}
