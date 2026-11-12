import { useRef, useState, type FormEvent } from "react";
import { AlertDialogRecord } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FORM_DIALOG_CLASSNAME,
  FORM_DIALOG_HEADER_CLASSNAME,
  FormBody,
  FormField,
  FormFooter,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatMoney, todayDateOnly } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { OBLIGATION_KIND_LABELS } from "./schemas";
import { useMarkObligationPaid, type ObligationRow } from "./useObligations";

type MarkObligationPaidDialogProps = {
  vehicleId: string;
  obligation: ObligationRow;
  /** Linha de vencimento já escrita pela lista ("Venceu em 27/10/2026"). */
  dateLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Depois do pagamento confirmado pelo servidor — o botão da linha some (a obrigação vai para Pagas). */
  onPaid?: () => void;
};

/**
 * AC-8: data padrão hoje, editável antes de confirmar. RN-3: pagar é o único
 * jeito de silenciar o alerta — a descrição diz isso. Etapa 11: a casca dos
 * formulários (rodapé com "Cancelar" e a ação), estreita, com o registro no
 * cartão comum.
 */
export function MarkObligationPaidDialog({
  vehicleId,
  obligation,
  dateLabel,
  open,
  onOpenChange,
  onPaid,
}: MarkObligationPaidDialogProps) {
  const markPaid = useMarkObligationPaid(vehicleId);
  const [paidOn, setPaidOn] = useState(todayDateOnly);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (next) setPaidOn(todayDateOnly());
    else setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    try {
      await markPaid.mutateAsync({ id: obligation.id, paidOn });
      onPaid?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(FORM_DIALOG_CLASSNAME, "max-w-md")}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Marcar como paga</DialogTitle>
          <DialogDescription>A obrigação passa para Pagas e deixa de gerar alerta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
          <FormBody>
            <div className="flex flex-col gap-4 py-5">
              <AlertDialogRecord value={obligation.amount != null ? formatMoney(obligation.amount) : undefined}>
                <p className="text-sm font-medium break-words text-text-primary">{obligation.label}</p>
                <p className="text-xs text-text-secondary">
                  {OBLIGATION_KIND_LABELS[obligation.kind]} · {dateLabel}
                </p>
              </AlertDialogRecord>
              <FormField id="paidOnConfirm" label="Data do pagamento" hint="Hoje, se você não mudar.">
                {(a11y) => (
                  <Input
                    id="paidOnConfirm"
                    type="date"
                    value={paidOn}
                    onChange={(event) => setPaidOn(event.target.value)}
                    required
                    {...a11y}
                  />
                )}
              </FormField>
            </div>
          </FormBody>
          <FormFooter error={error} submitting={markPaid.isPending} submitLabel="Confirmar pagamento" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
