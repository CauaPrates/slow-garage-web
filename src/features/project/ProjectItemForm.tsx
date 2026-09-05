import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { PRIORITY_LEVELS, PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import {
  projectItemSchema,
  PROJECT_ITEM_STATUSES,
  PROJECT_ITEM_STATUS_LABELS,
  type ProjectItemFormInput,
  type ProjectItemFormOutput,
} from "./schemas";
export type ProjectOption = { id: string; name: string };

type ProjectItemFormProps = {
  mode: "create" | "edit";
  /** Lista pra escolher o projeto. Com `fixedProjectId`, é a única opção (select desabilitado) — mesmo padrão do seletor de veículo único da Fase 3. */
  projects: ProjectOption[];
  fixedProjectId?: string;
  defaultValues?: Partial<ProjectItemFormInput>;
  onSubmit: (values: ProjectItemFormOutput) => Promise<void>;
  submitLabel: string;
  children?: ReactNode;
};

export function ProjectItemForm({
  mode,
  projects,
  fixedProjectId,
  defaultValues,
  onSubmit,
  submitLabel,
  children,
}: ProjectItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectItemFormInput, unknown, ProjectItemFormOutput>({
    resolver: zodResolver(projectItemSchema),
    defaultValues: {
      projectId: fixedProjectId ?? "",
      name: "",
      status: "wishlist",
      priority: "medium",
      ...defaultValues,
    },
  });

  const projectOptions = fixedProjectId
    ? projects.filter((p) => p.id === fixedProjectId)
    : projects;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="projectId">Projeto</Label>
        <Select
          id="projectId"
          disabled={!!fixedProjectId}
          defaultValue={fixedProjectId ?? ""}
          aria-invalid={!!errors.projectId}
          {...register("projectId")}
        >
          {!fixedProjectId && (
            <option value="" disabled>
              Selecione
            </option>
          )}
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <FieldError>{errors.projectId?.message}</FieldError>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            {PROJECT_ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PROJECT_ITEM_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Prioridade</Label>
          <Select id="priority" {...register("priority")}>
            {PRIORITY_LEVELS.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LEVEL_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estimatedCost">Custo estimado</Label>
              <Input
                id="estimatedCost"
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-invalid={!!errors.estimatedCost}
                {...register("estimatedCost")}
              />
              <FieldError>{errors.estimatedCost?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="actualCost">Custo real</Label>
              <Input
                id="actualCost"
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-invalid={!!errors.actualCost}
                {...register("actualCost")}
              />
              <FieldError>{errors.actualCost?.message}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor">Fornecedor</Label>
              <Input id="vendor" {...register("vendor")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="occurredOn">Data</Label>
              <Input id="occurredOn" type="date" {...register("occurredOn")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="externalUrl">Link externo</Label>
            <Input id="externalUrl" type="url" {...register("externalUrl")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          {children}
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
