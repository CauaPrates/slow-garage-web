import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import {
  obligationSchema,
  OBLIGATION_KINDS,
  OBLIGATION_KIND_LABELS,
  type ObligationFormInput,
  type ObligationFormOutput,
} from "./schemas";

type ObligationFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ObligationFormInput>;
  onSubmit: (values: ObligationFormOutput) => Promise<void>;
  submitLabel: string;
};

export function ObligationForm({ mode, defaultValues, onSubmit, submitLabel }: ObligationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObligationFormInput, unknown, ObligationFormOutput>({
    resolver: zodResolver(obligationSchema),
    defaultValues: {
      kind: "other",
      label: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kind">Tipo (opcional)</Label>
          <Select id="kind" {...register("kind")}>
            {OBLIGATION_KINDS.map((value) => (
              <option key={value} value={value}>
                {OBLIGATION_KIND_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label">Rótulo</Label>
          <Input id="label" aria-invalid={!!errors.label} {...register("label")} />
          <FieldError>{errors.label?.message}</FieldError>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dueOn">Vencimento (opcional)</Label>
        <Input
          id="dueOn"
          type="date"
          aria-invalid={!!errors.dueOn}
          {...register("dueOn")}
        />
        <FieldError>{errors.dueOn?.message}</FieldError>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
              <FieldError>{errors.amount?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provider">Fornecedor</Label>
              <Input id="provider" {...register("provider")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          {mode === "edit" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paidOn">Paga em</Label>
              <Input id="paidOn" type="date" {...register("paidOn")} />
              <p className="text-xs text-text-secondary">
                Limpar esta data volta a obrigação para pendente.
              </p>
            </div>
          )}
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
