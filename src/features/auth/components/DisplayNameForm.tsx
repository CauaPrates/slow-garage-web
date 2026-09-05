import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { displayNameSchema, type DisplayNameInput } from "../schemas";
import { useProfile, useUpdateDisplayName } from "../useProfile";

export function DisplayNameForm() {
  const { data: profile } = useProfile();
  const updateDisplayName = useUpdateDisplayName();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DisplayNameInput>({ resolver: zodResolver(displayNameSchema) });

  useEffect(() => {
    if (profile) {
      reset({ displayName: profile.display_name ?? "" });
    }
  }, [profile, reset]);

  async function onSubmit(values: DisplayNameInput) {
    setSaved(false);
    await updateDisplayName.mutateAsync(values.displayName ?? "");
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display-name">Nome de exibição</Label>
        <Input
          id="display-name"
          type="text"
          aria-invalid={!!errors.displayName}
          {...register("displayName")}
        />
        <FieldError>{errors.displayName?.message}</FieldError>
      </div>
      {updateDisplayName.isError && (
        <FieldError>Não foi possível salvar. Tente de novo.</FieldError>
      )}
      {saved && !updateDisplayName.isPending && (
        <p role="status" aria-live="polite" className="text-sm text-success">
          Salvo.
        </p>
      )}
      <Button
        type="submit"
        className="self-end"
        disabled={isSubmitting || updateDisplayName.isPending}
      >
        {updateDisplayName.isPending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
