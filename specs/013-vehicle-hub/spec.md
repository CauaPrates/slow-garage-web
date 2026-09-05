# Spec 013 — Home do veículo como hub

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-04 |
| **Depende de** | `docs/DESIGN_2.md` (proposta em aberto nº 2, absorvida em `docs/DESIGN.md`); clarify feito em chat; Fase 12 (`--font-mono`, reaproveitado aqui) |

## 1. Problema

`VehiclePage` hoje mostra um resumo por seção (financeiro, combustível, contagem de atividade, gráficos), cada um empilhado na ordem em que a fase que o construiu chegou — sem uma leitura rápida de "como está o carro agora" nem um jeito de agir (registrar gasto, abastecimento etc.) sem sair da tela. É a tela mais visitada do produto e não funciona como ponto de entrada, só como lista de cards.

## 2. Resultado esperado

Ao abrir um veículo, o usuário vê acima da dobra: as 4 métricas que mais importam (km atual, custo/km, total investido, alertas ativos), um jeito de agir imediatamente (4 botões de ação rápida que abrem o formulário certo sem navegar), e o que aconteceu recentemente lado a lado com o que precisa de atenção. O detalhe que já existia (gasto do mês/ano, quebra por categoria, gráficos) continua acessível logo abaixo, sem duplicar número.

## 3. Cenários

**Principal**
1. Usuário abre `/v/:id` — vê a faixa de métricas, os botões de ação rápida, e a timeline recente + pendências, tudo sem rolar.
2. Usuário clica em "Gasto" na faixa de ações rápidas — o diálogo de registrar gasto abre por cima da própria `VehiclePage`, sem navegar; ao salvar, o diálogo fecha e a tela (métricas, timeline) atualiza sozinha.
3. Usuário rola a tela — encontra o resumo financeiro detalhado (gasto do mês/ano, por categoria/manutenção/combustível/projeto), o resumo de combustível, a contagem de atividade e os gráficos, exatamente como já existiam.

**Alternativos**
- Veículo sem nenhum alerta ativo: a métrica de alertas mostra `0`, não "—" nem oculta o módulo.
- Veículo sem nenhum evento na timeline: o bloco de timeline recente mostra o mesmo estado vazio que a página de Histórico já usa (reaproveitado, não inventado).

## 4. Escopo

**Dentro**
- Faixa de 4 métricas (`VehicleMetricsRow`, novo componente): km atual, custo/km, total investido — os 3 em `font-mono` (Fase 12) — e alertas ativos (contagem, `Space Grotesk`, é "contagem", não "medição direta", mesma regra da Fase 12).
- Faixa de 4 ações rápidas (`QuickActionsRow`, novo componente): Gasto, Abastecimento, Manutenção, Foto — cada botão abre o `Create*Dialog` já existente da respectiva entidade, direto por cima da `VehiclePage` (sem navegar). Reaproveita os diálogos e hooks de dado já construídos (`CreateExpenseDialog`+`useExpenseCategories`, `CreateFuelLogDialog`, `CreateMaintenanceRecordDialog`+`useMaintenanceItems`, `UploadPhotoDialog`+`useUploadGalleryPhoto`) — nenhum diálogo novo.
- Bloco lado a lado: timeline recente (5 itens mais recentes de `useTimeline`, reaproveitando `TimelineItem` já existente, com link "Ver histórico completo" pra `/historico`) + pendências (`AlertBanner` já existente, só reposicionado pra cá).
- `FinancialSummaryCard` perde os dois campos que subiram pra faixa de métricas (`total_invested`, `cost_per_km`) — os 6 restantes (gasto do mês/ano, gastos, manutenção, combustível, itens de projeto) continuam.
- Atualiza `docs/DESIGN.md`: proposta 2 sai de "em aberto" pra decidida.

**Fora** — explicitamente não entra agora
- Qualquer mudança em `FuelSummarySection`, `ActivityCountTiles`, `ExpensesByMonthChart`/`ExpensesByCategoryChart` — continuam exatamente como estão, só mudam de posição relativa na página (abaixo do novo bloco, na mesma ordem relativa entre si).
- Link/scroll da métrica de alertas para o bloco de pendências — fica só como número, sem interação, pra não inflar escopo com um comportamento não pedido no clarify.
- Editar/mover a lógica de cálculo de qualquer métrica — todo valor já vem pronto de `useVehicleDashboard`/`useTimeline`, nenhum cálculo novo no cliente.
- Ações rápidas de nota, problema, obrigação, financiamento, documento, item de projeto — só as 4 citadas no clarify (gasto, abastecimento, manutenção, foto) entram na faixa.

## 5. Critérios de aceite

- **AC-1**: Dado um veículo com dado completo, quando `VehiclePage` carrega, então a faixa de métricas mostra km atual, custo/km e total investido em `font-mono`, e alertas ativos como número inteiro (`Space Grotesk`).
- **AC-2**: Dado um veículo sem `current_odometer_km`/`purchase_price` (RN geral do projeto desde a Fase 11), quando a faixa de métricas renderiza, então os campos sem dado mostram "—", nunca `NaN`/`R$ null`.
- **AC-3**: Dado zero alertas ativos, quando a faixa renderiza, então a métrica mostra `0`, não "—" nem some.
- **AC-4**: Dado o clique em "Gasto" na faixa de ações rápidas, quando o diálogo abre e o usuário salva um gasto válido, então o gasto é criado, o diálogo fecha, e a faixa de métricas/timeline atualiza sem recarregar a página manualmente.
- **AC-5**: Idem para "Abastecimento", "Manutenção" e "Foto" — cada um abre o diálogo correto da entidade certa.
- **AC-6**: Dado o bloco de timeline recente, quando há eventos, então mostra os 5 mais recentes (mesmo componente `TimelineItem` da página de Histórico) com um link "Ver histórico completo" pra `/historico`.
- **AC-7**: Dado o bloco de pendências, quando há alerta ativo, então mostra o mesmo `AlertBanner` que já existia — sem lógica nova de o que conta como alerta.
- **AC-8**: Dado o card financeiro detalhado (`FinancialSummaryCard`), quando renderiza, então **não** repete "Total investido"/"Custo/km" (que já estão na faixa de métricas) — mostra só os 6 campos restantes.
- **AC-9 (negativo)**: Dado que o usuário não interagiu com nenhuma ação rápida, quando a página carrega, então nenhum diálogo abre sozinho.

## 6. Regras de negócio

- **RN-1**: Nenhum número exibido nesta fase é calculado no cliente — todos vêm prontos de `useVehicleDashboard` (métricas, alertas) ou `useTimeline` (eventos). Mesma disciplina de todas as fases anteriores.
- **RN-2**: Alerta ativo continua sendo definido inteiramente pelo backend (`dashboard.alerts`) — a métrica de contagem é só `dashboard.alerts.length`, nunca uma regra nova de "o que conta como alerta".

## 7. Dados

| Informação | Origem | Observação |
|---|---|---|
| Km atual, custo/km, total investido | `useVehicleDashboard` (já existente) | mesmos campos que já alimentavam `FinancialSummaryCard`/cabeçalho |
| Nº de alertas ativos | `dashboard.alerts.length` | `dashboard.alerts` já existe (usado por `AlertBanner`) |
| Timeline recente | `useTimeline(vehicleId)`, primeiros 5 | já ordenada por `occurred_on desc` no hook |

## 8. Estados e transições

N/A.

## 9. Erros e casos de borda

- Falha ao carregar `useVehicleDashboard`/`useTimeline`: cada bloco já tem seu próprio estado de erro/retry (reaproveita o padrão `isError`/`refetch` já usado no resto da `VehiclePage`), sem bloquear o restante da tela.
- Veículo sem nenhuma categoria de gasto cadastrada (`useExpenseCategories` vazio): o diálogo de gasto se comporta exatamente como já se comporta hoje em qualquer outro ponto de entrada — nada muda aqui.

## 10. Requisitos não-funcionais

- Em 320/390px, a faixa de 4 métricas e a faixa de 4 ações empilham em grid de 2 colunas (`grid-cols-2`) — 4 itens em coluna única ficaria alto demais acima da dobra; testado no `ui:check`/verificação manual.

## 11. Dependências e riscos

- Depende da Fase 12 já ter o token `--font-mono` disponível (já mesclado em `dev`).
- Risco: os 4 diálogos de ação rápida esperam props diferentes entre si (`categories`, `defaultFuelType`, `items`, nenhuma) — `VehiclePage` precisa buscar `useExpenseCategories`/`useMaintenanceItems` mesmo sem o usuário abrir o formulário ainda (custo: 2 queries a mais sempre carregadas na tela mais visitada). Mitigação: as duas já são pequenas (poucas linhas, RLS por usuário) e já são buscadas em outras páginas do mesmo veículo sem problema de performance percebido.

## 12. Perguntas abertas

Nenhuma — as 3 decisões de fronteira (faixa soma ou substitui, o que as ações rápidas fazem, o que é "pendências") foram fechadas em clarify por `AskUserQuestion` antes de escrever esta spec.
