import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { History, Pencil, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { SkeletonList } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { EditNoteDialog } from "@/features/timeline/EditNoteDialog";
import { DeleteNoteDialog } from "@/features/timeline/DeleteNoteDialog";
import { entryFromEvent, viewLinkContext } from "@/features/timeline/timelinePresentation";
import { useGarageTimeline, type GarageTimelineEvent } from "@/features/vehicle/useGarageTimeline";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import {
  HEADER_ICON_BUTTON_CLASSNAME,
  HEADER_POPOVER_CLASSNAME,
  HEADER_POPOVER_LIST_CLASSNAME,
  NAV_EYEBROW_CLASSNAME,
} from "./navStyles";

type HeaderActivityMenuProps = {
  vehicles: VehicleWithSummary[];
};

type ActivityEntryProps = {
  event: GarageTimelineEvent;
  /** Nome do veículo — só quando a garagem tem mais de um. */
  vehicleLabel: string | null;
  /** Seguir "Ver" fecha o popover de quem envolve. */
  onNavigate: () => void;
};

/**
 * Etapa 15 — um evento da atividade recente no popover do cabeçalho. Era o
 * cartão do `TimelineItem`, com "Ver" de 35×16 e nome só "Ver" (medido na
 * etapa 13). Agora segue a linha do Histórico no celular: tipo e data no topo,
 * com a ação no canto dessa linha; o título embaixo, na largura toda, quebrando
 * em quantas linhas precisar.
 *
 * "Ver" é o mesmo link do Histórico: texto visível "Ver" no começo do nome e o
 * destino real no resto ("Ver lista de Manutenção, a partir de Troca de óleo e
 * filtro, 10/11/2026"; "Ver projeto, a partir de Comando de válvulas 272°…") —
 * o destino sai de `entryFromEvent`/`viewLinkContext`, as mesmas funções da
 * tela de Histórico, com a rota de sempre (`resolveTimelineLink`). Alvo de
 * 44×44 no próprio `<a>`. Sem destino (nota, tipo desconhecido), o de antes:
 * nota com "Editar nota"/"Excluir nota", tipo desconhecido sem ação.
 */
function ActivityEntry({ event, vehicleLabel, onNavigate }: ActivityEntryProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const identityId = useId();
  const entry = entryFromEvent(event.vehicle_id, event);
  const Icon = entry.icon;
  const date = entry.date ? formatDateOnly(entry.date) : null;
  const facts = [
    entry.odometerKm != null ? formatKm(entry.odometerKm) : null,
    entry.amount != null ? formatMoney(entry.amount) : null,
  ].filter(Boolean);

  return (
    <li className="flex gap-3 py-2">
      <Icon className="mt-3.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Qual registro as ações da nota afetam (dois "Editar nota" na lista não são iguais). */}
        <span id={identityId} className="sr-only">
          {entry.typeLabel}: {entry.title ?? "sem título"}
          {date ? `, ${date}` : ""}
        </span>

        {vehicleLabel && <p className={cn(NAV_EYEBROW_CLASSNAME, "pt-1 break-words")}>{vehicleLabel}</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="type-caption min-w-0 text-text-secondary">
            <span className="font-medium text-text-primary">{entry.typeLabel}</span>
            {date && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={entry.date ?? undefined} className="tabular-nums">
                  {date}
                </time>
              </>
            )}
          </p>

          <div className="-mr-1 flex shrink-0 items-center">
            {entry.note ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar nota"
                  aria-describedby={identityId}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir nota"
                  aria-describedby={identityId}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              entry.href && (
                <Link
                  to={entry.href}
                  onClick={onNavigate}
                  className={cn(textLinkClassName("xs"), "min-w-11 justify-center")}
                >
                  Ver<span className="sr-only"> {viewLinkContext(entry)}</span>
                </Link>
              )
            )}
          </div>
        </div>

        <p className="type-item-title text-text-primary">{entry.title ?? "Sem título"}</p>
        {facts.length > 0 && <p className="type-caption text-text-secondary tabular-nums">{facts.join(" · ")}</p>}
        {entry.description && (
          <p className="mt-0.5 line-clamp-2 text-sm break-words text-text-secondary">{entry.description}</p>
        )}
      </div>

      {entry.note && (
        <>
          <EditNoteDialog vehicleId={event.vehicle_id} note={entry.note} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteNoteDialog vehicleId={event.vehicle_id} note={entry.note} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
    </li>
  );
}

type ActivityFeedPanelProps = HeaderActivityMenuProps & {
  /** Chamado ao seguir um "Ver" — quem envolve fecha o popover. */
  onNavigate: () => void;
};

/**
 * Conteúdo da atividade recente, sem o popover em volta — reaproveitado pelo
 * `HeaderInboxMenu` (cabeçalho estreito, redesign etapa 02). Mesma fonte e
 * mesmo limite de antes (`useGarageTimeline`, 8 eventos, data mais recente
 * primeiro); o React Query serve as duas montagens do mesmo cache.
 *
 * Etapa 15: carregando diz o que carrega; a falha tem "Tentar de novo" (antes
 * era só o texto); vazio continua com o texto de sempre. Só a lista rola, sem
 * arrastar a página de fundo.
 */
export function ActivityFeedPanel({ vehicles, onNavigate }: ActivityFeedPanelProps) {
  const feedQuery = useGarageTimeline(vehicles.map((v) => v.id));
  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`]),
  );
  const showVehicleLabel = vehicles.length > 1;
  const rootRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(feedQuery.dataUpdatedAt, rootRef);

  return (
    <div ref={rootRef} tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
      {feedQuery.isLoading && <SkeletonList label="Carregando a atividade recente…" rows={3} className="p-0" />}

      {feedQuery.isError && (
        <InlineError onRetry={() => retry(feedQuery.refetch)} className="p-0">
          Não foi possível carregar a atividade recente.
        </InlineError>
      )}

      {feedQuery.data && feedQuery.data.length === 0 && (
        <p className="text-sm text-text-secondary">
          Nenhuma atividade registrada ainda. Registre um gasto, abastecimento
          ou manutenção pra começar.
        </p>
      )}

      {feedQuery.data && feedQuery.data.length > 0 && (
        <ul
          aria-label="Atividade recente"
          className={cn(HEADER_POPOVER_LIST_CLASSNAME, "-mx-3 divide-y divide-border px-3")}
        >
          {feedQuery.data.map((event) => (
            <ActivityEntry
              key={`${event.source_table}-${event.source_id}`}
              event={event}
              vehicleLabel={showVehicleLabel ? (vehicleLabelById.get(event.vehicle_id) ?? null) : null}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Fase 15: mesma posição de "olhar rápido" do `HeaderAlertsMenu` (ícone +
 * popover no cabeçalho), agora para a atividade recente que antes só
 * aparecia como card em "Minha Garagem" (`GarageActivityFeed`, removido) —
 * o usuário pediu explicitamente que não fosse mais uma página/aba, e sim
 * algo acessível de qualquer tela. Mesma fonte de dado e mesmo limite de 8
 * eventos que o card antigo usava (`useGarageTimeline`), sem mudança de
 * query.
 *
 * Etapa 15: seguir um "Ver" fecha o popover (antes ele ficava aberto sobre a
 * tela de destino, com o foco no link que já tinha sido usado).
 */
export function HeaderActivityMenu({ vehicles }: HeaderActivityMenuProps) {
  const [open, setOpen] = useState(false);
  if (vehicles.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Atividade recente"
          className={HEADER_ICON_BUTTON_CLASSNAME}
        >
          <History className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={HEADER_POPOVER_CLASSNAME} aria-labelledby="header-activity-title">
        <h2 id="header-activity-title" className="type-section-title mb-1 shrink-0 text-text-primary">
          Atividade recente
        </h2>
        <ActivityFeedPanel vehicles={vehicles} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
