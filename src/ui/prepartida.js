/* ============================================================
   ANTES DA PARTIDA — relatório e veto
   ------------------------------------------------------------
   O ritual: você lê o que a sua comissão conseguiu levantar
   sobre o adversário e, com isso na mão, faz os seus bans e
   picks. O relatório vem de scout.js e o veto de veto.js; aqui
   é só a tela.

   A ordem importa. Primeiro o relatório, depois o veto: o
   objetivo é que o analista que você contratou mude o clique
   que você dá. Um clube com analista 1 chuta; um com analista 5
   sabe que mapa o adversário vai banir primeiro.
   ============================================================ */

let PP=null;   /* {comp, V, etapa:'relatorio'|'veto'} */

function prePartidaDisponivel(){
  if(!G||!G.meuTime)return null;
  if(typeof compromissoDaSemana!=='function')return null;
  return compromissoDaSemana();
}
/* Ponto de entrada: chamado pelo botão de avançar antes de a semana rodar. */
function abrirPrePartida(comp,depois){
  const meu=G.times[G.meuTime], adv=G.times[comp.advId];
  PP={comp,adv,meu,depois,etapa:'relatorio',
      V:iniciarVeto(G.meuTime,comp.advId,comp.bo,comp.euSouA)};
  vetoAvancarAteMim(PP.V);
  ppPintar();
}
function ppFechar(){
  const d=PP&&PP.depois;PP=null;
  const m=$('#modal');if(m)m.innerHTML='';
  if(d)d();
}
/* Segue sem escolher nada: o veto vira automático e a semana roda. */
function ppPular(){
  if(!PP)return;
  const V=PP.V;
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  ppConfirmar();
}
function ppConfirmar(){
  if(!PP)return;
  const V=PP.V;
  let voltas=0;
  while(!V.fim&&voltas++<40)vetoEscolher(V,null);
  const comp=PP.comp;
  const plano={stageId:comp.stage.id,veto:vetoResultado(V)};
  const d=PP.depois;PP=null;
  const m=$('#modal');if(m)m.innerHTML='';
  /* Com tempo técnico e transmissão ao vivo ligados, a SUA série é jogada
     agora, na tela, round a round — é o que faz o pedido de tempo mudar o que
     vem depois. O resultado pronto desce para o relógio, que roda o resto da
     semana em cima dele. */
  if(Prefs.get('tempoTecnico')&&Prefs.get('aoVivo')&&typeof partidaConduzida==='function'){
    const ctx={stage:comp.stage.id,nome:comp.stage.nome,semana:G.semana};
    const S=abrirSerie(comp.aId,comp.bId,comp.bo,plano.veto);
    partidaConduzida(S,ctx,res=>{
      res.semana=G.semana;
      plano.serieFeita=res;
      if(d)d(plano);
    });
    return;
  }
  if(d)d(plano);
}
function ppEscolher(mapa){
  if(!PP||!PP.V)return;
  if(!vetoMinhaVez(PP.V))return;
  vetoEscolher(PP.V,mapa);
  vetoAvancarAteMim(PP.V);
  ppPintar();
}
function ppIrParaVeto(){if(PP){PP.etapa='veto';ppPintar();}}

/* ---------- desenho ---------- */
function ppPintar(){
  if(!PP)return;
  abrir(PP.etapa==='relatorio'?ppRelatorioHTML():ppVetoHTML(),true);
  const M=$('#modal');
  M.querySelectorAll('[data-ppmapa]').forEach(b=>b.onclick=()=>ppEscolher(b.dataset.ppmapa));
  const li=M.querySelector('#ppVeto');if(li)li.onclick=ppIrParaVeto;
  const lp=M.querySelector('#ppPular');if(lp)lp.onclick=ppPular;
  const lc=M.querySelector('#ppOk');if(lc)lc.onclick=ppConfirmar;
  const lv=M.querySelector('#ppVoltar');if(lv)lv.onclick=()=>{PP.etapa='relatorio';ppPintar();};
}
function ppRelatorioHTML(){
  const r=relatorioScout(PP.meu,PP.adv,PP.comp.bo);
  const estrelas=n=>'●'.repeat(n)+'○'.repeat(SCOUT_MAX-n);
  const mapas=r.mapas.map(m=>`<tr>
    <td>${esc(m.mapa)}</td>
    <td class="c">${m.valor===null?'<span class="dim">—</span>'
      :`<span class="pill ${m.valor>=1.5?'g':m.valor<=-1.5?'r':''}">${m.valor>0?'+':''}${m.valor.toFixed(1)}</span>`}</td>
    <td class="dim">${m.palavra?esc(m.palavra):'sem leitura'}</td>
    <td class="dim" style="font-size:11px">${m.comp
      ?m.comp.map(c=>esc(c.ag)+(c.nivel!==null?' <span class="num">'+c.nivel+'</span>':'')).join(' · ')
      :'<span class="dim">comp desconhecida</span>'}</td></tr>`).join('');
  return `<div class="split">
      <div><div class="eyebrow">Relatório de scouting</div>
        <h2 class="sec" style="margin:0">${esc(PP.adv.nome)}</h2></div>
      <div style="text-align:right">
        <div class="eyebrow">Nível do relatório</div>
        <b class="num">${estrelas(r.nivel)}</b>
        <div class="dim" style="font-size:11px">analista ${(PP.meu.staff.analista||1).toFixed(1)} · olheiro ${(PP.meu.staff.olheiro||1).toFixed(1)}</div></div>
    </div>
    <p class="dim" style="margin:10px 0 14px">${esc(resumoScout(r))}</p>

    <div class="grid g2">
      <div class="card flat"><div class="eyebrow">Campanha</div>
        <div class="split"><span>Temporada</span><b class="num">${r.campanha.v}V ${r.campanha.d}D</b></div>
        ${r.h2h&&r.h2h.jogos?`<div class="split"><span>Contra você</span>
          <b class="num">${r.h2h.derrotas||0}–${r.h2h.vitorias||0}</b>
          <span class="dim">em ${r.h2h.jogos}</span></div>`:''}
        <div class="split"><span>Forma</span><b>${esc(r.forma.palavra)}${r.forma.valor!==null?' <span class="num">'+r.forma.valor+'%</span>':''}</b></div>
        ${r.fadiga.palavra?`<div class="split"><span>Pernas</span><b>${esc(r.fadiga.palavra)}${r.fadiga.valor!==null?' <span class="num">'+r.fadiga.valor+'%</span>':''}</b></div>`:''}
        ${r.sinergia!==null?`<div class="split"><span>Entrosamento</span><b class="num">${Math.round(r.sinergia)}</b></div>`:''}
        ${r.tatica?`<div class="split"><span>Estilo</span><b>agres ${r.tatica.agres} · ${esc(r.tatica.foco)}</b></div>`:''}
      </div>
      <div class="card flat"><div class="eyebrow">Gente</div>
        ${r.chave?`<div class="split"><span>Jogador-chave</span>
          <b>${esc(r.chave.nome)} <span class="dim">${esc(r.chave.role)}</span>
          <span class="num">${r.chave.over}</span>${r.chave.acs?' <span class="dim">ACS '+r.chave.acs+'</span>':''}</b></div>`
          :'<div class="dim">Sem leitura de elenco — precisa de analista melhor.</div>'}
        ${r.lesionados?(r.lesionados.length
          ?r.lesionados.map(l=>`<div class="split"><span>${esc(l.nome)}</span><b class="dn">${l.semanas} sem. fora</b></div>`).join('')
          :'<div class="split"><span>Lesionados</span><b>nenhum</b></div>'):''}
        ${r.vetoProvavel?`<div class="eyebrow" style="margin-top:10px">Veto provável</div>
          <div class="split"><span>Devem banir</span><b>${r.vetoProvavel.bans.map(esc).join(', ')}</b></div>
          <div class="split"><span>Devem escolher</span><b>${r.vetoProvavel.picks.map(esc).join(', ')}</b></div>`
          :'<div class="dim" style="margin-top:10px">Prever o veto deles exige relatório nível 5.</div>'}
      </div>
    </div>

    <div class="card flat"><div class="eyebrow">Mapas deles${r.nivelComp<r.nivel?' · comps parcialmente escondidas (eles fogem do meta)':''}</div>
      <table class="wide"><thead><tr><th>Mapa</th><th class="c">Leitura</th><th>Como eles jogam</th><th>Comp provável</th></tr></thead>
      <tbody>${mapas}</tbody></table>
      ${r.nivel<3?'<p class="dim" style="margin-top:8px">Com analista e olheiro melhores, este relatório traz números em vez de palavras — e, no nível 5, a ordem de veto deles.</p>':''}
    </div>

    <div class="split" style="margin-top:14px">
      <button class="btn ghost" id="ppPular">Deixar a comissão vetar</button>
      <button class="btn" id="ppVeto">Ir para o veto de mapas ›</button>
    </div>`;
}
function ppVetoHTML(){
  const V=PP.V;
  const passo=vetoPasso(V);
  const minha=vetoMinhaVez(V);
  const restam=vetoRestantes(V);
  const meuT=PP.meu, advT=PP.adv;
  const linhaSeq=V.seq.map(x=>`<span class="chip ${x.tipo==='ban'?'r':x.tipo==='dec'?'':'g'}">
      ${x.tipo==='ban'?'✕':x.tipo==='dec'?'★':'✓'} ${esc(x.m)}
      <span class="dim">${esc(x.t)}</span></span>`).join(' ');
  const cartoes=restam.map(mp=>{
    const meuA=afinidadeElenco(meuT,mp)+(meuT.mapPref[mp]||0)*0.5;
    const advA=afinidadeElenco(advT,mp)+(advT.mapPref[mp]||0)*0.5;
    const mostraAdv=nivelScout(meuT)>=3;
    return `<button class="mp-card ${minha?'':'off'}" data-ppmapa="${esc(mp)}" ${minha?'':'disabled'}>
      <div class="mp-nome">${esc(mp)}</div>
      <div class="mp-val ${meuA>=2?'up':meuA<=-2?'dn':''}">${meuA>0?'+':''}${meuA.toFixed(1)}</div>
      <div class="mp-adv">${esc(advT.tag)} ${mostraAdv?(advA>0?'+':'')+advA.toFixed(1):'?'}</div>
      <div class="mp-tag">${minha?(passo.tipo==='ban'?'banir':'escolher'):'aguardando'}</div>
    </button>`;
  }).join('');
  const mapasFinais=V.seq.filter(x=>x.tipo!=='ban');
  return `<div class="split">
      <div><div class="eyebrow">Veto de mapas · ${esc(PP.comp.stage.nome||'')} · Bo${V.bo}</div>
        <h2 class="sec" style="margin:0">${esc(meuT.tag)} <span class="dim">contra</span> ${esc(advT.tag)}</h2></div>
      <div style="text-align:right"><div class="eyebrow">Sequência</div>
        <b class="num">${V.i}/${V.passos.length}</b></div>
    </div>
    <div style="margin:10px 0">${linhaSeq||'<span class="dim">O veto começa agora.</span>'}</div>
    ${V.fim?`<div class="card flat"><div class="eyebrow">A série vai ser assim</div>
        <table class="wide"><tbody>${mapasFinais.map((x,i)=>`<tr>
          <td class="c num">${i+1}</td><td><b>${esc(x.m)}</b></td>
          <td class="dim">${x.tipo==='dec'?'decider':('escolha do '+esc(x.t))}</td>
          <td class="c"><span class="pill ${afinidadeElenco(meuT,x.m)>=1?'g':afinidadeElenco(meuT,x.m)<=-1?'r':''}"
            >você ${afinidadeElenco(meuT,x.m)>0?'+':''}${afinidadeElenco(meuT,x.m).toFixed(1)}</span></td>
          </tr>`).join('')}</tbody></table></div>`
      :`<div class="card"><div class="eyebrow">${minha
          ?(passo.tipo==='ban'?'Sua vez de BANIR':'Sua vez de ESCOLHER o mapa')
          :'Vez do '+esc(advT.tag)}</div>
        <div class="dim" style="margin-bottom:8px">${minha
          ?(passo.tipo==='ban'?'Tire da mesa o mapa em que eles são mais fortes que você.'
                              :'Escolha o mapa em que a diferença está do seu lado.')
          :'Eles estão decidindo.'}</div>
        <div class="mp-grid">${cartoes}</div></div>`}
    <div class="split" style="margin-top:14px">
      <button class="btn ghost" id="ppVoltar">‹ Relatório</button>
      ${V.fim?'<button class="btn" id="ppOk">Jogar a partida ›</button>'
             :'<button class="btn ghost" id="ppPular">Deixar a comissão terminar</button>'}
    </div>`;
}
