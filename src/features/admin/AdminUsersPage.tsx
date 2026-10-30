import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCount, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { RoleBadge } from "./components/AdminBadges";
import { Pagination } from "./components/Pagination";
import { ROLE_LABELS } from "./labels";
import { ADMIN_PAGE_SIZE, useAdminUsers, type AdminUserListRow, type AppRole } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [AppRole, string][];

function parseRole(value: string | null): AppRole | "all" {
  return value === "gearhead" || value === "gearhead_admin" ? value : "all";
}

function EmailConfirmed({ confirmedAt }: { confirmedAt: string | null }) {
  return confirmedAt ? (
    <span className="inline-flex items-center gap-1 text-success">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      Confirmado
    </span>
  ) : (
    <span className="text-text-secondary">Não confirmado</span>
  );
}

function UserName({ user }: { user: AdminUserListRow }) {
  return (
    <Link
      to={ROUTES.adminUser(user.user_id)}
      className="flex min-h-11 min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <UserAvatar avatarUrl={user.avatar_url} displayName={user.display_name} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-text-primary hover:text-accent">
          {user.display_name?.trim() || "Sem nome de exibição"}
        </span>
        <span className="truncate text-xs text-text-secondary">{user.email}</span>
      </span>
    </Link>
  );
}

/** Lista de usuários (`admin_list_users`): metadados e contagem de veículos, nunca o conteúdo deles. */
export function AdminUsersPage() {
  const { params, page, setFilters, setPage } = useAdminListParams();
  const search = params.get("busca") ?? "";
  const role = parseRole(params.get("role"));
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput.trim());

  useEffect(() => {
    if (debouncedSearch !== search) setFilters({ busca: debouncedSearch || null });
    // setFilters muda a cada render; só a busca digitada deve disparar isto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const usersQuery = useAdminUsers({ search, role, page });
  const rows = usersQuery.data?.rows ?? [];
  const hasFilters = search !== "" || role !== "all";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-text-primary">Usuários</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="admin-users-search">Buscar por nome ou e-mail</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              id="admin-users-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-60">
          <Label htmlFor="admin-users-role">Role</Label>
          <Select
            id="admin-users-role"
            value={role}
            onChange={(event) => setFilters({ role: event.target.value === "all" ? null : event.target.value })}
          >
            <option value="all">Todas</option>
            {ROLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {usersQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {usersQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os usuários.</p>
          <Button variant="ghost" onClick={() => usersQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {usersQuery.data && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">
            {page > 0 ? "Não há usuários nesta página." : "Nenhum usuário encontrado com esses filtros."}
          </p>
          {page > 0 ? (
            <Button variant="ghost" onClick={() => setPage(0)}>
              Voltar para a primeira página
            </Button>
          ) : (
            hasFilters && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput("");
                  setFilters({ busca: null, role: null });
                }}
              >
                Limpar filtros
              </Button>
            )
          )}
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* Mobile: cartões — tabela densa não cabe em 320px (README, princípio 6). */}
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((user) => (
              <li key={user.user_id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <UserName user={user} />
                  <RoleBadge role={user.role} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-text-secondary">Cadastro</dt>
                  <dd className="text-text-primary">{formatDateTime(user.created_at)}</dd>
                  <dt className="text-text-secondary">Último login</dt>
                  <dd className="text-text-primary">
                    {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Nunca"}
                  </dd>
                  <dt className="text-text-secondary">E-mail</dt>
                  <dd>
                    <EmailConfirmed confirmedAt={user.email_confirmed_at} />
                  </dd>
                  <dt className="text-text-secondary">Veículos</dt>
                  <dd className="font-mono text-text-primary">{formatCount(user.vehicles_count)}</dd>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs text-text-secondary">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Usuário</th>
                  <th scope="col" className="px-3 py-2 font-medium">Role</th>
                  <th scope="col" className="px-3 py-2 font-medium">Cadastro</th>
                  <th scope="col" className="px-3 py-2 font-medium">Último login</th>
                  <th scope="col" className="px-3 py-2 font-medium">E-mail</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Veículos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((user) => (
                  <tr key={user.user_id}>
                    <td className="max-w-72 px-3 py-1">
                      <UserName user={user} />
                    </td>
                    <td className="px-3 py-2">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-text-secondary">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-text-secondary">
                      {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Nunca"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <EmailConfirmed confirmedAt={user.email_confirmed_at} />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary">
                      {formatCount(user.vehicles_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {usersQuery.data && (
        <Pagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          totalCount={usersQuery.data.totalCount}
          onPageChange={setPage}
          isFetching={usersQuery.isFetching}
        />
      )}
    </div>
  );
}
