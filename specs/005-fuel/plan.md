# Plano 005 — Abastecimento e métricas de consumo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Uma feature `features/fuel/` segue o mesmo padrão de CRUD já usado em
`features/expense/` (Fase 4): formulário único create/edit, diálogos
create/edit/delete, hook de leitura + mutações. Duas diferenças
estruturais: (1) a lista lê de `fuel_log_metrics` (view, com km/L e
custo/km por registro), enquanto criar/editar/excluir escreve em
`fuel_logs` (tabela); (2) um resumo agregado no topo lê
`vehicle_fuel_summary` + o `cost_per_km` já disponível em
`vehicle_financial_summary`. O tipo `fuel_type` e seus rótulos são
reaproveitados de `features/vehicle/schemas.ts` (mesmo enum do banco),
não redeclarados.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Calcular km/L no cliente a partir de dois registros consecutivos | RN-1 do contrato do backend proíbe — o banco já sabe quando **não** confiar no número (tanque não cheio, abastecimento perdido) e o cliente não tem como replicar essa regra sem duplicar lógica que pode divergir |
| Pré-preencher quilometragem com `vehicle.current_odometer_km`, igual ao gasto (Fase 4) | Sem confirmação de que esse campo avança a cada abastecimento (só documentado pro fluxo de manutenção), o valor sugerido poderia colidir direto com a constraint única (RN-3), transformando um atalho em armadilha |
| Novo enum de combustível próprio de `fuel_logs` | `fuel_logs.fuel_type` usa o mesmo enum `fuel_type` de `vehicles` — `FUEL_TYPES`/`FUEL_TYPE_LABELS` já existem em `vehicle/schemas.ts`; redeclarar duplicaria |
| `<input type="checkbox">` nativo pro "Tanque cheio" | O projeto já tem `Switch` (Radix) com os tokens certos, usado no tema — manter um único padrão de toggle em vez de dois (checkbox aqui, switch lá) |
| Filtro por período na lista, igual Fase 4 | Não pedido pelo doc mestre pra esta tela; decisão do clarify foi lista cronológica simples — adicionar agora seria escopo não pedido |

## 3. Impacto em contratos e dados

Nenhuma tabela, view, coluna ou bucket novo. Leitura de
`fuel_log_metrics` e `vehicle_fuel_summary` (ainda não usadas por
nenhuma fase anterior) e de `vehicle_financial_summary.cost_per_km`
(view já consumida desde a Fase 2, coluna nova sendo lida). Escrita em
`fuel_logs` (nova nesta fase).

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/postgresErrors.ts` | modificar | Mensagem específica pra violação da constraint única de `fuel_logs` (odômetro repetido) |
| `src/features/fuel/schemas.ts` | criar | `fuelLogSchema`, reaproveitando `FUEL_TYPES`/`FUEL_TYPE_LABELS` de `vehicle/schemas.ts` |
| `src/features/fuel/useFuelLogs.ts` | criar | `useFuelLogs` (lê `fuel_log_metrics`), `useCreateFuelLog`, `useUpdateFuelLog`, `useDeleteFuelLog` (escrevem `fuel_logs`) |
| `src/features/fuel/useVehicleFuelSummary.ts` | criar | Lê `vehicle_fuel_summary` (médio/melhor/pior + total de litros) |
| `src/features/fuel/FuelLogForm.tsx` | criar | Formulário único create/edit — km, litros, valor, tanque cheio visíveis; data/combustível/posto/notas em "mais detalhes" |
| `src/features/fuel/CreateFuelLogDialog.tsx` | criar | Diálogo de criar |
| `src/features/fuel/EditFuelLogDialog.tsx` | criar | Diálogo de editar |
| `src/features/fuel/DeleteFuelLogDialog.tsx` | criar | Confirmação de exclusão |
| `src/features/fuel/FuelSummaryCard.tsx` | criar | Card com médio/melhor/pior (km/L) + custo/km |
| `src/features/fuel/FuelLogListItem.tsx` | criar | Linha da lista: data, litros, valor, km/L e custo/km (ou "—") |
| `src/features/fuel/FuelLogsPage.tsx` | criar | Rota `/v/:vehicleId/abastecimentos` — 4 estados, resumo condicional, lê `?novo=1` |
| `src/lib/navigation.ts` | modificar | "Abastecimentos" (sidebar) e "Abastecimento" (folha) trocam `to: null` por rota dependente do veículo |
| `src/lib/routes.ts` | modificar | `vehicleFuelLogs: (id) => \`/v/${id}/abastecimentos\`` |
| `src/app/router.tsx` | modificar | Rota filha `v/:vehicleId/abastecimentos` → `FuelLogsPage` |
| `docs/DESIGN.md` | modificar | Densidade do resumo de consumo, do toggle "Tanque cheio", da linha de lista com km/L |
| `docs/DECISIONS.md` | modificar | ADR: mensagem específica de odômetro duplicado; decisão de não pré-preencher quilometragem |

## 5. Ordem de execução

1. `lib/postgresErrors.ts` (mensagem específica antes de qualquer mutação usá-la)
2. `fuel/schemas.ts`
3. `fuel/useFuelLogs.ts`, `fuel/useVehicleFuelSummary.ts` (dado antes de interface)
4. `fuel/FuelLogForm.tsx`, `FuelSummaryCard.tsx`, `FuelLogListItem.tsx`
5. `fuel/{Create,Edit,Delete}FuelLogDialog.tsx`
6. `fuel/FuelLogsPage.tsx`
7. `lib/routes.ts`, `lib/navigation.ts` (ativa os itens de nav)
8. `router.tsx`
9. `docs/DESIGN.md`, `docs/DECISIONS.md`
10. Verificação manual + `tsc`/lint/build contra o Supabase de dev real

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Veículo novo sem abastecimento → conferir estado vazio, resumo ausente | manual |
| AC-2 | Registrar com os 4 campos visíveis, sem abrir "mais detalhes" → conferir data/combustível corretos na lista | manual |
| AC-3 | Tentar salvar sem km/litros/valor, um de cada vez → conferir recusa | manual |
| AC-4 | Km/litros/valor negativos → conferir recusa no cliente | manual |
| AC-5 | Registrar duas vezes na mesma quilometragem → conferir mensagem específica | manual |
| AC-6 | Dois abastecimentos consecutivos, tanque cheio nos dois → conferir km/L exibido no segundo | manual |
| AC-7 | Abastecimento com tanque não cheio → conferir "—" no km/L e custo/km | manual |
| AC-8 | 2+ abastecimentos válidos → conferir resumo (médio/melhor/pior/custo por km) bate com a view | manual |
| AC-9 | Editar um abastecimento → conferir lista e resumo atualizados | manual |
| AC-10 | Excluir um abastecimento → conferir sumiço da lista e resumo recalculado | manual |
| AC-11 | Tocar "Abastecimento" dentro do veículo → conferir navegação + diálogo aberto | manual |
| AC-12 | Abrir folha fora do veículo → conferir "Abastecimento" desabilitado com motivo certo | manual |
| AC-13 | Clicar "Abastecimentos" na sidebar dentro do veículo → conferir navegação | manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `Switch` fora do fluxo de `register()` do react-hook-form | Campo "Tanque cheio" não sincroniza com o estado do formulário | `Controller` do react-hook-form envolvendo o `Switch`, mesmo padrão que qualquer formulário futuro com toggle deve seguir |
| Mensagem específica de odômetro duplicado depender de checar substring do `message` do erro (não só o `code`) | Mensagem genérica aparecer em vez da específica se o texto do erro mudar de versão do Postgres | Checagem defensiva (código 23505 **e** substring "fuel_logs"/"odometer"); se falhar, cai no fallback genérico — nunca quebra, só fica menos específico |
| `vehicle_fuel_summary`/`fuel_log_metrics` sem linha nenhuma pra veículo sem abastecimento | Tela quebrar tentando ler campo de `undefined` | Tratado explicitamente: resumo só renderiza quando a lista de abastecimentos não está vazia (AC-1) |

## 8. Rollback

Toda tabela/view já existe e não é alterada. Reverter é `git revert`
dos commits da fase — sem migration. Dado de teste criado na
verificação é removido ao final.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] Build, `tsc --noEmit`/`tsc -b` e lint passam
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` atualizados
- [ ] Dado de teste removido do Supabase de dev
- [ ] Commit em `feature/005-fuel` e merge `--no-ff` em `dev`, branch
      preservada
