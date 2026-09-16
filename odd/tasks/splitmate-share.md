# SplitMate Share — Feature Tracker

## Objective

Mobile-first sharing alongside CSV: "Compartir" button builds a formatted
Spanish text summary and opens the native share sheet (navigator.share) with
clipboard fallback. CSV stays for Excel/desktop.

## Decisions (parent, 2026-09-16)

- Keep CSV + add Share (dominant option: different uses, zero conflict).
- Web Share API (no deps, offline, HTTPS/localhost-only — localhost counts as
  secure); fallback clipboard copy with feedback where unavailable.

## Constraints

- No new dependencies. Pure text builder in lib/share.ts + unit tests.
- Spanish share text; English code. No lib/ domain or store changes.

## Checklist

- [x] S1 lib/share.ts: buildShareText(group, participants, expenses, settlement).
- [x] S2 share.test.ts: content lines, empty-settlement variant, formatting. (3 tests)
- [x] S3 ShareButton.tsx + detail wiring next to Exportar CSV. (parent verified placement grep)
- [x] S4 Final: tsc + build + tests green. (37/37: 34 + 3 share)

## Acceptance criteria

1. Mobile tap → native share sheet with readable summary (group, total, balances, settlement lines).
2. Desktop/unsupported → copies the same text with feedback.
3. CSV untouched and working. Suite green (34 + new).

## Progress

- 2026-09-16: Tracker created. S1–S4 DONE via bounded writer, verified by parent. SHARE COMPLETE.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Bounded writer implements S1–S3; parent verifies + S4.
