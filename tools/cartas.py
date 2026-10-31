#!/usr/bin/env python3
"""Prepara as molduras das cartas para o jogo.

Uso: python3 tools/cartas.py pasta-com-os-png [saida=assets/cartas]

A pasta precisa ter recruta.png, profissional.png, elite.png e lenda.png,
as quatro em 2:3 (1024x1536 é o tamanho que os geradores entregam), com a
janela do jogador em preto puro. O script:

  1. acha a janela pelo preto que se liga ao centro da carta (só dentro da
     faixa onde a janela pode estar, para o preto do fundo não vazar);
  2. deixa a janela transparente, com a borda suave para o brilho da
     moldura cair por cima da foto;
  3. salva em WebP 720x1080 com transparência em assets/cartas/.

Precisa só do Pillow (pip install pillow) e do numpy.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

CARTAS = ['recruta', 'profissional', 'elite', 'lenda']
LARG, ALT = 720, 1080
# a janela mora nesta faixa da carta (em fração): fora dela o preto é fundo
FAIXA_X, FAIXA_Y = (0.07, 0.93), (0.03, 0.84)
LIMIAR = 26          # preto da janela: canal mais forte abaixo disso


def janela(rgb):
    alt, larg, _ = rgb.shape
    mx = rgb.max(axis=2)
    escuro = mx < LIMIAR
    faixa = np.zeros_like(escuro)
    faixa[int(alt * FAIXA_Y[0]):int(alt * FAIXA_Y[1]),
          int(larg * FAIXA_X[0]):int(larg * FAIXA_X[1])] = True
    escuro &= faixa
    marca = np.zeros_like(escuro)
    ini = (alt // 2, larg // 2)
    if not escuro[ini]:
        raise SystemExit('o centro da carta não é preto: a janela precisa ser preta pura')
    marca[ini] = True
    fila = deque([ini])
    while fila:
        y, x = fila.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if escuro[yy, xx] and not marca[yy, xx]:
                marca[yy, xx] = True
                fila.append((yy, xx))
    nucleo = Image.fromarray((marca * 255).astype('uint8'))
    nucleo = nucleo.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    borda = np.asarray(nucleo.filter(ImageFilter.MaxFilter(7))) > 0
    dentro = np.asarray(nucleo) > 0
    alfa = np.ones(mx.shape)
    suave = np.clip((mx - 6) / 34, 0, 1)   # brilho da moldura fica, preto some
    alfa[borda] = suave[borda]
    alfa[dentro] = 0
    return alfa


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    ent = Path(sys.argv[1])
    sai = Path(sys.argv[2] if len(sys.argv) > 2 else 'assets/cartas')
    sai.mkdir(parents=True, exist_ok=True)
    for nome in CARTAS:
        arq = ent / (nome + '.png')
        if not arq.exists():
            print('falta', arq)
            continue
        rgb = np.asarray(Image.open(arq).convert('RGB')).astype(int)
        alfa = janela(rgb)
        img = Image.fromarray(np.dstack([rgb, (alfa * 255).astype(int)]).astype('uint8'), 'RGBA')
        img = img.resize((LARG, ALT), Image.LANCZOS)
        destino = sai / (nome + '.webp')
        img.save(destino, 'WEBP', quality=86, method=6)
        print(destino, f'{destino.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
