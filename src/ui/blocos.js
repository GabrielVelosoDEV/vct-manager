/* ============================================================
   BLOCOS DO IGL — o minigame de encaixar peças
   ------------------------------------------------------------
   O IGL monta as jogadas e o time encaixa: cada linha completa é uma
   call que deu certo. Regras de Tetris clássicas — sete peças em saco,
   peça fantasma, guardar peça, três próximas, queda rápida e direta,
   nível sobe a cada 6 linhas — numa sessão de 100 segundos.
   A nota sai das linhas (o tetris de 4 linhas vale 3 a mais) e mexe no
   entrosamento do IGL com cada titular na semana (core/minigames.js).
   ============================================================ */
const BL_COL=10,BL_LIN=20,BL_TAM=24,BL_SEG=100,BL_ALVO=26;
const BL_PECAS={
  I:{cor:'#18E5B4',m:[[0,1],[1,1],[2,1],[3,1]],n:4},
  O:{cor:'#E2B45A',m:[[1,0],[2,0],[1,1],[2,1]],n:4},
  T:{cor:'#9B6BFF',m:[[1,0],[0,1],[1,1],[2,1]],n:3},
  S:{cor:'#7DDB4F',m:[[1,0],[2,0],[0,1],[1,1]],n:3},
  Z:{cor:'#FF4655',m:[[0,0],[1,0],[1,1],[2,1]],n:3},
  J:{cor:'#4C8DFF',m:[[0,0],[0,1],[1,1],[2,1]],n:3},
  L:{cor:'#FF8A3D',m:[[2,0],[0,1],[1,1],[2,1]],n:3}
};
function girarBloco(cel,n,dir){return cel.map(([x,y])=>dir>0?[n-1-y,x]:[y,n-1-x]);}

function abrirBlocos(){
  const t=meu();
  const igl=t.igl&&G.jogadores[t.igl];
  if(!igl){flash('Escolha um IGL no Elenco primeiro.');return;}
  abrirMinigame({
    id:'igl',titulo:'Blocos do IGL',eyebrow:'Vestiário · '+igl.nome,
    desc:`<b>${esc(igl.nome)}</b> monta as jogadas e o time encaixa. Cada linha completa é uma call que funcionou. São ${BL_SEG} segundos; ${BL_ALVO} linhas valem nota 100, e cada tetris (4 linhas de uma vez) conta 3 linhas a mais.`,
    controles:['←','→','↑ gira','Z','↓','Espaço','C guarda'],
    arte:()=>`<svg viewBox="0 0 200 120">${[[120,30,'#18E5B4'],[144,30,'#18E5B4'],[168,30,'#18E5B4'],[120,54,'#9B6BFF'],[144,54,'#9B6BFF'],[168,54,'#E2B45A'],[144,78,'#FF4655'],[168,78,'#E2B45A']].map(([x,y,c])=>`<rect x="${x}" y="${y}" width="22" height="22" rx="3" fill="${c}" opacity=".8"/>`).join('')}</svg>`,
    vale:()=>iglDisponivel(t),
    efeitoTxt:()=>`Mexe no entrosamento de <b>${esc(igl.nome)}</b> com cada titular nesta semana: de <b class="dn">${IGL_MIN.toFixed(1).replace('.',',')}</b> a <b class="up">+${IGL_MAX.toFixed(1).replace('.',',')}</b> por dupla.`,
    efeitoFeito:res=>{const d=deltaIGL(res.nota);return `<b class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d.toFixed(1).replace('.',',')}</b> no entrosamento de <b>${esc(igl.nome)}</b> com cada titular nesta semana.`;},
    comissao:()=>{t.miniIGL={igl:t.igl,comissao:true,nota:null,ano:G.ano,semana:G.semana||1};},
    dica:()=>'← → movem · ↑ ou X gira · Z gira ao contrário · ↓ desce · Espaço solta · C guarda a peça',
    registrar:(res,vale)=>{
      if(vale){const r=registrarIGL(t,res);return r?r.bateu:null;}
      return registrarRecordeMini('igl',res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarBlocos(ctx,fim,igl)
  });
}

function jogarBlocos(ctx,fim,igl){
  const cx=ctx.cx,ox=MG_W/2-BL_COL*BL_TAM/2,oy=(MG_H-BL_LIN*BL_TAM)/2;
  const grade=Array.from({length:BL_LIN},()=>Array(BL_COL).fill(null));
  let saco=[],fila=[],guardada=null,podeGuardar=true,peca=null;
  let pts=0,linhas=0,tetris=0,nivel=1,combo=-1,b2b=false,maxCombo=0;
  let queda=0,travaT=0,travaMov=0,limpando=null,fimJa=false,tempo=0;
  const fx=efeitosRange(),avisos=[];
  const foto=new Image();let fotoOk=false;foto.onload=()=>{fotoOk=true;};foto.src=ASSETS.foto(igl);
  const tirar=()=>{if(!saco.length)saco=Object.keys(BL_PECAS).sort(()=>Math.random()-0.5);return saco.pop();};
  while(fila.length<4)fila.push(tirar());
  const nova=tipo=>{const P=BL_PECAS[tipo];return{tipo,cel:P.m.map(c=>c.slice()),n:P.n,x:tipo==='O'?3:3,y:tipo==='I'?-1:0};};
  const cabe=(p,dx,dy,cel)=>(cel||p.cel).every(([x,y])=>{const X=p.x+x+dx,Y=p.y+y+dy;
    return X>=0&&X<BL_COL&&Y<BL_LIN&&(Y<0||!grade[Y][X]);});
  const proxima=()=>{peca=nova(fila.shift());fila.push(tirar());podeGuardar=true;travaT=0;travaMov=0;
    if(!cabe(peca,0,0))acabar(true);};
  const fantasma=()=>{let d=0;while(cabe(peca,0,d+1))d++;return d;};
  const fixar=()=>{
    for(const [x,y] of peca.cel){const Y=peca.y+y;if(Y<0){acabar(true);return;}grade[Y][peca.x+x]=BL_PECAS[peca.tipo].cor;}
    somMini('corpo');
    const cheias=[];for(let y=0;y<BL_LIN;y++)if(grade[y].every(Boolean))cheias.push(y);
    if(cheias.length){
      const n=cheias.length;
      combo++;maxCombo=Math.max(maxCombo,combo);
      const base=[0,100,300,500,800][n]*nivel*(n===4&&b2b?1.5:1);
      pts+=Math.round(base+(combo>0?50*combo*nivel:0));
      b2b=n===4;linhas+=n;if(n===4)tetris++;
      nivel=1+Math.floor(linhas/6);
      limpando={linhas:cheias,t:0};
      somMini(n===4?'cabeca':'corpo');
      const txt=n===4?'TETRIS!':n===3?'TRIPLA':n===2?'DUPLA':'CALL CERTA';
      avisos.length=0;avisos.push({txt:txt+(combo>0?' · COMBO '+(combo+1):''),cor:n===4?'#E2B45A':'#18E5B4',vida:1});
      for(const y of cheias)for(let x=0;x<BL_COL;x+=2)fx.faisca(ox+x*BL_TAM+BL_TAM,oy+y*BL_TAM+BL_TAM/2,n===4?'#E2B45A':'#ECE8E1',3);
    }else{combo=-1;proxima();}
  };
  const mover=dx=>{if(peca&&!limpando&&cabe(peca,dx,0)){peca.x+=dx;if(travaT>0&&travaMov<15){travaT=0;travaMov++;}return true;}return false;};
  const girar=dir=>{
    if(!peca||limpando||peca.tipo==='O')return;
    const cel=girarBloco(peca.cel,peca.n,dir);
    for(const [kx,ky] of [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[0,1]])
      if(cabe(peca,kx,ky,cel)){peca.cel=cel;peca.x+=kx;peca.y+=ky;if(travaT>0&&travaMov<15){travaT=0;travaMov++;}somMini('tiro');return;}
  };
  const derrubar=()=>{if(!peca||limpando)return;const d=fantasma();peca.y+=d;pts+=d*2;fixar();};
  const guardar=()=>{if(!peca||limpando||!podeGuardar)return;const tp=peca.tipo;
    if(guardada){peca=nova(guardada);}else{proxima();}guardada=tp;podeGuardar=false;};
  /* teclado, com repetição ao segurar (DAS) */
  const segura={};
  const tecla=e=>{
    if(!ctx.vivo()){limpar();return;}
    const k=e.code;
    const usadas=['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyX','KeyZ','KeyC','ShiftLeft','KeyA','KeyD','KeyS','KeyW'];
    if(!usadas.includes(k))return;
    e.preventDefault();
    if(e.type==='keyup'){delete segura[k];return;}
    if(e.repeat)return;
    if(k==='ArrowLeft'||k==='KeyA'){mover(-1);segura[k]={t:0,dx:-1};}
    else if(k==='ArrowRight'||k==='KeyD'){mover(1);segura[k]={t:0,dx:1};}
    else if(k==='ArrowDown'||k==='KeyS'){segura[k]={t:0,baixo:true};}
    else if(k==='ArrowUp'||k==='KeyX'||k==='KeyW')girar(1);
    else if(k==='KeyZ')girar(-1);
    else if(k==='Space')derrubar();
    else if(k==='KeyC'||k==='ShiftLeft')guardar();
  };
  const limpar=()=>{window.removeEventListener('keydown',tecla,true);window.removeEventListener('keyup',tecla,true);};
  window.addEventListener('keydown',tecla,true);window.addEventListener('keyup',tecla,true);
  ctx.cv.style.cursor='default';
  if(MG)MG.blocos={get peca(){return peca;},grade,mover,girar,derrubar,fantasma,cabe};   /* para os testes */

  const acabar=(topo)=>{
    if(fimJa)return;fimJa=true;limpar();
    const nota=clamp((linhas+2*tetris)/BL_ALVO,0,1);
    fim({nota,pts,modo:'igl',modoNome:igl.nome,
      frase:nota>=0.93?'Jogadas de campeão mundial':nota>=0.8?'IGL em noite inspirada':nota>=0.6?'Calls bem encaixadas':nota>=0.35?'Algumas calls se perderam':(topo?'O time travou':'Comunicação truncada'),
      stats:[['Pontos',pts],['Linhas',linhas],['Tetris',tetris],['Nível',nivel],['Maior combo',Math.max(0,maxCombo)],['Tempo',Math.round(Math.min(tempo,BL_SEG))+' s']]});
  };
  proxima();

  const cel=(x,y,cor,alfa,tam)=>{
    tam=tam||BL_TAM;
    cx.globalAlpha=alfa==null?1:alfa;
    cx.fillStyle=cor;cx.fillRect(x+1,y+1,tam-2,tam-2);
    cx.fillStyle='rgba(255,255,255,.28)';cx.fillRect(x+1,y+1,tam-2,3);cx.fillRect(x+1,y+1,3,tam-2);
    cx.fillStyle='rgba(0,0,0,.28)';cx.fillRect(x+1,y+tam-4,tam-2,3);cx.fillRect(x+tam-4,y+1,3,tam-2);
    cx.globalAlpha=1;
  };
  const miniPeca=(tipo,x,y,tam)=>{if(!tipo)return;const P=BL_PECAS[tipo];
    const xs=P.m.map(c=>c[0]),ys=P.m.map(c=>c[1]);const w=(Math.max(...xs)-Math.min(...xs)+1)*tam,h=(Math.max(...ys)-Math.min(...ys)+1)*tam;
    for(const [a,b] of P.m)cel(x-w/2+(a-Math.min(...xs))*tam,y-h/2+(b-Math.min(...ys))*tam,P.cor,1,tam);};
  const painel=(x,y,w,h,tit)=>{cx.fillStyle='rgba(11,18,24,.85)';cx.fillRect(x,y,w,h);cx.strokeStyle='rgba(255,255,255,.08)';cx.strokeRect(x+.5,y+.5,w-1,h-1);
    cx.fillStyle='rgba(236,232,225,.5)';cx.font='700 10px Inter, sans-serif';cx.textAlign='left';cx.fillText(tit,x+12,y+18);};

  let ult=performance.now();
  const quadro=agoraMs=>{
    if(!ctx.vivo()){limpar();return;}
    if(fimJa)return;
    const dt=Math.min(0.05,(agoraMs-ult)/1000);ult=agoraMs;tempo+=dt;
    if(tempo>=BL_SEG){acabar(false);return;}
    /* lógica */
    if(limpando){limpando.t+=dt;
      if(limpando.t>0.22){for(const y of limpando.linhas.sort((a,b)=>a-b)){grade.splice(y,1);grade.unshift(Array(BL_COL).fill(null));}
        limpando=null;proxima();}}
    else if(peca){
      for(const k in segura){const s=segura[k];s.t+=dt;
        if(s.dx&&s.t>0.16){while(s.t>0.16+0.045){s.t-=0.045;mover(s.dx);}}
        if(s.baixo){while(s.t>0.035){s.t-=0.035;if(cabe(peca,0,1)){peca.y++;pts+=1;queda=0;}}}}
      const intervalo=Math.max(0.07,0.8*Math.pow(0.84,nivel-1));
      queda+=dt;
      while(queda>=intervalo){queda-=intervalo;if(cabe(peca,0,1))peca.y++;else break;}
      if(!cabe(peca,0,1)){travaT+=dt;if(travaT>=0.5){fixar();}}else travaT=0;
    }
    /* desenho */
    const g=cx.createLinearGradient(0,0,0,MG_H);g.addColorStop(0,'#0B1218');g.addColorStop(1,'#101823');cx.fillStyle=g;cx.fillRect(0,0,MG_W,MG_H);
    /* fundo: quadro tático */
    cx.strokeStyle='rgba(255,255,255,.035)';cx.lineWidth=1;
    for(let x=0;x<MG_W;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,MG_H);cx.stroke();}
    for(let y=0;y<MG_H;y+=32){cx.beginPath();cx.moveTo(0,y);cx.lineTo(MG_W,y);cx.stroke();}
    cx.strokeStyle='rgba(255,70,85,.12)';cx.lineWidth=2;cx.setLineDash([8,8]);
    cx.beginPath();cx.moveTo(60,480);cx.quadraticCurveTo(200,260,300,120);cx.stroke();
    cx.beginPath();cx.moveTo(900,470);cx.quadraticCurveTo(760,300,700,140);cx.stroke();cx.setLineDash([]);
    /* tabuleiro */
    cx.fillStyle='rgba(5,9,13,.85)';cx.fillRect(ox-6,oy-6,BL_COL*BL_TAM+12,BL_LIN*BL_TAM+12);
    cx.strokeStyle='rgba(24,229,180,.45)';cx.lineWidth=2;cx.strokeRect(ox-6,oy-6,BL_COL*BL_TAM+12,BL_LIN*BL_TAM+12);
    cx.strokeStyle='rgba(255,255,255,.04)';cx.lineWidth=1;
    for(let x=1;x<BL_COL;x++){cx.beginPath();cx.moveTo(ox+x*BL_TAM,oy);cx.lineTo(ox+x*BL_TAM,oy+BL_LIN*BL_TAM);cx.stroke();}
    for(let y=1;y<BL_LIN;y++){cx.beginPath();cx.moveTo(ox,oy+y*BL_TAM);cx.lineTo(ox+BL_COL*BL_TAM,oy+y*BL_TAM);cx.stroke();}
    for(let y=0;y<BL_LIN;y++)for(let x=0;x<BL_COL;x++){const c=grade[y][x];if(!c)continue;
      const lp=limpando&&limpando.linhas.includes(y);
      cel(ox+x*BL_TAM,oy+y*BL_TAM,lp?'#ECE8E1':c,lp?1-limpando.t/0.22*0.6:1);}
    if(peca&&!limpando){
      const d=fantasma(),cor=BL_PECAS[peca.tipo].cor;
      for(const [x,y] of peca.cel){const Y=peca.y+y+d;if(Y>=0){cx.strokeStyle=cor;cx.globalAlpha=0.45;cx.lineWidth=2;
        cx.strokeRect(ox+(peca.x+x)*BL_TAM+3,oy+Y*BL_TAM+3,BL_TAM-6,BL_TAM-6);cx.globalAlpha=1;}}
      for(const [x,y] of peca.cel){const Y=peca.y+y;if(Y>=0)cel(ox+(peca.x+x)*BL_TAM,oy+Y*BL_TAM,cor);}
    }
    /* painel do IGL */
    painel(70,60,250,180,'IGL');
    if(fotoOk){cx.save();cx.beginPath();cx.rect(86,84,70,88);cx.clip();cx.drawImage(foto,86,84,70,88);cx.restore();}
    else{cx.fillStyle='#16222E';cx.fillRect(86,84,70,88);}
    cx.strokeStyle='rgba(226,180,90,.6)';cx.strokeRect(86,84,70,88);
    cx.fillStyle='#ECE8E1';cx.font='400 26px "Bebas Neue", Impact, sans-serif';cx.textAlign='left';cx.fillText(igl.nome,170,108);
    cx.fillStyle='rgba(236,232,225,.6)';cx.font='12px Inter, sans-serif';cx.fillText('calls certas',170,134);
    cx.fillStyle='#18E5B4';cx.font='400 40px "Bebas Neue", Impact, sans-serif';cx.fillText(String(linhas),170,172);
    cx.fillStyle='rgba(236,232,225,.6)';cx.font='12px Inter, sans-serif';cx.fillText('nível '+nivel+(tetris?' · '+tetris+' tetris':''),86,220);
    painel(70,262,250,90,'GUARDADA (C)');miniPeca(guardada,195,318,20);
    if(!podeGuardar&&guardada){cx.fillStyle='rgba(5,9,13,.6)';cx.fillRect(71,280,248,71);}
    /* próximas */
    painel(MG_W-320,60,250,292,'PRÓXIMAS');
    fila.slice(0,3).forEach((tp,i)=>miniPeca(tp,MG_W-195,120+i*80,i?18:22));
    /* barra de nota */
    const k=clamp((linhas+2*tetris)/BL_ALVO,0,1);
    painel(MG_W-320,372,250,70,'RUMO À NOTA 100');
    cx.fillStyle='rgba(255,255,255,.08)';cx.fillRect(MG_W-306,404,222,10);
    cx.fillStyle='#18E5B4';cx.fillRect(MG_W-306,404,222*k,10);
    cx.fillStyle='#ECE8E1';cx.font='600 12px JetBrains Mono, monospace';cx.textAlign='right';cx.fillText(Math.round(k*100)+'',MG_W-84,432);
    fx.passo(cx,dt);
    for(let i=avisos.length-1;i>=0;i--){const a=avisos[i];a.vida-=dt;if(a.vida<=0){avisos.splice(i,1);continue;}
      cx.globalAlpha=Math.min(1,a.vida*2);cx.fillStyle=a.cor;cx.font='400 38px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';
      cx.fillText(a.txt,MG_W/2,oy+150-(1-a.vida)*40);cx.globalAlpha=1;}
    hudRange(ctx,{restante:1-tempo/BL_SEG,pts,rot2:'linhas',v2:linhas,combo:combo>0?combo+1:0});
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* faixa no Vestiário */
function faixaBlocos(t){
  if(typeof minigamesLigados==='function'&&!minigamesLigados())return '';
  const igl=t.igl&&G.jogadores[t.igl];
  if(!igl)return `<div class="mg-faixa dim">${ico('info')}<span><b>Blocos do IGL</b>: escolha um IGL no Elenco para jogar.</span></div>`;
  const m=t.miniIGL;let txt;
  if(m&&m.comissao)txt='A comissão conduziu a reunião tática desta semana.';
  else if(m){const d=deltaIGL(m.nota),med=medalhaMini(m.nota);
    txt=`<span class="mg-chip" style="--m:${med.cor}">${esc(med.nome)} · ${Math.round(m.nota*100)}</span> <b class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d.toFixed(1).replace('.',',')}</b> no entrosamento de ${esc(G.jogadores[m.igl]?G.jogadores[m.igl].nome:igl.nome)} com cada titular`;}
  else txt=`<b>Blocos do IGL</b> · ${esc(igl.nome)} monta as jogadas. De ${IGL_MIN.toFixed(1).replace('.',',')} a +${IGL_MAX.toFixed(1).replace('.',',')} por dupla com os titulares.`;
  const rec=recordeMini('igl').geral;
  return `<div class="mg-faixa igl"><span class="mg-faixa-ic">${ico('pecas')}</span><span class="mg-faixa-t">${txt}${rec?` <span class="dim">· recorde ${rec.pts}</span>`:''}</span>
    <button class="btn sm ${m?'ghost':''}" data-blocos>${m?'Treino livre':'Jogar'}</button></div>`;
}
