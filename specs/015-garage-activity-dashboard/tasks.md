# Tasks 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Criar `HeaderActivityMenu` (ícone + popover, mesmo padrão do `HeaderAlertsMenu`, conteúdo migrado de `GarageActivityFeed`, agrupado por veículo) | `src/components/layout/HeaderActivityMenu.tsx` | AC-1, AC-2, AC-3, RN-3 | — | ☑ |
| 2 | Plugar `HeaderActivityMenu` no cabeçalho ao lado do sino de alertas | `src/components/layout/AppShell.tsx` | AC-1, AC-3 | 1 | ☑ |
| 3 | Criar `VehicleInvestmentChart` (barra horizontal, top 8 + "Outros", mesmo padrão do `ExpensesByCategoryChart`) | `src/features/dashboard/VehicleInvestmentChart.tsx` | AC-9 | — | ☑ |
| 4 | Criar `GarageComparisonDashboard` (tiles agregados + chart do passo 3, gate `vehicles.length >= 2`, exclui `null` de médias) | `src/features/vehicle/GarageComparisonDashboard.tsx` | AC-5, AC-6, AC-7, AC-8, RN-1, RN-2 | 3 | ☑ |
| 5 | Trocar `GarageActivityFeed` por `GarageComparisonDashboard` em "Minha Garagem" | `src/features/vehicle/VehicleListPage.tsx` | AC-4, AC-5, AC-6 | 2, 4 | ☑ |
| 6 | Remover `GarageActivityFeed.tsx` (sem mais consumidor) | `src/features/vehicle/GarageActivityFeed.tsx` | AC-4 | 5 | ☑ |
| 7 | `tsc --noEmit` + `eslint` limpos | — | — | 1-6 | ☑ |
| 8 | Verificação visual real (Playwright, login com conta de teste) em 390px e 1440px: popover de atividade em página fora de "Minha Garagem", painel comparativo, ausência do card antigo, sem overflow no cabeçalho | — | AC-1 a AC-9 | 7 | ☑ |
| 9 | **(015b)** Criar `SidebarActivityFeed` (itens compactos, agrupado por veículo, mesma fonte de dado) | `src/components/layout/SidebarActivityFeed.tsx` | AC-1, AC-2, AC-3, RN-3, RN-4 | — | ☑ |
| 10 | **(015b)** Plugar `SidebarActivityFeed` na sidebar, recebendo `vehicles` como prop | `src/components/layout/Sidebar.tsx` | AC-1, AC-1c | 9 | ☑ |
| 11 | **(015b)** Passar `vehicles` para `Sidebar` e restringir `HeaderActivityMenu` a abaixo de `lg` | `src/components/layout/AppShell.tsx` | AC-1b, AC-1c, RN-4 | 10 | ☑ |
| 12 | **(015b)** `tsc --noEmit` + `eslint` limpos | — | — | 9-11 | ☑ |
| 13 | **(015b)** Verificação visual real (Playwright): sidebar mostra atividade sem clique em 1440px e ícone do cabeçalho some; popover do cabeçalho continua funcionando em 390px e sidebar não existe nesse tamanho; sem overflow | — | AC-1, AC-1b, AC-1c | 12 | ☑ |
| 14 | **(015c)** Mudar gate do painel comparativo de `vehicles.length >= 2` para `vehicles.length > 0` | `src/features/vehicle/VehicleListPage.tsx` | AC-5 | — | ☑ |
| 15 | **(015c)** Esconder o painel comparativo no mobile (`hidden lg:block`) | `src/features/vehicle/VehicleListPage.tsx` | AC-6, RN-5 | 14 | ☑ |
| 16 | **(015c)** `tsc --noEmit` + `eslint` limpos | — | — | 14-15 | ☑ |
| 17 | **(015c)** Verificação visual real (Playwright, conta de teste com 18 veículos): painel comparativo visível em 1440px, ausente em 390px, sem overflow | — | AC-5, AC-6 | 16 | ☑ |
| 18 | **(015d)** Criar `useGarageMaintenance` (view `maintenance_status`, ativo + com data, ordenado por `next_service_date`) | `src/features/vehicle/useGarageMaintenance.ts` | AC-5 | — | ☑ |
| 19 | **(015d)** Remover "Km total rodado"; adicionar "Próxima manutenção" e "Pendências ativas" (reusando `useGarageAlerts`) | `src/features/vehicle/GarageComparisonDashboard.tsx` | AC-5, AC-12, RN-6, RN-7 | 18 | ☑ |
| 20 | **(015d)** Gráfico em hue único `--color-accent`, trilho reto e fino | `src/features/dashboard/VehicleInvestmentChart.tsx` | AC-10 | — | ☑ |
| 21 | **(015d)** Painel vira grade de instrumentos com fio de 1px; gráfico vira seção do painel | `src/features/vehicle/GarageComparisonDashboard.tsx` | AC-11 | 19, 20 | ☑ |
| 22 | **(015d)** Registrar a decisão (ADR-070 + entradas de "Densidade") | `docs/DECISIONS.md`, `docs/DESIGN.md` | AC-11 | 21 | ☑ |
| 23 | **(015d)** `tsc --noEmit` + `eslint` limpos | — | — | 18-21 | ☑ |
| 24 | **(015d)** Verificação real (Playwright): ausência do "Km total rodado", os 5 módulos, cor/altura/raio da barra computados, fio de 1px nos módulos, query real HTTP 200 e caminho populado | — | AC-5, AC-10, AC-11, AC-12 | 23 | ☑ |
| 25 | **(015e)** Shell de altura de viewport em `lg`+, com o `<main>` como contêiner de rolagem | `src/components/layout/AppShell.tsx` | AC-13, AC-14 | — | ☑ |
| 26 | **(015e)** Sidebar com altura limitada (`min-h-0 overflow-y-auto`) e grupos de link `shrink-0`, pra só a atividade ceder espaço | `src/components/layout/Sidebar.tsx` | AC-13 | 25 | ☑ |
| 27 | **(015e)** Registrar o modelo de rolagem em DESIGN.md ("Densidade") | `docs/DESIGN.md` | AC-13 | 26 | ☑ |
| 28 | **(015e)** Verificação real (Playwright) em 1440x900, 1280x620 e 390x844: posição de "Configurações" antes/depois de rolar, scroll interno do feed, documento rolando no mobile | — | AC-13, AC-14 | 27 | ☑ |
| 29 | **(015f)** `GarageSummary` vira acordeão fechado abaixo de `lg` (dois títulos, `aria-expanded`/`aria-controls`, gatilho `min-h-11`) | `src/features/vehicle/GarageSummary.tsx` | AC-15, AC-17 | — | ☑ |
| 30 | **(015f)** `VehicleInvestmentChart` mostra 4 barras + "Ver todos os N veículos"; remove a barra "Outros" e fixa a escala no conjunto inteiro | `src/features/dashboard/VehicleInvestmentChart.tsx` | AC-16, AC-17 | — | ☑ |
| 31 | **(015f)** Registrar o padrão de acordeão e o de lista longa em DESIGN.md ("Densidade") | `docs/DESIGN.md` | AC-15, AC-16 | 29, 30 | ☑ |
| 32 | **(015f)** Verificação real (Playwright): estado inicial/aria/altura do gatilho no mobile, ausência do gatilho no desktop, 4→18→4 barras, sem overflow | — | AC-15, AC-16, AC-17 | 31 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Nenhum.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| "Km rodados este mês" no lugar do "Km total rodado" (015d) | Sugerido no pedido como substituto que agrega corretamente | **Não implementado.** Não há tabela de leitura de odômetro — o km só existe grudado em evento que por acaso registrou. O delta do mês só enxerga entre a primeira e a última leitura registrada, e mês sem registro daria "0 km" com o carro tendo rodado. Trocaria métrica sem sentido por métrica enganosa. Aguardando decisão do usuário. |
| Etiqueta de placa mono em cada linha de "Investimento por veículo" (015d) | Sugerido pelo usuário como proposta | **Não implementado** — o próprio pedido marcou como proposta, não como escopo. |
| Bloco de "pendências da frota" linkando pro popover do sino (015d) | Sugerido pelo usuário como proposta | **Parcialmente coberto sem o link**: o módulo "Pendências ativas" já consome `useGarageAlerts` (RN-7), então não há regra duplicada. O *link* pro popover não foi implementado (proposta). |
| Ícone por tipo de evento na "Atividade recente" da sidebar (015d) | Sugerido pelo usuário como proposta | **Já existia desde a 015b** — `SidebarActivityFeed` usa `TIMELINE_EVENT_TYPE_ICONS`, o mesmo mapa da timeline. Nada a fazer. |
| `ExpensesByCategoryChart` ("Gasto por categoria", card `GarageSummary`) mantém cápsula `rounded-full` grossa e paleta categórica (015d) | Achado durante a medição do item 2 — é o vizinho direto do painel na mesma tela | **Não alterado**: ali a cor **mapeia** categoria (uso legítimo da paleta, ver DESIGN.md). Mas a diferença de forma (cápsula grossa vs. trilho fino) na mesma tela é inconsistência real. Reportado ao usuário como proposta. |
| "Ver mais" do `VehicleCard` (Fase 15, mobile) não tem `aria-expanded`/`aria-controls` (015f) | Ao montar os dois acordeões com o padrão WAI-ARIA correto, ficou visível que o toggle equivalente do card de veículo — escrito antes, na mesma sessão — não segue esse padrão | **Não alterado** (é um controle fora do escopo deste pedido). Correção de 2 linhas, reportada ao usuário. |
