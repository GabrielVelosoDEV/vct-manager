#!/usr/bin/env python3
"""
ONDE FICA CADA MECÂNICA DOS MAPAS

Uso: python3 -I tools/mapas/mecanicas.py [mapa ...]

Lê a grade do jogo (data/gameplay/mapas.js) e põe as peças que mudam durante a
partida nos lugares equivalentes aos do jogo original:

  porta      gargalo (corredor de 2,5–7 m) no caminho até um bomb, perto dele
  teleporte  par de plataformas de mão única (Bind)
  tirolesa / corda   atalho por cima de um muro: dois pontos de chão perto
             um do outro em linha reta, mas longe andando

Grava data/gameplay/mecanicas.js (metros, no mundo do jogo) e uma prévia de
cada mapa em tools/mapas/previa/<mapa>_mecanicas.png para conferir. Um lugar
pode ser fixado à mão em FIXO (mesmo formato da saída) se a regra errar.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.graph import MCP_Geometric

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXO = {}      # {'mapa': [peças]} — substitui a regra para aquele mapa


def desfaz(lin):
    out, num = [], ''
    for ch in lin:
        if ch.isdigit():
            num += ch; continue
        out.append(ch * (int(num) if num else 1)); num = ''
    return ''.join(out)


class Mapa:
    def __init__(self, nome, d):
        self.nome, self.W, self.H, self.c = nome, d['largura'], d['altura'], d['celula_m']
        g = np.array([list(desfaz(l).ljust(self.W, '#')[:self.W]) for l in d['grade']])
        self.g = g
        self.chao = g != '#'
        self.dist = nd.distance_transform_edt(self.chao) * self.c          # m até a parede
        self.livre = self.dist > 0.5                                         # cabe um corpo
        self.spawn = {k: ((v[0] + 0.5) * self.c, (v[1] + 0.5) * self.c) for k, v in d['spawn'].items()}
        self.sitios = {}
        for L in 'abc':
            ys, xs = np.where(g == L)
            if len(ys):
                self.sitios[L] = ((xs.mean() + 0.5) * self.c, (ys.mean() + 0.5) * self.c)
        self.custo = np.where(self.livre, 1.0, np.inf)
        self._geo = {}

    def cel(self, p):
        return int(p[1] / self.c), int(p[0] / self.c)

    def m(self, rc):
        return ((rc[1] + 0.5) * self.c, (rc[0] + 0.5) * self.c)

    def perto_livre(self, p):
        r, c = self.cel(p)
        if 0 <= r < self.H and 0 <= c < self.W and self.livre[r, c]:
            return (r, c)
        ys, xs = np.where(self.livre)
        k = np.argmin((ys - r) ** 2 + (xs - c) ** 2)
        return (int(ys[k]), int(xs[k]))

    def geo(self, p):
        """distância andando (m) de p até cada célula"""
        k = self.perto_livre(p)
        if k not in self._geo:
            mcp = MCP_Geometric(self.custo)
            d, _ = mcp.find_costs([k])
            self._geo[k] = (d * self.c, mcp)
        return self._geo[k]

    def caminho(self, a, b):
        d, mcp = self.geo(a)
        return mcp.traceback(self.perto_livre(b))

    def solido_em(self, x, y):
        r, c = int(y / self.c), int(x / self.c)
        return not (0 <= r < self.H and 0 <= c < self.W) or not self.chao[r, c]

    def raio(self, x, y, ang, maxd=12):
        dx, dy = np.cos(ang), np.sin(ang)
        t = 0.0
        while t < maxd:
            if self.solido_em(x + dx * t, y + dy * t):
                return t
            t += self.c / 4
        return maxd


def gargalo(M, ini, alvo, dmin, dmax, wmin=2.4, wmax=7.0, evitar=()):
    """o ponto mais estreito do caminho ini→alvo entre dmin e dmax metros
    (andando) do alvo; devolve a porta (a, b) de parede a parede"""
    cam = M.caminho(ini, alvo)
    dg, _ = M.geo(alvo)
    melhor = None
    for i in range(3, len(cam) - 3):
        r, c = cam[i]
        d = dg[r, c]
        if not (dmin <= d <= dmax):
            continue
        (r0, c0), (r1, c1) = cam[i - 3], cam[i + 3]
        ang = np.arctan2(r1 - r0, c1 - c0) + np.pi / 2           # perpendicular ao caminho
        # as paredes do mapa são retas: a porta fica de pé ou deitada, nunca torta
        ang = round(ang / (np.pi / 2)) * (np.pi / 2)
        if M.g[r, c] in 'abc':                                     # dentro do bomb não
            continue
        x, y = M.m((r, c))
        e1, e2 = M.raio(x, y, ang), M.raio(x, y, ang + np.pi)
        w = e1 + e2
        if not (wmin <= w <= wmax) or min(e1, e2) < 0.6:
            continue
        a = (x + np.cos(ang) * e1, y + np.sin(ang) * e1)
        b = (x - np.cos(ang) * e2, y - np.sin(ang) * e2)
        meio = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        if any(np.hypot(meio[0] - q[0], meio[1] - q[1]) < 6 for q in evitar):
            continue
        # prefere estreito, e um gargalo "de verdade" (paredes retas dos dois lados)
        nota = w
        if melhor is None or nota < melhor[0]:
            melhor = (nota, a, b, meio)
    if melhor is None:
        return None
    _, a, b, meio = melhor
    return [round(a[0], 2), round(a[1], 2)], [round(b[0], 2), round(b[1], 2)]


def ponto_no_caminho(M, ini, alvo, metros_do_alvo):
    """o ponto do caminho ini→alvo que fica a tantos metros (andando) do alvo,
    no lugar mais aberto ali perto (plataforma de teleporte precisa de espaço)"""
    cam = M.caminho(ini, alvo)
    dg, _ = M.geo(alvo)
    melhor = None
    for r, c in cam:
        d = dg[r, c]
        if abs(d - metros_do_alvo) < 4:
            nota = M.dist[r, c] - abs(d - metros_do_alvo) * 0.15
            if melhor is None or nota > melhor[0]:
                melhor = (nota, (r, c))
    r, c = melhor[1] if melhor else cam[len(cam) // 2]
    x, y = M.m((r, c))
    return [round(x, 2), round(y, 2)]


def atalho(M, zona, raio_zona=16, dmin=3.5, dmax=10, razao=2.6, evitar=()):
    """dois pontos de chão a 3,5–10 m em linha reta, com muro no meio, e que
    andando ficam bem mais longe: lugar de corda ou tirolesa"""
    zx, zy = zona
    cands = []
    passo = 2
    for r in range(0, M.H, passo):
        for c in range(0, M.W, passo):
            if not M.livre[r, c] or M.dist[r, c] < 0.8:
                continue
            x, y = M.m((r, c))
            if np.hypot(x - zx, y - zy) <= raio_zona:
                cands.append((x, y))
    melhor = None
    rng = np.random.default_rng(7)
    if len(cands) > 160:
        cands = [cands[i] for i in rng.choice(len(cands), 160, replace=False)]
    for a in cands:
        if any(np.hypot(a[0] - q[0], a[1] - q[1]) < 5 for q in evitar):
            continue
        dg, _ = M.geo(a)
        for b in cands:
            d = np.hypot(a[0] - b[0], a[1] - b[1])
            if not (dmin <= d <= dmax):
                continue
            n = int(d / (M.c / 2))
            sol = sum(M.solido_em(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n))
            if sol / n < 0.2:
                continue
            r, c = M.perto_livre(b)
            g = dg[r, c]
            if not np.isfinite(g) or g < razao * d:
                continue
            nota = g / d - 0.15 * d
            if melhor is None or nota > melhor[0]:
                melhor = (nota, a, b)
    if melhor is None:
        return None
    _, a, b = melhor
    return [round(a[0], 2), round(a[1], 2)], [round(b[0], 2), round(b[1], 2)]


def junto_da_parede(M, porta, lado, dist=1.6):
    """um ponto encostado na parede ao lado da porta (interruptor, botão),
    do lado `lado` (+1/−1) do corredor"""
    a, b = np.array(porta[0]), np.array(porta[1])
    meio, u = (a + b) / 2, (b - a) / np.linalg.norm(b - a)
    n = np.array([-u[1], u[0]]) * lado
    p = a + n * dist + u * 0.45            # rente à parede da ponta a, um pouco para dentro
    return [round(float(p[0]), 2), round(float(p[1]), 2)]


def centro(M):
    ys, xs = np.where(M.livre)
    return ((xs.mean() + 0.5) * M.c, (ys.mean() + 0.5) * M.c)


def pecas(M):
    n, S, sp = M.nome, M.sitios, M.spawn
    meio = centro(M)
    P = []
    porta = lambda **k: P.append(dict(tipo='porta', **k))
    if n == 'ascent':
        # A: entre Tree e o bomb; B: na entrada do Market (vem do meio)
        for L, lado in (('a', 1), ('b', -1)):
            g = gargalo(M, meio, S[L], 3, 16) or gargalo(M, meio, S[L], 2, 24, wmax=9)
            if g:
                porta(id='porta_' + L, a=g[0], b=g[1], estado='aberta', hp=400, fecha='interruptor',
                      interruptor=junto_da_parede(M, g, lado), arte='porta')
    elif n == 'sunset':
        g = gargalo(M, meio, S['b'], 4, 18)
        if g:
            porta(id='porta_market', a=g[0], b=g[1], estado='aberta', hp=400, fecha='uma_vez', arte='porta')
    elif n == 'abyss':
        g = gargalo(M, meio, S['a'], 5, 20)
        if g:
            porta(id='porta', a=g[0], b=g[1], estado='fechada', hp=400, arte='porta')
    elif n == 'haven':
        g = gargalo(M, sp['atk'], S['c'], 6, 22)
        if g:
            porta(id='garagem', a=g[0], b=g[1], estado='fechada', hp=150, arte='garagem')
    elif n == 'breeze':
        g = gargalo(M, sp['atk'], meio, 2, 14) or gargalo(M, S['a'], S['b'], 0, 999, wmax=6)
        if g:
            porta(id='porta_mid', a=g[0], b=g[1], estado='fechada', auto=True, arte='porta')
        r = atalho(M, S['a'], raio_zona=16) or atalho(M, S['a'], raio_zona=24, dmax=12, razao=2)
        if r:
            P.append(dict(tipo='corda', id='corda_a', a=r[0], b=r[1]))
    elif n == 'fracture':
        g = gargalo(M, sp['def'], S['a'], 4, 18)
        if g:
            porta(id='porta_a', a=g[0], b=g[1], estado='fechada', auto=True, arte='porta')
        # a tirolesa do ataque: atalho longo saindo do spawn, por cima dos muros
        r = atalho(M, sp['atk'], raio_zona=26, dmin=12, dmax=30, razao=1.8)
        if r:
            P.append(dict(tipo='tirolesa', id='tirolesa', a=r[0], b=r[1]))
    elif n == 'icebox':
        r = atalho(M, S['b'], raio_zona=18, dmax=14)
        if r:
            P.append(dict(tipo='tirolesa', id='tirolesa_b', a=r[0], b=r[1]))
        r2 = atalho(M, S['a'], raio_zona=16, dmax=12)
        if r2:
            P.append(dict(tipo='tirolesa', id='tirolesa_a', a=r2[0], b=r2[1]))
    elif n == 'split':
        usados = []
        for nome, z in (('corda_mid', meio), ('corda_a', S['a']), ('corda_b', S['b'])):
            r = atalho(M, z, raio_zona=15, dmax=9, evitar=usados)
            if r:
                P.append(dict(tipo='corda', id=nome, a=r[0], b=r[1])); usados += [tuple(r[0]), tuple(r[1])]
    elif n == 'lotus':
        g1 = gargalo(M, meio, S['a'], 3, 14) or gargalo(M, meio, S['a'], 2, 24, wmax=8)
        g2 = gargalo(M, S['b'], S['c'], 3, 16)
        for gid, g in (('giratoria_a', g1), ('giratoria_c', g2)):
            if g:
                porta(id=gid, a=g[0], b=g[1], estado='fechada', giratoria=True, arte='porta_giratoria',
                      botoes=[junto_da_parede(M, g, 1), junto_da_parede(M, g, -1)])
        ev = [tuple(np.mean([g1[0], g1[1]], 0))] if g1 else []
        g3 = gargalo(M, sp['atk'], S['a'], 14, 34, wmax=4.5, evitar=ev) or gargalo(M, sp['atk'], S['a'], 10, 45, wmax=6, evitar=ev) or gargalo(M, sp['atk'], S['a'], 6, 60, wmax=8, evitar=ev)
        if g3:
            porta(id='porta_link', a=g3[0], b=g3[1], estado='fechada', hp=100, arte='porta_fragil')
        r = atalho(M, S['a'], raio_zona=12, dmax=10)
        if r:
            P.append(dict(tipo='tirolesa', id='tirolesa_a', a=r[0], b=r[1]))
    elif n == 'summit':
        usados = []
        for gid, ini, alvo in (('muro_a', meio, S['a']), ('muro_b', meio, S['b']), ('muro_mid', sp['atk'], sp['def'])):
            if gid == 'muro_mid':
                cam_d = M.geo(sp['def'])[0][M.perto_livre(meio)]
                g = gargalo(M, ini, alvo, cam_d - 10, cam_d + 10, wmax=8, evitar=usados)
            else:
                g = gargalo(M, ini, alvo, 4, 18, wmax=8, evitar=usados)
            if g:
                usados.append(tuple(np.mean([g[0], g[1]], 0)))
                porta(id=gid, a=g[0], b=g[1], estado='aberta', fecha='derruba', arte='muro',
                      interruptor=junto_da_parede(M, g, 1, dist=2.2), hp_interruptor=125)
    elif n == 'bind':
        # B Long → A Showers e A Short → B Short (mão única)
        P.append(dict(tipo='teleporte', id='tp_b_para_a', de=ponto_no_caminho(M, sp['atk'], S['b'], 24),
                      para=ponto_no_caminho(M, sp['atk'], S['a'], 11)))
        P.append(dict(tipo='teleporte', id='tp_a_para_b', de=ponto_no_caminho(M, sp['atk'], S['a'], 22),
                      para=ponto_no_caminho(M, sp['atk'], S['b'], 10)))
    return P


def previa(M, P, caminho):
    k = 4
    im = Image.fromarray(np.where(M.chao, 205, 45).astype(np.uint8)).convert('RGB').resize((M.W * k, M.H * k), Image.NEAREST)
    dr = ImageDraw.Draw(im)
    px = lambda p: (p[0] / M.c * k, p[1] / M.c * k)
    for L, p in M.sitios.items():
        x, y = px(p); dr.text((x, y), L.upper(), fill=(200, 150, 0))
    for p in P:
        if p['tipo'] == 'porta':
            cor = (230, 60, 60) if p['estado'] == 'fechada' else (60, 160, 230)
            dr.line([px(p['a']), px(p['b'])], fill=cor, width=6)
            for q in [p.get('interruptor')] + p.get('botoes', []):
                if q:
                    x, y = px(q); dr.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(250, 220, 0))
            x, y = px(p['a']); dr.text((x + 6, y), p['id'], fill=(0, 0, 0))
        elif p['tipo'] == 'teleporte':
            a, b = px(p['de']), px(p['para'])
            dr.ellipse([a[0] - 10, a[1] - 10, a[0] + 10, a[1] + 10], fill=(255, 140, 0))
            dr.ellipse([b[0] - 10, b[1] - 10, b[0] + 10, b[1] + 10], outline=(255, 140, 0), width=4)
            dr.line([a, b], fill=(255, 140, 0), width=1)
        else:
            dr.line([px(p['a']), px(p['b'])], fill=(150, 60, 220), width=4)
            for q in (p['a'], p['b']):
                x, y = px(q); dr.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(150, 60, 220))
    im.save(caminho)


def main():
    s = open(os.path.join(RAIZ, 'data', 'gameplay', 'mapas.js')).read()
    MAPAS = json.loads(s[s.index('{'):s.rindex(';')])
    saida = os.path.join(RAIZ, 'data', 'gameplay', 'mecanicas.js')
    tudo = {}
    if os.path.exists(saida):
        t = open(saida).read()
        tudo = json.loads(t[t.index('{'):t.rindex(';')])
    nomes = sys.argv[1:] or sorted(MAPAS)
    os.makedirs(os.path.join(RAIZ, 'tools', 'mapas', 'previa'), exist_ok=True)
    for n in nomes:
        M = Mapa(n, MAPAS[n])
        P = FIXO.get(n) or pecas(M)
        tudo[n] = P
        previa(M, P, os.path.join(RAIZ, 'tools', 'mapas', 'previa', n + '_mecanicas.png'))
        print(f"{n:9s} {len(P)} peças: " + ', '.join(p['id'] for p in P))
    with open(saida, 'w') as f:
        f.write('/* Gerado por tools/mapas/mecanicas.py — portas, teleportes, cordas e\n'
                '   tirolesas de cada mapa, em metros no mundo do jogo. */\n')
        f.write('const MECANICAS_GAMEPLAY=' + json.dumps({k: tudo[k] for k in sorted(tudo)}, ensure_ascii=False) + ';\n')


if __name__ == '__main__':
    main()
