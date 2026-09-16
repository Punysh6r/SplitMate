import { describe, expect, it } from "vitest";
import { centsToEuros, eurosToCents, formatEUR, isValidAmount } from "../money";

describe("money helpers", () => {
  it("converts euros to integer cents", () => {
    expect(eurosToCents(120)).toBe(12000);
    expect(eurosToCents(80)).toBe(8000);
    expect(eurosToCents(0)).toBe(0);
    expect(eurosToCents(19.99)).toBe(1999);
    expect(eurosToCents(0.01)).toBe(1);
  });

  it("keeps all money in integer cents (no float leftovers)", () => {
    expect(Number.isInteger(eurosToCents(10.1))).toBe(true);
    expect(centsToEuros(eurosToCents(19.99))).toBeCloseTo(19.99, 10);
  });

  it("converts cents back to euros", () => {
    expect(centsToEuros(12000)).toBe(120);
    expect(centsToEuros(1)).toBe(0.01);
    expect(centsToEuros(0)).toBe(0);
  });

  it("formats EUR with the es-ES locale", () => {
    const formatted = formatEUR(12000);
    expect(formatted).toContain("€");
    expect(formatted).toContain("120");
    expect(formatEUR(0)).toContain("€");
  });

  it("validates amounts (finite, >= 0)", () => {
    expect(isValidAmount(0)).toBe(true);
    expect(isValidAmount(10.5)).toBe(true);
    expect(isValidAmount(120)).toBe(true);
  });

  it("rejects negative and non-numeric amounts", () => {
    expect(isValidAmount(-1)).toBe(false);
    expect(isValidAmount(-0.01)).toBe(false);
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(Infinity)).toBe(false);
    expect(isValidAmount("10")).toBe(false);
    expect(isValidAmount(undefined)).toBe(false);
  });
});
