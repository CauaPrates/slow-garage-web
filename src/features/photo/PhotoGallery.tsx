import type { MouseEvent } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, NoResults } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { PANEL_CLASSNAME } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { VEHICLE_PHOTO_CATEGORIES, VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import {
  EMPTY_UPLOAD_ACTION_ID,
  GALLERY_TITLE_ID,
  photoActionsId,
  photoCountLabel,
  photoPosition,
} from "./photoPresentation";
import { PhotoTile } from "./PhotoTile";
import { refocusAfterRetry } from "./focus";

const GALLERY_ACTIONS_SELECTOR = `section[aria-labelledby="${GALLERY_TITLE_ID}"] button[id^="photo-actions-"]`;
import type { GalleryPhoto, VehiclePhotoRow } from "./useVehicleGallery";

export type CategoryFilter = "all" | VehiclePhotoRow["category"];

/**
 * Grade regular pela largura útil: quantas colunas couberem com a largura
 * mínima do token (`--gallery-tile-min`); as colunas vazias ficam (`auto-fill`),
 * então uma foto só ocupa uma coluna em vez de esticar pela tela.
 */
const GRID_CLASSNAME =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--gallery-tile-min)),1fr))] gap-x-(--gallery-gap) gap-y-5";

type PhotoGalleryProps = {
  query: {
    data: GalleryPhoto[] | undefined;
    isPending: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };
  vehicleName: string;
  primaryPhotoId: string | null;
  filter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  onUpload: (event: MouseEvent<HTMLElement>) => void;
  pendingPrimaryId: string | null;
  primaryError: { photoId: string; message: string } | null;
  onSetPrimary: (photo: GalleryPhoto, position: string) => void;
  onDelete: (photo: GalleryPhoto, position: string, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 12: a coleção. Carregando, falha da consulta, galeria vazia, filtro
 * sem resultado e foto que não carregou são estados diferentes, cada um com
 * o seu texto. O filtro de categoria (de antes) vira um campo comum e só
 * aparece quando há fotos de mais de uma categoria — com uma categoria só ele
 * não separa nada e empurraria a grade para baixo.
 */
export function PhotoGallery({
  query,
  vehicleName,
  primaryPhotoId,
  filter,
  onFilterChange,
  onUpload,
  pendingPrimaryId,
  primaryError,
  onSetPrimary,
  onDelete,
}: PhotoGalleryProps) {
  if (query.isPending) {
    return (
      <div aria-busy="true" className={GRID_CLASSNAME}>
        <span className="sr-only">Carregando fotos…</span>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-4/3 w-full rounded-md border border-border bg-surface" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={PANEL_CLASSNAME}>
        {/* Deu certo: o foco vai pro filtro, pro primeiro "⋯" ou pra ação do vazio (o botão do aviso saiu da tela). */}
        <InlineError onRetry={() => refocusAfterRetry(query.refetch, `#photo-filter, ${GALLERY_ACTIONS_SELECTOR}, #${EMPTY_UPLOAD_ACTION_ID}`)}>
          Não foi possível carregar as fotos deste veículo. Nenhuma foto foi alterada.
        </InlineError>
      </div>
    );
  }

  const photos = query.data ?? [];
  if (photos.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        titleId={GALLERY_TITLE_ID}
        title="Nenhuma foto deste veículo."
        action={
          <Button id={EMPTY_UPLOAD_ACTION_ID} onClick={onUpload}>
            Adicionar primeira foto
          </Button>
        }
      >
        Exterior, interior, motor, rodas, modificações: as fotos ficam guardadas aqui. A primeira vira a capa do
        veículo no card da garagem e no dashboard.
      </EmptyState>
    );
  }

  const total = photos.length;
  const countByCategory = new Map<VehiclePhotoRow["category"], number>();
  for (const photo of photos) countByCategory.set(photo.category, (countByCategory.get(photo.category) ?? 0) + 1);
  const showFilter = countByCategory.size > 1 || filter !== "all";
  const visible = photos
    .map((photo, index) => ({ photo, position: photoPosition(index, total) }))
    .filter(({ photo }) => filter === "all" || photo.category === filter);
  const filterOptions = VEHICLE_PHOTO_CATEGORIES.filter((c) => countByCategory.has(c) || c === filter);

  return (
    <section aria-labelledby={GALLERY_TITLE_ID} className="flex flex-col gap-4">
      <h2 id={GALLERY_TITLE_ID} className="sr-only">
        Galeria
      </h2>

      {showFilter && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <FilterField id="photo-filter" label="Categoria" className="w-full sm:w-64">
            <Select
              id="photo-filter"
              value={filter}
              onChange={(event) => onFilterChange(event.target.value as CategoryFilter)}
            >
              <option value="all">Todas ({total})</option>
              {filterOptions.map((category) => (
                <option key={category} value={category}>
                  {VEHICLE_PHOTO_CATEGORY_LABELS[category]} ({countByCategory.get(category) ?? 0})
                </option>
              ))}
            </Select>
          </FilterField>
          {filter !== "all" && visible.length > 0 && (
            <p className="pb-3 text-sm text-text-secondary">
              {visible.length} de {photoCountLabel(total)}
            </p>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className={PANEL_CLASSNAME}>
          <NoResults
            message={`Nenhuma foto em ${filter === "all" ? "" : VEHICLE_PHOTO_CATEGORY_LABELS[filter]}.`}
            detail={
              total === 1
                ? "A foto do veículo está em outra categoria."
                : `As ${total} fotos do veículo estão em outras categorias.`
            }
            onClear={() => onFilterChange("all")}
          />
        </div>
      ) : (
        <ul className={GRID_CLASSNAME}>
          {visible.map(({ photo, position }) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              position={position}
              vehicleName={vehicleName}
              isPrimary={photo.id === primaryPhotoId}
              settingPrimary={pendingPrimaryId === photo.id}
              error={primaryError?.photoId === photo.id ? primaryError.message : null}
              onSetPrimary={() => onSetPrimary(photo, position)}
              onDelete={(trigger) => onDelete(photo, position, trigger)}
              onRetry={() => refocusAfterRetry(query.refetch, `#${photoActionsId(photo.id)}`)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
