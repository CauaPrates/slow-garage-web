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
