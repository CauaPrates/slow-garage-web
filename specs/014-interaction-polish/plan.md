# Plano 014 — Navegação sem clutter, breadcrumb, dashboard com identidade, sistema de resposta

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Quatro frentes independentes entre si (podem ser feitas em qualquer ordem, testadas juntas no final): (a) simplificar `navigation.ts` e os 3 componentes que o consomem pra esconder em vez de desabilitar; (b) `Breadcrumb` novo, prop-driven (cada página passa os segmentos extras, sem tentar adivinhar da URL); (c) `VehicleMetricsRow` reescrito com o arco SVG + sparkline real; (d) tokens de motion em `tokens.css`/`globals.css` + `useFlashOnChange` + ajuste em `button.tsx`/`AlertBanner.tsx`.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Breadcrumb derivado automaticamente da URL (`location.pathname.split("/")`) | `ProjectDetailPage` precisa do **nome** do projeto, que não está na URL — teria que buscar o dado de qualquer forma dentro do componente genérico, acoplando `Breadcrumb` a hooks de feature específica. Prop explícita por página é mais simples e não esconde de onde vem o dado |
| Biblioteca de animação (framer-motion, auto-animate) | CSS puro (`@keyframes`/`transition`/`:active`) resolve os 4 comportamentos pedidos sem dependência nova — mesma lógica de todo componente "escrito à mão" do projeto (ADR-007/021/039) |
| Sparkline com biblioteca de gráfico | 6 pontos, sem interação, sem eixo — SVG feito à mão de ~15 linhas, mesmo padrão do `ExpensesByMonthChart`/`ExpensesByCategoryChart` já existentes |
| Gauge de odômetro com "teto" arbitrário (ex.: 300.000km = 100%) | Não existe um teto real de vida útil do carro — inventar um só pra ter uma proporção seria fabricar dado. Preenchimento por "progresso até o próximo múltiplo de 10.000km" usa só o valor real, sem inventar escala |
| Esconder o FAB "Adicionar" inteiro sem veículo (em vez de desabilitar) | O FAB é um ponto de referência espacial fixo da bottom nav — sumir e reaparecer conforme navega seria mais desorientador que aparecer desabilitado com motivo claro |

## 3. Impacto em contratos e dados

Nenhum — todo dado já existe. Nenhuma migration, nenhum tipo novo.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/navigation.ts` | modificar | remove `to: null`/"not-built" (morto); `resolveNavItem` só resta "vehicle-scoped ou não" |
| `src/components/layout/Sidebar.tsx` | modificar | filtra item vehicle-scoped quando `vehicleId` é `null`, remove renderização de item desabilitado |
| `src/components/layout/BottomNav.tsx` | modificar | idem; FAB "Adicionar" ganha `disabled`/`aria-label` quando `vehicleId` é `null` |
| `src/components/layout/AddActionSheet.tsx` | modificar | remove o branch de item desabilitado (a folha só abre quando FAB está habilitado, logo sempre há veículo) |
| `src/components/layout/Breadcrumb.tsx` | criar | componente novo, prop `items: {label, href?}[]`, sempre prefixado por "Garagem" + nome do veículo |
| `src/features/expense/ExpensesPage.tsx`, `fuel/FuelLogsPage.tsx`, `maintenance/MaintenancePage.tsx`, `issue/IssuesPage.tsx`, `project/ProjectsPage.tsx`, `project/ProjectDetailPage.tsx`, `timeline/TimelinePage.tsx`, `document/DocumentsPage.tsx` | modificar | adiciona `<Breadcrumb items={...} />` |
| `src/hooks/useFlashOnChange.ts` | criar | hook: retorna `true` por 400ms quando o valor muda (nunca no mount) |
| `src/features/dashboard/VehicleMetricsRow.tsx` | reescrever | arco SVG pro km, sparkline pro total investido, indicador de ponto pros alertas, `useFlashOnChange` nos 3 valores |
| `src/styles/tokens.css` / `globals.css` | modificar | `@keyframes value-flash`/`alert-in`, `--animate-*` correspondentes |
| `src/components/ui/button.tsx` | modificar | `active:scale-95` + `transition-[color,background-color,transform]` na base |
| `src/features/maintenance/AlertBanner.tsx` | modificar | `motion-safe:animate-alert-in` em cada item |
| `docs/DECISIONS.md` | modificar | ADR novo: esconder item de nav em vez de desabilitar supera ADR-024/046 nesse ponto |
| `docs/DESIGN.md` | modificar | tokens de motion, mostrador como elemento-assinatura, breadcrumb, recusados |

## 5. Ordem de execução

1. `navigation.ts` + 3 componentes de navegação (base pro resto não depender de nada)
2. `Breadcrumb.tsx` + wiring nas 8 páginas
3. Tokens de motion (`tokens.css`/`globals.css`) — base pro `button.tsx`/`AlertBanner`/`VehicleMetricsRow`
4. `button.tsx`, `AlertBanner.tsx` (mudança pequena, isolada)
5. `useFlashOnChange.ts` + `VehicleMetricsRow.tsx` (a peça mais trabalhosa, por último)
6. `npm run build` + `npm run lint`
7. Verificação Playwright (conta de teste)
8. `docs/DECISIONS.md` + `docs/DESIGN.md`

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1, AC-2, AC-3 | Playwright: contar itens renderizados na sidebar/bottom-nav com e sem veículo selecionado | automático |
| AC-4, AC-5 | Playwright: texto/hrefs do breadcrumb em 2 páginas (uma simples, `ProjectDetailPage`) | automático |
| AC-6, AC-7 | Playwright: `aria-label` do mostrador com e sem `current_odometer_km` | automático |
| AC-8 | Playwright: presença do `<svg>` de sparkline quando há ≥2 meses de gasto | automático |
| AC-9 | Inspeção de código + Playwright: texto do tile de alertas continua presente (não só cor) | automático + inspeção |
| AC-10 | Inspeção de CSS computado (`:active` não é simulável via Playwright sem `page.mouse.down`, testado via classe presente no DOM) | automático (parcial) |
| AC-11 | Inspeção de código (classe `motion-safe:` presente) + Playwright emulando `prefers-reduced-motion: reduce` | automático |
| AC-12 | Playwright: registrar abastecimento, conferir classe de flash aparece brevemente no tile de km | automático |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Esconder itens de navegação pode ser achado como regressão por quem não leu esta spec | Confusão futura | ADR novo documentando a mudança deliberada, referenciando ADR-024/046 |
| Arco SVG mal calculado (ângulo/offset errado) renderiza visualmente quebrado | Elemento-assinatura com bug é pior que não ter elemento nenhum | Testado com múltiplos valores de km (0, exatamente múltiplo de 10.000, valor qualquer) na verificação |

## 8. Rollback

Reverter o commit — nenhuma migration, nenhum dado gravado.

## 9. Definição de pronto

- [x] Todos os ACs verificados com evidência em `verification.md`
- [x] `npm run build` passa
- [x] `npm run lint` passa
- [x] `docs/DECISIONS.md`/`docs/DESIGN.md` atualizados
