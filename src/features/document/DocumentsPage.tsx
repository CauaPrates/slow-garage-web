import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { AlertBanner } from "@/features/maintenance/AlertBanner";
import { useVehicleAlerts } from "@/features/maintenance/useVehicleAlerts";
import { useDocuments } from "./useDocuments";
import { useObligations } from "./useObligations";
import { useFinancing } from "./useFinancing";
import { DocumentListItem } from "./DocumentListItem";
import { ObligationListItem } from "./ObligationListItem";
import { FinancingCard } from "./FinancingCard";
import { PhotoGallery } from "./PhotoGallery";
import { CreateDocumentDialog } from "./CreateDocumentDialog";
import { CreateObligationDialog } from "./CreateObligationDialog";
import { CreateFinancingDialog } from "./CreateFinancingDialog";

const TABS = [
  { key: "documentos", label: "Documentos" },
  { key: "obrigacoes", label: "Obrigações" },
  { key: "financiamento", label: "Financiamento" },
  { key: "fotos", label: "Fotos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DOCUMENT_ALERT_TYPES = new Set([
  "obligation_overdue",
  "obligation_due_soon",
  "document_expired",
  "document_expiring",
]);

export function DocumentsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (TABS.find((t) => t.key === searchParams.get("aba"))?.key ??
    "documentos") as TabKey;

  const [createDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [createObligationOpen, setCreateObligationOpen] = useState(false);
  const [createFinancingOpen, setCreateFinancingOpen] = useState(false);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(
    () => searchParams.get("aba") === "fotos" && searchParams.get("novo") === "1",
  );

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const documentsQuery = useDocuments(vehicleId ?? "");
  const obligationsQuery = useObligations(vehicleId ?? "");
  const financingQuery = useFinancing(vehicleId ?? "");
  const alertsQuery = useVehicleAlerts(vehicleId ?? "");

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTab(tab: TabKey) {
    const next = new URLSearchParams(searchParams);
    next.set("aba", tab);
    setSearchParams(next, { replace: true });
  }

  if (vehicleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os documentos.</p>
        <Button variant="ghost" onClick={() => refetchVehicle()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  const relevantAlerts = (alertsQuery.data ?? []).filter(
    (alert) => alert.alert_type != null && DOCUMENT_ALERT_TYPES.has(alert.alert_type),
  );

  const documents = documentsQuery.data ?? [];
  const obligations = obligationsQuery.data ?? [];
  const pendingObligations = obligations.filter((o) => o.paid_on == null);
  const paidObligations = obligations.filter((o) => o.paid_on != null);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-medium text-text-primary">Documentos</h1>
        <p className="text-sm text-text-secondary">
          {vehicle.make} {vehicle.model}
        </p>
      </div>

      {relevantAlerts.length > 0 && <AlertBanner alerts={relevantAlerts} />}

      <div
        role="tablist"
        aria-label="Seções de documentos"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setTab(tab.key)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-2 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "documentos" && (
        <div role="tabpanel" id="panel-documentos" aria-labelledby="tab-documentos" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateDocumentOpen(true)}>Novo documento</Button>
          </div>

          {documentsQuery.isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
              ))}
            </div>
          )}

          {documentsQuery.isError && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              <p className="text-sm text-text-secondary">Não foi possível carregar os documentos.</p>
              <Button variant="ghost" onClick={() => documentsQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!documentsQuery.isLoading && !documentsQuery.isError && documents.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
              <p className="text-text-primary">Nenhum documento ainda.</p>
              <Button onClick={() => setCreateDocumentOpen(true)}>Adicionar o primeiro</Button>
            </div>
          )}

          {!documentsQuery.isLoading &&
            !documentsQuery.isError &&
            documents.map((doc) => (
              <DocumentListItem key={doc.id} vehicleId={vehicle.id} doc={doc} />
            ))}

          <CreateDocumentDialog
            vehicleId={vehicle.id}
            open={createDocumentOpen}
            onOpenChange={setCreateDocumentOpen}
          />
        </div>
      )}

      {activeTab === "obrigacoes" && (
        <div role="tabpanel" id="panel-obrigacoes" aria-labelledby="tab-obrigacoes" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateObligationOpen(true)}>Nova obrigação</Button>
          </div>

          {obligationsQuery.isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
              ))}
            </div>
          )}

          {obligationsQuery.isError && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              <p className="text-sm text-text-secondary">Não foi possível carregar as obrigações.</p>
              <Button variant="ghost" onClick={() => obligationsQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!obligationsQuery.isLoading && !obligationsQuery.isError && obligations.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
              <p className="text-text-primary">Nenhuma obrigação ainda.</p>
              <Button onClick={() => setCreateObligationOpen(true)}>Adicionar a primeira</Button>
            </div>
          )}

          {!obligationsQuery.isLoading && !obligationsQuery.isError && obligations.length > 0 && (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-text-secondary">Pendentes</h2>
                {pendingObligations.length === 0 ? (
                  <p className="text-sm text-text-secondary">Nenhuma obrigação pendente.</p>
                ) : (
                  pendingObligations.map((obligation) => (
                    <ObligationListItem
                      key={obligation.id}
                      vehicleId={vehicle.id}
                      obligation={obligation}
                    />
                  ))
                )}
              </section>

              {paidObligations.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium text-text-secondary">Pagas</h2>
                  {paidObligations.map((obligation) => (
                    <ObligationListItem
                      key={obligation.id}
                      vehicleId={vehicle.id}
                      obligation={obligation}
                    />
                  ))}
                </section>
              )}
            </>
          )}

          <CreateObligationDialog
            vehicleId={vehicle.id}
            open={createObligationOpen}
            onOpenChange={setCreateObligationOpen}
          />
        </div>
      )}

      {activeTab === "financiamento" && (
        <div role="tabpanel" id="panel-financiamento" aria-labelledby="tab-financiamento" className="flex flex-col gap-4">
          {financingQuery.isLoading && (
            <div className="h-32 animate-pulse rounded-lg border border-border bg-surface" />
          )}

          {financingQuery.isError && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              <p className="text-sm text-text-secondary">Não foi possível carregar o financiamento.</p>
              <Button variant="ghost" onClick={() => financingQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!financingQuery.isLoading && !financingQuery.isError && !financingQuery.data && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
              <p className="text-text-primary">Este veículo ainda não tem financiamento cadastrado.</p>
              <Button onClick={() => setCreateFinancingOpen(true)}>Cadastrar financiamento</Button>
            </div>
          )}

          {!financingQuery.isLoading && !financingQuery.isError && financingQuery.data && (
            <FinancingCard vehicleId={vehicle.id} financing={financingQuery.data} />
          )}

          <CreateFinancingDialog
            vehicleId={vehicle.id}
            open={createFinancingOpen}
            onOpenChange={setCreateFinancingOpen}
          />
        </div>
      )}

      {activeTab === "fotos" && (
        <div role="tabpanel" id="panel-fotos" aria-labelledby="tab-fotos">
          <PhotoGallery
            vehicleId={vehicle.id}
            primaryPhotoId={vehicle.primary_photo_id}
            uploadOpen={uploadPhotoOpen}
            onUploadOpenChange={setUploadPhotoOpen}
          />
        </div>
      )}
    </div>
  );
}
