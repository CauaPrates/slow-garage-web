# Tasks 020 — Assistente FIPE

| # | Task | Arquivos | AC | Status |
|---|---|---|---|---|
| 1 | Regenerar types e conferir o pressuposto do backend | `src/types/database.types.ts` | — | ☑ (reprovou — ver ADR-075) |
| 2 | Cliente da API externa com timeout e `FipeError` | `src/lib/fipe/fipeExternal.ts` | AC-8, RN-4 | ☑ |
| 3 | Fonte de marca/modelo com interface estável | `src/lib/fipe/fipeCache.ts` | AC-2 | ☑ |
| 4 | Hooks, com ano/valor sob demanda | `src/features/vehicle/useFipe.ts` | AC-3 | ☑ |
| 5 | Combobox buscável com tokens do projeto | `src/components/ui/combobox.tsx` | AC-2, AC-9 | ☑ |
| 6 | Bloco colapsável com todos os estados | `src/features/vehicle/FipeAssistant.tsx` | AC-1, AC-6, AC-7, AC-8 | ☑ |
| 7 | Integração no formulário via `setValue` | `src/features/vehicle/VehicleForm.tsx` | AC-4, AC-5, RN-1 | ☑ |
| 8 | `tsc` + `eslint` + `build` limpos | — | — | ☑ |
| 9 | Verificação real (Playwright + axe + `ui-check`) | — | AC-1 a AC-9 | ☑ |

## Escopo recusado / não entregue

| O que | Por quê | Decisão |
|---|---|---|
| `fipeCache` lendo `fipe_brands`/`fipe_models` do Supabase | Tabelas não existem no schema real | Interface preservada, implementação no externo. Troca de uma função quando a migration entrar (ADR-075) |
| Gravar `fipe_brand_id`/`fipe_model_id` em background | Colunas não existem em `vehicles` | **Não implementado.** Códigos já expostos no `FipeFillPayload` |
| Preencher combustível/câmbio pela FIPE | Texto da FIPE não mapeia nos enums do banco | Fora de escopo, registrado na spec |
