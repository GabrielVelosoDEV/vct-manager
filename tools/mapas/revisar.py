#!/usr/bin/env python3
"""
COLISÃO IGUAL À PINTURA

Uso: python3 -I tools/mapas/revisar.py [mapa ...] [--aplicar]

A grade do jogo saiu do minimapa; a pintura de cada mapa foi feita em cima
dela, mas a IA acrescentou e tirou coisas (contêineres, caixotes, barris,
pilares). Aqui a pintura é lida célula a célula (0,5 m) e a grade é ajustada:

  acrescenta  objeto pintado no chão (caixa, contêiner, pilar…) de 1,5 a 45 m²
              que não existia na colisão
  tira        caixa da colisão que não aparece na pintura (parede invisível)

Proteções, para 10 bonecos andarem sem engarrafar:
  - sombra e beirada de telhado (faixa fina colada na parede) não contam;
  - um objeto novo só entra se não fechar nem estreitar demais uma passagem:
    o espaço livre com folga de 0,75 m (um corredor de 1,5 m) continua
    ligado do mesmo jeito;
  - no fim, todos os caminhos spawn → bomb continuam existindo.

A grade original fica guardada em tools/mapas/grade_base.json; rodar de novo
sempre parte dela. Sem --aplicar só gera as prévias
(tools/mapas/previa/<mapa>_revisao.png): verde = objeto novo, azul = caixa
tirada, vermelho = objeto pintado recusado (fecharia passagem).
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as nd

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RAIZ, 'tools', 'mapas'))
from alinhar import _grupos  # noqa: E402

MAPAS_JS = os.path.join(RAIZ, 'data', 'gameplay', 'mapas.js')
BASE = os.path.join(RAIZ, 'tools', 'mapas', 'grade_base.json')
PREVIA = os.path.join(RAIZ, 'tools', 'mapas', 'previa')
FOLGA_M = 0.75


def desfaz(lin):
    out, num = [], ''
    for ch in lin:
        if ch.isdigit():
            num += ch; continue
        out.append(ch * (int(num) if num else 1)); num = ''
    return ''.join(out)


def rle(s):
    out, i = [], 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        n = j - i
        out.append((str(n) if n > 1 else '') + s[i]); i = j
    return ''.join(out)


def ler_js():
    s = open(MAPAS_JS).read()
    return s[:s.index('const MAPAS_GAMEPLAY=')], json.loads(s[s.index('{'):s.rindex(';')])


def pintura_por_celula(nome, d):
    """lê a pintura encaixada em 4×4 amostras por célula: grupo de cor (k-means
    em Lab), a cor Lab e a força das bordas (o contorno escuro que todo objeto
    pintado tem; sombra é lisa)"""
    meta = json.load(open(os.path.join(RAIZ, 'assets', 'gameplay', 'pronto', 'mapas_arte', nome + '.json')))
    im = np.array(Image.open(os.path.join(RAIZ, meta['src'])).convert('RGB'))
    W, H, c = d['largura'], d['altura'], d['celula_m']
    k, N = 12, 1024
    peq = cv2.resize(im, (N, N), interpolation=cv2.INTER_AREA)
    rot = _grupos(peq, k)
    lab = cv2.cvtColor(peq, cv2.COLOR_RGB2Lab).astype(np.float32)
    cinza = cv2.cvtColor(peq, cv2.COLOR_RGB2GRAY).astype(np.float32)
    borda = cv2.GaussianBlur(np.abs(cv2.Laplacian(cinza, cv2.CV_32F, ksize=3)), (0, 0), 1.2)
    S = 4
    xs = (np.arange(W * S) + 0.5) / S * c
    ys = (np.arange(H * S) + 0.5) / S * c
    u = ((xs - meta['x0_m']) / meta['larg_m'] * N).astype(int)
    v = ((ys - meta['y0_m']) / meta['alt_m'] * N).astype(int)
    dentro = (u[None, :] >= 0) & (u[None, :] < N) & (v[:, None] >= 0) & (v[:, None] < N)
    vi, ui = np.clip(v, 0, N - 1)[:, None], np.clip(u, 0, N - 1)[None, :]
    R = rot[vi, ui]; R[~dentro] = -1
    L = lab[vi, ui]; E = borda[vi, ui]
    cent = np.array([lab[rot == i].mean(0) if (rot == i).any() else [0, 128, 128] for i in range(k)])
    return R.reshape(H, S, W, S), L.reshape(H, S, W, S, 3), E.reshape(H, S, W, S), cent, k


def revisar(nome, d):
    W, H, c = d['largura'], d['altura'], d['celula_m']
    g = np.array([list(desfaz(l).ljust(W, '#')[:W]) for l in d['grade']])
    chao = g != '#'
    R, Lab, E, cent, k = pintura_por_celula(nome, d)
    # grupos de cor que são chão: os que caem mais em chão do que em parede
    frac = np.zeros(k)
    for i in range(k):
        m = (R == i).sum(axis=(1, 3))
        frac[i] = (m * chao).sum() / max(1, m.sum())
    # chão = grupos que cobrem boa parte do chão (os objetos pintados também
    # caem quase só em chão, mas cada um é uma fatia pequena dele)
    fatia = np.array([((R == i).sum(axis=(1, 3)) * chao).sum() for i in range(k)], float)
    fatia /= max(1, fatia.sum())
    eh_chao = (frac > 0.55) & (fatia > 0.07)
    # sombra: grupo mais escuro com a mesma cor de algum grupo de chão
    sombra = np.zeros(k, bool)
    for j in range(k):
        if eh_chao[j]:
            continue
        for i in range(k):
            if eh_chao[i] and cent[j, 0] < cent[i, 0] - 6 and abs(cent[j, 1] - cent[i, 1]) < 9 and abs(cent[j, 2] - cent[i, 2]) < 14:
                sombra[j] = True
    tot = np.maximum(1, (R >= 0).sum(axis=(1, 3)))
    f_chao = sum(((R == i).sum(axis=(1, 3)) for i in range(k) if eh_chao[i]), np.zeros((H, W))) / tot
    f_sombra = sum(((R == i).sum(axis=(1, 3)) for i in range(k) if sombra[i]), np.zeros((H, W))) / tot
    f_chao = np.where((R >= 0).sum(axis=(1, 3)) > 0, f_chao, 1)
    borda = E.mean(axis=(1, 3))
    lim = np.percentile(borda[chao], 75)
    # objeto: cor que não é chão nem sombra, ou sombra/escuro com contorno marcado
    pint_obj = ((1 - f_chao - f_sombra) > 0.55) | (((1 - f_chao) > 0.6) & (borda > lim * 1.6)) | (((1 - f_chao) > 0.3) & (borda > lim * 2.4))
    # ---- acrescentar: objeto pintado sobre chão da colisão ----
    cand = chao & pint_obj
    # a tinta do bomb e o círculo do spawn que a IA pintou no chão não são objeto
    cand &= ~nd.binary_dilation(np.isin(g, ['a', 'b', 'c']), iterations=4)
    yy, xx = np.mgrid[0:H, 0:W]
    for sx, sy in d['spawn'].values():
        cand &= (xx - sx) ** 2 + (yy - sy) ** 2 > (8 / c) ** 2
    # tira faixas finas (sombra, beirada de telhado): abre com 3×3 e reconstrói
    nucleo = nd.binary_erosion(cand, iterations=1)
    cand = nd.binary_propagation(nucleo, mask=cand)
    # junta os pedaços do mesmo objeto e preenche: cada objeto vira o contorno
    # convexo dele (caixa, contêiner, tanque são formas cheias)
    cand = nd.binary_fill_holes(nd.binary_closing(cand, iterations=2)) & chao
    lab0, n0 = nd.label(cand)
    cheio = np.zeros_like(cand)
    for i in range(1, n0 + 1):
        ys, xs = np.where(lab0 == i)
        if len(ys) < 3:
            continue
        casco = cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32))
        m = np.zeros(cand.shape, np.uint8); cv2.fillConvexPoly(m, casco, 1)
        cheio |= m.astype(bool)
    cand = cheio & chao
    lab, n = nd.label(cand)
    parede = ~chao
    sitio = np.isin(g, ['a', 'b', 'c'])
    novos, recusados = [], []
    livre_antes = nd.distance_transform_edt(chao) * c > FOLGA_M
    def comp(livre):
        L, N = nd.label(livre)
        if not N:
            return 0, 0
        t = nd.sum(livre, L, range(1, N + 1))
        return int((t > 30).sum()), float(t.max())
    ref = comp(livre_antes)
    # pontos que têm de continuar ligados, e sem volta maior (fluidez):
    # spawns e bombs, por corredores de 1,5 m
    from skimage.graph import MCP_Geometric
    chaves = [(int(v[1]), int(v[0])) for v in d['spawn'].values()]
    for L in 'abc':
        yy, xx = np.where(g == L)
        if len(yy):
            chaves.append((int(yy.mean()), int(xx.mean())))
    def distancias(par):
        livre = nd.distance_transform_edt(~par) * c > FOLGA_M
        ys, xs = np.where(livre)
        pts = [(ys[i], xs[i]) for i in (np.argmin((ys - y) ** 2 + (xs - x) ** 2) for y, x in chaves)]
        dist, _ = MCP_Geometric(np.where(livre, 1.0, np.inf)).find_costs(pts[:2])
        return np.array([dist[p] for p in pts])
    base_d = distancias(parede)
    def rotas_ok(par):
        dd = distancias(par)
        return np.all(np.isfinite(dd)) and np.all(dd <= base_d * 1.12 + 4)
    atual = parede.copy()
    for i in range(1, n + 1):
        b = lab == i
        area = b.sum() * c * c
        if not (1.5 <= area <= 150):
            continue
        ys, xs = np.where(b)
        h, w = np.ptp(ys) + 1, np.ptp(xs) + 1
        if max(h, w) / max(1, min(h, w)) > 5:      # tira comprida: beirada de parede
            continue
        # mais da metade do contorno colada em parede = continuação de parede/sombra
        anel = nd.binary_dilation(b) & ~b
        if (anel & parede).sum() / max(1, anel.sum()) > 0.3:
            continue
        if not nd.binary_erosion(b, iterations=1).any():   # mais fino que 1 m: risco, sombra
            continue
        teste = atual | b
        livre = nd.distance_transform_edt(~teste) * c > FOLGA_M
        if comp(livre)[0] > ref[0] or not rotas_ok(teste):
            recusados.append(b); continue
        atual = teste
        novos.append(b)

    # ---- tirar: caixa da colisão que a pintura não tem ----
    lab2, n2 = nd.label(parede)
    borda = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]])))
    tirados = []
    for i in range(1, n2 + 1):
        if i in borda:
            continue
        b = lab2 == i
        if b.sum() > 60:
            continue
        perto = nd.binary_dilation(b, iterations=3)
        if f_chao[b].mean() > 0.7 and not pint_obj[perto & chao].any():
            tirados.append(b)

    g2 = g.copy()
    for b in novos:
        g2[b] = '#'
    for b in tirados:
        # volta a ser chão (do bomb, se estiver dentro de um)
        viz = nd.binary_dilation(b, iterations=2) & sitio
        letra = g[viz][0] if viz.any() else '.'
        g2[b] = letra
    return g, g2, novos, tirados, recusados, f_chao


def caminhos_ok(nome, d, g2):
    """spawn → cada bomb existe e não dá volta absurda (A* na grade de 1 m)"""
    W, H, c = d['largura'], d['altura'], d['celula_m']
    livre = nd.distance_transform_edt(g2 != '#') * c > 0.42
    from skimage.graph import MCP_Geometric
    custo = np.where(livre, 1.0, np.inf)
    ok = True
    for lado, (sx, sy) in d['spawn'].items():
        mcp = MCP_Geometric(custo)
        ys, xs = np.where(livre)
        k = np.argmin((ys - sy) ** 2 + (xs - sx) ** 2)
        dist, _ = mcp.find_costs([(ys[k], xs[k])])
        for L in 'abc':
            yy, xx = np.where(g2 == L)
            if not len(yy):
                continue
            ty, tx = int(yy.mean()), int(xx.mean())
            m = livre & (np.abs(np.arange(H)[:, None] - ty) < 6) & (np.abs(np.arange(W)[None, :] - tx) < 6)
            if not m.any() or not np.isfinite(dist[m]).any():
                print(f'   {nome}: {lado} não chega no bomb {L}'); ok = False
    return ok


def previa(nome, d, g, g2, novos, tirados, recusados):
    meta = json.load(open(os.path.join(RAIZ, 'assets', 'gameplay', 'pronto', 'mapas_arte', nome + '.json')))
    im = Image.open(os.path.join(RAIZ, meta['src'])).convert('RGB')
    W, H, c = d['largura'], d['altura'], d['celula_m']
    K = 6
    # pintura reamostrada para a grade (K px por célula)
    xs = (np.arange(W * K) + 0.5) / K * c
    ys = (np.arange(H * K) + 0.5) / K * c
    a = np.array(im)
    u = np.clip(((xs - meta['x0_m']) / meta['larg_m'] * a.shape[1]).astype(int), 0, a.shape[1] - 1)
    v = np.clip(((ys - meta['y0_m']) / meta['alt_m'] * a.shape[0]).astype(int), 0, a.shape[0] - 1)
    out = a[v[:, None], u[None, :]].copy()
    up = lambda m: np.kron(m, np.ones((K, K), bool))
    par = g2 == '#'
    borda = up(par) ^ nd.binary_erosion(up(par), iterations=1)
    out[borda] = (255, 0, 255)
    for lista, cor in ((novos, (0, 255, 80)), (tirados, (40, 140, 255)), (recusados, (255, 40, 40))):
        for b in lista:
            m = up(b); out[m] = (out[m] * 0.35 + np.array(cor) * 0.65).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(PREVIA, nome + '_revisao.png'))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    aplicar = '--aplicar' in sys.argv
    cab, M = ler_js()
    if not os.path.exists(BASE):
        json.dump({n: d['grade'] for n, d in M.items()}, open(BASE, 'w'))
    base = json.load(open(BASE))
    os.makedirs(PREVIA, exist_ok=True)
    for nome in args or sorted(M):
        d = dict(M[nome]); d['grade'] = base[nome]
        g, g2, novos, tirados, recusados, _ = revisar(nome, d)
        ok = caminhos_ok(nome, d, g2)
        previa(nome, d, g, g2, novos, tirados, recusados)
        print(f'{nome:9s} +{len(novos)} objetos  −{len(tirados)} caixas fantasmas  {len(recusados)} recusados  caminhos {"ok" if ok else "QUEBRADOS"}')
        if aplicar and ok:
            M[nome]['grade'] = [rle(''.join(l)) for l in g2]
    if aplicar:
        open(MAPAS_JS, 'w').write(cab + 'const MAPAS_GAMEPLAY=' + json.dumps(M, ensure_ascii=False, separators=(',', ':')) + ';\n')
        print('gravado em data/gameplay/mapas.js')


if __name__ == '__main__':
    main()
