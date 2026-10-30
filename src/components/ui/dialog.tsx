import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <DialogPrimitive.Content
        onEscapeKeyDown={(event) => {
          /*
            Escape pertence ao popup mais interno. Com a lista de um combobox
            aberta, fechar o diálogo inteiro jogaria fora tudo que a pessoa
            digitou só porque ela quis dispensar as sugestões — o próprio
            combobox fecha a lista no bubble logo depois.

            Precisa ser aqui: o Radix escuta Escape no document em fase de
            captura, então nenhum `stopPropagation` lá dentro chega a tempo.
          */
          const foco = document.activeElement;
          if (foco?.getAttribute("aria-expanded") === "true") {
            event.preventDefault();
          }
          onEscapeKeyDown?.(event);
        }}
        className={cn(
          // Quem rola é o próprio diálogo (`overscroll-contain` pra não arrastar a página de trás); as ações dos
          // formulários ficam no fluxo, nunca fixas por cima do último campo. `dvh` acompanha o teclado virtual.
          "fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface-raised p-5 shadow-overlay focus:outline-none sm:p-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary sm:top-3 sm:right-3"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  // `pr-10`: o título não corre por baixo do botão de fechar (absoluto, 44px).
  return <div className={cn("mb-5 flex flex-col gap-1 pr-10", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold tracking-tight text-text-primary", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}
