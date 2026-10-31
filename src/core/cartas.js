/* ============================================================
   CARTAS DO JOGADOR — a moldura muda com a faixa de over
   ------------------------------------------------------------
   Quatro cartas, uma por faixa. A faixa sai sempre do over da
   hora (over(p)), então a carta nunca fica desatualizada: o que
   este arquivo guarda é só a ÚLTIMA faixa que o seu clube viu
   (p.carta), para avisar quando um jogador seu sobe de carta.

     Recruta       0–70   aço escovado, grafite
     Profissional 71–80   metal azul com neon
     Elite        81–90   ouro e preto
     Lenda        91–99   ouro e vermelho

   Os cortes batem com o mundo inicial: ~100 recrutas, ~230
   profissionais, ~185 elites e só uma dúzia de lendas.
   Nada aqui toca o DOM; o desenho mora em src/ui/cartas.js.
   ============================================================ */
const CARTAS=[
  {id:'recruta',     nome:'Recruta',      min:0,  max:70},
  {id:'profissional',nome:'Profissional', min:71, max:80},
  {id:'elite',       nome:'Elite',        min:81, max:90},
  {id:'lenda',       nome:'Lenda',        min:91, max:100}
];
function indiceCarta(o){
  for(let i=CARTAS.length-1;i>0;i--)if(o>=CARTAS[i].min)return i;
  return 0;
}
function cartaDe(p){return CARTAS[indiceCarta(over(p))];}

/* Roda no fim da semana, depois de desenvolver(), só para o seu clube.
   Primeira vez que vê o jogador: só anota, sem festa (é a carta que ele já
   tinha). Subiu: notícia e entra na fila da revelação, que a interface abre
   na próxima brecha. Caiu: a carta na tela troca sozinha (ela sai do over); a anotação só
   desce depois de 3 pontos abaixo do corte, para quem oscila entre 80 e 81
   não ganhar festa toda semana. */
function conferirCartas(t){
  if(!t||t.id!==G.meuTime)return;
  if(!G.cartasNovas)G.cartasNovas=[];
  for(const pid of t.elenco){
    const p=G.jogadores[pid];if(!p)continue;
    const agora=indiceCarta(over(p));
    /* p.cartaT: de que clube é a anotação. Quem saiu e voltou melhor não
       ganha festa atrasada. */
    if(p.carta==null||p.cartaT!==t.id){p.carta=agora;p.cartaT=t.id;continue;}
    if(agora>p.carta){
      const de=p.carta;p.carta=agora;
      noticia('🃏 '+p.nome+' subiu para a carta '+CARTAS[agora].nome+' ('+over(p)+' de over).',
        {c:'clube',p:[p.id],t:[t.id],imp:agora>=3?3:2});
      /* um jogador só aparece uma vez na fila, com a carta mais alta */
      const ja=G.cartasNovas.find(x=>x.pid===p.id);
      if(ja)ja.para=agora;else G.cartasNovas.push({pid:p.id,de,para:agora});
    }else if(agora<p.carta&&over(p)<=CARTAS[p.carta].min-3)p.carta=agora;
  }
}
