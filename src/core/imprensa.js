/* ============================================================
   IMPRENSA — quem assina cada notícia do feed
   ------------------------------------------------------------
   Os veículos são reais (data/imprensa.js); os jornalistas de cada
   um são fictícios, gerados uma vez por carreira (G.imprensa), com
   nome do país do veículo e rosto do pacote sintético. As pessoas
   reais que você cadastra (PERSONALIDADES, ou só a foto em
   assets/imprensa) entram no mesmo elenco.

   Quem assina uma notícia sai de um hash do texto e da semana, não
   do rnd() do motor: o feed nunca muda o resultado da simulação, e a
   mesma notícia tem sempre o mesmo autor.

   Uma notícia vira post com: autor, veículo, engajamento e, nas
   grandes, reações de streamers e jornalistas.
   ============================================================ */
function hashImp(s){
  let h=0x811c9dc5;s=String(s);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
  return h>>>0;
}
/* sorteio estável: n-ésimo número de 0 a 1 a partir de uma semente */
function sorteImp(semente,n){return (hashImp(semente+'#'+(n||0))%100000)/100000;}
function escolhePeso(itens,peso,u){
  const tot=itens.reduce((s,x)=>s+Math.max(0,peso(x)),0);
  if(!tot)return itens[0]||null;
  let a=u*tot;
  for(const x of itens){a-=Math.max(0,peso(x));if(a<=0)return x;}
  return itens[itens.length-1];
}

/* ---------- nomes por língua (só para os jornalistas fictícios) ---------- */
const NOMES_IMPRENSA={
  pt:{m:['Lucas','Gabriel','Rafael','Bruno','Felipe','Thiago','Matheus','Pedro','Vinícius','Caio','Gustavo','Diego','Leonardo','André','Renan','Igor'],
      f:['Ana','Beatriz','Júlia','Mariana','Camila','Larissa','Fernanda','Carol','Bianca','Letícia','Natália','Isabela'],
      s:['Silva','Souza','Oliveira','Costa','Pereira','Almeida','Ribeiro','Carvalho','Rocha','Martins','Barbosa','Teixeira','Moura','Campos','Freitas','Lima']},
  es:{m:['Javier','Diego','Andrés','Mateo','Sebastián','Nicolás','Pablo','Martín','Alejandro','Tomás','Joaquín','Facundo'],
      f:['Valentina','Camila','Lucía','Sofía','María','Daniela','Paula','Agustina'],
      s:['García','Rodríguez','López','Martínez','Fernández','Gómez','Díaz','Torres','Ramírez','Castro','Vargas','Morales']},
  en:{m:['Jake','Ryan','Tyler','Kevin','Josh','Connor','Ethan','Liam','Nick','Brandon','Daniel','Sam','Owen','Adam'],
      f:['Emily','Sarah','Hannah','Olivia','Megan','Chloe','Grace','Rachel'],
      s:['Miller','Johnson','Walker','Hughes','Bennett','Carter','Reed','Cooper','Ward','Foster','Hayes','Brooks','Turner','Price']},
  fr:{m:['Lucas','Hugo','Théo','Maxime','Antoine','Julien','Romain','Nathan','Bastien'],f:['Léa','Chloé','Manon','Camille','Inès','Margaux'],
      s:['Martin','Bernard','Dubois','Moreau','Laurent','Lefèvre','Girard','Roux','Fontaine','Mercier']},
  de:{m:['Lukas','Jonas','Felix','Tim','Niklas','Jan','Moritz','Paul'],f:['Lena','Laura','Anna','Sophie','Marie'],
      s:['Müller','Schmidt','Fischer','Weber','Wagner','Becker','Hoffmann','Koch','Richter']},
  tr:{m:['Emre','Burak','Mert','Can','Kerem','Onur','Arda','Efe','Barış'],f:['Elif','Zeynep','Ece','Melis','Ayşe'],
      s:['Yılmaz','Kaya','Demir','Şahin','Çelik','Aydın','Öztürk','Arslan','Doğan']},
  uk:{m:['Oleksandr','Dmytro','Andriy','Maksym','Bohdan'],f:['Olena','Iryna','Kateryna'],s:['Kovalenko','Shevchenko','Bondarenko','Tkachenko','Melnyk']},
  ko:{m:['Min-jun','Seo-jun','Ji-hoon','Hyun-woo','Dong-hyun','Jae-won','Sung-min'],f:['Su-bin','Ji-woo','Ye-jin','Seo-yeon','Ha-eun'],
      s:['Kim','Lee','Park','Choi','Jung','Kang','Yoon','Jang','Han','Shin'],ordem:'sn'},
  ja:{m:['Haruto','Ren','Sota','Yuto','Kaito','Takumi','Daiki'],f:['Yui','Aoi','Hina','Sakura','Mio'],
      s:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato']},
  zh:{m:['Wei','Hao','Yu','Jie','Lei','Chen','Ming','Rui','Tao','Bo'],f:['Xin','Yi','Jing','Lin','Mei','Yan'],
      s:['Wang','Li','Zhang','Liu','Chen','Yang','Zhao','Huang','Zhou','Wu'],ordem:'sn'},
  in:{m:['Aditya','Rahul','Arjun','Rohan','Siddharth','Karan','Vikram'],f:['Priya','Ananya','Sneha','Kavya'],
      s:['Sharma','Patel','Gupta','Singh','Iyer','Nair','Mehta']},
  sea:{m:['Miguel','Paolo','Carlo','Joshua','Marco','Rizky','Arif','Nattapong','Minh'],f:['Bea','Nicole','Andrea','Putri','Linh'],
      s:['Santos','Reyes','Cruz','Bautista','Mendoza','Pratama','Nguyen','Tan','Lim']}
};
const LINGUA_NOME={pt:'português',es:'espanhol',en:'inglês',fr:'francês',de:'alemão',tr:'turco',uk:'ucraniano',ko:'coreano',ja:'japonês',zh:'chinês',in:'inglês',sea:'inglês'};
const REGIAO_DA_LINGUA={pt:'AMER',es:'AMER',en:'AMER',fr:'EMEA',de:'EMEA',tr:'EMEA',uk:'EMEA',ko:'PAC',ja:'PAC',zh:'CN',in:'PAC',sea:'PAC'};
/* o cargo puxa a categoria que a pessoa mais assina */
const CARGOS_IMPRENSA=[
  {id:'reporter',nome:'Repórter',foco:['competicoes','clube']},
  {id:'insider', nome:'Insider de mercado',foco:['mercado','carreira']},
  {id:'analista',nome:'Analista',foco:['meta','competicoes']},
  {id:'editor',  nome:'Editor',foco:['competicoes','mercado','clube']},
  {id:'bastidor',nome:'Repórter de bastidores',foco:['clube','carreira']}
];

function veiculo(id){return (typeof VEICULOS!=='undefined'?VEICULOS:[]).find(v=>v.id===id)||null;}
function slugImp(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();}
function arrobaDeNome(nome){return slugImp(nome).replace(/-/g,'_').slice(0,15);}

/* ---------- elenco fictício: uma vez por carreira ---------- */
function garantirImprensa(){
  if(!G)return null;
  const vs=typeof VEICULOS!=='undefined'?VEICULOS:[];
  if(G.imprensa&&G.imprensa.v===1){
    /* veículo novo no arquivo de dados ganha equipe sem refazer a dos outros */
    for(const v of vs)if(!G.imprensa.jor.some(j=>j.veiculo===v.id))G.imprensa.jor.push(...equipeDoVeiculo(v,G.imprensa.jor));
    return G.imprensa;
  }
  const jor=[];
  for(const v of vs)jor.push(...equipeDoVeiculo(v,jor));
  G.imprensa={v:1,jor,seguindo:(G.imprensa&&G.imprensa.seguindo)||[]};
  return G.imprensa;
}
function equipeDoVeiculo(v,ja){
  const L=NOMES_IMPRENSA[v.lingua]||NOMES_IMPRENSA.en;
  const usados=new Set(ja.map(j=>j.nome));
  const sem=(G.runId||G.ano||0)+'|'+v.id;
  const out=[];
  for(let i=0;i<(v.equipe||1);i++){
    const f=sorteImp(sem,i*7+1)<0.28;
    let nome='';
    for(let k=0;k<20;k++){
      const pn=(f?L.f:L.m)[Math.floor(sorteImp(sem,i*7+2+k*31)*(f?L.f:L.m).length)];
      const sn=L.s[Math.floor(sorteImp(sem,i*7+3+k*31)*L.s.length)];
      nome=L.ordem==='sn'?sn+' '+pn:pn+' '+sn;
      if(!usados.has(nome))break;
    }
    usados.add(nome);
    /* o primeiro de cada veículo é editor; os outros variam */
    const cargo=i===0?'editor':CARGOS_IMPRENSA[1+Math.floor(sorteImp(sem,i*7+4)*(CARGOS_IMPRENSA.length-1))].id;
    out.push({id:'j-'+v.id+'-'+i,nome,genero:f?'f':'m',idade:24+Math.floor(sorteImp(sem,i*7+5)*24),
      veiculo:v.id,cargo,regiaoOrigem:v.regiao==='GLOBAL'?REGIAO_DA_LINGUA[v.lingua]||'AMER':v.regiao,
      arroba:arrobaDeNome(nome)+(sorteImp(sem,i*7+6)<0.4?String(Math.floor(sorteImp(sem,i*7+8)*90)+10):'')});
  }
  return out;
}

/* ---------- pessoas reais: cadastro + fotos soltas em assets/imprensa ---------- */
function personalidades(){
  const M=typeof MIDIA!=='undefined'&&MIDIA.arquivos?MIDIA.arquivos:{};
  const cad=(typeof PERSONALIDADES!=='undefined'?PERSONALIDADES:[]).filter(p=>p&&p.nome);
  const lista=cad.map(p=>({...p,slug:slugImp(p.nome)}));
  const tem=new Set(lista.map(p=>p.slug));
  for(const k in M){
    if(!k.startsWith('imprensa/'))continue;
    const s=k.slice(9);
    if(tem.has(s))continue;
    /* sem cadastro: o nome sai do arquivo ("gabriel-toledo" → "Gabriel Toledo") */
    lista.push({nome:s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),tipo:'jornalista',pais:'BR',slug:s,auto:true});
  }
  return lista.map(p=>({id:'r-'+p.slug,nome:p.nome,real:true,tipo:p.tipo||'jornalista',veiculo:p.veiculo||null,
    pais:p.pais||'BR',arroba:p.arroba||arrobaDeNome(p.nome),slug:p.slug,auto:!!p.auto}));
}
/* todo mundo que posta, por id (jornalista fictício, pessoa real ou o perfil do veículo) */
let _imprensaCache=null;
function perfisImprensa(){
  const imp=garantirImprensa();
  const chave=(imp?imp.jor.length:0)+'|'+(typeof MIDIA!=='undefined'&&MIDIA.arquivos?Object.keys(MIDIA.arquivos).length:0)+'|'+(typeof PERSONALIDADES!=='undefined'?PERSONALIDADES.length:0)+'|'+(G.runId||G.ano);
  if(_imprensaCache&&_imprensaCache.chave===chave)return _imprensaCache.mapa;
  const mapa={};
  for(const v of (typeof VEICULOS!=='undefined'?VEICULOS:[]))mapa['v-'+v.id]={id:'v-'+v.id,tipo:'veiculo',nome:v.nome,arroba:v.arroba,veiculo:v.id,verificado:true};
  for(const j of (imp?imp.jor:[]))mapa[j.id]={...j,tipo:'jornalista',verificado:j.cargo==='editor'||j.cargo==='insider'};
  for(const p of personalidades())mapa[p.id]={...p,verificado:true};
  _imprensaCache={chave,mapa};
  return mapa;
}
function perfilImprensa(id){return perfisImprensa()[id]||null;}

/* ---------- de onde é a notícia ---------- */
function escopoNoticia(n){
  let t=n.t&&n.t.length?G.times[n.t[0]]:null;
  if(!t&&n.p&&n.p.length){const p=G.jogadores[n.p[0]];if(p&&p.timeId)t=G.times[p.timeId];}
  return{time:t||null,regiao:t?t.regiao:null,pais:t&&typeof paisDoClube==='function'?paisDoClube(t):null};
}

/* ---------- quem assina ---------- */
const _autorCache=new WeakMap();
function autorDaNoticia(n){
  if(!n)return null;
  if(_autorCache.has(n)){const a=_autorCache.get(n);const P=perfisImprensa();if(P[a])return P[a];}
  const P=perfisImprensa();
  const sem=n.txt+'|'+n.ano+'|'+(n.s||0);
  const esc=escopoNoticia(n);
  const imp=n.imp||1;
  const vs=typeof VEICULOS!=='undefined'?VEICULOS:[];
  /* 1. o veículo: do país do clube > da região > global (o global pesa mais nas grandes) */
  const pesoV=v=>{
    let w;
    if(esc.pais&&v.paises.includes(esc.pais))w=5;
    else if(esc.regiao&&v.regiao===esc.regiao)w=v.paises.length?0.8:1.5;
    else if(v.regiao==='GLOBAL')w=esc.regiao?(imp>=2?2.6:0.9):2.2;
    else w=esc.regiao?0:0.15;
    if((v.foco||[]).includes(n.c))w*=1.7;
    return w*(0.6+0.4*(v.alcance||1));
  };
  /* pessoas reais independentes concorrem como se fossem um veículo do país delas */
  const indep=Object.values(P).filter(p=>p.real&&p.tipo==='jornalista'&&!p.veiculo);
  const opcoes=vs.map(v=>({v,w:pesoV(v)})).concat(indep.map(p=>({p,w:esc.pais&&p.pais===esc.pais?4:esc.regiao==='AMER'&&p.pais==='BR'?0.5:0})));
  const o=escolhePeso(opcoes,x=>x.w,sorteImp(sem,1));
  let autor;
  if(!o)autor=null;
  else if(o.p)autor=o.p;
  else{
    /* 2. dentro do veículo: o perfil oficial ou alguém da equipe (o cargo puxa a categoria) */
    const equipe=Object.values(P).filter(x=>x.veiculo===o.v.id&&x.tipo!=='veiculo'&&(x.tipo==='jornalista'||x.tipo==='caster'));
    if(!equipe.length||sorteImp(sem,2)<0.3)autor=P['v-'+o.v.id];
    else autor=escolhePeso(equipe,x=>{
      const c=CARGOS_IMPRENSA.find(k=>k.id===x.cargo);
      return (x.real?2.5:1)*(c&&c.foco.includes(n.c)?2:1);
    },sorteImp(sem,3));
  }
  if(autor)_autorCache.set(n,autor.id);
  return autor;
}
function veiculoDoPerfil(p){return p&&p.veiculo?veiculo(p.veiculo):null;}

/* ---------- engajamento (só aparência; não mexe em nada) ---------- */
function engajamentoNoticia(n){
  const a=autorDaNoticia(n);const v=veiculoDoPerfil(a);
  const esc=escopoNoticia(n);
  const imp=n.imp||1;
  const torc=esc.time?Math.max(10,esc.time.torcida||esc.time.prestigio||40):30;
  let base=18*imp*imp*(v?0.5+0.5*(v.alcance||1):1.4)*(torc/40)*(n.meu?1.5:1)*(a&&a.real?2.2:1);
  const sem=n.txt+'|'+n.ano+'|'+(n.s||0);
  const cur=Math.round(base*(0.55+sorteImp(sem,7)*1.4)*10);
  return{curtidas:cur,reposts:Math.round(cur*(0.08+sorteImp(sem,8)*0.14)),respostas:Math.round(cur*(0.03+sorteImp(sem,9)*0.06))};
}

/* ---------- reações nas notícias grandes ----------
   Frases curtas e neutras ou de empolgação: quem reage é, primeiro, quem
   você cadastrou do país do clube; sem ninguém, jornalistas fictícios. */
const REACOES={
  titulo:['Que campanha do {tag}. Merecido demais','Ninguém segurou o {tag}. Respeita!','Final histórica, que nível','Título com muito trabalho por trás. Parabéns, {tag}!','O {tag} fez por merecer'],
  mercado:['Esse mercado tá pegando fogo','Movimento grande. Curioso pra ver como encaixa','Não esperava essa. E vocês?','Isso muda o tabuleiro da liga','Contratação que pode virar a temporada'],
  clube:['De olho no {tag} nessa temporada','Torcida do {tag} tá on','Vamos ver como o {tag} responde','Semana movimentada no {tag}'],
  competicoes:['Que série! Valeu cada round','Jogaço. A liga tá muito parelha','Resultado que mexe com a tabela','Esse confronto entregou demais'],
  carreira:['Grande trajetória. Respeito total','Fim de uma era','Vai deixar saudade'],
  meta:['O meta mudou de novo kkk','Agora quero ver quem adapta mais rápido','Patch que vai dar o que falar']
};
function reacoesNoticia(n){
  if((n.imp||1)<2)return [];
  const P=perfisImprensa();
  const sem=n.txt+'|'+n.ano+'|'+(n.s||0)+'|r';
  const esc=escopoNoticia(n);
  const autor=autorDaNoticia(n);
  const reais=Object.values(P).filter(p=>p.real&&p.id!==(autor&&autor.id)&&(!esc.pais||p.pais===esc.pais||(esc.regiao==='AMER'&&p.pais==='BR')));
  const ficticios=Object.values(P).filter(p=>p.tipo==='jornalista'&&!p.real&&p.id!==(autor&&autor.id)&&(()=>{const v=veiculo(p.veiculo);return v&&(!esc.regiao||v.regiao===esc.regiao||v.regiao==='GLOBAL');})());
  const quantos=(n.imp>=3?2:1)+(sorteImp(sem,1)<0.35?1:0);
  const grupo=/campe|título/i.test(n.txt)?'titulo':REACOES[n.c]?n.c:'competicoes';
  const frases=REACOES[grupo];
  const tag=esc.time?esc.time.tag:'';
  const out=[],vistos=new Set();
  for(let i=0;i<quantos;i++){
    const pool=reais.length&&sorteImp(sem,10+i)<0.8?reais:ficticios;
    if(!pool.length)break;
    const p=pool[Math.floor(sorteImp(sem,20+i)*pool.length)];
    if(!p||vistos.has(p.id))continue;vistos.add(p.id);
    let f=frases[Math.floor(sorteImp(sem,30+i)*frases.length)];
    if(/\{tag\}/.test(f)&&!tag)f=frases.find(x=>!/\{tag\}/.test(x))||'Isso vai render';
    out.push({autor:p,txt:f.replace(/\{tag\}/g,tag),curtidas:Math.round(engajamentoNoticia(n).curtidas*(0.1+sorteImp(sem,40+i)*0.4))});
  }
  return out;
}

/* ---------- seguir ---------- */
function seguindoImprensa(id){const imp=garantirImprensa();return !!(imp&&imp.seguindo.includes(id));}
function alternarSeguir(id){
  const imp=garantirImprensa();if(!imp)return false;
  const i=imp.seguindo.indexOf(id);
  if(i>=0)imp.seguindo.splice(i,1);else imp.seguindo.push(id);
  return i<0;
}
/* a notícia aparece em "Seguindo" se o autor ou o veículo dele é seguido */
function noticiaSeguida(n){
  const a=autorDaNoticia(n);if(!a)return false;
  return seguindoImprensa(a.id)||(a.veiculo&&seguindoImprensa('v-'+a.veiculo));
}
/* jornalistas fictícios que cobrem uma região (coletiva de imprensa) */
function jornalistasDaRegiao(regiao,pais){
  const imp=garantirImprensa();if(!imp)return [];
  return imp.jor.filter(j=>{const v=veiculo(j.veiculo);return v&&(pais&&v.paises.includes(pais)||v.regiao===regiao);})
    .sort((a,b)=>{const va=veiculo(a.veiculo),vb=veiculo(b.veiculo);
      return (pais&&vb.paises.includes(pais)?1:0)-(pais&&va.paises.includes(pais)?1:0)||(vb.alcance||1)-(va.alcance||1);});
}
