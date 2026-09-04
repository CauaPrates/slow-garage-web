import { z } from "zod";
import {
  Car,
  Droplet,
  FileText,
  Fuel,
  Hammer,
  Paintbrush,
  Shield,
  Sparkles,
  Tag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  optionalEnum,
  optionalNonNegativeInt,
  optionalText,
  requiredNonNegativeNumber,
} from "@/lib/schemaHelpers";

export const PAYMENT_METHODS = [
  "cash",
  "debit_card",
  "credit_card",
  "pix",
  "bank_transfer",
  "other",
] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Dinheiro",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  pix: "Pix",
  bank_transfer: "Transferência",
  other: "Outro",
};

/**
 * `expense_categories.icon` não vem preenchido pelo backend para as 12
 * categorias de sistema (confirmado direto no banco de dev) — o ícone é
 * decisão só de apresentação do frontend, mapeado por `slug`. Categoria
 * sem entrada aqui (ex.: uma futura categoria própria) cai no fallback.
 */
export const EXPENSE_CATEGORY_ICON_BY_SLUG: Record<string, LucideIcon> = {
  fuel: Fuel,
  maintenance: Wrench,
  upgrade: Sparkles,
  aesthetics: Paintbrush,
  parts: Hammer,
  labor: Wrench,
  insurance: Shield,
  documentation: FileText,
  financing: FileText,
  cleaning: Droplet,
  tires: Car,
};
export const EXPENSE_CATEGORY_ICON_FALLBACK: LucideIcon = Tag;

export const expenseSchema = z.object({
  categoryId: optionalText,
  amount: requiredNonNegativeNumber("o valor"),
  description: optionalText,
  occurredOn: optionalText,

  odometerKm: optionalNonNegativeInt("a quilometragem"),
  vendor: optionalText,
  paymentMethod: optionalEnum(PAYMENT_METHODS),
  notes: optionalText,
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormOutput = z.output<typeof expenseSchema>;
