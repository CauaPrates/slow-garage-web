import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { PhotoGallery } from "./PhotoGallery";

/**
 * Fotos ganhou tela própria porque, como quarta aba de "Documentos", era o
 * único lugar onde as fotos apareciam e ninguém achava — os dois botões de
 * "Foto" (quick action e FAB) só abriam o upload e não levavam a lugar nenhum.
 */
export function PhotosPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const openUploadOnMount = searchParams.get("novo") === "1";

  const { vehicle, isLoading, isError, refetch } = useVehicle(vehicleId ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar o veículo.</p>
        <Button variant="ghost" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Breadcrumb items={[{ label: "Fotos" }]} />
      <h1 className="text-lg font-medium text-text-primary">Fotos</h1>
      <PhotoGallery
        vehicleId={vehicle.id}
        primaryPhotoId={vehicle.primary_photo_id}
        initialUploadOpen={openUploadOnMount}
      />
    </div>
  );
}
