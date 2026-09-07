# Plano 020 — Assistente FIPE

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | implementado |

## 1. Abordagem

Três camadas, cada uma com uma responsabilidade: `fipeExternal` fala HTTP
e traduz falha; `fipeCache` é a fonte de marca/modelo com interface
estável; os hooks decidem *quando* buscar. A UI é um bloco colapsável
acima dos campos manuais, que só chama `setValue` — nunca escreve no
banco.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Ler marca/modelo de `fipe_brands`/`fipe_models` como o pedido pedia | As tabelas não existem no schema real (verificado com `npm run types`). Codar contra contrato inexistente não compila e esconde o problema. Interface mantida pra troca ser de uma função (ADR-075). |
| `<select>` nativo pra marca/modelo | 107 marcas e 585 modelos numa marca comum (medido na Fiat). `<select>` não filtra por digitação. |
| Hand-roll do combobox em cima do `Popover` | Teclado, `aria-activedescendant` e filtro são fáceis de errar. `cmdk` é a base do Combobox do shadcn, que o pedido citou. Dependência nova justificada e registrada. |
| Preencher combustível/câmbio pela FIPE | "Flex"/"mec." não mapeiam 1:1 nos enums do banco; preencher errado é pior que não preencher. |
| Buscar ano junto com o modelo | O pedido exige sob demanda, e são +2 chamadas a um terceiro sem SLA por modelo visitado. |
| Cachear valor por muito tempo | A tabela FIPE tem mês de referência; valor velho exibido como atual é informação errada. |

## 3. Impacto em contratos e dados

Nenhum. Nenhuma tabela, view, RPC ou tipo gerado muda. Nenhuma escrita
nova no Supabase.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/fipe/fipeExternal.ts` | criar | HTTP + timeout + `FipeError` + parse do valor. |
| `src/lib/fipe/fipeCache.ts` | criar | Fonte de marca/modelo; hoje delega ao externo (ADR-075). |
| `src/features/vehicle/useFipe.ts` | criar | Os 4 hooks, com ano/valor sob demanda. |
| `src/components/ui/combobox.tsx` | criar | Combobox buscável (Popover + cmdk) com tokens do projeto. |
| `src/features/vehicle/FipeAssistant.tsx` | criar | O bloco colapsável e seus estados. |
| `src/features/vehicle/VehicleForm.tsx` | modificar | Monta o assistente e liga `setValue`. |
| `package.json` | modificar | `cmdk`. |

## 5. Ordem de execução

1. `fipeExternal` (sem dependência).
2. `fipeCache` sobre ele.
3. Hooks.
4. `Combobox`.
5. `FipeAssistant`.
6. Integração no `VehicleForm`.
7. Verificação real (Playwright + axe + `ui-check.mjs`).

## 6. Cobertura dos critérios de aceite

| AC | Como | Tipo |
|---|---|---|
| AC-1 a AC-8 | Roteiro Playwright contra o app real, exercitando o fluxo inteiro | manual automatizado |
| AC-9 | `ui-check.mjs` (320/390/768/1440/teclado) + axe no bloco aberto | automatizado |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| API externa fora do ar | Bloco inútil | Timeout, `retry: 1`, erro local; formulário manual intacto |
| Lista de 585 modelos pesada | Combobox travado | `cmdk` filtra em memória; lista virtualizada não foi necessária (medido: sem travamento em 320px) |
| Valor exibido como se fosse "do sistema" | Usuário confia num número que é estimativa | Rótulo explícito com mês de referência + texto "É uma sugestão — o campo continua editável" (RN-1) |

## 8. Rollback

`git revert` do merge. Nenhuma migration, nenhum dado gravado.

## 9. Definição de pronto

- [x] ACs verificados com evidência
- [x] `tsc`, `eslint` e `build` limpos
- [x] `ui-check.mjs` sem overflow/axe sério
- [x] Harness temporário de verificação removido
