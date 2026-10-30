# VCT Manager

Simulador de gestão de e-sports de Valorant, no espírito dos managers de futebol:
elenco, táticas, treino, mercado de transferências, base, finanças e o circuito
internacional completo rodando ao redor.

Projeto pessoal, sem fins comerciais.

---

## Rodar

**Modo desenvolvimento** — abra `index.html` no navegador. Não precisa de servidor,
build nem npm. Os módulos são carregados como scripts clássicos, na ordem definida
no final do `index.html`.

**Modo distribuição** — `node tools/build.mjs` gera `dist/vct-manager.html`,
um arquivo único autocontido. A pasta `assets/` precisa ficar ao lado dele.

**Verificação** — três ferramentas, uma para cada camada:

```
node tools/verificar.mjs 6        # motor: simula 6 temporadas e valida invariantes
node tools/build.mjs
node tools/testar-ui.mjs          # interface: monta o dist num DOM e exercita as telas
node tools/telas.mjs              # visual: abre o dist no Chromium e salva PNG de cada tela
```

O primeiro roda sem nada instalado. O segundo precisa de `npm install` (só o jsdom,
só para o teste) e carrega o `dist/` num DOM de verdade, renderizando todas as telas
e todas as abas do Editor e clicando nos handlers — é o que pega erro de interface
sem abrir o navegador. `npm run teste` faz o build e roda o teste de interface; `npm run motor` roda o primeiro com 12 temporadas.

O terceiro (`npm run telas`) existe porque o jsdom prova que a interface funciona
mas não desenha nada — não tem layout. Ele abre o `dist/` num Chromium de verdade e
salva um PNG por tela em `capturas/`, que é como se confere o visual sem abrir o
jogo à mão. Sem rede as fontes do Google não carregam e o texto sai na fonte de
sistema: o desenho é fiel, a tipografia não.

---

## Estrutura

```
vct-manager/
├─ index.html              app shell, define a ordem de carga dos módulos
├─ data/                   dados do mundo (editáveis à mão)
│  ├─ mundo.js             mapas, agentes, funções, pesos de atributo, regiões
│  └─ times.js             as 80 organizações do circuito (nome, tag, prestígio)
├─ src/
│  ├─ core/                motor — nada aqui toca o DOM
│  │  ├─ rng.js            gerador determinístico por semente + utilitários
│  │  ├─ state.js          objeto G (estado global da run)
│  │  ├─ player.js         atributos, over, valor, salário, geração, evolução
│  │  ├─ lineup.js         escalação automática, cobertura de funções
│  │  ├─ world.js          geração do mundo a partir de data/
│  │  ├─ match.js          veto de mapas, simulação round a round, box score
│  │  ├─ competition.js    stages (pontos corridos e mata-mata), premiação
│  │  ├─ calendar.js       calendário da temporada e qualificações
│  │  ├─ clock.js          avanço de tempo, folha, treino semanal
│  │  ├─ market.js         propostas, valores, mercado da IA
│  │  ├─ offseason.js      envelhecimento, contratos, base, aposentadorias
│  │  ├─ bracket.js        chaveamento sem efeito colateral (previews)
│  │  └─ editar.js         operações de base do Editor + validação
│  ├─ data/
│  │  ├─ assets.js         resolução de escudos e fotos + fallback gerado
│  │  ├─ storage.js        runs: IndexedDB → localStorage → memória, export .json
│  │  └─ imagens.js        pacote de imagens enviadas pelo Editor
│  └─ ui/                  tudo que desenha tela
│     ├─ styles.css        design system
│     ├─ shell.js          modos, sidebar, topbar, render e primitivas
│     ├─ menu.js           menu principal, configurações e créditos
│     ├─ views.js          telas
│     ├─ modals.js         ficha de jogador, partida, proposta
│     ├─ editor.js         as seis abas do Editor
│     ├─ runs.js           gerenciamento de runs
│     ├─ newgame.js        seleção de clube
│     └─ events.js         ligação de eventos das telas
├─ assets/
│  ├─ logos/               escudos:  <tag>.png       ex.: sen.png
│  ├─ players/             fotos:    <nick>.png      ex.: zekken.png
│  ├─ rostos/              pacote gerado (tools/rostos.py)
│  └─ ui/                  ícones e favicon
├─ runs/                   backups .vctrun.json (versionáveis no git)
├─ tools/                  build.mjs, verificar.mjs, testar-ui.mjs, telas.mjs, rostos.py
├─ docs/                   ARQUITETURA.md, DADOS.md, ROADMAP.md
└─ dist/                   saída do build (gerada)
```

---

## Interface

O app tem **dois shells**, e o modo mora numa classe do `<body>`:

**`modo-menu`** — menu principal, banco de dados, partidas salvas, configurações e
créditos. Sem sidebar, sem topbar: não é onde você joga, é onde você prepara.

**`modo-jogo`** — o HUD. Sidebar fixa com os itens agrupados, e topbar com setas de
histórico, título da tela, temporada, fase, caixa e as ações de Salvar, Avançar e
avanço rápido (`»`, que pula as rodadas em que seu clube não joga).

| Grupo | Telas |
|---|---|
| Clube | Central, Elenco, Táticas, Base |
| Circuito | Competições, Líderes, Notícias |
| Gestão | Mercado, Finanças |
| Sistema | Banco de dados, Configurações |

O Banco de dados aparece nos dois shells de propósito: montar base é pré-jogo, mas
corrigir um nick no meio da temporada também acontece. `render()` em
`src/ui/shell.js` é a única porta de entrada — quem chama não precisa saber em qual
shell está.

### Identidade visual

Paleta oficial do Valorant sobre fundo escuro. O vermelho `#FF4655` é **ação e
seleção**, e por isso não decora nada: se está vermelho, é onde você clica ou é o
que exige atenção. Teal `#18E5B4` para positivo, âmbar para aviso, ouro para
conquista. Superfícies em quatro degraus (`--bg` → `--bg2` → `--panel` →
`--panel2`), sem sombra: a hierarquia vem do degrau e da borda de 1px. O corte
angular no canto inferior direito é a assinatura de forma, e aparece em botão
primário, painel e KPI.

## Fluxo de uma run

1. **Menu › Novo jogo** — a semente define os elencos gerados. A mesma semente
   sempre produz o mesmo mundo.
2. **Banco de dados** — você cai direto nele, ainda no shell do menu. É aqui que
   corrige nomes, move jogadores, cola elencos reais e sobe imagens.
3. **Escolher clube e começar** — a aba Validação precisa estar limpa. A run começa,
   o app troca para `modo-jogo` e salva automaticamente.
4. **Jogar** — cada Avançar resolve uma rodada de todas as competições ativas.

---

## Editor

O Editor é o lugar de montar a base, em seis abas:

- **Times** — identidade, liga e divisão, prestígio, entrosamento, caixa, patrocínio,
  comissão técnica, estrutura, afinidade de mapa e escudo. O elenco aparece embaixo,
  com um select por linha que move o jogador para qualquer clube ou para Sem clube.
- **Jogadores** — busca em toda a base, com filtro por status, função, região e clube.
- **Sem clube** — o mercado de agentes livres. Quem está aqui pode ser contratado por
  qualquer time, e a IA usa essa lista para repor elenco no offseason.
- **Comissão** — os cinco cargos de cada clube, com foto, atributos, contrato e
  salário. O ocupante de cada vaga sai de um select que inclui quem está livre e
  quem está empregado em outro clube.
- **Torneios** — as 43 competições do circuito: nome, sigla curta, arte e **prêmio do
  campeão**. Renomear vale na hora, inclusive na temporada em andamento; mudar o prêmio
  muda o dinheiro que entra no circuito.
- **Agentes** — a lista de agentes do jogo, com retrato e função. É da run, não do
  arquivo de dados, então dá para acompanhar lançamento sem editar `data/mundo.js`.
- **Imagens** — sobe PNG por time, jogador, torneio, agente, ou tudo em lote.
- **Importar / Exportar** — o formato em texto, agora aceitando `LIVRE` como destino.
- **Validação** — o que está inconsistente na base. Erro trava o início da run.

A ficha de jogador é editável por inteiro: os oito atributos com slider, potencial,
contrato, salário, condição (moral, forma, fadiga, lesão), agentes, clube e foto. O
país é um seletor com bandeira, nome em português e sigla — `SE` e `SI`, `AR` e `AM`,
`CL` e `CH` são fáceis demais de trocar para ficarem num campo de duas letras. O
over aparece ao vivo enquanto você mexe nos atributos, e há um campo que faz o
caminho inverso — você digita o over alvo e ele reescala os atributos preservando o
perfil da função.

O Editor é permissivo de propósito: montar uma base passa por estados inválidos,
como tirar cinco jogadores de um time antes de colocar outros cinco. Quem cobra a
consistência é a aba Validação, e é ela que libera o botão de escolher clube.

## Retratos gerados

Os escudos e as fotos que você sobe cobrem os clubes e os craques. O resto — as
promessas da base que nascem toda temporada, os agentes livres, os 440 membros de
comissão — vem de um **pacote de retratos sintéticos** montado uma vez.

A fonte é o [SFHQ](https://github.com/SelfishGene/SFHQ-dataset), 425 mil rostos
sintéticos em licença MIT. São gerados por rede neural, **não são fotografias de
pessoas reais**.

### Montar o pacote

O dataset **não vai dentro do projeto**: ele tem dezenas de GB e o `--fonte` aponta
para onde você quiser. Extraia num disco com espaço, monte o pacote, e depois pode
apagar o dataset — o que fica no jogo são os ~13 MB de `assets/rostos/`.

```
py -m pip install pillow numpy
py -m pip install torch --index-url https://download.pytorch.org/whl/cpu
py -m pip install open_clip_torch

py tools/rostos.py --fonte "D:/SFHQ_part4" --conferir
py tools/rostos.py --fonte "D:/SFHQ_part4" --total 2000 --clip
```

O `--conferir` só olha a pasta e diz se a extração veio completa e se dá para usar
`--clip`. Roda em segundos; use antes de gastar o processamento inteiro.

Instalar o torch da roda `cpu` primeiro **não é frescura**: sem isso o pip baixa a
build com CUDA, que passa de 2 GB e não serve para nada aqui — o script só usa o
encoder de texto, em CPU.

O script separa em 16 baldes (4 regiões × jovem/veterano × gênero), aplica o grade
escuro, reduz para 256×256 WebP e escreve `assets/rostos/` mais o manifesto
`data/rostos.js`. Dá **~13 MB** no total.

`--clip` é o que faz o balde ter significado. O SFHQ já traz os vetores CLIP das
imagens calculados, então só falta codificar os textos dos prompts — roda em CPU,
baixando o modelo uma vez. **Sem `--clip` o script funciona**, mas os baldes saem
sorteados e você acaba com coach de 55 anos com cara de 20.

Sem pacote nenhum montado, o jogo desenha o monograma como sempre. Nada quebra.

### Como o rosto é escolhido

`hash(id) % quantidade` dentro do balde da pessoa. Determinístico: o mesmo jogador
tem sempre o mesmo rosto. A consequência a lembrar é que **mudar a contagem de um
balde reembaralha aquele balde inteiro** — congele o pacote e só cresça por append;
para trocar uma imagem, substitua o arquivo mantendo o nome.

A ordem de resolução do retrato é: foto que você subiu → caminho manual → arquivo em
`assets/players/` → rosto do pacote → monograma. Foto real sempre ganha.

### Quem recebe rosto gerado

Em **Configurações › Rostos gerados**, e o padrão é **só fictícios**. A base tem 447
nomes de jogadores reais, e rosto sintético fotorrealista ao lado de um nome real se
lê como foto da pessoa — não é. Jogadores importados de roster real vêm marcados com
`real: true` e ficam de fora por padrão; na prática você sobe a foto de verdade
deles, que é melhor de qualquer jeito.

## Comissão técnica

Cada clube tem cinco cargos, e cada cargo é uma **pessoa**: nome, país, idade,
quatro atributos, contrato, salário e valor de mercado.

| Cargo | O que muda no jogo |
|---|---|
| Head coach | força de jogo e velocidade de evolução do elenco |
| Analista | força de jogo, leitura de mapa |
| Preparador mental | moral semanal do elenco |
| Fisioterapeuta | recuperação de fadiga e duração das lesões |
| Olheiro | chance e teto das promessas da base |

O motor não lê a pessoa: lê um **nível de 1 a 5** derivado do over de quem ocupa a
vaga. **Nível 3 é o ponto neutro** — todo efeito novo é escrito como `(nível−3)×k`,
então uma comissão mediana não muda nada e só o que está acima ou abaixo da média
pesa. Vaga aberta vale 1.

A comissão se move como o elenco: contrata do mercado, compra de outro clube pagando
taxa de liberação, é dispensada com multa. E evolui — aproveitamento e títulos sobem
o over, o potencial é teto de verdade, e depois dos 50 começa a cair. Se você deixar
uma vaga vencer sem renovar, a diretoria põe um interino mediano por um ano e avisa
na sala de imprensa.

## Imagens

Sem arquivo, o jogo desenha um monograma com a cor derivada do nome — nada quebra.

São quatro tipos de arte, cada um com seu formato de normalização:

| Tipo | Chave no pacote | Arquivo em `assets/` | Formato |
|---|---|---|---|
| Escudo de clube | `logo:<tag>` | `assets/logos/<tag>.png` | 256×256 |
| Foto de jogador | `foto:<nick>` | `assets/players/<nick>.png` | 256×256 |
| Arte de torneio | `arte:<id>` | `assets/torneios/<id>.png` | 256×256 |
| Retrato de agente | `agente:<nome>` | `assets/agentes/<nome>.png` | 256×320 |
| Retrato de comissão | `staff:<nome>` | `assets/staff/<nome>.png` | 256×320 |

Para usar imagens de verdade há dois caminhos. O primeiro é o **Editor**: solte um
PNG na aba Imagens e ele entra no *pacote*, um store próprio do IndexedDB, separado
da run. Rodando por `file://` o navegador não pode gravar em `assets/`, então subir
imagem não pode significar gravar arquivo — o pacote é o que torna o upload possível
sem servidor. Toda imagem entra reduzida para 256×256 PNG, e o pacote se exporta e
importa como um `.json` só dele. No lote, o destino sai do nome do arquivo: `sen.png`
vira o escudo da tag SEN, `champions.png` a arte do torneio, `jett.png` o retrato do
agente e `aspas.png` a foto do jogador. A ordem de busca é tag, torneio, agente,
jogador — o primeiro que casar leva.

O segundo é a **pasta**, que continua valendo e tem a mesma convenção de nomes:

| O quê    | Caminho                        | Exemplo                        |
|----------|--------------------------------|--------------------------------|
| Escudo   | `assets/logos/<tag>.png`       | `assets/logos/sen.png`         |
| Foto     | `assets/players/<nick>.png`    | `assets/players/zekken.png`    |

O nome do arquivo usa o slug: minúsculas, sem acento, espaços viram hífen.
`Paper Rex` → tag `PRX` → `prx.png`. Para um caminho fora do padrão, preencha o
campo de imagem no Editor (aceita URL também).

A ordem de resolução é: pacote do Editor → caminho manual → pasta `assets/` →
monograma gerado. Ou seja, se um dia você colocar os arquivos na pasta, é só limpar
o pacote e a resolução cai para lá sozinha.

Recomendação: escudo 256×256 png com fundo transparente, foto 256×256 quadrada.
Trocar o formato padrão é uma linha em `src/data/assets.js` (`ASSETS.ext`).

---

## Elencos de partida

`data/times.js` e `data/elencos.js` vêm da base do vlr.gg, lidos em 28/08/2026:
as **80 organizações** do circuito com a composição franqueada de 2026 e o
**roster real de todas elas** — 447 jogadores.

O que é dado e o que é estimativa:

| Campo | Origem |
|---|---|
| nome e tag do clube | vlr.gg |
| nick e clube do jogador | vlr.gg |
| prestígio do Tier 1 | aproveitamento real de 2026 (últimas 10 partidas de VCT, com encolhimento bayesiano) |
| prestígio do Tier 2 | estimativa |
| função, over, idade, país | estimativa — 81 dos 447 jogadores |

Os endpoints de estatística por jogador do vlr vinham vazios na coleta, então
não há ACS nem rating de onde derivar função e over. Os outros 366 jogadores
entram só com o nick verdadeiro e o resto no piso gerado.

### Formato progressivo

Em `data/elencos.js` só o nick é obrigatório:

```js
['nick']                              // função, over, idade e país gerados
['nick','Função',over]                // idade e país gerados
['nick','Função',over,idade,'PA']     // completo
```

Quem vem só com o nick recebe função na primeira vaga não coberta do time,
over em torno do prestígio, idade entre 19 e 26 e país da região. É o mesmo
tratamento de um jogador gerado, com o nome verdadeiro por cima — dá para
refinar time por time sem nunca ter um número inventado no meio.

Nos times com over informado, os reservas gerados têm teto abaixo do titular
real mais fraco, para que o line-up importado continue sendo o line-up.

### Diferenças de formato em 2026

O circuito real de 2026 não é o que o jogo simula, e isso é proposital — o
calendário do jogo (Kickoff, Masters I e II, Stage 1 e 2, playoffs, Ascension,
Champions) foi mantido. Para referência, no real: cada Stage tem fase de grupos
com as 12 franqueadas, depois Play-Ins com 8 franqueadas mais 4 equipes de
Challengers, depois playoffs de 8. E o Tier 2 não é uma liga de oito por
região: Americas se divide em NA ACE, Brazil e LATAM Norte/Sul; Pacific em
Korea WDG, Japan e Southeast Asia; China em National Tournament e Evolution
Series. As oito de cada região em `times.js` são uma escolha, não um recorte
oficial.

## Importar elencos reais

No Editor, uma linha por jogador, separada por `|`, `;` ou tabulação:

```
TAG | nick | função | over | potencial | idade | país
SEN | zekken   | Duelista    | 88 | 92 | 21 | US
SEN | johnqt   | Iniciador   | 86 | 88 | 24 | MA
PRX | f0rsakeN | Duelista    | 91 | 94 | 22 | ID
```

Só os três primeiros campos são obrigatórios. Renomear time: `SEN = Novo Nome / TAG`.
Linhas iniciadas por `//` são ignoradas. O modo "substituir" limpa o elenco antes
de inserir e completa até cinco jogadores se você colar menos.

O botão **Exportar** devolve todo o mundo nesse mesmo formato — útil para editar
no Excel e recolar.
