/* ============================================================
   COMISSÃO TÉCNICA REAL — por tag de clube
   ------------------------------------------------------------
   Fonte: Liquipedia (liquipedia.net/valorant), página de cada time,
   lida em 2026-10-30. Texto da Liquipedia sob CC-BY-SA 3.0 — o
   crédito está nos Créditos do jogo.

   Formato progressivo, como ELENCOS_REAIS:
     ['nick','Função','Nome Completo','PA']
   Só o nick é obrigatório. A função é a da Liquipedia, em inglês, e
   staff.js traduz para o cargo do jogo (cargoDeFuncao):
     Head Coach / Coach            → tecnico
     Assistant Coach / Analyst     → analista
     Performance / Mental Coach    → mental
     Physio                        → fisio
     Scout                         → olheiro
   Função sem cargo no jogo (Manager, General Manager) ou cargo já
   ocupado vira "equipe do clube": aparece com nome e foto, sem efeito
   na partida. Vaga que não está aqui continua gerada.

   Foto: assets/staff/<nick em slug>.png|jpg|webp — mesma regra de
   assets/players/. Clube ausente desta lista mantém comissão gerada.
   ============================================================ */
const COMISSAO_REAL={
/* ---------------- VCT Americas ---------------- */
SEN:[['Ewok','Head Coach','Marthinus Jacobus van der Walt','ZA'],
     ['GUNTER','Assistant Coach','Luke Clives','GB'],
     ['Zyto','Team Manager','Bryan Ybanez','US']],
NRG:[['bonkar','Head Coach','Malkolm Rench','SE'],
     ['Strong','Assistant Coach','Joseph Edwards','GB'],
     ['bikeage','General Manager','Jaime Cohenca','US']],
LOUD:[['Romanilly','Head Coach','Gonzalo Manzano','AR'],
      ['Bati','Assistant Coach','Miguel Batista','PT'],
      ['Wenty','Team Manager','Carlos Lira Portela','BR']],
'100T':[['Nbs','Head Coach','Laurynas Kisielius',''],
        ['d00mbr0s','Assistant Coach','Carl Erik Victor William Sandgren','SE'],
        ['Kaimera','Analyst','Nathan McAdams','']],
MIBR:[['fRoD','Coach','Daniel Montaner','US'],
      ['Happy','Assistant Coach','Vincent Cervoni Schopenhauer','FR'],
      ['Chivitz','Manager','Felipe Chivitz','BR']],
EG:[['potter','Head Coach','Christine Chi','US'],
    ['pho','Assistant Coach','Mike Panza','US']],
FUR:[['shaW','Head Coach','Ian Jardim','BR'],
     ['Kamino','Assistant Coach','Lucas Kamino','BR'],
     ['zaz','Head of Performance','Júlia Medeiros','BR'],
     ['lukzera','Manager','Lucas Soares','BR']],
/* ---------------- VCT EMEA ---------------- */
TH:[['Neilzinho','Head Coach','Neil Finlay',''],
    ['weber','Coach','Brandon William Weber',''],
    ['EsportsRyan','Performance Coach','Ryan Scollan','']],
TL:[['LohaN','Head Coach','Ivo Renato Da Silva Santos Albino','PT'],
    ['yaotziN','Assistant Coach','Daniel Roczniak','PL'],
    ['7Teen','Performance Coach','Tanner Curtis','US'],
    ['cauzed','Manager','Eamon Drea','GB']],
/* ---------------- VCT Pacific ---------------- */
PRX:[['alecks','Coach','Alexandre Sallé','FR'],
     ['Wendler','Assistant Coach','Ashton Wendler','US'],
     ['Panda','Performance Coach','Laijhun Cheng','US'],
     ['Tommy','Team Manager','Kumaresan Ramani','SG']]
};
