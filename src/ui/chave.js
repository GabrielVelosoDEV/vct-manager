/* ============================================================
   CHAVEAMENTO DESENHADO (pacote V3)
   ------------------------------------------------------------
   A dupla eliminação do jogo não guarda uma árvore: ela decide cada
   rodada pelo tamanho das listas (core/formatos.js). Para desenhar a
   chave inteira — inclusive os jogos que ainda não têm times — o
   esqueleto roda a MESMA máquina (faseDE, paresDE, avancarDE) com
   fichas no lugar dos clubes: "semente 3", "vencedor do jogo 2 da
   rodada 1", "perdedor do jogo 1 da rodada 2". A estrutura não depende
   de quem ganha, só da posição nas listas, então o esqueleto é exato.
   Depois os resultados reais preenchem as fichas.

   Com o esqueleto, cada caixa sabe de onde vêm os dois times e para
   onde vai o perdedor: é daí que saem as linhas e o "perdedor → …".
   ============================================================ */
const BK={w:176,h:56,gapX:40,slot:72,topo:26};

function esqueletoDE(n){
  const S=i=>({k:'S',i});
  const st={ub:[...Array(n)].map((_,i)=>S(i)),lb:[],fila:[],elim:[]};
  const rodadas=[];
  for(let guarda=0;guarda<40;guarda++){
    const f=faseDE(st);
    const pr=paresDE(st);
    if(!pr.pares.length&&f==='gf')break;
    const r=rodadas.length;
    const nome=nomeRodadaDE(st);
    const jogos=pr.pares.map(([a,b])=>({a,b}));
    rodadas.push({fase:pr.fase,nome,jogos});
    if(!jogos.length)break;
    const venc=[...(pr.byes||[]),...jogos.map((j,m)=>({k:'W',r,m}))];
    const perd=jogos.map((j,m)=>({k:'L',r,m}));
    avancarDE(st,venc,perd,pr.fase);
    if(pr.fase==='gf')break;
  }
  return rodadas;
}

/* esqueleto + resultados reais */
function chaveDoStage(s){
  const esq=esqueletoDE(s.times.length);
  const res={};
  const resolve=tok=>{
    if(!tok)return null;
    if(tok.k==='S')return s.times[tok.i]||null;
    const r=res[tok.r+'-'+tok.m];if(!r)return null;
    const perde=r.v===r.a?r.b:r.a;
    return tok.k==='W'?r.v:perde;
  };
  const feitas=s.chave||[];
  esq.forEach((R,ri)=>{
    const reais=ri<feitas.length?feitas[ri].jogos:null;
    const pend=ri===feitas.length&&!s.feito?(s.rodadaAtual||[]):null;
    R.jogos.forEach((J,mi)=>{
      J.ta=resolve(J.a);J.tb=resolve(J.b);
      if(reais){
        const r=reais.find(x=>(x.a===J.ta&&x.b===J.tb)||(x.a===J.tb&&x.b===J.ta))||reais[mi];
        if(r){res[ri+'-'+mi]=r;J.r=r;J.ta=r.a;J.tb=r.b;}
      }else if(pend){
        const p=pend.find(([a,b])=>(a===J.ta&&b===J.tb)||(a===J.tb&&b===J.ta))||pend[mi];
        if(p){J.ta=p[0];J.tb=p[1];J.prox=true;}
      }
    });
  });
  return esq;
}

/* rótulos curtos das colunas */
function rotulosDaChave(esq){
  const ub=esq.filter(r=>r.fase==='ub'),lb=esq.filter(r=>r.fase==='lb');
  const nUb=['Final superior','Semifinal superior','Quartas superiores','Oitavas superiores'];
  esq.forEach(r=>{
    if(r.fase==='ub'){const i=ub.length-1-ub.indexOf(r);r.rot=nUb[i]||('Superior R'+(ub.indexOf(r)+1));}
    else if(r.fase==='lb'){const i=lb.indexOf(r),k=lb.length;
      r.rot=i===k-1?'Final inferior':i===k-2?'Semifinal inferior':'Inferior R'+(i+1);}
    else r.rot='Grande final';
  });
}

function chaveDesenhada(s,opc){
  opc=opc||{};
  const eu=meu&&meu();
  const esq=chaveDoStage(s);
  if(!esq.length)return '';
  rotulosDaChave(esq);
  const ub=esq.filter(r=>r.fase==='ub'),lb=esq.filter(r=>r.fase==='lb'),gf=esq.find(r=>r.fase==='gf');
  const U=ub.length,L=lb.length,cols=Math.max(U,L)+(gf?1:0);
  const X=c=>c*(BK.w+BK.gapX);
  /* a última rodada de cima fica alinhada com a última de baixo */
  const colUb=u=>u<U-1?u:Math.max(U,L)-1;
  const colLb=l=>l;
  const pos={};                       /* 'r-m' → {x,y} */
  const ri=r=>esq.indexOf(r);
  /* posiciona uma seção (superior ou inferior). A ordem da primeira coluna
     sai de trás para a frente — do último jogo da seção para os que o
     alimentam — para a árvore não se cruzar (o jogo pareia 1º×4º e 2º×3º, e
     na ordem natural as linhas se cruzariam). Depois, cada jogo fica na
     altura média de quem o alimenta, e nenhum encosta no outro. */
  const secao=(rods,col,y0)=>{
    if(!rods.length)return y0;
    const fase=rods[0].fase;
    const alimenta=J=>[J.a,J.b].filter(t=>t&&t.k==='W'&&esq[t.r]&&esq[t.r].fase===fase);
    const ordem=[],visto=new Set();
    const dfs=(r,m)=>{const k=r+'-'+m;if(visto.has(k))return;visto.add(k);
      const J=esq[r].jogos[m],fs=alimenta(J);
      if(!fs.length){ordem.push(k);return;}
      fs.forEach(t=>dfs(t.r,t.m));};
    const ult=rods[rods.length-1];
    ult.jogos.forEach((J,m)=>dfs(ri(ult),m));
    rods.forEach(R=>R.jogos.forEach((J,m)=>{if(!alimenta(J).length&&!visto.has(ri(R)+'-'+m)){visto.add(ri(R)+'-'+m);ordem.push(ri(R)+'-'+m);}}));
    const folhas=new Map(ordem.map((k,i)=>[k,i]));
    let maxY=y0;
    rods.forEach((R,k)=>{
      const ys=R.jogos.map((J,m)=>{
        const fs=alimenta(J).map(t=>pos[t.r+'-'+t.m]).filter(Boolean);
        if(fs.length)return fs.reduce((a,p)=>a+p.y,0)/fs.length;
        const i=folhas.has(ri(R)+'-'+m)?folhas.get(ri(R)+'-'+m):m;
        return y0+i*BK.slot+(BK.slot-BK.h)/2;
      });
      /* sem sobreposição dentro da coluna */
      const idx=ys.map((y,m)=>m).sort((a,b)=>ys[a]-ys[b]);
      let ultimoY=-1e9;
      idx.forEach(m=>{let y=Math.max(ys[m],ultimoY+BK.h+18);ys[m]=y;ultimoY=y;});
      R.jogos.forEach((J,m)=>{pos[ri(R)+'-'+m]={x:X(col(k)),y:ys[m]};maxY=Math.max(maxY,ys[m]+BK.h);});
    });
    return maxY;
  };
  const fimUb=secao(ub,colUb,BK.topo);
  const iniLb=fimUb+84;
  const fimLb=lb.length?secao(lb,colLb,iniLb+BK.topo):fimUb;
  if(gf){
    const fu=ub.length?pos[ri(ub[U-1])+'-0']:null,fl=lb.length?pos[ri(lb[L-1])+'-0']:null;
    const y=fu&&fl?(fu.y+fl.y)/2:(fu||fl||{y:BK.topo}).y;
    pos[ri(gf)+'-0']={x:X(cols-1),y};
  }
  const W=X(cols-1)+BK.w+12,H=Math.max(fimLb,fimUb)+40;

  /* caminho do campeão */
  const campeao=s.feito&&s.ranking?s.ranking[0]:null;
  const naRota=J=>campeao&&J.r&&(J.ta===campeao||J.tb===campeao);
  /* para onde vai o perdedor de cada jogo de cima */
  const destinoPerdedor={};
  esq.forEach(R=>R.jogos.forEach(J=>[J.a,J.b].forEach(t=>{if(t&&t.k==='L')destinoPerdedor[t.r+'-'+t.m]=R.rot;})));

  /* linhas */
  const linhas=[];
  esq.forEach(R=>R.jogos.forEach((J,m)=>{
    const alvo=pos[ri(R)+'-'+m];if(!alvo)return;
    [J.a,J.b].forEach(t=>{
      if(!t||t.k!=='W')return;
      const o=pos[t.r+'-'+t.m];if(!o)return;
      const x1=o.x+BK.w,y1=o.y+BK.h/2,x2=alvo.x,y2=alvo.y+BK.h/2,xm=x2-BK.gapX/2;
      const origem=esq[t.r].jogos[t.m];
      const ouro=campeao&&origem.r&&origem.r.v===campeao&&naRota(J);
      linhas.push(`<path class="${ouro?'ouro':''}${origem.r?' feita':''}" d="M${x1} ${y1}H${xm}V${y2}H${x2}"/>`);
    });
  }));

  const linhaTime=(id,placar,ganhou,fim)=>{
    const t=id&&G.times[id];
    return `<div class="bk-l ${fim?(ganhou?'w':'l'):''} ${eu&&id===eu.id?'me':''} ${t?'':'tbd'}">
      ${t?escudo(t,18):'<span class="bk-vazio"></span>'}
      <span class="bk-tag">${t?esc(t.tag):'a definir'}</span>
      <b>${placar==null?'':placar}</b></div>`;
  };
  const caixas=[];
  esq.forEach(R=>R.jogos.forEach((J,m)=>{
    const p=pos[ri(R)+'-'+m];if(!p)return;
    const r=J.r,fim=!!r;
    const wa=r?(r.a===J.ta?r.wa:r.wb):null,wb=r?(r.a===J.ta?r.wb:r.wa):null;
    const abre=r&&r.n!=null?` data-serie="${esc(s.id)}|${r.n}"`:'';
    const titulo=r?` title="${esc(nomeT(J.ta)+' '+wa+'–'+wb+' '+nomeT(J.tb)+(r.mapa?' · '+r.mapa:''))}"`:'';
    const drop=R.fase==='ub'&&destinoPerdedor[ri(R)+'-'+m];
    caixas.push(`<div class="bk-jogo ${J.prox?'prox':''} ${fim?'feito':''} ${naRota(J)?'rota':''} ${R.fase==='gf'?'gf':''}"
      style="left:${p.x}px;top:${p.y}px"${abre}${titulo}>
      ${linhaTime(J.ta,wa,r&&r.v===J.ta,fim)}${linhaTime(J.tb,wb,r&&r.v===J.tb,fim)}
      ${J.prox?'<span class="bk-agora">a jogar</span>':''}
      ${R.fase==='gf'?'<span class="bk-md">MD5</span>':''}
      ${drop&&!opc.compacta?`<span class="bk-drop">perdedor → ${esc(drop)}</span>`:''}
    </div>`);
  }));

  /* rótulos das colunas */
  const rots=[];
  ub.forEach((R,k)=>rots.push(`<div class="bk-col" style="left:${X(colUb(k))}px;top:0">${esc(R.rot)}</div>`));
  lb.forEach((R,k)=>rots.push(`<div class="bk-col" style="left:${X(colLb(k))}px;top:${iniLb}px">${esc(R.rot)}</div>`));
  /* troféu sobre a grande final */
  let topoGf='';
  if(gf){
    const p=pos[ri(gf)+'-0'];
    const arq=typeof arquivoTrofeu==='function'&&s.torneioId?arquivoTrofeu(s.torneioId):null;
    topoGf=`<div class="bk-gf-topo" style="left:${p.x}px;top:${Math.max(0,p.y-118)}px;width:${BK.w}px">
      ${imgTrofeu(arq,46,'Troféu')}<div class="bk-col">Grande final</div></div>`;
  }
  const sede=typeof sedeDe==='function'?sedeDe(s.torneioId):null;
  const fundo=sede&&typeof fundoCidade==='function'?` style="${fundoCidade(sede.slug,0.9)}"`:'';
  return `<div class="bk-palco bkr-${esc(s.regiao||'INT')}"${fundo}>
    <div class="bk-rolagem"><div class="bk" style="width:${W}px;height:${H}px">
      <svg class="bk-linhas" width="${W}" height="${H}">${linhas.join('')}</svg>
      ${lb.length?`<div class="bk-sep" style="top:${iniLb-24}px;width:${W}px"><span>Chave inferior</span></div>`:''}
      ${rots.join('')}${topoGf}${caixas.join('')}
    </div></div>
    ${campeao&&!opc.compacta?`<div class="bk-campeao">${imgTrofeu(typeof arquivoTrofeu==='function'?arquivoTrofeu(s.torneioId):null,30,'Troféu')}
      <span class="dim">Campeão</span>${timeInline(campeao,22)}</div>`:''}
  </div>`;
}

/* ---------- fase suíça em colunas por campanha ---------- */
function suicoDesenhado(s){
  const eu=meu&&meu();
  const reg={};s.times.forEach(id=>reg[id]={v:0,d:0});
  const rodadas=[];
  for(const r of s.resultados||[]){
    const m=/(\d+)\s+de/.exec(r.rd||'');const k=m?(+m[1]-1):0;
    const R=rodadas[k]||(rodadas[k]={grupos:{}});
    const chave=reg[r.a].v+'–'+reg[r.a].d;
    (R.grupos[chave]=R.grupos[chave]||[]).push(r);
  }
  /* aplica os resultados rodada a rodada para a campanha de antes de cada jogo */
  const reg2={};s.times.forEach(id=>reg2[id]={v:0,d:0});
  const cols=[];
  for(let k=0;k<rodadas.length;k++){
    const jogos=(s.resultados||[]).filter(r=>{const m=/(\d+)\s+de/.exec(r.rd||'');return (m?+m[1]-1:0)===k;});
    const grupos={};
    for(const r of jogos){const c=reg2[r.a].v+'–'+reg2[r.a].d;(grupos[c]=grupos[c]||[]).push(r);}
    for(const r of jogos){const p=r.v===r.a?r.b:r.a;reg2[r.v].v++;reg2[p].d++;}
    cols.push({nome:'Rodada '+(k+1),grupos});
  }
  if(!s.feito&&s.rodadaAtual&&s.rodadaAtual.length){
    const grupos={};
    for(const [a,b] of s.rodadaAtual){const c=reg2[a].v+'–'+reg2[a].d;(grupos[c]=grupos[c]||[]).push({a,b,prox:true});}
    cols.push({nome:'Rodada '+(cols.length+1),grupos,agora:true});
  }
  const caixa=r=>{
    const fim=!r.prox;
    const l=(id,w,ganhou)=>{const t=G.times[id];return `<div class="bk-l ${fim?(ganhou?'w':'l'):''} ${eu&&id===eu.id?'me':''}">
      ${t?escudo(t,18):''}<span class="bk-tag">${t?esc(t.tag):'—'}</span><b>${fim?w:''}</b></div>`;};
    return `<div class="bk-jogo solto ${r.prox?'prox':'feito'}"${fim&&r.n!=null?` data-serie="${esc(s.id)}|${r.n}" title="${esc(r.mapa||'')}"`:''}>
      ${l(r.a,r.wa,r.v===r.a)}${l(r.b,r.wb,r.v===r.b)}${r.prox?'<span class="bk-agora">a jogar</span>':''}</div>`;
  };
  const ord=s.feito&&s.ranking.length?s.ranking:ordenarSwiss(s);
  const final=`<div class="sui-col sui-fim"><div class="bk-col">${s.feito?'Classificação final':'Campanha agora'}</div>
    ${ord.map((id,i)=>{const su=s.suico[id];return `<div class="sui-seed ${eu&&id===eu.id?'me':''}">
      <span class="num">${i+1}</span>${escudo(G.times[id],18)}<b>${esc(tagT(id))}</b><span class="num dim">${su.v}–${su.d}</span></div>`;}).join('')}</div>`;
  return `<div class="bk-palco bkr-INT"><div class="sui">
    ${cols.map(c=>`<div class="sui-col ${c.agora?'agora':''}"><div class="bk-col">${esc(c.nome)}</div>
      ${Object.keys(c.grupos).sort((a,b)=>parseInt(b)-parseInt(a)||parseInt(a.split('–')[1])-parseInt(b.split('–')[1]))
        .map(g=>`<div class="sui-grupo"><div class="sui-rec">${g}</div>${c.grupos[g].map(caixa).join('')}</div>`).join('')}</div>`).join('')}
    ${final}</div></div>`;
}
