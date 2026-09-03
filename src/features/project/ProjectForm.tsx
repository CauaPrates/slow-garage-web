import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import {
  projectSchema,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectFormInput,
  type ProjectFormOutput,
} from "./schemas";

type ProjectFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ProjectFormInput>;
  onSubmit: (values: ProjectFormOutput) => Promise<void>;
  submitLabel: string;
};

export function ProjectForm({ mode, defaultValues, onSubmit, submitLabel }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      status: "idea",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...register("status")}>
          {PROJECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PROJECT_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget">Orçamento</Label>
            <Input
              id="budget"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.budget}
              {...register("budget")}
            />
            <FieldError>{errors.budget?.message}</FieldError>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startedOn">Início</Label>
              <Input id="startedOn" type="date" {...register("startedOn")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetDate">Data alvo</Label>
              <Input id="targetDate" type="date" {...register("targetDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="completedOn">Conclusão</Label>
              <Input id="completedOn" type="date" {...register("completedOn")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
