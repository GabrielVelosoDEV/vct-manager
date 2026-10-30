Fotos da comissão técnica (treinadores, analistas, managers).

Nome do arquivo = nick da pessoa como está em `data/comissao.js`, em minúsculas, sem
acento, e qualquer coisa que não seja letra ou número vira hífen: `potter.png`,
`neilzinho.webp`, `d00mbr0s.jpg`.
Formatos: PNG, JPG ou WebP. Recomendado 256×320 (retrato 4:5), enquadrado no rosto.

Depois de subir, rode `npm run imagens`: ele grava `data/midia.js` e mostra quem ficou
sem foto e qual arquivo não bate com ninguém. Com `--renomear` ele corrige sozinho os
nomes fora do padrão (maiúscula, acento, espaço).

Sem arquivo, o jogo desenha um monograma. Pessoa real nunca recebe rosto gerado.

A lista com o nome exato de cada arquivo que o jogo procura está em `LISTA.md`, nesta pasta.
