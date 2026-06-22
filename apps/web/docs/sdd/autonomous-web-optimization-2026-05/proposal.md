# ARKELYTHEX Web Autonomous Optimization — Proposal

## Status

Active, iterative, small-change SDD track for `apps/web`.

## Intent

Continue optimizing ARKELYTHEX Web for speed, cleaner UX, calmer motion, safer cache behavior, and lower bundle/runtime cost without changing fiscal correctness, tenant/company/RUC scoping, audit trails, public contracts, database schemas, or money logic.

## Current evidence and guidance

- React docs: use `lazy` at module scope with `Suspense`; use `useTransition` for non-blocking UI updates, not controlled inputs; React Compiler reduces the need for manual memoization, so memoize only proven expensive calculations.
- TanStack Query docs: request waterfalls are a common performance footgun; keep canonical server-list caches stable and move expensive enrichment into dependent queries where appropriate.
- TanStack Router docs: prefer fine-grained subscriptions/selectors to avoid unnecessary route-state re-renders.
- web.dev: honor `prefers-reduced-motion` and remove non-essential movement for users who request reduced motion.
- Vite/build evidence from the latest cycle: `bun run build && bun run check:bundle` passed with total JS around `2079.56 KB` and max chunk around `275.62 KB`.

## Scope

### In scope

- Apps Web UI and client hooks in `src/features/*`, `src/components/*`, styles, and focused tests.
- Code splitting/lazy loading for heavy optional UI.
- Removal or reduction of decorative/awkward motion.
- TanStack Query cache-key stability and request-waterfall reduction.
- Literal class/token placeholder cleanup.
- Test and verification hardening for changed behavior.
- Documentation of decisions and measurable results.

### Out of scope unless explicitly planned

- SUNAT/UBL/IGV/SIRE fiscal behavior changes.
- Money arithmetic changes.
- Public API contract changes.
- Database schema/migration changes.
- Broad rewrites of feature flows.
- Production credential/config changes.

## Guardrails

- Preserve company/RUC/tenant context in every query/mutation/navigation/export path.
- No `any`; use precise types, `unknown`, or justified generics.
- No raw number/floating money logic.
- Avoid broad rewrites; use reversible slices.
- For every changed slice, run narrow checks first, then broader checks when risk warrants it.
- Keep Engram memories after decisions, bug fixes, architecture choices, and session summaries.

## Success criteria

- `bun run typecheck` passes.
- `bun run lint` passes.
- `git diff --check` passes.
- `bun run build && bun run check:bundle` passes after each larger wave.
- Targeted Vitest files for changed behavior pass or baseline failures are documented with evidence.
- Bundle budget remains under `350 KB` max chunk and `3500 KB` total JS.
- No new tenant/RUC/fiscal/money regressions.

