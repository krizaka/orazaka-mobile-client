/**
 * @file markdown.ts
 * @description A small Markdown reader for what a model answers: headings, paragraphs, lists, quotes, code, rules and
 * the inline marks (bold, italic, code, links). It returns plain data, so a screen can draw it natively — React Native
 * has no HTML to hand it to, and a literal `**Nom :**` on a phone is the bug this exists to remove.
 *
 * Not a CommonMark engine: tables and HTML are left as text on purpose; the answer stays readable, never wrong.
 */

export type Inline =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "bold" | "italic" | "code"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

export type Block =
  | { readonly kind: "heading"; readonly level: 1 | 2 | 3; readonly inline: readonly Inline[] }
  | { readonly kind: "paragraph"; readonly inline: readonly Inline[] }
  | { readonly kind: "list"; readonly ordered: boolean; readonly items: readonly (readonly Inline[])[] }
  | { readonly kind: "quote"; readonly inline: readonly Inline[] }
  | { readonly kind: "code"; readonly text: string }
  | { readonly kind: "rule" };

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

/** Reads the inline marks of one line of text. */
export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const token = match[0];
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: "text", text: source.slice(last, at) });
    if (token.startsWith("**") || token.startsWith("__")) {
      out.push({ kind: "bold", text: token.slice(2, -2) });
    } else if (token.startsWith("`")) {
      out.push({ kind: "code", text: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      out.push({ kind: "link", text: token.slice(1, close), href: token.slice(close + 2, -1) });
    } else {
      out.push({ kind: "italic", text: token.slice(1, -1) });
    }
    last = at + token.length;
  }
  if (last < source.length) out.push({ kind: "text", text: source.slice(last) });
  return out;
}

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*$/;

/** Reads a whole answer into blocks. A streamed, half-written answer is fine: an open fence is code to the end. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", inline: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (line.trim().startsWith("```")) {
      flush();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        code.push(lines[i] ?? "");
        i += 1;
      }
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      const level = Math.min(heading[1]?.length ?? 1, 3) as 1 | 2 | 3;
      blocks.push({ kind: "heading", level, inline: parseInline(heading[2] ?? "") });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      blocks.push({ kind: "quote", inline: parseInline(line.replace(/^>\s?/, "")) });
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flush();
      const ordered = numbered !== null;
      const previous = blocks[blocks.length - 1];
      const entry = parseInline(item[1] ?? "");
      if (previous?.kind === "list" && previous.ordered === ordered) {
        blocks[blocks.length - 1] = { ...previous, items: [...previous.items, entry] };
      } else {
        blocks.push({ kind: "list", ordered, items: [entry] });
      }
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}
