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

export const PERIODS = ["all", "this-month", "last-month", "this-year"] as const;

export const PERIOD_LABELS: Record<(typeof PERIODS)[number], string> = {
  all: "Tudo",
  "this-month": "Este mês",
  "last-month": "Mês passado",
  "this-year": "Este ano",
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
  categoryId: z.string().min(1, "Selecione a categoria."),
  amount: requiredNonNegativeNumber("o valor"),
  description: z.string().trim().min(1, "Informe a descrição."),
  occurredOn: z.string().min(1, "Informe a data."),

  odometerKm: optionalNonNegativeInt("a quilometragem"),
  vendor: optionalText,
  paymentMethod: optionalEnum(PAYMENT_METHODS),
  notes: optionalText,
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormOutput = z.output<typeof expenseSchema>;

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const expenseAttachmentSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_ATTACHMENT_TYPES.includes(file.type), {
    message: "Envie uma imagem (JPEG, PNG, WebP) ou um PDF.",
  })
  .refine((file) => file.size <= MAX_ATTACHMENT_SIZE_BYTES, {
    message: "O arquivo precisa ter até 10MB.",
  });
