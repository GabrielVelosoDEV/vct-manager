/* ============================================================
   MODO DONO — ASSISTENTE "CRIAR A SUA ORGANIZAÇÃO"
   ------------------------------------------------------------
   Cinco passos sobre core/criacao-org.js: origem, entrada,
   equipe nova, dinheiro e resumo. Abre da tela de novo jogo
   quando o papel é Dono e o começo é "criar a sua".
   ============================================================ */
let escOrg={passo:1,origem:'empresario',entrada:'compra',regiao:'AMER',tier:2,timeId:null,
  nome:'',tag:'',cor:'#E2B45A',cor2:'#0F1923',forma:'escudo',upload:null,pais:'BR',cidade:'',
  projeto:null,nomeFusao:'seu',financiamento:0,aporte:0};
const FORMAS_ESCUDO={
  escudo:'M50 4 L92 18 V50 C92 74 72 90 50 96 C28 90 8 74 8 50 V18 Z',
  hexagono:'M50 4 L90 27 V73 L50 96 L10 73 V27 Z',
  losango:'M50 3 L97 50 L50 97 L3 50 Z',
  circulo:'M50 4 A46 46 0 1 1 49.9 4 Z'
};
/* o escudo gerado: forma, duas cores e a sigla */
function escudoGerado(forma,cor,cor2,tag){
  const d=FORMAS_ESCUDO[forma]||FORMAS_ESCUDO.escudo;
  const s=esc(String(tag||'?').toUpperCase().slice(0,4));
  const fs=s.length<=2?40:s.length===3?32:25;
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><clipPath id="c"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="${cor2}"/>
    <g clip-path="url(#c)"><path d="M-10 70 L110 30 L110 46 L-10 86 Z" fill="${cor}" opacity=".22"/></g>
    <path d="${d}" fill="none" stroke="${cor}" stroke-width="5"/>
    <path d="${d}" fill="none" stroke="${cor}" stroke-width="1.2" opacity=".55" transform="translate(50 50) scale(.84) translate(-50 -50)"/>
    <text x="50" y="${50+fs*0.36}" text-anchor="middle" font-family="'Bebas Neue',Impact,Arial Black,sans-serif" font-size="${fs}" letter-spacing="1" fill="${cor}">${s}</text></svg>`);
}
function escudoDaOrg(){return escOrg.upload||escudoGerado(escOrg.forma,escOrg.cor,escOrg.cor2,escOrg.tag||'?');}
/* escudo enviado: quadrado de 256 com o desenho inteiro dentro, fundo transparente */
function escudoDoArquivo(file){
  return new Promise((res,rej)=>{
    if(!file||!(/^image\//.test(file.type||'')||/\.(png|jpe?g|webp|svg|gif)$/i.test(file.name||'')))return rej(new Error('Escolha uma imagem (PNG, JPG, WebP ou SVG).'));
    const fr=new FileReader();
    fr.onload=()=>{const im=new Image();im.onload=()=>{
      const W=256,cv=document.createElement('canvas');cv.width=W;cv.height=W;
      const e=Math.min(W/im.width,W/im.height),w=im.width*e,h=im.height*e;
      cv.getContext('2d').drawImage(im,(W-w)/2,(W-h)/2,w,h);res(cv.toDataURL('image/png'));};
      im.onerror=()=>rej(new Error('Não deu para ler essa imagem.'));im.src=fr.result;};
    fr.onerror=()=>rej(new Error('Falha ao ler o arquivo.'));fr.readAsDataURL(file);
  });
}
function _optsOrg(){return Object.assign({},escOrg,{facil:typeof escDif!=='undefined'&&escDif==='facil',escudo:escOrg.upload||escudoGerado(escOrg.forma,escOrg.cor,escOrg.cor2,escOrg.tag)});}
function _tierDaOrg(){
  if(escOrg.entrada==='fundar')return 2;
  const t=escOrg.timeId&&G.times[escOrg.timeId];return t?t.tier:escOrg.tier;
}
const PASSOS_ORG=['Origem','Como entra','A equipe','Dinheiro','Resumo'];

function telaCriarOrg(){
  const o=escOrg, c=contaDaEntrada(_optsOrg());
  const passo=o.passo;
  const nav=`<ol class="og-passos">${PASSOS_ORG.map((n,i)=>`<li class="${i+1===passo?'on':i+1<passo?'feito':''}" data-ogir="${i+1}"><b>${i+1}</b>${esc(n)}</li>`).join('')}</ol>`;
  let corpo='';
  if(passo===1){
    corpo=`<p class="dim">De onde vem o seu dinheiro. O patrimônio é seu; você decide no passo 4 quanto dele vai para a organização${escDif==='facil'?' (Fácil: patrimônio × 1,5)':''}.</p>
      <div class="og-origens">${ORIGENS_DONO.map(x=>`<button class="og-origem ${o.origem===x.id?'on':''}" data-ogorigem="${x.id}">
        <b>${esc(x.nome)}</b><em class="num">${money(patrimonioInicial(x.id,escDif==='facil'))}</em>
        <span class="og-mais">${icone('sobe')} ${esc(x.forte)}</span><span class="og-menos">${icone('desce')} ${esc(x.fraco)}</span></button>`).join('')}</div>`;
  }else if(passo===2){
    const ent=[['compra','Comprar a vaga','Paga o preço da vaga. Leva vaga, elenco, comissão e contratos; o clube vendido some do circuito e a torcida antiga começa fria.'],
      ['fusao','Fusão','Paga menos e divide o clube: o dono antigo vira sócio com 40%. Vaga, elenco, história e boa parte da torcida ficam.'],
      ['fundar','Fundar do zero','Paga a inscrição ('+money(TAXA_FUNDACAO)+') e entra no Challengers no lugar do clube mais fraco da região. Sem torcida, sem patrocínio, com cinco agentes livres.']];
    let lista='';
    if(o.entrada==='fundar'){
      const sai=vagaParaFundar(o.regiao);
      lista=`<div class="tabs">${REGIONS.map(r=>`<button data-ogrg="${r.id}" class="${o.regiao===r.id?'on':''}">${esc(r.nome)}</button>`).join('')}</div>
        ${sai?`<div class="og-sai">${escudo(sai,48)}<div><b>${esc(sai.nome)}</b> sai do circuito e abre a vaga.
          <span class="dim">O elenco dele vai para o mercado; a vaga, a comissão e a estrutura mínima ficam com você.</span></div></div>`:''}`;
    }else{
      const ids=(G.regioes[o.regiao][o.tier===1?'t1':'t2']||[]).slice().sort((a,b)=>T(b).prestigio-T(a).prestigio);
      lista=`<div class="tabs">${REGIONS.map(r=>`<button data-ogrg="${r.id}" class="${o.regiao===r.id?'on':''}">${esc(r.nome)}</button>`).join('')}</div>
        <div class="tabs">${[[1,'Liga principal (Tier 1)'],[2,'Challengers (Tier 2)']].map(([k,n])=>`<button data-ogtr="${k}" class="${o.tier===k?'on':''}">${n}</button>`).join('')}</div>
        <div class="og-clubes">${ids.map(id=>{const t=T(id),r=respostaDoDono(t,o.entrada),d=t.dono||{};const pf=PERFIS_DONO[d.perfil];
          return `<button class="og-clube ${o.timeId===id?'on':''} ${r.aceita?'':'nao'}" data-ogclube="${id}" ${r.aceita?'':'title="'+esc(r.motivo)+'"'}>
            ${escudo(t,40)}<div class="og-c-n"><b>${esc(t.nome)}</b><span class="dim">${typeof retratoDono==='function'?retratoDono(d,t,18):''} ${esc(d.nome||'—')}${pf?' · '+esc(pf.nome):''}</span></div>
            <div class="og-c-p">${r.aceita?`<b class="num">${money(r.preco)}</b>`:'<b class="dn">não negocia</b>'}<span class="dim">${esc(r.motivo)}</span></div></button>`;}).join('')}</div>`;
    }
    corpo=`<div class="og-entradas">${ent.map(([k,n,d])=>`<button class="nj-papel ${o.entrada===k?'on':''}" data-ogent="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>${lista}`;
  }else if(passo===3){
    const t=o.timeId&&G.times[o.timeId];
    const cid=(typeof cidades==='function'?cidades():[]).filter(x=>x.pais===o.pais);
    const dele=o.entrada==='fusao'&&o.nomeFusao==='dele';
    const projs=Object.entries(PROJETOS).filter(([k])=>!(k==='titulos'&&_tierDaOrg()!==1)&&!(k==='acesso'&&_tierDaOrg()!==2));
    corpo=`${o.entrada==='fusao'&&t?`<div class="eyebrow">O nome depois da fusão</div><div class="og-entradas">
        ${[['seu','O seu','O clube passa a ter o seu nome, sigla e escudo.'],['dele','Manter '+t.nome,'Fica o nome e o escudo dele; muda só o dono.'],['juntos','Os dois juntos','"'+(o.nome||'Seu nome')+' '+t.nome+'", com a sua sigla.']].map(([k,n,d])=>`<button class="nj-papel ${o.nomeFusao===k?'on':''}" data-ognf="${k}"><b>${esc(n)}</b><span>${esc(d)}</span></button>`).join('')}</div>`:''}
      <div class="og-equipe ${dele?'og-off':''}">
        <div class="og-escudo-prev"><img src="${dele&&t?ASSETS.logo(t):escudoDaOrg()}" alt=""><b>${esc(dele&&t?t.nome:(o.nome||'Sua organização'))}</b></div>
        <div class="campos og-campos">
          <label>Nome<input type="text" id="ogNome" maxlength="32" value="${esc(o.nome)}" placeholder="como o circuito vai chamar" ${dele?'disabled':''}></label>
          <label>Sigla<input type="text" id="ogTag" maxlength="4" value="${esc(o.tag)}" placeholder="2 a 4 letras" ${dele?'disabled':''}></label>
          <label>Cor principal<input type="color" id="ogCor" value="${esc(o.cor)}"></label>
          <label>Cor do fundo<input type="color" id="ogCor2" value="${esc(o.cor2)}"></label>
          <label>País-sede${selectPais('id="ogPais"',o.pais)}</label>
          <label>Cidade-sede${cid.length?`<select id="ogCidade"><option value="">—</option>${cid.map(x=>`<option ${o.cidade===x.nome?'selected':''}>${esc(x.nome)}</option>`).join('')}</select>`:`<input type="text" id="ogCidade" maxlength="40" value="${esc(o.cidade)}" placeholder="a cidade da sede">`}</label>
        </div>
        <div class="og-formas">${dele?'':`<span class="eyebrow">Escudo</span>
          ${Object.keys(FORMAS_ESCUDO).map(f=>`<button class="og-forma ${!o.upload&&o.forma===f?'on':''}" data-ogforma="${f}"><img src="${escudoGerado(f,o.cor,o.cor2,o.tag||'?')}" alt=""></button>`).join('')}
          <label class="btn ghost sm">Enviar imagem<input type="file" id="ogUp" accept="image/*" hidden></label>
          ${o.upload?'<button class="btn ghost sm" id="ogTiraUp">Usar o gerado</button>':''}`}</div>
      </div>
      <div class="eyebrow" style="margin-top:16px">Proposta da organização · três temporadas</div>
      <div class="og-projs">${projs.map(([k,p])=>`<button class="nj-estilo ${o.projeto===k?'on':''}" data-ogproj="${k}"><b>${esc(p.nome)}</b><span>${esc(p.desc)}</span></button>`).join('')}</div>`;
  }else if(passo===4){
    const maxAp=Math.max(0,c.disponivel-c.preco);
    corpo=`<div class="og-din">
      <div class="og-din-l">
        <label class="og-range"><span>Financiamento <b class="num">${Math.round(o.financiamento*100)}%</b> do patrimônio · ${money(c.emprestimo)}</span>
          <input type="range" id="ogFin" min="0" max="${FINANC_MAX*100}" step="5" value="${Math.round(o.financiamento*100)}"></label>
        <p class="dim">Empréstimo da organização a ${Math.round(JUROS_DONO*100)}% ao ano em ${PRAZO_DONO} temporadas. A parcela sai do caixa toda semana.</p>
        <label class="og-range"><span>Aporte no caixa do clube <b class="num">${money(c.aporte)}</b></span>
          <input type="range" id="ogAp" min="0" max="${maxAp}" step="50000" value="${Math.min(o.aporte,maxAp)}"></label>
        <p class="dim">O que você põe na organização além da entrada. O que sobra fica no seu patrimônio, para cobrir crises depois.</p>
      </div>
      ${_contaOrgHTML(c)}</div>`;
  }else{
    const t=c.clube;
    corpo=`<div class="og-resumo">
      <div class="og-escudo-prev grande"><img src="${o.entrada==='fusao'&&o.nomeFusao==='dele'&&t?ASSETS.logo(t):escudoDaOrg()}" alt="">
        <b>${esc(o.entrada==='fusao'&&o.nomeFusao==='dele'&&t?t.nome:o.entrada==='fusao'&&o.nomeFusao==='juntos'&&t?(o.nome+' '+t.nome):o.nome||'—')}</b>
        <span class="dim">${esc(o.tag||'')}${o.cidade?' · '+esc(o.cidade):''} · ${bandeira(o.pais)}</span></div>
      <div>
        <div class="og-linha"><span>Dono</span><b>${esc(escNome||'Você')} · ${esc(origemDono(o.origem).nome)}</b></div>
        <div class="og-linha"><span>Entrada</span><b>${o.entrada==='compra'?'Compra da vaga do '+esc(t?t.nome:'—'):o.entrada==='fusao'?'Fusão com o '+esc(t?t.nome:'—'):'Fundação no Challengers '+esc((REGIONS.find(r=>r.id===o.regiao)||{}).nome||'')}</b></div>
        ${c.socio?`<div class="og-linha"><span>Sócio</span><b>${esc(c.socio.nome)} · ${Math.round(c.socio.fatia*100)}%</b></div>`:''}
        <div class="og-linha"><span>Liga</span><b>${_tierDaOrg()===1?'Tier 1':'Challengers'}</b></div>
        <div class="og-linha"><span>Proposta</span><b>${o.projeto?esc(PROJETOS[o.projeto].nome):'escolher depois'}</b></div>
        ${_contaOrgHTML(c)}
        ${c.ok?'':`<div class="og-erro">${icone('alerta')} ${esc(c.erro)}</div>`}
      </div></div>`;
  }
  pintarModal(`<div class="ovl nj-ovl og-ovl"><div class="box wide">
    <div class="eyebrow">Modo Dono · criar a sua organização</div><h2 class="sec">${esc(PASSOS_ORG[passo-1])}</h2>
    ${nav}<div class="og-corpo">${corpo}</div>
    <div class="og-pe"><button class="btn ghost" id="ogVolta">${passo===1?'Voltar ao novo jogo':'‹ Voltar'}</button>
      <span class="og-pe-c dim">${c.preco?'Entrada '+money(c.preco)+' · ':''}disponível ${money(c.disponivel)}</span>
      ${passo<5?`<button class="btn" id="ogVai">Próximo ›</button>`:`<button class="btn nj-assumir" id="ogComeca" ${c.ok?'':'disabled'}>Fundar e começar ›</button>`}</div>
  </div></div>`);
  _ligarCriarOrg();
}
function _contaOrgHTML(c){
  return `<div class="og-conta">
    <div><span>Patrimônio</span><b class="num">${money(c.patrimonio)}</b></div>
    <div><span>+ Financiamento</span><b class="num">${money(c.emprestimo)}</b></div>
    <div><span>− Entrada</span><b class="num dn">${money(c.preco)}</b></div>
    <div><span>− Aporte no clube</span><b class="num">${money(c.aporte)}</b></div>
    <div class="tot"><span>Fica com você</span><b class="num">${money(c.restante)}</b></div>
    <div class="tot"><span>Caixa do clube</span><b class="num up">${money(c.caixa)}</b></div>
    ${c.parcela?`<div><span>Parcela semanal</span><b class="num dn">${money(c.parcela)}</b></div>`:''}</div>`;
}
function _validarPassoOrg(){
  const o=escOrg;
  if(o.passo===2&&o.entrada!=='fundar'){
    const t=o.timeId&&G.times[o.timeId];
    if(!t)return 'Escolha o clube.';
    const r=respostaDoDono(t,o.entrada);if(!r.aceita)return r.motivo;
  }
  if(o.passo===3&&!(o.entrada==='fusao'&&o.nomeFusao==='dele')){
    if(!String(o.nome).trim())return 'Dê um nome à organização.';
    if(!siglaLivre(o.tag,o.timeId))return 'Sigla de 2 a 4 letras que nenhum clube use.';
  }
  return '';
}
function _lerCamposOrg(){
  const v=id=>{const el=document.getElementById(id);return el?el.value:null;};
  if(v('ogNome')!==null)escOrg.nome=v('ogNome');
  if(v('ogTag')!==null)escOrg.tag=String(v('ogTag')).toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(v('ogCor'))escOrg.cor=v('ogCor');
  if(v('ogCor2'))escOrg.cor2=v('ogCor2');
  if(v('ogPais'))escOrg.pais=v('ogPais');
  if(v('ogCidade')!==null)escOrg.cidade=v('ogCidade');
}
function _ligarCriarOrg(){
  const m=$('#modal'),q=s=>m.querySelectorAll(s),re=()=>{_lerCamposOrg();telaCriarOrg();};
  q('[data-ogorigem]').forEach(b=>b.onclick=()=>{escOrg.origem=b.dataset.ogorigem;re();});
  q('[data-ogent]').forEach(b=>b.onclick=()=>{escOrg.entrada=b.dataset.ogent;if(escOrg.entrada==='fundar')escOrg.tier=2;re();});
  q('[data-ogrg]').forEach(b=>b.onclick=()=>{escOrg.regiao=b.dataset.ogrg;escOrg.timeId=null;re();});
  q('[data-ogtr]').forEach(b=>b.onclick=()=>{escOrg.tier=+b.dataset.ogtr;escOrg.timeId=null;re();});
  q('[data-ogclube]').forEach(b=>b.onclick=()=>{escOrg.timeId=b.dataset.ogclube;re();});
  q('[data-ognf]').forEach(b=>b.onclick=()=>{escOrg.nomeFusao=b.dataset.ognf;re();});
  q('[data-ogforma]').forEach(b=>b.onclick=()=>{escOrg.forma=b.dataset.ogforma;escOrg.upload=null;re();});
  q('[data-ogproj]').forEach(b=>b.onclick=()=>{escOrg.projeto=escOrg.projeto===b.dataset.ogproj?null:b.dataset.ogproj;re();});
  q('[data-ogir]').forEach(b=>b.onclick=()=>{const n=+b.dataset.ogir;if(n<escOrg.passo){_lerCamposOrg();escOrg.passo=n;telaCriarOrg();}});
  ['ogNome','ogTag'].forEach(id=>{const el=document.getElementById(id);if(el)el.onchange=re;});
  ['ogCor','ogCor2','ogPais','ogCidade'].forEach(id=>{const el=document.getElementById(id);if(el)el.onchange=re;});
  const fin=document.getElementById('ogFin');if(fin)fin.oninput=()=>{escOrg.financiamento=(+fin.value)/100;re();};
  const ap=document.getElementById('ogAp');if(ap)ap.onchange=()=>{escOrg.aporte=+ap.value;re();};
  const up=document.getElementById('ogUp');if(up)up.onchange=async()=>{_lerCamposOrg();try{escOrg.upload=await escudoDoArquivo(up.files[0]);telaCriarOrg();}catch(e){flash(e.message);}};
  const tu=document.getElementById('ogTiraUp');if(tu)tu.onclick=()=>{escOrg.upload=null;re();};
  document.getElementById('ogVolta').onclick=()=>{_lerCamposOrg();if(escOrg.passo>1){escOrg.passo--;telaCriarOrg();}else{$('#modal').innerHTML='';telaNovoJogo();}};
  const vai=document.getElementById('ogVai');
  if(vai)vai.onclick=()=>{_lerCamposOrg();const e=_validarPassoOrg();if(e)return flash(e);escOrg.passo++;telaCriarOrg();};
  const com=document.getElementById('ogComeca');
  if(com)com.onclick=()=>{_lerCamposOrg();comecarComOrgPropria();};
}
function comecarComOrgPropria(){
  G.iniciadaEm=Date.now();
  aplicarDificuldade(escDif,null);
  iniciarGuia();
  criarManager(escNome,'dono',{foto:escFoto,pais:escPais,idade:escIdade,genero:escGenero,variante:escVariante,perfilDono:escPerfilDono});
  const r=criarOrganizacaoPropria(_optsOrg());
  if(!r.ok){flash(r.erro);return;}
  if(escOrg.projeto&&typeof escolherProjeto==='function')escolherProjeto(escOrg.projeto);
  _finalizarInicioDono(r.t);
}
