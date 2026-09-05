# DESIGN.md — Identidade visual do Slow Garage

## Revisão de identidade (pós-Fase 10)

A identidade original da Fase 0 ("Slow Car Club": dourado clássico sobre
preto quente, lettering cursivo estilo graffiti) foi **substituída** depois
do usuário ver o produto construído e reagir: não reconhecia nada de
"gearhead" nele, achou genérico, e apontou um bug real de UX no caminho
(sidebar repetindo "Selecione um veículo" 8 vezes — corrigido junto, ver
`docs/DECISIONS.md`).

O que muda: paleta, tipografia hero e os hex compostos nos ícones/manifest.
O que **não** muda: a logo (`5348.png`) em si, a estrutura de tokens
(`src/styles/tokens.css` continua sendo a única fonte de cor), e toda
decisão de densidade das seções abaixo — essas continuam válidas fase a
fase, independente de paleta.

Achado ao revisar a logo de perto pra fazer essa mudança: `5348.png` já
era, desde a Fase 0, um adesivo de carro de rua japonês genuíno — "SLOW"
em lettering de decalque desgastado, katakana "カークラブ" (car club),
bandeira quadriculada, brilho. A Fase 0 tinha o adesivo certo e vestiu ele
com a paleta errada (dourado clássico americano em vez do próprio idioma
visual que o adesivo já falava). Esta revisão realinha a paleta com o que
a logo sempre foi.

**Referência**: JDM/tuner noturno — rolê de madrugada, luz de painel,
carbono, escapamento solto. Decidido com o usuário entre 4 referências
(subúrbio rebaixado, hot-rod americano, JDM noturno, oficina utilitária
raiz); dentro de JDM, o acento foi escolhido entre 4 cores pra evitar cair
no default de IA mais comum hoje (preto + ciano/azul saturado) — o usuário
escolheu **âmbar de luz de sódio de rodovia** em vez de azul/roxo elétrico,
exatamente pra fugir desse default.

## Tokens de cor

Definidos em `src/styles/tokens.css`. Dark é o padrão pra quem nunca
escolheu nada — Configurações oferece Claro/Escuro/Seguir o sistema
(Fase 14k, ver ADR-058; revoga o "não segue `prefers-color-scheme`"
que valia até então). A classe `.light` no elemento raiz troca
a paleta inteira via CSS variables; nenhum componente decide cor sozinho.
Todo par texto/fundo abaixo foi validado por cálculo de contraste WCAG
(4.5:1 texto normal), incluindo contra o próprio fundo tintado a 10% usado
em badge — mesma rigor da correção de acessibilidade da Fase 10, aplicado
já na escolha, não depois.

### Dark (padrão)

| Token | Valor | Papel |
|---|---|---|
| `--color-bg` | `#121316` | Fundo — asfalto à noite, neutro-frio sem cair no azul-marinho genérico |
| `--color-surface` | `#1B1D21` | Superfície elevada (card, modal) |
| `--color-border` | `#2E3136` | Borda, divisor |
| `--color-text-primary` | `#EDEAE3` | Texto principal — branco-osso de farol, não branco puro |
| `--color-text-secondary` | `#8D8F93` | Texto de apoio — cinza de painel |
| `--color-accent` | `#FF8A1E` | Âmbar — luz de sódio de poste de rodovia à noite. Único acento de marca |
| `--color-accent-foreground` | `#121316` | Texto sobre superfície `accent` |
| `--color-success` | `#5FAE6B` | Sucesso |
| `--color-error` | `#EA665A` | Erro — lanterna de freio |
| `--color-warning` | `#E0B238` | Alerta — amarelo de luz de painel, distinto do âmbar de marca |

### Light

| Token | Valor |
|---|---|
| `--color-bg` | `#EDEBE6` — concreto de garagem sob luz de dia |
| `--color-surface` | `#F5F3EF` |
| `--color-border` | `#D3D0C8` |
| `--color-text-primary` | `#17181B` |
| `--color-text-secondary` | `#5B5D61` |
| `--color-accent` | `#974D00` (escurecido do dark para manter contraste AA em fundo claro) |
| `--color-accent-foreground` | `#FBF9F5` |
| `--color-success` | `#386B41` |
| `--color-error` | `#AA372A` |
| `--color-warning` | `#7C5B10` |

## Tipografia

Dois papéis deliberadamente separados — a energia da logo não pode
atrapalhar a leitura de número e data repetidos cem vezes por semana.

| Papel | Fonte | Uso |
|---|---|---|
| Hero | **Rajdhani**, peso 700 (OFL, self-hosted via `@fontsource`) | Só no wordmark de login/cadastro (`AuthLayout`) — condensada, geométrica, maiúscula com tracking largo, mais "decalque de painel" que a cursiva anterior. Sem competir com o corpo do produto |
| Corpo / dado | **Space Grotesk** (OFL, self-hosted) | Todo o resto: shell, formulário, lista, número. Numerais tabulares para alinhamento de coluna |
| Marca (katakana) | **Noto Sans JP** — **adiada**, ver "O que foi recusado" | Pequena etiqueta de marca perto do nome do app, além da logo estática (decisão do clarify da Fase 0, ainda não revisitada) |
| Número de medição (Fase 12) | **JetBrains Mono**, peso 400 (OFL, self-hosted via `@fontsource`) | Só os "hero numbers" de card de resumo — km/R$/L/km-por-L em `FinancialSummaryCard`, `FuelSummarySection`, `FuelSummaryCard`, e o odômetro no cabeçalho da `VehiclePage`. Nunca em lista comum (gasto, abastecimento, `VehicleCard` da garagem), data ou contagem — decisão fechada em clarify, ver `specs/012-mono-numeric/spec.md` |

## Densidade

Convenção usando a escala padrão do Tailwind (já apoiada em `--spacing`,
portanto já é CSS variable):

- Alvo de toque mínimo: `h-11`/`w-11` (44px) — botão, campo de input, e o
  rótulo que envolve o toggle de tema
- Cabeçalho/barra: `px-4 py-3`
- Conteúdo de tela: `p-6` como ponto de partida
- Formulário (Fase 1 em diante): campos empilhados com `gap-4`, label e
  campo com `gap-1.5`, mensagem de erro logo abaixo do campo que ela
  descreve — nunca um bloco de erro genérico separado do campo
- Card de formulário de auth (`AuthLayout`): `max-w-sm`, `p-6`, `rounded-lg`,
  centralizado vertical e horizontalmente
- Card de item de lista (Fase 2 em diante): foto/placeholder `h-40`,
  corpo `p-4`, grid de dados `gap-2`, ações (editar/excluir) alinhadas à
  direita no rodapé do card
- Par de campo lado a lado no formulário (marca/modelo, ano/km etc.):
  empilha em coluna única abaixo de `sm` (640px) — testado e corrigido
  na Fase 2, texto de `<select>` truncava ("Selecior" em vez de
  "Selecione") em 320px com duas colunas
- Diálogo (`Dialog`/`AlertDialog`): `max-w-md`/`max-w-sm`, `max-h-[85vh]`
  com `overflow-y-auto` — formulário mais longo que a tela rola dentro
  do diálogo, nunca estoura pra fora
- Sidebar desktop (Fase 3): `w-56`, item `px-3 py-2`, ícone `h-4 w-4`,
  visível só a partir de `lg` (1024px)
- Bottom nav mobile (Fase 3): fixa na base, item `min-h-[44px] flex-1`,
  ícone `h-5 w-5`, rótulo `text-[10px]` com `truncate` (ver ADR-023),
  botão "Adicionar" central destacado (`h-14 w-14`, círculo `bg-accent`,
  elevado com `-translate-y-3` acima da linha dos outros itens);
  some a partir de `lg`
- Folha "Adicionar" (Fase 3): ancorada na base (`inset-x-0 bottom-0`),
  cantos superiores arredondados, grid `grid-cols-3` de itens
  `min-h-[64px]`, mesmo `max-h-[85vh] overflow-y-auto` de qualquer
  diálogo do projeto
- Item de navegação sem tela construída ainda ("Em breve" — ver
  ADR-022): opacidade reduzida, `cursor-not-allowed`, rótulo textual
  sempre visível (nunca só cor) — continua focável por Tab
  (`aria-disabled`, nunca `disabled` nativo). "Selecione um veículo"
  (ADR-024) usa o mesmo tratamento visual, só troca o texto
- Linha de lista de gasto (Fase 4): ícone de categoria + descrição/
  metadado à esquerda (`min-w-0`, trunca a descrição numa linha),
  valor + ações à direita (`shrink-0`); indicador de anexo (clipe +
  nome do arquivo) como terceira linha discreta quando existe
- Filtro (categoria + período): mesmo par `grid-cols-1 sm:grid-cols-2`
  do `VehicleForm` (ADR-019) — o mesmo risco de truncar em 320px já
  vale pra qualquer par de `<select>` lado a lado
- Cabeçalho de tela com título+ação (Fase 4, `ExpensesPage`): empilha
  em coluna abaixo de `sm`, vira linha com `justify-between` a partir
  daí — o botão de ação (`whitespace-nowrap` por padrão em todo
  `Button`) ao lado de um título de duas linhas é exatamente o tipo de
  par que estoura 320px se ficar sempre em linha (ver ADR-025)
- Resumo de consumo (Fase 5, `FuelSummaryCard`): `dl` com
  `grid-cols-2 sm:grid-cols-4`, mesmos tokens de card
  (`rounded-lg border border-border bg-surface p-4`) do resumo de
  km/total investido já usado em `VehiclePage`. Só renderiza quando há
  pelo menos 1 abastecimento — nunca mostra 4 traços de uma vez
- Toggle "Tanque cheio"/"Perdi o abastecimento anterior" (Fase 5):
  `<Switch>` envolvido num `<label>` nativo com o texto como `<span>`
  antes do controle — mesmo padrão do `ThemeToggle`, agora com o
  componente `Switch` reconhecido de verdade pelo lint (ADR-028), não
  só "passando" por acidente de estrutura
- Linha de lista de abastecimento (Fase 5): data + litros na primeira
  linha, valor (+posto, +aviso de tanque não cheio) na segunda, km/L e
  custo/km na terceira — cada métrica mostra "—" quando a view não tem
  confiança, nunca um valor estimado (ver ADR-030 sobre o que fica nulo
  em cada caso)
- Banner de alerta (Fase 6, `AlertBanner`): um bloco por alerta,
  `border`/`bg`/`text` na cor de severidade com opacidade reduzida
  (`border-error/40 bg-error/10 text-error` pro crítico,
  equivalente com `warning` pro aviso) — nunca só ícone ou só cor,
  sempre com `title` da própria view como texto
- Badge de status de manutenção (Fase 6, `MaintenanceItemCard`):
  mesmo padrão de badge com borda + texto (nunca só cor) já usado no
  status do veículo (Fase 2) — vencido/próximo/em dia/planejado cada
  um com sua cor (error/warning/success/neutro) e o texto sempre
  presente
- Duas ações de criação na mesma tela (Fase 6, `MaintenancePage`):
  "Novo item do plano" (`ghost`, ação secundária) e "Registrar
  execução" (`primary`, ação mais repetida) lado a lado no cabeçalho,
  empilhando em coluna abaixo de `sm` — mesma lição do ADR-025
  aplicada preventivamente aqui (dois botões de texto variável cabendo
  em 320px)
- Progresso de projeto (Fase 7, `ProjectProgress`): `dl` de 2 colunas,
  mesmo cartão `rounded-lg border border-border bg-surface p-4` do
  resumo de consumo (Fase 5) — "Itens concluídos" e "Orçamento usado"
  mostram "—" quando a view não tem dado (projeto sem item, ou sem
  orçamento), nunca "0%" (RN-1)
- Badge de status de problema (Fase 7, `IssueListItem`): mesmo padrão
  borda+texto de sempre; os 4 estados "em aberto" (aberto/investigando/
  aguardando peça/em reparo) compartilham a cor de aviso — a
  distinção entre eles é só o texto, não uma cor por estado, porque
  todos têm a mesma urgência visual (precisam de atenção); resolvido
  usa a cor de sucesso, descartado fica neutro
- Card de projeto navegável (Fase 7, `ProjectCard`): mesmo padrão do
  `VehicleCard`/`ProjectCard`-like da Fase 2 — foto/conteúdo dentro de
  um `Link`, botões de editar/excluir fora dele, nunca aninhando
  interativo dentro de interativo
- Seletor de "Projeto" sempre visível no formulário de item, mesmo
  quando só há uma opção fixa (Fase 7, `ProjectItemForm`) — reaproveita
  o padrão do seletor de veículo único da `VehiclePage` (Fase 3):
  `<select disabled>` com uma opção em vez de esconder o campo
- Abas internas da página "Documentos" (Fase 8, `DocumentsPage`):
  `role="tablist"` com `overflow-x-auto`, `px-2 py-2 text-sm`, indicador
  `border-b-2` na cor de destaque só na aba ativa. Em 320/390px as 4
  abas não cabem inteiras — a última visível fica parcialmente cortada
  de propósito (affordance de "tem mais pra rolar"), ajustado depois de
  uma primeira verificação mostrar a aba "Fotos" 100% invisível em
  390px sem nenhum indício de que existia (ver ADR-037)
- Selo de vencimento (Fase 8, `DocumentListItem`/`ObligationListItem`):
  mesmo padrão borda+texto sempre visível de todo badge de status do
  projeto — "Vencido em"/"Vence em" em `text-error` só quando já
  passou, `text-text-secondary` caso contrário; nunca cor sozinha
- Card de financiamento (Fase 8, `FinancingCard`): `dl` de 2 colunas
  com os mesmos tokens de card das Fases 5/7, `installments_remaining`/
  `outstanding_balance` sempre com "—" quando `null` (nunca "0" ou
  "R$ NaN") — mesma disciplina de "não estimar o que a view não
  calculou" desde a Fase 5
- Galeria de fotos (Fase 8, `PhotoGallery`): grid `grid-cols-2
  sm:grid-cols-3 lg:grid-cols-4`, thumbnail `aspect-square
  object-cover`; filtro de categoria é a mesma fileira horizontal
  rolável (com o mesmo corte parcial de affordance) da aba de
  Documentos, reaproveitando o padrão em vez de inventar um segundo
- Gráfico de coluna (Fase 9, `ExpensesByMonthChart`): barra `w-8`,
  `rounded-t-[4px]`, hue único `bg-accent`, altura proporcional ao
  máximo da série (mínimo 4% pra nunca sumir num valor pequeno), valor
  rotulado acima da barra, mês abaixo — sem eixo Y, porque todo ponto
  já está rotulado
- Gráfico de barra horizontal categórica (Fase 9,
  `ExpensesByCategoryChart`): track `h-3 rounded-full bg-bg`, barra
  preenchida na cor do slot categórico (`--chart-series-1`..`8` em
  `tokens.css`, validados pela skill `dataviz` — ver ADR-039), nome da
  categoria + valor sempre em texto ao lado (nunca só a cor
  identificando), além do 8º slot dobra em "Outras" (cor neutra
  `text-secondary`)
- Card de item da timeline (Fase 9, `TimelineItem`): ícone do tipo à
  esquerda (`h-5 w-5 text-secondary`), título + rótulo de tipo na
  mesma linha, data/km na linha seguinte, descrição truncada em 2
  linhas (`line-clamp-2`); valor (quando existe) e ação (editar/excluir
  pra nota, "Ver" pra tudo mais) alinhados à direita — mesmo esqueleto
  visual de todo card de lista do projeto desde a Fase 2
- Busca embutida (Fase 9, `TimelinePage`): campo único com ícone de
  lupa à esquerda e "limpar" à direita quando há texto; enquanto ativa,
  substitui a lista inteira (filtro incluso) em vez de conviver ao lado
  — evita a pergunta "o resultado já está filtrado ou não?"
- Rótulo de campo opcional (Fase 11, `schema-freedom`): sufixo textual
  `"(opcional)"` direto no `<Label>` (ex.: "Ano (opcional)",
  "Vencimento (opcional)") — continua sendo o único sinalizador de
  opcionalidade do app (nenhum formulário usa `required` nativo nem
  asterisco, convenção desde a Fase 2); a diferença desta fase é
  aplicar o mesmo texto, já usado isoladamente em 2 campos antes, de
  forma sistemática em todo campo que deixou de ser obrigatório
- `<select>` com opção "nada selecionado" reselecionável (Fase 11,
  `ExpenseForm`): quando o valor vazio é um estado final válido (ex.:
  gasto sem categoria), a opção correspondente do `<select>` fica
  **habilitada** e com rótulo explícito ("Sem categoria" em vez de um
  placeholder tipo "Selecione") — diferente do padrão de campo com
  *default* no banco (combustível, câmbio, tipo de documento), onde a
  opção vazia pode continuar `disabled` porque o campo nunca fica
  genuinamente vazio pro usuário
- Número de medição em card de resumo (Fase 12): `font-mono`
  (JetBrains Mono) só nos 4 pontos listados na tabela de Tipografia
  acima — troca só a família, nunca peso/cor/tamanho (RN-1 da spec).
  Lista comum (linha de gasto, abastecimento, `VehicleCard`) continua
  em Space Grotesk de propósito, pra não fragmentar a leitura
- Home do veículo como hub (Fase 13, `VehiclePage`): faixa de 4 métricas
  (`VehicleMetricsRow` — km atual/custo-km/total-investido em
  `font-mono`, alertas ativos em Space Grotesk por ser contagem, não
  medição) e faixa de 4 ações rápidas (`QuickActionsRow` — gasto,
  abastecimento, manutenção, foto, cada botão abrindo o `Create*Dialog`
  já existente direto por cima da própria `VehiclePage`, sem navegar),
  as duas em `grid-cols-2 sm:grid-cols-4`. Logo abaixo, timeline recente
  (5 itens, reaproveitando `TimelineItem`) lado a lado com o bloco de
  pendências (mesmo `AlertBanner` de sempre, só reposicionado). O
  resumo detalhado que já existia (`FinancialSummaryCard` sem
  duplicar total investido/custo-km, `FuelSummarySection`,
  `ActivityCountTiles`, gráficos) continua abaixo, sem mudança de
  conteúdo — só de posição relativa
- Navegação sem item desabilitado (Fase 14): item de sidebar/bottom-nav
  que depende de veículo só aparece na lista quando há um selecionado —
  não mostra mais cinza com "Selecione um veículo" (ver ADR-049,
  supera ADR-024). O FAB "Adicionar" continua sempre visível (ponto de
  referência espacial fixo), só fica `aria-disabled` sem veículo
- Breadcrumb temático (Fase 14, `Breadcrumb`): em `VehiclePage` e toda
  subtela de veículo (Gastos, Abastecimentos, Manutenção, Problemas,
  Projetos, detalhe de Projeto, Histórico, Documentos) — "Garagem" ›
  nome do veículo › seção atual (ou só "Garagem › nome do veículo" na
  própria `VehiclePage`, já que ela é a raiz), separador `h-3 w-px
  bg-accent/60` (linha fina âmbar, nunca `/`/`›` genérico). Cada
  segmento exceto o último é link; o último (página atual) tem
  `aria-current="page"`. Decisão original da Fase 14 (excluir
  `VehiclePage`, por já ter o seletor de veículo) revertida na Fase 14b
  a pedido do usuário — o breadcrumb reforça que sidebar/dashboard
  concordam sobre "dentro de qual veículo você está"
- `VehicleMetricsRow` revisado (Fase 14): odômetro vira o
  elemento-assinatura da home do veículo — mostrador de arco SVG (270°,
  igual um painel de carro), preenchendo o progresso até o próximo
  múltiplo de 10.000km (ver ADR-050 — não existe teto de vida útil real
  pra usar como 100%). Custo/km e total investido continuam número
  calmo em `font-mono`; total investido ganha um sparkline real dos
  últimos 6 meses de `expenses_by_month` (sem fabricar tendência onde
  não existe dado — custo/km não ganhou sparkline por isso). Alertas
  ativos vira ponto (pulsa só se > 0) + número, nunca só cor
- Marca no cabeçalho (Fase 14, `AppShell`): ícone (`public/icons/icon-192.png`,
  já gerado a partir de `5348.png`) ao lado do texto "Slow Garage" — antes
  era só texto cinza, sem nenhuma presença de marca fora de `/entrar`.
  Card de veículo (`VehicleCard`, garagem): placeholder sem foto troca
  `bg-bg` neutro por `bg-accent/5` (tom âmbar bem sutil, sem virar
  gradiente decorativo); badge de status vira "plaquinha" (`rounded-sm`,
  maiúsculo, `tracking-wide`) em vez da pílula genérica de admin — só
  "Ativo" ganha tom âmbar (`border-accent/40 bg-accent/10 text-accent`),
  os outros 3 status continuam neutros. `SettingsPage`: os dois campos
  (e-mail, nome de exibição) ganham a mesma casca `rounded-lg border
  border-border bg-surface p-4` de todo card do app — não tinha nenhuma
  antes, ficava um formulário solto na tela
- Sidebar agrupada por nível, não mais uma lista plana (Fase 14b): o
  usuário apontou que "Minha garagem" (nível conta, lista de veículos)
  não fazia sentido misturada com "Gastos"/"Manutenção" etc. (nível
  veículo específico) no mesmo grupo visual. Reestruturado em 3 blocos:
  item de conta no topo (`Minha garagem`), seção do veículo atual
  logo abaixo de um divisor com o **nome do veículo** como rótulo
  (`text-xs uppercase tracking-wide`, só aparece com veículo
  selecionado), e `Configurações` fixo no rodapé (`mt-auto`) — mesmo
  padrão de app com conta+contexto+config separados, não uma pilha
  única de link
- "Minha Garagem" vira lista de baias de oficina, não grid de card de
  admin (Fase 14c, `VehicleCard`/`VehicleListPage`): o usuário rejeitou
  a estrutura em si ("card empilhado" — o padrão mais genérico de
  admin/CRM que existe), não só a cor. Trocado `grid-cols-1 sm:grid-cols-2
  lg:grid-cols-3` por lista de linhas largas (`flex flex-col`), cada
  veículo como uma "baia": número da vaga (`01`, `02`... `font-mono`
  `text-accent`, canto da foto — não é dado do banco, é posição na
  lista) + foto em faixa lateral (`sm:w-56`, empilha acima da info em
  telas estreitas) + ficha técnica de 4 colunas (Km, Custo/km, Total
  investido, Combustível — dobro da informação de antes, que só tinha
  2) em vez de só um `<dl>` de 2 campos soltos. Badge de status
  continua a "plaquinha" da Fase 14. Mesma disciplina de sempre: mais
  densidade de dado real, nenhuma decoração nova sem função
- `GarageSummary` — resumo de todos os veículos juntos (Fase 14d,
  `VehicleListPage`): usuário pediu ver informação agregada (ex.:
  "quanto já gastei de upgrade em todos os carros"). Card de referência
  (mesma casca `rounded-lg border border-border bg-surface p-4`, sem
  hover — não é métrica "viva" como `VehicleMetricsRow`) com os 5
  totais em `font-mono` (mesma regra de hero number monetário da Fase
  12) e os 2 gráficos já existentes (`ExpensesByMonthChart`/
  `ExpensesByCategoryChart`), agora com dado somado de todos os
  veículos em vez de um só. Só aparece com 2+ veículos (ver ADR-051)
- `VehicleCard` ganha placa e ficha técnica (Fase 14e): placa
  (`vehicle.plate`) vira tag mono ao lado do nome, só quando cadastrada;
  chips de `engine_description`/`transmission`/`horsepower` abaixo do
  nome, só os que têm valor (mesmo princípio de "sem dado suficiente"
  da Fase 11 — nunca mostrar chip vazio). Número da baia ganha a mesma
  casca "plaquinha" do badge de status em vez de texto solto no canto.
  Zebra decorativa no slot da foto e ações rápidas duplicadas por linha
  foram avaliadas e recusadas (ver ADR-052) — a primeira violaria "gaste
  a ousadia em um lugar", a segunda duplicaria a própria `VehiclePage`
- Ações rápidas por linha e atividade agregada, revertendo parte do
  ADR-052 (Fase 14f, `VehicleQuickActions`/`GarageActivityFeed`): com
  poucos veículos a objeção de "mini-dashboard" não se sustenta, e a
  página realmente morria depois do card. `VehicleQuickActions` é 4
  ícones (`size="icon"`, 44px) numa faixa `border-t` no rodapé do card,
  fora do `<Link>` da linha — só ícone, sem rótulo, pra não competir
  com o grid 2x2 rotulado da `VehiclePage`. `GarageActivityFeed`
  reaproveita o `TimelineItem` já existente, alimentado por
  `useGarageTimeline` (mesmo padrão do ADR-051, sem RPC nova); aparece
  com 1 veículo também, diferente do `GarageSummary` (ver ADR-053)
- Aba "Mais" na bottom nav (Fase 14g/h, `BottomNav`/`MoreSheet`): as 4
  abas fixas de então (Home/Carros/Dados/Configurações) nunca cobriram
  as 9 seções que a sidebar de desktop mostra — bug de paridade mobile,
  achado pelo usuário. Abre folha com as seções que faltavam (Gastos,
  Abastecimentos, Manutenção, Problemas, Projetos, Documentos), ícone
  `LayoutGrid`. Só aparece com veículo selecionado, mesma regra de item
  vehicle-scoped da Fase 14 (ADR-049). `NavSheet` novo extrai a base
  comum do Radix `Dialog`-na-base que o FAB "Adicionar" já usava —
  `AddActionSheet` e a nova `MoreSheet` viram wrappers finos (ver
  ADR-054). Fase 14h corrigiu 2 problemas reais que só apareceram
  testando: 5 abas + FAB cortava rótulo ("Configuraç…") num telefone
  estreito — "Histórico" saiu da lista fixa e entrou na folha "Mais"
  também, voltando a 4 abas (Dashboard, Carros, Mais, Configurações) +
  FAB; e a aba do painel de 1 veículo, antes chamada "Home", virou
  "Dashboard" (mesmo rótulo/ícone da sidebar) — "home" do app é a
  garagem ("Carros"), não o painel de um veículo (ver ADR-055)
- Configurações deixa de ser genérica (Fase 14k/l): 3 seções em card
  (Conta, Aparência, Segurança — `SettingsSection`) em vez de um card
  solto só com e-mail/nome. Aparência ganha as 3 opções de tema
  (Claro/Escuro/Seguir o sistema, reverte o "não segue
  `prefers-color-scheme`" — ver ADR-058); Segurança ganha alterar senha
  reaproveitando o mesmo fluxo da recuperação por e-mail (ver ADR-057).
  Layout vira `grid grid-cols-1 lg:grid-cols-2` (mesmo padrão de toda
  outra tela) em vez de `mx-auto max-w-md` — a faixa estreita e
  centralizada parecia mobile mesmo em tela larga. Ganhou link "Voltar"
  (`navigate(-1)`, volta pro histórico real, não pra uma rota fixa) —
  antes, sair de Configurações forçava renavegar do zero pela
  sidebar/bottom nav (ver ADR-059). Logo/nome do cabeçalho (`AppShell`)
  também virou link pra home — não tinha nenhum antes

## Sistema de resposta (motion)

Decidido no mesmo processo da Fase 14 (skill `frontend-design`, depois
do usuário achar o produto "sem interatividade"). Regra geral: a
resposta confirma que o app "sentiu" a ação — nunca celebra, nunca roda
sozinha sem gatilho do usuário ou sem um dado real ter mudado. Tudo
condicionado a `motion-safe:` (Tailwind mapeia pra
`prefers-reduced-motion: no-preference`) — sem `prefers-reduced-motion`,
todo estado final aparece direto, sem transição.

| Gatilho | Comportamento | Token |
|---|---|---|
| Número muda de valor (km, custo/km, total investido) | Realce de fundo âmbar a 18%, esvaindo | `--animate-value-flash` (`value-flash`, 400ms), hook `useFlashOnChange` |
| Alerta novo aparece (`AlertBanner`) | Entra com slide-down (6px) + fade | `--animate-alert-in` (`alert-in`, 200ms) |
| Qualquer `Button` pressionado | `scale-95` no `:active` — botão físico de painel cedendo ao toque, não hover de link | `motion-safe:active:scale-95` na própria `buttonVariants` |
| Card "vivo" (métrica que muda) vs. card "de referência" (financeiro detalhado, combustível, gráfico) | Só o vivo tem `hover:shadow-md` — hover em tudo é o sintoma clássico de kit de card SaaS genérico | `transition-shadow duration-150` só em `VehicleMetricsRow` |

## Hierarquia

Número importante ganha peso e tamanho, não cor — o âmbar fica reservado
para ação primária, foco e estado ativo, nunca para destacar um valor no
meio de uma lista. Texto secundário (`text-secondary`) carrega metadado
sem competir com o dado principal.

## Onde a ousadia mora

O elemento assinatura é o wordmark de login/cadastro: Rajdhani 700
maiúsculo, tracking largo, com um traço âmbar fino embaixo (a única linha
colorida decorativa do produto inteiro — tudo o mais usa cor só com
função). Todo o resto — cromo do shell, botão, campo — usa Space Grotesk
e é deliberadamente quieto. Regra de interação: confirma, nunca celebra
(nenhuma animação de comemoração; o brilho da logo é um elemento estático
de marca, não uma animação de sucesso).

`/entrar` e `/cadastro` continuam os dois únicos pontos hero implementados
(`AuthLayout` não usa o `AppShell`, de propósito, pra não competir com o
wordmark). Card do formulário em `surface`, sem sombra — só borda de 1px,
mantendo o fundo escuro como protagonista atrás do wordmark.

**Segundo ponto de ousadia, deliberadamente isolado (Fase 14):** o
mostrador de odômetro (arco SVG) na home do veículo. Não conflita com a
regra "gaste a ousadia em um lugar" porque vive numa zona completamente
diferente do wordmark (app autenticado vs. tela de login) — dentro da
própria `VehiclePage`, é o único elemento gráfico "de painel"; todo
resto da tela (tiles calmos, cards de referência) continua quieto ao
redor dele, mesma disciplina do wordmark em `/entrar`.

## Ícones do PWA

Gerados por `scripts/generate-icons.mjs` a partir de `5348.png`, compostos
sobre `#121316`. Em tamanho grande (192px+) a logo é legível por inteiro;
em favicon (32px) só a forma geral do adesivo é reconhecível, o lettering
não — comportamento esperado para qualquer logo detalhada nesse tamanho,
não é um defeito a corrigir agora.

## O que foi recusado, com o motivo

- **Dourado clássico / hot-rod americano (paleta original da Fase 0)** —
  o usuário viu o produto construído e não reconheceu "gearhead" nele;
  pediu explicitamente mais JDM/subúrbio, menos clássico americano.
  Substituído pela paleta âmbar/asfalto desta revisão. Mantido aqui como
  registro: a lição não é "dourado é ruim", é "decisão visual valida
  contra reação real ao produto construído, não só contra o briefing
  escrito" — o briefing da Fase 0 já falava em adesivo japonês e mesmo
  assim a paleta escolhida foi americana.
- **Azul/roxo elétrico como acento JDM** — cotado explicitamente e
  descartado: é o par preto+ciano/azul saturado, o default mais comum de
  interface gerada por IA hoje, mesmo dentro de uma referência JDM
  genuína. Âmbar de luz de sódio entrega a mesma "noite de rolê" sem cair
  nesse padrão.
- **Vermelho como acento principal** — puxaria energia de alerta/perigo
  pra ação primária cotidiana (registrar gasto, salvar formulário).
  Vermelho fica reservado pra semântica de erro.
- **Rajdhani (ou qualquer fonte condensada) fora do wordmark de login** —
  ilegível em densidade de lista/formulário, mesmo motivo que já valia
  pra Permanent Marker antes dela. Continua restrita a um único ponto.
- **`tailwind.config.ts` (Tailwind v3)** — o plano original previa v3. A
  versão estável no momento da implementação é a v4, que dispensa config
  JS e define tokens direto em CSS via `@theme` — ajuste de "como", não de
  decisão visual. Ver ADR em `docs/DECISIONS.md`.
- **Carregar `@fontsource/noto-sans-jp` (subset japanese) globalmente** —
  mesmo só o subset japonês do peso 400 pesa ~1MB (a fonte cobre milhares
  de kanji; não há subset "só katakana" pronto no pacote). Adiado para a
  fase que efetivamente construir o ponto de marca com katakana (provável
  Fase 1, splash/login): ali a decisão é entre subsetting manual dos ~5
  glifos necessários (ガレージ), carregamento tardio (só quando a tela hero
  monta) ou reaproveitar a própria imagem da logo em vez de texto vivo. O
  token `--font-jp` já existe em `tokens.css`, mas sem fonte carregada —
  cai no fallback de `--font-sans` até essa decisão.
- **Teto arbitrário no mostrador de odômetro (ex.: "300.000km = 100%")**
  — inventaria um dado que não existe (não há coluna nem consenso de
  "vida útil máxima" de um carro). Trocado por progresso até o próximo
  múltiplo de 10.000km, que só usa o valor real (ADR-050).
  Sparkline/tendência de "Custo/km" — mesmo motivo: não existe histórico
  dessa métrica no banco, só de gasto mensal (usado em "Total
  investido").
  Ver `docs/DECISIONS.md` (ADR-050).
- **Biblioteca de animação (framer-motion, auto-animate) pro sistema de
  resposta da Fase 14** — os 4 comportamentos (realce, entrada de
  alerta, `:active` de botão, hover diferenciado) são só CSS
  (`@keyframes`/`transition`/`:active`) + 1 hook de ~15 linhas
  (`useFlashOnChange`) — mesma lógica de "escrito à mão quando o caso é
  simples o bastante" de todo componente anterior do projeto.
- **Som, haptic feedback, ou animação de celebração (confete etc.) no
  sistema de resposta** — contradiz a regra já estabelecida desde o
  wordmark de login: "confirma, nunca celebra".
- **Item de navegação continuar aparecendo desabilitado sem veículo
  (manter ADR-024 como estava)** — o próprio usuário apontou que virou
  ruído depois que todas as 8 telas de veículo passaram a existir
  (Fase 9+); ver ADR-049 pra decisão completa e por que não é regressão
  do princípio de acessibilidade original.
