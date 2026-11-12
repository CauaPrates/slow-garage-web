import { useEffect, useId, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ClipboardList, ListPlus, Wrench } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, PageError } from "@/components/ui/feedback";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { formatCount, formatKm } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { PANEL_LINK_CLASSNAME } from "@/components/ui/panel";
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
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useVehicleAlerts } from "./useVehicleAlerts";

const OVERDUE_TITLE_ID = "maintenance-overdue-title";
const OTHER_ALERTS_TITLE_ID = "maintenance-other-alerts-title";
const PLAN_TITLE_ID = "maintenance-plan-title";
const HISTORY_TITLE_ID = "maintenance-history-title";

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
      <Page aria-busy="true">
        <span className="sr-only">Carregando manutenção…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-48 rounded-lg border border-border bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }

  if (vehicleError) {
    return <PageError message="Não foi possível carregar a manutenção." onRetry={() => void refetchVehicle()} />;
  }

  if (!vehicle) {
    return <VehicleNotFound />;
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

  // As colunas do plano começam em `xl` (a referência precisa de espaço ao lado do item).
  const planHeader = (
    <ListColumns className={cn("md:hidden xl:grid", PLAN_ROW_GRID)}>
      <span>Item e situação</span>
      <span>Próxima referência</span>
      <span />
    </ListColumns>
  );

  return (
    <Page>
      <Breadcrumb items={[{ label: "Manutenção" }]} />

      {/* Duas ações distintas (execução e planejamento): no celular empilham em largura cheia, serviço primeiro. */}
      <PageHeader
        title="Manutenção"
        description={
          <>
            Plano preventivo e serviços feitos neste veículo
            <span className="whitespace-nowrap tabular-nums">
              {" · "}
              {currentKm != null ? `odômetro ${formatKm(currentKm)}` : "odômetro não informado"}
            </span>
          </>
        }
        stackActionsOnMobile
        actions={
          <>
            <Button onClick={() => openRecordDialog(null)}>
              <Wrench className="h-4 w-4" aria-hidden="true" />
              Registrar serviço
            </Button>
            <Button variant="outline" onClick={() => setCreateItemOpen(true)}>
              <ListPlus className="h-4 w-4" aria-hidden="true" />
              Adicionar ao plano
            </Button>
          </>
        }
      />

      {/* Vencidas: só existe com item vencido. Sem vencida, o resumo do plano diz "nada vencido"; com erro, o plano diz que não carregou. */}
      {itemsReady && overdueItems.length > 0 && (
        <section aria-labelledby={OVERDUE_TITLE_ID} className={cn(PANEL_CLASSNAME, "border-l-2 border-l-error")}>
          <PanelHeader
            titleId={OVERDUE_TITLE_ID}
            title={
              <span className="flex items-center gap-2">
                Vencidas
                {/* A contagem está no texto ao lado; aqui é só reforço visual. */}
                <span aria-hidden="true" className="rounded-full bg-error/10 px-1.5 py-px text-xs font-medium text-error tabular-nums">
                  {overdueItems.length}
                </span>
              </span>
            }
            action={
              <p className="type-caption pt-0.5 text-text-secondary">
                {plural(overdueItems.length, "item passou", "itens passaram")} da data ou da quilometragem prevista.
              </p>
            }
          />
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
          <PanelHeader
            titleId={OTHER_ALERTS_TITLE_ID}
            title="Documentos e obrigações"
            description="Também pendentes neste veículo — tratados em Documentos."
            className="items-center"
            action={
              <Link to={ROUTES.vehicleDocuments(vehicle.id)} className={PANEL_LINK_CLASSNAME}>
                Ver em Documentos
              </Link>
            }
          />
          <div className="p-3">
            <AlertBanner alerts={otherAlerts} />
          </div>
        </section>
      )}

      {/* Falha dos alertas não vira "nada pendente": uma linha só, sem tomar o lugar das listas. */}
      {alertsQuery.isError && (
        <InlineError onRetry={() => void alertsQuery.refetch()} className="p-0">
          Não foi possível carregar os alertas de documentos e obrigações.
        </InlineError>
      )}

      <section aria-labelledby={PLAN_TITLE_ID} className={PANEL_CLASSNAME}>
        <PanelHeader title="Plano" titleId={PLAN_TITLE_ID} action={<PanelCount>{planSummary}</PanelCount>} />

        {itemsQuery.isLoading && <SkeletonList label="Carregando o plano…" />}

        {itemsQuery.isError && (
          <InlineError onRetry={() => void itemsQuery.refetch()}>
            Não foi possível carregar o plano. Sem ele, não dá para saber o que venceu nem o que vem a seguir.
          </InlineError>
        )}

        {itemsReady && allItems.length === 0 && (
          <EmptyState
            variant="inline"
            icon={ClipboardList}
            title="Nenhum item no plano."
            action={
              <Button variant="outline" onClick={() => setCreateItemOpen(true)}>
                Adicionar ao plano
              </Button>
            }
          >
            Cadastre o que acompanhar periodicamente — por quilometragem, por meses ou pelos dois. Um serviço avulso
            pode ser registrado sem plano.
          </EmptyState>
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
        <PanelHeader
          title="Histórico de serviços"
          titleId={HISTORY_TITLE_ID}
          action={<PanelCount>{recordsQuery.isSuccess && plural(records.length, "serviço", "serviços")}</PanelCount>}
        />

        {recordsQuery.isLoading && <SkeletonList label="Carregando o histórico…" />}

        {recordsQuery.isError && (
          <InlineError onRetry={() => void recordsQuery.refetch()}>
            Não foi possível carregar o histórico de serviços.
          </InlineError>
        )}

        {recordsQuery.isSuccess && records.length === 0 && (
          <EmptyState
            variant="inline"
            icon={Wrench}
            title="Nenhum serviço registrado."
            action={<Button onClick={() => openRecordDialog(null)}>Registrar serviço</Button>}
          >
            Trocas, revisões e reparos entram aqui — ligados a um item do plano ou avulsos.
          </EmptyState>
        )}

        {recordsQuery.isSuccess && records.length > 0 && (
          <>
            <ListColumns className={RECORD_ROW_GRID}>
              <span>Serviço</span>
              <span>Fornecedor</span>
              <span className="text-right">Data</span>
              <span className="text-right">Quilometragem</span>
              <span className="text-right">Custo</span>
              <span />
            </ListColumns>
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
    </Page>
  );
}
