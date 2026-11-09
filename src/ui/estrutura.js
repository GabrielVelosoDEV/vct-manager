/* ============================================================
   ESTRUTURA — a aba dos departamentos do clube
   ------------------------------------------------------------
   Saiu do canto da tela de Treinamento e virou tela própria: cada
   departamento com a sua ilustração (que cresce com o nível), o que ele
   faz hoje, o que o próximo nível acrescenta, quanto custa construir e
   manter. Embaixo, quem do elenco mais sente a estrutura e onde o clube
   está entre os da liga.

   As ilustrações são desenhadas aqui (SVG, sem arquivo externo). Uma foto
   de verdade pode substituir: assets/estrutura/<departamento>.webp — a
   LISTA.md da pasta tem os nomes. O número que cada efeito mostra sai da
   mesma função que o motor usa (core/estrutura.js).
   ============================================================ */

/* ---------- ilustrações ---------- */
let _cenaSeq=0;
function _janelas(pos,n,cor,id){
  return pos.map(([x,y,w,h],i)=>i<n
    ?`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}" opacity=".9"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}l)" opacity=".6"/>`
    :`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0B1218" stroke="#2E4250" stroke-width=".6"/>`).join('');
}
function cenaEstrutura(k,n,cor){
  cor=cor||'#FF4655';
  /* id estável: o redesenho da tela (morfar) não precisa mexer no SVG */
  const id='ce-'+k+'-'+n;
  const fundo=`<defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16222E"/><stop offset="1" stop-color="#0B1218"/></linearGradient>
      <radialGradient id="${id}g" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="${cor}" stop-opacity="${(0.10+n*0.05).toFixed(2)}"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="320" height="150" fill="url(#${id}b)"/><rect width="320" height="150" fill="url(#${id}g)"/>
    <path d="M0 132h320" stroke="#2E4250"/><path d="M0 132h320v18H0z" fill="#0B1218" opacity=".7"/>`;
  const L='#2E4250',P='#1C2A38',E='#22323F';
  let c='';
  if(k==='gh'){
    const pos=[[92,74,22,16],[126,74,22,16],[172,74,22,16],[206,74,22,16],[92,102,22,16]];
    c=`<path d="M64 66 160 26l96 40" fill="${E}" stroke="${L}"/><rect x="74" y="64" width="172" height="68" fill="${P}" stroke="${L}"/>
      ${_janelas(pos,n,cor,id)}<rect x="150" y="98" width="22" height="34" fill="#0B1218" stroke="${L}"/><circle cx="167" cy="116" r="1.4" fill="${cor}"/>
      <rect x="206" y="102" width="22" height="16" fill="${n>=2?cor:'#0B1218'}" opacity="${n>=2?.55:1}" stroke="${L}" stroke-width=".6"/>
      ${n>=3?`<path d="M44 132v-26a10 10 0 0 1 20 0v26" fill="#14301f" opacity=".9"/><path d="M262 132v-18a8 8 0 0 1 16 0v18" fill="#14301f" opacity=".9"/>`:''}
      ${n>=4?`<path d="M222 47v-14M216 36h12" stroke="${L}" stroke-width="2"/><circle cx="222" cy="31" r="2.5" fill="${cor}"/>`:''}
      ${n>=5?`<path d="M100 56V30" stroke="${L}" stroke-width="1.5"/><path d="M100 30h26l-6 7 6 7h-26z" fill="${cor}"/>`:''}`;
  }else if(k==='treino'){
    const andares=Math.min(3,1+Math.ceil(n/2));
    let pr='';
    for(let a=0;a<andares;a++){
      const y=110-a*24;
      pr+=`<rect x="58" y="${y}" width="204" height="22" fill="${P}" stroke="${L}"/>`;
      for(let j=0;j<8;j++)pr+=`<rect x="${66+j*24}" y="${y+5}" width="16" height="11" fill="${(a*8+j)<n*5?cor:'#0B1218'}" opacity="${(a*8+j)<n*5?.7:1}"/>`;
    }
    const topo=110-(andares-1)*24;
    c=`${pr}<rect x="58" y="${topo-6}" width="204" height="6" fill="${cor}"/>
      <rect x="140" y="114" width="40" height="18" fill="#0B1218" stroke="${L}"/>
      ${n>=4?`<rect x="118" y="${topo-34}" width="84" height="24" fill="#0B1218" stroke="${cor}"/><path d="M126 ${topo-16}l12-8 10 5 12-9 12 6 14-4" fill="none" stroke="${cor}" stroke-width="1.6"/>`:''}
      ${n>=5?`<rect x="20" y="96" width="30" height="36" fill="${P}" stroke="${L}"/><rect x="270" y="96" width="30" height="36" fill="${P}" stroke="${L}"/>
        <rect x="26" y="102" width="18" height="8" fill="${cor}" opacity=".7"/><rect x="276" y="102" width="18" height="8" fill="${cor}" opacity=".7"/>`:''}`;
  }else if(k==='equip'){
    const q=clamp(n,1,5),w=Math.min(64,250/q-8),ini=160-(q*(w+8)-8)/2;
    let mon='';
    for(let i=0;i<q;i++){
      const x=ini+i*(w+8);
      mon+=`<rect x="${x}" y="58" width="${w}" height="${w*0.6}" rx="2" fill="#0B1218" stroke="${L}"/>
        <rect x="${x+3}" y="61" width="${w-6}" height="${w*0.6-6}" fill="${cor}" opacity="${(0.25+n*0.1).toFixed(2)}"/>
        <path d="M${x+5} ${58+w*0.6-8}l${w*0.25} -${w*0.18} ${w*0.2} ${w*0.1} ${w*0.3} -${w*0.2}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
        <path d="M${x+w/2} ${58+w*0.6}v10M${x+w/2-8} ${68+w*0.6}h16" stroke="${L}" stroke-width="2"/>`;
    }
    c=`<rect x="30" y="104" width="260" height="6" fill="${E}" stroke="${L}"/><path d="M44 110v22M276 110v22" stroke="${L}" stroke-width="3"/>
      ${mon}<rect x="120" y="96" width="62" height="7" rx="1.5" fill="${P}" stroke="${L}"/><rect x="194" y="96" width="10" height="7" rx="3.5" fill="${P}" stroke="${L}"/>
      ${n>=4?`<path d="M30 112h260" stroke="${cor}" stroke-width="2" opacity=".8"/>`:''}
      ${n>=5?`<rect x="292" y="62" width="22" height="70" fill="${P}" stroke="${L}"/>${[0,1,2,3,4].map(i=>`<rect x="296" y="${68+i*12}" width="14" height="6" fill="#0B1218"/><circle cx="307" cy="${71+i*12}" r="1.3" fill="${i%2?cor:'#18E5B4'}"/>`).join('')}`:''}`;
  }else if(k==='analise'){
    const barras=n+1;
    let bs='';
    for(let i=0;i<barras;i++){const h=12+((i*37+n*11)%30);bs+=`<rect x="${206+i*14}" y="${112-h}" width="9" height="${h}" fill="${i===barras-1?cor:'#4C8DFF'}" opacity=".85"/>`;}
    c=`<rect x="34" y="34" width="156" height="90" fill="#0B1218" stroke="${L}"/>
      <path d="M48 52h38v22H66v26H48zM98 48h30v18h22v40h-30V84H98z" fill="${P}" stroke="${L}"/>
      <path d="M60 94q30-30 70-38" fill="none" stroke="${cor}" stroke-width="2" stroke-dasharray="4 3"/><path d="m128 52 6 4-7 3z" fill="${cor}"/>
      <circle cx="64" cy="62" r="3" fill="#18E5B4"/><circle cx="140" cy="96" r="3" fill="${cor}"/>
      ${n>=3?`<circle cx="112" cy="70" r="10" fill="${cor}" opacity=".18"/><circle cx="80" cy="84" r="7" fill="${cor}" opacity=".14"/>`:''}
      <rect x="198" y="34" width="${n>=2?96:0}" height="90" fill="#0B1218" stroke="${n>=2?L:'none'}"/>${n>=2?bs:''}
      <path d="M34 124h60l6 8h24l6-8h60" fill="none" stroke="${L}"/>
      ${n>=5?`<path d="M206 48h80" stroke="#18E5B4" stroke-width="1.4"/><path d="M206 48l14-6 12 4 14-8 12 3 14-5 14 4" fill="none" stroke="#18E5B4" stroke-width="1.2" transform="translate(0 8)"/>`:''}`;
  }else if(k==='saude'){
    c=`<path d="M20 60h70l8-18 12 40 10-30 6 8h174" fill="none" stroke="${cor}" stroke-width="2.2" opacity=".85"/>
      <g transform="translate(70 104)"><rect x="-4" y="-3" width="44" height="6" fill="${L}"/><rect x="-14" y="-12" width="10" height="24" rx="2" fill="${P}" stroke="${L}"/><rect x="40" y="-12" width="10" height="24" rx="2" fill="${P}" stroke="${L}"/></g>
      <rect x="150" y="98" width="14" height="34" rx="4" fill="#4C8DFF" opacity=".6"/><rect x="153" y="92" width="8" height="7" fill="${L}"/>
      ${n>=2?`<rect x="186" y="118" width="38" height="14" rx="2" fill="${P}" stroke="${L}"/><path d="M190 118v-30h6" stroke="${L}" stroke-width="2" fill="none"/>`:''}
      ${n>=3?`<g transform="translate(250 106)"><circle r="14" fill="none" stroke="${L}" stroke-width="2"/><circle cx="34" r="14" fill="none" stroke="${L}" stroke-width="2"/><path d="M0 0l14-18h12l8 18M14-18l-4-8" stroke="${cor}" stroke-width="2" fill="none"/></g>`:''}
      ${n>=4?`<rect x="20" y="86" width="26" height="46" fill="${P}" stroke="${L}"/><path d="M33 96v14M26 103h14" stroke="#18E5B4" stroke-width="3"/>`:''}
      ${n>=5?`<path d="M110 132c0-12 6-18 14-18s14 6 14 18" fill="#18E5B4" opacity=".25"/><path d="M118 122h12M124 116v12" stroke="#18E5B4" stroke-width="2"/>`:''}`;
  }else if(k==='mente'){
    let ondas='';
    for(let i=1;i<=n;i++)ondas+=`<path d="M${150+i*9} ${78-i*7}a${i*9} ${i*9} 0 0 1 0 ${i*14+20}" fill="none" stroke="${cor}" stroke-opacity="${(0.9-i*0.13).toFixed(2)}" stroke-width="1.6"/>`;
    let folhas='';
    for(let i=0;i<Math.min(5,n+1);i++)folhas+=`<path d="M60 ${126-i*9}c${i%2?-14:14} -4 ${i%2?-18:18} -12 ${i%2?-16:16} -16c${i%2?6:-6} 6 ${i%2?8:-8} 12 ${i%2?16:-16} 16" fill="#18E5B4" opacity=".55"/>`;
    c=`<path d="M128 124v-14c-10-4-16-14-16-26 0-18 14-32 32-32s30 12 30 28l8 14h-8v10c0 6-4 8-10 8h-6v12" fill="${P}" stroke="${L}" stroke-width="1.4"/>
      <circle cx="146" cy="78" r="9" fill="${cor}" opacity="${(0.2+n*0.12).toFixed(2)}"/>${ondas}
      <rect x="52" y="122" width="16" height="10" fill="${E}" stroke="${L}"/><path d="M60 122v-46" stroke="#14301f" stroke-width="2"/>${folhas}
      ${n>=3?`<path d="M232 132v-22h56v22M236 110v-12h48v12" fill="${P}" stroke="${L}"/><rect x="240" y="104" width="40" height="8" fill="${cor}" opacity=".35"/>`:''}
      ${n>=5?`<circle cx="292" cy="40" r="10" fill="#E8A33D" opacity=".5"/>`:''}`;
  }else if(k==='academia'){
    let pl='';
    for(let i=0;i<n;i++){
      const x=70+i*44,h=16+i*9;
      pl+=`<path d="M${x} 132v-${h}" stroke="#18E5B4" stroke-width="2.4"/>
        <path d="M${x} ${132-h+6}c0-${8+i*2} 8-${14+i*2} 18-${14+i*2} 0 ${8+i*2}-8 ${14+i*2}-18 ${14+i*2}z" fill="#18E5B4" opacity=".7"/>
        <path d="M${x} ${132-h+12}c0-${6+i*2}-7-${11+i*2}-15-${11+i*2} 0 ${6+i*2} 7 ${11+i*2} 15 ${11+i*2}z" fill="#18E5B4" opacity=".5"/>`;
    }
    c=`<path d="M40 132h240" stroke="#14301f" stroke-width="5"/>${pl}
      ${n>=3?`<rect x="24" y="58" width="24" height="74" fill="${P}" stroke="${L}"/><rect x="28" y="64" width="16" height="8" fill="${cor}" opacity=".6"/>`:''}
      ${n>=5?`<g transform="translate(286 92)"><path d="M-10 0h20v10c0 8-4 12-10 12s-10-4-10-12z" fill="#E8C46A"/><rect x="-3" y="22" width="6" height="8" fill="#E8C46A"/><rect x="-9" y="30" width="18" height="6" fill="#C8943A"/></g>`:''}`;
  }
  return `<svg class="dp-svg" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc((deptoDe(k)||{}).nome||k)}, nível ${n}">${fundo}${c}</svg>`;
}
/* foto opcional em assets/estrutura/; sem ela, a ilustração */
/* Foto de assets/estrutura: a versão do nível quando existe (-basico até o
   nível 2, -elite no 5), senão a principal. As fotos são neutras de
   propósito: o escudo entra na placa vazia do centro do terço superior e a
   cor do clube tinge a cena por cima — a mesma foto serve para os 80. */
function fotoDepto(k,n){
  const M=typeof MIDIA!=='undefined'&&MIDIA.arquivos?MIDIA.arquivos:{};
  const v=n<=2?k+'-basico':n>=5?k+'-elite':null;
  return v&&M['estrutura/'+v]?v:M['estrutura/'+k]?k:null;
}
function arteDepto(t,k,n){
  const svg=cenaEstrutura(k,n,corDoClube(t));
  const arq=fotoDepto(k,n);
  if(!arq)return svg;
  /* sem versão própria do nível, a foto principal escurece e perde cor nos
     níveis baixos e ganha brilho no alto: a evolução continua visível */
  const varia=arq===k?` dp-nv${n}`:'';
  return svg+cenaFoto('estrutura',arq,t,{cls:'dp-fotocena'+varia,foco:40});
}

/* ---------- efeitos, com a mesma conta do motor ---------- */
const _pct=v=>(v>0?'+':v<0?'−':'')+Math.abs(Math.round(v*100))+'%';
const _pts=v=>(v>0?'+':v<0?'−':'')+Math.abs(v*100).toFixed(1).replace('.',',')+' pt';
/* bom: +1 quando subir é bom, −1 quando descer é bom */
function efeitosDepto(k,n){
  const N=EST_NEUTRO;
  switch(k){
    case 'treino':return[
      {rot:'Evolução de todo o elenco',v:efCTRel(n)-1,f:_pct,bom:1},
      {rot:'Ganho do treino de mapa',v:efMapaCT(n)/efMapaCT(N)-1,f:_pct,bom:1}];
    case 'equip':return[
      {rot:'Evolução de mira, reflexo e movimentação',v:efAtributo(n)-1,f:_pct,bom:1},
      {rot:'Rendimento em jogo',v:efJogoEquip(n),f:v=>(v>0?'+':v<0?'−':'')+Math.abs(v*100).toFixed(1).replace('.',',')+'%',bom:1}];
    case 'analise':return[
      {rot:'Evolução de visão e utilidade',v:efAtributo(n)-1,f:_pct,bom:1},
      {rot:'Ganho do treino de mapa',v:efMapaAnalise(n)-1,f:_pct,bom:1},
      {rot:'Rendimento em jogo',v:efJogoAnalise(n),f:v=>(v>0?'+':v<0?'−':'')+Math.abs(v*100).toFixed(1).replace('.',',')+'%',bom:1}];
    case 'saude':return[
      {rot:'Desgaste recuperado por semana',v:efRecupSaude(n),f:_pts,bom:1},
      {rot:'Risco de lesão por esgotamento',v:efLesaoSaude(n)-1,f:_pct,bom:-1},
      {rot:'Declínio dos veteranos',v:efDeclinioSaude(n)-1,f:_pct,bom:-1}];
    case 'mente':return[
      {rot:'Moral ao longo da temporada',v:efMoralMente(n)*SEMANAS_ANO,f:_pts,bom:1},
      {rot:'Evolução de clutch e consistência',v:efAtributo(n)-1,f:_pct,bom:1},
      {rot:'Tombo de moral no esgotamento',v:efBurnoutMente(n)-1,f:_pct,bom:-1}];
    case 'gh':return[
      {rot:'Desgaste recuperado por semana',v:efRecupGH(n)-efRecupGH(N),f:_pts,bom:1},
      {rot:'Moral ao longo da temporada',v:efMoralGH(n)*SEMANAS_ANO,f:_pts,bom:1}];
    case 'academia':return[
      {rot:'Vagas na categoria de base',v:2+Math.floor((n-1)/2),f:v=>String(v),abs:1},
      {rot:'Potencial dos garotos revelados',v:n,f:v=>'+'+v,abs:1}];
  }
  return [];
}
function _fmtEf(e){return Math.abs(e.v)<1e-9&&!e.abs?'padrão':e.f(e.v);}
function _efClasse(e){
  if(e.abs)return '';
  const s=e.v*e.bom;
  return Math.abs(e.v)<1e-9?'neu':s>0?'up':'dn';
}
function listaEfeitos(k,n){
  return `<ul class="dp-ef">${efeitosDepto(k,n).map(e=>`<li><span>${esc(e.rot)}</span><b class="num ${_efClasse(e)}">${Math.abs(e.v)<1e-9&&!e.abs?'padrão':e.f(e.v)}</b></li>`).join('')}</ul>`;
}
function _pips(n){return `<div class="est-nv">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}<span class="num">nível ${n}</span></div>`;}

/* ---------- impacto no elenco ---------- */
function alvosDoPlano(t,p){
  const pl=typeof planoDoJogador==='function'?planoDoJogador(t,p):null;
  if(!pl)return{alvos:['mira','util','visao','clutch'],rot:'equilibrado'};
  if(pl.tipo==='descanso')return{alvos:[],rot:'descanso'};
  if(pl.tipo==='agente')return{alvos:[],rot:'aprendendo agente'};
  if(pl.alvo&&ATTRS.some(a=>a[0]===pl.alvo))return{alvos:[pl.alvo],rot:(ATTRS.find(a=>a[0]===pl.alvo)||[,pl.alvo])[1]};
  return{alvos:['mira','util','visao','clutch'],rot:'equilibrado'};
}
function blocoImpacto(t){
  const js=t.elenco.map(P).filter(Boolean).sort((a,b)=>a.idade-b.idade);
  if(!js.length)return vazio('Elenco vazio.','elenco');
  const linhas=js.map(p=>{
    const {alvos,rot}=alvosDoPlano(t,p);
    const veterano=p.idade>30;
    let v,txt,cls;
    if(veterano){v=fatorDeclinioEst(t)-1;txt='declínio '+_pct(v);cls=v<0?'up':v>0?'dn':'neu';}
    else if(!alvos.length){v=0;txt='não evolui esta semana';cls='neu';}
    else{v=impactoEvolucao(t,p,alvos)-1;txt='evolução '+_pct(v);cls=v>0?'up':v<0?'dn':'neu';}
    const larg=Math.min(50,Math.abs(v)*100*1.4);
    const bom=veterano?v<0:v>0;
    return `<div class="dp-j jrow" data-p="${p.id}">${retrato(p,30)}
      <div class="dp-jn"><b>${esc(p.nome)}</b><span class="dim">${p.idade} anos · ${esc(rot)}${veterano?' · veterano':''}</span></div>
      <div class="dp-jb"><u><i class="${bom?'up':'dn'}" style="${bom?'left:50%':'right:50%'};width:${larg}%"></i></u></div>
      <b class="num dp-jv ${cls}">${txt}</b></div>`;
  }).join('');
  return `<div class="dp-js">${linhas}</div>`;
}

/* ---------- comparação com a liga ---------- */
function rivaisDeEstrutura(t){
  return Object.values(G.times).filter(x=>x.tier===t.tier&&x.regiao===t.regiao)
    .map(x=>({t:x,i:indiceEstrutura(x)})).sort((a,b)=>b.i-a.i);
}
function blocoLiga(t,lista){
  const pos=lista.findIndex(x=>x.t.id===t.id);
  const mostra=lista.slice(0,10);
  if(pos>=10)mostra.push(lista[pos]);
  return `<div class="dp-liga">${mostra.map(x=>{
    const i=lista.indexOf(x);
    return `<div class="dp-lr ${x.t.id===t.id?'eu':''}">${selo(i+1)}${celClube(x.t.id,20)}
      <u><i style="width:${(x.i/5*100).toFixed(0)}%"></i></u><b class="num">${x.i.toFixed(1).replace('.',',')}</b></div>`;}).join('')}</div>`;
}

/* ---------- cartão do departamento ---------- */
function cartaoDepto(t,d){
  const n=nivelEst(t,d.id);
  const max=n>=ESTRUTURA_MAX;
  const custo=max?0:custoObra(d.id,n);
  const pode=!max&&t.caixa>=custo;
  const anual=custeioNivelAnual(t,d.id);
  const prox=max?'':efeitosDepto(d.id,n+1).map((e,i)=>{
    const a=efeitosDepto(d.id,n)[i];
    if(e.abs)return e.v!==a.v?`<span>${esc(e.rot.toLowerCase())} <b class="num">${_fmtEf(e)}</b></span>`:'';
    return `<span>${esc(e.rot.toLowerCase())} <b class="num">${_fmtEf(e)}</b></span>`;
  }).filter(Boolean).join('');
  let idade='';
  if(d.id==='equip'&&t.estruturaIdade){
    const ida=t.estruturaIdade.equip||0,falta=EQUIP_VIDA-ida;
    idade=`<div class="dp-idade ${falta<=1&&n>1?'alerta':''}">${icone('relogio')}
      <span>${ida?`trocado há ${ida} temporada${ida>1?'s':''}`:'trocado nesta temporada'}${n>1?` · ${falta<=1?'cai um nível na próxima virada':'fica defasado em '+falta+' temporadas'}`:''}</span>
      ${ida&&n>1?`<button class="btn ghost sm" data-estrenova="1" ${t.caixa<custoRenovacao(t)?'disabled':''}>Renovar · ${money(custoRenovacao(t))}</button>`:''}</div>`;
  }
  return `<article class="dp-c ${max?'max':''}" data-depto="${d.id}">
    <button class="dp-cena" data-estver="${d.id}" title="Ver todos os níveis">${arteDepto(t,d.id,n)}<span class="dp-nvb">NV <b>${n}</b></span></button>
    <div class="dp-corpo">
      <div class="dp-tit"><span class="dp-ic">${icone(d.ic)}</span><div><b>${esc(d.nome)}</b>${_pips(n)}</div></div>
      ${listaEfeitos(d.id,n)}
      ${max?'<div class="dp-prox max">Departamento no nível máximo.</div>':`<div class="dp-prox"><span class="eyebrow">nível ${n+1}</span>${prox}</div>`}
      ${idade}
      <div class="dp-pe"><span class="dim">manutenção ${money(anual*n)}/ano</span>
        <div class="dp-bts"><button class="btn ghost sm" data-estver="${d.id}">Níveis</button>
        ${max?'<button class="btn sm" disabled>Máximo</button>'
          :`<button class="btn sm" data-estup="${d.id}" ${pode?'':'disabled title="caixa insuficiente"'}>Melhorar · ${money(custo)}</button>`}</div></div>
    </div></article>`;
}

/* ---------- a tela ---------- */
function vEstrutura(){
  const t=meu();
  garantirEstrutura(t);
  const cor=corDoClube(t);
  const idx=indiceEstrutura(t);
  const liga=rivaisDeEstrutura(t);
  const pos=liga.findIndex(x=>x.t.id===t.id)+1;
  const fat=t.tier===1?2:0.6;
  const manut=custeioEstruturaBase(t)*fat*SEMANAS_ANO;
  const livre=t.caixa-reservaMinima(t);
  const jovens=t.elenco.map(P).filter(p=>p&&p.idade<=30);
  const media=jovens.length?jovens.reduce((s,p)=>s+impactoEvolucao(t,p,alvosDoPlano(t,p).alvos)-1,0)/jovens.length:0;
  const grupos=Object.keys(GRUPOS_EST).filter(g=>g!=='base').map(g=>{
    const ds=DEPTOS.filter(d=>d.grupo===g);
    return `<div class="dp-grp"><div class="split"><div class="eyebrow">${esc(GRUPOS_EST[g])}</div>
      <span class="dim">${ds.length} departamento${ds.length>1?'s':''}</span></div>
      <div class="dp-grade">${ds.map(d=>cartaoDepto(t,d)).join('')}</div></div>`;
  }).join('');
  return `<section class="cx-hero dp-hero" style="--clube:${cor};--clube-rgb:${rgbDe(cor)}">
    <div class="cx-marca" aria-hidden="true">${escudo(t,260)}</div>
    <div class="cx-tit">
      <div class="eyebrow">Clube · ${esc(t.nome)}</div>
      <h1 class="cx-nome">Estrutura</h1>
      <p class="dp-lead">Sete departamentos. O que mais pesa é a <b>evolução</b>: o CT multiplica todo ganho, e equipamentos,
        análise e bem-estar aceleram cada um o seu grupo de atributos. O resto cuida do desgaste, da moral e da base.</p>
    </div>
    <div class="cx-kpis">
      <div class="kpi gold"><div class="lb">Índice de estrutura</div><div class="vl">${idx.toFixed(1).replace('.',',')}<small>/5</small></div><div class="sb">${pos}º de ${liga.length} na liga</div></div>
      <div class="kpi ${media>0?'teal':media<0?'red':''}"><div class="lb">Evolução do elenco</div><div class="vl">${_pct(media)}</div><div class="sb">vs. estrutura padrão</div></div>
      <div class="kpi"><div class="lb">Manutenção</div><div class="vl">${money(manut)}</div><div class="sb">por temporada</div></div>
      <div class="kpi ${livre<0?'red':''}"><div class="lb">Caixa para obras</div><div class="vl">${money(Math.max(0,livre))}</div><div class="sb">acima da reserva</div></div>
    </div>
  </section>
  ${grupos}
  <div class="dp-grp"><div class="split"><div class="eyebrow">${esc(GRUPOS_EST.base)} e comparação</div></div>
    <div class="dp-grade dp-linha">${DEPTOS.filter(d=>d.grupo==='base').map(d=>cartaoDepto(t,d)).join('')}
    <div class="card dp-ligac"><div class="split"><div class="eyebrow">Estrutura na liga</div><span class="dim">${esc(nomeLiga(t))}</span></div>
      ${blocoLiga(t,liga)}
      ${explica(`<p>Todo efeito é medido contra o <b>nível 3</b>, o padrão: um clube com tudo em 3 joga e evolui como sempre jogou.
        Abaixo disso perde, acima ganha.</p>
        <p>Obra é instantânea e sai do caixa. Cada nível também cobra manutenção todo ano, que entra no custeio das Finanças.</p>
        <p>Os <b>equipamentos envelhecem</b>: sem renovação, caem um nível a cada ${EQUIP_VIDA} temporadas. Renovar custa metade
        de uma obra do nível atual e zera o relógio.</p>
        <p>Os outros clubes também constroem, até duas obras por temporada, sempre deixando a reserva de uma folha inteira no caixa.</p>`,
        'Como a estrutura funciona')}</div></div></div>
  <div class="card dp-baixo"><div class="split"><div class="eyebrow">Quem sente a estrutura</div><span class="dim">por jogador, vs. tudo no nível 3</span></div>
    ${blocoImpacto(t)}
    <p class="dim dp-nota">Para quem ainda cresce, é a evolução com o plano da semana dele (CT × departamento do atributo).
      Para quem passou dos 30, é quanto o centro de performance freia o declínio.</p></div>
  </div>`;
}

/* ---------- detalhe: todos os níveis ---------- */
function modalDepto(k){
  const t=meu(),d=deptoDe(k);if(!d)return;
  const n=nivelEst(t,k);
  const linhas=[1,2,3,4,5].map(i=>`<tr class="${i===n?'eu':''}"><td>${_pips(i)}</td>
    ${efeitosDepto(k,i).map(e=>`<td class="num ${_efClasse(e)}">${Math.abs(e.v)<1e-9&&!e.abs?'padrão':e.f(e.v)}</td>`).join('')}
    <td class="num">${i<5?money(custoObra(k,i)):'—'}</td><td class="num">${money(custeioNivelAnual(t,k)*i)}</td></tr>`).join('');
  abrir(`<div class="dp-modal">
    <div class="dp-mcena">${arteDepto(t,k,n)}</div>
    <div class="eyebrow">${esc(GRUPOS_EST[d.grupo])}</div><h2 class="sec">${esc(d.nome)}</h2>
    <p class="dim">${esc(d.desc)}</p>
    <table class="tb dp-tab"><thead><tr><th>Nível</th>${efeitosDepto(k,1).map(e=>`<th>${esc(e.rot)}</th>`).join('')}<th>Obra p/ o próximo</th><th>Manutenção/ano</th></tr></thead>
      <tbody>${linhas}</tbody></table>
    <div class="dp-mpe">${n<ESTRUTURA_MAX?`<button class="btn" data-estup="${k}" ${t.caixa>=custoObra(k,n)?'':'disabled'}>Melhorar para o nível ${n+1} · ${money(custoObra(k,n))}</button>`:'<span class="dim">Nível máximo.</span>'}
      <button class="btn ghost" data-fechar>Fechar</button></div>
  </div>`,true);
  const box=$('#modal');
  if(box){
    box.querySelectorAll('[data-estup]').forEach(b=>b.onclick=()=>{$('#modal').innerHTML='';acaoMelhorar(b.dataset.estup);});
    box.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>fechar());
  }
}
function acaoMelhorar(k){
  const t=meu();
  const r=melhorarEstrutura(t,k);
  if(!r.ok){flash(r.erro);return;}
  noticia(r.depto.nome+' do clube chegou ao nível '+r.nivel+'.',{c:'clube',t:[t.id]});
  flash(r.depto.nome+': nível '+r.nivel+' · '+money(r.custo));
  render();
}
function ligarEstrutura(v){
  v.querySelectorAll('[data-estup]').forEach(b=>b.onclick=e=>{e.stopPropagation();acaoMelhorar(b.dataset.estup);});
  v.querySelectorAll('[data-estver]').forEach(b=>b.onclick=e=>{e.stopPropagation();modalDepto(b.dataset.estver);});
  v.querySelectorAll('[data-estrenova]').forEach(b=>b.onclick=()=>{
    const t=meu(),r=renovarEquipamento(t);
    if(!r.ok){flash(r.erro);return;}
    noticia('Equipamentos renovados: o clube trocou computadores e periféricos.',{c:'clube',t:[t.id]});
    flash('Equipamentos renovados · '+money(r.custo));render();
  });
}
