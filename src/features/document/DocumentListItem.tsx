import { useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatMoney, todayDateOnly } from "@/lib/format";
import { DOCUMENT_TYPE_LABELS } from "./schemas";
import { getDocumentSignedUrl, type DocumentRow } from "./useDocuments";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";

type DocumentListItemProps = {
  vehicleId: string;
  doc: DocumentRow;
};

export function DocumentListItem({ vehicleId, doc }: DocumentListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const isExpired = doc.expires_on != null && doc.expires_on < todayDateOnly();

  async function handleView() {
    setViewError(null);
    setViewing(true);
    try {
      const url = await getDocumentSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setViewError("Não foi possível abrir o documento. Tente de novo.");
    } finally {
      setViewing(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{doc.title}</p>
        <p className="text-sm text-text-secondary">
          {DOCUMENT_TYPE_LABELS[doc.doc_type]}
          {doc.amount != null ? ` · ${formatMoney(doc.amount)}` : ""}
        </p>
        {doc.expires_on && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              isExpired ? "text-error" : "text-text-secondary",
            )}
          >
            {isExpired && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
            {isExpired ? "Vencido em " : "Vence em "}
            {formatDateOnly(doc.expires_on)}
          </p>
        )}
        {viewError && <p className="mt-1 text-xs text-error">{viewError}</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex gap-1">
          <Button variant="ghost" disabled={viewing} onClick={handleView}>
            {viewing ? "Abrindo…" : "Ver"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar documento"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir documento"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditDocumentDialog
        vehicleId={vehicleId}
        doc={doc}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteDocumentDialog
        vehicleId={vehicleId}
        doc={doc}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
