import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

/** Estado de navegação que leva um aviso pra próxima tela (ex.: `AdminRoute` tirando do painel quem perdeu o acesso). */
export type RouteNoticeState = { notice?: string };

/**
 * Faixa de aviso vinda de um redirecionamento — o motivo de a pessoa ter
 * sido levada pra cá. Vive no `location.state`, então some sozinha ao
 * navegar e não volta num reload. Fechar limpa o state da entrada atual.
 */
export function RouteNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const notice = (location.state as RouteNoticeState | null)?.notice;

  if (!notice) return null;

  return (
    // Harmonização 01: o aviso comum (`Alert`), com a margem da página.
    <Alert
      tone="warning"
      role="status"
      className="mx-(--page-gutter) mt-4 flex-row items-center py-1 pr-1"
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar aviso"
          onClick={() => navigate(location.pathname + location.search, { replace: true, state: null })}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      }
    >
      <p className="text-text-primary">{notice}</p>
    </Alert>
  );
}
