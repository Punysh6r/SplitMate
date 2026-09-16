"use client";

// Presentational participant list: renders the group's members, wires add /
// remove through callbacks, and disables removal when the store refuses it
// (the participant paid an expense in this group). No direct store import.
//
// Tag editing (P6): when onTagChange is provided, each member row shows a
// small "Revolut" input committed on blur + Enter (no per-keystroke store
// churn); a failed commit shows an inline Spanish hint.

import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Group, Participant } from "@/lib/types";

interface ParticipantListProps {
  group: Group;
  participants: Participant[];
  onAdd: (name: string) => boolean;
  onRemove: (participantId: string) => boolean;
  canRemove: (participantId: string) => boolean;
  /** Optional tag commit; returns false when the raw tag is invalid. */
  onTagChange?: (participantId: string, rawTag: string) => boolean;
  /** Optional phone commit; returns false when the raw phone is invalid. */
  onPhoneChange?: (participantId: string, rawPhone: string) => boolean;
}

function ParticipantTagInput({
  participantId,
  participantName,
  initialTag,
  onTagChange,
}: {
  participantId: string;
  participantName: string;
  initialTag: string;
  onTagChange: (participantId: string, rawTag: string) => boolean;
}) {
  const [draft, setDraft] = useState(initialTag);
  const [error, setError] = useState<string | null>(null);

  // Resync after a successful parent commit (normalized tag comes back down).
  useEffect(() => {
    setDraft(initialTag);
    setError(null);
  }, [initialTag]);

  const commit = () => {
    if (draft === initialTag) {
      setError(null);
      return;
    }
    const ok = onTagChange(participantId, draft);
    setError(ok ? null : "3-32 caracteres: letras, números, punto, guion");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const inputId = `revolut-tag-${participantId}`;
  const hintId = `${inputId}-hint`;

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <label htmlFor={inputId} className="shrink-0 text-xs text-slate-400">
          Revolut
        </label>
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="usuario (opcional)"
          aria-label={`Revolut de ${participantName}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? hintId : undefined}
          className="sm-input min-w-0 flex-1 !py-1 text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </span>
      {error ? (
        <span id={hintId} role="alert" className="text-xs text-rose-400">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function ParticipantPhoneInput({
  participantId,
  participantName,
  initialPhone,
  onPhoneChange,
}: {
  participantId: string;
  participantName: string;
  initialPhone: string;
  onPhoneChange: (participantId: string, rawPhone: string) => boolean;
}) {
  const [draft, setDraft] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);

  // Resync after a successful parent commit (normalized phone comes back down).
  useEffect(() => {
    setDraft(initialPhone);
    setError(null);
  }, [initialPhone]);

  const commit = () => {
    if (draft === initialPhone) {
      setError(null);
      return;
    }
    const ok = onPhoneChange(participantId, draft);
    setError(ok ? null : "9-15 dígitos, opcional +");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const inputId = `bizum-phone-${participantId}`;
  const hintId = `${inputId}-hint`;

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <label htmlFor={inputId} className="shrink-0 text-xs text-slate-400">
          Móvil
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="tel"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="600 123 456 (opcional)"
          aria-label={`Móvil de ${participantName}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? hintId : undefined}
          className="sm-input min-w-0 flex-1 !py-1 text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </span>
      {error ? (
        <span id={hintId} role="alert" className="text-xs text-rose-400">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export default function ParticipantList({
  group,
  participants,
  onAdd,
  onRemove,
  canRemove,
  onTagChange,
  onPhoneChange,
}: ParticipantListProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const ok = onAdd(name);
    if (ok) {
      setName("");
      setError(null);
    } else {
      setError("Escribe un nombre válido para el participante.");
    }
  };

  return (
    <section aria-label="Participantes" className="sm-card min-w-0 p-4 sm:p-5">
      <h2 className="sm-section-title">
        Participantes{" "}
        <span className="text-sm font-normal tabular-nums text-slate-400">
          ({group.participantIds.length})
        </span>
      </h2>

      {participants.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">
          Todavía no hay participantes. Añade el primero abajo.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {participants.map((participant) => {
            const removable = canRemove(participant.id);
            return (
              <li
                key={participant.id}
                className="flex min-w-0 flex-col gap-1.5 rounded-lg py-2 transition-colors hover:bg-white/5"
              >
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-slate-100">
                    {participant.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(participant.id)}
                    disabled={!removable}
                    title={
                      removable
                        ? `Eliminar a ${participant.name}`
                        : "No se puede eliminar: pagó gastos en este grupo"
                    }
                    className="sm-btn-ghost shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </span>
                {onTagChange ? (
                  <ParticipantTagInput
                    participantId={participant.id}
                    participantName={participant.name}
                    initialTag={participant.revolutTag ?? ""}
                    onTagChange={onTagChange}
                  />
                ) : null}
                {onPhoneChange ? (
                  <ParticipantPhoneInput
                    participantId={participant.id}
                    participantName={participant.name}
                    initialPhone={participant.phone ?? ""}
                    onPhoneChange={onPhoneChange}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 min-w-0">
        <label htmlFor="new-participant-name" className="sm-label">
          Añadir participante
        </label>
        <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            id="new-participant-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="p. ej., Marta"
            className="sm-input min-w-0 flex-1"
            autoComplete="off"
          />
          <button type="submit" className="sm-btn-primary shrink-0">
            Añadir
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-rose-400">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
