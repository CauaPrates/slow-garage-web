# Plano 009 — Timeline, dashboard e busca

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia total já concedida pelo usuário para todas as fases) |

## 1. Abordagem

`features/dashboard/` ganha um hook (`useVehicleDashboard`) que chama `get_vehicle_dashboard`
uma vez e componentes que só desmontam o JSON (`FinancialSummaryCard`, `FuelSummarySection`,
`ExpensesByMonthChart`, `ExpensesByCategoryChart`, `ActivityCountTiles`) — `VehiclePage.tsx`
compõe esses blocos abaixo do cabeçalho que já existe, no lugar do parágrafo placeholder.
`features/timeline/` ganha a rota `/v/:vehicleId/historico` com filtro de tipo/período,
busca embutida (`search_vehicle`) e CRUD de nota completo (única fonte sem tela própria).
Os dois gráficos são SVG escrito à mão, seguindo o método da skill `dataviz` (cor por último,
paleta validada contra as superfícies reais do app).

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Biblioteca de gráfico (recharts, visx, chart.js) | Dois gráficos simples (coluna única-hue, barra horizontal categórica) não justificam ~40-90KB de dependência nova — mesma lógica da ADR-007/021 (componente escrito à mão quando o caso é simples) |
| Timeline com edição inline de todo tipo de evento (não só nota) | Cada tipo já tem formulário/validação/regra própria nas telas de origem (ex.: problema tem ciclo de status); duplicar isso na timeline é reescrever seis formulários pra um ganho marginal — "Ver" leva pra tela certa |
| Busca em rota própria (`/v/:id/buscar`) | Resultado de `search_vehicle` tem exatamente a mesma forma de um item de timeline (`source_table`/`title`/`occurred_on`) — decisão do usuário: embutir na timeline reaproveita a mesma lista/renderer em vez de duplicar |
| Dashboard como página nova (`/v/:id/dashboard`), deixando `VehiclePage` como está | O placeholder em `VehiclePage.tsx` já dizia literalmente "Dashboard completo chega na Fase 9" — a intenção sempre foi a mesma rota; criar uma segunda rota fragmentaria a navegação sem necessidade |
| Paleta categórica derivada do dourado do app (tons de âmbar) | A skill de dataviz exige validação (6 checks CVD/contraste) pra qualquer paleta nova; o app não tem uma rampa de tons documentada além do acento único. Mais seguro e mais rápido usar a paleta de referência já validada da skill, revalidada contra as superfícies reais do app (`#201c15`/`#fbf7ee`) — passou sem ajuste |

## 3. Impacto em contratos e dados

Nenhuma mudança de schema — `notes`, `vehicle_timeline`, `get_vehicle_dashboard`,
`search_vehicle` já existem no banco (confirmado com consulta direta contra o veículo
seed `bob`/Chevrolet Opala antes de escrever esta spec). `get_vehicle_dashboard` retorna
`Json` genérico no `database.types.ts` gerado — este plano define um tipo TS próprio
(`VehicleDashboard`) espelhando a forma real observada, já que o gerador não tipa o
retorno de função RPC que devolve `jsonb`.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/dashboard/types.ts` | criar | Tipo `VehicleDashboard` espelhando o retorno real de `get_vehicle_dashboard` |
| `src/features/dashboard/useVehicleDashboard.ts` | criar | `useQuery` chamando a RPC uma vez |
| `src/features/dashboard/FinancialSummaryCard.tsx` | criar | KPI row (total investido, custo/km, gasto mês/ano) + quebra (gasto/manutenção/combustível/itens) |
| `src/features/dashboard/FuelSummarySection.tsx` | criar | Bloco de consumo (médio/melhor/pior, litros totais) a partir de `dashboard.fuel_summary` |
| `src/features/dashboard/ActivityCountTiles.tsx` | criar | 2 stat tiles linkáveis: problemas em aberto, projetos ativos |
| `src/features/dashboard/ExpensesByMonthChart.tsx` | criar | Gráfico de coluna, hue único (`--color-accent`) |
| `src/features/dashboard/ExpensesByCategoryChart.tsx` | criar | Gráfico de barra horizontal, paleta categórica (8 slots) |
| `src/features/vehicle/VehiclePage.tsx` | modificar | Troca o parágrafo placeholder pelos blocos de `features/dashboard/` |
| `src/styles/tokens.css` | modificar | 8 variáveis `--chart-series-N` (light/dark/`[data-theme]`, mesmo padrão triplo já usado) |
| `src/features/timeline/schemas.ts` | criar | `noteSchema`; `TIMELINE_EVENT_TYPES`/labels/ícones por `event_type` |
| `src/features/timeline/useNotes.ts` | criar | CRUD de `notes` (mesmo padrão de `useIssues.ts`) |
| `src/features/timeline/useTimeline.ts` | criar | `useQuery` sobre `vehicle_timeline`, filtro tipo/período aplicado client-side (view já pequena por veículo) |
| `src/features/timeline/useVehicleSearch.ts` | criar | `useQuery` sobre `search_vehicle`, habilitado só quando há termo (debounce simples) |
| `src/features/timeline/TimelineItem.tsx` | criar | Renderiza um evento — nota com editar/excluir inline, resto com link "Ver" pra tela de origem |
| `src/features/timeline/SearchResultItem.tsx` | criar | Renderiza um resultado de busca (mesma forma visual de `TimelineItem`, sem ícone de tipo) |
| `src/features/timeline/TimelineFilters.tsx` | criar | Select de tipo + select de período (reaproveita `PERIODS`/`PERIOD_LABELS` de `expense/schemas.ts`) |
| `src/features/timeline/NoteForm.tsx` | criar | Formulário de nota |
| `src/features/timeline/CreateNoteDialog.tsx` / `EditNoteDialog.tsx` / `DeleteNoteDialog.tsx` | criar | Diálogos padrão |
| `src/features/timeline/TimelinePage.tsx` | criar | Página: busca + filtros + lista (timeline normal ou resultado de busca) |
| `src/lib/routes.ts` | modificar | `vehicleTimeline(vehicleId)` |
| `src/lib/navigation.ts` | modificar | "Histórico" (sidebar) e "Nota" (folha Adicionar) saem de `to: null` |
| `src/app/router.tsx` | modificar | Rota `v/:vehicleId/historico` |
| `docs/DECISIONS.md` | modificar | ADR-039+ |
| `docs/DESIGN.md` | modificar | Densidade dos gráficos, paleta categórica |

## 5. Ordem de execução

1. `dashboard/types.ts` + `useVehicleDashboard.ts` (contrato antes de UI)
2. Rodar a skill `dataviz`, validar paleta contra as superfícies reais → `tokens.css`
3. `ExpensesByMonthChart`/`ExpensesByCategoryChart` (isolados, testáveis com dado mockado)
4. `FinancialSummaryCard`/`FuelSummarySection`/`ActivityCountTiles`
5. `VehiclePage.tsx` compõe tudo — reverificar que o header/trocador de veículo (Fase 2/3) continuam idênticos
6. `timeline/schemas.ts` (contrato dos formulários e mapa de tipo→ícone/label)
7. `useNotes.ts` → `NoteForm`/diálogos (CRUD isolado, testável antes da timeline existir)
8. `useTimeline.ts` → `TimelineItem`/`TimelineFilters`
9. `useVehicleSearch.ts` → `SearchResultItem`
10. `TimelinePage.tsx` (junta timeline + filtro + busca + nota)
11. `routes.ts`/`navigation.ts`/`router.tsx`
12. `tsc -b` + lint + build
13. Verificação real (Playwright autenticado, screenshots 320/390/768/1440, contra o veículo seed **e** um veículo temporário vazio pra AC-2/AC-10)
14. `docs/DECISIONS.md`/`docs/DESIGN.md`, `verification.md`, commit, merge

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1, AC-3 | Script Playwright contra veículo seed (Chevrolet Opala, já tem alerta/gasto/etc.): inspeciona rede — uma única chamada a `get_vehicle_dashboard`, sem chamada avulsa a `vehicle_alerts` | automático (rede) |
| AC-2 | Script contra veículo temporário recém-criado, sem nenhum dado: cada bloco mostra "—", nenhum erro no console | automático |
| AC-4, AC-5 | Screenshot dos dois gráficos + checagem de que todo rótulo de valor está no DOM (não só visual) | automático + visual |
| AC-6 a AC-10 | Script cria evento em >=3 fontes diferentes, abre Histórico, aplica filtro de tipo e de período, confere contagem exata; testa veículo sem nenhum evento | automático |
| AC-11, AC-12 | Script cria/edita/exclui nota direto na timeline, confere reflexo imediato e consulta direta ao banco | automático + consulta direta |
| AC-13 | Clique em "Nota" na folha Adicionar → URL com `?novo=1` → diálogo já aberto | automático |
| AC-14, AC-15, AC-16 | Busca por termo com resultado, termo sem resultado, campo limpo — cada estado verificado | automático |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `event_type`/`source_table` real pode ter valor não previsto (view muda no futuro) | Ícone/label genérico feio ou `undefined` na tela | Mapa de ícone/label com fallback explícito (ícone neutro + `source_table` cru como label) em vez de quebrar; nunca assumir só os 7 tipos observados como exaustivos |
| Paleta categórica com 8 slots fixos, mas sistema tem 12 categorias de gasto | 9ª+ categoria sem cor própria | Dobra em "Outras" (soma) a partir do 9º slot, conforme já decidido no plano de cores (regra da skill: nunca gerar hue nova) |
| `VehiclePage.tsx` ficar muito longa/densa ao acrescentar 5-6 blocos novos | Tela difícil de manter, ou densa demais em 320px | Cada bloco é um componente próprio em `features/dashboard/`, `VehiclePage` só importa e empilha com `gap-6`; cada bloco testado isoladamente em 320px |

## 8. Rollback

Sem migration — reverter é `git revert`/descartar a branch sem tocar no banco. Único
cuidado: nota criada durante a verificação fica no veículo de teste, apagada junto com
ele ao final (mesma rotina de limpeza de toda fase anterior).

## 9. Definição de pronto

- [ ] Todos os ACs (AC-1 a AC-16) verificados com evidência em `verification.md`
- [ ] `npm run build` passa
- [ ] `tsc -b` sem erro
- [ ] `eslint` sem erro
- [ ] Paleta categórica validada com `validate_palette.js` contra as superfícies reais do app, nos dois modos
- [ ] Screenshots 320/390/768/1440 revisados visualmente, sem overflow horizontal
- [ ] `docs/DECISIONS.md`/`docs/DESIGN.md` atualizados
- [ ] `feature/009-timeline-dashboard` mergeada em `dev` (`--no-ff`), branch preservada
