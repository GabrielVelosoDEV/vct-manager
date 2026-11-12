#!/usr/bin/env python3
"""Confere a extração: desenha a grade gerada por cima do minimapa original.
Verde = chão da grade; vermelho = o minimapa parece chão mas a grade pôs parede
(caminho perdido); azul = spawns e bombs. Saída: tools/mapas/previa/<mapa>_sobre.png
Uso: python3 -I tools/mapas/sobrepor.py [mapa ...]"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extrair as E

def main():
    js = open(os.path.join(E.RAIZ, 'data', 'gameplay', 'mapas.js')).read()
    M = json.loads(js[js.index('{'):js.rindex(';')])
    nomes = sys.argv[1:] or sorted(M)
    for n in nomes:
        d = M[n]
        grade = np.array([list(E_rle(l)) for l in d['grade']])
        im = Image.open(os.path.join(E.ORIG, n + '.webp')).convert('RGB')
        o = d['origem']; esc = o['escala']
        H, W = grade.shape
        # grade -> pixels do minimapa
        big = Image.fromarray(((grade != '#') * 255).astype(np.uint8)).resize(
            (round(W / esc), round(H / esc)), Image.NEAREST)
        chao = np.zeros((im.height, im.width), bool)
        b = np.array(big) > 0
        h2, w2 = min(b.shape[0], im.height - o['y0']), min(b.shape[1], im.width - o['x0'])
        chao[o['y0']:o['y0'] + h2, o['x0']:o['x0'] + w2] = b[:h2, :w2]
        cls, tom = E.classificar(np.array(im))
        cls = E.preencher(cls)
        orig = (cls == 1) | (cls == 3)
        a = np.array(im).astype(float) * 0.55
        a[chao] = a[chao] * 0.5 + np.array([60, 200, 90]) * 0.5
        perdido = orig & ~chao
        a[perdido] = [255, 40, 40]
        out = Image.fromarray(a.astype(np.uint8))
        dr = ImageDraw.Draw(out)
        for k, (cx, cy) in d.get('spawn', {}).items():
            x, y = o['x0'] + cx / esc, o['y0'] + cy / esc
            dr.ellipse((x - 6, y - 6, x + 6, y + 6), outline=(80, 160, 255), width=3)
            dr.text((x + 8, y - 6), k, fill=(80, 160, 255))
        out.save(os.path.join(E.PREVIA, n + '_sobre.png'))
        print(n, 'perdido px', int(perdido.sum()))

def E_rle(s):
    out, num = '', ''
    for ch in s:
        if ch.isdigit(): num += ch; continue
        out += ch * (int(num) if num else 1); num = ''
    return out

if __name__ == '__main__':
    main()
