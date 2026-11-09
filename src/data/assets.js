/* ============================================================
   ASSETS — escudos de clube e fotos de jogador
   ------------------------------------------------------------
   Convenção de arquivos (tudo opcional, há fallback gerado):
     assets/logos/<slug da tag>.png   ex.: assets/logos/sen.png
     assets/players/<slug do nick>.png ex.: assets/players/zekken.png
   O slug minusculiza, remove acento e troca espaço por hífen.
   Formatos aceitos: png, jpg, webp, svg. O formato de cada arquivo
   vem do manifesto data/midia.js, que `npm run imagens` gera varrendo
   assets/; sem manifesto vale ASSETS.ext.
   Um time ou jogador pode sobrescrever o caminho nos campos
   `logo` e `foto`, editáveis no Editor.
   ============================================================ */
const ASSETS={
  dirLogos:'assets/logos/',
  dirFotos:'assets/players/',
  ext:'png',
  /* Caminho do arquivo na pasta, com a extensão que ele tem de verdade.
     `dir` é a subpasta de assets/ ('logos', 'players', 'staff'...). */
  arq(dir,nome){
    const s=this.slug(nome);
    const ext=typeof MIDIA!=='undefined'&&MIDIA.arquivos?MIDIA.arquivos[dir+'/'+s]:null;
    return 'assets/'+dir+'/'+s+'.'+(ext||this.ext);
  },
  slug(s){
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
  },
  /* ordem de resolução: pacote de imagens do Editor → caminho manual do
     campo logo/foto → convenção em assets/. O pacote vem primeiro porque é
     o que o usuário acabou de subir. */
  logo(t){
    const up=typeof Imgs!=='undefined'&&Imgs.get('logo:'+this.slug(t.tag));
    return up || t.logo || this.arq('logos',t.tag);
  },
  foto(p){
    const up=typeof Imgs!=='undefined'&&Imgs.get('foto:'+this.slug(p.nome));
    return up || p.foto || this.arq('players',p.nome);
  }
};
function svgURI(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function corDe(txt){
  let h=0;for(let i=0;i<txt.length;i++)h=(h*31+txt.charCodeAt(i))>>>0;
  const paleta=['#0F1923','#BD2C38','#128E7F','#5B3E8E','#1F6FA8','#8A6A1F','#2B6E3F','#7A2E4A'];
  return paleta[h%paleta.length];
}
function monogramaTime(tag,px){
  const c=corDe(tag),t=esc(String(tag).slice(0,4));
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${c}"/><path d="M0 48 L64 48 L64 64 L16 64 Z" fill="rgba(255,255,255,.12)"/>
    <text x="32" y="41" font-family="Bebas Neue,Impact,sans-serif" font-size="${t.length>3?24:30}"
      fill="#ECE8E1" text-anchor="middle" letter-spacing="1">${t}</text></svg>`);
}
function monogramaJogador(nome,px){
  const c=corDe(nome),i=String(nome).slice(0,2).toUpperCase();
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#E2DDD4"/><circle cx="32" cy="25" r="12" fill="${c}" opacity=".85"/>
    <path d="M8 64 C8 46 20 40 32 40 C44 40 56 46 56 64 Z" fill="${c}" opacity=".85"/>
    <text x="32" y="60" font-family="JetBrains Mono,monospace" font-size="12" fill="#0F1923"
      text-anchor="middle" opacity=".55">${i}</text></svg>`);
}
/* helpers de render */
function escudo(t,px){
  px=px||22;if(!t)return '';
  const fb=monogramaTime(t.tag,px);
  return `<img class="logo-t" width="${px}" height="${px}" loading="lazy" alt="" ${t.id?`data-tid="${t.id}"`:''} src="${ASSETS.logo(t)}"
    onerror="this.onerror=null;this.src='${fb}'">`;
}
/* Cor do clube (pacote V5). Vem do próprio escudo (tools/cores.py → data/
   cores.js, que prioriza a cor de destaque: escudo preto e vermelho fica
   vermelho); escudo sem cor fica prata. O Banco de dados pode trocar à mão
   (t.cor). Escudo enviado pelo Editor não tem cor calculada: fica prata até
   alguém escolher. */
const COR_CLUBE_PADRAO='#D6DCE2';
function corDoEscudo(t){
  if(!t)return COR_CLUBE_PADRAO;
  const k=String(t.tag||'').toUpperCase();
  return (typeof CORES_CLUBES!=='undefined'&&CORES_CLUBES[k])||COR_CLUBE_PADRAO;
}
function corDoClube(t){
  if(!t)return COR_CLUBE_PADRAO.toLowerCase();
  return String(t.cor||corDoEscudo(t)).toLowerCase();
}
/* #rrggbb → "r,g,b" para usar dentro de rgba() no CSS */
function rgbDe(hex){
  const h=String(hex||COR_CLUBE_PADRAO).replace('#','');
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0).join(',');
}
/* Cadeia de resolução do retrato, do mais específico ao mais genérico:
     1. foto que você subiu no pacote      (definitiva)
     2. caminho manual no campo foto        (definitiva)
     3. arquivo em assets/players/          (pode não existir)
     4. rosto do pacote gerado              (se montado e a pessoa for elegível)
     5. monograma desenhado                 (sempre funciona)
   Quando 1 ou 2 existem não faz sentido tentar 3 e 4, então a cadeia de
   onerror é montada de acordo. */
function cadeiaRetrato(fonteDefinitiva,fonteFolder,gerado,fb){
  if(fonteDefinitiva)return{src:fonteDefinitiva,on:`this.onerror=null;this.src='${fb}'`};
  if(gerado)return{src:fonteFolder,
    on:`this.onerror=function(){this.onerror=null;this.src='${fb}'};this.src='${gerado}'`};
  return{src:fonteFolder,on:`this.onerror=null;this.src='${fb}'`};
}
function retrato(p,px){
  px=px||30;if(!p)return '';
  const fb=monogramaJogador(p.nome,px);
  const up=typeof Imgs!=='undefined'&&Imgs.get('foto:'+ASSETS.slug(p.nome));
  const gerado=typeof Rostos!=='undefined'?Rostos.caminho(p):null;
  const c=cadeiaRetrato(up||p.foto||'',ASSETS.arq('players',p.nome),gerado,fb);
  return `<img class="foto-j" width="${px}" height="${px}" loading="lazy" alt="" src="${c.src}"
    onerror="${c.on}">`;
}
function timeInline(id,px){
  const t=(typeof G!=='undefined'&&G.times)?G.times[id]:null;
  if(!t)return '—';
  return `<span class="linha-t">${escudo(t,px||20)}<span>${esc(t.nome)}</span></span>`;
}

/* ---------- artes de torneio e retratos de agente ----------
   Mesma ordem de resolução dos escudos: pacote do Editor → caminho manual
   → pasta em assets/ → monograma gerado. Nada quebra sem arquivo. */
ASSETS.dirArtes='assets/torneios/';
ASSETS.dirAgentes='assets/agentes/';
ASSETS.arte=function(t){
  if(!t)return '';
  const up=typeof Imgs!=='undefined'&&Imgs.get('arte:'+this.slug(t.id));
  return up || t.logo || this.arq('torneios',t.id);
};
ASSETS.agente=function(nome){
  const up=typeof Imgs!=='undefined'&&Imgs.get('agente:'+this.slug(nome));
  return up || this.arq('agentes',nome);
};
function monogramaTorneio(curto,px){
  const c=corDe(String(curto)),t=esc(String(curto).slice(0,12).toUpperCase());
  /* textLength força o rótulo a caber no escudo: sem isso 'CHAMPIONS' vazava */
  const fs=t.length>8?8:t.length>5?11:15;
  const enc=t.length>4?' textLength="42" lengthAdjust="spacingAndGlyphs"':'';
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#16222E"/>
    <path d="M32 6 54 15v20c0 12-9 19-22 23-13-4-22-11-22-23V15z" fill="${c}" opacity=".9"/>
    <text x="32" y="38" font-family="Bebas Neue,Impact,sans-serif" font-size="${fs}"${enc}
      fill="#ECE8E1" text-anchor="middle">${t}</text></svg>`);
}
function monogramaAgente(nome,px){
  const c=corDe(String(nome)),i=String(nome).slice(0,2).toUpperCase();
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${Math.round(px*1.25)}"
    viewBox="0 0 64 80"><rect width="64" height="80" fill="#1C2A38"/>
    <circle cx="32" cy="30" r="14" fill="${c}" opacity=".85"/>
    <path d="M6 80c0-18 12-26 26-26s26 8 26 26z" fill="${c}" opacity=".85"/>
    <text x="32" y="74" font-family="JetBrains Mono,monospace" font-size="11" fill="#0F1923"
      text-anchor="middle" opacity=".6">${i}</text></svg>`);
}
function arteTorneio(t,px){
  px=px||34;if(!t)return '';
  const fb=monogramaTorneio(t.curto||t.id,px);
  return `<img class="logo-t" width="${px}" height="${px}" loading="lazy" alt=""
    src="${ASSETS.arte(t)}" onerror="this.onerror=null;this.src='${fb}'">`;
}
ASSETS.dirMarcas='assets/marcas/';
ASSETS.marca=function(mk){
  if(!mk)return '';
  const up=typeof Imgs!=='undefined'&&Imgs.get('marca:'+this.slug(mk.id));
  return up || mk.logo || this.arq('marcas',mk.id);
};
/* Assinatura deitada, com o nome escrito por extenso quando cabe. Marca sem
   logo tem de continuar legível: é o nome dela que identifica, não a cor. */
function monogramaMarca(mk,px){
  const larg=px||120, alt=Math.round(larg/2);
  const nome=String((mk&&mk.nome)||'—');
  const c=corDe(nome);
  const t=esc(nome.toUpperCase().slice(0,18));
  const fs=t.length>14?12:t.length>10?15:19;
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${larg}" height="${alt}" viewBox="0 0 160 80">
    <rect width="160" height="80" rx="6" fill="#16222E"/>
    <rect x="6" y="6" width="8" height="68" rx="3" fill="${c}"/>
    <text x="88" y="47" font-family="Bebas Neue,Impact,sans-serif" font-size="${fs}"
      textLength="126" lengthAdjust="spacingAndGlyphs"
      fill="#ECE8E1" text-anchor="middle">${t}</text></svg>`);
}
function logoMarca(mk,px){
  px=px||120;
  if(!mk)return '';
  const fb=monogramaMarca(mk,px);
  return `<img class="logo-mk" width="${px}" height="${Math.round(px/2)}" loading="lazy" alt=""
    src="${ASSETS.marca(mk)}" onerror="this.onerror=null;this.src='${fb}'">`;
}
function retratoAgente(nome,px){
  px=px||44;
  const fb=monogramaAgente(nome,px);
  return `<img class="foto-j" width="${px}" height="${Math.round(px*1.25)}" loading="lazy" alt=""
    src="${ASSETS.agente(nome)}" onerror="this.onerror=null;this.src='${fb}'">`;
}
/* nome do torneio com a arte ao lado */
function torneioInline(id,px){
  const t=typeof torneio==='function'?torneio(id):null;
  if(!t)return '—';
  const nome=typeof nomeDoAno==='function'?nomeDoAno(id):t.nome;
  return `<span class="linha-t">${arteTorneio(t,px||20)}<span>${esc(nome||t.nome)}</span></span>`;
}

/* ---------- retrato de comissão técnica ---------- */
ASSETS.dirStaff='assets/staff/';
ASSETS.staff=function(m){
  if(!m)return '';
  const up=typeof Imgs!=='undefined'&&Imgs.get('staff:'+this.slug(m.nome));
  return up || m.foto || this.arq('staff',m.nome);
};
function retratoStaff(m,px){
  px=px||44;if(!m)return '';
  const fb=monogramaAgente(m.nome,px);
  const up=typeof Imgs!=='undefined'&&Imgs.get('staff:'+ASSETS.slug(m.nome));
  const gerado=typeof Rostos!=='undefined'?Rostos.caminho(m):null;
  /* ex-jogador na comissão mantém a foto de quando jogava */
  if(m.ex){const upJ=typeof Imgs!=='undefined'&&Imgs.get('foto:'+ASSETS.slug(m.ex.nome));
    const cj=cadeiaRetrato(up||upJ||m.ex.foto||'',ASSETS.arq('players',m.ex.nome),gerado,fb);
    return `<img class="foto-j" width="${px}" height="${Math.round(px*1.25)}" loading="lazy" alt="" src="${cj.src}" onerror="${cj.on}">`;}
  const c=cadeiaRetrato(up||m.foto||'',ASSETS.arq('staff',m.nome),gerado,fb);
  return `<img class="foto-j" width="${px}" height="${Math.round(px*1.25)}" loading="lazy" alt=""
    src="${c.src}" onerror="${c.on}">`;
}

/* ---------- mapas, cidades-sede e troféus ----------
   Mapa e cidade são FUNDO, não ícone: entram como background em CSS, com uma
   camada escura por cima para o texto continuar legível (vários mapas vêm com
   céu quase branco). Sem arquivo, o CSS simplesmente não acha a imagem e fica
   a camada sobre o painel — nada quebra e não precisa de onerror. */
function urlCSS(u){return "url('"+String(u).replace(/'/g,"%27")+"')";}
ASSETS.mapa=function(nome){
  const up=typeof Imgs!=='undefined'&&Imgs.get('mapa:'+this.slug(nome));
  return up||this.arq('mapas',nome);
};
ASSETS.cidade=function(slug){
  const up=typeof Imgs!=='undefined'&&Imgs.get('cidade:'+slug);
  return up||this.arq('cidades',slug);
};
ASSETS.trofeu=function(arquivo){
  const up=typeof Imgs!=='undefined'&&Imgs.get('trofeu:'+arquivo);
  return up||this.arq('trofeus',arquivo);
};
/* style="" pronto: fundo do mapa com a camada que escurece de baixo para cima */
function fundoMapa(nome,forca){
  const f=forca==null?0.55:forca;
  return `background-image:linear-gradient(180deg,rgba(11,18,24,${(f*0.55).toFixed(2)}) 0%,rgba(11,18,24,${f}) 55%,rgba(11,18,24,${Math.min(0.96,f+0.3).toFixed(2)}) 100%),${urlCSS(ASSETS.mapa(nome))};background-size:cover;background-position:center`;
}
function fundoCidade(slug,forca){
  const f=forca==null?0.5:forca;
  return `background-image:linear-gradient(90deg,rgba(11,18,24,${Math.min(0.95,f+0.35).toFixed(2)}) 0%,rgba(11,18,24,${f}) 45%,rgba(11,18,24,${(f*0.4).toFixed(2)}) 100%),${urlCSS(ASSETS.cidade(slug))};background-size:cover;background-position:center`;
}
/* troféu genérico desenhado: taça simples na cor do torneio */
function monogramaTrofeu(px,cor){
  const c=cor||'#C8943A';
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${Math.round(px*1.5)}" viewBox="0 0 64 96">
    <path d="M18 8h28v18c0 11-6 20-14 20s-14-9-14-20z" fill="${c}"/>
    <path d="M18 14H8c0 10 5 16 12 17M46 14h10c0 10-5 16-12 17" fill="none" stroke="${c}" stroke-width="3"/>
    <rect x="29" y="46" width="6" height="22" fill="${c}"/>
    <path d="M20 68h24l4 12H16z" fill="${c}" opacity=".85"/>
    <rect x="12" y="80" width="40" height="8" rx="2" fill="#16222E" stroke="${c}"/></svg>`);
}
/* <img> do troféu: `arquivo` é o nome sem pasta e sem extensão
   (arquivoTrofeu() e arquivoTrofeuPremio() em core/sedes.js dizem qual) */
function imgTrofeu(arquivo,px,titulo){
  px=px||40;
  const fb=monogramaTrofeu(px,/^champions/.test(arquivo||'')?'#E8C46A':/^masters/.test(arquivo||'')?'#B9C3CE':null);
  return `<img class="trofeu" width="${px}" height="${Math.round(px*1.5)}" loading="lazy" alt="${esc(titulo||'')}"
    ${titulo?`title="${esc(titulo)}"`:''} src="${arquivo?ASSETS.trofeu(arquivo):fb}" onerror="this.onerror=null;this.src='${fb}'">`;
}
/* O troféu de um título já ganho, pelo histórico. Títulos da pré-história e de
   saves antigos não guardam o arquivo, então ele é deduzido do nome:
   "Masters Toronto" → variante da cidade, "Stage 1 · VCT EMEA" → stage1-emea. */
function trofeuDoTitulo(ano,evento){
  const h=(G&&G.historico||[]).find(x=>x&&x.ano===ano&&x.evento===evento&&x.trofeu);
  if(h)return h.trofeu;
  const ev=String(evento||'');
  const porCidade=(tipo,nome)=>{
    const c=typeof cidades==='function'?cidades().find(k=>k.nome===nome.trim()):null;
    const slug=c?c.slug:ASSETS.slug(nome);
    const n=typeof _variantesTrofeu==='function'?_variantesTrofeu(tipo):10;
    return tipo+'-'+String((_hashSede(slug)%n)+1).padStart(2,'0');
  };
  let m=ev.match(/^Champions (.+)$/);if(m&&!/^\d/.test(m[1]))return porCidade('champions',m[1]);
  if(/Champions/.test(ev))return 'champions-01';
  m=ev.match(/^Masters (.+)$/);if(m&&!/^(I|II)$/.test(m[1]))return porCidade('masters',m[1]);
  if(/^Masters/.test(ev))return 'masters-01';
  const reg=typeof REGIONS!=='undefined'?REGIONS.find(R=>ev.includes(R.nome)||ev.includes(R.nome.replace(/^VCT /,''))||(R.t2&&ev.includes(R.t2))):null;
  const suf=reg&&typeof TROFEU_REGIAO!=='undefined'?TROFEU_REGIAO[reg.id]:null;
  if(suf){
    if(/^Kickoff/.test(ev))return 'kickoff-'+suf;
    m=ev.match(/Stage (\d)/);if(m)return 'stage'+m[1]+'-'+suf;
    if(/Split|Challengers/.test(ev))return 'challengers-'+suf;
    if(/Ascension/.test(ev))return 'ascension-'+suf;
  }
  return 'padrao';
}
/* Arte de um stage: os playoffs do Stage e do Split podem ter arte própria
   (assets/torneios/po1-amer.png…), mesmo sendo o mesmo torneio que os grupos.
   Sem ela, vale a arte do evento. */
function arteDoStage(s,px){
  const tn=typeof torneio==='function'?torneio(s&&s.torneioId):null;
  if(s&&/^(po|cp)\d_/.test(s.id)&&typeof MIDIA!=='undefined'&&MIDIA.arquivos&&MIDIA.arquivos['torneios/'+ASSETS.slug(s.id)]){
    const fb=monogramaTorneio((tn&&tn.curto)||s.id,px||34);
    return `<img class="logo-t" width="${px||34}" height="${px||34}" loading="lazy" alt=""
      src="${ASSETS.arq('torneios',s.id)}" onerror="this.onerror=null;this.src='${fb}'">`;
  }
  return arteTorneio(tn,px);
}
