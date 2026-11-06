import { useId, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { RowActionsMenu } from "@/components/ui/menu";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditMaintenanceRecordDialog } from "./EditMaintenanceRecordDialog";
import { DeleteMaintenanceRecordDialog } from "./DeleteMaintenanceRecordDialog";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";
import type { MaintenanceRecordRow as MaintenanceRecord } from "./useMaintenanceRecords";

type MaintenanceRecordRowProps = {
  vehicleId: string;
  record: MaintenanceRecord;
  /** Todos os itens do plano (ativos e inativos) — o vínculo e o seletor do formulário. */
  items: MaintenanceItemWithStatus[];
  /** `id` do título da lista — destino do foco quando esta linha some depois de excluída. */
  listTitleId: string;
};

/**
 * Colunas do histórico no desktop: serviço (nome, vínculo, anexo) ·
 * fornecedor · data · quilometragem · custo · ações. O cabeçalho da lista usa
 * o mesmo molde, então as colunas alinham. A partir de `2xl` as colunas
 * dividem a largura em proporção (mesma solução do gasto e do abastecimento).
 */
export const RECORD_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_6rem_6.5rem_6.75rem_2.75rem] md:gap-x-3 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_2.75rem] 2xl:gap-x-6";

/** Vínculo e anexo em texto (nunca só ícone). */
function LinkAndAttachment({ linkLabel, hasAttachment }: { linkLabel: string; hasAttachment: boolean }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="min-w-0 break-words">{linkLabel}</span>
      {hasAttachment && (
        <span className="inline-flex items-center gap-1 text-text-primary">
          <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
          Anexo
        </span>
      )}
    </span>
  );
}

/**
 * Etapa 07: um serviço do histórico. No celular, a primeira linha tem nome e
 * custo e o "⋯"; embaixo, em largura inteira, data e quilometragem,
 * fornecedor e vínculo com o plano, e o anexo. A partir de `md`, colunas
 * alinhadas para comparar serviços. Custo ausente é "—" ("sem custo" pro
 * leitor de tela), nunca R$ 0,00; zero salvo aparece como R$ 0,00.
 *
 * Editar e excluir moram no menu "⋯" e usam os diálogos de serviço; a linha
 * não é clicável.
 */
export function MaintenanceRecordRow({ vehicleId, record, items, listTitleId }: MaintenanceRecordRowProps) {
  const identityId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // O "⋯" (do `RowActionsMenu`) — o foco volta pra ele quando um diálogo fecha.
  const triggerRef = useRef<HTMLElement | null>(null);

  const date = record.performed_on ? formatDateOnly(record.performed_on) : "Sem data";
  const odometer = record.odometer_km != null ? formatKm(record.odometer_km) : null;
  const cost = record.cost != null ? formatMoney(record.cost) : null;
  const linkedItem = record.maintenance_item_id ? items.find((i) => i.id === record.maintenance_item_id) : undefined;
  const linkedItemName = linkedItem?.name ?? (record.maintenance_item_id ? "item do plano" : null);
  const linkLabel = linkedItem
    ? `Plano: ${linkedItem.name}${linkedItem.is_active ? "" : " (inativo)"}`
    : linkedItemName
      ? "Plano: item do plano"
      : "Avulso";

  function focusTrigger() {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  /*
    A mutação só termina depois do refetch (o `onSuccess` devolve a promessa
    da invalidação), então quando `onDeleted` roda esta linha — e o ref do
    gatilho — já podem ter saído da tela. O gatilho é guardado ao pedir a
    exclusão, num ref que não é ligado a elemento nenhum. (Mesmo caminho do
    `ExpenseRow`/`FuelLogRow`.)
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
        // Harmonização 01: no celular, nome + "⋯" na 1ª linha e o custo embaixo (padrão de Modificações) — o nome
        // do serviço não divide mais a largura com uma coluna de valor. A partir de `md`, colunas explícitas.
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-3 gap-y-0.5 px-(--panel-pad-x) py-3 md:gap-y-0",
        RECORD_ROW_GRID,
      )}
    >
      {/* Lido como contexto do botão "⋯": qual serviço ele afeta. */}
      <span id={identityId} className="sr-only">
        {record.name}, {date}, {odometer ?? "sem quilometragem"}, {cost ?? "sem custo informado"}
      </span>

      <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-0.5 pt-0.5 md:pt-0">
        <p className="type-item-title text-text-primary">{record.name}</p>
        {/* Desktop: vínculo e anexo sob o nome; fornecedor, data, km e custo nas colunas. */}
        <p className="hidden text-xs text-text-secondary md:block">
          <LinkAndAttachment linkLabel={linkLabel} hasAttachment={record.attachment != null} />
        </p>
      </div>

      <p className="hidden min-w-0 text-sm break-words md:col-start-2 md:row-start-1 md:block">
        {record.vendor ? (
          <span className="text-text-primary">{record.vendor}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Fornecedor não informado</span>
          </span>
        )}
      </p>

      <p className="hidden text-right text-sm text-text-primary tabular-nums md:col-start-3 md:row-start-1 md:block">
        {record.performed_on ? <time dateTime={record.performed_on}>{date}</time> : date}
      </p>

      <p className="hidden text-right text-sm tabular-nums md:col-start-4 md:row-start-1 md:block">
        {odometer ? (
          <span className="text-text-primary">{odometer}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem quilometragem</span>
          </span>
        )}
      </p>

      {/* Custo: sob o nome no celular, na coluna do desktop. Ausente não é zero: escrito no celular, "—" na coluna. */}
      <p className="col-span-2 col-start-1 row-start-2 text-sm whitespace-nowrap md:col-span-1 md:col-start-5 md:row-start-1 md:text-right">
        {cost ? (
          <span className="type-value text-text-primary md:text-sm">{cost}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true" className="hidden md:inline">
              —
            </span>
            <span className="text-xs md:sr-only">Custo não informado</span>
          </span>
        )}
      </p>

      <div className="col-start-2 row-start-1 -my-2.5 flex justify-end md:col-start-6">
        <RowActionsMenu
          label="Ações do serviço"
          editLabel="Editar serviço"
          deleteLabel="Excluir serviço"
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
        começa na 2ª linha da grade): data e km, fornecedor e vínculo, anexo.
      */}
      <div className="col-span-2 flex min-w-0 flex-col gap-0.5 text-xs text-text-secondary md:hidden">
        <p className="tabular-nums">
          {date} · {odometer ?? "sem quilometragem"}
        </p>
        <p className="break-words">{record.vendor ?? "Fornecedor não informado"}</p>
        <LinkAndAttachment linkLabel={linkLabel} hasAttachment={record.attachment != null} />
      </div>

      <EditMaintenanceRecordDialog
        vehicleId={vehicleId}
        record={record}
        items={items}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) focusTrigger();
        }}
      />
      <DeleteMaintenanceRecordDialog
        vehicleId={vehicleId}
        record={record}
        linkedItemName={linkedItemName}
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
