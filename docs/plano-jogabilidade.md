# Plano: a semana de trabalho, o mapa e o meta de agentes

Desenho de implementação. Cada peça se encaixa em algo que já existe no motor,
e todo número aqui é **ponto de partida para medir**, não verdade — do mesmo
jeito que fizemos com a comissão e com a economia.

Inventário do que já está pronto e hoje quase não é usado:

| Já existe | Onde | Uso hoje |
|---|---|---|
| `p.mapas` — afinidade por mapa, −8 a +8 | `core/mapas.js` | evolui sozinha jogando |
| `p.agentes` — 3 agentes da função | `core/player.js` | **decorativo, nada lê** |
| `G.mapasAtivos` | `core/world.js` | recebe os 12 mapas, ou seja, não filtra nada |
| `t.tatica.treino` — foco de atributo | `core/clock.js` | um seletor que você marca em 2026 e esquece |
| `AGENTS` — 26 agentes por função | `data/mundo.js` | só para sortear os 3 |

Três dessas cinco linhas são sistema pronto sem consequência. É de lá que sai a
maior parte do trabalho abaixo.

---

## 1. A semana de trabalho

Hoje o desenvolvimento vem de um seletor permanente. Passa a vir **do que você
escolhe naquela semana**. É a mudança central: 36 semanas sem jogo deixam de
ser tempo morto e passam a ser onde o time é construído.

```js
t.plano = {
  equipe:  {tipo:'mapa', alvo:'Ascent'},   // uma escolha de time por semana
  individual: {jogador:'p_412', tipo:'agente', alvo:'Viper'}  // uma escolha só sua
}
```

**Opções de time**, todas já legíveis pelo motor:

| Plano | O que faz | Custo |
|---|---|---|
| Mira / Utilidade / Tática / Mental | cresce o par de atributos (já existe) | nada cresce mais |
| **Mapa X** | sobe a afinidade do elenco naquele mapa | idem |
| **Agente X** | o elenco aprende aquele agente | idem |
| Scrim pesado | entrosamento +1,2 · fadiga +0,08 | cansa, e cansaço vale −44 |
| Descanso | fadiga −0,14 · moral +0,03 | ninguém evolui essa semana |
| Estudo do adversário | +2,5 de força na próxima série contra ele | idem |

**Mais um slot individual**: um jogador escolhido treina um atributo ou um
agente ao dobro do ritmo. É o lugar de puxar uma promessa, ou de fazer o
veterano aprender o Controlador que o meta pediu.

Duas decisões por semana, ~36 semanas: 72 escolhas por temporada, contra as
zero de hoje. E a regra que dá peso a todas elas é uma só: **quem descansa não
evolui, quem evolui não descansa.** A fadiga é o maior fator de vitória do jogo
(+44) e o treino é o que constrói a temporada seguinte. Escolher entre ganhar
agora e ganhar depois é a decisão que faltava.

Onde muda: `desenvolver()` em `core/clock.js` passa a ler `t.plano` em vez de
`t.tatica.treino`. A IA escolhe plano por prioridade simples (elenco cansado
descansa, elenco novo treina atributo, véspera de série grande estuda).

## 2. Treino de mapa, um por um

`p.mapas[mapa]` já guarda −8 a +8 por jogador. O que falta é você mexer nele, e
um custo que impeça ser bom em tudo.

- **Uma semana de mapa** sobe a afinidade de cada titular naquele mapa em
  ~+0,9, com retorno decrescente: perto de +8 quase não sobe mais.
- **Mapa esquecido escorrega.** Todo mapa que não é treinado nem jogado anda
  ~0,06 por semana na direção do zero. Numa temporada isso é ~3 pontos — o
  bastante para você não conseguir manter doze mapas de pé.
- **Só 7 mapas ativos por temporada**, e não os 12. `G.mapasAtivos` já existe
  para isso e hoje recebe o pool inteiro. Sete é o número real da VCT, e é ele
  que torna o orçamento de treino uma decisão em vez de uma planilha.

O resultado é o que os times reais fazem: você constrói um **pool de 4 ou 5
mapas** que domina e aprende a evitar o resto. E é isso que dá conteúdo ao veto.

Tela: os 7 mapas ativos em linha, com a afinidade do seu elenco, quantas séries
você jogou em cada um, o aproveitamento, e — na semana anterior a uma série — o
que o **adversário** é bom e ruim.

## 3. O meta de agentes

Aqui `p.agentes` sai de decorativo para o centro do jogo.

### Os dados

```js
G.meta = {
  versao:'2026.2', patch:2,
  pesos:{ Jett:1.14, Raze:0.92, Sova:1.08, Viper:1.20, ... }   // 0.80 a 1.25
}
p.agentes     = ['Jett','Raze','Neon']        // os mains, como hoje
p.agenteNivel = { Jett:88, Raze:71, Neon:64, Yoru:12, Iso:0 }  // 0 a 100
```

Main começa entre 70 e 95. O resto da função começa entre 0 e 25. Fora da
função, mais baixo ainda.

### Como pesa na partida

Cada titular entra com um agente. Por padrão o motor escolhe a melhor
combinação de familiaridade × meta; você pode fixar à mão.

```
bônus do jogador = (peso_meta[agente] − 1) · K_META
                 + ((nivel[agente] − 60) / 100) · K_FAMILIAR
```

Com `K_META ≈ 14` e `K_FAMILIAR ≈ 10`, os três cenários que interessam:

| Situação | Meta | Familiaridade | Efeito |
|---|---|---|---|
| Agente forte que ele domina | +1,20 | 90 | **+5,8** |
| Agente forte que ele não sabe jogar | +1,20 | 10 | **−2,2** |
| Main dele, fora do meta | +0,85 | 90 | **+0,9** |
| Main fora do meta e enferrujado | +0,85 | 45 | **−3,6** |

É exatamente o que você descreveu: **subir no meta com quem não sabe jogar é
pior que ficar no conforto.** Ir contra o meta é viável — e é uma estratégia,
não um erro — enquanto a sua familiaridade for alta.

### Como se aprende

- **Jogando**: +0,6 de nível por mapa disputado com aquele agente.
- **Treinando**: +2,5 por semana de plano `agente`, +5 se for o slot individual.
- **Teto por aptidão**: o nível máximo que ele alcança num agente depende dos
  atributos que aquele agente cobra. Um jogador de utilidade fraca nunca vira
  um Viper de 90. Isso impede "todo mundo aprende tudo" e explica por que times
  reais contratam em vez de retreinar.
- **Enferrujando**: agente sem uso perde ~0,25 por semana.

Aprender um agente do zero até 70 leva algo como **12 a 15 semanas** de treino.
Numa temporada de 36 semanas livres, isso significa aprender **dois** agentes
novos — se você não estiver treinando mapa, nem atributo, nem descansando.
É o orçamento que faz a escolha doer.

### O patch

Três vezes por temporada (semanas ~10, ~24, ~38) a Riot mexe: dois ou três
agentes sobem, dois ou três descem. Vira notícia com o nome da versão, e a tela
de meta mostra o antes e o depois.

Você reage de três jeitos, e todos são legítimos:
1. **Correr atrás** — treinar o agente que subiu, pagando semanas.
2. **Ficar** — segurar o conforto e aceitar o desconto do meta.
3. **Comprar** — pegar no mercado alguém que já é main daquele agente. Isso dá
   ao mercado uma razão nova para existir: você não compra mais over, compra
   **um perfil de agente**.

Esse terceiro caminho é o que amarra o meta ao resto do jogo.

---

## 4. O veto de mapa

Antes de cada série: sete mapas ativos, banimentos alternados, escolhas. A tela
mostra a sua afinidade e a do adversário, o histórico de cada mapa e o que os
últimos confrontos entre vocês dizem (`legado.js` já guarda isso).

Acontece 20 vezes por temporada e é onde os itens 2 e 3 viram placar: você bane
o mapa em que ele é bom, escolhe o seu, e depois escala os agentes para aquele
mapa específico.

## 5. Pedir tempo na partida

Um ou dois por mapa. Num 3–9 você escolhe: mudar a agressividade, trocar o
foco, ou acalmar o time. Dá o que fazer no momento de maior atenção e, de
quebra, dá **um motivo para o foco tático existir** — hoje ele é indiferente
(medido: −7,4 na escolha "certa").

## 6. Conversar com o elenco

Moral vale +30 e hoje corre sozinha. Jogador com pouco tempo de jogo, contrato
vencendo ou superado por um reserva bate na sua porta; você promete
titularidade, renova, ou banca a briga.

Com o meta em cima disso, ganha um motivo novo: o jogador que perdeu a vaga
porque o agente dele caiu no meta tem uma reclamação legítima.

## 7. Consertar o que já tem botão

- **Foco tático** precisa de troca real: execução ganha ataque **e perde
  defesa**; retake o contrário. Hoje as duas são quase o default.
- **Agressividade** precisa de risco junto com o prêmio: mais pistol e retake,
  mais round jogado fora no eco.

---

## Ordem que eu proponho

1. **A semana de trabalho** — é a fundação. Sem ela, treino de mapa e de agente
   não têm onde acontecer.
2. **Treino de mapa + 7 mapas ativos** — o sistema mais barato de fechar, e já
   mexe no maior fator de vitória.
3. **Veto de mapa** — dá sentido imediato ao item 2, e é o ritual do Valorant.
4. **Meta de agentes** — o maior dos quatro, e o que precisa dos outros de pé
   para pesar de verdade.
5. Tempo na partida, conversa com o elenco, e o conserto das táticas.

## O que eu vou medir antes de dizer que está pronto

- **Orçamento de treino**: com 36 semanas, quantos mapas dá para dominar e
  quantos agentes dá para aprender? Se der para tudo, o custo está barato; se
  não der para nada, está caro.
- **O meta muda elenco?** Depois de um patch, a IA troca de agente, retreina ou
  compra? Se nada muda, o patch é enfeite.
- **Ir contra o meta é viável?** Um time de conforto com familiaridade 90 tem de
  ganhar de um time de meta com familiaridade 30. Se não ganhar, a sua ideia de
  "pode ir contra" não existe na prática.
- **A semana pesa?** Duas temporadas, um clube descansando sempre contra um
  clube treinando sempre: o descansado ganha no ano 1 e perde no ano 2, ou o
  treino é irrelevante?
