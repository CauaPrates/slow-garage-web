# Plano 011 — Liberdade de preenchimento (schema-freedom no front)

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia combinada com o usuário — ver `docs/DECISIONS.md` se registrado) |

## 1. Abordagem

Para cada uma das 9 entidades, trocar o helper de validação Zod de "obrigatório" para "opcional" exatamente nos campos listados em `CHANGES_FOR_FRONTEND.md`, sem tocar em layout de formulário (campo continua na mesma posição/seção), exceto: (a) adicionar `"(opcional)"` ao rótulo do campo relaxado, seguindo convenção já existente; (b) tornar reselecionável o "sem categoria" do gasto. Em paralelo, corrigir os 4 pontos de `toFormDefaults` que quebrariam com `null` genuíno (`String(null)` → `"null"` visível) e ajustar as mutations de edição para enviar `null` explícito nos campos genuinamente nullable (necessário pra "limpar" funcionar de verdade — diferente de campo com default, que deve continuar omitido). Nenhuma mudança em `maintenance_items`, nenhuma reestruturação de `<details>`, nenhuma mudança nos pontos de leitura de campo calculado (já tratam `null` corretamente, confirmado por auditoria).

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Mover todo campo relaxado para dentro da seção "Mais detalhes" | Reorganização visual maior que o pedido, não fica clara a fronteira entre "campo que mudou de posição por design" vs. "campo que mudou de obrigatoriedade" — arrisca inflar o escopo e o tempo desta fase sem pedido explícito. `CHANGES_FOR_FRONTEND.md` também não pede isso. |
| Adicionar `.optional()` genérico sem usar os helpers `optionalX`/`optionalEnum` já existentes | Os helpers já resolvem os casos de borda descobertos nas Fases 4-8 (string vazia de `<select>`, `NaN`, `Number.isInteger`) — reescrever a validação à mão reintroduziria bugs já corrigidos (ver ADR-026). |
| Enviar `?? null` em **todo** campo relaxado, inclusive os com default no banco (`fuel_type`, `transmission`, `doc_type`, `kind`) | Quebraria a constraint `NOT NULL` desses campos no update (RN-2) — `null` explícito é diferente de "não mandei". Descoberto lendo `CHANGES_FOR_FRONTEND.md` com atenção à seção "campos com `*`", não por tentativa e erro. |
| Não mexer nos 4 `toFormDefaults` com `String(x)` sem guarda, por não estarem no documento do backend | O documento do backend descreve o schema do banco, não o código do front — a auditoria de código encontrou que esses 4 pontos quebram (mostram `"null"` literal) assim que o backend começar a devolver `null` de verdade nesses campos, o que é exatamente o efeito desta mudança. Ignorar isso entregaria uma regressão visível no primeiro uso real. |

## 3. Impacto em contratos e dados

Nenhuma migration é escrita neste repositório — o banco é alterado do lado do backend. **Correção registrada durante o plano**: a suposição inicial de que `database.types.ts` não precisaria regenerar estava errada — nullability de coluna **muda** o tipo gerado por `supabase gen types` (`campo: T` vs `campo: T | null`), então o tipo committed precisa refletir o schema real depois da migration. Rodando `SUPABASE_PROJECT_ID=<ref> npm run types` (comando já documentado, ADR-011) contra o projeto do `.env` **antes** de qualquer edição de schema Zod, descobriu-se que a migration ainda não tinha sido aplicada nesse projeto — o tipo gerado saiu idêntico ao committed. Reportado ao usuário, que confirmou ter acabado de rodar `db push`; regerado de novo e confirmado que as 9 entidades batem exatamente com `CHANGES_FOR_FRONTEND.md` (evidência em `verification.md`). `database.types.ts` faz parte do commit desta fase.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/vehicle/schemas.ts` | modificar | `modelYear`, `currentOdometerKm`, `purchaseDate`, `purchasePrice` → opcional; `fuelType`/`transmission` → `optionalEnum` |
| `src/features/vehicle/VehicleForm.tsx` | modificar | rótulo `"(opcional)"` nos 6 campos relaxados |
| `src/features/vehicle/CreateVehicleDialog.tsx` | modificar | payload dos 4 campos genuinamente nullable com `?? null` |
| `src/features/vehicle/EditVehicleDialog.tsx` | modificar | idem + `toFormDefaults` com guarda `!= null` pros 3 `String(x)` + `purchaseDate ?? undefined` |
| `src/features/expense/schemas.ts` | modificar | `categoryId`, `description` → opcional; `occurredOn` → opcional |
| `src/features/expense/ExpenseForm.tsx` | modificar | `<option>` de categoria vazia deixa de ser `disabled`, texto vira "Sem categoria"; rótulo `"(opcional)"` em Descrição |
| `src/features/expense/CreateExpenseDialog.tsx` | modificar | payload `categoryId`/`description` com `?? null` |
| `src/features/expense/EditExpenseDialog.tsx` | modificar | idem + `toFormDefaults` com `?? undefined` pros dois campos |
| `src/features/timeline/schemas.ts` | modificar | `title` → opcional; `occurredOn` → opcional |
| `src/features/timeline/NoteForm.tsx` | modificar | rótulo `"(opcional)"` em Título |
| `src/features/timeline/CreateNoteDialog.tsx` | modificar | payload `title` com `?? null` |
| `src/features/timeline/EditNoteDialog.tsx` | modificar | idem + `toFormDefaults` com `title ?? undefined` |
| `src/features/fuel/schemas.ts` | modificar | `odometerKm` → opcional; `fuelType`/`occurredOn` → opcional |
| `src/features/fuel/FuelLogForm.tsx` | modificar | rótulo `"(opcional)"` em Quilometragem |
| `src/features/fuel/CreateFuelLogDialog.tsx` | modificar | payload `odometerKm` com `?? null` |
| `src/features/fuel/EditFuelLogDialog.tsx` | modificar | idem + `toFormDefaults` com guarda `!= null` (corrige bug `"null"` string) |
| `src/features/maintenance/schemas.ts` | modificar | `odometerKm`/`performedOn` de `maintenanceRecordSchema` → opcional; `maintenanceItemSchema` **sem mudança** |
| `src/features/maintenance/MaintenanceRecordForm.tsx` | modificar | rótulo `"(opcional)"` em Quilometragem |
| `src/features/maintenance/CreateMaintenanceRecordDialog.tsx` | modificar | payload `odometerKm` com `?? null` |
| `src/features/maintenance/EditMaintenanceRecordDialog.tsx` | modificar | idem + `toFormDefaults` com guarda `!= null` (corrige bug `"null"` string) |
| `src/features/issue/schemas.ts` | modificar | `reportedOn` → opcional |
| `src/features/document/schemas.ts` | modificar | `obligationSchema.dueOn` → opcional; `kind`/`docType` → `optionalEnum`; `financingSchema`: `financedAmount`/`installmentAmount`/`installmentCount` → opcional, `.refine()` cruzado tolera `installmentCount` vazio |
| `src/features/document/ObligationForm.tsx` | modificar | rótulo `"(opcional)"` em Vencimento |
| `src/features/document/FinancingForm.tsx` | modificar | rótulo `"(opcional)"` em Valor financiado / Valor da parcela / Quantidade de parcelas |
| `src/features/document/CreateObligationDialog.tsx` | modificar | payload `dueOn` com `?? null` |
| `src/features/document/EditObligationDialog.tsx` | modificar | idem + `toFormDefaults` com `dueOn ?? undefined` |
| `src/features/document/CreateFinancingDialog.tsx` | modificar | payload dos 3 campos com `?? null` |
| `src/features/document/EditFinancingDialog.tsx` | modificar | idem + `toFormDefaults` com guarda `!= null` nos 3 `String(x)` (corrige bug `"null"` string) |

`documents.doc_type`/`vehicle_photos.category`: só o schema Zod muda (`optionalEnum`), sem tocar em `DocumentForm.tsx`/`UploadPhotoDialog.tsx`/dialogs — já pré-selecionados, nenhuma fricção real a remover (autorizado pela própria fonte da mudança).

`src/types/database.types.ts` | regenerar | reflete a nullability real das 9 entidades depois do `db push` do backend (ver §3).

**Achados de `tsc -b` não previstos no plano inicial** — pontos de leitura direta de coluna (não os 3 campos calculados já auditados) que quebravam a checagem de tipo estrita assim que a coluna virou nullable, corrigidos com o mesmo padrão `!= null ? valor : "—"` já usado no resto do app:

| Arquivo | O que foi corrigido |
|---|---|
| `src/features/document/useDocuments.ts` | tipo `CreateDocumentInput.docType` aceita `undefined` |
| `src/features/document/FinancingCard.tsx` | `financed_amount`/`installment_amount`/`installment_count` renderizados com fallback `"—"`; `isPaidOff` só compara quando `installment_count` existe |
| `src/features/document/ObligationListItem.tsx` | `isOverdue` e o texto de vencimento tratam `due_on == null` como "Sem vencimento" |
| `src/features/expense/ExpensesPage.tsx`, `src/features/maintenance/MaintenancePage.tsx` | `defaultOdometerKm={vehicle.current_odometer_km ?? undefined}` |
| `src/features/maintenance/MaintenanceRecordListItem.tsx` | `odometer_km` com fallback `"—"` |
| `src/features/vehicle/VehicleCard.tsx`, `VehiclePage.tsx` | `current_odometer_km` com fallback `"—"` |

## 5. Ordem de execução

Cada entidade é independente das demais — não há dependência real entre elas, só a ordem interna por entidade: schema → form (rótulo) → create dialog (payload) → edit dialog (payload + `toFormDefaults`). Ordem sugerida (da mais simples pra mais arriscada, pra pegar erro de padrão cedo):

1. `notes` (2 campos, sem cálculo dependente) — valida o padrão geral.
2. `issues` (1 campo, só star)
3. `expenses` (inclui o ajuste de UX do `<select>`)
4. `documents` (só `optionalEnum`, sem `toFormDefaults`)
5. `maintenance_records` (inclui fix de bug `String(null)`)
6. `fuel_logs` (inclui fix de bug `String(null)`)
7. `vehicles` (mais campos, inclui fix de bug em 3 campos)
8. `obligations` (campo genuinamente nullable com efeito em alerta — AC-10/11)
9. `financings` (inclui ajuste de `.refine()` cruzado — mais arriscado)
10. `tsc -b` + `eslint .` no repo inteiro
11. Verificação manual dos fluxos críticos (AC-1, AC-2, AC-7, AC-13, AC-18, AC-19)

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Manual: criar veículo só com marca/modelo pelo app rodando | manual |
| AC-2 | Manual: editar veículo, apagar valor de compra, salvar, reabrir editar e conferir campo vazio | manual |
| AC-3 | Manual: criar gasto só com valor | manual |
| AC-4 | Manual: `<select>` de categoria — escolher, depois voltar pra "Sem categoria" | manual |
| AC-5 | Leitura de código: `TimelineItem.tsx:42` já usa `event.title ?? "Sem título"` — sem mudança necessária, confirmado por inspeção | manual (inspeção) |
| AC-6 | Manual: abastecimento sem km, conferir "—" no item da lista | manual |
| AC-7 | Manual: abastecimento com km, editar, conferir valor certo no campo (não `"null"`); apagar e salvar, reabrir e conferir vazio | manual |
| AC-8 | Manual: registrar execução sem km, conferir que item do plano não muda `last_service_odometer_km` (célula/badge do card não muda) | manual |
| AC-9 | Manual: criar problema só com título | manual |
| AC-10 | Manual: obrigação sem vencimento não aparece no `AlertBanner` | manual |
| AC-11 | Manual: editar obrigação, apagar vencimento, salvar, reabrir e conferir vazio | manual |
| AC-12 | Manual: criar financiamento só com data de início | manual |
| AC-13 | Manual: financiamento sem quantidade de parcelas + parcelas pagas preenchido, salvar sem erro de validação cruzada | manual |
| AC-14 | Manual: criar documento sem escolher tipo (deixar 'Outro' pré-selecionado) — já não bloqueava, confirmar que schema não regride | manual |
| AC-15/16/17 (negativos) | Manual: tentar salvar gasto sem valor / abastecimento sem litros / execução sem nome — confirmar que a mensagem de erro aparece e nada é salvo | manual |
| AC-18 | Manual: veículo sem `current_odometer_km`, conferir badge "Em dia" no card de item de manutenção | manual |
| AC-19 | Manual: veículo sem `purchase_price`, conferir "—" no cartão do veículo, no dashboard e no resumo de combustível | manual |

Não há suite de teste automatizado no projeto (`package.json` não declara `test`) — toda verificação funcional é manual contra o app rodando, complementada por `tsc -b` (tipo) e `eslint .` (padrão de código) cobrindo regressão estrutural.

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `toFormDefaults` com `String(valor)` sem guarda vira `"null"` visível quando o backend devolver `null` genuíno | Usuário vê texto errado num campo de edição, pode salvar `"null"` como se fosse valor real (ex.: se o campo virar texto livre) | Corrigido nos 4 arquivos identificados (`EditVehicleDialog`, `EditFinancingDialog`, `EditFuelLogDialog`, `EditMaintenanceRecordDialog`) trocando por `valor != null ? String(valor) : undefined`, mesmo padrão já usado em `EditExpenseDialog`/`EditIssueDialog`/`EditNoteDialog` para campos que já eram opcionais |
| Enviar `null` explícito num campo com default no banco (`fuel_type` etc.) | Update falha com violação de `NOT NULL` (erro 23502 traduzido, mas ainda um erro evitável) | Esses campos continuam usando `values.campo` puro (sem `?? null`) no payload — `undefined` é descartado pelo `JSON.stringify` do client do Supabase antes de sair, então a chave nunca chega no PATCH |
| `.refine()` cruzado de `financingSchema` compara `installmentsPaid <= installmentCount` assumindo os dois sempre números | `TypeError`/comparação incorreta quando `installmentCount` vira `undefined` | `.refine()` ajustado para `data.installmentCount === undefined \|\| data.installmentsPaid <= data.installmentCount` |
| Categoria de gasto vazia (`categoryId` opcional) pode já ter sido tratada como truthy/falsy em algum lugar que assume string não-vazia | Filtro de categoria ou agrupamento quebra silenciosamente | Fora do escopo desta fase alterar `ExpenseFilters`/agregação — comportamento da timeline/agregados é do backend (a view já resolve "Sem categoria"); nenhum código de agregação vive no cliente, então não há o que quebrar aqui |

## 8. Rollback

Toda a mudança é reversão de código puro (schemas Zod + JSX de rótulo + payload de mutation), sem migration neste repositório. Reverter é `git revert` do(s) commit(s) desta fase — nenhum dado gravado fica inconsistente, porque o backend já aceita tanto o payload antigo (todo campo preenchido) quanto o novo (campos ausentes) desde antes desta fase do front existir.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] `npm run build` (`tsc -b && vite build`) passa
- [ ] `npm run lint` passa
- [ ] Não há suite de teste automatizado no projeto — não aplicável
- [ ] `CHANGES_FOR_FRONTEND.md` incorporado a esta spec e removido da raiz do repo
- [ ] `docs/DECISIONS.md` recebe uma entrada nova só se algo divergir do plano durante a implementação (ex.: comportamento real do banco diferente do documentado)
