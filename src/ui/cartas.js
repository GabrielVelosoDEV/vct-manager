/* ============================================================
   CARTA DO JOGADOR — desenho
   ------------------------------------------------------------
   Camadas, de baixo para cima:
     1. fundo da janela: degradê da cor da carta + escudo do clube
        bem apagado, para a janela nunca ficar um buraco preto;
     2. foto do jogador (PNG transparente), presa pela base, com a
        cintura escondida atrás da placa do nome;
     3. moldura (assets/cartas/<carta>.webp), com a janela vazada,
        então a borda e o brilho caem POR CIMA da foto;
     4. textos vivos: over, "OVR", nome e função.
   As molduras não trazem número nem função escritos: tudo que
   muda vem do jogo. A geometria de cada moldura (onde fica o
   número, a placa e a função) está em GEO_CARTA, em fração da
   carta, e é a mesma da especificação em docs/cartas.md.
   O tamanho é um só número (largura em px); o resto escala
   junto porque a carta é um container e o texto usa cqw.
   ============================================================ */
ASSETS.dirCartas='assets/cartas/';
ASSETS.carta=function(c){return this.dirCartas+c.id+'.webp';};

/* centro do número, da linha OVR, da placa do nome e da função (x,y em %) */
const GEO_CARTA={
  recruta:     {nx:16.2,ny:9.7, oy:16.6,py:85.9,ry:93.4},
  profissional:{nx:17.4,ny:8.9, oy:15.4,py:86.3,ry:93.4},
  elite:       {nx:17.9,ny:9.3, oy:16.6,py:87.1,ry:94.0},
  lenda:       {nx:15.2,ny:9.0, oy:15.6,py:85.6,ry:93.2}
};
const FUNCAO_CARTA={Duelista:'DUELISTA',Iniciador:'INICIADOR',Controlador:'CONTROLADOR',
  Sentinela:'SENTINELA',Flex:'FLEX'};

/* silhueta transparente para quem não tem foto nenhuma: o monograma quadrado
   de fundo claro ficaria colado em cima da carta */
function silhuetaCarta(){
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient></defs>
    <circle cx="100" cy="72" r="38" fill="url(#g)"/>
    <path d="M22 200 C22 140 58 118 100 118 C142 118 178 140 178 200 Z" fill="url(#g)"/></svg>`);
}

/* cartaJogador(p, {w, o, carta, anima})
     w      largura em px (altura = 1,5 × w)
     o      over a mostrar (padrão: over de agora)
     carta  índice de CARTAS a forçar (a revelação mostra a antiga e a nova)
     clique abre a ficha quando true */
function cartaJogador(p,opt){
  opt=opt||{};if(!p)return '';
  const w=opt.w||180;
  const o=opt.o!=null?opt.o:over(p);
  const c=CARTAS[opt.carta!=null?opt.carta:indiceCarta(o)];
  const g=GEO_CARTA[c.id];
  const time=p.timeId&&G.times?G.times[p.timeId]:null;
  /* mesma cadeia do retrato da lista, trocando só o último recurso */
  const up=typeof Imgs!=='undefined'&&Imgs.get('foto:'+ASSETS.slug(p.nome));
  const gerado=typeof Rostos!=='undefined'?Rostos.caminho(p):null;
  const cad=cadeiaRetrato(up||p.foto||'',ASSETS.arq('players',p.nome),gerado,silhuetaCarta());
  const nome=String(p.nome);
  /* nome comprido encolhe para caber na placa */
  const fn=nome.length<=7?9.4:nome.length<=10?8.2:nome.length<=13?6.6:5.4;
  return `<div class="carta c-${c.id}${opt.anima?' anima':''}${opt.clique?' clicavel jrow':''}"
    ${opt.clique?`data-p="${p.id}"`:''} style="--w:${w}px;--nx:${g.nx}%;--ny:${g.ny}%;--oy:${g.oy}%;--py:${g.py}%;--ry:${g.ry}%"
    title="${esc(nome)} · carta ${c.nome} (${c.min}–${Math.min(c.max,99)})">
    <div class="carta-fundo">${time?`<img class="carta-escudo" alt="" src="${ASSETS.logo(time)}" onerror="this.remove()">`:''}</div>
    <img class="carta-foto" alt="" loading="lazy" src="${cad.src}"
      onload="if(this.src.indexOf('/rostos/')>=0)this.classList.add('opaca')" onerror="${cad.on}">
    <img class="carta-moldura" alt="" src="${ASSETS.carta(c)}" onerror="this.classList.add('sem')">
    <div class="carta-ov">${o}</div><div class="carta-ovr">OVR</div>
    <div class="carta-nome" style="font-size:${fn}cqw">${esc(nome)}</div>
    <div class="carta-funcao">${FUNCAO_CARTA[p.role]||esc(String(p.role).toUpperCase())}</div>
  </div>`;
}

/* Revelação: a carta antiga gira e volta como a nova. Abre sozinha depois do
   avanço quando a fila G.cartasNovas tem alguém e nenhum outro modal está
   aberto; com mais de um, "Próxima" passa para o seguinte. */
function modalCartaNova(){
  if(!G||!G.cartasNovas||!G.cartasNovas.length)return false;
  const x=G.cartasNovas.shift();
  const p=G.jogadores[x.pid];
  if(!p)return modalCartaNova();
  const nova=CARTAS[x.para],velha=CARTAS[x.de];
  const resto=G.cartasNovas.length;
  abrir(`<div class="revela c-${nova.id}">
    <div class="eyebrow">Carta nova</div>
    <h2 class="sec">${esc(p.nome)} virou ${nova.nome}</h2>
    <p class="dim">Saiu da carta ${velha.nome} com ${over(p)} de over. A moldura nova já vale na ficha e no elenco.</p>
    <div class="revela-palco">
      <div class="revela-giro">
        <div class="revela-face frente">${cartaJogador(p,{w:240,carta:x.de,o:Math.min(over(p),velha.max)})}</div>
        <div class="revela-face verso">${cartaJogador(p,{w:240,carta:x.para,anima:true})}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
      ${resto?`<button class="btn" id="rvProx">Próxima (${resto})</button>`:''}
      <button class="btn ${resto?'ghost':''}" id="rvFicha">Ver ficha</button>
      <button class="btn ghost" data-close>Fechar</button>
    </div></div>`);
  const pr=$('#rvProx');if(pr)pr.onclick=()=>modalCartaNova();
  $("#rvFicha").onclick=()=>modalJogador(p.id);
  return true;
}
