import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
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
    <div
      role="status"
      className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 py-1 pr-1 pl-4 sm:mx-6"
    >
      <p className="text-sm text-text-primary">{notice}</p>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fechar aviso"
        onClick={() => navigate(location.pathname + location.search, { replace: true, state: null })}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
