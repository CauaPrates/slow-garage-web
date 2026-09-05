# Tasks 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Criar `HeaderActivityMenu` (ícone + popover, mesmo padrão do `HeaderAlertsMenu`, conteúdo migrado de `GarageActivityFeed`, agrupado por veículo) | `src/components/layout/HeaderActivityMenu.tsx` | AC-1, AC-2, AC-3, RN-3 | — | ☑ |
| 2 | Plugar `HeaderActivityMenu` no cabeçalho ao lado do sino de alertas | `src/components/layout/AppShell.tsx` | AC-1, AC-3 | 1 | ☑ |
| 3 | Criar `VehicleInvestmentChart` (barra horizontal, top 8 + "Outros", mesmo padrão do `ExpensesByCategoryChart`) | `src/features/dashboard/VehicleInvestmentChart.tsx` | AC-9 | — | ☑ |
| 4 | Criar `GarageComparisonDashboard` (tiles agregados + chart do passo 3, gate `vehicles.length >= 2`, exclui `null` de médias) | `src/features/vehicle/GarageComparisonDashboard.tsx` | AC-5, AC-6, AC-7, AC-8, RN-1, RN-2 | 3 | ☑ |
| 5 | Trocar `GarageActivityFeed` por `GarageComparisonDashboard` em "Minha Garagem" | `src/features/vehicle/VehicleListPage.tsx` | AC-4, AC-5, AC-6 | 2, 4 | ☑ |
| 6 | Remover `GarageActivityFeed.tsx` (sem mais consumidor) | `src/features/vehicle/GarageActivityFeed.tsx` | AC-4 | 5 | ☑ |
| 7 | `tsc --noEmit` + `eslint` limpos | — | — | 1-6 | ☑ |
| 8 | Verificação visual real (Playwright, login com conta de teste) em 390px e 1440px: popover de atividade em página fora de "Minha Garagem", painel comparativo, ausência do card antigo, sem overflow no cabeçalho | — | AC-1 a AC-9 | 7 | ☑ |
| 9 | **(015b)** Criar `SidebarActivityFeed` (itens compactos, agrupado por veículo, mesma fonte de dado) | `src/components/layout/SidebarActivityFeed.tsx` | AC-1, AC-2, AC-3, RN-3, RN-4 | — | ☑ |
| 10 | **(015b)** Plugar `SidebarActivityFeed` na sidebar, recebendo `vehicles` como prop | `src/components/layout/Sidebar.tsx` | AC-1, AC-1c | 9 | ☑ |
| 11 | **(015b)** Passar `vehicles` para `Sidebar` e restringir `HeaderActivityMenu` a abaixo de `lg` | `src/components/layout/AppShell.tsx` | AC-1b, AC-1c, RN-4 | 10 | ☑ |
| 12 | **(015b)** `tsc --noEmit` + `eslint` limpos | — | — | 9-11 | ☑ |
| 13 | **(015b)** Verificação visual real (Playwright): sidebar mostra atividade sem clique em 1440px e ícone do cabeçalho some; popover do cabeçalho continua funcionando em 390px e sidebar não existe nesse tamanho; sem overflow | — | AC-1, AC-1b, AC-1c | 12 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
