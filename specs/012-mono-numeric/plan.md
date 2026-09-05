# Plano 012 — Papel tipográfico mono para número de medição

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia combinada — ver sdd_gate_autonomy) |

## 1. Abordagem

Adicionar a fonte (pacote + import CSS + token), deixar o Tailwind v4 gerar a utilidade `font-mono` a partir do token sobrescrito, e aplicar a classe só nos elementos identificados no clarify. Nenhum componente novo, nenhuma abstração — é literalmente `className="... font-mono"` em ~13 elementos já existentes.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Criar um componente `<MonoValue>` para envolver todo número mono | Over-engineering pra uma troca de 1 classe CSS em elementos que já existem — nenhum dos 13 pontos tem lógica repetida além do `className`, envolver num componente some com a legibilidade de "isso é só um `<dd>` com uma classe a mais" sem ganho real |
| Aplicar `font-mono` via `@layer base` global em `dd` ou em alguma tag semântica | `<dd>` é usado em outros lugares do app (progresso de projeto, financiamento, obrigação) que ficam **fora** do escopo desta fase — aplicar globalmente violaria o próprio recorte que o clarify fechou |

## 3. Impacto em contratos e dados

Nenhum — mudança puramente de CSS/classe, sem tocar em nenhum dado, tipo ou contrato.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `package.json` | modificar | adiciona `@fontsource/jetbrains-mono` |
| `src/styles/globals.css` | modificar | `@import "@fontsource/jetbrains-mono/latin-400.css";` + expõe `--font-mono` no `@theme inline` |
| `src/styles/tokens.css` | modificar | declara `--font-mono: "JetBrains Mono", ui-monospace, monospace;` em `:root` (não muda por tema) |
| `src/features/vehicle/VehiclePage.tsx` | modificar | envolve o número de km do cabeçalho num `<span className="font-mono">` |
| `src/features/dashboard/FinancialSummaryCard.tsx` | modificar | `font-mono` nos 8 `<dd>` |
| `src/features/dashboard/FuelSummarySection.tsx` | modificar | `font-mono` nos 5 `<dd>` |
| `src/features/fuel/FuelSummaryCard.tsx` | modificar | `font-mono` nos 4 `<dd>` |
| `docs/DESIGN.md` | modificar | move a proposta de "em aberto" pra decidida — registra fonte, escopo e os arquivos tocados |

## 5. Ordem de execução

1. Pacote + import CSS + token (base antes de consumidor)
2. Os 4 componentes, em qualquer ordem (independentes entre si)
3. `npm run build` + `npm run lint`
4. Verificação visual (Playwright, mesma conta de teste da Fase 011: screenshot ou leitura de `computed font-family` nos elementos-alvo)
5. Atualizar `docs/DESIGN.md`

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Playwright: `getComputedStyle` do `<dd>` de "Total investido" no card financeiro contém `"JetBrains Mono"` | automático (script ad-hoc) |
| AC-2 | Idem, `FuelSummarySection` na `VehiclePage` | automático |
| AC-3 | Idem, `FuelSummaryCard` na página de abastecimentos | automático |
| AC-4 | Idem, número de km no cabeçalho da `VehiclePage` | automático |
| AC-5 | Visual: veículo sem dado suficiente mostra "—" sem quebra (mesmo veículo de teste da Fase 011) | manual/visual |
| AC-6 | Playwright: `getComputedStyle` de um item de `ExpenseListItem`/`VehicleCard` **não** contém `"JetBrains Mono"` | automático |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| `--font-mono` já é chave padrão do tema Tailwind v4 | Sobrescrever sem querer algo que já dependia do default | Confirmado por `grep` (spec.md §11): nenhum uso prévio de `font-mono` no código |

## 8. Rollback

Reverter o commit — nenhuma migration, nenhum dado gravado, puramente CSS/classe.

## 9. Definição de pronto

- [x] Todos os ACs verificados com evidência em `verification.md`
- [x] `npm run build` passa
- [x] `npm run lint` passa
- [x] `docs/DESIGN.md` atualizado (proposta sai de "em aberto")
