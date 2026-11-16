/* ============================================================
   O ESCRITÓRIO — a cara do modo Dono
   ------------------------------------------------------------
   No modo Dono a carreira muda de roupa:
     · tema executivo (body.tema-dono): dourado no lugar do vermelho,
       fundo de mármore escuro, e a barra lateral com o seu retrato;
     · menu reorganizado em Escritório, Clube, Negócios e Circuito;
     · a Central vira o Escritório (Dono puro e Dono-técnico): o valor
       da organização em destaque, a agenda, o técnico, o conselho e
       quem é dono de quanto.
   O Treinador e o Jogador não mudam em nada.
   ============================================================ */
Object.assign(ICONES,{
  predio:'<path d="M4 21V4.5L13 3v18"/><path d="M13 8.5h7V21"/><path d="M7 7.5h3M7 11h3M7 14.5h3M16 12h1.5M16 15.5h1.5"/><path d="M2.5 21h19"/>',
  coroa:'<path d="M3.5 8.5 7.5 12l4.5-6 4.5 6 4-3.5-1.8 9.5H5.3z"/><path d="M5.5 20.5h13"/>',
  pasta:'<path d="M3.5 7.5h17V19h-17z"/><path d="M9 7.5V5h6v2.5"/><path d="M3.5 12.5h17"/>',
  agenda:'<path d="M4 5.5h16V20H4z"/><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8 13.5h3M8 16.5h6"/>',
  aperto:'<path d="M3 11.5 7.5 7l3.5 1.5L14.5 7l6.5 6.5-4 4-3-1.5-3 2-4.5-4.5z"/><path d="M11 8.5 8.5 11"/>'
});

function temaDonoAtivo(){return typeof souDono==='function'&&!!G&&!!G.manager&&souDono()&&!!G.meuTime&&!(typeof modoJogador==='function'&&modoJogador());}
function aplicarTemaDono(){
  if(typeof document==='undefined')return;
  const on=modo==='jogo'&&temaDonoAtivo();
  document.body.classList.toggle('tema-dono',on);
  document.body.classList.toggle('tema-dono-ia',on&&typeof donoComTecnico==='function'&&donoComTecnico());
}

/* ---------- o menu do dono ---------- */
function navDoDono(){
  const manda=typeof tecnicoComanda==='function'&&tecnicoComanda(meu());
  const ia=typeof donoComTecnico==='function'&&donoComTecnico();
  const N=[['inicio','Escritório','Escritório','predio']];
  if(ia){N.push(['empresa','Empresa','Escritório','grafico']);N.push(['tecnico','Comando técnico','Escritório','tatica']);}
  N.push(['donos','Donos','Escritório','aperto']);
  N.push(['elenco','Elenco','Clube','elenco']);
  if(!manda){N.push(['vestiario','Vestiário','Clube','vestiario']);N.push(['preparacao','Treinamento','Clube','tatica']);}
  N.push(['estrutura','Estrutura','Clube','estrutura'],['base','Base','Clube','base'],['historia','História','Clube','trofeu']);
  N.push(['mercado','Mercado','Negócios','troca'],['financas','Finanças','Negócios','dinheiro']);
  N.push(['comp','Competições','Circuito','trofeu'],['copa','World Cup','Circuito','estrela'],['stats','Estatísticas','Circuito','grafico'],
    ['premios','Prêmios','Circuito','trofeu'],['news','Notícias','Circuito','jornal']);
  N.push(['editor','Banco de dados','Sistema','banco'],['config','Configurações','Sistema','engrenagem']);
  return N;
}
function sideCabecalhoDono(t){
  const d=t&&t.dono;
  return `<div class="side-org side-dono">
    <div class="side-dono-r">${typeof retratoDono==='function'&&d?retratoDono(d,t,40):''}<span class="side-dono-esc">${escudo(t,18)}</span></div>
    <div class="n"><b>${esc(G.manager.nome)}</b><span>dono · ${esc(t.tag)}</span></div></div>`;
}

/* ---------- pedaços visuais ---------- */
function sparkValor(hist,w,h){
  const pts=(hist||[]).slice(-26);
  if(pts.length<2)return '';
  const vs=pts.map(x=>x.v),mn=Math.min(...vs),mx=Math.max(...vs),amp=(mx-mn)||1;
  const X=i=>(i/(pts.length-1))*w, Y=v=>h-4-((v-mn)/amp)*(h-8);
  const d=pts.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x.v).toFixed(1)).join(' ');
  const sobe=vs[vs.length-1]>=vs[0];
  return `<svg class="esc-spark ${sobe?'sobe':'cai'}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <defs><linearGradient id="escSpk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#escSpk)"/><path class="esc-spark-l" d="${d}" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <circle cx="${X(pts.length-1).toFixed(1)}" cy="${Y(vs[vs.length-1]).toFixed(1)}" r="3.5" fill="currentColor"/></svg>`;
}
function donutFatias(fs,px){
  const r=px/2-7,c=2*Math.PI*r;
  const cores=['#E2B45A','#4C8DFF','#9B6BFF','#18E5B4','#FF8A3D','#FF4655'];
  let off=0;
  const seg=(f,cor)=>{const l=c*f,s=`<circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="12" stroke-dasharray="${l.toFixed(1)} ${(c-l).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${px/2} ${px/2})"/>`;off+=l;return s;};
  return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" class="esc-donut">
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="var(--panel2)" stroke-width="12"/>
    ${seg(fs.minha,cores[0])}${fs.lista.map((x,i)=>seg(x.fatia,cores[(i+1)%cores.length])).join('')}
    <text x="${px/2}" y="${px/2+2}" text-anchor="middle" class="esc-donut-n">${Math.round(fs.minha*100)}%</text>
    <text x="${px/2}" y="${px/2+18}" text-anchor="middle" class="esc-donut-t">é seu</text></svg>`;
}
function anelConf(v,px,cor){
  const r=px/2-5,c=2*Math.PI*r,k=clamp(v,0,100)/100;
  return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" class="esc-anel"><circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="var(--panel2)" stroke-width="5"/>
    <circle cx="${px/2}" cy="${px/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c*k).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${px/2} ${px/2})" class="esc-anel-v" style="--c:${c.toFixed(1)}"/>
    <text x="${px/2}" y="${px/2+6}" text-anchor="middle" class="esc-anel-n">${Math.round(v)}</text></svg>`;
}

/* ---------- o Escritório ---------- */
function _escHero(t,e){
  const d=t.dono||{},m=G.manager,c=composicaoValor(t),fs=fatiasDaOrg(t);
  const ant=e.hist.length>4?e.hist[e.hist.length-5]:e.hist[0];
  const delta=ant?c.total-ant.v:0;
  const pf=PERFIS_DONO[m.perfilDono]||{nome:''};
  const org=typeof origemDono==='function'&&m.origem?origemDono(m.origem).nome:'';
  const vari=varianteDono(m.variante).nome;
  return `<section class="esc-hero" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    ${typeof cenaFoto==='function'?cenaFoto('cenas','sala-diretoria',t,{cls:'esc-hero-f',foco:'placa',ansioso:true}):''}
    <div class="esc-hero-v"></div>
    <div class="esc-hero-c">
      <div class="esc-quem">
        <div class="esc-ret">${typeof retratoDono==='function'?retratoDono(d,t,124):''}<span class="esc-ret-esc">${escudo(t,40)}</span></div>
        <div class="esc-quem-t">
          <div class="eyebrow">Escritório · ${esc(vari)}</div>
          <h1 class="esc-nome">${esc(m.nome)}</h1>
          <div class="esc-cargo">Dono do <b>${esc(t.nome)}</b>${d.desde?' desde '+d.desde:''}</div>
          <div class="esc-tags"><span class="esc-tag ouro">${icone('coroa')} ${esc(pf.nome||'Dono')}</span>${org?`<span class="esc-tag">${esc(org)}</span>`:''}
            <span class="esc-tag">${esc(nomeLiga?nomeLiga(t):'')}</span></div>
        </div>
      </div>
      <div class="esc-valor">
        <div class="esc-valor-l">Valor da organização</div>
        <div class="esc-valor-n" data-conta>${money(c.total)}</div>
        <div class="esc-valor-d ${delta>=0?'up':'dn'}">${delta>=0?'▲':'▼'} ${money(Math.abs(delta))} <span class="dim">em quatro semanas</span></div>
        ${sparkValor(e.hist,260,64)}
      </div>
    </div>
    <div class="esc-pills">
      <div><span>Caixa</span><b class="num ${t.caixa<0?'dn':''}">${money(t.caixa)}</b></div>
      <div><span>Dívida</span><b class="num">${money(-c.divida)}</b></div>
      <div><span>Seu patrimônio</span><b class="num">${money(m.patrimonio||0)}</b></div>
      <div><span>Sua fatia</span><b class="num">${Math.round(fs.minha*100)}%</b></div>
      <div><span>Humor do conselho</span><b class="num">${Math.round(e.humor)}</b></div>
    </div>
  </section>`;
}
const AGENDA_IC={crise:'alerta',uniforme:'pasta',fanfest:'estrela',patroc:'aperto',mandato:'agenda',pedido:'tatica',conselho:'predio',tecnico:'elenco'};
function _escAgenda(t){
  const itens=(typeof agendaDoDono==='function'?agendaDoDono():[]).map(x=>Object.assign({},x));
  const x=tecIA();
  if(mandatoPendente())itens.unshift({id:'mandato',txt:'Entregue o mandato da temporada ao técnico.',urg:true,ir:'tecnico'});
  const ab=x.pedidos.filter(p=>p.status==='aberto').length;
  if(ab)itens.push({id:'pedido',txt:ab+' pedido'+(ab>1?'s':'')+' do técnico esperando resposta.',ir:'tecnico'});
  if(!x.noBanco&&!tecnicoAtual(t))itens.unshift({id:'tecnico',txt:'Sem head coach: o interino segura o time.',urg:true,ir:'tecnico'});
  const prox=13-((G.semana||1)%13||13);
  return `<div class="card esc-agenda"><div class="split"><div class="eyebrow">${icone('agenda')} Agenda do dono</div><span class="dim">conselho em ${prox||13} semana${(prox||13)>1?'s':''}</span></div>
    ${itens.length?`<div class="esc-ag-l">${itens.map((a,i)=>`<button class="esc-ag ${a.urg?'urg':''}" style="--i:${i}" ${a.ir?`data-ir-tela="${a.ir}"`:`data-agenda="${a.id}"`}>
      <span class="esc-ag-ic">${icone(AGENDA_IC[a.id]||'info')}</span><span class="esc-ag-t">${esc(a.txt)}</span><span class="esc-ag-s">${ico('seta_d')}</span></button>`).join('')}</div>`
      :'<p class="dim esc-vazio">Mesa limpa. Nada esperando por você esta semana.</p>'}</div>`;
}
function _escTecnico(t){
  const x=tecIA(),tec=tecnicoAtual(t),md=x.mandato&&x.mandato.ano===G.ano?x.mandato:null;
  const {pos,de}=posicaoNaLiga(t);
  const cor=x.confianca>=60?'var(--teal)':x.confianca>=45?'var(--amber)':'var(--red)';
  return `<div class="card esc-tec" data-ir-tela="tecnico">
    <div class="eyebrow">${icone('tatica')} Comando técnico</div>
    <div class="esc-tec-c">${x.noBanco?(typeof retratoManager==='function'?retratoManager(64):''):tec?retratoStaff(tec,64):`<div class="ti-vazio">${icone('elenco')}</div>`}
      <div><b>${esc(x.noBanco?'Você, no banco':tec?tec.nome:'Interino')}</b>
        <span class="dim">${x.noBanco?'O time é seu.':tec?esc(perfilTecnico(tec).estilo)+' · coach '+overStaff(tec):'Contrate um técnico.'}</span></div>
      ${!x.noBanco&&tec?anelConf(x.confianca,62,cor):''}</div>
    ${md?`<div class="esc-meta"><span>${esc(md.texto)}</span><b class="${pos<=md.alvo?'up':'dn'}">${pos}º de ${de}</b>
      <i><u style="width:${clamp((de-pos+1)/(de-md.alvo+1),0,1)*100}%"></u></i></div>`:'<div class="esc-meta dim">Mandato da temporada ainda não entregue.</div>'}
  </div>`;
}
function _escConselho(t,e){
  const r=e.reunioes[0];
  const humor=Math.round(e.humor);
  const cor=humor>=65?'var(--teal)':humor>=45?'var(--amber)':'var(--red)';
  return `<div class="card esc-cons" data-ir-tela="empresa">
    <div class="eyebrow">${icone('predio')} Conselho</div>
    <div class="esc-cons-c">${anelConf(humor,74,cor)}
      <div><b>${humor>=65?'Satisfeito':humor>=45?'Atento':humor>=HUMOR_CONTROLE?'Impaciente':'Em revolta'}</b>
        <span class="dim">${r?`Última reunião: ${r.tri}º tri de ${r.ano}, resultado ${money(r.resultado)}`:'A primeira reunião é no fim do trimestre.'}</span>
        ${e.negativas?`<span class="dn">Caixa no vermelho há ${e.negativas} semana${e.negativas>1?'s':''}</span>`:''}</div></div>
  </div>`;
}
function _escFatias(t){
  const fs=fatiasDaOrg(t);
  return `<div class="card esc-fat" data-ir-tela="empresa">
    <div class="eyebrow">${icone('coroa')} Quem é dono</div>
    <div class="esc-fat-c">${donutFatias(fs,112)}
      <div class="esc-fat-l"><div><i style="background:#E2B45A"></i>${esc(G.manager.nome)}<b class="num">${Math.round(fs.minha*100)}%</b></div>
        ${fs.lista.map((x,i)=>`<div><i style="background:${['#4C8DFF','#9B6BFF','#18E5B4','#FF8A3D','#FF4655'][i%5]}"></i>${esc(x.nome)}<b class="num">${Math.round(x.fatia*100)}%</b></div>`).join('')
        ||'<div class="dim">Ninguém mais. A organização é toda sua.</div>'}</div></div>
  </div>`;
}
function vEscritorio(){
  const t=meu();
  const e=empresa();
  if(e.perdeu)return telaFimDono(e.perdeu);
  const px=typeof proximoConfronto==='function'?proximoConfronto():null;
  const metade=(G.semana||1)>=25?'2':'1';
  const pre=(t.tier===1?'s':'c')+metade+'_';
  const rrAgora=px&&px.stage&&(px.stage.tipo==='grupos'||px.stage.tipo==='rr')?px.stage:null;
  const rr=rrAgora||acharStage(pre+t.regiao)||acharStage((t.tier===1?'s1_':'c1_')+t.regiao)||acharStage((t.tier===1?'kg_':'ckg_')+t.regiao);
  return `<div class="esc">
    ${faixaCircuito()}
    ${_escHero(t,e)}
    <div class="esc-g1">
      ${_escAgenda(t)}
      <div class="esc-jogo ${tecnicoComanda(t)?'manda':''}">${cardConfronto(t,px)}<div class="esc-assiste">${icone('olho')} ${tecnicoComanda(t)?'Você assiste: o técnico escala e veta.':'Você está no banco: o jogo é seu.'}</div></div>
    </div>
    <div class="esc-g3">${_escTecnico(t)}${_escConselho(t,e)}${_escFatias(t)}</div>
    <div class="grid g2 cx-linha">${cardTabelaDaCasa(t,rr)}${cardImprensa()}</div>
  </div>`;
}

/* ---------- cabeçalho das telas do dono ---------- */
function cabecalhoDono(eyebrow,titulo,sub,icone_){
  const t=meu();
  return `<div class="escr-cab" style="--clube:${corDoClube(t)}">
    ${typeof cenaFoto==='function'?cenaFoto('cenas','sala-diretoria',t,{cls:'esc-cab-f',foco:'placa'}):''}
    <div class="esc-cab-c"><span class="esc-cab-ic">${icone(icone_||'predio')}</span>
      <div><div class="eyebrow">${esc(eyebrow)}</div><h2 class="sec">${esc(titulo)}</h2>${sub?`<p class="dim">${sub}</p>`:''}</div></div></div>`;
}

/* ---------- a chegada: a primeira vez no escritório ----------
   Uma cena curta quando a carreira de dono começa (e em saves antigos de
   dono, uma vez): o retrato, o clube e os números que agora são seus. */
function talvezBoasVindasDono(){
  if(!temaDonoAtivo()||!G.manager||G.manager.boasVindasDono)return;
  if(typeof document==='undefined'||$('#modal').innerHTML)return;
  G.manager.boasVindasDono=G.ano;
  const t=meu(),d=t.dono||{},ia=typeof donoComTecnico==='function'&&donoComTecnico();
  const tec=ia&&typeof tecnicoAtual==='function'?tecnicoAtual(t):null;
  const valor=ia&&typeof valorDaOrg==='function'?valorDaOrg(t):null;
  $('#modal').innerHTML=`<div class="ovl bv-ovl"><div class="bv" style="--clube:${corDoClube(t)};--clube-rgb:${rgbDe(corDoClube(t))}">
    ${typeof cenaFoto==='function'?cenaFoto('cenas','sala-diretoria',t,{cls:'bv-f',foco:'placa',ansioso:true}):''}
    <div class="bv-v"></div>
    <div class="bv-c">
      <div class="bv-linha"></div>
      <div class="bv-ret">${typeof retratoDono==='function'?retratoDono(d,t,150):''}</div>
      <div class="bv-ey">${esc(varianteDono(G.manager.variante).nome)} · temporada ${G.ano}</div>
      <h1 class="bv-t">Bem-vindo ao escritório</h1>
      <div class="bv-s">${esc(G.manager.nome)}, a partir de hoje o <b>${esc(t.nome)}</b> é seu.</div>
      <div class="bv-n">
        ${valor!=null?`<div><span>Valor da organização</span><b class="num">${money(valor)}</b></div>`:''}
        <div><span>Caixa</span><b class="num">${money(t.caixa)}</b></div>
        <div><span>${ia?'Head coach':'Comando'}</span><b>${esc(ia?(tec?tec.nome:'a contratar'):'você escala')}</b></div>
      </div>
      <p class="bv-p">${ia?'Você não escala nem monta tática: entrega um mandato ao técnico, aprova os pedidos dele, cuida da empresa e responde ao conselho. Se o caixa quebrar ou os sócios tomarem o controle, você perde o time.'
        :'Sem metas e sem cobrança: você faz tudo, do mercado à escalação. O clube é seu e vai para onde você decidir.'}</p>
      <button class="btn bv-b" id="bvEntrar">Entrar no escritório</button>
    </div></div></div>`;
  $('#bvEntrar').onclick=()=>{const o=$('#modal .ovl');if(o)o.classList.add('sai');setTimeout(()=>{$('#modal').innerHTML='';render();},260);};
}
