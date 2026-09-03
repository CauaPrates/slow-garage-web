# Plano 006 — Manutenção preventiva e execução

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Uma feature `features/maintenance/` com **duas entidades** (item do
plano e registro de execução), cada uma com seu próprio CRUD completo
no padrão já validado (form único create/edit, diálogos, hooks). A
tela `/v/:vehicleId/manutencao` combina: banner de alertas
(`vehicle_alerts`), três seções derivadas de `maintenance_status` +
`maintenance_items` batelados (Vencidas/Próximas), e uma lista de
`maintenance_records` (Histórico). O botão "Adicionar" → "Manutenção"
abre direto o diálogo de execução (ação mais repetida), não o de
criar item de plano.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Um único formulário/diálogo pra item de plano e execução | São entidades diferentes com campos diferentes (uma é intervalo/prioridade, outra é data/km de um evento) — forçar num só formulário confundiria mais do que ajudaria |
| Calcular status (vencido/próximo) no cliente a partir de `interval_km`/`interval_months` e `last_service_*` | RN-1 proíbe — `maintenance_status` já existe pronta e é a fonte de verdade; duplicar a lógica arrisca divergir |
| Tela/aba de itens inativos | Não pedido; decisão do clarify foi manter simples — desativar só tira da seção de plano, sem arquivo dedicado |
| Componente de alerta específico só pra manutenção (`maintenance_alerts`) | `vehicle_alerts` já é de propósito geral e cobre manutenção hoje; construir um componente amarrado só a manutenção obrigaria reescrevê-lo nas Fases 7/8 quando obrigação/documento também alertarem |

## 3. Impacto em contratos e dados

Nenhuma tabela, view ou coluna nova. Leitura de `maintenance_status` e
`vehicle_alerts` (ambas ainda não usadas por nenhuma fase anterior).
Escrita em `maintenance_items` e `maintenance_records` (novas nesta
fase). Nenhuma mudança em `vehicles`/`maintenance_items.last_service_*`
feita pelo cliente — RN-2.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/maintenance/schemas.ts` | criar | `maintenanceItemSchema` (com refine de intervalo), `maintenanceRecordSchema`, `PRIORITY_LEVELS`/labels |
| `src/features/maintenance/useMaintenanceItems.ts` | criar | Fetch batelado (`maintenance_items` + `maintenance_status` por `maintenance_item_id`) + CRUD |
| `src/features/maintenance/useMaintenanceRecords.ts` | criar | Fetch (`maintenance_records`) + CRUD |
| `src/features/maintenance/useVehicleAlerts.ts` | criar | Lê `vehicle_alerts` |
| `src/features/maintenance/AlertBanner.tsx` | criar | Lista os alertas ativos, severidade → cor+texto |
| `src/features/maintenance/MaintenanceItemForm.tsx` | criar | Formulário do item de plano, com refine de intervalo |
| `src/features/maintenance/MaintenanceRecordForm.tsx` | criar | Formulário de execução, seletor de item opcional |
| `src/features/maintenance/{Create,Edit,Delete}MaintenanceItemDialog.tsx` | criar | CRUD de item de plano |
| `src/features/maintenance/{Create,Edit,Delete}MaintenanceRecordDialog.tsx` | criar | CRUD de execução |
| `src/features/maintenance/MaintenanceItemCard.tsx` | criar | Linha de item (nome, prioridade, intervalo, status, última/próxima) |
| `src/features/maintenance/MaintenanceRecordListItem.tsx` | criar | Linha de histórico |
| `src/features/maintenance/MaintenancePage.tsx` | criar | Rota `/v/:vehicleId/manutencao` — banner + 3 seções + `?novo=1` (abre execução) |
| `src/lib/routes.ts` | modificar | `vehicleMaintenance: (id) => \`/v/${id}/manutencao\`` |
| `src/lib/navigation.ts` | modificar | "Manutenção" (sidebar) e "Manutenção" (folha) trocam `to: null` |
| `src/app/router.tsx` | modificar | Rota filha `v/:vehicleId/manutencao` |
| `docs/DESIGN.md` | modificar | Densidade do banner de alerta, badge de prioridade/status, seções |
| `docs/DECISIONS.md` | modificar | ADR se algo divergir do esperado durante a implementação |

## 5. Ordem de execução

1. `features/maintenance/schemas.ts`
2. `useMaintenanceItems.ts`, `useMaintenanceRecords.ts`, `useVehicleAlerts.ts`
3. `AlertBanner.tsx`, `MaintenanceItemCard.tsx`, `MaintenanceRecordListItem.tsx`
4. `MaintenanceItemForm.tsx`, `MaintenanceRecordForm.tsx`
5. Diálogos de item de plano, depois de execução
6. `MaintenancePage.tsx`
7. `lib/routes.ts`, `lib/navigation.ts`, `router.tsx`
8. `docs/DESIGN.md`, `docs/DECISIONS.md`
9. Verificação manual + `tsc -b`/lint/build contra o Supabase de dev real

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Veículo novo sem plano/execução → 3 estados vazios, sem banner | manual |
| AC-2 | Criar item com só km preenchido → aparece em Próximas, status "planejado" | manual |
| AC-3 | Salvar sem nome, e sem nenhum intervalo → conferir recusa nos dois casos | manual |
| AC-4 | Registrar execução vinculada → aparece em Histórico, item mostra última execução | manual |
| AC-5 | Registrar execução sem vínculo → aparece em Histórico sem exigir item | manual |
| AC-6 | Item com data/km de vencimento no passado (editado via banco ou item com intervalo curto) → aparece em Vencidas + banner | manual |
| AC-7 | Item recém-criado, nunca executado → aparece em Próximas com indicação "planejado", distinto de "em dia" | manual |
| AC-8 | Editar item e registro → conferir refletido | manual |
| AC-9 | Desativar item → some de Vencidas/Próximas, histórico permanece | manual |
| AC-10 | Excluir item e registro → conferir sumiço | manual |
| AC-11 | Tocar "Manutenção" na folha dentro do veículo → navega + diálogo de execução aberto | manual |
| AC-12 | Abrir folha fora do veículo → "Manutenção" desabilitado com motivo certo | manual |
| AC-13 | Clicar "Manutenção" na sidebar dentro do veículo | manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Forçar vencimento pra testar "Vencidas" sem esperar meses/km reais | AC-6 fica difícil de verificar organicamente | Criar item com `interval_km` bem pequeno (ex.: 1km) relativo ao odômetro atual do veículo, ou `interval_months` com `last_service_date` bem antiga definida via execução datada no passado |
| Duas entidades no mesmo arquivo de navegação/rota podem confundir qual diálogo abre em cada entrada | Usuário clica "Manutenção" e não entende por que abriu execução, não plano | Diálogo de execução tem botão bem visível "ou criar item do plano" dentro da própria tela; distinção documentada em `DESIGN.md` |

## 8. Rollback

Toda tabela/view já existe e não é alterada. Reverter é `git revert`
dos commits da fase. Dado de teste é removido ao final.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] Build (`tsc -b`), lint passam
- [ ] `docs/DESIGN.md`/`docs/DECISIONS.md` atualizados
- [ ] Dado de teste removido do Supabase de dev
- [ ] Commit em `feature/006-maintenance` + merge `--no-ff` em `dev`,
      branch preservada
