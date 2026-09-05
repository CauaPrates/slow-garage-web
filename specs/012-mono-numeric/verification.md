# Verificação 012 — Papel tipográfico mono para número de medição

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-04 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Playwright, `getComputedStyle` do `<dd>` "Total investido" (`FinancialSummaryCard`, conta `e2e-test@dev.local`): `"JetBrains Mono", ui-monospace, monospace`. |
| AC-2 | ✅ | Idem, `<dd>` "Médio" de `FuelSummarySection` (dashboard da `VehiclePage`): mesma fonte. |
| AC-3 | ✅ | Idem, `<dd>` "Médio" de `FuelSummaryCard` (página `/abastecimentos`): mesma fonte. |
| AC-4 | ✅ | Idem, `<span>` de quilometragem no cabeçalho da `VehiclePage`: mesma fonte. |
| AC-5 | ✅ | Confirmado por inspeção de código — o "—" de fallback está dentro do mesmo elemento que recebeu `font-mono`; não há caminho de código onde o fallback usa um elemento diferente. |
| AC-6 (negativo) | ✅ | Playwright: `<dd>` "Km" do `VehicleCard` (garagem) retorna `"Space Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif` — não herdou `font-mono`. |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Saída dos comandos

### Build
```
✓ built in 1.54s

PWA v1.3.0
mode      generateSW
precache  76 entries (1190.89 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Lint
```
> slow-garage-web@0.0.0 lint
> eslint .
```
Saída vazia — sem violação.

### Verificação visual (Playwright, conta `e2e-test@dev.local`)
```
login ok
vehicleId: c236d322-3aba-4c71-be77-283406edf261
AC-4 (km cabeçalho): "JetBrains Mono", ui-monospace, monospace
AC-1 (Total investido): "JetBrains Mono", ui-monospace, monospace
AC-2 (Médio, FuelSummarySection): "JetBrains Mono", ui-monospace, monospace
AC-3 (Médio, FuelSummaryCard): "JetBrains Mono", ui-monospace, monospace
AC-6 negativo (VehicleCard Km): "Space Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif
```

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Comparar visualmente o "peso"/legibilidade do JetBrains Mono nos 4 pontos contra o resto da tela em 320px — a automação só confirmou a fonte computada, não a sensação de leitura.
2. Conferir em tema claro também (só testado em dark nesta verificação).
