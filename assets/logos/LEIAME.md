Escudos dos clubes.

Nome do arquivo = tag do time em minúsculas, sem acento: `sen.png`, `100t.png`, `prx.png`.
Formatos: PNG, JPG ou WebP. Recomendado 256×256, fundo transparente.

Sem arquivo, o jogo desenha um monograma automático — nada quebra.
Para um caminho diferente do padrão, use o campo de escudo no Editor.

Depois de subir, rode `npm run imagens` (o build já roda sozinho): ele grava
`data/midia.js` e lista quem ficou sem imagem e qual arquivo não bate com ninguém.
`npm run imagens -- --renomear` corrige nomes fora do padrão.
