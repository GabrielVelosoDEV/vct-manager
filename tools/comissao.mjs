#!/usr/bin/env node
/* O que a comissão técnica realmente entrega, por divisão.
   Mede o nível que cada clube consegue e traduz esse nível nos quatro
   lugares onde ele mexe no jogo: moral, lesão, treino e força de partida. */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,nivelStaff,overStaff,CARGOS,FAIXAS,folhaStaff,NIVEL_NEUTRO,get G(){return G;}};';
const tmp=resolve(raiz,'.cm.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);
m.criarMundo(20260828);const G=m.G;

/* Os k vivem em clock.js. Ler de lá em vez de copiar é o que impede este
   medidor de continuar reportando o mundo antigo depois de um ajuste. */
const clock=readFileSync(resolve(raiz,'src/core/clock.js'),'utf8');
const leK=(re,nome)=>{const x=clock.match(re);
  if(!x)throw new Error('não achei '+nome+' em clock.js — a fórmula mudou, atualize este medidor');
  return parseFloat(x[1]);};
const K_LESAO=leK(/staff\.fisio\|\|neutro\)-neutro\)\*([\d.]+)/,'k de lesão');
const K_MORAL=leK(/staff\.mental\|\|neutro\)-neutro\)\*([\d.]+)/,'k de moral');

const est=a=>{const s=[...a].sort((x,y)=>x-y);
  return{min:s[0],p50:s[Math.floor(s.length/2)],max:s[s.length-1],
         med:s.reduce((x,y)=>x+y,0)/s.length};};
const f2=v=>v.toFixed(2);

console.log('FAIXA DE OVER DA COMISSÃO  T1',m.FAIXAS.comissao[1].join('–'),
            ' T2',m.FAIXAS.comissao[2].join('–'));
console.log('teto da escala: nivelStaff(99)='+f2(m.nivelStaff(99))+
            '  piso: nivelStaff(62)='+f2(m.nivelStaff(62))+'\n');

for(const tier of[1,2]){
  const ts=Object.values(G.times).filter(t=>t.tier===tier);
  const niv=[],porCargo={};
  for(const t of ts){
    for(const c of m.CARGOS){
      const v=t.staff[c.id];
      niv.push(v);(porCargo[c.id]=porCargo[c.id]||[]).push(v);
    }
  }
  const e=est(niv);
  console.log(`TIER ${tier}  nível da comissão: min ${f2(e.min)} | mediana ${f2(e.p50)} | máx ${f2(e.max)} | média ${f2(e.med)}`);
  /* traduzir o nível nos efeitos reais */
  const tec=est(porCargo.tecnico), men=est(porCargo.mental),
        fis=est(porCargo.fisio),   ana=est(porCargo.analista);
  const N=m.NIVEL_NEUTRO;
  const treino=n=>0.45+2*0.09+n*0.07;                 /* clock.js, estrutura 2 */
  const moral =n=>(n-N)*K_MORAL+0.004;                /* clock.js */
  const lesao =n=>-((n-N)*K_LESAO);                   /* clock.js, + = mais risco */
  const forca =(a,b)=>(a*1.1+b*0.9)-(1.1+0.9)*N;      /* match.js */
  console.log(`  treino (mult.)   pior ${f2(treino(tec.min))}  mediano ${f2(treino(tec.p50))}  melhor ${f2(treino(tec.max))}`);
  console.log(`  moral (/semana)  pior ${moral(men.min).toFixed(4)}  mediano ${moral(men.p50).toFixed(4)}  melhor ${moral(men.max).toFixed(4)}`);
  console.log(`  lesão (+risco)   pior ${lesao(fis.min).toFixed(4)}  mediano ${lesao(fis.p50).toFixed(4)}  melhor ${lesao(fis.max).toFixed(4)}`);
  console.log(`  força de partida pior ${f2(forca(tec.min,ana.min))}  mediano ${f2(forca(tec.p50,ana.p50))}  melhor ${f2(forca(tec.max,ana.max))}`);
  const folhas=ts.map(m.folhaStaff);
  console.log(`  folha da comissão: mediana ${Math.round(est(folhas).p50/1000)}k/ano\n`);
}
/* Quanto o melhor clube da divisão ganha por ter investido, contra o pior. */
for(const tier of[1,2]){
  const ts=Object.values(G.times).filter(t=>t.tier===tier);
  const soma=t=>m.CARGOS.reduce((s,c)=>s+t.staff[c.id],0)/m.CARGOS.length;
  const ord=[...ts].sort((a,b)=>soma(b)-soma(a));
  console.log(`TIER ${tier}  melhor comissão: ${ord[0].nome} (nível médio ${f2(soma(ord[0]))})`+
              `  |  pior: ${ord[ord.length-1].nome} (${f2(soma(ord[ord.length-1]))})`);
}
