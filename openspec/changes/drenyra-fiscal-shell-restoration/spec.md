# SDD Spec — drenyra-fiscal-shell-restoration

**Last updated:** 2026-07-12

**Change:** `drenyra-fiscal-shell-restoration`

**Phase:** spec

**Scope:** `apps/web` authenticated-shell composition only

**Review budget:** 400 changed lines

## 1. Scope and invariants

This change restores private-shell composition only. It MUST NOT introduce, query, cache, infer, mutate, or display company, RUC, fiscal-period, monthly-close, approval, agent-run, evidence-count, or search-result data. It MUST NOT change fiscal calculations, period locks, approvals, accounting mutations, SUNAT/SIRE/UBL/CDR behavior, or audit records.

The shell boundary is determined solely by `isPublicRoute(pathname)` in `apps/web/src/lib/router/public-routes.ts`. Public/auth paths beginning with `/login`, `/auth`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, or `/onboarding` are excluded. All other paths receive the private shell. `/drenyra` ceases to be a standalone shell route for this change; `isStandaloneRoute` must not be used to suppress the restored private shell.

## 2. Requirements

### Requirement: Compose exactly one private fiscal shell

For every pathname for which `isPublicRoute(pathname)` returns `false`, the root route MUST render exactly one `FiscalInspectorProvider` boundary containing exactly one `AgenticLayout`, whose content is the route `Outlet`.

The root route MUST render the `Outlet` without `FiscalInspectorProvider`, `AgenticLayout`, sidebar, command bar, or private-shell landmarks when `isPublicRoute(pathname)` returns `true`.

#### Scenario: Private monthly-close alias receives one shell

- **WHEN** an authenticated user visits `/cierre-mensual`
- **THEN** `CierreMensualPage` renders within one `AgenticLayout`
- **AND** one sidebar navigation landmark and one main workspace landmark are rendered
- **AND** no second `FiscalInspectorProvider`, sidebar, or command bar is introduced by the route.

#### Scenario: Public and authentication routes exclude private chrome

- **WHEN** a user visits each public prefix (`/login`, `/auth`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, or `/onboarding`)
- **THEN** its route outlet renders without `AgenticLayout`, `AgenticSidebar`, `AgenticCommandBar`, or `FiscalInspectorProvider` from the private boundary.

### Requirement: Preserve both monthly-close aliases

Both existing aliases are first-class private routes and MUST continue to resolve directly to `CierreMensualPage`:

- `/cierre-mensual` from `apps/web/src/routes/cierre-mensual.tsx`
- `/contabilidad/cierre-mensual` from `apps/web/src/routes/contabilidad/cierre-mensual.tsx`

Neither alias may redirect to the other, receive a route-local shell, or differ in shell landmark count.

#### Scenario: Accounting alias is compositionally equivalent

- **WHEN** an authenticated user visits `/contabilidad/cierre-mensual`
- **THEN** the same monthly-close page and exactly one private shell render
- **AND** the sidebar and command bar are present once
- **AND** shell composition matches `/cierre-mensual`.

### Requirement: De-nest `/drenyra`

`apps/web/src/routes/drenyra.tsx` MUST be an outlet/content route only. It MUST NOT lazy-load, render, or otherwise mount `AgenticLayout`.

#### Scenario: Drenyra content has no duplicate chrome

- **WHEN** an authenticated user visits `/drenyra` or a descendant route
- **THEN** root composition supplies the sole `AgenticLayout`, sidebar, command bar, and inspector-provider boundary
- **AND** the `/drenyra` route contributes only content/outlet composition
- **AND** duplicate navigation landmarks, duplicate sidebar controls, duplicate command bars, and nested inspector-provider boundaries are absent.

### Requirement: Render only route-source-verified sidebar destinations

The sidebar MUST render only the following destinations, each verified by its current route source. This is the complete permitted set for this change:

| Sidebar destination          | Verified route source                               |
| ---------------------------- | --------------------------------------------------- |
| `/inbox`                     | `apps/web/src/routes/inbox.tsx`                     |
| `/cierre-mensual`            | `apps/web/src/routes/cierre-mensual.tsx`            |
| `/firm/clients`              | `apps/web/src/routes/firm/clients.tsx`              |
| `/evidence`                  | `apps/web/src/routes/evidence.tsx`                  |
| `/review-queue`              | `apps/web/src/routes/review-queue.tsx`              |
| `/banking`                   | `apps/web/src/routes/banking.tsx`                   |
| `/tesoreria/reconciliations` | `apps/web/src/routes/tesoreria/reconciliations.tsx` |
| `/invoices`                  | `apps/web/src/routes/invoices.tsx`                  |
| `/contabilidad/ledger`       | `apps/web/src/routes/contabilidad/ledger.tsx`       |
| `/taxation`                  | `apps/web/src/routes/taxation.tsx`                  |
| `/cumplimiento/expedientes`  | `apps/web/src/routes/cumplimiento/expedientes.tsx`  |
| `/compliance`                | `apps/web/src/routes/compliance.tsx`                |
| `/financials`                | `apps/web/src/routes/financials.tsx`                |
| `/reports`                   | `apps/web/src/routes/reports.tsx`                   |
| `/audit`                     | `apps/web/src/routes/audit.tsx`                     |
| `/tools`                     | `apps/web/src/routes/tools.tsx`                     |
| `/configuracion`             | `apps/web/src/routes/configuracion.tsx`             |

The currently implemented client-side access model supplies only the public-route exclusion above; no route-specific client authorization guard was found in route source. Therefore this spec attests route existence, not authorization adequacy. A destination outside this table MUST be absent from the sidebar, not disabled and not redirected to a placeholder. No destination may be added from a presumed route, a MAP entry, or static navigation data without a corresponding route-source verification.

#### Scenario: Sidebar navigation is route-backed

- **WHEN** the expanded sidebar renders
- **THEN** every visible destination has a `to` value in the permitted-set table
- **AND** navigation selects the existing route
- **AND** no unsupported destination is visible.

#### Scenario: Primary controls remain non-mutating

- **WHEN** the user invokes “Nueva revisión fiscal” or “Buscar en Drenyra”
- **THEN** the control may navigate to the existing `/drenyra` entry point
- **AND** it MUST NOT create a review, run an agent, query cross-tenant data, or display fabricated operational state.

### Requirement: Maintain responsive, accessible shell operation

The restored shell MUST preserve a visible desktop sidebar, a collapsed intermediate-width state, and a mobile overlay drawer below `xl`. The mobile open state MUST determine actual drawer visibility; a closed drawer MUST be non-interactive and absent from the accessibility tree.

A visible mobile trigger MUST have an accessible name, `aria-expanded` synchronized with drawer state, and `aria-controls` referencing the drawer ID. The drawer MUST expose a unique ID and navigation landmark. Escape and backdrop activation MUST close the drawer. On close, focus MUST return to the trigger and any body-scroll lock applied for the drawer MUST be released. The collapsed sidebar MUST retain a keyboard-operable expand control with an accessible name; it MUST NOT leave keyboard focus in hidden content.

#### Scenario: Mobile drawer dismisses safely

- **WHEN** a keyboard or pointer user opens the mobile sidebar
- **THEN** the trigger reports `aria-expanded="true"` and controls the visible drawer
- **WHEN** Escape is pressed or the backdrop is activated
- **THEN** the drawer closes, `aria-expanded` becomes `false`, focus returns to the trigger, and scrolling/focus are not trapped.

#### Scenario: Collapsed state remains operable

- **WHEN** the sidebar is collapsed at an intermediate or desktop width
- **THEN** the expand control is keyboard reachable and has an accessible name
- **AND** hidden navigation controls cannot receive focus.

## 3. Required verification in apply

1. Add route/layout regression tests for private root composition, each monthly-close alias, and `/drenyra` de-nesting. Assert landmark/control counts rather than implementation-only component calls.
2. Add sidebar-data/navigation tests that compare all visible destinations with the permitted-set table and prove no unverified destination renders.
3. Add focused DOM tests for mobile trigger semantics, Escape dismissal, backdrop dismissal, focus restoration, and scroll-lock release. Include collapsed-state keyboard reachability.
4. Run the narrow web Vitest tests, then `bun run typecheck` and `bun run lint` from `apps/web` when the isolated worktree permits. No fiscal compliance gate is required because domain behavior is out of scope.
5. Inspect the final diff to prove no fiscal domain, API, schema, query, mutation, or placeholder operational-card changes.

## 4. Findings and risks

| Severity | Finding                                                                                                                                        | Evidence                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | The private root currently renders only `FiscalInspectorProvider` and `Outlet`, so both monthly-close aliases miss persistent shell chrome.    | `apps/web/src/routes/__root.tsx`; `apps/web/src/routes/cierre-mensual.tsx`; `apps/web/src/routes/contabilidad/cierre-mensual.tsx`                                   |
| High     | Prior `drenyra-global-shell` applied state conflicts with current root source; source and tests must be treated as authority.                  | `openspec/changes/drenyra-global-shell/state.yaml`; `apps/web/src/routes/__root.tsx`                                                                                |
| Medium   | `/drenyra` currently mounts `AgenticLayout`, so root restoration would nest the shell without de-nesting.                                      | `apps/web/src/routes/drenyra.tsx`; `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                                                          |
| Medium   | Current layout does not implement the specified mobile trigger, Escape handler, focus restoration, or explicit drawer accessibility semantics. | `apps/web/src/components/agentic-shell/AgenticLayout/AgenticLayout.tsx`; `apps/web/src/components/agentic-shell/AgenticSidebar/components/AgenticSidebarToggle.tsx` |
| Medium   | Existing root/layout artifacts are already modified outside this SDD change; apply must isolate or reconcile them before edits.                | `git status --short`                                                                                                                                                |

## 5. Non-goals

- No new operational cards, data, placeholders, or representative statuses.
- No new global data contract, API endpoint, hook, query, cache, schema, or cross-company/RUC access.
- No visual Codex clone or replacement of unrelated layouts.
- No route cleanup beyond enforcing the verified sidebar set.
