import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VEHICLE_PHOTO_CATEGORIES, VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import { useVehicleGallery } from "./useVehicleGallery";
import { PhotoCard } from "./PhotoCard";
import { UploadPhotoDialog } from "./UploadPhotoDialog";

type PhotoGalleryProps = {
  vehicleId: string;
  primaryPhotoId: string | null;
  uploadOpen: boolean;
  onUploadOpenChange: (open: boolean) => void;
};

type CategoryFilter = "all" | (typeof VEHICLE_PHOTO_CATEGORIES)[number];

export function PhotoGallery({
  vehicleId,
  primaryPhotoId,
  uploadOpen,
  onUploadOpenChange,
}: PhotoGalleryProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const galleryQuery = useVehicleGallery(vehicleId);

  const photos = galleryQuery.data ?? [];
  const visiblePhotos = filter === "all" ? photos : photos.filter((p) => p.category === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant="ghost"
            className={cn("shrink-0 text-xs", filter === "all" && "bg-accent/10 text-accent")}
            onClick={() => setFilter("all")}
          >
            Todas
          </Button>
          {VEHICLE_PHOTO_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className={cn("shrink-0 text-xs", filter === category && "bg-accent/10 text-accent")}
              onClick={() => setFilter(category)}
            >
              {VEHICLE_PHOTO_CATEGORY_LABELS[category]}
            </Button>
          ))}
        </div>
        <Button onClick={() => onUploadOpenChange(true)}>Adicionar foto</Button>
      </div>

      {galleryQuery.isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {galleryQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar as fotos.</p>
          <Button variant="ghost" onClick={() => galleryQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!galleryQuery.isLoading && !galleryQuery.isError && photos.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-primary">Nenhuma foto ainda.</p>
          <Button onClick={() => onUploadOpenChange(true)}>Adicionar a primeira foto</Button>
        </div>
      )}

      {!galleryQuery.isLoading && !galleryQuery.isError && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visiblePhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              vehicleId={vehicleId}
              photo={photo}
              isPrimary={photo.id === primaryPhotoId}
            />
          ))}
        </div>
      )}

      <UploadPhotoDialog
        vehicleId={vehicleId}
        open={uploadOpen}
        onOpenChange={onUploadOpenChange}
        defaultCategory={filter === "all" ? undefined : filter}
      />
    </div>
  );
}
