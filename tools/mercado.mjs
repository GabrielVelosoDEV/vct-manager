#!/usr/bin/env node
/* Mede o mercado de transferências: volume, para onde as pessoas vão, e se os
   prêmios regionais e de divisão realmente encarecem o que deveriam. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,over,salarioPedido,detalharPedido,'
  +'regiaoNatal,nivelDoClube,posicaoNoElenco,mercadoTransferencias,fimDeTemporada,REGIONS,'
  +'get G(){return G;}};';
const tmp=resolve(raiz,'.mk.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);m.montarCalendario();const G=m.G;
G.meuTime=G.regioes.AMER.t1[0];

/* --- prêmios: mesmo jogador, destinos diferentes --- */
const br=Object.values(G.jogadores).find(p=>p.pais==='BR'&&p.timeId&&G.times[p.timeId].tier===1);
const casa=m.regiaoNatal(br);
console.log(`Referência: ${br.nome} (${br.pais}, ${br.role}, over ${m.over(br)}), casa ${casa}`);
/* Clube-fantasma idêntico em cada região: só assim o prêmio regional aparece
   isolado. Comparar clubes reais mistura nível de elenco e vaga no time. */
const molde=G.times[br.timeId];
const clone=(regiao,tier)=>({id:'x'+regiao+tier,tag:'XX',nome:'Clube '+regiao,regiao,tier,
  prestigio:molde.prestigio,caixa:9e9,patroc:molde.patroc,torcida:molde.torcida,
  elenco:molde.elenco.filter(i=>i!==br.id),titulares:molde.titulares.filter(i=>i!==br.id)});
for(const R of m.REGIONS){
  const pedido=m.salarioPedido(br,clone(R.id,1));
  console.log(`  clube idêntico em ${R.id.padEnd(5)}: ${String(pedido).padStart(6)}/mês`);
}
console.log(`  clube idêntico em ${casa}, mas Tier 2: ${m.salarioPedido(br,clone(casa,2))}/mês`);
const d=m.detalharPedido(br,clone('CN',1));
console.log('  composição do pedido para a China:');
d.itens.forEach(i=>console.log(`    ${i.rot.padEnd(46)} ×${i.fator.toFixed(2)}`));

/* --- volume ao longo das temporadas --- */
console.log('\ntransferências por virada de temporada:');
const antes={};for(const id in G.jogadores)antes[id]=G.jogadores[id].timeId;
for(let ano=0;ano<5;ano++){
  const snap={};for(const id in G.jogadores)snap[id]=G.jogadores[id].timeId;
  /* avancar() já chama fimDeTemporada() ao entrar no offseason; chamar de novo
     aqui pulava uma temporada inteira por volta */
  const alvo=G.ano+1;let voltas=0;
  while(G.ano<alvo&&voltas++<600)m.avancar();
  let trocas=0,entreClubes=0,cross=0;
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    if(!(id in snap))continue;
    if(snap[id]!==p.timeId){trocas++;
      if(snap[id]&&p.timeId){entreClubes++;
        if(G.times[snap[id]]&&G.times[p.timeId]&&G.times[snap[id]].regiao!==G.times[p.timeId].regiao)cross++;}}
  }
  console.log(`  ${G.ano-1}: ${trocas} mudanças, ${entreClubes} entre clubes, ${cross} trocaram de região`);
}
