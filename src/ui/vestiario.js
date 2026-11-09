/* ============================================================
   CLUBE › VESTIÁRIO — entrosamento por dupla e a cabeça do elenco
   (as contas moram em core/vestiario.js)
   ============================================================ */
let vestPar=null;   /* dupla escolhida para a ranked em duo, antes de confirmar */

function corDaDupla(v){
  /* vermelho escuro (não se entendem) → âmbar → teal (entrosados), em tons
     menos saturados que antes: a matriz é para ler, não para gritar */
  const x=clamp(v,0,100)/100;
  const h=Math.round(355+x*(168+5)) % 360;
  return `hsla(${h},${Math.round(42+x*14)}%,${Math.round(30+x*10)}%,${(0.55+x*0.35).toFixed(2)})`;
}
/* ícone de cada atividade da semana */
const ICONE_ATIV={nenhuma:'ciclo',bootcamp:'predio',ranked:'controle',stream:'microfone',jantar:'aperto',sessao:'balao',folga:'relogio'};
function barraMini(v,cls){
  const pct=Math.round(clamp(v,0,1)*100);
  return `<div class="vb"><i class="${cls||''}" style="width:${pct}%"></i><span>${pct}</span></div>`;
}
function momentoTxt(t){
  const s=t.seq||0;
  if(s>=2)return{v:s+' vitórias',sb:'seguidas — a confiança está em alta',cls:'teal'};
  if(s<=-2)return{v:-s+' derrotas',sb:'seguidas — cada uma pesa mais que a anterior',cls:'red'};
  if(s===1)return{v:'Venceu',sb:'a última série',cls:''};
  if(s===-1)return{v:'Perdeu',sb:'a última série',cls:''};
  return{v:'—',sb:'nenhuma série ainda',cls:''};
}

function vVestiario(){
  const t=meu();
  if(!t.duplas&&typeof semearDuplas==='function')semearDuplas(t);
  const tit=t.titulares.map(P).filter(Boolean);
  const res=t.elenco.map(P).filter(p=>p&&!t.titulares.includes(p.id));
  const media=(l,f)=>l.length?l.reduce((s,x)=>s+f(x),0)/l.length:0;
  const hist=t.sinHist||[];
  const ant=hist.length>4?hist[hist.length-5]:null;
  const tend=ant==null?null:Math.round(t.sinergia)-ant;
  const mom=momentoTxt(t);

  /* matriz 5×5 dos titulares, com retrato nos dois eixos e a dupla mais
     fraca contornada */
  const pior0=(()=>{let m=null;for(const [a,b] of paresDe(t.titulares)){const v=dupla(t,a,b);if(!m||v<m.v)m={a,b,v};}return m;})();
  const ehPior=(a,b)=>pior0&&((pior0.a===a&&pior0.b===b)||(pior0.a===b&&pior0.b===a));
  const matriz=`<table class="vest-mat"><thead><tr><th></th>${tit.map(p=>
      `<th><span class="vm-col jrow" data-p="${p.id}">${retrato(p,34)}<span class="vm-nome">${esc(p.nome)}</span></span></th>`).join('')}</tr></thead><tbody>
    ${tit.map(p=>`<tr><th class="r"><span class="vm-lin jrow" data-p="${p.id}"><span class="vm-nome">${esc(p.nome)}</span>
        <span class="tag ${p.roleAtual||p.role}">${esc((p.roleAtual||p.role).slice(0,3))}</span>${retrato(p,30)}</span></th>
      ${tit.map(q=>{
        if(p.id===q.id)return `<td class="vm-eu"></td>`;
        const v=Math.round(dupla(t,p.id,q.id));
        return `<td class="vm-c ${ehPior(p.id,q.id)?'pior':''}" style="background:${corDaDupla(v)}" title="${esc(p.nome)} e ${esc(q.nome)}: ${v}">${v}</td>`;
      }).join('')}</tr>`).join('')}
    </tbody></table>`;

  const reservas=res.length?`<div class="eyebrow" style="margin-top:14px">Reservas · média com os titulares</div>
    ${res.map(p=>{const m=media(tit,q=>dupla(t,p.id,q.id));
      return `<div class="vest-res">${retrato(p,26)}<b>${esc(p.nome)}</b> <span class="tag ${p.role}">${p.role}</span>
        <span class="vm-pill" style="background:${corDaDupla(m)}">${Math.round(m)}</span>
        <span class="dim">${m<35?'entraria sem se entender com o time':m<55?'entraria razoavelmente':'entraria bem'}</span></div>`;}).join('')}`:'';

  /* o que mexe nesta semana: agrega por motivo */
  const fat=fatoresDaSemana(t).map(f=>`<div class="vest-f ${f.delta>0?'up':'dn'}">
      <span class="num">${f.delta>0?'+':''}${f.delta.toFixed(2)}</span>
      <span>${esc(f.txt)}</span><span class="dim">${f.pares.length} dupla${f.pares.length===1?'':'s'}</span></div>`).join('')
    ||'<div class="dim">Semana neutra: nada empurrando para cima nem para baixo além dos jogos.</div>';

  /* atividade da semana */
  const atual=t.atividade||'nenhuma';
  const nomes=t.elenco.map(P).filter(Boolean);
  const par=vestPar||t.atividadePar||[tit[0]&&tit[0].id,tit[1]&&tit[1].id];
  const piorDupla=(()=>{let m=null;for(const [a,b] of paresDe(t.titulares)){const v=dupla(t,a,b);if(!m||v<m.v)m={a,b,v};}return m;})();
  const cartao=a=>{
    const e=efeitoAtividade(t,a.id),d=atividadeDisponivel(t,a.id);
    const efs=[e.duplas?`+${e.duplas} em cada dupla de titulares`:'',e.dupla?`+${e.dupla} na dupla escolhida`:'',
      e.confianca?`confiança +${Math.round(e.confianca*100)}`:'',e.desgaste?`desgaste ${e.desgaste>0?'+':''}${Math.round(e.desgaste*100)}`:'',
      e.torcida?'torcida +':'',e.custo?money(e.custo):''].filter(Boolean);
    return `<button class="vest-at ${atual===a.id?'on':''} ${d.ok?'':'off'}" data-ativ="${a.id}" ${d.ok?'':'disabled'}
        title="${esc(d.ok?a.desc:d.erro)}">
      <span class="vat-topo"><i class="vat-ic">${ico(ICONE_ATIV[a.id]||'ciclo')}</i><b>${esc(a.nome)}</b>${atual===a.id?'<span class="vat-on">esta semana</span>':''}</span>
      <span class="vat-desc">${esc(a.desc)}</span>
      ${efs.length?`<span class="vat-chips">${efs.map(x=>`<em class="${/desgaste \+|\$/.test(x)&&!/desgaste -/.test(x)?'custo':''}">${esc(x)}</em>`).join('')}</span>`:''}
      ${d.ok?'':`<span class="vat-chips"><em class="dn">${esc(d.erro)}</em></span>`}</button>`;};
  const selPar=(i)=>`<select data-vpar="${i}">${nomes.map(p=>`<option value="${p.id}" ${par[i]===p.id?'selected':''}>${esc(p.nome)}</option>`).join('')}</select>`;
  const ult=t.ultimaAtividade&&t.ultimaAtividade.ano===G.ano?atividade(t.ultimaAtividade.id).nome+' na semana '+t.ultimaAtividade.semana:null;

  /* cabeça do elenco */
  const linhas=t.elenco.map(P).filter(Boolean).sort((a,b)=>(t.titulares.includes(b.id)?1:0)-(t.titulares.includes(a.id)?1:0)||mentalDe(a)-mentalDe(b))
    .map(p=>{const c=confiancaDe(p),m=mentalDe(p);
      const nota=p.fadiga>0.82?'esgotado — desgaste cobra confiança':c<0.35?'em crise de confiança':c>0.8?'confiante':p.moral<0.35?'insatisfeito com o clube':'';
      return `<tr class="jrow ${t.titulares.includes(p.id)?'':'dim-row'}" data-p="${p.id}">
        <td><span class="merc-j">${retrato(p,26)}<span><b>${esc(p.nome)}</b>${t.titulares.includes(p.id)?'':' <span class="chip">reserva</span>'}</span></span></td>
        <td>${barraMini(c,c<0.35?'r':c>0.75?'g':'')}</td><td>${barraMini(p.moral,p.moral<0.35?'r':'')}</td>
        <td>${barraMini(p.fadiga,p.fadiga>0.7?'r':'')}</td>
        <td class="r num"><b>${Math.round(m*100)}</b></td><td class="dim">${esc(nota)}</td></tr>`;}).join('');

  return `<div class="eyebrow">Clube</div><h2 class="sec">Vestiário</h2>
  ${explica(`Em e-sports a cabeça decide mais que o cansaço. O <b>mental</b> de cada jogador
  é a confiança (sobe ganhando e jogando acima do próprio normal, cai perdendo — e cada derrota seguida pesa mais)
  somada à moral. O <b>entrosamento</b> é de cada dupla: o do time é a média das dez duplas entre os titulares.`)}
  <div class="grid g4" style="margin-bottom:16px">
    <div class="kpi ${t.sinergia>=60?'teal':t.sinergia<35?'red':''}"><div class="lb">Entrosamento</div>
      <div class="vl">${Math.round(t.sinergia)}</div>
      <div class="sb">${tend==null?'média das duplas titulares':(tend>0?'+':'')+tend+' nas últimas 4 semanas'}</div></div>
    <div class="kpi"><div class="lb">Confiança</div><div class="vl">${Math.round(media(tit,confiancaDe)*100)}</div>
      <div class="sb">média dos titulares</div></div>
    <div class="kpi"><div class="lb">Desgaste</div><div class="vl">${Math.round(media(tit,p=>p.fadiga)*100)}</div>
      <div class="sb">pesa até 8% em jogo</div></div>
    <div class="kpi ${mom.cls}"><div class="lb">Momento</div><div class="vl">${esc(mom.v)}</div>
      <div class="sb">${esc(mom.sb)}</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><div class="eyebrow">Entrosamento entre os titulares</div>
      ${tit.length>=2?matriz:'<div class="empty">Escale os titulares para ver as duplas.</div>'}
      ${piorDupla?`<div class="vest-pior">${retrato(P(piorDupla.a),36)}${retrato(P(piorDupla.b),36)}
        <div><span class="eyebrow">Dupla mais fraca</span><div><b>${esc(P(piorDupla.a).nome)}</b> e <b>${esc(P(piorDupla.b).nome)}</b></div>
        <span class="dim">uma ranked em duo ou um bootcamp ajudam</span></div>
        <b class="num" style="color:${corDaDupla(piorDupla.v).replace(/,[\d.]+\)$/,',1)')}">${Math.round(piorDupla.v)}</b></div>`:''}
      ${reservas}
    </div>
    <div>
      <div class="card"><div class="eyebrow">O que mexe no entrosamento nesta semana</div>${fat}
        <div class="dim" style="margin-top:8px;font-size:11.5px">Cada série jogada soma +${DUPLA_POR_SERIE} às duplas de titulares
        (mais numa decisão vencida). Jogador novo chega abaixo da média do time.</div></div>
      <div class="card"><div class="split"><div class="eyebrow">Atividade da semana</div>
        <span class="dim">${ult?'última: '+esc(ult):''}</span></div>
        <div class="vest-ats">${ATIVIDADES.map(cartao).join('')}</div>
        <div class="vest-par ${atual==='ranked'?'':'dim'}">Ranked em duo: ${selPar(0)} e ${selPar(1)}
          <button class="btn ghost sm" id="vestParOk">Marcar dupla</button>
          ${piorDupla?`<span class="dim">sugestão: a dupla mais fraca</span>`:''}</div>
        ${typeof faixaRitmo==='function'?faixaRitmo(t):''}
      </div>
    </div>
  </div>
  <div class="card"><div class="eyebrow">Cabeça do elenco</div>
    <div class="rolagem"><table class="wide"><thead><tr><th>Jogador</th><th>Confiança</th><th>Moral</th><th>Desgaste</th>
      <th class="r">Mental</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>
    <div class="dim" style="margin-top:8px;font-size:11.5px">Mental = 60% confiança + 40% moral. Preparador mental
    bom amortece as quedas e acelera a volta; um IGL de liderança alta segura o time depois de derrota.</div>
  </div>`;
}

function ligarVestiario(v,on){
  if(tela!=='vestiario')return;
  const t=meu();if(!t)return;
  on('[data-ativ]',el=>{
    const id=el.dataset.ativ;
    const par=vestPar||t.atividadePar||t.titulares.slice(0,2);
    const r=escolherAtividade(t,id,id==='ranked'?par:null);
    render();flash(r.ok?r.msg:r.erro);
  });
  v.querySelectorAll('[data-vpar]').forEach(el=>el.onchange=()=>{
    const p=(vestPar||t.atividadePar||t.titulares.slice(0,2)).slice();
    p[+el.dataset.vpar]=el.value;vestPar=p;
  });
  on('#vestParOk',()=>{
    const r=escolherAtividade(t,'ranked',vestPar||t.atividadePar||t.titulares.slice(0,2));
    if(r.ok)vestPar=null;
    render();flash(r.ok?r.msg:r.erro);
  });
}
