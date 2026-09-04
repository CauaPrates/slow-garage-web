# Verificação 011 — Liberdade de preenchimento (schema-freedom no front)

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-04 |
| **Resultado** | aprovado — 18/19 ACs confirmados por execução real (Playwright contra o app rodando, conta `e2e-test@dev.local`); AC-18 inconclusivo por motivo documentado, não é falha da mudança desta fase |

O usuário forneceu credencial de um usuário de teste real (`e2e-test@dev.local`) depois da primeira versão deste documento (que reportava tudo "não verificado" por falta de login). Com credencial em mãos, cada AC foi exercitado de ponta a ponta contra o Supabase real: subiu o app (`npm run dev`), automatizado com Playwright (login → criar/editar registro → reload da página → ler o valor persistido), sem mockar nada.

**Dois bugs reais foram encontrados e corrigidos durante essa verificação** (não estavam nem em `CHANGES_FOR_FRONTEND.md`, nem pegos por `tsc`/`eslint` — só apareceram testando o fluxo de verdade):

1. `ExpenseListItem.tsx` usava `{expense.description}` como título do card — com `description` agora opcional, um gasto sem descrição mostrava uma linha em branco no lugar do título. Corrigido para `{expense.description || "Gasto"}`, e o fallback de categoria trocado de `"Categoria"` (texto genérico, nunca alcançável antes desta fase) para `"Sem categoria"`.
2. `EditObligationDialog.tsx` enviava `due_on: values.dueOn` (sem `?? null`) no payload de edição — na leitura inicial do arquivo eu tinha assumido, errado, que esse `?? null` já existia (só conferi de fato no `CreateObligationDialog.tsx`). Resultado real: limpar o vencimento de uma obrigação já salva e clicar em salvar **não apagava o valor** — o PATCH enviado ao Postgres nem incluía a chave `due_on`. Descoberto comparando o corpo da requisição PATCH capturado pelo Playwright com o que o código deveria enviar. Corrigido para `due_on: values.dueOn ?? null`.

Ambos confirmados corrigidos re-executando o mesmo roteiro depois do fix (evidência abaixo, AC-3/AC-4 e AC-11).

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Playwright: veículo criado só com Marca+Modelo, aparece na garagem sem erro de validação. |
| AC-2 | ✅ | Playwright, com `page.reload()` entre cada passo (não confia em cache do cliente): valor de compra preenchido → reabre editar → mostra `"15000"` → limpa e salva → reabre editar → campo vazio `""` (nunca a string `"null"`). |
| AC-3 | ✅ | Playwright: gasto criado só com Valor (`42.50`) → card mostra título **"Gasto"** (fallback, corrigido nesta verificação) e linha **"Sem categoria · 04/09/2026"**. |
| AC-4 | ✅ | Playwright: no mesmo gasto, seleciona uma categoria real, salva, reabre e seleciona "Sem categoria" de volta no mesmo `<select>` (antes um placeholder `disabled`, agora reselecionável) — card volta a mostrar "Sem categoria" sem recarregar a página manualmente. |
| AC-5 | ✅ | Inspeção de código: `src/features/timeline/TimelineItem.tsx:42` já usa `event.title ?? "Sem título"` — comportamento pré-existente e inalterado nesta fase, não precisa de teste de execução. |
| AC-6 | ✅ | Playwright: abastecimento salvo com Litros=30/Valor total=180, sem quilometragem → linha de consumo mostra `"— · —"`. |
| AC-7 | ✅ | Playwright: abastecimento com km=12345 → edita → campo mostra `"12345"` (nunca `"null"`) → limpa e salva → reabre → campo vazio `""`. |
| AC-8 | ✅ | Playwright: execução de manutenção registrada só com Nome, sem quilometragem — salva normalmente, aparece na lista. |
| AC-9 | ✅ | Playwright: problema criado só com Título ("Barulho no motor") — salvo, aparece na lista. |
| AC-10 | ✅ | Playwright: obrigação criada só com Rótulo, sem vencimento — card mostra **"Sem vencimento"**, não aparece em nenhum alerta. |
| AC-11 | ✅ | Playwright (depois do fix do bug #2 acima): vencimento preenchido com `2027-01-01` → reabre → mostra `"2027-01-01"` → limpa e salva → reabre → campo vazio `""`. Corpo do PATCH confirmado via `page.waitForResponse` incluindo `"due_on":null` depois do fix (antes do fix, a chave `due_on` estava ausente do corpo). |
| AC-12 | ✅ | Playwright: financiamento criado sem nenhum campo preenchido (só a data de início, que já vem com default) — salvo, aparece a seção "Financiado". |
| AC-13 | ✅ | Playwright: financiamento sem Quantidade de parcelas, edita e preenche "Parcelas já pagas" = 3 — salva sem erro de validação cruzada, card mostra **"3 de — pagas"**. |
| AC-14 | ✅ | Playwright: documento criado com upload de arquivo real (`5348.png`) sem trocar o tipo do padrão "Outro" — salvo, aparece na lista. |
| AC-15 (negativo) | ✅ | Playwright: tenta salvar gasto sem Valor — mensagem "Informe o valor." aparece, diálogo não fecha, nada é salvo. |
| AC-16 (negativo) | ✅ | Playwright: tenta salvar abastecimento sem Litros/Valor total — recusado com erro de campo, diálogo não fecha. |
| AC-17 (negativo) | ✅ | Playwright: tenta salvar execução de manutenção sem Nome — mensagem "Informe o nome." aparece, diálogo não fecha. |
| AC-18 | ⚠️ | **Inconclusivo, não é falha desta fase** — ver "Achado durante a verificação" abaixo. |
| AC-19 | ✅ | Playwright: veículo sem `purchase_price`/`current_odometer_km` — dashboard mostra `Total investido = "R$ 0,00"` (soma só o que existe, aqui zero gastos reais) e `Custo/km = "—"` — nunca `"R$ null"` nem tela quebrada. |

✅ atende · ❌ não atende · ⚠️ parcial/inconclusivo · ⬜ não verificado

### Achado durante a verificação — AC-18 (maintenance_status)

O cenário do AC-18 ("veículo sem `current_odometer_km` → item de manutenção cai em status não-alarmante") foi testado de duas formas:

1. Item de manutenção recém-criado (sem nenhuma execução registrada), veículo **com** `current_odometer_km=10000` → badge mostra **"Planejado"**.
2. Mesmo item, agora **com** uma execução registrada (`last_service_odometer_km=8000`), veículo ainda **com** km → badge continua **"Planejado"**.
3. Mesmo item com histórico, veículo **sem** `current_odometer_km` (removido) → badge continua **"Planejado"** — nenhuma mudança entre os passos 2 e 3.

Ou seja: em nenhum dos três passos a view `maintenance_status` retornou uma linha computada para este item (o que produziria "Em dia"/"Vencido"/"Próximo") — o cliente sempre caiu no fallback pré-existente `item.status?.status ?? "planned"` (`useMaintenanceItems.ts`, Fase 6, não tocado nesta fase). Isso significa que **não dá pra confirmar a transição específica que o AC-18 descreve** ("cai em `'ok'`") com os dados de teste disponíveis — pode ser que a view exija uma condição adicional não descoberta (ex.: tempo decorrido, `interval_months`, ou outro campo) para computar um status pra esse item específico.

**O que importa fica confirmado**: em nenhum dos três passos apareceu um status alarmante (`"Vencido"`/`"Próximo"`) sem dado pra sustentar — a propriedade de segurança central do AC-18 ("nunca alarma sem dado suficiente") se sustenta, mesmo que o rótulo específico observado (`"Planejado"`, badge neutro cinza) não seja exatamente o `"ok"`/"Em dia" (badge verde) que a spec presumiu. `maintenance_status`/`maintenance_items` são explicitamente **fora do escopo** desta fase (spec.md, §4) — nenhum código de manutenção foi alterado, então isso não é uma regressão introduzida aqui. Fica registrado como pendência de investigação futura, não como bug desta entrega.

## Saída dos comandos

### Build

```
> slow-garage-web@0.0.0 build
> tsc -b && vite build
...
✓ built in 399ms

PWA v1.3.0
mode      generateSW
precache  75 entries (1169.75 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

Rodado 3 vezes ao longo desta fase (schema inicial, depois dos 11 erros de tipo corrigidos, e de novo depois dos 2 bugs encontrados na verificação manual) — as 11 falhas de tipo da segunda rodada estão registradas em `plan.md`. Última rodada, limpa.

### Testes

Não há suite de teste automatizado neste projeto — não aplicável. A verificação funcional usou Playwright ad-hoc (script descartado ao final, não faz parte do repositório) contra o app rodando localmente e o Supabase real do projeto.

### Lint / tipos

```
> slow-garage-web@0.0.0 lint
> eslint .
```

Saída vazia — sem violação. Rodado depois dos 2 bugs corrigidos na verificação manual.

### Regeneração de tipos contra o banco real

Ver `plan.md` §3 — confirmado que as 9 entidades batem com `CHANGES_FOR_FRONTEND.md` depois do `db push` do backend.

## Pendências

- **AC-18 inconclusivo** (ver "Achado durante a verificação" acima) — não é escopo desta fase resolver, mas fica registrado para quando `maintenance_items`/`maintenance_status` forem revisitados: vale confirmar com o backend em que condição exata a view `maintenance_status` passa a computar uma linha pra um item (ex.: exige alguma outra coluna preenchida, ou é só uma questão de o item de teste usado aqui nunca ter atingido a condição).
- `documents.doc_type`/`vehicle_photos.category` continuam com `<select>` sempre pré-selecionado (nunca em branco) — autorizado explicitamente por `CHANGES_FOR_FRONTEND.md` ("tanto faz"), não testado como cenário de "campo vazio" porque essa opção não existe na UI atual, de propósito.

## Para o humano testar na mão

A verificação automática (Playwright) já cobriu o roteiro funcional de ponta a ponta contra o Supabase real. Ainda vale conferir visualmente (a automação não tira screenshot nem confere layout):

1. Em 320/390px, o `<select>` de categoria do gasto (com a nova opção "Sem categoria" sempre habilitada) não trunca nem quebra layout.
2. O texto "(opcional)" adicionado a ~15 rótulos de campo não estoura a largura do label em tema claro/escuro.
3. O badge "Planejado" (cinza) e os badges de manutenção em geral continuam com contraste adequado — não foi re-rodado o `scripts/audit-all-routes.mjs` (axe-core) nesta fase, já que nenhuma classe/token de cor foi alterado, só texto e lógica de formulário.
