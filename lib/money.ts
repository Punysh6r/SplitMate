// Money helpers for SplitMate MVP. All amounts are integer cents.

/** Convert an euro amount to integer cents (rounds to the nearest cent). */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/** Convert integer cents back to euros. */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

/** Format integer cents as EUR using the es-ES locale (e.g. "120,00 €"). */
export function formatEUR(cents: number): string {
  return eurFormatter.format(cents / 100);
}

/**
 * Validate a user-entered euro amount: must be a finite number >= 0.
 * Accepts decimals (euro inputs are decimal); cent-level integer checks
 * happen at the Expense boundary.
 */
export function isValidAmount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
