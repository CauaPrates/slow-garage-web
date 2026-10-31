import { useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Fuel, Receipt, Wrench, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { CreateFuelLogDialog } from "@/features/fuel/CreateFuelLogDialog";
import { CreateMaintenanceRecordDialog } from "@/features/maintenance/CreateMaintenanceRecordDialog";
import type { MaintenanceItemWithStatus } from "@/features/maintenance/useMaintenanceItems";
import { UploadPhotoDialog } from "@/features/photo/UploadPhotoDialog";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type QuickActionsRowProps = {
  vehicleId: string;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultFuelType: Database["public"]["Enums"]["fuel_type"];
  maintenanceItems: MaintenanceItemWithStatus[];
};

type DialogKey = "expense" | "fuel" | "maintenance" | "photo";

type ActionButtonProps = {
  icon: LucideIcon;
  /** Rótulo do celular, quando o completo não cabe em 1/4 de 360px. */
  shortLabel?: string;
  label: string;
  primary?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Celular: ícone sobre rótulo, 4 por linha, alvo de 56px. A partir de `sm`:
 * ícone ao lado do rótulo, faixa de 44px. O rótulo curto só troca o texto
 * visível — o nome acessível é sempre o texto que está na tela.
 */
function ActionButton({ icon: Icon, shortLabel, label, primary = false, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: primary ? "primary" : "outline" }),
        // 11px no celular, como a barra inferior: "Manutenção" em 12px não cabia em 1/4 de 360px.
        "h-auto min-h-14 min-w-0 flex-col gap-1 px-0.5 py-2 text-[11px] sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden truncate sm:inline">{label}</span>
        </>
      ) : (
        <span className="max-w-full truncate">{label}</span>
      )}
    </button>
  );
}

/**
 * Fase 13: cada botão abre o diálogo já existente da entidade, direto por
 * cima da VehiclePage — nunca navega (decisão do clarify).
 *
 * Etapa 04: abastecimento vem primeiro e é a única ação cheia (o registro do
 * dia a dia, como no protótipo); as outras três ficam em contorno, com nome
 * visível. Os diálogos, defaults e campos são os mesmos de antes.
 */
export function QuickActionsRow({
  vehicleId,
  categories,
  defaultFuelType,
  maintenanceItems,
}: QuickActionsRowProps) {
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const navigate = useNavigate();
  // Os diálogos não têm gatilho próprio (abrem por estado): sem isto, fechar deixava o foco no `<body>`.
  const lastTrigger = useRef<HTMLElement | null>(null);

  function handleOpen(key: DialogKey, event: MouseEvent<HTMLButtonElement>) {
    lastTrigger.current = event.currentTarget;
    setOpenDialog(key);
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    setOpenDialog(null);
    requestAnimationFrame(() => lastTrigger.current?.focus());
  }

  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="sr-only">
        Registrar
      </h2>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        <ActionButton icon={Fuel} label="Abastecimento" shortLabel="Abastecer" primary onClick={(e) => handleOpen("fuel", e)} />
        <ActionButton icon={Receipt} label="Gasto" onClick={(e) => handleOpen("expense", e)} />
        <ActionButton icon={Wrench} label="Manutenção" onClick={(e) => handleOpen("maintenance", e)} />
        <ActionButton icon={Camera} label="Foto" onClick={(e) => handleOpen("photo", e)} />
      </div>

      <CreateExpenseDialog
        vehicleId={vehicleId}
        categories={categories}
        open={openDialog === "expense"}
        onOpenChange={handleOpenChange}
      />
      <CreateFuelLogDialog
        vehicleId={vehicleId}
        defaultFuelType={defaultFuelType}
        open={openDialog === "fuel"}
        onOpenChange={handleOpenChange}
      />
      <CreateMaintenanceRecordDialog
        vehicleId={vehicleId}
        items={maintenanceItems}
        open={openDialog === "maintenance"}
        onOpenChange={handleOpenChange}
      />
      {/* Única ação da linha que navega: foto enviada daqui só é vista na galeria, então leva o usuário até ela. */}
      <UploadPhotoDialog
        vehicleId={vehicleId}
        open={openDialog === "photo"}
        onOpenChange={handleOpenChange}
        onUploaded={() => navigate(ROUTES.vehiclePhotos(vehicleId))}
      />
    </section>
  );
}
