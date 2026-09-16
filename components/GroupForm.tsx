"use client";

// Controlled form to create a group. Reports store success via onCreate.

import { useState } from "react";
import type { FormEvent } from "react";

interface GroupFormProps {
  onCreate: (name: string) => boolean;
}

export default function GroupForm({ onCreate }: GroupFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const ok = onCreate(name);
    if (ok) {
      setName("");
      setError(null);
    } else {
      setError("Escribe un nombre válido para el grupo.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sm-card min-w-0 p-4 sm:p-5">
      <label htmlFor="new-group-name" className="sm-label">
        Nuevo grupo
      </label>
      <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          id="new-group-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="p. ej., Viaje a Madrid"
          className="sm-input min-w-0 flex-1"
          autoComplete="off"
        />
        <button type="submit" className="sm-btn-primary shrink-0">
          Crear
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-400">
          {error}
        </p>
      ) : null}
    </form>
  );
}
