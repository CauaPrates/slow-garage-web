import { Badge } from "@/components/ui/badge";
import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDateOnly } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { ProgressSummary } from "./ProjectProgress";
import {
  PROJECT_STATUS_PRESENTATION,

  moneyOrNull,
  projectDateParts,
  readProgress,
} from "./projectPresentation";
import { RowActionsMenu } from "@/components/ui/menu";
import type { ProjectWithProgress } from "./useProjects";

type ProjectListRowProps = {
  vehicleId: string;
  project: ProjectWithProgress;
  onEdit: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
  onDelete: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
};

type FigureProps = {
  label: string;
  value: string | null;
  emptyText: string;
  srEmpty?: string;
  /** Soma da view que deu 0: zero aqui pode ser "nenhum valor informado" — a view soma ausente como 0. */
  maybeMissing?: boolean;
};

function Figure({ label, value, emptyText, srEmpty, maybeMissing }: FigureProps) {
  return (
    // Rótulo à esquerda, número à direita: os três valores alinham pela borda direita.
    <div className="flex min-w-0 items-baseline justify-between gap-3">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-right text-sm break-words">
        {value && maybeMissing ? (
          <>
            <span className="type-figure text-text-primary">{value}</span>
            <span className="block text-xs text-text-secondary">
              <span className="sr-only">, </span>
              valores podem não estar informados
              <span className="sr-only">
                : a lista soma como zero o item sem valor; o projeto mostra quais itens têm valor
              </span>
            </span>
          </>
        ) : value ? (
          <span className="type-figure text-text-primary">{value}</span>
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
 * real e estimado como a view soma (itens não cancelados). A view soma valor
 * ausente como 0 e a lista não tem os itens pra distinguir: soma 0 sai como
 * "R$ 0,00" com "valores podem não estar informados", nunca como certeza.
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
  const hasSums = state.kind === "ready" && project.progress != null;
  const totalActual = hasSums ? (project.progress?.total_actual ?? null) : null;
  const totalEstimated = hasSums ? (project.progress?.total_estimated ?? null) : null;

  return (
    // A partir de `lg`: identificação e ações empilhadas à esquerda (sem vão entre elas), progresso e
    // valores à direita ocupando as duas linhas; a sobra de altura vai pra baixo das ações (`1fr`).
    <li className="flex flex-col gap-3 px-(--panel-pad-x) py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-1">
      <span id={identityId} className="sr-only">
        {project.name}, {status.label}
      </span>

      <div className="flex min-w-0 flex-col gap-1.5 lg:col-start-1 lg:row-start-1">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={href}
            tabIndex={-1}
            // `py-2.5` com margem negativa: alvo de 44px pro ponteiro sem mudar a altura da linha.
            className="-my-2.5 inline-block min-w-0 py-2.5 text-base font-semibold break-words text-text-primary hover:underline"
          >
            {project.name}
          </Link>
          <Badge tone={status.tone}>{status.label}</Badge>
        </h3>
        {project.description && (
          <p className="line-clamp-2 text-sm break-words text-text-secondary">{project.description}</p>
        )}
        <p className="text-xs text-text-secondary tabular-nums">
          {dates.length > 0 ? dates.join(" · ") : "Sem datas definidas"}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ProgressSummary state={state} />
        <dl className="flex flex-col gap-1">
          {/* Orçamento é coluna do projeto: zero salvo é zero de verdade, sem aviso. */}
          <Figure label="Orçamento" value={moneyOrNull(project.budget)} emptyText="Não definido" />
          <Figure
            label="Custo real"
            value={moneyOrNull(totalActual)}
            maybeMissing={totalActual === 0}
            emptyText="—"
            srEmpty="sem itens a somar"
          />
          <Figure
            label="Estimado"
            value={moneyOrNull(totalEstimated)}
            maybeMissing={totalEstimated === 0}
            emptyText="—"
            srEmpty="sem itens a somar"
          />
        </dl>
      </div>

      {/* Margens negativas: os alvos de 44px não somam um vão em branco embaixo da linha. */}
      <div className="-mx-2 -mb-2 flex items-center gap-1 lg:col-start-1 lg:row-start-2 lg:self-start">
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
        {/* Celular: "⋯" na borda direita. Desktop: logo depois de "Abrir projeto", sem flutuar no meio da linha. */}
        <span className="flex-1 lg:hidden" aria-hidden="true" />
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
