import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { PHOTO_ASPECT_RATIO } from "@/lib/imageCrop";
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
  /** A foto crua esperando ajuste; enquanto não for `null`, o recorte está aberto. */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const upload = useUploadVehiclePhoto(vehicleId);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Zerar o input deixa escolher o mesmo arquivo de novo depois de cancelar o ajuste.
    event.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    setError(null);
    setPendingFile(picked);
  }

  /** O recorte já sai redimensionado, então o limite de tamanho é conferido aqui e não no arquivo cru. */
  async function handleCropped(cropped: File) {
    setPendingFile(null);

    const result = vehiclePhotoSchema.safeParse(cropped);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(cropped));

    try {
      await upload.mutateAsync(cropped);
    } catch {
      setError("Não foi possível enviar a foto. Tente de novo.");
    }
  }

  const displayUrl = preview ?? currentPhotoUrl;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex w-full items-center justify-center overflow-hidden rounded-md border border-border bg-bg"
        style={{ aspectRatio: String(PHOTO_ASPECT_RATIO) }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-text-secondary">Sem foto</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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

      <ImageCropDialog
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={handleCropped}
        title="Ajustar foto de capa"
      />
    </div>
  );
}
