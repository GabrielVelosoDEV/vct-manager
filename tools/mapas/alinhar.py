#!/usr/bin/env python3
"""
ENCAIXE DA PINTURA NA PLANTA

A IA nem sempre devolve o mapa no tamanho e posição exatos da planta (no Bind
ela esticou tudo uns 8% e desceu o desenho). Aqui a pintura é deformada até o
chão pintado cair em cima do chão da planta, que é o da colisão:

  1. separa a pintura em grupos de cor (k-means) e descobre quais grupos são
     chão, comparando com a planta;
  2. acha o melhor encaixe afim (escala, deslocamento, leve rotação) por ECC;
  3. refina com fluxo ótico suave, para corrigir as partes que a IA entortou;
  4. o que ficar fora da pintura original é completado com um pedaço de
     paisagem dela mesma (sem espelhar o mapa na borda).

Uso direto: python3 -I tools/mapas/alinhar.py <mapa> [pintura]  → mostra o
quanto melhorou e grava tools/mapas/previa/<mapa>_pintura.png com o contorno
da planta por cima. O preparo das imagens (tools/gameplay-imagens.py) chama
alinhar() sozinho para cada mapa pintado.
"""
import os, sys
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as nd

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = 1536                      # resolução de trabalho (a da planta)
COR_PAREDE = (43, 43, 43); COR_FORA = (122, 132, 102); COR_CAIXA = (139, 90, 43)


def chao_da_planta(caminho):
    p = np.array(Image.open(caminho).convert('RGB')).astype(int)
    if p.shape[0] != N:
        p = np.array(Image.fromarray(p.astype(np.uint8)).resize((N, N), Image.NEAREST)).astype(int)
    perto = lambda c: np.abs(p - c).sum(2) < 20
    return ~(perto(COR_PAREDE) | perto(COR_FORA) | perto(COR_CAIXA))


def _iou(a, b):
    return float((a & b).sum() / max(1, (a | b).sum()))


def _grupos(A, k=8):
    """rótulo de cor por pixel (k-means em Lab, numa amostra)"""
    lab = cv2.cvtColor(A, cv2.COLOR_RGB2Lab).reshape(-1, 3).astype(np.float32)
    amostra = lab[::7]
    _, _, cen = cv2.kmeans(amostra, k, None, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 40, 0.5), 3, cv2.KMEANS_PP_CENTERS)
    melhor = np.full(len(lab), np.inf, np.float32); rot = np.zeros(len(lab), np.int32)
    for i, c in enumerate(cen):
        d = ((lab - c) ** 2).sum(1)
        m = d < melhor; melhor[m] = d[m]; rot[m] = i
    return rot.reshape(A.shape[:2])


def _mascara_chao(rot, chao_p, k):
    """grupos de cor que caem mais em chão do que em parede, pela planta"""
    m = np.zeros(rot.shape, bool)
    for i in range(k):
        g = rot == i
        if g.sum() and (g & chao_p).sum() / g.sum() > 0.5:
            m |= g
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return m.astype(bool)


def _ecc_afim(chao_p, chao_a):
    s = 4
    a = cv2.GaussianBlur(cv2.resize(chao_p.astype(np.float32), (N // s, N // s)), (0, 0), 3)
    b = cv2.GaussianBlur(cv2.resize(chao_a.astype(np.float32), (N // s, N // s)), (0, 0), 3)
    melhor = None
    for sc in (0.85, 0.92, 1.0, 1.08):
        w = np.array([[sc, 0, (1 - sc) * N / s / 2], [0, sc, (1 - sc) * N / s / 2]], np.float32)
        try:
            cc, w = cv2.findTransformECC(a, b, w, cv2.MOTION_AFFINE,
                                         (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), None, 5)
        except cv2.error:
            continue
        if melhor is None or cc > melhor[0]:
            melhor = (cc, w.copy())
    if melhor is None:
        return np.array([[1, 0, 0], [0, 1, 0]], np.float32)
    w = melhor[1]; w[:, 2] *= s
    return w


def _colocar(m, ret, n):
    """a máscara m (da pintura inteira) posta no retângulo ret=(x0,y0,w,h) de uma tela n×n"""
    x0, y0, w, h = ret
    w, h = max(1, int(round(w))), max(1, int(round(h)))
    r = cv2.resize(m.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
    tela = np.zeros((n, n), np.uint8)
    xi, yi = int(round(x0)), int(round(y0))
    ax, ay = max(0, xi), max(0, yi)
    bx, by = min(n, xi + w), min(n, yi + h)
    if bx > ax and by > ay:
        tela[ay:by, ax:bx] = r[ay - yi:by - yi, ax - xi:bx - xi]
    return tela.astype(bool)


def alinhar(planta, im):
    """Acha onde a pintura deve ficar sobre a planta SEM deformar o desenho:
    só escala (largura e altura) e posição. Devolve o retângulo em pixels da
    planta (x0, y0, largura, altura) e um relatório. A pintura continua com
    todos os pixels originais; quem muda é o encaixe dela no mundo."""
    chao_p = chao_da_planta(planta)
    A = np.array(im.convert('RGB').resize((N, N), Image.LANCZOS))
    k = 8
    rot = _grupos(A, k)
    perto_do_mapa = cv2.dilate(chao_p.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=130).astype(bool)
    chao_a = _mascara_chao(rot, chao_p, k) & perto_do_mapa
    ident = (0.0, 0.0, float(N), float(N))
    antes = _iou(chao_p, chao_a)
    def ret_de(w):
        # src = A·dst + t  →  a pintura (src 0..N) cai em dst = (src − t)/a
        ax, ay = float(w[0, 0]), float(w[1, 1])
        return (-w[0, 2] / ax, -w[1, 2] / ay, N / ax, N / ay)
    ret = ident
    for _ in range(3):
        w = _ecc_afim(chao_p, chao_a)
        ret = ret_de(w)
        # com o encaixe novo, os grupos de cor de chão saem mais certos
        lut = np.zeros(k, bool)
        for i in range(k):
            g = _colocar(rot == i, ret, N)
            lut[i] = g.sum() > 0 and (g & chao_p).sum() / g.sum() > 0.5
        chao_a = lut[rot] & perto_do_mapa
    # ajuste fino: procura em volta, mexendo um lado de cada vez
    s = 2
    cp = cv2.resize(chao_p.astype(np.uint8), (N // s, N // s), interpolation=cv2.INTER_NEAREST).astype(bool)
    nota = lambda r: _iou(cp, _colocar(chao_a, tuple(v / s for v in r), N // s))
    melhor = nota(ret)
    for passo in (16, 8, 4, 2):
        mudou = True
        while mudou:
            mudou = False
            for i in range(4):
                for d in (-passo, passo):
                    r2 = list(ret); r2[i] += d
                    v = nota(r2)
                    if v > melhor + 1e-4:
                        melhor, ret, mudou = v, tuple(r2), True
    depois = _iou(chao_p, _colocar(chao_a, ret, N))
    if depois < antes + 0.02:
        ret, depois = ident, antes
    rel = {'antes': round(antes, 3), 'depois': round(depois, 3),
           'ret_px': [round(v, 1) for v in ret],
           'escala': [round(ret[2] / N, 3), round(ret[3] / N, 3)]}
    return ret, rel


def contorno(planta, im, ret, caminho):
    parede = ~chao_da_planta(planta)
    tela = np.zeros((N, N, 3), np.uint8)
    x0, y0, w, h = ret
    r = np.array(im.convert('RGB').resize((int(round(w)), int(round(h))), Image.LANCZOS))
    xi, yi = int(round(x0)), int(round(y0))
    ax, ay, bx, by = max(0, xi), max(0, yi), min(N, xi + r.shape[1]), min(N, yi + r.shape[0])
    tela[ay:by, ax:bx] = r[ay - yi:by - yi, ax - xi:bx - xi]
    borda = parede ^ nd.binary_erosion(parede, iterations=2)
    tela[borda] = (255, 0, 255)
    Image.fromarray(tela).resize((1000, 1000)).save(caminho)


if __name__ == '__main__':
    mapa = sys.argv[1]
    planta = os.path.join(RAIZ, 'tools', 'mapas', 'plantas', mapa + '.png')
    if len(sys.argv) > 2:
        pint = sys.argv[2]
    else:
        pasta = os.path.join(RAIZ, 'assets', 'gameplay', 'mapas_arte')
        pint = next(os.path.join(pasta, f) for f in os.listdir(pasta) if os.path.splitext(f)[0] == mapa)
    im = Image.open(pint)
    ret, rel = alinhar(planta, im)
    print(mapa, rel)
    os.makedirs(os.path.join(RAIZ, 'tools', 'mapas', 'previa'), exist_ok=True)
    contorno(planta, im, ret, os.path.join(RAIZ, 'tools', 'mapas', 'previa', mapa + '_pintura.png'))
