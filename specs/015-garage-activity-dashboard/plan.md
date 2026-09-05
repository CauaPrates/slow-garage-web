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

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Manter `GarageActivityFeed` como está e só adicionar o painel novo em outro ponto da tela | O usuário pediu explicitamente pra tirar a atividade recente daquele espaço e usá-lo pro painel novo — manter os dois deixaria a tela do mesmo tamanho de antes. |
| Atividade recente virar uma rota/página própria (`/atividades`) | Contraria o pedido explícito: "não vai ser uma aba que vão clicar e abrir uma página" — o padrão certo é popover, igual ao sino de alertas. |
| Nova view/RPC no Postgres para agregar métricas de frota (km total, custo/km médio, gasto do mês) | Os dados já vêm por veículo via `useVehicles`; com o volume esperado (poucos veículos por usuário) agregar no cliente é suficiente e evita migration só pra isto. |
| Biblioteca de gráfico (recharts, visx, etc.) pro gráfico comparativo | O projeto inteiro já resolve gráfico com barras em `div` + token de cor (`ExpensesByMonthChart`, `ExpensesByCategoryChart`) — inconsistente introduzir uma dependência nova pra um gráfico a mais do mesmo tipo. |

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
| `src/features/vehicle/VehicleListPage.tsx` | modificar | Remove import/uso de `GarageActivityFeed`; adiciona `GarageComparisonDashboard` no mesmo lugar. |
| `src/features/vehicle/GarageComparisonDashboard.tsx` | criar | Tiles agregados (contagem de veículos, km total, custo/km médio, gasto do mês) + `VehicleInvestmentChart`, gate `vehicles.length >= 2`. |
| `src/features/dashboard/VehicleInvestmentChart.tsx` | criar | Barra horizontal comparando `total_invested` por veículo, top 8 + "Outros", mesmo padrão do `ExpensesByCategoryChart`. |

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
