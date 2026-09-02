# Tasks 002 — Minha Garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Instalar `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog` | `package.json` | pré-requisito | — | ☐ |
| 2 | `components/ui/dialog.tsx` | `src/components/ui/dialog.tsx` | pré-requisito | 1 | ☐ |
| 3 | `components/ui/alert-dialog.tsx` | `src/components/ui/alert-dialog.tsx` | pré-requisito | 1 | ☐ |
| 4 | `components/ui/select.tsx` (sobre `<select>` nativo) | `src/components/ui/select.tsx` | pré-requisito | — | ☐ |
| 5 | `components/ui/textarea.tsx` (sobre `<textarea>` nativo) | `src/components/ui/textarea.tsx` | pré-requisito | — | ☐ |
| 6 | Schemas zod (criar, detalhes, arquivo de foto) | `src/features/vehicle/schemas.ts` | AC-2, AC-3, AC-4, AC-7, AC-8 | — | ☐ |
| 7 | `useVehicles`, `useCreateVehicle`, `useUpdateVehicle`, `useDeleteVehicle` | `src/features/vehicle/useVehicles.ts` | AC-1, AC-2, AC-8, AC-10, AC-11, AC-12, AC-13 | — | ☐ |
| 8 | `useUploadVehiclePhoto` | `src/features/vehicle/useVehiclePhoto.ts` | AC-6, AC-7 | 7 | ☐ |
| 9 | `VehicleForm` (obrigatórios + `<details>` "mais detalhes" + status) | `src/features/vehicle/VehicleForm.tsx` | AC-2, AC-3, AC-4, AC-8 | 4, 5, 6 | ☐ |
| 10 | `VehiclePhotoUpload` | `src/features/vehicle/VehiclePhotoUpload.tsx` | AC-6, AC-7 | 8 | ☐ |
| 11 | `CreateVehicleDialog` | `src/features/vehicle/CreateVehicleDialog.tsx` | AC-2 | 2, 7, 9 | ☐ |
| 12 | `EditVehicleDialog` | `src/features/vehicle/EditVehicleDialog.tsx` | AC-8 | 2, 7, 9, 10 | ☐ |
| 13 | `DeleteVehicleDialog` | `src/features/vehicle/DeleteVehicleDialog.tsx` | AC-9, AC-10 | 3, 7 | ☐ |
| 14 | `VehicleCard` (foto/placeholder, dados, menu editar/excluir) | `src/features/vehicle/VehicleCard.tsx` | AC-5, AC-12 | 11, 12, 13 | ☐ |
| 15 | `VehicleListPage` (estados vazio/loading/erro/sucesso) | `src/features/vehicle/VehicleListPage.tsx` | AC-1, AC-13 | 14 | ☐ |
| 16 | `app/router.tsx` — índice de `/` vira `VehicleListPage` | `src/app/router.tsx` | pré-requisito | 15 | ☐ |
| 17 | Atualizar `docs/DESIGN.md` (densidade de card e diálogo) | `docs/DESIGN.md` | entrega documental | 16 | ☐ |
| 18 | Atualizar `docs/DECISIONS.md` com os ADRs desta fase | `docs/DECISIONS.md` | entrega documental | 16 | ☐ |
| 19 | Verificação manual completa dos 13 ACs com `alice@dev.local`/`bob@dev.local` | — | todos | 16 | ☐ |
| 20 | Build, `tsc --noEmit`, lint, `ui:check`; escrever `specs/002-garage/verification.md` | `specs/002-garage/verification.md` | AC-11 (+ consolida) | 19 | ☐ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum bloqueio conhecido no momento.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
