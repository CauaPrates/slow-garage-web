# Spec 007 — Problemas e projetos

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-03 |
| **Depende de** | 000-foundation, 001-auth, 002-garage, 003-vehicle-shell, 004-expenses, 005-fuel, 006-maintenance |

## 1. Problema

Hoje não existe onde registrar um problema do carro (barulho estranho,
peça quebrada) e acompanhar até resolver, nem onde planejar um projeto
de modificação (som novo, suspensão, restauro) com lista de itens,
orçamento e progresso. O usuário perde isso em conversa de WhatsApp ou
numa nota solta.

## 2. Resultado esperado

O usuário registra um problema e acompanha seu status até resolver ou
descartar. Cria um projeto, adiciona itens (peça, serviço, upgrade) com
custo estimado e real, e acompanha progresso de conclusão e de
orçamento — sempre um número pronto do banco, nunca calculado no
cliente. O atalho "Upgrade" na folha "Adicionar" registra um item de
projeto em segundos, pedindo pra criar um projeto primeiro se ainda não
existir nenhum.

## 3. Cenários

**Principal — Problema**
1. Usuário relata um problema (título, data, prioridade, status inicial
   "Aberto")
2. Conforme investiga, atualiza o status (Investigando → Aguardando
   peça → Em reparo) livremente, sem ordem imposta
3. Ao resolver, muda o status pra "Resolvido" (ou "Descartado" se não
   for mais um problema de verdade) e opcionalmente registra data de
   resolução, diagnóstico, resolução e custo
4. Problema sai da seção "Abertos" e aparece em "Resolvidos"

**Principal — Projeto**
1. Usuário cria um projeto (nome, status inicial, orçamento opcional)
2. Entra na tela de detalhe do projeto e adiciona itens (nome,
   prioridade, status, custo estimado/real, fornecedor, link)
3. Progresso de conclusão e de orçamento aparecem prontos, vindos de
   `project_progress`
4. Usuário edita status de um item conforme avança (lista de desejo →
   planejado → comprado → instalado) ou cancela

**Alternativo — atalho "Upgrade"**
- Usuário toca "Adicionar" → "Upgrade" com veículo selecionado; se
  houver projeto, escolhe qual e registra o item rápido; se não houver
  nenhum projeto ainda, vê aviso claro com atalho pra criar um projeto
  primeiro, em vez de formulário quebrado ou travado

## 4. Escopo

**Dentro**
- CRUD de problema (`issues`): título, data do relato, prioridade,
  status (livre entre os 6 valores), descrição, diagnóstico, resolução,
  data de resolução, quilometragem, custo
- Lista de problemas em duas seções: Abertos (`open`/`investigating`/
  `waiting_part`/`in_repair`) e Resolvidos (`resolved`/`dismissed`)
- CRUD de projeto (`projects`): nome, status, orçamento, descrição,
  notas, datas de início/alvo/conclusão
- Tela de detalhe do projeto (`/v/:vehicleId/projetos/:projectId`) com
  CRUD de item (`project_items`): nome, status, prioridade, fornecedor,
  link externo, custo estimado/real, data, descrição, notas
- Progresso de conclusão e financeiro do projeto, sempre lido de
  `project_progress` — nunca calculado no cliente
- Ativar "Problemas" e "Projetos" (sidebar) e "Upgrade" (folha
  "Adicionar" — cria item de projeto, com seletor de projeto; sem
  projeto ainda, mostra atalho pra criar um)

**Fora** — explicitamente não entra agora, com o motivo
- Máquina de estado restringindo transição de status — decisão do
  clarify: select livre nos dois ciclos (problema e item de projeto)
- Reordenar item de projeto manualmente (`sort_order` existe na tabela,
  mas nenhuma UI de arrastar-e-soltar é pedida nesta fase)
- Anexo/foto em problema ou item de projeto — isso é Fase 8
  (Documentos), que ainda vai decidir o modelo geral de anexo por
  entidade
- Qualquer cálculo de progresso ou total no cliente — sempre
  `project_progress` (RN-1)

## 5. Critérios de aceite

- **AC-1**: Dado um veículo sem problema nenhum, quando a tela de
  Problemas carrega, então as seções Abertos e Resolvidos mostram
  estado vazio próprio.
- **AC-2**: Dado título e data do relato preenchidos, quando o usuário
  cria um problema, então ele aparece em Abertos com status "Aberto".
- **AC-3**: Dado um problema sem título ou sem data do relato, quando o
  usuário tenta salvar, então o sistema recusa, sem persistir nada.
- **AC-4**: Dado um problema existente, quando o usuário muda o status
  pra "Resolvido" ou "Descartado", então ele sai de Abertos e aparece
  em Resolvidos — em qualquer ordem de transição, sem restrição.
- **AC-5**: Dado um problema ou projeto existente, quando o usuário
  edita ou exclui, então a lista reflete sem duplicar ou deixar
  resíduo.
- **AC-6**: Dado um veículo sem projeto nenhum, quando a tela de
  Projetos carrega, então mostra estado vazio com ação de criar o
  primeiro.
- **AC-7**: Dado nome preenchido, quando o usuário cria um projeto,
  então ele aparece na lista com status inicial e, ao abrir o detalhe,
  progresso "—" (sem item nenhum ainda, não `0%`).
- **AC-8**: Dado um projeto com itens tendo custo estimado e status
  variado, quando a tela de detalhe carrega, então o progresso de
  conclusão e o de orçamento mostrados batem exatamente com
  `project_progress`, nunca somados/calculados no componente.
- **AC-9**: Dado um projeto existente, quando o usuário adiciona um
  item (nome obrigatório), então ele aparece na lista de itens desse
  projeto, e o progresso do projeto se atualiza (lido de novo da view).
- **AC-10**: Dado um item de projeto sem nome, quando o usuário tenta
  salvar, então o sistema recusa, sem persistir nada.
- **AC-11**: Dado o usuário em `/v/:vehicleId` (ou sub-rota) com pelo
  menos um projeto, quando ele toca "Adicionar" → "Upgrade", então vê
  um formulário rápido de item com seletor de projeto, e ao salvar o
  item aparece no projeto escolhido.
- **AC-12**: Dado o usuário em `/v/:vehicleId` (ou sub-rota) sem
  nenhum projeto ainda, quando ele toca "Adicionar" → "Upgrade", então
  vê uma mensagem clara pedindo pra criar um projeto primeiro, com
  atalho direto pra isso — nunca um formulário quebrado ou travado.
- **AC-13**: Dado o usuário em `/` ou `/configuracoes` (sem veículo
  selecionado), quando ele abre a folha "Adicionar", então "Upgrade"
  aparece desabilitado com o motivo "Selecione um veículo".
- **AC-14**: Dado os itens "Problemas" e "Projetos" da sidebar (agora
  habilitados), quando clicados dentro do contexto de um veículo,
  então navegam para `/v/:vehicleId/problemas` e `/v/:vehicleId/projetos`
  respectivamente.
- **AC-15**: Dado um `projectId` que não existe ou pertence a outro
  veículo/usuário, quando o usuário acessa
  `/v/:vehicleId/projetos/:projectId`, então vê uma mensagem de
  "projeto não encontrado" com link de volta, nunca tela branca.

## 6. Regras de negócio

- **RN-1**: Progresso de conclusão (`pct_items_completed`) e de
  orçamento (`pct_budget_used`) de um projeto sempre vêm de
  `project_progress` — nunca somados/calculados no cliente. `null`
  (projeto sem item, ou sem orçamento) é exibido como "—", nunca `0%`.
- **RN-2**: Status de problema e de item de projeto são campos livres
  — qualquer valor do enum pode ser escolhido a qualquer momento, sem
  máquina de estado no cliente (decisão do clarify).
- **RN-3**: Todo item de projeto pertence a um projeto — não existe
  item avulso (diferente do registro de execução de manutenção, Fase
  6). O atalho "Upgrade" sempre exige escolher ou criar um projeto
  antes de salvar o item.
- **RN-4**: `project_items.vehicle_id` sempre é o mesmo do
  `project_id` escolhido — nunca outro veículo, mesmo que o usuário
  tenha mais de um (o banco recusa com erro `P0001` se divergir; o
  cliente nunca tenta enviar um `vehicle_id` diferente do da rota
  atual).

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Título, data do relato, prioridade, status, descrição, diagnóstico, resolução, data de resolução, km, custo | Formulário → `issues` | Título e data do relato sim | CRUD de problema |
| Nome, status, orçamento, descrição, notas, datas | Formulário → `projects` | Nome sim | CRUD de projeto |
| Nome, status, prioridade, fornecedor, link, custo estimado/real, data, descrição, notas, projeto | Formulário → `project_items` | Nome e projeto sim | CRUD de item |
| Progresso de conclusão e financeiro | `project_progress` (leitura) | — | Nunca calculado no cliente |

## 8. Estados e transições

Problema (`issue_status`): `open → investigating → waiting_part →
in_repair → resolved` é o caminho típico, mas qualquer transição é
permitida (RN-2), incluindo `dismissed` a qualquer momento. Item de
projeto (`project_item_status`): `wishlist → planned → purchased →
installed`, com `cancelled` disponível a qualquer momento — mesma
regra de liberdade de transição.

## 9. Erros e casos de borda

- Problema sem título/data, item sem nome/projeto → recusado no
  cliente, sem chamada de rede.
- Projeto sem nenhum item → progresso "—", nunca "0%" (RN-1).
- Projeto sem orçamento definido → `pct_budget_used` "—", mesmo com
  itens tendo custo.
- `projectId` inválido ou de outro usuário → "projeto não encontrado"
  (AC-15), tratado igual a "não existe" (RLS não distingue, mesmo
  princípio do RN-4 da Fase 3).
- Atalho "Upgrade" sem projeto existente → mensagem + atalho pra criar
  (AC-12), nunca formulário com seletor vazio travado.

## 10. Requisitos não-funcionais

- 320px sem overflow horizontal em listas, detalhe de projeto e
  formulários.
- Badge de status (problema e item) sempre com texto, nunca só cor.
- Diálogos seguem `max-h-[85vh] overflow-y-auto` (ADR-020).

## 11. Dependências e riscos

- Depende do mecanismo de nav dependente de veículo (Fase 4, ADR-024).
  "Upgrade" é o quarto item a sair de `to: null`, mas o primeiro cujo
  destino depende de **dado adicional** (ter projeto ou não) além de
  só ter veículo — mitigado deixando essa checagem dentro da própria
  `ProjectsPage`, não no `navigation.ts` (que só resolve rota por
  `vehicleId`, não por outro estado de dado).
- Risco: `/v/:vehicleId/projetos/:projectId` é a primeira rota de
  terceiro nível do projeto — mitigado seguindo exatamente o padrão de
  "não encontrado" já validado em `VehiclePage` (Fase 3) e
  `ExpensesPage`/`FuelLogsPage` (Fases 4/5).

## 12. Perguntas abertas

Nenhuma. As três ambiguidades de produto (rota de detalhe de projeto;
ativação do atalho "Upgrade" e seu comportamento sem projeto; liberdade
de transição de status) foram resolvidas no clarify desta fase.
