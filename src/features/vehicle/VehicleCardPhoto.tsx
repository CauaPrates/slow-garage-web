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
 * (`garage.css`). Revisão dos cards (ADR-095): 16:10 na largura toda do card
 * vertical. As fotos do app saem 4:3 do recorte (`PHOTO_ASPECT_RATIO`,
 * ADR-081) e aparecem inteiras na largura, com ~8% cortados em cima e
 * embaixo (`object-cover`, centralizado) — sem filtro nem troca de fundo.
 * No tema escuro, uma transição leve na base liga a foto ao corpo do card;
 * nenhum texto fica sobre o carro.
 *
 * O selo de status e o "⋯" ficam sobre esta região (mesma área da grade,
 * desenhados pelo `VehicleCard`), então aparecem também sem foto e na falha;
 * o conteúdo do placeholder (`garage-card__empty`) deixa o topo livre para
 * eles.
 *
 * Três estados, nenhum inventado:
 * - foto carregada: a foto real, `object-cover`;
 * - falha ao carregar (URL assinada expirada, rede): aviso discreto de "foto
 *   indisponível" — a foto existe, então não oferece "adicionar";
 * - sem foto: placeholder com a ação real de adicionar foto. Em grade de
 *   várias colunas mantém 16:10 (alinha com o vizinho); em uma coluna
 *   (celular) a região encolhe (`data-empty`).
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
      <div className="garage-card__empty">
        {failed ? (
          <>
            <ImageOff className="h-6 w-6 text-text-secondary" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Foto indisponível no momento.</p>
          </>
        ) : (
          <>
            <Car className="garage-card__empty-icon h-8 w-8 text-border-strong" strokeWidth={1.5} aria-hidden="true" />
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
