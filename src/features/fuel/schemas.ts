import { z } from "zod";
import {
  optionalEnum,
  optionalNonNegativeInt,
  optionalText,
  requiredNonNegativeNumber,
} from "@/lib/schemaHelpers";
import { FUEL_TYPES } from "@/features/vehicle/schemas";

export const fuelLogSchema = z.object({
  // Obrigatórios visíveis. Etapa 06: só o texto do valor inválido mudou (concordância); a regra é a mesma.
  odometerKm: optionalNonNegativeInt("a quilometragem", "Quilometragem inválida."),
  liters: requiredNonNegativeNumber("os litros", "Litros inválidos."),
  totalAmount: requiredNonNegativeNumber("o valor total", "Valor total inválido."),
  isFullTank: z.boolean(),

  // "Detalhes" — pré-preenchidos, editáveis
  occurredOn: optionalText,
  fuelType: optionalEnum(FUEL_TYPES),
  station: optionalText,
  missedPreviousFill: z.boolean(),
  notes: optionalText,
});

export type FuelLogFormInput = z.input<typeof fuelLogSchema>;
export type FuelLogFormOutput = z.output<typeof fuelLogSchema>;
