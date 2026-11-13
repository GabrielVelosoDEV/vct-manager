#!/usr/bin/env python3
"""
PLANTAS PARA A ARTE PINTADA DE CADA MAPA

Uso: python3 -I tools/mapas/planta.py [mapa ...]

Gera, a partir da grade do jogo (data/gameplay/mapas.js), uma planta quadrada
para mandar junto com o prompt no gerador de imagem:

  claro   (#D9D4C8)  chão por onde se anda: ruas, pátios, corredores
  escuro  (#2B2B2B)  paredes e prédios: viram telhados e topos de muro
  verde   (#7A8466)  fora do mapa: paisagem (areia, mar, neve, montanha)
  amarelo (#F0C840)  área de planta do bomb (A, B, C)
  vermelho (#E0524F) chão do spawn do ataque
  azul    (#4D8FE0)  chão do spawn da defesa
  marrom  (#8B5A2B)  caixas de cobertura

Saída: tools/mapas/plantas/<mapa>.png (1536×1536) e plantas.json com o
encaixe (onde a imagem cai no mundo do jogo), que o preparo da arte usa
para alinhar a pintura com a colisão.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'tools', 'mapas', 'plantas')
LADO_PX = 1536
MARGEM_M = 10          # paisagem em volta do mapa
CORES = {'chao': (217, 212, 200), 'parede': (43, 43, 43), 'fora': (122, 132, 102),
         'sitio': (240, 200, 64), 'atk': (224, 82, 79), 'def': (77, 143, 224), 'caixa': (139, 90, 43)}


def desfaz(lin):
    out, num = [], ''
    for ch in lin:
        if ch.isdigit():
            num += ch
            continue
        out.append(ch * (int(num) if num else 1))
        num = ''
    return ''.join(out)


def carregar():
    s = open(os.path.join(RAIZ, 'data', 'gameplay', 'mapas.js')).read()
    return json.loads(s[s.index('{'):s.rindex(';')])


def planta(nome, d):
    W, H, c = d['largura'], d['altura'], d['celula_m']
    g = np.array([list(desfaz(l).ljust(W, '#')[:W]) for l in d['grade']])
    chao = g != '#'
    parede = ~chao
    # caixas: blocos soltos pequenos dentro do chão
    lab, n = nd.label(parede)
    borda = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    tam = nd.sum(parede, lab, range(1, n + 1))
    caixa = np.isin(lab, [i + 1 for i in range(n) if (i + 1) not in borda and tam[i] <= 40])
    # fora do mapa: parede longe do chão (mais de 4 m) ligada à borda
    dist = nd.distance_transform_edt(parede) * c
    longe = parede & (dist > 4)
    lab2, _ = nd.label(longe)
    toca = np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))
    fora = np.isin(lab2, toca[toca > 0])
    # o quadrado da planta: o mapa centralizado com margem
    Wm, Hm = W * c, H * c
    lado_m = max(Wm, Hm) + 2 * MARGEM_M
    x0_m, y0_m = -(lado_m - Wm) / 2, -(lado_m - Hm) / 2      # canto da imagem, no mundo
    ppm = LADO_PX / lado_m
    img = np.zeros((LADO_PX, LADO_PX, 3), np.uint8)
    img[:] = CORES['fora']
    # cada pixel da imagem → célula da grade
    yy, xx = np.mgrid[0:LADO_PX, 0:LADO_PX]
    wx, wy = x0_m + (xx + 0.5) / ppm, y0_m + (yy + 0.5) / ppm
    cx, cy = np.floor(wx / c).astype(int), np.floor(wy / c).astype(int)
    dentro = (cx >= 0) & (cy >= 0) & (cx < W) & (cy < H)
    cxi, cyi = np.clip(cx, 0, W - 1), np.clip(cy, 0, H - 1)
    gg = g[cyi, cxi]
    def pinta(mask, cor):
        img[mask & dentro] = cor
    pinta(parede[cyi, cxi] & ~fora[cyi, cxi], CORES['parede'])
    pinta(chao[cyi, cxi], CORES['chao'])
    pinta(np.isin(gg, ['a', 'b', 'c']), CORES['sitio'])
    pinta(caixa[cyi, cxi], CORES['caixa'])
    # spawns: chão num raio de 6 m em volta do ponto, misturado com a cor do lado
    for lado in ('atk', 'def'):
        sx, sy = d['spawn'][lado]
        px, py = (sx + 0.5) * c, (sy + 0.5) * c
        r = (wx - px) ** 2 + (wy - py) ** 2 <= 6 ** 2
        m = r & chao[cyi, cxi] & dentro
        img[m] = (np.array(CORES[lado]) * 0.75 + np.array(CORES['chao']) * 0.25).astype(np.uint8)
    os.makedirs(SAIDA, exist_ok=True)
    Image.fromarray(img).save(os.path.join(SAIDA, nome + '.png'))
    # onde fica cada coisa, para escrever o prompt ("no alto à direita")
    def regiao(x_m, y_m):
        u, v = (x_m - x0_m) / lado_m, (y_m - y0_m) / lado_m
        lin = 'no alto' if v < 0.38 else 'embaixo' if v > 0.62 else 'no meio'
        col = 'à esquerda' if u < 0.38 else 'à direita' if u > 0.62 else 'no centro'
        if lin == 'no meio' and col == 'no centro':
            return 'bem no centro'
        return f'{lin}, {col}' if col != 'no centro' else f'{lin}, no centro'
    sitios = {}
    for L in 'abc':
        ys, xs = np.where(g == L)
        if len(ys):
            sitios[L] = regiao((xs.mean() + 0.5) * c, (ys.mean() + 0.5) * c)
    spawns = {k: regiao((v[0] + 0.5) * c, (v[1] + 0.5) * c) for k, v in d['spawn'].items()}
    return {'lado_px': LADO_PX, 'lado_m': round(lado_m, 3), 'x0_m': round(x0_m, 3), 'y0_m': round(y0_m, 3),
            'metros_por_px': round(lado_m / LADO_PX, 4), 'sitios': sitios, 'spawns': spawns}


def main():
    M = carregar()
    nomes = sys.argv[1:] or sorted(M)
    meta_p = os.path.join(SAIDA, 'plantas.json')
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for n in nomes:
        meta[n] = planta(n, M[n])
        print(f"{n:9s} {meta[n]['lado_m']:.0f} m de lado · bombs {meta[n]['sitios']} · spawns {meta[n]['spawns']}")
    json.dump(meta, open(meta_p, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
