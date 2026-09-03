import { formatMoney } from "@/lib/format";
import type { ProjectProgressRow } from "./useProjects";

type ProjectProgressProps = {
  progress: ProjectProgressRow | null;
};

/** RN-1: tudo aqui vem pronto de `project_progress` — `null` é "sem dado" (projeto sem item, ou sem orçamento), exibido como "—", nunca `0%`. */
export function ProjectProgress({ progress }: ProjectProgressProps) {
  const pctItems = progress?.pct_items_completed;
  const pctBudget = progress?.pct_budget_used;

  return (
    <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 text-sm">
      <div>
        <dt className="text-text-secondary">Itens concluídos</dt>
        <dd className="text-text-primary">
          {pctItems != null
            ? `${progress?.completed_items ?? 0} de ${progress?.total_items ?? 0} (${Math.round(pctItems)}%)`
            : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-text-secondary">Orçamento usado</dt>
        <dd className="text-text-primary">
          {pctBudget != null
            ? `${formatMoney(progress?.total_actual ?? 0)} de ${formatMoney(progress?.budget ?? 0)} (${Math.round(pctBudget)}%)`
            : "—"}
        </dd>
      </div>
    </dl>
  );
}
