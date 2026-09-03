import { useState, type ChangeEvent, type FormEvent } from "react";
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
import { imageFileSchema } from "@/lib/attachmentSchema";
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
};

export function UploadPhotoDialog({
  vehicleId,
  open,
  onOpenChange,
  defaultCategory,
}: UploadPhotoDialogProps) {
  const [category, setCategory] = useState<VehiclePhotoRow["category"]>(
    defaultCategory ?? "exterior",
  );
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = useUploadGalleryPhoto(vehicleId);

  function reset() {
    setCategory(defaultCategory ?? "exterior");
    setCaption("");
    setFile(null);
    setFileError(null);
    setError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const result = imageFileSchema.safeParse(picked);
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
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
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
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
            <Label htmlFor="photo-file">Foto</Label>
            <input
              id="photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:text-accent-foreground"
            />
            {file && <span className="text-xs text-text-secondary">{file.name}</span>}
            <FieldError>{fileError}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photo-category">Categoria</Label>
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
  );
}
