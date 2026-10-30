#!/usr/bin/env node
/* Ida e volta: mundo -> padroniza -> gerarElencosJS -> vira data/elencos.js
   -> mundo novo. Os overs exportados têm de reaparecer idênticos, senão o
   fluxo "salvar o que editei" perde exatamente o que era para salvar. */
import {readFileSync,writeFileSync,unlinkSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const carregar=()=>{
  const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
    .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
    .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
  const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
    +'\nmodule.exports={criarMundo,over,padronizarBase,gerarElencosJS,get G(){return G;}};';
  const tmp=resolve(raiz,'.rt.'+Math.random().toString(36).slice(2)+'.cjs');
  writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
  return m;
};
let codigo=0;
const alvo=resolve(raiz,'data/elencos.js');
const backup=resolve(raiz,'.elencos.bak');
copyFileSync(alvo,backup);
try{
  const a=carregar();a.criarMundo(20260828);a.padronizarBase();
  const esperado=new Map();
  for(const id in a.G.times){const t=a.G.times[id];
    for(const pid of t.elenco){const p=a.G.jogadores[pid];
      if(p.real)esperado.set(p.nome,{ov:a.over(p),role:p.role,idade:p.idade,pais:p.pais});}}
  writeFileSync(alvo,a.gerarElencosJS());
  console.log('exportados',esperado.size,'jogadores reais');

  const b=carregar();b.criarMundo(999999);   /* semente diferente de propósito */
  let conf=0,dif=[];
  for(const id in b.G.jogadores){const p=b.G.jogadores[id];
    const e=esperado.get(p.nome);if(!e||!p.real)continue;
    const o=b.over(p);
    if(o===e.ov&&p.role===e.role&&p.idade===e.idade&&p.pais===e.pais)conf++;
    else dif.push(`${p.nome}: ${e.ov}/${e.role}/${e.idade}/${e.pais} -> ${o}/${p.role}/${p.idade}/${p.pais}`);}
  console.log(`conferem: ${conf}/${esperado.size}`);
  if(dif.length){console.log('divergências (até 8):');dif.slice(0,8).forEach(d=>console.log('  '+d));}
  console.log(dif.length?'FALHOU':'OK — ida e volta preserva tudo');
  /* Sair AQUI pularia o finally — process.exit() não roda bloco finally — e
     data/elencos.js ficaria com o arquivo de teste no lugar do seu. O código
     de saída é guardado e aplicado depois da restauração. */
  codigo=dif.length?1:0;
}finally{
  /* data/elencos.js é dado do usuário: restaurar não é opcional. Se o backup
     ainda existir de uma execução que morreu no meio, ele também volta. */
  try{copyFileSync(backup,alvo);}catch(e){console.error('ATENÇÃO: não consegui restaurar data/elencos.js — copie de',backup);throw e;}
  unlinkSync(backup);
}
process.exit(codigo);
