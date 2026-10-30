import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { SignupsChart } from "./components/SignupsChart";
import { StatList, type Stat } from "./components/StatList";
import { useAdminOverview, useAdminSignupsByDay, type AdminOverview } from "./useAdmin";

const SIGNUP_PERIODS = [7, 30, 90] as const;

function userStats(overview: AdminOverview): Stat[] {
  const { users } = overview;
  return [
    { label: "Usuários", value: users.total, href: ROUTES.adminUsers },
    { label: "Administradores", value: users.admins },
    { label: "E-mails confirmados", value: users.email_confirmed },
    { label: "Novos em 7 dias", value: users.new_7d },
    { label: "Novos em 30 dias", value: users.new_30d },
    // "Ativo" = fez login no período (`last_sign_in_at`); não há histórico diário.
    { label: "Fizeram login em 7 dias", value: users.active_7d },
    { label: "Fizeram login em 30 dias", value: users.active_30d },
    { label: "Com veículo", value: users.with_vehicle },
    { label: "Convites pendentes", value: overview.invites_pending, href: ROUTES.adminInvites },
  ];
}

function entityStats(overview: AdminOverview): Stat[] {
  const { entities } = overview;
  return [
    { label: "Veículos", value: entities.vehicles },
    { label: "Gastos", value: entities.expenses },
    { label: "Abastecimentos", value: entities.fuel_logs },
    { label: "Manutenções", value: entities.maintenance_records },
    { label: "Documentos", value: entities.documents },
    { label: "Problemas", value: entities.issues },
    { label: "Projetos", value: entities.projects },
  ];
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
      <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
      <p className="text-sm text-text-secondary">{message}</p>
      <Button variant="ghost" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}

/** Visão geral do painel: só contagens agregadas (`admin_get_overview`) e cadastros por dia — nenhum conteúdo de usuário. */
export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(30);
  const overviewQuery = useAdminOverview();
  const signupsQuery = useAdminSignupsByDay(days);
  const overview = overviewQuery.data;

  function refresh() {
    void overviewQuery.refetch();
    void signupsQuery.refetch();
  }

  const refreshing = overviewQuery.isFetching || signupsQuery.isFetching;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-medium text-text-primary">Visão geral</h1>
          {overview && (
            <p className="text-xs text-text-secondary">Atualizado às {formatTime(overview.generated_at)}</p>
          )}
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing} className="shrink-0">
          <RefreshCw className={cn("h-4 w-4", refreshing && "motion-safe:animate-spin")} aria-hidden="true" />
          {refreshing ? "Atualizando…" : "Atualizar"}
        </Button>
      </div>

      {overviewQuery.isLoading && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg border border-border bg-surface sm:h-20" />
          ))}
        </div>
      )}

      {overviewQuery.isError && (
        <ErrorBlock message="Não foi possível carregar a visão geral." onRetry={() => overviewQuery.refetch()} />
      )}

      {overview && (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="admin-users-heading">
            <h2 id="admin-users-heading" className="text-sm font-medium text-text-secondary">
              Usuários
            </h2>
            <StatList stats={userStats(overview)} />
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="admin-entities-heading">
            <h2 id="admin-entities-heading" className="text-sm font-medium text-text-secondary">
              Registros no app
            </h2>
            <StatList stats={entityStats(overview)} />
          </section>
        </>
      )}

      <section
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        aria-labelledby="admin-signups-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="admin-signups-heading" className="text-sm font-medium text-text-primary">
            Cadastros por dia
          </h2>
          <div className="flex flex-col gap-1">
            <Label htmlFor="admin-signups-days" className="sr-only">
              Período (últimos dias)
            </Label>
            <Select
              id="admin-signups-days"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="w-32"
            >
              {SIGNUP_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period} dias
                </option>
              ))}
            </Select>
          </div>
        </div>

        {signupsQuery.isLoading && <div className="h-40 animate-pulse rounded-md bg-bg" />}
        {signupsQuery.isError && (
          <ErrorBlock message="Não foi possível carregar os cadastros." onRetry={() => signupsQuery.refetch()} />
        )}
        {signupsQuery.data && <SignupsChart days={days} data={signupsQuery.data} />}
      </section>
    </div>
  );
}
