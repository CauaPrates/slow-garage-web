# Spec 031 — Painel admin, convites de admin e notificações

| | |
|---|---|
| **Status** | implementada e verificada (ver verification.md) |
| **Tamanho** | G — contrato novo do backend, mudança de acesso, toca header, navegação e rotas |
| **Criada em** | 2026-10-29 |
| **Depende de** | Backend Fase 14 (`slow-garage`, `specs/014-admin-panel`), `docs/API_CONTRACT.md` → "Fase 14" |

A demanda chegou já especificada pelo dono do produto (regras, contrato,
mensagens e critérios de aceite). Esta spec registra essa demanda no formato
do repositório; o que é decisão de implementação está no `plan.md` e no
ADR-083.

## 1. Problema

O backend ganhou roles (Gearhead / Administrador Gearhead), convites para
virar admin, notificações in-app e log de auditoria. Sem o front, ninguém
consegue convidar, aceitar convite, ver o painel nem receber notificação.

## 2. Resultado esperado

Todo usuário logado vê suas notificações em tempo real e responde a
convites. Admins têm um painel com visão geral, usuários, convites e log,
vendo metadados e contagens, nunca o conteúdo dos outros usuários.

## 3. Cenários

1. Alice (admin) abre Bob no painel e convida. Bob, logado em outra aba, vê
   o contador de notificações subir sem recarregar, clica em Aceitar e passa
   a ver "Painel admin" no menu, sem sair e entrar.
2. O convite de Bob expira (7 dias) ou Alice cancela. A notificação continua
   lá, mas sem Aceitar/Recusar.
3. Alice tenta remover a si mesma sendo a única admin: o banco recusa e a
   tela mostra "Não é possível remover o último administrador."
4. Bob é rebaixado enquanto está no painel em outro dispositivo: na próxima
   ação (403) ou quando chega a notificação `admin_role_revoked`, ele sai do
   painel com um aviso.

## 4. Escopo

**Entra:** notificações no header (contador, 20 recentes, marcar lida, marcar
todas, apagar, tempo real, ação por `type`); responder convite; tela "Meus
convites"; painel `/admin` com visão geral, usuários, detalhe, convites e
log; guard por `is_admin()`; mensagem de erro por `hint`.

**Não entra:** endpoints, tabelas ou Edge Functions novas; ler `auth.users`
fora das RPCs admin; "reenviar e-mail" de convite; push notification.

## 5. Critérios de aceite

- **AC-1** Usuário gearhead não vê "Painel admin" na sidebar nem no menu do
  usuário; abrir `/admin` pela URL leva para a garagem.
- **AC-2** Admin vê visão geral, usuários (busca com debounce, filtro por
  role, paginação por `total_count`), detalhe, convites e log.
- **AC-3** Quando um admin convida um gearhead, o convidado recebe a
  notificação em tempo real (contador e lista), sem recarregar.
- **AC-4** O convidado aceita pela notificação e passa a ver o menu e o
  painel sem sair e entrar.
- **AC-5** Convite cancelado ou vencido (inclusive `pending` com
  `expires_at` no passado) não mostra Aceitar/Recusar.
- **AC-6** Remover o único admin mostra "Não é possível remover o último
  administrador." e não muda nada.
- **AC-7** Admin rebaixado em outra aba/dispositivo sai do painel na próxima
  ação (403 `not_admin`) ou ao chegar `admin_role_revoked`, com o aviso
  "Você não tem mais acesso ao painel."
- **AC-8** O contador bate com as não lidas do banco; "Marcar todas como
  lidas" zera o contador.
- **AC-9** Nenhuma tela do painel exibe veículos, gastos ou fotos de outro
  usuário, só contagens.
- **AC-10** `npm run build` (inclui `tsc -b`) e `npm run lint` passam.
- **AC-11** Convidar com `email_sent: false` mostra aviso ("convite criado,
  mas o e-mail não saiu") com `email_error`, não erro.
- **AC-12** Erro das RPCs e da Edge Function aparece pela mensagem do
  `hint`, nunca pelo `message` do servidor.

## 6. Regras de negócio

- Toda segurança está no banco; esconder menu ou rota é só UX.
- `is_admin()` é rechecado ao entrar no painel e não fica em cache longo.
- Convite: 7 dias, só para quem tem conta, um pendente por pessoa; o aceite
  é sempre logado, pela notificação ou por "Meus convites".
- Pendente vencido é "Expirado" na UI (expiração preguiçosa no banco).

## 7. Dados

Todos do contrato: `notifications`, `admin_invites`, RPCs `is_admin`,
`accept_admin_invite`/`decline_admin_invite`, `admin_*`, Edge Function
`admin-invite`. Nenhum dado novo nasce no front.

## 9. Erros e casos de borda

Mensagens por `hint` conforme a demanda. Edge Function sem login → 401 →
"Faça login para continuar." Página fora do intervalo → estado vazio com
"Voltar para a primeira página".

## 12. Perguntas abertas

Nenhuma bloqueante.
