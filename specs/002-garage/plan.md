# Plano 002 — Minha Garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

CRUD de veículo inteiro vive em `/` (a Home protegida) via diálogos —
criar, editar e excluir não ganham rota própria nesta fase. `/v/:vehicleId`
como rota de verdade (com shell, sidebar, header do veículo) é entrega da
Fase 3; antecipar isso agora seria construir a metade errada da Fase 3
sem o resto do contexto dela. `useVehicles` busca a lista e, pros
veículos retornados, busca em lote (`.in(...)`) o resumo financeiro
(`vehicle_financial_summary`) e a foto principal (via `vehicle_photos` +
`createSignedUrls`), evitando N+1 chamada por card. Upload de foto só é
oferecido na edição — na criação o veículo ainda não tem `id`, então não
há caminho de storage válido antes do primeiro `insert`.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Rota `/v/:id` já nesta fase pra editar/ver veículo | É entrega da Fase 3 (`003-vehicle-shell`), junto com sidebar/bottom-nav/header do veículo. Construir a rota agora sem esse contexto significa refazer depois |
| Oferecer upload de foto dentro do formulário de criação | O caminho de storage exige `vehicle_id`, que só existe depois do `insert`. Photo teria que ser um passo B disfarçado de passo A — mais simples e mais honesto deixar como ação de "editar" mesmo |
| Buscar resumo financeiro e foto por veículo, uma chamada cada | N+1 chamadas pra uma lista de N veículos. `.in('vehicle_id', ids)` e `createSignedUrls` (plural) resolvem em lote |
| CLI do shadcn pra `Dialog`/`AlertDialog`/`Select`/`Textarea` | Histórico de 2/2 tentativas anteriores (Fase 0 e Fase 1) precisando de retrabalho manual (pasta errada, tokens genéricos — ADR-007, ADR-015). `Select` e `Textarea` são simples o suficiente pra escrever à mão sobre elemento nativo (`<select>`/`<textarea>`), sem dependência nova. `Dialog`/`AlertDialog` valem a dependência Radix (foco, overlay, Esc) mas escritos direto com os tokens certos, sem passar pelo CLI |
| `Collapsible` do Radix pra "mais detalhes" | `<details>/<summary>` nativo já é acessível por padrão (teclado, leitor de tela) e não precisa de JS nem dependência nova pra um disclosure simples |

## 3. Impacto em contratos e dados

Primeira escrita real em `vehicles` e `vehicle_photos`, primeira leitura
de `vehicle_financial_summary`. Nenhuma mudança de schema — segue
exatamente `docs/API_CONTRACT.md`.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/vehicle/schemas.ts` | criar | zod: criar veículo (obrigatórios), detalhes opcionais, validação de arquivo de foto |
| `src/features/vehicle/useVehicles.ts` | criar | `useVehicles` (lista + resumo + foto em lote), `useCreateVehicle`, `useUpdateVehicle`, `useDeleteVehicle` |
| `src/features/vehicle/useVehiclePhoto.ts` | criar | `useUploadVehiclePhoto` — upload + insert em `vehicle_photos` + update de `primary_photo_id` |
| `src/features/vehicle/VehicleCard.tsx` | criar | Card da lista: foto/placeholder, marca, modelo, ano, versão, km, total investido, status, menu editar/excluir |
| `src/features/vehicle/VehicleForm.tsx` | criar | Formulário único pra criar/editar — campos obrigatórios sempre visíveis, "mais detalhes" (`<details>`) com o resto + status |
| `src/features/vehicle/CreateVehicleDialog.tsx` | criar | Diálogo de criação |
| `src/features/vehicle/EditVehicleDialog.tsx` | criar | Diálogo de edição, inclui `VehiclePhotoUpload` |
| `src/features/vehicle/DeleteVehicleDialog.tsx` | criar | Confirmação de exclusão (`AlertDialog`) |
| `src/features/vehicle/VehiclePhotoUpload.tsx` | criar | Input de arquivo + validação + upload + preview |
| `src/features/vehicle/VehicleListPage.tsx` | criar | Página "Minha Garagem": lista, estados vazio/loading/erro, botão cadastrar |
| `src/components/ui/dialog.tsx` | criar | Wrapper de `@radix-ui/react-dialog` com nossos tokens |
| `src/components/ui/alert-dialog.tsx` | criar | Wrapper de `@radix-ui/react-alert-dialog` com nossos tokens |
| `src/components/ui/select.tsx` | criar | Wrapper de `<select>` nativo com nossos tokens |
| `src/components/ui/textarea.tsx` | criar | Wrapper de `<textarea>` nativo com nossos tokens |
| `src/app/router.tsx` | modificar | Rota índice de `/` passa a renderizar `VehicleListPage` em vez do placeholder |
| `docs/DESIGN.md` | modificar | Densidade real de card de lista e diálogo |
| `docs/DECISIONS.md` | modificar | ADRs desta fase |
| `specs/002-garage/verification.md` | criar (ao final) | Evidência dos 13 ACs |

## 5. Ordem de execução

1. `npm install @radix-ui/react-dialog @radix-ui/react-alert-dialog`
2. `components/ui/dialog.tsx`, `alert-dialog.tsx`, `select.tsx`, `textarea.tsx` — sem dependência de domínio
3. `features/vehicle/schemas.ts` — sem dependência de UI
4. `features/vehicle/useVehicles.ts`, `useVehiclePhoto.ts` — dependem só de `lib/supabase.ts` e do `useAuth` da Fase 1
5. `VehicleForm.tsx` — depende dos passos 2 e 3
6. `VehiclePhotoUpload.tsx` — depende do passo 4
7. `CreateVehicleDialog.tsx`, `EditVehicleDialog.tsx`, `DeleteVehicleDialog.tsx` — dependem dos passos 2, 5, 6
8. `VehicleCard.tsx` — depende do passo 7 (aciona os diálogos de editar/excluir)
9. `VehicleListPage.tsx` — depende de todos os anteriores
10. `app/router.tsx` — substitui o placeholder pela página real
11. `docs/DESIGN.md`, `docs/DECISIONS.md`
12. Build, `tsc`, lint, `ui:check`, teste manual com `alice@dev.local`/`bob@dev.local` cadastrando/editando/excluindo veículo de verdade, `verification.md`

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Login com conta sem veículo, confirmar estado vazio | manual |
| AC-2 | Criar veículo com os campos obrigatórios, confirmar na lista com status "Ativo" | manual |
| AC-3 | Tentar salvar sem marca → recusa antes de chamar o servidor | manual |
| AC-4 | Km atual `-1` ou valor de compra `-1` → recusado | manual |
| AC-5 | Veículo sem foto → placeholder visual no card, screenshot | manual |
| AC-6 | Enviar foto num veículo existente, inspecionar `storage_path` e `primary_photo_id` no resultado da query | manual, com inspeção de rede |
| AC-7 | Tentar enviar um `.pdf` ou arquivo de 10MB → recusado antes do upload | manual |
| AC-8 | Editar todos os campos + status de um veículo, recarregar página, confirmar persistência | manual |
| AC-9 | Clicar excluir → diálogo de confirmação aparece, cancelar não apaga | manual |
| AC-10 | Confirmar exclusão → veículo some da lista | manual |
| AC-11 | Criar veículo, confirmar que "total investido" bate com `purchase_price` (via `vehicle_financial_summary`, não somado no cliente) | manual |
| AC-12 | Dois veículos cadastrados, cards mostram dados corretos e distintos | manual |
| AC-13 | Login com `bob@dev.local`, confirmar que não vê veículo de `alice@dev.local` | manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `createSignedUrls` (plural) pode não existir ou ter assinatura diferente na versão instalada do `@supabase/supabase-js` | Quebraria a busca de foto em lote | Checar a assinatura real no `node_modules` antes de usar; se não existir, cair pra `Promise.all` de `createSignedUrl` individual (mais chamadas, mas funciona) |
| Extensão de arquivo pro path de upload — contrato mostra `.jpg` fixo, mas usuário pode enviar `.png`/`.webp` | Path errado ou extensão perdida | Derivar extensão do `file.name` real (fallback pelo `file.type` se não tiver extensão), nunca fixar `.jpg` |
| Exclusão de veículo com dado relacionado (nenhum ainda, mas a tabela permite FK de outras fases) | Poderia falhar com erro cru do Postgres se houver `RESTRICT` em vez de `CASCADE` | Traduzir qualquer erro do `delete` pra mensagem em português antes de mostrar; reportar na verificação o que o banco realmente faz |

## 8. Rollback

Sem migration. Dado real criado durante testes (veículo de teste) fica
nas contas seed (`alice@dev.local`/`bob@dev.local`) — aceitável em
ambiente de dev, sem risco de produção. Rollback é `git revert`/descarte
da branch.

## 9. Definição de pronto

- [ ] Todos os 13 ACs verificados com evidência em `verification.md`
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` passa
- [ ] Lint passa sem warning
- [ ] Nenhum total financeiro calculado no cliente (grep por soma manual)
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` atualizados
- [ ] Lista do que precisa ser testado à mão entregue
