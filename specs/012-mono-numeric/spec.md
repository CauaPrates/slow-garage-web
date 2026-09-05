# Spec 012 — Papel tipográfico mono para número de medição

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | M |
| **Criada em** | 2026-09-04 |
| **Depende de** | `docs/DESIGN_2.md` (proposta em aberto nº 1); clarify feito em chat (ver decisões abaixo) |

## 1. Problema

Km, R$ e km/L nos cards de resumo hoje usam a mesma fonte do texto ao redor (Space Grotesk) — correto, mas sem nenhuma diferenciação visual entre "dado que representa uma medição direta do carro/gasto" e o resto do texto de apoio. `docs/DESIGN_2.md` propôs reservar uma família mono só para esse tipo de número, citando o mostrador digital de painel como referência — mas deixou a decisão explicitamente em aberto (fonte, escopo de aplicação, quais números contam).

## 2. Resultado esperado

Os números de medição direta nos 3 cards de resumo do app (financeiro, combustível do dashboard, combustível da página de abastecimentos) e o odômetro no cabeçalho da página do veículo passam a usar JetBrains Mono, lendo como um mostrador digital — sem mudar peso, cor ou tamanho, só a família. Todo o resto do app (listas, data, contagem) continua em Space Grotesk, sem fragmentar a leitura do restante da interface.

## 3. Cenários

**Principal**
1. Usuário abre a página de um veículo — o número de km no cabeçalho e os valores de "Total investido"/"Custo/km" no card financeiro aparecem em JetBrains Mono.
2. Usuário abre "Abastecimentos" — médio/melhor/pior km/L e custo/km no resumo aparecem em JetBrains Mono.

**Alternativos**
- Nenhum dado disponível (campo `null`): o "—" de fallback também herda a fonte mono (é o mesmo elemento, só sem conteúdo numérico) — não precisa de tratamento especial.

## 4. Escopo

**Dentro**
- Adicionar `@fontsource/jetbrains-mono` (peso 400, self-hosted, mesma convenção OFL das 3 fontes já usadas) e o token `--font-mono` em `tokens.css`, exposto via `@theme inline` (Tailwind já gera a utilidade `font-mono` nativamente a partir desse token).
- Aplicar `font-mono` aos valores de `<dd>` em `FinancialSummaryCard.tsx` (8 valores: total investido, custo/km, gasto do mês, gasto do ano, gastos, manutenção, combustível, itens de projeto — todos monetários).
- Aplicar `font-mono` aos valores de `<dd>` em `FuelSummarySection.tsx` (5 valores: médio/melhor/pior km/L, preço médio por litro, litros no total).
- Aplicar `font-mono` aos valores de `<dd>` em `FuelSummaryCard.tsx` (4 valores: médio/melhor/pior km/L, custo/km).
- Aplicar `font-mono` ao número de odômetro no cabeçalho de `VehiclePage.tsx`.

**Fora** — explicitamente não entra agora
- Qualquer outro número do app (linha de lista de gasto/abastecimento/manutenção, data, contagem de parcela, ano do veículo, prioridade, contador de alerta em `ActivityCountTiles`) — decisão do clarify: só "hero numbers" de card de resumo, só medição direta (km/R$/L/km-por-L).
- `VehicleCard.tsx` (card da garagem, lista de veículos) — é um item de lista repetido, não um card de resumo isolado; mesma lógica de "não fragmentar leitura" que já excluiu listas comuns.
- Qualquer novo layout ou nova métrica — isso é a Fase 013 (`specs/013-vehicle-hub/`). Se a Fase 013 introduzir uma nova apresentação do odômetro (ex.: tile de métrica na home do veículo), a decisão de fonte ali é dessa fase, não retroativa desta.
- Pesos adicionais de JetBrains Mono (500/600/700) — nenhum `<dd>` tocado usa peso diferente de regular hoje; carregar peso que não é usado é o mesmo erro que a Fase 0 cometeu com Noto Sans JP (ADR, "O que foi recusado").

## 5. Critérios de aceite

- **AC-1**: Dado o card financeiro da página do veículo, quando renderizado, então todo valor monetário (`total_invested`, `cost_per_km`, `current_month_spend`, `current_year_spend`, `total_expenses`, `total_maintenance`, `total_fuel`, `total_project_items`) usa a fonte `--font-mono` (JetBrains Mono).
- **AC-2**: Dado o resumo de combustível do dashboard (`FuelSummarySection`), quando renderizado, então os 5 valores (médio/melhor/pior km/L, preço médio/L, litros no total) usam `--font-mono`.
- **AC-3**: Dado o resumo de combustível da página de abastecimentos (`FuelSummaryCard`), quando renderizado, então os 4 valores (médio/melhor/pior km/L, custo/km) usam `--font-mono`.
- **AC-4**: Dado o cabeçalho da página do veículo, quando renderizado, então o número de quilometragem atual usa `--font-mono`.
- **AC-5**: Dado qualquer um dos 3 cards acima sem dado suficiente (valor `null`), quando renderizado, então o "—" de fallback aparece normalmente (nenhuma quebra visual por causa da fonte).
- **AC-6 (negativo)**: Dado qualquer linha de lista (gasto, abastecimento, execução de manutenção, item de timeline) ou o card de veículo na garagem, quando renderizado, então a fonte continua Space Grotesk — não recebe `font-mono`.

## 6. Regras de negócio

- **RN-1**: `font-mono` é só família tipográfica — nunca muda peso (`font-weight`), cor ou tamanho do elemento que já tinha antes. É uma troca de `font-family`, isolada.

## 7. Dados

N/A — mudança puramente visual, nenhum dado novo nasce, muda ou é lido.

## 8. Estados e transições

N/A.

## 9. Erros e casos de borda

- Fonte não carregada (rede lenta): cai no fallback da pilha `ui-monospace, monospace` (mesma prática de fallback já usada em `--font-sans`/`--font-hero`) — nunca quebra layout, só troca a aparência temporariamente até a fonte carregar.

## 10. Requisitos não-funcionais

- Peso de bundle: só 1 arquivo de fonte (`latin-400.css` do `@fontsource/jetbrains-mono`) é carregado, mesmo cuidado do ADR sobre `noto-sans-jp` (nunca carregar peso/subset não usado).

## 11. Dependências e riscos

- Risco: `--font-mono` já é uma chave do tema padrão do Tailwind v4 (a utilidade `font-mono` já existe antes desta fase, apontando pro fallback `ui-monospace` do Tailwind). Sobrescrever via `@theme inline` + `tokens.css` precisa confirmar que nenhum componente já usava `font-mono` com outro propósito antes desta fase — checado por `grep`, nenhum uso prévio encontrado.

## 12. Perguntas abertas

Nenhuma — as 3 decisões (fonte, escopo de aplicação, quais números contam) foram fechadas em clarify por `AskUserQuestion` antes de escrever esta spec.
