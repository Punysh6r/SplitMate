'use client';

// Presentational expense list: one row per expense with description,
// Spanish-formatted date, payer name, amount, and involved names.
// Edit and delete are delegated through callbacks; deletion is guarded by
// window.confirm before onDelete runs. No direct store import.
//
// Filtering morphs the list with the Flip plugin. Rows carry data-flip-item
// and stable key={expense.id}.

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { formatEUR } from "@/lib/money";
import { prefersReducedMotion, registerMotionPlugins } from "@/lib/motion";
import type { GroupExpense } from "@/lib/storage";

registerMotionPlugins();

interface ExpenseListProps {
  expenses: GroupExpense[];
  participantName: (id: string) => string;
  onEdit: (expense: GroupExpense) => void;
  onDelete: (id: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Format an ISO date string for display; falls back to the raw value. */
function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return dateFormatter.format(parsed);
}

export default function ExpenseList({ expenses, participantName, onEdit, onDelete }: ExpenseListProps) {
  const scope = useRef<HTMLUListElement>(null);
  // Flip state of the previous list, captured pre-commit (see below).
  const pendingState = useRef<Flip.FlipState | null>(null);
  // idsKey of the last committed render; drives capture + animation guards.
  const committedIds = useRef<string | null>(null);
  const idsKey = expenses.map((expense) => expense.id).join(",");

  // Pre-commit capture (render phase): the DOM still shows the previous
  // list here, so Flip.getState records the "first" positions. Effect
  // cleanup cannot be used for this — cleanups run AFTER React commits
  // the DOM mutation, so they would capture the already-new layout.
  // getState is a read-only measurement (no DOM writes), StrictMode-safe.
  if (idsKey !== committedIds.current && scope.current) {
    pendingState.current = Flip.getState(
      gsap.utils.toArray("[data-flip-item]", scope.current),
    );
  }

  useGSAP(
    () => {
      const changed = idsKey !== committedIds.current;
      committedIds.current = idsKey;
      const state = pendingState.current;
      pendingState.current = null;
      if (!changed || prefersReducedMotion()) return;
      if (state) {
        Flip.from(state, {
          duration: 0.45,
          ease: "power2.inOut",
          absolute: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            ),
          onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.25 }),
        });
      } else if (scope.current) {
        // No prior DOM to invert from (e.g. filtering back from an empty
        // list): fade the incoming rows in instead of popping them.
        gsap.fromTo(
          gsap.utils.toArray("[data-flip-item]", scope.current),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        );
      }
      // Flip/context tweens die with the component via useGSAP cleanup.
      return () => {
        gsap.killTweensOf("[data-flip-item]");
      };
    },
    { scope, dependencies: [idsKey] },
  );

  if (expenses.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-400">
        Todavía no hay gastos que mostrar.
      </p>
    );
  }

  const handleDelete = (expense: GroupExpense) => {
    const confirmed = window.confirm(
      `¿Eliminar el gasto «${expense.description}»? Esta acción no se puede deshacer.`,
    );
    if (confirmed) onDelete(expense.id);
  };

  return (
    <ul ref={scope} className="mt-3 divide-y divide-white/10">
      {expenses.map((expense) => (
        <li
          key={expense.id}
          data-flip-item
          className="flex min-w-0 items-start justify-between gap-3 rounded-lg py-3 transition-colors hover:bg-white/5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-100">{expense.description}</p>
            <p className="mt-0.5 truncate text-sm text-slate-400">
              {formatDate(expense.date)} · Pagado por {participantName(expense.payerId)}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              Entre: {expense.involvedIds.map(participantName).join(", ")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="font-semibold tabular-nums text-slate-50">
              {formatEUR(expense.amountCents)}
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(expense)}
                className="sm-btn-ghost"
                aria-label={`Editar ${expense.description}`}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(expense)}
                className="sm-btn-ghost"
                aria-label={`Eliminar ${expense.description}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
