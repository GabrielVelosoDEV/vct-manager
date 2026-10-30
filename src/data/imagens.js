/* ============================================================
   PACOTE DE IMAGENS — escudos e fotos enviados pelo Editor
   ------------------------------------------------------------
   Por que existe: rodando em file:// o navegador não escreve na
   pasta assets/, então "subir uma imagem" não pode significar
   gravar arquivo. O pacote resolve guardando as imagens num
   store próprio do IndexedDB, FORA da run — a decisão de
   arquitetura de não colocar imagem no save continua valendo
   (ver docs/ARQUITETURA.md): o save segue leve e o pacote pode
   ser trocado sem tocar na run.

   Chave: 'logo:<slug da tag>' e 'foto:<slug do nick>'. É a mesma
   convenção de assets/, então o pacote e a pasta são
   intercambiáveis, e renomear tag ou nick no Editor re-chaveia a
   imagem em vez de perdê-la.

   Toda imagem é reduzida para 256×256 PNG na entrada, o que
   mantém o pacote na casa de dezenas de KB por item. O cache em
   memória é síncrono de propósito: escudo() e retrato() montam
   HTML na hora e não podem esperar promessa.
   ============================================================ */
const IMGS_STORE='imgs';
const Imgs={
  cache:new Map(),
  modo:'memoria',
  lado:256,              /* imagens são normalizadas para lado×lado */
  limiteAviso:400*1024,  /* acima disso avisa antes de reduzir */

  /* cada tipo tem seu formato de normalização; escudo e arte são quadrados,
     retrato de agente é 4:5 porque é o enquadramento das artes oficiais */
  formatos:{logo:[256,256],foto:[256,256],arte:[256,256],agente:[256,320],staff:[256,320],
            marca:[320,160]},
  chaveTime(tag){return 'logo:'+ASSETS.slug(tag);},
  chaveJog(nick){return 'foto:'+ASSETS.slug(nick);},
  chaveTorneio(id){return 'arte:'+ASSETS.slug(id);},
  chaveAgente(nome){return 'agente:'+ASSETS.slug(nome);},
  chaveStaff(nome){return 'staff:'+ASSETS.slug(nome);},
  /* logo de patrocinador é deitado, não quadrado: marca é assinatura horizontal */
  chaveMarca(id){return 'marca:'+ASSETS.slug(id);},
  formatoDaChave(k){return this.formatos[String(k).split(':')[0]]||[this.lado,this.lado];},
  get(k){return this.cache.get(k)||null;},
  tem(k){return this.cache.has(k);},
  quantos(){return this.cache.size;},
  bytes(){let n=0;for(const v of this.cache.values())n+=v.length*0.75;return Math.round(n);},

  async iniciar(){
    try{
      if(Storage.modo==='indexeddb'&&Storage._db&&
         Storage._db.objectStoreNames.contains(IMGS_STORE)){
        this.modo='indexeddb';
        const itens=await Storage._store(IMGS_STORE,st=>st.getAll());
        (itens||[]).forEach(i=>{if(i&&i.k&&i.v)this.cache.set(i.k,i.v);});
      }else this.modo='memoria';
    }catch(e){this.modo='memoria';}
    return this.modo;
  },
  async gravar(k,uri){
    this.cache.set(k,uri);
    if(this.modo==='indexeddb'){
      try{await Storage._store(IMGS_STORE,st=>st.put({k,v:uri}),'readwrite');}
      catch(e){return false;}
    }
    return true;
  },
  async apagar(k){
    this.cache.delete(k);
    if(this.modo==='indexeddb'){
      try{await Storage._store(IMGS_STORE,st=>st.delete(k),'readwrite');}catch(e){}
    }
  },
  async renomear(de,para){
    if(de===para)return;
    const v=this.cache.get(de);
    if(!v)return;
    await this.gravar(para,v);
    await this.apagar(de);
  },
  async limpar(){
    const ks=[...this.cache.keys()];
    for(const k of ks)await this.apagar(k);
  },

  /* lê um File, encaixa em larg×alt preservando proporção e devolve data URI PNG */
  doArquivo(file,larg,alt){
    return new Promise((res,rej)=>{
      if(!file)return rej(new Error('Nenhum arquivo.'));
      if(!/^image\//.test(file.type||''))return rej(new Error(file.name+': não é imagem.'));
      const fr=new FileReader();
      fr.onload=()=>{
        const im=new Image();
        im.onload=()=>{
          try{
            const nx=larg||this.lado,ny=alt||larg||this.lado;
            const cv=document.createElement('canvas');
            cv.width=nx;cv.height=ny;
            const cx=cv.getContext('2d');
            const e=Math.min(nx/im.width,ny/im.height);
            const w=Math.round(im.width*e),h=Math.round(im.height*e);
            cx.drawImage(im,Math.round((nx-w)/2),Math.round((ny-h)/2),w,h);
            res(cv.toDataURL('image/png'));
          }catch(err){rej(err);}
        };
        im.onerror=()=>rej(new Error(file.name+': não deu para decodificar.'));
        im.src=fr.result;
      };
      fr.onerror=()=>rej(fr.error||new Error('Falha ao ler o arquivo.'));
      fr.readAsDataURL(file);
    });
  },

  /* deduz a chave pelo nome do arquivo: sen.png -> logo:sen se a tag existir.
     A ordem importa — tag, depois torneio, depois agente, depois jogador —
     porque um nome curto pode casar em mais de um lugar. */
  chavePorNome(nomeArquivo){
    const base=ASSETS.slug(String(nomeArquivo).replace(/\.[^.]+$/,''));
    if(!base)return null;
    const t=Object.values(G.times).find(x=>ASSETS.slug(x.tag)===base);
    if(t)return{k:this.chaveTime(t.tag),tipo:'logo',alvo:t.nome};
    if(G.torneios){
      const tor=Object.values(G.torneios).find(x=>ASSETS.slug(x.id)===base);
      if(tor)return{k:this.chaveTorneio(tor.id),tipo:'arte',alvo:tor.nome};
    }
    const ag=todosAgentes().find(a=>ASSETS.slug(a.nome)===base);
    if(ag)return{k:this.chaveAgente(ag.nome),tipo:'agente',alvo:ag.nome};
    if(G.staff){
      const st=Object.values(G.staff).find(x=>ASSETS.slug(x.nome)===base);
      if(st)return{k:this.chaveStaff(st.nome),tipo:'staff',alvo:st.nome};
    }
    const p=Object.values(G.jogadores).find(x=>ASSETS.slug(x.nome)===base);
    if(p)return{k:this.chaveJog(p.nome),tipo:'foto',alvo:p.nome};
    return null;
  },

  exportar(){
    return{tipo:'vct-manager-imagens',versao:1,lado:this.lado,
           itens:Object.fromEntries(this.cache)};
  },
  async importar(obj){
    if(!obj||obj.tipo!=='vct-manager-imagens'||!obj.itens)
      return{ok:false,erro:'Arquivo não parece um pacote de imagens.'};
    let n=0;
    for(const k in obj.itens){
      if(typeof obj.itens[k]==='string'&&obj.itens[k].startsWith('data:image/')){
        await this.gravar(k,obj.itens[k]);n++;
      }
    }
    return{ok:true,n};
  }
};
