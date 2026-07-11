<!-- markdownlint-disable MD013 -->

# Tasks — Drenyra Frontend Command Center Reset

## Review workload forecast

- Chained PRs recommended: Yes for the full reset.
- User-selected strategy: aggressive single PR default.
- Effective guardrail: one PR per slice unless estimated diff exceeds 600 changed lines, touches fiscal mutation/approval/SUNAT/payment behavior, or mixes unrelated areas.
- 600-line budget risk: High for shell, home, and legacy deletion slices.
- Decision needed before apply: No for planning; Yes before each implementation slice that exceeds 600 lines or deletes routes.

## FE0 — Frontend inventory and retirement map

### PR 0.1 — Inventory command-center surface ✅

- [x] Map `apps/web/src/routes` into keep/refactor/wrap/quarantine/delete.
- [x] Map `apps/web/src/features` into command-center-native, legacy module, duplicate AI/chat, demo/mock, or shared utility.
- [x] Map shell/layout components: `MainLayout`, `Sidebar`, `TopBar`, `FiscalInspector`, `AgenticLayout`, `AgenticSidebar`, `RightPanel`, command palette.
- [x] Map shared UI impact in `apps/web/src/components/ui` and `packages/ui/src`.
- [x] Produce `openspec/changes/drenyra-frontend-command-center-reset/retirement-map.md`.

### PR 1.1 — Promote shell foundation

- [x] Made AgenticLayout the default shell for non-public routes in `__root.tsx`.
- [x] Removed duplicate AgenticLayout from `/drenyra` route to avoid nesting.
- [x] Updated test mocks: AgenticLayout replaces MainLayout mock.
- [x] All route smoke tests pass (5/5).
- [x] All routing tests pass (5/5).

### PR 1.2 — Outcome navigation

- [ ] Replace module-first sidebar items with outcome-first navigation.

### PR 1.3 — Command entry

- [ ] Align command palette with accounting actions.

## FE1 — Command Center shell reset

### PR 1.1 — Promote shell foundation

- [ ] Make the agentic shell the default authenticated layout through `src/routes/__root.tsx` or a narrow adapter.
- [ ] Preserve legacy route rendering inside the center workspace.
- [ ] Keep right inspector optional and contextual.
- [ ] Ensure mobile layout has safe fallback navigation.

### PR 1.2 — Outcome navigation

- [ ] Replace module-first sidebar items with outcome-first navigation.
- [ ] Move legacy modules to command palette or compatibility section.
- [ ] Show company/RUC/period scope near the shell header or workspace selector.
- [ ] Add tests for primary navigation and active route states.

### PR 1.3 — Command entry

- [ ] Align command palette with accounting actions, not only route search.
- [ ] Add safe command metadata: scope required, risk level, approval requirement, feature availability.
- [ ] Do not import heavy feature modules in the shell first-load path.

## FE2 — Accounting Inbox home

### PR 2.1 — Inbox model

- [ ] Define strict TypeScript models for critical tasks, due dates, blockers, suggestions, active missions, and approvals.
- [ ] Derive status/risk/action types from const objects.
- [ ] Keep fiscal scope fields required: organization/company/RUC/period where applicable.

### PR 2.2 — Inbox UI

- [ ] Replace `/` default experience with Accounting Inbox.
- [ ] Keep `/dashboard` as secondary analytics view or compatibility route.
- [ ] Add critical, due soon, suggested by Drenyra, active missions, and approvals sections.
- [ ] Add accessible empty/loading/error states.

### PR 2.3 — Inbox data integration

- [ ] Use TanStack Query with scoped keys.
- [ ] Avoid mock data fallback in production hooks.
- [ ] Keep demo fixtures in test/story/demo-only modules.

## FE3 — Mission workspace and Agent Timeline

### PR 3.1 — Mission primitives

- [ ] Add mission status constants and types.
- [ ] Add mission header, progress, blockers, artifacts, actions, and timeline components.
- [ ] Ensure all mission actions expose risk and approval state.

### PR 3.2 — Monthly close flagship

- [ ] Reframe `cierre-mensual` as the flagship mission workspace.
- [ ] Show import, SUNAT validation, reconciliation, observed expenses, IGV/Renta calculation, management report, and export/declaration readiness.
- [ ] Link each step to evidence or blocked reason.

### PR 3.3 — Timeline evidence

- [ ] Add timeline events for agent work, validations, inconsistencies, classifications, reviews, approvals, exports, and archival.
- [ ] Connect high-risk timeline events to inspector panels.
- [ ] Add tests for status transitions and blocked states.

## FE4 — Evidence Inspector and Fiscal Risk Layer

### PR 4.1 — Inspector consolidation

- [ ] Consolidate `FiscalInspector`, `RightPanel`, and artifact sidebar concepts into one evidence inspector model.
- [ ] Support source document, XML/PDF/CDR, accounting diff, fiscal validation, policy gate, audit, and reversal panels.
- [ ] Keep large artifact payloads in server/query state, not duplicated shell state.

### PR 4.2 — Risk semantics

- [ ] Define shared risk constants: low, medium, high, critical.
- [ ] Apply risk consistently across inbox, mission, tables, inspector, and approvals.
- [ ] Ensure risk is not color-only; include labels and explanations.

### PR 4.3 — Approval and reversal affordances

- [ ] Block critical actions without explicit human approval.
- [ ] Show reviewer, timestamp, rationale, trace ID, and reversal path after approval.
- [ ] Add tests for blocked high-risk actions.

## FE5 — Client 360 and Accounting Skills

### PR 5.1 — Client 360 IA

- [ ] Align `firm/clients` routes with Client 360: summary, comprobantes, banks, taxes, reports, evidence, agent history.
- [ ] Show company, RUC, regime, active period, completion, risk, and evidence state.
- [ ] Link Client 360 to missions and Accounting Inbox.

### PR 5.2 — Accounting Skills model

- [ ] Define visible skill/rule cards for fiscal and client-specific accounting rules.
- [ ] Show scope, owner, source, updated date, approval state, and affected workflows.
- [ ] Prevent skills from applying outside their fiscal/company/RUC/period scope.

## FE6 — Performance, accessibility, and design system hardening

### PR 6.1 — Design token cleanup

- [ ] Convert new UI to semantic token classes and design-system primitives.
- [ ] Avoid raw hex colors and arbitrary CSS variable classes in new components.
- [ ] Keep chart/library CSS variable escape hatches isolated as constants.

### PR 6.2 — React 19 and component API cleanup

- [ ] Avoid new boolean-prop proliferation; use composition or explicit variants.
- [ ] Avoid manual memoization unless profiling proves it.
- [ ] Avoid `forwardRef` in new components unless third-party interop requires it.
- [ ] Replace copied legacy patterns during touched-area refactors.

### PR 6.3 — Bundle and accessibility gates

- [ ] Lazy-load compatibility routes and heavy charts/tables/PDF previews.
- [ ] Add keyboard/focus tests for command palette, inspector, dialogs, and approvals.
- [ ] Run bundle and classname checks.

## Legacy deletion policy

Before deleting a route, feature, component, store, or hook:

- [ ] It appears in `retirement-map.md` with classification `delete` or `quarantine`.
- [ ] No primary navigation, command palette, or mission flow still depends on it.
- [ ] Tests or CodeGraph/reference checks show no active usage.
- [ ] Replacement path is accepted or deletion is explicitly safe.
- [ ] Route generation is refreshed through TanStack Router tooling, not manual `routeTree.gen.ts` edits.

## Verification commands

Run narrow checks per slice, then broader checks before PR:

```bash
bun run typecheck
bun run lint
bun run test:run
bun run build
bun run check:bundle
bun run check:classnames
```

Fiscal/compliance checks are required if a slice touches fiscal behavior, approval gates, SUNAT/SIRE, money, payment, or tax assumptions:

```bash
bun run compliance:sire-gate
bun run compliance:sire-repro
```

## Done criteria

- [ ] Accounting Inbox is the default authenticated entry point.
- [ ] Monthly close exists as a mission workspace with evidence, risk, timeline, and approval state.
- [ ] Right inspector exposes evidence and reversal path for high-risk decisions.
- [ ] Legacy module navigation is removed from primary UX.
- [ ] Legacy surfaces are classified and removed/quarantined only with evidence.
- [ ] New UI follows React 19, TypeScript strictness, Tailwind 4/token discipline, accessibility, and performance guardrails.
- [ ] Verification commands pass for touched slices.
