import { describe, expect, it } from "vitest";
import { computeSettlement } from "../settle";
import { buildShareText } from "../share";
import type { Expense, Group, Participant } from "../types";

const participants: Participant[] = [
  { id: "ana", name: "Ana" },
  { id: "bruno", name: "Bruno" },
];

const group: Group = {
  id: "g1",
  name: "Madrid",
  currency: "EUR",
  participantIds: participants.map((p) => p.id),
};

// Ana pays 49,00 € for both; Bruno pays 10,00 € for both.
// Owed each: 24,50 € + 5,00 € = 29,50 €. Net Ana +19,50 €, Bruno -19,50 €.
const expenses: Expense[] = [
  {
    id: "e1",
    description: "Cena",
    amountCents: 4900,
    payerId: "ana",
    involvedIds: ["ana", "bruno"],
    date: "2026-09-01",
    currency: "EUR",
  },
  {
    id: "e2",
    description: "Museo",
    amountCents: 1000,
    payerId: "bruno",
    involvedIds: ["ana", "bruno"],
    date: "2026-09-02",
    currency: "EUR",
  },
];

describe("buildShareText", () => {
  it("includes header, total/count, a '+' balance and a transfer line", () => {
    const settlement = computeSettlement(expenses, group.participantIds);
    const text = buildShareText(group, participants, expenses, settlement);

    expect(text).toContain("SplitMate · Madrid");
    expect(text).toContain("Total: 59,00");
    expect(text).toContain("2 gastos");
    // Positive balance carries an explicit '+' prefix.
    expect(text).toMatch(/Ana: pagó .* \(\+.*\)/);
    // Transfer line uses the '· A → B: X' shape.
    expect(text).toMatch(/· Bruno → Ana: .+/);
  });

  it("renders the empty-settlement variant without transfer lines", () => {
    const text = buildShareText(
      group,
      participants,
      [],
      {
        totalCents: 0,
        balances: [
          { participantId: "ana", paidCents: 0, owedCents: 0, netCents: 0 },
          { participantId: "bruno", paidCents: 0, owedCents: 0, netCents: 0 },
        ],
        transfers: [],
      },
    );

    expect(text).toContain("Cuentas saldadas.");
    expect(text).not.toContain("→");
    // Balances section still lists everyone.
    expect(text).toContain("Ana:");
    expect(text).toContain("Bruno:");
  });

  it("formats euros with comma decimals", () => {
    const settlement = computeSettlement(expenses, group.participantIds);
    const text = buildShareText(group, participants, expenses, settlement);

    // Spot-check es-ES formatting: comma decimal + euro sign.
    // Intl es-ES emits a non-breaking space before €, so normalize first.
    const normalized = text.replace(/\u00A0/g, " ");
    expect(normalized).toContain("29,50 €");
    expect(normalized).toContain("19,50 €");
  });
});
