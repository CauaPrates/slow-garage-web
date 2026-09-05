# Plano 013 — Home do veículo como hub

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia combinada — ver sdd_gate_autonomy) |

## 1. Abordagem

Dois componentes novos, pequenos e sem estado de dado próprio (recebem tudo via prop, o dado já existe em `useVehicleDashboard`): `VehicleMetricsRow` (4 tiles) e `QuickActionsRow` (4 botões + os 4 diálogos já existentes, com o `open`/`onOpenChange` local de sempre). `VehiclePage.tsx` ganha as duas queries que os diálogos precisam (`useExpenseCategories`, `useMaintenanceItems`) e a `useTimeline`, reordena o que já tinha (move `AlertBanner` pra dentro de um bloco novo ao lado da timeline), e remove 2 campos de `FinancialSummaryCard`.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Um componente `VehicleHub` único envolvendo tudo (métricas+ações+timeline+pendências) | Quebra o padrão do projeto de componente pequeno e focado (um por seção) — dificulta reaproveitar só a faixa de métricas ou só as ações em outro lugar no futuro, sem ganho real de organização |
| Ações rápidas navegando pra página de destino com `?novo=1` (como a folha "Adicionar" já faz) | Explicitamente descartada no clarify — usuário escolheu abrir o diálogo direto na própria `VehiclePage`, sem navegar |
| Métrica de alertas em `font-mono` (junto com as outras 3 da faixa) | É contagem, não medição direta — quebraria a regra que a própria Fase 12 fechou em clarify (só km/R$/L/km-por-L). Mantida a inconsistência visual leve (3 mono + 1 sans na mesma fileira) em troca de manter a regra coerente entre fases, registrado aqui pra não parecer esquecimento |
| Passar `FinancialSummaryCard` inteiro pra dentro de `VehicleMetricsRow` | O card detalhado tem 6 campos que não fazem parte da faixa de topo (gasto do mês/ano, categoria) — são conceitos diferentes (resumo rápido vs. detalhe), forçar os dois no mesmo componente misturaria densidade "hero" com densidade "relatório" |

## 3. Impacto em contratos e dados

Nenhum — todo dado já existe (`useVehicleDashboard`, `useTimeline`, `useExpenseCategories`, `useMaintenanceItems`, `useUploadGalleryPhoto` — todos hooks já construídos em fases anteriores). Nenhuma migration, nenhum tipo novo.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/dashboard/VehicleMetricsRow.tsx` | criar | faixa de 4 tiles (km, custo/km, total investido, alertas) |
| `src/features/dashboard/QuickActionsRow.tsx` | criar | faixa de 4 botões + os 4 `Create*Dialog` já existentes |
| `src/features/vehicle/VehiclePage.tsx` | modificar | adiciona `useExpenseCategories`/`useMaintenanceItems`/`useTimeline`, insere as duas faixas novas + bloco timeline/pendências acima do conteúdo já existente, move `AlertBanner` pra dentro do bloco novo |
| `src/features/dashboard/FinancialSummaryCard.tsx` | modificar | remove os `<dd>` de `total_invested`/`cost_per_km` (sobem pra `VehicleMetricsRow`) |
| `docs/DESIGN.md` | modificar | move a proposta 2 de "em aberto" pra decidida |

## 5. Ordem de execução

1. `VehicleMetricsRow.tsx` (só leitura de prop, sem dependência de outro arquivo novo)
2. `QuickActionsRow.tsx` (depende dos hooks de dado que `VehiclePage` vai passar via prop)
3. `FinancialSummaryCard.tsx` (remove os 2 campos — pode ser feito em paralelo com 1-2)
4. `VehiclePage.tsx` (consome os dois componentes novos, reordena o que já tinha)
5. `npm run build` + `npm run lint`
6. Verificação Playwright (mesma conta de teste): abrir `VehiclePage`, conferir os 9 ACs
7. Atualizar `docs/DESIGN.md`

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Playwright: ler texto dos 4 tiles + `getComputedStyle` (mono nos 3, sans no 4º) | automático |
| AC-2 | Playwright: veículo de teste sem `current_odometer_km`/`purchase_price` (reaproveita o da Fase 11) mostra "—" | automático |
| AC-3 | Playwright: veículo sem alerta mostra `0` no tile | automático |
| AC-4 | Playwright: clica "Gasto", preenche valor, salva, confirma que o gasto aparece na timeline recente sem reload manual | automático |
| AC-5 | Playwright: mesma checagem pros outros 3 botões (abre o diálogo certo, título do diálogo bate) | automático |
| AC-6 | Playwright: bloco de timeline mostra no máximo 5 itens + link "Ver histórico completo" | automático |
| AC-7 | Inspeção de código: `AlertBanner` é o mesmo import/componente de antes, só reposicionado | manual (inspeção) |
| AC-8 | Playwright: `FinancialSummaryCard` não tem mais `dt` "Total investido"/"Custo/km" | automático |
| AC-9 | Playwright: nenhum `role="dialog"` visível logo após o load da página | automático |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `VehiclePage` ganha 2 queries novas sempre ativas (categorias de gasto, itens de manutenção) mesmo se o usuário nunca abrir os diálogos de ação rápida | Requisição de rede a mais na tela mais visitada | Ambas já são pequenas e por usuário (RLS), mesmo padrão de custo já aceito em `ExpensesPage`/`MaintenancePage`; sem paginação nem N+1 |
| Remover `total_invested`/`cost_per_km` de `FinancialSummaryCard` pode quebrar algum teste ou expectativa visual não documentada | Regressão visual silenciosa | Conferido por `grep` que nenhum outro arquivo depende do `<dt>` desses dois campos especificamente; verificação visual cobre o resultado final |

## 8. Rollback

Reverter o commit — nenhuma migration, nenhum dado gravado.

## 9. Definição de pronto

- [x] Todos os ACs verificados com evidência em `verification.md`
- [x] `npm run build` passa
- [x] `npm run lint` passa
- [x] `docs/DESIGN.md` atualizado (proposta 2 sai de "em aberto")
