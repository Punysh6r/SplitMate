// Reusable fintech stat card: eyebrow label, big tabular value, optional hint.
// When cents + format are both given, the value counts up via AnimatedNumber.

import AnimatedNumber from "@/components/AnimatedNumber";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  /** Integer cents to count up from on mount (requires format). */
  cents?: number;
  /** Formats cents for display (requires cents). */
  format?: (cents: number) => string;
}

export default function StatCard({ label, value, sub, cents, format }: StatCardProps) {
  const animated = typeof cents === "number" && typeof format === "function";
  return (
    <div className="sm-card min-w-0 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald-400/30">
      <p className="sm-eyebrow truncate">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold tabular-nums text-white">
        {animated ? (
          <AnimatedNumber value={cents as number} format={format as (c: number) => string} />
        ) : (
          value
        )}
      </p>
      {sub ? <p className="mt-1 break-words text-sm text-slate-400">{sub}</p> : null}
    </div>
  );
}
