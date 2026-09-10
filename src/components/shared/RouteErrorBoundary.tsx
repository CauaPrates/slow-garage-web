import { AlertTriangle, Compass, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { isChunkLoadError } from "@/lib/chunk-error";

/**
 * `errorElement` da rota raiz (`src/app/router.tsx`) — substitui a tela
 * de erro padrão do React Router ("Unexpected Application Error!", ver
 * captura anexada ao pedido do usuário). Cobre os 3 casos reais:
 * rota inexistente (404 do próprio router), chunk de deploy antigo que
 * sumiu do Vercel (`isChunkLoadError` — `router.tsx` já tenta recarregar
 * sozinho uma vez antes de chegar aqui) e qualquer outro erro de render/
 * loader não tratado.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error(error);
  }

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorScreen
        icon={Compass}
        title="Página não encontrada"
        description="Essa rota não existe ou foi movida."
        detail={undefined}
      />
    );
  }

  if (isChunkLoadError(error)) {
    return (
      <ErrorScreen
        icon={RefreshCw}
        title="Uma nova versão do app foi publicada"
        description="Recarregue a página para continuar — isso costuma resolver sozinho."
        detail={undefined}
      />
    );
  }

  const message = error instanceof Error ? error.message : undefined;

  return (
    <ErrorScreen
      icon={AlertTriangle}
      title="Algo deu errado"
      description="Um erro inesperado aconteceu. Tente recarregar a página."
      detail={message}
    />
  );
}

type ErrorScreenProps = {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  detail: string | undefined;
};

function ErrorScreen({ icon: Icon, title, description, detail }: ErrorScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text-primary">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-error/40 bg-error/10 text-error">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-medium">{title}</p>
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      </div>
      {detail && (
        <p className="max-w-md break-words font-mono text-xs text-text-secondary">{detail}</p>
      )}
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:flex-row">
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        <Link to={ROUTES.home} className={buttonVariants({ variant: "outline" })}>
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
