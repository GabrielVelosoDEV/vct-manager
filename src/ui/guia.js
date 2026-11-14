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
  treino:'Cada jogador tem um plano por semana: atributo, agente ou descanso. Treinar cansa, mas em e-sports quem decide jogo é a cabeça: veja o Vestiário.',
  preparacao:'Táticas, comps e treino ficam aqui. O preparo de cada mapa junta tudo num número de 0 a 100 — é ele que decide o que banir e o que treinar.',
  vestiario:'Entrosamento é de cada dupla de jogadores, e a confiança sobe e desce com os resultados. Escolha uma atividade por semana para mexer nos dois.',
  comps:'A comp de cada mapa decide quem joga com qual agente. O preset Melhor monta uma comp completa com quem você tem.',
  base:'A categoria de base cresce sozinha com a academia e o head coach. Promova quando o garoto estiver pronto; aos 20 ele vai embora.',
  mercado:'A janela de transferências abre duas vezes por ano. Cada jogador diz o que quer, e as objeções dele viram salário a mais.',
  financas:'Patrocínio, torcida e liga pagam a folha. Fique de olho no teto: a diretoria não aceita estourar o caixa.',
  comp:'Todos os torneios do circuito, com tabela, chaveamento e campeões. O seu aparece primeiro.'
};
/* Primeiros passos da Central: cada um se marca sozinho quando acontece. */
const GUIA_PASSOS_TECNICO=[
  {id:'elenco', texto:'Confira a escalação',             tela:'elenco'},
  {id:'taticas',texto:'Escolha o foco tático',           tela:'taticas'},
  {id:'treino', texto:'Monte o plano de treino da semana',tela:'treino'},
  {id:'comps',  texto:'Veja as comps de cada mapa',      tela:'comps'},
  {id:'preparacao',texto:'Confira o preparo de cada mapa', tela:'preparacao'},
  {id:'mercado',texto:'Dê uma olhada no mercado',        tela:'mercado'},
  {id:'partida',texto:'Jogue a primeira partida com relatório e veto'}
];
/* modo jogador: as dicas e os primeiros passos são outros */
const GUIA_TELAS_JOGADOR={
  inicio:'A Central do jogador: a sua situação no clube, a chance de jogar, o próximo jogo e o que estão falando de você. O botão Avançar passa a semana.',
  semana:'A semana tem energia. Treine jogando (rende mais que simular), vá ao treino do clube e guarde energia se tiver jogo. Sem nada marcado, o assistente simula uma semana padrão.',
  talentos:'Cada ponto de over acima de 65 no seu auge vale um ponto de talento. As fileiras abrem por faixa de over; a assinatura (90) é uma só.',
  relacoes:'O técnico escala pela conta de sempre mais a confiança dele em você. Uma conversa com ele por semana, uma com cada colega.',
  contrato:'Propostas chegam na janela, no último ano de contrato ou quando você pede para sair. Negocie: o clube aceita, contrapropõe ou perde a paciência.',
  financas:'Salário, prêmios, lives e patrocínios entram; empresário, staff pessoal e estilo de vida saem. O setup dá XP e economiza energia.',
  midia:'Seguidores viram fama, e fama traz propostas e patrocínio. O tom do post e a resposta da entrevista mexem na sua imagem.',
  perfil:'Atributos com a barra de XP, agentes, conquistas e, um dia, o botão de pendurar o mouse.'
};
const GUIA_PASSOS_JOGADOR=[
  {id:'semana',  texto:'Abra Semana e treinos',             tela:'semana'},
  {id:'treinou', texto:'Jogue um treino (range, duelo, deathmatch ou retake)', tela:'semana'},
  {id:'talentos',texto:'Veja a árvore de talentos',         tela:'talentos'},
  {id:'relacoes',texto:'Converse com o técnico',            tela:'relacoes'},
  {id:'contrato',texto:'Confira o seu contrato',            tela:'contrato'},
  {id:'midia',   texto:'Veja a sua fama e mídia',           tela:'midia'},
  {id:'jogou',   texto:'Viva o primeiro dia de jogo'}
];
function _guiaJogadorAuto(){
  if(!G.guia||!G.voce)return;
  const v=G.guia.vistos, s=G.voce.sem;
  if(s&&s.feitas&&s.feitas.some(f=>!f.simulado&&f.nota!=null))v.treinou=true;
  if(G.voce.conversas&&G.voce.conversas.tec)v.relacoes=true;
}
function iniciarGuia(){G.guia={ano:G.ano,vistos:{},ok:{},fim:false};}
function guiaAtivo(){
  return !!(G&&G.guia&&!G.guia.fim&&G.ano===G.guia.ano&&Prefs.get('dicas')!==false);
}
function guiaMarcar(k){if(G&&G.guia&&G.guia.vistos)G.guia.vistos[k]=true;}
/* Aviso no topo da tela, até você dizer que entendeu. */
function guiaBanner(k){
  const textos=typeof modoJogador==='function'&&modoJogador()?GUIA_TELAS_JOGADOR:GUIA_TELAS;
  if(!guiaAtivo()||!textos[k]||G.guia.ok[k])return '';
  return `<div class="guia"><span class="guia-tag">Dica</span><span>${esc(textos[k])}</span>
    <button class="btn sm ghost" data-guiaok="${k}">Entendi</button></div>`;
}
function guiaPassosHTML(){
  if(!guiaAtivo())return '';
  const v=G.guia.vistos;
  const jog=typeof modoJogador==='function'&&modoJogador();
  if(jog)_guiaJogadorAuto();
  const GUIA_PASSOS=jog?GUIA_PASSOS_JOGADOR:GUIA_PASSOS_TECNICO;
  const feitos=GUIA_PASSOS.filter(p=>v[p.id]).length;
  if(feitos===GUIA_PASSOS.length)return '';
  return `<div class="card guia-card"><div class="eyebrow">Primeiros passos · ${feitos} de ${GUIA_PASSOS.length}</div>
    <div class="guia-passos">${GUIA_PASSOS.map(p=>`<div class="${v[p.id]?'feito':''}">
      <span>${v[p.id]?'✓':'○'}</span>
      ${p.tela&&!v[p.id]?`<a href="#" data-guiair="${p.tela}">${esc(p.texto)}</a>`:esc(p.texto)}</div>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn sm ghost" id="guiaFim">Dispensar o guia</button></div></div>`;
}
