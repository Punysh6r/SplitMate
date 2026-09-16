// Plain-text share summary for SplitMate (Web Share API + clipboard fallback).
// Pure module: no React, no DOM. Money stays in integer cents.

import { formatEUR } from "./money";
import type { Expense, Group, Participant, SettlementResult } from "./types";

/** Format a balance with explicit '+' for positives; negatives keep Intl sign. */
function formatSignedEUR(cents: number): string {
  const formatted = formatEUR(cents);
  return cents > 0 ? `+${formatted}` : formatted;
}

/**
 * Build a short Spanish plain-text summary of a group: header, total,
 * per-person balances (paid/owed/net) and the settlement plan.
 * Participants follow group.participantIds order when available,
 * otherwise the given participants order. Unknown ids fall back to raw id.
 */
export function buildShareText(
  group: Group,
  participants: Participant[],
  expenses: Expense[],
  settlement: SettlementResult,
): string {
  const nameById = new Map(participants.map((p) => [p.id, p.name] as const));
  const nameOf = (id: string): string => nameById.get(id) ?? id;
  const balanceById = new Map(settlement.balances.map((b) => [b.participantId, b]));

  const ordered: Participant[] =
    group.participantIds && group.participantIds.length > 0
      ? [
          ...group.participantIds
            .map((id) => participants.find((p) => p.id === id))
            .filter((p): p is Participant => p !== undefined),
          ...participants.filter((p) => !group.participantIds.includes(p.id)),
        ]
      : [...participants];

  const lines: string[] = [];
  lines.push(`SplitMate · ${group.name}`);
  lines.push(`Total: ${formatEUR(settlement.totalCents)} · ${expenses.length} gastos`);
  lines.push("Saldos:");
  for (const participant of ordered) {
    const balance = balanceById.get(participant.id);
    const paid = balance?.paidCents ?? 0;
    const owed = balance?.owedCents ?? 0;
    const net = balance?.netCents ?? 0;
    lines.push(
      `· ${participant.name}: pagó ${formatEUR(paid)}, le tocan ${formatEUR(owed)} (${formatSignedEUR(net)})`,
    );
  }
  lines.push("Liquidación:");
  if (settlement.transfers.length === 0) {
    lines.push("· Cuentas saldadas.");
  } else {
    for (const transfer of settlement.transfers) {
      lines.push(`· ${nameOf(transfer.fromId)} → ${nameOf(transfer.toId)}: ${formatEUR(transfer.amountCents)}`);
    }
  }

  return lines.join("\n");
}
