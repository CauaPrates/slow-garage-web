import { useRef, useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  RECORD_CARD_CLASSNAME,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { photoCaption, photoMeta } from "./photoPresentation";
import { PHOTO_FRAME_CLASSNAME } from "./PhotoTile";
import { useDeleteGalleryPhoto, type GalleryPhoto } from "./useVehicleGallery";

type DeletePhotoDialogProps = {
  vehicleId: string;
  /** A foto a excluir — continua montada enquanto o diálogo fecha, pra o cartão não piscar vazio. */
  photo: GalleryPhoto | null;
  open: boolean;
  position: string;
  isPrimary: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois que a foto saiu — a galeria decide para onde vai o foco. */
  onDeleted: () => void;
};

/**
 * Etapa 12: a foto no cartão comum de registro (miniatura, legenda,
 * categoria, posição) e só as consequências que o código garante — o hook
 * (`useDeleteGalleryPhoto`, sem mudança) limpa a capa do veículo se for ela,
 * apaga o arquivo no armazenamento e depois a linha. Capa excluída não é
 * substituída sozinha: o card da garagem e o dashboard ficam sem foto até
 * outra ser escolhida, ou até o próximo envio (que vira capa quando o veículo
 * está sem). Fotos não entram no Histórico nem em total nenhum.
 */
export function DeletePhotoDialog({ vehicleId, photo, open, position, isPrimary, onOpenChange, onDeleted }: DeletePhotoDialogProps) {
  const deletePhoto = useDeleteGalleryPhoto(vehicleId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    if (!photo || deletingRef.current) return;
    deletingRef.current = true;
    setError(null);
    try {
      await deletePhoto.mutateAsync({ photo, isPrimary });
      onDeleted();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(`A exclusão não foi concluída. ${translatePostgresError(mutationError)}`);
      // As etapas do hook podem ter andado em parte (capa já limpa, arquivo já apagado): a tela relê o que ficou.
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    } finally {
      deletingRef.current = false;
    }
  }

  const caption = photo ? photoCaption(photo) : null;

  return (
    <AlertDialog open={open && photo !== null} onOpenChange={handleOpenChange}>
      {/* A galeria devolve o foco (ao "⋯" ao cancelar; a uma foto vizinha ou ao envio depois de excluir). */}
      <AlertDialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo da foto é apagado e ela sai da galeria. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
          {isPrimary && (
            <p className="text-sm text-text-secondary">
              Esta é a capa do veículo: o card da garagem e o dashboard ficam sem foto. A próxima foto enviada vira a
              capa, ou escolha outra em “Definir como capa”.
            </p>
          )}
        </AlertDialogHeader>
        {photo && (
          <div className={cn("flex items-start gap-3", RECORD_CARD_CLASSNAME)}>
            <div className={cn(PHOTO_FRAME_CLASSNAME, "w-20 shrink-0")}>
              {photo.signedUrl && (
                // A identificação está ao lado, em texto: a miniatura é só apoio visual.
                <img src={photo.signedUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium break-words text-text-primary">{caption ?? "Sem legenda"}</p>
              <p className="text-xs text-text-secondary">{photoMeta(photo)}</p>
              <p className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                {position}
                {isPrimary && <Badge tone="strong">Capa</Badge>}
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deletePhoto.isPending}>
            {deletePhoto.isPending ? "Excluindo…" : "Excluir foto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
