# Análise do estado atual — o que foi corrigido e o que ficou

Levantamento feito rodando a bateria completa (166 testes jsdom, `verificar.mjs`
com 20 temporadas × 3 sementes, `padrao-test.mjs`, `roundtrip.mjs`, `telas.mjs`)
mais medidores escritos para este diagnóstico (`tools/comissao.mjs`,
`tools/caixa.mjs`). Cada item tem o número ou a linha que o sustenta.

---

## RESOLVIDO

### 1. Save antigo virava NaN e não tinha migração
`RUN_VERSAO` parou no 6 enquanto entraram `manager`, `h2h`, `marcas`, `torcida`,
`patrocinios`, `legado`, `pais`, `paisReal`, `mapas`, `role2`, `roleAtual` e
`pico`. Sem migração, `atualizarTorcida` lia `t.torcida` indefinido, gerava NaN e
o NaN vazava para `aporteLiga` → `receitaAnual` → caixa.

- `RUN_VERSAO` = 7 e um `migrarRun()` que preenche tudo que falta sem
  sobrescrever o que existe.
- A migração **sorteia num desvio** e devolve o fluxo do RNG onde estava: abrir
  um save não muda mais o futuro dele.
- História real só entra uma vez (marcador `pre:true`), então migrar duas vezes
  não duplica títulos nem torcida.
- `atualizarTorcida` normaliza antes da conta, não depois.
- 6 casos novos de teste cobrem isso.

### 2. Comissão de Tier 2 nunca ajudava
Eram **quatro** fórmulas lendo comissão e **três pontos neutros diferentes**:
`clock.js` usava 3 escrito à mão em dois lugares, `match.js` zerava no 2, e a
lesão de partida usava 3 de novo. Como a escala de nível é do mundo (piso 62,
topo 99) e metade do mundo é Tier 2, nenhum clube de Challengers alcançava 3 —
o melhor fisio e o melhor psicólogo da divisão ainda eram penalidade.

Pior: a comissão de Tier 2 nem usava a faixa dela. Com prestígio igual para
todos, `overAlvo` empilhava a divisão inteira no piso (62–73 de uma faixa que
promete 62–78), e o alvo da IA de mercado apontava para over ~52, que não existe
na régua — dava nível 1 e a IA nunca trocava ninguém.

- `NIVEL_NEUTRO = 2`, um só, usado pelas quatro fórmulas. Não foi escolhido no
  ar: `match.js` já zerava exatamente no 2; quem estava fora do compasso era o
  `clock.js`. Os `k` foram reescalados para o efeito no Tier 1 não mudar.
- `pesoComissao()`: no Tier 2 quem posiciona a comissão dentro da faixa é a
  **torcida**, a mesma régua que já diferencia a divisão na economia.
- O olheiro (base) também estava ancorado no 3 — a única fábrica de talento do
  Tier 2 rendia menos por definição.

| | antes | depois |
|---|---|---|
| nível da comissão T2 | 1.00 – 2.19 (mediana 1.43) | 1.00 – **2.73** (mediana 1.97) |
| força em partida T2 | −2.00 a **+0.28** | −2.00 a **+1.26** (mediana +0.18) |
| moral/semana T2 | 0.0000 a 0.0019 | 0.0031 a 0.0046 |
| risco de lesão T2 | +0.0120 a +0.0055 | +0.0027 a **−0.0020** |
| Tier 1 (mediana) | moral 0.0054 · lesão −0.0055 | moral 0.0055 · lesão −0.0052 |

### 3. Dinheiro empoçado, sem quebrar ninguém
O caixa parava porque a IA **não tinha em que gastar**: a tabela de preços de
estrutura morava em `src/ui/views.js`, onde só o clube do jogador alcançava, e o
teto de folha olhava só para a receita bruta — um clube com 16 milhões no banco
não podia gastar um centavo a mais que o lanterna da mesma liga.

- `custoUpgrade` e `investirEstrutura` saíram para o motor: **a IA constrói**.
- Duas travas na obra: cabe no caixa deixando uma temporada de folha de reserva,
  **e** a operação sustenta o custeio depois de pronta, com margem de 12%.
  Estrutura maior custa mais todo ano, e receita cai — sem a segunda trava o
  clube construía o que só conseguia pagar enquanto estava ganhando.
- O teto de folha passou a descontar o custeio antes de liberar salário, e
  **caixa parado amplia o teto** (0.88 → 0.98 da receita livre). Autolimitado:
  gastar derruba a reserva e o teto desce junto. É o oposto de confiscar.
- Renovação, mercado de agentes livres e mercado de comissão passaram a olhar a
  folga salarial, não só o caixa.
- `ajustarFolha()`: quem está acima do teto corta antes de contratar. E
  `garantirElencos` repõe com **o mais barato**, não com o melhor — antes o
  clube demitia o jogador de 108k, ele caía no mercado como o melhor livre, e no
  minuto seguinte o mesmo clube o recontratava.
- Clube no vermelho aperta o cinto (teto 0.68) até sair. Era o caminho de volta
  que faltava: sem ele a folha empatava com a receita e o clube ficava preso.
- Clube com folga larga tenta reforço **sempre**, não em 30% dos anos.

| | antes | depois |
|---|---|---|
| caixa T1 (mediana, 10 temporadas) | 4.756k | **2.6–4.2M** |
| caixa T2 (mediana) | 1.211k | 543k |
| folha T2 / receita | **100%** | 62% |
| sobra anual T2 | **−67k** | +33k |
| clubes no vermelho (10/20/30/40 temporadas) | 1 já aos 10 anos | **0** |
| over mediano do titular T1 (20 temporadas) | 86 | **88** |

Nenhum clube quebra, e a liga ficou **mais forte**, não mais pobre: os clubes
agora compram em vez de sentar em cima do saldo.

### 4. Achados de tela (só as capturas pegam)
- **Finanças mentia**: "Resultado anual" somava receita menos folha e ignorava o
  custeio — mostrava $1.07M onde o resultado real era $555k. Agora desconta, e
  há um cartão de Orçamento com custeio, receita livre, teto de folha e folga.
- **Medidor de torcida** com a assinatura trocada: `medidor(t.torcida||0,100)`
  em vez de `medidor(rótulo, fração, px)`. O anel marcava 100 sempre. É a
  segunda vez que esse erro aparece (a primeira foi nas rivalidades), então
  agora **um teste varre o código** atrás de `medidor(` sem rótulo.
- A captura de Finanças saía com o modal da comissão por cima — a tela da
  economia nunca era conferida de fato.
- Os textos de Táticas e do Editor ainda diziam "Nível 3 é o ponto neutro".

---

## FICOU DE FORA (decisão sua)

**Poda do `p.hist`.** O save cresce de 692 KB para 2.267 KB em 10 temporadas por
causa de uma entrada por temporada por jogador que nunca é podada. Você disse que
espaço não é problema — fica registrado, é reversível a qualquer momento.

---

## O QUE AINDA SOBRA, E POR QUÊ

O topo do Tier 1 continua acumulando: mediana 8.5M em 30 temporadas, p90 de 28M.
Não é mais falta de onde gastar — estrutura no máximo, teto de folha em 98% da
receita livre, reforço tentado todo ano. É que **o mercado acaba**: a folha do
Tier 1 fica em 35% da receita porque não há mais jogador que melhore o elenco.

Se um dia isso incomodar, o caminho seria inflação salarial: liga rica paga mais
pelo mesmo jogador, e o dinheiro vira preço em vez de saldo. É uma mudança de
desenho, não uma correção — por isso não foi feita agora.
