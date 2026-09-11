import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { imageFileSchema } from "@/lib/attachmentSchema";
import { PHOTO_ASPECT_RATIO } from "@/lib/imageCrop";
import { translatePostgresError } from "@/lib/postgresErrors";
import { VEHICLE_PHOTO_CATEGORIES, VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import { useUploadGalleryPhoto } from "./useVehicleGallery";
import type { VehiclePhotoRow } from "./useVehicleGallery";

type UploadPhotoDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Categoria pré-selecionada quando o diálogo abre a partir do filtro já ativo. */
  defaultCategory?: VehiclePhotoRow["category"];
  /** Chamado só quando o envio deu certo — quem abriu fora da galeria usa isso pra levar o usuário até lá. */
  onUploaded?: () => void;
};

export function UploadPhotoDialog({
  vehicleId,
  open,
  onOpenChange,
  defaultCategory,
  onUploaded,
}: UploadPhotoDialogProps) {
  const [category, setCategory] = useState<VehiclePhotoRow["category"]>(
    defaultCategory ?? "exterior",
  );
  const [caption, setCaption] = useState("");
  /** O arquivo já recortado — é ele que sobe. */
  const [file, setFile] = useState<File | null>(null);
  /** A foto crua esperando ajuste; enquanto não for `null`, o recorte está aberto. */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadGalleryPhoto(vehicleId);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function reset() {
    setCategory(defaultCategory ?? "exterior");
    setCaption("");
    setFile(null);
    setPendingFile(null);
    setFileError(null);
    setError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Zerar o input deixa escolher o mesmo arquivo de novo depois de cancelar o ajuste.
    event.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setFileError("Escolha um arquivo de imagem.");
      return;
    }
    setFileError(null);
    setPendingFile(picked);
  }

  /** O recorte já sai redimensionado, então o limite de tamanho é conferido aqui e não no arquivo cru. */
  function handleCropped(cropped: File) {
    const result = imageFileSchema.safeParse(cropped);
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      setPendingFile(null);
      return;
    }
    setFileError(null);
    setFile(cropped);
    setPendingFile(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setFileError("Escolha uma foto.");
      return;
    }
    try {
      await upload.mutateAsync({ file, category, caption: caption.trim() || null });
      reset();
      onOpenChange(false);
      onUploaded?.();
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          onOpenChange(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar foto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Foto</span>

              {previewUrl && (
                <div
                  className="w-full overflow-hidden rounded-md border border-border bg-bg"
                  style={{ aspectRatio: String(PHOTO_ASPECT_RATIO) }}
                >
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              {/*
                No Android, listar MIME específicos faz o Chrome pedir o seletor com
                lista de MIME extra, e só Google Fotos e Drive respondem — a galeria
                do aparelho nem aparece como opção. Com o curinga "image" o seletor
                de mídia padrão abre e a galeria nativa volta. O formato de verdade
                continua validado depois do recorte, por imageFileSchema.
              */}
              <input
                ref={inputRef}
                id="photo-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {/*
                O input nativo fica escondido atrás de um botão do app: o texto
                dele é do navegador (fica em inglês conforme o idioma do sistema)
                e continuava dizendo "nenhum arquivo selecionado" mesmo com a
                prévia da foto recortada logo acima.
              */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => inputRef.current?.click()}
                >
                  {file ? "Escolher outra foto" : "Escolher foto"}
                </Button>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setPendingFile(file)}
                  >
                    Ajustar enquadramento
                  </Button>
                )}
              </div>
              <FieldError>{fileError}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="photo-category">Categoria (opcional)</Label>
              <Select
                id="photo-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as VehiclePhotoRow["category"])
                }
              >
                {VEHICLE_PHOTO_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {VEHICLE_PHOTO_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="photo-caption">Legenda (opcional)</Label>
              <Input id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>

            <FieldError>{error}</FieldError>
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? "Enviando…" : "Adicionar foto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={handleCropped}
      />
    </>
  );
}
