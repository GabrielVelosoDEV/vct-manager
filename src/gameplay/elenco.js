/* ============================================================
   ELENCOS E COMPS (etapa 4)
   A partida passa a ser entre jogadores do VCT Manager:
     · atributos do manager (mira, reflexo, mov, util, visão, clutch,
       consist, liderança) viram os parâmetros do jogo
     · estilo de jogo sai deles: quem tem mov e reflexo altos é agressivo
       (e só o muito agressivo atravessa smoke); clutch e consistência
       seguram mais
     · utilidade decide a precisão das habilidades
     · liderança do IGL decide quanto o time se adapta round a round
     · a comp sai do meta real de cada mapa (taxa de escolha por mapa) e
       dos mains de cada jogador (data/agentes-reais.js)
   Sem elenco, a comp sai só do meta do mapa.
   ============================================================ */
'use strict';

/* ---------- meta por mapa: taxa de escolha (%) ----------
   Pool de 2026: média de VCT 2026 EMEA Stage 2 e Saudi eLeague 2026 Major 1
   (vlr.gg /event/agents). Fora do pool (Bind, Icebox, Pearl, Fracture,
   Corrode): a última vez que cada um esteve em rotação, com os agentes que
   ainda existem no meta de 2026 (Neon e Omen no lugar de quem caiu). */
GP.META_MAPA = {
  ascent: {sova: 100, omen: 94, jett: 58, cypher: 54, phoenix: 42, neon: 34, killjoy: 30, waylay: 23, vyse: 22, kayo: 20, yoru: 12, astra: 10, brimstone: 8, chamber: 7, veto: 6, harbor: 4, viper: 3},
  split: {omen: 90, viper: 90, neon: 82, fade: 68, raze: 42, skye: 31, waylay: 23, vyse: 22, phoenix: 18, astra: 14, jett: 10, cypher: 8, sage: 6, yoru: 4},
  haven: {omen: 88, sova: 88, neon: 85, cypher: 57, phoenix: 50, viper: 25, killjoy: 25, jett: 20, chamber: 19, fade: 13, vyse: 12, astra: 12, waylay: 10, breach: 10},
  lotus: {omen: 100, fade: 88, raze: 72, viper: 70, neon: 50, vyse: 31, killjoy: 20, cypher: 18, waylay: 12, skye: 12, chamber: 10, jett: 8, brimstone: 8, miks: 4, yoru: 4},
  breeze: {sova: 100, viper: 80, neon: 75, jett: 55, skye: 45, tejo: 35, cypher: 30, phoenix: 30, omen: 20, chamber: 18, brimstone: 15, harbor: 10, kayo: 10, yoru: 5},
  sunset: {omen: 100, neon: 75, sova: 66, cypher: 59, fade: 31, vyse: 31, viper: 28, phoenix: 28, chamber: 25, harbor: 25, waylay: 13, breach: 8, raze: 5},
  summit: {neon: 59, omen: 56, sova: 50, fade: 50, viper: 44, chamber: 38, yoru: 38, cypher: 34, astra: 25, phoenix: 25, tejo: 20, waylay: 16, jett: 13, sage: 9, vyse: 8, raze: 6},
  abyss: {sova: 100, astra: 60, jett: 50, yoru: 50, waylay: 40, omen: 30, phoenix: 30, vyse: 30, tejo: 30, viper: 25, cypher: 15, neon: 10, chamber: 10, killjoy: 10},
  bind: {raze: 80, viper: 60, brimstone: 45, skye: 45, fade: 40, cypher: 40, omen: 30, neon: 30, kayo: 25, killjoy: 20, gekko: 15, yoru: 15, sage: 10, astra: 10, harbor: 5, jett: 5},
  icebox: {viper: 90, sova: 70, killjoy: 40, jett: 35, kayo: 35, neon: 30, gekko: 25, yoru: 25, sage: 25, cypher: 20, omen: 20, harbor: 15, fade: 15, raze: 10, astra: 5, deadlock: 5},
  pearl: {fade: 70, viper: 50, killjoy: 50, jett: 45, neon: 45, astra: 40, omen: 40, cypher: 25, kayo: 25, sova: 20, harbor: 15, yoru: 15, raze: 10, chamber: 10},
  fracture: {raze: 85, breach: 60, fade: 50, cypher: 50, brimstone: 40, neon: 40, killjoy: 30, viper: 25, omen: 20, kayo: 20, chamber: 15, tejo: 10, phoenix: 10},
  corrode: {omen: 70, sova: 60, viper: 55, neon: 55, cypher: 35, vyse: 35, fade: 30, yoru: 30, waylay: 20, astra: 20, jett: 15, tejo: 15, chamber: 15, killjoy: 10, phoenix: 10},
};
GP.metaDe = (mapa, ag) => ((GP.META_MAPA[mapa] || {})[ag] || 0);

/* nome do manager → id da gameplay ('KAY/O' → kayo, 'Mix' → miks) */
GP.idAgente = function (nome) {
  if (!nome) return null;
  const n = String(nome).toLowerCase().replace(/[^a-z]/g, '');
  if (n === 'mix') return 'miks';
  return GP.AGENTES[n] ? n : null;
};
GP.PAPEL_DA_FUNCAO = {Duelista: 'duelista', Iniciador: 'iniciador', Controlador: 'controlador', Sentinela: 'sentinela'};

/* ---------- atributos e estilo ---------- */
/* manager → gameplay */
GP.atribDoManager = at => at ? {mira: at.mira, reflexo: at.reflexo, movimento: at.mov, visao: at.visao, clutch: at.clutch, consistencia: at.consist, utilidade: at.util, lider: at.lider} : {};
/* estilo: base do papel, puxado pelo jeito de jogar (mov e reflexo empurram
   para frente; clutch e consistência seguram) */
GP.estiloDe = function (atrib, papel) {
  const a = atrib || {}, v = k => (a[k] == null ? 70 : a[k]);
  const ag = GP.AGRESSIVO_PAPEL[papel] + 0.006 * (v('movimento') - 72) + 0.004 * (v('reflexo') - 72) - 0.003 * (v('clutch') - 72) - 0.002 * (v('consistencia') - 72);
  return Math.max(0.12, Math.min(0.95, ag));
};

/* atributos de um jogador real que só tem over e função (o elenco do
   arquivo, sem o save do manager): o mesmo perfil por função do manager
   (ROLE_W), com a mão do sorteio fixa pelo nick */
GP._semente = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) || 1; };
GP.atributosDe = function (nick, funcao, over) {
  const W = (typeof ROLE_W !== 'undefined' && (ROLE_W[funcao] || ROLE_W.Flex)) || {mira: .2, reflexo: .15, mov: .12, util: .18, visao: .18, clutch: .09, consist: .08};
  const rnd = GP.rng(GP._semente(nick)), wMax = Math.max(...Object.values(W)), at = {};
  const g = () => (rnd() + rnd() + rnd() - 1.5) / 0.5;
  for (const k of ['mira', 'reflexo', 'mov', 'util', 'visao', 'clutch', 'consist']) at[k] = over - (1 - (W[k] || 0) / wMax) * 30 + g() * 6;
  for (let it = 0; it < 16; it++) {
    let cur = 0; for (const k in W) cur += at[k] * W[k];
    const d = over - cur; if (Math.abs(d) < 0.5) break;
    for (const k in W) at[k] += d * W[k] * 2.2;
  }
  for (const k in at) at[k] = Math.max(25, Math.min(99, Math.round(at[k])));
  at.lider = Math.max(20, Math.min(99, Math.round(over - 8 + g() * 13)));
  return at;
};

/* ---------- times do arquivo ---------- */
GP.timesReais = function () {
  if (typeof ELENCOS_REAIS === 'undefined') return [];
  const nomes = {}, liga = {};
  if (typeof TIMES_REAIS !== 'undefined') for (const reg in TIMES_REAIS) for (const tier of ['t1', 't2']) for (const [nome, sigla] of TIMES_REAIS[reg][tier] || []) { nomes[sigla] = nome; liga[sigla] = {reg, tier}; }
  return Object.keys(ELENCOS_REAIS).filter(s => s !== 'LIVRE' && ELENCOS_REAIS[s].length >= 5)
    .map(s => ({sigla: s, nome: nomes[s] || s, reg: (liga[s] || {}).reg || '?', tier: (liga[s] || {}).tier || 't2'}));
};
/* um time no formato que a partida usa: {nome, sigla, jogadores:[{nome, funcao, at, agentes, over}]} */
GP.timeReal = function (sigla) {
  const lista = typeof ELENCOS_REAIS !== 'undefined' && ELENCOS_REAIS[sigla];
  if (!lista) return null;
  const info = GP.timesReais().find(t => t.sigla === sigla) || {nome: sigla};
  const jogadores = lista.slice(0, 5).map(([nick, funcao, over]) => ({
    nome: nick, funcao, over, at: GP.atributosDe(nick, funcao, over),
    agentes: ((typeof AGENTES_REAIS !== 'undefined' && AGENTES_REAIS[nick]) || []).map(GP.idAgente).filter(Boolean),
  }));
  return {nome: info.nome, sigla, jogadores};
};

/* ---------- a comp ----------
   Sem elenco: sorteia pelo meta do mapa (controlador e iniciador primeiro,
   no máximo dois de cada função). Com elenco: procura a combinação que
   soma melhor meta do mapa + o quanto cada um domina o boneco. */
GP.MAX_POR_PAPEL = 2;
GP._papelDe = ag => GP.AGENTES[ag].papel;
GP.compDoMapa = function (mapa, rnd, fixos) {
  const meta = GP.META_MAPA[mapa] || {}, time = (fixos || []).filter(Boolean).slice(0, 5);
  const conta = p => time.filter(a => GP._papelDe(a) === p).length;
  const sortear = filtro => {
    const op = Object.keys(GP.AGENTES).filter(a => GP.HABS[a] && !time.includes(a) && filtro(a) && conta(GP._papelDe(a)) < GP.MAX_POR_PAPEL);
    const pesos = op.map(a => Math.pow((meta[a] || 0) + 2, 1.4));
    let r = rnd() * pesos.reduce((s, x) => s + x, 0);
    for (let i = 0; i < op.length; i++) { r -= pesos[i]; if (r <= 0) return op[i]; }
    return op[op.length - 1];
  };
  /* quantos de cada função: o que o meta do mapa espera (Split: 2 controladores,
     2 duelistas, 1 iniciador), sorteando a parte quebrada */
  const papeis = ['controlador', 'iniciador', 'duelista', 'sentinela'], esp = {};
  for (const p of papeis) esp[p] = Object.keys(meta).filter(a => GP.AGENTES[a] && GP._papelDe(a) === p).reduce((s, a) => s + meta[a], 0) / 100;
  const tot = papeis.reduce((s, p) => s + esp[p], 0) || 1;
  const quer = {};
  for (const p of papeis) quer[p] = Math.max(p === 'controlador' || p === 'iniciador' ? 1 : 0, Math.min(GP.MAX_POR_PAPEL, Math.floor(esp[p] * 5 / tot)));
  while (papeis.reduce((s, p) => s + quer[p], 0) < 5) {
    const op = papeis.filter(p => quer[p] < GP.MAX_POR_PAPEL), w = op.map(p => Math.max(0.05, esp[p] * 5 / tot - quer[p]));
    let r = rnd() * w.reduce((a, b) => a + b, 0), k = 0;
    for (; k < op.length - 1; k++) { r -= w[k]; if (r <= 0) break; }
    quer[op[k]]++;
  }
  for (const p of papeis) while (time.length < 5 && conta(p) < quer[p]) time.push(sortear(a => GP._papelDe(a) === p));
  while (time.length < 5) time.push(sortear(() => true));
  return time;
};
/* o quanto o jogador domina o agente: o main vale mais (ordem dos mains) */
GP._dominio = function (jog, ag) {
  const i = (jog.agentes || []).indexOf(ag);
  if (i >= 0) return [1, 0.8, 0.65, 0.5, 0.42][i] || 0.35;
  return GP.PAPEL_DA_FUNCAO[jog.funcao] === GP._papelDe(ag) || jog.funcao === 'Flex' ? 0.12 : null;
};
GP.compDoElenco = function (mapa, jogadores, rnd, fixos) {
  const meta = GP.META_MAPA[mapa] || {};
  fixos = fixos || [];
  const opcoes = jogadores.map((j, i) => {
    if (fixos[i]) return [{ag: fixos[i], nota: 0}];
    const cand = new Set([...(j.agentes || []), ...Object.keys(meta).filter(a => GP._dominio(j, a) != null)]);
    /* o mapa pesa mais que o main: ninguém leva Viper para Ascent só porque
       é o boneco dele; agente que quase não aparece no mapa é castigado */
    return [...cand].filter(a => GP.AGENTES[a] && GP.HABS[a]).map(a => ({ag: a, nota: (meta[a] || 0) / 100 * 1.5 + GP._dominio(j, a) * 0.8 - ((meta[a] || 0) < 5 ? 0.5 : 0) + rnd() * 0.1}))
      .filter(o => o.nota > 0.1).sort((a, b) => b.nota - a.nota).slice(0, 7);
  });
  let melhor = null;
  const escolha = [];
  const busca = (i, soma) => {
    if (i === jogadores.length) {
      const pap = escolha.map(GP._papelDe), n = p => pap.filter(x => x === p).length;
      let nota = soma;
      if (!n('controlador')) nota -= 2.6;
      if (!n('iniciador')) nota -= 1.4;
      for (const p of ['duelista', 'iniciador', 'controlador', 'sentinela']) if (n(p) > GP.MAX_POR_PAPEL) nota -= 1.2 * (n(p) - GP.MAX_POR_PAPEL);
      if (!melhor || nota > melhor.nota) melhor = {nota, comp: escolha.slice()};
      return;
    }
    for (const o of opcoes[i]) { if (escolha.includes(o.ag)) continue; escolha.push(o.ag); busca(i + 1, soma + o.nota); escolha.pop(); }
    if (!opcoes[i].length) { const a = GP.compDoMapa(mapa, rnd, escolha).find(x => !escolha.includes(x)); escolha.push(a); busca(i + 1, soma); escolha.pop(); }
  };
  busca(0, 0);
  return melhor ? melhor.comp : GP.compDoMapa(mapa, rnd, fixos);
};

/* o IGL: a liderança mais alta do time (0–1) */
GP.iglDe = (J, time) => Math.max(0, ...J.ents.filter(e => e.time === time).map(e => GP._q(e.atrib.lider)));
