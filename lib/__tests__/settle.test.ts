import { describe, expect, it } from "vitest";
import { computeSettlement } from "../settle";
import type { Expense } from "../types";

function expense(
  id: string,
  payerId: string,
  amountCents: number,
  involvedIds: string[],
): Expense {
  return {
    id,
    description: id,
    amountCents,
    payerId,
    involvedIds,
    date: "2026-09-01",
    currency: "EUR",
  };
}

function transferKey(t: { fromId: string; toId: string; amountCents: number }): string {
  return `${t.fromId}->${t.toId}:${t.amountCents}`;
}

describe("computeSettlement", () => {
  it("settles the canonical Madrid case (Pablo 120, Ana 80, Luis 40, Marta 0)", () => {
    const ids = ["pablo", "ana", "luis", "marta"];
    const expenses = [
      expense("e1", "pablo", 12000, ids),
      expense("e2", "ana", 8000, ids),
      expense("e3", "luis", 4000, ids),
    ];

    const result = computeSettlement(expenses, ids);

    expect(result.totalCents).toBe(24000);
    const netById = new Map(result.balances.map((b) => [b.participantId, b.netCents]));
    expect(netById.get("pablo")).toBe(6000);
    expect(netById.get("ana")).toBe(2000);
    expect(netById.get("luis")).toBe(-2000);
    expect(netById.get("marta")).toBe(-6000);

    // Order-independent transfer comparison.
    const actual = result.transfers.map(transferKey).sort();
    const expected = [
      { fromId: "luis", toId: "ana", amountCents: 2000 },
      { fromId: "marta", toId: "pablo", amountCents: 6000 },
    ]
      .map(transferKey)
      .sort();
    expect(actual).toEqual(expected);
    expect(result.transfers).toHaveLength(2);
  });

  it("handles an uneven subset split", () => {
    const ids = ["a", "b", "c"];
    const expenses = [expense("e1", "a", 10000, ["a", "b"])];

    const result = computeSettlement(expenses, ids);
    const byId = new Map(result.balances.map((b) => [b.participantId, b]));

    expect(byId.get("a")).toMatchObject({ paidCents: 10000, owedCents: 5000, netCents: 5000 });
    expect(byId.get("b")).toMatchObject({ paidCents: 0, owedCents: 5000, netCents: -5000 });
    expect(byId.get("c")).toMatchObject({ paidCents: 0, owedCents: 0, netCents: 0 });
    expect(result.transfers).toEqual([{ fromId: "b", toId: "a", amountCents: 5000 }]);
  });

  it("assigns 10 EUR / 3 remainder cents deterministically to the first involved", () => {
    const ids = ["p1", "p2", "p3"];
    const expenses = [expense("e1", "p1", 1000, ["p1", "p2", "p3"])];

    const result = computeSettlement(expenses, ids);
    const owedById = new Map(result.balances.map((b) => [b.participantId, b.owedCents]));

    // 1000 = 333 * 3 + 1 -> the first involved participant owes the extra cent.
    expect(owedById.get("p1")).toBe(334);
    expect(owedById.get("p2")).toBe(333);
    expect(owedById.get("p3")).toBe(333);

    const actual = result.transfers.map(transferKey).sort();
    expect(actual).toEqual(
      [
        { fromId: "p2", toId: "p1", amountCents: 333 },
        { fromId: "p3", toId: "p1", amountCents: 333 },
      ]
        .map(transferKey)
        .sort(),
    );

    // Array order drives the remainder: first entry wins the extra cent.
    const reversed = computeSettlement([expense("e1", "p1", 1000, ["p3", "p2", "p1"])], ids);
    const reversedOwed = new Map(reversed.balances.map((b) => [b.participantId, b.owedCents]));
    expect(reversedOwed.get("p3")).toBe(334);
    expect(reversedOwed.get("p1")).toBe(333);
  });

  it("returns no transfers for empty expenses", () => {
    const result = computeSettlement([], ["pablo", "ana"]);
    expect(result.totalCents).toBe(0);
    expect(result.balances).toHaveLength(2);
    expect(result.balances.every((b) => b.netCents === 0)).toBe(true);
    expect(result.transfers).toEqual([]);
  });

  it("returns no transfers for a single participant", () => {
    const result = computeSettlement([expense("e1", "solo", 5000, ["solo"])], ["solo"]);
    expect(result.totalCents).toBe(5000);
    expect(result.balances).toEqual([
      { participantId: "solo", paidCents: 5000, owedCents: 5000, netCents: 0 },
    ]);
    expect(result.transfers).toEqual([]);
  });

  it("supports a payer outside the involved list", () => {
    const ids = ["a", "b", "c"];
    const expenses = [expense("e1", "a", 6000, ["b", "c"])];

    const result = computeSettlement(expenses, ids);
    const netById = new Map(result.balances.map((b) => [b.participantId, b.netCents]));
    expect(netById.get("a")).toBe(6000);
    expect(netById.get("b")).toBe(-3000);
    expect(netById.get("c")).toBe(-3000);

    const actual = result.transfers.map(transferKey).sort();
    expect(actual).toEqual(
      [
        { fromId: "b", toId: "a", amountCents: 3000 },
        { fromId: "c", toId: "a", amountCents: 3000 },
      ]
        .map(transferKey)
        .sort(),
    );
  });

  it("rejects negative and non-integer amounts", () => {
    expect(() => computeSettlement([expense("bad", "a", -100, ["a"])], ["a"])).toThrow(RangeError);
    expect(() => computeSettlement([expense("bad", "a", 10.5, ["a"])], ["a"])).toThrow(RangeError);
    expect(() => computeSettlement([expense("bad", "a", 100, [])], ["a"])).toThrow(RangeError);
  });
});
