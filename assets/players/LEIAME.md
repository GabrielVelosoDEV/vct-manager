Fotos dos jogadores.

Nome do arquivo = nick em minúsculas, sem acento, espaços viram hífen: `zekken.png`,
`f0rsaken.png`, `less.png`.
Formatos: PNG, JPG ou WebP. Recomendado 256×256, enquadramento quadrado no rosto.

Sem arquivo, o jogo desenha uma silhueta com as iniciais.

Depois de subir, rode `npm run imagens` (o build já roda sozinho): ele grava
`data/midia.js` e lista quem ficou sem imagem e qual arquivo não bate com ninguém.
`npm run imagens -- --renomear` corrige nomes fora do padrão.

A lista com o nome exato de cada arquivo que o jogo procura está em `LISTA.md`, nesta pasta.
