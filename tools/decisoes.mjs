#!/usr/bin/env node
/* Quanto cada decisão do jogador realmente vale.

   A pergunta é a que importa antes de acrescentar qualquer coisa nova: das
   alavancas que já existem, quais mexem no resultado e quais são botão de
   enfeite? Cada linha é medida com o MESMO confronto repetido centenas de
   vezes, mudando uma coisa só. Uso: node tools/decisoes.mjs [repetições] */
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ordem=[...readFileSync(resolve(raiz,'index.html'),'utf8')
  .matchAll(/<script src="([^"]+)"><\/script>/g)].map(p=>p[1])
  .filter(p=>!p.includes('/ui/')&&!p.includes('storage')&&!p.includes('assets')&&!p.endsWith('main.js'));
const tmp=resolve(raiz,'.dc.tmp.cjs');
writeFileSync(tmp,ordem.map(p=>readFileSync(resolve(raiz,p),'utf8')).join('\n')
  +'\nmodule.exports={criarMundo,montarCalendario,avancar,simPartida,over,autoEscalar,'
  +'forcaTime,MAP_POOL,CARGOS,blocoDaSemana,SEMANAS_ANO,TEMPORADA,'
  +'aplicarPreset,definirAgente,pesoComp,surpresaDaComp,agenteDe,nivelAgente,'
  +'forcaMeta,topoDoMeta,agentesDe,aplicarPatch,semearAgentes,viesLado,get G(){return G;}};');
const m=createRequire(import.meta.url)(tmp);unlinkSync(tmp);

const N=parseInt(process.argv[2]||'300',10);
m.criarMundo(20260828);m.montarCalendario();const G=m.G;

/* Dois clubes GÊMEOS, restaurados de uma FOTO antes de cada partida.

   A primeira versão disto media errado e deu 12,5% para gêmeos em vez de 50%:
   a partida machuca e cansa quem joga, e eu só restaurava o clube B. Em
   duzentas séries o A ia virando um time de lesionados contra um time sempre
   novo, e toda decisão media aparecia como prejuízo. Restaurar os DOIS lados
   da mesma foto é o que torna a comparação honesta. */
/* Os dois clubes têm de ter o MESMO tamanho de elenco. Com elencos de tamanho
   diferente, restaurar jogador por jogador (i % tamanho) dá cincos diferentes
   e autoEscalar escolhe outros titulares em cada lado: os gêmeos deixam de ser
   gêmeos e a referência sai de 50%. Medido: 54,3% para A antes deste conserto,
   com quatro pontos de viés em toda linha da tabela. */
const cands=Object.values(G.times).filter(t=>(t.elenco||[]).length>=5);
const porTamanho={};
for(const t of cands)(porTamanho[t.elenco.length]=porTamanho[t.elenco.length]||[]).push(t);
const par=Object.values(porTamanho).find(l=>l.length>=2)||cands;
const A=par[0], B=par[1];

function fotoDoTime(t){
  return{
    sinergia:t.sinergia, prestigio:t.prestigio, igl:t.igl,
    tatica:JSON.parse(JSON.stringify(t.tatica)),
    comps:JSON.parse(JSON.stringify(t.comps||{})),
    estrutura:{...t.estrutura}, staff:{...t.staff}, mapPref:{...t.mapPref},
    titulares:t.titulares.slice(),
    jogadores:t.elenco.map(id=>{
      const p=G.jogadores[id];
      return{id,at:{...p.at},role:p.role,role2:p.role2,roleAtual:p.roleAtual,
             idade:p.idade,forma:p.forma,moral:p.moral,fadiga:p.fadiga,
             lesao:p.lesao,mapas:{...p.mapas},pot:p.pot,
             agentes:(p.agentes||[]).slice(),agenteNivel:{...(p.agenteNivel||{})}};
    })
  };
}
/* Escreve a foto de `origem` no time `t`, jogador por jogador na mesma ordem. */
function restaurar(t,foto){
  t.sinergia=foto.sinergia;t.prestigio=foto.prestigio;
  t.tatica=JSON.parse(JSON.stringify(foto.tatica));
  t.comps=JSON.parse(JSON.stringify(foto.comps||{}));
  t.estrutura={...foto.estrutura};t.staff={...foto.staff};t.mapPref={...foto.mapPref};
  t.elenco.forEach((id,i)=>{
    const f=foto.jogadores[i%foto.jogadores.length], p=G.jogadores[id];
    if(!f||!p)return;
    Object.assign(p.at,f.at);
    p.role=f.role;p.role2=f.role2;p.roleAtual=f.roleAtual;p.idade=f.idade;
    p.forma=f.forma;p.moral=f.moral;p.fadiga=f.fadiga;p.lesao=0;
    p.mapas={...f.mapas};p.pot=f.pot;
    p.agentes=(f.agentes||[]).slice();p.agenteNivel={...(f.agenteNivel||{})};
  });
  /* Titulares por ÍNDICE, não por autoEscalar: o automático olha over e função
     e pode escolher cincos diferentes nos dois lados, desfazendo o pareamento
     que acabou de ser feito jogador por jogador. */
  t.titulares=foto.titulares.map((_,i)=>t.elenco[i]).filter(Boolean).slice(0,5);
  t.igl=t.titulares[0]||null;
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(p)p.igl=(id===t.igl);});
}
const FOTO=fotoDoTime(A);
const reset=()=>{restaurar(A,FOTO);restaurar(B,FOTO);};
reset();

/* `montar` roda DEPOIS do reset e aplica só a diferença que está sendo medida. */
function duelo(rep,montar){
  let vA=0;
  for(let i=0;i<rep;i++){
    reset();
    if(montar)montar();
    const r=m.simPartida(A.id,B.id,3,{stage:'x',nome:'medida'});
    if(r.vencedor===A.id)vA++;
  }
  reset();
  return vA/rep;
}
const base=duelo(N,null);
console.log(`gêmeos, sem diferença nenhuma: ${(base*100).toFixed(1)}% para A  (o 50% de referência)`);
console.log(`  conferência: elencos ${A.elenco.length}x${B.elenco.length}, `+
  `over titulares ${A.titulares.map(i=>m.over(G.jogadores[i])).join(',')} | `+
  `${B.titulares.map(i=>m.over(G.jogadores[i])).join(',')}\n`);

function medir(rot,aplicar){
  const p=duelo(N,aplicar);
  const ganho=(p-base)*100;
  const barra='█'.repeat(Math.max(0,Math.round(Math.abs(ganho)/1.5)));
  console.log(`  ${rot.padEnd(42)} ${(p*100).toFixed(1)}%  ${ganho>=0?'+':''}${ganho.toFixed(1)} ${barra}`);
  return ganho;
}

console.log('DECISÕES DE PARTIDA (o que você muda em Táticas)');
medir('agressividade 5 contra 3',()=>{A.tatica.agres=5;});
medir('agressividade 1 contra 3',()=>{A.tatica.agres=1;});
medir('foco execução contra default',()=>{A.tatica.foco='execucao';});
medir('foco retake contra default',()=>{A.tatica.foco='retake';});
medir('foco que CONTRA o deles (execução x default)',()=>{A.tatica.foco='execucao';B.tatica.foco='default';});
medir('foco que PERDE para o deles (execução x retake)',()=>{A.tatica.foco='execucao';B.tatica.foco='retake';});
medir('default lendo quem espera retake',()=>{A.tatica.foco='default';B.tatica.foco='retake';});
/* Agressividade agora depende do ELENCO: estas duas linhas põem o mesmo
   ajuste em cima de dois perfis opostos de time. */
const empurrar=(t,paraDuelo)=>{
  t.titulares.forEach(id=>{
    const p=G.jogadores[id];
    if(paraDuelo){p.at.mira=95;p.at.reflexo=95;p.at.mov=90;p.at.util=45;p.at.visao=45;}
    else{p.at.mira=50;p.at.reflexo=50;p.at.mov=50;p.at.util=95;p.at.visao=95;}
  });
};
medir('agressivo com elenco de duelo (os dois iguais)',()=>{
  empurrar(A,true);empurrar(B,true);A.tatica.agres=5;B.tatica.agres=3;});
medir('agressivo com elenco de utilidade (os dois iguais)',()=>{
  empurrar(A,false);empurrar(B,false);A.tatica.agres=5;B.tatica.agres=3;});
medir('cauteloso com elenco de utilidade',()=>{
  empurrar(A,false);empurrar(B,false);A.tatica.agres=1;B.tatica.agres=3;});

console.log('\nDECISÕES DE ELENCO');
medir('IGL: melhor líder contra o pior',()=>{
  const rs=A.titulares.map(i=>G.jogadores[i]);
  A.igl=rs.slice().sort((a,b)=>b.at.lider-a.at.lider)[0].id;
  const rsB=B.titulares.map(i=>G.jogadores[i]);
  B.igl=rsB.slice().sort((a,b)=>a.at.lider-b.at.lider)[0].id;
});
medir('entrosamento 100 contra 50',()=>{A.sinergia=100;B.sinergia=50;});
medir('moral cheia contra moral no chão',()=>{
  A.titulares.forEach(i=>{G.jogadores[i].moral=1;});
  B.titulares.forEach(i=>{G.jogadores[i].moral=0.15;});
});
medir('descansado contra exausto',()=>{
  A.titulares.forEach(i=>{G.jogadores[i].fadiga=0;});
  B.titulares.forEach(i=>{G.jogadores[i].fadiga=1;});
});
medir('na função certa contra fora de posição',()=>{
  B.titulares.forEach(i=>{const p=G.jogadores[i];
    p.roleAtual=p.role==='Duelista'?'Sentinela':'Duelista';});
});
medir('forma em alta contra forma em baixa',()=>{
  A.titulares.forEach(i=>{G.jogadores[i].forma=1;});
  B.titulares.forEach(i=>{G.jogadores[i].forma=0.2;});
});

console.log('\nDECISÕES DE COMP DE AGENTES');
/* O mapa é fixado nas medições de comp: comp é escolha POR MAPA, e deixar o
   veto escolher o mapa embaralharia a comp que está sendo medida. */
const MAPA_MEDIDA=(G.mapasAtivos||m.MAP_POOL)[0];
const compTodos=(t,preset)=>{for(const mp of (G.mapasAtivos||[]))m.aplicarPreset(t,mp,preset);};
medir('preset Meta contra o automático',()=>{compTodos(A,'meta');});
medir('preset Meta contra preset Conforto',()=>{compTodos(A,'meta');compTodos(B,'conforto');});
medir('preset Contra o meta, contra preset Meta',()=>{compTodos(A,'contra');compTodos(B,'meta');});
/* O preset Meta aponta o ALVO do treino: escalar antes de treinar custa, e é
   depois de treinar que ele paga. Estas duas linhas são o antes e o depois. */
const treinarAComp=(t)=>{
  for(const mp of (G.mapasAtivos||[]))
    for(const id of t.titulares){
      const p=G.jogadores[id];const ag=m.agenteDe(t,mp,p);
      if(ag){p.agenteNivel=p.agenteNivel||{};p.agenteNivel[ag]=90;}
    }
};
medir('comp Meta SEM treinar, contra Conforto',()=>{compTodos(A,'meta');compTodos(B,'conforto');});
medir('comp Meta JÁ treinada, contra Conforto',()=>{
  compTodos(A,'meta');treinarAComp(A);compTodos(B,'conforto');});
medir('comp de mains contra comp de bonecos que ninguém treinou',()=>{
  compTodos(A,'conforto');
  /* B entra com o boneco que cada titular sabe MENOS jogar */
  for(const mp of (G.mapasAtivos||[]))
    for(const id of B.titulares){
      const p=G.jogadores[id];
      const pool=(m.agentesDe(p.roleAtual||p.role)||[]);
      const pior=pool.slice().sort((x,y)=>m.nivelAgente(p,x)-m.nivelAgente(p,y))[0];
      if(pior)m.definirAgente(B,mp,id,pior);
    }
});
medir('comp sem controlador nenhum (buraco de comp)',()=>{
  compTodos(A,'meta');compTodos(B,'meta');
  for(const mp of (G.mapasAtivos||[]))
    for(const id of B.titulares){
      const p=G.jogadores[id];
      const duel=(m.agentesDe('Duelista')||[]);
      const ag=duel.find(a=>m.nivelAgente(p,a)>0)||duel[0];
      if(ag)m.definirAgente(B,mp,id,ag);
    }
});
console.log('\n  para calibrar: peso da comp em pontos de força');
{
  const linha=(rot,fn)=>{
    reset();fn();
    console.log('    '+rot.padEnd(34)+m.pesoComp(A,MAPA_MEDIDA).toFixed(2)+
      '  · surpresa '+m.surpresaDaComp(A,MAPA_MEDIDA).toFixed(2));
  };
  linha('automático (sem escolher nada)',()=>{A.comps={};});
  linha('preset Meta',()=>{compTodos(A,'meta');});
  linha('preset Conforto',()=>{compTodos(A,'conforto');});
  linha('preset Contra o meta',()=>{compTodos(A,'contra');});
  reset();
}
console.log('\n  viés de lado dos mapas do pool (pontos de força no ataque)');
(G.mapasAtivos||[]).forEach(mp=>
  console.log('    '+mp.padEnd(10)+(m.viesLado(mp,'atk')>=0?'+':'')+m.viesLado(mp,'atk').toFixed(2)));

console.log('\nDECISÕES DE ESTRUTURA E COMISSÃO');
medir('comissão nível 5 contra nível 1',()=>{
  m.CARGOS.forEach(c=>{A.staff[c.id]=5;B.staff[c.id]=1;});
});
/* Mexer em UM mapa não mede nada: o veto decide quais entram, e ele foge
   justamente do mapa ruim de cada lado. Para medir o sistema é preciso mexer
   no pool inteiro. */
medir('mapa (um mapa só — o veto desvia)',()=>{
  const mp=m.MAP_POOL[0];
  A.mapPref[mp]=8;B.mapPref[mp]=-8;
  A.titulares.forEach(i=>{G.jogadores[i].mapas[mp]=8;});
  B.titulares.forEach(i=>{G.jogadores[i].mapas[mp]=-8;});
});
/* O que o jogo produz de verdade não é um mapa forte, é um POOL DE CONFORTO de
   três: banindo dois, sobra um em que você mora. É esse o tamanho da decisão
   de treino de mapa — e é ele que precisa pagar, senão treinar mapa é enfeite.
   Os números que o mundo produz depois de uma temporada: melhor mapa por volta
   de +4, pior por volta de −1. */
/* A comparação tem de ser de MÉDIA IGUAL, senão está medindo quem tem mais
   afinidade e não quem distribuiu melhor. A primeira versão dava 44% para o
   especialista — e o motivo era bobo: num pool de sete, "os três primeiros
   contra o resto" dá três mapas bons para um lado e QUATRO para o outro. */
medir('especializar em 3 mapas contra ser parelho (média igual)',()=>{
  const pool=(G.mapasAtivos||m.MAP_POOL);
  const alto=4, baixo=-1;
  const media=(alto*3+baixo*(pool.length-3))/pool.length;
  pool.forEach((mp,i)=>{
    const dentro=i<3;
    A.mapPref[mp]=dentro?alto:baixo;B.mapPref[mp]=media;
    A.titulares.forEach(id=>{G.jogadores[id].mapas[mp]=dentro?alto:baixo;});
    B.titulares.forEach(id=>{G.jogadores[id].mapas[mp]=media;});
  });
});
medir('bom em TODO mapa contra ruim em todo mapa',()=>{
  for(const mp of m.MAP_POOL){
    A.mapPref[mp]=8;B.mapPref[mp]=-8;
    A.titulares.forEach(i=>{G.jogadores[i].mapas[mp]=8;});
    B.titulares.forEach(i=>{G.jogadores[i].mapas[mp]=-8;});
  }
});

console.log('\nPARA COMPARAR: o que NÃO é decisão sua');
medir('elenco 3 pontos de over melhor',()=>{
  A.titulares.forEach(i=>{const p=G.jogadores[i];for(const k in p.at)p.at[k]=Math.min(99,p.at[k]+3);});
});
medir('elenco 8 pontos de over melhor',()=>{
  A.titulares.forEach(i=>{const p=G.jogadores[i];for(const k in p.at)p.at[k]=Math.min(99,p.at[k]+8);});
});

/* ---------- tempo morto ---------- */
console.log('\nO CALENDÁRIO DO JOGADOR');
m.criarMundo(20260828);m.montarCalendario();
const meu=m.G.regioes.AMER.t1[0];m.G.meuTime=meu;
let comJogo=0,semJogo=0,semanasLivres=0,jogos=0;
for(let i=0;i<m.SEMANAS_ANO;i++){
  const r=m.avancar();
  const meus=(r.resultados||[]).filter(x=>x.res.aId===meu||x.res.bId===meu).length;
  jogos+=meus;
  if(meus)comJogo++;else semJogo++;
  if(m.blocoDaSemana(m.G.semana)==null)semanasLivres++;
}
console.log(`  semanas com jogo do seu clube: ${comJogo} de ${m.SEMANAS_ANO}  (${jogos} séries no ano)`);
console.log(`  semanas sem jogo nenhum seu:   ${semJogo}`);
console.log(`  semanas fora de qualquer torneio: ${semanasLivres}`);
console.log(`  blocos no calendário: ${m.TEMPORADA.length}`);
