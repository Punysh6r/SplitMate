// Sticky glass app header: gradient brand mark + wordmark, primary nav.
// Server-safe (no client hooks); mobile-safe via flex-wrap and 44px targets.

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/"
          aria-label="SplitMate — inicio"
          className="flex min-h-[44px] min-w-0 items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-black text-emerald-950 shadow-lg shadow-emerald-500/20"
          >
            S
          </span>
          <span className="truncate text-lg font-bold tracking-tight text-white">
            SplitMate
          </span>
        </Link>
        <nav aria-label="Principal">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Grupos
          </Link>
        </nav>
      </div>
    </header>
  );
}
