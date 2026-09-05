# Tasks 006 — Manutenção preventiva e execução

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Schemas zod (item + execução) | `src/features/maintenance/schemas.ts` | AC-2, AC-3, AC-5 | — | ☑ |
| 2 | Hooks de item do plano (fetch batelado + CRUD) | `src/features/maintenance/useMaintenanceItems.ts` | AC-1, AC-2, AC-6, AC-7, AC-8, AC-9, AC-10 | 1 | ☑ |
| 3 | Hooks de execução | `src/features/maintenance/useMaintenanceRecords.ts` | AC-1, AC-4, AC-5, AC-8, AC-10 | 1 | ☑ |
| 4 | Hook de alertas | `src/features/maintenance/useVehicleAlerts.ts` | AC-1, AC-6 | — | ☑ |
| 5 | Banner de alertas | `src/features/maintenance/AlertBanner.tsx` | AC-1, AC-6 | 4 | ☑ |
| 6 | Card de item do plano | `src/features/maintenance/MaintenanceItemCard.tsx` | AC-2, AC-6, AC-7, AC-8, AC-9 | 2 | ☑ |
| 7 | Item de histórico | `src/features/maintenance/MaintenanceRecordListItem.tsx` | AC-4, AC-5, AC-8 | 3 | ☑ |
| 8 | Formulário de item do plano | `src/features/maintenance/MaintenanceItemForm.tsx` | AC-2, AC-3, AC-8, AC-9 | 1 | ☑ |
| 9 | Formulário de execução | `src/features/maintenance/MaintenanceRecordForm.tsx` | AC-4, AC-5, AC-8 | 1 | ☑ |
| 10 | Diálogos de item do plano | `src/features/maintenance/{Create,Edit,Delete}MaintenanceItemDialog.tsx` | AC-2, AC-8, AC-9, AC-10 | 8 | ☑ |
| 11 | Diálogos de execução | `src/features/maintenance/{Create,Edit,Delete}MaintenanceRecordDialog.tsx` | AC-4, AC-5, AC-8, AC-10 | 9 | ☑ |
| 12 | Página de manutenção (3 seções + banner + `?novo=1`) | `src/features/maintenance/MaintenancePage.tsx` | AC-1, AC-11 | 5, 6, 7, 10, 11 | ☑ |
| 13 | Rota + navegação | `src/lib/routes.ts`, `src/lib/navigation.ts`, `src/app/router.tsx` | AC-11, AC-12, AC-13 | 12 | ☑ |
| 14 | `docs/DESIGN.md` + `docs/DECISIONS.md` | — | — | 13 | ☑ |
| 15 | `tsc -b`, lint, build | — | todos | 1-13 | ☑ |
| 16 | Verificação manual completa contra o Supabase de dev + limpeza | `specs/006-maintenance/verification.md` | todos | 15 | ☑ |
| 17 | Commit em `feature/006-maintenance` + merge `--no-ff` em `dev` | — | — | 16 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
