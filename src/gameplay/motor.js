/* ============================================================
   GAMEPLAY · O MOTOR DA PARTIDA (visão de cima)
   Sem DOM. Cada quadro: os comandos (teclado ou IA) viram
   movimento, tiro, dano, som. Unidades: metros, segundos, graus
   só onde está escrito "graus".

   Os atributos do jogador (0–100, os mesmos do modo gestão)
   mudam o jogo de verdade:
     mira        → erro do tiro (e o erro de mira do bot)
     reflexo     → tempo de reação do bot e a velocidade de virar
     movimento   → velocidade e o quanto para rápido (contra-strafe)
     visao       → o bot percebe mais rápido quem surge pelo lado ou por trás
     clutch      → controle da rajada
     consistencia→ o quanto o bot oscila de um duelo para outro
   ============================================================ */
var GP = (typeof GP !== 'undefined' && GP) || {};

GP.RAIO_CORPO = 0.42;        /* o que leva tiro */
GP.RAIO_COLISAO = 0.32;      /* o que bate na parede: menor, passa nas portas sem enganchar */
GP.ZONA_CABECA = 0.11;      /* distância do centro (m) que conta cabeça */
GP.ZONA_CORPO = 0.31;
GP.ALCANCE_SOM = 15;        /* passos correndo se ouvem até aqui */
GP.ALCANCE_VISTA = 70;

GP._q = v => Math.max(0, Math.min(1, ((v == null ? 60 : v) - 40) / 55));
GP.parametros = function (a) {
  a = a || {};
  const mira = GP._q(a.mira), ref = GP._q(a.reflexo), mov = GP._q(a.movimento);
  const vis = GP._q(a.visao), clu = GP._q(a.clutch), con = GP._q(a.consistencia);
  return {
    erroMult: 1.3 - 0.55 * mira,
    reacao: 0.46 - 0.26 * ref,             /* bot: do inimigo aparecer ao 1º tiro (s) */
    giro: 260 + 700 * ref,                 /* graus/s que o bot consegue virar */
    velMult: 0.96 + 0.08 * mov,
    acel: 26 + 26 * mov,                   /* m/s² para parar ou arrancar */
    fov: 360,                              /* sem cone: todo mundo enxerga em volta */
    periferia: 0.28 - 0.22 * vis,          /* bot: atraso extra se o alvo surge fora da frente dele */
    rajadaMult: 1.25 - 0.5 * clu,
    erroMira: 0.8 - 0.45 * mira,           /* bot: erro inicial (m) ao achar o alvo */
    erroPiso: 0.07 + 0.16 * (1 - mira),    /* bot: tremida que nunca some (menos tiro na cabeça) */
    ajuste: 0.75 - 0.4 * mira,             /* bot: tempo para corrigir a mira (s) */
    disciplina: 0.35 + 0.6 * clu,          /* bot: quanto segura a rajada */
    contraStrafe: 0.35 + 0.6 * mov,        /* bot: chance de parar antes de atirar */
    variacao: 0.35 - 0.3 * con,
  };
};

/* ---------- entidades ---------- */
GP.criarAgente = function (o) {
  const p = GP.parametros(o.atrib);
  const arma = id => ({id, municao: GP.ARMAS[id].pente, reserva: GP.ARMAS[id].reserva});
  return {
    id: o.id, nome: o.nome || o.id, time: o.time, bot: !!o.bot, passivo: !!o.passivo, agente: o.agente || null,
    atrib: o.atrib || {}, p,
    x: 0, y: 0, vx: 0, vy: 0, ang: 0, raio: GP.RAIO_CORPO, raioCol: GP.RAIO_COLISAO,
    hp: 100, escudo: GP.ESCUDOS[o.escudo || 'pesado'], vivo: true,
    armas: {primaria: o.primaria ? arma(o.primaria) : null, secundaria: arma(o.secundaria || 'classic')},
    slot: o.primaria ? 'primaria' : 'secundaria',
    proxTiro: 0, recarregaAte: 0, equipaAte: 0, spray: 0, ultimoTiro: -9, passoEm: 0,
    modo: 'corre', luneta: false,
    cmd: {mx: 0, my: 0, ang: 0, atirar: false, modo: 'corre'},
    ia: o.bot ? {estado: 'patrulha', caminho: null, alvoPonto: null, vista: null, ouviu: null,
      reacaoAte: 0, errX: 0, errY: 0, rajada: 0, pausaAte: 0, strafe: 0, strafeAte: 0,
      seguraAte: 0, agressivo: o.agressivo == null ? 0.5 : o.agressivo, repensa: 0, travado: 0} : null,
    st: {kills: 0, mortes: 0, tiros: 0, acertos: 0, cabecas: 0, dano: 0, reacoes: []},
  };
};
GP.armaDe = e => e.armas[e.slot];
GP.defArma = e => GP.ARMAS[GP.armaDe(e).id];

GP.novoJogo = function (o) {
  const m = GP.carregarMapa(o.mapa);
  return {
    m, rnd: GP.rng(o.semente || 1), t: 0, ents: [], tiros: [], sons: [], eventos: [], marcas: [],
    modo: o.modo || 'duelo', opc: o, placar: {}, round: {n: 0, fase: 'pre', ate: 0, vencedor: null},
    fim: null,
  };
};

/* ---------- visão ----------
   a enxerga b: dentro do alcance e com linha livre, para qualquer lado
   (sem cone de visão: o mapa é todo visível e a parede é que esconde) */
GP.angDif = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
GP.ve = function (J, a, b) {
  if (!a.vivo || !b.vivo) return false;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  if (d > GP.ALCANCE_VISTA * (a.luneta ? 1.4 : 1)) return false;
  /* linha livre até o centro ou até uma das bordas do corpo */
  if (GP.linhaLivre(J.m, a.x, a.y, b.x, b.y)) return true;
  const px = -dy / d * b.raio * 0.9, py = dx / d * b.raio * 0.9;
  return GP.linhaLivre(J.m, a.x, a.y, b.x + px, b.y + py) || GP.linhaLivre(J.m, a.x, a.y, b.x - px, b.y - py);
};

/* ---------- erro do próximo tiro (graus) ---------- */
GP.erroAtual = function (e, t) {
  const A = GP.defArma(e), er = A.erro;
  const vel = Math.hypot(e.vx, e.vy), frac = Math.min(1, vel / 5.4);
  let base = (A.luneta && e.luneta) ? er.mira : er.base;
  /* andando devagar pesa pouco; correndo, tudo */
  let erro = base + er.mov * Math.pow(frac, 1.6) + e.spray;
  if (e.modo === 'agacha' && vel < 0.5) erro *= 0.82;
  /* susto: logo que um inimigo aparece, a mão ainda não firmou — passa no
     tempo de reação do atributo (reflexo alto = firma quase na hora) */
  if (e._susto && t != null && t < e._susto.ini + e._susto.dur) erro += e._susto.forca * (1 - (t - e._susto.ini) / e._susto.dur);
  return erro * e.p.erroMult;
};

/* ---------- um quadro ---------- */
GP.passo = function (J, dt) {
  J.t += dt;
  for (const e of J.ents) if (e.vivo) {
    if (e.bot) GP.iaPensar(J, e, dt);
    GP._aplicarComando(J, e, dt);
  }
  /* limpa o que já passou */
  J.tiros = J.tiros.filter(t => J.t - t.t < 0.25);
  J.sons = J.sons.filter(s => J.t - s.t < 1.2);
  J.marcas = J.marcas.filter(s => J.t - s.t < 0.9);
  GP._fluxoDoRound(J);
};

GP._aplicarComando = function (J, e, dt) {
  const c = e.cmd, A = GP.defArma(e), arma = GP.armaDe(e);
  e.modo = c.modo || 'corre';
  e.luneta = !!(A.luneta && c.luneta);
  /* velocidade-alvo e aceleração (parar rápido = contra-strafe) */
  let mx = c.mx || 0, my = c.my || 0;
  const n = Math.hypot(mx, my); if (n > 1) { mx /= n; my /= n; }
  let vmax = GP.VEL[e.modo] * A.velMult * e.p.velMult;
  if (e.luneta) vmax = Math.min(vmax, GP.VEL.anda * 0.8);
  const tx = mx * vmax, ty = my * vmax;
  const dvx = tx - e.vx, dvy = ty - e.vy, dv = Math.hypot(dvx, dvy);
  const passo = e.p.acel * dt;
  if (dv <= passo) { e.vx = tx; e.vy = ty; } else { e.vx += dvx / dv * passo; e.vy += dvy / dv * passo; }
  const bat = GP.mover(J.m, e, e.vx * dt, e.vy * dt);
  if (bat) {
    /* bateu: tira só a parte da velocidade que vai contra a parede; o resto
       continua (desliza na parede em vez de grudar) */
    const l = Math.hypot(bat.nx, bat.ny);
    if (l > 1e-9) {
      const nx = bat.nx / l, ny = bat.ny / l, vn = e.vx * nx + e.vy * ny;
      if (vn < 0) { e.vx -= vn * nx; e.vy -= vn * ny; }
    }
  }
  if (!e.bot) e.ang = c.ang;
  /* passos: correndo faz barulho */
  const vel = Math.hypot(e.vx, e.vy);
  if (e.modo === 'corre' && vel > 4 && J.t - e.passoEm > 0.32) {
    e.passoEm = J.t;
    J.sons.push({x: e.x, y: e.y, t: J.t, dono: e.id, time: e.time, r: GP.ALCANCE_SOM});
  }
  /* rajada esfria */
  e.spray = Math.max(0, e.spray - dt * (A.erro.max / Math.max(0.1, A.erro.recupera)) * 0.9);
  /* troca, recarga, tiro */
  if (c.trocar && c.trocar !== e.slot && e.armas[c.trocar]) {
    e.slot = c.trocar; e.equipaAte = J.t + GP.ARMAS[e.armas[c.trocar].id].equipa; e.recarregaAte = 0; e.spray = 0;
  }
  c.trocar = null;
  const arm = GP.armaDe(e), Ad = GP.defArma(e);
  if (e.recarregaAte && J.t >= e.recarregaAte) {
    const falta = Ad.pente - arm.municao, vem = Math.min(falta, arm.reserva);
    arm.municao += vem; arm.reserva -= vem; e.recarregaAte = 0;
  }
  if ((c.recarregar || (arm.municao === 0 && c.atirar)) && !e.recarregaAte && arm.municao < Ad.pente && arm.reserva > 0) {
    e.recarregaAte = J.t + Ad.recarga; e.luneta = false;
  }
  c.recarregar = false;
  if (c.atirar && J.t >= e.proxTiro && J.t >= e.equipaAte && !e.recarregaAte && arm.municao > 0 && !e.passivo) {
    GP._atirar(J, e);
    if (!Ad.auto) c.atirar = false;   /* semi: um clique, um tiro */
  }
};

GP._gauss = function (rnd) { return (rnd() + rnd() + rnd() - 1.5) / 0.5; };   /* ~N(0,1) aproximado */

GP._atirar = function (J, e) {
  const Ad = GP.defArma(e), arm = GP.armaDe(e);
  const erro = GP.erroAtual(e, J.t);
  const ang = e.ang + GP._gauss(J.rnd) * (erro / 2) * Math.PI / 180;
  arm.municao--; e.proxTiro = J.t + 1 / Ad.cadencia; e.ultimoTiro = J.t; e.st.tiros++;
  e.spray = Math.min(Ad.erro.max, e.spray + Ad.erro.rajada * e.p.rajadaMult);
  if (Ad.luneta) e.luneta = false;
  /* o tiro sai da frente do corpo */
  const ox = e.x + Math.cos(ang) * 0.3, oy = e.y + Math.sin(ang) * 0.3;
  const dParede = GP.raio(J.m, ox, oy, ang, 120);
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let alvo = null, tAlvo = dParede, pAlvo = 0;
  for (const o of J.ents) {
    if (o === e || !o.vivo || o.time === e.time) continue;
    const rx = o.x - ox, ry = o.y - oy, t = rx * dx + ry * dy;
    if (t <= 0 || t >= tAlvo) continue;
    const p = Math.abs(rx * dy - ry * dx);
    if (p < o.raio) { alvo = o; tAlvo = t; pAlvo = p; }
  }
  /* primeiro tiro depois de ver o inimigo: mede a reação de quem atira */
  if (e._viuEm && !e._reagiu) { e.st.reacoes.push(J.t - e._viuEm); e._reagiu = true; }
  if (Math.hypot(e.vx, e.vy) > 3) e.st.tirosCorrendo = (e.st.tirosCorrendo || 0) + 1;
  if (e.spray > Ad.erro.max * 0.6) e.st.tirosAbertos = (e.st.tirosAbertos || 0) + 1;
  J.tiros.push({x0: ox, y0: oy, x1: ox + dx * tAlvo, y1: oy + dy * tAlvo, t: J.t, dono: e.id, time: e.time, acertou: !!alvo});
  J.eventos.push({tipo: 'tiro', t: J.t, dono: e.id, x: e.x, y: e.y});
  /* tiro faz barulho longe */
  J.sons.push({x: e.x, y: e.y, t: J.t, dono: e.id, time: e.time, r: 45, tiro: true});
  if (!alvo) { J.marcas.push({x: ox + dx * tAlvo, y: oy + dy * tAlvo, t: J.t, tipo: 'parede'}); return; }
  const parte = pAlvo < GP.ZONA_CABECA ? 0 : pAlvo < GP.ZONA_CORPO ? 1 : 2;
  const dano = GP.danoArma(Ad, tAlvo, parte);
  GP._dano(J, e, alvo, dano, parte, Ad);
};

GP._dano = function (J, de, alvo, dano, parte, Ad) {
  /* o escudo segura 2/3 do dano enquanto durar */
  const antes = alvo.hp + alvo.escudo;
  const absorve = Math.min(alvo.escudo, dano * 0.66);
  alvo.escudo -= absorve;
  alvo.hp -= dano - absorve;
  de.st.acertos++; if (parte === 0) de.st.cabecas++;
  de.st.dano += Math.round(Math.min(dano, antes));
  J.marcas.push({x: alvo.x, y: alvo.y, t: J.t, tipo: 'acerto', parte, dano: Math.round(dano), de: de.id, em: alvo.id});
  if (alvo.bot && alvo.ia) { alvo.ia.ouviu = {x: de.x, y: de.y, t: J.t}; }
  if (alvo.hp <= 0) {
    alvo.hp = 0; alvo.vivo = false; alvo.st.mortes++; de.st.kills++; alvo._morreuEm = J.t;
    J.eventos.push({tipo: 'morte', t: J.t, de: de.id, em: alvo.id, arma: Ad.nome, cabeca: parte === 0});
  }
};

/* ============================================================
   A IA DO DUELO
   Patrulha → escuta → vê → reage (tempo de reação do atributo) →
   para (se for disciplinado) → atira com a mira se corrigindo.
   ============================================================ */
GP._inimigos = (J, e) => J.ents.filter(o => o.vivo && o.time !== e.time);

GP.iaPensar = function (J, e, dt) {
  const ia = e.ia, c = e.cmd, rnd = J.rnd, p = e.p;
  if (J.round.fase !== 'ativo') { c.mx = c.my = 0; c.atirar = false; return; }
  /* percepção */
  let alvo = null, dAlvo = 1e9;
  for (const o of GP._inimigos(J, e)) {
    if (!GP.ve(J, e, o)) continue;
    const d = Math.hypot(o.x - e.x, o.y - e.y);
    if (d < dAlvo) { alvo = o; dAlvo = d; }
  }
  for (const s of J.sons) {
    if (s.time === e.time || J.t - s.t > dt * 1.5) continue;
    const d = Math.hypot(s.x - e.x, s.y - e.y);
    if (d < s.r) ia.ouviu = {x: s.x + GP._gauss(rnd) * (s.tiro ? 1.5 : 2.5), y: s.y + GP._gauss(rnd) * (s.tiro ? 1.5 : 2.5), t: J.t};
  }
  if (alvo) {
    const novo = !ia.vista || J.t - ia.vista.t > 0.7 || ia.vista.id !== alvo.id;
    if (novo) {
      /* achou agora: reação + erro de mira inicial (maior longe e se o alvo corre) */
      const var_ = 1 + GP._gauss(rnd) * p.variacao;
      /* aparecer pelas costas ou pelo lado demora mais para perceber */
      const fora = Math.abs(GP.angDif(e.ang, Math.atan2(alvo.y - e.y, alvo.x - e.x))) > 0.6;
      ia.reacaoAte = J.t + Math.max(0.12, p.reacao * var_ * (0.9 + 0.2 * rnd())) + (fora ? p.periferia : 0);
      const mag = p.erroMira * (0.6 + dAlvo / 30) * Math.max(0.5, var_);
      const a = rnd() * Math.PI * 2;
      ia.errX = Math.cos(a) * mag; ia.errY = Math.sin(a) * mag;
      ia.rajada = 0;
    }
    ia.vista = {id: alvo.id, x: alvo.x, y: alvo.y, t: J.t};
    ia.estado = 'combate';
  } else if (ia.vista && J.t - ia.vista.t < 4) ia.estado = 'cacar';
  else if (ia.ouviu && J.t - ia.ouviu.t < 5) ia.estado = 'alerta';
  else ia.estado = 'patrulha';

  c.atirar = false;
  c.luneta = false;
  const A = GP.defArma(e), arm = GP.armaDe(e);
  /* sem bala e sem inimigo à vista: recarrega */
  if (!alvo && arm.municao < GP.ARMAS[arm.id].pente * 0.5 && arm.reserva > 0) c.recarregar = true;
  if (arm.municao === 0 && arm.reserva === 0 && e.armas.secundaria && e.slot !== 'secundaria') c.trocar = 'secundaria';

  if (ia.estado === 'combate') {
    /* mira: o erro some aos poucos (o tempo de ajuste vem da mira) */
    const k = Math.exp(-dt / Math.max(0.05, p.ajuste));
    ia.errX *= k; ia.errY *= k;
    /* alvo andando pesa: o bot mira um pouco atrás */
    const lead = 0.12 * (1 - GP._q(e.atrib.mira));
    const sem = (e.id.length * 1.7) % 6.28, tr = p.erroPiso;
    const ax = alvo.x - alvo.vx * lead + ia.errX + Math.cos(J.t * 5.3 + sem) * tr, ay = alvo.y - alvo.vy * lead + ia.errY + Math.sin(J.t * 4.1 + sem * 2) * tr;
    GP._virarPara(e, Math.atan2(ay - e.y, ax - e.x), p.giro, dt);
    const mira = Math.abs(GP.angDif(e.ang, Math.atan2(ay - e.y, ax - e.x)));
    const podeAtirar = J.t >= ia.reacaoAte && mira < 0.12;
    /* movimento: para para atirar, ou faz o "AD" entre rajadas */
    const parado = rnd() < p.contraStrafe;
    if (podeAtirar) {
      if (J.t < ia.pausaAte) {
        GP._strafe(J, e, dt, alvo);
      } else {
        c.mx = parado ? 0 : c.mx * 0.5; c.my = parado ? 0 : c.my * 0.5; c.modo = 'anda';
        const vel = Math.hypot(e.vx, e.vy);
        const pronto = vel < 1.2 || rnd() > p.contraStrafe;   /* o disciplinado espera parar */
        /* longe, ou rajada já aberta: dá tiro a tiro */
        const limiteRajada = (dAlvo > 22 ? 0.7 : 1.8) / Math.max(0.3, p.disciplina) * (A.tipo === 'smg' ? 1.6 : 1);
        if (pronto && e.spray <= limiteRajada) { c.atirar = true; ia.rajada++; }
        if (ia.rajada >= (dAlvo > 22 ? 2 : 4 + Math.floor(rnd() * 4))) {
          ia.rajada = 0; ia.pausaAte = J.t + 0.18 + rnd() * 0.25; ia.strafe = rnd() < 0.5 ? -1 : 1;
        }
      }
    } else {
      c.mx = 0; c.my = 0; c.modo = 'anda';
    }
    if (A.luneta && J.t >= ia.reacaoAte - 0.15) c.luneta = true;
    ia.caminho = null;
    return;
  }
  /* sem alvo à vista */
  let destino = null, modo = 'corre';
  if (ia.estado === 'cacar') { destino = ia.vista; modo = 'anda'; }
  else if (ia.estado === 'alerta') {
    /* ouviu: o agressivo vai atrás andando, o cauteloso segura o ângulo */
    if (ia.agressivo > 0.45 || J.t > ia.seguraAte + 6) { destino = ia.ouviu; modo = 'anda'; }
    else {
      if (J.t > ia.seguraAte) ia.seguraAte = J.t + 2.5 + rnd() * 3;
      GP._virarPara(e, Math.atan2(ia.ouviu.y - e.y, ia.ouviu.x - e.x), p.giro * 0.5, dt);
      c.mx = c.my = 0; c.modo = 'agacha';
      return;
    }
  } else {
    if (!ia.alvoPonto || Math.hypot(ia.alvoPonto.x - e.x, ia.alvoPonto.y - e.y) < 2.5 || J.t > ia.repensa) {
      ia.alvoPonto = GP._pontoDePatrulha(J, e); ia.caminho = null; ia.repensa = J.t + 18;
    }
    destino = ia.alvoPonto;
    /* perto de onde costuma ter briga, anda em silêncio */
    modo = J.t % 9 < 3 && ia.agressivo < 0.7 ? 'anda' : 'corre';
  }
  GP._irPara(J, e, destino, modo, dt);
};

GP._virarPara = function (e, ang, giroGraus, dt) {
  const d = GP.angDif(e.ang, ang), max = giroGraus * Math.PI / 180 * dt;
  e.ang += Math.abs(d) <= max ? d : Math.sign(d) * max;
};
GP._strafe = function (J, e, dt, alvo) {
  const a = Math.atan2(alvo.y - e.y, alvo.x - e.x) + Math.PI / 2 * e.ia.strafe;
  e.cmd.mx = Math.cos(a); e.cmd.my = Math.sin(a); e.cmd.modo = 'corre';
};
GP._irPara = function (J, e, alvo, modo, dt) {
  const ia = e.ia, c = e.cmd;
  if (!alvo) { c.mx = c.my = 0; return; }
  if (!ia.caminho || !ia.caminho.length || ia.caminhoPara !== alvo || J.t > ia.caminhoAte) {
    ia.caminho = GP.caminho(J.m, e.x, e.y, alvo.x, alvo.y) || [];
    ia.caminhoPara = alvo; ia.caminhoAte = J.t + 2.5;
  }
  while (ia.caminho.length && Math.hypot(ia.caminho[0].x - e.x, ia.caminho[0].y - e.y) < 0.7) ia.caminho.shift();
  const prox = ia.caminho[0];
  if (!prox) { c.mx = c.my = 0; return; }
  const dx = prox.x - e.x, dy = prox.y - e.y, d = Math.hypot(dx, dy);
  c.mx = dx / d; c.my = dy / d; c.modo = modo;
  /* olha para onde vai, com um pouco de antecipação de esquina */
  const olhar = ia.caminho[1] && d < 3 ? Math.atan2(ia.caminho[1].y - e.y, ia.caminho[1].x - e.x) : Math.atan2(dy, dx);
  GP._virarPara(e, olhar, e.p.giro * 0.6, dt);
  /* travou numa quina: refaz o caminho */
  if (Math.hypot(e.vx, e.vy) < 0.3) { ia.travado += dt; if (ia.travado > 0.6) { ia.caminho = null; ia.travado = 0; } }
  else ia.travado = 0;
};
GP._pontoDePatrulha = function (J, e) {
  const m = J.m, ini = GP._inimigos(J, e);
  /* no duelo, a IA tende a ir para onde o rival está (sem saber exatamente):
     uma área perto dele, ou um bomb */
  const cands = m.areas.length ? m.areas : [GP.pontoLivre(m, J.rnd)];
  if (ini.length && J.rnd() < 0.55) {
    const o = ini[0];
    const perto = cands.slice().sort((a, b) => Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(b.x - o.x, b.y - o.y));
    return perto[Math.floor(J.rnd() * Math.min(4, perto.length))];
  }
  return cands[Math.floor(J.rnd() * cands.length)];
};

/* ============================================================
   MODOS
   duelo  — 1 contra 1, round a round, primeiro a N
   alvos  — treino: bots que só andam; 60 s, conta abates
   ============================================================ */
GP.montarDuelo = function (o) {
  const J = GP.novoJogo(o);
  const eu = GP.criarAgente({id: 'eu', nome: o.nome || 'Você', time: 'eu', atrib: o.atribEu, agente: o.agenteEu,
    primaria: o.arma === 'classic' ? null : o.arma, secundaria: 'classic', escudo: o.escudo || 'pesado'});
  const n = o.modo === 'alvos' ? 4 : 1;
  for (let i = 0; i < n; i++) {
    J.ents.push(GP.criarAgente({id: 'bot' + i, nome: o.nomesBot ? o.nomesBot[i] : 'Bot ' + (i + 1), time: 'eles', bot: true,
      passivo: o.modo === 'alvos', atrib: o.atribBot, primaria: o.armaBot || o.arma, secundaria: 'classic',
      agente: o.agentesBot ? o.agentesBot[i % o.agentesBot.length] : null,
      escudo: o.modo === 'alvos' ? 'nenhum' : (o.escudo || 'pesado'), agressivo: o.agressivo}));
  }
  J.ents.unshift(eu);
  J.eu = eu;
  J.placar = {eu: 0, eles: 0};
  J.alvoRounds = o.rounds || 7;
  J.duracaoRound = o.modo === 'alvos' ? 60 : 100;
  GP.novoRound(J);
  return J;
};

GP._posicoesDoRound = function (J) {
  const m = J.m, rnd = J.rnd, o = J.opc;
  if (o.spawns === 'oficiais' && m.spawn) {
    const lado = J.round.n % 2 === 1 ? ['atk', 'def'] : ['def', 'atk'];
    return [m.spawn[lado[0]], m.spawn[lado[1]]];
  }
  /* duelo rápido: dois pontos a 22–45 m de caminho, sem se ver */
  for (let t = 0; t < 300; t++) {
    const a = m.areas.length ? m.areas[Math.floor(rnd() * m.areas.length)] : GP.pontoLivre(m, rnd);
    const b = m.areas.length ? m.areas[Math.floor(rnd() * m.areas.length)] : GP.pontoLivre(m, rnd);
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 20 || d > 42 || GP.linhaLivre(m, a.x, a.y, b.x, b.y)) continue;
    const cam = GP.caminho(m, a.x, a.y, b.x, b.y);
    if (!cam) continue;
    return [a, b];
  }
  return [GP.pontoLivre(m, rnd), GP.pontoLivre(m, rnd)];
};

GP.novoRound = function (J) {
  J.round.n++;
  J.round.fase = 'pre'; J.round.ate = J.t + (J.round.n === 1 ? 1.5 : 2.2); J.round.vencedor = null;
  J.tiros = []; J.sons = []; J.marcas = [];
  const [pe, pb] = GP._posicoesDoRound(J);
  const pos = (e, p) => {
    const q = GP.navLivre(J.m, p.x, p.y) ? p : (() => { const i = GP._navPerto(J.m, p.x, p.y), n = J.m.nav; return {x: (i % n.W + 0.5) * n.passo, y: (((i / n.W) | 0) + 0.5) * n.passo}; })();
    e.x = q.x; e.y = q.y; e.vx = e.vy = 0;
  };
  const bots = J.ents.filter(e => e.bot);
  pos(J.eu, pe);
  bots.forEach((b, i) => {
    if (J.modo === 'alvos') {
      /* os alvos nascem à vista, a 8–25 m */
      for (let t = 0; t < 400; t++) {
        const p = GP.pontoLivre(J.m, J.rnd), d = Math.hypot(p.x - J.eu.x, p.y - J.eu.y);
        if (d > 8 && d < 25 && GP.linhaLivre(J.m, J.eu.x, J.eu.y, p.x, p.y)) { pos(b, p); break; }
        if (t === 399) pos(b, p);
      }
    } else pos(b, i ? GP.pontoLivre(J.m, J.rnd) : pb);
  });
  for (const e of J.ents) {
    e.hp = 100; e.vivo = true; e.spray = 0; e.recarregaAte = 0; e.equipaAte = 0; e._viuEm = 0; e._reagiu = false; e._susto = null; e._morreuEm = 0;
    e.escudo = GP.ESCUDOS[e.passivo ? 'nenhum' : (J.opc.escudo || 'pesado')];
    for (const s of ['primaria', 'secundaria']) if (e.armas[s]) {
      const A = GP.ARMAS[e.armas[s].id]; e.armas[s].municao = A.pente; e.armas[s].reserva = A.reserva;
    }
    e.slot = e.armas.primaria ? 'primaria' : 'secundaria';
    /* cada um começa olhando para o outro lado do mapa, para o centro */
    e.ang = Math.atan2(J.m.alturaM / 2 - e.y, J.m.larguraM / 2 - e.x);
    if (e.ia) Object.assign(e.ia, {estado: 'patrulha', caminho: null, alvoPonto: null, vista: null, ouviu: null, seguraAte: 0, pausaAte: 0});
  }
  J.eu.cmd.ang = J.eu.ang;
};

GP._fluxoDoRound = function (J) {
  const R = J.round;
  if (J.fim) return;
  if (R.fase === 'pre' && J.t >= R.ate) { R.fase = 'ativo'; R.ate = J.t + J.duracaoRound; R.inicio = J.t; }
  if (R.fase === 'ativo') {
    if (J.modo === 'alvos') {
      /* treino: alvo abatido volta em outro lugar */
      for (const b of J.ents) if (b.bot && !b.vivo && J.t - (b._morreuEm || (b._morreuEm = J.t)) > 0.6) {
        for (let t = 0; t < 400; t++) {
          const p = GP.pontoLivre(J.m, J.rnd), d = Math.hypot(p.x - J.eu.x, p.y - J.eu.y);
          if (d > 7 && d < 26 && GP.linhaLivre(J.m, J.eu.x, J.eu.y, p.x, p.y) || t === 399) { b.x = p.x; b.y = p.y; break; }
        }
        b.vivo = true; b.hp = 100; b._morreuEm = 0;
      }
      if (J.t >= R.ate) { R.fase = 'fim'; J.fim = {modo: 'alvos'}; }
      return;
    }
    const euVivo = J.eu.vivo, eles = J.ents.filter(e => e.time === 'eles' && e.vivo).length;
    let venc = null;
    if (!euVivo) venc = 'eles'; else if (!eles) venc = 'eu'; else if (J.t >= R.ate) venc = 'empate';
    if (venc) {
      R.fase = 'fim'; R.vencedor = venc; R.ate = J.t + 2.6;
      if (venc !== 'empate') J.placar[venc]++;
      J.eventos.push({tipo: 'round', t: J.t, vencedor: venc, n: R.n});
    }
  } else if (R.fase === 'fim' && J.t >= R.ate) {
    if (J.placar.eu >= J.alvoRounds || J.placar.eles >= J.alvoRounds) J.fim = {modo: 'duelo', venceu: J.placar.eu > J.placar.eles};
    else GP.novoRound(J);
  }
};

/* o que o jogador vê agora (para desenhar e para medir a reação) */
GP.atualizarVisaoDoJogador = function (J) {
  const eu = J.eu;
  let viu = false;
  for (const o of J.ents) {
    if (o === eu) continue;
    o._visivel = GP.ve(J, eu, o);
    if (o._visivel) { o._vistoEm = J.t; o._vistoX = o.x; o._vistoY = o.y; viu = true; }
  }
  if (viu && !eu._viuEm) { eu._viuEm = J.t; eu._reagiu = false; eu._susto = {ini: J.t, dur: 0.25, forca: 1.6 * (1 - GP._q(eu.atrib.reflexo))}; }
  if (!viu && eu._viuEm && J.t - eu._viuEm > 1.5) eu._viuEm = 0;
};

/* resumo para o relatório do fim */
GP.resumo = function (J) {
  const e = J.eu.st;
  const reac = e.reacoes.length ? e.reacoes.reduce((a, b) => a + b, 0) / e.reacoes.length : null;
  return {
    kills: e.kills, mortes: e.mortes, tiros: e.tiros, acertos: e.acertos,
    precisao: e.tiros ? Math.round(e.acertos / e.tiros * 100) : 0,
    hs: e.acertos ? Math.round(e.cabecas / e.acertos * 100) : 0,
    dano: e.dano, reacaoMs: reac != null ? Math.round(reac * 1000) : null,
    correndo: e.tiros ? Math.round((e.tirosCorrendo || 0) / e.tiros * 100) : 0,
    abertos: e.tiros ? Math.round((e.tirosAbertos || 0) / e.tiros * 100) : 0,
    rounds: J.round.n,
  };
};
