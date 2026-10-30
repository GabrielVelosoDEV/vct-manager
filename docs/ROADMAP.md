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
