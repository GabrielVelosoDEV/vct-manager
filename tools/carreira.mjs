#!/usr/bin/env node
/* Simula uma carreira inteira de treinador e mostra o que a diretoria cobrou,
   o que aconteceu e quando o emprego acabou. Sem isso, "metas simples" é uma
   frase — aqui dá para ver se são exigentes demais ou de menos. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,criarManager,montarMetas,'
  +'ofertasDeEmprego,assumirClube,posicaoNaLiga,get G(){return G;}};';
const tmp=resolve(raiz,'.ca.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);

const tag=process.argv[2]||'SEN';
const anos=parseInt(process.argv[3])||14;
m.criarMundo(parseInt(process.argv[4])||20260828);m.montarCalendario();
const G=m.G;
G.meuTime=Object.values(G.times).find(t=>t.tag===tag).id;
m.criarManager('Gabriel','treinador');m.montarMetas();
console.log(`Treinador no ${tag} · prestígio ${Math.round(G.times[G.meuTime].prestigio)}\n`);
console.log(' ano  clube  meta                             resultado    conf   ');
let demissoes=0;
for(let k=0;k<anos;k++){
  const meta=G.manager.metas[0];
  const clube=G.times[G.meuTime];
  const alvo=G.ano+1;let v=0;
  while(G.ano<alvo&&v++<600)m.avancar();
  const reg=G.manager.historico[G.manager.historico.length-1];
  if(!reg)continue;
  const ok=reg.metas[0].cumprida;
  console.log(` ${reg.ano}  ${reg.tag.padEnd(5)}  ${meta.text||meta.texto.padEnd(32)} `+
    `${(reg.pos+'º de '+reg.de).padEnd(12)} ${String(reg.confianca).padStart(3)} `+
    `${ok?'✓':'✗'}${reg.titulos?'  🏆'+reg.titulos:''}`);
  if(G.manager.demitido){
    demissoes++;
    const of=m.ofertasDeEmprego();
    if(!of.length){console.log('   demitido, e sem ofertas — carreira encerrada');break;}
    console.log(`   DEMITIDO. ofertas: ${of.map(t=>t.tag).join(', ')} → assume ${of[0].tag}`);
    m.assumirClube(of[0].id);
  }
}
console.log(`\ndemissões em ${anos} temporadas: ${demissoes}`);
console.log('clubes na carreira:',[...G.manager.clubes.map(c=>c.tag),G.times[G.meuTime].tag].join(' → '));
