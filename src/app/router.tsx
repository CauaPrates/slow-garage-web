import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { GuestRoute } from "@/components/shared/GuestRoute";
import { ROUTES } from "@/lib/routes";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { SignInPage } from "@/features/auth/SignInPage";
import { ConfirmEmailPendingPage } from "@/features/auth/ConfirmEmailPendingPage";
import { RequestPasswordResetPage } from "@/features/auth/RequestPasswordResetPage";
import { UpdatePasswordPage } from "@/features/auth/UpdatePasswordPage";
import { SettingsPage } from "@/features/auth/SettingsPage";
import { VehicleListPage } from "@/features/vehicle/VehicleListPage";
import { VehiclePage } from "@/features/vehicle/VehiclePage";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.home,
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <VehicleListPage />,
          },
          {
            path: "configuracoes",
            element: <SettingsPage />,
          },
          {
            path: "v/:vehicleId",
            element: <VehiclePage />,
          },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.entrar, element: <SignInPage /> },
      { path: ROUTES.cadastro, element: <SignUpPage /> },
      { path: ROUTES.recuperarSenha, element: <RequestPasswordResetPage /> },
    ],
  },
  { path: ROUTES.confirmeEmail, element: <ConfirmEmailPendingPage /> },
  { path: ROUTES.redefinirSenha, element: <UpdatePasswordPage /> },
]);
