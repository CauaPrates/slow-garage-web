import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- htmlFor chega via ...props em cada uso; a regra não enxerga spread
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium text-text-primary select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
