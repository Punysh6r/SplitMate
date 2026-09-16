// Presentational expense filters: participant select, inclusive date-from /
// date-to inputs, and a reset button. State lives in the parent; every
// change is reported through onChange. No direct store import.

import type { Participant } from "@/lib/types";

export interface ExpenseFilterValue {
  /** Participant id to filter by, or "" for everyone ("Todos"). */
  participantId: string;
  /** Inclusive ISO start date, or "" for no lower bound. */
  from: string;
  /** Inclusive ISO end date, or "" for no upper bound. */
  to: string;
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilterValue = {
  participantId: "",
  from: "",
  to: "",
};

interface ExpenseFiltersProps {
  value: ExpenseFilterValue;
  members: Participant[];
  onChange: (next: ExpenseFilterValue) => void;
}

export default function ExpenseFilters({ value, members, onChange }: ExpenseFiltersProps) {
  return (
    <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label htmlFor="expense-filter-participant" className="sm-label">
          Participante
        </label>
        <select
          id="expense-filter-participant"
          value={value.participantId}
          onChange={(event) => onChange({ ...value, participantId: event.target.value })}
          className="sm-input mt-1"
        >
          <option value="">Todos</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-filter-from" className="sm-label">
          Desde
        </label>
        <input
          id="expense-filter-from"
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          className="sm-input mt-1"
        />
      </div>

      <div>
        <label htmlFor="expense-filter-to" className="sm-label">
          Hasta
        </label>
        <input
          id="expense-filter-to"
          type="date"
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          className="sm-input mt-1"
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:col-span-4">
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_EXPENSE_FILTERS })}
          className="sm-btn-ghost"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
