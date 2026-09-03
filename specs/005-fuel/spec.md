# Spec 005 — Abastecimento e métricas de consumo

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-03 |
| **Depende de** | 000-foundation, 001-auth, 002-garage, 003-vehicle-shell, 004-expenses |

## 1. Problema

O usuário abastece o carro toda semana e hoje não tem onde registrar
isso nem como saber se o consumo está bom ou piorando. "Gastos" (Fase 4)
não serve pra isso por decisão de arquitetura — abastecimento é fonte
própria, nunca duplicada em `expenses`. Sem essa tela, o app continua
sem responder a pergunta mais repetida de quem cuida de carro: "quantos
km/L esse carro está fazendo?".

## 2. Resultado esperado

No posto, em pé, com uma mão, o usuário registra o abastecimento
(quilometragem, litros, valor total, se encheu o tanque) em poucos
segundos. Na lista, cada abastecimento mostra o consumo daquele trecho
(km/L) quando o banco tem confiança no número, e "—" quando não tem
(tanque não cheio, ou abastecimento anterior perdido) — nunca uma
estimativa inventada no cliente. No topo, um resumo mostra consumo
médio, melhor, pior e custo por km, todos vindos prontos do banco.

## 3. Cenários

**Principal**
1. Usuário está em `/v/:vehicleId` (ou sub-rota) e toca "Adicionar" →
   "Abastecimento", **ou** clica "Abastecimentos" na sidebar e depois
   em "Registrar abastecimento"
2. Preenche quilometragem, litros, valor total e confirma se o tanque
   encheu (default "sim") — data e combustível já vêm preenchidos
   (hoje; o combustível do próprio veículo), editáveis em "mais
   detalhes" se precisar
3. Salva; o abastecimento aparece no topo da lista; se for o segundo ou
   posterior com tanque cheio nos dois, o km/L desse trecho aparece
   junto
4. Usuário edita um abastecimento pra corrigir um valor digitado errado
5. Usuário apaga um abastecimento lançado por engano

**Alternativos**
- Usuário tenta salvar com uma quilometragem que já existe para esse
  veículo → recusado com mensagem específica ("esse odômetro já foi
  registrado"), nenhum registro duplicado
- Abastecimento com tanque não cheio → km/L desse trecho aparece como
  "—" (custo/km continua calculado, ver AC-7); abastecimento perdido
  ("perdi o abastecimento anterior") afeta a confiabilidade de forma
  mais ampla, incluindo o custo/km, já que a distância real percorrida
  desde o último registro fica incerta
- Veículo sem nenhum abastecimento ainda → estado vazio com ação para
  registrar o primeiro, resumo de consumo não aparece (não tem o que
  resumir)
- Toque em "Abastecimento" na folha "Adicionar" sem veículo selecionado
  → item desabilitado, motivo "Selecione um veículo" (mesmo mecanismo
  da Fase 4)

## 4. Escopo

**Dentro**
- Registrar, listar, editar e excluir abastecimento de um veículo
- Resumo de consumo do veículo: médio, melhor, pior (km/L) e custo/km,
  lidos prontos de `vehicle_fuel_summary`/`vehicle_financial_summary`
- km/L e custo/km por abastecimento (não só o resumo geral), lidos de
  `fuel_log_metrics`, com "—" quando o banco não tem confiança no
  número
- Ativar os itens "Abastecimentos" (sidebar) e "Abastecimento" (folha
  "Adicionar"), hoje em "Em breve"/sem rota
- Toggle "Tanque cheio" e campo "Perdi o abastecimento anterior"
  (ambos afetam a confiabilidade das métricas, por regra do próprio
  banco)

**Fora** — explicitamente não entra agora, com o motivo
- Filtro por período/combustível na lista — não pedido para esta tela
  (decisão do clarify); lista cronológica simples resolve
- Qualquer cálculo de km/L, custo/km ou média no cliente — vem sempre
  pronto das views (RN-1)
- Gráfico de consumo ao longo do tempo — isso é Fase 9 (dashboard)
- Abastecimento contando como gasto em `expenses` — proibido pelo
  contrato do backend, RN-2 desta spec

## 5. Critérios de aceite

- **AC-1**: Dado um veículo sem nenhum abastecimento, quando a tela de
  Abastecimentos carrega, então mostra estado vazio com um botão para
  registrar o primeiro, sem exibir o resumo de consumo.
- **AC-2**: Dado quilometragem, litros, valor total e "tanque cheio"
  preenchidos (os 4 campos visíveis), quando o usuário salva, então o
  abastecimento aparece no topo da lista com data de hoje e o
  combustível do veículo, sem precisar abrir "mais detalhes".
- **AC-3**: Dado um abastecimento sem quilometragem, sem litros ou sem
  valor total, quando o usuário tenta salvar, então o sistema recusa e
  indica o campo faltante, sem persistir nada.
- **AC-4**: Dado um valor negativo em quilometragem, litros ou valor
  total, quando o usuário tenta salvar, então o sistema recusa antes de
  qualquer chamada ao servidor.
- **AC-5**: Dado um veículo com um abastecimento já registrado numa
  quilometragem X, quando o usuário tenta registrar outro na mesma
  quilometragem X, então o sistema recusa com a mensagem "Esse
  odômetro já foi registrado para este veículo.", não um erro genérico.
- **AC-6**: Dado dois abastecimentos consecutivos com tanque cheio nos
  dois, quando a lista renderiza, então o segundo mostra o km/L
  calculado (vindo de `fuel_log_metrics`, nunca calculado no cliente).
- **AC-7**: Dado um abastecimento com tanque **não** cheio, quando a
  lista renderiza, então esse abastecimento mostra "—" no km/L (não dá
  pra saber quanto combustível foi realmente consumido sem encher o
  tanque). O custo/km desse mesmo abastecimento **continua calculado**
  — descoberta feita contra o banco real durante a verificação desta
  fase: `cost_per_km` só depende da distância percorrida e do valor
  pago, nenhum dos dois fica incerto por o tanque não ter enchido; a
  incerteza documentada no contrato ("tanque não cheio... vêm null")
  se aplica a `km_per_liter`, não a `cost_per_km` (ver ADR desta fase).
- **AC-8**: Dado pelo menos 2 abastecimentos com km/L válido, quando a
  tela carrega, então o resumo no topo mostra consumo médio, melhor e
  pior (km/L) e custo/km, todos vindos de
  `vehicle_fuel_summary`/`vehicle_financial_summary`, nunca calculados
  no cliente.
- **AC-9**: Dado um abastecimento existente, quando o usuário edita
  qualquer campo e salva, então a lista e o resumo refletem os novos
  valores, sem duplicar o registro.
- **AC-10**: Dado um abastecimento existente, quando o usuário confirma
  a exclusão, então ele some da lista e o resumo de consumo é
  recalculado (lido de novo da view, não ajustado no cliente).
- **AC-11**: Dado o usuário em `/v/:vehicleId` (ou sub-rota), quando ele
  toca "Adicionar" → "Abastecimento", então é levado para a lista de
  abastecimentos desse veículo com o formulário de registro já aberto.
- **AC-12**: Dado o usuário em `/` ou `/configuracoes` (sem veículo
  selecionado), quando ele abre a folha "Adicionar", então o item
  "Abastecimento" aparece desabilitado com o motivo "Selecione um
  veículo".
- **AC-13**: Dado o item "Abastecimentos" da sidebar (agora habilitado),
  quando clicado dentro do contexto de um veículo, então navega para
  `/v/:vehicleId/abastecimentos` desse veículo.

## 6. Regras de negócio

- **RN-1**: `price_per_liter`, `km_per_liter`, `cost_per_km` e as
  agregações do resumo (média/melhor/pior) nunca são calculados no
  cliente — sempre lidos de `fuel_logs.price_per_liter`,
  `fuel_log_metrics` e `vehicle_fuel_summary`/`vehicle_financial_summary`.
  `null` nessas colunas significa "sem dado confiável" e é exibido como
  "—", nunca substituído por estimativa.
- **RN-2**: Abastecimento nunca é somado nem espelhado em `expenses` —
  fonte de dado própria e independente, por decisão de arquitetura do
  backend.
- **RN-3**: Quilometragem repetida para o mesmo veículo é um erro de
  negócio esperado (constraint única do banco), tratado com mensagem
  específica, não como falha genérica.
- **RN-4**: Editar/excluir segue o mesmo padrão de diálogo já usado em
  veículo (Fase 2) e gasto (Fase 4) — confirmação para excluir, mesmo
  formulário para criar/editar.

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Quilometragem, litros, valor total | Formulário → `fuel_logs` | Sim | Os 3 campos numéricos do registro rápido |
| Tanque cheio | Formulário → `fuel_logs` | Sim (default "sim") | 4º campo visível — afeta a confiabilidade do km/L |
| Data, combustível | Formulário → `fuel_logs` | Sim, pré-preenchidos | "Mais detalhes"; data default hoje, combustível default o do veículo |
| Posto, perdi o abastecimento anterior, notas | Formulário → `fuel_logs` | Não | "Mais detalhes" |
| `price_per_liter` | Calculado pelo banco | — | Nunca enviado, nunca recalculado |
| km/L, custo/km por registro | `fuel_log_metrics` (leitura) | — | `null` quando o banco não confia no número |
| Consumo médio/melhor/pior, custo/km do veículo | `vehicle_fuel_summary` / `vehicle_financial_summary` (leitura) | — | Já parcialmente usado desde a Fase 2/3 |

## 8. Estados e transições

Abastecimento não tem ciclo de vida — existe, pode ser editado em
qualquer campo, ou deixa de existir (exclusão). Não há status.

## 9. Erros e casos de borda

- Campo obrigatório vazio ou valor negativo → recusado no cliente,
  antes de qualquer chamada de rede (AC-3, AC-4).
- Quilometragem repetida → mensagem específica (AC-5, RN-3).
- Tanque não cheio ou abastecimento anterior perdido → métricas em "—"
  (AC-7), nunca estimativa.
- Veículo sem abastecimento nenhum → resumo de consumo não aparece
  (não esconder atrás de "—" repetido; simplesmente omitir o bloco).
- Erro do Postgres nunca aparece cru — sempre traduzido (RN-3, reusa
  `lib/postgresErrors.ts` da Fase 4, estendido pra esse caso).

## 10. Requisitos não-funcionais

- Os 4 campos obrigatórios do registro rápido visíveis sem rolar em
  390px, resto atrás de "mais detalhes" — mesmo espírito da meta de 30
  segundos do doc mestre (seção 8), agora na tela que a meta cita
  nominalmente.
- 320px sem overflow horizontal em lista, resumo e formulário.
- Toggle "Tanque cheio" com alvo de toque ≥44px e rótulo textual
  sempre visível (nunca só a cor do switch).

## 11. Dependências e riscos

- Depende da generalização de `NavItem`/`resolveNavItem` da Fase 4 —
  "Abastecimentos" e "Abastecimento" são o segundo par de itens a sair
  de `to: null`, exercitando o mesmo mecanismo sem mudança nele.
- Risco: `<Switch>` (Radix) não é um input nativo — não funciona com
  `register()` do react-hook-form direto. Mitigação: usar `Controller`.
- Risco: não há garantia documentada de que `vehicles.current_odometer_km`
  avança automaticamente a cada abastecimento (só documentado pro fluxo
  de manutenção). Mitigação: o campo quilometragem do formulário de
  criar **não** vem pré-preenchido com o odômetro atual do veículo (ao
  contrário do gasto, Fase 4) — evita sugerir um valor que colidiria
  com a constraint única (RN-3) se o odômetro do veículo já reflete o
  último abastecimento.

## 12. Perguntas abertas

Nenhuma. As três ambiguidades de produto (edição/exclusão no escopo;
quais 4 campos ficam visíveis vs. pré-preenchidos; filtro na lista)
foram resolvidas no clarify desta fase.
