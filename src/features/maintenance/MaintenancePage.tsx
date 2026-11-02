import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, ClipboardList, ListPlus, Wrench } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { formatCount, formatKm } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { PANEL_LINK_CLASSNAME } from "@/features/dashboard/DashboardPanel";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { AlertBanner } from "./AlertBanner";
import { CreateMaintenanceItemDialog } from "./CreateMaintenanceItemDialog";
import { CreateMaintenanceRecordDialog } from "./CreateMaintenanceRecordDialog";
import { DeleteMaintenanceItemDialog } from "./DeleteMaintenanceItemDialog";
import { EditMaintenanceItemDialog } from "./EditMaintenanceItemDialog";
import { PLAN_ROW_GRID, MaintenancePlanRow } from "./MaintenancePlanRow";
import { RECORD_ROW_GRID, MaintenanceRecordRow } from "./MaintenanceRecordRow";
import { itemStatus } from "./maintenancePresentation";
import { useMaintenanceItems, type MaintenanceItemWithStatus } from "./useMaintenanceItems";
import { useMaintenanceRecords } from "./useMaintenanceRecords";
import { useVehicleAlerts } from "./useVehicleAlerts";

const OVERDUE_TITLE_ID = "maintenance-overdue-title";
const OTHER_ALERTS_TITLE_ID = "maintenance-other-alerts-title";
const PLAN_TITLE_ID = "maintenance-plan-title";
const HISTORY_TITLE_ID = "maintenance-history-title";
// Largura toda, como Gastos e Abastecimentos; em monitor largo quem se ajusta são as colunas das listas.
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";
const PANEL_CLASSNAME = "overflow-hidden rounded-lg border border-border bg-surface";
const PANEL_HEADER_CLASSNAME = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3";

/** Próximas primeiro, depois em dia, depois as que nunca foram executadas — dentro de cada uma, a ordem da consulta (nome). */
const PLAN_ORDER = { overdue: 0, due_soon: 0, ok: 1, planned: 2 } as const;

/**
 * Foco para depois que um diálogo fecha e o elemento que o abriu sumiu (a
 * linha trocou de grupo ou foi excluída): espera o diálogo sair e, se o foco
 * caiu no `<body>`, vai pro título da seção.
 */
function focusHeadingIfLost(headingId: string) {
  const startedAt = performance.now();
  const check = () => {
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    const target = document.getElementById(headingId) ?? document.querySelector<HTMLElement>("main h1");
    if (!target) return;
    target.tabIndex = -1;
    target.focus();
  };
  requestAnimationFrame(check);
}

function plural(count: number, one: string, many: string) {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 p-4">
      <p className="flex items-start gap-2 text-sm text-text-secondary">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
        {message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true">
      <span className="sr-only">{label}</span>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
      ))}
    </div>
  );
}

function PanelEmpty({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon}
      <p className="font-medium text-text-primary">{title}</p>
      <p className="max-w-md text-sm text-text-secondary">{children}</p>
      {action}
    </div>
  );
}

/**
 * Etapa 07: responde, nesta ordem, o que venceu, o que vem a seguir no plano
 * e o que já foi feito — com as duas ações no topo, distintas: "Registrar
 * serviço" (execução) e "Adicionar ao plano" (planejamento).
 *
 * Plano e histórico são consultas separadas (como antes) e carregam e falham
 * cada um por conta própria: erro no plano não vira "nada vencido". Vencidas e
 * próximas saem do `status` de `maintenance_status`, a mesma view de onde
 * `vehicle_alerts` sai. Por isso o `AlertBanner` daqui mostra só o que as
 * listas não cobrem — documentos e obrigações, num bloco compacto depois das
 * vencidas, com o caminho para Documentos — em vez de repetir a manutenção.
 * Itens inativos, antes filtrados sem aviso, aparecem recolhidos no fim do
 * plano. Mesmas consultas, chaves, invalidações e diálogos; `?novo=1`
 * continua abrindo o registro de serviço.
 */
export function MaintenancePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createRecordOpen, setCreateRecordOpen] = useState(() => searchParams.get("novo") === "1");
  const [preselectedItemId, setPreselectedItemId] = useState<string | null>(null);
  // O item aberto fica guardado aqui, não na linha: a linha pode trocar de grupo e desmontar quando a lista recarrega.
  const [editingItem, setEditingItem] = useState<MaintenanceItemWithStatus | null>(null);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MaintenanceItemWithStatus | null>(null);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const itemTriggerRef = useRef<HTMLElement | null>(null);
  const inactiveListId = useId();

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const itemsQuery = useMaintenanceItems(vehicleId ?? "");
  const recordsQuery = useMaintenanceRecords(vehicleId ?? "");
  const alertsQuery = useVehicleAlerts(vehicleId ?? "");

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openRecordDialog(itemId: string | null) {
    setPreselectedItemId(itemId);
    setCreateRecordOpen(true);
  }

  /** Volta ao "⋯" da linha se ele ainda existe; senão, ao título do plano. */
  function restoreItemFocus() {
    const trigger = itemTriggerRef.current;
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusHeadingIfLost(PLAN_TITLE_ID);
    });
  }

  if (vehicleLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando manutenção…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar a manutenção.</p>
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

  const allItems = itemsQuery.data ?? [];
  const activeItems = allItems.filter((item) => item.is_active);
  const inactiveItems = allItems.filter((item) => !item.is_active);
  const overdueItems = activeItems.filter((item) => itemStatus(item) === "overdue");
  const planItems = activeItems
    .filter((item) => itemStatus(item) !== "overdue")
    .map((item, index) => ({ item, index }))
    .sort((a, b) => PLAN_ORDER[itemStatus(a.item)] - PLAN_ORDER[itemStatus(b.item)] || a.index - b.index)
    .map(({ item }) => item);
  const dueSoonCount = planItems.filter((item) => itemStatus(item) === "due_soon").length;
  const records = recordsQuery.data ?? [];
  // As de manutenção já estão nas listas (mesma view). Fica o resto — hoje documentos e obrigações; fonte nova também aparece.
  const otherAlerts = (alertsQuery.data ?? []).filter((alert) => alert.source_table !== "maintenance_items");
  const itemsReady = itemsQuery.isSuccess;
  const currentKm = vehicle.current_odometer_km ?? null;

  const planSummary = itemsReady
    ? [
        plural(activeItems.length, "item ativo", "itens ativos"),
        overdueItems.length > 0 ? plural(overdueItems.length, "vencido", "vencidos") : "nada vencido",
        dueSoonCount > 0 && plural(dueSoonCount, "próximo", "próximos"),
        inactiveItems.length > 0 && plural(inactiveItems.length, "inativo", "inativos"),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const rowHandlers = {
    currentOdometerKm: currentKm,
    onRegisterService: (item: MaintenanceItemWithStatus) => openRecordDialog(item.id),
    onEdit: (item: MaintenanceItemWithStatus, trigger: HTMLElement | null) => {
      itemTriggerRef.current = trigger;
      setEditingItem(item);
      setEditItemOpen(true);
    },
    onDelete: (item: MaintenanceItemWithStatus, trigger: HTMLElement | null) => {
      itemTriggerRef.current = trigger;
      setDeletingItem(item);
      setDeleteItemOpen(true);
    },
  };

  const planHeader = (
    <div
      aria-hidden="true"
      className={cn("hidden border-b border-border px-4 py-2 text-xs text-text-secondary xl:grid", PLAN_ROW_GRID)}
    >
      <span>Item e situação</span>
      <span>Próxima referência</span>
      <span />
    </div>
  );

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Manutenção" }]} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Manutenção</h1>
          <p className="text-sm text-text-secondary">
            Plano preventivo e serviços feitos neste veículo
            <span className="whitespace-nowrap tabular-nums">
              {" · "}
              {currentKm != null ? `odômetro ${formatKm(currentKm)}` : "odômetro não informado"}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:gap-3">
          <Button onClick={() => openRecordDialog(null)}>
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Registrar serviço
          </Button>
          <Button variant="outline" onClick={() => setCreateItemOpen(true)}>
            <ListPlus className="h-4 w-4" aria-hidden="true" />
            Adicionar ao plano
          </Button>
        </div>
      </header>

      {/* Vencidas: só existe com item vencido. Sem vencida, o resumo do plano diz "nada vencido"; com erro, o plano diz que não carregou. */}
      {itemsReady && overdueItems.length > 0 && (
        <section aria-labelledby={OVERDUE_TITLE_ID} className={cn(PANEL_CLASSNAME, "border-l-2 border-l-error")}>
          <div className={PANEL_HEADER_CLASSNAME}>
            <h2 id={OVERDUE_TITLE_ID} className="flex items-center gap-2 text-sm font-medium text-text-primary">
              Vencidas
              {/* A contagem está no texto ao lado; aqui é só reforço visual. */}
              <span aria-hidden="true" className="rounded-full bg-error/10 px-1.5 py-px font-mono text-xs font-medium text-error">
                {overdueItems.length}
              </span>
            </h2>
            <p className="text-xs text-text-secondary">
              {plural(overdueItems.length, "item passou", "itens passaram")} da data ou da quilometragem prevista.
            </p>
          </div>
          {planHeader}
          <ul className="divide-y divide-border">
            {overdueItems.map((item) => (
              <MaintenancePlanRow key={item.id} item={item} {...rowHandlers} />
            ))}
          </ul>
        </section>
      )}

      {otherAlerts.length > 0 && (
        <section aria-labelledby={OTHER_ALERTS_TITLE_ID} className={PANEL_CLASSNAME}>
          <div className={cn(PANEL_HEADER_CLASSNAME, "items-center")}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 id={OTHER_ALERTS_TITLE_ID} className="text-sm font-medium text-text-primary">
                Documentos e obrigações
              </h2>
              <p className="text-xs text-text-secondary">Também pendentes neste veículo — tratados em Documentos.</p>
            </div>
            <Link to={ROUTES.vehicleDocuments(vehicle.id)} className={PANEL_LINK_CLASSNAME}>
              Ver em Documentos
            </Link>
          </div>
          <div className="p-3">
            <AlertBanner alerts={otherAlerts} />
          </div>
        </section>
      )}

      {/* Falha dos alertas não vira "nada pendente": uma linha só, sem tomar o lugar das listas. */}
      {alertsQuery.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar os alertas de documentos e obrigações.
          </span>
          <Button variant="ghost" onClick={() => void alertsQuery.refetch()} className="-ml-2 px-2">
            Tentar de novo
          </Button>
        </div>
      )}

      <section aria-labelledby={PLAN_TITLE_ID} className={PANEL_CLASSNAME}>
        <div className={PANEL_HEADER_CLASSNAME}>
          <h2 id={PLAN_TITLE_ID} className="text-sm font-medium text-text-primary">
            Plano
          </h2>
          <p aria-live="polite" className="text-xs text-text-secondary">
            {planSummary}
          </p>
        </div>

        {itemsQuery.isLoading && <PanelSkeleton label="Carregando o plano…" />}

        {itemsQuery.isError && (
          <PanelError
            message="Não foi possível carregar o plano. Sem ele, não dá para saber o que venceu nem o que vem a seguir."
            onRetry={() => void itemsQuery.refetch()}
          />
        )}

        {itemsReady && allItems.length === 0 && (
          <PanelEmpty
            icon={<ClipboardList className="h-6 w-6 text-text-secondary" aria-hidden="true" />}
            title="Nenhum item no plano."
            action={
              <Button variant="outline" onClick={() => setCreateItemOpen(true)} className="mt-1">
                Adicionar ao plano
              </Button>
            }
          >
            Cadastre o que acompanhar periodicamente — por quilometragem, por meses ou pelos dois. Um serviço avulso
            pode ser registrado sem plano.
          </PanelEmpty>
        )}

        {itemsReady && allItems.length > 0 && (
          <>
            {planItems.length > 0 ? (
              <>
                {planHeader}
                <ul className="divide-y divide-border">
                  {planItems.map((item) => (
                    <MaintenancePlanRow key={item.id} item={item} {...rowHandlers} />
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-4 py-4 text-sm text-text-secondary">
                {activeItems.length === 0
                  ? "Nenhum item ativo no plano."
                  : "Todos os itens ativos estão em “Vencidas”, acima."}
              </p>
            )}

            {inactiveItems.length > 0 && (
              <div className="border-t border-border">
                <button
                  type="button"
                  aria-expanded={inactiveOpen}
                  aria-controls={inactiveListId}
                  onClick={() => setInactiveOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-state-hover"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {inactiveOpen ? "Ocultar inativos" : `Mostrar ${plural(inactiveItems.length, "inativo", "inativos")}`}
                    </span>
                    <span className="text-xs text-text-secondary">Fora das vencidas, das próximas e dos alertas.</span>
                  </span>
                </button>
                <ul id={inactiveListId} hidden={!inactiveOpen} className="divide-y divide-border border-t border-border">
                  {inactiveItems.map((item) => (
                    <MaintenancePlanRow key={item.id} item={item} {...rowHandlers} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section aria-labelledby={HISTORY_TITLE_ID} className={PANEL_CLASSNAME}>
        <div className={PANEL_HEADER_CLASSNAME}>
          <h2 id={HISTORY_TITLE_ID} className="text-sm font-medium text-text-primary">
            Histórico de serviços
          </h2>
          <p aria-live="polite" className="text-xs text-text-secondary">
            {recordsQuery.isSuccess && plural(records.length, "serviço", "serviços")}
          </p>
        </div>

        {recordsQuery.isLoading && <PanelSkeleton label="Carregando o histórico…" />}

        {recordsQuery.isError && (
          <PanelError
            message="Não foi possível carregar o histórico de serviços."
            onRetry={() => void recordsQuery.refetch()}
          />
        )}

        {recordsQuery.isSuccess && records.length === 0 && (
          <PanelEmpty
            icon={<Wrench className="h-6 w-6 text-text-secondary" aria-hidden="true" />}
            title="Nenhum serviço registrado."
            action={
              <Button onClick={() => openRecordDialog(null)} className="mt-1">
                Registrar serviço
              </Button>
            }
          >
            Trocas, revisões e reparos entram aqui — ligados a um item do plano ou avulsos.
          </PanelEmpty>
        )}

        {recordsQuery.isSuccess && records.length > 0 && (
          <>
            <div
              aria-hidden="true"
              className={cn("hidden border-b border-border px-4 py-2 text-xs text-text-secondary md:grid", RECORD_ROW_GRID)}
            >
              <span>Serviço</span>
              <span>Fornecedor</span>
              <span className="text-right">Data</span>
              <span className="text-right">Quilometragem</span>
              <span className="text-right">Custo</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {records.map((record) => (
                <MaintenanceRecordRow
                  key={record.id}
                  vehicleId={vehicle.id}
                  record={record}
                  items={allItems}
                  listTitleId={HISTORY_TITLE_ID}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <CreateMaintenanceItemDialog
        vehicleId={vehicle.id}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
      />
      <CreateMaintenanceRecordDialog
        vehicleId={vehicle.id}
        items={allItems}
        defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
        preselectedItemId={preselectedItemId}
        open={createRecordOpen}
        onOpenChange={(open) => {
          setCreateRecordOpen(open);
          // Aberto por uma linha do plano que trocou de grupo depois do registro: o serviço novo está no histórico.
          if (!open) focusHeadingIfLost(HISTORY_TITLE_ID);
        }}
      />
      {editingItem && (
        <EditMaintenanceItemDialog
          vehicleId={vehicle.id}
          item={editingItem}
          open={editItemOpen}
          onOpenChange={(open) => {
            setEditItemOpen(open);
            if (!open) restoreItemFocus();
          }}
        />
      )}
      {deletingItem && (
        <DeleteMaintenanceItemDialog
          vehicleId={vehicle.id}
          item={deletingItem}
          linkedRecordsCount={
            recordsQuery.isSuccess ? records.filter((r) => r.maintenance_item_id === deletingItem.id).length : null
          }
          open={deleteItemOpen}
          onOpenChange={(open) => {
            setDeleteItemOpen(open);
            if (!open) restoreItemFocus();
          }}
        />
      )}
    </div>
  );
}
