/* ============================================================
   ROSTOS GERADOS
   ------------------------------------------------------------
   O pacote é finito e fixo: ~2000 retratos sintéticos separados
   em baldes por região, faixa etária e gênero. O jogo não gera
   nada — só escolhe, e escolhe sempre igual para a mesma pessoa,
   porque a escolha é hash(id) dentro do balde.

   Consequência a lembrar: mudar a CONTAGEM de um balde reembaralha
   todos os rostos daquele balde. O pacote se congela e só cresce
   por append; se precisar trocar imagem, troque o arquivo, não a
   posição.
   ============================================================ */
const Rostos={
  /* o manifesto entra por aqui em vez de ser lido direto da constante: assim dá
     para trocar de pacote sem recarregar a página, e para testar sem arquivo */
  manifesto:null,
  /* Separado de `manifesto` de propósito. Antes, usar(null) zerava o manifesto
     e iniciar() logo recarregava a constante global — ou seja, com um pacote
     de verdade em data/rostos.js não havia como desligar o pacote. Agora
     "ninguém carregou ainda" e "foi desligado de propósito" são estados
     diferentes. */
  carregado:false,
  iniciar(){
    if(!this.carregado){
      this.carregado=true;
      if(typeof ROSTOS!=='undefined'&&ROSTOS&&ROSTOS.baldes)this.manifesto=ROSTOS;
    }
    return this.manifesto;
  },
  usar(m){this.carregado=true;this.manifesto=m&&m.baldes?m:null;return this.manifesto;},
  /* volta ao estado de fábrica: relê data/rostos.js na próxima consulta */
  redefinir(){this.carregado=false;this.manifesto=null;return this;},
  pronto(){return !!(this.iniciar()&&this.manifesto.baldes);},
  /* FNV-1a: barato, bem distribuído e estável entre navegadores */
  hash(s){
    let h=0x811c9dc5;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    return h>>>0;
  },
  faixa(idade){return idade<28?'jovem':'veterano';},
  regiao(pessoa){
    if(pessoa.timeId&&G.times[pessoa.timeId])return G.times[pessoa.timeId].regiao;
    return pessoa.regiaoOrigem||REGIONS[0].id;
  },
  balde(pessoa){
    return this.regiao(pessoa)+'_'+this.faixa(pessoa.idade)+'_'+(pessoa.genero==='f'?'f':'m');
  },
  /* quem recebe rosto gerado depende da preferência: 'ficticios' é o padrão
     porque a base tem 447 nomes de jogadores reais */
  elegivel(pessoa){
    const modo=Prefs.get('rostosGerados');
    if(modo==='nenhum')return false;
    if(modo==='todos')return true;
    return !pessoa.real;
  },
  caminho(pessoa){
    if(!this.pronto()||!this.elegivel(pessoa))return null;
    let b=this.balde(pessoa);
    let n=this.manifesto.baldes[b];
    if(!n){                                   /* balde ausente: cai no genérico */
      b=(pessoa.genero==='f'?'f':'m')+'_'+this.faixa(pessoa.idade);
      n=this.manifesto.baldes[b];
      if(!n){b=Object.keys(this.manifesto.baldes)[0];n=this.manifesto.baldes[b];}
      if(!n)return null;
    }
    const i=this.hash(String(pessoa.id)+'|'+b)%n;
    return this.manifesto.dir+b+'/'+String(i).padStart(4,'0')+'.'+this.manifesto.ext;
  },
  quantos(){
    if(!this.pronto())return 0;
    return Object.values(this.manifesto.baldes).reduce((a,b)=>a+b,0);
  }
};
