/**
 * Query keys da Fase 031 (painel admin, convites, notificações), num
 * lugar só — notificação, convite e painel invalidam uns aos outros, e
 * espalhar as keys pelos hooks criava import circular entre eles.
 * Cada prefixo é a raiz de invalidação da sua área.
 */
export const IS_ADMIN_KEY = ["is-admin"] as const;
export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const ADMIN_INVITES_KEY = ["admin-invites"] as const;
export const ADMIN_KEY = ["admin"] as const;

export const adminKeys = {
  isAdmin: (userId: string | undefined) => [...IS_ADMIN_KEY, userId] as const,
  notifications: (userId: string | undefined) => [...NOTIFICATIONS_KEY, userId, "list"] as const,
  unreadCount: (userId: string | undefined) => [...NOTIFICATIONS_KEY, userId, "unread-count"] as const,
  invite: (inviteId: string | undefined) => [...ADMIN_INVITES_KEY, "by-id", inviteId] as const,
  myInvites: (userId: string | undefined) => [...ADMIN_INVITES_KEY, "mine", userId] as const,
  allInvites: (status: string) => [...ADMIN_INVITES_KEY, "all", status] as const,
  overview: () => [...ADMIN_KEY, "overview"] as const,
  signups: (days: number) => [...ADMIN_KEY, "signups", days] as const,
  users: (filters: object) => [...ADMIN_KEY, "users", filters] as const,
  user: (userId: string) => [...ADMIN_KEY, "user", userId] as const,
  auditLogs: (filters: object) => [...ADMIN_KEY, "audit-logs", filters] as const,
} as const;
