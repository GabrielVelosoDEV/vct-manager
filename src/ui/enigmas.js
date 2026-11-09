/* ============================================================
   ENIGMAS TÁTICOS — quebra-cabeças de estudo do mapa
   ------------------------------------------------------------
   Três enigmas em sequência, 150 segundos para os três:
     1. Leitura do adversário — pelas pistas do analista, descubra onde
        cada função do outro time joga (dedução, solução única);
     2. Smokes no bomb — cada smoke cobre a casa e as vizinhas, e tira
        a fumaça de quem já tinha; cubra o bomb inteiro;
     3. O mapa embaralhado — monte a imagem do mapa deslizando as peças.
   A nota vira estudo extra do mapa escolhido no fim da semana
   (core/minigames.js). Tudo aqui é Math.random: nada mexe no motor.
   ============================================================ */
const EN_TEMPO=150;
const EN_FUNCOES=[['Duelista','#FF4655'],['Iniciador','#E2B45A'],['Controlador','#18E5B4'],['Sentinela','#4C8DFF']];
const EN_LUGARES=['Bomb A','Bomb B','Meio','Fundo'];

/* ---------- 1. leitura do adversário: pistas com solução única ---------- */
function _permutacoes(n){const out=[];const r=(a,u)=>{if(a.length===n){out.push(a.slice());return;}
  for(let i=0;i<n;i++)if(!u[i]){u[i]=1;a.push(i);r(a,u);a.pop();u[i]=0;}};r([],[]);return out;}
function gerarLeitura(){
  const todas=_permutacoes(4);
  const sol=todas[(Math.random()*todas.length)|0];   /* sol[função] = lugar */
  const F=i=>'o '+EN_FUNCOES[i][0],L=j=>EN_LUGARES[j]==='Meio'?'no Meio':EN_LUGARES[j]==='Fundo'?'no Fundo':'no '+EN_LUGARES[j];
  const cand=[];
  for(let f=0;f<4;f++)for(let l=0;l<4;l++){
    if(sol[f]!==l)cand.push({p:3,txt:`${_cap(F(f))} não está ${L(l)}.`,ok:s=>s[f]!==l});
  }
  for(let f=0;f<4;f++){
    const bomb=sol[f]<2;
    cand.push({p:2,txt:`${_cap(F(f))} ${bomb?'está em um dos bombs':'não está em nenhum bomb'}.`,ok:s=>(s[f]<2)===bomb});
    for(let g=f+1;g<4;g++){
      if(sol[f]<2&&sol[g]<2)cand.push({p:2,txt:`${_cap(F(f))} e ${F(g)} seguram os dois bombs.`,ok:s=>s[f]<2&&s[g]<2});
      const a=sol[f],b=sol[g],l1=Math.min(a,b),l2=Math.max(a,b);
      cand.push({p:1,txt:`${_cap(F(f))} e ${F(g)} estão ${L(l1).replace(/^no /,'no ')} e ${L(l2)}, não necessariamente nessa ordem.`,
        ok:s=>[s[f],s[g]].sort().join()===[l1,l2].join()});
    }
    cand.push({p:0,txt:`${_cap(F(f))} está ${L(sol[f])}.`,ok:s=>s[f]===sol[f]});
  }
  /* embaralha por prioridade (pistas indiretas primeiro) */
  cand.sort((a,b)=>b.p-a.p||Math.random()-0.5);
  /* pistas indiretas misturadas; as diretas ("está no A") só no fim, se faltar */
  const mist=k=>cand.filter(c=>k.includes(c.p)).sort(()=>Math.random()-0.5);
  const ordem=[...mist([2,3]),...mist([1]),...mist([0])];
  const resta=pistas=>todas.filter(s=>pistas.every(c=>c.ok(s)));
  let pistas=[];
  for(const c of ordem){if(resta(pistas).length<=1)break;
    if(resta([...pistas,c]).length<resta(pistas).length)pistas.push(c);}
  /* tira o que sobrou de redundante */
  for(let i=pistas.length-1;i>=0;i--){const sem=pistas.filter((_,k)=>k!==i);if(resta(sem).length===1)pistas=sem;}
  /* menos de quatro pistas vira chute; completa com pistas verdadeiras simples */
  for(const c of mist([2,3])){if(pistas.length>=4)break;if(!pistas.includes(c))pistas.push(c);}
  return{sol,pistas:pistas.sort(()=>Math.random()-0.5),atrib:[null,null,null,null],erros:0,feito:false};
}
function _cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

/* ---------- 2. smokes (luzes apagadas) ---------- */
function gerarSmokes(){
  const N=5,g=Array.from({length:N},()=>Array(N).fill(true));
  const toca=(g,x,y)=>{for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<N&&Y<N)g[Y][X]=!g[Y][X];}};
  const k=5,usadas=new Set();
  while(usadas.size<k){const c=(Math.random()*N*N)|0;if(usadas.has(c))continue;usadas.add(c);toca(g,c%N,(c/N)|0);}
  if(g.every(r=>r.every(Boolean)))return gerarSmokes();
  return{N,g,ini:g.map(r=>r.slice()),toca,k,jogadas:0,feito:false};
}
/* ---------- 3. mapa embaralhado (8 peças) ---------- */
function gerarDeslize(){
  const p=[0,1,2,3,4,5,6,7,8];let vazio=8,ant=-1;
  const viz=i=>[i-3,i+3,(i%3)?i-1:-1,(i%3<2)?i+1:-1].filter(j=>j>=0&&j<9);
  for(let n=0;n<34;n++){const op=viz(vazio).filter(j=>j!==ant);const j=op[(Math.random()*op.length)|0];
    [p[vazio],p[j]]=[p[j],p[vazio]];ant=vazio;vazio=j;}
  if(p.every((v,i)=>v===i))return gerarDeslize();
  return{p,viz,jogadas:0,feito:false,anim:null};
}

function abrirEnigmas(mapa){
  const t=meu();
  abrirMinigame({
    id:'enigmas',titulo:'Enigmas táticos',eyebrow:'Preparo · '+mapa,
    desc:`Três enigmas de estudo do <b>${esc(mapa)}</b> em ${EN_TEMPO} segundos: a leitura do adversário pelas pistas do analista, as smokes do bomb e o mapa embaralhado.`,
    controles:['Mouse'],
    arte:()=>`<svg viewBox="0 0 200 120"><rect x="110" y="20" width="80" height="80" fill="none" stroke="rgba(24,229,180,.5)" stroke-width="2"/>
      <path d="M110 47h80M110 73h80M137 20v80M163 20v80" stroke="rgba(24,229,180,.35)"/><text x="150" y="70" text-anchor="middle" font-size="44" font-family="Bebas Neue,Impact" fill="#FF4655">?</text></svg>`,
    vale:()=>enigmaDisponivel(t),
    efeitoTxt:()=>`Vira estudo extra do <b>${esc(mapa)}</b> no fim da semana: até <b class="up">${Math.round(ENIG_MAX*100)}%</b> de uma semana inteira de treino dedicada ao mapa. Não cansa ninguém.`,
    efeitoFeito:res=>`<b class="up">${Math.round(ENIG_MAX*res.nota*100)}%</b> de uma semana de treino no <b>${esc(mapa)}</b>, aplicado no fim da semana.`,
    comissao:()=>{t.miniMapa={mapa,comissao:true,nota:null,ano:G.ano,semana:G.semana||1};},
    dica:()=>'Clique para jogar. "Pular" passa para o próximo enigma (esse vale zero).',
    registrar:(res,vale)=>{
      if(vale){const r=registrarEnigma(t,mapa,res);return r?r.bateu:null;}
      return registrarRecordeMini('enigmas',res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarEnigmas(ctx,fim,mapa)
  });
}

function jogarEnigmas(ctx,fim,mapa){
  const cx=ctx.cx,cv=ctx.cv;
  const E=[{id:'leitura',nome:'Leitura do adversário',inst:'Pelas pistas do analista, marque onde cada função joga e confirme.',s:gerarLeitura()},
           {id:'smokes',nome:'Smokes no bomb',inst:'Cada smoke cobre a casa e as quatro vizinhas — e tira a fumaça de quem já tinha. Cubra o bomb inteiro.',s:gerarSmokes()},
           {id:'deslize',nome:'O mapa embaralhado',inst:'Clique numa peça ao lado do espaço vazio para deslizar. Monte a imagem do mapa.',s:gerarDeslize()}];
  const notas=[0,0,0];let atual=0,tempo=0,fimJa=false,bts=[],aviso=null,brilho=0;
  const fx=efeitosRange();
  const img=new Image();let imgOk=false;img.onload=()=>{imgOk=true;};img.src=ASSETS.mapa(mapa);
  if(MG)MG.enigmas={E,get atual(){return atual;}};   /* para os testes */
  cv.style.cursor='default';
  const botao=(x,y,w,h,rot,acao,tipo)=>{bts.push({x,y,w,h,acao});
    cx.fillStyle=tipo==='p'?'#FF4655':'rgba(255,255,255,.05)';cx.fillRect(x,y,w,h);
    cx.strokeStyle=tipo==='p'?'#FF4655':'rgba(255,255,255,.2)';cx.strokeRect(x+.5,y+.5,w-1,h-1);
    cx.fillStyle='#ECE8E1';cx.font='700 12px Inter, sans-serif';cx.textAlign='center';cx.fillText(rot.toUpperCase(),x+w/2,y+h/2+4);};
  const texto=(txt,x,y,larg,alt)=>{const pal=txt.split(' ');let linha='',yy=y;
    for(const p of pal){const t2=linha?linha+' '+p:p;if(cx.measureText(t2).width>larg){cx.fillText(linha,x,yy);linha=p;yy+=alt;}else linha=t2;}
    if(linha)cx.fillText(linha,x,yy);return yy+alt;};
  const resolveu=(i,nota,msg)=>{notas[i]=nota;E[i].s.feito=true;somMini('cabeca');brilho=1;
    aviso={txt:msg||'RESOLVIDO',cor:'#18E5B4',vida:1.1};
    for(let k=0;k<26;k++)fx.faisca(480+Math.random()*400-200,300+Math.random()*200-100,'#18E5B4',1);
    setTimeout(()=>{if(!fimJa){atual++;if(atual>=E.length)acabar();}},900);};
  const pular=()=>{somMini('erro');aviso={txt:'PULOU',cor:'#E8A33D',vida:0.8};atual++;if(atual>=E.length)acabar();};
  const acabar=()=>{
    if(fimJa)return;fimJa=true;
    const restante=Math.max(0,EN_TEMPO-tempo);
    const media=notas.reduce((a,b)=>a+b,0)/notas.length;
    const nota=clamp(media+0.1*restante/EN_TEMPO*(media>0?1:0),0,1);
    fim({nota,pts:Math.round(nota*1000+restante*4),modo:'enigmas',modoNome:mapa,
      frase:nota>=0.93?'Leitura de analista sênior':nota>=0.8?'Cabeça tática afiada':nota>=0.6?'Bom estudo de mapa':nota>=0.35?'Estudo pela metade':'Os enigmas venceram hoje',
      stats:[['Leitura',notas[0]?Math.round(notas[0]*100):'—'],['Smokes',notas[1]?Math.round(notas[1]*100):'—'],['Mapa',notas[2]?Math.round(notas[2]*100):'—'],['Tempo restante',Math.round(restante)+' s']]});
  };
  cv.onpointerdown=e=>{
    if(fimJa)return;const p=ctx.pos(e);
    for(const b of bts)if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){b.acao(p);return;}
    clicar(p);
  };
  cv.onpointermove=e=>{const p=ctx.pos(e);cv.style.cursor=bts.some(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)||_sobreJogo(p)?'pointer':'default';};
  /* geometria de cada enigma (a mesma para desenhar e clicar) */
  const GL={x0:520,y0:150,cw:96,ch:66};                 /* leitura */
  const GS={x0:560,y0:120,c:66};                         /* smokes */
  const GD={x0:520,y0:100,c:120};                        /* deslize */
  const _sobreJogo=p=>{const e=E[atual];if(!e||e.s.feito)return false;
    if(e.id==='leitura')return p.x>=GL.x0&&p.x<GL.x0+4*GL.cw&&p.y>=GL.y0&&p.y<GL.y0+4*GL.ch;
    if(e.id==='smokes')return p.x>=GS.x0&&p.x<GS.x0+5*GS.c&&p.y>=GS.y0&&p.y<GS.y0+5*GS.c;
    return p.x>=GD.x0&&p.x<GD.x0+3*GD.c&&p.y>=GD.y0&&p.y<GD.y0+3*GD.c;};
  const clicar=p=>{
    const e=E[atual];if(!e||e.s.feito)return;const s=e.s;
    if(e.id==='leitura'){
      const c=Math.floor((p.x-GL.x0)/GL.cw),r=Math.floor((p.y-GL.y0)/GL.ch);
      if(c<0||c>3||r<0||r>3)return;
      if(s.atrib[r]===c){s.atrib[r]=null;}else{for(let k=0;k<4;k++)if(s.atrib[k]===c)s.atrib[k]=null;s.atrib[r]=c;}
      somMini('tiro');
    }else if(e.id==='smokes'){
      const x=Math.floor((p.x-GS.x0)/GS.c),y=Math.floor((p.y-GS.y0)/GS.c);
      if(x<0||y<0||x>=s.N||y>=s.N)return;
      s.toca(s.g,x,y);s.jogadas++;somMini('tiro');
      fx.faisca(GS.x0+x*GS.c+GS.c/2,GS.y0+y*GS.c+GS.c/2,'rgba(236,232,225,.7)',8);
      if(s.g.every(r=>r.every(Boolean)))resolveu(1,0.55+0.45*clamp(s.k/Math.max(s.k,s.jogadas),0,1),'BOMB COBERTO');
    }else{
      if(s.anim)return;
      const x=Math.floor((p.x-GD.x0)/GD.c),y=Math.floor((p.y-GD.y0)/GD.c);
      if(x<0||y<0||x>2||y>2)return;
      const i=y*3+x,v=s.p.indexOf(8);
      if(!s.viz(v).includes(i))return;
      s.anim={de:i,para:v,peca:s.p[i],t:0};
      s.p[v]=s.p[i];s.p[i]=8;s.jogadas++;somMini('tiro');
      if(s.p.every((q,k)=>q===k))setTimeout(()=>resolveu(2,0.55+0.45*clamp(1-(s.jogadas-20)/60,0.3,1),'MAPA MONTADO'),180);
    }
  };
  const confirmarLeitura=()=>{
    const s=E[0].s;
    if(s.atrib.some(v=>v==null)){aviso={txt:'MARQUE AS QUATRO FUNÇÕES',cor:'#E8A33D',vida:1};somMini('erro');return;}
    if(s.atrib.every((v,i)=>v===s.sol[i]))resolveu(0,0.55+0.45*Math.max(0,1-0.25*s.erros),'LEITURA CERTA');
    else{s.erros++;tempo+=8;aviso={txt:'NÃO BATE COM AS PISTAS · −8 s',cor:'#FF4655',vida:1.2};somMini('erro');}
  };

  let ult=performance.now();
  const quadro=agoraMs=>{
    if(!ctx.vivo()||fimJa)return;
    const dt=Math.min(0.05,(agoraMs-ult)/1000);ult=agoraMs;tempo+=dt;brilho=Math.max(0,brilho-dt*1.5);
    if(tempo>=EN_TEMPO){acabar();return;}
    bts=[];
    const g=cx.createLinearGradient(0,0,0,MG_H);g.addColorStop(0,'#0B1218');g.addColorStop(1,'#0F1923');cx.fillStyle=g;cx.fillRect(0,0,MG_W,MG_H);
    if(imgOk){cx.globalAlpha=0.12;cx.drawImage(img,0,0,MG_W,MG_H);cx.globalAlpha=1;}
    cx.fillStyle=`rgba(24,229,180,${brilho*0.12})`;cx.fillRect(0,0,MG_W,MG_H);
    const e=E[Math.min(atual,E.length-1)],s=e.s;
    /* cabeçalho */
    cx.fillStyle='rgba(5,9,13,.7)';cx.fillRect(0,0,MG_W,74);
    cx.fillStyle='rgba(236,232,225,.55)';cx.font='700 11px Inter, sans-serif';cx.textAlign='left';
    cx.fillText(`ENIGMA ${Math.min(atual+1,3)} DE 3 · ${mapa.toUpperCase()}`,24,24);
    cx.fillStyle='#ECE8E1';cx.font='400 30px "Bebas Neue", Impact, sans-serif';cx.fillText(e.nome,24,56);
    for(let i=0;i<3;i++){cx.fillStyle=i<atual?'#18E5B4':i===atual?'#FF4655':'rgba(255,255,255,.15)';cx.fillRect(330+i*34,46,28,5);}
    botao(MG_W-114,20,90,34,'Pular',pular);
    cx.fillStyle='rgba(236,232,225,.75)';cx.font='13px Inter, sans-serif';cx.textAlign='left';
    texto(e.inst,24,108,430,19);
    /* --- 1. leitura --- */
    if(e.id==='leitura'){
      cx.fillStyle='rgba(236,232,225,.5)';cx.font='700 10px Inter, sans-serif';cx.fillText('PISTAS DO ANALISTA',24,170);
      let y=196;cx.font='14px Inter, sans-serif';
      s.pistas.forEach((c,i)=>{const ok=s.atrib.every(v=>v!=null)?c.ok(s.atrib):null;
        cx.fillStyle=ok===false?'#FF4655':ok?'#18E5B4':'#ECE8E1';cx.fillText((i+1)+'.',24,y);
        cx.fillStyle='rgba(236,232,225,.9)';y=texto(c.txt,48,y,410,20)+8;});
      EN_LUGARES.forEach((l,c)=>{cx.fillStyle='rgba(236,232,225,.7)';cx.font='700 11px Inter, sans-serif';cx.textAlign='center';cx.fillText(l.toUpperCase(),GL.x0+c*GL.cw+GL.cw/2,GL.y0-12);});
      EN_FUNCOES.forEach(([n,cor],r)=>{
        cx.fillStyle=cor;cx.font='400 20px "Bebas Neue", Impact, sans-serif';cx.textAlign='right';cx.fillText(n,GL.x0-14,GL.y0+r*GL.ch+GL.ch/2+7);
        for(let c=0;c<4;c++){const x=GL.x0+c*GL.cw,y2=GL.y0+r*GL.ch,on=s.atrib[r]===c;
          cx.fillStyle=on?cor:'rgba(255,255,255,.035)';cx.globalAlpha=on?0.85:1;cx.fillRect(x+3,y2+3,GL.cw-6,GL.ch-6);cx.globalAlpha=1;
          cx.strokeStyle='rgba(255,255,255,.1)';cx.strokeRect(x+3.5,y2+3.5,GL.cw-7,GL.ch-7);
          if(on){cx.strokeStyle='#0B1218';cx.lineWidth=3;cx.beginPath();cx.moveTo(x+GL.cw/2-12,y2+GL.ch/2);cx.lineTo(x+GL.cw/2-3,y2+GL.ch/2+9);cx.lineTo(x+GL.cw/2+13,y2+GL.ch/2-9);cx.stroke();cx.lineWidth=1;}}
      });
      botao(GL.x0+4*GL.cw-180,GL.y0+4*GL.ch+20,180,40,'Confirmar leitura',confirmarLeitura,'p');
      if(s.erros){cx.fillStyle='#FF4655';cx.font='12px Inter, sans-serif';cx.textAlign='left';cx.fillText(s.erros+' erro(s)',GL.x0,GL.y0+4*GL.ch+46);}
    }
    /* --- 2. smokes --- */
    else if(e.id==='smokes'){
      const cob=s.g.flat().filter(Boolean).length;
      cx.fillStyle='rgba(236,232,225,.6)';cx.font='13px Inter, sans-serif';cx.textAlign='left';
      cx.fillText(`Cobertura: ${cob} de ${s.N*s.N}`,24,200);cx.fillText(`Smokes usadas: ${s.jogadas}`,24,224);
      cx.fillStyle='rgba(236,232,225,.45)';cx.fillText(`Dá para cobrir em ${s.k} ou menos.`,24,248);
      botao(24,276,150,36,'Recomeçar',()=>{s.g=s.ini.map(r=>r.slice());s.jogadas=0;somMini('erro');});
      cx.fillStyle='rgba(5,9,13,.75)';cx.fillRect(GS.x0-10,GS.y0-10,s.N*GS.c+20,s.N*GS.c+20);
      cx.strokeStyle='rgba(255,70,85,.5)';cx.lineWidth=2;cx.strokeRect(GS.x0-10,GS.y0-10,s.N*GS.c+20,s.N*GS.c+20);cx.lineWidth=1;
      cx.fillStyle='rgba(255,70,85,.15)';cx.font='400 120px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText('A',GS.x0+s.N*GS.c/2,GS.y0+s.N*GS.c/2+42);
      for(let y=0;y<s.N;y++)for(let x=0;x<s.N;x++){const X=GS.x0+x*GS.c,Y=GS.y0+y*GS.c;
        cx.strokeStyle='rgba(255,255,255,.06)';cx.strokeRect(X+.5,Y+.5,GS.c-1,GS.c-1);
        if(s.g[y][x]){const r=cx.createRadialGradient(X+GS.c/2,Y+GS.c/2,4,X+GS.c/2,Y+GS.c/2,GS.c*0.62);
          r.addColorStop(0,'rgba(200,215,225,.85)');r.addColorStop(0.7,'rgba(160,180,195,.45)');r.addColorStop(1,'rgba(160,180,195,0)');
          cx.fillStyle=r;cx.fillRect(X-8,Y-8,GS.c+16,GS.c+16);}}
    }
    /* --- 3. deslize --- */
    else{
      cx.fillStyle='rgba(236,232,225,.6)';cx.font='13px Inter, sans-serif';cx.textAlign='left';cx.fillText(`Jogadas: ${s.jogadas}`,24,200);
      cx.fillStyle='rgba(236,232,225,.45)';cx.fillText('Até 20 jogadas vale nota cheia.',24,224);
      /* miniatura do objetivo */
      if(imgOk){const lado=Math.min(img.width,img.height);cx.drawImage(img,(img.width-lado)/2,(img.height-lado)/2,lado,lado,24,250,150,150);
        cx.strokeStyle='rgba(255,255,255,.2)';cx.strokeRect(24.5,250.5,149,149);cx.fillStyle='rgba(236,232,225,.45)';cx.fillText('objetivo',24,420);}
      cx.fillStyle='rgba(5,9,13,.8)';cx.fillRect(GD.x0-8,GD.y0-8,3*GD.c+16,3*GD.c+16);
      if(s.anim){s.anim.t+=dt/0.11;if(s.anim.t>=1)s.anim=null;}
      for(let i=0;i<9;i++){
        const q=s.p[i];if(q===8)continue;
        let x=GD.x0+(i%3)*GD.c,y=GD.y0+Math.floor(i/3)*GD.c;
        if(s.anim&&s.anim.para===i){const k=s.anim.t,xa=GD.x0+(s.anim.de%3)*GD.c,ya=GD.y0+Math.floor(s.anim.de/3)*GD.c;x=xa+(x-xa)*k;y=ya+(y-ya)*k;}
        if(imgOk){const lado=Math.min(img.width,img.height),t3=lado/3,sx=(img.width-lado)/2+(q%3)*t3,sy=(img.height-lado)/2+Math.floor(q/3)*t3;
          cx.drawImage(img,sx,sy,t3,t3,x+2,y+2,GD.c-4,GD.c-4);}
        else{cx.fillStyle=['#FF4655','#E2B45A','#18E5B4','#4C8DFF','#9B6BFF','#FF8A3D','#7DDB4F','#ECE8E1'][q];cx.globalAlpha=0.7;cx.fillRect(x+2,y+2,GD.c-4,GD.c-4);cx.globalAlpha=1;
          cx.fillStyle='#0B1218';cx.font='400 48px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText(String(q+1),x+GD.c/2,y+GD.c/2+16);}
        cx.strokeStyle='rgba(11,18,24,.9)';cx.lineWidth=2;cx.strokeRect(x+2,y+2,GD.c-4,GD.c-4);cx.lineWidth=1;
      }
    }
    fx.passo(cx,dt);
    if(aviso){aviso.vida-=dt;if(aviso.vida<=0)aviso=null;else{cx.globalAlpha=Math.min(1,aviso.vida*2);cx.fillStyle=aviso.cor;
      cx.font='400 40px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText(aviso.txt,MG_W/2,MG_H-30-(1.2-aviso.vida)*20);cx.globalAlpha=1;}}
    hudRange(ctx,{restante:1-tempo/EN_TEMPO,rot1:'enigma',pts:Math.min(atual+1,3)+'/3',rot2:'tempo',v2:Math.ceil(EN_TEMPO-tempo)+' s',combo:0});
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* cartão no Preparo por mapa */
let enigmaMapa=null;
function cardEnigmas(t){
  if(typeof minigamesLigados==='function'&&!minigamesLigados())return '';
  const pool=G.mapasAtivos||[];if(!pool.length)return '';
  const preps=pool.map(m=>({m,n:preparoDoMapa(t,m).nota})).sort((a,b)=>a.n-b.n);
  if(!enigmaMapa||!pool.includes(enigmaMapa))enigmaMapa=preps[0].m;
  const s=t.miniMapa;let txt;
  if(s&&s.comissao)txt=`A comissão conduziu o estudo de mapa desta semana.`;
  else if(s){const med=medalhaMini(s.nota);txt=`<span class="mg-chip" style="--m:${med.cor}">${esc(med.nome)} · ${Math.round(s.nota*100)}</span>
    estudo extra de <b class="up">${Math.round(ENIG_MAX*s.nota*100)}%</b> de uma semana no <b>${esc(s.mapa)}</b>, no fim da semana`;}
  else txt=`Três enigmas valem até <b>${Math.round(ENIG_MAX*100)}%</b> de uma semana de treino no mapa escolhido, sem cansar o elenco.`;
  const rec=recordeMini('enigmas').geral;
  return `<div class="card mg-card mg-card-en">
    <div class="mg-card-arte" aria-hidden="true"><svg viewBox="0 0 80 80"><rect x="12" y="12" width="56" height="56" fill="none" stroke="rgba(24,229,180,.6)" stroke-width="2"/>
      <path d="M12 31h56M12 49h56M31 12v56M49 12v56" stroke="rgba(24,229,180,.35)"/><text x="40" y="54" text-anchor="middle" font-size="40" font-family="Bebas Neue,Impact" fill="#FF4655">?</text></svg></div>
    <div class="mg-card-t"><div class="eyebrow">Minigame · Enigmas táticos</div>
      <div class="mg-card-e">${txt}</div>
      <div class="mg-card-rec dim">${rec?'recorde '+rec.pts+' · ':''}sugestão: o mapa de preparo mais baixo</div></div>
    <div class="mg-card-acao">${s?'':`<select id="enMapa">${preps.map(p=>`<option value="${esc(p.m)}" ${p.m===enigmaMapa?'selected':''}>${esc(p.m)} · ${p.n}</option>`).join('')}</select>`}
      <button class="btn ${s?'ghost':''}" data-enigmas>${s?'Treino livre':'Estudar o mapa'}</button></div>
  </div>`;
}
