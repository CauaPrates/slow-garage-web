import { useId, useState } from "react";
import { Command } from "cmdk";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

type ComboboxProps = {
  id?: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string, option: ComboboxOption) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled?: boolean;
  loading?: boolean;
  "aria-describedby"?: string;
};

/**
 * Combobox com busca — Radix `Popover` (primitivo que o projeto já usa) por
 * cima do `cmdk`, no lugar do `<select>` nativo. Não é preciosismo: a lista de
 * modelos da FIPE passa de 500 itens numa marca comum (585 na Fiat, medido),
 * e `<select>` nativo não filtra por digitação.
 *
 * O gatilho copia os mesmos tokens de borda/foco do `Input` e do `Select` do
 * projeto — a caixa precisa parecer campo de formulário, não botão.
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  loading,
  "aria-describedby": describedBy,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  /** O `role="combobox"` do gatilho precisa apontar pra lista que ele abre (ARIA 1.2). */
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-describedby={describedBy}
          disabled={disabled || loading}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-base text-text-primary outline-none transition-colors hover:border-text-secondary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border md:text-sm",
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate",
              !selected && "text-text-secondary",
            )}
          >
            {loading ? "Carregando…" : (selected?.label ?? placeholder)}
          </span>
          {loading ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-text-secondary"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="h-4 w-4 shrink-0 text-text-secondary"
              aria-hidden="true"
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command
          // A lista pode ter centenas de itens; o filtro do cmdk é por
          // substring simples, que é o que o usuário espera ao digitar "gol".
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          {/*
            `outline-none` precisa de substituto (regra de foco visível do
            projeto). Aqui o indicador é a própria linha divisória virando
            âmbar — anel de foco dentro de um popover com `p-0` seria cortado
            pela borda, e o `Input` do projeto já usa `focus-visible:border-accent`
            como parte do mesmo padrão.
          */}
          <Command.Input
            placeholder={searchPlaceholder}
            className="h-11 w-full border-b border-border bg-transparent px-3 text-base text-text-primary outline-none transition-colors focus-visible:border-accent placeholder:text-text-secondary md:text-sm"
          />
          <Command.List id={listboxId} className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-text-secondary">
              {emptyMessage}
            </Command.Empty>
            {options.map((option) => (
              <Command.Item
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value, option);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary transition-colors duration-150 data-[selected=true]:bg-bg"
              >
                <Check
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 text-accent",
                    option.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
