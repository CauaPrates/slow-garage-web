import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAdminUser } from "../useAdmin";

type UserLinkProps = {
  userId: string | null;
  /** Texto quando `userId` é nulo (conta excluída, ou ação feita direto no banco). */
  fallback?: string;
  /** Link dentro de uma frase ("Por fulano · até…"): sem a altura mínima de alvo de toque, que esticaria a linha. */
  inline?: boolean;
};

/**
 * Link pro detalhe de um usuário quando só se tem o id — `admin_invites`
 * traz `invitee_id`/`invited_by`, sem nome. O nome sai de
 * `admin_get_user` (uma chamada por usuário distinto, cacheada pelo
 * TanStack Query). Aceitável porque convites e admins são poucos; ver
 * ADR-083 sobre o custo e a alternativa no backend.
 */
export function UserLink({ userId, fallback = "—", inline = false }: UserLinkProps) {
  const userQuery = useAdminUser(userId ?? "");

  if (!userId) return <span className="text-text-secondary">{fallback}</span>;

  const user = userQuery.data;
  const label = user ? user.display_name?.trim() || user.email : userQuery.isError ? "Usuário" : "…";

  return (
    <Link
      to={ROUTES.adminUser(userId)}
      className={cn(
        "break-all text-accent underline-offset-4",
        // Dentro de frase o link precisa de sublinhado fixo — só a cor não o distingue do texto (axe link-in-text-block).
        inline ? "underline" : "inline-flex min-h-11 items-center hover:underline",
      )}
    >
      {label}
    </Link>
  );
}
