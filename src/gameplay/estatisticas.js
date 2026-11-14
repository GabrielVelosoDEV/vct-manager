/* ============================================================
   ESTATÍSTICAS E SIMULAÇÃO SEM TELA (etapa 5)
   Por jogador, como no VLR:
     ACS      pontuação de combate por round: dano + pontos por abate
              (150 com 5 inimigos vivos, 130 com 4 … 70 com 1) + 25 por
              assistência
     K/D/A    abates, mortes, assistências (quem deu dano no morto no
              mesmo round)
     ADR      dano por round
     KAST     % de rounds com abate, assistência, sobrevivência ou troca
              (morreu e o time matou quem o matou em até 3 s)
     FB/FD    primeiro abate e primeira morte do round
     clutch   round ganho sendo o último vivo do time contra 1 ou mais
     multi    rounds com 2, 3, 4 e 5 abates
   GP.simularPartida roda a partida inteira sem tela e devolve o placar,
   os rounds e essas estatísticas — é o que o VCT Manager vai chamar.
   ============================================================ */
'use strict';

GP.PONTOS_ABATE = [0, 70, 90, 110, 130, 150];
GP.TROCA_S = 3;

/* chamado pelo motor a cada dano (para saber quem ajudou no abate) */
GP._registrarDano = function (J, de, alvo) {
  if (!de || !alvo || de.time === alvo.time || J.modo !== 'partida') return;
  (alvo._danoDe || (alvo._danoDe = {}))[de.id] = J.t;
};

GP._novoRoundEstat = function (J) {
  J._estRound = J.round.n; J._clutch = {}; J._mortesRound = [];
  for (const e of J.ents) { e._danoDe = {}; e._rk = 0; e._kast = false; }
};

/* a cada passo da partida: lê os eventos novos */
GP._estatPasso = function (J) {
  if (J._estRound == null) { J._evEst = 0; GP._novoRoundEstat(J); }
  const acha = id => J.ents.find(o => o.id === id);
  for (; J._evEst < J.eventos.length; J._evEst++) {
    const ev = J.eventos[J._evEst];
    if (ev.tipo === 'morte') {
      const de = acha(ev.de), em = acha(ev.em);
      if (!em) continue;
      if (!J._mortesRound.length) em.st.fd = (em.st.fd || 0) + 1;
      if (de && de.time !== em.time) {
        const vivos = J.ents.filter(o => o.vivo && o.time === em.time).length + 1;
        de.st.acsPts = (de.st.acsPts || 0) + GP.PONTOS_ABATE[Math.min(5, vivos)];
        de._rk++; de._kast = true;
        for (const id in em._danoDe || {}) {
          const a = acha(id);
          if (a && a !== de && a.time === de.time) { a.st.assist = (a.st.assist || 0) + 1; a._kast = true; }
        }
        /* troca: quem morreu antes pelas mãos deste agora foi vingado */
        for (const m of J._mortesRound) if (m.de === em.id && ev.t - m.t <= GP.TROCA_S) { const v = acha(m.em); if (v) v._kast = true; }
      }
      J._mortesRound.push({t: ev.t, de: ev.de, em: ev.em});
      /* clutch: sobrou um contra pelo menos um */
      for (const T of ['A', 'B']) {
        const meus = J.ents.filter(o => o.vivo && o.time === T), deles = J.ents.filter(o => o.vivo && o.time !== T);
        if (meus.length === 1 && deles.length >= 1 && !J._clutch[T]) J._clutch[T] = {id: meus[0].id, contra: deles.length};
      }
    } else if (ev.tipo === 'round') {
      for (const e of J.ents) {
        if (e.vivo) e._kast = true;
        e.st.rounds = (e.st.rounds || 0) + 1;
        if (e._kast) e.st.kast = (e.st.kast || 0) + 1;
        if (e._rk >= 2) { const k = 'k' + Math.min(5, e._rk); e.st[k] = (e.st[k] || 0) + 1; }
      }
      for (const T in J._clutch) {
        const c = J._clutch[T], e = acha(c.id); if (!e) continue;
        e.st.clutchTent = (e.st.clutchTent || 0) + 1;
        if (ev.vencedor === T) { e.st.clutches = (e.st.clutches || 0) + 1; (e.st.clutchesDe || (e.st.clutchesDe = [])).push(c.contra); }
      }
      J._clutch = {};
    }
  }
  if (J.round.n !== J._estRound) GP._novoRoundEstat(J);
};

/* a tabela de cada jogador */
GP.estatisticas = function (J) {
  const R = Math.max(1, J.historico.length);
  return J.ents.map(e => {
    const s = e.st, k = s.kills, d = s.mortes, a = s.assist || 0;
    return {
      id: e.id, nome: e.nome, time: e.time, sigla: (J.nomesTimes || {})[e.time], agente: e.agente, papel: e.papel, funcao: e.funcao || null, humano: !e.bot,
      rounds: R, acs: Math.round(((s.acsPts || 0) + s.dano + 25 * a) / R), k, d, a, kd: +(k / Math.max(1, d)).toFixed(2),
      adr: Math.round(s.dano / R), kast: Math.round((s.kast || 0) / R * 100), hs: s.acertos ? Math.round(s.cabecas / s.acertos * 100) : 0,
      fb: s.fb || 0, fd: s.fd || 0, plants: s.plants || 0, desarmes: s.desarmes || 0,
      clutches: s.clutches || 0, clutchTent: s.clutchTent || 0, clutchesDe: s.clutchesDe || [],
      k2: s.k2 || 0, k3: s.k3 || 0, k4: s.k4 || 0, k5: s.k5 || 0,
    };
  });
};

/* o resultado inteiro, no formato que o manager vai ler */
GP.resultadoPartida = function (J) {
  const jog = GP.estatisticas(J);
  const mvp = jog.slice().sort((a, b) => b.acs - a.acs)[0];
  return {
    mapa: J.m.nome, vencedor: J.fim ? J.fim.vencedor : null, placar: {...J.placar}, times: {...(J.nomesTimes || {A: 'A', B: 'B'})},
    rounds: J.historico.map(h => ({n: h.n, vencedor: h.vencedor, ataque: h.atk, como: h.como, plant: h.plant || null, duracao: h.duracao, compra: h.compra, planoAtk: h.nomeAtk, planoDef: h.nomeDef})),
    jogadores: jog, mvp: mvp && mvp.id, tempoDeJogo: Math.round(J.t),
  };
};

/* simula sem tela. o: as opções do montarPartida (mapa, timeA, timeB,
   atribA, atribB, semente…). Devolve GP.resultadoPartida. */
GP.DT_SIMULACAO = 1 / 60;
GP.simularPartida = function (o) {
  const J = GP.montarPartida({tempoCompra: 1, ...o, jogador: false});
  const dt = o.dt || GP.DT_SIMULACAO;
  while (!J.fim && J.t < 4 * 3600) GP.passo(J, dt);
  return GP.resultadoPartida(J);
};
/* a mesma coisa sem travar a tela: anda em pedaços e avisa o progresso */
GP.simularPartidaAos = function (o, aoProgresso) {
  const J = GP.montarPartida({tempoCompra: 1, ...o, jogador: false});
  const dt = o.dt || GP.DT_SIMULACAO;
  return new Promise(ok => {
    const pedaco = () => {
      const ate = performance.now() + 14;
      while (!J.fim && J.t < 4 * 3600 && performance.now() < ate) GP.passo(J, dt);
      if (aoProgresso) aoProgresso(J);
      if (J.fim || J.t >= 4 * 3600) ok(GP.resultadoPartida(J)); else setTimeout(pedaco, 0);
    };
    pedaco();
  });
};
