import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export const DOCUMENT_TABS = [
  { key: "documentos", label: "Documentos" },
  { key: "obrigacoes", label: "Obrigações" },
  { key: "financiamento", label: "Financiamento" },
] as const;

export type DocumentTabKey = (typeof DOCUMENT_TABS)[number]["key"];

export const tabId = (key: DocumentTabKey) => `tab-${key}`;
export const panelId = (key: DocumentTabKey) => `panel-${key}`;

type DocumentTabsProps = {
  active: DocumentTabKey;
  onChange: (key: DocumentTabKey) => void;
};

/**
 * Etapa 11: as três abas de antes (`?aba=`), agora com 44px de altura (eram
 * 38px — pendência da harmonização) e as três sempre à vista: dividem a
 * largura em proporção ao rótulo, sem rolagem lateral, de 320px ao desktop.
 *
 * A aba ativa se diferencia por texto (peso), cor e o fio laranja embaixo — e
 * por `aria-selected`. Teclado no padrão de abas do WAI-ARIA: só a ativa entra
 * no Tab; setas esquerda/direita (circulares), Home e End trocam de aba e
 * levam o foco junto.
 */
export function DocumentTabs({ active, onChange }: DocumentTabsProps) {
  const refs = useRef<Partial<Record<DocumentTabKey, HTMLButtonElement | null>>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = DOCUMENT_TABS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last ? 0 : index + 1
        : event.key === "ArrowLeft"
          ? index === 0 ? last : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next == null) return;
    event.preventDefault();
    const key = DOCUMENT_TABS[next].key;
    onChange(key);
    refs.current[key]?.focus();
  }

  return (
    <div role="tablist" aria-label="Seções de documentos" className="flex border-b border-border">
      {DOCUMENT_TABS.map((tab, index) => {
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            ref={(element) => {
              refs.current[tab.key] = element;
            }}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-selected={selected}
            aria-controls={panelId(tab.key)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              // `-mb-px`: o fio da aba ativa cobre o fio do contêiner, em vez de somar 1px embaixo.
              "-mb-px flex min-h-control flex-auto items-center justify-center rounded-t-md border-b-2 px-1 text-sm whitespace-nowrap transition-colors duration-(--duration-fast) sm:flex-none sm:px-4",
              selected
                ? "border-accent font-semibold text-text-primary"
                : "border-transparent font-medium text-text-secondary hover:bg-state-hover hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
