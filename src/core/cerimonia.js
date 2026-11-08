/* ============================================================
   CERIMÔNIA DE ENCERRAMENTO — o que a virada do ano mostra
   ------------------------------------------------------------
   Montada no fim de fimDeTemporada(), depois dos prêmios, das
   aposentadorias e do veredito, e ANTES de o calendário ser remontado
   (é dele que sai a campanha do seu clube torneio a torneio). Fica
   gravada no registro de prêmios do ano (G.premios[...].cer) para ser
   revista na tela de Prêmios, e G.cerimoniaPendente avisa a interface
   que ela abre antes do veredito.

   Só leitura: nada aqui sorteia nem muda o mundo.
   ============================================================ */
function lugarNoTorneio(s,id){
  const i=(s.ranking||[]).indexOf(id);
  if(s.tipo==='de'||s.tipo==='ko'){
    if(i===0)return{txt:'campeão',ord:0};
    if(i===1)return{txt:'vice',ord:1};
    if(i>=2&&i<=3)return{txt:'top 4',ord:2};
    if(i>=4&&i<=7)return{txt:'top 8',ord:3};
    return{txt:'playoffs',ord:4};
  }
  return{txt:i>=0?(i+1)+'º na fase de grupos':'fase de grupos',ord:5};
}
/* a campanha torneio a torneio: o último stage de cada torneio em que o
   clube apareceu diz até onde ele foi */
function campanhaPorTorneio(id){
  const por={},ordem=[];
  for(const b of G.calendario||[])for(const s of b.stages||[]){
    if(!(s.times||[]).includes(id)&&!(s.ranking||[]).includes(id))continue;
    const k=s.torneioId||s.id;
    if(!por[k])ordem.push(k);
    por[k]=s;
  }
  return ordem.map(k=>{const s=por[k],l=lugarNoTorneio(s,id);
    return{ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,lugar:l.txt,ord:l.ord,int:s.regiao==='INT',
      tr:l.ord===0&&s.torneioId&&typeof arquivoTrofeu==='function'?arquivoTrofeu(s.torneioId,G.ano):null};});
}
function maiorVitoriaDe(id){
  let melhor=null;
  for(const b of G.calendario||[])for(const s of b.stages||[])for(const r of s.resultados||[]){
    if(r.v!==id)continue;
    const eu=r.a===id,wa=eu?r.wa:r.wb,wb=eu?r.wb:r.wa;
    const rounds=((r.det&&r.det.mp)||[]).reduce((t,m)=>t+(eu?m.a-m.b:m.b-m.a),0);
    const adv=G.times[eu?r.b:r.a];if(!adv)continue;
    const peso=(wa-wb)*100+rounds+(s.regiao==='INT'?60:0)+(s.tipo==='de'||s.tipo==='ko'?25:0)+(adv.elo||1200)/40;
    if(!melhor||peso>melhor.peso)melhor={peso,advId:adv.id,adv:adv.nome,tag:adv.tag,placar:wa+'–'+wb,rounds,
      ev:typeof nomeTitulo==='function'?nomeTitulo(s):s.nome,rd:r.rd||''};
  }
  if(melhor)delete melhor.peso;
  return melhor;
}
function melhorDoClube(id){
  if(typeof lerTemporada!=='function')return null;
  const {jog}=lerTemporada();
  let m=null;
  for(const pid in jog){
    const a=jog[pid],p=G.jogadores[pid];
    if(!p||a.timeId!==id||a.maps<6)continue;
    const n=desempenhoDoAno(a);
    if(!m||n>m.n)m={n,id:pid,nome:p.nome,pais:p.pais,role:p.role,ov:over(p),maps:a.maps,
      acs:Math.round(a.acs/Math.max(1,a.maps)),kd:Number((a.d?a.k/a.d:a.k).toFixed(2)),mvps:a.mvp};
  }
  if(m)delete m.n;
  return m;
}

function montarCerimonia(){
  const reg=(G.premios||[]).find(r=>r.ano===G.ano);
  if(!reg)return null;
  const t=G.meuTime&&G.times[G.meuTime];
  const linha=t&&(t.temporadas||[]).slice(-1)[0];
  const cer={ano:G.ano,
    apres:(G.casters||[]).slice(-2).map(c=>c.nome),
    clube:t?{id:t.id,nome:t.nome,tag:t.tag,linha:linha&&linha.a===G.ano?linha:null,
      torneios:campanhaPorTorneio(t.id),
      graf:(G.eloHist||[]).filter(f=>f.ano===G.ano).map(f=>({s:f.s,p:typeof posicaoNaFoto==='function'?posicaoNaFoto(f,t.id):null})),
      melhor:melhorDoClube(t.id),vitoria:maiorVitoriaDe(t.id)}:null,
    campeoes:(G.historico||[]).filter(h=>h&&h.ano===G.ano&&!h.pre).map(h=>({ev:h.evento,timeId:h.timeId,nome:h.campeao,
      tag:h.timeId&&G.times[h.timeId]?G.times[h.timeId].tag:'',tr:h.trofeu||null,
      int:/^(champions|masters)/.test(h.torneioId||'')})),
    despedidas:(G._despedidas||[]).slice().sort((a,b)=>(b.meu?50:0)+b.pts-((a.meu?50:0)+a.pts)).slice(0,8),
    hall:(G.lendas||[]).filter(l=>l.ano===G.ano).map(l=>({nome:l.nome,pais:l.pais,role:l.role,pontos:l.pontos})),
    donos:(G.donos||[]).filter(d=>d.ano===G.ano)};
  reg.cer=cer;
  G.cerimoniaPendente=G.ano;
  G._despedidas=[];
  return cer;
}
