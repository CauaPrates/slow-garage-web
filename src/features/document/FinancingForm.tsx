import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import {
  financingSchema,
  type FinancingFormInput,
  type FinancingFormOutput,
} from "./schemas";

type FinancingFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<FinancingFormInput>;
  onSubmit: (values: FinancingFormOutput) => Promise<void>;
  submitLabel: string;
};

export function FinancingForm({ mode, defaultValues, onSubmit, submitLabel }: FinancingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinancingFormInput, unknown, FinancingFormOutput>({
    resolver: zodResolver(financingSchema),
    defaultValues: {
      installmentsPaid: "0",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="financedAmount">Valor financiado (opcional)</Label>
          <Input
            id="financedAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.financedAmount}
            {...register("financedAmount")}
          />
          <FieldError>{errors.financedAmount?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installmentAmount">Valor da parcela (opcional)</Label>
          <Input
            id="installmentAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.installmentAmount}
            {...register("installmentAmount")}
          />
          <FieldError>{errors.installmentAmount?.message}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installmentCount">Quantidade de parcelas (opcional)</Label>
          <Input
            id="installmentCount"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.installmentCount}
            {...register("installmentCount")}
          />
          <FieldError>{errors.installmentCount?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startedOn">Início</Label>
          <Input
            id="startedOn"
            type="date"
            aria-invalid={!!errors.startedOn}
            {...register("startedOn")}
          />
          <FieldError>{errors.startedOn?.message}</FieldError>
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installmentsPaid">Parcelas já pagas</Label>
              <Input
                id="installmentsPaid"
                type="number"
                inputMode="numeric"
                aria-invalid={!!errors.installmentsPaid}
                {...register("installmentsPaid")}
              />
              <FieldError>{errors.installmentsPaid?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interestRateMonthly">Taxa de juros mensal (%)</Label>
              <Input
                id="interestRateMonthly"
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-invalid={!!errors.interestRateMonthly}
                {...register("interestRateMonthly")}
              />
              <FieldError>{errors.interestRateMonthly?.message}</FieldError>
            </div>
          </div>
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
