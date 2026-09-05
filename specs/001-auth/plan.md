# Plano 001 — Autenticação e rotas protegidas

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

`@supabase/supabase-js` já resolve sessão (persistência em `localStorage`, refresh de token, parsing de link de e-mail via `detectSessionInUrl`) — não reimplementamos nada disso. Um `AuthProvider` (Context) escuta `supabase.auth.onAuthStateChange` e expõe estado (`loading` / `unauthenticated` / `authenticated`) + ações (`signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`), cada uma já traduzindo erro do Supabase pro português via um mapa central. Duas guardas de rota (`ProtectedRoute`, `GuestRoute`) leem esse contexto. Duas telas (`/entrar`, `/cadastro`) ganham um layout próprio (`AuthLayout`) sem o cromo do `AppShell`, porque são dois dos quatro pontos "hero" da Fase 0 e o header persistente competiria visualmente. `react-hook-form` + `zod` entram agora — já fazem parte do stack aprovado, primeira vez que há formulário de verdade.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Rota `/auth/callback` fazendo parsing manual do token da URL | `detectSessionInUrl` (default do client) já faz isso — reimplementar duplicaria lógica que o Supabase já resolve, com mais chance de bug |
| Buscar sessão via `fetch` manual + estado próprio, sem `onAuthStateChange` | `onAuthStateChange` é a forma documentada e testada pelo próprio Supabase de manter estado de sessão em sincronia (login, logout, refresh, expiração) — reinventar é mais código pra pior resultado |
| Reusar `AppShell` pras telas de auth | O header persistente ("Slow Garage" + toggle) competiria com a energia hero de `/entrar`/`/cadastro` (RN-3). Um `AuthLayout` próprio, sem esse cromo, deixa a tipografia hero ser o único elemento de destaque |
| `Controller` do react-hook-form em todo campo | Os campos são `input` simples (texto, e-mail, senha) — `register()` direto é menos código e é o padrão do próprio react-hook-form pra esse caso; `Controller` fica pra quando aparecer um componente controlado de verdade (ex: select customizado) |

## 3. Impacto em contratos e dados

Nenhuma mudança de schema. Primeira leitura/escrita real em `profiles` (`select` da própria linha, `update` de `display_name`) — segue exatamente o contrato documentado, sem `insert` (RN-1).

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/routes.ts` | modificar | Adicionar `entrar`, `cadastro`, `confirmeEmail`, `recuperarSenha`, `redefinirSenha`, `configuracoes` |
| `src/lib/supabase.ts` | modificar | Explicitar `auth: { persistSession: true, detectSessionInUrl: true }` (já é o default — deixar explícito documenta a dependência) |
| `src/features/auth/errors.ts` | criar | `translateAuthError(error)` — mapa de erro do Supabase Auth pro português |
| `src/features/auth/schemas.ts` | criar | zod: cadastro, login, pedir reset, redefinir senha, nome de exibição |
| `src/features/auth/AuthProvider.tsx` | criar | Context de sessão + ações de auth, usado por `useAuth()` |
| `src/features/auth/useProfile.ts` | criar | TanStack Query — busca/atualiza a própria linha de `profiles`. Query key `['profile', userId]` |
| `src/features/auth/components/SignUpForm.tsx` | criar | Formulário de cadastro |
| `src/features/auth/components/SignInForm.tsx` | criar | Formulário de login |
| `src/features/auth/components/RequestPasswordResetForm.tsx` | criar | Formulário de pedido de recuperação |
| `src/features/auth/components/UpdatePasswordForm.tsx` | criar | Formulário de nova senha (pós-link) |
| `src/features/auth/components/DisplayNameForm.tsx` | criar | Editar nome de exibição, usado em Configurações |
| `src/features/auth/SignUpPage.tsx` | criar | `/cadastro` |
| `src/features/auth/SignInPage.tsx` | criar | `/entrar` |
| `src/features/auth/ConfirmEmailPendingPage.tsx` | criar | `/confirme-seu-email` |
| `src/features/auth/RequestPasswordResetPage.tsx` | criar | `/recuperar-senha` |
| `src/features/auth/UpdatePasswordPage.tsx` | criar | `/redefinir-senha` — escuta evento `PASSWORD_RECOVERY`, mostra erro (AC-12) se não chegar |
| `src/features/auth/SettingsPage.tsx` | criar | `/configuracoes` — nome, e-mail (leitura), sair |
| `src/components/layout/AuthLayout.tsx` | criar | Layout full-bleed centralizado pras telas de auth, sem o header do `AppShell` |
| `src/components/shared/ProtectedRoute.tsx` | criar | Redireciona não-autenticado pra `/entrar?redirect=<rota>`; mostra loading enquanto `status === 'loading'` |
| `src/components/shared/GuestRoute.tsx` | criar | Redireciona autenticado pra `/` |
| `src/components/ui/input.tsx`, `label.tsx` | criar | Via CLI do shadcn (retry — talvez o bug do ADR-007 não se repita agora que há mais scaffold) ou à mão seguindo o mesmo padrão se falhar de novo |
| `src/app/providers.tsx` | modificar | Compor `AuthProvider` junto de `QueryClientProvider`/tema |
| `src/app/router.tsx` | modificar | Nova árvore de rotas: `AuthLayout` + `GuestRoute` pras telas de auth, `ProtectedRoute` em `/` e `/configuracoes` |
| `docs/DESIGN.md` | modificar | Primeira aplicação real da tipografia hero (login/cadastro) — documentar como ficou |
| `docs/DECISIONS.md` | modificar | ADRs desta fase (ver Seção 7 de riscos e o que for descoberto na implementação) |
| `specs/001-auth/verification.md` | criar (ao final) | Evidência dos 15 ACs |

## 5. Ordem de execução

1. `npm install react-hook-form zod @hookform/resolvers` — pré-requisito de tudo que segue
2. `lib/routes.ts` — sem dependência
3. `features/auth/schemas.ts`, `features/auth/errors.ts` — sem dependência de UI
4. `components/ui/input.tsx`, `label.tsx` — pré-requisito dos formulários
5. `features/auth/AuthProvider.tsx` — depende de `lib/supabase.ts` e `errors.ts`
6. Compor `AuthProvider` em `app/providers.tsx` — depende do passo 5
7. `features/auth/useProfile.ts` — depende do `AuthProvider` (precisa do `userId`)
8. `components/layout/AuthLayout.tsx` — sem dependência de auth
9. `components/shared/ProtectedRoute.tsx`, `GuestRoute.tsx` — dependem do `AuthProvider`
10. Formulários (`SignUpForm`, `SignInForm`, `RequestPasswordResetForm`, `UpdatePasswordForm`, `DisplayNameForm`) — dependem dos passos 3, 4, 5, 7
11. Páginas (`SignUpPage`, `SignInPage`, `ConfirmEmailPendingPage`, `RequestPasswordResetPage`, `UpdatePasswordPage`, `SettingsPage`) — dependem dos passos 8, 10
12. `app/router.tsx` final — depende de tudo acima
13. `docs/DESIGN.md`, `docs/DECISIONS.md`
14. Build, `tsc`, lint, `ui:check`, teste manual com `alice@dev.local`/`bob@dev.local`, `verification.md`

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Cadastro com e-mail novo real (descartável), confirma tela "confirme seu e-mail" | manual |
| AC-2 | Cadastro com `alice@dev.local` (já existe) → mensagem de e-mail duplicado | manual |
| AC-3 | Cadastro com senha de 3 caracteres → formulário recusa antes de chamar o Supabase | manual |
| AC-4 | Login com `alice@dev.local` / `DevPassword123!` → sessão criada, vai pra Home | manual |
| AC-5 | Login com senha errada pra `alice@dev.local` → mensagem genérica | manual |
| AC-6 | Login com e-mail recém-cadastrado (ainda não confirmado) → mensagem específica | manual — depende do AC-1 já ter rodado |
| AC-7 | Login, fechar aba, reabrir `localhost:5173` → continua logado | manual |
| AC-8 | Deslogado, abrir `/configuracoes` direto → cai em `/entrar`, loga, volta pra `/configuracoes` | manual |
| AC-9 | Logado, abrir `/entrar` direto → vai pra `/` | manual |
| AC-10 | Pedir reset pra e-mail que existe e pra um que não existe → mesma mensagem nos dois | manual |
| AC-11 | Fluxo completo de link de reset (depende do Redirect URL estar corrigido) → nova senha, autenticado | manual — bloqueado até o dashboard ser ajustado (ver Seção 11 da spec) |
| AC-12 | Abrir `/redefinir-senha` direto, sem vir de link válido → erro claro | manual |
| AC-13 | Logado, mudar nome em `/configuracoes`, recarregar página → nome persistiu | manual |
| AC-14 | Logado, clicar sair → volta pra `/entrar`, sessão realmente encerrada (tentar abrir rota protegida de novo) | manual |
| AC-15 | Revisão de cada mensagem de erro mostrada durante os testes acima — nenhuma mensagem crua do Supabase | manual, cruzado com os testes acima |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Site URL/Redirect URLs ainda não corrigidos no dashboard no momento da implementação | AC-11 (fluxo completo de reset) e o comportamento exato do link de confirmação (AC-1→AC-4) não são totalmente testáveis ponta a ponta | Implemento os dois fluxos cobrindo o comportamento documentado do Supabase; reporto na verificação exatamente o que ficou testado com os usuários seed vs. o que depende do ajuste do dashboard |
| Usuários seed (`alice@dev.local`, `bob@dev.local`) podem não estar com e-mail confirmado no banco | Bloquearia testar AC-4/7/8/9/13/14 (que não dependem do fluxo de e-mail) | Testo login logo no início da implementação; se estiver bloqueado, reporto imediatamente em vez de presumir |
| `detectSessionInUrl` não completar a troca de sessão automaticamente em algum caso de fluxo PKCE | Usuário clicaria o link e não seria autenticado como esperado | Cobrir com teste manual real de cadastro + confirmação assim que o Redirect URL estiver certo; se não completar sozinho, adiciono troca explícita (`exchangeCodeForSession`) — registro como ajuste, não como retrabalho silencioso |

## 8. Rollback

Sem risco de dado — nenhuma migration, nenhuma alteração de schema. Rollback é `git revert`/descarte da branch. Contas de teste criadas durante a verificação (e-mails descartáveis) não afetam ninguém.

## 9. Definição de pronto

- [ ] Todos os 15 ACs verificados com evidência em `verification.md` (os que dependerem do ajuste do dashboard, marcados como tal, não como "passou")
- [ ] `npm run build` passa
- [ ] `npx tsc --noEmit` passa
- [ ] Lint passa sem warning
- [ ] Nenhuma senha aparece em log/erro exibido
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` atualizados
- [ ] Lista do que precisa ser testado à mão entregue (incluindo o fluxo que depende do dashboard)
