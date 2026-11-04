import { useState } from "react";
import { Camera, Car, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type VehicleCardPhotoProps = {
  photoUrl: string | null;
  /** `id` do título do card — o botão "Adicionar foto" do placeholder é descrito por ele. */
  vehicleNameId: string;
  onAddPhoto: () => void;
};

/**
 * Região da foto do card da garagem — a célula `photo` da grade do card
 * (`garage.css`). Proporção 4:3, a mesma do recorte (`PHOTO_ASPECT_RATIO`,
 * ADR-081), então o que a pessoa enquadrou é o que aparece, sem filtro nem
 * escurecimento.
 *
 * Garagem A3 (ADR-094): nada por cima da foto. O selo de status e o "⋯"
 * foram para a linha do número do card, e o degradê da base saiu — a foto é
 * uma chapa de borda seca, como numa página de revista. No spread a célula
 * acompanha a altura da linha (`object-cover`), sem faixa vazia embaixo.
 *
 * Três estados, nenhum inventado:
 * - foto carregada: a foto real, `object-cover`;
 * - falha ao carregar (URL assinada expirada, rede): aviso discreto de "foto
 *   indisponível" — a foto existe, então não oferece "adicionar";
 * - sem foto: placeholder com a ação real de adicionar foto. No card vertical
 *   a região encolhe (`data-empty`); no spread mantém 4:3.
 *
 * A foto em si não é link nem botão: o clique nela abre o veículo pelo link
 * esticado do título (`VehicleCard`). O botão do placeholder fica acima
 * desse link (`relative z-10`).
 */
export function VehicleCardPhoto({ photoUrl, vehicleNameId, onAddPhoto }: VehicleCardPhotoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = photoUrl != null && failedUrl === photoUrl;

  if (photoUrl && !failed) {
    return (
      <div className="garage-card__photo relative overflow-hidden">
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(photoUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="garage-card__photo relative overflow-hidden" data-empty="">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        {failed ? (
          <>
            <ImageOff className="h-6 w-6 text-text-secondary" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Foto indisponível no momento.</p>
          </>
        ) : (
          <>
            <Car className="h-8 w-8 text-border-strong" strokeWidth={1.5} aria-hidden="true" />
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
    </div>
  );
}
