import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Page, PageHeader } from "@/components/layout/Page";
import { InlineError, PageError } from "@/components/ui/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { useVehicleAlerts } from "@/features/maintenance/useVehicleAlerts";
import { DOCUMENT_TABS, DocumentTabs, panelId, tabId, type DocumentTabKey } from "./DocumentTabs";
import { DocumentsTab } from "./DocumentsTab";
import { ObligationsTab } from "./ObligationsTab";
import { FinancingTab } from "./FinancingTab";
import { PendingSummary } from "./PendingSummary";
import { useDocuments } from "./useDocuments";
import { useObligations } from "./useObligations";
import { useFinancing } from "./useFinancing";

const DOCUMENT_ALERT_TYPES = new Set([
  "obligation_overdue",
  "obligation_due_soon",
  "document_expired",
  "document_expiring",
]);

export function DocumentsPage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  // Trocar de veículo remonta a área inteira (diálogos e foco); a aba ativa continua no `?aba=` da URL.
  return <DocumentsWorkspace key={vehicleId} vehicleId={vehicleId} />;
}

/**
 * Etapa 11: Documentos, obrigações e financiamento. Cabeçalho compacto (o
 * veículo continua na trilha e no seletor do shell), as pendências de
 * documento e obrigação (`vehicle_alerts`, a mesma fonte do dashboard, da
 * Manutenção e do sino) e as três abas de antes, pelo mesmo `?aba=`
 * (`documentos` é o padrão; o dashboard abre `?aba=obrigacoes`). Cada aba
 * carrega, falha e fica vazia por si; a aba ativa sobrevive a erro, a
 * cadastro e a exclusão. Mesmas consultas, chaves, invalidações e diálogos.
 */
function DocumentsWorkspace({ vehicleId }: { vehicleId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (DOCUMENT_TABS.find((t) => t.key === searchParams.get("aba"))?.key ?? "documentos") as DocumentTabKey;

  const vehicleQuery = useVehicle(vehicleId);
  const alertsQuery = useVehicleAlerts(vehicleId);
  // As três consultas começam junto com a página, como antes — trocar de aba não espera a rede.
  useDocuments(vehicleId);
  useObligations(vehicleId);
  useFinancing(vehicleId);

  // Comportamento de antes: `?novo=1` é retirado da URL (a tela nunca abriu cadastro por ele).
  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTab(tab: DocumentTabKey) {
    const next = new URLSearchParams(searchParams);
    next.set("aba", tab);
    setSearchParams(next, { replace: true });
  }

  if (vehicleQuery.isLoading) {
    return (
      <Page aria-busy="true">
        <span className="sr-only">Carregando documentos…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-11 w-full max-w-md bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }
  if (vehicleQuery.isError) {
    return <PageError message="Não foi possível carregar os documentos." onRetry={() => void vehicleQuery.refetch()} />;
  }
  if (!vehicleQuery.vehicle) {
    return <VehicleNotFound />;
  }

  const relevantAlerts = (alertsQuery.data ?? []).filter(
    (alert) => alert.alert_type != null && DOCUMENT_ALERT_TYPES.has(alert.alert_type),
  );
  const alerts = { data: alertsQuery.data, ready: alertsQuery.isSuccess };
  return (
    <Page>
      <Breadcrumb items={[{ label: "Documentos" }]} />

      <PageHeader title="Documentos" description="Papéis, obrigações com prazo e financiamento deste veículo." />

      {/* Pendências recolhidas; no celular, um botão só (ajuste da revisão). */}
      {relevantAlerts.length > 0 && <PendingSummary alerts={relevantAlerts} />}

      {/* Falha dos alertas não vira "nada pendente": a situação das linhas passa a usar só a data. */}
      {alertsQuery.isError && (
        <InlineError onRetry={() => void alertsQuery.refetch()} className="p-0">
          Não foi possível carregar os alertas. Até carregar, a situação de cada item usa só a data de vencimento.
        </InlineError>
      )}

      <div className="flex flex-col gap-(--page-gap)">
        <DocumentTabs active={activeTab} onChange={setTab} />
        {/* Os três painéis existem (o `aria-controls` de cada aba aponta pra um), só o ativo tem conteúdo. */}
        {DOCUMENT_TABS.map(({ key }) => (
          <div
            key={key}
            role="tabpanel"
            id={panelId(key)}
            aria-labelledby={tabId(key)}
            hidden={key !== activeTab}
            className="flex flex-col gap-4"
          >
            {key === activeTab && key === "documentos" && <DocumentsTab vehicleId={vehicleId} alerts={alerts} />}
            {key === activeTab && key === "obrigacoes" && <ObligationsTab vehicleId={vehicleId} alerts={alerts} />}
            {key === activeTab && key === "financiamento" && <FinancingTab vehicleId={vehicleId} />}
          </div>
        ))}
      </div>
    </Page>
  );
}
