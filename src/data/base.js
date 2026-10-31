/* ============================================================
   BASE DE DADOS — o mundo de onde toda carreira nova nasce
   ------------------------------------------------------------
   Duas coisas diferentes, que antes eram uma só:

     · a BASE: mundo inicial fixo, guardado no navegador/app.
       Só muda pelo Banco de dados do MENU PRINCIPAL, e a mudança
       é permanente: vale para toda carreira criada dali em diante.
     · o SAVE: a carreira. O Banco de dados de DENTRO do jogo
       edita só ela; a base não fica sabendo.

   A base nasce dos arquivos de data/ (times, elencos, comissão...)
   com uma semente fixa, então o mundo "original" é sempre o mesmo,
   inclusive os reservas gerados. Ela fica guardada no mesmo
   armazenamento das runs, num registro reservado que a lista de
   partidas salvas não mostra.

   Carreira nova = cópia da base + semente nova para a simulação.
   O mundo é o mesmo; o que acontece nele é que muda de carreira
   para carreira.

   Quando os arquivos de data/ mudam (um elenco novo no repositório),
   a assinatura muda. Base que você nunca editou se refaz sozinha a
   partir dos dados novos; base editada é mantida e o Banco de dados
   avisa, oferecendo restaurar a original.
   ============================================================ */
const BASE_ID='__base__';
const BASE_SEMENTE=2027;
/* subir este número força a base original a ser refeita (mudança na
   geração do mundo que os arquivos de data/ não denunciam) */
const BASE_VERSAO=1;

/* impressão digital dos dados de partida: muda se qualquer arquivo de
   data/ que alimenta o mundo mudar */
function baseAssinatura(){
  const fontes=[
    typeof REGIONS!=='undefined'?REGIONS:null,
    typeof TIMES_REAIS!=='undefined'?TIMES_REAIS:null,
    typeof ELENCOS_REAIS!=='undefined'?ELENCOS_REAIS:null,
    typeof COMISSAO_REAL!=='undefined'?COMISSAO_REAL:null,
    typeof CLUBES_BASE!=='undefined'?CLUBES_BASE:null,
    typeof HISTORIA_REAL!=='undefined'?HISTORIA_REAL:null,
    typeof PATROCINADORES!=='undefined'?PATROCINADORES:null,
    typeof MAP_POOL!=='undefined'?MAP_POOL:null,
    typeof POOL_2026!=='undefined'?POOL_2026:null];
  const txt=JSON.stringify([BASE_VERSAO,typeof RUN_VERSAO!=='undefined'?RUN_VERSAO:0,fontes]);
  let h=5381;
  for(let i=0;i<txt.length;i++)h=((h<<5)+h+txt.charCodeAt(i))|0;
  return (h>>>0).toString(36)+'.'+txt.length.toString(36);
}

const Base={
  reg:null,          /* {id, versao, semente, assinatura, editada, estado, atualizado} */
  desatualizada:false, /* base editada, mas os arquivos de data/ mudaram depois */
  editando:false,    /* o G global é a base (Banco de dados do menu aberto) */
  _guardaG:null,_guardaS:1,_ultimoJson:'',_timer:null,

  async iniciar(){
    let r=null;
    try{r=await Storage.ler(BASE_ID);}catch(e){r=null;}
    const ass=baseAssinatura();
    if(r&&r.estado&&r.assinatura!==ass){
      if(!r.editada)r=null;          /* nunca editada: refaz dos dados novos */
      else this.desatualizada=true;  /* editada: mantém e avisa */
    }
    if(r&&r.estado){
      this.reg=r;
      /* mesma migração de um save: campo novo do motor entra preenchido */
      const guardaG=G,guardaS=_s;
      try{G=r.estado;migrarRun(r);}finally{G=guardaG;_s=guardaS;}
      r.id=BASE_ID;
    }else{
      this.gerarOriginal();
      await this.gravar();
    }
    this._ultimoJson=JSON.stringify(this.reg.estado);
    return this.reg;
  },

  /* monta a base original a partir de data/, sem mexer no G de quem chamou */
  gerarOriginal(){
    const guardaG=G,guardaS=_s;
    try{
      criarMundo(BASE_SEMENTE);montarCalendario();
      G.meuTime=null;delete G.runId;delete G.runNome;
      this.reg={id:BASE_ID,versao:RUN_VERSAO,semente:_s,assinatura:baseAssinatura(),
                editada:false,estado:G,atualizado:Date.now()};
    }finally{G=guardaG;_s=guardaS;}
    this.desatualizada=false;
    return this.reg;
  },

  async gravar(){
    if(!this.reg)return false;
    try{return !!(await Storage.gravar(this.reg));}catch(e){return false;}
  },

  /* quantos clubes / jogadores, para o menu */
  resumo(){
    const e=this.reg&&this.reg.estado;
    return e?{times:Object.keys(e.times).length,jogadores:Object.keys(e.jogadores).length}:{times:0,jogadores:0};
  },

  /* ---------- edição pelo menu ----------
     O Editor trabalha sobre o G global. Para editar a base, o G da carreira
     sai de cena enquanto o Banco de dados do menu está aberto, e volta assim
     que a tela é deixada. render() é quem chama as duas pontas. */
  abrirEdicao(){
    if(this.editando||!this.reg)return;
    this._guardaG=G;this._guardaS=_s;
    G=this.reg.estado;_s=this.reg.semente||BASE_SEMENTE;
    this.editando=true;
  },
  fecharEdicao(){
    if(!this.editando)return;
    this.salvarSeMudou();
    G=this._guardaG;_s=this._guardaS;
    this._guardaG=null;
    this.editando=false;
  },
  /* grava se o estado mudou desde a última gravação; marca como editada */
  salvarSeMudou(){
    if(!this.editando||!this.reg)return false;
    this.reg.semente=_s;
    const j=JSON.stringify(this.reg.estado);
    if(j===this._ultimoJson)return false;
    this._ultimoJson=j;
    this.reg.editada=true;
    this.gravar();
    return true;
  },
  /* chamada a cada repintura do Banco de dados do menu: junta várias
     edições seguidas numa gravação só */
  agendarGravacao(){
    clearTimeout(this._timer);
    this._timer=setTimeout(()=>this.salvarSeMudou(),400);
  },

  /* volta para a base de data/, descartando as edições */
  async restaurarOriginal(){
    this.gerarOriginal();
    this._ultimoJson=JSON.stringify(this.reg.estado);
    /* com o Banco de dados do menu aberto, o Editor passa a ver a base nova */
    if(this.editando){G=this.reg.estado;_s=this.reg.semente;}
    await this.gravar();
  },

  /* G novo para uma carreira: cópia funda da base e semente nova */
  novoMundo(semente){
    if(!this.reg)this.gerarOriginal();
    if(this.editando)this.salvarSeMudou();
    const s=(semente>>>0)||(Math.floor(Math.random()*900000)+1000);
    const estado=JSON.parse(JSON.stringify(this.reg.estado));
    estado.seed=s;estado.meuTime=null;
    G=estado;srand(s);
    return G;
  }
};
