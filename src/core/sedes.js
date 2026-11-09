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

   TORNEIOS REGIONAIS também têm sede (Kickoff, Stage 1 e 2, Splits do
   Challengers, Ascension): acontecem numa cidade de verdade, só não
   levam o nome dela. Regras:
     · cidade da própria região;
     · cada cidade recebe UM torneio por ano — quem é sede de Masters ou
       Champions no ano não recebe torneio menor;
     · o Stage 2 (o que dá vaga no Champions) prefere a maior cidade
       do país; o Challengers prefere as outras;
     · região sem cidade livre (a China tem seis, e às vezes uma delas é
       sede internacional) pega emprestada a vizinha (Pacific).
   ============================================================ */
const SEDE_EVENTOS=['masters1','masters2','champions'];
const SEDE_PESO_FORA_DA_MAIOR=2;
const SEDE_ANOS_SEM_REPETIR=2;
const SEDE_REGIONAIS=['stage2','kickoff','stage1','split1','split2','asc'];
const SEDE_REGIOES=['AMER','EMEA','PAC','CN'];
/* país → região do circuito, para as cidades do catálogo */
const REGIAO_DA_CIDADE={BR:'AMER',US:'AMER',CA:'AMER',MX:'AMER',AR:'AMER',CL:'AMER',CO:'AMER',PE:'AMER',
  NL:'EMEA',DE:'EMEA',PT:'EMEA',GB:'EMEA',ES:'EMEA',FR:'EMEA',SA:'EMEA',IT:'EMEA',PL:'EMEA',DK:'EMEA',SE:'EMEA',
  TR:'EMEA',IS:'EMEA',FI:'EMEA',UA:'EMEA',AE:'EMEA',
  TH:'PAC',KR:'PAC',SG:'PAC',JP:'PAC',TW:'PAC',VN:'PAC',ID:'PAC',MY:'PAC',PH:'PAC',IN:'PAC',AU:'PAC',
  CN:'CN',HK:'CN'};
const SEDE_VIZINHA={CN:'PAC',PAC:'CN',AMER:'AMER',EMEA:'EMEA'};

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
  if(G.sedes[ano]){if(ano>=2027)sedesRegionais(ano,G.sedes[ano]);return G.sedes[ano];}
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
  sedesRegionais(ano,out);
  G.sedes[ano]=out;
  return out;
}
/* Completa o ano com as sedes regionais (também em saves de antes desta
   regra, sem mexer nas internacionais já sorteadas). */
function sedesRegionais(ano,out){
  if(out['stage2_AMER']!==undefined)return out;
  const r=_rngSede(_hashSede('sedesreg|'+(G.seed||1)+'|'+ano));
  const usadas=new Set(SEDE_EVENTOS.map(e=>out[e]).filter(Boolean));
  const ant=G.sedes&&G.sedes[ano-1]||{};
  const daRegiao=R=>cidades().filter(c=>REGIAO_DA_CIDADE[c.pais]===R&&!usadas.has(c.slug));
  for(const ev of SEDE_REGIONAIS)for(const R of SEDE_REGIOES){
    const id=ev+'_'+R;
    let pool=daRegiao(R);
    if(!pool.length)pool=daRegiao(SEDE_VIZINHA[R]);
    if(!pool.length)pool=cidades().filter(c=>!usadas.has(c.slug));
    if(!pool.length){out[id]=null;continue;}
    /* não repete a mesma cidade do mesmo torneio do ano anterior, se der */
    const semRepetir=pool.filter(c=>c.slug!==ant[id]);
    if(semRepetir.length)pool=semRepetir;
    const peso=ev==='stage2'?(c=>c.maior?3:1):(ev==='split1'||ev==='split2'||ev==='asc')?(c=>c.maior?1:2):(()=>1);
    const c=_sortearPeso(pool,peso,r);
    out[id]=c?c.slug:null;
    if(c)usadas.add(c.slug);
  }
  return out;
}
/* A cidade de um torneio internacional (id do catálogo de torneios). */
function sedeDe(torneioId,ano){
  if(!torneioId)return null;
  const s=sedesDoAno(ano||G.ano);
  return s&&s[torneioId]?cidade(s[torneioId]):null;
}
/* Nome com a cidade: "Masters Osaka", "Champions Paris". Sem sede (catálogo
   vazio, torneio regional), devolve null e quem chamou usa o nome de sempre. */
function nomeComSede(torneioId,ano){
  if(!SEDE_EVENTOS.includes(torneioId))return null;   /* regional não leva o nome da cidade */
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
