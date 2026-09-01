# Tasks 001 — Autenticação e rotas protegidas

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Instalar `react-hook-form`, `zod`, `@hookform/resolvers` | `package.json` | pré-requisito | — | ☑ |
| 2 | Adicionar rotas de auth em `lib/routes.ts` | `src/lib/routes.ts` | pré-requisito | — | ☑ |
| 3 | Explicitar `persistSession`/`detectSessionInUrl` no client | `src/lib/supabase.ts` | AC-7 | — | ☑ |
| 4 | `translateAuthError` — mapa de erro do Supabase pro português | `src/features/auth/errors.ts` | AC-15 | — | ☑ |
| 5 | Schemas zod (cadastro, login, pedir reset, redefinir senha, nome) | `src/features/auth/schemas.ts` | AC-1, AC-2, AC-3, AC-10, AC-11, AC-13 | 1 | ☑ |
| 6 | `components/ui/input.tsx`, `label.tsx` | `src/components/ui/input.tsx`, `src/components/ui/label.tsx` | pré-requisito | — | ☑ (CLI escreveu em pasta errada e com tokens genéricos — retrabalhados à mão, ADR-015) |
| 7 | `AuthProvider` (Context de sessão + ações) | `src/features/auth/AuthProvider.tsx` | AC-4, AC-5, AC-6, AC-7, AC-9, AC-14 | 3, 4 | ☑ |
| 8 | Compor `AuthProvider` em `app/providers.tsx` | `src/app/providers.tsx` | pré-requisito | 7 | ☑ |
| 9 | `useProfile` (TanStack Query, `['profile', userId]`) | `src/features/auth/useProfile.ts` | AC-13 | 8 | ☑ |
| 10 | `AuthLayout` (full-bleed, sem header do AppShell) | `src/components/layout/AuthLayout.tsx` | pré-requisito (AC-1, AC-2 hero) | — | ☑ |
| 11 | `ProtectedRoute` | `src/components/shared/ProtectedRoute.tsx` | AC-8 | 8 | ☑ |
| 12 | `GuestRoute` | `src/components/shared/GuestRoute.tsx` | AC-9 | 8 | ☑ (achado durante o teste manual: precisou ler o mesmo `?redirect=` do SignInForm — ADR-013) |
| 13 | `SignUpForm` | `src/features/auth/components/SignUpForm.tsx` | AC-1, AC-2, AC-3 | 5, 6, 7 | ☑ (AC-2 revisado — ver ADR-012) |
| 14 | `SignInForm` | `src/features/auth/components/SignInForm.tsx` | AC-4, AC-5, AC-6 | 5, 6, 7 | ☑ |
| 15 | `RequestPasswordResetForm` | `src/features/auth/components/RequestPasswordResetForm.tsx` | AC-10 | 5, 6, 7 | ☑ |
| 16 | `UpdatePasswordForm` | `src/features/auth/components/UpdatePasswordForm.tsx` | AC-11, AC-12 | 5, 6, 7 | ☑ |
| 17 | `DisplayNameForm` | `src/features/auth/components/DisplayNameForm.tsx` | AC-13 | 5, 6, 9 | ☑ |
| 18 | `SignUpPage` (`/cadastro`) | `src/features/auth/SignUpPage.tsx` | AC-1, AC-2, AC-3 | 10, 13 | ☑ |
| 19 | `SignInPage` (`/entrar`) | `src/features/auth/SignInPage.tsx` | AC-4, AC-5, AC-6 | 10, 14 | ☑ |
| 20 | `ConfirmEmailPendingPage` (`/confirme-seu-email`) | `src/features/auth/ConfirmEmailPendingPage.tsx` | AC-1 | 10 | ☑ |
| 21 | `RequestPasswordResetPage` (`/recuperar-senha`) | `src/features/auth/RequestPasswordResetPage.tsx` | AC-10 | 10, 15 | ☑ |
| 22 | `UpdatePasswordPage` (`/redefinir-senha`) — escuta `PASSWORD_RECOVERY` | `src/features/auth/UpdatePasswordPage.tsx` | AC-11, AC-12 | 10, 16 | ☑ |
| 23 | `SettingsPage` (`/configuracoes`) — nome, e-mail, sair | `src/features/auth/SettingsPage.tsx` | AC-13, AC-14 | 17 | ☑ |
| 24 | `app/router.tsx` final — `AuthLayout`/`GuestRoute`/`ProtectedRoute` na árvore | `src/app/router.tsx` | AC-8, AC-9 | 11, 12, 18–23 | ☑ |
| 25 | Atualizar `docs/DESIGN.md` (primeira aplicação real da tipografia hero) | `docs/DESIGN.md` | entrega documental | 18, 19 | ☑ |
| 26 | Atualizar `docs/DECISIONS.md` com os ADRs desta fase | `docs/DECISIONS.md` | entrega documental | 24 | ☑ |
| 27 | Verificação manual completa dos 15 ACs com `alice@dev.local`/`bob@dev.local` | — | todos | 24 | ☑ (AC-1/AC-6/AC-10/AC-11 parciais — rate limit de e-mail, ver ADR-016 e verification.md) |
| 28 | Build, `tsc --noEmit`, lint, `ui:check`; escrever `specs/001-auth/verification.md` | `specs/001-auth/verification.md` | AC-15 (+ consolida) | 27 | ☑ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

- AC-11 (fluxo completo de redefinição de senha via link real) e a confirmação exata do comportamento do link de cadastro dependem do Site URL/Redirect URLs serem corrigidos no dashboard de Auth (ver Seção 11 da spec). Reportado na conversa; sigo implementando e testo o que for possível com os usuários seed.
- Limite de envio de e-mail do Supabase (sem SMTP customizado) foi atingido durante a própria verificação (várias chamadas de `signUp`/`resetPasswordForEmail` em sequência). Bloqueou testar AC-1 e AC-6 com conta 100% fresca nesta sessão — cobertos por caminho de código equivalente, ver ADR-016 e `verification.md`.

## Escopo recusado durante a implementação

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
| AC-2 revisado (não é mais escopo recusado, é correção de spec) | Supabase Auth tem proteção anti-enumeração no `signUp` — nunca revela e-mail duplicado | `spec.md` reescrito (ADR-012) pra descrever o comportamento seguro real em vez do presumido |
