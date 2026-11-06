import { useId, useState } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisclosureButton, INSET_CLASSNAME } from "@/components/ui/disclosure";
import { RowActionsMenu } from "@/components/ui/menu";
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

  const status = itemStatus(item);
  const badge = item.is_active ? STATUS_PRESENTATION[status] : INACTIVE_PRESENTATION;
  const references = nextReferences(item, currentOdometerKm, { neutral: !item.is_active });
  const lastService = lastServiceLabel(item);
  const meta = [intervalDescription(item), `Prioridade ${PRIORITY_LEVEL_LABELS[item.priority].toLowerCase()}`, item.category]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={cn("flex flex-col gap-2 px-(--panel-pad-x) py-3", PLAN_ROW_GRID)}>
      {/* Lido como contexto dos botões da linha: qual item eles afetam. */}
      <span id={identityId} className="sr-only">
        {item.name}, {badge.label}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="type-item-title min-w-0 text-text-primary">{item.name}</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
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
        <DisclosureButton
          open={detailsOpen}
          controls={detailsId}
          describedBy={identityId}
          onToggle={() => setDetailsOpen((open) => !open)}
        >
          Detalhes
        </DisclosureButton>
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
        <RowActionsMenu
          label="Ações do item do plano"
          editLabel="Editar item do plano"
          deleteLabel="Excluir item do plano"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(item, trigger)}
          onDelete={(trigger) => onDelete(item, trigger)}
        />
      </div>

      {/* Fechado: `hidden` (continua montado). Em linha inteira no desktop. */}
      <dl
        id={detailsId}
        hidden={!detailsOpen}
        className={cn("grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:col-span-3", INSET_CLASSNAME)}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Última execução</dt>
          <dd className="text-text-primary tabular-nums">{lastService ?? "Nenhuma registrada"}</dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-text-secondary">Custo estimado</dt>
          <dd className={item.estimated_cost != null ? "type-value text-sm text-text-primary" : "text-text-secondary"}>
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
