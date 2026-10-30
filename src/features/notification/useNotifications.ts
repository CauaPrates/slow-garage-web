import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  ADMIN_INVITES_KEY,
  ADMIN_KEY,
  IS_ADMIN_KEY,
  NOTIFICATIONS_KEY,
  adminKeys,
} from "@/features/admin/queryKeys";
import type { Database } from "@/types/database.types";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

/** Campos de `notifications.data` por tipo (docs/API_CONTRACT.md, Fase 14) — todos opcionais porque `data` chega como JSON sem garantia de forma. */
export type NotificationData = {
  invite_id?: string;
  invited_by?: string;
  invitee_id?: string;
  expires_at?: string;
  granted_by?: string;
  revoked_by?: string;
};

export function notificationData(notification: Pick<NotificationRow, "data">): NotificationData {
  const data = notification.data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
  const pick = (key: keyof NotificationData) => {
    const value = (data as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  };
  return {
    invite_id: pick("invite_id"),
    invited_by: pick("invited_by"),
    invitee_id: pick("invitee_id"),
    expires_at: pick("expires_at"),
    granted_by: pick("granted_by"),
    revoked_by: pick("revoked_by"),
  };
}

const RECENT_LIMIT = 20;

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: adminKeys.notifications(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/** Contador do sino: conta no banco (`head: true`), não na lista — a lista só traz as 20 mais recentes. */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: adminKeys.unreadCount(user?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
}

/** `update` em `notifications` só aceita `read_at` — qualquer outro campo volta 403. */
export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
      if (error) throw error;
    },
    onSettled: () => invalidate(),
  });
}

/**
 * Tempo real: cada INSERT em `notifications` (a RLS do Realtime só entrega
 * as do próprio usuário) atualiza lista e contador. Os tipos de role
 * também rechecam `is_admin` — é o que tira do painel quem foi rebaixado
 * (`admin_role_revoked`) e mostra o menu pra quem virou admin
 * (`admin_role_granted`), sem sair e entrar de novo. O canal é removido
 * no unmount do shell, que acontece no logout (`ProtectedRoute`).
 */
export function useNotificationsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const type = (payload.new as Partial<NotificationRow>).type;
          void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
          if (type === "admin_role_granted" || type === "admin_role_revoked") {
            void queryClient.invalidateQueries({ queryKey: IS_ADMIN_KEY });
          }
          if (type?.startsWith("admin_invite_")) {
            void queryClient.invalidateQueries({ queryKey: ADMIN_INVITES_KEY });
            void queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
