# Cartas do jogador

Cada jogador aparece numa carta colecionável cuja moldura depende do over.
O over, o nome e a função são escritos pelo jogo por cima da moldura, então a
arte **não traz número nem texto**: uma moldura serve para todos os jogadores
da faixa.

## 1. Faixas de over

| Carta        | Over   | Visual                         | Mundo inicial |
|--------------|--------|--------------------------------|---------------|
| Recruta      | 0–70   | aço escovado, grafite, sóbria  | ~100 jogadores |
| Profissional | 71–80  | metal azul com neon            | ~230 |
| Elite        | 81–90  | ouro e preto                   | ~185 |
| Lenda        | 91–99  | ouro e vermelho, cristal       | 12 |

Os cortes ficam em `CARTAS` (`src/core/cartas.js`). A Lenda é rara de
propósito: no começo da carreira só uma dúzia de jogadores chega lá.

## 2. Tamanho

- **Arte-mestre:** 1024 × 1536 px (2:3), PNG, a janela do jogador em preto puro `#000000`.
- **No jogo:** `assets/cartas/<carta>.webp`, 720 × 1080 com a janela transparente (~75 KB cada).
  Quem gera é `python3 tools/cartas.py <pasta-com-os-png>`.
- **Na tela:** 132 px de largura na grade do elenco, 150 px na ficha, 240 px na revelação.
  A altura é sempre 1,5 × a largura e tudo escala junto.

## 3. Áreas da carta

Medidas em fração da carta (e em px na arte de 1024 × 1536). As quatro molduras
precisam respeitar o mesmo mapa para o mesmo código servir a todas.

```
 ┌───────────────────────────────────────────┐  0%
 │ ┌────────┐                     ┌───────┐  │
 │ │  SELO  │      janela         │emblema│  │  3% – 21%  selo do over
 │ │  OVER  │                     └───────┘  │
 │ └────────┘                                │
 │   ┌───────────────────────────────────┐   │  5%  topo da janela
 │   │                                   │   │
 │   │        JANELA DO JOGADOR          │   │
 │   │      (preto puro, sem nada)       │   │
 │   │                                   │   │
 │   │                                   │   │
 │   └───────────────────────────────────┘   │  81% base da janela
 │ ┌───────────────────────────────────────┐ │  81%
 │ │           PLACA DO NOME               │ │  centro em 86%
 │ └───────────────────────────────────────┘ │  91%
 │           ──── faixa da função ────       │  93% – 95%
 └───────────────────────────────────────────┘  100%
```

| Área | x | y | Observação |
|------|---|---|------------|
| Moldura externa | 0–4% e 96–100% | 0–3% e 97–100% | parafusos, placas, marcações |
| Selo do over | 4–29% (40–300) | 3–21% (45–320) | octógono **vazio** e escuro por dentro; o jogo escreve o número (centro ≈ 17%, 9,5%) e "OVR" embaixo (≈ 16%) |
| Emblema | 75–96% (770–980) | 3–14% (45–215) | logo, louros ou cristal; decorativo |
| Janela do jogador | 9–91% (95–935) | 5–81% (80–1245) | preto puro, cantos chanfrados; o selo pode invadir o canto superior esquerdo |
| Placa do nome | 7–93% (70–955) | 81–91% (1245–1395) | placa horizontal, interior escuro e liso; o nome é escrito no centro |
| Faixa da função | 30–70% (300–720) | 92–95% (1415–1460) | faixa estreita **lisa**, com fios laterais; a função é escrita no centro |

A posição exata do número, da placa e da função de cada moldura fica em
`GEO_CARTA` (`src/ui/cartas.js`). Se uma arte nova sair com o selo um pouco
deslocado, é ali que se acerta (dois números por carta).

## 4. Como o PNG do jogador entra

Camadas, de baixo para cima:

1. **Fundo da janela:** degradê escuro com um brilho na cor da carta atrás do
   tronco e o escudo do clube em 10% de opacidade, em tons de cinza. A janela
   nunca fica um buraco preto.
2. **Foto:** quadrada, 98% da largura da carta, presa pela base a 12,5% do fim
   da carta. Assim a cintura some **atrás** da placa do nome e a cabeça fica na
   altura de 20–25%, com respiro acima. A base da foto ganha um esmaecido para
   não aparecer o corte reto.
3. **Moldura** com a janela vazada: a borda e o brilho caem por cima da foto,
   o que dá a sensação de que o jogador está dentro da carta.
4. **Textos vivos:** over (Bebas Neue, metal na Recruta, ouro na Elite e na
   Lenda), "OVR", nome (encolhe quando o nick é comprido) e função.

Sem foto, entra o rosto gerado do pacote com uma vinheta oval; sem nada, uma
silhueta transparente.

**Para fotos novas:** PNG transparente, cortado na cintura, quadrado, mínimo
600 × 600 (as do vlr têm 200 × 200 e ficam boas até ~180 px de carta), cabeça
começando a ~5% do topo e ombros ocupando ~80% da largura.

## 5. Troca de carta

- A carta sai do over da hora: subiu de 80 para 81, a ficha e o elenco já
  mostram a Elite.
- Toda semana, depois do treino, o jogo confere o seu elenco (`conferirCartas`).
  Quem subiu de faixa gera notícia (🃏) e entra na fila da **revelação**: um
  modal em que a carta antiga gira e volta como a nova, com um reflexo de luz.
  Abre sozinho depois do avanço, sem cobrir resultado de partida nem veredito.
- Quem cai troca a carta em silêncio. Para quem oscila entre 80 e 81 não ganhar
  festa toda semana, a anotação só desce 3 pontos abaixo do corte.
- Quem chega ao clube entra com a carta que já tem, sem revelação.

## 6. Prompts de geração

Os quatro usam o mesmo bloco de layout para as molduras saírem compatíveis.
Gere em 2:3 (1024 × 1536) e salve como `recruta.png`, `profissional.png`,
`elite.png` e `lenda.png`. Depois:

```
python3 tools/cartas.py pasta-das-artes
```

### Recruta (0–70)

```
Crie a moldura de uma carta colecionável vertical para um simulador de gerenciamento de equipes profissionais de VALORANT, categoria RECRUTA, para jogadores de 0 a 70 OVR.
A identidade visual deve transmitir o início da carreira competitiva: um jogador desconhecido, em desenvolvimento, buscando conquistar seu espaço no cenário profissional.

DESIGN:
* Moldura industrial feita de metal escovado, aço desgastado e placas sobrepostas.
* Bordas assimétricas, parafusos, pequenas marcações técnicas e detalhes de equipamento tático.
* Paleta predominantemente grafite, prata envelhecida, preto e branco.
* Texturas de arranhões, desgaste e pequenas marcas de batalha.
* Visual sóbrio, sem efeitos luminosos.
* Elementos gráficos inspirados em interfaces de equipamentos militares e HUDs de FPS táticos.

LAYOUT (obrigatório, formato vertical 2:3):
* Selo octogonal no canto superior esquerdo, ocupando cerca de 25% da largura e 18% da altura, com o interior escuro, liso e completamente vazio.
* Pequeno emblema decorativo no canto superior direito.
* Grande janela central de cantos chanfrados, de 9% a 91% da largura e de 5% a 81% da altura, preenchida com preto puro (#000000) liso, sem textura, sem brilho e sem gradiente.
* Logo abaixo da janela, uma placa horizontal larga (de 7% a 93% da largura, de 81% a 91% da altura), com interior escuro e liso, vazio.
* Abaixo da placa, uma faixa estreita e lisa centralizada, com fios finos nas laterais, vazia.

ÁREA DO JOGADOR:
A janela central deve ficar totalmente vazia e preta para receber depois a imagem PNG transparente de um jogador real, da cintura para cima. Não desenhe pessoas, silhuetas, personagens, armas ou rostos.

TEXTO:
Não escreva nenhum número, letra ou palavra em nenhum lugar da carta. O selo, a placa e a faixa ficam vazios: o número de OVR, o nome e a função serão inseridos depois pelo jogo.

A carta deve parecer uma peça de equipamento profissional, simples, resistente e autêntica.
IMPORTANTE: não coloque estatísticas, personagens, fotografias ou imagens dentro da janela. Não faça mockup, não mostre várias cartas, não incline a carta. Gere somente uma carta isolada, de frente, ocupando todo o quadro, com fundo externo preto e formato vertical 2:3.
```

### Profissional (71–80)

```
Crie a moldura de uma carta colecionável vertical para um simulador de gerenciamento de equipes profissionais de VALORANT, categoria PROFISSIONAL, para jogadores de 71 a 80 OVR.
A identidade visual deve transmitir um jogador já estabelecido no cenário: titular de time profissional, confiável, em ascensão.

DESIGN:
* Moldura tecnológica de metal escuro azulado com placas sobrepostas e recortes angulares.
* Linhas de neon azul elétrico (#2F7BFF a #4FC3FF) contornando as bordas internas e externas, com brilho moderado.
* Faixas diagonais, pequenas miras, marcações de HUD e detalhes de fibra de carbono.
* Paleta azul-marinho, azul elétrico, prata e preto, com leve desgaste no metal.
* Visual limpo e moderno, mais sofisticado que uma carta básica, sem exagero.

LAYOUT (obrigatório, formato vertical 2:3):
* Selo octogonal no canto superior esquerdo, ocupando cerca de 25% da largura e 18% da altura, com contorno de neon azul e interior escuro, liso e completamente vazio.
* Pequeno emblema decorativo no canto superior direito.
* Grande janela central de cantos chanfrados, de 9% a 91% da largura e de 5% a 81% da altura, preenchida com preto puro (#000000) liso, sem textura, sem brilho e sem gradiente. O neon fica só na borda da moldura, sem invadir a janela.
* Logo abaixo da janela, uma placa horizontal larga (de 7% a 93% da largura, de 81% a 91% da altura), com contorno de neon e interior escuro e liso, vazio.
* Abaixo da placa, uma faixa estreita e lisa centralizada, com fios finos nas laterais, vazia.

ÁREA DO JOGADOR:
A janela central deve ficar totalmente vazia e preta para receber depois a imagem PNG transparente de um jogador real, da cintura para cima. Não desenhe pessoas, silhuetas, personagens, armas ou rostos.

TEXTO:
Não escreva nenhum número, letra ou palavra em nenhum lugar da carta. O selo, a placa e a faixa ficam vazios: o número de OVR, o nome e a função serão inseridos depois pelo jogo.

A carta deve parecer um equipamento de alto nível de uma equipe profissional.
IMPORTANTE: não coloque estatísticas, personagens, fotografias ou imagens dentro da janela. Não faça mockup, não mostre várias cartas, não incline a carta. Gere somente uma carta isolada, de frente, ocupando todo o quadro, com fundo externo preto e formato vertical 2:3.
```

### Elite (81–90)

```
Crie a moldura de uma carta colecionável vertical para um simulador de gerenciamento de equipes profissionais de VALORANT, categoria ELITE, para jogadores de 81 a 90 OVR.
A identidade visual deve transmitir um dos melhores jogadores do mundo: estrela de time grande, decisivo em campeonatos internacionais.

DESIGN:
* Moldura premium de ouro polido e ouro escovado sobre placas de metal preto fosco.
* Recortes angulares, faixas douradas diagonais, chanfros e detalhes gravados.
* Reflexos de luz dourada nas arestas e pequenos brilhos pontuais, elegantes e controlados.
* Louros dourados com uma estrela no emblema do canto superior direito.
* Pequenas miras e marcações de HUD gravadas no metal.
* Paleta ouro, âmbar, preto e um toque de bronze.

LAYOUT (obrigatório, formato vertical 2:3):
* Selo octogonal no canto superior esquerdo, ocupando cerca de 25% da largura e 18% da altura, com contorno dourado e interior preto, liso e completamente vazio.
* Emblema de louros com estrela no canto superior direito.
* Grande janela central de cantos chanfrados, de 9% a 91% da largura e de 5% a 81% da altura, preenchida com preto puro (#000000) liso, sem textura, sem brilho e sem gradiente.
* Logo abaixo da janela, uma placa horizontal larga (de 7% a 93% da largura, de 81% a 91% da altura), com contorno dourado e interior preto e liso, vazio.
* Abaixo da placa, uma faixa estreita e lisa centralizada, com fios dourados nas laterais, vazia.

ÁREA DO JOGADOR:
A janela central deve ficar totalmente vazia e preta para receber depois a imagem PNG transparente de um jogador real, da cintura para cima. Não desenhe pessoas, silhuetas, personagens, armas ou rostos.

TEXTO:
Não escreva nenhum número, letra ou palavra em nenhum lugar da carta. O selo, a placa e a faixa ficam vazios: o número de OVR, o nome e a função serão inseridos depois pelo jogo.

A carta deve parecer um troféu: rara, valiosa e cobiçada.
IMPORTANTE: não coloque estatísticas, personagens, fotografias ou imagens dentro da janela. Não faça mockup, não mostre várias cartas, não incline a carta. Gere somente uma carta isolada, de frente, ocupando todo o quadro, com fundo externo preto e formato vertical 2:3.
```

### Lenda (91–99)

```
Crie a moldura de uma carta colecionável vertical para um simulador de gerenciamento de equipes profissionais de VALORANT, categoria LENDA, para jogadores de 91 a 99 OVR.
A identidade visual deve transmitir um jogador histórico: campeão mundial, ícone do cenário, o topo absoluto do competitivo.

DESIGN:
* Moldura de metal preto com veios de lava ou mármore vermelho, contornada por filetes de ouro envelhecido.
* Brilho vermelho intenso (#E3262F) nas bordas internas e externas, como energia saindo do metal.
* Uma coroa ou cristal vermelho lapidado em ouro no centro da borda superior e outro menor no centro, entre a janela e a placa do nome.
* Faixas diagonais vermelhas, parafusos dourados, pequenas miras e marcações de HUD.
* Paleta preto, vermelho rubi, ouro e brasa.
* Visual imponente e raro, com mais detalhe que as outras categorias, sem poluir.

LAYOUT (obrigatório, formato vertical 2:3):
* Selo octogonal no canto superior esquerdo, ocupando cerca de 25% da largura e 18% da altura, com contorno dourado, brilho vermelho e interior preto, liso e completamente vazio (um pequeno ornamento dourado pode ficar na ponta de baixo do selo).
* Emblema decorativo no canto superior direito.
* Grande janela central de cantos chanfrados, de 9% a 91% da largura e de 5% a 81% da altura, preenchida com preto puro (#000000) liso, sem textura, sem brilho e sem gradiente. O brilho vermelho fica só na moldura, sem invadir a janela.
* Logo abaixo da janela, uma placa horizontal larga (de 7% a 93% da largura, de 81% a 91% da altura), com contorno dourado e interior preto e liso, vazio.
* Abaixo da placa, uma faixa estreita e lisa centralizada, com fios dourados nas laterais, vazia.

ÁREA DO JOGADOR:
A janela central deve ficar totalmente vazia e preta para receber depois a imagem PNG transparente de um jogador real, da cintura para cima. Não desenhe pessoas, silhuetas, personagens, armas ou rostos.

TEXTO:
Não escreva nenhum número, letra ou palavra em nenhum lugar da carta. O selo, a placa e a faixa ficam vazios: o número de OVR, o nome e a função serão inseridos depois pelo jogo.

A carta deve parecer a peça mais rara da coleção: lendária, poderosa e única.
IMPORTANTE: não coloque estatísticas, personagens, fotografias ou imagens dentro da janela. Não faça mockup, não mostre várias cartas, não incline a carta. Gere somente uma carta isolada, de frente, ocupando todo o quadro, com fundo externo preto e formato vertical 2:3.
```

## 7. Placeholders atuais

As molduras em `assets/cartas/` vieram das quatro artes enviadas, com o "70/80/90/100
OVR" e o "DUELIST" apagados à mão e a janela vazada. Ao gerar as novas com os
prompts acima, é só rodar `tools/cartas.py` por cima: os nomes de arquivo são os
mesmos e nada no código muda (no máximo `GEO_CARTA`, se o selo sair em outro lugar).
