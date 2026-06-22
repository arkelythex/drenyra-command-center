# ARKELYTHEX Web Autonomous Optimization — Design

## Strategy

Use an iterative SDD loop:

1. **Discover**: scan changed areas and adjacent high-impact surfaces.
2. **Select**: pick one low-risk, high-value slice.
3. **Implement**: patch a small set of files.
4. **Verify**: run focused tests + type/lint/diff checks.
5. **Record**: save Engram memory and update this plan when patterns change.
6. **Review**: use subagents for independent scans/reviews when multiple lanes are available.

## Optimization lanes

### Lane A — Motion and UX calm-down

Goal: remove decorative Framer Motion wrappers, hover lifts, layout animation, and infinite loops where static UI or CSS `motion-safe` feedback is enough.

Priority surfaces:

- Auth forms and auth page tab chrome.
- Onboarding demo conversation bubbles.
- Cognitive hub artifact and intervention surfaces.
- Dashboard/mobile surfaces already partially optimized.

Design rules:

- Preserve stateful/semantic feedback such as loading spinners and approval status indicators.
- Prefer static markup for layout/chrome.
- Use `motion-safe:*` and reduced-motion fallbacks for remaining CSS animation.

### Lane B — Data fetching and cache stability

Goal: reduce request waterfalls and avoid UI state fragmenting canonical query caches.

Priority surfaces:

- Cognitive hub hooks and nested components.
- Dashboard widgets and mobile/desktop gating.
- Invoice optional surfaces and lazy modals.

Design rules:

- Canonical server lists should have stable query keys scoped by company/country/RUC/tenant where applicable.
- Expensive enrichment should be separate dependent queries or event-triggered hydration.
- Avoid duplicating base fetches when UI expands/collapses.

### Lane C — Bundle and route splitting

Goal: move heavy optional UI, modal flows, and rarely used panels off initial route chunks.

Priority surfaces:

- Auth/onboarding demo player.
- Cognitive artifact renderers.
- Remaining dashboard advanced/mobile surfaces.

Design rules:

- Declare `lazy()` at module scope.
- Never use `fallback={null}` for user-facing dialogs; use accessible `role="status"` where loading can be perceived.
- Keep route-level chunks under budget and document size changes after build.

### Lane D — Token/style correctness

Goal: eliminate broken literal class strings and keep design-token conventions.

Priority surfaces:

- Any `className="... ${tokensToClasses...}"` plain strings.
- Hardcoded radius/blur/shadow where lint requires tokens.

Design rules:

- Use `cn(tokensToClasses.*(...), "...")`.
- Do not replace valid template literals or constants that intentionally compose class strings.

### Lane E — Test baseline hardening

Goal: identify true regressions vs known baseline-red tests and fix only when root cause is clear and scoped.

Known baseline risks:

- `LoginForm.test.tsx` currently fails around stale placeholder and remember-me expectations.
- Full `bun run test:run` is baseline-red across unrelated suites.

Design rules:

- Do not mask failures.
- Prefer tests for changed behavior.
- If a baseline test is unrelated, document it and continue with type/lint/build gates.

## Subagent protocol

- Use explorer agents for independent read-only scans by lane.
- Use reviewer agents before finalizing a large accumulated diff when thread capacity allows.
- Do not let subagents edit files unless a disjoint write set is explicitly assigned.
- Main agent owns integration and verification.

