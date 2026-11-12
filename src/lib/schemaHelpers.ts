import { z } from "zod";

/**
 * Helpers de validação zod compartilhados por qualquer formulário que
 * espelhe constraint numérica do banco (not null / check >= 0) sobre um
 * `<input>` nativo, cujo valor sempre chega como string.
 *
 * `invalidMessage` (opcional) troca só o texto do valor inválido — o padrão
 * `${label} inválido.` sai sem concordância ("a quilometragem inválido.").
 * Etapa 06: os formulários que passam o texto próprio corrigem a frase sem
 * mexer na regra; os demais continuam com o padrão.
 */

export const requiredNonNegativeInt = (label: string, invalidMessage = `${label} inválido.`) =>
  z
    .string()
    .min(1, `Informe ${label}.`)
    .transform((val) => Number(val))
    .refine((val) => Number.isInteger(val) && val >= 0, invalidMessage);

export const requiredNonNegativeNumber = (label: string, invalidMessage = `${label} inválido.`) =>
  z
    .string()
    .min(1, `Informe ${label}.`)
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val >= 0, invalidMessage);

export const optionalNonNegativeNumber = (label: string, invalidMessage = `${label} inválido.`) =>
  z
    .string()
    .optional()
    .transform((val) => (val === undefined || val.trim() === "" ? undefined : Number(val)))
    .refine(
      (val) => val === undefined || (!Number.isNaN(val) && val >= 0),
      invalidMessage,
    );

export const optionalNonNegativeInt = (label: string, invalidMessage = `${label} inválido.`) =>
  z
    .string()
    .optional()
    .transform((val) => (val === undefined || val.trim() === "" ? undefined : Number(val)))
    .refine(
      (val) => val === undefined || (Number.isInteger(val) && val >= 0),
      invalidMessage,
    );

export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === undefined || val === "" ? undefined : val));

/**
 * `<select>` nativo com uma opção "Não informado"/"Selecione" de valor
 * `""` manda string vazia, nunca `undefined` — `z.enum(values).optional()`
 * sozinho rejeita `""` (não é `undefined` nem um membro do enum), o que
 * reprova a validação sem nenhum `FieldError` visível pra explicar por
 * quê. Este helper trata `""` como "nada selecionado" antes de validar.
 */
export const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === "" ? undefined : val))
    .pipe(z.enum(values).optional());
