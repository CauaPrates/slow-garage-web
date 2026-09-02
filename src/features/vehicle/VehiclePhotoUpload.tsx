import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { vehiclePhotoSchema } from "./schemas";
import { useUploadVehiclePhoto } from "./useVehiclePhoto";

type VehiclePhotoUploadProps = {
  vehicleId: string;
  currentPhotoUrl: string | null;
};

export function VehiclePhotoUpload({
  vehicleId,
  currentPhotoUrl,
}: VehiclePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useUploadVehiclePhoto(vehicleId);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = vehiclePhotoSchema.safeParse(file);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      event.target.value = "";
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));

    try {
      await upload.mutateAsync(file);
    } catch {
      setError("Não foi possível enviar a foto. Tente de novo.");
    } finally {
      event.target.value = "";
    }
  }

  const displayUrl = preview ?? currentPhotoUrl;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-text-secondary">Sem foto</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? "Enviando…" : "Trocar foto"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
