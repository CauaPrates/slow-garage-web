import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { PageError } from "@/components/ui/feedback";
import { InfoTip } from "@/components/ui/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { DeletePhotoDialog } from "./DeletePhotoDialog";
import { focusAfterDialog } from "./focus";
import { PhotoGallery, type CategoryFilter } from "./PhotoGallery";
import {
  EMPTY_UPLOAD_ACTION_ID,
  UPLOAD_ACTION_ID,
  photoActionsId,
  photoCountLabel,
  photoIdentification,
} from "./photoPresentation";
import { UploadPhotoDialog } from "./UploadPhotoDialog";
import { useSetPrimaryPhoto, useVehicleGallery, type GalleryPhoto } from "./useVehicleGallery";

/**
 * Fotos ganhou tela própria porque, como quarta aba de "Documentos", era o
 * único lugar onde as fotos apareciam e ninguém achava — os dois botões de
 * "Foto" (quick action e FAB) só abriam o upload e não levavam a lugar nenhum.
 */
export function PhotosPage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  // Trocar de veículo remonta a tela inteira (filtro, diálogos, foco).
  return <PhotosWorkspace key={vehicleId} vehicleId={vehicleId} />;
}

type DeleteTarget = {
  photo: GalleryPhoto;
  position: string;
  /** Lido ao abrir: o texto da confirmação não muda enquanto o diálogo fecha e a capa é limpa. */
  isPrimary: boolean;
  trigger: HTMLElement | null;
  neighborIds: string[];
};

/**
 * Etapa 12: cabeçalho comum (título, veículo e quantidade, ação de envio) e,
 * logo abaixo, a grade. Mesma consulta, ordem (`sort_order`, depois a mais
 * recente), chaves, invalidações e hooks de antes; `?novo=1` continua
 * abrindo o envio (agora sai da URL, como nas outras telas, para não abrir de
 * novo ao recarregar). O "Adicionar foto" do cabeçalho some com a galeria
 * vazia — o estado vazio leva a ação.
 */
function PhotosWorkspace({ vehicleId }: { vehicleId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadOpen, setUploadOpen] = useState(() => searchParams.get("novo") === "1");
  const uploadTrigger = useRef<HTMLElement | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleted = useRef(false);
  const [pendingPrimaryId, setPendingPrimaryId] = useState<string | null>(null);
  const [primaryError, setPrimaryError] = useState<{ photoId: string; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const vehicleQuery = useVehicle(vehicleId);
  const galleryQuery = useVehicleGallery(vehicleId);
  const setPrimary = useSetPrimaryPhoto(vehicleId);

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vehicleQuery.isLoading) {
    return (
      <Page aria-busy="true">
        <span className="sr-only">Carregando fotos…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="aspect-4/3 w-full max-w-xs rounded-md border border-border bg-surface" />
      </Page>
    );
  }
  if (vehicleQuery.isError) {
    return <PageError message="Não foi possível carregar o veículo." onRetry={() => void vehicleQuery.refetch()} />;
  }
  const vehicle = vehicleQuery.vehicle;
  if (!vehicle) {
    return <VehicleNotFound />;
  }

  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  const photos = galleryQuery.data ?? [];
  const empty = galleryQuery.isSuccess && photos.length === 0;

  function openUpload(event?: MouseEvent<HTMLElement>) {
    uploadTrigger.current = event?.currentTarget ?? null;
    setUploadOpen(true);
  }

  function handleUploadOpenChange(open: boolean) {
    setUploadOpen(open);
    if (open) return;
    // O gatilho some quando a galeria sai do vazio (ou não existe, no `?novo=1`): o foco vai pra ação de envio.
    focusAfterDialog({ trigger: uploadTrigger.current, removed: false, candidateIds: [UPLOAD_ACTION_ID, EMPTY_UPLOAD_ACTION_ID] });
  }

  async function handleSetPrimary(photo: GalleryPhoto, position: string) {
    setPrimaryError(null);
    setPendingPrimaryId(photo.id);
    try {
      await setPrimary.mutateAsync(photo.id);
      setAnnouncement(`${photoIdentification(photo, position)} agora é a capa do veículo.`);
    } catch (mutationError) {
      setPrimaryError({ photoId: photo.id, message: `A capa não foi trocada. ${translatePostgresError(mutationError)}` });
    } finally {
      setPendingPrimaryId(null);
    }
  }

  function handleDelete(photo: GalleryPhoto, position: string, trigger: HTMLElement | null) {
    // Vizinhos na ordem em que aparecem (com o filtro aplicado): o seguinte, senão o anterior.
    const shown = photos.filter((p) => filter === "all" || p.category === filter);
    const index = shown.findIndex((p) => p.id === photo.id);
    const neighborIds = [shown[index + 1], shown[index - 1]].filter(Boolean).map((p) => photoActionsId(p!.id));
    deleted.current = false;
    setDeleteTarget({ photo, position, isPrimary: photo.id === vehicle?.primary_photo_id, trigger, neighborIds });
    setDeleteOpen(true);
  }

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open);
    if (open || !deleteTarget) return;
    focusAfterDialog({
      trigger: deleteTarget.trigger,
      removed: deleted.current,
      candidateIds: [...deleteTarget.neighborIds, UPLOAD_ACTION_ID, EMPTY_UPLOAD_ACTION_ID],
    });
  }

  return (
    <Page>
      <Breadcrumb items={[{ label: "Fotos" }]} />

      <PageHeader
        title="Fotos"
        description={
          <>
            {vehicleName}
            {galleryQuery.isSuccess && " · "}
            {/* A contagem e o "i" quebram juntos: o botão nunca fica sozinho numa linha. */}
            <span className="whitespace-nowrap">
              {galleryQuery.isSuccess && photoCountLabel(photos.length)}
              {photos.length > 0 && (
                <InfoTip label="O que é a capa" className="-my-3 -ml-1">
                  A foto marcada como Capa aparece no card da garagem e no dashboard do veículo. Para trocar, use “⋯” e
                  “Definir como capa” em outra foto.
                </InfoTip>
              )}
            </span>
          </>
        }
        actions={
          !empty && (
            <Button id={UPLOAD_ACTION_ID} onClick={openUpload}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Adicionar foto
            </Button>
          )
        }
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <PhotoGallery
        query={galleryQuery}
        vehicleName={vehicleName}
        primaryPhotoId={vehicle.primary_photo_id}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={openUpload}
        pendingPrimaryId={pendingPrimaryId}
        primaryError={primaryError}
        onSetPrimary={(photo, position) => void handleSetPrimary(photo, position)}
        onDelete={handleDelete}
      />

      {/*
        A chave remonta o diálogo (fechado) quando o filtro muda: a categoria
        inicial é lida na montagem, e antes ficava a do primeiro filtro — o
        "abre na categoria filtrada" de antes nunca chegava a valer.
      */}
      <UploadPhotoDialog
        key={filter}
        vehicleId={vehicle.id}
        open={uploadOpen}
        onOpenChange={handleUploadOpenChange}
        defaultCategory={filter === "all" ? undefined : filter}
        onUploaded={() => setAnnouncement("Foto enviada para a galeria.")}
      />

      <DeletePhotoDialog
        vehicleId={vehicle.id}
        photo={deleteTarget?.photo ?? null}
        open={deleteOpen}
        position={deleteTarget?.position ?? ""}
        isPrimary={deleteTarget?.isPrimary ?? false}
        onOpenChange={handleDeleteOpenChange}
        onDeleted={() => {
          deleted.current = true;
          setAnnouncement("Foto excluída.");
        }}
      />
    </Page>
  );
}
