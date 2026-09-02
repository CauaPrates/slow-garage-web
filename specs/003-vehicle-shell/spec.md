# Spec 003 — Casca de navegação e rota do veículo

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-02 |
| **Depende de** | 000-foundation, 001-auth, 002-garage |

## 1. Problema

Hoje o app só tem uma tela de domínio: a lista de veículos em `/`. Não existe
um lugar para "entrar" em um veículo específico — todo o resto do produto
(gastos, abastecimentos, manutenção, problemas, projetos, histórico,
documentos, dashboard) é sempre sobre **um** veículo por vez, e essas telas
só chegam nas Fases 4 a 9. Sem a casca de navegação agora, cada fase futura
teria que reinventar layout, e o usuário não tem como ainda "abrir" um carro
específico a partir da garagem.

## 2. Resultado esperado

O usuário clica em um veículo na garagem e cai em `/v/:vehicleId`, uma tela
com o header do veículo (foto, nome, ano, status) e um resumo mínimo com o
que já existe pronto (km, total investido). Dali, a sidebar (desktop) ou a
bottom nav (mobile) mostram para onde o produto vai crescer — a maioria dos
itens ainda desabilitados com "Em breve", porque a tela deles não existe até
a fase correspondente — sem fingir que já funciona e sem esconder a forma
final da navegação. No mobile, o botão central "Adicionar" abre uma folha
com os 6 tipos de registro rápido, hoje todos desabilitados pelo mesmo
motivo. É possível trocar de veículo sem voltar para a garagem.

## 3. Cenários

**Principal**
1. Usuário autenticado, com pelo menos um veículo, clica em um card na
   garagem (`/`)
2. Navega para `/v/:vehicleId`
3. Vê o header do veículo (foto ou placeholder, marca/modelo, ano, status) e
   um resumo com km atual e total investido
4. Na sidebar (desktop) ou bottom nav (mobile), vê a navegação completa do
   produto; os itens cuja tela ainda não existe aparecem desabilitados com
   indicação "Em breve"
5. Usa o seletor de veículo no header para trocar para outro veículo da
   garagem sem passar por `/`
6. No mobile, toca em "Adicionar"; abre uma folha com os 6 tipos de registro
   (Gasto, Abastecimento, Manutenção, Upgrade, Foto, Nota), todos
   desabilitados nesta fase

**Alternativos**
- Usuário digita ou acessa uma URL `/v/:id` de um veículo que não existe ou
  não é dele → tela de "veículo não encontrado" com link de volta para `/`
- Usuário sem nenhum veículo cadastrado nunca chega em `/v/:id` por link
  interno (a garagem vazia não tem card para clicar); se acessar a URL
  manualmente, cai no mesmo caso acima
- Usuário acessa `/configuracoes` (fora do contexto de um veículo) → sidebar
  e bottom nav continuam visíveis, mas sem veículo selecionado

## 4. Escopo

**Dentro**
- Rota `/v/:vehicleId` com header do veículo e resumo mínimo (km, total
  investido, foto, status)
- Sidebar desktop com os 10 itens da navegação (seção 8 do doc mestre),
  cada um roteando para sua página quando ela existe, e desabilitado com
  "Em breve" quando não existe ainda
- Bottom navigation mobile com 5 itens (Home, Carros, Adicionar, Dados,
  Configurações), mesma regra de desabilitado por "não existe ainda"
- Folha (sheet) do botão "Adicionar", com os 6 tipos de registro rápido,
  todos desabilitados nesta fase (nenhum fluxo de registro existe até a
  Fase 4)
- Seletor de troca de veículo no header, navegando entre `/v/:id` sem passar
  pela garagem
- Estado de "veículo não encontrado" para id inválido ou de outro usuário
- `ROUTES` estendido com o helper de rota do veículo

**Fora** — explicitamente não entra agora, com o motivo
- Conteúdo real de Gastos, Abastecimentos, Manutenção, Problemas, Projetos,
  Histórico, Documentos e Dashboard — cada um é a entrega da sua própria
  fase (4 a 9)
- Qualquer fluxo por trás dos 6 itens da folha "Adicionar" — mesma razão
- Cálculo novo de resumo do veículo — o resumo desta fase reaproveita
  exatamente o que a view financeira já expõe (usado desde a Fase 2); nenhum
  número novo é inventado no cliente
- Edição/exclusão de veículo a partir da rota `/v/:id` — já existe na
  garagem (Fase 2) e não é duplicada aqui
- Breadcrumb ou histórico de veículos recentes — não pedido, não necessário
  para a troca funcionar

## 5. Critérios de aceite

- **AC-1**: Dado um veículo existente do usuário logado, quando ele clica no
  card na garagem, então é levado a `/v/:vehicleId` e vê marca, modelo, ano,
  status, km atual e total investido (ou "—" quando a view ainda não tem
  resumo) desse veículo específico.
- **AC-2**: Dado um veículo sem foto cadastrada, quando o header renderiza,
  então mostra o mesmo placeholder de ícone usado no card da garagem (sem
  imagem quebrada, sem espaço vazio sem indicação).
- **AC-3**: Dado um `vehicleId` que não existe ou pertence a outro usuário,
  quando o usuário acessa `/v/:vehicleId`, então vê uma mensagem de "veículo
  não encontrado" com um link para voltar à garagem — nunca uma tela em
  branco, nunca um erro não tratado no console.
- **AC-4**: Dado o desktop (≥1024px), quando qualquer tela autenticada
  renderiza, então a sidebar mostra os 10 itens de navegação da seção 8;
  "Minha garagem" e "Configurações" são clicáveis e levam à página certa;
  os outros 7 (Dashboard, Gastos, Abastecimentos, Manutenção, Problemas,
  Projetos, Histórico, Documentos) aparecem visualmente desabilitados, sem
  navegar ao clicar, com indicação textual "Em breve".
- **AC-5**: Dado o mobile (<1024px), quando qualquer tela autenticada
  renderiza, então a bottom nav mostra 5 itens (Home, Carros, Adicionar,
  Dados, Configurações); "Carros", "Adicionar" e "Configurações" funcionam;
  "Home" e "Dados" aparecem desabilitados com "Em breve".
- **AC-6**: Dado o mobile, quando o usuário toca em "Adicionar", então abre
  uma folha (sheet) a partir da base da tela com os 6 tipos de registro
  (Gasto, Abastecimento, Manutenção, Upgrade, Foto, Nota), todos
  desabilitados com "Em breve" nesta fase; a folha fecha ao tocar fora dela,
  no X, ou em Esc.
- **AC-7**: Dado o usuário dentro de `/v/:vehicleId` com mais de um veículo
  na garagem, quando ele abre o seletor de veículo no header e escolhe outro,
  então é levado a `/v/:outroId` sem passar por `/`, e o header/resumo
  atualiza para o novo veículo.
- **AC-8**: Dado o usuário dentro de `/v/:vehicleId` com apenas um veículo na
  garagem, quando ele olha o seletor, então o controle não oferece nenhuma
  outra opção além do veículo atual (nunca lista vazia nem opção "trocar"
  sem destino).
- **AC-9**: Dado qualquer item desabilitado (sidebar, bottom nav ou folha),
  quando navegado por teclado (Tab), então ele é alcançável e comunicado
  como indisponível para leitor de tela (`aria-disabled`, nunca removido da
  árvore de foco de forma que pareça que o item simplesmente sumiu).
- **AC-10**: Dado 320px de largura, quando a bottom nav ou a folha
  "Adicionar" renderiza, então não há overflow horizontal e todo alvo de
  toque mede pelo menos 44×44px.

## 6. Regras de negócio

- **RN-1**: O veículo selecionado mora exclusivamente na URL (`/v/:vehicleId`).
  Nenhum estado de veículo atual em contexto React ou `localStorage` —
  decisão já registrada na arquitetura do doc mestre (seção 6).
- **RN-2**: Um item de navegação é desabilitado quando sua página de destino
  ainda não existe no código (fases futuras). A causa é sempre "a tela não
  foi construída ainda", nunca uma regra de permissão do usuário.
- **RN-3**: O resumo da rota `/v/:vehicleId` só usa dado que a Fase 2 já
  busca (view `vehicle_financial_summary`, foto assinada). Nenhum número é
  calculado no cliente.
- **RN-4**: A pertença do veículo ao usuário é sempre resolvida por RLS (a
  consulta simplesmente não retorna o veículo de outro usuário) — a tela de
  "não encontrado" trata "não existe" e "não é meu" de forma idêntica, sem
  a UI tentar distinguir os dois casos (evitar enumeração de IDs de outros
  usuários).

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Veículo selecionado (marca, modelo, ano, status, foto, km) | Já buscado pela Fase 2 (`useVehicles`) | Sim | Nenhuma query nova — filtra a lista já cacheada pelo `vehicleId` da URL |
| Total investido | View `vehicle_financial_summary`, já consumida pela Fase 2 | Não (pode ser `null`) | Mesmo campo do card da garagem |
| Lista de veículos do usuário (para o seletor) | `useVehicles` | Sim | Mesma query, mesmo cache |

Nenhuma tabela, view ou coluna nova é lida nesta fase.

## 8. Estados e transições

Não há entidade com ciclo de vida próprio nesta fase. O único "estado" é a
rota atual (`/`, `/v/:id`, `/v/:id` inválido, `/configuracoes`), que não é
persistido — é sempre derivado da URL.

## 9. Erros e casos de borda

- `vehicleId` inexistente ou de outro usuário → tela "veículo não
  encontrado" (AC-3), nunca crash nem tela branca.
- Usuário com um único veículo → seletor não lista alternativa (AC-8).
- Usuário sem nenhum veículo tentando acessar `/v/:id` diretamente → mesmo
  tratamento do caso "não encontrado" (não existe id de veículo nenhum para
  esse usuário).
- Falha de rede ao buscar a lista de veículos dentro de `/v/:id` → reaproveita
  o mesmo estado de erro com "tentar de novo" já usado em `VehicleListPage`
  (não é um estado novo, é o mesmo hook).
- Clique em item desabilitado → não navega, não lança erro, não há
  feedback sonoro/visual além do cursor `not-allowed` e do rótulo "Em breve".

## 10. Requisitos não-funcionais

- Sidebar (desktop) e bottom nav (mobile) presentes em toda tela
  autenticada, incluindo `/` e `/configuracoes` — não só dentro de
  `/v/:id`.
- 320px sem overflow horizontal; alvo de toque ≥44px inclusive nos itens
  desabilitados (AC-10).
- Navegação por teclado e foco visível em todo item, habilitado ou não
  (AC-9).
- Transição de abertura/fechamento da folha "Adicionar" ≤200ms (regra geral
  do projeto, seção 7 do doc mestre).
- Contraste AA para o rótulo "Em breve" e para o estado desabilitado, nos
  dois temas.

## 11. Dependências e riscos

- Depende de `useVehicles` (Fase 2) continuar sendo a fonte de verdade da
  lista/foto/resumo — nenhuma mudança de contrato nele além de, se
  necessário, expor um jeito de buscar um item por id (client-side, sem
  nova query).
- Risco: a sidebar com 8 de 10 itens desabilitados pode parecer "quebrada"
  visualmente se o estado desabilitado não for claramente diferente do
  habilitado. Mitigação: opacidade reduzida + cursor `not-allowed` + rótulo
  textual "Em breve" (nunca só cor, por causa de daltonismo).
- Risco: nenhuma sheet/bottom-sheet existe no projeto ainda. Mitigação: a
  Fase usa o primitivo `Dialog` (Radix) já instalado, com posicionamento na
  base da tela — sem nova dependência.

## 12. Perguntas abertas

Nenhuma. As duas ambiguidades de produto (tratamento de item de nav ainda
não construído; conteúdo do índice de `/v/:vehicleId`) foram resolvidas no
clarify desta fase: itens desabilitados com "Em breve"; índice mostra
resumo mínimo com dado real já disponível.
