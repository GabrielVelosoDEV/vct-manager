#!/usr/bin/env node
/* Confere os formatos: sorteio de grupos, dupla eliminação e fase suíça.
   Uso: node tools/formato.mjs [temporadas] [semente] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
writeFileSync(resolve(raiz,'.fm.tmp.cjs'),ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,acharStage,ordenarGrupo,'
  +'classificadosDosGrupos,nomeStage,REGIONS,get G(){return G;}};');
const m=createRequire(import.meta.url)(resolve(raiz,'.fm.tmp.cjs'));
unlinkSync(resolve(raiz,'.fm.tmp.cjs'));

const anos=parseInt(process.argv[2]||'1',10), semente=parseInt(process.argv[3]||'20260828',10);
m.criarMundo(semente);m.montarCalendario();const G=m.G;
const erros=[];
const vistos=new Set();

/* Para na última semana da temporada final: depois dela fimDeTemporada()
   remonta o calendário e não sobra nada para retratar. */
const alvo=G.ano+anos;
while(!(G.ano===alvo-1&&G.semana>=47)){
  m.avancar();
  if(G.ano>=alvo)break;
  for(const b of G.calendario)for(const s of b.stages){
    if(!s.feito||vistos.has(G.ano+s.id))continue;
    vistos.add(G.ano+s.id);
    if(s.tipo==='grupos'){
      if(!s.grupos||!s.grupos.length){erros.push(s.id+': fase de grupos sem grupos');continue;}
      const soma=s.grupos.reduce((a,g)=>a+g.times.length,0);
      if(soma!==s.times.length)erros.push(s.id+': '+soma+' times nos grupos de '+s.times.length);
      if(!s.classificados||s.classificados.length!==s.passam*s.grupos.length)
        erros.push(s.id+': classificou '+(s.classificados||[]).length+', esperado '+(s.passam*s.grupos.length));
      /* todo mundo jogou contra todos do próprio grupo, e contra ninguém de fora */
      for(const g of s.grupos)for(const id of g.times){
        const jog=g.tabela[id].v+g.tabela[id].d;
        if(jog!==g.times.length-1)
          erros.push(s.id+'/'+g.nome+': '+G.times[id].tag+' fez '+jog+' jogos, esperado '+(g.times.length-1));
      }
      const fora=s.resultados.filter(r=>s._grupoDe[r.a]!==s._grupoDe[r.b]);
      if(fora.length)erros.push(s.id+': '+fora.length+' jogo(s) entre grupos diferentes');
    }
    if(s.tipo==='de'){
      if(!s.campeao){erros.push(s.id+': dupla eliminação terminou sem campeão');continue;}
      /* ninguém sai com menos de duas derrotas, menos o campeão */
      const derrotas={};
      s.resultados.forEach(r=>{const p=r.v===r.a?r.b:r.a;derrotas[p]=(derrotas[p]||0)+1;});
      const cedo=s.times.filter(id=>id!==s.campeao&&(derrotas[id]||0)<2&&id!==s.vice);
      if(cedo.length)erros.push(s.id+': '+cedo.map(i=>G.times[i].tag+'('+(derrotas[i]||0)+'D)').join(',')+
        ' eliminado(s) com menos de duas derrotas');
      if((derrotas[s.campeao]||0)>1)erros.push(s.id+': campeão com '+derrotas[s.campeao]+' derrotas');
      if(s.ranking.length!==s.times.length)
        erros.push(s.id+': ranking com '+s.ranking.length+' de '+s.times.length+' times');
    }
    if(s.tipo==='swiss'){
      const jogos={};
      s.resultados.forEach(r=>{jogos[r.a]=(jogos[r.a]||0)+1;jogos[r.b]=(jogos[r.b]||0)+1;});
      const errados=s.times.filter(id=>(jogos[id]||0)!==s.rodadasMax);
      if(errados.length)erros.push(s.id+': '+errados.map(i=>G.times[i].tag+':'+(jogos[i]||0)).join(',')+
        ' fora das '+s.rodadasMax+' rodadas');
    }
  }
}

/* retrato de uma temporada */
console.log('FORMATOS · semente '+semente+' · '+anos+' temporada(s)\n');
const amostra=['s1_AMER','po1_AMER','masters1_sw','masters1','ch_gr','champs'];
for(const id of amostra){
  const s=m.acharStage(id);
  if(!s)continue;
  console.log('· '+m.nomeStage(s)+'  ['+s.tipo+', '+s.times.length+' times, '+s.resultados.length+' séries]');
  if(s.tipo==='grupos'){
    for(const g of s.grupos)
      console.log('    '+g.nome.padEnd(7)+m.ordenarGrupo(g).map((i,k)=>
        (k<s.passam?'✓':' ')+G.times[i].tag+' '+g.tabela[i].v+'-'+g.tabela[i].d).join('  '));
  }
  if(s.tipo==='de'){
    (s.chave||[]).forEach(r=>console.log('    '+String(r.nome).padEnd(24)+
      r.jogos.map(j=>G.times[j.a].tag+' '+j.wa+'-'+j.wb+' '+G.times[j.b].tag).join(' | ')));
    console.log('    campeão: '+(s.campeao?G.times[s.campeao].tag:'—')+
                '  vice: '+(s.vice?G.times[s.vice].tag:'—'));
  }
  if(s.tipo==='swiss')
    console.log('    '+s.ranking.map(i=>G.times[i].tag+' '+s.suico[i].v+'-'+s.suico[i].d).join('  '));
  console.log('');
}
/* MVPs eleitos: o prêmio tem de sair em todo torneio que paga, e tem de cair
   quase sempre em quem chegou longe. */
console.log('\nMELHOR JOGADOR');
let semMvp=0,total=0;
for(const b of G.calendario)for(const s of b.stages){
  if(!s._encerrado)continue;
  total++;
  if(!s.mvp){semMvp++;console.log('  · '+m.nomeStage(s)+': NENHUM');continue;}
  const e=s.stats[s.mvp],p=G.jogadores[s.mvp];
  const pos=s.ranking.indexOf(e.timeId)+1;
  console.log('  · '+m.nomeStage(s).padEnd(34)+(p?p.nome:'?').padEnd(12)+
    (e.timeId&&G.times[e.timeId]?G.times[e.timeId].tag:'—').padEnd(6)+
    pos+'º  ACS '+Math.round(e.acs/e.maps)+'  '+e.maps+' mapas');
}
if(semMvp)console.log('  '+semMvp+' de '+total+' torneios sem MVP');
const posicoes={};
for(const b of G.calendario)for(const s of b.stages){
  if(!s._encerrado||!s.mvp)continue;
  const pos=s.ranking.indexOf(s.stats[s.mvp].timeId)+1;
  posicoes[pos]=(posicoes[pos]||0)+1;
}
console.log('  colocação do time do MVP: '+Object.keys(posicoes).sort((a,b)=>a-b)
  .map(k=>k+'º:'+posicoes[k]).join('  '));

console.log(erros.length?'FALHAS:\n'+erros.map(e=>' · '+e).join('\n'):'OK — formatos consistentes');
process.exit(erros.length?1:0);
