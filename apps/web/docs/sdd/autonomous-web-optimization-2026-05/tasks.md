# ARKELYTHEX Web Autonomous Optimization — Tasks

## Phase 0 — Stabilize current optimization wave

- [x] Consult current official/public guidance for React, TanStack Query/Router, Vite, and reduced motion.
- [x] Record local SDD proposal/design/tasks in `apps/web/docs/sdd/autonomous-web-optimization-2026-05`.
- [x] Wait for active explorer subagents and fold findings into this task list.
- [x] Run a final local reviewer pass before commit/PR; sub-agent spawn was unavailable because the agent thread limit was reached.

## Phase 1 — Complete motion cleanup

- [x] Dashboard shell and summary motion wrappers.
- [x] Mobile dashboard summary motion wrappers.
- [x] AuthLayout static wrappers.
- [x] Onboarding DemoCard static wrapper.
- [x] Onboarding DemoPlayer static overlay/outcome and CSS typing pulse.
- [x] ConversationBubble: replace Framer entrance with static or CSS-only reveal, preserving visible gating.
- [x] Auth forms: reduce submit button hover transforms where behavior is unchanged.
- [x] Cognitive artifacts: review remaining infinite/looping motion and keep only semantic state.
- [x] AuthLayout status pulse honors reduced-motion.
- [x] Onboarding DemoPlayer smooth-scroll honors reduced-motion and timer churn is reduced.
- [x] DemoShowcase no longer keeps an unused AnimatePresence wrapper around static DemoPlayer.

## Phase 2 — Cache and waterfall cleanup

- [x] Split cognitive accounting run base-list cache from optional control-plane hydration.
- [x] Stabilize cognitive control-plane run-id query key signature.
- [x] Memoize CostDashboard derived agent/trend/last-updated values.
- [ ] Scan dashboard widget hooks for nested query waterfalls.
- [ ] Scan cognitive hub child components for parent/child request waterfalls.
- [ ] Add cache-key tests where UI state should not refetch canonical server lists.

## Phase 3 — Bundle and code-splitting

- [x] Lazy-load invoice board optional surfaces.
- [x] Split create-invoice form subsections and native date fields.
- [x] Lazy-load dashboard optional mobile/dialog surfaces.
- [ ] Evaluate lazy-loading onboarding demo player if it is not already route-isolated.
- [ ] Evaluate lazy-loading cognitive artifact renderers behind registry boundaries.
- [ ] Track `bun run build && bun run check:bundle` after each bundle-affecting slice.

## Phase 4 — Token/style correctness

- [x] Fix literal token placeholders in dashboard/cognitive surfaces.
- [x] Fix literal token placeholders in auth/onboarding surfaces.
- [x] Add a lightweight scripted check or lint pattern for `className="... ${...}"` anti-patterns.
- [ ] Fix token helper usage found by future scans without replacing valid template literals.

## Phase 5 — Baseline tests and quality gates

- [x] Root-cause `LoginForm.test.tsx` baseline failures in a separate scoped task.
- [x] Root-cause and stabilize remaining stale full-suite web baseline failures.
- [x] Document known full-suite failures with current counts before PR.
- [x] Run final `typecheck`, `lint`, `build`, `check:bundle`, and targeted/full tests.

## Always-on verification checklist

- [x] `git diff --check`
- [x] `bun run typecheck`
- [x] `bun run lint`
- [x] Narrow `bun run test:run -- <changed tests>`
- [x] Full `bun run test:run`
- [x] `bun run build && bun run check:bundle` after bundle/routing changes
