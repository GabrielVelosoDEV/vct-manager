Logos dos patrocinadores.

Nome do arquivo = nome da marca em minúsculas, sem acento, com hífen no lugar
de espaço e símbolo: `mercedes-benz.png`, `guarana-antarctica.png`, `kabum.png`.
Formatos: PNG, JPG ou WebP. Recomendado deitado, 320×160 (proporção 2:1), fundo
transparente. Logo quadrado também funciona, só fica com sobra dos lados.

Sem arquivo, o jogo desenha uma assinatura com o nome da marca — nada quebra.

O catálogo (nome, setor, patamar, região, países e nível) está em
`data/patrocinadores.js`. Marca nova entra lá; o logo dela entra aqui.

Depois de subir, rode `npm run imagens` (o build já roda sozinho): ele grava
`data/midia.js` e aponta arquivo que não bate com nenhuma marca.
`npm run imagens -- --renomear` corrige nomes fora do padrão.

A lista com o nome exato de cada arquivo que o jogo procura está em `LISTA.md`, nesta pasta.
