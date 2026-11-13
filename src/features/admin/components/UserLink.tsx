import { Link } from "react-router-dom";
import { textLinkClassName } from "@/components/ui/text-link";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAdminUser } from "../useAdmin";

/**
 * Nome de um usuário quando só se tem o id: nome de exibição, senão o
 * e-mail. `null` enquanto carrega. Mesma consulta (e cache) do `UserLink`.
 */
export function useUserLabel(userId: string | null): string | null {
  const userQuery = useAdminUser(userId ?? "");
  const user = userQuery.data;
  if (!userId) return null;
  if (user) return user.display_name?.trim() || user.email;
  return userQuery.isError ? "Usuário" : null;
}

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
 *
 * Etapa 16: o link em texto comum (`textLinkClassName`: texto neutro
 * sublinhado, alvo de 44px, margem negativa pra não aumentar a linha); dentro
 * de frase, o mesmo sublinhado e o mesmo alvo sem mudar a altura da linha.
 * E-mail longo quebra em qualquer ponto em vez de empurrar a linha.
 */
export function UserLink({ userId, fallback = "—", inline = false }: UserLinkProps) {
  const label = useUserLabel(userId);

  if (!userId) return <span className="text-text-secondary">{fallback}</span>;

  return (
    <Link
      to={ROUTES.adminUser(userId)}
      className={cn(
        "wrap-anywhere",
        inline
          ? // Alvo de 44px dentro da frase: `inline-block` com 14px de respiro em cima e embaixo, devolvidos por margem
            // negativa — a linha de texto não cresce. Nome curto ganha largura mínima de 44px.
            "-my-[14px] inline-block min-w-11 py-[14px] font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-text-primary"
          : cn(textLinkClassName("sm"), "-my-2.5 -ml-1 text-left"),
      )}
    >
      {label ?? (
        <>
          <span aria-hidden="true">…</span>
          <span className="sr-only">Carregando nome do usuário</span>
        </>
      )}
    </Link>
  );
}
