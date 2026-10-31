/* ============================================================
   ARMAZENAMENTO — runs (partidas salvas)
   ------------------------------------------------------------
   Uma "run" = um mundo + uma temporada em andamento + histórico.
   Estratégia em camadas, da melhor para a mais simples:
     1. IndexedDB   (sem limite prático; exige http:// ou app empacotado)
     2. localStorage (~5 MB; funciona em file:// na maioria dos navegadores)
     3. memória      (só durante a sessão)
   Independente da camada, exportar/importar .json sempre funciona
   e é o formato canônico de backup, versionável no git em /runs.
   ============================================================ */
const RUNS_DB='vctmanager', RUNS_STORE='runs', RUNS_LS='vct_runs_v3';
/* versão 2 do banco: acrescenta o store 'imgs' do pacote de imagens.
   Bancos da versão 1 sobem sozinhos no onupgradeneeded, sem perder runs. */
const RUNS_DB_VERSAO=2;
const Storage={
  modo:'memoria', _db:null, _mem:{},

  async iniciar(){
    if(await this._tentarIDB())this.modo='indexeddb';
    else if(this._tentarLS())this.modo='localstorage';
    else this.modo='memoria';
    return this.modo;
  },
  _tentarIDB(){
    return new Promise(res=>{
      if(!self.indexedDB)return res(false);
      let req;try{req=indexedDB.open(RUNS_DB,RUNS_DB_VERSAO);}catch(e){return res(false);}
      req.onupgradeneeded=()=>{const db=req.result;
        if(!db.objectStoreNames.contains(RUNS_STORE))db.createObjectStore(RUNS_STORE,{keyPath:'id'});
        if(!db.objectStoreNames.contains(IMGS_STORE))db.createObjectStore(IMGS_STORE,{keyPath:'k'});};
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

  async listar(){
    let itens=[];
    if(this.modo==='indexeddb')itens=await this._idb(st=>st.getAll());
    else if(this.modo==='localstorage')itens=Object.values(this._lsTudo());
    else itens=Object.values(this._mem);
    return itens.map(r=>({id:r.id,nome:r.nome,ano:r.ano,clube:r.clube,fase:r.fase,atualizado:r.atualizado}))
      .sort((a,b)=>(b.atualizado||0)-(a.atualizado||0));
  },
  async gravar(reg){
    reg.atualizado=Date.now();
    if(this.modo==='indexeddb'){await this._idb(st=>st.put(reg),'readwrite');return true;}
    if(this.modo==='localstorage'){const o=this._lsTudo();o[reg.id]=reg;return this._lsGravar(o);}
    this._mem[reg.id]=reg;return true;
  },
  async ler(id){
    if(this.modo==='indexeddb')return await this._idb(st=>st.get(id));
    if(this.modo==='localstorage')return this._lsTudo()[id]||null;
    return this._mem[id]||null;
  },
  async apagar(id){
    if(this.modo==='indexeddb'){await this._idb(st=>st.delete(id),'readwrite');return;}
    if(this.modo==='localstorage'){const o=this._lsTudo();delete o[id];this._lsGravar(o);return;}
    delete this._mem[id];
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
          prePartida:true, tempoTecnico:true},
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
const RUN_VERSAO=10;
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
      if(typeof t.torcida!=='number'||!isFinite(t.torcida))t.torcida=torcidaInicial(t);
      if(!t.patrocinios){t.patrocinios={master:null,secundario:null,fornecedor:null};semPatroc++;}
      if(typeof atualizarComissao==='function')atualizarComissao(t);
    }

    /* História real só pode entrar uma vez: rodar de novo duplicaria títulos e
       torcida. O marcador pre:true é quem sabe se ela já entrou. */
    if(!G.historico.some(h=>h&&h.pre)&&typeof semearHistoria==='function')semearHistoria();
    if(semPatroc)atribuirPatrocinios();
    for(const id in G.times){
      const t=G.times[id];
      if(typeof t.patroc!=='number'||!isFinite(t.patroc))t.patroc=receitaAnual(t);
    }

    /* Saves anteriores à marcação de nome real não sabem quem é real, e sem
       isso a exportação de elencos sai vazia. Remarcar pelo nick cura. */
    if(typeof remarcarReais==='function')remarcarReais();
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
