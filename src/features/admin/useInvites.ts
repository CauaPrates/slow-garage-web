import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Database } from "@/types/database.types";
import {
  ADMIN_INVITES_KEY,
  ADMIN_KEY,
  IS_ADMIN_KEY,
  NOTIFICATIONS_KEY,
  adminKeys,
} from "./queryKeys";

export type AdminInviteRow = Database["public"]["Tables"]["admin_invites"]["Row"];
export type AdminInviteStatus = Database["public"]["Enums"]["admin_invite_status"];

/**
 * Expiração no banco é preguiçosa: um convite vencido pode continuar
 * `pending` até alguém tentar convidar a mesma pessoa de novo. A fonte da
 * verdade é `expires_at` (docs/API_CONTRACT.md, Fase 14) — `pending` com
 * `expires_at` no passado é exibido como expirado em toda tela.
 */
export function effectiveInviteStatus(
  invite: Pick<AdminInviteRow, "status" | "expires_at">,
): AdminInviteStatus {
  if (invite.status === "pending" && new Date(invite.expires_at).getTime() <= Date.now()) {
    return "expired";
  }
  return invite.status;
}

export const INVITE_STATUS_LABELS: Record<AdminInviteStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  declined: "Recusado",
  revoked: "Cancelado",
  expired: "Expirado",
};

/** Um convite específico — usado pela notificação `admin_invite_received` pra decidir se mostra Aceitar/Recusar. RLS: o convidado vê os próprios. */
export function useInvite(inviteId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.invite(inviteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("id, status, expires_at, invited_by, created_at")
        .eq("id", inviteId ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!inviteId,
  });
}

/**
 * "Meus convites": os pendentes ainda válidos que o usuário logado
 * recebeu. Filtra `invitee_id` explicitamente porque, para um admin, a
 * RLS de `admin_invites` devolve os convites de todo mundo.
 */
export function useMyPendingInvites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: adminKeys.myInvites(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("id, status, expires_at, invited_by, created_at")
        .eq("invitee_id", user?.id ?? "")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/** Responder muda role (aceite), notificações e o próprio convite — invalida os três. */
function useInvalidateAfterInviteChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_INVITES_KEY }),
      queryClient.invalidateQueries({ queryKey: IS_ADMIN_KEY }),
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
      queryClient.invalidateQueries({ queryKey: ADMIN_KEY }),
    ]);
}

export function useAcceptInvite() {
  const invalidate = useInvalidateAfterInviteChange();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc("accept_admin_invite", { p_invite_id: inviteId });
      if (error) throw error;
    },
    // onSettled, não onSuccess: um erro como `invite_expired` também
    // significa que o estado local do convite está velho.
    onSettled: () => invalidate(),
  });
}

export function useDeclineInvite() {
  const invalidate = useInvalidateAfterInviteChange();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc("decline_admin_invite", { p_invite_id: inviteId });
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}
