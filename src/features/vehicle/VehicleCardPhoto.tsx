import { useState, type ReactNode } from "react";
import { Camera, Car, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type VehicleCardPhotoProps = {
  photoUrl: string | null;
  bayNumber: number;
  /** `id` do título do card — o botão "Adicionar foto" do placeholder é descrito por ele. */
  vehicleNameId: string;
  onAddPhoto: () => void;
  /** Selo de status do veículo — fica no canto da foto pra não gastar uma linha da identificação. */
  statusBadge: ReactNode;
};

/** Baia à esquerda e status à direita, ambos sólidos (`bg-bg`) — legíveis sobre qualquer foto, sem vidro nem sombra. */
function PhotoTags({ bayNumber, statusBadge }: { bayNumber: number; statusBadge: ReactNode }) {
  return (
    <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
      <span className="rounded-sm border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-text-secondary">
        baia {String(bayNumber).padStart(2, "0")}
      </span>
      {statusBadge}
    </div>
  );
}

/**
 * Região da foto do card da garagem (redesign etapa 02). Proporção 4:3 — a
 * mesma do recorte (`PHOTO_ASPECT_RATIO`, ADR-081), então o que a pessoa
 * enquadrou é o que aparece aqui, sem filtro; por cima, só os dois selos
 * sólidos (baia e status).
 *
 * Três estados, nenhum inventado:
 * - foto carregada: a foto real, `object-cover`;
 * - falha ao carregar (URL assinada expirada, rede): aviso discreto de "foto
 *   indisponível" — a foto existe, então não oferece "adicionar";
 * - sem foto: placeholder com a ação real de adicionar foto. No mobile a
 *   região encolhe (não há vizinho na mesma linha pra desalinhar); a partir
 *   de `sm` mantém 4:3 pra o card ficar alinhado com os da mesma linha.
 *
 * A foto em si não é link nem botão: o clique nela abre o veículo pelo link
 * esticado do título (`VehicleCard`). O botão do placeholder fica acima
 * desse link (`relative z-10`).
 */
export function VehicleCardPhoto({
  photoUrl,
  bayNumber,
  vehicleNameId,
  onAddPhoto,
  statusBadge,
}: VehicleCardPhotoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = photoUrl != null && failedUrl === photoUrl;

  if (photoUrl && !failed) {
    return (
      <div className="relative aspect-4/3 overflow-hidden bg-bg">
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(photoUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Depois da imagem no DOM: as duas são absolutas, e quem vem depois pinta por cima. */}
        <PhotoTags bayNumber={bayNumber} statusBadge={statusBadge} />
      </div>
    );
  }

  return (
    <div className="relative flex h-32 flex-col items-center justify-center gap-2 border-b border-border bg-bg px-4 pt-6 text-center sm:aspect-4/3 sm:h-auto sm:pt-0">
      <PhotoTags bayNumber={bayNumber} statusBadge={statusBadge} />
      {failed ? (
        <>
          <ImageOff className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Foto indisponível no momento.</p>
        </>
      ) : (
        <>
          {/* No mobile a região é compacta: o ícone sai pra caber texto + botão sem apertar. */}
          <Car className="hidden h-8 w-8 text-border-strong sm:block" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Sem foto deste veículo</p>
          <Button
            variant="outline"
            aria-describedby={vehicleNameId}
            onClick={onAddPhoto}
            className="relative z-10"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Adicionar foto
          </Button>
        </>
      )}
    </div>
  );
}
