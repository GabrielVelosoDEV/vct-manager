/* ============================================================
   DONOS E COMPRAS DE VAGA (data/organizacoes.js)
   ------------------------------------------------------------
   Bolso: o dinheiro do dono. Multiplica o caixa de largada e paga
   um aporte a cada virada de temporada — clube de dono rico vai ao
   mercado com mais força, porque a IA contrata pelo caixa.

   Compra de vaga: numa virada de temporada dentro da janela, a
   organização assume o clube. O clube é o mesmo (elenco, títulos,
   confrontos, quem você é se for o seu); mudam nome, sigla, escudo,
   país, dono, dinheiro e torcida. Sorteia pelo gerador do motor,
   porque é parte da simulação: a mesma semente, a mesma história.
   ============================================================ */
const APORTE_DONO={1:1200000,2:450000};     /* por ponto de bolso acima de 1, por ano */
const INJECAO_COMPRA={1:2500000,2:900000};  /* na compra, vezes o bolso */
const CHANCE_COMPRA=0.3;                    /* por virada, dentro da janela */

function bolsoDe(t){return t&&typeof t.bolso==='number'?t.bolso:1;}
function perfilTorcida(id){return (typeof TORCIDA_PERFIL!=='undefined'&&TORCIDA_PERFIL[id])||null;}

/* na criação do mundo, depois de os clubes existirem e antes do caixa
   ser usado por qualquer um */
function aplicarOrganizacoesIniciais(){
  if(typeof ORGANIZACOES!=='undefined')for(const id in G.times){
    const t=G.times[id];t.tagOriginal=t.tag;
    const o=ORGANIZACOES[t.tag];if(!o)continue;
    if(o.bolso){t.bolso=BOLSO[o.bolso]||1;t.caixa=Math.round(t.caixa*t.bolso);}
    if(o.logo)t.logoArq=o.logo;
    if(o.cor&&!t.cor)t.cor=o.cor;
  }
  else for(const id in G.times)G.times[id].tagOriginal=G.times[id].tag;
  G.aquisicoes=(typeof ENTRANTES!=='undefined'?ENTRANTES:[]).map(e=>({...e,feita:null}));
}

/* virada de temporada: aporte dos donos e, talvez, uma compra */
function viradaDasOrganizacoes(){
  for(const id in G.times){
    const t=G.times[id],b=bolsoDe(t);
    if(b>1)t.caixa=Math.round((t.caixa||0)+(b-1)*(APORTE_DONO[t.tier]||APORTE_DONO[2]));
  }
  if(!Array.isArray(G.aquisicoes))return [];
  const feitas=[];
  for(const e of G.aquisicoes){
    if(e.feita)continue;
    const[ini,fim]=e.janela||[G.ano,G.ano];
    if(G.ano<ini)continue;
    if(G.ano<fim&&rnd()>=CHANCE_COMPRA)continue;
    const t=Object.values(G.times).find(x=>(x.tagOriginal||x.tag)===e.de);
    if(!t){e.feita={ano:G.ano,sem:true};continue;}
    aplicarAquisicao(t,e);feitas.push(e);
  }
  return feitas;
}
function aplicarAquisicao(t,e){
  const antes={nome:t.nome,tag:t.tag,ate:G.ano};
  (t.nomesAntigos=t.nomesAntigos||[]).push(antes);
  t.nome=e.nome;t.tag=e.tag;t.logoArq=e.logo||null;t.logo=null;
  t.cor=(typeof CORES_CLUBES!=='undefined'&&(CORES_CLUBES[e.tag]||CORES_CLUBES[String(e.logo||'').toUpperCase()]))||e.cor||t.cor||null;
  if(e.pais){t.pais=e.pais;t.paisSede=e.pais;}
  t.bolso=BOLSO[e.bolso]||1;
  t.caixa=Math.round((t.caixa||0)+(INJECAO_COMPRA[t.tier]||INJECAO_COMPRA[2])*t.bolso);
  const pf=perfilTorcida(e.torcida);
  if(pf){
    t.torcidaPerfil={...pf};
    /* a torcida da marca nova chega junto, mas não de um dia para o outro */
    const alvo=t.tier===1?55+(pf.porte-3)*10:22+(pf.porte-1)*8;
    t.torcida=clamp(Math.round((t.torcida||0)*0.5+alvo*0.5),typeof pisoTorcida==='function'?pisoTorcida(t):0,TORCIDA_MAX);
  }
  if(t.tier===1&&pf)t.prestigio=clamp(t.prestigio+(pf.porte-3)*2,20,99);
  e.feita={ano:G.ano,clube:t.id};
  const meu=t.id===G.meuTime;
  const txt=e.tipo==='fusao'
    ?'🏢 '+antes.nome+' se funde com a '+e.nome+': a partir da próxima temporada o clube joga como '+e.nome+' ('+e.tag+').'
    :'🏢 A '+e.nome+' comprou a vaga do '+antes.nome+': o clube passa a se chamar '+e.nome+' ('+e.tag+').';
  if(typeof noticia==='function')noticia(txt+(meu?' O elenco e a comissão continuam, e o caixa ganhou reforço do dono novo.':''),{c:'mercado',t:[t.id],imp:3,meu});
  return t;
}
/* save de antes das compras: entra a lista, e só as que ainda cabem */
function migrarOrganizacoes(){
  for(const id in G.times){const t=G.times[id];if(!t.tagOriginal)t.tagOriginal=t.tag;}
  if(!Array.isArray(G.aquisicoes))
    G.aquisicoes=(typeof ENTRANTES!=='undefined'?ENTRANTES:[]).map(e=>({...e,janela:[Math.max(e.janela[0],G.ano),Math.max(e.janela[1],G.ano+2)],feita:null}));
}
