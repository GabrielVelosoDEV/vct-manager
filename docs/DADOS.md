# Modelo de dados

Tudo vive num único objeto `G`, serializável em JSON. Uma run salva é
`{id, versao, nome, ano, clube, fase, atualizado, semente, estado: G}`.

## G — estado da run

| Campo | Tipo | Papel |
|---|---|---|
| `runId` / `runNome` | string | identidade da run |
| `seed` | number | semente do mundo; reproduz elencos idênticos |
| `ano` | number | temporada corrente |
| `bloco` | number | índice do bloco atual em `calendario` |
| `fase` | string | rótulo do bloco atual |
| `janela` | bool | mercado aberto |
| `meuTime` | id\|null | `null` = pré-run |
| `times` | `{id: Time}` | 80 clubes |
| `jogadores` | `{id: Jogador}` | ~630, inclui agentes livres |
| `livres` | `[id]` | agentes livres |
| `regioes` | `{RID: Regiao}` | ligas, divisões e pontos |
| `calendario` | `[Bloco]` | temporada montada |
| `mapasAtivos` | `[string]` | rotação de mapas; hoje é o `MAP_POOL` inteiro |
| `torneios` | `{id: Torneio}` | catálogo das 43 competições, editável |
| `agentes` | `{funcao: [nome]}` | lista de agentes da run, semeada de `AGENTS` |
| `staff` | `{id: Membro}` | ~440 profissionais de comissão técnica |
| `staffLivres` | `[id]` | comissão sem clube |
| `seqS` | number | contador de ids de comissão |
| `historico` | `[{ano,evento,campeao}]` | galeria de títulos |
| `noticias` | `[{ano,bloco,txt}]` | feed da imprensa |
| `seqP` | number | contador de ids de jogador |

## Time

```js
{
  id, nome, tag, regiao:'AMER|EMEA|PAC|CN', tier: 1|2,
  prestigio: 20..99,          // força esperada, base do over dos gerados
  caixa, patroc,              // finanças
  logo: 'assets/logos/x.png', // opcional; sem isso usa a convenção por tag
  elenco: [idJogador],        // 5 a 9
  titulares: [idJogador],     // exatamente 5
  igl: idJogador,
  sinergia: 0..100,           // entrosamento; cai a cada troca de peça
  staff:     {tecnico, analista, mental},        // 1..5
  estrutura: {gh, treino, academia},             // 1..5
  tatica:    {agres:1..5, foco, scrim:1..5, treino},
  mapPref:   {Ascent:-8..8, ...},
  temporada: {v, d, mv, md, pts},
  titulos:   ['2026 · Champions']
}
```

## Jogador

```js
{
  id, nome, pais:'BR', role:'Duelista|Iniciador|Controlador|Sentinela|Flex',
  at: {mira, reflexo, mov, util, visao, clutch, consist, lider},  // 25..99
  idade, pot,                 // teto de evolução
  contrato,                   // anos restantes; 0 após o offseason = sai
  salario, valor,             // derivados; recalculados a cada evolução
  moral, forma, fadiga,       // 0..1
  lesao,                      // semanas restantes
  igl: bool,
  timeId: id|null,
  foto: 'assets/players/x.png',   // opcional
  agentes: ['Jett','Raze'],
  temp:     {maps,k,d,a,acs,fk,cl,mvp},   // temporada corrente
  carreira: {maps,k,d,a,titulos},
  hist: [{ano,time,over,k,d,a,mvp}]
}
```

## Retrato

Jogador e membro de comissão ganharam dois campos por causa do pacote de rostos:

| Campo | Onde | Para quê |
|---|---|---|
| `genero` | jogador e comissão | escolhe o balde; `'m'` por padrão, `'f'` no nome feminino da comissão |
| `real` | jogador | marca quem veio de roster real; fica fora do rosto gerado por padrão |

O manifesto vive em `data/rostos.js` (é `.js` e não `.json` porque `fetch()` de JSON
é bloqueado em `file://`) e o pacote em `assets/rostos/<balde>/NNNN.webp`. A escolha
é `hash(id) % quantidade` — mudar a contagem de um balde reembaralha aquele balde.

## Membro da comissão

```js
{
  id:'s12', nome, pais:'BR', idade,
  cargo:'tecnico'|'analista'|'mental'|'fisio'|'olheiro',
  at:{tecnica,gestao,visao,disciplina},   // 25..99
  pot, timeId:id|null, contrato, salario, valor,
  temp:{v,d,titulos}, carreira:{anos,titulos},
  hist:[{ano,time,over,v,d,titulos}]
}
```

O **over** é a média dos quatro atributos ponderada pelos pesos do cargo em
`CARGO_W` — mesma ideia do `ROLE_W` do jogador, e por isso mudar de cargo muda o
over sem mudar atributo nenhum. `t.comissao` é `{cargo: idMembro}` e `t.staff`
continua sendo `{cargo: nível 1..5}`, mas agora **derivado**: `atualizarComissao(t)`
recalcula a partir de quem está contratado. É isso que deixou as fórmulas de
`match.js` e `clock.js` intactas quando a comissão virou gente.

`nivelStaff(over)` mapeia over 40 → nível 1 e over 99 → nível 5, contínuo.

## Torneio

```js
{
  id,                  // chave estável: 'champions', 'kickoff_AMER', 'asc_PAC'
  nome, curto,         // exibição; renomear vale na hora, inclusive no stage em curso
  escopo:'INT'|'AMER'|'EMEA'|'PAC'|'CN',
  tier: 1|2,
  premio               // quanto o CAMPEÃO leva; 0 = fase que não premia
}
```

O calendário é remontado a cada temporada, então nome e arte não podem morar nos
stages — eles seriam recriados todo ano. O stage guarda só `torneioId` e pergunta o
nome ao catálogo por `nomeStage(s)`. As demais colocações saem de `CURVA_PREMIO` em
`core/competition.js`, pela categoria do torneio; `premiosDoStage(s)` junta as duas
coisas e é o que `fimDeBloco` usa para pagar.

### Elenco de partida progressivo

`ELENCOS_REAIS` em `data/elencos.js` aceita linha de 1 a 5 campos:
`[nick]`, `[nick,funcao,over]` ou `[nick,funcao,over,idade,pais]`. O que falta
`core/world.js` preenche como se o jogador fosse gerado — função na primeira
vaga não coberta do time, over em torno do prestígio, idade em 19–26, país da
região. Consequência a lembrar: o teto dos reservas gerados só existe quando
pelo menos um titular real tem over informado.

**over** não é armazenado — é calculado a cada leitura por `over(p)`, média dos
atributos ponderada pelos pesos da função em `ROLE_W`. Isso garante que editar um
atributo no Editor reflita na hora, sem campo derivado desatualizado.

## Bloco e Stage

O calendário é uma lista de blocos; cada Avançar resolve uma rodada de todos os
stages ativos do bloco. Um stage é pontos corridos (`rr`) ou mata-mata (`ko`).

```js
Bloco  { nome, endKey, montar?, janela?, stages: [Stage] }
Stage  { id, nome, tipo:'rr'|'ko', bo, regiao, tier, times:[id],
         rodadas:[[ [a,b], ... ]], idx, tabela:{id:{v,d,mv,md,rv,rd}},
         vivos:[id], elim:[id], ranking:[id], resultados:[], feito }
```

`endKey` liga o bloco à função que distribui premiação, pontos e vagas
(`fimDeBloco` em `core/calendar.js`). `montar` indica que o stage só pode ser
construído depois que o bloco anterior terminar — Masters, playoffs, Champions.

## Faixas padrão por divisão

Definidas em `src/core/padrao.js`. São decisão de design, não medição:

| | Tier 1 | Tier 2 |
|---|---|---|
| over de jogador | 80–99 | 69–80 |
| over de comissão | 80–99 | 62–78 |
| folga de potencial (máx., aos 17 anos) | +11 | +22 |
| agentes por jogador | 3 da função | 3 da função |

O 99 é distribuído à mão depois do sorteio, para uma ou duas pessoas no mundo
inteiro — o sorteio normal para em 97. Sem isso o topo da faixa vira régua e
deixa de significar "melhor do mundo".

O potencial é `over + espaço da divisão × fator de idade`, com o fator caindo
de 1.00 aos 17 anos para 0.07 dos 28 em diante. Um garoto de Challengers pode
chegar ao Tier 1; um titular de 26 anos já é quase o que vai ser.

## Funções do jogador

```
role      função principal — decide o perfil dos atributos e o over
role2     secundária, ou null. Só entra se custar <= 6 pontos de over
roleAtual em que função ele vai jogar na escalação atual
```

`role2` é revalidada sempre que o perfil muda (evolução semanal, edição no
Editor, reescala de over). Uma secundária que deixou de valer não some em
silêncio: a ficha a mostra marcada e explica o motivo. Cerca de 85% do mundo
tem secundária, quase sempre uma função vizinha.

`Flex` continua sendo coringa e cobre qualquer função sem precisar de `role2`.

## Parser do vlr.gg

`src/core/vlr.js`. Cola a página de um time e devolve as linhas do importador.
Aceita três formas, porque cada navegador entrega uma coisa: texto com uma
célula por linha, texto com `nick — Nome Real`, e o HTML do elemento. **Só o
HTML traz o país**, porque a nacionalidade no vlr é uma bandeira, e bandeira não
sobrevive a uma colagem de texto.

O que o parser **não** faz é inventar. O vlr não publica função nem over —
esses campos saem vazios e ele avisa que o importador vai assumir Flex. Um
código de país só é aceito se existir na lista do jogo, para que uma classe CSS
qualquer não vire nacionalidade por acidente.

A prévia é obrigatória: nada entra na base sem você ver a tabela do que foi
entendido. E toda pessoa da colagem tem de sair em algum lugar — jogador ou
comissão. Sumir sem aviso é pior do que ler errado, porque não dá para
perceber; é o caso do `(head coach)` grudado no nome, que fazia o parser
descartar a pessoa em silêncio.

## Onde cada coisa é salva

O Editor grava no **save** (IndexedDB), não nos arquivos do projeto. É a
diferença que mais confunde, e que já custou um `data/elencos.js`:

| o que você edita | vale só no save até você… |
|---|---|
| elencos, over, função, potencial | baixar `data/elencos.js` e copiar por cima |
| país de sede dos clubes | baixar `data/clubes.js` e copiar por cima |
| torneios, agentes, comissão, marcas | (só no save por enquanto) |

Os dois exportadores se recusam a gerar arquivo vazio: um arquivo vazio copiado
por cima apaga a base, e foi exatamente o que aconteceu na primeira vez que o
botão de elencos foi usado.

`data/clubes.js` é arquivo próprio, e não um apêndice do `elencos.js`, porque
não depende de ninguém estar marcado como jogador real — foi essa dependência
que fez a primeira exportação sair vazia.

## Popularidade por país

`POP_PAIS` em `src/core/economia.js`. 1.0 é a média, e **nada fica abaixo
disso**: Valorant é popular no mundo todo, então país fora da lista é a média,
não um lugar sem cena. Só os países apontados como principais sobem.

Pesa mais no Tier 2, onde o prestígio é igual para todos e a torcida é a única
coisa que diferencia um clube do outro.

## Legado, confronto direto e rivalidade

`data/historia.js` traz os títulos reais de 2021 a 2025, lidos da Wikipédia.
2026 fica de fora de propósito: é a temporada que se joga, e semear o campeão
dela faria o título ser conquistado duas vezes.

```
t.titulos   lista de 'ANO · Evento'
t.legado    peso somado dos títulos (internacional 1.0, liga 0.34)
t.vices     finais perdidas antes de 2026
t.pais      sede do clube, ou null para derivar do elenco
```

Campeões que já não competem (Acend, Gambit, OpTic) continuam em `G.historico`
sem receber nada — o mundo lembra que existiram.

Confronto direto vive em `G.h2h`, com chave ordenada (`a|b`) para que "A contra
B" e "B contra A" caiam no mesmo registro. É gravado em `stageAplicar()`, o
único ponto por onde todo resultado de série passa.

**Rivalidade é derivada, não escrita.** `notaRivalidade()` pesa volume de
confrontos, equilíbrio do histórico (goleada crônica é freguesia, não
rivalidade), porte dos dois clubes e se são da mesma liga. Uma tabela de
rivalidades escrita à mão envelheceria mal: depois de dez temporadas simuladas
ela estaria mentindo.

## Afinidade de mapa

```
p.mapas  { Ascent: 3.2, Bind: -5.0, ... }   de -8 a +8, um por mapa do pool
```

Sorteada na criação com poucos mapas de opinião forte, e movida a cada partida
pelo rendimento do jogador naquele mapa comparado ao próprio normal. A média dos
titulares entra na força do time e no pick/ban, ao lado da preferência do clube.

## Marca de patrocínio

```
{ id:'m12', nome:'Lumen Telecom', setor:'Telecom', nivel:3 }
```

`nivel` vai de 1 (marca local) a 5 (global) e decide tanto o valor do contrato
quanto quais clubes alcançam a marca. O catálogo vive em `G.marcas`, tem 96
marcas por mundo e é editável no Banco de dados › Patrocinadores. O logo entra
no pacote de imagens com a chave `marca:<id>`, normalizado em 320×160 —
deitado, porque marca é assinatura horizontal, não escudo.

Cada clube tem `t.patrocinios = {master, secundario, fornecedor}`, com o id da
marca em cada vaga. `t.torcida` é 0–100 e não representa número de pessoas: é o
peso do clube no mercado, que é o que a economia precisa saber.

## Levar o save de volta para o projeto

O Editor grava no save (IndexedDB), não nos arquivos do projeto — então
ajustes feitos lá somem quando você começa um jogo novo. A aba
**Importar / Exportar** tem *Baixar data/elencos.js*, que gera o arquivo a
partir da base carregada, no formato completo `['nick','Função',over,idade,'PA']`.
Copie por cima de `data/elencos.js` e todo jogo novo passa a nascer com os seus
números. `tools/roundtrip.mjs` testa exatamente essa ida e volta.

Só jogadores de nome real entram na exportação, inclusive os que estão sem
clube (vão para a chave `LIVRE`). Reservas gerados ficam de fora: eles voltam a
ser sorteados a cada run, e é isso que mantém os elencos variados.

## Compatibilidade de versões

`RUN_VERSAO` em `src/data/storage.js`, hoje **6**. A versão 6 trouxe a comissão técnica como pessoas: um save
anterior é migrado no carregamento, recriando membros equivalentes aos níveis
que o clube tinha, para que a força não mude. A versão 5 acrescentou `torneios` e `agentes`, preenchidos
no carregamento quando faltam. A versão 4 mudou a
semântica de `temp.maps` e `carreira.maps`: antes contavam partidas, agora
contam mapas, e `temp.acs` passou a ser somado por mapa para que
`acs/maps` continue sendo a média correta. Ao adicionar campos novos, incremente e
trate o valor ausente com padrão, em vez de invalidar a run. Runs antigas continuam
carregando com um aviso no console.
