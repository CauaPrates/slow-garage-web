import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { todayDateOnly } from "@/lib/format";
import { noteSchema, type NoteFormInput, type NoteFormOutput } from "./schemas";

type NoteFormProps = {
  defaultValues?: Partial<NoteFormInput>;
  onSubmit: (values: NoteFormOutput) => Promise<void>;
  submitLabel: string;
};

/** Sem seção "mais detalhes" — nota tem só 4 campos, todos sempre visíveis (diferente das demais fases, que colapsam o secundário). */
export function NoteForm({ defaultValues, onSubmit, submitLabel }: NoteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormInput, unknown, NoteFormOutput>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      occurredOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        <FieldError>{errors.title?.message}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredOn">Data (opcional)</Label>
          <Input
            id="occurredOn"
            type="date"
            aria-invalid={!!errors.occurredOn}
            {...register("occurredOn")}
          />
          <FieldError>{errors.occurredOn?.message}</FieldError>
        </div>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Anotação</Label>
        <Textarea id="body" {...register("body")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
