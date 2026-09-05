# Tasks 012 — Papel tipográfico mono para número de medição

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Instalar `@fontsource/jetbrains-mono`, importar `latin-400.css`, declarar `--font-mono` e expor no `@theme inline` | `package.json`, `src/styles/globals.css`, `src/styles/tokens.css` | AC-1..4 | — | ☑ |
| 2 | `font-mono` no odômetro do cabeçalho | `src/features/vehicle/VehiclePage.tsx` | AC-4 | 1 | ☑ |
| 3 | `font-mono` nos 8 `<dd>` do card financeiro | `src/features/dashboard/FinancialSummaryCard.tsx` | AC-1 | 1 | ☑ |
| 4 | `font-mono` nos 5 `<dd>` do resumo de combustível do dashboard | `src/features/dashboard/FuelSummarySection.tsx` | AC-2 | 1 | ☑ |
| 5 | `font-mono` nos 4 `<dd>` do resumo de combustível da página de abastecimentos | `src/features/fuel/FuelSummaryCard.tsx` | AC-3 | 1 | ☑ |
| 6 | `npm run build` + `npm run lint` | repo inteiro | todos | 2-5 | ☑ |
| 7 | Verificação Playwright (computed font-family nos alvos e nos negativos) | — | AC-1..6 | 6 | ☑ |
| 8 | Mover a proposta 1 de "em aberto" pra decidida em `docs/DESIGN.md` | `docs/DESIGN.md` | — | 7 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| Nenhum | — | — |
