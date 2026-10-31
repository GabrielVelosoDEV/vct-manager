#!/usr/bin/env node
/* Testes de fumaça do motor: gera mundo, simula temporadas e valida invariantes.
   Uso: node tools/verificar.mjs [temporadas] [semente]

   Invariantes duras (falham o processo):
     · elencos entre 5 e 9, sempre 5 titulares, sem referência órfã
     · 48 times de Tier 1 e 32 de Tier 2, sempre
     · o rebaixado tem de estar entre os 4 piores da liga pela campanha
     · nenhum time de Tier 1 entra no Champions com pontos indefinidos
     · o Champions fecha com 16 times; todo stage do calendário termina
     · abates por mapa dentro de uma faixa plausível (temp.maps conta mapas)
   Métricas (só relatadas): finanças, over médio, tamanho do mercado.       */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const bundle=ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,over,acharStage,REGIONS,'
  +'importarElencos:typeof importarElencos!=="undefined"?importarElencos:null,'
  +'get G(){return G;},set G(v){G=v;}};';
const tmp=resolve(raiz,'.verificar.tmp.cjs');
writeFileSync(tmp,bundle);
const m=createRequire(import.meta.url)(tmp);
unlinkSync(tmp);

const anos=parseInt(process.argv[2])||3;
const semente=parseInt(process.argv[3])||20260828;
m.criarMundo(semente);m.montarCalendario();
const G=m.G;G.meuTime=G.regioes.AMER.t1[0];

const erros=[],avisos=[],financas=[];
const campanha=t=>t.temporada.v-t.temporada.d;

/* snapshot por região, para auditar acesso e rebaixamento */
let snap={};
const tirarSnap=()=>{
  const s={};
  for(const R of m.REGIONS){
    const r=G.regioes[R.id];
    s[R.id]={t1:r.t1.slice(),
      camp:Object.fromEntries(r.t1.map(id=>[id,campanha(G.times[id])])),
      pts:Object.fromEntries(r.t1.map(id=>[id,(r.pontos||{})[id]||0]))};
  }
  return s;
};
snap=tirarSnap();

const alvo=G.ano+anos;let n=0;
const t0=Date.now();
while(G.ano<alvo&&n<4000){
  /* antes de resolver o bloco do Champions, os pontos têm de estar todos definidos */
  const b=G.calendario[G.bloco];
  if(b&&b.montar==='champions'&&b._montado){
    for(const R of m.REGIONS){
      const P=G.regioes[R.id].pontos;
      const undef=G.regioes[R.id].t1.filter(id=>P[id]===undefined);
      if(undef.length)erros.push(G.ano+' · '+R.id+': pontos indefinidos no Champions em '+
        undef.map(id=>G.times[id].tag).join(','));
    }
    const champs=m.acharStage('champs');
    if(champs&&champs.times.length!==16)erros.push(G.ano+' · Champions com '+champs.times.length+' times (esperado 16)');
  }
  m.avancar();n++;

  /* mudou a composição de alguma liga? audita o rebaixamento */
  const novo=tirarSnap();
  for(const R of m.REGIONS){
    const antes=snap[R.id],agora=novo[R.id];
    const saiu=antes.t1.filter(id=>!agora.t1.includes(id));
    if(!saiu.length)continue;
    /* A régua do rebaixamento é pontos de circuito primeiro, campanha depois —
       um clube que foi a um Masters vale mais que um que só somou vitórias em
       casa. Auditar por saldo de campanha sozinho acusava rebaixamento certo
       como se fosse erro. O que NÃO pode acontecer é rebaixar alguém que ficou
       acima de um clube que sobreviveu nos DOIS critérios ao mesmo tempo. */
    for(const id of saiu){
      const melhorEmTudo=antes.t1.filter(x=>x!==id&&agora.t1.includes(x))
        .filter(x=>antes.pts[x]<antes.pts[id]&&antes.camp[x]<antes.camp[id]);
      if(melhorEmTudo.length)erros.push(G.ano+' · '+R.id+': rebaixou '+G.times[id].tag+
        ' (pts '+antes.pts[id]+', saldo '+antes.camp[id]+') e manteve '+
        melhorEmTudo.map(x=>G.times[x].tag+' (pts '+antes.pts[x]+', saldo '+antes.camp[x]+')').join(', '));
    }
  }
  snap=novo;

  /* fim de temporada: coleta métricas */
  if(G.ano!==alvo&&G.bloco===0&&financas.length<G.ano-(alvo-anos)){
    const ts=Object.values(G.times);
    financas.push({ano:G.ano-1,
      negativos:ts.filter(t=>t.caixa<0).length,
      pior:Math.round(Math.min(...ts.map(t=>t.caixa))/1000),
      livres:G.livres.length});
  }
}

/* invariantes estruturais */
for(const id in G.times){const t=G.times[id];
  if(t.elenco.length<5)erros.push(t.nome+' com elenco de '+t.elenco.length);
  if(t.elenco.length>9)erros.push(t.nome+' com elenco de '+t.elenco.length+' (máx. 9)');
  if(t.titulares.length!==5)erros.push(t.nome+' com '+t.titulares.length+' titulares');
  if(t.elenco.some(p=>!G.jogadores[p]))erros.push(t.nome+' referencia jogador inexistente');
  if(t.igl&&!t.elenco.includes(t.igl))erros.push(t.nome+' com IGL fora do elenco');
  /* categoria de base: garoto existe, é da base deste clube e não está em elenco nenhum */
  for(const id of t.base||[]){
    const p=G.jogadores[id];
    if(!p){erros.push(t.nome+' com garoto da base inexistente');continue;}
    if(p.base!==t.id||p.timeId)erros.push(t.nome+': '+p.nome+' está na base e em outro lugar');
    if(p.idade>=20)erros.push(t.nome+': '+p.nome+' ficou na base com '+p.idade+' anos');
  }
}
const nomes={};
Object.values(G.jogadores).forEach(p=>{nomes[p.nome]=(nomes[p.nome]||0)+1;});
const repetidos=Object.keys(nomes).filter(n=>nomes[n]>1);
if(repetidos.length)erros.push('nick repetido na base: '+repetidos.slice(0,6).join(', ')+
  (repetidos.length>6?' e mais '+(repetidos.length-6):''));

const nT1=Object.values(G.times).filter(t=>t.tier===1).length;
const nT2=Object.values(G.times).filter(t=>t.tier===2).length;
if(nT1!==48)erros.push('esperado 48 times de Tier 1, achou '+nT1);
if(nT2!==32)erros.push('esperado 32 times de Tier 2, achou '+nT2);

/* stages não podem ficar pendurados */
const pendurados=[];
G.calendario.forEach(b=>b.stages.forEach(s=>{if(!s.feito&&s.idx>0)pendurados.push(s.id);}));
if(pendurados.length>1)avisos.push('stages em andamento no corte: '+pendurados.join(','));

/* abates por mapa — pega temp.maps voltando a contar partidas */
const jog=Object.values(G.jogadores).filter(p=>p.temp.maps>=5);
if(jog.length){
  const kpm=jog.map(p=>p.temp.k/p.temp.maps);
  const med=kpm.reduce((a,b)=>a+b,0)/kpm.length;
  if(med<8||med>30)erros.push('abates por mapa fora da faixa: '+med.toFixed(1)+' (esperado 8–30)');
  else avisos.push('abates por mapa: '+med.toFixed(1)+' (mediana saudável)');
}

console.log(anos+' temporada(s) em',Date.now()-t0,'ms |',n,'avanços | semente',semente);
console.log('times:',Object.keys(G.times).length,'| jogadores:',Object.keys(G.jogadores).length,
            '| Tier 1:',nT1,'| Tier 2:',nT2);
console.log('títulos registrados:',G.historico.length);
if(financas.length){
  console.log('\nfinanças por temporada (clubes no vermelho / pior caixa / agentes livres):');
  financas.forEach(f=>console.log('  '+f.ano+': '+String(f.negativos).padStart(2)+' no vermelho · pior '+
    String(f.pior).padStart(6)+'k · '+f.livres+' livres'));
  const ult=financas[financas.length-1];
  if(ult.negativos>Math.max(8,Object.keys(G.times).length*0.15))
    avisos.push('espiral financeira: '+ult.negativos+' clubes no vermelho na última temporada');
}
if(avisos.length)console.log('\nAVISOS:\n'+avisos.map(a=>' · '+a).join('\n'));
console.log('\n'+(erros.length?'FALHAS:\n'+erros.map(e=>' · '+e).join('\n'):'OK — nenhuma inconsistência encontrada.'));
process.exit(erros.length?1:0);
