import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/Page";
import { EmptyState, InlineError, NoResults } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { formatCount, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { RoleBadge } from "./components/AdminBadges";
import { Pagination } from "./components/Pagination";
import { ROLE_LABELS } from "./labels";
import { ADMIN_PAGE_SIZE, useAdminUsers, type AdminUserListRow, type AppRole } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [AppRole, string][];

function parseRole(value: string | null): AppRole | "all" {
  return value === "gearhead" || value === "gearhead_admin" ? value : "all";
}

/** Colunas a partir de `lg`: usuário · papel · cadastro · último login · e-mail · veículos. */
const USER_ROW_GRID =
  "lg:grid-cols-[minmax(0,1fr)_12rem_8.5rem_8.5rem_9rem_4.5rem] lg:items-center lg:gap-x-4";

function EmailConfirmed({ confirmedAt }: { confirmedAt: string | null }) {
  return confirmedAt ? (
    <span className="inline-flex items-center gap-1 text-text-primary">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
      Confirmado
    </span>
  ) : (
    <span className="text-text-secondary">Não confirmado</span>
  );
}

/** Metadado da linha: rótulo à vista abaixo de `lg` (uma linha cada); a partir de `lg` o cabeçalho da coluna diz o que é. */
function Meta({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex min-w-0 gap-2 text-sm lg:block", className)}>
      <span className="w-24 shrink-0 text-text-secondary lg:sr-only">{label}</span>
      <span className="min-w-0 text-text-primary tabular-nums">{children}</span>
    </p>
  );
}

/**
 * Uma conta. Nome (ou "Sem nome de exibição") e e-mail inteiros — o e-mail
 * quebra em qualquer ponto em vez de cortar — e o papel ao lado; abaixo de
 * `lg` os metadados descem um por linha. O link leva nome e e-mail no nome
 * acessível (o avatar é decorativo), então cada um é distinguível na lista.
 */
function UserRow({ user }: { user: AdminUserListRow }) {
  const name = user.display_name?.trim() || null;
  return (
    <li className={cn("grid grid-cols-1 gap-y-2 px-(--panel-pad-x) py-3", USER_ROW_GRID)}>
      {/* Nome e selo lado a lado enquanto cabem; sem espaço (e-mail ou nome longo em 320px), o selo desce. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 lg:contents">
      <Link
        to={ROUTES.adminUser(user.user_id)}
        className="group -my-1 flex min-h-control min-w-0 flex-[1_1_14rem] items-center gap-3 rounded-md py-1"
      >
        <UserAvatar avatarUrl={user.avatar_url} displayName={user.display_name} />
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "type-item-title underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-fast) group-hover:decoration-border-strong",
              name ? "text-text-primary" : "text-text-secondary",
            )}
          >
            {name ?? "Sem nome de exibição"}
          </span>
          <span className="text-xs wrap-anywhere text-text-secondary">{user.email}</span>
        </span>
      </Link>
      <div className="shrink-0 pt-2.5 lg:pt-0">
        <RoleBadge role={user.role} />
      </div>
      </div>
      <div className="grid gap-y-1 sm:grid-cols-2 sm:gap-x-6 lg:contents">
        <Meta label="Cadastro">{formatDateTime(user.created_at)}</Meta>
        <Meta label="Último login">
          {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : <span className="text-text-secondary">Nunca</span>}
        </Meta>
        <Meta label="E-mail">
          <EmailConfirmed confirmedAt={user.email_confirmed_at} />
        </Meta>
        <Meta label="Veículos" className="lg:text-right">
          <span className="type-value">{formatCount(user.vehicles_count)}</span>
        </Meta>
      </div>
    </li>
  );
}

/**
 * Lista de usuários (`admin_list_users`): metadados e contagem de veículos,
 * nunca o conteúdo deles. Busca (nome ou e-mail), papel e página moram na URL;
 * a ordem é a do banco (cadastro mais recente primeiro).
 *
 * Etapa 16: cabeçalho de gestão, a lista num painel com a contagem, filtros
 * por `FilterField` e linhas com colunas a partir de `lg` (era uma tabela
 * larga com e-mail cortado). Selo comum; veículos no papel de valor (era mono).
 * Carregando, falha (com nova tentativa), filtro sem resultado (com a
 * seleção escrita e "Limpar filtros"), página vazia e lista vazia são estados
 * distintos.
 */
export function AdminUsersPage() {
  const { params, page, setFilters, setPage } = useAdminListParams();
  const search = params.get("busca") ?? "";
  const role = parseRole(params.get("role"));
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput.trim());
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearch !== search) setFilters({ busca: debouncedSearch || null });
    // setFilters muda a cada render; só a busca digitada deve disparar isto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const usersQuery = useAdminUsers({ search, role, page });
  const retry = useRetryFocus(usersQuery.dataUpdatedAt, listRef);
  const rows = usersQuery.data?.rows ?? [];
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const hasFilters = search !== "" || role !== "all";
  const ready = usersQuery.data && !usersQuery.isError;

  const selection = [search && `busca “${search}”`, role !== "all" && `papel ${ROLE_LABELS[role]}`].filter(Boolean).join(" · ");

  function clearFilters() {
    setSearchInput("");
    setFilters({ busca: null, role: null });
  }

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="Usuários"
        description="Todas as contas do app: cadastro, papel e quantos veículos têm — nunca o conteúdo deles."
      />

      <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
        <PanelHeader
          title="Contas"
          titleId={titleId}
          description="Cadastro mais recente primeiro."
          action={
            <PanelCount>
              {ready &&
                rows.length > 0 &&
                `${formatCount(totalCount)} ${totalCount === 1 ? "conta" : "contas"}${hasFilters ? " nesta seleção" : ""}`}
            </PanelCount>
          }
        />

        <div className="grid grid-cols-1 gap-3 border-b border-border px-(--panel-pad-x) py-(--panel-pad-y) sm:grid-cols-[minmax(0,1fr)_14rem]">
          <FilterField id="admin-users-search" label="Buscar por nome ou e-mail">
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
          </FilterField>
          <FilterField id="admin-users-role" label="Papel">
            <Select
              id="admin-users-role"
              value={role}
              onChange={(event) => setFilters({ role: event.target.value === "all" ? null : event.target.value })}
            >
              <option value="all">Todos os papéis</option>
              {ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterField>
        </div>

        <div ref={listRef} tabIndex={-1} className="outline-offset-[-2px]">
          {usersQuery.isLoading && <SkeletonList label="Carregando usuários…" />}

          {usersQuery.isError && (
            <InlineError onRetry={() => retry(usersQuery.refetch)}>
              Não foi possível carregar os usuários. A busca e o filtro continuam como estão.
            </InlineError>
          )}

          {ready && rows.length === 0 &&
            (page > 0 ? (
              <NoResults
                message="Não há usuários nesta página."
                detail="A lista encolheu desde que o link foi aberto."
                onClear={() => setPage(0)}
                clearLabel="Voltar para a primeira página"
              />
            ) : hasFilters ? (
              <NoResults
                message="Nenhum usuário encontrado com esses filtros."
                detail={`Seleção atual: ${selection}.`}
                onClear={clearFilters}
              />
            ) : (
              <EmptyState icon={Users} title="Nenhuma conta cadastrada ainda." variant="inline" />
            ))}

          {ready && rows.length > 0 && (
            <>
              <ListColumns className={USER_ROW_GRID}>
                <span>Usuário</span>
                <span>Papel</span>
                <span>Cadastro</span>
                <span>Último login</span>
                <span>E-mail</span>
                <span className="text-right">Veículos</span>
              </ListColumns>
              <ul
                className="divide-y divide-border"
                aria-busy={(usersQuery.isFetching && usersQuery.isPlaceholderData) || undefined}
              >
                {rows.map((user) => (
                  <UserRow key={user.user_id} user={user} />
                ))}
              </ul>
            </>
          )}
        </div>

        {ready && (
          <Pagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={setPage}
            isFetching={usersQuery.isFetching}
            itemLabel={totalCount === 1 ? "conta" : "contas"}
          />
        )}
      </section>
    </div>
  );
}
