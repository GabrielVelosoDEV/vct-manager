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
const PASTAS=['logos','players','staff','torneios','agentes','marcas'];

/* ---------- a base: quem deveria ter imagem ---------- */
const ctx={};vm.createContext(ctx);
for(const f of ['data/mundo.js','data/times.js','data/elencos.js','data/comissao.js','src/core/torneios.js']){
  const p=resolve(raiz,f);
  if(existsSync(p))vm.runInContext(readFileSync(p,'utf8')+
    ';this.TIMES_REAIS=typeof TIMES_REAIS!=="undefined"?TIMES_REAIS:this.TIMES_REAIS;'+
    'this.ELENCOS_REAIS=typeof ELENCOS_REAIS!=="undefined"?ELENCOS_REAIS:this.ELENCOS_REAIS;'+
    'this.COMISSAO_REAL=typeof COMISSAO_REAL!=="undefined"?COMISSAO_REAL:this.COMISSAO_REAL;'+
    'this.AGENTS=typeof AGENTS!=="undefined"?AGENTS:this.AGENTS;'+
    'this.REGIONS=typeof REGIONS!=="undefined"?REGIONS:this.REGIONS;'+
    'this.montarTorneios=typeof montarTorneios!=="undefined"?montarTorneios:this.montarTorneios;',ctx);
}
/* Cada mapa: slug → rótulo. `grupo` separa a LISTA.md por clube/região. */
const base={logos:new Map(),players:new Map(),staff:new Map(),torneios:new Map(),agentes:new Map()};
const grupo={logos:new Map(),players:new Map(),staff:new Map(),torneios:new Map(),agentes:new Map()};
for(const r in ctx.TIMES_REAIS||{})for(const d of ['t1','t2'])
  for(const [nome,tag] of ctx.TIMES_REAIS[r][d]||[]){
    base.logos.set(slug(tag),tag+' ('+nome+')');grupo.logos.set(slug(tag),r+(d==='t1'?' · Tier 1':' · Challengers'));
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
const ROTULO={logos:'Escudos',players:'Jogadores',staff:'Comissão',torneios:'Torneios',agentes:'Agentes'};
const DICA={logos:'tag do time',players:'nick do jogador',staff:'nick da pessoa',torneios:'id do torneio',agentes:'nome do agente'};
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
