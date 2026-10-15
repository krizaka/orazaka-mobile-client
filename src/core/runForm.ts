import type { SchemaField } from "./inputSchema";

/** Fields a phone form keeps behind "More options": optional tuning that a person rarely needs and a raw model id. */
const ADVANCED = new Set(["seed", "model", "image", "negativePrompt"]);

/** True for an optional tuning field (seed, model, starting image, things to avoid). */
export function isAdvanced(field: SchemaField): boolean {
  return !field.required && ADVANCED.has(field.key);
}

/** Splits a Studio's fields into the ones always shown and the ones behind "More options". */
export function splitFields(fields: readonly SchemaField[]): { readonly basic: SchemaField[]; readonly advanced: SchemaField[] } {
  return { basic: fields.filter((f) => !isAdvanced(f)), advanced: fields.filter(isAdvanced) };
}

/** How far a run is, 0–100, from its steps — null while nothing is known (the progress bar then just moves). */
export function runPercent(steps: readonly { readonly status: string }[]): number | null {
  if (steps.length === 0) return null;
  const done = steps.filter((s) => s.status === "SUCCEEDED" || s.status === "SKIPPED").length;
  return Math.round((done / steps.length) * 100);
}
