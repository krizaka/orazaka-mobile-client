import { bytesToLatin1 } from "./bytes";

/**
 * The document PRE-FLIGHT on the phone: before a PDF is sent to a Studio — a run that costs credits — decide, here and for
 * nothing, whether it can be a document: the real type by its first bytes (the name and the type the picker reported are only
 * compared), its size against what the Studio's field can hold, a PDF that is whole, not encrypted and carrying nothing active.
 *
 * It speaks the vocabulary of Yomizaka's `lib/preflight` (ADR-0005: kinds, reasons, rules as data, the same active names), but
 * it is the cheap subset that runs on a phone without a PDF library: it reads the bytes, not the object tree. The day that
 * module is a package (`@krizaka/preflight`, one for every Krizaka app) this folder is replaced by it — same port, same
 * reasons. Deterministic: nothing is executed, rendered or sent.
 */
export type FileKind = "pdf" | "text" | "png" | "jpeg" | "docx" | "zip" | "executable" | "unknown";

export type RejectReason = "EMPTY" | "TOO_LARGE" | "UNSUPPORTED_TYPE" | "TYPE_MISMATCH" | "EXECUTABLE" | "CORRUPT" | "TRUNCATED" | "ENCRYPTED" | "ACTIVE_CONTENT";

/** The rules, as DATA: what is allowed and how big. Another Studio, another policy is another object, never another code path. */
export interface PreflightRules {
  readonly maxBytes: number;
  readonly allowedKinds: readonly FileKind[];
  /** PDF names that mean active content: refused, never followed. */
  readonly pdfActiveNames: readonly string[];
}

export type Inspection =
  | { readonly kind: "accepted"; readonly fileKind: FileKind }
  | { readonly kind: "rejected"; readonly reason: RejectReason; readonly detail?: string };

export interface DocumentPreflight {
  /** `declared` is what the picker claimed (name, MIME type): only compared with what the bytes are. */
  inspect(bytes: Uint8Array, declared: { readonly name: string; readonly type: string }): Promise<Inspection>;
}

/** Yomizaka's limit when the Studio says none: a document is at most 10 MB. */
export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

/** The same names as Yomizaka's rules.ts. */
const ACTIVE_NAMES = ["JavaScript", "JS", "Launch", "EmbeddedFile", "EmbeddedFiles", "OpenAction", "AA", "RichMedia", "XFA", "ImportData", "SubmitForm"] as const;

/** The most file a text field of `maxLength` base64 characters can carry; the limit of the document when the field says none. */
export function maxPdfBytesFor(maxLength: number | undefined): number {
  return maxLength === undefined ? DEFAULT_MAX_BYTES : Math.floor((maxLength * 3) / 4);
}

/** The rules of a document check: PDF only, as large as the Studio's field can hold. */
export function documentRules(options: { readonly maxBytes?: number } = {}): PreflightRules {
  return { maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES, allowedKinds: ["pdf"], pdfActiveNames: ACTIVE_NAMES };
}

const startsWith = (bytes: Uint8Array, signature: readonly number[]): boolean => signature.every((b, i) => bytes[i] === b);

/** What the bytes are — not what the name or the picker said. */
export function sniff(bytes: Uint8Array): FileKind {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";
  if (startsWith(bytes, [0x4d, 0x5a]) || startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46]) || startsWith(bytes, [0x23, 0x21]) || startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe]) || startsWith(bytes, [0xca, 0xfe, 0xba, 0xbe])) return "executable";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return "zip";
  if (bytes.includes(0)) return "unknown";
  return "text";
}

const EXTENSIONS: Readonly<Record<string, FileKind>> = { pdf: "pdf", txt: "text", text: "text", md: "text", png: "png", jpg: "jpeg", jpeg: "jpeg", docx: "docx", zip: "zip" };
const MIME: Readonly<Record<string, FileKind>> = { "application/pdf": "pdf", "text/plain": "text", "image/png": "png", "image/jpeg": "jpeg", "application/zip": "zip" };

/** The kind the picker claims (extension first, then MIME type), or null when it claims nothing known. */
function claimed(declared: { readonly name: string; readonly type: string }): FileKind | null {
  const extension = /\.([a-z0-9]+)$/i.exec(declared.name)?.[1]?.toLowerCase();
  return (extension ? EXTENSIONS[extension] : undefined) ?? MIME[declared.type] ?? null;
}

/** `/Name` tokens of a PDF's raw bytes, `#xx` escapes decoded (an obfuscated /J#61vaScript is still JavaScript). */
function pdfNames(raw: string): Set<string> {
  const names = new Set<string>();
  for (const match of raw.matchAll(/\/([A-Za-z0-9_#.+-]{1,40})/g)) {
    names.add((match[1] ?? "").replace(/#([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))));
  }
  return names;
}

const reject = (reason: RejectReason, detail?: string): Inspection => ({ kind: "rejected", reason, ...(detail ? { detail } : {}) });

export function createInspector(rules: PreflightRules): DocumentPreflight {
  const active = new Set(rules.pdfActiveNames);
  return {
    async inspect(bytes, declared) {
      if (bytes.length === 0) return reject("EMPTY");
      if (bytes.length > rules.maxBytes) return reject("TOO_LARGE", String(bytes.length));
      const detected = sniff(bytes);
      if (detected === "executable") return reject("EXECUTABLE");
      const said = claimed(declared);
      if (said && said !== detected && !(said === "text" && detected === "unknown")) return reject("TYPE_MISMATCH", `${said} ≠ ${detected}`);
      if (!rules.allowedKinds.includes(detected)) return reject("UNSUPPORTED_TYPE", detected);
      if (detected !== "pdf") return reject("UNSUPPORTED_TYPE", detected);

      const raw = bytesToLatin1(bytes);
      const tail = raw.slice(-2048);
      if (!/startxref/.test(tail) || !/%%EOF/.test(tail)) return reject("TRUNCATED");
      const names = pdfNames(raw);
      if (names.has("Encrypt")) return reject("ENCRYPTED");
      const found = [...names].filter((name) => active.has(name));
      if (found.length > 0) return reject("ACTIVE_CONTENT", found.sort().join(", "));
      return { kind: "accepted", fileKind: "pdf" };
    },
  };
}

/** The message key of a refusal, in the app's catalogue (`studios.document.refused.*`). */
export function reasonKey(reason: RejectReason): `studios.document.refused.${RejectReason}` {
  return `studios.document.refused.${reason}`;
}
