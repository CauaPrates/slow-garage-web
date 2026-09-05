import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { IssueListItem } from "./IssueListItem";
import { OPEN_ISSUE_STATUSES } from "./schemas";
import { useIssues } from "./useIssues";

export function IssuesPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const issuesQuery = useIssues(vehicleId ?? "");

  if (vehicleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os problemas.</p>
        <Button variant="ghost" onClick={() => refetchVehicle()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  const issues = issuesQuery.data ?? [];
  const openIssues = issues.filter((i) => OPEN_ISSUE_STATUSES.includes(i.status));
  const resolvedIssues = issues.filter((i) => !OPEN_ISSUE_STATUSES.includes(i.status));

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb items={[{ label: "Problemas" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-medium text-text-primary">Problemas</h1>
        <Button onClick={() => setCreateOpen(true)}>Relatar problema</Button>
      </div>

      {issuesQuery.isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {issuesQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os problemas.</p>
          <Button variant="ghost" onClick={() => issuesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!issuesQuery.isLoading && !issuesQuery.isError && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Abertos</h2>
            {openIssues.length === 0 ? (
              <p className="text-sm text-text-secondary">Nenhum problema aberto.</p>
            ) : (
              openIssues.map((issue) => (
                <IssueListItem key={issue.id} vehicleId={vehicle.id} issue={issue} />
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Resolvidos</h2>
            {resolvedIssues.length === 0 ? (
              <p className="text-sm text-text-secondary">Nenhum problema resolvido ainda.</p>
            ) : (
              resolvedIssues.map((issue) => (
                <IssueListItem key={issue.id} vehicleId={vehicle.id} issue={issue} />
              ))
            )}
          </section>
        </>
      )}

      <CreateIssueDialog vehicleId={vehicle.id} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
