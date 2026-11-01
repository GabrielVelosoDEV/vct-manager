/* ============================================================
   SEMANAS E DATAS
   ------------------------------------------------------------
   Até aqui o tempo do jogo era uma lista de blocos: você apertava
   AVANÇAR e caía no torneio seguinte. Não dava para planejar nada,
   porque não existia "daqui a três semanas" — existia só "o próximo
   campeonato".

   Agora a temporada é um ano de verdade, semana a semana, com data.
   Torneio ocupa um intervalo de semanas; entre um e outro sobra
   tempo, e é nesse tempo que elenco treina, jogador se recupera e
   você decide alguma coisa.

   A semana 1 é a que contém 1º de janeiro. Datas são só para leitura
   — nada no motor depende delas, então fuso e feriado não importam.
   ============================================================ */
const SEMANAS_ANO=52;
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
             'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTO=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/* Segunda-feira da semana N. */
function segundaDaSemana(ano,semana){
  const jan1=Date.UTC(ano,0,1);
  const dow=(new Date(jan1).getUTCDay()+6)%7;      /* 0 = segunda */
  return new Date(jan1-dow*86400000+(clamp(semana,1,SEMANAS_ANO)-1)*7*86400000);
}
function mesDaSemana(ano,semana){
  /* o mês da quinta-feira: é ele que decide a que mês a semana pertence,
     a mesma regra da norma ISO, para uma semana a cavalo não contar duas vezes */
  return new Date(segundaDaSemana(ano,semana).getTime()+3*86400000).getUTCMonth();
}
function rotuloSemana(ano,semana){
  const a=segundaDaSemana(ano,semana), b=new Date(a.getTime()+6*86400000);
  const da=a.getUTCDate(), db=b.getUTCDate();
  const ma=MESES_CURTO[a.getUTCMonth()], mb=MESES_CURTO[b.getUTCMonth()];
  return ma===mb ? `${da}–${db} ${ma}` : `${da} ${ma} – ${db} ${mb}`;
}
function rotuloCurto(ano,semana){
  const a=segundaDaSemana(ano,semana);
  return `${a.getUTCDate()} ${MESES_CURTO[a.getUTCMonth()]}`;
}
/* Intervalo de um torneio, para a ficha dele. */
function rotuloPeriodo(ano,ini,fim){
  const a=segundaDaSemana(ano,ini), b=new Date(segundaDaSemana(ano,fim).getTime()+6*86400000);
  const ma=MESES_CURTO[a.getUTCMonth()], mb=MESES_CURTO[b.getUTCMonth()];
  return ma===mb ? `${a.getUTCDate()}–${b.getUTCDate()} de ${MESES[a.getUTCMonth()].toLowerCase()}`
                 : `${a.getUTCDate()} ${ma} – ${b.getUTCDate()} ${mb}`;
}
/* ---------- janelas de transferência ----------
   Duas por ano, pelo calendário e não pelos torneios: novembro a janeiro
   (atravessa a virada da temporada) e junho a julho. A semana pertence ao
   mês da quinta-feira dela, a mesma regra de mesDaSemana. */
const MESES_JANELA=[10,11,0,5,6];
function janelaAberta(ano,semana){return MESES_JANELA.includes(mesDaSemana(ano,semana));}
/* A semana seguinte, atravessando o ano. */
function proximaSemana(ano,semana){return semana>=SEMANAS_ANO?{ano:ano+1,semana:1}:{ano,semana:semana+1};}
function nomeDaJanela(ano,semana){
  const m=mesDaSemana(ano,semana);
  return m===5||m===6?'janela de junho e julho':'janela de novembro a janeiro';
}
/* Próxima abertura de janela a partir de uma semana (inclusive), para a tela. */
function proximaJanela(ano,semana){
  let a=ano,s=semana;
  for(let i=0;i<SEMANAS_ANO+1;i++){if(janelaAberta(a,s))return{ano:a,semana:s};({ano:a,semana:s}=proximaSemana(a,s));}
  return null;
}
/* Quantas semanas faltam de um intervalo, contando a atual. */
function semanasRestantes(semana,fim){return Math.max(1,fim-semana+1);}
