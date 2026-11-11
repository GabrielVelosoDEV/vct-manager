/* ============================================================
   ARMAZENAMENTO — runs (partidas salvas)
   ------------------------------------------------------------
   Uma "run" = um mundo + uma temporada em andamento + histórico.
   Estratégia em camadas, da melhor para a mais simples:
     1. IndexedDB   (sem limite prático; exige http:// ou app empacotado)
     2. localStorage (~5 MB; funciona em file:// na maioria dos navegadores)
     3. memória      (só durante a sessão)
   Por cima de qualquer camada, a PASTA NO PC (Pasta, abaixo): quando o
   jogador escolhe uma, cada save e a base editada também viram arquivo
   .json nela, e o que está na pasta volta para o navegador ao abrir o
   jogo. Independente da camada, exportar/importar .json sempre funciona
   e é o formato canônico de backup, versionável no git em /runs.
   ============================================================ */
const RUNS_DB='vctmanager', RUNS_STORE='runs', RUNS_LS='vct_runs_v3';
/* versão 2 do banco: acrescenta o store 'imgs' do pacote de imagens; versão 3,
   o store 'cfg' (guarda a pasta escolhida). Bancos antigos sobem sozinhos no
   onupgradeneeded, sem perder runs. */
const RUNS_DB_VERSAO=3, CFG_STORE='cfg';
const Storage={
  modo:'memoria', _db:null, _mem:{},

  async iniciar(){
    if(await this._tentarIDB())this.modo='indexeddb';
    else if(this._tentarLS())this.modo='localstorage';
    else this.modo='memoria';
    await Pasta.iniciar();
    return this.modo;
  },
  _tentarIDB(){
    return new Promise(res=>{
      if(!self.indexedDB)return res(false);
      let req;try{req=indexedDB.open(RUNS_DB,RUNS_DB_VERSAO);}catch(e){return res(false);}
      req.onupgradeneeded=()=>{const db=req.result;
        if(!db.objectStoreNames.contains(RUNS_STORE))db.createObjectStore(RUNS_STORE,{keyPath:'id'});
        if(!db.objectStoreNames.contains(IMGS_STORE))db.createObjectStore(IMGS_STORE,{keyPath:'k'});
        if(!db.objectStoreNames.contains(CFG_STORE))db.createObjectStore(CFG_STORE,{keyPath:'k'});};
      req.onsuccess=()=>{this._db=req.result;res(true);};
      req.onerror=()=>res(false);
      setTimeout(()=>res(!!this._db),1500);
    });
  },
  _tentarLS(){try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true;}catch(e){return false;}},
  _store(loja,fn,modo){
    return new Promise((res,rej)=>{
      if(!this._db)return rej(new Error('IndexedDB indisponível.'));
      const tx=this._db.transaction(loja,modo||'readonly');
      const req=fn(tx.objectStore(loja));
      req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);
    });
  },
  _idb(fn,modo){return this._store(RUNS_STORE,fn,modo);},
  _lsTudo(){try{return JSON.parse(localStorage.getItem(RUNS_LS)||'{}');}catch(e){return{};}},
  _lsGravar(o){try{localStorage.setItem(RUNS_LS,JSON.stringify(o));return true;}catch(e){return false;}},

  /* A lista de partidas lia TODAS as carreiras inteiras (alguns MB cada) só
     para mostrar nome e data: com quatro ou cinco saves, apagar um e
     redesenhar a lista levava segundos. Agora existe um índice pequeno
     (id → nome, ano, clube, fase, data) no store de configurações, mantido a
     cada gravação e exclusão; as carreiras só são lidas inteiras para montar
     o índice na primeira vez. */
  _meta(r){return{id:r.id,nome:r.nome,ano:r.ano,clube:r.clube,fase:r.fase,atualizado:r.atualizado};},
  _indice:null,
  async _lerIndice(){
    if(this._indice)return this._indice;
    let ix=this.modo==='indexeddb'?await this.cfgLer('indice'):null;
    if(!ix||typeof ix!=='object'){
      ix={};
      for(const r of await this._todosLocal())if(r&&r.id&&r.id!==BASE_ID)ix[r.id]=this._meta(r);
      if(this.modo==='indexeddb')await this.cfgGravar('indice',ix);
    }
    this._indice=ix;return ix;
  },
  async _mexerIndice(id,meta){
    const ix=await this._lerIndice();
    if(meta)ix[id]=meta;else delete ix[id];
    if(this.modo==='indexeddb')await this.cfgGravar('indice',ix);
  },
  async listar(){
    const ix=await this._lerIndice();
    return Object.values(ix).sort((a,b)=>(b.atualizado||0)-(a.atualizado||0));
  },
  async _todosLocal(){
    if(this.modo==='indexeddb')return await this._idb(st=>st.getAll());
    if(this.modo==='localstorage')return Object.values(this._lsTudo());
    return Object.values(this._mem);
  },
  /* grava sem mexer no carimbo de hora: é o que a sincronização com a pasta usa */
  async _gravarLocal(reg){
    let ok=true;
    if(this.modo==='indexeddb')await this._idb(st=>st.put(reg),'readwrite');
    else if(this.modo==='localstorage'){const o=this._lsTudo();o[reg.id]=reg;ok=this._lsGravar(o);}
    else this._mem[reg.id]=reg;
    if(reg.id!==BASE_ID)await this._mexerIndice(reg.id,this._meta(reg));
    return ok;
  },
  async gravar(reg){
    /* partida apagada não volta: quem ainda a tiver em memória não regrava */
    if(reg&&reg.id&&(await this.apagados()).includes(reg.id))return false;
    reg.atualizado=Date.now();
    const ok=await this._gravarLocal(reg);
    await Pasta.gravar(reg);
    return ok;
  },
  /* Lápides: ids apagados. Sem isso a pasta (que pode estar sem permissão no
     momento) devolvia a partida na próxima sincronização. */
  async apagados(){return (this.modo==='indexeddb'?await this.cfgLer('apagados'):this._mem.__apagados)||[];},
  async _marcarApagado(id,sim){
    let l=await this.apagados();l=l.filter(x=>x!==id);if(sim)l.push(id);l=l.slice(-200);
    if(this.modo==='indexeddb')await this.cfgGravar('apagados',l);else this._mem.__apagados=l;
  },
  async ler(id){
    if(this.modo==='indexeddb')return await this._idb(st=>st.get(id));
    if(this.modo==='localstorage')return this._lsTudo()[id]||null;
    return this._mem[id]||null;
  },
  async apagar(id){
    await this._marcarApagado(id,true);
    await this._mexerIndice(id,null);
    if(this.modo==='indexeddb')await this._idb(st=>st.delete(id),'readwrite');
    else if(this.modo==='localstorage'){const o=this._lsTudo();delete o[id];this._lsGravar(o);}
    else delete this._mem[id];
    await Pasta.apagar(id);
  },
  /* importar de propósito um arquivo de uma partida apagada vale: tira a lápide */
  async importar(reg){await this._marcarApagado(reg.id,false);return this.gravar(reg);},
  /* configurações pequenas do app no IndexedDB (a pasta escolhida mora aqui:
     o "endereço" dela só pode ser guardado ali, não no localStorage) */
  async cfgLer(k){try{const r=await this._store(CFG_STORE,st=>st.get(k));return r?r.v:null;}catch(e){return null;}},
  async cfgGravar(k,v){try{await this._store(CFG_STORE,st=>st.put({k,v}),'readwrite');return true;}catch(e){return false;}},
  async cfgApagar(k){try{await this._store(CFG_STORE,st=>st.delete(k),'readwrite');}catch(e){}}
};

/* ============================================================
   PASTA NO PC — os saves como arquivos de verdade
   ------------------------------------------------------------
   O site é estático e não guarda nada de ninguém: tudo fica no
   computador de quem joga. Por padrão, no armazenamento do navegador;
   se o jogador escolher uma pasta (Chrome, Edge e Opera no computador),
   cada carreira vira um arquivo .vctrun.json nela e a base editada vira
   base-de-dados.vctbase.json. O navegador continua com uma cópia (é ela
   que o jogo lê, rápido); a pasta é a cópia que não some se alguém limpar
   os dados do navegador, e que dá para levar para o app de PC.

   Ao abrir o jogo, o que estiver mais novo de um lado vai para o outro.
   O navegador pede para confirmar o acesso à pasta de novo em algumas
   visitas: aí ela fica "pendente" até um clique em Permitir.
   ============================================================ */
const PASTA_NOME='VCT Manager';
const Pasta={
  handle:null, nome:'', caminho:'', estado:'nenhuma',   /* nenhuma · ligada · pendente · sem-suporte */
  /* No app de PC a pasta passa pela ponte do Electron (desktop/preload.js):
     arquivos de verdade em Documentos\VCT Manager, sem o pedido de permissão
     do navegador. No site, pela File System Access API do Chrome/Edge. */
  app(){return typeof self.vctPasta==='object'&&self.vctPasta;},
  suporta(){return !!this.app()||(typeof self.showDirectoryPicker==='function'&&!/Electron/i.test(navigator.userAgent||''));},
  noApp(){return /Electron/i.test(navigator.userAgent||'');},
  async iniciar(){
    if(this.app()){
      let e=null;try{e=await this.app().estado();}catch(x){}
      this.caminho=(e&&(e.caminho||e.padrao))||'';this.nome=this.caminho.split(/[\\/]/).pop()||PASTA_NOME;
      this.estado=e&&e.ligada?'ligada':'nenhuma';
      if(this.estado==='ligada')await this.sincronizar();
      return;
    }
    if(!this.suporta()){this.estado='sem-suporte';return;}
    const h=await Storage.cfgLer('pasta');
    if(!h||typeof h.queryPermission!=='function'){this.estado='nenhuma';return;}
    this.handle=h;this.nome=h.name;
    let p='prompt';try{p=await h.queryPermission({mode:'readwrite'});}catch(e){}
    if(p==='granted'){this.estado='ligada';await this.sincronizar();}
    else this.estado='pendente';
  },
  /* Escolhida pelo jogador (precisa vir de um clique). Se ele apontar para uma
     pasta qualquer (Documentos, por exemplo), o jogo cria "VCT Manager" dentro
     dela; se já for a pasta do jogo, usa ela mesma. */
  async escolher(trocar){
    if(this.app()){
      let r=null;try{r=await this.app().ligar(!!trocar);}catch(e){r={ok:false,erro:String(e&&e.message||e)};}
      if(!r||!r.ok)return{ok:false,cancelou:r&&r.cancelou,erro:(r&&r.erro)||'Não deu para usar essa pasta.'};
      this.caminho=r.caminho;this.nome=r.caminho.split(/[\\/]/).pop();this.estado='ligada';
      const n=await this.sincronizar();
      return{ok:true,caminho:r.caminho,...n};
    }
    if(!this.suporta())return{ok:false,erro:'Este navegador não permite salvar numa pasta.'};
    let raiz;
    try{raiz=await self.showDirectoryPicker({id:'vctmanager',mode:'readwrite',startIn:'documents'});}
    catch(e){return{ok:false,cancelou:e&&e.name==='AbortError',erro:'O navegador não liberou essa pasta. Tente outra (Documentos, por exemplo).'};}
    let h=raiz;
    try{
      let ehDoJogo=raiz.name===PASTA_NOME;
      if(!ehDoJogo)for await(const [n] of raiz.entries()){if(/\.vct(run|base)\.json$/.test(n)){ehDoJogo=true;break;}}
      if(!ehDoJogo)h=await raiz.getDirectoryHandle(PASTA_NOME,{create:true});
    }catch(e){return{ok:false,erro:'Não deu para criar a pasta "'+PASTA_NOME+'" aí. Escolha outro lugar.'};}
    this.handle=h;this.nome=h.name;this.estado='ligada';
    await Storage.cfgGravar('pasta',h);
    const n=await this.sincronizar();
    return{ok:true,caminho:(h===raiz?'':raiz.name+' › ')+h.name,...n};
  },
  async reconectar(){
    if(!this.handle)return false;
    let p='denied';try{p=await this.handle.requestPermission({mode:'readwrite'});}catch(e){}
    if(p!=='granted')return false;
    this.estado='ligada';await this.sincronizar();return true;
  },
  async desligar(){
    if(this.app()){try{await this.app().desligar();}catch(e){}this.estado='nenhuma';return;}
    await Storage.cfgApagar('pasta');this.handle=null;this.nome='';this.estado=this.suporta()?'nenhuma':'sem-suporte';},
  arquivo(id){return id===BASE_ID?'base-de-dados.vctbase.json':String(id).replace(/[^A-Za-z0-9_-]/g,'_')+'.vctrun.json';},
  async gravar(reg){
    if(this.estado!=='ligada'||!reg||!reg.id)return false;
    if(this.app()){try{return await this.app().gravar(this.arquivo(reg.id),JSON.stringify(reg));}catch(e){return false;}}
    try{
      const fh=await this.handle.getFileHandle(this.arquivo(reg.id),{create:true});
      const w=await fh.createWritable();await w.write(JSON.stringify(reg));await w.close();
      return true;
    }catch(e){
      /* perdeu a permissão no meio da sessão: o navegador continua salvando,
         e a pasta volta a receber quando o jogador permitir de novo */
      if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))this.estado='pendente';
      console.warn('Pasta de saves:',e&&e.message);return false;
    }
  },
  async apagar(id){
    if(this.estado!=='ligada')return;
    if(this.app()){try{await this.app().apagar(this.arquivo(id));}catch(e){}return;}
    try{await this.handle.removeEntry(this.arquivo(id));}catch(e){}
  },
  async lerTodos(){
    const out=[];
    if(this.app()){
      let l=[];try{l=await this.app().listar();}catch(e){}
      for(const f of l||[]){try{const r=JSON.parse(f.texto);if(r&&r.id)out.push(r);}catch(e){}}
      return out;
    }
    if(!this.handle)return out;
    for await(const [n,h] of this.handle.entries()){
      if(h.kind!=='file'||!/\.vct(run|base)\.json$/.test(n))continue;
      try{const f=await h.getFile();const r=JSON.parse(await f.text());if(r&&r.id)out.push(r);}catch(e){}
    }
    return out;
  },
  /* abre a pasta no Explorer (só no app; no site o navegador não deixa) */
  async abrirNoPC(){if(this.app()){try{return await this.app().abrir();}catch(e){}}return false;},
  /* o mais novo de cada lado ganha; devolve quantos vieram e quantos foram */
  async sincronizar(){
    if(this.estado!=='ligada')return{vieram:0,foram:0};
    let vieram=0,foram=0;
    try{
      const mortos=new Set(await Storage.apagados());
      const daPasta=(await this.lerTodos()).filter(r=>{if(mortos.has(r.id)){this.apagar(r.id);return false;}return true;});
      const naPasta=new Map(daPasta.map(r=>[r.id,r]));
      const locais=await Storage._todosLocal();
      const local=new Map(locais.map(r=>[r.id,r]));
      for(const r of daPasta){const l=local.get(r.id);if(!l||(r.atualizado||0)>(l.atualizado||0)){await Storage._gravarLocal(r);vieram++;}}
      for(const r of locais){const p=naPasta.get(r.id);if(!p||(r.atualizado||0)>(p.atualizado||0)){if(await this.gravar(r))foram++;}}
    }catch(e){console.warn('Pasta de saves:',e&&e.message);}
    return{vieram,foram};
  }
};

/* ---------- preferências do app ----------
   Ficam fora da run de propósito: são de quem joga, não da partida.
   Trocar de save não deve mudar como o jogo se comporta. */
const PREFS_LS='vct_prefs_v1';
const Prefs={
  padrao:{modalPartida:true,resumoRodada:true,autosave:true,animacoes:true,
          rostosGerados:'ficticios',
          aoVivo:true, velocidadeAoVivo:'1',
          prePartida:true, tempoTecnico:true, dicas:true, turnosNaJanela:true, animarTempo:true,
          minigames:true, somMini:true, palavroes:true},
  dados:null,
  iniciar(){
    this.dados=Object.assign({},this.padrao);
    try{Object.assign(this.dados,JSON.parse(localStorage.getItem(PREFS_LS)||'{}'));}catch(e){}
    return this.dados;
  },
  get(k){if(!this.dados)this.iniciar();return this.dados[k];},
  set(k,v){
    if(!this.dados)this.iniciar();
    this.dados[k]=v;
    try{localStorage.setItem(PREFS_LS,JSON.stringify(this.dados));return true;}catch(e){return false;}
  }
};

/* ---------- serialização da run ---------- */
const RUN_VERSAO=14;
function novaRunId(){return 'run_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*1e4).toString(36);}
function empacotarRun(nome){
  return{
    id:G.runId, versao:RUN_VERSAO, nome:nome||G.runNome||'Sem nome',
    ano:G.ano, clube:G.meuTime?G.times[G.meuTime].nome:'—',
    fase:G.calendario&&G.calendario[G.bloco]?G.calendario[G.bloco].nome:'',
    atualizado:Date.now(), semente:_s, estado:G
  };
}
/* ---------- migração de save ----------
   Toda vez que um sistema novo entra, ele acrescenta um campo que o save
   gravado antes dele não tem. Se ninguém preenche esse campo na carga, o motor
   recebe undefined onde espera número — foi exatamente assim que a torcida
   virou NaN e contaminou o caixa. A regra aqui é: preencher o que falta, nunca
   sobrescrever o que já existe.

   A migração sorteia (afinidade de mapa, torcida inicial). Fazer isso na
   sequência da própria run mudaria todo o futuro dela só por ter sido
   carregada. Então ela sorteia num desvio e devolve o fluxo onde estava. */
function migrarRun(reg){
  const de=reg.versao||0;
  const guarda=_s;
  srand(((reg.semente||1)^0x5f3a7c1d)>>>0);
  try{
    /* --- estado do mundo --- */
    if(!G.h2h)G.h2h={};
    if(!G.noticias)G.noticias=[];
    if(!G.historico)G.historico=[];
    if(G.manager===undefined)G.manager=null;
    if(!G.mapasAtivos||!G.mapasAtivos.length)G.mapasAtivos=poolInicial();
    /* save com os doze mapas ativos veio de antes da rotação */
    if(G.mapasAtivos.length>MAPAS_ATIVOS)G.mapasAtivos=poolInicial();
    if(!G.mapaDesde)G.mapaDesde={};
    /* meta de agentes e comps: save de antes do meta cai no meta real de 2026,
       que é o mesmo ponto de partida de uma run nova */
    if(!G.meta||!Object.keys(G.meta).length)
      G.meta=(typeof metaInicial==='function')?metaInicial():{};
    if(!G.patches)G.patches=[];
    if(!G.patchFeito)G.patchFeito={};
    for(const id in G.times)if(!G.times[id].comps)G.times[id].comps={};
    /* Summit entrou no pool de 2026: save antigo que tinha o pool de sete
       mapas recebe o pool real, senão ficaria com um mapa a menos para
       sempre e o veto não bateria com o formato de hoje */
    if((G.mapasAtivos||[]).length!==MAPAS_ATIVOS)G.mapasAtivos=poolInicial();
    /* plano de treino: nasce vazio e cai no seletor antigo das Táticas até o
       jogador escolher, para nada parar de evoluir num save que veio de antes */
    for(const id in G.times)if(!G.times[id].treino)G.times[id].treino={mapa:null,individual:{}};
    if(!G.propostas)G.propostas=[];
    if(!G.negociacoes)G.negociacoes=[];
    if(!G.transferencias)G.transferencias=[];
    /* Calendário antigo: os blocos não tinham semana. Sem `ini`/`fim`,
       blocoDaSemana() não acha bloco nenhum, o relógio passa o ano inteiro em
       "Intervalo" e a temporada some sem um único jogo — e sem erro, que é o
       pior jeito de quebrar. Remontar é a única saída: o calendário velho não
       guarda em que semana cada torneio acontecia, porque semana não existia.
       O que dá para preservar é ONDE o jogador estava: o bloco em andamento
       vira a semana em que aquele mesmo bloco começa no calendário novo. */
    const semSemana=!Array.isArray(G.calendario)||!G.calendario.length
                    ||G.calendario[0].ini===undefined;
    if(semSemana){
      const antigo=(G.calendario||[])[G.bloco||0];
      const chave=antigo&&antigo.endKey;
      montarCalendario();
      const alvo=chave&&G.calendario.find(b=>b.endKey===chave||String(b.endKey).startsWith(chave));
      G.semana=alvo?alvo.ini:1;
      G.bloco=alvo?G.calendario.indexOf(alvo):0;
      if(typeof noticia==='function')
        noticia('📅 O calendário virou semanas com data. A temporada foi remontada a partir de '+
                (alvo?alvo.nome:'a pré-temporada')+'.',{c:'outros'});
    }
    if(typeof G.semana!=='number'||!(G.semana>=1&&G.semana<=SEMANAS_ANO))G.semana=1;
    if(!G.torneios)montarTorneios();
    if(!G.agentes)montarAgentes();
    if(!Array.isArray(G.cidades)||!G.cidades.length)montarCidades();
    if(!G.sedes)G.sedes={};
    /* Torneio por evento, não por fase: os playoffs do Stage e do Split eram
       entradas próprias do catálogo e davam título com o nome da fase
       ("Playoffs Stage 1 · VCT Americas"). O catálogo é unificado, os stages
       da temporada em curso passam a apontar para o evento e os títulos já
       ganhos são renomeados. */
    if(unificarTorneios()||!G._titulosPorEvento){
      for(const b of G.calendario||[])for(const st of b.stages||[]){
        st.torneioId=torneioDeStage(st.id);
        if(st.tipo==='de'&&!st.rotulo&&/^(kick|po|cp|masters|champs)/.test(st.id))st.rotulo='Playoffs';
        if(/^(po|cp)\d_/.test(st.id))st.nome=String(st.nome).replace(/^Playoffs (Stage|Split) /,'$1 ').replace(/^Playoffs (Challengers)/,'Split '+st.id[2]+' · $1');
      }
      const renomear=txt=>String(txt).replace(/Playoffs (Stage|Split) (\d) · /g,'$1 $2 · ');
      for(const h of G.historico)if(h&&h.evento)h.evento=renomear(h.evento);
      for(const id in G.times){const t=G.times[id];if(Array.isArray(t.titulos))t.titulos=t.titulos.map(renomear);}
      G._titulosPorEvento=true;
    }
    if(typeof sedesDoAno==='function')sedesDoAno(G.ano);
    /* Títulos internacionais de carreira gravados antes das sedes ("2028 ·
       Masters I") ganham a cidade daquele ano, a mesma que o sorteio dá a ele
       agora — senão a galeria diria "Masters I" ao lado de um troféu de Osaka. */
    if(!G._titulosComSede&&typeof nomeComSede==='function'){
      const genericos={'Masters I':'masters1','Masters II':'masters2','Valorant Champions':'champions'};
      const comSede=(ano,ev)=>{const k=genericos[ev];return k&&ano>=2027?(nomeComSede(k,ano)||ev):ev;};
      for(const h of G.historico)if(h&&!h.pre&&h.evento)h.evento=comSede(h.ano,h.evento);
      for(const id in G.times){const t=G.times[id];if(Array.isArray(t.titulos))
        t.titulos=t.titulos.map(x=>{const i=x.indexOf(' · ');if(i<0)return x;const ano=parseInt(x);return x.slice(0,i+3)+comSede(ano,x.slice(i+3));});}
      G._titulosComSede=true;
    }
    if(!G.staff)migrarStaffAntigo();
    if(!G.marcas||!Object.keys(G.marcas).length)montarMarcas();

    /* --- jogadores --- */
    for(const id in G.jogadores){
      const p=G.jogadores[id];
      if(!p)continue;
      if(p.role2===undefined)p.role2=null;
      if(!p.roleAtual)p.roleAtual=p.role;
      if(!p.mapas)p.mapas=afinidadeInicial();
      if(!p.agenteNivel&&typeof semearAgentes==='function')semearAgentes(p);
      if(!p.mapas)p.mapas=afinidadeInicial();
      if(typeof p.pico!=='number'||!isFinite(p.pico))p.pico=over(p);
      if(typeof p.lesao!=='number')p.lesao=0;
    }

    /* --- clubes --- */
    let semPatroc=0;
    for(const id in G.times){
      const t=G.times[id];
      if(!t)continue;
      if(!Array.isArray(t.titulos))t.titulos=[];
      if(!t.tierInicial)t.tierInicial=t.tier;
      if(typeof t.legado!=='number')t.legado=0;
      if(typeof t.vices!=='number')t.vices=0;
      if(!t.pais&&!t.paisSede)t.paisSede=paisDoClube(t)||null;
      if(typeof t.torcida!=='number'||!isFinite(t.torcida))t.torcida=torcidaInicial(t);
      if(!t.patrocinios){t.patrocinios={master:null,secundario:null,fornecedor:null};semPatroc++;}
      if(typeof atualizarComissao==='function')atualizarComissao(t);
      /* entrosamento por dupla: nasce do número antigo do clube */
      if(typeof semearDuplas==='function'&&!t.duplas)semearDuplas(t);
      if(typeof t.seq!=='number')t.seq=0;
      /* departamentos novos da estrutura (core/estrutura.js) */
      if(typeof garantirEstrutura==='function')garantirEstrutura(t);
    }

    /* História real só pode entrar uma vez: rodar de novo duplicaria títulos e
       torcida. O marcador pre:true é quem sabe se ela já entrou. */
    if(!G.historico.some(h=>h&&h.pre)&&typeof semearHistoria==='function')semearHistoria();
    if(semPatroc)atribuirPatrocinios();
    for(const id in G.times){
      const t=G.times[id];
      if(typeof t.patroc!=='number'||!isFinite(t.patroc))t.patroc=receitaCaixa(t);
    }

    /* Saves anteriores à marcação de nome real não sabem quem é real, e sem
       isso a exportação de elencos sai vazia. Remarcar pelo nick cura. */
    if(typeof remarcarReais==='function')remarcarReais();
    /* v12: mains reais do VLR, piso de familiaridade e funções corrigidas */
    if(de<12&&typeof migrarMainsReais==='function')migrarMainsReais();
    /* v13: donos e compras de vaga durante a carreira */
    if(de<13&&typeof migrarOrganizacoes==='function')migrarOrganizacoes();
    /* v14: a janela anda dia a dia; o turno de dois dias vira o primeiro dia dele */
    if(de<14&&G.turno)G.turno=[0,2,4][G.turno]||0;
  }finally{ _s=guarda; }
  reg.versao=RUN_VERSAO;
  return de;
}

function desempacotarRun(reg){
  if(!reg||!reg.estado)return false;
  const antiga=reg.versao!==RUN_VERSAO;
  G=reg.estado;_s=reg.semente||1;
  G.runId=reg.id;G.runNome=reg.nome;
  migrarRun(reg);
  if(antiga)console.info('Save migrado para a versão',RUN_VERSAO+'.');
  return true;
}
async function salvarRun(nome){
  if(!G)return false;
  if(!G.runId)G.runId=novaRunId();
  if(nome)G.runNome=nome;
  const ok=await Storage.gravar(empacotarRun(G.runNome));
  return ok;
}
async function carregarRun(id){
  const reg=await Storage.ler(id);
  return desempacotarRun(reg);
}
function baixarRun(){
  const reg=empacotarRun(G.runNome);
  const blob=new Blob([JSON.stringify(reg,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=ASSETS.slug(reg.nome||'run')+'-'+reg.ano+'.vctrun.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function lerArquivoRun(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{try{res(JSON.parse(fr.result));}catch(e){rej(e);}};
    fr.onerror=()=>rej(fr.error);
    fr.readAsText(file);
  });
}
