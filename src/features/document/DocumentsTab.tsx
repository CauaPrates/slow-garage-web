import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/ui/feedback";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatCount, todayDateOnly } from "@/lib/format";
import { DOCUMENT_ROW_GRID, DocumentListItem } from "./DocumentListItem";
import { CreateDocumentDialog } from "./CreateDocumentDialog";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";
import { documentStatus, documentValidityLabel, findAlert } from "./documentPresentation";
import { restoreFocus } from "./focus";
import { TabIntro, type AlertsState } from "./tabParts";
import { useDocuments, type DocumentRow } from "./useDocuments";

const LIST_TITLE_ID = "documents-list-title";

/**
 * Etapa 11, aba Documentos: a mesma consulta (vencimento mais próximo
 * primeiro, sem validade no fim), os mesmos diálogos. Os diálogos de editar e
 * excluir moram aqui, não na linha — editado, o documento pode mudar de lugar
 * na ordem; o foco volta ao "⋯" ou, se a linha saiu, ao título da lista.
 */
export function DocumentsTab({ vehicleId, alerts }: { vehicleId: string; alerts: AlertsState }) {
  const query = useDocuments(vehicleId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<DocumentRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const deletedRef = useRef(false);

  const today = todayDateOnly();
  const documents = query.data ?? [];
  const rows = documents.map((doc) => {
    const alert = findAlert(alerts.data, "documents", doc.id);
    return {
      doc,
      alert,
      status: documentStatus(doc, alert, alerts.ready, today),
      validity: documentValidityLabel(doc, today),
    };
  });
  const expired = rows.filter((r) => r.status?.tone === "error").length;
  const expiring = rows.filter((r) => r.status?.tone === "warning").length;
  const summary = [
    `${formatCount(documents.length)} ${documents.length === 1 ? "documento" : "documentos"}`,
    expired > 0 && `${formatCount(expired)} ${expired === 1 ? "vencido" : "vencidos"}`,
    expiring > 0 && `${formatCount(expiring)} a vencer`,
  ]
    .filter(Boolean)
    .join(" · ");

  // O editado/excluído sempre na versão mais recente da lista.
  const editingDoc = editing ? (documents.find((d) => d.id === editing.id) ?? editing) : null;
  const deletingRow = deleting ? (rows.find((r) => r.doc.id === deleting.id) ?? null) : null;
  const empty = query.isSuccess && documents.length === 0;

  const openCreate = (
    <Button onClick={() => setCreateOpen(true)}>
      <Upload className="h-4 w-4" aria-hidden="true" />
      Enviar documento
    </Button>
  );

  return (
    <>
      {!empty && <TabIntro action={openCreate}>CRLV, apólice, notas e laudos, do vencimento mais próximo ao sem validade.</TabIntro>}

      {empty ? (
        <EmptyState
          icon={FileText}
          titleId={LIST_TITLE_ID}
          title="Nenhum documento guardado neste veículo."
          action={<Button onClick={() => setCreateOpen(true)}>Enviar primeiro documento</Button>}
        >
          CRLV, apólice de seguro, nota fiscal, laudo: envie o arquivo (imagem ou PDF) e, se tiver, a data de
          vencimento — ele entra nos alertas 30 dias antes.
        </EmptyState>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader
            title="Documentos guardados"
            titleId={LIST_TITLE_ID}
            action={<PanelCount>{query.isSuccess ? summary : null}</PanelCount>}
          />
          {query.isLoading && <SkeletonList label="Carregando documentos…" />}
          {query.isError && (
            <InlineError onRetry={() => void query.refetch()}>
              Não foi possível carregar os documentos. As outras abas continuam disponíveis.
            </InlineError>
          )}
          {query.isSuccess && (
            <>
              <ListColumns className={DOCUMENT_ROW_GRID}>
                <span>Documento</span>
                <span>Validade</span>
                <span>Arquivo</span>
                <span />
              </ListColumns>
              <ul className="divide-y divide-border">
                {rows.map(({ doc, status, validity }) => (
                  <DocumentListItem
                    key={doc.id}
                    doc={doc}
                    status={status}
                    validity={validity}
                    onEdit={(item, trigger) => {
                      triggerRef.current = trigger;
                      setEditing(item);
                      setEditOpen(true);
                    }}
                    onDelete={(item, trigger) => {
                      triggerRef.current = trigger;
                      deletedRef.current = false;
                      setDeleting(item);
                      setDeleteOpen(true);
                    }}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <CreateDocumentDialog
        vehicleId={vehicleId}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          // Aberto pelo estado vazio: o botão some quando o primeiro documento entra; o foco vai pra lista.
          if (!open) restoreFocus(null, LIST_TITLE_ID);
        }}
      />
      {editingDoc && (
        <EditDocumentDialog
          key={editingDoc.id}
          vehicleId={vehicleId}
          doc={editingDoc}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) restoreFocus(triggerRef.current, LIST_TITLE_ID);
          }}
        />
      )}
      {deleting && (
        <DeleteDocumentDialog
          key={deleting.id}
          vehicleId={vehicleId}
          doc={deletingRow?.doc ?? deleting}
          validity={deletingRow?.validity ?? documentValidityLabel(deleting, today)}
          hasAlert={!!deletingRow?.alert}
          open={deleteOpen}
          onDeleted={() => {
            deletedRef.current = true;
          }}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) restoreFocus(triggerRef.current, LIST_TITLE_ID, deletedRef.current);
          }}
        />
      )}
    </>
  );
}
