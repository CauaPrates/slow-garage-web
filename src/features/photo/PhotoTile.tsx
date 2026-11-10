import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { PhotoActionsMenu } from "./PhotoActionsMenu";
import { photoAlt, photoCaption, photoIdentification, photoLabelId, photoMeta } from "./photoPresentation";
import type { GalleryPhoto } from "./useVehicleGallery";

/** O quadro da foto: 4:3, a proporção do recorte (`PHOTO_ASPECT_RATIO`, ADR-081). Também usado na confirmação de exclusão. */
export const PHOTO_FRAME_CLASSNAME = "relative aspect-4/3 w-full overflow-hidden rounded-md border border-border bg-bg";

type PhotoTileProps = {
  photo: GalleryPhoto;
  /** "Foto 3 de 12" — posição na galeria inteira. */
  position: string;
  vehicleName: string;
  isPrimary: boolean;
  /** Troca de capa em andamento para esta foto. */
  settingPrimary: boolean;
  /** Falha da troca de capa desta foto, já traduzida. */
  error: string | null;
  onSetPrimary: () => void;
  onDelete: (trigger: HTMLElement | null) => void;
  /** Pede links assinados novos (a foto não carregou: link vencido, rede). */
  onRetry: () => void;
};

/**
 * Etapa 12: uma foto da galeria. A foto vem primeiro, inteira no quadro 4:3
 * (`object-contain`): as fotos enviadas pelo app já saem 4:3 do recorte e
 * ocupam o quadro todo; uma foto de outra proporção aparece inteira, com o
 * fundo neutro nas sobras, em vez de cortar o carro na borda — não existe
 * visualização ampliada onde ver o resto. Nenhum texto nem selo sobre a foto
 * (o tratamento da Garagem); legenda, categoria, data e o selo "Capa" ficam
 * embaixo, com o "⋯" à direita.
 *
 * A foto não é link nem botão. Falha ao carregar (link assinado vencido,
 * arquivo que não está mais no armazenamento) vira um quadro reservado com o
 * aviso e "Tentar de novo", que pede links novos.
 */
export function PhotoTile({
  photo,
  position,
  vehicleName,
  isPrimary,
  settingPrimary,
  error,
  onSetPrimary,
  onDelete,
  onRetry,
}: PhotoTileProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const unavailable = !photo.signedUrl || failedUrl === photo.signedUrl;
  const caption = photoCaption(photo);
  const identification = photoIdentification(photo, position);

  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div className={PHOTO_FRAME_CLASSNAME}>
        {unavailable ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center">
            <ImageOff className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
            <p className="text-xs leading-snug text-text-secondary">
              Foto indisponível<span className="sr-only">: {identification}</span>
            </p>
            <Button variant="outline" onClick={onRetry} aria-describedby={photoLabelId(photo.id)}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <img
            src={photo.signedUrl ?? undefined}
            alt={photoAlt(photo, position, vehicleName)}
            loading="lazy"
            decoding="async"
            onError={() => setFailedUrl(photo.signedUrl)}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>

      <div className="flex min-w-0 items-start gap-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
          {/* A legenda já é o texto alternativo da foto: à vista, mas sem repetir no leitor de tela. */}
          {caption && (
            <p aria-hidden="true" className="text-sm break-words text-text-primary">
              {caption}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
            {isPrimary && <Badge tone="strong">Capa</Badge>}
            <span className="min-w-0 break-words">{photoMeta(photo)}</span>
          </p>
          {settingPrimary && <p className="text-xs text-text-secondary">Definindo como capa…</p>}
          <span id={photoLabelId(photo.id)} className="sr-only">
            {identification}
            {isPrimary ? ", capa do veículo" : ""}
          </span>
        </div>
        <PhotoActionsMenu photoId={photo.id} isPrimary={isPrimary} onSetPrimary={onSetPrimary} onDelete={onDelete} />
      </div>
      <FieldError>{error}</FieldError>
    </li>
  );
}
