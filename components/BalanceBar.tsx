// Presentational per-person balance row: name, paid / owed / net amounts
// plus a simple proportional CSS bar (no chart library). Net is emerald when
// >= 0 (creditor) and rose when negative (debtor).

import { formatEUR } from "@/lib/money";

interface BalanceBarProps {
  name: string;
  paidCents: number;
  owedCents: number;
  netCents: number;
}

export default function BalanceBar({ name, paidCents, owedCents, netCents }: BalanceBarProps) {
  const total = paidCents + owedCents;
  const paidShare = total > 0 ? Math.round((paidCents / total) * 100) : 0;
  const isCreditor = netCents >= 0;

  return (
    <div className="min-w-0 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate font-medium text-slate-100">{name}</span>
        <span
          className={`shrink-0 font-semibold tabular-nums ${isCreditor ? "text-emerald-300" : "text-rose-400"}`}
        >
          {formatEUR(netCents)}
        </span>
      </div>
      <p className="mt-0.5 truncate text-sm tabular-nums text-slate-400">
        Pagado: {formatEUR(paidCents)} · Corresponde: {formatEUR(owedCents)} · Saldo:{" "}
        <span className={isCreditor ? "text-emerald-300" : "text-rose-400"}>
          {formatEUR(netCents)}
        </span>
      </p>
      <div
        role="presentation"
        aria-hidden="true"
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            isCreditor ? "bg-emerald-400" : "bg-rose-400"
          }`}
          style={{ width: `${paidShare}%` }}
        />
      </div>
    </div>
  );
}
