# Spec 001 — Autenticação e rotas protegidas

| | |
|---|---|
| **Status** | aprovada |
| **Tamanho** | G |
| **Criada em** | 2026-09-01 |
| **Depende de** | 000-foundation |

## 1. Problema

Hoje qualquer rota do app está aberta e não existe conceito de sessão — mas o backend já impõe RLS por `auth.uid()` em toda tabela de domínio (`vehicles`, `expenses` e todas as demais). Sem autenticação, nenhuma tela de dado real da Fase 2 em diante consegue funcionar: toda query volta vazia ou é recusada.

## 2. Resultado esperado

Uma pessoa consegue criar conta com e-mail e senha, confirmar o e-mail, entrar, ter a sessão lembrada entre visitas, recuperar acesso se esquecer a senha, editar o próprio nome de exibição, e sair — tudo em português, com erro claro em cada caso que pode dar errado. Rotas que dependem de usuário logado ficam protegidas: quem não está autenticado é redirecionado pro login e volta pra onde tentava ir depois de entrar.

## 3. Cenários

**Principal**
1. Usuário abre `/cadastro`, preenche e-mail e senha, envia.
2. App mostra a tela "confirme seu e-mail" (confirmação de e-mail está ativada no projeto) — nenhuma sessão ainda.
3. Usuário abre o e-mail, clica no link de confirmação.
4. App reconhece a confirmação e leva pro login (ou já autentica direto, a depender do fluxo do Supabase — ver Seção 11).
5. Usuário entra em `/entrar` com e-mail e senha.
6. Sessão criada e persistida; usuário vai pra Home (ou pra rota que tentava acessar antes de cair no login).
7. Usuário edita o nome de exibição em `/configuracoes`.
8. Usuário clica em sair; sessão encerrada, volta pro login.

**Alternativos**
- Recuperação de senha: em `/entrar`, "esqueci minha senha" → `/recuperar-senha` → informa e-mail → recebe link → `/redefinir-senha` → define nova senha → autenticado, vai pra Home.
- Usuário não autenticado tenta acessar uma rota protegida (ex: `/v/algum-id`) direto pela URL → redirecionado pra `/entrar` e, depois de logar, volta exatamente pra essa URL.
- Usuário já autenticado abre `/entrar` ou `/cadastro` direto → redirecionado pra Home.

## 4. Escopo

**Dentro**
- Cadastro (e-mail + senha)
- Tela de confirmação de e-mail pendente
- Login (e-mail + senha)
- Logout
- Recuperação de senha (solicitar + redefinir)
- Sessão persistida entre visitas (comportamento padrão do `supabase-js`)
- Rotas protegidas com redirecionamento de volta pra rota original
- Tela de Configurações: nome de exibição editável, e-mail (leitura), botão sair
- Tradução de erro de autenticação pro português

**Fora — explicitamente não entra agora**
- Login social (Google/Apple etc.) — fora do stack aprovado
- Reenviar e-mail de confirmação — decisão do clarify; mensagem estática por ora, sem essa ação
- Upload de foto de perfil — `avatar_url` existe na tabela, mas não há convenção de path de upload definida (não é por veículo); decisão do clarify de deixar fora
- Apagar conta — o contrato não define esse fluxo nesta fase
- Autenticação de dois fatores (MFA)
- "Lembrar de mim" como opção — sessão sempre persiste, sem toggle
- Sincronizar `profiles.theme` — tema continua 100% local (reafirma decisão da Fase 0)

## 5. Critérios de aceite

- **AC-1**: Dado um e-mail não cadastrado e uma senha com 6+ caracteres, quando o usuário envia o cadastro, então a conta é criada e a tela "confirme seu e-mail" aparece — nenhuma sessão ativa.
- **AC-2 (negativo)**: Dado um e-mail já cadastrado, quando o usuário tenta se cadastrar de novo com ele, então o sistema recusa com "Este e-mail já está cadastrado" (ou equivalente), sem duplicar.
- **AC-3 (negativo)**: Dado uma senha com menos de 6 caracteres, quando o usuário tenta enviar o cadastro, então o formulário recusa antes de chamar o servidor, indicando o campo.
- **AC-4**: Dado um e-mail confirmado e credenciais corretas, quando o usuário envia o login, então uma sessão é criada e ele vai pra Home.
- **AC-5 (negativo)**: Dado credenciais erradas (e-mail ou senha), quando o usuário tenta logar, então o sistema recusa com "E-mail ou senha incorretos" — sem revelar qual dos dois está errado.
- **AC-6 (negativo)**: Dado um e-mail ainda não confirmado, quando o usuário tenta logar, então o sistema recusa com mensagem clara pedindo pra confirmar o e-mail antes.
- **AC-7**: Dado uma sessão ativa, quando o usuário fecha e reabre o navegador na mesma máquina, então continua logado.
- **AC-8**: Dado um usuário não autenticado, quando acessa uma URL de rota protegida direto, então é redirecionado pra `/entrar` e, depois de logar com sucesso, volta exatamente pra essa URL.
- **AC-9**: Dado um usuário autenticado, quando acessa `/entrar` ou `/cadastro` direto, então é redirecionado pra Home sem ver o formulário.
- **AC-10**: Dado um e-mail cadastrado ou não, quando o usuário pede recuperação de senha em `/recuperar-senha`, então recebe a mesma instrução de checar o e-mail em ambos os casos.
- **AC-11**: Dado um link de redefinição válido, quando o usuário define nova senha em `/redefinir-senha`, então a senha é trocada, sessão criada, e ele vai pra Home.
- **AC-12 (negativo)**: Dado um link de redefinição expirado ou já usado, quando o usuário chega em `/redefinir-senha`, então vê erro claro com opção de pedir um novo link.
- **AC-13**: Dado um usuário autenticado, quando muda o nome de exibição em `/configuracoes` e salva, então o novo nome persiste e reflete na tela.
- **AC-14**: Dado um usuário autenticado, quando clica em sair, então a sessão encerra e ele vai pra `/entrar`.
- **AC-15**: Todo erro desta fase (credencial errada, e-mail duplicado, e-mail não confirmado, rate limit, falha de rede, link expirado) aparece em português compreensível — nunca a mensagem crua do Supabase.

## 6. Regras de negócio

- **RN-1**: Ninguém cria a própria linha em `profiles` manualmente — nasce sozinha no signup (trigger do backend). O frontend nunca faz `insert` em `profiles`.
- **RN-2**: `profiles.theme` não é lido nem escrito nesta fase.
- **RN-3**: A energia visual "hero" (Permanent Marker) aparece em `/entrar` e `/cadastro` — dois dos quatro pontos combinados na Fase 0. As demais telas desta fase usam a tipografia de corpo.
- **RN-4**: Mensagem de recuperação de senha é idêntica exista ou não o e-mail informado.
- **RN-5**: Erro de login por credencial errada nunca distingue "e-mail não existe" de "senha errada".

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| E-mail | Digitado no cadastro/login | Sim | Gerenciado pelo Supabase Auth (`auth.users`), não por tabela de app |
| Senha | Digitada no cadastro/login/redefinição | Sim | Nunca em texto plano fora do campo do formulário; nunca logada |
| Nome de exibição | `profiles.display_name` | Não | Editável em Configurações |
| Sessão (token) | Gerenciada pelo `supabase-js` | — | Persistida em `localStorage` pelo próprio client |

## 8. Estados e transições

Sessão do usuário:
- `deslogado` → (cadastro bem-sucedido) → `aguardando confirmação`
- `aguardando confirmação` → (clica no link do e-mail) → `deslogado` (confirmado, precisa logar) — comportamento exato depende do fluxo do Supabase, ver Seção 11
- `deslogado` → (login bem-sucedido) → `autenticado`
- `deslogado` → (redefinição de senha concluída) → `autenticado`
- `autenticado` → (logout) → `deslogado`
- Qualquer estado → (sessão expira/token inválido) → `deslogado`

Nenhuma outra transição é válida — não existe "autenticado" sem confirmar e-mail primeiro.

## 9. Erros e casos de borda

- Cadastro com e-mail já existente → AC-2.
- Senha curta demais → AC-3 (cliente); erro do servidor também traduzido se passar disso.
- Login com e-mail não confirmado → AC-6.
- Login com credencial errada → AC-5.
- Muitas tentativas seguidas (rate limit do Supabase) → "Muitas tentativas, aguarde um pouco e tente de novo".
- Sem conexão ao enviar formulário → erro de conexão, dados digitados não se perdem.
- Link de redefinição expirado/usado → AC-12.
- Usuário autenticado tenta abrir `/entrar` ou `/cadastro` → AC-9.
- Usuário não autenticado tenta abrir rota protegida → AC-8.
- Token de sessão inválido/expirado durante o uso → próxima chamada falha, usuário volta pro login com mensagem de sessão expirada.

## 10. Requisitos não-funcionais

- Formulários utilizáveis em 320px/390px, inclusive com teclado virtual aberto.
- Navegação por teclado completa, foco visível, label real em todo input.
- Erro de formulário anunciado via `aria-live`, não só por cor.
- Nenhuma senha aparece em log de console nem em erro exibido na tela.
- `docs/API_CONTRACT.md` é a referência pra `profiles`; nenhuma outra tabela é tocada nesta fase.

## 11. Dependências e riscos

- **Depende de**: Site URL e Redirect URLs corretos no dashboard de Auth. Hoje estão errados (Site URL em `:3000`, Redirect URLs vazio) — não bloqueia escrever spec/plano, mas bloqueia o teste de ponta a ponta de confirmação de e-mail e redefinição de senha até alguém com acesso ajustar para `http://localhost:5173` / `http://localhost:5173/**`.
- **Risco**: o comportamento exato do link de confirmação de e-mail (autentica direto ou só marca confirmado) depende de configuração do Supabase que não vejo de fora. O plano cobre os dois casos; a verificação confirma qual é o real.
- **Risco**: tamanho mínimo de senha do servidor pode divergir do zod do cliente se a configuração do dashboard mudar depois — mitigação: erro do servidor sempre traduzido, mesmo com validação de 6 caracteres no cliente.

## 12. Perguntas abertas

Nenhuma pergunta pendente.
