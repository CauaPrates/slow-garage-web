import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { cn } from "@/lib/utils";
import { translatePostgresError } from "@/lib/postgresErrors";
import { VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import {
  useDeleteGalleryPhoto,
  useSetPrimaryPhoto,
  type GalleryPhoto,
} from "./useVehicleGallery";

type PhotoCardProps = {
  vehicleId: string;
  photo: GalleryPhoto;
  isPrimary: boolean;
};

export function PhotoCard({ vehicleId, photo, isPrimary }: PhotoCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPrimary = useSetPrimaryPhoto(vehicleId);
  const deletePhoto = useDeleteGalleryPhoto(vehicleId);

  async function handleSetPrimary() {
    setError(null);
    try {
      await setPrimary.mutateAsync(photo.id);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  async function handleConfirmDelete() {
    setError(null);
    try {
      await deletePhoto.mutateAsync({ photo, isPrimary });
      setDeleteOpen(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface">
        {photo.signedUrl ? (
          <img
            src={photo.signedUrl}
            alt={photo.caption ?? VEHICLE_PHOTO_CATEGORY_LABELS[photo.category]}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">
            Sem prévia
          </div>
        )}
        {isPrimary && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            <Star className="h-3 w-3" aria-hidden="true" />
            Capa
          </span>
        )}
      </div>

      <p className="truncate text-xs text-text-secondary">
        {VEHICLE_PHOTO_CATEGORY_LABELS[photo.category]}
        {photo.caption ? ` · ${photo.caption}` : ""}
      </p>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          className={cn("flex-1 text-xs", isPrimary && "text-text-secondary")}
          disabled={isPrimary || setPrimary.isPending}
          onClick={handleSetPrimary}
        >
          {isPrimary ? "É a capa" : "Definir como capa"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir foto"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <FieldError>{error}</FieldError>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
              {isPrimary ? " Essa é a foto de capa do veículo — a capa ficará vazia." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deletePhoto.isPending}>
              {deletePhoto.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
