import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form";
import { InlineError } from "@/components/ui/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { displayNameSchema, type DisplayNameInput } from "../schemas";
import { useProfile, useUpdateDisplayName } from "../useProfile";
import { SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";

/**
 * Nome de exibição (`profiles.display_name`): só muda ao salvar.
 *
 * Etapa 14: o campo só aparece com o perfil carregado. Antes ele nascia vazio
 * com "Salvar" ativo enquanto o perfil carregava — e continuava assim se o
 * perfil não carregasse; salvar ali gravava `null` por cima do nome.
 */
export function DisplayNameForm() {
  const profile = useProfile();
  const updateDisplayName = useUpdateDisplayName();
  const { pending, run } = useGuardedSubmit();
  const [result, setResult] = useState<"saved" | "error" | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DisplayNameInput>({ resolver: zodResolver(displayNameSchema) });

  const savedName = profile.data?.display_name ?? "";
  // Sincroniza quando o nome **salvo** muda (carga, recarga, outra aba) — nunca por cima do que está sendo digitado.
  const syncedName = useRef<string | null>(null);
  useEffect(() => {
    if (!profile.data || savedName === syncedName.current) return;
    syncedName.current = savedName;
    if (!isDirty) reset({ displayName: savedName });
  }, [profile.data, savedName, isDirty, reset]);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setResult(null);
      const next = values.displayName ?? "";
      try {
        await updateDisplayName.mutateAsync(next);
        reset({ displayName: next });
        setResult("saved");
      } catch {
        setResult("error");
      }
    }),
  );

  if (profile.isPending) {
    return (
      <div className="flex flex-col gap-1.5" aria-busy="true">
        <span className="type-label text-text-primary">Nome de exibição</span>
        <Skeleton className="h-control w-full" />
        <span className="sr-only">Carregando seu perfil…</span>
      </div>
    );
  }

  if (profile.isError) {
    return (
      <InlineError onRetry={() => void profile.refetch()} className="px-0">
        Não foi possível carregar seu nome de exibição. Ele continua como estava.
      </InlineError>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <FormField
        id="display-name"
        label="Nome de exibição"
        optional
        hint="Aparece no menu da conta, com as iniciais no avatar. Até 60 caracteres."
        error={errors.displayName?.message}
      >
        {(a11y) => <Input id="display-name" type="text" autoComplete="nickname" {...a11y} {...register("displayName")} />}
      </FormField>
      {result === "error" && <SubmitError>Não foi possível salvar o nome. O que você digitou continua no campo.</SubmitError>}
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <p role="status" className="type-caption mr-auto text-text-secondary">
          {isDirty ? "Alteração não salva." : result === "saved" ? "Nome salvo." : ""}
        </p>
        <SubmitButton pending={pending} label="Salvar nome" pendingLabel="Salvando…" variant="outline" />
      </div>
    </form>
  );
}
