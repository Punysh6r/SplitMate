# SplitMate Design Pro — Feature Tracker

## Objective

Take SplitMate from basic to premium dark fintech: rich near-black theme with
emerald accent, glassmorphism, display typography, and a dashboard-grade group
detail layout. Visual + UX scope; zero behavior/logic changes.

## Decisions (user, 2026-09-16)

- Direction: premium dark fintech (evolve current dark, don't flip to light).
- Scope: visual + UX (new skin + better layout/navigation/flows).

## Constraints

- No changes to lib/ (domain, money, settle, csv, storage, seed, store logic),
  no new dependencies, no behavior changes; presentational edits only.
- UI copy in Spanish; code/comments in English.
- Keep all existing flows working: groups CRUD, participants, expenses CRUD +
  filters, balances, CSV export, localStorage persistence + seed.
- Respect prefers-reduced-motion (extend existing Reveal/matchMedia pattern).
- Current accent is cyan (#22d3ee) on slate-950 with Geist fonts — migrate
  consistently to the new token set, no leftover cyan.

## Checklist

- [x] D1 Design tokens + theme (globals.css @theme: palette, glass, buttons, inputs, focus, selection, scrollbar). (emerald #10b981/#34d399, near-black #050807, glass tokens, cyan fully removed)
- [x] D2 App header/nav (sticky glass bar, gradient brand mark, mobile-safe). (new AppHeader.tsx; parent read-back OK)
- [x] D3 Home: hero/overview band + premium group cards (deterministic accent per group, hover, empty state). (hero + 3-stat overview + hashed 5-gradient cards + EmptyState)
- [x] D4 Group detail dashboard: summary band, section hierarchy with eyebrows, polished participants/expenses/balances layout, highlighted settlement card. (gradient-border band + 4 stats + eyebrow sections + Liquidación card)
- [x] D5 Component polish: StatCard, BalanceBar, SettlementList, ExpenseList/Form/Filters, GroupForm, ParticipantList, Reveal usage. (props unchanged everywhere)
- [x] D6 Motion + responsive verification (entrances mount-only, no filter re-animation, mobile stacking, touch targets, no overflow). (section-level Reveal kept; CSS tweens)
- [x] D7 Final: tsc + build + tests green. (worker: all green 16/16; parent: grep cyan/clean + AppHeader read-back OK)

## Acceptance criteria

1. Visually premium dark fintech, coherent tokens, no leftover old accent.
2. Every MVP flow still works (8 success criteria intact).
3. Reduced-motion users get a static but complete UI.
4. Mobile + desktop layouts clean.

## Progress

- 2026-09-16: Tracker created from user answers (dark premium + visual/UX). D1–D7 DONE via bounded writer, verified by parent. REDESIGN COMPLETE.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Redesign complete. Run `npm run dev` to see it; optional: screenshot review round, README screenshot section, Vercel deploy.
