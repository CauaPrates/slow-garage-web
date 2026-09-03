# Tasks 005 — Abastecimento e métricas de consumo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Mensagem específica de odômetro duplicado | `src/lib/postgresErrors.ts` | AC-5 | — | ☑ |
| 2 | Schema zod de abastecimento | `src/features/fuel/schemas.ts` | AC-3, AC-4 | — | ☑ |
| 3 | Hooks de abastecimento (leitura via view + CRUD) | `src/features/fuel/useFuelLogs.ts` | AC-1, AC-2, AC-6, AC-7, AC-9, AC-10 | 1, 2 | ☑ |
| 4 | Hook de resumo de consumo | `src/features/fuel/useVehicleFuelSummary.ts` | AC-8 | — | ☑ |
| 5 | Formulário de abastecimento (com `Controller` pro toggle) | `src/features/fuel/FuelLogForm.tsx` | AC-2, AC-3, AC-4, AC-9 | 2 | ☑ |
| 6 | Card de resumo | `src/features/fuel/FuelSummaryCard.tsx` | AC-8 | 4 | ☑ |
| 7 | Item de lista (km/L, custo/km ou "—") | `src/features/fuel/FuelLogListItem.tsx` | AC-6, AC-7, AC-9 | 3 | ☑ |
| 8 | Diálogos criar/editar/excluir | `src/features/fuel/{Create,Edit,Delete}FuelLogDialog.tsx` | AC-2, AC-5, AC-9, AC-10 | 5 | ☑ |
| 9 | Página de abastecimentos (4 estados + `?novo=1`) | `src/features/fuel/FuelLogsPage.tsx` | AC-1, AC-8, AC-11 | 6, 7, 8 | ☑ |
| 10 | Rota + navegação (`Abastecimentos`/`Abastecimento`) | `src/lib/routes.ts`, `src/lib/navigation.ts`, `src/app/router.tsx` | AC-11, AC-12, AC-13 | 9 | ☑ |
| 11 | `docs/DESIGN.md` + `docs/DECISIONS.md` | — | — | 10 | ☑ |
| 12 | `tsc -b`, lint, build | — | todos | 1-10 | ☑ |
| 13 | Verificação manual completa contra o Supabase de dev + limpeza | `specs/005-fuel/verification.md` | todos | 12 | ☑ |
| 14 | Commit em `feature/005-fuel` + merge `--no-ff` em `dev` | — | — | 13 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
