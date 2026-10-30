#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monta o pacote de retratos a partir do dataset SFHQ.

    python tools/rostos.py --fonte "D:/SFHQ_part4" --total 2000 --clip

O que ele faz, em ordem:
  1. acha as imagens na pasta que você baixou
  2. separa em baldes por região, faixa etária e gênero
  3. aplica o grade escuro para os retratos assentarem no HUD
  4. reduz para 256x256 e grava em WebP
  5. escreve assets/rostos/<balde>/NNNN.webp e o manifesto data/rostos.js

O passo 2 é o único que precisa de biblioteca pesada. O SFHQ já vem com os
vetores CLIP das IMAGENS pré-calculados, então só falta codificar os textos
dos prompts — é o text encoder do CLIP, que roda em CPU. Com --clip ele faz
isso; sem --clip ele distribui por hash, o que funciona mas dá coach de 55
anos com cara de 20.

Dependências:
    pip install pillow numpy          # sempre
    pip install open_clip_torch       # só para --clip

Licença do material: as imagens do SFHQ são sintéticas e o repositório está
sob MIT. Elas NÃO são fotos de pessoas reais. Ainda assim, veja a ressalva
sobre nomes reais no README.
"""
import argparse, json, os, pickle, sys, hashlib
from pathlib import Path

def _falhou(nome, erro):
    """Mostra o erro DE VERDADE em vez de assumir que o pacote não existe.
    Quando o pip diz 'already satisfied' e mesmo assim o import quebra, quase
    sempre é pip e script em interpretadores diferentes — por isso a dica usa
    sys.executable, que aponta para o Python que está rodando isto agora."""
    sys.exit(
        f"Não consegui importar {nome}.\n"
        f"  erro: {type(erro).__name__}: {erro}\n"
        f"  Python em uso: {sys.executable}\n"
        f"  versão: {sys.version.split()[0]}\n\n"
        f"Se o pip disse 'Requirement already satisfied', ele instalou em outro\n"
        f"interpretador. Instale exatamente neste:\n"
        f'    "{sys.executable}" -m pip install pillow numpy\n'
    )

# --ambiente existe exatamente para o caso em que estes imports quebram.
# Se eu abortasse aqui, o diagnóstico nunca rodaria — então nesse modo os
# imports podem falhar em silêncio e o relatório mostra o porquê.
DIAGNOSTICO = '--ambiente' in sys.argv

Image = None
np = None
try:
    from PIL import Image
except Exception as e:
    if not DIAGNOSTICO:
        _falhou('Pillow (PIL)', e)
try:
    import numpy as np
except Exception as e:
    if not DIAGNOSTICO:
        _falhou('numpy', e)

# ---------------------------------------------------------------- baldes
# Região do circuito x faixa etária x gênero. Os prompts são usados só no
# modo --clip; edite à vontade, é a parte que define a cara do seu mundo.
PROMPTS = {
 'AMER_jovem_m'   : ['a photo of a young latin american man in his early twenties',
                     'a photo of a young american man in his twenties',
                     'a photo of a young brazilian man in his twenties'],
 'AMER_veterano_m': ['a photo of a latin american man in his forties',
                     'a photo of an american man in his fifties'],
 'AMER_jovem_f'   : ['a photo of a young latin american woman in her twenties'],
 'AMER_veterano_f': ['a photo of a latin american woman in her forties'],
 'EMEA_jovem_m'   : ['a photo of a young european man in his early twenties',
                     'a photo of a young turkish man in his twenties',
                     'a photo of a young middle eastern man in his twenties'],
 'EMEA_veterano_m': ['a photo of a european man in his forties',
                     'a photo of a european man in his fifties'],
 'EMEA_jovem_f'   : ['a photo of a young european woman in her twenties'],
 'EMEA_veterano_f': ['a photo of a european woman in her forties'],
 'PAC_jovem_m'    : ['a photo of a young korean man in his early twenties',
                     'a photo of a young japanese man in his twenties',
                     'a photo of a young southeast asian man in his twenties',
                     'a photo of a young indian man in his twenties'],
 'PAC_veterano_m' : ['a photo of a korean man in his forties',
                     'a photo of a southeast asian man in his fifties'],
 'PAC_jovem_f'    : ['a photo of a young east asian woman in her twenties'],
 'PAC_veterano_f' : ['a photo of an east asian woman in her forties'],
 'CN_jovem_m'     : ['a photo of a young chinese man in his early twenties',
                     'a photo of a young chinese man in his twenties'],
 'CN_veterano_m'  : ['a photo of a chinese man in his forties',
                     'a photo of a chinese man in his fifties'],
 'CN_jovem_f'     : ['a photo of a young chinese woman in her twenties'],
 'CN_veterano_f'  : ['a photo of a chinese woman in her forties'],
}
# Peso de cada balde no total. O circuito de Tier 1 é quase todo masculino,
# e a comissão técnica é quem traz a maioria das mulheres.
PESOS = {b: (0.28 if b.endswith('_jovem_m') else
             0.14 if b.endswith('_veterano_m') else
             0.05 if b.endswith('_jovem_f') else 0.03) for b in PROMPTS}

# ---------------------------------------------------------------- grade
# Não é filtro por filtro: foto crua de banco de imagem destoa de um HUD
# escuro. Dessaturar em parte (preservando etnia), esfriar as sombras e
# fechar uma vinheta faz os 2000 retratos lerem como um sistema só.
DESSAT      = 0.45
SOMBRA      = (0.055, 0.085, 0.115)             # cor somada nas sombras
# tupla, não np.array: no modo --ambiente o numpy pode não ter subido, e
# uma constante de módulo que dependa dele derrubaria o diagnóstico.
CONTRASTE   = 1.12
VINHETA     = 0.34

def aplicar_grade(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    lum = (a * np.array([0.299, 0.587, 0.114])).sum(axis=2, keepdims=True)
    a = a * (1 - DESSAT) + lum * DESSAT
    a = a + np.array(SOMBRA) * (1.0 - lum)
    a = np.clip((a - 0.5) * CONTRASTE + 0.5, 0, 1)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w/2)/(w/2))**2 + ((yy - h/2)/(h/2))**2)
    a = a * (1 - VINHETA * np.clip(r - 0.55, 0, None)**1.4)[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

# ---------------------------------------------------------------- fonte
EXT_IMG = {'.jpg', '.jpeg', '.png', '.webp'}

def achar_imagens(raiz):
    """O SFHQ guarda o acervo em images/ e repete um recorte dele nas pastas
    'a tiny sample' e 'a small samples'. Varrer a raiz inteira traria essas
    cópias junto e o mesmo rosto acabaria em dois baldes — então, quando
    images/ existe, é só ela que conta. De quebra, evita percorrer as 125 mil
    máscaras de segmentations/, que são .png e demoram uma eternidade."""
    raiz = Path(raiz)
    preferida = raiz / 'images'
    if preferida.is_dir():
        out = sorted(p for p in preferida.rglob('*') if p.suffix.lower() in EXT_IMG)
        if out:
            return out
    fora = {'pretrained_features', 'landmarks', 'segmentations'}
    try:
        fora |= {d.name.lower() for d in raiz.iterdir()
                 if d.is_dir() and 'sample' in d.name.lower()}
    except OSError:
        pass
    out = []
    for p in raiz.rglob('*'):
        if p.suffix.lower() in EXT_IMG and not (set(x.lower() for x in p.parts) & fora):
            out.append(p)
    return sorted(out)

EXT_EMB = {'.pickle', '.pkl', '.npy', '.npz'}

# Qual vetor de imagem usar e com QUAL text encoder ele combina. Isto não é
# preferência: o SFHQ guarda quatro embeddings por rosto, e comparar a imagem
# de um encoder com o texto de outro dá ruído com cara de resultado. Ordem =
# preferência; o primeiro que existir no arquivo vence.
CHAVES_CLIP = [
    ('CLIP_ViTL_14@336',      'ViT-L-14-336', 'openai',             '~1.7 GB'),
    ('CLIP_ViT_H_14_LAION2B', 'ViT-H-14',     'laion2b_s32b_b79k',  '~3.9 GB'),
]

def _achar_pasta_emb(raiz):
    """Devolve a pasta que realmente contém os arquivos de vetor. A extração
    do SFHQ cria um nível a mais (pretrained_features/pretrained_features/),
    então procurar só no primeiro nível não acha nada."""
    for d in Path(raiz).rglob('pretrained_features'):
        if not d.is_dir():
            continue
        dentro = [x for x in d.iterdir() if x.suffix.lower() in EXT_EMB]
        if dentro:
            return d
        for sub in d.iterdir():
            if sub.is_dir() and any(x.suffix.lower() in EXT_EMB for x in sub.iterdir()):
                return sub
        return d       # existe, mas está vazia — quem chamou reporta isso
    return None

def _ler_pickle(f):
    if f.suffix.lower() == '.npy':
        d = np.load(f, allow_pickle=True)
        return d.item() if getattr(d, 'shape', None) == () else {'vetores': d}
    if f.suffix.lower() == '.npz':
        return dict(np.load(f, allow_pickle=True))
    with open(f, 'rb') as fh:
        return pickle.load(fh)

def _texto(v):
    return isinstance(v, (str, bytes)) or (hasattr(v, 'dtype') and v.dtype.kind in 'USO')

def _extrair_consolidado(d):
    """Layout alternativo: um único arquivo com todos os vetores. Acha nomes e
    matriz pela FORMA do dado, não pelo nome da chave, porque o SFHQ batizou
    isso de jeitos diferentes entre as partes."""
    nomes = vetores = None
    for k, v in d.items():
        try:
            arr = np.asarray(v)
        except Exception:
            continue
        if arr.ndim == 2 and arr.shape[0] > 1 and arr.shape[1] in (512, 640, 768, 1024, 1280) \
           and arr.dtype.kind == 'f':
            if vetores is None or arr.shape[0] > vetores[1].shape[0]:
                vetores = (k, arr)
        elif arr.ndim == 1 and arr.size and _texto(arr.flat[0]):
            if nomes is None or arr.size > len(nomes[1]):
                nomes = (k, [str(x) for x in arr])
    return nomes, vetores

def perfil_embeddings(raiz):
    """Só olha: descobre o layout e devolve um dicionário descritivo. Separado
    da leitura de verdade porque --conferir precisa responder em segundos,
    sem tocar em 118 mil arquivos."""
    pasta = _achar_pasta_emb(raiz)
    if pasta is None:
        return {'ok': False, 'nota': 'não achei a pasta pretrained_features'}

    arqs = [x for x in pasta.iterdir() if x.suffix.lower() in EXT_EMB]
    if not arqs:
        dentro = sorted(x.name for x in pasta.iterdir())[:8]
        return {'ok': False, 'pasta': pasta,
                'nota': f'a pasta existe ({pasta}) mas não tem .pickle/.npy dentro.\n'
                        f'  o que tem lá: {dentro if dentro else "nada"}'}

    amostra = sorted(arqs)[0]
    try:
        d = _ler_pickle(amostra)
    except Exception as e:
        return {'ok': False, 'pasta': pasta,
                'nota': f'{amostra.name}: não abriu — {type(e).__name__}: {e}'}
    if not isinstance(d, dict):
        return {'ok': False, 'pasta': pasta,
                'nota': f'{amostra.name}: é {type(d).__name__}, não dict'}

    formas = {k: (getattr(np.asarray(v), 'shape', '?'), str(getattr(np.asarray(v), 'dtype', '?')))
              for k, v in d.items()}

    # Um arquivo por imagem? O sinal é o vetor vir com primeira dimensão 1.
    por_imagem = any(f[0] and len(f[0]) == 2 and f[0][0] == 1 for f in formas.values())
    if por_imagem or len(arqs) > 100:
        escolha = next(((k, m, pre, peso) for k, m, pre, peso in CHAVES_CLIP if k in d), None)
        return {'ok': escolha is not None, 'pasta': pasta, 'layout': 'um por imagem',
                'n': len(arqs), 'formas': formas, 'chave': escolha, 'exemplo': amostra.name,
                'nota': (f'{len(arqs)} arquivos, um por imagem'
                         if escolha else
                         f'{len(arqs)} arquivos, mas nenhuma chave conhecida. '
                         f'Achei: {list(formas)}')}

    nomes, vetores = _extrair_consolidado(d)
    if nomes is None or vetores is None:
        return {'ok': False, 'pasta': pasta, 'layout': 'consolidado', 'formas': formas,
                'nota': f'{amostra.name}: não reconheci nomes+vetores. chaves: {formas}'}
    return {'ok': True, 'pasta': pasta, 'layout': 'consolidado', 'n': len(arqs),
            'formas': formas, 'chaves_cons': (nomes[0], vetores[0]),
            'nota': f'{vetores[1].shape[0]} vetores de {vetores[1].shape[1]} dimensões'}

def carregar_vetores(perfil, imagens):
    """Lê de verdade, só das imagens pedidas. Com um arquivo por rosto, ler os
    118 mil custaria ~2 GB de disco para usar 2 mil — por isso quem chama já
    manda a amostra reduzida."""
    if perfil['layout'] == 'consolidado':
        d = _ler_pickle(sorted(perfil['pasta'].iterdir())[0])
        nk, vk = perfil['chaves_cons']
        por_nome = {Path(str(n)).stem: i for i, n in enumerate(d[nk])}
        M, ok = [], []
        for p in imagens:
            i = por_nome.get(p.stem)
            if i is not None:
                M.append(np.asarray(d[vk][i], dtype=np.float32)); ok.append(p)
        return ok, (np.stack(M) if M else np.zeros((0, 1), np.float32))

    chave = perfil['chave'][0]
    pasta = perfil['pasta']
    M, ok, faltando = [], [], 0
    for n, p in enumerate(imagens):
        f = pasta / (p.stem + '.pickle')
        if not f.exists():
            faltando += 1
            continue
        try:
            v = _ler_pickle(f)[chave]
        except Exception:
            faltando += 1
            continue
        M.append(np.asarray(v, dtype=np.float32).reshape(-1)); ok.append(p)
        if n and n % 2000 == 0:
            print(f'    lidos {n}/{len(imagens)}…', flush=True)
    if faltando:
        print(f'    {faltando} sem vetor (ignoradas)')
    return ok, (np.stack(M) if M else np.zeros((0, 1), np.float32))

def baldes_por_clip(imagens, perfil, cotas, amostra):
    try:
        import torch, open_clip
    except Exception as e:
        sys.exit(f"Modo --clip: falhou ao importar torch/open_clip.\n"
                 f"  erro: {type(e).__name__}: {e}\n"
                 f"  Python em uso: {sys.executable}\n\n"
                 f'    "{sys.executable}" -m pip install open_clip_torch\n'
                 f"Ou rode sem --clip para montar o pacote com baldes sorteados.")

    if perfil['layout'] == 'um por imagem':
        _, arq, pre, peso = perfil['chave']
    else:
        arq, pre, peso = 'ViT-L-14-336', 'openai', '~1.7 GB'

    # Sortear a amostra antes de ler: pegar as N primeiras traria um pedaço
    # contíguo do dataset, que no SFHQ vem agrupado por semelhança.
    alvo = imagens
    if amostra and len(imagens) > amostra:
        r = np.random.default_rng(20260828)
        alvo = [imagens[i] for i in sorted(r.choice(len(imagens), amostra, replace=False))]
        print(f'  amostrando {len(alvo)} de {len(imagens)} imagens (use --amostra 0 para todas)')

    print('  lendo os vetores das imagens…', flush=True)
    itens, M = carregar_vetores(perfil, alvo)
    if len(itens) == 0:
        sys.exit('nenhuma imagem casou com os vetores; confira se a fonte é a mesma parte do dataset')
    M /= (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)
    print(f'  {len(itens)} imagens com vetor, {M.shape[1]} dimensões')

    print(f'  carregando o text encoder {arq}/{pre} (baixa {peso} na primeira vez)…', flush=True)
    modelo, _, _ = open_clip.create_model_and_transforms(arq, pretrained=pre)
    modelo.eval()
    tok = open_clip.get_tokenizer(arq)

    usados, saida = set(), {}
    for balde, prompts in PROMPTS.items():
        with torch.no_grad():
            t = modelo.encode_text(tok(prompts)).numpy().astype(np.float32)
        t /= (np.linalg.norm(t, axis=1, keepdims=True) + 1e-9)
        if t.shape[1] != M.shape[1]:
            sys.exit(f'texto tem {t.shape[1]} dimensões e imagem tem {M.shape[1]}: '
                     f'encoders diferentes, o resultado seria ruído.')
        score = (M @ t.T).max(axis=1)
        escolhidos = []
        for j in np.argsort(-score):
            if len(escolhidos) >= cotas[balde]:
                break
            p = itens[int(j)]
            if p in usados:
                continue
            usados.add(p); escolhidos.append(p)
        saida[balde] = escolhidos
        print(f'  {balde:18s} {len(escolhidos):4d}')
    return saida

def baldes_por_hash(imagens, cotas):
    print('  AVISO: sem --clip os baldes não têm significado; idade e etnia saem sorteadas.')
    ordenadas = sorted(imagens, key=lambda p: hashlib.md5(p.name.encode()).hexdigest())
    saida, i = {}, 0
    for balde, cota in cotas.items():
        saida[balde] = ordenadas[i:i+cota]; i += cota
        print(f'  {balde:18s} {len(saida[balde]):4d}')
    return saida

# ---------------------------------------------------------------- conferência
def conferir(raiz):
    """Inspeciona a pasta e diz o que dá para fazer com ela. Serve para você
    checar em segundos, antes de rodar o processamento inteiro, se a extração
    veio completa — e para eu ajustar o leitor se o formato for outro."""
    p = Path(raiz)
    if not p.exists():
        sys.exit(f'a pasta {raiz} não existe. No Windows, cuidado com a barra final: '
                 'use "D:/SFHQ_part4" ou "D:\\SFHQ_part4", nunca "D:\\SFHQ_part4\\"')
    print('pasta:', p.resolve())
    print('\nsubpastas no primeiro nível:')
    for d in sorted(x for x in p.iterdir() if x.is_dir())[:20]:
        n = sum(1 for _ in d.iterdir())
        print(f'  {d.name:28s} {n} item(ns)')

    imgs = achar_imagens(raiz)
    de_onde = 'images/' if (p / 'images').is_dir() else 'varredura geral'
    print(f'\nimagens encontradas: {len(imgs)}  (fonte: {de_onde})')
    amostras = [d.name for d in p.iterdir() if d.is_dir() and 'sample' in d.name.lower()]
    if amostras:
        print('  ignorando as pastas de amostra, que são cópias:', ', '.join(amostras))
    if imgs:
        for x in imgs[:3]:
            print('  exemplo:', x.relative_to(p))
        try:
            im = Image.open(imgs[0])
            print(f'  primeira: {im.size[0]}x{im.size[1]} {im.mode}')
        except Exception as e:
            print('  não consegui abrir a primeira:', e)

    perf = perfil_embeddings(raiz)
    print('\nvetores CLIP:', perf['nota'])
    if perf.get('formas'):
        print(f"  layout: {perf.get('layout')}   exemplo: {perf.get('exemplo', '-')}")
        for k, (forma, tipo) in perf['formas'].items():
            print(f'    {k:26s} {str(forma):12s} {tipo}')
    if perf['ok'] and perf.get('layout') == 'um por imagem':
        k, arq, pre, peso = perf['chave']
        print(f'  vou usar {k!r} com o text encoder {arq}/{pre} ({peso} no primeiro uso)')
        casam = sum(1 for i in imgs[:2000] if (perf['pasta'] / (i.stem + '.pickle')).exists())
        print(f'  das 2000 primeiras imagens, {casam} têm arquivo de vetor')
        if casam == 0:
            print('  ATENÇÃO: o nome do .pickle não segue o da imagem.')
            print(f"  stem da imagem: {imgs[0].stem!r}   exemplo de vetor: {perf.get('exemplo')!r}")
            perf['ok'] = False
    elif not perf['ok']:
        print('  sem vetores utilizáveis: rode sem --clip, ou me mande a saída acima.')
    emb = perf['ok']

    print('\nveredito:')
    if imgs and emb:
        print('  tudo certo — pode rodar com --clip')
    elif imgs:
        print('  dá para rodar SEM --clip; os baldes sairão sorteados')
    else:
        print('  nenhuma imagem: confira se a extração terminou e se a pasta é a certa')

# ---------------------------------------------------------------- saída
def main():
    ap = argparse.ArgumentParser(description='Monta o pacote de retratos do VCT Manager.')
    ap.add_argument('--fonte', help='pasta onde você descompactou o SFHQ '
                                    '(obrigatório, exceto com --ambiente)')
    ap.add_argument('--saida', default='.', help='raiz do projeto (padrão: atual)')
    ap.add_argument('--total', type=int, default=2000)
    ap.add_argument('--lado', type=int, default=256)
    ap.add_argument('--qualidade', type=int, default=80)
    ap.add_argument('--clip', action='store_true', help='separa os baldes por semântica')
    ap.add_argument('--amostra', type=int, default=20000,
                    help='quantas imagens pontuar no modo --clip (0 = todas). '
                         'O SFHQ tem um .pickle por rosto; ler os 118 mil para '
                         'escolher 2 mil custa caro e muda pouco o resultado.')
    ap.add_argument('--conferir', action='store_true',
                    help='só inspeciona a pasta e sai, sem processar nada')
    ap.add_argument('--ambiente', action='store_true',
                    help='mostra qual Python está rodando e o que ele enxerga')
    ap.add_argument('--sem-grade', action='store_true', help='não aplica o tratamento escuro')
    a = ap.parse_args()

    if a.ambiente:
        print('Python  :', sys.executable)
        print('versão  :', sys.version.split()[0])
        for nome in ('PIL', 'numpy', 'torch', 'open_clip'):
            try:
                m = __import__(nome)
                print(f'{nome:8s}: {getattr(m, "__version__", "?")}  ({getattr(m, "__file__", "?")})')
            except Exception as e:
                print(f'{nome:8s}: FALHOU — {type(e).__name__}: {e}')
        return

    # Daqui para baixo tudo mexe em arquivo, então a fonte passa a ser exigida.
    if not a.fonte:
        ap.error('--fonte é obrigatório (só --ambiente dispensa)')

    raiz = Path(a.saida).resolve()
    destino = raiz / 'assets' / 'rostos'

    if a.conferir:
        return conferir(a.fonte)

    print('procurando imagens em', a.fonte)
    imagens = achar_imagens(a.fonte)
    if not imagens:
        sys.exit('nenhuma imagem encontrada nessa pasta')
    print(f'  {len(imagens)} imagens')
    if len(imagens) < a.total:
        print(f'  atenção: você pediu {a.total} e só há {len(imagens)}')

    soma = sum(PESOS.values())
    cotas = {b: max(8, int(a.total * PESOS[b] / soma)) for b in PROMPTS}

    print('separando em baldes')
    if a.clip:
        perf = perfil_embeddings(a.fonte)
        print('  embeddings:', perf['nota'])
        if not perf['ok']:
            sys.exit('não deu para usar os vetores. Rode sem --clip, ou rode --conferir '
                     'e me mande a saída para eu ajustar o leitor.')
        grupos = baldes_por_clip(imagens, perf, cotas, a.amostra)
    else:
        grupos = baldes_por_hash(imagens, cotas)

    print('processando e gravando em', destino)
    if destino.exists():
        print('  atenção: a pasta já existe. Trocar a CONTAGEM de um balde reembaralha')
        print('  os rostos daquele balde. Se já jogou com este pacote, prefira só acrescentar.')
    manifesto = {}
    for balde, arquivos in grupos.items():
        pasta = destino / balde
        pasta.mkdir(parents=True, exist_ok=True)
        n = 0
        for arq in arquivos:
            try:
                im = Image.open(arq).convert('RGB')
            except Exception as e:
                print('  pulei', arq.name, e); continue
            lado = min(im.size)
            im = im.crop(((im.width-lado)//2, (im.height-lado)//2,
                          (im.width+lado)//2, (im.height+lado)//2))
            im = im.resize((a.lado, a.lado), Image.LANCZOS)
            if not a.sem_grade:
                im = aplicar_grade(im)
            im.save(pasta / f'{n:04d}.webp', 'WEBP', quality=a.qualidade, method=6)
            n += 1
        manifesto[balde] = n
        print(f'  {balde:18s} {n:4d} arquivos')

    (destino / 'LEIAME.md').write_text(
        '# Pacote de retratos\n\n'
        'Gerado por `tools/rostos.py` a partir do dataset **SFHQ (Synthetic Faces High\n'
        'Quality)**, licença MIT — https://github.com/SelfishGene/SFHQ-dataset\n\n'
        'As imagens são **sintéticas**: não são fotografias de pessoas reais. Foram\n'
        'reduzidas, recortadas e tratadas com o grade escuro do jogo.\n\n'
        'Trocar a quantidade de arquivos de um balde reembaralha os rostos daquele\n'
        'balde, porque o jogo escolhe por `hash(id) % quantidade`. Para trocar uma\n'
        'imagem, substitua o arquivo mantendo o nome.\n', encoding='utf-8')

    js = ('/* Gerado por tools/rostos.py — não edite à mão.\n'
          '   Fonte: SFHQ (MIT). Imagens sintéticas, não são pessoas reais. */\n'
          'const ROSTOS=' + json.dumps({
              'versao': 1, 'dir': 'assets/rostos/', 'ext': 'webp',
              'lado': a.lado, 'fonte': 'SFHQ (MIT)', 'baldes': manifesto},
              ensure_ascii=False, indent=1) + ';\n')
    (raiz / 'data').mkdir(parents=True, exist_ok=True)
    (raiz / 'data' / 'rostos.js').write_text(js, encoding='utf-8')

    total = sum(manifesto.values())
    peso = sum(f.stat().st_size for f in destino.rglob('*.webp')) / 1024 / 1024
    print(f'\npronto: {total} retratos, {peso:.1f} MB')
    print('manifesto em data/rostos.js — abra o jogo e confira em Configurações.')

if __name__ == '__main__':
    main()
