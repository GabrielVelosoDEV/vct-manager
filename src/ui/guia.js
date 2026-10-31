/* ============================================================
   PRIMEIRA TEMPORADA GUIADA
   ------------------------------------------------------------
   Dicas curtas para quem nunca jogou: um aviso no topo de cada
   tela na primeira visita e uma lista de primeiros passos na
   Central. Vale só na primeira temporada da carreira e some com
   a preferência "Dicas da primeira temporada" desligada.

   É só interface: não toca o motor nem o gerador semeado.
   ============================================================ */
const GUIA_TELAS={
  inicio:'A Central resume o seu clube: quem está insatisfeito, o próximo jogo, a tabela e a manchete da semana. O botão Avançar, lá em cima, passa a semana.',
  elenco:'Aqui ficam os titulares e o banco. A escalação automática monta os cinco mais fortes por função; troque à mão se quiser dar minutos a alguém.',
  taticas:'Foco tático e agressividade valem para todos os jogos. Execução rende no ataque e perde na defesa; retake é o contrário.',
  treino:'Cada jogador tem um plano por semana: atributo, agente ou descanso. Treinar cansa, e cansaço é o que mais faz um time perder.',
  comps:'A comp de cada mapa decide quem joga com qual agente. O preset Melhor monta uma comp completa com quem você tem.',
  base:'A categoria de base cresce sozinha com a academia e o head coach. Promova quando o garoto estiver pronto; aos 20 ele vai embora.',
  mercado:'A janela de transferências abre duas vezes por ano. Cada jogador diz o que quer, e as objeções dele viram salário a mais.',
  financas:'Patrocínio, torcida e liga pagam a folha. Fique de olho no teto: a diretoria não aceita estourar o caixa.',
  comp:'Todos os torneios do circuito, com tabela, chaveamento e campeões. O seu aparece primeiro.'
};
/* Primeiros passos da Central: cada um se marca sozinho quando acontece. */
const GUIA_PASSOS=[
  {id:'elenco', texto:'Confira a escalação',             tela:'elenco'},
  {id:'taticas',texto:'Escolha o foco tático',           tela:'taticas'},
  {id:'treino', texto:'Monte o plano de treino da semana',tela:'treino'},
  {id:'comps',  texto:'Veja as comps de cada mapa',      tela:'comps'},
  {id:'mercado',texto:'Dê uma olhada no mercado',        tela:'mercado'},
  {id:'partida',texto:'Jogue a primeira partida com relatório e veto'}
];
function iniciarGuia(){G.guia={ano:G.ano,vistos:{},ok:{},fim:false};}
function guiaAtivo(){
  return !!(G&&G.guia&&!G.guia.fim&&G.ano===G.guia.ano&&Prefs.get('dicas')!==false);
}
function guiaMarcar(k){if(G&&G.guia&&G.guia.vistos)G.guia.vistos[k]=true;}
/* Aviso no topo da tela, até você dizer que entendeu. */
function guiaBanner(k){
  if(!guiaAtivo()||!GUIA_TELAS[k]||G.guia.ok[k])return '';
  return `<div class="guia"><span class="guia-tag">Dica</span><span>${esc(GUIA_TELAS[k])}</span>
    <button class="btn sm ghost" data-guiaok="${k}">Entendi</button></div>`;
}
function guiaPassosHTML(){
  if(!guiaAtivo())return '';
  const v=G.guia.vistos;
  const feitos=GUIA_PASSOS.filter(p=>v[p.id]).length;
  if(feitos===GUIA_PASSOS.length)return '';
  return `<div class="card guia-card"><div class="eyebrow">Primeiros passos · ${feitos} de ${GUIA_PASSOS.length}</div>
    <div class="guia-passos">${GUIA_PASSOS.map(p=>`<div class="${v[p.id]?'feito':''}">
      <span>${v[p.id]?'✓':'○'}</span>
      ${p.tela&&!v[p.id]?`<a href="#" data-guiair="${p.tela}">${esc(p.texto)}</a>`:esc(p.texto)}</div>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn sm ghost" id="guiaFim">Dispensar o guia</button></div></div>`;
}
