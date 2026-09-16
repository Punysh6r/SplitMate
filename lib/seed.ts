// Deterministic Madrid seed data for SplitMate MVP first run.
//
// Fixed readable ids (no randomness) so server and client first renders match
// and the canonical settlement case is reproducible: Pablo paid 120 EUR,
// Ana paid 80 EUR, Luis paid 40 EUR, everyone involved in every expense.

import type { AppState } from "./storage";

export const SEED_GROUP_ID = "seed-group-madrid";
export const SEED_PARTICIPANT_IDS = ["seed-pablo", "seed-ana", "seed-luis", "seed-marta"] as const;

/** Build the initial app state shown when localStorage is empty. */
export function buildSeedState(): AppState {
  const involvedIds = [...SEED_PARTICIPANT_IDS];
  return {
    groups: [
      {
        id: SEED_GROUP_ID,
        name: "Viaje a Madrid",
        currency: "EUR",
        participantIds: involvedIds,
      },
    ],
    participants: [
      { id: "seed-pablo", name: "Pablo" },
      { id: "seed-ana", name: "Ana" },
      { id: "seed-luis", name: "Luis" },
      { id: "seed-marta", name: "Marta" },
    ],
    expenses: [
      {
        id: "seed-exp-hotel",
        groupId: SEED_GROUP_ID,
        description: "Hotel",
        amountCents: 12000,
        payerId: "seed-pablo",
        involvedIds,
        date: "2026-09-04",
        currency: "EUR",
      },
      {
        id: "seed-exp-cena",
        groupId: SEED_GROUP_ID,
        description: "Cena",
        amountCents: 8000,
        payerId: "seed-ana",
        involvedIds,
        date: "2026-09-05",
        currency: "EUR",
      },
      {
        id: "seed-exp-entradas",
        groupId: SEED_GROUP_ID,
        description: "Entradas",
        amountCents: 4000,
        payerId: "seed-luis",
        involvedIds,
        date: "2026-09-06",
        currency: "EUR",
      },
    ],
  };
}
