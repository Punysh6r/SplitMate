import { describe, expect, it } from "vitest";
import { buildGroupCsv, escapeCsvField } from "../csv";
import { computeSettlement } from "../settle";
import type { Expense, Group, Participant } from "../types";

const participants: Participant[] = [
  { id: "pablo", name: "Pablo" },
  { id: "ana", name: "Ana" },
  { id: "luis", name: "Luis" },
  { id: "marta", name: "Marta" },
];

const group: Group = {
  id: "g1",
  name: "Madrid",
  currency: "EUR",
  participantIds: participants.map((p) => p.id),
};

const expenses: Expense[] = [
  {
    id: "e1",
    description: "Cena",
    amountCents: 12000,
    payerId: "pablo",
    involvedIds: ["pablo", "ana", "luis", "marta"],
    date: "2026-09-01",
    currency: "EUR",
  },
  {
    id: "e2",
    description: "Museo",
    amountCents: 8000,
    payerId: "ana",
    involvedIds: ["pablo", "ana", "luis", "marta"],
    date: "2026-09-02",
    currency: "EUR",
  },
];

describe("buildGroupCsv", () => {
  it("includes Spanish headers and all sections", () => {
    const settlement = computeSettlement(expenses, group.participantIds);
    const csv = buildGroupCsv(group, participants, expenses, settlement);

    expect(csv).toContain("grupo;Madrid");
    expect(csv).toContain("fecha;descripcion;pagado_por;cantidad_eur;participantes");
    expect(csv).toContain("participante;pagado_eur;corresponde_eur;saldo_eur");
    expect(csv).toContain("de;a;cantidad_eur");
    expect(csv).toContain("gastos");
    expect(csv).toContain("saldos");
    expect(csv).toContain("liquidacion");
  });

  it("renders euro figures and names", () => {
    const settlement = computeSettlement(expenses, group.participantIds);
    const csv = buildGroupCsv(group, participants, expenses, settlement);

    expect(csv).toContain("120.00");
    expect(csv).toContain("Pablo");
    expect(csv).toContain("total_eur;200.00");
  });

  it("quotes fields containing semicolons or double quotes", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField("a;b")).toBe('"a;b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');

    const tricky: Expense = {
      id: "e9",
      description: 'Cena; "especial"',
      amountCents: 1000,
      payerId: "pablo",
      involvedIds: ["pablo", "ana"],
      date: "2026-09-03",
      currency: "EUR",
    };
    const settlement = computeSettlement([...expenses, tricky], group.participantIds);
    const csv = buildGroupCsv(group, participants, [...expenses, tricky], settlement);
    expect(csv).toContain('"Cena; ""especial"""');
  });
});
