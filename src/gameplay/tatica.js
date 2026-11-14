/* ============================================================
   TÁTICA DO TIME (etapa 2)
   Em cada round o ataque escolhe um plano e a defesa um setup; cada
   bot ganha uma função dentro dele.

   Ataque   execução  junta perto da entrada e entra em ordem:
                      duelista → iniciador → controlador; sentinela
                      segura o flanco
            default   espalha um por caminho, segura informação e
                      decide o bomb depois (o que tiver menos defensor)
            rush      todos correndo direto, sem esperar
            split     o time se divide em duas entradas do mesmo bomb
                      e entra ao mesmo tempo
            fake      dois fazem barulho no outro bomb; o resto espera
                      calado e entra quando a defesa gira
            lurk      (variação) um sentinela vai sozinho no Shift pelo
                      outro lado, para pegar quem gira
   Defesa   padrão    2-1-2 (ou 1-2-2 com três bombs), em fogo cruzado
                      nas entradas
            stack     mais gente no bomb que o ataque mais planta
            push      um duelista sai cedo para pegar informação
   Giro     quem vê ou ouve dois atacantes num bomb chama; os outros
            giram (as âncoras dos outros bombs ficam)
   Retake   depois do plant a defesa junta num ponto e entra junta;
            o mais perto desarma e os outros cobrem
   O mapa é lido sozinho: as entradas de cada bomb saem do caminho do
   spawn do ataque, e os pontos de defesa são os que enxergam a entrada.
   ============================================================ */
'use strict';

/* ---------- leitura do mapa ---------- */
GP._densa = function (cam, passo = 0.5) {
  const out = [{x: cam[0].x, y: cam[0].y, s: 0}];
  let s = 0;
  for (let i = 1; i < cam.length; i++) {
    const a = cam[i - 1], b = cam[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    for (let d = passo; d <= L; d += passo) { s += passo; out.push({x: a.x + (b.x - a.x) * d / L, y: a.y + (b.y - a.y) * d / L, s}); }
  }
  return out;
};
GP._noCaminho = (D, s) => D.find(p => p.s >= s) || D[D.length - 1];

GP._tatica = function (m) {
  if (m.tatica) return m.tatica;
  GP._prepararPontos(m);
  const n = m.nav, atk = m.spawn.atk, T = {entradas: {}, defesa: {}};
  const salvo = n.livre.slice();
  const bloquear = (x, y, r) => {
    for (let Y = Math.max(0, Math.floor((y - r) / n.passo)); Y <= Math.min(n.H - 1, Math.floor((y + r) / n.passo)); Y++)
      for (let X = Math.max(0, Math.floor((x - r) / n.passo)); X <= Math.min(n.W - 1, Math.floor((x + r) / n.passo)); X++)
        if (Math.hypot((X + 0.5) * n.passo - x, (Y + 0.5) * n.passo - y) <= r) n.livre[Y * n.W + X] = 0;
  };
  for (const L of Object.keys(m.sitios)) {
    const s = m.sitios[L], lista = [];
    for (let k = 0; k < 3; k++) {
      const cam = GP.caminho(m, atk.x, atk.y, s.x, s.y);
      if (!cam || cam.length < 2) break;
      const D = GP._densa(cam);
      let i = D.findIndex(p => GP.sitioEm(m, p.x, p.y) === L);
      if (i < 0) i = D.length - 1;
      const ent = GP._noCaminho(D, Math.max(0, D[i].s - 2)), st = GP._noCaminho(D, Math.max(0, D[i].s - 15));
      if (lista.some(e => Math.hypot(e.x - ent.x, e.y - ent.y) < 9)) break;
      lista.push({x: ent.x, y: ent.y, staging: {x: st.x, y: st.y}, comp: D[i].s});
      bloquear(ent.x, ent.y, 4.5);
    }
    n.livre.set(salvo);
    if (!lista.length) lista.push({x: s.x, y: s.y, staging: GP._pontoLivrePerto(m, (s.x + atk.x) / 2, (s.y + atk.y) / 2), comp: 0});
    T.entradas[L] = lista;
    /* defesa: pontos perto do bomb que enxergam uma entrada a 7–24 m */
    const raio = Math.max(...m.pontosSitio[L].map(p => Math.hypot(p.x - s.x, p.y - s.y))) + 5;
    const cand = [];
    for (let i = 0; i < n.W * n.H; i++) {
      if (!n.livre[i]) continue;
      const x = (i % n.W + 0.5) * n.passo, y = ((i / n.W | 0) + 0.5) * n.passo;
      if (Math.hypot(x - s.x, y - s.y) <= raio) cand.push({x, y});
    }
    const spots = [];
    for (const [k, E] of lista.entries()) {
      const bons = cand.map(c => {
        const d = Math.hypot(c.x - E.x, c.y - E.y);
        if (d < 7 || d > 24 || !GP.linhaLivre(m, c.x, c.y, E.x, E.y)) return null;
        /* encostado em alguma coisa (cobertura) e longe da entrada na medida certa */
        let cob = 0; for (let a = 0; a < 8; a++) if (GP.raio(m, c.x, c.y, a * Math.PI / 4, 1.6) < 1.5) cob++;
        return {...c, nota: -Math.abs(d - 13) * 0.4 + Math.min(cob, 3) + (GP.sitioEm(m, c.x, c.y) === L ? 0.5 : 0), entrada: k, olhar: Math.atan2(E.y - c.y, E.x - c.x)};
      }).filter(Boolean).sort((a, b) => b.nota - a.nota);
      for (const b of bons) { if (spots.some(p => Math.hypot(p.x - b.x, p.y - b.y) < 5)) continue; spots.push(b); if (spots.filter(p => p.entrada === k).length >= 2) break; }
    }
    T.defesa[L] = spots.length ? spots : m.pontosSitio[L].slice(0, 3).map(p => ({...p, olhar: GP._olharPara(m, p, atk), entrada: 0}));
  }
  const ls = Object.values(m.sitios);
  const meio = GP._pontoLivrePerto(m, ls.reduce((a, p) => a + p.x, 0) / ls.length, ls.reduce((a, p) => a + p.y, 0) / ls.length);
  T.meio = {...meio, olhar: GP._olharPara(m, meio, atk)};
  m.tatica = T;
  return T;
};

/* ---------- escolher o plano ---------- */
GP._sortearPeso = function (J, pesos) {
  const tot = Object.values(pesos).reduce((a, b) => a + b, 0);
  let r = J.rnd() * tot;
  for (const k in pesos) { r -= pesos[k]; if (r <= 0) return k; }
  return Object.keys(pesos)[0];
};
GP.NOME_PLANO = {execucao: 'execução', default: 'default', rush: 'rush', split: 'split', fake: 'fake', padrao: 'padrão', stack: 'stack', push: 'push'};

GP._planejarRound = function (J) {
  const m = J.m, T = GP._tatica(m), rnd = J.rnd, letras = Object.keys(m.sitios);
  const atkT = GP._timeAtk(J), defT = GP._timeDef(J);
  const atk = J.ents.filter(e => e.time === atkT), def = J.ents.filter(e => e.time === defT);
  const hist = J.historico.filter(h => h.atk === atkT).slice(-4);
  /* ---- ataque ---- */
  const pesos = J.compra[atkT] === 'eco' ? {rush: 4, execucao: 3, default: 3} : {execucao: 34, default: 24, rush: 10, split: 14, fake: 18};
  /* o IGL lê o round: liderança alta troca de plano quando perde e insiste no
     bomb que está dando certo; liderança baixa quase não se adapta */
  const iglA = GP.iglDe ? GP.iglDe(J, atkT) : 0.5, iglD = GP.iglDe ? GP.iglDe(J, defT) : 0.5;
  for (const h of hist.slice(-2)) if (h.vencedor !== atkT && h.planoAtk && pesos[h.planoAtk]) pesos[h.planoAtk] *= 1 - 0.8 * iglA;
  const tipo = GP._sortearPeso(J, pesos);
  const pesoSitio = {};
  for (const L of letras) pesoSitio[L] = 1;
  for (const h of hist) if (h.alvo && pesoSitio[h.alvo]) pesoSitio[h.alvo] *= h.vencedor === atkT ? 1 + 0.4 * iglA : 1 - 0.55 * iglA;
  const alvo = GP._sortearPeso(J, pesoSitio);
  const outros = letras.filter(L => L !== alvo), outro = outros[Math.floor(rnd() * outros.length)];
  const ordem = {duelista: 0, iniciador: 1, controlador: 2, sentinela: 3};
  const fila = atk.slice().sort((a, b) => ordem[a.papel] - ordem[b.papel]);
  const papeis = {};
  const nEnt = T.entradas[alvo].length, rota = Math.floor(rnd() * nEnt);
  let lurker = null;
  if (['execucao', 'split', 'default'].includes(tipo) && rnd() < 0.35) lurker = fila.slice().reverse().find(e => e.id !== J.spike.dono) || null;
  let fakers = [];
  if (tipo === 'fake') fakers = fila.filter(e => e.id !== J.spike.dono && e !== lurker).slice(0, 2).reverse();
  const funcao = (e, i) => e === lurker ? 'lurk' : fakers.includes(e) ? 'fake' : ['entrada', 'apoio', 'apoio2', 'flanco'][Math.min(3, ordem[e.papel])] || 'apoio2';
  let idxLane = 0;
  const lanes = letras.flatMap(L => T.entradas[L].map((E, k) => ({L, k})));
  fila.forEach((e, i) => {
    const f = funcao(e, i);
    let L = alvo, k = rota;
    if (f === 'lurk' || f === 'fake') { L = outro; k = 0; }
    else if (tipo === 'split' && nEnt > 1) k = i % 2 === 0 ? rota : (rota + 1) % nEnt;
    else if (tipo === 'default') { const ln = lanes[idxLane++ % lanes.length]; L = ln.L; k = ln.k; }
    papeis[e.id] = {f, L, k, atraso: {entrada: 0, apoio: 0.9, apoio2: 1.8, flanco: 2.5, fake: 0, lurk: 0}[f]};
  });
  const formarMax = {execucao: 32, split: 30, fake: 34, default: 30 + rnd() * 12, rush: 0}[tipo];
  /* ---- defesa ---- */
  const contaPlant = {};
  for (const h of J.historico) if (h.plant && h.atk !== defT) contaPlant[h.plant] = (contaPlant[h.plant] || 0) + 1;
  const tipoDef = GP._sortearPeso(J, {padrao: 60, stack: J.historico.length >= 3 ? 10 + 30 * iglD : 8, push: 15});
  const filaDef = def.slice().sort((a, b) => ({sentinela: 0, controlador: 1, iniciador: 2, duelista: 3})[a.papel] - ({sentinela: 0, controlador: 1, iniciador: 2, duelista: 3})[b.papel]);
  let dist;
  if (tipoDef === 'stack') {
    const forte = Object.keys(contaPlant).sort((a, b) => contaPlant[b] - contaPlant[a])[0] || letras[Math.floor(rnd() * letras.length)];
    const resto = letras.filter(L => L !== forte);
    dist = letras.length === 3 ? [forte, forte, forte, resto[0], resto[1]] : [forte, forte, forte, resto[0], resto[0]];
  } else dist = letras.length === 3 ? ['a', 'b', 'c', ...(rnd() < 0.5 ? ['a', 'b'] : ['b', 'c'])] : ['a', 'b', 'a', 'b', rnd() < 0.5 ? 'a' : 'b'];
  const posicao = {}, usados = {}, ancora = {};
  filaDef.forEach((e, i) => {
    const L = dist[i] === 'meio' || m.sitios[dist[i]] ? dist[i] : letras[i % letras.length];
    let spot;
    if (L === 'meio') spot = T.meio;
    else { const lst = T.defesa[L]; usados[L] = (usados[L] || 0); spot = lst[usados[L]++ % lst.length]; }
    posicao[e.id] = {L, spot};
    if (!ancora[L]) ancora[L] = e.id;
  });
  let pusher = null;
  if (tipoDef === 'push') pusher = filaDef.slice().reverse().find(e => e.papel === 'duelista') || filaDef[filaDef.length - 1];
  J.plano = {
    atk: {tipo, alvo, outro, fase: 'formar', papeis, formarMax, tIr: 0, decidido: tipo !== 'default'},
    def: {tipo: tipoDef, posicao, ancora, pusher: pusher && pusher.id, girarPara: null, segurarFora: false},
    avisos: {}, retake: null, alvo,
    nomeAtk: GP.NOME_PLANO[tipo] + (tipo === 'default' ? '' : ' ' + alvo.toUpperCase()) + (lurker ? ' + lurk' : ''),
    nomeDef: GP.NOME_PLANO[tipoDef] + (tipoDef === 'stack' ? ' ' + dist[0].toUpperCase() : ''),
  };
};

/* ---------- o plano andando (a cada 0,5 s) ---------- */
GP._contato = function (J) {
  if (J.t - (J._contatoEm || 0) < 0.5) return;
  J._contatoEm = J.t;
  const m = J.m, P = J.plano, R = J.round, t = J.t, T = GP._tatica(m);
  if (!P || !P.atk) return;
  const atkT = GP._timeAtk(J), defT = GP._timeDef(J);
  const atk = J.ents.filter(e => e.vivo && e.time === atkT), def = J.ents.filter(e => e.vivo && e.time === defT);
  const inicio = R.inicio || t;
  /* defesa: quem viu ou ouviu atacante perto de um bomb avisa o time */
  for (const a of atk) {
    if (!def.some(d => GP.ve(J, d, a) || GP.ouve(J, d, a) || (a.ef && a.ef.revelado > t))) continue;
    let melhor = null;
    for (const L in m.sitios) { const d = Math.min(...T.entradas[L].map(E => Math.hypot(a.x - E.x, a.y - E.y)), Math.hypot(a.x - m.sitios[L].x, a.y - m.sitios[L].y)); if (d < 20 && (!melhor || d < melhor.d)) melhor = {L, d}; }
    if (melhor) (P.avisos[melhor.L] || (P.avisos[melhor.L] = {}))[a.id] = t;
  }
  const conta = L => Object.values(P.avisos[L] || {}).filter(x => t - x < 7).length;
  if (J.spike.estado !== 'plantada') {
    let gira = null;
    for (const L in m.sitios) if (conta(L) >= 2 && (!gira || conta(L) > conta(gira))) gira = L;
    P.def.girarPara = gira;
    /* bomb lotado, ou sem ninguém da defesa vivo lá: quem gira não entra um
       por um — segura do lado de fora e espera o retake */
    const temLa = gira && def.some(d => P.def.posicao[d.id] && P.def.posicao[d.id].L === gira);
    P.def.segurarFora = gira && (conta(gira) >= 3 || !temLa);
  }
  /* ataque: fase do plano */
  const A = P.atk;
  if (A.fase === 'formar') {
    const mortos = J.ents.filter(e => e.time === atkT && !e.vivo).length;
    const contando = atk.filter(e => A.papeis[e.id] && !['lurk', 'fake'].includes(A.papeis[e.id].f));
    const prontos = contando.filter(e => { const p = A.papeis[e.id], E = T.entradas[p.L][p.k]; return Math.hypot(e.x - E.staging.x, e.y - E.staging.y) < 7; }).length;
    let ir = A.tipo === 'rush' || t - inicio > A.formarMax || mortos >= 2;
    if (A.tipo === 'default') ir = t - inicio > A.formarMax || mortos >= 2;
    else if (A.tipo === 'fake') ir = ir || (prontos >= contando.length - 1 && t - inicio > 18);
    else ir = ir || (contando.length && prontos >= contando.length - (contando.length > 2 ? 1 : 0));
    if (ir) {
      if (!A.decidido) {
        /* default: decide agora — o bomb onde viram menos defensor */
        const vistos = {};
        for (const L in m.sitios) vistos[L] = 0;
        for (const a of atk) for (const d of J.ents) if (d.vivo && d.time === defT && GP.ve(J, a, d)) { const L = GP._sitioMaisPerto(m, d); if (L) vistos[L]++; }
        const L = Object.keys(vistos).sort((x, y) => vistos[x] - vistos[y] || (J.rnd() - 0.5))[0];
        A.alvo = P.alvo = L; A.decidido = true;
        P.nomeAtk = 'default → ' + L.toUpperCase() + (Object.values(A.papeis).some(p => p.f === 'lurk') ? ' + lurk' : '');
        for (const e of atk) { const p = A.papeis[e.id]; if (!p || p.f === 'lurk') continue; p.L = L; p.k = GP._entradaMaisPerto(T, L, e); }
      }
      A.fase = 'ir'; A.tIr = t;
    }
  }
  /* retake: junta e entra junto */
  if (J.spike.estado === 'plantada') {
    const sp = J.spike;
    if (!P.retake) {
      const base = def.length ? def.reduce((a, e) => ({x: a.x + e.x / def.length, y: a.y + e.y / def.length}), {x: 0, y: 0}) : m.spawn.def;
      const cam = GP.caminho(m, base.x, base.y, sp.x, sp.y);
      let ponto = {x: sp.x, y: sp.y};
      if (cam) { const D = GP._densa(cam), fim = D[D.length - 1].s; ponto = GP._noCaminho(D, Math.max(0, fim - 17)); }
      P.retake = {fase: 'juntar', ponto, t};
    }
    const Rt = P.retake;
    if (Rt.fase === 'juntar') {
      const longe = def.filter(e => Math.hypot(e.x - sp.x, e.y - sp.y) > 12);
      const juntos = longe.filter(e => Math.hypot(e.x - Rt.ponto.x, e.y - Rt.ponto.y) < 7).length;
      const viagem = Math.hypot(Rt.ponto.x - sp.x, Rt.ponto.y - sp.y) / 6 + GP.SPIKE.desarme + 4;
      if (!atk.length || juntos >= longe.length || sp.explode - t < viagem || t - Rt.t > 22) Rt.fase = 'entrar';
    }
  }
};
GP._sitioMaisPerto = function (m, p) {
  let best = null;
  for (const L in m.sitios) { const d = Math.hypot(p.x - m.sitios[L].x, p.y - m.sitios[L].y); if (d < 26 && (!best || d < best.d)) best = {L, d}; }
  return best && best.L;
};
GP._entradaMaisPerto = function (T, L, e) {
  let k = 0, dm = 1e9;
  T.entradas[L].forEach((E, i) => { const d = Math.hypot(e.x - E.staging.x, e.y - E.staging.y); if (d < dm) { dm = d; k = i; } });
  return k;
};

/* ---------- o objetivo de cada um ---------- */
GP._escolherObjetivo = function (J, e) {
  const m = J.m, sp = J.spike, ia = e.ia, P = J.plano, T = GP._tatica(m), t = J.t;
  const souAtk = e.time === GP._timeAtk(J);
  let ctx, faz;
  const segurar = (p, olhar, modo) => ({x: p.x, y: p.y, acao: 'segurar', olhar, modo});
  const maisPerto = (time, alvo) => J.ents.filter(o => o.vivo && o.time === time).sort((a, b) => Math.hypot(a.x - alvo.x, a.y - alvo.y) - Math.hypot(b.x - alvo.x, b.y - alvo.y))[0];
  if (souAtk) {
    const A = P.atk, p = A.papeis[e.id] || {f: 'apoio', L: A.alvo, k: 0, atraso: 1};
    const E = T.entradas[p.L][Math.min(p.k, T.entradas[p.L].length - 1)];
    if (sp.estado === 'chao' && maisPerto(e.time, sp) === e) { ctx = 'pegar'; faz = () => ({x: sp.x, y: sp.y, acao: 'ir', modo: 'corre'}); }
    else if (sp.estado === 'plantada') {
      ctx = 'posplant';
      faz = () => {
        const cand = [];
        for (let k = 0; k < 50; k++) {
          const a = J.rnd() * Math.PI * 2, r = 7 + J.rnd() * 9, q = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * r, sp.y + Math.sin(a) * r);
          if (!GP.linhaLivre(m, q.x, q.y, sp.x, sp.y)) continue;
          let cob = 0; for (let b = 0; b < 8; b++) if (GP.raio(m, q.x, q.y, b * Math.PI / 4, 1.6) < 1.5) cob++;
          cand.push({...q, nota: cob - Math.abs(r - 11) * 0.2});
        }
        cand.sort((a, b) => b.nota - a.nota);
        const q = cand[Math.floor(J.rnd() * Math.min(3, cand.length))] || {x: sp.x, y: sp.y};
        return segurar(q, Math.atan2(sp.y - q.y, sp.x - q.x), 'anda');
      };
    } else if (p.f === 'lurk') {
      ctx = 'lurk' + p.L;
      faz = () => segurar(E.staging, Math.atan2(E.y - E.staging.y, E.x - E.staging.x), 'anda');
    } else if (p.f === 'fake' && t - (J.round.inicio || t) < 14) {
      ctx = 'fake' + p.L;
      faz = () => ({x: E.x, y: E.y, acao: 'segurar', olhar: Math.atan2(m.sitios[p.L].y - E.y, m.sitios[p.L].x - E.x), modo: 'corre'});
    } else if (A.fase === 'formar' && p.f !== 'fake') {
      ctx = 'formar' + p.L + p.k;
      faz = () => segurar(E.staging, Math.atan2(E.y - E.staging.y, E.x - E.staging.x), Math.hypot(e.x - E.staging.x, e.y - E.staging.y) > 25 ? 'corre' : 'anda');
    } else if (sp.estado === 'carregada' && sp.dono === e.id) {
      /* quem leva a spike entra por último e planta quando o bomb estiver limpo */
      const limpo = t - A.tIr > 2.5 && !J.ents.some(o => o.vivo && o.time !== e.time && J.ents.some(a => a.vivo && a.time === e.time && GP.ve(J, a, o)));
      ctx = limpo ? 'plantar' + A.alvo : 'esperar' + A.alvo;
      faz = limpo ? () => ({...GP._sortear(J, m.pontosSitio[A.alvo]), acao: 'plantar', modo: 'corre'})
        : () => segurar(T.entradas[A.alvo][0], GP._olharPara(m, T.entradas[A.alvo][0], m.sitios[A.alvo]), 'anda');
    } else if (p.f === 'flanco') {
      ctx = 'flanco' + p.L;
      faz = () => segurar(E.staging, Math.atan2(E.staging.y - E.y, E.staging.x - E.x) + Math.PI, 'anda');
    } else if (t < A.tIr + (p.atraso || 0)) {
      ctx = 'formar' + p.L + p.k;
      faz = () => segurar(E.staging, Math.atan2(E.y - E.staging.y, E.x - E.staging.x), 'anda');
    } else {
      ctx = 'entrar' + A.alvo;
      faz = () => { const q = GP._sortear(J, m.pontosSitio[A.alvo]); return segurar(q, GP._olharPara(m, q, m.spawn.def), 'corre'); };
    }
  } else {
    const D = P.def, pos = D.posicao[e.id] || {L: Object.keys(m.sitios)[0], spot: T.meio};
    const vivosDef = J.ents.filter(o => o.vivo && o.time === e.time).length, vivosAtk = J.ents.filter(o => o.vivo && o.time !== e.time).length;
    if (sp.estado === 'plantada' && vivosDef <= vivosAtk - 2 && Math.hypot(e.x - sp.x, e.y - sp.y) > 10) {
      /* retake sem chance: salva a arma longe da spike */
      ctx = 'salvar';
      faz = () => { const q = GP._antesDe(m, sp, m.spawn.def, 8); return segurar(q, Math.atan2(sp.y - q.y, sp.x - q.x), 'anda'); };
    } else if (sp.estado === 'plantada') {
      const Rt = P.retake, perto = Math.hypot(e.x - sp.x, e.y - sp.y) < 12;
      if (!Rt || Rt.fase === 'entrar' || !J.ents.some(o => o.vivo && o.time !== e.time)) {
        const quem = maisPerto(e.time, sp);
        ctx = quem === e ? 'desarmar' : 'retake';
        faz = quem === e ? () => ({x: sp.x, y: sp.y, acao: 'desarmar', modo: 'corre'})
          : () => { const a = J.rnd() * Math.PI * 2, q = GP._pontoLivrePerto(m, sp.x + Math.cos(a) * 4, sp.y + Math.sin(a) * 4); return segurar(q, Math.atan2(sp.y - q.y, sp.x - q.x) + Math.PI, 'corre'); };
      } else if (perto) {
        ctx = 'escondido'; faz = () => segurar(e, Math.atan2(sp.y - e.y, sp.x - e.x), 'anda');   /* já está perto: espera o time calado */
      } else {
        ctx = 'juntar'; faz = () => segurar(Rt.ponto, Math.atan2(sp.y - Rt.ponto.y, sp.x - Rt.ponto.x), 'corre');
      }
    } else if (D.pusher === e.id && t - (J.round.inicio || t) < 18 && !ia.vista) {
      const E = T.entradas[pos.L === 'meio' ? Object.keys(m.sitios)[0] : pos.L][0];
      ctx = 'push'; faz = () => segurar(E.staging, GP._olharPara(m, E.staging, m.spawn.atk), 'anda');
    } else if (D.girarPara && D.girarPara !== pos.L && P.def.ancora[pos.L] !== e.id) {
      const L = D.girarPara;
      if (D.segurarFora) {
        /* bomb lotado: segura do lado de fora, no caminho do retake */
        ctx = 'girarFora' + L;
        faz = () => {
          const cam = GP.caminho(m, e.x, e.y, m.sitios[L].x, m.sitios[L].y);
          let q = m.sitios[L];
          if (cam) { const Dn = GP._densa(cam), fim = Dn[Dn.length - 1].s; q = GP._noCaminho(Dn, Math.max(0, fim - 16)); }
          return segurar(q, Math.atan2(m.sitios[L].y - q.y, m.sitios[L].x - q.x), 'corre');
        };
      } else {
        ctx = 'girar' + L;
        faz = () => { const lst = T.defesa[L], q = lst[Math.floor(J.rnd() * lst.length)]; return segurar(q, q.olhar, 'corre'); };
      }
    } else {
      ctx = 'segurar' + pos.L;
      faz = () => segurar(pos.spot, pos.spot.olhar, 'corre');
    }
  }
  if (ia.ctx !== ctx || !ia.obj) { ia.ctx = ctx; ia.obj = faz(); ia.caminho = null; }
  if (ia.obj && (ctx === 'pegar' || ctx === 'desarmar')) { ia.obj.x = sp.x; ia.obj.y = sp.y; }
};
