import { formatDateOnly } from "@/lib/format";
import { VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import type { VehiclePhotoRow } from "./useVehicleGallery";

/**
 * Etapa 12: como cada foto é identificada na tela, no leitor de tela e na
 * confirmação. Só usa o que existe — legenda, categoria, data da foto
 * (`taken_at`, quando houver) e a posição na galeria; nada é inventado para
 * foto sem legenda.
 */

/** Ids estáveis: o foco volta ao "⋯" de uma foto vizinha depois de excluir. */
export const photoActionsId = (photoId: string) => `photo-actions-${photoId}`;
export const photoLabelId = (photoId: string) => `photo-label-${photoId}`;

/** Ação de envio do cabeçalho e do estado vazio — destino do foco quando a última foto sai. */
export const UPLOAD_ACTION_ID = "photos-upload-action";
export const EMPTY_UPLOAD_ACTION_ID = "photos-empty-upload-action";
export const GALLERY_TITLE_ID = "photos-gallery-title";

/** "Foto 3 de 12" — posição na galeria inteira (na ordem da consulta), não no filtro. */
export function photoPosition(index: number, total: number): string {
  return `Foto ${index + 1} de ${total}`;
}

/** Legenda digitada, sem espaços nas pontas; vazia vira `null`. */
export function photoCaption(photo: Pick<VehiclePhotoRow, "caption">): string | null {
  const caption = photo.caption?.trim();
  return caption ? caption : null;
}

/**
 * Texto alternativo da miniatura: a legenda, quando existe (é a descrição
 * que a pessoa deu); sem legenda, só o contexto conhecido — posição e
 * veículo. A categoria não entra: ela já está escrita logo abaixo da foto.
 */
export function photoAlt(photo: VehiclePhotoRow, position: string, vehicleName: string): string {
  return photoCaption(photo) ?? `${position} do ${vehicleName}`;
}

/** Quem é a foto para o "⋯" e para a confirmação: "Foto 3 de 12: Volante novo". */
export function photoIdentification(photo: VehiclePhotoRow, position: string): string {
  const caption = photoCaption(photo);
  return caption ? `${position}: ${caption}` : position;
}

/** Linha de apoio sob a foto: categoria e, se houver, a data em que a foto foi tirada. */
export function photoMeta(photo: VehiclePhotoRow): string {
  const parts = [VEHICLE_PHOTO_CATEGORY_LABELS[photo.category]];
  if (photo.taken_at) parts.push(`Tirada em ${formatDateOnly(photo.taken_at.slice(0, 10))}`);
  return parts.join(" · ");
}

export function photoCountLabel(count: number): string {
  return count === 1 ? "1 foto" : `${count} fotos`;
}
