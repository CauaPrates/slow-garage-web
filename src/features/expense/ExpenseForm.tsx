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
import {
  expenseSchema,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from "./schemas";
import type { useExpenseCategories } from "./useExpenseCategories";

type ExpenseFormProps = {
  mode: "create" | "edit";
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultValues?: Partial<ExpenseFormInput>;
  onSubmit: (values: ExpenseFormOutput) => Promise<void>;
  submitLabel: string;
  children?: ReactNode;
};

export function ExpenseForm({
  mode,
  categories,
  defaultValues,
  onSubmit,
  submitLabel,
  children,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      description: "",
      occurredOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoria (opcional)</Label>
          <Select
            id="categoryId"
            defaultValue=""
            aria-invalid={!!errors.categoryId}
            {...register("categoryId")}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
          <FieldError>{errors.categoryId?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredOn">Data</Label>
          <Input
            id="occurredOn"
            type="date"
            aria-invalid={!!errors.occurredOn}
            {...register("occurredOn")}
          />
          <FieldError>{errors.occurredOn?.message}</FieldError>
        </div>
      </div>

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
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor">Fornecedor</Label>
              <Input id="vendor" {...register("vendor")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paymentMethod">Forma de pagamento</Label>
            <Select id="paymentMethod" defaultValue="" {...register("paymentMethod")}>
              <option value="">Não informado</option>
              {PAYMENT_METHODS.map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_METHOD_LABELS[value]}
                </option>
              ))}
            </Select>
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
