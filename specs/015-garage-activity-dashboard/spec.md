# Spec 015 — Atividade recente no cabeçalho + painel comparativo da garagem

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | M |
| **Criada em** | 2026-09-05 |
| **Depende de** | specs/002-garage (GarageSummary), specs/013-vehicle-hub (sino de alertas / header) |

## 1. Problema

Hoje o card "Atividade recente" (`GarageActivityFeed`) só aparece na tela
"Minha Garagem", ocupa um espaço grande e empurra a lista de veículos pra
baixo — pra ver o que rolou de novo em qualquer carro, o usuário precisa
estar especificamente nessa tela. Ao mesmo tempo, esse espaço podia
carregar um dado que hoje não existe em lugar nenhum: uma visão
comparativa entre os veículos da garagem (quanto cada um já custou frente
aos outros, quantos veículos e quanto rodaram ao todo).

## 2. Resultado esperado

A atividade recente vira um popover acessível pelo ícone no cabeçalho, no
mesmo padrão do sino de alertas (`HeaderAlertsMenu`) — funciona em
qualquer tela do app, sem precisar navegar até "Minha Garagem". No lugar
onde o card antigo ficava, a tela "Minha Garagem" passa a mostrar um
painel comparativo entre os veículos: indicadores agregados da frota e um
gráfico de investimento por veículo.

## 3. Cenários

**Principal**
1. O usuário está em qualquer página do app (não só Minha Garagem).
2. Ele clica no ícone de atividade recente no cabeçalho.
3. Um popover abre mostrando os eventos mais recentes de todos os
   veículos, agrupados por veículo quando há mais de um — mesmo conteúdo
   que o card antigo mostrava.
4. Ele fecha o popover e abre "Minha Garagem".
5. No lugar onde antes ficava "Atividade recente", ele vê um painel com
   indicadores da frota inteira (contagem de veículos, km total, custo/km
   médio, gasto do mês) e um gráfico comparando o investimento total de
   cada veículo.

**Alternativos**
- Usuário com 1 veículo só: o painel comparativo não aparece (nada pra
  comparar), igual já acontece hoje com `GarageSummary`.
- Usuário sem nenhuma atividade registrada em nenhum veículo: o popover
  mostra o mesmo estado vazio que o card antigo mostrava.
- Usuário sem nenhum veículo cadastrado: o ícone de atividade some do
  cabeçalho, mesmo comportamento do sino de alertas.

## 4. Escopo

**Dentro**
- Novo item no cabeçalho (ícone + popover) com o conteúdo que hoje está
  em `GarageActivityFeed`, reaproveitando `useGarageTimeline` sem
  mudança de query.
- Remoção do card "Atividade recente" da tela "Minha Garagem".
- Novo painel na tela "Minha Garagem", visível só com 2+ veículos:
  - quantidade de veículos cadastrados e quantos estão ativos;
  - km total rodado somando todos os veículos;
  - custo por km médio da garagem;
  - gasto do mês atual somado de todos os veículos;
  - gráfico de barras comparando o investimento total (`total_invested`)
    de cada veículo.

**Fora** — explicitamente não entra agora
- Nova tabela, view ou RPC no banco — todo dado usado já é buscado hoje
  por `useVehicles` e `useGarageTimeline`; o painel só agrega no cliente.
- Paginação ou "ver tudo" na lista do popover — mantém o limite de 8
  eventos que `useGarageTimeline` já aplica.
- Clique nas barras do gráfico comparativo levando para o veículo — v1 é
  só leitura, igual aos gráficos existentes de `GarageSummary`.
- Qualquer mudança no comportamento do sino de alertas além de existir
  lado a lado com o novo ícone.

## 5. Critérios de aceite

- **AC-1**: Dado o usuário logado em qualquer página do app, quando ele
  clica no ícone de atividade recente no cabeçalho, então abre um
  popover com os eventos mais recentes de todos os veículos, agrupados
  por veículo quando há mais de um cadastrado (mesmo agrupamento que
  `GarageActivityFeed` fazia).
- **AC-2**: Dado que nenhum evento existe em nenhum veículo, quando o
  popover de atividade abre, então mostra "Nenhuma atividade registrada
  ainda. Registre um gasto, abastecimento ou manutenção pra começar."
- **AC-3**: Dado que o usuário não tem nenhum veículo cadastrado, então o
  ícone de atividade recente não aparece no cabeçalho.
- **AC-4**: Dado qualquer estado da garagem, quando o usuário abre "Minha
  Garagem", então o card "Atividade recente" não existe mais nessa tela.
- **AC-5**: Dado 2 ou mais veículos cadastrados, quando o usuário abre
  "Minha Garagem", então aparece o painel comparativo com: contagem de
  veículos (total e ativos), km total da garagem, custo/km médio da
  garagem, gasto do mês atual somado, e o gráfico de investimento por
  veículo.
- **AC-6**: Dado exatamente 1 veículo cadastrado, quando o usuário abre
  "Minha Garagem", então o painel comparativo não aparece.
- **AC-7**: Dado um veículo com `current_odometer_km` nulo, quando o
  painel calcula o km total da garagem, então esse veículo é ignorado na
  soma (não conta como 0 km).
- **AC-8**: Dado um veículo sem `cost_per_km` calculado (resumo
  financeiro nulo ou campo nulo), quando o painel calcula o custo/km
  médio da garagem, então esse veículo é excluído da média — não entra
  no denominador nem no numerador.
- **AC-9**: Dado mais de 8 veículos cadastrados, quando o gráfico de
  investimento por veículo é exibido, então os 8 com maior
  `total_invested` aparecem como barras individuais e o restante é
  somado em uma barra "Outros".

## 6. Regras de negócio

- **RN-1**: O painel comparativo só aparece com 2+ veículos — mesma regra
  já aplicada em `GarageSummary` (nunca duplicar um número que já é
  idêntico ao de exibir um único veículo).
- **RN-2**: Toda métrica de média (custo/km) ignora veículos sem o dado
  em vez de tratá-los como zero, pra não distorcer a média pra baixo.
- **RN-3**: O ícone de atividade no cabeçalho usa a mesma fonte de dado e
  o mesmo limite (8 eventos mais recentes) que o card removido — não é
  uma tela de histórico completo, é o mesmo "resumo rápido" de antes.

## 7. Dados

Nenhum dado novo nasce. Tudo já é lido hoje:

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Eventos recentes por veículo | `useGarageTimeline` (já existe) | — | Sem mudança na query, só onde é renderizado. |
| `total_invested`, `cost_per_km`, `current_month_spend` por veículo | `vehicle_financial_summary` via `useVehicles` (já existe) | Não — podem ser `null` | Agregado no cliente. |
| `current_odometer_km`, `status` por veículo | tabela `vehicles` via `useVehicles` (já existe) | `status` sim, `current_odometer_km` pode ser `null` | Agregado no cliente. |

## 8. Estados e transições

N/A — não há entidade com ciclo de vida nesta spec, só apresentação de
dado já existente.

## 9. Erros e casos de borda

- Veículo sem `current_odometer_km`: excluído da soma de km total
  (AC-7).
- Veículo sem `cost_per_km`: excluído da média de custo/km (AC-8).
- Mais de 8 veículos no gráfico comparativo: os excedentes viram "Outros"
  (AC-9), mesmo padrão do `ExpensesByCategoryChart`.
- Falha ao buscar `useGarageTimeline` ou `useVehicles`: cada componente
  mostra seu próprio estado de erro, sem quebrar o resto da tela (mesmo
  padrão já usado em `HeaderAlertsMenu`/`GarageSummary`).

## 10. Requisitos não-funcionais

- O cabeçalho é compartilhado entre mobile e desktop (`AppShell`); o
  novo ícone precisa caber ao lado do trocador de veículo, sino de
  alertas e menu de usuário em 320-390px sem causar overflow horizontal
  — verificar com screenshot real, não só leitura de classe Tailwind.
- O painel comparativo segue os mesmos tokens de cor e o mesmo padrão
  visual (sem biblioteca de gráfico, barras em `div` com token de cor)
  já usado em `ExpensesByMonthChart`/`ExpensesByCategoryChart`.

## 11. Dependências e riscos

- Depende do cabeçalho existente (`AppShell.tsx`, `HeaderAlertsMenu.tsx`)
  como referência de padrão — risco baixo, é reaproveitar um componente
  que já funciona.
- Risco de o cabeçalho ficar apertado em telas pequenas com o ícone a
  mais — mitigado verificando em 320/390px antes de fechar a fase.

## 12. Perguntas abertas

Nenhuma.
