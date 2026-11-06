import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { INSET_CLASSNAME } from "./disclosure";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <AlertDialogPrimitive.Content
        className={cn(
          // Toda confirmação do app é de ação sem volta fácil (excluir, sair, revogar): o fio carmim no topo marca
          // isso antes mesmo do título, e a ação usa `destructive` — nunca o laranja da ação comum.
          "fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-lg border border-t-2 border-border border-t-error bg-surface-raised p-5 shadow-overlay focus:outline-none sm:p-6",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("type-dialog-title text-text-primary", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    // Abaixo de `sm` empilha em largura cheia, com a ação por cima do "Cancelar".
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant: "destructive" }), className)}
      {...props}
    />
  );
}

type AlertDialogRecordProps = {
  /** Identificação do registro: nome/título e as linhas de contexto (categoria, data, anexo). */
  children: React.ReactNode;
  /** O valor do registro, à direita (dinheiro, litros). Ausente é escrito por quem chama ("Custo não informado"). */
  value?: React.ReactNode;
  className?: string;
};

/**
 * Harmonização 01: o cartão neutro com o registro que vai ser excluído —
 * igual em todas as confirmações. O **texto** (título, consequências, o que
 * acontece com anexos e totais) continua de cada entidade; aqui só a forma.
 * Valor em display tabular, nunca mono.
 */
export function AlertDialogRecord({ children, value, className }: AlertDialogRecordProps) {
  return (
    <div
      className={cn(
        cn("flex items-start justify-between gap-3", RECORD_CARD_CLASSNAME),
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
      {value != null && <div className="type-value shrink-0 text-right text-sm text-text-primary">{value}</div>}
    </div>
  );
}

/** A mesma casca, para cartões de registro com outra composição (custos empilhados, veículo). */
export const RECORD_CARD_CLASSNAME = INSET_CLASSNAME;
