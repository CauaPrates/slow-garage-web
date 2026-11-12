import { useRef, useState } from "react";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError } from "@/components/ui/feedback";
import { PANEL_CLASSNAME, PanelHeader } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { CONTRACT_TITLE_ID, FinancingCard } from "./FinancingCard";
import { CreateFinancingDialog } from "./CreateFinancingDialog";
import { EditFinancingDialog } from "./EditFinancingDialog";
import { DeleteFinancingDialog } from "./DeleteFinancingDialog";
import { restoreFocus } from "./focus";
import { TabIntro } from "./tabParts";
import { useFinancing } from "./useFinancing";

const EMPTY_TITLE_ID = "financing-empty-title";

/**
 * Etapa 11, aba Financiamento: zero ou um por veículo (RN-2). Sem
 * financiamento, o estado vazio leva o cadastro; com, contrato e parcelas
 * (`FinancingCard`) e editar/excluir no "⋯" do contrato.
 */
export function FinancingTab({ vehicleId }: { vehicleId: string }) {
  const query = useFinancing(vehicleId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const deletedRef = useRef(false);
  const financing = query.data ?? null;

  return (
    <>
      {financing && <TabIntro>Um financiamento por veículo. Não entra em Gastos nem no total investido.</TabIntro>}

      {query.isLoading && (
        <section aria-labelledby={CONTRACT_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader title="Contrato" titleId={CONTRACT_TITLE_ID} />
          <SkeletonList label="Carregando financiamento…" rows={2} />
        </section>
      )}
      {query.isError && (
        <section aria-labelledby={CONTRACT_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader title="Contrato" titleId={CONTRACT_TITLE_ID} />
          <InlineError onRetry={() => void query.refetch()}>
            Não foi possível carregar o financiamento. As outras abas continuam disponíveis.
          </InlineError>
        </section>
      )}

      {query.isSuccess && !financing && (
        <EmptyState
          icon={Landmark}
          titleId={EMPTY_TITLE_ID}
          title="Este veículo não tem financiamento cadastrado."
          action={<Button onClick={() => setCreateOpen(true)}>Cadastrar financiamento</Button>}
        >
          Valor financiado, parcela, quantidade e início — tudo opcional. Depois, registre cada parcela paga e
          acompanhe as parcelas restantes e o valor delas.
        </EmptyState>
      )}

      {financing && (
        <>
          <FinancingCard
            vehicleId={vehicleId}
            financing={financing}
            onEdit={(trigger) => {
              triggerRef.current = trigger;
              setEditOpen(true);
            }}
            onDelete={(trigger) => {
              triggerRef.current = trigger;
              deletedRef.current = false;
              setDeleteOpen(true);
            }}
          />
          <EditFinancingDialog
            vehicleId={vehicleId}
            financing={financing}
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) restoreFocus(triggerRef.current, CONTRACT_TITLE_ID);
            }}
          />
          <DeleteFinancingDialog
            vehicleId={vehicleId}
            financing={financing}
            open={deleteOpen}
            onDeleted={() => {
              deletedRef.current = true;
            }}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) restoreFocus(triggerRef.current, EMPTY_TITLE_ID, deletedRef.current);
            }}
          />
        </>
      )}

      <CreateFinancingDialog
        vehicleId={vehicleId}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) restoreFocus(null, CONTRACT_TITLE_ID);
        }}
      />
    </>
  );
}
