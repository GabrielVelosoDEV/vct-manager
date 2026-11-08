/* ============================================================
   ESTATÍSTICAS DO MUNDO — ranking, temporadas de cada clube e
   recordes
   ------------------------------------------------------------
   Três registros novos, todos determinísticos (não tocam rnd):

   RANKING MUNDIAL (t.elo): rating por resultado de série, como o
   ranking da comunidade. Ganhar de quem está acima vale mais do que
   ganhar de quem está abaixo; internacional pesa 1,5×; série
   apertada mexe menos que atropelo. A cada quatro semanas o jogo
   tira uma foto (G.eloHist), e é ela que mostra a evolução dos
   últimos doze meses.

   TEMPORADAS DO CLUBE (t.temporadas): na virada, cada clube guarda
   uma linha da temporada — posição na liga, campanha, melhor
   resultado internacional, títulos e o cinco que mais jogou. É a
   linha do tempo da tela História.

   RECORDES (G.recordes): o maior over já visto e a maior
   transferência, que não dá para recalcular depois — quem fez o
   recorde pode ter se aposentado e sumido do save.
   ============================================================ */
const ELO_K=20, ELO_INT=1.5, ELO_FOTO_SEMANAS=4, ELO_FOTOS=13;
const TEMPORADAS_GUARDADAS=12, TEMPORADAS_GUARDADAS_MEU=40;

function eloInicial(t){return Math.round(1200+(t.prestigio||50)*5);}
function eloDe(t){if(typeof t.elo!=='number')t.elo=eloInicial(t);return t.elo;}
function atualizarElo(s,res){
  const A=G.times[res.aId],B=G.times[res.bId];if(!A||!B)return;
  const ra=eloDe(A),rb=eloDe(B);
  const esperado=1/(1+Math.pow(10,(rb-ra)/400));
  const ganhouA=res.vencedor===A.id?1:0;
  const margem=1+0.25*Math.max(0,Math.abs((res.wa||0)-(res.wb||0))-1);
  const k=ELO_K*(s&&s.regiao==='INT'?ELO_INT:1)*margem;
  const d=k*(ganhouA-esperado);
  A.elo=Math.round((ra+d)*10)/10;B.elo=Math.round((rb-d)*10)/10;
}
function fotoDoRanking(){
  if((G.semana||1)%ELO_FOTO_SEMANAS)return;
  const v={};
  for(const id in G.times)v[id]=Math.round(eloDe(G.times[id]));
  (G.eloHist=G.eloHist||[]).push({ano:G.ano,s:G.semana,v});
  if(G.eloHist.length>ELO_FOTOS)G.eloHist.shift();
}
function rankingMundial(){
  return Object.values(G.times).slice().sort((a,b)=>eloDe(b)-eloDe(a));
}
/* posição de cada clube numa foto antiga, para a seta de subiu/desceu */
function posicaoNaFoto(foto,id){
  if(!foto)return null;
  const ord=Object.keys(foto.v).sort((a,b)=>foto.v[b]-foto.v[a]);
  const i=ord.indexOf(id);return i<0?null:i+1;
}

/* ---------- temporadas de cada clube ---------- */
/* Melhor campanha internacional do ano, lida dos stages ainda vivos. */
function campanhaInternacional(t){
  const rot={masters1:'Masters',masters2:'Masters',champions:'Champions'};
  let melhor=null;
  for(const b of G.calendario||[])for(const s of b.stages||[]){
    if(s.regiao!=='INT'||!(s.tipo==='de'||s.tipo==='ko'))continue;
    const i=(s.ranking||[]).indexOf(t.id);
    if(i<0)continue;
    const peso=(s.torneioId==='champions'?100:50)-i;
    const lugar=i===0?'campeão':i===1?'vice':i<=3?'top 4':i<=7?'top 8':'playoffs';
    if(!melhor||peso>melhor.peso)melhor={peso,txt:(typeof nomeDoAno==='function'&&nomeDoAno(s.torneioId))||rot[s.torneioId]||'Internacional',lugar};
  }
  if(!melhor){
    /* foi ao internacional e caiu antes dos playoffs */
    for(const b of G.calendario||[])for(const s of b.stages||[])
      if(s.regiao==='INT'&&(s.times||[]).includes(t.id))
        return{txt:(typeof nomeDoAno==='function'&&nomeDoAno(s.torneioId))||'Internacional',lugar:'fase inicial'};
  }
  return melhor;
}
function posicaoNoAno(t){
  const tier=t.tierAno||t.tier;
  const liga=Object.values(G.times).filter(x=>x.regiao===t.regiao&&(x.tierAno||x.tier)===tier);
  const camp=x=>{const c=x.temporada||{v:0,d:0,mv:0,md:0};return[c.v-c.d,(c.mv||0)-(c.md||0)];};
  liga.sort((a,b)=>{const A=camp(a),B=camp(b);return B[0]-A[0]||B[1]-A[1];});
  return{pos:liga.indexOf(t)+1,de:liga.length,tier};
}
function registrarTemporadaDoClube(t){
  const pos=posicaoNoAno(t);
  const intl=campanhaInternacional(t);
  const tecnico=t.id===G.meuTime&&G.manager&&G.manager.nome?G.manager.nome
    :(typeof membroDe==='function'&&membroDe(t,'tecnico')||{}).nome||null;
  const subiu=t.tier<pos.tier,caiu=t.tier>pos.tier;
  const linha={a:G.ano,tier:pos.tier,mov:subiu?'subiu':caiu?'caiu':null,p:pos.pos,de:pos.de,v:(t.temporada||{}).v||0,d:(t.temporada||{}).d||0,
    i:intl?intl.txt+' · '+intl.lugar:null,
    t:(t.titulos||[]).filter(x=>parseInt(x)===G.ano).map(x=>x.split(' · ').slice(1).join(' · ')),
    e:(t.titulares||[]).map(id=>G.jogadores[id]&&G.jogadores[id].nome).filter(Boolean),
    c:tecnico,elo:Math.round(eloDe(t))};
  (t.temporadas=t.temporadas||[]).push(linha);
  const max=t.id===G.meuTime?TEMPORADAS_GUARDADAS_MEU:TEMPORADAS_GUARDADAS;
  if(t.temporadas.length>max)t.temporadas.splice(0,t.temporadas.length-max);
}

/* ---------- recordes ---------- */
function recordes(){return G.recordes||(G.recordes={});}
function conferirRecordeOver(){
  const r=recordes();
  for(const id in G.jogadores){
    const p=G.jogadores[id],o=over(p);
    if(!r.over||o>r.over.v)r.over={v:o,nome:p.nome,ano:G.ano,time:p.timeId?G.times[p.timeId].tag:'—'};
  }
}
function conferirRecordeTransferencia(p,origem,dest,taxa){
  if(!taxa)return;
  const r=recordes();
  if(!r.transferencia||taxa>r.transferencia.v)
    r.transferencia={v:taxa,nome:p.nome,ano:G.ano,de:origem?origem.tag:'livre',para:dest.tag};
}
