#!/usr/bin/env python3
"""
Extrai a grade de jogo de um minimapa (tools/mapas/minimapas/<mapa>.webp).

O minimapa tem um padrão estável:
  - chão: cinza liso, sem saturação, um tom só por mapa;
  - bombs: o mesmo chão com um tom amarelado;
  - bordas e caixas: linhas claras e finas;
  - etiquetas, pinos e textos: blocos claros ou vermelhos por cima de tudo;
  - fundo: foto escura e com textura.

A grade sai em células de tamanho fixo (CELULA_M metros) com:
  '#' parede · '.' chão · 'a' 'b' 'c' área de planta do bomb.
Etiquetas e pinos viram "desconhecido" e herdam a classe do vizinho
conhecido mais próximo (chão por dentro, parede por fora).

Uso: python3 -I tools/mapas/extrair.py [mapa ...]  (sem nome: todos)
Saída: data/gameplay/mapas.js (todos) e tools/mapas/previa/<mapa>.png
"""
import json, sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIG = os.path.join(RAIZ, 'tools', 'mapas', 'minimapas')
PREVIA = os.path.join(RAIZ, 'tools', 'mapas', 'previa')
LADO_CELULAS = 220          # o lado maior do mapa, em células
PAREDE, CHAO, DESC = 0, 1, 2
SITIO = {3: 'a', 4: 'b', 5: 'c'}


def classificar(im):
    r, g, b = [im[..., i].astype(int) for i in range(3)]
    v = (r + g + b) / 3
    sat = np.maximum(np.maximum(abs(r - g), abs(g - b)), abs(r - b))
    cinza = sat < 10
    # textura: o chão é liso, a foto do fundo nem sempre
    vf = nd.uniform_filter(v, 5)
    var = nd.uniform_filter(v * v, 5) - vf * vf
    # tom do chão: o cinza liso mais comum colado nas linhas claras de contorno
    # (um céu liso no fundo, como em Bind, não tem linha nenhuma por perto)
    claro0 = (v > 175) & (sat < 45) & ((r - b) < 12)
    fino = claro0 & ~nd.binary_opening(claro0, structure=np.ones((4, 4)))
    perto = nd.binary_dilation(fino, iterations=5)
    hist = np.bincount(v[cinza & perto & (var < 40) & (v > 95) & (v < 170)].astype(int), minlength=256)
    tom = int(np.argmax(hist))
    bruto = cinza & (abs(v - tom) <= 9)
    # perto das linhas a variância sobe: o chão liso "puxa" os vizinhos do mesmo tom
    chao = bruto & nd.binary_dilation(bruto & (var < 40), iterations=3)
    # bombs: tom amarelado ou esverdeado, claro, pouco saturado
    sitio = (sat >= 10) & (sat < 70) & (v > 95) & (v < 215) & ((r - b) >= 10) & ~((r > 180) & (g < 120))
    # claro: etiquetas, bordas, textos
    claro = (v > 175) & (sat < 45) & ((r - b) < 12)
    blocos = nd.binary_opening(claro, structure=np.ones((4, 4)))
    blocos = nd.binary_dilation(blocos, iterations=3)
    linhas = claro & ~blocos
    # vermelho: pinos e marcadores de área
    verm = (r > 170) & (g < 130) & (b < 140)
    # o marcador de área é um ponto vermelho dentro de um quadrado escuro de
    # ~1/28 da largura do minimapa: a dilatação cobre o quadrado inteiro, para
    # ele não fechar corredor estreito
    raio = max(4, int(round(v.shape[1] / 52)))
    verm = nd.binary_dilation(verm, iterations=raio)
    cls = np.full(v.shape, PAREDE, np.int8)
    cls[chao] = CHAO
    cls[sitio] = 3
    cls[blocos | verm] = DESC
    # As linhas claras contornam o chão. Entre dois chãos, a linha é degrau ou
    # beirada (passa); entre chão e fundo escuro, metade vira chão e metade
    # parede. A parede de verdade é o vão escuro. Por isso a linha, e a faixa
    # de transição em volta dela, herdam do vizinho conhecido mais próximo.
    borda = nd.binary_dilation(linhas, iterations=2) & (v > tom - 25) & ~chao
    cls[(linhas | borda) & (cls == PAREDE)] = DESC
    # o tom do chão sem a lisura (faixa fina entre etiqueta e contorno) também
    # herda do vizinho: senão vira parede e fecha corredor coberto por etiqueta
    cls[bruto & (cls == PAREDE)] = DESC
    return cls, tom


def _vizinho(cls, conhecido, eixo, inverso):
    """Classe do primeiro pixel conhecido numa direção (-1 se não houver)."""
    c, k = cls, conhecido
    if inverso:
        c, k = np.flip(c, eixo), np.flip(k, eixo)
    n = c.shape[eixo]
    forma = [1, 1]; forma[eixo] = n
    idx = np.where(k, np.arange(n).reshape(forma), -1)
    idx = np.maximum.accumulate(idx, axis=eixo)
    out = np.take_along_axis(c, np.clip(idx, 0, None), axis=eixo)
    out = np.where(idx < 0, -1, out)
    dist = np.where(idx < 0, n, np.arange(n).reshape(forma) - idx)
    if inverso:
        out, dist = np.flip(out, eixo), np.flip(dist, eixo)
    return out, dist


def preencher(cls):
    """Etiquetas e pinos tapam o mapa. Um pixel tapado é chão quando há chão
    dos dois lados (cima e baixo, ou esquerda e direita): é a etiqueta por
    cima de um corredor. O resto herda do conhecido mais próximo."""
    desc = cls == DESC
    if not desc.any():
        return cls
    k = ~desc
    anda = lambda x: (x == CHAO) | (x == 3)
    (cima, dc), (baixo, db) = _vizinho(cls, k, 0, False), _vizinho(cls, k, 0, True)
    (esq, de), (dir_, dd) = _vizinho(cls, k, 1, False), _vizinho(cls, k, 1, True)
    # As etiquetas são faixas deitadas: na vertical só atravessa a altura de uma
    # etiqueta (um vão maior pode ser parede de verdade); na horizontal, o
    # comprimento dela (o corredor passa por baixo do texto)
    L = max(12, cls.shape[1] // 24)
    ponte = (anda(cima) & anda(baixo) & (dc + db <= L)) | (anda(esq) & anda(dir_) & (de + dd <= 4 * L))
    _, (iy, ix) = nd.distance_transform_edt(desc, return_indices=True)
    out = cls[iy, ix]
    sitio = (cima == 3) | (baixo == 3) | (esq == 3) | (dir_ == 3)
    out[desc & ponte] = np.where(sitio[desc & ponte] & (out[desc & ponte] == 3), 3, CHAO)
    return out


def resolver_sitios(cls, im):
    """Cada mancha de bomb vira a, b ou c pela posição do pino com a letra:
    da esquerda para a direita como no minimapa, a não ser que a ordem
    seja dada à mão (ORDEM_SITIOS)."""
    lab, n = nd.label(cls == 3)
    tam = nd.sum(np.ones_like(lab), lab, range(1, n + 1))
    grandes = [i + 1 for i, t in enumerate(tam) if t > 300]
    return lab, grandes


def extrair(nome, ordem_sitios=None, lado=LADO_CELULAS):
    im = np.array(Image.open(os.path.join(ORIG, nome + '.webp')).convert('RGB'))
    cls, tom = classificar(im)
    cls = preencher(cls)
    # andável = chão ou bomb; fica só a maior região conectada (sem ilhas do fundo)
    andavel = (cls == CHAO) | (cls == 3)
    andavel = nd.binary_closing(andavel, iterations=1)
    lab, n = nd.label(andavel)
    if n == 0:
        raise SystemExit(nome + ': nada andável encontrado')
    tam = nd.sum(andavel, lab, range(1, n + 1))
    # o mapa é a maior região mais as vizinhas coladas nela (separadas só por
    # uma linha fina); ilhas soltas no fundo ficam de fora
    k = max(4, int(round(im.shape[1] / 100)))
    minimo = 40 * (im.shape[1] / 641) ** 2
    principal = lab == (1 + int(np.argmax(tam)))
    while True:
        viz = np.unique(lab[nd.binary_dilation(principal, iterations=k) & andavel & ~principal])
        novos = [i for i in viz if i and tam[i - 1] >= minimo]
        if not novos:
            break
        principal |= np.isin(lab, novos)
    # bolsões fechados pequenos dentro do chão (caixas) continuam parede
    sitio_px = (cls == 3) & principal
    # recorte
    ys, xs = np.where(principal)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    principal = principal[y0:y1, x0:x1]
    sitio_px = sitio_px[y0:y1, x0:x1]
    h, w = principal.shape
    esc = lado / max(h, w)
    W, H = max(1, round(w * esc)), max(1, round(h * esc))
    # reamostra pela maioria: a célula é chão se mais da metade dos pixels for
    def reamostra(mask):
        img = Image.fromarray((mask * 255).astype(np.uint8)).resize((W, H), Image.BOX)
        return np.array(img) >= 128
    chao_c = reamostra(principal)
    # tira fiapos de 1–2 células (riscos do fundo e restos de etiqueta): nenhum
    # corredor de verdade tem menos de ~2,5 m; e fica só o pedaço conectado
    def limpa(m, lado):
        m = nd.binary_opening(m, structure=np.ones((lado, lado)))
        lb, nb = nd.label(m)
        return lb == (1 + int(np.argmax(nd.sum(m, lb, range(1, nb + 1)))))
    antes = chao_c.sum()
    for lado in (3, 2):
        limpo = limpa(chao_c, lado)
        if limpo.sum() >= 0.93 * antes:   # a limpeza não pode cortar o mapa
            break
    chao_c = limpo
    # o bomb tem caixas e a etiqueta por cima: fecha os buracos da mancha
    sit_c = nd.binary_closing(reamostra(sitio_px), iterations=3) & chao_c
    # sítios: manchas grandes, nomeadas da esquerda para a direita (ou pela ordem dada)
    lab, n = nd.label(sit_c)
    manchas = []
    for i in range(1, n + 1):
        yy, xx = np.where(lab == i)
        if len(yy) >= 12:
            manchas.append((len(yy), xx.mean(), yy.mean(), i))
    # os bombs são as maiores manchas tingidas (etiquetas coloridas são miúdas)
    manchas = [m[1:] for m in sorted(manchas, reverse=True)[:TRES_SITIOS.get(nome, 2)]]
    if ordem_sitios:
        manchas.sort(key=lambda m: ordem_sitios(m[0], m[1]))
    else:
        manchas.sort()
    grade = np.where(chao_c, '.', '#').astype('<U1')
    letras = 'abc'
    centros = {}
    for k, (mx, my, i) in enumerate(manchas[:3]):
        grade[lab == i] = letras[k]
        centros[letras[k]] = (float(mx), float(my))
    linhas = [''.join(row) for row in grade]
    # marcadores de área (pontinho vermelho dentro de um quadrado) → células de chão
    chao_g = grade != '#'
    _, (gy, gx) = nd.distance_transform_edt(~chao_g, return_indices=True)
    def celula(px, py):
        cx = min(W - 1, max(0, int((px - x0) * esc)))
        cy = min(H - 1, max(0, int((py - y0) * esc)))
        return [int(gx[cy, cx]), int(gy[cy, cx])]
    marc = marcadores(im)
    d = {'mapa': nome, 'largura': W, 'altura': H, 'celula_m': 0.5, '_centros': centros,
         'origem': {'arquivo': nome + '.webp', 'x0': int(x0), 'y0': int(y0), 'escala': esc},
         'grade': linhas}
    lado = im.shape[1]
    sp = SPAWNS.get(nome)
    if sp:
        perto = lambda q: min(marc, key=lambda m: (m[0] - q[0] * lado) ** 2 + (m[1] - q[1] * lado) ** 2)
        d['spawn'] = {'atk': celula(*perto(sp['atk'])), 'def': celula(*perto(sp['def']))}
    nomes = CALLOUTS.get(nome, {})
    d['areas'] = []
    for (mx, my) in marc:
        nm = next((v for (kx, ky), v in nomes.items() if abs(kx - mx) <= 4 and abs(ky - my) <= 4), None)
        if nomes and not nm:
            continue
        d['areas'].append({'nome': nm or '', 'c': celula(mx, my)})
    return d


def marcadores(im):
    """Centros dos marcadores de área: o pontinho vermelho de ~4×4 px (a 641 px).
    Os balões grandes das letras dos bombs ficam de fora pelo tamanho."""
    r, g, b = [im[..., i].astype(int) for i in range(3)]
    red = (r > 170) & (g < 130) & (b < 140)
    lab, n = nd.label(red)
    f = (im.shape[1] / 641) ** 2
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if 4 * f <= len(ys) <= 40 * f:
            out.append((float(xs.mean()), float(ys.mean())))
    return out


def rle(linha):
    """'####...a' → '4#3.a' (o número só aparece quando repete)."""
    out, i = [], 0
    while i < len(linha):
        j = i
        while j < len(linha) and linha[j] == linha[i]:
            j += 1
        out.append((str(j - i) if j - i > 1 else '') + linha[i])
        i = j
    return ''.join(out)


def gerar_js(todos):
    cab = ('/* GERADO por tools/mapas/extrair.py a partir dos minimapas — não editar à mão.\n'
           '   grade: uma linha por string, em RLE ("12#5." = 12 paredes e 5 chãos);\n'
           '   # parede · . chão · a b c área de planta. Célula = celula_m metros.\n'
           '   spawn e areas em [coluna, linha]. */\n')
    corpo = {}
    for d in todos:
        corpo[d['mapa']] = {k: d[k] for k in ('largura', 'altura', 'celula_m', 'spawn', 'areas') if k in d}
        corpo[d['mapa']]['grade'] = [rle(l) for l in d['grade']]
    with open(os.path.join(RAIZ, 'data', 'gameplay', 'mapas.js'), 'w') as f:
        f.write(cab + 'const MAPAS_GAMEPLAY=' + json.dumps(corpo, ensure_ascii=False, separators=(',', ':')) + ';\n')


def previa(d):
    cores = {'#': (24, 28, 34), '.': (150, 156, 164), 'a': (210, 190, 90), 'b': (90, 170, 210), 'c': (200, 110, 200)}
    H, W = d['altura'], d['largura']
    arr = np.zeros((H, W, 3), np.uint8)
    for y, row in enumerate(d['grade']):
        for x, ch in enumerate(row):
            arr[y, x] = cores.get(ch, (255, 0, 255))
    Image.fromarray(arr).resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(PREVIA, d['mapa'] + '.png'))


TRES_SITIOS = {'haven': 3, 'lotus': 3}

# Ordem dos bombs quando a esquerda-para-a-direita do minimapa não bate com a letra.
ORDEM = {
    'bind': lambda x, y: -x,            # B à esquerda, A à direita
    'breeze': lambda x, y: -x,
    'corrode': lambda x, y: -x,
    'pearl': lambda x, y: x,
    'sunset': lambda x, y: -x,
}

# Onde fica o texto de "spawn" de cada lado, em fração do minimapa: o spawn é
# o marcador mais perto dele. Lido à mão dos minimapas.
SPAWNS = {
    'abyss':    {'atk': (0.50, 0.17), 'def': (0.37, 0.83)},
    'ascent':   {'atk': (0.47, 0.12), 'def': (0.38, 0.90)},
    'bind':     {'atk': (0.45, 0.87), 'def': (0.43, 0.12)},
    'breeze':   {'atk': (0.64, 0.80), 'def': (0.73, 0.20)},
    'corrode':  {'atk': (0.50, 0.86), 'def': (0.50, 0.12)},
    'fracture': {'atk': (0.40, 0.15), 'def': (0.50, 0.60)},
    'haven':    {'atk': (0.42, 0.13), 'def': (0.42, 0.85)},
    'icebox':   {'atk': (0.28, 0.29), 'def': (0.31, 0.85)},
    'lotus':    {'atk': (0.35, 0.20), 'def': (0.28, 0.83)},
    'pearl':    {'atk': (0.36, 0.20), 'def': (0.39, 0.85)},
    'split':    {'atk': (0.40, 0.15), 'def': (0.38, 0.86)},
    'summit':   {'atk': (0.40, 0.15), 'def': (0.38, 0.85)},
    'sunset':   {'atk': (0.40, 0.85), 'def': (0.40, 0.15)},
}

# Nome de cada marcador, pela posição dele no minimapa (px). Por enquanto só Ascent.
CALLOUTS = {
    'ascent': {
        (347, 76): 'Spawn do ataque', (282, 222): 'Mid Top', (187, 245): 'A Lobby',
        (456, 268): 'B Lobby', (278, 303): 'Mid Catwalk', (400, 306): 'Mid Link',
        (192, 327): 'A Main', (346, 327): 'Mid Courtyard', (242, 345): 'Mid Cubby',
        (326, 377): 'Mid Bottom', (449, 377): 'B Main', (221, 379): 'A Link',
        (323, 414): 'Mid Pizza', (90, 427): 'A Site', (361, 437): 'Mid Market',
        (241, 441): 'A Garden', (478, 445): 'B Site', (106, 465): 'A Rafters',
        (203, 466): 'A Window', (552, 465): 'B Back', (267, 575): 'Spawn da defesa',
    },
}

if __name__ == '__main__':
    os.makedirs(PREVIA, exist_ok=True)
    nomes = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(ORIG) if f.endswith('.webp'))
    todos = []
    ref = json.load(open(os.path.join(RAIZ, 'tools', 'mapas', 'referencia.json')))
    for n in nomes:
        d = extrair(n, ORDEM.get(n))
        # Escala de verdade: a distância entre os bombs no jogo (valorant-api,
        # em cm) contra a distância na nossa grade. Refaz a grade no tamanho certo.
        r, c = ref.get(n), d['_centros']
        pares = [(p, q) for p in 'abc' for q in 'abc' if p < q and p in c and q in c and r and p in r and q in r]
        if pares:
            f = np.mean([np.hypot(r[p][0] - r[q][0], r[p][1] - r[q][1]) / 100
                         / (np.hypot(c[p][0] - c[q][0], c[p][1] - c[q][1]) * 0.5) for p, q in pares])
            d = extrair(n, ORDEM.get(n), lado=round(LADO_CELULAS * f))
            d['escala_ref'] = round(float(f), 3)
        del d['_centros']
        todos.append(d)
        previa(d)
        g = ''.join(d['grade'])
        print(f"{n:9s} {d['largura']}x{d['altura']}  chão {g.count('.')+g.count('a')+g.count('b')+g.count('c'):6d}  "
              f"A {g.count('a'):4d} B {g.count('b'):4d} C {g.count('c'):4d}  escala ×{d.get('escala_ref')}  áreas {len(d['areas'])}")
    if not sys.argv[1:]:
        gerar_js(todos)
        print('data/gameplay/mapas.js', os.path.getsize(os.path.join(RAIZ, 'data', 'gameplay', 'mapas.js')) // 1024, 'KB')
