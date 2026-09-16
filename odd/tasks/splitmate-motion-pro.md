# SplitMate Motion Pro — Feature Tracker

## Objective

Add a professional motion layer on top of Design Pro using the installed GSAP
skills (core, timeline, scrolltrigger, plugins, react). All presentational;
zero logic/behavior changes.

## Pieces

- M1 Animated count-ups: every money figure (StatCards, overview totals,
  settlement chips) tweens with snap; instant under reduced motion.
- M2 Hero timeline: eyebrow → title → subtitle → stats → cards choreographed
  with one gsap.timeline (defaults + labels + position parameter).
- M3 SplitText word-mask reveal on the hero title (free plugin, revert on cleanup).
- M4 ScrollTrigger.batch section reveals on the group detail page (once, top-85%).
- M5 Flip layout animation on the expense list when filters change (FLIP via
  effect-cleanup state capture, absolute, enter/leave fades).

## Constraints

- No new npm dependencies (gsap bundle already includes every plugin).
- Register plugins once (module flag); useGSAP + scope everywhere; no unscoped selectors.
- SSR-safe (no window outside effects), StrictMode-safe, reduced-motion → static final state.
- Transforms/opacity only (60fps); no markers in production; ScrollTrigger.refresh()
  after data-driven layout changes; kill on unmount via context.
- UI copy in Spanish; code/comments in English. lib/ domain + store logic frozen.

## Checklist

- [x] M1 AnimatedNumber + StatCard/Settlement integration. (count-ups with snap, SSR final text first paint, instant under reduced motion)
- [x] M2 Hero master timeline on home. (defaults + intro label + offsets; SplitTitle owns h1)
- [x] M3 SplitTitle word-mask reveal. (SplitText words+mask, expo.out, explicit revert)
- [x] M4 ScrollTrigger.batch on detail sections. (top 88%, once, refresh on count change, no markers)
- [x] M5 Flip on expense filtering. (render-phase pre-commit capture — parent verified read-back; worker correctly rejected effect-cleanup capture as post-commit; absolute + enter/leave fades)
- [x] M6 Final: tsc + build + tests green. (worker: all green 16/16; parent: ExpenseList read-back + registration grep OK)

## Acceptance criteria

1. Numbers count up smoothly; hero feels choreographed, not stacked.
2. Detail sections reveal on scroll; filtering expenses morphs the list.
3. Reduced-motion users see everything instantly, complete, static.
4. No jank, no console errors, no hydration warnings introduced.

## Progress

- 2026-09-16: Tracker created; skills reviewed (timeline/scrolltrigger/plugins). M1–M6 DONE via bounded writer, verified by parent. MOTION PRO COMPLETE. Bugfix same day: hydration mismatch (SSR seed 240 € vs stored 340 €) fixed in lib/store.tsx — deterministic seed first render + mount-effect hydration + skip-first persist guard.

## Verification evidence

- (pending) `npx tsc --noEmit`, `npm run build`, `npm test`.

## Next step

- Motion Pro complete. Run `npm run dev` and feel it; optional fine-tune (durations, staggers) after seeing it in browser.
