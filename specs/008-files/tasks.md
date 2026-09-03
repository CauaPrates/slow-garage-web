# Tasks 008 — Documentos, obrigações, financiamento e galeria de fotos

Referência: ./plan.md §5. Uma task por vez, marcar ao concluir.

## Anexo genérico

- [x] T1 — Criar `lib/attachmentSchema.ts` (`fileAttachmentSchema`) — AC-6
- [x] T2 — Criar `features/attachment/useAttachment.ts` (fetch/upload/remove/signed-url genéricos) — AC-20, AC-21, AC-22, AC-23
- [x] T3 — Criar `features/attachment/AttachmentField.tsx` — AC-20, AC-21, AC-22
- [x] T4 — Migrar Gasto pro módulo genérico, apagar `useExpenseAttachment.ts`/`ExpenseAttachmentField.tsx`, atualizar `schemas.ts`/`EditExpenseDialog.tsx`/`useExpenses.ts` — regressão de Gasto (Fase 4)
- [x] T5 — Aplicar `AttachmentField` em Problema (`IssueForm`, `EditIssueDialog`, `useIssues.ts`) — AC-20, AC-23
- [x] T6 — Aplicar `AttachmentField` em Item de projeto (`ProjectItemForm`, `EditProjectItemDialog`, `useProjectItems.ts`) — AC-21, AC-23
- [x] T7 — Aplicar `AttachmentField` em Execução de manutenção (`MaintenanceRecordForm`, `EditMaintenanceRecordDialog`, `useMaintenanceRecords.ts`) — AC-22, AC-23

## Documentos

- [x] T8 — `features/document/schemas.ts` (documento, obrigação, financiamento, foto) — base
- [x] T9 — `useDocuments.ts` + `DocumentForm`/`DocumentListItem`/Create/Edit/Delete dialogs — AC-1 a AC-6

## Obrigações

- [x] T10 — `useObligations.ts` (+ `useMarkObligationPaid`) + `ObligationForm`/`ObligationListItem`/dialogs — AC-7 a AC-10

## Financiamento

- [x] T11 — `useFinancing.ts` (+ `useAddPaidInstallment`) + `FinancingForm`/`FinancingCard`/dialogs — AC-11 a AC-15

## Fotos

- [x] T12 — `useVehicleGallery.ts` + `PhotoGallery`/`PhotoCard`/`UploadPhotoDialog` — AC-16 a AC-19

## Página e navegação

- [x] T13 — `DocumentsPage.tsx` juntando as 4 abas, `?aba=`/`?novo=1` — AC-24, AC-25
- [x] T14 — `routes.ts`/`navigation.ts`/`router.tsx` — AC-24, AC-25

## Fechamento

- [x] T15 — `tsc -b` + lint + build limpos
- [x] T16 — Verificação real via Playwright (todos os ACs) + regressão de anexo de Gasto
- [x] T17 — `docs/DECISIONS.md`, `docs/DESIGN.md`, `specs/008-files/verification.md`
- [x] T18 — Commit + merge `--no-ff` em `dev`
