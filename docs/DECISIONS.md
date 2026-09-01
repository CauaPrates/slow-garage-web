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

## ADR-009 — `eslint-plugin-react-hooks` v7: usar `.rules`, não o config pronto, no `eslint.config.js`

O export `configs['recommended-latest']` do plugin declara
`plugins: ['react-hooks']` (array de string), formato que a versão
instalada do ESLint (9.x, flat config) rejeita — espera `plugins` como
objeto. Contornado registrando o plugin manualmente
(`plugins: { "react-hooks": reactHooks }`) e espalhando só
`configs['recommended-latest'].rules`. Sem impacto no conjunto de regras
aplicado, só na forma de declarar.
