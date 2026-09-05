# Verificação 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-05 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Login real com `e2e-test@dev.local`, navegação até a página de um veículo (`/v/<id>`, fora de "Minha Garagem"), clique no ícone "Atividade recente" no cabeçalho. Script Playwright: `[390] Ícone "Atividade recente" visível na página do veículo: true` / `[390] Popover de atividade abriu: true` (idem em 1440px). Screenshot: `.ui-check/390-activity-popover.png`, `.ui-check/1440-activity-popover.png` — mostram os eventos agrupados por veículo dentro do popover. |
| AC-2 | ⬜ | Não verificado com conta real (a conta de teste tem eventos registrados). Coberto por leitura de código: `HeaderActivityMenu.tsx` renderiza a mesma string de estado vazio que `GarageActivityFeed` usava quando `feedQuery.data.length === 0`. |
| AC-3 | ⬜ | Não verificado com conta sem veículos (a conta de teste tem 18). Coberto por leitura de código: `HeaderActivityMenu` tem `if (vehicles.length === 0) return null;`, mesmo padrão de guarda que `HeaderVehicleSwitcher`/`HeaderAlertsMenu` já usam. |
| AC-4 | ✅ | Script Playwright: `[390] Card antigo "Atividade recente" ainda na tela (deve ser false): false` e idem em 1440px. Screenshot de página inteira `.ui-check/390-garage-dashboard.png` / `.ui-check/1440-garage-dashboard.png` — sem o card antigo. |
| AC-5 | ✅ | Conta de teste tem 18 veículos (2+). Script: `[390] Painel "Comparativo da garagem" visível: true` (idem 1440). Screenshot `.ui-check/390-dashboard-zoom.png` / `.ui-check/1440-dashboard-zoom.png` mostram os 4 indicadores (Veículos na garagem, Km total rodado, Custo/km médio, Gasto no mês) e o gráfico de investimento por veículo. |
| AC-6 | ⬜ | Não verificado com conta de 1 veículo só (a conta de teste tem 18). Coberto por leitura de código: o gate `vehicles.length >= 2` em `VehicleListPage.tsx` é o único ponto que monta `GarageComparisonDashboard` — mesma condição já usada e comprovada para `GarageSummary`. |
| AC-7 | ⚠️ parcial | Não há veículo com `current_odometer_km` nulo na conta de teste pra provar o caso isoladamente. Verificado por leitura de código: `GarageComparisonDashboard.tsx` filtra `km != null` antes de somar (`odometers`), e mostra "—" quando `odometers.length === 0`. |
| AC-8 | ⚠️ parcial | Mesma limitação do AC-7: nenhum veículo da conta de teste está sem `cost_per_km`. Verificado por leitura de código: `costsPerKm` filtra `cost != null` antes de calcular a média; retorna `null` (exibido como "—") se a lista ficar vazia. |
| AC-9 | ✅ | Conta de teste tem 18 veículos. Screenshot `.ui-check/1440-dashboard-zoom.png` mostra 8 barras individuais coloridas + 1 barra "Outros" (R$ 85,00, soma dos 10 restantes). |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Saída dos comandos

### Checagem de tipos
```
$ npx tsc --noEmit
(sem saída — passou)
```

### Lint
```
$ npm run lint

> slow-garage-web@0.0.0 lint
> eslint .

(sem saída — passou)
```

### Verificação visual (Playwright, login real)
```
[390] Ícone "Atividade recente" visível na página do veículo: true
[390] Popover de atividade abriu: true
[390] overflow: scrollWidth=390 innerWidth=390 ok
[390] Card antigo "Atividade recente" ainda na tela (deve ser false): false
[390] Painel "Comparativo da garagem" visível: true
[390] console errors: nenhum
[1440] Ícone "Atividade recente" visível na página do veículo: true
[1440] Popover de atividade abriu: true
[1440] overflow: scrollWidth=1440 innerWidth=1440 ok
[1440] Card antigo "Atividade recente" ainda na tela (deve ser false): false
[1440] Painel "Comparativo da garagem" visível: true
[1440] console errors: nenhum
```

## Pendências

- AC-2, AC-3, AC-6, AC-7, AC-8 não têm evidência de execução real porque a
  conta de teste disponível (`e2e-test@dev.local`) não tem um cenário de
  "zero veículos", "1 veículo só" ou "veículo sem km/custo-por-km"
  configurado. A lógica que cobre esses casos foi lida linha a linha e
  segue o mesmo padrão já validado em componentes irmãos
  (`HeaderAlertsMenu`, `GarageSummary`), mas fica registrado como parcial
  em vez de ✅ por dedução.

## Para o humano testar na mão

1. Numa conta com 1 veículo só (ou filtrando visualmente), confirmar que
   "Comparativo da garagem" não aparece em "Minha Garagem".
2. Numa conta sem nenhum veículo, confirmar que o ícone de atividade
   recente não aparece no cabeçalho.
3. Editar um veículo removendo o odômetro atual (deixando em branco) e
   conferir que "Km total rodado" no painel não vira "0 km" só por causa
   dele.
4. Registrar/editar dados até um veículo ficar sem `cost_per_km`
   calculável (ex: sem nenhum gasto) e conferir que "Custo/km médio" não
   cai artificialmente por causa desse veículo.
5. Sensação de uso: abrir e fechar o popover de atividade em telas
   diferentes do app (não só a home) e confirmar que o conteúdo é sempre
   o mesmo (não depende de estar em "Minha Garagem").
