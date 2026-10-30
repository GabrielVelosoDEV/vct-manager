#!/usr/bin/env node
/* Caça-bugs de longo prazo: salva e recarrega em CADA semana da temporada e
   confere invariantes do mundo ao longo de oito temporadas — elenco entre o
   mínimo e o máximo, jogador em um clube só, empréstimo com dono vivo,
   proposta sem órfão, ranking completo em todo torneio encerrado.
   Uso: node tools/integridade.mjs [semente] */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('assets')&&!p.endsWith('main.js'));
writeFileSync(resolve(raiz,'.cc.tmp.cjs'),ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,desempacotarRun,empacotarRun,'
  +'acharStage,blocoDaSemana,over,ELENCO_MIN,ELENCO_MAX,folhaAnual,receitaLivre,'
  +'mapaAtivo,nivelAgente,ATTRS,'
  +'get G(){return G;},set G(v){G=v;},get semente(){return _s;}};');
const m=createRequire(import.meta.url)(resolve(raiz,'.cc.tmp.cjs'));
const erros=[];
const E=(cond,msg)=>{if(!cond)erros.push(msg);};

const semente=parseInt(process.argv[2]||'20260828',10);
m.criarMundo(semente);m.montarCalendario();
const G0=()=>m.G;

/* ---- 1. salvar e recarregar em CADA semana da temporada ---- */
for(let sem=1;sem<=52;sem++){
  const antes=JSON.parse(JSON.stringify(m.empacotarRun('t')));
  const semAntes=m.G.semana, anoAntes=m.G.ano, sAntes=m.semente;
  /* estado dos stages antes */
  const foto=[];
  for(const b of m.G.calendario)for(const s of b.stages)
    foto.push([s.id,s.tipo,s.idx,s.feito,(s.resultados||[]).length,
               JSON.stringify(s.rodadaAtual||null),
               (s.ub||[]).join(','),(s.lb||[]).join(','),(s.chave||[]).length,
               JSON.stringify(s.classificados||null)].join('|'));
  m.desempacotarRun(JSON.parse(JSON.stringify(antes)));
  E(m.G.semana===semAntes,`semana ${sem}: ida e volta mudou a semana ${semAntes}→${m.G.semana}`);
  E(m.G.ano===anoAntes,`semana ${sem}: ida e volta mudou o ano`);
  E(m.semente===sAntes,`semana ${sem}: ida e volta mexeu na semente ${sAntes}→${m.semente}`);
  const depois=[];
  for(const b of m.G.calendario)for(const s of b.stages)
    depois.push([s.id,s.tipo,s.idx,s.feito,(s.resultados||[]).length,
                 JSON.stringify(s.rodadaAtual||null),
                 (s.ub||[]).join(','),(s.lb||[]).join(','),(s.chave||[]).length,
                 JSON.stringify(s.classificados||null)].join('|'));
  if(foto.join('\n')!==depois.join('\n')){
    const dif=foto.filter((x,i)=>x!==depois[i])[0];
    erros.push(`semana ${sem}: o estado do torneio mudou na ida e volta\n      antes:  ${dif}\n      depois: ${depois[foto.indexOf(dif)]}`);
  }
  m.avancar();
}

/* ---- 2. invariantes ao longo de 8 temporadas ---- */
const vistos=new Set();
for(let i=0;i<52*8;i++){
  m.avancar();
  const G=m.G;
  for(const id in G.times){
    const t=G.times[id];
    if(t.elenco.length<m.ELENCO_MIN)erros.push(`${G.ano}s${G.semana}: ${t.tag} com ${t.elenco.length} jogadores`);
    if(t.elenco.length>m.ELENCO_MAX)erros.push(`${G.ano}s${G.semana}: ${t.tag} com ${t.elenco.length} jogadores (acima do teto)`);
    if(t.titulares.length!==5&&t.elenco.length>=5)erros.push(`${G.ano}s${G.semana}: ${t.tag} com ${t.titulares.length} titulares`);
    if(!isFinite(t.caixa))erros.push(`${G.ano}s${G.semana}: ${t.tag} com caixa ${t.caixa}`);
    if(!isFinite(t.torcida))erros.push(`${G.ano}s${G.semana}: ${t.tag} com torcida ${t.torcida}`);
    for(const pid of t.elenco){
      const p=G.jogadores[pid];
      if(!p){erros.push(`${G.ano}s${G.semana}: ${t.tag} tem id fantasma no elenco`);continue;}
      if(p.timeId!==id)erros.push(`${G.ano}s${G.semana}: ${p.nome} está no elenco do ${t.tag} mas timeId=${p.timeId}`);
    }
    for(const pid of t.titulares)
      if(!t.elenco.includes(pid))erros.push(`${G.ano}s${G.semana}: titular fora do elenco no ${t.tag}`);
  }
  /* jogador não pode estar em dois elencos */
  const dono={};
  for(const id in G.times)for(const pid of G.times[id].elenco){
    if(dono[pid])erros.push(`${G.ano}s${G.semana}: ${G.jogadores[pid]?G.jogadores[pid].nome:pid} em dois elencos`);
    dono[pid]=id;
  }
  /* livre não pode ter clube */
  for(const pid of G.livres){
    const p=G.jogadores[pid];
    if(p&&p.timeId)erros.push(`${G.ano}s${G.semana}: ${p.nome} está livre e com clube`);
  }
  /* empréstimo coerente */
  for(const pid in G.jogadores){
    const p=G.jogadores[pid];
    if(!p.emprestimo)continue;
    if(!G.times[p.emprestimo.donoId])erros.push(`${G.ano}s${G.semana}: ${p.nome} emprestado por clube que não existe`);
    if(p.timeId===p.emprestimo.donoId)erros.push(`${G.ano}s${G.semana}: ${p.nome} emprestado para o próprio dono`);
  }
  /* IGL tem de existir e jogar no clube: a aposentadoria e a venda tiravam o
     jogador do elenco e o crachá de líder continuava pendurado nele */
  for(const id in G.times){
    const t=G.times[id];
    if(!t.igl)continue;
    if(!G.jogadores[t.igl])erros.push(`${G.ano}s${G.semana}: IGL do ${t.tag} não existe mais`);
    else if(!t.elenco.includes(t.igl))erros.push(`${G.ano}s${G.semana}: IGL do ${t.tag} não está no elenco`);
  }
  /* plano de treino coerente: sem fantasma, sem mapa fora de rotação */
  for(const id in G.times){
    const t=G.times[id];
    const pl=t.treino;
    if(!pl)continue;
    if(pl.mapa&&!m.mapaAtivo(pl.mapa))
      erros.push(`${G.ano}s${G.semana}: ${t.tag} treinando ${pl.mapa}, fora de rotação`);
    for(const pid in (pl.individual||{})){
      if(!G.jogadores[pid]){erros.push(`${G.ano}s${G.semana}: ${t.tag} com plano de treino de jogador que não existe`);continue;}
      if(!t.elenco.includes(pid))erros.push(`${G.ano}s${G.semana}: ${t.tag} com plano de treino de quem saiu`);
      const e=pl.individual[pid];
      if(e&&e.tipo==='atributo'&&e.alvo&&!m.ATTRS.some(a=>a[0]===e.alvo))
        erros.push(`${G.ano}s${G.semana}: ${t.tag} treinando atributo inexistente (${e.alvo})`);
    }
  }
  /* proposta órfã */
  for(const pr of (G.propostas||[])){
    if(!G.jogadores[pr.jogadorId])erros.push(`${G.ano}s${G.semana}: proposta por jogador que não existe`);
    if(!G.times[pr.clubeId])erros.push(`${G.ano}s${G.semana}: proposta de clube que não existe`);
  }
  /* stage encerrado tem ranking completo */
  for(const b of G.calendario)for(const s of b.stages){
    if(!s.feito||vistos.has(G.ano+s.id))continue;
    vistos.add(G.ano+s.id);
    if((s.ranking||[]).length!==s.times.length&&s.times.length)
      erros.push(`${G.ano}: ${s.id} encerrou com ranking de ${(s.ranking||[]).length} de ${s.times.length}`);
    if(new Set(s.ranking||[]).size!==(s.ranking||[]).length)
      erros.push(`${G.ano}: ${s.id} com time repetido no ranking`);
  }
}
console.log(erros.length?`FALHAS (${erros.length}):\n`+[...new Set(erros)].slice(0,25).map(e=>' · '+e).join('\n')
  :'OK — nenhuma inconsistência');
console.log(`semente ${semente} · terminou em ${m.G.ano} semana ${m.G.semana}`);
