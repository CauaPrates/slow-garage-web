import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { todayDateOnly } from "@/lib/format";
import { PRIORITY_LEVELS, PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import {
  issueSchema,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type IssueFormInput,
  type IssueFormOutput,
} from "./schemas";

type IssueFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<IssueFormInput>;
  onSubmit: (values: IssueFormOutput) => Promise<void>;
  submitLabel: string;
  children?: ReactNode;
};

export function IssueForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  children,
}: IssueFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormInput, unknown, IssueFormOutput>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      reportedOn: todayDateOnly(),
      priority: "medium",
      status: "open",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        <FieldError>{errors.title?.message}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reportedOn">Data do relato (opcional)</Label>
          <Input
            id="reportedOn"
            type="date"
            aria-invalid={!!errors.reportedOn}
            {...register("reportedOn")}
          />
          <FieldError>{errors.reportedOn?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            {ISSUE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ISSUE_STATUS_LABELS[value]}
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
              <Label htmlFor="priority">Prioridade</Label>
              <Select id="priority" {...register("priority")}>
                {PRIORITY_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LEVEL_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="odometerKm">Quilometragem</Label>
              <Input
                id="odometerKm"
                type="number"
                inputMode="numeric"
                aria-invalid={!!errors.odometerKm}
                {...register("odometerKm")}
              />
              <FieldError>{errors.odometerKm?.message}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea id="diagnosis" {...register("diagnosis")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resolvedOn">Data de resolução</Label>
              <Input id="resolvedOn" type="date" {...register("resolvedOn")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cost">Custo</Label>
              <Input
                id="cost"
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-invalid={!!errors.cost}
                {...register("cost")}
              />
              <FieldError>{errors.cost?.message}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolution">Resolução</Label>
            <Textarea id="resolution" {...register("resolution")} />
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
