/* ============================================================
   SEDES E TROFÉUS de Masters e Champions
   ------------------------------------------------------------
   Cada temporada sorteia onde acontecem Masters I, Masters II e
   Champions, e o torneio passa a levar o nome da cidade: "Masters
   Osaka", "Champions Paris".

   O sorteio NÃO usa o gerador do motor (rnd). Ele sai de um hash da
   semente da carreira com o ano, então:
     · a mesma carreira tem sempre as mesmas sedes;
     · sortear sede não desloca nenhum outro sorteio — o circuito, os
       elencos e as partidas saem idênticos com ou sem este módulo.

   Regras (data/sedes.js explica os campos):
     · Champions só em cidade de tipo 'champions';
     · Masters em qualquer cidade, com o dobro de chance para quem não
       é a maior do país;
     · nenhuma cidade repete as sedes dos dois anos anteriores;
     · os dois Masters do ano nunca no mesmo país, e nenhum deles na
       cidade do Champions do mesmo ano.

   O resultado fica gravado em G.sedes[ano]: editar o catálogo de
   cidades depois não reescreve o passado.
   ============================================================ */
const SEDE_EVENTOS=['masters1','masters2','champions'];
const SEDE_PESO_FORA_DA_MAIOR=2;
const SEDE_ANOS_SEM_REPETIR=2;

function slugCidade(nome){
  return String(nome).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
}
function montarCidades(){
  G.cidades=SEDES.map(c=>Object.assign({slug:slugCidade(c.nome)},c));
  return G.cidades;
}
function cidades(){
  if(G&&Array.isArray(G.cidades)&&G.cidades.length)return G.cidades;
  return SEDES.map(c=>Object.assign({slug:slugCidade(c.nome)},c));
}
function cidade(slug){return slug?cidades().find(c=>c.slug===slug)||null:null;}

/* FNV-1a de 32 bits: estável entre navegadores e Node */
function _hashSede(txt){
  let h=0x811c9dc5;
  for(let i=0;i<txt.length;i++){h^=txt.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
  return h>>>0;
}
/* gerador local (mulberry32), separado do rnd() do motor */
function _rngSede(semente){
  let a=semente>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return((t^(t>>>14))>>>0)/4294967296;};
}
function _sortearPeso(lista,peso,r){
  const tot=lista.reduce((s,c)=>s+peso(c),0);
  if(!tot)return null;
  let x=r()*tot;
  for(const c of lista){x-=peso(c);if(x<0)return c;}
  return lista[lista.length-1];
}

/* As sedes de um ano, sorteadas na primeira vez que alguém pergunta. */
function sedesDoAno(ano){
  if(!G)return null;
  if(!G.sedes)G.sedes={};
  if(G.sedes[ano])return G.sedes[ano];
  if(typeof SEDES_REAIS!=='undefined'&&SEDES_REAIS[ano])return SEDES_REAIS[ano];
  /* nada antes do histórico real: o sorteio começa em 2027 */
  if(ano<2027)return null;
  const recentes=new Set();
  for(let k=1;k<=SEDE_ANOS_SEM_REPETIR;k++){
    const s=sedesDoAno(ano-k);
    if(s)SEDE_EVENTOS.forEach(e=>s[e]&&recentes.add(s[e]));
  }
  const r=_rngSede(_hashSede('sedes|'+(G.seed||1)+'|'+ano));
  const todas=cidades().filter(c=>!recentes.has(c.slug));
  /* catálogo pequeno demais (editado no Banco de dados): relaxa a regra de
     não repetir em vez de deixar o torneio sem sede */
  const base=todas.length>=4?todas:cidades();
  const out={};
  const ch=_sortearPeso(base.filter(c=>c.tipo==='champions'),()=>1,r)
         ||_sortearPeso(base,()=>1,r);
  out.champions=ch?ch.slug:null;
  const pesoM=c=>c.maior?1:SEDE_PESO_FORA_DA_MAIOR;
  const m1=_sortearPeso(base.filter(c=>c.slug!==out.champions),pesoM,r);
  out.masters1=m1?m1.slug:null;
  const m2=_sortearPeso(base.filter(c=>c.slug!==out.champions&&c.slug!==out.masters1
           &&(!m1||c.pais!==m1.pais)),pesoM,r)
         ||_sortearPeso(base.filter(c=>c.slug!==out.champions&&c.slug!==out.masters1),pesoM,r);
  out.masters2=m2?m2.slug:null;
  G.sedes[ano]=out;
  return out;
}
/* A cidade de um torneio internacional (id do catálogo de torneios). */
function sedeDe(torneioId,ano){
  if(!SEDE_EVENTOS.includes(torneioId))return null;
  const s=sedesDoAno(ano||G.ano);
  return s?cidade(s[torneioId]):null;
}
/* Nome com a cidade: "Masters Osaka", "Champions Paris". Sem sede (catálogo
   vazio, torneio regional), devolve null e quem chamou usa o nome de sempre. */
function nomeComSede(torneioId,ano){
  const c=sedeDe(torneioId,ano);
  if(!c)return null;
  return (torneioId==='champions'?'Champions ':'Masters ')+c.nome;
}

/* ---------- troféus ----------
   Champions e Masters: uma variante numerada por cidade, sempre a mesma
   para a mesma cidade (hash do nome), entre as que existirem na pasta.
   Regionais: um por torneio e região. Prêmios da temporada: premio-<tipo>. */
const TROFEU_VARIANTES_MAX=10;
const TROFEU_PREFIXO={kickoff:'kickoff',stage1:'stage1',stage2:'stage2',
                      split1:'challengers',split2:'challengers',asc:'ascension'};
const TROFEU_REGIAO={AMER:'amer',EMEA:'emea',PAC:'pac',CN:'cn'};
function _variantesTrofeu(tipo){
  if(typeof MIDIA==='undefined'||!MIDIA.arquivos)return TROFEU_VARIANTES_MAX;
  let n=0;
  for(let i=1;i<=TROFEU_VARIANTES_MAX;i++)
    if(MIDIA.arquivos['trofeus/'+tipo+'-'+String(i).padStart(2,'0')])n=i;else break;
  return n||TROFEU_VARIANTES_MAX;
}
/* nome do arquivo (sem pasta e sem extensão) do troféu de um torneio */
function arquivoTrofeu(torneioId,ano){
  if(torneioId==='champions'||torneioId==='masters1'||torneioId==='masters2'){
    const tipo=torneioId==='champions'?'champions':'masters';
    const c=sedeDe(torneioId,ano);
    const n=_variantesTrofeu(tipo);
    const v=c?(_hashSede(c.slug)%n)+1:1;
    return tipo+'-'+String(v).padStart(2,'0');
  }
  const corte=String(torneioId||'').indexOf('_');
  if(corte>0){
    const pre=TROFEU_PREFIXO[torneioId.slice(0,corte)];
    const reg=TROFEU_REGIAO[torneioId.slice(corte+1)];
    if(pre&&reg)return pre+'-'+reg;
  }
  return 'padrao';
}
function arquivoTrofeuPremio(tipo){return 'premio-'+String(tipo).replace('regional','mvp-regional');}

/* ---------- Banco de dados ---------- */
function edAplicarCidade(slug,c){
  if(!G.cidades)montarCidades();
  const x=G.cidades.find(k=>k.slug===slug);
  if(!x)return{ok:false,erro:'Cidade não encontrada.'};
  if(typeof c.nome==='string'&&c.nome.trim())x.nome=c.nome.trim();
  if(typeof c.pais==='string'&&/^[A-Z]{2}$/.test(c.pais))x.pais=c.pais;
  if(c.tipo==='champions'||c.tipo==='masters')x.tipo=c.tipo;
  if(c.maior!=null)x.maior=!!c.maior;
  return{ok:true};
}
function edAddCidade(nome,pais,tipo){
  if(!G.cidades)montarCidades();
  nome=String(nome||'').trim();
  if(!nome)return{ok:false,erro:'Dê um nome à cidade.'};
  const slug=slugCidade(nome);
  if(G.cidades.some(c=>c.slug===slug))return{ok:false,erro:nome+' já está na lista.'};
  if(!/^[A-Z]{2}$/.test(pais||''))return{ok:false,erro:'Escolha o país.'};
  G.cidades.push({slug,nome,pais,tipo:tipo==='champions'?'champions':'masters',maior:false});
  return{ok:true,msg:nome+' entrou na lista de sedes. A imagem vai em assets/cidades/'+slug+'.webp.'};
}
function edRemoverCidade(slug){
  if(!G.cidades)montarCidades();
  if(G.cidades.length<=6)return{ok:false,erro:'A lista precisa de pelo menos seis cidades.'};
  const resto=G.cidades.filter(c=>c.slug!==slug);
  if(resto.length===G.cidades.length)return{ok:false,erro:'Cidade não encontrada.'};
  if(!resto.some(c=>c.tipo==='champions'))
    return{ok:false,erro:'Sem nenhuma cidade de Champions o sorteio não fecha.'};
  G.cidades=resto;
  return{ok:true};
}
