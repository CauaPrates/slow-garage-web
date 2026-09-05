# Verificação 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-05 (revisado 015b e 015c no mesmo dia) |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Login real com `e2e-test@dev.local`, navegação até a página de um veículo (`/v/<id>`, fora de "Minha Garagem"), clique no ícone "Atividade recente" no cabeçalho. Script Playwright: `[390] Ícone "Atividade recente" visível na página do veículo: true` / `[390] Popover de atividade abriu: true` (idem em 1440px). Screenshot: `.ui-check/390-activity-popover.png`, `.ui-check/1440-activity-popover.png` — mostram os eventos agrupados por veículo dentro do popover. |
| AC-2 | ⬜ | Não verificado com conta real (a conta de teste tem eventos registrados). Coberto por leitura de código: `HeaderActivityMenu.tsx` renderiza a mesma string de estado vazio que `GarageActivityFeed` usava quando `feedQuery.data.length === 0`. |
| AC-3 | ⬜ | Não verificado com conta sem veículos (a conta de teste tem 18). Coberto por leitura de código: `HeaderActivityMenu` tem `if (vehicles.length === 0) return null;`, mesmo padrão de guarda que `HeaderVehicleSwitcher`/`HeaderAlertsMenu` já usam. |
| AC-4 | ✅ | Script Playwright: `[390] Card antigo "Atividade recente" ainda na tela (deve ser false): false` e idem em 1440px. Screenshot de página inteira `.ui-check/390-garage-dashboard.png` / `.ui-check/1440-garage-dashboard.png` — sem o card antigo. |
| AC-5 | ⚠️ superado | Redefinido na revisão 015c abaixo (painel passou a exigir 1+ veículo, não 2+). Ver seção "Revisão 015c". |
| AC-6 | ⚠️ superado | Redefinido na revisão 015c abaixo (painel escondido no mobile, não mais "com 1 veículo só"). Ver seção "Revisão 015c". |
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

## Revisão 015b — atividade recente pela sidebar no desktop

O usuário apontou que a v1 desta fase deixava a atividade recente atrás
de um ícone/popover em **toda** tela, inclusive desktop — ele queria ler
direto pela sidebar (nav bar) sem clicar, e só usar outro mecanismo no
mobile (que não tem sidebar). ACs 1/1b/1c abaixo substituem o AC-1
original.

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 (revisado) | ✅ | Login real, 1440px, home. Script: `[1440] "Atividade recente" visível na sidebar sem clique: true`. Screenshot `.ui-check/1440-sidebar-viewport.png` mostra a seção "ATIVIDADE RECENTE" na sidebar, com os eventos mais recentes agrupados por veículo, sem nenhum clique. |
| AC-1b | ✅ | Login real, 390px. Script: `[390] Ícone de atividade no cabeçalho visível: true` / `[390] Popover abre normalmente: true`. Screenshot `.ui-check/390-header-popover-still-works.png`. |
| AC-1c | ✅ | Script: `[1440] Ícone de atividade no cabeçalho (deve estar oculto no desktop): false` e `[390] sidebar visível (deve ser false no mobile): false` — mutuamente exclusivo confirmado nos dois sentidos. |
| RN-4 | ✅ | Mesma evidência do AC-1c — nunca os dois mecanismos visíveis ao mesmo tempo. |

### Saída do comando (015b)
```
[1440] "Atividade recente" visível na sidebar sem clique: true
[1440] Ícone de atividade no cabeçalho (deve estar oculto no desktop): false
[1440] overflow: scrollWidth=1440 innerWidth=1440 ok
[1440] console errors: nenhum
[390] sidebar visível (deve ser false no mobile): false
[390] Ícone de atividade no cabeçalho visível: true
[390] Popover abre normalmente: true
[390] overflow: scrollWidth=390 innerWidth=390 ok
[390] console errors: nenhum
```

### Tipos e lint (015b)
```
$ npx tsc --noEmit
(sem saída — passou)

$ npm run lint
> slow-garage-web@0.0.0 lint
> eslint .
(sem saída — passou)
```

## Revisão 015c — painel comparativo com 1 veículo + escondido no mobile

O usuário testou com a própria conta (1 veículo só, "Peugeot 308") e viu
a área vazia — a v1 exigia 2+ veículos pra mostrar o painel, mesma regra
do `GarageSummary`. Ele confirmou explicitamente que quer o painel visível
mesmo com 1 veículo (mesmo repetindo número já visível no card daquele
veículo). Na mesma rodada, pediu pra esconder o painel inteiro no
mobile, pra não empilhar informação demais numa tela pequena.

| AC | Resultado | Evidência |
|---|---|---|
| AC-5 (revisado) | ✅ | `VehicleListPage.tsx` mudou o gate de `vehicles.length >= 2` para `vehicles.length > 0`. Login real, 1440px, conta de teste (18 veículos, satisfaz `> 0`): `[1440] "Comparativo da garagem" visível: true`. `GarageComparisonDashboard` não tem gate interno de quantidade (todo `reduce`/`filter` do componente já era seguro com array de 1 elemento, sem mudança de lógica necessária). |
| AC-6 (revisado) | ✅ | `VehicleListPage.tsx` envolve `GarageComparisonDashboard` num `<div className="hidden lg:block">`. Script: `[390] "Comparativo da garagem" visível: false`, `[390] overflow: ok`. Screenshot `.ui-check/390-comparison-mobile-hidden.png` mostra a tela indo direto de "Resumo de todos os veículos" pra lista de veículos, sem o painel comparativo. |
| RN-1 (revisada) | ✅ | Mesma evidência do AC-5 — o painel não depende mais de quantidade de veículos. |
| RN-5 (nova) | ✅ | Mesma evidência do AC-6 — painel é exclusivo de `lg`+. |

### Saída do comando (015c)
```
[1440] "Comparativo da garagem" visível: true
[1440] overflow: scrollWidth=1440 innerWidth=1440 ok
[1440] console errors: nenhum
[390] "Comparativo da garagem" visível: false
[390] overflow: scrollWidth=390 innerWidth=390 ok
[390] console errors: nenhum
```

### Tipos e lint (015c)
```
$ npx tsc --noEmit
(sem saída — passou)

$ npm run lint
> slow-garage-web@0.0.0 lint
> eslint .
(sem saída — passou)
```

Não foi possível testar com exatamente 1 veículo usando a conta de teste
(`e2e-test@dev.local` tem 18) — a evidência acima prova que o gate mudou
de `>= 2` para `> 0` e que a lógica interna do componente já era segura
para 1 elemento, mas o humano deve confirmar visualmente na própria conta
real (1 veículo) que o layout com 1 barra só no gráfico fica legível.

## Pendências

- AC-2, AC-3, AC-7, AC-8 não têm evidência de execução real porque a
  conta de teste disponível (`e2e-test@dev.local`) não tem um cenário de
  "zero veículos" ou "veículo sem km/custo-por-km" configurado. A lógica
  que cobre esses casos foi lida linha a linha e segue o mesmo padrão já
  validado em componentes irmãos (`HeaderAlertsMenu`, `GarageSummary`),
  mas fica registrado como parcial em vez de ✅ por dedução.
- AC-5/AC-6 (revisados em 015c) não foram testados com exatamente 1
  veículo de verdade — só com a conta de teste (18 veículos, cobre o
  "1+") e por leitura de código pra confirmar que o cálculo não quebra
  com array de 1 elemento.

## Para o humano testar na mão

1. Na sua conta real (1 veículo, "Peugeot 308"), confirmar que
   "Comparativo da garagem" agora aparece em "Minha Garagem" no desktop,
   e que o gráfico com 1 barra só fica legível (não cortado, não
   esmagado).
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
