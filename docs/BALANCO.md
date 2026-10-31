# Balanço de longo prazo

Medição de 20 temporadas (2027 a 2046, semente 20260828) feita no bloco F,
depois de todas as mecânicas no lugar. Substitui `analise-atual.md`,
`analise-jogabilidade.md` e `plano-jogabilidade.md`, que descreviam versões
antigas do jogo.

Para refazer: `node tools/verificar.mjs 20`, `node tools/caixa.mjs 20`,
`node tools/idades.mjs 20`, `node tools/geracoes.mjs 20`,
`node tools/carreira.mjs SEN 20` e
`node tools/decisoes.mjs`.

## O que estava errado

| Medida | Antes | Depois |
|---|---|---|
| Over médio dos titulares do Tier 1 em 2046 | 79 (era 84 em 2027) | 84 |
| Melhor jogador do mundo em 2046 | 89 (era 95) | 95 a 98 |
| Caixa do Tier 1: mediana / p90 / máximo | 5,0 / 21,7 / 30,0 mi | 2,7 / 10,6 / 13,1 mi |
| Agentes livres em 2045 | 151, metade com over 84+ | 57, quase nenhum 84+ |
| Jogadores no mundo | 729 | 639 |
| Tamanho do save | 2,6 MB | 2,2 MB |

### A geração nova nunca ficava pronta
- O plano de treino da IA escolhia o atributo pela conta "mais fraco pelo
  peso" (at/w), que aponta a mira do Duelista mesmo com a mira em 99. Todo o
  treino ia para o teto, e o regen empacava aos 20 anos com 74 de over e
  potencial 88. Agora a IA treina o atributo que mais rende over: peso na
  função vezes o espaço até 99 (`planoIA` em `core/treino.js`).
- Com isso corrigido, a promessa de emergência da IA nascia forte demais:
  academia 5 (que todo clube de Tier 1 tem cedo) dava garoto no piso da
  divisão e potencial 99. Academia e olheiro agora mexem pouco, e o teto de
  potencial é 96, igual ao da base do jogador (`core/offseason.js`).

### O dinheiro parava no topo
- **Índice salarial do Tier 1** (`core/economia.js`): na virada, se a mediana
  do Tier 1 guarda mais de 1,5 ano de receita, o salário pedido no Tier 1
  sobe (até 8% por ano); se aperta, cede (até 5%). O Challengers fica fora.
  Notícia na aba Mercado quando muda 2% ou mais.
- **Clube rico paga mais** (`fatorRiqueza`): acima de três anos de receita
  no caixa, cada ano a mais encarece o salário em 10%, até 60%. Aparece como
  linha própria no pedido de contratação e de renovação.
- **Metade do prêmio é dos jogadores** (`pagar` em `core/competition.js`):
  era o que enchia o caixa de quem ganhava Masters e Champions. O bônus dá um
  pouco de moral ao elenco.

### O mercado entupia
- Quem está sem clube baixa o pedido: 0,8% por semana, até 40%
  (`descontoSemClube` em `core/player.js`). O veterano de 84 que não renovou
  deixa de ficar parado pedindo salário cheio.
- A reposição de regens na virada perdeu a folga ("+6" e piso de 14 viraram
  piso de 10), o teto de agentes livres caiu de 170 para 120 e o confronto
  direto guarda os 6 jogos mais recentes por par em vez de 12.

## O que foi conferido e ficou como estava
- **Carreira de treinador sem decisões** (`carreira.mjs SEN 20`): duas
  demissões em 20 temporadas, com ofertas de emprego nas duas.
- **Idades**: aposentadoria com mediana de 36 anos (p10 33, p90 38), o alvo
  de carreira longa definido antes.
- **Nenhum clube no vermelho** em nenhuma temporada, e `verificar.mjs` sem
  inconsistência.
- **Decisões** (`decisoes.mjs`): os pesos de tática, elenco e comissão não
  mudaram, porque o motor de partida não foi tocado
  (`motor.mjs conferir` idêntico).
