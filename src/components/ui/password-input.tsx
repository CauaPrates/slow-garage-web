import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo de senha com o olho de mostrar/ocultar. O `type` é controlado aqui —
 * quem usa não passa `type`. O botão fica dentro do campo, com 44px de alvo
 * de toque como o resto do app, e `tabIndex={-1}` de propósito: no Tab, quem
 * digita a senha vai direto pro próximo campo/botão, não pro olho.
 *
 * Etapa 14: o nome diz o que o toque faz agora ("Mostrar senha" / "Ocultar
 * senha") e é o único sinal de estado — o `aria-pressed` saiu porque, somado
 * ao nome que já muda, era lido como "Ocultar senha, pressionado".
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        tabIndex={-1}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex size-control items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
