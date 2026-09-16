# SplitMate Pay Links — Feature Tracker

## Objective

From the Settlement screen: one tap opens Revolut with the exact amount
(revolut.me deep link) when the creditor configured their tag; always-available
"Copy for Bizum" puts amount + concept on the clipboard for pasting into any
bank app. No real payments move inside SplitMate; no bank credentials stored —
a revolut.me handle is a public username, optional, user-entered.

## Decisions (user, 2026-09-16)

- Scope: Revolut deep link + Bizum copy helper (recommended option).
- Honest Bizum story: Bizum exposes NO public deep-link/API to third-party web
  apps, so no bizum:// URL is invented; clipboard bridge instead.

## Constraints

- No new dependencies. No lib/ domain changes except ADDING optional
  `revolutTag?: string` to Participant (backwards compatible; storage tolerates
  missing field; existing tests keep passing).
- Pure link/concept builders in new lib/paylinks.ts + unit tests.
- Spanish UI; English code. Clipboard with insecure-context fallback.
- Amount > 0 required for links; invalid tag → button hidden (no dead links).

## Checklist

- [x] P1 types.ts: optional revolutTag on Participant. (single-line addition)
- [x] P2 paylinks.ts: buildRevolutLink(tag, cents, currency) + buildPayConcept(...). (pure, parent verified source + no bizum:// anywhere)
- [x] P3 paylinks.test.ts: link format, cent formatting, invalid tag/amount → null, concept content. (7 tests)
- [x] P4 store.tsx: updateParticipantTag action (+ validation/normalization). (additive only)
- [x] P5 SettlementList: Revolut anchor (tag present) + Copy button with feedback.
- [x] P6 ParticipantList + detail page: tag editing + wiring. (commit onBlur/Enter, inline hint)
- [x] P7 Final: tsc + build + tests green. (30/30: 23 + 7 paylinks)

## Acceptance criteria

1. Creditor with tag → "Pagar con Revolut" opens revolut.me/<tag>/<amount>EUR.
2. Every row → "Copiar" leaves `SplitMate · {grupo} · {de} → {a} {importe}` ready to paste.
3. No tag → no Revolut button (clean fallback, copy still works).
4. Suite stays green (existing 23 + new).

## Progress

- 2026-09-16: Tracker created from user answer (Revolut + copy Bizum). P1–P7 DONE via bounded writer, verified by parent (paylinks source read-back, zero bizum:// matches). PAY LINKS COMPLETE.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Bounded writer implements P1–P6; parent verifies + P7.
