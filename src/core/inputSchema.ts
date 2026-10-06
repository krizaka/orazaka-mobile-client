/** One field of a Studio's input schema, reduced to what a form needs. */
export interface SchemaField {
  readonly key: string;
  readonly title: string;
  readonly required: boolean;
  /** A `string[]` field is entered as one value per line. */
  readonly isList: boolean;
  readonly maxLength?: number;
}

interface RawProperty {
  readonly type?: string;
  readonly title?: string;
  readonly maxLength?: number;
  readonly items?: { readonly type?: string };
}

interface RawSchema {
  readonly required?: readonly string[];
  readonly properties?: Record<string, RawProperty>;
}

/**
 * Reduces a Studio's JSON-Schema to a flat field list.
 *
 * Only the subset the seeded blueprints actually use — strings and string arrays — because a
 * general JSON-Schema form renderer is a project, and a partial one that silently drops a field
 * type would produce runs missing an input the actor was never asked for. An unknown type is
 * therefore treated as a string rather than skipped: the actor can still answer it, and the
 * service validates the result either way.
 *
 * @param raw the `inputSchema` string from the Studio detail, possibly null
 * @returns the fields to render, required ones first
 */
export function parseInputSchema(raw: string | null | undefined): SchemaField[] {
  if (raw === null || raw === undefined || raw === "") {
    return [];
  }
  let schema: RawSchema;
  try {
    schema = JSON.parse(raw) as RawSchema;
  } catch {
    return [];
  }

  const required = new Set(schema.required ?? []);
  const fields = Object.entries(schema.properties ?? {}).map(([key, property]) => ({
    key,
    title: property.title ?? key,
    required: required.has(key),
    isList: property.type === "array",
    maxLength: property.maxLength,
  }));

  // Required first: on a phone the fields below the fold are the ones that get missed.
  return fields.sort((left, right) => Number(right.required) - Number(left.required));
}

/**
 * Turns the typed answers into the `inputs` map the run endpoint expects.
 *
 * @param fields the schema fields
 * @param answers what the actor typed, keyed by field
 * @returns the inputs payload, list fields split on newlines with blank lines dropped
 */
export function toInputs(
  fields: readonly SchemaField[],
  answers: Readonly<Record<string, string>>,
): Record<string, string | string[]> {
  const inputs: Record<string, string | string[]> = {};
  for (const field of fields) {
    const answer = (answers[field.key] ?? "").trim();
    if (answer === "") {
      continue;
    }
    inputs[field.key] = field.isList
      ? answer
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "")
      : answer;
  }
  return inputs;
}

/**
 * Whether every required field has an answer.
 *
 * Checked before submitting so the actor is told what is missing by the form, not by a 400 that
 * arrives after the run has been refused.
 *
 * @param fields the schema fields
 * @param answers what the actor typed
 * @returns true when the run can be submitted
 */
export function isComplete(
  fields: readonly SchemaField[],
  answers: Readonly<Record<string, string>>,
): boolean {
  return fields
    .filter((field) => field.required)
    .every((field) => (answers[field.key] ?? "").trim() !== "");
}
