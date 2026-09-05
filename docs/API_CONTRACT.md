# Contrato com o frontend

Este documento é, junto com `types/database.types.ts`, o único acoplamento entre este repositório e o frontend (`garage-app-web`).

## `profiles`

Dado de aplicação do usuário logado. Espelha `auth.users`, mas **nunca é criada pelo cliente** — nasce sozinha no signup.

| Coluna | Tipo | Nullable | O frontend pode enviar? |
|---|---|---|---|
| `id` | `string` (uuid) | não | Não. Sempre `= auth.uid()` no servidor; nunca faz parte de um payload de escrita |
| `display_name` | `string` | sim | Sim, em `update` |
| `avatar_url` | `string` | sim | Sim, em `update` |
| `preferred_units` | `'metric' \| 'imperial'` | não | Sim, em `update` |
| `theme` | `'dark' \| 'light' \| 'system'` | não | Sim, em `update` |
| `created_at` | `string` (ISO timestamp) | não | Não — gerado pelo banco |
| `updated_at` | `string` (ISO timestamp) | não | **Não.** Calculado pelo banco a cada `update`. Nunca enviar nem tentar recalcular no cliente |

**Operações permitidas pelo cliente:**

| Operação | Permitida? |
|---|---|
| `select` | Sim — só a própria linha (`id = auth.uid()`), forçado por RLS |
| `update` | Sim — só a própria linha |
| `insert` | **Não.** Não existe policy de insert; qualquer tentativa é recusada pela RLS. A linha nasce sozinha no signup |
| `delete` | **Não.** Some via cascade quando a conta é apagada — não há fluxo de "apagar perfil" separado de "apagar conta" nesta fase |

**Exemplo — ler o próprio profile:**

```ts
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single()
// RLS já garante que só volta a própria linha — não precisa (nem deve) filtrar por id manualmente
```

**Exemplo — atualizar preferências:**

```ts
const { error } = await supabase
  .from('profiles')
  .update({ theme: 'dark', preferred_units: 'imperial' })
  .eq('id', user.id) // opcional — RLS bloqueia qualquer outro id de qualquer forma
```

**Nota sobre o signup:** depois de `supabase.auth.signUp(...)`, o profile já existe (o trigger roda na mesma transação da criação da conta). Não é preciso — nem possível — criar o profile manualmente depois do signup.

---

## `vehicles`

| Coluna | Tipo | Nullable | O frontend pode enviar? |
|---|---|---|---|
| `id` | `string` (uuid) | não | Não em `insert`/`update` — gerado pelo banco |
| `user_id` | `string` (uuid) | não | Não. Sempre `auth.uid()` no servidor — RLS recusa qualquer outro valor |
| `make`, `model`, `model_year`, `current_odometer_km`, `fuel_type`, `transmission`, `purchase_date`, `purchase_price` | — | não | Sim, obrigatórios em `insert` |
| `trim`, `color`, `plate`, `engine_description`, `engine_displacement_cc`, `horsepower`, `torque_nm`, `estimated_current_value`, `notes` | — | sim | Sim, opcionais |
| `status` | `'active' \| 'project' \| 'stored' \| 'sold'` | não | Sim; default `active` se omitido no insert |
| `primary_photo_id` | `string` (uuid) | sim | Sim, em `update` — deve apontar para uma linha de `vehicle_photos` do mesmo veículo |
| `archived_at` | `string` (timestamp) | sim | Sim, em `update`. Não é setado automaticamente ao mudar `status` para `sold` |
| `created_at`, `updated_at` | `string` (timestamp) | não | Não — gerados pelo banco |

**Operações:** `select`/`insert`/`update`/`delete`, todas restritas a `user_id = auth.uid()` por RLS.

## `vehicle_photos`

| Coluna | Tipo | Nullable | O frontend pode enviar? |
|---|---|---|---|
| `id` | `string` (uuid) | não | Não — gerado pelo banco |
| `vehicle_id` | `string` (uuid) | não | Sim, em `insert` — precisa ser um veículo do próprio usuário (RLS via `owns_vehicle`) |
| `storage_path` | `string` | não | Sim — ver convenção de upload abaixo |
| `category` | enum (7 valores) | não | Sim |
| `caption`, `taken_at`, `sort_order` | — | sim / não* | Sim |

**Operações:** `select`/`insert`/`update`/`delete`, restritas via `owns_vehicle(vehicle_id)`.

**Upload de foto — fluxo completo:**

```ts
const filePath = `${user.id}/${vehicleId}/${crypto.randomUUID()}.jpg`

// 1. sobe o arquivo pro bucket privado
const { error: uploadError } = await supabase.storage
  .from('vehicle-photos')
  .upload(filePath, file, { contentType: 'image/jpeg' })

// 2. registra a linha na tabela
const { data, error } = await supabase
  .from('vehicle_photos')
  .insert({ vehicle_id: vehicleId, storage_path: filePath, category: 'exterior' })

// 3. pra exibir depois, sempre via signed URL (bucket é privado)
const { data: signed } = await supabase.storage
  .from('vehicle-photos')
  .createSignedUrl(filePath, 60 * 60) // 1 hora
```

O `filePath` **precisa** seguir `{user_id}/{vehicle_id}/{arquivo}` exatamente — é isso que a policy de storage valida. Qualquer outro formato de caminho é recusado no passo 1.

## `owns_vehicle(p_vehicle_id uuid)` — RPC

```ts
const { data: isOwner } = await supabase.rpc('owns_vehicle', { p_vehicle_id: vehicleId })
```

Uso normal é indireto (via RLS); chamar diretamente só faz sentido para uma checagem de UI antes de tentar uma ação.

---

## `expense_categories`

`select` traz sempre as 12 de sistema (`user_id: null`) + as próprias. `insert`/`update`/`delete` só funcionam com `is_system: false` e `user_id` implícito (`= auth.uid()`) — tentar mandar `is_system: true` é recusado pela RLS, não por validação de aplicação.

## `expenses`

| Coluna | O frontend pode enviar? |
|---|---|
| `vehicle_id`, `category_id`, `amount`, `description`, `occurred_on` | Sim, obrigatórios em `insert` |
| `odometer_km`, `vendor`, `payment_method`, `notes` | Sim, opcionais |

**Nunca some `fuel_logs` dentro do total de `expenses`** (e vice-versa) — a partir da Fase 4, o total investido no veículo é `sum(expenses.amount) + sum(fuel_logs.total_amount)`. As duas tabelas são fontes independentes, nunca uma duplicata da outra.

## `notes`

`vehicle_id`, `title` (obrigatório), `body`, `occurred_on` (obrigatório), `odometer_km` — todos enviáveis pelo cliente.

## `attachments`

Mesmo fluxo de upload de `vehicle_photos` (seção anterior), mas no bucket `vehicle-documents` e com `entity_type`/`entity_id` apontando para o registro anexado:

```ts
const filePath = `${user.id}/${vehicleId}/${crypto.randomUUID()}.pdf`
await supabase.storage.from('vehicle-documents').upload(filePath, file, { contentType: 'application/pdf' })
await supabase.from('attachments').insert({
  vehicle_id: vehicleId,
  entity_type: 'expense',
  entity_id: expenseId,
  storage_path: filePath,
  mime_type: 'application/pdf',
  file_size_bytes: file.size,
  original_filename: file.name,
})
```

## `vehicle_timeline` (view, somente leitura)

```ts
const { data } = await supabase
  .from('vehicle_timeline')
  .select('*')
  .eq('vehicle_id', vehicleId)
  .order('occurred_on', { ascending: false })
```

Nunca aceita `insert`/`update`/`delete` — é projeção de `expenses`/`notes` (e, a partir da Fase 4+, mais fontes). `amount` vem `null` para eventos que não têm valor monetário (ex.: `note`). `metadata` é um `jsonb` com campos extras específicos da fonte (ex.: `vendor`/`payment_method` para gastos) — tratar como *bag* de dados adicionais, não como contrato fixo.

## `fuel_logs`

| Coluna | O frontend pode enviar? |
|---|---|
| `vehicle_id`, `occurred_on`, `odometer_km`, `liters`, `total_amount`, `fuel_type` | Sim, obrigatórios |
| `station`, `notes`, `is_full_tank`, `missed_previous_fill` | Sim, opcionais (2 últimos têm default) |
| `price_per_liter` | **Não.** Calculado pelo banco — não enviar nem recalcular no cliente |

`odometer_km` repetido para o mesmo veículo é recusado (constraint única) — o frontend deve tratar esse erro como "esse odômetro já foi registrado", não como falha genérica.

## `fuel_log_metrics` / `vehicle_fuel_summary` (views, somente leitura)

```ts
const { data: metrics } = await supabase
  .from('fuel_log_metrics')
  .select('*')
  .eq('vehicle_id', vehicleId)
  .order('odometer_km')

const { data: summary } = await supabase
  .from('vehicle_fuel_summary')
  .select('*')
  .eq('vehicle_id', vehicleId)
  .single()
```

`km_per_liter` e `cost_per_km` vêm `null` quando o banco não tem confiança no cálculo (tanque não cheio, ou abastecimento perdido no meio) — **o frontend não deve tentar preencher esse vazio com estimativa própria**; `null` significa "sem dado confiável", é a resposta correta.

## `maintenance_items` / `maintenance_records`

`maintenance_items` exige `interval_km` e/ou `interval_months` — enviar os dois nulos é recusado pelo banco. Ao inserir em `maintenance_records`, **não envie/atualize `maintenance_items.last_service_*` nem `vehicles.current_odometer_km` manualmente** — um trigger já faz isso (e só avança esses valores, nunca regride).

## `maintenance_status` / `vehicle_alerts` (views, somente leitura)

```ts
const { data: status } = await supabase
  .from('maintenance_status')
  .select('*')
  .eq('vehicle_id', vehicleId)

const { data: alerts } = await supabase
  .from('vehicle_alerts')
  .select('*')
  .eq('vehicle_id', vehicleId)
  .order('severity', { ascending: false })
```

`status = 'planned'` significa "nunca executado" — não é o mesmo que `'ok'`. `vehicle_alerts` já filtra por `is_active = true` e só traz `overdue`/`due_soon`; não é preciso o cliente filtrar de novo.

## `issues` / `projects` / `project_items`

Não envie/calcule valor investido ou progresso de projeto no cliente — sempre leia de `project_progress`. `project_items.vehicle_id` **precisa** bater com o `vehicle_id` do `project_id` escolhido, ou o insert/update é recusado pelo banco (erro `P0001`).

```ts
const { data: progress } = await supabase
  .from('project_progress')
  .select('*')
  .eq('project_id', projectId)
  .single()
```

`pct_items_completed`/`pct_budget_used` vêm `null` quando não há como calcular (projeto sem itens, ou sem orçamento) — não trate `null` como `0` na UI.

## `documents` / `obligations` / `financings`

`financings.installments_remaining`/`outstanding_balance`: **nunca enviar nem recalcular no cliente** — colunas geradas. `obligations.paid_on`: marcar como pago é o único jeito de silenciar o alerta (não existe "dispensar alerta" separado de "pagar").

```ts
// upload de documento, mesmo fluxo/bucket de vehicle_photos/attachments (vehicle-documents)
const filePath = `${user.id}/${vehicleId}/${crypto.randomUUID()}.pdf`
await supabase.storage.from('vehicle-documents').upload(filePath, file, { contentType: 'application/pdf' })
await supabase.from('documents').insert({
  vehicle_id: vehicleId, title: 'CRLV 2025', doc_type: 'registration',
  storage_path: filePath, mime_type: 'application/pdf', file_size_bytes: file.size,
  expires_on: '2026-01-10',
})
```

## `vehicle_alerts` (completo)

Mesma forma de sempre, agora com `alert_type` podendo ser `maintenance_overdue`, `maintenance_due_soon`, `obligation_overdue`, `obligation_due_soon`, `document_expired`, `document_expiring`. `severity` já vem pronta (`critical`/`warning`) — não precisa o cliente decidir cor por `alert_type` na mão, mas pode usar `alert_type` pra escolher ícone/texto.

## `get_vehicle_dashboard` (RPC) — a chamada única pra tela do veículo

```ts
const { data: dashboard } = await supabase.rpc('get_vehicle_dashboard', { p_vehicle_id: vehicleId })
// dashboard.financial_summary, .fuel_summary, .expenses_by_month, .expenses_by_category, .alerts, .open_issues_count, .active_projects_count
```

`financial_summary`/`fuel_summary` vêm como objeto único (ou `null` se o veículo não existir/não for seu); os demais como array (`[]` se vazio, nunca `null`). Um veículo recém-criado sem nenhum dado retorna tudo zerado/vazio, não erro.

## `search_vehicle` (RPC)

```ts
const { data: results } = await supabase.rpc('search_vehicle', { p_vehicle_id: vehicleId, p_query: 'manutencao' })
// já vem ordenado por rank desc — não precisa ordenar de novo no cliente
```

Busca tolera falta de acento e pequenos erros de digitação (via `pg_trgm`), mas **não** é full-text search de linguagem natural — é aproximação por trecho de texto (`word_similarity`), então funciona melhor pra termos curtos (nome, palavra-chave) do que frases inteiras.

---

## Fase 9 — Hardening

Nenhuma mudança de contrato. `maintenance_records` ganhou uma regra a mais de validação no banco (não no cliente): inserir/atualizar com `vehicle_id` divergente do `vehicle_id` do `maintenance_item_id` vinculado é recusado — mesmo comportamento que `project_items` já tinha desde a Fase 6. Se o frontend já respeita a regra de sempre usar o `vehicle_id` do item selecionado, nada muda na prática.

Este é o contrato final da V1 do backend — todas as 9 fases estão documentadas aqui e em `docs/DATABASE.md`.
