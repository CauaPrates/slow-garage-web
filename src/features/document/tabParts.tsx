import type { ReactNode } from "react";
import type { Database } from "@/types/database.types";

type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

/** Os alertas do veículo, lidos uma vez pela página e repassados às abas (a situação de cada linha vem deles). */
export type AlertsState = { data: VehicleAlert[] | undefined; ready: boolean };

/**
 * Abertura de cada aba: uma frase do que entra ali e a ação de cadastro da
 * própria aba — a ação fica no contexto da aba, não no cabeçalho da página.
 * No celular a ação desce para baixo da frase quando não cabe ao lado.
 */
export function TabIntro({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <p className="min-w-0 flex-1 basis-60 text-sm text-text-secondary">{children}</p>
      {action}
    </div>
  );
}
