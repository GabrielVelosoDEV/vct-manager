/* ============================================================
   JOGOS DE RITMO — um para cada atividade extra do Vestiário
   ------------------------------------------------------------
     Bootcamp        Treino pesado   4 trilhas caindo (D F J K)
     Ranked em duo   Trade kill      2 trilhas, uma por jogador (F e J)
     Stream juntos   Hype do chat    1 trilha com hype train (Espaço)
     Jantar do time  Brinde          círculos na mesa (mouse)
     Sessão mental   Respiração      segurar e soltar no tempo (Espaço)
     Folga coletiva  Dança da folga  chamada e resposta nas setas
   Um motor só (tempo, julgamento, notas longas, combo, nota) e uma
   trilha sonora sintetizada para cada um. A nota sai da precisão e muda
   a força da atividade na semana (core/minigames.js).
   ============================================================ */

const JANELA_PERF=0.07, JANELA_BOM=0.14;

/* ---------- trilha sonora ---------- */
function trilhaRitmo(tema,bpm,batidas,atraso){
  if(typeof Prefs!=='undefined'&&Prefs.get('somMini')===false)return null;
  let ac;try{ac=_mgAudio=_mgAudio||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}
  if(ac.state==='suspended')ac.resume();
  const mestre=ac.createGain();mestre.gain.value=0.32;
  const comp=ac.createDynamicsCompressor();mestre.connect(comp);comp.connect(ac.destination);
  const t0=ac.currentTime+atraso,spb=60/bpm,passo=spb/4;
  const ruido=(()=>{const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;return b;})();
  const env=(g,t,a,d,v)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);};
  const kick=(t,v)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+0.18);
    env(g,t,0.002,0.28,v||0.9);o.connect(g);g.connect(mestre);o.start(t);o.stop(t+0.32);};
  const chiado=(t,d,v,f,tipo)=>{const s=ac.createBufferSource();s.buffer=ruido;const fl=ac.createBiquadFilter();fl.type=tipo||'highpass';fl.frequency.value=f;
    const g=ac.createGain();env(g,t,0.001,d,v);s.connect(fl);fl.connect(g);g.connect(mestre);s.start(t,Math.random()*0.5);s.stop(t+d+0.05);};
  const nota=(t,freq,d,v,tipo,corte)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=tipo||'sine';o.frequency.setValueAtTime(freq,t);
    let fim=g;if(corte){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=corte;o.connect(fl);fl.connect(g);}else o.connect(g);
    env(g,t,0.01,d,v);fim.connect(mestre);o.start(t);o.stop(t+d+0.05);};
  const hz=m=>440*Math.pow(2,(m-69)/12);
  /* progressões por tema, em notas MIDI (raiz de cada compasso) */
  const T={
    edm:{prog:[57,53,48,55],kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.',bass:'..x...x...x...x.',bt:'sawtooth',acorde:'x.......x.......',pad:0},
    trap:{prog:[52,52,48,50],kick:'x.....x...x.....',snare:'........x.......',hat:'x.x.x.xxx.x.x.xx',bass:'x.....x...x.....',bt:'sine',acorde:'x...............',pad:0},
    house:{prog:[60,57,53,55],kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.',bass:'x..x..x...x..x..',bt:'square',acorde:'..x...x...x..x..',pad:0},
    lounge:{prog:[62,55,60,57],kick:'x.........x.....',snare:'......x.......x.',hat:'x.xx.xx.x.xx.xx.',bass:'x.....x.x.....x.',bt:'triangle',acorde:'x..x....x..x....',pad:0},
    calmo:{prog:[57,53,60,55],kick:'x...............',snare:'................',hat:'................',bass:'x.......x.......',bt:'sine',acorde:'................',pad:1},
    funk:{prog:[50,50,53,55],kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.',bass:'x.xx..x.x.x..x..',bt:'square',acorde:'....x.......x...',pad:0}
  }[tema]||{};
  const passos=Math.ceil(batidas*4);
  for(let i=0;i<passos;i++){
    const t=t0+i*passo,s=i%16,raiz=T.prog[Math.floor(i/16)%T.prog.length];
    if(T.kick[s]==='x')kick(t,tema==='calmo'?0.45:0.85);
    if(T.snare[s]==='x'){chiado(t,0.16,0.35,1600);nota(t,190,0.08,0.18,'triangle');}
    if(T.hat[s]==='x')chiado(t,0.04,tema==='lounge'?0.10:0.16,7500);
    if(T.bass[s]==='x')nota(t,hz(raiz-24),passo*1.8,0.32,T.bt,900);
    if(T.acorde[s]==='x')[0,3,7].forEach(iv=>nota(t,hz(raiz+iv+(tema==='edm'?12:0)),passo*2.2,0.06,tema==='house'?'square':'triangle',2400));
    if(T.pad&&s===0)[0,4,7,11].forEach(iv=>nota(t,hz(raiz+iv),spb*4,0.05,'sine'));
  }
  return{ac,t0,parar:()=>{try{mestre.gain.setTargetAtTime(0.0001,ac.currentTime,0.05);setTimeout(()=>{try{mestre.disconnect();}catch(e){}},300);}catch(e){}}};
}
/* toque curto de acerto, afinado por trilha */
function somNotaRitmo(l,tipo){
  if(typeof Prefs!=='undefined'&&Prefs.get('somMini')===false)return;
  try{const ac=_mgAudio;if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();
    const f=[523,659,784,988][l%4]*(tipo==='eco'?1:2);
    o.type=tipo==='eco'?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(tipo==='eco'?0.10:0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
    o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+0.2);}catch(e){}
}

/* ---------- geradores de partitura (batidas, não segundos) ---------- */
const _sorteia=a=>a[(Math.random()*a.length)|0];
function partituraBootcamp(J){
  const ns=[],tot=J.compassos*4;let ult=-1,longaAte={};
  for(let b=4;b<tot-2;b+=0.5){
    const metade=b>tot/2,cheio=b%1===0;
    if(!cheio&&!(metade&&Math.random()<0.55))continue;
    if(cheio&&!metade&&Math.random()<0.15)continue;
    let l;do{l=(Math.random()*4)|0;}while((l===ult&&Math.random()<0.7)||(longaAte[l]&&longaAte[l]>b));
    ult=l;
    if(b%8===4&&Math.random()<0.8){const d=1.5;ns.push({b,l,d});longaAte[l]=b+d+0.5;continue;}
    ns.push({b,l});
    if(b%4===0&&b>8){let l2=(l+2)%4;if(!(longaAte[l2]>b))ns.push({b,l:l2});}
  }
  return ns;
}
function partituraRanked(J){
  const ns=[],tot=J.compassos*4;
  const molde=[[[0,0],[0.5,1],[2,0],[2.5,1]],[[0,0],[0,1],[2,0],[2,1]],[[0,0],[1,1],[2,0],[3,1]],
    [[0,0],[0.5,0],[1,1],[1.5,1],[3,0]],[[0,1],[0.5,0],[2,1],[2.5,0],[3,0],[3,1]],[[0,0],[0.75,1],[1.5,0],[2,1],[3,0],[3.5,1]]];
  for(let c=1;c<J.compassos-1;c++){
    const dif=Math.min(molde.length,2+Math.floor(c/3));
    for(const [o,l] of molde[(Math.random()*dif)|0])ns.push({b:c*4+o,l});
  }
  return ns.filter(n=>n.b<tot-1);
}
function partituraStream(J){
  const ns=[];
  const molde=[[0,1,2,3],[0,0.5,1,2,3],[0,1.5,2,3.5],[0,0.75,1.5,2,3],[0,0.5,1,1.5,2,3]];
  for(let c=1;c<J.compassos-1;c++){
    if(c%4===3){ns.push({b:c*4,l:0,d:3});continue;}
    for(const o of molde[(Math.random()*Math.min(molde.length,1+Math.floor(c/2)))|0])ns.push({b:c*4+o,l:0});
  }
  return ns;
}
function partituraJantar(J){
  const ns=[];let ang=Math.random()*Math.PI*2,x=480,y=270;
  for(let b=4;b<J.compassos*4-2;b+=1){
    if(b>J.compassos*2&&Math.random()<0.35){ns.push(_posJantar(b-0.5,ang+=0.6));}
    if(Math.random()<0.12)continue;
    ns.push(_posJantar(b,ang+=0.9+Math.random()*0.8));
  }
  return ns.sort((a,b)=>a.b-b.b);
}
function _posJantar(b,ang){
  const rx=300,ry=150,cx=480,cy=290;
  return{b,l:0,x:cx+Math.cos(ang)*rx*(0.55+Math.random()*0.45),y:cy+Math.sin(ang)*ry*(0.5+Math.random()*0.5)};
}
function partituraSessao(J){
  const ns=[];let b=4;
  while(b<J.compassos*4-4){const d=_sorteia([2,3,3,4]);ns.push({b,l:0,d,solta:true});b+=d+_sorteia([1,1,2]);}
  return ns;
}
function partituraFolga(J){
  const ns=[];
  for(let c=1;c+1<J.compassos;c+=2){
    const n=Math.min(6,3+Math.floor(c/4)),offs=[];
    const grade=[0,0.5,1,1.5,2,2.5,3,3.5];
    while(offs.length<n){const o=_sorteia(grade);if(!offs.includes(o))offs.push(o);}
    offs.sort((a,b)=>a-b);
    const seq=offs.map(o=>({o,l:(Math.random()*4)|0}));
    for(const s of seq){ns.push({b:c*4+s.o,l:s.l,eco:true});ns.push({b:(c+1)*4+s.o,l:s.l});}
  }
  return ns;
}

/* ---------- o motor ---------- */
function jogarRitmo(ctx,J,fim){
  const cx=ctx.cx,cv=ctx.cv,spb=60/J.bpm,total=J.compassos*4*spb;
  const notas=J.partitura(J).map(n=>Object.assign(n,{t:n.b*spb,res:null})).sort((a,b)=>a.t-b.t);
  const reais=notas.filter(n=>!n.eco);
  const unidades=reais.reduce((s,n)=>s+(n.d?2:1),0);
  let soma=0,pts=0,combo=0,maxCombo=0,st={perfeito:0,bom:0,erro:0},fimJa=false;
  const julg=[],flash=[0,0,0,0],apertadas=new Set(),fx=efeitosRange();
  const atraso=0.35;
  const trilha=trilhaRitmo(J.tema,J.bpm,J.compassos*4+1,atraso);
  const ini=performance.now()+atraso*1000;
  /* O relógio do jogo é o do navegador. A trilha foi marcada para começar no
     mesmo instante; em 40 segundos os dois não se afastam nem 10 ms, e se o
     áudio estiver bloqueado o jogo segue andando, só que em silêncio. */
  const agora=()=>(performance.now()-ini)/1000;
  if(MG)MG.ritmo={notas,agora};   /* exposto para os testes automáticos */
  const marca=(n,r,pos)=>{
    const v=r==='perfeito'?1:r==='bom'?0.6:0;
    soma+=v;st[r]++;
    if(r==='erro'){combo=0;}else{combo++;maxCombo=Math.max(maxCombo,combo);pts+=Math.round((r==='perfeito'?300:120)*(1+Math.min(combo,50)/50));}
    const p=pos||J.ponto(n,ctx);
    julg.push({txt:r==='perfeito'?'PERFEITO':r==='bom'?'BOM':'ERROU',cor:r==='perfeito'?'#18E5B4':r==='bom'?'#ECE8E1':'#FF4655',x:p.x,y:p.y,vida:0.6});
    if(r!=='erro'){fx.faisca(p.x,p.y,r==='perfeito'?'#18E5B4':'#ECE8E1',r==='perfeito'?14:8);flash[n.l]=1;somNotaRitmo(n.l);}
  };
  const cauda=(n,r)=>{
    const v=r==='perfeito'?1:r==='bom'?0.6:r==='solto'?0.25:0;
    soma+=v;n.caudaRes=r;
    if(r==='perfeito'||r==='bom'){pts+=r==='perfeito'?250:120;combo++;maxCombo=Math.max(maxCombo,combo);}
    else combo=0;
    const p=J.ponto(n,ctx,true);
    julg.push({txt:r==='perfeito'?'SEGUROU!':r==='bom'?'BOM':r==='solto'?'SOLTOU CEDO':'PASSOU',cor:v>=0.6?'#18E5B4':'#E8A33D',x:p.x,y:p.y,vida:0.6});
  };
  const bater=(l,pos)=>{
    const t=agora();
    let alvo=null,melhor=9;
    for(const n of reais){
      if(n.res||n.l!==l)continue;
      const dt=Math.abs(n.t-t);
      if(dt<=JANELA_BOM&&dt<melhor){
        if(pos&&Math.hypot(pos.x-n.x,pos.y-n.y)>J.raio)continue;
        alvo=n;melhor=dt;
      }
      if(n.t-t>JANELA_BOM)break;
    }
    if(!alvo){if(pos)fx.faisca(pos.x,pos.y,'rgba(236,232,225,.4)',3);return;}
    alvo.res=melhor<=JANELA_PERF?'perfeito':'bom';
    marca(alvo,alvo.res,pos&&{x:alvo.x,y:alvo.y});
    if(alvo.d)alvo.segura=true;
  };
  const soltar=l=>{
    const t=agora();
    for(const n of reais){
      if(!n.segura||n.l!==l||n.caudaRes)continue;
      n.segura=false;
      const fimN=n.t+n.d*spb,dt=t-fimN;
      if(n.solta){cauda(n,Math.abs(dt)<=0.1?'perfeito':Math.abs(dt)<=0.22?'bom':dt<0?'solto':'passou');}
      else cauda(n,dt>=-0.12?'perfeito':'solto');
    }
  };
  const tecla=e=>{
    if(!ctx.vivo()){limpar();return;}
    const l=J.teclas&&J.teclas[e.code];
    if(l==null)return;
    e.preventDefault();
    if(e.type==='keydown'){if(e.repeat)return;apertadas.add(l);bater(l);}
    else{apertadas.delete(l);soltar(l);}
  };
  const limpar=()=>{window.removeEventListener('keydown',tecla,true);window.removeEventListener('keyup',tecla,true);};
  window.addEventListener('keydown',tecla,true);window.addEventListener('keyup',tecla,true);
  let mira={x:MG_W/2,y:MG_H/2};
  cv.onpointermove=e=>{mira=ctx.pos(e);};
  cv.onpointerdown=e=>{e.preventDefault();mira=ctx.pos(e);
    if(J.mouse){bater(0,mira);apertadas.add(0);}
    else if(J.cliqueTecla!=null){apertadas.add(J.cliqueTecla);bater(J.cliqueTecla);}};
  cv.onpointerup=()=>{if(J.mouse){apertadas.delete(0);}else if(J.cliqueTecla!=null){apertadas.delete(J.cliqueTecla);soltar(J.cliqueTecla);}};
  cv.style.cursor=J.mouse?'none':'default';

  const acabar=()=>{
    if(fimJa)return;fimJa=true;limpar();
    const acc=unidades?soma/unidades:0;
    const nota=clamp((acc-0.35)/0.6,0,1);
    fim({nota,pts,modo:J.id,modoNome:J.nome,
      frase:nota>=0.93?'No ritmo perfeito':nota>=0.8?'Grupo afinado':nota>=0.6?'Boa sintonia':nota>=0.35?'Meio fora do tempo':'Atravessou tudo',
      stats:[['Pontos',pts],['Perfeitos',st.perfeito],['Bons',st.bom],['Erros',st.erro],['Maior combo','x'+maxCombo],['Precisão',Math.round(acc*100)+'%']]});
    if(trilha)trilha.parar();
  };
  let ult=performance.now();
  const quadro=agoraMs=>{
    if(!ctx.vivo()){limpar();if(trilha)trilha.parar();return;}
    if(fimJa)return;
    const dt=Math.min(0.05,(agoraMs-ult)/1000);ult=agoraMs;
    const t=agora();
    /* passou do tempo sem tocar */
    for(const n of reais){
      if(!n.res&&t-n.t>JANELA_BOM){n.res='erro';marca(n,'erro');if(n.d){n.caudaRes='perdida';soma+=0;}}
      if(n.segura&&!n.solta&&t>=n.t+n.d*spb){n.segura=false;cauda(n,'perfeito');}
      if(n.segura&&n.solta&&t>n.t+n.d*spb+0.22){n.segura=false;cauda(n,'passou');}
    }
    /* chamada da Dança: as setas-eco tocam sozinhas */
    for(const n of notas)if(n.eco&&!n.tocou&&t>=n.t){n.tocou=true;somNotaRitmo(n.l,'eco');flash[n.l]=0.8;}
    for(let i=0;i<4;i++)flash[i]=Math.max(0,flash[i]-dt*5);
    const s={t,beat:t/spb,spb,notas,apertadas,flash,combo,J,mira,pulso:1-((t/spb)%1+1)%1};
    cx.clearRect(0,0,MG_W,MG_H);
    J.desenhar(cx,s);
    fx.passo(cx,dt);
    for(let i=julg.length-1;i>=0;i--){const j=julg[i];j.vida-=dt;if(j.vida<=0){julg.splice(i,1);continue;}
      cx.globalAlpha=Math.min(1,j.vida*3);cx.fillStyle=j.cor;cx.font='400 26px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';
      cx.fillText(j.txt,j.x,j.y-(0.6-j.vida)*50);cx.globalAlpha=1;}
    if(combo>=5){cx.fillStyle='rgba(226,180,90,.9)';cx.font='400 22px "Bebas Neue", Impact, sans-serif';cx.textAlign='right';cx.fillText('COMBO x'+combo,MG_W-24,40);}
    if(J.mouse)desenharMira(cx,mira,0);
    hudRange(ctx,{restante:1-clamp(t/total,0,1),pts,rot2:'precisão',
      v2:(st.perfeito+st.bom+st.erro)?Math.round((st.perfeito+st.bom*0.6)/(st.perfeito+st.bom+st.erro)*100)+'%':'—',combo:combo>1?combo:0});
    if(t>total+0.4)acabar();
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* ---------- desenhos ---------- */
const CORES_TRILHA=['#FF4655','#E2B45A','#18E5B4','#4C8DFF'];
function fundoGradiente(cx,a,b,pulso,corPulso){
  const g=cx.createLinearGradient(0,0,0,MG_H);g.addColorStop(0,a);g.addColorStop(1,b);cx.fillStyle=g;cx.fillRect(0,0,MG_W,MG_H);
  if(corPulso){const r=cx.createRadialGradient(MG_W/2,MG_H*0.55,10,MG_W/2,MG_H*0.55,MG_W*0.6);
    r.addColorStop(0,corPulso.replace('A',(0.10+pulso*0.14).toFixed(2)));r.addColorStop(1,corPulso.replace('A','0'));cx.fillStyle=r;cx.fillRect(0,0,MG_W,MG_H);}
}
function gema(cx,x,y,r,cor,brilho){
  cx.save();cx.translate(x,y);
  cx.shadowColor=cor;cx.shadowBlur=brilho?18:8;
  cx.fillStyle=cor;cx.beginPath();cx.moveTo(0,-r);cx.lineTo(r*1.25,0);cx.lineTo(0,r);cx.lineTo(-r*1.25,0);cx.closePath();cx.fill();
  cx.shadowBlur=0;cx.fillStyle='rgba(255,255,255,.55)';cx.beginPath();cx.moveTo(0,-r*0.55);cx.lineTo(r*0.6,0);cx.lineTo(0,-r*0.1);cx.lineTo(-r*0.6,0);cx.closePath();cx.fill();
  cx.restore();
}
/* trilhas verticais, notas descendo (Bootcamp) */
function desenharQueda(cx,s){
  const J=s.J,n=J.faixas,larg=110,x0=MG_W/2-n*larg/2,hit=460,vel=380;
  fundoGradiente(cx,'#0B1218','#120A10',s.pulso,'rgba(255,70,85,A)');
  cx.fillStyle='rgba(236,232,225,.05)';cx.font='400 150px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText('BOOTCAMP',MG_W/2,250);
  for(let i=0;i<n;i++){
    const x=x0+i*larg;
    const g=cx.createLinearGradient(0,0,0,hit);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(255,255,255,${0.04+s.flash[i]*0.12})`);
    cx.fillStyle=g;cx.fillRect(x+4,0,larg-8,hit);
    cx.strokeStyle='rgba(255,255,255,.07)';cx.strokeRect(x+4,0,larg-8,MG_H);
  }
  for(const nt of s.notas){
    const y=hit-(nt.t-s.t)*vel;if(y<-60||(nt.res&&!nt.segura&&!(nt.d&&!nt.caudaRes)))continue;
    if(nt.res==='erro')continue;
    const x=x0+nt.l*larg+larg/2,cor=CORES_TRILHA[nt.l];
    if(nt.d){const y2=hit-(nt.t+nt.d*s.spb-s.t)*vel;cx.fillStyle=cor;cx.globalAlpha=nt.segura?0.75:0.4;
      cx.fillRect(x-9,Math.max(-10,y2),18,Math.min(hit,y)-Math.max(-10,y2));cx.globalAlpha=1;}
    if(!nt.res)gema(cx,x,y,20,cor,false);
  }
  for(let i=0;i<n;i++){
    const x=x0+i*larg+larg/2,on=s.apertadas.has(i);
    cx.strokeStyle=CORES_TRILHA[i];cx.lineWidth=on?4:2;cx.globalAlpha=on?1:0.6;
    cx.beginPath();cx.moveTo(x,hit-24);cx.lineTo(x+30,hit);cx.lineTo(x,hit+24);cx.lineTo(x-30,hit);cx.closePath();cx.stroke();cx.globalAlpha=1;
    cx.fillStyle='rgba(236,232,225,.7)';cx.font='600 15px JetBrains Mono, monospace';cx.textAlign='center';cx.fillText(J.rotulos[i],x,hit+52);
  }
}
/* duas trilhas horizontais, uma por jogador (Ranked em duo) */
function desenharDuo(cx,s){
  const J=s.J,hx=150,vel=330,ys=[200,350];
  fundoGradiente(cx,'#0B1218','#0D1520',s.pulso,'rgba(76,141,255,A)');
  ys.forEach((y,i)=>{
    const cor=i?'#18E5B4':'#FF4655';
    cx.fillStyle=`rgba(255,255,255,${0.03+s.flash[i]*0.08})`;cx.fillRect(0,y-42,MG_W,84);
    cx.strokeStyle='rgba(255,255,255,.08)';cx.beginPath();cx.moveTo(0,y-42);cx.lineTo(MG_W,y-42);cx.moveTo(0,y+42);cx.lineTo(MG_W,y+42);cx.stroke();
    const on=s.apertadas.has(i);
    cx.strokeStyle=cor;cx.lineWidth=on?5:3;cx.beginPath();cx.arc(hx,y,30,0,Math.PI*2);cx.stroke();
    cx.beginPath();cx.moveTo(hx-44,y);cx.lineTo(hx-34,y);cx.moveTo(hx+34,y);cx.lineTo(hx+44,y);cx.moveTo(hx,y-44);cx.lineTo(hx,y-34);cx.moveTo(hx,y+34);cx.lineTo(hx,y+44);cx.stroke();
    cx.fillStyle='rgba(236,232,225,.85)';cx.font='400 24px "Bebas Neue", Impact, sans-serif';cx.textAlign='left';
    cx.fillText((J.nomes&&J.nomes[i])||('Jogador '+(i+1)),24,y-50);
    cx.fillStyle='rgba(236,232,225,.5)';cx.font='600 13px JetBrains Mono, monospace';cx.fillText(J.rotulos[i],hx-5,y+64);
  });
  /* linha de "trade" entre notas simultâneas ou em sequência curta */
  for(const nt of s.notas){
    if(nt.res)continue;const x=hx+(nt.t-s.t)*vel;if(x>MG_W+40)continue;
    const cor=nt.l?'#18E5B4':'#FF4655',y=ys[nt.l];
    cx.save();cx.translate(x,y);cx.shadowColor=cor;cx.shadowBlur=12;cx.strokeStyle=cor;cx.lineWidth=3;
    cx.beginPath();cx.arc(0,0,18,0,Math.PI*2);cx.stroke();cx.fillStyle=cor;cx.beginPath();cx.arc(0,0,6,0,Math.PI*2);cx.fill();cx.restore();
  }
  cx.fillStyle='rgba(236,232,225,.08)';cx.font='400 90px "Bebas Neue", Impact, sans-serif';cx.textAlign='right';cx.fillText('TRADE KILL',MG_W-30,500);
}
/* uma trilha com hype train (Stream juntos) */
function desenharStream(cx,s){
  const J=s.J,hx=170,y=330,vel=320;
  fundoGradiente(cx,'#120B1E','#0B1218',s.pulso,'rgba(155,107,255,A)');
  /* moldura da live: câmera, chat e espectadores */
  cx.fillStyle='#0A0710';cx.fillRect(40,40,520,200);cx.strokeStyle='rgba(155,107,255,.6)';cx.lineWidth=2;cx.strokeRect(40,40,520,200);
  cx.fillStyle='rgba(155,107,255,.15)';cx.font='400 70px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText((J.tag||'VCT')+' AO VIVO',300,160);
  cx.fillStyle='#FF4655';cx.beginPath();cx.arc(62,62,6,0,Math.PI*2);cx.fill();
  cx.fillStyle='#ECE8E1';cx.font='700 12px Inter, sans-serif';cx.textAlign='left';cx.fillText('AO VIVO',74,66);
  const esp=Math.round(1200+s.combo*137+s.t*40);
  cx.fillText(esp.toLocaleString('pt-BR')+' espectadores',440,66);
  cx.fillStyle='#0A0710';cx.fillRect(600,40,320,200);cx.strokeStyle='rgba(255,255,255,.1)';cx.strokeRect(600,40,320,200);
  const msgs=J.chat;
  for(let i=0;i<6;i++){const k=Math.floor(s.beat)-i;if(k<0)break;const m=msgs[(k*7)%msgs.length];
    cx.fillStyle=['#9B6BFF','#18E5B4','#E2B45A','#FF4655'][(k*3)%4];cx.font='700 12px Inter, sans-serif';cx.fillText(m[0]+':',612,224-i*30);
    cx.fillStyle='rgba(236,232,225,.8)';cx.font='12px Inter, sans-serif';cx.fillText(m[1],612+cx.measureText(m[0]+': ').width+4,224-i*30);}
  /* trilha */
  cx.fillStyle=`rgba(255,255,255,${0.04+s.flash[0]*0.1})`;cx.fillRect(0,y-40,MG_W,80);
  for(const nt of s.notas){
    if(nt.res&&!nt.segura)continue;
    const x=hx+(nt.t-s.t)*vel;if(x>MG_W+60)continue;
    if(nt.d){const x2=hx+(nt.t+nt.d*s.spb-s.t)*vel;const g=cx.createLinearGradient(x,0,x2,0);g.addColorStop(0,'#9B6BFF');g.addColorStop(1,'#FF4655');
      cx.fillStyle=g;cx.globalAlpha=nt.segura?0.9:0.55;cx.fillRect(Math.max(hx,x),y-14,x2-Math.max(hx,x),28);cx.globalAlpha=1;
      cx.fillStyle='#ECE8E1';cx.font='400 16px "Bebas Neue", Impact, sans-serif';cx.textAlign='left';cx.fillText('HYPE TRAIN',Math.max(hx,x)+10,y+6);}
    if(!nt.res){cx.save();cx.translate(x,y);cx.shadowColor='#9B6BFF';cx.shadowBlur=14;cx.fillStyle='#9B6BFF';
      cx.beginPath();cx.roundRect(-22,-22,44,44,8);cx.fill();cx.shadowBlur=0;cx.fillStyle='#fff';cx.font='400 20px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';
      cx.fillText(J.emotes[Math.floor(nt.b*2)%J.emotes.length],0,7);cx.restore();}
  }
  const on=s.apertadas.has(0);
  cx.strokeStyle='#ECE8E1';cx.lineWidth=on?5:3;cx.beginPath();cx.roundRect(hx-28,y-28,56,56,10);cx.stroke();
  cx.fillStyle='rgba(236,232,225,.6)';cx.font='600 13px JetBrains Mono, monospace';cx.textAlign='center';cx.fillText('ESPAÇO',hx,y+62);
}
/* círculos na mesa (Jantar) */
function desenharJantar(cx,s){
  const J=s.J,apx=1.25;
  fundoGradiente(cx,'#120D0A','#07090B',s.pulso,'rgba(232,163,61,A)');
  cx.save();cx.fillStyle='#2A1B12';cx.beginPath();cx.ellipse(480,295,410,205,0,0,Math.PI*2);cx.fill();
  cx.strokeStyle='rgba(232,163,61,.35)';cx.lineWidth=3;cx.stroke();
  const g=cx.createRadialGradient(480,280,20,480,295,410);g.addColorStop(0,'rgba(255,200,120,.12)');g.addColorStop(1,'rgba(0,0,0,.35)');cx.fillStyle=g;cx.fill();cx.restore();
  /* velas */
  [[300,170],[660,170],[480,420]].forEach(([x,y],i)=>{const fl=0.7+Math.sin(s.t*9+i)*0.15;
    const r=cx.createRadialGradient(x,y,1,x,y,60);r.addColorStop(0,`rgba(255,190,90,${0.35*fl})`);r.addColorStop(1,'rgba(255,190,90,0)');cx.fillStyle=r;cx.fillRect(x-60,y-60,120,120);
    cx.fillStyle='#ECE8E1';cx.fillRect(x-4,y,8,18);cx.fillStyle='#FFC86E';cx.beginPath();cx.ellipse(x,y-4,3,7*fl,0,0,Math.PI*2);cx.fill();});
  for(const nt of s.notas){
    const dt=nt.t-s.t;if(dt>apx||nt.res&&nt.res!=='erro')continue;if(nt.res==='erro'&&dt<-0.3)continue;
    const k=clamp(1-dt/apx,0,1);
    cx.globalAlpha=nt.res==='erro'?0.3:Math.min(1,k*2);
    cx.fillStyle='#ECE8E1';cx.beginPath();cx.arc(nt.x,nt.y,J.raio-4,0,Math.PI*2);cx.fill();
    cx.fillStyle='#E8DCC8';cx.beginPath();cx.arc(nt.x,nt.y,J.raio-14,0,Math.PI*2);cx.fill();
    cx.strokeStyle='#E8A33D';cx.lineWidth=3;cx.beginPath();cx.arc(nt.x,nt.y,J.raio-4,0,Math.PI*2);cx.stroke();
    if(dt>-0.05){cx.strokeStyle='rgba(255,70,85,.9)';cx.lineWidth=3;cx.beginPath();cx.arc(nt.x,nt.y,(J.raio-4)*(1+Math.max(0,dt)/apx*2.2),0,Math.PI*2);cx.stroke();}
    cx.globalAlpha=1;
  }
}
/* respiração: segurar e soltar no tempo (Sessão mental) */
function desenharRespira(cx,s){
  const J=s.J,y=470,hx=160,vel=150;
  const alvo=s.notas.find(n=>!n.caudaRes&&s.t>=n.t-0.4&&s.t<=n.t+n.d*s.spb+0.3);
  let fase='prepare',k=0.35;
  if(alvo){const ini=alvo.t,fim=alvo.t+alvo.d*s.spb;
    if(s.t<ini){fase='inspire';k=0.35;}else if(s.t<=fim){fase=s.t>fim-0.35?'solte':'segure';k=0.35+0.65*clamp((s.t-ini)/(fim-ini),0,1);}else{fase='solte';k=1;}}
  fundoGradiente(cx,'#08131A','#0B1218',0,null);
  const r=60+k*120;
  const g=cx.createRadialGradient(480,230,r*0.2,480,230,r*1.4);g.addColorStop(0,'rgba(24,229,180,.35)');g.addColorStop(1,'rgba(24,229,180,0)');
  cx.fillStyle=g;cx.fillRect(0,0,MG_W,MG_H);
  cx.strokeStyle='rgba(24,229,180,.8)';cx.lineWidth=3;cx.beginPath();cx.arc(480,230,r,0,Math.PI*2);cx.stroke();
  cx.strokeStyle='rgba(24,229,180,.25)';cx.beginPath();cx.arc(480,230,180,0,Math.PI*2);cx.stroke();
  cx.fillStyle='#ECE8E1';cx.font='400 46px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';
  cx.fillText({prepare:'respire',inspire:'aperte e segure',segure:'segure…',solte:'solte!'}[fase],480,245);
  cx.fillStyle='rgba(255,255,255,.04)';cx.fillRect(0,y-26,MG_W,52);
  for(const nt of s.notas){
    const x=hx+(nt.t-s.t)*vel,x2=hx+(nt.t+nt.d*s.spb-s.t)*vel;if(x2<0||x>MG_W)continue;
    cx.fillStyle=nt.caudaRes?(nt.caudaRes==='perfeito'||nt.caudaRes==='bom'?'rgba(24,229,180,.25)':'rgba(255,70,85,.25)'):nt.segura?'rgba(24,229,180,.75)':'rgba(24,229,180,.4)';
    cx.beginPath();cx.roundRect(Math.max(x,-10),y-14,x2-Math.max(x,-10),28,14);cx.fill();
    cx.strokeStyle='#ECE8E1';cx.lineWidth=2;cx.beginPath();cx.moveTo(x2,y-20);cx.lineTo(x2,y+20);cx.stroke();
  }
  const on=s.apertadas.has(0);
  cx.strokeStyle='#ECE8E1';cx.lineWidth=on?5:3;cx.beginPath();cx.arc(hx,y,22,0,Math.PI*2);cx.stroke();
  cx.fillStyle='rgba(236,232,225,.6)';cx.font='600 12px JetBrains Mono, monospace';cx.fillText('ESPAÇO',hx,y+48);
}
/* setas subindo, chamada e resposta (Folga) */
function desenharDanca(cx,s){
  const J=s.J,larg=96,x0=MG_W/2-2*larg,hit=95,vel=330;
  fundoGradiente(cx,'#150A1C','#0B1218',s.pulso,'rgba(255,70,85,A)');
  /* luzes de festa */
  for(let i=0;i<5;i++){const a=s.t*0.9+i*1.3,x=MG_W/2+Math.cos(a)*380,cor=['#FF4655','#18E5B4','#E2B45A','#4C8DFF','#9B6BFF'][i];
    const r=cx.createRadialGradient(x,MG_H,10,x,MG_H,300);r.addColorStop(0,cor+'33');r.addColorStop(1,cor+'00');cx.fillStyle=r;cx.fillRect(0,0,MG_W,MG_H);}
  const comp=Math.floor(s.beat/4),chamada=comp%2===1;
  cx.fillStyle=chamada?'rgba(226,180,90,.9)':'rgba(24,229,180,.9)';cx.font='400 28px "Bebas Neue", Impact, sans-serif';cx.textAlign='left';
  cx.fillText(s.beat<4?'PRESTE ATENÇÃO':chamada?'OUÇA A SEQUÊNCIA':'SUA VEZ',30,520);
  const angs=[Math.PI,-Math.PI/2,Math.PI/2,0];  /* ← ↑ ↓ → */
  const seta=(x,y,l,cor,alfa,cheia)=>{cx.save();cx.translate(x,y);cx.rotate(angs[l]);cx.globalAlpha=alfa;
    cx.beginPath();cx.moveTo(26,0);cx.lineTo(-4,-24);cx.lineTo(-4,-10);cx.lineTo(-24,-10);cx.lineTo(-24,10);cx.lineTo(-4,10);cx.lineTo(-4,24);cx.closePath();
    if(cheia){cx.fillStyle=cor;cx.shadowColor=cor;cx.shadowBlur=14;cx.fill();}else{cx.strokeStyle=cor;cx.lineWidth=3;cx.stroke();}cx.restore();};
  for(let i=0;i<4;i++){const x=x0+i*larg+larg/2;seta(x,hit,i,'#ECE8E1',s.apertadas.has(i)?1:0.45+s.flash[i]*0.5,false);
    if(s.flash[i]>0.1)seta(x,hit,i,CORES_TRILHA[i],s.flash[i]*0.6,true);
  }
  for(const nt of s.notas){
    if(nt.res)continue;
    const y=hit+(nt.t-s.t)*vel;if(y>MG_H+40||y<hit-40)continue;
    const x=x0+nt.l*larg+larg/2;
    seta(x,y,nt.l,CORES_TRILHA[nt.l],nt.eco?0.35:1,!nt.eco);
  }
}

/* ---------- os seis jogos ---------- */
function jogosRitmo(t){
  const par=(t.atividadePar||[]).map(id=>G.jogadores[id]).filter(Boolean);
  return{
    bootcamp:{id:'bootcamp',nome:'Treino pesado',bpm:128,compassos:18,tema:'edm',faixas:4,partitura:partituraBootcamp,desenhar:desenharQueda,
      teclas:{KeyD:0,KeyF:1,KeyJ:2,KeyK:3},rotulos:['D','F','J','K'],teclasTxt:['D','F','J','K'],
      desc:'A semana de bootcamp no ritmo do treino: quatro trilhas, notas caindo e notas longas para segurar.',
      ponto:(n,c,f)=>({x:MG_W/2-2*110+n.l*110+55,y:420})},
    ranked:{id:'ranked',nome:'Trade kill',bpm:110,compassos:18,tema:'trap',faixas:2,partitura:partituraRanked,desenhar:desenharDuo,
      teclas:{KeyF:0,KeyJ:1},rotulos:['F','J'],teclasTxt:['F','J'],nomes:par.map(p=>p.nome),
      desc:`Entrada e trade. Cada trilha é um jogador da dupla${par.length===2?` (<b>${esc(par[0].nome)}</b> e <b>${esc(par[1].nome)}</b>)`:''}: um entra, o outro troca logo atrás.`,
      ponto:n=>({x:150,y:n.l?310:160})},
    stream:{id:'stream',nome:'Hype do chat',bpm:120,compassos:18,tema:'house',faixas:1,partitura:partituraStream,desenhar:desenharStream,
      teclas:{Space:0},rotulos:['ESPAÇO'],teclasTxt:['Espaço'],cliqueTecla:0,tag:t.tag,
      emotes:['GG','HYPE','KKK','CLUTCH','ACE','POG','EZ','GOAT'],
      chat:[['fã_do_'+t.tag.toLowerCase(),'BORAAAA'],['lurker99','que mira'],['mod','sem spoiler no chat'],['ana_val','ACE ACE ACE'],['kkkk_br','KKKKKKK'],
        ['radiante_br','esse time vai longe'],['nerdola','e o meta?'],['torcida','vamo ganhar o masters'],['viewer42','hype train!!'],['mãe_do_igl','orgulho']],
      desc:'O time na live. Aperte no tempo dos emotes e segure no <b>hype train</b> para o chat explodir.',
      ponto:()=>({x:170,y:280})},
    jantar:{id:'jantar',nome:'Brinde',bpm:96,compassos:16,tema:'lounge',faixas:1,partitura:partituraJantar,desenhar:desenharJantar,
      mouse:true,raio:40,teclasTxt:['Mouse'],
      desc:'Jantar do time. Clique em cada prato quando o anel vermelho fechar sobre ele.',
      ponto:n=>({x:n.x,y:n.y-46})},
    sessao:{id:'sessao',nome:'Respiração',bpm:72,compassos:14,tema:'calmo',faixas:1,partitura:partituraSessao,desenhar:desenharRespira,
      teclas:{Space:0},rotulos:['ESPAÇO'],teclasTxt:['Espaço'],cliqueTecla:0,
      desc:'Com o preparador mental: aperte quando a barra chegar, <b>segure</b> e <b>solte</b> exatamente no fim dela.',
      ponto:(n,c,f)=>({x:160,y:420})},
    folga:{id:'folga',nome:'Dança da folga',bpm:112,compassos:18,tema:'funk',faixas:4,partitura:partituraFolga,desenhar:desenharDanca,
      teclas:{ArrowLeft:0,ArrowUp:1,ArrowDown:2,ArrowRight:3,KeyA:0,KeyW:1,KeyS:2,KeyD:3},rotulos:['←','↑','↓','→'],teclasTxt:['←','↑','↓','→'],
      desc:'Folga com festa. Um compasso <b>mostra e toca</b> a sequência; no seguinte você repete com as setas.',
      ponto:n=>({x:MG_W/2-2*96+n.l*96+48,y:150})}
  };
}
function abrirRitmo(){
  const t=meu();
  const id=t.atividade;
  const J=jogosRitmo(t)[id];
  if(!J){flash('Escolha uma atividade da semana primeiro.');return;}
  const a=atividade(id);
  abrirMinigame({
    id:'ritmo-'+id,titulo:J.nome,eyebrow:'Vestiário · '+a.nome,
    desc:J.desc,
    controles:J.teclasTxt,
    arte:()=>`<svg viewBox="0 0 200 120">${[0,1,2,3,4,5,6].map(i=>`<rect x="${70+i*18}" y="${60-[20,34,48,30,42,24,36][i]}" width="10" height="${[20,34,48,30,42,24,36][i]*2}" rx="3" fill="${['#FF4655','#E2B45A','#18E5B4','#4C8DFF'][i%4]}" opacity=".7"/>`).join('')}</svg>`,
    vale:()=>ritmoDisponivel(t),
    efeitoTxt:()=>`A atividade <b>${esc(a.nome)}</b> rende de <b class="dn">${Math.round(ATIV_MIN*100)}%</b> a <b class="up">${Math.round(ATIV_MAX*100)}%</b> nesta semana, conforme a sua nota.`,
    efeitoFeito:res=>{const f=fatorAtividade(res.nota);return `<b>${esc(a.nome)}</b> rende <b class="${f>=1?'up':'dn'}">${Math.round(f*100)}%</b> nesta semana.`;},
    comissao:()=>{t.miniAtividade={id,comissao:true,nota:null,ano:G.ano,semana:G.semana||1};},
    dica:()=>J.mouse?'Clique no prato quando o anel fechar.':'Teclas: '+J.teclasTxt.join(' ')+(J.cliqueTecla!=null?' (ou clique)':''),
    registrar:(res,vale)=>{
      if(vale){const r=registrarRitmo(t,res);return r?r.bateu:null;}
      return registrarRecordeMini('ritmo-'+id,res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarRitmo(ctx,J,fim)
  });
}
/* faixa na tela do Vestiário, embaixo das atividades */
function faixaRitmo(t){
  if(typeof minigamesLigados==='function'&&!minigamesLigados())return '';
  const id=t.atividade||'nenhuma';
  const J=jogosRitmo(t)[id];
  const m=t.miniAtividade;
  if(!J)return `<div class="mg-faixa dim">${ico('info')}<span>Cada atividade tem um jogo de ritmo que muda a força dela na semana. Escolha uma para jogar.</span></div>`;
  let txt;
  if(m&&m.comissao)txt='A comissão conduziu a atividade desta semana.';
  else if(m&&m.id!==id)txt=`A sessão desta semana foi do <b>${esc(atividade(m.id).nome)}</b>; trocando de atividade, ela não conta.`;
  else if(m){const f=fatorAtividade(m.nota),med=medalhaMini(m.nota);
    txt=`<span class="mg-chip" style="--m:${med.cor}">${esc(med.nome)} · ${Math.round(m.nota*100)}</span> ${esc(atividade(id).nome)} rende <b class="${f>=1?'up':'dn'}">${Math.round(f*100)}%</b> nesta semana`;}
  else txt=`<b>${esc(J.nome)}</b> · jogo de ritmo da atividade. Rende de ${Math.round(ATIV_MIN*100)}% a ${Math.round(ATIV_MAX*100)}%.`;
  const rec=recordeMini('ritmo-'+id).geral;
  return `<div class="mg-faixa"><span class="mg-faixa-ic">${ico('jogar')}</span><span class="mg-faixa-t">${txt}${rec?` <span class="dim">· recorde ${rec.pts}</span>`:''}</span>
    <button class="btn sm ${m?'ghost':''}" data-ritmo>${m?'Treino livre':'Jogar'}</button></div>`;
}
