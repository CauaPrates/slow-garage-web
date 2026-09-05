# Spec 004 — Gastos do veículo

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-02 |
| **Depende de** | 000-foundation, 001-auth, 002-garage, 003-vehicle-shell |

## 1. Problema

Hoje o único jeito de saber quanto um carro já custou é o "Total investido"
que a Fase 2 mostra — um número pronto, sem nenhum lançamento por trás.
O usuário não tem como registrar peça, mão de obra, seguro ou qualquer
outro custo avulso, nem consultar depois onde o dinheiro foi. Sem isso, o
app não substitui a planilha — só mostra um total que ninguém alimentou.

## 2. Resultado esperado

Dentro de um veículo, o usuário registra um gasto (categoria, valor,
descrição, data) em poucos campos, vê a lista de tudo que já lançou,
filtra por categoria e por período, edita ou apaga um lançamento, e
opcionalmente anexa o comprovante (foto ou PDF). O "Total investido" já
existente passa a refletir gasto de verdade. O item "Gastos" da sidebar
(Fase 3, hoje desabilitado com "Em breve") passa a funcionar; o item
"Gasto" da folha "Adicionar" também passa a funcionar quando o usuário
está dentro de um veículo.

## 3. Cenários

**Principal**
1. Usuário está em `/v/:vehicleId` (ou em qualquer sub-rota desse
   veículo) e toca "Adicionar" → "Gasto", **ou** clica "Gastos" na
   sidebar e depois em "Registrar gasto"
2. Preenche categoria, valor, descrição e data (os 4 campos
   obrigatórios) e salva
3. O gasto aparece no topo da lista (mais recente primeiro); o "Total
   investido" do veículo (Fase 2/3) já reflete o novo valor
4. Usuário filtra a lista por categoria e/ou por período
5. Usuário edita um gasto existente — pode também anexar ou trocar o
   comprovante nesse momento
6. Usuário apaga um gasto, com confirmação

**Alternativos**
- Usuário toca "Gasto" na folha "Adicionar" estando em `/` ou
  `/configuracoes` (sem veículo selecionado) → item aparece desabilitado,
  motivo "Selecione um veículo" (não "Em breve" — a tela existe, falta
  só o contexto)
- Lista sem nenhum gasto ainda (veículo novo) → estado vazio com ação
  para registrar o primeiro
- Filtro sem nenhum resultado (ex.: categoria sem lançamento no período)
  → mensagem de "nenhum gasto encontrado com esse filtro", diferente da
  mensagem de lista genuinamente vazia
- Falha ao subir o anexo depois do gasto já salvo → gasto permanece
  salvo; mensagem específica de que só o anexo falhou, com o gasto
  disponível para editar e tentar anexar de novo

## 4. Escopo

**Dentro**
- Registrar, listar, filtrar (categoria + período), editar e excluir
  gasto de um veículo específico
- Anexo opcional (1 arquivo, imagem ou PDF) por gasto — anexar, ver,
  trocar e remover, disponível só depois que o gasto já existe (mesma
  restrição que a foto do veículo na Fase 2, pelo mesmo motivo: precisa
  do id do registro pai para montar o caminho no Storage)
- Uso das 12 categorias de sistema (`expense_categories`, leitura)
- Ativar o item "Gastos" da sidebar e o item "Gasto" da folha
  "Adicionar" (ambos desabilitados desde a Fase 3), incluindo o novo
  estado "desabilitado por falta de veículo selecionado"
- Tocar "Gasto" com veículo selecionado navega para a lista de gastos
  desse veículo já com o formulário de registro aberto

**Fora** — explicitamente não entra agora, com o motivo
- Criar/editar categoria própria — o doc mestre só pede "categorias do
  sistema"; o backend permite via RLS, mas nenhuma tela de gerenciar
  categoria é construída agora (decisão do clarify desta fase)
- Múltiplos anexos por gasto — o doc mestre usa "anexo" no singular;
  1 arquivo cobre o caso real (foto do recibo ou PDF da nota)
- Filtro por intervalo de data livre — período é por preset (este mês,
  mês passado, este ano, tudo), decisão do clarify
- Qualquer gráfico ou agregação por categoria/mês — isso é
  `get_vehicle_dashboard`, entrega da Fase 9
- Abastecimento continua fora de `expenses` — RN-2 do contrato do
  backend, nunca somado nem misturado nesta tela
- Paginação da lista — volume esperado de um carro pessoal não justifica
  agora; se afetar performance, revisita-se depois

## 5. Critérios de aceite

- **AC-1**: Dado um veículo sem nenhum gasto, quando a tela de Gastos
  carrega, então mostra estado vazio com um botão para registrar o
  primeiro gasto.
- **AC-2**: Dado os 4 campos obrigatórios preenchidos (categoria, valor,
  descrição, data), quando o usuário salva, então o gasto aparece no
  topo da lista e o "Total investido" do veículo (visível no header,
  Fase 3) reflete o novo valor após a mutação.
- **AC-3**: Dado um gasto sem valor, sem categoria, sem descrição ou sem
  data, quando o usuário tenta salvar, então o sistema recusa e indica
  o campo faltante, sem persistir nada.
- **AC-4**: Dado um valor negativo ou uma quilometragem negativa (campo
  opcional "mais detalhes"), quando o usuário tenta salvar, então o
  sistema recusa antes de qualquer chamada ao servidor.
- **AC-5**: Dado dois ou mais gastos em categorias diferentes, quando o
  usuário filtra por uma categoria, então só os gastos dessa categoria
  aparecem; ao voltar para "Todas", a lista completa volta.
- **AC-6**: Dado gastos em meses diferentes, quando o usuário filtra por
  "Este mês", então só os gastos com `occurred_on` no mês corrente
  aparecem; "Tudo" mostra todos, independente de quando foram lançados.
- **AC-7**: Dado um filtro (categoria e/ou período) sem nenhum gasto
  correspondente, quando a lista renderiza, então mostra uma mensagem
  de "nenhum gasto encontrado com esse filtro" — diferente da mensagem
  do estado vazio (AC-1), que é sobre o veículo nunca ter tido gasto
  nenhum.
- **AC-8**: Dado um gasto existente, quando o usuário edita valor,
  categoria, descrição, data ou qualquer campo opcional e salva, então
  a lista e o total refletem os novos valores, sem duplicar o registro.
- **AC-9**: Dado um gasto existente, quando o usuário confirma a
  exclusão, então ele some da lista, o total do veículo é recalculado,
  e — se havia anexo — o anexo também deixa de existir (arquivo e
  metadado), sem ficar órfão no Storage.
- **AC-10**: Dado um gasto recém-criado (sem anexo), quando o usuário
  abre editar e anexa uma imagem ou PDF, então o anexo passa a
  aparecer como "ver anexo" no mesmo diálogo, e um arquivo de tipo não
  suportado (ex.: `.txt`) é recusado antes do upload, com mensagem em
  português.
- **AC-11**: Dado um gasto com anexo, quando o usuário troca por outro
  arquivo, então o anexo antigo deixa de existir (não fica um segundo
  arquivo órfão) e o novo passa a ser o único.
- **AC-12**: Dado um gasto com anexo, quando o usuário remove o anexo
  sem enviar outro, então o gasto continua existindo normalmente, sem
  anexo.
- **AC-13**: Dado o usuário em `/v/:vehicleId` (ou sub-rota), quando ele
  toca "Adicionar" → "Gasto", então é levado para a lista de gastos
  desse veículo com o formulário de registro já aberto.
- **AC-14**: Dado o usuário em `/` ou `/configuracoes` (sem veículo
  selecionado), quando ele abre a folha "Adicionar", então o item
  "Gasto" aparece desabilitado com o motivo "Selecione um veículo" —
  visualmente e semanticamente diferente de um item "Em breve".
- **AC-15**: Dado o item "Gastos" da sidebar (agora habilitado), quando
  clicado dentro do contexto de um veículo, então navega para
  `/v/:vehicleId/gastos` desse veículo.

## 6. Regras de negócio

- **RN-1**: Anexo é opcional, no máximo 1 por gasto, e só pode ser
  gerenciado depois que o gasto já existe (o diálogo de criar não tem
  campo de anexo; o de editar tem) — mesma razão da foto do veículo na
  Fase 2: o caminho no Storage precisa do id do registro pai.
- **RN-2**: Excluir um gasto sempre remove seu anexo (arquivo no Storage
  + linha em `attachments`) antes ou junto da exclusão do gasto — nunca
  deixa metadado ou arquivo órfão. Se a limpeza do anexo falhar, o gasto
  **não** é excluído (a operação inteira falha e pode ser tentada de
  novo), em vez de apagar o gasto e deixar um arquivo/linha sem dono.
- **RN-3**: Trocar o anexo de um gasto sempre remove o anterior antes de
  gravar o novo — nunca acumula mais de um arquivo por gasto.
- **RN-4**: `expenses.amount` nunca é somado com `fuel_logs` no
  cliente — o "Total investido" continua vindo pronto da view
  `vehicle_financial_summary` (Fase 2/3), nunca recalculado aqui.
- **RN-5**: Categoria é sempre uma das 12 de sistema nesta fase — não há
  criação de categoria própria (fora de escopo, ver seção 4).
- **RN-6**: Filtro de categoria e de período são independentes e se
  combinam (E lógico) — filtrar por categoria X e por "este mês" mostra
  só gastos da categoria X ocorridos este mês.

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Categoria, valor, descrição, data | Formulário → `expenses` | Sim | Os 4 campos do registro rápido |
| Quilometragem, fornecedor, forma de pagamento, notas | Formulário → `expenses` | Não | "Mais detalhes", colapsado por padrão (mesmo padrão do `VehicleForm`) |
| Lista de categorias | `expense_categories` (leitura) | — | 12 de sistema, sempre presentes |
| Anexo (arquivo) | Upload → bucket `vehicle-documents` + linha em `attachments` | Não | `entity_type='expense'`, `entity_id=<gasto>` |
| Total investido do veículo | `vehicle_financial_summary` (já usado desde a Fase 2) | — | Não recalculado aqui — só invalidado para refletir o novo dado |

## 8. Estados e transições

Gasto não tem ciclo de vida próprio (não muda de "status") — existe,
pode ser editado em qualquer campo, ou deixa de existir (exclusão).
Anexo tem 3 estados por gasto: ausente → presente → ausente de novo
(removido) ou presente com outro arquivo (trocado). Não há estado
intermediário persistido (upload é síncrono do ponto de vista da UI:
enquanto sobe, o controle fica em "Enviando…", igual ao padrão já usado
na foto do veículo).

## 9. Erros e casos de borda

- Campo obrigatório vazio ou valor/km negativo → recusado no cliente,
  antes de qualquer chamada de rede (AC-3, AC-4).
- Arquivo de anexo com tipo não suportado ou maior que o limite →
  recusado no cliente, mensagem em português, nenhum upload iniciado.
- Upload do anexo falha depois do gasto já salvo → gasto permanece,
  mensagem específica de falha do anexo (não do gasto), usuário pode
  tentar anexar de novo editando o gasto.
- Exclusão de gasto com anexo cuja limpeza falha → gasto **não** é
  excluído (RN-2) — usuário vê mensagem de erro e pode tentar de novo.
- Filtro que não bate com nenhum gasto → mensagem própria (AC-7),
  nunca confundida com "veículo sem gasto nenhum" (AC-1).
- Erro do Postgres (RLS, chave estrangeira, check) nunca aparece cru —
  sempre traduzido para português antes de chegar na tela.

## 10. Requisitos não-funcionais

- Os 4 campos obrigatórios do registro rápido visíveis sem rolar em
  390px, com o resto atrás de "mais detalhes" — mesmo espírito da meta
  de 30 segundos do doc mestre (seção 8), ainda que a meta numérica seja
  formalmente da Fase 5 (abastecimento).
- 320px sem overflow horizontal em lista, filtro e formulário.
- Item desabilitado da navegação (sidebar/folha) continua alcançável
  por teclado e comunicado como indisponível (mesmo padrão da Fase 3,
  ADR-022), agora com dois motivos possíveis de desabilitar.
- Diálogo de criar/editar gasto segue o mesmo `max-h-[85vh]
  overflow-y-auto` de todo diálogo do projeto (ADR-020).

## 11. Dependências e riscos

- Depende da sidebar/folha "Adicionar" da Fase 3 — este é o primeiro
  item que sai do estado "Em breve", exercitando pela primeira vez o
  mecanismo previsto no ADR-022.
- Risco: `lib/navigation.ts` hoje só suporta `to: string | null`; um
  item que depende do veículo atual (rota) precisa de uma terceira
  forma (função que recebe o `vehicleId`). Mitigação: generalizar o
  tipo `NavItem` de forma retrocompatível — itens estáticos continuam
  funcionando sem mudança.
- Risco: apagar gasto com anexo em duas operações (Storage + tabelas)
  sem transação de banco (a plataforma não expõe transação multi-tabela
  ao cliente). Mitigação: ordem que nunca deixa órfão pior que o estado
  atual — apaga Storage e linha de `attachments` **antes** do gasto; se
  falhar, gasto continua existindo (RN-2) e é possível tentar de novo.

## 12. Perguntas abertas

Nenhuma. As cinco ambiguidades de produto (comportamento do item
"Gasto" sem veículo selecionado; criação de categoria própria; destino
do toque em "Gasto"; formato do filtro de período; estado padrão da
lista; quantidade/tipo de anexo) foram resolvidas no clarify desta
fase.
