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

type ActionLabels = {
  /** Visível a partir de `xl`, onde cabe inteiro — e o nome acessível em toda largura. */
  full: string;
  /** Visível de `sm` a `xl`: com 4 por linha no tablet e no notebook, o texto inteiro não cabe. */
  medium: string;
  /** Visível abaixo de `sm`. */
  short: string;
  /** Nome no celular quando o rótulo curto não está contido no completo ("Abastecer"). */
  shortName?: string;
};

type ActionButtonProps = {
  icon: LucideIcon;
  labels: ActionLabels;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

/** Texto visível + o nome completo pro leitor de tela, sem repetir quando os dois são iguais. */
function ActionLabel({ visible, name, className }: { visible: string; name: string; className: string }) {
  if (visible === name) return <span className={cn("max-w-full truncate", className)}>{visible}</span>;
  return (
    <span className={cn("max-w-full truncate", className)}>
      <span aria-hidden="true">{visible}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

/**
 * Celular: ícone sobre rótulo, 4 por linha, alvo de 56px. A partir de `sm`:
 * ícone ao lado do rótulo, faixa de 44px.
 *
 * Etapa 05: são ações, não abas — as quatro têm o mesmo contorno neutro e
 * nenhuma fica "acesa". Hover, pressionado e foco são os do botão (`outline`
 * + o contorno laranja global de `:focus-visible`). O texto visível encurta
 * com a largura, mas o nome acessível é sempre a ação inteira e contém o que
 * está escrito na tela.
 */
function ActionButton({ icon: Icon, labels, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "outline" }),
        // 11px no celular, como a barra inferior: "Manutenção" em 12px não cabia em 1/4 de 360px.
        "h-auto min-h-control-touch min-w-0 flex-col gap-1 px-0.5 py-2 text-[11px] sm:min-h-control sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
      <ActionLabel className="sm:hidden" visible={labels.short} name={labels.shortName ?? labels.full} />
      <ActionLabel className="hidden sm:inline xl:hidden" visible={labels.medium} name={labels.full} />
      <ActionLabel className="hidden xl:inline" visible={labels.full} name={labels.full} />
    </button>
  );
}

/**
 * Fase 13: cada botão abre o diálogo já existente da entidade, direto por
 * cima da VehiclePage — nunca navega (decisão do clarify).
 *
 * Etapa 04: abastecimento vem primeiro (o registro do dia a dia). Etapa 05:
 * deixou de ser a única ação cheia — o laranja parecia uma aba selecionada.
 * Os diálogos, defaults e campos são os mesmos de antes.
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
        <ActionButton
          icon={Fuel}
          labels={{
            full: "Registrar abastecimento",
            medium: "Abastecimento",
            short: "Abastecer",
            shortName: "Abastecer: registrar abastecimento",
          }}
          onClick={(e) => handleOpen("fuel", e)}
        />
        <ActionButton
          icon={Receipt}
          labels={{ full: "Registrar gasto", medium: "Gasto", short: "Gasto" }}
          onClick={(e) => handleOpen("expense", e)}
        />
        <ActionButton
          icon={Wrench}
          labels={{ full: "Registrar manutenção", medium: "Manutenção", short: "Manutenção" }}
          onClick={(e) => handleOpen("maintenance", e)}
        />
        <ActionButton
          icon={Camera}
          labels={{ full: "Adicionar foto", medium: "Foto", short: "Foto" }}
          onClick={(e) => handleOpen("photo", e)}
        />
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
