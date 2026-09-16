# SplitMate OCR Tickets — Feature Tracker

## Objective

Scan receipts with free local OCR (Tesseract.js, 100% in-browser, no keys, no
cost): photo/file → merchant + total detection → review step → prefilled
expense form. The premium "wow" feature without breaking MVP constraints.

## Decisions (user, 2026-09-16)

- Engine: Tesseract.js local (Spanish trained data). Stretches the original
  "no AI" rule (OCR is ML) but honors the binding constraint "no paid AI APIs".
- Scope: merchant + total only (no line-item breakdown — too fragile with local OCR).
- Mandatory manual review step before creating the expense (OCR is never 100%).

## Constraints

- New dependency allowed ONLY: tesseract.js (bundled WASM, dynamic import so it
  never touches initial page load; SSR-safe — recognition runs client-side only).
- Spanish UI; English code. No lib/ domain changes except new lib/ocr.ts;
  no store changes (prefill uses existing addExpense draft path).
- Deterministic parsing heuristics in pure lib/ocr.ts + unit tests.
- Reduced-motion respected for progress/result transitions (CSS only is fine).

## Checklist

- [x] O1 Dependency: tesseract.js installed (package.json + lock). (v7.0.0)
- [x] O2 lib/ocr.ts: parseTicketText heuristics (merchant, total) + recognizeTicket (dynamic import, Spanish, progress, terminate). (['spa','eng'], logger→progress, terminate in finally; parent verified no top-level import)
- [x] O3 ocr.test.ts: merchant/total fixtures, comma decimals, no-total case. (7 tests; worker corrected spec typo: 1.234,56 € = 123456 céntimos)
- [x] O4 ScanTicket.tsx: capture/upload → progress → review (editable) → confirm/cancel, error states.
- [x] O5 Detail page: "Escanear ticket" entry → prefilled ExpenseForm. (ghost button + keyed prefill remount; parent verified wiring)
- [x] O6 README OCR section (how it works, first-run model download note, accuracy caveat).
- [x] O7 Final: tsc + build + tests green. (23/23: 16 + 7 ocr; build clean)

## Acceptance criteria

1. Photo of a Spanish receipt prefills merchant + total correctly in the common case.
2. User always reviews/edits before the expense is created.
3. No OCR code in the initial bundle (dynamic import); app works offline after first model fetch except the model CDN fetch itself.
4. Tests cover the parser; suite stays green.

## Progress

- 2026-09-16: Tracker created from user answers (tesseract local + total/merchant). O1–O7 DONE via bounded writer, verified by parent. OCR COMPLETE.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Bounded writer implements O1–O6 (npm install authorized for tesseract.js only); parent verifies + O7.
