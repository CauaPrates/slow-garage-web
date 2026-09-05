# Spec 008 — Documentos, obrigações, financiamento e galeria de fotos

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G — três tabelas novas (`documents`, `obligations`, `financings`), generalização do modelo de anexo por entidade, e uma tela nova com quatro seções |
| **Criada em** | 2026-09-03 |
| **Depende de** | 003-vehicle-shell (nav/rota), 004-expenses (padrão de anexo), 007-issues-projects (nota de escopo aberta sobre anexo em problema/item de projeto) |

## 1. Problema

O dono do veículo hoje não tem onde guardar CRLV, apólice de seguro, nota fiscal de peça, nem acompanhar vencimento de IPVA/seguro/licenciamento ou o andamento de um financiamento. Sem isso, ele descobre o vencimento atrasado (multa) ou perde o documento físico sem ter cópia digital. `vehicle_alerts` já sabe gerar alerta de `obligation_overdue`/`obligation_due_soon`/`document_expired`/`document_expiring` desde a Fase 6 (AlertBanner já existe), mas hoje não há tela para o dado que alimenta esse alerta.

Problema e item de projeto também não têm como anexar comprovante/foto desde a Fase 7 — ficou registrado como pendência explícita desta fase.

## 2. Resultado esperado

O usuário consegue, a partir de uma única tela "Documentos" por veículo: guardar documentos com data de validade, cadastrar e quitar obrigações recorrentes (seguro/IPVA/licenciamento/outros), acompanhar um financiamento (parcelas pagas, saldo devedor) e organizar fotos do carro por categoria. Problema e item de projeto passam a aceitar um anexo, do mesmo jeito que gasto já aceita desde a Fase 4.

## 3. Cenários

**Principal — documento**
1. Usuário abre "Documentos" no menu do veículo, aba "Documentos" já ativa.
2. Clica "Novo documento", escolhe tipo (seguro/registro/nota fiscal/etc.), título, sobe um arquivo (PDF ou imagem), opcionalmente data de validade.
3. Documento aparece na lista, com selo "Vence em N dias" quando a validade está próxima ou já passou.

**Principal — obrigação**
1. Usuário abre a aba "Obrigações", clica "Nova obrigação", escolhe tipo (seguro/IPVA/licenciamento/vistoria/outro), rótulo, vencimento, valor opcional.
2. Obrigação aparece como pendente. Ao vencer/estar próxima, `vehicle_alerts` já mostra no AlertBanner (Fase 6, sem mudança aqui).
3. Usuário clica "Marcar como paga" — obrigação sai da lista de pendentes e o alerta correspondente some.

**Principal — financiamento**
1. Veículo ainda sem financiamento: aba "Financiamento" mostra estado vazio com "Cadastrar financiamento".
2. Usuário informa valor financiado, valor da parcela, quantidade de parcelas, data de início, taxa de juros mensal (opcional).
3. Tela passa a mostrar progresso ("8 de 48 parcelas"), saldo devedor (`outstanding_balance`, calculado pelo banco) e botão "+1 parcela paga".
4. Cada clique em "+1 parcela paga" soma 1 em `installments_paid`, até o limite de `installment_count` (botão desaparece/desabilita ao chegar no total).

**Principal — fotos**
1. Usuário abre a aba "Fotos", escolhe uma categoria (ou "Todas"), clica "Adicionar foto", escolhe categoria da foto e sobe a imagem.
2. Foto aparece na grade filtrada pela categoria escolhida.
3. Usuário pode marcar qualquer foto como "Capa do veículo" (mesmo campo `vehicles.primary_photo_id` que a Fase 2 já usa para o card da garagem) e apagar foto.

**Principal — anexo em problema/item de projeto**
1. Usuário edita um problema (ou item de projeto) já existente.
2. No formulário de edição aparece o campo "Anexo" (mesmo componente/fluxo que gasto já tem desde a Fase 4: anexar, ver, trocar, remover).

**Alternativos**
- Documento sem validade (`expires_on` nulo): nunca gera alerta de vencimento, lista mostra sem selo.
- Obrigação sem valor (`amount` nulo): lista mostra sem coluna de valor.
- Financiamento já com todas as parcelas pagas: botão "+1 parcela paga" fica desabilitado, mensagem "Financiamento quitado".
- Usuário erra a contagem de parcelas pagas: corrige direto no formulário de editar financiamento (campo numérico), não precisa desfazer clique por clique.

## 4. Escopo

**Dentro**
- CRUD de `documents`, `obligations`, `financings` (financiamento é no máximo 1 por veículo — `financings.vehicle_id` é único no banco).
- Upload/exclusão de arquivo de documento (bucket `vehicle-documents`, mesmo padrão de anexo já usado).
- Ação "Marcar como paga" em obrigação (seta `paid_on` para hoje, editável).
- Ação "+1 parcela paga" em financiamento, mais edição direta de `installments_paid` no formulário.
- Galeria de `vehicle_photos`: upload com categoria, filtro por categoria, exclusão, definir como foto de capa do veículo.
- Generalização do componente de anexo (hoje específico de Gasto) para reuso em Problema, Item de projeto e Execução de manutenção — cobre a pendência da Fase 7 e usa a folga que o enum `attachment_entity_type` já dava para manutenção.
- Nova rota `/v/:vehicleId/documentos`, uma página com 4 abas internas (Documentos / Obrigações / Financiamento / Fotos), ativando o item "Documentos" da sidebar (hoje `to: null`).
- Item "Foto" da folha "Adicionar" passa a apontar para a aba Fotos com upload já aberto (mesmo padrão `?novo=1` das fases anteriores).

**Fora** — explicitamente não entra agora
- Anexo em `note` — a entidade "nota" ainda não tem tela nenhuma (chega na Fase 9, junto com timeline/dashboard).
- Qualquer geração automática de "próxima obrigação" (ex.: recriar o IPVA do ano seguinte sozinho) — não existe campo de recorrência no banco; cadastro do próximo vencimento é manual, como qualquer outro registro.
- Amortização/simulação de financiamento (quanto sobra se antecipar parcela, etc.) — a tela só reflete o que o banco já calcula (`outstanding_balance`/`installments_remaining`), não faz projeção.
- Reordenar fotos (`sort_order` existe na tabela, mas não há UI de arrastar nesta fase — novas fotos entram no fim, sem controle manual de ordem).
- Editar a foto principal do veículo pelo diálogo de editar veículo (Fase 2/3) — esse fluxo continua existindo como está (upload rápido, sempre categoria "exterior", sempre vira capa); a galeria desta fase é adicional, não substitui.

## 5. Critérios de aceite

**Documentos**
- **AC-1**: Dado um veículo sem documentos, quando o usuário abre a aba "Documentos", então vê estado vazio com ação para criar o primeiro.
- **AC-2**: Dado um formulário de novo documento preenchido com tipo, título e arquivo válido (PDF/JPEG/PNG/WebP até 10MB), quando o usuário salva, então o arquivo sobe para `vehicle-documents`, a linha é criada em `documents`, e o documento aparece na lista.
- **AC-3**: Dado um documento com `expires_on` no passado, quando a lista é exibida, então ele mostra selo indicando vencido; com `expires_on` nulo, nenhum selo de vencimento aparece.
- **AC-4**: Dado um documento existente, quando o usuário clica "Ver documento", então abre o arquivo numa aba nova via signed URL (nunca URL pública).
- **AC-5**: Dado um documento existente, quando o usuário exclui, então o arquivo é removido do Storage e a linha de `documents` é removida; a lista deixa de mostrá-lo.
- **AC-6**: Dado um upload de arquivo fora do tipo/tamanho aceito, quando o usuário tenta enviar, então o sistema recusa antes de subir, com mensagem em português, e nenhum dado é persistido.

**Obrigações**
- **AC-7**: Dado um formulário de nova obrigação com tipo, rótulo e vencimento preenchidos, quando o usuário salva, então a obrigação aparece na lista como pendente (`paid_on` nulo).
- **AC-8**: Dado uma obrigação pendente, quando o usuário clica "Marcar como paga", então `paid_on` é preenchido com a data de hoje (editável antes de confirmar) e a obrigação passa a aparecer como paga.
- **AC-9**: Dado uma obrigação vencida (não paga, `due_on` no passado), quando o usuário consulta `vehicle_alerts` (AlertBanner já existente), então o alerta `obligation_overdue` aparece; depois de marcar como paga, o alerta some na próxima consulta.
- **AC-10**: Dado uma obrigação existente, quando o usuário exclui, então ela some da lista (exclusão definitiva, mesmo padrão da ADR-031).

**Financiamento**
- **AC-11**: Dado um veículo sem financiamento, quando o usuário abre a aba "Financiamento", então vê estado vazio com ação para cadastrar; nenhum formulário de edição aparece.
- **AC-12**: Dado um veículo que já tem financiamento, quando o usuário tenta cadastrar outro, então a ação "Cadastrar financiamento" não é oferecida — só "Editar"/"Excluir" do existente (RN de unicidade do banco, `financings.vehicle_id` único).
- **AC-13**: Dado um financiamento com `installments_paid` menor que `installment_count`, quando o usuário clica "+1 parcela paga", então `installments_paid` sobe em 1 e `installments_remaining`/`outstanding_balance` (calculados pelo banco) atualizam na tela sem o cliente recalculá-los.
- **AC-14**: Dado um financiamento com `installments_paid` igual a `installment_count`, quando a tela é exibida, então o botão "+1 parcela paga" fica desabilitado com texto indicando quitação.
- **AC-15**: Dado o formulário de editar financiamento, quando o usuário corrige `installments_paid` diretamente (ex.: de 8 para 6), então o valor é salvo e os campos calculados refletem a correção.

**Fotos**
- **AC-16**: Dado um veículo sem fotos na galeria, quando o usuário abre a aba "Fotos", então vê estado vazio com ação para adicionar a primeira.
- **AC-17**: Dado um upload de foto com categoria escolhida, quando o usuário salva, então a foto aparece na grade, e ao filtrar pela mesma categoria ela continua visível; ao filtrar por outra categoria, ela não aparece.
- **AC-18**: Dado uma foto existente, quando o usuário clica "Definir como capa", então `vehicles.primary_photo_id` passa a apontar para ela, e o card do veículo na garagem (Fase 2) passa a exibi-la.
- **AC-19**: Dado uma foto existente, quando o usuário exclui, então o arquivo some do Storage (`vehicle-photos`) e a linha de `vehicle_photos` é removida; se essa foto era a capa, `vehicles.primary_photo_id` volta a `null` (nunca aponta para uma foto que não existe mais).

**Anexo generalizado**
- **AC-20**: Dado um problema já existente, quando o usuário abre o diálogo de editar, então vê o mesmo campo de anexo (anexar/ver/trocar/remover) que gasto já tem.
- **AC-21**: Dado um item de projeto já existente, quando o usuário abre o diálogo de editar, então vê o campo de anexo, do mesmo jeito.
- **AC-22**: Dado uma execução de manutenção já existente, quando o usuário abre o diálogo de editar, então vê o campo de anexo, do mesmo jeito.
- **AC-23**: Dado um problema/item de projeto/execução de manutenção com anexo, quando o usuário exclui o registro (não o anexo), então o arquivo e a linha de `attachments` são removidos junto — nunca fica anexo órfão (mesma regra da ADR-027).

**Navegação**
- **AC-24**: Dado o item "Documentos" da sidebar, quando um veículo está selecionado, então ele deixa de aparecer como "Em breve" e leva para `/v/:vehicleId/documentos`, aba "Documentos" por padrão.
- **AC-25**: Dado o item "Foto" da folha "Adicionar", quando o usuário toca nele, então vai direto para a aba "Fotos" com o diálogo de upload já aberto.

## 6. Regras de negócio

- **RN-1**: `financings.installments_remaining` e `financings.outstanding_balance` nunca são enviados nem recalculados no cliente — são colunas geradas pelo banco (mesma regra do contrato para `km_per_liter`/`cost_per_km`/progresso de projeto).
- **RN-2**: Um veículo tem no máximo um financiamento — `financings.vehicle_id` é único. A UI nunca oferece "criar" quando já existe um; oferece "editar"/"excluir".
- **RN-3**: Marcar obrigação como paga é o único jeito de silenciar o alerta correspondente — não existe "dispensar alerta" separado de pagar (regra já documentada no contrato).
- **RN-4**: Excluir um registro que pode ter anexo (gasto, problema, item de projeto, execução de manutenção) sempre remove o anexo (arquivo + linha) antes de remover o registro — nunca deixa órfão no Storage.
- **RN-5**: Apagar a foto que é `primary_photo_id` do veículo limpa essa referência (`null`) — nunca deixa o veículo apontando para uma foto inexistente.
- **RN-6**: Upload de arquivo (documento ou foto) segue o path `{user_id}/{vehicle_id}/{uuid}.{ext}`; leitura sempre por signed URL, nunca `getPublicUrl`.

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Documento (tipo, título, arquivo, validade, valor, notas) | Usuário | Tipo/título/arquivo sim; validade/valor/notas não | `expires_on` alimenta `vehicle_alerts` (`document_expiring`/`document_expired`) |
| Obrigação (tipo, rótulo, vencimento, valor, pago em, notas) | Usuário | Tipo/rótulo/vencimento sim; resto não | `paid_on` nulo = pendente |
| Financiamento (valor financiado, parcela, qtd. parcelas, parcelas pagas, taxa, início) | Usuário | Todos exceto taxa e parcelas pagas (default 0) | Parcelas restantes e saldo devedor vêm calculados do banco |
| Foto (arquivo, categoria, legenda) | Usuário | Arquivo/categoria sim; legenda não | Mesma tabela `vehicle_photos` já usada desde a Fase 2 para a foto de capa |
| Anexo (arquivo) em problema/item/execução | Usuário | Sim, quando anexado | Mesma tabela `attachments` já usada em gasto desde a Fase 4 |

## 8. Estados e transições

- **Obrigação**: pendente (`paid_on` nulo) → paga (`paid_on` preenchido). Voltar para pendente é possível editando e limpando a data — não há um botão dedicado de "desfazer pagamento", é o mesmo formulário de editar.
- **Financiamento**: não existe → existe (0 ou 1 por veículo, nunca mais de um). Dentro de "existe", `installments_paid` vai de 0 até `installment_count`, só crescendo pela ação "+1 parcela paga" (mas pode ser corrigido para qualquer valor entre 0 e `installment_count` via edição manual).

## 9. Erros e casos de borda

- Upload de arquivo com tipo/tamanho inválido: recusado no cliente antes de subir, mensagem em português, nenhum dado persistido (AC-6).
- Erro do Postgres em qualquer insert/update/delete: traduzido via `translatePostgresError` (já existente), nunca mensagem crua na tela.
- Tentar cadastrar um segundo financiamento para o mesmo veículo: a UI já impede oferecendo só "editar" quando um existe (RN-2); se ainda assim uma corrida de cliques tentar criar dois, o banco recusa por unicidade e o erro é traduzido.
- "+1 parcela paga" clicado quando já está no total: botão desabilitado, ação não é possível de disparar (AC-14).
- Excluir foto que é a capa do veículo: `vehicles.primary_photo_id` é limpo como parte da mesma operação (RN-5) — nunca fica quebrado.
- Excluir problema/item/execução com anexo: anexo é removido primeiro; se a remoção do anexo falhar, o registro não é excluído (mesmo comportamento já validado na Fase 4/ADR-027).

## 10. Requisitos não-funcionais

- Mobile-first: telas e diálogos funcionam em 320px sem overflow horizontal, seguindo os mesmos padrões já estabelecidos (`min-w-0`, `max-h-[85vh] overflow-y-auto` em diálogo, grid de campo par que empilha abaixo de `sm`).
- Acessibilidade: abas com semântica `tablist`/`tab`/`tabpanel`, foco visível, sem cor como único indicador de status (documento vencido/obrigação paga sempre tem texto, não só cor).
- Storage: bucket privado, signed URL de curto prazo gerada sob demanda (mesmo padrão da Fase 4), nunca cacheada além do uso imediato.

## 11. Dependências e riscos

- Depende de `vehicle_alerts` (Fase 6) já existir e já cobrir `obligation_*`/`document_*` — confirmado no contrato, sem mudança necessária no AlertBanner.
- Risco: generalizar o componente de anexo pode quebrar o fluxo já validado de Gasto (Fase 4) se a refatoração for descuidada — mitigação: manter o comportamento de Gasto idêntico e usar o mesmo script de verificação (criar/ver/trocar/remover anexo) contra o veículo de teste antes de considerar pronto.
- Risco: página com 4 abas pode ficar densa em 320px — mitigação: abas roláveis horizontalmente se não couberem, testado no screenshot de 320px.

## 12. Perguntas abertas

Nenhuma — decisões de navegação (abas internas), alcance da generalização de anexo (problema/item/manutenção) e mecânica de parcela paga (botão rápido + edição manual) já resolvidas com o usuário antes desta versão da spec.
