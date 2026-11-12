import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGarageSearch } from "./garageFilters";

type GarageSearchFieldProps = {
  /** Só o campo do cabeçalho (desktop) responde a ⌘K / Ctrl K — evita dois ouvintes na mesma página. */
  shortcut?: boolean;
  className?: string;
};

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * "Buscar na garagem…" (ADR-096). Filtra os veículos da Minha garagem por
 * marca, modelo, versão, ano e placa. O campo do cabeçalho (desktop) e o da
 * barra da coleção (celular) são o mesmo filtro (`useGarageSearch`). Busca
 * só veículos — não registros.
 *
 * ⌘K / Ctrl K leva o foco ao campo (a dica aparece dentro dele); Escape com
 * texto limpa, Escape sem texto devolve o foco à página.
 */
export function GarageSearchField({ shortcut = false, className }: GarageSearchFieldProps) {
  const [query, setQuery] = useGarageSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  return (
    <div className={cn("garage-search", className)} role="search">
      <Search className="garage-search__icon h-4 w-4" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        aria-label="Buscar na garagem"
        aria-keyshortcuts={shortcut ? (IS_MAC ? "Meta+K" : "Control+K") : undefined}
        placeholder="Buscar na garagem…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (query) setQuery("");
          else inputRef.current?.blur();
        }}
        className="garage-search__input"
      />
      {query ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="garage-search__clear"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        shortcut &&
        !focused && (
          <kbd className="garage-search__kbd" aria-hidden="true">
            {IS_MAC ? "⌘" : "Ctrl"} K
          </kbd>
        )
      )}
    </div>
  );
}
