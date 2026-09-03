# Spec 006 — Manutenção preventiva e execução

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-03 |
| **Depende de** | 000-foundation, 001-auth, 002-garage, 003-vehicle-shell, 004-expenses, 005-fuel |

## 1. Problema

Hoje não existe onde planejar "troca de óleo a cada 10.000km" nem
registrar que ela foi feita. O usuário decora prazo de manutenção de
cabeça ou numa planilha separada, e não tem aviso automático de que
algo já venceu ou está perto de vencer.

## 2. Resultado esperado

O usuário cadastra um item do plano preventivo (nome, intervalo por
km e/ou por mês, prioridade). O sistema calcula sozinho — nunca o
cliente — quando cada item vence e mostra isso separado em vencidas,
próximas e histórico do que já foi feito. Um banner no topo avisa o
que está vencido ou perto de vencer. Registrar que um serviço foi
executado é rápido, com ou sem vínculo a um item do plano.

## 3. Cenários

**Principal**
1. Usuário cria um item do plano ("Troca de óleo", a cada 10.000 km)
2. O item aparece em "Próximas" com status "planejado" (nunca
   executado ainda)
3. Usuário registra a execução (quilometragem, data; vínculo com o
   item é opcional) — o item passa a ter "última vez" preenchida e o
   status recalcula sozinho a partir daí
4. Quando a quilometragem/data do veículo se aproxima ou passa do
   próximo vencimento, o item aparece em "Próximas" com destaque ou em
   "Vencidas", e um alerta aparece no banner do topo
5. Usuário edita ou apaga um item do plano, ou um registro de execução,
   pra corrigir engano

**Alternativos**
- Registro de execução sem vínculo com item do plano (reparo pontual,
  ex.: "troquei o alternador") — decisão do clarify: permitido, com
  nome livre
- Item do plano nunca executado → status "planejado", diferente de
  "em dia" (RN-1, contrato do backend)
- Veículo sem nenhum item de plano e sem histórico → as três seções
  mostram estado vazio próprio, banner de alerta não aparece
- Item do plano com `is_active = false` (desativado na edição) → some
  das seções de plano; seu histórico de execução permanece intacto

## 4. Escopo

**Dentro**
- CRUD de item do plano preventivo (nome, categoria livre, intervalo
  por km e/ou por mês — pelo menos um dos dois —, prioridade,
  descrição, custo estimado, notas, ativo/inativo)
- CRUD de registro de execução (nome, quilometragem, data, custo,
  fornecedor, notas, vínculo opcional com um item do plano)
- Três seções na tela: Vencidas, Próximas (inclui "planejado" e
  "em dia" e "perto de vencer"), Histórico — status sempre lido de
  `maintenance_status`, nunca calculado no cliente
- Banner de alertas ativos no topo, lendo `vehicle_alerts` (decisão do
  clarify: componente de propósito geral, pronto pra Documentos/
  Obrigações reaproveitarem nas Fases 7/8 sem mudança)
- Ativar os itens "Manutenção" (sidebar) e "Manutenção" (folha
  "Adicionar" — abre direto o registro de execução, a ação mais
  repetida no dia a dia, não a criação de item de plano)

**Fora** — explicitamente não entra agora, com o motivo
- Tela separada de "itens inativos" — desativar só tira o item das
  seções de plano; não há arquivo/histórico de itens pausados nesta
  fase (não pedido, adiciona uma tela sem necessidade demonstrada)
- Qualquer cálculo de próximo vencimento no cliente — sempre
  `maintenance_status` (RN-1)
- Notificação push/e-mail de vencimento — fora de escopo do produto
  inteiro (seção 12 do doc mestre)
- Editar `maintenance_items.last_service_*` ou
  `vehicles.current_odometer_km` manualmente — um trigger do banco já
  faz isso ao registrar execução (RN-2)

## 5. Critérios de aceite

- **AC-1**: Dado um veículo sem item de plano e sem execução
  registrada, quando a tela de Manutenção carrega, então as três
  seções (Vencidas, Próximas, Histórico) mostram estado vazio próprio,
  e nenhum banner de alerta aparece.
- **AC-2**: Dado nome e pelo menos um intervalo (km ou meses)
  preenchidos, quando o usuário cria um item do plano, então ele
  aparece em "Próximas" com status "planejado".
- **AC-3**: Dado um item do plano sem nome, ou sem nenhum intervalo
  preenchido (nem km nem meses), quando o usuário tenta salvar, então
  o sistema recusa e indica o problema, sem persistir nada.
- **AC-4**: Dado um item do plano existente, quando o usuário registra
  uma execução vinculada a ele com quilometragem e data, então o
  registro aparece em "Histórico", e o item passa a mostrar a última
  execução (data/km) — sem o cliente enviar ou calcular esses campos
  no item, só o registro em `maintenance_records`.
- **AC-5**: Dado um reparo pontual sem vínculo com item do plano,
  quando o usuário registra a execução só com nome, quilometragem e
  data, então ele aparece em "Histórico" normalmente, sem exigir
  selecionar um item.
- **AC-6**: Dado um item do plano cujo próximo vencimento (por
  km ou data, vindo de `maintenance_status`) já passou, quando a tela
  carrega, então ele aparece em "Vencidas", não em "Próximas", e um
  alerta correspondente aparece no banner do topo.
- **AC-7**: Dado um item do plano com status "planejado" (nunca
  executado), quando a tela carrega, então ele aparece em "Próximas"
  com indicação visual de que nunca foi feito — nunca confundido com
  "em dia" (RN-1).
- **AC-8**: Dado um item ou registro existente, quando o usuário edita
  qualquer campo e salva, então a seção correspondente reflete os
  novos valores sem duplicar.
- **AC-9**: Dado um item do plano, quando o usuário o desativa (edita,
  desmarca "ativo"), então ele deixa de aparecer em Vencidas/Próximas,
  mas seu histórico de execução (se houver) continua visível em
  Histórico.
- **AC-10**: Dado um item de plano ou registro de execução existente,
  quando o usuário confirma a exclusão, então ele some da seção
  correspondente.
- **AC-11**: Dado o usuário em `/v/:vehicleId` (ou sub-rota), quando
  ele toca "Adicionar" → "Manutenção", então é levado para a lista de
  manutenção desse veículo com o diálogo de registrar execução já
  aberto.
- **AC-12**: Dado o usuário em `/` ou `/configuracoes` (sem veículo
  selecionado), quando ele abre a folha "Adicionar", então o item
  "Manutenção" aparece desabilitado com o motivo "Selecione um
  veículo".
- **AC-13**: Dado o item "Manutenção" da sidebar (agora habilitado),
  quando clicado dentro do contexto de um veículo, então navega para
  `/v/:vehicleId/manutencao` desse veículo.

## 6. Regras de negócio

- **RN-1**: Status de cada item (vencido/próximo/em dia/planejado)
  sempre vem de `maintenance_status`, nunca calculado no cliente.
  "Planejado" (nunca executado) não é o mesmo que "em dia".
- **RN-2**: Registrar execução nunca envia nem atualiza
  `maintenance_items.last_service_date`,
  `maintenance_items.last_service_odometer_km` nem
  `vehicles.current_odometer_km` — um trigger do banco já faz isso, e
  só avança esses valores, nunca regride.
- **RN-3**: Item do plano exige `interval_km` e/ou `interval_months`
  preenchido — os dois vazios é recusado pelo banco; o cliente valida
  isso antes de qualquer chamada de rede.
- **RN-4**: Registro de execução pode ou não estar vinculado a um item
  do plano (`maintenance_item_id` opcional) — reparo pontual não
  planejado é um registro válido.
- **RN-5**: Banner de alerta lê `vehicle_alerts` (já filtrada por
  `is_active = true` e só `overdue`/`due_soon`, por contrato) — o
  cliente não filtra de novo.

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Nome, categoria, intervalo (km e/ou meses), prioridade, descrição, custo estimado, notas, ativo | Formulário → `maintenance_items` | Nome sim; intervalo pelo menos um dos dois | CRUD do plano |
| Nome, quilometragem, data, custo, fornecedor, notas, item vinculado (opcional) | Formulário → `maintenance_records` | Nome, km, data sim | CRUD de execução |
| Status, próximo vencimento (km/data), última execução | `maintenance_status` (leitura) | — | Nunca calculado no cliente |
| Alertas ativos | `vehicle_alerts` (leitura) | — | Já filtrada, só exibir |

## 8. Estados e transições

Item do plano: `is_active` true/false — edição simples de campo, sem
fluxo dedicado de "pausar". Status (vencido/próximo/em dia/planejado)
é derivado pela view, não uma coluna que o cliente muda diretamente.
Registro de execução não tem estado — existe, edita, ou é excluído.

## 9. Erros e casos de borda

- Item sem nome ou sem nenhum intervalo → recusado no cliente (AC-3).
- Registro sem nome, quilometragem ou data → recusado no cliente,
  mesmo padrão das fases anteriores.
- Veículo sem item nem execução → três estados vazios independentes
  (AC-1), nunca uma tela genérica de "nada aqui".
- Erro do Postgres nunca aparece cru — reusa `lib/postgresErrors.ts`.

## 10. Requisitos não-funcionais

- 320px sem overflow horizontal em banner, seções e formulários.
- Badge de prioridade e de status nunca só por cor — sempre com texto
  (mesmo princípio do ADR-014).
- Diálogos seguem `max-h-[85vh] overflow-y-auto` (ADR-020).

## 11. Dependências e riscos

- Depende do mecanismo de nav dependente de veículo (Fase 4/5,
  ADR-024) — "Manutenção" é o terceiro item a sair de `to: null`.
- Risco: duas ações de criação diferentes (item do plano vs. execução)
  na mesma tela — mitigado com dois botões claramente rotulados
  ("Novo item do plano" / "Registrar execução"), sem tentar unificar
  num só formulário.
- Risco: `maintenance_status` não tem os campos descritivos do item
  (categoria, intervalo, custo estimado) — mitigado combinando os dados
  de `maintenance_items` (CRUD) com `maintenance_status` (situação),
  o mesmo padrão de batelamento já usado em `useVehicles`.

## 12. Perguntas abertas

Nenhuma. As duas ambiguidades de produto (execução avulsa sem item do
plano; forma do "alerta interno") foram resolvidas no clarify desta
fase.
