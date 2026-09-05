# Plano 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Criar `HeaderActivityMenu` no cabeçalho seguindo exatamente o padrão já
existente de `HeaderAlertsMenu` (ícone + `Popover`, mesmo hook de dado,
mesmo agrupamento por veículo), inserido em `AppShell.tsx` ao lado do
sino de alertas. Remover `GarageActivityFeed` e seu uso em
`VehicleListPage`. No espaço vago, criar `GarageComparisonDashboard`
(tiles agregados calculados no cliente a partir do array `vehicles` já
carregado) + `VehicleInvestmentChart` (gráfico de barra horizontal,
mesmo padrão visual do `ExpensesByCategoryChart`), montado só quando
`vehicles.length >= 2`.

**Revisão 015b**: a primeira entrega deixou `HeaderActivityMenu` visível
em toda tela, inclusive desktop — o usuário corrigiu, pedindo leitura
direta pela sidebar no desktop. Ajuste: criar `SidebarActivityFeed`,
montado dentro de `Sidebar.tsx` (que passa a receber `vehicles` como
prop) no espaço entre os links de navegação e "Configurações" fixo no
rodapé; itens compactos (ícone + título + data/valor via `Link` quando
`resolveTimelineLink` resolve uma rota), porque a coluna tem 224px
(`w-56`), não a largura de um card de timeline. `HeaderActivityMenu`
permanece igual, mas só renderiza abaixo de `lg` (`AppShell.tsx` passa a
envolver seu uso num `<div className="lg:hidden">`).

**Revisão 015c**: duas correções do usuário na mesma rodada. (1) O gate
`vehicles.length >= 2` do painel comparativo escondia a área inteira em
contas com 1 veículo só (o caso real do usuário) — mudou pra
`vehicles.length > 0`, e a leitura interna de `GarageComparisonDashboard`
já funcionava para array de 1 elemento sem ajuste (todo `reduce`/`filter`
é seguro com 1 item). (2) Informação demais no mobile — o painel
comparativo passa a ser exclusivo de desktop, envolvendo seu uso em
`VehicleListPage.tsx` num `<div className="hidden lg:block">` (sem custo
extra: o componente não busca dado próprio, só agrega o array `vehicles`
já carregado pela própria página).

**Revisão 015d** (revisão de design pedida pelo usuário, três frentes):
(1) *Métrica sem sentido* — "Km total rodado" sai (RN-6); entram
"Próxima manutenção" (novo hook `useGarageMaintenance` sobre a view
`maintenance_status`, mesmo padrão dos outros hooks de garagem) e
"Pendências ativas" (reusa `useGarageAlerts`, a mesma query key do sino
do cabeçalho — o React Query serve do cache, sem segunda regra de
alerta). (2) *Cor* — `VehicleInvestmentChart` troca a paleta categórica
por hue único `--color-accent` com trilho reto e fino. (3) *Layout* —
painel vira grade de instrumentos com fio de 1px (ADR-070), com o
gráfico como seção separada por `border-t` em vez de card aninhado.

**Revisão 015e** (bug de layout criado pela 015b): a sidebar é filha flex
de um contêiner em linha, então esticava (`align-items: stretch`) até a
altura do `<main>` — com 18 veículos a página passa de 5.000px e
"Configurações", preso com `mt-auto` no rodapé da sidebar, ia junto pro
fim da página. Correção: a partir de `lg` o shell passa a ter a altura
exata da viewport (`lg:h-dvh lg:overflow-hidden`) e o `<main>` vira o
contêiner de rolagem (`lg:overflow-y-auto`); cabeçalho e sidebar ficam
fixos e só a lista de atividade rola dentro da sidebar. Abaixo de `lg`
nada muda — o documento continua rolando.

**Revisão 015f**: dois acordeões, sem primitivo novo. (1) `GarageSummary`
fecha por padrão abaixo de `lg` — dois títulos (`h2 > button` no mobile,
`h2` puro no desktop) em vez de um botão que vira decorativo acima do
breakpoint. (2) `VehicleInvestmentChart` mostra 4 barras + gatilho "Ver
todos os N veículos"; a barra agregada "Outros" sai. Nenhuma dependência
adicionada: o projeto usa Radix só pra primitivo com foco/portal
(Dialog/Popover/Switch); um `button` + `aria-expanded` + `useId` resolve
acordeão sem isso.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Manter `GarageActivityFeed` como está e só adicionar o painel novo em outro ponto da tela | O usuário pediu explicitamente pra tirar a atividade recente daquele espaço e usá-lo pro painel novo — manter os dois deixaria a tela do mesmo tamanho de antes. |
| Atividade recente virar uma rota/página própria (`/atividades`) | Contraria o pedido explícito: "não vai ser uma aba que vão clicar e abrir uma página" — o padrão certo é popover, igual ao sino de alertas. |
| Nova view/RPC no Postgres para agregar métricas de frota (km total, custo/km médio, gasto do mês) | Os dados já vêm por veículo via `useVehicles`; com o volume esperado (poucos veículos por usuário) agregar no cliente é suficiente e evita migration só pra isto. |
| Biblioteca de gráfico (recharts, visx, etc.) pro gráfico comparativo | O projeto inteiro já resolve gráfico com barras em `div` + token de cor (`ExpensesByMonthChart`, `ExpensesByCategoryChart`) — inconsistente introduzir uma dependência nova pra um gráfico a mais do mesmo tipo. |
| **(015d)** Implementar "Km rodados este mês" no lugar do "Km total rodado" | Não existe tabela de leitura de odômetro: o valor só aparece grudado em evento (gasto, abastecimento, manutenção, nota) que por acaso registrou km. O delta do mês só enxerga o intervalo entre a primeira e a última leitura registrada — mês sem registro daria "0 km rodados" com o carro tendo rodado. Seria trocar uma métrica sem sentido por outra enganosa, exatamente o que o item 1 pede pra evitar. Registrado como proposta pro usuário decidir. |
| **(015d)** Nested card pro gráfico dentro do painel | Card com borda dentro de card com borda é o "3 cards competindo" do ADR-061; virou seção separada por `border-t`. |
| **(015d)** `gap-px` + fundo de borda pra desenhar o fio entre módulos | Funciona, mas deixa bloco de fundo de borda visível quando a contagem de módulos não é múltiplo das colunas do breakpoint. `-mt-px -ml-px` + `border-t border-l` não tem esse caso. |
| **(015e)** `position: sticky` na sidebar em vez de shell de altura fixa | Precisaria de `top: <altura do cabeçalho>` e `height: calc(100dvh - <altura do cabeçalho>)` — número mágico que quebra na primeira mudança de padding/ícone do cabeçalho. O shell de altura fixa não precisa saber a altura de ninguém. |
| **(015e)** Aplicar o shell de altura fixa em todos os tamanhos | Trocaria o scroll do documento pelo de um contêiner interno também no mobile, onde isso impede a barra de endereço do navegador de se esconder. Escopado em `lg:` — abaixo disso não há sidebar pra corrigir. |
| **(015f)** `@radix-ui/react-accordion` / `react-collapsible` | Dependência nova pra dois toggles. O projeto usa Radix só onde há foco/portal/teclado não-trivial (Dialog, Popover, Switch); acordeão é `button` + `aria-expanded` + `aria-controls`. |
| **(015f)** Hook `useMediaQuery` pra decidir em JS se o resumo é acordeão | Evitaria o título duplicado, mas introduziria decisão de layout em JS num codebase que resolve breakpoint 100% em CSS (`Sidebar`, `BottomNav`, `HeaderActivityMenu`). O custo do título duplicado (uma string, extraída pra const) é menor que o da inconsistência de abordagem. |
| **(015f)** Manter a barra "Outros" junto do acordeão de 4 | Com um gatilho explícito dizendo quantos veículos faltam, a barra agregada vira ruído — e ela parecia um veículo sem ser. A soma do resto continua disponível em "Total investido" no `GarageSummary`. |

## 3. Impacto em contratos e dados

Nenhum. Nenhuma tabela, view, RPC ou tipo gerado (`database.types.ts`)
muda. `useGarageTimeline` e `useVehicles` são reaproveitados sem
alteração de assinatura ou de query.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/components/layout/HeaderActivityMenu.tsx` | criar | Ícone + popover de atividade recente no cabeçalho, mesmo padrão do `HeaderAlertsMenu`. |
| `src/components/layout/AppShell.tsx` | modificar | Inserir `<HeaderActivityMenu vehicles={...} />` ao lado do sino de alertas. |
| `src/features/vehicle/GarageActivityFeed.tsx` | remover | Conteúdo migrado para `HeaderActivityMenu`; nenhum outro lugar importa este componente. |
| `src/features/vehicle/VehicleListPage.tsx` | modificar | Remove import/uso de `GarageActivityFeed`; adiciona `GarageComparisonDashboard` no mesmo lugar, gate `vehicles.length > 0` + `hidden lg:block` (revisão 015c). |
| `src/features/vehicle/GarageComparisonDashboard.tsx` | criar | Tiles agregados (contagem de veículos, km total, custo/km médio, gasto do mês) + `VehicleInvestmentChart`; gate de quantidade de veículos vive só no chamador (`VehicleListPage`), não no componente. |
| `src/features/dashboard/VehicleInvestmentChart.tsx` | criar | Barra horizontal comparando `total_invested` por veículo, top 8 + "Outros", mesmo padrão do `ExpensesByCategoryChart`. |
| `src/components/layout/SidebarActivityFeed.tsx` | criar (015b) | Seção "Atividade recente" inline na sidebar (desktop), itens compactos. |
| `src/components/layout/Sidebar.tsx` | modificar (015b) | Passa a receber `vehicles` como prop e monta `SidebarActivityFeed` entre a navegação e "Configurações". |
| `src/components/layout/AppShell.tsx` | modificar (015b) | Passa `vehicles` para `Sidebar`; envolve `HeaderActivityMenu` num `<div className="lg:hidden">` (só mobile). |
| `src/features/vehicle/useGarageMaintenance.ts` | criar (015d) | Próxima manutenção da frota inteira via view `maintenance_status`, mesmo padrão de `useGarageAlerts`. |
| `docs/DECISIONS.md` | modificar (015d) | ADR-070 — grade de instrumentos como layout canônico de painel agregado. |
| `docs/DESIGN.md` | modificar (015d) | Entradas em "Densidade": grade de instrumentos, regra de métrica agregada e hue único em gráfico de magnitude. |

## 5. Ordem de execução

1. `HeaderActivityMenu.tsx` (extrai o conteúdo de `GarageActivityFeed`, sem consumidor ainda).
2. `AppShell.tsx` — pluga o novo item no cabeçalho.
3. `VehicleInvestmentChart.tsx` (peça de apresentação isolada, sem dependência de tela).
4. `GarageComparisonDashboard.tsx` (usa o chart do passo 3 + agregações client-side).
5. `VehicleListPage.tsx` — troca `GarageActivityFeed` por `GarageComparisonDashboard`.
6. Remove `GarageActivityFeed.tsx`.
7. Verificação manual via Playwright (mobile 390px e desktop 1440px) + `tsc`/`eslint`.

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Login real, abrir popover de atividade em uma página que não é "Minha Garagem" (ex: `/`), conferir eventos agrupados por veículo. | manual (Playwright) |
| AC-2 | Conta de teste sem nenhum evento registrado (ou filtrar visualmente o estado vazio no código) — conferir texto exato. | manual (leitura + Playwright quando aplicável) |
| AC-3 | Conta sem veículo cadastrado — conferir que o ícone não renderiza no cabeçalho. | manual (Playwright, se houver conta de teste vazia) ou leitura de código (`vehicles.length === 0` early return) |
| AC-4 | Screenshot de "Minha Garagem" — confirmar ausência do card antigo. | manual (Playwright) |
| AC-5 | Conta de teste com 2+ veículos — conferir presença de todos os indicadores e do gráfico. | manual (Playwright) |
| AC-6 | Filtrar/simular 1 veículo só — conferir que o painel não aparece. | manual (Playwright com conta de 1 veículo, ou leitura de código do gate) |
| AC-7 | Veículo com `current_odometer_km: null` na conta de teste — conferir que o km total não conta esse veículo como 0. | manual (leitura do cálculo + Playwright se a conta de teste tiver esse caso) |
| AC-8 | Veículo com `financialSummary` nulo ou `cost_per_km` nulo — conferir que a média exclui esse veículo. | manual (leitura do cálculo + Playwright se a conta de teste tiver esse caso) |
| AC-9 | Mais de 8 veículos — conferir 8 barras individuais + "Outros". A conta de teste já tem 18 veículos, então é verificável direto. | manual (Playwright) |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Cabeçalho fica apertado em 320-390px com o ícone a mais | Overflow horizontal ou ícones cortados no mobile | Screenshot real em 320/390px antes de fechar a fase; reaproveitar o mesmo `Button size="icon"` e gap já usados pelos outros itens do cabeçalho. |
| Cálculo de custo/km médio distorcido se tratar veículo sem dado como zero | Métrica exibida fica artificialmente baixa | Filtrar `cost_per_km != null` antes de somar/dividir (AC-8), coberto na implementação e na verificação. |

## 8. Rollback

Mudança é só de UI/apresentação, sem migration nem dado persistido novo.
Reverter é `git revert` do merge desta fase — nenhum dado fica em estado
inconsistente.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] `tsc --noEmit` passa
- [ ] `eslint` passa
- [ ] Verificação visual real (Playwright) em 390px e 1440px, sem overflow
- [ ] `GarageActivityFeed.tsx` removido e sem referências soltas
