# Spec 009 — Timeline, dashboard e busca

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G — nova tabela consumida via CRUD (`notes`), duas RPCs novas (`get_vehicle_dashboard`, `search_vehicle`), dois gráficos novos (dependência de decisão de paleta), toca a rota principal do veículo |
| **Criada em** | 2026-09-03 |
| **Depende de** | 003-vehicle-shell (rota `/v/:vehicleId`, sidebar), 004-008 (todas as fontes que alimentam `vehicle_timeline`) |

## 1. Problema

Hoje o dono do veículo não tem visão consolidada: pra saber "quanto gastei esse ano" ou "o que aconteceu com esse carro desde que comprei", precisa abrir sete telas separadas (Gastos, Abastecimentos, Manutenção, Problemas, Projetos, Documentos, Obrigações) e juntar mentalmente. `VehiclePage` hoje só mostra km atual e total investido, com o aviso literal "Dashboard completo chega na Fase 9". Não existe também nenhum jeito de anotar algo que não se encaixa em nenhuma tabela específica (ex.: "comprei o carro pra restaurar aos poucos") — a tabela `notes` existe no banco desde a Fase 0, mas nunca ganhou tela.

## 2. Resultado esperado

Ao abrir um veículo, o usuário vê de cara um resumo financeiro e de atividade (dashboard) sem precisar somar nada na cabeça. Consegue rolar uma linha do tempo única com tudo que já aconteceu com o carro, filtrar por tipo e período, buscar por palavra-chave, e anotar observações livres que também entram nessa linha do tempo.

## 3. Cenários

**Principal — dashboard**
1. Usuário abre `/v/:vehicleId` (mesma rota da Fase 2/3, header + trocador de veículo já existentes).
2. Abaixo do cabeçalho, vê: alertas ativos (mesmo `AlertBanner` da Fase 6, agora alimentado pelo próprio `get_vehicle_dashboard`), um resumo financeiro (total investido, custo/km, gasto no mês, gasto no ano, e a quebra por gasto/manutenção/combustível/itens de projeto), um resumo de combustível (consumo médio/melhor/pior, total de litros), contagem de problemas em aberto e projetos ativos (cada um linkando pra tela correspondente), e dois gráficos: gasto por mês e gasto por categoria.
3. Veículo recém-criado sem nenhum dado: cada bloco mostra "—"/estado vazio, nunca erro — o contrato já garante isso (RN de `get_vehicle_dashboard`).

**Principal — linha do tempo**
1. Usuário abre "Histórico" no menu do veículo.
2. Vê todos os eventos (gasto, abastecimento, manutenção, problema, item de projeto, documento, nota) em ordem cronológica decrescente, cada um com título, data, valor (quando existe) e um resumo curto.
3. Filtra por tipo (um ou "todos") e por período (mesmas opções já usadas em Gastos: tudo/este mês/mês passado/este ano).
4. Cada evento que já tem tela própria leva pra ela ao clicar ("Ver"); nota é editável/excluível ali mesmo, porque não tem outra tela.

**Principal — nota**
1. Usuário toca "Nota" na folha "Adicionar" (ativo pela primeira vez nesta fase).
2. Preenche título, corpo (opcional), data, km (opcional), salva.
3. Nota aparece na linha do tempo como qualquer outro evento.

**Principal — busca**
1. Na tela "Histórico", usuário digita num campo de busca.
2. Enquanto há uma busca ativa, a lista normal (filtrada por tipo/período) é substituída pelos resultados de `search_vehicle`, ordenados por relevância, cada um mostrando título, trecho e data.
3. Limpar o campo volta a mostrar a linha do tempo normal.

**Alternativos**
- Busca sem resultado: estado vazio "Nada encontrado para 'X'", nunca erro.
- Filtro de tipo sem nenhum evento correspondente no período: estado vazio explicando o filtro ativo, com ação pra limpar o filtro.

## 4. Escopo

**Dentro**
- Dashboard do veículo (`get_vehicle_dashboard`) substituindo o placeholder atual de `VehiclePage`.
- Dois gráficos: gasto por mês (`expenses_by_month`) e gasto por categoria (`expenses_by_category`) — sem biblioteca de gráfico nova, SVG/HTML construído à mão (mesma filosofia da ADR-007/021: sem dependência pra um caso simples).
- Linha do tempo unificada (`vehicle_timeline`) com filtro por tipo e por período, rota nova ativando o item "Histórico" da sidebar (hoje `to: null`).
- Busca (`search_vehicle`) embutida na própria tela de Histórico (sem rota nova).
- CRUD de nota (`notes`), ativando o item "Nota" da folha "Adicionar" (hoje `to: null`) — única fonte da timeline sem tela própria, então nota é editada/excluída na própria linha do tempo.

**Fora** — explicitamente não entra agora
- Filtro de intervalo de data customizado (calendário) na busca ou na timeline — só os períodos pré-definidos já usados em Gastos (tudo/este mês/mês passado/este ano). Um seletor de data livre é mais complexidade do que o caso de uso pessoal pede agora.
- Editar/excluir qualquer evento da timeline que não seja nota diretamente na própria timeline — os outros tipos continuam sendo editados na tela de origem; a timeline só linka pra lá.
- Exportar dashboard ou timeline (PDF, CSV) — não pedido, e está na lista geral de "fora de escopo" do produto (simulador financeiro é o item mais próximo, mas exportação nem chegou a ser cogitada).
- Gráfico de terceiro tipo além de "por mês"/"por categoria" — é exatamente o que o roadmap pediu, nada a mais.
- Obrigação/financiamento aparecerem na timeline — confirmado contra o banco real que `vehicle_timeline` não inclui essas duas fontes (só expense/fuel_log/maintenance_record/issue/project_item/document/note); não é uma omissão desta fase, é como a view já existe.

## 5. Critérios de aceite

**Dashboard**
- **AC-1**: Dado um veículo com dado em várias tabelas, quando o usuário abre `/v/:vehicleId`, então vê resumo financeiro, resumo de combustível, alertas, contagem de problemas/projetos e os dois gráficos, todos vindos de uma única chamada a `get_vehicle_dashboard` (não uma query por bloco).
- **AC-2**: Dado um veículo sem nenhum gasto/abastecimento/manutenção, quando o dashboard carrega, então cada campo numérico mostra "—" (nunca `0` inventado nem erro), e os gráficos mostram estado vazio.
- **AC-3**: Dado que `get_vehicle_dashboard.alerts` tem pelo menos um item, quando o dashboard carrega, então o mesmo `AlertBanner` da Fase 6 aparece com esses alertas, sem chamada adicional a `vehicle_alerts`.
- **AC-4**: Dado `expenses_by_category` com N categorias, quando o gráfico de categoria renderiza, então cada categoria tem uma cor distinta e um rótulo direto (nome + valor) — nunca só cor pra identificar.
- **AC-5**: Dado `expenses_by_month` com M meses, quando o gráfico de mês renderiza, então cada mês tem seu valor rotulado diretamente na barra.

**Timeline**
- **AC-6**: Dado um veículo com eventos de pelo menos 3 fontes diferentes, quando o usuário abre "Histórico", então vê todos em ordem cronológica decrescente, cada um com ícone/rótulo indicando o tipo, sem precisar decifrar `source_table` cru.
- **AC-7**: Dado o filtro de tipo aplicado a um tipo específico, quando a lista atualiza, então só eventos daquele tipo aparecem.
- **AC-8**: Dado o filtro de período aplicado (ex.: "este mês"), quando a lista atualiza, então só eventos com `occurred_on` dentro do período aparecem.
- **AC-9**: Dado um evento de tipo diferente de nota, quando o usuário clica "Ver", então é levado pra tela onde esse registro pode ser editado (ex.: problema leva pra `/v/:vehicleId/problemas`).
- **AC-10**: Dado um veículo sem nenhum evento, quando "Histórico" abre, então mostra estado vazio (não erro), sem quebrar mesmo que o veículo nunca tenha tido nenhuma nota criada.

**Nota**
- **AC-11**: Dado o formulário de nova nota com título e data preenchidos, quando o usuário salva, então a nota é criada e aparece na timeline imediatamente.
- **AC-12**: Dado uma nota existente, quando o usuário edita ou exclui direto na timeline, então a mudança reflete sem navegar pra outra tela.
- **AC-13**: Dado o item "Nota" da folha "Adicionar", quando o usuário toca, então vai pra "Histórico" com o formulário de nova nota já aberto (mesmo padrão `?novo=1` das fases anteriores).

**Busca**
- **AC-14**: Dado um termo digitado no campo de busca da timeline, quando a busca retorna resultados, então a lista normal (com filtro de tipo/período) é substituída pelos resultados de `search_vehicle`, ordenados por relevância.
- **AC-15**: Dado um termo sem nenhum resultado, quando a busca roda, então aparece "Nada encontrado" — nunca lista vazia sem explicação nem erro.
- **AC-16**: Dado o campo de busca limpo (vazio), quando o usuário apaga o termo, então a timeline volta a mostrar a lista normal (com o filtro de tipo/período que estava ativo antes).

## 6. Regras de negócio

- **RN-1**: Nenhum valor de `get_vehicle_dashboard`/`vehicle_timeline`/`search_vehicle` é recalculado no cliente — tudo lido pronto, mesma regra de todas as fases anteriores.
- **RN-2**: `null` em qualquer campo numérico do dashboard significa "sem dado suficiente" e vira "—", nunca `0`.
- **RN-3**: A timeline não inclui obrigação nem financiamento — confirmado contra o banco real; a view não gera evento pra essas duas fontes.
- **RN-4**: Nota é a única fonte da timeline com CRUD direto ali — todo outro tipo linka pra sua tela de origem.

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Nota (título, corpo, data, km) | Usuário | Título/data sim; corpo/km não | Única tabela nova consumida nesta fase |
| Dashboard (financeiro, combustível, alertas, contagens, séries) | `get_vehicle_dashboard` (RPC) | — | Objeto único, `null` em sub-bloco quando não há dado |
| Timeline (evento unificado) | `vehicle_timeline` (view) | — | `amount`/`metadata` variam por `event_type` |
| Resultado de busca (título, trecho, data, tipo, relevância) | `search_vehicle` (RPC) | — | Já vem ordenado por `rank desc` |

## 8. Estados e transições

N/A — nenhuma entidade desta fase tem ciclo de vida com transição restrita (nota é criar/editar/excluir livre, como gasto).

## 9. Erros e casos de borda

- `get_vehicle_dashboard` retorna `null` em `financial_summary`/`fuel_summary` pra veículo sem dado: tratado como "—" em cada campo, nunca erro de renderização (`?.` em tudo).
- Busca com termo de 1-2 caracteres: `search_vehicle` já tolera (é RPC do banco, sem validação de tamanho mínimo do lado do cliente) — não adicionamos restrição artificial.
- Categoria além da 8ª num gráfico com muitas categorias ativas ao mesmo tempo: dobra em "Outras" (soma) em vez de gerar uma 9ª cor (regra de paleta — ver plano).
- Excluir nota: exclusão de verdade (mesmo padrão de obrigação/item de manutenção), sem soft-delete.

## 10. Requisitos não-funcionais

- Mobile-first: gráficos e timeline sem overflow horizontal em 320px; se a quantidade de meses/categorias não couber, rola horizontalmente com a mesma affordance já usada nas abas da Fase 8.
- Acessibilidade: nenhum gráfico depende só de cor pra identificar série — todo valor tem rótulo direto em texto.
- `get_vehicle_dashboard` é uma chamada só — nunca decompor em várias queries de tabela client-side (regra geral do contrato, reforçada aqui porque é o caso mais tentador de "só mais uma queriazinha").

## 11. Dependências e riscos

- Depende de todas as fases 4-8 já existirem pra timeline ter conteúdo real pra mostrar — confirmado contra o veículo seed do bob (`Chevrolet Opala`), que já tem 7 eventos de 7 fontes diferentes.
- Risco: paleta categórica genérica pode não combinar com o tema dourado/dark do app — mitigado consultando a skill de dataviz do projeto antes de implementar; paleta validada contra as cores reais de superfície do app (`#201c15` dark / `#fbf7ee` light), não só contra os defaults da skill.
- Risco: `VehiclePage.tsx` já é uma tela com bastante conteúdo (header, trocador de veículo); acrescentar o dashboard inteiro nela pode ficar denso — mitigado extraindo os blocos novos pra `features/dashboard/`, mantendo `VehiclePage` como shell fino que só compõe.

## 12. Perguntas abertas

Nenhuma — CRUD de nota entrar no escopo e a busca viver embutida na tela de Histórico (em vez de rota própria) já foram decididos com o usuário antes desta versão da spec.
