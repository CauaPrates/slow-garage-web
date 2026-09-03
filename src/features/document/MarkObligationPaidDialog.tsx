import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { todayDateOnly } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useMarkObligationPaid, type ObligationRow } from "./useObligations";

type MarkObligationPaidDialogProps = {
  vehicleId: string;
  obligation: ObligationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** AC-8: data default hoje, editável antes de confirmar — não é fixo em "agora mesmo". */
export function MarkObligationPaidDialog({
  vehicleId,
  obligation,
  open,
  onOpenChange,
}: MarkObligationPaidDialogProps) {
  const markPaid = useMarkObligationPaid(vehicleId);
  const [paidOn, setPaidOn] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await markPaid.mutateAsync({ id: obligation.id, paidOn });
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setPaidOn(todayDateOnly());
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar "{obligation.label}" como paga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paidOnConfirm">Data do pagamento</Label>
            <Input
              id="paidOnConfirm"
              type="date"
              value={paidOn}
              onChange={(event) => setPaidOn(event.target.value)}
              required
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={markPaid.isPending}>
            {markPaid.isPending ? "Salvando…" : "Confirmar pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
