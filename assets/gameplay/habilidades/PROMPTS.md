# Habilidades no mapa — prompts

151 peças para os 29 agentes.

O que cada habilidade desenha no mapa, visto de cima: o que voa, o que fica no chão, a fumaça, o fogo e as paredes.
Os ícones C/Q/E/X do HUD continuam como estão, nas pastas dos agentes.

**Como gerar**

- Salve cada imagem em `assets/gameplay/habilidades/<agente>/<nome>.png`, com o nome exato (a pasta tem `LISTA.md`).
- Pode mandar em folhas com várias peças, como fez com as mecânicas. Eu separo, contanto que as peças não se encostem.
- Fundo: verde #00FF00, ou **magenta #FF00FF** nos agentes de efeito verde (Skye, Gekko, Viper, Sage e Veto), para o recorte não comer a cor do efeito.
- Fumaça, fogo e clarão podem ter a borda transparente/suave: o jogo deixa semitransparente.
- Só entra o que aparece no mapa para os outros. Corrida, pulo e buffs no próprio corpo viram rastro ou aura; armas das ultimates (Chamber) usam a arma normal.

---

## Duelistas

### Jett

Cores: branco, azul-claro e ciano bem pálido, como vento. Fundo #00FF00.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma nuvem de fumaça branca e azulada em espiral, pequena e densa, que tapa a visão (Cloudburst), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e ciano bem pálido, como vento. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma lufada de vento subindo do chão, anéis de ar em espiral e folhas e poeira voando para fora (Updraft), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e ciano bem pálido, como vento. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. O rastro de uma arrancada muito rápida: riscos de vento branco-azulado e poeira levantada (Tailwind), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: branco, azul-claro e ciano bem pálido, como vento. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### x_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma faca de arremesso tipo kunai, com lâmina de energia azul-clara brilhante e rastro de vento (Blade Storm), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: branco, azul-claro e ciano bem pálido, como vento. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

### Phoenix

Cores: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo #00FF00.

#### c_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de chamas altas e vivas, laranja e douradas, com brasas e fumaça fina saindo das pontas das labaredas (Blaze), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um orbe pequeno de fogo branco-dourado que faz uma curva no ar (Curveball), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. O estouro de um clarão de luz branca e dourada, muito forte no centro, que cega quem olha (Curveball), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma bola de fogo incandescente com rastro de faíscas (Hot Hands), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma poça redonda de chamas no chão, fogo baixo e vivo com brasas, mais forte no centro (Hot Hands), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um marcador de renascimento no chão: um círculo de chamas douradas com um símbolo de ave de fogo no meio, brilhando (Run It Back). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: laranja, dourado e vermelho de fogo, com branco quente no centro. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

### Reyna

Cores: violeta, roxo e magenta, com brilho de energia de alma. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um olho sobrenatural flutuante de energia violeta, com íris brilhante e fios de energia em volta (Leer). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: violeta, roxo e magenta, com brilho de energia de alma. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um orbe de alma que fica no chão depois de um abate: uma esfera roxa-translúcida pulsando com fiapos de energia subindo (Devour / Dismiss). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: violeta, roxo e magenta, com brilho de energia de alma. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma aura de energia violeta em volta de quem está no centro, chamas roxas baixas e partículas subindo (Empress), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: violeta, roxo e magenta, com brilho de energia de alma. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Raze

Cores: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pequeno robô explosivo de rodas visto de cima, carcaça laranja e amarela com faixas pretas, sensor azul na frente, olhando para a direita (Boom Bot). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma carga explosiva adesiva redonda e achatada, laranja com luz piscando (Blast Pack), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma explosão compacta com respingos de tinta azul-turquesa e laranja e fumaça (Blast Pack), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada de fragmentação gorda, laranja e amarela, com pino e listras (Paint Shells), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma explosão que se divide em várias pequenas bombinhas espalhadas, com respingos de tinta colorida (Paint Shells), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um foguete grosso com ponta laranja e listras amarelas, chama azul saindo de trás (Showstopper), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma explosão grande e redonda de fogo laranja com anel de choque e respingos de tinta azul (Showstopper), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: laranja, amarelo e azul-turquesa de tinta, com fumaça cinza. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Yoru

Cores: azul-escuro profundo e ciano, com distorções dimensionais. Fundo #00FF00.

#### c_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma trilha de pegadas de energia azul dimensional andando da esquerda para a direita, cada pegada brilhando e se apagando (Fakeout), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: azul-escuro profundo e ciano, com distorções dimensionais. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um fragmento dimensional pontudo, cristal azul-escuro rachado com luz ciano por dentro (Blindside), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul-escuro profundo e ciano, com distorções dimensionais. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um clarão que estoura em estilhaços de luz azul e ciano, como vidro dimensional quebrando (Blindside), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: azul-escuro profundo e ciano, com distorções dimensionais. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma âncora dimensional no chão: um portal oval pequeno e achatado, azul-escuro com borda ciano rodopiando (Gatecrash). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: azul-escuro profundo e ciano, com distorções dimensionais. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma distorção dimensional em volta de quem está no centro: o ar ondulando em azul translúcido, fendas finas ciano (Dimensional Drift), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul-escuro profundo e ciano, com distorções dimensionais. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Neon

Cores: azul elétrico e amarelo, com raios brancos. Fundo #00FF00.

#### c_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de eletricidade azul: um feixe de raios estalando, faíscas amarelas e linhas brancas crepitando (Fast Lane), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: azul elétrico e amarelo, com raios brancos. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma bola de energia elétrica azul crepitante, com raios saindo (Relay Bolt), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul elétrico e amarelo, com raios brancos. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda de choque elétrica no chão: anel de raios azuis e amarelos se espalhando do centro (Relay Bolt), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul elétrico e amarelo, com raios brancos. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. O rastro de uma corrida muito rápida: faixas de eletricidade azul e amarela no chão (High Gear), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: azul elétrico e amarelo, com raios brancos. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### x_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um feixe de eletricidade concentrado e reto, branco no meio e azul por fora, com raios em volta (Overdrive), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: azul elétrico e amarelo, com raios brancos. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

### Iso

Cores: violeta e roxo com hexágonos de energia azul-clara. Fundo #00FF00.

#### c_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de energia feita de hexágonos violetas encaixados, translúcida, com brilho nas emendas (Contingency), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: violeta e roxo com hexágonos de energia azul-clara. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um projétil molecular: uma esfera pequena violeta com anéis hexagonais girando em volta (Undercut), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: violeta e roxo com hexágonos de energia azul-clara. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um escudo de energia hexagonal violeta em volta de quem está no centro, uma bolha translúcida de hexágonos (Double Tap), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: violeta e roxo com hexágonos de energia azul-clara. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. O chão de uma arena quadrada de energia: um quadrado de linhas violetas brilhantes com hexágonos nos cantos (Kill Contract), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: violeta e roxo com hexágonos de energia azul-clara. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Waylay

Cores: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo #00FF00.

#### c_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um prisma pequeno de luz branca e magenta girando (Saturate), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um aglomerado de cristais de luz prismática estourando no chão, magenta, violeta e branco (Saturate), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. O rastro de uma arrancada na velocidade da luz: faixas prismáticas magenta e brancas (Lightspeed), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um ponto de retorno no chão: um losango de luz prismática flutuando com reflexos de arco-íris (Refract). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_cone

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um feixe prismático largo que se abre em leque, luz magenta, violeta e branca em camadas (Convergent Paths), visto de cima: uma onda em forma de leque que sai de um ponto no meio da borda esquerda e se abre para a direita, mais forte perto da origem. Paleta: branco prismático, magenta e violeta, com reflexos de arco-íris. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

---

## Iniciadores

### Sova

Cores: azul elétrico e ciano, com metal cinza-azulado. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um drone de reconhecimento pequeno de quatro hélices, visto de cima, corpo azul-escuro e luz ciano, olhando para a direita (Owl Drone). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma flecha tecnológica com ponta elétrica azul faiscando (Shock Bolt), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma descarga elétrica no chão: raios azuis saindo do centro em todas as direções (Shock Bolt), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma flecha tecnológica com ponta de sensor ciano piscando (Recon Bolt), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pulso de radar: anéis finos ciano se espalhando do centro como ondas, só linhas e pontos (Recon Bolt), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um feixe de energia azul reto e grosso, branco no meio, que atravessa paredes (Hunter's Fury), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: azul elétrico e ciano, com metal cinza-azulado. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

### Breach

Cores: laranja, marrom e amarelo, com poeira e pedra rachada. Fundo #00FF00.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma carga sísmica explodindo no chão em três pulsos: anéis de choque laranja e pedaços de pedra (Aftershock), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: laranja, marrom e amarelo, com poeira e pedra rachada. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um clarão laranja e branco estourando com faíscas (Flashpoint), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: laranja, marrom e amarelo, com poeira e pedra rachada. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma rachadura sísmica no chão, pedra partida com luz laranja saindo das fendas e poeira (Fault Line), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: laranja, marrom e amarelo, com poeira e pedra rachada. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### x_cone

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Ondas de choque sísmicas em leque: o chão se levantando em ondas de pedra e poeira laranja (Rolling Thunder), visto de cima: uma onda em forma de leque que sai de um ponto no meio da borda esquerda e se abre para a direita, mais forte perto da origem. Paleta: laranja, marrom e amarelo, com poeira e pedra rachada. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Skye

Cores: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo #FF00FF.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um brilho de cura no chão: luz verde-dourada suave com folhas e sementes de luz subindo (Regrowth), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um animal espiritual original feito de energia verde-dourada, parecido com um lobo magro listrado, correndo para a direita, visto de cima (Trailblazer). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um falcão de luz verde-dourada com asas abertas, visto de cima, voando para a direita (Guiding Light), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um clarão de luz verde e dourada estourando com penas de luz (Guiding Light), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma pequena criatura buscadora feita de luz verde, como um espírito alado com cauda de luz (Seekers), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: verde-folha, dourado e marrom de couro, com luz de natureza. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

### KAY/O

Cores: branco, azul-claro e cinza metálico, tecnologia militar. Fundo #00FF00.

#### c_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada de fragmentação tecnológica cinza com luzes azuis (FRAG/ment), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Pulsos explosivos no chão: anéis de energia azul e branca com estilhaços metálicos (FRAG/ment), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada de clarão tecnológica, cilindro branco com faixa azul (FLASH/drive), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um clarão de luz branca e azul muito forte, com linhas de interferência digital (FLASH/drive), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma faca tecnológica de arremesso com lâmina de energia azul (ZERO/point), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um anel de supressão: um círculo grande de linhas azuis e símbolos de interferência se espalhando (ZERO/point), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda de supressão enorme: anéis concêntricos de energia azul e estática digital (NULL/cmd), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco, azul-claro e cinza metálico, tecnologia militar. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Fade

Cores: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma pequena criatura original feita de tinta preta e sombra, de quatro patas, rastejando para a direita, olhos azulados brilhando (Prowler). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um orbe escuro de pesadelo, tinta preta rodopiando com brilho azul-esverdeado (Seize), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um nó de pesadelo no chão: tentáculos de tinta preta se fechando para o centro, com brilho azulado (Seize), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um olho sobrenatural flutuante de tinta preta com íris azul-esverdeada brilhante (Haunt). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_cone

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda escura de pesadelo em leque: tinta preta e fumaça azulada avançando pelo chão (Nightfall), visto de cima: uma onda em forma de leque que sai de um ponto no meio da borda esquerda e se abre para a direita, mais forte perto da origem. Paleta: preto de tinta, azul-escuro e verde-azulado, como pesadelo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Gekko

Cores: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo #FF00FF.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma poça de gosma verde-limão explosiva se espalhando no chão, com bolhas (Mosh Pit), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma criatura original pequena e fofa, verde e amarela, de pernas curtas e olhos grandes, vista de cima, andando para a direita (Wingman). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma criatura original redonda e fofa, roxa e verde, flutuando, vista de cima (Dizzy). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um jato de gosma luminosa verde-limão estourando em respingos, que cega (Dizzy), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma criatura original grande e feroz, verde com espinhos roxos, vista de cima, avançando para a direita com a boca aberta (Thrash). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma explosão de gosma que prende: respingos verdes e roxos grudentos se espalhando do centro (Thrash), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-limão, amarelo e roxo, criaturas fofas e coloridas. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Tejo

Cores: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um drone aéreo compacto e furtivo de quatro hélices, visto de cima, corpo bege e cinza com luz laranja (Stealth Drone). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada adesiva de concussão, cilindro verde-oliva com luz laranja (Special Delivery), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda de concussão: anel de pressão laranja e poeira se espalhando (Special Delivery), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um míssil guiado pequeno, corpo cinza e ponta laranja, com rastro de fumaça (Guided Salvo), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. A explosão de um míssil no chão: fogo laranja, fumaça cinza e cratera (Guided Salvo), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um bombardeio de artilharia marcado no chão: uma faixa de explosões em sequência com marcas de mira laranja (Armageddon), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: bege, marrom e verde-oliva militar, com luz laranja de mira. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

---

## Controladores

### Brimstone

Cores: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo #00FF00.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um campo de estímulo no chão: um círculo laranja com setas de velocidade e brilho pulsando (Stim Beacon), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada incendiária cilíndrica cinza com faixa laranja (Incendiary), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma poça de fogo no chão: chamas laranja e vermelhas com brasas (Incendiary), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma fumaça grande, grossa e redonda, cinza-chumbo com reflexos laranja, que tapa tudo (Sky Smoke), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um ataque orbital: um círculo de laser vermelho-alaranjado caindo do céu, chão queimando e anel de energia (Orbital Strike), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Viper

Cores: verde tóxico, verde-ácido e preto. Fundo #FF00FF.

#### c_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um frasco de ácido verde-tóxico girando no ar (Snake Bite), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma poça de ácido venenoso verde borbulhando no chão (Snake Bite), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um emissor de gás no chão: um cilindro metálico preto com válvula e luz verde (Poison Cloud). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma nuvem de gás tóxico verde, grossa e redonda (Poison Cloud), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de gás venenoso verde subindo do chão, densa, com redemoinhos (Toxic Screen), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma cúpula enorme de gás tóxico verde-escuro, com névoa densa e brilho ácido (Viper's Pit), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde tóxico, verde-ácido e preto. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Omen

Cores: roxo-escuro, azul-arroxeado e preto de sombra. Fundo #00FF00.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma sombra no chão onde alguém vai aparecer: mancha escura roxa com fiapos de fumaça subindo (Shrouded Step), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo-escuro, azul-arroxeado e preto de sombra. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda de sombra reta avançando, roxa e preta, com olhos tênues de luz azulada (Paranoia), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: roxo-escuro, azul-arroxeado e preto de sombra. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma esfera de fumaça escura grande e redonda, roxa-azulada quase preta (Dark Cover), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo-escuro, azul-arroxeado e preto de sombra. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um redemoinho de sombra no chão, roxo e preto, onde alguém se teleporta (From the Shadows), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo-escuro, azul-arroxeado e preto de sombra. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Astra

Cores: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma estrela no chão: um ponto de luz dourada e roxa com raios finos, esperando ser ativada (estrela das habilidades C, Q e E). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um poço gravitacional: vórtice roxo e dourado puxando para o centro, com espirais de estrelas (Gravity Well), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pulso de estrela explodindo: anel de luz roxa e dourada com faíscas (Nova Pulse), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma nuvem de fumaça cósmica roxa e azul, cheia de pequenas estrelas, grossa e redonda (Nebula), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede cósmica: uma cortina de energia roxa e azul com estrelas e brilho dourado (Cosmic Divide), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: roxo cósmico, dourado e azul-estrelado, com pontos de estrela. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

### Harbor

Cores: azul-turquesa de água, branco de espuma e bronze antigo. Fundo #00FF00.

#### c_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma esfera de água turquesa girando, com espuma em espiral (Storm Surge), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul-turquesa de água, branco de espuma e bronze antigo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um redemoinho de água turquesa explosivo no chão, girando para o centro, com espuma e gotas (Storm Surge), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul-turquesa de água, branco de espuma e bronze antigo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede alta de água turquesa correndo, com espuma e gotas (High Tide), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: azul-turquesa de água, branco de espuma e bronze antigo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma cúpula esférica de água turquesa translúcida, com reflexos e espuma na borda (Cove), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul-turquesa de água, branco de espuma e bronze antigo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda gigante de água turquesa avançando pelo chão, com espuma branca na crista (Reckoning), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: azul-turquesa de água, branco de espuma e bronze antigo. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

### Clove

Cores: rosa, roxo e azul-claro, com borboletas de luz. Fundo #00FF00.

#### c_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pulso de energia vital rosa e roxa, com pequenas borboletas de luz saindo (Pick-Me-Up), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: rosa, roxo e azul-claro, com borboletas de luz. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um orbe de energia rosa e roxa que se desfaz em partículas (Meddle), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: rosa, roxo e azul-claro, com borboletas de luz. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma explosão de partículas rosa e roxas no chão que enfraquece quem está dentro (Meddle), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: rosa, roxo e azul-claro, com borboletas de luz. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma nuvem de fumaça rosa e roxa, grossa e redonda, com borboletas de luz (Ruse), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: rosa, roxo e azul-claro, com borboletas de luz. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma aura de energia rosa e roxa em volta de quem está no centro, com borboletas girando (Not Dead Yet), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: rosa, roxo e azul-claro, com borboletas de luz. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Miks

Cores: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pequeno dispositivo de som redondo no chão, visto de cima: um alto-falante metálico com anel de luz amarela (M-Pulse). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Ondas sonoras de concussão: anéis amarelo-mostarda e laranja se espalhando do centro, com distorção (M-Pulse, modo concussão), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### c_area_cura

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Ondas sonoras de cura: anéis suaves branco-esverdeados se espalhando do centro, com notas musicais pequenas (M-Pulse, modo cura), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um estímulo de combate: ondas sonoras amarelas e notas musicais girando em volta do centro (Harmonize), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma cortina de fumaça cinza-clara com ondas sonoras amarelas vibrando dentro, grossa e redonda (Waveform), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_cone

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma onda sônica enorme em leque, amarelo-mostarda e branca, com anéis de pressão que empurram (Bassquake), visto de cima: uma onda em forma de leque que sai de um ponto no meio da borda esquerda e se abre para a direita, mais forte perto da origem. Paleta: amarelo-mostarda, laranja e branco, com ondas sonoras. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

---

## Sentinelas

### Sage

Cores: verde-jade, azul-gelo e branco. Fundo #FF00FF.

#### c_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de blocos de gelo e cristal verde-jade, sólida e translúcida, com brilho nas arestas (Barrier Orb), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: verde-jade, azul-gelo e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um orbe de gelo verde-jade com névoa fria em volta (Slow Orb), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: verde-jade, azul-gelo e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um campo de lentidão: chão coberto de gelo verde-jade cristalizado com névoa fria (Slow Orb), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-jade, azul-gelo e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um brilho de cura: luz verde-jade suave com partículas subindo em espiral (Healing Orb), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: verde-jade, azul-gelo e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um círculo de ressurreição: luz verde-jade e branca subindo do chão em pilar, com anel de energia (Resurrection), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-jade, azul-gelo e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Cypher

Cores: branco, bege e azul-claro, tecnologia de vigilância. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. A ponta de um fio-armadilha preso na parede: um pequeno emissor cinza com luz azul (Trapwire). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um fio de laser azul fino e brilhante esticado, com pontinhos de luz (Trapwire), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma gaiola de fumaça desativada no chão: um pequeno cilindro metálico com anel azul (Cyber Cage). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma gaiola cilíndrica de fumaça cinza-azulada vista de cima: anel de energia azul com fumaça por dentro (Cyber Cage), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma câmera de vigilância pequena presa na parede, vista de cima, lente azul brilhando, olhando para a direita (Spycam). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pulso de revelação: anel azul digital com padrão de dados se espalhando (Neural Theft), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: branco, bege e azul-claro, tecnologia de vigilância. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Killjoy

Cores: amarelo, preto e roxo de tecnologia. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada de nanorrobôs escondida no chão: um disco amarelo e preto com luz roxa (Nanoswarm). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um enxame de nanorrobôs amarelos e roxos girando no chão, como um redemoinho de partículas metálicas (Nanoswarm), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um pequeno robô-alarme redondo de rodas, visto de cima, amarelo e preto com antena e luz roxa, olhando para a direita (Alarmbot). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma torreta automática compacta, vista de cima, base de tripé amarela e cano preto apontando para a direita, luz roxa (Turret). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um dispositivo de contenção grande no chão: um aparelho amarelo e preto com antenas e núcleo roxo brilhando (Lockdown). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um anel enorme de contenção no chão: círculo de energia roxa e amarela com linhas de varredura (Lockdown), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: amarelo, preto e roxo de tecnologia. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Chamber

Cores: dourado, azul-marinho e branco, elegante. Fundo #00FF00.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma armadilha tecnológica no chão: um disco dourado e azul-marinho com luz amarela (Trademark). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: dourado, azul-marinho e branco, elegante. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um campo de lentidão dourado no chão, com anéis finos e partículas douradas (Trademark), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: dourado, azul-marinho e branco, elegante. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma âncora de teleporte no chão: um disco dourado com símbolo de seta e brilho (Rendezvous). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: dourado, azul-marinho e branco, elegante. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um campo de lentidão dourado que fica onde alguém caiu abatido, anéis e partículas douradas (Tour De Force), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: dourado, azul-marinho e branco, elegante. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Deadlock

Cores: azul-escuro, cinza e branco, nanofios brilhantes. Fundo #00FF00.

#### c_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma granada de nanofios cinza com luzes azuis (GravNet), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma rede de nanofios brancos e azuis cobrindo o chão em padrão de teia (GravNet), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um sensor de som pequeno preso na parede, visto de cima, cinza com luz azul (Sonic Sensor). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma barreira de nanofios vista de cima em forma de X: quatro painéis de malha branca e azul saindo de um núcleo (Barrier Mesh). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_rastro

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um cabo de nanofios reto e brilhante, branco e azul, puxando (Annihilation), visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte na direita, no meio da imagem, ocupando a largura toda. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### x_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um casulo de nanofios brancos e azuis enrolados, visto de cima (Annihilation). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: azul-escuro, cinza e branco, nanofios brilhantes. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

### Vyse

Cores: vermelho, cobre e verde-escuro de metal líquido. Fundo #00FF00.

#### c_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Vinhas e espinhos de metal líquido cor de cobre espalhados pelo chão, pontudos e brilhantes (Razorvine), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: vermelho, cobre e verde-escuro de metal líquido. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### q_parede

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma parede de metal líquido vermelho e cobre que irrompe do chão, com espinhos na crista (Shear), vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa emenda sem costura: a ponta esquerda continua exatamente na direita. Paleta: vermelho, cobre e verde-escuro de metal líquido. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×256.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma rosa de metal cobre e vermelho presa na parede, com pétalas afiadas (Arc Rose). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: vermelho, cobre e verde-escuro de metal líquido. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### e_clarao

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um clarão de luz vermelha e cobre saindo de uma rosa metálica, com pétalas de metal voando (Arc Rose), visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, ocupando quase toda a imagem sem encostar na borda. Paleta: vermelho, cobre e verde-escuro de metal líquido. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um jardim de espinhos de metal se expandindo do centro, vermelho e cobre, enorme (Steel Garden), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: vermelho, cobre e verde-escuro de metal líquido. Fundo liso #00FF00 (verde puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

### Veto

Cores: verde-mutação, preto e branco. Fundo #FF00FF.

#### c_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um vórtice de teleporte no chão: um redemoinho achatado verde e preto (Crosscut). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-mutação, preto e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_projetil

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um fragmento orgânico viscoso verde e preto voando (Chokehold), visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem legível mesmo reduzido, ocupando o centro da imagem. Paleta: verde-mutação, preto e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### q_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma armadilha orgânica no chão: gosma verde e preta com filamentos que prendem (Chokehold), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-mutação, preto e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

#### e_objeto

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Um interceptador circular no chão, visto de cima: disco preto e branco com anel de energia verde (Interceptor). Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido. Paleta: verde-mutação, preto e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 512×512.
```

#### x_area

```
Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver objeto sólido, cores vivas. Uma aura de mutação em volta de quem está no centro: energia verde e preta pulsando, com veias de luz (Evolution), visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda. Paleta: verde-mutação, preto e branco. Fundo liso #FF00FF (magenta puro, sem degradê), sem sombra no chão, sem texto, sem letras, sem personagens. Imagem 1024×1024.
```

