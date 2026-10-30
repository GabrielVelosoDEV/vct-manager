#!/usr/bin/env node
/* O caso que motivou o item 4: um Duelista forte ficava no banco porque a
   cobertura vinha antes da força. Mede quantos titulares seriam superados por
   um reserva, e quanto a secundária está sendo usada. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,over,overComo,custoDeFuncao,funcoesDescobertas,foraDePosicao,'
  +'ROLES,get G(){return G;}};';
const tmp=resolve(raiz,'.es.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(parseInt(process.argv[2])||20260828);const G=m.G;
let invertidos=0,piorGap=0,exemplo='',comSec=0,total=0,fora=0,descob=0,custoFora=[];
for(const id in G.times){
  const t=G.times[id];
  const banco=t.elenco.filter(i=>!t.titulares.includes(i)).map(i=>G.jogadores[i]).filter(p=>!p.lesao);
  const tit=t.titulares.map(i=>G.jogadores[i]);
  /* Comparar over NOMINAL engana: o que vale é o over NA FUNÇÃO em que cada um
     jogaria. Um Duelista de 91 que entraria como Controlador pode render 80
     ali, e aí ficar no banco está certo. */
  for(const b of banco)for(const s of tit){
    const papel=s.roleAtual||s.role;
    const efetivoB=m.overComo(b,papel), efetivoS=m.overComo(s,papel);
    const gap=efetivoB-efetivoS;
    if(gap>0){invertidos++;if(gap>piorGap){piorGap=gap;
      exemplo=`${t.tag}: ${b.nome} (${b.role}${b.role2?'/'+b.role2:''}) renderia ${efetivoB} como ${papel}`+
        `, contra ${efetivoS} de ${s.nome} (${s.role}) — nominal ${m.over(b)} vs ${m.over(s)}`;}}
  }
  descob+=m.funcoesDescobertas(t).length;
  const fp=m.foraDePosicao(t);fora+=fp.length;fp.forEach(x=>custoFora.push(x.custo));
  for(const i of t.elenco){total++;if(G.jogadores[i].role2)comSec++;}
}
const med=a=>a.length?(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1):'—';
console.log(`titulares superados por um reserva: ${invertidos} (pior diferença ${piorGap})`);
if(exemplo)console.log('  '+exemplo);
console.log(`jogadores com função secundária: ${comSec}/${total} (${Math.round(comSec/total*100)}%)`);
console.log(`titulares atuando fora da função principal: ${fora} (custo médio ${med(custoFora)} de over)`);
console.log(`funções descobertas somando todos os 80 clubes: ${descob}`);
