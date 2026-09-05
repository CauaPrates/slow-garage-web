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
  maintenanceRecordSchema,
  type MaintenanceRecordFormInput,
  type MaintenanceRecordFormOutput,
} from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type MaintenanceRecordFormProps = {
  mode: "create" | "edit";
  items: MaintenanceItemWithStatus[];
  defaultValues?: Partial<MaintenanceRecordFormInput>;
  onSubmit: (values: MaintenanceRecordFormOutput) => Promise<void>;
  submitLabel: string;
  children?: ReactNode;
};

/** RN-4: vínculo com item do plano é opcional — deixar em branco registra um reparo pontual não planejado. */
export function MaintenanceRecordForm({
  mode,
  items,
  defaultValues,
  onSubmit,
  submitLabel,
  children,
}: MaintenanceRecordFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRecordFormInput, unknown, MaintenanceRecordFormOutput>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      maintenanceItemId: "",
      name: "",
      odometerKm: "",
      performedOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  function handleItemChange(itemId: string) {
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (item && !getValues("name")) {
      setValue("name", item.name);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maintenanceItemId">Item do plano (opcional)</Label>
        <Select
          id="maintenanceItemId"
          {...register("maintenanceItemId", {
            onChange: (event) => handleItemChange(event.target.value),
          })}
        >
          <option value="">Nenhum — reparo avulso</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="odometerKm">Quilometragem (opcional)</Label>
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
          <Label htmlFor="performedOn">Data (opcional)</Label>
          <Input
            id="performedOn"
            type="date"
            aria-invalid={!!errors.performedOn}
            {...register("performedOn")}
          />
          <FieldError>{errors.performedOn?.message}</FieldError>
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor">Fornecedor</Label>
              <Input id="vendor" {...register("vendor")} />
            </div>
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
