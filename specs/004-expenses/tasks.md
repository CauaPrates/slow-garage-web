# Tasks 004 — Gastos do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Extrair helpers de validação numérica para local compartilhado | `src/lib/schemaHelpers.ts`, `src/features/vehicle/schemas.ts` | — | — | ☑ |
| 2 | Criar tradutor de erro Postgres | `src/lib/postgresErrors.ts` | AC-3, AC-4, AC-9, AC-10 | — | ☑ |
| 3 | Schema zod de gasto + labels + mapa ícone-categoria | `src/features/expense/schemas.ts` | AC-3, AC-4 | 1 | ☑ |
| 4 | Hook de categorias | `src/features/expense/useExpenseCategories.ts` | AC-5 | — | ☑ |
| 5 | Hooks de gasto (fetch batelado + CRUD, exclusão em cascata do anexo) | `src/features/expense/useExpenses.ts` | AC-1, AC-2, AC-5, AC-6, AC-7, AC-8, AC-9 | 2, 3 | ☑ |
| 6 | Hooks de anexo (upload com troca, remoção) | `src/features/expense/useExpenseAttachment.ts` | AC-10, AC-11, AC-12 | 2 | ☑ |
| 7 | Hook `useCurrentVehicleId` | `src/hooks/useCurrentVehicleId.ts` | AC-13, AC-14, AC-15 | — | ☑ |
| 8 | Generalizar `NavItem`/rotas de veículo | `src/lib/navigation.ts`, `src/lib/routes.ts` | AC-13, AC-14, AC-15 | 7 | ☑ |
| 9 | Atualizar `Sidebar` e `AddActionSheet` para nav dinâmica | `src/components/layout/Sidebar.tsx`, `src/components/layout/AddActionSheet.tsx` | AC-13, AC-14, AC-15 | 8 | ☑ |
| 10 | Formulário de gasto | `src/features/expense/ExpenseForm.tsx` | AC-2, AC-3, AC-4, AC-8 | 3 | ☑ |
| 11 | Campo de anexo (ver/anexar/trocar/remover) | `src/features/expense/ExpenseAttachmentField.tsx` | AC-10, AC-11, AC-12 | 6 | ☑ |
| 12 | Item de lista | `src/features/expense/ExpenseListItem.tsx` | AC-2, AC-5, AC-8 | 3 | ☑ |
| 13 | Filtros (categoria + período) | `src/features/expense/ExpenseFilters.tsx` | AC-5, AC-6, AC-7 | 4 | ☑ |
| 14 | Diálogos criar/editar/excluir | `src/features/expense/{Create,Edit,Delete}ExpenseDialog.tsx` | AC-2, AC-8, AC-9, AC-10, AC-11, AC-12 | 10, 11 | ☑ |
| 15 | Página de gastos (4 estados + `?novo=1`) | `src/features/expense/ExpensesPage.tsx` | AC-1, AC-7, AC-13 | 12, 13, 14 | ☑ |
| 16 | Ligar rota `v/:vehicleId/gastos` | `src/app/router.tsx` | AC-13, AC-15 | 15 | ☑ |
| 17 | `docs/DESIGN.md` + `docs/DECISIONS.md` | — | — | 9, 16 | ☑ |
| 18 | `tsc`, lint, build | — | todos | 1-16 | ☑ |
| 19 | Revalidar Fase 3 (sidebar/bottom nav/folha) após a generalização | — | — | 18 | ☑ |
| 20 | Verificação manual completa contra o Supabase de dev + limpeza do dado de teste | `specs/004-expenses/verification.md` | todos | 19 | ☑ |
| 21 | Commit em `feature/004-expenses` + merge `--no-ff` em `dev` | — | — | 20 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
