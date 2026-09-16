# SplitMate Bizum Flow — Feature Tracker

## Objective

Maximum honest Bizum collection flow (no deep link exists for P2P): creditor
mobile per participant (local-only) + copy button including the number +
3-step micro-guide in Settlement. No PayPal (user chose Bizum-only).

## Decisions (user, 2026-09-16)

- Scope: phone + copy/guide, no PayPal.me.
- Research-backed: Bizum third-party integrations are e-commerce-only
  (Redsys/Worldline/PPRO); P2P lives inside bank apps keyed by mobile number.

## Constraints

- Phone is personal data: OPTIONAL, editable, deletable, stored ONLY in
  localStorage (never sent anywhere — app has no backend). Microcopy states this.
- No new dependencies. Spanish UI; English code.
- Backwards compatible: existing buildPayConcept callers keep working.

## Checklist

- [x] B1 types.ts: optional phone on Participant; paylinks: normalize/validate phone, concept includes number. (parent verified format grep)
- [x] B2 paylinks.test.ts: phone normalize/validate + concept with/without number. (4 tests)
- [x] B3 store.tsx: updateParticipantPhone action.
- [x] B4 ParticipantList phone input + SettlementList phone display/copy + BizumGuide + detail wiring.
- [x] B5 Final: tsc + build + tests green. (34/34: 30 + 4 phone)

## Acceptance criteria

1. Creditor with phone → copied text includes `Bizum al {number}` + amount + concept.
2. No phone → copy works as before (no dangling placeholders).
3. Guide visible in Settlement; local-only privacy note present.
4. Suite green (30 + new).

## Progress

- 2026-09-16: Tracker created from user answer (Bizum-only flow). B1–B5 DONE via bounded writer, verified by parent. BIZUM FLOW COMPLETE. Refinement same day (user request): copy button now copies ONLY the normalized number and only renders when a valid phone exists; guide step 1 updated; tsc/test(34/34)/build green.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Bounded writer implements B1–B4; parent verifies + B5.
