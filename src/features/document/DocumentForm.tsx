import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import {
  documentSchema,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  type DocumentFormInput,
  type DocumentFormOutput,
} from "./schemas";

type DocumentFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<DocumentFormInput>;
  onSubmit: (values: DocumentFormOutput) => Promise<void>;
  submitLabel: string;
  /** Só usado no criar — campo de arquivo vive fora do schema, mesmo padrão do anexo genérico. */
  children?: ReactNode;
};

export function DocumentForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  children,
}: DocumentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormInput, unknown, DocumentFormOutput>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      docType: "other",
      title: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="docType">Tipo (opcional)</Label>
          <Select id="docType" {...register("docType")}>
            {DOCUMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
          <FieldError>{errors.title?.message}</FieldError>
        </div>
      </div>

      {mode === "create" && children}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="issuedOn">Emitido em</Label>
          <Input id="issuedOn" type="date" {...register("issuedOn")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiresOn">Vence em</Label>
          <Input id="expiresOn" type="date" {...register("expiresOn")} />
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
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
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
