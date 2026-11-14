/* ============================================================
   VALORANT WORLD CUP — O LEGADO (C5)
   ------------------------------------------------------------
   O que fica para sempre, mesmo depois que os jogadores se
   aposentam e somem de G.jogadores:

     G.copa.hall[id]   cada jogador que já foi convocado para uma Copa:
                       nome, país, Copas, medalhas, MVP, time ideal e
                       os números somados das Copas (só Copa, sem as
                       eliminatórias)
     G.copa.tecnicos[id]  técnicos de seleção: Copas, títulos, pódios

   Tudo é escrito no fim de cada Copa (registrarLegadoCopa, chamado
   por encerrarCopa). As consultas daqui montam a galeria, os países e
   jogadores com mais títulos, os times lendários, as finais
   históricas e os recordes.

   A carta de campeão do mundo (assets/cartas/worldchampions.png) é
   uma só, para os dez convocados da seleção campeã: quem tem título
   mundial passa a aparecer com ela (ui/cartas.js).
   ============================================================ */

function _hall(){
  const c=garantirCopa();
  if(!c.hall){
    c.hall={};c.tecnicos=c.tecnicos||{};
    /* save de antes do legado: o que dá para tirar das edições (os pódios) */
    for(const e of c.edicoes||[]){
      const med={[e.campeao]:'ouro',[e.vice]:'prata',[e.bronze]:'bronze'};
      for(const pais in e.elencos||{}){const cv=e.elencos[pais];if(!cv)continue;
        for(const id of cv.titulares.concat(cv.reservas)){
          const h=_entradaHall(c,id,G.jogadores[id],pais);if(e.nomes&&e.nomes[id]&&!G.jogadores[id])h.n=e.nomes[id];
          if(!h.ed.includes(e.ano))h.ed.push(e.ano);if(med[pais]&&!h[med[pais]].includes(e.ano))h[med[pais]].push(e.ano);}}
      if(e.mvp&&c.hall[e.mvp])c.hall[e.mvp].mvp.push(e.ano);
      for(const id of e.timeIdeal||[])if(c.hall[id])c.hall[id].ti.push(e.ano);
    }
  }
  c.tecnicos=c.tecnicos||{};
  return c;
}
function _entradaHall(c,id,p,pais){
  const h=c.hall[id]=c.hall[id]||{n:p?p.nome:id,p:pais,ed:[],ouro:[],prata:[],bronze:[],mvp:[],ti:[],maps:0,k:0,d:0,a:0,acs:0,series:0,mvps:0};
  if(p)h.n=p.nome;
  h.p=pais||h.p;
  return h;
}
function registrarLegadoCopa(cic,ed,S){
  const c=_hall(), C=cic.copa;
  const med={[ed.campeao]:'ouro',[ed.vice]:'prata',[ed.bronze]:'bronze'};
  for(const pais in C.convocados||{}){
    const cv=C.convocados[pais];
    for(const id of cv.titulares.concat(cv.reservas)){
      const p=G.jogadores[id], h=_entradaHall(c,id,p,pais);
      if(!h.ed.includes(cic.ano))h.ed.push(cic.ano);
      if(med[pais]&&!h[med[pais]].includes(cic.ano))h[med[pais]].push(cic.ano);
      const s=S&&S[id];
      if(s){h.maps+=s.maps;h.k+=s.k;h.d+=s.d;h.a+=s.a;h.acs+=s.acs;h.series+=s.series;h.mvps+=s.mvp;}
    }
  }
  if(ed.mvp&&c.hall[ed.mvp]&&!c.hall[ed.mvp].mvp.includes(cic.ano))c.hall[ed.mvp].mvp.push(cic.ano);
  for(const id of ed.timeIdeal)if(c.hall[id]&&!c.hall[id].ti.includes(cic.ano))c.hall[id].ti.push(cic.ano);
  /* técnicos */
  for(const pais of ed.participantes||[]){
    const sid=(comissaoDaSelecao(pais)||{}).tecnico, m=sid&&G.staff[sid];
    if(!sid)continue;
    const t=c.tecnicos[sid]=c.tecnicos[sid]||{n:m?m.nome:sid,p:m?m.pais:null,ed:[],titulos:[],podios:[],selecoes:[]};
    if(m)t.n=m.nome;
    t.ed.push(cic.ano);
    if(!t.selecoes.includes(pais))t.selecoes.push(pais);
    if(pais===ed.campeao)t.titulos.push(cic.ano);
    if([ed.campeao,ed.vice,ed.bronze].includes(pais))t.podios.push(cic.ano);
  }
}

/* ---------- consultas ---------- */
const ALCANCE_ORDEM=['campeao','vice','bronze','quarto','quartas','oitavas','grupos'];
const ALCANCE_NOME={campeao:'Campeã',vice:'Vice',bronze:'3º lugar',quarto:'4º lugar',quartas:'Quartas',oitavas:'Oitavas',grupos:'Grupos'};
/* os países: títulos, finais, pódios, participações e a melhor campanha */
function paisesNaHistoria(){
  const eds=edicoesDaCopa(), out={};
  const L=p=>out[p]=out[p]||{pais:p,titulos:0,vices:0,bronzes:0,quartos:0,finais:0,podios:0,copas:0,melhor:null,anosTitulo:[]};
  for(const e of eds){
    const part=e.participantes||[e.campeao,e.vice,e.bronze,e.quarto];
    for(const p of part){const x=L(p);x.copas++;
      const a=(e.alcance&&e.alcance[p])||(p===e.campeao?'campeao':p===e.vice?'vice':p===e.bronze?'bronze':p===e.quarto?'quarto':'grupos');
      if(!x.melhor||ALCANCE_ORDEM.indexOf(a)<ALCANCE_ORDEM.indexOf(x.melhor))x.melhor=a;}
    L(e.campeao).titulos++;L(e.campeao).anosTitulo.push(e.ano);
    L(e.vice).vices++;L(e.bronze).bronzes++;L(e.quarto).quartos++;
    for(const p of [e.campeao,e.vice]){L(p).finais++;}
    for(const p of [e.campeao,e.vice,e.bronze])L(p).podios++;
  }
  return Object.values(out).sort((a,b)=>b.titulos-a.titulos||b.vices-a.vices||b.bronzes-a.bronzes||b.copas-a.copas||a.pais.localeCompare(b.pais));
}
/* os jogadores: títulos, medalhas, Copas, prêmios e números */
function jogadoresNaHistoria(){
  const c=_hall();
  return Object.entries(c.hall).map(([id,h])=>Object.assign({id},h,{medalhas:h.ouro.length+h.prata.length+h.bronze.length,
    acsM:h.maps?h.acs/h.maps:0,kd:h.d?h.k/h.d:h.k,vivo:!!G.jogadores[id]}))
    .sort((a,b)=>b.ouro.length-a.ouro.length||b.medalhas-a.medalhas||b.mvp.length-a.mvp.length||b.ed.length-a.ed.length||b.k-a.k);
}
function tecnicosNaHistoria(){
  const c=_hall();
  return Object.entries(c.tecnicos).map(([id,t])=>Object.assign({id},t))
    .sort((a,b)=>b.titulos.length-a.titulos.length||b.podios.length-a.podios.length||b.ed.length-a.ed.length);
}
/* times lendários: os elencos campeões, ordenados pelo domínio da campanha
   (saldo de mapas no caminho, com peso para a final larga) */
function timesLendarios(){
  return edicoesDaCopa().map(e=>{
    const cam=e.caminho||[];
    const pro=cam.reduce((s,x)=>s+x.pro,0), contra=cam.reduce((s,x)=>s+x.contra,0);
    const derrotas=cam.filter(x=>x.pro<x.contra).length;
    const fin=e.final, fp=fin.v===fin.a?fin.wa:fin.wb, fc=fin.v===fin.a?fin.wb:fin.wa;
    const nota=(pro-contra)*3+(derrotas?0:12)+(fp-fc)*2;
    return{ano:e.ano,pais:e.campeao,ed:e,pro,contra,derrotas,invicta:!derrotas,nota,
      titulares:(e.elencos[e.campeao]||{}).titulares||[],tecnico:e.tecnicoCampeao};
  }).sort((a,b)=>b.nota-a.nota||a.ano-b.ano);
}
/* as finais, com o que as fez memoráveis */
function finaisHistoricas(){
  return edicoesDaCopa().map(e=>{
    const f=e.final, mps=(f.det&&f.det.mp)||[];
    const pro=f.v===f.a?f.wa:f.wb, contra=f.v===f.a?f.wb:f.wa;
    const prorrog=mps.filter(m=>m.a+m.b>24).length;
    const tags=[];
    if(contra===2)tags.push('Decidida no quinto mapa');
    if(prorrog)tags.push(prorrog===1?'Um mapa na prorrogação':prorrog+' mapas na prorrogação');
    if(contra===0)tags.push('Varrida');
    const virada=(()=>{let a=0,b=0,perdia=false;for(const m of mps){const v=f.v===f.a?m.a>m.b:m.b>m.a;if(v)a++;else b++;if(b-a>=1)perdia=true;}return perdia&&b>=1&&mps.length>=4;})();
    if(virada)tags.push('Virada');
    const epica=(contra===2?2:0)+prorrog+(virada?1:0);
    return{ano:e.ano,ed:e,campeao:e.campeao,vice:e.vice,pro,contra,mapas:mps,mvp:f.det&&f.det.mvp,tags,epica};
  });
}
/* recordes: os maiores números de uma Copa só e da história toda */
function recordesDaCopa(){
  const eds=edicoesDaCopa(), J=jogadoresNaHistoria(), out=[];
  const umaCopa=(campo,tit,fmt)=>{
    let best=null;
    for(const e of eds){const x=e.lideres&&e.lideres[campo]&&e.lideres[campo][0];
      if(x&&(!best||x.v>best.v))best=Object.assign({ano:e.ano,nome:e.nomes[x.id]||(G.jogadores[x.id]||{}).nome||'—'},x);}
    if(best)out.push({tit,quem:best.nome,id:best.id,pais:best.pais,valor:fmt(best.v),onde:'World Cup '+best.ano});
  };
  umaCopa('kills','Mais kills numa Copa',v=>v);
  umaCopa('acs','Maior ACS médio numa Copa',v=>Math.round(v));
  umaCopa('kd','Melhor K/D numa Copa',v=>v.toFixed(2));
  umaCopa('mvps','Mais MVPs de série numa Copa',v=>v);
  const top=(f,tit,fmt,filtro)=>{const x=J.filter(filtro||(()=>true)).sort((a,b)=>f(b)-f(a))[0];
    if(x&&f(x)>0)out.push({tit,quem:x.n,id:x.id,pais:x.p,valor:fmt(f(x)),onde:'na história'});};
  top(x=>x.ouro.length,'Mais títulos mundiais',v=>v);
  top(x=>x.medalhas,'Mais medalhas',v=>v);
  top(x=>x.ed.length,'Mais Copas disputadas',v=>v);
  top(x=>x.k,'Mais kills em Copas',v=>v);
  top(x=>x.mvp.length,'Mais vezes MVP da Copa',v=>v);
  top(x=>x.ti.length,'Mais vezes no time ideal',v=>v);
  const P=paisesNaHistoria()[0];
  if(P&&P.titulos)out.push({tit:'Seleção com mais títulos',pais:P.pais,quem:_nomeSel(P.pais),valor:P.titulos,onde:P.anosTitulo.join(', ')});
  const T=tecnicosNaHistoria()[0];
  if(T&&T.titulos.length)out.push({tit:'Técnico com mais títulos',quem:T.n,pais:T.p,valor:T.titulos.length,onde:T.titulos.join(', ')});
  const lend=timesLendarios()[0];
  if(lend)out.push({tit:'Campanha mais dominante',pais:lend.pais,quem:_nomeSel(lend.pais)+' '+lend.ano,valor:lend.pro+'–'+lend.contra+' em mapas',onde:lend.invicta?'invicta':''});
  return out;
}
/* o jogador é campeão do mundo? (a carta especial e o selo do perfil) */
function campeaoMundial(p){return !!(p&&p.copa&&p.copa.ouro&&p.copa.ouro.length);}
