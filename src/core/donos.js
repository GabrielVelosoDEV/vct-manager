/* ============================================================
   DONOS — quem é dono de cada organização (data/donos.js)
   ------------------------------------------------------------
   Todo clube tem t.dono: {tipo, nome, empresa?, junto?, perfil,
   desde, ...}. Na criação do mundo vem da base; quando uma
   organização compra a vaga (core/organizacoes.js) o dono dela
   chega junto; quando um ex-jogador compra um clube
   (core/poscarreira.js) ele vira o dono, com exId. No modo Dono,
   o dono do seu clube é você (voce:true).

   Nada aqui sorteia: o motor continua com o gerador intacto.
   ============================================================ */
function dadoDono(tag){
  return (typeof DONOS!=='undefined'&&DONOS[tag])||null;
}
/* o dono da base para uma sigla; sem dado, a própria organização */
function novoDono(tag,nomeOrg,desde){
  const d=dadoDono(tag);
  const o=d?Object.assign({},d):{tipo:'org',nome:nomeOrg||tag,perfil:'economico'};
  o.desde=desde==null?null:desde;o.base=!!d;
  if(!PERFIS_DONO[o.perfil])o.perfil='economico';
  return o;
}
function aplicarDonosIniciais(){
  for(const id in G.times){
    const t=G.times[id];
    if(t.dono&&(t.dono.exId||t.dono.voce))continue;
    t.dono=novoDono(t.tagOriginal||t.tag,t.nome,null);
  }
}
/* save de antes dos donos: quem não tem ganha o da base; ex-jogador dono fica */
function migrarDonos(){
  for(const id in G.times){
    const t=G.times[id];
    if(t.dono&&!t.dono.tipo)t.dono=Object.assign({tipo:'pessoa',perfil:'paciente'},t.dono);
    if(!t.dono)t.dono=novoDono(t.tag,t.nome,null);
  }
  if(G.manager&&G.manager.papel==='diretoria')G.manager.papel='dono';
  if(G.manager&&G.manager.papel==='dono'&&!G.manager.variante)G.manager.variante='livre';
  const meu=G.meuTime&&G.times[G.meuTime];
  if(meu&&G.manager&&G.manager.papel==='dono')tornarVoceDono(meu);
}
/* no modo Dono, o dono do seu clube é você; o anterior fica registrado */
function tornarVoceDono(t){
  if(!t||!G.manager)return;
  if(t.dono&&!t.dono.voce)(t.donosAntigos=t.donosAntigos||[]).push(Object.assign({ate:G.ano},t.dono));
  const m=G.manager;
  t.dono={tipo:'pessoa',nome:m.nome,pais:m.pais||null,foto:m.foto||null,perfil:m.perfilDono||'paciente',
    desde:G.ano,voce:true};
}
/* a organização que compra a vaga traz o dono dela */
function donoDaAquisicao(t,e){
  if(t.dono&&t.dono.voce)return;
  if(t.dono)(t.donosAntigos=t.donosAntigos||[]).push(Object.assign({ate:G.ano},t.dono));
  t.dono=novoDono(e.tag,e.nome,G.ano);
}
function donoDe(t){return t&&t.dono?t.dono:null;}
/* "Bruno PlayHard (LOUD Ltd.)", "Shopify", "a própria organização" */
function nomeDono(d){return d?d.nome:'—';}
function rotuloTipoDono(d){
  if(!d)return '';
  if(d.voce)return 'você';
  if(d.exId)return 'ex-jogador';
  return d.tipo==='empresa'?'empresa controladora':d.tipo==='org'?'a própria organização':'dono';
}
/* clubes que podem ser comprados por um ex-jogador: sem dono de verdade */
function clubeSemDonoForte(t){return !t.dono||(t.dono.tipo==='org'&&!t.dono.voce);}
