// Reusable centered empty state: icon, Spanish title/hint, optional action.

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="sm-card flex min-w-0 flex-col items-center px-6 py-10 text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-300"
      >
        {icon}
      </div>
      <p className="mt-4 break-words text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-sm break-words text-sm text-slate-400">{hint}</p>
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
