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

A atividade recente deixa de ser um card fixo em "Minha Garagem" e passa
a ser lida direto pela navegação principal, sem exigir clique — no
desktop, a sidebar (nav bar) ganha uma seção "Atividade recente" visível
o tempo todo, no espaço que sobrava entre os links de navegação e
"Configurações". Como o mobile não tem sidebar, ele mantém um mecanismo
próprio: ícone no cabeçalho com popover, no mesmo padrão do sino de
alertas (`HeaderAlertsMenu`) — só visível abaixo do breakpoint `lg`. No
lugar onde o card antigo ficava em "Minha Garagem", a tela passa a
mostrar um painel comparativo entre os veículos: indicadores agregados da
frota e um gráfico de investimento por veículo.

> **Nota de revisão (015b)**: a primeira implementação desta spec colocou
> a atividade recente atrás de um ícone com popover no cabeçalho em
> **todas** as telas, inclusive desktop. O usuário corrigiu: no desktop
> ele quer ler direto pela sidebar, sem precisar clicar; o popover no
> cabeçalho deve valer só pro mobile, que não tem sidebar. Os cenários e
> ACs abaixo já refletem a versão corrigida.

## 3. Cenários

**Principal (desktop, `lg` e acima)**
1. O usuário está em qualquer página do app (não só Minha Garagem).
2. Ele olha a sidebar à esquerda — sem clicar em nada, a seção
   "Atividade recente" já mostra os eventos mais recentes de todos os
   veículos, agrupados por veículo quando há mais de um.
3. Ele abre "Minha Garagem". No lugar onde antes ficava o card "Atividade
   recente", ele vê um painel com indicadores da frota inteira (contagem
   de veículos, km total, custo/km médio, gasto do mês) e um gráfico
   comparando o investimento total de cada veículo.

**Principal (mobile, abaixo de `lg`)**
1. O usuário está em qualquer página do app.
2. Ele clica no ícone de atividade recente no cabeçalho (a sidebar não
   existe nesse tamanho de tela).
3. Um popover abre mostrando os mesmos eventos, agrupados por veículo.

**Alternativos**
- Usuário com 1 veículo só: o painel comparativo aparece do mesmo jeito
  (revisão 015c — ver nota abaixo), mesmo repetindo algum número que já
  está no card daquele veículo; a seção de atividade na sidebar/popover
  continua aparecendo normalmente.
- Usuário sem nenhuma atividade registrada em nenhum veículo: a
  sidebar/popover mostra o mesmo estado vazio que o card antigo mostrava.
- Usuário sem nenhum veículo cadastrado: a seção de atividade não aparece
  nem na sidebar nem no cabeçalho; o painel comparativo também não
  aparece (não há o que agregar).
- Usuário no mobile (abaixo de `lg`): o painel comparativo não aparece
  (revisão 015c) — informação demais pra tela pequena; ele é recurso de
  desktop.

> **Nota de revisão (015c)**: a v1 só mostrava o painel comparativo com
> 2+ veículos, espelhando a regra do `GarageSummary`. O usuário testou
> com 1 veículo só (conta real, não a de teste) e viu a área vazia,
> achando que a entrega não tinha acontecido — o exemplo original dele
> ("um carro que gastei 20 mil, outro que gastei 10 mil, total 30 mil")
> descrevia o caso de 2+ veículos, mas ele confirmou que quer o painel
> visível mesmo com 1 veículo só. Na mesma rodada, pediu pra esconder o
> painel inteiro no mobile — informação demais pra tela pequena. RN-1 e
> os ACs 5/6 abaixo refletem essa correção.

## 4. Escopo

**Dentro**
- Seção "Atividade recente" na sidebar (desktop, `lg`+), sempre visível,
  com o conteúdo que hoje está em `GarageActivityFeed`, reaproveitando
  `useGarageTimeline` sem mudança de query.
- Ícone + popover no cabeçalho com o mesmo conteúdo, visível só abaixo de
  `lg` (mobile, onde não há sidebar).
- Remoção do card "Atividade recente" da tela "Minha Garagem".
- Novo painel na tela "Minha Garagem", visível com 1+ veículo cadastrado
  e só em telas `lg` ou maiores (desktop — escondido no mobile,
  revisão 015c):
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

- **AC-1**: Dado o usuário logado em qualquer página do app em tela
  `lg` ou maior (desktop), então a sidebar mostra uma seção "Atividade
  recente" com os eventos mais recentes de todos os veículos, agrupados
  por veículo quando há mais de um — visível sem precisar clicar em
  nada.
- **AC-1b**: Dado o usuário logado em qualquer página do app em tela
  abaixo de `lg` (mobile), quando ele clica no ícone de atividade recente
  no cabeçalho, então abre um popover com o mesmo conteúdo (mesmo
  agrupamento por veículo que `GarageActivityFeed` fazia).
- **AC-1c**: Dado o usuário em tela `lg` ou maior, então o ícone de
  atividade recente do cabeçalho não aparece (a leitura é só pela
  sidebar); dado o usuário abaixo de `lg`, a seção da sidebar não existe
  (a sidebar inteira já não renderiza nesse tamanho).
- **AC-2**: Dado que nenhum evento existe em nenhum veículo, quando a
  seção de atividade (sidebar ou popover, conforme o tamanho de tela)
  aparece, então mostra o texto de estado vazio correspondente.
- **AC-3**: Dado que o usuário não tem nenhum veículo cadastrado, então a
  seção de atividade não aparece nem na sidebar nem no cabeçalho.
- **AC-4**: Dado qualquer estado da garagem, quando o usuário abre "Minha
  Garagem", então o card "Atividade recente" não existe mais nessa tela.
- **AC-5**: Dado 1 ou mais veículos cadastrados, quando o usuário abre
  "Minha Garagem" em tela `lg` ou maior, então aparece o painel
  comparativo com: contagem de veículos (total e ativos), km total da
  garagem, custo/km médio da garagem, gasto do mês atual somado, e o
  gráfico de investimento por veículo — mesmo com 1 veículo só.
- **AC-6**: Dado 1 ou mais veículos cadastrados, quando o usuário abre
  "Minha Garagem" em tela abaixo de `lg` (mobile), então o painel
  comparativo não aparece.
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

- **RN-1** *(revisada em 015c)*: O painel comparativo aparece com
  qualquer quantidade de veículos (1+), diferente de `GarageSummary`
  (que continua exigindo 2+) — o usuário confirmou que prefere ver o
  painel mesmo repetindo número já visível no card do único veículo, em
  vez de a área ficar vazia. Só não aparece no mobile (RN-5).
- **RN-2**: Toda métrica de média (custo/km) ignora veículos sem o dado
  em vez de tratá-los como zero, pra não distorcer a média pra baixo.
- **RN-3**: A seção de atividade (sidebar no desktop, popover no mobile)
  usa a mesma fonte de dado e o mesmo limite (8 eventos mais recentes)
  que o card removido — não é uma tela de histórico completo, é o mesmo
  "resumo rápido" de antes.
- **RN-4**: A leitura da atividade recente é mutuamente exclusiva por
  breakpoint (`lg`): sidebar substitui o popover no desktop, popover
  substitui a sidebar no mobile — nunca os dois ao mesmo tempo.
- **RN-5** *(nova em 015c)*: O painel comparativo é recurso exclusivo de
  desktop (`lg`+) — não aparece no mobile, pra não empilhar informação
  demais numa tela pequena que já mostra `GarageSummary` e a lista de
  veículos.

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
