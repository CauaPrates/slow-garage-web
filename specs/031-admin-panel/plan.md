# Plano 031 — Painel admin, convites e notificações

## Arquitetura

- `src/features/admin/queryKeys.ts`: todas as keys da fase. Prefixos
  `is-admin`, `notifications`, `admin-invites` e `admin`, um por área de
  invalidação. Arquivo único porque notificação, convite e painel se
  invalidam entre si (evita import circular).
- `src/features/admin/errors.ts`: `translateAdminError` (mensagem por
  `hint`, com fallback em `translatePostgresError`), `isNotAdminError` e
  `normalizeFunctionError` (lê `{ message, code, hint }` da `Response`
  dentro do `FunctionsHttpError`).
- `src/app/providers.tsx`: `QueryCache`/`MutationCache` com `onError`.
  Qualquer `not_admin` marca `is_admin = false` no cache. Um lugar só, em
  vez de cada hook do painel.
- `src/features/admin/AdminLayout.tsx`: guard e abas do painel. Quando
  `is_admin` vira `false`, navega para `/` com aviso em `location.state`,
  exibido por `RouteNotice` no `AppShell`.
- `src/features/notification/useNotifications.ts`: lista, contador
  (`head: true`), marcar e apagar, e o canal Realtime (INSERT), que invalida
  notificações, `is_admin` (tipos de role) e convites/painel (tipos de
  convite).
- Telas: `AdminDashboardPage`, `AdminUsersPage`, `AdminUserDetailPage`,
  `AdminInvitesPage`, `AdminAuditPage` e `MyInvitesPage`.
- Header: `HeaderNotificationsMenu`. Menu: item no `Sidebar` e no
  `HeaderUserMenu`, que é o caminho no mobile.
- Filtros e página das listas do painel ficam na URL
  (`useAdminListParams`), para "voltar" do detalhe manter a lista.

## Alternativas descartadas

- **`is_admin` com `staleTime` longo.** O contrato pede recheck; um admin
  rebaixado só perderia acesso quando o cache vencesse.
- **Tratar 403 em cada hook do painel.** Seriam cinco lugares para esquecer
  um. O handler global do `QueryClient` cobre query e mutation.
- **Ícone `Bell` nas notificações.** O sino já é dos alertas de manutenção
  (`HeaderAlertsMenu`): seriam dois sinos iguais lado a lado. Ficou `Inbox`
  (ADR-083).
- **Nomes dos convites via `admin_list_users` (limit 200) como dicionário.**
  Quebra acima de 200 usuários e acopla duas telas. Ficou `admin_get_user`
  por id distinto, com cache (ADR-083).
- **Total de cadastros no período somado no cliente.** Proibição nº 1 do
  CONTRIBUTING. O gráfico usa o máximo só para a escala.

## Riscos

- Realtime depende de `notifications` estar na publicação
  `supabase_realtime` (a migration do backend adiciona). Mitigação: o
  recheck no foco e na montagem continua valendo.
- `admin_list_users`/`admin_list_audit_logs`: o tipo gerado marca colunas
  como não-nulas. Tipos locais em `useAdmin.ts` corrigem a nulidade.

## Cobertura AC → verificação

AC-1, 2, 4, 5, 6, 7, 8, 9 → roteiro com alice/bob no backend local
(`verification.md`). AC-3 → duas abas. AC-10 → `npm run build`/`lint`.
AC-11 → backend sem SMTP devolve `email_sent: false`. AC-12 → `errors.ts` e
AC-6.
