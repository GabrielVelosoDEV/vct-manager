# Roadmap

## Feito

- Motor de partida: veto de mapas, round a round com troca de lado e prorrogação,
  economia com bônus de derrota, box score com ACS/K/D/A/FK/clutch/MVP
- Circuito completo: Kickoff, Masters I e II, Stage 1 e 2, playoffs regionais,
  Challengers, Ascension com acesso e rebaixamento, Champions por pontos
- Gestão: escalação, IGL, agressividade, foco tático, scrims, bloco de treino,
  comissão técnica e estrutura com upgrades
- Mercado com proposta em três variáveis e recusa justificada; IA que preenche vagas
- Evolução por potencial, envelhecimento, aposentadoria, base revelando promessas
- Editor de times e elencos + importador/exportador em massa
- Runs: salvar, carregar, apagar, exportar e importar `.json`
- Escudos e fotos com fallback gerado
- **Base do vlr.gg**: as 80 organizações com a composição de 2026 e o roster real
  de todas elas; prestígio do Tier 1 calibrado por aproveitamento
- **Formato progressivo de elenco**: linha com só o nick é válida, o motor completa
  o resto como se o jogador fosse gerado
- **Todos os mapas sempre em rotação**, com veto banindo até sobrar um decider
- **Premiação como escada única** derivada da importância do torneio (`PESO_EVENTO`)
- **Editor completo**: seis abas, transferência entre clubes e para Sem clube, ficha
  de jogador com os oito atributos, edição integral de time, busca global, upload de
  imagem em pacote próprio e aba de validação que libera o início da run
- **Teste de interface** (`tools/testar-ui.mjs`): o `dist` roda num DOM e todas as
  telas e abas são renderizadas e clicadas fora do navegador
- **Identidade visual e HUD**: tema escuro com a paleta do Valorant, menu principal
  separado do jogo, sidebar com ícones e grupos, topbar com histórico e avanço
  rápido, faixa do circuito na Central, medidores e radar na ficha do jogador
- **Configurações**: preferências de partida e interface, guardadas fora da run
- **Catálogo de torneios**: 43 competições com nome, arte e prêmio editáveis, e a
  premiação do circuito passando por ele
- **Catálogo de agentes**: lista da run, com retrato e função editáveis
- **Seletor de país** com bandeira, nome em português e sigla, em vez do campo de
  duas letras
- **Comissão técnica como pessoas**: cinco cargos, atributos, contrato, salário,
  mercado próprio com taxa de liberação, evolução por resultado e aposentadoria
- **Captura de telas** (`tools/telas.mjs`): PNG de cada tela pelo Chromium

## Feito depois da última revisão

- **Padronização de over e potencial** (`src/core/padrao.js`): faixas por divisão,
  potencial proporcional à idade, três agentes da função por jogador, e o botão
  que leva o save editado de volta para `data/elencos.js`
- **Economia em três fontes** (`src/core/economia.js`): patrocinadores com
  catálogo global e três vagas por clube, torcida, aporte de liga como piso, e
  premiação chegando ao último colocado. A espiral do sexto ano acabou
- **Função secundária e escalação por força**: `overComo()` dá o custo de jogar
  fora de posição, e é ele que impede um jogador de mira ruim de virar Duelista
- **Mercado de transferências nos dois sentidos** (`src/core/transferencia.js`):
  um modelo só para você e para a IA, com cada objeção do jogador virando prêmio
  salarial — divisão, qualidade do clube, minutos, região, idade
- **Variância separada em round e dia**: consistência passou a valer 12 pontos
  percentuais de vitória em vez de 3
- **Carreira até 35–40 anos**, com declínio real e aposentadoria por rendimento
- **Fontes embutidas** (`src/ui/fontes.css`, gerado por `tools/fontes.mjs`):
  201 KB de base64, não os "alguns MB" que esta lista temia

- **Enredo das franquias**: pré-história real de 2021 a 2025, confronto direto,
  rivalidades derivadas do histórico e a tela Clube › História
- **Parser do vlr.gg**: cola a página do time e gera as linhas do importador,
  com prévia obrigatória e sem inventar função, over ou país

- **Partida ao vivo**: revela round a round, com ritmo que desacelera nos
  momentos que pesam e narração com nome de quem abriu cada round

- **Papel do manager**: treinador (com metas e demissão) ou diretoria (modo
  livre), nome próprio, veredito de fim de temporada e recolocação depois de cair

- **Afinidade de mapa por jogador**: sorteada no início e evoluindo com o
  desempenho, pesando na força do time e no pick/ban

- **Picks e bans completos**: quem não escolheu o mapa escolhe o lado de início
  (no decider, quem não fez o último ban), e a pré-partida ganhou a etapa de
  comps da série, com a comp provável do adversário ao lado
- **Mix e Veto** no catálogo de agentes (Controlador e Sentinela)
- **Diálogo do próprio jogo** no lugar de `alert` e `confirm`
- **Renovação negociada** (`src/core/renovacao.js`): pedido explicado por moral,
  minutos, promessa quebrada, mercado e fase da carreira; duração preferida;
  três propostas baixas e ele fecha a conversa por oito semanas
- **Pedido de tempo com escolha**: acalmar, partir para cima, jogar travado ou
  trocar o foco até o fim do mapa; a comissão pede tempo sozinha depois de
  quatro rounds perdidos em sequência, para todo clube que você não conduz
- **Cobrança do meio do ano**: na abertura da janela do meio do ano a diretoria
  confere a posição parcial e uma meta de gestão (minutos para a promessa da
  casa, ou contas em dia), mexe na confiança e pode demitir ali mesmo
- **Prêmios da temporada** (`src/core/premios.js`): MVP do ano, MVP de cada
  região, seleção do ano (um por função e um flex), revelação, IGL e treinador
  do ano, eleitos na virada pelo palco de cada torneio e comparando ACS e K/D
  com a própria função; tela Circuito › Prêmios com a galeria ano a ano
- **Carreira na ficha**: mapas, K/D, ACS, MVPs, títulos, títulos internacionais
  e prêmios somados desde o primeiro mapa; temporadas com mais de cinco anos
  ficam resumidas no save
- **Hall da Fama**: quem se aposenta com prêmios, títulos internacionais e
  carreira longa fica guardado com o resumo, em vez de sumir do save
- **Categoria de base** (`src/core/academia.js`): o seu clube tem de três a
  sete garotos de 15 a 19 anos fora do elenco, que crescem com a academia e o
  head coach; promover, dispensar e escolher a função que o olheiro procura;
  quem faz 20 sem subir vai para o mercado; lista de revelados pela casa. Os
  clubes da IA ficam com a versão resumida
- **Notícias com categoria**: cada notícia é do seu clube, mercado,
  competições, meta e mapas ou carreira; abas na tela, destaque do que é seu,
  nome do jogador como link para a ficha e manchete da semana na Central
- **Dificuldade** (`src/core/dificuldade.js`): fácil, normal ou difícil na
  carreira nova, mexendo no caixa inicial, na confiança e na cobrança da
  diretoria, na meta de posição e no salário que o jogador pede de você. O
  motor e a IA não mudam
- **Primeira temporada guiada** (`src/ui/guia.js`): dica no topo de cada tela
  na primeira visita e primeiros passos na Central, desligável nas
  Configurações
- **Histórico de 2026 e carreira em 2027**: os 15 títulos reais de 2026
  (Kickoffs, Stages, Masters Santiago, Masters Londres e Champions Xangai,
  com vice, do vlr.gg) entram na pré-história, e a carreira começa em 2027
  com os elencos de 2026
- **Balanço de longo prazo** (`docs/BALANCO.md`): a IA deixou de treinar
  atributo já em 99 (a geração nova empacava e o Tier 1 enfraquecia), índice
  salarial do Tier 1, clube rico paga mais, metade do prêmio vai aos
  jogadores, agente livre parado baixa o pedido e o save ficou menor
- **Clássico com consequência**: vencer o rival levanta o vestiário e a
  torcida, perder pesa, na proporção da nota de rivalidade

- **Nenhum jogo seu sem veto** (pacote 1): a semana é montada antes de a tela
  perguntar pelo seu jogo (`prepararSemana`), então o primeiro jogo de cada
  torneio passa pelo relatório e pelo veto; semana com duas rodadas para entre
  elas quando a segunda tem jogo seu; o avanço rápido para na véspera. Em duas
  temporadas do SEN, 12 de 32 jogos eram simulados sem veto; agora nenhum, e o
  `verificar.mjs` acusa se voltar. A Central mostra a tabela do torneio em
  disputa, Kickoff incluído.

- **Identidade do circuito** (pacote 2): Masters e Champions com sede sorteada
  por ano entre 60 cidades e o nome dela ("Masters Osaka"); arte dos mapas no
  veto e na transmissão; faixa da cidade e troféu do campeão no torneio;
  troféus na galeria do clube e nos prêmios; cidades editáveis no Banco de
  dados. Título passou a ser do evento: ninguém mais é "campeão dos playoffs".

- **Janela em turnos de dois dias** (pacote 6): com a janela aberta cada
  Avançar move dois dias (seg–ter, qua–qui, sex–dom); o mercado anda em cada
  turno com um terço da chance semanal, então o volume da semana é o mesmo e
  você tem três momentos para reagir. Topbar com a data do turno e a contagem
  de dias até a janela fechar; aviso de reta final no Mercado; o avanço rápido
  para no turno em que chega proposta por alguém seu. Desligável em
  Configurações. Sem turnos, o mercado faz exatamente o que fazia.

- **Vestiário: mental, desgaste e entrosamento** (pacote 9): confiança nova
  por jogador (sobe ganhando e jogando acima do próprio normal, cai perdendo,
  com sequência e decisão pesando mais, amortecida pelo preparador mental e
  pelo IGL); desgaste passou a pesar até 8% (era 22%) e o mental até 22%;
  lesão rara e curta; entrosamento por dupla de jogadores, com convivência,
  scrims, jogos, função disputada, insatisfação, desigualdade salarial e
  atividades da semana (bootcamp, ranked em duo, stream, jantar, sessão com o
  preparador, folga); tela Clube › Vestiário. Medido em `decisoes.mjs`:
  confiança de quem ganha contra quem perde +24 pontos, desgaste leve contra
  maratona +13 (era +34).

- **Treinamento & Preparação** (pacote 8): Táticas, Treino e Comps numa tela
  só, com quatro abas; preparo de 0 a 100 por mapa feito dos termos que o
  motor usa (clube, elenco, comp, tática), com tendência das últimas semanas
  e o preparo do próximo adversário quando o analista enxerga; até três mapas
  de treino por semana com prioridade (5 : 3 : 2, ganho total 100/115/130%),
  e a IA com a mesma regra; tática por mapa (agressividade e foco), valendo
  desde o primeiro round e com o pedido de tempo por cima.

- **Competições** (pacote 3): hub da temporada com linha do tempo do ano em
  três faixas (internacional, VCT, Challengers), semana atual marcada e
  campeão internacional na barra; torneios em disputa, a seguir e
  encerrados, com filtros; página de cada torneio (capa com sede, troféu e
  campeão; chave e tabelas; jogos por rodada; estatísticas do torneio e
  mapas mais jogados; premiação por colocação); ficha de qualquer série
  com veto, placar e lado de cada mapa e a linha dos dez jogadores. A ficha
  fica enxuta no save (≈380 KB no fim do ano) e a linha dos jogadores só
  nas séries do seu clube, internacionais e de playoffs.

- **Estatísticas do mundo e História do clube** (pacote 4): Líderes virou
  Circuito › Estatísticas, com visão geral (internacionais do ano, melhor
  jogador da temporada, clube em melhor fase, top 5), líderes com filtro de
  temporada/carreira, região e função, galeria de títulos de 2021 até hoje
  que se atualiza a cada título, recordes (maior over, maior transferência,
  mais títulos por clube e por jogador, Champions, Masters, carreira mais
  longa, vices) e ranking mundial por rating de resultado, com variação e
  evolução de doze meses. A História ficou só do clube: linha do tempo por
  temporada (posição, campanha, internacional, títulos, elenco, técnico,
  acesso e rebaixamento), títulos reais de antes da carreira, lendas,
  Hall da Fama e revelados da casa.

- **Prêmios com nova régua** (pacote 5): a nota de cada prêmio soma duas
  metades medidas em desvios dos candidatos — desempenho (rendimento contra
  a função, K/D, MVPs de mapa, volume) e conquistas (títulos, finais e
  campanha internacional, Champions acima de Masters acima de liga, na
  proporção dos mapas jogados). MVP do ano 60/40 e só para quem chegou a
  uma final internacional, a não ser numa temporada fora da curva
  (desempenho 0,55 desvio acima do segundo melhor); seleção 70/30, MVP
  regional 75/25, revelação só desempenho. Medido em 50 temporadas com
  `tools/premios.mjs`: MVP de campeão internacional foi de 28% para 86%,
  fora da curva em 6% dos anos. Tela nova: MVP em carta grande com números,
  percentis e o que pesou, pódio dos mais votados com a diferença de nota,
  seleção desenhada em cinco cartas, pódios curtos de revelação e
  regionais, navegação entre anos.

## Próximo
2. **Empacotar em Tauri** — só quando o jogo estiver polido.
3. **2026 no histórico** — quando a temporada real terminar, acrescentar Masters
   Santiago, Masters London e Champions Shanghai em `data/historia.js`.

### Descartados por decisão

- **Coletiva de imprensa afetando moral**: quase não acontece na vida real.
- **Modo carreira de jogador**: fora do escopo do jogo.

### Descartados por decisão

- **Buscar imagens automaticamente**: as imagens relevantes já foram enviadas à mão.
- **Game Changers como circuito paralelo**: fora de escopo por agora.

## Ideias sem prioridade

- Objetivos de diretoria e demissão
- Coletiva de imprensa afetando moral
- Histórico de confrontos diretos e rivalidades
- Estatística de mapa por jogador (afinidade individual, não só do time)
- Modo "carreira de jogador"
