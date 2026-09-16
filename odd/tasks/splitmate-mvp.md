# SplitMate MVP — Feature Tracker

## Objective

Build SplitMate MVP: web app to split expenses among friends, flatmates, and trip groups.
Next.js + React + TypeScript + Tailwind + GSAP, localStorage persistence, deterministic
settlement logic in integer cents. No AI APIs, no real payments, no bank data.

## Problem

Small groups need a simple, fast, good-looking way to track shared expenses and answer
"who pays whom to settle up" with the fewest transfers possible.

## Why

Academic demo (class presentation, online deploy, seed data) with real day-to-day utility
and monetization potential later.

## Scope (MVP)

- Groups: create, rename, delete, add participants, group summary.
- Expenses: description, amount, payer, involved participants, date, currency.
  Validate amounts (finite, >= 0 where applicable).
- Balances: paid per person, owed share, net balance, minimal settlement transfers.
- History: list all expenses, filter by participant and date, edit, delete.
- Export: group summary as CSV.
- Design: fintech style, dark mode, stat cards, simple charts, GSAP animations,
  responsive mobile + desktop.

## Constraints

- Deterministic settlement code only; no paid AI APIs.
- Money in integer cents; no float rounding errors.
- Settlement logic separated from UI (`lib/`), reusable components, TypeScript.
- UI copy in Spanish (target users: Spanish students); code/identifiers/comments in English.
- localStorage (or IndexedDB) persistence for MVP; no real auth, no real payments.

## Checklist

- [x] T1 Scaffold Next.js (App Router) + TS + Tailwind + ESLint in `C:/hf-work/SplitMate`; install `gsap`, `@gsap/react`, `vitest`; `npm run build` passes.
- [x] T2 Domain lib (`lib/`): money-cents helpers, group/expense types, pure CRUD helpers, greedy minimum-transfer settlement, CSV builder. (worker evidence: files created, vitest 16/16, tsc clean; parent read-back of settle.ts OK)
- [x] T3 Unit tests (`vitest`): Madrid trip example (Pablo 120, Ana 80, Luis 40, Marta 0 → Luis→Ana 20, Marta→Pablo 60), uneven splits, rounding remainders, empty/single-member groups. (16/16 green, re-run observed by parent)
- [x] T4 Persistence: localStorage store + React hook + Madrid seed data on first run. (worker: storage.ts + seed.ts + store.tsx; parent read-back of storage.ts OK; build 3 routes; tests still 16/16)
- [x] T5 Groups & participants UI: create/rename/delete group, add/remove participants, group summary cards. (worker: GroupForm, ParticipantList, StatCard, home + detail pages; tsc + build green)
- [x] T6 Expenses UI: create/edit/delete expense, payer + involved selection, filters by participant and date. (worker: store actions + ExpenseForm/List/Filters; tsc + build green)
- [x] T7 Balances dashboard: totals, per-person paid/owed/net, settlement plan ("who pays whom"), CSV export download. (worker: BalanceBar + SettlementList + detail sections + export button; tests 16/16)
- [x] T8 Design polish: dark fintech theme, stat cards, simple charts (CSS/SVG), GSAP entrance/transition animations, responsive check. (worker: Reveal wrapper with useGSAP+matchMedia reduced-motion guard, section-level scoping, hover lift, CSS bar tweens, touch targets; parent read-back of Reveal.tsx OK; tsc + build green)
- [x] T9 Docs & verification: README (install, dev, test, demo script), fresh `npm ci` + `npm test` + `npm run build` all green. (README written; clean-room verification 2026-09-16: npm ci OK, 16/16 tests, eslint clean, build 3 routes; README rewritten to professional level same day: badges, TOC, architecture, privacy, roadmap. Uncommitted.)

## Acceptance criteria (MVP complete when a user can)

1. Create a group. 2. Add participants. 3. Register expenses. 4. See the total.
5. Check balances. 6. See who must pay whom. 7. Export the summary (CSV).
8. Use the app from mobile.

## Progress

- 2026-09-16: Tracker created. T1 DONE (Next 16.3.5 + React 19 + Tailwind v4 + gsap 3.15 + vitest 5.0.1, build green; `@types/node` bumped ^20 → ^24 to satisfy vitest 5 peer dep; package renamed `splitmate`; note: npm rejects capital letters in package names). T2+T3 DONE via bounded writer (lib/types, money, settle, csv + 3 test files, 16/16 green, tsc clean; parent verified settle.ts read-back + vitest re-run). T4+T5 DONE via bounded writer (storage/seed/store + 3 components + layout/home/detail; tsc + build green with 3 routes, tests 16/16; parent verified storage.ts read-back). Accepted deviation: AppState = {groups, participants, expenses: GroupExpense[]} (GroupExpense extends Expense with groupId) — original spec left participant names and group-expense link homeless; lib/ untouched. Known caveat: hydration warning possible after data is stored (client first render vs SSR seed); harmless, recovers client-side. T6+T7 DONE via bounded worker (expense CRUD in store, 5 components, detail page extended; tsc + build green, tests 16/16; parent verified comma-decimal parsing + CSV wiring via grep). T8 DONE via bounded worker (Reveal + responsive; parent verified Reveal.tsx canonical pattern). T9 DONE 2026-09-16 (README + clean-room npm ci/test/lint/build all green). MVP COMPLETE.

## Verification evidence

- (pending) `npm test`, `npm run build` outputs.

## Next step

- MVP complete. Optional follow-ups: present in class (demo script in README), deploy to Vercel, then pick v2 scope.
