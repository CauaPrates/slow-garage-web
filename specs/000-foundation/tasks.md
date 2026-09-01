# Tasks 000 — Fundação do frontend

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Scaffold Vite + TS + React base (mesclar dependências/scripts no `package.json` existente, `tsconfig*`, `vite.config.ts` mínimo, `index.html`, `main.tsx` placeholder) | `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx` | AC-1, AC-3 | — | ☐ |
| 2 | Configurar `.gitignore` (adicionar `.env`) e `.env.example` com chaves vazias | `.gitignore`, `.env.example` | AC-8 | 1 | ☐ |
| 3 | Configurar ESLint (`typescript-eslint` + `react-hooks` + `jsx-a11y`) e script `lint` | `eslint.config.js`, `package.json` | pré-requisito (Definição de pronto) | 1 | ☐ |
| 4 | Instalar Tailwind e inicializar shadcn/ui com baseline padrão | `tailwind.config.ts`, `components.json`, `src/styles/globals.css` | AC-1 | 1 | ☐ |
| 5 | Criar tokens Slow Car Club (dark + light) e sobrescrever os padrões do shadcn | `src/styles/tokens.css`, `src/styles/globals.css`, `tailwind.config.ts` | AC-1, AC-2, AC-9 | 4 | ☐ |
| 6 | Instalar e conectar fontes locais (`@fontsource/permanent-marker`, `@fontsource/space-grotesk`, subset `japanese` de `@fontsource/noto-sans-jp`) | `package.json`, `src/styles/globals.css`, `tailwind.config.ts` | AC-1, AC-10 | 5 | ☐ |
| 7 | Implementar `lib/format.ts` (dinheiro, data, decimal com vírgula, quilometragem) | `src/lib/format.ts` | AC-5 | 1 | ☐ |
| 8 | Implementar `lib/routes.ts` (objeto de rotas tipado, sem string solta) | `src/lib/routes.ts` | pré-requisito (task 9) | 1 | ☐ |
| 9 | Implementar `app/router.tsx` com rota placeholder | `src/app/router.tsx` | AC-1 | 8 | ☐ |
| 10 | Implementar `lib/theme.ts` (leitura/escrita `localStorage`, aplica classe `.dark`) e `hooks/useTheme.ts` | `src/lib/theme.ts`, `src/hooks/useTheme.ts` | AC-2 | 5 | ☐ |
| 11 | Instalar componentes shadcn necessários (`button`, `switch`) via CLI | `src/components/ui/button.tsx`, `src/components/ui/switch.tsx` | pré-requisito (task 12) | 4 | ☐ |
| 12 | Implementar `components/shared/ThemeToggle.tsx`, acessível por teclado com foco visível | `src/components/shared/ThemeToggle.tsx` | AC-2 | 10, 11 | ☐ |
| 13 | Implementar `app/providers.tsx` (`QueryClientProvider` + `ThemeProvider`) | `src/app/providers.tsx` | AC-1 | 10 | ☐ |
| 14 | Implementar `lib/supabase.ts` com client tipado + placeholder documentado em `types/database.types.ts` | `src/lib/supabase.ts`, `src/types/database.types.ts` | AC-4 | 1 | ☐ |
| 15 | Implementar `components/shared/ConfigMissingScreen.tsx` e checagem de variáveis de ambiente | `src/components/shared/ConfigMissingScreen.tsx`, `src/main.tsx` | AC-8 | 14 | ☐ |
| 16 | Implementar `components/layout/AppShell.tsx` (shell vazio + `ThemeToggle` + outlet do router) | `src/components/layout/AppShell.tsx` | AC-1, AC-7 | 9, 12 | ☐ |
| 17 | Finalizar `src/main.tsx` (providers + checagem de env + `AppShell`/`RouterProvider`) | `src/main.tsx` | AC-1, AC-8 | 13, 15, 16 | ☐ |
| 18 | Escrever `scripts/generate-icons.mjs` (`sharp`) a partir de `5348.png` | `scripts/generate-icons.mjs`, `package.json` (devDependency `sharp`) | pré-requisito (task 19) | 1 | ☐ |
| 19 | Rodar o script e gerar `public/icons/*` em todos os tamanhos exigidos | `public/icons/*` | AC-6 | 18 | ☐ |
| 20 | Configurar `vite-plugin-pwa` e `public/manifest.webmanifest` | `vite.config.ts`, `public/manifest.webmanifest`, `index.html` | AC-6 | 19 | ☐ |
| 21 | Escrever `docs/DESIGN.md` (tokens finais, papéis tipográficos, o que foi recusado e por quê) | `docs/DESIGN.md` | entrega documental da fase | 5, 6 | ☐ |
| 22 | Escrever `docs/DECISIONS.md` (ADRs: fontsource, sharp, Context para tema, React Router em modo biblioteca) | `docs/DECISIONS.md` | entrega documental da fase | 6, 10, 18 | ☐ |
| 23 | Verificação manual: 320px sem overflow, contraste AA, foco de teclado, snippet descartável para AC-4, remoção temporária de `.env` para AC-8, Lighthouse instalável, grep de AC-9/AC-10 | — | AC-2, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10 | 17, 20, 21 | ☐ |
| 24 | Rodar `npm run build`, `npx tsc --noEmit` e lint; escrever `specs/000-foundation/verification.md` com saída literal colada | `specs/000-foundation/verification.md` | AC-3 (+ consolida todos) | 23 | ☐ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

- Task 14 (client Supabase tipado): `Database` fica com placeholder documentado até `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e o project ref chegarem. Não bloqueia a task em si, mas AC-4 só é totalmente verificável depois.
- Nenhum outro bloqueio conhecido no momento.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| — | — | — |
