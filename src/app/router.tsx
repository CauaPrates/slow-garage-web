import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/routes";

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <p className="p-6 text-sm text-text-secondary">
            Fundação da Fase 0 — nenhuma tela de domínio ainda.
          </p>
        ),
      },
    ],
  },
]);
