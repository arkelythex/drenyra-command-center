<!-- markdownlint-disable MD013 -->

# Spec — Drenyra Frontend Command Center Reset

## Scope

This spec governs the frontend reset of `apps/web` and shared UI impact in `packages/ui`. It defines product, architecture, UX, fiscal-safety, performance, and migration requirements for replacing legacy frontend surfaces with the Accounting Command Center model.

## Functional requirements

### FR1 — Accounting Command Center shell

The app MUST expose a primary three-panel operating model:

```text
Left: outcome navigation and command entry
Center: active accounting mission / artifact / workflow
Right: evidence, risk, reasoning, approvals, and next actions
```

Acceptance criteria:

- The default authenticated experience starts from accounting work, not a generic dashboard.
- Navigation groups by outcomes: Inbox, Clients/Companies, Missions, Documents/Comprobantes, Banks, Reconciliations, Taxes, SIRE/SUNAT, Reports, Evidence Vault, Agents, Settings.
- Legacy module routes are not primary navigation unless they are still the best user-facing workflow.
- The command palette can discover hidden/compatibility routes without returning them to primary nav.

### FR2 — Accounting Inbox home

The home screen MUST answer:

1. what is critical;
2. what is due soon;
3. what is blocked;
4. what Drenyra can prepare;
5. what requires accountant approval.

Acceptance criteria:

- Critical tasks show company, RUC, fiscal period, due date, risk, and owner.
- Suggested agent actions show expected output, confidence basis, affected records, and required approval.
- Empty/loading/error states teach the next safe accounting action.
- Dashboard charts are secondary and must not hide blockers or due dates.

### FR3 — Mission workspace

Accounting work MUST be modeled as missions, not disconnected pages.

Required mission states:

- queued;
- analyzing;
- requires_review;
- ready_to_approve;
- approved;
- exported_or_sent;
- observed;
- archived_with_evidence.

Acceptance criteria:

- Monthly close is the first flagship mission.
- Missions expose progress, blockers, evidence, risk, timeline, and next actions.
- A mission can open related artifacts without losing accounting context.
- Irreversible actions remain blocked until a human approval gate is satisfied.

### FR4 — Agent Timeline

Every agentic workflow MUST show a timeline of meaningful accounting steps.

Acceptance criteria:

- Timeline events include imported records, validations, inconsistencies, classifications, risk findings, blocked actions, approvals, exports, and archival.
- Each event includes timestamp, actor, source, affected scope, and status when available.
- High-risk events link to evidence or a diff.
- The timeline avoids magical AI wording; it explains concrete work performed.

### FR5 — Evidence Inspector

The right inspector MUST keep proof near decisions.

Acceptance criteria:

- Inspector can show source document, XML, PDF, CDR, accounting entry, policy rule, fiscal validation, risk, trace ID, audit log, and reversal path.
- Inspector supports at least these panel types: thread, diff, agent, evidence, fiscal.
- Recommendations without evidence are visually incomplete or blocked.
- High-risk actions expose approval requirements before action execution.

### FR6 — Fiscal Risk Layer

The UI MUST make fiscal risk visible without becoming noisy.

Required levels:

- low;
- medium;
- high;
- critical.

Acceptance criteria:

- Risk badge semantics are consistent across inbox, missions, tables, inspector, and approvals.
- Risk descriptions explain why the risk exists: no CDR, proveedor no habido, unusual amount, possible non-deductible expense, missing detracción, stale SUNAT data, duplicate document, or unsupported scope.
- Critical risk blocks unsafe action by default.

### FR7 — Client 360 and Accounting Skills

Company/client context MUST become a first-class workspace object.

Acceptance criteria:

- Client 360 shows company name, RUC, regime, fiscal period, accounting completion, risk level, and evidence status.
- Client rules and skills are visible as auditable configuration, not hidden AI memory.
- Client-specific rules show scope, source, owner, last updated, and approval state.
- Rules can be used by agents only when their scope matches organization/company/RUC/period constraints.

### FR8 — Legacy retirement

Every frontend surface MUST be classified before deletion or replacement.

Allowed classifications:

- keep: already aligned with command-center model;
- refactor: useful behavior but wrong UI/architecture;
- wrap: keep as compatibility tool behind command palette;
- quarantine: demo/mock/experimental surface removed from primary UX;
- delete: unused or harmful legacy surface with safe removal evidence.

Acceptance criteria:

- The retirement map includes route, feature, components, stores/hooks, tests, API dependencies, owner, and replacement path.
- No working fiscal workflow is deleted without an accepted replacement or documented compatibility route.
- Generated route files such as `routeTree.gen.ts` are never edited manually.

## Non-functional requirements

### NFR1 — Fiscal safety

- Preserve tenant, organization, company, RUC, fiscal period, SUNAT, UBL, SIRE, IGV, approval, and audit context.
- Do not introduce raw floats for fiscal money display or calculations; use project money/value-object conventions or backend-provided formatted values.
- No unsafe optimistic mutations for fiscal actions.

### NFR2 — React and TypeScript

- Use React 19 patterns; avoid new `forwardRef` APIs unless required by third-party interop.
- Do not add manual `useMemo`/`useCallback` as default optimization; rely on React Compiler unless profiling proves otherwise.
- Use precise TypeScript types; no `any`.
- Prefer const-object-derived types for new status/risk/action enums.

### NFR3 — Styling and design system

- Prefer design-system semantic classes and tokens over one-off colors.
- Avoid raw hex colors and arbitrary CSS variable class names in new UI; if token escape hatches are required, document why.
- Dark mode must be OLED/institutional, not gamer/neon.
- UI must meet accessibility expectations for keyboard navigation, focus states, contrast, labels, and screen-reader semantics.

### NFR4 — Performance

- Avoid route/data waterfalls; start independent queries in parallel where possible.
- Heavy tables, charts, PDF previews, and visualizations must be lazy-loaded or virtualized when needed.
- Command Center first render must avoid importing every legacy module.
- Bundle and class name checks must remain green.

### NFR5 — Testing and verification

For each implementation slice, run the narrowest relevant checks first, then broader checks when risk justifies it:

```bash
bun run typecheck
bun run lint
bun run test:run
bun run build
bun run check:bundle
bun run check:classnames
```

Acceptance criteria:

- New mission logic has unit/component tests.
- Route-level behavior has integration tests where practical.
- Accessibility-critical components have keyboard/focus tests.
- Fiscal safety behavior has tests for blocked/approval states.

## Out of scope

- Backend submission flows.
- SUNAT integration changes.
- Database schema changes.
- Autonomous fiscal mutation.
- Branding/marketing site changes under `apps/landing`.
