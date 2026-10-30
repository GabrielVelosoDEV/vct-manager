#!/usr/bin/env node
/* Confere que um save gravado ANTES do calendário semanal volta a jogar.
   O calendário antigo não tinha semana: sem remontar, blocoDaSemana() não
   achava bloco nenhum e a temporada inteira passava em branco, sem erro.
   Uso: node tools/save-antigo.mjs */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('assets')&&!p.endsWith('main.js'));
writeFileSync(resolve(raiz,'.vv.tmp.cjs'),ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +`
/* stubs do que storage.js espera do navegador */
module.exports={criarMundo,montarCalendario,avancar,desempacotarRun,empacotarRun,
  RUN_VERSAO,acharStage,blocoDaSemana,get G(){return G;},set G(v){G=v;},
  get semente(){return _s;}};`);
const m=createRequire(import.meta.url)(resolve(raiz,'.vv.tmp.cjs'));

m.criarMundo(20260828);m.montarCalendario();
for(let i=0;i<20;i++)m.avancar();

/* --- monta um registro "v6": calendário no formato antigo, sem semana --- */
const reg=JSON.parse(JSON.stringify(m.empacotarRun('velho')));
reg.versao=6;
const g=reg.estado;
delete g.semana;
/* blocos do jeito antigo: sem ini/fim, com os nomes da versão anterior */
g.calendario=[
  {nome:'Pré-temporada',stages:[],endKey:'preseason',janela:true},
  {nome:'Kickoff',stages:[],endKey:'kickoff'},
  {nome:'Masters I',stages:[],endKey:'masters1',montar:'masters1'},
  {nome:'Stage 1',stages:[],endKey:'stage1'},
  {nome:'Playoffs Stage 1',stages:[],endKey:'po1',montar:'po1'},
  {nome:'Fim de temporada',stages:[],endKey:'offseason'}
];
g.bloco=3;
for(const id in g.times){delete g.times[id].tierInicial;}
delete g.propostas;

console.log('--- carregando save v6 (calendário antigo, sem semana) ---');
try{
  const ok=m.desempacotarRun(reg);
  console.log('desempacotarRun:',ok);
  console.log('G.semana depois da migração:',m.G.semana);
  console.log('calendário tem ini/fim?',m.G.calendario[0].ini!==undefined);
  console.log('blocoDaSemana(G.semana):',m.blocoDaSemana(m.G.semana||1));
}catch(e){console.log('ERRO na carga:',e.message);process.exit(1);}

console.log('\n--- tentando jogar 60 semanas ---');
let ano0=m.G.ano, jogos=0, err=null;
try{
  for(let i=0;i<60;i++){
    const r=m.avancar();
    if(r&&r.resultados)jogos+=r.resultados.length;
  }
}catch(e){err=e;}
console.log('partidas simuladas:',jogos);
console.log('ano:',ano0,'→',m.G.ano,' semana:',m.G.semana);
if(err){console.log('ERRO ao jogar:',err.message);process.exit(1);}
if(!jogos)console.log('>>> TRAVOU: nenhuma partida aconteceu em 60 semanas');
