import { useRef, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/ui/feedback";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatCount, todayDateOnly } from "@/lib/format";
import { OBLIGATION_ROW_GRID, ObligationListItem } from "./ObligationListItem";
import { CreateObligationDialog } from "./CreateObligationDialog";
import { EditObligationDialog } from "./EditObligationDialog";
import { DeleteObligationDialog } from "./DeleteObligationDialog";
import { MarkObligationPaidDialog } from "./MarkObligationPaidDialog";
import { findAlert, obligationDateLabel, obligationStatus, type RecordStatus } from "./documentPresentation";
import { restoreFocus } from "./focus";
import { TabIntro, type AlertsState } from "./tabParts";
import { useObligations, type ObligationRow } from "./useObligations";

const PENDING_TITLE_ID = "obligations-pending-title";
const PAID_TITLE_ID = "obligations-paid-title";

type Row = { obligation: ObligationRow; status: RecordStatus | null; dateLabel: string; hasAlert: boolean };

type Handlers = {
  onMarkPaid: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
  onEdit: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
  onDelete: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
};

function ObligationGroup({
  titleId,
  title,
  rows,
  summary,
  emptyText,
  handlers,
}: {
  titleId: string;
  title: string;
  rows: Row[];
  summary: string;
  emptyText: string;
  handlers: Handlers;
}) {
  return (
    <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
      <PanelHeader title={title} titleId={titleId} action={<PanelCount>{summary}</PanelCount>} />
      {rows.length === 0 ? (
        <p className="p-(--panel-pad-x) text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <>
          <ListColumns className={OBLIGATION_ROW_GRID}>
            <span>Obrigação</span>
            <span>Situação</span>
            <span className="text-right">Valor</span>
            <span />
          </ListColumns>
          <ul className="divide-y divide-border">
            {rows.map(({ obligation, status, dateLabel }) => (
              <ObligationListItem
                key={obligation.id}
                obligation={obligation}
                status={status}
                dateLabel={dateLabel}
                {...handlers}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

/**
 * Etapa 11, aba Obrigações: Pendentes e Pagas como antes (a mesma consulta,
 * por vencimento). Cada linha mostra a situação que `vehicle_alerts` dá —
 * a mesma do dashboard, da Manutenção e do sino. Marcar como paga, editar e
 * excluir abrem diálogos daqui; o foco volta ao gatilho ou, se a linha mudou
 * de grupo ou saiu, ao título do grupo.
 */
export function ObligationsTab({ vehicleId, alerts }: { vehicleId: string; alerts: AlertsState }) {
  const query = useObligations(vehicleId);
  const [createOpen, setCreateOpen] = useState(false);
  const [dialog, setDialog] = useState<{ kind: "pay" | "edit" | "delete"; obligation: ObligationRow } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const deletedRef = useRef(false);

  const today = todayDateOnly();
  const obligations = query.data ?? [];
  const rows: Row[] = obligations.map((obligation) => {
    const alert = findAlert(alerts.data, "obligations", obligation.id);
    return {
      obligation,
      status: obligationStatus(obligation, alert, alerts.ready, today),
      dateLabel: obligationDateLabel(obligation, today),
      hasAlert: !!alert,
    };
  });
  const pending = rows.filter((r) => r.obligation.paid_on == null);
  const paid = rows.filter((r) => r.obligation.paid_on != null);
  const overdue = pending.filter((r) => r.status?.tone === "error").length;
  const soon = pending.filter((r) => r.status?.tone === "warning").length;
  const pendingSummary = [
    plural(pending.length, "obrigação", "obrigações"),
    overdue > 0 && plural(overdue, "vencida", "vencidas"),
    soon > 0 && plural(soon, "próxima", "próximas"),
  ]
    .filter(Boolean)
    .join(" · ");

  const empty = query.isSuccess && obligations.length === 0;
  const current = dialog ? (rows.find((r) => r.obligation.id === dialog.obligation.id) ?? null) : null;
  const currentObligation = current?.obligation ?? dialog?.obligation ?? null;
  const currentDateLabel = current?.dateLabel ?? (dialog ? obligationDateLabel(dialog.obligation, today) : "");

  function openDialog(kind: "pay" | "edit" | "delete", obligation: ObligationRow, trigger: HTMLElement | null) {
    triggerRef.current = trigger;
    deletedRef.current = false;
    setDialog({ kind, obligation });
    setDialogOpen(true);
  }
  const handlers: Handlers = {
    onMarkPaid: (obligation, trigger) => openDialog("pay", obligation, trigger),
    onEdit: (obligation, trigger) => openDialog("edit", obligation, trigger),
    onDelete: (obligation, trigger) => openDialog("delete", obligation, trigger),
  };

  function closeDialog(value: boolean) {
    setDialogOpen(value);
    if (value || !dialog) return;
    // Paga ou editada, a linha pode mudar de grupo (e o gatilho some): o foco vai pro grupo onde ela está agora.
    const target = dialog.kind === "pay" ? PAID_TITLE_ID : PENDING_TITLE_ID;
    restoreFocus(triggerRef.current, target, deletedRef.current);
  }

  const openCreate = (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Registrar obrigação
    </Button>
  );

  return (
    <>
      {!empty && <TabIntro action={openCreate}>IPVA, licenciamento, seguro e vistoria. Pagar é o que tira o alerta.</TabIntro>}

      {query.isLoading && (
        <section aria-labelledby={PENDING_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader title="Pendentes" titleId={PENDING_TITLE_ID} />
          <SkeletonList label="Carregando obrigações…" />
        </section>
      )}
      {query.isError && (
        <section aria-labelledby={PENDING_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader title="Pendentes" titleId={PENDING_TITLE_ID} />
          <InlineError onRetry={() => void query.refetch()}>
            Não foi possível carregar as obrigações. As outras abas continuam disponíveis.
          </InlineError>
        </section>
      )}

      {empty && (
        <EmptyState
          icon={CalendarClock}
          titleId={PENDING_TITLE_ID}
          title="Nenhuma obrigação registrada neste veículo."
          action={<Button onClick={() => setCreateOpen(true)}>Registrar primeira obrigação</Button>}
        >
          IPVA, licenciamento, seguro, vistoria: com data de vencimento, a obrigação avisa 30 dias antes e fica
          vencida no dia seguinte, até ser marcada como paga. Só o nome é obrigatório.
        </EmptyState>
      )}

      {query.isSuccess && obligations.length > 0 && (
        <>
          <ObligationGroup
            titleId={PENDING_TITLE_ID}
            title="Pendentes"
            rows={pending}
            summary={pendingSummary}
            emptyText="Nenhuma obrigação pendente."
            handlers={handlers}
          />
          {paid.length > 0 && (
            <ObligationGroup
              titleId={PAID_TITLE_ID}
              title="Pagas"
              rows={paid}
              summary={plural(paid.length, "obrigação", "obrigações")}
              emptyText=""
              handlers={handlers}
            />
          )}
        </>
      )}

      <CreateObligationDialog
        vehicleId={vehicleId}
        open={createOpen}
        onOpenChange={(value) => {
          setCreateOpen(value);
          if (!value) restoreFocus(null, PENDING_TITLE_ID);
        }}
      />
      {dialog && currentObligation && dialog.kind === "pay" && (
        <MarkObligationPaidDialog
          key={currentObligation.id}
          vehicleId={vehicleId}
          obligation={currentObligation}
          dateLabel={currentDateLabel}
          open={dialogOpen}
          onPaid={() => {
            deletedRef.current = true;
          }}
          onOpenChange={closeDialog}
        />
      )}
      {dialog && currentObligation && dialog.kind === "edit" && (
        <EditObligationDialog
          key={currentObligation.id}
          vehicleId={vehicleId}
          obligation={currentObligation}
          open={dialogOpen}
          onOpenChange={closeDialog}
        />
      )}
      {dialog && currentObligation && dialog.kind === "delete" && (
        <DeleteObligationDialog
          key={currentObligation.id}
          vehicleId={vehicleId}
          obligation={currentObligation}
          dateLabel={currentDateLabel}
          hasAlert={!!current?.hasAlert}
          open={dialogOpen}
          onDeleted={() => {
            deletedRef.current = true;
          }}
          onOpenChange={closeDialog}
        />
      )}
    </>
  );
}
