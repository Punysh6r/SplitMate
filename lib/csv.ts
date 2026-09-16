// CSV export for SplitMate MVP. Semicolon-separated, Spanish headers.

import type { Expense, Group, Participant, SettlementResult } from "./types";

/** Quote a field when it contains ';' or '"'. Embedded quotes are doubled. */
export function escapeCsvField(field: string): string {
  if (field.includes(";") || field.includes('"')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

/** Render integer cents as a plain "123.45" euro figure (dot decimal). */
function eurosFigure(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Build a semicolon-separated CSV summary of a group: group info, expenses
 * (fecha;descripcion;pagado_por;cantidad_eur;participantes), balances
 * (participante;pagado_eur;corresponde_eur;saldo_eur) and transfers
 * (de;a;cantidad_eur). Names are resolved from the participants list,
 * falling back to the raw id when unknown.
 */
export function buildGroupCsv(
  group: Group,
  participants: Participant[],
  expenses: Expense[],
  settlement: SettlementResult,
): string {
  const nameById = new Map(participants.map((p) => [p.id, p.name] as const));
  const nameOf = (id: string): string => nameById.get(id) ?? id;
  const balanceById = new Map(settlement.balances.map((b) => [b.participantId, b]));

  const lines: string[] = [];

  // Group info section.
  lines.push(`grupo;${escapeCsvField(group.name)}`);
  lines.push(`moneda;${escapeCsvField(group.currency)}`);
  lines.push(`participantes;${participants.length}`);
  lines.push(`total_eur;${eurosFigure(settlement.totalCents)}`);
  lines.push("");

  // Expenses section.
  lines.push("gastos");
  lines.push("fecha;descripcion;pagado_por;cantidad_eur;participantes");
  for (const expense of expenses) {
    const involvedNames = expense.involvedIds.map(nameOf).join(", ");
    lines.push(
      [
        expense.date,
        escapeCsvField(expense.description),
        escapeCsvField(nameOf(expense.payerId)),
        eurosFigure(expense.amountCents),
        escapeCsvField(involvedNames),
      ].join(";"),
    );
  }
  lines.push("");

  // Balances section.
  lines.push("saldos");
  lines.push("participante;pagado_eur;corresponde_eur;saldo_eur");
  for (const participant of participants) {
    const balance = balanceById.get(participant.id);
    const paid = balance?.paidCents ?? 0;
    const owed = balance?.owedCents ?? 0;
    const net = balance?.netCents ?? 0;
    lines.push(
      [
        escapeCsvField(participant.name),
        eurosFigure(paid),
        eurosFigure(owed),
        eurosFigure(net),
      ].join(";"),
    );
  }
  lines.push("");

  // Transfers section.
  lines.push("liquidacion");
  lines.push("de;a;cantidad_eur");
  for (const transfer of settlement.transfers) {
    lines.push(
      [
        escapeCsvField(nameOf(transfer.fromId)),
        escapeCsvField(nameOf(transfer.toId)),
        eurosFigure(transfer.amountCents),
      ].join(";"),
    );
  }

  return lines.join("\n") + "\n";
}
