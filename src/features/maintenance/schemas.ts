import { z } from "zod";
import { optionalNonNegativeInt, optionalNonNegativeNumber, optionalText } from "@/lib/schemaHelpers";

export const PRIORITY_LEVELS = ["low", "medium", "high"] as const;

export const PRIORITY_LEVEL_LABELS: Record<(typeof PRIORITY_LEVELS)[number], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/** Erro da periodicidade (nenhum dos dois intervalos) — o formulário o mostra uma vez, para os dois campos. */
export const INTERVAL_REQUIRED_MESSAGE = "Informe o intervalo em km, em meses ou os dois.";

/**
 * RN-3: o banco recusa os dois vazios — o cliente valida antes de qualquer chamada de rede.
 * Etapa 07: só os textos mudaram ("o intervalo em km inválido." não concordava); regras iguais.
 */
export const maintenanceItemSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome."),
    category: optionalText,
    intervalKm: optionalNonNegativeInt("o intervalo em km", "Intervalo em km inválido."),
    intervalMonths: optionalNonNegativeInt("o intervalo em meses", "Intervalo em meses inválido."),
    priority: z.enum(PRIORITY_LEVELS),
    description: optionalText,
    estimatedCost: optionalNonNegativeNumber("o custo estimado", "Custo estimado inválido."),
    notes: optionalText,
    isActive: z.boolean(),
  })
  .refine((data) => data.intervalKm !== undefined || data.intervalMonths !== undefined, {
    message: INTERVAL_REQUIRED_MESSAGE,
    path: ["intervalKm"],
  });

export type MaintenanceItemFormInput = z.input<typeof maintenanceItemSchema>;
export type MaintenanceItemFormOutput = z.output<typeof maintenanceItemSchema>;

/** RN-4: vínculo com item do plano é opcional — reparo pontual não planejado é um registro válido. */
export const maintenanceRecordSchema = z.object({
  maintenanceItemId: optionalText,
  name: z.string().trim().min(1, "Informe o nome."),
  odometerKm: optionalNonNegativeInt("a quilometragem", "Quilometragem inválida."),
  performedOn: optionalText,
  cost: optionalNonNegativeNumber("o custo", "Custo inválido."),
  vendor: optionalText,
  notes: optionalText,
});

export type MaintenanceRecordFormInput = z.input<typeof maintenanceRecordSchema>;
export type MaintenanceRecordFormOutput = z.output<typeof maintenanceRecordSchema>;
