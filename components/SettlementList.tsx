// Presentational settlement plan: one row per transfer in the form
// "Deudor → Acreedor: amount". Names resolve through the injected lookup.
// Empty plan renders the settled-up state in Spanish.
//
// Pay links: when the creditor configured a valid Revolut tag, each row
// offers a "Pagar con Revolut" anchor (revolut.me, new tab); rows whose
// creditor has a valid Bizum number offer a "Copiar número" ghost button
// that copies ONLY the number (clipboard-bridge: Bizum exposes no deep link).

"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import EmptyState from "@/components/EmptyState";
import { formatEUR } from "@/lib/money";
import { buildRevolutLink, isValidPhone, isValidTag, normalizePhone } from "@/lib/paylinks";
import type { SettlementTransfer } from "@/lib/types";

interface SettlementListProps {
  transfers: SettlementTransfer[];
  participantName: (id: string) => string;
  /** Legacy: kept for caller compatibility, no longer used in copied text. */
  groupName?: string;
  /** Per-transfer creditor tag lookup by participant id. */
  creditorTagFor?: (participantId: string) => string | null | undefined;
  /** Optional tag map alternative to creditorTagFor (id -> tag). */
  creditorTags?: Record<string, string | null | undefined>;
  /** Per-transfer creditor phone lookup by participant id (Bizum, local-only). */
  creditorPhoneFor?: (participantId: string) => string | null | undefined;
  /** Optional phone map alternative to creditorPhoneFor (id -> phone). */
  creditorPhones?: Record<string, string | null | undefined>;
}

/**
 * Copy text to the clipboard: Clipboard API first, hidden-textarea
 * execCommand('copy') fallback for insecure contexts. Returns success.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function SettlementList({
  transfers,
  participantName,
  creditorTagFor,
  creditorTags,
  creditorPhoneFor,
  creditorPhones,
}: SettlementListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the transient "¡Copiado!" feedback timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  if (transfers.length === 0) {
    return (
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
        }
        title="Cuentas saldadas"
        hint="No hay pagos pendientes en este grupo."
      />
    );
  }

  const resolveTag = (participantId: string): string | null => {
    if (creditorTagFor) return creditorTagFor(participantId) ?? null;
    if (creditorTags) return creditorTags[participantId] ?? null;
    return null;
  };

  const resolvePhone = (participantId: string): string | null => {
    const raw = creditorPhoneFor
      ? (creditorPhoneFor(participantId) ?? null)
      : creditorPhones
        ? (creditorPhones[participantId] ?? null)
        : null;
    if (typeof raw !== "string" || raw === "") return null;
    const normalized = normalizePhone(raw);
    return isValidPhone(normalized) ? normalized : null;
  };

  const handleCopy = async (key: string, text: string) => {
    await copyText(text);
    setCopiedKey(key);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <ul className="mt-2 flex min-w-0 flex-col gap-2">
      {transfers.map((transfer, index) => {
        const key = `${transfer.fromId}-${transfer.toId}-${index}`;
        const fromName = participantName(transfer.fromId);
        const toName = participantName(transfer.toId);
        const creditorTag = resolveTag(transfer.toId);
        const creditorPhone = resolvePhone(transfer.toId);
        const revolutHref =
          creditorTag && isValidTag(creditorTag)
            ? buildRevolutLink(creditorTag, transfer.amountCents, "EUR")
            : null;
        const copied = copiedKey === key;
        return (
          <li
            key={key}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="flex min-w-0 items-center justify-between gap-3">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-sm text-slate-200">
                <span className="min-w-0 truncate">{fromName}</span>
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-emerald-300"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <span className="min-w-0 truncate">{toName}</span>
              </span>
              <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-emerald-300">
                <AnimatedNumber
                  value={transfer.amountCents}
                  format={formatEUR}
                  duration={0.6}
                />
              </span>
            </span>
            {creditorPhone ? (
              <span className="text-xs tabular-nums text-slate-400">
                Bizum: {creditorPhone}
              </span>
            ) : null}
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              {revolutHref ? (
                <a
                  href={revolutHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm-btn-primary shrink-0 !min-h-[2.25rem] px-3 py-1 text-sm"
                >
                  Pagar con Revolut
                </a>
              ) : null}
              {creditorPhone ? (
                <button
                  type="button"
                  onClick={() => handleCopy(key, creditorPhone)}
                  className="sm-btn-ghost shrink-0 !min-h-[2.25rem] px-3 py-1 text-sm"
                >
                  {copied ? "¡Copiado!" : "Copiar número"}
                </button>
              ) : null}
              <span aria-live="polite" className="sr-only">
                {copied ? "Número copiado al portapapeles" : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
