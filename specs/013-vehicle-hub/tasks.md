# Tasks 013 — Home do veículo como hub

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Criar `VehicleMetricsRow` (4 tiles: km/custo-km/total-investido mono, alertas sans) | `src/features/dashboard/VehicleMetricsRow.tsx` | AC-1, AC-2, AC-3 | — | ☑ |
| 2 | Criar `QuickActionsRow` (4 botões + 4 diálogos já existentes) | `src/features/dashboard/QuickActionsRow.tsx` | AC-4, AC-5, AC-9 | — | ☑ |
| 3 | Remover `total_invested`/`cost_per_km` de `FinancialSummaryCard` | `src/features/dashboard/FinancialSummaryCard.tsx` | AC-8 | — | ☑ |
| 4 | Integrar tudo em `VehiclePage` (hooks novos, faixas novas, timeline+pendências, reordenar) | `src/features/vehicle/VehiclePage.tsx` | AC-1..9 | 1, 2, 3 | ☑ |
| 5 | `npm run build` + `npm run lint` | repo inteiro | todos | 4 | ☑ |
| 6 | Verificação Playwright (9 ACs, conta `e2e-test@dev.local`) | — | AC-1..9 | 5 | ☑ |
| 7 | Mover proposta 2 de "em aberto" pra decidida em `docs/DESIGN.md` | `docs/DESIGN.md` | — | 6 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| Nenhum | — | — |
