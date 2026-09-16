// Domain types for SplitMate MVP.
//
// Convention: all money is stored as integer cents. Never use float
// arithmetic for balances; split remainders one cent at a time.

export interface Participant {
  id: string;
  name: string;
  /** Optional public Revolut handle (revolut.me username), user-entered. */
  revolutTag?: string;
  /** Optional creditor mobile for Bizum (E.164-ish free text), local-only. */
  phone?: string;
}

export interface Expense {
  id: string;
  description: string;
  /** Integer cents, must be >= 0. */
  amountCents: number;
  payerId: string;
  /** Ids of the participants sharing this expense. Must be non-empty. */
  involvedIds: string[];
  /** ISO date string. */
  date: string;
  /** Currency code, default 'EUR'. */
  currency: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  participantIds: string[];
}

export interface SettlementTransfer {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface PersonBalance {
  participantId: string;
  paidCents: number;
  owedCents: number;
  /** paidCents - owedCents. Positive means the person is a creditor. */
  netCents: number;
}

export interface SettlementResult {
  totalCents: number;
  balances: PersonBalance[];
  transfers: SettlementTransfer[];
}

/**
 * Generate a unique id. Uses crypto.randomUUID when available,
 * with a Math.random fallback for older runtimes.
 */
export function newId(): string {
  try {
    const cryptoObj =
      typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;
    if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
      return cryptoObj.randomUUID();
    }
  } catch {
    // Fall through to the fallback below.
  }
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}
