/* ============================================================
   OPERAÇÕES DE BASE DO EDITOR
   ------------------------------------------------------------
   Tudo aqui é edição de banco de dados, não simulação: mover um
   jogador entre clubes aqui NÃO mexe em caixa, moral ou contrato,
   diferente de contratar() em core/market.js. Nada toca o DOM,
   então tools/verificar.mjs consegue exercitar estas funções.

   O Editor é permissivo de propósito: montar uma base passa por
   estados temporariamente inválidos (tirar cinco jogadores de um
   time antes de colocar outros cinco). Quem cobra a consistência
   é edValidar(), e é ela que libera o início da run.
   ============================================================ */

/* mantém titulares coerentes preservando a escalação manual */
function edRemendarEscalacao(t){
  if(!t)return;
  t.titulares=t.titulares.filter(id=>t.elenco.includes(id)&&G.jogadores[id]);
  if(t.titulares.length<5){
    t.elenco.filter(id=>!t.titulares.includes(id)&&G.jogadores[id])
      .sort((a,b)=>over(G.jogadores[b])-over(G.jogadores[a]))
      .forEach(id=>{if(t.titulares.length<5)t.titulares.push(id);});
  }
  if(t.titulares.length>5)t.titulares=t.titulares.slice(0,5);
  if(!t.titulares.includes(t.igl))t.igl=t.titulares[0]||null;
  t.elenco.forEach(id=>{const p=G.jogadores[id];if(p)p.igl=(id===t.igl);});
}

/* destino null = Sem clube (entra no mercado e pode ser contratado por qualquer time) */
function edMover(pid,destinoId){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const destino=destinoId?G.times[destinoId]:null;
  if(destinoId&&!destino)return{ok:false,erro:'Clube de destino não encontrado.'};
  if(destino&&destino.id===p.timeId)return{ok:true,msg:'Já está nesse clube.'};
  if(destino&&destino.elenco.length>=9)
    return{ok:false,erro:'Elenco do '+destino.tag+' está cheio (máximo 9).'};
  const origem=p.timeId?G.times[p.timeId]:null;
  if(origem){
    origem.elenco=origem.elenco.filter(x=>x!==pid);
    origem.titulares=origem.titulares.filter(x=>x!==pid);
    edRemendarEscalacao(origem);
  }
  G.livres=G.livres.filter(x=>x!==pid);
  if(destino){
    p.timeId=destino.id;
    if(!p.contrato)p.contrato=ri(2,3);
    destino.elenco.push(pid);
    edRemendarEscalacao(destino);
  }else{
    /* guarda a região para o filtro do Mercado continuar funcionando */
    if(origem)p.regiaoOrigem=origem.regiao;
    else if(!p.regiaoOrigem)p.regiaoOrigem=REGIONS[0].id;
    p.timeId=null;p.contrato=0;p.igl=false;
    G.livres.push(pid);
  }
  return{ok:true,msg:p.nome+(destino?' agora é do '+destino.tag:' está sem clube')+'.'};
}
function edLiberar(pid){return edMover(pid,null);}

function edApagar(pid){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const t=p.timeId?G.times[p.timeId]:null;
  if(t){
    t.elenco=t.elenco.filter(x=>x!==pid);
    t.titulares=t.titulares.filter(x=>x!==pid);
    edRemendarEscalacao(t);
  }
  G.livres=G.livres.filter(x=>x!==pid);
  /* Tudo o que aponta para ele sai junto — proposta, plano de treino, crachá
     de IGL. A limpeza é a mesma da aposentadoria, e mora em clock.js. */
  if(typeof esquecerJogador==='function')esquecerJogador(pid);
  delete G.jogadores[pid];
  return{ok:true,msg:p.nome+' apagado da base.'};
}

function edNomesUsados(){return new Set(Object.values(G.jogadores).map(p=>p.nome));}

/* cria jogador no clube informado, ou sem clube quando timeId é null */
function edCriarJogador(timeId,campos){
  campos=campos||{};
  const t=timeId?G.times[timeId]:null;
  if(timeId&&!t)return{ok:false,erro:'Clube não encontrado.'};
  if(t&&t.elenco.length>=9)return{ok:false,erro:'Elenco do '+t.tag+' está cheio (máximo 9).'};
  const R=t?REGIONS.find(r=>r.id===t.regiao):REGIONS[0];
  const base=t?Math.round(t.prestigio-4):56;
  const p=makePlayer(
    clamp(campos.over||base,30,99),
    ROLES.includes(campos.role)?campos.role:pick(ROLES),
    campos.pais||pick(R.paises),
    clamp(campos.idade||ri(typeof IDADE_NOVO_MIN!=='undefined'?IDADE_NOVO_MIN:15,
                          typeof IDADE_NOVO_MAX!=='undefined'?IDADE_NOVO_MAX:16),15,40),
    edNomesUsados());
  if(campos.nome)p.nome=campos.nome;
  if(campos.over)aplicarOver(p,clamp(campos.over,30,99));
  p.pot=clamp(campos.pot||p.pot,over(p),99);
  p.salario=salario(p);p.valor=valor(p);
  G.jogadores[p.id]=p;
  if(t){p.timeId=t.id;p.contrato=ri(2,3);t.elenco.push(p.id);edRemendarEscalacao(t);}
  else{p.timeId=null;p.contrato=0;p.regiaoOrigem=R.id;G.livres.push(p.id);}
  return{ok:true,id:p.id,msg:p.nome+' criado.'};
}

/* preenche o elenco com jogadores gerados até n (5 a 9) */
function edPreencherElenco(timeId,n){
  const t=G.times[timeId];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  n=clamp(n||5,5,9);
  let add=0;
  while(t.elenco.length<n){
    const falta=ROLES.find(r=>!t.elenco.some(i=>G.jogadores[i].role===r))||pick(ROLES);
    const r=edCriarJogador(timeId,{role:falta,over:Math.round(t.prestigio-6)});
    if(!r.ok)break;
    add++;
  }
  return{ok:true,msg:add?add+' jogador(es) gerado(s) no '+t.tag+'.':'Nada a preencher.'};
}

/* aplica um patch completo de jogador, com limites do modelo de dados */
const ED_FAIXA_AT=[25,99];
function edAplicarJogador(pid,c){
  const p=G.jogadores[pid];
  if(!p)return{ok:false,erro:'Jogador não encontrado.'};
  const antes=p.nome;
  if(typeof c.nome==='string'&&c.nome.trim())p.nome=c.nome.trim();
  if(ROLES.includes(c.role)&&c.role!==p.role){
    p.role=c.role;
    p.agentes=sortearAgentes(c.role);
    p.role2=null;   /* a secundária antiga pode não fazer sentido na nova função */
  }
  /* Secundária: '' limpa, 'auto' recalcula, e uma função só entra se o jogador
     tiver perfil para ela. Recusar é a regra que o Gabriel pediu — um jogador
     de mira ruim não vira Duelista nem por edição manual. */
  if(c.role2!=null){
    const r2=String(c.role2);
    if(!r2)p.role2=null;
    else if(r2==='auto')p.role2=melhorSecundaria(p);
    else if(!ROLES.includes(r2))return{ok:false,erro:'Função secundária inválida.'};
    else if(r2===p.role)p.role2=null;
    else if(custoDeFuncao(p,r2)>CUSTO_MAX_SECUNDARIA)
      return{ok:false,erro:p.nome+' perderia '+custoDeFuncao(p,r2)+
             ' pontos de over como '+r2+'. O limite é '+CUSTO_MAX_SECUNDARIA+'.'};
    else p.role2=r2;
  }
  if(c.idade!=null)p.idade=clamp(parseInt(c.idade)||p.idade,15,40);
  if(typeof c.pais==='string'&&c.pais.trim())p.pais=c.pais.trim().toUpperCase().slice(0,2);
  if(c.genero==='f'||c.genero==='m')p.genero=c.genero;
  if(c.real!=null)p.real=!!c.real;
  if(c.at)for(const[k]of ATTRS)
    if(c.at[k]!=null)p.at[k]=clamp(parseFloat(c.at[k]),ED_FAIXA_AT[0],ED_FAIXA_AT[1]);
  if(c.over!=null)aplicarOver(p,clamp(parseInt(c.over)||over(p),30,99));
  if(c.pot!=null)p.pot=clamp(parseInt(c.pot)||p.pot,over(p),99);
  else p.pot=Math.max(p.pot,over(p));
  ajustarSecundaria(p);   /* atributos ou over podem ter mudado o perfil */
  if(c.contrato!=null)p.contrato=clamp(parseInt(c.contrato)||0,0,6);
  if(c.salario!=null)p.salario=Math.max(0,Math.round(parseFloat(c.salario)||0));
  for(const k of ['moral','forma','fadiga'])
    if(c[k]!=null)p[k]=clamp(parseFloat(c[k]),0,1);
  if(c.lesao!=null)p.lesao=clamp(parseInt(c.lesao)||0,0,52);
  if(Array.isArray(c.agentes))p.agentes=c.agentes.filter(a=>typeof a==='string').slice(0,5);
  if(c.foto!=null)p.foto=String(c.foto).trim()||undefined;
  p.valor=valor(p);
  if(c.salario==null&&c.over!=null)p.salario=salario(p);
  if(p.timeId){
    const t=G.times[p.timeId];
    if(c.igl===true){t.igl=pid;t.elenco.forEach(i=>{G.jogadores[i].igl=(i===pid);});}
    edRemendarEscalacao(t);
  }
  return{ok:true,renomeado:antes!==p.nome?{de:antes,para:p.nome}:null};
}

/* aplica um patch completo de time */
function edAplicarTime(tid,c){
  const t=G.times[tid];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  const tagAntes=t.tag;
  if(typeof c.nome==='string'&&c.nome.trim())t.nome=c.nome.trim();
  if(typeof c.tag==='string'&&c.tag.trim()){
    const nova=c.tag.trim().slice(0,5);
    const usada=Object.values(G.times).find(x=>x.id!==tid&&x.tag.toLowerCase()===nova.toLowerCase());
    if(usada)return{ok:false,erro:'A tag '+nova+' já é do '+usada.nome+'.'};
    t.tag=nova;
  }
  /* País da sede. Vazio volta a derivar do elenco, que é o padrão. */
  if(c.pais!=null){
    const pais=String(c.pais).trim().toUpperCase().slice(0,2);
    t.pais=pais||null;
    t.torcida=torcidaInicial(t);
    t.patroc=patrocinioDe(t);
  }
  if(c.prestigio!=null){
    t.prestigio=clamp(parseInt(c.prestigio)||t.prestigio,20,99);
    if(c.patroc==null)t.patroc=patrocinioDe(t);
  }
  if(c.caixa!=null)t.caixa=Math.round(parseFloat(c.caixa)||0);
  if(c.patroc!=null)t.patroc=Math.max(0,Math.round(parseFloat(c.patroc)||0));
  if(c.sinergia!=null)t.sinergia=clamp(parseInt(c.sinergia)||t.sinergia,0,100);
  if(c.staff)for(const k of ['tecnico','analista','mental'])
    if(c.staff[k]!=null)t.staff[k]=clamp(parseInt(c.staff[k])||1,1,5);
  if(c.estrutura)for(const k of ['gh','treino','academia'])
    if(c.estrutura[k]!=null)t.estrutura[k]=clamp(parseInt(c.estrutura[k])||1,1,5);
  if(c.mapPref)for(const m in c.mapPref)
    if(MAP_POOL.includes(m))t.mapPref[m]=clamp(parseInt(c.mapPref[m])||0,-8,8);
  if(c.logo!=null)t.logo=String(c.logo).trim()||undefined;
  const trocou=(c.regiao&&c.regiao!==t.regiao)||(c.tier&&+c.tier!==t.tier);
  if(trocou)edMudarLiga(tid,c.regiao||t.regiao,+(c.tier||t.tier));
  return{ok:true,tagTrocada:tagAntes!==t.tag?{de:tagAntes,para:t.tag}:null};
}

/* troca o time de liga e/ou divisão, mantendo os índices de G.regioes */
function edMudarLiga(tid,regiaoId,tier){
  const t=G.times[tid];
  if(!t)return{ok:false,erro:'Clube não encontrado.'};
  if(!REGIONS.some(r=>r.id===regiaoId))return{ok:false,erro:'Região inválida.'};
  tier=tier===2?2:1;
  const antiga=G.regioes[t.regiao];
  antiga.t1=antiga.t1.filter(x=>x!==tid);
  antiga.t2=antiga.t2.filter(x=>x!==tid);
  if(antiga.pontos)delete antiga.pontos[tid];
  t.regiao=regiaoId;t.tier=tier;
  const nova=G.regioes[regiaoId];
  const lista=tier===1?nova.t1:nova.t2;
  if(!lista.includes(tid))lista.push(tid);
  if(tier===1&&nova.pontos)nova.pontos[tid]=nova.pontos[tid]||0;
  t.patroc=patrocinioDe(t);
  return{ok:true,msg:t.tag+' agora é '+(tier===1?nova.nome:nova.t2)+'.'};
}

/* ---------- validação da base ---------- */
/* devolve {erros,avisos}: erros travam o início da run, avisos não */
function edValidar(){
  const erros=[],avisos=[];
  const nomes={};
  for(const id in G.jogadores){
    const p=G.jogadores[id];
    nomes[p.nome]=(nomes[p.nome]||0)+1;
    if(p.timeId&&!G.times[p.timeId])
      erros.push('Jogador '+p.nome+' aponta para um clube que não existe.');
    if(p.timeId&&!G.times[p.timeId].elenco.includes(id))
      erros.push('Jogador '+p.nome+' diz ser do '+G.times[p.timeId].tag+', mas não está no elenco.');
    if(!p.timeId&&!G.livres.includes(id))
      erros.push('Jogador '+p.nome+' está sem clube e fora da lista de agentes livres.');
    if(p.pot<over(p))avisos.push(p.nome+' tem potencial abaixo do over atual.');
  }
  for(const n in nomes)if(nomes[n]>1)
    erros.push('Nick repetido na base: '+n+' ('+nomes[n]+' jogadores).');
  const tags={};
  for(const id in G.times){
    const t=G.times[id];
    tags[t.tag.toLowerCase()]=(tags[t.tag.toLowerCase()]||0)+1;
    if(t.elenco.length<5)erros.push(t.tag+' tem só '+t.elenco.length+' jogador(es); o mínimo é 5.');
    if(t.elenco.length>9)erros.push(t.tag+' tem '+t.elenco.length+' jogadores; o máximo é 9.');
    if(t.elenco.some(p=>!G.jogadores[p]))erros.push(t.tag+' referencia jogador que não existe.');
    if(t.elenco.length>=5&&t.titulares.length!==5)
      erros.push(t.tag+' tem '+t.titulares.length+' titulares; precisa de 5.');
    if(t.igl&&!t.elenco.includes(t.igl))erros.push(t.tag+' tem IGL fora do elenco.');
    const rs=t.titulares.map(i=>G.jogadores[i]).filter(Boolean);
    const faltando=['Duelista','Iniciador','Controlador','Sentinela']
      .filter(r=>!rs.some(p=>p.role===r||p.role==='Flex'));
    if(faltando.length)avisos.push(t.tag+' escala sem '+faltando.join(', ')+' — leva penalidade em partida.');
  }
  for(const k in tags)if(tags[k]>1)erros.push('Tag repetida: '+k.toUpperCase()+'.');
  for(const R of REGIONS){
    const r=G.regioes[R.id];
    if(r.t1.length!==12)erros.push(R.nome+' tem '+r.t1.length+' times na liga principal; o calendário espera 12.');
    if(r.t2.length!==8)erros.push(R.t2+' tem '+r.t2.length+' times; o calendário espera 8.');
  }
  if(G.staff){
    for(const id in G.times){
      const t=G.times[id];
      for(const c of CARGOS){
        const sid=t.comissao&&t.comissao[c.id];
        if(!sid){avisos.push(t.tag+' está sem '+c.nome.toLowerCase()+' — a vaga vale nível 1.');continue;}
        const m=G.staff[sid];
        if(!m)erros.push(t.tag+' aponta para um membro de comissão que não existe.');
        else if(m.timeId!==id)erros.push(m.nome+' está na comissão do '+t.tag+' mas diz ser de outro clube.');
      }
    }
    for(const sid in G.staff){
      const m=G.staff[sid];
      if(!m.timeId&&!(G.staffLivres||[]).includes(sid))
        erros.push(m.nome+' está sem clube e fora da lista de comissão livre.');
    }
  }
  const orfaos=G.livres.filter(id=>!G.jogadores[id]);
  if(orfaos.length)erros.push(G.livres.length&&orfaos.length+' agente(s) livre(s) aponta(m) para jogador inexistente.');
  if(!G.livres.length)avisos.push('Nenhum agente livre na base — a IA não tem de onde repor elenco no offseason.');
  return{erros,avisos,ok:!erros.length};
}

/* ---------- países de sede em massa ----------
   Uma linha por clube: TAG = PA. Existe porque preencher 80 clubes num campo
   de cada vez é o tipo de tarefa que ninguém faz duas vezes. */
function edAplicarPaises(texto){
  const linhas=String(texto||'').split(/\r?\n/);
  let ok=0; const erros=[];
  for(const bruta of linhas){
    const l=bruta.split('//')[0].trim();
    if(!l)continue;
    const m=l.match(/^(.+?)\s*[=|:]\s*([A-Za-z]{2})$/);
    if(!m){erros.push('não entendi: '+l);continue;}
    const tag=m[1].trim(), pais=m[2].toUpperCase();
    const t=Object.values(G.times).find(x=>x.tag.toLowerCase()===tag.toLowerCase());
    if(!t){erros.push('tag desconhecida: '+tag);continue;}
    if(typeof PAISES!=='undefined'&&PAISES&&!PAISES[pais]){erros.push(pais+' não é um país da lista ('+tag+')');continue;}
    t.pais=pais;
    t.torcida=torcidaInicial(t);
    t.patroc=receitaAnual(t);
    ok++;
  }
  return{ok:true,n:ok,erros};
}
function edListarPaises(){
  return Object.values(G.times)
    .sort((a,b)=>(a.tier-b.tier)||a.regiao.localeCompare(b.regiao)||a.tag.localeCompare(b.tag))
    .map(t=>t.tag+' = '+(t.pais||'??')+'   // '+t.nome+' · Tier '+t.tier+' · '+t.regiao)
    .join('\n');
}
