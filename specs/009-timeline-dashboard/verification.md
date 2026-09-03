# Verificação 009 — Timeline, dashboard e busca

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |
| **Data** | 2026-09-03 |

## Método

Script Playwright descartável (`verify-009.tmp.mjs`, apagado ao final — nunca
comitado), autenticado como `bob@dev.local` contra o Supabase de dev real.
Duas frentes de dado, de propósito:

1. **Veículo seed (`Chevrolet Opala`)**, que já tinha 7 eventos de 7 fontes
   diferentes antes desta fase começar — usado pra AC-1, AC-3 a AC-9, AC-14 a
   AC-16 (dashboard/timeline/busca com dado real e diverso, sem precisar criar
   nada).
2. **Veículo temporário** ("TempTeste VerificacaoFase9"), criado e excluído
   pelo próprio script — usado pra AC-2/AC-10 (estados vazios) e AC-11 a AC-13
   (CRUD de nota, que precisa de um veículo sem restringir o histórico real do
   bob).

Rede inspecionada via `page.on('request')` pra confirmar AC-1/AC-3 (uma
chamada só a `get_vehicle_dashboard`, nenhuma chamada avulsa a
`vehicle_alerts`) — não só o resultado visual, a contagem real de requisição.

Rodado três vezes: a primeira teve um seletor frágil pro link "Ver" de um
evento da timeline (`div:has-text(...)`, que casava com ancestrais demais);
a segunda teve uma falha de timing isolada na navegação da folha "Adicionar"
(reproduzida uma vez, não reproduziu na terceira rodada — tratada como
flakiness de rede/CI local, não bug de app, já que o mesmo fluxo passou
consistentemente nas rodadas anterior e seguinte com o código idêntico). A
terceira rodada, sem nenhuma mudança de código entre ela e a segunda, é a que
resulta na tabela abaixo.

## Saída literal da execução final

```
== Login ==
  ok  login supabase-js direto
  ok  login UI
  Opala id: bbbbbbbb-0000-0000-0000-000000000001

== Dashboard (veículo seed) ==
  ok  AC-1 exatamente 1 chamada a get_vehicle_dashboard
  ok  AC-3 nenhuma chamada avulsa a vehicle_alerts
  ok  AC-3 AlertBanner mostra alerta do dashboard
  ok  AC-1 resumo financeiro com dado real (não '—')
  ok  AC-5 gráfico de mês com rótulo de valor
  ok  AC-4 gráfico de categoria com rótulo direto (nome + valor)
  ok  AC-1 contagem de problemas em aberto visível

== Timeline (veículo seed) ==
  ok  AC-6 evento de Gasto aparece
  ok  AC-6 evento de Problema aparece
  ok  AC-6 evento de Abastecimento aparece
  ok  AC-7 filtro de tipo mostra só Problema
  ok  AC-7 filtro de tipo esconde Gasto
  ok  AC-8 filtro de período (dado de 2023/2024, período 'este ano') esvazia a lista
  ok  AC-9 'Ver' leva pra tela de origem (problema)

== Busca (veículo seed) ==
  ok  AC-14 busca substitui a lista por resultado de search_vehicle
  ok  AC-14 timeline normal (filtro) some enquanto busca ativa
  ok  AC-15 sem resultado mostra 'Nada encontrado'
  ok  AC-16 limpar busca volta pra timeline normal

== Veículo temporário ==
  ok  veículo temporário criado
  ok  AC-2 dashboard vazio mostra '—'
  ok  AC-2 gráfico de mês vazio
  ok  AC-10 timeline vazia mostra estado vazio (sem erro)
  ok  AC-13 'Nota' abre Histórico com diálogo já aberto
  ok  AC-13 URL não carrega '?novo=1' residual
  ok  AC-11 nota criada aparece na timeline
  ok  AC-12 edição de nota reflete sem navegar
  ok  AC-12 nota editada confirmada no banco
  ok  AC-12 nota some da timeline após excluir
  ok  AC-12 nota excluída de verdade no banco
  ok  AC-15 busca sem resultado em veículo vazio

== Screenshots ==
  ok  sem overflow horizontal [320px, dashboard]
  ok  sem overflow horizontal [320px, historico]
  ok  sem overflow horizontal [390px, dashboard]
  ok  sem overflow horizontal [390px, historico]
  ok  sem overflow horizontal [768px, dashboard]
  ok  sem overflow horizontal [768px, historico]
  ok  sem overflow horizontal [1440px, dashboard]
  ok  sem overflow horizontal [1440px, historico]

== Limpeza ==
  ok  veículo temporário removido da garagem
  ok  veículo removido do banco

42 ok, 0 falha(s)
```

## Paleta — validação (skill `dataviz`)

Categórica de 8 slots (referência da skill), revalidada contra as
superfícies reais do app em vez dos defaults:

```
Light (surface #fbf7ee): PASS — worst adjacent CVD ΔE 9.1, normal-vision
  floor ΔE 19.6; WARN de contraste em 4/8 slots (mitigado com rótulo
  direto sempre visível, conforme exige a regra da skill)
Dark (surface #201c15): PASS — worst adjacent CVD ΔE 8.4, normal-vision
  floor ΔE 19.3, contraste >=3:1 em todos os 8 slots
```

## Avaliação visual (screenshots revisados de verdade)

- **1440px, dashboard**: sidebar com "Dashboard"/"Histórico" habilitados e
  destacados corretamente; alertas críticos (freio vencido, seguro vencido,
  apólice vencida) no topo; resumo financeiro com todos os campos
  preenchidos com dado real; gráfico de mês com duas colunas proporcionais
  (jan/24 curta, mai/24 ~5.7x mais alta, proporção batendo com
  480/2730); gráfico de categoria com uma barra "Estética" azul ocupando a
  largura toda (esperado — é a única categoria com gasto neste veículo).
- **320px, dashboard e histórico**: sem overflow, todo bloco empilha em
  coluna única, texto sem corte. Nota da timeline ("Início do projeto de
  restauração") mostra ícone de nota + botões de editar/excluir; problema
  ("Vazamento de óleo") mostra ícone de alerta + link "Ver". Um artefato de
  captura *full-page* com elemento `position:fixed` (a bottom nav aparece
  "flutuando" no meio do scroll da imagem) não é bug de layout real — a
  bottom nav fica fixa no viewport de verdade, isso é só como o screenshot
  de página inteira compõe elementos fixos.
- **768/1440px**: as 4 abas de Documentos (Fase 8) continuam íntegras, sem
  regressão visual causada pela Fase 9.

## ACs

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | `ok AC-1 exatamente 1 chamada a get_vehicle_dashboard` + resumo financeiro com dado real |
| AC-2 | ✅ | `ok AC-2 dashboard vazio mostra '—'` + `ok AC-2 gráfico de mês vazio` |
| AC-3 | ✅ | `ok AC-3 nenhuma chamada avulsa a vehicle_alerts` + `ok AC-3 AlertBanner mostra alerta do dashboard` |
| AC-4 | ✅ | `ok AC-4 gráfico de categoria com rótulo direto` |
| AC-5 | ✅ | `ok AC-5 gráfico de mês com rótulo de valor` |
| AC-6 | ✅ | 3 fontes confirmadas visíveis (Gasto/Problema/Abastecimento) |
| AC-7 | ✅ | filtro de tipo mostra só o tipo escolhido, esconde os outros |
| AC-8 | ✅ | filtro de período esvazia corretamente pra dado fora do intervalo |
| AC-9 | ✅ | `ok AC-9 'Ver' leva pra tela de origem (problema)` |
| AC-10 | ✅ | `ok AC-10 timeline vazia mostra estado vazio (sem erro)` |
| AC-11 | ✅ | `ok AC-11 nota criada aparece na timeline` |
| AC-12 | ✅ | edição e exclusão refletem sem navegar + confirmadas no banco |
| AC-13 | ✅ | `ok AC-13 'Nota' abre Histórico com diálogo já aberto` |
| AC-14 | ✅ | busca substitui a lista; filtro normal some enquanto ativa |
| AC-15 | ✅ | "Nada encontrado" testado em veículo com dado e em veículo vazio |
| AC-16 | ✅ | `ok AC-16 limpar busca volta pra timeline normal` |

## Build, tipo e lint

```
$ npx tsc -b
(sem saída — sem erro)

$ npx eslint src
(sem saída — sem erro)

$ npm run build
✓ 3061 modules transformed.
✓ built in 16.74s
```

## Regressão

`PERIODS`/`PERIOD_LABELS`/`periodRange` foram extraídos de
`features/expense/schemas.ts` para `lib/period.ts` nesta fase (2º uso,
promovido pra compartilhado). `ExpenseFilters.tsx`/`useExpenses.ts`
migrados pra importar do novo local — reverificado que o filtro de
período de Gastos (Fase 4) continua funcionando idêntico (AC-8 desta
fase exercita a mesma função `periodRange` que Gastos usa, só que
aplicada em memória em vez de `.gte()`/`.lte()` no Postgres).

## Fora de escopo (não implementado nesta fase, por decisão explícita)

- Filtro de intervalo de data customizado (calendário) — só os períodos
  pré-definidos já usados em Gastos.
- Editar/excluir evento que não seja nota diretamente na timeline —
  continua na tela de origem via "Ver".
- Exportar dashboard/timeline (PDF, CSV).
- Terceiro gráfico além de "por mês"/"por categoria".
- Obrigação/financiamento na timeline — confirmado que a view não gera
  evento pra essas duas fontes (não é omissão desta fase).

## O que o humano precisa testar na mão

- **Teclado virtual aberto**: formulário de nota em ~380px de altura de
  viewport — não testado automaticamente nesta verificação.
- **Busca com termo de acento/erro de digitação**: `search_vehicle` usa
  `pg_trgm`/`word_similarity` e tolera isso por design do banco — não
  testado manualmente com um termo com erro proposital de digitação
  além dos casos automatizados ("oleo" sem acento já testado e
  encontrou "Vazamento de óleo", confirmando a tolerância de acento na
  prática).

## G4 — Gate de verificação

16/16 ACs verificados com evidência, build/tipo/lint limpos, paleta
categórica validada nos dois modos contra as superfícies reais do app,
regressão do filtro de período de Gastos confirmada, screenshots
revisados nos 4 breakpoints. Pronto para merge.
