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
      <div class="dj-mapa-n"><span class="dim">Mapa ${i+1}</span><b>${esc(mapa)}</b>${ag&&titular?`<span class="chip">${esc(ag)}</span>`:''}</div>
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
      :`<b>Você está no banco nesta série.</b> O técnico escala pelo over, pela forma e pelo cansaço; a série vai ser transmitida e você acompanha de fora.`}</p>
    ${v.mapas.map(linhaMapa).join('')}
    ${titular?`<p class="dim">Na gameplay: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> anda, mouse mira, clique atira, <kbd>C</kbd><kbd>Q</kbd><kbd>E</kbd><kbd>X</kbd> habilidades, <kbd>F</kbd> planta/desarma, <kbd>Esc</kbd> pausa (dá para deixar o bot terminar o round).</p>`:''}
    <div class="dj-acoes">
      ${titular?'<button class="btn ghost" id="djSimTudo">Simular a série inteira</button>':''}
      <button class="btn" id="djComecar">${titular?'Começar a série':'Acompanhar a série'} ›</button>
    </div>
  </div></div>`);
  document.querySelectorAll('[data-djm]').forEach(b=>b.onclick=()=>{const [i,m]=b.dataset.djm.split(':');DJ.escolhas[+i]=m;pintarDiaDeJogo();});
  const st=$('#djSimTudo');if(st)st.onclick=()=>{DJ.escolhas=DJ.escolhas.map(()=>'simular');comecarDiaDeJogo();};
  $('#djComecar').onclick=comecarDiaDeJogo;
}
function comecarDiaDeJogo(){
  const {comp,depois,v,escolhas}=DJ;DJ=null;
  $('#modal').innerHTML='';
  const ctx={stage:comp.stage.id,nome:comp.stage.nome,semana:G.semana};
  const S=abrirSerie(comp.aId,comp.bId,comp.bo,{seq:v.seq,mapas:v.mapas,lados:v.lados});
  S.jogador={escolhas,euMid:G.voce.id};
  const plano={stageId:comp.stage.id,veto:{seq:v.seq,mapas:v.mapas,lados:v.lados}};
  partidaConduzida(S,ctx,res=>{res.semana=G.semana;plano.serieFeita=res;if(depois)depois(plano);});
}
