import { useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RowActionsMenu } from "@/components/ui/menu";
import {
  formatConsumption,
  formatDateOnly,
  formatKm,
  formatLitersExact,
  formatMoney,
  formatPricePerLiter,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditFuelLogDialog } from "./EditFuelLogDialog";
import { DeleteFuelLogDialog } from "./DeleteFuelLogDialog";
import { fuelTypeLabel, missingConsumptionReason } from "./fuelLogPresentation";
import type { FuelLogMetric } from "./useFuelLogs";

type FuelLogRowProps = {
  vehicleId: string;
  log: FuelLogMetric;
  /** `id` do título da lista — destino do foco quando esta linha some depois de excluída. */
  listTitleId: string;
};

/**
 * Colunas da lista no desktop: abastecimento (data, posto, combustível,
 * condições) · odômetro · litros · valor · preço por litro · consumo · ações.
 * O cabeçalho da lista usa o mesmo molde, então as colunas alinham. A partir
 * de `2xl` as colunas dividem a largura em proporção (mesma solução do gasto).
 */
export const FUEL_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_6rem_4.75rem_6.25rem_5.75rem_6.25rem_2.75rem] md:gap-x-3 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] 2xl:gap-x-6";

/**
 * Condições que mudam o cálculo, em texto (nunca só cor), no selo neutro
 * comum. Tanque cheio é o normal e não ganha etiqueta.
 */
function Tags({ partial, missed }: { partial: boolean; missed: boolean }) {
  if (!partial && !missed) return null;
  return (
    <span className="mt-0.5 flex flex-wrap gap-1">
      {partial && <Badge tone="neutral">Tanque parcial</Badge>}
      {missed && <Badge tone="neutral">Anterior não registrado</Badge>}
    </span>
  );
}

/**
 * Etapa 06: um abastecimento. No celular, a primeira linha tem valor e
 * litros, o consumo à direita (sempre no mesmo lugar) e o "⋯"; embaixo, em
 * largura inteira, data e odômetro, posto e combustível, preço por litro,
 * trecho e custo por km, e as condições. A partir de `md`, colunas alinhadas
 * pra comparar paradas. Tudo vem de
 * `fuel_log_metrics` como está — preço por litro, distância do trecho,
 * consumo e custo por km são do banco; ausente é "—", nunca zero.
 *
 * Sem consumo, o motivo curto (`missingConsumptionReason`) aparece só nessa
 * linha: no desktop sob o "—"; no celular, na faixa de baixo, a menos que a
 * etiqueta já diga ("Tanque parcial", "Anterior não registrado"). Tanque
 * cheio é o normal e não ganha etiqueta (o leitor de tela ouve "tanque cheio"
 * na identificação do registro).
 *
 * Editar e excluir moram no menu "⋯"; a linha não é clicável.
 */
export function FuelLogRow({ vehicleId, log, listTitleId }: FuelLogRowProps) {
  const identityId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // O "⋯" (do `RowActionsMenu`) — o foco volta pra ele quando um diálogo fecha.
  const triggerRef = useRef<HTMLElement | null>(null);

  const date = log.occurred_on ? formatDateOnly(log.occurred_on) : "Sem data";
  const odometer = log.odometer_km != null ? formatKm(log.odometer_km) : null;
  const liters = log.liters != null ? formatLitersExact(log.liters) : "—";
  const total = log.total_amount != null ? formatMoney(log.total_amount) : "—";
  const price = log.price_per_liter != null ? formatPricePerLiter(log.price_per_liter) : null;
  const distance = log.km_since_previous != null ? formatKm(log.km_since_previous) : null;
  const fuel = fuelTypeLabel(log);
  const reason = missingConsumptionReason(log);
  const partial = log.is_full_tank === false;
  const missed = log.missed_previous_fill === true;
  const placeAndFuel = [log.station, fuel].filter(Boolean).join(" · ");

  function focusTrigger() {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  /*
    A mutação só termina depois do refetch (o `onSuccess` devolve a promessa
    da invalidação), então quando `onDeleted` roda esta linha — e o ref do
    gatilho — já podem ter saído da tela. O gatilho é guardado ao pedir a
    exclusão, num ref que não é ligado a elemento nenhum. (Mesmo caminho do
    `ExpenseRow`, etapa 05.)
  */
  const removalTriggerRef = useRef<HTMLElement | null>(null);

  function focusAfterRemoval() {
    const trigger = removalTriggerRef.current;
    if (!trigger) return;
    const startedAt = performance.now();
    const check = () => {
      // A lista pode recarregar antes de a confirmação terminar de fechar: espera as duas coisas.
      if (trigger.isConnected || document.querySelector('[role="alertdialog"]')) {
        // Recarregar a lista pode falhar ou demorar; depois de 10s, desiste.
        if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
        return;
      }
      if (document.activeElement && document.activeElement !== document.body) return;
      const target = document.getElementById(listTitleId) ?? document.querySelector<HTMLElement>("main h1");
      if (!target) return;
      target.tabIndex = -1;
      target.focus();
    };
    requestAnimationFrame(check);
  }

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-start gap-x-3 px-(--panel-pad-x) py-3",
        FUEL_ROW_GRID,
      )}
    >
      {/* Lido como contexto do botão "⋯": qual abastecimento ele afeta. */}
      <span id={identityId} className="sr-only">
        Abastecimento de {date}, {odometer ?? "sem quilometragem"}, {liters}, {total},{" "}
        {partial ? "tanque parcial" : "tanque cheio"}
        {missed ? ", anterior não registrado" : ""}
      </span>

      {/* Celular, 1ª linha: valor e litros (à direita, o consumo e o "⋯"). */}
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 md:hidden">
        <span className="type-value text-sm text-text-primary">{total}</span>
        <span className="text-sm text-text-secondary tabular-nums">· {liters}</span>
      </p>

      {/* Desktop: a data abre a linha, com posto, combustível e condições embaixo; os números ficam nas colunas. */}
      <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
        <p className="text-sm font-medium text-text-primary tabular-nums">
          {log.occurred_on ? <time dateTime={log.occurred_on}>{date}</time> : date}
        </p>
        {placeAndFuel && <p className="text-xs break-words text-text-secondary">{placeAndFuel}</p>}
        <Tags partial={partial} missed={missed} />
      </div>

      <p className="hidden flex-col items-end text-right md:flex">
        <span className={cn("text-sm tabular-nums", odometer ? "text-text-primary" : "text-text-secondary")}>
          {odometer ?? "—"}
        </span>
        {distance && <span className="text-xs text-text-secondary tabular-nums">+{distance}</span>}
        {!odometer && <span className="text-xs text-text-secondary">não informado</span>}
      </p>

      <p className="hidden text-right text-sm text-text-primary tabular-nums md:block">{liters}</p>

      <p className="type-value hidden text-right text-sm text-text-primary md:block">{total}</p>

      <p className="hidden text-right text-sm tabular-nums md:block">
        {price ? <span className="text-text-primary">{price}</span> : <span className="text-text-secondary">—</span>}
      </p>

      {/* Consumo: sempre à direita, no celular e no desktop. */}
      <p className="flex flex-col items-end pt-px text-right md:pt-0">
        {log.km_per_liter != null ? (
          <span className="type-value text-sm whitespace-nowrap text-text-primary">
            {formatConsumption(log.km_per_liter)}
          </span>
        ) : (
          <span className="text-sm text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem consumo</span>
          </span>
        )}
        {/* No celular o custo por km e o motivo descem pra faixa de baixo, pra esta coluna não espremer o valor. */}
        {log.cost_per_km != null && (
          <span className="hidden text-xs whitespace-nowrap text-text-secondary tabular-nums md:inline">
            {formatMoney(log.cost_per_km)}/km
          </span>
        )}
        {reason && <span className="hidden max-w-28 text-xs text-text-secondary md:inline">{reason.label}</span>}
      </p>

      <div className="-my-2.5">
        <RowActionsMenu
          label="Ações do abastecimento"
          editLabel="Editar abastecimento"
          deleteLabel="Excluir abastecimento"
          describedBy={identityId}
          onEdit={(trigger) => {
            triggerRef.current = trigger;
            setEditOpen(true);
          }}
          onDelete={(trigger) => {
            triggerRef.current = trigger;
            removalTriggerRef.current = trigger;
            setDeleteOpen(true);
          }}
        />
      </div>

      {/*
        Celular, faixa de baixo em largura inteira (depois do "⋯" no DOM, então
        começa na 2ª linha da grade): data e odômetro, posto e combustível, os
        números do trecho e as condições. Nada é cortado: o nome do posto quebra
        (harmonização 01; antes cortava em 2 linhas sem caminho de volta).
      */}
      <div className="col-span-3 mt-0.5 flex min-w-0 flex-col gap-0.5 text-xs text-text-secondary md:hidden">
        <p className="tabular-nums">
          {date} · {odometer ?? "sem quilometragem"}
        </p>
        {placeAndFuel && <p className="break-words">{placeAndFuel}</p>}
        {(price || distance || log.cost_per_km != null) && (
          <p className="tabular-nums">
            {[price, distance && `trecho ${distance}`, log.cost_per_km != null && `${formatMoney(log.cost_per_km)}/km`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {(partial || missed || (reason && !reason.taggedOnRow)) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Tags partial={partial} missed={missed} />
            {reason && !reason.taggedOnRow && <span>Sem consumo: {reason.label}</span>}
          </div>
        )}
      </div>

      <EditFuelLogDialog
        vehicleId={vehicleId}
        log={log}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) focusTrigger();
        }}
      />
      <DeleteFuelLogDialog
        vehicleId={vehicleId}
        log={log}
        open={deleteOpen}
        onDeleted={focusAfterRemoval}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) focusTrigger();
        }}
      />
    </li>
  );
}
