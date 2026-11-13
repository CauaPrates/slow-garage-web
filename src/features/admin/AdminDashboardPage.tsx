import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryStat, SummaryStrip, type SummaryState } from "@/components/ui/summary-strip";
import { textLinkClassName } from "@/components/ui/text-link";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { formatCount, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { SignupsChart } from "./components/SignupsChart";
import { StatList, type Stat } from "./components/StatList";
import { useAdminOverview, useAdminSignupsByDay, type AdminOverview, type EntityCounts } from "./useAdmin";

const SIGNUP_PERIODS = [7, 30, 90] as const;

/** "2026-10-15" → "15/10" — o mesmo formato do eixo do `SignupsChart`. */
function formatDayMonth(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM", { locale: ptBR });
}

type AccountKey = Exclude<keyof AdminOverview["users"], "total" | "admins">;

/** Rótulos à vista também enquanto carrega (o valor é que pulsa). "Fizeram login" = `last_sign_in_at` no período; não há histórico diário. */
const ACCOUNT_STATS: { key: AccountKey; label: string }[] = [
  { key: "email_confirmed", label: "E-mails confirmados" },
  { key: "with_vehicle", label: "Com veículo" },
  { key: "new_7d", label: "Novos em 7 dias" },
  { key: "new_30d", label: "Novos em 30 dias" },
  { key: "active_7d", label: "Fizeram login em 7 dias" },
  { key: "active_30d", label: "Fizeram login em 30 dias" },
];

/** Veículos fica na faixa de cima. */
const ENTITY_STATS: { key: Exclude<keyof EntityCounts, "vehicles">; label: string }[] = [
  { key: "expenses", label: "Gastos" },
  { key: "fuel_logs", label: "Abastecimentos" },
  { key: "maintenance_records", label: "Manutenções" },
  { key: "documents", label: "Documentos" },
  { key: "issues", label: "Problemas" },
  { key: "projects", label: "Projetos" },
];

function accountStats(overview: AdminOverview | undefined): Stat[] {
  return ACCOUNT_STATS.map(({ key, label }) => ({ label, value: overview?.users[key] ?? 0 }));
}

function entityStats(overview: AdminOverview | undefined): Stat[] {
  return ENTITY_STATS.map(({ key, label }) => ({ label, value: overview?.entities[key] ?? 0 }));
}

/** Seis números por painel: 3 colunas com o painel na largura toda; 2 quando os dois painéis dividem a linha (`xl`), 3 de novo em tela larga. */
const PANEL_STAT_COLUMNS = "sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3";

/** Atalho da faixa: texto neutro sublinhado; margem negativa pro alvo de 44px não aumentar a célula. */
const STRIP_LINK_CLASSNAME = cn(textLinkClassName("xs"), "-my-2.5 -ml-1 self-start");

/**
 * Visão geral do painel: só contagens agregadas (`admin_get_overview`) e
 * cadastros por dia — nenhum conteúdo de usuário.
 *
 * Etapa 16: cabeçalho de gestão (título, escopo numa frase com a hora da
 * contagem, "Atualizar" como ação). Os quatro números de referência numa faixa
 * (`SummaryStrip`, com os atalhos de antes: Usuários → lista, Convites
 * pendentes → convites); o resto em dois painéis compactos com o escopo escrito
 * (contas; registros somados de todos os usuários). Valores no papel de
 * indicador (eram mono). Carregando = bloco pulsante, nunca zero; falha =
 * "Indisponível" na faixa e um aviso com nova tentativa; zero = "0". Uma falha
 * ao atualizar com números já na tela mantém os números e diz de quando são.
 */
export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(30);
  const overviewQuery = useAdminOverview();
  const signupsQuery = useAdminSignupsByDay(days);
  const overview = overviewQuery.data;
  const countsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const retryOverview = useRetryFocus(overviewQuery.dataUpdatedAt, countsRef);
  const retrySignups = useRetryFocus(signupsQuery.dataUpdatedAt, chartRef);

  const refreshing = overviewQuery.isFetching || signupsQuery.isFetching;

  function refresh() {
    // `aria-disabled`, não `disabled`: o foco fica no botão enquanto atualiza.
    if (refreshing) return;
    void overviewQuery.refetch();
    void signupsQuery.refetch();
  }

  const stripState: SummaryState = overview ? "ready" : overviewQuery.isError ? "error" : "loading";
  const signups = signupsQuery.data;
  const signupsTotal = signups?.reduce((sum, day) => sum + day.signups, 0) ?? 0;
  /*
   * Etapa 17: o período escrito sai da série na tela, não do seletor. Com
   * `keepPreviousData`, trocar 30 → 90 dias deixava "nos últimos 90 dias" sobre
   * as barras e a soma de 30 até a resposta chegar. Enquanto a série nova não
   * chega, o bloco fica `aria-busy` e esmaecido.
   */
  const shownDays = signups?.length ?? days;
  const shownRange = signups?.length ? `${formatDayMonth(signups[0].day)} a ${formatDayMonth(signups[signups.length - 1].day)}` : null;
  const switchingPeriod = signupsQuery.isPlaceholderData;

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="Visão geral"
        description={
          <>
            Contagens de todo o Slow Garage, sem o conteúdo das garagens.
            {overview && <> Atualizado às {formatTime(overview.generated_at)}.</>}
          </>
        }
        actions={
          <Button variant="outline" aria-disabled={refreshing || undefined} onClick={refresh}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "motion-safe:animate-spin")} aria-hidden="true" />
            {refreshing ? "Atualizando…" : "Atualizar"}
          </Button>
        }
      />

      <div ref={countsRef} tabIndex={-1} className="flex flex-col gap-(--page-gap) rounded-md outline-offset-4">
        <SummaryStrip
          label="Resumo do app"
          className="grid-cols-2 sm:grid-cols-4 max-sm:[&>*:nth-child(3)]:border-l-0 max-sm:[&>*:nth-child(n+3)]:border-t"
        >
          <SummaryStat
            label="Usuários"
            state={stripState}
            value={overview && formatCount(overview.users.total)}
            action={
              <Link to={ROUTES.adminUsers} className={STRIP_LINK_CLASSNAME}>
                Ver usuários
              </Link>
            }
          />
          <SummaryStat label="Administradores" state={stripState} value={overview && formatCount(overview.users.admins)} />
          <SummaryStat
            label="Convites pendentes"
            state={stripState}
            value={overview && formatCount(overview.invites_pending)}
            action={
              <Link to={ROUTES.adminInvites} className={STRIP_LINK_CLASSNAME}>
                Ver convites
              </Link>
            }
          />
          <SummaryStat label="Veículos" state={stripState} value={overview && formatCount(overview.entities.vehicles)} />
        </SummaryStrip>

        {overviewQuery.isError && (
          <InlineError onRetry={() => retryOverview(overviewQuery.refetch)} className="px-0 py-0">
            {overview
              ? `Não foi possível atualizar as contagens. Os números abaixo são de ${formatTime(overview.generated_at)}.`
              : "Não foi possível carregar as contagens do app."}
          </InlineError>
        )}

        {(overview || !overviewQuery.isError) && (
          <div className="grid gap-(--page-gap) xl:grid-cols-2 xl:items-start">
            <Panel
              title="Contas"
              description="Todos os usuários do app. Os períodos de 7 e 30 dias contam de agora para trás; login conta o último acesso de cada um."
            >
              <StatList stats={accountStats(overview)} loading={!overview} columnsClassName={PANEL_STAT_COLUMNS} />
            </Panel>
            <Panel title="Registros no app" description="Somados de todos os usuários — só a contagem, nunca o conteúdo.">
              <StatList stats={entityStats(overview)} loading={!overview} columnsClassName={PANEL_STAT_COLUMNS} />
            </Panel>
          </div>
        )}
      </div>

      <Panel
        title="Cadastros por dia"
        description="Contas novas por dia do calendário (horário de Brasília), com hoje incluído."
        action={
          <div className="-my-1 flex items-center gap-2">
            <Label htmlFor="admin-signups-days" className="sr-only">
              Período
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
        }
      >
        <div
          ref={chartRef}
          tabIndex={-1}
          aria-busy={switchingPeriod || undefined}
          className={cn(
            "flex flex-col gap-3 px-(--panel-pad-x) py-4 outline-offset-[-2px] transition-opacity duration-(--duration-fast)",
            switchingPeriod && "opacity-60",
          )}
        >
          {signupsQuery.isLoading && (
            <div aria-busy="true">
              <span className="sr-only">Carregando cadastros…</span>
              <Skeleton className="h-32" />
            </div>
          )}
          {signupsQuery.isError && (
            <InlineError onRetry={() => retrySignups(signupsQuery.refetch)} className="p-0">
              Não foi possível carregar os cadastros por dia.
            </InlineError>
          )}
          {signups && !signupsQuery.isError && (
            <>
              <p className="text-sm text-text-secondary" aria-live="polite">
                {signupsTotal === 0 ? (
                  `Nenhum cadastro nos últimos ${shownDays} dias${shownRange ? ` (${shownRange})` : ""}.`
                ) : (
                  <>
                    <span className="type-value text-sm text-text-primary">{formatCount(signupsTotal)}</span>{" "}
                    {signupsTotal === 1 ? "cadastro" : "cadastros"} nos últimos {shownDays} dias
                    {shownRange && ` (${shownRange})`}.
                  </>
                )}
              </p>
              <SignupsChart days={shownDays} data={signups} />
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
