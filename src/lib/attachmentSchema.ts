import { z } from "zod";

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Compartilhado por todo campo de anexo (Gasto, Problema, Item de projeto, Execução de manutenção). */
export const fileAttachmentSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_ATTACHMENT_TYPES.includes(file.type), {
    message: "Envie uma imagem (JPEG, PNG, WebP) ou um PDF.",
  })
  .refine((file) => file.size <= MAX_ATTACHMENT_SIZE_BYTES, {
    message: "O arquivo precisa ter até 10MB.",
  });

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Galeria de fotos do veículo — só imagem, nunca PDF (mesma regra do upload de foto de capa desde a Fase 2). */
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: "Envie uma imagem (JPEG, PNG ou WebP).",
  })
  .refine((file) => file.size <= MAX_ATTACHMENT_SIZE_BYTES, {
    message: "O arquivo precisa ter até 10MB.",
  });
