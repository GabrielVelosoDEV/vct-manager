/* ============================================================
   VALORANT WORLD CUP — A COPA (C3)
   ------------------------------------------------------------
   No ano par, o ciclo da Copa (core/copa-ciclo.js) segue:

     semana 46  sorteio dos 8 grupos de 4, com 4 potes de 8 pelo
                ranking; a sede é cabeça do grupo A; o sorteio evita
                juntar seleções do mesmo continente no mesmo grupo
     semana 49  convocações congeladas; rodadas 1 e 2 dos grupos (MD3)
     semana 50  rodada 3; os 2 primeiros de cada grupo avançam
     semana 51  oitavas e quartas (MD5)
     semana 52  semifinais, disputa do bronze e a final (MD5)

   Na final fica o registro da edição em G.copa.edicoes: pódio,
   final, elencos do pódio, técnico campeão, MVP, time ideal e os
   números da Copa. Medalha para os 10 convocados de cada seleção
   do pódio (p.copa), título mundial no técnico.

   Depois, o ciclo é enxugado: os jogos de grupo perdem a linha dos
   jogadores (o placar por mapa fica) — vinte Copas não podem pesar
   no save o que pesam os jogos do ano.
   ============================================================ */
const COPA_SEM_SORTEIO=46, COPA_SEM_R12=49, COPA_SEM_R3=50, COPA_SEM_OITAVAS=51, COPA_SEM_FINAL=52;
const COPA_PESO_GRUPO=1.5, COPA_PESO_MATA=2, COPA_PESO_FINAL=2.5;
const COPA_FASES=[['oitavas','Oitavas de final'],['quartas','Quartas de final'],['semis','Semifinal'],['bronze','Disputa do bronze'],['final','Final']];

function _semanaCopa(cic){
  const sem=G.semana;
  /* save que chega ao ano da Copa sem as eliminatórias feitas: faz tudo agora */
  if(!cic.classificados&&sem>=COPA_SEM_SORTEIO){
    if(!cic.convidadas)sortearEliminatorias(cic);
    fecharEliminatorias(cic);
  }
  if(!cic.copa&&cic.classificados&&sem>=COPA_SEM_SORTEIO)sortearCopa(cic);
  if(!cic.copa||cic.copa.fim)return;
  if(sem>=COPA_SEM_R12){congelarConvocacoes(cic);jogarRodadaCopa(cic,1);jogarRodadaCopa(cic,2);}
  if(sem>=COPA_SEM_R3){jogarRodadaCopa(cic,3);fecharGruposCopa(cic);}
  if(sem>=COPA_SEM_OITAVAS){jogarFaseCopa(cic,'oitavas');jogarFaseCopa(cic,'quartas');}
  if(sem>=COPA_SEM_FINAL){jogarFaseCopa(cic,'semis');jogarFaseCopa(cic,'bronze');jogarFaseCopa(cic,'final');encerrarCopa(cic);}
}

/* ---------- semana 46: o sorteio ----------
   Pote 1: a sede e as 7 melhores; potes 2 a 4 pela ordem do ranking. Cada
   pote é sorteado grupo a grupo, A a H; a seleção vai para o primeiro grupo
   que ainda não tem ninguém do pote e não estoura o limite do continente
   (o mínimo possível: com 14 da EMEA em 32, dois por grupo). Se travar,
   o pote é sorteado de novo, até o limite ser relaxado. */
function sortearCopa(cic){
  const rk=garantirCopa().ranking, contDe=p=>(infoSelecao(p)||{}).cont;
  const lista=cic.classificados.filter(p=>p!==cic.sede).sort((a,b)=>(rk[b]||0)-(rk[a]||0)||a.localeCompare(b));
  const ordem=[cic.sede].concat(lista);
  const potes=[0,1,2,3].map(i=>ordem.slice(i*COPA_GRUPOS,(i+1)*COPA_GRUPOS)).filter(l=>l.length);
  const total={};for(const p of ordem){const c=contDe(p);total[c]=(total[c]||0)+1;}
  const limite=c=>Math.ceil((total[c]||0)/COPA_GRUPOS);
  const grupos=comSorteioLocal('sorteio-copa|'+(G.seed||0)+'|'+cic.ano,()=>{
    const embaralha=l=>{l=l.slice();for(let i=l.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[l[i],l[j]]=[l[j],l[i]];}return l;};
    const gs=Array.from({length:COPA_GRUPOS},()=>[]);
    potes.forEach((pote,ip)=>{
      for(let folga=0;folga<3;folga++){
        for(let tenta=0;tenta<40;tenta++){
          const ord=ip===0?[pote[0]].concat(embaralha(pote.slice(1))):embaralha(pote);
          const prova=gs.map(g=>g.slice());let deu=true;
          for(const p of ord){
            const c=contDe(p);
            const g=prova.find(g=>g.length===ip&&g.filter(x=>contDe(x)===c).length<limite(c)+folga);
            if(!g){deu=false;break;}
            g.push(p);
          }
          if(deu){prova.forEach((g,i)=>{gs[i]=g;});return;}
        }
      }
      /* sem jeito com o continente: pote na ordem */
      embaralha(pote).forEach(p=>{(gs.find(g=>g.length===ip)||gs[gs.length-1]).push(p);});
    });
    return gs;
  });
  cic.pontosCopa=Object.assign({},rk);
  cic.copa={grupos:grupos.map((paises,i)=>({letra:String.fromCharCode(65+i),paises,jogos:[],rodadas:0})),
    mata:{},convocados:null,fim:false};
  momentoCopa('sorteio',{ano:cic.ano});
  noticia(`🎲 Sorteio da World Cup ${cic.ano} em ${cic.nomeSede}: ${cic.copa.grupos.map(g=>g.letra+' ('+g.paises.map(p=>infoSelecao(p).sigla).join(', ')+')').join(' · ')}.`,
    {c:'competicoes',imp:Math.max(2,_impSelecao(cic.classificados))});
}

/* ---------- a convocação da Copa ----------
   Congelada no primeiro dia: quem foi chamado joga a Copa inteira. */
function congelarConvocacoes(cic){
  if(cic.copa.convocados)return;
  const out={};
  for(const p of cic.classificados){const c=convocacao(p);if(c)out[p]={titulares:c.titulares.slice(),reservas:c.reservas.slice()};}
  cic.copa.convocados=out;
  for(const pais in out)for(const id of out[pais].titulares.concat(out[pais].reservas)){
    const p=G.jogadores[id];if(!p)continue;
    const x=_copaDoJogador(p);if(!x.edicoes.includes(cic.ano))x.edicoes.push(cic.ano);
  }
  if(typeof aoConvocarCopa==='function')aoConvocarCopa(cic);
}
function _copaDoJogador(p){
  if(!p.copa)p.copa={edicoes:[],ouro:[],prata:[],bronze:[],mvp:[],timeIdeal:[]};
  return p.copa;
}
function _jogoCopa(cic,a,b,bo,fase,peso,sem){
  const cv=cic.copa.convocados||{};
  return jogarSerieSelecoes(a,b,{bo,nome:'World Cup '+cic.ano,fase,peso,semana:sem,conv:{[a]:cv[a],[b]:cv[b]}});
}

/* ---------- grupos ----------
   Ordem do pote: rodada 1 é 1×4 e 2×3; rodada 2, 1×3 e 4×2; rodada 3, 1×2 e 3×4. */
function _rodadaGrupoCopa(p,r){
  /* grupo de 3 (só se faltar seleção): uma folga por rodada */
  const l=p.length===3?(r===1?[[p[0],p[2]]]:r===2?[[p[1],p[2]]]:[[p[0],p[1]]])
    :r===1?[[p[0],p[3]],[p[1],p[2]]]:r===2?[[p[0],p[2]],[p[3],p[1]]]:[[p[0],p[1]],[p[2],p[3]]];
  return l.filter(([a,b])=>a&&b);
}
function jogarRodadaCopa(cic,r){
  const novos=[];
  for(const g of cic.copa.grupos){
    if((g.rodadas||0)>=r)continue;
    for(const [a,b] of _rodadaGrupoCopa(g.paises,r)){
      const f=_jogoCopa(cic,a,b,COPA_MD_GRUPOS,'Grupo '+g.letra+' · rodada '+r,COPA_PESO_GRUPO,r<3?COPA_SEM_R12:COPA_SEM_R3);
      f.rodada=r;g.jogos.push(f);novos.push(f);
    }
    g.rodadas=r;
  }
  if(novos.length){
    const placar=f=>`${infoSelecao(f.a).sigla} ${f.wa}–${f.wb} ${infoSelecao(f.b).sigla}`;
    noticia(`🌍 World Cup ${cic.ano}, rodada ${r} dos grupos: ${novos.map(placar).join(' · ')}.`,
      {c:'competicoes',imp:_impSelecao(novos.flatMap(f=>[f.a,f.b]))});
  }
}
function fecharGruposCopa(cic){
  if(cic.copa.mata.oitavas)return;
  for(const g of cic.copa.grupos){
    const t=tabelaGrupo(g,cic.pontosCopa);
    g.classificados=t.slice(0,COPA_AVANCAM).map(x=>x.pais);
  }
  const G1=l=>cic.copa.grupos.find(g=>g.letra===l).classificados;
  /* 1º de um grupo contra o 2º do vizinho; os dois lados da chave só se
     cruzam na final */
  const pares=[['A','B'],['C','D'],['E','F'],['G','H'],['B','A'],['D','C'],['F','E'],['H','G']];
  cic.copa.mata.oitavas=pares.map(([x,y])=>({a:G1(x)[0],b:G1(y)[1],orig:'1º '+x+' × 2º '+y}));
  const fora=cic.copa.grupos.flatMap(g=>g.paises.filter(p=>!g.classificados.includes(p)));
  noticia(`✅ Fase de grupos da World Cup ${cic.ano} encerrada. Nas oitavas: ${cic.copa.mata.oitavas.map(j=>infoSelecao(j.a).sigla+' × '+infoSelecao(j.b).sigla).join(', ')}. Caíram: ${fora.map(_nomeSel).join(', ')}.`,
    {c:'competicoes',imp:Math.max(2,_impSelecao(fora))});
}

/* ---------- mata-mata ---------- */
function _montarFase(cic,fase){
  const M=cic.copa.mata, v=j=>j.f.v, p=j=>j.f.v===j.a?j.b:j.a;
  const ant={quartas:'oitavas',semis:'quartas',bronze:'semis',final:'semis'}[fase];
  const l=M[ant];if(!l||l.some(j=>!j.f))return null;
  if(fase==='bronze')return[{a:p(l[0]),b:p(l[1])}];
  if(fase==='final')return[{a:v(l[0]),b:v(l[1])}];
  const out=[];for(let i=0;i<l.length;i+=2)out.push({a:v(l[i]),b:v(l[i+1])});
  return out;
}
function jogarFaseCopa(cic,fase){
  const M=cic.copa.mata;
  if(!M[fase])M[fase]=_montarFase(cic,fase);
  if(!M[fase]||M[fase].every(j=>j.f))return;
  const nome=COPA_FASES.find(x=>x[0]===fase)[1];
  const peso=fase==='final'?COPA_PESO_FINAL:fase==='bronze'?COPA_PESO_GRUPO:COPA_PESO_MATA;
  const sem=fase==='oitavas'||fase==='quartas'?COPA_SEM_OITAVAS:COPA_SEM_FINAL;
  for(const j of M[fase])if(!j.f)j.f=_jogoCopa(cic,j.a,j.b,COPA_MD_PLAYOFFS,nome,peso,sem);
  const placar=j=>`${infoSelecao(j.a).sigla} ${j.f.wa}–${j.f.wb} ${infoSelecao(j.b).sigla}`;
  if(fase!=='final')noticia(`🌍 World Cup ${cic.ano}, ${nome.toLowerCase()}: ${M[fase].map(placar).join(' · ')}.`,
    {c:'competicoes',imp:Math.max(2,_impSelecao(M[fase].flatMap(j=>[j.a,j.b])))});
}

/* ---------- os números da Copa ---------- */
function jogosDaCopa(cic){
  if(!cic||!cic.copa)return [];
  return cic.copa.grupos.flatMap(g=>g.jogos||[]).concat(...Object.values(cic.copa.mata).map(l=>l.map(j=>j.f).filter(f=>f&&f.det)));
}
function statsDaCopa(cic){return statsDeJogos(jogosDaCopa(cic));}
/* a soma de uma lista de fichas de seleção, por jogador */
function statsDeJogos(jogos){
  const S={};
  for(const f of jogos){
    for(const mp of (f.det&&f.det.mp)||[])for(const x of String(mp.st||'').split('|').filter(Boolean)){
      const [id,n]=x.split(':');const [k,d,a,acs]=n.split(',').map(Number);
      const s=S[id]=S[id]||{id,pais:f.esc&&f.esc.a.includes(id)?f.a:f.b,maps:0,k:0,d:0,a:0,acs:0,mvp:0,series:0};
      s.maps++;s.k+=k;s.d+=d;s.a+=a;s.acs+=acs;
    }
    for(const id of (f.esc?f.esc.a.concat(f.esc.b):[]))if(S[id])S[id].series++;
    if(f.det&&f.det.mvp&&S[f.det.mvp])S[f.det.mvp].mvp++;
  }
  for(const id in S){const s=S[id];s.acsM=s.maps?s.acs/s.maps:0;s.kd=s.d?s.k/s.d:s.k;}
  return S;
}
/* nota de Copa: rendimento, MVPs de série e até onde a seleção chegou */
function _notaCopa(s,podio){
  const lugar=podio.indexOf(s.pais);
  const bonus=lugar===0?30:lugar===1?18:lugar===2?10:lugar===3?5:0;
  return s.acsM+(s.kd-1)*45+s.mvp*6+bonus;
}

/* ---------- semana 52: o fim ---------- */
function encerrarCopa(cic){
  const C=cic.copa;if(C.fim||!C.mata.final||!C.mata.final[0].f||!C.mata.bronze||!C.mata.bronze[0].f)return;
  const fin=C.mata.final[0], br=C.mata.bronze[0];
  const campeao=fin.f.v, vice=campeao===fin.a?fin.b:fin.a, bronze=br.f.v, quarto=bronze===br.a?br.b:br.a;
  const podio=[campeao,vice,bronze,quarto];
  C.fim=true;C.podio=podio;
  /* medalhas e títulos */
  const medalha=['ouro','prata','bronze'];
  podio.slice(0,3).forEach((pais,i)=>{
    const cv=C.convocados[pais];if(!cv)return;
    for(const id of cv.titulares.concat(cv.reservas)){const p=G.jogadores[id];if(p)_copaDoJogador(p)[medalha[i]].push(cic.ano);}
  });
  const com=comissaoDaSelecao(campeao), tec=com.tecnico&&G.staff[com.tecnico];
  if(tec){tec.copa=tec.copa||{titulos:[]};tec.copa.titulos.push(cic.ano);}
  /* prêmios: MVP, time ideal (uma vaga por função, a quinta para o melhor que
     sobrar) e o técnico campeão */
  const S=statsDaCopa(cic);
  const cand=Object.values(S).filter(s=>s.maps>=6&&G.jogadores[s.id]).map(s=>Object.assign(s,{nota:_notaCopa(s,podio)})).sort((a,b)=>b.nota-a.nota);
  const mvp=cand[0]||null;
  const ideal=[];
  for(const fun of ['Duelista','Iniciador','Controlador','Sentinela']){
    const x=cand.find(s=>!ideal.includes(s)&&G.jogadores[s.id].role===fun);if(x)ideal.push(x);
  }
  for(const x of cand){if(ideal.length>=5)break;if(!ideal.includes(x))ideal.push(x);}
  if(mvp)_copaDoJogador(G.jogadores[mvp.id]).mvp.push(cic.ano);
  for(const x of ideal)_copaDoJogador(G.jogadores[x.id]).timeIdeal.push(cic.ano);
  const top=(campo,n)=>Object.values(S).filter(s=>s.maps>=4).sort((a,b)=>b[campo]-a[campo]).slice(0,n||5)
    .map(s=>({id:s.id,pais:s.pais,v:Math.round(s[campo]*100)/100}));
  /* o registro da edição: o que a galeria e o legado leem para sempre */
  const ed={ano:cic.ano,edicao:cic.edicao,sede:cic.sede,nomeSede:cic.nomeSede,
    cidade:(typeof cidadeDaCopa==='function'&&cidadeDaCopa(cic.sede)||{}).nome||null,
    campeao,vice,bronze,quarto,
    final:Object.assign({},fin.f),bronzeJogo:{a:br.a,b:br.b,wa:br.f.wa,wb:br.f.wb,v:br.f.v},
    elencos:Object.fromEntries(podio.map(p=>[p,C.convocados[p]])),
    tecnicos:Object.fromEntries(podio.map(p=>[p,(comissaoDaSelecao(p)||{}).tecnico||null])),
    mvp:mvp?mvp.id:null,timeIdeal:ideal.map(x=>x.id),tecnicoCampeao:tec?tec.id:null,
    nomes:{},   /* nomes de quem aparece, para a galeria sobreviver às aposentadorias */
    lideres:{kills:top('k'),acs:top('acsM'),kd:top('kd'),mvps:top('mvp',3)},
    caminho:_caminhoDoCampeao(cic,campeao)};
  for(const id of [].concat(...Object.values(ed.elencos).map(e=>e?e.titulares.concat(e.reservas):[]),ed.timeIdeal,ed.mvp?[ed.mvp]:[]))
    if(G.jogadores[id])ed.nomes[id]=G.jogadores[id].nome;
  for(const sid of Object.values(ed.tecnicos))if(sid&&G.staff[sid])ed.nomes[sid]=G.staff[sid].nome;
  const cg=garantirCopa();
  ed.rankingAntes=cg.rankingUltimaEdicao||null;
  cg.edicoes.push(ed);
  /* a régua da coluna "desde a última Copa": os pontos do dia do sorteio dela */
  cg.rankingUltimaEdicao=Object.assign({},cic.pontosCopa||cg.ranking);
  momentoCopa('campea',{ano:cic.ano});
  _enxugarCiclo(cic);
  const nmvp=mvp?G.jogadores[mvp.id].nome:null;
  noticia(`🏆 ${_nomeSel(campeao).toUpperCase()} É CAMPEÃ DA VALORANT WORLD CUP ${cic.ano}! Venceu ${_nomeSel(vice)} por ${fin.f.v===fin.a?fin.f.wa+'–'+fin.f.wb:fin.f.wb+'–'+fin.f.wa} na final em ${ed.cidade||cic.nomeSede}. ${_nomeSel(bronze)} fica com o bronze.${nmvp?' MVP da Copa: '+nmvp+'.':''}`,
    {c:'competicoes',imp:3,p:mvp?[mvp.id]:[]});
  if(typeof aoEncerrarCopa==='function')aoEncerrarCopa(cic,ed);
  return ed;
}
function _caminhoDoCampeao(cic,pais){
  const out=[];
  const g=cic.copa.grupos.find(x=>x.paises.includes(pais));
  if(g)for(const f of g.jogos)if(f.a===pais||f.b===pais)out.push({fase:'Grupo '+g.letra,adv:f.a===pais?f.b:f.a,pro:f.a===pais?f.wa:f.wb,contra:f.a===pais?f.wb:f.wa});
  for(const [k,nome] of COPA_FASES){
    const l=cic.copa.mata[k]||[];
    for(const j of l)if(j.f&&(j.a===pais||j.b===pais))out.push({fase:nome,adv:j.a===pais?j.b:j.a,pro:j.a===pais?j.f.wa:j.f.wb,contra:j.a===pais?j.f.wb:j.f.wa});
  }
  return out;
}
/* tira a linha dos jogadores dos jogos de grupo (Copa e eliminatórias):
   placar por mapa, veto e MVP ficam */
function _enxugarCiclo(cic){
  const seca=f=>{if(f&&f.det&&f.det.mp)for(const m of f.det.mp)m.st=null;};
  for(const g of cic.grupos||[])g.jogos.forEach(seca);
  for(const g of (cic.copa&&cic.copa.grupos)||[])g.jogos.forEach(seca);
}

/* ---------- arquivo ----------
   Ciclo de Copa que já passou (o ano da Copa ficou para trás) vira resumo:
   tabela de cada grupo, classificados e o placar de cada jogo do mata-mata.
   A ficha completa que importa para sempre — a da final — mora na edição. */
function arquivarCiclo(cic){
  if(!cic||cic.arquivado)return;
  const resumoGrupo=(g,pts)=>({letra:g.letra,cont:g.cont,paises:g.paises,classificados:g.classificados||[],
    tabela:tabelaGrupo(g,pts).map(x=>[x.pais,x.v,x.d,x.mp,x.mc,x.rp,x.rc])});
  const placar=f=>f?{a:f.a,b:f.b,wa:f.wa,wb:f.wb,v:f.v,mapa:f.mapa}:null;
  if(cic.grupos)cic.grupos=cic.grupos.map(g=>resumoGrupo(g,cic.pontosNoSorteio));
  if(cic.copa){
    cic.copa.grupos=cic.copa.grupos.map(g=>resumoGrupo(g,cic.pontosCopa));
    for(const k in cic.copa.mata)cic.copa.mata[k]=cic.copa.mata[k].map(j=>({a:j.a,b:j.b,orig:j.orig,f:placar(j.f)}));
    delete cic.copa.convocados;
  }
  delete cic.pontosNoSorteio;delete cic.pontosCopa;
  cic.arquivado=true;
}
/* a tabela de um grupo, de jogo ou de arquivo */
function linhasDoGrupo(g,pts){
  if(g.tabela)return g.tabela.map(([pais,v,d,mp,mc,rp,rc])=>({pais,j:v+d,v,d,mp,mc,rp,rc}));
  return tabelaGrupo(g,pts);
}

/* ---------- consultas ---------- */
function edicoesDaCopa(){return (garantirCopa()||{}).edicoes||[];}
function titulosMundiais(pais){return edicoesDaCopa().filter(e=>e.campeao===pais).length;}
