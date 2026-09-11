import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import {
  cropImageToFile,
  loadImageFromFile,
  PHOTO_ASPECT_RATIO,
  type CropRect,
} from "@/lib/imageCrop";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** Passo do teclado, em pixels de tela — uma seta move o mesmo que um arrasto curto. */
const KEYBOARD_PAN_STEP_PX = 16;

type ImageCropDialogProps = {
  /** A foto escolhida no seletor. `null` mantém o diálogo fechado. */
  file: File | null;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
  aspectRatio?: number;
  title?: string;
};

type Offset = { x: number; y: number };

/**
 * Ajuste de enquadramento antes do envio, no mesmo espírito de foto de perfil:
 * a pessoa arrasta e aproxima até o carro ficar onde ela quer, e o que sobe é
 * só o pedaço visível, já reencodado dentro do limite de tamanho (ver
 * `lib/imageCrop.ts`). Sem isso, enquadramento e peso do arquivo ficavam por
 * conta de como a foto saiu do celular.
 */
export function ImageCropDialog({
  file,
  onCancel,
  onConfirm,
  aspectRatio = PHOTO_ASPECT_RATIO,
  title = "Ajustar foto",
}: ImageCropDialogProps) {
  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {file && (
          /* A chave remonta o recorte a cada foto nova — zoom e posição voltam ao início sem efeito de reset. */
          <Cropper
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            aspectRatio={aspectRatio}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CropperProps = {
  file: File;
  aspectRatio: number;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
};

function Cropper({ file, aspectRatio, onCancel, onConfirm }: CropperProps) {
  const viewportRef = useRef<HTMLButtonElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  /**
   * Imagem decodificada e a URL de blob que a alimenta, sempre no mesmo estado.
   * Antes a URL vinha de um `useMemo` e era revogada na limpeza de um efeito:
   * sob StrictMode o React monta, desmonta e remonta, a limpeza revogava a URL
   * logo depois de criá-la, e o `useMemo` não recriava nada na remontagem — o
   * quadro ficava vazio com o botão habilitado. Criar e revogar a URL dentro do
   * mesmo efeito faz cada execução ser dona da sua: a remontagem cria outra.
   */
  const [loaded, setLoaded] = useState<{ image: HTMLImageElement; url: string } | null>(null);
  const image = loaded?.image ?? null;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    loadImageFromFile(file)
      .then(({ image: decoded, url }) => {
        createdUrl = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setLoaded({ image: decoded, url });
      })
      .catch(() => {
        if (!cancelled) {
          setError("Não foi possível abrir essa imagem. Escolha outra, em JPEG, PNG ou WebP.");
        }
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [file]);

  // O quadro acompanha a largura da tela, então o tamanho em pixels vem do DOM.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const coverScale =
    image && viewport.width
      ? Math.max(viewport.width / image.naturalWidth, viewport.height / image.naturalHeight)
      : 0;
  const scale = coverScale * zoom;
  const displayWidth = image ? image.naturalWidth * scale : 0;
  const displayHeight = image ? image.naturalHeight * scale : 0;

  /** Mantém a imagem cobrindo o quadro — nunca deixa entrar faixa vazia na borda. */
  const clamp = useCallback(
    (next: Offset, currentZoom: number): Offset => {
      if (!image || !viewport.width) return { x: 0, y: 0 };
      const currentScale = coverScale * currentZoom;
      const maxX = Math.max(0, (image.naturalWidth * currentScale - viewport.width) / 2);
      const maxY = Math.max(0, (image.naturalHeight * currentScale - viewport.height) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [image, viewport.width, viewport.height, coverScale],
  );

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous || !image) return;
    const current = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, current);

    // Dois dedos na tela: a distância entre eles vira aproximação, não arrasto.
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchRef.current.distance > 0) {
        const next = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, (pinchRef.current.zoom * distance) / pinchRef.current.distance),
        );
        setZoom(next);
        setOffset((atual) => clamp(atual, next));
      }
      return;
    }

    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, zoom));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const stepByKey: Record<string, Offset> = {
      ArrowLeft: { x: KEYBOARD_PAN_STEP_PX, y: 0 },
      ArrowRight: { x: -KEYBOARD_PAN_STEP_PX, y: 0 },
      ArrowUp: { x: 0, y: KEYBOARD_PAN_STEP_PX },
      ArrowDown: { x: 0, y: -KEYBOARD_PAN_STEP_PX },
    };
    const step = stepByKey[event.key];
    if (!step) return;
    event.preventDefault();
    setOffset((o) => clamp({ x: o.x + step.x, y: o.y + step.y }, zoom));
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    setOffset((o) => clamp(o, next));
  }

  async function handleConfirm() {
    if (!image || !viewport.width) return;
    setError(null);
    setIsSaving(true);
    try {
      // Canto do recorte em coordenadas da imagem original: ela está centrada
      // no quadro e deslocada por `offset`.
      const rect: CropRect = {
        sx: (displayWidth / 2 - viewport.width / 2 - offset.x) / scale,
        sy: (displayHeight / 2 - viewport.height / 2 - offset.y) / scale,
        sWidth: viewport.width / scale,
        sHeight: viewport.height / scale,
      };
      onConfirm(await cropImageToFile(image, rect, file.name));
    } catch {
      setError("Não foi possível preparar a imagem. Tente outra foto.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/*
        O quadro é um botão porque a área inteira é manipulável: arrasto no
        ponteiro, setas no teclado. Um `div` com os mesmos handlers não recebe
        foco nem é anunciado como controle.
      */}
      <button
        ref={viewportRef}
        type="button"
        aria-label="Ajuste da foto: arraste para mover ou use as setas do teclado"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ aspectRatio: String(aspectRatio) }}
        className="relative block w-full cursor-grab touch-none overflow-hidden rounded-md border border-border bg-bg select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:cursor-grabbing"
      >
        {loaded ? (
          <img
            src={loaded.url}
            alt=""
            draggable={false}
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            }}
            className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
            {error ? "Imagem inválida" : "Carregando…"}
          </span>
        )}
      </button>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="crop-zoom">Aproximação</Label>
        <input
          id="crop-zoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!image}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className="h-11 w-full accent-accent"
        />
      </div>

      <FieldError>{error}</FieldError>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!image || isSaving}
          onClick={handleConfirm}
        >
          {isSaving ? "Preparando…" : "Usar esta foto"}
        </Button>
      </div>
    </div>
  );
}
