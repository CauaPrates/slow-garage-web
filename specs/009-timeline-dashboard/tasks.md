# Tasks 009 — Timeline, dashboard e busca

Referência: ./plan.md §5. Uma task por vez, marcar ao concluir.

## Dashboard

- [x] T1 — `dashboard/types.ts` + `useVehicleDashboard.ts` — AC-1
- [x] T2 — Paleta: validar com `validate_palette.js` contra superfícies reais, adicionar `--chart-series-N` em `tokens.css` — AC-4
- [x] T3 — `ExpensesByMonthChart.tsx` — AC-5
- [x] T4 — `ExpensesByCategoryChart.tsx` — AC-4
- [x] T5 — `FinancialSummaryCard.tsx` + `FuelSummarySection.tsx` + `ActivityCountTiles.tsx` — AC-1, AC-2
- [x] T6 — `VehiclePage.tsx` compõe os blocos, substitui o placeholder — AC-1, AC-2, AC-3

## Timeline e nota

- [x] T7 — `timeline/schemas.ts` (nota + mapa de tipo→ícone/label) — base
- [x] T8 — `useNotes.ts` + `NoteForm`/Create/Edit/Delete dialogs — AC-11, AC-12
- [x] T9 — `useTimeline.ts` + `TimelineItem.tsx` + `TimelineFilters.tsx` — AC-6, AC-7, AC-8, AC-9, AC-10
- [x] T10 — `useVehicleSearch.ts` + `SearchResultItem.tsx` — AC-14, AC-15, AC-16
- [x] T11 — `TimelinePage.tsx` juntando tudo, `?novo=1` pra nota — AC-13

## Navegação

- [x] T12 — `routes.ts`/`navigation.ts`/`router.tsx` — AC-13

## Fechamento

- [x] T13 — `tsc -b` + lint + build limpos
- [x] T14 — Verificação real via Playwright (todos os ACs, veículo com dado + veículo vazio)
- [x] T15 — `docs/DECISIONS.md`, `docs/DESIGN.md`, `specs/009-timeline-dashboard/verification.md`
- [x] T16 — Commit + merge `--no-ff` em `dev`
