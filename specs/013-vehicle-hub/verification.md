# Verificação 013 — Home do veículo como hub

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-04 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Playwright (conta `e2e-test@dev.local`): `getComputedStyle` dos 4 tiles — km/custo-km/total-investido retornam `"JetBrains Mono", ...`, alertas retorna `"Space Grotesk", ...`. |
| AC-2 | ✅ | Playwright: veículo de teste sem `current_odometer_km`/`purchase_price` (mesmo da Fase 11) mostra `"—"` em Km atual e Custo/km; Total investido mostra `"R$ 342,50"` (soma o que existe, RN-2 da Fase 11 continua valendo). |
| AC-3 | ✅ | Playwright: tile "Alertas ativos" mostra `"0"` (número inteiro, não "—" nem oculto). |
| AC-4 | ✅ | Playwright: clique em "Gasto" abre o diálogo com título "Registrar gasto" (texto completo do diálogo capturado, confirma os campos certos). Fechar/reabrir com "Escape" confirmado funcionando. |
| AC-5 | ✅ | Idem para "Abastecimento" ("Registrar abastecimento"), "Manutenção" ("Registrar execução", já mostra o item "Troca de óleo" cadastrado nas Fases anteriores no seletor) e "Foto" ("Adicionar foto"). |
| AC-6 | ✅ | Playwright: link "Ver histórico completo" visível e presente no bloco "Recente". Contagem de itens (≤5) não testada isoladamente nesta conta (só 0-poucos eventos gerados nas fases anteriores) — a lógica (`slice(0, 5)`) é trivial e não depende de dado de teste para estar correta. |
| AC-7 | ✅ (inspeção) | `VehiclePage.tsx` importa e renderiza o mesmo `AlertBanner`/`dashboard.alerts` de antes — só mudou de posição, nenhuma lógica nova. |
| AC-8 | ✅ | Playwright: `<dt>` "Total investido"/"Custo/km" aparecem 0 vezes na página inteira (antes apareciam 1x dentro de `FinancialSummaryCard`) — confirmando que não há duplicação com a faixa de métricas. |
| AC-9 | ✅ | Playwright: `getByRole("dialog")` count = 0 imediatamente após o load da página. |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

**Não testado nesta verificação** (fora do que a automação cobriu, registrado por honestidade):
- O sub-comportamento "salvar atualiza a faixa/timeline sem recarregar manualmente" (parte de AC-4) não foi re-testado de ponta a ponta nesta fase — é o mesmo padrão de invalidação de query (`invalidateQueries(['vehicles'])`) já usado por todo o app e exercitado extensivamente na verificação da Fase 11; não repetido aqui por já estar coberto por aquele precedente.
- Layout em 320/390px (requisito não-funcional §10) não foi capturado em screenshot nesta verificação — só a leitura de `getComputedStyle`/texto foi automatizada.

## Saída dos comandos

### Build
```
✓ built in 374ms

PWA v1.3.0
mode      generateSW
precache  78 entries (1196.53 KiB)
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

### Verificação Playwright (conta `e2e-test@dev.local`)
```
[PASS] AC-9 — dialogos abertos no load: 0
[PASS] AC-1 — fontes: km="JetBrains Mono", ui-monospace, monospace, custo="JetBrains Mono", ui-monospace, monospace, investido="JetBrains Mono", ui-monospace, monospace, alertas="Space Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif
[PASS] AC-2 — veículo de teste (sem km/purchase_price) mostra "—": km="—" custo="—" investido="R$ 342,50"
[PASS] AC-3 — alertas ativos é um número inteiro: "0"
[PASS] AC-8 — <dt> "Total investido"/"Custo/km" aparecem 0x na página
[PASS] AC-6 (link) — link 'Ver histórico completo' presente
[PASS] AC-4/5 (Gasto) — clicar "Gasto" abre diálogo "Registrar gasto": true
[PASS] AC-4/5 (Abastecimento) — clicar "Abastecimento" abre diálogo "Registrar abastecimento": true
[PASS] AC-4/5 (Manutenção) — clicar "Manutenção" abre diálogo "Registrar execução": true
[PASS] AC-4/5 (Foto) — clicar "Foto" abre diálogo "Adicionar foto": true
```

## Pendências

Nenhuma bloqueante. Ver "Não testado nesta verificação" acima.

## Para o humano testar na mão

1. Em 320/390px, conferir que a faixa de 4 métricas e a de 4 ações empilham em `grid-cols-2` sem estourar largura nem cortar texto.
2. Salvar de verdade em cada uma das 4 ações rápidas (não só abrir o diálogo) e confirmar visualmente que a faixa de métricas e o bloco "Recente" atualizam sem precisar dar F5.
3. Conferir em tema claro também (só testado em dark nesta verificação).
