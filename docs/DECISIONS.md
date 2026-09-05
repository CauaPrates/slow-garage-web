# DECISIONS.md — ADRs curtos

Registro de decisões técnicas que não estão óbvias só lendo o código.
Cada entrada: contexto, decisão, por quê. Numeradas por ordem cronológica.

## ADR-001 — Tailwind v4 em vez de v3 (CSS-first, sem `tailwind.config.ts`)

O plano da Fase 0 (aprovado em G2) previa `tailwind.config.ts` no estilo
Tailwind v3. Na hora de instalar, a versão estável do registro npm era a
v4.3.3, que descontinuou o config JS em favor de tokens declarados direto
em CSS via `@theme`. Isso serve melhor o requisito de "tokens como CSS
variables consumidas pelo Tailwind" do que a v3 — os valores em
`src/styles/tokens.css` são a única fonte, e o `@theme inline` do Tailwind
só referencia essas variables, sem duplicar valor. Mudança de "como",
sinalizada durante a implementação, não de escopo.

## ADR-002 — `sharp` como devDependency para gerar ícones do PWA

Justificativa de uma linha (dependência nova, fora do stack original):
gerar ícone em 5 tamanhos a partir da mesma logo precisa ser reproduzível
e versionável — editor de imagem manual não é. `sharp` é open-source, sem
custo, e só roda em `scripts/generate-icons.mjs` (não entra no bundle do
app). Reexecutar com `npm run icons` sempre que a logo de origem mudar.

## ADR-003 — `@fontsource/*` em vez de baixar fonte manualmente

Justificativa de uma linha: mesmos arquivos OFL, self-hosted (sem CDN),
com atualização/licença corretas via npm, e permite importar só o subset
de caracteres necessário (ex: `latin-400.css`) em vez do pacote completo.

## ADR-004 — `noto-sans-jp` (subset japanese) carregado, mas não usado ainda

Descoberto durante o build: o subset "japanese" do peso 400 sozinho pesa
~1MB (a fonte cobre milhares de kanji; não existe um subset "só katakana"
pronto no pacote `@fontsource/noto-sans-jp`). Carregar isso globalmente
para renderizar 5 caracteres (ガレージ) contradiz o objetivo de bundle
enxuto. Removido o import global de `globals.css`; a decisão de como
exibir o elemento de marca em katakana (subsetting manual, carregamento
tardio só na tela hero, ou reaproveitar a imagem da logo em vez de texto
vivo) fica para a fase que construir o primeiro ponto hero real (splash ou
login, Fase 1). O token `--font-jp` continua declarado em `tokens.css`
para não perder a decisão, mas cai no fallback de `--font-sans` por ora.

## ADR-005 — Tema em Context + `localStorage` próprios, sem biblioteca

`next-themes` (a opção mais comum) resolve hidratação SSR, que este
projeto não tem (SPA pura no Vite). Um `ThemeContext` em
`src/app/providers.tsx` (~40 linhas) cobre o necessário: ler preferência
salva, aplicar classe `.light` no elemento raiz, persistir escolha. Um
script inline em `index.html` aplica a classe antes do primeiro paint
para não piscar dark→light no recarregamento — essa é a única duplicação
deliberada da lógica de `src/lib/theme.ts` (não dá para importar um
módulo TS num `<script>` inline sem complicar o build).

## ADR-006 — React Router em modo biblioteca (`react-router-dom` v7), não modo framework

`react-router-dom` v7 mantém o modo biblioteca (mesma API de dados router
do v6: `createBrowserRouter` + `RouterProvider`) sem exigir `@react-router/dev`
nem roteamento por arquivo. O modo framework assume uma arquitetura de
app diferente (SSR, loaders/actions no servidor) que este projeto não usa
— é SPA pura com veículo na URL, exatamente o que a Seção 6 do documento
original pede.

## ADR-007 — Componentes `Button` e `Switch` escritos à mão em vez de via CLI do shadcn

`components/ui` é normalmente gerado pelo CLI do shadcn, não editado à
mão. Tentativas de rodar `npx shadcn@latest init` de forma não-interativa
(flags `-y`, `-d`, `--preset`) esbarraram em um erro reproduzível do CLI
("Could not load the workspace config") mesmo com `components.json`
já escrito corretamente — parece bug da versão atual do CLI neste setup,
não um problema de configuração deste projeto. `components.json` foi
mantido (aliases e estilo corretos) para as fases seguintes tentarem o
CLI de novo; se continuar falhando, os componentes seguem escritos à mão
seguindo a mesma convenção (Radix + `class-variance-authority` + `cn()`
de `src/lib/utils.ts`) dos dois componentes desta fase.

## ADR-008 — `main.tsx` importa `Providers`/`router` dinamicamente quando falta configuração do Supabase

`lib/supabase.ts` lança erro na primeira linha se
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` estiverem ausentes. Import
estático é avaliado mesmo no ramo do código que não roda — então, para o
AC-8 (mensagem clara de configuração ausente, nunca tela branca) continuar
valendo à medida que fases futuras importarem `supabase.ts` de dentro da
árvore de rotas, `main.tsx` checa as variáveis de ambiente primeiro e só
importa `Providers`/`router` (via `import()` dinâmico) quando elas
existem; caso contrário importa só `ConfigMissingScreen`.

## ADR-010 — `.select("coluna")` do supabase-js não valida nome de coluna em tempo de compilação

Descoberto testando AC-4 contra o schema real (depois que as credenciais e
`docs/API_CONTRACT.md` chegaram): `supabase.from("vehicles").select("nonexistent_column")`
**não** produz erro de tipo, enquanto `.eq("nonexistent_column", 1)`,
`.insert({ nonexistent_field: 1, ... })` e nome de tabela inválido
(`.from("nonexistent_table")`) todos produzem erro corretamente. A string
de `select()` é uma mini-DSL (suporta embedding de relação, alias,
agregação) que o `@supabase/supabase-js` só valida quando consegue
parsear por completo — o resto degrada pra permissivo em vez de errar.
Não é algo corrigível no nosso código; é limitação da versão atual da
lib. **Toda fase que escrever `.select(...)` precisa saber disso** — não
dá pra confiar só no `tsc` pra pegar typo de coluna dentro do argumento
de select; revisão de código/teste manual continuam necessários ali.
`.eq()`, `.insert()`, `.update()` e nome de tabela continuam cobertos
normalmente.

## ADR-011 — `npm run types` via script Node (`scripts/gen-types.mjs`), não shell direto no `package.json`

A primeira versão do script (`supabase gen types ... --project-id
${SUPABASE_PROJECT_ID:?msg} > arquivo`) usava sintaxe de parâmetro POSIX
(`${VAR:?msg}`), que não existe no `cmd.exe` — o shell que `npm run`
usa por padrão no Windows, independente de qual shell chamou o `npm
run`. O script falhava silenciosamente (virava um dump de `--help` do
CLI). Trocado por `scripts/gen-types.mjs`, que lê `process.env.SUPABASE_PROJECT_ID`
em JS puro e chama `npx supabase gen types` via `spawnSync` — funciona
igual em qualquer shell. Também ganhou o flag `--schema public`, que
uma versão mais nova do CLI do Supabase (2.116.0) passou a exigir.

## ADR-009 — `eslint-plugin-react-hooks` v7: usar `.rules`, não o config pronto, no `eslint.config.js`

O export `configs['recommended-latest']` do plugin declara
`plugins: ['react-hooks']` (array de string), formato que a versão
instalada do ESLint (9.x, flat config) rejeita — espera `plugins` como
objeto. Contornado registrando o plugin manualmente
(`plugins: { "react-hooks": reactHooks }`) e espalhando só
`configs['recommended-latest'].rules`. Sem impacto no conjunto de regras
aplicado, só na forma de declarar.

## ADR-012 — Cadastro com e-mail já existente não revela isso (Fase 1)

Descoberto testando AC-2 contra o Supabase real: `signUp()` com um
e-mail que já existe retorna HTTP 200 com `identities: []` — não um
erro. É proteção anti-enumeração do próprio GoTrue (impede alguém de
descobrir quais e-mails têm conta testando cadastro). A spec original
(AC-2) presumia um erro explícito "e-mail já cadastrado", que este
backend não dá. **Decisão: não contornar isso.** Simular a detecção
olhando `identities: []` reabriria exatamente o furo de enumeração que
o Supabase fechou de propósito. `AC-2` foi reescrito em `spec.md` pra
descrever o comportamento seguro real: mesma tela de "confirme seu
e-mail" para e-mail novo ou já existente, sem duplicar conta e sem
mandar e-mail de verdade pro caso duplicado. Consistente com RN-4/RN-5,
que já pediam o mesmo princípio pro fluxo de recuperação de senha e
login.

## ADR-013 — `GuestRoute` precisa ler o mesmo `?redirect=` que o `SignInForm`

Bug real encontrado no `ui:check`/teste manual: depois de logar vindo
de uma rota protegida (`/configuracoes` → `/entrar?redirect=%2Fconfiguracoes`),
o usuário caía na Home, não em `/configuracoes`. Causa: `SignInForm`
navegava explicitamente pro redirect certo, mas `GuestRoute` (que
envolve `/entrar`) também reage à mesma mudança de status pra
"authenticated" e tinha seu próprio redirect **fixo** pra Home — os
dois competiam pela navegação, e o da `GuestRoute` vencia. Corrigido
extraindo `safeRedirectTarget()` pra `lib/routes.ts` e usando a mesma
função nos dois lugares, garantindo que sempre concordem no destino.

## ADR-014 — Link dentro de frase de texto precisa de sublinhado sempre visível, não só no hover

`ui:check`/axe pegou `link-in-text-block` (serious) em "Não tem conta?
Criar conta" e "Já tem conta? Entrar" — a cor (`text-accent`) sozinha
não é suficiente pra diferenciar link de texto normal (falha pra quem
não distingue cor). Trocado `hover:underline` por `underline` fixo em
todo link inline de auth. Vale como padrão pra qualquer link futuro
dentro de frase corrida (não se aplica a botão nem a link isolado tipo
item de lista).

## ADR-015 — CLI do shadcn (`add`) escreve em `./@/components/...` literal no Windows, não resolve o alias

Extensão do achado do ADR-007 (a Fase 0 já tinha visto `init` falhar).
Nesta fase, `npx shadcn@latest add input label -y` **rodou sem erro**,
mas escreveu os arquivos em `./@/components/ui/*.tsx` (uma pasta
literal chamada `@` na raiz do projeto) em vez de resolver o alias
`@/*` pra `src/*` como `components.json` configura. Os arquivos gerados
também usam a paleta de nomes genérica do shadcn
(`border-input`, `text-foreground`, `bg-input`, variantes `dark:`) que
não existe nos nossos tokens — precisariam ser reescritos de qualquer
forma. Movidos manualmente pra `src/components/ui/`, reescritos com os
nomes de token da Fase 0 (`border-border`, `bg-surface`,
`text-text-primary` etc.), pasta `./@` apagada. `Label` foi
simplificado pra um `<label>` puro (sem `radix-ui`/`@radix-ui/react-label`)
já que não há controle customizado nesta fase que precise do
comportamento de clique especial do primitive.

## ADR-016 — Limite de envio de e-mail do Supabase (sem SMTP customizado) bloqueou parte da verificação

O remetente de e-mail padrão de um projeto Supabase sem SMTP próprio
tem limite de envio bem baixo (a documentação não fixa um número exato,
mas na prática foram poucas chamadas de `signUp`/`resetPasswordForEmail`
em sequência até `429 over_email_send_rate_limit`). Isso bloqueou
testar AC-1 (cadastro com e-mail nunca usado) e AC-6 (login com e-mail
não confirmado) com uma conta 100% fresca nesta sessão de verificação —
ambos foram cobertos por caminho de código equivalente (ver
`verification.md`), não por teste direto de e-mail novo → confirmação →
login. Não é algo que este frontend resolve; ou se espera o limite
resetar, ou configura-se SMTP próprio no projeto (fora do escopo deste
repositório).

## ADR-017 — CRUD de veículo vive em `/` via diálogo, sem rota `/v/:id` ainda

A Fase 2 não introduz `/v/:vehicleId` como rota de verdade. Criar,
editar e excluir veículo acontecem via `Dialog`/`AlertDialog` em cima
da própria "Minha Garagem" (`/`). A rota `/v/:vehicleId` com shell,
sidebar, bottom-nav e header do veículo é entrega explícita da Fase 3
(`003-vehicle-shell`) — construir essa rota agora, sem o resto do
contexto dela, significaria decidir estrutura de navegação pela metade
e refazer na Fase 3. Quando a Fase 3 chegar, o conteúdo de detalhe de
veículo (hoje dentro do `EditVehicleDialog`) pode migrar pra dentro da
rota nova; a lógica de dados (`useVehicles.ts`) já está isolada da UI e
não precisa mudar.

## ADR-018 — `Select`/`Textarea` sobre elemento nativo, sem Radix

Diferente de `Dialog`/`AlertDialog` (onde foco, overlay e Esc justificam
a dependência Radix), `<select>` e `<textarea>` nativos já são
acessíveis por padrão e cobrem o que a Fase 2 precisa (enums fixos:
combustível, câmbio, status; texto livre: notas). Escritos como
wrappers finos com os tokens da Fase 0, sem `@radix-ui/react-select`.
Evita mais uma dependência e mais um componente pra manter sincronizado
com os tokens.

## ADR-019 — Par de campo lado a lado empilha abaixo de `sm` (640px)

Achado no `ui:check` a 320px: dois campos por linha (ex: Combustível +
Câmbio) deixava o `<select>` estreito demais, truncando "Selecione"
pra "Selecior". Trocado `grid-cols-2` fixo por `grid-cols-1 sm:grid-cols-2`
em todo par de campo do `VehicleForm` — abaixo de 640px cada campo
ocupa a largura toda; a partir daí, pareia. Vale como padrão pra
qualquer formulário futuro com campos pareados.

## ADR-020 — `Dialog`/`AlertDialog` sempre com `max-h-[85vh]` + scroll interno

Descoberto ao corrigir o ADR-019: fazer os campos empilharem em coluna
única deixa o formulário mais alto, e nada garantia que ele coubesse em
tela pequena antes disso — o `EditVehicleDialog` já tinha um
`overflow-y-auto` ad-hoc só nele, o `CreateVehicleDialog` não tinha
nenhum. Movido pro componente `DialogContent`/`AlertDialogContent`
compartilhado (`components/ui/dialog.tsx`/`alert-dialog.tsx`), então
todo diálogo futuro já nasce com esse comportamento sem precisar
lembrar de adicionar.

## ADR-021 — Folha "Adicionar" construída sobre `@radix-ui/react-dialog` direto, não via `DialogContent` compartilhado nem lib de bottom-sheet (Fase 3)

`DialogContent` (ADR-020) é estilizado como modal centralizado
(`top-1/2 left-1/2`, `max-w-md`) — reaproveitar essa classe via `cn()`
para virar uma folha ancorada na base da tela exigiria sobrepor várias
propriedades de posicionamento conflitantes, arriscando depender de
ordem de merge do `tailwind-merge` para classes com modificador
(`data-[state=...]`) versus sem modificador. Mais simples e mais
previsível: `AddActionSheet.tsx` usa `DialogPrimitive` (Radix) direto,
com sua própria folha de classes construída do zero pra ancorar em
`inset-x-0 bottom-0`. Reaproveita a mesma dependência já instalada
(nenhuma lib de bottom-sheet nova, ex.: `vaul`) — só não reaproveita o
wrapper estilizado, porque o visual é genuinamente outro.

## ADR-022 — Item de navegação sem tela construída aparece desde já, desabilitado com "Em breve" (Fase 3)

Decisão de produto tomada no clarify da Fase 3: a sidebar (10 itens),
a bottom nav (5 itens) e a folha "Adicionar" (6 itens) mostram a forma
final da navegação do produto desde a Fase 3, mesmo que 7 dos 10 itens
da sidebar, 2 dos 5 da bottom nav e todos os 6 da folha só ganhem tela
de verdade nas Fases 4 a 9. A alternativa (esconder cada item até sua
fase chegar) foi descartada porque escondia a forma final do produto
até a Fase 9 — ver "Alternativas descartadas" em
`specs/003-vehicle-shell/plan.md`.

Implementação: `lib/navigation.ts` é a fonte única — cada item tem
`to: string | null`, onde `null` significa "sem tela ainda". O
componente que consome a lista decide entre `NavLink` (rota real) e um
`<button aria-disabled="true">` (sem `disabled` nativo — precisa
continuar alcançável por Tab, só marcado indisponível pra leitor de
tela). Rótulo textual "Em breve" sempre visível, nunca só cor/opacidade
— o mesmo princípio de acessibilidade do ADR-014. Qualquer fase futura
que construir uma dessas telas só precisa trocar `to: null` por
`to: "/rota-real"` em `navigation.ts`; nenhum componente de navegação
muda.

## ADR-023 — Rótulo de item da bottom nav trunca com reticências em vez de tocar a borda em 320px (Fase 3)

Achado no `ui:check`/revisão visual: "Configurações" em item
`flex-1` sem `min-width: 0` não encolhe (comportamento padrão do
Flexbox — `min-width: auto` respeita o conteúdo), então o texto ficava
colado na borda direita da tela em 320px sem contar como overflow de
página (o item em si não estourava o container, só sobrava sem
respiro visual). Corrigido com `min-w-0` no item + `truncate` no
`<span>` do rótulo + `px-1` na `<nav>`/`px-0.5` por item — abaixo de
~340px "Configurações" vira "Configura…" em vez de tocar a borda.
Mesmo padrão do ADR-019 (achado real de 320px, não hipotético) — vale
para qualquer rótulo futuro de bottom nav.

## ADR-024 — `NavItem.to` generalizado para função de `vehicleId`; dois motivos de item desabilitado (Fase 4)

A Fase 3 só previa `to: string | null` ("tem tela" / "não tem tela
ainda"). "Gastos" (sidebar) e "Gasto" (folha "Adicionar") são os
primeiros itens cuja tela **existe**, mas depende de qual veículo está
aberto — não dá pra escrever uma rota fixa em `navigation.ts`. Extensão:
`to` aceita `string | null | ((vehicleId: string) => string)`, resolvida
por `resolveNavItem(item, vehicleId)` em `lib/navigation.ts`. `vehicleId`
vem de `useCurrentVehicleId()` (`src/hooks/useCurrentVehicleId.ts`), que
lê `useMatch("/v/:vehicleId/*")` — direto da URL, nunca de contexto
React (RN-1 da Fase 3 continua valendo). Item cuja função não pode
resolver por falta de veículo fica desabilitado por um motivo **diferente**
de "Em breve": "Selecione um veículo" (`DISABLED_REASON_LABEL`). As duas
telas de navegação (`Sidebar`, `BottomNav`, `AddActionSheet`) foram
migradas pro resolver comum; nenhum item que já funcionava (`Minha
garagem`, `Configurações`) mudou de comportamento.

## ADR-025 — `<main>` precisa de `min-w-0` explícito no `AppShell` (Fase 4)

Achado real de 320px na tela de Gastos: nenhum elemento sozinho excedia
a viewport (confirmado varrendo toda a árvore), mas o container da
página media 341px de largura. Causa: `<main>` é item de um flex row
(`AppShell`) ao lado da `Sidebar` — que em mobile é `display:none`,
então sobra um único item, mas ele ainda herda `min-width: auto` por
padrão. Um `<select>` nativo (`ExpenseFilters`, categoria) com opção
longa ("Financiamento", "Documentação") contribui pro cálculo de
min-content do ramo mesmo estilizado com `w-full` — é um comportamento
conhecido de `<select>` em contêiner flex, independente do CSS aplicado
ao próprio elemento. Corrigido com `min-w-0` direto em `<main>`
(`components/layout/AppShell.tsx`), resolvendo de uma vez pra qualquer
tela atual e futura que tenha um `<select>` — não só a de Gastos.

## ADR-026 — Helpers de validação numérica promovidos para `lib/schemaHelpers.ts`; `optionalEnum` novo (Fase 4)

`requiredNonNegativeInt`, `requiredNonNegativeNumber`,
`optionalNonNegativeNumber` e `optionalText` eram privados de
`features/vehicle/schemas.ts`. Gastos precisava dos mesmos (valor,
quilometragem opcional) — segundo uso, gatilho que o próprio projeto
define pra promover algo a compartilhado. Ganho no processo: um bug real
foi pego pelo Playwright, não por revisão manual — `paymentMethod:
z.enum(PAYMENT_METHODS).optional()` rejeitava `""` (valor que o
`<select>` nativo manda quando a opção "Não informado" está selecionada,
já que `""` não é `undefined` nem um membro do enum), travando o submit
**sem nenhum `FieldError` visível** pra explicar por quê — o campo nunca
teve um `<FieldError>` próprio renderizado. Corrigido com o novo helper
`optionalEnum(values)`, que trata `""` como "nada selecionado" antes de
validar contra o enum. Vale como padrão pra qualquer `<select>` futuro
com opção "não informado"/"selecione" de valor vazio.

## ADR-027 — `useDeleteExpense` busca o anexo direto do servidor no momento da exclusão (Fase 4)

RN-2 exige apagar o anexo antes do gasto. A primeira versão confiava no
campo `expense.attachment` já carregado pela lista — mas se o usuário
anexa um arquivo e apaga o gasto em seguida, antes do cache invalidado
pela Fase de upload terminar de recarregar, a lista ainda mostraria a
versão antiga (sem anexo) e a exclusão pularia a limpeza, deixando
arquivo e linha órfãos — exatamente o tipo de resíduo corrigido à mão na
Fase 3. Corrigido buscando o anexo atual direto do banco
(`entity_type='expense'`, `entity_id=<gasto>`) dentro da própria mutação
de exclusão, em vez de confiar no dado em cache do momento do clique.

## ADR-028 — `<select>` de "Tanque cheio"/toggles precisa de `Switch` no `controlComponents` do jsx-a11y (Fase 5)

`FuelLogForm` envolve `<Switch>` (Radix) num `<label>` nativo, igual o
`ThemeToggle` já fazia desde a Fase 0. A regra
`jsx-a11y/label-has-associated-control` acusou erro nesse padrão — mas
não no `ThemeToggle`, que por acaso "passava" porque seu primeiro filho
é uma expressão condicional (ternário do ícone Sol/Lua), o que faz a
análise estática da regra desistir de checar a associação em vez de
confirmá-la de verdade. Ou seja: o `ThemeToggle` nunca esteve
corretamente coberto por essa regra, só escapou por acidente de forma.
Corrigido de raiz adicionando `"Switch"` a `controlComponents` na
configuração do plugin (`eslint.config.js`) — agora `Switch` é
reconhecido como controle de verdade, tanto no `ThemeToggle` quanto em
qualquer uso futuro, sem depender de estrutura condicional para escapar
do lint.

## ADR-029 — `todayDateOnly()` substitui `new Date().toISOString().slice(0, 10)` como default de data "hoje" em formulário (Fase 5)

Achado real durante a verificação: `toISOString()` usa UTC. Em fuso
negativo (Brasil, UTC-3), depois que a meia-noite UTC já passou mas o
dia local ainda não virou, `new Date().toISOString().slice(0, 10)`
devolve a data de **amanhã**, não a de hoje — o abastecimento aparecia
registrado com data errada sem nenhum erro visível. O mesmo bug já
existia em `ExpenseForm.tsx` desde a Fase 4 (idêntico padrão), só não
tinha sido pego porque a verificação daquela fase não caiu numa janela
de horário onde UTC e o calendário local divergem. Corrigido nos dois
formulários com `todayDateOnly()` (novo helper em `lib/format.ts`, ao
lado de `formatDateOnly`), que monta a string a partir dos getters
**locais** de `Date` (`getFullYear`/`getMonth`/`getDate`), nunca de
`toISOString()`. Vale como padrão pra qualquer formulário futuro que
precise pré-preencher "hoje".

## ADR-030 — `cost_per_km` de `fuel_log_metrics` continua calculado sem tanque cheio; só `km_per_liter` fica nulo (Fase 5)

O contrato (`docs/API_CONTRACT.md`) diz que "`km_per_liter` e
`cost_per_km` vêm `null` quando o banco não tem confiança no cálculo
(tanque não cheio, ou abastecimento perdido no meio)" — a spec desta
fase (AC-7) presumiu que os dois ficavam nulos juntos nesse caso.
Testando contra o banco de dev real: um abastecimento com tanque não
cheio mostrou `km_per_liter = null`, mas `cost_per_km` com um valor
calculado de verdade. Faz sentido: `cost_per_km` só depende da
quilometragem percorrida desde o registro anterior e do valor pago —
nenhum dos dois fica incerto por o tanque não ter enchido; a incerteza
de "quanto combustível foi realmente consumido" só afeta `km_per_liter`.
A leitura mais provável é que a frase do contrato descreve a regra geral
de "quando o banco não confia" pensando sobretudo em `km_per_liter`, e
`cost_per_km` seguindo uma condição de confiança mais restrita (provável
candidata: `missed_previous_fill`, não testado nesta fase). AC-7 foi
reescrito em `spec.md` para descrever o comportamento real observado.
Não é um bug do frontend — é o comportamento correto de exibir
exatamente o que a view devolve (RN-1), e ilustra por que specs vindas
do contrato precisam ser confirmadas contra o banco real antes de virar
critério de aceite fechado.

## ADR-031 — Excluir item do plano de manutenção é exclusão de verdade, não "desativar" (Fase 6)

`maintenance_items` tem uma coluna `is_active` e
`maintenance_records.maintenance_item_id` é opcional (nullable) — dois
sinais de que apagar um item não precisa (e não deve) apagar o
histórico de execução vinculado a ele. Decisão: "Excluir" no diálogo é
uma exclusão de verdade da linha em `maintenance_items` (mesmo padrão
de todo `DeleteXDialog` do projeto); como o vínculo em
`maintenance_records.maintenance_item_id` é opcional, o banco
simplesmente desvincula (não apaga) os registros de execução antigos.
"Ativo"/"Inativo" (`is_active`) é só mais um campo do formulário de
editar — não um fluxo de "arquivar" separado, porque a tela de plano já
filtra por `is_active = true` e nenhum requisito pediu uma segunda tela
de itens inativos (ver spec.md, "Fora de escopo"). Se isso mudar
(ex.: precisar reativar um item desativado sem recriar do zero), a
solução é expor o filtro de inativos na mesma tela, não duplicar a
exclusão em dois conceitos.

## ADR-032 — `Intl.NumberFormat('pt-BR', {style:'currency'})` separa "R$" do valor com espaço não-quebrável (U+00A0), não espaço comum

Descoberto verificando a Fase 6: um teste comparando a string literal
`"R$ 150,00"` (espaço comum, U+0020) contra o texto renderizado por
`formatMoney` falhou mesmo com o valor certo na tela — `formatMoney`
usa `Intl.NumberFormat`, que no locale `pt-BR` insere U+00A0 entre o
símbolo e o número, não um espaço normal. Não é um bug do app (o
`formatMoney` sempre se comportou assim, desde a Fase 0) — é uma
armadilha de quem escreve verificação comparando texto literal com
`R$` na string. Registrado aqui porque toda fase futura com dinheiro na
tela vai tropeçar nisso se comparar string inteira; o jeito seguro é
checar só o valor numérico (`"150,00"`) ou usar uma regex com `\s`.

## ADR-033 — Excluir projeto apaga seus itens em cascata (confirmado contra o banco real, Fase 7)

Diferente de `maintenance_items`/`maintenance_records` (vínculo
opcional, ADR-031), `project_items.project_id` é `not null` — um item
não existe sem projeto. Não havia como saber pelo tipo gerado se o
banco recusa apagar um projeto com itens (FK `RESTRICT`) ou apaga tudo
junto (`CASCADE`) sem testar de verdade. Testado na verificação desta
fase: criar um projeto com 2 itens e excluí-lo remove o projeto **e**
os itens, sem erro — é `CASCADE`. O texto de confirmação do diálogo
("Todos os itens deste projeto também são apagados") já foi escrito
prevendo esse comportamento; a verificação confirmou que a frase é
verdade, não só uma suposição razoável.

## ADR-034 — Formulário de item de projeto sempre mostra o seletor de "Projeto", mesmo quando fixo (Fase 7)

`project_items.project_id` é obrigatório (RN-3) — diferente do vínculo
opcional de manutenção. Na tela de detalhe do projeto, o projeto já é
conhecido pela própria rota; no atalho "Upgrade" (folha "Adicionar"),
o usuário escolhe qual projeto no próprio formulário. Em vez de dois
formulários diferentes (um com campo de projeto, outro sem), o mesmo
`ProjectItemForm` sempre renderiza o `<select>` de projeto — na tela de
detalhe ele vem `disabled` com uma única opção (o projeto atual), no
atalho vem habilitado com a lista completa. Mesmo padrão já usado no
seletor de veículo único da `VehiclePage` (Fase 3): um controle
desabilitado com uma opção só é mais simples de manter do que dois
formulários quase iguais.

## ADR-035 — Anexo generalizado num módulo `features/attachment/` compartilhado, não duplicado por entidade (Fase 8)

A Fase 7 deixou explicitamente em aberto "quem decide o modelo geral de
anexo por entidade" — o enum `attachment_entity_type` já suportava
`issue`/`project_item`/`maintenance_record`/`note` desde antes, mas só
`expense` tinha UI (Fase 4). Em vez de copiar `useExpenseAttachment`/
`ExpenseAttachmentField` três vezes (uma por entidade nova), os dois
viraram `features/attachment/useAttachment.ts` (fetch por entidade,
upload, remoção, signed URL) e `AttachmentField.tsx`, parametrizados por
`entityType`/`entityId`. Gasto foi migrado para o módulo genérico junto
(não ficou uma versão "antiga" e três "novas" divergindo) e revalidado
com o mesmo roteiro de teste de anexo da Fase 4, pra garantir que a
refatoração não mudou o comportamento observável.

`useUploadAttachment`/`useRemoveAttachment` aceitam `extraInvalidateKeys`
porque nem toda lista que embute anexo usa uma key prefixada por
`['vehicles']` — item de projeto usa `['project-items', projectId]`
(ver Fase 7). Sem esse parâmetro, anexar um arquivo num item de projeto
invalidaria `vehicles` (efeito nenhum na tela) e a lista de itens do
projeto ficaria com o anexo desatualizado até a próxima navegação.

Manutenção (`maintenance_record`) entrou no escopo desta fase mesmo sem
estar no texto literal do roadmap para a Fase 8, porque o enum já
previa essa entidade e a nota da Fase 7 pedia para esta fase decidir o
modelo *geral* — decisão confirmada com o usuário antes de implementar
(ver `specs/008-files/spec.md`), não inventada.

## ADR-036 — Financiamento: botão "+1 parcela paga" e edição manual de `installments_paid` coexistem (Fase 8)

`financings.vehicle_id` é único no banco (relacionamento 1:1 confirmado
no `database.types.ts` gerado, `isOneToOne: true`) — a UI nunca mostra
"cadastrar financiamento" quando já existe um, só editar/excluir. Para
`installments_paid`, em vez de só um botão de incremento (rápido mas
sem como corrigir erro) ou só edição manual (correto mas repetitivo pro
caso comum, mensal), as duas vias coexistem: `useAddPaidInstallment`
soma 1 direto (`financing.installments_paid + 1`, sem recalcular nada
que o banco já gera) para o uso recorrente, e o campo `installmentsPaid`
no formulário de editar cobre a correção pontual. `installments_remaining`
e `outstanding_balance` nunca são calculados no cliente — só lidos de
volta depois do `update`, mesma regra já aplicada a `km_per_liter`
(Fase 5) e `project_progress` (Fase 7).

## ADR-037 — Página "Documentos" com abas internas, não quatro itens de sidebar (Fase 8)

O roadmap reservava um único slot de navegação (`to: null` em
"Documentos") para Documentos + Obrigações + Financiamento + Fotos —
decisão confirmada com o usuário: uma página só (`/v/:vehicleId/documentos`,
`?aba=documentos|obrigacoes|financiamento|fotos`) com abas internas
(`role="tablist"`/`tab`/`tabpanel` escritos à mão, sem
`@radix-ui/react-tabs` — mesma lógica da ADR-007/ADR-021 de não trazer
biblioteca nova pra um caso que um `<button>` com estado resolve),
em vez de expandir a sidebar. O item "Foto" da folha "Adicionar" (Fase
3, `to: null` até aqui) aponta pra `?aba=fotos&novo=1`.

Em 320/390px as quatro abas não cabem inteiras lado a lado sem
abreviar — o container rola horizontalmente (`overflow-x-auto`) e o
texto do rótulo seguinte aparece parcialmente cortado na borda, sinal
reconhecível de "tem mais pra rolar" (mesmo princípio de affordance de
outras listas horizontais do app, como o filtro de categoria da
galeria de fotos). Ajustado `px-3`→`px-2`/`gap-2`→`gap-1` depois da
primeira verificação visual mostrar a aba "Fotos" 100% fora da tela em
390px sem nenhum pedaço visível — depois do ajuste, todo breakpoint
testado mostra pelo menos um pedaço da próxima aba.

## ADR-038 — `AlertBanner`/`vehicle_alerts` reaproveitados sem mudança para obrigação e documento (Fase 8)

O comentário do `AlertBanner.tsx` desde a Fase 6 já previa isso ("quando
Documentos/Obrigações passarem a gerar `alert_type` próprio, este
banner já funciona sem mudança"). `DocumentsPage` chama
`useVehicleAlerts` (mesmo hook da Fase 6) e filtra pelos 4 tipos
relevantes (`obligation_overdue`/`obligation_due_soon`/
`document_expired`/`document_expiring`) antes de passar pro banner —
sem duplicar a lógica de "o que conta como vencido/próximo do
vencimento", que continua inteiramente do lado do banco (RN geral do
projeto: nunca recalcular no cliente o que o banco já decide). Um selo
"Vencido em"/"Vence em" no próprio item da lista de documentos/
obrigações é cálculo trivial de data (comparar com hoje), não o mesmo
tipo de decisão — esse sim é feito no cliente, como já acontecia em
outras telas.

## ADR-039 — Gráficos do dashboard escritos à mão (HTML/CSS), sem biblioteca de gráfico (Fase 9)

Dois gráficos simples — coluna de série única (gasto por mês) e barra
horizontal categórica (gasto por categoria), com no máximo ~12 pontos
cada. Rodada a skill `dataviz` do projeto antes de implementar (etapa
"cor por último" do método): forma primeiro (coluna pra tendência
temporal, barra horizontal pra comparar categorias com nome longo em
português), paleta depois. A paleta categórica de 8 slots é a
referência já validada da skill, **revalidada** com
`validate_palette.js` contra as superfícies reais do app (`#201c15`
dark / `#fbf7ee` light, não os defaults `#1a1a19`/`#fcfcfb` da skill) —
passou os 6 checks nos dois modos sem precisar reordenar ou trocar hue.
Gráfico de mês usa hue único (`--color-accent`, o dourado do app) por
ser série única (job de magnitude, não identidade) — a paleta
categórica de 8 slots não se aplica aí. Nenhuma biblioteca nova
(recharts, visx etc.) — mesma lógica da ADR-007/021: componente escrito
à mão quando o caso é simples o bastante. Todo valor é rotulado direto
na barra (sem eixo/gridline), porque com poucos pontos o rótulo direto
já é suficiente e a paleta categórica tem um WARN de contraste no modo
claro pra 4 dos 8 slots que exige exatamente esse rótulo visível como
"relief" (regra da skill — WARN de contraste não é dispensável).

## ADR-040 — Timeline lê `vehicle_timeline` inteira por veículo, filtra tipo/período no cliente (Fase 9)

A view já vem pequena por veículo (um punhado de eventos — confirmado
contra o veículo seed, 7 linhas de 7 fontes diferentes). Trocar de
filtro não teria custo perceptível fazendo round-trip novo a cada troca,
mas também não ganha nada — filtrar em memória evita rede repetida e
mantém a UI instantânea. Busca (`search_vehicle`) é a exceção: cada
termo é uma RPC nova (debounce de 300ms), porque relevância textual só
o banco calcula. Decisão do usuário: busca embutida na própria tela de
Histórico, substituindo a lista normal enquanto há termo digitado, em
vez de rota própria — o resultado de busca tem a mesma forma de um item
de timeline (`source_table`/`title`/`occurred_on`), então o mesmo
padrão de card é reaproveitado (`SearchResultItem`, irmão de
`TimelineItem`, não duplicata).

## ADR-041 — Nota é a única fonte da timeline editável/excluível ali mesmo (Fase 9)

Todo outro tipo de evento (gasto, abastecimento, manutenção, problema,
item de projeto, documento) já tem tela própria com formulário e regra
de negócio específica — "Ver" na timeline leva pra lá. Nota nunca teve
tela própria (chegou nesta fase, fechando o item "Nota" da folha
"Adicionar" que estava `to: null` desde a Fase 3) e não tem outro lugar
pra viver, então edita/exclui direto no card da timeline. Os diálogos
(`EditNoteDialog`/`DeleteNoteDialog`) recebem um tipo `NoteLike`
(`id`/`title`/`body`/`occurred_on`/`odometer_km`) em vez do `NoteRow`
completo do banco — permite montar a partir de `vehicle_timeline`
(que não tem `created_at`/`updated_at`/`vehicle_id`) sem inventar
valor nenhum pros campos que faltam.

## ADR-042 — "Dashboard"/"Home" (sidebar/bottom nav) apontam pra `/v/:vehicleId`; "Histórico"/"Dados" pra `/v/:vehicleId/historico` (Fase 9)

`VehiclePage.tsx` já carregava o aviso literal "Dashboard completo
chega na Fase 9" — a intenção sempre foi que o dashboard vivesse na
mesma rota já usada desde a Fase 2/3, não uma rota nova. Os itens de
navegação "Dashboard" (sidebar) e "Home" (bottom nav mobile) estavam
`to: null` só porque a tela ainda não tinha o conteúdo que os
justificasse — nesta fase passam a apontar pra `ROUTES.vehicle`, mesmo
destino, sem rota nova. Mesmo raciocínio pra "Histórico"/"Dados": os
dois eram o mesmo conceito com rótulo diferente por espaço (sidebar
tem largura pra "Histórico", bottom nav não), então os dois passam a
apontar pra `ROUTES.vehicleTimeline`.

## ADR-043 — `--color-error`/`--color-warning` (e `--color-success` no modo claro) reajustados em lightness pra fechar contraste 4.5:1 (Fase 10)

A varredura de acessibilidade desta fase (`scripts/audit-all-routes.mjs`,
axe-core em toda rota × 4 breakpoints) achou `color-contrast` `serious`
em badges de status (`border-X/40 bg-X/10 text-X` — usado em
`IssueListItem`, `MaintenanceItemCard`, `AlertBanner`,
`ProjectsPage`). O texto sozinho já vinha marginal contra a superfície
pura, e a mistura de 10% da própria cor no fundo do badge empurrava
pra baixo de 4.5:1 nos dois temas — não era um problema de um
componente só, era o valor do token.

Calculado (não estimado) quanto cada cor precisava mudar em
*lightness* (HSL, mantendo matiz e saturação) pra passar 4.5:1 **tanto**
contra a superfície pura **quanto** contra o próprio fundo `/10` tintado,
nos dois modos:

| Token | Antes | Depois | Contraste antes (puro / tint 10%) | Depois |
|---|---|---|---|---|
| `--color-error` (dark) | `#c1503c` | `#cf7666` | 3.62 / 3.29 | 5.19 / 4.54 |
| `--color-warning` (dark) | `#cb6b2c` | `#d47538` | 4.59 / 4.07 | 5.18 / 4.54 |
| `--color-warning` (light) | `#a3591e` | `#9d551d` | 4.90 / 4.30 | 5.23 / 4.57 |
| `--color-success` (light) | `#4f7a3a` | `#4b7337` | 4.70 / 4.15 | 5.16 / 4.53 |

`--color-success` (dark) e `--color-error` (light) já passavam (5.72/4.94
e 6.38/5.49 respectivamente) — não tocados. Reverificado com o mesmo
script de varredura depois do ajuste: 72/72 rota×viewport sem nenhuma
violação `serious`/`critical`, screenshot conferido visualmente pra
confirmar que a mudança (4-11% de lightness) não descaracteriza a
identidade visual "Slow Car Club" — continua lendo como o mesmo laranja-
avermelhado quente, só um pouco mais claro/escuro conforme o modo.

`--color-error` também é usado no variant `destructive` de `Button`
(`bg-error text-accent-foreground`), mas esse variant nunca é
efetivamente usado em nenhuma tela do app (confirmado por busca) — o
ajuste não tem efeito visual observável ali.

Também removido `opacity-90` da legenda de data do `AlertBanner`
(`Venceu em ...`), que empilhava uma segunda redução de contraste em
cima da cor já ajustada, sem nenhum ganho visual documentado — só
reduzia legibilidade.

## ADR-044 — Rotas de página convertidas para `React.lazy` (Fase 10)

Lighthouse (mobile, throttled) contra o build de produção apontou
"Reduce unused JavaScript — Est. savings of 198 KiB" na tela de login,
que antes desta fase importava estaticamente todas as ~13 páginas do
app (`router.tsx` importava `VehicleListPage`, `TimelinePage`,
`DocumentsPage` etc. todas no topo) — o bundler agrupava tudo isso nos
mesmos poucos chunks grandes (`router-*.js` chegava a 430KB/106KB
gzip), mesmo pra quem só ia fazer login.

Cada rota agora é `React.lazy(() => import(...))`, envolvida no próprio
`<Suspense fallback={<RouteFallback />}>` — `router.tsx` ganhou o
helper `lazyPage()` pra não repetir o par lazy+Suspense 13 vezes.
Resultado medido: bundle de login caiu de ~430KB (chunk compartilhado)
pra ~2KB de chunk próprio; "unused JavaScript" da tela de login caiu de
198KiB pra 95KiB; Total Blocking Time caiu de 60ms pra 0ms. A pontuação
de Performance do Lighthouse (mobile, throttled) não mudou (88, antes e
depois) e o LCP continua ~3.5s nesse cenário — medido e confirmado que
o gargalo restante é outra coisa (ver próximo ADR), não o tamanho do
bundle, que já foi endereçado.

`AppShell`, `ProtectedRoute` e `GuestRoute` continuam com import
estático — são pequenos, usados por toda rota autenticada, e carregá-
los sob demanda só adicionaria uma segunda camada de Suspense sem
ganho real.

## ADR-045 — LCP de ~3.5s em rede móvel simulada é dominado pela checagem de sessão, não pelo bundle — registrado, não "corrigido" (Fase 10)

Depois do code-splitting da ADR-044, o Lighthouse (mobile, throttled)
continuou reportando LCP ~3.5s pra tela de login, com 87% desse tempo
na fase "Render Delay" (tempo entre recurso pronto e o elemento LCP
pintar). Investigado: `AuthProvider` mantém `status: "loading"` até
`supabase.auth.getSession()` resolver, e `GuestRoute` só renderiza a
tela de login depois disso — então o wordmark "Slow Garage" (elemento
de LCP) só pinta depois de: JS do provider carregar → efeito do
`AuthProvider` disparar → `getSession()` resolver → `GuestRoute`
trocar pra `<Outlet />` → chunk da `SignInPage` baixar e renderizar.
Em rede lenta simulada (4G lento + CPU 4x mais devagar, o preset padrão
do Lighthouse), essa cadeia sequencial de passos assíncronos é o que
domina o tempo, não o peso do JavaScript.

Não "corrigido" nesta fase porque a correção óbvia (renderizar o
formulário de login otimisticamente antes de saber se o usuário já
está autenticado) troca um problema de performance por um problema de
UX pior: um usuário já logado veria a tela de login piscar antes do
redirecionamento — pior do que esperar meio segundo a mais. É uma
troca de arquitetura (SSR resolveria, mas está fora do escopo de uma
SPA estática hospedada na Vercel), não um bug de implementação.
Registrado aqui pra não fingir um número perfeito: 88/100 Performance
(mobile, throttled) e 100/100 no preset desktop são os números reais
medidos contra o build de produção local — não estimados, e o
gargalo restante está nomeado, não escondido.

## ADR-046 — Revisão de identidade visual: "Slow Car Club" (dourado) substituída por "Rolê Noturno" (âmbar/asfalto, JDM)

Depois do roadmap de 10 fases fechado, o usuário viu o produto construído
de ponta a ponta e rejeitou a identidade visual da Fase 0: "não gostei de
praticamente nada... n ta nada gearhead", junto com um bug real apontado
na mesma mensagem — a sidebar repetia "Selecione um veículo" 8 vezes,
quebrando em 3 linhas por item, sempre que nenhum veículo estava
selecionado (o estado mais comum de entrada no app: `/` antes de escolher
um carro).

**Bug corrigido primeiro, independente da decisão de cor** —
`src/components/layout/Sidebar.tsx`: motivo de item desabilitado deixou
de aparecer repetido por linha (`aria-hidden`, cada botão ganhou
`aria-label` completo pra leitor de tela) e passou a aparecer uma vez só,
como nota de rodapé da navegação, listando os motivos distintos presentes
(hoje só existe um: `no-vehicle` — `not-built`/"Em breve" é código morto,
nenhum item usa `to: null` desde a Fase 9, mas o suporte ficou porque
remover o tipo é um refactor separado, não pedido).

**Processo da mudança de cor** — usada a skill `frontend-design` do
projeto, que exige propor o sistema em duas rodadas de pergunta antes de
tocar em token (decisão mais irreversível do projeto). Perguntado, em
ordem: (1) qual das 4 referências de cultura automotiva — subúrbio
rebaixado brasileiro, hot-rod americano clássico, JDM/tuner noturno, ou
oficina utilitária raiz — o usuário escolheu **JDM/tuner noturno**; (2)
dentro disso, qual cor de acento — âmbar de poste de rua, vermelho de
lanterna, azul/roxo elétrico (o default mais comum de UI gerada por IA
hoje), ou branco de ponteiro — o usuário escolheu **âmbar**, explicitamente
pra fugir do default azul/ciano.

Ao revisar `5348.png` (a logo, nunca trocada) de perto pra fazer a
composição dos ícones, confirmado que ela já era um adesivo de carro
japonês genuíno desde a Fase 0 — "SLOW" em lettering de decalque
desgastado, katakana "カークラブ" (car club), bandeira quadriculada,
brilho. A Fase 0 tinha a logo certa e vestiu ela com dourado clássico
americano em vez do idioma visual que a própria logo já falava — a
revisão realinha a paleta com o que o adesivo sempre foi, sem redesenhar
a marca.

**Tokens finais** (`src/styles/tokens.css`) — todo par calculado contra
`--color-bg` **e** `--color-surface` simultaneamente (não só um dos dois,
lição da Fase 10) com margem de segurança acima do mínimo 4.5:1, porque a
primeira rodada de valores (calculados só contra `surface`) passou no meu
cálculo mas falhou no axe-core real pra `--color-error` nos dois temas —
o contexto real (`AlertBanner` sobre `--color-bg`, badge sobre
`--color-surface`) exige os dois:

| Token | Dark | Light |
|---|---|---|
| `--color-bg` | `#121316` | `#EDEBE6` |
| `--color-surface` | `#1B1D21` | `#F5F3EF` |
| `--color-accent` | `#FF8A1E` | `#974D00` |
| `--color-error` | `#EA665A` | `#AA372A` |
| `--color-warning` | `#E0B238` | `#7C5B10` |
| `--color-success` | `#5FAE6B` | `#386B41` |

Reverificado com varredura completa (axe-core + overflow) em 16 rotas × 2
temas × 2 breakpoints = 64 combinações: **64/64 sem achado** na versão
final. Paleta categórica de gráfico (8 slots, Fase 9/ADR-039) revalidada
contra as novas superfícies com `validate_palette.js` — passou sem ajuste,
não precisou mudar.

**Tipografia hero** trocada de `Permanent Marker` (cursiva, estilo
graffiti) pra `Rajdhani` 700 (condensada, geométrica, maiúscula com
tracking largo — mais "decalque de painel" que "sticker de skate"),
continua restrita ao wordmark de `/entrar`/`/cadastro`, único ponto —
`docs/DESIGN.md` tem o racional completo, incluindo o que foi cotado e
recusado (azul/roxo elétrico como acento, por ser o default mais comum).

**Ícones do PWA** regerados (`npm run icons`) com o novo fundo
(`scripts/generate-icons.mjs`, `BG`); `manifest.webmanifest` e o
`<meta name="theme-color">` de `index.html` atualizados pro mesmo hex.

## ADR-047 — `maintenance_status` não computou linha pra um item mesmo com histórico e veículo com km (Fase 11)

Descoberto verificando AC-18 da Fase 11 (schema-freedom) contra o Supabase
real, com um item de manutenção de teste (intervalo 5000km): o badge exibido
foi `"Planejado"` (fallback do cliente pra "sem linha na view",
`item.status?.status ?? "planned"` em `useMaintenanceItems.ts`, Fase 6) em
**três** cenários diferentes — (1) item recém-criado, veículo com km; (2)
mesmo item com uma execução registrada (`last_service_odometer_km`
preenchido), veículo ainda com km; (3) mesmo item com histórico, veículo sem
`current_odometer_km` (removido de propósito, é o cenário que o AC-18
queria testar). O status não mudou entre os três passos — a view nunca
computou uma linha pra esse item em nenhum dos casos testados.

Não investigado a fundo (fora do escopo da Fase 11 — `maintenance_items`/
`maintenance_status` não foram tocados nesta fase, ver `specs/011-schema-freedom/spec.md`
§4). A propriedade de segurança que a Fase 11 precisava confirmar segue
válida — nenhum status alarmante (`overdue`/`due_soon`) apareceu sem dado
suficiente em nenhum dos três passos, então o veículo sem `current_odometer_km`
não passou a "inventar" alarme. Mas o rótulo específico do AC-18 (cair em
`"ok"`) não foi observado, porque a view não chegou a computar nada pra este
item em nenhuma das três tentativas — condição exata pra a view retornar uma
linha fica como pendência de investigação futura, registrada em
`specs/011-schema-freedom/verification.md`.

## ADR-048 — Dois bugs reais só apareceram testando contra o Supabase de verdade, não em `tsc`/`eslint` (Fase 11)

A Fase 11 chegou a declarar (numa primeira versão de `verification.md`)
todos os ACs funcionais como "não verificado" por falta de credencial de
login — o usuário forneceu uma conta de teste já confirmada
(`e2e-test@dev.local`) depois desse relatório. Rodando o roteiro de verdade
com Playwright contra o app + banco reais, dois bugs surgiram que nenhuma
ferramenta estática pegou:

1. `ExpenseListItem.tsx` renderizava `{expense.description}` cru como
   título do card — com `description` agora opcional (Fase 11), um gasto
   sem descrição virava uma linha em branco. `tsc` não acusa porque JSX
   aceita `null`/`undefined` como filho válido (não é erro de tipo, é gap
   de UX). Corrigido com fallback `{expense.description || "Gasto"}`.
2. `EditObligationDialog.tsx` não enviava `due_on: null` no payload de
   edição — o autor da mudança (eu, executando a Fase 11) tinha conferido
   esse padrão em `CreateObligationDialog.tsx` e assumido, sem reconferir
   linha a linha, que o `Edit` já seguia o mesmo padrão. Resultado real:
   limpar o vencimento de uma obrigação já salva e clicar "Salvar" não
   apagava o valor — a chave `due_on` nem saía no corpo do PATCH.
   Descoberto comparando o corpo real da requisição (capturado via
   `page.waitForResponse` no script de verificação) contra o esperado.

Vale como lição de processo pra qualquer fase futura que mexer em payload
de mutação "Create" e "Edit" em paralelo assumindo que os dois seguem o
mesmo padrão: **conferir os dois arquivos, nunca só um**. Ver também
`specs/011-schema-freedom/verification.md` pro roteiro completo de
verificação e a lista de ACs confirmados.

## ADR-049 — Item de navegação sem veículo selecionado some, não aparece cinza (supera ADR-024, Fase 14)

O usuário rejeitou a experiência da sidebar/bottom-nav/folha "Adicionar"
sem veículo selecionado: 8 dos 10 itens da sidebar (e 2 dos 4 da bottom
nav, e todos os 6 da folha "Adicionar") apareciam desabilitados com
"Selecione um veículo" repetido — "bagunçado", nas palavras do usuário.

A Fase 3/4 (ADR-022/024) tinha decidido deliberadamente o oposto: mostrar
o item desabilitado com motivo, pra não esconder "a forma final do
produto". Essa decisão fazia sentido quando só 1-2 itens ficavam
desabilitados de cada vez (ex.: só "Gastos" sem veículo, antes de outras
telas existirem). Depois que **todas** as 8 telas de veículo passaram a
existir (Fase 9 em diante), o mesmo padrão virou o oposto do que
pretendia: em vez de "mostrar a forma final", virou uma parede de item
cinza toda vez que a garagem tem mais de um carro e nenhum está aberto.

Decisão: item que depende de veículo (`to` como função em `NavItem`)
**não aparece** na sidebar/bottom-nav quando não há veículo selecionado —
só os itens sempre disponíveis (Minha garagem, Configurações) ficam.
Removido de `navigation.ts`/`resolveNavItem` o conceito de "not-built"
(já morto desde a Fase 9, ADR-046) e a variante `ResolvedNavItem`
desabilitada — `resolveNavItem` agora só devolve a rota resolvida ou
`null`. O FAB "Adicionar" da bottom nav continua sempre visível (é um
ponto de referência espacial fixo), mas fica `aria-disabled` com motivo
quando não há veículo — evita abrir uma folha inteira cheia de item
cinza.

Não é regressão do princípio de acessibilidade do ADR-022 (item continua
alcançável por Tab quando existe, nunca `disabled` nativo escondendo de
leitor de tela) — é a mesma disciplina aplicada à decisão de **quando**
um item deveria sequer estar na lista.

## ADR-050 — Mostrador de odômetro (arco SVG) preenche por "progresso até o próximo múltiplo de 10.000km", não por um teto de vida útil (Fase 14)

O usuário achou a home do veículo genérica demais ("cara de SaaS"),
sem interatividade nem elemento de identidade — processo completo (skill
`frontend-design`, clarify em 3 rodadas) concluiu que o odômetro deveria
virar o elemento-assinatura da tela, como o mostrador de um painel de
carro de verdade, sem repetir a ousadia em todo tile (regra da própria
skill: "gaste a ousadia em um lugar só").

Problema técnico real: um mostrador de arco precisa de uma proporção
(quanto do arco preencher), e velocímetro/conta-giros têm um teto natural
(a velocidade máxima do painel). Odômetro é contagem de vida útil, sem
teto conhecido — inventar um (ex.: "300.000km = 100%") seria fabricar um
dado que não existe, o mesmo erro que o projeto proíbe desde sempre pra
cálculo de negócio. Decisão: o arco preenche o progresso do valor atual
até o **próximo múltiplo de 10.000km** (`km % 10000 / 10000`) — é uma
transformação de exibição de um valor 100% real, não uma estimativa, e
tem analogia direta com o "trip meter" que carros de verdade já têm.

Também descartado nesta fase: sparkline/tendência para "Custo/km" — não
existe view nem coluna com histórico de custo por km no banco (só
`expenses_by_month`, usado para "Total investido"). Mostrar uma
tendência ali seria calcular no cliente o que o banco não decide (regra
geral do projeto desde a Fase 5/ADR-030).

## ADR-051 — Resumo agregado de todos os veículos soma views por veículo no cliente, sem RPC própria (Fase 14d)

Usuário pediu, na "Minha Garagem": ver gráfico/informação combinando
todos os veículos (ex.: "quanto já gastei de upgrade em todos os
carros"). Diferente do dashboard de um veículo (`get_vehicle_dashboard`,
RPC única, RN-1 de `useVehicleDashboard.ts`: "nunca decompor em query de
tabela por bloco"), não existe uma RPC equivalente pra garagem inteira.

Decisão: `useGarageSummary` busca `vehicle_expenses_by_category`/
`vehicle_expenses_by_month` filtrando `vehicle_id IN (...)` pra todos os
veículos do usuário, e soma no cliente por `category_slug`/`month`. Os 5
totais (investido, gastos, manutenção, combustível, itens de projeto)
nem precisam de query nova — já vêm em cache de `useVehicles`
(`vehicle_financial_summary` por veículo), só somados no componente.

Isso **não** é o mesmo erro que o projeto proíbe (recalcular regra de
negócio no cliente, ex.: o que conta como "vencido"): somar valores que
o banco já computou por veículo, sem reinterpretar nenhuma regra, é
aritmética sobre dado real e completo (RLS já garante que só os veículos
do próprio usuário aparecem). Registrado como decisão consciente, não
descoberta depois: se este resumo crescer em lógica (ex.: filtro de
período, mais métricas cruzadas), vale promover pra uma RPC própria
(`get_garage_dashboard`) do lado do backend, mesmo padrão do
`get_vehicle_dashboard`.

`GarageSummary` só aparece com 2+ veículos — com 1 só, seria idêntico ao
dashboard daquele veículo (mesma regra de "nunca duplicar número já
visível em outro lugar" de todo o projeto).
