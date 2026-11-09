/* Onde fica a placa branca vazia em cada imagem de cena e de estrutura:
   [x, y, largura, altura] em % da imagem, medidos nos arquivos de assets/.
   O jogo pinta essa placa com a cor do clube e põe o escudo no meio, então a
   mesma foto serve para todos os clubes. Imagem sem entrada aqui não ganha
   placa (fica só a foto). Ao trocar uma imagem, meça de novo. */
const PLACAS={
  'cenas/ativ-folga':[39.9,20.7,35.7,16.3],
  'cenas/ativ-jantar':[27.0,7.9,46.7,35.4],
  'cenas/ativ-ranked':[22.8,9.0,54.9,29.2],
  'cenas/ativ-sessao':[29.9,4.3,40.1,25.0],
  'cenas/ativ-stream':[28.2,11.7,44.3,32.1],
  'cenas/news-diretoria':[30.6,9.7,38.8,20.8],
  'cenas/sala-diretoria':[32.4,5.6,35.0,28.1],
  'cenas/sala-negociacao':[29.2,13.2,41.4,35.1],
  'estrutura/academia':[32.7,10.1,34.7,16.9],
  'estrutura/analise':[34.1,6.6,32.2,19.4],
  'estrutura/equip':[33.0,9.2,34.6,26.9],
  'estrutura/gh':[51.2,14.9,33.0,23.1],
  'estrutura/mente':[35.7,15.7,37.2,23.5],
  'estrutura/saude':[32.2,13.8,40.2,25.4],
  'estrutura/treino':[36.2,17.7,28.1,18.8]
};
