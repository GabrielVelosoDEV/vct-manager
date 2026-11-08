#!/usr/bin/env node
/* Mede o pós-carreira: quantos aposentados viram comissão, caster ou dono de
   clube por temporada, e quantos ex-jogadores estão empregados como comissão
   depois de algumas temporadas — é isso que deixa o mercado de comissão com
   nomes reconhecíveis.
   Uso: node tools/poscarreira.mjs [anos=10] [semente] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const espiao=`
const _apos=[];
posCarreira=(function(orig){return function(p){const L=pontosDeLenda(p);const d=orig(p);
  _apos.push({ano:G.ano,L,maps:(p.carreira||{}).maps||0,pico:p.pico||0,d});return d;};})(posCarreira);`;
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')+espiao
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,overStaff,get G(){return G;},get apos(){return _apos;}};';
const tmp=resolve(raiz,'.pc.tmp.cjs');
writeFileSync(tmp,bundle);const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);

const anos=parseInt(process.argv[2])||10;
m.criarMundo(parseInt(process.argv[3])||20260828);m.montarCalendario();
const G=m.G;G.meuTime=Object.values(G.times).find(t=>t.tier===1).id;
console.log(' ano  aposent notáveis  coach analista olheiro caster dono | ex na comissão: empregados / livres | cerimônia');
let v=0;
for(let k=0;k<anos;k++){
  const alvo=G.ano+1;
  const antes=Object.keys(G.jogadores).length;
  while(G.ano<alvo&&v++<anos*80)m.avancar();
  const ano=alvo-1;
  const reg=(G.premios||[]).find(r=>r.ano===ano);
  const cer=reg&&reg.cer;
  const ex=Object.values(G.staff).filter(s=>s.ex);
  const novos=ex.filter(s=>s.ex.ano===ano);
  const por=c=>novos.filter(s=>s.cargo===c).length;
  const casters=(G.casters||[]).filter(c=>c.ano===ano).length;
  const donos=(G.donos||[]).filter(d=>d.ano===ano);
  const ap=m.apos.filter(x=>x.ano===ano);
  console.log(` ${ano}  ${String(ap.length).padStart(7)} ${String(cer?cer.despedidas.length:'—').padStart(8)}  `+
    `${String(por('tecnico')).padStart(5)} ${String(por('analista')).padStart(8)} ${String(por('olheiro')).padStart(7)} `+
    `${String(casters).padStart(6)} ${String(donos.length).padStart(4)} | ${String(ex.filter(s=>s.timeId).length).padStart(9)} / ${String(ex.filter(s=>!s.timeId).length).padEnd(6)}`+
    `             | ${cer?cer.campeoes.length+' campeões, '+cer.clube.torneios.length+' torneios seus':'—'}`+
    (donos.length?'  dono: '+donos.map(d=>d.nome+' → '+G.times[d.timeId].tag).join(', '):''));
}
const empreg=Object.values(G.staff).filter(s=>s.ex&&s.timeId)
  .sort((a,b)=>m.overStaff(b)-m.overStaff(a)).slice(0,8);
console.log('\nex-jogadores mais bem colocados na comissão:');
for(const s of empreg)console.log(`  ${s.nome.padEnd(14)} ${s.cargo.padEnd(9)} ${G.times[s.timeId].tag.padEnd(5)} over ${m.overStaff(s)}  (aposentou em ${s.ex.ano}, ${s.ex.titulos} títulos)`);
console.log('casters:',(G.casters||[]).map(c=>c.nome).join(', ')||'—');
const ap=m.apos,q=(f)=>ap.filter(f).length;
console.log(`\n${ap.length} aposentadorias: pontos de lenda ≥20: ${q(x=>x.L>=20)}, ≥10: ${q(x=>x.L>=10)}, ≥4: ${q(x=>x.L>=4)}; pico ≥80: ${q(x=>x.pico>=80)}; com destino: ${q(x=>x.d)}`);
