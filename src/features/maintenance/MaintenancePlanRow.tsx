import { useId, useRef, useState } from "react";
import { ChevronDown, MoreHorizontal, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  INACTIVE_PRESENTATION,
  STATUS_PRESENTATION,
  intervalDescription,
  itemStatus,
  lastServiceLabel,
  nextReferences,
} from "./maintenancePresentation";
import { PRIORITY_LEVEL_LABELS } from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type MaintenancePlanRowProps = {
  item: MaintenanceItemWithStatus;
  currentOdometerKm: number | null;
  onRegisterService: (item: MaintenanceItemWithStatus, trigger: HTMLElement | null) => void;
  onEdit: (item: MaintenanceItemWithStatus, trigger: HTMLElement | null) => void;
  onDelete: (item: MaintenanceItemWithStatus, trigger: HTMLElement | null) => void;
};

/**
 * Colunas do plano a partir de `xl`: item (nome, situação, periodicidade,
 * prioridade) · próxima referência · ações. Abaixo disso a coluna do item
 * ficava com ~150px, então a linha empilha como no celular. O cabeçalho usa o mesmo
 * molde. A situação fica colada ao nome (é o que se lê junto) e a referência
 * numa coluna própria, alinhada entre as linhas. A coluna das ações tem
 * largura fixa (cabe "Detalhes", "Registrar serviço" e o "⋯"): com `auto`, o
 * cabeçalho — que não tem botões — desalinhava da referência.
 */
export const PLAN_ROW_GRID = "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_19.5rem] xl:items-start xl:gap-x-4";

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

const BADGE_CLASSNAME = "inline-flex shrink-0 items-center rounded-full border px-2 text-xs leading-5 font-medium whitespace-nowrap";

/**
 * Etapa 07: um item do plano. Primeiro o nome com a situação (da view, em
 * texto e cor) e a próxima referência — data e/ou km, só dos intervalos que o
 * item acompanha, com "faltam/passou X km" quando há odômetro. Prioridade
 * aparece como texto neutro na linha da periodicidade: é escolha de quem
 * cadastrou, não prazo. Inativo troca a situação por "Inativo" (o item não
 * gera alerta).
 *
 * "Detalhes" (botão com `aria-expanded`) abre última execução, custo
 * estimado, categoria, descrição e notas. "Registrar serviço" abre o cadastro
 * de serviço com este item já vinculado; editar e excluir ficam no "⋯".
 */
export function MaintenancePlanRow({
  item,
  currentOdometerKm,
  onRegisterService,
  onEdit,
  onDelete,
}: MaintenancePlanRowProps) {
  const identityId = useId();
  const detailsId = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const status = itemStatus(item);
  const badge = item.is_active ? STATUS_PRESENTATION[status] : INACTIVE_PRESENTATION;
  const references = nextReferences(item, currentOdometerKm, { neutral: !item.is_active });
  const lastService = lastServiceLabel(item);
  const meta = [intervalDescription(item), `Prioridade ${PRIORITY_LEVEL_LABELS[item.priority].toLowerCase()}`, item.category]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={cn("flex flex-col gap-2 px-4 py-3", PLAN_ROW_GRID)}>
      {/* Lido como contexto dos botões da linha: qual item eles afetam. */}
      <span id={identityId} className="sr-only">
        {item.name}, {badge.label}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 text-sm font-medium break-words text-text-primary">{item.name}</span>
          <span className={cn(BADGE_CLASSNAME, badge.className)}>{badge.label}</span>
        </p>
        <p className="text-xs break-words text-text-secondary">{meta}</p>
      </div>

      {/* Próxima referência: texto inteiro (data e km), nunca só número. */}
      <div className="flex min-w-0 flex-col gap-0.5 text-sm tabular-nums xl:pt-px">
        <span className="sr-only">Próxima referência: </span>
        {references.length > 0 ? (
          references.map((line) => (
            <p key={line.key} className={line.secondary ? "text-xs text-text-secondary" : "text-text-primary"}>
              {line.text}
              {line.detail && <span className="text-text-secondary"> · {line.detail}</span>}
            </p>
          ))
        ) : (
          <p className="text-xs text-text-secondary">
            {item.status
              ? "Sem execução registrada. Começa a contar quando um serviço vinculado for registrado com quilometragem."
              : "Situação indisponível."}
          </p>
        )}
      </div>

      <div className="-mx-2 flex items-center gap-1 xl:mx-0 xl:-my-1 xl:justify-end">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          aria-describedby={identityId}
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
        >
          Detalhes
          <ChevronDown
            className={cn(
              "h-4 w-4 motion-safe:transition-transform motion-safe:duration-(--duration-base)",
              detailsOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <span className="flex-1 xl:hidden" aria-hidden="true" />
        <Button
          variant="ghost"
          aria-describedby={identityId}
          onClick={(event) => onRegisterService(item, event.currentTarget)}
          className="shrink-0 px-2.5"
        >
          <Wrench className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          Registrar serviço
        </Button>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon"
              aria-label="Ações do item do plano"
              aria-describedby={identityId}
              className="shrink-0 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-1.5" align="end" aria-label="Ações do item do plano">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(item, triggerRef.current);
              }}
              className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
            >
              <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              Editar item do plano
            </button>
            <div className="my-1.5 h-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(item, triggerRef.current);
              }}
              className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Excluir item do plano
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Fechado: `hidden` (continua montado). Em linha inteira no desktop. */}
      <dl
        id={detailsId}
        hidden={!detailsOpen}
        className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border bg-bg px-3 py-2.5 text-sm sm:grid-cols-2 xl:col-span-3"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Última execução</dt>
          <dd className="text-text-primary tabular-nums">{lastService ?? "Nenhuma registrada"}</dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Custo estimado</dt>
          <dd className={item.estimated_cost != null ? "font-mono text-text-primary" : "text-text-secondary"}>
            {item.estimated_cost != null ? formatMoney(item.estimated_cost) : "Não informado"}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Categoria</dt>
          <dd className={cn("break-words", item.category ? "text-text-primary" : "text-text-secondary")}>
            {item.category ?? "Não informada"}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Acompanhamento</dt>
          <dd className="text-text-primary">{item.is_active ? "Ativo" : "Inativo — sem vencimento nem alerta"}</dd>
        </div>
        {item.description && (
          <div className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
            <dt className="text-xs text-text-secondary">Descrição</dt>
            <dd className="break-words whitespace-pre-line text-text-primary">{item.description}</dd>
          </div>
        )}
        {item.notes && (
          <div className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
            <dt className="text-xs text-text-secondary">Notas</dt>
            <dd className="break-words whitespace-pre-line text-text-primary">{item.notes}</dd>
          </div>
        )}
      </dl>
    </li>
  );
}
