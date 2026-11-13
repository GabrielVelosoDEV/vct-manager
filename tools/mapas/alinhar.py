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


def _campo(w, fx, fy):
    """para cada pixel da planta, de onde ler na pintura (resolução N)"""
    gx, gy = np.meshgrid(np.arange(N, dtype=np.float32), np.arange(N, dtype=np.float32))
    qx, qy = gx + fx, gy + fy                      # ponto no espaço já encaixado pelo afim
    sx = w[0, 0] * qx + w[0, 1] * qy + w[0, 2]
    sy = w[1, 0] * qx + w[1, 1] * qy + w[1, 2]
    return sx, sy


def _paisagem(A):
    """o pedaço mais liso da paisagem da própria pintura (areia, neve, névoa),
    para preencher o que ficou fora dela depois do encaixe"""
    h, wd = A.shape[:2]; t = min(h, wd) // 6
    cinza = cv2.cvtColor(A, cv2.COLOR_RGB2GRAY).astype(np.float32)
    borda = cv2.GaussianBlur(np.abs(cv2.Laplacian(cinza, cv2.CV_32F)), (0, 0), 2)
    melhor = None
    passo = max(1, t // 4)
    for y in range(0, h - t + 1, passo):
        for x in range(0, wd - t + 1, passo):
            # só a moldura de fora (perto da borda da imagem), onde não há mapa
            if t * 1.2 < y < h - 2.2 * t and t * 1.2 < x < wd - 2.2 * t:
                continue
            e = borda[y:y + t, x:x + t].mean()
            if melhor is None or e < melhor[0]:
                melhor = (e, y, x)
    _, y, x = melhor
    return A[y:y + t, x:x + t]


def alinhar(planta, im, saida_px=None):
    """Devolve (pintura alinhada como PIL, relatório). im: PIL da pintura."""
    chao_p = chao_da_planta(planta)
    src = np.array(im.convert('RGB'))
    A = np.array(Image.fromarray(src).resize((N, N), Image.LANCZOS))
    k = 8
    rot = _grupos(A, k)
    # paisagem longe do mapa (névoa, areia clara) não conta como chão
    perto_do_mapa = cv2.dilate(chao_p.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=130).astype(bool)
    chao_a = _mascara_chao(rot, chao_p, k) & perto_do_mapa
    antes = _iou(chao_p, chao_a)
    w = _ecc_afim(chao_p, chao_a)
    for _ in range(2):            # com o encaixe melhor, os grupos de chão saem mais certos
        rw = cv2.warpAffine(rot.astype(np.float32), w, (N, N), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP, borderValue=-1)
        lut = np.zeros(k, bool)
        for i in range(k):
            g = rw == i
            lut[i] = g.sum() > 0 and (g & chao_p).sum() / g.sum() > 0.5
        chao_a = lut[rot] & perto_do_mapa
        w = _ecc_afim(chao_p, chao_a)
    mw = cv2.warpAffine(chao_a.astype(np.float32), w, (N, N), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
    afim = _iou(chao_p, mw > 0.5)
    # fluxo ótico suave por cima do afim
    gx, gy = np.meshgrid(np.arange(N, dtype=np.float32), np.arange(N, dtype=np.float32))
    fx = np.zeros((N, N), np.float32); fy = np.zeros((N, N), np.float32)
    atual = mw
    for r in (14, 8, 5):
        a8 = (cv2.GaussianBlur(chao_p.astype(np.float32), (0, 0), r) * 255).astype(np.uint8)
        b8 = (cv2.GaussianBlur((atual > 0.5).astype(np.float32), (0, 0), r) * 255).astype(np.uint8)
        fl = cv2.calcOpticalFlowFarneback(a8, b8, None, 0.5, 5, 61, 5, 7, 1.5, 0)
        fl[..., 0] = cv2.GaussianBlur(fl[..., 0], (0, 0), 18); fl[..., 1] = cv2.GaussianBlur(fl[..., 1], (0, 0), 18)
        nx, ny = gx + fl[..., 0], gy + fl[..., 1]
        fx = cv2.remap(fx, nx, ny, cv2.INTER_LINEAR) + fl[..., 0]
        fy = cv2.remap(fy, nx, ny, cv2.INTER_LINEAR) + fl[..., 1]
        atual = cv2.remap(mw, gx + fx, gy + fy, cv2.INTER_LINEAR)
    depois = _iou(chao_p, atual > 0.5)
    if depois < afim:             # o fluxo piorou: fica só o afim
        fx[:] = 0; fy[:] = 0; depois = afim
    if depois < antes + 0.03:     # a pintura já estava no lugar: não mexe
        return im.convert('RGB'), {'antes': round(antes, 3), 'depois': round(depois, 3), 'mantida': True}
    # aplica na resolução final, lendo direto da pintura original
    R = saida_px or max(N, min(3072, max(src.shape[:2])))
    sx, sy = _campo(w, fx, fy)
    k_src = np.array([src.shape[1] / N, src.shape[0] / N], np.float32)
    sx = cv2.resize(sx * k_src[0], (R, R), interpolation=cv2.INTER_LINEAR)
    sy = cv2.resize(sy * k_src[1], (R, R), interpolation=cv2.INTER_LINEAR)
    # (o campo é por pixel de N; ao ampliar, cada pixel de R lê o ponto certo)
    final = cv2.remap(src, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    fora = (sx < 0) | (sy < 0) | (sx > src.shape[1] - 1) | (sy > src.shape[0] - 1)
    if fora.any():
        # cor: continua a paisagem vizinha (inpaint em escala menor, fica liso)
        q = 4
        pequeno = cv2.resize(final, (R // q, R // q), interpolation=cv2.INTER_AREA)
        mp = cv2.dilate(cv2.resize(fora.astype(np.uint8), (R // q, R // q), interpolation=cv2.INTER_NEAREST), np.ones((3, 3), np.uint8))
        base = cv2.resize(cv2.inpaint(pequeno, mp * 255, 9, cv2.INPAINT_TELEA), (R, R), interpolation=cv2.INTER_CUBIC).astype(np.float32)
        # textura: só o detalhe fino (sem sombras nem objetos grandes) de um pedaço liso da paisagem
        pedaco = _paisagem(src).astype(np.float32)
        detalhe = pedaco - cv2.GaussianBlur(pedaco, (0, 0), 6)
        linha = np.concatenate([detalhe, detalhe[:, ::-1]], 1)
        bloco = np.concatenate([linha, linha[::-1]], 0)
        tile = np.tile(bloco, (R // bloco.shape[0] + 1, R // bloco.shape[1] + 1, 1))[:R, :R]
        preench = np.clip(base + tile * 0.9, 0, 255)
        suave = cv2.GaussianBlur(fora.astype(np.float32), (0, 0), max(3, R / 200))
        suave = np.maximum(suave, fora.astype(np.float32))[..., None]
        final = (final * (1 - suave) + preench * suave).astype(np.uint8)
    desloc = float(np.hypot(fx, fy).max())
    rel = {'antes': round(antes, 3), 'afim': round(afim, 3), 'depois': round(depois, 3),
           'escala': round(float(np.sqrt(abs(np.linalg.det(w[:, :2])))), 3),
           'desloc_px': [round(float(w[0, 2]), 1), round(float(w[1, 2]), 1)], 'fluxo_max_px': round(desloc, 1)}
    return Image.fromarray(final), rel


def contorno(planta, im, caminho):
    p = np.array(Image.open(planta).convert('RGB')).astype(int)
    A = np.array(im.convert('RGB').resize((N, N)))
    parede = ~chao_da_planta(planta)
    borda = parede ^ nd.binary_erosion(parede, iterations=2)
    A[borda] = (255, 0, 255)
    Image.fromarray(A).resize((1000, 1000)).save(caminho)


if __name__ == '__main__':
    mapa = sys.argv[1]
    planta = os.path.join(RAIZ, 'tools', 'mapas', 'plantas', mapa + '.png')
    if len(sys.argv) > 2:
        pint = sys.argv[2]
    else:
        pasta = os.path.join(RAIZ, 'assets', 'gameplay', 'mapas_arte')
        pint = next(os.path.join(pasta, f) for f in os.listdir(pasta) if os.path.splitext(f)[0] == mapa)
    out, rel = alinhar(planta, Image.open(pint))
    print(mapa, rel)
    os.makedirs(os.path.join(RAIZ, 'tools', 'mapas', 'previa'), exist_ok=True)
    contorno(planta, out, os.path.join(RAIZ, 'tools', 'mapas', 'previa', mapa + '_pintura.png'))
