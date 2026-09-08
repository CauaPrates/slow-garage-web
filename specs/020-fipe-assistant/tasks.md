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
| 10 | Fechar AC-8 com falha induzida de verdade (abort, 500, JSON inválido, timeout) | — | AC-8 | ☑ |
| 11 | Percorrer o fluxo de edição no `EditVehicleDialog` real | — | AC-1, AC-4, AC-5, AC-6 | ☑ |
| 12 | Submit real no banco (INSERT + UPDATE + persistência após reload), com limpeza | — | AC-4, AC-5, AC-6, RN-1 | ☑ |

## Fase 023 — persistência ligada

| # | Task | Arquivos | AC | Status |
|---|---|---|---|---|
| 13 | Confirmar no PostgREST se as colunas/tabelas existem — árbitro é a API do banco, não o tipo local | — | — | ☑ |
| 14 | Regerar types e conferir o que entrou (76 linhas, nenhuma removida) | `src/types/database.types.ts` | — | ☑ |
| 15 | `fipeCache` passa a ler `fipe_brands`/`fipe_models` do Supabase | `src/lib/fipe/fipeCache.ts` | AC-2 | ☑ |
| 16 | Hooks recebem `brandId` e `fipeModelCode` (dois identificadores, RN-9) | `src/features/vehicle/useFipe.ts` | AC-3 | ☑ |
| 17 | Assistente carrega os IDs graváveis no payload | `src/features/vehicle/FipeAssistant.tsx` | AC-4 | ☑ |
| 18 | Schema ganha `fipeBrandId`/`fipeModelId` (sem campo de tela) | `src/features/vehicle/schemas.ts` | — | ☑ |
| 19 | Limpar IDs quando marca/modelo é editado à mão (RN-8) | `src/features/vehicle/VehicleForm.tsx` | RN-8 | ☑ |
| 20 | Persistir nos dois diálogos, com `toFormDefaults` carregando os IDs existentes | `CreateVehicleDialog.tsx`, `EditVehicleDialog.tsx` | — | ☑ |
| 21 | Verificar no banco: FK gravada, integridade, RN-8 nos dois sentidos, limpeza | — | AC-4, RN-8, RN-9 | ☑ |

## Escopo recusado / não entregue

| O que | Por quê | Decisão |
|---|---|---|
| Preencher combustível/câmbio pela FIPE | Texto da FIPE ("Flex", "mec.") não mapeia nos enums do banco | Fora de escopo, registrado na spec |
| Motos e caminhões | A API tem `/motos` e `/caminhoes`; V1 é só carro | Fora de escopo |
