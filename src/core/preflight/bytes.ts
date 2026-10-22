const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const INDEX: Readonly<Record<string, number>> = Object.fromEntries(Array.from(ALPHABET, (c, i) => [c, i]));

/** Base64 (padded or not, line breaks ignored) to bytes. No `atob`, no `Buffer`: the phone's runtime has neither for sure. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let bits = 0;
  let acc = 0;
  let at = 0;
  for (const char of clean) {
    acc = (acc << 6) | (INDEX[char] ?? 0);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at++] = (acc >> bits) & 0xff;
    }
  }
  return out.subarray(0, at);
}

/** Bytes as a latin1 string, in chunks: the PDF's own tokens are ASCII, and `String.fromCharCode(...big)` overflows the stack. */
export function bytesToLatin1(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let text = "";
  for (let at = 0; at < bytes.length; at += CHUNK) {
    text += String.fromCharCode(...bytes.subarray(at, at + CHUNK));
  }
  return text;
}
