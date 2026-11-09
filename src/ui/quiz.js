/* ============================================================
   QUIZ DE VOD — revisão de vídeo em forma de perguntas
   ------------------------------------------------------------
   O VOD roda no fundo (minimapa com os dez jogadores andando, linha do
   tempo) e as perguntas aparecem por cima: 12 segundos cada, quatro
   opções, teclas 1 a 4. Responder rápido vale um pouco mais.
   Dois usos:
     · próximo adversário (Preparo por mapa e Central): perguntas sobre
       ele e sobre o jogo; a nota sobe o nível do relatório contra ele;
     · conta do radar (Base): perguntas sobre o garoto e sobre o jogo; a
       nota vale semanas de observação a mais.
   As perguntas gerais falam do que não muda de patch para patch (regras,
   economia básica, mapas e o vocabulário tático); as de função de agente
   saem da própria lista do jogo (AGENTS em data/mundo.js).
   ============================================================ */
const QZ_SEG=12;
const QZ_BANCO=[
  {p:'Quantos rounds um time precisa vencer para fechar um mapa no tempo normal?',c:'13',e:['12','15','16']},
  {p:'Depois de qual round os times trocam de lado?',c:'12',e:['10','13','15']},
  {p:'Numa prorrogação do VCT, como o mapa termina?',c:'Quando um time abre dois rounds de vantagem',e:['No primeiro round vencido','Num melhor de cinco rounds','Pelo número de abates']},
  {p:'Quantos créditos o time ganha por vencer um round?',c:'3.000',e:['2.400','2.900','3.300']},
  {p:'Qual é o bônus de derrota depois da primeira derrota?',c:'1.900',e:['1.600','2.400','2.900']},
  {p:'Qual é o maior bônus de derrota, com três ou mais derrotas seguidas?',c:'2.900',e:['2.400','3.000','3.500']},
  {p:'Quantos créditos vale um abate?',c:'200',e:['100','150','300']},
  {p:'Qual o máximo de créditos que um jogador pode guardar?',c:'9.000',e:['8.000','10.000','12.000']},
  {p:'Com quantos créditos cada jogador começa o round de pistol?',c:'800',e:['600','900','1.000']},
  {p:'Quanto custa uma Vandal?',c:'2.900',e:['2.700','3.100','3.200']},
  {p:'Qual arma custa o mesmo que a Vandal?',c:'Phantom',e:['Guardian','Odin','Bulldog']},
  {p:'Quanto custa a Sheriff?',c:'800',e:['500','700','950']},
  {p:'Quanto tempo leva para plantar a spike?',c:'4 segundos',e:['3 segundos','5 segundos','7 segundos']},
  {p:'Quanto tempo leva um defuse completo?',c:'7 segundos',e:['5 segundos','6 segundos','10 segundos']},
  {p:'Depois de plantada, em quanto tempo a spike explode?',c:'45 segundos',e:['30 segundos','40 segundos','60 segundos']},
  {p:'A partir de quantos segundos o meio defuse fica salvo?',c:'3,5 segundos',e:['2 segundos','4 segundos','5 segundos']},
  {p:'Qual mapa tem teleportes ligando os dois lados?',c:'Bind',e:['Ascent','Split','Breeze']},
  {p:'Qual destes mapas tem três bombs?',c:'Haven',e:['Ascent','Bind','Icebox']},
  {p:'Em qual mapa os atacantes podem chegar a cada bomb pelos dois lados?',c:'Fracture',e:['Pearl','Sunset','Haven']},
  {p:'Qual destes mapas tem portas que giram e abrem passagem?',c:'Lotus',e:['Haven','Pearl','Split']},
  {p:'Em qual mapa dá para cair para fora, porque ele não tem paredes nas bordas?',c:'Abyss',e:['Ascent','Haven','Sunset']},
  {p:'Qual agente revive um aliado?',c:'Sage',e:['Phoenix','Clove','Skye']},
  {p:'Qual agente usa um arco com flechas de reconhecimento?',c:'Sova',e:['Fade','Cypher','Skye']},
  {p:'Qual agente tem facas como ultimate?',c:'Jett',e:['Reyna','Neon','Yoru']},
  {p:'Qual agente cria uma parede de veneno?',c:'Viper',e:['Harbor','Astra','Omen']},
  {p:'Qual é o ultimate da Raze?',c:'Um lança-foguetes',e:['Uma rajada de facas','Um laser','Um muro de gelo']},
  {p:'Brimstone posiciona as smokes usando o quê?',c:'Um mapa tático',e:['Um drone','A própria mira','Um boneco']},
  {p:'O ultimate da Killjoy faz o quê?',c:'Detém quem fica dentro do raio',e:['Revela o mapa inteiro','Cura o time','Cria uma cúpula de fumaça']},
  {p:'O que é um round de eco?',c:'O time economiza e compra pouco ou nada',e:['Todo mundo compra Operator','Só o IGL compra','O round depois do pistol vencido']},
  {p:'O que é dar trade?',c:'Matar quem acabou de abater o seu companheiro',e:['Trocar de arma com um aliado','Trocar de lado no intervalo','Dar a spike para outro jogador']},
  {p:'O que faz um lurker?',c:'Joga sozinho, longe do time, pegando rotações e flancos',e:['Fica sempre com a spike','Entra primeiro no bomb','Só joga de Operator']},
  {p:'O que é um retake?',c:'Recuperar o bomb depois que a spike foi plantada',e:['Repetir o round','Plantar de novo','Trocar de mapa']},
  {p:'O que faz o IGL?',c:'Comanda as calls e a estratégia dentro do jogo',e:['Cuida do contrato dos jogadores','Escolhe as skins do time','Treina só a mira']},
  {p:'O que é um round de anti-eco?',c:'Jogar contra um time que está economizando',e:['Economizar junto com o adversário','Comprar só pistolas','Jogar sem habilidades']},
  {p:'Quantos Masters a temporada do VCT tem antes do Champions?',c:'2',e:['1','3','4']},
  {p:'Qual torneio fecha a temporada do VCT?',c:'Valorant Champions',e:['Masters','Kickoff','Ascension']}
];
const _qzEmb=a=>a.slice().sort(()=>Math.random()-0.5);
function qzFuncao(){
  const roles=['Duelista','Iniciador','Controlador','Sentinela'];
  const r=roles[(Math.random()*4)|0];
  const flex=new Set(AGENTS.Flex||[]);
  const so=x=>AGENTS[x].filter(a=>!flex.has(a)||roles.filter(y=>AGENTS[y].includes(a)).length===1);
  const certo=_qzEmb(so(r))[0];
  const errados=_qzEmb(roles.filter(x=>x!==r)).map(x=>_qzEmb(so(x))[0]);
  return{p:`Qual destes agentes é ${r==='Iniciador'?'um Iniciador':r==='Duelista'?'um Duelista':r==='Controlador'?'um Controlador':'um Sentinela'}?`,c:certo,e:errados};
}
/* perguntas sobre o adversário, tiradas do mundo do jogo */
function qzAdversario(adv){
  const out=[];
  const el=(adv.elenco||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const tit=(adv.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  if(adv.igl&&G.jogadores[adv.igl]&&el.length>=4){
    const igl=G.jogadores[adv.igl];
    out.push({p:`Quem é o IGL do ${adv.nome}?`,c:igl.nome,e:_qzEmb(el.filter(p=>p.id!==igl.id)).slice(0,3).map(p=>p.nome)});
  }
  const comFuncao=tit.filter(p=>['Duelista','Iniciador','Controlador','Sentinela'].includes(p.role));
  if(comFuncao.length){const p=_qzEmb(comFuncao)[0];
    out.push({p:`Qual é a função de ${p.nome} no ${adv.tag}?`,c:p.role,e:['Duelista','Iniciador','Controlador','Sentinela'].filter(r=>r!==p.role)});}
  const outros=Object.values(G.times).filter(x=>x.id!==adv.id&&x.id!==G.meuTime&&x.tier===adv.tier)
    .flatMap(x=>(x.titulares||[]).map(i=>G.jogadores[i])).filter(Boolean);
  if(tit.length&&outros.length>=3){
    out.push({p:`Qual destes jogadores é titular do ${adv.tag}?`,c:_qzEmb(tit)[0].nome,e:_qzEmb(outros).slice(0,3).map(p=>p.nome)});
  }
  const tp=adv.temporada||{v:0,d:0};
  if(tp.v+tp.d>=2){
    const fmt=(v,d)=>`${v} vitória${v===1?'':'s'} e ${d} derrota${d===1?'':'s'}`;
    const alt=[[tp.v+1,Math.max(0,tp.d-1)],[Math.max(0,tp.v-1),tp.d+1],[tp.d,tp.v],[tp.v+2,tp.d]].filter(([v,d])=>v!==tp.v||d!==tp.d);
    const uniq=[...new Set(alt.map(([v,d])=>fmt(v,d)))].slice(0,3);
    if(uniq.length===3)out.push({p:`Qual é a campanha do ${adv.tag} na temporada?`,c:fmt(tp.v,tp.d),e:uniq});
  }
  return out;
}
/* perguntas sobre a conta do radar */
function qzConta(c){
  const out=[];
  const ag=(AGENTS[c.role]||[]).filter(a=>a!==c.agente);
  if(ag.length>=3)out.push({p:`No VOD, com qual agente ${c.nome} está jogando?`,c:c.agente,e:_qzEmb(ag).slice(0,3)});
  if(['Duelista','Iniciador','Controlador','Sentinela'].includes(c.role))
    out.push({p:`Qual é a função de ${c.nome} na ranked?`,c:c.role,e:['Duelista','Iniciador','Controlador','Sentinela'].filter(r=>r!==c.role)});
  return out;
}
function montarQuiz(especificas,total){
  const n=Math.min(especificas.length,Math.ceil(total*0.4));
  const gerais=_qzEmb(QZ_BANCO).slice(0,total-n-2).concat([qzFuncao(),qzFuncao()]);
  return _qzEmb(_qzEmb(especificas).slice(0,n).concat(gerais)).slice(0,total)
    .map(q=>({p:q.p,ops:_qzEmb([q.c,...q.e.slice(0,3)]),c:q.c}));
}

/* ---------- abrir ---------- */
function abrirQuizAdversario(){
  const t=meu();
  const px=typeof proximoConfronto==='function'?proximoConfronto():null;
  const adv=px&&px.adv?G.times[px.adv]:null;
  if(!adv){flash('Não há adversário marcado ainda.');return;}
  const antes=typeof nivelScout==='function'?nivelScout(t):1;
  abrirMinigame({
    id:'vod',titulo:'Revisão de VOD',eyebrow:'Scouting · '+adv.nome,
    desc:`O analista separou os VODs do <b>${esc(adv.nome)}</b>. Responda o que o vídeo mostra e o que todo coach precisa saber: 8 perguntas, ${QZ_SEG} segundos cada.`,
    controles:['1','2','3','4','Mouse'],
    arte:()=>_qzArte(),
    vale:()=>vodDisponivel(t),
    efeitoTxt:()=>`O relatório de scouting contra o <b>${esc(adv.tag)}</b> sobe nesta semana: <b class="up">+1 nível</b> a partir de 50, <b class="up">+2</b> a partir de 85. Hoje ele está no nível <b>${antes}</b> de ${SCOUT_MAX}.`,
    efeitoFeito:res=>{const b=bonusVODDaNota(res.nota);
      return b?`Relatório contra o <b>${esc(adv.tag)}</b> sobe do nível <b>${antes}</b> para <b class="up">${Math.min(SCOUT_MAX,antes+b)}</b> nesta semana.`
        :`A revisão não rendeu leitura nova: o relatório contra o <b>${esc(adv.tag)}</b> continua no nível ${antes}.`;},
    comissao:()=>{t.miniVOD={adv:adv.id,comissao:true,nota:null,bonus:0,ano:G.ano,semana:G.semana||1};},
    dica:()=>'Clique na resposta ou use as teclas 1 a 4.',
    registrar:(res,vale)=>{
      if(vale){const r=registrarVOD(t,adv,res);return r?r.bateu:null;}
      return registrarRecordeMini('vod',res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarQuiz(ctx,fim,montarQuiz(qzAdversario(adv),8),{rotulo:adv.tag,cor:corDoClube(adv)})
  });
}
function abrirQuizConta(id){
  const t=meu();
  const c=typeof radarRanked==='function'&&radarRanked().contas.find(x=>x.id===id);
  if(!c){flash('Essa conta não está mais no radar.');return;}
  abrirMinigame({
    id:'vod',titulo:'VOD da ranked',eyebrow:'Base · '+c.nome,
    desc:`O olheiro trouxe partidas de <b>${esc(c.nome)}</b> (${esc(c.rank)}). Responda o que o VOD mostra e o que todo coach precisa saber: 6 perguntas, ${QZ_SEG} segundos cada.`,
    controles:['1','2','3','4','Mouse'],
    arte:()=>_qzArte(),
    vale:()=>vodBaseDisponivel(t),
    efeitoTxt:()=>`Vale até <b class="up">${VOD_BASE_MAX} semanas</b> de observação a mais na leitura de ${esc(c.nome)}, na hora.`,
    efeitoFeito:res=>{const o=Math.round(res.nota*VOD_BASE_MAX);return o?`<b class="up">+${o} semana${o>1?'s':''}</b> de observação na leitura de ${esc(c.nome)}.`:'A revisão não acrescentou nada à leitura.';},
    comissao:()=>{t.miniBaseVOD={conta:c.id,comissao:true,nota:null,ano:G.ano,semana:G.semana||1};},
    dica:()=>'Clique na resposta ou use as teclas 1 a 4.',
    registrar:(res,vale)=>{
      if(vale){const r=registrarVODBase(t,c.id,res);return r?r.bateu:null;}
      return registrarRecordeMini('vod',res.pts,res.nota);
    },
    jogar:(ctx,fim)=>jogarQuiz(ctx,fim,montarQuiz(qzConta(c),6),{rotulo:c.nome,cor:'#E2B45A'})
  });
}
function _qzArte(){return `<svg viewBox="0 0 200 120"><rect x="96" y="22" width="98" height="64" rx="4" fill="none" stroke="rgba(236,232,225,.4)" stroke-width="2"/>
  <path d="M138 42l18 12-18 12z" fill="#FF4655"/><rect x="96" y="94" width="98" height="4" fill="rgba(255,255,255,.15)"/><rect x="96" y="94" width="58" height="4" fill="#FF4655"/></svg>`;}

/* ---------- o jogo ---------- */
function jogarQuiz(ctx,fim,perguntas,o){
  const cx=ctx.cx;
  const palco=ctx.cv.parentNode;
  const caixa=document.createElement('div');caixa.className='qz';palco.appendChild(caixa);
  let i=-1,tq=0,resp=null,pts=0,certas=0,soma=0,fimJa=false,serie=0;
  const pontos=Array.from({length:10},(_,k)=>({x:Math.random(),y:Math.random(),a:Math.random()*6.28,v:0.04+Math.random()*0.05,time:k<5}));
  if(MG)MG.quiz={perguntas,get i(){return i;},responder:k=>responder(k)};   /* para os testes */
  const proxima=()=>{
    i++;resp=null;tq=0;
    if(i>=perguntas.length){acabar();return;}
    const q=perguntas[i];
    caixa.innerHTML=`<div class="qz-card" key="${i}">
      <div class="qz-topo"><span>Pergunta ${i+1} de ${perguntas.length}</span><u><i></i></u></div>
      <h3>${esc(q.p)}</h3>
      <div class="qz-ops">${q.ops.map((op,k)=>`<button class="qz-op" data-qz="${k}"><kbd>${k+1}</kbd><span>${esc(op)}</span></button>`).join('')}</div>
    </div>`;
    caixa.querySelectorAll('[data-qz]').forEach(b=>b.onclick=()=>responder(+b.dataset.qz));
  };
  const responder=k=>{
    if(resp!==null||fimJa||i<0||i>=perguntas.length)return;
    const q=perguntas[i];resp=k;
    const ok=k>=0&&q.ops[k]===q.c;
    const rest=Math.max(0,QZ_SEG-tq);
    const v=ok?0.7+0.3*rest/QZ_SEG:0;
    soma+=v;
    if(ok){certas++;serie++;pts+=Math.round(100+rest*15)*(1+Math.min(serie,5)*0.1);somMini('cabeca');}else{serie=0;somMini('erro');}
    caixa.querySelectorAll('[data-qz]').forEach(b=>{const n=+b.dataset.qz;b.disabled=true;
      if(q.ops[n]===q.c)b.classList.add('certa');else if(n===k)b.classList.add('errada');});
    const card=caixa.querySelector('.qz-card');if(card)card.classList.add(ok?'ok':'nao');
    setTimeout(()=>{if(!fimJa&&ctx.vivo())proxima();},ok?900:1500);
  };
  const tecla=e=>{if(!ctx.vivo()){limpar();return;}const n=['Digit1','Digit2','Digit3','Digit4','Numpad1','Numpad2','Numpad3','Numpad4'].indexOf(e.code);
    if(n<0)return;e.preventDefault();responder(n%4);};
  const limpar=()=>window.removeEventListener('keydown',tecla,true);
  window.addEventListener('keydown',tecla,true);
  const acabar=()=>{
    if(fimJa)return;fimJa=true;limpar();caixa.remove();
    const nota=clamp(soma/perguntas.length,0,1);
    fim({nota,pts:Math.round(pts),modo:'vod',modoNome:o.rotulo,
      frase:nota>=0.93?'Leitura de analista campeão':nota>=0.8?'Revisão de primeira':nota>=0.6?'Boa revisão':nota>=0.35?'Revisão pela metade':'O VOD passou batido',
      stats:[['Pontos',Math.round(pts)],['Acertos',certas+'/'+perguntas.length],['Precisão',Math.round(certas/perguntas.length*100)+'%']]});
  };
  proxima();
  let ult=performance.now(),tv=0;
  const quadro=agora=>{
    if(!ctx.vivo()){limpar();return;}
    if(fimJa)return;
    const dt=Math.min(0.05,(agora-ult)/1000);ult=agora;tv+=dt;
    if(resp===null){tq+=dt;if(tq>=QZ_SEG)responder(-1);}
    const barra=caixa.querySelector('.qz-topo i');if(barra)barra.style.width=Math.max(0,(1-tq/QZ_SEG)*100)+'%';
    /* o VOD no fundo */
    cx.fillStyle='#070B0F';cx.fillRect(0,0,MG_W,MG_H);
    const mx=40,my=40,mw=400,mh=400;
    cx.fillStyle='#0E161E';cx.fillRect(mx,my,mw,mh);
    cx.strokeStyle='rgba(255,255,255,.08)';cx.lineWidth=14;cx.lineJoin='round';
    cx.beginPath();cx.moveTo(mx+60,my+340);cx.lineTo(mx+60,my+120);cx.lineTo(mx+180,my+60);cx.lineTo(mx+340,my+80);cx.lineTo(mx+340,my+300);cx.lineTo(mx+200,my+340);cx.closePath();
    cx.moveTo(mx+60,my+220);cx.lineTo(mx+340,my+200);cx.moveTo(mx+180,my+60);cx.lineTo(mx+200,my+340);cx.stroke();cx.lineWidth=1;
    [['A',mx+80,my+90],['B',mx+320,my+290]].forEach(([l,x,y])=>{cx.fillStyle='rgba(255,70,85,.12)';cx.fillRect(x-30,y-30,60,60);
      cx.fillStyle='rgba(255,70,85,.6)';cx.font='400 26px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText(l,x,y+9);});
    for(const p of pontos){p.a+=dt*(0.6+Math.sin(tv+p.x*9)*0.4);p.x=clamp(p.x+Math.cos(p.a)*p.v*dt*3,0.08,0.92);p.y=clamp(p.y+Math.sin(p.a)*p.v*dt*3,0.08,0.92);
      const x=mx+p.x*mw,y=my+p.y*mh;cx.fillStyle=p.time?'#18E5B4':'#FF4655';cx.beginPath();cx.arc(x,y,6,0,6.28);cx.fill();
      cx.strokeStyle=p.time?'rgba(24,229,180,.35)':'rgba(255,70,85,.35)';cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(p.a)*18,y+Math.sin(p.a)*18);cx.stroke();}
    cx.fillStyle='rgba(255,255,255,.03)';for(let y=0;y<MG_H;y+=3)cx.fillRect(0,y,MG_W,1);
    cx.fillStyle='#FF4655';cx.beginPath();cx.arc(mx+12,my-16,5,0,6.28);cx.fill();
    cx.fillStyle='rgba(236,232,225,.7)';cx.font='700 11px Inter, sans-serif';cx.textAlign='left';cx.fillText('VOD · '+String(o.rotulo).toUpperCase(),mx+24,my-12);
    const prog=(tv%60)/60;cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(mx,MG_H-56,mw,4);cx.fillStyle='#FF4655';cx.fillRect(mx,MG_H-56,mw*prog,4);
    cx.fillStyle='rgba(236,232,225,.5)';cx.font='600 11px JetBrains Mono, monospace';
    const s=Math.floor(tv%60);cx.fillText(`R${(Math.floor(tv/60)%24)+1} · 0:${String(s).padStart(2,'0')} / 1:00`,mx,MG_H-34);
    hudRange(ctx,{restante:1-Math.max(0,i)/perguntas.length,rot1:'pergunta',pts:Math.min(i+1,perguntas.length)+'/'+perguntas.length,rot2:'acertos',v2:certas,combo:serie>1?serie:0});
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* ---------- cartão no Preparo por mapa ---------- */
function cardQuizVOD(t){
  if(typeof minigamesLigados==='function'&&!minigamesLigados())return '';
  const px=typeof proximoConfronto==='function'?proximoConfronto():null;
  const adv=px&&px.adv?G.times[px.adv]:null;
  if(!adv)return '';
  const m=t.miniVOD,nv=typeof nivelScout==='function'?nivelScout(t):1;
  let txt;
  if(m&&m.comissao)txt='A comissão revisou os VODs desta semana.';
  else if(m&&m.adv!==adv.id)txt='A revisão desta semana foi de outro adversário.';
  else if(m){const med=medalhaMini(m.nota);txt=`<span class="mg-chip" style="--m:${med.cor}">${esc(med.nome)} · ${Math.round(m.nota*100)}</span>
    ${m.bonus?`relatório contra o <b>${esc(adv.tag)}</b> no nível <b class="up">${Math.min(SCOUT_MAX,nv+m.bonus)}</b> nesta semana`:'sem leitura extra nesta semana'}`;}
  else txt=`Próximo adversário: <b>${esc(adv.nome)}</b>. Relatório no nível ${nv} de ${SCOUT_MAX}; a revisão pode subir até +2.`;
  return `<div class="card mg-card mg-card-vod">
    <div class="mg-card-arte" aria-hidden="true">${escudo(adv,52)}</div>
    <div class="mg-card-t"><div class="eyebrow">Minigame · Revisão de VOD</div><div class="mg-card-e">${txt}</div></div>
    <button class="btn ${m?'ghost':''}" data-quizvod>${m?'Treino livre':'Revisar o VOD'}</button></div>`;
}
