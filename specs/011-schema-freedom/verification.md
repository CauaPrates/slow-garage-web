# Verificação 011 — Liberdade de preenchimento (schema-freedom no front)

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-04 |
| **Resultado** | parcial — automático aprovado, manual não verificado (sem credencial de login disponível nesta sessão) |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ⬜ | Não verificado — requer login. Passo manual descrito abaixo. |
| AC-2 | ⬜ | Idem. |
| AC-3 | ⬜ | Idem. |
| AC-4 | ⬜ | Idem. |
| AC-5 | ✅ | Inspeção de código: `src/features/timeline/TimelineItem.tsx:42` já usa `event.title ?? "Sem título"` — comportamento pré-existente, confirmado por leitura, não alterado nesta fase. |
| AC-6 | ⬜ | Não verificado — requer login. |
| AC-7 | ⬜ | Não verificado — requer login. Correção de bug aplicada (`EditFuelLogDialog.tsx`: `String(log.odometer_km)` → `log.odometer_km != null ? String(log.odometer_km) : undefined`), mas o comportamento em tela não foi executado. |
| AC-8 | ⬜ | Não verificado — requer login. |
| AC-9 | ⬜ | Não verificado — requer login. |
| AC-10 | ⬜ | Não verificado — requer login. |
| AC-11 | ⬜ | Não verificado — requer login. |
| AC-12 | ⬜ | Não verificado — requer login. |
| AC-13 | ⬜ | Não verificado — requer login. Lógica revisada por leitura: `.refine()` de `financingSchema` tolera `installmentCount === undefined`, mas não foi exercitada em runtime. |
| AC-14 | ⬜ | Não verificado — requer login. |
| AC-15 (negativo) | ⬜ | Não verificado — requer login. `expenseSchema.amount` continua `requiredNonNegativeNumber` (não tocado), então a regra em si não mudou. |
| AC-16 (negativo) | ⬜ | Idem — `liters`/`totalAmount` não tocados. |
| AC-17 (negativo) | ⬜ | Idem — `maintenanceRecordSchema.name` não tocado. |
| AC-18 | ⬜ | Não verificado — requer login. Depende só da view do banco (`maintenance_status`); nenhum código do cliente foi alterado para este caso (`MaintenanceItemCard.tsx`/`MaintenancePage.tsx` já cobrem as 4 chaves do enum, incluindo `"ok"`, confirmado por leitura). |
| AC-19 | ⬜ | Não verificado — requer login. Os 3 pontos de leitura originais (`VehicleCard`, `FinancialSummaryCard`, `FuelSummaryCard`) já tratavam `null` antes desta fase (confirmado por leitura); 8 pontos adicionais que `tsc -b` acusou foram corrigidos nesta fase (ver plan.md). |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

Nenhum AC foi marcado ✅ por dedução de que "deveria funcionar" — só o AC-5, que é 100% inspeção de um trecho de código já existente e inalterado, verificável por qualquer pessoa lendo o arquivo indicado.

## Saída dos comandos

### Build

```
> slow-garage-web@0.0.0 build
> tsc -b && vite build

[vite] building client environment for production...
✓ 3062 modules transformed.
...
✓ built in 361ms

PWA v1.3.0
mode      generateSW
precache  75 entries (1169.73 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

Saída completa da primeira rodada (antes das correções) — 11 erros de tipo, todos em pontos de leitura de coluna agora nullable não cobertos pela auditoria manual inicial:

```
src/features/document/CreateDocumentDialog.tsx(55,9): error TS2322: Type '"invoice" | "receipt" | "quote" | "report" | "insurance" | "registration" | "other" | undefined' is not assignable to type '"invoice" | "receipt" | "quote" | "report" | "insurance" | "registration" | "other"'.
src/features/document/FinancingCard.tsx(20,52): error TS18047: 'financing.installment_count' is possibly 'null'.
src/features/document/FinancingCard.tsx(27,24): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
src/features/document/FinancingCard.tsx(40,69): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
src/features/document/ObligationListItem.tsx(23,32): error TS18047: 'obligation.due_on' is possibly 'null'.
src/features/document/ObligationListItem.tsx(42,75): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
src/features/expense/ExpensesPage.tsx(135,9): error TS2322: Type 'number | null' is not assignable to type 'number | undefined'.
src/features/maintenance/MaintenancePage.tsx(216,9): error TS2322: Type 'number | null' is not assignable to type 'number | undefined'.
src/features/maintenance/MaintenanceRecordListItem.tsx(29,61): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
src/features/vehicle/VehicleCard.tsx(59,27): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
src/features/vehicle/VehiclePage.tsx(83,72): error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
```

Todos os 11 corrigidos (ver plan.md, seção "Achados de `tsc -b`"). Segunda rodada, limpa (saída acima).

### Testes

Não há suite de teste automatizado neste projeto (`package.json` não declara script `test`) — não aplicável.

### Lint / tipos

```
> slow-garage-web@0.0.0 lint
> eslint .
```

Saída vazia — sem violação.

### Regeneração de tipos contra o banco real

Rodado duas vezes com `SUPABASE_PROJECT_ID=uglmnuppixsyzlhpftrh npm run types` (ref extraído de `VITE_SUPABASE_URL` no `.env`):

1. **Antes da migration do backend ser aplicada nesse projeto**: `git diff --stat src/types/database.types.ts` mostrou só uma diferença de formatação do gerador (parênteses em tipo condicional, sem relação com nullability) — `notes.title`, `vehicles.model_year`/`current_odometer_km`/`purchase_date`/`purchase_price` continuavam `string`/`number` (não `| null`) em `Row`/`Insert`/`Update`. Reportado ao usuário; confirmado que a migration ainda não tinha sido aplicada nesse projeto.
2. **Depois do usuário rodar `db push`**: regeneração confirmou nullability em todas as 9 entidades, batendo exatamente com `CHANGES_FOR_FRONTEND.md`:

```
vehicles.current_odometer_km: number | null
vehicles.model_year:          number | null
vehicles.purchase_date:       string | null
vehicles.purchase_price:      number | null
expenses.category_id:         string | null   (Insert: category_id?: string | null)
expenses.description:         string | null
expenses.occurred_on:         string (Row) / occurred_on?: string (Insert, tem default)
notes.title:                  string | null
fuel_logs.odometer_km:        number | null
fuel_logs.fuel_type:          Enum (Row, sem null — tem default) / fuel_type?: Enum (Insert)
maintenance_records.odometer_km: number | null
maintenance_records.performed_on: string (Row) / performed_on?: string (Insert, tem default)
issues.reported_on:           string (Row) / reported_on?: string (Insert, tem default)
obligations.due_on:           string | null
obligations.kind:             Enum (Row, sem null — tem default) / kind?: Enum (Insert)
financings.financed_amount, installment_amount, installment_count: number | null
financings.started_on:        string (Row) / started_on?: string (Insert, tem default)
documents.doc_type:           Enum (Row, sem null — tem default) / doc_type?: Enum (Insert)
vehicle_photos.category:      Enum (Row, sem null — tem default) / category?: Enum (Insert)
```

`maintenance_items` conferido como **sem mudança** (`interval_km`/`interval_months` já eram nullable antes desta fase; `name` continua `Row: name: string`).

## Pendências

- **Todos os 19 ACs funcionais não foram exercitados em runtime.** Não há credencial de login para o projeto Supabase disponível nesta sessão, e o próprio app exige confirmação de e-mail antes do primeiro login (`docs/DECISIONS.md`, ADR-012/ADR-016) — não é possível criar e confirmar uma conta de teste nova sem acesso a uma caixa de e-mail real. A verificação automática (`tsc -b` em modo `strict`, `eslint`) cobre a parte estrutural (nenhum acesso indevido a valor `null`/`undefined` no código compilado) mas não substitui o teste funcional: ela não prova, por exemplo, que o `<select>` de categoria de gasto realmente permite voltar para "Sem categoria" na interação real, nem que o Postgres aceita de fato os payloads agora mais permissivos.
- `documents.doc_type` foi incluído nesta fase por estar em `CHANGES_FOR_FRONTEND.md`, mesmo não tendo sido citado no briefing inicial passado ao agente de pesquisa — registrado em `tasks.md`, "Escopo recusado durante a implementação" (não é escopo novo, é correção de um corte manual).

## Para o humano testar na mão

Cada item abaixo cobre um ou mais AC. Pode ser testado em qualquer ordem; nenhum depende do anterior.

1. **AC-1/AC-2** — Abra "Cadastrar veículo", preencha só Marca e Modelo, salve. Confirme que o veículo aparece na garagem. Edite-o, preencha "Valor de compra", salve. Edite de novo, apague o campo, salve. Reabra o editar e confirme que o campo está vazio (não mostra `"null"` nem o valor antigo).
2. **AC-3/AC-4** — Abra "Registrar gasto" num veículo, preencha só o Valor, salve. Confirme que aparece na lista como "Gasto" (sem categoria). Edite o gasto, escolha uma categoria, salve; edite de novo e confirme que dá pra voltar pra "Sem categoria" no mesmo `<select>` sem recarregar a página.
3. **AC-6/AC-7** — Registre um abastecimento sem preencher Quilometragem (dentro de "Mais detalhes" tanto faz). Confirme que salva e mostra "—" no lugar do consumo (km/L). Edite um abastecimento que já tinha quilometragem, confirme que o campo mostra o número certo (não a palavra "null"), apague e salve; reabra e confirme vazio.
9. **AC-9** — Registre um problema só com o Título, confirme que salva com a data de hoje.
10. **AC-10/AC-11** — Cadastre uma obrigação sem Vencimento, confirme que ela não aparece em nenhum banner de alerta. Edite uma obrigação com vencimento preenchido, apague a data, salve, reabra e confirme vazio.
12. **AC-12/AC-13** — Cadastre um financiamento só com a data de início (ou nem isso). Depois edite e preencha "Parcelas já pagas" sem preencher "Quantidade de parcelas" — confirme que salva sem erro de validação cruzada.
14. **AC-14** — Cadastre um documento sem trocar o tipo (deixa "Outro" pré-selecionado) — confirme que salva normalmente (não deveria ter mudado nada aqui, é regressão a checar).
15-17. **Negativos** — Tente salvar um gasto sem Valor, um abastecimento sem Litros/Valor total, uma execução de manutenção sem Nome — confirme que os três continuam sendo recusados com a mensagem de campo obrigatório.
18. **AC-18** — Num veículo sem Km atual preenchido, abra o plano de manutenção e confirme que os itens aparecem como "Em dia" (badge verde), nunca "Vencido"/"Próximo" por falta de dado.
19. **AC-19** — No mesmo veículo (sem Km atual e/ou sem Valor de compra), confira o cartão do veículo na garagem, o resumo financeiro do dashboard e o resumo de combustível — todos devem mostrar "—" nos campos que dependem do dado faltante, nunca "R$ null" ou a tela quebrando.
