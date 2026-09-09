import { useId, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComboboxOption } from "@/components/ui/combobox";

type ComboboxInputProps = {
  id: string;
  /** O texto do campo — é o valor do formulário, digitado ou escolhido. */
  value: string;
  /** Digitação livre. O que o usuário escreve vale, mesmo sem casar com a lista. */
  onTextChange: (text: string) => void;
  /** Escolha na lista — traz o item inteiro, pra quem chama guardar o id. */
  onSelect: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyMessage: string;
  disabled?: boolean;
  loading?: boolean;
  "aria-invalid"?: boolean;
};

/** Acima disso a lista vira parede; quem procura algo específico digita. */
const MAX_VISIBLE = 50;

/**
 * Combobox **editável**: o campo é um `<input>` de verdade que aceita
 * qualquer texto, e a lista é sugestão. Diferente do `Combobox` (botão +
 * lista), que obriga a escolher uma das opções.
 *
 * É o que o caso de marca/modelo pede: a FIPE cobre a maioria dos carros,
 * mas quem tem um que não está lá — importado, modificado, muito antigo —
 * precisa poder digitar e seguir. Escolher da lista dá o bônus de identificar
 * o veículo (id da FIPE gravado); digitar à mão funciona como sempre
 * funcionou.
 *
 * **Sem cmdk aqui, de propósito.** O `Command.Input` do cmdk gera o próprio
 * `id` (via `@radix-ui/react-id`) e descarta o que a gente passa — o que
 * deixa o `<label htmlFor>` apontando pra nada, quebrando associação de
 * rótulo. Como o teclado que este padrão precisa é curto (setas, Enter,
 * Escape), sai mais barato escrever do que contornar. O cmdk segue em uso no
 * `Combobox` de seleção fechada, onde o input é interno e o id não importa.
 *
 * Padrão ARIA 1.2 de combobox: `role="combobox"` + `aria-expanded` +
 * `aria-controls` + `aria-autocomplete="list"` no input, `aria-activedescendant`
 * apontando pra opção ativa, e a lista como `role="listbox"`.
 */
export function ComboboxInput({
  id,
  value,
  onTextChange,
  onSelect,
  options,
  placeholder,
  emptyMessage,
  disabled,
  loading,
  "aria-invalid": ariaInvalid,
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const optionIdPrefix = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const termo = value.trim().toLowerCase();
  const filtradas = termo
    ? options.filter((o) => o.label.toLowerCase().includes(termo))
    : options;
  const visiveis = filtradas.slice(0, MAX_VISIBLE);
  const temLista = options.length > 0;
  const escolhida = options.find((o) => o.label === value);
  const aberta = open && temLista;

  function mover(delta: number) {
    if (visiveis.length === 0) return;
    setActiveIndex((atual) => {
      const proximo = (atual + delta + visiveis.length) % visiveis.length;
      listRef.current
        ?.querySelector(`[data-index="${proximo}"]`)
        ?.scrollIntoView({ block: "nearest" });
      return proximo;
    });
  }

  function escolher(option: ComboboxOption) {
    onSelect(option);
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-expanded={aberta}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          aberta && visiveis[activeIndex]
            ? `${optionIdPrefix}-${activeIndex}`
            : undefined
        }
        onChange={(event) => {
          onTextChange(event.target.value);
          setActiveIndex(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) setOpen(true);
            else mover(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            mover(-1);
          } else if (event.key === "Enter" && aberta && visiveis[activeIndex]) {
            // Sem isto o Enter envia o formulário em vez de escolher a opção.
            event.preventDefault();
            escolher(visiveis[activeIndex]);
          } else if (event.key === "Escape") {
            // Escape só fecha a lista. Impedir que ele feche o diálogo em
            // volta é trabalho do `DialogContent`, que se guia pelo
            // `aria-expanded` daqui — o Radix escuta a tecla no document em
            // captura, antes de ela chegar neste handler.
            setOpen(false);
          }
        }}
        className="h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 pr-9 text-base text-text-primary outline-none transition-colors placeholder:text-text-secondary hover:border-text-secondary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/20 md:text-sm"
      />

      {loading ? (
        <Loader2
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-text-secondary"
        />
      ) : (
        temLista && (
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-secondary"
          />
        )
      )}

      {/*
        A caixa é só o contêiner visual. A `listbox` de verdade fica dentro e
        contém apenas `option` — mensagem de vazio e contador ficam de fora,
        porque `role="listbox"` não admite filho de outro tipo.
      */}
      <div
        hidden={!aberta}
        // Sem opção nenhuma não há o que clicar aqui, e a caixa fica por cima
        // do campo seguinte — deixar o clique atravessar evita engolir o toque
        // de quem só queria ir pro próximo campo.
        className={cn(
          "absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-border bg-surface p-1 shadow-lg",
          visiveis.length === 0 && "pointer-events-none",
        )}
      >
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          // Quem rola é a listbox, não a caixa: o contador de "mostrando N de
          // M" fica ancorado embaixo. E região que rola precisa ser focável —
          // `-1` basta, porque o teclado navega pelas setas a partir do input.
          tabIndex={-1}
          className="max-h-64 overflow-y-auto"
          // O `blur` do input dispara antes do `click` da opção; sem barrar o
          // mousedown, a lista some antes de a escolha chegar.
          onMouseDown={(event) => event.preventDefault()}
        >
          {visiveis.map((option, index) => (
            // O teclado deste padrão fica no input (setas + Enter, com
            // aria-activedescendant), não na opção — que por definição não é
            // focável. A regra não conhece o padrão.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div
              key={option.value}
              id={`${optionIdPrefix}-${index}`}
              data-index={index}
              role="option"
              // Opção de combobox não entra na ordem de tabulação: quem navega
              // por teclado fica no input e move a seleção pelas setas, com
              // `aria-activedescendant` dizendo qual está ativa.
              tabIndex={-1}
              aria-selected={escolhida?.value === option.value}
              onClick={() => escolher(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary transition-colors duration-150",
                index === activeIndex && "bg-bg",
              )}
            >
              <Check
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 shrink-0 text-accent",
                  escolhida?.value === option.value
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </div>
          ))}
        </div>

        {visiveis.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-text-secondary">
            {emptyMessage}
          </p>
        )}
        {filtradas.length > MAX_VISIBLE && (
          <p className="px-3 py-2 text-xs text-text-secondary">
            Mostrando {MAX_VISIBLE} de {filtradas.length}. Digite mais pra
            afinar.
          </p>
        )}
      </div>
    </div>
  );
}
