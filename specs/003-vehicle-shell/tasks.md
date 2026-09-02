# Tasks 003 — Casca de navegação e rota do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Adicionar `vehicle(id)` a `ROUTES` | `src/lib/routes.ts` | AC-1, AC-7 | — | ☑ |
| 2 | Criar configuração de navegação (sidebar, bottom nav, add-sheet) | `src/lib/navigation.ts` | AC-4, AC-5, AC-6 | 1 | ☑ |
| 3 | Adicionar `useVehicle(vehicleId)` derivado do cache existente | `src/features/vehicle/useVehicles.ts` | AC-1, AC-3 | — | ☑ |
| 4 | Construir `Sidebar` desktop com item habilitado/desabilitado | `src/components/layout/Sidebar.tsx` | AC-4, AC-9 | 2 | ☑ |
| 5 | Construir `AddActionSheet` (folha via Dialog reposicionado) | `src/components/layout/AddActionSheet.tsx` | AC-6, AC-9, AC-10 | 2 | ☑ |
| 6 | Construir `BottomNav` mobile com botão Adicionar destacado | `src/components/layout/BottomNav.tsx` | AC-5, AC-6, AC-9, AC-10 | 2, 5 | ☑ |
| 7 | Compor `AppShell` com Sidebar + Outlet + BottomNav | `src/components/layout/AppShell.tsx` | AC-4, AC-5 | 4, 6 | ☑ |
| 8 | Construir `VehiclePage` (loading, não encontrado, erro, sucesso) | `src/features/vehicle/VehiclePage.tsx` | AC-1, AC-2, AC-3, AC-7, AC-8 | 3 | ☑ |
| 9 | Ligar rota `v/:vehicleId` no router | `src/app/router.tsx` | AC-1, AC-3 | 8 | ☑ |
| 10 | Tornar `VehicleCard` navegável sem quebrar Editar/Excluir | `src/features/vehicle/VehicleCard.tsx` | AC-1 | 9 | ☑ |
| 11 | Atualizar `docs/DESIGN.md` (padrão de item desabilitado, densidade da nav) | `docs/DESIGN.md` | — | 4, 5, 6 | ☑ |
| 12 | Registrar ADRs (sheet sem lib nova; convenção de nav pendente) | `docs/DECISIONS.md` | — | 5, 4 | ☑ |
| 13 | Rodar `tsc`, lint, build | — | todos | 1-10 | ☑ |
| 14 | Verificação manual + `ui:check` (320/390/768/1440) contra Supabase de dev | `specs/003-vehicle-shell/verification.md` | todos | 13 | ☑ |
| 15 | Commit em `feature/003-vehicle-shell` e merge `--no-ff` em `dev` | — | — | 14 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
