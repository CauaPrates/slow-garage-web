# Plano 004 — Gastos do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Uma nova feature `features/expense/` segue exatamente o padrão de CRUD
já validado em `features/vehicle/` (Fase 2): hook de leitura batelada,
`useMutation` por operação, diálogo compartilhado create/edit, formulário
único com campos obrigatórios sempre visíveis e opcionais atrás de
"mais detalhes". O anexo replica `useUploadVehiclePhoto`, generalizado
para imagem **ou** PDF e para permitir remoção (a foto do veículo nunca
precisou de "remover", só "trocar"). A navegação criada na Fase 3 ganha
uma terceira forma de item (`to` como função do `vehicleId`), migração
retrocompatível — nenhum item existente muda de comportamento.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Formulário de gasto com anexo desde a criação | Anexo referencia `entity_id = expense.id`; exigiria criar o gasto "por baixo" antes de mostrar o formulário completo, ou um upload em dois passos escondido do usuário. Mais simples e mais consistente com o padrão já usado na foto do veículo: anexo só no editar |
| Somar `expenses` a `fuel_logs` no cliente para exibir "total do mês" | Violaria RN-2 do contrato do backend (não duplicar/misturar as duas fontes) e RN-4 desta spec. Qualquer agregação futura usa view/RPC, não soma no cliente |
| Contexto React para "veículo atual" (evitar `useMatch` em 2 componentes) | Contradiz RN-1 da Fase 3 (URL é a única fonte). `useMatch("/v/:vehicleId/*")` resolve o mesmo dado a partir da URL sem estado duplicado — 2 usos (Sidebar, AddActionSheet) justificam extrair um hook pequeno, não um Context |
| Manter `NavItem.to` só como `string \| null` e duplicar `Sidebar`/`AddActionSheet` com lógica própria pra item dependente de veículo | Reintroduziria a mesma navegação em dois lugares com regras sutilmente diferentes — o próprio ADR-022 já previa que fases futuras só trocariam o valor de `to`; generalizar o tipo é a extensão natural, não uma reescrita |
| Excluir o gasto primeiro, depois o anexo | Se a exclusão do anexo falhar depois do gasto já ter sido apagado, sobra arquivo/linha órfã sem dono — exatamente o problema encontrado e corrigido manualmente na Fase 3 (foto de teste órfã). Ordem invertida (anexo antes do gasto) garante que uma falha deixa o gasto intacto, nunca um órfão novo |
| Reimplementar helpers de validação numérica dentro de `features/expense/schemas.ts` | `requiredNonNegativeNumber`/`optionalNonNegativeNumber`/`optionalText` já existem (privados) em `features/vehicle/schemas.ts`; um segundo uso é exatamente o gatilho que o próprio projeto define para promover algo a compartilhado |

## 3. Impacto em contratos e dados

Nenhuma tabela, view, coluna, RPC ou bucket novo. Esta fase só **lê e
escreve** dentro do contrato já documentado (`expenses`,
`expense_categories`, `attachments`, bucket `vehicle-documents`).
`vehicle_financial_summary` (já consumida) passa a refletir dado real
assim que o primeiro gasto é criado — nenhuma mudança de como ela é
lida.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/schemaHelpers.ts` | criar | Promove `requiredNonNegativeInt`, `requiredNonNegativeNumber`, `optionalNonNegativeNumber`, `optionalText` de `vehicle/schemas.ts` (segundo uso: expenses) + nova `optionalNonNegativeInt` |
| `src/lib/postgresErrors.ts` | criar | `translatePostgresError(error)` — tabela de códigos da skill `slow-garage-data`, reaproveitável por toda fase futura |
| `src/features/vehicle/schemas.ts` | modificar | Importa os helpers de `lib/schemaHelpers.ts` em vez de defini-los localmente; nenhuma mudança de comportamento |
| `src/features/expense/schemas.ts` | criar | `expenseSchema`, `PAYMENT_METHODS`/labels, `PERIODS`/labels, `EXPENSE_CATEGORY_ICON_BY_SLUG` (+ fallback), `expenseAttachmentSchema` |
| `src/features/expense/useExpenseCategories.ts` | criar | `useExpenseCategories()` — lê as 12 (+ eventuais próprias, hoje nenhuma) categorias |
| `src/features/expense/useExpenses.ts` | criar | `fetchExpenses(vehicleId, filters)` (batelado com lookup de anexo, mesmo padrão de `fetchVehicles`), `useExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense` (RN-2) |
| `src/features/expense/useExpenseAttachment.ts` | criar | `useUploadExpenseAttachment(expenseId)` (RN-3: remove o antigo antes de subir o novo), `useRemoveExpenseAttachment(expenseId)` |
| `src/features/expense/ExpenseForm.tsx` | criar | Formulário único create/edit, campos obrigatórios + "mais detalhes", mesma estrutura do `VehicleForm` |
| `src/features/expense/ExpenseAttachmentField.tsx` | criar | Ver/anexar/trocar/remover — só renderizado no modo editar |
| `src/features/expense/CreateExpenseDialog.tsx` | criar | Diálogo de criar, sem campo de anexo (RN-1) |
| `src/features/expense/EditExpenseDialog.tsx` | criar | Diálogo de editar, com `ExpenseAttachmentField` |
| `src/features/expense/DeleteExpenseDialog.tsx` | criar | Confirmação, mesmo padrão do `DeleteVehicleDialog` |
| `src/features/expense/ExpenseFilters.tsx` | criar | Selects de categoria e período, grid `grid-cols-1 sm:grid-cols-2` (ADR-019) |
| `src/features/expense/ExpenseListItem.tsx` | criar | Linha da lista: categoria, descrição, valor, data, ações |
| `src/features/expense/ExpensesPage.tsx` | criar | Rota `/v/:vehicleId/gastos` — 4 estados, filtro, lista, lê `?novo=1` pra auto-abrir o diálogo de criar |
| `src/hooks/useCurrentVehicleId.ts` | criar | `useMatch("/v/:vehicleId/*")` encapsulado — usado por `Sidebar` e `AddActionSheet` |
| `src/lib/navigation.ts` | modificar | `NavItem.to` aceita `string \| null \| ((vehicleId: string) => string)`; item "Gastos" (sidebar) e "Gasto" (folha) passam a resolver rota real; `ADD_SHEET_ITEMS` reaproveita `NavItem` (remove `AddSheetItem` duplicado) |
| `src/components/layout/Sidebar.tsx` | modificar | Resolve `to` dinâmico via `useCurrentVehicleId`; distingue motivo "Em breve" de "Selecione um veículo" |
| `src/components/layout/AddActionSheet.tsx` | modificar | Item com `to` resolvido vira `Link` que fecha a folha ao navegar; mesma distinção de motivo desabilitado |
| `src/lib/routes.ts` | modificar | `vehicleExpenses: (id: string) => \`/v/${id}/gastos\`` |
| `src/app/router.tsx` | modificar | Rota filha `v/:vehicleId/gastos` → `ExpensesPage` |
| `docs/DESIGN.md` | modificar | Densidade da linha de lista de gasto, do filtro, do campo de anexo |
| `docs/DECISIONS.md` | modificar | ADRs: generalização de `NavItem`; ordem de exclusão anexo-antes-do-gasto; helpers de zod promovidos |

## 5. Ordem de execução

1. `lib/schemaHelpers.ts` (extração) → `vehicle/schemas.ts` (ajuste de import) → confirma `tsc`/testes da Fase 2 continuam passando
2. `lib/postgresErrors.ts`
3. `expense/schemas.ts` (dado antes de interface)
4. `expense/useExpenseCategories.ts`, `expense/useExpenses.ts`, `expense/useExpenseAttachment.ts` (contrato de dado antes do consumidor)
5. `hooks/useCurrentVehicleId.ts`
6. `lib/navigation.ts` + `lib/routes.ts` (contrato de navegação antes dos componentes que o usam)
7. `Sidebar.tsx`, `AddActionSheet.tsx` (consomem a navegação nova)
8. `ExpenseForm.tsx`, `ExpenseAttachmentField.tsx`, `ExpenseListItem.tsx`, `ExpenseFilters.tsx` (peças de UI)
9. `CreateExpenseDialog.tsx`, `EditExpenseDialog.tsx`, `DeleteExpenseDialog.tsx` (compõem as peças)
10. `ExpensesPage.tsx` (compõe tudo)
11. `router.tsx` (liga a rota)
12. `docs/DESIGN.md`, `docs/DECISIONS.md`
13. Verificação manual + `tsc`/lint/build contra o Supabase de dev real

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Veículo novo (criado na própria verificação) sem gasto → conferir estado vazio | manual |
| AC-2 | Criar gasto com os 4 campos, conferir topo da lista + total do header mudou | manual |
| AC-3 | Tentar salvar sem cada campo obrigatório, um de cada vez, conferir recusa + nenhuma chamada de rede (DevTools) | manual |
| AC-4 | Valor negativo e km negativo, conferir recusa no cliente | manual |
| AC-5 | 2+ categorias com gasto, filtrar por uma, conferir lista | manual |
| AC-6 | Gasto neste mês + gasto em mês anterior (criado com `occurred_on` retroativo), filtrar "Este mês"/"Tudo" | manual |
| AC-7 | Filtro sem resultado, conferir mensagem distinta do estado vazio | manual |
| AC-8 | Editar todos os campos de um gasto, conferir lista/total atualizados | manual |
| AC-9 | Excluir gasto com anexo, conferir sumiço da lista + ausência do arquivo no Storage (consulta direta) | manual |
| AC-10 | Anexar imagem e depois um `.txt`, conferir sucesso/recusa | manual |
| AC-11 | Trocar anexo, conferir só 1 arquivo remanescente no Storage | manual |
| AC-12 | Remover anexo sem trocar, conferir gasto intacto sem anexo | manual |
| AC-13 | Tocar "Gasto" dentro de `/v/:id`, conferir navegação + diálogo já aberto | manual |
| AC-14 | Abrir folha em `/` e em `/configuracoes`, conferir "Gasto" desabilitado com motivo certo | manual |
| AC-15 | Clicar "Gastos" na sidebar dentro do contexto de um veículo | manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `useMatch` não encontra o padrão certo se a rota mudar de forma (ex.: rota de gastos não começar com `/v/:vehicleId`) | Item de nav fica preso em "Selecione um veículo" mesmo dentro do veículo | Padrão `"/v/:vehicleId/*"` cobre qualquer sub-rota por design; testado manualmente em `/v/:id` e `/v/:id/gastos` |
| Exclusão de anexo em duas chamadas (Storage + tabela) sem transação | Falha parcial pode deixar arquivo removido mas linha viva, ou vice-versa | Ordem fixa (arquivo → linha) e RN-2 (gasto só é apagado se a limpeza do anexo teve sucesso); pior caso é ter que tentar de novo, nunca perder o gasto |
| `expenses.amount` sem constraint conhecida de "maior que zero" (contrato não documenta) | Cliente permite `0,00`, banco pode aceitar ou recusar | Mesmo helper (`>= 0`) já usado em `purchasePrice`/`estimatedCurrentValue` da Fase 2 — risco consistente com o já aceito, não um risco novo introduzido aqui |
| Migrar `NavItem.to` para aceitar função pode quebrar `Sidebar`/`BottomNav`/`AddActionSheet` da Fase 3 | Regressão em navegação já entregue | `tsc` pega qualquer uso não migrado (union type); reverificação manual da Fase 3 completa (sidebar/bottom nav/folha) antes de fechar esta fase |

## 8. Rollback

Todas as tabelas/bucket já existem e não são alteradas. Reverter é
`git revert` do(s) commit(s) da fase — sem migration, sem mudança de
schema. Dado real criado durante a verificação manual (gastos de teste)
é removido ao final, como já é praxe nas fases anteriores.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] Build, `tsc --noEmit` e lint passam
- [ ] Fase 3 (sidebar, bottom nav, folha "Adicionar") revalidada depois
      da generalização de `NavItem`
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` atualizados
- [ ] Dado de teste criado na verificação removido do Supabase de dev
- [ ] Commit em `feature/004-expenses` e merge `--no-ff` em `dev`,
      branch preservada
