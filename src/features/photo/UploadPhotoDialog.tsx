import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Crop, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import {
  FORM_DIALOG_CLASSNAME,
  FORM_DIALOG_HEADER_CLASSNAME,
  FormBody,
  FormField,
  FormFooter,
  FormSection,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { imageFileSchema } from "@/lib/attachmentSchema";
import { formatFileSize } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { VEHICLE_PHOTO_CATEGORIES, VEHICLE_PHOTO_CATEGORY_LABELS } from "./schemas";
import { PHOTO_FRAME_CLASSNAME } from "./PhotoTile";
import { useUploadGalleryPhoto } from "./useVehicleGallery";
import type { VehiclePhotoRow } from "./useVehicleGallery";

/** Etapa 12: a casca comum dos formulários, estreita — três campos. */
const UPLOAD_DIALOG_CLASSNAME = cn(FORM_DIALOG_CLASSNAME, "max-w-lg");

/**
 * Formatos e limites conferidos no código: o seletor aceita qualquer imagem
 * (curinga, ver abaixo), o recorte sai em 4:3 com o maior lado em até 1600px
 * (`lib/imageCrop.ts`) e o arquivo final passa por `imageFileSchema` (JPEG,
 * PNG ou WebP, até 10 MB).
 */
const FILE_HINT =
  "JPEG, PNG ou WebP. Depois de escolher, você ajusta o enquadramento em 4:3; a foto enviada fica com até 1600 px e 10 MB.";

type UploadPhotoDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Categoria pré-selecionada quando o diálogo abre a partir do filtro já ativo. */
  defaultCategory?: VehiclePhotoRow["category"];
  /** Chamado só quando o envio deu certo — quem abriu fora da galeria usa isso pra levar o usuário até lá. */
  onUploaded?: () => void;
};

/**
 * Etapa 12: o envio no padrão comum (cabeçalho e rodapé fixos, só o corpo
 * rola, "Cancelar" e a ação principal no rodapé, segundo envio bloqueado,
 * foco devolvido a quem abriu). Mesmo fluxo de antes: escolher → ajustar o
 * enquadramento → conferir a prévia → enviar; o hook (`useUploadGalleryPhoto`,
 * sem mudança) sobe o arquivo, grava a linha e, se o veículo está sem capa,
 * faz dela a capa. Uma falha deixa a foto escolhida, a categoria e a legenda
 * no formulário para tentar de novo. Usado também pelo dashboard e pelo card
 * da garagem ("Adicionar foto").
 */
export function UploadPhotoDialog({
  vehicleId,
  open,
  onOpenChange,
  defaultCategory,
  onUploaded,
}: UploadPhotoDialogProps) {
  const [category, setCategory] = useState<VehiclePhotoRow["category"]>(defaultCategory ?? "exterior");
  const [caption, setCaption] = useState("");
  /** O arquivo já recortado — é ele que sobe. */
  const [file, setFile] = useState<File | null>(null);
  /** A foto crua esperando ajuste; enquanto não for `null`, o recorte está aberto. */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileButtonRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);
  const fileTitleId = useId();
  const fileHintId = useId();
  const fileErrorId = useId();
  const upload = useUploadGalleryPhoto(vehicleId);
  const queryClient = useQueryClient();
  const returnFocus = useReturnFocus();
  // Cache da lista de veículos, sem consulta nova: só para dizer, antes de enviar, que esta foto vira a capa.
  const { vehicle } = useVehicle(vehicleId);
  const becomesCover = vehicle != null && vehicle.primary_photo_id == null;

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function reset() {
    setCategory(defaultCategory ?? "exterior");
    setCaption("");
    setFile(null);
    setPendingFile(null);
    setFileError(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function focusFileButton() {
    requestAnimationFrame(() => {
      fileButtonRef.current?.focus();
      fileButtonRef.current?.scrollIntoView({ block: "center" });
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Zerar o input deixa escolher o mesmo arquivo de novo depois de cancelar o ajuste.
    event.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setFileError(`${picked.name} não é uma imagem. Escolha uma foto em JPEG, PNG ou WebP.`);
      focusFileButton();
      return;
    }
    setFileError(null);
    setPendingFile(picked);
  }

  /** O recorte já sai redimensionado, então o limite de tamanho é conferido aqui e não no arquivo cru. */
  function handleCropped(cropped: File) {
    const result = imageFileSchema.safeParse(cropped);
    setPendingFile(null);
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "Arquivo inválido.");
    } else {
      setFileError(null);
      setFile(cropped);
    }
    focusFileButton();
  }

  function handleCropCancel() {
    setPendingFile(null);
    focusFileButton();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError(null);
    if (!file) {
      setFileError("Escolha uma foto.");
      focusFileButton();
      return;
    }
    submittingRef.current = true;
    try {
      await upload.mutateAsync({ file, category, caption: caption.trim() || null });
      handleOpenChange(false);
      onUploaded?.();
    } catch (mutationError) {
      setError(`O envio não foi concluído. ${translatePostgresError(mutationError)}`);
      // Se a linha chegou a ser gravada (só a capa falhou), a galeria mostra a foto em vez de escondê-la.
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    } finally {
      submittingRef.current = false;
    }
  }

  const fileDescribedBy = [fileHintId, fileError ? fileErrorId : null].filter(Boolean).join(" ");

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={UPLOAD_DIALOG_CLASSNAME}
          onOpenAutoFocus={(event) => {
            returnFocus.capture();
            focusDialogOnOpen(event);
          }}
          onCloseAutoFocus={returnFocus.onCloseAutoFocus}
        >
          <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
            <DialogTitle>Adicionar foto</DialogTitle>
            <DialogDescription>
              {becomesCover
                ? "O veículo está sem capa: esta foto vira a capa no card da garagem e no dashboard."
                : "A foto entra na galeria deste veículo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <FormBody>
              <section aria-labelledby={fileTitleId} className="flex flex-col gap-3 py-5">
                <div className="flex flex-col gap-1">
                  <h3 id={fileTitleId} className="type-section-title text-text-primary">
                    Foto
                  </h3>
                  <p id={fileHintId} className="text-sm text-text-secondary">
                    {FILE_HINT}
                  </p>
                </div>

                {previewUrl && file && (
                  <figure className="flex flex-col gap-1.5">
                    <div className={PHOTO_FRAME_CLASSNAME}>
                      <img src={previewUrl} alt="Prévia da foto ajustada" className="absolute inset-0 h-full w-full object-contain" />
                    </div>
                    <figcaption className="text-xs text-text-secondary">
                      Ajustada em 4:3 · {formatFileSize(file.size)} · enviada ao salvar
                    </figcaption>
                  </figure>
                )}

                {/*
                  No Android, listar MIME específicos faz o Chrome pedir o seletor com
                  lista de MIME extra, e só Google Fotos e Drive respondem — a galeria
                  do aparelho nem aparece como opção. Com o curinga "image" o seletor
                  de mídia padrão abre e a galeria nativa volta. O formato de verdade
                  continua validado depois do recorte, por imageFileSchema.

                  O input nativo fica escondido atrás de um botão do app: o texto
                  dele é do navegador (fica em inglês conforme o idioma do sistema).
                */}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={handleFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    ref={fileButtonRef}
                    type="button"
                    variant="outline"
                    aria-describedby={fileDescribedBy}
                    aria-invalid={!!fileError}
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    {file ? "Trocar foto" : "Escolher foto"}
                  </Button>
                  {file && (
                    <Button type="button" variant="ghost" onClick={() => setPendingFile(file)}>
                      <Crop className="h-4 w-4" aria-hidden="true" />
                      Ajustar enquadramento
                    </Button>
                  )}
                </div>
                <FieldError id={fileErrorId}>{fileError}</FieldError>
              </section>

              <FormSection title="Detalhes" className="border-t border-border">
                <FormField id="photo-category" label="Categoria">
                  {(a11y) => (
                    <Select
                      id="photo-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as VehiclePhotoRow["category"])}
                      {...a11y}
                    >
                      {VEHICLE_PHOTO_CATEGORIES.map((value) => (
                        <option key={value} value={value}>
                          {VEHICLE_PHOTO_CATEGORY_LABELS[value]}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
                <FormField
                  id="photo-caption"
                  label="Legenda"
                  optional
                  hint="Aparece embaixo da foto e é o texto lido no lugar dela por leitor de tela."
                >
                  {(a11y) => (
                    <Input
                      id="photo-caption"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Ex.: Rodas novas, aro 17"
                      {...a11y}
                    />
                  )}
                </FormField>
              </FormSection>
            </FormBody>

            <FormFooter error={error} submitting={upload.isPending} submitLabel="Enviar foto" submittingLabel="Enviando…" />
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropDialog file={pendingFile} onCancel={handleCropCancel} onConfirm={handleCropped} />
    </>
  );
}
