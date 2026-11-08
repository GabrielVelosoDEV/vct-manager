Troféus.

Aparecem na capa do torneio quando ele acaba, na sala de troféus do clube, na galeria
de títulos, na tela de Prêmios e na cerimônia de encerramento.

Formato: PNG com fundo transparente, troféu de pé e centralizado. O jogo desenha o
troféu inteiro dentro do espaço dele (não corta), então a proporção pode variar. Altura
mínima recomendada: 400 px para Champions, Masters e prêmios (aparecem grandes na
cerimônia), 180 px para os torneios regionais.

## Torneios

Um troféu por TORNEIO, não por fase: quem levanta é o campeão do evento inteiro.
Fase de grupos, Suíço e playoffs não dão título nem troféu próprio.

| Torneio                      | Arquivos                                                    |
|------------------------------|-------------------------------------------------------------|
| Champions                    | `champions-01.png` … `champions-10.png` (um por sede)       |
| Masters I e II               | `masters-01.png` … `masters-10.png` (um por sede)           |
| Kickoff                      | `kickoff-amer.png`, `kickoff-emea.png`, `kickoff-pac.png`, `kickoff-cn.png` |
| Stage 1                      | `stage1-amer.png`, `stage1-emea.png`, `stage1-pac.png`, `stage1-cn.png` |
| Stage 2                      | `stage2-amer.png`, `stage2-emea.png`, `stage2-pac.png`, `stage2-cn.png` |
| Challengers (Split 1 e 2)    | `challengers-amer.png`, `challengers-emea.png`, `challengers-pac.png`, `challengers-cn.png` |
| Ascension                    | `ascension-amer.png`, `ascension-emea.png`, `ascension-pac.png`, `ascension-cn.png` |
| qualquer outro               | `padrao.png`                                                |

Sufixo de região: `amer`, `emea`, `pac`, `cn` — o mesmo das artes em `assets/torneios/`.

Cada sede de Champions e de Masters usa uma das variantes numeradas, sempre a mesma
para a mesma cidade. Não precisa ter as dez: o jogo usa as que existirem (de 1 a 10),
com dois dígitos no nome (`masters-03.png`, não `masters-3.png`). Para trocar uma
imagem, substitua o arquivo mantendo o nome: renumerar muda o troféu de cidades que
já tinham um.

## Prêmios da temporada

| Prêmio              | Arquivo                  |
|---------------------|--------------------------|
| MVP do ano          | `premio-mvp.png`         |
| Treinador do ano    | `premio-treinador.png`   |
| IGL do ano          | `premio-igl.png`         |
| Seleção do ano      | `premio-selecao.png` (o mesmo troféu para os cinco) |
| Revelação do ano    | `premio-revelacao.png` (opcional, ainda não enviado) |
| MVP regional        | `premio-mvp-regional.png` (opcional, ainda não enviado) |

Sem arquivo, o jogo desenha um troféu genérico — nada quebra.
