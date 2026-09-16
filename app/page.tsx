"use client";

// Home: hero overview band, premium group cards, create form, inline rename,
// delete. Presentational redesign; store callbacks and signatures unchanged.

import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import EmptyState from "@/components/EmptyState";
import GroupForm from "@/components/GroupForm";
import Reveal from "@/components/Reveal";
import SplitTitle from "@/components/SplitTitle";
import StatCard from "@/components/StatCard";
import { formatEUR } from "@/lib/money";
import { prefersReducedMotion, registerMotionPlugins } from "@/lib/motion";
import { computeSettlement } from "@/lib/settle";
import { useSplitMate } from "@/lib/store";
import type { Expense } from "@/lib/types";

registerMotionPlugins();

/** Settlement total for a group, or null when stored data is invalid. */
function safeTotalCents(expenses: Expense[], participantIds: string[]): number | null {
  try {
    return computeSettlement(expenses, participantIds).totalCents;
  } catch {
    return null;
  }
}

/** Fixed 5-gradient emerald palette; group ids hash into it deterministically. */
const GROUP_ACCENTS = [
  "from-emerald-400 to-teal-500",
  "from-teal-300 to-emerald-600",
  "from-lime-300 to-emerald-500",
  "from-emerald-300 to-green-600",
  "from-green-400 to-teal-600",
] as const;

/** Hash a group id into the fixed accent palette (stable across renders). */
function accentForGroup(groupId: string): (typeof GROUP_ACCENTS)[number] {
  let hash = 0;
  for (let i = 0; i < groupId.length; i += 1) {
    hash = (hash + groupId.charCodeAt(i)) % GROUP_ACCENTS.length;
  }
  return GROUP_ACCENTS[hash];
}

/** Up to two initials from a group name for the avatar circle. */
function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "S";
}

export default function Home() {
  const {
    groups,
    createGroup,
    renameGroup,
    deleteGroup,
    getGroupExpenses,
  } = useSplitMate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEditing = (groupId: string, currentName: string) => {
    setEditingId(groupId);
    setDraft(currentName);
  };

  const saveEditing = (groupId: string) => {
    if (renameGroup(groupId, draft)) {
      setEditingId(null);
      setDraft("");
    }
  };

  const confirmDelete = (groupId: string, name: string) => {
    if (window.confirm(`¿Eliminar el grupo «${name}» y todos sus gastos?`)) {
      deleteGroup(groupId);
    }
  };

  const heroRef = useRef<HTMLElement>(null);

  // Hero master timeline: eyebrow -> title (owned by SplitTitle, coordinated
  // by position only) -> subtitle -> stats -> cards. Static when reduced.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const root = heroRef.current;
      if (!root) return;
      const select = gsap.utils.selector(root);
      const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.out" } });
      tl.addLabel("intro", 0);
      tl.fromTo(
        select('[data-anim="eyebrow"]'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0 },
        "intro",
      );
      tl.fromTo(
        select('[data-anim="subtitle"]'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0 },
        "intro+=0.1",
      );
      tl.fromTo(
        select('[data-anim="stat"]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.08 },
        "intro+=0.2",
      );
      const cards = select('[data-anim="card"]');
      if (cards.length > 0) {
        tl.fromTo(
          cards,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08 },
          "intro+=0.3",
        );
      }
    },
    { scope: heroRef },
  );

  const totals = groups.map((group) => safeTotalCents(getGroupExpenses(group.id), group.participantIds));
  const grandTotalCents = totals.reduce<number>(
    (sum, total) => (total === null ? sum : sum + total),
    0,
  );
  const expenseCount = groups.reduce<number>(
    (sum, group) => sum + getGroupExpenses(group.id).length,
    0,
  );

  return (
    <main ref={heroRef} className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <p data-anim="eyebrow" className="sm-eyebrow">Tus gastos compartidos</p>
        <SplitTitle
          text="Mis grupos"
          className="mt-2 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl"
        />
        <p
          data-anim="subtitle"
          className="mt-2 max-w-xl break-words text-sm text-slate-400 sm:text-base"
        >
          Crea un grupo, añade participantes y reparte los gastos sin hojas de cálculo.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <div data-anim="stat" className="min-w-0">
          <StatCard
            label="Total repartido"
            value={formatEUR(grandTotalCents)}
            sub="Suma de todos los grupos"
            cents={grandTotalCents}
            format={formatEUR}
          />
        </div>
        <div data-anim="stat" className="min-w-0">
          <StatCard label="Grupos" value={String(groups.length)} sub="Grupos activos" />
        </div>
        <div data-anim="stat" className="min-w-0">
          <StatCard label="Gastos" value={String(expenseCount)} sub="Gastos registrados" />
        </div>
      </div>

      <Reveal delay={0.05} className="min-w-0">
        <GroupForm onCreate={createGroup} />
      </Reveal>

      {groups.length === 0 ? (
        <Reveal className="min-w-0">
          <EmptyState
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title="No tienes grupos todavía"
            hint="Crea tu primer grupo arriba para empezar a dividir gastos."
          />
        </Reveal>
      ) : (
        <section aria-label="Grupos" className="min-w-0">
          <p className="sm-eyebrow">Tus grupos</p>
          <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.map((group) => {
              const expenses = getGroupExpenses(group.id);
              const total = safeTotalCents(expenses, group.participantIds);
              const isEditing = editingId === group.id;
              const accent = accentForGroup(group.id);
              return (
                <li key={group.id} data-anim="card" className="min-w-0">
                  <div className="h-full min-w-0">
                    <div className="sm-card relative flex h-full min-w-0 flex-col gap-3 overflow-hidden p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/10">
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-70 ${accent}`}
                      />
                      {isEditing ? (
                        <div className="flex min-w-0 flex-col gap-2">
                          <label htmlFor={`rename-${group.id}`} className="sm-label">
                            Nombre del grupo
                          </label>
                          <input
                            id={`rename-${group.id}`}
                            type="text"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            className="sm-input"
                            autoComplete="off"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditing(group.id)}
                              className="sm-btn-primary"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="sm-btn-ghost"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 ${accent}`}
                            >
                              {initialsForName(group.name)}
                            </span>
                            <Link
                              href={`/groups/${group.id}`}
                              className="min-w-0 flex-1 break-words text-lg font-semibold tracking-tight text-white hover:text-emerald-300"
                            >
                              {group.name}
                            </Link>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(group.id, group.name)}
                              className="sm-btn-ghost"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(group.id, group.name)}
                              className="sm-btn-ghost"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums text-slate-400">
                        <div className="flex gap-1">
                          <dt>Miembros:</dt>
                          <dd className="font-medium text-slate-200">
                            {group.participantIds.length}
                          </dd>
                        </div>
                        <div className="flex gap-1">
                          <dt>Gastos:</dt>
                          <dd className="font-medium text-slate-200">{expenses.length}</dd>
                        </div>
                        <div className="flex gap-1">
                          <dt>Total:</dt>
                          <dd className="font-medium text-slate-200">
                            {total === null ? "—" : formatEUR(total)}
                          </dd>
                        </div>
                      </dl>
                      <Link
                        href={`/groups/${group.id}`}
                        className="inline-flex min-h-[44px] w-fit items-center text-sm font-medium text-emerald-300 hover:text-emerald-200"
                      >
                        Ver grupo →
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
