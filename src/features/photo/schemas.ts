import { z } from "zod";
import { optionalEnum, optionalText } from "@/lib/schemaHelpers";

export const VEHICLE_PHOTO_CATEGORIES = [
  "exterior",
  "interior",
  "engine",
  "wheels",
  "mods",
  "before_after",
  "other",
] as const;

export const VEHICLE_PHOTO_CATEGORY_LABELS: Record<
  (typeof VEHICLE_PHOTO_CATEGORIES)[number],
  string
> = {
  exterior: "Exterior",
  interior: "Interior",
  engine: "Motor",
  wheels: "Rodas",
  mods: "Modificações",
  before_after: "Antes/depois",
  other: "Outro",
};

export const photoUploadSchema = z.object({
  category: optionalEnum(VEHICLE_PHOTO_CATEGORIES),
  caption: optionalText,
});

export type PhotoUploadFormInput = z.input<typeof photoUploadSchema>;
export type PhotoUploadFormOutput = z.output<typeof photoUploadSchema>;
