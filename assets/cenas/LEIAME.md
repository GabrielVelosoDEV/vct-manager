Cenas da interface — fundos do dia a dia do clube (opcional).

São 15 imagens: 6 atividades do vestiário, 6 categorias de notícia e 3 momentos
(cerimônia de prêmios, sala de negociação, sala da diretoria). A lista com o nome
exato de cada arquivo está em `LISTA.md`, e os prompts estão no doc "VCT Manager —
Imagens que faltam e prompts".

Formato: WebP (preferido), PNG ou JPG, 1600×900 (16:9). Sem texto, sem logos e sem
pessoas reconhecíveis, com o assunto no centro. Onde o prompt pede, deixe a placa
branca fosca vazia no centro do terço superior: o jogo põe o escudo e a cor do clube
ali, então a mesma imagem serve para todos os clubes.

Depois de salvar, rode `npm run imagens` (o build já roda sozinho) para o jogo
enxergar o arquivo. Use só imagens que você tem direito de usar.

Onde fica a placa de cada foto está em `data/placas.js` ([x, y, largura, altura] em %
da imagem). Ao trocar uma foto por outra com a placa em outro lugar, meça de novo;
foto sem entrada lá aparece sem escudo. Converta para WebP antes de subir (PNG de 2 MB
vira ~100 KB) para o jogo carregar rápido no site.
