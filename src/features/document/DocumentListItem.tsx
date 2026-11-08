import { useId, useState } from "react";
import { ExternalLink, FileImage, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { RowActionsMenu } from "@/components/ui/menu";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateOnly, formatFileSize, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS } from "./schemas";
import { getDocumentSignedUrl, type DocumentRow } from "./useDocuments";
import { fileKindLabel, type RecordStatus } from "./documentPresentation";

/**
 * Colunas a partir de `md`: documento (e detalhes) · validade · arquivo · "⋯".
 * O cabeçalho da lista usa o mesmo molde.
 */
export const DOCUMENT_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_11rem_10rem_2.75rem] md:grid-rows-[auto_1fr] md:gap-x-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] 2xl:gap-x-6";

type DocumentListItemProps = {
  doc: DocumentRow;
  status: RecordStatus | null;
  validity: string;
  onEdit: (doc: DocumentRow, trigger: HTMLElement | null) => void;
  onDelete: (doc: DocumentRow, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 11: um documento. Hierarquia: o nome, a situação e a validade, o que
 * ele é (tipo, emissão, valor) e o acesso ao arquivo. Nada é cortado: nome,
 * notas e o resto quebram linha.
 *
 * Arquivo: todo documento tem um (`storage_path` é obrigatório no banco — o
 * envio acontece antes de a linha existir). "Abrir" pede o link assinado na
 * hora (5 min, uso único) e abre em outra aba; a falha aparece aqui, junto
 * do botão. Trocar o arquivo não existe (só metadado na edição); o arquivo
 * sai junto com o documento.
 *
 * Celular: nome e "⋯" na primeira linha; validade, detalhes e arquivo
 * embaixo, na largura toda. A partir de `md`, colunas.
 */
export function DocumentListItem({ doc, status, validity, onEdit, onDelete }: DocumentListItemProps) {
  const identityId = useId();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const typeLabel = DOCUMENT_TYPE_LABELS[doc.doc_type];
  const details = [
    typeLabel,
    doc.issued_on ? `Emitido em ${formatDateOnly(doc.issued_on)}` : null,
    doc.amount != null ? formatMoney(doc.amount) : null,
  ].filter(Boolean);
  const notes = doc.notes?.trim() ? doc.notes : null;
  const hasFile = !!doc.storage_path;
  const FileIcon = doc.mime_type === "application/pdf" ? FileText : FileImage;

  async function handleOpen() {
    setOpenError(null);
    setOpening(true);
    try {
      const url = await getDocumentSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setOpenError("Não foi possível abrir o arquivo. Tente de novo.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-2 gap-y-1.5 px-(--panel-pad-x) py-3",
        DOCUMENT_ROW_GRID,
      )}
    >
      {/* Lido como contexto do "⋯" e do "Abrir": qual documento eles afetam. */}
      <span id={identityId} className="sr-only">
        {doc.title}, {typeLabel}, {validity}
      </span>

      <p className="type-item-title pt-0.5 break-words text-text-primary md:col-start-1 md:row-start-1 md:pt-px">
        {doc.title}
      </p>

      <div className="-my-2.5 flex justify-end md:col-start-4 md:row-span-2 md:row-start-1">
        <RowActionsMenu
          label="Ações do documento"
          editLabel="Editar documento"
          deleteLabel="Excluir documento"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(doc, trigger)}
          onDelete={(trigger) => onDelete(doc, trigger)}
        />
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1 md:flex-col md:items-start md:pt-px">
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
        <p
          className={cn(
            "text-sm tabular-nums",
            doc.expires_on ? "text-text-primary" : "text-text-secondary",
          )}
        >
          {/* "Vence hoje" já está no selo: aqui fica a data. */}
          {doc.expires_on ? (
            <time dateTime={doc.expires_on}>{status?.label === validity ? formatDateOnly(doc.expires_on) : validity}</time>
          ) : (
            validity
          )}
        </p>
      </div>

      <div className="col-span-2 flex min-w-0 flex-col gap-1 md:col-span-1 md:col-start-1 md:row-start-2">
        <p className="text-xs break-words text-text-secondary tabular-nums">{details.join(" · ")}</p>
        {notes && (
          <p className="max-w-prose text-xs break-words whitespace-pre-line text-text-secondary">
            <span className="sr-only">Notas: </span>
            {notes}
          </p>
        )}
      </div>

      <div className="col-span-2 flex min-w-0 flex-col items-start md:col-span-1 md:col-start-3 md:row-start-1 md:row-span-2">
        {hasFile ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2">
              <p className="flex items-center gap-1.5 text-xs text-text-secondary tabular-nums">
                <FileIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {fileKindLabel(doc.mime_type)} · {formatFileSize(doc.file_size_bytes)}
              </p>
              <button
                type="button"
                onClick={() => void handleOpen()}
                disabled={opening}
                aria-describedby={identityId}
                className={cn(textLinkClassName(), "-my-2.5 disabled:opacity-60 md:-ml-1")}
              >
                {opening ? "Abrindo…" : "Abrir"}
                <span className="sr-only"> arquivo (abre em outra aba)</span>
                {opening ? (
                  <Loader2 className="h-3.5 w-3.5 text-text-secondary motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                )}
              </button>
            </div>
            <FieldError>{openError}</FieldError>
          </>
        ) : (
          <p className="text-xs text-text-secondary">Sem arquivo</p>
        )}
      </div>
    </li>
  );
}
