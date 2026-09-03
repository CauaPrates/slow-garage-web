# Plano 007 — Problemas e projetos

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Duas features independentes, `features/issue/` e `features/project/`,
cada uma no padrão de CRUD já validado. `issue` é uma entidade só,
igual gasto/abastecimento. `project` tem duas entidades (`projects` +
`project_items`) e uma rota de terceiro nível
(`/v/:vehicleId/projetos/:projectId`) pro detalhe — a primeira do
projeto. `PRIORITY_LEVELS`/`PRIORITY_LEVEL_LABELS` (já existentes em
`features/maintenance/schemas.ts`) são reaproveitados, não
redeclarados — terceiro uso do mesmo enum de prioridade.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Itens de projeto em acordeão na própria lista de projetos | Cada item tem ~8 campos (custo estimado/real, fornecedor, link, data...) — apertado demais numa lista expandida; rota própria segue o precedente já validado da Fase 3 pro veículo |
| Máquina de estado limitando transição de status | RN-2/decisão do clarify: nada no contrato indica validação de transição no banco; construir isso no cliente seria regra inventada |
| `PRIORITY_LEVELS` redeclarado em `issue`/`project` | Já existe em `maintenance/schemas.ts`; terceiro uso é ainda mais motivo pra reaproveitar, não duplicar |
| "Upgrade" abrindo formulário de item sem seletor de projeto (assume o "projeto ativo") | Não existe conceito de "projeto ativo" no dado — mais de um projeto em andamento é normal (ex.: som + suspensão ao mesmo tempo); esconder a escolha adivinharia errado às vezes |

## 3. Impacto em contratos e dados

Nenhuma tabela, view ou coluna nova. Leitura de `project_progress`
(ainda não usada). Escrita em `issues`, `projects`, `project_items`
(novas nesta fase). RN-4 (contrato): `project_items.vehicle_id` sempre
igual ao `vehicle_id` do projeto — o cliente sempre usa o `vehicleId`
da própria rota atual, nunca lê/copia de outro lugar.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/features/issue/schemas.ts` | criar | `issueSchema`, `ISSUE_STATUSES`/labels |
| `src/features/issue/useIssues.ts` | criar | Fetch + CRUD de `issues` |
| `src/features/issue/IssueForm.tsx` | criar | Formulário único create/edit |
| `src/features/issue/{Create,Edit,Delete}IssueDialog.tsx` | criar | CRUD |
| `src/features/issue/IssueListItem.tsx` | criar | Linha (título, prioridade, status, data) |
| `src/features/issue/IssuesPage.tsx` | criar | Rota `/v/:vehicleId/problemas` — 2 seções (Abertos/Resolvidos) |
| `src/features/project/schemas.ts` | criar | `projectSchema`, `projectItemSchema`, `PROJECT_STATUSES`/`PROJECT_ITEM_STATUSES`/labels (reaproveita `PRIORITY_LEVELS` de `maintenance/schemas.ts`) |
| `src/features/project/useProjects.ts` | criar | Fetch batelado (`projects` + `project_progress`) + CRUD de projeto |
| `src/features/project/useProjectItems.ts` | criar | Fetch + CRUD de `project_items` por `projectId` |
| `src/features/project/ProjectForm.tsx` | criar | Formulário de projeto |
| `src/features/project/ProjectItemForm.tsx` | criar | Formulário de item — `projectId` fixo (detalhe) ou seletor visível (atalho "Upgrade") |
| `src/features/project/{Create,Edit,Delete}ProjectDialog.tsx` | criar | CRUD de projeto |
| `src/features/project/{Create,Edit,Delete}ProjectItemDialog.tsx` | criar | CRUD de item |
| `src/features/project/ProjectProgress.tsx` | criar | Conclusão + orçamento, "—" quando `null` (RN-1) |
| `src/features/project/ProjectCard.tsx` | criar | Card na lista (nome, status, progresso resumido) |
| `src/features/project/ProjectItemListItem.tsx` | criar | Linha de item no detalhe |
| `src/features/project/ProjectsPage.tsx` | criar | Rota `/v/:vehicleId/projetos` — lista + diálogo rápido "Upgrade" (`?novo=1`) |
| `src/features/project/ProjectDetailPage.tsx` | criar | Rota `/v/:vehicleId/projetos/:projectId` — progresso + CRUD de itens |
| `src/lib/routes.ts` | modificar | `vehicleIssues`, `vehicleProjects`, `vehicleProject(vehicleId, projectId)` |
| `src/lib/navigation.ts` | modificar | "Problemas"/"Projetos" (sidebar) e "Upgrade" (folha) trocam `to: null` |
| `src/app/router.tsx` | modificar | Rotas filhas `problemas`, `projetos`, `projetos/:projectId` |
| `docs/DESIGN.md` | modificar | Densidade de progresso de projeto, seções de problema |
| `docs/DECISIONS.md` | modificar | ADR se algo divergir durante a implementação |

## 5. Ordem de execução

1. `issue/schemas.ts`, `project/schemas.ts`
2. `useIssues.ts`, `useProjects.ts`, `useProjectItems.ts`
3. `IssueForm.tsx`, `IssueListItem.tsx`
4. Diálogos de problema
5. `IssuesPage.tsx`
6. `ProjectProgress.tsx`, `ProjectCard.tsx`, `ProjectItemListItem.tsx`
7. `ProjectForm.tsx`, `ProjectItemForm.tsx`
8. Diálogos de projeto e de item
9. `ProjectsPage.tsx` (com o fluxo "Upgrade")
10. `ProjectDetailPage.tsx`
11. `lib/routes.ts`, `lib/navigation.ts`, `router.tsx`
12. `docs/DESIGN.md`, `docs/DECISIONS.md`
13. Verificação manual + `tsc -b`/lint/build contra o Supabase de dev real

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Veículo novo sem problema → 2 estados vazios | manual |
| AC-2 | Criar problema com título+data → aparece em Abertos | manual |
| AC-3 | Salvar sem título e sem data, separadamente → recusa | manual |
| AC-4 | Mudar status pra resolved/dismissed → sai de Abertos, entra em Resolvidos | manual |
| AC-5 | Editar e excluir problema e projeto → refletido, sem resíduo | manual |
| AC-6 | Veículo novo sem projeto → estado vazio com ação | manual |
| AC-7 | Criar projeto, abrir detalhe sem item → progresso "—" | manual |
| AC-8 | Projeto com 2+ itens (status/custo variados) → progresso bate com `project_progress` (consulta direta) | manual |
| AC-9 | Adicionar item → aparece na lista, progresso recarrega | manual |
| AC-10 | Item sem nome → recusa | manual |
| AC-11 | "Upgrade" com projeto existente → formulário com seletor, item salvo no projeto certo | manual |
| AC-12 | "Upgrade" sem projeto nenhum → mensagem + atalho de criar projeto | manual |
| AC-13 | Folha fora do veículo → "Upgrade" desabilitado com motivo certo | manual |
| AC-14 | Sidebar "Problemas"/"Projetos" dentro do veículo → navegação certa | manual |
| AC-15 | `projectId` inválido → "não encontrado" + link de volta | manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Item de projeto exigir `vehicle_id` batendo com o do projeto (RN-4/contrato) | Insert recusado com erro `P0001` pouco claro se o cliente errar o valor | Sempre usar o `vehicleId` da rota atual (nunca outro), documentado explicitamente em RN-4; `translatePostgresError` cai no fallback genérico se algum dia acontecer |
| Três rotas novas (`problemas`, `projetos`, `projetos/:projectId`) de uma vez | Mais superfície pra revalidar nav/regressão | Reaproveita 100% o padrão de `resolveNavItem`/`useCurrentVehicleId` já testado nas 3 fases anteriores — sem mudança nesse mecanismo |
| Diálogo "Upgrade" sem projeto — decidir onde mostrar o aviso | Usuário preso num formulário sem seletor útil | `ProjectsPage` decide antes de abrir o diálogo: com 0 projetos, mostra painel de aviso em vez do formulário |

## 8. Rollback

Toda tabela/view já existe e não é alterada. Reverter é `git revert`
dos commits da fase. Dado de teste é removido ao final.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] Build (`tsc -b`), lint passam
- [ ] `docs/DESIGN.md`/`docs/DECISIONS.md` atualizados
- [ ] Dado de teste removido do Supabase de dev
- [ ] Commit em `feature/007-issues-projects` + merge `--no-ff` em
      `dev`, branch preservada
