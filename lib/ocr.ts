// Ticket OCR helpers for SplitMate.
//
// Pure deterministic parsing (parseTicketText) plus a thin async wrapper
// around tesseract.js (recognizeTicket). The OCR engine is loaded with a
// dynamic import so it never lands in the initial page bundle, and it only
// ever runs in the browser (client components call recognizeTicket).

export interface ParsedTicket {
  merchant: string | null;
  totalCents: number | null;
}

export interface RecognizedTicket {
  text: string;
  confidence: number;
}

// Lines that look like a grand total (Spanish receipts): "TOTAL", "IMPORTE",
// "A PAGAR" / "PAGAR", or an explicit euro marker.
const TOTAL_LINE_RE = /(total|importe|a pagar|pagar|€|eur)/i;

// European comma-decimal amounts, with optional thousand dots:
// "12,50", "1.234,56", "12.345.678,90". The leading (?:^|...) guard and the
// trailing lookahead keep the match from slicing inside a longer numeric run.
// Lookahead (not lookbehind) is used on purpose: it works in every browser.
const COMMA_AMOUNT_RE = /(?:^|[^\d.,])(\d+(?:\.\d{3})*,\d{2})(?![\d.,])/g;

// Dot-decimal fallback for tickets printed as "18.75". Applied only after
// comma amounts have been blanked out of the line, so "1.234,56" never
// yields a phantom "1.23".
const DOT_AMOUNT_RE = /(?:^|[^\d.,])(\d+\.\d{2})(?![\d.,])/g;

const BLANK = " ";

/** Strip non-letter/number chars from both edges ("**BAR**" -> "BAR"). */
function cleanEdge(value: string): string {
  return value.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
}

/** "1.234,56" -> 123456 cents; "18.75" -> 1875 cents. */
function amountToCents(raw: string, decimalComma: boolean): number {
  const normalized = decimalComma ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Math.round(Number(normalized) * 100);
}

/** All amounts on one line, in cents. Comma formats first, dot fallback second. */
function amountsInLineCents(line: string): number[] {
  const cents: number[] = [];
  const seen = new Set<string>();
  for (const match of line.matchAll(COMMA_AMOUNT_RE)) {
    const raw = match[1];
    if (seen.has(raw)) continue;
    seen.add(raw);
    const value = amountToCents(raw, true);
    if (Number.isFinite(value)) cents.push(value);
  }
  // Blank comma amounts out so the dot fallback cannot match inside them.
  const rest = line.replace(COMMA_AMOUNT_RE, (full) => BLANK.repeat(full.length));
  for (const match of rest.matchAll(DOT_AMOUNT_RE)) {
    const value = amountToCents(match[1], false);
    if (Number.isFinite(value)) cents.push(value);
  }
  return cents;
}

/**
 * Parse raw OCR text into a merchant name + total.
 *
 * Merchant: first non-empty line, edge-cleaned, capped at 60 chars.
 * Total: the largest amount on a total-like line; when no line looks like a
 * total, the largest amount anywhere; null when no amount is found.
 */
export function parseTicketText(text: string): ParsedTicket {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let merchant: string | null = null;
  for (const line of lines) {
    const cleaned = cleanEdge(line).slice(0, 60).trim();
    if (cleaned) {
      merchant = cleaned;
      break;
    }
  }

  let totalOnTotalLines: number | null = null;
  let totalAnywhere: number | null = null;
  for (const line of lines) {
    const amounts = amountsInLineCents(line);
    if (amounts.length === 0) continue;
    const lineMax = Math.max(...amounts);
    if (totalAnywhere === null || lineMax > totalAnywhere) totalAnywhere = lineMax;
    if (TOTAL_LINE_RE.test(line) && (totalOnTotalLines === null || lineMax > totalOnTotalLines)) {
      totalOnTotalLines = lineMax;
    }
  }

  return { merchant, totalCents: totalOnTotalLines ?? totalAnywhere };
}

/**
 * Run local OCR over a ticket photo. Loads tesseract.js on demand (Spanish +
 * English trained data) and always terminates the worker, even on failure.
 *
 * Progress (0..1) compresses model-loading phases into the first stretch and
 * reserves the rest for recognition. Throws a Spanish-safe technical Error.
 */
export async function recognizeTicket(
  image: Blob,
  onProgress?: (p: number) => void,
): Promise<RecognizedTicket> {
  try {
    // Dynamic import: tesseract.js (WASM + workers) stays out of the page bundle.
    const { createWorker } = await import("tesseract.js");
    const report = onProgress
      ? (progress: number, status: string) => {
          if (!Number.isFinite(progress)) return;
          const clamped = Math.min(1, Math.max(0, progress));
          // Model download / init phases share the first 15%; recognition owns the rest.
          onProgress(status === "recognizing text" ? 0.15 + clamped * 0.85 : clamped * 0.15);
        }
      : undefined;
    const worker = await createWorker(
      ["spa", "eng"],
      undefined,
      report ? { logger: (m) => report(m.progress, m.status) } : undefined,
    );
    try {
      const { data } = await worker.recognize(image);
      return {
        text: data?.text ?? "",
        confidence: typeof data?.confidence === "number" ? data.confidence : 0,
      };
    } finally {
      try {
        await worker.terminate();
      } catch {
        // Termination is best-effort; the recognition result still stands.
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error desconocido";
    throw new Error(`No se ha podido analizar el ticket (${detail}).`);
  }
}
