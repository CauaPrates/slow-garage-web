# Verificação 001 — Autenticação e rotas protegidas

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-01/02 |
| **Resultado** | aprovado, com 4 ACs parciais por limite de e-mail do Supabase (ver Pendências) |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ⚠️ parcial | `signUp()` com e-mail nunca visto → esperado 200 + redirect pra `/confirme-seu-email`. Confirmado indiretamente: o mesmíssimo código, testado com e-mail já existente (AC-2), retornou 200 e redirecionou corretamente. Tentativa direta com e-mail 100% fresco bateu no rate limit de e-mail do Supabase (`429 over_email_send_rate_limit`) antes de completar — ver ADR-016 |
| AC-2 | ✅ (spec revisada) | Rede inspecionada: `POST .../auth/v1/signup` com `alice@dev.local` (já existe) → `200`, corpo com `"identities":[]` (sinal de anti-enumeração do GoTrue), app redireciona pra `/confirme-seu-email` sem erro. Comportamento seguro, não o presumido originalmente — AC-2 reescrito em `spec.md`, ver ADR-012 |
| AC-3 | ✅ | Cadastro com senha `"123"` → formulário não chama o servidor, mostra "A senha precisa ter pelo menos 6 caracteres." e permanece em `/cadastro` |
| AC-4 | ✅ | Login com `alice@dev.local`/`DevPassword123!` → `http://localhost:5173/` |
| AC-5 | ✅ | Login com `alice@dev.local` + senha errada → `["E-mail ou senha incorretos."]` |
| AC-6 | ⬜ não verificado nesta sessão | Precisa de uma conta recém-cadastrada e ainda não confirmada — bloqueado pelo mesmo rate limit de e-mail (ADR-016) antes de eu conseguir criar uma fresca. Lógica implementada (`email_not_confirmed` → mensagem específica em `errors.ts`), não exercitada ponta a ponta |
| AC-7 | ✅ | Login → `reload()` → continua em `http://localhost:5173/`, sem cair pro login |
| AC-8 | ✅ | Deslogado em `/configuracoes` → `http://localhost:5173/entrar?redirect=%2Fconfiguracoes` → login → `http://localhost:5173/configuracoes` (achado e corrigido um bug real nesse caminho — `GuestRoute` brigava com o redirect do `SignInForm`, ver ADR-013) |
| AC-9 | ✅ | Autenticado, abre `/entrar` direto → `http://localhost:5173/` (revalidado depois do fix do ADR-013) |
| AC-10 | ✅ (por construção) | `resetPasswordForEmail` nunca ramifica no código por "e-mail existe" — sucesso (200) sempre mostra a mesma mensagem, e falha (ex: rate limit) também mostra a mesma mensagem pros dois casos. Observado diretamente: e-mail inexistente → `200`, "Se esse e-mail tiver uma conta...". Segunda chamada (e-mail existente) bateu rate limit (`429`) na mesma sessão de teste antes de confirmar o par de sucessos lado a lado — mas a ausência de qualquer ramificação por existência no código garante RN-4 independente disso |
| AC-11 | ⬜ não verificado | Depende do Site URL/Redirect URLs serem corrigidos no dashboard (`http://localhost:5173` / `http://localhost:5173/**` — ainda não ajustado na última checagem). Fluxo implementado (`UpdatePasswordPage` escuta `PASSWORD_RECOVERY`), não exercitado com link real |
| AC-12 | ✅ | `/redefinir-senha` sem contexto de recuperação → "Este link expirou ou já foi usado." + link "Pedir um novo link" |
| AC-13 | ✅ | Nome alterado pra "Alice Teste E2E" em `/configuracoes` → `reload()` → campo continua "Alice Teste E2E" |
| AC-14 | ✅ | Clique em "Sair" → `http://localhost:5173/entrar`; tentativa de voltar em `/` depois → redireciona pra `/entrar` de novo (sessão realmente encerrada, não só UI) |
| AC-15 | ✅ | Todas as mensagens observadas nos testes acima estão em português e nunca expõem texto cru do Supabase (`invalid_credentials`, `over_email_send_rate_limit` etc. sempre traduzidos antes de chegar na tela) |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados durante a verificação (bugs reais corrigidos)

1. **Redirect pós-login perdido** (ADR-013): depois de logar vindo de rota protegida, caía na Home em vez de voltar pra rota original. Causa: `GuestRoute` tinha redirect fixo pra Home, competindo com o redirect do `SignInForm`. Corrigido com `safeRedirectTarget()` compartilhado.
2. **Link inline sem contraste suficiente** (ADR-014): axe pegou `link-in-text-block` em "Não tem conta? Criar conta" / "Já tem conta? Entrar" — sublinhado só aparecia no hover. Trocado pra sublinhado sempre visível.
3. **CLI do shadcn escreveu em pasta errada** (ADR-015): `npx shadcn add input label` rodou sem erro mas gravou em `./@/components/ui/` (pasta literal `@`) em vez de `src/components/ui/`, e com paleta de tokens genérica incompatível com a nossa. Movido e reescrito à mão.

## Saída dos comandos

### Build

```
> slow-garage-web@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
✓ 2058 modules transformed.
...
✓ built in 338ms

PWA v1.3.0
mode      generateSW
precache  24 entries (883.40 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Testes

Sem suíte automatizada (fora do escopo aprovado). Verificação via scripts Playwright pontuais descartáveis (network + DOM + `localStorage`) e `npm run ui:check`, cobertos na tabela de ACs acima.

### Lint / tipos

```
$ npx tsc -b --noEmit
(sem saída — sem erro)

$ npm run lint
> eslint .
(sem saída — sem erro nem warning)
```

### `ui:check` — rotas de auth (320/390/768/1440/390-teclado)

```
  ok  320         /entrar
  ok  320         /cadastro
  ok  320         /confirme-seu-email
  ok  320         /recuperar-senha
  ok  320         /redefinir-senha
  ok  320         /configuracoes
  ... (mesmo resultado nos outros 4 viewports)

Nenhum problema automático.
```
0 violação de axe, 0 overflow, 0 erro de console em 30 combinações rota×viewport (6 rotas × 5 viewports), depois da correção do achado #2. Screenshot adicional de `/configuracoes` autenticado: 0 violação de axe.

## Pendências

- **AC-6, AC-11**: não verificados ponta a ponta nesta sessão — o primeiro por rate limit de e-mail (ADR-016), o segundo por Redirect URL do dashboard ainda não corrigido. Lógica implementada nos dois casos; pendente de confirmação manual depois que as duas causas externas forem resolvidas.
- **AC-1, AC-10**: verificados por equivalência de código/caminho parcial, não por par completo de observações diretas na mesma sessão (mesmo motivo — rate limit).
- Nenhuma pendência de código conhecida — as pendências acima são todas de ambiente/configuração externa, não de implementação.

## Para o humano testar na mão

1. Corrigir Site URL (`http://localhost:5173`) e Redirect URLs (`http://localhost:5173/**`) no dashboard de Auth, depois testar o fluxo completo de "esqueci minha senha" com um e-mail real, incluindo abrir o link recebido.
2. Esperar o limite de e-mail do Supabase resetar (ou configurar SMTP próprio), então cadastrar um e-mail 100% novo, confirmar que a tela de "confirme seu e-mail" aparece (AC-1), tentar logar antes de confirmar (AC-6, deve recusar com mensagem específica), e só depois confirmar de fato pelo link recebido.
3. Testar em celular real (não só emulação de viewport): teclado virtual aberto no formulário de login/cadastro, orientação retrato.
4. Conferir navegação por teclado (Tab) pela tela inteira de `/entrar` e `/cadastro`, incluindo os links "Esqueci minha senha" e "Criar conta" — validado programaticamente só no toggle de tema, não nesses links específicos.
