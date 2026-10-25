import katex from "katex";
import { Fragment, type ReactNode } from "react";
import type { InlineMark } from "@/lib/quiz/types";

/**
 * Render API rich text.
 *
 * `marks` carry Unicode-scalar offsets, so the text is split by code point
 * (`Array.from`) rather than by JS string index. Marks the app does not know
 * are ignored.
 *
 * Image marks are zero-length anchors with a `position`; the API's own wording
 * is "where the figure renders relative to the stem", so they become block
 * figures before (`above`) or after (`below`) the text rather than glyphs
 * inside it.
 *
 * Math is the API's `\( … \)` convention (the bank writes every formula that
 * way), plus `\[ … \]` and `$$ … $$` for display math. A lone `$` is left
 * alone, since a question may legitimately quote a price.
 */
const KINDS = [
  "underline",
  "bold",
  "italic",
  "strike",
  "subscript",
  "superscript",
] as const;

type Kind = (typeof KINDS)[number];

function isKind(kind: string): kind is Kind {
  return (KINDS as readonly string[]).includes(kind);
}

function run(text: string, kinds: Kind[], key: number): ReactNode {
  let node: ReactNode = text;
  for (const kind of kinds) {
    switch (kind) {
      case "underline":
        node = <u>{node}</u>;
        break;
      case "bold":
        node = <strong>{node}</strong>;
        break;
      case "italic":
        node = <em>{node}</em>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "subscript":
        node = <sub>{node}</sub>;
        break;
      case "superscript":
        node = <sup>{node}</sup>;
        break;
    }
  }
  return <Fragment key={key}>{node}</Fragment>;
}

function segments(text: string, marks: InlineMark[]) {
  const chars = Array.from(text);
  const flags: Kind[][] = chars.map(() => []);

  for (const mark of marks) {
    if (!isKind(mark.kind)) continue;
    const start = Math.max(0, Math.min(mark.start, chars.length));
    const end = Math.max(start, Math.min(start + mark.len, chars.length));
    for (let i = start; i < end; i++) flags[i].push(mark.kind);
  }

  const out: { text: string; kinds: Kind[] }[] = [];
  for (let i = 0; i < chars.length; i++) {
    const last = out[out.length - 1];
    if (last && last.kinds.join() === flags[i].join()) {
      last.text += chars[i];
    } else {
      out.push({ text: chars[i], kinds: flags[i] });
    }
  }
  return out;
}

/* ------------------------------- math -------------------------------- */

type Token =
  | { type: "text"; start: number; end: number }
  | { type: "math"; start: number; end: number; tex: string; display: boolean };

/** Where the next `a` (optionally followed by `b`) sits, from `from`. */
function findClose(
  chars: string[],
  from: number,
  a: string,
  b?: string
): number {
  const last = b ? chars.length - 1 : chars.length;
  for (let i = from; i < last; i++) {
    if (chars[i] === a && (b === undefined || chars[i + 1] === b)) return i;
  }
  return -1;
}

/**
 * Split text into plain and math runs. Offsets stay in Unicode scalar values,
 * matching the API's inline marks.
 */
function tokenizeMath(chars: string[]): Token[] {
  const out: Token[] = [];
  let textStart = 0;
  let i = 0;

  while (i < chars.length) {
    let contentStart = -1;
    let close = -1;
    let closeLen = 0;
    let display = false;

    if (chars[i] === "\\" && chars[i + 1] === "(") {
      contentStart = i + 2;
      close = findClose(chars, contentStart, "\\", ")");
      closeLen = 2;
    } else if (chars[i] === "\\" && chars[i + 1] === "[") {
      contentStart = i + 2;
      close = findClose(chars, contentStart, "\\", "]");
      closeLen = 2;
      display = true;
    } else if (chars[i] === "$" && chars[i + 1] === "$") {
      contentStart = i + 2;
      close = findClose(chars, contentStart, "$", "$");
      closeLen = 2;
      display = true;
    }

    if (close !== -1) {
      if (i > textStart) out.push({ type: "text", start: textStart, end: i });
      out.push({
        type: "math",
        start: i,
        end: close + closeLen,
        tex: chars.slice(contentStart, close).join(""),
        display,
      });
      i = close + closeLen;
      textStart = i;
      continue;
    }

    i++;
  }

  if (textStart < chars.length) {
    out.push({ type: "text", start: textStart, end: chars.length });
  }
  return out;
}

/** Clip text marks to one run and rebase them to that run's start. */
function clipMarks(
  marks: InlineMark[],
  start: number,
  end: number
): InlineMark[] {
  const out: InlineMark[] = [];
  for (const mark of marks) {
    if (!isKind(mark.kind) || mark.len <= 0) continue;
    const from = Math.max(mark.start, start);
    const to = Math.min(mark.start + mark.len, end);
    if (to > from) {
      out.push({ ...mark, start: from - start, len: to - from });
    }
  }
  return out;
}

function MathSpan({ tex, display }: { tex: string; display: boolean }) {
  let html: string;
  try {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    // Never hide a formula behind an exception: show the source instead.
    return <>{display ? `\\[${tex}\\]` : `\\(${tex}\\)`}</>;
  }
  return (
    <span
      className={display ? "math-display" : "math-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function inlineBody(
  value: string,
  marks: InlineMark[],
  offset: number
): ReactNode {
  if (!marks.length) return value;
  const length = Array.from(value).length;
  const clipped = clipMarks(marks, offset, offset + length);
  if (!clipped.length) return value;
  return segments(value, clipped).map((part, i) =>
    part.kinds.length ? run(part.text, part.kinds, i) : part.text
  );
}

/* ------------------------------ figures ------------------------------- */

function getFigureUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function Figure({ mark }: { mark: InlineMark }) {
  if (!mark.url) return null;
  return (
    <figure className="question-figure">
      {/* Served through cached image proxy with 1-year immutable caching */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="question-image"
        src={getFigureUrl(mark.url)}
        alt={mark.alt ?? "Question figure"}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

export function RichText({
  text,
  marks,
}: {
  text: string;
  marks?: InlineMark[] | null;
}) {
  const allMarks = marks ?? [];
  const images = allMarks.filter(
    (m) => m.kind === "image" && typeof m.url === "string"
  );
  const above = images.filter((m) => m.position !== "below");
  const below = images.filter((m) => m.position === "below");

  const chars = Array.from(text);
  const tokens = tokenizeMath(chars);
  const body = tokens.map((token, i) =>
    token.type === "math" ? (
      <MathSpan key={`math-${i}`} tex={token.tex} display={token.display} />
    ) : (
      <Fragment key={`text-${i}`}>
        {inlineBody(
          chars.slice(token.start, token.end).join(""),
          allMarks,
          token.start
        )}
      </Fragment>
    )
  );

  if (!images.length) return <>{body}</>;

  return (
    <>
      {above.map((mark, i) => (
        <Figure key={`above-${i}`} mark={mark} />
      ))}
      {body}
      {below.map((mark, i) => (
        <Figure key={`below-${i}`} mark={mark} />
      ))}
    </>
  );
}
