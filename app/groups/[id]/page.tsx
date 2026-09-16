"use client";

// Group detail dashboard: editable name, participant management, summary
// stat band, expenses (create/edit/delete + participant/date filters),
// per-person balances with settlement plan, and CSV export download.
// Presentational redesign; store callbacks and signatures unchanged.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { notFound, useParams } from "next/navigation";
import BalanceBar from "@/components/BalanceBar";
import BizumGuide from "@/components/BizumGuide";
import ExpenseFilters, { EMPTY_EXPENSE_FILTERS } from "@/components/ExpenseFilters";
import type { ExpenseFilterValue } from "@/components/ExpenseFilters";
import ExpenseForm from "@/components/ExpenseForm";
import type { ExpenseFormDraft } from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ScanTicket from "@/components/ScanTicket";
import ParticipantList from "@/components/ParticipantList";
import SettlementList from "@/components/SettlementList";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import { buildGroupCsv } from "@/lib/csv";
import { buildShareText } from "@/lib/share";
import { formatEUR } from "@/lib/money";
import { prefersReducedMotion, registerMotionPlugins } from "@/lib/motion";
import { computeSettlement } from "@/lib/settle";
import type { GroupExpense } from "@/lib/storage";
import type { SettlementResult } from "@/lib/types";
import { useSplitMate } from "@/lib/store";

registerMotionPlugins();

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const {
    getGroup,
    getGroupParticipants,
    getGroupExpenses,
    renameGroup,
    addParticipant,
    removeParticipant,
    canRemoveParticipant,
    addExpense,
    updateExpense,
    deleteExpense,
    updateParticipantTag,
    updateParticipantPhone,
  } = useSplitMate();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanPrefill, setScanPrefill] = useState<GroupExpense | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilterValue>({ ...EMPTY_EXPENSE_FILTERS });
  const pageRef = useRef<HTMLElement>(null);

  // Scroll-in reveals for the dashboard sections. Initial hidden state is
  // applied via gsap.set (never CSS), so no-JS / reduced-motion users see
  // everything statically. Triggers die with the component via useGSAP.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const root = pageRef.current;
      if (!root) return;
      const sections = gsap.utils.toArray<HTMLElement>(".motion-section", root);
      if (sections.length === 0) return;
      gsap.set(sections, { opacity: 0, y: 24 });
      ScrollTrigger.batch(sections, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.08,
              overwrite: true,
            },
          ),
      });
    },
    { scope: pageRef },
  );

  const group = getGroup(groupId);
  if (!group) notFound();

  const participants = getGroupParticipants(groupId);
  const expenses = getGroupExpenses(groupId);

  let settlement: SettlementResult;
  try {
    settlement = computeSettlement(expenses, group.participantIds);
  } catch {
    settlement = { totalCents: 0, balances: [], transfers: [] };
  }
  const totalCents = settlement.totalCents;

  const participantName = (id: string): string =>
    participants.find((participant) => participant.id === id)?.name ?? id;

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.participantId && !expense.involvedIds.includes(filters.participantId)) {
      return false;
    }
    if (filters.from && expense.date < filters.from) return false;
    if (filters.to && expense.date > filters.to) return false;
    return true;
  });

  const editingExpense = editingExpenseId
    ? (expenses.find((expense) => expense.id === editingExpenseId) ?? null)
    : null;

  const expenseCount = expenses.length;
  const participantCount = participants.length;

  // Re-measure trigger positions after data-driven layout changes.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [expenseCount, participantCount]);

  const saveName = () => {
    if (renameGroup(groupId, draft)) {
      setIsEditing(false);
      setDraft("");
    }
  };

  const handleCreateExpense = (expenseDraft: ExpenseFormDraft) => {
    const id = addExpense(groupId, expenseDraft);
    if (id) {
      setShowExpenseForm(false);
      setScanPrefill(null);
    }
  };

  const openScanner = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setScanPrefill(null);
    setShowScanner(true);
  };

  const handleScanConfirm = (result: { merchant: string; totalCents: number }) => {
    // Prefill the normal create form (two review layers: scanner + form).
    // Shape matches ExpenseForm `initial` (GroupExpense) exactly.
    setScanPrefill({
      id: `ocr-${Date.now()}`,
      groupId,
      description: result.merchant,
      amountCents: result.totalCents,
      payerId: participants[0]?.id ?? "",
      involvedIds: participants.map((participant) => participant.id),
      date: new Date().toISOString().slice(0, 10),
      currency: "EUR",
    });
    setShowScanner(false);
    setEditingExpenseId(null);
    setShowExpenseForm(true);
  };

  const handleUpdateExpense = (expenseDraft: ExpenseFormDraft) => {
    if (editingExpenseId && updateExpense(editingExpenseId, expenseDraft)) {
      setEditingExpenseId(null);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (editingExpenseId === expenseId) setEditingExpenseId(null);
    deleteExpense(expenseId);
  };

  const handleExport = () => {
    const csv = buildGroupCsv(group, participants, expenses, settlement);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `splitmate-${groupId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main ref={pageRef} className="flex min-w-0 flex-col gap-6">
      <Link
        href="/"
        className="inline-flex min-h-[44px] w-fit items-center text-sm font-medium text-emerald-300 hover:text-emerald-200"
      >
        ← Volver a grupos
      </Link>

      {isEditing ? (
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="group-name" className="sm-label">
            Nombre del grupo
          </label>
          <input
            id="group-name"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="sm-input"
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveName} className="sm-btn-primary">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="sm-btn-ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h1 className="min-w-0 flex-1 break-words text-3xl font-bold tracking-tight text-white">
            {group.name}
          </h1>
          <button
            type="button"
            onClick={() => {
              setDraft(group.name);
              setIsEditing(true);
            }}
            className="sm-btn-ghost shrink-0"
          >
            Editar nombre
          </button>
        </div>
      )}

      <div className="motion-section min-w-0">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-transparent p-px">
          <div className="grid min-w-0 grid-cols-1 gap-4 rounded-[calc(1rem-1px)] bg-black/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total"
              value={formatEUR(totalCents)}
              sub="Suma de gastos"
              cents={totalCents}
              format={formatEUR}
            />
            <StatCard label="Gastos" value={String(expenses.length)} sub="Registrados" />
            <StatCard
              label="Participantes"
              value={String(participants.length)}
              sub="Miembros del grupo"
            />
            <StatCard
              label="Transferencias"
              value={String(settlement.transfers.length)}
              sub="Pagos para saldar"
            />
          </div>
        </div>
      </div>

      <div className="motion-section min-w-0">
        <div className="min-w-0">
          <p className="sm-eyebrow">Participantes</p>
          <div className="mt-3 min-w-0">
            <ParticipantList
              group={group}
              participants={participants}
              onAdd={(name) => addParticipant(groupId, name)}
              onRemove={(participantId) => removeParticipant(groupId, participantId)}
              canRemove={(participantId) => canRemoveParticipant(groupId, participantId)}
              onTagChange={(participantId, rawTag) =>
                updateParticipantTag(participantId, rawTag)
              }
              onPhoneChange={(participantId, rawPhone) =>
                updateParticipantPhone(participantId, rawPhone)
              }
            />
          </div>
        </div>
      </div>

      <div className="motion-section min-w-0">
        <div className="min-w-0">
          <p className="sm-eyebrow">Gastos</p>
          <section aria-label="Gastos" className="sm-card mt-3 min-w-0 p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <h2 className="sm-section-title">Gastos</h2>
              {!showExpenseForm && !editingExpense && !showScanner ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openScanner}
                    disabled={participants.length === 0}
                    title={
                      participants.length === 0
                        ? "Añade participantes antes de registrar gastos"
                        : "Escanear un ticket para rellenar el gasto"
                    }
                    className="sm-btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Escanear ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanPrefill(null);
                      setShowExpenseForm(true);
                    }}
                    disabled={participants.length === 0}
                    title={
                      participants.length === 0
                        ? "Añade participantes antes de registrar gastos"
                        : "Registrar un gasto"
                    }
                    className="sm-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Nuevo gasto
                  </button>
                </div>
              ) : null}
            </div>

            {participants.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">
                Añade participantes al grupo para empezar a registrar gastos.
              </p>
            ) : null}

            {showScanner ? (
              <ScanTicket
                onConfirm={handleScanConfirm}
                onCancel={() => setShowScanner(false)}
              />
            ) : null}

            {showExpenseForm ? (
              <ExpenseForm
                key={scanPrefill ? scanPrefill.id : "new-expense"}
                members={participants}
                initial={scanPrefill}
                onSubmit={handleCreateExpense}
                onCancel={() => {
                  setShowExpenseForm(false);
                  setScanPrefill(null);
                }}
              />
            ) : null}

            {editingExpense ? (
              <ExpenseForm
                key={editingExpense.id}
                members={participants}
                initial={editingExpense}
                onSubmit={handleUpdateExpense}
                onCancel={() => setEditingExpenseId(null)}
              />
            ) : null}

            <ExpenseFilters value={filters} members={participants} onChange={setFilters} />

            <ExpenseList
              expenses={filteredExpenses}
              participantName={participantName}
              onEdit={(expense) => {
                setShowExpenseForm(false);
                setShowScanner(false);
                setScanPrefill(null);
                setEditingExpenseId(expense.id);
              }}
              onDelete={handleDeleteExpense}
            />
          </section>
        </div>
      </div>

      <div className="motion-section min-w-0">
        <div className="min-w-0">
          <p className="sm-eyebrow">Saldos</p>
          <section aria-label="Saldos" className="sm-card mt-3 min-w-0 p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <h2 className="sm-section-title">Saldos</h2>
              <div className="flex shrink-0 flex-wrap gap-2">
                <ShareButton
                  text={buildShareText(group, participants, expenses, settlement)}
                />
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={expenses.length === 0}
                  title={
                    expenses.length === 0
                      ? "Registra un gasto antes de exportar"
                      : "Descargar el resumen en CSV"
                  }
                  className="sm-btn-ghost shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            {settlement.balances.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                Todavía no hay saldos que mostrar.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-white/10">
                {settlement.balances.map((balance) => (
                  <BalanceBar
                    key={balance.participantId}
                    name={participantName(balance.participantId)}
                    paidCents={balance.paidCents}
                    owedCents={balance.owedCents}
                    netCents={balance.netCents}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="motion-section min-w-0">
        <div className="min-w-0">
          <p className="sm-eyebrow">Liquidación</p>
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-transparent p-px">
            <section
              aria-label="Liquidación"
              className="min-w-0 rounded-[calc(1rem-1px)] bg-black/60 p-4 sm:p-5"
            >
              <h2 className="text-xl font-bold tracking-tight text-white">Liquidación</h2>
              <p className="mt-1 text-sm text-slate-400">
                El plan mínimo de pagos para dejar todas las cuentas a cero.
              </p>
              <BizumGuide />
              <SettlementList
                transfers={settlement.transfers}
                participantName={participantName}
                groupName={group.name}
                creditorTagFor={(participantId) =>
                  participants.find((p) => p.id === participantId)?.revolutTag ?? null
                }
                creditorPhoneFor={(participantId) =>
                  participants.find((p) => p.id === participantId)?.phone ?? null
                }
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
