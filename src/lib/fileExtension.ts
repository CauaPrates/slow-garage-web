const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Compartilhado por todo upload que monta o path `{user_id}/{vehicle_id}/{uuid}.{ext}`. */
export function fileExtension(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  return fromName?.toLowerCase() ?? EXTENSION_BY_MIME_TYPE[file.type] ?? "bin";
}
