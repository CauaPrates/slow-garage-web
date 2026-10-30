import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { normalizeFunctionError } from "./errors";
import { ADMIN_INVITES_KEY, ADMIN_KEY, IS_ADMIN_KEY, adminKeys } from "./queryKeys";
import type { AdminInviteRow, AdminInviteStatus } from "./useInvites";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AuditAction = Database["public"]["Enums"]["audit_action"];

/** Tamanho de página do painel — o default do backend (`p_limit` aceita 1..200). */
export const ADMIN_PAGE_SIZE = 50;

export type EntityCounts = {
  vehicles: number;
  expenses: number;
  fuel_logs: number;
  maintenance_records: number;
  documents: number;
  issues: number;
  projects: number;
};

/** Forma do JSON de `admin_get_overview` (docs/API_CONTRACT.md, Fase 14) — o tipo gerado só diz `Json`. */
export type AdminOverview = {
  users: {
    total: number;
    admins: number;
    email_confirmed: number;
    new_7d: number;
    new_30d: number;
    active_7d: number;
    active_30d: number;
    with_vehicle: number;
  };
  invites_pending: number;
  entities: EntityCounts;
  generated_at: string;
};

/**
 * Linha de `admin_list_users`. O gerador de tipos marca toda coluna de
 * `returns table` como não-nula, mas nome, avatar, último login e
 * confirmação de e-mail podem vir `null` — corrigido aqui em vez de
 * confiar no tipo gerado.
 */
export type AdminUserListRow = Omit<
  Database["public"]["Functions"]["admin_list_users"]["Returns"][number],
  "display_name" | "avatar_url" | "last_sign_in_at" | "email_confirmed_at"
> & {
  display_name: string | null;
  avatar_url: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

export type AdminUserInvite = Pick<
  AdminInviteRow,
  "id" | "status" | "invited_by" | "expires_at" | "resolved_at" | "email_sent_at" | "created_at"
>;

export type AdminUserEvent = {
  id: number;
  occurred_at: string;
  action: AuditAction;
  actor_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
};

/** Forma do JSON de `admin_get_user`. Só metadados e contagens — nunca conteúdo do usuário. */
export type AdminUserDetail = {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  granted_by: string | null;
  granted_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  counts: EntityCounts;
  invites: AdminUserInvite[];
  recent_events: AdminUserEvent[];
};

/** Mesma correção de nulidade de `AdminUserListRow`: quem agiu/foi afetado pode não existir mais (`on delete set null`) ou ser o próprio banco. */
export type AuditLogRow = Omit<
  Database["public"]["Functions"]["admin_list_audit_logs"]["Returns"][number],
  "actor_id" | "actor_email" | "actor_name" | "target_user_id" | "target_email" | "target_name" | "metadata"
> & {
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  target_user_id: string | null;
  target_email: string | null;
  target_name: string | null;
  metadata: Record<string, unknown>;
};

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_overview");
      if (error) throw error;
      return data as unknown as AdminOverview;
    },
  });
}

export function useAdminSignupsByDay(days: number) {
  return useQuery({
    queryKey: adminKeys.signups(days),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_signups_by_day", { p_days: days });
      if (error) throw error;
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export type AdminUsersFilters = {
  search: string;
  role: AppRole | "all";
  page: number;
};

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const search = filters.search.trim();
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_search: search || undefined,
        p_role: filters.role === "all" ? undefined : filters.role,
        p_limit: ADMIN_PAGE_SIZE,
        p_offset: filters.page * ADMIN_PAGE_SIZE,
      });
      if (error) throw error;
      const rows = data as AdminUserListRow[];
      return { rows, totalCount: rows[0]?.total_count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user", { p_user_id: userId });
      if (error) throw error;
      return data as unknown as AdminUserDetail;
    },
    enabled: !!userId,
  });
}

export type InviteStatusFilter = AdminInviteStatus | "all";

/**
 * Admin vê todos os convites (RLS). "Pendente" e "Expirado" seguem
 * `expires_at`, não só a coluna `status` — a expiração no banco é
 * preguiçosa (ver `effectiveInviteStatus`).
 */
export function useAdminInvites(status: InviteStatusFilter) {
  return useQuery({
    queryKey: adminKeys.allInvites(status),
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase.from("admin_invites").select("*").order("created_at", { ascending: false });

      if (status === "pending") {
        query = query.eq("status", "pending").gt("expires_at", now);
      } else if (status === "expired") {
        query = query.or(`status.eq.expired,and(status.eq.pending,expires_at.lte.${now})`);
      } else if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export type AuditLogFilters = {
  action: AuditAction | "all";
  userId: string | null;
  page: number;
};

export function useAdminAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_audit_logs", {
        p_action: filters.action === "all" ? undefined : filters.action,
        p_user_id: filters.userId ?? undefined,
        p_limit: ADMIN_PAGE_SIZE,
        p_offset: filters.page * ADMIN_PAGE_SIZE,
      });
      if (error) throw error;
      const rows = data as unknown as AuditLogRow[];
      return { rows, totalCount: rows[0]?.total_count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });
}

/** Convite, role e log mudam juntos — toda mutação do painel invalida as três áreas. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_KEY }),
      queryClient.invalidateQueries({ queryKey: ADMIN_INVITES_KEY }),
    ]);
}

export type InviteToAdminResult = {
  invite: AdminInviteRow;
  email_sent: boolean;
  email_error?: string;
};

/**
 * Convidar passa pela Edge Function, não pela RPC: ela cria o convite
 * **e** manda o e-mail. `email_sent: false` não é erro — convite e
 * notificação in-app já existem; quem chama mostra o aviso.
 */
export function useInviteToAdmin() {
  const invalidate = useInvalidateAdmin();

  return useMutation({
    mutationFn: async (inviteeId: string) => {
      const { data, error } = await supabase.functions.invoke<InviteToAdminResult>("admin-invite", {
        body: { invitee_id: inviteeId },
      });
      if (error) throw await normalizeFunctionError(error);
      if (!data) throw new Error("Resposta vazia da função admin-invite.");
      return data;
    },
    onSettled: () => invalidate(),
  });
}

export function useRevokeInvite() {
  const invalidate = useInvalidateAdmin();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc("admin_revoke_invite", { p_invite_id: inviteId });
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

/** Pode ser o próprio usuário — por isso também rechecka `is_admin`, que tira quem se rebaixou do painel. */
export function useRevokeAdminRole() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAdmin();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_revoke_admin_role", { p_user_id: userId });
      if (error) throw error;
    },
    onSettled: () =>
      Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: IS_ADMIN_KEY })]),
  });
}
