"use client";

// Controlled expense form for create AND edit. Presentational: it never talks
// to the store directly, it reports a validated draft through onSubmit.
// Amounts are entered in euros as text (Spanish comma decimals accepted,
// e.g. "12,50") and converted to integer cents on submit.

import { useState } from "react";
import type { FormEvent } from "react";
import { eurosToCents, isValidAmount } from "@/lib/money";
import type { GroupExpense } from "@/lib/storage";
import type { Participant } from "@/lib/types";

export interface ExpenseFormDraft {
  description: string;
  amountCents: number;
  payerId: string;
  involvedIds: string[];
  date: string;
  currency: string;
}

interface ExpenseFormProps {
  members: Participant[];
  initial?: GroupExpense | null;
  onSubmit: (draft: ExpenseFormDraft) => void;
  onCancel: () => void;
}

interface ExpenseFormErrors {
  description?: string;
  amount?: string;
  payer?: string;
  involved?: string;
  date?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({ members, initial, onSubmit, onCancel }: ExpenseFormProps) {
  const isEditing = Boolean(initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountText, setAmountText] = useState(
    initial ? (initial.amountCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [payerId, setPayerId] = useState(initial?.payerId ?? members[0]?.id ?? "");
  const [involvedIds, setInvolvedIds] = useState<string[]>(
    initial?.involvedIds ?? members.map((member) => member.id),
  );
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  const toggleInvolved = (id: string) => {
    setInvolvedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: ExpenseFormErrors = {};

    if (!description.trim()) {
      nextErrors.description = "Escribe una descripción para el gasto.";
    }

    const normalized = amountText.trim().replace(",", ".");
    const parsed = normalized === "" ? NaN : Number(normalized);
    if (!isValidAmount(parsed)) {
      nextErrors.amount = "Escribe una cantidad válida en euros (p. ej., 12,50).";
    }

    if (!payerId || !members.some((member) => member.id === payerId)) {
      nextErrors.payer = "Elige quién pagó el gasto.";
    }

    if (involvedIds.length === 0) {
      nextErrors.involved = "Elige al menos un participante involucrado.";
    }

    if (!date.trim()) {
      nextErrors.date = "Elige una fecha para el gasto.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      description: description.trim(),
      amountCents: eurosToCents(parsed),
      payerId,
      involvedIds,
      date,
      currency: "EUR",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex min-w-0 flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-slate-100">
        {isEditing ? "Editar gasto" : "Nuevo gasto"}
      </h3>

      <div>
        <label htmlFor="expense-description" className="sm-label">
          Descripción
        </label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="p. ej., Cena en Malasaña"
          className="sm-input mt-1"
          autoComplete="off"
        />
        {errors.description ? (
          <p role="alert" className="mt-1 text-sm text-rose-400">
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-amount" className="sm-label">
            Cantidad (€)
          </label>
          <input
            id="expense-amount"
            type="text"
            inputMode="decimal"
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
            placeholder="p. ej., 12,50"
            className="sm-input mt-1"
            autoComplete="off"
          />
          {errors.amount ? (
            <p role="alert" className="mt-1 text-sm text-rose-400">
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="expense-date" className="sm-label">
            Fecha
          </label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="sm-input mt-1"
          />
          {errors.date ? (
            <p role="alert" className="mt-1 text-sm text-rose-400">
              {errors.date}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="expense-payer" className="sm-label">
          Pagado por
        </label>
        <select
          id="expense-payer"
          value={payerId}
          onChange={(event) => setPayerId(event.target.value)}
          className="sm-input mt-1"
        >
          <option value="">Selecciona quién pagó…</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        {errors.payer ? (
          <p role="alert" className="mt-1 text-sm text-rose-400">
            {errors.payer}
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="sm-label">Involucrados</legend>
        {members.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">
            Añade participantes al grupo para repartir el gasto.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {members.map((member) => (
              <li key={member.id}>
                <label className="flex min-h-[44px] min-w-0 cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={involvedIds.includes(member.id)}
                    onChange={() => toggleInvolved(member.id)}
                    className="h-4 w-4 shrink-0 accent-emerald-400"
                  />
                  {member.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        {errors.involved ? (
          <p role="alert" className="mt-1 text-sm text-rose-400">
            {errors.involved}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="sm-btn-primary">
          {isEditing ? "Guardar cambios" : "Guardar gasto"}
        </button>
        <button type="button" onClick={onCancel} className="sm-btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
