# O que dá para decidir hoje, e o que falta

Antes de propor qualquer coisa eu medi uma pergunta só: **das decisões que já
existem, quais mudam o resultado?** Cada linha abaixo é o mesmo confronto
repetido 500 vezes entre dois clubes gêmeos, mudando uma coisa de cada vez.
A ferramenta é `tools/decisoes.mjs`.

> A primeira versão desta medição deu 12,5% para gêmeos em vez de 50%. A
> partida machuca e cansa quem joga, e eu só restaurava um dos lados: em
> duzentas séries o clube A virava um time de lesionados contra um time sempre
> novo, e **toda** decisão aparecia como prejuízo. Os números abaixo são da
> versão consertada, com os dois lados restaurados da mesma foto. Ruído: ±2,2
> pontos.

## O que decide uma partida hoje

| O que muda | Vitórias | Você decide isso? |
|---|---|---|
| Descansado contra exausto | **+44** | não — a fadiga corre sozinha |
| Bom em todo mapa contra ruim em todo mapa | **+44** | não — a afinidade evolui sozinha |
| Na função certa contra fora de posição | **+43** | mais ou menos — o auto-escalar já resolve |
| Forma em alta contra forma em baixa | **+42** | não |
| Moral cheia contra moral no chão | **+30** | não |
| Comissão nível 5 contra nível 1 | **+28** | sim — uma vez por temporada |
| Elenco 8 pontos de over melhor | +30 | sim — no mercado, uma vez por temporada |
| IGL: melhor líder contra o pior | +18 | sim — um clique, uma vez |
| Entrosamento 100 contra 50 | +11 | indireto, pelos scrims |
| Agressividade 5 contra 3 | +1,6 | sim — **e não muda nada** |
| Foco retake contra default | +1,4 | sim — **e não muda nada** |
| Foco execução contra default | −5,6 | sim — **e é pior que não mexer** |
| Foco "certo" contra o "errado" | −7,4 | sim — **e a escolha certa perde** |

Está tudo aí. **As cinco coisas que mais decidem a partida são as cinco que
você não decide.** E a única tela em que você "joga" toda semana — Táticas — é
a que tem o menor efeito de todas: mexer no foco tático é indiferente ou pior
que deixar quieto.

Isso não é opinião sobre o jogo estar chato. É a razão mecânica de ele parecer
que se joga sozinho.

### Por que o foco tático não vale nada
Em `match.js`: `default` dá +0,5 em todo round; `execucao` dá +1,2 só no
ataque; `retake` dá +1,2 só na defesa. Como o mapa inteiro é metade de cada
lado, execução rende +0,6 de média contra os +0,5 do default. A diferença
some no ruído — não existe escolha certa, existe um botão.

### Por que o mapa parece não pesar
Mexer em **um** mapa vale +0,8; ser bom em **todos** vale +44. A diferença é o
veto: ele foge do mapa ruim de cada lado, e o sistema de afinidade que já
existe fica invisível no placar. O veto está funcionando — o que falta é você
participar dele.

## O buraco no calendário

Uma temporada do seu clube, medida:

- **20 séries no ano**, em **16 semanas**
- **36 semanas sem jogo nenhum seu**
- 5 semanas fora de qualquer torneio

Ou seja: em dois terços do ano você aperta AVANÇAR e nada acontece que dependa
de você. O calendário semana a semana resolveu o "pula de campeonato em
campeonato", mas as semanas que ele abriu ainda estão vazias.

---

# O que eu faria, em ordem

Ordenei por quanto muda a sensação de estar jogando, dividido pelo trabalho.
Todas as quatro primeiras usam sistemas que **já existem no motor** — nenhuma
delas é começar do zero.

## 1. Veto de mapa antes de cada série · *o maior ganho, e o mais barato*

Hoje o veto é automático. Ele deveria ser seu: banir, escolher, ver o
adversário banir. É o ritual mais Valorant que existe, acontece **20 vezes por
temporada**, e usa duas coisas que já estão prontas e medidas — a afinidade por
jogador (`mapas.js`) e a preferência do clube (`mapPref`).

O que muda na prática: antes da série você abre a tela de veto, vê o seu
aproveitamento e o do adversário em cada mapa, e escolhe. Uma escolha boa vale
os +44 que hoje o motor decide sozinho.

É a diferença entre "meu time é bom em Ascent" ser um número na ficha e ser uma
decisão que você toma olhando na cara do adversário.

## 2. A semana como decisão · *preenche 36 semanas vazias*

Nas semanas sem jogo, escolher o que o clube faz:

- **Scrim pesado** — sobe entrosamento, cansa (já existe: `tatica.scrim`)
- **Descanso** — derruba fadiga, o maior fator isolado do jogo (+44)
- **Estudo do adversário** — bônus na próxima série contra aquele clube
- **Trabalho de mapa** — melhora a afinidade num mapa específico do elenco
- **Individual** — um jogador escolhido treina um atributo (já existe: `tatica.treino`)

Tudo isso já é lido pelo motor. O que falta é a decisão ser semanal e visível,
em vez de um controle deslizante que você configura em 2026 e esquece.

E é aqui que fadiga, moral e forma — três dos cinco maiores fatores — passam a
ter dono.

## 3. Pedir tempo durante a partida · *a tela ao vivo vira jogo*

A tela ao vivo é bonita e é um vídeo: você assiste. Com um ou dois pedidos de
tempo por mapa, ela vira decisão. Num intervalo você escolhe: mudar a
agressividade, trocar o foco de lado, ou acalmar o time num 3–9.

Isso resolve dois problemas de uma vez: dá o que fazer no momento em que você
está mais ligado, e dá **uma razão para o foco tático existir** — ele passa a
ser uma resposta ao que está acontecendo, não uma preferência que você deixou
marcada em janeiro.

## 4. Conversar com o elenco · *destrava o fator de +30*

Moral vale 30 pontos de vitória e hoje é um número que sobe e desce sozinho.
Um jogador insatisfeito — pouco tempo de jogo, contrato perto do fim, superado
por um reserva — deveria bater na sua porta. E você responde: promete
titularidade, renova, ou banca a briga.

Já existe tudo para isso: `p.moral`, `p.contrato`, a posição no elenco, o
histórico de mapas jogados.

## 5. Consertar o que já tem botão

Antes de acrescentar, fazer as três alavancas atuais valerem alguma coisa:

- **Foco tático** precisa de uma troca de verdade: execução ganha ataque *e
  perde defesa*, retake o contrário. Hoje as duas opções são quase o default.
- **Agressividade** precisa de risco junto com o prêmio — mais pistols e
  retakes ganhos, mais rounds jogados fora no eco.
- **Preferência de mapa do clube** só faz sentido depois do veto interativo.

## Um degrau acima, se quiser ir longe

- **Adversário com identidade**: cada clube com um estilo (agressivo, lento,
  bom em retake) que você lê antes da série e responde no veto e no foco.
  Transforma a preparação em leitura, não em rotina.
- **Objetivos da diretoria durante o ano**, não só no fim: "chegue aos playoffs
  do Stage 1", "venda alguém por mais de 500k", com resposta no meio da
  temporada em vez de um veredito anual.
- **Rivalidade com consequência**: o clássico já existe em `legado.js` com
  intensidade medida — falta ele pesar em moral, torcida e patrocínio.

## O que eu não faria

- **Modo carreira de jogador** e **coletiva de imprensa** — você já descartou os
  dois, e concordo: nenhum dos dois toca nos fatores que decidem partida.
- **Mais telas de número**. O jogo não precisa de mais informação; precisa de
  mais lugares onde a informação vira escolha.
- **Minigames**. A decisão tem que ser de gestão, senão vira outro jogo.

---

## Se fosse escolher uma só

O **veto de mapa**. É a que mais muda a sensação por unidade de trabalho:
acontece 20 vezes por temporada, usa dois sistemas que já estão prontos e
medidos, é o ritual que define o Valorant competitivo, e converte o maior
fator de vitória do jogo — que hoje o motor resolve nas suas costas — numa
decisão sua, com o adversário do outro lado da mesa.
