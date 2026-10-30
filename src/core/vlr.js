/* ============================================================
   PARSER DA PÁGINA DE TIME DO VLR.GG
   ------------------------------------------------------------
   Colar a página de um time e sair com as linhas do importador.

   A regra que orienta tudo aqui: NÃO INVENTAR. A página do vlr
   traz nick, nome real e — se você colar o HTML — a bandeira do
   país. Ela NÃO traz função nem over: isso não existe lá. Então o
   parser devolve esses campos vazios e avisa, em vez de preencher
   com um palpite que depois viraria dado.

   Três formas de colar, porque cada navegador entrega uma coisa:

     1. Ctrl+A / Ctrl+C na página  → texto, uma célula por linha
     2. selecionar só o elenco     → texto com 'nick — Nome Real'
     3. copiar o HTML do elemento  → aí vem também o país

   Só o caso 3 tem país. Nos outros dois o campo sai vazio e o
   importador usa a região do clube, como sempre fez.
   ============================================================ */

/* Rótulos de comissão que aparecem na página. Servem para separar quem é
   jogador de quem é staff — não para adivinhar cargo, que o jogo tem os seus. */
const VLR_ROTULOS_STAFF=['head coach','assistant coach','coach','manager','analyst',
                         'analista','tecnico','técnico','owner','director','staff'];
/* Marcações que o vlr põe ao lado do nick e que não fazem parte do nome. */
const VLR_MARCAS=['(inactive)','(stand-in)','(sub)','(substitute)','(loan)','(trial)',
                  '(inativo)','(reserva)','(captain)','(igl)'];

/* Separa o rótulo entre parênteses do resto: 'Fulano (head coach)' vira
   {texto:'Fulano', rotulo:'head coach'}. Sem isso o parêntese entrava no nome,
   a linha deixava de parecer nome de pessoa, e o head coach era DESCARTADO em
   silêncio — nem jogador, nem comissão, nem aviso. */
function _vlrSepararRotulo(x){
  const s=String(x||'').trim();
  const m=s.match(/^(.*?)\s*\(([^()]{2,40})\)\s*$/);
  return m?{texto:_vlrLimpo(m[1]),rotulo:m[2].trim()}:{texto:_vlrLimpo(s),rotulo:''};
}
function _vlrLimpo(x){
  let s=String(x||'').replace(/ /g,' ').trim();
  for(const m of VLR_MARCAS)s=s.replace(new RegExp(m.replace(/[()]/g,'\\$&'),'ig'),'');
  return s.replace(/\s+/g,' ').trim();
}
function _vlrEhStaff(linha){
  const l=String(linha||'').toLowerCase();
  return VLR_ROTULOS_STAFF.some(r=>l.includes(r));
}
/* Nome real: duas ou mais palavras. Nick: uma palavra, ou algo com dígito,
   símbolo ou caixa irregular. Não é infalível — por isso existe a prévia. */
function _vlrPareceNome(x){
  const s=_vlrLimpo(x);
  if(!s||s.length<4)return false;
  /* Caixa alta inteira é título de seção, não nome de pessoa. Sem esta linha,
     'CLASSIFICAÇÃO' + 'RANKING MUNDIAL' virava um jogador chamado
     CLASSIFICAÇÃO — o parser lia o cabeçalho da página como elenco. */
  if(s===s.toUpperCase()&&/[A-ZÀ-Ý]/.test(s))return false;
  const palavras=s.split(' ').filter(Boolean);
  if(palavras.length<2)return false;
  if(palavras.length>6)return false;   /* frase, não nome */
  return palavras.every(p=>/^[A-Za-zÀ-ÿ'.-]+$/.test(p))
      && palavras.some(p=>/^[A-ZÀ-Ý]/.test(p));   /* ao menos uma inicial maiúscula */
}

/* País a partir do HTML. O vlr marca a bandeira com uma classe terminada no
   código do país; outras bibliotecas usam formatos parecidos. Aceitamos
   qualquer um deles, mas SÓ se o código existir na lista de países do jogo —
   assim uma classe qualquer não vira nacionalidade por acidente. */
function _vlrPaisDe(trecho){
  const padroes=[/\bmod-([a-z]{2})\b/i,/\bflag-([a-z]{2})\b/i,/\bfi-([a-z]{2})\b/i,
                 /\bcountry-([a-z]{2})\b/i];
  for(const p of padroes){
    const m=String(trecho||'').match(p);
    if(!m)continue;
    const pais=m[1].toUpperCase();
    if(typeof PAISES==='undefined'||!PAISES||PAISES[pais])return pais;
  }
  return '';
}

/* ---------- extração ---------- */
function _vlrDoHTML(html){
  const achados=[];
  /* Cada entrada de elenco no vlr é um bloco de link com o nick em destaque e o
     nome real logo abaixo. Em vez de depender de uma classe específica — que
     muda quando o site muda —, fatiamos por âncora de jogador e lemos o texto. */
  const blocos=String(html).split(/<a\b/i).slice(1);
  for(const bruto of blocos){
    const bloco='<a'+bruto;
    if(!/\/player\//i.test(bloco))continue;
    const texto=bloco.replace(/<[^>]*>/g,'\n');
    const partes=texto.split('\n').map(_vlrLimpo).filter(Boolean);
    if(!partes.length)continue;
    const nick=partes[0];
    const nome=partes.slice(1).find(_vlrPareceNome)||'';
    const staff=_vlrEhStaff(bloco.replace(/<[^>]*>/g,' '));
    achados.push({nick,nome,pais:_vlrPaisDe(bloco),staff});
  }
  return achados;
}

function _vlrDoTexto(texto){
  const linhas=String(texto).split(/\r?\n/).map(_vlrLimpo);
  const achados=[];
  for(let i=0;i<linhas.length;i++){
    const l=linhas[i];
    if(!l)continue;
    /* forma 'nick — Nome Real', com travessão, hífen ou barra vertical.
       O rótulo entre parênteses sai antes de julgar o formato do nome. */
    const sep=l.match(/^(.+?)\s*[—–\-|]\s*(.+)$/);
    if(sep){
      const esq=_vlrSepararRotulo(sep[1]), dir=_vlrSepararRotulo(sep[2]);
      if(_vlrPareceNome(dir.texto)&&!_vlrPareceNome(esq.texto)){
        achados.push({nick:esq.texto,nome:dir.texto,pais:'',
                      rotulo:dir.rotulo||esq.rotulo||'',
                      staff:_vlrEhStaff(dir.rotulo||esq.rotulo||l)});
        continue;
      }
    }
    /* forma de duas linhas: nick numa, nome real na seguinte */
    const prox=_vlrSepararRotulo(linhas[i+1]||'');
    if(!_vlrPareceNome(l)&&_vlrPareceNome(prox.texto)){
      const contexto=l+' '+(linhas[i+1]||'')+' '+(linhas[i+2]||'');
      achados.push({nick:_vlrSepararRotulo(l).texto,nome:prox.texto,pais:'',
                    rotulo:prox.rotulo||'',staff:_vlrEhStaff(contexto)});
      i++;continue;
    }
    /* nick sozinho: só aceita se não parecer título de seção nem rótulo */
    if(!_vlrPareceNome(l)&&l.length<=20&&!/^[A-ZÀ-Ý\s]{6,}$/.test(l)
       &&!_vlrEhStaff(l)&&!/^\d+$/.test(l))
      achados.push({nick:l,nome:'',pais:'',staff:false});
  }
  return achados;
}

/* ---------- entrada única ---------- */
/* Devolve tudo o que entendeu MAIS o que não entendeu. A prévia é a peça
   central deste recurso: uma página colada errada não pode virar elenco sem
   você ver antes. */
function parsearVlr(texto,tag){
  const bruto=String(texto||'').trim();
  if(!bruto)return{ok:false,erro:'Cole a página do time primeiro.'};
  const html=/<\w+[\s>]/.test(bruto);
  const achados=html?_vlrDoHTML(bruto):_vlrDoTexto(bruto);

  const vistos=new Set();
  const jogadores=[],staff=[],avisos=[];
  for(const a of achados){
    if(!a.nick||a.nick.length>24)continue;
    const k=a.nick.toLowerCase();
    if(vistos.has(k))continue;
    vistos.add(k);
    (a.staff?staff:jogadores).push(a);
  }
  if(!jogadores.length)
    return{ok:false,erro:html?'Não achei nenhum jogador no HTML colado. Confira se copiou o bloco do elenco.'
                            :'Não achei nenhum jogador no texto colado. Tente selecionar só a área do elenco, ou cole o HTML.'};

  if(!html)avisos.push('Colagem em texto: a bandeira do país não vem junto. '+
                       'Para trazer o país também, copie o HTML do elemento.');
  const semPais=jogadores.filter(j=>!j.pais).length;
  if(html&&semPais)avisos.push(semPais+' jogador(es) sem país reconhecido no HTML.');
  avisos.push('O vlr não publica função nem over — esses campos saem vazios. '+
              'O importador vai assumir Flex e o over do prestígio do clube; '+
              'ajuste antes de importar, ou depois na aba Jogadores.');
  if(jogadores.length>9)
    avisos.push(jogadores.length+' jogadores encontrados, e o elenco comporta 9. '+
                'Provavelmente entraram inativos ou ex-jogadores — revise a lista.');
  if(staff.length)
    avisos.push(staff.length+' pessoa(s) de comissão foram separadas e NÃO entram nas linhas: '+
                staff.map(s=>s.nick).join(', ')+'. A comissão tem aba própria.');

  const tagUso=String(tag||'').trim()||'TAG';
  const linhas=jogadores.map(j=>[tagUso,j.nick,'','','','',j.pais].join(' | ')
    .replace(/\s+\|\s+$/,' | '));
  return{ok:true,formato:html?'html':'texto',jogadores,staff,avisos,
         linhas:linhas.join('\n')};
}
