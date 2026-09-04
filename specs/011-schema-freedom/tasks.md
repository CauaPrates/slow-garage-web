# Tasks 011 — Liberdade de preenchimento (schema-freedom no front)

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Relaxar `noteSchema` (`title`, `occurredOn` → opcional) | `src/features/timeline/schemas.ts` | AC-5 | — | ☑ |
| 2 | Rótulo `"(opcional)"` em Título; payload `title ?? null` no create/edit; `toFormDefaults` com `title ?? undefined` | `src/features/timeline/NoteForm.tsx`, `CreateNoteDialog.tsx`, `EditNoteDialog.tsx` | AC-5 | 1 | ☑ |
| 3 | Relaxar `issueSchema.reportedOn` → opcional | `src/features/issue/schemas.ts` | AC-9 | — | ☑ |
| 4 | Confirmar que `IssueForm`/dialogs não precisam de mudança adicional (campo star, já pré-preenchido) | `src/features/issue/IssueForm.tsx` (inspeção) | AC-9 | 3 | ☑ |
| 5 | Relaxar `expenseSchema` (`categoryId`, `description` → opcional; `occurredOn` → opcional) | `src/features/expense/schemas.ts` | AC-3 | — | ☑ |
| 6 | `<option>` de categoria vazia deixa de ser `disabled`, texto "Sem categoria"; rótulo `"(opcional)"` em Descrição | `src/features/expense/ExpenseForm.tsx` | AC-3, AC-4 | 5 | ☑ |
| 7 | Payload `categoryId`/`description` com `?? null` no create/edit; `toFormDefaults` com `?? undefined` | `src/features/expense/CreateExpenseDialog.tsx`, `EditExpenseDialog.tsx` | AC-3 | 6 | ☑ |
| 8 | Relaxar `documentSchema.docType` e `obligationSchema.kind` → `optionalEnum` (sem mudança de JSX) | `src/features/document/schemas.ts` | AC-14 | — | ☑ |
| 9 | Relaxar `obligationSchema.dueOn` → opcional | `src/features/document/schemas.ts` | AC-10, AC-11 | — | ☑ |
| 10 | Rótulo `"(opcional)"` em Vencimento; payload `dueOn ?? null` no create/edit; `toFormDefaults` com `dueOn ?? undefined` | `src/features/document/ObligationForm.tsx`, `CreateObligationDialog.tsx`, `EditObligationDialog.tsx` | AC-10, AC-11 | 9 | ☑ |
| 11 | Relaxar `maintenanceRecordSchema` (`odometerKm`, `performedOn` → opcional); **não tocar** `maintenanceItemSchema` | `src/features/maintenance/schemas.ts` | AC-8 | — | ☑ |
| 12 | Rótulo `"(opcional)"` em Quilometragem; payload `odometerKm ?? null` no create/edit; `toFormDefaults` com guarda `!= null` (corrige bug `String(null)`) | `src/features/maintenance/MaintenanceRecordForm.tsx`, `CreateMaintenanceRecordDialog.tsx`, `EditMaintenanceRecordDialog.tsx` | AC-8 | 11 | ☑ |
| 13 | Relaxar `fuelLogSchema` (`odometerKm` → opcional; `fuelType`/`occurredOn` → opcional) | `src/features/fuel/schemas.ts` | AC-6, AC-7 | — | ☑ |
| 14 | Rótulo `"(opcional)"` em Quilometragem; payload `odometerKm ?? null` no create/edit; `toFormDefaults` com guarda `!= null` (corrige bug `String(null)`) | `src/features/fuel/FuelLogForm.tsx`, `CreateFuelLogDialog.tsx`, `EditFuelLogDialog.tsx` | AC-6, AC-7 | 13 | ☑ |
| 15 | Relaxar `vehicleSchema` (`modelYear`, `currentOdometerKm`, `purchaseDate`, `purchasePrice` → opcional; `fuelType`/`transmission` → `optionalEnum`) | `src/features/vehicle/schemas.ts` | AC-1, AC-2 | — | ☑ |
| 16 | Rótulo `"(opcional)"` nos 6 campos relaxados | `src/features/vehicle/VehicleForm.tsx` | AC-1 | 15 | ☑ |
| 17 | Payload dos 4 campos genuinamente nullable com `?? null` no create/edit; `toFormDefaults` com guarda `!= null` nos 3 `String(x)` + `purchaseDate ?? undefined` (corrige bug `String(null)`) | `src/features/vehicle/CreateVehicleDialog.tsx`, `EditVehicleDialog.tsx` | AC-1, AC-2 | 16 | ☑ |
| 18 | Relaxar `financingSchema` (`financedAmount`, `installmentAmount`, `installmentCount` → opcional; `.refine()` cruzado tolera `installmentCount` vazio) | `src/features/document/schemas.ts` | AC-12, AC-13 | — | ☑ |
| 19 | Rótulo `"(opcional)"` nos 3 campos relaxados; payload com `?? null` no create/edit; `toFormDefaults` com guarda `!= null` nos 3 `String(x)` (corrige bug `String(null)`) | `src/features/document/FinancingForm.tsx`, `CreateFinancingDialog.tsx`, `EditFinancingDialog.tsx` | AC-12, AC-13 | 18 | ☑ |
| 20 | Confirmar por inspeção que `total_invested`/`cost_per_km`/`km_per_liter`/`maintenance_status` já tratam `null`/`"ok"` corretamente (sem mudança de código) | `VehicleCard.tsx`, `FinancialSummaryCard.tsx`, `FuelSummaryCard.tsx`, `FuelLogListItem.tsx`, `MaintenanceItemCard.tsx`, `MaintenancePage.tsx` (inspeção) | AC-18, AC-19 | — | ☑ |
| 21 | Rodar `npm run build` e `npm run lint`, corrigir o que quebrar | repo inteiro | todos | 1-19 | ☑ |
| 21a | Regenerar `database.types.ts` contra o Supabase real (achado: precisava de `db push` do backend, aplicado durante esta fase — ver plan.md §3) | `src/types/database.types.ts` | todos | — | ☑ |
| 21b | Corrigir 8 pontos de leitura direta de coluna agora nullable que `tsc -b` acusou (fora dos 3 campos calculados já auditados) | `useDocuments.ts`, `FinancingCard.tsx`, `ObligationListItem.tsx`, `ExpensesPage.tsx`, `MaintenancePage.tsx`, `MaintenanceRecordListItem.tsx`, `VehicleCard.tsx`, `VehiclePage.tsx` | AC-19 | 21a | ☑ |
| 22 | Verificação manual dos fluxos críticos contra o app rodando | — | AC-1,2,3,4,6,7,9,10,11,12,13,14,15,16,17,18,19 | 21 | ✖ |
| 23 | Incorporar `CHANGES_FOR_FRONTEND.md` a esta spec/verification e apagar o arquivo da raiz | `CHANGES_FOR_FRONTEND.md` | — | 22 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

**Task 22 bloqueada**: não há credencial de login para este projeto Supabase disponível nesta sessão, e o próprio app exige confirmação de e-mail antes do primeiro login (ADR-012/ADR-016) — não é possível criar uma conta de teste nova e confirmá-la sem acesso a uma caixa de e-mail real. Todos os 19 ACs que dependem de fluxo manual ficam `⬜ não verificado` em `verification.md`, com o passo a passo exato para o humano rodar. A verificação automática (`tsc -b`, `eslint`) cobre a parte estrutural — não substitui o teste funcional.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| `documents.doc_type` fazia parte de `CHANGES_FOR_FRONTEND.md` mas não tinha sido incluído no briefing inicial da fase | Corte manual ao resumir a lista de entidades pro agente de pesquisa | Incorporado ao escopo (tasks 8) — está descrito no documento fonte, não é invenção de requisito |
| 4 arquivos com `String(valor)` sem guarda de `null` em `toFormDefaults`, que quebrariam com `"null"` literal assim que o backend devolvesse `null` de verdade | Encontrado por auditoria de código durante o plano, não estava listado no documento do backend (que descreve schema de banco, não código de front) | Incorporado ao escopo (parte das tasks 12, 14, 17, 19) — é consequência direta e inevitável da mudança pedida, não escopo novo |
| `database.types.ts` local não refletia a migration do backend na primeira checagem — a migration ainda não tinha sido aplicada no projeto Supabase que o `.env` deste repo aponta | Só descoberto ao regenerar os tipos contra o banco real antes de editar qualquer schema Zod | Pausado, reportado ao usuário via pergunta direta; usuário rodou `db push`; regeneração confirmada e implementação retomada — ver plan.md §3 |
| 8 pontos de leitura direta de coluna (fora dos 3 campos calculados já auditados) que `tsc -b` acusou como quebrados com a coluna agora nullable | `tsc -b` com `strict: true` pegou automaticamente — não fazia parte do documento do backend nem da auditoria manual inicial | Incorporado ao escopo (task 21b) — mesma lógica: consequência inevitável da mudança, não escopo novo |
