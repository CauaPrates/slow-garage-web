import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ReactNode } from "react";

type FuelToggleFieldProps = {
  /** `id` do interruptor — o rótulo aponta pra ele (`htmlFor`) e a ajuda é `{id}-hint`. */
  id: string;
  label: string;
  hint: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Etapa 06: "Tanque cheio" e "Perdi o abastecimento anterior". Antes o
 * interruptor tinha 44×24 e ficava dentro de um `<label>` só com o texto.
 * Agora o próprio interruptor (`role="switch"`) é um botão de 56×44 com o
 * trilho desenhado dentro, e o rótulo ao lado é um `<label htmlFor>` de 44px
 * de altura: tocar no texto ou no trilho aciona o mesmo controle, uma vez só
 * (o rótulo repassa um clique ao botão; o botão não está dentro do rótulo,
 * então não há clique em dobro). O nome acessível vem do rótulo; a ajuda, do
 * `aria-describedby`; o estado, do `aria-checked` do Radix. Espaço e Enter
 * alternam pelo teclado.
 *
 * Etapa 07: também é o "Item ativo" do plano de manutenção (mesmo alvo, em vez
 * de mexer no `Switch` compartilhado).
 */
export function FuelToggleField({ id, label, hint, checked, onCheckedChange }: FuelToggleFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <label
          htmlFor={id}
          className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-text-primary select-none"
        >
          {label}
        </label>
        {/* Abaixo do rótulo, sem sobrepor: os 44px do rótulo inteiros acionam o controle. */}
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      </div>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={hintId}
        // Sem cantos arredondados: o botão não tem fundo, e o canto arredondado tiraria do toque um pedaço da área de 56×44.
        className="group -mr-1.5 flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center"
      >
        {/* Mesmo desenho do `Switch` (trilho 44×24, desligado em `border-strong`, 3:1 contra o fundo). */}
        <span
          aria-hidden="true"
          className="flex h-6 w-11 items-center rounded-full transition-colors duration-(--duration-fast) group-data-[state=checked]:bg-accent group-data-[state=unchecked]:bg-border-strong"
        >
          <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full shadow-sm transition-transform duration-(--duration-fast) data-[state=checked]:translate-x-5 data-[state=checked]:bg-accent-foreground data-[state=unchecked]:translate-x-0.5 data-[state=unchecked]:bg-field" />
        </span>
      </SwitchPrimitive.Root>
    </div>
  );
}
