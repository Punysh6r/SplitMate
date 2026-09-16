// Persisted-state shape and localStorage helpers for SplitMate MVP.
//
// The plain state interface lives here (not in store.tsx) so both the seed
// builder and the React provider can import it without import cycles.
// Money stays in integer cents; validation of amounts happens at the UI
// boundary (T6) and inside computeSettlement.

import type { Expense, Group, Participant } from "./types";

export const STORAGE_KEY = "splitmate:v1";

/**
 * An expense bound to a group. The domain Expense type has no groupId, so
 * the store extends it here (lib/types.ts stays untouched). A GroupExpense
 * is still a valid Expense wherever computeSettlement expects one.
 */
export interface GroupExpense extends Expense {
  groupId: string;
}

/**
 * Full app state: groups, the global participant directory (groups reference
 * participants by id via Group.participantIds), and all group expenses.
 */
export interface AppState {
  groups: Group[];
  participants: Participant[];
  expenses: GroupExpense[];
}

/** Read state from localStorage. Returns null on the server or on any failure. */
export function loadState(): AppState | null {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (
      !parsed ||
      !Array.isArray(parsed.groups) ||
      !Array.isArray(parsed.participants) ||
      !Array.isArray(parsed.expenses)
    ) {
      return null;
    }
    return parsed as AppState;
  } catch {
    return null;
  }
}

/** Write state to localStorage. Silently ignores server-side calls and quota errors. */
export function saveState(state: AppState): void {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: MVP keeps running in memory.
  }
}
