import { useRef, useState, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { useDeleteVehicle, type VehicleWithSummary } from "./useVehicles";

type DeleteVehicleDialogProps = {
  vehicle: VehicleWithSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo banco, antes de o diálogo fechar. */
  onDeleted?: () => void;
};

/**
 * Etapa 03: o texto diz só o que o contrato faz. Excluir o veículo é um
 * `delete` em `vehicles`, e as tabelas abaixo têm `on delete cascade` pra ele
 * (migrations do backend, conferido): `expenses`, `fuel_logs`,
 * `maintenance_items`/`maintenance_records`, `issues`, `projects`/
 * `project_items`, `notes`, `documents`, `obligations`, `financings`,
 * `vehicle_photos` e `attachments`. Não há lixeira nem desfazer.
 *
 * O "Cancelar" recebe o foco ao abrir (padrão do `AlertDialog`) e fica embaixo
 * no celular, mais à mão que a ação destrutiva.
 */
export function DeleteVehicleDialog({
  vehicle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteVehicleDialogProps) {
  const deleteVehicle = useDeleteVehicle();
  const [error, setError] = useState<string | null>(null);
  /** O `disabled` só chega no próximo render; isto barra o segundo clique do mesmo quadro. */
  const deletingRef = useRef(false);

  async function handleConfirm(event: MouseEvent) {
    // Impede o AlertDialog de fechar sozinho antes da exclusão terminar.
    event.preventDefault();
    if (deletingRef.current) return;
    deletingRef.current = true;
    setError(null);
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      onDeleted?.();
      onOpenChange(false);
    } catch {
      setError("Não foi possível excluir o veículo. Tente de novo.");
    } finally {
      deletingRef.current = false;
    }
  }

  const details = [vehicle.model_year, vehicle.plate].filter(Boolean).join(" · ");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
          {/* Tudo como descrição: o leitor de tela anuncia qual carro junto com o título. */}
          <AlertDialogDescription asChild>
            <div className="mt-2 flex flex-col gap-3">
              <span className="flex flex-col gap-0.5 rounded-md border border-border bg-bg px-3 py-2.5">
                <span className="text-xs text-text-secondary">{vehicle.make}</span>
                <span className="font-medium break-words text-text-primary">
                  {vehicle.model}
                </span>
                {details && (
                  <span className="text-xs text-text-secondary">{details}</span>
                )}
              </span>
              <span className="font-medium text-text-primary">
                Esta ação não pode ser desfeita.
              </span>
              <span>
                Tudo o que foi registrado nele também sai do app: gastos,
                abastecimentos, manutenções, problemas, projetos, notas,
                documentos, obrigações, financiamento, fotos e anexos.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteVehicle.isPending}
          >
            {deleteVehicle.isPending && (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            )}
            {deleteVehicle.isPending ? "Excluindo…" : "Excluir veículo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
