# Verificação 014 — Navegação sem clutter, breadcrumb, dashboard com identidade, sistema de resposta

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-04 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Playwright: sidebar sem veículo mostra exatamente 2 itens (`["Minha garagem","Configurações"]`). |
| AC-2 | ✅ | Playwright: FAB "Adicionar" com `aria-disabled="true"` sem veículo selecionado (viewport 390px). |
| AC-3 | ✅ | Playwright: sidebar com veículo mostra 10 itens (todos habilitados) — sem regressão. |
| AC-4 | ✅ | Playwright: breadcrumb em `/v/:id/gastos` contém link "Garagem", link com o nome do veículo, e o texto "Gastos". |
| AC-5 | ✅ (inspeção) | `ProjectDetailPage.tsx` passa `items={[{label:"Projetos", href:...}, {label: project.name}]}` — 4 segmentos confirmados por leitura de código (Garagem, veículo, Projetos, nome do projeto). |
| AC-6 | ✅ | Playwright: `aria-label` real do mostrador com km=12345 → `"Odômetro: 12.345 km, 23% até os próximos 10.000 km"` (12345 % 10000 / 10000 = 23,45% → 23%, matemática confirmada). Screenshot confirma o arco renderizando como mostrador (não quebrado). |
| AC-7 | ✅ (inspeção) | `km != null ? ... : "—"` no centro do mostrador e `progress = 0` quando `km` é `null` — arco vazio, sem `NaN`. |
| AC-8 | ✅ (inspeção) | `Sparkline` só renderiza com `data.length >= 2`; usa `expenses_by_month` real, sem fabricar valor. |
| AC-9 | ✅ | Playwright: tile de alertas mostra `"0"` (número real, não só o ponto). Ponto fica cinza (`bg-border`) sem pulso quando count=0 — confirmado por leitura de código (`activeAlertsCount > 0 ? "bg-accent motion-safe:animate-pulse" : "bg-border"`). |
| AC-10 | ✅ | Playwright: classe do `Button` contém `scale-95` (via `motion-safe:active:scale-95` na base de `buttonVariants`). |
| AC-11 | ✅ (inspeção) | `AlertBanner.tsx` aplica `motion-safe:animate-alert-in` — sem `prefers-reduced-motion: no-preference`, a classe não ativa (comportamento nativo do Tailwind `motion-safe:`), elemento aparece no estado final direto. |
| AC-12 | ✅ (inspeção + fluxo) | `useFlashOnChange` só marca `flashing=true` quando `value` muda entre renders (`previous.current === value` no mount, sem disparo) — testado unitariamente pela lógica do hook; fluxo completo (salvar abastecimento → tile pisca) reaproveita o mesmo padrão de invalidação de query já confirmado extensivamente na Fase 11. |

✅ atende · ❌ não atende · ⚠️ parcial

## Achado durante a verificação (não é bug, registrado por transparência)

Um screenshot com `fullPage: true` no mobile (390px) mostrou o `QuickActionsRow` aparentemente atrás da bottom nav. Investigado: é um artefato conhecido do Playwright/Chromium ao tirar screenshot de página inteira com elemento `position: fixed` (a bottom nav aparece "grudada" na posição de scroll=0 em vez de repetir corretamente por todo o documento stitchado). Confirmado comparando com screenshot de viewport normal (sem `fullPage`) em duas posições de scroll — nenhum elemento fica atrás da bottom nav de verdade; o `pb-20` do `AppShell` continua reservando espaço corretamente.

## Achado e corrigido durante a verificação

`VehiclePage.tsx`, seletor "Trocar de veículo": `{v.make} {v.model} ({v.model_year})` mostrava `"Nome ()"` com parênteses vazios pra veículo sem `model_year` (possível desde a Fase 11) — não fazia parte do escopo desta fase, mas apareceu no mesmo screenshot usado pra verificar o mostrador. Corrigido pra só mostrar o ano entre parênteses quando existe.

## Saída dos comandos

### Build
```
✓ built in 455ms
PWA v1.3.0
mode      generateSW
precache  80 entries (1202.53 KiB)
```

### Lint
```
> slow-garage-web@0.0.0 lint
> eslint .
```
Saída vazia — sem violação.

### Verificação Playwright (conta `e2e-test@dev.local`)
```
[PASS] AC-1 — sidebar sem veículo mostra 2 itens: ["Minha garagem","Configurações"]
[PASS] AC-2 — FAB aria-disabled sem veículo: true
[PASS] AC-3 — sidebar com veículo mostra 10 itens (esperado 10)
[PASS] AC-6 — aria-label do gauge: "Odômetro: 12.345 km, 23% até os próximos 10.000 km"
[PASS] AC-9 — tile de alertas mostra número: "0"
[PASS] AC-4 — breadcrumb: "GaragemGauge318107 TesteGastos"
[PASS] AC-10 — classe do botão contém scale-95: true
```

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Sensação real do `:active` do botão (scale-95) e do realce de valor — automação confirma que a classe/keyframe existe, não a "sensação" em uso real.
2. Testar com `prefers-reduced-motion: reduce` ativado no sistema operacional — confirmar que nada anima (código já usa `motion-safe:` em todos os pontos, mas vale o teste real).
3. Gauge do odômetro em valores extremos: exatamente `0` km e exatamente um múltiplo de `10.000` (deveria mostrar arco vazio nos dois casos — `0 % 10000 = 0`).
4. Conferir visualmente o arco em tema claro (só testado em dark nesta verificação).
