// Pure Revolut pay-link + pay-concept builders (no React).
// Money stays in integer cents; only the link path uses decimal euros.

import { formatEUR } from "./money";

/** Revolut handles: 3-32 chars, letters, digits, dot, underscore, hyphen. */
const TAG_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

/** ISO 4217-style currency code: exactly 3 ASCII uppercase letters. */
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * Normalize a user-entered tag: trim whitespace and strip ONE leading '@'.
 * Case is preserved; everything else is returned as-is.
 */
export function normalizeTag(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) return trimmed.slice(1);
  return trimmed;
}

/** True when the NORMALIZED tag matches the Revolut handle pattern. */
export function isValidTag(tag: string): boolean {
  if (typeof tag !== "string") return false;
  return TAG_PATTERN.test(normalizeTag(tag));
}

/**
 * Format integer cents > 0 as a Revolut path amount: euros with a dot
 * decimal, no thousands separators, minimal representation ('20', '20.50',
 * '0.05'). Throws RangeError on non-integer or <= 0 input.
 */
export function linkAmount(cents: number): string {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new RangeError("linkAmount requires integer cents > 0");
  }
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2);
}

/**
 * Build an https://revolut.me pay link, or null when anything is invalid
 * (tag, amount, or currency). Currency is uppercased before validation.
 */
export function buildRevolutLink(
  tag: string,
  amountCents: number,
  currency: string,
): string | null {
  if (typeof tag !== "string" || typeof currency !== "string") return null;
  const normalized = normalizeTag(tag);
  if (!isValidTag(normalized)) return null;
  const upperCurrency = currency.toUpperCase();
  if (!CURRENCY_PATTERN.test(upperCurrency)) return null;
  let amount: string;
  try {
    amount = linkAmount(amountCents);
  } catch {
    return null;
  }
  return `https://revolut.me/${normalized}/${amount}${upperCurrency}`;
}

/**
 * Normalize a user-entered phone: trim, then remove spaces, dots,
 * dashes, and parens. A leading '+' is preserved; any other '+'
 * (e.g. pasted twice) is dropped.
 */
export function normalizePhone(raw: string): string {
  if (typeof raw !== "string") return "";
  const stripped = raw.trim().replace(/[\s.\-()]/g, "");
  if (stripped.startsWith("+")) return "+" + stripped.slice(1).replace(/\+/g, "");
  return stripped.replace(/\+/g, "");
}

/** True when the NORMALIZED phone matches /^\+?[0-9]{9,15}$/. */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== "string") return false;
  return /^\+?[0-9]{9,15}$/.test(normalizePhone(phone));
}

/**
 * Build the clipboard concept pasted into any bank app.
 * Without a valid phone: `SplitMate · {grupo} · {de} → {a} {importe}`.
 * With a valid phone: `SplitMate · {grupo} · Bizum al {numero} · {de} → {a} {importe}`.
 * Bizum is clipboard-bridge only: never invent a bizum:// URL.
 */
export function buildPayConcept(
  groupName: string,
  fromName: string,
  toName: string,
  amountCents: number,
  phone?: string | null,
): string {
  if (typeof phone === "string" && phone !== "") {
    const normalized = normalizePhone(phone);
    if (isValidPhone(normalized)) {
      return `SplitMate · ${groupName} · Bizum al ${normalized} · ${fromName} → ${toName} ${formatEUR(amountCents)}`;
    }
  }
  return `SplitMate · ${groupName} · ${fromName} → ${toName} ${formatEUR(amountCents)}`;
}
