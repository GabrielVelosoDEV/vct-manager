/* ============================================================
   CENÁRIOS DE DESAFIO
   ------------------------------------------------------------
   Começos prontos, como o modo desafio do FM: o clube começa numa
   situação difícil e você tem um objetivo com prazo. A carreira
   segue normal depois — o desafio é uma camada por cima, com o
   veredito na virada da temporada em que ele se decide.

   aplicar(t) roda uma vez, quando você assume o clube, e mexe só
   no clube escolhido (e no mercado, no caso da garotada). checar
   roda na virada: devolve 'vencido', 'perdido' ou null (segue).
   ============================================================ */
const DESAFIOS=[
  {id:'lanterna',nome:'Salve o lanterna',ic:'queda',
   resumo:'Um dos três clubes mais fracos da liga principal, com caixa curto, torcida revoltada e vestiário abatido.',
   objetivo:'Terminar a liga na metade de cima em até 2 temporadas.',anos:2,
   filtro:t=>t.tier===1&&_entreOsMaisFracos(t,3),
   aplicar:t=>{
     t.caixa=Math.round(t.caixa*0.35);
     const f=typeof fasDe==='function'?fasDe(t):null;if(f){f.humor=24;f.tecnico=36;}
     t.elenco.forEach(i=>{const p=G.jogadores[i];if(p)p.moral=clamp(p.moral-0.15,0.15,1);});
   },
   checar:(t,d)=>{const{pos,de}=posicaoNaLiga(t);
     if(pos<=Math.ceil(de/2))return{st:'vencido',txt:pos+'º de '+de};
     return{st:G.ano>=d.fim?'perdido':null,txt:pos+'º de '+de};}},
  {id:'challengers',nome:'Do Challengers ao Champions',ic:'sobe',
   resumo:'Um clube do Tier 2, sem holofote e com pouco dinheiro. O caminho passa pela Ascension.',
   objetivo:'Jogar o Champions em até 4 temporadas.',anos:4,
   filtro:t=>t.tier===2,
   aplicar:()=>{},
   checar:(t,d)=>{const ok=typeof _foiAoChampions==='function'&&_foiAoChampions(t);
     return{st:ok?'vencido':G.ano>=d.fim?'perdido':null,txt:ok?'no Champions':t.tier===1?'no Tier 1, fora do Champions':'ainda no Challengers'};}},
  {id:'falido',nome:'Clube falido',ic:'dinheiro2',
   resumo:'O clube começa devendo, em crise declarada: os rivais chegam com propostas baixas e os melhores pedem para sair.',
   objetivo:'Terminar a 2ª temporada com caixa positivo e a folha dentro do teto.',anos:2,
   filtro:()=>true,
   aplicar:t=>{
     t.caixa=-Math.round((typeof receitaAnual==='function'?receitaAnual(t):(t.patroc||800000))*0.35/5000)*5000;
     if(typeof declararCrise==='function')declararCrise(t,'dívidas');
   },
   checar:(t,d)=>{const f=typeof folgaSalarial==='function'?folgaSalarial(t):0;const ok=t.caixa>0&&f>0;
     if(G.ano<d.fim)return{st:null,txt:money(t.caixa)+' em caixa'};
     return{st:ok?'vencido':'perdido',txt:money(t.caixa)+' em caixa'+(f>0?'':' · folha acima do teto')};}},
  {id:'garotada',nome:'Aposta na garotada',ic:'broto',
   resumo:'O elenco inteiro vai para o mercado. No lugar, as melhores promessas sem clube, todas com até 21 anos.',
   objetivo:'Ganhar um título em até 4 temporadas.',anos:4,
   filtro:()=>true,
   aplicar:t=>{
     const sair=t.elenco.map(i=>G.jogadores[i]).filter(Boolean);
     sair.forEach(p=>{if(typeof liberar==='function')liberar(p);});
     const jovens=G.livres.map(i=>G.jogadores[i]).filter(p=>p&&p.idade<=21&&!sair.includes(p))
       .sort((a,b)=>((b.pot||0)+over(b)*0.5)-((a.pot||0)+over(a)*0.5));
     const escolhidos=[];
     for(const r of ROLES.filter(x=>x!=='Flex')){
       const p=jovens.find(x=>!escolhidos.includes(x)&&x.role===r);if(p)escolhidos.push(p);
     }
     for(const p of jovens){if(escolhidos.length>=6)break;if(!escolhidos.includes(p))escolhidos.push(p);}
     escolhidos.forEach(p=>contratar(p,t,3,salario(p,t)));
     if(typeof autoEscalar==='function')autoEscalar(t);
   },
   checar:(t,d)=>{const n=(t.titulos||[]).filter(x=>parseInt(x,10)>=d.inicio).length;
     return{st:n?'vencido':G.ano>=d.fim?'perdido':null,txt:n?n+' título(s)':'nenhum título ainda'};}},
  {id:'dinastia',nome:'Dinastia sob pressão',ic:'trofeu',
   resumo:'O clube mais forte da liga. A diretoria não aceita ano sem troféu, e a confiança começa baixa.',
   objetivo:'Ganhar pelo menos um título em cada uma das 3 temporadas.',anos:3,
   filtro:t=>t.tier===1&&_entreOsMaisFortes(t,1),
   aplicar:()=>{if(G.manager&&typeof souTreinador==='function'&&souTreinador())G.manager.confianca=45;},
   checar:(t,d)=>{const n=(t.titulos||[]).filter(x=>parseInt(x,10)===G.ano).length;
     if(!n)return{st:'perdido',txt:'temporada '+G.ano+' sem título'};
     return{st:G.ano>=d.fim?'vencido':null,txt:'título em '+G.ano};}}
];
function _ligaDoClube(t){return (G.regioes[t.regiao][t.tier===1?'t1':'t2']||[]).map(i=>G.times[i]).filter(Boolean);}
function _entreOsMaisFracos(t,n){return _ligaDoClube(t).sort((a,b)=>a.prestigio-b.prestigio).slice(0,n).includes(t);}
function _entreOsMaisFortes(t,n){return _ligaDoClube(t).sort((a,b)=>b.prestigio-a.prestigio).slice(0,n).includes(t);}
function desafioDef(id){return DESAFIOS.find(d=>d.id===id)||null;}

/* Chamado ao assumir o clube no início da carreira. */
function iniciarDesafio(id,t){
  const d=desafioDef(id);if(!d||!t)return null;
  d.aplicar(t);
  G.desafio={id,clubeId:t.id,inicio:G.ano,fim:G.ano+d.anos-1,status:'andamento',anos:[]};
  noticia('⚔ Desafio: '+d.nome+' — '+d.objetivo,{c:'carreira',t:[t.id],imp:3});
  return G.desafio;
}
/* A virada de temporada: o desafio se decide? */
function avaliarDesafio(){
  const x=G.desafio;
  if(!x||x.status!=='andamento')return null;
  const d=desafioDef(x.id),t=G.times[x.clubeId];
  if(!d||!t)return null;
  /* trocou de clube: o desafio era daquele clube */
  if(G.meuTime!==x.clubeId){x.status='perdido';x.txt='saiu do clube';return x;}
  const r=d.checar(t,x);
  x.anos.push({ano:G.ano,txt:r.txt});
  if(r.st){
    x.status=r.st;x.txt=r.txt;x.decidido=G.ano;
    if(r.st==='vencido')(G.conquistasCarreira=G.conquistasCarreira||[]).push({id:'desafio_'+x.id,nome:d.nome,ano:G.ano});
    noticia((r.st==='vencido'?'🏆 Desafio vencido: ':'✕ Desafio perdido: ')+d.nome+' ('+r.txt+'). A carreira continua.',
      {c:'carreira',t:[t.id],imp:3});
  }
  return x;
}
