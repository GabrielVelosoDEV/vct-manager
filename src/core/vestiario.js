/* ============================================================
   VESTIÁRIO — mental, desgaste e entrosamento
   ------------------------------------------------------------
   Em e-sports o que decide jogo é a cabeça, não a perna. Até aqui a
   fadiga tirava até 22% da condição do jogador e a moral inteira
   mexia 14% — a proporção de um esporte físico. Agora:

     forma     a fase técnica, sobe e desce com o desempenho    (igual)
     desgaste  o cansaço de jogo e viagem                       até 8%
     mental    confiança (nova) + moral                         até 22%

   CONFIANÇA (p.confianca, 0..1) é o estado de jogo: sobe com vitória
   e com jogar acima do próprio normal, cai com derrota — cada derrota
   de uma sequência pesa mais que a anterior — e as decisões (final,
   eliminação) mexem em dobro. O preparador mental amortece as quedas
   e acelera a volta; um IGL de liderança alta segura o time depois de
   uma derrota. A MORAL continua sendo o que era: satisfação com
   clube, contrato e minutos. O mental do jogador é a mistura das duas.

   ENTROSAMENTO deixa de ser um número só do clube e passa a ser de cada
   DUPLA de jogadores (t.duplas). O do time — t.sinergia, que o motor de
   partida lê — é a média das dez duplas entre os titulares, recalculada
   sempre que o cinco muda. Por isso trocar um titular derruba o
   entrosamento sem precisar de um "-8" escrito à mão: as quatro duplas
   do recém-chegado começam do zero que ele tem com cada um.

   Nada aqui consome o gerador do motor: são contas determinísticas.
   ============================================================ */

/* ---------- mental ---------- */
const CONF_INICIAL=0.6;
const CONF_PESO=0.6;                 /* mental = 60% confiança + 40% moral */
const CONF_VITORIA=0.03, CONF_DERROTA=0.04;
const CONF_DECISAO=2;                /* final e eliminação mexem em dobro */
const CONF_SEQUENCIA=0.15;           /* cada derrota seguida pesa +15%, até 4 */
/* Resultado sozinho não afunda ninguém abaixo disto: o fundo do poço existe,
   mas sem ele uma sequência ruim virava espiral (medido: sequências maiores
   em todo o circuito sem o piso). */
const CONF_PISO_RESULTADO=0.3;
const CONF_DESEMPENHO=0.06;          /* jogar 100% acima do normal = +0.06 */
const CONF_VOLTA=0.04;               /* por semana, de volta ao ponto de equilíbrio */

function confiancaDe(p){return typeof p.confianca==='number'?p.confianca:CONF_INICIAL;}
function mentalDe(p){return CONF_PESO*confiancaDe(p)+(1-CONF_PESO)*(p.moral==null?0.6:p.moral);}

/* Nível do preparador mental, neutro em NIVEL_NEUTRO (staff.js). */
function _nivelMental(t){
  const neutro=(typeof NIVEL_NEUTRO!=='undefined')?NIVEL_NEUTRO:3;
  return{n:(t&&t.staff&&t.staff.mental)||neutro,neutro};
}
/* Quanto de uma queda de confiança passa: preparador bom e IGL líder seguram. */
function amortecedor(t){
  const {n,neutro}=_nivelMental(t);
  const igl=t&&t.igl&&G.jogadores[t.igl];
  const lider=igl?igl.at.lider:60;
  return clamp((1-(n-neutro)*0.12)*(1-(lider-60)/400),0.55,1.3);
}
/* Uma série jogada: resultado do time, sequência e desempenho de cada um. */
function confiancaPosSerie(t,ganhou,decisiva,agg){
  t.seq=ganhou?Math.max(1,(t.seq>0?t.seq+1:1)):Math.min(-1,(t.seq<0?t.seq-1:-1));
  const derrotas=Math.max(0,-t.seq);
  const peso=decisiva?CONF_DECISAO:1;
  const amort=amortecedor(t);
  for(const id of t.titulares||[]){
    const p=G.jogadores[id];if(!p)continue;
    let d=ganhou?CONF_VITORIA*peso:-CONF_DERROTA*peso*(1+CONF_SEQUENCIA*Math.min(4,derrotas-1));
    /* desempenho contra o próprio normal: K/D da série sobre o da carreira */
    const s=agg&&agg[id];
    if(s&&s.maps){
      const kdSerie=s.d?s.k/s.d:Math.min(2,s.k||1);
      const c=p.carreira||{};
      const kdNormal=c.maps>=20&&c.d?c.k/c.d:1;
      d+=clamp((kdSerie/Math.max(0.4,kdNormal)-1)*CONF_DESEMPENHO,-0.05,0.05);
    }
    if(d<0){d*=amort;p.confianca=Math.max(Math.min(confiancaDe(p),CONF_PISO_RESULTADO),confiancaDe(p)+d);}
    else p.confianca=clamp(confiancaDe(p)+d,0.1,1);
  }
}
/* A semana: a confiança volta devagar para o ponto de equilíbrio, mais
   rápido com preparador bom; desgaste demais (burnout) derruba. */
function confiancaSemanal(t,p){
  const {n,neutro}=_nivelMental(t);
  const alvo=CONF_INICIAL+(n-neutro)*0.03;
  const c=confiancaDe(p);
  p.confianca=clamp(c+(alvo-c)*(CONF_VOLTA+(n-neutro)*0.01),0.1,1);
  if(p.fadiga>0.82)p.confianca=clamp(p.confianca-0.02,0.1,1);
}

/* ---------- entrosamento por dupla ---------- */
const DUPLA_POR_SERIE=0.7;           /* era o +0.7 do time por série */
const DUPLA_SCRIM=0.30;              /* por ponto de scrim acima de 3, por semana */
const DUPLA_VIRADA=4;                /* pré-temporada juntos */
const DUPLA_CONVIVENCIA=0.15, DUPLA_TETO_CONVIVENCIA=55;

function chaveDupla(a,b){return a<b?a+'|'+b:b+'|'+a;}
function _mesmaLingua(p,q){
  if(p.pais===q.pais)return true;
  const lusofono=['BR','PT'],hispano=['AR','CL','MX','ES','CO','PE','UY','VE','EC','BO','PY','GT','CR','DO','PR','SV','HN','NI','PA'];
  const anglo=['US','CA','GB','AU','NZ','IE'];
  return [lusofono,hispano,anglo].some(g=>g.includes(p.pais)&&g.includes(q.pais));
}
/* De onde uma dupla nova começa: perto da média do time, mais perto quando
   falam a mesma língua e quando as funções se completam. */
function duplaInicial(t,p,q,base){
  let v=(base==null?35:base);
  v+=_mesmaLingua(p,q)?5:-4;
  if(p.role===q.role&&p.role!=='Flex')v-=4;
  return clamp(v,0,100);
}
function duplas(t){if(!t.duplas)t.duplas={};return t.duplas;}
function dupla(t,a,b){
  const D=duplas(t),k=chaveDupla(a,b);
  if(D[k]==null){
    const p=G.jogadores[a],q=G.jogadores[b];
    D[k]=p&&q?duplaInicial(t,p,q,25):25;
  }
  return D[k];
}
function mexerDupla(t,a,b,d){
  if(a===b)return;
  const D=duplas(t),k=chaveDupla(a,b);
  D[k]=clamp(dupla(t,a,b)+d,0,100);
}
function paresDe(ids){
  const out=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)out.push([ids[i],ids[j]]);
  return out;
}
/* O entrosamento do time é o dos cinco que jogam. */
function sinergiaDe(t){
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const pr=paresDe(tit);
  if(!pr.length)return t.sinergia||50;
  return pr.reduce((s,[a,b])=>s+dupla(t,a,b),0)/pr.length;
}
function atualizarSinergia(t){
  if(!t||!t.titulares)return;
  t.sinergia=Math.round(sinergiaDe(t)*10)/10;
}
/* Save e base de antes das duplas: todo par do elenco nasce do número antigo
   do clube, com o ajuste de língua e função. A média dos titulares fica
   perto de onde estava. */
function semearDuplas(t){
  if(t.duplas&&Object.keys(t.duplas).length)return;
  t.duplas={};
  const base=typeof t.sinergia==='number'?t.sinergia:50;
  for(const [a,b] of paresDe(t.elenco||[])){
    const p=G.jogadores[a],q=G.jogadores[b];if(!p||!q)continue;
    t.duplas[chaveDupla(a,b)]=duplaInicial(t,p,q,base);
  }
  /* recentra: a média dos titulares volta ao número antigo, e as diferenças
     entre duplas ficam */
  const agora=sinergiaDe(t),dif=base-agora;
  for(const k in t.duplas)t.duplas[k]=clamp(t.duplas[k]+dif,0,100);
  atualizarSinergia(t);
}
/* Saiu do elenco: as duplas dele somem (voltar um dia começa de novo). */
function esquecerDuplas(t,id){
  const D=duplas(t);
  for(const k of Object.keys(D)){const [a,b]=k.split('|');if(a===id||b===id)delete D[k];}
}
/* Chegou ao elenco: duplas novas, abaixo da média do time. */
function chegarAoElenco(t,id){
  const p=G.jogadores[id];if(!p)return;
  const media=sinergiaDe(t);
  for(const o of t.elenco||[]){
    if(o===id)continue;const q=G.jogadores[o];if(!q)continue;
    duplas(t)[chaveDupla(id,o)]=duplaInicial(t,p,q,Math.min(media,40)-8);
  }
}

/* Série jogada: quem jogou junto se entende mais, vitória dura mais ainda,
   e sequência de derrota corrói. */
function entrosamentoPosSerie(t,ganhou,decisiva){
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const extra=ganhou&&decisiva?0.3:0;
  const corroi=!ganhou&&t.seq<=-3?0.5:0;
  for(const [a,b] of paresDe(tit))mexerDupla(t,a,b,DUPLA_POR_SERIE+extra-corroi);
  atualizarSinergia(t);
}
/* O que mexe no entrosamento numa semana, com o motivo — a mesma lista que a
   tela mostra. Cada item: {txt, delta, pares:[[a,b]...]}. */
function fatoresDaSemana(t){
  const out=[];
  const el=(t.elenco||[]).filter(id=>G.jogadores[id]);
  const tit=(t.titulares||[]).filter(id=>G.jogadores[id]);
  const scrim=((t.tatica&&t.tatica.scrim)||3)-3;
  if(scrim)out.push({txt:'Scrims '+(scrim>0?'intensos':'leves'),delta:scrim*DUPLA_SCRIM,pares:paresDe(el)});
  for(const id of el){
    const p=G.jogadores[id];
    if(p.moral<0.35)out.push({txt:p.nome+' está insatisfeito',delta:-0.3,pares:el.filter(o=>o!==id).map(o=>[id,o])});
  }
  for(const [a,b] of paresDe(tit)){
    const p=G.jogadores[a],q=G.jogadores[b];
    if(p.role===q.role&&p.role!=='Flex'&&p.roleAtual===q.roleAtual)
      out.push({txt:p.nome+' e '+q.nome+' disputam a mesma função',delta:-0.15,pares:[[a,b]]});
  }
  /* desigualdade: quem ganha menos de um quarto do mais bem pago entre os
     titulares sente — um item por jogador, não um por dupla */
  const teto=Math.max(1,...tit.map(id=>G.jogadores[id].salario||0));
  for(const id of tit){
    const p=G.jogadores[id];
    if((p.salario||0)*4<teto)out.push({txt:p.nome+' ganha muito menos que os colegas de time',delta:-0.1,
      pares:tit.filter(o=>o!==id&&(G.jogadores[o].salario||0)>=teto/2).map(o=>[id,o])});
  }
  if(t.seq<=-3)out.push({txt:Math.abs(t.seq)+' derrotas seguidas pesam no grupo',delta:-0.2,pares:paresDe(tit)});
  /* convivência: quem treina junto todo dia se entende um pouco mais, até um
     teto — dali para cima só jogo, scrim e atividade levam */
  const baixos=paresDe(el).filter(([a,b])=>dupla(t,a,b)<DUPLA_TETO_CONVIVENCIA);
  if(baixos.length)out.push({txt:'Convivência no dia a dia',delta:DUPLA_CONVIVENCIA,pares:baixos});
  return out;
}
function entrosamentoSemanal(t){
  if(!t.duplas)semearDuplas(t);
  /* duplas de quem já saiu (aposentadoria, empréstimo, Banco de dados) */
  const no=new Set(t.elenco||[]);
  for(const k of Object.keys(t.duplas)){const [a,b]=k.split('|');if(!no.has(a)||!no.has(b))delete t.duplas[k];}
  for(const f of fatoresDaSemana(t))for(const [a,b] of f.pares)mexerDupla(t,a,b,f.delta);
  if(t.id===G.meuTime)aplicarAtividade(t);
  atualizarSinergia(t);
  /* histórico curto para a tela mostrar a tendência */
  (t.sinHist=t.sinHist||[]).push(Math.round(t.sinergia));
  if(t.sinHist.length>12)t.sinHist.shift();
}
function entrosamentoVirada(t){
  for(const [a,b] of paresDe((t.elenco||[]).filter(id=>G.jogadores[id])))mexerDupla(t,a,b,DUPLA_VIRADA);
  atualizarSinergia(t);
}
/* Banco de dados: definir o entrosamento do time põe todas as duplas lá. */
function definirSinergia(t,v){
  t.duplas={};t.sinergia=clamp(v,0,100);semearDuplas(t);
}

/* ---------- atividades da semana (só o seu clube) ----------
   Uma por semana, escolhida na tela do Vestiário. Fica marcada até você
   trocar; o bootcamp tem intervalo mínimo e volta para "nenhuma". */
const ATIVIDADES=[
  {id:'nenhuma', nome:'Nenhuma', desc:'Semana normal: só o que treino, scrims e jogos já fazem.'},
  {id:'bootcamp',nome:'Bootcamp', desc:'Uma semana fora, todo mundo junto. O maior ganho de entrosamento, mas custa caixa e cansa.',
   custo:t=>t.tier===1?25000:8000, intervalo:8},
  {id:'ranked',  nome:'Ranked em duo', desc:'Dois jogadores escolhidos jogam ranqueada juntos a semana inteira. De graça, só para a dupla.'},
  {id:'stream',  nome:'Stream juntos', desc:'Conteúdo do time na live. Ganho pequeno de entrosamento e um pouco de torcida.'},
  {id:'jantar',  nome:'Jantar do time', desc:'Programa fora do jogo. Entrosamento e confiança sobem um pouco.',
   custo:()=>3000},
  {id:'sessao',  nome:'Sessão com o preparador mental', desc:'Trabalho de cabeça com o elenco. Recupera a confiança; rende mais com preparador bom.'},
  {id:'folga',   nome:'Folga coletiva', desc:'Todo mundo descansa. Tira desgaste e não mexe em entrosamento.'}
];
function atividade(id){return ATIVIDADES.find(a=>a.id===id)||ATIVIDADES[0];}
function semanaAbsVest(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
function atividadeDisponivel(t,id){
  const a=atividade(id);
  if(a.intervalo&&t.ultimoBootcamp&&semanaAbsVest()-t.ultimoBootcamp<a.intervalo)
    return{ok:false,erro:'O último bootcamp foi há '+(semanaAbsVest()-t.ultimoBootcamp)+' semana(s). Dá para repetir com '+a.intervalo+'.'};
  if(a.custo&&t.caixa<a.custo(t))return{ok:false,erro:'Caixa insuficiente: '+money(a.custo(t))+'.'};
  return{ok:true};
}
function escolherAtividade(t,id,par){
  const a=atividade(id);
  const d=atividadeDisponivel(t,a.id);if(!d.ok)return d;
  if(a.id==='ranked'){
    if(!par||par.length!==2||par[0]===par[1]||!par.every(x=>(t.elenco||[]).includes(x)))
      return{ok:false,erro:'Escolha dois jogadores do elenco.'};
    t.atividadePar=par.slice();
  }
  t.atividade=a.id;
  return{ok:true,msg:a.nome+' marcado para esta semana.'};
}
/* O que a atividade faria — a tela mostra antes de você escolher. */
function efeitoAtividade(t,id){
  const a=atividade(id),el=(t.elenco||[]).filter(x=>G.jogadores[x]);
  const {n,neutro}=_nivelMental(t);
  switch(a.id){
    case 'bootcamp':return{duplas:3,desgaste:0.06,custo:a.custo(t)};
    case 'ranked':  return{dupla:3};
    case 'stream':  return{duplas:0.8,torcida:0.2};
    case 'jantar':  return{duplas:1,confianca:0.02,custo:a.custo(t)};
    case 'sessao':  return{duplas:0.3,confianca:0.03+(n-neutro)*0.015};
    case 'folga':   return{desgaste:-0.15,confianca:0.01};
    default:return{};
  }
}
function aplicarAtividade(t){
  const a=atividade(t.atividade);
  if(a.id==='nenhuma')return;
  const ok=atividadeDisponivel(t,a.id);
  if(!ok.ok){t.atividade='nenhuma';return;}
  const e=Object.assign({},efeitoAtividade(t,a.id));
  /* o jogo de ritmo da atividade (core/minigames.js) dá a força da semana;
     sem sessão, o fator é 1 e nada muda */
  const f=typeof fatorAtividadeSemana==='function'?fatorAtividadeSemana(t):1;
  if(f!==1){
    for(const k of ['duplas','dupla','confianca','torcida'])if(e[k])e[k]*=f;
    if(e.desgaste&&e.desgaste<0)e.desgaste*=f;
  }
  const el=(t.elenco||[]).filter(x=>G.jogadores[x]);
  if(e.custo)t.caixa-=e.custo;
  if(e.duplas){
    const tit=new Set(t.titulares||[]);
    for(const [x,y] of paresDe(el))mexerDupla(t,x,y,tit.has(x)&&tit.has(y)?e.duplas:e.duplas/2);
  }
  if(e.dupla&&t.atividadePar)mexerDupla(t,t.atividadePar[0],t.atividadePar[1],e.dupla);
  for(const id of el){
    const p=G.jogadores[id];
    if(e.desgaste)p.fadiga=clamp(p.fadiga+e.desgaste,0,1);
    if(e.confianca)p.confianca=clamp(confiancaDe(p)+e.confianca,0.1,1);
  }
  if(e.torcida&&typeof t.torcida==='number')t.torcida=clamp(t.torcida+e.torcida,0,100);
  if(a.id==='bootcamp'){t.ultimoBootcamp=semanaAbsVest();t.atividade='nenhuma';}
  t.ultimaAtividade={id:a.id,ano:G.ano,semana:G.semana};
}
/* Vestiário vira notícia quando pesa: quarta derrota seguida, ou uma dupla
   de titulares que não se entende. Uma vez por temporada cada. */
function noticiasDoVestiario(t){
  if(t.id!==G.meuTime)return;
  t.vestAvisos=t.vestAvisos&&t.vestAvisos.ano===G.ano?t.vestAvisos:{ano:G.ano,seq:false,pares:{}};
  if(t.seq<=-4&&!t.vestAvisos.seq){
    t.vestAvisos.seq=true;
    noticia('😶 Clima pesado no '+t.nome+' depois da '+Math.abs(t.seq)+'ª derrota seguida. A confiança do elenco caiu.',{c:'clube',t:[t.id],imp:2});
  }
  for(const [a,b] of paresDe((t.titulares||[]).filter(id=>G.jogadores[id]))){
    const k=chaveDupla(a,b);
    if(dupla(t,a,b)<20&&!t.vestAvisos.pares[k]){
      t.vestAvisos.pares[k]=true;
      noticia('🧩 '+G.jogadores[a].nome+' e '+G.jogadores[b].nome+' ainda não se entendem em jogo. Ranked juntos ou um bootcamp ajudam.',
              {c:'clube',p:[a,b],t:[t.id]});
    }
  }
}
