import { z } from "zod";
import {
  optionalText,
  requiredNonNegativeInt,
  requiredNonNegativeNumber,
} from "@/lib/schemaHelpers";
import { FUEL_TYPES } from "@/features/vehicle/schemas";

export const fuelLogSchema = z.object({
  // Obrigatórios visíveis
  odometerKm: requiredNonNegativeInt("a quilometragem"),
  liters: requiredNonNegativeNumber("os litros"),
  totalAmount: requiredNonNegativeNumber("o valor total"),
  isFullTank: z.boolean(),

  // "Mais detalhes" — pré-preenchidos, editáveis
  occurredOn: z.string().min(1, "Informe a data."),
  fuelType: z.enum(FUEL_TYPES, { message: "Selecione o combustível." }),
  station: optionalText,
  missedPreviousFill: z.boolean(),
  notes: optionalText,
});

export type FuelLogFormInput = z.input<typeof fuelLogSchema>;
export type FuelLogFormOutput = z.output<typeof fuelLogSchema>;
