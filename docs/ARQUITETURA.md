# Decisões de arquitetura

## Sem build, sem dependências

Scripts clássicos carregados em ordem, compartilhando o escopo global.
Motivo: `index.html` abre com duplo clique, sem servidor local e sem `npm install`.
Módulos ES exigiriam servidor (CORS em `file://`), e um bundler exigiria toolchain.

Custo: a ordem de carga importa e está fixada no fim do `index.html`. Não há
imports explícitos, então mover uma função entre arquivos é seguro, mas mover um
arquivo na ordem pode quebrar. `tools/verificar.mjs` lê essa mesma ordem, então o
teste pega regressão de ordenação.

Isso é reversível: quando virar app empacotado (Tauri/Electron), trocar para
módulos ES é mecânico — o código já está separado por responsabilidade.

## Dados em `.js`, não `.json`

`data/mundo.js` e `data/times.js` são arquivos JS que declaram constantes.
`fetch()` de JSON é bloqueado em `file://`, e ler dados é o primeiro passo do boot.
São igualmente editáveis à mão. Se o app passar a rodar sob http, migrar para JSON
é trocar a declaração por um `await fetch`.

## O motor não conhece o DOM

Nada em `src/core/` toca `document`. Por isso `tools/verificar.mjs` consegue montar
um bundle só do núcleo e simular temporadas em Node — é o que garante que
mudanças de balanceamento podem ser medidas em segundos, sem abrir o navegador.

Regra a manter: se uma função precisa de `$`, `render` ou template HTML, ela mora
em `src/ui/`.

## Aleatoriedade determinística

`rng.js` é um xorshift com estado próprio, nunca `Math.random()` dentro do motor.
A semente é salva na run. Consequências: o mesmo mundo é reproduzível, um bug de
simulação é reproduzível, e comparar duas versões de balanceamento na mesma
semente isola o efeito da mudança.

## Armazenamento em camadas

`IndexedDB → localStorage → memória`, detectado no boot e exibido na tela de Runs.
Nenhuma dessas camadas é confiável em todos os contextos (`file://` bloqueia
IndexedDB no Chrome; navegação privada limita localStorage), então o formato
canônico é o arquivo `.vctrun.json` exportável. Uma run inteira dá ~700 KB.

Imagens **não** entram na run. Ficam em `assets/` e são referenciadas por caminho.
Isso mantém o save leve e permite trocar o pacote de imagens sem tocar no save.

## Dois shells, não um app com telas escondidas

Antes o app tinha uma estrutura só: cabeçalho e navegação sempre visíveis, e a
pré-run se virava escondendo itens do menu. Isso misturava coisas de naturezas
diferentes — Editor e Runs dividiam a barra com Elenco e Táticas, e o cabeçalho
mostrava "Caixa —" quando não havia clube.

Agora existem dois shells, e o modo mora numa classe do `<body>`
(`modo-menu` / `modo-jogo`), com o CSS decidindo o que existe em cada um. O HUD só
é montado quando há clube assumido, então nenhuma tela precisa se defender de
`meuTime` nulo. `render()` em `ui/shell.js` é a única porta: ele olha o modo e
despacha.

O custo é que os handlers de conteúdo (`ligarEventos`) valem nos dois shells, então
perguntam a `raizAtual()` onde procurar em vez de assumir `#view`. É uma indireção
pequena que paga o Banco de dados existir nos dois lugares com o mesmo código.

## Imagens enviadas ficam num pacote, não na run

Subir imagem pelo Editor não pode gravar em `assets/`: por `file://` o navegador não
escreve em disco. Então o upload vai para um store próprio do IndexedDB
(`src/data/imagens.js`), chaveado por `logo:<slug da tag>` e `foto:<slug do nick>` —
a mesma convenção da pasta, o que deixa pacote e pasta intercambiáveis.

O pacote fica **fora** da run de propósito, mantendo a decisão de armazenamento em
camadas acima: o save continua na casa de centenas de KB e o pacote de imagens pode
ser trocado sem tocar na partida. Cada imagem entra reduzida para 256×256 PNG, o que
põe o pacote inteiro na casa de poucos MB mesmo com centenas de itens.

O cache é uma `Map` em memória carregada no boot, e isso é obrigatório, não
conveniência: `escudo()` e `retrato()` montam string de HTML na hora e não podem
esperar promessa. A consequência a lembrar é que o IndexedDB é a única camada que
persiste o pacote — sem ele, o Editor avisa e o caminho é exportar o `.json`.

## A comissão virou gente, mas o motor continua lendo número

Staff era três inteiros de 1 a 5 dentro do time, lidos direto por `forcaTime` e
`desenvolver`. Transformar isso em pessoas com nome, contrato e mercado podia ter
virado uma reescrita das fórmulas de partida e de treino — e um risco grande de
mexer no balanceamento sem perceber.

A saída foi manter `t.staff` como o mesmo mapa `cargo → nível`, só que **derivado**:
`atualizarComissao(t)` recalcula o nível a partir do over de quem ocupa a vaga, e o
nível passou a ser contínuo em vez de inteiro. Nenhuma fórmula do motor mudou. O que
mudou foi de onde o número vem.

Duas convenções que caíram junto e vale registrar:

**Nível 3 é o zero.** Efeitos novos (fisioterapeuta na fadiga, olheiro na base) são
escritos como `(nível−3)×k`. Uma comissão mediana não muda nada, então dá para
acrescentar cargo sem deslocar o equilíbrio de quem já jogava.

**Salário de pessoa não pode ter desconto de divisão.** O custeio antigo multiplicava
o custo da comissão por 0,6 no Tier 2. Salário é propriedade de quem trabalha, não do
clube, então esse desconto sumiu — e a primeira versão quebrou o Challengers, que
passou de 2,1k para 8,2k por semana em comissão contra 7k de patrocínio. A correção
foi curva de potência no salário (elite custa muitas vezes o mediano) mais semeadura
mais barata no Tier 2, o que é a explicação real: clube de acesso emprega comissão
pior, e é isso que o mantém viável.

## Uma régua só, em `src/core/padrao.js`

O over de jogador nascia em `world.js`, o da comissão em `staff.js`, e o
potencial tinha três fórmulas que discordavam entre si. Espalhado assim,
mudar a altura de uma divisão exigia caçar constante em três arquivos — e foi
como o Tier 2 acabou com jogador de over 39 ao lado de um Tier 1 de 93.

`padrao.js` concentra as faixas (`FAIXAS`), a conversão prestígio→over
(`overAlvo`), o potencial (`potencialDe`, `potencialStaffDe`), os agentes
(`sortearAgentes`) e a economia derivada delas (`patrocinioDe`). Mudar a régua
do jogo é mudar um objeto no topo desse arquivo.

**Over de jogador de Tier 1 não passa por aqui de propósito.** Aqueles números
são editados à mão e gravados em `data/elencos.js`; a padronização só encosta
em quem está abaixo do piso, que são os reservas gerados.

### Mexer na régua mexe na folha de pagamento

Salário é função de potência do over — quadrática para jogador, cúbica para
comissão. Subir o Tier 2 de over 48 para 74 multiplicou a folha por treze e
colocou 33 dos 80 clubes no vermelho em cinco temporadas. O conserto não foi
apertar salário: foi reconhecer que a origem da curva (`PISO_SALARIO_*`)
significa "nível de reposição", e que ela tem de subir junto com o piso da
divisão. `tools/fin.mjs` mede a razão folha/receita por divisão e é o teste
que impede essa regressão de voltar.

Pelo mesmo motivo o patrocínio deixou de ser só `prestígio × constante` e passou
a acompanhar a força do elenco: com potencial alto os jogadores evoluem, a folha
cresce sozinha, e um clube que só fez dar certo quebrava por isso.

## A receita tem três fontes, de propósito

`prestígio × constante` era uma linha só, e produzia a espiral que aparecia da
sexta temporada em diante: o clube do fundo tinha receita fixa, folha crescendo
com a evolução dos jogadores, e nenhuma alavanca. Aumentar prêmio não resolvia —
prêmio vai para quem ganha, e quem ganha não é quem está quebrando.

`src/core/economia.js` separa a receita em três comportamentos:

| fonte | comportamento | serve para |
|---|---|---|
| aporte da liga | fixo por divisão + parcela por torcida | é o **piso**; impede a espiral |
| patrocínio | marca boa procura clube atraente, e sai quando ele cai | é o **prêmio por jogar bem** |
| premiação | do 1º ao último colocado | faz **participar** valer dinheiro |

Torcida liga as três: cresce com vitória e título, decai sozinha em direção a
uma média da divisão, e entra tanto no aporte quanto na atratividade que decide
qual marca o clube alcança.

A vaga de máster é exclusiva no mundo inteiro e o pacote de um clube é fechado
de uma vez, na ordem máster → secundário → fornecedor, com o nível de cada vaga
limitado pela anterior. Sem isso apareciam clubes com secundário maior que o
máster, que é a primeira coisa que denuncia um gerador.

## O elenco mínimo é garantido por construção

`mercadoIA` só sabia contratar de `G.livres`. Como entravam 12 nomes novos por
temporada contra 40 a 60 aposentadorias, o mercado secava por volta da décima
quinta temporada e apareciam times de Tier 1 com um jogador. Duas mudanças: a
oferta de novos jogadores passou a acompanhar as aposentadorias, e
`garantirElencos()` promove alguém da base quando não há mais ninguém no
mercado. "Elenco entre 5 e 9" deixou de depender de o mercado ter estoque.

## Função é perfil, não rótulo

O over já é a média dos atributos ponderada pela função. Isso significa que
"quanto custa jogar fora de posição" não precisa de tabela: é
`over(p) − overComo(p, outraFuncao)`. E a regra pedida — *um jogador de mira
ruim nunca pode ter Duelista como secundária* — sai de graça, porque Duelista
pesa mira .30 e reflexo .24 e o over desse jogador desaba nessa conta. Uma
constante (`CUSTO_MAX_SECUNDARIA = 6`) no lugar de uma lista de exceções.

Isso só funciona se os atributos tiverem formato. Antes todos nasciam em
`gauss(alvo, 7)` e a normalização puxava os atributos-chave para o over bater:
o resultado era gente quase uniforme, e **100% do mundo qualificava para
qualquer função secundária**. A escultura agora é só para baixo — o atributo
que a função ignora nasce abaixo da média, e a normalização é obrigada a
levantar os que ela usa. Subir os dois lados não funcionava: o ajuste de over
desfazia metade do trabalho. Com o perfil cavado, Controlador→Duelista custa 10
pontos na mediana e só 7% passam; Controlador→Iniciador custa 2 e todos passam,
que é o certo — são funções vizinhas.

## Escalação tem nota, e cobertura tem preço

`autoEscalar` preenchia as quatro funções antes de olhar over, e por isso
escalava um Controlador de 65 na frente de um Duelista de 88. Agora existe
`notaEscalacao()`: soma dos overs efetivos menos `PESO_COBERTURA` por função
descoberta. Cobertura continua valendo, mas passou a ter preço em pontos de
over — 23 pontos ganham dessa conta, 3 pontos não ganham.

O algoritmo parte dos cinco de maior over e faz trocas de melhoria até
estabilizar. A distribuição de funções dentro dos cinco é força bruta honesta:
cinco jogadores e quatro funções é pequeno o bastante para testar tudo.

`p.roleAtual` guarda em que função cada titular vai jogar, e `forcaTime` usa
`overComo(p, p.roleAtual)` em vez de `over(p)`. Sem isso a função secundária
seria almoço grátis e a escalação ótima viraria "os cinco de maior over,
sempre". Saves antigos não têm o campo e caem em `p.role` até o primeiro
`autoEscalar`.

## Tudo vira preço, e por isso o mercado é explicável

`src/core/transferencia.js` tem um modelo só, usado pela sua proposta e pela da
IA. Se um clube da IA não tira o jogador do rival por aquele dinheiro, você
também não tira.

A decisão central foi transformar cada objeção do jogador em **prêmio salarial**
em vez de um "não pode":

| o que desagrada | vira |
|---|---|
| cair de divisão | ×1.55 |
| clube mais fraco | ×(1 + 1.4% por ponto de nível perdido) |
| entrar como reserva | até ×1.52, pela posição no elenco |
| mudar de região | ×1.10 × dificuldade do destino |
| ir para a China | a maior dificuldade: ×1.26 |
| ser jovem indo para clube grande | ×0.93 (troca dinheiro por projeto) |
| ser veterano | ×1.06 |

Com o mesmo jogador brasileiro e um clube **idêntico** em cada região, o pedido
sai 6.300 em casa, 7.200 na Europa, 7.700 no Pacífico, 8.700 na China — e
11.100 para um clube da mesma região no Tier 2. Cair de divisão dói mais do que
qualquer mudança de continente, que é como funciona.

O ganho não é o realismo em si: é que a resposta nunca é um "não" opaco. É
sempre "não por esse valor", e a interface consegue mostrar a conta linha a
linha. Só duas recusas não são compráveis, e as duas são de ambição:
um titular de elite no auge não desce de divisão, e ninguém vai para um clube
muito pior **e** para o banco ao mesmo tempo.

A região natal sai do país do jogador, não do clube atual: um brasileiro que
joga na Europa continua sendo brasileiro na hora de decidir para onde vai.

### O teto de folha existe para não desfazer a economia

`mercadoTransferencias()` só gasta dentro de `folgaSalarial()` — 66% da receita
anual. Sem esse teto a IA compraria até quebrar e a espiral do item 3 voltaria
pela porta dos fundos. Cada clube fecha no máximo dois negócios por virada,
senão um clube rico esvazia o mercado sozinho.

## Variância: o round é sorte, o dia é consistência

O ruído da partida estava todo por round, com desvio saindo de
`(212 − consA − consB) / 6.5`. Medido antes de mexer: variar a consistência de
40 para 95 mudava esse desvio de 20.3 para 5.0 — quatro vezes — e a vitória do
favorito ia de 77.1% para 80.7%. **Três pontos.** Ruído por round é simétrico e
some na média de vinte e tantos rounds, então o atributo custava o mesmo que
qualquer outro no over e não entregava quase nada.

A separação atual tem dois níveis:

- `RUIDO_ROUND` é fixo e igual para todos — é o que o round tem de sorte.
- `desvioDoDia(t)` sorteia um deslocamento **uma vez por mapa**, e é aqui que a
  consistência entra. Dia ruim não se anula: contamina o mapa inteiro.

Depois da mudança, a mesma variação de consistência move a vitória do favorito
de 69.9% para 82.3%, e a curva de over→vitória ficou onde estava (+10 de over
continua valendo ~78% de mapas).

## Carreira longa exige declínio real

Esticar só a aposentadoria não funcionou: com carreiras até os 40, metade dos
titulares do circuito passou dos 30 **com over acima da média da liga**, e os
garotos não achavam vaga. Faltavam duas peças.

A primeira é o declínio de verdade. O que cai primeiro é físico — reflexo, mira,
movimentação — mas tudo cai um pouco, senão um Controlador nunca envelhece.

A segunda é que a aposentadoria não é só idade. `chanceAposentadoria()` soma a
curva etária com **quanto o jogador caiu do próprio pico** (`p.pico`) e com estar
sem clube, os dois com peso que só entra a partir dos 29. Quem se mantém bom joga
até os 38–40; quem cai sai antes — que é como o esporte funciona. Resultado
medido: p10 aos 29, mediana aos 34, p90 aos 37, teto em 42.

## A partida ao vivo é leitura, não simulação

A simulação sempre foi round a round; o que faltava era revelar em sequência.
Duas regras seguram o recurso:

**A partida já aconteceu.** `partidaAoVivo()` lê `res.mapas[].hist` e não decide
nada. Por isso pular é seguro, está sempre à mão, e assistir não pode mudar o
campeonato.

**A narração não chama `rnd()`.** O gerador é o do motor, semeado — usá-lo para
escolher uma variante de frase adiantaria o fluxo e a partida seguinte mudaria
só porque você assistiu a esta. É o pior tipo de bug: some quando você desliga a
tela para investigar. As variantes são escolhidas por `(round, placar)`, e há um
teste que lê o código-fonte da narração procurando por `rnd(`.

O ritmo vem de `pesoDoRound()`: pistol, match point, clutch, prorrogação e o
round que fecha o mapa seguram mais tempo na tela. Relógio constante vira barra
de progresso — o que prende é a tela desacelerar quando o jogo aperta.

Quem sabe que o mapa acabou é a **posição na lista**, não o número: chegar a 13
não encerra nada se a diferença for de um round, e anunciar por número dava
"mapa deles" no 12–13 com o mapa seguindo até 14.

## Dois papéis, e a diferença não é cosmética

`TREINADOR` responde à diretoria: recebe metas todo ano, é avaliado no fim e
pode ser demitido. `DIRETORIA` não responde a ninguém — sem meta, sem cobrança,
sem demissão. É o modo livre.

As metas são de propósito simples (posição na liga, mais um alvo de bônus).
Meta complicada vira planilha, e ninguém joga um manager para conferir planilha.

Duas travas vieram de rodar `tools/carreira.mjs`, que simula uma carreira
inteira — sem ela, "metas simples" seria uma frase sem verificação:

- **o alvo nunca é `n-1`**, senão terminar em ÚLTIMO cumpre a meta. Aconteceu:
  "entre os 9 primeiros" numa liga de 8 times era cumprida em oitavo, porque o
  clube foi rebaixado depois de a meta ser escrita;
- **o alvo nunca é 1** numa liga de quatro ou mais. Exigir o título todo ano de
  um clube médio é demissão marcada, não meta.

Quando acesso ou rebaixamento mudam o tamanho da liga entre a definição da meta
e a avaliação, o alvo é **reescalado** em vez de herdar um número que já não faz
sentido, e o reajuste aparece no veredito.

A confiança se move pela DISTÂNCIA da meta, não por acertou/errou: ficar uma
posição fora não pode custar o mesmo que ficar dez. E a demissão sempre deixa
uma porta aberta — uma lista de ofertas vazia encerrava a carreira sem aviso,
o que não é consequência de duas temporadas ruins, é um beco sem saída da regra
de teto de prestígio.

## Mapa é do jogador, não só do clube

Antes só o time tinha `mapPref`, o que é meio time: no cenário real quem gosta
de Icebox é uma pessoa, e é a soma dos cinco que faz o clube ser bom lá.

`p.mapas` nasce **sorteado** — não existe dado real de mapa por jogador, e
inventar um número "informado" seria pior do que assumir o sorteio — com poucos
mapas de opinião forte e o resto perto de zero. Um jogador que ama ou odeia doze
mapas não tem identidade nenhuma.

Depois a afinidade **evolui**: sobe onde ele rendeu acima do próprio normal e
cai onde rendeu abaixo. A régua é o desempenho dele contra ele mesmo, não contra
a liga — comparar com a média puniria quem é ruim por ser ruim, e a afinidade
deixaria de falar sobre o mapa.

Na força do time os dois pesam metade cada (`clube × 0.6 + elenco × 0.6`), para
o mapa não passar a dominar a partida de repente. O pick/ban também olha o
elenco: escolher um mapa que o clube ama e os jogadores odeiam era exatamente o
tipo de decisão que só a preferência do clube conseguia produzir.

Medido com elencos gêmeos em `tools/afinidade.mjs` — mesmo elenco, mesma
comissão, só a afinidade diferindo: correlação de **0.73** entre afinidade e
vitória, com a taxa indo de 40% no pior mapa a 50% no melhor. Inclina sem
decidir.

## Catálogo de torneios fora do calendário

`montarCalendario()` roda toda temporada e joga fora os stages do ano anterior. Se
nome e arte de competição morassem no stage, eles morreriam junto — renomear o
Champions duraria até 31 de dezembro.

Por isso existe `G.torneios`: 43 entradas com chave estável (`champions`,
`kickoff_AMER`, `asc_PAC`), criadas no `criarMundo` e carregadas por padrão em runs
antigas. O stage guarda só `torneioId`, e a UI pergunta o nome ao catálogo via
`nomeStage(s)` — o que faz um rename valer na hora, inclusive no stage em disputa.

A premiação seguiu o mesmo caminho: o catálogo guarda quanto o campeão leva, a curva
das demais colocações continua por categoria em `core/competition.js`, e
`premiosDoStage()` junta as duas. `PREMIOS` virou tabela de referência, usada só
como padrão. O ganho é que editar o prêmio de um torneio no Banco de dados muda de
verdade o dinheiro que entra no circuito, em vez de ser um número decorativo.

## O Editor é permissivo, a validação é que cobra

Montar uma base passa por estados inválidos: tirar cinco jogadores de um time antes
de colocar outros cinco deixa o elenco abaixo do mínimo por alguns cliques. Travar
cada operação individualmente tornaria o Editor insuportável, e deixar a run começar
assim gera erro no meio da temporada, longe da causa.

A saída é separar as duas coisas: `core/editar.js` aceita quase tudo e `edValidar()`
é a porta. Ela devolve erros e avisos, a aba Validação mostra, e `telaNovoJogo()` se
recusa a abrir enquanto houver erro. Mover jogador no Editor também não é
transferência: não mexe em caixa, moral nem contrato, diferente de `contratar()` em
`core/market.js`. São operações de banco de dados que por acaso agem sobre o mesmo
estado.

## Pré-run

Uma run só existe de verdade quando um clube é assumido. Antes disso `meuTime` é
`null`, o Avançar fica travado e só Editor e Runs aparecem. Isso resolve o problema
de editar elencos com a temporada já rodando — depois do primeiro Avançar, editar
overs vira trapaça e não estado inicial.
