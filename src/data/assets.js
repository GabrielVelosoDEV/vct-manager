/* ============================================================
   ASSETS — escudos de clube e fotos de jogador
   ------------------------------------------------------------
   Convenção de arquivos (tudo opcional, há fallback gerado):
     assets/logos/<slug da tag>.png   ex.: assets/logos/sen.png
     assets/players/<slug do nick>.png ex.: assets/players/zekken.png
   O slug minusculiza, remove acento e troca espaço por hífen.
   Formatos aceitos: png, jpg, webp, svg (defina em ASSETS.ext).
   Um time ou jogador pode sobrescrever o caminho nos campos
   `logo` e `foto`, editáveis no Editor.
   ============================================================ */
const ASSETS={
  dirLogos:'assets/logos/',
  dirFotos:'assets/players/',
  ext:'png',
  slug(s){
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
  },
  /* ordem de resolução: pacote de imagens do Editor → caminho manual do
     campo logo/foto → convenção em assets/. O pacote vem primeiro porque é
     o que o usuário acabou de subir. */
  logo(t){
    const up=typeof Imgs!=='undefined'&&Imgs.get('logo:'+this.slug(t.tag));
    return up || t.logo || this.dirLogos+this.slug(t.tag)+'.'+this.ext;
  },
  foto(p){
    const up=typeof Imgs!=='undefined'&&Imgs.get('foto:'+this.slug(p.nome));
    return up || p.foto || this.dirFotos+this.slug(p.nome)+'.'+this.ext;
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
  return `<img class="logo-t" width="${px}" height="${px}" loading="lazy" alt="" src="${ASSETS.logo(t)}"
    onerror="this.onerror=null;this.src='${fb}'">`;
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
  const c=cadeiaRetrato(up||p.foto||'',ASSETS.dirFotos+ASSETS.slug(p.nome)+'.'+ASSETS.ext,gerado,fb);
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
  return up || t.logo || this.dirArtes+this.slug(t.id)+'.'+this.ext;
};
ASSETS.agente=function(nome){
  const up=typeof Imgs!=='undefined'&&Imgs.get('agente:'+this.slug(nome));
  return up || this.dirAgentes+this.slug(nome)+'.'+this.ext;
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
  return up || mk.logo || this.dirMarcas+this.slug(mk.id)+'.'+this.ext;
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
  return `<span class="linha-t">${arteTorneio(t,px||20)}<span>${esc(t.nome)}</span></span>`;
}

/* ---------- retrato de comissão técnica ---------- */
ASSETS.dirStaff='assets/staff/';
ASSETS.staff=function(m){
  if(!m)return '';
  const up=typeof Imgs!=='undefined'&&Imgs.get('staff:'+this.slug(m.nome));
  return up || m.foto || this.dirStaff+this.slug(m.nome)+'.'+this.ext;
};
function retratoStaff(m,px){
  px=px||44;if(!m)return '';
  const fb=monogramaAgente(m.nome,px);
  const up=typeof Imgs!=='undefined'&&Imgs.get('staff:'+ASSETS.slug(m.nome));
  const gerado=typeof Rostos!=='undefined'?Rostos.caminho(m):null;
  const c=cadeiaRetrato(up||m.foto||'',ASSETS.dirStaff+ASSETS.slug(m.nome)+'.'+ASSETS.ext,gerado,fb);
  return `<img class="foto-j" width="${px}" height="${Math.round(px*1.25)}" loading="lazy" alt=""
    src="${c.src}" onerror="${c.on}">`;
}
