# Tasks 014 — Navegação sem clutter, breadcrumb, dashboard com identidade, sistema de resposta

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Simplificar `navigation.ts` (remove `to: null`/"not-built") | `src/lib/navigation.ts` | — | — | ☑ |
| 2 | Sidebar só mostra item vehicle-scoped com veículo selecionado | `src/components/layout/Sidebar.tsx` | AC-1, AC-3 | 1 | ☑ |
| 3 | Bottom nav idem + FAB desabilitado sem veículo | `src/components/layout/BottomNav.tsx` | AC-2, AC-3 | 1 | ☑ |
| 4 | `AddActionSheet` sem branch de item desabilitado | `src/components/layout/AddActionSheet.tsx` | AC-2 | 3 | ☑ |
| 5 | Criar `Breadcrumb` | `src/components/layout/Breadcrumb.tsx` | AC-4, AC-5 | — | ☑ |
| 6 | Adicionar `Breadcrumb` nas 8 páginas de subtela | 8 arquivos (ver plan.md §4) | AC-4, AC-5 | 5 | ☑ |
| 7 | Tokens de motion (`value-flash`, `alert-in`) | `src/styles/tokens.css`, `src/styles/globals.css` | AC-11, AC-12 | — | ☑ |
| 8 | `active:scale-95` + transition em `Button` | `src/components/ui/button.tsx` | AC-10 | 7 | ☑ |
| 9 | Animação de entrada em `AlertBanner` | `src/features/maintenance/AlertBanner.tsx` | AC-11 | 7 | ☑ |
| 10 | Criar `useFlashOnChange` | `src/hooks/useFlashOnChange.ts` | AC-12 | 7 | ☑ |
| 11 | Reescrever `VehicleMetricsRow` (arco + sparkline + ponto de alerta + flash) | `src/features/dashboard/VehicleMetricsRow.tsx` | AC-6, AC-7, AC-8, AC-9, AC-12 | 10 | ☑ |
| 12 | `npm run build` + `npm run lint` | repo inteiro | todos | 2-11 | ☑ |
| 13 | Verificação Playwright (conta `e2e-test@dev.local`) | — | todos | 12 | ☑ |
| 14 | ADR novo (esconder vs. desabilitar) + atualizar `docs/DESIGN.md` | `docs/DECISIONS.md`, `docs/DESIGN.md` | — | 13 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| Nenhum | — | — |
