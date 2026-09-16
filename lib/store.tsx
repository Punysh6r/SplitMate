"use client";

// React store for SplitMate MVP: provider + hook over localStorage state.
//
// First render ALWAYS uses buildSeedState() (fixed ids), so SSR and the
// client's first render match exactly. Stored state is applied in a mount-only
// effect below; the persist effect skips its first run so it never clobbers
// storage with the seed before hydration.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { loadState, saveState } from "./storage";
import type { AppState, GroupExpense } from "./storage";
import { buildSeedState } from "./seed";
import { isValidPhone, isValidTag, normalizePhone, normalizeTag } from "./paylinks";
import { newId } from "./types";
import type { Group, Participant } from "./types";

export interface ExpenseDraft {
  description: string;
  amountCents: number;
  payerId: string;
  involvedIds: string[];
  date: string;
  currency: string;
}

export type ExpensePatch = Partial<ExpenseDraft>;

/**
 * Shared validation for expense drafts and patches: description trimmed
 * non-empty, amountCents an integer >= 0, payer a group member, involvedIds
 * a non-empty subset of group members, date a non-empty string.
 */
function isValidExpenseInput(
  group: Group | undefined,
  description: unknown,
  amountCents: unknown,
  payerId: unknown,
  involvedIds: unknown,
  date: unknown,
): boolean {
  if (!group) return false;
  if (typeof description !== "string" || !description.trim()) return false;
  if (!Number.isInteger(amountCents) || (amountCents as number) < 0) return false;
  if (typeof payerId !== "string" || !group.participantIds.includes(payerId)) {
    return false;
  }
  if (!Array.isArray(involvedIds) || involvedIds.length === 0) return false;
  if (
    !involvedIds.every(
      (id): id is string => typeof id === "string" && group.participantIds.includes(id),
    )
  ) {
    return false;
  }
  if (typeof date !== "string" || !date.trim()) return false;
  return true;
}

export interface SplitMateContextValue {
  groups: Group[];
  participants: Participant[];
  expenses: GroupExpense[];
  /** Create a group with a trimmed non-empty name. Returns success. */
  createGroup: (name: string) => boolean;
  /** Rename a group. Refuses empty names and unknown groups. */
  renameGroup: (groupId: string, name: string) => boolean;
  /** Delete a group, its expenses, and participants left unreferenced. */
  deleteGroup: (groupId: string) => boolean;
  /** Add a participant with a trimmed non-empty name. Returns success. */
  addParticipant: (groupId: string, name: string) => boolean;
  /**
   * Remove a participant. Refuses (false) when they paid any expense in the
   * group; otherwise unlinks them, filters them out of involvedIds, and drops
   * expenses left with no involved participants.
   */
  removeParticipant: (groupId: string, participantId: string) => boolean;
  /** True when the participant may be removed (member and never a payer). */
  canRemoveParticipant: (groupId: string, participantId: string) => boolean;
  /**
   * Set or clear a participant's Revolut tag. Empty input clears the tag
   * (true); otherwise the normalized tag must be valid (false, no change).
   */
  updateParticipantTag: (participantId: string, rawTag: string) => boolean;
  /**
   * Set or clear a participant's Bizum mobile. Empty input clears the
   * phone (true); otherwise the normalized phone must be valid
   * (false, no change). Bizum is clipboard-bridge only; the number is
   * stored locally and never sent anywhere.
   */
  updateParticipantPhone: (participantId: string, rawPhone: string) => boolean;
  /**
   * Add an expense to a group. Validates the draft; on success returns the
   * new expense id, otherwise null. Currency is always stored as 'EUR'.
   */
  addExpense: (groupId: string, draft: ExpenseDraft) => string | null;
  /**
   * Update an expense by id. Merges the patch over the stored expense and
   * validates the result against its group. Returns success.
   */
  updateExpense: (expenseId: string, patch: ExpensePatch) => boolean;
  /** Delete an expense by id. Returns false when unknown. */
  deleteExpense: (expenseId: string) => boolean;
  getGroup: (groupId: string) => Group | undefined;
  /** Group participants in the group's own id order. */
  getGroupParticipants: (groupId: string) => Participant[];
  getGroupExpenses: (groupId: string) => GroupExpense[];
}

const SplitMateContext = createContext<SplitMateContextValue | null>(null);

export function SplitMateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSeedState());
  const mountedRef = useRef(false);

  // Client-only hydration: runs after first paint, so no SSR mismatch.
  useEffect(() => {
    const stored = loadState();
    if (stored) setState(stored);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  const value = useMemo<SplitMateContextValue>(() => {
    const findGroup = (groupId: string): Group | undefined =>
      state.groups.find((group) => group.id === groupId);

    const isPayerInGroup = (groupId: string, participantId: string): boolean =>
      state.expenses.some(
        (expense) => expense.groupId === groupId && expense.payerId === participantId,
      );

    return {
      groups: state.groups,
      participants: state.participants,
      expenses: state.expenses,

      createGroup: (name: string): boolean => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const group: Group = {
          id: newId(),
          name: trimmed,
          currency: "EUR",
          participantIds: [],
        };
        setState((prev) => ({ ...prev, groups: [...prev.groups, group] }));
        return true;
      },

      renameGroup: (groupId: string, name: string): boolean => {
        const trimmed = name.trim();
        if (!trimmed || !findGroup(groupId)) return false;
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((group) =>
            group.id === groupId ? { ...group, name: trimmed } : group,
          ),
        }));
        return true;
      },

      deleteGroup: (groupId: string): boolean => {
        if (!findGroup(groupId)) return false;
        setState((prev) => {
          const groups = prev.groups.filter((group) => group.id !== groupId);
          const expenses = prev.expenses.filter((expense) => expense.groupId !== groupId);
          const referenced = new Set(groups.flatMap((group) => group.participantIds));
          const participants = prev.participants.filter((participant) =>
            referenced.has(participant.id),
          );
          return { groups, participants, expenses };
        });
        return true;
      },

      addParticipant: (groupId: string, name: string): boolean => {
        const trimmed = name.trim();
        if (!trimmed || !findGroup(groupId)) return false;
        const participant: Participant = { id: newId(), name: trimmed };
        setState((prev) => {
          if (!prev.groups.some((group) => group.id === groupId)) return prev;
          return {
            ...prev,
            participants: [...prev.participants, participant],
            groups: prev.groups.map((group) =>
              group.id === groupId
                ? { ...group, participantIds: [...group.participantIds, participant.id] }
                : group,
            ),
          };
        });
        return true;
      },

      removeParticipant: (groupId: string, participantId: string): boolean => {
        const group = findGroup(groupId);
        if (!group || !group.participantIds.includes(participantId)) return false;
        if (isPayerInGroup(groupId, participantId)) return false;
        setState((prev) => {
          const expenses = prev.expenses
            .map((expense) =>
              expense.groupId === groupId
                ? {
                    ...expense,
                    involvedIds: expense.involvedIds.filter((id) => id !== participantId),
                  }
                : expense,
            )
            .filter(
              (expense) => expense.groupId !== groupId || expense.involvedIds.length > 0,
            );
          const groups = prev.groups.map((entry) =>
            entry.id === groupId
              ? {
                  ...entry,
                  participantIds: entry.participantIds.filter((id) => id !== participantId),
                }
              : entry,
          );
          const stillReferenced = groups.some((entry) =>
            entry.participantIds.includes(participantId),
          );
          const participants = stillReferenced
            ? prev.participants
            : prev.participants.filter((participant) => participant.id !== participantId);
          return { groups, participants, expenses };
        });
        return true;
      },

      canRemoveParticipant: (groupId: string, participantId: string): boolean => {
        const group = findGroup(groupId);
        if (!group || !group.participantIds.includes(participantId)) return false;
        return !isPayerInGroup(groupId, participantId);
      },

      updateParticipantTag: (participantId: string, rawTag: string): boolean => {
        if (typeof rawTag !== "string") return false;
        if (!state.participants.some((p) => p.id === participantId)) return false;
        const normalized = normalizeTag(rawTag);
        if (normalized === "") {
          setState((prev) => ({
            ...prev,
            participants: prev.participants.map((participant) => {
              if (participant.id !== participantId) return participant;
              const next = { ...participant };
              delete next.revolutTag;
              return next;
            }),
          }));
          return true;
        }
        if (!isValidTag(normalized)) return false;
        setState((prev) => ({
          ...prev,
          participants: prev.participants.map((participant) =>
            participant.id === participantId
              ? { ...participant, revolutTag: normalized }
              : participant,
          ),
        }));
        return true;
      },

      updateParticipantPhone: (participantId: string, rawPhone: string): boolean => {
        if (typeof rawPhone !== "string") return false;
        if (!state.participants.some((p) => p.id === participantId)) return false;
        const normalized = normalizePhone(rawPhone);
        if (normalized === "") {
          setState((prev) => ({
            ...prev,
            participants: prev.participants.map((participant) => {
              if (participant.id !== participantId) return participant;
              const next = { ...participant };
              delete next.phone;
              return next;
            }),
          }));
          return true;
        }
        if (!isValidPhone(normalized)) return false;
        setState((prev) => ({
          ...prev,
          participants: prev.participants.map((participant) =>
            participant.id === participantId
              ? { ...participant, phone: normalized }
              : participant,
          ),
        }));
        return true;
      },

      getGroup: findGroup,

      addExpense: (groupId: string, draft: ExpenseDraft): string | null => {
        const group = findGroup(groupId);
        if (
          !isValidExpenseInput(
            group,
            draft.description,
            draft.amountCents,
            draft.payerId,
            draft.involvedIds,
            draft.date,
          )
        ) {
          return null;
        }
        const expense: GroupExpense = {
          id: newId(),
          groupId,
          description: draft.description.trim(),
          amountCents: draft.amountCents,
          payerId: draft.payerId,
          involvedIds: [...draft.involvedIds],
          date: draft.date,
          currency: "EUR",
        };
        setState((prev) => {
          if (!prev.groups.some((entry) => entry.id === groupId)) return prev;
          return { ...prev, expenses: [...prev.expenses, expense] };
        });
        return expense.id;
      },

      updateExpense: (expenseId: string, patch: ExpensePatch): boolean => {
        const existing = state.expenses.find((expense) => expense.id === expenseId);
        if (!existing) return false;
        const group = findGroup(existing.groupId);
        const next = {
          description: patch.description ?? existing.description,
          amountCents: patch.amountCents ?? existing.amountCents,
          payerId: patch.payerId ?? existing.payerId,
          involvedIds: patch.involvedIds ?? existing.involvedIds,
          date: patch.date ?? existing.date,
        };
        if (
          !isValidExpenseInput(
            group,
            next.description,
            next.amountCents,
            next.payerId,
            next.involvedIds,
            next.date,
          )
        ) {
          return false;
        }
        const description = next.description.trim();
        const involvedIds = [...next.involvedIds];
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((expense) =>
            expense.id === expenseId
              ? {
                  ...expense,
                  description,
                  amountCents: next.amountCents,
                  payerId: next.payerId,
                  involvedIds,
                  date: next.date,
                  currency: "EUR",
                }
              : expense,
          ),
        }));
        return true;
      },

      deleteExpense: (expenseId: string): boolean => {
        if (!state.expenses.some((expense) => expense.id === expenseId)) return false;
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((expense) => expense.id !== expenseId),
        }));
        return true;
      },

      getGroupParticipants: (groupId: string): Participant[] => {
        const group = findGroup(groupId);
        if (!group) return [];
        const byId = new Map(state.participants.map((p) => [p.id, p] as const));
        const result: Participant[] = [];
        for (const id of group.participantIds) {
          const participant = byId.get(id);
          if (participant) result.push(participant);
        }
        return result;
      },

      getGroupExpenses: (groupId: string): GroupExpense[] =>
        state.expenses.filter((expense) => expense.groupId === groupId),
    };
  }, [state]);

  return <SplitMateContext.Provider value={value}>{children}</SplitMateContext.Provider>;
}

export function useSplitMate(): SplitMateContextValue {
  const context = useContext(SplitMateContext);
  if (!context) throw new Error("useSplitMate must be used inside SplitMateProvider");
  return context;
}
