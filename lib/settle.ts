// Deterministic settlement logic for SplitMate MVP.
// Pure functions only: integer cents, no floats, no side effects.

import type {
  Expense,
  PersonBalance,
  SettlementResult,
  SettlementTransfer,
} from "./types";

/**
 * Compute per-person balances and a minimal transfer plan.
 *
 * Rules:
 * - totalCents is the sum of all expense amounts.
 * - paid per person is the sum of the expenses they paid (even when the
 *   payer is not in the involved list for that expense).
 * - each expense is split equally among its involvedIds; remainder cents
 *   go deterministically to the first involved participants in array order.
 * - net = paid - owed. Transfers greedily match the largest creditor with
 *   the largest debtor until all nets are zero; zero nets are skipped.
 *
 * Throws a RangeError on negative or non-integer amountCents, or on an
 * expense with an empty involvedIds list.
 */
export function computeSettlement(
  expenses: Expense[],
  participantIds: string[],
): SettlementResult {
  for (const expense of expenses) {
    if (!Number.isInteger(expense.amountCents) || expense.amountCents < 0) {
      throw new RangeError(
        `Invalid amountCents ${expense.amountCents} on expense ${expense.id}: must be an integer >= 0`,
      );
    }
    if (!expense.involvedIds || expense.involvedIds.length === 0) {
      throw new RangeError(
        `Invalid involvedIds on expense ${expense.id}: must be non-empty`,
      );
    }
  }

  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const id of participantIds) {
    paid.set(id, 0);
    owed.set(id, 0);
  }

  let totalCents = 0;
  for (const expense of expenses) {
    totalCents += expense.amountCents;

    if (paid.has(expense.payerId)) {
      paid.set(expense.payerId, paid.get(expense.payerId)! + expense.amountCents);
    }

    const count = expense.involvedIds.length;
    const base = Math.floor(expense.amountCents / count);
    const remainder = expense.amountCents % count;
    expense.involvedIds.forEach((participantId, index) => {
      // Shares of involved people outside the tracked list are absorbed
      // (not attributed to anyone tracked).
      if (!owed.has(participantId)) return;
      owed.set(
        participantId,
        owed.get(participantId)! + base + (index < remainder ? 1 : 0),
      );
    });
  }

  const balances: PersonBalance[] = participantIds.map((participantId) => {
    const paidCents = paid.get(participantId) ?? 0;
    const owedCents = owed.get(participantId) ?? 0;
    return { participantId, paidCents, owedCents, netCents: paidCents - owedCents };
  });

  // Greedy matching: largest creditor with largest debtor. Secondary sort by
  // id keeps the order fully deterministic on ties.
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .sort(
      (a, b) => b.netCents - a.netCents || (a.participantId < b.participantId ? -1 : 1),
    )
    .map((b) => ({ id: b.participantId, remaining: b.netCents }));
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .sort(
      (a, b) => a.netCents - b.netCents || (a.participantId < b.participantId ? -1 : 1),
    )
    .map((b) => ({ id: b.participantId, remaining: -b.netCents }));

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.remaining, debtor.remaining);
    transfers.push({ fromId: debtor.id, toId: creditor.id, amountCents: amount });
    creditor.remaining -= amount;
    debtor.remaining -= amount;
    if (creditor.remaining === 0) i += 1;
    if (debtor.remaining === 0) j += 1;
  }

  return { totalCents, balances, transfers };
}
