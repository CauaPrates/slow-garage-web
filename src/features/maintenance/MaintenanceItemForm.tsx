import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldError } from "@/components/ui/field-error";
import {
  maintenanceItemSchema,
  PRIORITY_LEVELS,
  PRIORITY_LEVEL_LABELS,
  type MaintenanceItemFormInput,
  type MaintenanceItemFormOutput,
} from "./schemas";

type MaintenanceItemFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<MaintenanceItemFormInput>;
  onSubmit: (values: MaintenanceItemFormOutput) => Promise<void>;
  submitLabel: string;
};

export function MaintenanceItemForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
}: MaintenanceItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceItemFormInput, unknown, MaintenanceItemFormOutput>({
    resolver: zodResolver(maintenanceItemSchema),
    defaultValues: {
      name: "",
      priority: "medium",
      isActive: true,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intervalKm">Intervalo (km)</Label>
          <Input
            id="intervalKm"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.intervalKm}
            {...register("intervalKm")}
          />
          <FieldError>{errors.intervalKm?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intervalMonths">Intervalo (meses)</Label>
          <Input
            id="intervalMonths"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.intervalMonths}
            {...register("intervalMonths")}
          />
          <FieldError>{errors.intervalMonths?.message}</FieldError>
        </div>
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

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" {...register("category")} />
            </div>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary">
                <span>Ativo</span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Ativo"
                />
              </label>
            )}
          />
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
