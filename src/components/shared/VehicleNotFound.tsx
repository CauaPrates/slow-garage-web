import { Link } from "react-router-dom";
import { textLinkClassName } from "@/components/ui/text-link";
import { ROUTES } from "@/lib/routes";

/**
 * Harmonização 01: o mesmo "Veículo não encontrado." que dez páginas do
 * veículo repetiam — o id da rota não existe ou não é deste usuário (o RLS
 * devolve vazio). Volta pra garagem.
 */
export function VehicleNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <p className="text-text-primary">Veículo não encontrado.</p>
      <Link to={ROUTES.home} className={textLinkClassName()}>
        Voltar para a garagem
      </Link>
    </div>
  );
}
