/* ============================================================
   MINIGAMES DE GESTÃO — as telas (fase 6 do modo Dono)
   ------------------------------------------------------------
   Uniforme (montagem visual), fan fest (planejar + ritmo), pitch e
   crise (coletiva) e a mesa de patrocínio. O núcleo mora em
   core/gestao-mini.js; os jogos reaproveitam o motor de minigames
   (ui/minigames.js), o ritmo (ui/ritmo.js) e a coletiva (ui/coletiva.js).
   ============================================================ */
let UNI=null, FF=null;

/* ---------- uniforme ---------- */
function _corSec(t){return (t.cor2)||(typeof CORES_CLUBES!=='undefined'&&CORES_CLUBES[t.tag]&&CORES_CLUBES[t.tag][1])||'#ECE8E1';}
function camisaSVG(t,o,px){
  const c1=o.cores==='edicao'?'#0E0F12':o.cores==='invertida'?_corSec(t):corDoClube(t);
  const c2=o.cores==='edicao'?'#C9A13B':o.cores==='invertida'?corDoClube(t):_corSec(t);
  const id='uni'+Math.abs(_hMini(t.id+o.modelo+o.cores)%99999);
  const padrao={
    classico:`<path d="M70 52h12v120H70zM94 52h12v120H94zM118 52h12v120h-12z" fill="${c2}" opacity=".85"/>`,
    street:`<path d="M40 110 L160 70 L160 98 L40 138Z" fill="${c2}"/><text x="100" y="150" text-anchor="middle" font-family="Bebas Neue,Impact" font-size="30" fill="${c2}" opacity=".9">${esc(t.tag)}</text>`,
    retro:`<path d="M40 60h120v18H40z" fill="${c2}"/><path d="M40 84h120v6H40z" fill="${c2}" opacity=".6"/><circle cx="100" cy="122" r="22" fill="none" stroke="${c2}" stroke-width="4"/>`,
    ousado:`<path d="M40 50 L120 50 L60 180 L40 180Z" fill="${c2}" opacity=".9"/><path d="M130 50 L160 50 L160 120Z" fill="${c2}" opacity=".55"/><path d="M95 180 L160 92 L160 180Z" fill="${c2}" opacity=".35"/>`
  }[o.modelo]||'';
  return `<svg viewBox="0 0 200 200" width="${px||220}" height="${px||220}" class="uni-svg"><defs><clipPath id="${id}"><path d="M60 22 L80 14 Q100 28 120 14 L140 22 L182 52 L164 86 L150 78 L150 186 L50 186 L50 78 L36 86 L18 52Z"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect width="200" height="200" fill="${c1}"/>${padrao}</g>
    <path d="M60 22 L80 14 Q100 28 120 14 L140 22 L182 52 L164 86 L150 78 L150 186 L50 186 L50 78 L36 86 L18 52Z" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
    <path d="M80 14 Q100 34 120 14" fill="none" stroke="${c2}" stroke-width="4"/>
    <image href="${ASSETS.logo(t)}" x="108" y="54" width="26" height="26"/></svg>`;
}
function abrirUniforme(){
  const t=meu(),j=uniformeDisponivel();
  if(!t||!j){avisar('O lançamento de uniforme abre nas semanas 1 a 8 e 27 a 34, com a loja aberta.');return;}
  const k=_tierK(t);
  UNI=UNI&&UNI.chave===j.chave?UNI:{chave:j.chave,modelo:'classico',cores:'clube',preco:UNI_PRECOS[k][1],tiragem:UNI_TIRAGENS[k][1]};
  pintarUniforme();
}
function pintarUniforme(){
  const t=meu(),k=_tierK(t),o=UNI;
  const pq=pesquisaUniforme(t,o), custo=o.tiragem*(UNI_CUSTO+((UNI_CORES[o.cores]||{}).custo||0));
  const vendaMed=Math.min(o.tiragem,Math.round((pq.min+pq.max)/2));
  const moda=modaDoAno();
  pintarModal(`<div class="ovl uni-ovl"><div class="box wide">
    <div class="eyebrow">Loja oficial · ${esc(t.nome)}</div><h2 class="sec">Lançamento de uniforme</h2>
    <div class="uni-g">
      <div class="uni-prev">${camisaSVG(t,o,240)}
        <div class="uni-pesq"><div class="eyebrow">Pesquisa com a torcida</div>
          <b class="num">${pq.min} a ${pq.max}</b><span class="dim">peças em oito semanas</span>
          ${pq.max<o.tiragem*0.8?'<span class="dn">A tiragem passa da procura: vai sobrar estoque.</span>':pq.min>o.tiragem?'<span class="up">Vai esgotar: dá para produzir mais.</span>':''}</div>
        <div class="dim uni-moda">Tendência do ano: <b>${esc(UNI_MODELOS[moda.alta].nome)}</b> em alta, ${esc(UNI_MODELOS[moda.baixa].nome.toLowerCase())} em baixa.</div></div>
      <div class="uni-op">
        <div class="eyebrow">Modelo</div>
        <div class="uni-btns">${Object.entries(UNI_MODELOS).map(([id,m])=>`<button class="ti-op ${o.modelo===id?'on':''}" data-unimod="${id}"><b>${esc(m.nome)}</b><small class="dim">${esc(m.desc)}</small></button>`).join('')}</div>
        <div class="eyebrow">Cores</div>
        <div class="uni-btns c3">${Object.entries(UNI_CORES).map(([id,c])=>`<button class="ti-op ${o.cores===id?'on':''}" data-unicor="${id}"><b>${esc(c.nome)}</b>${c.custo?`<small class="dim">+${money(c.custo)} por peça</small>`:''}</button>`).join('')}</div>
        <div class="eyebrow">Preço</div>
        <div class="uni-pills">${UNI_PRECOS[k].map(p=>`<button class="btn ghost sm ${o.preco===p?'on':''}" data-unipreco="${p}">${money(p)}</button>`).join('')}</div>
        <div class="eyebrow">Tiragem</div>
        <div class="uni-pills">${UNI_TIRAGENS[k].map(n=>`<button class="btn ghost sm ${o.tiragem===n?'on':''}" data-unitir="${n}">${n} peças</button>`).join('')}</div>
        <div class="og-conta" style="margin-top:12px">
          <div><span>Produção</span><b class="num dn">${money(custo)}</b></div>
          <div><span>Venda estimada (${vendaMed} peças)</span><b class="num">${money(vendaMed*o.preco)}</b></div>
          <div class="tot"><span>Resultado estimado</span><b class="num ${vendaMed*o.preco-custo>=0?'up':'dn'}">${money(vendaMed*o.preco-custo)}</b></div>
        </div>
      </div>
    </div>
    <div class="og-pe"><button class="btn ghost" id="uniFecha">Fechar</button><button class="btn ghost" id="uniDelega">Deixar o gerente da loja decidir</button>
      <span class="og-pe-c dim">caixa ${money(t.caixa)}</span><button class="btn" id="uniLanca">Lançar a coleção</button></div>
  </div></div>`);
  const on=(s,f)=>document.querySelectorAll(s).forEach(b=>b.onclick=()=>{f(b);pintarUniforme();});
  on('[data-unimod]',b=>UNI.modelo=b.dataset.unimod);
  on('[data-unicor]',b=>UNI.cores=b.dataset.unicor);
  on('[data-unipreco]',b=>UNI.preco=+b.dataset.unipreco);
  on('[data-unitir]',b=>UNI.tiragem=+b.dataset.unitir);
  $('#uniFecha').onclick=()=>fechar();
  $('#uniDelega').onclick=()=>{const r=lancarUniforme(null,true);$('#modal').innerHTML='';flash(r.ok?r.msg:r.erro);render();};
  $('#uniLanca').onclick=()=>{const r=lancarUniforme(UNI,false);if(!r.ok){avisar(r.erro);return;}$('#modal').innerHTML='';flash(r.msg);render();};
}

/* ---------- fan fest ---------- */
function abrirFanFest(){
  const t=meu();if(!t||!fanFestDisponivel()){avisar('O fan fest desta temporada já aconteceu.');return;}
  const k=_tierK(t);
  FF=FF&&FF.ano===G.ano?FF:{ano:G.ano,local:'media',atracoes:['autografos'],preco:FF_PRECOS[k][1]};
  pintarFanFest();
}
function pintarFanFest(){
  const t=meu(),k=_tierK(t),o=FF,L=FF_LOCAIS[o.local];
  const dem=demandaFanFest(t,o),custo=custoFanFest(t,o);
  const pub=[Math.min(L.cap[k],Math.round(dem*0.8)),Math.min(L.cap[k],Math.round(dem*1.2))];
  const rec=p=>p*o.preco+p*(k===1?12:5);
  pintarModal(`<div class="ovl ff-ovl"><div class="box wide">
    <div class="eyebrow">Evento da temporada · ${esc(t.nome)}</div><h2 class="sec">Fan fest</h2>
    <p class="dim">Monte o evento e depois viva o dia: um jogo de ritmo com o hype da arquibancada. Quanto melhor a sua nota, mais gente aparece e mais a torcida cresce.</p>
    <div class="eyebrow">Local</div>
    <div class="ti-op3">${Object.entries(FF_LOCAIS).map(([id,l])=>`<button class="ti-op ${o.local===id?'on':''}" data-fflocal="${id}"><b>${esc(l.nome)}</b><span>${l.cap[k].toLocaleString('pt-BR')} lugares</span><small class="dim">${money(l.custo[k])}</small></button>`).join('')}</div>
    <div class="eyebrow" style="margin-top:12px">Atrações</div>
    <div class="ti-op4">${Object.entries(FF_ATRACOES).map(([id,a])=>`<button class="ti-op ${o.atracoes.includes(id)?'on':''}" data-ffatr="${id}"><b>${esc(a.nome)}</b><small class="dim">${esc(a.desc)} ${money(a.custo[k])}</small></button>`).join('')}</div>
    <div class="eyebrow" style="margin-top:12px">Ingresso</div>
    <div class="uni-pills">${FF_PRECOS[k].map(p=>`<button class="btn ghost sm ${o.preco===p?'on':''}" data-ffpreco="${p}">${money(p)}</button>`).join('')}</div>
    <div class="og-conta" style="margin-top:12px">
      <div><span>Custo do evento</span><b class="num dn">${money(custo)}</b></div>
      <div><span>Procura estimada</span><b class="num">${dem.toLocaleString('pt-BR')} pessoas</b></div>
      <div><span>Público esperado</span><b class="num">${pub[0].toLocaleString('pt-BR')} a ${pub[1].toLocaleString('pt-BR')}</b></div>
      <div class="tot"><span>Resultado esperado</span><b class="num">${money(rec(pub[0])-custo)} a ${money(rec(pub[1])-custo)}</b></div>
    </div>
    <div class="og-pe"><button class="btn ghost" id="ffFecha">Fechar</button><span class="og-pe-c dim">caixa ${money(t.caixa)}</span><button class="btn" id="ffVai">Ir para o dia do evento</button></div>
  </div></div>`);
  const on=(s,f)=>document.querySelectorAll(s).forEach(b=>b.onclick=()=>{f(b);pintarFanFest();});
  on('[data-fflocal]',b=>FF.local=b.dataset.fflocal);
  on('[data-ffatr]',b=>{const a=b.dataset.ffatr,i=FF.atracoes.indexOf(a);if(i>=0)FF.atracoes.splice(i,1);else FF.atracoes.push(a);});
  on('[data-ffpreco]',b=>FF.preco=+b.dataset.ffpreco);
  $('#ffFecha').onclick=()=>fechar();
  $('#ffVai').onclick=()=>{if(t.caixa<custo){avisar('O evento custa '+money(custo)+'.');return;}diaDoFanFest();};
}
function diaDoFanFest(){
  const t=meu(),o=Object.assign({},FF);
  const base=jogosRitmo(t).stream;
  const J=Object.assign({},base,{id:'fanfest',nome:'Fan fest',tag:t.tag,telao:t.tag+' FAN FEST',selo:'NO PALCO',publicoRot:'na arena',
    publicoBase:Math.round(FF_LOCAIS[o.local].cap[_tierK(t)]*0.4),
    emotes:['GG','HYPE','BORA','UHUU','ACE','GOAT','CAMPEÃO','LOUCO'],
    chat:[['arquibancada','BORAAAA'],['fila_do_autografo','olha ele ali!'],['familia_toda','primeira vez num evento'],['fã_desde_2021','que festa'],
      ['caravana','viemos de longe'],['cosplay_jett','foto foto foto'],['locutor','barulho aí!'],['torcida_organizada','VAMOOOO']],
    desc:'O dia do evento. Puxe a arquibancada no tempo dos gritos e segure no <b>hype</b> quando a galera explodir.'});
  abrirMinigame({
    id:'fanfest',titulo:'Fan fest',eyebrow:esc(t.nome)+' · '+FF_LOCAIS[o.local].nome,
    desc:J.desc,controles:J.teclasTxt,
    arte:()=>`<svg viewBox="0 0 200 120">${[0,1,2,3,4,5,6,7].map(i=>`<circle cx="${40+i*20}" cy="${84-(i%3)*10}" r="9" fill="${['#FF4655','#E2B45A','#18E5B4','#4C8DFF'][i%4]}" opacity=".7"/>`).join('')}<rect x="60" y="20" width="80" height="36" rx="4" fill="none" stroke="#ECE8E1" opacity=".6"/></svg>`,
    vale:()=>fanFestDisponivel(),
    efeitoTxt:()=>'A nota do dia mexe no público (de 80% a 120% da procura) e na torcida que o evento traz.',
    efeitoFeito:res=>{const r=res.efeito;return r?`<b>${r.publico.toLocaleString('pt-BR')}</b> pessoas (${Math.round(r.ocup*100)}% da casa) · ${r.lucro>=0?'lucro':'prejuízo'} de <b class="${r.lucro>=0?'up':'dn'}">${money(Math.abs(r.lucro))}</b> · torcida <b class="up">+${r.torcida}</b>.`:'—';},
    rotuloComissao:'Deixar a produtora tocar o dia',msgComissao:'A produtora conduziu o evento.',
    comissao:()=>{const r=realizarFanFest(o,0,true);if(r.ok)flash(r.msg);else avisar(r.erro);},
    dica:()=>'Espaço no tempo dos gritos; segure no hype.',
    registrar:(res,vale)=>{
      const bateu=registrarRecordeMini('fanfest',res.pts,res.nota);
      if(vale){const r=realizarFanFest(o,res.nota,false);res.efeito=r.ok?r.r:null;}
      return bateu;
    },
    jogar:(ctx,fim)=>jogarRitmo(ctx,J,fim)
  });
}

/* ---------- coletivas: pitch e crise ---------- */
const CONTATOS_INVEST=[['Helena Duarte','#18E5B4'],['Marcus Reis','#4C8DFF'],['Sofia Tanaka','#E2B45A'],['Daniel Kerr','#9B6BFF']];
function abrirPitch(){
  const t=meu(),e=empresa(),k=G.ano+'-'+Math.ceil((G.semana||1)/13);
  if(e.buscou===k){avisar('O mercado já ouviu você neste trimestre. Tente no próximo.');return;}
  const pf=PERFIS_INVEST[perfilInvestidorDoTrimestre()];
  const h=_hMini('pitchq|'+t.id+'|'+k);
  const qs=PERGUNTAS_PITCH.slice().sort((a,b)=>(_hMini(a[0]+h)%97)-(_hMini(b[0]+h)%97)).slice(0,4);
  const v=tom=>tom===pf.quer?1:(pf.quer==='equ'||tom==='equ')?0.4:0;
  const tomDe={};
  const perguntas=qs.map(([p,rs],i)=>{
    const ordem=['amb','equ','pru'].sort((a,b)=>(_hMini(a+p+h)%13)-(_hMini(b+p+h)%13));
    ordem.forEach(x=>tomDe[rs[x]]=x);
    return{j:[CONTATOS_INVEST[i%4][0],pf.nome,CONTATOS_INVEST[i%4][1]],p:p.replace(/\{clube\}/g,t.nome),rs:ordem.map(x=>({txt:rs[x],v:v(x)}))};
  });
  abrirMinigame({
    id:'pitch',titulo:'Pitch para investidores',eyebrow:esc(pf.nome),
    desc:`Quatro perguntas de quem pode comprar uma fatia do ${esc(t.nome)}. ${esc(pf.dica)} Cada resposta é ambiciosa, equilibrada ou prudente; o tom das suas respostas decide a meta que eles vão pedir.`,
    controles:['1','2','3','Mouse'],
    arte:()=>`<svg viewBox="0 0 200 120"><rect x="60" y="30" width="80" height="54" rx="4" fill="none" stroke="#ECE8E1" opacity=".6"/><path d="M68 74 L88 58 L104 66 L132 40" stroke="#18E5B4" stroke-width="4" fill="none"/></svg>`,
    vale:()=>empresa().buscou!==G.ano+'-'+Math.ceil((G.semana||1)/13),
    efeitoTxt:()=>'A nota mexe no quanto eles pagam pela fatia (de −12% a +18%); o tom define a meta.',
    efeitoFeito:res=>res.efeito?esc(res.efeito):'—',
    rotuloComissao:'Deixar o diretor financeiro apresentar',msgComissao:'O diretor financeiro fez a apresentação.',
    comissao:()=>{const r=buscarInvestidores();flash(r.ok?r.msg:r.erro);},
    dica:()=>'Clique na resposta ou use as teclas 1 a 3.',
    registrar:(res,vale)=>{
      const bateu=registrarRecordeMini('pitch',res.pts,res.nota);
      if(vale){
        const c={amb:0,equ:0,pru:0};for(const x of res.vals||[])if(x.txt&&tomDe[x.txt])c[tomDe[x.txt]]++;
        const tom=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];
        const r=aplicarPitch(res.nota,tom);
        res.efeito=(r.ok?r.msg:r.erro)+' Meta pedida: '+(tom==='amb'?'resultado esportivo':tom==='pru'?'lucro':'torcida')+'. Veja em Empresa › Dinheiro.';
      }
      return bateu;
    },
    jogar:(ctx,fim)=>jogarColetiva(ctx,fim,{perguntas,t,placa:(G.manager.nome||'Dono')+' · dono'})
  });
}
function abrirCrise(){
  const t=meu(),c=crisePendente();if(!t||!c)return;
  const C=CRISES[c.tipo];
  const perguntas=C.perguntas.map(([p,rs],i)=>({j:COL_IMPRENSA[(i+_hMini(c.tipo))%COL_IMPRENSA.length],p:p.replace(/\{p\}/g,c.nome),
    rs:rs.map((txt,k)=>({txt,v:COL_VALOR[k]})).sort((a,b)=>(_hMini(a.txt)%7)-(_hMini(b.txt)%7))}));
  abrirMinigame({
    id:'crise',titulo:C.nome,eyebrow:'Crise de imagem · '+esc(t.nome),
    desc:esc(C.txt(c.nome))+' A imprensa quer ouvir o dono. O tom decide se a crise passa ou cresce.',
    controles:['1','2','3','Mouse'],
    arte:()=>`<svg viewBox="0 0 200 120"><path d="M100 18 C120 50 140 58 128 86 C120 104 80 104 72 86 C62 62 92 52 100 18Z" fill="#FF4655" opacity=".75"/><path d="M100 56 C110 72 112 80 106 90 C100 98 92 94 92 86 C92 76 100 70 100 56Z" fill="#E2B45A"/></svg>`,
    vale:()=>!!crisePendente(),
    efeitoTxt:()=>'A nota mexe na torcida (de −3 a +2), na marca (multa dos patrocinadores) e no humor do conselho.',
    efeitoFeito:res=>{const e=res.efeito;return e?`Torcida <b class="${e.torcida>=0?'up':'dn'}">${e.torcida>=0?'+':''}${e.torcida}</b>${e.multa?` · patrocinadores cobram <b class="dn">${money(e.multa)}</b>`:''}.`:'—';},
    rotuloComissao:'Deixar a assessoria responder',msgComissao:'A assessoria soltou uma nota oficial.',
    comissao:()=>{resolverCrise(0.5,'assessoria');render();},
    dica:()=>'Clique na resposta ou use as teclas 1 a 3.',
    registrar:(res,vale)=>{
      const bateu=registrarRecordeMini('crise',res.pts,res.nota);
      if(vale){res.efeito=resolverCrise(res.nota,'coletiva');
        if(res.manchete)noticia('🎙 '+(G.manager.nome||'O dono')+' sobre a crise: "'+res.manchete+'"',{c:'clube',t:[t.id],imp:2});}
      return bateu;
    },
    jogar:(ctx,fim)=>jogarColetiva(ctx,fim,{perguntas,t,placa:(G.manager.nome||'Dono')+' · dono'})
  });
}

/* ---------- mesa de patrocínio ---------- */
let MP={pct:0.12,anos:0};
function abrirPatrocinioMesa(){
  const t=meu(),c=mesaPatrocinioDisponivel();
  if(!c){avisar('O máster já foi negociado nesta temporada (ou o clube está sem máster).');return;}
  abrirMesaPatrocinio();
  pintarMesaPatroc();
}
function pintarMesaPatroc(){
  const t=meu(),c=contratoDe(t,'master'),m=miniDono(),mesa=m.mesa,mk=c&&marca(c.marca);
  const fechada=!mesaPatrocinioDisponivel();
  pintarModal(`<div class="ovl mp-ovl"><div class="box wide">
    <div class="eyebrow">Mesa de patrocínio · ${esc(t.nome)}</div><h2 class="sec">Renegociar o máster</h2>
    <div class="mp-g">
      <div class="mp-marca">${mk&&typeof ASSETS!=='undefined'&&ASSETS.marca?`<img src="${ASSETS.marca(mk)}" alt="">`:''}<b>${esc(mk?mk.nome:'Marca')}</b>
        <span class="dim">${esc(mk?mk.setor||'':'')}</span>
        <div class="og-conta"><div><span>Fixo por ano</span><b class="num">${money(c?c.fixo:0)}</b></div>
          <div><span>Contrato até</span><b class="num">${c?c.ate:'—'}</b></div>
          <div><span>Torcida hoje</span><b class="num">${Math.round(t.torcida||0)}</b></div></div>
        <div class="mp-pac">Paciência da marca ${[0,1,2].map(i=>`<i class="${i<(mesa?mesa.paciencia:0)?'on':''}"></i>`).join('')}</div></div>
      <div class="mp-conv">
        <div class="mp-hist">${(mesa?mesa.hist:[]).map(h=>`<div class="mp-fala ${h.de}">${esc(h.txt)}</div>`).join('')||'<p class="dim">A marca está na sala. Torcida que cresceu, título recente e a sua origem pesam no quanto ela aceita.</p>'}</div>
        ${fechada?'':`<label class="og-range"><span>Aumento no fixo <b class="num" id="mpPctN">+${Math.round(MP.pct*100)}%</b> <span class="dim">· ${money(Math.round((c?c.fixo:0)*MP.pct))} a mais por ano</span></span>
          <input type="range" id="mpPct" min="0" max="40" step="1" value="${Math.round(MP.pct*100)}"></label>
          <div class="uni-pills">${[0,1,2].map(a=>`<button class="btn ghost sm ${MP.anos===a?'on':''}" data-mpanos="${a}">${a?'+'+a+' temporada'+(a>1?'s':''):'Mesma duração'}</button>`).join('')}</div>`}
      </div>
    </div>
    <div class="og-pe"><button class="btn ghost" id="mpFecha">${fechada?'Fechar':'Sair da mesa'}</button>
      ${fechada?'':`<button class="btn ghost" id="mpDelega">Deixar o diretor comercial</button>`}
      <span class="og-pe-c"></span>
      ${!fechada&&mesa&&mesa.contra!=null?`<button class="btn ghost" id="mpAceita">Aceitar +${Math.round(mesa.contra*100)}%</button>`:''}
      ${fechada?'':'<button class="btn" id="mpPropoe">Propor</button>'}</div>
  </div></div>`);
  const r=$('#mpPct');if(r)r.oninput=()=>{MP.pct=+r.value/100;$('#mpPctN').textContent='+'+r.value+'%';};
  document.querySelectorAll('[data-mpanos]').forEach(b=>b.onclick=()=>{MP.anos=+b.dataset.mpanos;pintarMesaPatroc();});
  $('#mpFecha').onclick=()=>fechar();
  const d=$('#mpDelega');if(d)d.onclick=()=>{const x=delegarPatrocinio();$('#modal').innerHTML='';flash(x.ok?x.msg:x.erro);render();};
  const a=$('#mpAceita');if(a)a.onclick=()=>{proporPatrocinio(mesa.contra,mesa.contraAnos||0);pintarMesaPatroc();};
  const p=$('#mpPropoe');if(p)p.onclick=()=>{proporPatrocinio(MP.pct,MP.anos);pintarMesaPatroc();};
}

/* ---------- Central e Empresa ---------- */
const AGENDA_ABRE={crise:()=>abrirCrise(),uniforme:()=>abrirUniforme(),fanfest:()=>abrirFanFest(),patroc:()=>abrirPatrocinioMesa()};
const AGENDA_BT={crise:'Responder',uniforme:'Montar coleção',fanfest:'Planejar',patroc:'Ir à mesa'};
function cardAgendaDono(){
  const a=typeof agendaDoDono==='function'?agendaDoDono():[];
  if(!a.length)return '';
  return `<div class="card ag-dono"><div class="eyebrow">Agenda do dono</div>
    ${a.map(x=>`<div class="ag-item ${x.urg?'urg':''}"><span>${x.urg?icone('alerta')+' ':''}${esc(x.txt)}</span><button class="btn ${x.urg?'':'ghost'} sm" data-agenda="${x.id}">${AGENDA_BT[x.id]}</button></div>`).join('')}</div>`;
}
function ligarAgendaDono(v){
  v.querySelectorAll('[data-agenda]').forEach(b=>b.onclick=()=>{const f=AGENDA_ABRE[b.dataset.agenda];if(f)f();});
}
function comercialMiniHTML(t){
  const m=miniDono(),c=m.colecoes[0],ff=m.fanfest,pt=m.patroc;
  const uni=uniformeDisponivel();
  return `<div class="grid g3 ag-com">
    <div class="card"><div class="eyebrow">Uniforme</div>
      ${c?`<div class="ag-uni">${camisaSVG(t,c,84)}<div><b>${esc(UNI_MODELOS[c.modelo].nome)} · ${esc(UNI_CORES[c.cores].nome)}</b>
        <div class="dim">${c.vendidos} de ${c.tiragem} peças a ${money(c.preco)}${c.fim?' · encerrada':c.esgotou?' · esgotada':''}</div>
        <div class="dim">receita ${money(c.receita)} · produção ${money(c.custo)}</div></div></div>`:'<p class="dim">Nenhuma coleção lançada.</p>'}
      ${uni?'<button class="btn sm" data-agenda="uniforme">Montar coleção</button>':`<p class="dim">${empresa().loja?'Janelas de lançamento: semanas 1 a 8 e 27 a 34.':'Abra a loja para lançar uniformes.'}</p>`}</div>
    <div class="card"><div class="eyebrow">Fan fest</div>
      ${ff&&ff.ano===G.ano?`<p><b>${ff.publico.toLocaleString('pt-BR')}</b> pessoas · ${ff.lucro>=0?'lucro':'prejuízo'} de ${money(Math.abs(ff.lucro))} · torcida +${ff.torcida}</p>`
        :'<p class="dim">Uma vez por temporada. Local, atrações, ingresso e o dia em ritmo.</p><button class="btn sm" data-agenda="fanfest">Planejar</button>'}</div>
    <div class="card"><div class="eyebrow">Máster</div>
      ${pt&&pt.ano===G.ano?`<p>${pt.falhou?'A marca encerrou a conversa nesta temporada.':'Renovado com +'+Math.round(pt.pct*100)+'% no fixo.'}</p>`
        :mesaPatrocinioDisponivel()?'<p class="dim">Uma vez por temporada, com a paciência da marca.</p><button class="btn sm" data-agenda="patroc">Ir à mesa</button>':'<p class="dim">Sem máster para negociar.</p>'}</div>
  </div>`;
}
