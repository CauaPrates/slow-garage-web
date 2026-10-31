import { useId, useRef, useState, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
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

/**
 * Foto de capa dentro da edição do veículo. O envio acontece quando a pessoa
 * confirma o recorte — antes e independente do "Salvar alterações" — e grava
 * a foto na galeria (`vehicle_photos`) e como capa (`primary_photo_id`). O
 * texto da seção diz isso, porque não é o que um formulário costuma fazer.
 *
 * Etapa 03: a prévia local só fica na tela enquanto o envio dá certo. Se ele
 * falha, volta a foto salva — antes a prévia ficava, como se a troca tivesse
 * acontecido.
 */
export function VehiclePhotoUpload({
  vehicleId,
  currentPhotoUrl,
}: VehiclePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
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
      setPreview(null);
      setError("Não foi possível enviar a foto. A capa não mudou — tente de novo.");
    }
  }

  const displayUrl = preview ?? currentPhotoUrl;

  return (
    <section aria-labelledby={titleId} className="flex items-start gap-4 py-5">
      <div
        className="relative w-28 shrink-0 overflow-hidden rounded-md border border-border bg-bg sm:w-44"
        style={{ aspectRatio: String(PHOTO_ASPECT_RATIO) }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-text-secondary">
            <Camera className="h-5 w-5" aria-hidden="true" />
            Sem foto
          </span>
        )}
        {upload.isPending && (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-sm bg-bg px-1.5 py-1 text-center text-xs text-text-primary">
            Enviando…
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 id={titleId} className="text-sm font-semibold text-text-primary">
            Foto de capa
          </h3>
          <p className="text-xs text-text-secondary">
            Salva assim que você confirma o recorte, sem esperar “Salvar
            alterações”. Também entra em Fotos.
          </p>
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
          variant="outline"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          {upload.isPending
            ? "Enviando…"
            : displayUrl
              ? "Trocar foto"
              : "Adicionar foto"}
        </Button>
        {/* Sempre montado: região viva que nasce junto com o texto nem sempre é anunciada. */}
        <p role="status" className="text-xs text-text-secondary">
          {upload.isSuccess && preview ? "Foto de capa atualizada." : ""}
        </p>
        <FieldError>{error}</FieldError>
      </div>

      <ImageCropDialog
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={handleCropped}
        title="Ajustar foto de capa"
      />
    </section>
  );
}
