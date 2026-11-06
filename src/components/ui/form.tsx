import { useId, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Estrutura de formulário compartilhada. Nasceu como `VehicleFormParts`
 * (redesign etapa 03) e foi adotada pelos formulários de Gastos,
 * Abastecimentos, Manutenção, Problemas e Projetos; na harmonização 01 saiu
 * de `features/vehicle` para cá, com o corpo e o rodapé que os oito
 * formulários repetiam. Nada aqui conhece schema nem `react-hook-form` — só
 * layout e as ligações de acessibilidade (rótulo, ajuda, erro).
 */

/**
 * Diálogo de cadastro/edição. Desktop: centrado (`max-w-2xl`; quem usa pode
 * estreitar). Celular: folha presa à base em largura cheia. Nos dois,
 * cabeçalho e rodapé ficam fixos e **só o corpo rola** — o diálogo em si não
 * rola, senão seriam duas regiões roláveis.
 */
export const FORM_DIALOG_CLASSNAME = cn(
  "flex max-h-[min(90dvh,58rem)] max-w-2xl flex-col overflow-hidden p-0 sm:w-[calc(100%-3rem)] sm:p-0",
  "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[calc(100dvh-2rem)] max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0",
);

/** `pr-14`/`sm:pr-16`: o título não corre por baixo do botão de fechar (44px). */
export const FORM_DIALOG_HEADER_CLASSNAME =
  "mb-0 shrink-0 border-b border-border px-5 pt-5 pb-4 pr-14 sm:px-6 sm:pt-6 sm:pr-16";

/**
 * `onOpenAutoFocus` dos diálogos de cadastro/edição: o foco vai pro próprio
 * diálogo (o leitor de tela lê título e descrição), não pro primeiro campo —
 * focar um combobox abria a lista e, no celular, o teclado virtual por cima
 * do formulário. Tab leva ao primeiro campo; o foco continua preso no diálogo.
 */
export function focusDialogOnOpen(event: Event) {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
}

/** Esconde as setinhas do `type="number"`: elas cobririam a unidade à direita. As setas do teclado continuam funcionando. */
export const NUMBER_INPUT_CLASSNAME =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** Corpo do formulário em diálogo: a única região que rola (`overscroll-contain` pra não arrastar a página). */
export function FormBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">{children}</div>;
}

type FormFooterProps = {
  /** Erro de envio, mostrado logo acima das ações — o preenchimento continua no formulário. */
  error?: string | null;
  submitting: boolean;
  submitLabel: string;
  submittingLabel?: string;
};

/**
 * Rodapé fixo do formulário: erro de envio, "Cancelar" e a ação principal.
 * Enviando, o botão fica desabilitado (sem segundo POST) e diz o que está
 * acontecendo. Respeita a área segura do iPhone na base.
 */
export function FormFooter({ error, submitting, submitLabel, submittingLabel = "Salvando…" }: FormFooterProps) {
  return (
    <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
      {error && (
        <div className="mb-3">
          <FieldError>{error}</FieldError>
        </div>
      )}
      <div className="flex gap-2 sm:justify-end sm:gap-3">
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={submitting} className="flex-1 sm:min-w-44 sm:flex-none">
          {submitting && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}

type FieldA11yProps = {
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = {
  /** O `id` do controle — também é a base dos ids de ajuda e erro (`{id}-hint`, `{id}-error`). */
  id: string;
  label: string;
  optional?: boolean;
  /** Unidade lida pelo leitor de tela junto do rótulo — na tela ela aparece dentro do campo. */
  unitLabel?: string;
  hint?: ReactNode;
  error?: string;
  /** Ids extras de descrição, ex.: o status da FIPE compartilhado por marca e modelo. */
  describedBy?: string;
  className?: string;
  children: (a11y: FieldA11yProps) => ReactNode;
};

/**
 * Rótulo visível, ajuda e erro ligados ao controle por `htmlFor` e
 * `aria-describedby`, com `aria-invalid` quando há erro: o erro é lido junto
 * do campo quando ele recebe foco, logo abaixo dele. Opcional é escrito no
 * rótulo; obrigatório é o padrão e não ganha marca própria.
 */
export function FormField({
  id,
  label,
  optional = false,
  unitLabel,
  hint,
  error,
  describedBy,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {unitLabel && <span className="sr-only"> ({unitLabel})</span>}
        {optional && <span className="font-normal text-text-secondary"> (opcional)</span>}
      </Label>
      {children({ "aria-invalid": Boolean(error), "aria-describedby": ariaDescribedBy })}
      {hint && (
        <p id={hintId} className="type-caption text-text-secondary">
          {hint}
        </p>
      )}
      <FieldError id={errorId} announce={false}>
        {error}
      </FieldError>
    </div>
  );
}

/**
 * Campo de filtro (categoria, período, ordem, busca): rótulo visível sobre o
 * controle, mesma altura de controle em toda a barra. Sem ajuda nem erro — o
 * filtro não valida.
 */
export function FilterField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

type UnitAffixProps = {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
};

/**
 * Unidade dentro do campo (R$ à esquerda; km, L, cc à direita). Só visual
 * (`aria-hidden`): o valor salvo continua o número puro, e o leitor de tela
 * recebe a unidade pelo rótulo (`unitLabel` do `FormField`). Quem usa soma o
 * recuo no input (`pl-10` / `pr-11`).
 */
export function UnitAffix({ prefix, suffix, children }: UnitAffixProps) {
  return (
    <div className="relative">
      {children}
      {prefix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-secondary"
        >
          {prefix}
        </span>
      )}
      {suffix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-secondary"
        >
          {suffix}
        </span>
      )}
    </div>
  );
}


type FormSectionProps = {
  title: string;
  children: ReactNode;
  /** Linha de apoio sob o título de uma seção fixa. */
  description?: ReactNode;
  className?: string;
} & (
  | { collapsible?: false }
  | {
      collapsible: true;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      /** Mostrado com a seção recolhida: o que já foi preenchido, ou o que ela guarda. */
      summary: string;
    }
);

/**
 * Seção do formulário: título + campos, separada da anterior só por um fio —
 * sem caixa dentro de caixa. A recolhível é o acordeão do projeto (Fase 15f):
 * `h3 > button` com `aria-expanded`/`aria-controls`, alvo de 56px, e o corpo
 * continua montado com `hidden` — recolher nunca desmonta campo nem perde o
 * que foi digitado.
 */
export function FormSection(props: FormSectionProps) {
  const titleId = useId();
  const panelId = useId();
  const { title, children, description, className } = props;

  if (!props.collapsible) {
    return (
      <section aria-labelledby={titleId} className={cn("flex flex-col gap-4 py-5", className)}>
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="type-section-title text-text-primary">
            {title}
          </h3>
          {description && <p className="text-sm text-text-secondary">{description}</p>}
        </div>
        {children}
      </section>
    );
  }

  const { open, onOpenChange, summary } = props;
  return (
    <section aria-labelledby={titleId} className={cn("flex flex-col border-t border-border", className)}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className="-mx-2 flex min-h-control-touch w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-section-title text-text-primary">
              <span id={titleId}>{title}</span>
              <span className="font-normal text-text-secondary"> · opcional</span>
            </span>
            {!open && <span className="type-caption truncate text-text-secondary">{summary}</span>}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-(--duration-base)",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="flex flex-col gap-4 pt-2 pb-5">
        {children}
      </div>
    </section>
  );
}
