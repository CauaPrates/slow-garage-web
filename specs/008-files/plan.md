# Plano 008 — Documentos, obrigações, financiamento e galeria de fotos

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia total já concedida pelo usuário para todas as fases) |

## 1. Abordagem

Uma feature nova `features/document/` cobre `documents`/`obligations`/`financings` numa única página `/v/:vehicleId/documentos` com 4 abas internas controladas por `?aba=` (documentos/obrigacoes/financiamento/fotos), reaproveitando o hook `useCurrentVehicleId`/padrão de página já usado desde a Fase 4. A aba "Fotos" vive na mesma feature mas consome `vehicle_photos` (já existe desde a Fase 2) através de um hook novo de galeria, sem tocar no fluxo de foto de capa já existente em `features/vehicle/`.

Em paralelo, o anexo (`attachments`) deixa de ser código específico de Gasto: nasce `features/attachment/` com hook e componente genéricos parametrizados por `entity_type`/`entity_id`, e `features/expense/` passa a consumir esse módulo compartilhado em vez de duplicar. Problema, item de projeto e execução de manutenção passam a usar o mesmo componente.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Quatro itens de sidebar separados (Documentos/Obrigações/Financiamento/Fotos) | O roadmap só reservou um slot (`to: null`) para "Documentos"; usuário confirmou preferência por abas internas numa página só |
| Manter `ExpenseAttachmentField`/`useExpenseAttachment` como estão e criar componente/hook **novo e paralelo** para as outras 3 entidades | Duplicaria 4x a mesma lógica de upload/remoção/signed-url; viola "reaproveitar é mais importante que ficar bonito" da própria skill SDD |
| Financiamento como formulário sempre visível (criar/editar no mesmo lugar, sem checar existência antes) | `financings.vehicle_id` é único no banco — path teria que tratar erro de unicidade toda vez; melhor checar existência antes e nunca oferecer "criar" quando já existe (RN-2) |
| "+1 parcela paga" como única forma de mudar `installments_paid` (sem edição manual) | Usuário pediu explicitamente os dois: ação rápida pro caso comum + campo editável pra corrigir erro de digitação, evitando 40 cliques pra desfazer um engano |
| Usar `@radix-ui/react-tabs` para as 4 abas | Só uma tela usa abas no projeto inteiro; ADR-007 já estabeleceu preferência por componente escrito à mão em vez de dependência nova quando o caso é simples — um `role="tablist"` com estado local resolve |

## 3. Impacto em contratos e dados

Nenhuma mudança de schema — `documents`, `obligations`, `financings` já existem no banco (backend congelado), assim como `attachment_entity_type` já incluía `issue`/`project_item`/`maintenance_record`/`note` desde antes desta fase (só não eram consumidos na UI). `database.types.ts` não muda.

Refatoração de `ExpenseAttachmentField`/`useExpenseAttachment` para consumir o módulo genérico é mudança de implementação, não de contrato — comportamento observável de Gasto continua idêntico (mesmo AC de anexo da Fase 4, reverificado nesta fase).

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/attachmentSchema.ts` | criar | `fileAttachmentSchema` (zod) extraído de `expense/schemas.ts` — validação de tipo/tamanho compartilhada |
| `src/features/attachment/useAttachment.ts` | criar | `fetchAttachmentsByEntity`, `useUploadAttachment`, `useRemoveAttachment`, `getAttachmentSignedUrl`, `deleteAttachmentIfExists` — genéricos por `entity_type` |
| `src/features/attachment/AttachmentField.tsx` | criar | Componente genérico (anexar/ver/trocar/remover), substitui `ExpenseAttachmentField` |
| `src/features/expense/useExpenseAttachment.ts` | remover | Substituído pelo módulo genérico |
| `src/features/expense/ExpenseAttachmentField.tsx` | remover | Substituído pelo componente genérico |
| `src/features/expense/EditExpenseDialog.tsx` | modificar | Passa a usar `AttachmentField`/`useAttachment` genéricos |
| `src/features/expense/useExpenses.ts` | modificar | `useDeleteExpense` passa a usar `deleteAttachmentIfExists` em vez de lógica própria duplicada |
| `src/features/expense/schemas.ts` | modificar | Remove `expenseAttachmentSchema` (migrado para `lib/attachmentSchema.ts`) |
| `src/features/issue/useIssues.ts` | modificar | `fetchIssues` passa a fazer join com anexo (mesmo padrão de `fetchExpenses`); `useDeleteIssue` limpa anexo antes de excluir |
| `src/features/issue/EditIssueDialog.tsx` | modificar | Adiciona `AttachmentField` como children do `IssueForm` |
| `src/features/issue/IssueForm.tsx` | modificar | Aceita `children?: ReactNode` (mesmo padrão de `ExpenseForm`) |
| `src/features/project/useProjectItems.ts` | modificar | `fetchProjectItems` com join de anexo; `useDeleteProjectItem` limpa anexo antes de excluir |
| `src/features/project/EditProjectItemDialog.tsx` | modificar | Adiciona `AttachmentField` |
| `src/features/project/ProjectItemForm.tsx` | modificar | Aceita `children?: ReactNode` |
| `src/features/maintenance/useMaintenanceRecords.ts` | modificar | `fetchMaintenanceRecords` com join de anexo; `useDeleteMaintenanceRecord` limpa anexo antes de excluir |
| `src/features/maintenance/EditMaintenanceRecordDialog.tsx` | modificar | Adiciona `AttachmentField` |
| `src/features/maintenance/MaintenanceRecordForm.tsx` | modificar | Aceita `children?: ReactNode` |
| `src/features/document/schemas.ts` | criar | zod: `documentSchema`, `obligationSchema`, `financingSchema`, `photoUploadSchema`; constantes `DOCUMENT_TYPES`/`OBLIGATION_KINDS`/labels pt-BR |
| `src/features/document/useDocuments.ts` | criar | CRUD `documents` + upload/exclusão de arquivo (mesmo bucket `vehicle-documents`) |
| `src/features/document/useObligations.ts` | criar | CRUD `obligations` + `useMarkObligationPaid` |
| `src/features/document/useFinancing.ts` | criar | `useFinancing(vehicleId)` (0 ou 1), create/update/delete, `useAddPaidInstallment` |
| `src/features/document/useVehicleGallery.ts` | criar | CRUD `vehicle_photos` para a galeria (upload com categoria, exclusão, definir como capa) — distinto de `useVehiclePhoto.ts` (que continua cuidando só do upload rápido de capa) |
| `src/features/document/DocumentForm.tsx` | criar | Formulário de documento (tipo, título, arquivo, validade, valor, notas) |
| `src/features/document/DocumentListItem.tsx` | criar | Linha da lista de documentos, com selo de vencimento |
| `src/features/document/CreateDocumentDialog.tsx` / `EditDocumentDialog.tsx` / `DeleteDocumentDialog.tsx` | criar | Diálogos padrão (mesmo formato das fases anteriores) |
| `src/features/document/ObligationForm.tsx` | criar | Formulário de obrigação |
| `src/features/document/ObligationListItem.tsx` | criar | Linha da lista, com badge pendente/paga e ação "Marcar como paga" |
| `src/features/document/CreateObligationDialog.tsx` / `EditObligationDialog.tsx` / `DeleteObligationDialog.tsx` / `MarkObligationPaidDialog.tsx` | criar | Diálogos |
| `src/features/document/FinancingForm.tsx` | criar | Formulário de financiamento |
| `src/features/document/FinancingCard.tsx` | criar | Card com progresso, saldo devedor, botão "+1 parcela paga" |
| `src/features/document/CreateFinancingDialog.tsx` / `EditFinancingDialog.tsx` / `DeleteFinancingDialog.tsx` | criar | Diálogos |
| `src/features/document/PhotoGallery.tsx` | criar | Grade de fotos com filtro por categoria |
| `src/features/document/PhotoCard.tsx` | criar | Item da grade (thumbnail via signed URL, categoria, ações) |
| `src/features/document/UploadPhotoDialog.tsx` | criar | Diálogo de upload com seletor de categoria |
| `src/features/document/DocumentsPage.tsx` | criar | Página com as 4 abas, trata `?aba=`/`?novo=1` |
| `src/lib/routes.ts` | modificar | `vehicleDocuments(vehicleId)` |
| `src/lib/navigation.ts` | modificar | "Documentos" (sidebar) e "Foto" (folha Adicionar) saem de `to: null` |
| `src/app/router.tsx` | modificar | Rota `v/:vehicleId/documentos` |
| `docs/API_CONTRACT.md` | não muda | Já documentava as 3 tabelas |
| `docs/DECISIONS.md` | modificar | ADR-035 em diante conforme decisões surgirem na implementação |
| `docs/DESIGN.md` | modificar | Notas de densidade da tela de abas, badge de vencimento/pendência |

## 5. Ordem de execução

1. `lib/attachmentSchema.ts` (extrai schema compartilhado) — nada depende dele quebrar
2. `features/attachment/useAttachment.ts` + `AttachmentField.tsx` (módulo genérico, testável isolado)
3. Migrar Gasto pro módulo genérico (`useExpenses.ts`, `EditExpenseDialog.tsx`), apagar os arquivos antigos — reverificar que Gasto continua idêntico antes de seguir
4. Aplicar `AttachmentField` em Problema, Item de projeto, Execução de manutenção (3 mudanças independentes entre si, qualquer ordem)
5. `features/document/schemas.ts` (contrato dos formulários, base pra tudo abaixo)
6. `useDocuments.ts` → `DocumentForm`/`DocumentListItem`/diálogos
7. `useObligations.ts` → `ObligationForm`/`ObligationListItem`/diálogos
8. `useFinancing.ts` → `FinancingForm`/`FinancingCard`/diálogos
9. `useVehicleGallery.ts` → `PhotoGallery`/`PhotoCard`/`UploadPhotoDialog`
10. `DocumentsPage.tsx` (junta as 4 abas)
11. `routes.ts`/`navigation.ts`/`router.tsx` (ativa a navegação por último, só depois da página existir)
12. `tsc -b` + lint + build
13. Verificação real (Playwright autenticado, screenshots 320/390/768/1440)
14. `docs/DECISIONS.md`/`docs/DESIGN.md`, `verification.md`, commit, merge

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 a AC-6 | Script Playwright: aba Documentos vazia → criar → validar selo de vencimento → ver via signed URL → excluir → upload inválido recusado | automático |
| AC-7 a AC-10 | Script Playwright: criar obrigação → marcar como paga → consultar `vehicle_alerts` direto no Supabase antes/depois → excluir | automático + consulta direta |
| AC-11 a AC-15 | Script Playwright: aba Financiamento vazia → criar → botão "+1 parcela" → editar `installments_paid` direto → checar `installments_remaining`/`outstanding_balance` lidos (não calculados) | automático |
| AC-16 a AC-19 | Script Playwright: galeria vazia → upload com categoria → filtro → definir como capa → conferir card da garagem → excluir foto capa → conferir `primary_photo_id` voltou a null | automático + consulta direta |
| AC-20 a AC-23 | Script Playwright: editar problema/item/execução existentes → anexar/ver/trocar/remover → excluir registro com anexo → consulta direta confirma que não sobrou linha órfã em `attachments` nem arquivo órfão no Storage | automático + consulta direta |
| AC-24, AC-25 | Screenshot + clique manual: item "Documentos" habilitado com veículo selecionado; item "Foto" abre aba Fotos com diálogo já aberto | manual (parte do script) |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Refatorar anexo de Gasto quebra o fluxo já em produção (mesmo que "produção" seja dev) | Regressão numa fase já fechada e mergeada | Rodar o mesmo roteiro de verificação de anexo (criar/ver/trocar/remover) contra Gasto logo após a migração, antes de tocar nas outras 3 entidades |
| 4 abas em 320px ficam apertadas ou cortam texto | Tela ilegível no celular, justamente o dispositivo alvo do app | Abas com `overflow-x-auto` e rótulo curto; screenshot 320px é gate de entrega, não opcional |
| `installments_remaining`/`outstanding_balance` podem vir `null` em algum caso de borda (juros nulo, etc.) e a tela tentar formatar `null` como número | Erro de runtime ou "R$ NaN" na tela | Sempre checar `!= null` antes de `formatMoney`, mesmo padrão já usado em `fuel_log_metrics`/`project_progress` desde as Fases 5 e 7 |
| Excluir foto de capa sem limpar `primary_photo_id` deixa o veículo "quebrado" (referência morta) | Card da garagem quebra ou mostra erro | `useDeleteGalleryPhoto` sempre verifica se a foto é a capa atual antes de excluir e limpa o campo na mesma operação (RN-5), verificado com consulta direta pós-exclusão |

## 8. Rollback

Sem migration — reverter é `git revert`/descartar a branch `feature/008-files` sem tocar no banco. Único cuidado: se algum arquivo de teste tiver subido pro bucket real `vehicle-documents`/`vehicle-photos` durante a verificação, a limpeza é manual (apagar veículo de teste, como já é rotina desde a Fase 4) — não depende de reverter código.

## 9. Definição de pronto

- [ ] Todos os ACs (AC-1 a AC-25) verificados com evidência em `verification.md`
- [ ] `npm run build` passa
- [ ] `tsc -b` sem erro
- [ ] `eslint` sem erro
- [ ] Verificação de Gasto (regressão do anexo) confirmada antes de fechar
- [ ] Screenshots 320/390/768/1440 revisados visualmente, sem overflow horizontal
- [ ] `docs/DECISIONS.md`/`docs/DESIGN.md` atualizados
- [ ] `feature/008-files` mergeada em `dev` (`--no-ff`), branch preservada
