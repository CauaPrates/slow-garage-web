# Tasks 007 — Problemas e projetos

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Schema de problema | `src/features/issue/schemas.ts` | AC-2, AC-3 | — | ☑ |
| 2 | Hooks de problema | `src/features/issue/useIssues.ts` | AC-1, AC-2, AC-4, AC-5 | 1 | ☑ |
| 3 | Formulário + item de lista de problema | `src/features/issue/IssueForm.tsx`, `src/features/issue/IssueListItem.tsx` | AC-2, AC-3, AC-4 | 1 | ☑ |
| 4 | Diálogos de problema | `src/features/issue/{Create,Edit,Delete}IssueDialog.tsx` | AC-2, AC-4, AC-5 | 3 | ☑ |
| 5 | Página de problemas (2 seções) | `src/features/issue/IssuesPage.tsx` | AC-1 | 4 | ☑ |
| 6 | Schemas de projeto e item | `src/features/project/schemas.ts` | AC-7, AC-10 | — | ☑ |
| 7 | Hooks de projeto (fetch batelado + CRUD) | `src/features/project/useProjects.ts` | AC-6, AC-7, AC-8 | 6 | ☑ |
| 8 | Hooks de item de projeto | `src/features/project/useProjectItems.ts` | AC-9, AC-10 | 6 | ☑ |
| 9 | Progresso, card de projeto, item de lista | `src/features/project/ProjectProgress.tsx`, `ProjectCard.tsx`, `ProjectItemListItem.tsx` | AC-7, AC-8 | 7, 8 | ☑ |
| 10 | Formulários de projeto e item | `src/features/project/ProjectForm.tsx`, `ProjectItemForm.tsx` | AC-9, AC-10, AC-11 | 6 | ☑ |
| 11 | Diálogos de projeto e item | `src/features/project/{Create,Edit,Delete}Project{,Item}Dialog.tsx` | AC-9, AC-10, AC-11 | 10 | ☑ |
| 12 | Página de projetos (lista + atalho "Upgrade") | `src/features/project/ProjectsPage.tsx` | AC-6, AC-11, AC-12 | 9, 11 | ☑ |
| 13 | Página de detalhe do projeto | `src/features/project/ProjectDetailPage.tsx` | AC-8, AC-9, AC-15 | 9, 11 | ☑ |
| 14 | Rotas + navegação (`Problemas`/`Projetos`/`Upgrade`) | `src/lib/routes.ts`, `src/lib/navigation.ts`, `src/app/router.tsx` | AC-13, AC-14 | 5, 12, 13 | ☑ |
| 15 | `docs/DESIGN.md` + `docs/DECISIONS.md` | — | — | 14 | ☑ |
| 16 | `tsc -b`, lint, build | — | todos | 1-14 | ☑ |
| 17 | Verificação manual completa contra o Supabase de dev + limpeza | `specs/007-issues-projects/verification.md` | todos | 16 | ☑ |
| 18 | Commit em `feature/007-issues-projects` + merge `--no-ff` em `dev` | — | — | 17 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
