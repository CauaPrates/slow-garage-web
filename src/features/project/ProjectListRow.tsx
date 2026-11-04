import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDateOnly } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ProgressSummary } from "./ProjectProgress";
import {
  PROJECT_STATUS_PRESENTATION,
  STATUS_BADGE_CLASSNAME,
  moneyOrNull,
  projectDateParts,
  readProgress,
} from "./projectPresentation";
import { RowActionsMenu } from "./RowActionsMenu";
import type { ProjectWithProgress } from "./useProjects";

type ProjectListRowProps = {
  vehicleId: string;
  project: ProjectWithProgress;
  onEdit: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
  onDelete: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
};

function Figure({ label, value, emptyText, srEmpty }: { label: string; value: string | null; emptyText: string; srEmpty?: string }) {
  return (
    // Rótulo à esquerda, número à direita: os três valores alinham pela borda direita.
    <div className="flex min-w-0 items-baseline justify-between gap-3">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-right text-sm break-words">
        {value ? (
          <span className="font-mono text-text-primary tabular-nums">{value}</span>
        ) : srEmpty ? (
          <span className="text-text-secondary">
            <span aria-hidden="true">{emptyText}</span>
            <span className="sr-only">{srEmpty}</span>
          </span>
        ) : (
          <span className="text-text-secondary">{emptyText}</span>
        )}
      </dd>
    </div>
  );
}

/**
 * Etapa 09: um projeto na lista. Nome (quebra, nunca corta) e situação em selo;
 * descrição em até duas linhas (inteira no detalhe); datas preenchidas. À
 * direita (a partir de `lg`; embaixo no celular) o progresso da
 * `project_progress` — barra + "N de M itens instalados" — e orçamento, custo
 * real e estimado como a view soma (itens não cancelados).
 *
 * "Abrir projeto →" é o caminho de teclado; o nome também abre o detalhe pro
 * ponteiro, fora da ordem de Tab (um destino, uma parada — padrão do card de
 * veículo, ADR-085). Editar e excluir no "⋯"; nada é aninhado.
 */
export function ProjectListRow({ vehicleId, project, onEdit, onDelete }: ProjectListRowProps) {
  const identityId = useId();
  const status = PROJECT_STATUS_PRESENTATION[project.status];
  const state = readProgress(project.progress);
  const href = ROUTES.vehicleProject(vehicleId, project.id);
  const dates = projectDateParts(project, formatDateOnly);
  const hasSums = state.kind !== "unknown" && project.progress != null;

  return (
    <li className="flex flex-col gap-3 px-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-x-8 lg:gap-y-2">
      <span id={identityId} className="sr-only">
        {project.name}, {status.label}
      </span>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={href}
            tabIndex={-1}
            // `py-2.5` com margem negativa: alvo de 44px pro ponteiro sem mudar a altura da linha.
            className="-my-2.5 inline-block min-w-0 py-2.5 text-base font-semibold break-words text-text-primary hover:underline"
          >
            {project.name}
          </Link>
          <span className={cn(STATUS_BADGE_CLASSNAME, status.className)}>{status.label}</span>
        </h3>
        {project.description && (
          <p className="line-clamp-2 text-sm break-words text-text-secondary">{project.description}</p>
        )}
        <p className="text-xs text-text-secondary tabular-nums">
          {dates.length > 0 ? dates.join(" · ") : "Sem datas definidas"}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <ProgressSummary state={state} />
        <dl className="flex flex-col gap-1">
          <Figure label="Orçamento" value={moneyOrNull(project.budget)} emptyText="Não definido" />
          <Figure
            label="Custo real"
            value={hasSums && state.kind === "ready" ? moneyOrNull(project.progress?.total_actual) : null}
            emptyText="—"
            srEmpty="sem itens a somar"
          />
          <Figure
            label="Estimado"
            value={hasSums && state.kind === "ready" ? moneyOrNull(project.progress?.total_estimated) : null}
            emptyText="—"
            srEmpty="sem itens a somar"
          />
        </dl>
      </div>

      {/* Margens negativas: os alvos de 44px não somam um vão em branco embaixo da linha. */}
      <div className="-mx-2 -mb-2 flex items-center gap-1 lg:col-span-2">
        <Link
          to={href}
          aria-describedby={identityId}
          className="group inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          Abrir projeto
          <ArrowRight
            className="h-4 w-4 text-accent motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        <span className="flex-1" aria-hidden="true" />
        <RowActionsMenu
          label="Ações do projeto"
          editLabel="Editar projeto"
          deleteLabel="Excluir projeto"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(project, trigger)}
          onDelete={(trigger) => onDelete(project, trigger)}
        />
      </div>
    </li>
  );
}
