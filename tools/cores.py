#!/usr/bin/env python3
"""Cor de destaque de cada clube, tirada do próprio escudo (assets/logos).

Regra pedida: a cor que chama atenção, não a de fundo. Num escudo preto e
vermelho, fica o vermelho; preto, branco e cinza só valem quando o escudo
não tem cor nenhuma — aí o clube fica com um prata claro, que lê bem sobre o
fundo escuro do jogo.

Como: reduz o escudo, ignora o transparente, separa os pixels "coloridos"
(saturação e brilho mínimos), agrupa por matiz e pega o grupo mais forte
(peso = saturação × brilho). A cor final é clareada se ficar escura demais
para aparecer sobre o painel.

Gera data/cores.js (CORES_CLUBES: sigla → #rrggbb). Rodar de novo sempre que
um escudo mudar:  python3 tools/cores.py
"""
import colorsys, os, json, glob
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRATA = '#D6DCE2'
# Escudo sem cor (branco e preto): quando o clube tem uma cor de marca que
# todo mundo reconhece, ela entra no lugar do prata. Só vale para escudo
# monocromático — se o escudo tem cor, a do escudo manda.
MARCA_CONHECIDA = {'PRX': '#FF5EA0', 'G2': '#FF3B3B', 'KC': '#3AA0FF', 'TL': '#2E7BE0', 'EG': '#22A8E6'}

def cor_do_escudo(caminho):
    im = Image.open(caminho).convert('RGBA')
    im.thumbnail((72, 72))
    opacos, cores = 0, []
    for r, g, b, a in (im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()):
        if a < 140:
            continue
        opacos += 1
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s >= 0.35 and v >= 0.28:
            cores.append((h, s, v, r, g, b))
    if not opacos or len(cores) < max(12, opacos * 0.04):
        return PRATA
    bins = {}
    for h, s, v, r, g, b in cores:
        k = int(h * 24) % 24
        bins.setdefault(k, []).append((s * v, r, g, b))
    # vizinhos de matiz somam: um degradê não vira dois grupos fracos
    def forca(k):
        return sum(w for w, *_ in bins.get(k, [])) + 0.5 * sum(
            w for j in ((k - 1) % 24, (k + 1) % 24) for w, *_ in bins.get(j, []))
    melhor = max(bins, key=forca)
    px = bins[melhor]
    tot = sum(w for w, *_ in px)
    r = sum(w * r for w, r, g, b in px) / tot
    g = sum(w * g for w, r, g, b in px) / tot
    b = sum(w * b for w, r, g, b in px) / tot
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    v = max(v, 0.62)          # escuro demais some no painel
    s = min(1.0, max(s, 0.45))
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))

def main():
    cores = {}
    for f in sorted(glob.glob(os.path.join(RAIZ, 'assets', 'logos', '*'))):
        nome, ext = os.path.splitext(os.path.basename(f))
        if ext.lower() not in ('.png', '.webp', '.jpg', '.jpeg', '.svg') or ext.lower() == '.svg':
            continue
        try:
            c = cor_do_escudo(f)
            if c == PRATA and nome.upper() in MARCA_CONHECIDA:
                c = MARCA_CONHECIDA[nome.upper()]
            cores[nome.upper()] = c
        except Exception as e:  # escudo corrompido não derruba o resto
            print('pulei', f, e)
    js = ('/* Gerado por tools/cores.py a partir de assets/logos: cor de destaque\n'
          '   de cada clube (sigla → cor). Ajuste fino: Banco de dados › Times. */\n'
          'const CORES_CLUBES=' + json.dumps(cores, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
    open(os.path.join(RAIZ, 'data', 'cores.js'), 'w', encoding='utf8').write(js)
    prata = sum(1 for c in cores.values() if c == PRATA)
    print(f'{len(cores)} escudos · {prata} sem cor (prata)')

if __name__ == '__main__':
    main()
