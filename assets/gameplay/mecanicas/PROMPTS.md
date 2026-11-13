# Mecânicas dos mapas — prompts

Peças que mudam durante a partida e por isso não entram na pintura: portas,
teleportes, cordas, tirolesas, muros que caem. O jogo desenha cada peça por cima
do mapa pintado, no lugar certo, e troca a imagem quando ela muda de estado
(porta fechada → aberta → quebrada).

**Como gerar**

1. Gere primeiro a peça principal de cada mapa (a primeira da lista: a porta fechada, o teleporte de entrada…).
2. Para as variações (aberta, quebrada, saída…), mande **a imagem da peça principal junto** e use o prompt da variação. Assim a porta aberta é a mesma porta da fechada.
3. Salve em `assets/gameplay/mecanicas/<mapa>/<nome>.png`, com o nome exato da lista (`LISTA.md` de cada pasta).

**Regras de todas as peças**

- Vista **exatamente de cima**, igual ao mapa pintado. Não é a vista inclinada dos bonecos e enfeites.
- A peça fica deitada na horizontal: o comprimento vai da esquerda para a direita, e o jogo gira para cada lugar.
- Fundo verde liso #00FF00, sem sombra no chão e sem nada em volta. A sombra quem faz é o jogo.
- Os trechos de corda e de cabo (`_trecho`) são uma faixa de 1024×256 que emenda sem costura na esquerda e na direita.

Pearl e Corrode não têm mecânica nenhuma no jogo original, então não têm peças.

---

## Abyss

Estética: base de pesquisa no alto de uma montanha na Noruega. Concreto e aço escuro quase preto, grades de metal, filetes de luz ciano, musgo e grama nas beiradas. No original, Abyss tem bordas sem proteção (cair mata) e uma porta destrutível.

### porta_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, mesma paleta de um mapa de base científica na montanha. Uma porta de segurança pesada vista de cima, deitada na horizontal: uma folha retangular comprida e estreita (proporção 6 para 1) de aço escuro quase preto com placas aparafusadas, bordas chanfradas, uma faixa de luz ciano brilhante correndo no meio do comprimento, duas trancas industriais nas pontas presas em batentes de concreto cinza-escuro com marcas de desgaste e um pouco de musgo verde. Detalhes pequenos: parafusos, frisos, uma etiqueta de aviso amarela e preta. A peça ocupa o centro da imagem com folga. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_quebrada

```
Use a imagem anexada como base: é a mesma porta de segurança vista de cima. Mostre a mesma porta, no mesmo ângulo, tamanho e posição, agora destruída: a folha de aço rasgada e amassada no meio com um buraco irregular, chapas dobradas para fora, a faixa de luz ciano apagada e piscando em um só ponto, faíscas pequenas, fios soltos e pedaços de metal espalhados logo em volta. Os batentes de concreto continuam no lugar, rachados. Mesmo estilo pixel art, mesmo contorno, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

## Ascent

Estética: cidade italiana inspirada em Veneza. Telhado de telha terracota, paredes de estuque ocre e salmão, chão de paralelepípedo de pedra. No original há duas portas de segurança de metal, uma no A (entre Tree e o bomb) e uma no B (na entrada do Market), que descem com um interruptor e podem ser destruídas a tiro.

### porta_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta quente de cidade italiana. Uma porta de segurança de metal fechada vista de cima, deitada na horizontal: a borda de cima de uma porta de enrolar industrial descida até o chão, uma faixa retangular comprida e estreita (proporção 6 para 1) de aço cinza-esverdeado com frisos, tinta descascando, ferrugem nas pontas e uma faixa de aviso amarela e preta gasta. Nas duas pontas, colunas de pedra creme com o trilho de ferro onde a porta corre, e uma caixa do motor retangular em cima de uma das colunas. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_aberta

```
Use a imagem anexada como base: é a mesma porta de segurança vista de cima. Mostre a mesma peça, no mesmo ângulo, tamanho e posição, com a porta aberta: a folha de metal recolhida e enrolada dentro da caixa do motor no alto. Entre as duas colunas de pedra só se vê o trilho de ferro vazio no chão, uma linha fina escura com parafusos. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### porta_quebrada

```
Use a imagem anexada como base: é a mesma porta de segurança vista de cima. Mostre a mesma porta, no mesmo ângulo, tamanho e posição, destruída: a folha de metal cheia de furos de bala e amassada, rasgada no meio com um buraco irregular por onde se passa, pedaços de chapa dobrados para os lados, a faixa amarela e preta queimada, fumaça fina saindo do motor. Colunas de pedra rachadas. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### interruptor

```
Sprite pequeno para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Um painel de interruptor preso na parede, visto de cima: uma caixinha de metal cinza com tampa, um botão grande vermelho e uma luz verde acesa, um conduíte de metal saindo de um lado. Proporção quase quadrada, pequeno e bem legível. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

## Bind

Estética: cidade de deserto em Rabat, Marrocos. Paredes de taipa cor de areia, telhados planos escuros, toldos listrados laranja, ladrilho de mosaico geométrico azul, verde e branco, latão e cobre. No original há dois teleportes de mão única: B Long leva ao A Showers, e A Short leva ao B Short. Eles fazem barulho ao usar.

### teleporte_entrada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de cidade de deserto marroquina. Uma plataforma de teleporte vista de cima: um círculo grande de pedra cor de areia com borda de latão gravado, por dentro um mosaico geométrico marroquino em estrela de oito pontas azul-turquesa, verde e branco. No centro, um anel de energia laranja brilhante girando, com fagulhas, e símbolos rúnicos laranja acesos em volta da borda. Quatro pequenas colunas de metal nas diagonais com luzes laranja. Fundo verde liso #00FF00, sem sombra, sem texto, sem personagens. Imagem 1024×1024.
```

### teleporte_saida

```
Use a imagem anexada como base: é a mesma plataforma de teleporte vista de cima. Mostre a mesma plataforma, mesmo tamanho e ângulo, como a SAÍDA: o anel de energia no centro apagado, só um brilho laranja fraco e calmo, as runas da borda acesas pela metade, e uma seta de mosaico mais clara no chão apontando para fora. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×1024.
```

### teleporte_brilho

```
Efeito para jogo de tiro tático visto exatamente de cima, em pixel art estilo jogo indie moderno. Um clarão de teleporte visto de cima: uma explosão circular de luz laranja e dourada, mais branca no centro, com anéis de energia se espalhando, fagulhas e pequenos fragmentos de runas luminosas voando para fora. Sem objeto sólido, só luz. Fundo verde liso #00FF00, sem texto. Imagem 1024×1024.
```

## Breeze

Estética: ilha tropical no Caribe. Ruínas de pedra calcária clara, cercas e galpões de madeira, metal pintado de vermelho e turquesa desbotados, cordas de navio, palmeiras. No original há uma corda para subir no lado do A (até a Bridge) e uma porta automática no Mid Hall que faz barulho alto.

### porta_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de ilha caribenha ensolarada. Uma porta automática fechada vista de cima, deitada na horizontal: duas folhas de madeira de tábuas largas desbotadas pelo sol, com reforço de metal turquesa descascado e rebites, encontrando-se no meio, uma faixa estreita e comprida (proporção 6 para 1). Nas pontas, trilhos de metal vermelho enferrujado presos em pilares de pedra calcária clara com musgo, e uma luz de aviso amarela em cima de um dos pilares. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_aberta

```
Use a imagem anexada como base: é a mesma porta automática vista de cima. Mostre a mesma peça, no mesmo ângulo, tamanho e posição, com a porta aberta: as duas folhas de madeira recolhidas para dentro dos pilares nas pontas, o meio livre mostrando só o trilho de metal no chão, a luz de aviso acesa em verde. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### corda_ponta

```
Sprite para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino, paleta caribenha. O ponto de subida de uma corda visto de cima: uma estaca grossa de madeira de navio com argola de ferro enferrujado, a corda grossa de fibra bege amarrada nela com um nó de marinheiro, e algumas voltas de corda enrolada no chão ao lado. A corda sai da estaca para a direita e termina na borda da imagem. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### corda_trecho

```
Faixa de textura para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Uma corda grossa de fibra bege trançada, vista de cima, esticada em linha reta da esquerda para a direita no meio da faixa, com a trança bem visível, algumas fibras soltas e manchas de sal e sujeira. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Fundo verde liso #00FF00 acima e abaixo da corda, sem sombra, sem texto. Imagem 1024×256.
```

## Fracture

Estética: laboratório secreto no deserto do Novo México. Concreto claro, telhados escuros quase pretos, detalhes de tecnologia ciano brilhante, cabos, terra laranja, faixas de aviso amarelas. No original há tirolesas que ligam os dois lados do ataque e uma porta automática indestrutível no A, que faz barulho alto.

### porta_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de laboratório no deserto. Uma porta automática de laboratório fechada vista de cima, deitada na horizontal: duas folhas grossas de metal grafite que se encontram no meio numa emenda em zigue-zague, com uma faixa de luz ciano brilhante ao longo da emenda, uma faixa estreita e comprida (proporção 6 para 1). Nas pontas, batentes de concreto claro com faixa de aviso amarela e preta e um painel com luz vermelha acesa. Poeira laranja do deserto nas bordas. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_aberta

```
Use a imagem anexada como base: é a mesma porta automática vista de cima. Mostre a mesma peça, no mesmo ângulo, tamanho e posição, aberta: as duas folhas de metal recolhidas para dentro dos batentes nas pontas, o meio livre com só a soleira de metal no chão, a luz do painel agora verde e a faixa ciano apagada. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### tirolesa_ponta

```
Sprite para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino, paleta de laboratório no deserto. A ponta de uma tirolesa vista de cima: um poste de metal grafite quadrado com base de concreto aparafusada, uma polia grande de aço no topo com luz ciano, o cabo de aço saindo para a direita até a borda da imagem, e uma alça de pegar pendurada. Faixa de aviso amarela e preta na base. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### tirolesa_trecho

```
Faixa de textura para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Um cabo de aço trançado visto de cima, esticado em linha reta da esquerda para a direita no meio da faixa, cinza-metálico com reflexos claros, e a cada meia faixa uma pequena presilha de metal com um pontinho de luz ciano. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Fundo verde liso #00FF00 acima e abaixo do cabo, sem sombra, sem texto. Imagem 1024×256.
```

## Haven

Estética: mosteiro em Timbu, Butão. Telhado de telha cinza-chumbo, madeira escura entalhada pintada de vermelho, verde e dourado, paredes caiadas de branco, lajes de pedra cinza. No original o portão da garagem do C tem chapas de metal que se arrancam a tiro.

### garagem_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de mosteiro butanês. O portão de uma garagem visto de cima, deitado na horizontal: uma faixa estreita e comprida (proporção 6 para 1) de portão duplo de madeira escura com moldura entalhada em vermelho, verde e dourado, coberto por chapas de metal cinza pregadas por cima, tortas e de tamanhos diferentes, com pregos e ferrugem. Nas pontas, pilares de madeira com base de pedra cinza. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### garagem_quebrada

```
Use a imagem anexada como base: é o mesmo portão de garagem visto de cima. Mostre o mesmo portão, no mesmo ângulo, tamanho e posição, depois de levar muitos tiros: as chapas de metal arrancadas e caídas no chão em volta, retorcidas, deixando a madeira entalhada exposta e cheia de furos de bala e lascas. Pregos soltos, pó de madeira. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

## Icebox

Estética: base de escavação no Ártico. Neve branco-azulada, metal preto e cinza-claro com faixas laranja, guindastes e estruturas amarelas, contêineres coloridos, barris amarelos. No original há tirolesas que levam para lugares altos e para os bombs.

### tirolesa_ponta

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de base no Ártico. A ponta de uma tirolesa vista de cima: uma torre de treliça de metal amarelo de guindaste, quadrada, com base de concreto e neve acumulada nos cantos, uma polia grande de aço no topo com uma luz laranja, o cabo de aço saindo para a direita até a borda da imagem, e uma alça de pegar pendurada. Pingentes de gelo pequenos na estrutura. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### tirolesa_trecho

```
Faixa de textura para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Um cabo de aço trançado visto de cima, esticado em linha reta da esquerda para a direita no meio da faixa, cinza-metálico com reflexos frios azulados, pontinhos de gelo e neve presos ao cabo, e a cada meia faixa uma pequena presilha laranja. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Fundo verde liso #00FF00 acima e abaixo do cabo, sem sombra, sem texto. Imagem 1024×256.
```

## Lotus

Estética: templo antigo nos Gates Ocidentais, Índia. Pedra cinza-escura entalhada com musgo, mandalas e detalhes dourados e de bronze, flores rosa-magenta, cipós. No original há:
- duas portas giratórias de pedra, lentas e barulhentas, que se abrem com botão dos dois lados (entre A Rubble e A Tree, e entre B Main e C Mound);
- uma porta pequena destrutível entre A Main e A Link;
- uma queda silenciosa do A Top para o bomb A, com uma tirolesa para voltar.

### porta_giratoria_fechada

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de templo indiano antigo. Uma porta giratória de pedra vista de cima, fechada, deitada na horizontal: um bloco retangular comprido e grosso (proporção 5 para 1) de pedra cinza-escura entalhada com uma faixa de mandala dourada no meio, preso num eixo central redondo de bronze com um disco gravado em forma de flor de lótus. Musgo verde e pétalas rosa caídas nas bordas, pequenas rachaduras na pedra. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_giratoria_aberta

```
Use a imagem anexada como base: é a mesma porta giratória de pedra vista de cima. Mostre exatamente o mesmo bloco de pedra com o mesmo eixo de bronze, na mesma escala, girado 90 graus (agora na vertical, no centro da imagem), deixando livres os dois lados por onde se passa, com marcas de arrasto em arco no chão de pedra. A mandala dourada brilha de leve. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×1024.
```

### botao

```
Sprite pequeno para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino, paleta de templo indiano. Um botão antigo na parede visto de cima: uma placa quadrada de pedra entalhada com moldura de bronze e, no meio, um botão redondo dourado em forma de flor de lótus com uma luz amarelo-dourada suave. Pequeno e bem legível. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### porta_fragil

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de templo indiano. Uma porta pequena e frágil vista de cima, deitada na horizontal: uma faixa curta (proporção 4 para 1) de tábuas finas de madeira velha e escura, com treliça entalhada, dobradiças de bronze esverdeado e um tecido vermelho desbotado pendurado, presa entre dois pequenos pilares de pedra com musgo. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto. Imagem 1024×512.
```

### porta_fragil_quebrada

```
Use a imagem anexada como base: é a mesma porta pequena de madeira vista de cima. Mostre a mesma peça, no mesmo ângulo, tamanho e posição, quebrada: as tábuas estilhaçadas em pedaços espalhados pelo chão em volta, a treliça partida, só lascas presas nas dobradiças, o tecido vermelho rasgado caído. Os pilares de pedra continuam no lugar. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### tirolesa_ponta

```
Sprite para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino, paleta de templo indiano. A ponta de uma tirolesa vista de cima: um pilar de pedra entalhada com um anel de bronze no topo, uma polia de bronze esverdeado com detalhes dourados, a corda grossa saindo para a direita até a borda da imagem, uma alça de madeira pendurada e cipós com flores rosa enrolados no pilar. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### tirolesa_trecho

```
Faixa de textura para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Uma corda grossa trançada de fibra marrom-escura com fios dourados, vista de cima, esticada em linha reta da esquerda para a direita no meio da faixa, com um pequeno cipó verde e uma flor rosa presos a cada meia faixa. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Fundo verde liso #00FF00 acima e abaixo da corda, sem sombra, sem texto. Imagem 1024×256.
```

## Split

Estética: bairro urbano denso em Tóquio. Telhados escuros cheios de ar-condicionado e dutos, concreto cinza, marcas amarelas no chão, letreiros de neon rosa e ciano. No original há cordas de subir (ascensores) no Sewer, no Vent e no Rafters.

### corda_ponta

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta urbana de Tóquio. O ponto de subida de uma corda vista de cima: um suporte de metal preto aparafusado no chão de concreto com uma polia e uma placa amarela e preta de aviso, a corda grossa preta e amarela saindo do suporte para a direita até a borda da imagem, uma luz pequena de neon ciano no suporte. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### corda_trecho

```
Faixa de textura para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino. Uma corda grossa de escalada sintética preta com faixas amarelas trançadas, vista de cima, esticada em linha reta da esquerda para a direita no meio da faixa, com um brilho leve de neon ciano refletido. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Fundo verde liso #00FF00 acima e abaixo da corda, sem sombra, sem texto. Imagem 1024×256.
```

## Summit

Estética: centro de treinamento num templo de montanha em Zhangjiajie, China. Telhados curvos, detalhes dourados e vermelhos, painéis de tecnologia ciano brilhante, lajes de pedra cinza. No original há três muros grandes que caem (um no A, um no Mid e um no B). Cada um tem um interruptor com 125 de vida na parede perto: quem destrói o interruptor derruba o muro até o fim do round, e ele esmaga o que estiver embaixo.

### muro_em_pe

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta de templo chinês de alta tecnologia. O topo de um muro alto móvel visto de cima, em pé, deitado na horizontal: uma faixa estreita e comprida (proporção 8 para 1) com o topo do muro de pedra cinza-clara e moldura de metal escuro, um friso de telhas curvas verde-jade no alto, pontas douradas e uma linha de luz ciano brilhante no meio do comprimento. Nas pontas, as dobradiças grandes de metal escuro onde o muro gira para cair. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### muro_caido

```
Use a imagem anexada como base: é o mesmo muro móvel visto de cima. Mostre o mesmo muro, com o mesmo comprimento e as mesmas dobradiças na mesma posição, agora tombado e deitado no chão: vemos a face inteira do painel caída, larga (proporção 4 para 1), com a parede de pedra cinza-clara com relevos de nuvens chinesas, moldura de metal escuro, o friso de telha verde-jade na borda de baixo, a luz ciano apagada, rachaduras e poeira levantada nas bordas. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### interruptor

```
Sprite pequeno para jogo de tiro tático visto exatamente de cima, em pixel art detalhada estilo jogo indie moderno, contorno escuro fino, paleta de templo chinês de alta tecnologia. Um interruptor na parede que pode ser destruído a tiro, visto de cima: um painel redondo de metal escuro com moldura dourada em forma de nuvem chinesa, um núcleo de cristal ciano brilhante no centro e três luzes ciano em volta. Pequeno e bem legível. Fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

### interruptor_quebrado

```
Use a imagem anexada como base: é o mesmo interruptor visto de cima. Mostre o mesmo painel, no mesmo tamanho e posição, destruído: o cristal ciano estilhaçado em cacos, as luzes apagadas, a moldura dourada amassada, furos de bala, faíscas e fumaça fina. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 512×512.
```

## Sunset

Estética: bairro de Los Angeles no pôr do sol. Estuque creme e rosa-salmão, telhado de telha vermelha, toldos coloridos, metal de lojas, luz laranja-rosada. No original há uma porta de enrolar destrutível no Market. Ela se fecha uma vez pelo lado do Market e não abre de novo.

### porta_aberta

```
Sprite para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino, paleta quente de pôr do sol em Los Angeles. A porta de enrolar de uma loja vista de cima, aberta, deitada na horizontal: uma faixa estreita e comprida (proporção 6 para 1) com a caixa de metal onde a porta fica enrolada, pintada de verde-azulado desbotado com adesivos e um pouco de grafite colorido, e embaixo só o trilho de metal vazio no chão entre dois pilares de estuque rosa-salmão. Fundo verde liso #00FF00, sem sombra, sem chão, sem texto, sem personagens. Imagem 1024×512.
```

### porta_fechada

```
Use a imagem anexada como base: é a mesma porta de enrolar vista de cima. Mostre a mesma peça, no mesmo ângulo, tamanho e posição, com a porta descida e fechada: a folha de metal ondulado verde-azulado desbotado cobrindo todo o vão entre os pilares, com grafite colorido e um cadeado no chão. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```

### porta_quebrada

```
Use a imagem anexada como base: é a mesma porta de enrolar vista de cima. Mostre a mesma porta, no mesmo ângulo, tamanho e posição, destruída: o metal ondulado cheio de furos de bala, rasgado e amassado no meio com um buraco por onde se passa, lâminas soltas dobradas para os lados, a tinta descascada. Pilares de estuque lascados. Mesmo estilo, fundo verde liso #00FF00, sem sombra, sem texto. Imagem 1024×512.
```
