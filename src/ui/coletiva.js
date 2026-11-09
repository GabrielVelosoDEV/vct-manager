/* ============================================================
   COLETIVA DE IMPRENSA — o minigame das respostas certas
   ------------------------------------------------------------
   Painel de patrocinadores ao fundo (as marcas do seu clube e o escudo,
   repetidos como num step-and-repeat de verdade), a mesa com os
   microfones e você no meio, com a sua foto. Ao lado, o destaque da
   série quando houver. Os jornalistas fazem quatro perguntas; cada uma
   tem uma resposta que a sala gosta, uma morna e uma que pega mal.
   15 segundos para responder, teclas 1 a 3. A nota vai para a moral, a
   torcida e a confiança da diretoria (core/minigames.js), e a frase que
   marcou vira manchete.
   ============================================================ */
const COL_SEG=15;
const COL_IMPRENSA=[['Ana Ribeiro','Portal do Spike','#FF4655'],['Caio Menezes','Rádio Clutch','#E2B45A'],['Júlia Prado','Valorant Zone','#18E5B4'],
  ['Rafael Dias','Jornal do Round','#4C8DFF'],['Bia Nakamura','TV Eco','#9B6BFF'],['Pedro Salles','Canal Retake','#FF8A3D']];
/* [pergunta, [resposta que a sala gosta, morna, que pega mal]] */
const COL_PERGUNTAS={
  vitoria:[
    ['O {clube} passou pelo {adv}. O que decidiu a série?',['O time executou o que treinamos a semana inteira. O mérito é dos cinco.','Foi um bom jogo, os dois times jogaram bem.','Sinceramente, o {adv} facilitou bastante pra gente.']],
    ['{mvp} foi o destaque. Ele é o melhor jogador do time?',['Ele jogou demais, mas só brilha porque os outros quatro criam o espaço.','Prefiro não comparar jogadores.','Sem dúvida. Sem ele a gente não ganha de ninguém.']],
    ['Depois dessa vitória, o {clube} é favorito ao título?',['Ninguém ganha nada em véspera. Pé no chão e próximo jogo.','Quem sabe? Vamos ver.','Somos o melhor time do torneio e todo mundo sabe disso.']],
    ['O que você falou para o time no intervalo?',['Que a gente confiasse no plano e jogasse um round de cada vez.','Coisas do vestiário ficam no vestiário.','Que se eles não acordassem, ia ter mudança.']]
  ],
  derrota:[
    ['O que deu errado contra o {adv}?',['A responsabilidade é minha: a preparação não encaixou. Vamos corrigir.','Eles foram melhores hoje.','Alguns jogadores não fizeram o básico.']],
    ['{pior} teve uma noite difícil. Ele continua titular?',['Ele tem a minha confiança. Uma série ruim não apaga o que ele fez pelo time.','Vamos avaliar tudo com calma.','Ninguém tem vaga garantida depois de uma atuação dessas.']],
    ['A torcida está preocupada. O que você diz a ela?',['Que entendo a frustração e que o time vai responder em jogo.','Faz parte do esporte.','Torcida não entra no servidor.']],
    ['O {adv} leu melhor o veto?',['Leu. Vamos estudar o que eles fizeram e voltar mais preparados.','Veto é detalhe.','O veto foi perfeito, quem errou foi quem estava jogando.']]
  ],
  titulo:[
    ['Campeões do {torneio}! O que esse título significa?',['É de todo mundo: jogadores, staff e a torcida que esteve com a gente.','É mais um título, agora é seguir.','Significa que eu estava certo e os críticos estavam errados.']],
    ['Quem foi o melhor dessa campanha para você?',['O grupo. Cada um decidiu um mapa diferente.','Os números falam por si.','Eu. As estratégias foram todas minhas.']],
    ['Já dá para falar em dinastia?',['Hoje é dia de comemorar. Amanhã a gente volta a trabalhar.','Quem sabe.','Ninguém vai nos parar nos próximos anos.']],
    ['Algum recado para os rivais?',['Respeito todos. Ganhar deles é difícil, e por isso esse título vale tanto.','Nos vemos no próximo torneio.','Podem ir se acostumando.']]
  ],
  eliminado:[
    ['Fim da linha no {torneio}. O que fica dessa campanha?',['Muito aprendizado. Saímos de cabeça erguida e mais fortes.','Agora é descansar.','Uma decepção completa, não tem o que salvar.']],
    ['Vai haver mudanças no elenco?',['Vamos conversar internamente antes de qualquer decisão.','Ainda é cedo para dizer.','Com certeza, alguns aqui não têm nível para o time.']],
    ['A eliminação pesa no seu cargo?',['Eu foco no trabalho. Avaliação é com a diretoria, e confio no projeto.','Não penso nisso.','Se quiserem trocar, problema deles.']]
  ],
  sequencia_boa:[
    ['São {n} vitórias seguidas. Qual é o segredo?',['Rotina, trabalho e um vestiário unido.','Fase boa, só isso.','Nossos adversários são fracos.']],
    ['Como manter o time focado depois de tantas vitórias?',['Cobrando nos detalhes mesmo quando a gente ganha.','Eles são profissionais.','Não precisa, o time está pronto.']],
    ['Esse é o melhor momento da sua carreira?',['É um momento bom, mas o melhor ainda está por vir para esse grupo.','Talvez.','Claro. Ninguém faz o que eu estou fazendo.']]
  ],
  sequencia_ruim:[
    ['São {n} derrotas seguidas. O cargo está ameaçado?',['Eu foco no que controlo: trabalho e o vestiário. O resto é com a diretoria.','Não penso nisso.','Se me demitirem, o problema continua aqui.']],
    ['Existe crise no vestiário?',['Não. O grupo está fechado e vai sair dessa junto.','Sem comentários.','Tem gente que precisa se olhar no espelho.']],
    ['O que muda para o próximo jogo?',['Simplificar: voltar ao básico que fez esse time ganhar.','Vamos ver na semana.','Se não mudar a atitude, vai mudar o time.']]
  ],
  geral:[
    ['O que você acha do meta atual?',['Todo patch é uma oportunidade. Nosso trabalho é se adaptar mais rápido.','Tem coisas boas e ruins.','É o pior meta da história, ninguém aguenta.']],
    ['Há rumores de interesse em jogadores seus. Alguém vai sair?',['Nossos jogadores têm contrato e estão focados aqui.','Não comento rumores.','Quem quiser sair, a porta está aberta.']],
    ['Uma mensagem para a torcida?',['Obrigado pelo apoio. Vocês são a nossa força.','Sigam acompanhando.','Cobrem menos e apoiem mais.']],
    ['Como está a relação com a diretoria?',['Excelente. Estamos alinhados no projeto.','Normal.','Eles não entendem nada de Valorant.']]
  ]
};
const COL_VALOR=[1,0.4,0];
function contextoColetivaTxt(c){
  const adv=c.adv&&G.times[c.adv];
  return{vitoria:`Depois da vitória sobre o ${adv?adv.nome:'adversário'} no ${c.torneio||'torneio'}.`,
    derrota:`Depois da derrota para o ${adv?adv.nome:'adversário'} no ${c.torneio||'torneio'}.`,
    titulo:`O clube é campeão do ${c.torneio||'torneio'}.`,
    eliminado:`O clube caiu no ${c.torneio||'torneio'}${adv?' diante do '+adv.nome:''}.`,
    sequencia_boa:`${c.n||3} vitórias seguidas.`,sequencia_ruim:`${c.n||3} derrotas seguidas.`}[c.ctx]||'Coletiva de imprensa.';
}
function montarColetiva(c){
  const t=meu(),adv=c.adv&&G.times[c.adv];
  const mvp=c.mvp&&G.jogadores[c.mvp]&&G.jogadores[c.mvp].timeId===t.id?G.jogadores[c.mvp]:null;
  const tit=(t.titulares||[]).map(i=>G.jogadores[i]).filter(Boolean);
  const pior=tit.slice().sort((a,b)=>(a.forma||0)-(b.forma||0))[0];
  const troca=s=>s.replace(/\{clube\}/g,t.nome).replace(/\{adv\}/g,adv?adv.nome:'adversário')
    .replace(/\{torneio\}/g,c.torneio||'torneio').replace(/\{mvp\}/g,mvp?mvp.nome:'').replace(/\{pior\}/g,pior?pior.nome:'')
    .replace(/\{n\}/g,String(c.n||3));
  const ok=([p])=>(!/\{mvp\}/.test(p)||mvp)&&(!/\{pior\}/.test(p)||pior)&&(!/\{adv\}/.test(p)||adv);
  const doCtx=(COL_PERGUNTAS[c.ctx]||[]).filter(ok).sort(()=>Math.random()-0.5).slice(0,3);
  const gerais=COL_PERGUNTAS.geral.filter(q=>!doCtx.includes(q)).sort(()=>Math.random()-0.5).slice(0,4-doCtx.length);
  /* quem pergunta: jornalistas dos veículos que cobrem o seu clube (feed de notícias) */
  const regionais=typeof jornalistasDaRegiao==='function'?jornalistasDaRegiao(t.regiao,typeof paisDoClube==='function'?paisDoClube(t):null).slice(0,8):[];
  const jor=(regionais.length>=3?regionais.map(j=>{const v=veiculo(j.veiculo);return [j.nome,v.nome,v.cor];}):COL_IMPRENSA.slice()).sort(()=>Math.random()-0.5);
  return{mvp,perguntas:doCtx.concat(gerais).map(([p,rs],i)=>({p:troca(p),j:jor[i%jor.length],
    rs:rs.map((r,k)=>({txt:troca(r),v:COL_VALOR[k]})).sort(()=>Math.random()-0.5)}))};
}

function abrirColetiva(){
  const t=meu(),c=coletivaPendente();
  const livre=!c;
  const ctx=c||{ctx:'geral'};
  const g=G.manager||{};
  abrirMinigame({
    id:'coletiva',titulo:'Coletiva de imprensa',eyebrow:livre?'Treino livre':contextoColetivaTxt(ctx),
    desc:'Os jornalistas fazem quatro perguntas. Cada uma tem uma resposta que a sala gosta, uma morna e uma que <b>pega mal</b>. 15 segundos para responder; ficar calado também conta.',
    controles:['1','2','3','Mouse'],
    rotuloComissao:'Deixar a assessoria responder',msgComissao:'A assessoria respondeu por você. Nada mudou.',
    arte:()=>`<svg viewBox="0 0 200 120"><rect x="120" y="30" width="16" height="44" rx="8" fill="#ECE8E1" opacity=".8"/><path d="M128 74v24M114 98h28" stroke="#ECE8E1" stroke-width="3" opacity=".8"/>
      <rect x="150" y="40" width="14" height="38" rx="7" fill="#FF4655" opacity=".8"/><path d="M157 78v20" stroke="#FF4655" stroke-width="3" opacity=".8"/></svg>`,
    vale:()=>!!coletivaPendente(),
    efeitoTxt:()=>'Vale de uma vez: moral dos titulares (até ±0,04), torcida (até ±2) e confiança da diretoria (até ±4). A resposta morna não mexe em nada; a frase que marcou vira manchete.',
    efeitoFeito:res=>{const e=res.efeito;if(!e)return 'Treino livre.';
      const f=(v,c2)=>`<b class="${v>=0?'up':'dn'}">${v>=0?'+':''}${c2(v)}</b>`;
      return `Moral dos titulares ${f(e.moral,v=>(v*100).toFixed(1).replace('.',','))} · torcida ${f(e.torcida,v=>v.toFixed(1).replace('.',','))}`+
        (souTreinador()?` · confiança da diretoria ${f(e.conf,v=>String(v))}`:'')+`.`;},
    comissao:()=>{if(G.coletiva)G.coletiva.feita='assessoria';render();},
    dica:()=>'Clique na resposta ou use as teclas 1 a 3.',
    registrar:(res,vale)=>{
      const bateu=registrarRecordeMini('coletiva',res.pts,res.nota);
      if(vale&&coletivaPendente()){
        res.efeito=aplicarColetiva(res.nota);
        if(res.manchete)noticia('🎙 '+(g.nome||'O treinador')+' na coletiva: "'+res.manchete+'"',{c:'clube',t:[t.id],imp:2});
      }
      return bateu;
    },
    jogar:(c2,fim)=>jogarColetiva(c2,fim,montarColetiva(ctx))
  });
}

function jogarColetiva(ctx,fim,dados){
  const cx=ctx.cx,t=meu(),g=G.manager||{};
  const palco=ctx.cv.parentNode;
  const caixa=document.createElement('div');caixa.className='col';palco.appendChild(caixa);
  const carregar=src=>{if(!src)return null;const im=new Image();im.ok=false;im.onload=()=>{im.ok=true;};im.src=src;return im;};
  const mm=typeof membroManager==='function'&&membroManager();
  const foto=carregar(g.foto||(mm&&mm.foto)||null);
  const fotoMvp=dados.mvp?carregar(ASSETS.foto(dados.mvp)):null;
  const escudoT=carregar(ASSETS.logo(t));
  const marcas=(typeof patrociniosDe==='function'?patrociniosDe(t):[]).map(x=>x.mk).filter(Boolean).slice(0,3)
    .map(mk=>({mk,img:carregar(ASSETS.marca(mk))}));
  const cor=corDoClube(t);
  let i=-1,tq=0,resp=null,fimJa=false,soma=0,tv=0,clima=0;
  const vals=[],flashes=[];
  if(MG)MG.coletiva={dados,get i(){return i;},responder:k=>responder(k)};   /* para os testes */
  const proxima=()=>{
    i++;resp=null;tq=0;
    if(i>=dados.perguntas.length){acabar();return;}
    const q=dados.perguntas[i];
    caixa.innerHTML=`<div class="col-card" key="${i}">
      <div class="col-quem"><i style="background:${q.j[2]}"></i><b>${esc(q.j[0])}</b><span>${esc(q.j[1])}</span>
        <span class="col-n">pergunta ${i+1} de ${dados.perguntas.length}</span></div>
      <h3>“${esc(q.p)}”</h3>
      <div class="col-rs">${q.rs.map((r,k)=>`<button class="col-r" data-col="${k}"><kbd>${k+1}</kbd><span>${esc(r.txt)}</span></button>`).join('')}</div>
      <u class="col-tempo"><i></i></u>
    </div>`;
    caixa.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>responder(+b.dataset.col));
    for(let k=0;k<6;k++)flashes.push({x:60+Math.random()*840,y:420+Math.random()*90,vida:0.25+Math.random()*0.3,atraso:Math.random()*0.6});
  };
  const responder=k=>{
    if(resp!==null||fimJa||i<0||i>=dados.perguntas.length)return;
    const q=dados.perguntas[i];resp=k;
    const r=k>=0?q.rs[k]:null,v=r?r.v:0.2;
    soma+=v;vals.push({v,txt:r?r.txt:null});
    clima=v>=1?1:v>=0.4?0.3:-1;
    const rot=v>=1?'A sala gostou':v>=0.4?'Resposta morna':k<0?'Silêncio constrangedor':'Pegou mal';
    somMini(v>=1?'cabeca':v>=0.4?'corpo':'erro');
    if(v>=1)for(let n=0;n<14;n++)flashes.push({x:40+Math.random()*880,y:400+Math.random()*120,vida:0.2+Math.random()*0.3,atraso:Math.random()*0.8});
    caixa.querySelectorAll('[data-col]').forEach(b=>{const n=+b.dataset.col;b.disabled=true;
      const x=q.rs[n].v;b.classList.add(x>=1?'boa':x>=0.4?'morna':'ruim');if(n===k)b.classList.add('escolhida');});
    const card=caixa.querySelector('.col-card');
    if(card){card.insertAdjacentHTML('beforeend',`<div class="col-reacao ${v>=1?'boa':v>=0.4?'morna':'ruim'}">${rot}</div>`);}
    setTimeout(()=>{if(!fimJa&&ctx.vivo())proxima();},1700);
  };
  const tecla=e=>{if(!ctx.vivo()){limpar();return;}const n=['Digit1','Digit2','Digit3','Numpad1','Numpad2','Numpad3'].indexOf(e.code);
    if(n<0)return;e.preventDefault();responder(n%3);};
  const limpar=()=>window.removeEventListener('keydown',tecla,true);
  window.addEventListener('keydown',tecla,true);
  const acabar=()=>{
    if(fimJa)return;fimJa=true;limpar();caixa.remove();
    const nota=clamp(soma/dados.perguntas.length,0,1);
    const boas=vals.filter(x=>x.v>=1).length,ruins=vals.filter(x=>x.v<0.4).length;
    const marcante=nota>=0.6?vals.find(x=>x.v>=1&&x.txt):vals.find(x=>x.v===0&&x.txt)||vals.find(x=>x.txt);
    fim({nota,pts:Math.round(nota*1000+boas*50),modo:'coletiva',modoNome:t.tag,manchete:marcante&&marcante.txt,
      frase:nota>=0.93?'Dono da sala de imprensa':nota>=0.8?'Coletiva de líder':nota>=0.6?'Saiu bem na foto':nota>=0.35?'Coletiva morna':'Polêmica na coletiva',
      stats:[['Respostas boas',boas],['Mornas',vals.filter(x=>x.v===0.4).length],['Que pegaram mal',ruins],['Sem resposta',vals.filter(x=>!x.txt).length]]});
  };
  proxima();

  /* ---- a sala ---- */
  const painel=()=>{
    const g2=cx.createLinearGradient(0,0,0,MG_H);g2.addColorStop(0,'#E9E6E0');g2.addColorStop(1,'#CFCAC2');
    cx.fillStyle=g2;cx.fillRect(0,0,MG_W,MG_H);
    const w=150,h=74;
    for(let r=0;r<9;r++)for(let c=-1;c<8;c++){
      const x=c*w+(r%2?w/2:0)-10,y=r*h-20,k=(r*3+c+9)%(marcas.length+2);
      if(k===0&&escudoT&&escudoT.ok){cx.globalAlpha=0.9;cx.drawImage(escudoT,x+w/2-24,y+h/2-24,48,48);cx.globalAlpha=1;}
      else if(k===1||!marcas.length){cx.fillStyle='rgba(15,25,35,.75)';cx.font='400 26px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';cx.fillText('VCT',x+w/2,y+h/2+9);}
      else{const m=marcas[(k-2)%marcas.length];
        if(m.img&&m.img.ok){const r2=Math.min(110/m.img.width,40/m.img.height);cx.drawImage(m.img,x+w/2-m.img.width*r2/2,y+h/2-m.img.height*r2/2,m.img.width*r2,m.img.height*r2);}
        else{cx.fillStyle=cor;cx.font='800 15px Inter, sans-serif';cx.textAlign='center';cx.fillText(String(m.mk.nome||'').toUpperCase().slice(0,14),x+w/2,y+h/2+5);}}
    }
  };
  let ult=performance.now();
  const quadro=agora=>{
    if(!ctx.vivo()){limpar();return;}
    if(fimJa)return;
    const dt=Math.min(0.05,(agora-ult)/1000);ult=agora;tv+=dt;
    if(resp===null&&i>=0&&i<dados.perguntas.length){tq+=dt;if(tq>=COL_SEG)responder(-1);}
    const barra=caixa.querySelector('.col-tempo i');if(barra)barra.style.width=Math.max(0,(1-tq/COL_SEG)*100)+'%';
    clima*=Math.pow(0.4,dt);
    painel();
    /* luz da sala */
    const luz=cx.createRadialGradient(MG_W/2,180,40,MG_W/2,220,560);luz.addColorStop(0,'rgba(255,255,255,0)');luz.addColorStop(1,'rgba(10,14,20,.55)');
    cx.fillStyle=luz;cx.fillRect(0,0,MG_W,MG_H);
    if(clima<-0.05){cx.fillStyle=`rgba(255,70,85,${-clima*0.12})`;cx.fillRect(0,0,MG_W,MG_H);}
    /* você no meio */
    const resp2=1+Math.sin(tv*1.6)*0.006,bx=MG_W/2-95,by=50,bw=190,bh=238;
    cx.save();cx.translate(MG_W/2,by+bh);cx.scale(resp2,resp2);cx.translate(-MG_W/2,-(by+bh));
    if(foto&&foto.ok){cx.save();cx.beginPath();cx.roundRect(bx,by,bw,bh,[90,90,8,8]);cx.clip();cx.drawImage(foto,bx,by,bw,bh);cx.restore();}
    else{cx.fillStyle='#1C2A38';cx.beginPath();cx.arc(MG_W/2,by+70,52,0,6.28);cx.fill();
      cx.fillStyle=cor;cx.beginPath();cx.moveTo(bx,by+bh);cx.quadraticCurveTo(bx+10,by+130,MG_W/2,by+128);cx.quadraticCurveTo(bx+bw-10,by+130,bx+bw,by+bh);cx.fill();}
    cx.restore();
    if(fotoMvp&&fotoMvp.ok){cx.save();cx.beginPath();cx.roundRect(MG_W/2+150,by+64,130,174,[60,60,6,6]);cx.clip();cx.drawImage(fotoMvp,MG_W/2+150,by+64,130,174);cx.restore();}
    /* mesa */
    cx.fillStyle='#10171F';cx.fillRect(60,282,MG_W-120,20);
    cx.fillStyle=cor;cx.fillRect(60,302,MG_W-120,MG_H-302);
    cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(60,302,MG_W-120,5);
    if(escudoT&&escudoT.ok){cx.drawImage(escudoT,96,312,46,46);cx.drawImage(escudoT,MG_W-142,312,46,46);}
    /* placa com o nome */
    cx.fillStyle='#ECE8E1';cx.fillRect(MG_W/2-120,314,240,28);
    cx.fillStyle='#0F1923';cx.font='400 20px "Bebas Neue", Impact, sans-serif';cx.textAlign='center';
    cx.fillText(((g.nome||'Treinador')+' · '+(souTreinador()?'head coach':'diretoria')).toUpperCase(),MG_W/2,335);
    if(dados.mvp){cx.fillStyle='#ECE8E1';cx.fillRect(MG_W/2+150,314,130,28);cx.fillStyle='#0F1923';cx.fillText(dados.mvp.nome.toUpperCase(),MG_W/2+215,335);}
    /* microfones */
    COL_IMPRENSA.slice(0,5).forEach(([,,c2],k)=>{const x=MG_W/2-110+k*55,y=232+(k%2)*8;
      cx.strokeStyle='#0B0F14';cx.lineWidth=4;cx.beginPath();cx.moveTo(x,y+18);cx.lineTo(x+(k-2)*4,284);cx.stroke();
      cx.fillStyle='#1A1F25';cx.beginPath();cx.roundRect(x-8,y-14,16,32,8);cx.fill();
      cx.fillStyle=c2;cx.fillRect(x-11,y+10,22,12);});
    /* flashes dos fotógrafos */
    for(let k=flashes.length-1;k>=0;k--){const f=flashes[k];if(f.atraso>0){f.atraso-=dt;continue;}f.vida-=dt;if(f.vida<=0){flashes.splice(k,1);continue;}
      const r=cx.createRadialGradient(f.x,f.y,2,f.x,f.y,160);r.addColorStop(0,`rgba(255,255,255,${Math.min(0.9,f.vida*3)})`);r.addColorStop(1,'rgba(255,255,255,0)');
      cx.fillStyle=r;cx.fillRect(f.x-160,f.y-160,320,320);}
    if(Math.random()<dt*0.8)flashes.push({x:Math.random()*MG_W,y:440+Math.random()*80,vida:0.2,atraso:0});
    hudRange(ctx,{restante:1-Math.max(0,i)/dados.perguntas.length,rot1:'pergunta',pts:Math.min(i+1,dados.perguntas.length)+'/'+dados.perguntas.length,
      rot2:'clima',v2:vals.length?Math.round(soma/vals.length*100):'—',combo:0});
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/* cartão na Central quando há coletiva marcada */
function cardColetiva(){
  if(typeof minigamesLigados==='function'&&!minigamesLigados())return '';
  const c=typeof coletivaPendente==='function'&&coletivaPendente();
  if(!c)return '';
  const resta=c.ate-((G.ano||0)*SEMANAS_ANO+(G.semana||1));
  return `<div class="card mg-card mg-card-col">
    <div class="mg-card-arte" aria-hidden="true"><svg viewBox="0 0 80 80"><rect x="22" y="12" width="14" height="36" rx="7" fill="#ECE8E1"/><path d="M29 48v18M19 66h20" stroke="#ECE8E1" stroke-width="3"/>
      <rect x="46" y="20" width="12" height="30" rx="6" fill="#FF4655"/><path d="M52 50v16" stroke="#FF4655" stroke-width="3"/></svg></div>
    <div class="mg-card-t"><div class="eyebrow">Coletiva de imprensa</div>
      <div class="mg-card-e"><b>${esc(contextoColetivaTxt(c))}</b> A imprensa espera você${resta>0?` (até ${resta+1} semana${resta?'s':''})`:' nesta semana'}. Respostas certas sobem a moral, a torcida e a confiança da diretoria.</div></div>
    <div class="mg-card-acao"><button class="btn ghost sm" data-coletivaass>Assessoria responde</button><button class="btn" data-coletiva>Ir para a coletiva</button></div>
  </div>`;
}
