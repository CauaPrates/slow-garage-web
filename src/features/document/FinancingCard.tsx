import { useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailItem } from "@/components/ui/disclosure";
import { FieldError } from "@/components/ui/field-error";
import { RowActionsMenu } from "@/components/ui/menu";
import { PANEL_CLASSNAME, PanelHeader } from "@/components/ui/panel";
import { formatCount, formatDateOnly, formatMoney, formatMonthlyRate } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { useAddPaidInstallment, type FinancingRow } from "./useFinancing";

export const CONTRACT_TITLE_ID = "financing-contract-title";
export const INSTALLMENTS_TITLE_ID = "financing-installments-title";

type FinancingCardProps = {
  vehicleId: string;
  financing: FinancingRow;
  onEdit: (trigger: HTMLElement | null) => void;
  onDelete: (trigger: HTMLElement | null) => void;
};

function InstallmentStat({ label, children, live = false }: { label: string; children: ReactNode; live?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-(--panel-pad-x) py-3">
      <dt className="type-overline text-text-secondary">{label}</dt>
      <dd className="min-w-0" aria-live={live ? "polite" : undefined}>
        {children}
      </dd>
    </div>
  );
}

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

/**
 * Etapa 11: o financiamento em dois blocos — o **contrato** (o que foi
 * combinado: valor financiado, parcela, quantidade, início, juros) e as
 * **parcelas** (o andamento: pagas, restantes e o valor delas). O contrato não tem
 * situação própria no banco; "Quitado"/"Em aberto" é das parcelas, a mesma
 * conta do botão de antes (pagas ≥ quantidade).
 *
 * RN-1: restantes e o valor delas (`outstanding_balance`) são colunas geradas — só lidas, nunca refeitas
 * aqui. Ausente é escrito ("Não informado", "Não calculado"), nunca vira
 * zero; R$ 0,00 só quando o banco tem zero. "Registrar parcela paga" soma 1
 * em `installments_paid` (AC-13); a falha aparece junto do botão. Nada daqui
 * entra em Gastos, no Histórico nem nos totais do veículo.
 */
export function FinancingCard({ vehicleId, financing, onEdit, onDelete }: FinancingCardProps) {
  const identityId = useId();
  const addInstallment = useAddPaidInstallment(vehicleId);
  const [addError, setAddError] = useState<string | null>(null);
  const addingRef = useRef(false);

  const count = financing.installment_count;
  const isPaidOff = count != null && financing.installments_paid >= count;
  const money = (value: number | null) => (value != null ? formatMoney(value) : null);

  async function handleAdd() {
    if (addingRef.current || isPaidOff) return;
    addingRef.current = true;
    setAddError(null);
    try {
      await addInstallment.mutateAsync(financing);
    } catch (mutationError) {
      setAddError(`A parcela não foi registrada. ${translatePostgresError(mutationError)}`);
    } finally {
      addingRef.current = false;
    }
  }

  return (
    <>
      <section aria-labelledby={CONTRACT_TITLE_ID} className={PANEL_CLASSNAME}>
        <span id={identityId} className="sr-only">
          Financiamento deste veículo
        </span>
        <PanelHeader
          title="Contrato"
          titleId={CONTRACT_TITLE_ID}
          description="O que foi combinado com o banco ou a financeira."
          className="items-center"
          action={
            <div className="-my-2">
              <RowActionsMenu
                label="Ações do financiamento"
                editLabel="Editar financiamento"
                deleteLabel="Excluir financiamento"
                describedBy={identityId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          }
        />
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-(--panel-pad-x) py-4 min-[25rem]:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Valor financiado" value={money(financing.financed_amount)} />
          <DetailItem label="Valor da parcela" value={money(financing.installment_amount)} />
          <DetailItem
            label="Quantidade de parcelas"
            value={count != null ? plural(count, "parcela", "parcelas") : null}
          />
          <DetailItem label="Início" value={financing.started_on ? formatDateOnly(financing.started_on) : null} />
          <DetailItem
            label="Taxa de juros"
            value={financing.interest_rate_monthly != null ? formatMonthlyRate(financing.interest_rate_monthly) : null}
          />
        </dl>
      </section>

      <section aria-labelledby={INSTALLMENTS_TITLE_ID} className={PANEL_CLASSNAME}>
        <PanelHeader
          title="Parcelas"
          titleId={INSTALLMENTS_TITLE_ID}
          description="O andamento do pagamento, pela contagem de parcelas pagas."
          className="items-center"
          action={
            count != null && (
              <Badge tone={isPaidOff ? "success" : "neutral"}>{isPaidOff ? "Quitado" : "Em aberto"}</Badge>
            )
          }
        />
        <dl className="grid grid-cols-1 divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <InstallmentStat label="Pagas" live>
            <span className="type-stat text-text-primary">{formatCount(financing.installments_paid)}</span>
            <span className="text-sm text-text-secondary">
              {count != null ? ` de ${formatCount(count)}` : " · total de parcelas não informado"}
            </span>
          </InstallmentStat>
          <InstallmentStat label="Restantes">
            {financing.installments_remaining != null ? (
              <span className="type-stat text-text-primary">{formatCount(financing.installments_remaining)}</span>
            ) : (
              <span className="text-sm text-text-secondary">Não calculado</span>
            )}
          </InstallmentStat>
          {/* Revisão: "Valor das parcelas restantes" em vez de "Saldo a pagar" — é exatamente a conta exibida (restantes × parcela), não o saldo devedor do contrato. */}
          <InstallmentStat label="Valor das parcelas restantes">
            {financing.outstanding_balance != null ? (
              <span className="type-stat break-words text-text-primary">{formatMoney(financing.outstanding_balance)}</span>
            ) : (
              <span className="text-sm text-text-secondary">Não calculado</span>
            )}
          </InstallmentStat>
        </dl>
        <div className="flex flex-col items-start gap-3 px-(--panel-pad-x) py-3">
          <p className="type-caption text-text-secondary">
            {financing.outstanding_balance != null
              ? "Valor das parcelas restantes = parcelas restantes × valor da parcela."
              : count == null
                ? "As parcelas restantes e o valor delas precisam da quantidade de parcelas, informada no contrato."
                : "O valor das parcelas restantes precisa do valor da parcela, informado no contrato."}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              variant="outline"
              disabled={isPaidOff || addInstallment.isPending}
              onClick={() => void handleAdd()}
            >
              {addInstallment.isPending ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {addInstallment.isPending ? "Registrando…" : "Registrar parcela paga"}
            </Button>
            <p className={cn("text-sm text-text-secondary", isPaidOff && "text-text-primary")}>
              {isPaidOff ? "Todas as parcelas estão pagas." : "Soma 1 às parcelas pagas."}
            </p>
          </div>
          <FieldError>{addError}</FieldError>
        </div>
      </section>
    </>
  );
}
