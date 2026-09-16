import { describe, expect, it } from "vitest";
import {
  buildPayConcept,
  buildRevolutLink,
  isValidPhone,
  isValidTag,
  linkAmount,
  normalizePhone,
  normalizeTag,
} from "../paylinks";
import { formatEUR } from "../money";

describe("paylinks", () => {
  it("builds a valid revolut.me link, normalizing '@' and currency case", () => {
    expect(buildRevolutLink("@juanc", 2000, "eur")).toBe(
      "https://revolut.me/juanc/20EUR",
    );
  });

  it("formats cent amounts minimally (no thousands, dot decimal)", () => {
    expect(linkAmount(2000)).toBe("20");
    expect(linkAmount(2050)).toBe("20.50");
    expect(linkAmount(5)).toBe("0.05");
  });

  it("returns null for invalid tags", () => {
    expect(buildRevolutLink("", 2000, "EUR")).toBeNull();
    expect(buildRevolutLink("a b", 2000, "EUR")).toBeNull();
    expect(buildRevolutLink("ab", 2000, "EUR")).toBeNull();
    expect(buildRevolutLink("a".repeat(33), 2000, "EUR")).toBeNull();
  });

  it("returns null for zero or negative amounts", () => {
    expect(buildRevolutLink("juanc", 0, "EUR")).toBeNull();
    expect(buildRevolutLink("juanc", -100, "EUR")).toBeNull();
  });

  it("returns null for bad currencies", () => {
    expect(buildRevolutLink("juanc", 2000, "EURO")).toBeNull();
    expect(buildRevolutLink("juanc", 2000, "e2")).toBeNull();
  });

  it("builds a pay concept with group, both names, and formatted amount", () => {
    const concept = buildPayConcept("Piso", "Marta", "Juan", 2000);
    expect(concept).toContain("Piso");
    expect(concept).toContain("Marta");
    expect(concept).toContain("Juan");
    expect(concept).toContain(formatEUR(2000));
  });

  it("normalizes tags by trimming and stripping one leading '@'", () => {
    expect(normalizeTag("  @juanc  ")).toBe("juanc");
    expect(normalizeTag("juanc")).toBe("juanc");
    expect(isValidTag("@juanc")).toBe(true);
  });

  it("normalizes phones by removing spaces, dots, dashes, and parens", () => {
    expect(normalizePhone("+34 600 123-456")).toBe("+34600123456");
    expect(normalizePhone("(600) 123 456")).toBe("600123456");
  });

  it("validates normalized phones (9-15 digits, optional leading +)", () => {
    expect(isValidPhone("+34600123456")).toBe(true);
    expect(isValidPhone("600123456")).toBe(true);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("12")).toBe(false);
    expect(isValidPhone("1".repeat(16))).toBe(false);
  });

  it("includes 'Bizum al {phone}' in the concept when the phone is valid", () => {
    const concept = buildPayConcept("Piso", "Marta", "Juan", 2000, "+34 600 123-456");
    expect(concept).toContain("Bizum al +34600123456");
    expect(concept).toContain(formatEUR(2000));
  });

  it("keeps the exact old concept format when the phone is absent or invalid", () => {
    const expected = `SplitMate · Piso · Marta → Juan ${formatEUR(2000)}`;
    expect(buildPayConcept("Piso", "Marta", "Juan", 2000)).toBe(expected);
    expect(buildPayConcept("Piso", "Marta", "Juan", 2000, null)).toBe(expected);
    expect(buildPayConcept("Piso", "Marta", "Juan", 2000, "")).toBe(expected);
    expect(buildPayConcept("Piso", "Marta", "Juan", 2000, "abc")).toBe(expected);
  });
});
