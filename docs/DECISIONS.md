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

## ADR-052 — `VehicleCard` ganha placa/ficha técnica de verdade; recusa zebra e ações duplicadas (Fase 14e)

Revisão de design (externa, comparando a "baia de oficina" da Fase 14c
contra um mockup próprio) trouxe 4 sugestões pro card da "Minha Garagem".
Duas foram aceitas por adicionarem **dado real que já existe no schema
mas não aparecia em lugar nenhum** (mesma disciplina da Fase 14c: "mais
densidade de dado real, nenhuma decoração nova sem função"); duas foram
recusadas.

**Aceito:**
- Placa (`vehicle.plate`, campo opcional desde a Fase 11) ao lado do
  nome, tag mono de borda reta — só aparece se o veículo tiver placa
  cadastrada, nunca um placeholder tipo "sem placa".
- Chips de ficha técnica (`engine_description`, `transmission`,
  `horsepower`) abaixo do nome — os 3 já existem no formulário de
  veículo ("Mais detalhes") mas não eram exibidos em lugar nenhum da
  garagem. `transmission` sempre tem valor (default no banco, Fase 11);
  os outros dois só renderizam se preenchidos.
- Número da baia ganhou a mesma casca "plaquinha" do badge de status
  (`rounded-sm border`) em vez de texto solto no canto — reforça que é
  uma etiqueta, não decoração.

**Recusado:**
- **Textura de zebra (faixa amarelo/carbono) no slot da foto** — seria
  um **terceiro** elemento de ousadia decorativa do produto. O
  `docs/DESIGN.md` (seção "Onde a ousadia mora") já limita a isso a
  exatamente dois pontos, cada um justificado por viver numa zona
  isolada (wordmark de login, mostrador de odômetro da `VehiclePage`).
  Uma faixa de zebra no card de lista não tem função — é puramente
  decorativa e concorreria com os dois pontos já decididos. Mantém a
  disciplina em vez de acumular ousadia.
- **Ações rápidas + últimos registros em cada linha da lista** — a
  `VehiclePage` (Fase 13/14) já é exatamente esse hub (`QuickActionsRow`
  + timeline). Repetir isso em toda linha de `VehicleListPage` duplica a
  mesma estrutura de UI em dois lugares (o problema que o item 8 da
  `design-review` proíbe) e, com muitos veículos, transforma a garagem
  numa lista de mini-dashboards — o oposto de "lista de baias" que a
  Fase 14c decidiu. O clique na linha já leva 1 passo até essas ações.

## ADR-053 — Supera parte do ADR-052: ações rápidas por linha e atividade agregada na "Minha Garagem" (Fase 14f)

O usuário pediu explicitamente as duas coisas que o ADR-052 tinha
recusado, depois de eu apontar que a recusa original mirava garagem
com **muitos** veículos (virar "lista de mini-dashboards"). A conta
real em uso tem 1 carro só — nesse caso a objeção não se sustenta: a
página realmente morre depois do card, e o clique extra pra fazer a
ação mais comum é exatamente o atrito que o usuário reclamou. Registrado
como reversão consciente (mesmo padrão do ADR-049 sobre o ADR-024), não
descoberta silenciosa.

**Ações rápidas por linha (`VehicleQuickActions`, novo componente):**
versão compacta do `QuickActionsRow` (4 botões só-ícone, `size="icon"`
de 44px, mesmo alvo de toque do resto do app) numa faixa `border-t` no
rodapé do card, fora do `<Link>` que leva pro veículo (bota `<button>`
dentro de `<a>` seria semântica inválida). Diferença de disciplina
visual pra não virar "mini-dashboard": nada de rótulo de texto nos
botões (só ícone + `aria-label`), nada de grid 2x2 chamativo como na
`VehiclePage` — é uma faixa quieta de utilidade, não uma segunda faixa
de destaque.

Custo evitado: `CreateMaintenanceRecordDialog` depende de
`useMaintenanceItems(vehicleId)`, que dispararia uma query por veículo
da lista só pra deixar o diálogo pronto. `useMaintenanceItems` ganhou
um `options?.enabled` (default `true`, compatível com todo uso
existente) e `VehicleQuickActions` só liga a query depois do primeiro
clique no botão de manutenção — os outros 3 diálogos (gasto,
abastecimento, foto) não têm esse custo (dados já vêm de
`useVehicles`/prop), então montam direto.

**Atividade agregada (`useGarageTimeline` + `GarageActivityFeed`):**
mesmo padrão do `useGarageSummary` (ADR-051) — sem RPC de garagem,
busca a view `vehicle_timeline` com `vehicle_id IN (...)`. Mais simples
que `useGarageSummary` porque não soma nada: `order` + `limit` na
própria query já entrega os N eventos mais recentes prontos, sem merge
no cliente. Reaproveita o `TimelineItem` que a `VehiclePage` já usa —
zero componente novo de exibição, só um jeito novo de alimentá-lo.

Diferente do `GarageSummary` (só aparece com 2+ veículos, por ser
número que duplicaria o resumo de 1 veículo só), a atividade aparece
com 1 veículo também: o ganho aqui é poupar o clique de navegar, não
mostrar um dado novo — com 1 carro, é o mesmo conteúdo da timeline
dele, só que sem sair da "Minha Garagem".

## ADR-054 — Aba "Mais" na bottom nav: as 9 seções da sidebar não cabiam nas 4 abas fixas do mobile (Fase 14g)

Usuário reportou (com print da `VehiclePage` no mobile): a bottom nav
só tem 4 abas (Home, Carros, Dados, Configurações) + FAB, mas a sidebar
de desktop tem 9 seções (`SIDEBAR_NAV_ITEMS`) — Gastos, Abastecimentos,
Manutenção, Problemas, Projetos e Documentos não eram alcançáveis no
mobile de jeito nenhum (o FAB só *cria* registro, não navega pra ver a
lista/gerenciar). Bug de paridade, não decisão consciente anterior — a
bottom nav nunca teve as 9 seções, só um subconjunto fixo pensado pra
"visão geral" (Fase 9).

Decisão: 5ª aba "Mais" (ícone `LayoutGrid`), entre "Dados" e
"Configurações" — mesma posição de "Configurações" continua fixa por
último (`settingsItem` sempre separado do split), consistente com o
`pinBottom` da sidebar. Abre uma folha (`MoreSheet`) com as 6 seções que
faltavam, mesmo componente visual do FAB "Adicionar" — a diferença
óbvia (grade de ícone+rótulo linkando pra tela em vez de abrir diálogo
de criação) fez valer a pena extrair a base comum: `NavSheet.tsx` (novo)
carrega o `Dialog` do Radix posicionado na base + a grade; `AddActionSheet`
e `MoreSheet` viram wrappers finos só com título/lista diferentes. Só
extraiu no segundo consumidor, não antes (mesma regra de sempre:
abstração espera o segundo caso real).

"Mais" só aparece com veículo selecionado — todo item da folha é
vehicle-scoped, então sem veículo ela não teria o que mostrar (mesma
regra de "item some, não aparece desabilitado" de todo o resto da
bottom nav, ADR-049). Alternativas descartadas: substituir "Dados" por
"Mais" (perderia o atalho direto pro histórico, que já tinha uso
próprio); menu hambúrguer/drawer full-screen no lugar da bottom nav
inteira (mudança maior, perderia o acesso de 1 toque às abas mais
usadas que a bottom nav já dá).

## ADR-055 — Corrige o ADR-054: "Dados" volta pra dentro de "Mais"; "Home" vira "Dashboard" (Fase 14h)

Usuário testou o resultado do ADR-054 (print da bottom nav com 5 abas +
FAB) e reportou dois problemas reais, que fazem reverter uma das
alternativas descartadas ali:

1. **A barra ficou apertada** — 5 abas + FAB (6 elementos) num telefone
   estreito já cortava o rótulo de "Configurações" ("Configuraç…").
   A alternativa "mover Histórico pra dentro de 'Mais'" que o ADR-054
   descartou (achando que perderia atalho de uso) era, na prática, a
   correção certa — o atalho de 1 toque não compensa a barra cortando
   texto. "Histórico" saiu de `BOTTOM_NAV_ITEMS` e entrou como primeiro
   item de `MORE_SHEET_ITEMS`.
2. **"Home" apontava pro veículo, não pra garagem** — a aba que abre o
   painel de 1 veículo (`ROUTES.vehicle`) se chamava "Home" desde a
   Fase 9, mas o "home" conceitual do app (onde você cai sem veículo
   selecionado, a visão de conjunto) é a garagem — hoje a aba "Carros".
   Chamar o painel de veículo de "Home" e a garagem de "Carros" inverte
   a expectativa de quem usa o app. Renomeado pra "Dashboard" (mesmo
   rótulo e ícone `LayoutDashboard` que a sidebar já usa pro mesmo
   destino) — não precisa de vocabulário novo, só parar de abreviar
   errado.

Resultado com veículo selecionado: 4 abas (Dashboard, Carros, Mais,
Configurações) + FAB — mesma contagem de elementos que a bottom nav
tinha antes do ADR-054 introduzir a aba "Mais", só que agora com
paridade completa de seção via a folha.

## ADR-056 — Bug real no ADR-055: FAB descentralizado (Fase 14i)

A implementação do ADR-055 dividia `linkItems` (tudo exceto
"Configurações") ao meio matematicamente (`Math.ceil(length / 2)`) e só
*depois* colava o botão "Mais" no array `after`, fora dessa conta. Com
2 `linkItems` (Dashboard, Carros), a divisão dava 1 de cada lado — mas
"Mais" entrava a mais no lado direito sem entrar na conta, resultando
em 1 item à esquerda do FAB e 3 à direita (Carros, Mais, Configurações).
O FAB nunca esteve realmente centralizado desde que "Mais" existe;
só não tinha sido visualmente óbvio até o usuário mandar print de perto.

Corrigido pra uma regra mais simples e sem aritmética escondida: todo
`BOTTOM_NAV_ITEMS` exceto o último (`settingsItem`, sempre
"Configurações") vai à esquerda do FAB; "Mais" (quando visível) e
"Configurações" vão à direita. Com veículo: 2 à esquerda (Dashboard,
Carros), 2 à direita (Mais, Configurações). Sem veículo: 1 e 1 (Carros
| Configurações, "Mais" some). Sempre simétrico, sem precisar calcular
metade de nada.

## ADR-057 — `Configurações` ganha alterar senha e tema completo (Fase 14k)

Usuário apontou que a tela de Configurações estava "pobre e genérica" —
só e-mail (somente leitura) e nome de exibição. Duas seções novas,
ambas usando capacidade que já existia no backend/lógica do app, sem
inventar nada:

- **Segurança (alterar senha):** `ChangePasswordForm` reaproveita o
  mesmo `updatePassword` do `AuthProvider` e o mesmo
  `updatePasswordSchema` que o fluxo de recuperação de senha
  (`UpdatePasswordForm`, acessado via link de e-mail) já usa —
  `supabase.auth.updateUser({ password })` funciona igual pra sessão de
  recuperação e pra sessão normal já logada. Única diferença de verdade:
  fica na própria página com mensagem de sucesso (`role="status"`,
  mesmo padrão do `DisplayNameForm`) em vez de navegar embora, porque
  aqui o usuário já está logado, não acabou de clicar num link.
- **Aparência (tema completo):** ver ADR-058 — reverte o "dark é o
  padrão absoluto, não segue `prefers-color-scheme`" documentado no
  `DESIGN.md`/Fase 0.

Seções organizadas em cards (`SettingsSection`, `rounded-lg border
border-border bg-surface p-4`) por assunto — Conta / Aparência /
Segurança — em vez de tudo solto num card só, mesma disciplina de
"nenhuma decoração nova sem função" (aqui a função é escaneabilidade,
não decoração).

## ADR-058 — Tema ganha "seguir o sistema"; reverte o "dark não segue `prefers-color-scheme`" (Fase 14k)

O `DESIGN.md` documentava, desde a Fase 0: "Dark é o padrão absoluto do
produto — não segue `prefers-color-scheme`". Usuário pediu
explicitamente, ao ver a nova seção "Aparência" em Configurações, as 3
opções padrão de app: Claro, Escuro, Seguir o sistema. Reversão
consciente e direta, não descoberta silenciosa — registrada aqui pelo
mesmo motivo de sempre (ver ADR-049, ADR-053, ADR-055): a próxima
pessoa que ler o `DESIGN.md` antigo não deve achar que "seguir o
sistema" foi esquecido.

O que continua igual: **dark continua o padrão pra quem nunca escolheu
nada** — `getStoredPreference()` só retorna `"system"` se a pessoa
escolheu isso explicitamente em Configurações; sem preferência salva,
o padrão ainda é `"dark"`, não `"system"`. Só mudou o leque de opções
disponível, não o comportamento de quem nunca mexeu em nada.

Implementação: `Theme` ("dark" | "light", o que é de fato aplicado no
DOM) separado de `ThemePreference` ("dark" | "light" | "system", o que
fica salvo). `resolvedTheme` é derivado durante a própria renderização
(`preference === "system" ? (systemPrefersLight ? "light" : "dark") :
preference`) — `systemPrefersLight` vem de `useSyncExternalStore`
assinando o evento `change` de `matchMedia("(prefers-color-scheme:
light)")`, não de `useEffect` + `setState` (a primeira versão fazia
isso e o lint `react-hooks/set-state-in-effect` acusou "cascading
renders" — `useSyncExternalStore` é o jeito correto de ler estado de
fora do React que muda sozinho). Troca o SO com o app aberto muda o
tema ao vivo, sem precisar recarregar. O atalho rápido do cabeçalho/login
(`ThemeToggle`, `Switch` binário) continua existindo — sempre define
uma preferência explícita (nunca "system"), pensado pra alternância
rápida; o controle completo com as 3 opções (`ThemePreferenceSelect`,
`<select>` — reaproveita o componente `Select` já usado em todo
formulário do app, sem inventar um novo widget de 3 botões pra um único
uso) fica só em Configurações. O script inline de `index.html` (que
aplica a classe `.light` antes do primeiro paint pra não piscar) ganhou
o mesmo cálculo de `prefers-color-scheme` pro caso `"system"`.

## ADR-059 — `Configurações` ganha "Voltar", logo do cabeçalho vira link, e grade de 2 colunas no desktop (Fase 14l)

Três atritos reais reportados em sequência, todos na mesma tela:

1. **Sem jeito de voltar pra onde estava.** Entrar em Configurações só
   pra trocar uma preferência e sair de novo forçava renavegar pela
   sidebar/bottom nav do zero até achar a tela anterior. Adicionado um
   link "Voltar" (`ArrowLeft` + `navigate(-1)`) no topo — usa o
   histórico do próprio navegador, então volta pra exatamente onde a
   pessoa estava (dentro de um veículo, na garagem, etc.), não pra uma
   rota fixa qualquer.
2. **Logo/nome do cabeçalho não levava a lugar nenhum.** `AppShell`
   tinha só um `<div>` com o ícone + "Slow Garage", sem link. Virou
   `<Link to={ROUTES.home}>` — convenção universal de app (clicar na
   marca leva pra home) que este produto nunca tinha implementado.
3. **Página parecia mobile mesmo em tela larga.** O container era
   `mx-auto max-w-md` (448px), sempre centralizado — com mais conteúdo
   (Aparência, Segurança) a faixa estreita ficava mais óbvia. Trocado
   pro mesmo padrão de toda outra tela do app: sem largura máxima
   artificial, seções organizadas em `grid grid-cols-1 lg:grid-cols-2`
   (Conta ocupa as 2 colunas — tem mais campo —, Aparência e Segurança
   dividem a segunda linha). Dentro de "Conta", e-mail e nome de
   exibição também viram 2 colunas no desktop em vez de um campo
   solto esticado pela largura toda.

## ADR-060 — `Configurações` para de contrariar o próprio `DESIGN.md` (Fase 14m)

Revisão de design apontou que a tela nova (ADR-057/059) tinha 2 botões
grandes full-width preenchidos em `--color-accent` na mesma tela
("Salvar" e "Salvar nova senha") — contraria a regra já documentada de
"âmbar é ação primária, nunca decoração repetida". Também apontou:
inputs/select sem indício de hover (só focus), "Sair" sem nenhum
tratamento visual (parecia elemento esquecido, sem confirmação), e as
3 seções com peso visual idêntico apesar de frequência de uso muito
diferente. Não é decisão de identidade nova — é disciplina de aplicar
o que já existe, então implementado direto, sem pausar pra pergunta.

**Um só botão cheio de âmbar por tela:** "Salvar" (Conta, ação
frequente) continua `variant="primary"`; "Salvar nova senha"
(Segurança, ação rara) virou a nova `variant="outline"` do `Button`
(`border border-border bg-transparent text-text-primary
hover:bg-surface`) — primeiro uso de uma variante puramente neutra no
`buttonVariants`, sem cor de marca nem de erro. Os dois botões também
pararam de esticar full-width: eram filhos de `flex flex-col` (herdam
`align-items: stretch` por padrão); ganharam `self-end` pra encolher
pro tamanho do conteúdo e alinhar à direita do card.

**Hover em `Input`/`Select`/`Textarea`:** as 3 primitivas já tinham
`focus-visible:border-accent` — só faltava hover. Adicionado
`hover:border-text-secondary` (neutro, não usa âmbar — hover em campo
de formulário não é "ação primária") + `disabled:hover:border-border`
(não indicar hover em campo desabilitado). Corrigido nos 3 componentes
de uma vez (não só no que aparecia em Configurações), já que são
primitivas compartilhadas por todo o app.

**"Sair" ganha tratamento + confirmação:** botão com a mesma paleta de
badge de status usada em `MaintenanceItemCard`/`IssueListItem`
(border + tom de 10% de fundo + texto sempre na cor semântica, nunca
preenchido) — aqui com `--color-error`, já que é uma ação sem volta
fácil. Mantido como `<Button>` de tamanho normal (44px), não o badge
pequeno (`rounded-full text-xs px-2 py-0.5`) que aquelas telas usam
pra status — um badge desse tamanho falharia a regra de alvo de toque.
`SignOutDialog` (novo) segue exatamente o padrão do
`DeleteVehicleDialog`/`AlertDialog` já usado em todo o app.

**Reagrupamento por frequência de uso:** "Conta" (uso diário) saiu do
grid e virou seção isolada no topo, sozinha, mais destacada. "Segurança"
passou a conter também o "Sair" no mesmo card, com um divisor
(`border-t`) entre o formulário de senha e a ação de sair — as duas são
ações raras/de risco, ficam juntas e separadas do bloco de
personalização do dia a dia ("Aparência").

## ADR-061 — `Configurações` vira 1 painel com divisores em vez de 3 cards (Fase 14n)

Dois problemas de layout reportados no resultado do ADR-060:

1. **Altura de card esticada.** "Aparência" e "Segurança" viviam num
   `grid lg:grid-cols-2` sem `items-start` — o `align-items: stretch`
   padrão do grid forçava as duas colunas na mesma altura da mais alta
   (Segurança, com formulário de senha + "Sair"), deixando "Aparência"
   (só o select de tema) com bastante espaço vazio embaixo.
2. **Vão vazio entre campo e botão em "Conta".** Reportado como o
   botão "Salvar" parecendo empurrado pro rodapé do card. Medido por
   `boundingBox()` real (não só o olho): o espaço entre o fim do input
   e o topo do botão já era exatamente 16px (`gap-4`, igual o resto do
   app) — não havia stretch nem gap extra de verdade nessa medição
   específica. Ainda assim, a percepção de "vazio" fazia sentido: o
   botão pequeno e alinhado à direita (`self-end`), sozinho numa faixa
   larga, lê como "flutuando" mesmo com espaçamento correto. A
   reestruturação abaixo (painel único) elimina de vez qualquer dúvida,
   porque não sobra mais nenhum grid de colunas competindo por altura.

**Reestruturação:** trocado os 3 cards (`border` + `bg-surface`
próprios, competindo entre si — "grid de admin") por 1 painel só
(`rounded-lg border border-border bg-surface p-4`) com "Conta",
"Aparência" e "Segurança" como seções internas separadas por divisor
fino (`border-t border-border pt-4`), mesmo padrão que
`FinancialSummaryCard` já usa pra separar seus 2 blocos de `<dl>` — e
mais perto da identidade de "ficha técnica" do `VehicleCard` que o
resto do produto já estabeleceu, em vez do estilo genérico de shadcn
sem override. `items-start` também adicionado no sub-grid de "Conta"
(e-mail + nome de exibição) por disciplina, mesmo a medição não
confirmando stretch ali.

## ADR-062 — `useCurrentVehicleId` ganha fallback pra `/configuracoes` (Fase 14o)

Usuário reportou: entrar em Configurações "resetava" a sidebar/bottom
nav pro estado sem veículo selecionado (só "Minha garagem" +
"Configurações") — como se tivesse saído do contexto do carro, quando
na real só queria mexer numa preferência e continuar de onde estava.
Causa raiz: `useCurrentVehicleId` (`src/hooks/useCurrentVehicleId.ts`)
lê o veículo **só da URL** (`/v/:vehicleId/*`, RN-1 de
`specs/003-vehicle-shell/spec.md`) — regra certa pra páginas que são
"outro contexto" de verdade (a própria "Minha garagem", por exemplo,
onde não faz sentido nenhum veículo estar "selecionado"), mas errada
pra `/configuracoes`, que é uma tela de conta sobreposta, não uma
troca de contexto.

Decisão: guarda o último `vehicleId` lido da URL em `sessionStorage`
(`useEffect`, não durante o render) e usa como **fallback só quando
`location.pathname === ROUTES.configuracoes`** — em qualquer outra
rota sem veículo na URL (inclusive "Minha garagem"), o comportamento
continua exatamente o mesmo de antes: `null`, sem fallback. Não é uma
reversão geral do "veículo mora na URL, nunca em contexto React" — é
uma exceção nomeada, só pra essa rota, guardada como implementação de
persistência (não como fonte de verdade concorrente): se a pessoa
trocar de veículo de verdade, a URL manda de novo assim que ela sai de
`/configuracoes`.

Testado via `sessionStorage`/DOM real (não só lendo o código): sidebar
e bottom nav idênticos antes/depois de entrar em Configurações, com o
FAB e a aba "Mais" continuando habilitados pro veículo certo; "Minha
garagem" continua colapsando a navegação como sempre (comportamento
intencional do ADR-049, não afetado por esta mudança).

## ADR-063 — Corrige o ADR-062: "Minha garagem" limpa o veículo lembrado (Fase 14p)

O fallback do ADR-062 criou o efeito colateral oposto: `sessionStorage`
guarda o último `vehicleId` **pra sempre**, então o caminho Veículo →
Minha garagem → Configurações reaparecia com o veículo antigo — mesmo
a pessoa tendo saído dele de propósito pra ver a garagem inteira (não
por engano). Reportado pelo usuário como "ficou ao contrário": agora
Configurações mostra nav de veículo bem quando ele estava explicitamente
numa tela sem veículo nenhum.

Corrigido no mesmo hook: `ROUTES.home` (a própria "Minha garagem") agora
**limpa** o `vehicleId` guardado, além de nunca usá-lo como fallback
(já era assim). Resultado: Configurações só herda o veículo de quem
veio de **dentro** de um veículo — quem veio da garagem (ou de uma aba
nova, sessão fresca) vê Configurações com a navegação de conta só,
igual a garagem que acabou de deixar. Testado as 2 sequências de novo:
Veículo → Configurações (mantém nav do veículo) e Veículo → Garagem →
Configurações (nav volta a ser só conta) — as duas batem com o
comportamento esperado agora.

## ADR-064 — `ThemeToggle` sai do cabeçalho autenticado (Fase 14q)

Usuário apontou: o atalho de tema no cabeçalho (`AppShell`) ficou
redundante depois que Configurações ganhou o controle completo
(`ThemePreferenceSelect`, ADR-057/058). Removido de `AppShell.tsx` —
`ThemeToggle` continua existindo e é usado só em `AuthLayout` (tela de
login/cadastro, onde não há Configurações pra apontar). Cabeçalho
autenticado fica só com a marca (ícone + "Slow Garage", já linkando
pra home desde o ADR-059).

## ADR-065 — Marca do cabeçalho ganha presença (Fase 14r)

Usuário achou o cabeçalho "sem graça, não muito gearhead" — ícone
pequeno (`h-7`) e "Slow Garage" em `text-sm text-text-secondary`, mesmo
peso visual de qualquer texto secundário do app. Aumentado: ícone pra
`h-9`, texto pra `text-base font-bold uppercase tracking-wide
text-text-primary`.

Verificado que isso **não** abre um terceiro ponto de ousadia (a regra
"gaste a ousadia em um lugar" documentada em "Onde a ousadia mora"
continua valendo): sem trocar de família (`font-sans`/Space Grotesk,
não `font-hero`/Rajdhani — essa continua restrita ao wordmark de
`/entrar`, recusa já registrada antes), sem cor de marca (`text-primary`
é hierarquia normal, o mesmo tom que título de qualquer tela usa, não
`--color-accent`), sem traço/sublinhado decorativo. É volume dentro do
cromo quieto, não um novo elemento gráfico — mesma disciplina, com mais
peso.

## ADR-066 — Cabeçalho ganha o 3º toque de âmbar, conscientemente (Fase 14s)

O ADR-065 (só escala/peso, sem cor) não resolveu — usuário continuou
achando o cabeçalho "sem graça, não muito gearhead". Em vez de tentar
mais uma variação de tamanho às cegas pela 3ª vez, gerei 3 direções
reais (renderizadas com os tokens de cor de verdade, não descrição) e
pedi pra escolher: (A) emblema em moldura âmbar + traço fino embaixo
do texto, (B) só maior/mais espaçoso — mesma direção já tentada 2x,
(C) logo dominante com legenda temática embaixo (descartada por
exigir inventar uma frase de marca que não é decisão minha tomar).
Escolhida (A).

**Isso assume conscientemente um 3º ponto de âmbar**, sem ser um 3º
"ponto de ousadia" no sentido do wordmark de login ou do mostrador de
odômetro — a diferença é de escala e função:

- Moldura do ícone: `border-accent/40 bg-accent/5` — os mesmos 2 tokens
  já usados no placeholder de foto do `VehicleCard` (não é combinação
  nova).
- Traço embaixo do texto: `h-0.5 w-8 bg-accent` — 2px, 32px de largura,
  ao lado de sidebar e conteúdo o tempo todo. O traço do wordmark de
  login é `h-0.5 w-16` (64px), sozinho numa tela hero sem mais nada ao
  redor. A proporção e o contexto continuam bem diferentes — não é o
  mesmo elemento reaproveitado, é um eco pequeno.
- Continua Space Grotesk (`font-sans`), não Rajdhani (`font-hero`) — a
  recusa de usar a fonte condensada fora do wordmark de login (já
  registrada antes) continua de pé. Essa é a fronteira que realmente
  separa "cabeçalho com identidade" de "duplicar o hero".

Se essa combinação (moldura + traço) aparecer em mais um lugar no
futuro, vale revisar se "gaste a ousadia em um lugar" ainda descreve o
produto com precisão — por ora, com âmbar em exatamente 3 pontos (login,
odômetro, cabeçalho) e os 2 primeiros claramente maiores/mais isolados
que este, a regra ainda orienta decisão, só não é mais "literalmente 2".

## ADR-067 — Cabeçalho ganha sino de alertas, troca rápida de veículo e menu de usuário (Fase 14t)

Pedido do usuário já veio com o nível de detalhe de uma spec (fonte de
dado, regra de cor, o que reaproveitar de cada elemento) — implementado
direto numa passada (spec→implementação→verificação), sem abrir pasta
`specs/` própria, mesmo padrão usado nas Fases 14d/14g/14k desta sessão
pra features de tamanho parecido.

**Sino de alertas (`HeaderAlertsMenu`):** mesmo padrão do
`useGarageSummary`/`useGarageTimeline` (ADR-051/053) — sem RPC de
garagem, `useGarageAlerts` busca `vehicle_alerts` com `vehicle_id IN
(...)`. Badge só aparece com `count > 0`; cor vem de `severity ===
"critical"` (a mesma checagem que `AlertBanner` já faz, não uma nova
regra) — `--color-error` se houver qualquer alerta crítico, senão
`--color-warning`. O popover **reaproveita o próprio `AlertBanner`**
(não recria a formatação/copy) — só agrupa por veículo com um rótulo
(`text-xs uppercase tracking-wide`, mesmo padrão do `GarageActivityFeed`)
quando há 2+ veículos.

**Troca rápida de veículo (`HeaderVehicleSwitcher`):** só aparece com
2+ veículos **e** dentro do contexto de um veículo
(`useCurrentVehicleId`, com a exceção de Configurações do ADR-062/063)
— sem veículo atual não há o que mostrar como "ativo". Placa em tag
mono, mesmo padrão exato do `VehicleCard` (Fase 14e). Trocar de veículo
sempre vai pro Dashboard dele (`ROUTES.vehicle`), mesmo comportamento
do seletor "Trocar de veículo" que já existe dentro da própria
`VehiclePage` — não inventou um comportamemto "mais esperto" (preservar
sub-rota) que não foi pedido.

**Menu de usuário (`HeaderUserMenu`):** `profiles.avatar_url` (real,
existe na tabela) > iniciais de `display_name` > ícone genérico —
nessa ordem, nunca inventando uma das duas primeiras quando falta dado.
"Sair" abre o mesmo `SignOutDialog` já usado em Configurações (mesmo
componente, não uma cópia) — só o `handleSignOut` (2 linhas: `signOut()`
+ `navigate`) é replicado, porque replicar isso não é "duplicar lógica"
no sentido que o pedido queria evitar (a lógica de confirmação, que é o
componente inteiro, é a mesma instância de código).

**Ícones:** o pedido citou "Tabler outline" — este projeto usa só
`lucide-react` em todo o resto do app (nenhum outro ponto usa Tabler).
Implementado com os equivalentes de `lucide-react` (`Bell`,
`ChevronDown`, `User`, `Settings`) em vez de instalar uma segunda
biblioteca de ícone só pra 4 ícones — a própria instrução do pedido
("seguir DESIGN.md, não inventar novo padrão") pesa a favor de manter
1 biblioteca só; sinalizado aqui em vez de decidido em silêncio.

**Novo primitivo:** `@radix-ui/react-popover` instalado —
`src/components/ui/popover.tsx` segue o mesmo wrapper (`Portal` +
classes de entrada/saída) que `dialog.tsx`/`alert-dialog.tsx` já usam,
reaproveitado pelos 3 componentes acima (não é 1 popover por
componente).

**Breakpoint:** todo o cluster (`hidden lg:flex`) — mesmo breakpoint
que já separa `Sidebar` (`lg:flex`) de `BottomNav` (`lg:hidden`); no
mobile os 3 elementos já têm equivalente (bottom nav, telas de veículo,
Configurações), como o pedido observou.

**Achado fora de escopo, não mexido agora:** `profiles.theme` (enum
`"dark" | "light" | "system"`) já existe no banco — a Fase 14k
(ADR-058) implementou o mesmo conceito de preferência de tema
inteiramente em `localStorage`/`sessionStorage`, sem saber que a coluna
já existia (não tinha sido checado o schema na hora). Hoje a preferência
de tema não sincroniza entre dispositivos, mesmo o banco já suportando
isso. Fora do pedido desta fase — registrado aqui pra não se perder.

## ADR-068 — Corrige o ADR-067: sino/troca de veículo/menu também no mobile (Fase 14u)

O pedido original (ADR-067) dizia explicitamente pra não colocar esses
3 elementos no mobile — "já existem via bottom nav/telas próprias".
Usuário testou e reverteu: os equivalentes de mobile não cobrem o
mesmo caso (não existe hoje um contador de alertas de **toda a
garagem** fora do cabeçalho, por exemplo) — pediu pra sempre pensar em
desktop **e** mobile ao implementar qualquer coisa (memória salva:
`feedback_always_desktop_and_mobile`).

Removido o `hidden lg:flex` do cluster — os 3 componentes (já
prontos, sem lógica nova) agora renderizam em qualquer largura. Dois
ajustes de responsividade pra caber num cabeçalho de ~390px sem
quebrar linha:

- Nome do veículo no `HeaderVehicleSwitcher` some abaixo de `sm`
  (`hidden sm:inline`) — só placa + chevron no mobile, com
  `aria-label` explícito no botão cobrindo o nome que sumiu
  visualmente (nunca perde o texto pra leitor de tela, só pra quem
  enxerga).
- Wordmark (`AppShell`) ganha `truncate` + tamanho responsivo
  (`text-base sm:text-lg`) e o ícone encolhe (`h-9 sm:h-11`) — sem
  isso, "SLOW GARAGE" quebrava em 2 linhas assim que o cluster novo
  disputava espaço na mesma largura de 390px.

De brinde, corrigido um alvo de toque real: o avatar do
`HeaderUserMenu` estava `h-9 w-9` (36px), abaixo do mínimo de 44px que
o resto do app usa (`Button` `size="icon"`) — passou pra `h-11 w-11`.
Não fazia sentido um elemento novo desrespeitar a própria regra de
acessibilidade do produto, mobile ou não.

Verificado sem overflow horizontal em 390px, 700px e 1280px (medido
via `scrollWidth`/`clientWidth`, não só o olho).

## ADR-069 — Tema passa a sincronizar via `profiles.theme` (achado do ADR-067)

O ADR-067 registrou um achado fora de escopo: `profiles.theme` (enum
`dark`/`light`/`system`) já existe no banco, mas a Fase 14k (ADR-058)
implementou a preferência de tema inteiramente em
`localStorage`/`sessionStorage`, sem saber disso — tema não
sincronizava entre dispositivos. Usuário pediu pra verificar se
precisava de alguma mudança de backend antes de implementar; a
resposta foi não — a coluna e a permissão de escrita (mesma política
de RLS que `display_name` já usa com sucesso) já existiam. Implementado
só no frontend.

**Push:** `useUpdateThemePreference` (novo, mesmo padrão de
`useUpdateDisplayName`) — `ThemePreferenceSelect.handleChange` chama
`setPreference` (aplica local na hora) **e** a mutation (grava no
banco), nessa ordem.

**Pull:** `ThemeProfileSync` (novo, componente que só roda efeito,
`return null`) — monta dentro de `AuthProvider` (children do
`Providers`), lê `useProfile()` e chama `setPreference` quando
`profile.theme` chega ou muda e difere do estado local. Só puxa,
nunca empurra de volta — evita round-trip redundante quando o pull é
consequência do próprio push do mesmo dispositivo.

`localStorage` continua existindo (`getStoredPreference`/
`storePreference`, `lib/theme.ts`) — é o que aplica o tema instantâneo
antes do primeiro paint e antes do perfil carregar (login, ou qualquer
tela pré-autenticação), e o fallback quando não há sessão. Não foi
removido, só deixou de ser a única fonte.

Testado com 2 contextos de navegador isolados (sem
`localStorage` compartilhado, simulando 2 dispositivos) com o mesmo
login: mudar pra "Claro" no primeiro e abrir uma sessão nova do zero
no segundo aplicou "Claro" imediatamente, sem nunca ter passado por
esse `localStorage` — confirma que o pull vem mesmo do banco, não de
storage compartilhado por acidente (mesmo host de dev).

## ADR-070 — Grade de instrumentos: o padrão de tile sai do card do veículo e vira layout de painel (Fase 15d)

O "Comparativo da garagem" (Fase 15) nasceu como 4 pares label/valor
soltos num card, com `gap-4` entre eles e nada mais — o mesmo "grid de
admin genérico" que o ADR-061 já tinha corrigido em Configurações e que
a Fase 14c tinha tirado do `VehicleCard`. Num painel largo de desktop o
espaço vazio entre os pares fazia cada número flutuar sem pertencer a
lugar nenhum.

Adotado: **módulo separado por fio de 1px (`--color-border`)**, não card
dentro de card. O painel é uma superfície só (`rounded-lg border
bg-surface overflow-hidden`); dentro dele, cabeçalho com `border-b`,
grade de módulos com linha interna, e a seção de gráfico separada por
outro `border-t`. Cada módulo é `px-4 py-3` com rótulo
`text-xs text-text-secondary`, valor em `font-mono text-text-primary` e
uma segunda linha opcional de contexto (de qual veículo, quantos
vencidos) — nunca um segundo número solto.

**Por que fio e não caixa:** aninhar módulos com borda própria dentro de
um card que já tem borda recria exatamente o problema dos "3 cards
competindo entre si" que o ADR-061 resolveu. O fio dá a leitura de
instrumento (mostrador dividido) sem somar uma segunda moldura.

**Técnica:** `-mt-px -ml-px` na grade + `border-t border-l` em cada
módulo, com `overflow-hidden` no painel. Cada linha interna é desenhada
uma vez só e as externas caem debaixo da borda do painel. Escolhido em
vez de `gap-px` com fundo de borda porque funciona em qualquer contagem
de coluna sem célula vazia sobrando quando o número de módulos não é
múltiplo das colunas do breakpoint.

Isso **generaliza** pra fora do `VehicleCard`/`VehicleMetricsRow` o que
até aqui era só "tile dentro do veículo": qualquer painel de leitura
agregada do app passa a ter uma forma canônica. Registrado em
DESIGN.md ("Densidade").

## ADR-071 — Esteira: CI no GitHub Actions, deploy pela integração da Vercel (Fase 16)

Primeira automação do repositório. Duas responsabilidades separadas de
propósito: **o Actions verifica, a Vercel publica.**

**Deploy pela integração Git da Vercel, não por workflow.** A alternativa
era rodar `vercel deploy` dentro do Actions, o que exigiria três segredos
no GitHub (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) e
reimplementar à mão o que a integração já faz de graça: preview por
branch e por PR, comentário no PR com a URL, e rollback de um clique no
painel. Para um projeto de uma pessoa, o controle a mais não paga o
custo de manter token e reproduzir a esteira de preview.

**`main` é produção, `dev` é preview.** `dev` recebe todo merge de fase e
ganha uma URL de preview estável; publicar em produção é um merge
`dev` → `main`, que é o ponto onde alguém decide "isso vai pro ar".
Consequência assumida: `main` estava 103 commits atrás quando isto foi
configurado, então o primeiro deploy de produção exige esse merge.

**O CI não bloqueia o deploy sozinho.** A integração da Vercel publica
mesmo com o Actions vermelho — quem amarra os dois é proteção de branch
no GitHub exigindo o check "Lint + build" no PR pra `main`. Sem isso, o
CI é só sinal, não portão. Fica registrado porque é o tipo de coisa que
se assume estar funcionando sem estar.

**Ressalva descoberta ao aplicar (mesma fase).** Essa proteção não estava
disponível: no plano Free do GitHub, ruleset e branch protection só
existem em repositório **público**, e este era privado. A API respondia
`403 — Upgrade to GitHub Pro or make this repository public`. As três
saídas eram: pagar o Pro, abrir o repositório, ou aceitar o CI como sinal
sem portão. Escolhida **abrir o repositório**, porque ele passou a servir
de portfólio — decisão independente, que por acaso destravou isto. Antes
de abrir, verificado que o `.env` nunca entrou no histórico e que nenhuma
senha foi commitada (busca com pickaxe em todos os commits).

Com o repositório público, o ruleset foi criado na `main`: `deletion`,
`non_fast_forward`, `pull_request` com **0 aprovações exigidas** (num
projeto de uma pessoa, exigir 1 tranca o autor fora da própria branch,
porque ninguém aprova o próprio PR) e `required_status_checks` com o
contexto `Lint + build`. Consequência aceita: push direto na `main`
deixou de existir — toda mudança entra por PR.

**O que o CI roda:** `npm run lint` e `npm run build` (que é
`tsc -b && vite build`, então cobre checagem de tipo). **Não roda teste
automatizado porque não existe nenhum no projeto** — a verificação de
comportamento é manual, com Playwright contra o app real, no gate de
verificação de cada fase (`specs/*/verification.md`). Registrar isso
evita a leitura errada de "CI verde = comportamento verificado": aqui
verde significa "compila e passa no lint", nada além.

**O build do CI roda sem as variáveis do Supabase.** Confirmado
empiricamente (`VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npm run
build` → exit 0): `vite build` só substitui `import.meta.env.*` no
bundle, não executa o código, e o `throw` de `lib/supabase.ts` é de
runtime. O artefato do CI não é publicado, então não precisa ser
funcional — quem precisa das variáveis de verdade é a Vercel.

**Node fixado em 22** (`.nvmrc` + `engines.node`), o mesmo do ambiente de
desenvolvimento, lido tanto pelo `setup-node` quanto pela Vercel — evita
o clássico "funciona local, quebra no build" por diferença de major.

**`sw.js` e `manifest.webmanifest` com `max-age=0, must-revalidate`** em
`vercel.json`. O `vite-plugin-pwa` gera esses dois sem hash no nome; se
o service worker for cacheado, o usuário fica preso numa versão antiga
do app mesmo depois de publicar uma nova. O resto do `dist/` tem hash no
nome e pode ser cacheado pra sempre pelo padrão da Vercel.

**Formatação não entra no CI**: o projeto não tem `prettier` nas
dependências nem arquivo de configuração. O que foi formatado até aqui
saiu de `npx prettier` com os defaults, o que casou com o estilo do
código por sorte, não por contrato. Adicionar `prettier` + `--check` no
CI é uma decisão de projeto pendente, não um detalhe de esteira.

## ADR-072 — O padrão de tema passa a ser o sistema operacional, e o login perde o controle de tema

Duas mudanças ligadas, decididas juntas.

**O padrão sem preferência salva vira `"system"`, não `"dark"`.** Isso
reverte explicitamente o "o que continua igual" do ADR-067: lá ficou
registrado que dark seguiria sendo o padrão absoluto de quem nunca
escolheu nada, e "seguir o sistema" só entraria por escolha consciente
em Configurações. Não é mais verdade. Quem nunca mexeu em nada agora
recebe o tema do SO; `"dark"` e `"light"` no `localStorage` passam a
significar exclusivamente escolha explícita da pessoa. `getStoredPreference()`
inverteu a validação por causa disso — antes aceitava `"light"`/`"system"`
e caía em `"dark"`, agora aceita `"light"`/`"dark"` e cai em `"system"`.

**O script inline do `index.html` mudou junto, e é a metade fácil de
esquecer.** Ele aplica a classe `.light` antes do primeiro paint pra não
piscar; se só o TypeScript tivesse mudado, quem está com o SO em claro
veria um flash escuro em toda carga. A condição virou `stored === "light"
|| (stored !== "dark" && prefersLight)`. Verificado com o bundle do React
bloqueado, de modo que a classe observada vem só do script inline: SO
claro sem nada salvo → `.light`; SO escuro sem nada salvo → sem classe;
salvo `dark` com SO claro → sem classe; salvo `light` com SO escuro →
`.light`.

**`ThemeToggle` foi deletado.** O ADR-064 já o havia tirado do cabeçalho
autenticado, deixando `AuthLayout` como último uso — com o padrão
seguindo o SO, esse último uso também deixou de fazer sentido: a tela de
login vira uma decisão a menos antes de entrar. Sem nenhum consumidor
restante, o componente saiu do repositório em vez de ficar órfão, e
`toggleTheme` saiu junto do `ThemeContext` (era usado só por ele). O
controle de tema existe agora em um lugar só: `ThemePreferenceSelect`,
em Configurações, com as três opções.

**Limitação conhecida:** o `<meta name="theme-color">` do `index.html`
continua fixo no escuro (`#121316`). Quem usa o SO em claro vê a barra do
navegador/PWA escura contra uma interface clara. Fica registrado por ser
exatamente o tipo de ponta solta que se assume resolvida junto.

## ADR-073 — Campo de senha com olho de mostrar/ocultar (`PasswordInput`)

Digitar senha às cegas no celular é a maior fonte de erro de login do
app, e o `type="password"` estava repetido em quatro formulários
(`SignInForm`, `SignUpForm`, `UpdatePasswordForm`, `ChangePasswordForm`).
Em vez de acrescentar o botão em cada um, o campo virou um componente:
`components/ui/password-input.tsx` envolve o `Input` já existente e é
dono do `type` — quem usa não passa `type`, e é impossível ter um campo
de senha do app sem o olho.

Três decisões dentro dele:

* **`tabIndex={-1}` no botão, de propósito.** Quem digita senha e aperta
  Tab quer o próximo campo ou o botão de entrar, não o olho no meio do
  caminho. Verificado: a partir do e-mail, Tab vai pra senha e o Tab
  seguinte vai pro "Entrar". O botão continua clicável e continua
  anunciado por leitor de tela, só não está na ordem de tabulação
* **44px de alvo de toque** (`h-11 w-11`), como o resto do app — medido,
  não presumido. O campo ganhou `pr-11` pra o texto não passar por baixo
* **`aria-label` alternando "Mostrar senha"/"Ocultar senha"** mais
  `aria-pressed`, em vez de rótulo fixo: o estado é a informação que
  importa, e o ícone sozinho (`aria-hidden`) não diz nada

## ADR-074 — O que fica versionado num repositório público de portfólio (Fase 18)

O repositório passou a ser público (ver a ressalva do ADR-071) e a servir
de portfólio. Isso muda o critério do que merece estar versionado: **o
produto e as decisões de engenharia, não o ferramental de quem
desenvolve.**

**Saíram do controle de versão** (continuam no disco, agora ignorados):
`.claude/` — configuração do assistente de código — e o prompt de
bootstrap do projeto. Nenhum dos dois é consumido pelo build, pelo CI ou
pelo deploy; são ferramenta pessoal, do mesmo tipo que configuração de
editor.

**Ficaram, deliberadamente:** `specs/` e `docs/DECISIONS.md`/`DESIGN.md`.
São o maior ativo técnico do repositório — mostram alternativa descartada,
regra de negócio explícita e verificação com evidência colada. Um
repositório de portfólio sem isso é só código sem raciocínio.
`scripts/ui-check.mjs` também ficou: é varredura real de acessibilidade e
responsividade (Playwright + axe), parte do processo, não do andaime.
`5348.png` ficou por ser o logo-fonte que `scripts/generate-icons.mjs`
consome — o nome ruim é dívida cosmética, mas renomear quebraria as
referências históricas nas specs, que descrevem o que aconteceu na época.

**Armadilha encontrada na execução, registrada pra não repetir:**
`git rm --cached` mantém o arquivo no disco, mas quando **o commit de
deleção é mergeado numa branch onde o arquivo ainda era rastreado**, o
git apaga o original do disco de verdade. Foi o que aconteceu — os 10
arquivos de `.claude/skills/` e o prompt sumiram, e foram restaurados do
histórico (`git archive <commit> <path> | tar -x`, que não mexe no
índice), conferidos um a um contra o commit de origem. O jeito seguro é
copiar pra fora do repositório **antes** de desversionar.

**O limite honesto desta limpeza:** tirar arquivo do topo não tira do
histórico. Quem navegar pelos commits ainda encontra `.claude/skills/*` e
o prompt inteiros, e 48 dos 112 commits carregam trailer de
`Co-Authored-By`. Mudar isso exigiria reescrever o histórico e forçar o
push — o que muda todos os SHAs, colide com a regra `non_fast_forward`
recém-criada na `main`, e deixa os PRs e os registros de deploy da Vercel
apontando pra commits órfãos. Avaliado e **não feito**: o custo é real e o
ganho é sobre um leitor hipotético que vasculha 112 commits, não sobre
quem abre o repositório.

**README** ganhou o link do app publicado logo no topo — o item de maior
valor num repositório de portfólio — e a seção de deploy deixou de ser um
passo a passo de "como eu publicaria" pra descrever a esteira que existe
de verdade.

## ADR-075 — FIPE: o pressuposto do backend não se confirmou, e o que foi feito com isso (Fase 020)

O pedido da fase 020 trazia um pressuposto explícito: o backend já teria
`fipe_brands`, `fipe_models` (RLS de leitura pra `authenticated`) e as
colunas `fipe_brand_id`/`fipe_model_id` em `vehicles`, bastando
sincronizar `database.types.ts`.

**Sincronizado primeiro, como manda a regra do projeto — e o pressuposto
caiu.** `SUPABASE_PROJECT_ID=… npm run types` contra o projeto remoto
devolveu um arquivo com **zero** ocorrências de `fipe`, e `vehicles`
segue sem as duas colunas. (O diff de 2.980 linhas contra o arquivo
antigo era só CRLF↔LF; o conteúdo é idêntico.)

Três saídas possíveis: parar e devolver o pedido; inventar os tipos e
codar contra um contrato imaginário; ou entregar a feature inteira
mantendo a costura no lugar certo. **Escolhida a terceira.**

**O que mudou em relação ao pedido:**

1. `fipeCache` mantém a interface pedida (`getBrands()`,
   `getModelsByBrand(brandId)`) mas hoje delega pra API externa. Quando a
   migration entrar, a troca é dentro dessa função — nenhum hook,
   componente ou verificação muda. O arquivo carrega o SQL pretendido em
   comentário.
2. **Gravar `fipe_brand_id`/`fipe_model_id` não foi implementado.** As
   colunas não existem. Os códigos já saem no `FipeFillPayload` do
   assistente, então ligar isso depois é uma linha no `VehicleForm`.
3. `useFipeYears` recebe `brandCode` além do `modelCode`: a API exige a
   marca no caminho (`/marcas/{marca}/modelos/{modelo}/anos`). A
   assinatura do pedido não era suficiente.

**Consequência aceita:** enquanto marca e modelo vierem do externo, eles
herdam a fragilidade de rede que era pra ser só do ano e do valor. A UI
trata os quatro iguais — cada consulta com seu estado de erro local — o
que aliás deixa o componente pronto pros dois mundos.

**`cmdk` como dependência nova.** O projeto tem a regra de não instalar
sem necessidade real. A necessidade: 107 marcas e 585 modelos numa marca
comum (medido na Fiat), e `<select>` nativo não filtra por digitação.
Escrever combobox acessível à mão (teclado, `aria-activedescendant`,
foco) é justamente o tipo de coisa que se erra em silêncio — e o próprio
pedido citou o Combobox do shadcn, que é `cmdk` por baixo. Radix Popover,
que já estava no projeto, dá o resto.

**RN-1 é a regra que molda a UI:** nada da FIPE é dado calculado pelo
sistema. O valor aparece rotulado com o mês de referência da tabela e a
frase "É uma sugestão — o campo continua editável", e só entra no
formulário por clique. Vai pro mesmo `<input>` que o usuário digitaria,
nunca num campo somente-leitura — o oposto de `cost_per_km`, que vem de
view e o usuário não edita.

## ADR-076 — Corrige o ADR-075: as tabelas FIPE existiam, e a persistência foi ligada (Fase 023)

O ADR-075 registrou que o schema não tinha `fipe_brands`, `fipe_models` nem
`vehicles.fipe_brand_id`/`fipe_model_id`, e que por isso `fipeCache` lia da
API externa e os IDs não eram gravados. **Isso não vale mais.**

**O que aconteceu.** O backend contestou, dizendo que as colunas existiam
desde a Fase 11 e que o problema seria tipo desatualizado no front. A
checagem decisiva não foi regerar tipo, e sim perguntar ao PostgREST — que
recusa coluna inexistente no parse, independente de RLS:

```
select=id,fipe_brand_id,fipe_model_id  -> 200
select=id,coluna_que_nao_existe        -> 400  42703 column ... does not exist
```

As colunas existem. **A medição do ADR-075 estava certa no momento em que
foi feita** (`npm run types` contra o projeto remoto, zero ocorrência de
`fipe`) — o mais provável é que a migration tenha entrado depois. Não é
caso de culpar a ferramenta: é caso de refazer a leitura antes de tratar
"não existe" como permanente. Fica a lição: quando o backend contradiz o
tipo gerado, o árbitro é a API do banco, não o arquivo local.

**Estado real, medido:** `fipe_brands` com 107 linhas, `fipe_models` com
7.366. Os códigos casam com a API externa (marca 21 = Fiat nos dois; a
Fiat tem 585 modelos em ambos).

**A armadilha dos dois identificadores.** `fipe_models` tem `id` (PK
serial) **e** `fipe_model_code` (o código da FIPE), e são números
diferentes. `vehicles.fipe_model_id` é FK pra `fipe_models.id`, mas a API
externa só entende `fipe_model_code`. Confundir os dois não dá erro de
tipo — dá consulta do carro errado, em silêncio. Medido no teste real: o
veículo gravou `fipe_model_id=5491` enquanto a chamada externa usou
`5901`. Por isso `FipeCachedModel` carrega os dois campos com nome
explícito.

**`fipeCache` passou a ler do Supabase**, como a spec original pedia — a
troca foi dentro daquela função, sem tocar em hook, componente ou
verificação, exatamente o que a interface tinha sido desenhada pra
permitir. Marca e modelo agora vêm de dado sob nosso SLA; ano e valor
seguem no externo, porque tabela de preço muda de mês em mês e o backend
não cacheia.

**Regra nova (RN-8): ID da FIPE que contradiz o texto é pior que ID
ausente.** Se o usuário preenche pelo assistente e depois edita marca ou
modelo à mão, `fipe_brand_id`/`fipe_model_id` são limpos. Sem isso, o
banco guardaria "este carro é o modelo 5491" ao lado de um texto escrito
à mão que diz outra coisa — o tipo exato de dado silenciosamente errado
que este assistente existe pra evitar.

**Bug pego antes de ir pro ar:** `toFormDefaults` do `EditVehicleDialog`
não carregava as duas colunas novas. Como o payload manda `?? null`,
abrir a edição e salvar sem tocar no assistente **apagaria** a
identificação já gravada. É a terceira vez que o `Edit` divergir do
`Create` morde neste projeto (ver ADR-048) — a conferência campo a campo
no diálogo de edição não é opcional.

## ADR-077 — A escolha da FIPE mora nos campos Marca e Modelo (Fase 026)

**Contexto.** Desde a Fase 020 o preenchimento por FIPE era um bloco
separado, acima do formulário: a pessoa abria "Buscar dados na FIPE",
escolhia marca e modelo lá dentro e o assistente copiava o resultado pros
campos. Funcionava, mas era um segundo lugar para fazer a mesma coisa —
quem chegava no campo "Marca" e digitava nunca descobria que havia uma
lista. O bloco só ajudava quem o encontrasse primeiro.

**Decisão.** A cascata some como bloco e vira o próprio campo. Marca e
Modelo passam a ser **combobox editável** (`ComboboxInput`): a lista da
FIPE aparece ao focar, e quem não acha o carro digita e segue.

Consequências:

- **Escolher da lista identifica o veículo** e grava `fipe_brand_id` /
  `fipe_model_id`. **Digitar limpa os dois** — texto que não corresponde
  ao id é dado silenciosamente errado (RN-8).
- A lista de modelos depende da marca *identificada*, não do texto. Sem
  marca da lista, o campo Modelo é um input comum.
- A consulta de valor de referência sobrou como bloco próprio
  (`FipeValueLookup`), e **só aparece com o veículo identificado** — sem
  id não há o que consultar. `FipeAssistant.tsx` foi removido.

**`ComboboxInput` não usa cmdk, de propósito.** O `Command.Input` gera o
próprio `id` (via `@radix-ui/react-id`) e descarta o que recebe, o que
deixa o `<label htmlFor>` apontando pra nada — campo de formulário sem
rótulo associado é defeito de acessibilidade, não detalhe de teste. O
Popover do Radix tinha o mesmo efeito. Como o teclado deste padrão é
curto (setas, Enter, Escape), sai mais barato escrever do que contornar.
O cmdk segue no `Combobox` de seleção fechada, onde o input é interno.

**Escape passou a ser tratado em camadas, no `DialogContent`.** Com a
lista aberta, Escape fecha só a lista; o diálogo continua. Sem isso,
dispensar as sugestões jogava fora o formulário inteiro. A regra precisa
morar no diálogo porque o Radix escuta a tecla no `document` em fase de
**captura** — nenhum `stopPropagation` no combobox chega a tempo. O
diálogo se guia pelo `aria-expanded` de quem está focado, então vale pra
qualquer popup interno, não só este.

**Verificação** (Playwright + axe, 390px e 1440px): escolha pela lista
grava os ids (`fipe_brand_id: 44`, `fipe_model_id: 5491`, conferido no
banco após recarregar); marca digitada fora da FIPE grava com os dois
`null` e não oferece consulta de valor; setas movem a opção ativa; Enter
escolhe **sem enviar** o formulário; zero violações sérias com a lista
aberta; sem overflow horizontal.

Dois achados vieram daí e foram corrigidos: a caixa de "não está na FIPE"
cobria o campo seguinte e engolia o clique de quem só queria seguir em
frente (agora atravessável), e a região que rola precisava de acesso por
teclado (o scroll passou pra `listbox`, que é focável).

## ADR-078 — Valor da FIPE no painel do veículo, com botão de reconsultar (Fase 027)

**Contexto.** Depois da Fase 026 o veículo pode ficar **identificado** na FIPE
(`fipe_brand_id` e `fipe_model_id` gravados ao escolher da lista), mas isso não
aparecia em lugar nenhum depois do cadastro. O valor de referência só existia
dentro do formulário, no momento de preencher.

**Decisão.** O painel do veículo passa a mostrar o valor da tabela FIPE, com um
botão de atualizar **ao lado do número** — não no canto do card: no desktop
isso deixaria o botão a meia tela de distância do que ele atualiza.

Como o ano é resolvido:

- A linha da FIPE precisa de marca, modelo **e ano**. O ano vem do
  `model_year` do veículo; entre as variações do mesmo ano (a FIPE separa por
  combustível) escolhemos pela pista do `fuel_type`, com "Flex" antes de
  "Gasolina" porque a tabela usa os dois pro mesmo carro.
- É palpite, então **o ano escolhido vai pra tela** junto do valor ("2015
  Flex"): quem conhece o próprio carro vê na hora se pegamos a linha errada.
- Sem identificação, sem ano, ou com o ano ausente da tabela, o card **diz o
  que falta** e oferece a ação (abrir a edição) em vez de sumir.

**O valor da FIPE não sobrescreve nada sozinho** (RN-1). Ele alimenta o resumo
financeiro através de `estimated_current_value`, e trocar esse número por conta
própria mudaria o patrimônio do usuário pelas costas. O card compara os dois e
**oferece** a troca; quem decide é o dono do carro.

**Cache.** `useFipeEstimatedValue` ganhou `staleTime` de 6h. A tabela FIPE muda
de mês em mês, e o painel consulta a cada visita — reperguntar de hora em hora
a um terceiro sem SLA é desperdício puro. O botão chama `refetch()`, que passa
por cima do `staleTime`.

**Verificação** (Playwright + axe, 390px e 1440px): valor exibido com mês de
referência e ano usado; botão de 44×44 que de fato refaz a chamada à API
externa; adotar o valor grava no banco (conferido por leitura direta após
recarregar); com estimado divergente o card aponta a diferença e oferece a
troca; com estimado igual, diz que está igual; veículo sem identificação mostra
o que falta com ação; zero violações de acessibilidade e sem overflow.

## ADR-079 — Corrige o ADR-074: quatro skills são regra de projeto, não ferramental (Fase 028)

**Contexto.** O ADR-074 tirou `.claude/` do controle de versão quando o
repositório virou público, classificando tudo ali como "ferramental de quem
desenvolve, do mesmo tipo que configuração de editor". A classificação estava
certa para parte do conteúdo e errada para a outra.

O furo apareceu na pergunta óbvia de quem for contribuir: **o README afirma
práticas cuja definição estava no `.gitignore`.** Ele diz que cada fase é
verificada com Playwright, que métrica derivada nunca é recalculada no cliente,
que toda tela tem quatro estados — e o arquivo que define o que isso significa
na prática não vinha no clone.

**Decisão.** Quatro das seis skills voltam ao controle de versão, porque não são
preferência de quem desenvolve — são as regras do projeto em forma executável:

| Skill | O que define | Onde o README já prometia |
|---|---|---|
| `sdd` | ciclo spec → plano → tasks → verificação, proibição de inventar requisito | Roadmap |
| `slow-garage-data` | query keys, invalidação, path do Storage, tradução de erro | Data access |
| `ui-verify` | verificação por execução, 320/390/768/1440, overflow, axe | Scripts |
| `design-review` | tokens, quatro estados, alvo de toque, semântica, idioma | Design |

`frontend-design` e `ai` **continuam fora**: a primeira é direção visual
genérica, reaproveitável em qualquer projeto; a segunda é um stub de 8 linhas
com `description: TODO`. Essas sim são ferramental.

**A ressalva que motivou o `CONTRIBUTING.md`.** Skill só funciona no Claude
Code. Quem contribuir de outro editor não herda nada de `.claude/skills/`, e
versionar a skill sozinha daria a falsa sensação de que a regra está
comunicada. Então as mesmas regras foram escritas em prosa no
`CONTRIBUTING.md`, que é a versão que vale — a skill é a forma executável dela,
e se as duas divergirem, o defeito é da skill.

**Duplicação removida no caminho.** `ui-verify/references/ui-check.mjs` era
cópia byte a byte de `scripts/ui-check.mjs`. Versionar as duas colocaria 177
linhas repetidas no repositório — exatamente o que a skill `design-review`
reprova. A referência ficou ignorada e a skill passou a apontar para o script do
repo. Havia também um diretório `{ui-verify` com nome literal, resto de uma
expansão de chaves que não expandiu na restauração descrita no ADR-074; apagado.

**O que este ADR não muda.** O limite honesto do ADR-074 continua valendo: tirar
arquivo do topo não tira do histórico, e reescrever histórico segue avaliado e
não feito pelos mesmos motivos.

## ADR-080 — Fotos ganham tela própria e a capa deixa de depender de um clique extra

**Contexto.** Três lugares do app abriam o diálogo "Adicionar foto" — o
quick action do painel do veículo, o do card da garagem e o item "Foto" do
FAB — e nenhum dos três levava a lugar nenhum depois do envio. A galeria
existia como **quarta aba dentro de "Documentos"**, sem item na sidebar nem
na folha "Mais". Somado a isso, `useUploadGalleryPhoto` nunca escrevia
`primary_photo_id`: só o upload de dentro de "Editar veículo" definia capa.
O efeito combinado, relatado pelo usuário, é que a foto enviada parecia
sumir — não aparecia no card, não aparecia no painel e a galeria que a
continha não tinha porta de entrada.

**Decisão.**

- **Galeria vira rota de verdade**: `/v/:vehicleId/fotos`
  (`features/photo/PhotosPage`), com item "Fotos" na sidebar e na folha
  "Mais". `PhotoGallery`, `PhotoCard`, `UploadPhotoDialog` e
  `useVehicleGallery` saíram de `features/document` para
  `features/photo`, junto com as categorias de foto, que viraram
  `features/photo/schemas.ts`. A aba "Fotos" de "Documentos" foi removida —
  um lugar só, não dois.
- **A primeira foto do veículo vira capa sozinha.** O update usa
  `.is("primary_photo_id", null)`, então preenche quando não há capa e
  nunca sobrescreve uma escolha feita no botão "Definir como capa".
- **Quem envia fora da galeria é levado até ela.** `UploadPhotoDialog`
  ganhou `onUploaded`; os dois quick actions navegam para a rota nova. É a
  única ação dessas linhas que navega, e o motivo é justamente que o
  resultado dela não é visível onde ela foi disparada.

**Consequência aceita.** Veículo que já tinha foto na galeria de antes
continua sem capa — a correção só age em upload novo. Definir a capa
retroativamente exigiria escolher por conta própria qual das fotos
existentes representa o carro, e essa escolha é do dono; o botão "Definir
como capa" já resolve em um clique.

**Nota de mesma origem — o seletor de arquivo no Android.** Listar MIME
específicos (`image/jpeg,image/png,image/webp`) faz o Chrome no Android
pedir o seletor com lista de MIME extra, e na prática só Google Fotos e
Drive respondem: a galeria do próprio aparelho não aparece como opção. Os
quatro campos de arquivo do app passaram a usar o curinga (`image/*`, mais
`,application/pdf` onde PDF é aceito). O formato continua validado no
submit por `imageFileSchema`, `vehiclePhotoSchema` e
`fileAttachmentSchema`, então o seletor aceitar mais não deixa passar
arquivo inválido — só troca "não consigo escolher a foto" por uma mensagem
de erro clara nos poucos casos (HEIC, por exemplo) que o app não trata.

## ADR-081 — A foto é recortada antes de subir, e a proporção é do app

**Contexto.** Com a capa funcionando (ADR-080), apareceu o efeito colateral:
uma foto em pé esticava a baia da garagem para ~400px de altura. A coluna da
foto tinha `sm:h-auto` e a imagem `h-full`; altura automática não dá
referência para `h-full`, então o navegador caía na altura natural da imagem
— a proporção do arquivo passava a mandar no layout. Junto disso, subia o
original do celular: vários MB e 4000px de largura para exibir num quadro de
224px, com enquadramento decidido pelo acaso.

**Decisão.**

- **O app define a proporção, não o arquivo.** `PHOTO_ASPECT_RATIO` (4:3) é
  a mesma no recorte, na baia, no painel do veículo e na grade da galeria —
  o que a pessoa enquadra é exatamente o que ela vê depois. A imagem da baia
  virou `absolute`, então não entra mais no cálculo de altura do card: a
  altura vem do texto ao lado.
- **Recorte antes do envio** (`components/shared/ImageCropDialog`), no
  espírito de foto de perfil: arrastar para posicionar, pinça ou controle de
  aproximação para o zoom, setas do teclado para quem não usa ponteiro. O
  quadro é um `button` — a área inteira é manipulável, e um `div` com os
  mesmos handlers não receberia foco nem seria anunciado como controle.
- **O limite de tamanho passa a ser garantido, não torcido.** O que sobe é o
  recorte reencodado em WebP com 1600px no maior lado (`lib/imageCrop.ts`).
  Por isso a validação de tamanho mudou de lugar: o arquivo cru só é checado
  como imagem, e `imageFileSchema` / `vehiclePhotoSchema` conferem o
  resultado do recorte. Antes, uma foto de 12MB era recusada mesmo que fosse
  virar 200KB.

**Verificação.** Harness temporário + Playwright, apagado depois: imagem
sintética de quadrantes, recorte sem ajuste devolve os quatro quadrantes em
4:3 a 1600px (4,4KB); com zoom no máximo e arrasto para o canto, os quatro
cantos da saída caem todos dentro de um quadrante só — a conta do recorte
confere. A baia com foto em pé mediu 238px de altura em 1440px e não gerou
rolagem horizontal em 390px.

**Ressalva anotada no caminho.** Tornar a imagem absoluta escondeu o selo
"baia 01", que é irmão dela — resolvido com `z-10` no selo, e só apareceu
porque a verificação foi por captura de tela, não por leitura do diff.

**Correção depois do primeiro uso: o quadro abria vazio.** A URL de blob da
prévia vinha de um `useMemo` e era revogada na limpeza de um efeito. Sob
`StrictMode` — que é como o app roda em desenvolvimento — o React monta,
desmonta e remonta: a limpeza revogava a URL logo depois de criá-la, e o
`useMemo` não recriava nada na remontagem. O `<img>` ficava com
`naturalWidth` 0, o quadro aparecia vazio e o botão "Usar esta foto" seguia
habilitado, porque `image` estava preenchido. Agora a URL é criada e
revogada dentro do mesmo efeito, junto da imagem decodificada: cada execução
é dona da sua, e a remontagem cria outra. `loadImageFromFile` deixou de
revogar a URL que devolve, já que é ela que alimenta o `<img>` visível.

A verificação anterior não pegou isso porque o harness montava o componente
**sem `StrictMode`**, diferente do app. Harness de verificação tem que
reproduzir o ambiente real — refeito com `StrictMode` e pelo caminho de
verdade (diálogo de upload, arquivo escolhido pelo input), o defeito
apareceu na primeira execução.

## ADR-082 — Total de upgrades vem da view, não de `reduce` (Fase 030)

**Contexto.** A tela de Modificações somava `amount` da lista de gastos da
categoria `upgrade` no cliente para mostrar "Investimento em upgrades", e
usava `length` da lista para "Upgrades registrados". Isso é exatamente a
proibição nº 1 do `CONTRIBUTING.md`: `vehicle_expenses_by_category` já
entrega `total_amount` e `expense_count` por categoria, e duas fontes para o
mesmo total divergem um dia sem ninguém saber qual está certa.

**Decisão.** Os dois números vêm da linha `upgrade` de
`expenses_by_category`, lida pelo `useVehicleDashboard` que já existe — sem
hook novo e sem query nova à view. As mutations de gasto já invalidam
`['vehicles']`, então o dashboard recarrega sozinho depois de registrar,
editar ou apagar um upgrade. A linha é casada por `slug` **e** `label`,
porque a view agrupa pelos dois. Sem linha, o veículo não tem upgrade, e os
números ficam R$ 0,00 e 0. O RPC entra no mesmo estado de carregamento e de
erro da lista, com um único "Tentar de novo" que refaz as duas.

**O que continua no cliente, de propósito.**

- **"Investimento por mês".** Não existe view de gasto por categoria **e**
  por mês (`vehicle_expenses_by_month` não separa categoria). Pela regra do
  `CONTRIBUTING.md`, o certo é o backend ganhar essa view. Até lá o gráfico
  segue agregando a lista, e esta nota existe para a pendência não ficar
  invisível.
- **"N registros · R$ X nesta seleção".** É a soma do que está filtrado na
  tela por busca livre, período e ordem. Nenhuma view tem como pré-calcular
  um filtro de texto arbitrário. É leitura da lista visível, não um total do
  veículo.

**Dependência do backend.** A tela exige a categoria de sistema `upgrade`.
Ela só existia via `seed.sql`, que o `db push` não aplica. O backend passou
a criá-la por migration (backend, Fase 12 / ADR-012), então um projeto novo
já nasce com ela.

## ADR-083 — Painel admin: `is_admin` sem cache, 403 tratado num lugar só (Fase 031)

**Contexto.** O backend (Fase 14) criou roles, convites para admin,
notificações in-app e log de auditoria. Não existe role no JWT: `is_admin()`
lê o banco a cada chamada, e toda RPC admin devolve `403` com
`hint: 'not_admin'` para quem não é admin. Um admin pode ser rebaixado
enquanto está com o painel aberto em outro dispositivo.

**Decisão.**

- `is_admin` é uma query do TanStack Query **sem `staleTime`**: rechecka ao
  montar o painel e no foco da janela. Menu e rota escondidos são só UX.
- O `QueryClient` ganhou `onError` em `QueryCache` e `MutationCache`: erro
  com `hint === 'not_admin'` grava `false` no cache de `is_admin`. O
  `AdminLayout` reage a esse `false` levando a pessoa para `/` com o aviso
  "Você não tem mais acesso ao painel." (via `location.state`, exibido por
  `RouteNotice`). A notificação `admin_role_revoked`, em tempo real, só
  invalida `is_admin`, e o mesmo caminho faz o resto.
- A mensagem de erro sai do `hint`, nunca do `message`
  (`features/admin/errors.ts`). Para a Edge Function `admin-invite`, o corpo
  `{ message, code, hint }` é lido de dentro do `FunctionsHttpError`, então
  ela passa pelo mesmo tradutor.
- O ícone das notificações é `Inbox`, não `Bell`. O sino do header já é dos
  alertas de manutenção desde a Fase 14t, e dois sinos lado a lado não dizem
  qual é qual.
- `admin_invites` traz só `invitee_id`/`invited_by`. Para mostrar nome, cada
  id distinto passa por `admin_get_user`, com cache do TanStack Query
  (`UserLink`). É N chamadas por tela, aceitável porque convites e admins
  são poucos.

**Alternativas descartadas.** Tratar o 403 em cada hook: cinco lugares para
esquecer um. `staleTime` longo em `is_admin`: o rebaixamento só valeria
quando o cache vencesse. Usar `admin_list_users` (até 200 linhas) como
dicionário de nomes: quebra acima de 200 usuários.

**Pendência no backend.** Se a lista de convites crescer, o certo é uma RPC
de listagem de convites que já traga nome e e-mail de convidado e de quem
convidou, no lugar das N chamadas a `admin_get_user`.

## ADR-084 — Redesign etapa 01: sistema visual "Automotive Editorial", marca vetorial e navegação agrupada

**Contexto.** A direção visual aprovada para o redesign (Automotive
Editorial + Performance Minimalism) troca a estética "Rolê Noturno" e o
acabamento do header da Fase 16 (vidro, brilho, shimmer, mola). Esta etapa
cobre só a base compartilhada (tokens, `components/ui`, shell e
navegação); as páginas recebem apenas o efeito natural dos tokens. O kit
de marca v1 (SVGs `slow-garage-logo-dark/light` e `slow-garage-symbol`)
veio junto.

**Decisão.**

- `tokens.css` continua a única fonte de cor. Os nomes antigos mantêm o
  papel e mudam só o valor; os novos são aditivos (`surface-raised`,
  `field`, `border-strong`, `accent-hover`, `error-foreground`,
  `warning-foreground`, `state-hover`, `state-active`, `focus-ring`,
  `overlay`, `shadow-overlay`, `duration-*`, `ease-standard`). Nenhuma
  página precisou mudar de classe.
- Texto sobre o acento é escolhido por contraste calculado: grafite no
  escuro, branco no claro. O vermelho de erro foi para o carmim para não
  ficar a poucos graus de matiz do laranja de marca.
- `AlertDialogContent` ganhou um fio carmim no topo e a ação em
  `destructive`; o "Cancelar" virou `outline`. Todas as 16 confirmações do
  app são de ação sem volta fácil (conferido), então o padrão vale pra
  todas.
- `buttonVariants` e os botões de fechar de `Dialog`/`NavSheet` tinham
  `focus-visible:outline-none` sem substituto: o botão ficava sem foco
  visível no teclado. Agora usam o contorno global (`--color-focus-ring`).
  Os botões de fechar viraram alvo de 44px; o título do diálogo ganha
  `pr-10` para não correr por baixo deles.
- Marca vetorial em `public/brand/` (PNG antigo preservado), via
  `BrandLogo`, que escolhe o lettering pelo `resolvedTheme`. A marca
  aparece num lugar só por vez. Favicon, ícones de instalação e manifest
  não mudaram.
- Shell: a sidebar ocupa a altura toda (marca no topo, alinhada à altura
  do cabeçalho); o cabeçalho cobre só a coluna de conteúdo. O modelo de
  rolagem da Fase 15e é o mesmo (shell `lg:h-dvh`, `<main>` rola,
  atividade cede altura, "Configurações" sempre visível — verificado com
  640px de altura).
- Navegação agrupada (`NavGroup` em `lib/navigation.ts`): os títulos
  Custos/Cuidados/Preparação/Arquivo são `role="group"` com rótulo, não
  rotas. Os 11 destinos, o Painel admin condicionado a `is_admin`, o
  fallback de veículo em Configurações (ADR-062/063) e a regra "sem
  veículo, sem item" (ADR-049) ficaram iguais.
- Bug corrigido: o "Dashboard" (`/v/:id`) não tinha `end`, então ficava
  ativo junto com qualquer subpágina do veículo. `NavItem.end` resolve; o
  "Projetos" continua ativo no detalhe do projeto (verificado).
- Bottom nav: "Carros" → "Garagem"; o FAB "+" elevado virou "Registrar"
  com rótulo visível, ainda só abrindo a folha (6 ações com `?novo=1`,
  bloqueado sem veículo); "Mais" fica marcado quando a página atual mora
  nele; "Configurações" aparece como "Ajustes" porque a 11px mede ~77px e
  cada aba tem ~66px em 360px (medido). A folha "Mais" usa os mesmos
  grupos da sidebar e marca a seção atual.
- Folga inferior do `<main>` passou a somar a safe area
  (`calc(5rem + env(safe-area-inset-bottom))`).

**Alternativas descartadas.** Renomear tokens para uma nomenclatura nova:
obrigaria a tocar todas as páginas. Busca global e central de notificações
do protótipo: fora do escopo aprovado. Encolher o rótulo da aba para 10px
para caber "Configurações": sobrariam ~2px, e a própria ADR-055 já tinha
visto esse rótulo truncar. Repetir a marca no cabeçalho e na sidebar ao
mesmo tempo no desktop.

**Pendências.** `FieldError` continua associado ao campo só por
`role="alert"` (anunciado ao aparecer), não por `aria-describedby`. Ligar
isso exige mexer em cada formulário, fora desta etapa.

## ADR-085 — Redesign etapa 02: Minha garagem com veículos em primeiro plano

**Contexto.** A etapa 01 trocou tokens, marca e navegação, e as páginas
receberam só o efeito natural disso. Na Garagem, o painel de
indicadores (`GarageComparisonDashboard`, só no desktop) e o resumo
(`GarageSummary`, aberto a partir de `lg`) vinham antes dos veículos e
empurravam os carros para fora da primeira tela. O card era a "baia"
horizontal da Fase 14c, com a foto numa faixa estreita, e editar/excluir
dividiam a mesma faixa dos registros do dia a dia. Na revisão das
capturas da etapa 01, o símbolo laranja sozinho no cabeçalho do celular
não dizia "Slow Garage".

**Decisão.**

- Ordem: cabeçalho curto → resumo operacional compacto
  (`GarageOverview`) → grade de veículos. Totais, gráficos e comparativo
  ficam em "Detalhes da garagem", recolhido por padrão em qualquer
  largura, na mesma rota.
- Resumo operacional: com 2+ veículos, mostra veículos (com quantos
  ativos), gasto no mês atual (soma de `current_month_spend`), pendências
  (mesma `useGarageAlerts` do sino) e próxima manutenção (mesma
  `useGarageMaintenance`). Com 1 veículo, mostra só pendências e próxima
  manutenção, porque o resto já está no card (mesma regra do ADR-051).
  O comparativo, que antes aparecia com 1 veículo só no desktop, agora
  existe só com 2+: com um veículo, cada número dele estava repetido no
  próprio card.
- Erro de consulta não vira zero. Pendências e próxima manutenção têm
  estado próprio, com "—", "Não foi possível carregar." e "Tentar de
  novo". Isso corrige dois defeitos do painel antigo: com erro em
  alertas, a dica dizia "nada vencendo"; com erro em manutenção, dizia
  "nenhuma prevista". Os gráficos ganharam "Tentar de novo".
- Veículo sem linha em `vehicle_financial_summary` continua entrando
  como 0 nas somas, que não mudaram. A diferença é que o painel agora diz
  quantos veículos ficaram sem dado. Média de custo/km, investimento por
  veículo e somas: mesmas fórmulas de antes.
- Card vertical com foto 4:3 em cima (a proporção do recorte, ADR-081).
  - Sempre visíveis: marca, modelo, ano · versão, placa, status, km e
    gasto no mês atual.
  - A "Ficha técnica" expansível, em qualquer largura, guarda custo/km,
    total investido, combustível, câmbio, motor e potência. Antes, a
    ficha só recolhia no mobile.
  - O link do veículo é o título, esticado só sobre foto +
    identificação. Ficha, registros e menu ficam fora dessa área.
- Editar/excluir saem da faixa e vão para o menu "Mais ações" do card
  (`VehicleCardMenu`, mesma forma do `HeaderUserMenu`). Excluir fica
  separado por divisor e em carmim, a confirmação é a de sempre, e o foco
  volta ao gatilho ao fechar. Os 4 registros ficam na faixa, descritos
  pelo nome do veículo (`aria-describedby`). O diálogo de foto passou para
  o card, porque o placeholder sem foto também o abre.
- Foto que falha ao carregar (URL assinada expirada, rede) mostra
  "Foto indisponível no momento." em vez de imagem quebrada.
- Cabeçalho do celular: logo completo. Para caber em 360px junto com a
  troca de veículo, abaixo de `sm` notificações e atividade recente
  dividem um botão com duas abas (`HeaderInboxMenu`). Os painéis foram
  extraídos dos menus existentes (`NotificationsPanel`,
  `ActivityFeedPanel`), então as fontes continuam separadas.
  `HeaderNotificationsMenu` fica montado (oculto) abaixo de `sm`, para
  manter uma única assinatura de tempo real.

**Alternativas descartadas.**

- Manter o painel de indicadores aberto no desktop: ocupava a primeira
  dobra antes dos carros.
- Esconder a placa na troca de veículo em telas estreitas, para caber o
  logo: tiraria a identificação do veículo aberto.
- Juntar alertas ao menu de notificações: misturaria pendência do carro
  com caixa de entrada.
- Proporção 16:10 no card, para encurtar: cortaria o enquadramento que a
  pessoa escolheu no recorte. A compactação veio do resto do card.
- Busca, filtros, ordenação e seletor de mês do protótipo: não existem no
  app, e controle decorativo não entra.

**Refinamento após a primeira revisão visual.** A revisão das capturas
apontou três problemas: no celular o resumo virava protagonista (a primeira
tela terminava na foto, sem o nome do primeiro carro), os cards
continuavam altos e não havia um acesso visível ao painel do veículo.

- Resumo no celular: veículos, gasto e pendências numa linha. A próxima
  manutenção vai para o topo de "Detalhes da garagem" abaixo de `lg` (no
  desktop continua na faixa), e o veículo das pendências aparece só a
  partir de `sm`. "Cadastrar" fica ao lado do título.
- Card: o status foi para o canto da foto e o modelo cresceu para
  `text-lg`. Os espaçamentos diminuíram. A foto continua 4:3.
- Acesso explícito "Abrir veículo" (texto neutro, seta no acento) na linha
  da "Ficha técnica", sem linha nova. O título esticado sai da ordem de
  tabulação (`tabIndex={-1}`): o "Abrir veículo" é o caminho de teclado, e
  cada card fica com uma parada por destino.
- Medido nas capturas: o nome do primeiro carro termina em 649px (390) e
  627px (360), acima da barra inferior (787/723). Antes ficava abaixo da
  primeira tela.

**Verificação.** Feita com dados simulados (ferramenta externa ao
repositório, `redesign-capturas/`, cenários 23–42), sem tocar no
Supabase real.

## ADR-086 — Redesign etapa 03: formulários de cadastro, edição e exclusão do veículo

**Contexto.** O formulário do veículo era uma lista de pares de campos num
diálogo `max-w-md` que rolava inteiro, com o resto escondido em "Mais
detalhes" (aberto sempre na edição). A FIPE aparecia como link de texto no
meio dos campos, e a foto de capa ficava acima do formulário sem dizer que
é salva fora do "Salvar alterações". Faltava ligar o erro ao campo
(pendência do ADR-084). Esta etapa cobre só cadastro, edição, exclusão,
FIPE e foto de capa; schema, hooks, rotas e banco não mudaram.

**Decisão.**

- Diálogo com cabeçalho e rodapé fixos e um único corpo rolável:
  `max-w-2xl` centrado no desktop; folha presa à base no celular, com
  `safe-area` no rodapé. "Cancelar" (`DialogClose`) entra ao lado da ação
  principal e fecha como o X.
- Seções: Identificação (sempre aberta) e quatro recolhíveis opcionais
  (Uso e características, Compra e valores, Detalhes técnicos, Notas), com
  resumo do que está preenchido. No cadastro, fechadas; na edição, abre a
  que tem dado. Status continua só na edição (no cadastro vale o default do
  banco, como antes). Campos FIPE seguem fora da tela.
- Acessibilidade dos campos (`FormField`): `id` estável (os mesmos de
  antes), rótulo associado, `aria-invalid`, `aria-describedby` pra ajuda e
  erro, `aria-required` em marca e modelo. Envio inválido abre as seções
  com erro e foca o primeiro campo inválido (`shouldFocusError: false` +
  foco próprio, porque o do `react-hook-form` não alcança campo em seção
  recolhida). `FieldError` ganhou `id` e `announce` (padrão `true`, então
  os outros formulários não mudam); aqui o erro do campo não é
  `role="alert"`, pra não ser anunciado duas vezes.
- `ComboboxInput` aceita `aria-describedby` e `aria-required` (aditivo).
  `DialogContent` só segura o Escape quando o foco está num **combobox**
  aberto: antes qualquer `aria-expanded="true"` servia, e o botão de uma
  seção aberta impediria o Escape de fechar o diálogo.
- Ao abrir, o foco vai pro diálogo, não pra Marca (abria a lista de
  sugestões e o teclado virtual por cima do formulário).
- FIPE: status da identificação logo abaixo de marca/modelo (inclui o caso
  "catálogo não carregou — digite à mão", que antes não aparecia); a
  consulta virou painel próprio com ano, valor, mês, código e o aviso de
  que é referência, não avaliação; "Usar como valor estimado" só copia o
  número e abre "Compra e valores". O painel ganhou `key` por marca+modelo:
  trocar de modelo pela lista sem digitar reaproveitava o ano escolhido pro
  modelo anterior.
- Exclusão: o texto lista só o que as FKs `on delete cascade` do backend
  apagam (conferido nas migrations): gastos, abastecimentos, manutenções,
  problemas, projetos, notas, documentos, obrigações, financiamento, fotos
  e anexos. Depois do sucesso, quando o card sai da lista, o foco vai pro
  título "Seus veículos (N)" ou, sem veículo, pro `h1`.

**Diferenças funcionais (registradas, todas de apresentação/estado de
tela).**

- Falha no insert/update antes escapava sem mensagem; agora aparece no
  rodapé (`translatePostgresError`, como nos outros diálogos) e o diálogo
  continua aberto com os dados.
- Envio duplicado: além do `disabled`, um ref barra o segundo envio (Enter
  repetido num campo chegava a chamar o `handleSubmit` de novo).
- Foto: se o envio falha, a miniatura volta pra foto salva (antes a prévia
  local ficava como se a troca tivesse acontecido).
- Exclusão com duplo clique no mesmo quadro também barrada por ref.

**Pendências (não alteradas, fora do escopo).**

- `horsepower` e `torque_nm` são `integer` no banco, mas o schema aceita
  decimal e o torque usa `step="0.1"`: um torque decimal falharia no
  update. Regra de schema, preservada.
- Mensagens dos helpers numéricos saem como "o valor estimado atual
  inválido." (minúscula, sem verbo). Texto vem de `schemaHelpers`,
  compartilhado com outros formulários.
- Arquivos no storage (foto, anexo, documento) não são apagados com o
  veículo; só as linhas. O texto da exclusão diz "sai do app", que é o que
  a pessoa vê.
- `FieldError` dos outros formulários continua só com `role="alert"`.

**Verificação.** Dados simulados (ferramenta externa ao repositório,
`redesign-capturas/`, cenários 22–30), incluindo escritas e FIPE
interceptadas; nenhuma chamada ao Supabase real nem à API FIPE real.
Teclado virtual só emulado (viewport 390×380); leitor de tela real e
upload real não foram testados.

## ADR-087 — Redesign etapa 04: dashboard do veículo

**Contexto.** O dashboard (`VehiclePage`) abria com a foto 4:3 em largura
inteira no celular, um `<select>` "Trocar de veículo" que repetia o seletor
do cabeçalho (desabilitado com 1 veículo), a FIPE antes de tudo, um arco de
odômetro que mostrava "% até o próximo múltiplo de 10.000 km" (ADR-050) e as
ações rápidas só depois que o RPC carregava. As pendências não levavam a
lugar nenhum e diziam "Venceu em" também para o que ainda ia vencer. O
gráfico por mês rolava na horizontal, e barras de valor zero ganhavam
largura mínima.

**Fontes conferidas antes de redesenhar** (migrations do backend, não nomes
de campo):

| Indicador | Fonte | Período / regra |
|---|---|---|
| Gasto no mês / ano | `vehicle_financial_summary` | mês/ano de `current_date`; gastos + combustível + manutenção + itens de projeto instalados; sem a compra |
| Total investido | idem | compra (nula conta 0) + as 4 fontes, todo o histórico |
| Custo/km | idem | total investido ÷ `current_odometer_km`; nulo sem odômetro. Vitalício, não mensal |
| Consumo médio/melhor/pior | `vehicle_fuel_summary` ← `fuel_log_metrics` | trechos de tanque cheio a tanque cheio sem abastecimento esquecido; histórico inteiro; `fuel_summary` nulo sem abastecimento |
| Preço médio/L, litros | idem | média por abastecimento / soma |
| Gasto por mês | `vehicle_expenses_by_month` | 4 fontes, só meses com registro |
| Gasto por categoria | `vehicle_expenses_by_category` | só a tabela `expenses`, acumulado |
| Pendências | `vehicle_alerts` | manutenção, obrigação, documento; `critical` = vencido, `warning` = até 30 dias |

**Decisão.**

- Ordem: identificação → ações → indicadores → pendências | atividade →
  financeiro | combustível → gráficos → FIPE. As ações deixam de esperar o
  RPC. Cada bloco tem carregando/erro/vazio próprio; o RPC continua uma
  chamada só (RN-1).
- Troca de veículo: só o seletor global. O `<select>` do corpo saiu. O
  conteúdo é montado com `key={vehicle.id}`, então expansões e diálogos
  não atravessam a troca; os dados já eram por `vehicleId`.
- Trilha "Garagem › Dashboard" (`Breadcrumb showVehicle={false}`): o nome
  está no `h1` logo abaixo e no seletor do cabeçalho. O link da trilha ganhou
  alvo de 44px com margem negativa (altura da linha igual, vale pra todas as
  telas).
- Indicadores principais: gasto no mês, consumo médio e custo/km, cada um
  com o período na dica. O odômetro vira texto no cabeçalho. **Supera o
  ADR-050**: o arco media uma meta inventada.
- Pendências com destino existente: manutenção → Manutenção; obrigação →
  Documentos `?aba=obrigacoes`; documento → Documentos. Vencido/próximo em
  texto + ícone + cor. Distância em km só quando o alerta traz o km previsto
  e o veículo tem odômetro ("previsto aos 92.400 km (faltam 5.000 km)").
  Sem botão de concluir/dispensar. Problemas e projetos ficam no rodapé do
  painel, com contagem e destino próprios, sem somar com pendência.
- Financeiro: gasto no ano e total investido abertos; "Detalhes
  financeiros" com compra, gastos, combustível, manutenção e itens de
  projeto (os 5 que formam o total), com a regra escrita. A compra entra
  porque `purchase_price` já vem no RPC e é o que explica o total; nula
  aparece "—" com "conta R$ 0,00 no total".
- Combustível: melhor/pior abertos; preço médio, litros e a regra do
  consumo em "Detalhes de combustível". Litros com `formatLiters` (antes saía
  `30.5 L`, com ponto).
- Gráficos (compartilhados com a garagem): mês em linhas com subgrid, mais
  recente primeiro, 6 + "Ver todos"; zero sem largura mínima; subtítulos
  com a fonte. Categoria: zero sem mínimo, rótulo quebra em vez de cortar.
- FIPE: mesma lógica, casca do dashboard, por último, com "Referência, não
  preço de venda garantido".
- `TimelineItem` ganhou `variant="row"` (só apresentação) e `GarageTile`
  ganhou `size="lg"` e `flashOnChange`; os usos antigos não mudam.
- Realce de valor alterado (sistema de resposta, Fase 14) mantido: gasto no
  mês, consumo, custo/km, total investido e odômetro piscam 400ms quando o
  número muda depois de carregado. O valor só monta com o dado pronto, então
  a primeira carga e a troca de veículo não piscam; com movimento reduzido,
  nada pisca (`motion-safe`).

**Alternativas descartadas.** Seletor de mês e "Gastos do mês" por
categoria do protótipo: as fontes não têm período selecionável e a
categoria é acumulada. "Últimos 3 tanques", "km no mês", "Atualizado hoje":
sem fonte. Juntar problemas abertos às pendências num número só: são
entidades diferentes. Manter colunas no gráfico por mês: precisava de rolagem
horizontal e espremia rótulos no celular.

**Pendências registradas (fora do escopo, não alteradas).**

- No diálogo de abastecimento, os dois checkboxes ("Tanque cheio", "Perdi o
  abastecimento anterior") têm 44×24 e a medição não acha rótulo associado
  ao `input` (o axe não reclama; o rótulo envolve o campo). Formulário de
  outro domínio.
- `AlertBanner` (Manutenção, Documentos, sino) ainda escreve "Venceu em"
  para aviso que ainda não venceu. O dashboard não usa mais esse componente.
- No desktop o `<main>` é quem rola (Fase 15e) e o shell não volta ao topo
  ao trocar de rota: trocar de veículo com a página rolada abre o outro
  veículo na mesma altura (sem dado do anterior, mas fora do topo). É
  comportamento do `AppShell` em todas as rotas.

**Verificação.** Dados simulados (ferramenta externa ao repositório,
`redesign-capturas/`, cenários 31–48, arquivos 79–117). Rede trancada: o que
não tem mock no cenário é bloqueado e listado, incluindo o WebSocket do tempo
real e a API FIPE. Nenhum leitor de tela real, aparelho físico ou dado real.

## ADR-088 — Redesign etapa 05: Gastos + refinamentos do dashboard

**Contexto.** A tela Gastos era uma pilha de cards com dois ícones soltos
(editar, excluir), o formulário era o diálogo `max-w-md` com "Mais detalhes"
em `<details>`, e o anexo era uma linha de texto com três botões. Na revisão da
etapa 04 apareceram dois problemas no dashboard: "Abastecimento" cheio de
laranja parecia aba selecionada, e o gasto por mês em linhas perdeu a leitura
de evolução no tempo — além de os gráficos ficarem no fim da página. Esta
etapa cobre só Gastos e esses ajustes; banco, hooks, queries, fórmulas e
rotas não mudaram.

**Fontes e regras conferidas (migrations do backend).**

| Ponto | Regra |
|---|---|
| `expenses.occurred_on` | NOT NULL com default `current_date`: data em branco no cadastro grava hoje; na edição, `undefined` sai do PATCH e a data salva fica. Não existe gasto sem data. |
| Gasto sem categoria | `vehicle_expenses_by_category` agrupa em `uncategorized` / "Sem categoria" (left join). |
| Filtros | Os mesmos: categoria e período de `period.ts`, aplicados no servidor (`gte`/`lte` em `occurred_on`). |
| Paginação | Nenhuma; o PostgREST corta em `max_rows = 1000` (`supabase/config.toml`). |
| Modificações | Lista os gastos da categoria de sistema `upgrade`; o mesmo diálogo grava `upgradeCategoryId`. |

**Decisão.**

- Gastos em lista estruturada (não `<table>`): colunas alinhadas a partir de
  `md`, linha em três níveis no celular. O conteúdo varia (descrição longa,
  detalhes opcionais, anexo) e uma tabela no celular perderia a semântica ao
  ser reempilhada. Editar/excluir num menu "⋯" por linha.
- "Total da seleção" (com a contagem): soma do que a lista já carregou com o
  filtro — mesma consulta, nenhuma nova. Não é o gasto do veículo e não
  aparece com 1000 linhas (resposta possivelmente cortada). É a única soma
  no cliente; a regra "não recalcular o que o banco calcula" não se aplica
  porque não há view de soma por filtro arbitrário.
- Formulário no padrão da etapa 03 (`FormSection`/`FormField`/`UnitAffix`
  reaproveitados de `VehicleFormParts`): mesmos campos, schema, limites,
  enums e defaults; categoria e data seguem opcionais. Envio inválido abre
  "Detalhes" se o erro estiver lá e foca o primeiro campo inválido; erro de
  banco no rodapé; ref contra envio duplicado.
- `AttachmentField` (compartilhado com Problema, Item de projeto e
  Manutenção): arquivo salvo e envio pendente em blocos separados, formatos e
  limite escritos. O fluxo (só na edição, substituir, remover com
  confirmação) é o mesmo.
- Ações rápidas: as quatro em `outline`, sem estado selecionado; nada de
  `aria-pressed`/`aria-selected`. O rótulo visível encurta com a largura e o
  nome acessível é sempre a ação completa.
- Dashboard: gráficos logo depois dos indicadores, sob o título "Análise de
  gastos", com o aviso de vencidas antes deles (o painel de pendências desceu).
  O aviso usa os mesmos `alerts` do RPC e não conta nada novo.
- Gasto por mês em colunas (supera a parte "linhas" do ADR-087): HTML/CSS, sem
  biblioteca; valor exato por coluna em `sr-only`, tabela "Ver valores
  exatos" com todos os meses (o acesso aos meses fora do recorte do
  celular). Meses sem registro continuam fora, nunca zero inventado.
- Gasto por categoria: cor neutra e só a maior em laranja; o balde "Outras"
  (soma no cliente) saiu — as categorias além de 6 ficam em "Ver todas".
- Indicadores: dica curta + ajuda completa num popover (`GarageTile` ganhou
  `help`, aditivo).

**Correções funcionais localizadas (registradas).**

- Substituir anexo: o arquivo novo sobe **antes** de o antigo ser apagado
  (`useUploadAttachment`). Antes, um envio que falhava deixava o registro sem
  anexo e a tela mostrando o antigo. Se algo falha depois do envio, o arquivo
  novo é removido (não fica órfão) e a lista recarrega também no erro
  (`onSettled`). Path, bucket e tabela iguais.
- Exclusão sem descrição dizia `Excluir ""?`; agora "Excluir gasto?" com o
  cartão do registro. Erro de remoção do anexo aparece dentro da confirmação,
  que não fecha.
- Diálogos de gasto e a confirmação de remover anexo abrem por estado, sem
  `DialogTrigger`: o Radix devolvia o foco ao `<body>`. `useReturnFocus`
  devolve ao que estava focado ao abrir, se ainda existir. Depois de excluir
  um gasto, o foco vai pro título "Lançamentos" (o gatilho é guardado ao pedir
  a exclusão, porque a mutação só termina depois do refetch, quando a linha já
  saiu).

**Alternativas descartadas.** Tabela semântica com reempilhamento no celular
(perde a semântica). Linha inteira clicável pra editar (interativo dentro de
interativo com o menu). Biblioteca de gráficos (o HTML/CSS cobre colunas com
alternativa textual). Rolagem horizontal no gráfico mensal (o motivo do ADR-087
pra abandonar coluna). Novo número de "saúde do veículo" e tendência
percentual (sem fonte).

**Pendências registradas (fora do escopo, não alteradas).**

- Mensagens dos helpers numéricos ("a quilometragem inválido.") vêm de
  `schemaHelpers`, compartilhado.
- Modificações (`ExpenseListItem`, `ModificationsPage`) não foi redesenhada:
  ganha só o formulário, a confirmação e a devolução de foco novos. A página
  ainda soma "nesta seleção" e o "investimento por mês" no cliente.
- `AlertBanner` ainda escreve "Venceu em" pra aviso que não venceu (ADR-087).
- Se a remoção do anexo antigo falhar no meio (arquivo apagado, linha não),
  o comportamento é o de antes; a nova ordem só cobre falha no envio e no
  insert.
- O botão "i" dos indicadores só ganha `aria-controls` com o popover aberto
  (comportamento do Radix).

**Verificação.** Dados simulados (ferramenta externa ao repositório,
`redesign-capturas/`, cenários 49–72, arquivos 118–178), com escritas de
gastos, anexos e Storage interceptadas e o LEDGER do mock acompanhando as
escritas. Rede trancada. Nenhum leitor de tela real, aparelho físico, dado
real ou exclusão real.

## ADR-089 — Redesign etapa 06: Abastecimentos + dois ajustes de texto

**Contexto.** A tela Abastecimentos era uma pilha de cards com lápis e
lixeira soltos, um resumo de quatro números (médio, melhor, pior e um
"Custo/km" que na verdade é o do veículo inteiro) e um formulário
`max-w-md` com "Mais detalhes" em `<details>`. O resumo com erro de consulta
aparecia como "—", igual a "sem base". Os dois interruptores do formulário
tinham 44×24 (pendência do ADR-087) e as mensagens dos campos numéricos saíam
"a quilometragem inválido." (pendência do ADR-086/088). Esta etapa cobre só
Abastecimentos e dois textos da revisão anterior; banco, hooks, queries,
chaves, invalidações, fórmulas e rotas não mudaram.

**Fontes e regras conferidas (migrations do backend).**

| Ponto | Regra |
|---|---|
| Lista | `fuel_log_metrics`, `order=occurred_on.desc,odometer_km.desc` (sem mudança). Preço/L é coluna gerada (`round(total/litros, 3)`). |
| Trecho | `lag` por veículo em ordem de `odometer_km` (nulos no fim), depois `occurred_on`, `created_at`. `km_since_previous` nulo sem anterior com km. |
| km/L do trecho | Só com anterior com km, **este e o anterior** de tanque cheio e sem "perdi o anterior". `round(dist/litros, 2)`. |
| Custo/km do trecho | Anterior com km, sem "perdi o anterior" e distância > 0 — não exige tanque cheio (ADR-030). |
| Resumo | `vehicle_fuel_summary`: avg/max/min dos km/L não nulos, média simples do preço/L, soma de litros; histórico inteiro, sem linha quando não há registro. |
| Total em combustível | `vehicle_financial_summary.total_fuel` (já vinha com o veículo); custo/km do veículo = total investido ÷ odômetro. |
| Campos | Litros e valor obrigatórios (≥ 0 no schema; o banco exige litros > 0). Km opcional, inteiro ≥ 0, único por veículo (`23505`, já traduzido). Data: hoje por padrão; em branco, o banco grava hoje / a edição mantém. Combustível: o do veículo. Tanque cheio `true`, "perdi o anterior" `false`. |

**Decisão.**

- Lista estruturada (não `<table>`), pelo mesmo motivo do ADR-088: colunas
  alinhadas a partir de `md` (números em mono à direita), linha em dois blocos
  no celular (valor · litros | consumo | ⋯ e, embaixo, o resto em largura
  inteira). Cada número leva a unidade no próprio texto, então a linha se
  entende sem o cabeçalho (que é `aria-hidden`).
- Consumo ausente: "—" e o motivo da linha, derivado dos campos da própria
  linha na ordem do `case` da view (`missingConsumptionReason`). Nada é
  recalculado: o número continua sendo só `km_per_liter`. "Anterior parcial"
  sai por exclusão (este cheio, anterior com km, nada perdido e mesmo assim
  nulo ⇒ o anterior era parcial), sem olhar a linha vizinha.
- Resumo: os 4 números da view + o total em combustível, todos rotulados
  "histórico"; melhor/pior e o custo/km **do veículo** (renomeado) em
  "Detalhes". Erro de consulta é estado próprio, separado de "sem base".
  Resumo e lista falham cada um por si.
- Formulário no padrão das etapas 03/05 (`FormSection`/`FormField`/
  `UnitAffix`), sem wizard: "Abastecimento", "Cálculo do consumo" (os dois
  interruptores com a regra escrita) e "Detalhes" recolhível. Mesmos campos,
  ids, defaults, payload e `?novo=1`. Foco no 1º inválido (abre "Detalhes"
  se preciso), erro do banco no rodapé com os dados mantidos, ref contra envio
  duplicado, diálogos por estado com `useReturnFocus`.
- Interruptores (`FuelToggleField`, local): o próprio `role="switch"` virou um
  botão de 56×44 com o trilho de 44×24 dentro; o rótulo é `label htmlFor`
  irmão (não envolve o botão, então não há clique duplicado) com 44px de
  altura. O `Switch` compartilhado (usado também em Manutenção) não mudou.
- Exclusão no padrão do gasto, com as consequências que a view garante,
  inclusive a mudança no trecho do abastecimento seguinte.
- Mensagens: `schemaHelpers` ganhou um segundo parâmetro opcional com o texto
  do valor inválido (padrão igual ao de antes). Só o combustível passa texto
  próprio ("Quilometragem inválida.", "Litros inválidos.", "Valor total
  inválido."); regra e demais formulários iguais.
- Formatação: `formatLitersExact` (até 3 casas, um registro) e
  `formatPricePerLiter` (até 3 casas, como a coluna). Aditivos em
  `lib/format.ts`; o dashboard continua com os de antes.
- Ajustes de texto: Gastos abre com "Gastos avulsos deste veículo." e a
  explicação de onde ficam abastecimento, manutenção e itens de projeto num
  "i" ao lado; o indicador do dashboard diz "Mês atual" (a composição segue na
  ajuda do próprio indicador).

**Alternativas descartadas.** Recalcular consumo no cliente para mostrar algo
nos trechos parciais (fórmula diferente da view). Etiqueta "Tanque cheio" em
toda linha (o normal; poluiria). Classificar consumo como bom/ruim (sem
referência). Mexer no `Switch` compartilhado (afetaria Manutenção). Mostrar o
resumo com traços quando não há registro (o vazio explica melhor).

**Pendências registradas (fora do escopo, não alteradas).**

- O schema aceita litros = 0, o banco recusa (`23514` → "Valor inválido para
  este campo."). Regra preservada.
- No celular, uma linha de abastecimento tem 103–131px (390/360); o nome de
  posto muito longo corta em 2 linhas.
- `FuelSummarySection` do dashboard continua mostrando preço médio com 2 casas.
- Mensagens "x inválido." dos outros formulários continuam como estavam.

**Verificação.** Dados simulados (ferramenta externa, `redesign-capturas/`,
cenários 73–83, arquivos 179–189), com `fuel_log_metrics`, `vehicle_fuel_summary`
e as escritas em `fuel_logs` interceptadas (incluindo a constraint única de
odômetro) e o LEDGER do dashboard acompanhando. Rede trancada; nenhuma
chamada ao Supabase real, nenhuma exclusão real. Teclado virtual só emulado
(390×380); nenhum aparelho físico nem leitor de tela real.

## ADR-090 — Redesign etapa 07: Manutenção + texto de vencimento do AlertBanner

**Contexto.** Manutenção era uma pilha de cards com lápis e lixeira soltos,
dois botões de rótulo parecido ("Novo item do plano" / "Registrar execução"),
nenhuma próxima data ou quilometragem na tela, itens inativos filtrados sem
aviso e o `AlertBanner` no topo repetindo as vencidas. O `AlertBanner`
escrevia "Venceu em" pra qualquer data, inclusive futuras (pendência dos
ADR-087/088), em Manutenção, Documentos e no sino. Esta etapa cobre só
Manutenção e esse texto; banco, hooks, queries, chaves, invalidações e rotas
não mudaram.

**Fontes e regras conferidas (migrations do backend).**

| Ponto | Regra |
|---|---|
| Situação | `maintenance_status`: `planned` sem execução; `overdue` se odômetro ≥ última km + intervalo **ou** hoje ≥ última data + N meses; `due_soon` a 500 km ou 30 dias; senão `ok`. Calculada a cada consulta. |
| Alertas | `vehicle_alerts` = vencidas (`critical`) e próximas (`warning`) **ativas** da mesma view, + obrigações e documentos. |
| Plano | Nome obrigatório; `interval_km` e/ou `interval_months` (o banco recusa os dois nulos e exige > 0); prioridade `medium`; ativo `true`; categoria texto livre. |
| Serviço | Nome obrigatório; item opcional (avulso); km opcional; `performed_on` NOT NULL com default hoje (em branco no cadastro grava hoje; na edição o PATCH omite e mantém); custo opcional. |
| Trigger | `sync_maintenance_record` roda **só no insert** e **só com km**: avança `last_service_*` do item vinculado (se a km for maior) e o odômetro do veículo. Editar ou excluir serviço não mexe em nada disso. |
| Excluir item | Exclusão real (ADR-031); FK `on delete set null` — os serviços ficam no histórico, sem vínculo. |
| Excluir serviço | O hook apaga o anexo antes; o custo sai de `total_maintenance` e dos gastos por mês. |

**Decisão.**

- Ordem da página: vencidas → plano → histórico, com "Registrar serviço"
  (execução, primária) e "Adicionar ao plano" (planejamento, contorno) no
  topo. Os diálogos usam os mesmos nomes ("Registrar serviço", "Editar
  serviço", "Excluir serviço?"; "Adicionar ao plano", "Editar item do plano",
  "Excluir item do plano?").
- Vencidas/próximas saem do `status` de `maintenance_status`, como antes. O
  `AlertBanner` daqui mostra só os alertas que as listas não cobrem
  (`source_table` diferente de `maintenance_items` — hoje documentos e
  obrigações), num bloco compacto "Documentos e obrigações" depois das
  vencidas, com "Ver em Documentos". Os de manutenção não se repetem. Falha de
  `vehicle_alerts` vira uma linha com "Tentar de novo", nunca "nada pendente".
  (Ajuste da revisão: a primeira versão tirava o banner inteiro e, com ele,
  documentos e obrigações que a página mostrava antes.)
- Próxima referência = `next_service_date`/`next_service_odometer_km` como a
  view entrega, só dos intervalos acompanhados. "faltam/passou X km" usa o
  `current_odometer_km` do veículo — a mesma comparação da view e a mesma
  conta do painel de pendências (ADR-087). Sem execução: nenhum prazo; o texto
  diz quando começa a contar. Nenhuma previsão por média de rodagem, nenhuma
  porcentagem de vida útil. Item vencido com a data ainda por vir (ou sem
  data) só pode ter vencido pela km: a linha diz "Vencida por quilometragem",
  depois "Aos X km · passou Y km" e a data em tom secundário ("Data prevista …"),
  em vez de "Vence em …" ao lado do selo "Vencida" (ajuste da revisão).
- Prioridade como texto neutro na linha da periodicidade; situação em selo de
  cor + texto; inativo em selo neutro e referência sem "venceu/passou".
- Inativos recolhidos no fim do plano, com editar/excluir — resolve o "se isso
  mudar" do ADR-031 sem segundo fluxo de arquivar.
- Diálogos de editar/excluir **item** ficam na página, não na linha: a linha
  troca de grupo (vencidas → plano → inativos) e desmonta quando a lista
  recarrega. Foco volta ao "⋯" se ele ainda existe; senão ao título do plano.
  Registro de serviço aberto por uma linha que muda de grupo devolve o foco ao
  título do histórico.
- Formulários no padrão das etapas 03/05/06: foco no 1º inválido (abre
  "Detalhes" se preciso), erro do banco no rodapé com os dados mantidos, ref
  contra envio duplicado, valores iniciais só na montagem. A falta dos dois
  intervalos é um erro único lido pelos dois campos (`aria-describedby`), sem
  `role="alert"`. "Item ativo" reusa o `FuelToggleField` (56×44); o `Switch`
  compartilhado não mudou.
- Exclusões com as consequências da tabela acima, sem prometer recálculo.
- Mensagens: só o texto mudou ("Intervalo em km inválido.", "Custo estimado
  inválido.", "Quilometragem inválida.", "Custo inválido.", "Informe o
  intervalo em km, em meses ou os dois."), pelo 2º parâmetro dos helpers.
- `AlertBanner`: data passada "Venceu em", hoje "Vence hoje", futura "Vence
  em"; km "previsto aos X". Alerta `critical` cuja data ainda não chegou só
  pode ter vencido pela quilometragem (a view tem só esses dois critérios;
  obrigação e documento não têm km) → "Venceu aos X km · data prevista …".
  Fonte, severidade, cor, ordem e contagens iguais. Consumidores conferidos:
  Documentos, sino e o bloco de Manutenção.
- Sino (`HeaderAlertsMenu`, ajuste da revisão): a lista rolável virou
  `role="region"` "Lista de alertas" com `tabIndex={0}` (o axe acusava
  `scrollable-region-focusable`, `serious`, com muitos alertas — nada dentro
  dela recebe foco) e `overscroll-contain` (chegar ao fim pelo teclado não
  rola a página por trás). A regra `jsx-a11y/no-noninteractive-tabindex` fica
  desligada só nessa linha, com o motivo: é a exceção que o próprio WCAG prevê.

**Alternativas descartadas.** Manter o banner inteiro em Manutenção (duas
respostas para "o que venceu"). Tirar o banner sem repor documentos e
obrigações (a página perdia informação que mostrava — primeira versão, revista).
Desligar a regra de lint no projeto todo (o caso é um só). Calcular "próxima revisão" quando a view não
tem referência (inventaria prazo). Coluna de situação separada do nome (no
desktop sobrava pouco para o nome). Grade do plano a partir de `md` (a coluna
do item ficava com ~150px em 820–1279px). Mexer no `Switch` compartilhado.

**Pendências registradas (fora do escopo, não alteradas).**

- O schema aceita intervalo 0; o banco exige > 0 (`23514` → "Valor inválido
  para este campo."). Regra preservada.
- Excluir serviço apaga o anexo antes da linha (ordem do hook, igual ao gasto):
  se a exclusão da linha falha, o anexo já foi.
- Excluir ou editar um serviço não recalcula a última execução do item nem o
  odômetro do veículo (o trigger só roda no insert): o item pode continuar
  contando a partir de um serviço que não existe mais. A confirmação diz isso;
  a correção é do backend.
- `PendingAlertsPanel` do dashboard tem a própria frase: "Venceu em" para todo
  `critical`, inclusive vencido por km com data futura. Não usa o
  `AlertBanner` e não foi alterado.
- A ação rápida de manutenção do dashboard abre o registro sem a quilometragem
  do veículo (o card da garagem passa); comportamento de antes.

**Verificação.** Dados simulados (ferramenta externa, `redesign-capturas/`,
cenários 84–92, arquivos 190–199; ajustes da revisão no cenário 93, arquivos
200–201, relatório próprio): `maintenance_items`, `maintenance_status`
(regra da view), `maintenance_records` (trigger de insert), `vehicle_alerts`
derivados, anexos e Storage interceptados, LEDGER do dashboard acompanhando os
custos. Rede trancada; nenhuma chamada ao Supabase real, nenhuma exclusão real.
Teclado virtual só emulado (390×380); nenhum aparelho físico nem leitor de tela
real.

## ADR-091 — Redesign etapa 08: Problemas

**Contexto.** Problemas era uma pilha de cards com lápis e lixeira soltos, os
quatro status em andamento todos em âmbar, "Descartado" com cara de concluído
discreto, o formulário `max-w-md` com "Mais detalhes" em `<details>` e a
exclusão com o título `Excluir "{título}"?`. Esta etapa cobre só Problemas;
banco, hooks, queries, chaves, invalidações e rotas não mudaram.

**Fontes e regras conferidas (migrations e DATABASE.md do backend).**

| Ponto | Regra |
|---|---|
| Status | Enum `issue_status` de seis valores; transição livre (RN-2, sem máquina de estado). |
| Grupos | Abertos = `open`, `investigating`, `waiting_part`, `in_repair` (`OPEN_ISSUE_STATUSES`); Resolvidos = `resolved`, `dismissed`. Mesmo corte do `open_issues_count` (`status not in ('resolved','dismissed')`). |
| Campos | Título obrigatório; prioridade `medium` e status `open` por padrão; `reported_on` NOT NULL com default `current_date` (em branco no cadastro grava hoje; na edição o PATCH omite e mantém); descrição, diagnóstico, resolução, data de resolução, km (inteiro ≥ 0) e custo (≥ 0) opcionais. |
| Status × data | Independentes: nada força `resolved_on` ao mudar para resolvido (ADR-005). |
| Custo | `issues.cost` não entra em `total_invested`, gastos do mês/ano nem gráficos (RN-1 da Fase 8). |
| Fora da página | `open_issues_count` do dashboard, `vehicle_timeline` (`occurred_on = reported_on`), busca. |
| Excluir | O hook apaga o anexo antes da linha. |

**Decisão.**

- Página: cabeçalho com "Relatar problema", painéis Abertos e Resolvidos com
  contagem por status, ordem da consulta (relato mais recente primeiro). Sem
  busca, filtro, kanban nem `?novo=1` — a página não tinha.
- Situação em selo: só "Aberto" em âmbar; os três em andamento neutros com
  borda forte; "Resolvido" verde; "Descartado" tracejado e neutro, em
  Resolvidos. Prioridade em texto neutro na linha de relato.
- Linha estruturada (não `<table>`, pelo motivo do ADR-088), colunas a partir
  de `lg` com a coluna de ações em largura fixa (cabeçalho alinhado, lição da
  etapa 07); "Detalhes" com o conteúdo inteiro; editar/excluir no "⋯".
- Diálogos de editar/excluir ficam na página: mudar o status troca a linha de
  grupo e a desmonta. Foco volta ao "⋯" se ele existe; senão ao título do
  grupo onde o problema ficou (o diálogo de edição informa o status salvo).
- Formulário no padrão das etapas 03–07, mesmos campos, defaults e payload.
  Nada é exigido para mudar de status; mudar para Resolvido não preenche a
  data; nenhum campo é limpo; recolher só esconde; valores iniciais só na
  montagem. Foco no 1º inválido (abre "Diagnóstico e resolução" se preciso),
  erro do banco no rodapé com os dados mantidos, ref contra envio duplicado.
- Custo: rótulo "Custo informado", com a ressalva de que fica só no problema;
  zero é R$ 0,00 e ausente é "—". Nada é criado em Gastos ou Manutenção.
- Exclusão com as consequências da tabela, sem prometer recuperação. No
  cartão, custo ausente é "Custo não informado" e zero é R$ 0,00 (ajuste da
  revisão: antes "Sem custo", que se confundia com zero).
- Mensagens: só o texto mudou ("Quilometragem inválida.", "Custo inválido."),
  pelo 2º parâmetro dos helpers.

**Alternativas descartadas.** Cores por status de trabalho (quatro tons
competindo; âmbar para todos repetia o problema antigo). Pôr "Descartado" num
grupo próprio (mudaria o corte usado pelo dashboard). Preencher a data de
resolução ao escolher Resolvido (regra que o banco deliberadamente não tem).
Linha inteira clicável (interativo dentro de interativo com o menu).

**Pendências registradas (fora do escopo, não alteradas).**

- Excluir problema apaga o anexo antes da linha (ordem do hook, igual a gasto e
  manutenção): se a exclusão da linha falha, o anexo já foi. Conferido no mock
  (falha do DELETE depois de Storage e `attachments`).
- Abaixo de `lg` a linha empilha; com título longo e as quatro informações de
  relato, uma linha no celular fica alta (perto de 190px na captura 203).

**Verificação.** Dados simulados (ferramenta externa, `redesign-capturas/`,
cenários 94–101, arquivos 202–208): `issues` com os seis status, escritas,
anexos e Storage interceptados; `open_issues_count` do RPC e `vehicle_timeline`
derivados do mesmo estado, conferidos depois de criar, resolver e excluir.
Rede trancada; nenhuma chamada ao Supabase real, nenhuma exclusão real.
Nenhum aparelho físico nem leitor de tela real.

## ADR-092 — Redesign etapa 09: Projetos e itens de projeto

**Contexto.** Projetos era uma grade de cards com "% dos itens concluídos" e
lápis/lixeira soltos; o detalhe tinha um `dl` de duas linhas ("Itens
concluídos", "Orçamento usado") e itens em cards com um único valor —
`actual_cost ?? estimated_cost`, sem dizer qual dos dois era. Os formulários
eram `max-w-md` com "Mais detalhes" em `<details>`; o item editado mostrava
"Este projeto" no seletor; as exclusões tinham título `Excluir "{nome}"?`.
Esta etapa cobre Projetos e um texto da exclusão de serviço em Manutenção;
banco, hooks, queries, chaves, invalidações, rotas e payloads não mudaram.

**Fontes e regras conferidas (migrations do backend).**

| Ponto | Regra |
|---|---|
| Status | Enums `project_status` (6) e `project_item_status` (5); transição livre, nenhum trigger muda status nem conclui projeto. |
| Campos | Projeto: nome obrigatório, status `idea` por padrão; orçamento, 3 datas, descrição e notas opcionais, sem regra entre datas. Item: projeto e nome obrigatórios, `wishlist` e `medium` por padrão, o resto opcional. Item ↔ veículo do projeto checado por trigger. |
| Progresso | `project_progress`: denominador = itens **não cancelados**; concluído = só `installed`; `pct_items_completed` nulo sem denominador; `total_estimated`/`total_actual` = soma dos não cancelados com `coalesce(…, 0)`; `pct_budget_used` = real ÷ orçamento, nulo sem orçamento ou com orçamento 0. |
| Financeiro | `vehicle_financial_summary`: só `installed`, pelo `actual_cost` (estimado nunca); total investido com ou sem data; mês/ano e `vehicle_expenses_by_month` só com `occurred_on`. Nenhum item vira gasto. |
| Histórico | `vehicle_timeline` só traz item com `occurred_on`; o link leva ao detalhe pelo `metadata.project_id`. |
| Painel | `active_projects_count` = ideia, planejado, em andamento, pausado. |
| Excluir projeto | `project_items.project_id` `on delete cascade` (ADR-033). `attachments` é polimórfica, sem FK nem trigger: os anexos dos itens **ficam** (linha e arquivo). |
| Excluir item | O hook apaga Storage → linha de `attachments` → item, nessa ordem. |

**Decisão.**

- Lista em dois painéis, Ativos e Encerrados, com o corte do
  `active_projects_count`; nada some — os dois aparecem sempre que há projeto.
  Ordem da consulta dentro de cada um. Sem busca, filtro, ordenação, kanban.
- Linha estruturada (não card grande): nome, selo, descrição em 2 linhas,
  datas; progresso e os três valores da view à direita. "Abrir projeto" é o
  caminho de teclado; o nome é link de ponteiro fora do Tab (ADR-085).
- Selos: projeto em andamento no acento, pausado âmbar, concluído verde,
  cancelado tracejado; item comprado no acento, instalado verde, cancelado
  tracejado; prioridade só em texto.
- Progresso **lido** da view, nunca refeito: barra + "N de M itens instalados"
  + %; sem denominador, o motivo em texto. O que vem dos itens carregados é só
  contagem (comprados, cancelados, quantos têm valor); com ela o painel troca
  o R$ 0,00 do `coalesce` por "Nenhum informado" quando nenhum item tem valor.
  O % do orçamento é o `pct_budget_used`, sem saldo, sem "restante".
- Item com estimado e real em colunas separadas e rotulados no celular; o
  "Detalhes" diz que o estimado não entra em total do veículo e se o real
  entra (instalado) ou fica só no projeto.
- Link externo só vira `<a>` para http/https (antes qualquer texto ia para o
  `href`); o texto salvo aparece inteiro em "Detalhes".
- Detalhe ganha "Editar projeto" (o mesmo diálogo da lista). A exclusão do
  projeto fica só na lista, como antes: excluir pelo detalhe exigiria um fluxo
  novo de navegação depois da exclusão.
- Formulários no padrão das etapas 03–08: foco no diálogo ao abrir, foco no 1º
  inválido (abre a seção recolhida), erro do banco no rodapé com os dados
  mantidos, ref contra envio duplicado, valores iniciais só na montagem,
  recolher só esconde. Nada muda status, data ou custo sozinho.
- Diálogos de editar/excluir ficam na página. Foco: volta ao "⋯"; se a linha
  trocou de grupo ou sumiu, vai pro título do grupo (lista) ou de "Itens"
  (detalhe). Excluir item manda o foco direto para "Itens": o hook não espera o
  refetch, e voltar ao "⋯" deixava o foco no `<body>` quando a linha sumia.
- Exclusões com as consequências da tabela, sem prometer recuperação nem
  limpeza de anexo do projeto.
- Mensagens: só o texto ("Orçamento inválido.", "Custo estimado inválido.",
  "Custo real inválido."), pelo 2º parâmetro dos helpers.
- Manutenção: "Excluir serviço?" mostra "Custo não informado" para custo
  ausente (antes "Sem custo"); zero continua R$ 0,00.

**Alternativas descartadas.** Kanban por status (pedido explícito contra).
Grupo por status de projeto em seis painéis (fragmenta e esconde a ordem).
Somar no detalhe a parte do projeto que entra nos totais do veículo (conta
nova, sem fonte). Copiar o real do estimado ao marcar comprado/instalado.
Concluir o projeto quando todos os itens estão instalados. Medidor circular.

**Pendências registradas (fora do escopo, não alteradas).**

- **Anexos órfãos ao excluir projeto**: a cascata apaga os itens, mas não as
  linhas de `attachments` nem os arquivos no Storage. Conferido no mock
  (os dois anexos do "Motor" ficam). A confirmação não promete limpeza.
- **Excluir item apaga o anexo antes da linha** (mesma ordem de gasto,
  manutenção e problema): se a exclusão do item falha, o anexo já foi.
  Conferido no mock.
- **`?novo=1` em Projetos**: continua tratado (com projeto, "Adicionar item"
  com seletor; sem projeto, o aviso), mas nada no app aponta mais para ele — o
  "Upgrade" da folha Registrar vai para Modificações. O aviso ainda diz "atalho
  'Upgrade'". Comportamento e texto preservados até decisão funcional.
- **Lista: custo real/estimado ausente × zero**: a view devolve 0 quando nenhum
  item tem valor; sem os itens, a lista não distingue "nenhum informado" de
  R$ 0,00 (o detalhe distingue). Depois da revisão, a lista avisa a dúvida
  (abaixo); a distinção exata continua só no detalhe.
- Falha de `project_progress` derruba a lista inteira (o `fetchProjects` lança),
  como antes.
- A ordem dos itens é `sort_order, created_at`; não há como reordenar na tela.

**Verificação.** Dados simulados (ferramenta externa, `redesign-capturas/`,
cenários 103–112, arquivos 209–216): seis projetos do Gol (um por status;
orçamento ausente, zero e estourado; sem item; só cancelados) e nove itens no
"Motor" com os cinco status, valores ausentes e zero, instalado sem data,
links e dois anexos. `project_progress` com a regra da view, LEDGER e
`active_projects_count` reescritos a cada escrita, `vehicle_timeline` com os
itens datados, cascata no mock. Rede trancada; nenhuma chamada ao Supabase
real, nenhuma exclusão real. Nenhum aparelho físico nem leitor de tela real.

**Ajustes da revisão (04/11/2026).**

- **Progresso**: o painel dizia a regra duas vezes seguidas ("1 comprado ainda
  não conta · 1 cancelado fica fora da conta" e "Conta só o que está
  Instalado…"). Agora é uma frase só, completa, com a contagem deste projeto
  no fim ("— aqui, 1 comprado e 1 cancelado."); sem progresso a medir, só a
  regra, porque a contagem repetiria o texto do estado vazio.
- **Soma zero na lista**: custo real ou estimado igual a 0 sai como "R$ 0,00"
  com "valores podem não estar informados" embaixo, e o leitor de tela ouve o
  porquê (a lista soma como zero o item sem valor; o projeto mostra quais têm
  valor). Sem consulta nova, sem mudar a fórmula; o orçamento, que é coluna do
  projeto, continua sem aviso. Descartado: um botão de ajuda por linha (mais
  uma parada de Tab em cada projeto para um texto que cabe visível).
- **Linha da lista mais compacta** (acabamento, não bloqueio): a partir de
  `lg`, "Abrir projeto" e "⋯" sobem para logo abaixo da identificação e o
  bloco de progresso e valores ocupa a altura da linha à direita
  (`grid-rows-[auto_1fr]`). O vão entre datas e ações caiu para 4px; abaixo de
  `lg` a linha continua empilhada. Ordem de Tab inalterada.
- Verificação: cenário 113 (arquivos 217–220, `relatorio-ajustes.txt`) em 1440,
  1024, 820, 390 e 360, claro e escuro — axe sem violações, nenhum alvo menor
  que 44px, sem rolagem horizontal; build e lint limpos. Os cenários 103–112
  não rodaram de novo.

## ADR-093 — Recalibração visual 01: identidade + Minha garagem

**Status.** Implementada só na Garagem e na marca do shell; **aguardando
aprovação visual** antes de chegar a outras telas. A etapa 10 do redesign
está pausada.

**Contexto.** Comparadas com a referência aprovada ("Dashboard Garage
Automotiva em Tema Escuro"), as etapas 01–09 deixaram a Garagem com cara de
sistema administrativo: título de 24px/600 e modelo de 18px/600 (pouca
diferença de peso), valores em JetBrains Mono, faixa de quatro módulos com
fio entre eles e dicas longas, "Detalhes da garagem" ocupando uma linha antes
dos carros, card com "baia 01", divisores e "Abrir veículo" por extenso, e
uma marca vetorial de traço fino de 9px, mais fina e angular que o lettering
encorpado da referência.

**Decisão.**

- Marca v2 desenhada como polígonos numa grade (não fonte, não traço de
  bitmap), salva ao lado da v1 (`slow-garage-logo-v2-*.svg`). `BrandLogo`
  ganhou `version` (padrão 1); o shell autenticado (`Sidebar`, `AppShell`)
  passa `2`. Consumidores e efeitos: sidebar (todas as telas `lg`+) e
  cabeçalho do celular (todas as telas) — a marca é uma só no app autenticado,
  então trocá-la só na Garagem criaria duas marcas. Login segue na v1.
  Favicon, manifest e ícones PWA intactos.
- Fonte display local (Archivo variável, OFL) num token aditivo
  `--font-display`, usado só pelos componentes da Garagem. Nenhum token
  existente mudou de valor.
- Garagem recomposta: capa editorial compacta no desktop (sem foto),
  cabeçalho curto e ação em largura cheia no celular, resumo curto sem caixa
  por módulo (`GarageOverview`), detalhes depois da grade (`GarageDetails`),
  card no idioma da referência (`VehicleCard`, `VehicleCardPhoto`). O
  `GarageTile` compartilhado com dashboard, combustível e financeiro **não**
  mudou — o número do resumo da Garagem é um componente local (`GarageStat`)
  com o mesmo contrato de estados.
- Indicadores do card: Odômetro e Total investido (os mesmos em todo card,
  como na referência). Gasto do mês atual foi para a Ficha técnica; nada saiu
  do card.

**Diferenças deliberadas em relação à referência.** Sem foto no hero (não há
asset licenciado, e foto genérica não seria do usuário); sem busca, abas de
filtro, ordenação e grade/lista (não existem no produto); sem logos de
fabricante; sem katakana; status são os quatro reais (Ativo, Projeto,
Guardado, Vendido), não "Uso diário"; nenhuma borda laranja fixa de card
"selecionado"; o "⋯" sobre a foto tem fundo sólido; os 4 registros rápidos
continuam no card (ADR-053).

**Não mudou.** Rotas, schemas, hooks, queries, chaves e invalidações,
fórmulas (somas do resumo e do comparativo iguais), regras de status, banco,
autenticação, permissões.

**Verificação.** Capturas e relatórios em
`redesign-capturas/recalibracao-visual-01/` (cenários `rv1`–`rv5` do
`inspect.mjs`, antes e depois). Axe sem violações em 24 estados (1920, 2560,
1440 claro, 1366, 1280, 1024, 820 claro/escuro, 390, 360 claro/escuro, 320;
ficha, menu e detalhes abertos; um veículo; vazio); nenhum alvo menor que
44px; sem rolagem horizontal; sem interativo aninhado; foco laranja visível
na seta; build e lint limpos. Limitação: em 320×640 o nome do primeiro carro
fica logo abaixo da dobra (621 × 583px), e o rodapé do card quebra em duas
linhas.

## ADR-094 — Garagem A3 + capa A3.1: revista automotiva japonesa

**Status.** Implementada na Minha garagem, a partir do estudo estático
aprovado (propostas A3 e A3.1). Outras telas, marca e shell não mudaram.

**Contexto.** A recalibração 01 (ADR-093) aproximou a Garagem da referência,
mas o usuário definiu a inspiração como revista automotiva japonesa de
preparação — cultura de garagem e de projeto pessoal. Os estudos A → A2 →
A3 → A3.1 (fora do repositório, `redesign-capturas/estudos-garagem-v2/`)
fixaram a composição; a A3.1 trocou a capa por uma colagem fotográfica. O
estudo foi aprovado visualmente antes desta implementação.

**Decisão.**

- Página sem largura máxima: capa, resumo e coleção na mesma margem depois
  da sidebar, com escala fluida travada entre 1440 e 2560 (tokens
  `--garage-*`). A recalibração 01 centralizava em 76rem e deixava faixa
  vazia junto à sidebar no largo.
- Capa desktop com a imagem da A3.1 (uma imagem já composta: carro +
  recortes de roda e motor, 3:1) e coluna de texto alinhada à grade da
  coleção; celular sem foto. Rejeitado: remontar a colagem em CSS com fotos
  CC0 avulsas (primeira versão desta ADR) — o usuário apontou que não era a
  capa aprovada.
- Resumo em faixa colada à capa, com "Detalhes e comparativo" no fim; o
  painel abre logo abaixo dela. Rejeitado: manter o gatilho no título da
  seção depois da grade (ADR-093) com o botão novo só rolando até ela — dois
  controles para a mesma região, e o botão da faixa abriria algo fora da
  tela.
- Card como ficha editorial em três composições por **container query** (a
  largura do card decide, não a viewport): vertical, spread compacto e
  spread largo com a ficha técnica aberta numa coluna. Rejeitado: ampliar
  foto, nome e números no desktop largo (o que a A2 fazia) — no 2560 o card
  ficava com texto grande demais e vazio interno.
- Grade: 2 cards por linha com coleção ≥ 1100px, senão 1; 1 veículo vira um
  spread de destaque. Rejeitado: "vaga livre" ou painel financeiro para
  completar linha (enchimento sem função).
- Status e "⋯" saíram de cima da foto para a linha do número; o degradê da
  base da foto saiu. "Abrir veículo" existe em duas formas (seta no vertical,
  rótulo no spread), só uma visível por vez — continua uma parada de Tab.
- Composição em `src/styles/garage.css` (classes `garage-*`, só tokens) em
  vez de utilitários: áreas de grade e container queries virariam dezenas de
  classes arbitrárias por elemento. Exceção consciente à regra "tudo em
  utilitário"; a regra de tokens continua valendo.

**Ajustes da revisão visual.** Região sem foto com superfície própria (não o
fundo da página); "Minha garagem" numa linha no celular de 360px pra cima;
no tema claro a foto de fundo da capa é chapa de borda seca em vez de
degradê do claro para o escuro.

**Imagem.** Uma imagem editorial **gerada** para o estudo A3.1 e fornecida
pelo usuário (`src/assets/garage/cover.webp`, 2172×724, 88 KB; original em
`redesign-capturas/estudos-garagem-v2/fonte/assets/capa-a3-1-gerada-original.png`).
Ilustrativa, não representa veículo cadastrado. Decorativa (`alt=""`,
`aria-hidden`), sem crédito sobre a imagem. Servida por `<picture>` com
`media` de `lg`: abaixo disso o navegador usa um pixel vazio e não baixa nada
(`loading="lazy"` em bloco oculto não bastou — o Chrome baixava no celular).
Fora do precache do PWA (o Workbox só pega js, css, html e woff2).

*Histórico da imagem.* A primeira montagem desta ADR usou quatro fotos reais
do Unsplash, CC0 (oficina, garagem, motor, gaiola; 167 KB em WebP), remontadas
em CSS como colagem — e por isso registrava "nenhuma imagem gerada por IA".
O usuário apontou que não era a capa aprovada; a colagem saiu do app e a capa
passou a ser a imagem gerada da A3.1 acima. As fotos CC0 seguem creditadas no
`CREDITOS.txt` do estudo. A frase "nenhuma imagem gerada por IA" vale só para
aquela primeira versão.

**Rolagem dupla.** No desktop quem rola é o `<main>`; textos só para leitor de
tela (`sr-only`, posição absoluta) sem ancestral posicionado se posicionavam
pelo documento e esticavam a janela — aparecia uma segunda barra. A página
da Garagem (`.garage-page`) é `position: relative`.

**Não mudou.** Rotas, schemas, hooks, queries, chaves e invalidações,
fórmulas (somas do resumo e do comparativo iguais), regras de status, banco,
autenticação, permissões. Nenhuma função nova: cadastrar, abrir, ficha
técnica, registrar gasto/abastecimento/manutenção, adicionar foto,
editar/excluir, detalhes e comparativo, perfil, notificações e alertas são os
mesmos. `GarageTile` (compartilhado) intacto; `VehicleQuickActions` ganhou só
o rótulo visível no spread largo. `CreateVehicleDialog.triggerLabel` aceita
`ReactNode`.

**Verificação.** Capturas e relatório em `redesign-capturas/garagem-a3/`
(cenário `a3` do `inspect.mjs`, Supabase simulado; rodada final em `r8/`). Axe
sem violações em 24 estados (2560, 1920, 1440 claro/escuro, 1280, 1024 claro,
768, 390 claro/escuro, 360, 320; quatro carros; ficha, menu e detalhes abertos
em 1440/390/2560; um veículo em 1440/2560/390; vazio em 1440/390). Sem rolagem
horizontal, sem interativo aninhado, nenhum alvo menor que 44px, nenhum
elemento fora do card, foto nunca sobre o texto, colagem nunca sobre o texto
nem fora da capa (folga de 129px em 1024 a 633px em 2560). Celular: zero
arquivos de imagem da capa baixados. Foto que falha mostra "Foto
indisponível no momento.". `npm run lint` e `npm run build` limpos.
Limitações: em 320×640 o nome do primeiro carro termina em 637px, logo
abaixo da dobra (583px) — como na ADR-093; em 1280 a coleção tem 960px e
fica com 1 card por linha.

**Consolidação (harmonização 01, 06/11/2026).** Esta ADR aparecia duas vezes,
com o mesmo número: a primeira cópia trazia a descrição certa da capa gerada,
mas repetia o parágrafo de verificação da ADR-093 (cenários `rv1`–`rv5`); a
segunda trazia a verificação certa (cenário `a3`) e o "Não mudou" completo,
mas ainda descrevia as quatro fotos CC0 da primeira montagem. As duas viraram
esta entrada única: nenhum fato foi apagado — a primeira montagem está no
histórico da imagem, a verificação da ADR-093 continua na própria ADR-093.

## ADR-095 — Revisão dos cards da Minha garagem: cards verticais da referência

**Status.** Implementada na Minha garagem, antes da etapa 10. **Revisão
visual do usuário pendente.** Capa, resumo, "Detalhes e comparativo", shell e
outras telas não mudaram.

**Contexto.** Na ADR-094 os cards viraram fichas horizontais (spread) com
numeração "01" e, no desktop largo, uma coluna de ficha técnica sempre
aberta. O usuário apontou que isso se afastou da referência original
("Dashboard Garage Automotiva em Tema Escuro.png"), onde o card é vertical,
fotográfico e compacto.

**Decisão.**

- Um só arranjo vertical em toda largura: foto 16:10 → marca, modelo,
  ano · versão + placa → Odômetro e Total investido com a seta laranja
  "Abrir veículo" à direita → faixa secundária com "Ficha técnica" e os
  quatro registros. Saíram o spread, a coluna técnica aberta e a numeração.
- Status volta para cima da foto (pílula escura, canto superior esquerdo) e
  o "⋯" para o canto direito, desenhados na mesma área de grade da foto —
  aparecem também sem foto e na falha. Chapa escura nos dois temas
  (`--garage-chip-*`): fica sobre fotografia, que não muda com o tema.
- Ficha técnica recolhida por padrão em toda largura; abre embaixo da faixa.
- Grade por largura útil: auto-fit com `--garage-card-min` e teto
  min(nº de veículos, colunas da faixa) × `--garage-card-max`; com poucos
  veículos a grade encolhe e fica na margem da página, embaixo do título.
  Rejeitado (na revisão visual): centralizar a grade — com 2 veículos no
  desktop largo os cards ficavam soltos no meio, desalinhados do título, da
  capa e do resumo.
  Rejeitado: `auto-fit` com `minmax(min, max)` fixo — o navegador conta as
  colunas pelo máximo (1440 ficaria com 2 colunas para 4 carros). Rejeitado:
  esticar os cards (1fr) — 2 veículos em 2560 viravam painéis de 1100px.
- Dicas visíveis dos botões só com ícone (registros, seta, "⋯") em CSS
  (`data-tip`), no hover e no foco de teclado; o `title` nativo saiu (não
  aparecia no foco). Ancoradas pela direita do botão, nunca passam da borda
  do card. O nome acessível continua sendo o `aria-label`.
- Sem `overflow: hidden` no card (a foto arredonda os próprios cantos) para
  as dicas não serem cortadas.
- Ordem de tabulação mantida: Abrir veículo, Ficha técnica, 4 registros,
  Mais ações. A foto e o selo abrem o veículo pelo link esticado do título.

**Diferenças deliberadas da referência.** Sem logo de fabricante; sem ícones
ao lado dos indicadores (tirariam ~50px e empurrariam o segundo valor para
baixo nos cards de 336–360px); sem "Uso diário" (os status são os reais);
faixa de registros e ficha técnica a mais (funcionalidade existente); a
transição escura na base da foto é bem mais leve que a da referência, para
não escurecer fotos comuns de celular.

**Não mudou.** Rotas, consultas, fórmulas, status, regras de negócio,
formulários, upload, editar/excluir (diálogos, confirmação e retorno do foco
ao "⋯"), capa (medidas iguais às da r8 em 1024–2560), resumo, painel de
detalhes, rolagem do `<main>`. `VehicleCard`, `VehicleCardPhoto`,
`VehicleCardMenu` e `VehicleQuickActions` só são usados na Garagem.

**Verificação.** Cenário `a3c` do `inspect.mjs` (Supabase simulado, nada
gravado), relatório e 6 capturas da região dos cards em
`redesign-capturas/garagem-a3/cards-r2/` (a `cards-r1` é a versão centralizada,
recusada). Larguras 320, 360, 390, 768, 1024,
1280, 1440, 1920 e 2560 com 1, 2 e 4 veículos: sem rolagem horizontal, sem
segunda rolagem da janela, nenhum elemento fora do card, nenhum valor sob a
seta, faixa em uma linha (inclusive 320px), linhas da grade com a faixa
alinhada, título na margem da página. Nome e versão longos quebram
completos; ausente ("—") distinto de zero ("0 km", "R$ 0,00");
"R$ 1.236.402,89" e "1.234.567 km" descem para a segunda linha em vez de
comprimir. Foto com erro ("Foto indisponível no momento.", sem "Adicionar
foto") e sem foto ("Adicionar foto"), com status e "⋯" nos dois. Teclado:
dica visível no foco; menu abre pelo Enter, Escape fecha e devolve o foco ao
"⋯"; editar e excluir abrem, Escape devolve o foco ao "⋯". Celular: última
ação do último card acima da barra inferior (rolagem real da janela). Axe
sem violações em 24 estados (claro e escuro; ficha e menu abertos; limites;
erro de foto). `npm run lint` e `npm run build` limpos. Primeiro carro na
primeira tela também em 320×640 (nome termina em 570px, barra em 583px).

**Limitações.** Em 320px os dois indicadores empilham (o segundo desce) e a
faixa mostra "Ficha" — " técnica" fica fora da vista, mas continua no nome
acessível. Com um nome de 3 linhas na mesma linha da grade, os vizinhos
ganham um vão entre a identificação e os números (a faixa fica alinhada). Com
uma ficha aberta a grade inteira deixa de esticar os cards (`:has` na grade,
não por linha). As faixas da container query são aproximadas: entre 688 e
695px de coleção (viewport ~720–735px) cabe 1 coluna, mas o teto é o de 2 —
o card ocupa a largura toda e o placeholder sem foto fica em 16:10.

## ADR-096 — Minha garagem: busca, abas, ordenação, grade/lista e cabeçalho sobre a capa

**Status.** Implementada. **Revisão visual do usuário pendente.** Só a Minha
garagem e o cabeçalho do shell quando ela está aberta.

**Contexto.** Na revisão da ADR-095 o usuário apontou o que a referência
original tem e a tela não tinha: busca "Buscar na garagem…" no cabeçalho, abas
por status com contagem, "Mais recente" e alternância grade/lista, e o
cabeçalho flutuando sobre a capa (a capa vai até o topo).

**Decisão.**

- **Busca** (`GarageSearchField`): no cabeçalho a partir de `lg`, com ⌘K /
  Ctrl K; abaixo de `lg`, na barra da coleção. Filtra veículos por marca,
  modelo, versão, ano e placa, sem caixa nem acento, placa sem hífen; cada
  palavra precisa aparecer. Só veículos (não registros). Estado em memória
  compartilhado (`useGarageSearch`, `useSyncExternalStore`). Rejeitado:
  texto na URL (`?busca=`) — o campo controlado relia a URL, que atualiza
  com atraso, e perdia letras com digitação rápida (medido: "opala" virou
  "a").
- **Abas** Todos/Ativos/Projetos/Guardados/Vendidos com contagem já com a
  busca aplicada: botões de alternância (`aria-pressed`) num grupo, não
  `tablist` (filtram a mesma lista). Aba vazia continua clicável e mostra
  "Nenhum veículo guardado." com "Ver todos". Resultado anunciado em região
  `aria-live`. No celular as abas rolam dentro da própria faixa.
- **Ordenação**: mais recente (padrão, a ordem de antes), mais antigo, nome,
  maior investimento, maior quilometragem (ausente vai para o fim).
- **Grade/lista**: a lista é o mesmo card deitado (miniatura 16:10 à
  esquerda, indicadores e seta à direita, faixa embaixo do texto), até
  1200px. Some quando a coleção só comporta uma coluna (celular). Ordem e
  visualização ficam no `localStorage` do navegador.
- **Título "Seus veículos"** passa a ser só para leitor de tela (a contagem
  está em "Todos (N)"); continua o alvo do foco depois de excluir.
- **Indicadores com ícone** (odômetro e cifrão), como na referência: máscara
  em CSS (`data-icon`) porque dentro de `<dl>` só cabem `<dt>`/`<dd>`;
  menores em cards até 368px. Revoga a diferença deliberada da ADR-095.
- **Cabeçalho sobre a capa** (`lg`+, só na garagem): o cabeçalho sai do
  fluxo, transparente com um véu curto do fundo enquanto o `<main>` está no
  topo e sólido quando rola; para antes da barra de rolagem do `<main>`. A
  capa começa no topo e o texto desce 64px. A foto sobe até o topo só a
  partir de 1440 no escuro — subir com a proporção 3:1 aumenta o carro, e
  entre 1280 e 1439 ele passaria por baixo do título; no claro (chapa de
  borda seca) a folga cairia de 161 para 32px. Nesses casos a foto mantém a
  geometria anterior, logo abaixo do cabeçalho.

**Não mudou.** Rotas, consultas, regras, formulários, cards (além dos ícones),
resumo, detalhes, sidebar, barra inferior, cabeçalho das outras telas.

**Verificação.** Cenários `a3c` e `a3d` do `inspect.mjs`, relatório e capturas
em `redesign-capturas/garagem-a3/barra-r1/`. Axe sem violações em 36 estados;
sem rolagem horizontal; cabeçalho nunca cobre a barra de rolagem; título da
capa sempre abaixo do cabeçalho; folga texto × carro 81px (1440), 85 (1280),
454 (1920), 870 (2560), 161 (1440 claro). Busca: Ctrl+K foca; "opala",
"frt-2e45", "edicao especial" acham o veículo certo; sem resultado mostra o
vazio; Escape limpa. Abas e as cinco ordenações conferidas. Lista em 1440 e
768 sem transbordo; no celular volta à grade. `npm run lint` e
`npm run build` limpos.

**Limitações.** Em 320×640 o primeiro carro fica abaixo da dobra (nome em
648px, barra em 583px) — a barra da coleção ocupa 99px. Em 1440 escuro a
folga entre texto e carro caiu de 200 para 81px. A busca zera ao recarregar.

**ADR-096, ajuste do card (pedido "mais parecido com a referência").** Foto
16:9 (fotos 4:3 perdem ~12% em cima e embaixo); no escuro o terço de baixo da
foto escurece até a cor do card, sem borda entre os dois — nenhum texto sobre
a foto; no claro continua chapa seca. Marca em texto normal (14px, cinza) em
vez de caixa-alta espaçada. Filete vertical entre os indicadores; valor 15px,
rótulo 11px. Pílula de status com contorno fino; chapa do "⋯" de 28px (alvo
continua 44px). Faixa de ficha e registros mantida. Verificação em
`redesign-capturas/garagem-a3/cards-r3/` (cenários `a3c` e `a3d`): axe sem
violações em 36 estados, sem transbordo nem rolagem horizontal; os
indicadores só empilham em 320px, com 6 dígitos de km em 360px e nos valores
de R$ 1,2 milhão dos casos-limite.

## ADR-097 — Minha garagem: "vaga livre" e placa no padrão Mercosul

**Status.** Implementada a pedido do usuário. **Revisão visual pendente.**

**Decisão.**

- **Vaga livre**: o último lugar da grade é um espaço tracejado com "+",
  "Vaga livre" e **"Estacionar veículo"** (texto pedido pelo usuário). É o
  gatilho do mesmo `CreateVehicleDialog` da capa — não um card fictício. Só
  aparece sem busca e sem filtro de status. Ocupa uma coluna como um card
  (a regra de largura da grade conta a vaga). No celular, 136px de altura;
  na lista, uma faixa baixa. Laranja só no hover. **Revoga** o "Rejeitado:
  vaga livre" das ADR-094 e ADR-095.
- **Placa Mercosul**: chapa branca, faixa azul em cima, caracteres pretos
  (Archivo 700), nos dois temas — tokens `--plate-paper`, `--plate-ink`,
  `--plate-band`. Continua ao lado de ano · versão, só quando o veículo tem
  placa cadastrada.
- **Filete entre os indicadores** (ADR-096): cada indicador tem filete à
  esquerda e o de quem começa a linha fica fora da caixa (margem negativa +
  `clip-path`, a técnica da faixa de resumo) — quando o segundo valor desce,
  não sobra filete solto.

**Verificação.** Cenários `a3c` e `a3d`, relatório e capturas em
`redesign-capturas/garagem-a3/vaga-placa-r1/`: axe sem violações em 36
estados (inclui contraste da placa e da vaga), sem transbordo, nenhum alvo
menor que 44px, última ação acima da barra inferior. `npm run lint` e
`npm run build` limpos.

**ADR-097, sem linha no cabeçalho da garagem.** A pedido do usuário, na Minha
garagem (desktop) o cabeçalho não tem borda em nenhum estado (no topo e
rolado), o filete sob o logo da sidebar some (ficava solto na altura do fim
do cabeçalho) e, entre 1024 e 1439 no escuro, a foto da capa entra em
degradê de 24px no topo em vez de corte seco logo abaixo do cabeçalho. As
outras telas mantêm a borda do cabeçalho e o filete do logo. Verificação em
`redesign-capturas/garagem-a3/sem-borda-r1/` (cenário `a3d`, axe sem
violações em 12 estados).

**ADR-097, vaga livre com a ficha técnica aberta (06/11/2026).** A pedido do
usuário: abrir a ficha de um card encolhia a vaga livre para o mínimo (12rem).
A grade vai a `align-items: start` com uma ficha aberta (ADR-095, o vizinho não
estica), e a vaga é item da grade. Agora o `VehicleListPage` mede a vaga com
todas as fichas fechadas (`ResizeObserver`) em `--garage-slot-rest-h`, e o CSS
usa essa medida como altura mínima enquanto uma ficha está aberta — a vaga fica
do tamanho que tinha, sem crescer junto com o card aberto. Se a janela muda de
largura com a ficha aberta, a medida vira a do maior card fechado. Só na
grade; na lista nada muda. Rejeitado: deixar a vaga esticar (cresceria até a
altura do card aberto, mais alta que o vizinho). Verificação: cenário 121 do
`inspect.mjs` (`redesign-capturas/etapa-10/relatorio-ajustes.txt`) — 1600 com
2 carros (444px fechada, aberta e fechada de novo; 427px depois de reduzir a
janela a 1100 com a ficha aberta), 1440 com 4 e 390 com 1, axe sem violações.

## ADR-098 — Redesign etapa 10: Modificações

**Status.** Implementada. **Revisão visual pendente** — não aprovada.

**Contexto.** Modificações era um cabeçalho em caixa com borda laranja e
ícone de brilho, três caixas de indicadores, um gráfico "Investimento por mês"
em barras laranja, filtros soltos e cards com lápis e lixeira (o
`ExpenseListItem`, que a etapa 05 deixou de fora — ADR-088). Esta etapa leva
a identidade da Garagem (títulos em Archivo, faixa de resumo com filetes,
laranja só em ação e navegação) para uma página de registros, sem capa nem
foto. Banco, hooks, consultas, chaves, invalidações, rotas, payloads e
fórmulas não mudaram.

**Comportamento conferido no código.**

| Ponto | Regra |
|---|---|
| O que é | Gastos (`expenses`) da categoria de **sistema** `upgrade` (`user_id` nulo). Mesma consulta de Gastos (`useExpenses` com `categoryId`), mesmos diálogos. Itens de projeto são `project_items`, outra tabela: não entram aqui, e nada daqui entra em Projetos. |
| Categoria | Cadastro e edição a partir de Modificações gravam `upgradeCategoryId` e não mostram o campo de categoria. Em Gastos o mesmo registro aparece com o seletor e pode mudar de categoria (aí sai de Modificações) — comportamento de antes, preservado. |
| Campos | Valor obrigatório (≥ 0, NOT NULL — não existe "custo não informado"); descrição ("Modificação"), data (em branco grava hoje), km, fornecedor, pagamento e notas opcionais. |
| Resumo | Total e contagem: linha `upgrade` de `vehicle_expenses_by_category` (via RPC do dashboard; sem linha = 0). Último registro e "por mês" (últimos 6 meses com registro): somados no cliente sobre a lista, como antes. O total já está dentro de Gastos e do total investido. |
| Lista | Sem paginação; busca (descrição, fornecedor, notas), período e ordem (recentes, antigos, maior valor) no cliente; "N registros · R$ X nesta seleção" é a soma do que está visível, como antes. |
| `?novo=1` | Abre o cadastro (folha Registrar → "Upgrade"); fechar tira o parâmetro. |
| Anexo | Só na edição (`AttachmentField`, compartilhado). |
| Excluir | O hook apaga Storage → linha de `attachments` → gasto, depois de confirmar. |

**Decisão.**

- Cabeçalho compacto: `h1` "MODIFICAÇÕES" em Archivo 800, uma frase ("Upgrades
  deste veículo, lançados como gasto.") com ajuda "i" (o que entra; editar aqui
  muda o mesmo registro de Gastos; itens de projeto ficam em Projetos) e
  "Registrar upgrade" (no celular "Registrar" + "+"). O veículo aberto continua
  na trilha e no seletor do cabeçalho do shell, sem ficha repetida.
- Resumo em faixa com filetes (sem caixa por número): total, contagem e último
  registro; no celular a contagem vira linha de apoio do total (uma linha de
  duas células). Legenda: "Todo o período. Já está dentro dos gastos e do
  total investido do veículo, não é um valor à parte."
- Lista estruturada (não `<table>`, motivo do ADR-088) num painel com a busca e
  os dois seletores no topo; colunas a partir de `md` (modificação · data ·
  valor · "⋯"), proporcionais a partir de `2xl`; no celular nome e "⋯" na
  primeira linha, valor e metadados embaixo (ver os ajustes da revisão). Nota com mais de 140 caracteres
  ou com quebra de linha mostra duas linhas e "Ver nota inteira"
  (`aria-expanded`). Editar/excluir no "⋯" (`RowActionsMenu` de Projetos).
- "Upgrades por mês": a mesma conta, barras neutras com o valor escrito; ao
  lado da lista a partir de `xl` (320px), depois dela abaixo disso.
- Valores em Archivo com algarismos tabulares (o mono fica para dado técnico).
- Estados: carregando sem zero (traço pulsante, `aria-busy`); falha do RPC só
  no resumo ("Indisponível" + "Tentar de novo"), falha da lista só no painel
  — um não derruba o outro; vazio com "Registrar primeiro upgrade"; filtro
  sem resultado diz a seleção e quantos registros ficaram fora.
- Diálogos de editar/excluir na página (um upgrade editado pode sair da busca
  e desmontar a linha); o editado é lido da lista mais recente (o anexo
  atualiza com o diálogo aberto). Foco volta ao "⋯"; se a linha sumiu, ao
  título "Registros".
- Exclusão: no modo upgrade o texto agora diz "Sai desta lista, de Gastos e
  dos totais e gráficos do veículo" (é o mesmo registro). Em Gastos o texto
  não mudou.
- `ExpenseListItem` removido: só Modificações o usava.

**Alternativas descartadas.** Reaproveitar o `ExpenseRow` de Gastos (coluna de
categoria sempre "Upgrade", e a edição abriria o seletor de categoria). Somar
itens de projeto instalados ao total (regra nova, conta dupla com Projetos).
Status de projeto (Planejado/Comprado/Instalado) nos upgrades. Esconder a nota
atrás de um "Detalhes" em toda linha (uma parada de Tab a mais para quem não
tem nota). Remover o gráfico por mês (função existente).

**Pendências registradas (fora do escopo, não alteradas).**

- **Anexo apagado antes da linha** (mesma ordem de gasto, manutenção,
  problema e item): se a exclusão do gasto falha, o anexo já foi. Conferido no
  mock (Storage e `attachments` antes do DELETE que falhou). A confirmação não
  promete operação atômica nem recuperação.
- **Precisão dos indicadores calculados na tela (limite de 1000 linhas).** A
  lista não pagina e o PostgREST corta a resposta em `max_rows = 1000` sem
  avisar. A consulta já filtra a categoria no servidor e ordena da data mais
  recente para a mais antiga, então, com mais de 1000 upgrades no veículo:
  - a lista mostra só os 1000 mais recentes, e a busca e o período (que rodam
    na tela) não encontram os mais antigos;
  - "N registros · R$ X nesta seleção" soma só o que veio — fica **menor** que
    o total do resumo, sem nenhum aviso (Gastos esconde o total nesse caso;
    Modificações não);
  - "Upgrades por mês": o mês mais antigo dos seis pode sair **incompleto** se
    o corte cair dentro dele;
  - "Último registro" continua certo (os mais recentes sempre vêm);
  - total e contagem do resumo continuam completos (vêm da view).
  Nenhuma correção nesta etapa (pede paginação ou agregação no servidor);
  conferir antes de confiar nos números de um veículo com esse volume.

**Verificação.** Dados simulados (ferramenta externa, `redesign-capturas/`,
cenários 114–120, arquivos 221–226): sete upgrades do Civic (nota longa com
quebras, anexo, sem descrição, R$ 0,00, R$ 128.750,45, 7 meses) e 36 a mais na
lista extensa; escritas, anexos e Storage interceptados, LEDGER reescrito a
cada escrita. Rede trancada; nenhuma chamada ao Supabase real, nenhuma
exclusão real. Axe sem violações em 24 estados; `npm run lint` e
`npm run build` limpos. Nenhum aparelho físico nem leitor de tela real.

**Ajustes da revisão (06/11/2026).**

- **Linha no celular**: antes o valor e o "⋯" reservavam uma coluna à
  direita e prendiam nome, nota e anexo numa faixa estreita (o coilover em
  360px ficava com o nome em ~5 linhas). Agora a primeira linha é nome (≈74%
  da largura) + "⋯" no canto; embaixo, o valor e "data · metadados"; anexo e
  nota ocupam a largura útil inteira. A partir de `md` cada bloco tem lugar
  explícito nas mesmas colunas (conferido: data, valor e "⋯" alinhados ao
  cabeçalho em 768, 1024, 1440 e 1920). A ordem no DOM passou a ser nome →
  "⋯" → valor → detalhes, então no Tab o "⋯" vem antes do "Ver nota inteira".
- **Mensagem de km**: "a quilometragem inválido." → "Informe uma
  quilometragem válida." pelo 2º parâmetro do helper; a regra (inteiro ≥ 0,
  opcional) não mudou — km 0 continua aceito. O `expenseSchema` é o mesmo de
  Gastos, então a mensagem nova vale lá também. (A nota do Histórico usa o
  mesmo helper sem o 2º parâmetro e ainda mostra o texto antigo; não alterada.)
- **Filtros**: abaixo de 400px a busca, o período e a ordem empilham. Lado a
  lado, "Mais recentes" cortava em 360 e "Mês passado" em 390, não só em 320.
  Medido: todas as opções inteiras em 320, 360 e 390.
- A pendência do limite de 1000 linhas foi detalhada acima como problema de
  precisão dos indicadores.
- Verificação: cenário 121 (arquivo 227, `relatorio-ajustes.txt`) em 320,
  360, 390, 768, 1024, 1440 e 1920 — axe sem violações, nenhum alvo menor
  que 44px, sem rolagem horizontal, último conteúdo acima da barra.

## ADR-099 — Harmonização 01: sistema visual compartilhado e etapas 01–10 no mesmo idioma

**Status.** Implementada antes da etapa 11. Branch
`feature/043-harmonizacao-design-system`, a partir da
`feature/042-redesign-etapa-10` (árvore limpa na partida). **Revisão visual
pendente** — nada aqui foi aprovado visualmente ainda.

**Contexto.** As etapas 01–10 redesenharam uma tela por vez. Cada uma copiou
a casca da anterior em vez de importá-la: o menu "⋯" existia em cinco cópias
locais e uma em `features/project/`; o selo de situação em três; a classe de
página e de painel em sete páginas; o botão "i" em três; o rodapé dos
formulários em oito (sete idênticos byte a byte); o cartão do registro na
exclusão em onze arquivos; e as peças de formulário moravam em
`features/vehicle/VehicleFormParts` sendo usadas por oito formulários. A
tipografia também divergia: Modificações (etapa 10, a referência das páginas
de gestão) usava título em Archivo caixa-alta e valores em display tabular;
Gastos, Abastecimentos, Manutenção, Problemas e Projetos ainda tinham título
em Space Grotesk 24px e valores em mono — contra a regra (ADR-093) de mono só
na placa. Uma mudança de acabamento precisava ser repetida tela a tela.

**Decisão.**

- **Tokens como fonte única** (`tokens.css`): papéis novos `text-muted` e
  `info` (contraste calculado, claro e escuro com os mesmos papéis); escala de
  página (`--page-*`), de painel (`--panel-*`), de controle (`--control-h`,
  `--control-h-touch`, expostos ao Tailwind como `h-control` etc.), anel de
  foco de campo, `--duration-flash` e a escala tipográfica `--type-*`.
  `tailwind-merge` aprendeu `control` como tamanho, para `h-control` e um
  `h-9` de quem usa não ficarem juntos.
- **Papéis tipográficos como utilitários** (`@utility type-*` em
  `globals.css`), aplicados por componente. Rejeitado: estilizar `h1`/`h2`/
  `button` por seletor global — consistência simulada que quebra toda tela
  que não segue a hierarquia esperada. Caixa-alta só no **título de tela**
  (nome fixo e curto) e na sobrelinha; nome de registro (projeto, veículo)
  usa `type-entity-title` em caixa normal. Rejeitado: caixa-alta em todo
  título — nome digitado pelo usuário em caixa-alta perde legibilidade e
  muda o que a pessoa escreveu.
- **Valores em display tabular, mono só em identificador.** Dinheiro, km,
  litros e consumo passaram de `font-mono` para `type-value`/`type-figure`
  (Archivo 600 tabular): continuam comparáveis e alinhados. Mono ficou na
  placa (`PlateTag`, três lugares), no campo de placa e em código de erro.
- **Componentes básicos evoluídos ou extraídos, não uma segunda biblioteca**:
  `Badge`, `RowActionsMenu`/`menuItemClassName`/`MenuSeparator`, `InfoTip`,
  `Skeleton`/`SkeletonList`, `InlineError`/`PageError`/`NoResults`/
  `EmptyState`/`Alert`, `DisclosureButton`/`DetailItem`, `AlertDialogRecord`,
  `PlateTag`, `textLinkClassName` — todos em `components/ui/`, ao lado dos
  que já existiam. `DashboardPanel` virou `Panel` + `PanelHeader` em
  `components/ui/panel.tsx` (mesma API; os nove consumidores trocaram o
  import). `VehicleFormParts` virou `components/ui/form.tsx`, com `FormBody`
  e `FormFooter` novos. Os arquivos antigos (`DashboardPanel.tsx`,
  `RowActionsMenu.tsx`, `VehicleFormParts.tsx`) saíram depois que nenhum
  consumidor os importava.
- **Padrões de página pequenos, não um componente universal**: `Page`,
  `PageHeader` (com `stackActionsOnMobile` para Manutenção), `ActionLabel`,
  `SummaryStrip`, `PanelHeader`, `PanelCount`, `ListColumns`, `FilterField`.
  Rejeitado: um `ListPage` com dezenas de props para acomodar as seis listas
  — cada tela mantém sua linha, colunas e agrupamentos; compartilham
  respiro, tipografia, selo, "Detalhes", "⋯" e valor.
- **Estados com componente**: carregando, falha de bloco, falha da página,
  sem resultado e vazio deixaram de ser marcação repetida. O texto continua de
  cada tela.
- **Exceções delimitadas**: a Minha garagem continua em `garage.css` (capa,
  colagem, card, grade, abas da coleção) e só passou a consumir
  `--control-h`, `--focus-ring-field` e `--color-text-muted` — valores
  iguais aos que tinha, nenhuma mudança de composição. Layout do dashboard,
  configuração dos gráficos, regras de formulário e textos de exclusão
  continuam de cada tela. Abastecimentos mantém o painel de indicadores em
  vez da faixa de resumo (cada número tem ajuda, erro e "Detalhes" próprios).

**Efeitos nas telas ainda não redesenhadas (etapas 11–16).** Documentos,
Histórico, Fotos, Configurações, Convites e Admin usam os componentes comuns
e receberam: placeholder no tom discreto, título de diálogo pelo papel (mesmo
tamanho, peso e cor; espaçamento de letra −0,015em em vez de −0,025em), `Label`
pelo papel (mesma medida), `Popover`/menus com a altura por token (mesmos
44px), aviso de rota (`RouteNotice`) no `Alert` com fio lateral em vez de
fundo âmbar. Admin continua com o próprio selo (`AdminBadges`) e mono nos
números — redesign dessas telas fica para as etapas delas.

**Não mudou.** Rotas, schemas, hooks, queries, chaves e invalidações,
fórmulas, regras de vencimento e de progresso, ordem das escritas, banco,
autenticação, permissões, textos de exclusão e de ajuda (só a forma). O limite
de 1000 linhas de Modificações e as outras pendências documentadas seguem como
estavam.

**Verificação.** Dados simulados (ferramenta externa `redesign-capturas/ferramenta/inspect.mjs`,
rede trancada, nenhuma chamada ao Supabase real, nenhuma gravação real).
`npm run lint`, `npx tsc -b` e `npm run build` limpos.

- Cenário novo `h01` (pasta `redesign-capturas/harmonizacao-01/`): as seis
  páginas de registro, o detalhe do projeto e o dashboard em 320, 360, 390,
  768, 1024, 1440, 1920 e 2560, claro e escuro alternados — título de tela em
  Archivo 800 caixa-alta que cabe inteiro, ação com 44px, sem rolagem
  horizontal, sem segunda rolagem da janela a partir de 1024, nenhum texto
  em mono fora da placa, nenhum alvo menor que 44px, último conteúdo acima da
  barra inferior; esqueleto pulsa com movimento e para com movimento
  reduzido. 23 estados com axe sem violação. Doze capturas.
- Cenários anteriores das telas afetadas rodados de novo **fora** das pastas
  das etapas (rascunho, só conferência): Gastos 49–59, Abastecimentos 73–79,
  Manutenção 84–91, Problemas 94–101, Projetos 103–113, Modificações
  114–121, dashboard 31, 33, 34, 40–48, 61–66, formulários do veículo 22–29,
  shell 2 e 7, garagem 11, 16, `a3c` e `a3d` (cards, grade, barra da coleção, busca, 320–2560). Somados ao `h01`, 242 estados com axe sem
  violação; nenhum com rolagem horizontal; alinhamento das colunas medido
  igual; foco de volta ao "⋯" e ao título da lista depois de excluir; dois
  Enter → um POST; realce de valor só depois de registro novo, nunca na
  primeira carga, na troca de veículo nem com movimento reduzido.
- Cenário novo `h02` (só relatório, `relatorio-telas-nao-redesenhadas.txt`):
  Documentos, Histórico, Fotos e Configurações em 360 e 1440 continuam sem
  rolagem horizontal e com o placeholder no tom discreto; o diálogo de nota
  do Histórico recebe o título pelo papel comum. Os achados de lá são
  anteriores a esta rodada (ver "Pendências").

Achado e corrigido durante a verificação: em 320–360px "ABASTECIMENTOS" não
cabia ao lado de "Registrar" e passava por baixo do botão; o `PageHeader`
agora quebra a ação para a linha de baixo quando a palavra mais longa do
título e a ação não cabem juntas.

**Ferramenta.** Três ajustes, registrados no README das capturas: leitura do
rótulo do gráfico por mês aceita `span.type-figure` (o antigo `font-mono`
continua aceito, as etapas anteriores seguem comparáveis); cenários `h01` e
`h02` novos. (Os cenários desatualizados foram corrigidos depois da revisão —
ver abaixo.)

**Limitações.** Nenhum aparelho físico nem leitor de tela real; teclado
virtual só emulado (390×380).

**Pendências encontradas (não corrigidas aqui, telas das etapas 11–16).**
Documentos: abas com 38px de altura. Histórico: link "Ver" de 35×16px em cada
evento. Fotos: botão "Excluir foto" com 16px de largura e `image-alt`
(crítico no axe) nas miniaturas com os dados simulados. Configurações:
"Voltar" com 62×20px. Admin: selo próprio (`AdminBadges`), números em mono e,
na confirmação "Remover admin", o foco não volta ao botão ao cancelar (o
`RevokeAdminDialog` não usa o `useReturnFocus` que os diálogos das etapas
05–10 adotaram; nenhum arquivo do Admin foi alterado nesta rodada). As
pendências já documentadas (limite de 1000 registros de Modificações, ordem de
exclusão de anexo e registro, recálculos de manutenção) seguem como estavam.

**Ajustes da revisão (08/11/2026).**

- **Texto cortado sem caminho de volta.** A descrição de Gastos (`line-clamp-2`
  desde a etapa 05) e o nome do posto em Abastecimentos (etapa 06) cortavam em
  duas linhas; o texto inteiro só existia no `sr-only` do "⋯" e no diálogo de
  edição — quem enxerga não tinha como ler. Agora quebram e nunca cortam, a
  regra de Modificações e Problemas. Os outros cortes têm caminho: nota de
  Modificações ("Ver nota inteira"), descrição de Projetos (o detalhe do
  projeto). Medido em 320, 360 e 1440: 0 de 7 descrições e 0 de 6 nomes de
  posto cortados. Captura localizada `h13`.
- **Esqueletos.** Onze esqueletos locais (painéis do dashboard, garagem,
  página do veículo, FIPE, menus do cabeçalho, atividade da sidebar) ainda
  tinham `animate-pulse` próprio e pulsavam com movimento reduzido. Passaram
  ao `Skeleton` comum; nenhum `animate-pulse` local restou nas telas 01–10.
  Cenários 21 e 47 (carregando) rodados de novo.
- **Cenários desatualizados da ferramenta.** 12, 17, 19, 20, 72 e `rv5`
  procuravam "Detalhes da garagem"; agora aceitam também "Detalhes e
  comparativo" (o nome antigo segue aceito para etapas anteriores). 12, 17,
  19, 20 e 72 rodaram inteiros: detalhes abrem/fecham com `aria-expanded`,
  com um veículo o gatilho não aparece (ADR-094), o erro parcial mostra a
  falha do gráfico e "Foto indisponível", os gráficos dentro dos detalhes
  passam no axe.
- **Admin** (cenário novo `h03`, RPCs `admin_*` simuladas, nenhuma escrita):
  visão geral, usuários, detalhe do usuário, convites e auditoria em 360 e
  1440 — montam com `Button`, `Input`, `Select`, `Label` e `FieldError`
  comuns, todos os controles com 44px, sem rolagem horizontal, axe sem
  violação; a confirmação "Remover admin" usa o `AlertDialog` comum (título
  pelo papel, foco em Cancelar, cabe em 360 com e-mail longo); quem não é
  admin volta à garagem com o aviso no `Alert` comum (fio âmbar de 2px).
  Achados preexistentes acima ("Pendências").
- **Centralização conferida no código** (telas 01–10 e shell): nenhuma classe
  local de item de menu, selo, página, painel, cartão de exclusão, popover
  "i", rodapé de formulário ou esqueleto; mono só no campo de placa e no
  `PlateTag`. Ficam locais por motivo: o "⋯" do card do veículo (chapa
  escura sobre a foto, `garage.css`, já usa `menuItemClassName`) e o
  "Ficha técnica" do card (parte da composição da Garagem).

## ADR-100 — Redesign etapa 11: Documentos, obrigações e financiamento

**Status.** Implementada. **Revisão visual pendente** — não aprovada. Branch
`feature/044-redesign-etapa-11`, a partir da
`feature/043-harmonizacao-design-system` (árvore limpa na partida, nada
pendente a preservar). Sem commit, push nem merge.

**Contexto.** Documentos era a primeira tela do veículo ainda sem redesign:
título `text-lg`, abas de 38px (pendência da ADR-099), cartões com lápis e
lixeira soltos, alertas em caixas coloridas ocupando a primeira tela,
formulários com "Mais detalhes" em `<details>` e o botão de envio no fim do
corpo, confirmações sem o registro. Banco, hooks, consultas, chaves,
invalidações, rota, `?aba=`, payloads e regras não mudaram.

**Comportamento conferido no código (inventário).**

| Ponto | Regra |
|---|---|
| Rota | `/v/:vehicleId/documentos`, `?aba=documentos` (padrão, também para valor desconhecido) / `obrigacoes` / `financiamento`; trocar de aba faz `replace`. `?novo=1` é retirado da URL e não abre nada (como antes; nada no app aponta pra cá com ele). |
| Origem | `documents`, `obligations` e `financings` (0 ou 1 por veículo, `vehicle_id` único), chaves `["vehicles", id, ...]`; toda escrita invalida `["vehicles"]`. As três consultas e `vehicle_alerts` começam junto com a página. |
| Documento | Título obrigatório; tipo (padrão Outro), emitido em, vence em, valor e notas opcionais. Arquivo **obrigatório no cadastro** (JPEG/PNG/WebP/PDF, até 10 MB): sobe ao Storage antes da linha. Edição só de metadado — trocar o arquivo não existe. Abrir: link assinado de 5 min, em outra aba. Excluir: Storage → linha. Entra no Histórico (`vehicle_timeline`, data = emissão ou criação) e na busca. |
| Obrigação | Nome obrigatório; tipo, vencimento, valor, fornecedor e notas opcionais; "Paga em" só na edição (limpar volta a pendente). Marcar como paga: data padrão hoje. Pagar é o único jeito de tirar o alerta (RN-3). Não entra em Histórico nem em total. |
| Alertas | `vehicle_alerts`: obrigação pendente com `due_on < hoje` = vencida (`critical`), `hoje ≤ due_on ≤ hoje+30` = a vencer (`warning`); documento igual por `expires_on`; sem data, nunca. Lidos pelo sino, pelo painel de pendências do dashboard (obrigação → `?aba=obrigacoes`, documento → aba padrão), pela Manutenção ("Ver em Documentos", aba padrão) e por esta tela. |
| Financiamento | Tudo opcional (início em branco: hoje no cadastro, mantém na edição). Restantes e saldo são colunas geradas (`qtd − pagas`; `restantes × parcela`; nulas se faltar parte). Pagas ≤ quantidade. "+1" soma em `installments_paid`. Não há tabela de parcelas, valor pago nem estado do contrato; nada entra em Gastos, Histórico ou total investido. |

**Decisão.**

- Página no padrão comum (`Page`, `PageHeader`, `Breadcrumb`): título
  "DOCUMENTOS" e uma frase; o veículo segue na trilha e no seletor do shell.
  Sem ação no cabeçalho: cada aba leva a sua.
- **Pendências** num painel compacto com fio lateral (carmim se houver
  vencido): a contagem por aba à vista ("Documentos: 1 vencido, 2 a vencer ·
  Obrigações: …") e a lista de antes (o mesmo `AlertBanner`) atrás de "Ver a
  lista" (`PanelDisclosure`). Aberta, ela empurrava abas e lista para fora da
  primeira tela, e cada linha agora tem o próprio selo. A falha dos alertas
  vira uma linha com "Tentar de novo".
- **Abas** (`DocumentTabs`, local): 44px, as três sempre inteiras (dividem a
  largura em proporção ao rótulo de 320px até `sm`), ativa por peso, cor,
  fio laranja e `aria-selected`; teclado no padrão WAI-ARIA (só a ativa no
  Tab; setas circulares, Home, End). Os três `tabpanel` existem (cada
  `aria-controls` aponta pra um); só o ativo tem conteúdo. A aba vive na URL
  e sobrevive a erro, cadastro e exclusão; trocar de veículo remonta a área
  (diálogos e foco) e mantém a aba.
- Cada aba abre com uma frase do que entra ali e a ação real: "Enviar
  documento", "Registrar obrigação"; Financiamento só tem ação no estado
  vazio ("Cadastrar financiamento"). Carregando (`SkeletonList`, sem zero),
  falha (`InlineError` com "Tentar de novo", só naquela aba) e vazio
  (`EmptyState` com a ação) são estados distintos.
- **Situação** de documento e obrigação vem de `vehicle_alerts` — a mesma do
  dashboard, da Manutenção e do sino —, com os rótulos do painel de
  pendências: Vencido/Vencida, Vence em breve/Próxima e "Vence hoje" (aviso
  cuja data é hoje; a view conta o próprio dia como a vencer). Paga =
  "Paga". Sem a lista de alertas fica a regra antiga da tela (data < hoje =
  vencido) e nenhum aviso é inventado. Rejeitado: refazer a janela de 30
  dias no cliente.
- **Documentos**: painel com colunas a partir de `md` (documento · validade ·
  arquivo · "⋯"); nome, detalhes (tipo, emissão, valor — R$ 0,00 aparece,
  ausente some) e notas quebram, nunca cortam. Arquivo: tipo e tamanho
  ("PDF · 117 KB") e "Abrir" (alvo de 44px, outra aba); a falha ao abrir
  aparece na própria linha. "Sem arquivo" só se `storage_path` vier vazio —
  o banco não deixa.
- **Obrigações**: Pendentes e Pagas (os grupos de antes) com colunas
  (obrigação · situação · valor · "⋯"); "Valor não informado" escrito;
  "Marcar como paga" à vista em cada pendente, como ação em texto junto da
  situação (o botão cheio pesava a linha); paga mostra a data do pagamento e
  o vencimento que tinha.
- **Financiamento**: dois painéis — **Contrato** (valor financiado, parcela,
  quantidade, início, juros por `formatMonthlyRate`, "Não informado" quando
  nulo; editar/excluir no "⋯") e **Parcelas** (pagas "46 de 48", restantes,
  valor das parcelas restantes — ver os ajustes da revisão; "Não calculado"
  com o motivo quando a coluna gerada vem
  nula; a conta escrita na legenda; selo "Quitado"/"Em aberto" só com
  quantidade informada; "Registrar parcela paga" com o erro junto do botão —
  antes a falha era silenciosa).
- **Formulários** no padrão comum (`FORM_DIALOG_CLASSNAME`, cabeçalho e
  rodapé fixos, só o corpo rola, `FormSection`/`FormField`/`FormFooter`,
  `UnitAffix`, foco no diálogo ao abrir e no primeiro campo inválido ao
  enviar, segundo envio bloqueado). Documento: Identificação · Arquivo
  (escolher/trocar; erro de tipo e tamanho junto do campo; enviar sem
  arquivo marca o campo) · Validade (o texto diz que entra nos alertas 30
  dias antes) · Detalhes recolhível. Obrigação: Obrigação · Vencimento (e
  pagamento, na edição) · Detalhes. Financiamento: Contrato · Parcelas
  pagas. Marcar como paga: a mesma casca, estreita, com o registro no cartão
  comum.
- **Confirmações** com `AlertDialogRecord` e só as consequências
  verificadas: documento ("O arquivo é apagado junto… sai desta lista e do
  Histórico", mais "o alerta dele sai do dashboard, da Manutenção e do sino"
  só se ele está em `vehicle_alerts`); obrigação (lista e, se houver,
  alerta); financiamento (contrato e contagem apagados; gastos da categoria
  Financiamento ficam). O foco volta ao gatilho ou, se a linha saiu, ao
  título da seção.
- Texto: "Informe o rótulo." → "Informe o nome da obrigação." (o campo
  passou a se chamar "Nome"; a regra não mudou). Helper novo
  `formatMonthlyRate` em `lib/format.ts`.

**Componentes compartilhados usados.** `Page`, `PageHeader`, `Breadcrumb`,
`Panel`/`PanelHeader`/`PanelCount`/`ListColumns`/`PanelDisclosure`/
`PANEL_CLASSNAME`, `Badge`, `RowActionsMenu`, `DetailItem`, `EmptyState`,
`InlineError`, `PageError`, `SkeletonList`/`Skeleton`, `FormBody`,
`FormFooter`, `FormSection`, `FormField`, `UnitAffix`, `AlertDialogRecord`,
`textLinkClassName`, `FieldError`, `useReturnFocus`, `VehicleNotFound`,
`AlertBanner`. Locais por necessidade da área: `DocumentTabs` (único lugar
com abas de página), `TabIntro`, `documentPresentation.ts`, `focus.ts`.

**Alternativas descartadas.** Pendências sempre abertas (seis alertas
tomavam a primeira tela). Ação de cadastro no cabeçalho da página, trocando
com a aba (perde o contexto e o rótulo muda sob o título). Abas com rolagem
lateral no celular (escondia "Financiamento"). "Marcar como paga" dentro do
"⋯" (é a ação principal da pendente e a única que tira o alerta). Total pago
ou saldo com juros no financiamento (o modelo não sustenta). Situação
recalculada no cliente com a janela de 30 dias.

**Pendências registradas (anteriores, não alteradas).**

- Etapa 07/11 — **"Ver em Documentos" da Manutenção** abre a aba Documentos
  mesmo quando as pendências são só obrigações (o dashboard já usa
  `?aba=obrigacoes`).
- Etapa 04 — o **painel de pendências do dashboard** escreve "Vence em
  08/11/2026" para o que vence hoje, onde o `AlertBanner` (sino, Manutenção,
  esta tela) escreve "Vence hoje". Mesmo dado, texto diferente.
- Etapa 11 — a **exclusão de documento** apaga o arquivo antes da linha: se
  a linha falha, o arquivo já foi (conferido no mock, cenário 127). Mesma
  ordem de gasto, manutenção, problema e item.
- Etapa 11 — **"Abrir"** chama `window.open` depois de esperar o link
  assinado; bloqueador de pop-up (Safari/iOS) pode barrar. Não testado em
  aparelho.
- Etapa 11 — **Marcar como paga com a data apagada** manda `paid_on: ""` e
  o banco recusa com o erro genérico (o campo não valida). Conferido no
  código, não alterado.
- Etapa 11 — **"Hoje"**: o selo vem da view (`current_date` do servidor) e
  a linha de data, do cliente (data local); perto da meia-noite os dois
  podem divergir. O mesmo vale para o dashboard e a Manutenção.
- Etapa 11 — **financiamento sem quantidade de parcelas** aceita "+1" sem
  limite (o banco só limita com quantidade). Sem tabela de parcelas, não há
  valor previsto × pago por parcela.
- Shell — os itens do **sino** não levam a Documentos (texto sem link).

**Verificação.** Dados simulados (ferramenta externa
`redesign-capturas/ferramenta/inspect.mjs`, `docHandler` novo, cenários
122–128, arquivos 228–233, `etapa-11/relatorio.txt`): cinco documentos do
Civic (vencido há 3 dias, vence hoje com título longo e notas com quebra,
+18, +31 com R$ 0,00, sem validade; PDF, PNG e JPEG), sete obrigações (−12,
hoje, +30, +31 com R$ 0,00, sem data, duas pagas), financiamento 46/48 e as
variantes "zero" e "parcial"; Gol com um documento sem alerta; Maverick
vazio. `vehicle_alerts` recalculado do estado a cada escrita com a regra da
view; escritas, Storage e link assinado interceptados; rede trancada,
nenhuma chamada ao Supabase real. Conferido: selos iguais à regra; as mesmas
seis pendências na tela, no sino, no dashboard e na Manutenção; pagar tira
um alerta do sino (9 → 8) e limpar "Paga em" devolve; links do dashboard
(`?aba=obrigacoes`), da Manutenção e do Histórico abrem a aba certa; `?aba`
inválida cai em Documentos; troca de veículo mantém a aba; carregando sem
zero; falha e nova tentativa em cada aba, sem perder a aba; vazio das três;
envio sem arquivo, arquivo de texto, PDF de 11 MB, falha no envio (nada
gravado, formulário preservado) e Storage antes da linha; pagas >
quantidade; teclado nas abas (setas, Home, End, Tab), Escape e volta do
foco; teclado virtual emulado (390×380) com a ação alcançável. 320, 360,
390, 768, 1024, 1280, 1440, 1920 e 2560, claro e escuro alternados: sem
rolagem horizontal, nenhum alvo menor que 44px, colunas alinhadas ao
cabeçalho, último conteúdo acima da barra inferior, sem segunda rolagem.
Axe sem violações em 33 estados. `npm run lint`, `npx tsc -b` e `npm run
build` limpos. Nenhum aparelho físico nem leitor de tela real.

**Ajustes da revisão (08/11/2026).**

- **Pendências no celular** (`PendingSummary`): em 320px o bloco recolhido
  ocupava ~180px (título, frase, contagem por aba e "Ver a lista") e a lista
  de documentos quase não aparecia na primeira tela. Abaixo de `sm` o bloco
  inteiro agora é **um botão** — "6 pendências · 2 vencidas" (singular com
  1; "nenhuma vencida" sem vencido, aí com o fio âmbar) — e a frase
  explicativa e a contagem por aba ficam dentro, antes da lista. A partir de
  `sm`, o cabeçalho com a contagem e "Ver a lista" de antes. Os dois botões
  abrem a mesma região; cada um só existe na sua largura. Medido: 46px
  recolhido em 320, 360, 390 e 639 (era ~180 em 320); o nome do primeiro
  registro aparece na primeira tela em 320×640, e o registro inteiro a
  partir de 360. A partir de 640, 130px (640) e 108px (1440), como antes.
- **"Saldo a pagar" → "Valor das parcelas restantes"**: o número é
  `outstanding_balance` = parcelas restantes × valor da parcela, não o saldo
  devedor do contrato. Legenda, motivo de "Não calculado", estado vazio, a
  descrição do formulário e a da edição acompanham ("as parcelas restantes e
  o valor delas"). Em 640px o rótulo quebra em duas linhas, sem corte.
- Verificação: cenário 129 (`etapa-11/relatorio-ajustes.txt`, captura
  `234-mobile320-topo-ate-primeiro-registro-light`, do topo da página ao fim
  do primeiro registro, pendências recolhidas): 320, 360, 390, 639, 640 e
  1440 — recolhido e aberto pelo teclado (`aria-expanded`, foco fica no
  botão), axe sem violações nos 12 estados e nos 4 do financiamento, nenhum
  alvo menor que 44px, sem rolagem horizontal. `npm run lint`, `npx tsc -b`
  e `npm run build` limpos.

## ADR-101 — Redesign etapa 12: Fotos

**Status.** Implementada. **Revisão visual pendente** — não aprovada. Branch
`feature/045-redesign-etapa-12`, a partir da
`feature/044-redesign-etapa-11` (árvore limpa na partida, nada pendente a
preservar). Sem commit, push nem merge.

**Contexto.** Fotos era a próxima tela do veículo sem redesign: título
`text-lg`, filtro de categoria em oito botões com rolagem lateral no
celular, cartões com "Definir como capa" e a lixeira lado a lado — a lixeira
encolhia a 16px de largura (pendência da ADR-099) —, selo "Capa" laranja
sobre a foto, legenda cortada numa linha sem caminho de volta, miniatura
`object-cover` (cortava o carro de foto fora de 4:3) e `alt` só com a
categoria, que o axe acusou como `image-alt` crítico nas fotos sem
legenda. O envio tinha o botão no fim do corpo, sem rodapé fixo nem volta de
foco. Banco, hooks, consultas, chaves, invalidações de sucesso, rota,
caminho no Storage e regras não mudaram.

**Comportamento conferido no código (inventário).**

| Ponto | Regra |
|---|---|
| Rota | `/v/:vehicleId/fotos` (item "Fotos" no grupo Arquivo da lateral e da folha Mais). `?novo=1` abre o envio — único parâmetro. |
| Entradas de envio | Cabeçalho e estado vazio da tela; folha "Registrar" → "Foto" (`?novo=1`); ação rápida "Adicionar foto" do dashboard (abre o diálogo por cima e leva à galeria depois do envio); "Adicionar foto" do card da garagem (faixa de registros e quadro vazio; idem). Editar veículo tem um envio de capa à parte (`VehiclePhotoUpload`, sempre vira capa) — não faz parte desta tela. |
| Consulta | `vehicle_photos` do veículo, `order(sort_order)` e depois `created_at` decrescente; links assinados de 1 h em lote (`createSignedUrls`). Chave `["vehicles", id, "gallery"]`; toda escrita invalida `["vehicles"]`. O app nunca grava `sort_order` nem `taken_at`: na prática a ordem é a mais recente primeiro, e não existe reordenação. |
| Envio | Seletor com curinga `image/*` (galeria nativa no Android); recorte obrigatório em 4:3 (arrastar, aproximar, setas), maior lado até 1600 px, WebP (PNG se o navegador não codifica WebP); o arquivo final passa por `imageFileSchema` (JPEG, PNG ou WebP, até 10 MB). Categoria (7, padrão Exterior) e legenda opcional sem limite. Ordem: Storage → linha → capa, esta só se o veículo estiver sem (`primary_photo_id is null`). |
| Capa | `vehicles.primary_photo_id`. É a foto do card da garagem (16:9, `object-cover`) e da miniatura do dashboard (4:3). "Definir como capa" troca na hora. A primeira foto de um veículo sem capa vira capa. |
| Exclusão | Se for a capa, limpa `primary_photo_id` → apaga o arquivo → apaga a linha. Capa excluída **não** é substituída: card e dashboard ficam sem foto até outra ser escolhida ou o próximo envio. |
| Abertura | **Não existe** visualização ampliada nem abertura da foto; a miniatura é o único lugar de vê-la. |
| Histórico | `vehicle_timeline` não tem evento de foto; nenhum total soma fotos. |

**Decisão.**

- Página no padrão comum (`Page`, `Breadcrumb`, `PageHeader`): "FOTOS",
  o veículo e a quantidade na linha de contexto (com o "i" que explica a
  capa, junto da contagem para não ficar sozinho numa linha) e "Adicionar
  foto" — a única ação laranja da tela. Com a galeria vazia a ação sai do
  cabeçalho e fica no estado vazio. A grade começa logo abaixo.
- **Grade pela largura útil**: `repeat(auto-fill, minmax(min(100%,
  --gallery-tile-min), 1fr))`, tokens novos `--gallery-tile-min` (8,5 /
  12 / 15 / 17rem em base, `sm`, 80rem e 120rem) e `--gallery-gap`. Medido:
  2 colunas de 320 a 640, 3 em 768–1280, 4 em 1440, 5 em 1920, 7 em 2560.
  `auto-fill` mantém as colunas vazias, então uma foto só ocupa uma coluna
  (276px em 1440, 309px em 2560), sem esticar nem preencher com
  falsos vazios.
- **Foto inteira no quadro 4:3** (`object-contain` sobre o fundo neutro):
  4:3 é a proporção do recorte, então as fotos enviadas pelo app ocupam o
  quadro todo; foto de outra proporção (vertical, larga, anterior ao
  recorte) aparece inteira com sobra neutra, e o carro encostado na borda
  não é cortado. Rejeitado: `object-cover` (cortava justamente essas, e não
  há visualização ampliada onde ver o resto). Nenhum texto, selo ou botão
  sobre a foto — o tratamento da Garagem.
- Embaixo da foto: legenda (quebra, nunca corta), categoria, "Tirada em"
  quando `taken_at` existe, o selo **"Capa"** (`Badge` neutro — o estado
  existe no produto; o laranja ficou para a ação) e o **"⋯"** de 44px com
  "Definir como capa" (só nas outras fotos) e, depois do divisor, "Excluir
  foto". Rejeitado: os dois botões à vista (pesavam cada foto e foram a
  origem do alvo de 16px).
- **Acessibilidade.** A foto não é controle (não existe "abrir"): `alt` é a
  legenda; sem legenda, só o contexto conhecido — "Foto 2 de 12 do Honda
  Civic Si" (posição na galeria inteira, não no filtro). A legenda à vista
  fica `aria-hidden` para não ser lida duas vezes; a categoria não entra no
  `alt` porque está escrita embaixo. O "⋯" é descrito por "Foto 2 de 12,
  capa do veículo" / "Foto 3 de 12: legenda". Ordem de Tab: envio → filtro →
  um "⋯" por foto (e "Tentar de novo" onde houver). Sem controle dentro de
  controle.
- **Foco.** Escape e "Cancelar" devolvem ao "⋯" ou ao botão que abriu;
  depois de excluir, ao "⋯" da foto seguinte (ou da anterior), senão ao
  envio do cabeçalho, senão ao do estado vazio (`focusAfterDialog`, local);
  depois de "Tentar de novo" que dá certo (o botão some), ao filtro, ao
  primeiro "⋯" ou à ação do vazio — na foto, ao "⋯" dela. Trocar a capa,
  enviar e excluir são anunciados numa região `status`.
- **Filtro de categoria** (existia): vira um `Select` comum com a contagem
  ("Interior (2)"), só com as categorias que têm foto, e só aparece quando
  há fotos de mais de uma categoria. Filtro que ficou sem foto mostra
  `NoResults` com "Limpar filtros". O envio abre na categoria filtrada.
- **Envio** na casca comum (`FORM_DIALOG_CLASSNAME` estreita, cabeçalho e
  rodapé fixos, só o corpo rola, `FormSection`/`FormField`/`FormFooter`,
  foco no diálogo ao abrir, segundo envio bloqueado): seção Foto com os
  formatos e limites conferidos, prévia 4:3 com o peso ("Ajustada em 4:3 ·
  217 KB · enviada ao salvar"), "Escolher/Trocar foto" e "Ajustar
  enquadramento"; Detalhes com categoria e legenda (a ajuda diz que ela é o
  texto lido no lugar da foto). A descrição avisa quando a foto vai virar a
  capa (veículo sem capa). Erro de arquivo junto do botão, com o foco nele;
  falha no rodapé ("O envio não foi concluído…") com foto, categoria e
  legenda preservadas. O mesmo diálogo atende o dashboard e a garagem.
- **Exclusão** no cartão de registro comum (miniatura, legenda ou "Sem
  legenda", categoria, posição, selo) e só as consequências do código:
  arquivo apagado, sai da galeria, sem volta; na capa, "o card da garagem e
  o dashboard ficam sem foto. A próxima foto enviada vira a capa, ou
  escolha outra em 'Definir como capa'".
- **Estados distintos**: carregando (grade de esqueletos, sem "0 fotos"),
  falha da consulta (`InlineError` com nova tentativa; cabeçalho e envio
  continuam), vazio (`EmptyState` com o que entra aqui e que a primeira
  vira capa), filtro sem resultado e **foto indisponível** — link vencido,
  arquivo que não carrega ou ausente no Storage: quadro reservado com
  ícone, "Foto indisponível" e "Tentar de novo" (pede links novos).
- Três correções de comportamento, pequenas e verificadas:
  1. `?novo=1` sai da URL depois de abrir o envio (como Gastos,
     Abastecimentos, Manutenção e Histórico) — antes, recarregar reabria.
  2. A categoria do filtro chega ao envio: o diálogo lia a categoria só na
     montagem e ficava "Exterior" (o comentário dizia o contrário); agora
     remonta (fechado) quando o filtro muda.
  3. Depois de uma falha no envio ou na exclusão a tela relê `["vehicles"]`:
     o hook pode ter andado em parte (capa já limpa, arquivo já apagado,
     linha já gravada) e a tela mostrava o estado antigo — no mock, o selo
     "Capa" continuava numa foto que já não era capa.
- Textos: "Categoria (opcional)" → "Categoria" (o campo sempre tem valor);
  "Adicionar foto" (envio) → "Enviar foto"; "É a capa"/"Definir como capa"
  em botão → selo + item de menu.

**Componentes compartilhados usados.** `Page`, `PageHeader`, `Breadcrumb`,
`Button`, `Badge`, `InfoTip`, `FilterField`, `Select`, `Input`,
`Skeleton`, `EmptyState`, `InlineError`, `NoResults`, `PageError`,
`PANEL_CLASSNAME`, `menuItemClassName`/`MenuSeparator`/
`ROW_ACTIONS_TRIGGER_CLASSNAME` + `Popover`, `FORM_DIALOG_CLASSNAME`/
`FORM_DIALOG_HEADER_CLASSNAME`/`focusDialogOnOpen`, `FormBody`,
`FormSection`, `FormField`, `FormFooter`, `FieldError`, `AlertDialog` +
`RECORD_CARD_CLASSNAME`, `useReturnFocus`, `VehicleNotFound`,
`ImageCropDialog` (sem mudança). Locais por necessidade da área:
`PhotoTile`, `PhotoActionsMenu` (o `RowActionsMenu` é fixo em
editar/excluir; este compõe as mesmas peças com "Definir como capa"),
`DeletePhotoDialog`, `photoPresentation.ts`, `focus.ts`. `PhotoCard.tsx`
saiu (nenhum consumidor).

**Alternativas descartadas.** Visualização ampliada ou "abrir foto" (não
existe no produto; seria requisito novo). Selo "Capa" sobre a foto
(contraste depende da foto; texto sobre o carro). Filtro em botões com
rolagem lateral. Grade centralizada ou com a foto única esticada.
`object-cover` nas miniaturas. Reordenar a capa para o início (a ordem é a
da consulta).

**Pendências registradas (anteriores, não alteradas).**

- **Exclusão em três passos sem transação** (capa → arquivo → linha).
  Falha no arquivo: a capa já foi limpa e a foto continua na galeria
  (conferido no mock, cenário 133: card e dashboard "Sem foto"). Falha na
  linha: o arquivo já foi e a foto fica "Foto indisponível" para sempre
  (133). Mesma família da ordem de exclusão de anexo e registro.
- **Envio em três passos** (arquivo → linha → capa). Falha na linha deixa o
  arquivo órfão no Storage, invisível na tela. Falha só na capa (rara): a
  linha existe, o diálogo diz "O envio não foi concluído" e a galeria —
  agora relida — mostra a foto; enviar de novo cria uma segunda. Não
  simulado separadamente.
- **Fechar o envio no meio**: a mutação continua; se terminar, a foto é
  gravada e, pelo dashboard ou pela garagem, a tela ainda navega para a
  galeria. Conferido no código, não alterado.
- `sort_order` e `taken_at` nunca são gravados pelo app; legenda sem limite
  de tamanho; HEIC e outros formatos só falham no recorte ("Não foi possível
  abrir essa imagem…"), não no seletor — não testado em aparelho.
- Links assinados valem 1 h: galeria aberta por mais tempo passa a mostrar
  "Foto indisponível" até "Tentar de novo" (ou outra releitura).
- `VehiclePhotoUpload` (editar veículo) tem a própria cópia de
  `fileExtension` e sempre troca a capa — fora do escopo desta etapa.

**Verificação.** Dados simulados (ferramenta externa
`redesign-capturas/ferramenta/inspect.mjs`, `photoHandler` novo, cenários
130–136, arquivos 235–240, `etapa-12/relatorio.txt`): Civic com 12 fotos
em quatro proporções (4:3, 1,6:1, 3:4 e carro encostado na borda), legenda
longa, sem legenda, `taken_at`, um arquivo 404 e um ausente no Storage;
Opala com uma foto, Uno com três, Gol e Maverick sem nenhuma. Upload
multipart guardado e servido de volta, links assinados, escritas com
corpo; rede trancada, nenhuma chamada ao Supabase real. Conferido: ordem da
tela = ordem da consulta; nenhum `img` sem nome; teclado (Tab, Enter no
"⋯", Escape) e volta do foco em todos os diálogos; envio vazio, arquivo de
texto, cancelar o recorte, prévia 4:3 (1600×1197), falha do Storage e queda
de rede (nada gravado na tabela, formulário preservado), dois cliques → um
envio, sucesso (anúncio, foco, foto em primeiro, `PATCH … is.null` sem
trocar a capa existente), cancelar com foto escolhida (nada gravado,
formulário limpo ao reabrir); exclusão comum (Storage + linha, foco no
vizinho), da capa (três escritas, card e dashboard "Sem foto", próximo
envio vira capa e aparece nos dois), da última (estado vazio, foco na ação),
falhas no arquivo e na linha; troca de capa com falha (erro na foto, selo
fica) e pelo teclado (um PATCH, selo e anúncio, card e dashboard com a foto
nova, ordem mantida); carregando, falha da consulta e nova tentativa, vazio,
foto indisponível e nova tentativa, filtro sem resultado; entradas pelo
dashboard, pelo card da garagem (vira capa) e por `?novo=1` (sai da URL,
recarregar não reabre). 320, 360, 390, 640, 768, 1024, 1280, 1440, 1920 e
2560, claro e escuro alternados: sem rolagem horizontal, nenhum alvo menor
que 44px, rolagem real (roda do mouse) até o fim com o último "⋯" acima da
barra inferior e alcançável; teclado virtual emulado (390×380) com "Enviar
foto" à vista. Axe sem violações em 22 estados. `npm run lint`, `npx tsc
-b` e `npm run build` limpos. Nenhum aparelho físico nem leitor de tela
real.

## ADR-102 — Redesign etapa 13: Histórico

**Status.** Implementada. **Revisão visual pendente** — não aprovada. Branch
`feature/046-redesign-etapa-13`, a partir da
`feature/045-redesign-etapa-12` (árvore limpa na partida, nada pendente a
preservar). Sem commit, push nem merge.

**Contexto.** O Histórico era a próxima tela do veículo sem redesign: título
`text-lg`, busca solta com um "×" de 16px, filtros fora de painel, um cartão
com borda por evento, texto cortado em duas linhas sem caminho de volta e o
link "Ver" de **35×16px** (pendência da ADR-099) com o nome acessível só
"Ver" — dezoito iguais na mesma lista. Os diálogos de nota eram os antigos
(botão no fim do corpo, sem rodapé fixo, sem volta de foco, erro de envio
solto) e a quilometragem dizia "a quilometragem inválido." (anotado na etapa
10). Banco, hooks, consultas, chaves, invalidações, rota e regras não mudaram.

**Comportamento conferido no código (inventário).**

| Ponto | Regra |
|---|---|
| Rota | `/v/:vehicleId/historico` (lateral e folha Mais: "Histórico"; dashboard: "Ver histórico"). `?novo=1` abre a nota nova e sai da URL — único parâmetro. Atalho: folha "Registrar" → "Nota". |
| Consulta | `vehicle_timeline` inteira do veículo, `order(occurred_on desc)`, chave `["vehicles", id, "timeline"]`. Sem paginação. A ordem na tela é a que a view devolve; **empate na mesma data não tem chave secundária** (a view não expõe `created_at`). |
| Eventos (view) | Gasto (`expenses`; título = rótulo da categoria ou "Gasto"; data = `occurred_on`), Abastecimento (`fuel_logs`; título fixo "Abastecimento"), Manutenção (`maintenance_records`; data = `performed_on`), Problema (`issues`; data = `reported_on`), Item de projeto (`project_items` **só com data**), Documento (`documents`; data = emissão ou, sem ela, criação), Nota (`notes`). Obrigações e financiamento não entram. Tipo desconhecido não quebra a tela. |
| Filtros | Tipo (os sete) e período (Tudo, Este mês, Mês passado, Este ano), no cliente, sobre a lista; evento sem data nunca aparece (não acontece com a view atual). Não ficam na URL. |
| Busca | RPC `search_vehicle` 300 ms depois de digitar, ordenada por relevância. Cobre gastos (só pela descrição), manutenções, problemas, **projetos**, itens de projeto, documentos e notas — abastecimento não. Devolve título, trecho (200 primeiros caracteres) e data; sem valor, km nem `metadata`. Buscando, tipo e período não se aplicam (somem de vista e voltam como estavam). |
| Ações por origem | Nota: editar e excluir aqui (`notes`, a única origem que o Histórico edita). As demais: "Ver" leva à tela de origem. Sem destino (nota, tipo desconhecido): nenhum link. |
| Nota | Tudo opcional: título e corpo podem ser nulos; data em branco grava hoje (`default current_date`) no cadastro e fica como está na edição (o campo não vai no PATCH); km inteiro ≥ 0, vazio e 0 aceitos. Toda escrita invalida `["vehicles"]` (Histórico, atividade recente do dashboard e da lateral). |

**Destino de cada "Ver" (conferido no código e no mock).**

| Origem | Destino |
|---|---|
| Gasto | `/gastos` (a lista; um upgrade também aparece em Modificações, mas o link é o de Gastos, como antes) |
| Abastecimento | `/abastecimentos` |
| Manutenção | `/manutencao` |
| Problema | `/problemas` |
| Item de projeto | `/projetos/:projectId` pelo `metadata.project_id`; sem ele, `/projetos`. Projeto inexistente: a tela de destino mostra "Projeto não encontrado." com "Voltar para projetos" (não acontece pela view: excluir projeto leva os itens) |
| Documento | `/documentos` (aba Documentos, a padrão) |
| Projeto (só na busca) | `/projetos/:id` — novo, ver "Correções" |
| Nota, tipo desconhecido | sem link |

Na busca o item de projeto leva a `/projetos` (a função não devolve o
projeto). O destino é sempre a lista da tela de origem, nunca o registro —
limitação anterior, registrada abaixo.

**Decisão.**

- Página no padrão comum (`Page`, `Breadcrumb`, `PageHeader`): "HISTÓRICO",
  o veículo e a quantidade de registros na linha de contexto, com o "i" do
  que entra (e de onde se edita cada coisa), e "Nova nota" — a única ação
  laranja da tela. Abaixo de `sm` a ação desce para baixo do título
  (`stackActionsOnMobile`): o nome do veículo, que pode ser longo, fica com a
  largura toda. Com o histórico vazio a ação sai do cabeçalho e fica no
  estado vazio.
- **Um painel** "Registros" com a busca, o tipo e o período no topo (abaixo
  de 400px empilham — medido: opções inteiras em 320, 360 e 390) e a lista.
  Buscando, o painel vira "Resultados da busca" e diz que a busca é por
  relevância, no veículo inteiro, sem tipo e período.
- **Diário**: separadores discretos por mês (sobrelinha + contagem do mês),
  na ordem que a view devolve — agrupar não reordena nada. Desktop: data
  (dia e dia da semana) · registro · valor · ação; a data aparece uma vez por
  dia (as linhas seguintes do mesmo dia deixam a coluna vazia) e continua na
  linha para o leitor de tela. Celular: "tipo · data" com a ação no canto e,
  embaixo, título, valor/km e texto na largura toda — sem coluna de ações
  apertando o texto.
- Tipo por **ícone + rótulo escrito** (cor nenhuma); quando o título é o
  próprio tipo ("Abastecimento", "Gasto" sem categoria), o rótulo não se
  repete. Valores em display tabular. Laranja: só "Nova nota" e os estados
  de interação (medido: nenhum texto ou fundo laranja na lista).
- Texto do registro com mais de 140 caracteres ou com quebra de linha: duas
  linhas e "Ver nota inteira"/"Ver texto inteiro" (`aria-expanded`), a regra
  de Modificações. Título quebra, nunca corta.
- Nota: "⋯" comum (`RowActionsMenu`, "Editar nota"/"Excluir nota"), descrito
  pelo registro. Eventos de outras áreas: "Ver". A linha nunca é clicável.
- Formulário de nota no padrão comum (`FORM_DIALOG_CLASSNAME` estreita,
  `FormSection`/`FormField`/`FormFooter`, rótulos visíveis com "(opcional)",
  erro junto do campo com foco nele, dois Enter → um envio, falha no rodapé
  com o preenchimento preservado, foco devolvido). A ajuda da data diz o que
  acontece em branco em cada modo. Exclusão no cartão de registro comum,
  com o reflexo real ("Sai do Histórico, da atividade recente e da busca").
  Os diálogos ficam na página: uma nota editada pode sair do filtro e
  desmontar a linha (foco vai ao título da lista). Salvar, editar e excluir
  são anunciados numa região `status`.
- **Estados distintos**: carregando (esqueleto, sem "0 registros"), falha da
  consulta (`InlineError` no painel; cabeçalho, busca e "Nova nota" seguem),
  vazio (`EmptyState` com o que entra aqui e "Escrever primeira nota"),
  filtro sem resultado (`NoResults` com a seleção e quantos ficaram fora),
  busca carregando, falhando (com nova tentativa) e sem resultado ("Limpar
  busca", e o que a busca cobre). Depois de "Tentar de novo" que dá certo, o
  foco vai ao título da lista.

**O link "Ver" (ajuste obrigatório).** Continua link (navega) e discreto
(`textLinkClassName("xs")`, sem laranja), agora com **44×44px**
(`min-h-control` + `min-w-11`) e nome com contexto: para onde leva e de
qual registro parte (ver "Ajustes da revisão" abaixo — a primeira versão,
"Ver manutenção: Troca de óleo e filtro, 10/11/2026", sugeria abrir o
registro). O texto visível "Ver" é o começo do nome. Ajuste **só no Histórico**
(`TimelineEntryRow`): `textLinkClassName` não mudou e nenhum outro link do
app foi tocado. Medição (ferramenta, cenário 137, mesma sonda antes e
depois: o `<a>` que recebe o clique, `elementFromPoint` numa grade de 7×7 no
link e num quadrado de 44×44 centrado nele):

| | Antes (etapa 12) | Depois |
|---|---|---|
| Alvo | 35×16 nos 18 links, em 320, 390 e 1440 | 44×44 nos 18 links, de 320 a 2560, claro e escuro |
| Quadrado de 44×44 no link | 15 de 49 pontos | 49 de 49; nenhum ponto em outro controle |
| Nome acessível | "Ver" | "Ver lista de Gastos, a partir de Pneus, 07/11/2026" etc. |

Achado na primeira medição e corrigido: no celular o título (depois do link
no DOM) cobria os 6px de baixo do alvo e ficava com o toque (43/49). A
primeira linha agora tem a altura que a ação ocupa e nada fica por cima.
Toque real (tela de toque emulada) no canto do alvo navega; no começo do
título, não. Um toque 6px abaixo do alvo, já sobre o título, também navega:
é o ajuste de toque do Chromium, que leva ao link mais próximo — o mesmo
"Ver", nunca um vizinho. Foco visível (contorno de 2px) e Enter navegam.

**Correções (pequenas, verificadas no mock).**

1. **Nota editada pela busca perdia dados.** O diálogo era montado com o
   trecho da busca (200 caracteres) e `odometer_km: null`: salvar gravava o
   corpo cortado e apagava a quilometragem. Agora a nota da busca usa os
   dados completos da lista do Histórico (mesma consulta); sem eles (lista
   com falha), o resultado aparece sem "⋯". Medido: corpo de 323 caracteres
   e km 87.400 no PATCH.
2. "Informe uma quilometragem válida." (2º parâmetro do helper, como na
   etapa 10); regra igual — 0 e vazio aceitos, −5 e 12,5 recusados.
3. Projeto na busca mostrava o nome cru da tabela ("projects") e não tinha
   link; agora "Projeto", com ícone próprio, e "Ver" abre o detalhe (o
   `source_id` é o projeto). Tipo desconhecido diz "Registro", não o nome
   da tabela.
4. Trocar de veículo sem sair da tela (Voltar entre dois Históricos) levava
   a busca e o filtro para o outro veículo; agora a tela remonta por
   veículo, como as outras.
5. "Excluir \"\"?" em nota sem título → "Excluir nota?" com o registro no
   cartão. A falha da busca ganhou "Tentar de novo"; o "×" da busca tem 44px.

**Componentes compartilhados usados.** `Page`, `PageHeader`, `Breadcrumb`,
`Button`, `InfoTip`, `PANEL_CLASSNAME`, `PanelHeader`, `PanelCount`,
`ListColumns`, `FilterField`, `Input`, `Select`, `Textarea`,
`Skeleton`/`SkeletonList`, `EmptyState`, `InlineError`, `NoResults` (ganhou
`clearLabel`, padrão "Limpar filtros" — os outros usos não mudam),
`PageError`, `VehicleNotFound`, `RowActionsMenu`, `textLinkClassName`,
`FORM_DIALOG_CLASSNAME`/`FORM_DIALOG_HEADER_CLASSNAME`/`focusDialogOnOpen`,
`FormBody`, `FormSection`, `FormField`, `FormFooter`, `UnitAffix`,
`AlertDialog` + `AlertDialogRecord`, `useReturnFocus`. Locais por
necessidade da área: `TimelineEntryRow` (a composição do diário),
`timelinePresentation.ts`. `SearchResultItem.tsx` e `TimelineFilters.tsx`
saíram (nenhum consumidor). O `TimelineItem` (atividade recente do dashboard
e do cabeçalho) só passou a montar a nota pelo mesmo `noteFromEvent`
(título nulo continua nulo) e recebe os diálogos novos.

**Alternativas descartadas.** Linha inteira clicável (controle dentro de
controle com o "⋯" e o "Ver texto inteiro"). Coluna fixa de ações no celular
(apertava o título). Agrupar por dia com cabeçalho próprio (dobrava a altura
da lista com um evento por dia; a data uma vez por dia na coluna faz o mesmo
papel). Mudar `textLinkClassName` para todos os links (o ajuste é desta
lista). Filtros visíveis e desabilitados durante a busca (controle que não
faz nada). Ordenar o mesmo dia no cliente (inventaria uma regra que a view
não tem).

**Pendências registradas (anteriores, não alteradas).**

- **"Atividade" do cabeçalho** (popover do desktop e aba "Atividade" da
  caixa de entrada no celular): o cartão do `TimelineItem` ainda tem "Ver"
  de **35×16** com nome só "Ver" (medido no cenário 143). Fora desta tela;
  fica para a etapa do shell.
- **Mesmo dia sem ordem garantida**: a view não tem chave secundária; dois
  registros da mesma data podem trocar de lugar entre leituras.
- **Limite de 1000 linhas** (PostgREST `max_rows`): sem paginação, um
  veículo com mais de 1000 eventos mostra só os 1000 mais recentes; filtros
  e contagens valem só sobre eles, sem aviso.
- "Ver" leva à **lista** da tela de origem, não ao registro (exceto item de
  projeto e projeto).
- Busca: abastecimento não entra; gasto é buscado só pela descrição; o
  resultado não traz valor nem km; item de projeto leva à lista de Projetos.
- Vazio sem busca: com zero eventos a busca não aparece — projeto sem item
  datado (que não é evento da view) só se acha em Projetos.
- Nota toda em branco é aceita ("Sem título", sem texto) — regra de
  liberdade de preenchimento (Fase 10), preservada.
- Filtros e busca não ficam na URL (recarregar volta ao padrão).
- No dashboard os diálogos de nota continuam dentro da linha do
  `TimelineItem` (fora do escopo).

**Verificação.** Dados simulados (ferramenta externa
`redesign-capturas/ferramenta/inspect.mjs`, `timelineHandler` novo, cenários
137–143, arquivos 241–246, `etapa-13/relatorio.txt`; antes em
`relatorio-antes.txt`): 22 eventos do Civic das sete origens + um tipo
desconhecido, três no mesmo dia, título longo, nota em várias linhas, nota
sem título com km 0, valor R$ 0,00 e ausente, km ausente, gasto sem
categoria, item de projeto com projeto inexistente; Gol com item de projeto
real; Maverick vazio. Busca como a função (sem acento, sem abastecimento,
com projeto, trecho de 200), escritas em `notes` com corpo registrado; rede
trancada, nenhuma chamada ao Supabase real, nenhuma escrita real.
Conferido: ordem da tela = ordem da view (22/22); "Ver" de cada origem com o
handler da tela de destino; teclado (Tab, Enter no "⋯", Escape) e volta do
foco em todos os diálogos; nota: cancelar, Escape, km inválido (foco e
`aria-invalid`), falha (preservado), dois Enter → um POST, nota em branco
(data do banco), edição com data em branco (fora do PATCH), falha na edição,
editada para fora do filtro, exclusão (Escape, falha com duplo clique → um
DELETE, sucesso, foco); `?novo=1` (sai da URL, recarregar não reabre),
folha Registrar, item ativo; filtros, sem resultado, busca (carregando,
falha e nova tentativa, sem resultado, limpar); carregando, falha da lista
e nova tentativa, vazio e primeira nota, veículo inexistente; troca de
veículo; atividade recente do dashboard com os diálogos novos. 320, 360,
390, 640, 768, 1024, 1280, 1440, 1920 e 2560, claro e escuro alternados: sem
rolagem horizontal, sem segunda rolagem a partir de 1024, nenhum alvo menor
que 44px, nenhum texto cortado, rolagem real (roda do mouse) até o fim com o
último "Ver" acima da barra inferior e alcançável; teclado virtual emulado
(390×380) com "Salvar nota" à vista. Axe sem violações em 21 estados.
`npm run lint`, `npx tsc -b` e `npm run build` limpos. Nenhum aparelho
físico nem leitor de tela real.

**Ajustes da revisão (10/11/2026).**

- **Nome de "Ver" pelo destino.** "Ver manutenção: Troca de óleo e filtro"
  sugeria abrir o serviço, mas o link leva à lista de Manutenção. O nome
  agora diz o destino e o registro de partida: "Ver lista de Manutenção, a
  partir de Troca de óleo e filtro, 10/11/2026"; item de projeto que abre o
  detalhe, "Ver projeto, a partir de Comando de válvulas 272°, 11/07/2026";
  o projeto achado na busca, "Ver projeto: Suspensão coilover, 11/09/2026";
  sem título, "Ver lista de Abastecimentos, a partir do abastecimento de
  10/11/2026". O nome continua começando pela palavra visível "Ver" (WCAG
  2.5.3, comando de voz) — por isso não "Ir para Manutenção…", que pediria
  trocar também o texto visível. O destino vem do mesmo dado do link
  (`TimelineEntry.destination`); rota, alvo e aparência não mudaram.
- Verificação: cenário 144 (`etapa-13/relatorio-ajustes.txt`, sem capturas),
  um caso de cada destino com o handler da tela de origem — gasto (com e sem
  categoria), abastecimento, manutenção, problema e documento → a lista
  certa; item de projeto → detalhe do projeto; na busca, projeto → detalhe e
  item de projeto → lista de Projetos. Todos com o nome começando por "Ver" e
  44×44; os 18 nomes da lista do Civic diferentes entre si; axe sem
  violações em 320.
