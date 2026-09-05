import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary outline-none transition-colors placeholder:text-text-secondary hover:border-text-secondary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
