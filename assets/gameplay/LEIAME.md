Imagens do modo jogador (gameplay visto de cima).

Os prompts, os tamanhos e o que cada imagem é estão no documento de planejamento,
aba "Imagens e prompts". Aqui ficam as pastas de envio:

| Pasta | O que vai |
|-------|-----------|
| `agentes/<agente>/` | `retrato`, os 5 quadros do boneco (`parado`, `passo1`, `passo2`, `tiro`, `caido`) e os ícones `c`, `q`, `e`, `x` |
| `armas/` | silhuetas das 7 armas |
| `efeitos/` | `fumaca`, `fogo`, `explosao`, `flash` |
| `objetos/` | Spike e objetos de cobertura |
| `texturas/` | `<mapa>_piso` e `<mapa>_parede` dos 13 mapas |

Cada pasta tem um LISTA.md com o nome exato de cada arquivo e o que já chegou.
PNG, JPG ou WebP; fundo transparente ou verde liso #00FF00.

Depois de subir, rode `python3 -I tools/gameplay-imagens.py` (ou peça para o Claude):
ele prepara as imagens em `pronto/` (é o que o jogo lê), troca o fundo verde por
transparência, separa a faixa magenta dos bonecos para pintar com a cor do time e
atualiza `data/gameplay/imagens.js`. Não mexa em `pronto/` à mão.
