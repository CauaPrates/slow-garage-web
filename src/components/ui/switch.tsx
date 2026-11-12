import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** Trilho desligado em `border-strong` (3:1 contra o card) — antes era `surface` sobre `surface` e o controle sumia dentro do card. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-border-strong",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full shadow-sm transition-transform duration-(--duration-fast) data-[state=checked]:translate-x-5 data-[state=checked]:bg-accent-foreground data-[state=unchecked]:translate-x-0.5 data-[state=unchecked]:bg-field",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
