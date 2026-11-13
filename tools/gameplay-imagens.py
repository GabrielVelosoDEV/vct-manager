#!/usr/bin/env python3
"""
IMAGENS DO MODO JOGADOR — pastas, lista do que falta e preparo.

Uso: python3 -I tools/gameplay-imagens.py

1. Cria as pastas de envio em assets/gameplay/ (agentes/<agente>, armas,
   efeitos, objetos, texturas) e escreve em cada uma um LISTA.md com o nome
   exato de cada arquivo e se ele já chegou.
2. Prepara o que chegou em assets/gameplay/pronto/ (é isso que o jogo lê):
   - fundo verde #00FF00 vira transparente;
   - corta a sobra transparente e reduz para o tamanho que o jogo usa;
   - nos quadros do boneco: mesma escala em todos os quadros do agente,
     sem pedacinhos soltos, e o ponto dos pés marcado (é onde ele pisa).
3. Grava data/gameplay/imagens.js, o manifesto que o jogo consulta
   (.js e não .json: fetch de JSON é bloqueado em file://).

Formatos aceitos no envio: PNG, JPG ou WebP, nome em minúsculas ou não.
"""
import json, os, sys
import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(RAIZ, 'assets', 'gameplay')
PRONTO = os.path.join(BASE, 'pronto')
MANIFESTO = os.path.join(RAIZ, 'data', 'gameplay', 'imagens.js')
EXTS = ('.png', '.webp', '.jpg', '.jpeg')

AGENTES = {
    'duelista': ['jett', 'phoenix', 'reyna', 'raze', 'yoru', 'neon', 'iso', 'waylay'],
    'iniciador': ['sova', 'breach', 'skye', 'kayo', 'fade', 'gekko', 'tejo'],
    'controlador': ['brimstone', 'viper', 'omen', 'astra', 'harbor', 'clove', 'miks'],
    'sentinela': ['sage', 'cypher', 'killjoy', 'chamber', 'deadlock', 'vyse', 'veto'],
}
NOME = {'kayo': 'KAY/O'}
# nome da foto em assets/agentes quando não é o mesmo id
FOTO = {'kayo': 'kay-o', 'miks': 'mix'}
QUADROS = ['parado', 'passo1', 'passo2', 'tiro', 'caido']
ICONES = ['c', 'q', 'e', 'x']
ARMAS = ['classic', 'ghost', 'sheriff', 'spectre', 'phantom', 'vandal', 'operator']
EFEITOS = ['fumaca', 'fogo', 'explosao', 'flash']
OBJETOS = ['spike', 'caixa', 'caixa2', 'conteiner', 'barreira', 'sacos', 'barreira_compra']
# decoração e cobertura com a cara de cada mapa (os prompts estão no documento)
DECOR = {
    'caixa': 'cobertura pequena do mapa (~1,5 m), vista de cima e um pouco de frente',
    'caixa_grande': 'cobertura grande do mapa (~3 m)',
    'enfeite1': 'decoração 1 (não bloqueia: vai encostada nas paredes)',
    'enfeite2': 'decoração 2', 'enfeite3': 'decoração 3', 'enfeite4': 'decoração 4',
}
MARCAS = {'letra_a': 'letra A pintada no chão do bomb', 'letra_b': 'letra B pintada no chão',
          'letra_c': 'letra C pintada no chão (Haven e Lotus)'}
MAPAS = ['abyss', 'ascent', 'bind', 'breeze', 'corrode', 'fracture', 'haven', 'icebox', 'lotus', 'pearl', 'split', 'summit', 'sunset']

DESC_QUADRO = {'retrato': 'retrato (1024×1024)', 'parado': 'boneco parado', 'passo1': 'boneco, passo 1',
               'passo2': 'boneco, passo 2', 'tiro': 'boneco atirando', 'caido': 'boneco caído',
               'c': 'ícone da habilidade C', 'q': 'ícone da habilidade Q', 'e': 'ícone da habilidade E',
               'x': 'ícone da ultimate (X)'}


# ---------- leitura e limpeza ----------
# outros nomes que valem para o mesmo arquivo (o envio nem sempre segue a lista)
APELIDOS = {'tiro': ['atirando'], 'parado': ['parada'], 'caido': ['caida'], 'retrato': ['perfil'],
            'parede': ['topo_parede', 'topo-parede', 'topo']}


def _nomes_validos(pasta, nome):
    """'parado' também casa com 'jett_parado', 'parada'; 'ascent_parede' com
    'ascent_topo_parede'."""
    pref = os.path.basename(pasta).lower()
    base = [nome]
    if nome.startswith('letra_'):   # marca do bomb: também vale só a letra (A.png)
        base += [nome[6:]]
    elif '_' in nome:   # textura: <mapa>_<tipo>
        m, t = nome.split('_', 1)
        base += [m + '_' + a for a in APELIDOS.get(t, [])]
    else:
        base += APELIDOS.get(nome, [])
    return set(base) | {pref + '_' + n for n in base} | {pref + '-' + n for n in base}


def achar(pasta, nome):
    """O arquivo enviado com esse nome (qualquer extensão, qualquer caixa)."""
    if not os.path.isdir(pasta):
        return None
    ok = _nomes_validos(pasta, nome)
    agente = os.path.basename(os.path.dirname(pasta)) == 'agentes'
    for f in sorted(os.listdir(pasta)):
        b, ext = os.path.splitext(f)
        if ext.lower() not in EXTS:
            continue
        b = b.lower().replace(' ', '_')
        # na pasta do agente vale qualquer prefixo: kayoh_parado, kay-o_parado…
        if b in ok or (agente and '_' in b and b.split('_', 1)[1] in ok):
            return os.path.join(pasta, f)
    return None


def abrir(caminho):
    im = Image.open(caminho).convert('RGBA')
    a = np.array(im).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    # fundo verde-chave: transparente, com borda suave e sem o verde vazando
    verde = (g - np.maximum(r, b))
    chave = (verde > 90) & (g > 150)
    borda = (verde > 40) & (g > 110) & ~chave
    al = np.where(chave, 0, al)
    al = np.where(borda, np.minimum(al, 255 - (verde - 40) * 5).clip(0, 255), al)
    g = np.where(borda | chave, np.minimum(g, np.maximum(r, b)), g)
    a[..., 1], a[..., 3] = g, al
    # fundo liso de outra cor (cinza escuro, branco…): se a imagem veio sem
    # transparência e as bordas têm uma cor só, tudo dessa cor ligado à borda some
    if (al > 250).mean() > 0.98:
        from scipy import ndimage as nd
        borda_px = np.concatenate([a[0, :, :3], a[-1, :, :3], a[:, 0, :3], a[:, -1, :3]])
        cor = np.median(borda_px, axis=0)
        if np.abs(borda_px - cor).max(axis=1).mean() < 10:
            dist = np.abs(a[..., :3] - cor).max(axis=2)
            perto = dist < 14
            lab, _ = nd.label(perto)
            toca = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
            fundo = np.isin(lab, toca[toca > 0])
            # borda suave: 1 px em volta ganha meia transparência
            meio = nd.binary_dilation(fundo, iterations=1) & ~fundo & (dist < 40)
            a[..., 3] = np.where(fundo, 0, np.where(meio, 128, a[..., 3]))
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def cortar(im, folga=6):
    al = np.array(im)[..., 3]
    ys, xs = np.where(al > 12)
    if not len(ys):
        return im
    x0, x1 = max(0, xs.min() - folga), min(im.width, xs.max() + 1 + folga)
    y0, y1 = max(0, ys.min() - folga), min(im.height, ys.max() + 1 + folga)
    return im.crop((x0, y0, x1, y1))


def reduzir(im, lado):
    k = lado / max(im.width, im.height)
    if k < 1:
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    return im


def salvar(im, rel, qualidade=88):
    caminho = os.path.join(PRONTO, rel)
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.save(caminho, 'WEBP', quality=qualidade, method=6)
    return 'assets/gameplay/pronto/' + rel.replace(os.sep, '/')


def sem_fiapos(im, minimo=0.03):
    """Tira pedacinhos soltos (restos do recorte), mantendo as partes grandes —
    a arma caída ao lado do corpo, por exemplo."""
    from scipy import ndimage as nd
    a = np.array(im)
    lab, n = nd.label(a[..., 3] > 20)
    if n <= 1:
        return im
    tam = nd.sum(np.ones_like(lab), lab, range(1, n + 1))
    manter = [i + 1 for i, t in enumerate(tam) if t >= minimo * tam.max()]
    fora = ~np.isin(lab, manter) & (lab > 0)
    a[..., 3] = np.where(fora, 0, a[..., 3])
    return Image.fromarray(a, 'RGBA')


ALTURA_PX = 200   # altura do quadro "parado" depois de preparado


def quadro_boneco(caminho, rel, fator):
    """Boneco em pé (vista de cima inclinada): todos os quadros do agente com o
    mesmo fator de escala (vem do quadro parado), sem fiapos, e com o ponto
    dos pés (px, py): é ali que o boneco pisa no mapa."""
    # em pé, o boneco é uma peça só; caído, a arma solta ao lado também conta
    im = cortar(sem_fiapos(abrir(caminho), 0.08 if rel.endswith('caido') else 0.5), folga=2)
    im = im.resize((max(1, round(im.width * fator)), max(1, round(im.height * fator))), Image.LANCZOS)
    al = np.array(im)[..., 3].astype(float)
    linhas = np.where(al.max(axis=1) > 60)[0]
    y_pe = int(linhas.max()) if len(linhas) else im.height - 1
    faixa = al[max(0, y_pe - max(4, im.height // 7)):y_pe + 1]
    xs = np.arange(im.width)
    peso = faixa.sum(axis=0)
    px = float((xs * peso).sum() / peso.sum()) if peso.sum() else im.width / 2
    tot = al.sum(axis=0)
    cx = float((xs * tot).sum() / tot.sum()) if tot.sum() else im.width / 2
    return {'src': salvar(im, rel + '.webp'), 'w': im.width, 'h': im.height,
            'px': round(px, 1), 'py': y_pe, 'cx': round(cx, 1)}


def fator_do_agente(pasta):
    c = achar(pasta, 'parado')
    if not c:
        return None
    im = cortar(sem_fiapos(abrir(c), 0.5), folga=2)
    return ALTURA_PX / im.height


def simples(caminho, rel, lado, cortar_sobra=True, fiapos=None):
    im = abrir(caminho)
    if fiapos:
        im = sem_fiapos(im, fiapos)
    if cortar_sobra:
        im = cortar(im)
    im = reduzir(im, lado)
    return {'src': salvar(im, rel + '.webp'), 'w': im.width, 'h': im.height}


def problema_de_recorte(caminho):
    """Imagem que não dá para usar: objeto minúsculo (sobrou só um pedaço do
    recorte) ou cortado na borda da imagem."""
    from scipy import ndimage as nd
    im = abrir(caminho)
    a = np.array(im)[..., 3] > 20
    lab, n = nd.label(a)
    if not n:
        return 'vazia (só fundo)'
    tam = nd.sum(a, lab, range(1, n + 1))
    k = int(np.argmax(tam)) + 1
    ys, xs = np.where(lab == k)
    lado = max(ys.max() - ys.min(), xs.max() - xs.min()) + 1
    if lado < 45:
        return f'o objeto tem só {lado} px — parece um pedaço do recorte'
    if xs.min() == 0 or ys.min() == 0 or xs.max() == im.width - 1 or ys.max() == im.height - 1:
        return 'o objeto está cortado na borda da imagem'
    return None


def textura(caminho, rel):
    im = Image.open(caminho).convert('RGB')
    if im.width != 512 or im.height != 512:
        im = im.resize((512, 512), Image.LANCZOS)
    caminho_s = os.path.join(PRONTO, rel + '.webp')
    os.makedirs(os.path.dirname(caminho_s), exist_ok=True)
    im.save(caminho_s, 'WEBP', quality=86, method=6)
    return {'src': 'assets/gameplay/pronto/' + rel + '.webp', 'w': 512, 'h': 512}


# ---------- listas ----------
def lista(pasta, titulo, itens, extra=''):
    os.makedirs(pasta, exist_ok=True)
    tem = sum(1 for n, _ in itens if achar(pasta, n))
    linhas = [f'# {titulo} — nomes que o jogo procura', '',
              'Gerado por `python3 -I tools/gameplay-imagens.py`. Não edite à mão.', '',
              'Salve cada imagem nesta pasta com o nome exato da lista. PNG, JPG ou WebP',
              'servem (troque só a extensão). Fundo transparente ou verde liso #00FF00.', '']
    if extra:
        linhas += [extra, '']
    linhas += [f'{tem}/{len(itens)} com imagem.', '']
    for n, d in itens:
        linhas.append(f"- [{'x' if achar(pasta, n) else ' '}] `{n}.png` — {d}")
    with open(os.path.join(pasta, 'LISTA.md'), 'w') as f:
        f.write('\n'.join(linhas) + '\n')
    return tem, len(itens)


def main():
    # refaz o pronto/ do zero: imagem apagada do envio some do jogo também
    if os.path.isdir(PRONTO):
        import shutil
        shutil.rmtree(PRONTO)
    man = {'agentes': {}, 'armas': {}, 'efeitos': {}, 'objetos': {}, 'texturas': {}, 'decoracao': {}, 'marcas': {}, 'mapas_arte': {}}
    placar = []
    estranhos = []
    refazer = []

    def conferir_sobras(pasta, nomes):
        if not os.path.isdir(pasta):
            return
        usados = {achar(pasta, n) for n in nomes}
        for f in os.listdir(pasta):
            c = os.path.join(pasta, f)
            if os.path.splitext(f)[1].lower() in EXTS and c not in usados:
                estranhos.append(os.path.relpath(c, RAIZ))

    # agentes
    for papel, nomes in AGENTES.items():
        for ag in nomes:
            pasta = os.path.join(BASE, 'agentes', ag)
            tem_foto = achar(os.path.join(RAIZ, 'assets', 'agentes'), FOTO.get(ag, ag))
            itens = [(n, DESC_QUADRO[n] + (' — opcional: sem ele, o jogo usa a foto de assets/agentes'
                                           if n == 'retrato' and tem_foto else '')) for n in ['retrato'] + QUADROS + ICONES]
            placar.append((f'agentes/{ag}',) + lista(pasta, f'{NOME.get(ag, ag.capitalize())} ({papel})', itens,
                          'O boneco (parado, passo1, passo2, tiro, caido) é em pé, visto de cima e de lado, virado\n'
                          'para a direita (o jogo espelha quando mira para a esquerda). Vale também o nome com o\n'
                          'agente na frente (jett_parado.png) e atirando no lugar de tiro.'))
            conferir_sobras(pasta, {n for n, _ in itens})
            ent = {}
            c = achar(pasta, 'retrato')
            if c:
                ent['retrato'] = simples(c, f'agentes/{ag}/retrato', 512, cortar_sobra=False)
            else:
                # sem retrato próprio: usa a foto do agente que o modo gestão já tem
                foto = achar(os.path.join(RAIZ, 'assets', 'agentes'), FOTO.get(ag, ag))
                if foto:
                    with Image.open(foto) as f:
                        w, h = f.size
                    ent['retrato'] = {'src': os.path.relpath(foto, RAIZ).replace(os.sep, '/'), 'w': w, 'h': h}
            fator = fator_do_agente(pasta)
            for q in QUADROS:
                c = achar(pasta, q)
                if c and fator:
                    ent[q] = quadro_boneco(c, f'agentes/{ag}/{q}', fator)
            for k in ICONES:
                c = achar(pasta, k)
                if c:
                    ent[k] = simples(c, f'agentes/{ag}/{k}', 128, cortar_sobra=False)
            if ent:
                man['agentes'][ag] = ent
    # armas, efeitos, objetos, texturas
    grupos = [
        ('armas', 'Armas', [(n, 'silhueta de lado, cano para a direita') for n in ARMAS], 384, True),
        ('efeitos', 'Efeitos', [(n, 'efeito visto de cima, 512×512') for n in EFEITOS], 256, False),
        ('objetos', 'Spike e objetos', [(n, 'visto de cima') for n in OBJETOS], 256, True),
    ]
    for chave, titulo, itens, lado, corta in grupos:
        pasta = os.path.join(BASE, chave)
        placar.append((chave,) + lista(pasta, titulo, itens))
        conferir_sobras(pasta, {n for n, _ in itens})
        for n, _ in itens:
            c = achar(pasta, n)
            if c:
                man[chave][n] = simples(c, f'{chave}/{n}', lado, cortar_sobra=corta)
    for mp in MAPAS:
        pasta = os.path.join(BASE, 'decoracao', mp)
        itens = list(DECOR.items())
        placar.append((f'decoracao/{mp}',) + lista(pasta, f'Decoração de {mp.capitalize()}', itens,
                      'Vista de cima com a câmera um pouco inclinada (como os bonecos), luz de baixo à direita.'))
        conferir_sobras(pasta, {n for n, _ in itens})
        for n, _ in itens:
            c = achar(pasta, n)
            if c:
                prob = problema_de_recorte(c)
                if prob:
                    refazer.append(f'decoracao/{mp}/{n}: {prob}')
                    continue
                # recorte de folha com vários objetos: fica o principal (e quem
                # tiver tamanho parecido), sem os pedaços do vizinho na borda
                man['decoracao'].setdefault(mp, {})[n] = simples(c, f'decoracao/{mp}/{n}', 256, fiapos=0.3)
    # o mapa pintado inteiro (gerado com a planta de tools/mapas/plantas/): o
    # encaixe no mundo vem do plantas.json — a pintura cobre o quadrado da planta
    pasta = os.path.join(BASE, 'mapas_arte')
    itens = [(mp, f'{mp.capitalize()} pintado de cima (quadrado, com a planta tools/mapas/plantas/{mp}.png)') for mp in MAPAS]
    placar.append(('mapas_arte',) + lista(pasta, 'Mapas pintados', itens,
                  'Gere junto com a planta do mesmo nome (tools/mapas/plantas/). Os prompts estão no documento, aba "Mapas pintados".'))
    conferir_sobras(pasta, {n for n, _ in itens})
    try:
        plantas = json.load(open(os.path.join(RAIZ, 'tools', 'mapas', 'plantas', 'plantas.json')))
    except Exception:
        plantas = {}
    for n, _ in itens:
        c = achar(pasta, n)
        if c and n in plantas:
            caminho = os.path.join(PRONTO, 'mapas_arte', n + '.webp')
            planta = os.path.join(RAIZ, 'tools', 'mapas', 'plantas', n + '.png')
            fontes = [c, planta, os.path.join(RAIZ, 'tools', 'mapas', 'alinhar.py')]
            if os.path.exists(caminho) and os.path.getmtime(caminho) > max(os.path.getmtime(f) for f in fontes):
                im = Image.open(caminho)            # já preparado e nada mudou desde então
            else:
                im = Image.open(c).convert('RGB')
                if im.width != im.height:   # o gerador devolveu retângulo: corta o centro
                    l = min(im.size); im = im.crop(((im.width - l) // 2, (im.height - l) // 2, (im.width + l) // 2, (im.height + l) // 2))
                # encaixa o desenho na planta (a IA costuma esticar ou deslocar um pouco)
                sys.path.insert(0, os.path.join(RAIZ, 'tools', 'mapas'))
                from alinhar import alinhar
                im, rel = alinhar(planta, im)
                print(f'  {n}: encaixe na planta {rel}')
                if im.width > 3072:
                    im = im.resize((3072, 3072), Image.LANCZOS)
                os.makedirs(os.path.dirname(caminho), exist_ok=True)
                im.save(caminho, 'WEBP', quality=90, method=6)
            p = plantas[n]
            man['mapas_arte'][n] = {'src': f'assets/gameplay/pronto/mapas_arte/{n}.webp', 'w': im.width, 'h': im.height,
                                    'lado_m': p['lado_m'], 'x0_m': p['x0_m'], 'y0_m': p['y0_m']}
    pasta = os.path.join(BASE, 'marcas')
    itens = list(MARCAS.items())
    placar.append(('marcas',) + lista(pasta, 'Marcas do bomb', itens))
    conferir_sobras(pasta, {n for n, _ in itens})
    for n, _ in itens:
        c = achar(pasta, n)
        if c:
            man['marcas'][n] = simples(c, f'marcas/{n}', 512)
    pasta = os.path.join(BASE, 'texturas')
    itens = [(f'{m}_{t}', f'{m.capitalize()}: {"piso" if t == "piso" else "topo de parede"}, repetível, 512×512')
             for m in MAPAS for t in ('piso', 'parede')]
    placar.append(('texturas',) + lista(pasta, 'Texturas dos mapas', itens))
    conferir_sobras(pasta, {n for n, _ in itens})
    for n, _ in itens:
        c = achar(pasta, n)
        if c:
            man['texturas'][n] = textura(c, f'texturas/{n}')

    os.makedirs(os.path.dirname(MANIFESTO), exist_ok=True)
    with open(MANIFESTO, 'w') as f:
        f.write('/* GERADO por tools/gameplay-imagens.py — não editar à mão.\n'
                '   O que já chegou de imagem para o modo jogador, já preparado em\n'
                '   assets/gameplay/pronto/. Boneco: w/h em px, px/py = os pés, cx = centro. */\n')
        f.write('const IMAGENS_GAMEPLAY=' + json.dumps(man, ensure_ascii=False, separators=(',', ':')) + ';\n')

    total = sum(t for _, t, _ in placar), sum(n for _, _, n in placar)
    for nome, t, n in placar:
        if t:
            print(f'  {nome:22s} {t}/{n}')
    print(f'imagens do modo jogador: {total[0]}/{total[1]} enviadas')
    if refazer:
        print('imagens que precisam ser refeitas (ficaram de fora do jogo):')
        for r in refazer:
            print('  ', r)
    if estranhos:
        print('arquivos com nome que o jogo não procura (renomeie):')
        for e in estranhos:
            print('  ', e)


if __name__ == '__main__':
    main()
