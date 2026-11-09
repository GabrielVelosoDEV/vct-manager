/* ============================================================
   MINIGAMES — casca comum e o Range de mira
   ------------------------------------------------------------
   Todo minigame passa pela mesma casca:
     abertura  → o que é, os modos, o que vale a nota e o recorde, com
                 "Começar" e "Deixar a comissão cuidar";
     contagem  → 3, 2, 1;
     jogo      → o minigame desenha no palco (canvas 960×540);
     resultado → medalha, números, o efeito que entrou e o recorde.
   Uma sessão por semana conta; depois dela o minigame fica em treino
   livre, que só vale recorde. O efeito em si mora em core/minigames.js.
   Tudo aqui usa Math.random: nada mexe na semente da carreira.
   ============================================================ */

const MG_W=960,MG_H=540;
function minigamesLigados(){return !(typeof Prefs!=='undefined'&&Prefs.get('minigames')===false);}

/* ---------- som (sintetizado, sem arquivo) ---------- */
let _mgAudio=null;
function somMini(tipo){
  if(typeof Prefs!=='undefined'&&Prefs.get('somMini')===false)return;
  try{
    _mgAudio=_mgAudio||new (window.AudioContext||window.webkitAudioContext)();
    const ac=_mgAudio,t=ac.currentTime,g=ac.createGain();g.connect(ac.destination);
    const tom=(f,d,v,tp)=>{const o=ac.createOscillator();o.type=tp||'sine';o.frequency.setValueAtTime(f,t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40,f*0.5),t+d);const gg=ac.createGain();
      gg.gain.setValueAtTime(v,t);gg.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(gg);gg.connect(ac.destination);o.start(t);o.stop(t+d);};
    const ruido=(d,v,fc)=>{const n=ac.createBuffer(1,Math.round(ac.sampleRate*d),ac.sampleRate),c=n.getChannelData(0);
      for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*(1-i/c.length);
      const s=ac.createBufferSource();s.buffer=n;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||2400;
      const gg=ac.createGain();gg.gain.value=v;s.connect(f);f.connect(gg);gg.connect(ac.destination);s.start(t);};
    if(tipo==='tiro')ruido(0.07,0.10,3200);
    else if(tipo==='corpo')tom(1400,0.08,0.10,'triangle');
    else if(tipo==='cabeca'){tom(2200,0.16,0.12,'sine');tom(3300,0.12,0.05,'sine');}
    else if(tipo==='erro')ruido(0.12,0.06,600);
    else if(tipo==='conta')tom(660,0.12,0.08,'square');
    else if(tipo==='vai')tom(990,0.25,0.10,'square');
    else if(tipo==='fim'){tom(523,0.2,0.08,'triangle');setTimeout(()=>somMini('fim2'),140);}
    else if(tipo==='fim2')tom(784,0.35,0.08,'triangle');
  }catch(e){}
}

/* ---------- a casca ---------- */
let MG=null;   /* {def,modo,vale,loop} da sessão aberta */
function abrirMinigame(def){
  MG={def,modo:(def.modos&&def.modos[0].id)||null,vale:def.vale(),fase:'abertura'};
  pintarMiniAbertura();
}
function _mgRecordeTxt(chave){
  const r=recordeMini(chave);
  const f=x=>x?`<b class="num">${x.pts}</b>`:'<span class="dim">—</span>';
  return `<div class="mg-rec"><span>recorde da carreira ${f(r.carreira)}</span><span>recorde geral ${f(r.geral)}</span></div>`;
}
function pintarMiniAbertura(){
  const d=MG.def;
  const modo=(d.modos||[]).find(m=>m.id===MG.modo);
  abrir(`<div class="mg mg-${d.id}" data-ficha="mg-${d.id}">
    <div class="mg-cab">
      <div class="mg-arte" aria-hidden="true">${d.arte?d.arte():''}</div>
      <div class="mg-cab-t"><div class="eyebrow">${esc(d.eyebrow||'Minigame')}</div>
        <h2 class="mg-tit">${esc(d.titulo)}</h2><p>${d.desc}</p></div>
    </div>
    ${d.modos?`<div class="mg-modos">${d.modos.map(m=>`<button class="mg-modo ${m.id===MG.modo?'on':''}" data-mgmodo="${m.id}">
      <span class="mg-modo-ic">${ico(m.ic||'alvo')}</span><b>${esc(m.nome)}</b><span>${esc(m.desc)}</span>
      ${_mgRecordeTxt(d.id+'-'+m.id)}</button>`).join('')}</div>`:_mgRecordeTxt(d.id)}
    <div class="mg-vale ${MG.vale?'':'livre'}">
      ${MG.vale?`${ico('check')}<div><b>Sessão da semana aberta.</b> ${d.efeitoTxt()}</div>`
        :`${ico('relogio')}<div><b>Treino livre.</b> A sessão desta semana já foi. Jogar agora só vale recorde.</div>`}
    </div>
    <div class="mg-pe">
      <label class="mg-som"><input type="checkbox" id="mgSom" ${Prefs.get('somMini')===false?'':'checked'}> som</label>
      <div class="mg-bts">
        ${MG.vale?'<button class="btn ghost" id="mgComissao" title="Sem sessão: a semana segue como sempre">Deixar a comissão cuidar</button>':'<button class="btn ghost" data-close>Fechar</button>'}
        <button class="btn" id="mgComecar">${MG.vale?'Começar':'Treino livre'} ${modo?'· '+esc(modo.nome):''}</button>
      </div>
    </div>
  </div>`,true,true);
  MG.fase='abertura';
  const M=$('#modal');
  M.querySelectorAll('[data-mgmodo]').forEach(b=>b.onclick=()=>{MG.modo=b.dataset.mgmodo;pintarMiniAbertura();});
  const som=$('#mgSom');if(som)som.onchange=()=>{Prefs.set('somMini',som.checked);};
  const com=$('#mgComissao');if(com)com.onclick=()=>{d.comissao();fechar();flash('A comissão conduziu o treino da semana.');};
  $('#mgComecar').onclick=()=>comecarMini();
}
function comecarMini(){
  const d=MG.def;
  MG.fase='jogo';
  abrir(`<div class="mg mg-${d.id} mg-jogando" data-ficha="mg-${d.id}-jogo">
    <div class="mg-hud" id="mgHud"></div>
    <div class="mg-palco"><canvas id="mgCanvas" width="${MG_W}" height="${MG_H}"></canvas>
      <div class="mg-sobre" id="mgSobre"></div></div>
    <div class="mg-pe"><span class="dim">${esc(d.dica?d.dica(MG.modo):'')}</span>
      <button class="btn ghost sm" id="mgDesiste">Parar</button></div>
  </div>`,true);
  /* durante o jogo, clicar fora não fecha a janela (é o mesmo gesto do tiro) */
  const ovl=$('#modal .ovl');if(ovl)ovl.onclick=null;
  const cv=$('#mgCanvas');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=MG_W*dpr;cv.height=MG_H*dpr;
  const cx=cv.getContext('2d');cx.scale(dpr,dpr);
  const ctx={cv,cx,hud:$('#mgHud'),sobre:$('#mgSobre'),modo:MG.modo,vale:MG.vale,
    pos:e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*MG_W,y:(e.clientY-r.top)/r.height*MG_H};},
    vivo:()=>cv.isConnected&&MG&&MG.fase==='jogo'};
  $('#mgDesiste').onclick=()=>{MG.fase='parado';pintarMiniAbertura();};
  contagemMini(ctx,()=>d.jogar(ctx,res=>terminarMini(res)));
}
function contagemMini(ctx,depois){
  const s=ctx.sobre;let n=3;
  const passo=()=>{
    if(!ctx.vivo())return;
    if(n>0){s.innerHTML=`<span class="mg-conta" key="${n}">${n}</span>`;somMini('conta');n--;setTimeout(passo,620);}
    else{s.innerHTML=`<span class="mg-conta vai" key="vai">VAI</span>`;somMini('vai');
      setTimeout(()=>{if(ctx.vivo())s.innerHTML='';},420);depois();}
  };
  passo();
}
function terminarMini(res){
  if(!MG||MG.fase!=='jogo')return;
  MG.fase='fim';
  const d=MG.def;
  somMini('fim');
  const vale=MG.vale;
  const bateu=d.registrar(res,vale);
  const med=medalhaMini(res.nota);
  abrir(`<div class="mg mg-${d.id} mg-fim" data-ficha="mg-${d.id}-fim">
    <div class="mg-res">
      <div class="mg-medalha" style="--m:${med.cor}"><svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" class="mg-med-f"/><circle cx="60" cy="60" r="52" class="mg-med-a"
          style="stroke-dasharray:${Math.round(res.nota*327)} 327"/></svg>
        <div><b class="num">${Math.round(res.nota*100)}</b><span>${esc(med.nome)}</span></div></div>
      <div class="mg-res-t">
        <div class="eyebrow">${esc(d.titulo)}${res.modoNome?' · '+esc(res.modoNome):''}</div>
        <h2 class="mg-tit">${esc(res.frase||med.nome)}</h2>
        <div class="mg-nums">${(res.stats||[]).map(([r,v])=>`<div><span>${esc(r)}</span><b class="num">${esc(String(v))}</b></div>`).join('')}</div>
        ${bateu&&(bateu.geral||bateu.carreira)?`<div class="mg-novo-rec">${ico('estrela')} Novo recorde ${bateu.geral?'geral':'da carreira'}: <b class="num">${res.pts}</b></div>`:''}
        <div class="mg-vale ${vale?'':'livre'}">${vale?`${ico('check')}<div>${d.efeitoFeito(res)}</div>`
          :`${ico('relogio')}<div>Treino livre: só recorde. A sessão da semana continua como estava.</div>`}</div>
      </div>
    </div>
    <div class="mg-pe"><span></span><div class="mg-bts">
      <button class="btn ghost" id="mgDeNovo">Treino livre</button>
      <button class="btn" data-close>Fechar</button></div></div>
  </div>`,true);
  $('#mgDeNovo').onclick=()=>{MG.vale=false;MG.fase='abertura';pintarMiniAbertura();};
  if(vale)render();
}

/* ============================================================
   RANGE DE MIRA
   ============================================================ */
const RANGE_MODOS=[
  {id:'flick',nome:'Flick',ic:'alvo',desc:'Bots surgem pela pista. Clique rápido; cabeça vale mais.',seg:30},
  {id:'tracking',nome:'Tracking',ic:'olho',desc:'Um bot fazendo ADAD. Segure o clique em cima dele.',seg:20},
  {id:'reflexo',nome:'Reflexo',ic:'fogo',desc:'Espere o bot aparecer e acerte o mais rápido possível. 8 tentativas.',tent:8}
];
function abrirRange(){
  const t=meu();
  abrirMinigame({
    id:'range',titulo:'Range de mira',eyebrow:'Treino da semana',
    desc:'Você puxa a sessão de mira do elenco. Quanto melhor a sua sessão, mais rende a semana de quem treina <b>mira, reflexo ou movimentação</b>.',
    modos:RANGE_MODOS,
    arte:()=>`<svg viewBox="0 0 200 120"><circle cx="150" cy="60" r="44" fill="none" stroke="rgba(255,70,85,.5)" stroke-width="2"/>
      <circle cx="150" cy="60" r="28" fill="none" stroke="rgba(255,70,85,.7)" stroke-width="2"/><circle cx="150" cy="60" r="10" fill="#FF4655"/>
      <path d="M150 6v20M150 94v20M96 60h20M184 60h20" stroke="#18E5B4" stroke-width="3"/></svg>`,
    vale:()=>rangeDisponivel(t),
    efeitoTxt:()=>{const n=beneficiadosRange(t).length;
      return `Vale de <b class="dn">${_pctMg(RANGE_MIN-1)}</b> a <b class="up">${_pctMg(RANGE_MAX-1)}</b> na evolução de mira, reflexo e movimentação desta semana, para <b>${n}</b> jogador${n===1?'':'es'} com esse treino.`;},
    efeitoFeito:res=>{const f=fatorRange(res.nota)-1,n=beneficiadosRange(t).length;
      return `<b class="${f>=0?'up':'dn'}">${_pctMg(f)}</b> na evolução de mira, reflexo e movimentação desta semana para <b>${n}</b> jogador${n===1?'':'es'}.`;},
    comissao:()=>{t.miniTreino={comissao:true,nota:null,ano:G.ano,semana:G.semana||1};},
    dica:m=>m==='tracking'?'Segure o botão do mouse com a mira em cima do bot.':m==='reflexo'?'Não clique antes do bot aparecer.':'Clique nos bots. Cabeça vale mais; errar derruba a precisão.',
    registrar:(res,vale)=>{
      if(vale){const r=registrarRange(t,res);return r?r.bateu:null;}
      return registrarRecordeMini('range-'+res.modo,res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarRange(ctx,fim)
  });
}
const _pctMg=v=>(v>0?'+':v<0?'−':'')+Math.abs(Math.round(v*100))+'%';

/* fundo do range desenhado uma vez numa tela fora da vista */
let _rangeFundo=null;
function fundoRange(){
  if(_rangeFundo)return _rangeFundo;
  const c=document.createElement('canvas');c.width=MG_W;c.height=MG_H;const x=c.getContext('2d');
  const hz=290,vx=MG_W/2;
  let g=x.createLinearGradient(0,0,0,hz);g.addColorStop(0,'#0A1118');g.addColorStop(1,'#16222E');
  x.fillStyle=g;x.fillRect(0,0,MG_W,hz);
  /* painéis da parede do fundo */
  x.strokeStyle='rgba(255,255,255,.05)';x.lineWidth=1;
  for(let i=0;i<=12;i++){x.beginPath();x.moveTo(i*80,40);x.lineTo(i*80,hz);x.stroke();}
  for(let j=0;j<5;j++){x.beginPath();x.moveTo(0,60+j*48);x.lineTo(MG_W,60+j*48);x.stroke();}
  /* faixa de luz da parede */
  g=x.createLinearGradient(0,0,MG_W,0);g.addColorStop(0,'rgba(24,229,180,0)');g.addColorStop(.5,'rgba(24,229,180,.55)');g.addColorStop(1,'rgba(24,229,180,0)');
  x.fillStyle=g;x.fillRect(0,hz-6,MG_W,3);
  x.fillStyle='rgba(255,70,85,.8)';x.fillRect(vx-60,30,120,4);
  x.font='600 11px Inter, sans-serif';x.fillStyle='rgba(236,232,225,.35)';x.textAlign='center';x.fillText('RANGE · VCT MANAGER',vx,24);
  /* piso em perspectiva */
  g=x.createLinearGradient(0,hz,0,MG_H);g.addColorStop(0,'#101A23');g.addColorStop(1,'#0A1118');
  x.fillStyle=g;x.fillRect(0,hz,MG_W,MG_H-hz);
  x.strokeStyle='rgba(255,255,255,.06)';
  for(let i=-14;i<=14;i++){x.beginPath();x.moveTo(vx+i*20,hz);x.lineTo(vx+i*150,MG_H);x.stroke();}
  for(let j=1;j<10;j++){const y=hz+Math.pow(j/10,1.8)*(MG_H-hz);x.beginPath();x.moveTo(0,y);x.lineTo(MG_W,y);x.stroke();}
  /* marcas de distância */
  x.fillStyle='rgba(236,232,225,.25)';x.font='600 10px JetBrains Mono, monospace';
  [['30m',hz+12],['20m',hz+48],['10m',hz+130]].forEach(([t,y])=>{x.fillText(t,70,y);x.fillText(t,MG_W-70,y);});
  /* luminárias do teto e o brilho que elas jogam na parede */
  for(let i=0;i<4;i++){const lx=150+i*220;
    g=x.createRadialGradient(lx,8,2,lx,8,160);g.addColorStop(0,'rgba(236,232,225,.20)');g.addColorStop(1,'rgba(236,232,225,0)');
    x.fillStyle=g;x.fillRect(lx-170,0,340,200);
    x.fillStyle='rgba(236,232,225,.85)';x.fillRect(lx-46,4,92,3);}
  /* pilares com LED dos lados da pista */
  [[118,1],[MG_W-118,-1]].forEach(([px,s])=>{
    x.fillStyle='#0C141B';x.fillRect(px-(s>0?28:0),40,28,hz-40);
    x.fillStyle=s>0?'rgba(255,70,85,.75)':'rgba(24,229,180,.75)';x.fillRect(px+(s>0?-4:0),48,3,hz-56);
    g=x.createLinearGradient(px,0,px+s*60,0);g.addColorStop(0,s>0?'rgba(255,70,85,.18)':'rgba(24,229,180,.16)');g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=g;x.fillRect(Math.min(px,px+s*60),40,60,hz-40);});
  /* V gigante e apagado na parede */
  x.strokeStyle='rgba(255,70,85,.10)';x.lineWidth=3;x.beginPath();
  x.moveTo(vx-110,70);x.lineTo(vx-60,70);x.lineTo(vx,200);x.lineTo(vx-25,250);x.closePath();
  x.moveTo(vx+110,70);x.lineTo(vx+60,70);x.lineTo(vx+20,160);x.lineTo(vx+45,210);x.closePath();x.stroke();
  /* luzes laterais */
  g=x.createLinearGradient(0,0,90,0);g.addColorStop(0,'rgba(255,70,85,.18)');g.addColorStop(1,'rgba(255,70,85,0)');
  x.fillStyle=g;x.fillRect(0,0,90,MG_H);
  g=x.createLinearGradient(MG_W,0,MG_W-90,0);g.addColorStop(0,'rgba(24,229,180,.14)');g.addColorStop(1,'rgba(24,229,180,0)');
  x.fillStyle=g;x.fillRect(MG_W-90,0,90,MG_H);
  _rangeFundo=c;return c;
}
/* bot: d = profundidade (0 longe, 1 perto); x = centro; devolve as zonas */
function botRange(d,x){
  const s=0.45+0.62*d,pe=318+d*175;
  const corpoH=74*s,corpoW=34*s,cabR=12.5*s;
  return{x,pe,s,cab:{x,y:pe-corpoH-cabR*1.05,r:cabR},corpo:{x:x-corpoW/2,y:pe-corpoH,w:corpoW,h:corpoH}};
}
function acertoBot(b,p){
  const dx=p.x-b.cab.x,dy=p.y-b.cab.y;
  if(dx*dx+dy*dy<=b.cab.r*b.cab.r*1.1)return 'cabeca';
  const c=b.corpo;
  if(p.x>=c.x&&p.x<=c.x+c.w&&p.y>=c.y&&p.y<=c.y+c.h)return 'corpo';
  return null;
}
function desenharBot(cx,b,o){
  o=o||{};
  const k=o.sobe==null?1:o.sobe, a=o.alfa==null?1:o.alfa;
  cx.save();cx.globalAlpha=a;
  cx.translate(b.x,b.pe);
  if(o.cai)cx.rotate(o.cai*0.9);
  cx.scale(1,k);cx.translate(-b.x,-b.pe);
  /* sombra no chão */
  cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(b.x,b.pe,b.corpo.w*0.8,4*b.s,0,0,Math.PI*2);cx.fill();
  /* corpo */
  const c=b.corpo,r=c.w*0.42;
  const g=cx.createLinearGradient(c.x,0,c.x+c.w,0);g.addColorStop(0,'#BFC6CC');g.addColorStop(.5,'#ECE8E1');g.addColorStop(1,'#9AA4AD');
  cx.fillStyle=g;cx.beginPath();cx.roundRect(c.x,c.y,c.w,c.h,[r,r,4,4]);cx.fill();
  cx.fillStyle=o.cor||'#FF4655';cx.fillRect(c.x+c.w*0.18,c.y+c.h*0.2,c.w*0.64,c.h*0.12);
  cx.fillRect(c.x+c.w*0.44,c.y+c.h*0.32,c.w*0.12,c.h*0.4);
  /* cabeça */
  cx.fillStyle='#ECE8E1';cx.beginPath();cx.arc(b.cab.x,b.cab.y,b.cab.r,0,Math.PI*2);cx.fill();
  cx.fillStyle='#0F1923';cx.fillRect(b.cab.x-b.cab.r*0.7,b.cab.y-b.cab.r*0.18,b.cab.r*1.4,b.cab.r*0.34);
  cx.fillStyle=o.cor||'#FF4655';cx.fillRect(b.cab.x-b.cab.r*0.5,b.cab.y-b.cab.r*0.1,b.cab.r*1.0,b.cab.r*0.18);
  if(o.anel){cx.strokeStyle=`rgba(255,70,85,${o.anel})`;cx.lineWidth=2;cx.beginPath();cx.arc(b.cab.x,b.cab.y,b.cab.r+4,0,Math.PI*2);cx.stroke();}
  cx.restore();
}
function desenharMira(cx,p,abre){
  const g=4+(abre||0)*6;
  cx.save();cx.lineCap='square';
  const traco=(cor,w)=>{cx.strokeStyle=cor;cx.lineWidth=w;cx.beginPath();
    cx.moveTo(p.x-g-8,p.y);cx.lineTo(p.x-g,p.y);cx.moveTo(p.x+g,p.y);cx.lineTo(p.x+g+8,p.y);
    cx.moveTo(p.x,p.y-g-8);cx.lineTo(p.x,p.y-g);cx.moveTo(p.x,p.y+g);cx.lineTo(p.x,p.y+g+8);cx.stroke();};
  traco('rgba(0,0,0,.8)',4);traco('#18E5B4',2);
  cx.fillStyle='#18E5B4';cx.fillRect(p.x-1,p.y-1,2,2);
  cx.restore();
}
/* faíscas, textos que sobem e marcas de tiro */
function efeitosRange(){
  const fx=[];
  return{
    faisca(x,y,cor,n){for(let i=0;i<(n||10);i++){const a=Math.random()*Math.PI*2,v=60+Math.random()*220;
      fx.push({t:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,vida:0.5,max:0.5,cor});}},
    texto(x,y,txt,cor){fx.push({t:'t',x,y,txt,cor,vida:0.8,max:0.8});},
    furo(x,y){fx.push({t:'f',x,y,vida:1.6,max:1.6});},
    passo(cx,dt){
      for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.vida-=dt;if(f.vida<=0){fx.splice(i,1);continue;}
        const k=f.vida/f.max;
        if(f.t==='p'){f.vy+=600*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;cx.fillStyle=f.cor;cx.globalAlpha=k;cx.fillRect(f.x-1.5,f.y-1.5,3,3);}
        else if(f.t==='t'){cx.globalAlpha=Math.min(1,k*1.6);cx.fillStyle=f.cor;cx.font='800 18px "Bebas Neue", Impact, sans-serif';
          cx.textAlign='center';cx.fillText(f.txt,f.x,f.y-(1-k)*40);}
        else{cx.globalAlpha=k*0.7;cx.fillStyle='#05090D';cx.beginPath();cx.arc(f.x,f.y,2.6,0,Math.PI*2);cx.fill();
          cx.strokeStyle='rgba(255,255,255,.25)';cx.lineWidth=1;cx.stroke();}
        cx.globalAlpha=1;
      }
    }
  };
}
function hudRange(ctx,o){
  ctx.hud.innerHTML=`<div class="mg-h-t"><span>tempo</span><u><i style="width:${Math.max(0,o.restante*100).toFixed(1)}%"></i></u></div>
    <div class="mg-h-n"><span>${esc(o.rot1||'pontos')}</span><b class="num">${o.pts}</b></div>
    <div class="mg-h-n"><span>${esc(o.rot2||'precisão')}</span><b class="num">${o.v2}</b></div>
    ${o.combo>1?`<div class="mg-h-n combo"><span>combo</span><b class="num">x${o.combo}</b></div>`:''}`;
}

function jogarRange(ctx,fim){
  const cx=ctx.cx,cv=ctx.cv,fx=efeitosRange(),fundo=fundoRange();
  let mira={x:MG_W/2,y:MG_H/2},abre=0,t0=performance.now(),ult=t0,tempo=0;
  const modo=ctx.modo,cfg=RANGE_MODOS.find(m=>m.id===modo);
  let pts=0,tiros=0,acertos=0,cabecas=0,combo=0,maxCombo=0;
  const bots=[];
  if(MG)MG.bots=bots;   /* exposto só para os testes automáticos */
  let fimJa=false;
  /* ---- estado por modo ---- */
  let gerados=0,qualidade=0,prox=0.3;                     /* flick */
  let alvo=null,noAlvo=0,segurando=false,segurado=0,dir=1,vel=200,troca=0.5,agach=0;  /* tracking */
  let tent=0,estado='espera',espera=0,apareceu=0,reacoes=[],cedo=0,msg='';          /* reflexo */
  if(modo==='tracking'){alvo={x:MG_W/2,d:0.72};}
  if(modo==='reflexo'){espera=0.9+Math.random()*1.8;}

  const acabar=()=>{
    if(fimJa)return;fimJa=true;
    const prec=tiros?acertos/tiros:0;
    let nota=0,stats=[],frase='';
    if(modo==='flick'){
      const q=gerados?qualidade/gerados:0;
      nota=clamp(q*(0.55+0.45*prec)/0.8,0,1);
      stats=[['Pontos',pts],['Acertos',acertos+'/'+gerados],['Precisão',Math.round(prec*100)+'%'],['Na cabeça',acertos?Math.round(cabecas/acertos*100)+'%':'—'],['Maior combo','x'+maxCombo]];
    }else if(modo==='tracking'){
      const naMira=noAlvo/(cfg.seg),aprov=segurado?noAlvo/segurado:0;
      nota=clamp(naMira*(0.6+0.4*aprov)/0.75,0,1);
      pts=Math.round(noAlvo*100);
      stats=[['Pontos',pts],['Tempo no alvo',Math.round(naMira*100)+'%'],['Aproveitamento',Math.round(aprov*100)+'%']];
    }else{
      const media=reacoes.length?reacoes.reduce((a,b)=>a+b,0)/reacoes.length:900;
      nota=clamp((750-media)/400,0,1);
      pts=Math.max(0,Math.round(1000-media));
      stats=[['Reação média',Math.round(media)+' ms'],['Melhor',reacoes.length?Math.round(Math.min(...reacoes))+' ms':'—'],['Cedo demais',cedo],['Precisão',Math.round(prec*100)+'%']];
    }
    frase=nota>=0.93?'Sessão de outro planeta':nota>=0.8?'Mira afiada':nota>=0.6?'Boa sessão':nota>=0.35?'Sessão regular':'Dia ruim no range';
    fim({nota,pts:Math.round(pts),modo,modoNome:cfg.nome,stats,frase});
  };

  cv.onpointermove=e=>{mira=ctx.pos(e);};
  cv.onpointerdown=e=>{
    if(e.button!==0)return;e.preventDefault();
    mira=ctx.pos(e);
    if(modo==='tracking'){segurando=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}return;}
    if(modo==='reflexo'&&estado==='espera'){cedo++;tent++;reacoes.push(800);msg='Cedo demais';somMini('erro');
      fx.texto(mira.x,mira.y,'CEDO DEMAIS','#E8A33D');estado='pausa';espera=0.9;if(tent>=cfg.tent)setTimeout(acabar,500);return;}
    tiros++;abre=1;somMini('tiro');
    let acerto=null,bi=-1;
    for(let i=bots.length-1;i>=0;i--){if(bots[i].morto)continue;const z=acertoBot(bots[i].b,mira);if(z){acerto=z;bi=i;break;}}
    if(!acerto){combo=0;fx.furo(mira.x,mira.y);fx.faisca(mira.x,mira.y,'rgba(236,232,225,.6)',4);return;}
    const bot=bots[bi];acertos++;
    if(acerto==='cabeca'){cabecas++;somMini('cabeca');fx.faisca(mira.x,mira.y,'#FF4655',18);}
    else{somMini('corpo');fx.faisca(mira.x,mira.y,'#ECE8E1',10);}
    bot.morto=0.0001;
    if(modo==='flick'){
      const rapidez=clamp(1-bot.idade/bot.ttl,0,1);
      combo++;maxCombo=Math.max(maxCombo,combo);
      const base=(acerto==='cabeca'?100:60)+Math.round(40*rapidez);
      const ganho=Math.round(base*(1+Math.min(combo-1,10)*0.05));
      pts+=ganho;qualidade+=(acerto==='cabeca'?1:0.65)*(0.75+0.25*rapidez);
      fx.texto(mira.x,mira.y-14,(acerto==='cabeca'?'HS +':'+')+ganho,acerto==='cabeca'?'#FF4655':'#ECE8E1');
    }else if(modo==='reflexo'){
      const ms=(performance.now()-apareceu);
      reacoes.push(ms);tent++;estado='pausa';espera=0.8;
      fx.texto(mira.x,mira.y-14,Math.round(ms)+' ms',ms<350?'#18E5B4':ms<550?'#ECE8E1':'#E8A33D');
      if(tent>=cfg.tent)setTimeout(acabar,600);
    }
  };
  const solta=()=>{segurando=false;};
  cv.onpointerup=solta;cv.onpointercancel=solta;cv.onpointerleave=()=>{if(modo!=='tracking')return;};

  const quadro=agora=>{
    if(!ctx.vivo()||fimJa)return;
    const dt=Math.min(0.05,(agora-ult)/1000);ult=agora;tempo+=dt;
    abre=Math.max(0,abre-dt*8);
    /* ---- lógica ---- */
    if(modo==='flick'){
      prox-=dt;
      const vivos=bots.filter(b=>!b.morto).length;
      const limite=tempo>cfg.seg*0.5?2:1;
      if(prox<=0&&vivos<limite&&tempo<cfg.seg-0.4){
        const d=0.15+Math.random()*0.85,b=botRange(d,140+Math.random()*(MG_W-280));
        const ttl=Math.max(0.85,1.45-tempo/cfg.seg*0.6)+(1-d)*0.25;
        bots.push({b,idade:0,ttl});gerados++;prox=0.35+Math.random()*0.35;
      }
      for(const o of bots){if(o.morto)continue;o.idade+=dt;if(o.idade>=o.ttl){o.morto=0.0001;o.fugiu=true;combo=0;}}
      if(tempo>=cfg.seg)acabar();
      hudRange(ctx,{restante:1-tempo/cfg.seg,pts,v2:tiros?Math.round(acertos/tiros*100)+'%':'—',combo});
    }else if(modo==='tracking'){
      troca-=dt;
      if(troca<=0){dir=Math.random()<0.75?-dir:dir;vel=170+Math.random()*190;troca=0.22+Math.random()*0.7;
        if(Math.random()<0.18)agach=0.5;}
      agach=Math.max(0,agach-dt);
      alvo.x+=dir*vel*dt;
      if(alvo.x<160){alvo.x=160;dir=1;}if(alvo.x>MG_W-160){alvo.x=MG_W-160;dir=-1;}
      const b=botRange(alvo.d,alvo.x);
      if(agach>0){const dh=b.corpo.h*0.28;b.corpo.y+=dh;b.corpo.h-=dh;b.cab.y+=dh;}
      bots.length=0;bots.push({b,idade:0,ttl:99,fixo:true});
      if(segurando){segurado+=dt;const z=acertoBot(b,mira);
        if(z){noAlvo+=dt*(z==='cabeca'?1.15:1);if(Math.random()<dt*22)fx.faisca(mira.x+(Math.random()-.5)*6,mira.y+(Math.random()-.5)*6,z==='cabeca'?'#FF4655':'#ECE8E1',2);
          if(Math.random()<dt*14)somMini(z==='cabeca'?'cabeca':'corpo');}
        abre=Math.min(1,abre+dt*4);}
      if(tempo>=cfg.seg)acabar();
      hudRange(ctx,{restante:1-tempo/cfg.seg,pts:Math.round(noAlvo*100),rot2:'no alvo',v2:Math.round(noAlvo/Math.max(0.01,tempo)*100)+'%',combo:0});
    }else{
      if(estado==='espera'){espera-=dt;if(espera<=0){estado='alvo';apareceu=performance.now();bots.length=0;
        bots.push({b:botRange(0.45+Math.random()*0.5,160+Math.random()*(MG_W-320)),idade:0,ttl:1.6});msg='';}}
      else if(estado==='alvo'){const o=bots[0];if(o&&!o.morto){o.idade+=dt;if(o.idade>=o.ttl){o.morto=0.0001;o.fugiu=true;
        reacoes.push(900);tent++;estado='pausa';espera=0.8;fx.texto(o.b.x,o.b.cab.y-20,'LENTO','#E8A33D');if(tent>=cfg.tent)setTimeout(acabar,500);}}}
      else if(estado==='pausa'){espera-=dt;if(espera<=0&&tent<cfg.tent){estado='espera';espera=0.9+Math.random()*1.9;bots.length=0;}}
      const media=reacoes.length?Math.round(reacoes.reduce((a,b)=>a+b,0)/reacoes.length):0;
      hudRange(ctx,{restante:1-tent/cfg.tent,rot1:'tentativa',pts:Math.min(tent+1,cfg.tent)+'/'+cfg.tent,rot2:'reação média',v2:media?media+' ms':'—',combo:0});
    }
    /* ---- desenho ---- */
    cx.clearRect(0,0,MG_W,MG_H);
    cx.drawImage(fundo,0,0,MG_W,MG_H);
    if(modo==='reflexo'&&estado==='espera'){cx.fillStyle='rgba(5,9,13,.45)';cx.fillRect(0,0,MG_W,MG_H);
      cx.fillStyle='rgba(236,232,225,.55)';cx.font='600 15px Inter, sans-serif';cx.textAlign='center';cx.fillText('aguarde…',MG_W/2,MG_H/2+80);}
    bots.sort((a,b)=>a.b.pe-b.b.pe);
    for(let i=bots.length-1;i>=0;i--){const o=bots[i];
      if(o.morto){o.morto+=dt;if(o.morto>0.32){bots.splice(i,1);continue;}}}
    for(const o of bots){
      const sobe=o.fixo?1:Math.min(1,o.idade/0.12);
      const urg=!o.fixo&&!o.morto&&o.ttl<10?clamp((o.idade/o.ttl-0.6)/0.4,0,1):0;
      desenharBot(cx,o.b,{sobe,alfa:o.morto?Math.max(0,1-o.morto/0.32):1,cai:o.morto&&!o.fugiu?o.morto/0.32:0,anel:urg});
    }
    fx.passo(cx,dt);
    desenharMira(cx,mira,abre);
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* ---------- cartão no Plano da semana ---------- */
function cardRange(t){
  if(!minigamesLigados())return '';
  const r=t.miniTreino,ult=t.miniTreinoUltimo;
  let estado;
  if(r&&r.comissao)estado=`<span class="dim">A comissão conduziu a sessão desta semana.</span>`;
  else if(r){const med=medalhaMini(r.nota),f=fatorRange(r.nota)-1;
    estado=`<span class="mg-chip" style="--m:${med.cor}">${esc(med.nome)} · ${Math.round(r.nota*100)}</span>
      <span><b class="${f>=0?'up':'dn'}">${_pctMg(f)}</b> em mira, reflexo e movimentação nesta semana</span>`;}
  else estado=`<span><b>Sessão da semana aberta.</b> De ${_pctMg(RANGE_MIN-1)} a ${_pctMg(RANGE_MAX-1)} na evolução de mira, reflexo e movimentação de ${beneficiadosRange(t).length} jogador(es).</span>`;
  const rec=['flick','tracking','reflexo'].map(m=>{const x=recordeMini('range-'+m).geral;return x?x.pts:null;});
  return `<div class="card mg-card">
    <div class="mg-card-arte" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,70,85,.55)" stroke-width="2"/>
      <circle cx="40" cy="40" r="17" fill="none" stroke="rgba(255,70,85,.8)" stroke-width="2"/><circle cx="40" cy="40" r="6" fill="#FF4655"/>
      <path d="M40 2v14M40 64v14M2 40h14M64 40h14" stroke="#18E5B4" stroke-width="2.5"/></svg></div>
    <div class="mg-card-t"><div class="eyebrow">Minigame · Range de mira</div>
      <div class="mg-card-e">${estado}</div>
      <div class="mg-card-rec dim">recordes: flick ${rec[0]??'—'} · tracking ${rec[1]??'—'} · reflexo ${rec[2]??'—'}${ult&&!r&&ult.nota!=null?` · semana passada ${Math.round(ult.nota*100)}`:''}</div></div>
    <button class="btn ${r?'ghost':''}" data-range>${r?'Treino livre':'Ir para o range'}</button>
  </div>`;
}
