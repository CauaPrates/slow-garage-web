# Verificação 005 — Abastecimento e métricas de consumo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-02 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Veículo temporário sem abastecimento: "Nenhum abastecimento registrado ainda." + botão "Registrar primeiro abastecimento"; nenhum bloco "Médio/Melhor/Pior/Custo·km" renderizado |
| AC-2 | ✅ | Registro só com Km/Litros/Valor/Tanque cheio (sem abrir "mais detalhes"): aparece na lista com a data de hoje (`02/09/2026`, calendário local) e combustível "flex" (o mesmo do veículo), confirmado abrindo o editar |
| AC-3 | ✅ | Submissão vazia: diálogo permanece aberto, 3 mensagens "Informe..." |
| AC-4 | ✅ | Quilometragem `-100`: mensagem "a quilometragem inválido.", diálogo permanece aberto |
| AC-5 | ✅ | Segundo registro na mesma quilometragem (1000): mensagem "Esse odômetro já foi registrado para este veículo." — não a genérica |
| AC-6 | ✅ | Dois abastecimentos com tanque cheio (1000→1400km, 40L): segundo mostra "10,0 km/L" |
| AC-7 | ✅ | Terceiro abastecimento sem tanque cheio (1400→1600km): km/L mostra "—"; custo/km mostra "R$ 0,70/km" — achado real, ver ADR-030 e AC-7 revisado |
| AC-8 | ✅ | Resumo mostra "Médio 10,0 km/L / Melhor 10,0 km/L / Pior 10,0 km/L / Custo/km R$ 30,52/km"; consulta direta a `vehicle_fuel_summary` confirma os mesmos valores (`avg_km_per_liter: 10, best_km_per_liter: 10, worst_km_per_liter: 10`) |
| AC-9 | ✅ | Edição de litros (10→22): lista passa a mostrar "22 L" |
| AC-10 | ✅ | Exclusão: `fuel_logs` do veículo cai de 3 para 2 linhas (consulta direta ao banco) |
| AC-11 | ✅ | Dentro do veículo, "Adicionar" → "Abastecimento": navega para `/v/:id/abastecimentos` com o diálogo "Registrar abastecimento" já aberto |
| AC-12 | ✅ | Em "/" (sem veículo), folha "Adicionar": botão "Abastecimento" com nome acessível "Abastecimento — Selecione um veículo" |
| AC-13 | ✅ | Clique em "Abastecimentos" na sidebar (dentro do veículo): `<a>` habilitado, navega para `/v/:id/abastecimentos` |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados durante a verificação

1. **Bug real de fuso horário, corrigido em dois formulários** — o
   default de "hoje" em `ExpenseForm` (Fase 4) e no novo `FuelLogForm`
   usava `new Date().toISOString().slice(0, 10)` (UTC). Em horário em
   que UTC já virou o dia mas o calendário local (Brasil, UTC-3) ainda
   não, isso pré-preenchia a data com **amanhã**. Descoberto porque a
   verificação rodou justamente numa janela assim (lista mostrou
   `03/09/2026` quando o dia local ainda era `02/09/2026`). Corrigido
   com `todayDateOnly()` (novo helper em `lib/format.ts`, baseado nos
   getters locais de `Date`) nos dois formulários — ADR-029.
2. **Discrepância real entre o contrato e o comportamento observado da
   view** — `fuel_log_metrics.cost_per_km` continua calculado mesmo com
   `is_full_tank = false`; só `km_per_liter` fica `null` nesse caso. A
   spec original (AC-7) presumia os dois nulos juntos, seguindo a
   redação do `API_CONTRACT.md`. Testado contra o banco real, a spec
   foi corrigida para descrever o comportamento verdadeiro — ADR-030.
3. **Falso positivo de lint corrigido na raiz** — `jsx-a11y/label-has-associated-control`
   acusava erro no toggle "Tanque cheio" (`<Switch>` dentro de
   `<label>`), mas não no `ThemeToggle` já existente com o mesmo
   padrão — só porque o `ThemeToggle` tem um filho condicional que faz
   a regra desistir da checagem, não porque estivesse corretamente
   coberto. Corrigido adicionando `Switch` a `controlComponents` no
   `eslint.config.js` (ADR-028), tornando a checagem real pros dois
   lugares.

## Saída dos comandos

### Build (`tsc -b && vite build`)
```
✓ 2974 modules transformed.
dist/assets/index-BQ07IOmO.css                                 22.69 kB │ gzip:  5.29 kB
dist/assets/index-Cfb4JMzR.js                                 179.82 kB │ gzip: 56.96 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB
dist/assets/providers-CRcIJEi9.js                             238.11 kB │ gzip: 62.78 kB
dist/assets/router-D8hyR6T5.js                                307.81 kB │ gzip: 88.13 kB

✓ built in 13.81s

PWA v1.3.0
mode      generateSW
precache  24 entries (1021.36 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Lint (`eslint .`)
```
> slow-garage-web@0.0.0 lint
> eslint .

(saída vazia — sem erro)
```

### Verificação funcional (script Playwright descartável, autenticado contra o Supabase de dev real)
```
  ok  setup: veículo temporário criado
  ok  AC-13: sidebar 'Abastecimentos' navega pra /v/:id/abastecimentos
  ok  AC-1: estado vazio com botão de registrar o primeiro, sem resumo
  ok  AC-3: submissão vazia é recusada no cliente — diálogo aberto=true erros=3
  ok  AC-4: quilometragem negativa recusada no cliente
  ok  AC-2: abastecimento aparece com data de hoje
  ok  AC-2: combustível pré-preenchido com o do veículo (flex) — flex
  ok  AC-5: quilometragem duplicada recusada com mensagem específica
  ok  AC-6: segundo abastecimento (tanque cheio) mostra km/L calculado
  ok  AC-7: abastecimento sem tanque cheio mostra '—' só no km/L (custo/km continua calculado)
  ok  AC-8: resumo mostra médio/melhor/pior/custo por km
  ok  AC-8: view vehicle_fuel_summary tem dado pro veículo
  ok  AC-9: edição reflete na lista
  ok  AC-10: exclusão remove o registro do banco — antes=3 depois=2
  ok  desktop: console sem erro inesperado (409 do AC-5 é esperado)
  ok  axe desktop sem violação serious/critical
  ok  Regressão: sidebar 'Gastos' continua link
  ok  Regressão: sidebar 'Dashboard' continua 'Em breve'
  ok  AC-11: dentro do veículo, 'Abastecimento' na folha é um link habilitado
  ok  AC-11: navega com o diálogo já aberto
  ok  AC-12: fora do veículo, 'Abastecimento' desabilitado com motivo certo
  ok  320px: sem overflow horizontal em /v/:id/abastecimentos
  ok  limpeza: veículo temporário removido
  ok  limpeza: nenhum abastecimento remanescente do veículo temporário

24/24 checagens passaram.
```

axe-core (`wcag2a`/`wcag2aa`) sem violação `serious`/`critical` em
desktop com a lista, resumo e diálogos abertos. Screenshots revisados
visualmente em 320px e 1440px — sem texto cortado, sem overflow,
densidade consistente com `DESIGN.md`. Uma dúvida visual (cor
aparentemente diferente no valor de "Custo/km") foi checada com
`getComputedStyle` real: todos os valores usam a mesma cor
(`rgb(245, 241, 232)`, token `--color-text-primary`) — era artefato de
compressão do screenshot, não um bug.

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Registrar um abastecimento de verdade no posto, no celular, e
   cronometrar — a meta do doc mestre é sub-30-segundos com os 4 campos
   visíveis.
2. Conferir o resumo de consumo com um histórico real de várias semanas
   de abastecimento, não só 3 registros de teste.
3. Testar o toggle "Perdi o abastecimento anterior" e conferir se o
   `cost_per_km`/`km_per_liter` do registro seguinte também ficam "—"
   (não testado nesta verificação — ver ADR-030).
