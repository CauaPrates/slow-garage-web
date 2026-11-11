import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { RowActionsMenu } from "@/components/ui/menu";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NoteLike } from "./useNotes";
import { dayParts, titleRepeatsType, viewLinkContext, type TimelineEntry } from "./timelinePresentation";

/**
 * Colunas a partir de `md`: data · registro · valor · ação. O cabeçalho da
 * lista usa o mesmo molde. A partir de `2xl` dividem a largura em proporção,
 * como Modificações (com as fixas, o valor ficava longe do registro).
 */
export const TIMELINE_ROW_GRID =
  "md:grid-cols-[6rem_minmax(0,1fr)_8.5rem_2.75rem] md:gap-x-4 2xl:grid-cols-[7rem_minmax(0,3fr)_minmax(0,1fr)_2.75rem] 2xl:gap-x-6";

/** Texto curto cabe inteiro em duas linhas; acima disso (ou com quebra de linha) ganha "Ver … inteiro". */
const LONG_TEXT_CHARS = 140;

type TimelineEntryRowProps = {
  entry: TimelineEntry;
  /**
   * Mesmo dia da linha anterior (na lista por data): a coluna de data do
   * desktop fica vazia, como num diário. A data continua na linha para o
   * leitor de tela e no celular.
   */
  sameDayAsPrevious?: boolean;
  onEditNote: (note: NoteLike, trigger: HTMLElement | null) => void;
  onDeleteNote: (note: NoteLike, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 13: um registro do diário do veículo. Hierarquia: quando (data) e o
 * que é (ícone + tipo escrito), o título, o valor e a quilometragem quando
 * existem, e o texto do registro.
 *
 * Celular: a primeira linha é tipo · data, com a ação no canto; título,
 * números e texto ocupam a largura toda — não há coluna de ações apertando o
 * texto. Desktop: data, registro, valor e ação em colunas fixas.
 *
 * Ação por origem: evento de outra tela tem "Ver" (link, só quando há
 * destino); nota tem o "⋯" com editar e excluir (é a única origem que o
 * Histórico edita); tipo desconhecido não tem ação, como antes. A ação tem
 * 44×44: sobe sobre o respiro da linha e cabe inteira na primeira linha, sem
 * nenhum outro elemento por cima dela.
 *
 * Nada é cortado sem caminho de volta: o título quebra; o texto passa de duas
 * linhas só com "Ver nota inteira"/"Ver texto inteiro" (`aria-expanded`).
 */
export function TimelineEntryRow({ entry, sameDayAsPrevious = false, onEditNote, onDeleteNote }: TimelineEntryRowProps) {
  const identityId = useId();
  const textId = useId();
  const [textOpen, setTextOpen] = useState(false);

  const Icon = entry.icon;
  const date = entry.date ? formatDateOnly(entry.date) : null;
  const showTypeLabel = !titleRepeatsType(entry);
  const text = entry.description;
  const longText = !!text && (text.length > LONG_TEXT_CHARS || text.includes("\n"));
  const note = entry.note;
  const km = entry.odometerKm != null ? formatKm(entry.odometerKm) : null;
  const parts = entry.date ? dayParts(entry.date) : null;

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-(--panel-pad-x) py-3",
        TIMELINE_ROW_GRID,
      )}
    >
      {/* Qual registro o "⋯" ou o "Ver nota inteira" afeta. */}
      <span id={identityId} className="sr-only">
        {entry.typeLabel}: {entry.title ?? "sem título"}
        {date ? `, ${date}` : ""}
      </span>

      {/*
        Tipo e data. No desktop a data tem coluna própria e aqui fica só para o leitor de tela.
        `pb-3` (celular): a primeira linha tem os 32px que a ação ocupa dentro da linha — o alvo de 44px nunca fica
        por baixo do título (na primeira medição, o título cobria 6px do "Ver" e roubava o toque). No desktop a ação
        tem coluna própria e desce sobre uma célula vazia.
      */}
      <p className="type-caption flex min-h-5 min-w-0 flex-wrap items-center gap-x-1.5 pb-3 text-text-secondary md:col-start-2 md:row-start-1 md:pb-0">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {showTypeLabel && <span className="font-medium text-text-primary">{entry.typeLabel}</span>}
        {date && (
          <span className="tabular-nums md:sr-only">
            {showTypeLabel && <span aria-hidden="true">· </span>}
            <time dateTime={entry.date ?? undefined}>{date}</time>
          </span>
        )}
      </p>

      {/* A área de 44px sobe 12px sobre o respiro da linha (o mesmo `py-3`) e termina onde a linha do tipo termina. */}
      <div className="-mt-3 -mr-1 flex justify-end md:col-start-4 md:row-start-1 md:mr-0">
        {note ? (
          <RowActionsMenu
            label="Ações da nota"
            editLabel="Editar nota"
            deleteLabel="Excluir nota"
            describedBy={identityId}
            onEdit={(trigger) => onEditNote(note, trigger)}
            onDelete={(trigger) => onDeleteNote(note, trigger)}
          />
        ) : (
          entry.href && (
            <Link to={entry.href} className={cn(textLinkClassName("xs"), "min-w-11 justify-center")}>
              Ver<span className="sr-only"> {viewLinkContext(entry)}</span>
            </Link>
          )
        )}
      </div>

      {/* Celular: cada bloco numa linha da grade, na largura toda. Desktop: uma coluna só (registro). */}
      <div className="contents md:col-start-2 md:row-start-2 md:flex md:min-w-0 md:flex-col md:gap-1">
        <p
          className={cn(
            "type-item-title col-span-2",
            entry.title ? "text-text-primary" : "font-normal text-text-secondary",
          )}
        >
          {entry.title ?? "Sem título"}
        </p>

        {(entry.amount != null || km) && (
          <p
            className={cn(
              "col-span-2 flex flex-wrap items-baseline gap-x-1.5 text-xs text-text-secondary tabular-nums",
              !km && "md:hidden",
            )}
          >
            {entry.amount != null && (
              <span className="type-figure text-sm text-text-primary md:hidden">{formatMoney(entry.amount)}</span>
            )}
            {entry.amount != null && km && (
              <span aria-hidden="true" className="md:hidden">
                ·
              </span>
            )}
            {km && <span>{km}</span>}
          </p>
        )}

        {text && (
          <div className="col-span-2 flex min-w-0 flex-col items-start">
            <p
              id={textId}
              className={cn(
                "max-w-prose text-sm break-words whitespace-pre-wrap text-text-secondary",
                longText && !textOpen && "line-clamp-2",
              )}
            >
              <span className="sr-only">{note ? "Anotação: " : "Descrição: "}</span>
              {text}
            </p>
            {longText && (
              <button
                type="button"
                aria-expanded={textOpen}
                aria-controls={textId}
                aria-describedby={identityId}
                onClick={() => setTextOpen((open) => !open)}
                className={cn(textLinkClassName("xs"), "-my-1.5 -ml-1")}
              >
                {textOpen ? (note ? "Recolher nota" : "Recolher texto") : note ? "Ver nota inteira" : "Ver texto inteiro"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Valor em coluna a partir de `md`, na linha do título (no celular ele abre a linha dos números). */}
      {entry.amount != null && (
        <p className="type-value hidden text-right text-text-primary md:col-start-3 md:row-start-2 md:block">
          {formatMoney(entry.amount)}
        </p>
      )}

      {/* Coluna de data do desktop (visual; o leitor de tela lê a data na linha do tipo). */}
      <div aria-hidden="true" className="hidden flex-col md:col-start-1 md:row-span-2 md:row-start-1 md:flex">
        {parts && !sameDayAsPrevious && (
          <>
            <span className="type-figure text-sm leading-6 text-text-primary">{parts.day}</span>
            <span className="type-caption text-text-secondary">{parts.weekday}</span>
          </>
        )}
      </div>
    </li>
  );
}
