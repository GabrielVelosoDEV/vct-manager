/* ============================================================
   RENOVAÇÃO DE CONTRATO
   ------------------------------------------------------------
   Até aqui renovar era uma pergunta de sim ou não: sempre três
   anos, sempre 12% a mais, e o jogador nunca dizia não. O único
   contrato que você assinava sem negociar era o do próprio
   elenco.

   Agora é a mesma lógica da compra (transferencia.js): o jogador
   tem um pedido explicado linha a linha e uma duração que ele
   quer. Três coisas mexem no pedido:
     · COMO ELE ESTÁ NO CLUBE  moral, minutos, promessa quebrada
     · O QUE ELE VALE LÁ FORA  quem é melhor que o clube cobra
                               para ficar
     · A FASE DA CARREIRA      garoto em ascensão quer contrato
                               curto para renegociar valorizado;
                               veterano quer segurança

   Nada aqui sorteia. A negociação acontece a partir de um clique,
   e o gerador semeado é do motor — o mesmo motivo do veto.
   ============================================================ */

/* Propostas recusadas antes de ele fechar a porta, e por quanto tempo. */
const RENOV_TENTATIVAS=3;
const RENOV_ESPERA=8;
/* Prêmio por ano fora da duração que ele quer. */
const RENOV_PREMIO_ANO=0.07;

function _semanaAbs(){return (G.ano||0)*SEMANAS_ANO+(G.semana||1);}
/* O que ele pede para ficar, e por quê. */
function pedidoRenovacao(p,t){
  const base=salario(p,t,true);
  const itens=[];
  const juntar=(rot,f)=>{if(Math.abs(f-1)>0.005)itens.push({rot,fator:f});return f;};
  let f=1;
  const titular=(t.titulares||[]).includes(p.id);

  if(p.moral<0.45)f*=juntar('Insatisfeito no clube (moral '+Math.round(p.moral*100)+'%)',1.15);
  else if(p.moral>=0.80)f*=juntar('Feliz no clube',0.95);
  if(!titular)f*=juntar('Quer jogar mais do que joga',1.08);
  /* promessa quebrada pesa por um ano */
  const pq=p.promessaQuebrada;
  if(pq&&((G.ano-pq.ano)*SEMANAS_ANO+((G.semana||1)-pq.semana))<SEMANAS_ANO)
    f*=juntar('Você quebrou uma promessa com ele',1.20);

  /* quem é melhor que o próprio clube tem mercado e sabe disso */
  const folga=over(p)-nivelDoClube(t);
  if(folga>4)f*=juntar('Tem mercado melhor que o clube',1+Math.min(0.20,folga*0.012));

  if(p.idade>=28)f*=juntar('Veterano: quer garantir o contrato',1.04);
  if(typeof fatorRiqueza==='function')f*=juntar('O clube tem muito dinheiro em caixa',fatorRiqueza(t));
  if(t.id===G.meuTime&&dificuldade().salario!==1)
    f*=juntar('Dificuldade '+dificuldade().nome.toLowerCase(),dificuldade().salario);
  /* nunca aceita ganhar menos do que já ganha, a não ser que esteja caindo */
  const caindo=p.pico&&over(p)<p.pico-4;
  let pedido=Math.round(base*f/100)*100;
  if(!caindo&&pedido<p.salario){
    itens.push({rot:'Não aceita ganhar menos que hoje',fator:p.salario/Math.max(1,base*f)});
    pedido=p.salario;
  }

  /* a duração que ele quer */
  const subindo=p.idade<=22&&p.pot-over(p)>=5;
  const anos=subindo?[1,2]:p.idade>=29?[2,4]:[2,3];
  return{base,itens,pedido:Math.max(300,pedido),anos,
         motivoAnos:subindo?'Está crescendo: quer contrato curto para renegociar valorizado.'
                   :p.idade>=29?'Veterano: prefere contrato longo.'
                   :'Aceita de dois a três anos.'};
}
/* O pedido para uma duração específica: cada ano fora do que ele quer custa. */
function pedidoParaAnos(d,anos){
  const fora=anos<d.anos[0]?d.anos[0]-anos:anos>d.anos[1]?anos-d.anos[1]:0;
  return Math.round(d.pedido*(1+fora*RENOV_PREMIO_ANO)/100)*100;
}
function renovacaoFechada(p){
  return !!(p.renovBloq&&_semanaAbs()<p.renovBloq);
}
function semanasAteRenovar(p){
  return renovacaoFechada(p)?p.renovBloq-_semanaAbs():0;
}
/* Recusa que dinheiro não resolve. */
function recusasRenovacao(p,t,anos){
  const fora=[];
  if(p.timeId!==t.id)fora.push(p.nome+' não é do seu elenco.');
  if(anos<1||anos>4)fora.push('Duração de contrato inaceitável (1 a 4 anos).');
  if(renovacaoFechada(p))
    fora.push(p.nome+' encerrou a conversa. Tente de novo em '+semanasAteRenovar(p)+' semana(s).');
  if(p.moral<0.25&&!(t.titulares||[]).includes(p.id))
    fora.push(p.nome+' não quer renovar: está no banco e infeliz. Converse com ele antes.');
  return fora;
}
/* Lista de motivos; vazia é acordo. */
function avaliarRenovacao(p,t,sal,anos){
  const mot=recusasRenovacao(p,t,anos);
  if(mot.length)return mot;
  const d=pedidoRenovacao(p,t);
  const alvo=pedidoParaAnos(d,anos);
  if(sal<alvo*0.97){
    const principal=d.itens.slice().sort((a,b)=>b.fator-a.fator)[0];
    mot.push('Ele quer perto de '+money(alvo)+'/mês por '+anos+' ano(s)'+
      (principal&&principal.fator>1.04?' — pesa: '+principal.rot.toLowerCase():'')+'.');
  }
  return mot;
}
/* Proposta enviada. Recusa conta tentativa; acordo fecha contrato. */
function proporRenovacao(p,t,sal,anos){
  const mot=avaliarRenovacao(p,t,sal,anos);
  if(mot.length){
    if(!renovacaoFechada(p)&&p.timeId===t.id){
      p.renovTent=(p.renovTent||0)+1;
      if(p.renovTent>=RENOV_TENTATIVAS){
        p.renovTent=0;p.renovBloq=_semanaAbs()+RENOV_ESPERA;
        p.moral=clamp(p.moral-0.05,0.05,1);
        mot.push(p.nome+' cansou de proposta baixa e fechou a conversa por '+RENOV_ESPERA+' semanas.');
      }else{
        mot.push('Restam '+(RENOV_TENTATIVAS-p.renovTent)+' proposta(s) antes de ele fechar a conversa.');
      }
    }
    return{ok:false,motivos:mot};
  }
  const d=pedidoRenovacao(p,t);
  const generoso=sal>=pedidoParaAnos(d,anos)*1.10;
  p.contrato=anos;p.salario=Math.round(sal);
  p.renovTent=0;delete p.renovBloq;
  p.moral=clamp(p.moral+(generoso?0.09:0.05),0.05,1);
  noticia('📄 '+p.nome+' renovou com '+t.nome+' por '+anos+' ano(s), '+money(p.salario)+'/mês.',{c:'mercado',p:[p.id],t:[t.id]});
  return{ok:true,msg:p.nome+' renovou por '+anos+' ano(s).'+(generoso?' Saiu valorizado.':'')};
}
