# Plano 000 — Fundação do frontend

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Montar o scaffold Vite + React 19 + TypeScript strict manualmente (sem rodar `npm create vite` por cima do repositório já existente, para não sobrescrever `package.json`/lockfile atuais), adicionando Tailwind e shadcn/ui em seguida, depois sobrescrevendo os tokens padrão do shadcn pelos tokens Slow Car Club definidos no clarify (paleta preto-fosco quente + acento dourado, tipografia hero separada de corpo). TanStack Query, React Router e o client Supabase entram como providers e um objeto de rotas tipado, sem nenhuma tela de domínio. Tema dark/light usa Context + `localStorage` própria (sem lib de tema), porque é estado de UI local, não estado de servidor, e a escolha é simples demais para justificar dependência. PWA via `vite-plugin-pwa`, com ícones gerados uma única vez a partir da logo Slow Car Club por um script Node local (usa `sharp`, devDependency).

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| `npm create vite@latest` direto na raiz | Sobrescreveria `package.json`/`package-lock.json` já existentes (com `playwright`/`@axe-core/playwright`). Monto o scaffold arquivo a arquivo e mesclo as dependências. |
| React Router v7 em modo framework (loaders/actions, roteamento por arquivo) | Assume uma arquitetura de app diferente (SSR/data router de framework) que este projeto não usa — é SPA pura no Vite. `react-router-dom` em modo biblioteca cobre exatamente o que a Seção 6 do documento pede (veículo na URL, sem mais). |
| Biblioteca de tema (`next-themes` ou similar) | É pensada para Next.js (lida com hidratação SSR); aqui não há SSR. Um hook próprio de ~30 linhas com `localStorage` resolve sem dependência nova. |
| Baixar arquivos de fonte manualmente e commitar em `public/fonts/` | `@fontsource/*` entrega os mesmos arquivos (licença OFL, sem CDN, servido do mesmo domínio no build), com atualização e subsetting por pacote — menos risco de arquivo de fonte errado ou desatualizado. |
| Gerar ícones do PWA manualmente em editor de imagem | Não é reproduzível nem versionável. Um script Node com `sharp` (open-source, sem custo) gera todos os tamanhos a partir do mesmo arquivo de origem, documentado e re-executável se a logo mudar. |
| Instalar `zod`, `react-hook-form`, `recharts` já nesta fase (fazem parte do stack aprovado) | Nenhuma tela ou formulário existe ainda nesta fase. Instalar dependência sem uso é peso morto no lockfile; entram na fase que efetivamente as usa (Fase 1 em diante). |

## 3. Impacto em contratos e dados

Nenhum. Esta fase não lê nem grava dado real — o client Supabase é criado e tipado, mas nenhuma query roda contra tabela de domínio.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `package.json` | modificar | Adicionar dependências, scripts (`dev`, `build`, `preview`, `lint`, `types`) |
| `vite.config.ts` | criar | Config do Vite, plugin React, plugin PWA, alias de path (`@/`) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | criar | TypeScript strict, path alias `@/*` |
| `index.html` | criar | Entry HTML, link do manifest, `lang="pt-BR"` |
| `.eslintrc` (ou `eslint.config.js`) | criar | Lint (`typescript-eslint` + `react-hooks` + `jsx-a11y`) |
| `.env.example` | criar | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` vazios |
| `.gitignore` | modificar | Adicionar `.env` |
| `src/main.tsx` | criar | Entry point — monta providers + shell ou tela de configuração ausente |
| `src/app/router.tsx` | criar | Objeto de rotas tipado, uma rota placeholder |
| `src/app/providers.tsx` | criar | `QueryClientProvider` + `ThemeProvider` |
| `src/lib/routes.ts` | criar | Constante `ROUTES` tipada — sem string solta de rota |
| `src/lib/supabase.ts` | criar | Client Supabase tipado com `Database` |
| `src/lib/format.ts` | criar | Dinheiro, data, número, decimal com vírgula (pt-BR) |
| `src/lib/theme.ts` | criar | Ler/escrever tema no `localStorage`, aplicar classe `.dark` na raiz |
| `src/hooks/useTheme.ts` | criar | Hook de tema consumido pelo `ThemeToggle` |
| `src/types/database.types.ts` | criar | Placeholder documentado — substituído por `npm run types` quando as credenciais chegarem |
| `src/styles/tokens.css` | criar | CSS variables — cor, espaço, raio, tipografia (dark + light) |
| `src/styles/globals.css` | criar | Diretivas Tailwind + import de `tokens.css` + `@font-face` |
| `tailwind.config.ts` | criar | Aponta pros tokens CSS, `fontFamily.hero` / `fontFamily.sans` |
| `components.json` | criar | Config do shadcn/ui |
| `src/components/ui/button.tsx`, `switch.tsx` | criar (via shadcn CLI) | Únicos componentes shadcn necessários nesta fase (toggle de tema) |
| `src/components/shared/ThemeToggle.tsx` | criar | Alterna dark/light, acessível por teclado |
| `src/components/layout/AppShell.tsx` | criar | Shell vazio: área de conteúdo + `ThemeToggle`, sem sidebar/bottom-nav de domínio |
| `src/components/shared/ConfigMissingScreen.tsx` | criar | Tela exibida quando faltam variáveis de ambiente do Supabase |
| `scripts/generate-icons.mjs` | criar | Script Node (`sharp`) que gera os ícones PWA a partir de `5348.png` |
| `public/manifest.webmanifest` | criar | Manifest do PWA |
| `public/icons/*` | criar | Ícones gerados pelo script, todos os tamanhos exigidos |
| `docs/DESIGN.md` | criar | Tokens finais, papéis tipográficos, o que foi recusado e por quê |
| `docs/DECISIONS.md` | criar | ADRs curtos: fontsource, sharp, Context para tema, React Router em modo biblioteca |
| `specs/000-foundation/verification.md` | criar (ao final) | Saída de build/tsc/lint colada + lista de verificação manual |

## 5. Ordem de execução

1. Scaffold base (`package.json`, `tsconfig*`, `vite.config.ts`, `index.html`, `src/main.tsx` mínimo) — precisa rodar antes de qualquer outra coisa.
2. Tailwind + shadcn init (`components.json`, `tailwind.config.ts`, `globals.css` na configuração padrão do shadcn).
3. Sobrescrever tokens padrão pelos tokens Slow Car Club (`tokens.css`), mapeados nas variáveis que o shadcn espera (`--background`, `--primary`, etc.) — depende do passo 2 já ter criado a estrutura base.
4. Instalar e conectar as fontes (`@fontsource/*`), `fontFamily` no Tailwind.
5. `lib/format.ts` — sem dependência de nada além de `date-fns`.
6. `lib/routes.ts`, `app/router.tsx`, `main.tsx` completo com `RouterProvider` — depende do passo 1.
7. `lib/theme.ts` + `useTheme.ts` + `ThemeToggle.tsx` — depende dos tokens (passo 3) já existirem.
8. `lib/supabase.ts` + `types/database.types.ts` (placeholder) — independente dos passos de UI.
9. `ConfigMissingScreen.tsx` + checagem de env em `main.tsx` — depende do passo 8 (sabe o que checar).
10. `AppShell.tsx` juntando router + theme toggle + shell vazio — depende dos passos 6 e 7.
11. `vite-plugin-pwa` + `scripts/generate-icons.mjs` + `public/manifest.webmanifest` — independente, pode rodar em paralelo aos passos 6–10.
12. `docs/DESIGN.md` e `docs/DECISIONS.md` — escritos por último, documentam o que foi de fato implementado.
13. Build, `tsc --noEmit`, lint, verificação manual de 320px/contraste/teclado, `verification.md`.

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | `npm run dev`, screenshot do shell com tema aplicado, console limpo | manual |
| AC-2 | Alternar tema, recarregar página (F5), confirmar persistência + contraste AA via checagem de valor de contraste dos tokens | manual |
| AC-3 | `npx tsc --noEmit`, saída colada em `verification.md` | automático |
| AC-4 | Snippet temporário de query com coluna inexistente, confirmar erro do `tsc`, descartar o snippet (não fica no repo). Cobertura plena depende do `Database` real — ver risco R-1 | manual, parcial até credenciais chegarem |
| AC-5 | Casos de teste manuais dos helpers de `format.ts` (valor, data, decimal) com saída colada | manual |
| AC-6 | Auditoria Lighthouse (PWA installable), screenshot do resultado | manual |
| AC-7 | DevTools em 320px, navegar o shell, confirmar ausência de scroll horizontal | manual |
| AC-8 | Remover `.env` temporariamente, confirmar que `ConfigMissingScreen` aparece em vez de tela branca | manual |
| AC-9 | Revisão de CSS/tokens (`grep` por cor hex fora de `tokens.css`) | automático (grep) + manual |
| AC-10 | `grep` por `font-hero`/`Permanent Marker` fora dos componentes combinados (splash, login futuro, header de veículo futuro, empty state) | automático (grep) |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Credenciais do Supabase não chegam a tempo | `Database` fica com placeholder; AC-4 só parcialmente verificável | Placeholder documentado com comentário `TODO` explícito; task de regenerar tipos entra como pendência clara na Fase 1, não escondida |
| Logo fonte (473×276, retangular) fica ilegível em ícone maskable pequeno (48px) | Ícone do app pode ficar confuso ou cortado errado | Gerar primeira versão com o script, revisar visualmente em 48/96/192px antes de aprovar; se não ficar legível, pedir variante quadrada só do emblema |
| `@fontsource/noto-sans-jp` traz glifos CJK completos por padrão | Bundle inicial pesado | Importar apenas o arquivo de subset `japanese` do pacote, não o `latin`+`japanese` completo |
| shadcn init sobrescreve `globals.css`/`tailwind.config.ts` com tokens padrão antes de eu aplicar os nossos | Cor errada aparece temporariamente durante o build | Ordem de execução (passo 2 antes do 3) já isola isso; nenhum commit fica com o token padrão do shadcn |

## 8. Rollback

Sem risco de dado em produção — repositório não tem deploy nem usuário real ainda. Rollback é `git revert` do(s) commit(s) desta fase ou descarte da branch, sem efeito colateral em sistema externo.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência colada em `verification.md`
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` passa
- [ ] Lint passa sem warning
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` escritos e coerentes com o que foi implementado
- [ ] `.env` no `.gitignore`, `.env.example` com chaves vazias
- [ ] Nenhuma tela de domínio presente (checagem de escopo)
- [ ] Lista do que precisa ser testado à mão entregue junto da verificação
