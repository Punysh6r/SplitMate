import { describe, expect, it } from "vitest";
import { parseTicketText } from "../ocr";

describe("parseTicketText", () => {
  it("parses a Spanish bar ticket (merchant first line, TOTAL largest)", () => {
    const text = [
      "BAR MANOLO",
      "C/ Mayor 12 - Madrid",
      "Caña 2,50",
      "Tapa 3,00",
      "Café 1,50",
      "TOTAL 24,50 €",
      "Gracias por su visita",
    ].join("\n");
    expect(parseTicketText(text)).toEqual({ merchant: "BAR MANOLO", totalCents: 2450 });
  });

  it("handles thousand separators (1.234,56 beats smaller lines)", () => {
    const text = [
      "SUPER AHORRO",
      "Leche 1,20",
      "Pan 0,85",
      "TOTAL 1.234,56 €",
    ].join("\n");
    // 1.234,56 EUR = 123456 cents.
    expect(parseTicketText(text)).toEqual({ merchant: "SUPER AHORRO", totalCents: 123456 });
  });

  it("returns a null total but keeps the merchant when no amounts exist", () => {
    const text = ["TIENDA LUCÍA", "Gracias por su visita", "Vuelva pronto"].join("\n");
    expect(parseTicketText(text)).toEqual({ merchant: "TIENDA LUCÍA", totalCents: null });
  });

  it("falls back to dot decimals (TOTAL: 18.75)", () => {
    const text = ["CAFE CENTRAL", "Latte 3.50", "TOTAL: 18.75"].join("\n");
    expect(parseTicketText(text)).toEqual({ merchant: "CAFE CENTRAL", totalCents: 1875 });
  });

  it("returns nulls for empty or blank text", () => {
    expect(parseTicketText("")).toEqual({ merchant: null, totalCents: null });
    expect(parseTicketText("   \n  \n\t  ")).toEqual({ merchant: null, totalCents: null });
  });

  it("prefers the largest amount on a total-like line over larger noise elsewhere", () => {
    const text = ["BAR TOP", "Oferta: ahorra 50,00 este mes", "TOTAL 24,50 €"].join("\n");
    expect(parseTicketText(text)).toEqual({ merchant: "BAR TOP", totalCents: 2450 });
  });

  it("cleans edge characters from the merchant and caps it at 60 chars", () => {
    const text = ["*** ¡BAR PEPE! ***", "TOTAL 5,00 €"].join("\n");
    const parsed = parseTicketText(text);
    expect(parsed.merchant).toBe("BAR PEPE");
    const long = `${"A".repeat(80)}\nTOTAL 5,00 €`;
    expect(parseTicketText(long).merchant?.length).toBeLessThanOrEqual(60);
  });
});
