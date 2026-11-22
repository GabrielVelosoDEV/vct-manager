/* ============================================================
   CALENDÁRIO
   ------------------------------------------------------------
   O mês em grade, de segunda a domingo: a faixa de cada torneio
   na cor do circuito, o seu jogo de cada dia (adversário e placar,
   ou "previsto" quando a chave ainda não saiu), a janela de
   transferências e o dia de hoje. Clicar num dia abre o que houve
   (ou vai haver) nele, e dá para simular até lá: o jogo anda dia a
   dia e para antes se aparecer algo seu (o seu jogo, se você não
   marcou para simular os seus também; veredito; conselho; Copa).

   Datas futuras de torneio que ainda não montou ficam só com a
   faixa: os confrontos e os dias saem quando a chave sai.
   ============================================================ */
let calMes=null, calSel=null, calFiltro='meus', calMeusJogos=false;

const DIA_MS=86400000;
function _calIni(){return segundaDaSemana(G.ano,1).getTime();}
/* data → {semana, dia} dentro da temporada (null fora dela) */
function _calSD(ms){
  const d=Math.round((ms-_calIni())/DIA_MS);
  if(d<0||d>=SEMANAS_ANO*7)return null;
  return{semana:Math.floor(d/7)+1,dia:d%7};
}
function _calMs(semana,dia){return _calIni()+((semana-1)*7+dia)*DIA_MS;}
function _calHoje(){return{semana:G.semana||1,dia:G.turno||0};}
function _calCmp(a,b){return (a.semana-b.semana)*7+(a.dia-b.dia);}

/* Tudo o que o calendário sabe da temporada, indexado por "semana|dia":
   o que foi jogado (resultados), a rodada de hoje e as previstas do bloco
   em andamento. Montado a cada tela, a partir do estado. */
function _calIndice(){
  const meu=typeof clubeVisto==='function'&&clubeVisto()?clubeVisto().id:(G.meuTime||null);
  const idx={};
  const em=(k)=>idx[k]||(idx[k]={jogos:[],previstos:[],meu:null,rodadas:0});
  for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[]){
    if(r.ano&&r.ano!==G.ano)continue;
    const sem=r.sem||b.ini, dia=r.dia!=null?r.dia:4;
    const x=em(sem+'|'+dia);
    x.jogos.push({s,r,b});
    if(meu&&(r.a===meu||r.b===meu))x.meu={tipo:'jogado',s,r,b,adv:r.a===meu?r.b:r.a,venceu:r.v===meu,placar:r.a===meu?r.wa+'–'+r.wb:r.wb+'–'+r.wa};
  }
  /* o que ainda vai acontecer nesta semana e nas próximas do bloco montado */
  const hoje=_calHoje();
  const bi=typeof blocoDaSemana==='function'?blocoDaSemana(hoje.semana):null;
  const b=bi==null?null:G.calendario[bi];
  if(b&&b.stages&&b.stages.length){
    const pl=typeof planoDaSemana==='function'?planoDaSemana():{passos:0,dias:[]};
    const feitos=typeof passosFeitos==='function'?passosFeitos():0;
    /* a rodada já sorteada (a próxima) tem confronto conhecido */
    for(let k=feitos;k<pl.passos;k++){
      const dia=Math.max(hoje.dia,pl.dias[k]);
      const x=em(hoje.semana+'|'+dia);x.rodadas++;
      if(k===feitos){
        for(const s of b.stages){if(s.feito)continue;
          for(const par of (s.rodadaAtual||[])){
            x.previstos.push({s,par,b});
            if(meu&&par.includes(meu))x.meu={tipo:'marcado',s,b,adv:par[0]===meu?par[1]:par[0]};
          }}
      }else if(meu&&_calSegueVivo(b,meu)&&!x.meu)x.meu={tipo:'previsto',b};
    }
    /* semanas seguintes do bloco: o ritmo que o relógio vai usar */
    let falta=Math.max(0,...b.stages.map(s=>typeof rodadasDoStage==='function'?rodadasDoStage(s):0))-(pl.passos-feitos);
    for(let w=hoje.semana+1;w<=b.fim&&falta>0;w++){
      const p=Math.max(1,Math.ceil(falta/(b.fim-w+1)));
      falta-=p;
      for(const dia of diasDeJogo(p)){
        const x=em(w+'|'+dia);x.rodadas++;
        if(meu&&_calSegueVivo(b,meu)&&!x.meu)x.meu={tipo:'previsto',b};
      }
    }
  }
  return{idx,meu};
}
/* o clube ainda joga neste bloco? (grupos e suíça: até acabar; chave: vivo) */
function _calSegueVivo(b,id){
  return b.stages.some(s=>{
    if(s.feito||!(s.times||[]).includes(id))return false;
    if(s.tipo==='swiss')return typeof emDisputaSwiss==='function'?emDisputaSwiss(s,id):true;
    if(s.tipo==='de')return !(s.elim||[]).includes(id);
    if(s.tipo==='ko')return (s.vivos||[]).includes(id);
    return true;
  });
}

function vCalendario(){
  if(!G||!G.calendario)return '';
  const hoje=_calHoje();
  const hojeMs=_calMs(hoje.semana,hoje.dia);
  if(calMes==null){const d=new Date(hojeMs);calMes={a:d.getUTCFullYear(),m:d.getUTCMonth()};}
  if(!calSel)calSel=Object.assign({},hoje);
  const {idx,meu}=_calIndice();
  /* limites da temporada para navegar */
  const iniMs=_calIni(), fimMs=_calMs(SEMANAS_ANO,6);
  const primeiroMes=new Date(iniMs), ultimoMes=new Date(fimMs);
  const mesIdx=(a,m)=>a*12+m;
  const pode=d=>{const k=mesIdx(calMes.a,calMes.m)+d;return k>=mesIdx(primeiroMes.getUTCFullYear(),primeiroMes.getUTCMonth())&&k<=mesIdx(ultimoMes.getUTCFullYear(),ultimoMes.getUTCMonth());};
  /* a grade: da segunda antes do dia 1 até o domingo depois do último dia */
  const dia1=Date.UTC(calMes.a,calMes.m,1), ultimo=Date.UTC(calMes.a,calMes.m+1,0);
  const dow=(new Date(dia1).getUTCDay()+6)%7;
  const ini=dia1-dow*DIA_MS;
  const celulas=[];
  for(let ms=ini;ms<=ultimo||((ms-ini)/DIA_MS)%7!==0;ms+=DIA_MS)celulas.push(ms);
  const mt=typeof clubeVisto==='function'?clubeVisto():null;
  const cel=ms=>{
    const d=new Date(ms),fora=d.getUTCMonth()!==calMes.m;
    const sd=_calSD(ms);
    if(!sd)return `<div class="cal-d vazio ${fora?'fora':''}"><span class="cal-n">${d.getUTCDate()}</span></div>`;
    const bi=blocoDaSemana(sd.semana),b=bi==null?null:G.calendario[bi];
    const cc=b&&typeof circuitoDoBloco==='function'?circuitoDoBloco(b):null;
    const info=idx[sd.semana+'|'+sd.dia];
    const c=_calCmp(sd,hoje), passado=c<0, ehHoje=c===0;
    const sel=calSel&&calSel.semana===sd.semana&&calSel.dia===sd.dia;
    const janela=typeof janelaAberta==='function'&&janelaAberta(G.ano,sd.semana);
    const iniBloco=b&&(sd.semana===b.ini&&sd.dia===0||(d.getUTCDate()===1)||sd.dia===0&&sd.semana===b.ini);
    let corpo='';
    const m=info&&info.meu;
    if(m&&m.adv){
      const t=G.times[m.adv];
      corpo=`<div class="cal-meu ${m.tipo==='jogado'?(m.venceu?'v':'d'):'prox'}">${escudo(t,22)}<span>${esc(t?t.tag:'')}</span>
        ${m.tipo==='jogado'?`<b class="num">${m.placar}</b>`:'<b>vs</b>'}</div>`;
    }else if(m&&m.tipo==='previsto'){
      corpo=`<div class="cal-meu prev">${mt?escudo(mt,16):''}<span>jogo previsto</span></div>`;
    }
    const outros=info?(calFiltro==='todos'?(info.jogos.length+info.previstos.length||info.rodadas):0):0;
    return `<button class="cal-d ${fora?'fora':''} ${passado?'passado':''} ${ehHoje?'hoje':''} ${sel?'sel':''} ${janela?'janela':''} ${m?'tem-meu':''}"
      data-caldia="${sd.semana}|${sd.dia}" ${cc?`style="--cc:${cc.cor}"`:''}>
      ${b&&b.stages!==undefined&&!/^Pausa|^Pré-temporada|Intervalo|Offseason/i.test(b.nome)?`<i class="cal-faixa"></i>`:''}
      <span class="cal-n">${d.getUTCDate()}</span>${ehHoje?'<span class="cal-hoje">hoje</span>':''}
      ${iniBloco&&b?`<span class="cal-bl">${esc(nomeBloco(b,mt))}</span>`:''}
      ${corpo}
      ${outros?`<span class="cal-out">${outros} ${info.jogos.length?'série'+(outros>1?'s':''):'rodada'+(outros>1?'s':'')}</span>`:''}
    </button>`;
  };
  const sel=calSel;
  const selInfo=idx[sel.semana+'|'+sel.dia];
  const sbi=blocoDaSemana(sel.semana),sb=sbi==null?null:G.calendario[sbi];
  const selMs=_calMs(sel.semana,sel.dia),selD=new Date(selMs);
  const futuro=_calCmp(sel,hoje)>0;
  const linhaSerie=(a,bb,r,s)=>{const A=G.times[a],B=G.times[bb];
    return `<div class="cal-s ${meu&&(a===meu||bb===meu)?'meu':''}"><span class="cal-st">${esc((s&&s.nome||'').replace(/^.*?·\s*/,''))}</span>
      <span class="cal-t ${r&&r.v===a?'w':''}">${A?escudo(A,18):''}${esc(A?A.tag:'?')}</span>
      <b class="num">${r?r.wa+' – '+r.wb:'vs'}</b>
      <span class="cal-t r ${r&&r.v===bb?'w':''}">${esc(B?B.tag:'?')}${B?escudo(B,18):''}</span></div>`;};
  const lista=selInfo?[
    ...selInfo.jogos.filter(x=>calFiltro==='todos'||(meu&&(x.r.a===meu||x.r.b===meu))).map(x=>linhaSerie(x.r.a,x.r.b,x.r,x.s)),
    ...selInfo.previstos.filter(x=>calFiltro==='todos'||(meu&&x.par.includes(meu))).map(x=>linhaSerie(x.par[0],x.par[1],null,x.s))]:[];
  const painel=`<aside class="cal-p">
    <div class="eyebrow">${DIAS_LONGO[sel.dia]}</div>
    <h3 class="cal-pd">${selD.getUTCDate()} de ${MESES[selD.getUTCMonth()].toLowerCase()}</h3>
    ${sb?`<div class="cal-pb" style="--cc:${circuitoDoBloco(sb).cor}">${icone(circuitoDoBloco(sb).ic)} ${esc(nomeBloco(sb,mt))}</div>`:''}
    ${selInfo&&selInfo.meu&&selInfo.meu.tipo==='previsto'?`<p class="dim">O seu clube deve jogar neste dia; o adversário sai quando a rodada for sorteada.</p>`:''}
    ${lista.length?`<div class="cal-sl">${lista.join('')}</div>`
      :selInfo&&(selInfo.jogos.length||selInfo.previstos.length)?`<p class="dim">${selInfo.jogos.length+selInfo.previstos.length} série${selInfo.jogos.length+selInfo.previstos.length>1?'s':''} neste dia, nenhuma sua. <a href="#" data-calf="todos">Ver todas</a>.</p>`
      :selInfo&&selInfo.rodadas?`<p class="dim">${selInfo.rodadas} rodada${selInfo.rodadas>1?'s':''} prevista${selInfo.rodadas>1?'s':''} neste dia; os confrontos saem no sorteio.</p>`
      :`<p class="dim">${sb&&sb.stages&&!sb.stages.length&&sb.montar?'Torneio ainda não montado: as datas dos jogos saem quando a chave sair.':'Sem jogos '+(calFiltro==='meus'?'seus ':'')+'neste dia.'}</p>`}
    ${futuro?`<div class="cal-sim">
      <label class="cal-chk"><input type="checkbox" id="calMeus" ${calMeusJogos?'checked':''}> simular os meus jogos também</label>
      <button class="btn" id="calSimular">${icone('duplo')} Simular até ${selD.getUTCDate()} ${MESES_CURTO[selD.getUTCMonth()]}</button>
      <p class="dim">${calMeusJogos?'Os seus jogos no caminho são simulados sem veto nem transmissão.':'Para antes de cada jogo seu, para você jogar ou ver o veto.'} Para também em veredito, conselho e momentos de Copa.</p></div>`
      :_calCmp(sel,hoje)===0?`<p class="cal-hj">${icone('relogio')} Hoje</p>`:''}
  </aside>`;
  return `<div class="cal">
    <div class="cal-top">
      <div class="cal-nav"><button class="btn-ic2" data-calmes="-1" ${pode(-1)?'':'disabled'} title="Mês anterior">${ico('seta_e')}</button>
        <h2 class="sec">${MESES[calMes.m]} <span class="dim">${calMes.a}</span></h2>
        <button class="btn-ic2" data-calmes="1" ${pode(1)?'':'disabled'} title="Próximo mês">${ico('seta_d')}</button>
        <button class="btn ghost sm" data-calhoje="1">Hoje</button></div>
      <div class="ec-vista"><button class="${calFiltro==='meus'?'on':''}" data-calf="meus">${icone('estrela')} Meus jogos</button><button class="${calFiltro==='todos'?'on':''}" data-calf="todos">${icone('mundo')} Todos</button></div>
    </div>
    <div class="cal-g">
      <div class="cal-grade">${DIAS_CURTO.map(d=>`<div class="cal-dh">${d}</div>`).join('')}${celulas.map(cel).join('')}</div>
      ${painel}
    </div>
    <div class="cal-leg"><span><i class="l-v"></i>vitória</span><span><i class="l-d"></i>derrota</span><span><i class="l-p"></i>jogo marcado</span><span><i class="l-pr"></i>previsto</span><span><i class="l-j"></i>janela de transferências</span></div>
  </div>`;
}
function ligarCalendario(v,on){
  on('[data-calmes]',el=>{const d=+el.dataset.calmes;let m=calMes.m+d,a=calMes.a;if(m<0){m=11;a--;}if(m>11){m=0;a++;}calMes={a,m};render();});
  on('[data-calhoje]',()=>{calMes=null;calSel=null;render();});
  on('[data-calf]',el=>{calFiltro=el.dataset.calf;render();});
  on('[data-caldia]',el=>{const [s,d]=el.dataset.caldia.split('|').map(Number);calSel={semana:s,dia:d};render();});
  const ck=v.querySelector('#calMeus');if(ck)ck.onchange=()=>{calMeusJogos=ck.checked;render();};
  const bt=v.querySelector('#calSimular');
  if(bt)bt.onclick=()=>{
    const alvo={ano:G.ano,semana:calSel.semana,dia:calSel.dia};
    if(typeof avisoMotor==='function')avisoMotor(true,'Simulando até '+rotuloDia(G.ano,alvo.semana,alvo.dia)+'…');
    setTimeout(()=>{try{avancarDiasAte(alvo,{meusJogos:calMeusJogos});}finally{if(typeof avisoMotor==='function')avisoMotor(false);}},40);
  };
}
