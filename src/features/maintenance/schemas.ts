import { z } from "zod";
import { optionalNonNegativeInt, optionalNonNegativeNumber, optionalText } from "@/lib/schemaHelpers";

export const PRIORITY_LEVELS = ["low", "medium", "high"] as const;

export const PRIORITY_LEVEL_LABELS: Record<(typeof PRIORITY_LEVELS)[number], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/** RN-3: o banco recusa os dois vazios — o cliente valida antes de qualquer chamada de rede. */
export const maintenanceItemSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome."),
    category: optionalText,
    intervalKm: optionalNonNegativeInt("o intervalo em km"),
    intervalMonths: optionalNonNegativeInt("o intervalo em meses"),
    priority: z.enum(PRIORITY_LEVELS),
    description: optionalText,
    estimatedCost: optionalNonNegativeNumber("o custo estimado"),
    notes: optionalText,
    isActive: z.boolean(),
  })
  .refine((data) => data.intervalKm !== undefined || data.intervalMonths !== undefined, {
    message: "Informe o intervalo por quilometragem ou por mês (pelo menos um dos dois).",
    path: ["intervalKm"],
  });

export type MaintenanceItemFormInput = z.input<typeof maintenanceItemSchema>;
export type MaintenanceItemFormOutput = z.output<typeof maintenanceItemSchema>;

/** RN-4: vínculo com item do plano é opcional — reparo pontual não planejado é um registro válido. */
export const maintenanceRecordSchema = z.object({
  maintenanceItemId: optionalText,
  name: z.string().trim().min(1, "Informe o nome."),
  odometerKm: optionalNonNegativeInt("a quilometragem"),
  performedOn: optionalText,
  cost: optionalNonNegativeNumber("o custo"),
  vendor: optionalText,
  notes: optionalText,
});

export type MaintenanceRecordFormInput = z.input<typeof maintenanceRecordSchema>;
export type MaintenanceRecordFormOutput = z.output<typeof maintenanceRecordSchema>;
