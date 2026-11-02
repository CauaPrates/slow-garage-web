import { useId, useRef, useState } from "react";
import { MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        "grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-start gap-x-3 px-4 py-3",
        RECORD_ROW_GRID,
      )}
    >
      {/* Lido como contexto do botão "⋯": qual serviço ele afeta. */}
      <span id={identityId} className="sr-only">
        {record.name}, {date}, {odometer ?? "sem quilometragem"}, {cost ?? "sem custo informado"}
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium break-words text-text-primary">{record.name}</p>
        {/* Desktop: vínculo e anexo sob o nome; fornecedor, data, km e custo nas colunas. */}
        <p className="hidden text-xs text-text-secondary md:block">
          <LinkAndAttachment linkLabel={linkLabel} hasAttachment={record.attachment != null} />
        </p>
      </div>

      <p className="hidden min-w-0 text-sm break-words md:block">
        {record.vendor ? (
          <span className="text-text-primary">{record.vendor}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Fornecedor não informado</span>
          </span>
        )}
      </p>

      <p className="hidden text-right text-sm text-text-primary tabular-nums md:block">
        {record.performed_on ? <time dateTime={record.performed_on}>{date}</time> : date}
      </p>

      <p className="hidden text-right font-mono text-sm tabular-nums md:block">
        {odometer ? (
          <span className="text-text-primary">{odometer}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem quilometragem</span>
          </span>
        )}
      </p>

      {/* Custo: à direita no celular (1ª linha) e na coluna do desktop. */}
      <p className="text-right font-mono text-sm whitespace-nowrap tabular-nums">
        {cost ? (
          <span className="font-medium text-text-primary">{cost}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem custo informado</span>
          </span>
        )}
      </p>

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label="Ações do serviço"
            aria-describedby={identityId}
            className="-my-2.5 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1.5" align="end" aria-label="Ações do serviço">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setEditOpen(true);
            }}
            className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
          >
            <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Editar serviço
          </button>
          <div className="my-1.5 h-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              removalTriggerRef.current = triggerRef.current;
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir serviço
          </button>
        </PopoverContent>
      </Popover>

      {/*
        Celular, faixa de baixo em largura inteira (depois do "⋯" no DOM, então
        começa na 2ª linha da grade): data e km, fornecedor e vínculo, anexo.
      */}
      <div className="col-span-3 mt-0.5 flex min-w-0 flex-col gap-0.5 text-xs text-text-secondary md:hidden">
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
