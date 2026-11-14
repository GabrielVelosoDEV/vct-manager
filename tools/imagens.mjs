#!/usr/bin/env node
/* ============================================================
   MANIFESTO DE IMAGENS — a base fixa de assets/
   ------------------------------------------------------------
   Uso: node tools/imagens.mjs [--tudo] [--checar]
        (ou npm run imagens; o build roda isto antes de empacotar)

   Varre assets/logos, players, staff, torneios, agentes (e marcas,
   se existir), grava data/midia.js com o formato de cada arquivo,
   escreve assets/<pasta>/LISTA.md com o nome exato que o jogo
   procura para cada um, e imprime a cobertura contra a base:
     · quem da base ainda não tem imagem
     · arquivos que não batem com ninguém — quase sempre erro de
       digitação no nome, ou um nick que mudou

   O manifesto é .js e não .json pelo mesmo motivo do rostos.js:
   fetch() de JSON é bloqueado em file://.

   --tudo    lista todos os faltantes, não só os primeiros
   --checar  sai com código 1 se houver arquivo sem dono
   --renomear  renomeia sozinho quem está fora do padrão (kiNgg.png →
               kingg.png). Sem isso o arquivo é só apontado: num site
               publicado o nome com maiúscula não carrega.
   ============================================================ */
import {readFileSync,writeFileSync,readdirSync,existsSync,renameSync,mkdirSync} from 'node:fs';
import {dirname,resolve,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=new Set(process.argv.slice(2));
const TUDO=args.has('--tudo'), CHECAR=args.has('--checar'), RENOMEAR=args.has('--renomear');

/* a mesma regra de ASSETS.slug em src/data/assets.js */
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();

/* Ordem de preferência quando o mesmo nome existe em dois formatos. */
const FORMATOS=['webp','png','jpg','jpeg','svg'];
const PASTAS=['logos','players','staff','torneios','agentes','marcas','mapas','cidades','trofeus','estrutura','cenas','veiculos','imprensa','ui','bandeiras','logo-selecoes','copa'];

/* ---------- a base: quem deveria ter imagem ---------- */
const ctx={};vm.createContext(ctx);
for(const f of ['src/core/estrutura.js','data/mundo.js','data/patrocinadores.js','data/times.js','data/organizacoes.js','data/elencos.js','data/comissao.js','data/sedes.js','data/copa.js','data/imprensa.js','src/core/torneios.js']){
  const p=resolve(raiz,f);
  if(existsSync(p))vm.runInContext(readFileSync(p,'utf8')+
    ';this.TIMES_REAIS=typeof TIMES_REAIS!=="undefined"?TIMES_REAIS:this.TIMES_REAIS;'+
    'this.ELENCOS_REAIS=typeof ELENCOS_REAIS!=="undefined"?ELENCOS_REAIS:this.ELENCOS_REAIS;'+
    'this.ORGANIZACOES=typeof ORGANIZACOES!=="undefined"?ORGANIZACOES:this.ORGANIZACOES;'+
    'this.ENTRANTES=typeof ENTRANTES!=="undefined"?ENTRANTES:this.ENTRANTES;'+
    'this.COMISSAO_REAL=typeof COMISSAO_REAL!=="undefined"?COMISSAO_REAL:this.COMISSAO_REAL;'+
    'this.DEPTOS=typeof DEPTOS!=="undefined"?DEPTOS:this.DEPTOS;'+
    'this.AGENTS=typeof AGENTS!=="undefined"?AGENTS:this.AGENTS;'+
    'this.MAP_POOL=typeof MAP_POOL!=="undefined"?MAP_POOL:this.MAP_POOL;'+
    'this.SEDES=typeof SEDES!=="undefined"?SEDES:this.SEDES;'+
    'this.SEDES_COPA=typeof SEDES_COPA!=="undefined"?SEDES_COPA:this.SEDES_COPA;'+
    'this.COPA_SEDES=typeof COPA_SEDES!=="undefined"?COPA_SEDES:this.COPA_SEDES;'+
    'this.COPA_SELECOES=typeof COPA_SELECOES!=="undefined"?COPA_SELECOES:this.COPA_SELECOES;'+
    'this.VEICULOS=typeof VEICULOS!=="undefined"?VEICULOS:this.VEICULOS;'+
    'this.REGIONS=typeof REGIONS!=="undefined"?REGIONS:this.REGIONS;'+
    'this.PAISES=typeof PAISES!=="undefined"?PAISES:this.PAISES;'+
    'this.PATROCINADORES=typeof PATROCINADORES!=="undefined"?PATROCINADORES:this.PATROCINADORES;'+
    'this.PATAMARES=typeof PATAMARES!=="undefined"?PATAMARES:this.PATAMARES;'+
    'this.BLOCOS_MARCA=typeof BLOCOS_MARCA!=="undefined"?BLOCOS_MARCA:this.BLOCOS_MARCA;'+
    'this.NOME_BLOCO_MARCA=typeof NOME_BLOCO_MARCA!=="undefined"?NOME_BLOCO_MARCA:this.NOME_BLOCO_MARCA;'+
    'this.montarTorneios=typeof montarTorneios!=="undefined"?montarTorneios:this.montarTorneios;',ctx);
}
/* Cada mapa: slug → rótulo. `grupo` separa a LISTA.md por clube/região. */
const PASTAS_BASE=['logos','players','staff','torneios','agentes','marcas','mapas','cidades','trofeus','estrutura','cenas','veiculos','bandeiras','logo-selecoes','copa'];
const base=Object.fromEntries(PASTAS_BASE.map(d=>[d,new Map()]));
const grupo=Object.fromEntries(PASTAS_BASE.map(d=>[d,new Map()]));
for(const r in ctx.TIMES_REAIS||{})for(const d of ['t1','t2'])
  for(const [nome,tag] of ctx.TIMES_REAIS[r][d]||[]){
    /* escudo com nome de arquivo próprio (data/organizacoes.js), ex.: CR → crc */
    const arq=(ctx.ORGANIZACOES&&ctx.ORGANIZACOES[tag]&&ctx.ORGANIZACOES[tag].logo)||tag;
    base.logos.set(slug(arq),tag+' ('+nome+')');grupo.logos.set(slug(arq),r+(d==='t1'?' · Tier 1':' · Challengers'));
  }
/* quem compra vaga durante a carreira: o escudo já precisa existir */
for(const e of ctx.ENTRANTES||[]){
  base.logos.set(slug(e.logo||e.tag),e.tag+' ('+e.nome+', compra a vaga de '+e.de+')');grupo.logos.set(slug(e.logo||e.tag),'Chegam durante a carreira');
}
for(const tag in ctx.ELENCOS_REAIS||{})for(const l of ctx.ELENCOS_REAIS[tag])
  if(l&&l[0]){base.players.set(slug(l[0]),l[0]+' ('+tag+')');grupo.players.set(slug(l[0]),tag==='LIVRE'?'Sem clube':tag);}
for(const tag in ctx.COMISSAO_REAL||{})for(const l of ctx.COMISSAO_REAL[tag])
  if(l&&l[0]){base.staff.set(slug(l[0]),l[0]+' ('+tag+', '+(l[1]||'comissão')+')');grupo.staff.set(slug(l[0]),tag);}
/* torneios e agentes: catálogo fixo do jogo, mesmo id que ASSETS.arte/agente usam */
if(ctx.montarTorneios&&ctx.REGIONS){
  ctx.G={};const T=ctx.montarTorneios();
  for(const id in T){base.torneios.set(slug(id),T[id].nome);grupo.torneios.set(slug(id),T[id].escopo==='INT'?'Internacional':T[id].escopo);}
}
/* marcas: o id é o slug do nome, igual a montarMarcas() em economia.js */
{
  const area=m=>{
    if(!m.regiao||m.regiao==='GLOBAL')return 'Global';
    const ps=m.paises||[];
    if(!ps.length)return m.regiao==='CN'?'China':m.regiao+' (toda a região)';
    for(const b in ctx.BLOCOS_MARCA||{})if(ctx.BLOCOS_MARCA[b].join()===ps.join())return ctx.NOME_BLOCO_MARCA[b];
    return ps.map(c=>(ctx.PAISES&&ctx.PAISES[c])||c).join(', ');
  };
  for(const m of ctx.PATROCINADORES||[]){
    let id=slug(String(m.nome).replace(/['’]/g,''))||'marca',i=2;const b=id;
    while(base.marcas.has(id))id=b+'-'+(i++);
    const pat=(ctx.PATAMARES&&ctx.PATAMARES[m.patamar])||{nome:m.patamar,desc:''};
    base.marcas.set(id,m.nome+' ('+m.setor+', nível '+m.nivel+')');
    grupo.marcas.set(id,(m.regiao==='GLOBAL'?'':m.regiao+' · ')+area(m)+' · patamar '+pat.nome.toLowerCase());
  }
}
/* fase de playoffs: arte opcional, própria da fase (o torneio é o evento,
   mas os playoffs podem ter a sua arte). Sem ela, vale a do evento. */
for(const R of ctx.REGIONS||[])for(const [pre,ev] of [['po1','Stage 1'],['po2','Stage 2'],['cp1','Split 1'],['cp2','Split 2']]){
  const s=slug(pre+'_'+R.id);
  base.torneios.set(s,ev+' · '+R.nome+' — fase de playoffs (opcional)');grupo.torneios.set(s,R.id);
}
for(const d of ctx.DEPTOS||[]){base.estrutura.set(d.id,d.nome);grupo.estrutura.set(d.id,'');
  base.estrutura.set(d.id+'-basico',d.nome+' · nível 1–2 (opcional)');grupo.estrutura.set(d.id+'-basico','Versões por nível (opcionais)');
  base.estrutura.set(d.id+'-elite',d.nome+' · nível 5 (opcional)');grupo.estrutura.set(d.id+'-elite','Versões por nível (opcionais)');}
for(const v of ctx.VEICULOS||[]){base.veiculos.set(v.id,v.nome);grupo.veiculos.set(v.id,v.regiao==='GLOBAL'?'Global':v.regiao);}
/* cenas: fundos neutros das telas do dia a dia (o jogo põe escudo e cor por cima) */
for(const [g,l] of [
  ['Vestiário — atividades da semana',[['ativ-bootcamp','Bootcamp'],['ativ-ranked','Ranked em duo'],['ativ-stream','Stream juntos'],['ativ-jantar','Jantar do time'],['ativ-sessao','Sessão mental'],['ativ-folga','Folga coletiva']]],
  ['Notícias — por categoria',[['news-mercado','Mercado e transferências'],['news-lesao','Lesão e desgaste'],['news-contrato','Renovação e contrato'],['news-base','Base e revelações'],['news-torneio','Torneios e resultados'],['news-diretoria','Diretoria e finanças']]],
  ['Momentos',[['palco-premios','Cerimônia de fim de temporada'],['sala-negociacao','Negociação de compra, venda e renovação'],['sala-diretoria','Veredito da diretoria e metas']]]
])for(const [s,rot] of l){base.cenas.set(s,rot);grupo.cenas.set(s,g);}
for(const m of ctx.MAP_POOL||[]){base.mapas.set(slug(m),m);grupo.mapas.set(slug(m),'');}
for(const c of ctx.SEDES||[]){
  base.cidades.set(slug(c.nome),c.nome+' ('+c.pais+')');
  grupo.cidades.set(slug(c.nome),c.tipo==='champions'?'Champions (e Masters)':c.maior?'Masters — maior cidade do país':'Masters — fora da maior cidade');
}
{
  const T=(n,g,rot)=>{base.trofeus.set(n,rot);grupo.trofeus.set(n,g);};
  for(let i=1;i<=10;i++){const k=String(i).padStart(2,'0');T('champions-'+k,'Champions','variante '+i);T('masters-'+k,'Masters','variante '+i);}
  for(const [pre,nome] of [['kickoff','Kickoff'],['stage1','Stage 1'],['stage2','Stage 2'],['challengers','Challengers'],['ascension','Ascension']])
    for(const r of ['amer','emea','pac','cn'])T(pre+'-'+r,'Regionais',nome+' '+r.toUpperCase());
  T('padrao','Regionais','qualquer outro torneio');
  for(const [k,n] of [['mvp','MVP do ano'],['treinador','Treinador do ano'],['igl','IGL do ano'],['selecao','Seleção do ano'],['revelacao','Revelação do ano (opcional)'],['mvp-regional','MVP regional (opcional)']])
    T('premio-'+k,'Prêmios da temporada',n);
}
for(const c of ctx.SEDES_COPA||[]){base.cidades.set(slug(c.nome),c.nome+' ('+c.pais+')');grupo.cidades.set(slug(c.nome),'World Cup — só sede da Copa');}
/* bandeiras: todos os países do mundo pelo código ISO de duas letras, mais as
   quatro nações do Reino Unido no formato dos pacotes de bandeira (gb-eng…) */
{
  const ISO='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  const nomePt=(()=>{try{const d=new Intl.DisplayNames(['pt-BR'],{type:'region'});return c=>d.of(c);}catch{return c=>c;}})();
  const naCopa=new Set((ctx.COPA_SELECOES||[]).map(x=>x[0])), noJogo=new Set(Object.keys(ctx.PAISES||{}));
  const ordem=c=>naCopa.has(c)?0:noJogo.has(c)?1:2;
  for(const c of [...ISO,'XK'].sort((a,b)=>ordem(a)-ordem(b)||a.localeCompare(b))){
    const nome=(ctx.PAISES&&ctx.PAISES[c])||nomePt(c);
    base.bandeiras.set(c.toLowerCase(),nome+' ('+c+')');
    grupo.bandeiras.set(c.toLowerCase(),naCopa.has(c)?'Seleções da World Cup':noJogo.has(c)?'Outros países do jogo':'Resto do mundo');
  }
  for(const [k,n] of [['gb-eng','Inglaterra'],['gb-sct','Escócia'],['gb-wls','País de Gales'],['gb-nir','Irlanda do Norte']]){
    base.bandeiras.set(k,n+' (opcional)');grupo.bandeiras.set(k,'Nações do Reino Unido (opcionais)');
  }
}
for(const [c,sig] of ctx.COPA_SELECOES||[]){
  base['logo-selecoes'].set(slug(sig),((ctx.PAISES&&ctx.PAISES[c])||c)+' ('+sig+')');
  grupo['logo-selecoes'].set(slug(sig),'');
}
{
  const C=(n,g,rot)=>{base.copa.set(n,rot);grupo.copa.set(n,g);};
  C('logo','Identidade','logo padrão da Valorant World Cup (vira o logo da sede na apresentação)');
  C('trofeu','Identidade','a taça');
  C('fundo-final','Identidade','fundo da final (opcional)');
  for(const [c,nome] of ctx.COPA_SEDES||[])C('sede-'+slug(nome),'Logo de cada sede',nome+' ('+c+')');
}
for(const role in ctx.AGENTS||{})if(role!=='Flex')for(const a of ctx.AGENTS[role]){
  base.agentes.set(slug(a),a);grupo.agentes.set(slug(a),role);
}

/* ---------- o que existe em assets/ ---------- */
const arquivos={},duplicados=[],foraDoPadrao=[];
for(const dir of PASTAS){
  const pasta=resolve(raiz,'assets',dir);
  if(!existsSync(pasta))continue;
  for(const f of readdirSync(pasta)){
    const ext=extname(f).slice(1).toLowerCase();
    if(!FORMATOS.includes(ext))continue;          /* LEIAME.md e afins */
    let nome=basename(f,extname(f));
    if(slug(nome)!==nome){
      const novo=slug(nome)+'.'+ext;
      if(RENOMEAR&&!existsSync(resolve(pasta,novo))){
        renameSync(resolve(pasta,f),resolve(pasta,novo));
        console.log('renomeado: '+dir+'/'+f+' → '+novo);
        nome=slug(nome);
      }else{foraDoPadrao.push(dir+'/'+f+'  →  renomeie para '+novo+' (ou rode com --renomear)');continue;}
    }
    const k=dir+'/'+nome;
    if(arquivos[k]){
      const fica=FORMATOS.indexOf(ext)<FORMATOS.indexOf(arquivos[k])?ext:arquivos[k];
      duplicados.push(k+' ('+arquivos[k]+' e '+ext+'; fica '+fica+')');
      arquivos[k]=fica;
    }else arquivos[k]=ext;
  }
}

const chaves=Object.keys(arquivos).sort();
const saida=`/* Gerado por tools/imagens.mjs — não edite à mão; rode \`npm run imagens\`.
   Chave: '<pasta de assets>/<slug>'. Valor: a extensão do arquivo. */
const MIDIA={
  arquivos:{${chaves.map(k=>`\n    '${k}':'${arquivos[k]}'`).join(',')}${chaves.length?'\n  ':''}}
};
`;
writeFileSync(resolve(raiz,'data/midia.js'),saida);

/* ---------- relatório ---------- */
const ROTULO={logos:'Escudos',players:'Jogadores',staff:'Comissão',torneios:'Torneios',agentes:'Agentes',marcas:'Patrocinadores',mapas:'Mapas',cidades:'Cidades-sede',trofeus:'Troféus',estrutura:'Estrutura do clube',cenas:'Cenas da interface',veiculos:'Veículos de imprensa',bandeiras:'Bandeiras nacionais','logo-selecoes':'Escudos das seleções',copa:'Valorant World Cup'};
const DICA={logos:'tag do time',players:'nick do jogador',staff:'nick da pessoa',torneios:'id do torneio',agentes:'nome do agente',marcas:'nome da marca',mapas:'nome do mapa',cidades:'nome da cidade',trofeus:'nome do troféu',estrutura:'id do departamento',cenas:'id da cena',veiculos:'id do veículo',bandeiras:'código ISO de duas letras do país','logo-selecoes':'sigla de três letras da seleção',copa:'id da arte'};
let semDono=0;
console.log(`data/midia.js gravado — ${chaves.length} imagem(ns).\n`);
/* LISTA.md em cada pasta: o nome exato de cada arquivo que o jogo procura,
   marcado quando já existe. Regerada a cada build, então nunca fica velha. */
for(const dir of Object.keys(base)){
  const pasta=resolve(raiz,'assets',dir);
  if(!existsSync(pasta))mkdirSync(pasta,{recursive:true});
  const tem=new Set(chaves.filter(k=>k.startsWith(dir+'/')).map(k=>k.slice(dir.length+1)));
  const porGrupo=new Map();
  for(const [s,rot] of base[dir]){
    const g=grupo[dir].get(s)||'';
    if(!porGrupo.has(g))porGrupo.set(g,[]);
    porGrupo.get(g).push(`- [${tem.has(s)?'x':' '}] \`${s}.${tem.has(s)?arquivos[dir+'/'+s]:'png'}\` — ${rot}`);
  }
  const feitos=[...base[dir].keys()].filter(s=>tem.has(s)).length;
  writeFileSync(resolve(pasta,'LISTA.md'),
`# ${ROTULO[dir]} — nomes que o jogo procura

Gerado por \`npm run imagens\` (o build roda sozinho). Não edite à mão.

Salve cada imagem aqui em \`assets/${dir}/\` com o nome exato da lista. O nome é o
${DICA[dir]} em minúsculas, sem acento, com hífen no lugar de espaço e símbolo.
PNG, JPG ou WebP servem: troque só a extensão.

${feitos}/${base[dir].size} com imagem.
${[...porGrupo].map(([g,l])=>(g?`\n## ${g}\n\n`:'\n')+l.join('\n')).join('\n')}
`);
}
for(const dir of Object.keys(base)){
  const tem=new Set(chaves.filter(k=>k.startsWith(dir+'/')).map(k=>k.slice(dir.length+1)));
  const falta=[...base[dir]].filter(([s])=>!tem.has(s)).map(([,n])=>n);
  const orfaos=[...tem].filter(s=>!base[dir].has(s));
  if(dir==='bandeiras'){if(orfaos.length)console.log('  fora da lista ISO (servem, o jogo só não procura por elas): '+orfaos.join(', '));orfaos.length=0;}
  semDono+=orfaos.length;
  console.log(`${ROTULO[dir]}: ${base[dir].size-falta.length}/${base[dir].size} com imagem`);
  if(falta.length){
    const mostra=TUDO?falta:falta.slice(0,15);
    console.log('  sem imagem: '+mostra.join(', ')+(mostra.length<falta.length?` … e mais ${falta.length-mostra.length} (use --tudo)`:''));
  }
  if(orfaos.length)console.log('  NÃO BATEM com ninguém da base: '+orfaos.map(s=>dir+'/'+s).join(', '));
}
if(foraDoPadrao.length)console.log('\nFora do padrão de nome (ignorados):\n  '+foraDoPadrao.join('\n  '));
if(duplicados.length)console.log('\nMesmo nome em dois formatos:\n  '+duplicados.join('\n  '));
if(CHECAR&&(semDono||foraDoPadrao.length)){
  console.log('\n--checar: há arquivo sem dono ou fora do padrão.');
  process.exit(1);
}
