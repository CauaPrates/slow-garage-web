# Spec 011 — Liberdade de preenchimento (schema-freedom no front)

| | |
|---|---|
| **Status** | implementada e verificada — 18/19 ACs confirmados por execução real (ver verification.md); AC-18 inconclusivo por motivo documentado, fora do escopo desta fase |
| **Tamanho** | G |
| **Criada em** | 2026-09-04 |
| **Depende de** | Mudança já aplicada no backend (ver `CHANGES_FOR_FRONTEND.md`, ADR-010 do backend, `docs/DECISIONS.md` deste repo) |

## 1. Problema

O produto não é um sistema validado (sem integração Detran/seguradora) — é uma ferramenta para qualquer gearhead registrar o carro do jeito que quiser, com o dado que tiver na hora. Antes desta fase, os formulários de todo o app recusavam salvar sem uma lista longa de campo obrigatório (ano do veículo, quilometragem, categoria do gasto, data de vencimento de obrigação, etc.), mesmo quando esse dado simplesmente não existe ainda na cabeça do usuário no momento do cadastro. Isso tira a liberdade do gearhead de registrar o veículo do jeito que quiser, quando quiser — é fricção de produto, não segurança de dado.

## 2. Resultado esperado

O usuário consegue criar e editar qualquer registro (veículo, gasto, nota, abastecimento, execução de manutenção, problema, obrigação, financiamento, documento) preenchendo só o campo mínimo que define aquela entidade — todo o resto é opcional e pode ser completado depois ou nunca. Nenhuma tela trava o salvamento por falta de um dado secundário. Onde um cálculo depender de um dado que faltou, a tela mostra "sem dado suficiente" (nunca erro, `NaN`, `null` cru ou alarme falso) em vez de travar ou mentir um valor.

## 3. Cenários

**Principal**
1. Usuário abre "Novo veículo", preenche só marca e modelo, salva — o veículo aparece na garagem sem ano, sem km, sem combustível definido.
2. Depois, o mesmo usuário edita o veículo e limpa um campo que tinha preenchido (ex.: apaga o valor de compra) — o campo salva vazio de verdade, não mantém o valor antigo escondido.
3. Usuário registra um abastecimento sem saber a quilometragem do painel — salva normalmente; esse abastecimento específico não entra no cálculo de consumo, mas os demais abastecimentos do carro continuam calculando entre si.

**Alternativos**
- Usuário cadastra uma obrigação (ex.: seguro) sem saber a data de vencimento ainda — salva, e simplesmente não aparece na lista de "vencendo em breve" até que a data seja preenchida depois.
- Usuário fecha um gasto sem escolher categoria — aparece na timeline como "Gasto" e entra num agrupado "Sem categoria" nos totais, sem desaparecer.

## 4. Escopo

**Dentro**
- Relaxar os schemas Zod de `vehicles`, `expenses`, `notes`, `fuel_logs`, `maintenance_records`, `issues`, `obligations`, `financings`, `documents` para tornar opcional exatamente o que `CHANGES_FOR_FRONTEND.md` lista como relaxado no backend.
- Ajustar os 4 formulários (`Create`/`Edit` de veículo, financiamento, manutenção e abastecimento) cujo `toFormDefaults` converte o valor do banco com `String(x)` sem guarda de `null` — hoje, se o backend devolver `null` num campo agora nullable, o campo de edição mostraria a string literal `"null"` em vez de vazio.
- Ajustar as mutations de `Edit*Dialog` para enviar `null` explícito (não omitir a chave) nos campos que passam a ser genuinely nullable (sem default no banco), para que limpar o campo na edição realmente apague o valor salvo.
- Adicionar o texto `"(opcional)"` ao rótulo de todo campo que deixa de ser obrigatório, seguindo o padrão já usado em `NoteForm`/`MaintenanceRecordForm` — é o único sinalizador visual de opcionalidade que o app usa (nenhum formulário usa `required` nem asterisco).
- Tornar reselecionável a opção "sem categoria" do `<select>` de categoria de gasto (`ExpenseForm`), que hoje é um placeholder `disabled` — categoria vazia passa a ser um estado final válido, não só ausência momentânea.
- Ajustar o `.refine()` cruzado de `financingSchema` (parcelas pagas ≤ quantidade de parcelas) para não quebrar quando a quantidade de parcelas ficar vazia.
- Confirmar (sem alterar código, já que já está correto) que os pontos de leitura de `vehicle_financial_summary.total_invested`/`.cost_per_km`, `fuel_log_metrics.km_per_liter`/`.cost_per_km` e `maintenance_status` já tratam `null`/o valor `"ok"` corretamente.

**Fora** — explicitamente não entra agora
- `maintenance_items`: nenhuma mudança. O backend manteve a exigência de pelo menos `interval_km` **ou** `interval_months` — decisão explícita preservada, não é assunto desta fase.
- `vehicle_photos.category` e `documents.doc_type`: o backend deu default no banco (`'other'`) e os dois formulários já mostram um `<select>` sempre pré-preenchido (nunca em branco) — não há fricção real para remover aqui. O schema Zod é relaxado por consistência de contrato, mas nenhuma mudança de JSX é feita (autorizado explicitamente pelo próprio `CHANGES_FOR_FRONTEND.md`, seção "campos com `*`").
- Reorganização visual de "campo sempre visível" vs. dentro de `<details>` ("Mais detalhes"). Um campo que virou opcional continua na mesma posição do formulário — só ganha o texto "(opcional)" no rótulo quando aplicável. Mover campos de seção é uma decisão de design maior, não pedida, e fica fora para não inflar o escopo desta fase.
- Qualquer mudança em `maintenance_status`, `vehicle_financial_summary` ou `fuel_log_metrics` do lado do banco — já foi feita pelo backend; aqui só se verifica que o front já lê o resultado corretamente.

## 5. Critérios de aceite

- **AC-1**: Dado o formulário de veículo, quando o usuário preenche só marca e modelo e salva, então o veículo é criado sem erro de validação nos demais campos.
- **AC-2**: Dado um veículo já com valor de compra preenchido, quando o usuário edita e apaga esse campo, então o valor salvo no banco fica vazio (não mantém o valor antigo).
- **AC-3**: Dado o formulário de gasto, quando o usuário preenche só o valor e salva, então o gasto é criado sem categoria/descrição/data explícita, e a data assume hoje.
- **AC-4**: Dado o `<select>` de categoria do gasto, quando o usuário já escolheu uma categoria, então ele ainda consegue voltar para "Sem categoria" sem precisar recarregar o formulário.
- **AC-5**: Dado o formulário de nota, quando o usuário salva só com a anotação (sem título), então a nota é criada e aparece na timeline com o rótulo "Sem título" (comportamento já existente, confirmado nesta fase).
- **AC-6**: Dado o formulário de abastecimento, quando o usuário salva sem quilometragem, então o abastecimento é criado, e o consumo (km/L) desse abastecimento específico aparece como "—" sem quebrar o cálculo dos demais abastecimentos do veículo.
- **AC-7**: Dado um abastecimento já com quilometragem preenchida, quando o usuário abre o diálogo de editar, então o campo mostra o valor atual formatado (nunca a string `"null"`) e, se apagado e salvo em branco, o valor salvo no banco fica `null`.
- **AC-8**: Dado o formulário de execução de manutenção, quando o usuário salva sem quilometragem, então o registro é criado (sem atualizar `last_service_odometer_km`/`current_odometer_km`, comportamento já garantido pelo backend).
- **AC-9**: Dado o formulário de problema (`issue`), quando o usuário salva só com o título, então o problema é criado sem data de relato explícita, e ela assume hoje.
- **AC-10**: Dado o formulário de obrigação, quando o usuário salva sem data de vencimento, então a obrigação é criada e não aparece em nenhum alerta de vencimento (nem "vencido" nem "vence em breve") até que a data seja preenchida.
- **AC-11**: Dado uma obrigação já com vencimento preenchido, quando o usuário edita e apaga a data, então o campo salva vazio de verdade (não mantém a data antiga).
- **AC-12**: Dado o formulário de financiamento, quando o usuário salva só com a data de início (ou nem isso), então o financiamento é criado sem valor financiado/parcela/quantidade de parcelas.
- **AC-13**: Dado um financiamento sem quantidade de parcelas preenchida, quando o usuário informa "parcelas pagas", então a validação cruzada (parcelas pagas ≤ quantidade) não bloqueia o salvamento.
- **AC-14**: Dado o formulário de documento, quando o usuário salva sem escolher o tipo, então o documento é salvo com o tipo padrão do banco (`'other'`) sem erro de validação.
- **AC-15 (negativo)**: Dado o formulário de gasto, quando o usuário tenta salvar sem informar o valor, então o sistema recusa e aponta o campo `amount` — valor continua sendo o mínimo que define um gasto.
- **AC-16 (negativo)**: Dado o formulário de abastecimento, quando o usuário tenta salvar sem litros ou sem valor total, então o sistema recusa — litros e valor total continuam sendo o mínimo que define um abastecimento.
- **AC-17 (negativo)**: Dado o formulário de execução de manutenção, quando o usuário tenta salvar sem nome, então o sistema recusa — nome continua sendo o identificador mínimo.
- **AC-18**: Dado um veículo sem `current_odometer_km` (agora possível), quando a tela de plano de manutenção calcula o status de um item, então o item aparece como "Em dia" (não "Vencido"/"Próximo") — nunca alarma sem dado para sustentar o alarme.
- **AC-19**: Dado um veículo sem `purchase_price`/`current_odometer_km`, quando o resumo financeiro é exibido (cartão do veículo, dashboard, resumo de combustível), então `total_invested` soma só o que existe e `cost_per_km` aparece como "—" — nunca "R$ null" nem quebra a tela.

## 6. Regras de negócio

- **RN-1**: Só continua obrigatório (a) o que o servidor preenche sozinho (`vehicle_id`, metadados de upload) e (b) o campo mínimo que define a entidade. Ver tabela completa em `CHANGES_FOR_FRONTEND.md`.
- **RN-2**: Um campo que tem *default* no banco (`fuel_type`, `transmission`, `doc_type`, `kind`) nunca deve ser enviado como `null` explícito pelo formulário — só `undefined` (chave omitida do payload), porque a coluna continua `NOT NULL` no banco, só com valor padrão. Enviar `null` nesses campos quebraria a constraint. Isso é diferente de um campo genuinamente nullable (`purchase_price`, `due_on`, `odometer_km` de abastecimento/manutenção), onde `null` explícito é o jeito certo de limpar um valor já salvo.
- **RN-3**: Nenhum cálculo (`km_per_liter`, `cost_per_km`, `total_invested`, `maintenance_status`) é refeito no cliente — o front só exibe o que a view do banco já devolve, tratando `null` como "sem dado suficiente" (RN geral do projeto, já em vigor desde fases anteriores).

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| `vehicles.make`/`.model` | formulário | sim | mínimo pro veículo ter nome numa lista |
| `vehicles.model_year`, `.current_odometer_km`, `.purchase_date`, `.purchase_price` | formulário | não (era sim) | genuinamente nullable agora |
| `vehicles.fuel_type`, `.transmission` | formulário | não (era sim) | default `'other'`/primeiro valor no banco — nunca enviar `null` |
| `expenses.amount` | formulário | sim | é o que define um gasto |
| `expenses.category_id`, `.description` | formulário | não (era sim) | genuinamente nullable |
| `expenses.occurred_on` | formulário ou omitido | não (era sim) | default hoje no banco |
| `notes.title` | formulário | não (era sim) | genuinamente nullable; timeline já mostra "Sem título" |
| `notes.occurred_on` | formulário ou omitido | não (era sim) | default hoje no banco |
| `fuel_logs.liters`, `.total_amount` | formulário | sim | define o abastecimento |
| `fuel_logs.odometer_km` | formulário | não (era sim) | genuinamente nullable; afeta só o cálculo daquele abastecimento |
| `fuel_logs.fuel_type`, `.occurred_on` | formulário ou omitido | não (era sim) | default no banco |
| `maintenance_records.name` | formulário | sim | identificador mínimo |
| `maintenance_records.odometer_km` | formulário | não (era sim) | genuinamente nullable |
| `maintenance_records.performed_on` | formulário ou omitido | não (era sim) | default hoje no banco |
| `issues.title` | formulário | sim | identificador mínimo |
| `issues.reported_on` | formulário ou omitido | não (era sim) | default hoje no banco |
| `obligations.label` | formulário | sim | identificador mínimo |
| `obligations.due_on` | formulário | não (era sim) | genuinamente nullable; sem valor, nunca gera alerta |
| `financings.started_on` | formulário ou omitido | não (era sim) | default hoje no banco |
| `financings.financed_amount`, `.installment_amount`, `.installment_count` | formulário | não (era sim) | genuinamente nullable |
| `documents.title` | formulário | sim | é literalmente um arquivo, precisa de identificação |
| `documents.doc_type` | formulário ou omitido | não (era sim) | default `'other'` no banco |

## 8. Estados e transições

N/A — esta fase não introduz ciclo de vida novo. A única transição relevante já documentada é `obligations.paid_on` (preenchido ↔ vazio = "pago" ↔ "pendente"), que não muda nesta fase.

## 9. Erros e casos de borda

- Campo genuinamente nullable apagado na edição → salva `null` explícito (não mantém valor antigo). Ver RN-2 para a distinção com campo de default.
- Campo com default apagado na edição → payload omite a chave (`undefined`); o valor antigo no banco **não** é resetado para o default — é a mesma semântica de "não mandei nada, não mexe". Documentado como comportamento aceito (o próprio `CHANGES_FOR_FRONTEND.md` autoriza "tanto faz" para esses campos).
- `installment_count` vazio + `installments_paid` preenchido → validação cruzada não bloqueia (AC-13).
- Veículo sem `current_odometer_km` → item de manutenção sem intervalo comparável cai em `"ok"`/"Em dia" (AC-18), tratado inteiramente pela view do banco; nenhuma mudança de código do lado do cliente.
- Abastecimento sem `odometer_km` → `km_per_liter`/`cost_per_km` `null` só para aquele abastecimento; os demais continuam calculando entre si (já é o comportamento da view, confirmado na ADR-030 do backend).

## 10. Requisitos não-funcionais

N/A — esta fase não muda desempenho, acessibilidade ou responsividade de forma perceptível. O texto "(opcional)" adicionado aos rótulos segue o padrão de contraste/tamanho já validado nas fases anteriores.

## 11. Dependências e riscos

- Depende do backend já ter aplicado a migration relaxando as constraints (assumido como já feito, conforme `CHANGES_FOR_FRONTEND.md`). Não é verificável a partir deste repositório — se alguma constraint do backend não tiver sido de fato relaxada, o Zod deixaria passar um valor vazio que o Postgres ainda recusaria, e o erro apareceria traduzido via `translatePostgresError` (comportamento de erro já existente, não é regressão).
- Risco técnico real encontrado durante a auditoria de código (não estava no documento do backend): 4 arquivos de edição (`EditVehicleDialog`, `EditFinancingDialog`, `EditFuelLogDialog`, `EditMaintenanceRecordDialog`) convertem o valor do banco pro formulário com `String(valor)` sem checar `null` — assim que o backend passar a devolver `null` de verdade nesses campos, o campo apareceria com o texto literal `"null"`. Corrigido nesta fase (ver plan.md).

## 12. Perguntas abertas

Nenhuma.
