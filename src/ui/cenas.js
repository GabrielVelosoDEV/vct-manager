/* ============================================================
   CENAS COM FOTO
   ------------------------------------------------------------
   Fotos neutras de ambientes (assets/cenas e assets/estrutura) que
   viram do seu clube: a placa branca vazia de cada foto (data/
   placas.js diz onde ela fica) ganha a cor do clube e o escudo.
   Sem o arquivo, nada aparece e a tela segue com o que já tinha.

   A foto cobre a caixa como um object-fit:cover, mas montada à mão
   (um palco do tamanho da foto, centrado e cortado pela caixa) para
   a placa continuar presa no lugar certo da foto em qualquer corte.
   ============================================================ */
function temCena(dir,nome){
  return !!(nome&&typeof MIDIA!=='undefined'&&MIDIA.arquivos&&MIDIA.arquivos[dir+'/'+nome]);
}
/* proporção de cada pasta (as fotos de uma pasta têm todas o mesmo tamanho) */
const PROPORCAO_CENA={cenas:16/9,estrutura:1600/753};
/* `foco`: altura da foto (0–100) que fica alinhada à mesma altura da caixa —
   50 corta igual em cima e embaixo; 25 mostra mais a parte de cima.
   `cls:'cn-direita'` põe a foto só na metade direita, sumindo para a
   esquerda: em faixas largas e baixas a foto encolhe e a placa cabe. */
function cenaFoto(dir,nome,t,opc){
  if(!temCena(dir,nome))return '';
  opc=opc||{};
  const k=dir+'/'+nome;
  const P=typeof PLACAS!=='undefined'?PLACAS[k]:null;
  const ar=PROPORCAO_CENA[dir]||16/9;
  /* foco 'placa': o topo da placa fica na mesma altura relativa da caixa,
     o que deixa a placa inteira à vista mesmo em faixas baixas */
  const foco=opc.foco==='placa'?(P?P[1]:30):opc.foco==null?50:opc.foco;
  return `<span class="cn ${opc.cls||''}" style="--ar:${ar.toFixed(4)};--foco:${foco}%" aria-hidden="true">
    <span class="cn-palco"><img class="cn-img" src="${ASSETS.arq(dir,nome)}" alt="" decoding="async" ${opc.ansioso?'':'loading="lazy"'}
      onerror="var c=this.closest('.cn');if(c){var p=c.parentNode;c.remove();if(p)p.classList.remove('com-cena');}">
      ${P&&t?placaDoClube(P,t):''}</span></span>`;
}
function placaDoClube(P,t){
  const cor=corDoClube(t);
  return `<span class="cn-placa" style="left:${P[0]}%;top:${P[1]}%;width:${P[2]}%;height:${P[3]}%;--clube:${cor}">
    <i class="cn-tinta"></i><span class="cn-marca">${escudo(t,96)}<b>${esc(t.tag||'')}</b></span></span>`;
}

/* ---------- a mesma cena num <canvas> (jogos de ritmo) ----------
   Carrega a foto e o escudo uma vez; desenhar() pinta cobrindo a tela,
   com a placa na cor do clube, e não faz nada enquanto não carregou. */
function cenaCanvas(dir,nome,t){
  if(!temCena(dir,nome))return null;
  const P=typeof PLACAS!=='undefined'?PLACAS[dir+'/'+nome]:null;
  const foto=new Image(),esc_=new Image();
  let ok=false,okEsc=false;
  foto.onload=()=>{ok=true;};foto.src=ASSETS.arq(dir,nome);
  if(t&&P){esc_.onload=()=>{okEsc=true;};esc_.src=ASSETS.logo(t);}
  const cor=t?corDoClube(t):'#7a8794';
  return{
    desenhar(cx,W,H,alfa){
      if(!ok)return;
      const iw=foto.naturalWidth,ih=foto.naturalHeight,s=Math.max(W/iw,H/ih);
      const dw=iw*s,dh=ih*s,dx=(W-dw)/2,dy=(H-dh)/2;
      cx.save();cx.globalAlpha=alfa==null?1:alfa;
      cx.drawImage(foto,dx,dy,dw,dh);
      if(P&&t){
        const x=dx+P[0]/100*dw,y=dy+P[1]/100*dh,w=P[2]/100*dw,h=P[3]/100*dh;
        cx.globalCompositeOperation='multiply';
        const g=cx.createLinearGradient(x,y,x+w,y+h);
        g.addColorStop(0,'#232a31');g.addColorStop(0.58,'#232a31');g.addColorStop(0.58,cor);g.addColorStop(0.66,cor);g.addColorStop(0.66,'#1b2127');g.addColorStop(1,'#1b2127');
        cx.fillStyle=g;cx.fillRect(x+1,y+1,w-2,h-2);
        cx.globalCompositeOperation='source-over';
        if(okEsc){const e=h*0.66;cx.drawImage(esc_,x+w*0.3-e/2,y+(h-e)/2,e,e);}
      }
      cx.restore();
    }
  };
}

/* ---------- qual cena vai em cada lugar ---------- */
const CENA_ATIVIDADE={bootcamp:'ativ-bootcamp',ranked:'ativ-ranked',stream:'ativ-stream',jantar:'ativ-jantar',sessao:'ativ-sessao',folga:'ativ-folga'};
/* notícia → foto pela categoria e pelo assunto do texto */
function cenaDaNoticia(n){
  if(!n)return null;
  const tx=String(n.txt||'').toLowerCase();
  let s=null;
  if(/lesã|lesio|desgaste|burnout|afastad|tendinite|punho/.test(tx))s='news-lesao';
  else if(/renov|contrato até|estende o contrato|novo contrato/.test(tx))s='news-contrato';
  else if(/academia|da base|revela|promovid|sub-|juvenil/.test(tx))s='news-base';
  else if(/diretoria|caixa|patroc|orçamento|financ|folha salarial|demiti|presidente|dono/.test(tx))s='news-diretoria';
  else if(n.c==='mercado'||/contrat|transfer|empréstimo|multa|proposta/.test(tx))s='news-mercado';
  else if(n.c==='competicoes'||/campeão|final|playoff|masters|champions|stage|título/.test(tx))s='news-torneio';
  return s&&temCena('cenas',s)?s:null;
}
function timeDaNoticia(n){
  const t=n&&n.t&&n.t.length?G.times[n.t[0]]:null;
  return t||(n&&n.meu&&typeof meu==='function'?meu():null);
}
