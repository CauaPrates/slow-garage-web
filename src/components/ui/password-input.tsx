import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo de senha com o olho de mostrar/ocultar. O `type` é controlado aqui —
 * quem usa não passa `type`. O botão fica dentro do campo, com 44px de alvo
 * de toque como o resto do app.
 *
 * Etapa 14: o nome diz o que o toque faz agora ("Mostrar senha" / "Ocultar
 * senha") e é o único sinal de estado — o `aria-pressed` saiu porque, somado
 * ao nome que já muda, era lido como "Ocultar senha, pressionado".
 *
 * Etapa 14, ajuste final: o botão entrou na ordem do Tab (campo → olho →
 * próximo controle). Antes ficava com `tabIndex={-1}`, e quem usa só teclado
 * não tinha como conferir a senha digitada. É um `<button type="button">`
 * nativo: Enter e Espaço alternam sem enviar o formulário, e o foco continua
 * nele. O foco é o contorno global de `:focus-visible`, puxado para dentro
 * do campo para não vazar da borda.
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
        // Enter segurado repete o clique a cada tecla repetida; um acionamento, uma troca.
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.repeat) event.preventDefault();
        }}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex size-control items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:-outline-offset-4"
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
