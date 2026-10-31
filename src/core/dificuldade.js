/* ============================================================
   DIFICULDADE
   ------------------------------------------------------------
   Escolhida na carreira nova e fixa até o fim dela. Mexe só no
   que cerca o SEU clube: dinheiro para começar, paciência da
   diretoria, meta de posição e quanto o jogador cobra de você.
   O motor de partida e a IA não mudam — vencer continua sendo
   a mesma coisa em qualquer nível.
   ============================================================ */
const DIFICULDADES={
  facil  :{nome:'Fácil',  resumo:'Mais caixa, diretoria paciente e jogador que cobra menos.',
           caixa:1.5, confianca:72, cobranca:0.7,  alvo:1,  salario:0.92},
  normal :{nome:'Normal', resumo:'O jogo como foi calibrado.',
           caixa:1,   confianca:62, cobranca:1,    alvo:0,  salario:1},
  dificil:{nome:'Difícil',resumo:'Menos caixa, diretoria exigente e jogador que cobra mais.',
           caixa:0.6, confianca:52, cobranca:1.3,  alvo:-1, salario:1.10}
};
function dificuldade(){return DIFICULDADES[(G&&G.dificuldade)||'normal']||DIFICULDADES.normal;}

/* Na carreira nova: grava o nível e ajusta o caixa do clube escolhido. */
function aplicarDificuldade(id,t){
  G.dificuldade=DIFICULDADES[id]?id:'normal';
  const d=dificuldade();
  if(t&&d.caixa!==1)t.caixa=Math.round(t.caixa*d.caixa/1000)*1000;
  return d;
}
/* Quanto uma queda de confiança pesa. Ganho de confiança não muda. */
function pesoDaCobranca(delta){return delta<0?delta*dificuldade().cobranca:delta;}
