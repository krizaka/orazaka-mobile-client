import { base64ToBytes, bytesToLatin1 } from "../preflight/bytes";
import { createInspector, documentRules, maxPdfBytesFor, reasonKey } from "../preflight";

const enc = (text: string): Uint8Array => Uint8Array.from(Array.from(text, (c) => c.charCodeAt(0) & 0xff));

/** The smallest well-formed-looking PDF: header, a body, the xref pointer and the end marker. */
const pdf = (body = "1 0 obj << /Type /Catalog >> endobj"): Uint8Array => enc(`%PDF-1.7\n${body}\nstartxref\n9\n%%EOF\n`);
const rules = documentRules({ maxBytes: 1000 });
const inspect = (bytes: Uint8Array, name = "lease.pdf", type = "application/pdf") => createInspector(rules).inspect(bytes, { name, type });

describe("the document pre-flight (the rules of Yomizaka's, on the phone: nothing reaches the engine that cannot be a document)", () => {
  it("accepts a PDF that is what it says", async () => {
    expect(await inspect(pdf())).toEqual({ kind: "accepted", fileKind: "pdf" });
  });

  it.each([
    ["an empty file", new Uint8Array(), "EMPTY"],
    ["a file over the limit", pdf("x".repeat(2000)), "TOO_LARGE"],
    ["a program renamed .pdf", enc("MZ\x90\x00 this is not a document"), "EXECUTABLE"],
    ["a script renamed .pdf", enc("#!/bin/sh\nrm -rf /"), "EXECUTABLE"],
    ["a PNG named .pdf", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]), "TYPE_MISMATCH"],
    ["a text file named .pdf", enc("just some words, not a PDF"), "TYPE_MISMATCH"],
  ] as const)("refuses %s: %s", async (_label, bytes, reason) => {
    const result = await inspect(bytes);
    expect(result).toMatchObject({ kind: "rejected", reason });
  });

  it("refuses a PDF cut short: no startxref / %%EOF at the end", async () => {
    expect(await inspect(enc("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n"))).toMatchObject({ reason: "TRUNCATED" });
  });

  it("refuses an encrypted PDF", async () => {
    expect(await inspect(pdf("trailer << /Encrypt 5 0 R >>"))).toMatchObject({ reason: "ENCRYPTED" });
  });

  it.each([["JavaScript"], ["Launch"], ["OpenAction"], ["EmbeddedFile"]])("refuses active content: /%s", async (name) => {
    expect(await inspect(pdf(`<< /${name} 4 0 R >>`))).toMatchObject({ reason: "ACTIVE_CONTENT" });
  });

  it("sees through an obfuscated name: /J#61vaScript is still JavaScript", async () => {
    expect(await inspect(pdf("<< /J#61vaScript 4 0 R >>"))).toMatchObject({ reason: "ACTIVE_CONTENT" });
  });

  it("an image is recognised, so the refusal can say what it is, but is not accepted as a document", async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    expect(await inspect(jpeg, "scan.jpg", "image/jpeg")).toMatchObject({ kind: "rejected", reason: "UNSUPPORTED_TYPE", detail: "jpeg" });
  });

  it("every refusal has a message in the app's words, so a person is never shown a code", () => {
    for (const reason of ["EMPTY", "TOO_LARGE", "UNSUPPORTED_TYPE", "TYPE_MISMATCH", "EXECUTABLE", "CORRUPT", "TRUNCATED", "ENCRYPTED", "ACTIVE_CONTENT"] as const) {
      expect(reasonKey(reason)).toMatch(/^studios\.document\.refused\./);
    }
  });
});

describe("what a Studio's text field can hold", () => {
  it("a base64 field of N characters holds at most N*3/4 bytes of file", () => {
    expect(maxPdfBytesFor(1_400_000)).toBe(1_050_000);
    expect(maxPdfBytesFor(undefined)).toBe(10 * 1024 * 1024);
  });
});

describe("bytes", () => {
  it("decodes base64, padded or not, with line breaks", () => {
    expect(Array.from(base64ToBytes("JVBERi0="))).toEqual([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(Array.from(base64ToBytes("JVBE\nRi0"))).toEqual([0x25, 0x50, 0x44, 0x46, 0x2d]);
  });

  it("reads bytes as latin1 whatever their size, without a stack overflow", () => {
    const big = new Uint8Array(500_000).fill(0x41);
    expect(bytesToLatin1(big).length).toBe(500_000);
  });
});
