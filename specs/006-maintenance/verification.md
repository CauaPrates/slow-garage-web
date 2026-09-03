# Verificação 006 — Manutenção preventiva e execução

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-03 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Veículo temporário sem item/execução: "Nenhuma manutenção vencida.", "Nenhum item no plano ainda.", "Nenhuma execução registrada ainda." — as 3 juntas, sem banner de alerta |
| AC-2 | ✅ | Item "Rodízio de pneus" com só `intervalKm=5000`: aparece em Próximas com status "Planejado" |
| AC-3 | ✅ | Submissão sem nome e sem intervalo: "Informe o nome." + "Informe o intervalo por quilometragem ou por mês...", diálogo permanece aberto |
| AC-4 | ✅ | "Registrar execução" a partir do card "Troca de óleo" pré-seleciona o item e preenche o nome; após salvar, aparece em Histórico e o item mostra "Última vez" preenchida |
| AC-5 | ✅ | Execução "Troquei o alternador" sem selecionar item: campo "Item do plano" vazio, registro aparece em Histórico normalmente |
| AC-6 | ✅ | Item "Troca de óleo" (intervalo 1 mês, executado há 3 meses): aparece em Vencidas com badge "Vencido"; banner de alerta visível; `vehicle_alerts` confirma `alert_type: maintenance_overdue`, `severity: critical` |
| AC-7 | ✅ | Item nunca executado ("Rodízio de pneus") aparece em Próximas com badge "Planejado", visualmente distinto de "Em dia" |
| AC-8 | ✅ | Edição de prioridade do item (Média→Alta) e de custo da execução (—→R$ 150,00): ambos refletidos |
| AC-9 | ✅ | Desativar "Troca de óleo" (toggle "Ativo"): some de Vencidas; sua execução continua em Histórico |
| AC-10 | ✅ | Exclusão de item e de execução: `maintenance_items`/`maintenance_records` no banco caem em 1 linha cada, confirmado por consulta direta |
| AC-11 | ✅ | Dentro do veículo, "Adicionar" → "Manutenção": navega para `/v/:id/manutencao` com o diálogo "Registrar execução" já aberto |
| AC-12 | ✅ | Em "/" (sem veículo): botão "Manutenção" com nome acessível "Manutenção — Selecione um veículo" |
| AC-13 | ✅ | Clique em "Manutenção" na sidebar (dentro do veículo): `<a>` habilitado, navega para `/v/:id/manutencao` |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados durante a verificação

Nenhum bug de aplicação. Um problema no próprio script de verificação:
a comparação `"R$ 150,00"` (espaço comum) contra o texto renderizado
falhou porque `Intl.NumberFormat('pt-BR', { style: 'currency' })`
separa o símbolo do valor com espaço não-quebrável (U+00A0), não
espaço comum — `formatMoney` sempre se comportou assim desde a Fase 0,
não é uma mudança desta fase. Corrigido no script comparando só o
valor numérico. Registrado como ADR-032 porque qualquer verificação
futura que compare string de dinheiro literal vai tropeçar do mesmo
jeito.

## Saída dos comandos

### Build (`tsc -b && vite build`)
```
✓ 2990 modules transformed.
dist/assets/index-BZB48ubV.css                                 23.86 kB │ gzip:  5.41 kB
dist/assets/index-H-lLW1ii.js                                 179.82 kB │ gzip: 56.96 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB
dist/assets/providers-CKSB7hBE.js                             238.15 kB │ gzip: 62.79 kB
dist/assets/router-DvNwnDFf.js                                330.00 kB │ gzip: 91.10 kB

✓ built in 319ms

PWA v1.3.0
mode      generateSW
precache  24 entries (1044.22 KiB)
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
  ok  AC-13: sidebar 'Manutenção' navega pra /v/:id/manutencao
  ok  AC-1: 3 seções com estado vazio próprio, sem banner de alerta
  ok  AC-3: sem nome e sem intervalo é recusado
  ok  AC-2/AC-7: item aparece em Próximas com status Planejado
  ok  AC-4: 'Registrar execução' de um item pré-seleciona o item e o nome
  ok  AC-4: execução aparece no Histórico e item mostra última execução
  ok  AC-6: item com vencimento no passado aparece em Vencidas
  ok  AC-6: banner de alerta aparece
  ok  AC-6: vehicle_alerts tem alerta pro veículo
  ok  AC-5: execução avulsa (sem item) aparece no Histórico
  ok  AC-8: edição de item reflete (prioridade Alta)
  ok  AC-8: edição de execução reflete (custo)
  ok  AC-9: item desativado some de Vencidas
  ok  AC-9: histórico de execução do item desativado continua visível
  ok  AC-10: exclusão de item remove do banco
  ok  AC-10: exclusão de execução remove do banco
  ok  desktop: console sem erro
  ok  axe desktop sem violação serious/critical
  ok  AC-11: dentro do veículo, 'Manutenção' na folha é um link habilitado
  ok  AC-11: navega com o diálogo de execução já aberto
  ok  AC-12: fora do veículo, 'Manutenção' desabilitado com motivo certo
  ok  320px: sem overflow horizontal em /v/:id/manutencao
  ok  limpeza: veículo temporário removido
  ok  limpeza: nenhum item/execução remanescente do veículo temporário

25/25 checagens passaram.
```

axe-core (`wcag2a`/`wcag2aa`) sem violação `serious`/`critical` com
banner, seções e diálogos abertos. Screenshots revisados visualmente
em 320px e 1440px — sem overflow, sem texto cortado, densidade
consistente com `DESIGN.md`; os dois botões do cabeçalho ("Novo item
do plano"/"Registrar execução") empilham corretamente abaixo de `sm`.

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Cadastrar um plano real (ex.: troca de óleo, filtro, pneus) e
   acompanhar por algumas semanas se o status muda de "planejado" pra
   "em dia"/"próximo"/"vencido" nos momentos certos.
2. Conferir o banner de alerta com mais de um item vencido ao mesmo
   tempo, prioridade visual entre severidade crítica e de aviso.
3. Testar "Registrar execução" a partir de um item específico
   (pré-seleção) versus a partir do botão do cabeçalho (sem
   pré-seleção) — confirmar que o fluxo é claro nos dois casos.
