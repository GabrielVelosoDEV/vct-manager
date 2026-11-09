Imprensa — fotos de pessoas reais (jornalistas, streamers, casters, criadores).

Salve a foto com o nome da pessoa: `gabriel-toledo.png` vira "Gabriel Toledo".
Minúsculas, sem acento, hífen no lugar do espaço. PNG, JPG ou WebP, quadrada de
preferência (o feed recorta em círculo), 400×400 basta.

Só com a foto, a pessoa entra no feed como jornalista brasileiro independente. Para
dizer que ela é streamer ou caster, de qual veículo ela é, ou dar o @ certo, cadastre
em `data/imprensa.js`, na lista PERSONALIDADES:

  {nome:'Gabriel Toledo', tipo:'streamer', pais:'BR', arroba:'gaules'},
  {nome:'Fulana de Tal', tipo:'jornalista', veiculo:'maisesports'},

Jornalistas assinam notícias do país deles. Streamers, casters e criadores reagem às
notícias grandes (títulos, contratações de peso). Depois de salvar, rode
`npm run imagens` (o build já roda sozinho). Use só fotos que você tem direito de usar.
