/* ============================================================
   OS OUTROS DONOS EM AÇÃO (fase 5 do modo Dono)
   ------------------------------------------------------------
   Cada clube tem dono (core/donos.js). Aqui eles passam a agir:

   · RELACIONAMENTO com você, de −100 a 100, por clube (G.relDonos).
     Sobe com negócio justo, venda para eles e um jantar de negócios;
     cai com proposta humilhante, multa paga por cima deles, técnico
     roubado, provocação e vitória em clássico. Abaixo de −50 o dono
     fecha a porta: só vende pela multa. Vale em qualquer papel que
     dirige clube (Treinador e Dono); no Treinador o chefe é o dono
     do seu clube, e a relação com ele é a confiança de sempre.

   · NO PRÓPRIO CLUBE, pelo perfil: o ambicioso troca de técnico no
     meio da campanha ruim, o paciente segura; dono quebrado vende a
     organização para um grupo novo, que chega com dinheiro.

   · O PREÇO: o perfil e a relação mexem no mínimo que o dono aceita
     pelo jogador (o investidor vende mais fácil, o ambicioso cobra
     mais pelo titular, o midiático segura o ídolo).

   Tudo sai de hash de (ano, semana, clube): não toca o gerador.
   ============================================================ */
const REL_PORTA=-50, REL_MAX=100;
const NOMES_GRUPOS_DONOS=['Grupo Altamira','Kestrel Holdings','Solaris Media','Ponte Alta Investimentos','Boreal Entertainment',
  'Tessera Group','Magnólia Participações','Orion Sports Capital','Cardeal Holdings','Sextante Media Group'];

function _hDono(s){return typeof _hashTxt==='function'?_hashTxt(s):0;}
function relDonos(){return G.relDonos||(G.relDonos={});}
function relDono(t){return t&&relDonos()[t.id]!=null?relDonos()[t.id]:0;}
function logDonos(){return G.logDonos||(G.logDonos=[]);}
function registrarDono(t,txt,d){
  logDonos().unshift({ano:G.ano,semana:G.semana,timeId:t?t.id:null,dono:t&&t.dono?t.dono.nome:null,txt,d:d||0});
  if(G.logDonos.length>80)G.logDonos.length=80;
}
/* só mexe com donos dos outros clubes, e só quando você dirige um */
function mexerRelDono(t,d,txt){
  if(!t||!d||!G.meuTime||t.id===G.meuTime||!t.dono||t.dono.voce)return;
  const r=relDonos();
  r[t.id]=clamp(Math.round(((r[t.id]||0)+d)*10)/10,-REL_MAX,REL_MAX);
  if(txt)registrarDono(t,txt,d);
}
function rotuloRel(v){return v>=50?'Aliado':v>=20?'Amistoso':v>-20?'Neutro':v>REL_PORTA?'Frio':'Porta fechada';}
function donoFechaPorta(origem,dest){
  return !!origem&&!!dest&&dest.id===G.meuTime&&relDono(origem)<=REL_PORTA;
}
/* quanto o dono pede a mais (ou a menos) pelo jogador, para o seu clube */
function fatorDonoVenda(origem,dest,p){
  if(!origem||!dest||dest.id!==G.meuTime||!origem.dono)return 1;
  let k=1;
  const r=relDono(origem);
  if(r<0)k*=1+(-r)/250;           /* −50 → +20% */
  else if(r>=40)k*=0.95;
  const pf=origem.dono.perfil, tit=(origem.titulares||[]).includes(p.id);
  if(pf==='investidor')k*=0.96;
  if(pf==='ambicioso'&&tit)k*=1.10;
  if(pf==='midiatico'&&(p.fama||0)>=60)k*=1.12;
  if(pf==='economico'&&!tit)k*=0.95;
  return k;
}
function textoPorta(origem){
  const d=origem&&origem.dono;
  return (d?d.nome:'O dono')+' não vende para o seu clube'+(relDono(origem)<=-80?' nem para salvar a própria vida':'')+'. Só pela multa rescisória.';
}

/* ---------- ganchos de negócio ---------- */
function relDepoisDaCompra(n,origem,taxa,preco,viaMulta){
  if(!origem)return;
  if(viaMulta)mexerRelDono(origem,-8,'Pagou a multa de '+(G.jogadores[n.jogadorId]||{}).nome+' por cima dele.');
  else if(taxa>=preco*0.95)mexerRelDono(origem,4,'Negócio justo por '+(G.jogadores[n.jogadorId]||{}).nome+'.');
  else mexerRelDono(origem,1,'Fechou negócio por '+(G.jogadores[n.jogadorId]||{}).nome+'.');
}
function relOfensa(origem,p){mexerRelDono(origem,-6,'Proposta humilhante por '+(p?p.nome:'um jogador')+'.');}
function relVenda(destino,p){mexerRelDono(destino,3,'Vendeu '+(p?p.nome:'um jogador')+' para ele.');}
function relTecnicoRoubado(origem,m){mexerRelDono(origem,-10,'Levou '+(m?m.nome:'o técnico')+' do clube dele.');}

/* clássico: mesma liga e os dois entre os grandes, ou muitos encontros */
function ehClassico(a,b){
  if(!a||!b||a.regiao!==b.regiao||a.tier!==b.tier)return false;
  if((a.prestigio||0)>=72&&(b.prestigio||0)>=72)return true;
  const pais=typeof paisDoClube==='function'?paisDoClube(a)===paisDoClube(b):false;
  return pais&&(a.prestigio||0)>=60&&(b.prestigio||0)>=60;
}
function relDepoisDoJogo(res){
  if(!res||!G.meuTime)return;
  const eu=G.meuTime, adv=res.aId===eu?res.bId:res.bId===eu?res.aId:null;
  if(!adv||res.wo)return;
  const t=G.times[adv],ganhei=res.vencedor===eu||res.winner===eu;
  if(!t)return;
  const cl=ehClassico(G.times[eu],t);
  if(ganhei)mexerRelDono(t,cl?-3:-1,cl?'Perdeu o clássico para você.':null);
  else mexerRelDono(t,0.5,null);
}

/* ---------- ações de dono para dono (modo Dono) ---------- */
function _chaveTemporada(t,acao){return acao+'|'+t.id+'|'+G.ano;}
function acoesFeitas(){return G.acoesDonos||(G.acoesDonos={});}
function jantarDeNegocios(id){
  const t=G.times[id],eu=G.times[G.meuTime];
  if(!t||!eu||t.id===eu.id)return{ok:false,erro:'Clube inválido.'};
  const k=_chaveTemporada(t,'jantar');
  if(acoesFeitas()[k])return{ok:false,erro:'Vocês já jantaram nesta temporada.'};
  const custo=eu.tier===1?25000:8000;
  if(eu.caixa<custo)return{ok:false,erro:'Caixa insuficiente.'};
  eu.caixa-=custo;acoesFeitas()[k]=1;
  const pf=t.dono.perfil, h=_hDono(k)%100;
  const d=(pf==='investidor'?10:pf==='midiatico'?8:pf==='paciente'?7:pf==='economico'?5:4)+Math.round(h/25);
  mexerRelDono(t,d,'Jantar de negócios.');
  return{ok:true,msg:'Jantar com '+t.dono.nome+': relação +'+d+'.'};
}
function provocarDono(id){
  const t=G.times[id],eu=G.times[G.meuTime];
  if(!t||!eu||t.id===eu.id)return{ok:false,erro:'Clube inválido.'};
  const k=_chaveTemporada(t,'provoca');
  if(acoesFeitas()[k])return{ok:false,erro:'Você já provocou esse dono nesta temporada.'};
  acoesFeitas()[k]=1;
  const cl=ehClassico(eu,t);
  mexerRelDono(t,-12,'Provocação na imprensa.');
  eu.torcida=clamp((eu.torcida||0)+(cl?3:1),0,typeof TORCIDA_MAX!=='undefined'?TORCIDA_MAX:100);
  noticia('🎙 '+(G.manager?G.manager.nome:'O dono')+' provoca '+t.dono.nome+' ('+t.nome+') na imprensa'+(cl?': o clássico esquentou.':'.'),{c:'clube',t:[eu.id,t.id]});
  return{ok:true,msg:'A torcida gostou'+(cl?' (clássico: +3)':' (+1)')+'. '+t.dono.nome+' não esqueceu.'};
}

/* ---------- os donos no próprio clube ----------
   Uma vez por semana, para os clubes da IA. */
function _campanha(t){const c=t.temporada||{v:0,d:0};return{v:c.v||0,d:c.d||0,j:(c.v||0)+(c.d||0)};}
function _trocarTecnicoIA(t,motivo){
  const atual=typeof membroDe==='function'?membroDe(t,'tecnico'):null;
  if(!atual||atual.voce)return false;
  const folgaAno=typeof folgaSalarial==='function'?folgaSalarial(t)*12:Infinity;
  const teto=Math.min(Math.max(40000,t.caixa*0.25),Math.max(0,folgaAno+atual.salario*12));
  const cand=(G.staffLivres||[]).map(i=>G.staff[i]).filter(m=>m&&!m.voce&&m.cargo==='tecnico'&&salarioStaff(m)*12<teto)
    .sort((a,b)=>overStaff(b)-overStaff(a))[0];
  if(!cand||overStaff(cand)<overStaff(atual)-6)return false;
  const multa=Math.round(atual.salario*Math.max(1,atual.contrato)*4);
  t.caixa-=multa;
  liberarStaff(atual.id);
  moverStaff(cand.id,t.id,'tecnico');
  registrarDono(t,'Demitiu '+atual.nome+' ('+motivo+') e contratou '+cand.nome+'.');
  noticia('✂ '+t.dono.nome+' perde a paciência e demite '+atual.nome+' do '+t.nome+' ('+motivo+'). Chega '+cand.nome+'.',{c:'mercado',t:[t.id],imp:1});
  t.trocouTecnicoAno=G.ano;
  return true;
}
function semanaDosDonos(){
  if(!G.times)return;
  for(const id in G.times){
    const t=G.times[id];
    if(!t.dono||t.dono.voce||id===G.meuTime)continue;
    const pf=t.dono.perfil, c=_campanha(t);
    /* troca de técnico: ambicioso no meio da campanha ruim, os outros só no fundo do poço */
    /* só nos fechamentos de etapa: depois do Kickoff, do Stage 1 e no meio do Stage 2 */
    if(t.trocouTecnicoAno!==G.ano&&c.j>=6&&[14,26,38].includes(G.semana||1)){
      const ruim=c.d-c.v;
      const limite=pf==='ambicioso'?4:pf==='midiatico'?5:pf==='paciente'?99:7;
      if(ruim>=limite&&(_hDono(id+'|tec|'+G.ano+'|'+G.semana)%100)<(pf==='ambicioso'?55:35))_trocarTecnicoIA(t,pf==='ambicioso'?'campanha abaixo da ambição dele':'campanha ruim');
    }
  }
}
/* virada de temporada: dono quebrado vende a organização */
function viradaDosDonos(){
  for(const id in G.times){
    const t=G.times[id];
    if(!t.dono||t.dono.voce||id===G.meuTime||t.dono.exId)continue;
    const rec=typeof receitaAnual==='function'?receitaAnual(t):500000;
    if(t.caixa<-rec*0.25&&(_hDono(id+'|venda|'+G.ano)%100)<60){
      const antigo=t.dono;
      const nome=NOMES_GRUPOS_DONOS[_hDono(id+'|grupo|'+G.ano)%NOMES_GRUPOS_DONOS.length];
      const perfis=Object.keys(PERFIS_DONO);
      (t.donosAntigos=t.donosAntigos||[]).push(Object.assign({ate:G.ano},antigo));
      t.dono={tipo:'empresa',nome,perfil:perfis[_hDono(nome+G.ano)%perfis.length],desde:G.ano+1,base:false};
      const injecao=Math.round((Math.abs(t.caixa)+rec*0.3)/5000)*5000;
      t.caixa+=injecao;
      registrarDono(t,antigo.nome+' vende a organização para '+nome+', que entra com '+money(injecao)+'.');
      noticia('🏢 '+antigo.nome+', no vermelho, vende o '+t.nome+' para o '+nome+'. O grupo novo entra com '+money(injecao)+'.',{c:'mercado',t:[t.id],imp:2});
    }
  }
  /* as relações esfriam com o tempo */
  const r=relDonos();for(const k in r)r[k]=Math.round(r[k]*0.8*10)/10;
}

/* ---------- modo Treinador: o chefe é o dono ---------- */
function chefeDoClube(t){
  t=t||(G.meuTime&&G.times[G.meuTime]);
  const d=t&&t.dono;
  if(!d||d.voce)return null;
  return{nome:d.tipo==='pessoa'||d.exId?d.nome:'A diretoria da '+d.nome,curto:d.tipo==='pessoa'||d.exId?d.nome.split(' (')[0]:'A diretoria',perfil:d.perfil,d};
}
/* o perfil do dono pesa na cobrança do treinador */
function fatorCobrancaDono(delta){
  const c=chefeDoClube();if(!c)return 1;
  if(delta<0)return c.perfil==='ambicioso'?1.25:c.perfil==='paciente'?0.8:c.perfil==='midiatico'?1.1:1;
  return c.perfil==='paciente'?1.1:1;
}
